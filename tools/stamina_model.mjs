/**
 * Stamina — ITERACJA 2: kalibracja kosztów, kształt CON i scenariusze (2026-08-20).
 *
 * ⚠ **TYLKO RAPORT. Nic nie zapisuje, nic nie jest zaimplementowane.**
 *
 * ── Co to liczy i czym różni się od dwóch poprzednich przymiarów ───────────
 *   `stamina_przymiar.mjs`  — obalił hipotezę „stamina wyczerpuje się w JEDNEJ
 *                             walce" (walka trwa 0,6–3,8 s, zasób nie wiąże).
 *   `stamina_horyzont.mjs`  — policzył horyzont SERII STARĆ na poziomie walki
 *                             (jedna walka = jeden krok symulacji).
 *   TEN PLIK                — liczy pięć pytań z decyzji autora §16:
 *                             1. czy autoatak = 1 jest podatkiem od Zręczności,
 *                             2. jakie mają być koszty unik/blok/sprint/skill/
 *                                ciężki cios — w JEDNEJ walucie porównawczej,
 *                             3. czy CON ma dawać pulę, regenerację, czy koszt,
 *                             4. jak to wychodzi w sześciu scenariuszach,
 *                             5. gdzie leży równowaga (ile intensywności da się
 *                                utrzymać bez końca).
 *
 * ⚠ **Kluczowa zmiana metody względem `stamina_horyzont.mjs`: symulacja jest
 * KROKOWA (50 ms), nie per-walka.** Tamten model liczył stan zmęczenia raz na
 * walkę i przez to POKAZYWAŁ ZIELONO sytuację, w której gracz siedzi na zerze
 * przez pół wyprawy: przy stylu „aktywnym” raport pisał „Wyczerpany po: —”,
 * a stamina na końcu każdej walki wynosiła dokładnie 25/120, bo próg jest
 * ostry (`< 25`) i sprawdzany tylko na starcie walki. Zejście do zera
 * działo się W ŚRODKU walki i było niewidoczne.
 *
 * Wszystko o dzisiejszej grze czytane z `GameConfig.ts` przez esbuild oraz
 * z `public/assets/maps/forrest.tmj` (spawny). Wszystko o proponowanej
 * staminie stoi w bloku `P` i jest PROPOZYCJĄ, nie configiem.
 *
 * ⚠ Samosprawdzenia (reguła z `tools/CLAUDE.md` — asercja musi umieć zaświecić
 * na czerwono): patrz sekcja 0. Trzy asercje, każda z niezerowym kodem wyjścia.
 *
 *   node tools/stamina_model.mjs
 */

import { build } from "esbuild";
import { readFile, unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(KORZEN, "node_modules", ".stamina-model.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp, format: "esm", bundle: false, logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

const { ITEMS, PLAYER, ATTRIBUTES, EQUIPMENT, ARMOR_PROFILE, WEAPON_FAMILY,
        ABILITIES, RABBIT, BOAR, WOLF, GREY_WOLF, BEAR, SPIDER, VENOM_SPIDER, FOX, DEER } = C;

// ═══ PROPOZYCJA (przedmiot decyzji, NIE config) ════════════════════════════
// Baseline z §15 decyzji autora 2026-08-20. Liczby są punktem startowym.
const P = {
  base: 120,
  conStamina: 10,
  autoatak: 1,
  dodge: 15,
  skill: 20,
  blokZaCios: 4,
  ciezkiCios: 10,
  /** Cios jest CIĘŻKI, gdy po pancerzu zabiera tyle ułamka MAKS. HP. */
  progCiezkiegoCiosu: 0.10,
  sprintNaSek: 10,
  /** Sprint nie istnieje w grze — to propozycja mnożnika prędkości. */
  sprintMnoznik: 1.6,
  /** ⚠ Czy sprint LICZY SIĘ JAKO WYSIŁEK do opóźnienia regeneracji. To nie jest
   *  detal implementacyjny — sekcja 3.2 pokazuje, że ta jedna flaga rządzi
   *  całym modelem mocniej niż stawka kosztu sprintu. */
  sprintBlokujeRegen: true,
  /** ⚠ PROGI BEZWZGLĘDNE, nie procentowe (§4 decyzji autora). Przy progu
   *  procentowym inwestycja w CON podnosi też próg i potrafi KARAĆ. */
  progTired: 45,
  progExhausted: 25,
  /** Miękkie zejście: wolniejsze tempo, nigdy brak akcji (§2, §3). */
  karaTempaTired: 0.15,
  karaTempaExhausted: 0.35,
  regenDelaySek: 5,
  regen: 5,
  /** Cooldown uniku — dziś 6 s. Sekcja 2 liczy, ile go naprawdę potrzeba. */
  dodgeCooldown: 1.5,
  obc: { lekki: 1.0, "średni": 1.25, "ciężki": 1.5 },
};

/**
 * Kalibracja v2 — jedyna kombinacja regeneracji, która przeszła siatkę z 3.3.
 * Stoi tu, a nie w sekcji 9, bo scenariusze (sekcja 7) liczone są WŁAŚNIE nią:
 * scenariusz liczony inną regeneracją niż rekomendacja opisywałby model,
 * którego nikt nie proponuje.
 */
const V2 = { regenDelaySek: 0, regen: 4 };

const DT = 0.05;
const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);
const pad = (s, n) => String(s).padStart(n);
const padr = (s, n) => String(s).padEnd(n);
const linia = (t) => console.log("\n" + t + "\n" + "─".repeat(Math.min(78, t.length)));

// ── Model pancerza (lustro core/Protection.ts + Equipment.defenseAgainst) ──
const pktProfil = (pkt, mat, typ) => (typ ? pkt * ARMOR_PROFILE[mat][typ] : pkt);
const redukcja = (pkt) =>
  pkt <= 0 ? 0 : Math.min(pkt / (pkt + EQUIPMENT.defenseK), EQUIPMENT.maxDefenseReduction);
function zestawRedukcja(ids, typ) {
  const pkt = ids.reduce((s, id) => s + pktProfil(ITEMS[id].defense, ITEMS[id].armorType, typ), 0);
  return redukcja(pkt);
}
const SKORA = ["leather_helmet", "leather_chest", "leather_gloves", "leather_legs", "leather_boots"];
const PRZESZYW = ["padded_cap", "gambeson", "padded_gloves", "padded_chausses", "foot_wraps"];
const KOLCZ = ["mail_coif", "mail_hauberk", "mail_gloves", "mail_chausses", "mail_boots"];
const STAL = ["steel_helmet", "steel_chest", "steel_gauntlets", "steel_legs", "steel_boots"];
const LOADOUT = {
  "skóra": { ids: SKORA, klasa: "lekki" },
  "kolczuga": { ids: KOLCZ, klasa: "średni" },
  "stal + tarcza": { ids: [...STAL, "ironbound_shield"], klasa: "ciężki" },
};

// ── Model walki (lustro core/Progression.ts) ───────────────────────────────
const asb = (dex) => Math.min(dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);
function profilBroni(id, str, dex) {
  const w = ITEMS[id];
  const f = w.family ? WEAPON_FAMILY[w.family] : null;
  const zRodziny = f && "critMultiplierBonus" in f ? f.critMultiplierBonus : 0;
  const cm = PLAYER.critMultiplier + (w.melee?.critMultiplierBonus ?? 0) + zRodziny;
  const cc = Math.min(PLAYER.critChance + (w.melee?.critChanceBonus ?? 0), ATTRIBUTES.maxCritChance);
  const avg = ((w.damageMin + w.damageMax) / 2) * (1 + str * w.strScale + dex * w.dexScale);
  const naZamach = avg * (1 + cc * (cm - 1));
  const cykl = w.attackCooldown / (1 + asb(dex));
  return { nazwa: w.name, naZamach, cykl, dps: naZamach / cykl, id };
}

const BUILDY = [
  { n: "startowy (0 pkt, miecz)", id: "sword", str: 0, dex: 0, klasa: "skóra" },
  { n: "lekki (ZRĘ 10, sztylet)", id: "dagger", str: 0, dex: 10, klasa: "skóra" },
  { n: "lekki (ZRĘ 15, sztylet)", id: "dagger", str: 0, dex: 15, klasa: "skóra" },
  { n: "ciężki (SIŁ 10, młot)", id: "hammer", str: 10, dex: 0, klasa: "stal + tarcza" },
];
for (const b of BUILDY) b.profil = profilBroni(b.id, b.str, b.dex);

// ── Roster lasu z KANAŁAMI ATAKU ───────────────────────────────────────────
// Każdy kanał: co ile sekund pada cios, ile zabiera, jakiego jest typu i czy
// jest TELEGRAFOWANY (czyli czy unik jest właściwą odpowiedzią).
//
// ⚠ Świadome zawyżenie: u dzika i Szarego liczone są OBA kanały naraz, choć
// zwierzę w trakcie szarży/ukąszenia nie zadaje jednocześnie obrażeń
// kontaktowych. To jest GÓRNA GRANICA liczby ciosów do odpowiedzi — właściwa
// strona błędu przy kalibracji kosztu bloku.
// ⚠ Liczebność = spawny w `forrest.tmj` (asercja niżej). 2026-10-04: dosiew
//   po rozstawie lasu ×1,5 — 26 → 39 (zając 10, lis 5, jeleń 5, sieciarz 5,
//   skoczek 4, dzik 4); wcześniej tabela miała 5 zajęcy przy 6 na mapie.
const LAS = [
  { n: "Królik", hp: RABBIT.hp, ile: 10, kanaly: [
      { n: "kontakt", coSek: RABBIT.touchDamageCooldown, min: RABBIT.touchDamageMin, max: RABBIT.touchDamageMax, typ: RABBIT.touchDamageType, telegraf: false } ] },
  // Lis (2026-10-04): kęs tylko po zwrocie — w pościgu, którego gracz nie
  // podjął, nie zadaje nic. Model liczy go jak walkę, bo tyle kosztuje,
  // gdy już do niej dojdzie.
  { n: "Lis", hp: FOX.hp, ile: 5, kanaly: [
      { n: "kęs", coSek: FOX.bite.cooldownMs / 1000, min: FOX.touchDamageMin, max: FOX.touchDamageMax, typ: FOX.touchDamageType, telegraf: true } ] },
  // Jeleń (2026-10-04): neutralny — walczy tylko uderzony. Liczony jak walka,
  // z tego samego powodu co lis.
  { n: "Jeleń", hp: DEER.hp, ile: 5, kanaly: [
      { n: "poroże", coSek: DEER.ram.cooldownMs / 1000, min: DEER.touchDamageMin, max: DEER.touchDamageMax, typ: DEER.touchDamageType, telegraf: true } ] },
  { n: "Sieciarz", hp: SPIDER.hp, ile: 5, kanaly: [
      { n: "kontakt", coSek: SPIDER.touchDamageCooldown, min: SPIDER.touchDamageMin, max: SPIDER.touchDamageMax, typ: SPIDER.touchDamageType, telegraf: false } ] },
  { n: "Skoczek", hp: VENOM_SPIDER.hp, ile: 4, kanaly: [
      { n: "kontakt", coSek: VENOM_SPIDER.touchDamageCooldown, min: VENOM_SPIDER.touchDamageMin, max: VENOM_SPIDER.touchDamageMax, typ: VENOM_SPIDER.touchDamageType, telegraf: false } ] },
  { n: "Wilk", hp: WOLF.hp, ile: 4, kanaly: [
      { n: "wypad", coSek: WOLF.pack.lungeCooldownMs / 1000, min: WOLF.touchDamageMin, max: WOLF.touchDamageMax, typ: WOLF.touchDamageType, telegraf: true } ] },
  { n: "Dzik", hp: BOAR.hp, ile: 4, kanaly: [
      { n: "SZARŻA", coSek: BOAR.charge.cooldownMs / 1000, min: BOAR.charge.damageMin, max: BOAR.charge.damageMax, typ: BOAR.charge.damageType, telegraf: true },
      { n: "kontakt", coSek: BOAR.touchDamageCooldown, min: BOAR.touchDamageMin, max: BOAR.touchDamageMax, typ: BOAR.touchDamageType, telegraf: false } ] },
  { n: "Niedźwiedź", hp: BEAR.hp, ile: 1, kanaly: [
      { n: "kontakt", coSek: BEAR.touchDamageCooldown, min: BEAR.touchDamageMin, max: BEAR.touchDamageMax, typ: BEAR.touchDamageType, telegraf: false } ] },
  { n: "Szary (elita)", hp: GREY_WOLF.hp, ile: 1, kanaly: [
      { n: "UKĄSZENIE", coSek: GREY_WOLF.duel.cooldownMs / 1000, min: GREY_WOLF.duel.biteDamageMin, max: GREY_WOLF.duel.biteDamageMax, typ: GREY_WOLF.duel.biteDamageType, telegraf: true },
      { n: "kontakt", coSek: GREY_WOLF.touchDamageCooldown, min: GREY_WOLF.touchDamageMin, max: GREY_WOLF.touchDamageMax, typ: GREY_WOLF.touchDamageType, telegraf: false } ] },
];
const WALK = LAS.reduce((s, e) => s + e.ile, 0);

// ── Geometria mapy: ile naprawdę trwa MARSZ między walkami ─────────────────
const tmj = JSON.parse(await readFile(join(KORZEN, "public", "assets", "maps", "forrest.tmj"), "utf8"));
const KLASY_WROGOW = new Set(["rabbit", "boar", "spider", "wolf", "greywolf", "venomspider", "bear", "fox", "deer"]);
const spawny = tmj.layers.filter((l) => l.type === "objectgroup").flatMap((l) => l.objects)
  // ⚠ Tożsamość obiektu w tych mapach siedzi w `name`, nie w `type` — `type`
  // jest pustym stringiem we WSZYSTKICH obiektach `forrest.tmj`. Filtr po
  // `type` zwracał zero spawnów i cicho przechodził dalej; dlatego niżej stoi
  // asercja na liczbę spawnów.
  .filter((o) => KLASY_WROGOW.has(o.name || o.type || o.class || ""))
  .map((o) => ({ x: o.x, y: o.y, t: o.name }));
const MAPA_PX = { w: tmj.width * tmj.tilewidth, h: tmj.height * tmj.tileheight };
const dyst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Trasa zachłanna „najbliższy niezaliczony” — realna ścieżka czyszczenia mapy. */
function trasaNN(pts) {
  const zost = pts.slice();
  let cur = zost.shift(), suma = 0;
  const skoki = [];
  while (zost.length) {
    let bi = 0;
    for (let i = 1; i < zost.length; i++) if (dyst(cur, zost[i]) < dyst(cur, zost[bi])) bi = i;
    const d = dyst(cur, zost[bi]);
    suma += d; skoki.push(d); cur = zost.splice(bi, 1)[0];
  }
  return { suma, skoki };
}
const najblizszySasiad = spawny.map((a) => Math.min(...spawny.filter((b) => b !== a).map((b) => dyst(a, b))));
const mediana = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const TRASA = trasaNN(spawny);
const MARSZ_PX = TRASA.suma / (spawny.length - 1);
const MARSZ_SEK = MARSZ_PX / PLAYER.speed;

// ═══ 0. SAMOSPRAWDZENIA ════════════════════════════════════════════════════
linia("== 0. Samosprawdzenia (każde umie zaświecić na czerwono) ==");
console.log("  ⚠ Dwa różne rodzaje sprawdzeń, celowo rozdzielone:");
console.log("   • SAMOSPRAWDZENIE — czy ten plik liczy to samo, co kod gry. Rozjazd = BŁĄD");
console.log("     i przerwany przebieg, bo dalsze liczby byłyby fikcją.");
console.log("   • TEST PROJEKTOWY — czy PROPOZYCJA z bloku `P` spełnia założenie projektowe.");
console.log("     Nie przerywa przebiegu (przymiar ma pokazać złe liczby, nie odmówić ich");
console.log("     policzenia), ale zbiera się na końcu raportu.\n");
let bledy = 0;
const testy = [];

// (a) Model pancerza kontra liczby zapisane w docs/ekwipunek_przedmioty.md.
const OCZEK = { "skóra": [38.3, 38.3, 21.8, 33.2], "kolczuga": [50.5, 64.7, 41.7, 26.3] };
for (const [nazwa, oczek] of Object.entries(OCZEK)) {
  const got = [undefined, "slash", "pierce", "blunt"].map((t) => 100 * zestawRedukcja(LOADOUT[nazwa].ids, t));
  const ok = got.every((g, i) => Math.abs(g - oczek[i]) < 0.15);
  if (!ok) bledy++;
  console.log(`  ${ok ? "OK  " : "BŁĄD"} pancerz ${padr(nazwa, 14)} ${got.map((g) => pad(f1(g) + "%", 8)).join("")}`);
}

// (b) Liczba spawnów wroga na mapie musi się zgadzać z rosterem w tym pliku.
{
  const ok = spawny.length === WALK;
  if (!ok) bledy++;
  console.log(`  ${ok ? "OK  " : "BŁĄD"} spawnów wroga w forrest.tmj: ${spawny.length} (roster w tym pliku: ${WALK})`);
}

// (c) Silnik krokowy nie może dryfować od wzoru zamkniętego: walka bez
//     zmęczenia musi trwać dokładnie `ceil(hp / obr.) × cykl`.
//     (asercja wykonywana po zdefiniowaniu symulatora — patrz niżej)

// ═══ 1. AUTOATAK = 1 — KTO TO NAPRAWDĘ PŁACI ═══════════════════════════════
linia("== 1. Autoatak = 1: czy to podatek od Zręczności (pytanie §16.1) ==");
console.log("  Trzy metryki, bo każda mówi co innego:");
console.log("   • stamina/s   — ile pasek schodzi przy podtrzymywanym autoataku;");
console.log("   • na 100 obr. — ile kosztuje ZADANIE tych samych obrażeń (to jest");
console.log("     właściwa metryka: cel ma tyle samo HP niezależnie od buildu);");
console.log("   • przejście   — koszt wszystkich 19 walk samym autoatakiem.\n");
console.log("  build                        obr./zamach   cykl     stamina/s   na 100 obr.   przejście");
const HP_LASU = LAS.reduce((s, e) => s + e.hp * e.ile, 0);
for (const b of BUILDY) {
  const p = b.profil;
  const zamachow = LAS.reduce((s, e) => s + Math.ceil(e.hp / p.naZamach) * e.ile, 0);
  b.zamachowNaPrzejscie = zamachow;
  const na100 = 100 / p.naZamach * P.autoatak;
  b.na100 = na100;
  b.staminaNaSek = P.autoatak / p.cykl;
  console.log("  " + padr(b.n, 28) + pad(f1(p.naZamach), 11) + pad(Math.round(p.cykl * 1000) + " ms", 9) +
    pad(f2(b.staminaNaSek), 12) + pad(f1(na100), 14) + pad(zamachow, 12));
}
{
  const na100 = BUILDY.map((b) => b.na100);
  const naSek = BUILDY.map((b) => b.staminaNaSek);
  console.log(`\n  Rozstrzał „na 100 obrażeń”: ×${f2(Math.max(...na100) / Math.min(...na100))}` +
    `   ·   rozstrzał „stamina/s”: ×${f2(Math.max(...naSek) / Math.min(...naSek))}`);
  console.log("  ⚠ Ten pierwszy jest ważniejszy i pokazuje coś, czego szukaliśmy gdzie indziej:");
  console.log("    płaski koszt za zamach jest podatkiem NIE od Zręczności, tylko od SŁABOŚCI.");
  console.log("    Płaci go najmocniej postać startowa, która ma najmniej obrażeń na zamach.");
}

console.log("\n  Trzy modele kosztu autoataku — ten sam wydatek na przejście lasu:\n");
console.log("  model                                startowy   ZRĘ 10   ZRĘ 15   SIŁ 10   rozstrzał");
const MODELE_AUTO = [
  { n: "A. 1 za zamach (baseline §15)", f: (b) => b.zamachowNaPrzejscie * 1 },
  { n: "B. 2/s zegara (koszt za CZAS)", f: (b) => b.zamachowNaPrzejscie * b.profil.cykl * 2 },
  { n: "C. proporcjonalny do cyklu broni", f: (b) => b.zamachowNaPrzejscie * (b.profil.cykl / 0.5) },
];
for (const m of MODELE_AUTO) {
  const v = BUILDY.map((b) => m.f(b));
  console.log("  " + padr(m.n, 36) + v.map((x) => pad(Math.round(x), 9)).join("") +
    pad("×" + f2(Math.max(...v) / Math.min(...v)), 12));
}
console.log("\n  ⚠ Model B i C są prawie tożsame (cykl × stawka) i oba KASUJĄ podatek od tempa,");
console.log("    ale nie kasują podatku od słabości — postać startowa nadal bije dłużej,");
console.log("    więc płaci dłużej. Zerowy rozstrzał nie istnieje w żadnym modelu, w którym");
console.log("    wysiłek zależy od czasu spędzonego w walce. To jest cecha, nie usterka:");
console.log("    słabszy wojownik MĘCZY SIĘ bardziej tym samym zabijaniem.");

// ═══ 2. KOSZTY W JEDNEJ WALUCIE ════════════════════════════════════════════
linia("== 2. Kalibracja kosztów: unik / blok / skill / sprint / ciężki cios (§16.2) ==");
console.log("  Wspólna waluta: ile SEKUND regeneracji trzeba, żeby to odrobić, i ile");
console.log(`  takich akcji mieści się w puli (regen ${P.regen}/s po ${P.regenDelaySek} s bez wysiłku).\n`);
console.log("  akcja                koszt   sek. regen. §15   sek. regen. v2   % puli CON 0   % puli CON 10   ile w puli");
const AKCJE = [
  { n: "autoatak (1 zamach)", k: P.autoatak },
  { n: "blok (1 cios)", k: P.blokZaCios },
  { n: "ciężki cios przyjęty", k: P.ciezkiCios },
  { n: "unik (lekki)", k: P.dodge * P.obc["lekki"] },
  { n: "unik (ciężki)", k: P.dodge * P.obc["ciężki"] },
  { n: "umiejętność", k: P.skill },
  { n: "sprint 1 s (lekki)", k: P.sprintNaSek },
  { n: "sprint 1 s (ciężki)", k: P.sprintNaSek * P.obc["ciężki"] },
];
for (const a of AKCJE) {
  console.log("  " + padr(a.n, 22) + pad(f1(a.k), 5) + pad(f1(a.k / P.regen) + " s", 17) +
    pad(f1(a.k / V2.regen) + " s", 17) +
    pad(Math.round(100 * a.k / P.base) + "%", 15) + pad(Math.round(100 * a.k / (P.base + 10 * P.conStamina)) + "%", 16) +
    pad(Math.floor(P.base / a.k), 12));
}

console.log("\n  ── 2.1 Unik jako ŚRODEK TRANSPORTU (test, który musi przejść) ──");
console.log("  Przewrót niesie " + ABILITIES.dodge.dashPx + " px w " + ABILITIES.dodge.durationMs + " ms.");
console.log("  Chodzenie daje " + PLAYER.speed + " px/s za darmo, więc liczy się TYLKO NADWYŻKA nad marszem.\n");
const zyskUniku = ABILITIES.dodge.dashPx - PLAYER.speed * (ABILITIES.dodge.durationMs / 1000);
const zyskSprintu = PLAYER.speed * P.sprintMnoznik - PLAYER.speed;
const pxNaStamineUnik = zyskUniku / (P.dodge * P.obc["lekki"]);
const pxNaStamineSprint = zyskSprintu / P.sprintNaSek;
console.log(`  unik:   +${Math.round(zyskUniku)} px ponad marsz za ${P.dodge} staminy  →  ${f1(pxNaStamineUnik)} px na punkt`);
console.log(`  sprint: +${Math.round(zyskSprintu)} px/s ponad marsz za ${P.sprintNaSek}/s  →  ${f1(pxNaStamineSprint)} px na punkt`);
{
  const ok = pxNaStamineSprint > pxNaStamineUnik * 1.5;
  testy.push({ n: "sprint ×1,5 lepszy w podróży niż spam przewrotu", ok,
    detal: `jest ×${f2(pxNaStamineSprint / pxNaStamineUnik)}` });
  console.log(`  ${ok ? "  ZDANY" : "NIEZDANY"} sprint musi być wyraźnie (×1,5) lepszy w podróży niż spam przewrotu` +
    `  — jest ×${f2(pxNaStamineSprint / pxNaStamineUnik)}`);
  if (!ok) console.log("       ⚠ Przy tym stosunku podróż TOCZENIEM SIĘ jest realną opcją i trzyma ją\n" +
    "         wyłącznie cooldown uniku. Sam koszt staminy jej nie zabija.");
}
console.log("\n  Ile cooldownu potrzeba, żeby przewrót nie był podróżą (niezależnie od kosztu):");
console.log("  cooldown   zysk na sekundę   marsz+przewroty vs sam marsz");
for (const cd of [0.2, 0.5, 1.0, 1.5, 3.0, 6.0]) {
  const zyskNaSek = zyskUniku / cd;
  console.log("  " + pad(f1(cd) + " s", 8) + pad("+" + Math.round(zyskNaSek) + " px/s", 18) +
    pad("×" + f2((PLAYER.speed + zyskNaSek) / PLAYER.speed), 20) +
    (cd >= 1.5 ? "   ← poniżej progu odczuwalności" : ""));
}
console.log(`  ⚠ Dzisiejsze ${ABILITIES.dodge.cooldown} s to ×${f2((PLAYER.speed + zyskUniku / ABILITIES.dodge.cooldown) / PLAYER.speed)} — czyli cooldown 1,5 s WYSTARCZY,`);
console.log("    żeby zabić toczenie się jako podróż. Sześciu sekund pilnuje coś innego (spam w panice).");

console.log("\n  ── 2.2 Blok: ile ciosów naprawdę pada w jednej walce ──");
console.log("  (build lekki; górna granica — patrz komentarz przy rosterze)\n");
console.log("  przeciwnik        walka    ciosów telegraf.   ciosów zwykłych   koszt bloku wszystkiego");
let ciosowTelPrzejscie = 0, ciosowZwyPrzejscie = 0;
for (const e of LAS) {
  const p = BUILDY[1].profil;
  const czas = Math.ceil(e.hp / p.naZamach) * p.cykl;
  const tel = e.kanaly.filter((k) => k.telegraf).reduce((s, k) => s + Math.floor(czas / k.coSek), 0);
  const zwy = e.kanaly.filter((k) => !k.telegraf).reduce((s, k) => s + Math.floor(czas / k.coSek), 0);
  ciosowTelPrzejscie += tel * e.ile; ciosowZwyPrzejscie += zwy * e.ile;
  console.log("  " + padr(e.n, 17) + pad(f1(czas) + "s", 7) + pad(tel, 19) + pad(zwy, 18) +
    pad(((tel + zwy) * P.blokZaCios) + " staminy", 24));
}
console.log(`\n  CAŁE PRZEJŚCIE: ${ciosowTelPrzejscie} ciosów telegrafowanych + ${ciosowZwyPrzejscie} zwykłych`);
console.log(`  Blokowanie WSZYSTKIEGO przez całe przejście: ${(ciosowTelPrzejscie + ciosowZwyPrzejscie) * P.blokZaCios} staminy` +
  `  (${f1((ciosowTelPrzejscie + ciosowZwyPrzejscie) * P.blokZaCios / P.base)} × pula CON 0)`);
console.log(`  Unikanie wszystkich telegrafów:                ${ciosowTelPrzejscie * P.dodge} staminy` +
  `  (${f1(ciosowTelPrzejscie * P.dodge / P.base)} × pula CON 0)`);

console.log("\n  ── 2.3 Ciężki cios: który cios w grze W OGÓLE się kwalifikuje ──");
console.log(`  Próg: cios zabierający po pancerzu ≥ ${Math.round(P.progCiezkiegoCiosu * 100)}% MAKS. HP.\n`);
console.log("  cios                      surowo   po skórze   % HP (VIT 0)   po stali+tarczy   % HP   ciężki?");
const HP0 = PLAYER.hp;
const WSZYSTKIE_CIOSY = LAS.flatMap((e) => e.kanaly.map((k) => ({ ...k, wrog: e.n })));
for (const c of WSZYSTKIE_CIOSY) {
  const avg = (c.min + c.max) / 2;
  const poSk = avg * (1 - zestawRedukcja(LOADOUT["skóra"].ids, c.typ ?? undefined));
  const poSt = avg * (1 - zestawRedukcja(LOADOUT["stal + tarcza"].ids, c.typ ?? undefined));
  const ciezkiSk = poSk / HP0 >= P.progCiezkiegoCiosu;
  const ciezkiSt = poSt / HP0 >= P.progCiezkiegoCiosu;
  console.log("  " + padr(`${c.wrog} — ${c.n}`, 25) + pad(f1(avg), 7) + pad(f1(poSk), 12) +
    pad(Math.round(100 * poSk / HP0) + "%", 15) + pad(f1(poSt), 18) + pad(Math.round(100 * poSt / HP0) + "%", 7) +
    pad(ciezkiSk ? (ciezkiSt ? "TAK" : "tylko w skórze") : "nie", 18));
}
console.log("\n  ⚠ Wynik, którego nie zakładaliśmy: próg 10% maks. HP wybiera DOKŁADNIE ciosy");
console.log("    telegrafowane (SZARŻA dzika, UKĄSZENIE Szarego) i nic poza nimi. Czyli reguła");
console.log("    „ciężki cios kosztuje staminę” jest w praktyce regułą „NIEODPOWIEDZENIE");
console.log("    na telegraf kosztuje staminę” — a to jest dokładnie ta treść, którą chcieliśmy.");
console.log("    Drobne draśnięcia nie drenują paska, bo żadne nie sięga progu.");
console.log("\n  ⚠ Koszt uboczny: próg liczony od MAKS. HP oznacza, że VIT po cichu zmniejsza");
console.log("    wydatki staminy (ten sam cios przestaje być ciężki). Sprawdzenie:");
console.log("  VIT   maks. HP   próg (pkt)   SZARŻA po skórze ciężka?   UKĄSZENIE po stali ciężkie?");
for (const vit of [0, 5, 10, 15]) {
  const hp = PLAYER.hp + vit * ATTRIBUTES.hpPerEndurance;
  const prog = hp * P.progCiezkiegoCiosu;
  const sz = (BOAR.charge.damageMin + BOAR.charge.damageMax) / 2 * (1 - zestawRedukcja(LOADOUT["skóra"].ids, BOAR.charge.damageType));
  const uk = (GREY_WOLF.duel.biteDamageMin + GREY_WOLF.duel.biteDamageMax) / 2 * (1 - zestawRedukcja(LOADOUT["stal + tarcza"].ids, GREY_WOLF.duel.biteDamageType));
  console.log("  " + pad(vit, 3) + pad(hp, 10) + pad(f1(prog), 13) + pad(sz >= prog ? "TAK" : "nie", 27) + pad(uk >= prog ? "TAK" : "nie", 30));
}

// ═══ SYMULATOR KROKOWY ═════════════════════════════════════════════════════
const MODELE_CON = {
  "M1 pula": (con) => ({ pula: P.base + 10 * con, regen: P.regen, mnoznik: 1,
    opis: "120 + 10×CON, regen stały 5/s" }),
  "M2 pula+regen": (con) => ({ pula: P.base + 6 * con, regen: 4 + 0.3 * con, mnoznik: 1,
    opis: "120 + 6×CON, regen 4 + 0,3×CON" }),
  "M3 pula+efektywność": (con) => ({ pula: P.base + 10 * con, regen: P.regen, mnoznik: 1 / (1 + 0.03 * con),
    opis: "120 + 10×CON, koszty ×1/(1+0,03×CON)" }),
};

const STYLE = [
  { n: "A. spokojny",   unikTel: 0.0, blokZwy: 0.0, skillNaWalke: 0, sprintFrakcja: 0.0 },
  { n: "B. ostrożny",   unikTel: 1.0, blokZwy: 0.0, skillNaWalke: 0, sprintFrakcja: 0.0 },
  { n: "C. aktywny",    unikTel: 1.0, blokZwy: 0.5, skillNaWalke: 1, sprintFrakcja: 0.0 },
  { n: "D. intensywny", unikTel: 1.0, blokZwy: 1.0, skillNaWalke: 1, sprintFrakcja: 0.5 },
];

/**
 * Krokowa symulacja przejścia lasu.
 * Zwraca m.in. udział czasu w każdym stanie — to jest ta liczba, której model
 * per-walka nie potrafił zobaczyć.
 */
function przebieg({ styl, con, model, build, marszSek = MARSZ_SEK, walki = null }) {
  const M = MODELE_CON[model](con);
  const mObc = P.obc[LOADOUT[build.klasa].klasa];
  const profil = build.profil;
  const maxHp = PLAYER.hp;
  const redSk = {};
  const red = (typ) => (redSk[typ ?? "-"] ??= zestawRedukcja(LOADOUT[build.klasa].ids, typ ?? undefined));

  let s = M.pula, t = 0, ostatniWysilek = -999;
  const stan = { normal: 0, tired: 0, wycz: 0 };
  const licz = { zamach: 0, unik: 0, unikOdmowa: 0, blok: 0, skill: 0, ciezki: 0, sprintSek: 0 };
  let minS = M.pula, pierwszyTired = null, pierwszyWycz = null, sekEkstra = 0, nastepnyUnik = -999;

  const wydaj = (k, liczyJakoWysilek = true) => {
    s = Math.max(0, s - k * M.mnoznik);
    if (liczyJakoWysilek) ostatniWysilek = t;
  };
  const tyk = (ile) => {
    let left = ile;
    while (left > 1e-9) {
      const dt = Math.min(DT, left);
      if (t - ostatniWysilek >= P.regenDelaySek) s = Math.min(M.pula, s + M.regen * dt);
      stan[s < P.progExhausted ? "wycz" : s < P.progTired ? "tired" : "normal"] += dt;
      if (s < minS) minS = s;
      t += dt; left -= dt;
    }
  };

  const kolejnosc = [];
  for (const e of LAS) for (let i = 0; i < e.ile; i++) kolejnosc.push(e);
  kolejnosc.sort((a, b) => a.hp - b.hp);
  const lista = walki ?? kolejnosc;

  lista.forEach((e, idx) => {
    let hp = e.hp, tw = 0, akUnik = 0, akBlok = 0, skilliZostalo = styl.skillNaWalke;
    const nast = e.kanaly.map((k) => k.coSek);

    const atak = (k) => {
      if (k.telegraf) {
        akUnik += styl.unikTel;
        if (akUnik >= 1 - 1e-9) {
          akUnik -= 1;
          if (t >= nastepnyUnik) { wydaj(P.dodge * mObc); licz.unik++; nastepnyUnik = t + P.dodgeCooldown; return; }
          licz.unikOdmowa++;
        }
      } else {
        akBlok += styl.blokZwy;
        if (akBlok >= 1 - 1e-9) { akBlok -= 1; wydaj(P.blokZaCios); licz.blok++; return; }
      }
      // cios wchodzi
      const po = (k.min + k.max) / 2 * (1 - red(k.typ));
      if (po >= P.progCiezkiegoCiosu * maxHp) { wydaj(P.ciezkiCios); licz.ciezki++; }
    };

    while (hp > 0) {
      if (skilliZostalo > 0) { skilliZostalo--; wydaj(P.skill); licz.skill++; hp -= profil.naZamach; if (hp <= 0) break; }
      const kara = s < P.progExhausted ? P.karaTempaExhausted : s < P.progTired ? P.karaTempaTired : 0;
      const cykl = profil.cykl / (1 - kara);
      sekEkstra += cykl - profil.cykl;
      let left = cykl;
      while (left > 1e-9) {
        const doAtaku = Math.min(...nast.map((x) => x - tw));
        const krok = Math.min(left, Math.max(doAtaku, 1e-9));
        tyk(krok); tw += krok; left -= krok;
        for (let i = 0; i < nast.length; i++) if (nast[i] - tw <= 1e-9) { atak(e.kanaly[i]); nast[i] += e.kanaly[i].coSek; }
      }
      hp -= profil.naZamach; licz.zamach++; wydaj(P.autoatak);
      if (pierwszyTired === null && s < P.progTired) pierwszyTired = idx + 1;
      if (pierwszyWycz === null && s < P.progExhausted) pierwszyWycz = idx + 1;
    }

    // marsz do następnej walki
    if (idx < lista.length - 1) {
      const px = marszSek * PLAYER.speed;
      const pxSpr = px * styl.sprintFrakcja;
      let czasSpr = pxSpr / (PLAYER.speed * P.sprintMnoznik);
      licz.sprintSek += czasSpr;
      while (czasSpr > 1e-9) {
        const dt = Math.min(DT, czasSpr);
        wydaj(P.sprintNaSek * mObc * dt, P.sprintBlokujeRegen);
        tyk(dt); czasSpr -= dt;
      }
      tyk((px - pxSpr) / PLAYER.speed);
    }
  });

  const czas = stan.normal + stan.tired + stan.wycz;
  return { s: Math.round(s), pula: M.pula, regen: M.regen, mnoznik: M.mnoznik, czas, stan, licz,
           minS: Math.round(minS), pierwszyTired, pierwszyWycz, sekEkstra,
           pctNorm: 100 * stan.normal / czas, pctTired: 100 * stan.tired / czas, pctWycz: 100 * stan.wycz / czas };
}

// (c) i (d) — asercje odłożone z sekcji 0, bo wymagają symulatora.
//
// ⚠ Asercja (c) NIE MOŻE porównywać symulacji z `profilBroni`, bo symulacja
// z `profilBroni` korzysta — to byłby wzór porównany sam ze sobą, czyli
// dokładnie ta „dekoracja”, przed którą ostrzega `tools/CLAUDE.md`. Sprawdzone:
// przy takim kształcie asercji celowe przeskalowanie cyklu o 20% zostawiało
// raport ZIELONY. Dlatego oczekiwana wartość jest odtwarzana z `ITEMS` i
// `ATTRIBUTES` niezależną ścieżką.
{
  const b = BUILDY[1];
  const w = ITEMS[b.id];
  const cyklNiezalezny = w.attackCooldown / (1 + Math.min(b.dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus));
  const cc = Math.min(PLAYER.critChance + (w.melee?.critChanceBonus ?? 0), ATTRIBUTES.maxCritChance);
  const fam = w.family ? WEAPON_FAMILY[w.family] : null;
  const cm = PLAYER.critMultiplier + (w.melee?.critMultiplierBonus ?? 0) + (fam && "critMultiplierBonus" in fam ? fam.critMultiplierBonus : 0);
  const naZamachNiezalezny = (w.damageMin + w.damageMax) / 2 * (1 + b.str * w.strScale + b.dex * w.dexScale) * (1 + cc * (cm - 1));

  const bezWysilku = { n: "test", unikTel: 0, blokZwy: 0, skillNaWalke: 0, sprintFrakcja: 0 };
  const jedna = [{ n: "test", hp: 100, ile: 1, kanaly: [{ n: "-", coSek: 999, min: 0, max: 0, typ: null, telegraf: false }] }];
  const r = przebieg({ styl: bezWysilku, con: 0, model: "M1 pula", build: b, walki: jedna });
  const oczek = Math.ceil(100 / naZamachNiezalezny) * cyklNiezalezny;
  const ok = Math.abs(r.czas - oczek) < DT * 1.5;
  if (!ok) bledy++;
  console.log(`  ${ok ? "OK  " : "BŁĄD"} silnik krokowy vs wzór odtworzony z ITEMS: ${f2(r.czas)} s (oczekiwane ${f2(oczek)} s)`);

  // (d) Księgowość stanów: suma kubełków musi się równać zegarowi symulacji.
  const suma = r.stan.normal + r.stan.tired + r.stan.wycz;
  const ok2 = Math.abs(suma - r.czas) < 1e-6;
  if (!ok2) bledy++;
  console.log(`  ${ok2 ? "OK  " : "BŁĄD"} księgowość stanów: ${f2(suma)} s w kubełkach vs ${f2(r.czas)} s zegara`);
}
if (bledy) { console.error(`\n⚠ ${bledy} samosprawdzeń na czerwono — model odbiegł od kodu gry. Przerywam.`); process.exit(1); }

// ═══ 3. MARSZ — LICZBA, KTÓREJ NIE MAMY W CONFIGU ══════════════════════════
linia("== 3. Ile trwa marsz między walkami (to jest największa dźwignia całego modelu) ==");
console.log(`  Mapa lasu: ${tmj.width}×${tmj.height} kafli = ${MAPA_PX.w}×${MAPA_PX.h} px.  Spawnów wroga: ${spawny.length}.`);
console.log(`  Mediana odległości do najbliższego sąsiada: ${Math.round(mediana(najblizszySasiad))} px` +
  `  (${f1(mediana(najblizszySasiad) / PLAYER.speed)} s marszu)`);
console.log(`  Trasa zachłanna przez wszystkie spawny: ${Math.round(TRASA.suma)} px` +
  `  →  średnio ${Math.round(MARSZ_PX)} px = ${f1(MARSZ_SEK)} s między walkami\n`);
console.log("  ⚠ To jest liczba PODŁOGOWA: tak wygląda przejście gracza, który idzie prosto");
console.log("    od potwora do potwora i nic po drodze nie robi. Zbieranie ziół, łup, droga");
console.log(`    powrotna do sklepu — każde z tych zachowań wydłuża marsz, a regeneracja rusza`);
console.log(`    dopiero po ${P.regenDelaySek} s bez wysiłku. Dlatego wszystko niżej jest liczone`);
console.log("    dla TRZECH długości marszu, a nie dla jednej.\n");
console.log("  marsz między walkami   sekund regeneracji   odzysk na walkę (regen 5/s)");
for (const m of [MARSZ_SEK, 10, 20]) {
  console.log("  " + pad(f1(m) + " s", 18) + pad(f1(Math.max(0, m - P.regenDelaySek)) + " s", 20) +
    pad(Math.round(Math.max(0, m - P.regenDelaySek) * P.regen) + " staminy", 30) +
    (m === MARSZ_SEK ? "   ← z mapy" : ""));
}
console.log("\n  ⚠⚠ NAJWAŻNIEJSZY WYNIK TEJ ITERACJI: przy marszu z mapy regeneracja");
console.log(`     NIE RUSZA ANI RAZU przez całe przejście, bo opóźnienie (${P.regenDelaySek} s) jest`);
console.log(`     DŁUŻSZE niż odstęp między walkami (${f1(MARSZ_SEK)} s). Zasób ma wtedy tylko`);
console.log("     jedną fazę: schodzenie. Regeneracja włącza się wyłącznie wtedy, gdy gracz");
console.log("     ŚWIADOMIE STANIE — a to jest zupełnie inna gra niż ta, którą opisywał §15.");

console.log("\n  ── 3.1 Opóźnienie regeneracji jest w tym modelu ważniejsze niż jej TEMPO ──");
console.log("  Styl C (aktywny), build lekki, CON 0, marsz z mapy. Zmieniamy JEDNĄ liczbę:\n");
console.log("  opóźnienie   regen   %Normalny   %Zmęczony   %Wyczerpany   min   stamina na końcu");
for (const [delay, regen] of [[5, 5], [3, 5], [2, 5], [1, 5], [0, 5], [5, 10], [5, 15], [0, 3]]) {
  const zapisz = [P.regenDelaySek, P.regen];
  P.regenDelaySek = delay; P.regen = regen;
  const r = przebieg({ styl: STYLE[2], con: 0, model: "M1 pula", build: BUILDY[1], marszSek: MARSZ_SEK });
  [P.regenDelaySek, P.regen] = zapisz;
  console.log("  " + pad(delay + " s", 9) + pad(regen + "/s", 8) + pad(Math.round(r.pctNorm) + "%", 12) +
    pad(Math.round(r.pctTired) + "%", 12) + pad(Math.round(r.pctWycz) + "%", 14) + pad(r.minS, 6) +
    pad(`${r.s}/${r.pula}`, 18) + (delay === 5 && regen === 5 ? "   ← baseline §15" : ""));
}
console.log("\n  ⚠ Wiersz „0 s” znaczy dosłownie tyle, że regeneracja NIE WYŁĄCZA SIĘ NIGDY —");
console.log("    także w trakcie walki, między zamachami. Dlatego wypada tak inaczej: to nie");
console.log("    jest skrócone opóźnienie, tylko inny model zasobu (ciągły przepływ zamiast");
console.log("    zbiornika). Porównaj dwa ostatnie wiersze: przy ciągłym przepływie liczy się");
console.log("    już samo TEMPO (5/s wystarcza, 3/s nie).");
console.log("\n  ⚠ Odczyt: potrojenie TEMPA (5 → 15/s) przy opóźnieniu 5 s zmienia mniej niż");
console.log("    zejście z opóźnieniem do zera przy tempie trzykrotnie niższym. Dopóki");
console.log("    opóźnienie przekracza odstęp między walkami, tempo regeneracji jest liczbą");
console.log("    MARTWĄ — i to jest odpowiedź na pytanie, dlaczego CON „przez regenerację”");
console.log("    w sekcji 6 potrafi nie robić nic.");

console.log("\n  ── 3.2 Sprint nie jest kosztem ciągłym, tylko WYŁĄCZNIKIEM REGENERACJI ──");
console.log("  Styl D biegnie połowę każdego marszu. Poniżej ten sam styl przy różnych");
console.log("  stawkach sprintu i przy obu odpowiedziach na pytanie „czy sprint to wysiłek”.\n");
console.log("  stawka sprintu   sprint blokuje regen?   %Normalny   %Wyczerpany   stamina na końcu");
for (const blokuje of [true, false]) {
  for (const stawka of [0, 2, 5, 10]) {
    const zapisz = [P.sprintNaSek, P.sprintBlokujeRegen, P.regenDelaySek];
    P.sprintNaSek = stawka; P.sprintBlokujeRegen = blokuje; P.regenDelaySek = 1;
    const r = przebieg({ styl: STYLE[3], con: 0, model: "M1 pula", build: BUILDY[1], marszSek: MARSZ_SEK });
    [P.sprintNaSek, P.sprintBlokujeRegen, P.regenDelaySek] = zapisz;
    console.log("  " + pad(stawka + "/s", 10) + pad(blokuje ? "TAK" : "nie", 22) +
      pad(Math.round(r.pctNorm) + "%", 14) + pad(Math.round(r.pctWycz) + "%", 14) + pad(`${r.s}/${r.pula}`, 18));
  }
}
console.log("\n  ⚠ Odczyt: przy „sprint = wysiłek” nawet stawka ZERO zostawia gracza wyczerpanym,");
console.log("    bo sam fakt sprintu kasuje okno regeneracji. Czyli decyzja „czy sprint");
console.log("    wstrzymuje regenerację” jest w tym modelu WAŻNIEJSZA niż jego cena — a to");
console.log("    jest dokładnie ten rodzaj rozstrzygnięcia, który łatwo przeoczyć, bo w §15");
console.log("    zapisany jest tylko „sprint — koszt ciągły”.");
console.log("  ⚠ To samo dotyczy każdej przyszłej czynności ciągłej (trzymanie tarczy,");
console.log("    długotrwały wysiłek z §10 decyzji): kosztem NIE jest jej stawka, tylko to,");
console.log("    że przez cały czas trwania nie ma regeneracji.");

console.log("\n  ── 3.3 HORYZONT, nie równowaga — i to jest sedno całej iteracji ──");
console.log("  Zasób o stałym drenażu i stałej regeneracji NIE MA stanu pośredniego: albo");
console.log("  regeneracja pokrywa drenaż i pasek stoi pełny, albo nie pokrywa i pasek stoi");
console.log("  na zerze. Widać to w tabeli 3.1 gołym okiem — styl C przechodzi z 84% czasu");
console.log("  Wyczerpany na 3% między regeneracją 5/s a 10/s. Nie ma tam „trochę zmęczony”.");
console.log("");
console.log("  ⚠ Jedyne, co tworzy stan pośredni, to CZAS OPRÓŻNIANIA BUFORA — czyli");
console.log("    HORYZONT: pula ÷ deficyt na walkę. I to jest dokładnie ta wielkość, którą");
console.log("    §1 decyzji nazywa „zdolnością do utrzymywania wysiłku”. Wniosek odwraca");
console.log("    intuicję z sekcji 4: w grze, w której wyprawa KOŃCZY SIĘ przed osiągnięciem");
console.log("    równowagi, to PULA jest mechaniką, a regeneracja tylko ustawia deficyt.");
console.log("    To jest argument ZA kształtem CON z §15 (pula 120 + 10×CON) i przeciwko");
console.log("    przenoszeniu CON-u na regenerację.");
console.log("");
console.log("  Dlatego kryterium poniżej pyta NIE o procent czasu, tylko o to, PRZY KTÓREJ");
console.log("  WALCE przejścia gracz przekracza próg:");
console.log("   • A. spokojny   — nigdy nie wychodzi ze stanu Normalny,");
console.log("   • B. ostrożny   — robi się Zmęczony, ale nigdy Wyczerpany,");
console.log("   • C. aktywny    — Wyczerpany dopiero w ostatniej trzeciej (walka ≥ 13),");
console.log("   • D. intensywny — Wyczerpany w środku przejścia (walka 5–12).");
console.log(`  Marsz z mapy (${f1(MARSZ_SEK)} s), build lekki, CON 0, koszty z §15, ${WALK} walk.\n`);
console.log("  ⚠ Przeszukiwane są TRZY liczby, nie dwie — dołączona jest flaga z 3.2,");
console.log("    bo bez niej styl D jest wyczerpany zawsze i siatka nic nie rozstrzyga.\n");
console.log("  opóźn.  regen  sprint blok.   A: Zmęcz.od   B: Wycz.od   C: Wycz.od   D: Wycz.od   werdykt");
const SIATKA = [];
for (const blok of [true, false]) {
  for (const delay of [0, 0.5, 1, 1.5, 2, 3, 5]) {
    for (const regen of [3, 4, 5, 6, 8, 10, 12, 15, 20]) SIATKA.push([delay, regen, blok]);
  }
}
const oceny = SIATKA.map(([delay, regen, blok]) => {
  const zapisz = [P.regenDelaySek, P.regen, P.sprintBlokujeRegen];
  P.regenDelaySek = delay; P.regen = regen; P.sprintBlokujeRegen = blok;
  const r = STYLE.map((st) => przebieg({ styl: st, con: 0, model: "M1 pula", build: BUILDY[1], marszSek: MARSZ_SEK }));
  [P.regenDelaySek, P.regen, P.sprintBlokujeRegen] = zapisz;
  const ok = r[0].pierwszyTired === null &&
             r[1].pierwszyTired !== null && r[1].pierwszyWycz === null &&
             r[2].pierwszyWycz !== null && r[2].pierwszyWycz >= 13 &&
             r[3].pierwszyWycz !== null && r[3].pierwszyWycz >= 5 && r[3].pierwszyWycz <= 12;
  return { delay, regen, blok, r, ok };
});
const zdane = oceny.filter((o) => o.ok);
for (const o of oceny) {
  const ciekawy = o.ok || (o.regen === 5 && [0, 1, 5].includes(o.delay)) || (o.delay === 1 && [10, 20].includes(o.regen));
  if (!ciekawy) continue;
  const kol = (x) => pad(x ?? "—", 13);
  console.log("  " + pad(f1(o.delay), 5) + pad(o.regen + "/s", 7) + pad(o.blok ? "TAK" : "nie", 13) +
    kol(o.r[0].pierwszyTired) + kol(o.r[1].pierwszyWycz) + kol(o.r[2].pierwszyWycz) + kol(o.r[3].pierwszyWycz) +
    "   " + (o.ok ? "← SPEŁNIA WSZYSTKIE CZTERY" : ""));
}
console.log(`\n  Kombinacji spełniających wszystkie cztery kryteria: ${zdane.length} z ${SIATKA.length} przebadanych.`);
if (!zdane.length) {
  console.log("  ⚠ ŻADNA. To znaczy, że sama regeneracja nie rozdzieli tych czterech stylów");
  console.log("    przy kosztach z §15 — trzeba ruszyć koszty (patrz sekcja 4) albo przyjąć,");
  console.log("    że stany zmęczenia nie mają rozróżniać stylu gry, tylko długość wyprawy.");
} else {
  console.log("  ⚠ Uwaga na odczyt: to jest kalibracja pod CON 0 i pod jeden build. Wybraną");
  console.log("    parę trzeba jeszcze przepuścić przez sekcję 6 (czy CON dalej coś znaczy).");
}
testy.push({ n: "istnieje kalibracja regeneracji rozdzielająca 4 style", ok: zdane.length > 0,
  detal: `${zdane.length} kombinacji z ${SIATKA.length}` });

// ═══ 4. RÓWNOWAGA ══════════════════════════════════════════════════════════
linia("== 4. Równowaga: ile intensywności da się utrzymać BEZ KOŃCA (§16.4/§14) ==");
console.log("  Pula jest BUFOREM (jednorazowym), regeneracja jest RÓWNOWAGĄ (wieczystą).");
console.log("  Utrzymywalny koszt walki = regen × (marsz − opóźnienie regeneracji).\n");
console.log("  Koszt jednej walki wg stylu (build lekki, ZRĘ 10; marsz nieskończony,");
console.log("  czyli każda walka startuje z pełnej puli — to izoluje sam koszt walki):");
console.log("  styl              autoatak   uniki   bloki   skille   ciężkie ciosy   RAZEM");
const kosztStylu = {};
for (const st of STYLE) {
  const r = przebieg({ styl: st, con: 0, model: "M1 pula", build: BUILDY[1], marszSek: 999 });
  const auto = r.licz.zamach * P.autoatak, unik = r.licz.unik * P.dodge, blok = r.licz.blok * P.blokZaCios,
        skill = r.licz.skill * P.skill, ciezki = r.licz.ciezki * P.ciezkiCios;
  const razem = (auto + unik + blok + skill + ciezki) / WALK;
  kosztStylu[st.n] = razem;
  console.log("  " + padr(st.n, 17) + pad(f1(auto / WALK), 8) + pad(f1(unik / WALK), 8) +
    pad(f1(blok / WALK), 8) + pad(f1(skill / WALK), 9) + pad(f1(ciezki / WALK), 16) + pad(f1(razem), 8));
}
console.log("\n  ⚠ Kolumna „ciężkie ciosy” jest największą pozycją stylu, który NIE blokuje");
console.log("    i NIE unika — czyli kara za bierność jest w tym modelu wyższa niż koszt");
console.log("    aktywnej obrony. To jest właściwy kierunek, ale patrz ostrzeżenie o progu");
console.log("    w sekcji 2.3: różnica 0,2 pkt obrażeń przełącza pięć ciosów Szarego.");
console.log("\n  Utrzymywalny koszt walki przy różnych marszach i modelach CON:\n");
console.log("  model                 CON    marsz " + f1(MARSZ_SEK) + " s   marsz 10 s   marsz 20 s");
for (const [nazwa, fn] of Object.entries(MODELE_CON)) {
  for (const con of [0, 10]) {
    const M = fn(con);
    const kol = [MARSZ_SEK, 10, 20].map((m) => f1(M.regen * Math.max(0, m - P.regenDelaySek) / M.mnoznik));
    console.log("  " + padr(nazwa, 21) + pad(con, 4) + kol.map((x) => pad(x, 13)).join(""));
  }
}
console.log("\n  ⚠ Cała kolumna „marsz 3,1 s” to zera — i to nie jest błąd zaokrąglenia.");
console.log("    Przy marszu z mapy NIC nie jest utrzymywalne, łącznie z samym staniem");
console.log("    i machaniem bronią, bo regeneracja w ogóle nie startuje. Rozstrzygnięcie");
console.log("    kształtu CON (sekcja 6) jest więc rozstrzygnięciem WEWNĄTRZ tego reżimu.\n");
console.log("  Porównaj z kosztami stylu wyżej. Odczyt (marsz 10 s, CON 0 — reżim, w którym");
console.log("  regeneracja w ogóle działa):");
for (const st of STYLE) {
  const M = MODELE_CON["M1 pula"](0);
  const utrzym = M.regen * Math.max(0, 10 - P.regenDelaySek);
  console.log(`   • ${padr(st.n, 16)} ${pad(f1(kosztStylu[st.n]), 5)} / walkę  ` +
    (kosztStylu[st.n] <= utrzym ? "→ UTRZYMYWALNY w nieskończoność"
                                : `→ deficyt ${f1(kosztStylu[st.n] - utrzym)} / walkę, pula CON 0 starcza na ${Math.floor(P.base / (kosztStylu[st.n] - utrzym))} walk`));
}
console.log("\n  ⚠ Granica równowagi przy marszu 10 s leży DOKŁADNIE między stylem B a C,");
console.log("    a różnicą między nimi jest jedna umiejętność na walkę (20 staminy).");
console.log("    Czyli w tej stawce liczb cały ciężar decyzji „ile wysiłku sobie pozwalam”");
console.log("    niosą UMIEJĘTNOŚCI, a nie uniki ani bloki. To jest do rozważenia: unik za 15");
console.log("    miał być kosztem, a wychodzi na szum przy skillu za 20 raz na walkę.");

// ═══ 5. PRZEJŚCIE LASU — SYMULACJA KROKOWA ═════════════════════════════════
linia("== 5. Przejście lasu (19 walk) — udział czasu w każdym stanie ==");
console.log(`  Pula/regen wg modelu CON · autoatak ${P.autoatak} · unik ${P.dodge} · blok ${P.blokZaCios}/cios`);
console.log(`  · skill ${P.skill} · ciężki cios ${P.ciezkiCios} · progi ${P.progTired}/${P.progExhausted} (bezwzględne)`);
console.log(`  · tempo −${Math.round(P.karaTempaTired * 100)}% / −${Math.round(P.karaTempaExhausted * 100)}%\n`);
for (const marsz of [MARSZ_SEK, 10]) {
  console.log(`  ── marsz ${f1(marsz)} s ──`);
  console.log("  model                 CON   styl            %Normalny  %Zmęczony  %Wyczerp.   min   Wycz. od walki   +s pod ciosami");
  // ⚠ CON 0 drukowany RAZ: przy zerze wszystkie trzy modele są z definicji tym
  // samym modelem, a trzy identyczne wiersze tylko rozmywają tabelę.
  const wiersz = (etykieta, con, model, st) => {
    const r = przebieg({ styl: st, con, model, build: BUILDY[1], marszSek: marsz });
    console.log("  " + padr(etykieta, 21) + pad(con, 4) + "  " + padr(st.n, 16) +
      pad(Math.round(r.pctNorm) + "%", 9) + pad(Math.round(r.pctTired) + "%", 11) +
      pad(Math.round(r.pctWycz) + "%", 11) + pad(r.minS, 6) + pad(r.pierwszyWycz ?? "—", 17) +
      pad("+" + f1(r.sekEkstra) + " s", 16));
  };
  for (const st of STYLE.slice(1)) wiersz("— baza (CON 0) —", 0, "M1 pula", st);
  for (const model of Object.keys(MODELE_CON)) {
    for (const st of STYLE.slice(1)) wiersz(model, 10, model, st);
  }
  console.log("");
}

// ═══ 6. CO CON REALNIE ZMIENIA ═════════════════════════════════════════════
linia("== 6. Kształt CON: pula, regeneracja czy efektywność (§16.3) ==");
console.log(`  Ten sam styl (C. aktywny), marsz z mapy (${f1(MARSZ_SEK)} s), build lekki — CON od 0 do 15.`);
console.log("  ⚠ Marsz z mapy, a nie 10 s, i to jest istotne: przy marszu 10 s styl C mieści");
console.log("    się w równowadze przy CON 0, więc WSZYSTKIE trzy modele dają 100% Normalny");
console.log("    i tabela nie rozstrzyga niczego. Pytanie o kształt CON ma sens dopiero tam,");
console.log("    gdzie zasób realnie schodzi.\n");
for (const model of Object.keys(MODELE_CON)) {
  console.log(`  ${model}  (${MODELE_CON[model](0).opis})`);
  console.log("    CON   pula   regen   %Normalny   %Zmęczony   %Wyczerpany   min stamina");
  for (const con of [0, 5, 10, 15]) {
    const r = przebieg({ styl: STYLE[2], con, model, build: BUILDY[1], marszSek: MARSZ_SEK });
    console.log("    " + pad(con, 3) + pad(r.pula, 7) + pad(f1(r.regen), 8) +
      pad(Math.round(r.pctNorm) + "%", 12) + pad(Math.round(r.pctTired) + "%", 12) +
      pad(Math.round(r.pctWycz) + "%", 14) + pad(r.minS, 14));
  }
  console.log("");
}

console.log("  ⚠ Odczyt, i jest inny niż intuicja: **M2 (CON przez regenerację) wypada");
console.log("    NAJGORZEJ**, choć to on miał ruszać równowagę. Powód jest w sekcji 3.1 —");
console.log("    przy marszu z mapy regeneracja nie startuje, więc M2 oddaje część puli za");
console.log("    liczbę, która nigdy nie jest używana. Regeneracja jest właściwym miejscem");
console.log("    dla CON dopiero WTEDY, gdy istnieje reżim, w którym regeneracja działa —");
console.log("    czyli po zmianie opóźnienia albo po wprowadzeniu jawnego odpoczynku.");
console.log("\n  ⚠ M3 (efektywność wysiłku) wygrywa w tej tabeli, bo jako jedyny skaluje");
console.log("    JEDNOCZEŚNIE bufor i równowagę — obniżenie kosztu działa w obu reżimach.");
console.log("    Koszt tej własności: mnoży się z każdą przyszłą zniżką kosztu (§10 decyzji");
console.log("    przewiduje umiejętności redukujące koszt wysiłku), więc jest to knob,");
console.log("    który najłatwiej wysadzić w powietrze późniejszą zawartością.");

// ═══ 7. SZEŚĆ SCENARIUSZY ══════════════════════════════════════════════════
linia("== 7. Scenariusze punktowe (§16.4) ==");
const lekki = BUILDY[1];
// ⚠ Cała sekcja liczona KALIBRACJĄ v2 (sekcja 9), nie baseline'em §15 — patrz
// komentarz przy stałej `V2`.
const _zapiszV2 = [P.regenDelaySek, P.regen];
P.regenDelaySek = V2.regenDelaySek; P.regen = V2.regen;
console.log(`  ⚠ Liczone kalibracją v2: regeneracja ${V2.regen}/s ciągła (nie baseline §15).
`);

console.log("  (a) KRÓTKA WALKA — jeden królik, styl intensywny, pełna pula");
{
  const jeden = [LAS[0]];
  const r = przebieg({ styl: STYLE[3], con: 0, model: "M1 pula", build: lekki, walki: jeden });
  console.log(`      ${r.licz.zamach} zamachów, ${r.licz.unik} uników, ${r.licz.blok} bloków, ${r.licz.skill} skilli` +
    `  →  zeszło ${P.base - r.s} ze 120 (${Math.round(100 * (P.base - r.s) / P.base)}% puli), walka ${f1(r.czas)} s`);
  console.log("      ⚠ Zgodnie z §1 decyzji: krótka walka NIE MA prawa wyczerpać paska i nie wyczerpuje.");
}

console.log("\n  (b) POŚCIG — ucieczka przed Szarym (132 px/s) do zerwania (zasięg 420 px)");
{
  const wzgledna = PLAYER.speed - GREY_WOLF.chaseSpeed;
  const czasMarsz = 420 / wzgledna;
  const wzglednaSpr = PLAYER.speed * P.sprintMnoznik - GREY_WOLF.chaseSpeed;
  const czasSpr = 420 / wzglednaSpr;
  console.log(`      marszem:  ${f1(czasMarsz)} s ucieczki, 0 staminy (przewaga ${wzgledna} px/s)`);
  console.log(`      sprintem: ${f1(czasSpr)} s ucieczki, ${Math.round(czasSpr * P.sprintNaSek)} staminy (przewaga ${Math.round(wzglednaSpr)} px/s)`);
  console.log(`      → sprint skraca pościg o ${f1(czasMarsz - czasSpr)} s za ${Math.round(czasSpr * P.sprintNaSek)} staminy` +
    `  (${Math.round(100 * czasSpr * P.sprintNaSek / P.base)}% puli CON 0)`);
  console.log(`      Dla porównania dzik (${BOAR.chaseSpeed} px/s): ${f1(340 / (PLAYER.speed - BOAR.chaseSpeed))} s marszem → ${f1(340 / (PLAYER.speed * P.sprintMnoznik - BOAR.chaseSpeed))} s sprintem.`);
  console.log("      ⚠ Treść sprintu w pościgu jest więc WĄSKA, ale nie zerowa, i leży");
  console.log("        dokładnie tam, gdzie „gracz jest szybszy od wszystkiego” przestaje");
  console.log("        wystarczać: przy Szarym przewaga marszu to 18 px/s, czyli ucieczka");
  console.log("        trwa 23 s. Sprint zamienia ją w 4 s. Przy dziku sprint oszczędza");
  console.log("        półtorej sekundy i nikt go nie użyje. Sprint jest narzędziem NA JEDNEGO");
  console.log("        przeciwnika w rosterze — to jest argument za sprintem jako wygodą");
  console.log("        podróży (scenariusz e), a nie jako filarem CON.");
}

console.log("\n  (c) POJEDYNEK UNIKOWY — Szary, unik na każde UKĄSZENIE, bez tarczy");
{
  const tylkoSzary = [LAS[6]];
  for (const con of [0, 10]) {
    const r = przebieg({ styl: { n: "unikowy", unikTel: 1, blokZwy: 0, skillNaWalke: 0, sprintFrakcja: 0 },
                         con, model: "M1 pula", build: lekki, walki: tylkoSzary });
    console.log(`      CON ${pad(con, 2)}:  ${f1(r.czas)} s walki, ${r.licz.unik} uników` +
      (r.licz.unikOdmowa ? ` (+${r.licz.unikOdmowa} odmówionych przez cooldown ${P.dodgeCooldown} s)` : "") +
      `, ${r.licz.ciezki} ciężkich ciosów przyjętych  →  ${r.s}/${r.pula}, min ${r.minS}`);
  }
  console.log("      ⚠ To jest najdłuższa walka w grze i jedyna, w której pasek ma czas zejść.");
}

console.log("\n  (d) BLOKOWANIE — niedźwiedź, blok na każdy cios kontaktowy");
{
  const nied = [LAS[5]];
  const ciezki = BUILDY[3];
  const r = przebieg({ styl: { n: "tarcza", unikTel: 0, blokZwy: 1, skillNaWalke: 0, sprintFrakcja: 0 },
                       con: 0, model: "M1 pula", build: ciezki, walki: nied });
  console.log(`      build ciężki (młot + stal + tarcza): ${f1(r.czas)} s, ${r.licz.blok} bloków` +
    `  →  ${r.s}/${r.pula}`);
  console.log(`      Blok ${P.blokZaCios}/cios przy kadencji ${BEAR.touchDamageCooldown} s to ${f1(P.blokZaCios / BEAR.touchDamageCooldown)} staminy/s —` +
    ` mniej niż regeneracja ${P.regen}/s.`);
  console.log("      ⚠ Czyli sam blok NIE DRENUJE — przy regeneracji ciągłej mieści się poniżej");
  console.log("        jej tempa. Blok zaczyna kosztować dopiero razem z resztą wydatków, i to");
  console.log("        jest właściwe: tarcza ma być odpowiedzią, która wymaga uwagi, a nie");
  console.log("        podatkiem płaconym za jej posiadanie (§6 decyzji).");
  console.log("      ⚠ Przy baseline §15 (opóźnienie 5 s) ten sam blok był darmowy tylko wtedy,");
  console.log("        gdy gracz zdążył odczekać opóźnienie — czyli praktycznie nigdy (sekcja 3.1).");
}

console.log("\n  (e) SPRINT PRZEZ MAPĘ — przelot lasu w linii prostej");
{
  const przekatna = Math.hypot(MAPA_PX.w, MAPA_PX.h);
  const czasMarsz = przekatna / PLAYER.speed;
  const czasSpr = przekatna / (PLAYER.speed * P.sprintMnoznik);
  const koszt = czasSpr * P.sprintNaSek;
  console.log(`      Przekątna mapy ${Math.round(przekatna)} px:  marszem ${f1(czasMarsz)} s  ·  sprintem ${f1(czasSpr)} s (−${f1(czasMarsz - czasSpr)} s)`);
  console.log(`      Koszt pełnego sprintu: ${Math.round(koszt)} staminy = ${f1(koszt / P.base)} × pula CON 0, ${f1(koszt / (P.base + 150))} × pula CON 15`);
  console.log(`      Ile mapy przebiegniesz na jednej puli: ${Math.round(100 * P.base / koszt)}% przekątnej (CON 0), ` +
    `${Math.round(100 * (P.base + 150) / koszt)}% (CON 15)`);
  console.log("      ⚠ Tu CON jest widoczny gołym okiem i bez walki — i to jest jedyne miejsce");
  console.log("        w całym modelu, gdzie sama PULA (a nie regeneracja) robi różnicę.");
}

console.log("\n  (f) KOMBINACJA — pełne przejście, styl intensywny, oba modele CON");
for (const model of ["M1 pula", "M2 pula+regen"]) {
  for (const con of [0, 10]) {
    const r = przebieg({ styl: STYLE[3], con, model, build: lekki, marszSek: 10 });
    console.log(`      ${padr(model, 16)} CON ${pad(con, 2)}:  Normalny ${pad(Math.round(r.pctNorm) + "%", 4)} · ` +
      `Zmęczony ${pad(Math.round(r.pctTired) + "%", 4)} · Wyczerpany ${pad(Math.round(r.pctWycz) + "%", 4)}` +
      `  ·  ${r.licz.unik} uników, ${r.licz.blok} bloków, ${Math.round(r.licz.sprintSek)} s sprintu`);
  }
}
console.log("      ⚠ Zwróć uwagę na LICZBĘ BLOKÓW: 17 przy wyczerpaniu, 8 bez niego. To nie");
console.log("        jest szum — wyczerpanie wydłuża walkę o 54%, dłuższa walka to więcej");
console.log("        ciosów przeciwnika, a więcej ciosów to więcej wydatków. **Miękka kara");
console.log("        tempa domyka się w pętlę dodatniego sprzężenia**: zmęczenie kosztuje");
console.log("        więcej zmęczenia. Nie jest to spirala śmierci (§7 decyzji), bo nie");
console.log("        dotyka HP — ale jest to spirala zmęczenia i trzeba ją znać.");

[P.regenDelaySek, P.regen] = _zapiszV2;

// ═══ 8. GDZIE PRZEBIEGA GRANICA ODCZUWALNOŚCI ══════════════════════════════
linia("== 8. Czy zwykły gracz może zignorować pasek (§14, pytanie 4) ==");
console.log("  Styl A (0 uników, 0 bloków, 0 skilli) przez całe przejście, marsz z mapy:\n");
{
  const r = przebieg({ styl: STYLE[0], con: 0, model: "M1 pula", build: BUILDY[0], marszSek: MARSZ_SEK });
  console.log(`  build startowy, CON 0, marsz ${f1(MARSZ_SEK)} s: ${r.licz.zamach} zamachów` +
    `  →  ${r.s}/${r.pula}, minimum ${r.minS}, czas Normalny ${Math.round(r.pctNorm)}%`);
  const ok = r.pctNorm > 99;
  testy.push({ n: "§15: styl spokojny nie wychodzi ze stanu Normalny", ok,
    detal: `Normalny ${Math.round(r.pctNorm)}%, minimum ${r.minS}/${r.pula}` });
  console.log(`  ⚠ ${ok ? "TAK — pasek jest ignorowalny dla gracza, który tylko bije." :
    "NIE — SAM AUTOATAK dowozi postać startową do zera. To łamie §1 i §14 decyzji:"}`);
  if (!ok) {
    console.log("    „zwykły gracz może zignorować pasek podczas spokojnej gry”. Przyczyna nie");
    console.log("    leży w wysokości kosztu (1 to naprawdę mało), tylko w tym, że przy marszu");
    console.log(`    ${f1(MARSZ_SEK)} s regeneracja nie startuje nigdy — patrz sekcja 3.1.`);
  }
}
// Test: czy CON w ogóle zmienia sposób grania (§14, ostatnie pytanie)
for (const model of Object.keys(MODELE_CON)) {
  const a = przebieg({ styl: STYLE[2], con: 0, model, build: BUILDY[1], marszSek: MARSZ_SEK });
  const b = przebieg({ styl: STYLE[2], con: 15, model, build: BUILDY[1], marszSek: MARSZ_SEK });
  const delta = a.pctWycz - b.pctWycz;
  testy.push({ n: `§15: CON 15 zdejmuje ≥30 pkt proc. czasu Wyczerpany (${model})`, ok: delta >= 30,
    detal: `${Math.round(a.pctWycz)}% → ${Math.round(b.pctWycz)}% (Δ ${Math.round(delta)} pkt proc.)` });
}
{
  const r = przebieg({ styl: STYLE[0], con: 0, model: "M1 pula", build: BUILDY[0], marszSek: 1.0 });
  console.log(`\n  Ten sam styl przy marszu 1 s (gracz biegnący od potwora do potwora bez przerwy):`);
  console.log(`  → ${r.s}/${r.pula}, minimum ${r.minS}, Normalny ${Math.round(r.pctNorm)}% · Zmęczony ${Math.round(r.pctTired)}% · Wyczerpany ${Math.round(r.pctWycz)}%`);
}

// ═══ 9. KALIBRACJA v2 ══════════════════════════════════════════════════════
linia("== 9. Kalibracja v2 — jedyna kombinacja, która przeszła siatkę z 3.3 ==");
console.log(`  Zmienione względem §15: opóźnienie regeneracji ${P.regenDelaySek} s → ${V2.regenDelaySek} s,`);
console.log(`  tempo ${P.regen}/s → ${V2.regen}/s. Reszta liczb bez zmian.`);
console.log("  ⚠ „Opóźnienie 0” to nie skrócenie opóźnienia, tylko INNY MODEL: stamina wraca");
console.log("    cały czas, także w trakcie zamachu. Uzasadnienie tematyczne jest po tej");
console.log("    stronie — oddech wraca w trakcie walki, rana się nie zabliźnia. Uzasadnienie");
console.log("    mechaniczne: reguła 5 sekund została zaprojektowana dla HP, żeby wykluczyć");
console.log("    leczenie w walce; stamina ma dokładnie odwrotny cel.\n");
{
  const zapisz = [P.regenDelaySek, P.regen];
  P.regenDelaySek = V2.regenDelaySek; P.regen = V2.regen;

  console.log("  Horyzont: przy której walce przejścia (z 19) gracz przekracza próg —");
  console.log("  model M1 (pula 120 + 10×CON), build lekki:\n");
  console.log("  styl              CON 0            CON 5            CON 10           CON 15");
  for (const st of STYLE) {
    const kol = [0, 5, 10, 15].map((con) => {
      const r = przebieg({ styl: st, con, model: "M1 pula", build: BUILDY[1], marszSek: MARSZ_SEK });
      return `Z:${r.pierwszyTired ?? "—"} W:${r.pierwszyWycz ?? "—"}`;
    });
    console.log("  " + padr(st.n, 17) + kol.map((k) => padr(k, 17)).join(""));
  }
  console.log("  (Z = pierwsza walka w stanie Zmęczony, W = w stanie Wyczerpany)");
  console.log("\n  ⚠ To jest odpowiedź na §16.3 w jednej tabeli: przy modelu „pula” CON");
  console.log("    PRZESUWA HORYZONT, i to widać w liczbie walk. Styl D wchodzi w wyczerpanie");
  console.log("    w połowie przejścia przy CON 0, a przy CON 15 dojeżdża do końca.");

  console.log("\n  Ta sama tabela dla trzech modeli CON (styl D, intensywny):");
  console.log("  model                 CON 0     CON 5     CON 10    CON 15");
  for (const model of Object.keys(MODELE_CON)) {
    const kol = [0, 5, 10, 15].map((con) => {
      const r = przebieg({ styl: STYLE[3], con, model, build: BUILDY[1], marszSek: MARSZ_SEK });
      return `W:${r.pierwszyWycz ?? "—"}`;
    });
    console.log("  " + padr(model, 21) + kol.map((k) => padr(k, 10)).join(""));
  }
  console.log("\n  Kontrola §14: czy spokojny gracz może zignorować pasek (build startowy):");
  // ⚠ Roster BEZ elity. Styl A nie unika i nie blokuje NICZEGO — przy Szarym
  // znaczy to „stój w ukąszeniu i w kontakcie przez 7 sekund”, a to nie jest
  // „spokojna gra”, tylko zła gra przeciw najtrudniejszemu wrogowi w lesie.
  // Elita liczona jest osobno, wierszem niżej.
  const bezElity = [];
  for (const e of LAS) if (!e.n.includes("elita")) for (let i = 0; i < e.ile; i++) bezElity.push(e);
  bezElity.sort((a, b) => a.hp - b.hp);
  const rA = przebieg({ styl: STYLE[0], con: 0, model: "M1 pula", build: BUILDY[0], marszSek: MARSZ_SEK, walki: bezElity });
  console.log(`  18 walk bez elity: ${rA.s}/${rA.pula}, minimum ${rA.minS}, Normalny ${Math.round(rA.pctNorm)}%` +
    `  ${rA.pctNorm > 99 ? "— TAK, pasek ignorowalny" : "— NIE"}`);
  testy.push({ n: "v2: spokojny styl, roster bez elity — cały czas Normalny", ok: rA.pctNorm > 99,
    detal: `Normalny ${Math.round(rA.pctNorm)}%, minimum ${rA.minS}/${rA.pula}` });
  const rE = przebieg({ styl: STYLE[0], con: 0, model: "M1 pula", build: BUILDY[0], walki: [LAS[6]] });
  console.log(`  sama elita, styl A (zero uników, zero bloków): ${rE.s}/${rE.pula}, minimum ${rE.minS}` +
    `, ${rE.licz.ciezki} ciężkich ciosów przyjętych`);
  console.log("  ⚠ I to jest właściwy wynik: bierność przeciw elicie kosztuje pasek, bierność");
  console.log("    przeciw reszcie lasu nie kosztuje nic. Zmęczenie mówi tu dokładnie to, co");
  console.log("    ma mówić — „ta walka była ponad twoje siły”, a nie „grasz za dużo”.");

  console.log("\n  Kontrola scenariusza krótkiej walki (królik, styl intensywny):");
  const rK = przebieg({ styl: STYLE[3], con: 0, model: "M1 pula", build: BUILDY[1], walki: [LAS[0]] });
  console.log(`  → zeszło ${rK.pula - rK.s} ze 120 (${Math.round(100 * (rK.pula - rK.s) / rK.pula)}% puli)`);
  testy.push({ n: "v2: krótka walka zjada < 25% puli", ok: (rK.pula - rK.s) / rK.pula < 0.25,
    detal: `${Math.round(100 * (rK.pula - rK.s) / rK.pula)}% puli` });

  [P.regenDelaySek, P.regen] = zapisz;
}

// ═══ 10. TESTY PROJEKTOWE ══════════════════════════════════════════════════
linia("== 10. Testy projektowe propozycji z bloku `P` ==");
for (const t of testy) console.log(`  ${t.ok ? "ZDANY   " : "NIEZDANY"} ${padr(t.n, 52)} ${t.detal}`);
const nieZdane = testy.filter((t) => !t.ok).length;
console.log(`\n  ${nieZdane === 0 ? "Wszystkie testy projektowe zdane." :
  `⚠ ${nieZdane} test(y) niezdane — to są liczby do zmiany, nie usterki narzędzia.`}`);

console.log("\n(przymiar — nic nie zapisano)");

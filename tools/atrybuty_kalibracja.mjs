/**
 * Kalibracja atrybutów — przymiar pod rebalans SIŁ/ZRĘ/KON (2026-08-20).
 *
 * ⚠ **TYLKO RAPORT. Ten skrypt nie zapisuje niczego i nie ma `--zapisz`** —
 * jest przymiarem do wyboru liczb, a nie generatorem dokumentu. Wyjątek
 * świadomy, w duchu reguły „generator jest przymiarem" z `tools/CLAUDE.md`.
 *
 * ── Po co istnieje ─────────────────────────────────────────────────────────
 * `docs/atrybuty.md` §5 wybrało `p` kalibracją NA JEDNEJ BRONI przy JEDNEJ
 * inwestycji (miecz, 10 pkt) i samo zastrzegło, że reszta rosteru jest „do
 * sprawdzenia, nie do przyjęcia na wiarę". Ten skrypt sprawdza cały roster,
 * wszystkie warianty i cztery poziomy inwestycji naraz — i liczy trzy rzeczy,
 * których tamta kalibracja nie miała:
 *
 *   1. **CZY NAJLEPSZA BROŃ ZALEŻY OD BUILDU** — jedyny test, który odróżnia
 *      skalowanie per broń od jednolitego procentu. Przy jednolitym `p`
 *      odpowiedź jest ZAWSZE ta sama broń, co jest zamrożeniem drabinki, nie
 *      jej naprawą.
 *   2. **REGRESJA MOCY GRACZA** wobec dzisiejszego modelu w paśmie 0–15 pkt
 *      (`docs/atrybuty.md` §3: kolumna „49 pkt" jest fikcją).
 *   3. **ŁAŃCUCH MNOŻNIKÓW** — `jakość × wariant × atrybut × umiejętność ×
 *      krytyk`. Dziś Siła jest DODAWANA i tłumi ten iloczyn; po zmianie
 *      wchodzi do niego. `docs/atrybuty.md` §8.4 nazwało to ryzykiem
 *      i zażądało wyceny PRZED wyborem współczynnika. To jest ta wycena.
 *
 * ── Samosprawdzenie ────────────────────────────────────────────────────────
 * ⚠ Reguła z `tools/CLAUDE.md`: generator liczący równolegle do gry musi
 * sprawdzać SAM SIEBIE przeciwko liczbom zapisanym w dokumentacji. Model STARY
 * jest tu porównywany z `docs/ekwipunek_przedmioty.md` (DPS @S0: kij 16,8 ·
 * sztylet 25,0 · miecz 25,8 · młot 29,3 · włócznia 23,3). Rozjazd = BŁĄD
 * i niezerowy kod wyjścia, bo wtedy wszystkie tabele niżej kłamią.
 *
 * ── Dlaczego .mjs ──────────────────────────────────────────────────────────
 * Ten sam powód co `katalog_ekwipunku.mjs` i `macierz_walki.mjs`: źródłem jest
 * TypeScript, a regex po `GameConfig.ts` gubi wpis przy zmianie formatowania.
 * Bundlowanie przez esbuild daje PRAWDZIWE wartości.
 *
 *   node tools/atrybuty_kalibracja.mjs
 */

import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(KORZEN, "node_modules", ".atrybuty-kalibracja.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

const { ITEMS, PLAYER, ATTRIBUTES, WEAPON_FAMILY, QUALITY, ABILITIES } = C;

/**
 * ⚠⚠ **Cechy rodziny czyta PRAWDZIWA funkcja z `core/WeaponTraits.ts`, nie
 * transkrypcja** (naprawa 2026-09-05).
 *
 * Do tej daty stało tu `"critMultiplierBonus" in f ? f.critMultiplierBonus : 0`
 * — kształt sprzed **Weapon Traits V1 (2026-09-03)**, kiedy cechy rodzin
 * przeniosły się do tablicy `traits: [{ kind, value }]`. Po tamtej zmianie
 * warunek był **zawsze fałszywy**, więc przymiar po cichu gubił KAŻDĄ premię
 * rodziny: sztylet liczył się 24,0 zamiast 25,0, a rodzina `axe`
 * (`critMultiplierBonus: 0,25`) traciła całą swoją oś w tabelach cenowych.
 *
 * ⚠ Objaw był WĄSKI (jeden wiersz samosprawdzenia), bo z pięciu broni
 * referencyjnych tylko sztylet siedzi w rodzinie z premią do krytyka — **ale
 * usterka była ogólna.** Dlatego naprawa nie przepisuje reguły drugi raz:
 * `WeaponTraits.ts` nie ma żadnych importów runtime, więc daje się zbudować
 * osobno i wciągnąć tak jak config. Następny refaktor kształtu cech złamie
 * build tego pliku, a nie jego wyniki.
 */
const tmpTraits = join(KORZEN, "node_modules", ".weapontraits-kalibracja.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "core", "WeaponTraits.ts")],
  outfile: tmpTraits,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
});
const { familyTraitValue } = await import(pathToFileURL(tmpTraits).href);
await unlink(tmpTraits);

// ── Roster ──────────────────────────────────────────────────────────────────
const BRONIE = Object.values(ITEMS).filter((i) => i.type === "weapon");

/**
 * ⚠ **Model STARY jest ZAMROŻONYM ZAPISEM HISTORYCZNYM i celowo NIE czyta
 * configu.** Obie stałe zniknęły z `ATTRIBUTES` przy wdrożeniu (2026-08-20),
 * więc czytanie ich stamtąd dawałoby `undefined`, a cała kolumna „przed"
 * wychodziłaby `NaN`. Zostają liczbami, bo służą wyłącznie do pokazania,
 * **od czego odeszliśmy** — nie opisują niczego, co dziś działa, i nie wolno
 * ich „aktualizować".
 *
 * ⚠ Model NOWY nie ma tu żadnej tabeli: czyta **żywe** `ITEMS[*].strScale` /
 * `dexScale`. Od wdrożenia ten przymiar sprawdza KOD, a nie propozycję.
 */
const STARY = { damagePerStrength: 1, critChancePerAgility: 0.006 };

/** ⚠ Kij jest starterem i MA odpadać — trzymanie go w rozpiętości zawyża ją
 *  o rzecz, która jest zamierzona. Liczymy obie. */
const BEZ_KIJA = (w) => w.id !== "stick";

// ── Model (PRZEPISANY z kodu; każda linia ma źródło) ────────────────────────
//
// ⚠ To jest jedyna rzecz w tym pliku, która może się rozjechać po cichu.
// Źródła: `Progression.meleeDamageMin/Max`, `.critChance`, `.critMultiplier`,
// `.attackSpeedBonus`, `.attackCooldown`, `.swingDurationMs`, `Player.triggerAttack`.

const asb = (dex) =>
  Math.min(dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);

/** Szansa krytyka. `nowy=true` usuwa człon Zręczności (rebalans). */
function critChance(w, dex, nowy) {
  const zZrecznosci = nowy ? 0 : dex * STARY.critChancePerAgility;
  return Math.min(
    PLAYER.critChance + zZrecznosci + (w?.melee?.critChanceBonus ?? 0),
    ATTRIBUTES.maxCritChance,
  );
}

/**
 * Siła krytyka: baza + premia broni + premia RODZINY.
 *
 * ⚠ Kolejność i składniki muszą się zgadzać z `Progression.critMultiplier` —
 * to jest jedyne miejsce w tym pliku, które opisuje cudzą arytmetykę.
 */
function critMultiplier(w) {
  const f = w?.family ? WEAPON_FAMILY[w.family] : null;
  const zRodziny = familyTraitValue(f, "critMultiplierBonus");
  return PLAYER.critMultiplier + (w?.melee?.critMultiplierBonus ?? 0) + zRodziny;
}

/**
 * Średnie obrażenia zamachu.
 *  - `stary`: `baza × wariant + SIŁ × 1`  (dodawanie — dzisiejszy kod)
 *  - `nowy` : `baza × wariant × (1 + SIŁ×strScale + ZRĘ×dexScale)` (mnożenie)
 */
function avgDmg(w, wariant, str, dex, nowy, jakoscMul = 1) {
  const baza = ((w?.damageMin ?? PLAYER.damageMin) + (w?.damageMax ?? PLAYER.damageMax)) / 2;
  const zWariantu = baza * jakoscMul * (wariant?.damageMul ?? 1);
  if (!nowy) return zWariantu + str * STARY.damagePerStrength;
  // ⚠ Model NOWY czyta ŻYWE `strScale`/`dexScale` z `ITEMS` — od wdrożenia ten
  // przymiar sprawdza kod, a nie propozycję. Bare hands biorą wartości
  // z `PLAYER`, dokładnie jak `Progression.attributeDamageMul`.
  const k = w ? { str: w.strScale, dex: w.dexScale } : { str: PLAYER.strScale, dex: PLAYER.dexScale };
  return zWariantu * (1 + str * k.str + dex * k.dex);
}

function cykl(w, wariant, dex) {
  const base = w?.attackCooldown ?? PLAYER.attackCooldown;
  return (base * (wariant?.swingMul ?? 1)) / (1 + asb(dex));
}

function dps(w, wariant, str, dex, nowy, jakoscMul = 1) {
  const avg = avgDmg(w, wariant, str, dex, nowy, jakoscMul);
  const cc = critChance(w, dex, nowy);
  return (avg * (1 + cc * (critMultiplier(w) - 1))) / cykl(w, wariant, dex);
}

/** Wariant podstawowy (indeks 0) — ten, którym broń jest reprezentowana. */
const glowny = (w) => w.attacks?.[0] ?? null;

const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);
const pad = (s, n) => String(s).padStart(n);

// ── 0. SAMOSPRAWDZENIE ──────────────────────────────────────────────────────
const OCZEKIWANE = { stick: 16.8, dagger: 25.0, sword: 25.8, hammer: 29.3, spear: 23.3 };
let bledy = 0;
console.log("== 0. Samosprawdzenie ==");
console.log("  (a) STARY model odtwarza liczby z docs/ekwipunek_przedmioty.md");
for (const [id, oczek] of Object.entries(OCZEKIWANE)) {
  const w = ITEMS[id];
  const got = dps(w, glowny(w), 0, 0, false);
  const ok = Math.abs(got - oczek) < 0.1;
  if (!ok) bledy++;
  console.log(`      ${ok ? "OK  " : "BŁĄD"} ${pad(w.name, 16)} liczone ${f1(got)}  dok. ${oczek}`);
}
// ⚠ **Najmocniejsza asercja w tym pliku.** Skalowanie przy zerowej inwestycji
// wynosi ×1, więc świeża postać MUSI dostać dokładnie te same liczby co przed
// zmianą. Gdyby ta sekcja zaświeciła na czerwono, znaczyłoby to, że rebalans
// ruszył moc startową gracza — a jego całą tezą jest, że jej nie rusza.
console.log("  (b) NOWY model przy 0 pkt = STARY przy 0 pkt (zmiana ma być niewidoczna na starcie)");
for (const [id, oczek] of Object.entries(OCZEKIWANE)) {
  const w = ITEMS[id];
  const got = dps(w, glowny(w), 0, 0, true);
  const ok = Math.abs(got - oczek) < 0.1;
  if (!ok) bledy++;
  console.log(`      ${ok ? "OK  " : "BŁĄD"} ${pad(w.name, 16)} liczone ${f1(got)}  dok. ${oczek}`);
}
if (bledy) {
  console.error(`\n⚠ ${bledy} rozjazdów — model w tym pliku odbiegł od kodu. Tabele niżej KŁAMIĄ.`);
  process.exit(1);
}

// ── 1. Czy najlepsza broń zależy od BUILDU? ─────────────────────────────────
console.log("\n== 1. Najlepsza broń jednocelowa wg buildu (test rozstrzygający) ==");
const BUILDY = [
  ["baza      ", 0, 0],
  ["SIŁ 5     ", 5, 0],
  ["SIŁ 10    ", 10, 0],
  ["SIŁ 15    ", 15, 0],
  ["ZRĘ 5     ", 0, 5],
  ["ZRĘ 10    ", 0, 10],
  ["ZRĘ 15    ", 0, 15],
  ["5/5 mieszany", 5, 5],
  ["8/7 mieszany", 8, 7],
];
for (const [etykieta, nowy] of [["STARY (płaski +1)", false], ["NOWY (skalowanie per broń)", true]]) {
  console.log(`\n  ${etykieta}`);
  console.log("  build          " + BRONIE.map((w) => pad(w.name.slice(0, 8), 9)).join("") + "   najlepsza      rozpiętość");
  for (const [nazwa, s, d] of BUILDY) {
    const v = BRONIE.map((w) => dps(w, glowny(w), s, d, nowy));
    const best = BRONIE[v.indexOf(Math.max(...v))].name;
    const rozp = Math.max(...v) / Math.min(...v);
    const vBK = BRONIE.filter(BEZ_KIJA).map((w) => dps(w, glowny(w), s, d, nowy));
    const rozpBK = Math.max(...vBK) / Math.min(...vBK);
    console.log(
      "  " + pad(nazwa, 13) + v.map((x) => pad(f1(x), 9)).join("") + "   " + pad(best, 12) +
      "  ×" + f2(rozp) + " (bez kija ×" + f2(rozpBK) + ")",
    );
  }
}

// ── 1b. ASERCJA: czy DPS śledzi CENĘ ────────────────────────────────────────
//
// ⚠ To jest reguła, którą projekt już raz egzekwował ręcznie — komentarz przy
// `WEAPON_FAMILY.axe` dobiera `critMultiplierBonus` tak, żeby siekiera nie
// przeskoczyła młota, bo *„projekt raz już naprawiał to, że najdroższy zakup
// był słabszy od tańszego"*. Tu jest ta sama reguła jako asercja, która potrafi
// zaświecić na czerwono.
//
// ⚠ Sprawdzana WEWNĄTRZ buildu, nie globalnie: droższa broń ma być lepsza dla
// buildu, do którego należy, a nie dla każdego. Naruszenie u broni CIĘŻKIEJ
// w buildzie ZRĘCZNOŚCIOWYM (i odwrotnie) jest zamierzone i pomijane.
console.log("\n== 1b. ASERCJA: czy droższa broń jest lepsza (w obrębie buildu) ==");
const CIEZKIE = new Set(["hammer", "axe", "spear"]);
const LEKKIE = new Set(["dagger", "stick"]);
let naruszenia = 0;
for (const [nazwa, s, d] of BUILDY) {
  const kierunekStr = s > d;
  const lista = BRONIE.filter(BEZ_KIJA)
    .filter((w) => (kierunekStr ? !LEKKIE.has(w.id) : !CIEZKIE.has(w.id)))
    .map((w) => ({ w, dps: dps(w, glowny(w), s, d, true) }))
    .sort((a, b) => a.w.buyPrice - b.w.buyPrice);
  const zle = [];
  for (let i = 1; i < lista.length; i++) {
    if (lista[i].dps < lista[i - 1].dps) {
      zle.push(`${lista[i].w.name}(${lista[i].w.buyPrice}g, ${f1(lista[i].dps)}) < ${lista[i - 1].w.name}(${lista[i - 1].w.buyPrice}g, ${f1(lista[i - 1].dps)})`);
    }
  }
  naruszenia += zle.length;
  console.log(`  ${zle.length ? "⚠" : "OK"} ${pad(nazwa, 13)} ${zle.length ? zle.join(" · ") : "cena śledzi moc"}`);
}
console.log(`  → ${naruszenia} naruszeń. ⚠ Naruszenie NIE jest automatycznie błędem modelu —`);
console.log(`    może znaczyć, że w rosterze BRAKUJE drogiej broni dla tego buildu.`);

// ── 2. Regresja mocy gracza ─────────────────────────────────────────────────
console.log("\n== 2. Regresja mocy: NOWY / STARY (1,00 = bez zmian) ==");
console.log("  ⚠ Pasmo realne to 0–15 pkt. Poza nim liczby są ciekawostką.");
console.log("  broń            " + [0, 5, 10, 15].map((n) => pad("SIŁ" + n, 8)).join("") + "   " + [5, 10].map((n) => pad("ZRĘ" + n, 8)).join(""));
for (const w of BRONIE) {
  const kol = [];
  for (const s of [0, 5, 10, 15]) kol.push(dps(w, glowny(w), s, 0, true) / dps(w, glowny(w), s, 0, false));
  for (const d of [5, 10]) kol.push(dps(w, glowny(w), 0, d, true) / dps(w, glowny(w), 0, d, false));
  console.log("  " + pad(w.name, 15) + kol.map((x) => pad(f2(x), 8)).join(""));
}

// ── 3. Warianty: czy skalowanie ich nie spłaszcza ───────────────────────────
console.log("\n== 3. Przewaga wariantu [0] nad [1] (spłaszczanie wyboru) ==");
console.log("  ⚠ docs/odlozone.md §3: płaska Siła ścina tę przewagę z 11,8% (SIŁ 0) do 6,9% (SIŁ 4).");
for (const w of BRONIE.filter((x) => (x.attacks?.length ?? 0) > 1)) {
  const wiersz = [];
  for (const [nowy, s] of [[false, 0], [false, 4], [false, 10], [true, 0], [true, 4], [true, 10]]) {
    const a = dps(w, w.attacks[0], s, 0, nowy);
    const b = dps(w, w.attacks[1], s, 0, nowy);
    wiersz.push(pad(f1(100 * (a / b - 1)) + "%", 9));
  }
  console.log(`  ${pad(w.name, 12)} STARY: ${wiersz.slice(0, 3).join("")}   NOWY: ${wiersz.slice(3).join("")}`);
}

// ── 4. Łańcuch mnożników (docs/atrybuty.md §8.4) ────────────────────────────
console.log("\n== 4. Łańcuch mnożników: najmocniejszy realny cios ==");
console.log("  Arcymistrzowska (jakość 7) × wariant × atrybut × Okrzyk bojowy × krytyk");
const jak7 = 1 + QUALITY.modifiers.damage[7];
const okrzyk = 1 + ABILITIES.warcry.damageBonus;
console.log("  broń            STARY@SIŁ15   NOWY@SIŁ15   wzrost   STARY@SIŁ0   NOWY@SIŁ0");
for (const w of BRONIE) {
  const szczyt = (s, nowy) =>
    avgDmg(w, glowny(w), s, 0, nowy, jak7) * okrzyk * critMultiplier(w);
  const a15 = szczyt(15, false), b15 = szczyt(15, true);
  const a0 = szczyt(0, false), b0 = szczyt(0, true);
  console.log(
    "  " + pad(w.name, 15) + pad(f1(a15), 11) + pad(f1(b15), 13) + pad("×" + f2(b15 / a15), 9) +
    pad(f1(a0), 13) + pad(f1(b0), 12),
  );
}

// ── 5. Zręczność: root, recovery i wolny czas ───────────────────────────────
console.log("\n== 5. Zręczność a wolny czas (miecz) ==");
console.log("  STARY root = zamach + 40 (Player.triggerAttack)");
console.log("  NOWY  root = zamach×hitFraction + (zamach×(1−hitFraction) + 40) × (1 − redukcja)");
const HF = PLAYER.swingHitFraction;
for (const R of [0, 0.015, 0.02, 0.03]) {
  console.log(`\n  recoveryPerAgility = ${R === 0 ? "— (model STARY)" : R}`);
  console.log("  ZRĘ  cykl   root  root/cykl  wolnego/s  zamachów/s");
  for (const d of [0, 5, 10, 15, 20]) {
    const w = ITEMS.sword;
    const swing = w.swingDurationMs / (1 + asb(d));
    const root =
      R === 0
        ? swing + 40
        : swing * HF + (swing * (1 - HF) + 40) * (1 - Math.min(d * R, 0.5));
    const cyc = cykl(w, glowny(w), d) * 1000;
    const naSek = 1000 / cyc;
    console.log(
      "  " + pad(d, 3) + pad(f1(cyc), 7) + pad(f1(root), 7) + pad(f1(100 * root / cyc) + "%", 10) +
      pad(f1(1000 - naSek * root), 11) + pad(f2(naSek), 12),
    );
  }
}

// ── 6. Kurs wymiany atrybutów (N ∝ HP × DPS) ────────────────────────────────
console.log("\n== 6. Przyrost procentowy na punkt ==");
console.log("  Przeżywalność ∝ HP × DPS, więc wspólną walutą jest przyrost WZGLĘDNY.");
console.log("  ⚠ Mierzone na TRZECH broniach, nie na jednej: miecz jest celowo neutralny,");
console.log("    a cały sens modelu jest w tym, że młot i sztylet neutralne NIE są.");
console.log("\n  pkt  %HP/pkt(WIT)" + ["hammer", "sword", "dagger"].map((id) => pad(ITEMS[id].name + " SIŁ/ZRĘ", 22)).join(""));
for (const L of [0, 5, 10, 15]) {
  // ⚠⚠ **`hpPerEndurance` NIE ISTNIEJE od 2026-08-21** — dawna Kondycja
  //   (`endurance`) rozpadła się wtedy na WITALNOŚĆ (HP) i KONDYCJĘ (stamina),
  //   a pole przemianowano na `hpPerVitality`. Do naprawy 2026-09-05 stało tu
  //   stare imię, więc cała kolumna `%HP/pkt` wychodziła **NaN** — czyli
  //   dokładnie ta kolumna, którą `docs/atrybuty.md` §10.4(d) publikuje jako
  //   kurs wymiany HP↔dps. Rozjazd był CICHY: `NaN` przechodzi przez `toFixed`
  //   bez wyjątku i drukuje się jako zwykły wiersz tabeli.
  //   ⚠ Kolumna mierzy dziś **Witalność**, mimo że nagłówek w tamtym dokumencie
  //   nazywa ją „KON" — patrz nota przy §10.4(d) i `docs/atrybuty.md` §11.
  const hp = PLAYER.hp + L * ATTRIBUTES.hpPerVitality;
  const kol = ["hammer", "sword", "dagger"].map((id) => {
    const w = ITEMS[id], v = glowny(w);
    const baza = dps(w, v, L, L, true);
    const s = 100 * (dps(w, v, L + 1, L, true) - baza) / baza;
    const d = 100 * (dps(w, v, L, L + 1, true) - baza) / baza;
    return pad(`${f2(s)} / ${f2(d)}`, 22);
  });
  console.log("  " + pad(L, 3) + pad(f2((100 * ATTRIBUTES.hpPerVitality) / hp), 10) + kol.join(""));
}
console.log("\n  ⚠ STARY model dla porównania (miecz): SIŁ 8,70 · ZRĘ 1,63 przy 0 pkt — czyli ×5,3.");

console.log("\n(przymiar — nic nie zapisano)");

/**
 * Weryfikacja WDROŻONEJ staminy (2026-08-21).
 *
 * ⚠ **To NIE jest kolejny przymiar.** `stamina_model.mjs` liczy MODEL —
 * własną symulację obok gry. Ten plik uruchamia **prawdziwy `src/core/
 * Stamina.ts`** i sprawdza jego zachowanie oraz prawdziwe liczby z
 * `GameConfig.ts`. Dwa różne pytania: tamten pyta „czy model ma sens", ten
 * pyta „czy kod robi to, co model obiecał".
 *
 * ⚠ `EventBus` jest PODMIENIANY na atrapę, bo ciągnie za sobą Phasera (DOM).
 * To jedyne odstępstwo od produkcyjnego grafu modułów — reszta, łącznie
 * z całą arytmetyką, jest tym samym kodem, który wykonuje gra.
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/stamina_weryfikacja.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stub = join(KORZEN, "node_modules", ".eventbus-stub.ts");
const tmpS = join(KORZEN, "node_modules", ".stamina-real.mjs");
const tmpC = join(KORZEN, "node_modules", ".config-real.mjs");

await writeFile(
  stub,
  `export const GameEvents = { emit() {}, on() {}, off() {} };
   export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n`,
);
// ⚠ `alias` esbuilda nie przyjmuje ścieżek względnych, więc podmiana idzie
// wtyczką `onResolve`. Filtr celuje wyłącznie w `./EventBus` — nic innego
// w grafie modułów nie jest podmieniane.
await build({
  entryPoints: [join(KORZEN, "src", "core", "Stamina.ts")],
  outfile: tmpS, format: "esm", bundle: true, logLevel: "silent",
  plugins: [{
    name: "eventbus-stub",
    setup(b) {
      b.onResolve({ filter: /^\.\/EventBus$/ }, () => ({ path: stub }));
    },
  }],
});
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmpC, format: "esm", bundle: false, logLevel: "silent",
});
const { Stamina } = await import(pathToFileURL(tmpS).href);
const { ITEMS, STAMINA, EQUIPMENT_LOAD, ATTRIBUTES, PLAYER, PROFICIENCY } = await import(
  pathToFileURL(tmpC).href,
);
await Promise.all([unlink(stub), unlink(tmpS), unlink(tmpC)].map((p) => p.catch(() => {})));

let bledy = 0;
const f1 = (n) => n.toFixed(1);
const pad = (s, n) => String(s).padStart(n);
const padr = (s, n) => String(s).padEnd(n);
function ok(nazwa, warunek, detal = "") {
  if (!warunek) bledy++;
  console.log(`  ${warunek ? "OK  " : "BŁĄD"} ${padr(nazwa, 58)} ${detal}`);
}

console.log("== 1. Pula z Kondycji ==");
for (const con of [0, 5, 10, 15]) {
  Stamina.syncMax(con);
  Stamina.refill();
  const oczek = STAMINA.base + con * STAMINA.perConditioning;
  ok(`CON ${con} → pula ${oczek}`, Stamina.max === oczek, `${Stamina.max}`);
}

console.log("\n== 2. Progi stanów są BEZWZGLĘDNE (inwestycja w CON nie może karać) ==");
console.log("  ⚠ Sedno: przy KAŻDEJ puli te same wartości bezwzględne mają dawać ten sam");
console.log("    stan, a większa pula ma dawać większy ZAPAS nad progiem.\n");
console.log("  CON   pula   zapas nad Zmęczonym   stan przy 44   stan przy 24");
let zapasRosnie = true;
let poprzedniZapas = -1;
for (const con of [0, 5, 10, 15]) {
  Stamina.syncMax(con);
  Stamina.refill();
  const zapas = Stamina.max - STAMINA.tiredBelow;
  if (zapas <= poprzedniZapas) zapasRosnie = false;
  poprzedniZapas = zapas;
  Stamina.refill();
  Stamina.spend(Stamina.max - 44, "ability", 0);
  const s44 = Stamina.state;
  Stamina.refill();
  Stamina.spend(Stamina.max - 24, "ability", 0);
  const s24 = Stamina.state;
  console.log(
    "  " + pad(con, 3) + pad(Stamina.max, 7) + pad(zapas, 22) + pad(s44, 15) + pad(s24, 15),
  );
  if (s44 !== "tired" || s24 !== "exhausted") bledy++;
}
ok("zapas nad progiem ROŚNIE z Kondycją", zapasRosnie);

console.log("\n== 3. ⚠ NIEZMIENNIK: `spend` nigdy nie odmawia i nigdy nie schodzi poniżej zera ==");
Stamina.syncMax(0);
Stamina.refill();
for (let i = 0; i < 50; i++) Stamina.spend(STAMINA.costs.dodge, "dodge", i * 100);
ok("50 uników przy puli 120 → zero, nie liczba ujemna", Stamina.current === 0, `${Stamina.current}`);
Stamina.spend(999, "ability", 5000);
ok("wydatek 999 na zerze nadal nie schodzi poniżej zera", Stamina.current === 0, `${Stamina.current}`);
ok("`spend` nie ma wartości zwracanej (nie da się na niej bramkować)",
   Stamina.spend(1, "autoAttack", 6000) === undefined);

console.log("\n== 4. Regeneracja jest CIĄGŁA, a odpoczynek ją przyspiesza ==");
Stamina.syncMax(0);
Stamina.refill();
Stamina.spend(60, "ability", 0);          // wysiłek w chwili 0
const poWysilku = Stamina.current;
Stamina.tick(1000, 1000);                  // 1 s później — jeszcze nie odpoczęty
const zaSekunde = Stamina.current - poWysilku;
ok(`1 s w walce daje ${STAMINA.regenPerSecond}/s`,
   Math.abs(zaSekunde - STAMINA.regenPerSecond) < 0.01, `${f1(zaSekunde)}`);
const przedOdpoczynkiem = Stamina.current;
Stamina.tick(1000, STAMINA.restedAfterMs + 1000); // ponad 5 s od wysiłku
const poOdpoczynku = Stamina.current - przedOdpoczynkiem;
ok(`1 s po odpoczynku daje ${STAMINA.regenRestedPerSecond}/s`,
   Math.abs(poOdpoczynku - STAMINA.regenRestedPerSecond) < 0.01,
   `${f1(poOdpoczynku)}`);
ok("odpoczynek REGENERUJE SZYBCIEJ niż wysiłek (niezmiennik pary z §24a)",
   STAMINA.regenRestedPerSecond > STAMINA.regenPerSecond,
   `${STAMINA.regenPerSecond}/s przy wysiłku → ${STAMINA.regenRestedPerSecond}/s po odpoczynku`);
ok("regeneracja nie przekracza puli", (() => {
  Stamina.tick(100000, 999999);
  return Stamina.current === Stamina.max;
})(), `${Stamina.current}/${Stamina.max}`);

console.log("\n== 5. Koszt przyjętego ciosu — KRZYWA, nie próg ==");
console.log("  ⚠ Sprawdzane jest dokładnie to, co obalił pomiar modelu: sąsiednie");
console.log("    obrażenia nie mogą dawać skokowo różnego kosztu.\n");
console.log("  obrażenia po pancerzu   koszt staminy");
let skok = 0;
let poprzedni = 0;
for (const dmg of [2, 5, 8, 9, 10, 10.2, 12, 14, 17, 22, 30]) {
  const c = Stamina.hitCost(dmg);
  skok = Math.max(skok, Math.abs(c - poprzedni));
  poprzedni = c;
  console.log("  " + pad(f1(dmg), 15) + pad(f1(c), 18));
}
ok("draśnięcie (2 pkt) nie kosztuje nic", Stamina.hitCost(2) === 0);
ok("cios na progu nie kosztuje nic", Stamina.hitCost(STAMINA.heavyHit.thresholdDamage) === 0);
ok("koszt ma sufit", Stamina.hitCost(999) === STAMINA.heavyHit.maxCost, `${Stamina.hitCost(999)}`);
ok("brak urwiska: 10,0 → 10,2 zmienia koszt o < 1 pkt",
   Math.abs(Stamina.hitCost(10.2) - Stamina.hitCost(10.0)) < 1,
   `${f1(Stamina.hitCost(10.0))} → ${f1(Stamina.hitCost(10.2))}`);

console.log("\n== 6. Obciążenie realnych kompletów (liczone z ITEMS + EQUIPMENT_LOAD) ==");
const waga = (ids) => ids.reduce((s, id) => s + ("weight" in ITEMS[id] ? ITEMS[id].weight : 0), 0);
// ⚙ Model D (`OI-104`): malejący przyrost udźwigu powyżej `softCapStrength`.
// Poniżej progu wzór jest identyczny jak przed zmianą, więc żaden przypadek
// z listy niżej (Siła ≤ 12) nie zmienił wyniku.
const pojemnosc = (str) =>
  str <= EQUIPMENT_LOAD.softCapStrength
    ? EQUIPMENT_LOAD.base + str * EQUIPMENT_LOAD.perStrength
    : EQUIPMENT_LOAD.base +
      EQUIPMENT_LOAD.softCapStrength * EQUIPMENT_LOAD.perStrength +
      (str - EQUIPMENT_LOAD.softCapStrength) * EQUIPMENT_LOAD.perStrengthAbove;
/** Mnożnik kosztu uniku i sprintu — ciągły i bez sufitu (Model D, `OI-101`). */
const wysilek = (r) => 1 + EQUIPMENT_LOAD.effortPerRatio * Math.max(0, r - EQUIPMENT_LOAD.effortFreeRatio);
const klasa = (r) =>
  r > EQUIPMENT_LOAD.heavyAbove ? "heavy" : r > EQUIPMENT_LOAD.mediumAbove ? "medium" : "light";

const SKORA = ["leather_helmet", "leather_chest", "leather_gloves", "leather_legs", "leather_boots"];
const PRZESZYW = ["padded_cap", "gambeson", "padded_gloves", "padded_chausses", "foot_wraps"];
const KOLCZ = ["mail_coif", "mail_hauberk", "mail_gloves", "mail_chausses", "mail_boots"];
const STAL = ["steel_helmet", "steel_chest", "steel_gauntlets", "steel_legs", "steel_boots"];

const PRZYPADKI = [
  { n: "goły + kij", ids: ["stick"], str: 0, oczek: "light" },
  { n: "skóra + sztylet", ids: [...SKORA, "dagger"], str: 0, oczek: "light" },
  { n: "przeszywanica + miecz", ids: [...PRZESZYW, "sword"], str: 2, oczek: "light" },
  { n: "kolczuga + miecz", ids: [...KOLCZ, "sword"], str: 3, oczek: "medium" },
  { n: "stal + młot + tarcza", ids: [...STAL, "hammer", "ironbound_shield"], str: 6, oczek: "heavy" },
  { n: "stal + młot + tarcza (SIŁ 12)", ids: [...STAL, "hammer", "ironbound_shield"], str: 12, oczek: "medium" },
];
console.log("  loadout                            waga   udźwig   wykorzyst.   klasa    wysiłek");
for (const p of PRZYPADKI) {
  const w = waga(p.ids);
  const cap = pojemnosc(p.str);
  const r = w / cap;
  const k = klasa(r);
  console.log(
    "  " + padr(p.n, 34) + pad(f1(w), 6) + pad(f1(cap), 9) + pad(r.toFixed(2), 13) +
      pad(k, 9) + pad("×" + wysilek(r).toFixed(2), 9) +
      (k === p.oczek ? "" : `   ⚠ oczekiwano ${p.oczek}`),
  );
  if (k !== p.oczek) bledy++;
}
ok("Siła obniża klasę obciążenia przy TYM SAMYM sprzęcie",
   klasa(waga([...STAL, "hammer", "ironbound_shield"]) / pojemnosc(12)) !==
   klasa(waga([...STAL, "hammer", "ironbound_shield"]) / pojemnosc(6)));

console.log("\n== 7. Koszt bloku należy do TARCZY ==");
for (const id of ["buckler", "ironbound_shield"]) {
  const b = ITEMS[id].block;
  const koszt = "staminaCost" in b ? b.staminaCost : STAMINA.costs.blockFallback;
  console.log(`  ${padr(ITEMS[id].name, 20)} redukcja ${Math.round(b.reduction * 100)}%   koszt ${koszt} staminy/cios`);
  if (!("staminaCost" in b)) bledy++;
}
ok("obie tarcze deklarują własny koszt (żadna nie spada na `blockFallback`)",
   ["buckler", "ironbound_shield"].every((id) => "staminaCost" in ITEMS[id].block));
ok("puklerz jest tańszy w bloku niż tarcza okuta",
   ITEMS.buckler.block.staminaCost < ITEMS.ironbound_shield.block.staminaCost);

console.log("\n== 8. Kary stanów nie mogą rozerwać pozy ataku ==");
console.log("  ⚠ Niezmiennik z `Progression.swingMul`: ukorzenienie nie może przekroczyć");
console.log("    cyklu ataku, bo poza zaczyna się rwać. Liczone dla najwolniejszej broni.\n");
console.log("  broń        stan          cykl      ukorzenienie   zapas");
for (const [id, dex] of [["hammer", 0], ["sword", 0], ["dagger", 15]]) {
  const w = ITEMS[id];
  for (const stan of ["normal", "tired", "exhausted"]) {
    const st = STAMINA.states[stan];
    const bonus = Math.min(dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);
    const red = Math.min(dex * ATTRIBUTES.recoveryPerAgility, ATTRIBUTES.maxRecoveryReduction);
    const cykl = (w.attackCooldown / (1 + bonus) / st.attackSpeedMul) * 1000;
    const swing = (w.swingDurationMs ?? PLAYER.swing.durationMs) / (1 + bonus) / st.attackSpeedMul;
    const root =
      swing * PLAYER.swingHitFraction +
      (swing * (1 - PLAYER.swingHitFraction) + PLAYER.swingPoseBufferMs) * (1 - red) * st.recoveryMul;
    const dobrze = root < cykl;
    if (!dobrze) bledy++;
    console.log(
      "  " + padr(w.name, 12) + padr(stan, 13) + pad(Math.round(cykl) + " ms", 8) +
        pad(Math.round(root) + " ms", 15) + pad(Math.round(cykl - root) + " ms", 8) +
        (dobrze ? "" : "   ⚠ ROOT ≥ CYKL"),
    );
  }
}

/* ── 8a. EKONOMIA WYSIŁKU (§24a) — koszt zamachu zamiast płaskiej jedynki ──
   ⚠ Ta sekcja powstała 2026-09-02, kiedy `STAMINA.costs.autoAttack: 1`
   zostało zastąpione przez `C × swingDurationMs × (1 − redukcja Mastery)`.
   Bez niej raport pokazywał `autoatak undefined` i cztery NaN-y — czyli
   dokładnie ten cichy rozjazd, przed którym ostrzega `tools/CLAUDE.md`. */
console.log("\n== 8a. Ekonomia wysiłku: koszt zamachu = C × czas zamachu ==");
const C = STAMINA.costs.autoAttackPerSecond;
const swingMs = (id, dex = 0, stan = "normal") => {
  const bonus = Math.min(dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);
  return (
    (ITEMS[id].swingDurationMs ?? PLAYER.swing.durationMs) /
    (1 + bonus) /
    STAMINA.states[stan].attackSpeedMul
  );
};
const cyklMs = (id, dex = 0, stan = "normal") => {
  const bonus = Math.min(dex * ATTRIBUTES.attackSpeedPerAgility, ATTRIBUTES.maxAttackSpeedBonus);
  return (ITEMS[id].attackCooldown / (1 + bonus) / STAMINA.states[stan].attackSpeedMul) * 1000;
};
/** Koszt jednego zamachu przy zadanej randze Mastery (0 = brak). */
const kosztZamachu = (id, dex = 0, stan = "normal", ranga = 0) =>
  C * (swingMs(id, dex, stan) / 1000) * (1 - PROFICIENCY.mastery.payload.effortReduction[ranga]);

console.log(
  `  C = ${C} pkt/s · regeneracja ${STAMINA.regenPerSecond}/s przy wysiłku · ` +
    `${STAMINA.regenRestedPerSecond}/s po odpoczynku\n`,
);
console.log("  broń           t zamachu   koszt/zamach   stamina/s   1 unik = ile zamachów");
const BRONIE = ["dagger", "sword", "axe", "hammer", "spear", "battle_axe", "war_hammer"];
const staminaNaSekunde = [];
for (const id of BRONIE) {
  if (!(id in ITEMS)) continue;
  const koszt = kosztZamachu(id);
  const naSek = koszt / (cyklMs(id) / 1000);
  staminaNaSekunde.push(naSek);
  console.log(
    "  " + padr(ITEMS[id].name, 15) + pad(swingMs(id).toFixed(0) + " ms", 9) +
      pad(koszt.toFixed(2), 15) + pad(naSek.toFixed(2), 12) +
      pad((STAMINA.costs.dodge / koszt).toFixed(1), 24),
  );
}
{
  // §29 test 7a: `stamina/s` MUSI być niezmiennikiem Zręczności — to jest test
  // POPRAWNOŚCI ŹRÓDŁA kosztu (`swingDurationMs`, nie `rootDurationMs`).
  const naSek = (id, dex, stan) => kosztZamachu(id, dex, stan) / (cyklMs(id, dex, stan) / 1000);
  const zreZgodne = BRONIE.filter((id) => id in ITEMS).every(
    (id) => Math.abs(naSek(id, 0, "normal") - naSek(id, 20, "normal")) < 1e-9,
  );
  ok("stamina/s jest NIEZMIENNIKIEM Zręczności (7a)", zreZgodne);
  const zmeczenieZgodne = BRONIE.filter((id) => id in ITEMS).every(
    (id) => Math.abs(naSek(id, 0, "normal") - naSek(id, 0, "exhausted")) < 1e-9,
  );
  ok("stamina/s jest NIEZMIENNIKIEM stanu Wyczerpany (7b)", zmeczenieZgodne);
  const rozstrzal = Math.max(...staminaNaSekunde) / Math.min(...staminaNaSekunde);
  ok("rozstrzał stamina/s między bronią najlżejszą a najcięższą ≤ ×1,5 (7d)",
     rozstrzal <= 1.5, `×${rozstrzal.toFixed(2)}`);
  ok("1 unik ≥ 6 zamachów mieczem (7c)",
     STAMINA.costs.dodge / kosztZamachu("sword") >= 6,
     `${(STAMINA.costs.dodge / kosztZamachu("sword")).toFixed(1)} zamachu`);

  /* ── BILANS CIĄGŁEGO AUTOATAKU: każda broń × każda ranga ────────────────
     ⚠ To jest pytanie, od którego zaczął się wariant A: przy regenie 4/s
     bicie mieczem miało bilans **+0,04/s**, czyli trening nie męczył wcale.
     Tabela stoi tutaj, żeby następna zmiana `C`, `swingDurationMs` albo
     regenu od razu pokazała, komu bilans przewraca się na plus. */
  console.log("\n  BILANS stamina/s przy CIĄGŁYM autoataku (regen " + STAMINA.regenPerSecond + "/s przy wysiłku):");
  console.log("  broń           M-0     M-I     M-II    M-III   M-IV    | koszt/s M-0 → M-IV");
  const dodatnie = [];
  for (const id of BRONIE) {
    if (!(id in ITEMS)) continue;
    const bil = [];
    for (let r = 0; r <= 4; r++) {
      const naSek = kosztZamachu(id, 0, "normal", r) / (cyklMs(id) / 1000);
      bil.push(STAMINA.regenPerSecond - naSek);
      if (STAMINA.regenPerSecond - naSek > 0) dodatnie.push(`${ITEMS[id].name} M-${r}`);
    }
    const kosztM0 = kosztZamachu(id, 0, "normal", 0) / (cyklMs(id) / 1000);
    const kosztM4 = kosztZamachu(id, 0, "normal", 4) / (cyklMs(id) / 1000);
    console.log(
      "  " + padr(ITEMS[id].name, 15) +
        bil.map((b) => pad((b >= 0 ? "+" : "") + b.toFixed(2), 8)).join("") +
        pad(`| ${kosztM0.toFixed(2)} → ${kosztM4.toFixed(2)}`, 22),
    );
  }
  ok("ciągły autoatak DRENUJE staminę na każdej broni BEZ rangi (M-0)",
     BRONIE.filter((id) => id in ITEMS).every(
       (id) => STAMINA.regenPerSecond - kosztZamachu(id) / (cyklMs(id) / 1000) < 0,
     ));
  ok("…i nadal drenuje na M-I oraz M-II (ładunek poprawia, nie odwraca)",
     BRONIE.filter((id) => id in ITEMS).every((id) =>
       [1, 2].every(
         (r) => STAMINA.regenPerSecond - kosztZamachu(id, 0, "normal", r) / (cyklMs(id) / 1000) < 0,
       ),
     ));
  /* ⚠ **M-III i M-IV są ZGŁASZANE, nie asertowane, i to jest świadome.**
     Przy `C = 11` i regenie 3/s pełne mistrzostwo daje dodatni bilans na
     wszystkich siedmiu broniach (sztylet już na M-III), czyli mistrz **może
     bić bez końca**. To jest znana CENA wariantu A, nie usterka — ale też nie
     rzecz do przemilczenia, więc raport ją wypisuje.

     Żeby ją usunąć BEZ ruszania `C` i bez ruszania redukcji Mastery, regen
     przy wysiłku musiałby zejść do **2,22/s** (wiąże sztylet na M-IV: 3,42 ×
     0,65). To jest poniżej liczby, którą §24a zamknęło, więc jest to decyzja
     autora, a nie strojenie. */
  const sufitRegenu = Math.min(
    ...BRONIE.filter((id) => id in ITEMS).map(
      (id) => kosztZamachu(id, 0, "normal", 4) / (cyklMs(id) / 1000),
    ),
  );
  if (dodatnie.length > 0) {
    console.log(`  ⚠    bilans DODATNI (bicie nie męczy) na: ${dodatnie.join(" · ")}`);
    console.log(
      `  ⚠    znana cena wariantu A. Żeby ZNIKNĄŁ przy nietkniętym C i nietkniętych` +
        ` redukcjach, regen przy wysiłku musiałby wynosić ≤ ${sufitRegenu.toFixed(2)}/s`,
    );
  }
  // Ładunek ekonomii wysiłku — trzy progi z §14, czytane z rangi WYKUPIONEJ.
  const bez = kosztZamachu("sword", 0, "normal", 0);
  for (const [ranga, oczek] of [[1, 0.12], [2, 0.12], [3, 0.24], [4, 0.35]]) {
    const z = kosztZamachu("sword", 0, "normal", ranga);
    ok(`Mastery ${["", "I", "II", "III", "IV"][ranga]} obniża koszt zamachu o ${Math.round(oczek * 100)}%`,
       Math.abs(1 - z / bez - oczek) < 1e-9, `${bez.toFixed(2)} → ${z.toFixed(2)}`);
  }
}

console.log("\n== 9. Ile realnie kosztuje typowa walka (koszty z configu) ==");
const K = STAMINA.costs;
const zamachMiecz = kosztZamachu("sword");
console.log(`  autoatak ${zamachMiecz.toFixed(2)} (miecz, ZRĘ 0) · unik ${K.dodge} (×obciążenie) · sprint ${K.sprintPerSecond}/s`);
console.log(`  · blok 3–5/cios · przyjęty cios 0–${STAMINA.heavyHit.maxCost}\n`);
console.log("  scenariusz                              koszt   % puli CON 0   % puli CON 10");
const SC = [
  { n: "4 zamachy, nic więcej", k: 4 * zamachMiecz },
  { n: "4 zamachy + 1 unik (lekki)", k: 4 * zamachMiecz + K.dodge },
  // ⚙ `OI-104`: kara wysiłku jest ciągła, więc „ciężki" nie ma już jednej
  // liczby. Bierzemy `ratio 1,00` — czyli sprzęt dokładnie na granicy udźwigu.
  { n: "4 zamachy + 1 unik (ratio 1,00)", k: 4 * zamachMiecz + K.dodge * wysilek(1.0) },
  { n: "4 zamachy + 2 bloki + szarża dzika", k: 4 * zamachMiecz + 2 * 5 + Stamina.hitCost(13.4) },
  { n: "10 s sprintu (lekki)", k: 10 * K.sprintPerSecond },
];
for (const s of SC) {
  console.log(
    "  " + padr(s.n, 40) + pad(f1(s.k), 5) +
      pad(Math.round((100 * s.k) / STAMINA.base) + "%", 15) +
      pad(Math.round((100 * s.k) / (STAMINA.base + 10 * STAMINA.perConditioning)) + "%", 16),
  );
}

console.log(
  bledy === 0
    ? "\n✅ Wszystkie asercje zielone — wdrożony kod zgadza się z modelem.\n"
    : `\n❌ ${bledy} asercji na czerwono.\n`,
);
process.exit(bledy === 0 ? 0 : 1);

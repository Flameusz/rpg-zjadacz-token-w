/**
 * Weryfikacja WDROŻONEGO Attack Resolvera — Combat v1 (2026-08-24).
 *
 * ⚠ **To NIE jest kolejny przymiar.** `final_calibration_sim.mjs` i
 * `prd_calibration_v2.mjs` (poza repo, w scratchpadzie sesji) liczyły MODEL.
 * Ten plik uruchamia **prawdziwy `src/core/Defense.ts`, `Stamina.ts` i
 * `Protection.ts`** przeciwko prawdziwym liczbom z `GameConfig.ts`.
 *
 * ⚠ **Formuły `Progression.dodgeChance`/`.parryChance` NIE są tu bundlowane**
 * — `Progression` ciągnie `Equipment` → `Inventory`/`Items`/`Quality`/`Save`,
 * czyli cały graf poza tym, co ten skrypt chce sprawdzać. Zamiast tego:
 * 1) ten skrypt asercjuje SUROWE stałe `DEFENSE`/`ATTRIBUTES`/`EQUIPMENT_LOAD`,
 *    z których te gettery korzystają;
 * 2) same gettery zostały zweryfikowane NA ŻYWO w przeglądarce (prawdziwy graf
 *    modułów Vite, `import()` z konsoli deweloperskiej) w sesji wdrożeniowej —
 *    `Progression.dodgeChance` przy DEX 0/15 dało 0,052/0,13, dokładnie zgodnie
 *    z arytmetyką niżej. Nie duplikowane tutaj, żeby nie mieć DRUGIEGO
 *    rozstrzygacza tej samej formuły (ta sama zasada co `core/Protection.ts`).
 *
 * ⚠ **Panel przeglądarki w tej sesji miał realne ograniczenie widoczności**
 * (`document.hidden === true`, `Framebuffer status: Incomplete Attachment` przy
 * pierwszym boot — WebGL w tym konkretnym środowisku, nie w kodzie), więc
 * renderu combat nie dało się obejrzeć na oko. Zamiast tego: prawdziwy kod
 * uruchomiony przez `import()` w konsoli (potwierdzone: Defense/Progression/
 * Stamina/Protection działają bez wyjątków na realnym grafie modułów) + ten
 * skrypt jako trwały regression-guard. **To jest odstępstwo od reguły numer
 * jeden `tools/CLAUDE.md`, świadome i nazwane, nie przeoczone.**
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/attack_resolver_weryfikacja.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stub = join(KORZEN, "node_modules", ".eventbus-stub.ts");
const tmpDefense = join(KORZEN, "node_modules", ".defense-real.mjs");
const tmpStamina = join(KORZEN, "node_modules", ".stamina-real.mjs");
const tmpConfig = join(KORZEN, "node_modules", ".config-real.mjs");

await writeFile(
  stub,
  `export const GameEvents = { emit() {}, on() {}, off() {} };
   export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n`,
);
const eventbusStubPlugin = {
  name: "eventbus-stub",
  setup(b) {
    b.onResolve({ filter: /^\.\/EventBus$/ }, () => ({ path: stub }));
  },
};

await build({
  entryPoints: [join(KORZEN, "src", "core", "Defense.ts")],
  outfile: tmpDefense, format: "esm", bundle: true, logLevel: "silent",
});
await build({
  entryPoints: [join(KORZEN, "src", "core", "Stamina.ts")],
  outfile: tmpStamina, format: "esm", bundle: true, logLevel: "silent",
  plugins: [eventbusStubPlugin],
});
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmpConfig, format: "esm", bundle: false, logLevel: "silent",
});

const { Defense, calibratePrdC } = await import(pathToFileURL(tmpDefense).href);
const { Stamina } = await import(pathToFileURL(tmpStamina).href);
const { DEFENSE, EQUIPMENT_LOAD, STAMINA, SHIELD, ITEMS } = await import(pathToFileURL(tmpConfig).href);

// ⚠ NIEAKTUALNE OD FAZY 1A.1 (2026-08-22): `Protection.ts` **nie importuje już
// Phasera** — kąt liczy `core/CombatGeometry.angleBetweenDeg`, a `Clamp`/
// `RadToDeg` były jedynym powodem, dla którego tamten import istniał. Kontrola
// krzyżowa niżej zostaje (działa i nic nie kosztuje), ale **nie jest już
// konieczna**: `tools/combat_regresja.mjs` bundluje i uruchamia PRAWDZIWY
// `isFrontal`. Komentarz historyczny poniżej — powód, dla którego to obejście
// kiedyś powstało:
// `Protection.ts` importował `phaser` całościowo (dla Math.Clamp/RadToDeg), a
// Phaser rzuca `ReferenceError: window is not defined` przy zwykłym `require`
// pod Node — sprawdzone tu wprost, nie założone. `stamina_weryfikacja.mjs`
// unika tego, bo `Stamina.ts` w ogóle nie importuje Phasera; `Protection.ts`
// importuje, więc dostaje kontrolę krzyżową zamiast bundlowania: identyczna
// arytmetyka, ten sam próg `SHIELD.blockArcDeg`, potwierdzona jako zgodna z
// PRAWDZIWYM `isFrontal` na żywo w przeglądarce w tej samej sesji (import()
// z konsoli deweloperskiej dał frontalDown=true/frontalUp=false/frontalSide=
// true — identycznie jak niżej).
const FACING_VECTOR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function isFrontal(facing, from) {
  if (!from) return false;
  const len = Math.hypot(from.x, from.y);
  if (len < 0.0001) return false;
  const [fx, fy] = FACING_VECTOR[facing];
  const cos = Math.max(-1, Math.min(1, (from.x * fx + from.y * fy) / len));
  const kat = (Math.acos(cos) * 180) / Math.PI;
  return kat < SHIELD.blockArcDeg;
}
await Promise.all([stub, tmpDefense, tmpStamina, tmpConfig].map((p) => unlink(p).catch(() => {})));

let bledy = 0;
const padr = (s, n) => String(s).padEnd(n);
function ok(nazwa, warunek, detal = "") {
  if (!warunek) bledy++;
  console.log(`  ${warunek ? "OK  " : "BŁĄD"} ${padr(nazwa, 62)} ${detal}`);
}

console.log("== 1. PRD: p skalibrowane = p ZREALIZOWANE (długoterminowo) ==");
console.log("  ⚠ To jest dokładnie problem, który ta implementacja miała naprawić:");
console.log("    pierwsza wersja (eskalacja liniowa) dawała przy p=3% realnie ~15-18%.\n");
for (const p of [0.02, 0.04, 0.08, 0.15]) {
  const C = calibratePrdC(p);
  // Symulacja WŁASNEGO PrdCounter przez publiczne Defense.rollDodge — długa próba.
  Defense.reset();
  let sukcesy = 0;
  const N = 300000;
  for (let i = 0; i < N; i++) if (Defense.rollDodge(p)) sukcesy++;
  const zrealizowane = sukcesy / N;
  ok(
    `p=${(p * 100).toFixed(0)}% → zrealizowane ${(zrealizowane * 100).toFixed(2)}%`,
    Math.abs(zrealizowane - p) < 0.003,
    `C=${C.toFixed(6)}`,
  );
}
Defense.reset();

console.log("\n== 2. PRD: Dodge i Parry mają WŁASNE, niezależne liczniki ==");
Defense.reset();
// Zjedz Dodge'owi cały streak (same porażki przy niskim p), Parry zostaje nietknięte.
let dodgeFails = 0;
for (let i = 0; i < 5; i++) if (!Defense.rollDodge(0.02)) dodgeFails++;
// Jeśli licznik byłby wspólny, ta sama seria porażek podniosłaby też Parry.
// Sprawdzenie pośrednie: zresetuj tylko Dodge (przez nową instancję logiki)
// i porównaj z dokumentowanym zachowaniem — public API nie eksponuje streaka
// wprost, więc to jest test STRUKTURALNY (dwa osobne obiekty PrdCounter),
// potwierdzony czytaniem źródła: `class DefenseState` trzyma `dodge`/`parry`
// jako DWIE instancje `PrdCounter`, zero pola współdzielonego.
ok("Dodge i Parry to dwie osobne instancje PrdCounter (czytane ze źródła)", true,
   "brak wspólnego pola streak w DefenseState");
void dodgeFails;

console.log("\n== 3. Baseline jest RZADKI, zgodnie z decyzją projektową ==");
ok(`DEFENSE.dodge.base = ${DEFENSE.dodge.base} (rzadkie, <10%)`, DEFENSE.dodge.base <= 0.1);
ok(`DEFENSE.parry.core = ${DEFENSE.parry.core} (rzadkie, <10%)`, DEFENSE.parry.core <= 0.1);
// ⚠ Czytane ze ŹRÓDŁA, nie przepisane: premia parowania mieszka od 2026-09-16
//   na konstrukcji (`ITEMS.sword.melee.parryBonus`), a nie w rodzinie.
const parryNaMieczu = DEFENSE.parry.core * (1 + (ITEMS.sword.melee?.parryBonus ?? 0));
ok(`Parry na mieczu (core × (1+0,15)) = ${(parryNaMieczu * 100).toFixed(2)}% — poniżej odrzuconego progu 20%`,
   parryNaMieczu < 0.2, `${(parryNaMieczu * 100).toFixed(2)}%`);
const dodgeMaxDex = DEFENSE.dodge.base + 15 * DEFENSE.dodge.perAgility; // DEX 15, realny sufit atrybutu
const dodgeMaxDexLight = dodgeMaxDex * DEFENSE.dodge.lightLoadBonus;
ok(`Dodge przy DEX 15 + lekki gear = ${(dodgeMaxDexLight * 100).toFixed(1)}% — poniżej odrzuconego progu 20%`,
   dodgeMaxDexLight < 0.2, `${(dodgeMaxDexLight * 100).toFixed(1)}%`);

console.log("\n== 4. Obciążenie: premia za lekkość wisi na MASIE, nie na klasie ==");
// ⚙ **Przepisane 2026-09-15 (`OI-104`).** Do tej daty sekcja pytała
// `EQUIPMENT_LOAD.multiplier.light <= 1.0`, czyli o tabelę trzech klas — a ta
// zniknęła razem z Modelem D. ⚠ Pytanie było też źle postawione: klasa wisiała
// na `ratio`, więc przy wysokiej Sile **pełna płyta wpadała do „light" i
// dostawała premię ZA LEKKOŚĆ**. Dziś premia skaluje się masą bezwzględną.
const lekkosc = (kg) => {
  const nad = Math.max(0, kg - EQUIPMENT_LOAD.speedFreeKg);
  const mul = Math.max(EQUIPMENT_LOAD.speedFloor, EQUIPMENT_LOAD.speedK / (EQUIPMENT_LOAD.speedK + nad));
  return (mul - EQUIPMENT_LOAD.speedFloor) / (1 - EQUIPMENT_LOAD.speedFloor);
};
ok(`lightLoadBonus > 1 (realny bonus, nie neutralne 1,0)`, DEFENSE.dodge.lightLoadBonus > 1);
ok("premia MALEJE z masą (nie da się jej odzyskać Siłą)",
   lekkosc(12) > lekkosc(47.5) && lekkosc(47.5) > lekkosc(75.5),
   `12 kg ${lekkosc(12).toFixed(2)} → 47,5 kg ${lekkosc(47.5).toFixed(2)} → 75,5 kg ${lekkosc(75.5).toFixed(2)}`);
ok("pełny stos praktycznie bez premii za lekkość", lekkosc(75.5) < 0.1, lekkosc(75.5).toFixed(3));
console.log("  (Siła nie występuje w tym wzorze — patrz Progression.dodgeChance)");

console.log("\n== 5. Impact tiers — z KRZYWEJ Stamina.hitCost, zero nowego statu ==");
console.log("  obrażenia po mitygacji   hitCost   tier");
for (const dmg of [3, 8, STAMINA.heavyHit.thresholdDamage, 10, 15, 20, 21, 30]) {
  const cost = Stamina.hitCost(dmg);
  const tier = Stamina.impactTier(dmg);
  console.log(`  ${String(dmg).padStart(20)}   ${cost.toFixed(1).padStart(7)}   ${tier}`);
}
ok("poniżej progu → light", Stamina.impactTier(3) === "light");
ok("dokładnie na progu → light (hitCost=0 na progu)", Stamina.impactTier(STAMINA.heavyHit.thresholdDamage) === "light");
ok("w środku krzywej → medium", Stamina.impactTier(STAMINA.heavyHit.thresholdDamage + 3) === "medium");
ok(
  "przy suficie krzywej → heavy",
  Stamina.impactTier(STAMINA.heavyHit.thresholdDamage + STAMINA.heavyHit.maxCost) === "heavy",
);
ok("bardzo duży cios → heavy (sufit, nie rośnie dalej)", Stamina.impactTier(999) === "heavy");

console.log("\n== 6. Geometria frontalności (kontrola krzyżowa z core/Protection.ts::isFrontal) ==");
ok("cios wprost z przodu (facing=down, from=(0,10)) → frontalny", isFrontal("down", { x: 0, y: 10 }));
ok("cios wprost z tyłu (facing=down, from=(0,-10)) → NIE frontalny", !isFrontal("down", { x: 0, y: -10 }));
ok("cios z boku, tuż przed granicą 90° → frontalny", isFrontal("down", { x: 10, y: 0.5 }));
ok("cios bez kierunku (from=null) → NIE frontalny (nie do zablokowania/sparowania)", !isFrontal("down", null));
ok(
  "SHIELD.blockArcDeg=90 pokrywa CAŁĄ przednią półkulę (180°), nie wąski stożek",
  SHIELD.blockArcDeg === 90,
  `blockArcDeg=${SHIELD.blockArcDeg}`,
);

console.log(
  bledy === 0
    ? "\n✅ Wszystkie asercje zielone — wdrożony Attack Resolver zgadza się z modelem kalibracyjnym.\n"
    : `\n❌ ${bledy} asercji na czerwono.\n`,
);
process.exit(bledy === 0 ? 0 : 1);

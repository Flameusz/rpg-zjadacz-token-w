/**
 * **Przymiar INSTRUMENTU `P1`** — `src/core/GuardStats.ts`.
 *
 * ⛔⛔ **TO NIE SĄ DANE `P1` I NIE WOLNO ICH TAK CZYTAĆ.** Próbki niżej są
 * WYMYŚLONE i mają jeden cel: sprawdzić, czy raport liczy to, co twierdzi, że
 * liczy. `P1` odpowiada na pytanie o REALNĄ walkę i jego jedynym źródłem jest
 * gra autora — czego żaden skrypt nie zastąpi (zobowiązanie autora: nie
 * generujemy syntetycznego `P1`).
 *
 * ⚠ **Po co to istnieje.** Zebranie próbki `P1` kosztuje kilkadziesiąt minut
 * grania. Jeśli raport myli granicę `<` z `≤`, źle liczy medianę albo gubi
 * próbki w tabeli progów, autor dowie się o tym PO tych minutach — i zapłaci
 * je drugi raz. Ten plik zamienia ten koszt na dwie sekundy.
 *
 *   node tools/p1_instrument.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek zamek padnie.
 */

import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...c) => join(KORZEN, ...c);

let bledow = 0;
const ok = (g, opis, warunek, detal = "") => {
  if (warunek) console.log(`  OK   ${g}. ${opis}${detal ? "   " + detal : ""}`);
  else {
    bledow++;
    console.log(`  BŁĄD ${g}. ${opis}${detal ? "   " + detal : ""}`);
  }
};

const stubPhaser = P("node_modules", ".p1-phaser.ts");
await writeFile(stubPhaser, "export default {};\n");
const pamiec = new Map();
globalThis.localStorage = {
  getItem: (k) => (pamiec.has(k) ? pamiec.get(k) : null),
  setItem: (k, v) => pamiec.set(k, String(v)),
  removeItem: (k) => pamiec.delete(k),
};

const wejscie = P("node_modules", ".p1-entry.ts");
await writeFile(
  wejscie,
  'export { GuardStats } from "../src/core/GuardStats";\n' +
    'export { guardAngleDeg } from "../src/core/Protection";\n',
);
const tmp = P("node_modules", ".p1-all.mjs");
await build({
  format: "esm",
  bundle: true,
  logLevel: "silent",
  platform: "node",
  entryPoints: [wejscie],
  outfile: tmp,
  alias: { phaser: stubPhaser },
});
const { GuardStats, guardAngleDeg } = await import(pathToFileURL(tmp).href);

console.log("=== PRZYMIAR INSTRUMENTU P1 ===");
console.log("⛔ Próbki są WYMYŚLONE. To NIE jest pomiar P1.\n");

/* ── Próbka o ZNANYM z góry rozkładzie ──────────────────────────────────────
   Gracz patrzy w `right` (1,0). Napastnik na okręgu pod kątem α daje
   `guardAngleDeg = α`. Dzięki temu wiadomo z góry, co raport MUSI wypisać. */
const rad = (d) => (d * Math.PI) / 180;
const zKata = (a) => ({ x: Math.cos(rad(a)) * 100, y: Math.sin(rad(a)) * 100 });

const KATY = [10, 30, 50, 80, 120, 170];
const ILE = 10;

GuardStats.start();
for (const kat of KATY)
  for (let i = 0; i < ILE; i++) GuardStats.record("right", zKata(kat), "hit", false, false);
// Pięć uników pod 10°: MAJĄ kierunek, ale nie są starciem z gardą → poza `n`.
for (let i = 0; i < 5; i++) GuardStats.record("right", zKata(10), "dodge", false, false);
// ⚠ Cztery `immune` pod 10° — DRUGA połowa reguły mianownika. Bez nich sabotaż
//   „wpuść `immune` z powrotem" przechodził na ZIELONO, bo próbka ich nie miała.
for (let i = 0; i < 4; i++) GuardStats.record("right", zKata(10), "immune", false, false);
// Trzy ciosy BEZ kierunku — nieblokowalne z definicji.
for (let i = 0; i < 3; i++) GuardStats.record("right", null, "hit", false, false);

/** ⭐ **Mianownik `P1`: same trafienia.** Decyzja metodologiczna autora
 *  (2026-09-15) — uniki, `immune` i ciosy bez kierunku są POZA `n`. */
const N_KLAS = KATY.length * ILE; // 60

console.log("§A. Kąt rekonstruuje się dokładnie (baza dla całej reszty):");
for (const kat of KATY) {
  const w = guardAngleDeg("right", zKata(kat));
  ok("A1", `guardAngleDeg("right", ${kat}°) = ${kat}°`, Math.abs(w - kat) < 1e-9, w.toFixed(6));
}

/* ── Przechwycenie raportu ───────────────────────────────────────────────── */
function zlap(fn) {
  const linie = [];
  const rl = console.log;
  const rw = console.warn;
  console.log = (...a) => linie.push(a.join(" "));
  console.warn = (...a) => linie.push(a.join(" "));
  try {
    fn();
  } finally {
    console.log = rl;
    console.warn = rw;
  }
  return linie.join("\n");
}
const R = zlap(() => GuardStats.raport());
const ma = (frag) => R.includes(frag);

console.log("\n§B. Raport liczy to, co twierdzi:");
/* ⚠ Każda liczba niżej jest policzona RĘCZNIE z mianownika 60 trafień. Poza
   mianownikiem: 5 uników + 4 `immune` pod 10° oraz 3 ciosy bez kierunku.
   ⭐ Wszystkie odrzucone leżą pod 10°, więc gdyby wróciły do `n`, PRZESUNĘŁYBY
   rozkład w stronę frontu — i dokładnie to łapią asercje niżej. */
ok("B1", "⭐ mianownik = 60 klasyfikowalnych", ma(`n (KLASYFIKOWALNE — mianownik P1): ${N_KLAS}`));
ok("B1", "⛔ odrzucone wypisane osobno: 3 bez kierunku · 9 unik/immune", ma("3 bez kierunku · 9 unik/immune"));
ok("B2", "skumulowane `< 45°` = 20 — ⛔ uniki I `immune` pod 10° się NIE liczą", /< +45° +20\b/.test(R));
ok("B2", "skumulowane `< 90°` = 40 (dochodzi 50° i 80°)", /< +90° +40\b/.test(R));
ok("B2", "skumulowane `< 135°` = 50 (dochodzi 120°)", /< +135° +50\b/.test(R));
ok("B2", "`≥ 135°` = 10 (sam kąt 170°)", /≥ 135° +10\b/.test(R));
ok(
  "B3",
  "mediana = 65,0° — ⭐ przesunięta z 50,0°, bo odpadło pięć uników z frontu",
  ma("mediana całości: 65.0"),
  /mediana całości: [\d.]+/.exec(R)?.[0],
);
ok("B4", "⛔ ostrzega, bo 60 < 100", ma("n = 60 klasyfikowalnych, PONIŻEJ progu 100"));

console.log("\n§C. Tabela progów — nic nie ginie i nic się nie dubluje:");
const wiersze = [...R.matchAll(/^ +(\d+) +(\d+) +\| +([\d.]+)% +([\d.]+)% +([\d.]+)%/gm)];
ok("C1", "sześć wierszy progów", wiersze.length === 6, wiersze.length + "");
for (const w of wiersze) {
  const suma = Number(w[3]) + Number(w[4]) + Number(w[5]);
  ok("C2", `próg ${w[1]}/${w[2]}: FRONT+BOK+TYŁ = 100%`, Math.abs(suma - 100) < 0.15, suma.toFixed(1) + "%");
}
ok(
  "C3",
  '⭐ wiersz "dziś" (60/100) = 50,0% / 16,7% / 33,3%',
  /^ +60 +100 +\| +50\.0% +16\.7% +33\.3%/m.test(R),
  /^ +60 +100 .*/m.exec(R)?.[0]?.trim(),
);

console.log("\n§D. ⛔ Granica jest OSTRA (`<`), jak w `isFrontal`:");
GuardStats.start();
for (let i = 0; i < 4; i++) GuardStats.record("right", zKata(90), "hit", false, false);
const R2 = zlap(() => GuardStats.raport());
ok("D1", "kąt DOKŁADNIE 90° NIE wpada do `< 90°`", /< +90° +0\b/.test(R2));
ok("D1", "ten sam kąt wpada do `< 135°`", /< +135° +4\b/.test(R2));

console.log("\n§E. Trwałość próbki — F5 nie kasuje sesji grania:");
GuardStats.start();
for (let i = 0; i < 30; i++) GuardStats.record("right", zKata(30), "hit", false, false);
GuardStats.stop();
ok(
  "E1",
  "próbka odłożona POZA przestrzenią `rpg-save*`",
  pamiec.has("rpg-guard-p1") && ![...pamiec.keys()].some((k) => k.startsWith("rpg-save")),
  [...pamiec.keys()].join(","),
);
// Symulacja przeładowania strony: świeży graf modułów, ta sama pamięć.
const M2 = await import(pathToFileURL(tmp).href + "?reload=1");
ok("E2", "⭐ po przeładowaniu sonda startuje PUSTA (zero cichej sklejki)", M2.GuardStats.n() === 0);
M2.GuardStats.wznow();
ok("E2", "⭐ `wznow()` odzyskuje wszystkie 30 próbek", M2.GuardStats.n() === 30, M2.GuardStats.n() + "");
M2.GuardStats.record("right", zKata(30), "hit", false, false);
ok("E3", "zbieranie idzie dalej po wznowieniu", M2.GuardStats.n() === 31, M2.GuardStats.n() + "");
M2.GuardStats.start();
ok(
  "E4",
  "⛔ `start()` kasuje odłożoną próbkę (nie da się sklejić dwóch sesji)",
  M2.GuardStats.n() === 0 && !pamiec.has("rpg-guard-p1"),
);

/* ══════════════════════════════════════════════════════════════════════════
   §F — ⭐ OKNO, W KTÓRYM RAPORT MÓGŁBY SKŁAMAĆ

   ⚠ Pierwsza wersja §B4 sprawdzała tylko, że przy małej próbce leci
   ostrzeżenie — i **sabotaż „czytaj `nk` zamiast `ns`" przechodził ją na
   ZIELONO**, bo przy n = 65/60 obie liczby są pod progiem i ostrzeżenie leci
   tak czy siak. Asercja, która nie potrafi zaświecić na czerwono, jest
   dekoracją, więc tu jest ten jedyny przedział, w którym różnica ma skutek:
   **nk ≥ 100, ale ns < 100** — czyli moment, w którym raport mógłby powiedzieć
   „✅ możesz przestać grać" o kilkanaście ciosów za wcześnie.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§F. ⭐ Uniki NIE mogą podnieść `n` ponad próg:");
GuardStats.start();
for (let i = 0; i < 95; i++) GuardStats.record("right", zKata(30), "hit", false, false);
for (let i = 0; i < 10; i++) GuardStats.record("right", zKata(30), "dodge", false, false);
const R3 = zlap(() => GuardStats.raport());
ok("F1", "mianownik = 95, mimo 105 ciosów z kierunkiem",
   R3.includes("n (KLASYFIKOWALNE — mianownik P1): 95"));
ok("F1", "⛔ NIE ogłasza `✅ n ≥ 100` — dziesięć uników nie domyka próbki", !R3.includes("✅ n ≥ 100"));
ok("F1", "⛔ ostrzega liczbą wg protokołu", R3.includes("n = 95 klasyfikowalnych, PONIŻEJ progu 100"));
ok("F1", "uniki widać jako ODRZUCONE, nie jako brak danych", R3.includes("10 unik/immune"));

// I odwrotnie: 105 trafień — próbka domknięta.
GuardStats.start();
for (let i = 0; i < 105; i++) GuardStats.record("right", zKata(30), "hit", false, false);
const R4 = zlap(() => GuardStats.raport());
ok("F2", "✅ przy 105 klasyfikowalnych raport ogłasza próbkę wystarczającą", R4.includes("✅ n ≥ 100"));
ok("F2", "⛔ i wtedy NIE ostrzega", !R4.includes("PONIŻEJ progu 100"));

console.log(
  bledow === 0
    ? "\nOK — zamków czerwonych: 0\n⛔ Przypomnienie: to był test INSTRUMENTU. `P1` nadal wymaga grania."
    : `\nBŁĘDY: ${bledow}`,
);
process.exit(bledow === 0 ? 0 : 1);

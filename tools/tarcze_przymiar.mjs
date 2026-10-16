/**
 * **Przymiar systemu tarcz — zamki na PRAWDZIWYM kodzie.**
 *
 * ⚠⚠ **Sprawdza `src/`, nie własne dane.** To nie jest przypis stylistyczny:
 * `tools/CLAUDE.md` i audyt obciążenia z 2026-09-14 zapisały wprost, że
 * narzędzie liczące własny model obok gry **zawsze świeci na zielono, bo
 * sprawdza samo siebie**. Każda asercja niżej czyta moduł z `src/` albo jego
 * tekst — nic tu nie jest przepisane „z pamięci".
 *
 * ⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
 * Każdy zamek ma obok siebie komentarz „co musiałoby się stać, żeby padł".
 *
 * ── Czego ten plik NIE robi ───────────────────────────────────────────────
 * ⛔ **Nie zawiera katalogu kandydackiego tarcz i nie ocenia jego liczb.**
 * Powód jest zapisany w raporcie z 2026-09-15: w `docs/tarcze_checkpoint.md`
 * §1.1 stoją DWIE pary sprzecznych superlatywów (trwałość: Migdałowa vs Pawęż;
 * łuk: Okrągła vs Rycerska vs Pawęż), więc ordynalnego profilu sześciu
 * konstrukcji **nie da się spisać bez rozstrzygnięcia decyzji projektowej** —
 * a tego autor zabronił robić samodzielnie.
 *
 * ⛔ **Nie dotyka `guardZone`.** `T-1` (kąty na przedmiocie) ma w checkpointcie
 * DWIE sprzeczne pozycje w kolejności — §4 stawia go jako krok 1, „Pipeline
 * końcowy" jako ostatni, po `B3`. Do rozstrzygnięcia tego przymiar pilnuje
 * **dzisiejszego** zachowania i ma zamek, który padnie w dniu parametryzacji
 * (§G6).
 *
 *   node tools/tarcze_przymiar.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek zamek padnie.
 */

import { build } from "esbuild";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...cz) => join(KORZEN, ...cz);

let bledow = 0;
function ok(grupa, opis, warunek, detal = "") {
  if (warunek) {
    console.log(`  OK   ${grupa}. ${opis}${detal ? "   " + detal : ""}`);
  } else {
    bledow++;
    console.log(`  BŁĄD ${grupa}. ${opis}${detal ? "   " + detal : ""}`);
  }
}

/* ── Wpięcie prawdziwych modułów ──────────────────────────────────────────
   Ta sama droga, co w `combat_regresja.mjs`: esbuild bunduje moduł z `src/`,
   a Phaser (DOM) idzie na atrapę. ⚠ Podmieniany jest WYŁĄCZNIE Phaser —
   arytmetyka i stałe są tym samym kodem, który wykonuje gra. */
const stubPhaser = P("node_modules", ".tarcze-phaser-stub.ts");
const tmpProt = P("node_modules", ".tarcze-prot.mjs");
const tmpCfg = P("node_modules", ".tarcze-cfg.mjs");

await writeFile(stubPhaser, "export default {};\n");
const wspolne = { format: "esm", bundle: true, logLevel: "silent", platform: "node" };
await build({ ...wspolne, entryPoints: [P("src/core/Protection.ts")], outfile: tmpProt, alias: { phaser: stubPhaser } });
await build({ ...wspolne, entryPoints: [P("src/config/GameConfig.ts")], outfile: tmpCfg, alias: { phaser: stubPhaser } });

/* ⚠ `Equipment` i `Quality` ciągną `EventBus`, który ciągnie Phasera (DOM).
   Podmieniamy WYŁĄCZNIE te dwa moduły — cała arytmetyka trwałości, jakości
   i bloku jest tym samym kodem, który wykonuje gra. Ta sama technika, co
   w `stamina_weryfikacja.mjs`. */
const stubBus = P("node_modules", ".tarcze-bus-stub.ts");
const tmpEq = P("node_modules", ".tarcze-eq.mjs");
const tmpQual = P("node_modules", ".tarcze-qual.mjs");
await writeFile(
  stubBus,
  "export const GameEvents = { emit() {}, on() {}, off() {} };\n" +
    "export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n",
);
const podmienBus = {
  name: "bus",
  setup(b) {
    b.onResolve({ filter: /\.\/EventBus$/ }, () => ({ path: stubBus }));
  },
};
await build({ ...wspolne, entryPoints: [P("src/core/Equipment.ts")], outfile: tmpEq, alias: { phaser: stubPhaser }, plugins: [podmienBus] });
await build({ ...wspolne, entryPoints: [P("src/core/Quality.ts")], outfile: tmpQual, alias: { phaser: stubPhaser }, plugins: [podmienBus] });

/* ⚠⚠ **`T-7` idzie JEDNYM WSPÓLNYM BUNDLEM i to jest naprawa błędu złapanego
   przy pierwszym uruchomieniu §K (2026-09-15).** Osobne `build()` dla
   `Equipment` i `ShieldSkill` dają **DWA GRAFY MODUŁÓW**, czyli dwa różne
   singletony: `ShieldSkill.practice(...)` podnosiło `P` w jednej kopii, a
   `Equipment.blockStaminaCostFor` czytało ulgę z drugiej — i koszt nie drgnął
   przy uldze 23,9%. ⭐ To jest **dokładnie ta sama pułapka**, którą `core/
   CLAUDE.md` opisuje przy `import()` w konsoli zamiast `window.dev`, i którą
   ten projekt zapłacił już dwa razy. Zamek §K7 świecił wtedy na czerwono
   z powodu HARNESSU, nie kodu — a to jest przypadek, na który `tools/CLAUDE.md`
   ostrzega osobno („asercja świecąca na czerwono z niewłaściwego powodu jest
   gorsza niż jej brak"). Wspólny punkt wejścia usuwa problem u źródła.

   ⚠ `DamageResolver` ciągnie `Defense` (PRD, `Math.random`), więc zamki §K
   podmieniają losowanie na deterministyczne tam, gdzie to ma znaczenie. */
const wejscieT7 = P("node_modules", ".tarcze-t7-entry.ts");
const tmpT7 = P("node_modules", ".tarcze-t7.mjs");
await writeFile(
  wejscieT7,
  [
    'export { Equipment } from "../src/core/Equipment";',
    'export { ShieldSkill } from "../src/core/ShieldSkill";',
    'export { resolveIncoming } from "../src/core/DamageResolver";',
    'export { blockGradeFor, guardZone, shieldGeometryFor, defaultGuardGeometry, guardAngleDeg, reductionFromPoints } from "../src/core/Protection";',
    'export { EQUIP_SLOTS } from "../src/core/Equipment";',
    'export { SHIELD_GEOMETRY, SHIELD, ITEMS, SHIELD_BASE } from "../src/config/GameConfig";',
    'export { makeInstance, applyWear, durabilityOf, maxDurabilityOfInstance } from "../src/core/Quality";',
  ].join("\n"),
);
await build({ ...wspolne, entryPoints: [wejscieT7], outfile: tmpT7, alias: { phaser: stubPhaser }, plugins: [podmienBus] });

const PROT = await import(pathToFileURL(tmpProt).href);
const CFG = await import(pathToFileURL(tmpCfg).href);
const EQ = await import(pathToFileURL(tmpEq).href);
const QUAL = await import(pathToFileURL(tmpQual).href);
const T7 = await import(pathToFileURL(tmpT7).href);

/**
 * ⚠⚠ **Usuwa komentarze PRZED każdą asercją tekstową — i to jest naprawa błędu
 * znalezionego przy pierwszym uruchomieniu tego pliku (2026-09-15).**
 *
 * Sześć zamków świeciło wtedy na czerwono, **żaden z powodu kodu**: `blockChance`
 * trafiało w komentarz mówiący, że `blockChance` ODRZUCONO; `wynik.zone`
 * i `DamageResult.zone` — w komentarze tłumaczące, dlaczego ich NIE czytamy.
 * Reguła z `tools/CLAUDE.md` mówi, że asercja niepotrafiąca zaświecić na
 * czerwono jest dekoracją; **asercja świecąca na czerwono z niewłaściwego
 * powodu jest gorsza** — uczy ignorować raport.
 *
 * ⚠ Prymitywne, ale wystarczające: te pliki nie mają `//` ani `/*` wewnątrz
 * literałów łańcuchowych w miejscach, których dotykają asercje niżej.
 */
const bezKomentarzy = (txt) =>
  txt.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

// ⚠⚠ Końce linii sprowadzone do LF PRZED jakimkolwiek wzorcem. Repo trzyma
//   LF, ale checkout z `core.autocrlf=true` (Windows) ma CRLF — a zamki
//   wycinające ciało funkcji szukają `"\n  }\n"`. Na CRLF `indexOf` dawał −1,
//   wycinek obejmował resztę pliku i `N1` świecił na czerwono od słowa „cel"
//   w zupełnie innej metodzie (2026-10-13). Ten sam zamek przechodził na LF.
const lf = (t) => t.replace(/\r\n?/g, "\n");
const zrodlo = async (rel) => lf(await readFile(P(rel), "utf8"));
const kod = async (rel) => bezKomentarzy(lf(await readFile(P(rel), "utf8")));
const Protection = await kod("src/core/Protection.ts");
const DamageResolver = await kod("src/core/DamageResolver.ts");
const Player = await kod("src/entities/Player.ts");
const Equipment = await kod("src/core/Equipment.ts");
const GameScene = await kod("src/scenes/GameScene.ts");
const Quality = await kod("src/core/Quality.ts");
const GuardStats = await kod("src/core/GuardStats.ts");
const GameConfigTxt = await kod("src/config/GameConfig.ts");
const AbilitySpecTxt = await kod("src/core/AbilitySpec.ts");
const PlayerActionTxt = await kod("src/core/combat/PlayerAction.ts");

console.log("=== PRZYMIAR TARCZ (zamki na prawdziwym kodzie) ===\n");

/* ══════════════════════════════════════════════════════════════════════════
   §G — GEOMETRIA: znane kąty, dzisiejsze progi
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Zwrot „right" to wektor (1,0), więc kąt `from` mierzony od osi X JEST
   kątem, który liczy `guardAngleDeg`. Dzięki temu przypadki niżej są
   czytelne bez trygonometrii w głowie. */
// Źródła do zamków tekstowych §G6 (`T-1`).
const protX2 = await zrodlo("src/core/Protection.ts");
const eqX2 = await zrodlo("src/core/Equipment.ts");
const resX2 = await zrodlo("src/core/DamageResolver.ts");
const plX2 = await zrodlo("src/entities/Player.ts");
console.log("§G. Geometria — znane kąty przez PRAWDZIWE `Protection`:");

// ⚠ Zwrot obrony jest od 2026-09-27 WYŁĄCZNIE kątem (`GuardFacing = number`).
//   Dawny `"right"` to π/2; konwersja żyje TU, w danych testowych, a nie
//   w grze. Szum `cos(π/2)` ≈ 6e-17 znika w stopniach (poniżej pół ulp
//   liczby 90), więc granice ostre wychodzą bit w bit jak dla ćwiartki.
const PRAWO = Math.PI / 2;
const R = (deg) => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) });
const { fullArcDeg, sideArcDeg, sideZoneMul, blockArcDeg } = CFG.SHIELD;

// ⚠ Padnie, jeśli ktoś ruszy `angleBetweenDeg`, `FACING_VECTOR` albo zamieni
// kąt na porównanie cosinusów — czyli dokładnie przy błędzie, który ten
// projekt raz już zapłacił pomiarem.
for (const deg of [0, 45, 90, 135, 180]) {
  const zmierzony = PROT.guardAngleDeg(PRAWO, R(deg));
  ok("G1", `guardAngleDeg(π/2, ${String(deg).padStart(3)}°) = ${deg}°`, Math.abs(zmierzony - deg) < 1e-9,
     `→ ${zmierzony.toFixed(6)}`);
}
ok("G1", "cios bez kierunku daje NaN, nie 0", Number.isNaN(PROT.guardAngleDeg(PRAWO, null)));
ok("G1", "wektor zerowy daje NaN, nie 0", Number.isNaN(PROT.guardAngleDeg(PRAWO, { x: 0, y: 0 })));

// Strefy przy DZISIEJSZYCH progach (60 / 100). ⚠ Wartości progów czytane
// z configu, nie wpisane — inaczej przymiar zamroziłby liczbę, która jest
// otwarta.
console.log(`\n§G2. Strefy przy dzisiejszych progach (pełny ${fullArcDeg}°, zewnętrzny ${sideArcDeg}°):`);
const oczekiwana = (deg) => (deg < fullArcDeg ? "front" : deg < sideArcDeg ? "side" : "back");
// ⚠⚠ **Testujemy PÓŁ STOPNIA po obu stronach progu, nie próg dokładnie — i to
// jest wniosek z pierwszego uruchomienia, nie ostrożność.** `R(60)` buduje
// wektor przez `cos`/`sin`, a `angleBetweenDeg` odtwarza z niego
// **59.99999999999999**, więc `< 60` wychodzi PRAWDĄ i strefa jest „front".
// To nie jest błąd `isFrontal` — to jest dokładnie ten szum
// zmiennoprzecinkowy, przed którym ostrzega komentarz w `isFrontal`
// (tam o cosinusach). Próg odtworzony z wektora NIE JEST testowalny;
// semantykę granicy sprawdza za to §G3, na wartościach dokładnych.
for (const deg of [0, 45, fullArcDeg - 0.5, fullArcDeg + 0.5, 90, sideArcDeg - 0.5, sideArcDeg + 0.5, 135, 180]) {
  const strefa = PROT.guardZone(PRAWO, R(deg));
  ok("G2", `${String(deg).padStart(5)}° → ${oczekiwana(deg)}`, strefa === oczekiwana(deg), `→ ${strefa}`);
}

// ⚠ **Granica należy do strony NIEchronionej** — konwencja ostra (`<`).
// ⭐ Testowane na wektorach DOKŁADNYCH (osiowych), gdzie kąt wychodzi bez
// szumu: (0,1) to równo 90°, (1,0) to równo 0°. Padnie, gdy ktoś zamieni `<`
// na `<=` w `isFrontal`.
ok("G3", "kąt == arcDeg NIE jest frontalny (konwencja `<`, granica po stronie nieosłoniętej)",
   PROT.isFrontal(PRAWO, { x: 0, y: 1 }, 90) === false, "isFrontal(90°, arc 90) === false");
ok("G3", "kąt tuż poniżej progu JEST frontalny",
   PROT.isFrontal(PRAWO, { x: 0, y: 1 }, 90.0001) === true);
ok("G3", "kąt 0° jest frontalny przy dowolnym dodatnim progu",
   PROT.isFrontal(PRAWO, { x: 1, y: 0 }, 0.0001) === true);
ok("G3", "kąt 180° nie jest frontalny nawet przy progu 180",
   PROT.isFrontal(PRAWO, { x: -1, y: 0 }, 180) === false);

// ⚠ Zagnieżdżenie stref: `front ⊆ bok ⊆ blokowalne` ma być STRUKTURALNE.
// Padnie, jeśli ktoś rozdzieli `guardZone` na dwa niezależne testy kąta.
ok("G4", "front ⊆ bok — strefa pełna nie jest szersza od zewnętrznej",
   fullArcDeg <= sideArcDeg, `${fullArcDeg} ≤ ${sideArcDeg}`);
ok("G4", "⛔ sufit: fullArcDeg ≤ 90° (współdzielone z parowaniem i bramką ataku)",
   fullArcDeg <= blockArcDeg && blockArcDeg === CFG.FRONT_ARC_DEG,
   `full ${fullArcDeg} ≤ block ${blockArcDeg} = FRONT_ARC_DEG ${CFG.FRONT_ARC_DEG}`);

// ⚠ `sideMul` ma zostać GLOBALNE 0,50 — zakaz proceduralny w configu.
// Padnie, gdy ktoś wpisze `sideMul` na przedmiot albo zmieni stałą.
ok("G5", "sideZoneMul = 0,50 i jest GLOBALNE", sideZoneMul === 0.5, `= ${sideZoneMul}`);
ok("G5", "żaden przedmiot nie deklaruje własnego `sideMul`",
   !/sideMul\s*:/.test(GameConfigTxt));

/* ⚠⚠ §G6 — ZAMEK NA PUŁAPKĘ `T-1`, zastawiony ZANIM `T-1` powstanie.
   `combat_regresja.mjs:185` woła `guardZone(ctx.guardDir, ctx.from)`. W dniu,
   w którym `guardZone` przyjmie kąty parametrem, TAMTO wywołanie po cichu
   zejdzie na wartości globalne i regresja będzie świecić na zielono, nie
   sprawdzając niczego. Ten zamek pada w tym samym dniu i wymusza poprawkę. */
// ✅ **`T-1` WDROŻONY 2026-09-16 — oba zamki wyżej przepisane, nie skasowane.**
//
// ⚠⚠ Poprzednia wersja brzmiała *„`guardZone` ma dziś arność 2 — po `T-1` ten
// zamek MA paść”* i **NIE padła mimo wdrożenia `T-1`**. Powód jest w języku, nie
// w kodzie: `Function.length` liczy parametry **do pierwszego z wartością
// domyślną**, więc `guardZone(facing, from, geo = ...)` nadal raportuje 2.
// Tripwire na `.length` był więc od początku niezdolny zapalić się na zielono
// — czyli był dekoracją. Zastąpiony sprawdzeniem ŹRÓDŁA, które umie paść.
ok("G6", "⭐ `guardZone` przyjmuje TRZECI parametr — profil geometrii",
   /export function guardZone\([\s\S]{0,400}?geo: GuardGeometry = defaultGuardGeometry\(\)/.test(protX2),
   "sprawdzane po źródle — `.length` ukrywa parametr z wartością domyślną");
ok("G6", "⭐ `DamageResolver` PRZEKAZUJE `ctx.blockGeometry` do OBU wywołań",
   (resX2.match(/guardZone\(ctx\.guardDir, ctx\.from, ctx\.blockGeometry\)/g) ?? []).length === 2,
   `wywołań z profilem: ${(resX2.match(/guardZone\(ctx\.guardDir, ctx\.from, ctx\.blockGeometry\)/g) ?? []).length}/2`);
ok("G6", "⛔ `Player` wstrzykuje geometrię z `BlockSpec`, nie z katalogu",
   /blockGeometry: Equipment\.blockSpec\?\.geometry/.test(plX2));

/* ══════════════════════════════════════════════════════════════════════════
   §B — BLOK: kto czyta profil tarczy
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§B. Blok — źródło profilu i bramki:");

// ⛔ `blockChance` odrzucone z pomiarem (N-23). Padnie w dniu, w którym ktoś
// wprowadzi rzut kością do bloku — pod jakąkolwiek nazwą tego pola.
ok("B1", "⛔ NIGDZIE w `src/` nie ma `blockChance`",
   !/blockChance/.test(GameConfigTxt + Equipment + DamageResolver + Player + Protection));

// ⚠ Blok ma zostać DETERMINISTYCZNY: w gałęzi bloku nie wolno losować.
const galazBloku = DamageResolver.slice(DamageResolver.indexOf("const zone = guardZone"));
ok("B1", "⛔ gałąź bloku nie losuje (`Math.random` / `roll` po wyznaczeniu strefy)",
   !/Math\.random|rollDodge|rollParry/.test(galazBloku));

// ⚠ Profil tarczy ma płynąć z PRZEDMIOTU przez `blockSpec`.
ok("B2", "`Equipment.blockSpec` czyta pole `block` przedmiotu",
   /get blockSpec\(\)[\s\S]{0,400}?"block" in def/.test(Equipment));
ok("B2", "`blockSpec.reduction` skalowane jakością przez ISTNIEJĄCĄ tabelę `defense`",
   /get blockSpec\(\)[\s\S]{0,600}?qualityMul\("defense"/.test(Equipment));
// ⚠⚠ Tooltip MUSI liczyć blok tą samą drogą co `blockSpec`: jakość × stan.
// Zamek dodany 2026-09-15 razem z naprawą: `blockSpec` dostało `conditionMul`
// w `T-5`, a tooltip nie — więc **rozbita tarcza pokazywała PEŁNY procent
// bloku**, choć w walce blokowała o połowę słabiej. Padnie, gdy któraś z tych
// dwóch ścieżek znów rozjedzie się z drugą.
// ⚠⚠ **Wzór przeprowadził się 2026-09-19** z `ItemTooltip` do `ItemCard`:
// karta jest dziś JEDNYM modelem dla dwóch rendererów (kolumna szczegółów
// w sklepie i dymek w panelu postaci), a `shieldReductionOf` jest tam jedynym
// wydobyciem procentu bloku. Zamek pilnuje tej samej TEZY — „to, co widzi
// gracz, liczy się tak samo, jak to, co działa w walce" — tylko pod nowym
// adresem. ⛔ Nie wracaj do szukania wzoru w `ItemTooltip.ts`: przez cztery
// dni świecił tam na czerwono, choć rozjazdu nie było.
// ⚠ Od etapu F (2026-10-13) dymka nie ma — rendererem karty jest wyłącznie
//   kolumna `ShopDetails` (sklep i panel gracza); kontrola ujemna celuje w nią.
const tooltipTxt = await kod("src/ui/ShopDetails.ts");
const kartaTxt = await kod("src/ui/ItemCard.ts");
ok("B2", "⛔ karta liczy blok TAK SAMO jak `blockSpec` (jakość × stan)",
   /def\.block\.reduction \*[\s\S]{0,120}qualityMul\("defense"[\s\S]{0,60}conditionMul\(inst\)/.test(kartaTxt));
// ⭐ Kontrola NEGATYWNA: renderer nie ma prawa liczyć tego po swojemu — to był
//   dokładnie ten błąd („rozbita tarcza pokazywała pełny procent").
ok("B2", "⛔ renderer karty (`ShopDetails`) NIE liczy bloku sam — bierze go z modelu",
   !/def\.block\.reduction/.test(tooltipTxt));
ok("B2", "⛔ `blockSpec.swingMul` NIE jest skalowany jakością",
   !/get blockSpec\(\)[\s\S]{0,600}?swingMul:\s*def\.block\.swingMul\s*\*/.test(Equipment));

// ⚠ Bramka Uderzenia tarczą ma czytać ZDOLNOŚĆ, nie nazwę przedmiotu.
ok("B3", "bramka `shieldBash` czyta `Equipment.blockSpec`, nie listy id",
   /if \(!Equipment\.blockSpec\)/.test(GameScene));
ok("B3", '⛔ bramka NIE porównuje id przedmiotu z „buckler” / „ironbound”',
   !/(buckler|ironbound_shield)/.test(GameScene));

/* ══════════════════════════════════════════════════════════════════════════
   §R — RESOLVER: czyj kąt rozstrzyga
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§R. Resolver — rzeczywisty kąt, nie werdykt:");

// ⚠⚠ `immune` i `dodge` wpisują `zone: "back"` NA SZTYWNO. Każdy konsument,
// który wyciągałby z tego geometrię, liczyłby błąd. Padnie, gdy ktoś zacznie
// czytać `zone` jako pomiar.
ok("R1", "`resolveIncoming` liczy strefę przez `guardZone`, nie odtwarza jej z werdyktu",
   // ⚠ Po `T-1` (2026-09-16) dochodzi TRZECI argument — profil konstrukcji.
   //   Zamek pilnuje tego samego co przedtem: że strefa jest LICZONA, a nie
   //   odtwarzana z werdyktu. Oba kształty wywołania są legalne.
   /const zone = guardZone\(ctx\.guardDir, ctx\.from(, ctx\.blockGeometry)?\)/.test(DamageResolver));
ok("R1", "⚠ gałęzie `immune`/`dodge` nadal wpisują `zone: \"back\"` na sztywno (założenie sondy `P1`)",
   (DamageResolver.match(/zone: "back"/g) ?? []).length >= 2);
ok("R2", "⛔ `Player.takeDamage` NIE czyta `wynik.zone` (czyta werdykt `outcome`)",
   !/wynik\.zone/.test(Player) && /wynik\.outcome === "block"/.test(Player));
ok("R2", "sonda `P1` liczy kąt przez `guardAngleDeg`, nie przez `DamageResult.zone`",
   /guardAngleDeg/.test(GuardStats) && !/\.zone/.test(GuardStats));
ok("R3", "⛔ PAROWANIE zostaje na `isFrontal` — nie dzieli warunku z tarczą",
   /const frontal = isFrontal\(ctx\.guardDir, ctx\.from\)/.test(DamageResolver));
ok("R4", "mnożnik strefy wchodzi PARAMETREM (`blockSideMul`), nie importem `SHIELD`",
   /blockSideMul/.test(DamageResolver) && !/from "\.\.\/config\/GameConfig"/.test(DamageResolver));

/* ══════════════════════════════════════════════════════════════════════════
   §J — JAKOŚĆ ≠ STAN, i inne rozdziały odpowiedzialności
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§J. Jakość, stan i rozdział odpowiedzialności:");

// ⭐ `condition ≠ quality` — naprawiony Podły miecz zostaje Podły.
// Padnie, gdy naprawa zacznie ruszać jakość.
const repair = Quality.slice(Quality.indexOf("export function repairInstance"));
ok("J1", "⭐ `repairInstance` NIE dotyka `quality` (condition ≠ quality)",
   repair.length > 0 && !/inst\.quality\s*=/.test(repair.slice(0, 800)));
ok("J1", "`hasDurability` wynika z OBECNOŚCI pola w `ITEMS`, nie z typu przedmiotu",
   /"durability" in getItem\(itemId\)/.test(Quality));

// ⭐ **Te dwa zamki ZMIENIły znak w `T-5` (2026-09-15) — i to jest dowód, że
// asercja potrafi zaświecić na czerwono.** Do tej daty opisywały stan
// "`T-5` niezrobione"; w dniu wdrożenia padły i wymusiły tę poprawkę.
const tarcze = ["buckler", "ironbound_shield"].map((id) => CFG.ITEMS[id]);
ok("J2", "⭐ obie tarcze mają pole `durability` — to ONO włącza cały łańcuch",
   tarcze.every((t) => "durability" in t),
   tarcze.map((t) => t.durability).join(" / "));
ok("J2", "⭐ `blockSpec` czyta stan egzemplarza (`conditionMul`)",
   /conditionMul\(this\.offhand\)/.test(Equipment.slice(Equipment.indexOf("get blockSpec"), Equipment.indexOf("get blockSpec") + 1400)));
ok("J2", "⛔ …ale `conditionMul` to TA SAMA funkcja, co przy obrażeniach i obronie",
   /export function conditionMul/.test(Quality) &&
   (Quality.match(/conditionMul\(/g) ?? []).length >= 3);

// ⚠ Geometria nie wolno, żeby wyciekła na przedmiot przed `T-1`.
// ⚠ Czytamy PRAWDZIWY obiekt, nie tekst pliku — pierwsza wersja cięła
// `GameConfigTxt` od `ITEMS` do końca pliku i łapała `fullArcDeg` ze stałej
// `SHIELD`, która leży NIŻEJ. Obiekt nie kłamie o tym, gdzie co stoi.
ok("J3", "⛔ żaden przedmiot nie deklaruje `fullArcDeg`/`sideArcDeg` (geometria wciąż globalna)",
   Object.values(CFG.ITEMS).every((d) => !("fullArcDeg" in d) && !("sideArcDeg" in d)));

// ⚠ Jakość nie jest częścią definicji przedmiotu — mieszka na egzemplarzu.
ok("J3", "⛔ definicje w `ITEMS` nie niosą `quality` (to oś EGZEMPLARZA)",
   Object.values(CFG.ITEMS).every((d) => !("quality" in d)));

/* ══════════════════════════════════════════════════════════════════════════
   §T — DZISIEJSZE TARCZE: relacje, które mają przeżyć katalog
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§T. Dzisiejsze dwie tarcze — relacje z checkpointu:");

const [puklerz, okuta] = tarcze;
// ⭐ Kryterium wariantu przyjęte dla pancerza 2026-09-12: lżejsza ma LEPSZY
// stosunek i NIŻSZĄ wartość bezwzględną. Padnie, gdy któraś zacznie dominować.
const naKg = (t) => t.defense / t.weight;
const naDps = (t) => (t.block.reduction * 100) / ((1 - 1 / t.block.swingMul) * 100);
ok("T1", "⭐ puklerz ma LEPSZY stosunek obrony do masy",
   naKg(puklerz) > naKg(okuta), `${naKg(puklerz).toFixed(2)} > ${naKg(okuta).toFixed(2)} pkt/kg`);
ok("T1", "⭐ puklerz ma LEPSZY stosunek redukcji do kary DPS",
   naDps(puklerz) > naDps(okuta), `${naDps(puklerz).toFixed(2)} > ${naDps(okuta).toFixed(2)}`);
ok("T1", "…i NIŻSZE wartości bezwzględne (czyli wariant, nie szczebel)",
   puklerz.defense < okuta.defense && puklerz.block.reduction < okuta.block.reduction);
ok("T2", "koszt bloku należy do TARCZY (obie deklarują własny `staminaCost`)",
   tarcze.every((t) => typeof t.block.staminaCost === "number"));
ok("T2", "⚠ stawka zapasowa istnieje, ale nikt jej dziś nie używa",
   typeof CFG.STAMINA.costs.blockFallback === "number");
ok("T3", 'obie tarcze to `type: "armor"` w slocie `offhand` (N-21)',
   tarcze.every((t) => t.type === "armor" && t.slot === "offhand"));
// ⚠ Sprawdzamy KOLUMNĘ `ARMOR_PROFILE`, nie wystąpienie słowa „wood” w pliku:
// `wood: 0x8a6a3f` to kolor rekwizytu i z materiałem pancerza nie ma nic
// wspólnego. Pierwsza wersja łapała właśnie tę stałą.
ok("T3", '⛔ `ARMOR_PROFILE` nie ma kolumny „wood”, a tarcze jej nie używają',
   !("wood" in CFG.ARMOR_PROFILE) && tarcze.every((t) => t.armorType in CFG.ARMOR_PROFILE),
   `materiały: ${Object.keys(CFG.ARMOR_PROFILE).join(", ")}`);

/* ══════════════════════════════════════════════════════════════════════════
   §D — `T-5`: TRWAŁOŚĆ TARCZY (2026-09-15)
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Cały ten zakres jedzie ISTNIEJĄCYM łańcuchem trwałości. Zamki niżej mają
   paść w dniu, w którym ktoś dorobi tarczom osobny model zużycia albo naprawy.

   ⚠ `Math.random` jest PODMIENIANY na deterministyczny — `applyWear` losuje
   przeciw `wearChance`, a przymiar ma sprawdzać arytmetykę, nie szczęście. */
console.log("\n§D. `T-5` — trwałość tarczy przez ISTNIEJĄCY łańcuch:");

const { hasDurability, durabilityOf, maxDurabilityOfInstance, isDestroyed, applyWear,
        repairInstance, repairCost, conditionMul, makeInstance, qualityOf } = QUAL;
// ⚠⚠ **`makeInstance(itemId, QTY, quality)` — drugim argumentem jest ILOŚĆ,
// nie jakość.** Pierwsza wersja tych zamków podawała jakość na drugiej pozycji;
// Q3 przechodziło WTEDY PRZYPADKIEM, bo 3 jest wartością domyślną, a Q1 i Q7
// świeciły na czerwono. Zamek D7 wyłapał to poprawnie — to jest dokładnie ten
// rodzaj błędu, dla którego testuje się WIĘCEJ NIŻ JEDNĄ wartość na osi.
const losowanie = Math.random;
const zawszeZuzyj = () => { Math.random = () => 0; };
const nigdyNieZuzyj = () => { Math.random = () => 1; };

// ── D1. Przedmiot BEZ `durability` — zachowanie niezmienione ───────────────
// Padnie, gdyby ktoś włączył trwałość „dla wszystkiego" zamiast przez pole.
const bezPola = makeInstance("leather_helmet", 1, 3);
ok("D1", "przedmiot bez pola `durability` nadal go NIE ma", !hasDurability("leather_helmet"));
ok("D1", "…`conditionMul` = 1, więc obrona bez zmian", conditionMul(bezPola) === 1);
ok("D1", "…`applyWear` nic nie robi i nie rozbija", applyWear(bezPola) === false);
ok("D1", "…`repairCost` = 0", repairCost(bezPola) === 0);

// ── D2. Nowa tarcza — pełna trwałość ───────────────────────────────────────
for (const id of ["buckler", "ironbound_shield"]) {
  ok("D2", `\`${id}\` MA teraz pole \`durability\``, hasDurability(id));
  const swieza = makeInstance(id, 1, 3);
  ok("D2", `\`${id}\` świeży egzemplarz jest pełny`,
     durabilityOf(swieza) === maxDurabilityOfInstance(swieza) && !isDestroyed(swieza),
     `${durabilityOf(swieza)}/${maxDurabilityOfInstance(swieza)}`);
}

// ── D3. Zużycie zmniejsza trwałość ─────────────────────────────────────────
zawszeZuzyj();
const zuzywana = makeInstance("buckler", 1, 3);
const przed = durabilityOf(zuzywana);
applyWear(zuzywana);
ok("D3", "jedno zużycie zdejmuje dokładnie `wearAmount`",
   przed - durabilityOf(zuzywana) === CFG.EQUIPMENT.durability.wearAmount,
   `${przed} → ${durabilityOf(zuzywana)}`);
nigdyNieZuzyj();
const nietkniety = durabilityOf(zuzywana);
applyWear(zuzywana);
ok("D3", "poza rzutem `wearChance` trwałość stoi", durabilityOf(zuzywana) === nietkniety);

// ── D4. ⭐⭐ Stan ZNISZCZONY wpływa na `blockSpec` — dziura zamknięta ───────
// ⚠ To jest główny zamek `T-5`. Do 2026-09-15 zniszczona tarcza traciła punkty
// obrony, ale blokowała w pełni. Padnie, gdyby ktoś wyjął `conditionMul`
// z `blockSpec`.
zawszeZuzyj();
EQ.Equipment.reset();
const doRozbicia = makeInstance("ironbound_shield", 1, 3);
EQ.Equipment.offhand = doRozbicia;
const blokPelny = EQ.Equipment.blockSpec.reduction;
while (!isDestroyed(doRozbicia)) applyWear(doRozbicia);
const blokRozbity = EQ.Equipment.blockSpec.reduction;
ok("D4", "⭐ zniszczona tarcza NIE blokuje w pełni",
   blokRozbity < blokPelny, `${(blokPelny * 100).toFixed(1)}% → ${(blokRozbity * 100).toFixed(1)}%`);
ok("D4", "…i spadek to dokładnie `destroyedMultiplier`",
   Math.abs(blokRozbity - blokPelny * CFG.EQUIPMENT.durability.destroyedMultiplier) < 1e-9,
   `× ${CFG.EQUIPMENT.durability.destroyedMultiplier}`);
ok("D4", "…a `staminaCost` i `swingMul` zostają NIETKNIĘTE przez stan",
   EQ.Equipment.blockSpec.staminaCost === CFG.ITEMS.ironbound_shield.block.staminaCost &&
   EQ.Equipment.blockSpec.swingMul === CFG.ITEMS.ironbound_shield.block.swingMul);

// ── D5/D6. Naprawa przywraca stan i NIE rusza jakości ──────────────────────
const jakoscPrzed = qualityOf(doRozbicia);
ok("D5", "rozbita tarcza ma niezerowy koszt naprawy", repairCost(doRozbicia) > 0);
repairInstance(doRozbicia);
ok("D5", "naprawa przywraca PEŁNĄ trwałość",
   durabilityOf(doRozbicia) === maxDurabilityOfInstance(doRozbicia) && !isDestroyed(doRozbicia));
ok("D5", "…i blok wraca do wartości sprzed rozbicia",
   Math.abs(EQ.Equipment.blockSpec.reduction - blokPelny) < 1e-9);
ok("D6", "⭐ naprawa NIE zmienia jakości (`condition ≠ quality`)",
   qualityOf(doRozbicia) === jakoscPrzed, `jakość ${jakoscPrzed} przed i po`);

// ── D7. `maxDurability` nadal skaluje się ISTNIEJĄCĄ tabelą jakości ────────
// Padnie, gdyby ktoś dorobił tarczom własną tabelę zamiast użyć `QUALITY`.
for (const q of [1, 3, 7]) {
  const inst = makeInstance("ironbound_shield", 1, q);
  const oczek = Math.round(CFG.ITEMS.ironbound_shield.durability * CFG.QUALITY.modifiers.maxDurability[q]);
  ok("D7", `jakość ${q} → max trwałości ${oczek} (z \`QUALITY.modifiers.maxDurability\`)`,
     maxDurabilityOfInstance(inst) === oczek, `= ${maxDurabilityOfInstance(inst)}`);
}

// ── D8/D9. Trwałość NIE dotyka geometrii ani kary bocznej ──────────────────
// ⚠ Zniszczona tarcza ma zmieniać SIŁĘ bloku, nigdy jego KSZTAŁT.
EQ.Equipment.offhand = makeInstance("ironbound_shield", 1, 3);
const strefyPelna = [0, 45, 90, 135, 180].map((d) => PROT.guardZone(PRAWO, R(d)));
const rozbita = makeInstance("ironbound_shield", 1, 3);
zawszeZuzyj();
while (!isDestroyed(rozbita)) applyWear(rozbita);
EQ.Equipment.offhand = rozbita;
const strefyRozbita = [0, 45, 90, 135, 180].map((d) => PROT.guardZone(PRAWO, R(d)));
ok("D8", "⛔ stan tarczy NIE zmienia stref (geometria jest globalna)",
   JSON.stringify(strefyPelna) === JSON.stringify(strefyRozbita), strefyPelna.join("/"));
ok("D9", "⛔ stan tarczy NIE zmienia `sideZoneMul`", CFG.SHIELD.sideZoneMul === 0.5);
ok("D9", "⛔ `BlockSpec` nadal nie niesie `sideMul` ani kątów",
   !("sideMul" in EQ.Equipment.blockSpec) && !("fullArcDeg" in EQ.Equipment.blockSpec) &&
   !("sideArcDeg" in EQ.Equipment.blockSpec));

// ── D10. `T-5` nie przemycił losowości do bloku ────────────────────────────
ok("D10", "⛔ `T-5` nie wprowadził `blockChance`", !/blockChance/.test(Equipment + Player));
ok("D10", "⛔ blok nadal deterministyczny — `blockSpec` nie losuje",
   !/Math\.random/.test(Equipment.slice(Equipment.indexOf("get blockSpec"), Equipment.indexOf("get blockSpec") + 1200)));

// ── D11/D12. Zużycie należy do ZABLOKOWANEGO CIOSU ─────────────────────────
// ⚠ Pyta o ZDOLNOŚĆ blokowania, nie o typ — pochodnia w drugiej ręce nie ma
// się zużywać od cudzego ciosu.
EQ.Equipment.reset();
ok("D11", "pusta druga ręka → `wearShield` nic nie robi", EQ.Equipment.wearShield() === false);
/* ⚙ **Przepisane w `T-7` (2026-09-15).** Wcześniej ten zamek dopasowywał
   dosłowne `if (zablokowano) Equipment.wearShield();`, czyli WYGLĄD jednej
   linijki. `T-7` opakował zużycie w blok `if (stopien !== "none")` razem
   z nauką — i zamek zapłonął, mimo że NIEZMIENNIK, którego pilnuje, nie
   drgnął. ⭐ To jest dowód, że potrafił zaświecić na czerwono; przepisany
   pyta teraz o SAM NIEZMIENNIK: dokładnie jedno wywołanie w `Player`, pod
   warunkiem, który mówi „ten cios wszedł na tarczę". */
const wearShieldWywolania = (Player.match(/Equipment\.wearShield\(/g) ?? []).length;
const strefaBloku = Player.slice(Player.indexOf("const stopien"), Player.indexOf("const stopien") + 900);
ok("D12", "`wearShield` wołane w `Player` DOKŁADNIE RAZ i tylko przy ciosie przyjętym na tarczę",
   wearShieldWywolania === 1 &&
   /if \(stopien !== "none"\) \{[\s\S]{0,400}Equipment\.wearShield\(/.test(strefaBloku),
   `${wearShieldWywolania} wywołanie`);
// ⚠ `stopien` musi pochodzić z `zablokowano`, inaczej warunek wyżej dałoby się
// spełnić bramką, która z blokiem nie ma nic wspólnego.
ok("D12", "…a `stopien` wyprowadzony z werdyktu bloku, nie z osobnego warunku",
   /const stopien: BlockGrade = zablokowano/.test(Player));
ok("D12", "…i NIE ma osobnej ścieżki naprawy dla tarcz",
   !/repairShield|naprawTarcz/i.test(Equipment + Player + (await kod("src/ui/ShopPanel.ts"))));

/* ⚠⚠ §D13 — **TRWAŁOŚĆ UBYWA DOKŁADNIE JEDNYM KANAŁEM.**
   Dodane po audycie 2026-09-15, który sprawdzał hipotezę o „mikrozużyciu przy
   redukcji pancerza co X ciosów". **Taki mechanizm NIE ISTNIEJE** — i to jest
   niezmiennik wart zamka, bo jego złamanie jest ciche: drugi kanał zużycia
   podwoiłby tempo, a nic by o tym nie powiedziało.

   Niezmiennik: `applyWear` jest JEDYNYM miejscem, które odejmuje trwałość,
   i ma DOKŁADNIE DWÓCH wołających (`wearWeapon`, `wearShield`). Ścieżka
   mitygacji (`Protection`, `DamageResolver`) nie dotyka trwałości w ogóle.

   Padnie, gdy ktoś doda trzeci kanał zużycia — na przykład ten z hipotezy. */
const plikiSrc = [];
const zejdz = async (kat) => {
  for (const w of await readdir(kat, { withFileTypes: true })) {
    const p = join(kat, w.name);
    if (w.isDirectory()) await zejdz(p);
    else if (w.name.endsWith(".ts")) plikiSrc.push(p);
  }
};
await zejdz(P("src"));
const wolajacyWear = [];
const mutujacyTrwalosc = [];
for (const f of plikiSrc) {
  const t = bezKomentarzy(lf(await readFile(f, "utf8")));
  const rel = f.slice(KORZEN.length + 1).replace(/\\/g, "/");
  // ⚠ DEFINICJA to nie wywołanie — `Quality.ts` deklaruje `applyWear`,
  // a pierwsza wersja tego zamka liczyła ją jako wołającego i świeciła na
  // czerwono bez powodu. Nagłówek funkcji wycinamy przed testem.
  const bezDefinicji = t.replace(/export function applyWear/g, "export function _definicja_");
  if (/\bapplyWear\s*\(/.test(bezDefinicji)) wolajacyWear.push(rel);
  if (/\.durability\s*=/.test(t)) mutujacyTrwalosc.push(rel);
}
ok("D13", "⛔ `applyWear` wołane TYLKO z `Equipment` (`wearWeapon` + `wearShield`)",
   wolajacyWear.length === 1 && wolajacyWear[0] === "src/core/Equipment.ts",
   wolajacyWear.join(", "));
ok("D13", "⛔ pole `durability` mutowane TYLKO w `Quality.ts` — brak drugiego kanału zużycia",
   mutujacyTrwalosc.length === 1 && mutujacyTrwalosc[0] === "src/core/Quality.ts",
   mutujacyTrwalosc.join(", "));
ok("D13", "⛔ ścieżka MITYGACJI nie dotyka trwałości (brak mikrozużycia przy redukcji)",
   !/durability|applyWear/.test(Protection + DamageResolver));

Math.random = losowanie;

/* ══════════════════════════════════════════════════════════════════════════
   §X — `T-3`: NIEZMIENNIKI `BlockSpec` PER PRZEDMIOT
   ══════════════════════════════════════════════════════════════════════════
   ⚠⚠ **Ta grupa iteruje po tym, co NAPRAWDĘ jest w `ITEMS`** — nie po katalogu
   kandydackim. `docs/tarcze_katalog.md` opisuje 39 **decyzji**, a `ITEMS`
   zawiera dziś DWIE tarcze; przymiar ma respektować ten rozjazd, a nie żądać
   jego zasypania. ⛔ Asercja, która wymagałaby sześciu konstrukcji, świeciłaby
   na czerwono za **niewdrożenie**, czyli za stan zamierzony.

   ⚠ **Zero parametrów przepisanych z katalogu.** Wszystko poniżej czyta
   `CFG.ITEMS`, `CFG.SHIELD`, `CFG.QUALITY` i `CFG.ARMOR_PROFILE` — czyli
   dokładnie te obiekty, z których liczy gra. Porównywanie tabeli z tabelą
   dałoby przymiar zawsze zielony.

   ⚠ **`T-3` zależy w checkpointcie od `T-1`** (§4, krok 3 → 2). Geometryczna
   połowa §X1 — „każdy przedmiot ma SWOJE łuki" — nie ma dziś czego sprawdzać,
   bo łuki są globalne. Rozwiązane tak: jeden RESOLVER łuków (`lukiDla`), który
   dziś zwraca wartości globalne, a po `T-1` zacznie zwracać własne — **bez
   zmiany ani jednej asercji niżej**. Domknięciem jest zamek §X5, który padnie
   w dniu, w którym pierwszy przedmiot zadeklaruje własny łuk. */
console.log("\n§X. `T-3` — niezmienniki `BlockSpec` per przedmiot:");

/**
 * ⭐ **Jedyne miejsce, które odpowiada „jakie łuki obowiązują TEN przedmiot".**
 * Dziś: globalne. Po `T-1`: własne, jeśli je ma. Asercje nie wiedzą, który to
 * przypadek — i o to chodzi.
 */
const lukiDla = (def) => ({
  pelny: "fullArcDeg" in def ? def.fullArcDeg : CFG.SHIELD.fullArcDeg,
  zewn: "sideArcDeg" in def ? def.sideArcDeg : CFG.SHIELD.sideArcDeg,
  wlasne: "fullArcDeg" in def || "sideArcDeg" in def,
});

const blokujace = Object.entries(CFG.ITEMS).filter(([, d]) => "block" in d);
// ⚠ **Bez tego zamka cała grupa byłaby dekoracją**: pusta lista przechodzi
// każdą pętlę. Padnie, gdyby ktoś przeniósł tarcze poza `ITEMS`.
ok("X0", "w `ITEMS` są przedmioty z polem `block` (inaczej ta grupa nic nie sprawdza)",
   blokujace.length > 0, `${blokujace.length} szt.: ${blokujace.map(([id]) => id).join(", ")}`);

for (const [id, def] of blokujace) {
  const L = lukiDla(def);
  const b = def.block;

  // ── X1. Niezmiennik geometrii, liczony PER PRZEDMIOT ───────────────────
  // Padnie na konkretnym przedmiocie, gdy ktoś (po `T-1`) wpisze mu pełny łuk
  // szerszy od zewnętrznego albo szerszy od półkuli parowania.
  ok("X1", `${id}: 0 < pełny ≤ zewnętrzny ≤ 180`,
     L.pelny > 0 && L.pelny <= L.zewn && L.zewn <= 180, `${L.pelny}° / ${L.zewn}°`);
  ok("X1", `${id}: pełny ≤ blockArcDeg (półkula parowania i bramki ataku)`,
     L.pelny <= CFG.SHIELD.blockArcDeg, `${L.pelny}° ≤ ${CFG.SHIELD.blockArcDeg}°`);

  // ── X2. N-21: tarcza to ZBROJA z jednym dodatkowym polem ───────────────
  ok("X2", `${id}: \`type: armor\` + \`slot: offhand\` (N-21)`,
     def.type === "armor" && def.slot === "offhand", `${def.type}/${def.slot}`);
  ok("X2", `${id}: \`armorType\` istnieje w \`ARMOR_PROFILE\``,
     def.armorType in CFG.ARMOR_PROFILE, def.armorType);

  // ── X3. Spójność samego `BlockSpec` ────────────────────────────────────
  ok("X3", `${id}: 0 < reduction < 1`, b.reduction > 0 && b.reduction < 1, String(b.reduction));
  // ⚠ Istniejący niezmiennik, nie nowy: tarcza SPOWALNIA zamach. Przyspieszenie
  // to kanał Dual Wieldu (`DUAL_WIELD.swingMul`) i wpuszczenie go tędy zrobiłoby
  // z tarczy cichy buff tempa.
  ok("X3", `${id}: swingMul ≥ 1 — tarcza SPOWALNIA, nigdy nie przyspiesza`,
     b.swingMul >= 1, `×${b.swingMul}`);
  ok("X3", `${id}: staminaCost ≥ 0`, b.staminaCost >= 0, String(b.staminaCost));

  // ── X4. Sufit arytmetyczny: najlepsze wykonanie nie daje NIETYKALNOŚCI ──
  // ⚠ **To NIE jest cap z `OI-24` i go nie otwiera.** `OI-24` pyta o ŁĄCZNĄ
  // mitygację (pancerz × blok); tutaj chodzi o jedną liczbę: redukcja bloku
  // przy najwyższej jakości musi zostać ułamkiem. `reduction = 1` znaczyłoby
  // zero obrażeń od przodu niezależnie od ciosu.
  const przyQ7 = b.reduction * (1 + CFG.QUALITY.modifiers.defense[7]);
  ok("X4", `${id}: redukcja przy Q7 nadal < 100%`, przyQ7 < 1, `${(przyQ7 * 100).toFixed(1)}%`);
}

/* ⚠⚠ §X5 — ZAMEK GOTOWOŚCI `T-1`, zastawiony ZANIM `T-1` powstanie.
   Dziś geometria jest globalna i to jest STAN, nie błąd. W dniu, w którym
   pierwszy przedmiot zadeklaruje własny łuk, ten zamek padnie i wymusi:
   (1) przeczytanie §X1 wyżej jako REALNEJ asercji per przedmiot,
   (2) przepisanie `N-22` do końcowego brzmienia (dziś przepisane tylko tyle,
       ile jest prawdą — patrz `docs/systemy/shields.md` §6). */
/* ══════════════════════════════════════════════════════════════════════════
   §S — `T-4`: UDERZENIE TARCZĄ — CZYM JEST ŹRÓDŁO PRAWDY
   ══════════════════════════════════════════════════════════════════════════
   ⚠ **Zasada `T-4`: źródłem prawdy jest `blockSpec`, nigdy lista nazw
   przedmiotów.** Ta część jest DZIŚ SPEŁNIONA po stronie bramki i §S1–§S2 mają
   ją tak utrzymać.

   ⏳ **Druga połowa `T-4` — profil bashu per konstrukcja — jest ZABLOKOWANA:**
   `BlockSpec` nie ma pola profilu, a jego kształt nie jest nigdzie
   rozstrzygnięty. Zamki §S8/§S9 pilnują dzisiejszego stanu i padną w dniu,
   w którym profil powstanie. */
console.log("\n§S. `T-4` — Uderzenie tarczą: źródło prawdy:");

// Cały łańcuch danych bashu, w jednym miejscu — żeby „nigdzie nie ma id"
// znaczyło NIGDZIE, a nie „w pliku, który akurat sprawdziłem".
const lancuchBashu =
  GameScene.slice(GameScene.indexOf("private shieldStrike"), GameScene.indexOf("private shieldStrike") + 1600) +
  AbilitySpecTxt.slice(AbilitySpecTxt.indexOf('case "shieldBash"'), AbilitySpecTxt.indexOf('case "shieldBash"') + 2000) +
  PlayerActionTxt.slice(PlayerActionTxt.indexOf("shieldBash: {"), PlayerActionTxt.indexOf("shieldBash: {") + 700);

// ⚠⚠ RDZEŃ `T-4`. Padnie w dniu, w którym ktoś napisze `if (itemId === …)`.
const idTarcz = Object.keys(CFG.ITEMS).filter((id) => "block" in CFG.ITEMS[id]);
const przemycone = idTarcz.filter((id) => lancuchBashu.includes(id));
ok("S1", "⛔⛔ ŻADEN identyfikator tarczy nie występuje w łańcuchu bashu",
   przemycone.length === 0, przemycone.length ? `⚠ przemycone: ${przemycone.join(", ")}` : `sprawdzone: ${idTarcz.join(", ")}`);
ok("S2", "bramka pyta o ZDOLNOŚĆ (`Equipment.blockSpec`), nie o przedmiot",
   /if \(!Equipment\.blockSpec\)/.test(GameScene));

// ⚠ Czyta PRAWDZIWY obiekt: `requiresShield` ma być jedyną bramką sprzętową
// w całym `ABILITIES`. Padnie, gdy druga umiejętność zacznie żądać oręża.
const zBramkaSprzetowa = Object.entries(CFG.ABILITIES)
  .filter(([, a]) => a && typeof a === "object" && "requiresShield" in a)
  .map(([k]) => k);
ok("S3", "`requiresShield` jest JEDYNĄ bramką sprzętową w `ABILITIES`",
   zBramkaSprzetowa.length === 1 && zBramkaSprzetowa[0] === "shieldBash", zBramkaSprzetowa.join(", "));

// ── Decyzje zamknięte wokół bashu — każda ma swój zamek ─────────────────
const strikeBody = GameScene.slice(GameScene.indexOf("private shieldStrike"),
                                   GameScene.indexOf("private shieldStrike") + 1200);
ok("S4", "⛔ zasięg z BRONI (`Progression.attackReach`), nie własny zasięg tarczy",
   /reach: Progression\.attackReach/.test(strikeBody) && /maxRangePx: strike\.reach/.test(AbilitySpecTxt));
ok("S5", '⛔ `damageType` wpisany na sztywno („blunt"), nie dziedziczony po wariancie broni',
   /damageType: "blunt"/.test(strikeBody));
ok("S6", "⛔ `staggerMs: 0` — zachwianie i ogłuszenie to jedno pojęcie",
   /staggerMs: 0/.test(strikeBody));
ok("S7", "⛔ `damageMultiplier` < 1 — bash kupuje CZAS, nie obrażenia",
   CFG.ABILITIES.shieldBash.damageMultiplier < 1, `${CFG.ABILITIES.shieldBash.damageMultiplier}`);

/* ⏳ §S8/§S9 — ZAMKI GOTOWOŚCI drugiej połowy `T-4`.
   Opisują STAN, nie poprawność. Padną w dniu, w którym profil bashu zejdzie
   na konstrukcję — i wtedy §S1 trzeba przeczytać jeszcze raz, a te dwa zamki
   przestawić, tak jak §J2 przestawiło się w `T-5`. */
/* ⚠⚠ **PRZEKOTWICZONE 2026-09-15 — i ten zamek ZAŚWIECIŁ NA CZERWONO, zanim to
   zrobiłem.** Do tej daty pierwszym warunkiem był dosłowny literał całej listy
   `onHit: [{ kind: "control", stunMs: S.stunMs }]`. To było PROXY: trzymało się,
   dopóki bash miał dokładnie jeden efekt on-hit. `S10` dołożyło drugi (zużycie
   tarczy po trafieniu) i literał padł na poprawnym kodzie.

   ⛔ **Niezmiennik `T-4` jest nietknięty i brzmi tak samo:** `stunMs` bashu
   pochodzi z GLOBALNEGO `ABILITIES.shieldBash`, a nie z `blockSpec` konkretnej
   tarczy. To ten warunek zaświeci w dniu, w którym profil bashu stanie się
   cechą konstrukcji — i to jest jedyne, o co ten zamek ma pytać. */
ok("S8", "⏳ profil bashu nadal GLOBALNY (`ABILITIES.shieldBash`), nie z `blockSpec` — `T-4` część 2 niezrobiona",
   /kind: "control", stunMs: S\.stunMs/.test(PlayerActionTxt) &&
   !/blockSpec[\s\S]{0,80}stun/i.test(PlayerActionTxt));
// ⭐ `S10` (2026-09-15): zużycie tarczy przy bashu ISTNIEJE i wisi na trafieniu.
ok("S8", "⭐ `S10`: bash deklaruje `wearShield` — zużycie po TRAFIENIU, nie za użycie",
   /kind: "wearShield"/.test(PlayerActionTxt) && /wearsWeapon: false/.test(PlayerActionTxt));
ok("S8", "⛔ `S10`: zero osobnego kanału — nigdzie w `src/` nie ma `bashWear`",
   !/bashWear/.test(PlayerActionTxt + GameScene + Equipment));
ok("S9", "⏳ `BlockSpec` nadal ma DOKŁADNIE trzy pola — brak profilu bashu",
   (() => {
     const i = Equipment.indexOf("export interface BlockSpec");
     const ciało = Equipment.slice(i, Equipment.indexOf("}", i));
     return /reduction/.test(ciało) && /swingMul/.test(ciało) && /staminaCost/.test(ciało) &&
            !/bash|stun/i.test(ciało);
   })());

// ⏳ §S10 — ZNALEZISKO, NIE WERDYKT. `PlayerAction.shieldBash` deklaruje
// `wearsWeapon: false` z komentarzem „zużywa się to, czym się uderza — a
// uderza tarcza". Po `T-5` tarcza MA trwałość, ale `wearShield()` woła wyłącznie
// ścieżka BLOKU. Zamek utrwala dzisiejszy stan, żeby zmiana była świadoma.
/* ⚙ Przepisane razem z §D12 w `T-7` — z tego samego powodu i tą samą drogą.
   ⛔ Werdykt jest NIEZMIENIONY: bash nadal nie zużywa tarczy, a `S10` dalej
   czeka na decyzję autora (cztery warianty w `docs/tarcze_checkpoint.md`). */
ok("S10", "⏳ bash NIE zużywa tarczy — `wearShield` tylko ze ścieżki bloku (stan do rozstrzygnięcia)",
   /wearsWeapon: false/.test(PlayerActionTxt.slice(PlayerActionTxt.indexOf("shieldBash: {"))) &&
   (Player.match(/Equipment\.wearShield\(/g) ?? []).length === 1 &&
   /if \(stopien !== "none"\) \{[\s\S]{0,400}Equipment\.wearShield\(/.test(Player));

/* ⚠⚠ §S11 — ZNALEZISKO STRUKTURALNE, które ZMIENIA OPCJE WDROŻENIA.
   `wearsWeapon: false` przy bashu robi realną robotę: blokuje zużycie ORĘŻA
   (`GameScene` czyta je przy `commitPlayerAction`). Ale przestawienie go na
   `true` **NIE zużyłoby tarczy** — `Equipment.wearWeapon("offhand")` czyta
   `offhandWeapon`, a ten zwraca `null` dla wszystkiego, co nie jest bronią.
   Czyli: kanał zużycia BRONI jest strukturalnie nieosiągalny dla tarczy,
   a zużycie bashu wymagałoby WŁASNEGO wywołania — nie przestawienia flagi.
   Sprawdzane ZACHOWANIEM na żywym module, nie tekstem. */
EQ.Equipment.reset();
EQ.Equipment.offhand = makeInstance("buckler", 1, 3);
const tarczaPrzed = durabilityOf(EQ.Equipment.offhand);
zawszeZuzyj();
const wynikWearWeapon = EQ.Equipment.wearWeapon("offhand");
ok("S11", "⛔ `wearWeapon(\"offhand\")` NIE potrafi zużyć tarczy — kanał broni jest dla niej zamknięty",
   wynikWearWeapon === false && durabilityOf(EQ.Equipment.offhand) === tarczaPrzed,
   `zwrócono ${wynikWearWeapon}, trwałość ${tarczaPrzed} → ${durabilityOf(EQ.Equipment.offhand)}`);
Math.random = losowanie;
EQ.Equipment.reset();

const zWlasnymiLukami = blokujace.filter(([, d]) => lukiDla(d).wlasne);
ok("X5", "⏳ żaden przedmiot nie deklaruje własnych łuków — `T-1` niezrobione (STAN, nie błąd)",
   zWlasnymiLukami.length === 0,
   zWlasnymiLukami.length ? `⚠ ${zWlasnymiLukami.map(([id]) => id).join(", ")} — zaktualizuj §X1 i N-22` : "");
ok("X5", "⛔ `N-22` nie twierdzi, że geometria jest już na przedmiocie",
   /warunek osłony stoi w stałych/.test(await zrodlo("docs/systemy/shields.md")));

/* ══════════════════════════════════════════════════════════════════════════
   §N — ZAMKNIĘTE DECYZJE, KTÓRE DO 2026-09-15 NIE MIAŁY ŻADNEGO ZAMKA

   ⚠ Ta sekcja nie dokłada reguł — **dokłada straż nad regułami, które już były
   rozstrzygnięte, a których złamanie byłoby CICHE.** Każdy zamek niżej pilnuje
   czegoś, co stoi na liście decyzji zamkniętych, a czego żaden istniejący
   przymiar nie sprawdzał. Powstała, bo `P1` czeka na rozgrywkę, a te rzeczy
   dają się dowieźć bez niej.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§N. Decyzje zamknięte — straż nad cichym złamaniem:");

const ProgressionTxt = await kod("src/core/Progression.ts");

/* ── N1: guard direction = WŁASNY zwrot gracza, zero auto-rotacji ───────────
   ⚠⚠ To jest założenie, na którym stoi CAŁE `P1`. Gdyby garda zaczęła
   obracać się na cel, rozkład kątów spłaszczyłby się do zera stopni, a pytanie
   „czy ciosy przychodzą pod różnymi kątami" straciłoby sens — przy raporcie
   wyglądającym normalnie. Auto-obracanie (`targetDir`) BYŁO w grze i zostało
   usunięte 2026-08-23 razem z auto-obracaniem ataku; nic nie broniło powrotu. */
// ⚠ Od 2026-09-27 regułę niesie `guardKat` (ciągły kąt) — czterokierunkowy
//   `guardDir` usunięto razem z `moveDir`/`attackDir`. Poprzednia wersja tej
//   asercji wycinała ciało gettera przez `indexOf`, więc po jego usunięciu
//   druga linia przechodziła NA PUSTYM wycinku (`indexOf` = −1). Dlatego
//   pierwsza asercja sprawdza teraz, że getter w ogóle ISTNIEJE.
const guardKatStart = Player.indexOf("get guardKat()");
const guardKatBody = guardKatStart < 0 ? "" : Player
  .slice(guardKatStart, Player.indexOf("\n  }\n", guardKatStart))
  .split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
ok("N1", "⭐ `guardKat` istnieje i zwraca WYŁĄCZNIE `attackRad` (w pozie) albo `zwrotRad`",
   guardKatStart >= 0 &&
   /return this\.attackRad;[\s\S]{0,60}return this\.zwrotRad;/.test(guardKatBody));
ok("N1", "⛔ `guardKat` nie czyta celu ani niczego od wroga",
   guardKatBody.length > 0 && !/target|enemy|nearest|cel/i.test(guardKatBody));
ok("N1", "⛔ czterokierunkowy `guardDir` NIE wrócił do `Player`",
   !/get guardDir\(\)/.test(Player));
// ⚠ Czytamy KOD bez komentarzy — historia usunięcia `targetDir` jest opisana
//   w komentarzu nad getterem i ma tam zostać.
ok("N1", "⛔ `targetDir` nie istnieje w KODZIE `Player` (żyje tylko w komentarzu)",
   !/targetDir/.test(Player), "3 wystąpienia w komentarzu — celowo");

/* ── N2: `swingMul` tarczy jest REALNYM kosztem ofensywnym ──────────────────
   ⛔ To jedyna realna cena Pawęży (`swingMul = skrajny`). Kanał jest DŁUGI —
   `blockSpec.swingMul` → `offhandSwingMul` → `Progression.swingMul` →
   `swingDurationMs` — i przerwanie go w którymkolwiek miejscu zostawia
   konstrukcję bez ceny, nie ruszając ani jednej liczby balansu. */
ok("N2", "`offhandSwingMul` zwraca `blockSpec.swingMul`, gdy nie ma Dual Wieldu",
   /get offhandSwingMul\(\)[\s\S]{0,300}?return this\.blockSpec\?\.swingMul \?\? 1;/.test(Equipment));
ok("N2", "⭐ tempo zamachu MNOŻY przez `offhandSwingMul` — tarcza realnie spowalnia",
   /get swingMul\(\)[\s\S]{0,160}?Equipment\.offhandSwingMul/.test(ProgressionTxt));

/* ⚠⚠ **NAJWĘŻSZE GARDŁO CAŁEJ CENY TARCZY.** `swingStaminaCost` dzieli długość
   wysiłku przez `dualWieldSwingMul` — ŚWIADOMIE tylko przez niego, bo Dual
   Wield skraca zamach i nie ma prawa czynić go tańszym. Dopisanie tam
   `offhandSwingMul` „dla symetrii" wygląda na porządkowanie kodu, a ODDAJE
   tarczy cały koszt wysiłku: wolniejszy zamach przestałby kosztować więcej. */
const kosztBody = ProgressionTxt.slice(ProgressionTxt.indexOf("get swingStaminaCost()"),
                                   ProgressionTxt.indexOf("get swingStaminaCost()") + 600);
ok("N2", "⛔⛔ koszt wysiłku dzieli TYLKO przez `dualWieldSwingMul` — tarcza nie odzyskuje ceny",
   /Equipment\.dualWieldSwingMul/.test(kosztBody) && !/offhandSwingMul/.test(kosztBody));

/* ── N2b: ⚠⚠ `swingMul` NIE DOCIERA DO BASHU — i to jest zaskakujące ────────
   Sprawdzone przy `T-4` (2026-09-15), bo brzmi odwrotnie, niż podpowiada
   intuicja. `shieldStrike()` USTAWIA `swingDurationMs: Progression.swingDurationMs`
   w profilu ciosu — ale `commitPlayerAction` **nigdy tego pola dla bashu nie
   czyta**: animacja dostaje `action.windupMs * 2`, ukorzenienie `rootMsDlaAkcji`,
   a wysiłek `ABILITIES.shieldBash.staminaCost` (stała z configu, nie `swingStaminaCost`).

   ⇒ **`blockSpec.swingMul` jest ceną płaconą AUTOATAKIEM, nie bashem.**
   To NIE jest usterka i nic tu nie naprawiam — to jest fakt, który musi być
   zapisany, zanim ktoś (ja w tym) założy, że cięższa tarcza spowalnia też
   swój własny bash. Padnie, gdy któraś z tych dróg się zmieni. */
const commit = GameScene.slice(GameScene.indexOf("private commitPlayerAction"),
                               GameScene.indexOf("private commitPlayerAction") + 1600);
ok("N2b", "⚠ bash bierze czas z `windupMs` akcji, NIE ze `swingDurationMs`",
   /durationMs: action\.windupMs \* 2/.test(commit) && !/strike\.swingDurationMs/.test(commit));
ok("N2b", "⚠ wysiłek bashu to stała `staminaCost` umiejętności, nie `swingStaminaCost`",
   /"staminaCost" in def \? def\.staminaCost : 0/.test(GameScene));

/* ── N3: pasywne PP tarczy to ZWYKŁE PP pancerza ────────────────────────────
   Decyzja: „passive shield PP działa jako zwykłe PP pancerza". Dziś spełniona
   KONSTRUKCYJNIE: tarcza ma `type: "armor"` i `armorType`, a `armorPieces`
   iteruje `EQUIP_SLOTS` bez wyjątku dla `offhand`. Padnie, gdy ktoś zrobi
   tarczy osobny typ albo osobny kanał punktów. */
const tarczeDef = ["buckler", "ironbound_shield"].map((id) => CFG.ITEMS[id]);
ok("N3", "⭐ tarcze są `type: \"armor\"` — wchodzą do `armorPieces` bez wyjątku",
   tarczeDef.every((t) => t.type === "armor"), tarczeDef.map((t) => t.type).join(" / "));
ok("N3", "⭐ tarcze mają `armorType` — profil materiału działa na nie jak na pancerz",
   tarczeDef.every((t) => typeof t.armorType === "string"),
   tarczeDef.map((t) => t.armorType).join(" / "));
ok("N3", "⛔ `armorPieces` nie zna żadnego wyjątku dla `offhand`",
   /private armorPieces\(\)[\s\S]{0,400}?for \(const slot of EQUIP_SLOTS\)/.test(Equipment) &&
   !/armorPieces\(\)[\s\S]{0,400}?offhand/.test(Equipment));
ok("N3", "⛔ nie istnieje OSOBNY kanał punktów tarczy",
   !/shieldDefense|blockDefense|shieldPoints/.test(Equipment + DamageResolver + Protection));

/* ══════════════════════════════════════════════════════════════════════════
   §K — `T-7`: CIĘŻAR BLOKU (2026-09-15)
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Ta grupa pilnuje TEZY, nie liczb: **blok jest zdarzeniem o ciężarze, nie
   ryczałtem.** Każdy zamek niżej padnie, gdy ktoś spłaszczy którąkolwiek
   z czterech osi (przyjęte punkty, masa, jakość/stan, umiejętność) — i żaden
   nie sprawdza konkretnej wartości balansowej, bo te są startowe. */
console.log("\n§K. `T-7` — ciężar bloku: koszt, udźwig, stopień, nauka:");

const B = CFG.SHIELD.block;
// ⚠ WSZYSTKO z jednego bundla — patrz komentarz przy `wejscieT7`. Sięgnięcie
// tu po `Eq7` albo `PROT.blockGradeFor` odtworzyłoby rozdzielone
// grafy modułów i zamek §K7 znów kłamałby o uldze.
const { Equipment: Eq7, ShieldSkill, resolveIncoming, blockGradeFor } = T7;
const { makeInstance: mk7, applyWear: wear7, durabilityOf: dur7, maxDurabilityOfInstance: maxDur7 } = T7;

// ── K0. Konfiguracja istnieje i jest spójna ────────────────────────────────
// Bez tego cała grupa mogłaby przejść na `undefined`, czyli być dekoracją.
ok("K0", "`SHIELD.block` ma komplet pól",
   [B.capacityBase, B.capacityPerKg, B.overflowKeep, B.strainPerPoint, B.massSoftening]
     .every((v) => Number.isFinite(v)));
ok("K0", "`overflowKeep` jest UŁAMKIEM (0 < x < 1) — kolano miękkie, nie sufit i nie brak kary",
   B.overflowKeep > 0 && B.overflowKeep < 1, String(B.overflowKeep));
ok("K0", "mnożniki kosztu rosną ze stopniem: light < solid < stagger",
   B.costMul.light < B.costMul.solid && B.costMul.solid < B.costMul.stagger,
   `${B.costMul.light} / ${B.costMul.solid} / ${B.costMul.stagger}`);
ok("K0", "mnożniki zużycia rosną ze stopniem: light < solid < stagger",
   B.wearStrain.light < B.wearStrain.solid && B.wearStrain.solid < B.wearStrain.stagger,
   `${B.wearStrain.light} / ${B.wearStrain.solid} / ${B.wearStrain.stagger}`);
ok("K0", "progi stopni są uporządkowane: lightBelow < staggerAbove",
   B.grade.lightBelow < B.grade.staggerAbove);

// ── K1. ⭐⭐ KOSZT BLOKU NIE JEST STAŁY ──────────────────────────────────────
// ⚠⚠ To jest zamek na WYMAGANIE, nie na implementację: „przeciętna tarcza nie
// może zawsze kosztować dokładnie tyle samo". Padnie w dniu, w którym ktoś
// wróci do ryczałtu — także przez ustawienie `strainPerPoint` na zero.
const zaloz = (id, q = 3) => { Eq7.reset(); Eq7.offhand = mk7(id, 1, q); };
const koszt = (absorbed) => {
  const g = blockGradeFor(absorbed, Eq7.blockCapacity);
  return Eq7.blockStaminaCostFor(absorbed, g);
};
for (const id of ["buckler", "ironbound_shield"]) {
  zaloz(id);
  const lekki = koszt(1);
  const ciezki = koszt(18);
  ok("K1", `${id}: cios 18 pkt kosztuje istotnie więcej niż cios 1 pkt`,
     ciezki > lekki * 1.5, `${lekki.toFixed(2)} → ${ciezki.toFixed(2)} (×${(ciezki / lekki).toFixed(2)})`);
  // ⚠ Monotoniczność osobno: sam „większy" nie wyklucza niemonotonicznej krzywej.
  let rosnie = true;
  for (let a = 1; a < 24; a++) if (koszt(a + 1) < koszt(a)) rosnie = false;
  ok("K1", `${id}: koszt rośnie MONOTONICZNIE z przyjętymi punktami`, rosnie);
}

// ── K2. ⭐ MASA DZIAŁA W DWIE STRONY — tożsamość bez tabeli per konstrukcja ──
// Padnie, gdyby koszt za punkt przestał zależeć od masy (np. przez wpisanie
// stałej zamiast `strainPerPoint/(kg + massSoftening)`).
zaloz("buckler");          const puk1 = koszt(1),  puk20 = koszt(20);
zaloz("ironbound_shield"); const oku1 = koszt(1),  oku20 = koszt(20);
ok("K2", "⭐ puklerz jest TAŃSZY od tarczy okutej na cios lekki",
   puk1 < oku1, `${puk1.toFixed(2)} < ${oku1.toFixed(2)}`);
ok("K2", "⭐ …i DROŻSZY na cios ciężki — relacja się odwraca",
   puk20 > oku20, `${puk20.toFixed(2)} > ${oku20.toFixed(2)}`);

// ── K3. Udźwig zależy od masy, jakości i stanu ─────────────────────────────
zaloz("buckler");          const capPuk = Eq7.blockCapacity;
zaloz("ironbound_shield"); const capOku = Eq7.blockCapacity;
ok("K3", "cięższa tarcza ma większy udźwig bloku", capOku > capPuk,
   `${capPuk.toFixed(1)} < ${capOku.toFixed(1)}`);
zaloz("ironbound_shield", 1); const capQ1 = Eq7.blockCapacity;
zaloz("ironbound_shield", 7); const capQ7 = Eq7.blockCapacity;
ok("K3", "lepsze wykonanie podnosi udźwig (Q1 < Q3 < Q7)",
   capQ1 < capOku && capOku < capQ7, `${capQ1.toFixed(1)} / ${capOku.toFixed(1)} / ${capQ7.toFixed(1)}`);
zaloz("ironbound_shield");
Eq7.offhand.durability = 0;
const capRozbita = Eq7.blockCapacity;
ok("K3", "⭐ ROZBITA tarcza znosi mniej — ta sama `conditionMul`, co przy redukcji",
   capRozbita < capOku && capRozbita > 0, `${capOku.toFixed(1)} → ${capRozbita.toFixed(1)}`);

// ── K4. ⭐⭐ MIĘKKIE KOLANO w PRAWDZIWYM resolverze ─────────────────────────
// ⚠ Dwa zamki naraz: pod udźwigiem wynik jest IDENTYCZNY jak przed `T-7`
// (dlatego `combat_regresja` ma zero różnic), a nad nim — ostro gorszy.
// Padnie, gdy ktoś zamieni kolano na próg albo na sufit redukcji.
const kontekst = (amount, cap) => ({
  amount, damageType: null, from: { x: 1, y: 0 }, guardDir: PRAWO,
  invulnerable: false, dodgeChance: 0, parryChance: 0,
  armorReduction: 0, blockReduction: 0.45, blockSideMul: 0.5,
  blockCapacity: cap, blockOverflowKeep: B.overflowKeep,
});
const przedT7 = (amount, red) => Math.max(1, Math.round(amount * (1 - red)));
const maly = resolveIncoming(kontekst(10, 100));   // 4,5 pkt — głęboko pod udźwigiem
ok("K4", "cios MIESZCZĄCY SIĘ w udźwigu daje dokładnie tyle, co przed `T-7`",
   maly.mitigated === przedT7(10, 0.45) && maly.outcome === "block",
   `${maly.mitigated} pkt, przyjęte ${maly.absorbed.toFixed(2)}`);
const duzy = resolveIncoming(kontekst(40, 6));     // 18 pkt surowo wobec udźwigu 6
ok("K4", "⭐ cios PRZECIĄŻAJĄCY tarczę przepuszcza WIĘCEJ niż przed `T-7`",
   duzy.mitigated > przedT7(40, 0.45), `${przedT7(40, 0.45)} → ${duzy.mitigated} pkt`);
ok("K4", "…ale tarcza nadal zatrzymuje WIĘCEJ niż swój udźwig (kolano, nie sufit)",
   duzy.absorbed > 6 && duzy.absorbed < 40 * 0.45,
   `przyjęte ${duzy.absorbed.toFixed(2)} (udźwig 6, bez kolana ${(40 * 0.45).toFixed(1)})`);
ok("K4", "⛔ `absorbed` jest ZEROWE, gdy tarcza nie weszła w grę (cios z tyłu)",
   resolveIncoming({ ...kontekst(20, 10), from: { x: -1, y: 0 } }).absorbed === 0);

// ── K5. Stopień bloku: deterministyczny i pokrywający całą oś ──────────────
ok("K5", "stopnie pokrywają oś: brak / lekki / pełny / przebicie",
   blockGradeFor(0, 10) === "none" &&
   blockGradeFor(1, 10) === "light" &&
   blockGradeFor(8, 10) === "solid" &&
   blockGradeFor(25, 10) === "stagger");
ok("K5", "⛔ stopień jest DETERMINISTYCZNY — dziesięć wywołań, jeden wynik",
   new Set(Array.from({ length: 10 }, () => blockGradeFor(7, 10))).size === 1);
ok("K5", "⛔ ani udźwig, ani koszt nie losują",
   !/Math\.random/.test(Equipment.slice(Equipment.indexOf("get blockCapacity"),
                                        Equipment.indexOf("get blockCapacity") + 2400)));

// ── K6. ⛔⛔ ZUŻYCIE BRONI NIETKNIĘTE ───────────────────────────────────────
// ⚠⚠ Najważniejszy zamek tej grupy. `T-7` sparametryzował `applyWear`, więc
// musi udowodnić, że kanał broni zachowuje się CO DO PUNKTU tak jak przedtem.
// Padnie, gdyby ktoś dał broni domyślny strain ≠ 1 albo zmienił stawkę.
const losowanieK = Math.random;
Math.random = () => 0;                       // „zawsze zużyj"
const miecz = mk7("sword", 1, 3);
const mieczPrzed = dur7(miecz);
wear7(miecz);                        // BEZ argumentu — tak woła `wearWeapon`
const ubytekBroni = mieczPrzed - dur7(miecz);
ok("K6", "⛔ broń traci DOKŁADNIE `wearAmount` przy domyślnym wywołaniu",
   ubytekBroni === CFG.EQUIPMENT.durability.wearAmount, `${mieczPrzed} → ${dur7(miecz)}`);
Math.random = () => 1;                       // „nigdy nie zużywaj"
const miecz2 = mk7("sword", 1, 3);
wear7(miecz2);
ok("K6", "⛔ …i NIC nie traci, gdy rzut nie trafi w `wearChance`",
   dur7(miecz2) === maxDur7(miecz2));
// Przebicie MUSI zużywać szybciej — inaczej cała oś `wearStrain` jest martwa.
Math.random = () => CFG.EQUIPMENT.durability.wearChance * 1.5;  // między `solid` a `stagger`
zaloz("ironbound_shield");
const przedSolid = dur7(Eq7.offhand);
Eq7.wearShield(B.wearStrain.solid);
const poSolid = dur7(Eq7.offhand);
zaloz("ironbound_shield");
Eq7.wearShield(B.wearStrain.stagger);
const poStagger = dur7(Eq7.offhand);
ok("K6", "⭐ przy tym samym rzucie PRZEBICIE zużywa tarczę, a blok pełny nie",
   poSolid === przedSolid && poStagger < przedSolid,
   `solid ${przedSolid}→${poSolid}, stagger ${przedSolid}→${poStagger}`);
Math.random = losowanieK;
Eq7.reset();
ok("K6", "⛔ nadal JEDEN model zużycia — `applyWear` bez drugiej ścieżki dla tarcz",
   (Quality.match(/inst\.durability = Math\.max\(0,/g) ?? []).length === 1 &&
   !/wearShieldAmount|shieldWearChance/i.test(Quality + GameConfigTxt));

// ── K7. Umiejętność władania tarczą: obniża koszt, nigdy do zera ───────────
ShieldSkill.reset();
zaloz("ironbound_shield");
const kosztBezNauki = koszt(12);
ok("K7", "ulga przy `P = 0` wynosi ZERO — umiejętność nie jest darmowym rabatem na starcie",
   ShieldSkill.relief === 0);
ShieldSkill.reset();
for (let i = 0; i < 60; i++) ShieldSkill.practice(20, "solid");
const pPoNauce = ShieldSkill.proficiency;
ok("K7", "⭐ blokowanie realnie uczy — `P` rośnie z przyjętych punktów",
   pPoNauce > 0, `P = ${pPoNauce}`);
const kosztPoNauce = koszt(12);
ok("K7", "⭐ nauczony gracz płaci za ten sam cios MNIEJ",
   kosztPoNauce < kosztBezNauki,
   `${kosztBezNauki.toFixed(2)} → ${kosztPoNauce.toFixed(2)} (ulga ${(ShieldSkill.relief * 100).toFixed(1)}%)`);
ok("K7", "⛔ …ale NIGDY za darmo — ulga ma sufit ułamkowy",
   kosztPoNauce > 0 && ShieldSkill.relief <= CFG.SHIELD_SKILL.maxRelief,
   `ulga ${(ShieldSkill.relief * 100).toFixed(1)}% ≤ ${(CFG.SHIELD_SKILL.maxRelief * 100).toFixed(0)}%`);
// ⚠ Zamek na pomyłkę „nauka z LICZBY bloków": sto draśnięć nie może uczyć
// tyle, co sto ciężkich ciosów.
ShieldSkill.reset();
for (let i = 0; i < 100; i++) ShieldSkill.practice(1, "solid");
const pOdDrasniec = ShieldSkill.proficiency;
ShieldSkill.reset();
for (let i = 0; i < 100; i++) ShieldSkill.practice(12, "solid");
const pOdCiosow = ShieldSkill.proficiency;
ok("K7", "⭐⭐ nauka idzie z PRZYJĘTYCH PUNKTÓW, nie z liczby bloków",
   pOdCiosow > pOdDrasniec, `100× po 1 pkt → P ${pOdDrasniec}; 100× po 12 pkt → P ${pOdCiosow}`);
ShieldSkill.reset();
ok("K7", "⛔ `ShieldSkill` NIE importuje `Equipment` (kierunek jednostronny, bez cyklu)",
   !/from "\.\/Equipment"/.test(await kod("src/core/ShieldSkill.ts")));

// ── K8. Zapis addytywny — postać nie ginie za nową oś ──────────────────────
const SaveTxt = await kod("src/core/Save.ts");
ok("K8", "`SAVE_VERSION` nietknięte (3) — nowa oś weszła polem OPCJONALNYM",
   /const SAVE_VERSION = 3;/.test(SaveTxt));
ok("K8", "…a `shieldSkill?` jest opcjonalne i przywracane",
   /shieldSkill\?: \{/.test(SaveTxt) && /ShieldSkill\.restore\(data\.shieldSkill\)/.test(SaveTxt));
ShieldSkill.restore(undefined);
ok("K8", "⛔ zapis SPRZED `T-7` wczytuje się jako `P = 0`, bez wyjątku",
   ShieldSkill.proficiency === 0 && ShieldSkill.relief === 0);

/* ══════════════════════════════════════════════════════════════════════════
   §V — KATALOG 39 TARCZ: WYPROWADZENIE, NIE PRZEPISANIE (2026-09-16)

   ⚠ Ta grupa pilnuje JEDNEJ rzeczy: że katalog nadal WYNIKA z `SHIELD_BASE`
   × `SHIELD_VARIANT`, a nie z ręcznie wpisanych liczb. Padnie w dniu, w którym
   ktoś „poprawi" pojedynczą pozycję na miejscu — bo wtedy strojenie konstrukcji
   przestanie przestrajać jej warianty i katalog zacznie się cicho rozjeżdżać.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§V. Katalog tarcz — wyprowadzenie z centralnych stałych:");

const BAZA = CFG.SHIELD_BASE, WAR = CFG.SHIELD_VARIANT;
const wszystkieTarcze = Object.entries(CFG.ITEMS).filter(([, d]) => d.block !== undefined);

// ── V1. ⭐⭐ Baza ZGADZA SIĘ z dwiema tarczami, które istniały wcześniej ────
// ⚠⚠ Najważniejszy zamek grupy. `buckler` i `ironbound_shield` zostały
// świadomie NIETKNIĘTE (decyzja autora 2026-09-16), więc ich warianty lekki
// i ciężki muszą wychodzić z DOKŁADNIE tych samych liczb. Rozjazd tutaj znaczy,
// że ciężki puklerz przestał być „tym samym puklerzem, tylko grubszym".
const porownaj = (wiersz, def, etykieta) => {
  // ⚠ `strength` MUSI tu być. Bez niego audyt 2026-09-16 znalazł rozjazd, którego
  //   ten zamek nie widział: `ironbound_shield` wymagał Siły 3, a baza deklarowała 0,
  //   więc żelazna okrągła o tej samej masie nie wymagała niczego.
  const pola = [["weight", def.weight], ["defense", def.defense], ["durability", def.durability],
                ["buyPrice", def.buyPrice], ["sellPrice", def.sellPrice],
                ["reduction", def.block.reduction], ["swingMul", def.block.swingMul],
                ["staminaCost", def.block.staminaCost],
                ["strength", def.requires ? def.requires.strength : 0]];
  const zle = pola.filter(([k, v]) => wiersz[k] !== v).map(([k, v]) => `${k}: baza ${wiersz[k]} ≠ item ${v}`);
  ok("V1", `⭐⭐ baza zgadza się z istniejącym \`${etykieta}\` co do liczby`,
     zle.length === 0, zle.join(" · "));
};
porownaj(BAZA.wood.buckler, CFG.ITEMS.buckler, "buckler");
porownaj(BAZA.metal.round, CFG.ITEMS.ironbound_shield, "ironbound_shield");

// ── V2. ⛔ Trzy nierówności nietykalne (`docs/tarcze_katalog.md` §2) ────────
// Padną, gdy ktoś podniesie redukcję Migdałowej albo Pawęży ponad Rycerską,
// albo złagodzi `swingMul` Pawęży — czyli gdy katalog stanie się drabinką.
for (const m of ["wood", "metal"]) {
  ok("V2", `⛔ ${m}: reduction(migdałowa) < reduction(rycerska)`,
     BAZA[m].almond.reduction < BAZA[m].heater.reduction,
     `${BAZA[m].almond.reduction} < ${BAZA[m].heater.reduction}`);
}
ok("V2", "⛔ reduction(pawęż) < reduction(rycerska)",
   BAZA.wood.pavise.reduction < BAZA.wood.heater.reduction,
   `${BAZA.wood.pavise.reduction} < ${BAZA.wood.heater.reduction}`);
const bezPawezy = Object.entries(BAZA.wood).filter(([k]) => k !== "pavise").map(([, v]) => v.swingMul);
ok("V2", "⛔ swingMul(pawęż) jest SKRAJNY — jedyna realna cena tej konstrukcji",
   BAZA.wood.pavise.swingMul > Math.max(...bezPawezy),
   `${BAZA.wood.pavise.swingMul} > ${Math.max(...bezPawezy)}`);

// ── V3. Katalog jest KOMPLETNY i osiągalny ─────────────────────────────────
// ⚠ „Przedmiot, którego nie da się kupić ani znaleźć, jest przedmiotem,
//   którego nie ma" — ta sama reguła, którą projekt zapisał przy żelazie.
const naPolkach = new Set([...CFG.SOBEK.stock, ...CFG.BLACKSMITH.stock]);
ok("V3", "⭐ w `ITEMS` stoi 30 tarcz", wszystkieTarcze.length === 30, String(wszystkieTarcze.length));

// ⚠⚠ `light` jest WYJĄTKIEM, nie domyślnym wariantem (decyzja autora 2026-09-16).
// Padnie, gdy ktoś doloży lekki puklerz „dla symetrii” — a to jest dokładnie
// ten ruch, który ten katalog raz już cofnął: 0,4 kg poniżej progu Modelu D.
const zLekkim = [...new Set(wszystkieTarcze.filter(([, d]) => d.variant === "light")
  .map(([id]) => id.replace(/^(wood|iron|steel)_/, "").replace(/_light$/, "")))];
ok("V3", "⛔⛔ `light` niesie WYŁĄCZNIE legionowa — nie jest wariantem domyślnym",
   zLekkim.length === 1 && zLekkim[0] === "scutum", zLekkim.join(", ") || "(brak)");
const osierocone = wszystkieTarcze.filter(([id]) => !naPolkach.has(id)).map(([id]) => id);
ok("V3", "⛔ żadna tarcza nie jest NIEOSIĄGALNA (każda na czyjejś półce)",
   osierocone.length === 0, osierocone.join(", "));
const bezCeny = wszystkieTarcze.filter(([, d]) => !(d.buyPrice > 0) || !(d.sellPrice > 0)).map(([id]) => id);
ok("V3", "⛔ żadna tarcza nie ma zerowej ceny", bezCeny.length === 0, bezCeny.join(", "));
const bezMasy = wszystkieTarcze.filter(([, d]) => !(d.weight > 0) || !(d.defense > 0)).map(([id]) => id);
ok("V3", "⛔ żadna tarcza nie ma zerowej masy ani zerowych PP", bezMasy.length === 0, bezMasy.join(", "));

// ── V4. ⭐⭐ CENA WARIANTU JEST WYLICZANA, NIE WPISANA (`B4`) ───────────────
// ⚠⚠ To jest zamek na WYMAGANIE, nie na implementację. Warianty tej samej
// konstrukcji i materiału muszą deklarować IDENTYCZNĄ cenę bazową — różnicę
// robi `variantPriceMul` w `buyPriceOf`. Padnie, gdy ktoś wpisze 39 cen ręcznie.
const grupy = new Map();
for (const [id, d] of wszystkieTarcze) {
  const klucz = `${id.replace(/^(wood|iron|steel)_/, "").replace(/_(light|heavy)$/, "")}|${d.material ?? "wood"}`;
  (grupy.get(klucz) ?? grupy.set(klucz, []).get(klucz)).push([id, d.buyPrice]);
}
const rozjechane = [...grupy.entries()]
  .filter(([, v]) => new Set(v.map(([, c]) => c)).size > 1)
  .map(([k, v]) => `${k}: ${v.map(([i, c]) => i + "=" + c).join(", ")}`);
ok("V4", "⭐⭐ warianty tej samej konstrukcji deklarują TĘ SAMĄ cenę bazową",
   rozjechane.length === 0, rozjechane.join(" · "));
ok("V4", "`variantPriceMul` realnie różnicuje: lekki < zwykły < ciężki",
   WAR.light.priceMul < WAR.regular.priceMul && WAR.regular.priceMul < WAR.heavy.priceMul,
   `${WAR.light.priceMul} < ${WAR.regular.priceMul} < ${WAR.heavy.priceMul}`);
ok("V4", "⭐ `buyPriceOf` NAPRAWDĘ mnoży przez `variantPriceMul` (nie sama stała)",
   /variantPriceMul\(itemVariant\(itemId\)\)/.test(Quality));
ok("V4", "…i `sellPriceOf` też — inaczej wariant sprzedawałby się po cenie zwykłego",
   (Quality.match(/variantPriceMul\(itemVariant\(itemId\)\)/g) ?? []).length === 2);

// ── V5. ⛔⛔ WARIANT NIE MA WŁASNEJ WŁAŚCIWOŚCI (`B1`, 2026-09-16) ──────────
// ⚠⚠ Najłatwiejszy do cichego złamania zamek w całym katalogu. „Ciężka pawęż
// powinna chyba trzymać szarżę" zabrzmi za trzy miesiące jak oczywistość —
// a to jest wariant „wzmocniony", którego ta gra świadomie NIE modeluje.
const POLA_LEGALNE = new Set(["id", "weight", "armorType", "material", "name", "type", "slot",
  "icon", "color", "tintIcon", "defense", "durability", "block", "size", "variant",
  "buyPrice", "sellPrice", "requires", "description",
  // ⚠ `construction` to KLASYFIKACJA (adres do `SHIELD_GEOMETRY`, `T-1`), a nie
  //   właściwość wariantu. Teza zamka jest nietknięta: wariant nic sobie nie dodał.
  "construction",
  // ⚠ `iconTexture` i `inventoryFootprint` (2026-09-19) to PREZENTACJA
  //   i MIEJSCE W PLECAKU — obie idą po KONSTRUKCJI, nie po wariancie:
  //   lekka i ciężka pawęż dzielą rysunek i zajmują te same dwa pola.
  //   ⛔ Teza zamka bez zmian: wariant nadal nie dodał sobie żadnej WŁAŚCIWOŚCI
  //   (nic, co zmienia zachowanie w walce).
  "iconTexture", "inventoryFootprint"]);
const lewe = wszystkieTarcze
  .flatMap(([id, d]) => Object.keys(d).filter((k) => !POLA_LEGALNE.has(k)).map((k) => `${id}.${k}`));
ok("V5", "⛔⛔ żadna tarcza nie niesie pola spoza listy — wariant nic sobie nie dodał",
   lewe.length === 0, lewe.join(", "));
const POLA_BLOKU = new Set(["reduction", "swingMul", "staminaCost"]);
const lewyBlok = wszystkieTarcze
  .flatMap(([id, d]) => Object.keys(d.block).filter((k) => !POLA_BLOKU.has(k)).map((k) => `${id}.block.${k}`));
ok("V5", "⛔ `BlockSpec` tarcz nadal ma TYLKO trzy pola — zero cech sytuacyjnych",
   lewyBlok.length === 0, lewyBlok.join(", "));
ok("V5", "⛔ wariant nie dotyka geometrii — żadna tarcza nie deklaruje łuków",
   wszystkieTarcze.every(([, d]) => !("fullArcDeg" in d) && !("sideArcDeg" in d)));

/* ══════════════════════════════════════════════════════════════════════════
   §T1 — GEOMETRIA JAKO DANE KONSTRUKCJI KONSTRUKCJI (2026-09-16)

   ⚠⚠ Ta grupa pilnuje MECHANIZMU, nie wartości. `SHIELD_GEOMETRY` jest dziś
   celowo pusty, bo wartości per konstrukcja rozstrzyga `B3` PO pomiarze `P1`.
   Zamki niżej dowodzą, że kiedy `B3` zapadnie, kalibracja będzie **dopisaniem
   wierszy do rejestru** — bez jednej zmiany w `Protection`, `DamageResolver`,
   `Equipment` i w 30 definicjach tarcz.

   ⛔ Żaden zamek tutaj nie sprawdza konkretnego kąta. Sprawdzają: skąd profil
   pochodzi, że dociera na miejsce, że brak profilu jest bezpieczny i że
   wariant ani jakość go nie ruszają.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§T1. `T-1` — geometria per konstrukcja: mechanizm, nie kalibracja:");

const { SHIELD_GEOMETRY: GEO, guardZone: zonaG, shieldGeometryFor: profilG,
        defaultGuardGeometry: domyslnyG, guardAngleDeg: katG } = T7;

const GLOB = domyslnyG();
ok("T1-0", "globalny profil to nadal `SHIELD.fullArcDeg`/`sideArcDeg`",
   GLOB.fullArcDeg === CFG.SHIELD.fullArcDeg && GLOB.sideArcDeg === CFG.SHIELD.sideArcDeg,
   `${GLOB.fullArcDeg}° / ${GLOB.sideArcDeg}°`);
// ⏳ Informacyjnie: dzisiejszy stan `B3`. To NIE jest zamek na pustkę — rejestr
//   ma prawo się zapełnić i wtedy ten wiersz po prostu pokaże liczbę.
console.log(`  ⏳ wpisów w SHIELD_GEOMETRY: ${Object.keys(GEO).length} (B3 czeka na P1)`);
// ⚠⚠ Zamek na PÓŁ-wpis: to jest jedyny sposób, w jaki ten rejestr może zabić
//   blokowanie po cichu — `NaN < x` jest `false`, więc tarcza przestałaby
//   blokować kiedykolwiek, a raport wyglądałby normalnie.
const polowiczne = Object.entries(GEO).filter(
  ([, v]) => !v || !Number.isFinite(v.fullArcDeg) || !Number.isFinite(v.sideArcDeg));
ok("T1-0", "⛔ żaden wpis rejestru nie jest POŁOWICZNY", polowiczne.length === 0,
   polowiczne.map(([k]) => k).join(", "));

// ── T1-1. Fallback: brak profilu = globalny, bez wyjątku ─────────────────────
let rzucilo = false;
try { profilG(null); profilG(undefined); profilG("nie_ma_takiej_konstrukcji"); }
catch { rzucilo = true; }
ok("T1-1", "⛔ brak konfiguracji NIE rzuca wyjątku", !rzucilo);
for (const [etykieta, arg] of [["null", null], ["nieznana konstrukcja", "nie_ma_takiej"]]) {
  const g = profilG(arg);
  ok("T1-1", `fallback dla ${etykieta} = profil globalny`,
     g.fullArcDeg === GLOB.fullArcDeg && g.sideArcDeg === GLOB.sideArcDeg,
     `${g.fullArcDeg}° / ${g.sideArcDeg}°`);
}

// ── T1-2. Konstrukcja MOŻE dostarczyć własny profil ──────────────────────────
// ⚠ Wstrzykujemy do rejestru i sprzątamy po sobie — to jest test MECHANIZMU,
//   a nie propozycja wartości dla pawęży.
const PROBNY = { fullArcDeg: 90, sideArcDeg: 140 };
GEO.pavise = PROBNY;
const gPawez = profilG("pavise");
ok("T1-2", "⭐ konstrukcja z wpisem dostaje SWÓJ profil, nie globalny",
   gPawez.fullArcDeg === 90 && gPawez.sideArcDeg === 140,
   `${gPawez.fullArcDeg}° / ${gPawez.sideArcDeg}°`);
ok("T1-2", "⛔ …a konstrukcja BEZ wpisu dalej ma globalny",
   profilG("buckler").fullArcDeg === GLOB.fullArcDeg);

// ── T1-3. `BlockSpec` dostaje właściwy profil ────────────────────────────────
const zalozG = (id) => { Eq7.reset(); Eq7.offhand = mk7(id, 1, 3); };
zalozG("wood_pavise");
const bsPawez = Eq7.blockSpec;
ok("T1-3", "⭐ `BlockSpec` niesie profil SWOJEJ konstrukcji",
   bsPawez.geometry.fullArcDeg === 90 && bsPawez.geometry.sideArcDeg === 140,
   `${bsPawez.geometry.fullArcDeg}° / ${bsPawez.geometry.sideArcDeg}°`);
zalozG("buckler");
ok("T1-3", "⛔ tarcza bez wpisu niesie profil globalny (nie `undefined`)",
   Eq7.blockSpec.geometry.fullArcDeg === GLOB.fullArcDeg &&
   Eq7.blockSpec.geometry.sideArcDeg === GLOB.sideArcDeg);

// ── T1-4. ⭐⭐ RESOLVER KORZYSTA Z PROFILU, NIE ZE ŚLEPEGO 60° ────────────────
// Kąt 70° leży MIĘDZY globalnym `fullArcDeg` (60) a próbnym (90), więc ten sam
// cios musi dać dwie różne strefy w zależności od profilu. To jest cały dowód.
const kier = (stopnie) => {
  const r = (stopnie * Math.PI) / 180;
  return { x: Math.cos(r), y: Math.sin(r) };
};
const from70 = kier(70);
ok("T1-4", "przygotowanie: cios pada pod ~70° od zwrotu gracza",
   Math.abs(katG(PRAWO, from70) - 70) < 0.5, `${katG(PRAWO, from70).toFixed(1)}°`);
const strefaGlob = zonaG(PRAWO, from70);
const strefaProfil = zonaG(PRAWO, from70, PROBNY);
ok("T1-4", "⭐⭐ ten sam cios daje INNĄ strefę pod profilem konstrukcji",
   strefaGlob === "side" && strefaProfil === "front",
   `globalny: ${strefaGlob} → profil 90°: ${strefaProfil}`);
// I to samo PRZEZ RESOLVER, nie tylko przez `guardZone`.
const kontekstG = (geo) => ({
  amount: 20, damageType: null, from: from70, guardDir: PRAWO,
  invulnerable: false, dodgeChance: 0, parryChance: 0,
  armorReduction: 0, blockReduction: 0.5, blockSideMul: 0.5,
  blockCapacity: Infinity, blockOverflowKeep: 1, blockGeometry: geo,
});
const wynGlob = resolveIncoming(kontekstG(undefined));
const wynProfil = resolveIncoming(kontekstG(PROBNY));
ok("T1-4", "⭐⭐ RESOLVER zdejmuje więcej pod profilem konstrukcji",
   wynGlob.zone === "side" && wynProfil.zone === "front" && wynProfil.mitigated < wynGlob.mitigated,
   `${wynGlob.mitigated} pkt (bok) → ${wynProfil.mitigated} pkt (front)`);
ok("T1-4", "⛔ brak profilu w kontekście = zachowanie sprzed `T-1`",
   resolveIncoming(kontekstG(undefined)).zone === zonaG(PRAWO, from70));

// ── T1-5. Determinizm i ostrość granicy ──────────────────────────────────────
ok("T1-5", "⛔ strefa jest DETERMINISTYCZNA — dwadzieścia wywołań, jeden wynik",
   new Set(Array.from({ length: 20 }, () => zonaG(PRAWO, from70, PROBNY))).size === 1);
// ⚠ Granica OSTRA (`<`), ta sama konwencja co `isFrontal`: kąt DOKŁADNIE równy
//   `fullArcDeg` należy już do pasa bocznego.
const from90 = kier(90);
ok("T1-5", "⛔ kąt DOKŁADNIE równy `fullArcDeg` wpada do BOKU, nie do frontu",
   zonaG(PRAWO, from90, PROBNY) === "side", `${katG(PRAWO, from90).toFixed(1)}°`);
ok("T1-5", "…a tuż pod granicą — do frontu",
   zonaG(PRAWO, kier(89.5), PROBNY) === "front");

// ── T1-6. Profil USZKODZONY spada na fallback, nie zabija bloku ──────────────
GEO.pavise = { fullArcDeg: 90 };                    // brak `sideArcDeg`
const gUszk = profilG("pavise");
ok("T1-6", "⚠⚠ połowiczny profil = fallback (zero cichego `NaN`)",
   gUszk.fullArcDeg === GLOB.fullArcDeg && gUszk.sideArcDeg === GLOB.sideArcDeg);
GEO.pavise = { fullArcDeg: NaN, sideArcDeg: NaN };
ok("T1-6", "⛔ `NaN` w profilu też spada na fallback",
   profilG("pavise").fullArcDeg === GLOB.fullArcDeg);
delete GEO.pavise;                                   // sprzątamy po teście
ok("T1-6", "⛔ rejestr wrócił do stanu sprzed testu", GEO.pavise === undefined);

// ── T1-7. Katalog 30 tarcz pozostaje KOMPATYBILNY ────────────────────────────
const wszystkie = Object.entries(CFG.ITEMS).filter(([, d]) => d.block !== undefined);
const bezKonstrukcji = wszystkie.filter(([, d]) => typeof d.construction !== "string").map(([id]) => id);
ok("T1-7", "⭐ wszystkie 30 tarcz deklaruje `construction`", bezKonstrukcji.length === 0,
   bezKonstrukcji.join(", "));
const zleGeo = [];
for (const [id] of wszystkie) {
  Eq7.reset(); Eq7.offhand = mk7(id, 1, 3);
  const g = Eq7.blockSpec && Eq7.blockSpec.geometry;
  if (!g || !Number.isFinite(g.fullArcDeg) || !Number.isFinite(g.sideArcDeg)) zleGeo.push(id);
}
ok("T1-7", "⭐ każda z 30 tarcz daje POPRAWNY profil przez `BlockSpec`",
   zleGeo.length === 0, zleGeo.join(", "));
ok("T1-7", "⛔ `construction` wskazuje na istniejący wiersz `SHIELD_BASE`",
   wszystkie.every(([, d]) =>
     d.construction in CFG.SHIELD_BASE.wood || d.construction in CFG.SHIELD_BASE.metal));

// ── T1-8. ⛔⛔ WARIANT I JAKOŚĆ NIE RUSZAJĄ GEOMETRII ─────────────────────────
// Niezmiennik z §1.2 checkpointu: łuk należy do KONSTRUKCJI. Padnie, gdy ktoś
// spróbuje zrobić z ciężkiej tarczy „szerszej” tarczy.
const geoDla = (id, q) => { Eq7.reset(); Eq7.offhand = mk7(id, 1, q); return Eq7.blockSpec.geometry; };
const gLekka = geoDla("wood_scutum_light", 3), gZwykla = geoDla("wood_scutum", 3);
ok("T1-8", "⛔⛔ wariant NIE zmienia łuku (lekka == zwykła legionowa)",
   gLekka.fullArcDeg === gZwykla.fullArcDeg && gLekka.sideArcDeg === gZwykla.sideArcDeg);
const gQ1 = geoDla("wood_scutum", 1), gQ7 = geoDla("wood_scutum", 7);
ok("T1-8", "⛔⛔ jakość NIE zmienia łuku (Q1 == Q7)",
   gQ1.fullArcDeg === gQ7.fullArcDeg && gQ1.sideArcDeg === gQ7.sideArcDeg);
ok("T1-8", "⛔ żadna tarcza nie deklaruje łuku NA PRZEDMIOCIE",
   wszystkie.every(([, d]) => !("fullArcDeg" in d) && !("sideArcDeg" in d)));
Eq7.reset();

/* ══════════════════════════════════════════════════════════════════════════
   §C — `OI-24`: CAP REDUKCJI. KTÓRY KANAŁ JEST OGRANICZONY I CZY DA SIĘ GO OBEJŚĆ

   ⚠⚠ **Najważniejsze zdanie tej grupy, bo łatwo je przeczytać odwrotnie:**
   `EQUIPMENT.maxDefenseReduction = 0,75` jest sufitem **KANAŁU PANCERZA**,
   a nie łącznej mitygacji. Tarcza mnoży się PO nim, więc łączna redukcja
   przekracza 0,75 — i to jest dokładnie treść otwartego `OI-24`, nie błąd.

   ── KOLEJNOŚĆ OPERACJI (2.1), odczytana z kodu ────────────────────────────
     1. punkty obrony:  Σ(instanceDefense)  = baza × materiał × jakość × stan
     2. profil typu:    armorPointsAgainst(punkty, typ, damageType)
     3. KRZYWA + CAP:   min(d/(d+defenseK), maxDefenseReduction)   ← Protection
     4. resolver:       afterArmor = 1 − armorReduction
     5. strefa tarczy:  blocked = reduction | reduction × sideMul | 0
     6. wynik:          amount × afterArmor × (1 − blocked) + przeciążenie
   ⇒ **Cap stoi w kroku 3 i nic po nim nie dodaje do kanału pancerza.**
     Kroki 5–6 są OSOBNYM kanałem (tarcza), mnożonym, nie sumowanym.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§C. `OI-24` — cap redukcji: gdzie stoi i czy da się go obejść:");

const { reductionFromPoints } = T7;
const CAP = CFG.EQUIPMENT.maxDefenseReduction;
const K = CFG.EQUIPMENT.defenseK;
ok("C1", "⛔ `maxDefenseReduction` nietknięte (0,75)", CAP === 0.75, String(CAP));
ok("C1", "⛔ `defenseK` nietknięte (50)", K === 50, String(K));
ok("C1", "⭐ cap jest zaaplikowany W JEDNYM miejscu — `reductionFromPoints`",
   (protX2.match(/maxDefenseReduction/g) ?? []).length === 1,
   `wystąpień w Protection.ts: ${(protX2.match(/maxDefenseReduction/g) ?? []).length}`);
ok("C1", "⭐ …i jest to `Math.min`, czyli SUFIT, nie skalowanie",
   /Math\.min\(points \/ \(points \+ EQUIPMENT\.defenseK\), EQUIPMENT\.maxDefenseReduction\)/.test(protX2));

// ── C2. Test graniczny (2.4) ───────────────────────────────────────────────
// Punkty odwrotne do krzywej: d = K·r/(1−r).
const punktyDla = (r) => (K * r) / (1 - r);
for (const [cel, oczek] of [[0.749, 0.749], [0.75, 0.75], [0.751, 0.75], [0.9, 0.75], [0.999, 0.75]]) {
  const wynik = reductionFromPoints(punktyDla(cel));
  const zgodne = Math.abs(wynik - oczek) < 1e-9;
  ok("C2", `krzywa ${cel} → ${oczek}`, zgodne, `${wynik.toFixed(6)} (d = ${punktyDla(cel).toFixed(1)} pkt)`);
}
ok("C2", "⛔ punkty ≤ 0 dają ZERO, nie `NaN`",
   reductionFromPoints(0) === 0 && reductionFromPoints(-5) === 0);
ok("C2", "⛔ nawet absurdalna liczba punktów nie przebija capu",
   reductionFromPoints(1e9) === CAP && reductionFromPoints(Number.MAX_SAFE_INTEGER) === CAP);

// ── C3. ⭐⭐ CZY CAP DA SIĘ OBEJŚĆ RZECZYWISTYM SPRZĘTEM (2.3) ──────────────
// Brutalnie: najlepszy legalny przedmiot na każdy adres, najwyższa jakość,
// przeciw każdemu typowi obrażeń. Kanał pancerza NIE MA prawa przekroczyć capu.
// ⚠⚠ Adresy bierzemy z `EQUIP_SLOTS` (model C: 18 adresów = slot + warstwa),
//   a przynależność rozstrzyga `Eq7.accepts`. Pierwsza wersja tego zamka
//   grupowała po `def.slot` i zbudowała komplet PÓŁPUSTY (28% zamiast ~40%),
//   bo warstwowe adresy nie są tym samym co pole `slot` na przedmiocie.
const SLOTY = T7.EQUIP_SLOTS;
const pancerze = Object.entries(CFG.ITEMS)
  .filter(([, d]) => d.type === "armor" && typeof d.defense === "number")
  .sort((a, b) => b[1].defense - a[1].defense);
Eq7.reset();
for (const slot of SLOTY) {
  if (slot === "offhand") continue;                 // tarcza osobno, w C4
  const trafiony = pancerze.find(([id]) => Eq7.accepts(slot, id));
  if (trafiony) Eq7[slot] = mk7(trafiony[0], 1, 7);
}
const TYPY = [undefined, "slash", "pierce", "blunt"];
const przekroczenia = [];
let najwyzszaPancerz = 0;
for (const t of TYPY) {
  const r = Eq7.reductionAgainst(t);
  najwyzszaPancerz = Math.max(najwyzszaPancerz, r);
  if (r > CAP + 1e-9) przekroczenia.push(`${t ?? "bez typu"}: ${r.toFixed(4)}`);
}
ok("C3", "⭐⭐ PEŁEN sprzęt w jakości 7 nie przebija capu w żadnym typie",
   przekroczenia.length === 0,
   `max ${najwyzszaPancerz.toFixed(4)} ≤ ${CAP}` + (przekroczenia.length ? " — " + przekroczenia.join(", ") : ""));
ok("C3", "⛔ nic nie mnoży redukcji PO capie — `reductionAgainst` zwraca wprost `reductionFromPoints`",
   /reductionAgainst\(damageType\?: DamageType\): number \{\s*\n\s*return reductionFromPoints\(this\.defenseAgainst\(damageType\)\);\s*\n\s*\}/
     .test(eqX2));
ok("C3", "⛔ premie zestawów wchodzą w PUNKTY (przed krzywą), nie w redukcję po capie",
   !/setBonus[\s\S]{0,200}reductionFromPoints|reductionFromPoints[\s\S]{0,200}setBonus/.test(eqX2));

// ── C4. ⚠⚠ ŁĄCZNA MITYGACJA — TO JEST TREŚĆ `OI-24`, NIE BŁĄD ─────────────
// Tarcza mnoży się PO pancerzu, więc łączna redukcja MOŻE przekroczyć 0,75.
// Zamek NIE żąda, żeby było inaczej — pilnuje, żeby to było ŚWIADOME i mierzone.
const najlepszaTarcza = Object.entries(CFG.ITEMS)
  .filter(([, d]) => d.block !== undefined)
  .sort((a, b) => b[1].block.reduction - a[1].block.reduction)[0];
Eq7.offhand = mk7(najlepszaTarcza[0], 1, 7);
const rPancerz = Eq7.reductionAgainst();
const rTarcza = Eq7.blockSpec.reduction;
const laczna = 1 - (1 - rPancerz) * (1 - rTarcza);
console.log(`  ⚠ ŁĄCZNA (pancerz × tarcza od frontu): ${(laczna * 100).toFixed(1)}%` +
            `  — pancerz ${(rPancerz * 100).toFixed(1)}% × tarcza ${(rTarcza * 100).toFixed(1)}%` +
            `  [${najlepszaTarcza[0]}, Q7]`);
ok("C4", "⚠⚠ ŁĄCZNA mitygacja PRZEKRACZA 0,75 — `OI-24` jest OTWARTE i to jest fakt, nie regresja",
   laczna > CAP, `${(laczna * 100).toFixed(1)}% > ${CAP * 100}%`);
ok("C4", "⛔ …ale kanał PANCERZA w tym samym zestawie nadal siedzi pod capem",
   rPancerz <= CAP + 1e-9, `${(rPancerz * 100).toFixed(1)}%`);
ok("C4", "⛔ nie istnieje wspólny sufit ŁĄCZNEJ mitygacji — gdyby powstał, ten zamek ma paść",
   !/maxTotalMitigation|totalReductionCap/.test(eqX2 + resX2 + protX2));
Eq7.reset();

await Promise.all(
  [unlink(stubPhaser), unlink(stubBus), unlink(tmpProt), unlink(tmpCfg), unlink(tmpEq), unlink(tmpQual),
   unlink(tmpT7), unlink(wejscieT7)]
    .map((p) => p.catch(() => {})),
);

console.log(`\n${bledow === 0 ? "OK" : "❌"} — zamków czerwonych: ${bledow}`);
console.log("⚠ Ten przymiar NIE zawiera katalogu kandydackiego — patrz nagłówek pliku.");
process.exit(bledow === 0 ? 0 : 1);

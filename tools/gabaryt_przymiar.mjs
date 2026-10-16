/**
 * **Przymiar GABARYTU W PLECAKU** — `1×1` i `1×2` (2026-09-18).
 *
 * ── Po co osobny plik ──────────────────────────────────────────────────────
 * Bo w `tools/` nie było DOTĄD ANI JEDNEJ asercji na logikę plecaka. Są
 * przymiary układu (`ekwipunek_uklad`, `hud_uklad`, `sklep_uklad`) i jest
 * `rece_przymiar` na granicę rąk — ale „czy `addItem` znajdzie miejsce",
 * „czy `moveSlot` nie zostawi ducha" i „czy zdjęcie torby nie utnie przedmiotu
 * w pół" nie sprawdzało nic. Gabaryt jest pierwszą rzeczą, która potrafi ten
 * brak zamienić w cichy błąd stanu, więc bramka powstaje razem z nim.
 *
 * ── Dlaczego SYNTETYCZNY przedmiot ─────────────────────────────────────────
 * ⛔ **Żaden przedmiot w katalogu nie ma dziś gabarytu `1×2` i nie dostanie go
 * w tym zadaniu** — przypisanie broni i tarcz jest osobną decyzją contentową.
 * Przymiar wstrzykuje więc do `ITEMS` dwie atrapy (`__test_1x2`, `__test_2x1`)
 * i bada na nich mechanizm. Ten sam chwyt, co §D w `zestawy_przymiar.mjs`.
 * ⚠ Atrapy żyją **wyłącznie w pamięci tego procesu** — `GameConfig.ts` nie jest
 * dotykany.
 *
 * ── Co ten przymiar ma złapać ──────────────────────────────────────────────
 * Jeden konkretny tryb awarii, który przy gabarycie jest łatwy i cichy:
 * **„duch" drugiej połowy** — przedmiot znika z kotwicy, a pole pod nią zostaje
 * zajęte na zawsze. Stąd asercje liczące zajęte pola PO każdej operacji.
 *
 *   node tools/gabaryt_przymiar.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek zamek padnie.
 */
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...c) => join(KORZEN, ...c);

let bledow = 0;
const ok = (opis, warunek, detal = "") => {
  if (warunek) console.log(`  OK   ${opis}${detal ? "   " + detal : ""}`);
  else { bledow++; console.log(`  BŁĄD ${opis}${detal ? "   " + detal : ""}`); }
};

const stubPhaser = P("node_modules", ".g-phaser.ts");
const stubBus = P("node_modules", ".g-bus.ts");
await writeFile(stubPhaser, "export default {};\n");
await writeFile(stubBus,
  "export const GameEvents = { emit() {}, on() {}, off() {} };\n" +
  "export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n");
const wejscie = P("node_modules", ".g-entry.ts");
await writeFile(wejscie, [
  'export { Inventory } from "../src/core/Inventory";',
  'export * from "../src/core/Equipment";',
  'export { Progression } from "../src/core/Progression";',
  'export { itemFootprint } from "../src/core/Items";',
  'export { ITEMS, INVENTORY, ASSETS } from "../src/config/GameConfig";',
].join("\n") + "\n");
const bundel = P("node_modules", ".g-all.mjs");
await build({
  format: "esm", bundle: true, logLevel: "silent", platform: "node",
  entryPoints: [wejscie], outfile: bundel,
  alias: { phaser: stubPhaser },
  plugins: [{ name: "bus", setup: (b) => b.onResolve({ filter: /\.\/EventBus$/ }, () => ({ path: stubBus })) }],
});
const M = await import(pathToFileURL(bundel).href);
const { Inventory, Equipment, Progression, itemFootprint, ITEMS, INVENTORY, ASSETS, describeHandsRefusal } = M;

/* ── Atrapy ─────────────────────────────────────────────────────────────── */
const baza = {
  type: "misc", name: "ATRAPA", icon: { col: 0, row: 0 }, color: 0xffffff,
  buyPrice: 1, sellPrice: 1, description: "atrapa przymiaru",
};
ITEMS.__test_1x1 = { ...baza, id: "__test_1x1", name: "Atrapa 1x1" };
ITEMS.__test_1x2 = { ...baza, id: "__test_1x2", name: "Atrapa 1x2", inventoryFootprint: { w: 1, h: 2 } };
ITEMS.__test_2x1 = { ...baza, id: "__test_2x1", name: "Atrapa 2x1", inventoryFootprint: { w: 2, h: 1 } };

const COLS = INVENTORY.cols;
const czysto = () => { Inventory.reset(); };
/** Ile pól jest PRZYKRYTYCH (nie: ile `slots` jest niepustych). */
const zajete = () => {
  let n = 0;
  for (let c = 0; c < Inventory.capacity; c++) if (Inventory.anchorCovering(c) !== null) n++;
  return n;
};
/** Ile EGZEMPLARZY leży w tablicy — zamek na duplikację. */
const sztuk = (id) => Inventory.slots.filter((s) => s && s.itemId === id).length;

console.log("=== PRZYMIAR GABARYTU W PLECAKU ===\n");

/* ══ §A. Geometria jest własnością MODELU ═══════════════════════════════ */
console.log("§A. Geometria modelu:");
ok("⭐⭐ liczba kolumn pochodzi z `INVENTORY.cols`, nie z UI", Inventory.cols === INVENTORY.cols, `${Inventory.cols}`);
ok("⛔ …i wynosi 4 (decyzja 2026-09-18)", Inventory.cols === 4, `${Inventory.cols}`);
czysto();
ok("bazowa pojemność 16 = 4 wiersze", Inventory.capacity === 16 && Inventory.rows === 4,
   `cap=${Inventory.capacity} rows=${Inventory.rows}`);
// ⚠ Do 2026-09-19 stały tu dwie asercje mówiące „żaden przedmiot nie deklaruje
// gabarytu" — i były prawdziwe, bo oś weszła bez ani jednego użytkownika.
// Pierwszymi użytkownikami są TRZY KONSTRUKCJE TARCZ (migdałowa, legionowa,
// pawęż), każda w dwóch wariantach. ⛔ Asercji nie skasowano: dostała mocniejszą
// postać, która pilnuje, ŻE GABARYT MA WŁAŚNIE TE PRZEDMIOTY I ŻADNYCH INNYCH.
ok("⭐ brak pola `inventoryFootprint` znaczy 1×1",
   Object.values(ITEMS).filter((i) => !String(i.id).startsWith("__test_"))
     .filter((i) => !("inventoryFootprint" in i))
     .every((i) => { const f = itemFootprint(i.id); return f.w === 1 && f.h === 1; }));
const zGabarytem = Object.values(ITEMS)
  .filter((i) => !String(i.id).startsWith("__test_") && "inventoryFootprint" in i);
// ⚠⚠ 2026-10-01: REGUŁA zamiast listy. Autor: „gabaryt 1×2 mają mieć też
// bronie — to nie wyjątek, to reguła; łatwiej rysować duże i średnie bronie na
// dwóch kratkach". Do tej daty stała tu lista dozwolonych (tarcze trzech
// konstrukcji, potem + drzewcowe) i każda nowa rodzina broni musiała ją łatać.
// ⭐ Dziś gabaryt WYNIKA Z IKONY: przedmiot z ikoną 32×64 leży na dwóch polach,
// z ikoną 32×32 (albo kaflem `items.png`) na jednym. Sprawdzane na PLIKACH PNG,
// nie na deklaracjach — inaczej asercja porównywałaby pole samo ze sobą.
const ikony = new Map();
(function zbierz(v) {
  if (!v || typeof v !== "object") return;
  if (typeof v.key === "string" && typeof v.path === "string") ikony.set(v.key, v.path);
  for (const w of Array.isArray(v) ? v : Object.values(v)) zbierz(w);
})(ASSETS);
const wymiarIkony = (i) => {
  if (!i.iconTexture) return { w: 32, h: 32, zrodlo: "items.png" };
  const sciezka = ikony.get(i.iconTexture);
  if (!sciezka) return null;
  const b = readFileSync(P("public", sciezka));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), zrodlo: sciezka };
};
// ⚠ Ikona idzie po KONSTRUKCJI (żelazny bliźniak ma tę samą bryłę co stalowy),
//   więc o gabarycie decyduje ikona konstrukcji, nie egzemplarza: żelazna tarcza
//   legionowa bez własnego PNG (`OI-126`) leży na 1×2, bo drewniana ma 32×64.
const wysokaKonstrukcja = new Set();
for (const i of Object.values(ITEMS)) {
  const d = i.construction && wymiarIkony(i);
  if (d && d.h === 64) wysokaKonstrukcja.add(`${i.type}:${i.construction}`);
}
const rozjazd = [];
for (const i of Object.values(ITEMS)) {
  if (String(i.id).startsWith("__test_")) continue;
  const d = wymiarIkony(i);
  const f = itemFootprint(i.id);
  if (!d) { rozjazd.push(`${i.id}: ikona ${i.iconTexture} bez wpisu w ASSETS`); continue; }
  const oczek = d.h === 64 || (i.construction && wysokaKonstrukcja.has(`${i.type}:${i.construction}`)) ? 2 : 1;
  if (d.w !== 32 || (d.h !== 32 && d.h !== 64)) rozjazd.push(`${i.id}: ikona ${d.w}×${d.h}`);
  else if (f.w !== 1 || f.h !== oczek) rozjazd.push(`${i.id}: ikona 32×${d.h}, gabaryt ${f.w}×${f.h}`);
}
ok("⭐⭐ gabaryt WYNIKA Z IKONY KONSTRUKCJI: 32×64 ⟺ 1×2, 32×32 ⟺ 1×1 — dla każdego przedmiotu",
   zGabarytem.length > 0 && rozjazd.length === 0,
   rozjazd.length ? rozjazd.slice(0, 6).join(" · ") : `${zGabarytem.length} szt. 1×2`);
const bronie = Object.values(ITEMS).filter((i) => i.type === "weapon" && !String(i.id).startsWith("__test_"));
// ⭐ Decyzja autora 2026-10-02: 1×1 WYŁĄCZNIE dla broni do ~45 cm (sztylety,
// toporek) — krótki miecz (65 cm) przeszedł wtedy na 1×2. Sprawdzane na broni
// z WŁASNĄ ikoną: broń na kaflu `items.png` czeka na wsad i jeszcze nic nie mówi.
const krotkie = bronie.filter((i) => i.iconTexture && itemFootprint(i.id).h === 1);
const doKrotkich = (i) => i.family === "dagger" || i.construction === "hatchet" || i.id === "hatchet";
ok("⭐ 1×1 z własną ikoną mają WYŁĄCZNIE sztylety i toporek (do ~45 cm)",
   krotkie.length > 0 && krotkie.every(doKrotkich),
   `${krotkie.map((i) => i.id).join(", ")}${krotkie.some((i) => !doKrotkich(i)) ? " ⛔ spoza: " + krotkie.filter((i) => !doKrotkich(i)).map((i) => i.id).join(", ") : ""}`);
ok("⭐ broń średnia i duża JEST na 1×2 — wśród broni są oba kształty (sztylety 1×1)",
   bronie.some((i) => itemFootprint(i.id).h === 2) && bronie.some((i) => itemFootprint(i.id).h === 1),
   `${bronie.filter((i) => itemFootprint(i.id).h === 2).length} z ${bronie.length} broni jest 1×2`);
ok("⛔ …i każdy z nich jest 1×2, nigdy 2×1 ani 2×2 (dziś obsługiwane są dwa kształty)",
   zGabarytem.every((i) => { const f = itemFootprint(i.id); return f.w === 1 && f.h === 2; }));
ok("⭐ …a KAŻDA drzewcowa go ma — gabaryt idzie po RODZINIE, bo żadna nie mieści się w 32 px",
   Object.values(ITEMS).filter((i) => i.family === "polearm").length >= 6 &&
   Object.values(ITEMS).filter((i) => i.family === "polearm").every((i) => itemFootprint(i.id).h === 2),
   `${Object.values(ITEMS).filter((i) => i.family === "polearm").map((i) => i.id).join(", ")}`);
ok("⭐ …a KAŻDA sztuka tych trzech konstrukcji go ma — wariant ciężki też",
   Object.values(ITEMS)
     .filter((i) => ["almond", "scutum", "pavise"].includes(i.construction))
     .every((i) => itemFootprint(i.id).h === 2));

/* ══ §B. Granice siatki ════════════════════════════════════════════════ */
console.log("\n§B. Granice siatki:");
czysto();
const ostatniWiersz = Inventory.capacity - COLS; // 12
ok("1×2 mieści się w przedostatnim wierszu", Inventory.cellsFor(ostatniWiersz - COLS, { w: 1, h: 2 }) !== null);
ok("⛔ 1×2 NIE mieści się w OSTATNIM wierszu (dolna krawędź)",
   Inventory.cellsFor(ostatniWiersz, { w: 1, h: 2 }) === null, `kotwica ${ostatniWiersz}`);
ok("⛔ 2×1 NIE mieści się w OSTATNIEJ kolumnie (prawa krawędź)",
   Inventory.cellsFor(COLS - 1, { w: 2, h: 1 }) === null, `kotwica ${COLS - 1}`);
ok("2×1 mieści się w przedostatniej kolumnie", Inventory.cellsFor(COLS - 2, { w: 2, h: 1 }) !== null);
ok("⛔ kotwica poza pojemnością odrzucona", Inventory.cellsFor(Inventory.capacity, { w: 1, h: 1 }) === null);
ok("⭐ 1×2 zajmuje pola `i` oraz `i + cols`",
   JSON.stringify(Inventory.cellsFor(0, { w: 1, h: 2 })) === JSON.stringify([0, COLS]));

/* ══ §C. Placement ═════════════════════════════════════════════════════ */
console.log("\n§C. Umieszczanie:");
czysto();
ok("1×1: `addItem` kładzie w pierwszym wolnym polu",
   Inventory.addItem("__test_1x1", 1) === 0 && Inventory.slots[0]?.itemId === "__test_1x1");
czysto();
ok("1×2: `addItem` kładzie JEDEN egzemplarz", Inventory.addItem("__test_1x2", 1) === 0 && sztuk("__test_1x2") === 1);
ok("⭐ …i zajmuje DWA pola", zajete() === 2, `zajętych ${zajete()}`);
ok("⭐ …a drugie pole jest w `slots` PUSTE (kotwica jest jedynym źródłem prawdy)",
   Inventory.slots[COLS] === null && Inventory.anchorCovering(COLS) === 0);
czysto();
// zapchanie siatki tak, żeby zostały wolne pola, ale żadna pionowa PARA
for (let c = 0; c < Inventory.capacity; c++) {
  const wiersz = Math.floor(c / COLS);
  if (wiersz % 2 === 0) Inventory.slots[c] = { itemId: "__test_1x1", qty: 1, quality: 3 };
}
Inventory.emitChanged();
ok("⛔ 1×2 ODMAWIA, gdy są wolne pola, ale nie ma pionowej PARY",
   Inventory.firstFitFor({ w: 1, h: 2 }) === null && Inventory.freeSlotCount === 8,
   `wolnych ${Inventory.freeSlotCount}`);
ok("⛔ …i `hasRoomFor` mówi to samo (nie liczy samych wolnych pól)",
   Inventory.hasRoomFor("__test_1x2", 1) === false);
ok("⛔ …a `addItem` nic nie kładzie", Inventory.addItem("__test_1x2", 1) === 1 && sztuk("__test_1x2") === 0);
ok("⭐ …natomiast 1×1 dalej wchodzi bez zmian", Inventory.hasRoomFor("__test_1x1", 1) === true);

/* ══ §D. Przenoszenie ══════════════════════════════════════════════════ */
console.log("\n§D. Przenoszenie:");
czysto();
Inventory.addItem("__test_1x2", 1);            // kotwica 0, zajmuje 0 i 4
ok("przeniesienie 1×2 z 0 na 1 udaje się", Inventory.moveSlot(0, 1) === true);
ok("⭐ …oba STARE pola zwolnione, oba NOWE zajęte",
   Inventory.anchorCovering(0) === null && Inventory.anchorCovering(COLS) === null &&
   Inventory.anchorCovering(1) === 1 && Inventory.anchorCovering(1 + COLS) === 1);
ok("⛔ …i nadal jest DOKŁADNIE JEDEN egzemplarz (brak ducha, brak kopii)",
   sztuk("__test_1x2") === 1 && zajete() === 2);
ok("⭐ chwyt za DRUGĄ POŁOWĘ też przenosi cały przedmiot",
   Inventory.moveSlot(1 + COLS, 2) === true && Inventory.anchorCovering(2) === 2 && sztuk("__test_1x2") === 1);
const przed = zajete();
ok("⛔ przeniesienie POZA dolną krawędź ODRZUCONE i stan NIETKNIĘTY",
   Inventory.moveSlot(2, ostatniWiersz) === false && zajete() === przed && sztuk("__test_1x2") === 1);

/* ══ §E. Zamiana ═══════════════════════════════════════════════════════ */
console.log("\n§E. Zamiana:");
czysto();
Inventory.slots[0] = { itemId: "__test_1x2", qty: 1, quality: 3 };  // 0 + 4
Inventory.slots[1] = { itemId: "__test_1x1", qty: 1, quality: 3 };
Inventory.emitChanged();
ok("1×2 ↔ 1×1: zamiana udaje się", Inventory.moveSlot(0, 1) === true);
ok("⭐ …1×2 stoi teraz w 1 i 5, a 1×1 w 0",
   Inventory.anchorCovering(1) === 1 && Inventory.anchorCovering(1 + COLS) === 1 &&
   Inventory.slots[0]?.itemId === "__test_1x1");
ok("⛔ …i oba przedmioty istnieją po jednym razie",
   sztuk("__test_1x2") === 1 && sztuk("__test_1x1") === 1 && zajete() === 3);
czysto();
Inventory.slots[0] = { itemId: "__test_1x2", qty: 1, quality: 3 };  // 0 + 4
Inventory.slots[1] = { itemId: "__test_1x1", qty: 1, quality: 3 };
Inventory.slots[1 + COLS] = { itemId: "__test_1x1", qty: 1, quality: 3 };
Inventory.emitChanged();
const stan = zajete();
ok("⛔ zamiana z DWOMA przedmiotami pod celem ODRZUCONA (brak częściowego stanu)",
   Inventory.moveSlot(0, 1) === false && zajete() === stan &&
   Inventory.anchorCovering(0) === 0 && Inventory.slots[1]?.itemId === "__test_1x1");

/* ══ §F. Usuwanie ══════════════════════════════════════════════════════ */
console.log("\n§F. Usuwanie:");
czysto();
Inventory.addItem("__test_1x2", 1);
ok("`takeAt` z KOTWICY zdejmuje przedmiot i zwalnia OBA pola",
   Inventory.takeAt(0)?.itemId === "__test_1x2" && zajete() === 0 && sztuk("__test_1x2") === 0);
czysto();
Inventory.addItem("__test_1x2", 1);
ok("⭐ `takeAt` z DRUGIEJ POŁOWY działa tak samo (gracz widzi tam przedmiot)",
   Inventory.takeAt(COLS)?.itemId === "__test_1x2" && zajete() === 0 && sztuk("__test_1x2") === 0);
czysto();
Inventory.addItem("__test_1x2", 1);
Inventory.removeItem("__test_1x2", 1);
ok("`removeItem` też nie zostawia ducha", zajete() === 0 && sztuk("__test_1x2") === 0);

/* ══ §G. Pojemność i torby ═════════════════════════════════════════════ */
console.log("\n§G. Pojemność (torby są slotem Equipment, nie elementem siatki):");
czysto();
Inventory.setCapacity(20);
Inventory.slots[12] = { itemId: "__test_1x2", qty: 1, quality: 3 };   // 12 + 16
Inventory.emitChanged();
ok("1×2 w wierszu 3 przy pojemności 20 jest legalne", Inventory.anchorCovering(16) === 12);
ok("⛔⛔ zdjęcie torby (20 → 16) ODRZUCONE — uciałoby przedmiot w pół",
   Inventory.canSetCapacity(16) === false);
ok("⭐ …i to jest RÓŻNICA od stanu sprzed gabarytu: pole 16 jest w `slots` PUSTE",
   Inventory.slots[16] === null);
Inventory.slots[12] = null;
Inventory.emitChanged();
ok("po zdjęciu przedmiotu zmniejszenie pojemności przechodzi", Inventory.canSetCapacity(16) === true);
czysto();
Inventory.setCapacity(18);   // 4×4 + niepełny wiersz (2 pola)
ok("⚠ niepełny ostatni wiersz: 1×2 z kotwicą 12 mieści się (12 → 16 istnieje)",
   Inventory.cellsFor(12, { w: 1, h: 2 }) !== null);
ok("⛔ …ale z kotwicą 14 już nie (18 poza pojemnością)",
   Inventory.cellsFor(14, { w: 1, h: 2 }) === null);
czysto();

/* ══ §H. Determinizm i zapis ═══════════════════════════════════════════ */
console.log("\n§H. Determinizm (§8) i zapis:");
czysto();
Inventory.slots[5] = { itemId: "__test_1x2", qty: 1, quality: 3 };
Inventory.emitChanged();
const migawka = JSON.parse(JSON.stringify(Inventory.slots));
const przykrycie = Array.from({ length: Inventory.capacity }, (_, c) => Inventory.anchorCovering(c));
ok("⭐ zapis niesie JEDEN wpis, nie dwa",
   migawka.filter((x) => x && x.itemId === "__test_1x2").length === 1);
ok("⛔ …a drugie pole jest w zapisie PUSTE (gabaryt się WYPROWADZA, nie zapisuje)",
   migawka[5 + COLS] === null);
// odtworzenie „z zapisu" — dokładnie tak, jak robi to `Save.load()`
Inventory.reset();
Inventory.slots = migawka.map((x) => (x ? { ...x } : null));
while (Inventory.slots.length < 16) Inventory.slots.push(null);
Inventory.emitChanged();
const poWczytaniu = Array.from({ length: Inventory.capacity }, (_, c) => Inventory.anchorCovering(c));
ok("⭐⭐ po wczytaniu przykrycie jest IDENTYCZNE — bit w bit",
   JSON.stringify(przykrycie) === JSON.stringify(poWczytaniu));
ok("⭐⭐ …i nie zależy od NICZEGO z UI: `cols` to stała configu, nie szerokość okna",
   Inventory.cols === INVENTORY.cols && INVENTORY.cols === 4);

/* ══ §I. Regresja 1×1 ══════════════════════════════════════════════════ */
console.log("\n§I. Regresja — przedmioty `1×1` (sztylet; miecz jest od 2026-10-01 na 1×2):");
czysto();
ok("stakowanie bez zmian", Inventory.addItem("bread", 5) === 0 && Inventory.slots[0]?.qty === 5);
ok("dokładanie do stosu bez zmian", Inventory.addItem("bread", 3) === 0 && Inventory.slots[0]?.qty === 8);
czysto();
Inventory.addItem("bread", 1);
Inventory.addItem("dagger", 1);
ok("zamiana dwóch `1×1` bez zmian", Inventory.moveSlot(0, 1) === true &&
   Inventory.slots[0]?.itemId === "dagger" && Inventory.slots[1]?.itemId === "bread");
czysto();
Inventory.addItem("dagger", 1);
ok("przeniesienie `1×1` na puste pole bez zmian",
   Inventory.moveSlot(0, 7) === true && Inventory.slots[7]?.itemId === "dagger" && Inventory.slots[0] === null);
czysto();
for (let i = 0; i < 16; i++) Inventory.addItem("dagger", 1);
ok("zapełnienie plecaka `1×1` daje 16 sztuk i zero wolnych",
   sztuk("dagger") === 16 && Inventory.freeSlotCount === 0);
ok("⛔ …i siedemnasty się nie mieści", Inventory.hasRoomFor("dagger", 1) === false);
czysto();

/* ══ §J. Gabaryt ⊥ Equipment ═══════════════════════════════════════════ */
console.log("\n§J. ⛔ Gabaryt jest OSOBNĄ osią (§3 zlecenia):");
Progression.strength = 20;
// ⚠ Do 2026-10-01: „bastard … gabaryt 1×1". Pytanie zostaje (trzy osie są
// niezależne), przykład się zmienił: dziś to MIECZ JEDNORĘCZNY leży na 1×2.
ok("miecz: hands 1 · gabaryt 1×2, sztylet: hands 1 · gabaryt 1×1 — gabaryt to ROZMIAR, nie liczba rąk",
   (ITEMS.sword.hands ?? 1) === 1 && itemFootprint("sword").h === 2 &&
   (ITEMS.dagger.hands ?? 1) === 1 && itemFootprint("dagger").h === 1);
// ⚠ Do 2026-09-30: „żadna broń dwuręczna go nie ma", potem „wśród dwuręcznych
// są oba kształty". Ta druga zgasłaby fałszywie w dniu, w którym ostatni topór
// dwuręczny dostanie ikonę 32×64 — a to jest dokładnie reguła autora. Niezależność
// od `hands` dowodzi się po stronie JEDNORĘCZNEJ: tam leżą oba kształty na stałe.
const jednoreczne = bronie.filter((i) => (i.hands ?? 1) === 1);
ok("⛔ `hands` NIE implikuje gabarytu — wśród JEDNORĘCZNYCH są oba kształty",
   jednoreczne.some((i) => itemFootprint(i.id).h === 1) && jednoreczne.some((i) => itemFootprint(i.id).h === 2),
   `${jednoreczne.filter((i) => itemFootprint(i.id).h === 2).length} z ${jednoreczne.length} jest 1×2`);
// ⚠ Ta asercja mówiła „tarcze też nie [deklarują gabarytu]" i była prawdziwa do
// 2026-09-19. Dziś pyta o to samo MOCNIEJ: slot `offhand` nie implikuje NICZEGO,
// bo w tym samym slocie leżą obie wartości gabarytu.
const offhand = Object.values(ITEMS).filter((i) => i.slot === "offhand");
ok("⛔ slot `offhand` NIE implikuje gabarytu — w jednym slocie leżą oba kształty",
   offhand.some((i) => itemFootprint(i.id).h === 1) && offhand.some((i) => itemFootprint(i.id).h === 2),
   `${offhand.filter((i) => itemFootprint(i.id).h === 2).length} z ${offhand.length} jest 1×2`);
ok("⛔ …a o gabarycie decyduje KONSTRUKCJA, nie materiał: żelazna i stalowa pawęż też go ma",
   offhand.filter((i) => i.construction === "pavise").every((i) => itemFootprint(i.id).h === 2),
   `pawęży: ${offhand.filter((i) => i.construction === "pavise").length}`);
czysto();
Equipment.reset();

/* ══ §K. Zamiana w lalce NIE NISZCZY przedmiotu ══════════════════════════ */
// ⚠⚠ Błąd znaleziony 2026-10-01: `equipFromBag` zakładał wymianę jeden na jeden
// i ignorował wynik `addInstance`. Sztylet zakładany za miecz `1×2` przy pełnym
// plecaku zwracał `true`, a MIECZ ZNIKAŁ (tak samo pawęż za puklerz) — błąd
// istniał od pierwszych tarcz 1×2 (2026-09-19). Naprawa: `Inventory.canFitAll`
// + `Equipment.returningFor`; tu każdy przypadek liczy egzemplarze przed i po.
console.log("\n§K. Zamiana w lalce nie niszczy przedmiotu (OI-124):");
Progression.strength = 30;
const RECE = ["weapon", "offhand", "weapon2", "offhand2"];
const ile = (id) => Inventory.slots.filter((s) => s?.itemId === id).length
  + RECE.filter((k) => Equipment[k]?.itemId === id).length;
const zapchaj = () => { for (let i = 0; i < 60 && Inventory.freeSlotCount > 0; i++) Inventory.addItem("knife", 1); };
/** Pełny plecak z `n` wolnymi parami JEDNO NAD DRUGIM. */
const paryPion = (n) => {
  zapchaj();
  for (let a = 0, z = 0; a + COLS < Inventory.capacity && z < n; a += 2) {
    if (Inventory.slots[a]?.itemId === "knife" && Inventory.slots[a + COLS]?.itemId === "knife") {
      Inventory.takeAt(a); Inventory.takeAt(a + COLS); z++;
    }
  }
};
const zamiana = (opis, zaloz, wPlecaku, bierz, przygotuj, oczek) => {
  czysto(); Equipment.reset();
  for (const id of zaloz) { Inventory.addItem(id, 1); Equipment.equip(id); }
  Inventory.addItem(bierz, 1);
  przygotuj();
  const ids = [...zaloz, bierz];
  const przed = ids.map(ile);
  const idx = Inventory.slots.findIndex((s) => s?.itemId === bierz);
  const odm = Equipment.handsRefusalFor(bierz, Equipment.slotForItem(bierz), idx);
  const wynik = Equipment.equipFromBag(idx);
  const zgub = ids.filter((_, i) => ids.map(ile)[i] < przed[i]);
  ok(`${opis} → ${oczek ? "zakłada" : "odmawia"}, nic nie ginie`,
     wynik === oczek && zgub.length === 0 && (oczek ? odm === null : odm?.kind === "noRoom"),
     `${wynik}${zgub.length ? " ⛔ ZGUBIONO " + zgub.join(",") : ""}${odm ? " | " + describeHandsRefusal(odm) : ""}`);
};
zamiana("⭐⭐ sztylet za MIECZ 1×2, plecak pełny", ["sword"], [], "dagger", zapchaj, false);
zamiana("⭐⭐ puklerz za PAWĘŻ 1×2, plecak pełny", ["wood_pavise"], [], "buckler", zapchaj, false);
zamiana("sztylet za miecz, jedna pionowa para wolna", ["sword"], [], "dagger", () => paryPion(1), true);
zamiana("szabla za miecz (1×2 ↔ 1×2), plecak pełny — pola wymienne", ["sword"], [], "sabre", zapchaj, true);
zamiana("nóż za sztylet (1×1 ↔ 1×1), plecak pełny", ["dagger"], [], "knife", zapchaj, true);
zamiana("włócznia 2H za miecz + pawęż, plecak pełny", ["sword", "wood_pavise"], [], "spear", zapchaj, false);
zamiana("włócznia 2H za miecz + pawęż, dwie pionowe pary", ["sword", "wood_pavise"], [], "spear", () => paryPion(2), true);
czysto();
Equipment.reset();

console.log(`\n${bledow === 0 ? "OK — wszystkie przejścia zielone." : `⛔ ${bledow} BŁĘDÓW`}`);
process.exit(bledow === 0 ? 0 : 1);

/**
 * Przymiar układu EKWIPUNKU — strona PLECAK panelu postaci
 * (`src/ui/EquipLayout.ts` + `src/ui/PaperDoll.ts` + `PlayerPanel`).
 *
 * ⚠ **Uruchamia PRAWDZIWE moduły, nie kopię wzoru** — także rozmiar panelu
 * (`FrameLayout.serviceArea` + `playerPanelSize`). Ta sama reguła i ten sam
 * powód, co w `tools/hud_uklad.mjs`: drugi rachunek tej samej geometrii
 * rozjeżdża się z grą po cichu, a diff tego nie pokazuje.
 *
 * ⚠⚠ **PRZEPISANY w etapie D (2026-10-13) razem z układem.** Do tej daty
 * sprawdzał kratę 3×4 (`EQUIP_CELLS`) z pasem broni pod spodem i czytał
 * wysokość paska zakładek z TEKSTU `PlayerPanel.ts`. Dziś: sylwetka
 * (`DOLL_CELLS`) z przełącznikami warstw (E1) i zestawów (E2), panel w ramie
 * obok szyny nawigacji, stała kolumna karty, torby pod siatką.
 *
 * ⚠ **Co ten plik POTRAFI:** obalić układ arytmetycznie — nakładki, wyjście
 * poza kolumnę i stronę, kafel poniżej progu dotyku, slot bez kafla, kartę
 * węższą od minimum. **Czego NIE potrafi:** powiedzieć, czy to wygląda
 * dobrze — do tego jest render 1:1 (`tools/phone_render.mjs`).
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/ekwipunek_uklad.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-eq.ts");
const wejscie = join(KORZEN, "node_modules", ".equip-layout-entry.ts");
const tmp = join(KORZEN, "node_modules", ".equip-layout.mjs");

/** Krótsza oś, przy której skala UI wynosi 1 (`UI_SCALE.designShortAxis`). */
const DESIGN_SHORT = 580;

const EKRANY = [
  { nazwa: "S21 FE poziomo", cssW: 891, cssH: 411, telefon: true },
  { nazwa: "telefon 16:9 poziomo", cssW: 740, cssH: 360, telefon: true },
  { nazwa: "mały telefon 640×300", cssW: 640, cssH: 300, telefon: true },
  { nazwa: "laptop 1366×768", cssW: 1366, cssH: 768, telefon: false },
  { nazwa: "monitor 1920×1080", cssW: 1920, cssH: 1080, telefon: false },
];

await writeFile(
  stubPhaser,
  // ⚠ `EventEmitter` jest NIEZBĘDNY: `Equipment` ciągnie `EventBus`, a ten
  //   tworzy emiter w chwili importu (ta sama pułapka, co w `sklep_uklad`).
  `class E { on() { return this; } once() { return this; } off() { return this; } emit() { return false; } removeAllListeners() { return this; } }
   const Phaser = {
     Math: { Clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) },
     Events: { EventEmitter: E },
     Input: { Events: {} },
     Scenes: { Events: {} },
   };
   export default Phaser;\n`,
);
await writeFile(
  wejscie,
  `export * from "../src/ui/EquipLayout";
   export { DOLL_CELLS, DOLL_COLS, handSlot } from "../src/ui/PaperDoll";
   export { serviceArea, playerPanelSize } from "../src/ui/FrameLayout";
   export { EQUIP_SLOTS, STOW_SLOTS, layeredSlot } from "../src/core/Equipment";
   export { ARMOR_LAYERS } from "../src/core/ArmorLayers";
   export { HUD_LAYOUT, INVENTORY } from "../src/config/GameConfig";\n`,
);
await build({
  entryPoints: [wejscie],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
  plugins: [{ name: "stuby", setup(b) { b.onResolve({ filter: /^phaser$/ }, () => ({ path: stubPhaser })); } }],
});
const L = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});
await unlink(wejscie).catch(() => {});
await unlink(stubPhaser).catch(() => {});

const MIN_TOUCH = L.HUD_LAYOUT.minTouch;
const bledy = [];
const ostrzezenia = [];

/** Prostokąt kafla lalki (środek + bok + wysokość) → krawędzie. */
const kraw = (k) => ({ x0: k.x - k.size / 2, x1: k.x + k.size / 2, y0: k.y - k.height / 2, y1: k.y + k.height / 2 });
const nachodza = (a, b) => a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;
const prost = (r) => ({ x0: r.x, x1: r.x + r.w, y0: r.y, y1: r.y + r.h });

/** Wszystkie asercje jednej ramki — ta sama funkcja dla kontroli §0. */
function sprawdzUklad(nazwa, panelW, pageH, telefon) {
  const out = [];
  const inv = L.computeInventoryLayout(panelW, pageH);
  if (inv.overflow) out.push(`${nazwa}: układ nie mieści się — ${inv.overflow}`);

  // ── próg dotyku ────────────────────────────────────────────────────────
  if (inv.dollCell < MIN_TOUCH) out.push(`${nazwa}: kafel lalki ${inv.dollCell} j. < ${MIN_TOUCH}`);
  if (inv.cell < MIN_TOUCH) out.push(`${nazwa}: kafel plecaka ${inv.cell} j. < ${MIN_TOUCH}`);
  if (inv.bag.bagRow.h < MIN_TOUCH) out.push(`${nazwa}: kafel torby ${inv.bag.bagRow.h} j. < ${MIN_TOUCH}`);

  // ── lalka: nakładki i granice kolumny ──────────────────────────────────
  const d = inv.doll;
  const kafle = d.cells.map((k) => ({ k, e: kraw(k) }));
  for (let i = 0; i < kafle.length; i++) {
    for (let j = i + 1; j < kafle.length; j++) {
      if (nachodza(kafle[i].e, kafle[j].e)) out.push(`${nazwa}: kafle „${kafle[i].k.cell.label}" i „${kafle[j].k.cell.label}" nachodzą na siebie`);
    }
    for (const [n, r] of [["przełącznik warstw", d.layerToggle], ["przełącznik zestawów", d.setToggle], ["liczby", d.numbers]]) {
      if (nachodza(kafle[i].e, prost(r))) out.push(`${nazwa}: kafel „${kafle[i].k.cell.label}" wchodzi na ${n}`);
    }
    const e = kafle[i].e;
    if (e.x0 < d.left - 0.5 || e.x1 > d.left + d.width + 0.5) out.push(`${nazwa}: kafel „${kafle[i].k.cell.label}" poza kolumną lalki`);
  }
  if (d.layerToggle.y < inv.top - 0.5) out.push(`${nazwa}: przełącznik warstw wychodzi górą`);
  if (d.numbers.y + d.numbers.h > inv.bottom + 0.5) out.push(`${nazwa}: liczby pod lalką wychodzą dołem`);
  // ⭐ E2: przełącznik zestawów stoi NAD rękami — pod nim zaczynają się ręce.
  const rece = d.cells.filter((k) => k.cell.hand);
  for (const r of rece) {
    if (kraw(r).y0 < d.setToggle.y + d.setToggle.h - 0.5) out.push(`${nazwa}: ręka „${r.cell.label}" nie stoi pod przełącznikiem zestawów`);
  }

  // ── kolumny względem siebie i panelu ───────────────────────────────────
  const lewa = -panelW / 2;
  const prawa = panelW / 2;
  const b = inv.bag;
  if (d.left < lewa) out.push(`${nazwa}: lalka wychodzi lewą krawędzią`);
  if (d.left + d.width > b.gridLeft - 0.5) out.push(`${nazwa}: lalka wchodzi na plecak`);
  if (b.gridLeft + b.gridW > inv.card.left - 0.5) out.push(`${nazwa}: plecak wchodzi na kartę`);
  if (inv.card.left + inv.card.width > prawa - 8) out.push(`${nazwa}: karta sięga ${Math.round(inv.card.left + inv.card.width)} przy krawędzi ${prawa}`);
  if (inv.card.width < 300) out.push(`${nazwa}: kolumna karty ${Math.round(inv.card.width)} j. < 300`);
  // ⭐ Torby pod siatką: pod oknem siatki, w jej szerokości, nad dołem strony.
  if (b.bagRow.y < b.gridTop + b.gridH - 0.5) out.push(`${nazwa}: torby wchodzą na siatkę`);
  const torbyW = 4 * b.bagRow.h + 3 * inv.gap;
  if (torbyW > b.gridW + 0.5) out.push(`${nazwa}: rząd toreb (${torbyW} j.) szerszy niż siatka (${b.gridW} j.)`);
  if (b.bagRow.y + b.bagRow.h > inv.bottom + 0.5) out.push(`${nazwa}: torby wychodzą dołem`);

  if (inv.cols !== L.INVENTORY.cols) out.push(`${nazwa}: kolumny plecaka ${inv.cols} ≠ INVENTORY.cols ${L.INVENTORY.cols}`);
  if (telefon && inv.rows * inv.cols < 16) {
    ostrzezenia.push(`${nazwa}: widać ${inv.rows * inv.cols} kafli plecaka przy bazowej pojemności 16 (reszta pod przewijaniem)`);
  }
  return { inv, bledy: out };
}

/* ══ §0: KONTROLA — zepsute dane MUSZĄ dać błąd ═════════════════════════ */
{
  const k = sprawdzUklad("kontrola 816×400", 816, 400, false);
  if (k.bledy.length === 0) bledy.push("§0: strona 816×400 przeszła bez błędu — przymiar jest ślepy");
  else console.log(`kontrola §0: strona 816×400 daje ${k.bledy.length} błąd(ów) — przymiar widzi przepełnienie ✓`);
}

/* ══ §R: KAŻDA RAMKA ════════════════════════════════════════════════════ */
for (const e of EKRANY) {
  const fit = Math.max(0.5, Math.min(1, Math.min(e.cssW, e.cssH) / DESIGN_SHORT));
  const uiW = e.cssW / fit;
  const uiH = e.cssH / fit;
  const area = L.serviceArea(uiW, uiH);
  const { w: panelW, h: panelH } = L.playerPanelSize(area.w, area.h);
  const pageH = panelH; // od etapu D bez paska zakładek u góry
  const { inv, bledy: b } = sprawdzUklad(e.nazwa, panelW, pageH, e.telefon);
  bledy.push(...b);
  console.log(`\n── ${e.nazwa} ─────────────────────────────────────────`);
  console.log(`wirtualnie ${uiW.toFixed(0)}×${uiH.toFixed(0)} j. → obszar obok szyny ${Math.round(area.w)} j. → panel ${panelW}×${panelH}`);
  console.log(
    `lalka ${Math.round(inv.doll.width)} j. (kafel ${inv.dollCell}) | plecak ${inv.cols}×${inv.rows} (kafel ${inv.cell})` +
      ` | karta ${Math.round(inv.card.width)} j. | torby ${inv.bag.bagRow.h} j.`,
  );
}

/* ══ §S: SYLWETKA — każdy adres osiągalny, kafel ma jeden adres ═════════ */
const adresy = new Set();
for (const c of L.DOLL_CELLS) {
  if (c.kind !== "gear") continue;
  const ile = [c.slot, c.area, c.hand].filter(Boolean).length;
  if (ile !== 1) bledy.push(`Kafel „${c.label}" ma ${ile} adresy (slot/obszar/ręka) — dokładnie jeden`);
  if (c.slot) adresy.add(c.slot);
  if (c.area) for (const w of L.ARMOR_LAYERS) adresy.add(L.layeredSlot(c.area, w));
  if (c.hand) adresy.add(L.handSlot(c.hand, 1)).add(L.handSlot(c.hand, 2));
}
for (const slot of [...L.EQUIP_SLOTS, ...L.STOW_SLOTS]) {
  if (!adresy.has(slot)) bledy.push(`Adres „${slot}" nie ma kafla w DOLL_CELLS — sprzęt nieosiągalny`);
}
for (const area of L.LAYERED_SLOTS) {
  if (!L.DOLL_CELLS.some((c) => c.area === area)) bledy.push(`Obszar warstwowy „${area}" nie ma kafla`);
}
// Żadna kolumna sylwetki nie niesie więcej niż połowy kafli (autor: „unikaj
// sytuacji, w której większość slotów stoi jeden pod drugim w jednej kolumnie").
for (let col = 0; col < L.DOLL_COLS; col++) {
  const n = L.DOLL_CELLS.filter((c) => c.col === col).length;
  if (n > L.DOLL_CELLS.length / 2) bledy.push(`Kolumna ${col} sylwetki niesie ${n} z ${L.DOLL_CELLS.length} kafli`);
}
for (const c of L.DOLL_CELLS.filter((x) => x.kind === "planned")) {
  console.log(`  planowany: ${c.label} — ${c.pending}`);
  if (c.slot && L.slotHasItems(c.slot)) bledy.push(`Kafel „${c.label}" jest planowany, ale przedmioty na ten slot już istnieją`);
}
console.log(`\nsylwetka: ${L.DOLL_CELLS.length} kafli na ${adresy.size} adresów`);

/* ── Wynik ──────────────────────────────────────────────────────────────── */
console.log("");
for (const o of ostrzezenia) console.log(`UWAGA: ${o}`);
if (bledy.length === 0) console.log("OK — układ ekwipunku przeszedł wszystkie asercje.");
else for (const b of bledy) console.log(`BŁĄD: ${b}`);
process.exit(bledy.length === 0 ? 0 : 1);

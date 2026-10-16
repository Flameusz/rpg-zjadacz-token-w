/**
 * Przymiar kategorii filtra (`OI-130`, 2026-10-11) — `src/ui/ItemCategory.ts`
 * na PRAWDZIWYM `ITEMS`, bez uruchamiania gry.
 *
 * Po co: zakładki półki i plecaka pokazują tylko kategorie OBECNE, a rzecz,
 * która spadnie do „Surowce" przez nieznany slot (pierwszy pas, nowy typ),
 * po prostu zniknie z zakładki, w której gracz jej szuka — bez błędu.
 *
 *   C1  każda rzecz zakładana (broń, pancerz, biżuteria) ma zakładkę inną niż „Surowce"
 *   C2  zakładka pancerza = jego slot (tarcza → „Tarcze", nie „Tors")
 *   C3  `categoriesPresent` zaczyna od „Wszystko" i nie daje pustej zakładki
 *   C4  każda kategoria z `CATEGORIES` ma czym się narysować (glif albo ikonę)
 *
 * Użycie:
 *   node tools/filtr_przymiar.mjs            # raport
 *   node tools/filtr_przymiar.mjs --sabotaz  # dokłada pancerz na nieznany slot — C1 ma zaświecić
 */
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

process.stdout.reconfigure?.({ encoding: "utf-8" });
const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const SABOTAZ = process.argv.includes("--sabotaz");

const tmp = join(KORZEN, "node_modules", ".filtr-przymiar.mjs");
await build({
  stdin: {
    contents:
      'export * from "./src/ui/ItemCategory.ts";\n' +
      'export { ITEMS } from "./src/config/GameConfig.ts";\n',
    resolveDir: KORZEN,
    loader: "ts",
  },
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const { ITEMS, CATEGORIES, categoryOf, categoriesPresent } = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

if (SABOTAZ) {
  // Pierwszy pas wchodzący do gry bez zakładki — dokładnie ten przypadek.
  ITEMS.__sabotaz_pas = { id: "__sabotaz_pas", name: "Pas (sabotaż)", type: "armor", slot: "belt" };
}

const bledy = [];
const ZAKLADANE = new Set(["weapon", "armor", "ring", "amulet"]);
const SLOT_NA_ZAKLADKE = { offhand: "shield", head: "head", chest: "chest", shoulders: "shoulders", gloves: "gloves", legs: "legs", boots: "boots" };

let zakladanych = 0;
for (const it of Object.values(ITEMS)) {
  const cat = categoryOf(it.id);
  if (ZAKLADANE.has(it.type)) {
    zakladanych++;
    if (cat === "material") bledy.push(`C1 ${it.id} („${it.name}", ${it.type}/${it.slot ?? "-"}) ląduje w „Surowce"`);
  }
  if (it.type === "armor" && SLOT_NA_ZAKLADKE[it.slot] && cat !== SLOT_NA_ZAKLADKE[it.slot]) {
    bledy.push(`C2 ${it.id}: slot ${it.slot}, a zakładka ${cat}`);
  }
}

const probka = ["sword", "iron_helmet", "health_potion"].filter((id) => ITEMS[id]);
const obecne = categoriesPresent(probka).map((c) => c.id);
if (obecne[0] !== "all") bledy.push(`C3 pierwsza zakładka to ${obecne[0]}, nie „all"`);
for (const c of obecne) {
  if (c !== "all" && !probka.some((id) => categoryOf(id) === c)) bledy.push(`C3 pusta zakładka ${c}`);
}
for (const c of CATEGORIES) {
  if (c.id !== "all" && c.glyph === undefined && !c.iconItem) bledy.push(`C4 zakładka ${c.id} nie ma glifu ani ikony`);
  if (c.iconItem && !ITEMS[c.iconItem]) bledy.push(`C4 zakładka ${c.id}: ikona z nieistniejącego przedmiotu ${c.iconItem}`);
}

const rozklad = {};
for (const it of Object.values(ITEMS)) rozklad[categoryOf(it.id)] = (rozklad[categoryOf(it.id)] ?? 0) + 1;
console.log(`przedmiotów: ${Object.keys(ITEMS).length} · zakładanych: ${zakladanych}`);
console.log("rozkład: " + CATEGORIES.filter((c) => c.id !== "all").map((c) => `${c.label} ${rozklad[c.id] ?? 0}`).join(" · "));
for (const b of bledy) console.log(`BŁĄD: ${b}`);
if (!bledy.length) console.log("OK — każda rzecz zakładana ma swoją zakładkę.");
process.exit(bledy.length ? 1 : 0);

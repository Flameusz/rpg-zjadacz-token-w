/**
 * Kompletność gatunku zbieractwa (OI-63 z `docs/systemy/gathering.md` §6/§8).
 *
 * Sprawdza dla KAŻDEGO gatunku z `HERBS`, czy ma komplet czterech rzeczy:
 *   1. definicję gatunku       — `HERBS[id]` (zawsze prawda, bo iterujemy po jego kluczach)
 *   2. wpis przedmiotu         — `ITEMS[id]` (bez tego zbieranie kończy się błędem —
 *                                 `GameScene.gatherFrom` rzutuje `plant.herb as ItemId`,
 *                                 więc `tsc` tego NIE złapie)
 *   3. duszek świata           — `ASSETS.herb<Pascal>` WSKAZUJE na plik, który
 *                                 NAPRAWDĘ istnieje na dysku (samo istnienie klucza
 *                                 w configu nie wystarcza — plik mógł nigdy nie trafić
 *                                 do repo)
 *   4. wpis w `HERB_OBJECT_NAMES` (TiledMap.ts) — bez tego obiekt na mapie o tej
 *      nazwie jest po prostu IGNOROWANY (ostrzeżenie w konsoli silnika, nie błąd)
 *
 * Dodatkowo liczy realne stanowiska na KAŻDEJ mapie `.tmj` w
 * `public/assets/maps/`, czytając prawdziwe pliki (nie duplikuje ich treści).
 *
 * `HERBS`/`ITEMS`/`ASSETS` są importowane PRAWDZIWE, przez esbuild → node —
 * ta sama konwencja co `tools/movement_weryfikacja.mjs` i
 * `katalog_ekwipunku.mjs` (`tools/CLAUDE.md`: „czytają prawdziwe wartości,
 * nie parsują tekstu"). `HERB_OBJECT_NAMES` w `TiledMap.ts` NIE jest
 * eksportowany i ten plik ciągnie ciężki graf modułów (Assets.ts, NavGrid,
 * TreeLayer) — zamiast bundlować to wszystko, jego obiektowy literał jest
 * WYCIĘTY z pliku i naprawdę WYKONANY (`new Function`), nie zgadywany
 * po tekście. To wciąż jest PRAWDZIWA wartość — z jednego pliku, nie z dwóch
 * niezależnych opisów, które mogłyby się rozjechać.
 *
 *   node tools/gathering_kompletnosc.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek gatunek nie ma kompletu.
 */

import { build } from "esbuild";
import { readFile, unlink, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub-gather.ts");
const tmpConfig = join(KORZEN, "node_modules", ".gather-config.mjs");

await writeFile(stubPhaser, "const Phaser = {};\nexport default Phaser;\n");
await build({
  entryPoints: [join(KORZEN, "src/config/GameConfig.ts")],
  outfile: tmpConfig,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
  alias: { phaser: stubPhaser },
});
const { HERBS, ITEMS, ASSETS } = await import(pathToFileURL(tmpConfig).href);
await unlink(stubPhaser);
await unlink(tmpConfig);

/** `lebiodka` → `herbLebiodka` — jedyna reguła nazewnicza, jaką ma ten klucz
 *  (patrz `ASSETS.herbBabka` i spółka w `GameConfig.ts`). */
function assetKeyFor(id) {
  return "herb" + id[0].toUpperCase() + id.slice(1);
}

/**
 * Wytnij i NAPRAWDĘ WYKONAJ literał `HERB_OBJECT_NAMES` z `TiledMap.ts` —
 * patrz nagłówek pliku po uzasadnienie, dlaczego nie bundlujemy całego modułu.
 */
async function readHerbObjectNames() {
  const src = await readFile(join(KORZEN, "src/world/TiledMap.ts"), "utf8");
  const start = src.indexOf("const HERB_OBJECT_NAMES");
  if (start === -1) throw new Error("HERB_OBJECT_NAMES zniknęło z TiledMap.ts");
  const braceOpen = src.indexOf("{", start);
  const braceClose = src.indexOf("};", braceOpen);
  if (braceOpen === -1 || braceClose === -1) throw new Error("nie znaleziono granic literału HERB_OBJECT_NAMES");
  const body = src.slice(braceOpen, braceClose + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return ${body};`)();
}

async function readMapHerbCounts() {
  const mapsDir = join(KORZEN, "public/assets/maps");
  const files = (await readdir(mapsDir)).filter((f) => f.endsWith(".tmj"));
  /** mapFile → { herbId → count } */
  const perMap = {};
  for (const file of files) {
    const data = JSON.parse(await readFile(join(mapsDir, file), "utf8"));
    const counts = {};
    for (const layer of data.layers ?? []) {
      if (layer.type !== "objectgroup") continue;
      for (const obj of layer.objects ?? []) {
        const name = (obj.name ?? "").trim().toLowerCase();
        const herb = herbObjectNames[name];
        if (herb) counts[herb] = (counts[herb] ?? 0) + 1;
      }
    }
    perMap[file] = counts;
  }
  return perMap;
}

const herbObjectNames = await readHerbObjectNames();
const perMapCounts = await readMapHerbCounts();
const mapFiles = Object.keys(perMapCounts).sort();

const herbIds = Object.keys(HERBS);
let niekompletne = 0;

console.log(`Gatunki w HERBS: ${herbIds.length}`);
console.log(`Mapy sprawdzone: ${mapFiles.join(", ")}`);
console.log("");
console.log("gatunek        | item | asset-klucz | plik-na-dysku | w HERB_OBJECT_NAMES | stanowiska (suma) | komplet");
console.log("-".repeat(110));

for (const id of herbIds) {
  const hasItem = Object.prototype.hasOwnProperty.call(ITEMS, id);
  const assetKey = assetKeyFor(id);
  const assetEntry = ASSETS[assetKey];
  const hasAssetKey = !!assetEntry;
  const fileOnDisk = hasAssetKey ? existsSync(join(KORZEN, "public", assetEntry.path)) : false;
  const inObjectNames = Object.values(herbObjectNames).includes(id);
  const totalNodes = mapFiles.reduce((sum, f) => sum + (perMapCounts[f][id] ?? 0), 0);

  const komplet = hasItem && hasAssetKey && fileOnDisk && inObjectNames && totalNodes > 0;
  if (!komplet) niekompletne++;

  const znak = (b) => (b ? "OK" : "BRAK");
  console.log(
    `${id.padEnd(15)} | ${znak(hasItem).padEnd(4)} | ${znak(hasAssetKey).padEnd(11)} | ${znak(fileOnDisk).padEnd(13)} | ${znak(inObjectNames).padEnd(20)} | ${String(totalNodes).padEnd(18)} | ${komplet ? "TAK" : "NIE"}`,
  );
}

console.log("");
console.log("Stanowiska per mapa:");
for (const f of mapFiles) {
  const entries = Object.entries(perMapCounts[f]).filter(([, n]) => n > 0);
  if (entries.length === 0) {
    console.log(`  ${f}: (brak stanowisk ziół — legalny stan)`);
    continue;
  }
  console.log(`  ${f}: ${entries.map(([h, n]) => `${h}=${n}`).join(", ")}`);
}

// Odwrotny kierunek: każdy gatunek z HERB_OBJECT_NAMES musi istnieć w HERBS —
// inaczej NodeSpawner dostałby `herb` bez `HERBS[herb].respawnSec` i wyleciałby
// przy starcie mapy z tym gatunkiem.
console.log("");
let osierocone = 0;
for (const herb of new Set(Object.values(herbObjectNames))) {
  if (!herbIds.includes(herb)) {
    osierocone++;
    console.log(`BŁĄD: HERB_OBJECT_NAMES wskazuje na "${herb}", którego nie ma w HERBS`);
  }
}
if (osierocone === 0) console.log("Odwrotny kierunek OK: każdy wpis HERB_OBJECT_NAMES ma definicję w HERBS.");

console.log("");
if (niekompletne > 0 || osierocone > 0) {
  console.log(`WYNIK: ${niekompletne} gatunek(-ów) niekompletny(-ch), ${osierocone} osierocony(-ch) wpis(-ów) w HERB_OBJECT_NAMES.`);
  process.exit(1);
} else {
  console.log(`WYNIK: wszystkie ${herbIds.length} gatunków ma komplet czterech rzeczy. Zero osieroconych wpisów.`);
  process.exit(0);
}

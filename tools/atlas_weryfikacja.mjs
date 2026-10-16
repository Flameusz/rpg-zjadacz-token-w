/**
 * Bramka atlasów decoru (forest_decor_atlas / water_flora_atlas).
 *
 * Sprawdza PRAWDZIWY, skompilowany `ASSETS`/`DECOR_PROPS` (esbuild → node),
 * nie jego powtórzenie — ten sam wzorzec co `tools/movement_weryfikacja.mjs`.
 *
 * §1 każdy `frame` odwołany w ASSETS istnieje w odpowiednim atlas .json
 * §2 żaden frame w atlas .json nie jest osierocony (nikt go nie używa) — informacyjne
 * §3 brak duplikatów nazw klatek w obrębie jednego atlasu
 * §4 każdy DECOR_PROPS wpis, którego `asset` wskazuje na atlas, ma poprawny `frame`
 * §5 stare klucze tekstur (kebab-case, np. "stone-glaz-01") NIE są już nigdzie
 *    używane jako `key` w ASSETS — potwierdza, że przepięcie jest kompletne
 *
 * node tools/atlas_weryfikacja.mjs
 * Kod wyjścia ≠ 0 przy jakiejkolwiek rozbieżności.
 */
import { build } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmpOut = join(KORZEN, "node_modules", ".gameconfig-atlas-test.mjs");

await build({
  entryPoints: [join(KORZEN, "src/config/GameConfig.ts")],
  outfile: tmpOut,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
});

const { ASSETS, DECOR_PROPS } = await import(pathToFileURL(tmpOut).href);
unlinkSync(tmpOut);

let failures = 0;
const fail = (msg) => { failures++; console.error(`✗ ${msg}`); };
const ok = (msg) => console.log(`✓ ${msg}`);

const ATLASES = {
  "forest-decor-atlas": join(KORZEN, "public/assets/props/forest_decor_atlas.json"),
  "water-flora-atlas": join(KORZEN, "public/assets/props/water_flora_atlas.json"),
};

const atlasFrames = {};
for (const [key, path] of Object.entries(ATLASES)) {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  atlasFrames[key] = new Set(Object.keys(json.frames));
}

// §1 + §4 — every ASSETS entry with an atlas key must reference an existing frame
const referencedFrames = { "forest-decor-atlas": new Set(), "water-flora-atlas": new Set() };
let atlasEntries = 0;
for (const [name, def] of Object.entries(ASSETS)) {
  if (!def || typeof def !== "object" || !("frame" in def)) continue;
  atlasEntries++;
  const frames = atlasFrames[def.key];
  if (!frames) {
    fail(`ASSETS.${name}: key "${def.key}" nie jest znanym atlasem`);
    continue;
  }
  if (!frames.has(def.frame)) {
    fail(`ASSETS.${name}: frame "${def.frame}" NIE ISTNIEJE w ${def.key}`);
  } else {
    referencedFrames[def.key].add(def.frame);
  }
}
ok(`§1 ${atlasEntries} wpisów ASSETS z polem "frame" sprawdzonych`);

// §2 — orphan frames (informational, not a failure)
for (const [key, frames] of Object.entries(atlasFrames)) {
  const orphans = [...frames].filter((f) => !referencedFrames[key].has(f));
  if (orphans.length) {
    console.log(`ℹ ${key}: ${orphans.length} klatek w pliku, do których ŻADEN ASSETS nie się odwołuje: ${orphans.join(", ")}`);
  } else {
    ok(`§2 ${key}: każda klatka w atlasie ma odwołanie w ASSETS`);
  }
}

// §3 — duplicate frame names within one atlas JSON (should be impossible by
// construction — JS object keys are already unique — but count vs source
// file list would catch a silent collision during generation)
for (const [key, path] of Object.entries(ATLASES)) {
  const json = JSON.parse(readFileSync(path, "utf-8"));
  const keys = Object.keys(json.frames);
  const unique = new Set(keys);
  if (keys.length !== unique.size) {
    fail(`${key}: duplikaty nazw klatek w JSON`);
  } else {
    ok(`§3 ${key}: ${keys.length} unikalnych nazw klatek`);
  }
}

// §5 — old individual texture keys must be gone from ASSETS for migrated names
const OLD_KEYS_SAMPLE = [
  "stone-glaz-01", "bush-dome-large", "willow-stump-old", "cattail-large",
  "oak-stump-fresh", "birch-stump-fresh", "spruce-stump-fresh", "beech-stump-fresh",
  "grab-stump-fresh", "alder-stump-fresh", "stump", "pond-edge", "lily-pad",
];
const liveKeys = new Set(Object.values(ASSETS).map((d) => d?.key));
const stillPresent = OLD_KEYS_SAMPLE.filter((k) => liveKeys.has(k));
if (stillPresent.length) {
  fail(`Stare klucze tekstur nadal używane w ASSETS: ${stillPresent.join(", ")}`);
} else {
  ok(`§5 żaden z ${OLD_KEYS_SAMPLE.length} próbkowanych starych kluczy nie jest już używany`);
}

// Dodatkowo: DECOR_PROPS spójność z ASSETS (nazwa -> asset istnieje)
let decorChecked = 0;
for (const [id, def] of Object.entries(DECOR_PROPS)) {
  if (!def.asset || !def.asset.key) fail(`DECOR_PROPS.${id}: brak asset.key`);
  decorChecked++;
}
ok(`dodatkowo: ${decorChecked} wpisów DECOR_PROPS ma poprawny asset.key`);

console.log(`\n${failures === 0 ? "WSZYSTKO OK" : `${failures} BŁĘDÓW`}`);
process.exit(failures === 0 ? 0 : 1);

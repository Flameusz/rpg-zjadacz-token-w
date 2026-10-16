/**
 * Przymiar KOMPLETNOŚCI materiału (`OI-79`, 2026-10-11) — czy każdy plik,
 * na który wskazuje konfig, leży na dysku.
 *
 * ⚠ **Nie zmienia zachowania gry.** Brakujący PNG dalej daje placeholder,
 * brakujący dźwięk ciszę — „gra ZAWSZE się uruchamia" zostaje cechą. Ten
 * plik jest odpowiednikiem `dev.missing()` / `dev.failed()`, który działa BEZ
 * uruchamiania gry: po przeprowadzce plików albo zmianie nazwy assetu.
 *
 * ⭐ **Bez listy pól.** Przechodzi rekurencyjnie po WSZYSTKICH eksportach
 * `GameConfig.ts` (przez esbuild — prawdziwe wartości) i sprawdza każdy napis,
 * który wygląda na ścieżkę assetu (`assets/…` z rozszerzeniem pliku). Nowe
 * pole `fooPath` jest więc sprawdzane bez uczenia tego pliku czegokolwiek.
 * ⚠ Nie widzi ścieżek składanych w kodzie z szablonu (np. ikona po id) —
 * te łapie dopiero `dev.missing()` w silniku.
 *
 * Kod wyjścia ≠ 0, gdy któregoś pliku brakuje.
 *
 *   node tools/assety_przymiar.mjs
 */

import { build } from "esbuild";
import { existsSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(KORZEN, "public");
const tmp = join(KORZEN, "node_modules", ".assety-przymiar.mjs");

await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

const SCIEZKA = /^assets\/[^\s"']+\.(png|webp|jpg|glb|gltf|json|tmj|world|mp3|ogg|wav|m4a)$/i;
const znalezione = new Map(); // ścieżka → pierwsze miejsce w konfigu
const odwiedzone = new WeakSet();

function przejdz(v, adres) {
  if (typeof v === "string") {
    if (SCIEZKA.test(v) && !znalezione.has(v)) znalezione.set(v, adres);
    return;
  }
  if (!v || typeof v !== "object" || odwiedzone.has(v)) return;
  odwiedzone.add(v);
  if (Array.isArray(v)) v.forEach((x, i) => przejdz(x, `${adres}[${i}]`));
  else for (const [k, x] of Object.entries(v)) przejdz(x, `${adres}.${k}`);
}
for (const [nazwa, v] of Object.entries(C)) przejdz(v, nazwa);
// Dźwięki: ścieżkę składa `Sfx.queue` z klucza `AUDIO.volume` — jedyny
// szablon, który ten plik powtarza (`assets/audio/<klucz>.wav`). ⚠ Zmieniając
// szablon w `src/core/Sfx.ts`, zmień go tutaj.
for (const k of Object.keys(C.AUDIO?.volume ?? {})) {
  const p = `assets/audio/${k}.wav`;
  if (!znalezione.has(p)) znalezione.set(p, `AUDIO.volume.${k} (Sfx.queue)`);
}

const brak = [...znalezione].filter(([p]) => !existsSync(join(PUBLIC, p)));
const wg = {};
for (const p of znalezione.keys()) {
  const e = p.split(".").pop().toLowerCase();
  wg[e] = (wg[e] ?? 0) + 1;
}
console.log(`ścieżek w konfigu: ${znalezione.size} (${Object.entries(wg).map(([e, n]) => `${e} ${n}`).join(", ")})`);
if (brak.length) {
  console.error(`\n${brak.length} BRAKUJĄCYCH PLIKÓW:`);
  for (const [p, adres] of brak) console.error(`  BŁĄD: public/${p}  ←  ${adres}`);
  process.exit(1);
}
console.log("OK — każdy wskazany plik istnieje.");

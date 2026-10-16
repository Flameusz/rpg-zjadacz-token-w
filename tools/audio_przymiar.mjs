// Przymiar rosteru dźwięku (`OI-55`, 2026-10-09).
//
// Lista dźwięków ma TRZY kopie: tabelę głośności (`AUDIO.volume` w
// GameConfig.ts — z niej gra wyprowadza, co ładuje), generator
// (`SOUNDS` w tools/gen_audio.py) i pliki w public/assets/audio/.
// Pierwsze dwie wiązał dotąd tylko człowiek, trzeciej nie wiązało nic —
// a brakujący plik jest w grze CICHY (jedno ostrzeżenie w konsoli, potem
// pomijanie), więc unik i parowanie potrafiły nie brzmieć przez tygodnie.
//
// Użycie: node tools/audio_przymiar.mjs   (tylko czyta; kod wyjścia 1 = BŁĄD)

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Klucze `AUDIO.volume` — blok tekstu od `export const AUDIO` do `volume: {…}`. */
export function volumeKeys(src) {
  const at = src.indexOf("export const AUDIO");
  if (at < 0) throw new Error("nie znaleziono `export const AUDIO`");
  const open = src.indexOf("volume: {", at);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const body = src.slice(open + "volume: {".length, end).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  return [...body.matchAll(/^\s*"?([a-z][a-z0-9-]*)"?\s*:/gm)].map((m) => m[1]);
}

/** Klucze słownika `SOUNDS` w gen_audio.py. */
export function generatorKeys(src) {
  const at = src.indexOf("SOUNDS = {");
  if (at < 0) throw new Error("nie znaleziono `SOUNDS = {` w gen_audio.py");
  const body = src.slice(at, src.indexOf("}", at));
  return [...body.matchAll(/^\s*"([a-z][a-z0-9-]*)"\s*:/gm)].map((m) => m[1]);
}

/** Rozjazdy między trzema listami — pusta tablica = zgodne. */
export function compare(volume, generator, files) {
  const errors = [];
  const sets = { "tabela głośności": volume, generator, "pliki na dysku": files };
  const all = new Set([...volume, ...generator, ...files]);
  for (const key of [...all].sort()) {
    const missing = Object.entries(sets)
      .filter(([, list]) => !list.includes(key))
      .map(([name]) => name);
    if (missing.length) errors.push(`${key}: brak w — ${missing.join(", ")}`);
  }
  for (const [name, list] of Object.entries(sets)) {
    const dup = list.filter((k, i) => list.indexOf(k) !== i);
    if (dup.length) errors.push(`${name}: zdublowane klucze ${dup.join(", ")}`);
  }
  return errors;
}

const volume = volumeKeys(readFileSync(join(ROOT, "src/config/GameConfig.ts"), "utf8"));
const generator = generatorKeys(readFileSync(join(ROOT, "tools/gen_audio.py"), "utf8"));
const files = readdirSync(join(ROOT, "public/assets/audio"))
  .filter((f) => f.endsWith(".wav"))
  .map((f) => f.slice(0, -4));

let fail = false;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "OK  " : "BŁĄD"} ${label}${detail ? "   " + detail : ""}`);
  if (!ok) fail = true;
};

console.log(`Roster dźwięku: tabela ${volume.length} · generator ${generator.length} · pliki ${files.length}`);
check(volume.length > 0 && generator.length > 0, "A0. obie listy dały się odczytać (parser nie zwrócił pustki)");
const errors = compare(volume, generator, files);
check(errors.length === 0, "A1. trzy kopie rosteru są zgodne", errors.join(" | "));

// ⚠ Sabotaż: asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.
const sab1 = compare(volume, generator, files.filter((f) => f !== "parry"));
check(sab1.some((e) => e.startsWith("parry:")), "S1. sabotaż: usunięty plik `parry` jest zgłaszany");
const sab2 = compare([...volume, "nowy-dzwiek"], generator, files);
check(sab2.some((e) => e.startsWith("nowy-dzwiek:")), "S2. sabotaż: klucz bez pliku i bez generatora jest zgłaszany");

console.log(fail ? "\nBŁĄD — roster dźwięku się rozjechał." : "\nOK — tabela, generator i pliki zgodne.");
process.exit(fail ? 1 : 0);

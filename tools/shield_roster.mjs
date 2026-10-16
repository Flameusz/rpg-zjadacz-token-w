/**
 * Roster tarcz z PRAWDZIWEGO modułu — wypisuje JSON na stdout, nic nie zapisuje.
 *
 *     npx esbuild tools/shield_roster.mjs --bundle --format=esm --platform=node \
 *         --outfile=<tmp>/roster.mjs && node <tmp>/roster.mjs
 *
 * ⚠⚠ **ISTNIEJE, BO PARSOWANIE TEKSTU TU NIE DZIAŁA I RAZ JUŻ SKŁAMAŁO.**
 * Poprzednia wersja bramki (`char3d_shields.sprawdz_komplet_rosteru`) tnęła
 * `GameConfig.ts` od `export const ITEMS` i szukała literału `block: {`.
 * Obie te rzeczy są fałszywe od czasu przebudowy katalogu tarcz:
 *   • `SHIELD_ITEMS` stoi PRZED `export const ITEMS` i wchodzi tam dopiero
 *     przez `...SHIELD_ITEMS`, więc cięcie od `ITEMS` nie widziało go wcale;
 *   • `block` przychodzi ze spreadu `...statTarczy(...)`, więc literału
 *     `block: {` na pozycji NIE MA.
 * Skutek zmierzony 2026-09-21: bramka drukowała „tarcz w GameConfig: 2,
 * modeli tutaj: 2" i kończyła się zielono, podczas gdy w grze stało 30 tarcz,
 * a 28 z nich renderowało PUSTĄ LEWĄ DŁOŃ.
 * ⛔ Nie wracaj do regexa po tekście — to jest dokładnie ta „asercja, która
 * nie potrafi zaświecić na czerwono" z `tools/CLAUDE.md`.
 *
 * ⚠ Rozpoznajemy tarczę po tym samym, po czym rozpoznaje ją gra
 * (`Character3D.zsynchronizujTarcze`): `slot: "offhand"` + obecność `block`.
 * Nie po liście id i nie po nazwie — ręczna lista jest tym, co zawiodło
 * przy broni (`stick`).
 */
import { ITEMS } from "../src/config/GameConfig.ts";

const tarcze = Object.entries(ITEMS).filter(
  ([, v]) => v.slot === "offhand" && v.block !== undefined,
);

/** konstrukcja -> lista id. `null` łapie tarczę bez `construction` — to błąd
 *  danych, a nie konstrukcja o takiej nazwie, więc ma się wyróżniać. */
const konstrukcje = {};
for (const [id, v] of tarcze) {
  const k = v.construction ?? null;
  (konstrukcje[k] ??= []).push(id);
}

/** Wariant 3D z IKONY: `icon-shield-<gatunek>-<konstrukcja>` → `<konstrukcja>_<gatunek>`.
 *  ⚠ Ta sama reguła stoi w `Character3D.wariantTarczy` — model ma pokazywać
 *  to, co ikona (np. „Tarcza okuta" nie ma pola `material`, a ikonę żelaza). */
const warianty = {};
for (const [id, v] of tarcze) {
  const m = /^icon-shield-(iron|steel)-(\w+)$/.exec(v.iconTexture ?? "");
  if (!m) continue;
  const k = `${v.construction}_${m[1]}`;
  (warianty[k] ??= []).push(id);
}

console.log(JSON.stringify({ liczba: tarcze.length, konstrukcje, warianty }));

/**
 * Roster broni z PRAWDZIWEGO modułu — wypisuje JSON na stdout, nic nie zapisuje.
 * Bliźniak `tools/shield_roster.mjs`.
 *
 *     npx esbuild tools/weapon_roster.mjs --bundle --format=esm --platform=node \
 *         --outfile=<tmp>/roster.mjs && node <tmp>/roster.mjs
 *
 * ⚠⚠ Czyta `ITEMS` przez esbuild → node, a NIE regexem po tekście
 * `GameConfig.ts` — tamto raz już skłamało przy tarczach (spread
 * `...SHIELD_ITEMS` i `...statTarczy(...)`: bramka widziała 2 tarcze z 30).
 * Broń, która kiedyś przyjdzie ze spreadu albo z funkcji, zniknęłaby z
 * regexa po cichu, a postać trzymałaby powietrze.
 *
 * Rozpoznajemy broń tak samo jak gra: `type: "weapon"`.
 */
import { ITEMS } from "../src/config/GameConfig.ts";

const bronie = {};
for (const [id, v] of Object.entries(ITEMS)) {
  if (v.type !== "weapon") continue;
  bronie[id] = {
    family: v.family ?? null,
    hands: v.hands ?? 1,
    grip: v.grip ?? null,
    material: v.material ?? "steel",
    // typy obrażeń wariantów ataku — bramka mierzy zamach tylko u broni,
    // która go naprawdę gra (drzewcowa kłuta gra wyłącznie pchnięcie)
    attacks: (v.attacks ?? []).map((a) => a.damageType),
  };
}

console.log(JSON.stringify(bronie));

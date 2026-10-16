/**
 * Roster PANCERZA z prawdziwego modułu — JSON na stdout, nic nie zapisuje.
 * Bliźniak `tools/weapon_roster.mjs` / `tools/shield_roster.mjs`.
 *
 *     npx esbuild tools/armor_roster.mjs --bundle --format=esm --platform=node \
 *         --outfile=<tmp>/roster.mjs && node <tmp>/roster.mjs
 *
 * ⚠ Czyta `ITEMS` przez esbuild → node, nie regexem — patrz `shield_roster.mjs`
 * (tekst skłamał tam raz: 2 tarcze z 30). Warstwa idzie z `itemLayer`, czyli
 * z tej samej funkcji, której używa gra (adres `chest_L2` itd.).
 */
import { ITEMS } from "../src/config/GameConfig.ts";
import { itemLayer } from "../src/core/ArmorLayers.ts";

const pancerz = {};
for (const [id, v] of Object.entries(ITEMS)) {
  if (v.type !== "armor" || v.slot === "offhand") continue;
  pancerz[id] = {
    slot: v.slot,
    armorType: v.armorType ?? null,
    material: v.material ?? "steel",
    layer: itemLayer(id),
    iconTexture: v.iconTexture ?? null,
  };
}

console.log(JSON.stringify(pancerz));

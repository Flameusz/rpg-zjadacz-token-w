/**
 * **Przymiar WARSTWOWANIA pancerza — model C (adres = slot + warstwa).**
 *
 * ⚠⚠ **Sprawdza `src/`, nie własne dane.** Cała arytmetyka i cały loader zapisu
 * to ten sam kod, który wykonuje gra; podmieniane są wyłącznie `phaser`
 * (DOM), `EventBus` i `localStorage`.
 *
 * ⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
 * Grupy niżej sprawdzają dokładnie te własności, które przy warstwowaniu mogą
 * paść cicho: zły adres, zgubiony przedmiot przy wczytaniu, warstwa wybrana
 * zamiast wyprowadzonej, tarcza wpuszczona do mapy warstw.
 *
 *   node tools/warstwy_przymiar.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek zamek padnie.
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (...c) => join(KORZEN, ...c);

let bledow = 0;
const ok = (g, opis, warunek, detal = "") => {
  if (warunek) console.log(`  OK   ${g}. ${opis}${detal ? "   " + detal : ""}`);
  else {
    bledow++;
    console.log(`  BŁĄD ${g}. ${opis}${detal ? "   " + detal : ""}`);
  }
};

/* ── Wpięcie prawdziwych modułów ────────────────────────────────────────── */
const stubPhaser = P("node_modules", ".w-phaser.ts");
const stubBus = P("node_modules", ".w-bus.ts");
await writeFile(stubPhaser, "export default {};\n");
await writeFile(
  stubBus,
  "export const GameEvents = { emit() {}, on() {}, off() {} };\n" +
    "export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n",
);
// ⚠ `Save` pisze do `localStorage`. Atrapa w pamięci — to jedyne, czego Node
//   nie ma, a co ten test MUSI wykonać prawdziwym kodem.
const pamiec = new Map();
globalThis.localStorage = {
  getItem: (k) => (pamiec.has(k) ? pamiec.get(k) : null),
  setItem: (k, v) => pamiec.set(k, String(v)),
  removeItem: (k) => pamiec.delete(k),
};

/* ⚠⚠ **JEDNO wejście, jeden graf modułów — i to jest naprawa błędu tego pliku.**
   Pierwsza wersja bundlowała `Save.ts` i `Equipment.ts` jako OSOBNE wejścia,
   więc każdy bundle dostał WŁASNĄ kopię `Equipment`: `Save.load()` mutował
   jedną, a asercje czytały drugą i wszystko wychodziło puste. To jest dokładnie
   pułapka, którą `src/core/CLAUDE.md` opisuje przy `window.dev` kontra
   `import()` w konsoli — singleton przestaje być singletonem. */
const wejscie = P("node_modules", ".w-entry.ts");
await writeFile(
  wejscie,
  [
    'export * from "../src/core/Equipment";',
    'export * from "../src/core/ArmorLayers";',
    'export * from "../src/core/Quality";',
    'export { Save } from "../src/core/Save";',
    'export { Inventory } from "../src/core/Inventory";',
    'export { Progression } from "../src/core/Progression";',
    'export { ITEMS } from "../src/config/GameConfig";',
  ].join("\n") + "\n",
);
const tmp = { all: P("node_modules", ".w-all.mjs") };
await build({
  format: "esm", bundle: true, logLevel: "silent", platform: "node",
  entryPoints: [wejscie], outfile: tmp.all,
  alias: { phaser: stubPhaser },
  plugins: [{ name: "bus", setup: (b) => b.onResolve({ filter: /\.\/EventBus$/ }, () => ({ path: stubBus })) }],
});
const M = await import(pathToFileURL(tmp.all).href);
const EQ = M, AL = M, QUAL = M, SV = M, CFG = { ITEMS: M.ITEMS };
const INV = { Inventory: M.Inventory };
// ⚠ Siła pod wymagania kirysa — inaczej `canEquipInstance` odmówi i test
//   sprawdzałby bramkę atrybutów zamiast konfliktu warstwy.
M.Progression.strength = 20;

const { Equipment, EQUIP_SLOTS, LAYERED_AREAS, layeredSlot } = EQ;
const { makeInstance } = QUAL;
const A = (area, l) => layeredSlot(area, l);

console.log("=== PRZYMIAR WARSTWOWANIA (model C) ===\n");

/* ══════════════════════════════════════════════════════════════════════════
   §A — ADRESOWANIE: warstwa WYPROWADZANA, nie wybierana
   ══════════════════════════════════════════════════════════════════════════ */
console.log("§A. Adresowanie:");
ok("A1", "`EQUIP_SLOTS` ma 19 adresów (7 niewarstwowych + 4 obszary × 3)",
   EQUIP_SLOTS.length === 19, EQUIP_SLOTS.length + "");
for (const [id, oczek] of [
  ["gambeson", "chest_L1"], ["mail_hauberk", "chest_L2"], ["steel_chest", "chest_L3"],
  ["leather_chest", "chest_L2"], ["cuirass", "chest_L3"],
]) ok("A2", `\`${id}\` → \`${oczek}\``, Equipment.slotForItem(id) === oczek, String(Equipment.slotForItem(id)));

// ⛔ Tarcza i ręce NIGDY nie dostają adresu warstwowego.
ok("A3", "⛔ tarcza adresuje `offhand`, nie warstwę", Equipment.slotForItem("buckler") === "offhand");
ok("A3", "⛔ rękawice adresują `gloves`, bez sufiksu", Equipment.slotForItem("leather_gloves") === "gloves");
ok("A3", "⛔ broń adresuje `weapon`", Equipment.slotForItem("sword") === "weapon");
ok("A3", "⛔ `LAYERED_AREAS` nie zawiera `offhand`, `gloves` ani `weapon`",
   !["offhand", "gloves", "weapon"].some((x) => LAYERED_AREAS.includes(x)), LAYERED_AREAS.join(","));

// `accepts` musi pilnować WARSTWY, nie tylko obszaru.
ok("A4", "✅ kirys przyjmowany na `chest_L3`", Equipment.accepts("chest_L3", "cuirass"));
ok("A4", "⛔ kirys ODRZUCONY na `chest_L1` (zła warstwa)", !Equipment.accepts("chest_L1", "cuirass"));
ok("A4", "⛔ przeszywanica ODRZUCONA na `chest_L3`", !Equipment.accepts("chest_L3", "gambeson"));
ok("A4", "⛔ tarcza ODRZUCONA na `chest_L2`", !Equipment.accepts("chest_L2", "buckler"));

/* ══════════════════════════════════════════════════════════════════════════
   §B — GETTER: najbardziej zewnętrzna istniejąca warstwa
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§B. Getter `Equipment.chest` = L3 → L2 → L1 → null:");
const ustaw = (mapa) => {
  Equipment.reset();
  for (const [adres, id] of Object.entries(mapa)) Equipment[adres] = id ? makeInstance(id, 1, 3) : null;
};
ustaw({});
ok("B1", "pusty obszar → null", Equipment.chest === null);
ustaw({ chest_L1: "gambeson" });
ok("B1", "tylko L1 → gambeson", Equipment.chest?.itemId === "gambeson");
ustaw({ chest_L2: "mail_hauberk" });
ok("B1", "tylko L2 → mail_hauberk", Equipment.chest?.itemId === "mail_hauberk");
ustaw({ chest_L3: "steel_chest" });
ok("B1", "tylko L3 → steel_chest", Equipment.chest?.itemId === "steel_chest");
ustaw({ chest_L1: "gambeson", chest_L3: "steel_chest" });
ok("B1", "⭐ L1+L3 bez L2 → steel_chest (zewnętrzna)", Equipment.chest?.itemId === "steel_chest");
ustaw({ chest_L1: "gambeson", chest_L2: "mail_hauberk", chest_L3: "steel_chest" });
ok("B1", "L1+L2+L3 → steel_chest", Equipment.chest?.itemId === "steel_chest");

// ⛔ Getter musi być TYLKO DO ODCZYTU — zapis ma iść przez adres.
ok("B2", "⛔ `Equipment.chest = …` nie ma settera (zapis tylko przez adres)",
   Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Equipment), "chest")?.set === undefined);

/* ══════════════════════════════════════════════════════════════════════════
   §C — AGREGACJA: pętle widzą wszystkie warstwy
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§C. Agregacja przez `EQUIP_SLOTS`:");
ustaw({ chest_L1: "gambeson", chest_L2: "mail_hauberk", chest_L3: "steel_chest" });
const I = CFG.ITEMS;
const sumaPP = I.gambeson.defense + I.mail_hauberk.defense + I.steel_chest.defense;
const sumaKg = I.gambeson.weight + I.mail_hauberk.weight + I.steel_chest.weight;
ok("C1", "`totalDefense` sumuje TRZY warstwy", Math.round(Equipment.totalDefense) === sumaPP,
   `${Math.round(Equipment.totalDefense)} = ${sumaPP}`);
ok("C2", "`equippedWeight` sumuje TRZY warstwy", Math.abs(Equipment.equippedWeight - sumaKg) < 1e-9,
   `${Equipment.equippedWeight} = ${sumaKg}`);
ok("C3", "`wornItemIds` zwraca trzy sztuki", Equipment.wornItemIds.length === 3, Equipment.wornItemIds.join(","));
ok("C4", "migawka obejmuje wszystkie 19 adresów",
   Object.keys(Object.fromEntries(EQUIP_SLOTS.map((s) => [s, Equipment[s]]))).length === 19);
// ⚠ Padnie, gdyby ktoś wyprowadził listę pętli z czegoś innego niż `EQUIP_SLOTS`.
ok("C5", "⛔ `armorPieces` liczy trzy sztuki pancerza", Equipment.defenseAgainst() > 0 &&
   Math.round(Equipment.defenseAgainst()) === sumaPP);

/* ══════════════════════════════════════════════════════════════════════════
   §D — DWIE SZTUKI W TEJ SAMEJ WARSTWIE: druga wypiera pierwszą
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§D. Konflikt warstwy:");
Equipment.reset();
INV.Inventory.reset?.();
INV.Inventory.addItem("steel_chest", 1);
INV.Inventory.addItem("cuirass", 1);
Equipment.equip("steel_chest");
const pierwszy = Equipment.chest_L3?.itemId;
Equipment.equip("cuirass");
ok("D1", "obie sztuki celują w `chest_L3`",
   Equipment.slotForItem("steel_chest") === "chest_L3" && Equipment.slotForItem("cuirass") === "chest_L3");
ok("D1", "druga WYPIERA pierwszą (jedna warstwa = jeden przedmiot)",
   Equipment.chest_L3?.itemId === "cuirass" && pierwszy === "steel_chest");
ok("D1", "wyparta wraca do plecaka — nic nie ginie",
   INV.Inventory.slots.some((s) => s?.itemId === "steel_chest"));

/* ══════════════════════════════════════════════════════════════════════════
   §E — ZAPIS: stary → nowy runtime, nowy → przeładowanie
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§E. Zapis i wczytanie:");
// ⚠ Autozapis TRZYMA ORYGINALNY klucz (`storageKey`) — nie `rpg-save-auto`.
// Pierwsza wersja tego pliku zgadywała i czytała stale dane, przez co jedna
// asercja przechodziła PRZYPADKIEM.
const KLUCZ = "rpg-save";
const bazowy = () => ({
  version: 3,
  progression: { level: 1, xp: 0, totalXp: 0, skillPoints: 0, strength: 9, vitality: 0, conditioning: 0, agility: 0 },
  inventory: { gold: 0, slots: [] },
  equipment: { weapon: null, head: null, chest: null, legs: null, boots: null },
  quests: {},
});

// ⭐ STARY ZAPIS: brak `layers` → przedmiot idzie do SWOJEJ warstwy.
for (const [id, oczek] of [["gambeson", "L1"], ["mail_hauberk", "L2"], ["steel_chest", "L3"]]) {
  const d = bazowy();
  d.equipment.chest = id;
  pamiec.set(KLUCZ, JSON.stringify(d));
  Equipment.reset();
  SV.Save.load("auto");
  const trafil = Equipment[A("chest", oczek)]?.itemId === id;
  const puste = ["L1", "L2", "L3"].filter((l) => l !== oczek).every((l) => Equipment[A("chest", l)] === null);
  ok("E1", `⭐ STARY zapis \`chest: "${id}"\` → \`chest_${oczek}\`, reszta pusta`, trafil && puste,
     `getter: ${Equipment.chest?.itemId}`);
}

// ⭐ NOWY ZAPIS: pełen obieg przez prawdziwy `Save.save()` → `Save.load()`.
const obieg = (mapa, nazwa) => {
  ustaw(mapa);
  const przed = EQUIP_SLOTS.map((s) => Equipment[s]?.itemId ?? null).join("|");
  SV.Save.save("auto");
  Equipment.reset();
  SV.Save.load("auto");
  const po = EQUIP_SLOTS.map((s) => Equipment[s]?.itemId ?? null).join("|");
  ok("E2", `⭐ ${nazwa}: save → load bez utraty`, przed === po, przed === po ? "" : `\n     przed: ${przed}\n     po:    ${po}`);
  const zapis = JSON.parse(pamiec.get(KLUCZ));
  return zapis;
};
obieg({ chest_L1: "gambeson", chest_L2: "mail_hauberk" }, "L1+L2");
obieg({ chest_L1: "gambeson", chest_L3: "steel_chest" }, "L1+L3 bez L2");
const zapis3 = obieg(
  { chest_L1: "gambeson", chest_L2: "mail_hauberk", chest_L3: "steel_chest", head_L3: "steel_helmet" },
  "L1+L2+L3 + hełm",
);

// Kotwica = najbardziej ZEWNĘTRZNA warstwa (decyzja 2026-09-15).
ok("E3", "⭐ kotwica `equipment.chest` = najbardziej zewnętrzna (L3)",
   (zapis3.equipment.chest?.itemId ?? zapis3.equipment.chest) === "steel_chest",
   JSON.stringify(zapis3.equipment.chest?.itemId ?? zapis3.equipment.chest));
ok("E3", "mapa `layers.chest` niesie wszystkie trzy",
   ["L1", "L2", "L3"].every((l) => zapis3.layers?.chest?.[l]));
// ⛔⛔ Tarcza, broń i ręce NIGDY w mapie warstw.
Equipment.reset();
Equipment.offhand = makeInstance("buckler", 1, 3);
Equipment.gloves = makeInstance("leather_gloves", 1, 3);
Equipment.weapon = makeInstance("sword", 1, 3);
SV.Save.save("auto");
const zApis4 = JSON.parse(pamiec.get(KLUCZ));
ok("E4", "⛔ `layers` ma WYŁĄCZNIE cztery obszary — bez `offhand`/`gloves`/`weapon`",
   Object.keys(zApis4.layers ?? {}).sort().join(",") === "boots,chest,head,legs",
   Object.keys(zApis4.layers ?? {}).join(","));
ok("E4", "⛔ tarcza zapisana w `equipment.offhand`, nie w warstwie",
   (zApis4.equipment.offhand?.itemId ?? zApis4.equipment.offhand) === "buckler");
ok("E5", "⛔ `SAVE_VERSION` nadal 3 — zapis sprzed warstw nie jest odrzucany", zApis4.version === 3);

await Promise.all([stubPhaser, stubBus, wejscie, ...Object.values(tmp)].map((f) => unlink(f).catch(() => {})));
console.log(`\n${bledow === 0 ? "OK" : "❌"} — zamków czerwonych: ${bledow}`);
process.exit(bledow === 0 ? 0 : 1);

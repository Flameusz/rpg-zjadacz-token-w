/**
 * **Przymiar ZESTAWÓW — reguła `(set, area)`** (decyzja 2026-09-15,
 * `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md`).
 *
 * ⚠⚠ **Sprawdza `src/`, nie własne dane.** Liczy prawdziwe `setProgressFor`,
 * `setSize` i `Equipment.wornElements`; podmieniane są wyłącznie `phaser`
 * (DOM) i `EventBus`.
 *
 * ⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
 * Reguła `(set, area)` jest na dzisiejszym katalogu ZEROWA — cztery zestawy
 * mają po pięciu członków w pięciu różnych obszarach, więc sam katalog nie
 * odróżnia jej od liczenia sztuk. Dlatego §C ładuje DRUGI, niezależny graf
 * modułów z katalogiem zmienionym w locie: trzy warstwy torsu otagowane jednym
 * zestawem, czyli **zestaw PIONOWY**, którego dziś nie ma, a który `D4`
 * wprost dopuszcza. Bez tego cały ten plik świeciłby na zielono, testując
 * regułę, której nic nie odróżnia od poprzedniej.
 *
 *   node tools/zestawy_przymiar.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek zamek padnie.
 */

import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
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
const stubPhaser = P("node_modules", ".z-phaser.ts");
const stubBus = P("node_modules", ".z-bus.ts");
await writeFile(stubPhaser, "export default {};\n");
await writeFile(
  stubBus,
  "export const GameEvents = { emit() {}, on() {}, off() {} };\n" +
    "export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n",
);

const wejscie = P("node_modules", ".z-entry.ts");
await writeFile(
  wejscie,
  [
    'export * from "../src/core/Equipment";',
    'export * from "../src/core/ItemSets";',
    'export * from "../src/core/ArmorLayers";',
    'export * from "../src/core/Quality";',
    'export { Inventory } from "../src/core/Inventory";',
    'export { Progression } from "../src/core/Progression";',
    'export { ITEMS, ITEM_SETS } from "../src/config/GameConfig";',
  ].join("\n") + "\n",
);
const bundel = P("node_modules", ".z-all.mjs");
await build({
  format: "esm", bundle: true, logLevel: "silent", platform: "node",
  entryPoints: [wejscie], outfile: bundel,
  alias: { phaser: stubPhaser },
  plugins: [{ name: "bus", setup: (b) => b.onResolve({ filter: /\.\/EventBus$/ }, () => ({ path: stubBus })) }],
});

const M = await import(pathToFileURL(bundel).href);
const { Equipment, EQUIP_SLOTS, LAYERED_AREAS, placeOfSlot, setProgressFor, setSize, itemSet } = M;
M.Progression.strength = 20;

console.log("=== PRZYMIAR ZESTAWÓW (reguła set × obszar) ===\n");

/* Pomocnicze: załóż komplet przez PRAWDZIWĄ ścieżkę (plecak → equipFromBag),
   żeby adresy liczyła gra, a nie ten plik. */
const zaloz = (...ids) => {
  Equipment.reset();
  M.Inventory.reset();
  for (const id of ids) {
    M.Inventory.addItem(id, 1);
    if (!Equipment.equip(id)) throw new Error(`nie udało się założyć ${id}`);
  }
};
const postep = (id) => Equipment.setProgress.find((p) => p.id === id);

/* ══════════════════════════════════════════════════════════════════════════
   §A — SŁOWNIK MIEJSC: jeden, wspólny dla obu stron
   ══════════════════════════════════════════════════════════════════════════ */
console.log("§A. Miejsce = adres z warstwą zwiniętą do obszaru:");
for (const [slot, oczek] of [
  ["chest_L1", "chest"], ["chest_L2", "chest"], ["chest_L3", "chest"],
  ["head_L3", "head"], ["boots_L1", "boots"],
  ["gloves", "gloves"], ["offhand", "offhand"], ["weapon", "weapon"],
]) ok("A1", `\`${slot}\` → miejsce \`${oczek}\``, placeOfSlot(slot) === oczek, placeOfSlot(slot));

ok("A2", "⭐ `ring1` i `ring2` to DWA różne miejsca (dwa pierścienie = dwa elementy)",
   placeOfSlot("ring1") !== placeOfSlot("ring2"));

// Słownik musi się domykać: każde miejsce z `EQUIP_SLOTS` jest albo obszarem
// warstwowanym, albo slotem niewarstwowym — nic pomiędzy.
const miejsca = new Set(EQUIP_SLOTS.map(placeOfSlot));
ok("A3", "⛔ żadne miejsce nie niesie sufiksu warstwy",
   ![...miejsca].some((m) => /_L\d$/.test(m)), [...miejsca].join(","));
ok("A4", "19 adresów zwija się do 11 miejsc", miejsca.size === 11, String(miejsca.size));

/* ══════════════════════════════════════════════════════════════════════════
   §B — DZISIEJSZY KATALOG: reguła jest ZEROWA
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§B. Katalog 2026-09-15 — cztery zestawy, pięć obszarów każdy:");
const ZESTAWY = Object.keys(M.ITEM_SETS);
ok("B1", "cztery zestawy w konfiguracji", ZESTAWY.length === 4, ZESTAWY.join(","));

for (const id of ZESTAWY) {
  const czlonkowie = Object.keys(M.ITEMS).filter((i) => itemSet(i) === id);
  const obszary = new Set(czlonkowie.map((i) => M.ITEMS[i].slot));
  ok("B2", `\`${id}\`: ${czlonkowie.length} członków w ${obszary.size} obszarach`,
     czlonkowie.length === obszary.size, [...obszary].join(","));
  ok("B3", `\`${id}\`: mianownik = liczba obszarów`, setSize(id) === obszary.size, String(setSize(id)));
}

/* ══════════════════════════════════════════════════════════════════════════
   §C — TRZY WARSTWY TORSU: trzy RÓŻNE zestawy po jednym elemencie
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§C. Tors w trzech warstwach (przypadki z decyzji):");
zaloz("mail_hauberk");
ok("C1", "jedna warstwa → Splot Pierścieni 1", postep("splot_pierscieni")?.worn === 1);

zaloz("gambeson", "mail_hauberk");
ok("C2", "dwie warstwy → dwa zestawy po 1",
   postep("warstwy_lnu")?.worn === 1 && postep("splot_pierscieni")?.worn === 1);

zaloz("gambeson", "mail_hauberk", "steel_chest");
ok("C3", "trzy warstwy → trzy zestawy po 1",
   postep("warstwy_lnu")?.worn === 1 &&
   postep("splot_pierscieni")?.worn === 1 &&
   postep("kuta_stal")?.worn === 1);
ok("C3", "⛔ żaden zestaw nie przekracza 1 z jednego obszaru",
   Equipment.setProgress.every((p) => p.worn === 1), Equipment.setProgress.map((p) => `${p.id}:${p.worn}`).join(" "));

// ⭐ To jest ta zmiana, którą model C naprawdę wprowadził: trzy zestawy
//   materiałowe da się mieć częściowo czynne JEDNOCZEŚNIE (OI-104). Zamek
//   pilnuje, żeby nikt nie „naprawił" tego po cichu w liczeniu.
zaloz(
  "padded_cap", "gambeson", "padded_chausses", "foot_wraps",
  "mail_coif", "mail_hauberk", "mail_chausses", "mail_boots",
  "steel_helmet", "steel_chest", "steel_legs", "steel_boots",
);
ok("C4", "⭐ pełne L1+L2+L3 → TRZY zestawy po 4 elementy (OI-104, stan opisany, nie naprawiany)",
   ["warstwy_lnu", "splot_pierscieni", "kuta_stal"].every((id) => postep(id)?.worn === 4),
   Equipment.setProgress.map((p) => `${p.id}:${p.worn}`).join(" "));

/* ══════════════════════════════════════════════════════════════════════════
   §D — ZESTAW PIONOWY: drugi graf modułów z podmienionym katalogiem
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§D. ⭐ Zestaw PIONOWY (syntetyczny — dziś nie istnieje w katalogu):");
// ⚠ Osobny import tego samego bundla: `?pionowy` daje NOWY graf modułów, więc
//   `memberCache` w `ItemSets` buduje się już po podmianie tagów. Mutowanie
//   katalogu w grafie §A–§C zatrułoby tamte pomiary.
const M2 = await import(pathToFileURL(bundel).href + "?pionowy");
M2.Progression.strength = 20;
// Trzy warstwy TORSU pod jednym tagiem — dokładnie to, na co pozwala `D4`
// („zestaw może obejmować elementy z różnych warstw").
for (const id of ["gambeson", "mail_hauberk", "steel_chest"]) M2.ITEMS[id].set = "kuta_stal";
const zaloz2 = (...ids) => {
  M2.Equipment.reset();
  M2.Inventory.reset();
  for (const id of ids) {
    M2.Inventory.addItem(id, 1);
    M2.Equipment.equip(id);
  }
};
zaloz2("gambeson", "mail_hauberk", "steel_chest");
const pion = M2.Equipment.setProgress.find((p) => p.id === "kuta_stal");
ok("D1", "⭐ trzy sztuki JEDNEGO zestawu w jednym obszarze → 1 element (nie 3)",
   pion?.worn === 1, `worn=${pion?.worn}`);
ok("D2", "⛔ prog 2 szt. NIE jest czynny z jednego obszaru ciala",
   pion?.tiers.every((t) => !t.active) === true,
   pion?.tiers.map((t) => `${t.count}:${t.active}`).join(" "));
// ⚠ Zestaw ma teraz SIEDMIU członków (pięć stalowych plus przeszywanica
//   i kolczuga dotagowane w torsie), ale trzy z nich dzielą tors — więc zdobyć
//   da się PIĘĆ elementów, nie siedem. Mianownik liczący członków obiecywałby
//   nieosiągalne „4/7".
const czlonkowie2 = Object.keys(M2.ITEMS).filter((i) => M2.itemSet(i) === "kuta_stal").length;
ok("D3", "⭐ mianownik liczy MIEJSCA, nie członków (7 członków → 5 miejsc)",
   czlonkowie2 === 7 && M2.setSize("kuta_stal") === 5,
   `${czlonkowie2} członków / ${M2.setSize("kuta_stal")} miejsc`);
// Kontrola przeciwna: ten sam zestaw rozłożony na RÓŻNE obszary liczy normalnie.
zaloz2("steel_chest", "steel_helmet", "steel_legs");
const rozlozony = M2.Equipment.setProgress.find((p) => p.id === "kuta_stal");
ok("D4", "trzy obszary tego samego zestawu → 3 elementy i czynny prog 2 szt.",
   rozlozony?.worn === 3 && rozlozony?.tiers.find((t) => t.count === 2)?.active === true,
   `worn=${rozlozony?.worn}`);

/* ══════════════════════════════════════════════════════════════════════════
   §E — D4: liczenie zestawu NIE CZYTA warstwy
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§E. ⛔ `set` ⊥ `layer` — zamek strukturalny:");
const zrodloItemSets = await readFile(P("src", "core", "ItemSets.ts"), "utf8");
const kod = zrodloItemSets.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
ok("E1", "⛔ `ItemSets.ts` nie importuje `ArmorLayers`", !/from\s+["']\.\/ArmorLayers["']/.test(kod));
ok("E2", "⛔ `ItemSets.ts` nie woła `itemLayer`", !/itemLayer/.test(kod));
ok("E3", "⛔ w kodzie `ItemSets.ts` nie pada słowo `layer`", !/\blayer\b/i.test(kod), "");

/* ══════════════════════════════════════════════════════════════════════════
   §F — ZAMEK NA DEKLARACJĘ `layer` (ArmorLayers.layerDeclarationProblems)
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§F. Zamek na deklarację `layer`:");
ok("F1", "dzisiejszy katalog: zero problemów",
   M.layerDeclarationProblems(LAYERED_AREAS).length === 0,
   M.layerDeclarationProblems(LAYERED_AREAS).join(" | "));
// Trzy sposoby, na jakie deklaracja bywa cichym kłamstwem — każdy musi zapalić.
const chore = {
  miecz_z_warstwa: { type: "weapon", layer: "L2" },
  rekawice_z_warstwa: { type: "armor", slot: "gloves", layer: "L1" },
  bzdurna_warstwa: { type: "armor", slot: "chest", layer: "L9" },
  zdrowy: { type: "armor", slot: "chest", layer: "L3" },
};
const zgloszone = M.layerDeclarationProblems(LAYERED_AREAS, chore);
ok("F2", "⭐ `layer` na broni → BŁĄD", zgloszone.some((p) => p.startsWith("miecz_z_warstwa")));
ok("F3", "⭐ `layer` na rękawicach (slot bez warstw) → BŁĄD", zgloszone.some((p) => p.startsWith("rekawice_z_warstwa")));
ok("F4", "⭐ `layer` spoza L1/L2/L3 → BŁĄD", zgloszone.some((p) => p.startsWith("bzdurna_warstwa")));
ok("F5", "⛔ poprawna deklaracja (kirys na `chest`) NIE jest zgłaszana",
   !zgloszone.some((p) => p.startsWith("zdrowy")), zgloszone.length + " zgłoszeń");

/* ══════════════════════════════════════════════════════════════════════════
   §G — JEDNO ŹRÓDŁO LICZENIA
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§G. Karta przedmiotu nie ma własnego licznika:");
// ⚠⚠ **Adres się zmienił 2026-09-19, teza nie.** Dymek (`ItemTooltip`) jest
// dziś WYŁĄCZNIE rendererem — co karta mówi, liczy `ItemCard.buildItemCard`,
// z którego rysuje też kolumna szczegółów w sklepie. Zamek pilnuje tego
// samego: **postęp zestawu ma pochodzić z `Equipment`, a nie z drugiego
// rachunku w warstwie widoku**.
// ⚠ Od etapu F (2026-10-13) dymka nie ma — rendererem karty jest wyłącznie
//   kolumna `ShopDetails`; kontrola ujemna celuje w nią.
const tooltip = await readFile(P("src", "ui", "ShopDetails.ts"), "utf8");
const karta = await readFile(P("src", "ui", "ItemCard.ts"), "utf8");
ok("G1", "⛔ karta nie liczy zestawu z `wornItemIds`",
   !/wornItemIds[\s\S]{0,80}itemSet/.test(karta + tooltip));
ok("G2", "✅ model karty czyta `Equipment.setProgress`", /Equipment\.setProgress/.test(karta));
// ⭐ Kontrola NEGATYWNA: renderer nie ma prawa sięgać po to sam — od tego
//   zaczyna się drugi rachunek tej samej rzeczy.
ok("G3", "⛔ renderer karty (`ShopDetails`) nie sięga po `Equipment` na własną rękę",
   !/Equipment\./.test(tooltip));

console.log(`\n${bledow === 0 ? "OK" : "BŁĘDY"} — zamków czerwonych: ${bledow}`);
process.exit(bledow === 0 ? 0 : 1);

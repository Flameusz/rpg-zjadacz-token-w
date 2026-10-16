/**
 * **Przymiar GATUNKU MATERIAŁU — żelazo / stal** (decyzja 2026-09-15,
 * `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`).
 *
 * ⚠⚠ **Sprawdza `src/`, nie własne dane.** Liczy prawdziwe `instanceDefense`,
 * `buyPriceOf`, `sellPriceOf`, `itemMaterial` i prawdziwe `Equipment`;
 * podmieniane są wyłącznie `phaser` (DOM) i `EventBus`.
 *
 * ⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
 * Grupy niżej pilnują dokładnie tych własności, które przy gatunku mogą paść
 * cicho: bliźniak z „poprawionymi" liczbami konstrukcji (§D), gatunek zlany
 * z jakością (§B), cena nietknięta przez gatunek (§C), żelazo wpuszczone do
 * zestawu (§G) i szczyt scope PP przesunięty w górę (§I).
 *
 *   node tools/materialy_przymiar.mjs
 *
 * Kod wyjścia ≠ 0, gdy którykolwiek zamek padnie.
 */

import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
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

const stubPhaser = P("node_modules", ".m-phaser.ts");
const stubBus = P("node_modules", ".m-bus.ts");
await writeFile(stubPhaser, "export default {};\n");
await writeFile(
  stubBus,
  "export const GameEvents = { emit() {}, on() {}, off() {} };\n" +
    "export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n",
);
const wejscie = P("node_modules", ".m-entry.ts");
await writeFile(
  wejscie,
  [
    'export * from "../src/core/ArmorMaterials";',
    'export * from "../src/core/WeaponMaterials";',
    'export * from "../src/core/Quality";',
    'export * from "../src/core/Equipment";',
    'export { Inventory } from "../src/core/Inventory";',
    'export { Progression } from "../src/core/Progression";',
    'export { ITEMS, ARMOR_MATERIAL, WEAPON_MATERIAL, QUALITY, EQUIPMENT } from "../src/config/GameConfig";',
  ].join("\n") + "\n",
);
const bundel = P("node_modules", ".m-all.mjs");
await build({
  format: "esm", bundle: true, logLevel: "silent", platform: "node",
  entryPoints: [wejscie], outfile: bundel,
  alias: { phaser: stubPhaser },
  plugins: [{ name: "bus", setup: (b) => b.onResolve({ filter: /\.\/EventBus$/ }, () => ({ path: stubBus })) }],
});
const M = await import(pathToFileURL(bundel).href);
const {
  ITEMS, ARMOR_MATERIAL, itemMaterial, materialDefenseMul, materialPriceMul,
  materialDeclarationProblems, instanceDefense, buyPriceOf, sellPriceOf, Equipment,
  WEAPON_MATERIAL, weaponMaterial, weaponDamageMul, weaponMaterialProblems, instanceDamage,
} = M;
M.Progression.strength = 20;

const inst = (id, q = 3) => ({ itemId: id, qty: 1, quality: q });
const pp = (id, q = 3) => instanceDefense(inst(id, q));

/** Siedem par bliźniaków: żelazna sztuka ↔ jej stalowy pierwowzór. */
const PARY = [
  ["iron_helmet", "steel_helmet"],
  ["iron_chest", "steel_chest"],
  ["iron_legs", "steel_legs"],
  ["iron_boots", "steel_boots"],
  ["iron_coif", "mail_coif"],
  ["iron_hauberk", "mail_hauberk"],
  ["iron_chausses", "mail_chausses"],
];

console.log("=== PRZYMIAR GATUNKU MATERIAŁU (żelazo / stal) ===\n");

/* ══════════════════════════════════════════════════════════════════════════
   §A — OŚ: gatunek wyprowadzany, profil nietknięty
   ══════════════════════════════════════════════════════════════════════════ */
console.log("§A. Gatunek przedmiotu:");
ok("A1", "dzisiejszy katalog `metal` to STAL (poziom zerowy)",
   itemMaterial("steel_chest") === "steel" && itemMaterial("cuirass") === "steel");
ok("A1", "dzisiejszy katalog `mail` to STAL", itemMaterial("mail_hauberk") === "steel");
ok("A2", "siedem nowych sztuk to ŻELAZO",
   PARY.every(([fe]) => itemMaterial(fe) === "iron"));
ok("A3", "⛔ `padded` i `leather` BEZ gatunku",
   itemMaterial("gambeson") === null && itemMaterial("leather_chest") === null);
ok("A3", "⛔ broń i pierścień bez gatunku",
   itemMaterial("sword") === null && itemMaterial("ring_vigor") === null);
// Profil jest prostopadły: żelazo występuje w DWÓCH różnych profilach naraz.
ok("A4", "⭐ żelazo jest i drutem, i blachą — dowód prostopadłości osi",
   ITEMS.iron_hauberk.armorType === "mail" && ITEMS.iron_chest.armorType === "metal");
ok("A5", "⛔ `ARMOR_PROFILE` nie urósł o wiersz gatunku (`N-7` nietknięte)",
   !("iron" in M.EQUIPMENT) && Object.keys(ARMOR_MATERIAL).length === 2);

/* ══════════════════════════════════════════════════════════════════════════
   §B — PP: gatunek × jakość, dwie NIEZALEŻNE osie
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§B. Punkty ochrony:");
for (const [fe, st] of PARY) {
  const oczek = ITEMS[st].defense * ARMOR_MATERIAL.iron.defenseMul;
  ok("B1", `\`${fe}\` = ${ITEMS[st].defense} × ${ARMOR_MATERIAL.iron.defenseMul}`,
     Math.abs(pp(fe) - oczek) < 1e-9, `${pp(fe).toFixed(1)}`);
}
ok("B2", "⛔ stal NIETKNIĘTA — kirys nadal 28 PP", Math.abs(pp("cuirass") - 28) < 1e-9);

// ⭐⭐ ZAMEK CZYTELNOŚCI — cała drabinka żelaza pod całą drabinką stali.
// To jest warunek, z którego wyprowadzono `defenseMul`: najlepsze żelazo
// w obiegu (Q4) musi być słabsze od najgorszej stali w obiegu (Q1). Bez niego
// gatunek zlewa się z jakością wykonania i przestaje być osobną osią.
for (const [fe, st] of PARY) {
  ok("B3", `⭐ \`${fe}\` Q4 < \`${st}\` Q1`, pp(fe, 4) < pp(st, 1),
     `${pp(fe, 4).toFixed(1)} < ${pp(st, 1).toFixed(1)}`);
}

// PODŁOGA korytarza: dwie relacje, na których stoi kalibracja 0,80.
ok("B4", "⭐ żelazny napierśnik NIE schodzi pod brygantynę (ta sama warstwa, lżejsza)",
   pp("iron_chest") >= ITEMS.brigandine.defense,
   `${pp("iron_chest").toFixed(1)} ≥ ${ITEMS.brigandine.defense}`);
ok("B4", "żelazna szyna nie schodzi pod nogawice kolcze (L2 pod spodem)",
   pp("iron_legs") >= ITEMS.mail_chausses.defense,
   `${pp("iron_legs").toFixed(1)} ≥ ${ITEMS.mail_chausses.defense}`);

/* ══════════════════════════════════════════════════════════════════════════
   §C — CENA: osobna oś, i musi być HOJNIEJSZA niż ubytek punktów
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§C. Cena:");
for (const [fe, st] of PARY) {
  const oczek = Math.max(1, Math.round(ITEMS[st].buyPrice * ARMOR_MATERIAL.iron.priceMul));
  ok("C1", `\`${fe}\` kupno = ${oczek}g`, buyPriceOf(fe, 3) === oczek, String(buyPriceOf(fe, 3)));
}
ok("C2", "sprzedaż też idzie przez gatunek (żelazo nie sprzedaje się jak stal)",
   sellPriceOf("iron_chest", 3) < sellPriceOf("steel_chest", 3),
   `${sellPriceOf("iron_chest", 3)} < ${sellPriceOf("steel_chest", 3)}`);
// ⭐⭐ Warunek, bez którego żelazo jest pułapką, a nie wyborem.
ok("C3", "⭐ `priceMul` < `defenseMul` — żelazo tańsze MOCNIEJ, niż jest słabsze",
   ARMOR_MATERIAL.iron.priceMul < ARMOR_MATERIAL.iron.defenseMul,
   `${ARMOR_MATERIAL.iron.priceMul} < ${ARMOR_MATERIAL.iron.defenseMul}`);
ok("C4", "⛔ stal bez zmiany ceny", buyPriceOf("steel_chest", 3) === ITEMS.steel_chest.buyPrice);
// Gatunek i jakość mnożą się NIEZALEŻNIE — „podłe żelazo" ≠ „dobra stal".
ok("C5", "gatunek × jakość składają się przemiennie",
   buyPriceOf("iron_chest", 1) ===
     Math.max(1, Math.round(ITEMS.steel_chest.buyPrice * ARMOR_MATERIAL.iron.priceMul * M.QUALITY.priceMul[1])),
   String(buyPriceOf("iron_chest", 1)));

/* ══════════════════════════════════════════════════════════════════════════
   §D — BLIŹNIAK: żelazo deklaruje liczby KONSTRUKCJI, nie własne
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§D. Liczby konstrukcji identyczne w obu gatunkach:");
for (const [fe, st] of PARY) {
  const a = ITEMS[fe], b = ITEMS[st];
  ok("D1", `\`${fe}\` = \`${st}\` co do konstrukcji (PP/kg/cena/Siła)`,
     a.defense === b.defense && a.weight === b.weight &&
     a.buyPrice === b.buyPrice && a.sellPrice === b.sellPrice &&
     (a.requires?.strength ?? 0) === (b.requires?.strength ?? 0));
}
ok("D2", "⛔ MASA nietknięta przez gatunek (decyzja autora — brak mechaniki „stal lżejsza\")",
   PARY.every(([fe, st]) => ITEMS[fe].weight === ITEMS[st].weight));
ok("D3", "⛔ `requires` nietknięte przez gatunek",
   PARY.every(([fe, st]) => (ITEMS[fe].requires?.strength ?? 0) === (ITEMS[st].requires?.strength ?? 0)));
ok("D4", "⛔ ten sam obszar i profil co bliźniak",
   PARY.every(([fe, st]) => ITEMS[fe].slot === ITEMS[st].slot && ITEMS[fe].armorType === ITEMS[st].armorType));

/* ══════════════════════════════════════════════════════════════════════════
   §E — WALIDACJA deklaracji
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§E. Zamek na deklarację `material`:");
ok("E1", "dzisiejszy katalog: zero problemów",
   materialDeclarationProblems().length === 0, materialDeclarationProblems().join(" | "));
const chore = {
  // ⚠⚠ **Do 2026-09-17 stał tu `miecz_z_gatunkiem`, a E2 żądało, żeby gatunek
  //   NA BRONI był BŁĘDEM.** Przestał nim być: `WEAPON_MATERIAL` ma od tego dnia
  //   dwóch użytkowników (nóż, cep), a deklaracji broni pilnuje
  //   `weaponMaterialProblems` w §W. ⛔ **Zamek nie został zdjęty, tylko
  //   przepięty** — E2 pyta dziś o typ, który NIE MA żadnej osi gatunku
  //   (mikstura), czyli o jedyny przypadek, który naprawdę został cichym
  //   kłamstwem, oraz osobno sprawdza, że broń jest przepuszczana.
  mikstura_z_gatunkiem: { type: "consumable", material: "iron" },
  bron_z_gatunkiem: { type: "weapon", material: "iron" },
  zelazny_len: { type: "armor", armorType: "padded", material: "iron" },
  zelazna_skora: { type: "armor", armorType: "leather", material: "iron" },
  bzdurny_gatunek: { type: "armor", armorType: "metal", material: "mithril" },
  zdrowy: { type: "armor", armorType: "mail", material: "iron" },
};
const zgl = materialDeclarationProblems(chore);
ok("E2", "⭐ gatunek na MIKSTURZE (typ bez żadnej osi) → BŁĄD",
   zgl.some((p) => p.startsWith("mikstura_z_gatunkiem")));
ok("E2", "⛔ …a gatunek na BRONI zamek pancerza PRZEPUSZCZA (pilnuje go §W)",
   !zgl.some((p) => p.startsWith("bron_z_gatunkiem")));
ok("E3", "⭐ żelazna przeszywanica (profil bez drabinki) → BŁĄD", zgl.some((p) => p.startsWith("zelazny_len")));
ok("E3", "⭐ żelazna skóra (profil bez drabinki) → BŁĄD", zgl.some((p) => p.startsWith("zelazna_skora")));
ok("E4", "⭐ gatunek spoza `ARMOR_MATERIAL` → BŁĄD", zgl.some((p) => p.startsWith("bzdurny_gatunek")));
ok("E5", "⛔ poprawna deklaracja NIE jest zgłaszana",
   !zgl.some((p) => p.startsWith("zdrowy")), `${zgl.length} zgłoszeń`);

/* ══════════════════════════════════════════════════════════════════════════
   §F — INTEGRACJA: adres, warstwa, agregaty
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§F. Wpięcie w ekwipunek:");
ok("F1", "żelazna blacha adresuje L3, żelazny drut L2",
   Equipment.slotForItem("iron_chest") === "chest_L3" &&
   Equipment.slotForItem("iron_hauberk") === "chest_L2");
Equipment.reset();
M.Inventory.reset();
for (const id of ["iron_hauberk", "iron_chest"]) {
  M.Inventory.addItem(id, 1);
  Equipment.equip(id);
}
const suma = pp("iron_hauberk") + pp("iron_chest");
ok("F2", "`totalDefense` liczy PUNKTY PO GATUNKU, nie nominał konstrukcji",
   Math.abs(Equipment.totalDefense - suma) < 1e-9,
   `${Equipment.totalDefense.toFixed(1)} = ${suma.toFixed(1)}`);
ok("F3", "⭐ żelazny stos jest SŁABSZY od stalowego przy tej samej masie",
   suma < ITEMS.mail_hauberk.defense + ITEMS.steel_chest.defense &&
   ITEMS.iron_hauberk.weight + ITEMS.iron_chest.weight ===
     ITEMS.mail_hauberk.weight + ITEMS.steel_chest.weight);

/* ══════════════════════════════════════════════════════════════════════════
   §G — ZESTAWY i SCOPE: czego gatunek NIE rusza
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§G. Granice:");
ok("G1", "⛔ żadna żelazna sztuka nie ma tagu `set` (żelazny komplet to `OI-104`)",
   PARY.every(([fe]) => !("set" in ITEMS[fe])));
ok("G2", "⛔ scope PP nietknięty — kirys zostaje szczytem katalogu",
   Math.max(...Object.values(ITEMS).filter((i) => i.type === "armor").map((i) => instanceDefense(inst(i.id, 3))))
     === 28);
ok("G3", "⛔ cap i `defenseK` nietknięte", M.EQUIPMENT.maxDefenseReduction === 0.75 && M.EQUIPMENT.defenseK === 50);
ok("G4", "⛔ ręce zostają jednogatunkowe (korytarz pusty: 5/6 = 0,833 > 0,810)",
   !Object.values(ITEMS).some((i) => i.type === "armor" && i.slot === "gloves" && itemMaterial(i.id) === "iron"),
   `sufit czytelności = ${(0.85 / 1.05).toFixed(3)}`);

console.log(`\n${bledow === 0 ? "OK" : "BŁĘDY"} — zamków czerwonych: ${bledow}`);
/* ══════════════════════════════════════════════════════════════════════════
   §W. GATUNEK MATERIAŁU BRONI (2026-09-16)
   ══════════════════════════════════════════════════════════════════════════
   ⚠ Oś powstała RAZEM z fundamentem, a nie razem z zawartością — przez dobę
   nie korzystała z niej żadna broń. **Od 2026-09-17 ma dwóch użytkowników:
   nóż i cep bojowy**, i to zmienia charakter tego bloku: do wczoraj pilnował
   wyłącznie tego, że drabinka jest poprawnie zbudowana i że nic nie ruszyła,
   a od dziś pilnuje też, że **naprawdę mnoży** (`W9`).
   ⛔ Katalog dalej rośnie, kiedy ma powód — żelazo dostały dwie sztuki,
   w których jest faktem świata, a nie żadna z dwudziestu ośmiu pozostałych.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§W. Gatunek materiału BRONI:");
{
  const bronie = Object.values(ITEMS).filter((i) => i.type === "weapon");
  ok("W1", "stal jest poziomem ZEROWYM (x1,00 obrazen i ceny)",
     WEAPON_MATERIAL.steel.damageMul === 1 && WEAPON_MATERIAL.steel.priceMul === 1);
  ok("W2", "⭐ `priceMul` NIŻSZY niż `damageMul` (tańszy gatunek ma być wyborem, nie pułapką)",
     Object.values(WEAPON_MATERIAL).every((m) => m.priceMul <= m.damageMul) &&
       Object.values(WEAPON_MATERIAL).some((m) => m.priceMul < m.damageMul),
     Object.entries(WEAPON_MATERIAL).map(([k, m]) => `${k} ${m.priceMul}/${m.damageMul}`).join(" · "));
  ok("W3", "broń BEZ pola `material` czyta się jako stal (mnożnik 1,00)",
     bronie.every((i) => "material" in i || weaponMaterial(i.id) === "steel") &&
       weaponDamageMul(weaponMaterial("sword")) === 1);
  ok("W4", "⛔ oś broni NIE dotyka pancerza, a oś pancerza NIE dotyka broni",
     weaponMaterial("steel_chest") === null && itemMaterial("sword") === null);
  {
    const d = instanceDamage({ itemId: "sword", qty: 1, quality: M.QUALITY.defaultLevel });
    const mnoznik = 1 + M.QUALITY.modifiers.damage[M.QUALITY.defaultLevel];
    ok("W5", "⭐ wprowadzenie osi nie ruszyło ANI JEDNEJ istniejącej liczby obrażeń",
       Math.abs(d.min - ITEMS.sword.damageMin * mnoznik) < 1e-9 &&
         Math.abs(d.max - ITEMS.sword.damageMax * mnoznik) < 1e-9,
       `miecz ${d.min.toFixed(2)}-${d.max.toFixed(2)}`);
  }
  ok("W6", "zamek deklaracji milczy na dzisiejszym katalogu", weaponMaterialProblems().length === 0);
  ok("W7", "⭐ …ale UMIE zaświecić (sabotaż: gatunek spoza tabeli)",
     (() => {
       const zapas = ITEMS.sword.material;
       ITEMS.sword.material = "mithril";
       const zle = weaponMaterialProblems().length === 1;
       if (zapas === undefined) delete ITEMS.sword.material; else ITEMS.sword.material = zapas;
       return zle && weaponMaterialProblems().length === 0;
     })());
  ok("W8", "⛔ gatunek nie rusza masy ani wymagań — tylko obrażenia i cena",
     Object.values(WEAPON_MATERIAL).every((m) => Object.keys(m).sort().join() === "damageMul,name,priceMul"));
  {
    // ⭐ **W9 — jedyny wiersz, który dowodzi, że oś COŚ ROBI.** W1–W8 opisują
    //   tabelę i granice; dopóki żadna broń nie miała pola, żaden z nich nie
    //   przechodził ścieżki mnożenia. Zepsucie `weaponDamageMul` przeszłoby
    //   wtedy cały przymiar na zielono.
    const n = instanceDamage({ itemId: "knife", qty: 1, quality: M.QUALITY.defaultLevel });
    const q = 1 + M.QUALITY.modifiers.damage[M.QUALITY.defaultLevel];
    ok("W9", "⭐ żelazna broń bije 0,80 nominału — oś naprawdę mnoży",
       Math.abs(n.min - ITEMS.knife.damageMin * 0.8 * q) < 1e-9 &&
         Math.abs(n.max - ITEMS.knife.damageMax * 0.8 * q) < 1e-9,
       `nóż ${n.min.toFixed(2)}-${n.max.toFixed(2)} z nominału ${ITEMS.knife.damageMin}-${ITEMS.knife.damageMax}`);
    ok("W9", "⭐ …i kosztuje 0,60 nominału",
       M.buyPriceOf("knife", M.QUALITY.defaultLevel) ===
         Math.max(1, Math.round(ITEMS.knife.buyPrice * 0.6 * M.QUALITY.priceMul[M.QUALITY.defaultLevel])),
       `${M.buyPriceOf("knife", M.QUALITY.defaultLevel)} g`);
  }
}

process.exit(bledow === 0 ? 0 : 1);

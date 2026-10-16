/**
 * **Przymiar RĘCE × DRUGA RĘKA × ZAPIS** (2026-09-17).
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * Bo `§Y` regresji sprawdza dwuręczność **statycznie** — czy liczby broni
 * układają się w tożsamość 2H — i **ani jedna asercja w projekcie nie
 * uruchamiała bramki rąk NAPRAWDĘ**. Reguła „dwuręczna blokuje drugą rękę"
 * żyła w czterech miejscach `Equipment` (`usesBothHandsIn`, `handsRefusalFor`,
 * `equipFromBag`, `accepts`) i w `normalizeHands`, a jedynym dowodem, że
 * działa, było przeczytanie kodu.
 *
 * ⚠⚠ **Najwrażliwsze jest `normalizeHands`, bo pilnuje granicy, którą `Save.
 * load()` PRZEKRACZA**: wczytywanie pisze wprost w sloty (`Equipment.weapon = …`),
 * omijając każdą bramkę w `equipFromBag`. Zapis z nielegalną parą — dwuręczna
 * plus tarcza — jest więc jedynym sposobem, żeby ta para w ogóle powstała,
 * i jedynym miejscem, gdzie się ją sprząta.
 *
 * ⚠ **Siła wpisywana WPROST (`Progression.strength = 20`).** Wielki miecz ma
 * `requires.strength = 8`; bez tego `equip` odmawia z zupełnie innego powodu,
 * a cały przymiar świeci na zielono przy **zepsutej bramce rąk**. Ta pułapka
 * złapała pierwszą wersję tego pliku.
 *
 *   node tools/rece_przymiar.mjs
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
const ok = (opis, warunek, detal = "") => {
  if (warunek) console.log(`  OK   ${opis}${detal ? "   " + detal : ""}`);
  else { bledow++; console.log(`  BŁĄD ${opis}${detal ? "   " + detal : ""}`); }
};

const stubPhaser = P("node_modules", ".r-phaser.ts");
const stubBus = P("node_modules", ".r-bus.ts");
await writeFile(stubPhaser, "export default {};\n");
await writeFile(stubBus,
  "export const GameEvents = { emit() {}, on() {}, off() {} };\n" +
  "export const EVENT = new Proxy({}, { get: (_t, k) => String(k) });\n");
const wejscie = P("node_modules", ".r-entry.ts");
await writeFile(wejscie, [
  'export * from "../src/core/Equipment";',
  'export { Inventory } from "../src/core/Inventory";',
  'export { Progression } from "../src/core/Progression";',
  'export { itemHands, itemGrip } from "../src/core/Items";',
  'export { ITEMS } from "../src/config/GameConfig";',
].join("\n") + "\n");
const bundel = P("node_modules", ".r-all.mjs");
await build({
  format: "esm", bundle: true, logLevel: "silent", platform: "node",
  entryPoints: [wejscie], outfile: bundel,
  alias: { phaser: stubPhaser },
  plugins: [{ name: "bus", setup: (b) => b.onResolve({ filter: /\.\/EventBus$/ }, () => ({ path: stubBus })) }],
});
const M = await import(pathToFileURL(bundel).href);
const { Equipment, Inventory, Progression, itemHands, itemGrip, ITEMS } = M;

console.log("=== RĘCE / OFFHAND / ZAPIS — dwa nowe miecze ===\n");

// ── 1. deklaracje `hands` czterech mieczy drabinki ─────────────────────────
ok("Miecz długi  → hands 1", itemHands("longsword") === 1, `${itemHands("longsword")}`);
ok("Bastard      → hands 2 (stan dzisiejszy, patrz C5)", itemHands("bastard_sword") === 2, `${itemHands("bastard_sword")}`);
ok("Miecz dwuręczny → hands 2", itemHands("greatsword") === 2, `${itemHands("greatsword")}`);
ok("Wielki miecz → hands 2", itemHands("zweihander") === 2, `${itemHands("zweihander")}`);

// ── 2. tarcza w drugiej ręce ───────────────────────────────────────────────
const daj = (id) => { Inventory.addItem(id, 1); return id; };
// ⚠ Siła wpisywana WPROST: `spendPoint` wymaga nieprzydzielonych punktów,
//   a ten przymiar bada RĘCE, nie ekonomię rozwoju. Wielki miecz ma
//   `requires.strength = 8`, więc bez tego equip odmawia z zupełnie innego
//   powodu i cały test świeci na zielono przy zepsutej bramce rąk.
Progression.strength = 20;
console.log(`
  (Siła testowa: ${Progression.strength})`);

function probaPary(bron, offhand) {
  Equipment.reset();
  Inventory.reset();
  Progression.strength = 20;
  daj(bron); daj(offhand);
  const zalozonaBron = Equipment.equip(bron);
  const zalozonyOff = Equipment.equip(offhand);
  return { zalozonaBron, zalozonyOff, off: Equipment.offhand?.itemId ?? null };
}

const dlugiZTarcza = probaPary("longsword", "buckler");
ok("⭐ Miecz długi WPUSZCZA tarczę do drugiej ręki",
   dlugiZTarcza.zalozonaBron && dlugiZTarcza.off === "buckler",
   `bron=${dlugiZTarcza.zalozonaBron} off=${dlugiZTarcza.off}`);

const wielkiZTarcza = probaPary("zweihander", "buckler");
ok("⛔ Wielki miecz BLOKUJE drugą rękę",
   wielkiZTarcza.off === null,
   `off=${wielkiZTarcza.off}`);

const dwureczny = probaPary("greatsword", "buckler");
ok("⛔ Miecz dwuręczny dalej blokuje (bez regresji)", dwureczny.off === null, `off=${dwureczny.off}`);

// ── 3. odmowa jest ZAPISANA, nie cicha ─────────────────────────────────────
Equipment.reset(); Inventory.reset();
daj("zweihander");
const odmowa = Equipment.handsRefusalFor("buckler", "offhand");
Equipment.equip("zweihander");
const odmowa2 = Equipment.handsRefusalFor("buckler", "offhand");
ok("⭐ `handsRefusalFor` nazywa BROŃ, która blokuje rękę",
   odmowa2 && odmowa2.kind === "offhandBlocked" && odmowa2.weaponName === "Wielki miecz",
   JSON.stringify(odmowa2));

// ⚠⚠ **`accepts` trzeba sprawdzić OSOBNO od `equip`** — i to nie jest
//   nadmiarowość. Bramka rąk stoi w DWÓCH niezależnych miejscach: `accepts`
//   (podświetlanie celu w panelu) i `handsRefusalFor` (sama operacja). Zepsucie
//   samego `accepts` NIE psuje zakładania, więc `equip` wyżej zostaje zielony,
//   a gracz widzi podświetlony slot, który zaraz odmówi. Bez tej linijki połowa
//   reguły nie jest badana przez nic.
ok("⭐ `accepts` też ODMAWIA drugiej ręki przy broni dwuręcznej (ścieżka UI)",
   Equipment.accepts("offhand", "buckler") === false,
   `accepts=${Equipment.accepts("offhand", "buckler")}`);

Equipment.reset(); Inventory.reset();
Progression.strength = 20;
daj("longsword"); Equipment.equip("longsword");
ok("⛔ …a przy jednoręcznym WPUSZCZA (ta sama ścieżka, drugi kierunek)",
   Equipment.accepts("offhand", "buckler") === true,
   `accepts=${Equipment.accepts("offhand", "buckler")}`);

// ── 4. normalizeHands po wczytaniu zapisu ──────────────────────────────────
// Save.load() pisze WPROST w sloty, omijając bramki — sprawdzamy tę granicę.
Equipment.reset(); Inventory.reset();
Equipment.weapon = { itemId: "zweihander", qty: 1, quality: 3, durability: 160 };
Equipment.offhand = { itemId: "buckler", qty: 1, quality: 3, durability: 50 };
const zmieniono = Equipment.normalizeHands();
ok("⭐ `normalizeHands` sprząta nielegalną parę z zapisu (wielki miecz + tarcza)",
   zmieniono === true && Equipment.offhand === null,
   `zmieniono=${zmieniono} offhand=${Equipment.offhand?.itemId ?? null}`);

Equipment.reset(); Inventory.reset();
Equipment.weapon = { itemId: "longsword", qty: 1, quality: 3, durability: 120 };
Equipment.offhand = { itemId: "buckler", qty: 1, quality: 3, durability: 50 };
const bezZmian = Equipment.normalizeHands();
ok("⛔ …i NIE rusza legalnej pary (miecz długi + tarcza)",
   bezZmian === false && Equipment.offhand?.itemId === "buckler",
   `zmieniono=${bezZmian} offhand=${Equipment.offhand?.itemId ?? null}`);

// ── 5. schowany zestaw podlega tej samej regule ────────────────────────────
Equipment.reset(); Inventory.reset();
Equipment.weapon2 = { itemId: "zweihander", qty: 1, quality: 3, durability: 160 };
Equipment.offhand2 = { itemId: "buckler", qty: 1, quality: 3, durability: 50 };
const zestaw2 = Equipment.normalizeHands();
ok("⭐ reguła obowiązuje też w SCHOWANYM zestawie (weapon2/offhand2)",
   zestaw2 === true && Equipment.offhand2 === null,
   `zmieniono=${zestaw2} offhand2=${Equipment.offhand2?.itemId ?? null}`);


/* ══════════════════════════════════════════════════════════════════════════
   §H — KATEGORIA 1.5H (2026-09-18)

   ⚠⚠ **Po co osobna sekcja, skoro §1–§5 wyżej już badają ręce.** Bo 1.5H nie
   jest trzecim stanem `hands` — jest DRUGĄ OSIĄ (`grip`), krzyżującą się
   z pierwszą. Wszystko wyżej pyta „ile rąk CHCE ta broń"; wszystko niżej pyta
   „jak postać ją TRZYMA", a to jest stan wyposażenia, nie pole katalogu.

   ⚠ Asercje są WARTOŚCIOWE, nie kształtowe: 45, 60 i ×0,85 stoją tu wprost.
   To są PLAYTEST BASELINE i mają zaświecić w dniu, w którym ktoś je przestroi
   bez zajrzenia do decyzji.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n=== §H. KATEGORIA 1.5H ===\n");

const charSrc = await readFile(P("src", "render3d", "Character3D.ts"), "utf8");
const r2 = (n) => Math.round(n * 100) / 100;
const zaloz = (bron, off) => {
  Equipment.reset();
  Inventory.reset();
  Progression.strength = 20;
  daj(bron);
  Equipment.equip(bron);
  if (off) { daj(off); Equipment.equip(off); }
};

console.log("§H1. Deklaracja — dwie osie, nie trzeci stan `hands`:");
for (const id of ["bastard_sword", "spear", "pitchfork"]) {
  ok(`${id} → hands 2 ORAZ grip "either"`,
     itemHands(id) === 2 && itemGrip(id) === "either",
     `hands=${itemHands(id)} grip=${itemGrip(id)}`);
}
ok('⛔ Wielki miecz zostaje pełną 2H (grip "full")', itemGrip("zweihander") === "full");
ok('⛔ Miecz długi zostaje 1H (grip "full")', itemGrip("longsword") === "full");
ok("⭐ …i ŻADNA broń nie ma `hands` spoza {1,2} — zamek na powrót `hands: 1.5`",
   Object.values(ITEMS).every((i) => i.type !== "weapon" || i.hands === undefined || i.hands === 1 || i.hands === 2));

console.log("\n§H2. Chwyt WYPROWADZANY ze stanu drugiej ręki, nie wybierany:");
zaloz("bastard_sword");
ok('⭐ bastard bez tarczy → chwyt "two"', Equipment.weaponGrip === "two", Equipment.weaponGrip);
zaloz("bastard_sword", "buckler");
ok("⭐ bastard + tarcza → tarcza WCHODZI", Equipment.offhand?.itemId === "buckler", `${Equipment.offhand?.itemId}`);
ok('⭐ …i chwyt przechodzi na "one" SAM, bez przycisku', Equipment.weaponGrip === "one", Equipment.weaponGrip);
zaloz("zweihander", "buckler");
ok("⛔ wielki miecz + tarcza NADAL nielegalne (bez regresji)", Equipment.offhand === null);
ok('⛔ …i jego chwyt zostaje "two" niezależnie od wszystkiego', Equipment.weaponGrip === "two");
zaloz("sword", "buckler");
ok('⛔ zwykła 1H + tarcza bez zmian, chwyt "one"',
   Equipment.offhand?.itemId === "buckler" && Equipment.weaponGrip === "one");

console.log("\n§H3. Bastard — kara na SILE CIOSU i ANI JEDNA oś więcej:");
zaloz("bastard_sword");
const bOb = { d: Equipment.weaponDamage, cd: Equipment.weaponAttackCooldown, m: Equipment.weaponMelee, sw: Equipment.weaponSwing, a: Equipment.weaponAttacks.map((x) => x.id).join(",") };
zaloz("bastard_sword", "buckler");
const bJed = { d: Equipment.weaponDamage, cd: Equipment.weaponAttackCooldown, m: Equipment.weaponMelee, sw: Equipment.weaponSwing, a: Equipment.weaponAttacks.map((x) => x.id).join(",") };
ok("⭐ obrażenia oburącz = nominał konstrukcji (12-19)", bOb.d.min === 12 && bOb.d.max === 19, `${bOb.d.min}-${bOb.d.max}`);
ok("⭐ obrażenia jednorącz = x0,85 (PLAYTEST BASELINE)",
   r2(bJed.d.min) === r2(12 * 0.85) && r2(bJed.d.max) === r2(19 * 0.85),
   `${r2(bJed.d.min)}-${r2(bJed.d.max)}`);
ok("⛔ ZASIĘG nietknięty przez chwyt", bOb.m.reach === bJed.m.reach, `${bOb.m.reach}`);
ok("⛔⛔ TEMPO nietknięte przez chwyt — tarcza już je opodatkowuje",
   bOb.cd === bJed.cd && bOb.sw.durationMs === bJed.sw.durationMs,
   `cd ${bOb.cd}=${bJed.cd} swing ${bOb.sw.durationMs}=${bJed.sw.durationMs}`);
ok("⛔ MARTWA STREFA nietknięta (bastard płaci siłą, nie kontrolą)",
   (bOb.m.minReach ?? 0) === (bJed.m.minReach ?? 0));
ok("⛔ WARIANTY ataku zostają OBA w obu chwytach (decyzja 2026-09-18)",
   bOb.a === "cut,thrust" && bJed.a === "cut,thrust", `${bOb.a} | ${bJed.a}`);

console.log("\n§H4. Włócznia i widły — `minReachAdd`, ZASIĘG NIETKNIĘTY:");
for (const [id, bazowa, jednoracz, zasieg] of [["spear", 0, 45, 98], ["pitchfork", 20, 60, 102]]) {
  zaloz(id);
  const ob = Equipment.weaponMelee, obMin = Progression.attackMinReach, obDmg = Equipment.weaponDamage.min;
  zaloz(id, "buckler");
  const jed = Equipment.weaponMelee, jedMin = Progression.attackMinReach, jedDmg = Equipment.weaponDamage.min;
  ok(`${id}: martwa strefa oburącz = ${bazowa}`, (ob.minReach ?? 0) === bazowa, `${ob.minReach ?? 0}`);
  ok(`${id}: ⭐ martwa strefa jednorącz = ${jednoracz} (PLAYTEST BASELINE)`, (jed.minReach ?? 0) === jednoracz, `${jed.minReach ?? 0}`);
  ok(`${id}: ⛔⛔ ZASIĘG ${zasieg} w OBU chwytach — drzewcowych nie skracamy`,
     ob.reach === zasieg && jed.reach === zasieg, `${ob.reach}/${jed.reach}`);
  ok(`${id}: ⭐ Progression.attackMinReach NIESIE to do walki`,
     obMin === bazowa && jedMin === jednoracz, `${obMin} -> ${jedMin}`);
  ok(`${id}: ⛔ obrażenia NIETKNIĘTE (świadomie jedna kara naraz)`, r2(obDmg) === r2(jedDmg), `${r2(obDmg)}`);
}

console.log("\n§H5. ⛔ 1.5H nigdy nie wchodzi do drugiej ręki:");
zaloz("sword");
for (const id of ["bastard_sword", "spear", "pitchfork"]) {
  ok(`${id} ODRZUCONY na offhand (ścieżka UI — accepts)`, Equipment.accepts("offhand", id) === false);
}
zaloz("sword");
daj("bastard_sword");
Equipment.equip("bastard_sword", "offhand");
ok("⭐ …i ODRZUCONY przy samej operacji (equip ze wskazanym slotem)",
   Equipment.offhand === null, `${Equipment.offhand?.itemId ?? "null"}`);
// ⚠ `equip` BEZ wskazanego slotu wkłada broń do ręki GŁÓWNEJ (`slotForItem`
//   zawsze odpowiada "weapon"), więc dual wield wymaga jawnego slotu — tak
//   jak w panelu, gdzie gracz upuszcza przedmiot na konkretny kafel.
zaloz("sword");
daj("dagger");
Equipment.equip("dagger", "offhand");
ok("⛔ …a zwykła 1H nadal wchodzi do drugiej ręki — dual wield bez zmian",
   Equipment.offhand?.itemId === "dagger", `${Equipment.offhand?.itemId ?? "null"}`);

console.log("\n§H6. `normalizeHands` — granica, którą `Save.load()` przekracza:");
Equipment.reset(); Inventory.reset();
Equipment.weapon = { itemId: "bastard_sword", qty: 1, quality: 3, durability: 120 };
Equipment.offhand = { itemId: "buckler", qty: 1, quality: 3, durability: 50 };
ok("⭐⭐ NIE sprząta pary 1.5H + tarcza (legalna od 2026-09-18)",
   Equipment.normalizeHands() === false && Equipment.offhand?.itemId === "buckler",
   `${Equipment.offhand?.itemId ?? "null"}`);
Equipment.reset(); Inventory.reset();
Equipment.weapon = { itemId: "zweihander", qty: 1, quality: 3, durability: 160 };
Equipment.offhand = { itemId: "buckler", qty: 1, quality: 3, durability: 50 };
ok("⛔ …i NADAL sprząta 2H + tarcza (regresja z §4 nietknięta)",
   Equipment.normalizeHands() === true && Equipment.offhand === null);
Equipment.reset(); Inventory.reset();
Equipment.weapon2 = { itemId: "spear", qty: 1, quality: 3, durability: 100 };
Equipment.offhand2 = { itemId: "buckler", qty: 1, quality: 3, durability: 50 };
ok("⭐ zestaw SCHOWANY: 1.5H + tarcza też przechodzi bez sprzątania",
   Equipment.normalizeHands() === false && Equipment.offhand2?.itemId === "buckler");
ok("⭐ …a chwyt zestawu II liczy się OSOBNO od zestawu I",
   Equipment.gripOf(2) === "one", `set2=${Equipment.gripOf(2)}`);
Equipment.reset(); Inventory.reset();
Equipment.weapon2 = { itemId: "spear", qty: 1, quality: 3, durability: 100 };
ok('⭐ …schowana 1.5H bez tarczy ma chwyt "two"', Equipment.gripOf(2) === "two", Equipment.gripOf(2));

console.log("\n§H7. Jedno źródło prawdy dla UI i 3D:");
zaloz("bastard_sword");
ok("⭐ `usesBothHandsIn` = false dla 1.5H → kafel drugiej ręki NIE gaśnie",
   Equipment.usesBothHandsIn(1) === false);
zaloz("zweihander");
ok("⛔ …a dla pełnej 2H nadal true (zasłona zostaje)", Equipment.usesBothHandsIn(1) === true);
ok("⭐⭐ `Character3D` pyta o CHWYT, nie o `ITEMS[…].hands` — drugie źródło prawdy zamknięte",
   /Equipment\.weaponGrip/.test(charSrc));


/* ══════════════════════════════════════════════════════════════════════════
   §H8 — `OI-122`: CO WOLNO TRZYMAĆ W DRUGIEJ RĘCE PRZY 1.5H

   ⚠⚠ **1.5H NIE JEST kategorią „broń + tarcza".** Tarcza jest jednym
   z możliwych zastosowań zwolnionej ręki, nie definicją chwytu. Chwyt pyta
   wyłącznie „czy druga ręka jest zajęta", nigdy „czy trzyma tarczę" —
   i ta sekcja jest zamkiem na to, żeby ktoś kiedyś nie zawęził tego pytania.

   ⭐ **Koszt konfiguracji liczą MECHANIZMY, KTÓRE JUŻ SĄ**: derogacja
   `oneHanded`, `offhandSwingMul` (tarcza spowalnia / dual wield przyspiesza),
   wymagania i masa obu broni, biegłość per ręka. ⛔ Żadnej osobnej kary
   „bo konfiguracja jest nietypowa" — decyzja autora 2026-09-18.
   ══════════════════════════════════════════════════════════════════════════ */
console.log("\n§H8. `OI-122` — bastard z trzema zawartościami drugiej ręki:");

const MACIERZ = [
  // [ co w drugiej ręce, chwyt, obrażenia min-max, dualWielding, offhandSwingMul, offhand po operacji ]
  [null,      "two", "12.00-19.00", false, 1,    null],
  ["buckler", "one", "10.20-16.15", false, 1.08, "buckler"],
  ["dagger",  "one", "10.20-16.15", true,  0.85, "dagger"],
];

for (const [off, chwyt, obr, dw, swing, oczekOff] of MACIERZ) {
  Equipment.reset();
  Inventory.reset();
  Progression.strength = 20;
  daj("bastard_sword");
  Equipment.equip("bastard_sword");
  if (off) {
    daj(off);
    // ⚠ Broń do DRUGIEJ ręki wymaga jawnego slotu — `slotForItem` zawsze
    //   odpowiada "weapon". Tarcza trafia tam sama (`slot: "offhand"`).
    Equipment.equip(off, "offhand");
  }
  const etykieta = off ?? "pusta ręka";
  const d = Equipment.weaponDamage;
  ok(`bastard + ${etykieta}: druga ręka = ${oczekOff ?? "pusta"}`,
     (Equipment.offhand?.itemId ?? null) === oczekOff, `${Equipment.offhand?.itemId ?? "null"}`);
  ok(`bastard + ${etykieta}: chwyt "${chwyt}"`, Equipment.weaponGrip === chwyt, Equipment.weaponGrip);
  ok(`bastard + ${etykieta}: obrażenia ${obr}`,
     `${d.min.toFixed(2)}-${d.max.toFixed(2)}` === obr, `${d.min.toFixed(2)}-${d.max.toFixed(2)}`);
  ok(`bastard + ${etykieta}: cooldown broni 0,6 (chwyt tempa NIE rusza)`,
     Equipment.weaponAttackCooldown === 0.6, `${Equipment.weaponAttackCooldown}`);
  ok(`bastard + ${etykieta}: dualWielding = ${dw}`, Equipment.dualWielding === dw, `${Equipment.dualWielding}`);
  ok(`bastard + ${etykieta}: offhandSwingMul = ${swing} (istniejący kanał, bez dopłat)`,
     Equipment.offhandSwingMul === swing, `${Equipment.offhandSwingMul}`);
}

// ⭐ Zamek na SENS, nie tylko na wartości: te trzy konfiguracje muszą się
//   RÓŻNIĆ tempem, bo liczy je druga ręka — a nie chwyt.
ok("⭐⭐ trzy konfiguracje dają TRZY różne mnożniki tempa — liczy je DRUGA RĘKA, nie chwyt",
   new Set(MACIERZ.map(([, , , , s]) => s)).size === 3, MACIERZ.map(([o, , , , s]) => `${o ?? "puste"}=${s}`).join(" "));
// ⛔ …a derogacja chwytu jest ta sama w obu konfiguracjach jednoręcznych.
ok("⛔ derogacja chwytu IDENTYCZNA dla tarczy i dla sztyletu (żadnej kary „bo nietypowe\")",
   MACIERZ[1][2] === MACIERZ[2][2], `${MACIERZ[1][2]} = ${MACIERZ[2][2]}`);

console.log(`\n${bledow === 0 ? "OK — wszystkie przejścia zielone." : `⛔ ${bledow} BŁĘDÓW`}`);
process.exit(bledow === 0 ? 0 : 1);

/**
 * Stamina / obciążenie / Unik — PRZYMIAR do decyzji (2026-08-20).
 *
 * ⚠ **TYLKO RAPORT. Nie zapisuje niczego i nie ma `--zapisz`.** Liczy cztery
 * pytania postawione przed decyzją o modelu STR/DEX/VIT/CON — nic z tego nie
 * jest zaimplementowane w grze i większość wartości niżej to PROPOZYCJE, nie
 * config.
 *
 * ── Skąd biorą się liczby ──────────────────────────────────────────────────
 * Wszystko, co dotyczy DZISIEJSZEJ gry (HP wrogów, obrażenia, telegrafy,
 * pancerz, prędkości, zasięgi agro), czytane jest z `GameConfig.ts` przez
 * esbuild — prawdziwe wartości. Wszystko, co dotyczy PROPONOWANEJ staminy,
 * stoi w bloku `PROPOZYCJA` i jest jawnie oznaczone.
 *
 * ⚠ Samosprawdzenie (reguła z `tools/CLAUDE.md`): redukcje kompletów pancerza
 * porównywane są z liczbami zapisanymi w `docs/ekwipunek_przedmioty.md`.
 * Rozjazd = BŁĄD i niezerowy kod wyjścia.
 *
 *   node tools/stamina_przymiar.mjs
 */

import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(KORZEN, "node_modules", ".stamina-przymiar.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

const { ITEMS, PLAYER, ARMOR_PROFILE, EQUIPMENT, ABILITIES, ATTRIBUTES,
        BOAR, WOLF, GREY_WOLF, BEAR, RABBIT, VENOM_SPIDER, SPIDER } = C;

// ── PROPOZYCJA (nie config — to jest przedmiot decyzji) ─────────────────────
const P = {
  pulaBazowa: 100,
  staminaNaCON: 8,
  regenGoniony: 4,      // /s, gdy KTOŚ CIĘ ŚCIGA
  regenWolny: 15,       // /s, gdy nikt nie ściga
  kosztUniku: 30,
  kosztTrafienia: 12,   // moduł opcjonalny
  mnoznikObciazenia: { lekki: 1.0, sredni: 1.25, ciezki: 1.5 },
  koszty: { cleave: 20, charge: 30, whirlwind: 35, warcry: 40 },
  cooldownySkrocone: { cleave: 5, charge: 12, whirlwind: 6, warcry: 18 },
};

// ── Model pancerza (przepisany z core/Protection.ts + Equipment.defenseAgainst)
const pktProfil = (pkt, mat, typ) => (typ ? pkt * ARMOR_PROFILE[mat][typ] : pkt);
const redukcja = (pkt) =>
  pkt <= 0 ? 0 : Math.min(pkt / (pkt + EQUIPMENT.defenseK), EQUIPMENT.maxDefenseReduction);

function zestawRedukcja(ids, typ) {
  const pkt = ids.reduce((s, id) => {
    const it = ITEMS[id];
    return s + pktProfil(it.defense, it.armorType, typ);
  }, 0);
  return redukcja(pkt);
}

const SKORA = ["leather_helmet", "leather_chest", "leather_gloves", "leather_legs", "leather_boots"];
const PRZESZYW = ["padded_cap", "gambeson", "padded_gloves", "padded_chausses", "foot_wraps"];
const KOLCZ = ["mail_coif", "mail_hauberk", "mail_gloves", "mail_chausses", "mail_boots"];
const STAL = ["steel_helmet", "steel_chest", "steel_gauntlets", "steel_legs", "steel_boots"];
const LOADOUT = {
  "brak":            { ids: [], klasa: "lekki" },
  "skóra":           { ids: SKORA, klasa: "lekki" },
  "przeszywanica":   { ids: PRZESZYW, klasa: "lekki" },
  "kolczuga":        { ids: KOLCZ, klasa: "średni" },
  "stal":            { ids: STAL, klasa: "ciężki" },
  "stal + tarcza":   { ids: [...STAL, "ironbound_shield"], klasa: "ciężki" },
};
const KLASA_MNOZ = { "lekki": P.mnoznikObciazenia.lekki, "średni": P.mnoznikObciazenia.sredni, "ciężki": P.mnoznikObciazenia.ciezki };

const f1 = (n) => n.toFixed(1);
const pad = (s, n) => String(s).padStart(n);
const padr = (s, n) => String(s).padEnd(n);

// ── 0. SAMOSPRAWDZENIE ─────────────────────────────────────────────────────
console.log("== 0. Samosprawdzenie: komplety pancerza vs docs/ekwipunek_przedmioty.md ==");
const OCZEK = {
  "skóra": [38.3, 38.3, 21.8, 33.2],
  "stal": [55.8, 63.8, 59.2, 38.7],
  "kolczuga": [50.5, 64.7, 41.7, 26.3],
  "przeszywanica": [42.5, 47.0, 20.6, 44.9],
};
let bledy = 0;
for (const [nazwa, oczek] of Object.entries(OCZEK)) {
  const got = [undefined, "slash", "pierce", "blunt"].map((t) => 100 * zestawRedukcja(LOADOUT[nazwa].ids, t));
  const ok = got.every((g, i) => Math.abs(g - oczek[i]) < 0.15);
  if (!ok) bledy++;
  console.log(`  ${ok ? "OK  " : "BŁĄD"} ${padr(nazwa, 15)} ${got.map((g) => pad(f1(g) + "%", 8)).join("")}`);
}
if (bledy) { console.error(`\n⚠ ${bledy} rozjazdów — model pancerza odbiegł od kodu.`); process.exit(1); }

// ── Telegrafy i ciosy, które trzeba przeżyć ────────────────────────────────
const CIOSY = [
  { nazwa: "Dzik — SZARŻA",        min: BOAR.charge.damageMin, max: BOAR.charge.damageMax, typ: BOAR.charge.damageType, tell: BOAR.charge.telegraphMs, telegraf: true },
  { nazwa: "Szary — UKĄSZENIE",    min: GREY_WOLF.duel.biteDamageMin, max: GREY_WOLF.duel.biteDamageMax, typ: GREY_WOLF.duel.biteDamageType, tell: GREY_WOLF.duel.windupMs, telegraf: true },
  { nazwa: "Niedźwiedź — kontakt", min: BEAR.touchDamageMin, max: BEAR.touchDamageMax, typ: BEAR.touchDamageType, tell: null, telegraf: false },
  { nazwa: "Szary — kontakt",      min: GREY_WOLF.touchDamageMin, max: GREY_WOLF.touchDamageMax, typ: GREY_WOLF.touchDamageType, tell: null, telegraf: false },
  { nazwa: "Dzik — kontakt",       min: BOAR.touchDamageMin, max: BOAR.touchDamageMax, typ: BOAR.touchDamageType, tell: null, telegraf: false },
  { nazwa: "Wilk — kontakt",       min: WOLF.touchDamageMin, max: WOLF.touchDamageMax, typ: WOLF.touchDamageType, tell: null, telegraf: false },
  { nazwa: "Skoczek — SKOK",       min: VENOM_SPIDER.leap?.damageMin ?? 3, max: VENOM_SPIDER.leap?.damageMax ?? 5, typ: "pierce", tell: 480, telegraf: true },
];

// ── 1. Ile zjada pancerz z telegrafu ───────────────────────────────────────
console.log("\n== 1. Obrażenia PO pancerzu (średnia z zakresu) ==");
console.log("   ⚠ To jest liczba, na której stoi cały podział VIT/CON: czy ciężki build");
console.log("     może ZREZYGNOWAĆ z uniku, bo stać go przyjąć cios.\n");
const NAZWY = Object.keys(LOADOUT);
console.log("  cios                    surowo" + NAZWY.map((n) => pad(n.slice(0, 13), 15)).join(""));
for (const c of CIOSY) {
  const avg = (c.min + c.max) / 2;
  const kol = NAZWY.map((n) => {
    const po = avg * (1 - zestawRedukcja(LOADOUT[n].ids, c.typ ?? undefined));
    return pad(`${f1(po)} (-${Math.round(100 * (1 - po / avg))}%)`, 15);
  });
  console.log("  " + padr(c.nazwa, 22) + pad(f1(avg), 6) + kol.join(""));
}

console.log("\n  Ile TAKICH ciosów przeżyjesz (HP = 100 + 6×VIT):");
console.log("  cios                  VIT" + NAZWY.map((n) => pad(n.slice(0, 13), 15)).join(""));
for (const c of CIOSY.filter((x) => x.telegraf || x.nazwa.includes("Szary — kontakt"))) {
  for (const vit of [0, 5, 10]) {
    const hp = PLAYER.hp + vit * ATTRIBUTES.hpPerEndurance;
    const avg = (c.min + c.max) / 2;
    const kol = NAZWY.map((n) => {
      const po = Math.max(1, avg * (1 - zestawRedukcja(LOADOUT[n].ids, c.typ ?? undefined)));
      return pad(Math.floor(hp / po), 15);
    });
    console.log("  " + padr(vit === 0 ? c.nazwa : "", 20) + pad(vit, 4) + kol.join(""));
  }
}

// ── 2. Ile uników starcza ──────────────────────────────────────────────────
console.log("\n== 2. Ile UNIKÓW starcza na walkę ==");
console.log(`   Pula = ${P.pulaBazowa} + ${P.staminaNaCON}×CON; unik ${P.kosztUniku} × mnożnik obciążenia`);
console.log("   ⚠ Regeneracja w walce (4/s) DOLICZONA — walka trwa tyle, ile TTK niżej.\n");

const WROGOWIE = [
  { nazwa: "Królik", hp: RABBIT.hp },
  { nazwa: "Wilk", hp: WOLF.hp },
  { nazwa: "Dzik", hp: BOAR.hp },
  { nazwa: "Niedźwiedź", hp: BEAR.hp },
  { nazwa: "Szary (elita)", hp: GREY_WOLF.hp },
];
const DPS = 50; // gracz przy ~10 pkt z dopasowaną bronią (docs/atrybuty.md §10)

console.log("  przeciwnik      TTK   " + ["lekki CON0", "lekki CON10", "ciężki CON0", "ciężki CON10"].map((s) => pad(s, 13)).join(""));
for (const w of WROGOWIE) {
  const ttk = w.hp / DPS;
  const budzet = (con) => P.pulaBazowa + con * P.staminaNaCON + ttk * P.regenGoniony;
  const kol = [
    ["lekki", 0], ["lekki", 10], ["ciężki", 0], ["ciężki", 10],
  ].map(([kl, con]) => pad(Math.floor(budzet(con) / (P.kosztUniku * KLASA_MNOZ[kl])), 13));
  console.log("  " + padr(w.nazwa, 15) + pad(f1(ttk) + "s", 6) + " " + kol.join(""));
}

console.log("\n  Ile uników POTRZEBA (telegrafy przeciwnika w czasie TTK):");
const TELE = [
  { nazwa: "Dzik", ttk: BOAR.hp / DPS, okresMs: BOAR.charge.cooldownMs ?? 3000 },
  { nazwa: "Szary (elita)", ttk: GREY_WOLF.hp / DPS, okresMs: GREY_WOLF.duel.cooldownMs },
];
for (const t of TELE) {
  console.log(`  ${padr(t.nazwa, 15)} TTK ${f1(t.ttk)}s / telegraf co ${t.okresMs}ms → ${Math.ceil((t.ttk * 1000) / t.okresMs)} telegrafów`);
}

// ── 3. Czy odejście się opłaca ─────────────────────────────────────────────
console.log("\n== 3. Czy odejście od walki opłaca się dla staminy ==");
const sekNaUnik = P.kosztUniku / P.regenGoniony;
console.log(`  Ścigany (${P.regenGoniony}/s): jeden unik (${P.kosztUniku}) kosztuje ${f1(sekNaUnik)} s biegania.`);
console.log(`  W tym czasie przy ${DPS} DPS zadałbyś ${Math.round(sekNaUnik * DPS)} obrażeń — czyli zabił:`);
for (const w of WROGOWIE) {
  const ile = (sekNaUnik * DPS) / w.hp;
  console.log(`     ${padr(w.nazwa, 15)} ×${f1(ile)}`);
}
console.log("\n  ⚠ LUKA DO SPRAWDZENIA — zerwanie pościgu daje regen 15/s:");
console.log("  wróg            pościg   deAggro   px do zerwania   czas ucieczki   zysk staminy");
const UCIECZKA = [
  { n: "Królik", v: RABBIT.chaseSpeed, d: RABBIT.deAggroRange },
  { n: "Wilk", v: WOLF.chaseSpeed, d: WOLF.deAggroRange },
  { n: "Szary", v: GREY_WOLF.chaseSpeed, d: GREY_WOLF.deAggroRange },
  { n: "Dzik", v: BOAR.chaseSpeed, d: BOAR.deAggroRange },
  { n: "Sieciarz", v: SPIDER?.chaseSpeed ?? 62, d: SPIDER?.deAggroRange ?? 380 },
];
for (const u of UCIECZKA) {
  const wzgl = PLAYER.speed - u.v;
  const dyst = u.d - 60; // zakładamy start ~60 px od wroga (zasięg broni)
  const czas = dyst / wzgl;
  console.log(
    `  ${padr(u.n, 15)} ${pad(u.v, 6)} ${pad(u.d, 9)} ${pad(dyst, 16)} ${pad(f1(czas) + "s", 15)} ${pad(Math.round(czas * P.regenGoniony) + " (potem 15/s)", 14)}`,
  );
}

// ── 4. Dostępność umiejętności ─────────────────────────────────────────────
console.log("\n== 4. Dostępność umiejętności: DZIŚ vs PROPOZYCJA (60 s walki ciągłej) ==");
console.log("   DZIŚ = tylko cooldown. PROPOZYCJA = krótszy cooldown ORAZ koszt staminy.");
console.log("   Stamina w 60 s walki: pula + 60×4 = budżet na wszystko RAZEM.\n");
for (const con of [0, 10]) {
  const budzet = P.pulaBazowa + con * P.staminaNaCON + 60 * P.regenGoniony;
  console.log(`  CON ${con} — budżet ${budzet} staminy na 60 s`);
  console.log("    umiejętność        CD dziś  użyć/60s   CD nowy  koszt  limit z CD  limit ze staminy  REALNIE");
  for (const [id, koszt] of Object.entries(P.koszty)) {
    const cdStary = ABILITIES[id].cooldown;
    const cdNowy = P.cooldownySkrocone[id];
    const zCd = Math.floor(60 / cdNowy);
    const zeStaminy = Math.floor(budzet / koszt);
    console.log(
      "    " + padr(ABILITIES[id].name, 18) +
      pad(cdStary + "s", 8) + pad(Math.floor(60 / cdStary), 10) +
      pad(cdNowy + "s", 10) + pad(koszt, 7) + pad(zCd, 12) + pad(zeStaminy, 18) +
      pad(Math.min(zCd, zeStaminy), 9),
    );
  }
  console.log("");
}

console.log("(przymiar — nic nie zapisano)");

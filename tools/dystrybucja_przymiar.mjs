/**
 * Dystrybucja ekwipunku — SKĄD gracz bierze każdą sztukę z `slot` (`OI-106`).
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * `katalog_ekwipunku.mjs` mówi, co ISTNIEJE, nie co jest OSIĄGALNE. Pałka
 * i Krótki miecz były nieosiągalne od commita „Combat V1" i katalog nie wykrył
 * tego ani razu (`docs/odlozone.md` §1), a `tsc` też nie — składniowo wszystko
 * gra. Ten przymiar zbiera wszystkie drogi zdobycia z DANYCH:
 *
 *   sklep    — `NPCS[*].stock`
 *   zadanie  — `QUESTS[*].grant`, `.reward.item`, `.stages[*].onComplete.grant`
 *   łup      — `LOOT.equipmentDrops` (dlatego łup ekwipunku jest danymi)
 *   start    — `INVENTORY.startingItems` / `.startingWorn`
 *
 * ⚠ Znane luki stoją w `ZNANE_BEZ_ZRODLA` — to jest lista `OI-106`, nie
 * zgoda na nie. BŁĄD dostaje sztuka bez źródła SPOZA tej listy (nowy przedmiot,
 * którego nikt nie wpiął), UWAGA — sztuka z listy, która źródło już ma (do
 * skreślenia). Bramka ma samokontrolę: `--sabotaz` wypina sztukę ze sklepu
 * i sprawdza, że raport świeci na czerwono.
 *
 * Użycie:
 *   node tools/dystrybucja_przymiar.mjs            # raport, nic nie zapisuje
 *   node tools/dystrybucja_przymiar.mjs --zapisz   # tabela do docs/dystrybucja_ekwipunku.md
 *   node tools/dystrybucja_przymiar.mjs --sabotaz  # samokontrola bramki
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

process.stdout.reconfigure?.({ encoding: "utf-8" });

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(KORZEN, "docs", "dystrybucja_ekwipunku.md");
const ZAPISZ = process.argv.includes("--zapisz");
const SABOTAZ = process.argv.includes("--sabotaz");
/** Sztuka wypinana ze sklepu w samokontroli — musi mieć sklep za JEDYNE źródło. */
const SABOTAZ_ID = "gambeson";

/**
 * Sztuki świadomie BEZ drogi zdobycia (np. przedmiot na zapas). Od 2026-10-11
 * pusta — `OI-106` zamknięte rozdaniem po sklepach. Dopisanie tu czegoś jest
 * decyzją, nie sposobem na zgaszenie bramki.
 */
const ZNANE_BEZ_ZRODLA = new Set([]);

const tmp = join(KORZEN, "node_modules", ".dystrybucja-przymiar.mjs");
await build({
  stdin: {
    contents:
      'export { NPCS } from "./src/core/Npcs.ts";\n' +
      'export { QUESTS, ITEMS, LOOT, INVENTORY } from "./src/config/GameConfig.ts";\n',
    resolveDir: KORZEN,
    loader: "ts",
  },
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const { NPCS, QUESTS, ITEMS, LOOT, INVENTORY } = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

/** id przedmiotu → lista źródeł (tekst do tabeli). */
const zrodla = new Map();
const dodaj = (id, opis) => {
  if (!zrodla.has(id)) zrodla.set(id, []);
  zrodla.get(id).push(opis);
};

for (const [npcId, npc] of Object.entries(NPCS)) {
  for (const it of npc.stock ?? []) {
    if (SABOTAZ && it === SABOTAZ_ID) continue;
    dodaj(it, `sklep: ${npc.name ?? npcId}`);
  }
}
for (const [qId, q] of Object.entries(QUESTS)) {
  for (const g of q.grant ?? []) dodaj(g.itemId, `zadanie: ${q.name} (na start)`);
  if (q.reward?.item) dodaj(q.reward.item.itemId, `zadanie: ${q.name}`);
  for (const s of q.stages ?? []) for (const g of s.onComplete?.grant ?? []) dodaj(g.itemId, `zadanie: ${q.name} (etap)`);
  void qId;
}
for (const [wrog, wpisy] of Object.entries(LOOT.equipmentDrops ?? {})) {
  for (const w of wpisy) for (const it of w.items) {
    const szansa = Math.round((w.chance / w.items.length) * 100);
    dodaj(it, `łup: ${wrog} ${szansa}%`);
  }
}
for (const it of INVENTORY.startingItems ?? []) dodaj(it, "start");
for (const { itemId } of INVENTORY.startingWorn ?? []) dodaj(itemId, "start (na sobie)");

const bledy = [];
const uwagi = [];
// Broń nie ma `slot` (zakłada się ją po `type`), pierścienie i amulet też
// idą po `type` — stąd suma obu warunków, nie samo `slot`.
const TYPY_ZAKLADANE = new Set(["weapon", "armor", "ring", "amulet"]);
const slotOf = (i) => i.slot ?? (i.type === "weapon" ? "weapon" : i.type);
const ekwipunek = Object.values(ITEMS).filter((i) => i.slot || TYPY_ZAKLADANE.has(i.type))
  .map((i) => ({ ...i, slot: slotOf(i) }));
for (const [id] of zrodla) if (!ITEMS[id]) bledy.push(`BŁĄD: źródło wskazuje nieistniejący przedmiot „${id}"`);

const bez = ekwipunek.filter((i) => !zrodla.has(i.id));
for (const i of bez) {
  if (!ZNANE_BEZ_ZRODLA.has(i.id)) bledy.push(`BŁĄD: ${i.id} („${i.name}", ${i.slot}) — żadnej drogi zdobycia`);
}
// ⭐ Reguła ETAPU TESTÓW (decyzja autora 2026-10-11): każda broń i każdy
// pancerz stoi na jakiejś półce — „łatwiej testować wizualnie przedmioty na tym
// etapie". Biżuteria poza regułą (kieł Szarego to trofeum). Przed wydaniem
// reguła do przeglądu (`docs/odlozone.md` §1), stąd osobny przełącznik.
const ETAP_TESTOW_WSZYSTKO_W_SKLEPIE = true;
const SLOTY_BIZUTERII = new Set(["ring", "amulet"]);
/** Sztuki OSOBISTE — rzecz konkretnego człowieka, nie rodzaj towaru. */
const POZA_SKLEPEM = new Map([
  ["worn_wraps", "owijki Patryczka — dostaje się je od niego w zadaniu „Kij w garści”"],
]);
const bezSklepu = ekwipunek.filter((i) => !SLOTY_BIZUTERII.has(i.slot) && !POZA_SKLEPEM.has(i.id)
  && !(zrodla.get(i.id) ?? []).some((z) => z.startsWith("sklep:")));
if (ETAP_TESTOW_WSZYSTKO_W_SKLEPIE) {
  for (const i of bezSklepu) bledy.push(`BŁĄD: ${i.id} („${i.name}", ${i.slot}) — nie stoi w żadnym sklepie (reguła etapu testów)`);
}
for (const id of ZNANE_BEZ_ZRODLA) {
  if (!ITEMS[id]) uwagi.push(`UWAGA: ${id} na liście znanych luk, a przedmiotu nie ma`);
  else if (zrodla.has(id)) uwagi.push(`UWAGA: ${id} ma już źródło (${zrodla.get(id).join("; ")}) — skreśl z ZNANE_BEZ_ZRODLA`);
}

// ── Tabela do dokumentu ─────────────────────────────────────────────────────

const SLOTY = ["weapon", "offhand", "head", "chest", "shoulders", "gloves", "legs", "boots", "ring", "amulet", "belt"];
const rzad = (s) => { const k = SLOTY.indexOf(s); return k < 0 ? 99 : k; };
const posort = [...ekwipunek].sort((a, b) => rzad(a.slot) - rzad(b.slot) || a.name.localeCompare(b.name, "pl"));
const L = [];
L.push(`Sztuk ekwipunku: **${ekwipunek.length}** · ze źródłem: **${ekwipunek.length - bez.length}** · **bez żadnej drogi zdobycia: ${bez.length}**`);
L.push("");
L.push("| slot | przedmiot | id | skąd |");
L.push("|---|---|---|---|");
for (const i of posort) {
  const z = zrodla.get(i.id);
  L.push(`| ${i.slot} | ${i.name} | \`${i.id}\` | ${z ? [...new Set(z)].join(" · ") : "⛔ **BRAK**"} |`);
}
const blok = L.join("\n");

console.log(`ekwipunek: ${ekwipunek.length} · ze źródłem ${ekwipunek.length - bez.length} · bez źródła ${bez.length} (znane: ${[...ZNANE_BEZ_ZRODLA].length})`);
if (process.argv.includes("--lista")) {
  for (const i of bez) console.log(`  bez źródła  ${i.slot.padEnd(10)} ${i.id.padEnd(24)} ${i.name}`);
  for (const i of bezSklepu) console.log(`  bez sklepu  ${i.slot.padEnd(10)} ${String(i.armorType ?? i.family ?? "").padEnd(8)} ${String(i.material ?? "").padEnd(6)} ${i.id.padEnd(24)} ${i.name} · ${i.buyPrice ?? "-"} zł · ${(zrodla.get(i.id) ?? []).join("; ")}`);
}
for (const u of uwagi) console.log(u);
for (const b of bledy) console.log(b);

if (ZAPISZ && !SABOTAZ) {
  const doc = readFileSync(DOC, "utf8");
  const eol = doc.includes("\r\n") ? "\r\n" : "\n";
  const re = /(<!-- AUTO:start:dystrybucja -->)([\s\S]*?)(<!-- AUTO:end:dystrybucja -->)/;
  if (!re.test(doc)) { console.log("BŁĄD: brak znacznika AUTO:dystrybucja w dokumencie"); process.exit(1); }
  const nowy = doc.replace(re, (_, a, _b, c) => `${a}${eol}${blok.replace(/\n/g, eol)}${eol}${c}`);
  if (nowy !== doc) { writeFileSync(DOC, nowy); console.log(`zapisano ${DOC}`); }
  else console.log("dokument aktualny — nic do zapisania");
} else if (!SABOTAZ) {
  console.log("przymiar — nic nie zapisano (--zapisz)");
}

if (SABOTAZ) {
  // Samokontrola: wypięta ze sklepu sztuka bez innego źródła MUSI dać BŁĄD.
  const ok = bledy.some((b) => b.includes(SABOTAZ_ID));
  console.log(ok ? `SAMOKONTROLA OK — wypięcie ${SABOTAZ_ID} ze sklepu świeci na czerwono`
                 : `SAMOKONTROLA ZAWIODŁA — wypięcie ${SABOTAZ_ID} przeszło bez błędu`);
  process.exit(ok ? 0 : 1);
}
process.exit(bledy.length ? 1 : 0);

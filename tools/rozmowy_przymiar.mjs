/**
 * Przymiar spójności ODWOŁAŃ w rozmowach i zadaniach (`OI-65`, 2026-10-11).
 *
 * ⚠ **Awaria, której pilnuje, jest CICHA.** Literówka w bramce tematu
 * (`after`, `requiresQuest`, `requiresHerb`) ukrywa ten temat NA ZAWSZE —
 * ani kompilator (pola są stringami), ani gra (temat po prostu się nie
 * pokazuje) niczego nie zapalą. Tak samo cel zadania wskazujący nieistniejący
 * przedmiot albo wroga: zadanie nie da się ukończyć, bez komunikatu.
 *
 * Czyta PRAWDZIWE dane przez esbuild (`NPCS` z `core/Npcs.ts`, reszta
 * z `GameConfig.ts`) — żadnej kopii list. Jedyny wyjątek: lista gatunków
 * wrogów pochodzi z unii `EnemyType` w `src/entities/Enemy.ts`, czytanej
 * z TEKSTU źródła (moduł ciągnie Phasera), więc też nie jest kopią.
 *
 * Sprawdza:
 *   R1  id tematów unikalne w CAŁYM świecie (zbiór zadanych pytań jest globalny)
 *   R2  `after` wskazuje istniejące tematy
 *   R3  `requiresQuest` tematu wskazuje istniejące zadanie
 *   R4  `requiresHerb` wskazuje istniejący gatunek zioła
 *   R5  każdy temat OSIĄGALNY (punkt stały po bramkach)
 *   R6  `group` tematu wskazuje istniejącą grupę w `TOPIC_GROUPS` (literówka
 *       schowałaby temat w grupie, której wiersz nigdy się nie narysuje)
 *   R7  grupa ma u danego NPC co najmniej DWA tematy (grupa jednego tematu
 *       to jedno tapnięcie więcej za nic — D14)
 *   R8  `offersQuest` tematu wskazuje istniejące zadanie TEGO rozmówcy,
 *       a zadanie ma `requiresTopic` = ten temat (gałąź tematu, 2026-10-14)
 *   Z9  `requiresTopic` zadania wskazuje temat u DAWCY, który to zadanie
 *       proponuje (`offersQuest`) — inaczej oferta nie miałaby skąd wyrosnąć
 *   Z1  dawca zadania istnieje w `NPCS`
 *   Z2  cele: przedmiot / wróg / rozmówca istnieją
 *   Z3  nagrody i wręczenia wskazują istniejące przedmioty
 *   Z4  id etapów unikalne w obrębie zadania
 *   Z5  `requiresQuest` zadania istnieje; każde zadanie osiągalne
 *   Z6  dawca zadania ma `greetings` (`src/ui/CLAUDE.md`: inaczej pusty dymek)
 *   Z8  cel „porozmawiaj" z `topic` wskazuje temat, który ten NPC naprawdę ma
 *   Z7  cel `reach` wskazuje punkt `miejsce` (właściwość `id`) istniejący na
 *       którejś mapie `public/assets/maps/*.tmj` — inaczej zadanie stoi na zawsze
 *   N1  towar sklepów i trenerzy umiejętności istnieją
 *
 * Kod wyjścia ≠ 0 przy jakimkolwiek BŁĘDZIE.
 *
 *   node tools/rozmowy_przymiar.mjs
 */

import { build } from "esbuild";
import { readFileSync, readdirSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(KORZEN, "node_modules", ".rozmowy-przymiar.mjs");

await build({
  stdin: {
    contents:
      'export { NPCS } from "./src/core/Npcs.ts";\n' +
      'export { QUESTS, ITEMS, HERBS, SKILLS, TOPIC_GROUPS } from "./src/config/GameConfig.ts";\n',
    resolveDir: KORZEN,
    loader: "ts",
  },
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const { NPCS, QUESTS, ITEMS, HERBS, SKILLS, TOPIC_GROUPS } = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

// Gatunki wrogów z unii `EnemyType` (źródło, nie kopia).
const enemySrc = readFileSync(join(KORZEN, "src", "entities", "Enemy.ts"), "utf8");
const unia = enemySrc.match(/export type EnemyType\s*=([\s\S]*?);/);
const WROGOWIE = new Set(unia ? [...unia[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]) : []);

const bledy = [];
const uwagi = [];
const blad = (s) => bledy.push(`BŁĄD: ${s}`);

const npcs = Object.values(NPCS);
const npcIds = new Set(Object.keys(NPCS));
const questIds = new Set(Object.keys(QUESTS));
const itemIds = new Set(Object.keys(ITEMS));
const herbIds = new Set(Object.keys(HERBS));

// ── Tematy ───────────────────────────────────────────────────────────────
const tematy = new Map(); // id → { npc, t }
for (const npc of npcs) {
  for (const t of npc.topics ?? []) {
    if (tematy.has(t.id)) blad(`R1 temat „${t.id}" występuje u ${tematy.get(t.id).npc} i u ${npc.id} — zbiór zadanych pytań jest GLOBALNY`);
    else tematy.set(t.id, { npc: npc.id, t });
  }
}
for (const [id, { npc, t }] of tematy) {
  for (const a of t.after ?? []) if (!tematy.has(a)) blad(`R2 temat „${id}" (${npc}) czeka na nieistniejący temat „${a}"`);
  if (t.requiresQuest && !questIds.has(t.requiresQuest)) blad(`R3 temat „${id}" (${npc}) czeka na nieistniejące zadanie „${t.requiresQuest}"`);
  if (t.requiresHerb && !herbIds.has(t.requiresHerb)) blad(`R4 temat „${id}" (${npc}) czeka na nieistniejący gatunek „${t.requiresHerb}"`);
  if (t.group !== undefined && !(t.group in TOPIC_GROUPS)) blad(`R6 temat „${id}" (${npc}) należy do nieistniejącej grupy „${t.group}" — wiersz grupy nigdy się nie narysuje`);
}
// R8 — gałąź tematu: temat proponuje zadanie swojego rozmówcy, a zadanie
// wskazuje ten temat z powrotem (para musi się zgadzać z obu stron).
for (const [id, { npc, t }] of tematy) {
  if (t.offersQuest === undefined) continue;
  const q = QUESTS[t.offersQuest];
  if (!q) blad(`R8 temat „${id}" (${npc}) proponuje nieistniejące zadanie „${t.offersQuest}"`);
  else if (q.giver !== npc) blad(`R8 temat „${id}" (${npc}) proponuje zadanie „${t.offersQuest}", którego dawcą jest „${q.giver}"`);
  else if (q.requiresTopic !== id) blad(`R8 temat „${id}" proponuje „${t.offersQuest}", ale to zadanie czeka na „${q.requiresTopic ?? "(nic)"}" — gałąź bez bramki pozwala wziąć je z pominięciem rozmowy`);
}
// R7 — grupa ma sens od dwóch tematów u tego samego rozmówcy.
for (const npc of npcs) {
  const ile = new Map();
  for (const t of npc.topics ?? []) if (t.group !== undefined) ile.set(t.group, (ile.get(t.group) ?? 0) + 1);
  for (const [g, n] of ile) if (n < 2) blad(`R7 ${npc.id}: grupa „${g}" ma ${n} temat — grupa jednego tematu to tapnięcie więcej za nic`);
}

// Punkty `miejsce` z map (cele `reach`) — czytane z żywych `.tmj`, nie z kopii.
const MIEJSCA = new Set();
const katalogMap = join(KORZEN, "public", "assets", "maps");
for (const plik of readdirSync(katalogMap).filter((f) => f.endsWith(".tmj"))) {
  const mapa = JSON.parse(readFileSync(join(katalogMap, plik), "utf8"));
  for (const l of mapa.layers ?? []) {
    for (const o of l.objects ?? []) {
      const n = (o.name ?? "").toLowerCase();
      if (n !== "miejsce" && n !== "quest_spot") continue;
      const idMiejsca = (o.properties ?? []).find((p) => p.name === "id")?.value;
      if (idMiejsca) MIEJSCA.add(String(idMiejsca));
    }
  }
}

// ── Zadania ──────────────────────────────────────────────────────────────
const etapy = (q) => q.stages ?? [{ id: "__legacy", objectives: q.objectives ?? [] }];
const przedmiotyZ = (lista) => (lista ?? []).map((g) => g.itemId);
for (const [id, q] of Object.entries(QUESTS)) {
  if (!npcIds.has(q.giver)) blad(`Z1 zadanie „${id}": dawca „${q.giver}" nie istnieje w NPCS`);
  else if (!NPCS[q.giver].greetings) blad(`Z6 zadanie „${id}": dawca „${q.giver}" nie ma \`greetings\` — dymek byłby pusty`);
  if (q.requiresQuest && !questIds.has(q.requiresQuest)) blad(`Z5 zadanie „${id}" czeka na nieistniejące zadanie „${q.requiresQuest}"`);
  if (q.requiresTopic !== undefined) {
    const tt = tematy.get(q.requiresTopic);
    if (!tt) blad(`Z9 zadanie „${id}" czeka na nieistniejący temat „${q.requiresTopic}" — nie da się go wziąć NIGDY`);
    else if (tt.npc !== q.giver) blad(`Z9 zadanie „${id}" czeka na temat „${q.requiresTopic}" u „${tt.npc}", a dawcą jest „${q.giver}"`);
    else if (tt.t.offersQuest !== id) blad(`Z9 zadanie „${id}" czeka na temat „${q.requiresTopic}", który go nie proponuje (\`offersQuest\`) — po rozmowie nie byłoby oferty`);
  }
  const widziane = new Set();
  for (const e of etapy(q)) {
    if (widziane.has(e.id)) blad(`Z4 zadanie „${id}": etap „${e.id}" powtórzony`);
    widziane.add(e.id);
    for (const o of e.objectives ?? []) {
      if ((o.kind === "collect" || o.kind === "equip") && !itemIds.has(o.itemId)) blad(`Z2 zadanie „${id}"/${e.id}: przedmiot „${o.itemId}" nie istnieje`);
      if ((o.kind === "kill" || o.kind === "hit") && !WROGOWIE.has(o.enemy)) blad(`Z2 zadanie „${id}"/${e.id}: wróg „${o.enemy}" nie jest gatunkiem z EnemyType`);
      if (o.kind === "talk" && !npcIds.has(o.npc)) blad(`Z2 zadanie „${id}"/${e.id}: rozmówca „${o.npc}" nie istnieje`);
      if (o.kind === "talk" && o.topic && npcIds.has(o.npc) && !(NPCS[o.npc].topics ?? []).some((tt) => tt.id === o.topic))
        blad(`Z8 zadanie „${id}"/${e.id}: „${o.npc}" nie ma tematu „${o.topic}" — cel „porozmawiaj" byłby nie do zaliczenia`);
      if (o.kind === "reach") {
        if (o.itemId && !itemIds.has(o.itemId)) blad(`Z2 zadanie „${id}"/${e.id}: przedmiot „${o.itemId}" nie istnieje`);
        if (!MIEJSCA.has(o.spot)) blad(`Z7 zadanie „${id}"/${e.id}: miejsce „${o.spot}" nie stoi na żadnej mapie (obiekt \`miejsce\` z właściwością \`id\`)`);
      }
    }
    for (const it of przedmiotyZ(e.onComplete?.grant)) if (!itemIds.has(it)) blad(`Z3 zadanie „${id}"/${e.id}: wręczenie „${it}" nie istnieje`);
  }
  for (const it of przedmiotyZ(q.grant)) if (!itemIds.has(it)) blad(`Z3 zadanie „${id}": wręczenie „${it}" nie istnieje`);
  const nagroda = q.reward?.item?.itemId;
  if (nagroda && !itemIds.has(nagroda)) blad(`Z3 zadanie „${id}": nagroda „${nagroda}" nie istnieje`);
}

// ── Osiągalność (punkt stały) ────────────────────────────────────────────
// Zadanie osiągalne, gdy dawca istnieje i jego `requiresQuest` (jeśli jest)
// osiągalne. Temat — gdy wszystkie `after` i `requiresQuest` osiągalne.
// Zioło zakładamy osiągalne, gdy gatunek istnieje (rozstaw na mapie to inna domena).
const zadOk = new Set();
const temOk = new Set();
for (let zmiana = true; zmiana;) {
  zmiana = false;
  for (const [id, q] of Object.entries(QUESTS)) {
    if (zadOk.has(id) || !npcIds.has(q.giver)) continue;
    if (q.requiresQuest && !zadOk.has(q.requiresQuest)) continue;
    if (q.requiresTopic && !temOk.has(q.requiresTopic)) continue;
    zadOk.add(id); zmiana = true;
  }
  for (const [id, { t }] of tematy) {
    if (temOk.has(id)) continue;
    if ((t.after ?? []).some((a) => !temOk.has(a))) continue;
    if (t.requiresQuest && !zadOk.has(t.requiresQuest)) continue;
    if (t.requiresHerb && !herbIds.has(t.requiresHerb)) continue;
    temOk.add(id); zmiana = true;
  }
}
for (const id of questIds) if (!zadOk.has(id)) blad(`Z5 zadanie „${id}" jest NIEOSIĄGALNE`);
for (const [id, { npc }] of tematy) if (!temOk.has(id)) blad(`R5 temat „${id}" (${npc}) jest NIEOSIĄGALNY`);

// ── Sklepy i trenerzy ────────────────────────────────────────────────────
for (const npc of npcs) for (const it of npc.stock ?? []) if (!itemIds.has(it)) blad(`N1 ${npc.id} sprzedaje nieistniejący przedmiot „${it}"`);
for (const [id, s] of Object.entries(SKILLS)) if (s.trainer && !npcIds.has(s.trainer)) blad(`N1 umiejętność „${id}": trener „${s.trainer}" nie istnieje`);

if (WROGOWIE.size === 0) blad("nie odczytano unii EnemyType z src/entities/Enemy.ts — przymiar ślepy na cele `kill`");

console.log(`NPC ${npcs.length} · tematy ${tematy.size} (osiągalne ${temOk.size}) · zadania ${questIds.size} (osiągalne ${zadOk.size}) · gatunki wrogów ${WROGOWIE.size}`);
for (const u of uwagi) console.log("  " + u);
if (bledy.length) {
  console.error(`\n${bledy.length} BŁĘDÓW:`);
  for (const b of bledy) console.error("  " + b);
  process.exit(1);
}
console.log("OK — wszystkie odwołania trafiają, wszystko osiągalne.");

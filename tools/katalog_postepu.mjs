/**
 * Katalog postępu i ekonomii — generator tabel do `docs/postep_katalog.md`
 * (`OI-45`, 2026-10-11).
 *
 * `docs/systemy/progression.md` odnotował, że każde pytanie „ile trzeba, żeby…"
 * wymagało liczenia od zera. Ten plik daje liczby, na których stoi otwarta
 * decyzja o krzywej XP (`OI-43`) — sam niczego nie rozstrzyga.
 *
 * Źródła (esbuild, prawdziwe wartości):
 *   krzywa         — `PROGRESSION` (wzór jak `Progression.xpToNext`: ten sam
 *                    jeden wiersz, ⚠ zmieniając wzór tam, zmień go tutaj)
 *   roster         — `ENEMY_SPECIES` z `src/entities/EnemyRegistry.ts` (tekst źródła)
 *   pula map       — obiekty o nazwie gatunku w warstwach obiektów `.tmj`
 *                    ⚠ liczy tylko nazwy równe id gatunku; aliasy (polskie
 *                    nazwy) raportuje jako nierozpoznane, nie zgaduje
 *   nagrody        — `QUESTS[*].reward`
 *   ujścia złota   — `SKILLS` (nauka) i `PROFICIENCY.mastery.cost` (rangi)
 *
 *   node tools/katalog_postepu.mjs            # przymiar — tylko raport
 *   node tools/katalog_postepu.mjs --zapisz   # wstawia tabele do docs/
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(KORZEN, "docs", "postep_katalog.md");
const ZAPISZ = process.argv.includes("--zapisz");
const tmp = join(KORZEN, "node_modules", ".katalog-postepu.mjs");

await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

const fmt = (v, d = 0) => (v === undefined || v === null || !Number.isFinite(v) ? "—" : Number(v).toLocaleString("pl-PL", { maximumFractionDigits: d }));
const P = C.PROGRESSION;
const xpToNext = (L) => (L >= P.maxLevel ? Infinity : Math.round(P.baseXp * Math.pow(P.growth, L - 1)));

const regSrc = readFileSync(join(KORZEN, "src", "entities", "EnemyRegistry.ts"), "utf8");
const blok = regSrc.match(/ENEMY_SPECIES[^=]*=\s*\{([\s\S]*?)\n\};/);
const ROSTER = blok ? [...blok[1].matchAll(/^\s*([a-z_]+):\s*\{\s*cfg:\s*([A-Z_]+)/gm)].map((m) => ({ kind: m[1], c: C[m[2]] ?? {} })) : [];
const xpGatunku = Object.fromEntries(ROSTER.map((r) => [r.kind, r.c.xpReward ?? 0]));

// ── Tabela 1: krzywa ─────────────────────────────────────────────────────
const odblok = new Map();
for (const a of Object.values(C.ABILITIES)) {
  if (!odblok.has(a.unlockLevel)) odblok.set(a.unlockLevel, []);
  odblok.get(a.unlockLevel).push(a.name);
}
const wzor = xpGatunku.boar ? "boar" : ROSTER[0]?.kind;
let suma = 0;
const t1 = [
  `| poziom | XP do następnego | XP łącznie do osiągnięcia | ≈ ${wzor} (${xpGatunku[wzor]} XP) łącznie | odblokowuje |`,
  "|---:|---:|---:|---:|---|",
];
for (let L = 1; L <= P.maxLevel; L++) {
  t1.push(`| ${L} | ${fmt(xpToNext(L))} | ${fmt(suma)} | ${fmt(suma / xpGatunku[wzor])} | ${(odblok.get(L) ?? []).join(", ") || ""} |`);
  suma += Number.isFinite(xpToNext(L)) ? xpToNext(L) : 0;
}

// ── Tabela 2: pula XP z map (jedno wyczyszczenie) ────────────────────────
const MAPY = [["forrest.tmj", "las"], ["village-zagaje.tmj", "wieś"], ["thicket-gestwina.tmj", "Gęstwina"]];
const t2 = ["| mapa | gatunek | sztuk | XP | ", "|---|---|---:|---:|"];
let pulaRazem = 0;
for (const [plik, etykieta] of MAPY) {
  let tmj;
  try { tmj = JSON.parse(readFileSync(join(KORZEN, "public", "assets", "maps", plik), "utf8")); } catch { continue; }
  const licz = {};
  for (const l of tmj.layers) {
    if (l.type !== "objectgroup") continue;
    for (const o of l.objects ?? []) {
      if (!o.name) continue;
      if (o.name in xpGatunku) licz[o.name] = (licz[o.name] ?? 0) + 1;
    }
  }
  let pula = 0;
  for (const [k, n] of Object.entries(licz)) {
    const xp = n * xpGatunku[k];
    pula += xp;
    t2.push(`| ${etykieta} | ${k} | ${n} | ${fmt(xp)} |`);
  }
  t2.push(`| **${etykieta} — razem** | | | **${fmt(pula)}** |`);
  pulaRazem += pula;
}
t2.push(`| **wszystkie mapy** | | | **${fmt(pulaRazem)}** |`);
let poziomPuli = 1;
for (let acc = 0; poziomPuli < P.maxLevel && acc + xpToNext(poziomPuli) <= pulaRazem; poziomPuli++) acc += xpToNext(poziomPuli);
t2.push("", `Jedno wyczyszczenie wszystkich map (bez zadań, bez odrodzeń) = **poziom ${poziomPuli}**.`);

// ── Tabela 3: nagrody zadań ──────────────────────────────────────────────
let qXp = 0;
let qGold = 0;
const t3 = ["| zadanie | dawca | XP | złoto | przedmiot |", "|---|---|---:|---:|---|"];
for (const [id, q] of Object.entries(C.QUESTS)) {
  const r = q.reward ?? {};
  qXp += r.xp ?? 0;
  qGold += r.gold ?? 0;
  t3.push(`| ${q.name ?? id} | ${q.giver} | ${fmt(r.xp)} | ${fmt(r.gold)} | ${r.item ? `${r.item.itemId}${r.item.count > 1 ? ` ×${r.item.count}` : ""}` : "—"} |`);
}
t3.push(`| **razem** | | **${fmt(qXp)}** | **${fmt(qGold)}** | |`);

// ── Tabela 4: ujścia złota i punktów ─────────────────────────────────────
const skills = Object.values(C.SKILLS);
const skGold = skills.reduce((s, x) => s + (x.goldCost ?? 0), 0);
const skPts = skills.reduce((s, x) => s + (x.skillPointCost ?? 0), 0);
const mc = C.PROFICIENCY?.mastery?.cost ?? [];
const mGold = mc.reduce((s, x) => s + x.gold, 0);
const mPts = mc.reduce((s, x) => s + x.points, 0);
const t4 = [
  "| ujście | złoto | punkty rozwoju |",
  "|---|---:|---:|",
  `| nauka wszystkich umiejętności u trenerów (${skills.length} pozycji \`SKILLS\`) | ${fmt(skGold)} | ${fmt(skPts)} |`,
  ...mc.map((x, i) => `| ranga Mastery ${["I", "II", "III", "IV"][i] ?? i + 1} (jedna rodzina broni) | ${fmt(x.gold)} | ${fmt(x.points)} |`),
  `| wszystkie rangi jednej rodziny | ${fmt(mGold)} | ${fmt(mPts)} |`,
  `| punkty rozwoju dostępne do poziomu ${P.maxLevel} | — | ${fmt((P.maxLevel - 1) * P.skillPointsPerLevel)} |`,
].join("\n");

const bloki = { krzywa: t1.join("\n"), pula: t2.join("\n"), zadania: t3.join("\n"), ujscia: t4 };
let doc = readFileSync(DOC, "utf8");
let zmian = 0;
for (const [klucz, tresc] of Object.entries(bloki)) {
  const re = new RegExp(`(<!-- AUTO:start:${klucz} -->)([\\s\\S]*?)(<!-- AUTO:end:${klucz} -->)`);
  if (!re.test(doc)) {
    console.error(`BŁĄD: w ${DOC} brak znaczników bloku „${klucz}"`);
    process.exit(1);
  }
  const nowy = doc.replace(re, `$1\n${tresc}\n$3`);
  if (nowy !== doc) zmian++;
  doc = nowy;
}
console.log(`krzywa 1–${P.maxLevel}: łącznie ${fmt(suma)} XP · pula map ${fmt(pulaRazem)} XP (poziom ${poziomPuli}) · zadania ${fmt(qXp)} XP / ${fmt(qGold)} zł`);
if (ZAPISZ) {
  writeFileSync(DOC, doc);
  console.log(`zapisano ${DOC} (${zmian} bloków zmienionych)`);
} else {
  console.log(`PRZYMIAR — ${zmian} bloków do odświeżenia. Nic nie zapisano. Uruchom z --zapisz.`);
}

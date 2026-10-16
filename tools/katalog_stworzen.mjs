/**
 * Katalog stworzeń — generator tabel do `docs/stworzenia_katalog.md`
 * (`OI-47`, 2026-10-11).
 *
 * Po co: `docs/systemy/creatures.md` zapisał, że rachunek kanałów obrażeń
 * w komentarzu konfiguracji ROZJECHAŁ SIĘ z rosterem, a sufity nauki liczono
 * od zera. Ta sama reguła co `katalog_ekwipunku.mjs`: liczba przepisana ręką
 * zawsze się rozjeżdża, więc tabele są wyliczane z `GameConfig.ts` (esbuild,
 * prawdziwe wartości), a proza wokół nich jest ręczna.
 *
 * Skąd roster: mapa gatunek → konfig z `ENEMY_SPECIES` w
 * `src/entities/EnemyRegistry.ts`, czytana z TEKSTU (moduł ciągnie Phasera
 * przez klasy encji) — to źródło, nie kopia: nowy gatunek wpisany tam pojawia
 * się tutaj bez uczenia generatora.
 *
 * ⚠ Czego tabela NIE mówi: łup (`LOOT`) jest płaską tabelą, a przypisanie do
 * gatunku żyje w kodzie (`GameScene`) — odtworzenie go tutaj byłoby lustrem.
 * Kolumna „ataki z własnymi liczbami" znajduje każdy obiekt konfigu z
 * `damageMin`/`damageMax`; ataki liczone z obrażeń kontaktowych (kęs watahy,
 * kęs królika) siedzą w kolumnie „podstawowe".
 *
 *   node tools/katalog_stworzen.mjs            # przymiar — tylko raport
 *   node tools/katalog_stworzen.mjs --zapisz   # wstawia tabele do docs/
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(KORZEN, "docs", "stworzenia_katalog.md");
const ZAPISZ = process.argv.includes("--zapisz");
const tmp = join(KORZEN, "node_modules", ".katalog-stworzen.mjs");

await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

const regSrc = readFileSync(join(KORZEN, "src", "entities", "EnemyRegistry.ts"), "utf8");
const blok = regSrc.match(/ENEMY_SPECIES[^=]*=\s*\{([\s\S]*?)\n\};/);
const ROSTER = blok ? [...blok[1].matchAll(/^\s*([a-z_]+):\s*\{\s*cfg:\s*([A-Z_]+)/gm)].map((m) => ({ kind: m[1], cfgName: m[2] })) : [];
if (!ROSTER.length) {
  console.error("BŁĄD: nie odczytano ENEMY_SPECIES z src/entities/EnemyRegistry.ts");
  process.exit(1);
}

const fmt = (v, d = 0) => (v === undefined || v === null ? "—" : Number(v).toLocaleString("pl-PL", { maximumFractionDigits: d }));
const typ = (t) => (t ? String(t) : "bez typu");

/** Każdy pod-obiekt konfigu z `damageMin`/`damageMax` — atak z własnymi liczbami. */
function ataki(cfg) {
  const out = [];
  const widziane = new WeakSet();
  const przejdz = (v, adres) => {
    if (!v || typeof v !== "object" || widziane.has(v)) return;
    widziane.add(v);
    if (typeof v.damageMin === "number" && typeof v.damageMax === "number") {
      out.push({ adres, min: v.damageMin, max: v.damageMax, typ: typ(v.damageType) });
    }
    for (const [k, x] of Object.entries(v)) if (x && typeof x === "object" && !Array.isArray(x)) przejdz(x, adres ? `${adres}.${k}` : k);
  };
  for (const [k, x] of Object.entries(cfg)) if (x && typeof x === "object" && !Array.isArray(x)) przejdz(x, k);
  return out;
}

const wiersze = ROSTER.map(({ kind, cfgName }) => ({ kind, cfgName, c: C[cfgName] ?? {} }));

// ── Tabela 1: roster ─────────────────────────────────────────────────────
const t1 = [
  "| gatunek | konfig | HP | pancerz | P | XP | patrol / pościg px/s | agro / zerwanie px | odrodzenie s | obrażenia podstawowe | ataki z własnymi liczbami |",
  "|---|---|---:|---|---:|---:|---|---|---|---|---|",
  ...wiersze.map(({ kind, cfgName, c }) => {
    const pancerz = c.armor ? `${c.armor.type} ${fmt(c.armor.points)}` : "—";
    const odr = c.respawnDelay === undefined ? "—" : c.respawnDelay > 0 ? `${fmt(c.respawnDelay)} ± ${fmt(c.respawnJitter ?? 0)}` : "nie odradza się";
    const podst = c.touchDamageMax ? `${fmt(c.touchDamageMin)}–${fmt(c.touchDamageMax)} ${typ(c.touchDamageType)}` : "—";
    const at = ataki(c);
    const atTxt = at.map((a) => `${a.adres} ${fmt(a.min)}–${fmt(a.max)} ${a.typ}`);
    return `| ${kind} | \`${cfgName}\` | ${fmt(c.hp)} | ${pancerz} | ${fmt(c.proficiency)} | ${fmt(c.xpReward)} | ${fmt(c.patrolSpeed)} / ${fmt(c.chaseSpeed)} | ${fmt(c.aggroRange)} / ${fmt(c.deAggroRange)} | ${odr} | ${podst} | ${atTxt.length ? atTxt.join("<br>") : "—"} |`;
  }),
].join("\n");

// ── Tabela 2: siatka ról — biegłość wroga a sufity Mastery ───────────────
const progi = C.PROFICIENCY?.masteryThresholds ?? [];
const pasma = [];
let od = 0;
for (const p of progi) { pasma.push([od, p]); od = p; }
pasma.push([od, Infinity]);
const walczacy = wiersze.filter((w) => typeof w.c.proficiency === "number" && w.c.proficiency > 0);
const t2 = [
  "| pasmo `P` wroga | sufit Mastery | gatunki | liczba |",
  "|---|---|---|---:|",
  ...pasma.map(([a, b], i) => {
    const w = walczacy.filter((x) => x.c.proficiency >= a && x.c.proficiency < b);
    const sufit = i < progi.length ? `M-${["I", "II", "III", "IV"][i] ?? i + 1} (${progi[i]})` : "ponad M-IV";
    return `| ${a}–${b === Infinity ? "∞" : b - 1} | ${sufit} | ${w.length ? w.map((x) => `${x.kind} (${x.c.proficiency})`).join(", ") : "**PUSTE**"} | ${w.length} |`;
  }),
].join("\n");

// ── Tabela 3: kanały obrażeń trafiających w gracza (typy) ────────────────
const kanaly = new Map();
for (const { kind, c } of wiersze) {
  const typy = new Set();
  if (c.touchDamageMax) typy.add(typ(c.touchDamageType));
  for (const a of ataki(c)) typy.add(a.typ);
  for (const t of typy) {
    if (!kanaly.has(t)) kanaly.set(t, []);
    kanaly.get(t).push(kind);
  }
}
const t3 = [
  "| typ obrażeń | gatunki, które go zadają | liczba |",
  "|---|---|---:|",
  ...[...kanaly].sort((a, b) => b[1].length - a[1].length).map(([t, ks]) => `| ${t} | ${ks.join(", ")} | ${ks.length} |`),
].join("\n");

const bloki = { roster: t1, siatka: t2, kanaly: t3 };

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
console.log(`gatunków: ${wiersze.length} · walczących (P > 0): ${walczacy.length} · pustych pasm biegłości: ${pasma.filter(([a, b]) => !walczacy.some((x) => x.c.proficiency >= a && x.c.proficiency < b)).length}`);
if (ZAPISZ) {
  writeFileSync(DOC, doc);
  console.log(`zapisano ${DOC} (${zmian} bloków zmienionych)`);
} else {
  console.log(`PRZYMIAR — ${zmian} bloków do odświeżenia. Nic nie zapisano. Uruchom z --zapisz.`);
}

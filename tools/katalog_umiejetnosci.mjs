/**
 * Katalog umiejętności — generator tabel do `docs/umiejetnosci_katalog.md`
 * (`OI-38`, 2026-10-11).
 *
 * `docs/systemy/abilities.md` odnotował, że ta domena nie ma warstwy danych:
 * jedynym źródłem liczb był konfig, a reguły „liczby żyją w GENEROWANE" nie
 * dało się zastosować. Ten plik ją dokłada — tą samą metodą co
 * `katalog_ekwipunku.mjs` (esbuild, prawdziwe wartości, bloki `AUTO`).
 *
 * ⚠ **Siatka ról jest WYPROWADZONA z pól danych, nie z deklaracji** — w konfigu
 * nie ma pola „rola". Reguły (jedno miejsce, niżej w `role()`):
 *   obszar     — `maxTargets > 1` albo `radius`
 *   ruch       — `dashPx` albo `speedPxPerSec`
 *   kontrola   — `stunMs > 0`
 *   efekt      — `bleed`
 *   wzmocnienie— `damageBonus`
 *   pojedynczy cios — `damageMultiplier` bez żadnej z powyższych
 * Nowe pole mechaniki wymaga NAUCZENIA tej funkcji (`tools/CLAUDE.md`:
 * „nowa oś mechaniki wymaga nauczenia generatora").
 *
 *   node tools/katalog_umiejetnosci.mjs            # przymiar — tylko raport
 *   node tools/katalog_umiejetnosci.mjs --zapisz   # wstawia tabele do docs/
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC = join(KORZEN, "docs", "umiejetnosci_katalog.md");
const ZAPISZ = process.argv.includes("--zapisz");
const tmp = join(KORZEN, "node_modules", ".katalog-umiejetnosci.mjs");

await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
});
const C = await import(pathToFileURL(tmp).href);
try { unlinkSync(tmp); } catch { /* sprzątanie nieobowiązkowe */ }

const fmt = (v, d = 2) => (v === undefined || v === null ? "—" : Number(v).toLocaleString("pl-PL", { maximumFractionDigits: d }));
const AB = Object.entries(C.ABILITIES);
const naukaDla = new Map(Object.values(C.SKILLS).filter((s) => s.unlocksAbility).map((s) => [s.unlocksAbility, s]));

function role(a) {
  const r = [];
  if ((a.maxTargets ?? 1) > 1 || a.radius) r.push("obszar");
  if (a.dashPx || a.speedPxPerSec) r.push("ruch");
  if ((a.stunMs ?? 0) > 0) r.push("kontrola");
  if (a.bleed) r.push("efekt");
  if (a.damageBonus) r.push("wzmocnienie");
  if (!r.length && a.damageMultiplier) r.push("pojedynczy cios");
  return r;
}

function koszt(a) {
  if (typeof a.staminaCost === "number") return a.staminaCost;
  return null; // Unik płaci `STAMINA.costs.dodge` × obciążenie — patrz kolumna
}

// ── Tabela 1: parametry ──────────────────────────────────────────────────
const t1 = [
  "| umiejętność | id | poziom | cooldown s | stamina | stamina / s cd | mnożnik obrażeń | role | podgląd | wymóg |",
  "|---|---|---:|---:|---:|---:|---:|---|---|---|",
  ...AB.map(([id, a]) => {
    const k = koszt(a);
    const kTxt = k === null && id === "dodge" ? `${fmt(C.STAMINA.costs.dodge)} × obc.` : fmt(k);
    const naS = k === null || !a.cooldown ? "—" : fmt(k / a.cooldown);
    return `| ${a.name} | \`${id}\` | ${fmt(a.unlockLevel, 0)} | ${fmt(a.cooldown)} | ${kTxt} | ${naS} | ${fmt(a.damageMultiplier)} | ${role(a).join(", ") || "—"} | ${a.aimPreview ?? "—"} | ${a.requiresShield ? "tarcza" : "—"} |`;
  }),
].join("\n");

// ── Tabela 2: nauka u trenera ────────────────────────────────────────────
const t2 = [
  "| umiejętność | nauka (`SKILLS`) | trener | złoto | punkty |",
  "|---|---|---|---:|---:|",
  ...AB.map(([id, a]) => {
    const s = naukaDla.get(id);
    return s
      ? `| ${a.name} | \`${s.id}\` | ${s.trainer} | ${fmt(s.goldCost, 0)} | ${fmt(s.skillPointCost, 0)} |`
      : `| ${a.name} | **BRAK** — nie da się nauczyć | — | — | — |`;
  }),
].join("\n");

// ── Tabela 3: siatka poziomów odblokowania ───────────────────────────────
const maxLvl = Math.max(...AB.map(([, a]) => a.unlockLevel ?? 0));
const t3 = [
  "| poziom | odblokowuje |",
  "|---:|---|",
  ...Array.from({ length: maxLvl }, (_, i) => i + 1).map((lv) => {
    const n = AB.filter(([, a]) => a.unlockLevel === lv).map(([, a]) => a.name);
    return `| ${lv} | ${n.length ? n.join(", ") : "—"} |`;
  }),
].join("\n");

// ── Tabela 4: siatka ról ─────────────────────────────────────────────────
const ROLE = ["pojedynczy cios", "obszar", "ruch", "kontrola", "efekt", "wzmocnienie"];
const t4 = [
  "| rola | umiejętności | liczba |",
  "|---|---|---:|",
  ...ROLE.map((r) => {
    const n = AB.filter(([, a]) => role(a).includes(r)).map(([, a]) => a.name);
    return `| ${r} | ${n.length ? n.join(", ") : "**LUKA**"} | ${n.length} |`;
  }),
].join("\n");

const bloki = { parametry: t1, nauka: t2, poziomy: t3, role: t4 };
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
const bezNauki = AB.filter(([id]) => !naukaDla.has(id)).length;
console.log(`umiejętności: ${AB.length} · bez ścieżki nauki: ${bezNauki} · poziomy 1–${maxLvl}`);
if (ZAPISZ) {
  writeFileSync(DOC, doc);
  console.log(`zapisano ${DOC} (${zmian} bloków zmienionych)`);
} else {
  console.log(`PRZYMIAR — ${zmian} bloków do odświeżenia. Nic nie zapisano. Uruchom z --zapisz.`);
}

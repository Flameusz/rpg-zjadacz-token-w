/**
 * doc_export — pakowanie dokumentacji do oceny zewnętrznej.
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * `docs/` bywa wysyłany na zewnątrz (GPT, recenzent) i do 2026-09-05 robiło się
 * to przez spakowanie katalogu PŁASKO. To ograniczenie zaczęło projektować
 * strukturę: „nie róbmy podkatalogów, bo paczka się zepsuje".
 *
 * `DOC_CONTRACT.md` §12.1 odwraca zależność: **strukturę projektujemy pod
 * użyteczność, pakowanie jest robotą narzędzia.** Ten skrypt jest tym narzędziem.
 *
 * ⚠ **Nie kopiuje drzewa na płasko.** Kopiowanie daje kolizje nazw
 * (`etapy/las/00_stan.md` i `etapy/walka/00_stan.md`), a przemianowanie zrywa
 * łącza. Zamiast tego skleja wybrane dokumenty w JEDEN plik: spis treści,
 * kotwice zamiast ścieżek, doklejona kalibracja i **jawna lista tego, czego
 * w paczce NIE MA** — bo dotąd recenzent dostawał odwołania do plików,
 * których nie widział.
 *
 * Użycie:
 *   node tools/doc_export.mjs --domena items       # jedna dziedzina (domyślne użycie)
 *   node tools/doc_export.mjs --typ STAN,DECYZJA   # po typach
 *   node tools/doc_export.mjs --wszystko           # cały katalog
 *   …dopisz --zapisz, żeby zapisać; bez tego tylko raport (reguła `tools/CLAUDE.md`)
 *
 * Wynik: `docs/_export/<zakres>.md`
 */

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARG = (nazwa) => {
  const i = process.argv.indexOf(nazwa);
  return i === -1 ? null : process.argv[i + 1] ?? null;
};
const ZAPISZ = process.argv.includes("--zapisz");
const DOMENA = ARG("--domena");
const TYPY = ARG("--typ")?.split(",").map((s) => s.trim().toUpperCase()) ?? null;
const WSZYSTKO = process.argv.includes("--wszystko");

if (!DOMENA && !TYPY && !WSZYSTKO) {
  console.log("Podaj zakres: --domena <id> | --typ STAN,DECYZJA | --wszystko");
  process.exit(1);
}

// ── Zbieranie ──────────────────────────────────────────────────────────────

const POMIJANE = new Set(["art-review", "img", "_export"]);

async function zbierz(kat) {
  const out = [];
  for (const w of await readdir(kat, { withFileTypes: true })) {
    if (w.isDirectory()) {
      if (POMIJANE.has(w.name)) continue;
      out.push(...(await zbierz(join(kat, w.name))));
    } else if (w.name.endsWith(".md")) out.push(join(kat, w.name));
  }
  return out;
}

function naglowek(tresc) {
  if (!tresc.startsWith("---\n")) return null;
  const koniec = tresc.indexOf("\n---", 4);
  if (koniec === -1) return null;
  const h = {};
  for (const l of tresc.slice(4, koniec).split("\n")) {
    const m = l.match(/^([a-z-]+):\s*(.*)$/);
    if (!m) continue;
    const v = m[2].trim();
    h[m[1]] = v.startsWith("[")
      ? v.slice(1, v.lastIndexOf("]")).split(",").map((s) => s.trim()).filter(Boolean)
      : v.replace(/^["']|["']$/g, "");
  }
  return h;
}

const wszystkie = [];
for (const p of await zbierz(join(KORZEN, "docs"))) {
  // ⚠ Normalizacja CRLF → LF, ta sama i z tego samego powodu co w
  // `tools/doc_check.mjs`: na dysku autora każdy dokument ma windowsowe końce
  // linii, więc parser sprawdzający `startsWith("---\n")` nie rozpoznawał
  // ANI JEDNEGO nagłówka — a bez nagłówka `--domena` i `--typ` nie mają czego
  // filtrować i eksport odpowiadał „nic nie pasuje do tego zakresu".
  const tresc = (await readFile(p, "utf8")).replace(/\r\n/g, "\n");
  wszystkie.push({ rel: relative(KORZEN, p).split("\\").join("/"), tresc, h: naglowek(tresc) });
}

const pasuje = (d) => {
  if (WSZYSTKO) return true;
  if (!d.h) return false;
  if (DOMENA) return [].concat(d.h.domena ?? []).includes(DOMENA);
  return TYPY.includes(String(d.h.typ ?? "").toUpperCase());
};

const wybrane = wszystkie.filter(pasuje).sort((a, b) => a.rel.localeCompare(b.rel));
const pominiete = wszystkie.filter((d) => !pasuje(d));

if (!wybrane.length) {
  console.log("Nic nie pasuje do tego zakresu. Czy dokumenty mają już nagłówki maszynowe?");
  process.exit(1);
}

// ── Sklejanie ──────────────────────────────────────────────────────────────

const kotwica = (rel) => rel.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
const bezNaglowka = (t) => (t.startsWith("---\n") ? t.slice(t.indexOf("\n---", 4) + 4) : t);

const zakres = DOMENA ? `domena-${DOMENA}` : TYPY ? `typy-${TYPY.join("-").toLowerCase()}` : "wszystko";

/*
 * Kalibracja = wszystko z indeksu PRZED pierwszą poziomą linią. ⚠ Nagłówek
 * maszynowy trzeba odciąć wcześniej — indeks dostał go 2026-09-07, a naiwne
 * `split("---")[0]` zwracało od tego dnia pusty ciąg i paczka wychodziła
 * BEZ KALIBRACJI, nie zgłaszając niczego.
 */
const kalibracja = existsSync(join(KORZEN, "docs", "README.md"))
  ? bezNaglowka((await readFile(join(KORZEN, "docs", "README.md"), "utf8")).replace(/\r\n/g, "\n"))
      .split(/^---$/m)[0]
  : "";

const czesci = [];
czesci.push(`# Paczka dokumentacji — ${zakres}\n`);
czesci.push(`Wygenerowane przez \`tools/doc_export.mjs\`. Dokumentów: **${wybrane.length}**.\n`);
czesci.push(kalibracja.trim() + "\n");
czesci.push(`\n## Co jest w tej paczce\n`);
for (const d of wybrane) {
  czesci.push(`- [\`${d.rel}\`](#${kotwica(d.rel)}) — ${d.h?.tytul ?? "(bez nagłówka)"}${d.h?.typ ? ` · \`${d.h.typ}\`` : ""}`);
}
czesci.push(`\n## ⚠ Czego w tej paczce NIE MA\n`);
czesci.push(
  `Odwołania do poniższych plików w treści **nie są martwymi łączami** — wskazują na części repozytorium poza zakresem tej paczki.\n`,
);
czesci.push(`- \`CLAUDE.md\` (korzeń repo) — router i niezmienniki globalne`);
czesci.push(`- \`src/*/CLAUDE.md\`, \`tools/CLAUDE.md\` — reguły przy kodzie (poza kontraktem, §2.7)`);
czesci.push(`- \`public/assets/README.md\` — źródło prawdy o pikselach assetów`);
czesci.push(`- \`PROJECT_CHECKPOINT_*.md\` (korzeń repo) — checkpointy etapu lasu`);
if (pominiete.length) czesci.push(`- **${pominiete.length} dokumentów z \`docs/\`** spoza wybranego zakresu`);

for (const d of wybrane) {
  czesci.push(`\n\n---\n\n<a id="${kotwica(d.rel)}"></a>\n`);
  czesci.push(`> 📄 **Źródło: \`${d.rel}\`**${d.h?.typ ? ` · typ \`${d.h.typ}\`` : ""}${d.h?.stan ? ` · stan \`${d.h.stan}\`` : ""}\n`);
  czesci.push(bezNaglowka(d.tresc).trim());
}

const wynik = czesci.join("\n");
const cel = join(KORZEN, "docs", "_export", `${zakres}.md`);

console.log("=== eksport dokumentacji ===\n");
console.log(`zakres            ${zakres}`);
console.log(`dokumentów        ${wybrane.length}`);
console.log(`pominiętych       ${pominiete.length}`);
console.log(`rozmiar wyniku    ${(Buffer.byteLength(wynik, "utf8") / 1024).toFixed(1)} KB`);
console.log(`\nw paczce:`);
for (const d of wybrane) console.log(`  ${d.h?.typ ?? "—".padEnd(10)}  ${d.rel}`);

if (!ZAPISZ) {
  console.log(`\nPRZYMIAR — nic nie zapisano. Uruchom z --zapisz, żeby zapisać do ${relative(KORZEN, cel)}.`);
} else {
  await mkdir(dirname(cel), { recursive: true });
  await writeFile(cel, wynik, "utf8");
  console.log(`\nZAPISANO ${relative(KORZEN, cel)}`);
}

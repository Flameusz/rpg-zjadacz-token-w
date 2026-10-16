/**
 * doc_check — przymiar dokumentacji ↔ kod.
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * Audyt 2026-09-05 zmierzył, że KAŻDA znaleziona sprzeczność doc↔kod szła w tę
 * samą stronę: dokumentacja opisywała stan sprzed 3–4 sesji, kod miał rację.
 * Najdroższy przykład — pole `ATTRIBUTES.critChancePerAgility` zniknęło z kodu
 * 2026-08-20, a `docs/zaimplementowane.md` opisywało je jako działającą
 * mechanikę jeszcze 2026-09-05. Nic tego nie zgłosiło, bo NIE BYŁO CZEMU.
 *
 * Ten skrypt odpowiada na jedno pytanie i tylko na nie:
 *
 *     „dokument twierdzi X, ale kod już nie zawiera X"
 *
 * ⛔ **To NIE jest semantyczne porównywanie kodu z dokumentacją.** Nie sprawdza,
 * czy opis mechaniki jest prawdziwy — sprawdza, czy rzeczy, na które dokument
 * się powołuje, nadal istnieją. Minimalny przymiar, który uruchamiamy, jest
 * wart więcej niż pełny system, którego nie uruchomimy.
 *
 * ── Przymiar, jak reszta `tools/` ──────────────────────────────────────────
 * Wyłącznie czyta i drukuje raport. Nie ma `--zapisz`, bo nie ma czego zapisać.
 * Kod wyjścia 1, gdy są BŁĘDY.
 *
 * ⚠ Reguła katalogu: „asercja, która nie potrafi zaświecić na czerwono, jest
 * dekoracją". Dlatego `--sabotaz` puszcza każdą regułę przez spreparowany,
 * celowo zepsuty dokument i sprawdza, że reguła faktycznie zgłasza błąd.
 *
 * Użycie:
 *   node tools/doc_check.mjs            # raport
 *   node tools/doc_check.mjs --sabotaz  # samotest reguł (czy potrafią zaświecić)
 *   node tools/doc_check.mjs --pelny    # dopisuje listy INFO (świadome odwołania historyczne)
 *
 * Kontrakt, który ten skrypt egzekwuje: `docs/DOC_CONTRACT.md`.
 */

import { build } from "esbuild";
import { readFile, readdir, unlink, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, relative, basename } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const PELNY = process.argv.includes("--pelny");
const SABOTAZ = process.argv.includes("--sabotaz");

const bledy = [];
const ostrzezenia = [];
const info = [];
const blad = (sekcja, plik, tresc) => bledy.push({ sekcja, plik, tresc });
const ostrzez = (sekcja, plik, tresc) => ostrzezenia.push({ sekcja, plik, tresc });
const informuj = (sekcja, plik, tresc) => info.push({ sekcja, plik, tresc });

// ── Wczytanie GameConfig.ts (prawdziwe wartości, nie parsowanie tekstu) ─────

const tmp = join(KORZEN, "node_modules", ".doc-check.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
});
const CFG = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

/** Ile jest wariantów broni — jedna definicja, ta sama co w `macierz_walki.mjs`. */
const WARIANTOW_BRONI = Object.values(CFG.ITEMS)
  .filter((it) => it.type === "weapon")
  .reduce((n, it) => n + (it.attacks?.length ?? 1), 0);

// ── Zbieranie dokumentów ───────────────────────────────────────────────────

const POMIJANE_KATALOGI = new Set([
  "node_modules",
  ".git",
  "android",
  "dist",
  "public",
  "src",
  "tools",
  "img",
]);

async function zbierzMd(kat, rekurencyjnie) {
  const wynik = [];
  for (const wpis of await readdir(kat, { withFileTypes: true })) {
    if (wpis.isDirectory()) {
      if (!rekurencyjnie || POMIJANE_KATALOGI.has(wpis.name)) continue;
      wynik.push(...(await zbierzMd(join(kat, wpis.name), true)));
    } else if (wpis.name.endsWith(".md")) {
      wynik.push(join(kat, wpis.name));
    }
  }
  return wynik;
}

/*
 * ⚠ **Zagnieżdżone `CLAUDE.md` są SKANOWANE, choć są poza kontraktem**
 * (`DOC_CONTRACT.md` §2.7, rozstrzygnięcie OI-6). Cytują symbole gęściej niż
 * cokolwiek w `docs/`, ładują się automatycznie do każdej sesji kodowej — i do
 * 2026-09-05 nic ich nie sprawdzało. Znaleziony tą drogą przykład:
 * `src/core/CLAUDE.md` twierdzi, że obciążenie „dotyka dokładnie dwóch rzeczy",
 * a `Progression.ts:444` czyta trzeciego konsumenta.
 */
/*
 * ⚠ Lista katalogów jest WYLICZANA, nie wpisana (2026-10-11). Do tej daty stała
 * tu ręczna lista pięciu katalogów — `src/render3d/CLAUDE.md` powstałby poza
 * skanem i nikt by tego nie zauważył, bo raport byłby zielony.
 */
const INSTRUKCJE_KODU = [
  ...(await readdir(join(KORZEN, "src"), { withFileTypes: true }))
    .filter((w) => w.isDirectory()).map((w) => `src/${w.name}`),
  "tools",
]
  .map((k) => join(KORZEN, k, "CLAUDE.md"))
  .filter((p) => existsSync(p));

const sciezki = [
  ...(await zbierzMd(join(KORZEN, "docs"), true)),
  ...(await zbierzMd(KORZEN, false)),
  ...INSTRUKCJE_KODU,
];

const wzgledna = (p) => relative(KORZEN, p).split("\\").join("/");

const dokumenty = [];
for (const p of sciezki) {
  /*
   * ⚠ **Końce linii normalizujemy do `\n` PRZED czymkolwiek innym.** Autor
   * pracuje na Windowsie z `core.autocrlf=true`: w repozytorium jest LF, ale
   * NA DYSKU każdy plik ma CRLF. Do 2026-09-07 parser nagłówka sprawdzał
   * `tresc.startsWith("---\n")` i przez to **nie znajdował na tej maszynie ANI
   * JEDNEGO nagłówka maszynowego** — raport drukował `0 / 147`, a reguły §N,
   * §K, §Z i §R nie miały czego sprawdzać. Awaria była CICHA i wyglądała jak
   * sekcja bez uwag; dokładnie „asercja, która nie potrafi zaświecić".
   *
   * Rozmiar liczymy PO normalizacji: limit z kontraktu §8 mierzy długość
   * dokumentu, a nie system plików, na którym go zapisano. Bajty `\r`
   * dokładały ~2–3% i same potrafiły przewrócić plik przez limit.
   */
  const tresc = (await readFile(p, "utf8")).replace(/\r\n/g, "\n");
  const rozmiar = Buffer.byteLength(tresc, "utf8");
  dokumenty.push({
    sciezka: p,
    rel: wzgledna(p),
    tresc,
    rozmiar,
    instrukcja: INSTRUKCJE_KODU.includes(p),
    ...parsujNaglowek(tresc),
  });
}

// ── Nagłówek maszynowy (podzbiór YAML wystarczający dla kontraktu) ──────────

function parsujNaglowek(tresc) {
  if (!tresc.startsWith("---\n")) return { naglowek: null };
  const koniec = tresc.indexOf("\n---", 4);
  if (koniec === -1) return { naglowek: null };
  const blok = tresc.slice(4, koniec);
  const naglowek = {};
  let ostatniKlucz = null;
  for (const linia of blok.split("\n")) {
    const lista = linia.match(/^\s+-\s+(.*)$/);
    if (lista && ostatniKlucz) {
      (naglowek[ostatniKlucz] ||= []).push(oczysc(lista[1]));
      continue;
    }
    const para = linia.match(/^([a-z-]+):\s*(.*)$/);
    if (!para) continue;
    const [, klucz, surowa] = para;
    ostatniKlucz = klucz;
    const v = surowa.trim();
    if (v === "") naglowek[klucz] = [];
    else if (v.startsWith("[")) {
      const srodek = v.slice(1, v.lastIndexOf("]")).trim();
      naglowek[klucz] = srodek === "" ? [] : srodek.split(",").map((s) => oczysc(s));
    } else naglowek[klucz] = oczysc(v);
  }
  return { naglowek };
}
function oczysc(s) {
  return s.trim().replace(/^["']|["']$/g, "");
}

// ── Lista domen — JEDNO źródło: blok ```domeny w kontrakcie ────────────────

const kontrakt = dokumenty.find((d) => d.rel === "docs/DOC_CONTRACT.md");
let DOMENY = new Set();
if (!kontrakt) {
  blad("§N", "docs/DOC_CONTRACT.md", "brak pliku kontraktu — reszta reguł nie ma podstawy");
} else {
  const blok = kontrakt.tresc.match(/```domeny\n([\s\S]*?)```/);
  if (!blok) blad("§N", kontrakt.rel, "brak bloku ```domeny — nie da się sprawdzić pola `domena`");
  else for (const l of blok[1].split("\n")) {
    const m = l.match(/^([a-z0-9_]+):/);
    if (m) DOMENY.add(m[1]);
  }
}

const TYPY = new Set(["STAN", "KANON", "DECYZJA", "HISTORIA", "GENEROWANE", "OPERACYJNE"]);
const STANY = new Set(["zywy", "zamkniety", "zamrozony", "zastapiony"]);
const MOCE = new Set(["ACTIVE", "SUPERSEDED", "REJECTED", "HISTORICAL", "OPEN"]);
const LIMITY = { STAN: 20480, KANON: 40960, DECYZJA: 12288, OPERACYJNE: 20480 };

// ── Markery świadomego odwołania historycznego ─────────────────────────────
// Dokument WOLNO cytować nieistniejący symbol, jeśli mówi wprost, że go nie ma.

const MARKERY = [
  "nie istnieje", "nieistniej", "NIE ISTNIEJE", "NIE MA", "nie ma pola",
  "historyczn", "HISTORYCZN", "POPRAWKA", "usunięt", "usuniet", "skasowan",
  "USUNIĘT", "USUNIET", "SKASOWAN",
  "nieaktualn", "NIEAKTUALN", "sprzed", "martw", "zastąpion", "zastapion",
  "przestał", "przestal", "dawn", "~~", "STARY", "starego", "odrzucon",
  "planowan", "przyszł", "przyszl", "nie powstał", "niezbudowan",
  "LEGACY", "legacy", "WYCOFAN", "wycofan", "zamrożon", "zamrozon",
];
/*
 * ⚠ Okno kontekstu to DWIE linie w tył i JEDNA w przód, nie sama linia.
 * Zmierzone na `katalog_assetow.md`: wyliczenie ośmiu symboli zajmuje trzy
 * linie, a werdykt („cały łańcuch USUNIĘTY z aktywnego kodu") stoi w czwartej.
 * Przy oknie dwuliniowym przymiar zgłaszał to jako rozjazd, choć dokument mówi
 * wprost, że kodu nie ma. ⛔ Okno zostaje WĄSKIE świadomie — marker oddalony
 * o akapit przestaje opisywać to zdanie i zaczyna tłumić przypadkiem.
 */
const oznaczoneJakoHistoria = (linie, i) => {
  const kontekst = [linie[i - 2] ?? "", linie[i - 1] ?? "", linie[i] ?? "", linie[i + 1] ?? ""].join(" ");
  return MARKERY.some((m) => kontekst.includes(m));
};

/*
 * ⚠ **Dokument HISTORYCZNY ma PRAWO cytować nieistniejące symbole** — dziennik
 * z 2026-08-26 opisuje plik, który wtedy istniał, i to nie jest defekt, tylko
 * cała jego funkcja. Zgłaszanie tego jako błędu zamieniłoby przymiar w źródło
 * szumu, a przymiar, którego się nie uruchamia, jest wart zero.
 *
 * Docelowo rozstrzyga o tym `typ: HISTORIA` w nagłówku maszynowym. Dopóki
 * nagłówków nie ma, poniższa lista jest jawnym, tymczasowym zastępnikiem —
 * i ma zniknąć, gdy te pliki dostaną nagłówki (Etap 3).
 */
const HISTORYCZNE_TYMCZASOWO = [/^docs\/dziennik\.md$/, /^docs\/archiwum\//];
const dokumentHistoryczny = (dok) =>
  dok.naglowek?.typ === "HISTORIA" ||
  dok.naglowek?.stan === "zamrozony" ||
  HISTORYCZNE_TYMCZASOWO.some((re) => re.test(dok.rel));

/** Segmenty, które są własnością JavaScriptu, a nie konfigu. */
const WBUDOWANE = new Set(["length", "size", "keys", "values", "entries", "map", "filter", "join", "toString"]);

/**
 * Rozwiązuje ścieżkę w konfigu. Zwraca `{ ok }` albo `{ brakujace, glebiej }`.
 *
 * ⚠ **Tablica adresowana po `id` NIE jest błędem.** Dokumentacja pisze
 * `ZOFIA.topics.sama`, a w konfigu `topics` to tablica obiektów z polem `id`.
 * Pierwsza wersja tej reguły zgłaszała wszystkie 68 tematów rozmów jako
 * „usunięte z kodu" — czyli dokładnie ten fałszywy alarm, przez który nikt by
 * już tego skryptu nie uruchomił.
 */
function rozwiazSciezke(korzenWartosc, czesci) {
  let biezacy = korzenWartosc;
  for (const czesc of czesci) {
    if (Array.isArray(biezacy)) {
      const trafiony = biezacy.find((el) => el && typeof el === "object" && (el.id === czesc || el.key === czesc));
      if (trafiony !== undefined) { biezacy = trafiony; continue; }
      return { brakujace: czesc, glebiej: false };
    }
    if (biezacy && typeof biezacy === "object" && czesc in biezacy) { biezacy = biezacy[czesc]; continue; }
    if (WBUDOWANE.has(czesc)) return { ok: true };
    // Skrót notacyjny: dokument pominął kontener (np. `PEASANT.firstJob`
    // zamiast `PEASANT.greetings.firstJob`). To niedokładność zapisu, nie
    // twierdzenie o nieistniejącym kodzie.
    const glebiej =
      biezacy && typeof biezacy === "object" &&
      Object.values(biezacy).some((v) => v && typeof v === "object" && !Array.isArray(v) && czesc in v);
    return { brakujace: czesc, glebiej };
  }
  return { ok: true };
}

// ── Reguły ─────────────────────────────────────────────────────────────────

/** Wyciąga zawartość wszystkich span-ów w backtickach, z numerem linii. */
function spany(tresc) {
  const linie = tresc.split("\n");
  const out = [];
  linie.forEach((linia, i) => {
    for (const m of linia.matchAll(/`([^`\n]+)`/g)) out.push({ tekst: m[1], nr: i + 1, linie, i });
  });
  return out;
}

/** §S — symbol `GameConfig` cytowany w treści, którego w konfigu już nie ma. */
function regulaSymboli(dok) {
  for (const { tekst, nr, linie, i } of spany(dok.tresc)) {
    const m = tekst.match(/^(?:GameConfig\.)?([A-Z][A-Z0-9_]{1,})\.([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)$/);
    if (!m) continue;
    const [, korzen, sciezkaPola] = m;
    // Tylko jeśli korzeń NA PEWNO jest stałą konfiguracyjną — inaczej to nie
    // jest odwołanie do konfigu i nie mamy prawa go oceniać.
    if (!(korzen in CFG)) continue;
    const wynik = rozwiazSciezke(CFG[korzen], sciezkaPola.split("."));
    if (wynik.ok) continue;
    const opis = `\`${korzen}.${sciezkaPola}\` — w konfigu nie ma \`${wynik.brakujace}\` (linia ${nr})`;
    if (wynik.glebiej) informuj("§S", dok.rel, opis + " · pole istnieje POZIOM NIŻEJ — skrót notacyjny, nie rozjazd");
    else if (dokumentHistoryczny(dok)) informuj("§S", dok.rel, opis + " · dokument historyczny, wolno mu");
    else if (oznaczoneJakoHistoria(linie, i)) informuj("§S", dok.rel, opis + " · oznaczone jako historyczne");
    else blad("§S", dok.rel, opis);
  }
}

/** §P — ścieżka do pliku `src/` lub `tools/` cytowana w treści, której nie ma. */
function regulaSciezek(dok) {
  for (const { tekst, nr, linie, i } of spany(dok.tresc)) {
    const m = tekst.match(/^((?:src|tools)\/[A-Za-z0-9_\-./]+\.(?:ts|mjs|py|json))$/);
    if (!m) continue;
    if (existsSync(join(KORZEN, m[1]))) continue;
    const opis = `\`${m[1]}\` — pliku nie ma (linia ${nr})`;
    if (dokumentHistoryczny(dok)) informuj("§P", dok.rel, opis + " · dokument historyczny, wolno mu");
    else if (oznaczoneJakoHistoria(linie, i)) informuj("§P", dok.rel, opis + " · oznaczone jako historyczne");
    else blad("§P", dok.rel, opis);
  }
}

/** §N — poprawność nagłówka maszynowego (tylko dla dokumentów, które go mają). */
function regulaNaglowka(dok) {
  const h = dok.naglowek;
  if (!h) return;
  if (!TYPY.has(h.typ)) blad("§N", dok.rel, `nieznany \`typ: ${h.typ}\``);
  if (!STANY.has(h.stan)) blad("§N", dok.rel, `nieznany \`stan: ${h.stan}\``);
  for (const d of [].concat(h.domena ?? [])) {
    if (!DOMENY.has(d)) blad("§N", dok.rel, `domena \`${d}\` spoza listy w DOC_CONTRACT.md`);
  }
  if (h.typ === "STAN") {
    for (const pole of ["implemented", "documented", "verified", "kotwice"]) {
      if (h[pole] === undefined) blad("§N", dok.rel, `\`STAN\` bez wymaganego pola \`${pole}\``);
    }
  }
  if (h.typ === "GENEROWANE" && !h.generator) blad("§N", dok.rel, "`GENEROWANE` bez pola `generator`");
  if (h.typ === "DECYZJA" && !h.data) blad("§N", dok.rel, "`DECYZJA` bez pola `data`");
  if (h.typ === "DECYZJA") {
    // ⚠ `moc` (czy decyzja obowiązuje) jest OSOBNĄ osią od `stan` (czy plik
    // będzie jeszcze edytowany). Decyzja zamknięta w sierpniu może dziś być
    // `SUPERSEDED` — i bez tego pola jedynym sygnałem byłaby proza w środku.
    if (!h.moc) blad("§N", dok.rel, "`DECYZJA` bez pola `moc`");
    else if (!MOCE.has(h.moc)) blad("§N", dok.rel, `nieznana \`moc: ${h.moc}\``);
    else if (h.moc === "SUPERSEDED" && !h["zastapione-przez"]) {
      blad("§N", dok.rel, "`moc: SUPERSEDED` bez wskazania następcy — to jest `OPEN`, nie `SUPERSEDED`");
    }
  }
  if (h.stan === "zastapiony" && !h["zastapione-przez"]) {
    blad("§N", dok.rel, "`stan: zastapiony` bez pola `zastapione-przez`");
  }
}

/** §K — każda kotwica z nagłówka musi istnieć (plik albo pole konfigu). */
function regulaKotwic(dok) {
  for (const kotwica of [].concat(dok.naglowek?.kotwice ?? [])) {
    if (/^(src|tools)\//.test(kotwica)) {
      if (!existsSync(join(KORZEN, kotwica))) blad("§K", dok.rel, `kotwica \`${kotwica}\` — pliku nie ma`);
      continue;
    }
    const m = kotwica.match(/^(?:GameConfig\.)?([A-Z][A-Z0-9_]*)\.?(.*)$/);
    if (!m) { blad("§K", dok.rel, `kotwica \`${kotwica}\` — nieznany kształt`); continue; }
    const [, korzen, reszta] = m;
    if (!(korzen in CFG)) { blad("§K", dok.rel, `kotwica \`${kotwica}\` — brak \`${korzen}\` w konfigu`); continue; }
    const wynik = rozwiazSciezke(CFG[korzen], reszta ? reszta.split(".") : []);
    if (!wynik.ok) blad("§K", dok.rel, `kotwica \`${kotwica}\` — brak \`${wynik.brakujace}\``);
  }
}

/**
 * §R — limit rozmiaru z kontraktu (tylko dla typów, które go mają).
 *
 * ⚠ **Przekroczenie jest BŁĘDEM wyłącznie dla `STAN`.** Kontrakt czyni limit
 * warunkiem odbioru tylko tam (§7, kryterium 7) — i tylko tam broni czegoś
 * realnego: dokument opisujący dzisiejszą mechanikę, którego nikt nie czyta
 * w całości, zaczyna sobie przeczyć. Dla `KANON`, `DECYZJA` i `OPERACYJNE`
 * §8 podaje liczbę, ale nie robi z niej warunku odbioru — przekroczenie idzie
 * do OSTRZEŻEŃ: widoczne i policzone, nie tłumione.
 *
 * ⛔ Nie odwracaj tego dla `STAN`. Tam limit jest mechanizmem poprawności.
 */
function regulaRozmiaru(dok) {
  const typ = dok.naglowek?.typ;
  const limit = LIMITY[typ];
  if (!limit) return;
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  if (dok.rozmiar > limit) {
    const opis = `${kb(dok.rozmiar)} > limit ${kb(limit)} dla \`${typ}\``;
    if (typ === "STAN") blad("§R", dok.rel, opis);
    else ostrzez("§R", dok.rel, `${opis} — do cięcia wg kontraktu §8`);
  } else if (dok.rozmiar > limit * 0.8) {
    ostrzez("§R", dok.rel, `${kb(dok.rozmiar)} — próg ostrzeżenia dla \`${typ}\``);
  }
}

/** §Z — spójność zastępowania i „jeden STAN na domenę". */
function regulaZastepowania(wszystkie) {
  const stanyDomen = new Map();
  for (const dok of wszystkie) {
    const h = dok.naglowek;
    if (!h) continue;
    for (const p of [].concat(h.zastepuje ?? []).concat(h["zastapione-przez"] ?? [])) {
      if (p && p !== "null" && !existsSync(join(KORZEN, p))) {
        blad("§Z", dok.rel, `wskazuje na nieistniejący plik \`${p}\``);
      }
    }
    if (h.typ === "STAN") {
      const d = [].concat(h.domena ?? [])[0];
      if (stanyDomen.has(d)) blad("§Z", dok.rel, `drugi \`STAN\` dla domeny \`${d}\` (pierwszy: ${stanyDomen.get(d)})`);
      else stanyDomen.set(d, dok.rel);
    }
  }
  return stanyDomen;
}

/** §I — czy indeks wymienia każdy dokument (bezpośrednio albo przez katalog). */
function regulaIndeksu(wszystkie) {
  const readme = wszystkie.find((d) => d.rel === "docs/README.md");
  if (!readme) { blad("§I", "docs/README.md", "brak indeksu"); return; }
  for (const dok of wszystkie) {
    if (dok.rel === "docs/README.md") continue;
    // Instrukcje przy kodzie są poza kontraktem, więc i poza indeksem `docs/`.
    if (dok.instrukcja) continue;
    const nazwa = basename(dok.rel);
    if (readme.tresc.includes(nazwa)) continue;
    // Wystarczy, że w indeksie jest KTÓRYKOLWIEK katalog nadrzędny — katalog
    // roboczy rejestruje się jako całość, nie plik po pliku.
    const przodkowie = dirname(dok.rel).split("/").filter((s) => s && s !== "." && s !== "docs");
    const zarejestrowany = przodkowie.find((k) => readme.tresc.includes(`${k}/`));
    if (zarejestrowany) {
      informuj("§I", dok.rel, `nie z nazwy, ale katalog \`${zarejestrowany}/\` jest w indeksie`);
      continue;
    }
    blad("§I", dok.rel, "nie ma go w `docs/README.md`");
  }
}

/*
 * ── Reguły ciągłości pracy (2026-10-11) ────────────────────────────────────
 * Retrospektywa dokumentacji zmierzyła trzy mechanizmy rozkładu, których żadna
 * reguła treściowa nie widziała, bo każdy pojedynczy plik był „poprawny":
 *  - DZIESIĘĆ plików mówiło „zaczynasz tu" — każdy checkpoint ogłaszał się
 *    punktem wejścia, a odwołanie poprzedniego wymagało ręcznej edycji;
 *  - routery wróciły do rozmiarów sprzed cięcia (indeks 104 → 19 → 44 KB),
 *    bo każda sesja dopisywała do nich status zamiast do dokumentu;
 *  - lista OTWARTYCH spraw niosła 47 wierszy zamkniętych, a wiersz `OI-164`
 *    urósł do 3,5 KB opisu.
 * Powód i zasady: `docs/DOC_CONTRACT.md` §11.
 */

/** Jedyny plik, któremu wolno ogłaszać się punktem wejścia sesji. */
const PUNKT_WEJSCIA = "docs/current.md";
/** Pliki czytane na starcie KAŻDEJ sesji — twardy budżet (bajty po normalizacji). */
const BUDZETY = { "CLAUDE.md": 28 * 1024, "docs/README.md": 24 * 1024, [PUNKT_WEJSCIA]: 10 * 1024 };
const ROUTERY = new Set(["CLAUDE.md", "docs/README.md"]);
const ROSZCZENIE = /ZACZYNASZ TU|OD TEGO PLIKU ZACZYNASZ|BIEŻĄCY PUNKT WEJŚCIA|zaczyna się TUTAJ|zaczynaj TUTAJ/i;
/** Ile linii treści (po nagłówku maszynowym) to „strefa banera". */
const STREFA_BANERA = 40;

/**
 * §W — tylko `docs/current.md` mówi, od czego zaczyna się sesja.
 * Sprawdza strefę banera każdego dokumentu i CAŁE routery (wiersz indeksu
 * „⭐⭐ BIEŻĄCY PUNKT WEJŚCIA" jest tym samym roszczeniem co baner).
 */
function regulaPunktuWejscia(dok) {
  if (dok.rel === PUNKT_WEJSCIA) return;
  let linie = dok.tresc.split("\n");
  if (dok.naglowek) linie = linie.slice(dok.tresc.slice(0, dok.tresc.indexOf("\n---", 4) + 4).split("\n").length);
  if (!ROUTERY.has(dok.rel)) linie = linie.slice(0, STREFA_BANERA);
  const i = linie.findIndex((l) => ROSZCZENIE.test(l));
  if (i >= 0) blad("§W", dok.rel, `roszczenie punktu wejścia („${linie[i].match(ROSZCZENIE)[0]}") — wolno je mieć tylko \`${PUNKT_WEJSCIA}\``);
}

/** §B — budżet plików czytanych co sesję. */
function regulaBudzetu(dok) {
  const limit = BUDZETY[dok.rel];
  if (limit && dok.rozmiar > limit) {
    blad("§B", dok.rel, `${(dok.rozmiar / 1024).toFixed(1)} KB > budżet ${(limit / 1024).toFixed(0)} KB — status należy do \`${PUNKT_WEJSCIA}\` albo do dokumentu wątku, nie do routera`);
  }
}

/** Najdłuższy dopuszczalny wiersz rejestru — etykieta i adres, nie opis. */
const WIERSZ_REJESTRU = 700;
/**
 * §Z2 — rejestr `OI`: w sekcji `## AKTYWNE` stoją wyłącznie sprawy otwarte,
 * a wiersz jest etykietą. Zamknięta sprawa idzie do `docs/issues_archive.md`.
 */
function regulaRejestru(dok) {
  if (dok.rel !== "docs/zadania.md") return;
  let wSekcji = false;
  dok.tresc.split("\n").forEach((l, i) => {
    if (/^## /.test(l)) wSekcji = /^## AKTYWNE/.test(l);
    if (!wSekcji || !/^\|\s*\**OI-\d+/.test(l)) return;
    const id = l.match(/OI-\d+/)[0];
    // Zamknięty = komórka „rzecz" ZACZYNA SIĘ od ✅ albo przekreślenia. ✅ dalej
    // w wierszu to zwykle zaliczony KROK otwartej sprawy (`OI-164`: „✅ BRAMKA").
    const rzecz = (l.split("|")[2] ?? "").replace(/^[\s*]+/, "");
    if (/^(✅|~~)/.test(rzecz)) blad("§Z2", dok.rel, `${id} (linia ${i + 1}) oznaczony jako zamknięty w sekcji AKTYWNE — przenieś do \`docs/issues_archive.md\``);
    else if (l.length > WIERSZ_REJESTRU) blad("§Z2", dok.rel, `${id} (linia ${i + 1}) ma ${l.length} znaków > ${WIERSZ_REJESTRU} — opis należy do dokumentu z kolumny „gdzie"`);
  });
}

/** Ile dni pracy wolno dziennikowi wyprzedzić `docs/current.md`. */
const ZAPAS_PUNKTU_WEJSCIA_DNI = 7;
/**
 * §A — czy punkt wejścia nadąża za pracą.
 *
 * Porównuje DWIE DATY Z REPO, nie kalendarz: najnowszy wpis dziennika i pole
 * `aktualizacja` w `docs/current.md`. Przerwa w pracy nie daje wpisów, więc nie
 * świeci; tydzień pracy, po którym `current.md` dalej opisuje stare wątki —
 * świeci. Tak umarł poprzedni punkt wejścia (`checkpoint_2026-09-21.md`:
 * trzy tygodnie sesji, §1 nie wiedział o 3D, wsi ani bandytach).
 * Naprawa: przejrzyj `current.md`; jeśli nadal mówi prawdę — podbij datę.
 */
function regulaAktualnosci(dziennik, punkt) {
  if (!dziennik || !punkt) return;
  const wpis = dziennik.tresc.match(/^## (\d{4}-\d{2}-\d{2})/m)?.[1];
  const akt = punkt.naglowek?.aktualizacja;
  if (!wpis || !akt) { blad("§A", punkt.rel, "brak daty do porównania (wpis dziennika albo pole `aktualizacja`)"); return; }
  const dni = (Date.parse(wpis) - Date.parse(akt)) / 86_400_000;
  if (dni > ZAPAS_PUNKTU_WEJSCIA_DNI) {
    blad("§A", punkt.rel, `dziennik ma wpisy z ${wpis}, a punkt wejścia jest z ${akt} (${dni} dni pracy) — przejrzyj wątki i następne kroki; jeśli są aktualne, podbij \`aktualizacja\``);
  }
}

/**
 * Katalogi `src/` świadomie bez `STAN` — każdy z powodem. Drukowane jako
 * OSTRZEŻENIE przy każdym przebiegu, żeby wyjątek nie zniknął z oczu.
 */
const BEZ_STAN = {
  // Pusty od 2026-10-11 — jedyny wyjątek (`src/characters`, płaski rig 2D) usunięto razem z kodem.
};
/**
 * §D — każdy katalog `src/` ma kotwicę w jakimś `STAN`.
 *
 * Reguła na poziomie KATALOGU, nie pliku: plik zawartości (`Wolf.ts`) celowo
 * nie ma własnego `STAN` (`DOC_CONTRACT.md` §2.1), ale nowy podsystem zawsze
 * dostaje katalog. Tej reguły zabrakło, gdy `src/render3d/` był przez pięć
 * dni domyślnym obrazem gry bez słowa w `docs/systemy/`.
 */
function regulaPokrycia(stany, katalogi, wyjatki = BEZ_STAN) {
  const kotwice = stany.flatMap((d) => [].concat(d.naglowek?.kotwice ?? []));
  for (const kat of katalogi) {
    if (kotwice.some((k) => k.startsWith(`${kat}/`))) continue;
    if (wyjatki[kat]) ostrzez("§D", kat, `bez \`STAN\` świadomie: ${wyjatki[kat]}`);
    else blad("§D", kat, "żaden `STAN` nie ma tu kotwicy — nowy podsystem potrzebuje `STAN` albo wiersza `OI` i wpisu w `BEZ_STAN` (`DOC_CONTRACT.md` §11)");
  }
}

/**
 * §T — czy tabele w blokach AUTO nadążają za rosterem.
 *
 * ⚙ **Reguła dla `docs/macierz_walki.md` USUNIĘTA 2026-09-07 razem z tamtym
 * dokumentem.** Zapisany snapshot pomiaru zestarzał się dwa razy (10 wariantów
 * wobec 16 w rosterze) i za każdym razem kłamał ciszej niż brak dokumentu;
 * `tools/macierz_walki.mjs` jest od tej pory wyłącznie przymiarem do konsoli.
 * Powód: `docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`.
 */
function regulaTabel() {
  try {
    const out = execFileSync("node", [join(KORZEN, "tools", "katalog_ekwipunku.mjs")], {
      cwd: KORZEN, encoding: "utf8", timeout: 180_000,
    });
    const m = out.match(/PRZYMIAR — (\d+) blok/);
    if (m && Number(m[1]) > 0) {
      blad("§T", "docs/ekwipunek_przedmioty.md", `generator zgłasza ${m[1]} blok(i) do odświeżenia`);
    }
  } catch (e) {
    ostrzez("§T", "tools/katalog_ekwipunku.mjs", `nie udało się uruchomić generatora: ${e.message.split("\n")[0]}`);
  }
}

// ── Sabotaż: czy każda reguła potrafi zaświecić na czerwono ─────────────────

function sabotaz() {
  const proby = [
    {
      nazwa: "§S — nieistniejące pole konfigu",
      dok: { rel: "SABOTAŻ.md", tresc: "Mechanika czyta `ATTRIBUTES.polaKtoregoNieMa`.", rozmiar: 100, naglowek: null },
      regula: regulaSymboli,
    },
    {
      nazwa: "§S — marker historyczny NIE tłumi prawdziwego pola",
      dok: { rel: "SABOTAŻ.md", tresc: "Zwykłe zdanie o `PLAYER.nieMaTakiegoPola`.", rozmiar: 100, naglowek: null },
      regula: regulaSymboli,
    },
    {
      nazwa: "§P — nieistniejący plik źródłowy",
      dok: { rel: "SABOTAŻ.md", tresc: "Logika siedzi w `src/core/NieMaTakiegoPliku.ts`.", rozmiar: 100, naglowek: null },
      regula: regulaSciezek,
    },
    {
      nazwa: "§N — nieznany typ dokumentu",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 100, naglowek: { typ: "WYMYSLONY", stan: "zywy", domena: "combat" } },
      regula: regulaNaglowka,
    },
    {
      nazwa: "§N — domena spoza listy",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 100, naglowek: { typ: "KANON", stan: "zywy", domena: "nieistniejaca_domena" } },
      regula: regulaNaglowka,
    },
    {
      nazwa: "§N — STAN bez pól pokrycia",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 100, naglowek: { typ: "STAN", stan: "zywy", domena: "combat" } },
      regula: regulaNaglowka,
    },
    {
      nazwa: "§N — DECYZJA bez pola `moc`",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 100, naglowek: { typ: "DECYZJA", stan: "zamkniety", domena: "combat", data: "2026-09-05" } },
      regula: regulaNaglowka,
    },
    {
      nazwa: "§N — SUPERSEDED bez wskazania następcy",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 100, naglowek: { typ: "DECYZJA", stan: "zamkniety", domena: "combat", data: "2026-09-05", moc: "SUPERSEDED" } },
      regula: regulaNaglowka,
    },
    {
      nazwa: "§K — kotwica wskazująca w próżnię",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 100, naglowek: { kotwice: ["src/core/Nieistniejacy.ts"] } },
      regula: regulaKotwic,
    },
    {
      nazwa: "§R — przekroczony limit rozmiaru STAN",
      dok: { rel: "SABOTAŻ.md", tresc: "", rozmiar: 999_999, naglowek: { typ: "STAN" } },
      regula: regulaRozmiaru,
    },
    {
      nazwa: "§W — nowy checkpoint ogłasza się punktem wejścia",
      dok: { rel: "docs/checkpoint_2026-12-01.md", tresc: "---\ntyp: OPERACYJNE\n---\n\n# X\n\n> ⭐⭐ **ZACZYNASZ TU, także na innym komputerze.**\n", rozmiar: 100, naglowek: { typ: "OPERACYJNE" } },
      regula: regulaPunktuWejscia,
    },
    {
      nazwa: "§W — wiersz indeksu głęboko w routerze",
      dok: { rel: "docs/README.md", tresc: "x\n".repeat(200) + "| `checkpoint_X.md` | ⭐⭐ **BIEŻĄCY PUNKT WEJŚCIA** |\n", rozmiar: 100, naglowek: null },
      regula: regulaPunktuWejscia,
    },
    {
      nazwa: "§B — router ponad budżetem",
      dok: { rel: "CLAUDE.md", tresc: "", rozmiar: 999_999, naglowek: null },
      regula: regulaBudzetu,
    },
    {
      nazwa: "§Z2 — zamknięta sprawa w sekcji AKTYWNE",
      dok: { rel: "docs/zadania.md", tresc: "## AKTYWNE\n\n| OI-1 | ✅ **ZAMKNIĘTE 2026-10-11** — x | `docs/x.md` |\n", rozmiar: 100, naglowek: null },
      regula: regulaRejestru,
    },
    {
      nazwa: "§A — tydzień pracy w dzienniku, punkt wejścia stoi",
      dok: null,
      regula: () => regulaAktualnosci(
        { rel: "docs/dziennik.md", tresc: "# D\n\n## 2026-10-20 (3) — x\n" },
        { rel: PUNKT_WEJSCIA, naglowek: { aktualizacja: "2026-10-11" } }),
    },
    {
      nazwa: "§D — nowy katalog src/ bez kotwicy w żadnym STAN",
      dok: null,
      regula: () => regulaPokrycia(
        [{ naglowek: { typ: "STAN", kotwice: ["src/core/Stamina.ts"] } }],
        ["src/core", "src/nowy_podsystem"]),
    },
    {
      nazwa: "§Z2 — wiersz rejestru urósł w opis",
      dok: { rel: "docs/zadania.md", tresc: `## AKTYWNE\n\n| OI-2 | ${"opis ".repeat(200)} | \`docs/x.md\` |\n`, rozmiar: 100, naglowek: null },
      regula: regulaRejestru,
    },
  ];

  console.log("=== SABOTAŻ — czy reguły potrafią zaświecić na czerwono ===\n");
  let ok = 0;
  for (const p of proby) {
    bledy.length = 0; ostrzezenia.length = 0; info.length = 0;
    p.regula(p.dok);
    const zapalone = bledy.length > 0;
    console.log(`  ${zapalone ? "OK  " : "AWARIA"}  ${p.nazwa}${zapalone ? "" : "  ← reguła NIE zgłosiła błędu"}`);
    if (zapalone) ok++;
  }

  // Kontrola negatywna: poprawny dokument nie może świecić.
  bledy.length = 0;
  regulaSymboli({ rel: "OK.md", tresc: "Pole `PLAYER.critChance` istnieje.", rozmiar: 10, naglowek: null });
  const czysto = bledy.length === 0;
  console.log(`  ${czysto ? "OK  " : "AWARIA"}  kontrola negatywna — poprawne odwołanie NIE świeci${czysto ? "" : "  ← fałszywy alarm"}`);
  if (czysto) ok++;

  // Kontrola markera: świadome odwołanie historyczne ma iść do INFO, nie do BŁĘDÓW.
  bledy.length = 0; info.length = 0;
  regulaSymboli({ rel: "OK.md", tresc: "Pole `ATTRIBUTES.critChancePerAgility` NIE ISTNIEJE od 2026-08-20.", rozmiar: 10, naglowek: null });
  const stlumione = bledy.length === 0 && info.length === 1;
  console.log(`  ${stlumione ? "OK  " : "AWARIA"}  marker historyczny tłumi błąd i trafia do INFO${stlumione ? "" : "  ← tłumienie nie działa"}`);
  if (stlumione) ok++;

  // Kontrola tablicy po `id` — najczęstszy fałszywy alarm pierwszej wersji.
  bledy.length = 0; info.length = 0;
  regulaSymboli({ rel: "OK.md", tresc: "Temat `ZOFIA.topics.sama` jest wpięty.", rozmiar: 10, naglowek: null });
  const tablica = bledy.length === 0 && info.length === 0;
  console.log(`  ${tablica ? "OK  " : "AWARIA"}  tablica adresowana po \`id\` NIE świeci${tablica ? "" : "  ← fałszywy alarm wrócił"}`);
  if (tablica) ok++;

  // Kontrola dokumentu historycznego — dziennik ma prawo cytować przeszłość.
  bledy.length = 0; info.length = 0;
  regulaSciezek({ rel: "docs/dziennik.md", tresc: "Wtedy powstał `tools/juz_nie_istnieje.mjs`.", rozmiar: 10, naglowek: null });
  const historyczny = bledy.length === 0 && info.length === 1;
  console.log(`  ${historyczny ? "OK  " : "AWARIA"}  dokument historyczny cytuje przeszłość bez błędu${historyczny ? "" : "  ← dziennik świeci na czerwono"}`);
  if (historyczny) ok++;

  // ...ale ten sam cytat w dokumencie bieżącym MUSI zaświecić.
  bledy.length = 0; info.length = 0;
  regulaSciezek({ rel: "docs/systemy/walka.md", tresc: "Logika siedzi w `tools/juz_nie_istnieje.mjs`.", rozmiar: 10, naglowek: null });
  const biezacy = bledy.length === 1;
  console.log(`  ${biezacy ? "OK  " : "AWARIA"}  ten sam cytat w dokumencie BIEŻĄCYM świeci${biezacy ? "" : "  ← tłumienie jest za szerokie"}`);
  if (biezacy) ok++;

  /*
   * ⚠ Kontrola CRLF — dopisana 2026-09-07 po awarii, która trwała dwa dni
   * i była całkowicie niema: na dysku autora KAŻDY dokument ma `\r\n`, więc
   * parser nagłówka nie rozpoznawał ani jednego. Ta próba pilnuje, żeby
   * dokument z windowsowymi końcami linii miał czytany nagłówek maszynowy.
   */
  const crlf = parsujNaglowek("---\r\ntyp: STAN\r\ndomena: combat\r\n---\r\n\r\n# X\r\n".replace(/\r\n/g, "\n"));
  const crlfOk = crlf.naglowek?.typ === "STAN" && crlf.naglowek?.domena === "combat";
  console.log(`  ${crlfOk ? "OK  " : "AWARIA"}  nagłówek z końcami linii CRLF jest parsowany${crlfOk ? "" : "  ← wraca cicha awaria z 2026-09-07"}`);
  if (crlfOk) ok++;

  // §R — przekroczony limit POZA `STAN` ma być ostrzeżeniem, nie błędem (§7).
  bledy.length = 0; ostrzezenia.length = 0;
  regulaRozmiaru({ rel: "SABOTAŻ.md", tresc: "", rozmiar: 999_999, naglowek: { typ: "OPERACYJNE" } });
  const miekki = bledy.length === 0 && ostrzezenia.length === 1;
  console.log(`  ${miekki ? "OK  " : "AWARIA"}  §R poza \`STAN\` daje OSTRZEŻENIE, nie błąd${miekki ? "" : "  ← zła klasyfikacja surowości"}`);
  if (miekki) ok++;

  // §W — punkt wejścia sam sobie wolno, a roszczenie GŁĘBOKO w zwykłym
  // dokumencie (cytat w historii) nie świeci: reguła patrzy na strefę banera.
  bledy.length = 0;
  regulaPunktuWejscia({ rel: PUNKT_WEJSCIA, tresc: "ZACZYNASZ TU", rozmiar: 10, naglowek: null });
  regulaPunktuWejscia({ rel: "docs/dziennik.md", tresc: "x\n".repeat(100) + "checkpoint — ZACZYNASZ TU\n", rozmiar: 10, naglowek: null });
  regulaRejestru({ rel: "docs/zadania.md", tresc: "## ZAMKNIĘTE\n\n| OI-3 | ✅ ZAMKNIĘTE | x |\n", rozmiar: 10, naglowek: null });
  const wolno = bledy.length === 0;
  console.log(`  ${wolno ? "OK  " : "AWARIA"}  §W/§Z2 nie świecą poza swoim zakresem${wolno ? "" : "  ← fałszywy alarm"}`);
  if (wolno) ok++;

  // §A/§D — przerwa w pracy (brak wpisów) i wyjątek z powodem NIE są błędem.
  bledy.length = 0; ostrzezenia.length = 0;
  regulaAktualnosci({ rel: "docs/dziennik.md", tresc: "## 2026-10-11 (1) — x\n" },
    { rel: PUNKT_WEJSCIA, naglowek: { aktualizacja: "2026-10-11" } });
  regulaPokrycia([], ["src/legacy"], { "src/legacy": "powód próby" });
  const spokoj = bledy.length === 0 && ostrzezenia.length === 1;
  console.log(`  ${spokoj ? "OK  " : "AWARIA"}  §A milczy bez nowych wpisów, §D wyjątek z powodem daje OSTRZEŻENIE${spokoj ? "" : "  ← zła surowość"}`);
  if (spokoj) ok++;

  const wszystkich = proby.length + 9;
  console.log(`\n  ${ok}/${wszystkich} prób sabotażu zakończonych poprawnie.`);
  process.exit(ok === wszystkich ? 0 : 1);
}

if (SABOTAZ) sabotaz();

// ── Przebieg ───────────────────────────────────────────────────────────────

for (const dok of dokumenty) {
  regulaNaglowka(dok);
  regulaKotwic(dok);
  regulaSymboli(dok);
  regulaSciezek(dok);
  regulaRozmiaru(dok);
  regulaPunktuWejscia(dok);
  regulaBudzetu(dok);
  regulaRejestru(dok);
}
if (!dokumenty.some((d) => d.rel === PUNKT_WEJSCIA)) blad("§W", PUNKT_WEJSCIA, "brak punktu wejścia — sesja nie ma od czego zacząć");
regulaAktualnosci(dokumenty.find((d) => d.rel === "docs/dziennik.md"), dokumenty.find((d) => d.rel === PUNKT_WEJSCIA));
regulaPokrycia(
  dokumenty.filter((d) => d.naglowek?.typ === "STAN"),
  (await readdir(join(KORZEN, "src"), { withFileTypes: true })).filter((w) => w.isDirectory()).map((w) => `src/${w.name}`),
);
const stanyDomen = regulaZastepowania(dokumenty);
regulaIndeksu(dokumenty);
regulaTabel();

// ── Raport ─────────────────────────────────────────────────────────────────

const zNaglowkiem = dokumenty.filter((d) => d.naglowek).length;

console.log("=== przymiar dokumentacji ↔ kod ===\n");
console.log(`dokumentów przeskanowanych   ${dokumenty.length}`);
console.log(`z nagłówkiem maszynowym      ${zNaglowkiem} / ${dokumenty.length}`);
console.log(`domen w kontrakcie           ${DOMENY.size}`);
console.log(`domen z dokumentem STAN      ${stanyDomen.size} / ${DOMENY.size}`);
console.log(`wariantów broni w configu    ${WARIANTOW_BRONI}`);

const grupuj = (lista) => {
  const wg = new Map();
  for (const w of lista) {
    if (!wg.has(w.sekcja)) wg.set(w.sekcja, []);
    wg.get(w.sekcja).push(w);
  }
  return [...wg.entries()].sort();
};

const wypisz = (etykieta, lista) => {
  if (!lista.length) return;
  console.log(`\n--- ${etykieta} (${lista.length}) ---`);
  for (const [sekcja, wpisy] of grupuj(lista)) {
    console.log(`\n  ${sekcja}`);
    for (const w of wpisy) console.log(`    ${w.plik}: ${w.tresc}`);
  }
};

wypisz("BŁĘDY", bledy);
wypisz("OSTRZEŻENIA", ostrzezenia);
if (PELNY) wypisz("INFO — świadome odwołania historyczne", info);
else if (info.length) console.log(`\n(${info.length} wpisów INFO — świadome odwołania historyczne; \`--pelny\`, żeby je zobaczyć)`);

console.log(
  `\n${bledy.length ? "❌" : "✅"} BŁĘDÓW: ${bledy.length} · OSTRZEŻEŃ: ${ostrzezenia.length} · INFO: ${info.length}`,
);
console.log("Nic nie zapisano — ten przymiar wyłącznie czyta.");
process.exit(bledy.length ? 1 : 0);

/**
 * Przymiar viewportu — niezmiennik `B-1`: `cssSize()` NIGDY nie zwraca zera.
 *
 * ── Po co to istnieje ──────────────────────────────────────────────────────
 * Bo awaria była **cicha i całkowita**. `main.ts` woła `cssSize()` w trakcie
 * ewaluacji modułu i wynikiem karmi `Phaser.Game`. Dokument bez layoutu
 * raportuje `0`, Phaser tworzy framebuffer **0×0**, WebGL odpowiada
 * `INCOMPLETE_ATTACHMENT`, renderer ginie na niezłapanym wyjątku i **żadna
 * scena nie startuje** — czarny ekran, zero komunikatów w grze.
 *
 * ⚠ **Zaobserwowane naprawdę, nie wydedukowane** (2026-09-15, panel
 * przeglądarki): `game.config` pokazywał `{w:0,h:0}` przy `game.scale` już
 * 1024×768, a ręcznie zbudowany framebuffer 0×0 dawał dokładnie ten sam status
 * WebGL, co gra.
 *
 * ⚠ **`tsc` tego nie złapie i nie złapie żaden test rozgrywki** — typy są
 * poprawne, a zero jest legalną liczbą. Dlatego niezmiennik potrzebuje
 * własnego strażnika.
 *
 * ── Jak to działa ─────────────────────────────────────────────────────────
 * Ładuje **prawdziwy** `src/core/Viewport.ts` (esbuild → ESM → import) i karmi
 * go podstawionym `window`/`document`. ⛔ Nie kopiuje wzoru — kopia rozjechałaby
 * się cicho przy pierwszej zmianie kolejki zejść.
 *
 * ── Przymiar, nie generator ───────────────────────────────────────────────
 * **Nic nie zapisuje.**
 *
 * Użycie:
 *   node tools/viewport_przymiar.mjs             # raport
 *   node tools/viewport_przymiar.mjs --sabotaz   # autotest: czy umie na czerwono
 */

import { build } from "esbuild";
import { unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const SABOTAZ = process.argv.includes("--sabotaz");

/**
 * Podstaw globalne `window`/`document` opisujące jedno okno.
 *
 * `Viewport.ts` czyta je dopiero w ciele funkcji, więc wolno je przestawiać
 * między wywołaniami.
 */
function ustawOkno({ parent, inner, doc, screen }) {
  globalThis.window = {
    innerWidth: inner?.[0] ?? 0,
    innerHeight: inner?.[1] ?? 0,
    screen: screen ? { width: screen[0], height: screen[1] } : undefined,
    devicePixelRatio: 1,
    location: { search: "" },
  };
  globalThis.document = {
    getElementById: (id) =>
      id === "game" && parent ? { clientWidth: parent[0], clientHeight: parent[1] } : null,
    documentElement: doc ? { clientWidth: doc[0], clientHeight: doc[1] } : null,
  };
}

// ── Wczytanie PRAWDZIWEGO Viewport.ts ──────────────────────────────────────
// `import.meta.env.DEV` podmieniamy na `false`: `devOverride()` to ścieżka
// deweloperska i nie należy do niezmiennika, którego pilnujemy.
const tmp = join(KORZEN, "node_modules", ".viewport-przymiar.mjs");
await build({
  entryPoints: [join(KORZEN, "src", "core", "Viewport.ts")],
  outfile: tmp,
  format: "esm",
  bundle: false,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
});
const { cssSize } = await import(pathToFileURL(tmp).href);
await unlink(tmp).catch(() => {});

/** Od normalnego okna po dokument bez ŻADNEGO źródła rozmiaru. */
const PRZYPADKI = [
  {
    n: "normalne okno (kontener + okno)",
    w: { parent: [1024, 768], inner: [1024, 768], doc: [1024, 768], screen: [1920, 1080] },
    oczekiwane: [1024, 768],
  },
  {
    n: "brak kontenera `#game`",
    w: { parent: null, inner: [800, 600], doc: [800, 600], screen: [1920, 1080] },
    oczekiwane: [800, 600],
  },
  {
    n: "⭐ B-1: kontener i okno zerowe",
    w: { parent: [0, 0], inner: [0, 0], doc: [1280, 720], screen: [1920, 1080] },
    oczekiwane: [1280, 720],
  },
  {
    n: "⭐ B-1: wszystko zerowe poza ekranem",
    w: { parent: [0, 0], inner: [0, 0], doc: [0, 0], screen: [1920, 1080] },
    oczekiwane: [1920, 1080],
  },
  {
    n: "⭐⭐ B-1: ŻADNEGO źródła rozmiaru",
    w: { parent: null, inner: [0, 0], doc: null, screen: null },
    oczekiwane: null,
  },
  {
    n: "zerowa tylko WYSOKOŚĆ (pasek systemowy)",
    w: { parent: [1024, 0], inner: [1024, 0], doc: [1024, 768], screen: [1920, 1080] },
    oczekiwane: [1024, 768],
  },
  {
    n: "zerowa tylko SZEROKOŚĆ",
    w: { parent: [0, 768], inner: [0, 768], doc: [1024, 768], screen: [1920, 1080] },
    oczekiwane: [1024, 768],
  },
];

const wiersze = [];

/**
 * Przepuść wszystkie przypadki przez `mierz` i policz błędy.
 *
 * ⚠ Funkcja pomiarowa jest PARAMETREM, nie domknięciem — dzięki temu
 * `--sabotaz` podmienia to, co przymiar naprawdę wywołuje, zamiast liczyć
 * predykat obok niego. Pierwsza wersja robiła to drugie i świeciła na zielono,
 * nie dotykając `przebieg()`.
 */
function przebieg(mierz, { cichoWarn = true } = {}) {
  let bledy = 0;
  wiersze.length = 0;
  const realWarn = console.warn;
  if (cichoWarn) console.warn = () => {};

  for (const p of PRZYPADKI) {
    ustawOkno(p.w);
    let wynik;
    let wyjatek = null;
    try {
      wynik = mierz();
    } catch (e) {
      wyjatek = e;
      wynik = { width: NaN, height: NaN };
    }

    // ⚠⚠ TO JEST CAŁY NIEZMIENNIK: żadna oś nie może być zerem ani NaN-em.
    const nieZero =
      Number.isFinite(wynik.width) &&
      Number.isFinite(wynik.height) &&
      wynik.width > 0 &&
      wynik.height > 0;
    const zgodne =
      p.oczekiwane === null
        ? nieZero
        : wynik.width === p.oczekiwane[0] && wynik.height === p.oczekiwane[1];
    const ok = nieZero && zgodne;
    if (!ok) bledy++;
    wiersze.push({
      nazwa: p.n,
      wynik: `${wynik.width}×${wynik.height}`,
      oczek: p.oczekiwane ? `${p.oczekiwane[0]}×${p.oczekiwane[1]}` : "cokolwiek > 0",
      ok,
      uwaga: wyjatek ? `WYJĄTEK: ${wyjatek.message}` : "",
    });
  }

  console.warn = realWarn;
  return bledy;
}

// ── Autotest: czy przymiar umie zaświecić na czerwono ──────────────────────
// ⚠ tools/CLAUDE.md: „Asercja, która nie potrafi zaświecić na czerwono, jest
//   dekoracją". Pierwsza pozycja odtwarza DOKŁADNIE kod sprzed `B-1`.
if (SABOTAZ) {
  const czysty = przebieg(cssSize);
  console.log(`przebieg czysty: ${czysty} błędów`);
  console.log("");

  const sabotaze = [
    [
      "kod sprzed B-1 (bez kolejki zejść)",
      () => ({
        width: document.getElementById("game")?.clientWidth || window.innerWidth,
        height: document.getElementById("game")?.clientHeight || window.innerHeight,
      }),
    ],
    ["stała zerowa wysokość", () => ({ width: 1024, height: 0 })],
    ["NaN w obu osiach", () => ({ width: NaN, height: NaN })],
    ["liczba ujemna", () => ({ width: -1, height: -1 })],
  ];

  let zle = 0;
  for (const [nazwa, zepsute] of sabotaze) {
    const n = przebieg(zepsute);
    const wykryty = n > czysty;
    if (!wykryty) zle++;
    console.log(`${wykryty ? "✅" : "⛔"} ${nazwa.padEnd(38)} ${n} błędów (czysty: ${czysty})`);
  }
  console.log("");
  console.log(
    zle === 0
      ? "✅ Każdy sabotaż wykryty."
      : `⛔ ${zle} sabotaży PRZESZŁO — przymiar jest dekoracją.`,
  );
  process.exit(zle === 0 ? 0 : 1);
}

const bledy = przebieg(cssSize);

console.log("PRZYMIAR VIEWPORTU — niezmiennik B-1: `cssSize()` nigdy nie zwraca zera");
console.log("");
for (const w of wiersze) {
  console.log(
    `${w.ok ? "✅" : "⛔"} ${w.nazwa.padEnd(42)} → ${w.wynik.padEnd(11)} (oczekiwane ${w.oczek}) ${w.uwaga}`,
  );
}
console.log("");
console.log("⚠ Framebuffer 0×0 daje w WebGL `INCOMPLETE_ATTACHMENT` — renderer Phasera ginie,");
console.log("  żadna scena nie startuje, a gra nie ma jak tego zgłosić. Stąd ten przymiar.");
console.log("");
console.log(`${bledy === 0 ? "✅" : "⛔"} BŁĘDÓW: ${bledy}`);
console.log("Nic nie zapisano — ten przymiar wyłącznie czyta.");
process.exit(bledy === 0 ? 0 : 1);

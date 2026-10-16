/**
 * Przymiar układu kontrolek bojowych (`HUD_LAYOUT` + `src/ui/ControlLayout.ts`).
 *
 * ⚠ **Uruchamia PRAWDZIWY `ControlLayout.ts`, nie własną kopię wzoru.** Kąt i
 * promień zamieniają się na punkt w jednym miejscu w całym projekcie; drugie
 * takie miejsce w tym pliku rozjechałoby się z grą przy pierwszej zmianie
 * konwencji kąta, a diff by tego nie pokazał. Stubowane są tylko `theme`
 * (ciągnie Phasera i DOM) i `phaser` — ta sama sztuczka i ten sam powód, co
 * przy `EventBus` w `stamina_weryfikacja.mjs`.
 *
 * ⚠ **Przegub kciuka jest MODELEM, nie pomiarem.** Przyjęty punkt to
 * `(uiW − 27, uiH + 30)`, czyli tuż poza prawym dolnym rogiem — stąd biorą się
 * wszystkie milimetry niżej. Zasięg funkcjonalny kciuka ~55 mm i pasmo wygody
 * 30–50 mm pochodzą z literatury ergonomicznej, nie z pomiaru na tym
 * urządzeniu. **Ten plik potrafi obalić układ arytmetycznie (nakładki, wyjście
 * poza ekran, margines krawędzi, próg dotykowy); nie potrafi rozstrzygnąć, czy
 * coś jest wygodne.** To zostaje kciukowi na S21 FE.
 *
 * Kod wyjścia ≠ 0, gdy którakolwiek asercja padnie.
 *
 *   node tools/hud_uklad.mjs
 */

import { build } from "esbuild";
import { unlink, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), "..");
const stubTheme = join(KORZEN, "node_modules", ".theme-stub.ts");
const stubPhaser = join(KORZEN, "node_modules", ".phaser-stub.ts");
const tmp = join(KORZEN, "node_modules", ".hud-layout.mjs");

/* ── Parametry urządzenia: Samsung S21 FE w poziomie ───────────────────── */
const CSS_W = 891;
const CSS_H = 411;
/** Szerokość fizyczna ekranu 6,4" 20:9 w mm — do przeliczenia jednostek na mm. */
const MM_W = 148.3;
/** Krótsza oś, przy której skala UI wynosi 1 (UI_SCALE.designShortAxis). */
const DESIGN_SHORT = 580;
/**
 * Minimalny margines przy PRAWEJ krawędzi (~1,9 mm) — chwyt i etui.
 * ⚠ Do 2026-10-11 stał tu pas nawigacji One UI (40 j., zmierzony na zrzucie),
 * bo pasek był widoczny na stałe. Od trybu immersive z paskami „na chwilę"
 * (`MainActivity`) rezerwa zeszła — patrz nagłówek `HUD_LAYOUT`.
 * ⚠ Celowo STAŁA tego pliku, nie `HUD_LAYOUT.edgeRight`: próg wzięty z tego,
 * co sprawdzamy, porównywałby konfig sam ze sobą i nie umiałby zaświecić.
 */
const KRAWEDZ_J = 16;
/** Minimalny prześwit między sąsiednimi celami dotykowymi. */
const PRZESWIT = 11;

const fit = Math.min(CSS_W, CSS_H) / DESIGN_SHORT;
const UI_W = CSS_W / fit;
const UI_H = CSS_H / fit;
const MM_NA_J = (MM_W / CSS_W) * fit;

await writeFile(
  stubTheme,
  `export function uiW() { return ${UI_W}; }
   export function uiH() { return ${UI_H}; }\n`,
);
await writeFile(
  stubPhaser,
  `const Phaser = { Math: { DegToRad: (d) => (d * Math.PI) / 180 } };
   export default Phaser;\n`,
);

await build({
  entryPoints: [join(KORZEN, "src", "ui", "ControlLayout.ts")],
  outfile: tmp,
  format: "esm",
  bundle: true,
  logLevel: "silent",
  define: { "import.meta.env.DEV": "false" },
  plugins: [
    {
      name: "stuby",
      setup(b) {
        b.onResolve({ filter: /core\/theme$/ }, () => ({ path: stubTheme }));
        b.onResolve({ filter: /^phaser$/ }, () => ({ path: stubPhaser }));
      },
    },
  ],
});

const L = await import(pathToFileURL(tmp).href);
const { HUD_LAYOUT } = await import(pathToFileURL(await bundleConfig()).href);

async function bundleConfig() {
  const out = join(KORZEN, "node_modules", ".hud-config.mjs");
  await build({
    entryPoints: [join(KORZEN, "src", "config", "GameConfig.ts")],
    outfile: out,
    format: "esm",
    bundle: true,
    logLevel: "silent",
  });
  return out;
}

/* ── Zbierz wszystkie kontrolki klastra ────────────────────────────────── */

const scena = {}; // stub theme ignoruje argument
const kontrolki = [];
/** Błędy zebrane przy budowie listy — dołączane do `bledy` niżej. */
const bledy0 = [];

const kotwica = L.combatAnchor(scena);
kontrolki.push({ nazwa: "atak", ...kotwica, rozmiar: HUD_LAYOUT.attackRadius * 2 });

// ⭐ Od 2026-10-12 pierścień to sama geometria, a CO na nim stoi mówi
// `HUD_LAYOUT.place` — przymiar idzie po przypisaniach, nie po pierścieniach,
// żeby nazwa w tabeli mówiła, jaka kontrolka tam jest.
const opisy = {
  ability: (i) => `umiej. ${i + 1}`,
  swap: () => "zestaw broni",
  quick: (i) => ["mikstura", "jedzenie"][i] ?? `szybki ${i + 1}`,
  mode: () => "tryb ataku",
  context: () => "kontekst",
};
const zajete = new Map();
for (const kind of Object.keys(HUD_LAYOUT.place)) {
  const n = L.capacityOf(kind);
  for (let i = 0; i < n; i++) {
    const pl = L.placeOf(kind, i);
    const p = L.slotOf(scena, kind, i);
    const nazwa = (opisy[kind] ?? ((j) => `${kind}[${j}]`))(i);
    if (!pl || !p) {
      bledy0.push(`BŁĄD: "${nazwa}" wskazuje slot, którego pierścień nie ma (${JSON.stringify(pl)}).`);
      continue;
    }
    // ⚠ Dwie kontrolki na JEDNYM slocie rysują się jedna na drugiej i kradną
    // sobie tapnięcie — arytmetyka odległości tego nie złapie (zero = „ta sama").
    const klucz = pl.join(":");
    if (zajete.has(klucz)) bledy0.push(`BŁĄD: "${nazwa}" i "${zajete.get(klucz)}" na tym samym slocie ${klucz}.`);
    zajete.set(klucz, nazwa);
    kontrolki.push({ nazwa, ...p, rozmiar: L.cellOf(kind, i) });
  }
}
// ⚠ Pasek ma tyle miejsc, ile slotów `ABILITY_SLOTS` — inaczej nadmiarowa
// umiejętność istnieje w panelu, a na ekranie walki jej nie ma.
const slotyM = readFileSync(join(KORZEN, "src", "config", "GameConfig.ts"), "utf8").match(/export const ABILITY_SLOTS = (\d+);/);
if (!slotyM) bledy0.push("BŁĄD: nie odczytano ABILITY_SLOTS z GameConfig.ts");
else if (L.capacityOf("ability") < Number(slotyM[1])) {
  bledy0.push(`BŁĄD: ABILITY_SLOTS = ${slotyM[1]}, a HUD_LAYOUT.place.ability ma ${L.capacityOf("ability")} miejsc.`);
}

/* ── Asercje ───────────────────────────────────────────────────────────── */

const bledy = [...bledy0];
const przegub = { x: UI_W - 27, y: UI_H + 30 };
const mm = (j) => j * MM_NA_J;

console.log(`Ekran: ${CSS_W}×${CSS_H} CSS → przestrzeń wirtualna ${UI_W.toFixed(0)}×${UI_H.toFixed(0)} j.`);
console.log(`1 j. = ${MM_NA_J.toFixed(4)} mm | margines krawędzi: x ≤ ${(UI_W - KRAWEDZ_J).toFixed(0)} j.\n`);
console.log("kontrolka    |    x |    y | ⌀ j. |  ⌀ mm | od kciuka");
console.log("-------------|------|------|------|-------|----------");

for (const k of kontrolki) {
  const d = Math.hypot(k.x - przegub.x, k.y - przegub.y);
  console.log(
    `${k.nazwa.padEnd(12)} | ${k.x.toFixed(0).padStart(4)} | ${k.y.toFixed(0).padStart(4)} | ` +
      `${String(k.rozmiar).padStart(4)} | ${mm(k.rozmiar).toFixed(1).padStart(5)} | ${mm(d).toFixed(1)} mm`,
  );

  // 1. Próg dotykowy.
  if (k.rozmiar < HUD_LAYOUT.minTouch) {
    bledy.push(`BŁĄD: "${k.nazwa}" ma ${k.rozmiar} j. — poniżej progu ${HUD_LAYOUT.minTouch} j.`);
  }
  // 2. Mieści się na ekranie.
  const r = k.rozmiar / 2;
  if (k.x - r < 0 || k.y - r < 0 || k.x + r > UI_W || k.y + r > UI_H) {
    bledy.push(`BŁĄD: "${k.nazwa}" wychodzi poza ekran (x ${k.x.toFixed(0)}, y ${k.y.toFixed(0)}, ⌀ ${k.rozmiar}).`);
  }
  // 3. Nie wchodzi w margines krawędzi.
  if (k.x + r > UI_W - KRAWEDZ_J) {
    bledy.push(`BŁĄD: "${k.nazwa}" wchodzi w margines krawędzi (prawa krawędź ${(k.x + r).toFixed(0)} > ${(UI_W - KRAWEDZ_J).toFixed(0)}).`);
  }
  // 4. W zasięgu kciuka.
  if (mm(d) > 55) {
    bledy.push(`BŁĄD: "${k.nazwa}" jest ${mm(d).toFixed(1)} mm od kciuka — poza zasięgiem funkcjonalnym (55 mm).`);
  }
}

// 5. Brak nakładek.
let najciasniej = Infinity;
let para = "";
for (let i = 0; i < kontrolki.length; i++) {
  for (let j = i + 1; j < kontrolki.length; j++) {
    const a = kontrolki[i];
    const b = kontrolki[j];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const wymagane = a.rozmiar / 2 + b.rozmiar / 2 + PRZESWIT;
    if (d - wymagane < najciasniej) {
      najciasniej = d - wymagane;
      para = `${a.nazwa} ↔ ${b.nazwa}`;
    }
    if (d < wymagane) {
      bledy.push(`BŁĄD: "${a.nazwa}" i "${b.nazwa}" za blisko — ${d.toFixed(0)} j. przy wymaganych ${wymagane.toFixed(0)}.`);
    }
  }
}

console.log(`\nNajciaśniejsza para: ${para} — ${najciasniej.toFixed(0)} j. zapasu ponad wymagany prześwit ${PRZESWIT}.`);

/* ── 5b. Kolumna wyboru trybu ataku (2026-10-12) ─────────────────────── */
// Rozwija się na chwilę, ale w tej chwili jej przyciski stoją obok mikstury
// i jedzenia — nakładka znaczyłaby, że tapnięcie wyboru pije miksturę.
// Najszerszy przypadek: 3 warianty + „✕" = 4 przyciski. Zasięgu kciuka
// nie sprawdzamy — wybór jest rzadki i świadomie daleko.
const menu = [0, 1, 2, 3].map((i) => ({
  nazwa: i === 3 ? "menu ✕" : `menu ${i + 1}`,
  ...L.modeMenuSlot(scena, i),
  rozmiar: L.cellOf("mode"),
}));
for (const m of menu) {
  const r = m.rozmiar / 2;
  if (m.x - r < 0 || m.y - r < 0 || m.x + r > UI_W || m.y + r > UI_H) {
    bledy.push(`BŁĄD: "${m.nazwa}" wychodzi poza ekran (x ${m.x.toFixed(0)}, y ${m.y.toFixed(0)}).`);
  }
  for (const k of [...kontrolki, ...menu]) {
    if (k === m) continue;
    const d = Math.hypot(k.x - m.x, k.y - m.y);
    const wym = k.rozmiar / 2 + r + PRZESWIT;
    if (d < wym && !(menu.indexOf(k) >= 0 && menu.indexOf(k) < menu.indexOf(m))) {
      bledy.push(`BŁĄD: "${m.nazwa}" i "${k.nazwa}" za blisko — ${d.toFixed(0)} j. przy wymaganych ${wym.toFixed(0)}.`);
    }
  }
}
console.log(`
kolumna trybu ataku: x ${menu[0].x.toFixed(0)}, y ${menu[3].y.toFixed(0)}–${menu[0].y.toFixed(0)} (4 przyciski)`);

/* ── 6. Minimapa (wejście do panelu, 2026-10-11) — PROSTOKĄT, nie koło ──── */
// ⚠ Odległość liczona od krawędzi prostokąta do OBWODU koła, nie środek–środek:
// przycisk kontekstowy stoi prosto pod minimapą i środek–środek przepuściłby
// nakładkę rogu. Zasięgu kciuka tu nie ma — to kontrolka rzadka i świadomie
// daleko (pilność × częstotliwość, `src/ui/CLAUDE.md`).
const mini = L.minimapRect(scena);
const mmPrawa = mini.x + mini.size;
const mmDol = mini.y + mini.size;
console.log(`\nminimapa: x ${mini.x.toFixed(0)}–${mmPrawa.toFixed(0)}, y ${mini.y}–${mmDol}, bok ${mini.size} j. (${mm(mini.size).toFixed(1)} mm)`);
if (mini.size < HUD_LAYOUT.minTouch) {
  bledy.push(`BŁĄD: minimapa ma ${mini.size} j. — poniżej progu ${HUD_LAYOUT.minTouch} j.`);
}
if (mini.x < 0 || mini.y < 0 || mmPrawa > UI_W || mmDol > UI_H) {
  bledy.push(`BŁĄD: minimapa wychodzi poza ekran.`);
}
if (mmPrawa > UI_W - KRAWEDZ_J) {
  bledy.push(`BŁĄD: minimapa wchodzi w margines krawędzi (prawa krawędź ${mmPrawa.toFixed(0)} > ${(UI_W - KRAWEDZ_J).toFixed(0)}).`);
}
let mmNajblizej = Infinity;
let mmSasiad = "";
for (const k of kontrolki) {
  const dx = Math.max(mini.x - k.x, 0, k.x - mmPrawa);
  const dy = Math.max(mini.y - k.y, 0, k.y - mmDol);
  const luz = Math.hypot(dx, dy) - k.rozmiar / 2;
  if (luz < mmNajblizej) {
    mmNajblizej = luz;
    mmSasiad = k.nazwa;
  }
  if (luz < PRZESWIT) {
    bledy.push(`BŁĄD: minimapa i "${k.nazwa}" za blisko — ${luz.toFixed(0)} j. prześwitu przy wymaganych ${PRZESWIT}.`);
  }
}
console.log(`najbliżej minimapy: ${mmSasiad} — ${mmNajblizej.toFixed(0)} j. prześwitu (wymagane ${PRZESWIT}).`);

/* ── 6b. Przycisk MENU (wejście do panelu, 2026-10-12) ─────────────────── */
// Na LEWO od minimapy, wyrównany do jej góry. Na telefonie to JEDYNE wejście
// do ekwipunku i zapisu, więc: próg dotykowy, ekran, prześwit do minimapy
// (prostokąt–prostokąt) i do każdej kontrolki klastra (prostokąt–koło).
const menu_ = L.menuButtonRect(scena);
const mnPrawa = menu_.x + menu_.size;
const mnDol = menu_.y + menu_.size;
console.log(`przycisk menu: x ${menu_.x.toFixed(0)}–${mnPrawa.toFixed(0)}, y ${menu_.y}–${mnDol}, bok ${menu_.size} j. (${mm(menu_.size).toFixed(1)} mm)`);
if (menu_.size < HUD_LAYOUT.minTouch) {
  bledy.push(`BŁĄD: przycisk menu ma ${menu_.size} j. — poniżej progu ${HUD_LAYOUT.minTouch} j.`);
}
if (menu_.x < 0 || menu_.y < 0 || mnPrawa > UI_W || mnDol > UI_H) {
  bledy.push(`BŁĄD: przycisk menu wychodzi poza ekran.`);
}
const luzMinimapa = mini.x - mnPrawa;
if (luzMinimapa < PRZESWIT) {
  bledy.push(`BŁĄD: przycisk menu i minimapa za blisko — ${luzMinimapa.toFixed(0)} j. przy wymaganych ${PRZESWIT}.`);
}
for (const k of kontrolki) {
  const dx = Math.max(menu_.x - k.x, 0, k.x - mnPrawa);
  const dy = Math.max(menu_.y - k.y, 0, k.y - mnDol);
  const luz = Math.hypot(dx, dy) - k.rozmiar / 2;
  if (luz < PRZESWIT) {
    bledy.push(`BŁĄD: przycisk menu i "${k.nazwa}" za blisko — ${luz.toFixed(0)} j. prześwitu przy wymaganych ${PRZESWIT}.`);
  }
}
console.log(`przycisk menu ↔ minimapa: ${luzMinimapa.toFixed(0)} j. prześwitu.`);

/* ── 6c. Kartka pergaminu minimapy (2026-10-13, D15) ───────────────────── */
// Kartka z cieniem rysuje się W ŚRODKU kwadratu minimapy — bok jest
// wyprowadzony z przycisku `E` (§6), więc ozdoba nie może go po cichu
// powiększyć. Drugie pytanie: rozdarcie i nacięcie nie mogą dojść do okna
// mapy (kontur na rysunku czytałby się jak dziura w mapie).
const kartkaTmp = join(KORZEN, "node_modules", ".map-parchment.mjs");
await build({ entryPoints: [join(KORZEN, "src", "ui", "MapParchment.ts")], outfile: kartkaTmp, format: "esm", bundle: true, logLevel: "silent" });
const { parchmentLayout } = await import(pathToFileURL(kartkaTmp).href);
await unlink(kartkaTmp).catch(() => {});
function sprawdzKartke(k, bok, cell) {
  const b = [];
  const poza = (r) => r.x < 0 || r.y < 0 || r.x + r.w > bok || r.y + r.h > bok;
  if (k.rects.some(poza)) b.push("obrzeże wychodzi poza kwadrat minimapy");
  if (k.silhouette.some((r) => poza({ ...r, x: r.x + k.shadow.dx, y: r.y + k.shadow.dy }))) b.push("cień wychodzi poza kwadrat minimapy");
  const c = k.content;
  if (poza(c)) b.push("okno mapy wychodzi poza kwadrat");
  // Kontur (rozdarcie, nacięcie) musi stać co najmniej komórkę od okna mapy.
  const dotyka = k.rects.some(
    (r) => r.tone === "outline" && r.x < c.x + c.w + cell && r.x + r.w > c.x - cell && r.y < c.y + c.h + cell && r.y + r.h > c.y - cell,
  );
  if (dotyka) b.push("kontur kartki dochodzi do okna mapy (rozdarcie albo nacięcie za głębokie)");
  return b;
}
{
  const F = HUD_LAYOUT.minimap.frame;
  const k = parchmentLayout(mini.size, F);
  // ⚠ Kontrola: przesunięta kartka i kontur wsunięty pod okno MUSZĄ zaświecić.
  const przesunieta = { ...k, rects: k.rects.map((r) => ({ ...r, x: r.x + 4 })) };
  const wsuniety = { ...k, rects: [...k.rects, { x: k.content.x, y: k.content.y - F.cell, w: F.cell, h: F.cell, tone: "outline" }] };
  const kontrola = sprawdzKartke(przesunieta, mini.size, F.cell).length > 0 && sprawdzKartke(wsuniety, mini.size, F.cell).length > 0;
  if (!kontrola) bledy.push("BŁĄD: §6c — kontrola na zepsutej kartce nie zaświeciła (asercja jest dekoracją).");
  for (const e of sprawdzKartke(k, mini.size, F.cell)) bledy.push(`BŁĄD: kartka minimapy — ${e}.`);
  console.log(`kartka minimapy: okno mapy ${k.content.w}×${k.content.h} j. (${k.content.w / (4 * HUD_LAYOUT.minimap.zoom)} kafli w poprzek), obrzeże ${k.rects.length} prostokątów, kontrola §6c ${kontrola ? "świeci" : "NIE ŚWIECI"}.`);
}

/* ── 7. „Kontrolka bojowa po prawej" (OI-53, 2026-10-11) ──────────────── */
// Drążek przejmuje KAŻDE dotknięcie w lewej części ekranu (`VirtualJoystick`),
// więc kontrolka postawiona tam bije się o palec z prowadzeniem — po cichu.
// Granica czytana z TEKSTU `VirtualJoystick.ts`, nie przepisana tutaj.
const drazekSrc = readFileSync(join(KORZEN, "src", "ui", "VirtualJoystick.ts"), "utf8");
const granicaM = drazekSrc.match(/uiW\(this\.scene\) \* ([0-9.]+)/);
if (!granicaM) {
  bledy.push("BŁĄD: nie odczytano granicy strefy drążka z src/ui/VirtualJoystick.ts — §7 ślepy");
} else {
  const granica = UI_W * Number(granicaM[1]);
  for (const k of [...kontrolki, ...menu]) {
    if (k.x - k.rozmiar / 2 < granica) {
      bledy.push(`BŁĄD: "${k.nazwa}" wchodzi w strefę drążka (lewa krawędź ${(k.x - k.rozmiar / 2).toFixed(0)} < ${granica.toFixed(0)}).`);
    }
  }
  if (mini.x < granica) bledy.push(`BŁĄD: minimapa wchodzi w strefę drążka (x ${mini.x.toFixed(0)} < ${granica.toFixed(0)}).`);
  if (menu_.x < granica) bledy.push(`BŁĄD: przycisk menu wchodzi w strefę drążka (x ${menu_.x.toFixed(0)} < ${granica.toFixed(0)}).`);
  console.log(`strefa drążka: x < ${granica.toFixed(0)} j. — kontrolki poza nią.`);
}

/* ── 8. Budżet palców (OI-53) ────────────────────────────────────────────── */
// Phaser domyślnie daje JEDEN pointer dotykowy; `main.ts` podnosi to do 2
// i ta linia jest nośna (`src/ui/CLAUDE.md`): bez niej przy trzymanym
// drążku nie da się nacisnąć ataku — drugie dotknięcie znika bez zdarzenia.
const mainSrc = readFileSync(join(KORZEN, "src", "main.ts"), "utf8");
const palceM = mainSrc.match(/activePointers:\s*(\d+)/);
if (!palceM || Number(palceM[1]) < 2) {
  bledy.push(`BŁĄD: input.activePointers = ${palceM ? palceM[1] : "brak"} w src/main.ts — potrzeba ≥ 2 (lewy kciuk prowadzi, prawy działa).`);
} else {
  console.log(`budżet palców: activePointers = ${palceM[1]}.`);
}

await Promise.all([unlink(stubTheme), unlink(stubPhaser), unlink(tmp)].map((p) => p.catch(() => {})));

if (bledy.length) {
  console.error(`\n${bledy.length} BŁĘDÓW:`);
  for (const b of bledy) console.error("  " + b);
  process.exit(1);
}
console.log("\nOK — wszystkie asercje przeszły.");

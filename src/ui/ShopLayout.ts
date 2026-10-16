import { DOLL_CELLS, DOLL_COLS, DOLL_ROWS, type DollCell } from "./PaperDoll";

/**
 * ── UKŁAD PANELU HANDLU — CZYSTA GEOMETRIA ─────────────────────────────────
 *
 * ⚠ **Zero Phasera, zero stanu.** Ten sam powód, co przy `EquipLayout.ts`
 * i `ControlLayout.ts`: układ, który liczy się bez sceny, **sprawdza się bez
 * uruchamiania gry** (`node tools/sklep_uklad.mjs`). `ShopPanel.ts` importuje
 * stąd wszystkie liczby, więc drugiego rachunku tej samej geometrii nie ma.
 *
 * ⭐⭐ **ETAP E (2026-10-13): KUPIEC | GRACZ | KARTA — trzy kolumny, każda
 * kolumna przedmiotów z WŁASNYMI zakładkami.** Cztery równe kolumny
 * (`KUPIEC → PLECAK → ZAŁOŻONE → SZCZEGÓŁY`, 2026-09-19) dawały na telefonie
 * kafel 57–62 j. < 68 i tekst 7–8 dp.
 *
 * ⚠⚠ **Decyzje autora 2026-10-13, po zrzutach 1:1 — ⛔ nie cofaj bez nowej:**
 * - towar kupca to KAFLE, nie lista wierszy (research rekomendował listę, jak
 *   w oglądanych grach mobilnych): przedmiot wygląda tak samo wszędzie;
 * - kupiec i gracz widoczni NARAZ, karta trzecią kolumną („byłoby o wiele
 *   łatwiej") — sprzedaż to dotknięcie własnej rzeczy, bez zakładki „Sprzedaj";
 * - ten sam przełącznik po obu stronach: kupiec **Kup | Odkup**, gracz
 *   **Plecak | Na sobie** (sylwetka jak w panelu gracza); naprawa należy do
 *   rzeczy gracza (karta + „Napraw wszystko" na wizytówce kupca);
 * - menu boczne w Handlu ma same ikony (miejsce), w rozmowie podpisy zostają.
 *
 * ```
 * ┌──────────────────────┬──────────────────────┬─────────────────────────┐
 * │ [  Kup  ][ Odkup  ]  │ [ Plecak ][Na sobie] │ [↩ Cofnij…] ◉ 3 020  ⓘ │
 * ├──────────────────────┼──────────────────────┼─────────────────────────┤
 * │ ⚔ ⛨ ◫ …  kategorie   │ Wszystko ⚔ ⛨ …       │ ┌──┐ Miecz      masz: 1 │
 * │ [▮][▮][▮][▮]         │ [▮][▮][  ][▮]        │ │  │ Broń · Dobra        │
 * │ [▮][▮][  ][▮]  kafle │ [▮][▮][▮][▮]  plecak │ └──┘ ATAK  Obr.  9–14   │
 * │ [▮][▮][▮][▮]  68 j.  │ [  ][▮][  ][  ]      │ [Zestaw I][Zestaw II]   │
 * │ …   cena na kaflu    │ …  (albo sylwetka)   │ ZESTAW I · Miecz …      │
 * │                      │                      │ [−] 1 [+] [Max]         │
 * │                      │                      │ [     Kup · 340 g     ] │
 * └──────────────────────┴──────────────────────┴─────────────────────────┘
 * ```
 *
 * ⛔ **Manekin nie stoi w sklepie na stałe** (R4): „co noszę" mówi porównanie
 * na karcie (broń z OBOMA zestawami — D10, pancerz z tym samym adresem slot +
 * warstwa, obciążenie po → teraz). Sylwetka to WIDOK „Na sobie" kolumny gracza.
 */

/** Zacisk — lokalna kopia, bo ten plik nie importuje Phasera. */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Siatka jednej kolumny: ile kolumn, jak duże pole, jaki odstęp. */
export interface ShopGridSpec {
  readonly cols: number;
  readonly cell: number;
  readonly gap: number;
  /**
   * ⚠⚠ **WYSOKOŚĆ JEDNEGO POLA — równa `cell`.** Rzecz `1×2` zajmuje DWA pola
   * (gabaryt), a nie rozsunięty rząd: ⛔ nie rozsuwaj rzędów pod najwyższą
   * ikonę — to pogarsza siatkę wszystkim pozostałym rzeczom.
   */
  readonly rowH: number;
}

/** Prostokąt w układzie PANELU (środek panelu = 0,0), podany rogiem i rozmiarem. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * ── STROJONE LICZBY UKŁADU ────────────────────────────────────────────────
 * ⚠ To są jedyne stałe tego pliku. Wszystko inne jest z nich WYPROWADZONE.
 */
export const SHOP_METRICS = {
  /** Panel liczy się z OBSZARU USŁUGI (rama rozmowy) — ten sam wzorzec, co `PlayerPanel`. */
  minW: 816,
  maxW: 1280,
  minH: 480,
  maxH: 860,
  marginX: 16,
  marginY: 12,
  /** Wewnętrzny margines panelu. */
  pad: 14,
  /** Prześwit między kolumnami. */
  colGap: 18,
  /**
   * Pasek nagłówka: zakładki kupca · zakładki gracza · Cofnij, złoto, ⓘ.
   * ⚠ 72 j. = zakładka 68 j. (próg dotyku) + 2 j. oddechu z każdej strony.
   */
  headerH: 72,
  /** Odstęp nagłówka od treści. */
  headerGap: 8,
  tabGap: 6,
  /**
   * ⭐ Pasek ZAKŁADEK KATEGORII nad siatką (`OI-130`). Bez niego półka Kowala
   * (kilkadziesiąt pozycji) byłaby nieprzewijalną ścianą.
   */
  stripH: 48,
  stripGap: 6,
  /** Pasek przewijania — przy prawej krawędzi siatki. */
  scrollW: 10,
  /** Odstęp kafli siatki. */
  gap: 8,
  /** ⭐⭐ Norma dotyku: 68 j. = 48 dp (`HUD_LAYOUT.minTouch`). */
  touch: 68,
  /** Sufit kafla: większe pole przestaje czytać się jak slot. */
  cellMax: 76,
  cellMin: 36,
  /**
   * ⭐ **Karta: udział szerokości i podłoga.** Kafel celuje w normę dotyku
   * (68 j.) i rośnie do 76 j. dopiero, gdy karta ma już swój udział; poniżej
   * normy schodzi wyłącznie wtedy, gdy karta spadłaby pod `cardMin`.
   */
  cardShare: 0.39,
  cardMin: 340,
  /** Bok grafiki przycisku nagłówka (ⓘ). Pole trafienia = `touch`. */
  btnSize: 34,
  /**
   * Miejsce na złoto w nagłówku karty („◉ 3 020 (−340)" ≈ 170 j.) — „Cofnij"
   * stoi przed nim i skraca napis do miejsca (`ShopPanel.refreshUndo`).
   */
  goldW: 180,
} as const;

/** Widok kolumny KUPCA. */
export type ShopMode = "buy" | "buyback";
/** Widok kolumny GRACZA. */
export type PlayerView = "bag" | "worn";

/* ══ PANEL ═══════════════════════════════════════════════════════════════ */

/** Szerokość panelu przy obszarze `availW` — ta sama reguła, co `PlayerPanel`. */
export function shopPanelW(availW: number): number {
  return Math.round(clamp(availW - 2 * SHOP_METRICS.marginX, SHOP_METRICS.minW, SHOP_METRICS.maxW));
}

/** Wysokość panelu przy obszarze `availH`. */
export function shopPanelH(availH: number): number {
  return Math.round(clamp(availH - 2 * SHOP_METRICS.marginY, SHOP_METRICS.minH, SHOP_METRICS.maxH));
}

/* ══ SIATKA ══════════════════════════════════════════════════════════════ */

/** Szerokość siatki w jednostkach panelu (bez marginesu). */
export function gridWidth(g: ShopGridSpec): number {
  return g.cols * g.cell + (g.cols - 1) * g.gap;
}

/**
 * Okno przewijania jednej kolumny — wszystko, czego potrzebuje maska, pasek
 * i test „czy pozycja jest widoczna".
 */
export interface ShopScrollWindow {
  readonly top: number;
  readonly height: number;
  readonly bottom: number;
  readonly rows: number;
  readonly contentH: number;
  readonly visibleRows: number;
  /** ⭐ `0` znaczy „mieści się w całości" — i wtedy pasek MA się nie pokazać. */
  readonly maxScroll: number;
}

/**
 * Okno przewijania przy `rows` WIERSZACH zawartości o skoku `rowH + gap`.
 *
 * ⚠⚠ **WIERSZE, nie liczba pozycji.** Rzecz `1×2` zajmuje dwa wiersze, więc
 * liczbę zna wyłącznie `packShelf` albo pojemność plecaka.
 */
export function scrollWindow(top: number, height: number, rowH: number, gap: number, rows: number): ShopScrollWindow {
  const wierszy = Math.max(1, Math.ceil(rows));
  const contentH = wierszy * (rowH + gap) - gap;
  // Pełne rzędy: ostatni rząd nie ma za sobą odstępu, stąd `+ gap`.
  const visibleRows = Math.max(1, Math.floor((height + gap) / (rowH + gap)));
  return {
    top,
    height,
    bottom: top + height,
    rows: wierszy,
    contentH,
    visibleRows,
    maxScroll: Math.max(0, contentH - height),
  };
}

/* ══ GABARYT W SIATCE ════════════════════════════════════════════════════ */

/** Gabaryt w POLACH siatki (`itemFootprint` mówi to samo o przedmiocie). */
export interface ShelfSize {
  readonly w: number;
  readonly h: number;
}

/** Gdzie rzecz stanęła: kolumna i wiersz KOTWICY plus gabaryt, który zajmuje. */
export interface ShelfPlace extends ShelfSize {
  readonly col: number;
  readonly row: number;
}

/** Ułożona siatka: miejsce dla każdej rzeczy (równolegle do wejścia) i wysokość. */
export interface ShelfPack {
  readonly places: readonly ShelfPlace[];
  /** Ile WIERSZY zajęła cała siatka — to idzie do okna przewijania. */
  readonly rows: number;
}

/**
 * Ułóż rzeczy w siatce: pierwszy wolny prostokąt w kolejności czytania.
 *
 * ⭐ **Ta sama reguła, co `Inventory.firstFitFor`** — półka kupca i plecak
 * stoją obok siebie i mają układać gabaryt tak samo. Używają jej też WIDOKI
 * filtrowane plecaka (tu i w `PlayerPanel`) — prawdziwe miejsca rzeczy
 * w `Inventory.slots` nie ruszają się ani o pole.
 * ⚠ Kolejność bywa inna niż wejście: dziura w siatce czyta się gorzej niż
 * przestawiony sąsiad.
 */
export function packShelf(cols: number, sizes: readonly ShelfSize[]): ShelfPack {
  const zajete = new Set<number>();
  const wolne = (col: number, row: number, w: number, h: number): boolean => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) if (zajete.has((row + dy) * cols + col + dx)) return false;
    }
    return true;
  };
  let rows = 0;
  const places: ShelfPlace[] = [];
  for (const fp of sizes) {
    // ⚠ Zacisk do szerokości siatki: rzecz szersza niż siatka nie ma gdzie
    //   stanąć, a pętla niżej szukałaby miejsca w nieskończoność.
    const w = Math.max(1, Math.min(cols, Math.round(fp.w)));
    const h = Math.max(1, Math.round(fp.h));
    let postawiony = false;
    for (let row = 0; !postawiony; row++) {
      for (let col = 0; col + w <= cols; col++) {
        if (!wolne(col, row, w, h)) continue;
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) zajete.add((row + dy) * cols + col + dx);
        }
        places.push({ col, row, w, h });
        rows = Math.max(rows, row + h);
        postawiony = true;
        break;
      }
    }
  }
  return { places, rows: Math.max(1, rows) };
}

/**
 * ŚRODEK obszaru zajmowanego przez rzecz — w jednostkach panelu.
 * ⚠⚠ **Środek PRZYKRYCIA, nie kotwicy** — ikona tarczy `1×2` na środku
 * kotwicy wisiałaby przy górnej krawędzi swojej pary.
 */
export function shelfXY(
  g: ShopGridSpec,
  centerX: number,
  gridTop: number,
  col: number,
  row: number,
  w = 1,
  h = 1,
): { x: number; y: number } {
  const pitchX = g.cell + g.gap;
  const pitchY = g.rowH + g.gap;
  return {
    x: centerX - ((g.cols - 1) * pitchX) / 2 + col * pitchX + ((w - 1) * pitchX) / 2,
    y: gridTop + row * pitchY + ((h - 1) * pitchY) / 2,
  };
}

/**
 * ⭐⭐ **POLE PRZEDMIOTU — jeden prostokąt na jeden przedmiot.** Kafel kotwicy
 * ma wysokość całego przykrycia, a kafel przykryty chowa własną ramkę —
 * gabaryt widać także przy małym rysunku (osiemnaście żelaznych tarcz `1×2`
 * ma ikonę 32×32). ⛔ Nie licz tego drugi raz w panelu.
 */
export function fieldRect(
  g: ShopGridSpec,
  centerX: number,
  gridTop: number,
  col: number,
  row: number,
  w = 1,
  h = 1,
): { x: number; y: number; width: number; height: number } {
  const { x, y } = shelfXY(g, centerX, gridTop, col, row, w, h);
  const { width, height } = shelfSpan(g, w, h);
  return { x, y, width, height };
}

/** Rozmiar obszaru zajmowanego przez gabaryt — w jednostkach panelu. */
export function shelfSpan(g: ShopGridSpec, w = 1, h = 1): { width: number; height: number } {
  return {
    width: w * g.cell + (w - 1) * g.gap,
    height: h * g.rowH + (h - 1) * g.gap,
  };
}

/* ══ KOLUMNA SZCZEGÓŁÓW (karta — wspólna z panelem gracza) ════════════════ */

export interface ShopDetailsLayout {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly pad: number;
  /**
   * ⭐ **Karta SZEROKA** (≥ `WIDE_CARD` j. — monitor): tytuły sekcji w lewym
   * marginesie, porównania obu miejsc obok siebie, ilość i akcje w JEDNYM
   * rzędzie na dole. Wąska (telefon) układa to samo w pionie.
   */
  readonly wide: boolean;
  /**
   * ⭐ **Ciało OBOK podglądu** (pod nazwą), a nie pod nim — gdy obok podglądu
   * mieści się etykieta z wartością (≥ `BESIDE_W`). Podgląd rzeczy `1×2` ma
   * 140 j. wysokości; ciało pod nim zaczynało się w jednej trzeciej karty
   * i wypychało porównanie do przewijania.
   */
  readonly beside: boolean;
  /** Ramka dużego podglądu ikony (lewy górny róg + rozmiar `1×2`). */
  readonly preview: Rect;
  /** Pas nazwy/typu obok podglądu. */
  readonly title: Rect;
  /** Przewijane ciało karty — górna krawędź NOMINALNA (karta liczy ją z tytułu). */
  readonly body: Rect;
  /** Pas akcji przyklejony do dołu kolumny (wysokość nominalna). */
  readonly action: Rect;
}

/** Od tej szerokości karta jest SZEROKA (patrz `ShopDetailsLayout.wide`). */
export const WIDE_CARD = 500;
/** Od tej szerokości pasa obok podglądu ciało stoi OBOK niego. */
export const BESIDE_W = 240;

/**
 * Kolumna SZCZEGÓŁÓW: podgląd + nazwa u góry, przewijane ciało, **porównanie
 * i akcja przyklejone do dołu** — przycisk zawsze w tym samym miejscu pod
 * kciukiem, niezależnie od długości opisu.
 */
export function detailsColumn(left: number, top: number, width: number, height: number): ShopDetailsLayout {
  const pad = 12;
  const wide = width >= WIDE_CARD;
  // ⚠ Podgląd bierze miarę z OBU osi kolumny (wąska karta: nazwa obok
  //   zachowuje ≥ 120 j. — `D3`). 76 j. = najwęższa ramka, w której rysunek
  //   wchodzi w skalę ×2 (64 + 12). ⚠ Sufit 96, nie 104: przy 104 ramka `1×2`
  //   potrzebowała 156 j. wysokości (1,5 × szerokość, `D5`) przy suficie 152.
  const previewW = wide
    ? 84
    : Math.round(Math.max(clamp(width * 0.3, 56, 96), Math.min(76, width - 2 * pad - 10 - 120)));
  // ⚠⚠ **Podgląd jest WYSOKI NA DWA POLA** — rzecz `1×1` i `1×2` mają w nim
  //   TĘ SAMĄ skalę rysunku (`D4`), a ramka `1×2` jest wyraźnie wyższa od
  //   kwadratu (`D5`). Bez tego tarcza 32×64 wychodziła mniejsza od hełmu.
  const previewScale = clamp(Math.floor((previewW - 12) / 32), 1, 2);
  const previewNeed = Math.max(64 * previewScale + 12, Math.ceil(previewW * 1.5));
  const previewH = Math.round(clamp(Math.min(height * 0.33, previewNeed), 84, 152));
  const titleX = left + pad + previewW + (wide ? 14 : 10);
  const titleW = left + width - pad - titleX;
  const beside = wide || titleW >= BESIDE_W;
  const actionH = wide ? 68 : 52 + 8 + 52;
  const actionTop = top + height - pad - actionH;
  const bodyTop = beside ? top + pad + 76 : top + pad + previewH + 8;
  const bodyX = beside ? titleX : left + pad;
  const bodyW = beside ? titleW : width - 2 * pad;
  return {
    left,
    top,
    width,
    height,
    pad,
    wide,
    beside,
    preview: { x: left + pad, y: top + pad, w: previewW, h: previewH },
    title: { x: titleX, y: top + pad, w: titleW, h: previewH },
    body: { x: bodyX, y: bodyTop, w: bodyW, h: Math.max(40, actionTop - bodyTop - 6) },
    action: { x: left + pad, y: actionTop, w: width - 2 * pad, h: actionH },
  };
}

/* ══ CAŁOŚĆ ══════════════════════════════════════════════════════════════ */

/**
 * Siatka kafli jednej kolumny (kupiec albo gracz). ⭐ Ten sam kafel po obu
 * stronach i w każdym trybie: przedmiot wygląda tak samo wszędzie.
 */
export interface ShopGridLayout {
  /** Lewa krawędź i szerokość KOLUMNY (siatka + pasek przewijania). */
  readonly left: number;
  readonly width: number;
  /** Zakładki kolumny (Kup | Odkup · Plecak | Na sobie) w nagłówku. */
  readonly tabs: Rect;
  /** Zakładki kategorii nad siatką. */
  readonly strip: Rect;
  readonly grid: ShopGridSpec;
  readonly gridW: number;
  readonly centerX: number;
  readonly windowTop: number;
  /** Okno siatki — CAŁKOWITA liczba wierszy. */
  readonly windowH: number;
  /** `y` ŚRODKA pierwszego rzędu pól. */
  readonly gridTop: number;
  /** `x` paska przewijania (po prawej stronie siatki). */
  readonly scrollX: number;
}

/** Kafel sylwetki „Na sobie": komórka z `DOLL_CELLS` + środek i wysokość. */
export interface ShopDollCell {
  readonly cell: DollCell;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly height: number;
}

export interface ShopLayout {
  readonly panelW: number;
  readonly panelH: number;
  /** `y` środka paska nagłówka. */
  readonly headerY: number;
  /** Cofnij — nad kartą, przed złotem. */
  readonly undo: Rect;
  /** `x` PRAWEJ krawędzi napisu złota (przed ⓘ). */
  readonly goldRight: number;
  readonly infoX: number;
  readonly btnSize: number;
  readonly btnHit: number;
  readonly contentTop: number;
  readonly contentH: number;
  readonly merchant: ShopGridLayout;
  readonly player: ShopGridLayout;
  /** Sylwetka widoku „Na sobie" w oknie kolumny gracza. */
  readonly doll: readonly ShopDollCell[];
  readonly details: ShopDetailsLayout;
  /** Pierwszy powód, dla którego układ NIE mieści się w panelu. */
  readonly overflow: string | null;
}

/** Całkowita liczba wierszy o skoku `rowH + gap` mieszcząca się w `dostepne`. */
function peleWiersze(dostepne: number, rowH: number, gap: number): number {
  const pitch = rowH + gap;
  const n = Math.max(1, Math.floor((dostepne + gap) / pitch));
  return n * pitch - gap;
}

/**
 * Kafle sylwetki w sklepie: WYŁĄCZNIE sprzęt (`gear`) — to, co da się
 * naprawić i sprzedać. ⚠ Z jedynej listy `DOLL_CELLS`, nie z drugiej
 * (`PaperDoll.ts`: „⛔ nie odtwarzaj drugiej listy"). Ręce = para w rękach.
 */
export const SHOP_DOLL_CELLS: readonly DollCell[] = DOLL_CELLS.filter((c) => c.kind === "gear");

/**
 * Policz cały układ panelu handlu w zadanej ramce.
 *
 * ⚠ **Kolejność podziału szerokości jest decyzją:** obie siatki są RÓWNE
 * (handel ma dwie strony — ten sam kafel i 4 kolumny = `INVENTORY.cols`),
 * kafel trzyma normę dotyku, a karta bierze resztę — nie mniej niż `cardMin`.
 */
export function computeShopLayout(panelW: number, panelH: number): ShopLayout {
  const M = SHOP_METRICS;
  const contentW = panelW - 2 * M.pad;
  const left0 = -panelW / 2 + M.pad;
  const headerTop = -panelH / 2 + M.pad;
  const headerY = headerTop + M.headerH / 2;
  const contentTop = headerTop + M.headerH + M.headerGap;
  const contentBottom = panelH / 2 - M.pad;
  const contentH = contentBottom - contentTop;

  // ── podział szerokości ────────────────────────────────────────────────
  const cols = 4;
  // Szerokość kolumny siatki przy kaflu `c`: siatka + pasek przewijania.
  const kolumna = (c: number) => cols * c + (cols - 1) * M.gap + M.scrollW + 6;
  const reszta = contentW - 2 * M.colGap - 2 * kolumna(0);
  const zUdzialu = Math.floor((reszta - contentW * M.cardShare) / (2 * cols));
  const zPodlogi = Math.floor((reszta - M.cardMin) / (2 * cols));
  // Kafel: udział karty, ale NIE poniżej normy dotyku — chyba że karta spadłaby
  // pod podłogę; wtedy (i tylko wtedy) kafel ustępuje.
  let cell = Math.min(Math.max(zUdzialu, M.touch), zPodlogi);
  // Wysokość: bazowe cztery wiersze plecaka (16 slotów) bez paska (`W4`).
  const windowTop = contentTop + M.stripH + M.stripGap;
  const dostepne = contentBottom - windowTop;
  cell = Math.floor(clamp(Math.min(cell, (dostepne - 3 * M.gap) / 4), M.cellMin, M.cellMax));
  const spec: ShopGridSpec = { cols, cell, gap: M.gap, rowH: cell };
  const gw = gridWidth(spec);
  const colW = kolumna(cell);
  const windowH = peleWiersze(dostepne, cell, M.gap);

  const siatka = (left: number): ShopGridLayout => ({
    left,
    width: colW,
    tabs: { x: left, y: headerTop + 2, w: gw, h: M.headerH - 4 },
    strip: { x: left, y: contentTop, w: gw, h: M.stripH },
    grid: spec,
    gridW: gw,
    centerX: left + gw / 2,
    windowTop,
    windowH,
    gridTop: windowTop + cell / 2,
    // Pasek po PRAWEJ stronie siatki, w prześwicie, który do niej należy.
    scrollX: left + gw + 4 + M.scrollW / 2,
  });
  const merchant = siatka(left0);
  const player = siatka(left0 + colW + M.colGap);
  const detailsLeft = player.left + colW + M.colGap;
  const detailsW = left0 + contentW - detailsLeft;

  // ── sylwetka „Na sobie": 3 kolumny × `DOLL_ROWS`, ręce wysokie na dwa pola ─
  const dollCell = Math.floor(
    Math.min(cell, (gw - (DOLL_COLS - 1) * M.gap) / DOLL_COLS, (windowH - (DOLL_ROWS - 1) * M.gap) / DOLL_ROWS),
  );
  const dollW = DOLL_COLS * dollCell + (DOLL_COLS - 1) * M.gap;
  const dollLeft = player.centerX - dollW / 2;
  const doll: ShopDollCell[] = SHOP_DOLL_CELLS.map((c) => {
    const rows = c.rows ?? 1;
    const height = rows * dollCell + (rows - 1) * M.gap;
    return {
      cell: c,
      x: dollLeft + c.col * (dollCell + M.gap) + dollCell / 2,
      y: windowTop + c.row * (dollCell + M.gap) + height / 2,
      size: dollCell,
      height,
    };
  });

  // ── karta: od góry treści do dołu panelu ─────────────────────────────
  const details = detailsColumn(detailsLeft, contentTop, detailsW, contentH);

  // ── nagłówek nad kartą: Cofnij · złoto · ⓘ ───────────────────────────
  // ⚠ Środek ⓘ liczony od POLA TRAFIENIA (68 j.), nie od grafiki — przy
  //   grafice w rogu pole wystawało 3 j. poza panel (`H3`).
  const infoX = panelW / 2 - Math.max(M.pad + M.btnSize / 2, M.touch / 2 + 2);
  const goldRight = infoX - M.touch / 2 - 6;
  const undo: Rect = { x: detailsLeft, y: headerTop + 8, w: Math.max(0, goldRight - M.goldW - detailsLeft), h: M.headerH - 16 };

  // ── asercje układu: co NIE mieści się w panelu ────────────────────────
  let overflow: string | null = null;
  const dollBottom = Math.max(...doll.map((d) => d.y + d.height / 2));
  if (detailsW < 300) {
    overflow = `karta ma ${Math.round(detailsW)} j. — za mało na treść (min. 300)`;
  } else if (details.body.h < 60) {
    overflow = `ciało karty ma ${Math.round(details.body.h)} j. — za mało na jakąkolwiek sekcję`;
  } else if (detailsLeft + detailsW > panelW / 2 - M.pad + 0.5) {
    overflow = "karta wychodzi poza prawą krawędź panelu";
  } else if (dollBottom > windowTop + windowH + 0.5) {
    overflow = `sylwetka sięga ${Math.round(dollBottom)} j. przy oknie do ${Math.round(windowTop + windowH)} j.`;
  } else if (undo.w < 90) {
    overflow = `„Cofnij" ma ${Math.round(undo.w)} j. — za mało na napis`;
  }

  return {
    panelW,
    panelH,
    headerY,
    undo,
    goldRight,
    infoX,
    btnSize: M.btnSize,
    btnHit: M.touch,
    contentTop,
    contentH,
    merchant,
    player,
    doll,
    details,
    overflow,
  };
}

/** Prostokąty `n` równych zakładek w pasie `r`. */
export function tabRects(r: Rect, n: number): Rect[] {
  const g = SHOP_METRICS.tabGap;
  const w = (r.w - (n - 1) * g) / n;
  const out: Rect[] = [];
  for (let i = 0; i < n; i++) out.push({ x: r.x + i * (w + g), y: r.y, w, h: r.h });
  return out;
}

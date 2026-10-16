import { HUD_LAYOUT, INVENTORY, ITEMS } from "../config/GameConfig";
import type { LayeredArea } from "../core/Equipment";
import { ARMOR_LAYERS } from "../core/ArmorLayers";
import { DOLL_CELLS, DOLL_COLS, DOLL_HANDS_ROW, DOLL_ROWS, type DollCell } from "./PaperDoll";
import { detailsColumn, type ShopDetailsLayout } from "./ShopLayout";

/**
 * ── STRONA PLECAK — CZYSTA GEOMETRIA (przebudowa: etap D, 2026-10-13) ──────
 *
 * ```
 *   | lalka-sylwetka | plecak 4 kol.     | stała kolumna karty |   (szyna)
 *   | [warstwy]      | [kategorie]       |                     |
 *   | kafle 3×3      | siatka            |  podgląd · nazwa    |
 *   | [zestaw I|⇄|II]|                   |  ciało karty        |
 *   | ręce 1×2       | pojemność         |  porównanie         |
 *   | trzy liczby    | torby ×4          |  cena · akcje       |
 * ```
 *
 * Research 2 (`docs/ui_mobile_research.md` §8 R5, `docs/research/
 * ui_inventory_research.md` §6): sylwetka anatomiczna zamiast kraty, karta
 * jako STAŁA kolumna (nie dymek zasłaniający to, z czym gracz porównuje),
 * nawigacja na szynie. Decyzje autora: E1 — jeden przełącznik warstw całej
 * lalki, E2 — przełącznik zestawów I/II nad rękami z miniaturami drugiego.
 *
 * ⚠ **Plik jest CZYSTY — zero Phasera, zero stanu.** Ten sam powód, co przy
 * `ShopLayout`/`FrameLayout`: układ liczony bez sceny sprawdza się bez gry —
 * `node tools/ekwipunek_uklad.mjs`.
 *
 * ⚠⚠ **Liczby układu mają JEDEN dom** — tutaj (`INV`). `PlayerPanel` pyta
 * o prostokąty, nie liczy.
 */

/* ── reguły i dane, które przeżyły przebudowę ───────────────────────────── */

/**
 * Cztery obszary warstwowe: głowa, tors, nogi, stopy — jedyne miejsca, w których
 * pancerz nakłada się warstwami, więc jedyne z paskiem kropek zajętości.
 */
export const LAYERED_SLOTS: readonly LayeredArea[] = ["head", "chest", "legs", "boots"];

/** Ile kropek rysuje pasek warstw — wyprowadzone, nie wpisane. */
export const LAYER_PIPS = ARMOR_LAYERS.length;

/**
 * Podłoga kafla: 68 j. = 48 CSS px = norma Material 48 dp
 * (`HUD_LAYOUT.minTouch`). Ekwipunek jest interfejsem, w którym palec ląduje
 * najczęściej — gdy miejsca zabraknie, układ zwraca `overflow`, a nie kafel
 * mniejszy od normy.
 */
export const MIN_TOUCH_CELL = HUD_LAYOUT.minTouch;

/**
 * Czy JAKIKOLWIEK przedmiot w grze deklaruje ten slot. ⚠ **Wyprowadzane
 * z `ITEMS`, nie z flagi** — kafel `planned` ożywa sam w dniu, w którym
 * powstanie pierwszy przedmiot na ten slot.
 */
let itemSlotCache: Set<string> | null = null;
export function slotHasItems(slot: string): boolean {
  // ⚠ Adres warstwowy (`chest_L3`) pyta o ten sam OBSZAR co `chest` — przedmioty
  //   deklarują obszar, nie warstwę.
  const i = slot.lastIndexOf("_L");
  if (i > 0) slot = slot.slice(0, i);
  if (!itemSlotCache) {
    itemSlotCache = new Set();
    for (const def of Object.values(ITEMS) as { type: string; slot?: string }[]) {
      if (def.type === "weapon") itemSlotCache.add("weapon");
      if (def.type === "ring") itemSlotCache.add("ring1").add("ring2");
      if (def.type === "amulet") itemSlotCache.add("amulet");
      if (def.type === "armor" && def.slot) itemSlotCache.add(def.slot);
    }
    // Zestaw II bierze to samo, co zestaw I — to te same przedmioty.
    if (itemSlotCache.has("weapon")) itemSlotCache.add("weapon2");
    if (itemSlotCache.has("offhand")) itemSlotCache.add("offhand2");
  }
  return itemSlotCache.has(slot);
}

/* ── strojone liczby układu ─────────────────────────────────────────────── */

export const INV = {
  /** Margines strony w poziomie i w pionie. */
  marginX: 16,
  marginY: 10,
  /** Prześwit między kolumnami. */
  colGap: 16,
  /** Odstęp między kaflami. */
  gap: 8,
  /**
   * Przełączniki nad lalką (warstwy, E1) i nad rękami (zestawy, E2).
   * ⚠ 44 j., poniżej `minTouch`, ŚWIADOMIE i z tym samym argumentem, co pasek
   * kategorii (48 j., `CategoryStrip`): segment jest szeroki, a nietrafienie
   * kosztuje przełączenie widoku, nie akcję. Na telefonie pion jest osią
   * krytyczną (research §6.1: „jest ciasno") — 2 × 24 j. to jedna z trzech
   * dużych liczb pod lalką.
   */
  toggleH: 44,
  /** Pas trzech dużych liczb pod lalką (Eternium; research §6.1). */
  numbersH: 48,
  /**
   * Sufit kafla. ⚠ 76, nie 96 jak w kracie sprzed etapu D: kafle rosną kosztem
   * kolumny karty, a karta jest celem całego przepływu (porównanie z OBOMA
   * zestawami, wymagania, akcja). Powyżej rośnie margines, nie kafel.
   */
  cellMax: 76,
  /** Lalka nie węższa niż to — przełącznik warstw ma cztery segmenty z podpisem. */
  dollMinW: 244,
  /** Pas kategorii plecaka (`CategoryStrip.STRIP_H`) + odstęp pod nim. */
  stripH: 48,
  stripGap: 4,
  /** Pasek przewijania siatki — po jej prawej, zewnętrznej stronie. */
  scrollW: 10,
  /** Wiersz pojemności („12/16") między siatką a torbami. */
  capacityH: 22,
  /** Kafel torby — pełna norma dotyku (do etapu D 40 j., poniżej normy). */
  bagTile: HUD_LAYOUT.minTouch,
  /** Najwęższa sensowna kolumna karty (porównanie, wymagania, dwa przyciski). */
  cardMinW: 300,
} as const;

/* ── wynik ──────────────────────────────────────────────────────────────── */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Jeden kafel lalki — środek, bok i WYSOKOŚĆ (ręce: dwa pola). */
export interface DollRect {
  readonly cell: DollCell;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly height: number;
}

export interface InventoryLayout {
  readonly top: number;
  readonly bottom: number;
  readonly gap: number;
  readonly colGap: number;
  /** Bok kafla LALKI. */
  readonly dollCell: number;
  /** Bok kafla PLECAKA — równy lalce, chyba że budżet nie pozwala. */
  readonly cell: number;
  /** Całkowita skala ikony przedmiotu (32 px) w kaflu plecaka. */
  readonly iconScale: number;
  readonly cols: number;
  /** WIDOCZNE wiersze siatki (reszta się przewija). */
  readonly rows: number;
  readonly doll: {
    readonly left: number;
    readonly width: number;
    readonly centerX: number;
    readonly cells: readonly DollRect[];
    /** Przełącznik warstw całej lalki (E1). */
    readonly layerToggle: Rect;
    /** Przełącznik zestawów I | ⇄ | II nad rękami (E2). */
    readonly setToggle: Rect;
    /** Pas trzech dużych liczb. */
    readonly numbers: Rect;
  };
  readonly bag: {
    readonly strip: Rect;
    readonly gridLeft: number;
    readonly gridTop: number;
    readonly gridW: number;
    readonly gridH: number;
    /** Środek wiersza pojemności (tekst wyrównany do prawej krawędzi siatki). */
    readonly capacityY: number;
    /** Rząd czterech kafli toreb POD siatką (research: torby pod plecakiem). */
    readonly bagRow: Rect;
  };
  readonly card: ShopDetailsLayout;
  readonly overflow: string | null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Policz stronę PLECAK w panelu `panelW × pageH` (środek strony = 0,0).
 *
 * ⚠ **Kolejność podziału jest decyzją:** najpierw PION lalki (wyznacza kafel —
 * dwa przełączniki, pięć wierszy sylwetki i pas liczb muszą się zmieścić), potem
 * plecak (cztery kolumny = geometria MODELU, `INVENTORY.cols`), a karta bierze
 * resztę szerokości. ⛔ Nie zwężaj plecaka pod kartę — sąsiad pionowy to
 * `i + cols`.
 */
export function computeInventoryLayout(panelW: number, pageH: number): InventoryLayout {
  const M = INV;
  const gap = M.gap;
  const top = Math.round(-pageH / 2 + M.marginY);
  const bottom = Math.round(pageH / 2 - M.marginY);
  const availH = bottom - top;
  const left0 = -panelW / 2 + M.marginX;
  const availW = panelW - 2 * M.marginX;

  // ── lalka: pion wyznacza kafel ─────────────────────────────────────────
  // Stos: warstwy · 3 wiersze · zestawy · 2 wiersze (ręce) · liczby, z odstępami.
  const upperRows = DOLL_HANDS_ROW;
  const lowerRows = DOLL_ROWS - DOLL_HANDS_ROW;
  const fixedH = M.toggleH * 2 + M.numbersH + gap * (upperRows - 1 + lowerRows - 1 + 4);
  const dollCell = Math.floor(clamp((availH - fixedH) / DOLL_ROWS, MIN_TOUCH_CELL, M.cellMax));
  const cellsW = DOLL_COLS * dollCell + (DOLL_COLS - 1) * gap;
  const dollW = Math.max(cellsW, M.dollMinW);
  const dollLeft = left0;
  const centerX = dollLeft + dollW / 2;
  const cellsLeft = centerX - cellsW / 2;

  const layerToggle: Rect = { x: dollLeft, y: top, w: dollW, h: M.toggleH };
  const upperTop = top + M.toggleH + gap;
  const setToggleY = upperTop + upperRows * (dollCell + gap);
  const setToggle: Rect = { x: dollLeft, y: setToggleY, w: dollW, h: M.toggleH };
  const lowerTop = setToggleY + M.toggleH + gap;
  const rowTop = (row: number): number =>
    row < DOLL_HANDS_ROW ? upperTop + row * (dollCell + gap) : lowerTop + (row - DOLL_HANDS_ROW) * (dollCell + gap);

  const cells: DollRect[] = DOLL_CELLS.map((c) => {
    const rows = c.rows ?? 1;
    const height = rows * dollCell + (rows - 1) * gap;
    return {
      cell: c,
      x: cellsLeft + c.col * (dollCell + gap) + dollCell / 2,
      y: rowTop(c.row) + height / 2,
      size: dollCell,
      height,
    };
  });
  const dollBottom = lowerTop + lowerRows * dollCell + (lowerRows - 1) * gap;
  const numbers: Rect = { x: dollLeft, y: dollBottom + gap, w: dollW, h: M.numbersH };

  // ── plecak: cztery kolumny modelu ──────────────────────────────────────
  const cols = INVENTORY.cols;
  const bagLeft = dollLeft + dollW + M.colGap;
  const cardRoom = (cell: number) => availW - dollW - M.colGap - (cols * cell + (cols - 1) * gap + M.scrollW) - M.colGap;
  // Kafel plecaka = kafel lalki, chyba że karta nie zmieściłaby swojego minimum
  // — wtedy kurczy się plecak, ale nie poniżej normy dotyku.
  let cell = dollCell;
  while (cell > MIN_TOUCH_CELL && cardRoom(cell) < M.cardMinW) cell--;
  const gridW = cols * cell + (cols - 1) * gap;
  const strip: Rect = { x: bagLeft, y: top, w: gridW, h: M.stripH };
  const gridTop = top + M.stripH + M.stripGap;
  const underGrid = M.capacityH + M.bagTile + gap;
  const rows = clamp(Math.floor((bottom - gridTop - underGrid + gap) / (cell + gap)), 3, 8);
  const gridH = rows * cell + (rows - 1) * gap;
  const bagRowY = bottom - M.bagTile;
  const capacityY = (gridTop + gridH + bagRowY) / 2;
  const bagRow: Rect = { x: bagLeft, y: bagRowY, w: gridW, h: M.bagTile };

  // ── karta: reszta szerokości, cała wysokość ────────────────────────────
  const cardLeft = bagLeft + gridW + M.scrollW + M.colGap;
  const cardW = left0 + availW - cardLeft;
  const card = detailsColumn(cardLeft, top, cardW, availH);

  // ⚠ Asercja, która potrafi zaświecić na czerwono: układ, który się nie
  //   mieści, mówi o tym (`PlayerPanel` ostrzega, przymiar zgłasza błąd).
  let overflow: string | null = null;
  if (numbers.y + numbers.h > bottom + 0.5) {
    overflow = `lalka sięga ${Math.round(numbers.y + numbers.h)} j. przy dole ${bottom} j.`;
  } else if (cardW < M.cardMinW) {
    overflow = `kolumna karty ma ${Math.round(cardW)} j. < ${M.cardMinW}`;
  } else if (gridTop + gridH + underGrid > bottom + 0.5) {
    overflow = `kolumna plecaka sięga ${Math.round(gridTop + gridH + underGrid)} j. przy dole ${bottom} j.`;
  }

  return {
    top,
    bottom,
    gap,
    colGap: M.colGap,
    dollCell,
    cell,
    iconScale: cell >= 100 ? 3 : 2,
    cols,
    rows,
    doll: { left: dollLeft, width: dollW, centerX, cells, layerToggle, setToggle, numbers },
    bag: { strip, gridLeft: bagLeft, gridTop, gridW, gridH, capacityY, bagRow },
    card,
    overflow,
  };
}

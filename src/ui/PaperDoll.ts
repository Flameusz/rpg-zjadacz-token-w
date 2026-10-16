import type { GearSlot, LayeredArea } from "../core/Equipment";

/**
 * ── SYLWETKA — JEDNA LISTA DLA CAŁEJ GRY (etap D, 2026-10-13) ──────────────
 *
 * ⭐⭐ **Jedna lista sylwetki.** Do etapu D istniały dwie: krata 3×4
 * `EQUIP_CELLS` (panel, z zestawami pod spodem) i sylwetka `SHOP_DOLL`
 * (sklep). Research 2 (§8, R5) i autor („sylwetka ze sklepu czyta się
 * lepiej") wybrali sylwetkę — krata zeszła. ⚠ Od etapu E (2026-10-13) sklep
 * pokazuje sylwetkę jako widok „Na sobie" kolumny gracza i bierze z tej listy
 * kafle `gear` (`SHOP_DOLL_CELLS` w `ShopLayout.ts`) — flaga `shop` zniknęła
 * razem ze stałym blokiem ZAŁOŻONE.
 * ⛔ Nie odtwarzaj drugiej listy „dla wygody" któregoś z paneli.
 *
 * ```
 *          lewy          oś ciała        prawy
 *   0      Szyja         GŁOWA           Pierścień I
 *   1      Ramiona       TORS            Pierścień II
 *   2      Dłonie        NOGI            Użytkowy
 *        ─────── przełącznik zestawów I | II (tylko panel) ───────
 *   3    ┌ Broń  ┐       STOPY         ┌ Druga ręka ┐
 *   4    └   ↓   ┘       Pas           └     ↓      ┘
 * ```
 *
 * ⚠ **Plik jest CZYSTY — zero Phasera, zero stanu.** Czytają go panel postaci,
 * sklep i przymiary (`tools/ekwipunek_uklad.mjs`, `tools/sklep_uklad.mjs`).
 *
 * ⚠ **Ręce nie mają adresu, mają STRONĘ** (`hand`): w panelu ten sam kafel
 * pokazuje parę w rękach (`weapon`/`offhand`) albo schowaną
 * (`weapon2`/`offhand2`) — zależnie od przełącznika zestawów (E2). Sklep
 * pokazuje wyłącznie parę w rękach.
 *
 * ⚠ **Obszary warstwowe nie mają adresu, mają OBSZAR** (`area`): kafel pokazuje
 * jedną z trzech warstw — zależnie od przełącznika warstw (E1) albo
 * najbardziej zewnętrzną zajętą.
 */

/** Czym kafel JEST — to decyduje, co się w nim dzieje po dotknięciu.
 *  `gear` trzyma egzemplarz sprzętu, `quick` PRZYPISANIE mikstury
 *  (`Inventory.quickSlot`), `planned` slot z docelowej listy, dla którego NIE
 *  MA JESZCZE przedmiotów (rysowany, przygaszony, z powodem). */
export type DollCellKind = "gear" | "quick" | "planned";

export interface DollCell {
  readonly kind: DollCellKind;
  /** Stały adres (biżuteria, ramiona, dłonie). */
  readonly slot?: GearSlot;
  /** Obszar warstwowy — kafel reprezentuje TRZY adresy. */
  readonly area?: LayeredArea;
  /** Ręka — adres zależy od pokazywanego zestawu. */
  readonly hand?: "main" | "off";
  readonly label: string;
  /** Indeks klatki w `ASSETS.slotGlyphs` (`tools/build_slot_glyphs.py`). */
  readonly glyph: number;
  readonly col: number;
  readonly row: number;
  /** Wysokość w polach — ręce mają 2, bo trzymają przedmioty `1×2`. */
  readonly rows?: number;
  /** Wyłącznie `planned` — jednozdaniowe „czemu to jest szare". */
  readonly pending?: string;
}

/** Kolumny sylwetki. */
export const DOLL_COLS = 3;

/**
 * Wiersz, PRZED którym w panelu stoi przełącznik zestawów (nad rękami — E2).
 * Wiersze od tego w górę to ręce i dół sylwetki.
 */
export const DOLL_HANDS_ROW = 3;

/**
 * ⚠ **„Użytkowy II" (planowany) zszedł z sylwetki w etapie D** — w siatce 3×5
 * z rękami `1×2` są dokładnie dwa wolne pola, a zajęły je slot użytkowy
 * i planowany pas. Wróci jednym wpisem w dniu, w którym drugi slot dostanie
 * własny klawisz — razem z decyzją, gdzie stoi (pytanie w
 * `docs/ui_mobile_research.md` §9).
 */
export const DOLL_CELLS: readonly DollCell[] = [
  // ── oś ciała: czwórka warstwowa ─────────────────────────────────────────
  { kind: "gear", area: "head", label: "Głowa", glyph: 1, col: 1, row: 0 },
  { kind: "gear", area: "chest", label: "Tors", glyph: 3, col: 1, row: 1 },
  { kind: "gear", area: "legs", label: "Nogi", glyph: 6, col: 1, row: 2 },
  { kind: "gear", area: "boots", label: "Stopy", glyph: 7, col: 1, row: 3 },
  // ── lewa strona: szyja, ramiona, dłonie ─────────────────────────────────
  { kind: "gear", slot: "amulet", label: "Szyja", glyph: 0, col: 0, row: 0 },
  { kind: "gear", slot: "shoulders", label: "Ramiona", glyph: 2, col: 0, row: 1 },
  { kind: "gear", slot: "gloves", label: "Dłonie", glyph: 4, col: 0, row: 2 },
  // ── prawa strona: pierścienie i slot użytkowy ───────────────────────────
  { kind: "gear", slot: "ring1", label: "Pierścień I", glyph: 8, col: 2, row: 0 },
  { kind: "gear", slot: "ring2", label: "Pierścień II", glyph: 8, col: 2, row: 1 },
  { kind: "quick", label: "Użytkowy", glyph: 9, col: 2, row: 2 },
  // ── ręce (dwa pola wysokości) i pas między nimi ─────────────────────────
  { kind: "gear", hand: "main", label: "Broń", glyph: 10, col: 0, row: 3, rows: 2 },
  { kind: "gear", hand: "off", label: "Druga ręka", glyph: 11, col: 2, row: 3, rows: 2 },
  { kind: "planned", label: "Pas", glyph: 5, col: 1, row: 4, pending: "Pasów jeszcze nie ma w grze" },
];

/** Wierszy sylwetki — WYNIK z danych, nie stała. */
export const DOLL_ROWS = DOLL_CELLS.reduce((n, c) => Math.max(n, c.row + (c.rows ?? 1)), 0);

/** Adres ręki w zestawie `set` (1 = w rękach, 2 = schowany). */
export function handSlot(hand: "main" | "off", set: 1 | 2): GearSlot {
  if (hand === "main") return set === 1 ? "weapon" : "weapon2";
  return set === 1 ? "offhand" : "offhand2";
}

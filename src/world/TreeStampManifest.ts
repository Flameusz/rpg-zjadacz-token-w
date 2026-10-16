// ⚠ PLIK GENEROWANY — `python tools/build_tree_stamps.py --zapisz`. Nie edytuj ręcznie.
//
// Arkusz `public/assets/tree_stamps.png` (edytorowy — Tiled wstawia drzewo jako
// pojedynczy tile object z tego tilesetu). RENDEROWY atlas to nadal `forrest.png`,
// ale tu renderujemy wprost z tego arkusza: jedna komórka = całe drzewo.
// Kolejność == kolejność komórek == lokalne id kafla w tilesecie `TreeStamps`.
//
// Model głębi: drzewo = PIEŃ (dolny pas komórki, pasmo encji) + KORONA (reszta,
// nad encjami), każde sortowane po własnej kotwicy Y. `docs/tree_instances.md`.

export const TREE_STAMP_CELL = 96;
export const TREE_STAMP_COLS = 8;
export const TREE_STAMP_ROWS = 5;
/** Dolny pas komórki renderowany jako PIEŃ (px). Reszta = korona. */
export const TREE_STAMP_TRUNK_SLICE = 32;
/** Rozmiar arkusza w px — do sanity-checku wczytanej tekstury. */
export const TREE_STAMP_SHEET = { w: 768, h: 480 } as const;

export interface TreeStampDef {
  /** Lokalne id kafla w tilesecie `TreeStamps` (0-based) = indeks komórki. */
  readonly id: number;
  readonly name: string;
  /** Rzeczywisty rozmiar grafiki drzewa w px (drzewo jest dosunięte do DOŁU
   *  komórki i wyśrodkowane w poziomie). */
  readonly w: number;
  readonly h: number;
  /** Pudełko kolizji PNIA w px, względem punktu wstawienia obiektu Tiled:
   *  dx od lewej krawędzi komórki, dy od DOLNEJ krawędzi komórki (dy < 0 = w górę). */
  readonly trunk: { readonly dx: number; readonly dy: number; readonly w: number; readonly h: number };
}

export const TREE_STAMPS: readonly TreeStampDef[] = [
  { id: 0, name: "dab_duzy_new", w: 96, h: 96, trunk: { dx: 40, dy: -15, w: 16, h: 15 } },
  { id: 1, name: "dab_duzy2_new", w: 96, h: 96, trunk: { dx: 40, dy: -15, w: 16, h: 15 } },
  { id: 2, name: "buk_duzy_new", w: 96, h: 96, trunk: { dx: 40, dy: -15, w: 16, h: 15 } },
  { id: 3, name: "swierk_duzy_new", w: 64, h: 96, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 4, name: "swierk_duzy2_new", w: 64, h: 96, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 5, name: "swierk_duzy3_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 6, name: "brzoza_duza_new", w: 64, h: 96, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 7, name: "brzoza_duza2_new", w: 64, h: 96, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 8, name: "brzoza_duza3_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 9, name: "grab_duzy_new", w: 64, h: 96, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 10, name: "grab_duzy2_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 11, name: "grab_duzy3_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 12, name: "olcha_duza_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 13, name: "olcha_duza2_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 14, name: "olcha_duza3_new", w: 64, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 15, name: "dab_sredni_new", w: 64, h: 64, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 16, name: "buk_sredni_new", w: 64, h: 64, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 17, name: "swierk_sredni_new", w: 64, h: 64, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 18, name: "brzoza_srednia_new", w: 64, h: 64, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 19, name: "brzoza_srednia2_new", w: 64, h: 64, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 20, name: "grab_sredni_new", w: 64, h: 64, trunk: { dx: 40, dy: -13, w: 16, h: 13 } },
  { id: 21, name: "grab_sredni2_new", w: 64, h: 64, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 22, name: "olcha_srednia_new", w: 64, h: 64, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 23, name: "olcha_srednia2_new", w: 64, h: 64, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 24, name: "dab_maly_new", w: 32, h: 64, trunk: { dx: 41, dy: -13, w: 14, h: 13 } },
  { id: 25, name: "buk_maly_new", w: 32, h: 64, trunk: { dx: 41, dy: -13, w: 14, h: 13 } },
  { id: 26, name: "swierk_maly_new", w: 32, h: 64, trunk: { dx: 41, dy: -13, w: 14, h: 13 } },
  { id: 27, name: "swierk_maly2_new", w: 32, h: 64, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 28, name: "brzoza_mala_new", w: 32, h: 64, trunk: { dx: 41, dy: -13, w: 14, h: 13 } },
  { id: 29, name: "grab_maly_new", w: 32, h: 64, trunk: { dx: 41, dy: -13, w: 14, h: 13 } },
  { id: 30, name: "olcha_mala_new", w: 32, h: 64, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 31, name: "wierzba_srednia_new", w: 96, h: 96, trunk: { dx: 43, dy: -14, w: 16, h: 14 } },
  { id: 32, name: "wierzba_srednia2_new", w: 96, h: 96, trunk: { dx: 40, dy: -14, w: 16, h: 14 } },
  { id: 33, name: "wierzba_mala_new", w: 64, h: 64, trunk: { dx: 46, dy: -14, w: 12, h: 14 } },
  { id: 34, name: "wierzba_sadzonka_new", w: 64, h: 64, trunk: { dx: 44, dy: -14, w: 12, h: 14 } },
  { id: 35, name: "buk_sredni", w: 96, h: 96, trunk: { dx: 39, dy: -13, w: 16, h: 13 } },
  { id: 36, name: "buk_sredni2", w: 96, h: 96, trunk: { dx: 38, dy: -13, w: 16, h: 13 } },
  { id: 37, name: "buk_maly", w: 64, h: 96, trunk: { dx: 39, dy: -13, w: 15, h: 13 } },
];

const BY_ID = new Map(TREE_STAMPS.map((s) => [s.id, s]));
const BY_NAME = new Map(TREE_STAMPS.map((s) => [s.name, s]));
export const treeStampById = (id: number): TreeStampDef | undefined => BY_ID.get(id);
export const treeStampByName = (name: string): TreeStampDef | undefined => BY_NAME.get(name);

// ── ARKUSZ WIELKI (`tree_stamps_big.png`, tileset `TreeStampsBig`) ─────────
// Osobny tileset dla wariantow wiekszych niz komorka 96 (wierzba duza).
// Ladowany OBOK `TreeStamps`; istniejace 1633 drzewa go nie dotykaja.
// Ten sam model glebi (dolny pas = pien) i ta sama konwencja `trunk`.

export const TREE_STAMP_BIG_CELL = 160;
export const TREE_STAMP_BIG_COLS = 2;
export const TREE_STAMP_BIG_ROWS = 2;
export const TREE_STAMP_BIG_SHEET = { w: 320, h: 320 } as const;

export const TREE_STAMPS_BIG: readonly TreeStampDef[] = [
  { id: 0, name: "wierzba_duza_new", w: 160, h: 160, trunk: { dx: 71, dy: -14, w: 28, h: 14 } },
  { id: 1, name: "wierzba_duza2_new", w: 160, h: 160, trunk: { dx: 62, dy: -14, w: 24, h: 14 } },
  { id: 2, name: "buk_duzy", w: 128, h: 128, trunk: { dx: 73, dy: -14, w: 18, h: 14 } },
  { id: 3, name: "buk_duzy2", w: 128, h: 128, trunk: { dx: 72, dy: -14, w: 18, h: 14 } },
];

const BIG_BY_ID = new Map(TREE_STAMPS_BIG.map((s) => [s.id, s]));
const BIG_BY_NAME = new Map(TREE_STAMPS_BIG.map((s) => [s.name, s]));
export const treeStampBigById = (id: number): TreeStampDef | undefined => BIG_BY_ID.get(id);
export const treeStampBigByName = (name: string): TreeStampDef | undefined => BIG_BY_NAME.get(name);

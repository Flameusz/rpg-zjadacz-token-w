/**
 * Układ atlasu `forrest` (`public/assets/forrest.png`) — kopia kontraktu z
 * `tools/build_forrest_atlas.py` (stała `SPRITES`) i `docs/forrest_atlas.json`,
 * w formie, którą silnik może zaimportować bez czytania plików spoza `src/`.
 *
 * ⚠ **Źródłem prawdy jest generator, nie ten plik.** Jeśli `build_forrest_atlas.py`
 * dołoży sprite'a albo przesunie układ arkusza, ten plik trzeba przepisać ręcznie
 * DOPÓKI generator nie zacznie go emitować sam (patrz plan migracji drzew —
 * to jest jawnie zaznaczony dług, nie przeoczenie).
 */

export interface ForestSpriteDef {
  name: string;
  /** lewy-górny kafel w arkuszu forrest.png (kolumna, wiersz), kafel = 32px. */
  col0: number;
  row0: number;
  cols: number;
  rows: number;
}

export const FOREST_ATLAS_TILE = 32;

export const FOREST_SPRITES: ForestSpriteDef[] = [
  { name: "dab_duzy_new", col0: 0, row0: 0, cols: 3, rows: 3 },
  { name: "dab_duzy2_new", col0: 3, row0: 0, cols: 3, rows: 3 },
  { name: "buk_duzy_new", col0: 6, row0: 0, cols: 3, rows: 3 },
  { name: "swierk_duzy_new", col0: 9, row0: 0, cols: 2, rows: 3 },
  { name: "swierk_duzy2_new", col0: 11, row0: 0, cols: 2, rows: 3 },
  { name: "swierk_duzy3_new", col0: 13, row0: 0, cols: 2, rows: 3 },
  { name: "brzoza_duza_new", col0: 15, row0: 0, cols: 2, rows: 3 },
  { name: "brzoza_duza2_new", col0: 17, row0: 0, cols: 2, rows: 3 },
  { name: "brzoza_duza3_new", col0: 0, row0: 3, cols: 2, rows: 3 },
  { name: "grab_duzy_new", col0: 2, row0: 3, cols: 2, rows: 3 },
  { name: "grab_duzy2_new", col0: 4, row0: 3, cols: 2, rows: 3 },
  { name: "grab_duzy3_new", col0: 6, row0: 3, cols: 2, rows: 3 },
  { name: "olcha_duza_new", col0: 8, row0: 3, cols: 2, rows: 3 },
  { name: "olcha_duza2_new", col0: 10, row0: 3, cols: 2, rows: 3 },
  { name: "olcha_duza3_new", col0: 12, row0: 3, cols: 2, rows: 3 },
  { name: "dab_sredni_new", col0: 0, row0: 6, cols: 2, rows: 2 },
  { name: "buk_sredni_new", col0: 2, row0: 6, cols: 2, rows: 2 },
  { name: "swierk_sredni_new", col0: 4, row0: 6, cols: 2, rows: 2 },
  { name: "brzoza_srednia_new", col0: 6, row0: 6, cols: 2, rows: 2 },
  { name: "brzoza_srednia2_new", col0: 8, row0: 6, cols: 2, rows: 2 },
  { name: "grab_sredni_new", col0: 10, row0: 6, cols: 2, rows: 2 },
  { name: "grab_sredni2_new", col0: 12, row0: 6, cols: 2, rows: 2 },
  { name: "olcha_srednia_new", col0: 14, row0: 6, cols: 2, rows: 2 },
  { name: "olcha_srednia2_new", col0: 16, row0: 6, cols: 2, rows: 2 },
  { name: "dab_maly_new", col0: 0, row0: 8, cols: 1, rows: 2 },
  { name: "buk_maly_new", col0: 1, row0: 8, cols: 1, rows: 2 },
  { name: "swierk_maly_new", col0: 2, row0: 8, cols: 1, rows: 2 },
  { name: "swierk_maly2_new", col0: 3, row0: 8, cols: 1, rows: 2 },
  { name: "brzoza_mala_new", col0: 4, row0: 8, cols: 1, rows: 2 },
  { name: "grab_maly_new", col0: 5, row0: 8, cols: 1, rows: 2 },
  { name: "olcha_mala_new", col0: 6, row0: 8, cols: 1, rows: 2 },
];

export const FOREST_ATLAS_COLS = 19;
/** `firstgid` tilesetu `Forrest` w `forrest.tmj` (za `Znaki`, firstgid 514, 16 kafli). */
export const FOREST_ATLAS_FIRSTGID = 530;

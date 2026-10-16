import { FOREST_ATLAS_COLS, FOREST_ATLAS_TILE, FOREST_SPRITES, type ForestSpriteDef } from "./ForestAtlasManifest";

/**
 * Wykrywanie instancji drzew w JUŻ WCZYTANEJ mapie Tiled — czysta funkcja nad
 * surowymi danymi warstw, bez zależności od Phasera. Ta sama logika, którą
 * zweryfikowano skryptem `detect_trees.py` na żywym `forrest.tmj` (raport
 * Z-order): każdy niezerowy kafel `trees-base` jest kandydatem na DOLNY RZĄD
 * jakiegoś drzewa (odwrócenie GID → sprite/kolumna/wiersz), potem
 * zweryfikowany względem PEŁNEGO odcisku tego sprite'a w obu warstwach.
 *
 * ⚠ Wynik `matched < total` NIE jest błędem ekstrakcji — to jest właśnie ten
 * sam fakt danych, który znalazł raport Z-order: część komórek stempla została
 * z czasem zajęta przez inne drzewo w tym samym `.tmj`. `cells` niesie
 * dokładnie to, co naprawdę stoi w mapie (do trybu "1:1 jak dziś"); domyślny
 * render używa PEŁNEGO sprite'a (patrz `TreeSpriteRenderer.ts`), bo to
 * właśnie to naprawia migracja.
 */

export interface RawTiledLayer {
  name: string;
  type: string;
  width: number;
  height: number;
  data: number[];
}

export interface RawTiledMap {
  layers: RawTiledLayer[];
}

export interface TreeInstance {
  name: string;
  x0: number;
  y0: number;
  cols: number;
  rows: number;
  /** Ile z `cols*rows` oczekiwanych kafli faktycznie stoi w danych. */
  matched: number;
  total: number;
  /** Kafle NAPRAWDĘ obecne w mapie — (lokalny c,r, warstwa, gid). */
  cells: Array<{ c: number; r: number; layer: string; gid: number }>;
}

interface GidInfo {
  sprite: ForestSpriteDef;
  c: number;
  r: number;
}

function buildGidLookup(sprites: ForestSpriteDef[]): Map<number, GidInfo> {
  const out = new Map<number, GidInfo>();
  for (const sp of sprites) {
    for (let r = 0; r < sp.rows; r++) {
      for (let c = 0; c < sp.cols; c++) {
        const local = (sp.row0 + r) * FOREST_ATLAS_COLS + (sp.col0 + c);
        // firstgid dodawane w miejscu wywołania (patrz extractTreeInstances) —
        // tu trzymamy tylko lokalny układ, żeby ta funkcja nie znała firstgid.
        out.set(local, { sprite: sp, c, r });
      }
    }
  }
  return out;
}

/**
 * @param map surowe dane Tiled (ta sama struktura co `forrest.tmj`) — w
 *   Phaserze dostępne pod `scene.cache.tilemap.get(mapCacheKey).data`.
 * @param firstgid `firstgid` tilesetu `Forrest` w TEJ mapie (530 w `forrest.tmj`
 *   dziś, ale nie zakładamy stałej — inna mapa może go mieć gdzie indziej).
 * @param bbox opcjonalne ograniczenie do prostokąta kafli (do prototypu na
 *   jednym obszarze, żeby nie skanować całej 160×60 za każdym wywołaniem).
 */
export function extractTreeInstances(
  map: RawTiledMap,
  firstgid: number,
  layerNames: readonly string[] = ["trees-base", "trees-over"],
  bbox?: { x0: number; y0: number; x1: number; y1: number },
): TreeInstance[] {
  const layers = new Map<string, RawTiledLayer>();
  for (const l of map.layers) {
    if (layerNames.includes(l.name)) layers.set(l.name, l);
  }
  const base = layers.get(layerNames[0]);
  if (!base) return [];
  const W = base.width;
  const H = base.height;
  const idx = (x: number, y: number) => y * W + x;

  const gidLookup = buildGidLookup(FOREST_SPRITES);

  const x0 = bbox?.x0 ?? 0;
  const y0 = bbox?.y0 ?? 0;
  const x1 = bbox?.x1 ?? W - 1;
  const y1 = bbox?.y1 ?? H - 1;

  // 1) kandydaci: dowolny niezerowy kafel na KTÓREJKOLWIEK warstwie, którego
  // gid trafia w DOLNY RZĄD (r === rows-1) jakiegoś sprite'a.
  const candidates = new Map<string, { name: string; ox: number; oy: number; cols: number; rows: number }>();
  for (const layer of layers.values()) {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
        const gid = layer.data[idx(x, y)];
        if (!gid) continue;
        const local = gid - firstgid;
        const info = gidLookup.get(local);
        if (!info) continue;
        if (info.r !== info.sprite.rows - 1) continue; // tylko dolny rząd = kotwica
        const ox = x - info.c;
        const oy = y - info.r;
        const key = `${info.sprite.name}@${ox},${oy}`;
        candidates.set(key, { name: info.sprite.name, ox, oy, cols: info.sprite.cols, rows: info.sprite.rows });
      }
    }
  }

  // 2) walidacja: dla każdego kandydata sprawdź KAŻDY oczekiwany kafel
  // (z definicji sprite'a) na wlasciwej warstwie (dolny rząd -> base, reszta -> over).
  const out: TreeInstance[] = [];
  for (const cand of candidates.values()) {
    const sprite = FOREST_SPRITES.find((s) => s.name === cand.name);
    if (!sprite) continue;
    const cells: TreeInstance["cells"] = [];
    let total = 0;
    for (let r = 0; r < sprite.rows; r++) {
      for (let c = 0; c < sprite.cols; c++) {
        total++;
        const mx = cand.ox + c;
        const my = cand.oy + r;
        if (mx < 0 || my < 0 || mx >= W || my >= H) continue;
        const layerName = r === sprite.rows - 1 ? layerNames[0] : (layerNames[1] ?? layerNames[0]);
        const layer = layers.get(layerName);
        if (!layer) continue;
        const local = (sprite.row0 + r) * FOREST_ATLAS_COLS + (sprite.col0 + c);
        const expectedGid = firstgid + local;
        const actualGid = layer.data[idx(mx, my)];
        if (actualGid === expectedGid) {
          cells.push({ c, r, layer: layerName, gid: actualGid });
        }
      }
    }
    if (cells.length === 0) continue;
    out.push({ name: cand.name, x0: cand.ox, y0: cand.oy, cols: sprite.cols, rows: sprite.rows, matched: cells.length, total, cells });
  }
  return out;
}

export { FOREST_ATLAS_TILE };

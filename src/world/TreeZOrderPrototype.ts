import Phaser from "phaser";
import { DEPTH } from "../config/GameConfig";
import { FOREST_ATLAS_TILE, FOREST_SPRITES } from "./ForestAtlasManifest";
import { extractTreeInstances, type RawTiledMap, type TreeInstance } from "./TreeInstanceExtractor";

/**
 * PROTOTYP Z-order dla gęstych skupisk drzew (etap 2 — całe realne obszary,
 * nie ręcznie wpisany klaster).
 *
 * Tymczasowy, dev-only kod (`window.dev.treeProto` w przeglądarce), NIE
 * wpięty w normalny przebieg gry i NIC nie zapisujący do `.tmj`. Do skasowania
 * albo scalenia z `TiledMap.ts`/`GameScene.ts` po decyzji o wdrożeniu.
 *
 * Model: każde drzewo to DWA obrazy w pikselach świata (pień/korona),
 * sortowane jak encje (`DEPTH.entities + y`). Pień zawsze pod encjami, korona
 * zawsze nad — identyczny niezmiennik jak dzisiejsze `trees-base`/`trees-over`
 * — ale odsunięcie w obrębie każdego pasma zależy od KOTWICY Y konkretnego
 * drzewa, więc korony/pnie różnych drzew sortują się między sobą poprawnie
 * (czego płaska warstwa kafli nie potrafiła — raport Z-order).
 */

const TEX = "forrest";

const spriteByName = new Map(FOREST_SPRITES.map((s) => [s.name, s]));

// Klatki cache'owane PO GATUNKU (nie po instancji) — jeden `dab_duzy_new` ma
// TĘ SAMĄ klatkę pień/korona niezależnie od tego, w ilu miejscach na mapie
// stoi. Przy ~2900 drzewach to jest różnica między ~60 klatkami a ~5800.
const frameCache = new Map<string, string>();

function ensureFrame(scene: Phaser.Scene, key: string, sx: number, sy: number, sw: number, sh: number): string {
  const cached = frameCache.get(key);
  if (cached) return cached;
  const tex = scene.textures.get(TEX);
  if (!tex.has(key)) tex.add(key, 0, sx, sy, sw, sh);
  frameCache.set(key, key);
  return key;
}

/** Stawia JEDNĄ instancję drzewa; zwraca [korona?, pień] utworzone obiekty. */
function spawnInstance(scene: Phaser.Scene, inst: TreeInstance, offsetPxX: number, offsetPxY: number): Phaser.GameObjects.Image[] {
  const sprite = spriteByName.get(inst.name);
  if (!sprite) return [];
  const T = FOREST_ATLAS_TILE;
  const out: Phaser.GameObjects.Image[] = [];

  const worldX = inst.x0 * T + offsetPxX;
  const worldY = inst.y0 * T + offsetPxY;
  const anchorY = worldY + inst.rows * T; // "stopy" drzewa — dolna krawędź stempla

  // pień = dolny rząd — ZAWSZE pod encjami (jak dziś trees-base); odsunięcie
  // po Y tylko sortuje pnie różnych drzew między sobą.
  const baseKey = `treesprite_base_${inst.name}`;
  const baseSx = sprite.col0 * T;
  const baseSy = (sprite.row0 + sprite.rows - 1) * T;
  const baseFrame = ensureFrame(scene, baseKey, baseSx, baseSy, sprite.cols * T, T);
  const baseImg = scene.add.image(worldX, worldY + (inst.rows - 1) * T, TEX, baseFrame).setOrigin(0, 0);
  baseImg.setDepth(DEPTH.overlay + 100 + anchorY * 0.01);
  out.push(baseImg);

  // korona = reszta — ZAWSZE nad encjami (jak dziś trees-over); odsunięcie po
  // Y sortuje korony różnych drzew między sobą (drzewo bliżej gracza
  // przykrywa koronę drzewa dalej na północ).
  if (sprite.rows > 1) {
    const overKey = `treesprite_over_${inst.name}`;
    const overSx = sprite.col0 * T;
    const overSy = sprite.row0 * T;
    const overFrame = ensureFrame(scene, overKey, overSx, overSy, sprite.cols * T, (sprite.rows - 1) * T);
    const overImg = scene.add.image(worldX, worldY, TEX, overFrame).setOrigin(0, 0);
    overImg.setDepth(DEPTH.overhead + anchorY * 0.01);
    out.push(overImg);
  }
  return out;
}

/** Stawia listę instancji, przesuniętych o (offsetPxX, offsetPxY) względem ich (x0,y0). */
export function spawnInstances(
  scene: Phaser.Scene,
  instances: TreeInstance[],
  offsetPxX: number,
  offsetPxY: number,
): Phaser.GameObjects.Image[] {
  const out: Phaser.GameObjects.Image[] = [];
  for (const inst of instances) out.push(...spawnInstance(scene, inst, offsetPxX, offsetPxY));
  return out;
}

/**
 * Wyciąga instancje drzew z JUŻ WCZYTANEJ mapy Tiled (z cache'a Phasera —
 * `scene.cache.tilemap.get(cacheKey).data`, ta sama struktura co `forrest.tmj`)
 * w podanym prostokącie kafli. Nic nie modyfikuje — czyste odczytanie.
 */
export function extractFromLoadedMap(
  scene: Phaser.Scene,
  cacheKey: string,
  firstgid: number,
  bbox: { x0: number; y0: number; x1: number; y1: number },
): TreeInstance[] {
  const entry = scene.cache.tilemap.get(cacheKey) as { data: RawTiledMap } | undefined;
  if (!entry) return [];
  return extractTreeInstances(entry.data, firstgid, ["trees-base", "trees-over"], bbox);
}

/**
 * Kopiuje realny fragment lasu (wybrany prostokąt kafli) w PUSTE miejsce na
 * tej samej mapie, jako sprite'y zamiast kafli — do porównania
 * CURRENT (żywy fragment) vs PO (ten sam układ, nowy renderer), bez
 * dotykania jakichkolwiek danych produkcyjnych.
 */
export function mirrorRegion(
  scene: Phaser.Scene,
  cacheKey: string,
  firstgid: number,
  srcBbox: { x0: number; y0: number; x1: number; y1: number },
  destTileX: number,
  destTileY: number,
): { instances: TreeInstance[]; images: Phaser.GameObjects.Image[] } {
  const instances = extractFromLoadedMap(scene, cacheKey, firstgid, srcBbox);
  const offsetPxX = (destTileX - srcBbox.x0) * FOREST_ATLAS_TILE;
  const offsetPxY = (destTileY - srcBbox.y0) * FOREST_ATLAS_TILE;
  const images = spawnInstances(scene, instances, offsetPxX, offsetPxY);
  return { instances, images };
}

/** Ukrywa/pokazuje wizualnie warstwę kafli (dane i kolizja zostają — patrz raport migracji, pkt 7-8). */
export function setTileLayerVisible(scene: Phaser.Scene, layerName: string, visible: boolean): void {
  const layer = (scene as unknown as { sys: { displayList: { list: Phaser.GameObjects.GameObject[] } } }).sys;
  for (const obj of layer.displayList.list) {
    const tl = obj as Phaser.Tilemaps.TilemapLayer;
    if (tl.layer?.name === layerName) tl.setVisible(visible);
  }
}

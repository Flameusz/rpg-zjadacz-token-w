import Phaser from "phaser";
import { ASSETS, DEPTH } from "../config/GameConfig";
import { ySortedWorldFor } from "../core/YSortedWorld";
import { renderCullerFor } from "../core/RenderCuller";
import { occludersFor } from "../core/Occluders";
import {
  TREE_STAMP_CELL,
  TREE_STAMP_COLS,
  TREE_STAMP_TRUNK_SLICE,
  TREE_STAMP_SHEET,
  TREE_STAMP_BIG_CELL,
  TREE_STAMP_BIG_COLS,
  TREE_STAMP_BIG_SHEET,
  TREE_STAMPS_BIG,
  treeStampById,
  treeStampBigById,
  type TreeStampDef,
} from "./TreeStampManifest";

/**
 * Renders every tree authored in Tiled as a **tile object** (an object carrying
 * a `gid`) on any object layer, using the generated stamp sheets.
 *
 * ── Model (dowiedziony prototypem na ~110 realnych drzewach, potem migracja) ──
 * Jedno drzewo = jedna instancja w pikselach świata, renderowana jako DWA
 * obrazy z tej samej komórki arkusza:
 *   • PIEŃ  — dolny pas `TRUNK_SLICE` px komórki, w paśmie encji
 *     (`DEPTH.entities + y`). Sortuje się z graczem i wrogami po „stopach".
 *   • KORONA — reszta komórki, zawsze nad encjami (`DEPTH.overhead`), walk-behind.
 *
 * Kotwica Y = `object.y` (tile-object w Tiled ma origin w LEWYM-DOLNYM rogu,
 * `objectalignment: "bottomleft"`), czyli `o.y` to linia gruntu drzewa.
 *
 * ── Dwa tilesety ───────────────────────────────────────────────────────────
 * `TreeStamps` (komórka 96) trzyma 31 drzew z `forrest.png` + małe/średnie
 * wierzby. `TreeStampsBig` (komórka 160) trzyma warianty, które się w 96 nie
 * mieszczą (wierzba duża) — OSOBNY arkusz, żeby 1633 istniejących obiektów i
 * ich gid-y zostały nietknięte. Obie tabele mają identyczny kształt rekordu.
 *
 * ── Kolizja ────────────────────────────────────────────────────────────────
 * Pudełko PNIA (z `TreeStampManifest`) ląduje jako statyczne ciało w `solids`
 * i jako `NavBox`. Korona niczego nie blokuje.
 */

/** Maska zerująca 3 górne bity flag odbicia z gid Tiled. */
const GID_FLAGS = 0x1fffffff;

export interface TreeTrunkBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreeLayerResult {
  count: number;
  images: Phaser.GameObjects.Image[];
  /** Pudełka kolizji pni w px świata (dodane też do `solids`). */
  trunkBoxes: TreeTrunkBox[];
}

/**
 * Jedno drzewo-stempel: nazwa stempla, punkt w gruncie (środek pnia, linia
 * gruntu) i oba jego obrazy. Czyta to widok 3D (`WorldView3D`), żeby postawić
 * model zamiast billboardu — ⛔ logika (kolizja, NavGrid) z tego nie korzysta.
 */
export interface TreeInstance {
  name: string;
  x: number;
  y: number;
  images: Phaser.GameObjects.Image[];
}

const INSTANCES = new WeakMap<Phaser.Scene, TreeInstance[]>();
/** Drzewa-stemple bieżącej mapy sceny (puste, gdy mapa nie ma stempli). */
export const treeInstancesFor = (scene: Phaser.Scene): readonly TreeInstance[] => INSTANCES.get(scene) ?? [];

/** Jeden arkusz stempli wpięty w mapę: tileset po nazwie + geometria komórki. */
interface StampSheet {
  firstgid: number;
  cols: number;
  cell: number;
  textureKey: string;
  tex: Phaser.Textures.Texture;
  lookup: (id: number) => TreeStampDef | undefined;
  /** Prefiks nazw klatek — rozdzielny między arkuszami, bo lokalne id się powielają. */
  framePrefix: string;
}

/**
 * Zbiera arkusze stempli obecne w mapie. Każdy tileset wiązany PO NAZWIE
 * (jak `TILESET_TEXTURES`); tekstura sprawdzana pod rozmiar z manifestu.
 */
function collectSheets(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
): StampSheet[] {
  const out: StampSheet[] = [];

  const bind = (
    names: string[],
    textureKey: string,
    cell: number,
    fallbackCols: number,
    expect: { w: number; h: number },
    lookup: (id: number) => TreeStampDef | undefined,
    framePrefix: string,
  ): void => {
    const ts = map.tilesets.find((t) => names.includes(t.name));
    if (!ts) return; // mapa nie używa tego arkusza
    if (!scene.textures.exists(textureKey)) {
      console.warn(`[trees] tekstura "${textureKey}" nie wczytana — arkusz pominięty.`);
      return;
    }
    const tex = scene.textures.get(textureKey);
    const src = tex.getSourceImage() as { width: number; height: number };
    if (expect.w > 0 && (src.width !== expect.w || src.height !== expect.h)) {
      console.warn(
        `[trees] "${textureKey}" ma ${src.width}×${src.height}, manifest oczekuje ` +
          `${expect.w}×${expect.h}. Przepuść tools/build_tree_stamps.py --zapisz.`,
      );
      return;
    }
    out.push({
      firstgid: ts.firstgid,
      cols: ts.columns || fallbackCols,
      cell,
      textureKey,
      tex,
      lookup,
      framePrefix,
    });
  };

  bind(
    ["TreeStamps", "tree_stamps"],
    ASSETS.treeStamps.key,
    TREE_STAMP_CELL,
    TREE_STAMP_COLS,
    TREE_STAMP_SHEET,
    treeStampById,
    "ts",
  );
  if (TREE_STAMPS_BIG.length > 0) {
    bind(
      ["TreeStampsBig", "tree_stamps_big"],
      ASSETS.treeStampsBig.key,
      TREE_STAMP_BIG_CELL,
      TREE_STAMP_BIG_COLS,
      TREE_STAMP_BIG_SHEET,
      treeStampBigById,
      "tsb",
    );
  }

  // Najwyższy firstgid pierwszy — gid trafia do arkusza o największym
  // firstgid ≤ gid (TreeStampsBig jest dopięty PO TreeStamps).
  return out.sort((a, b) => b.firstgid - a.firstgid);
}

export function buildTreeLayer(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  solids: Phaser.Physics.Arcade.StaticGroup,
): TreeLayerResult {
  const result: TreeLayerResult = { count: 0, images: [], trunkBoxes: [] };
  const instances: TreeInstance[] = [];
  INSTANCES.set(scene, instances);

  const sheets = collectSheets(scene, map);
  if (sheets.length === 0) return result; // mapa nie autoruje drzew tą drogą

  const minFirstgid = Math.min(...sheets.map((s) => s.firstgid));

  const ensureFrame = (
    sheet: StampSheet,
    localId: number,
    kind: "canopy" | "trunk",
    x: number,
    y: number,
    w: number,
    h: number,
  ): string => {
    const name = `tree_${sheet.framePrefix}_${kind}_${localId}`;
    if (!sheet.tex.has(name)) sheet.tex.add(name, 0, x, y, w, h);
    return name;
  };

  let flippedWarned = false;

  for (const layer of map.objects) {
    for (const o of layer.objects) {
      const rawGid = (o as unknown as { gid?: number }).gid;
      if (!rawGid) continue;
      const gid = rawGid & GID_FLAGS;
      if (gid < minFirstgid) continue; // inny tileset (nie stemple drzew)

      const sheet = sheets.find((s) => gid >= s.firstgid);
      if (!sheet) continue;
      const localId = gid - sheet.firstgid;
      const def = sheet.lookup(localId);
      if (!def) {
        console.warn(`[trees] obiekt gid ${gid} (lokalne ${localId}) nie ma definicji stempla — pominięty.`);
        continue;
      }
      if (!flippedWarned && rawGid !== gid) {
        console.warn("[trees] odbicie/obrót tile-objectu drzewa jest ignorowane w tym prototypie.");
        flippedWarned = true;
      }

      const C = sheet.cell;
      const canopyH = C - TREE_STAMP_TRUNK_SLICE;
      const ax = o.x ?? 0;
      const anchorY = o.y ?? 0;
      const cellX = (localId % sheet.cols) * C;
      const cellY = Math.floor(localId / sheet.cols) * C;
      const cellTop = anchorY - C;

      // KORONA — górna część komórki, zawsze nad encjami.
      const canopy = scene.add
        .image(ax, cellTop, sheet.textureKey, ensureFrame(sheet, localId, "canopy", cellX, cellY, C, canopyH))
        .setOrigin(0, 0)
        .setDepth(DEPTH.overhead + anchorY * 0.01);
      renderCullerFor(scene)?.register(canopy);
      // ── ZASŁONA: korona przykrywa gracza, więc melduje się w rejestrze ────
      // ⚠ **Prostokąt RYSUNKU, nie komórki.** `def.w`/`def.h` to zmierzony
      // rozmiar grafiki z wygenerowanego manifestu; drzewo jest w komórce
      // dosunięte do DOŁU i wyśrodkowane w poziomie. Sadzonka ma w komórce 96
      // tylko 32 px szerokości, więc rejestrowanie całej komórki zapalałoby
      // obrys graczowi stojącemu 32 px OBOK drzewa.
      // ⚠ Wysokość liczona bez pasa pnia — pień jest w paśmie encji i sortuje
      // się z graczem, więc zasłoną nie jest.
      occludersFor(scene)?.registerRect({
        x: ax + (C - def.w) / 2,
        y: anchorY - def.h,
        w: def.w,
        h: Math.max(0, def.h - TREE_STAMP_TRUNK_SLICE),
      });
      result.images.push(canopy);

      // PIEŃ — dolny pas komórki, w paśmie encji (sortuje się z graczem).
      // ⚠ Trafia do Y_SORTED_WORLD (jeśli scena je ma) zamiast domyślnej listy
      // sceny — to jedyny element drzewa, który faktycznie potrzebuje
      // coroklatkowego porównania z graczem/wrogami (korona zostaje w liście
      // domyślnej, bo `DEPTH.overhead` jest zawsze nad `DEPTH.entities` i
      // ten porządek nigdy nie był dynamiczny). Patrz `core/YSortedWorld.ts`.
      const trunk = scene.add
        .image(
          ax,
          cellTop + canopyH,
          sheet.textureKey,
          ensureFrame(sheet, localId, "trunk", cellX, cellY + canopyH, C, TREE_STAMP_TRUNK_SLICE),
        )
        .setOrigin(0, 0)
        .setDepth(DEPTH.entities + anchorY);
      ySortedWorldFor(scene)?.add(trunk);
      renderCullerFor(scene)?.register(trunk);
      result.images.push(trunk);

      // KOLIZJA PNIA — pudełko z manifestu (dx od o.x, dy od o.y).
      const bx = ax + def.trunk.dx;
      const by = anchorY + def.trunk.dy;
      const zone = scene.add.zone(bx + def.trunk.w / 2, by + def.trunk.h / 2, def.trunk.w, def.trunk.h);
      scene.physics.add.existing(zone, true);
      solids.add(zone);
      result.trunkBoxes.push({ x: bx, y: by, w: def.trunk.w, h: def.trunk.h });
      instances.push({ name: def.name, x: bx + def.trunk.w / 2, y: anchorY, images: [canopy, trunk] });

      result.count++;
    }
  }

  return result;
}

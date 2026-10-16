import Phaser from "phaser";
import type { NavGrid } from "../core/movement/NavGrid";
import { WORLD, ASSETS, DEPTH } from "../config/GameConfig";
import { extractTileGrid, missingAssets } from "../core/Assets";

/**
 * Builds the outdoor MVP map directly from a code-authored tile array — no
 * Tiled needed, but easy to swap for a Tiled JSON later.
 *
 * Two layers of information:
 *   1) `GROUND` — a rectangular array of ground tile codes (grass / water).
 *   2) `OBJECTS` — a list of decorative/solid props (trees, benches) placed by
 *      tile coordinate.
 *
 * Water and objects are given static physics bodies so the player collides.
 */

/** Ground tile codes. */
const G = 0; // grass
const W = 1; // water

/**
 * The map. Edit freely — width/height are derived from the array.
 * 20 columns × 15 rows of 32px = 640×480 world.
 */
// prettier-ignore
const GROUND: number[][] = [
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,W,W,W,W,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
  [G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G],
];

type PropType = "tree" | "bridge";

interface PropDef {
  type: PropType;
  /** Tile coordinates. */
  tx: number;
  ty: number;
}

/**
 * Decorative & solid props placed on the grass (tile coordinates).
 * Kept clear of the water (cols 13–16, rows 4–7), the player spawn (~tile 7,9)
 * and the enemy spawns.
 */
const OBJECTS: PropDef[] = [
  { type: "tree", tx: 2, ty: 2 },
  { type: "tree", tx: 4, ty: 2 },
  { type: "tree", tx: 18, ty: 2 },
  { type: "tree", tx: 2, ty: 12 },
  { type: "tree", tx: 18, ty: 13 },
  { type: "tree", tx: 10, ty: 6 },
  { type: "bridge", tx: 5, ty: 11 },
  { type: "bridge", tx: 12, ty: 2 },
];

/**
 * Both sheets are true tile sheets: every tile is exactly 32×32px, laid out on
 * a 33px pitch (32px content + a 1px transparent separator before the next
 * tile). Each entry below is a grid (column, row [, colSpan, rowSpan])
 * coordinate; extractTileGrid stitches the exact 32×32 blocks together
 * deterministically, so no separator pixel is ever included (immune to stray
 * decoration pixels that bleed into the gap, which broke a scan-based
 * approach once).
 *
 * `sheet: null` means "we have no art for this" — the colour placeholder is
 * used even when every PNG loaded. That's the bridge: the sheet rebuild
 * dropped it, and this fallback map is not the reason to redraw it.
 *
 * These coordinates point into REGENERATED sheets, so they are only as good as
 * the last run of tools/build_tilesets.py. Cross-check them against
 * docs/kafle.json after any rebuild — a stale pick doesn't fail, it just draws
 * the wrong picture (the campfire spent a whole session as a piece of tree).
 */
const NATURE_TILES = {
  /** Teren row 0 col 2 — "trawa — rzadka", the middle grass variant. */
  grass: { sheet: "teren", col: 2, row: 0 },
  /** Teren row 0 col 12 — "woda 1", flat water fill. */
  water: { sheet: "teren", col: 12, row: 0 },
  /** Nature row 5 cols 0–1 — "dab_sredni", the 2×2 medium oak. */
  tree: { sheet: "nature", col: 0, row: 5, colSpan: 2, rowSpan: 2 },
  /** No bridge art on either sheet any more — colour block. */
  bridge: { sheet: null, col: 0, row: 0, colSpan: 3, rowSpan: 3 },
} as const;

const PLACEHOLDER_COLORS: Record<string, number> = {
  grass: 0x4a8a3f,
  water: 0x3aa0c8,
  tree: 0x2f6b2a,
  bridge: 0x8a5a2b,
};

export interface BuiltMap {
  widthPx: number;
  heightPx: number;
  /** Static bodies the player should collide with (water + props). */
  solids: Phaser.Physics.Arcade.StaticGroup;
  /** A reasonable open spawn point for the player. */
  playerSpawn: Phaser.Math.Vector2;
  /**
   * Siatka prześwitu dla szukania drogi — `src/core/movement/NavGrid.ts`.
   *
   * Buduje ją wyłącznie `TiledMap`, z tego samego przebiegu, który tworzy
   * `solids`; mapa awaryjna z kodu (ta klasa) zostawia `null` i to jest
   * poprawne — bez niej każdy czytelnik (`MovementContext.nav`) schodzi na
   * sterowanie lokalne, które pyta silnik. ⚠ Do 2026-10-09 stało tu „BUDOWANA,
   * jeszcze nie CZYTANA" — nieaktualne, czytają ją solver drogi i scena (`OI-75`).
   */
  nav: NavGrid | null;
}

export class MapBuilder {
  constructor(private scene: Phaser.Scene) {}

  build(): BuiltMap {
    const ts = WORLD.tileSize;
    const rows = GROUND.length;
    const cols = GROUND[0].length;
    const widthPx = cols * ts;
    const heightPx = rows * ts;

    this.prepareTileTextures();

    const solids = this.scene.physics.add.staticGroup();

    // ── Ground layer ────────────────────────────────────────────────────
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const code = GROUND[ty][tx];
        const px = tx * ts;
        const py = ty * ts;
        if (code === W) {
          // Grass underneath so water edges sit on grass, then the water tile
          // itself becomes the (visible) static solid body that blocks movement.
          this.scene.add.image(px, py, "tile-grass").setOrigin(0).setDepth(0);
          const water = solids.create(px + ts / 2, py + ts / 2, "tile-water") as Phaser.Physics.Arcade.Sprite;
          water.setDepth(0);
          water.setSize(ts, ts);
          water.refreshBody();
        } else {
          this.scene.add.image(px, py, "tile-grass").setOrigin(0).setDepth(0);
        }
      }
    }

    // ── Object layer ────────────────────────────────────────────────────
    for (const p of OBJECTS) {
      const px = p.tx * ts + ts / 2;
      const py = p.ty * ts + ts / 2;
      const texKey = p.type === "tree" ? "prop-tree" : "prop-bridge";
      const sprite = solids.create(px, py, texKey) as Phaser.Physics.Arcade.Sprite;
      // Depth-sort by vertical position so the player can walk behind tops.
      sprite.setOrigin(0.5, 0.85);
      sprite.setDepth(DEPTH.entities + py); // sorts against entities, not terrain

      // Collision body: only the base, so the player can overlap the canopy/top.
      if (p.type === "tree") {
        // Tree ~32×65: collide only the trunk at the base.
        sprite.setSize(14, 12);
        sprite.setOffset((sprite.width - 14) / 2, sprite.height - 16);
      } else {
        // Bridge ~98×98 (3×3 tiles): collide the central plank span.
        const bw = Math.max(24, sprite.width - 30);
        sprite.setSize(bw, sprite.height - 20);
        sprite.setOffset((sprite.width - bw) / 2, 10);
      }
      sprite.refreshBody();
    }

    return {
      widthPx,
      heightPx,
      solids,
      playerSpawn: new Phaser.Math.Vector2(widthPx * 0.35, heightPx * 0.6),
      // Mapa awaryjna nie buduje siatki nawigacyjnej — patrz `BuiltMap.nav`.
      nav: null,
    };
  }

  /**
   * Create the individual tile/prop textures from Nature.png (or placeholders).
   */
  private prepareTileTextures(): void {
    const scene = this.scene;
    const sheetKey = { teren: ASSETS.teren.key, nature: ASSETS.nature.key } as const;

    const make = (key: string, name: keyof typeof NATURE_TILES) => {
      if (scene.textures.exists(key)) return;
      const t = NATURE_TILES[name];
      const texture = t.sheet === null ? null : sheetKey[t.sheet];
      if (texture === null || missingAssets.has(texture)) {
        this.makeColorTile(key, name);
        return;
      }
      const colSpan = "colSpan" in t ? t.colSpan : 1;
      const rowSpan = "rowSpan" in t ? t.rowSpan : 1;
      extractTileGrid(scene, texture, key, t.col, t.row, colSpan, rowSpan);
    };

    make("tile-grass", "grass");
    make("tile-water", "water");
    make("prop-tree", "tree");
    make("prop-bridge", "bridge");
  }

  private makeColorTile(key: string, name: keyof typeof NATURE_TILES): void {
    const t = NATURE_TILES[name];
    const colSpan = "colSpan" in t ? t.colSpan : 1;
    const rowSpan = "rowSpan" in t ? t.rowSpan : 1;
    const w = colSpan * 32;
    const h = rowSpan * 32;
    const color = PLACEHOLDER_COLORS[name] ?? 0xff00ff;
    const g = this.scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    if (name === "tree") {
      // A little canopy + trunk so it reads as a tree.
      g.fillStyle(0x6b4423, 1);
      g.fillRect(w / 2 - 4, h - 16, 8, 16);
      g.fillStyle(0x2f6b2a, 1);
      g.fillCircle(w / 2, h / 2 - 4, w / 2 - 2);
    } else if (name === "bridge") {
      g.fillStyle(0x6b4423, 1);
      for (let i = 0; i < 3; i++) g.fillRect(4 + i * (w / 3), 2, w / 3 - 4, h - 4);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }
}

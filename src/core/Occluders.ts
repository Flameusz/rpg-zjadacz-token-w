import type Phaser from "phaser";
import { OcclusionGrid } from "../world/OcclusionGrid";
import type { Rect } from "../world/RenderCulling";

/**
 * Rejestr wszystkiego, co rysuje się NAD pasmem encji — czyli wszystkiego, co
 * może schować gracza. Cienkie wpięcie Phasera nad czystą `world/OcclusionGrid.ts`,
 * dokładnie jak `RenderCuller` nad `RenderCulling`.
 *
 * ── Skąd wiadomo, że to jest KOMPLET zasłon ───────────────────────────────
 * Gracz siedzi w paśmie `DEPTH.entities + y`. Wszystko, co ma szansę go
 * przykryć niezależnie od jego pozycji, siedzi na `DEPTH.overhead` — i takich
 * rzeczy w tej grze są dokładnie **dwie klasy**:
 *
 * | klasa | kto tworzy | ile na mapach |
 * |---|---|---|
 * | **korony drzew** (osobne `Image`) | `world/TreeLayer.ts` | las 1641, wioska 0 |
 * | **warstwy kafli `-over`** | `world/TiledMap.ts` | wioska 1005, gęstwina 1852, las 16 |
 *
 * ⛔ **Pnie, decor i inne encje NIE są zasłonami i nie wolno ich tu dopisywać.**
 * One są w warstwie Y-sortowanej, więc przykrywają gracza wyłącznie wtedy, gdy
 * stoją PRZED nim — a to jest poprawny obraz, nie zgubiona postać. Dopisanie ich
 * dałoby obrys przy każdym krzaku, czyli stały outline, którego to zadanie ma
 * NIE mieć.
 *
 * ── Dwie klasy, dwa sposoby pytania — i to nie jest niekonsekwencja ────────
 * Korona jest jednym obiektem o znanym prostokącie, więc idzie do siatki.
 * Warstwa kafli jest RZADKA (1852 kafle rozsiane po 64×64 mapie), więc jej
 * prostokątem jest cała mapa i w siatce byłaby bezużyteczna — ale Phaser
 * odpowiada o pojedynczy kafel w O(1), więc pyta się jej wprost.
 *
 * ⚠ **Rejestr jest wyłącznie PREZENTACYJNY.** Nie uczestniczy w kolizji,
 * nawigacji, geometrii walki ani w kolejności rysowania — czyta go jeden
 * konsument (`PlayerSilhouette`) i nikt więcej.
 *
 * Kształt „WeakMap<Scene, T> + setX/xFor" jest przepisany z
 * `core/YSortedWorld.ts` / `core/RenderCuller.ts` — encja sięga tu bez
 * importowania `GameScene`, co zamknęłoby cykl.
 */
export class OccluderIndex {
  private readonly grid = new OcclusionGrid();
  private readonly tileLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  /**
   * Zasłona o znanym prostokącie (korona drzewa).
   *
   * ⚠ **Podaj prostokąt RYSUNKU, nie komórki arkusza** — patrz `OcclusionGrid`.
   */
  registerRect(rect: Rect): void {
    this.grid.add(rect);
  }

  /** Warstwa kafli rysowana nad encjami (nazwa kończy się na `-over`). */
  registerTileLayer(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.tileLayers.push(layer);
  }

  get stats(): { rects: number; layers: number } {
    return { rects: this.grid.size, layers: this.tileLayers.length };
  }

  /**
   * Czy prostokąt `query` (w px ŚWIATA) jest przykryty czymkolwiek z góry.
   *
   * ⚠ **Kafle próbkowane KROKIEM KAFLA, nie w czterech rogach.** Sylwetka
   * gracza to 31 × 60 px przy kaflu 32, więc test rogów potrafiłby przegapić
   * kafel leżący dokładnie na środku postaci. Krok daje najwyżej 2 × 3
   * odpytania.
   */
  covers(query: Rect): boolean {
    if (this.grid.covers(query)) return true;

    for (const layer of this.tileLayers) {
      const tw = layer.tilemap.tileWidth;
      const th = layer.tilemap.tileHeight;
      if (tw <= 0 || th <= 0) continue;
      for (let x = query.x; ; x += tw) {
        const px = Math.min(x, query.x + query.w);
        for (let y = query.y; ; y += th) {
          const py = Math.min(y, query.y + query.h);
          // `nonNull: false` — pusty kafel ma wrócić jako `null`, a nie jako
          // kafel z indeksem −1. Inaczej każda komórka mapy byłaby zasłoną.
          const tile = layer.getTileAtWorldXY(px, py, false);
          if (tile && tile.index >= 0) return true;
          if (py >= query.y + query.h) break;
        }
        if (px >= query.x + query.w) break;
      }
    }
    return false;
  }
}

const perScene = new WeakMap<Phaser.Scene, OccluderIndex>();

export function setOccluders(scene: Phaser.Scene, index: OccluderIndex): void {
  perScene.set(scene, index);
}

/** `null` na scenie, która nigdy go nie założyła (mapa awaryjna, test). */
export function occludersFor(scene: Phaser.Scene): OccluderIndex | null {
  return perScene.get(scene) ?? null;
}

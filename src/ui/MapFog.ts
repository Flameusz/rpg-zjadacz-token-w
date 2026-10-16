import Phaser from "phaser";
import { MAP_BY_ID, MAP_FOG } from "../config/GameConfig";
import { GameEvents, EVENT } from "../core/EventBus";
import { Exploration } from "../core/Exploration";
import { PARCHMENT } from "./MapParchment";

/**
 * ⭐ **Rysunek mapy we MGLE** (2026-10-14, „jak w Minecrafcie” — `MAP_FOG`).
 *
 * Dla każdego obszaru (`village`, `forest`, `thicket`) jedna tekstura-płótno
 * o rozmiarze obrazu minimapy: czysty pergamin, a na nim obraz minimapy
 * WYŁĄCZNIE w odkrytych komórkach (`Exploration`). Tę samą teksturę czytają
 * minimapa HUD-u i mapa w panelu — jedno źródło, więc obie zawsze pokazują
 * to samo.
 *
 * ⚠ **Koszt: dorysowuje tylko NOWE komórki** ze zdarzenia
 * `explorationChanged`; całość maluje się od nowa wyłącznie przy wczytaniu,
 * nowej grze i `revealAll` (`cells: null`). `refresh()` wysyła płótno na GPU
 * raz na zdarzenie — kilka razy na sekundę marszu przez nieznany teren,
 * zero razy po znanym.
 *
 * ⚠ Tekstury mieszkają w menedżerze GRY (wspólnym dla scen), więc przeżywają
 * restart sceny i przejście portalem — słuchacz jest jeden, na poziomie modułu.
 */

let textures: Phaser.Textures.TextureManager | null = null;

const fogKeyOf = (region: string): string => `mapfog-${region}`;

/** Komórka mgły w pikselach obrazu minimapy (8 przy 64 px świata). */
const cellTex = (): number => MAP_FOG.cellPx * MAP_FOG.minimapPxPerWorld;

/** Rozmiar obszaru w px świata — z obrazu minimapy (atlas nie trzyma rozmiarów). */
export function regionSizePx(scene: Phaser.Scene, region: string): { w: number; h: number } | null {
  const key = MAP_BY_ID[region]?.minimapKey;
  if (!key || !scene.textures.exists(key)) return null;
  const src = scene.textures.get(key).getSourceImage() as { width: number; height: number };
  return { w: src.width / MAP_FOG.minimapPxPerWorld, h: src.height / MAP_FOG.minimapPxPerWorld };
}

/**
 * Klucz tekstury obszaru z mgłą — buduje ją przy pierwszym pytaniu.
 * `null`, gdy obszar nie ma obrazu minimapy (mapa bez PNG).
 */
export function fogTexture(scene: Phaser.Scene, region: string): string | null {
  textures = scene.textures;
  const fogKey = fogKeyOf(region);
  if (scene.textures.exists(fogKey)) return fogKey;
  const srcKey = MAP_BY_ID[region]?.minimapKey;
  if (!srcKey || !scene.textures.exists(srcKey)) return null;
  const src = scene.textures.get(srcKey).getSourceImage() as HTMLImageElement;
  const tex = scene.textures.createCanvas(fogKey, src.width, src.height);
  if (!tex) return null;
  // Ziarno minimapy jest ostre (NEAREST) — płótno też, inaczej powiększona
  // mapa w panelu rozmywałaby się, a minimapa nie.
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  paintAll(region, tex, src);
  return fogKey;
}

function paperCss(alpha: number): string {
  const c = PARCHMENT.paper;
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${alpha})`;
}

function drawCell(ctx: CanvasRenderingContext2D, src: CanvasImageSource, i: number, j: number): void {
  const P = cellTex();
  const x = i * P;
  const y = j * P;
  ctx.drawImage(src, x, y, P, P, x, y, P, P);
  if (MAP_FOG.paperTint > 0) {
    ctx.fillStyle = paperCss(MAP_FOG.paperTint);
    ctx.fillRect(x, y, P, P);
  }
}

function paintAll(region: string, tex: Phaser.Textures.CanvasTexture, src: HTMLImageElement): void {
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = paperCss(1);
  ctx.fillRect(0, 0, tex.width, tex.height);
  // Siatka z rozmiaru obrazu — dla obszaru z zapisu rozpakowuje bity.
  Exploration.ensure(region, src.width / MAP_FOG.minimapPxPerWorld, src.height / MAP_FOG.minimapPxPerWorld);
  const size = Exploration.gridSize(region);
  if (size) {
    for (let j = 0; j < size.rows; j++) {
      for (let i = 0; i < size.cols; i++) if (Exploration.isCellRevealed(region, i, j)) drawCell(ctx, src, i, j);
    }
  }
  tex.refresh();
}

GameEvents.on(EVENT.explorationChanged, (e: { region: string; cells: number[] | null }) => {
  if (!textures) return;
  const fogKey = fogKeyOf(e.region);
  if (!textures.exists(fogKey)) return; // jeszcze nikt nie rysował — zbuduje się przy pytaniu
  const srcKey = MAP_BY_ID[e.region]?.minimapKey;
  if (!srcKey || !textures.exists(srcKey)) return;
  const tex = textures.get(fogKey) as Phaser.Textures.CanvasTexture;
  const src = textures.get(srcKey).getSourceImage() as HTMLImageElement;
  if (!e.cells) {
    paintAll(e.region, tex, src);
    return;
  }
  const size = Exploration.gridSize(e.region);
  if (!size) return;
  const ctx = tex.getContext();
  for (const k of e.cells) drawCell(ctx, src, k % size.cols, Math.floor(k / size.cols));
  tex.refresh();
});

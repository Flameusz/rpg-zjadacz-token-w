import Phaser from "phaser";
import type { NpcMarkerKind } from "../core/NpcStatus";

/**
 * ── ZNACZNIKI NAD MIESZKAŃCAMI jako IKONY (autor 2026-10-14) ─────────────
 *
 * „Coś w rodzaju WoW-a — wykrzyknik; biała kropka wygląda dziwnie." Do tej
 * daty znaczniki były NAPISAMI krojem świata (monospace 16 px, klockowaty pod
 * zoomem kamery): `!` i `?` czytały się jak drobne kreski, a `◆` bieżącego
 * kroku — jak biała kropka. Dziś to rysunki wektorowe, wypalane RAZ na scenę
 * do tekstur w rozdzielczości ×`RES` i zmniejszane przy rysowaniu (filtr
 * LINEAR — ostre krawędzie bez schodków przy każdym zoomie świata).
 *
 * Rodzaje (znaczenia z `core/NpcStatus.ts`, ⛔ nie zmieniane):
 * - `available` — złoty `!`: jest tu robota do wzięcia;
 * - `turnIn`    — `?` w kolorze z `NpcStatus` (zielony): tu ją oddasz;
 * - `talk`      — złoty DYMEK rozmowy z trzema kropkami: tu prowadzi bieżący
 *                 krok śledzonego zadania (cel „porozmawiaj" — tylko ten rodzaj
 *                 celu podaje `npcId`, `QuestGuidance`). Wzór: ikona rozmowy
 *                 u NPC w WoW. ⚠ Celowo nie `!` ani `?` — te znaczą co innego;
 * - `trainer`   — zielony `+`: stać cię na naukę.
 *
 * ⚠ **Kolor przychodzi z `NpcStatus`** (jeden słownik barw dla świata
 * i dla szyny rozmowy), rysunek — stąd. Tekstura jest per (rodzaj, kolor).
 */


/** Tekseli na jednostkę RYSUNKU — wypalany ostro, zmniejszany przy rysowaniu. */
const RES = 6;
/** Wysokość znacznika w jednostkach rysunku (przed `DISPLAY`). */
export const NPC_MARKER_HEIGHT = 18;
/**
 * Powiększenie przy wyświetlaniu znaczników ZADAŃ (nie trenera). Render 1:1
 * (2026-10-14): przy 18 j. `!` miał kilkanaście pikseli ekranu i ginął nad
 * imieniem — WoW trzyma znacznik wyraźnie większy od napisu pod nim.
 */
const DISPLAY = 1.45;

const OUTLINE = 0x120c04;

function hex(color: string): number {
  return parseInt(color.replace("#", ""), 16);
}

/** Jaśniejsza i ciemniejsza odmiana koloru — połysk i cień rysunku. */
function shade(c: number, k: number): number {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

/** Wymiary rysunku w jednostkach świata (szerokość × wysokość). */
const SIZE: Record<NpcMarkerKind, { w: number; h: number }> = {
  available: { w: 9, h: NPC_MARKER_HEIGHT },
  turnIn: { w: 13, h: NPC_MARKER_HEIGHT },
  talk: { w: 18, h: 15 },
  trainer: { w: 13, h: 13 },
};

/**
 * Klucz tekstury dla (rodzaj, kolor) — wypalonej przy pierwszym użyciu
 * w tej scenie. Zwraca klucz gotowy do `scene.add.image`.
 */
export function npcMarkerTexture(scene: Phaser.Scene, kind: NpcMarkerKind, color: string): string {
  const key = `npc-marker-${kind}-${color.replace("#", "")}`;
  if (scene.textures.exists(key)) return key;
  const { w, h } = SIZE[kind];
  const g = scene.make.graphics({}, false);
  const c = hex(color);
  draw(g, kind, c, w * RES, h * RES);
  g.generateTexture(key, w * RES, h * RES);
  g.destroy();
  // ⚠ LINEAR, nie NEAREST: rysunek jest ×6 i ZMNIEJSZANY — NEAREST gubiłby
  //   obrys co czwarty teksel (schodki), czyli dokładnie to, z czego
  //   rezygnujemy, odchodząc od klockowatego napisu.
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  return key;
}

/** Wymiary wyświetlania (jednostki świata) — `setDisplaySize`. */
export function npcMarkerSize(kind: NpcMarkerKind): { w: number; h: number } {
  const k = kind === "trainer" ? 1 : DISPLAY;
  return { w: SIZE[kind].w * k, h: SIZE[kind].h * k };
}

function draw(g: Phaser.GameObjects.Graphics, kind: NpcMarkerKind, c: number, W: number, H: number): void {
  const u = RES;
  const jasny = shade(c, 0.45);
  const ciemny = shade(c, -0.45);
  const obrys = 1.6 * u;

  if (kind === "available") {
    // ── `!`: trapez zwężający się ku dołowi + kropka (sylwetka WoW) ──
    const cx = W / 2;
    const bar = (rozszerz: number): Phaser.Types.Math.Vector2Like[] => [
      { x: cx - 2.9 * u - rozszerz, y: 1.2 * u - rozszerz },
      { x: cx + 2.9 * u + rozszerz, y: 1.2 * u - rozszerz },
      { x: cx + 1.5 * u + rozszerz, y: 11.6 * u + rozszerz },
      { x: cx - 1.5 * u - rozszerz, y: 11.6 * u + rozszerz },
    ];
    const kropkaY = H - 3.2 * u;
    g.fillStyle(OUTLINE, 1);
    g.fillPoints(bar(obrys), true);
    g.fillCircle(cx, kropkaY, 2.4 * u + obrys);
    g.fillStyle(ciemny, 1);
    g.fillPoints(bar(0), true);
    g.fillCircle(cx, kropkaY, 2.4 * u);
    // Lico jaśniejsze od cienia o pół szerokości — rysunek ma bryłę, nie płaskość.
    g.fillStyle(c, 1);
    g.fillPoints([
      { x: cx - 2.9 * u, y: 1.2 * u },
      { x: cx + 1.6 * u, y: 1.2 * u },
      { x: cx + 0.6 * u, y: 11.6 * u },
      { x: cx - 1.5 * u, y: 11.6 * u },
    ], true);
    g.fillCircle(cx - 0.4 * u, kropkaY - 0.3 * u, 1.9 * u);
    g.fillStyle(jasny, 1);
    g.fillPoints([
      { x: cx - 2.1 * u, y: 1.9 * u },
      { x: cx - 0.9 * u, y: 1.9 * u },
      { x: cx - 1.2 * u, y: 8.5 * u },
      { x: cx - 1.6 * u, y: 8.5 * u },
    ], true);
    return;
  }

  if (kind === "turnIn") {
    // ── `?`: łuk + łącznik + kropka; obrys = ta sama ścieżka grubszą kreską ──
    const cx = W / 2;
    const cy = 5.4 * u;
    const r = 3.6 * u;
    const kropkaY = H - 3.2 * u;
    const sciezka = (szer: number, kolor: number) => {
      g.lineStyle(szer, kolor, 1);
      g.beginPath();
      g.arc(cx, cy, r, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(80), false);
      g.strokePath();
      g.beginPath();
      g.moveTo(cx + Math.cos(Phaser.Math.DegToRad(80)) * r, cy + Math.sin(Phaser.Math.DegToRad(80)) * r);
      g.lineTo(cx, 11.8 * u);
      g.strokePath();
      g.fillStyle(kolor, 1);
      // Zaokrąglone końce: kreska Phasera ma końce ścięte.
      const k0 = Phaser.Math.DegToRad(200);
      g.fillCircle(cx + Math.cos(k0) * r, cy + Math.sin(k0) * r, szer / 2);
      g.fillCircle(cx, 11.8 * u, szer / 2);
    };
    sciezka(3.4 * u + 2 * obrys, OUTLINE);
    g.fillStyle(OUTLINE, 1);
    g.fillCircle(cx, kropkaY, 2.4 * u + obrys);
    sciezka(3.4 * u, ciemny);
    sciezka(2.2 * u, c);
    g.fillStyle(ciemny, 1);
    g.fillCircle(cx, kropkaY, 2.4 * u);
    g.fillStyle(c, 1);
    g.fillCircle(cx - 0.4 * u, kropkaY - 0.3 * u, 1.9 * u);
    return;
  }

  if (kind === "talk") {
    // ── Dymek rozmowy: zaokrąglony prostokąt + ogonek w lewo-dół + trzy kropki ──
    const x0 = 1.6 * u, y0 = 1.4 * u, bw = W - 3.2 * u, bh = 9.6 * u, rr = 3.2 * u;
    const ogon = (o: number): Phaser.Types.Math.Vector2Like[] => [
      { x: x0 + 3.4 * u - o, y: y0 + bh - 1 * u },
      { x: x0 + 8.0 * u + o, y: y0 + bh - 1 * u },
      { x: x0 + 2.6 * u - o * 1.4, y: H - 1.0 * u + o },
    ];
    g.fillStyle(OUTLINE, 1);
    g.fillRoundedRect(x0 - obrys, y0 - obrys, bw + 2 * obrys, bh + 2 * obrys, rr + obrys);
    g.fillPoints(ogon(obrys), true);
    g.fillStyle(ciemny, 1);
    g.fillRoundedRect(x0, y0, bw, bh, rr);
    g.fillPoints(ogon(0), true);
    g.fillStyle(c, 1);
    g.fillRoundedRect(x0, y0, bw, bh - 1.4 * u, { tl: rr, tr: rr, bl: rr * 0.6, br: rr * 0.6 });
    g.fillStyle(jasny, 0.9);
    g.fillRoundedRect(x0 + 1.4 * u, y0 + 1.0 * u, bw - 2.8 * u, 1.3 * u, 0.65 * u);
    g.fillStyle(OUTLINE, 1);
    for (let i = -1; i <= 1; i++) g.fillCircle(x0 + bw / 2 + i * 3.6 * u, y0 + bh / 2 + 0.3 * u, 1.25 * u);
    return;
  }

  // ── `+` trenera: krzyż z obrysem ──
  const cx = W / 2, cy = H / 2, ramie = 4.6 * u, gr = 1.7 * u;
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - gr - obrys, cy - ramie - obrys, 2 * (gr + obrys), 2 * (ramie + obrys));
  g.fillRect(cx - ramie - obrys, cy - gr - obrys, 2 * (ramie + obrys), 2 * (gr + obrys));
  g.fillStyle(ciemny, 1);
  g.fillRect(cx - gr, cy - ramie, 2 * gr, 2 * ramie);
  g.fillRect(cx - ramie, cy - gr, 2 * ramie, 2 * gr);
  g.fillStyle(c, 1);
  g.fillRect(cx - gr, cy - ramie, 2 * gr - 0.8 * u, 2 * ramie - 0.8 * u);
  g.fillRect(cx - ramie, cy - gr, 2 * ramie - 0.8 * u, 2 * gr - 0.8 * u);
}

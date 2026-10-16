/**
 * ⭐ **Minimapa jako kartka PERGAMINU** (autor 2026-10-13, wątek D15 —
 * `docs/pomysly.md` „Kartografia”, referencja: krawędź mapy z Minecrafta).
 * Kartka ma odciąć mapę od świata gry — złota ramka zlewała się z HUD-em —
 * i nadać jej klimat: jasny pergamin, ciemnobrązowy kontur z nacięciami,
 * ciemniejszy pas przy samej mapie i cień, w którym kartka „wisi” nad
 * światem.
 *
 * ⚠ **CZYSTY — zero Phasera, zero stanu.** Liczy prostokąty; rysuje
 * `Minimap`. Dzięki temu `tools/hud_uklad.mjs` §6c sprawdza bez sceny, że
 * kartka razem z cieniem NIE wychodzi poza kwadrat minimapy (bok jest
 * wyprowadzony z przycisku `E` pod nią — `HUD_LAYOUT.minimap`).
 *
 * ⚠ **Siatka „pikseli” kartki = `cell` j. = jeden kafel mapy** przy zoomie
 * 0,5 (2 j. na kafel). Brzeg i mapa mają ten sam ziarnisty krok — kartka
 * z gładszym brzegiem niż rysunek na niej czytałaby się jak naklejka.
 *
 * ⚠ **Postrzępienie jest STAŁE** (skrót z pozycji, nie `Math.random`):
 * kartka nie może zmieniać brzegu przy każdym `create()` sceny.
 */

export type ParchmentTone = "outline" | "band" | "shade";

/** Paleta kartki. Pergamin MAPY (`paper`) jest jaśniejszy od obrzeża. */
export const PARCHMENT = {
  outline: 0x5e4630,
  band: 0xd8c39a,
  shade: 0xb49a6c,
  /** Tło pod rysunkiem mapy — „czysty pergamin”, gdzie mapy nie ma. */
  paper: 0xe6d7b4,
  shadow: 0x000000,
  shadowAlpha: 0.38,
} as const;

export interface PRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParchmentLayout {
  /** Obrzeże kartki: przebiegi wierszy w jednym tonie, gotowe do `fillRect`. */
  rects: (PRect & { tone: ParchmentTone })[];
  /** Sylwetka kartki (te same przebiegi bez tonu) — cień rysuje ją z przesunięciem. */
  silhouette: PRect[];
  shadow: { dx: number; dy: number };
  /** Okno rysunku mapy — kwadrat w środku obrzeża. */
  content: PRect;
}

export interface ParchmentConfig {
  /** Bok „piksela” kartki w j. */
  cell: number;
  /** Szerokość obrzeża w komórkach (kontur + pergamin + pas przy mapie). */
  band: number;
  /** Przesunięcie cienia w j. (w prawo i w dół). */
  shadow: number;
}

/** Deterministyczny skrót pozycji — Knuth, bez zależności od stanu. */
function hash(side: number, pos: number): number {
  let h = (Math.imul(pos + 1, 2654435761) ^ Math.imul(side + 7, 40503)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}

/**
 * Układ kartki w kwadracie `size × size` (jednostki minimapy, początek
 * w lewym górnym rogu kwadratu).
 */
export function parchmentLayout(size: number, cfg: ParchmentConfig): ParchmentLayout {
  const P = cfg.cell;
  // Kartka + cień muszą zmieścić się w kwadracie; 1 j. luzu z każdej strony,
  // żeby kontur nie stał na samej krawędzi pola dotyku.
  const N = Math.floor((size - cfg.shadow - 2) / P);
  const o = Math.floor((size - cfg.shadow - N * P) / 2);
  return sheetCells(N, N, o, o, cfg);
}

/**
 * ⭐ Kartka PROSTOKĄTNA `w × h` (2026-10-14) — mapa w panelu gracza. Ta sama
 * reguła brzegu, co minimapa, tylko boki mają różną liczbę komórek.
 */
export function parchmentSheet(w: number, h: number, cfg: ParchmentConfig): ParchmentLayout {
  const P = cfg.cell;
  const Nx = Math.floor((w - cfg.shadow - 2) / P);
  const Ny = Math.floor((h - cfg.shadow - 2) / P);
  return sheetCells(Nx, Ny, Math.floor((w - cfg.shadow - Nx * P) / 2), Math.floor((h - cfg.shadow - Ny * P) / 2), cfg);
}

function sheetCells(Nx: number, Ny: number, ox: number, oy: number, cfg: ParchmentConfig): ParchmentLayout {
  const P = cfg.cell;
  const C = cfg.band;
  /** Długość boku w komórkach. Bok: 0 góra, 1 prawo, 2 dół, 3 lewo. */
  const len = (side: number): number => (side % 2 === 0 ? Nx : Ny);

  // Rozdarcia brzegu: o jedną komórkę, parami (pojedyncze ząbki czytały się
  // jak szum), rogi zawsze ścięte.
  const tear = (side: number, pos: number): number => {
    if (pos === 0 || pos === len(side) - 1) return 1;
    return hash(side, pos >> 1) % 6 === 0 ? 1 : 0;
  };
  // Nacięcia (jak „nity” na ramce mapy z Minecrafta): kontur wchodzi o jedną
  // komórkę w głąb, w stałym rytmie, z przesunięciem per bok.
  const notch = (side: number, pos: number): boolean =>
    pos > 2 && pos < len(side) - 3 && (pos + side * 3) % 9 === 4 && tear(side, pos) === 0;

  const inside = (i: number, j: number): boolean => {
    if (i < 0 || j < 0 || i >= Nx || j >= Ny) return false;
    if (j < tear(0, i) || Nx - 1 - i < tear(1, j) || Ny - 1 - j < tear(2, i) || i < tear(3, j)) return false;
    return true;
  };

  const toneOf = (i: number, j: number): ParchmentTone | null => {
    if (!inside(i, j)) return null;
    const d = Math.min(i, j, Nx - 1 - i, Ny - 1 - j);
    if (d >= C) return null; // okno mapy — rysuje je wołający
    if (!inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1)) return "outline";
    if (d === 1 && ((j === 1 && notch(0, i)) || (i === Nx - 2 && notch(1, j)) || (j === Ny - 2 && notch(2, i)) || (i === 1 && notch(3, j)))) {
      return "outline";
    }
    if (d === C - 1) return "shade";
    return "band";
  };

  const rects: ParchmentLayout["rects"] = [];
  const silhouette: PRect[] = [];
  for (let j = 0; j < Ny; j++) {
    // Przebiegi tonu w wierszu → jeden prostokąt na przebieg.
    let i = 0;
    while (i < Nx) {
      const t = toneOf(i, j);
      let k = i + 1;
      while (k < Nx && toneOf(k, j) === t) k++;
      if (t) rects.push({ x: ox + i * P, y: oy + j * P, w: (k - i) * P, h: P, tone: t });
      i = k;
    }
    // Sylwetka (z oknem mapy w środku) — cień kartki.
    i = 0;
    while (i < Nx) {
      if (!inside(i, j)) {
        i++;
        continue;
      }
      let k = i + 1;
      while (k < Nx && inside(k, j)) k++;
      silhouette.push({ x: ox + i * P, y: oy + j * P, w: (k - i) * P, h: P });
      i = k;
    }
  }

  return {
    rects,
    silhouette,
    shadow: { dx: cfg.shadow, dy: cfg.shadow },
    content: { x: ox + C * P, y: oy + C * P, w: (Nx - 2 * C) * P, h: (Ny - 2 * C) * P },
  };
}

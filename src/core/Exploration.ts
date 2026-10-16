import { MAP_FOG } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";

/** Siatka mgły jednego obszaru: bit na komórkę `MAP_FOG.cellPx`. */
interface Grid {
  cols: number;
  rows: number;
  bits: Uint8Array;
  /** Ile komórek odkrytych — do `fraction` bez liczenia bitów. */
  count: number;
}

/**
 * ⭐ **Odkryty teren** (2026-10-14, „mgła jak w Minecrafcie” — `MAP_FOG`).
 *
 * Moduł-singleton jak `Gathering`: przeżywa gracza i przejścia portalem,
 * zapisywany przez `Save`. Trzyma, KTÓRE komórki którego obszaru gracz
 * widział — per obszar (`village`, `forest`, `thicket`), nie per plik
 * świata, bo id obszaru jest stabilne, a układ świata się zmienia (Gęstwina
 * może kiedyś dołączyć płynnie, wieś może się przesunąć w `swiat.world`).
 *
 * ⚠ **Pamięć działa ZAWSZE**, niezależnie od Kartografii (decyzja autora
 * 2026-10-14) — umiejętność decyduje, czy mapę WIDAĆ, nie czy się zapisuje.
 *
 * ⚠ **Koszt klatki: `visit` liczy coś dopiero przy ZMIANIE komórki gracza.**
 * Woła je `GameScene.update` co klatkę; przez 99% klatek kończy się na
 * porównaniu dwóch liczb.
 *
 * Siatka powstaje leniwie przy pierwszej wizycie, z rozmiaru obszaru —
 * obszar nigdy nieodwiedzony nie ma siatki i jest cały we mgle.
 */
class ExplorationState {
  private grids = new Map<string, Grid>();
  /** Zapis z pliku dla obszaru, którego siatki jeszcze nie ma (rozmiar znamy
   *  dopiero przy wizycie albo z obrazu minimapy) — rozpakowany przy `ensure`. */
  private pending = new Map<string, string>();
  private lastRegion = "";
  private lastCx = -1;
  private lastCy = -1;

  /** Siatka obszaru o rozmiarze `wPx × hPx`. Gdy rozmiar się zmienił
   *  (przebudowana mapa), stara pamięć przepada — przesunięte bity
   *  rysowałyby mgłę w złych miejscach, a to gorsze niż zapomnienie. */
  ensure(region: string, wPx: number, hPx: number): Grid {
    const cols = Math.max(1, Math.ceil(wPx / MAP_FOG.cellPx));
    const rows = Math.max(1, Math.ceil(hPx / MAP_FOG.cellPx));
    let g = this.grids.get(region);
    if (g && g.cols === cols && g.rows === rows) return g;
    g = { cols, rows, bits: new Uint8Array(Math.ceil((cols * rows) / 8)), count: 0 };
    const saved = this.pending.get(region);
    if (saved !== undefined) {
      this.pending.delete(region);
      decodeInto(saved, g);
    }
    this.grids.set(region, g);
    return g;
  }

  /** Siatka, jeśli obszar był odwiedzony (albo przyszedł w zapisie). Dla
   *  obszaru z zapisu potrzebny rozmiar — stąd `ensure` u rysującego. */
  has(region: string): boolean {
    return this.grids.has(region) || this.pending.has(region);
  }

  /**
   * Gracz stoi w `(x, y)` — px względem lewego górnego rogu obszaru
   * `wPx × hPx`. Odkrywa koło `MAP_FOG.revealRadiusPx`.
   */
  visit(region: string, x: number, y: number, wPx: number, hPx: number): void {
    if (wPx <= 0 || hPx <= 0) return;
    const P = MAP_FOG.cellPx;
    const cx = Math.floor(x / P);
    const cy = Math.floor(y / P);
    if (cx === this.lastCx && cy === this.lastCy && region === this.lastRegion) return;
    this.lastRegion = region;
    this.lastCx = cx;
    this.lastCy = cy;

    const g = this.ensure(region, wPx, hPx);
    // Koło liczone od ŚRODKÓW komórek do gracza — komórka liczy się, gdy jej
    // środek jest w zasięgu wzroku.
    const r = MAP_FOG.revealRadiusPx;
    const r2 = r * r;
    const span = Math.ceil(r / P) + 1;
    const fresh: number[] = [];
    for (let j = Math.max(0, cy - span); j <= Math.min(g.rows - 1, cy + span); j++) {
      const dy = (j + 0.5) * P - y;
      for (let i = Math.max(0, cx - span); i <= Math.min(g.cols - 1, cx + span); i++) {
        const dx = (i + 0.5) * P - x;
        if (dx * dx + dy * dy > r2) continue;
        const k = j * g.cols + i;
        if (g.bits[k >> 3] & (1 << (k & 7))) continue;
        g.bits[k >> 3] |= 1 << (k & 7);
        g.count++;
        fresh.push(k);
      }
    }
    if (fresh.length) GameEvents.emit(EVENT.explorationChanged, { region, cells: fresh });
  }

  /** Czy komórka `(i, j)` obszaru jest odkryta. Bez siatki — nie. */
  isCellRevealed(region: string, i: number, j: number): boolean {
    const g = this.grids.get(region);
    if (!g || i < 0 || j < 0 || i >= g.cols || j >= g.rows) return false;
    const k = j * g.cols + i;
    return (g.bits[k >> 3] & (1 << (k & 7))) !== 0;
  }

  /** Czy punkt `(x, y)` (px względem obszaru) leży na odkrytym terenie. */
  isRevealed(region: string, x: number, y: number): boolean {
    return this.isCellRevealed(region, Math.floor(x / MAP_FOG.cellPx), Math.floor(y / MAP_FOG.cellPx));
  }

  /** Wymiary siatki (kolumny, wiersze) — dla rysującego. */
  gridSize(region: string): { cols: number; rows: number } | null {
    const g = this.grids.get(region);
    return g ? { cols: g.cols, rows: g.rows } : null;
  }

  /** Część obszaru odkryta (0–1). */
  fraction(region: string): number {
    const g = this.grids.get(region);
    if (g) return g.count / (g.cols * g.rows);
    // Obszar z zapisu, jeszcze nierozpakowany — wymiary jadą w samym zapisie.
    const saved = this.pending.get(region);
    if (saved === undefined) return 0;
    if (saved === REVEALED_ALL) return 1;
    const m = /^(\d+)x(\d+):/.exec(saved);
    if (!m) return 0;
    const tmp: Grid = { cols: Number(m[1]), rows: Number(m[2]), bits: new Uint8Array(0), count: 0 };
    tmp.bits = new Uint8Array(Math.ceil((tmp.cols * tmp.rows) / 8));
    decodeInto(saved, tmp);
    return tmp.count / (tmp.cols * tmp.rows);
  }

  /** Odkryj cały obszar (konsola dev, migracja starych zapisów). */
  revealAll(region: string, wPx: number, hPx: number): void {
    const g = this.ensure(region, wPx, hPx);
    g.bits.fill(0xff);
    g.count = g.cols * g.rows;
    GameEvents.emit(EVENT.explorationChanged, { region, cells: null });
  }

  reset(): void {
    const regions = [...this.grids.keys(), ...this.pending.keys()];
    this.grids.clear();
    this.pending.clear();
    this.lastRegion = "";
    this.lastCx = this.lastCy = -1;
    for (const region of regions) GameEvents.emit(EVENT.explorationChanged, { region, cells: null });
  }

  /** Do zapisu: obszar → `"kolumny×wiersze:base64"`. Rozmiar jedzie razem
   *  z bitami, żeby zapis po przebudowie mapy dało się rozpoznać jako obcy. */
  snapshot(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [region, g] of this.grids) if (g.count) out[region] = `${g.cols}x${g.rows}:${toBase64(g.bits)}`;
    for (const [region, s] of this.pending) if (!(region in out)) out[region] = s;
    return out;
  }

  /** Z zapisu. Siatki rozpakowują się dopiero przy `ensure` — rozmiar obszaru
   *  zna dopiero scena albo obraz minimapy. */
  restore(data: Record<string, string> | undefined): void {
    this.grids.clear();
    this.pending.clear();
    this.lastRegion = "";
    this.lastCx = this.lastCy = -1;
    for (const [region, s] of Object.entries(data ?? {})) {
      if (typeof s === "string") this.pending.set(region, s);
    }
    for (const region of this.pending.keys()) GameEvents.emit(EVENT.explorationChanged, { region, cells: null });
  }
}

/** Znacznik „obszar odkryty cały” — dla migracji zapisów sprzed mgły, kiedy
 *  rozmiaru obszaru jeszcze nie znamy (`Save.load`). */
export const REVEALED_ALL = "*";

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

/** `"c×r:base64"` → bity siatki, tylko gdy wymiary się zgadzają. */
function decodeInto(saved: string, g: Grid): void {
  if (saved === REVEALED_ALL) {
    g.bits.fill(0xff);
    g.count = g.cols * g.rows;
    return;
  }
  const m = /^(\d+)x(\d+):(.*)$/.exec(saved);
  if (!m || Number(m[1]) !== g.cols || Number(m[2]) !== g.rows) return;
  let raw: string;
  try {
    raw = atob(m[3]);
  } catch {
    return;
  }
  const n = Math.min(raw.length, g.bits.length);
  for (let i = 0; i < n; i++) g.bits[i] = raw.charCodeAt(i);
  const total = g.cols * g.rows;
  let count = 0;
  for (let k = 0; k < total; k++) if (g.bits[k >> 3] & (1 << (k & 7))) count++;
  g.count = count;
}

export const Exploration = new ExplorationState();

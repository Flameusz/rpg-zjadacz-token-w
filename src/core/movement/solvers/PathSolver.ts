/**
 * A* nad `NavGrid` — jedyny konsument tej siatki (poza samym `TiledMap.ts`,
 * które ją buduje). Czysty moduł, bez Phasera: bierze siatkę i cztery liczby,
 * oddaje listę punktów świata albo `null`.
 *
 * ⚠ **To NIE jest nowa reprezentacja przestrzeni.** `NavGrid` już niesie
 * dokładnie to, czego potrzebuje trasowanie (prześwit w px, rozdzielczość
 * podkaflowa) — decyzja autora z 2026-08-28 („reprezentacja przestrzeni ma
 * powstać RAZ"). Ten plik tylko ją CZYTA.
 *
 * ⚠ **Węzeł jest przejezdny dla ciała `bodyW`, gdy `clearance ≥ bodyW`** —
 * to samo pytanie co `NavGrid.passable`, tylko zadawane tysiące razy zamiast
 * raz, więc liczone wprost na tablicy `clearance`, nie przez wywołanie
 * metody per sąsiad.
 */
import { NAV_CELL, type NavGrid } from "../NavGrid";

export interface PathPoint {
  readonly x: number;
  readonly y: number;
}

/** Twardy sufit rozwiniętych węzłów — bezpiecznik, nie parametr strojenia.
 *  Przekroczenie oddaje `null` (wywołujący wraca do surowego `seek`), więc
 *  najgorszy przypadek tej funkcji jest identyczny z jej brakiem. */
const MAX_EXPANSIONS = 20_000;

/** Promień (w komórkach), w którym szuka się NAJBLIŻSZEGO przejezdnego węzła,
 *  gdy start albo cel same w sobie są za ciasne dla `bodyW`. Ciało zwierzęcia
 *  stojące ciut za blisko pnia (albo cel — gracz — stojący w miejscu węższym
 *  niż goniące go zwierzę) nie ma prawa unieważniać całej trasy.
 *
 * ⚠ **10 komórek (80 px), nie mniej — zmierzone na żywym spawnie wilka.**
 * Jeden z czterech wilków watahy (`las_faza1b_final.md`/audyt 2026-08-31) ma
 * 16 px prześwitu w PROMIENIU 48 px od własnego punktu spawnu — pierwsza
 * otwarta (≥29 px) komórka leży dopiero 56–64 px dalej. Promień 6 komórek
 * (48 px) zwracał dla niego `null` na starcie; 10 (80 px) go już znajduje. */
const RELAX_RADIUS_CELLS = 10;

/** Ranga 8-kierunkowego sąsiedztwa: (dx, dy, koszt). Skos kosztuje √2. */
const NEI: readonly [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

function isOpen(nav: NavGrid, r: number, c: number, bodyW: number): boolean {
  if (r < 0 || c < 0 || r >= nav.rows || c >= nav.cols) return false;
  return nav.clearance[r * nav.cols + c] >= bodyW;
}

/** Najbliższa (BFS, ograniczone promieniem) przejezdna komórka do (r0,c0). */
function nearestOpen(nav: NavGrid, r0: number, c0: number, bodyW: number): [number, number] | null {
  if (isOpen(nav, r0, c0, bodyW)) return [r0, c0];
  for (let rad = 1; rad <= RELAX_RADIUS_CELLS; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue; // tylko obwód pierścienia
        const r = r0 + dr;
        const c = c0 + dc;
        if (isOpen(nav, r, c, bodyW)) return [r, c];
      }
    }
  }
  return null;
}

/** Odległość octile (8-kierunkowa) w komórkach, przeskalowana do px. */
function heuristic(r0: number, c0: number, r1: number, c1: number): number {
  const dr = Math.abs(r0 - r1);
  const dc = Math.abs(c0 - c1);
  const straight = Math.abs(dr - dc);
  const diag = Math.min(dr, dc);
  return (straight + diag * Math.SQRT2) * NAV_CELL;
}

/** Minimalny kopiec binarny na (f, węzeł) — bez zależności zewnętrznych. */
class MinHeap {
  private readonly f: number[] = [];
  private readonly node: number[] = [];

  get size(): number {
    return this.f.length;
  }

  push(fScore: number, n: number): void {
    this.f.push(fScore);
    this.node.push(n);
    let i = this.f.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[p] <= this.f[i]) break;
      this.swap(p, i);
      i = p;
    }
  }

  pop(): number {
    const top = this.node[0];
    const last = this.f.length - 1;
    this.f[0] = this.f[last];
    this.node[0] = this.node[last];
    this.f.pop();
    this.node.pop();
    let i = 0;
    for (;;) {
      const l = i * 2 + 1;
      const rr = i * 2 + 2;
      let smallest = i;
      if (l < this.f.length && this.f[l] < this.f[smallest]) smallest = l;
      if (rr < this.f.length && this.f[rr] < this.f[smallest]) smallest = rr;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
    return top;
  }

  private swap(a: number, b: number): void {
    [this.f[a], this.f[b]] = [this.f[b], this.f[a]];
    [this.node[a], this.node[b]] = [this.node[b], this.node[a]];
  }
}

/**
 * Znajdź trasę dla ciała `bodyW` od (startX,startY) do (goalX,goalY).
 *
 * Zwraca `null`, gdy: nie ma siatki, cel jest nieosiągalny, albo poszukiwanie
 * przekroczyło `MAX_EXPANSIONS` — we wszystkich trzech przypadkach wołający
 * ma wrócić do surowego celu (`seek` w linii prostej), czyli DZISIEJSZEGO
 * zachowania. Ta funkcja nigdy nie pogarsza sytuacji, tylko czasem nie
 * pomaga.
 */
export function findPath(
  nav: NavGrid,
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  bodyW: number,
): PathPoint[] | null {
  // Najtańszy przypadek, i najczęstszy: linia prosta jest wolna. Płaci
  // dokładnie tyle, co dzisiejsza sonda steru — jedno przejście po siatce.
  if (nav.hasClearLine(startX, startY, goalX, goalY, bodyW)) {
    return [{ x: goalX, y: goalY }];
  }

  const cols = nav.cols;
  const sc = Math.floor(startX / NAV_CELL);
  const sr = Math.floor(startY / NAV_CELL);
  const gc = Math.floor(goalX / NAV_CELL);
  const gr = Math.floor(goalY / NAV_CELL);

  const startCell = nearestOpen(nav, sr, sc, bodyW);
  const goalCell = nearestOpen(nav, gr, gc, bodyW);
  if (!startCell || !goalCell) return null;
  const [r0, c0] = startCell;
  const [r1, c1] = goalCell;
  if (r0 === r1 && c0 === c1) {
    return [{ x: goalX, y: goalY }];
  }

  const startIdx = r0 * cols + c0;
  const goalIdx = r1 * cols + c1;

  const gScore = new Map<number, number>([[startIdx, 0]]);
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  const open = new MinHeap();
  open.push(heuristic(r0, c0, r1, c1), startIdx);

  let expansions = 0;
  let reached = false;

  while (open.size > 0) {
    const cur = open.pop();
    if (closed.has(cur)) continue;
    closed.add(cur);
    if (cur === goalIdx) {
      reached = true;
      break;
    }
    if (++expansions > MAX_EXPANSIONS) break;

    const r = Math.floor(cur / cols);
    const c = cur % cols;
    const gCur = gScore.get(cur) ?? Infinity;

    for (const [dr, dc, cost] of NEI) {
      const nr = r + dr;
      const nc = c + dc;
      if (!isOpen(nav, nr, nc, bodyW)) continue;
      // Zakaz przecinania po przekątnej między dwiema zajętymi komórkami —
      // inaczej trasa "przeciska się" przez róg pnia, którego ciało w
      // rzeczywistości by nie ominęło.
      if (dr !== 0 && dc !== 0) {
        if (!isOpen(nav, r + dr, c, bodyW) || !isOpen(nav, r, c + dc, bodyW)) continue;
      }
      const ni = nr * cols + nc;
      if (closed.has(ni)) continue;
      const tentative = gCur + cost * NAV_CELL;
      if (tentative < (gScore.get(ni) ?? Infinity)) {
        gScore.set(ni, tentative);
        parent.set(ni, cur);
        open.push(tentative + heuristic(nr, nc, r1, c1), ni);
      }
    }
  }

  if (!reached) return null;

  // Odtwórz trasę komórka-po-komórce, środkami komórek w pikselach świata.
  const cellPath: PathPoint[] = [];
  let node: number | undefined = goalIdx;
  while (node !== undefined) {
    const r = Math.floor(node / cols);
    const c = node % cols;
    cellPath.push({ x: c * NAV_CELL + NAV_CELL / 2, y: r * NAV_CELL + NAV_CELL / 2 });
    node = parent.get(node);
  }
  cellPath.reverse();
  cellPath.push({ x: goalX, y: goalY });

  return simplify(nav, cellPath, bodyW);
}

/**
 * String-pulling: zostaw tylko punkty załamania. Surowa trasa A* skręca co
 * komórkę (8 px) — podane wprost jako cele `seek`, dałyby drganie zamiast
 * ruchu. Zachłanne „jak najdalej widać" jest tu wystarczające — trasa i tak
 * biegnie środkami wolnej przestrzeni, więc skrót rzadko wraca w przeszkodę.
 */
function simplify(nav: NavGrid, path: readonly PathPoint[], bodyW: number): PathPoint[] {
  if (path.length <= 2) return path.slice();
  const out: PathPoint[] = [path[0]];
  let anchor = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[anchor];
    const b = path[i];
    if (i < path.length - 1 && nav.hasClearLine(a.x, a.y, path[i + 1].x, path[i + 1].y, bodyW)) {
      continue; // dalszy punkt też widoczny wprost — nie zatrzymuj się na tym
    }
    out.push(b);
    anchor = i;
  }
  return out;
}

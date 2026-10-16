/**
 * Pamięć TRASY jednego stworzenia — właścicielem jest `Locomotion`, tak samo
 * jak `SteerState`. Czysty moduł (bez Phasera): dostaje `NavGrid` i liczby,
 * oddaje najbliższy punkt, do którego warto teraz jechać.
 *
 * ⚠ **Nie liczy trasy co klatkę.** `PathSolver.findPath` jest wołany tylko
 * przy ZDARZENIU (cel przesunął się znacząco / trasa się skończyła / minął
 * limit wieku / stworzenie stoi w miejscu mimo intencji ruchu) — reszta
 * klatek to jedno porównanie odległości do bieżącego punktu.
 */
import { findPath, type PathPoint } from "./solvers/PathSolver";
import type { NavGrid } from "./NavGrid";

/** Cel przesunięty o mniej niż tyle nie zasługuje na nowe liczenie trasy. */
const GOAL_MOVE_PX = 40;
/** Wiek trasy, po którym i tak ją odświeżamy — safety net, nie codzienność. */
const MAX_AGE_MS = 4000;
/** W promieniu tylu px od punktu trasy uznajemy go za osiągnięty. */
const WAYPOINT_RADIUS_PX = 14;
/** Ile trzeba postać bez postępu, żeby uznać się za utkniętego. */
const STUCK_MS = 700;
const STUCK_EPS_PX = 6;

export class PathFollower {
  private waypoints: PathPoint[] = [];
  private idx = 0;
  private goalX = NaN;
  private goalY = NaN;
  private bodyW = 0;
  private computedAtMs = -Infinity;
  private progressAtMs = -Infinity;
  private progressX = NaN;
  private progressY = NaN;
  /**
   * **Czy ostatnie liczenie trasy stwierdziło BRAK DROGI.**
   *
   * ⚠⚠ Nie mylić z „brak podpowiedzi". `next()` zwraca `null` w DWÓCH różnych
   * sytuacjach: gdy trasy nie trzeba (czysta linia do celu) i gdy trasy **NIE
   * MA**. Do 2026-09-05 wołający nie miał jak ich odróżnić, więc `Locomotion`
   * w obu przypadkach zostawiał surowy `seek` na cel — a przy zamkniętym celu
   * znaczyło to „pchaj się w drzewo w nieskończoność". `findPath` **już
   * wtedy** zwracał `null` dla celu bez trasy; ta informacja była liczona
   * i wyrzucana.
   */
  private noRoute = false;

  /**
   * Punkt, w który TERAZ warto celować — końcowy cel wprost, gdy droga jest
   * czysta albo `nav` nie istnieje (mapa awaryjna), inaczej najbliższy
   * punkt trasy. `null` znaczy „użyj surowego celu" (brak siatki, brak
   * trasy — wołający i tak już ma `goalX/goalY`).
   *
   * ⚠ **Start i CEL są od 2026-09-07 w tej samej przestrzeni — środków ciał.**
   * Do tej daty `bodyX/bodyY` przychodziło z ciała, a `goalX/goalY` z intencji
   * liczonej w przestrzeni duszków, więc A* trasowało z jednego punktu do
   * celu przesuniętego o kilkanaście pikseli w pionie. Patrz `MoveSelf`.
   */
  next(
    nav: NavGrid | null,
    nowMs: number,
    bodyX: number,
    bodyY: number,
    goalX: number,
    goalY: number,
    bodyW: number,
  ): PathPoint | null {
    if (!nav) return null;

    if (!Number.isFinite(this.progressX)) {
      this.progressX = bodyX;
      this.progressY = bodyY;
      this.progressAtMs = nowMs;
    }
    const movedSinceProgress = Math.hypot(bodyX - this.progressX, bodyY - this.progressY);
    if (movedSinceProgress > STUCK_EPS_PX) {
      this.progressX = bodyX;
      this.progressY = bodyY;
      this.progressAtMs = nowMs;
    }
    const stuck = nowMs - this.progressAtMs > STUCK_MS;

    const goalMoved = Math.hypot(goalX - this.goalX, goalY - this.goalY) > GOAL_MOVE_PX;
    const stale = nowMs - this.computedAtMs > MAX_AGE_MS;
    const exhausted = this.idx >= this.waypoints.length;
    const wrongBody = bodyW !== this.bodyW;

    // ⚠⚠ **`exhausted` nie może wymuszać liczenia, gdy wiadomo, że trasy NIE MA.**
    //   Przy pustej liście `idx >= length` jest prawdą ZAWSZE, więc przed tą
    //   poprawką A* liczyło się **co klatkę** — zmierzone 120/120 klatek na
    //   zamkniętym celu. Teraz przelicza dopiero, gdy wygaśnie `MAX_AGE_MS`,
    //   cel się przesunie albo zmieni się ciało: sytuacja bez trasy ma prawo
    //   się zmienić, ale nie sześćdziesiąt razy na sekundę.
    const przeliczyc = goalMoved || stale || wrongBody || stuck || (exhausted && !this.noRoute);
    if (przeliczyc) {
      const trasa = findPath(nav, bodyX, bodyY, goalX, goalY, bodyW);
      this.noRoute = trasa === null;
      this.waypoints = trasa ?? [];
      this.idx = 0;
      this.goalX = goalX;
      this.goalY = goalY;
      this.bodyW = bodyW;
      this.computedAtMs = nowMs;
      // Zresetuj licznik utknięcia — świeża trasa zasługuje na własne okno,
      // zamiast dziedziczyć czas bezruchu sprzed przeliczenia.
      this.progressAtMs = nowMs;
      this.progressX = bodyX;
      this.progressY = bodyY;
    }

    if (this.waypoints.length === 0) return null; // brak trasy -> surowy cel

    while (
      this.idx < this.waypoints.length - 1 &&
      Math.hypot(bodyX - this.waypoints[this.idx].x, bodyY - this.waypoints[this.idx].y) <
        WAYPOINT_RADIUS_PX
    ) {
      this.idx++;
    }
    // Ostatni punkt trasy JEST celem — jego dotarcie kończy trasowanie
    // naturalnie (kolejne wywołanie odczyta `exhausted` dopiero po minięciu
    // promienia, co jest zamierzone: nie ma czego jeszcze doliczać).
    return this.waypoints[this.idx];
  }

  /**
   * **Czy z ostatnio badanej pozycji NIE MA drogi do celu.**
   *
   * ⚠ Odpowiedź pochodzi wprost z `findPath` (A* nad `NavGrid`) — czyli
   * z warstwy, która i tak liczy się dla każdego `seek`. **Żadnego nowego
   * pathfindingu, żadnego timeoutu.**
   * ⚠ `false` dopóki nic nie policzono; „nie wiem" i „jest droga" są tu
   * celowo tym samym, bo obie znaczą „nie przerywaj pościgu".
   */
  get unreachable(): boolean {
    return this.noRoute;
  }
}

/**
 * Kontrakt solvera ruchu — JAK osiągnąć intencję.
 *
 * ⚠ **Zachowania nigdy nie widzą solvera i to jest cały sens tej warstwy.**
 * `Boar.updateChase` mówi „`seek(gracz)`" i to zdanie jest identyczne pod
 * ruchem wprost, pod omijaniem lokalnym i — kiedy powstanie — pod A*.
 * Dołożenie `PathSolver` ma być nowym plikiem obok tych dwóch, nigdy
 * refaktorem AI.
 */
import type { MoveIntent, Velocity } from "./MoveIntent";
import type { MovementContext } from "./MovementContext";
import type { SteerState } from "./Steering";

/**
 * Wszystko, co solver wie o stworzeniu, które prowadzi.
 *
 * ⚠⚠ **JEDNA PRZESTRZEŃ: ŚRODEK CIAŁA (`body.center`).** To jest dokładnie ten
 * punkt, który walka zna jako `combatOrigin` — więc `circleRadius`, `seek` i
 * `gapBetween` mierzą od tego samego miejsca.
 *
 * ⚠ **Pola `x`/`y` (środek DUSZKA) zostały USUNIĘTE 2026-09-07 i to jest cała
 * treść tej naprawy, nie porządki.** Do tej daty solver liczył wektor od
 * duszka, a `Steering`/`PathFollower` sondowały świat od ciała — dwie
 * przestrzenie w jednej klatce. Ciało siedzi u stóp (u gracza **19 px** pod
 * środkiem duszka, u wilka 9,9, u skoczka 2,25), a przesunięcie jest PIONOWE,
 * więc ta sama liczba w configu znaczyła co innego zależnie od tego, po której
 * stronie gracza stał przeciwnik: prześwit do wilka na orbicie `circleRadius`
 * 96 wahał się **75,2–93,4 px**, czyli o 18,2 px, bez żadnego pola, które by
 * o tym mówiło.
 *
 * ⛔ **Nie przywracaj tych pól.** Ich brak jest jedynym STRUKTURALNYM
 * zabezpieczeniem: solver, który nie ma dostępu do pozycji duszka, nie może
 * przypadkiem policzyć w niej wektora. Punkt, w którym duszek jest naprawdę
 * potrzebny (kotwica wędrówki), podnosi się jawnie przez
 * `Locomotion.bodyOffsetY`.
 *
 * ⚠ **Sprite → ciało to przesunięcie w praktyce WYŁĄCZNIE w osi Y.**
 * `applyBody` centruje ciało w poziomie (`offsetX = (sprite.width − w)/2`),
 * a arytmetyka Phasera skraca się wtedy do `center.x = sprite.x + halfWidth −
 * scaleX × bodyW/2`. Reszta jest **podpikselowa i ma dwa źródła, oba istniejące
 * przed tą zmianą**: `Enemy.restoreBodySize` zapisuje `halfWidth` przez
 * `Math.floor` (zmierzone odchylenie **0,00–0,40 px** na całym rosterze),
 * a `updateMotionFx` perturbuje `scaleX` co klatkę kosmetycznym ściskaniem.
 *
 * ⚠ **To NIE jest usterka wprowadzona tutaj i nie jest nowa** — dokładnie tę
 * samą chwiejność ma od dawna `combatOrigin`, czyli cała geometria walki.
 * Skutek tej zmiany jest taki, że ruch **dzieli ją z walką**, zamiast mieć
 * własną. ⛔ Nie „naprawiaj" tego zaokrągleniem obok — to byłoby drugie
 * lustro na `body.center`.
 *
 * Konsekwencja praktyczna: `setFlipX(cel.x < this.x)` zostaje na duszku
 * i jest poprawne — pomyłka rzędu 0,4 px nie przewraca pytania „w lewo czy
 * w prawo".
 */
export interface MoveSelf {
  /** Środek CIAŁA — w tej przestrzeni liczy się WSZYSTKO w tej warstwie:
   *  wektor intencji, sonda przeszkód i trasa A*. */
  readonly bodyX: number;
  readonly bodyY: number;
  readonly bodyW: number;
  readonly bodyH: number;
  /** Czas klatki w sekundach. */
  readonly dt: number;
  /** Pamięć objazdu tego konkretnego stworzenia. */
  readonly steerState: SteerState;
}

export interface MoveSolver {
  solve(intent: MoveIntent, self: MoveSelf, ctx: MovementContext): Velocity;
}

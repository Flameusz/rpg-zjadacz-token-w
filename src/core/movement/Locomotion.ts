/**
 * Komponent ruchu jednego stworzenia: przyjmuje INTENCJĘ od zachowania,
 * oddaje ją solverowi, wpisuje wynik w ciało.
 *
 * ⚠ **Kompozycja, nie klasa bazowa — i to jest wymuszone przez kod, nie
 * gust.** `Enemy`, `Critter`, `FarmAnimal`, `Player` i `Projectile` rozszerzają
 * `Phaser.Physics.Arcade.Sprite` każde osobno; wspólnego przodka nie ma.
 * Wciśnięcie ruchu w hierarchię skończyłoby się albo trzecim równoległym
 * drzewem, albo `Critter extends Enemy` — czyli zdaniem, że sarna jest wrogiem.
 *
 * ## ⚠ Migracja zachowań jest BEZPIECZNA PO JEDNYM
 *
 * `beginFrame()` kasuje intencję, `resolve()` **nie robi nic, gdy w tej klatce
 * nikt jej nie zgłosił**. Podklasa jeszcze niezmigrowana pisze prędkość wprost
 * do ciała — tak jak dzisiaj — i warstwa się nie odzywa. Dzięki temu siedem
 * podklas przechodzi po kolei, a nie jednym wsadem.
 */
import Phaser from "phaser";
import {
  flee,
  hold,
  impulse,
  ring,
  seek,
  type MoveIntent,
} from "./MoveIntent";
import { movementContextFor } from "./MovementContext";
import { PathFollower } from "./PathFollower";
import type { MoveSelf, MoveSolver } from "./MoveSolver";
import { directSolver } from "./solvers/DirectSolver";
import { steerSolver } from "./solvers/SteerSolver";
import { freshSteerState } from "./Steering";

/** Który solver prowadzi to stworzenie. Wybór mieszka w `GameConfig`. */
export type SolverKind = "direct" | "steer";

export class Locomotion {
  private intent: MoveIntent | null = null;
  private readonly steerState = freshSteerState();
  private readonly solver: MoveSolver;
  /**
   * ⚠ **Trasowanie globalne (`PathSolver`) siedzi TUTAJ, nie w solverze.**
   * Model: `PathFollower` przestawia cel `seek` na najbliższy punkt trasy,
   * PO CZYM ten sam `solver` (direct/steer) prowadzi do niego lokalnie —
   * dokładnie „PathSolver wyznacza trasę globalną, SteerSolver koryguje
   * lokalnie w locie". Dotyczy WYŁĄCZNIE intencji `seek`: `flee` nie ma
   * punktu docelowego (nic do trasowania), `ring`/`impulse`/`hold` nie mają
   * czego omijać globalnie (patrz `Steering.ts`, ta sama zasada).
   *
   * Bezpieczne dla każdego wołającego: `Locomotion` jest jedynym miejscem,
   * w którym powstaje `.move.*` (`Player`/`FarmAnimal`/`Projectile` w ogóle
   * go nie używają), więc to obejmuje CAŁY roster `Enemy`+`Critter` bez
   * dotykania choćby jednej linii w ich `updateChase`.
   */
  private readonly pathFollower = new PathFollower();
  private brakTrasy = false;

  /**
   * **Czy ostatnie `seek` nie ma DROGI do celu** (A* nad `NavGrid` zwróciło
   * `null`), a nie tylko przeszkodę do ominięcia.
   *
   * ⚠ Istnieje, bo ta informacja była **liczona i wyrzucana**: `PathFollower`
   * zwracał `null` zarówno przy „czysta linia, nie trzeba trasy", jak i przy
   * „trasy NIE MA", a `Locomotion` w obu przypadkach zostawiał surowy `seek`.
   * Skutkiem było dobijanie się do drzewa bez końca.
   * ⛔ Nie jest to timeout ani licznik prób — to odpowiedź nawigacji.
   */
  get targetUnreachable(): boolean {
    return this.brakTrasy;
  }

  constructor(
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    kind: SolverKind = "direct",
  ) {
    this.solver = kind === "steer" ? steerSolver : directSolver;
  }

  /** Nowa klatka AI — poprzednia intencja przestaje obowiązywać. */
  beginFrame(): void {
    this.intent = null;
  }

  /**
   * **O ile ŚRODEK CIAŁA leży niżej niż środek duszka** (px świata, zawsze ≥ 0).
   *
   * ⚠⚠ **Istnieje po to i TYLKO po to, żeby podnieść do przestrzeni ciał punkt,
   * który powstał w przestrzeni duszka** — czyli kotwicę wędrówki
   * (`Enemy.patrol`, `Critter.decide`), liczoną wokół pozycji SPAWNU. Wszystkie
   * intencje przyjmują od 2026-09-07 współrzędne CIAŁA (`MoveSelf`), więc
   * podanie im surowego `homeX/homeY` przesunęłoby cały obszar wędrówki.
   *
   * ⚠ **Podniesienie kotwicy o tę wartość jest ZMIANĄ ZEROWĄ** i to jest cały
   * powód, dla którego wolno go tu użyć: duszek i ciało są ze sobą sztywno
   * związane, więc przesunięcie OBU stron porównania o tę samą stałą daje
   * dokładnie ten sam dysk pozycji, ten sam próg dojścia i ten sam tor.
   *
   * ⛔ **Nie używaj tego do niczego, co dotyczy DRUGIEJ encji.** „Gdzie jest
   * gracz" ma jedną odpowiedź — `combatOrigin` — a nie „mój duszek plus mój
   * offset". Odejmowanie cudzego offsetu jest dokładnie tym mieszaniem
   * przestrzeni, które ta zmiana usunęła.
   */
  get bodyOffsetY(): number {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    return body ? body.center.y - this.sprite.y : 0;
  }

  /** Czy zachowanie zgłosiło w tej klatce intencję (czyli czy jest zmigrowane). */
  get declared(): boolean {
    return this.intent !== null;
  }

  /* ══════════════════════════════════════════════════════════════════════
     ⚠⚠ WSZYSTKIE PUNKTY NIŻEJ SĄ W PRZESTRZENI CIAŁ (`body.center`).
     ══════════════════════════════════════════════════════════════════════
     Cel będący inną encją podaje się jako jej `combatOrigin` — nigdy jako
     `encja.x/.y`. To ten sam punkt, od którego walka liczy prześwit, więc
     `circleRadius`, `seek` i `gapBetween` mierzą wreszcie od jednego miejsca.

     Punkt powstały w przestrzeni DUSZKA (kotwica wędrówki wokół spawnu)
     podnosi się jawnie przez `bodyOffsetY` — patrz tam, łącznie z dowodem,
     że to podniesienie jest zmianą zerową.
     ══════════════════════════════════════════════════════════════════════ */

  hold(): void {
    this.intent = hold();
  }

  seek(x: number, y: number, speed: number): void {
    this.intent = seek(x, y, speed);
  }

  flee(fromX: number, fromY: number, speed: number): void {
    this.intent = flee(fromX, fromY, speed);
  }

  ring(
    cx: number,
    cy: number,
    radius: number,
    sign: 1 | -1,
    leadRad: number,
    speed: number,
    closeInBeyond: number,
    closeInSpeed: number,
  ): void {
    this.intent = ring(cx, cy, radius, sign, leadRad, speed, closeInBeyond, closeInSpeed);
  }

  /**
   * Zobowiązanie — leć tym wektorem. Solver się nie odzywa (patrz `MoveIntent`).
   * Okno czasowe pilnuje zachowanie, tak jak dziś: ta warstwa nie ma zegara.
   */
  impulse(vx: number, vy: number): void {
    this.intent = impulse(vx, vy);
  }

  /**
   * Zamień intencję na prędkość ciała. Woła się RAZ na klatkę, po zachowaniu
   * i **przed** `postMove` — hook kształtujący ma dostać wektor gotowy.
   */
  resolve(): void {
    if (!this.intent) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const self: MoveSelf = {
      bodyX: body.center.x,
      bodyY: body.center.y,
      bodyW: body.width,
      bodyH: body.height,
      dt: this.sprite.scene.game.loop.delta / 1000,
      steerState: this.steerState,
    };

    const ctx = movementContextFor(this.sprite.scene);
    let intent = this.intent;
    if (intent.kind === "seek") {
      const wp = this.pathFollower.next(
        ctx.nav,
        this.sprite.scene.time.now,
        self.bodyX,
        self.bodyY,
        intent.x,
        intent.y,
        self.bodyW,
      );
      // `wp` bywa dosłownie równe (intent.x, intent.y) w otwartym terenie
      // (droga prosta jest wolna) — wtedy to przypisanie jest no-opem co do
      // wartości, tylko co do referencji, i solver liczy identyczny wektor.
      if (wp) intent = seek(wp.x, wp.y, intent.speed);
    }
    // ⚠ Zapamiętane dla wołającego — patrz `targetUnreachable`.
    this.brakTrasy = this.intent.kind === "seek" && this.pathFollower.unreachable;

    const v = this.solver.solve(intent, self, ctx);
    body.setVelocity(v.x, v.y);
  }
}

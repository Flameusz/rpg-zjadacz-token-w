/**
 * Najprostszy solver: intencja w linii prostej, teren ignorowany.
 *
 * ⚠ **ARYTMETYKA jest dzisiejsza co do bitu** — `physics.moveToObject` dla
 * pościgu, `moveTo` dla patrolu, `normalize().scale()` dla ucieczki. Migracja
 * zachowań na warstwę ruchu miała być pod tym solverem **niewidoczna
 * w rozgrywce** i to kryterium obowiązuje dalej: `desiredVelocity` nie
 * zmieniło ani jednej operacji.
 *
 * ⚠⚠ **Zmieniła się PRZESTRZEŃ, w której te same wzory są liczone
 * (2026-09-07).** Do tej daty wektor wychodził ze środka DUSZKA, a `Steering`
 * i `PathFollower` sondowały świat od ciała. Dziś wszystko idzie od
 * `body.center`, czyli od tego samego punktu, którym mierzy walka
 * (`combatOrigin`) — patrz `MoveSelf`.
 *
 * Zostaje na stałe, nie jako etap przejściowy: stworzenie w otwartym terenie
 * nie potrzebuje niczego więcej, a każda sonda kosztuje zapytanie do drzewa
 * kolizji.
 */
import { desiredVelocity, type MoveIntent, type Velocity } from "../MoveIntent";
import type { MovementContext } from "../MovementContext";
import type { MoveSelf, MoveSolver } from "../MoveSolver";

export class DirectSolver implements MoveSolver {
  solve(intent: MoveIntent, self: MoveSelf, _ctx: MovementContext): Velocity {
    return desiredVelocity(intent, self.bodyX, self.bodyY);
  }
}

/** Jedna instancja wystarczy — solver jest bezstanowy, stan siedzi w encji. */
export const directSolver = new DirectSolver();

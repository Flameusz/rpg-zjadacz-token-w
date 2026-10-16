/**
 * Solver z lokalnym omijaniem przeszkód: sonda w przód + wachlarz odchyleń
 * + zobowiązanie liczone w pikselach drogi.
 *
 * ⚠ **Polityka wobec przeszkody należy do INTENCJI, nie do stworzenia** — i to
 * jest jedyny powód, dla którego ta klasa jest krótka. `impulse` w ogóle tu nie
 * wchodzi (zobowiązanie jest właścicielem ciała), `hold` nie ma czego omijać,
 * a `flee` dostaje węższy sufit odchylenia niż `seek`, bo ucieczka nie ma
 * punktu docelowego, do którego wolno zawrócić.
 *
 * ⚠ **Kosztuje zapytania do drzewa kolizji** (`overlapRect` na sondę), więc jest
 * włączany per gatunek, nie globalnie. Przy pustej drodze wychodzi po
 * PIERWSZEJ sondzie — otwarty teren płaci jedno zapytanie na klatkę.
 */
import { MOVEMENT } from "../../../config/GameConfig";
import { desiredVelocity, type MoveIntent, type Velocity } from "../MoveIntent";
import type { MovementContext } from "../MovementContext";
import type { MoveSelf, MoveSolver } from "../MoveSolver";
import { consumeCommitment, steer } from "../Steering";

export class SteerSolver implements MoveSolver {
  solve(intent: MoveIntent, self: MoveSelf, ctx: MovementContext): Velocity {
    // ⚠ Wektor liczony od ŚRODKA CIAŁA — tego samego punktu, którym niżej
    // sonduje `steer` i którym mierzy walka (`combatOrigin`). Do 2026-09-07
    // stało tu `self.x, self.y`, czyli sonda i wektor szły z dwóch różnych
    // przestrzeni w tej samej klatce. Patrz `MoveSelf`.
    const desired = desiredVelocity(intent, self.bodyX, self.bodyY);

    // ⚠⚠ **`impulse` KASUJE pamięć objazdu, `hold` ją ZACHOWUJE — i ta różnica
    // jest całą naprawą „dzik wraca w stronę sadzawki" (2026-09-05, playtest).**
    //
    // Do tej daty oba przypadki zerowały `steerState`. Dla `impulse` jest to
    // poprawne: odrzut albo lot szarży PRZESTAWIA ciało gdzie indziej, więc
    // wybrana wcześniej strona objazdu opisuje sytuację, której już nie ma.
    //
    // Dla `hold` było **błędem**. `hold` znaczy „stój", a nie „zapomnij, którędy
    // omijałeś". `Boar.updateAi` woła `move.hold()` przy KAŻDEJ akcji
    // (`if (this.akcje.busy)`): telegraf szarży 560 ms, zamach kła 420 ms,
    // każde odzyskanie. Co taką pauzę dzik tracił wybraną stronę i po wznowieniu
    // pościgu losował ją od zera — czasem tę samą, czasem przeciwną, czyli
    // z powrotem na przeszkodę.
    //
    // Zmierzone na PRAWDZIWYM `steerSolver` (układ sadzawka + drzewo, ciało
    // 46 px, 52 px/s), pauzy co 132 klatki po 34 (telegraf szarży co cooldown):
    //   bez pauz              → 0 zmian strony, cel po 698 klatkach
    //   pauzy co 180 / 40     → **6 zmian, cel NIEOSIĄGNIĘTY** w 1200 klatkach
    //   pauzy co  90 / 25     → **10 zmian, cel NIEOSIĄGNIĘTY**
    //   pauzy co  60 / 20     → **15 zmian, cel NIEOSIĄGNIĘTY**
    // Objaw zgadzał się ze zgłoszeniem co do słowa: „idzie poprawnie → wraca →
    // po 3–4 próbach dociera".
    //
    // ⛔ To NIE jest nowa pamięć ani nowy system. Pamięć objazdu istniała od
    //    początku (`SteerState`); jedyne, co się zmienia, to że stanie w miejscu
    //    przestaje ją wymazywać. `commitPx` nietknięte.
    // ⚠ Zobowiązanie i tak nie tyka podczas `hold`: `consumeCommitment` niżej
    //    zjada je PRZEBYTĄ DROGĄ, a stojąc nie przebywa się żadnej.
    if (intent.kind === "impulse") {
      self.steerState.sign = 0;
      self.steerState.leftPx = 0;
      return desired;
    }
    if (intent.kind === "hold") return desired;

    const out = steer(
      {
        desiredX: desired.x,
        desiredY: desired.y,
        bodyX: self.bodyX,
        bodyY: self.bodyY,
        bodyW: self.bodyW,
        bodyH: self.bodyH,
        dt: self.dt,
        maxDeflectDeg: MOVEMENT.maxDeflectDeg[intent.kind],
      },
      MOVEMENT.steer,
      self.steerState,
      (x, y, w, h) => ctx.isFree(x, y, w, h),
    );

    consumeCommitment(self.steerState, Math.hypot(out.x, out.y), self.dt);
    return out;
  }
}

/** Bezstanowy — pamięć objazdu siedzi w `MoveSelf.steerState`, per stworzenie. */
export const steerSolver = new SteerSolver();

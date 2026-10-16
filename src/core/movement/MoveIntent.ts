/**
 * SŁOWNIK INTENCJI RUCHU — czego zachowanie chce, nigdy jak to osiągnąć.
 *
 * ⚠ **To jest cała granica tej warstwy.** Zachowanie (`Boar.updateChase`,
 * `Wolf.circleStep`, `Critter.enterBolt`) mówi „chcę dojść tam" albo „chcę się
 * oddalić"; SOLVER decyduje, jakim wektorem. Dzięki temu dołożenie kiedyś
 * `PathSolver` (A*) nie dotyka ani jednej linii AI: zdanie „`seek(gracz)`" jest
 * identyczne pod ruchem wprost, pod omijaniem i pod szukaniem drogi.
 *
 * ⚠ **Pięć rodzajów, bo każdy ma INNĄ POLITYKĘ WOBEC PRZESZKODY.** To nie jest
 * podział estetyczny — wynika z pomiaru. Zryw sarny (`impulse`) potraktowany
 * jak dojście do punktu (`seek`) i „ominięty" przeszkodą **skrócił ucieczkę
 * z 83 % na 73 % pełnych zrywów**: omijanie zawraca ku celowi, a ucieczka celu
 * nie ma. Poprawne nazwanie intencji usuwa ten błąd z definicji, zamiast
 * łatać go doborem stałej.
 *
 * ⚠⚠ **KAŻDA współrzędna w tym pliku — `x`/`y` w `seek`, `fromX`/`fromY`
 * w `flee`, `cx`/`cy` w `ring` oraz `selfX`/`selfY` w `desiredVelocity` — jest
 * w przestrzeni ŚRODKÓW CIAŁ (`body.center`), a nie duszków (2026-09-07).**
 * To jest ta sama przestrzeń, w której walka liczy `combatOrigin`
 * i `gapBetween`. Powód i pomiar: `MoveSolver.MoveSelf`.
 *
 * ⛔ **Sama ARYTMETYKA jest nietknięta** — obie konwencje normalizacji zostają
 * bit w bit, bo zmieniło się wyłącznie to, jakie liczby tu wchodzą. Pilnuje
 * tego `tools/movement_weryfikacja.mjs`, który woła te funkcje wprost.
 *
 * ⚠ **Plik jest CZYSTY — bez Phasera, bez sceny, bez encji.** Ma dać się
 * uruchomić w Node, bo tylko wtedy da się cokolwiek o nim udowodnić. Ta sama
 * reguła co dla `CombatGeometry`/`HitResolver` (patrz `src/core/CLAUDE.md`).
 */

/** Stój. Prędkość zerowana co klatkę. */
export interface HoldIntent {
  readonly kind: "hold";
}

/**
 * Dojdź do punktu. Cel jest wiążący — solver ma prawo nadłożyć drogi.
 * Używają: pościg wszystkich stworzeń, patrol, wędrówka krytterów.
 */
export interface SeekIntent {
  readonly kind: "seek";
  readonly x: number;
  readonly y: number;
  readonly speed: number;
}

/**
 * Zwiększaj dystans od źródła zagrożenia. **Punktu docelowego NIE MA** —
 * wiążący jest kierunek, więc solver może się ślizgać wzdłuż przeszkody, ale
 * nie ma prawa zawracać „do celu".
 */
export interface FleeIntent {
  readonly kind: "flee";
  readonly fromX: number;
  readonly fromY: number;
  readonly speed: number;
}

/**
 * Trzymaj się na obwodzie okręgu wokół punktu. Orbita wilka i pasmo ognia
 * sieciarza to ta sama intencja z innym promieniem.
 *
 * `sign` to kierunek obiegu (+1/−1), `leadRad` — o ile wyprzedzić własny
 * azymut. Celowanie w punkt wyprzedzenia zamiast całkowania kąta jest
 * niezależne od liczby klatek i samo się poprawia po odepchnięciu — to
 * zachowanie wilka przeniesione bez zmian.
 */
export interface RingIntent {
  readonly kind: "ring";
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly sign: 1 | -1;
  readonly leadRad: number;
  readonly speed: number;
  /**
   * Powyżej tego dystansu od środka intencja degeneruje się do `seek(cx, cy)`
   * — „za daleko, żeby cokolwiek okrążać". U wilka to `circleRadius ×
   * closeInFactor`.
   */
  readonly closeInBeyond: number;
  /**
   * ⚠ **Prędkość dobiegania jest OSOBNA od prędkości orbity i to nie jest
   * nadmiarowość.** Wilk dobiega `chaseSpeed` (115 px/s), a krąży
   * `circleSpeed` (78 px/s) — zlanie ich w jedno pole spowolniłoby jego
   * podejście o jedną trzecią przy nietkniętych liczbach w configu.
   */
  readonly closeInSpeed: number;
}

/**
 * ZOBOWIĄZANIE: leć tym wektorem, aż minie okno. Wypad wilka, szarża dzika,
 * odskok Szarego, zryw sarny, odrzut od obucha.
 *
 * ⚠ **Solver się NIE ODZYWA.** Impuls jest właścicielem ciała — to ta sama
 * reguła, którą `Enemy.updateAI` egzekwuje dziś przez `knockedBackUntil`
 * i którą `CombatAction` deklaruje polem `ownsBody`. Warstwa ruchu jej nie
 * zmienia, tylko nazywa.
 */
export interface ImpulseIntent {
  readonly kind: "impulse";
  readonly vx: number;
  readonly vy: number;
}

export type MoveIntent = HoldIntent | SeekIntent | FleeIntent | RingIntent | ImpulseIntent;

export const hold = (): HoldIntent => ({ kind: "hold" });

export const seek = (x: number, y: number, speed: number): SeekIntent => ({
  kind: "seek",
  x,
  y,
  speed,
});

export const flee = (fromX: number, fromY: number, speed: number): FleeIntent => ({
  kind: "flee",
  fromX,
  fromY,
  speed,
});

export const ring = (
  cx: number,
  cy: number,
  radius: number,
  sign: 1 | -1,
  leadRad: number,
  speed: number,
  closeInBeyond: number,
  closeInSpeed: number,
): RingIntent => ({
  kind: "ring",
  cx,
  cy,
  radius,
  sign,
  leadRad,
  speed,
  closeInBeyond,
  closeInSpeed,
});

export const impulse = (vx: number, vy: number): ImpulseIntent => ({ kind: "impulse", vx, vy });

/** Prędkość jako para liczb — wynik solvera, zanim trafi do ciała Arcade. */
export interface Velocity {
  x: number;
  y: number;
}

/**
 * Wektor, którego intencja chce W LINII PROSTEJ, bez oglądania się na teren.
 * Wspólny punkt wyjścia obu solverów: `DirectSolver` oddaje to bez zmian,
 * `SteerSolver` zaczyna od tego i zakrzywia.
 *
 * ⚠ To jest jedyne miejsce, w którym `ring` zamienia się w punkt — i celowo
 * jest tu, a nie w solverze, żeby oba solvery liczyły ten sam punkt.
 */
export function desiredVelocity(intent: MoveIntent, selfX: number, selfY: number): Velocity {
  switch (intent.kind) {
    case "hold":
      return { x: 0, y: 0 };
    case "impulse":
      return { x: intent.vx, y: intent.vy };
    case "seek":
      return polarToward(selfX, selfY, intent.x, intent.y, intent.speed);
    case "flee":
      // Odwrotnie niż `seek`: wektor OD źródła. Zerowa odległość (stoi dokładnie
      // na graczu) nie może dać NaN — wtedy dowolny kierunek jest poprawny.
      return normalizedAway(intent.fromX, intent.fromY, selfX, selfY, intent.speed);
    case "ring": {
      const dx = selfX - intent.cx;
      const dy = selfY - intent.cy;
      const dist = Math.hypot(dx, dy);
      if (dist > intent.closeInBeyond) {
        return polarToward(selfX, selfY, intent.cx, intent.cy, intent.closeInSpeed);
      }
      // ⚠ Wilk losował tu azymut (`Math.random()`), gdy stoi DOKŁADNIE na
      // środku okręgu. Ta warstwa jest czysta i nie ma prawa losować — ta sama
      // reguła co dla `ActionRunner`. Zdegenerowany przypadek dostaje azymut 0,
      // bo zajście na cel co do ułamka piksela trwa jedną klatkę i już w
      // następnej `dist` jest różne od zera.
      const bearing = (dist < 0.001 ? 0 : Math.atan2(dy, dx)) + intent.sign * intent.leadRad;
      const tx = intent.cx + Math.cos(bearing) * intent.radius;
      const ty = intent.cy + Math.sin(bearing) * intent.radius;
      return polarToward(selfX, selfY, tx, ty, intent.speed);
    }
  }
}

/**
 * ⚠ **DWIE konwencje normalizacji i to NIE jest nadmiarowość — obie są dziś
 * żywe w silniku i muszą zostać odtworzone CO DO BITU.**
 *
 * `Phaser.Physics.Arcade.moveTo`/`moveToObject` liczy `atan2` i rozwija wektor
 * przez `setToPolar` (czyli `cos`/`sin`), a `Vector2.normalize().scale()` — tak
 * ucieka sieciarz i królik — dzieli składowe przez długość. Wyniki są
 * matematycznie równe i **numerycznie różne na ostatnim bicie**.
 *
 * Ten projekt zmierzył już raz, ile taka różnica kosztuje: `Math.hypot(dx,dy)`
 * i `Math.sqrt(dx*dx+dy*dy)` różnią się w **38 % losowych par**, co potrafi
 * przewrócić trafienie na granicy zasięgu (`src/core/CLAUDE.md`, „bit-w-bit
 * znaczy bit-w-bit"). Migracja zachowań na tę warstwę ma nie zmienić ROZGRYWKI
 * — więc każda intencja normalizuje tak, jak normalizowało zachowanie, które
 * ją zastąpiło.
 */
function polarToward(ax: number, ay: number, bx: number, by: number, speed: number): Velocity {
  const angle = Math.atan2(by - ay, bx - ax);
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

/** Wektor OD (ax,ay) DO (bx,by), konwencją `Vector2.normalize().scale()`. */
function normalizedAway(ax: number, ay: number, bx: number, by: number, speed: number): Velocity {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return { x: speed, y: 0 };
  const len = Math.sqrt(lenSq);
  return { x: (dx / len) * speed, y: (dy / len) * speed };
}

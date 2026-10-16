/**
 * Geometria walki — jedno miejsce, w którym liczy się „gdzie co jest".
 *
 * Faza 1A.1 przebudowy Combat v2 (`docs/systemy/combat.md`). Powstało,
 * bo projekt miał **jedną** funkcję liczącą w przestrzeni ciał (`hitVectorTo`)
 * i kilkanaście liczących między środkami sprite'ów — a te dwie przestrzenie
 * dzieli od 3,4 do 16,75 px, zależnie od gatunku (zmierzone:
 * `tools/combat_geometry.mjs`).
 *
 * ── ⚠ CO TEN PLIK ROBI DZIŚ ──────────────────────────────────────────────
 * **Rozstrzyga trafienia.** `gapBetween` jest miarą, którą `HitResolver`
 * (a przez niego `GameScene.targetInReach`) odpowiada na „czy ten cios kogo
 * dosięga", a od 2026-09-07 także tą, w której AI liczy dystanse i pozycje
 * (`core/movement/MoveSolver.ts`). Bramką jest `tools/combat_regresja.mjs`.
 *
 * ⚠⚠ **Do 2026-09-07 stało tu, że „Faza 1A NIE przełącza żadnego progu na te
 * funkcje" i że plik jest „fundamentem, nie zmianą".** Było to prawdą przez
 * jedną fazę: **Faza 1B-b (2026-08-23) przepięła progi na `gapBetween`**,
 * a akapit został. Zdanie „nic tu nie uczestniczy w rozstrzyganiu walki"
 * opisywało więc przez dwa tygodnie plik, który rozstrzygał **każde** trafienie
 * w grze. ⛔ Poprawka jest KOMENTARZOWA — ani jedna linia kodu tego pliku się
 * przy niej nie zmieniła.
 *
 * ── Konwencja: PRZEŚWIT, nie dystans środków ─────────────────────────────
 * ⚠ `gapBetween` zwraca odległość między POWIERZCHNIAMI: 0 = dokładnie się
 * stykają, < 0 = nachodzą na siebie. To nie jest kosmetyka, tylko warunek, przy
 * którym jedna liczba znaczy to samo dla królika i dla niedźwiedzia:
 * `lungeStopGap: 18` czyta się jako „zostaw osiemnaście pikseli światła", a nie
 * jako „54, może będzie dobrze wyglądać".
 * ⚠ Przykładem stało tu do 2026-09-07 `preferredRangeMin: 4` — **pole, którego
 * w projekcie nigdy nie było**. Powyższy przykład jest żywy (`WOLF.pack`).
 *
 * ⚠ **Zasięg ATAKU mierzy się inaczej**: od `combatOrigin` napastnika (punkt,
 * `radius: 0`) do KRAWĘDZI hurtboxa celu. Tak liczy `HitResolver.withinReach`,
 * czyli `GameScene.targetInReach`, i **celowo się tej konwencji trzymamy** —
 * inaczej każdy zasięg broni w grze zmieniłby znaczenie naraz.
 * ⚠⚠ **Zapis `dist − allowance ≤ reach` stał tu do 2026-09-07 i był martwy.**
 * `allowance = max(displayWidth, displayHeight) × 0,35` zniknęło z gry w Fazie
 * 1B-b; dziś tę samą rolę pełni prześwit do zmierzonego hurtboxa, który zależy
 * od ORIENTACJI kapsuły, a nie od rozmiaru rysowanego duszka.
 */

/**
 * Logiczne ciało bojowe: gdzie stworzenie NAPRAWDĘ jest, w rzucie z góry.
 *
 * ⚠ To NIE jest `HitShape` (kształt ataku — `docs/systemy/combat.md`).
 * `CombatBody` odpowiada na „gdzie tę istotę da się trafić"; `HitShape` na „co
 * obejmuje ten konkretny cios". Dzik może mieć okrągłe ciało i kapsułowatą
 * szarżę; to dwie różne rzeczy o tej samej nazwie geometrycznej.
 *
 * ⚠ `radius` ma pochodzić ze ZMIERZONYCH widocznych pikseli (alpha bbox), nie
 * z `frameWidth` i nie z `displayWidth` — patrz §4.2 audytu, gdzie dzisiejszy
 * `allowance` daje niedźwiedziowi 35,8 px w każdą stronę, także od góry, gdzie
 * zwierzę ma 26 px.
 */
export interface CombatBody {
  /** Środek CIAŁA (nie sprite'a) w świecie. */
  readonly x: number;
  readonly y: number;
  /** Promień w poprzek. Dla kapsuły — połowa jej grubości. */
  readonly radius: number;
  /** Długość osi kapsuły (0/undefined = okrąg). */
  readonly length?: number;
  /** Orientacja osi kapsuły w radianach. Bez znaczenia dla okręgu. */
  readonly axis?: number;
}

/** Punkt 2D. Osobny alias, żeby sygnatury czytały się jako geometria, a nie
 *  jako „jakieś dwie liczby". */
export interface Punkt {
  readonly x: number;
  readonly y: number;
}

/**
 * ⚠ **Prekomputowana stała, dokładnie jak `Phaser.Math.RAD_TO_DEG`**
 * (`phaser/src/math/const.js:56`). Nie jest to pedanteria: `r * (180 / Math.PI)`
 * i `(r * 180) / Math.PI` różnią się na ostatnim bicie, a `isFrontal` porównuje
 * kąt OSTRO (`<`) z progiem, który bywa okrągły (90°). Ta sama klasa błędu,
 * którą `Protection.isFrontal` już raz odrobiło na `Math.cos(90°) = 6,1e-17`.
 */
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Kąt między dwoma wektorami, w STOPNIACH.
 *
 * ⚠ **W stopniach, nie przez porównanie cosinusów — i to jest cała treść tej
 * funkcji.** Przy progu 90° `Math.cos(90°)` wynosi 6,1e-17, a nie zero, więc
 * cios dokładnie z boku (iloczyn skalarny równo 0) wypadał po niewłaściwej
 * stronie nierówności; o blokowaniu decydował szum zmiennoprzecinkowy. Kąt w
 * stopniach ma tu wartości dokładne (0, 90, 180). Pełna historia:
 * `core/Protection.ts`, komentarz przy `isFrontal`.
 *
 * Zwraca 0…180. Wektor zerowy daje `NaN` → wołający musi to obsłużyć; nie ma
 * sensownej wartości domyślnej dla „nie ma kierunku".
 */
export function angleBetweenDeg(ax: number, ay: number, bx: number, by: number): number {
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  if (la < 0.0001 || lb < 0.0001) return NaN;
  const cos = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)));
  return Math.acos(cos) * RAD_TO_DEG;
}

/**
 * Prześwit między POWIERZCHNIAMI: 0 = stykają się, < 0 = nachodzą.
 *
 * ⚠ **Kapsuły są liczone naprawdę (odległość odcinek–odcinek), od Fazy 1B.**
 * Pierwsza wersja przybliżała je okręgiem na grubości i to było za mało:
 * wilk ma ślad stopy **50,4 × 23,4 px** (proporcja 2,15), więc okrąg o
 * promieniu 11,7 zaniżałby go wzdłuż ciała o 13 px, a okrąg o 25,2 zawyżałby
 * w poprzek o tyle samo. To jest ta sama wada, co `Math.max(displayWidth,
 * displayHeight)` w starym `allowance`, tylko w drugą stronę.
 */
export function gapBetween(a: CombatBody, b: CombatBody): number {
  const [a1, a2] = odcinek(a);
  const [b1, b2] = odcinek(b);
  return odlegloscOdcinkow(a1, a2, b1, b2) - a.radius - b.radius;
}

/**
 * Odcinek rdzenia kapsuły — dwa punkty, między którymi „rozciąga się" promień.
 * Okrąg (`length` brak albo ≤ 2×radius) degeneruje się do jednego punktu i cała
 * arytmetyka niżej sprowadza się wtedy do odległości środków.
 *
 * ⚠ `length` to CAŁA długość śladu stopy, więc rdzeń jest krótszy o dwa
 * promienie — inaczej kapsuła byłaby dłuższa, niż zwierzę jest naprawdę.
 */
function odcinek(c: CombatBody): [Punkt, Punkt] {
  const polRdzenia = c.length ? Math.max(0, c.length / 2 - c.radius) : 0;
  if (polRdzenia < 0.0001) return [{ x: c.x, y: c.y }, { x: c.x, y: c.y }];
  const ux = Math.cos(c.axis ?? 0);
  const uy = Math.sin(c.axis ?? 0);
  return [
    { x: c.x - ux * polRdzenia, y: c.y - uy * polRdzenia },
    { x: c.x + ux * polRdzenia, y: c.y + uy * polRdzenia },
  ];
}

/** Najmniejsza odległość między dwoma odcinkami. Klasyczny algorytm z
 *  klamrowaniem parametrów; odcinek zdegenerowany do punktu obsługuje się sam,
 *  co jest tu ważne, bo gracz JEST punktem (ślad stopy 22×21 = okrąg). */
function odlegloscOdcinkow(p1: Punkt, q1: Punkt, p2: Punkt, q2: Punkt): number {
  const d1x = q1.x - p1.x, d1y = q1.y - p1.y;
  const d2x = q2.x - p2.x, d2y = q2.y - p2.y;
  const rx = p1.x - p2.x, ry = p1.y - p2.y;
  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  let s = 0;
  let t = 0;
  if (a < 1e-8 && e < 1e-8) return Math.hypot(rx, ry);
  if (a < 1e-8) {
    t = Math.max(0, Math.min(1, f / e));
  } else {
    const c = d1x * rx + d1y * ry;
    if (e < 1e-8) {
      s = Math.max(0, Math.min(1, -c / a));
    } else {
      const b = d1x * d2x + d1y * d2y;
      const denom = a * e - b * b;
      s = denom > 1e-8 ? Math.max(0, Math.min(1, (b * f - c * e) / denom)) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
      else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
    }
  }
  return Math.hypot(rx + d1x * s - d2x * t, ry + d1y * s - d2y * t);
}

/* ── ⛔ USUNIĘTE 2026-09-08: DRUGI, MARTWY ZESTAW PREDYKATÓW TRAFIENIA ──────
   `CombatActor`, `centerDistance`, `directionToTarget`, `isWithinCircle`,
   `isWithinArc`, `isWithinCapsule` — sześć eksportów Fazy 1A, których po
   przepięciu progów w Fazie 1B-b **nie wołał już nikt**: ani `src/`, ani
   `tools/`, ani jeden dokument w `docs/`.

   Żywe odpowiedniki mieszkają w `core/HitResolver.ts`: `withinReach`,
   `withinArc`, `withinCircle`. Ten plik zostaje przy MIARACH
   (`angleBetweenDeg`, `gapBetween`) i typach — czyli przy tym, co naprawdę
   ma jednego właściciela.

   ⛔ **Nie przywracaj ich „na wszelki wypadek".** Powód stoi w nagłówku
   `HitResolver` i w `src/core/CLAUDE.md`: uprząż regresyjna świeciłaby wtedy
   na zielono, testując funkcje, których gra nie używa — a szukający „gdzie
   liczy się trafienie" miał do tej pory dwa równie wiarygodne adresy i
   pięćdziesiąt procent szans trafienia w martwy.
   ────────────────────────────────────────────────────────────────────────── */

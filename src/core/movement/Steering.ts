/**
 * Czysta matematyka omijania przeszkód. Bez Phasera, bez sceny — świat wchodzi
 * tu wyłącznie przez wstrzyknięty predykat `isFree`, więc całość daje się
 * uruchomić i przemierzyć w Node.
 *
 * ## Dlaczego to NIE jest „`body.blocked` → obróć o 90°"
 *
 * Tamten kształt był kandydatem mierzonym 2026-08-28 i ma dwie zmierzone wady,
 * które ten plik naprawia:
 *
 * 1. **Reaguje o klatkę za późno.** Ciało musi najpierw wjechać w korę, żeby
 *    się dowiedzieć, że ona tam jest. Tutaj decyduje SONDA w przód — pytanie
 *    „czy mogę tam być", zanim tam pojedzie.
 * 2. **Sztywne 90° szkodzi w rzadkim terenie.** Zmierzone: przy gęstości
 *    kolizji 10–20 % zobowiązanie do pełnej stycznej **pogarszało** dojście
 *    dzika (11 % → 18 % pozycji nieosiągalnych), bo wysyłało go w bok tam,
 *    gdzie sam by się prześlizgnął. Wachlarz próbuje najpierw najmniejszego
 *    odchylenia, więc w otwartym terenie nie robi nic.
 *
 * ⚠ **Zobowiązanie liczy się w PIKSELACH PRZEBYTEJ DROGI, nie w milisekundach.**
 * Optimum zależy od prędkości (wilk 115 px/s, dzik 52 px/s), więc próg czasowy
 * znaczyłby dla nich dwie różne odległości.
 */

/** Pytanie do świata: czy ciało `w×h` zmieści się wyśrodkowane w (x, y). */
export type FreeProbe = (x: number, y: number, w: number, h: number) => boolean;

export interface SteerParams {
  /**
   * Jak daleko przed siebie patrzy sonda, wyrażone w SEKUNDACH lotu przy
   * bieżącej prędkości. Szybszy stwór patrzy dalej — bo dalej zajedzie, zanim
   * zdąży zareagować.
   */
  readonly lookaheadSec: number;
  /** Minimalna długość sondy (px), żeby wolne stworzenie w ogóle coś widziało. */
  readonly minLookaheadPx: number;
  /** Kolejne odchylenia próbne (stopnie), od najmniejszego. */
  readonly fanDeg: readonly number[];
  /** Ile pikseli drogi trzyma się raz wybrana strona objazdu. */
  readonly commitPx: number;
}

/** Stan objazdu jednego stworzenia. Właścicielem jest `Locomotion`. */
export interface SteerState {
  /** Wybrana strona objazdu: +1 / −1, albo 0 gdy nie omija. */
  sign: 0 | 1 | -1;
  /** Ile pikseli drogi zostało do końca zobowiązania. */
  leftPx: number;
}

export const freshSteerState = (): SteerState => ({ sign: 0, leftPx: 0 });

export interface SteerInput {
  /** Wektor, którego chce zachowanie — wejście, nie wynik. */
  readonly desiredX: number;
  readonly desiredY: number;
  /** Środek CIAŁA (nie duszka) — sonda pyta o ciało. */
  readonly bodyX: number;
  readonly bodyY: number;
  readonly bodyW: number;
  readonly bodyH: number;
  /** Czas klatki w sekundach — zamienia prędkość na przebytą drogę. */
  readonly dt: number;
  /**
   * Największe dopuszczalne odchylenie (stopnie). Własność INTENCJI, nie
   * stworzenia: ucieczka nie ma prawa zawrócić ku źródłu, więc dostaje 90°,
   * a dojście do punktu może nadłożyć więcej.
   */
  readonly maxDeflectDeg: number;
}

/**
 * Zwróć wektor, którym naprawdę warto jechać w tej klatce.
 *
 * Kolejność prób: **prosto**, potem coraz większe odchylenia — najpierw w
 * stronę, do której stworzenie jest już zobowiązane. Pierwsza wolna wygrywa.
 * Gdy nic nie jest wolne, wraca wektor pierwotny: silnik i tak rozdzieli
 * kolizję, a udawanie, że mamy lepszy pomysł, byłoby kłamstwem.
 */
export function steer(
  input: SteerInput,
  params: SteerParams,
  state: SteerState,
  isFree: FreeProbe,
): { x: number; y: number } {
  const { desiredX, desiredY } = input;
  const speed = Math.hypot(desiredX, desiredY);
  if (speed < 1) {
    state.sign = 0;
    state.leftPx = 0;
    return { x: desiredX, y: desiredY };
  }

  const baseAngle = Math.atan2(desiredY, desiredX);
  const look = Math.max(params.minLookaheadPx, speed * params.lookaheadSec);
  const probe = (deg: number): boolean => {
    const a = baseAngle + (deg * Math.PI) / 180;
    return isFree(
      input.bodyX + Math.cos(a) * look,
      input.bodyY + Math.sin(a) * look,
      input.bodyW,
      input.bodyH,
    );
  };

  // Droga jest wolna — jedziemy prosto.
  //
  // ⚠⚠ **NIE kasujemy tu zobowiązania i to jest cała naprawa oscylacji
  // (2026-09-05, po playteście).** Stało tu `state.sign = 0; state.leftPx = 0`
  // i to zabijało pamięć objazdu DOKŁADNIE w chwili, w której jest potrzebna:
  //
  //   1. sonda wprost blokowana → odchylenie w bok, zobowiązanie na `commitPx`;
  //   2. stworzenie odjeżdża w bok, sonda wprost **na moment** się zwalnia
  //      (minęła róg pnia) → **reset** → cel znów wprost, prosto na przeszkodę;
  //   3. sonda znów blokowana, ale zobowiązania już nie ma, więc wachlarz
  //      startuje od zera — a z nowej pozycji wolna bywa DRUGA strona;
  //   4. skręt w przeciwną → wraca w miejsce z kroku 1 → i tak w kółko.
  //
  // Zmierzone na czystym `steer()` (ciało 46 px, 52 px/s, dt 1/60): przeszkoda
  // wprost dawała **11 zmian strony i cel nieosiągnięty**, układ „drzewo +
  // sadzawka" ze zrzutu — **19 zmian i utknięcie 227 px od celu**.
  //
  // ⚠ Zobowiązanie ma teraz **jednego właściciela końca**: `consumeCommitment`,
  // czyli przebytą drogę. Tak było napisane w nagłówku pliku („zobowiązanie
  // liczone w pikselach drogi") — ten reset był jedynym miejscem, które tę
  // regułę łamało.
  // ⛔ W otwartym terenie nic się nie zmienia: tam `leftPx` jest zerem, bo
  //    żaden objazd się nie zaczął.
  if (probe(0)) return { x: desiredX, y: desiredY };

  const zobowiazany = state.leftPx > 0 && state.sign !== 0 ? state.sign : 0;

  const wybierz = (s: 1 | -1): { x: number; y: number } | null => {
    for (const deg of params.fanDeg) {
      if (deg > input.maxDeflectDeg) break;
      if (!probe(deg * s)) continue;
      const a = baseAngle + (deg * s * Math.PI) / 180;
      state.sign = s;
      state.leftPx = params.commitPx;
      return { x: Math.cos(a) * speed, y: Math.sin(a) * speed };
    }
    return null;
  };

  // ⚠⚠ **DWIE RÓŻNE KOLEJNOŚCI, i to jest naprawa oscylacji (2026-09-05).**
  //
  // Poprzednia wersja przechodziła wachlarz **kątami**, a przy każdym kącie
  // próbowała najpierw strony zobowiązanej. Wyglądało to na pamięć objazdu, ale
  // nią nie było: gdy przy danym kącie strona zobowiązana była zajęta, a druga
  // wolna — stworzenie **natychmiast przeskakiwało na drugą stronę i tam
  // przepinało zobowiązanie**. W ciasnym miejscu (drzewo z jednej strony,
  // sadzawka z drugiej) geometria odwraca się co kilka klatek, więc dzik
  // przerzucał się lewo ↔ prawo i kręcił się w miejscu.
  //
  // Zmierzone na czystym `steer()` (ciało 46 px, 52 px/s, dt 1/60):
  //   przeszkoda wprost        → **11 zmian strony**, cel nieosiągnięty
  //   drzewo + sadzawka        → **19 zmian strony**, utknięcie 227 px od celu
  //
  // Teraz: **zobowiązany przechodzi CAŁY wachlarz po swojej stronie** i dopiero
  // gdy tam nie ma nic wolnego, wolno mu rozważyć drugą (wymaganie „jeżeli
  // wybrana droga również jest zablokowana, dopiero wtedy podejmuje ponowną
  // decyzję"). Zobowiązanie kończy się przebytą drogą (`consumeCommitment`),
  // nie chwilowym prześwitem.
  //
  // ⚠ **Wybór PIERWSZY zostaje kątami** i to jest celowe: świeże stworzenie ma
  // próbować najmniejszego odchylenia, niezależnie od strony. Kolejność
  // stronami dla niezobowiązanego wysyłałaby je w 140° skręt w lewo, zanim
  // rozważyłoby 18° w prawo — czyli psułaby to, po co wachlarz w ogóle istnieje
  // („w otwartym terenie nie robi nic", nagłówek pliku).
  if (zobowiazany !== 0) {
    const trzymane = wybierz(zobowiazany);
    if (trzymane) return trzymane;
    const druga = wybierz((zobowiazany === 1 ? -1 : 1) as 1 | -1);
    if (druga) return druga;
  } else {
    for (const deg of params.fanDeg) {
      if (deg > input.maxDeflectDeg) break;
      for (const s of [1, -1] as (1 | -1)[]) {
        if (!probe(deg * s)) continue;
        const a = baseAngle + (deg * s * Math.PI) / 180;
        state.sign = s;
        state.leftPx = params.commitPx;
        return { x: Math.cos(a) * speed, y: Math.sin(a) * speed };
      }
    }
  }

  // Nic nie jest wolne — jedziemy jak dotąd i zostawiamy to silnikowi.
  return { x: desiredX, y: desiredY };
}

/** Zetnij zobowiązanie o drogę faktycznie przebytą w tej klatce. */
export function consumeCommitment(state: SteerState, speed: number, dt: number): void {
  if (state.leftPx <= 0) return;
  state.leftPx -= speed * dt;
  if (state.leftPx <= 0) {
    state.leftPx = 0;
    state.sign = 0;
  }
}

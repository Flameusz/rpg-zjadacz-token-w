/**
 * Attack Resolver — losowość Dodge/Parry (Combat v1, 2026-08-24).
 *
 * ── Dlaczego PRD, nie zwykły rzut ─────────────────────────────────────────
 * Zwykły niezależny rzut przy RZADKIM baseline (2-8%, wymóg projektowy) daje
 * w krótkiej walce (2-5 ciosów) prawie zawsze zero uników — statystyczna
 * konsekwencja niskiego p, nie coś, co da się naprawić inaczej niż podniesieniem
 * p (co było odrzucone: Dodge/Parry mają zostać rzadką, dodatkową warstwą).
 *
 * PRD ("Pseudo Random Distribution", technika znana z Dota 2/Warcraft 3 —
 * "bad luck protection") daje TEN SAM długoterminowy procent, ale eliminuje
 * najgorsze serie pecha: szansa na sukces rośnie z każdą nieudaną próbą od
 * ostatniego sukcesu, więc bardzo długi ciąg trafień staje się coraz mniej
 * prawdopodobny, zamiast pozostawać stałym p za każdym razem.
 *
 * ⚠ **Pierwsza wersja (eskalacja liniowa `p*(1+streak)`) była ZŁA — podbijała
 * realną długoterminową średnią kilkukrotnie ponad nominalne `p`** (zmierzone:
 * nominalne 3% dawało realnie ~15-18% w długiej walce). Ta wersja jest
 * skalibrowana INACZEJ: `C` dobiera się tak, żeby matematyczne oczekiwanie
 * liczby prób między sukcesami wyniosło dokładnie `1/p` — `p` w configu
 * NAPRAWDĘ jest długoterminową średnią, nie punktem startowym krzywej.
 *
 * ⚠ **Przy rzadkim baseline poprawa P(0 uników) w oknie 2-5 ciosów jest SŁABA
 * — to jest matematyczna konsekwencja niskiego p, nie wada tej krzywej.**
 * Okno gwarancji (~1/C) rośnie mniej więcej jak 1/p², więc przy p=4% nie
 * mieści się w jednej krótkiej walce. Przewaga nad zwykłym rzutem ujawnia się
 * w skali SESJI (10-20+ starć) — dokładnie jak stamina jest projektowana na
 * skalę wyprawy, nie pojedynczej walki (`docs/systemy/stamina.md`). To jest
 * spójne z decyzją "Dodge/Parry = rzadka DODATKOWA warstwa", nie usterka.
 *
 * Pełny przymiar (kalibracja, weryfikacja średniej, tail risk, brak rytmu):
 * `docs/dziennik.md`, wpis Combat v1.
 */

/** P(sukces na n-tej próbie od ostatniego sukcesu) = min(1, n * C). */
function expectedGap(C: number): number {
  let survival = 1;
  let sumProb = 0;
  let sumNP = 0;
  let n = 1;
  while (sumProb < 1 - 1e-12 && n < 200000) {
    const q = Math.min(1, n * C);
    const pn = q * survival;
    sumNP += n * pn;
    sumProb += pn;
    survival *= 1 - q;
    if (q >= 1) break;
    n++;
  }
  return sumNP;
}

/** Cache po zaokrąglonym p (0,1pp) — atrybuty/gear zmieniają się rzadko,
 *  nie ma powodu przeliczać binary-search co klatkę. */
const cCache = new Map<number, number>();

/**
 * Skalibruj `C` tak, żeby oczekiwana liczba prób między sukcesami = `1/p`,
 * czyli żeby długoterminowa częstość sukcesu = `p`. Binary search po
 * `expectedGap`, która jest monotoniczna względem `C` (większe C = krótszy
 * odstęp) — 60 iteracji daje precyzję dużo poniżej progu, który cokolwiek
 * w grze mogłoby odróżnić.
 */
export function calibratePrdC(p: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const key = Math.round(p * 1000);
  const cached = cCache.get(key);
  if (cached !== undefined) return cached;

  const targetGap = 1 / p;
  let lo = 1e-7;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (expectedGap(mid) > targetGap) lo = mid;
    else hi = mid;
  }
  const C = (lo + hi) / 2;
  cCache.set(key, C);
  return C;
}

/**
 * Licznik PRD dla jednego mechanizmu (Dodge albo Parry). Osobna instancja na
 * mechanizm — Dodge i Parry mają WŁASNE liczniki, świadomie NIEZALEŻNE
 * (autor odrzucił wspólny "Defense Momentum" jako sztuczny, 2026-08-24).
 */
class PrdCounter {
  private streak = 0;

  /** Wykonaj próbę przy danym `p` (może się zmieniać klatka do klatki wraz
   *  z gearem/atrybutami — tylko `streak` jest stanem tego licznika). */
  roll(p: number): boolean {
    if (p <= 0) return false;
    const C = calibratePrdC(Math.min(p, 1));
    const q = Math.min(1, (this.streak + 1) * C);
    const ok = Math.random() < q;
    this.streak = ok ? 0 : this.streak + 1;
    return ok;
  }

  reset(): void {
    this.streak = 0;
  }
}

/**
 * Moduł-singleton, jak `Stamina`/`Progression` — przeżywa `Player` przez
 * śmierć i przejścia między mapami. `reset()` na nową grę i na odrodzenie
 * (śmierć nie ma być "resetem pecha" w jedną ani drugą stronę, ale zaczynanie
 * życia od zera na zerowym streaku jest tym samym wyborem, co pełna stamina
 * po odrodzeniu — patrz `Player.revive`).
 */
class DefenseState {
  private readonly dodge = new PrdCounter();
  private readonly parry = new PrdCounter();

  rollDodge(p: number): boolean {
    return this.dodge.roll(p);
  }

  rollParry(p: number): boolean {
    return this.parry.roll(p);
  }

  reset(): void {
    this.dodge.reset();
    this.parry.reset();
  }
}

export const Defense = new DefenseState();

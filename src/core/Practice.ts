/**
 * **PRAKTYKA — arytmetyka wzrostu `Proficiency`.**
 *
 * Projekt i pomiary: `docs/systemy/proficiency.md` (krzywa kosztu),
 * §20 (praktyka w walce), §22 (softzone M2), §14b (manekin). Liczby stoją
 * w `PRACTICE` i `PROFICIENCY` w `GameConfig`; tutaj jest wyłącznie arytmetyka
 * nad nimi.
 *
 * ── Gdzie to leży ─────────────────────────────────────────────────────────
 * ```
 * core/Proficiency.ts      jak dobrze wychodzi cios      m(P), fumble, graze   ← NIETKNIĘTE
 * TEN PLIK                 ile nauki niesie cios          praktyka → +1 P
 * core/WeaponProficiency   ile gracz ma P i puli          STAN, zapis
 * GameScene                kiedy cios w ogóle padł        wołanie
 * ```
 *
 * ⚠ **Plik jest CZYSTY — żadnego Phasera, encji, sceny ani `GameEvents`** —
 * dokładnie z tego powodu, co `Proficiency`/`HitResolver`/`DamageResolver`:
 * tylko dlatego `tools/bieglosc_weryfikacja.mjs` może go uruchomić w Node,
 * i tylko dlatego cokolwiek dowodzi. **Stan mieszka piętro wyżej**, bo stan
 * potrzebuje zdarzeń, a zdarzenia ciągną Phasera.
 *
 * ⚠ **Oba kanały są tu w całości** (2026-09-02): manekin (§14b) i **WALKA**
 * (`teacher(ρ) × c·√n`, §20–§21 — pozycja D7). Trzy miejsca, których
 * checkpoint nie rozstrzygał, są domknięte i **każde bez nowej liczby**:
 * interpolacja `teacher` na `0,8 … 1,0` — liniowa, bo ciągła; licznik `n` —
 * per EGZEMPLARZ przeciwnika, bo respawn to nowa instancja; `P_end` powyżej
 * Mastery IV — `soft = 1`, bo pasma tam nie ma. Uzasadnienia stoją przy
 * odpowiednich funkcjach.
 */

import { PRACTICE, PROFICIENCY } from "../config/GameConfig";
import type { Execution } from "./CombatCues";

/**
 * **Cena kolejnego punktu**: `koszt(P) = a + b·P`, czyli rosnąca liniowo — więc
 * całkowita praktyka do osiągnięcia `P` jest **KWADRATOWA** (`0 → 200` kosztuje
 * ~4× tyle co `0 → 100`).
 *
 * ⚠ Liczby na skali NIE są kosmetyczne — to jest ta własność, dzięki której
 * `P = 350` znaczy cokolwiek wobec `P = 100`.
 */
export function pointCost(proficiency: number): number {
  return PRACTICE.costA + PRACTICE.costB * proficiency;
}

/**
 * Pasmo Mastery, w którym leży `P` — `[od, do)`.
 *
 * ⚠ **Softzone liczy się PER PASMO i resetuje do 1,0 przy wejściu w nowe**
 * (model M2, §22). Model M1 — liczony od globalnego capu — został odrzucony,
 * bo liczył „malejące przyrosty" drugi raz, po `koszt(P) = a + bP`.
 *
 * ⚠ **Pasmo powyżej ostatniego progu zwraca `null`** i to NIE jest wygodne
 * zaokrąglenie: `P_end` dla `P ≥ 350` nie jest w checkpointcie rozstrzygnięty
 * (§28 „gdzie dokładnie nasyca się `f(P)`"), a zmyślenie go tutaj wpisałoby
 * do systemu liczbę, której nikt nie wybrał. Wołający musi na `null`
 * odpowiedzieć świadomie.
 */
export function masteryBand(proficiency: number): { from: number; to: number } | null {
  const progi: readonly number[] = PROFICIENCY.masteryThresholds;
  let from = 0;
  for (const prog of progi) {
    if (proficiency < prog) return { from, to: prog };
    from = prog;
  }
  return null;
}

/**
 * **Softzone (M2)** — `(1 − (P − od)/(do − od))^s`. Hamowanie PRZED bramą,
 * liczone wewnątrz pasma.
 *
 * Powyżej ostatniego progu zwraca `1` (brak hamowania), bo pasma tam nie ma —
 * patrz `masteryBand`. To jest jedyna odpowiedź, która niczego nie zmyśla:
 * nie spowalnia i nie przyspiesza.
 */
export function softzone(proficiency: number): number {
  const band = masteryBand(proficiency);
  if (!band) return 1;
  const t = (proficiency - band.from) / (band.to - band.from);
  return Math.pow(Math.max(0, 1 - t), PRACTICE.softzoneS);
}

/**
 * **Efektywność manekina** — `lerp(0,70 → 0,30)` po `lp / limit`, liniowo.
 *
 * `lp` (local progress) = `P − P_start` rodziny. Poza zakresem `[0, limit)`
 * zwraca **dokładnie 0** — manekin nie uczy „coraz mniej", tylko **kończy**.
 */
export function dummyEfficiency(localProgress: number): number {
  const { efficiencyFrom, efficiencyTo, limit } = PRACTICE.dummy;
  if (localProgress < 0 || localProgress >= limit) return 0;
  return efficiencyFrom + (efficiencyTo - efficiencyFrom) * (localProgress / limit);
}

/**
 * **Ile praktyki niesie JEDEN cios w manekina**, przed wagą wykonania.
 *
 * `base × soft(P) × dummyEfficiency(P − P_start)`.
 */
export function dummyPractice(proficiency: number, familyStart: number): number {
  const eff = dummyEfficiency(proficiency - familyStart);
  if (eff === 0) return 0;
  // ⚠ `rateMultiplier` wchodzi jako OSTATNI czynnik i dotyczy WYŁĄCZNIE tego
  // kanału (decyzja z playtestu: manekin +10%). Nie rusza `base`, więc tempo
  // całości i przyszła praktyka z walki zostają nietknięte; nie rusza też
  // `dummyEfficiency` ani `softzone`, więc wszystkie ograniczenia manekina —
  // limit 10 punktów od `P_start` i twardy stop — działają bez zmian.
  return PRACTICE.base * softzone(proficiency) * eff * PRACTICE.dummy.rateMultiplier;
}

/**
 * **Funkcja nauczyciela** (§21) — ile wart jest przeciwnik jako sparingpartner,
 * wyłącznie z relacji `ρ = P_przeciwnika / P_gracza`.
 *
 * ```
 * ρ ≤ 0,8  → 0        ρ = 1 → 1        ρ ≥ 2 → 4
 * ```
 *
 * ⚠ **To jest DRUGIE pytanie systemu i ma DRUGI mianownik** (§21). „Jak dobrze
 * tym macham" liczy się absolutnie (`f(P)`, warstwa 2, bez mianownika); „ile mnie
 * to może nauczyć" jest kontestem. Zlanie ich w jedno było w tym projekcie
 * rozważone i odrzucone — przy jednym mianowniku nowicjusz nie czuje nic, a niski
 * roster cichnie wobec mistrza.
 *
 * ⚠ **`P_gracza = 0` → `ρ = ∞` → sufit.** Świadomie: postać, która nie umie
 * nic, uczy się od wszystkiego, łącznie z królikiem. Dokładnie to opisuje §16
 * („królik uczy do `P = 25`") i dlatego pierwsze punkty da się zdobyć w walce,
 * a nie wyłącznie na kukle.
 */
export function teacher(ratio: number): number {
  const { deadBelow, nominalAt, peakAt, max } = PRACTICE.combat.teacher;
  if (!(ratio > deadBelow)) return 0;
  if (ratio >= peakAt) return max;
  if (ratio >= nominalAt) {
    // Rampa `1 → max` na odcinku `nominalAt … peakAt` — kształt, na którym
    // policzono całą tabelę §14b (sieciarz 2,08 · dzik 3,76 · wilk 4,00).
    return 1 + (max - 1) * ((ratio - nominalAt) / (peakAt - nominalAt));
  }
  // Odcinek `deadBelow … nominalAt`: liniowo `0 → 1`. Patrz `PRACTICE.combat.teacher`
  // — to jest domknięcie pierwszego otwartego miejsca D7, wybrane jako jedyne,
  // które nie tworzy urwiska w `ρ = 0,8`.
  return (ratio - deadBelow) / (nominalAt - deadBelow);
}

/**
 * **Ile praktyki niesie `k`-te trafienie w TEGO SAMEGO przeciwnika** (§20).
 *
 * ```
 * base × teacher(ρ) × soft(P) × c × (√k − √(k−1))
 * ```
 *
 * ⚠ **Przyrost MALEJĄCY, liczony przyrostowo — nie „całość dzielona przez n".**
 * Suma po `k = 1…n` daje dokładnie `c·√n`, więc długa walka uczy więcej, ale
 * nie liniowo. To zastąpiło twardy limit „max X praktyki na egzemplarz", który
 * **odwracał wartość długich walk**: przy limicie smok dawał 20,6 jedn./min
 * wobec 97,3 u wilka, czyli boss był najgorszym nauczycielem w grze.
 *
 * ⚠ **`k` liczy się per EGZEMPLARZ przeciwnika i nie ma wygaszania czasowego.**
 * To jest domknięcie drugiego otwartego miejsca D7 — a odpowiedź wypadła
 * z kodu, nie z nowej decyzji: **respawn to zawsze NOWA instancja `Enemy`**
 * (`GameScene`), więc licznik zeruje się dokładnie tam, gdzie kończy się „ten
 * przeciwnik". Dorabianie timeoutu byłoby drugim mechanizmem na to samo.
 *
 * ⚠ **Trzecie otwarte miejsce D7 (`P_end` powyżej Mastery IV) rozstrzyga
 * `softzone`**, i to bez nowej liczby: powyżej ostatniego progu pasma nie ma,
 * więc hamowania też nie ma (`soft = 1`).
 */
export function combatPractice(
  proficiency: number,
  enemyProficiency: number,
  hitIndex: number,
): number {
  if (hitIndex < 1) return 0;
  // `P = 0` → ρ nieskończone → sufit nauczyciela. Osobna gałąź, bo `0/0` dałoby
  // `NaN`, a `NaN` w praktyce zamilkłby po cichu.
  const ratio = proficiency <= 0 ? Number.POSITIVE_INFINITY : enemyProficiency / proficiency;
  const nauczyciel = teacher(ratio);
  if (nauczyciel <= 0) return 0;
  const przyrost = Math.sqrt(hitIndex) - Math.sqrt(hitIndex - 1);
  return PRACTICE.base * nauczyciel * softzone(proficiency) * PRACTICE.combat.c * przyrost;
}

/**
 * **Waga wyniku warstwy 2 dla NAUKI** (decyzja autora, 2026-09-02).
 *
 * ```
 * clean  → 1,00     graze → 0,30 (= PROFICIENCY.slipMultiplier)
 * fumble → 0        whiff → 0
 * ```
 *
 * ⚠ **Ześlizg nie ma własnego parametru** — bierze `slipMultiplier`, czyli tę
 * samą liczbę, która mówi „tyle z ciosu weszło". Nauka śledzi kontakt, a system
 * nie dostaje kolejnego pokrętła.
 *
 * ⚠ **Zero dla `fumble` i `whiff` jest DOKŁADNE.** Rozróżnienie między nimi
 * niesie prezentacja (§7), nie nauka — dla praktyki oba znaczą „nic nie
 * dosięgło".
 */
export function executionWeight(execution: Execution): number {
  return PRACTICE.executionWeight[execution];
}

/** Stan nauki jednej rodziny: ile punktów i ile praktyki czeka w puli. */
export interface PracticeState {
  readonly proficiency: number;
  /** Reszta poniżej ceny kolejnego punktu. **Bufor, nie ułamek `P`.** */
  readonly pool: number;
}

/**
 * **Dolej praktykę i wymień pulę na punkty.**
 *
 * ⚠ **Pętla, nie pojedyncze `if`** — jeden cios teoretycznie może przekroczyć
 * cenę więcej niż jednego punktu (przy przyszłych źródłach praktyki hojniejszych
 * od manekina), a wtedy „przyznaj jeden i wyrzuć resztę" po cichu gubiłoby
 * naukę. Sufit iteracji nie jest potrzebny: koszt rośnie z każdym punktem, więc
 * pętla jest zbieżna z definicji.
 *
 * ⚠ **Funkcja jest CZYSTA** — zwraca nowy stan, niczego nie mutuje i nie emituje.
 * Kto to zapisze i kto ogłosi zmianę, decyduje `WeaponProficiency`.
 */
export function addPractice(state: PracticeState, gain: number): PracticeState {
  if (!(gain > 0)) return state;
  let { proficiency, pool } = state;
  pool += gain;
  while (pool >= pointCost(proficiency)) {
    pool -= pointCost(proficiency);
    proficiency += 1;
  }
  return { proficiency, pool };
}

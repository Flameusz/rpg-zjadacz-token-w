/**
 * Rzut obrażeń pojedynczego ciosu — **czysta arytmetyka, zero Phasera**.
 *
 * ── To jest WYCIĄGNIĘCIE, nie nowa mechanika (2026-09-05) ─────────────────
 * Cała ta arytmetyka mieszkała w `Player.rollDamage` i **nie zmienia się tu ani
 * o bit**: ta sama kolejność wywołań `Math.random()` (najpierw krytyk, potem
 * jeden rzut zakresu), te same wyrażenia, ta sama liczba mnożeń. Pilnuje tego
 * `tools/combat_regresja.mjs`.
 *
 * ── Dlaczego osobny plik ──────────────────────────────────────────────────
 * `Player` jest sprite'em Phasera i da się go uruchomić wyłącznie wewnątrz
 * sceny. To sprawiało, że **jedyna funkcja licząca obrażenia ciosu była
 * nieosiągalna dla narzędzi** — a `tools/combat_benchmark.mjs` ma mierzyć to,
 * co gra naprawdę robi, nie kopię wzoru. Ten sam powód i ten sam wzorzec, co
 * przy `core/DamageResolver.ts`, wyciągniętym z `Player.takeDamage` w Fazie
 * 1A.5: resolver zwraca DANE i nie woła niczego z silnika.
 *
 * ⚠ **`damageMultiplier` wchodzi PARAMETREM.** Bierze się z `Player.effects`
 * (Okrzyk bojowy), ale ta funkcja nie ma prawa znać efektów — dokładnie tak,
 * jak `DamageContext` dostaje gotowe ułamki zamiast czytać `Equipment`.
 */

/** Zamrożone liczby rzutu — pochodzą ze `StrikeProfile`, czyli z RĘKI, która
 *  uderza. Patrz `GameScene.StrikeProfile`. */
export interface DamageRollInput {
  readonly damageMin: number;
  readonly damageMax: number;
  readonly critMultiplier: number;
  /** `φ` — podniesienie podłogi losowania przy krytyku. */
  readonly critLowCut: number;
  /** ⚠ Szansa TEJ ręki, nie żywy `Progression.critChance`. */
  readonly critChance: number;
}

export interface DamageRollResult {
  /** Obrażenia po krytyku i mnożniku buffa, zaokrąglone. */
  readonly amount: number;
  readonly crit: boolean;
  /** Ten SAM rzut odwzorowany na PEŁEN zakres — bez podniesienia podłogi przez
   *  `φ` i **bez** mnożnika krytyka. Snapshot dla Krwawienia. */
  readonly preCrit: number;
}

export function rollWeaponDamage(liczby: DamageRollInput, damageMultiplier: number): DamageRollResult {
  const crit = Math.random() < liczby.critChance;
  // FloatBetween, not Between: the melee range now carries quality's exact
  // fraction (see Quality.instanceDamage) instead of a pre-rounded integer,
  // so a Podła/Dobra difference too small to move the rounded display still
  // shifts the actual roll. Only the final applied amount is rounded.
  const min = liczby.damageMin;
  const max = liczby.damageMax;
  // ⚠ **`φ` — cecha rodziny topora i sztyletu na M-II/M-IV (D2):** krytyk
  // losuje z GÓRNEJ części zakresu, czyli podnosi PODŁOGĘ rolla. Zwykłe
  // trafienie losuje z pełnego zakresu — wariant „podłoga na każdym rollu"
  // był 4× mocniejszy i dublował ładunek M-III, więc został odrzucony.
  // ⛔ Ani szansa, ani mnożnik krytyka NIE są tu dotykane (§13).
  const lowCut = crit ? liczby.critLowCut : 0;
  const dolna = min + (max - min) * lowCut;
  // ⚠⚠ **JEDEN rzut, DWA odwzorowania — i to jest cała treść tych trzech
  // linijek** (poprawka 2026-09-04, finalny audyt sesji Rozcięcia).
  //
  // `Phaser.Math.FloatBetween(a, b)` to dosłownie `Math.random() * (b - a) + a`
  // (sprawdzone w źródle Phasera, nie założone). Rozpisanie go tutaj daje
  // `base` **bit w bit** to samo, co przedtem, i **nie zużywa drugiego
  // `Math.random()`** — czyli nie rusza globalnego strumienia losowego,
  // od którego zależy każdy inny rzut w tej klatce.
  //
  // Po co: `basePrzedKrytykiem` to TEN SAM rzut odwzorowany na PEŁEN zakres,
  // czyli bez podniesienia podłogi przez `φ`. Bez tego krytyk podnosiłby
  // Krwawienie **pośrednio** — nie mnożnikiem, tylko przesunięciem rozkładu
  // (zmierzone: +12,5% na M-II/M-III, +25% na M-IV dla topora i sztyletu) —
  // czyli łamałby regułę „krytyk rusza wyłącznie cios bezpośredni" w sposób,
  // którego gracz nie ma jak wytłumaczyć.
  //
  // ⚠ **Przy `lowCut === 0` obie liczby są IDENTYCZNE**: `min + (max−min)×0`
  // to dokładnie `min`, więc dla dziewięciu z jedenastu broni i dla każdego
  // poniżej Mastery II ta poprawka nie zmienia ani jednego bitu.
  const u = Math.random();
  const base = u * (max - dolna) + dolna;
  const basePrzedKrytykiem = u * (max - min) + min;
  const raw = base * (crit ? liczby.critMultiplier : 1) * damageMultiplier;
  // ⚠ **OSOBNE wyrażenie, nie czynnik wyciągnięty z `raw`** — mnożenie
  // zmiennoprzecinkowe nie jest łączne, więc przepisanie `raw` na
  // `preCrit * (crit ? … : 1)` mogłoby ruszyć ostatni bit obrażeń każdego
  // ciosu w grze. Ten projekt ma zapisane, ile kosztowała ta klasa pomyłki
  // (`Math.hypot` vs `sqrt` w `HitResolver`), więc `raw` zostaje nietknięte.
  //
  // ⚠ **Zawiera buff Okrzyku, bo zawiera go rzut** — zgodnie z decyzją
  // autora: „buffy wpływające na obrażenia Rozcięcia mogą wpływać na
  // snapshot Krwawienia, jeśli normalnie wpływają na obrażenia ataku".
  const preCrit = basePrzedKrytykiem * damageMultiplier;
  return { amount: Math.round(raw), crit, preCrit };
}

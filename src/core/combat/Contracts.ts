import type { CombatBody, Punkt } from "../CombatGeometry";
import type { Execution } from "../CombatCues";
import type { DamageOutcome } from "../DamageResolver";
import type { DamagePacket } from "./DamagePacket";
import type { EffectSource, EffectSpec } from "./StatusEffects";

/**
 * **KONTRAKTY WALKI — małe, składane zdolności, nie jeden wielki `Combatant`.**
 *
 * Wprowadzone 2026-09-03 (D1 audytu `docs/audyt_projektowy_fundamentow_2026-09-03.md`).
 * Powód jest zmierzony: **cała walka po stronie wroga przyjmowała konkretną
 * klasę `Player`**, przez co drużyna, sojusznicy, przywołania, walka wróg↔wróg,
 * addy bossa i PvP były zablokowane jedną decyzją typu.
 *
 * ── Dlaczego OSOBNE interfejsy, a nie jeden `Combatant` ───────────────────
 * ⚠ **`Player` i `Enemy` NIE zachowują się tak samo i nie wolno tego udawać.**
 * `Player.takeDamage` zwraca pełne rozstrzygnięcie (bo po jego stronie stoi
 * unik, parowanie, blok i pancerz), a `Enemy.takeDamage` przyjmuje odrzut
 * i zwraca „czy zabity". Wciśnięcie ich w jedną sygnaturę byłoby **sztuczną
 * identycznością**: albo wróg dostałby pola, których nie ma, albo gracz
 * straciłby te, których używa scena.
 *
 * Dlatego kontrakt jest podzielony po ZDOLNOŚCIACH, a encja bierze te, które
 * realnie ma:
 *
 * ```
 * CombatEntity   „mam miejsce i ciało"        Player ✅   Enemy ✅
 * Targetable     „można mnie wskazać"          Player —    Enemy ✅
 * AttackTarget   „można mnie zaatakować"       Player ✅   Enemy —   (patrz niżej)
 * EffectTarget   „mogę nosić efekt"            Player ✅   Enemy ✅   (od 2026-09-04)
 * ```
 *
 * ⚠ **Puste pola w tej tabeli są STANEM FAKTYCZNYM, nie luką do zapełnienia.**
 * Dziś nikt nie atakuje wroga cudzym atakiem wroga — więc `Enemy` **nie
 * deklaruje** `AttackTarget`.
 *
 * ⭐ **`EffectTarget` na `Enemy` to ta zapowiedź, która się SPRAWDZIŁA — i to
 * jest jedyny dowód, jaki ten podział mógł dostać.** Do 2026-09-04 stało tu,
 * że „kiedy pojawi się pierwszy taki przypadek (DoT na wrogu, add bossa,
 * oczarowanie), `Enemy` dopisze implementację, a wołający **nie zmienią ani
 * linijki**". Przypadek się pojawił — Krwawienie z `Rozcięcia` — i **ani jedno
 * istniejące wywołanie nie zostało tknięte**: `Enemy` dopisał `applyEffect`
 * i cztery metody `EffectHost`, a `StatusEffects.ts` nie dostał ani jednej
 * linijki. Reguła zostaje w mocy dla `AttackTarget`.
 *
 * ⛔ **Do kontraktów nie przenosimy logiki `Player`/`Enemy`.** Nie ma tu
 * `applyVenom` ani `applySlow` — bo to są nazwy KONKRETNYCH efektów, czyli
 * cudza mechanika w cudzym interfejsie. Jest `applyEffect(spec)`, które nie
 * wie, czym jest jad: skoczek buduje własny efekt i podaje go celowi.
 */

/**
 * **Cokolwiek, co ma miejsce w świecie i mierzalne ciało.**
 *
 * To jest wszystko, czego potrzebuje geometria walki (`HitResolver`,
 * `CombatGeometry`), wycelowanie ciosu i raport z ataku. Implementują to
 * `Player` i `Enemy` — obie encje miały te trzy własności **od dawna**, ta
 * zmiana tylko nadaje im nazwę.
 */
export interface CombatEntity {
  /** Środek CIAŁA FIZYCZNEGO (`body.center`), nie środek sprite'a — te dwa
   *  punkty dzieli u gracza 19 px (patrz `Player.combatOrigin`). */
  readonly combatOrigin: Punkt;
  /** Hurtbox — gdzie DA SIĘ trafić. Okrąg albo kapsuła. */
  readonly combatBody: CombatBody;
  readonly isDead: boolean;
}

/**
 * **Cel, który można wskazać** — celowanie, zaznaczenie, selekcja umiejętności.
 *
 * ⚠ `x`/`y` to środek SPRITE'A i jest tu obecne świadomie: kształt
 * `directionTarget` z metryką `spriteCentres` (Szarża) mierzy dystans właśnie
 * tak, a przepięcie go na `combatOrigin` przestroiłoby jej `minRange`/`maxRange`
 * przy nietkniętych liczbach (`core/CLAUDE.md`, `AimFrame`). Kontrakt nazywa
 * dług, zamiast go chować.
 */
export interface Targetable extends CombatEntity {
  readonly x: number;
  readonly y: number;
}

/** Co zostało z ciosu, który dosięgnął — pełne rozstrzygnięcie warstwy 3. */
export interface DamageReceipt {
  readonly outcome: DamageOutcome;
  readonly mitigated: number;
  readonly killed: boolean;
}

/**
 * **Cel ataku wyprowadzonego przez inną encję.**
 *
 * Implementuje to dziś wyłącznie `Player` — i to jest poprawny stan, nie luka
 * (patrz nagłówek). Dzięki temu **żadna z siedmiu klas wrogów nie musi już
 * importować `Player`**: deklarują, że atakują `AttackTarget`.
 *
 * ⚠ `execution` (wynik warstwy 2) jedzie razem z ciosem, bo o tym, **które cue
 * zagra przy trafieniu**, decyduje jakość wykonania napastnika, a nie obrońca.
 */
export interface AttackTarget extends CombatEntity {
  /** Okno nietykalności (przewrót, łaska po odrodzeniu). */
  readonly isInvulnerable: boolean;
  takeDamage(
    packet: DamagePacket,
    from: { x: number; y: number } | null,
    execution?: Execution,
  ): DamageReceipt;
}

/**
 * **Nosiciel efektów czasowych.**
 *
 * ⚠ Kontrakt jest **jednoczasownikowy i całkowicie ogólny** — `applyEffect`
 * bierze gotową specyfikację, nie „nałóż jad" ani „spowolnij". To jest różnica
 * między kontraktem a przeniesieniem logiki `Player` do interfejsu: skoczek
 * buduje SWÓJ jad i podaje go celowi, zamiast wołać cudzą metodę o cudzej
 * nazwie. Dzięki temu ten sam pocisk i ten sam kęs zadziałają na czymkolwiek,
 * co kiedyś zadeklaruje ten kontrakt.
 *
 * **Implementują go `Player` i — od 2026-09-04 — `Enemy`** (Krwawienie
 * z `Rozcięcia`). Ogólność opłaciła się natychmiast: wykonawca ciosu podaje
 * `applyEffect` gotowy `EffectSpec` i **nie wie, że nakłada akurat ranę**.
 */
export interface EffectTarget {
  applyEffect(spec: EffectSpec, source?: EffectSource): void;
}

/**
 * **Najczęstsza para: cel, który da się wskazać i uderzyć.** Skrót, nie nowy
 * kontrakt — `A & B`, żeby siedem encji nie przepisywało tego samego przecięcia.
 */
export type CombatTarget = AttackTarget & Targetable;

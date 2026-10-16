/**
 * **WARSTWA 2 — jakość wykonania ataku (Proficiency).**
 *
 * Projekt, pomiary i uzasadnienia: `docs/systemy/proficiency.md`. Liczby stoją
 * w `PROFICIENCY` w `GameConfig`; tutaj jest wyłącznie arytmetyka nad nimi.
 *
 * ── Gdzie to leży ─────────────────────────────────────────────────────────
 * ```
 * warstwa 1  HitResolver      czy atak fizycznie mógł dosięgnąć?   → whiff
 * warstwa 2  TEN PLIK         jak dobrze go wykonano?              → fumble/graze/clean
 * warstwa 3  DamageResolver   czy obrońca się obronił?             → dodge/parry/block/hit
 * ```
 *
 * ⚠ **Plik jest CZYSTY — żadnego Phasera, FX, encji ani sceny** — i to jest
 * egzekwowane przez strażnika w `tools/combat_regresja.mjs`, tak samo jak dla
 * `CombatGeometry`/`HitResolver`/`DamageResolver`. Tylko dlatego da się go
 * uruchomić w Node, i tylko dlatego uprząż regresyjna cokolwiek dowodzi.
 *
 * ⚠ **Losowanie jest ODDZIELONE od decyzji.** `executionFor` bierze gotowy
 * `roll ∈ [0,1)` i jest w pełni deterministyczna; `rollExecution` to jednolinijkowa
 * otoczka, która ten rzut dostarcza. Uprząż testuje pierwszą i nie musi
 * podmieniać `Math.random`.
 */

import { PROFICIENCY } from "../config/GameConfig";
import type { Execution } from "./CombatCues";

/**
 * Wyniki warstwy 2, w których **doszło do kontaktu** — jedyne, dla których
 * liczenie obrażeń ma sens.
 *
 * ⚠ **To jest bramka KOMPILATORA na regułę „fumble kończy atak przed
 * `resolveIncoming`".** `whiff` i `fumble` nie są legalnym argumentem
 * `scaleDamage`, więc pomyłkowe przepuszczenie ich dalej nie skończy się cichym
 * zerem i spalonym licznikiem PRD (`core/Defense.ts`) — skończy się błędem
 * `tsc`. Reguła pilnowana komentarzem jest regułą do złamania.
 */
export type ExecutionLanded = Extract<Execution, "graze" | "clean">;

/** Co może wypaść z rzutu warstwy 2. ⚠ `whiff` **nie należy tu nigdy** —
 *  pudło geometryczne jest wyłączną własnością warstwy 1. */
export type ExecutionRolled = ExecutionLanded | "fumble";

/** `x = P / 100` — jedyna postać, w jakiej biegłość wchodzi do wzorów. */
function x(proficiency: number): number {
  return proficiency / PROFICIENCY.neutral;
}

/**
 * Szansa na **Execution Miss**: cel był osiągalny, ale cios wyszedł tak źle,
 * że nie zadał obrażeń. Liniowo od `pmMax` przy `P = 0` do **zera w punkcie
 * neutralnym** — i to zero jest tym, co czyni `P = 100` tożsamością.
 */
export function missChance(proficiency: number): number {
  return PROFICIENCY.pmMax * Math.max(0, 1 - x(proficiency));
}

/**
 * Szansa na **Ześlizg**: kontakt nastąpił, ale cios był nieczysty. Ten sam
 * kształt co `missChance`, inna amplituda.
 */
export function slipChance(proficiency: number): number {
  return PROFICIENCY.psMax * Math.max(0, 1 - x(proficiency));
}

/**
 * **Mnożnik jakości `m(P)`** — deterministyczny kanał warstwy 2.
 *
 * ⚠ **To jest SKALAR, nie zdarzenie.** Nie ma czego ogłosić, więc nie
 * potrzebuje `ActionResolution` ani cue — i dlatego wolno mu działać w KAŻDYM
 * kanale obrażeń, także tam, gdzie `fumble`/`graze` nie mają jak zaistnieć
 * (kontakt przez `overlap`, pocisk). Ten podział jest całym powodem, dla
 * którego warstwa 2 nie zostawia połowy wyjścia rostera poza systemem.
 *
 * ⚠ **Powyżej neutralnej krzywa SIĘ NASYCA** (§15): jakość zwykłego ciosu ma
 * sufit `mMax`, a górna część skali płaci krytykiem, zdolnościami i obroną.
 */
export function qualityMultiplier(proficiency: number): number {
  const v = x(proficiency);
  if (v <= 1) return PROFICIENCY.mMin + (1 - PROFICIENCY.mMin) * Math.pow(v, PROFICIENCY.alpha);
  return 1 + (PROFICIENCY.mMax - 1) * (1 - Math.exp(-PROFICIENCY.beta * (v - 1)));
}

/**
 * **Jeden wspólny rzut na pasek wykonania** — nie trzy niezależne testy.
 *
 * ⚠ **`allowFumble` jest WYMAGANY, nie opcjonalny**, i to jest ta sama decyzja
 * co przy `EnemyConfig.touchDamageType`: parametr opcjonalny sprawia, że
 * „ten atak świadomie nie może spudłować wykonaniem" i „ktoś nie pomyślał"
 * wyglądają w źródle identycznie.
 *
 * `false` należy się atakowi, który **nie ma dyskretnej chwili rozstrzygnięcia**
 * albo którego **warstwa 1 zawiera już komponent CELOWANIA**:
 *
 *  - `boarCharge` — kapsuła zamiatana co klatkę; „trafił, ale rzut mówi nie"
 *    znaczyłoby, że dzik przenika przez gracza,
 *  - `bearSwipe` — test łuku (`BEAR.swipe.arcDeg`) pyta już „czy zamach poszedł
 *    tam, gdzie jesteś", czyli o dokładnie to samo. Drugi, losowy rzut na to
 *    samo zjawisko łamie zakaz podwójnego liczenia z §3.
 */
export function executionFor(proficiency: number, roll: number, allowFumble: false): ExecutionLanded;
export function executionFor(proficiency: number, roll: number, allowFumble: boolean): ExecutionRolled;
export function executionFor(proficiency: number, roll: number, allowFumble: boolean): ExecutionRolled {
  const pm = allowFumble ? missChance(proficiency) : 0;
  if (roll < pm) return "fumble";
  if (roll < pm + slipChance(proficiency)) return "graze";
  return "clean";
}

/** `executionFor` z rzutem dostarczonym na miejscu. */
export function rollExecution(proficiency: number, allowFumble: false): ExecutionLanded;
export function rollExecution(proficiency: number, allowFumble: boolean): ExecutionRolled;
export function rollExecution(proficiency: number, allowFumble: boolean): ExecutionRolled {
  return executionFor(proficiency, Math.random(), allowFumble);
}

/**
 * Surowe obrażenia → obrażenia po warstwie 2.
 *
 * ⚠ **Ześlizg NIE bierze `m(P)`** — to osobna gałąź paska wykonania, nie
 * gorsze trafienie. Pomnożenie obu liczyłoby tę samą karę dwa razy (§12).
 *
 * ⚠ **Wynik idzie do `resolveIncoming` jako `amount`, PRZED redukcjami** — i to
 * jest warunek, pod którym istniejąca podłoga `Math.max(1, …)` obejmuje także
 * ześlizg. Zastosowany po `mitigated` dałby `round(1 × 0,30) = 0`, czyli
 * widoczny kontakt bez żadnego skutku.
 */
export function scaleDamage(raw: number, proficiency: number, execution: ExecutionLanded): number {
  if (execution === "graze") return raw * PROFICIENCY.slipMultiplier;
  return raw * qualityMultiplier(proficiency);
}

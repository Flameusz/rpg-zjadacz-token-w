/**
 * Co rozstrzygnięcie robi ze STANEM GRY — jako dane.
 *
 * Faza 5B Combat Feel. Bliźniak `core/CombatCues.ts`, po drugiej stronie
 * podziału, który narzucił audyt Combat v2 (§5.6):
 *
 * ```
 *                      ActionResolution
 *                             │
 *              ┌──────────────┴──────────────┐
 *              ▼                             ▼
 *      PresentationCues              GameplayEffects
 *      (tylko klient)                (AUTORYTATYWNE)
 *      błysk, dźwięk, kamera         impulsy ruchu
 * ```
 *
 * ⚠ **Te dwa zbiory mają być ROZŁĄCZNE i to nie jest estetyka.** Wszystko
 * stąd docelowo wykonuje serwer; wszystko z `CombatCues` serwera nie obchodzi
 * i nie musi o tym wiedzieć.
 *
 * ── ⚠ Impuls jest OPISEM RUCHU, nie „tweenem" ────────────────────────────
 * `Impulse` opisuje przebieg **całkowicie, w danych**: kierunek, dystans,
 * czasy obu połówek i NAZWĘ krzywej. Przesunięcie w dowolnej chwili liczy
 * `impulseOffsetAt` — **czysta funkcja, bez Phasera, bez sceny, bez tweena**.
 *
 * To nie jest dbałość o styl. Dziś przebieg odgrywa `core/CombatImpulse.ts`
 * przez zdarzenie klatki; jutro ten sam obiekt ma móc wykonać **serwer**,
 * który żadnego tweena nie ma i mieć nie będzie. Gdyby kształt ruchu siedział
 * w łańcuchu `ease: "Quad.easeOut"` + `yoyo: true`, autorytatywna reguła
 * mieszkałaby w silniku renderującym, a odtworzenie jej po drugiej stronie
 * byłoby przepisywaniem z pamięci — czyli lustrem. Ten projekt zmierzył już,
 * że **lustra rozjeżdżają się cicho** (patrz `combatOrigin` w
 * `src/core/CLAUDE.md`).
 *
 * ⚠ Konsekwencja wiążąca: **żadna własność ruchu nie ma prawa powstać po
 * stronie wykonania.** Nowe wygładzenie, opóźnienie czy odbicie dokłada się
 * TUTAJ, jako pole i gałąź w `impulseProgressAt`.
 *
 * ⚠ **Ten plik jest Phaser-free i to jest egzekwowane** przez strażnika
 * czystości w `tools/combat_regresja.mjs`.
 */

import { COMBAT_FEEDBACK } from "../config/GameConfig";
import type { ActionResolution } from "./CombatCues";
import type { AttackerLunge } from "./CombatAction";

/**
 * Krzywa przebiegu — **nazwa, nie funkcja**.
 *
 * ⚠ Funkcja nie przeżyłaby przejścia przez sieć ani zapisu do logu, a to są
 * dwaj kolejni odbiorcy tego samego obiektu. Nazwa przeżyje; rozwija ją
 * `impulseProgressAt` po obu stronach tak samo.
 */
export type ImpulseCurve = "linear" | "quadOut";

/**
 * Jedno szarpnięcie ciała, opisane w całości.
 *
 * ⚠ **`backMs > 0` znaczy „wraca do punktu startu"** i to jest własność, która
 * odróżnia recoil od odrzutu — patrz `COMBAT_FEEDBACK.recoil`. `backMs: 0`
 * opisywałoby impuls jednokierunkowy; dziś nikt takiego nie produkuje, bo
 * odrzut jedzie własną, starszą ścieżką (`Enemy.takeDamage` + okno
 * `knockedBackUntil`). Pole istnieje, żeby przeniesienie odrzutu tutaj nie
 * wymagało zmiany kształtu danych — **ale nie wołaj go „na zapas"**, dopóki
 * nie przeprowadza się razem ze swoim konsumentem.
 */
export interface Impulse {
  /** Kierunek jednostkowy. Zerowy wektor = brak impulsu. */
  readonly dirX: number;
  readonly dirY: number;
  /** Amplituda w pikselach świata. */
  readonly distancePx: number;
  /** Czas dojścia do amplitudy. */
  readonly outMs: number;
  /** Czas powrotu do zera. 0 = bez powrotu. */
  readonly backMs: number;
  readonly curve: ImpulseCurve;
}

/** Ile trwa cały przebieg. */
export function impulseDurationMs(imp: Impulse): number {
  return imp.outMs + imp.backMs;
}

/** Rozwinięcie nazwy krzywej. Jedyne miejsce, w którym to się dzieje. */
function krzywa(curve: ImpulseCurve, p: number): number {
  // `quadOut` odtwarza `Phaser.Math.Easing.Quadratic.Out` co do wzoru
  // (`t * (2 - t)` = `1 - (1 - t)²`), żeby przejście z tweena na tę funkcję
  // nie zmieniło ani jednej klatki odczucia.
  return curve === "quadOut" ? p * (2 - p) : p;
}

/**
 * Postęp przesunięcia w chwili `elapsedMs`: 0 → 1 → 0.
 *
 * ⚠ **Poza zakresem zwraca ZERO, nie wartość brzegową.** Impuls, o który
 * ktoś zapyta po czasie, ma być nieobecny, a nie zamrożony na amplitudzie —
 * inaczej wykonawca, który przegapi ostatnią klatkę, zostawia trwałe
 * przesunięcie.
 */
export function impulseProgressAt(imp: Impulse, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  if (elapsedMs < imp.outMs) return krzywa(imp.curve, elapsedMs / imp.outMs);
  if (imp.backMs <= 0) return elapsedMs >= imp.outMs ? 1 : 0;
  const wracaOd = elapsedMs - imp.outMs;
  if (wracaOd >= imp.backMs) return 0;
  return krzywa(imp.curve, 1 - wracaOd / imp.backMs);
}

/** Przesunięcie względem punktu startu w chwili `elapsedMs`. Czysta funkcja. */
export function impulseOffsetAt(imp: Impulse, elapsedMs: number): { x: number; y: number } {
  const p = impulseProgressAt(imp, elapsedMs) * imp.distancePx;
  return { x: imp.dirX * p, y: imp.dirY * p };
}

/**
 * Autorytatywne skutki jednego rozstrzygnięcia.
 *
 * ⚠ **Świadomie NIE zawiera dziś `damage`, `knockback`, `stagger` ani
 * `interrupt`, choć audyt je tu przewiduje.** Te cztery już działają, każde
 * w swoim miejscu i każde przetestowane bramką regresyjną. Przeniesienie ich
 * tutaj jest refaktorem łańcucha decyzyjnego Combat v1 — czyli dokładnie tym,
 * czego 5A i 5B mają NIE robić przy okazji feedbacku. Pole dokłada się razem
 * z przeniesieniem jego konsumenta, nigdy „na zapas": patrz reguła o martwych
 * slotach manekina w `src/core/CLAUDE.md`.
 */
export interface GameplayEffects {
  /** Szarpnięcie CELU, wzdłuż kierunku ciosu. */
  readonly targetImpulse?: Impulse;
  /** Kopnięcie NAPASTNIKA, przeciwnie do kierunku ciosu. */
  readonly attackerImpulse?: Impulse;
}

/**
 * **Wypad napastnika — gest ataku, liczony NIEZALEŻNIE od wyniku.**
 *
 * ⚠ **Świadomie OSOBNA funkcja, nie kolejne pole w `effectsFor`.** Tamta
 * odpowiada na pytanie „co ten cios zrobił", więc na wejściu ma
 * `ActionResolution` i **wychodzi na `outcome !== "hit"`** — jej macierz
 * wynik→impuls jest strzeżona przez §M i ma pozostać dokładnie taka, jaka
 * jest. Wypad odpowiada na inne pytanie: „czy stworzenie się zamachnęło",
 * a to jest prawdą także przy pudle, uniku i parowaniu. Wciśnięty do
 * `effectsFor` wymusiłby albo rozmontowanie tamtej macierzy, albo pole,
 * które łamie jej własną regułę.
 *
 * Czysta i bez Phasera, jak wszystko w tym pliku — wykonaniem zajmuje się
 * `applyImpulse` w `Enemy.reportAttack`.
 *
 * ⚠ **Bez kierunku nie ma wypadu** — ta sama reguła co w `effectsFor`:
 * zgadywanie osi byłoby wymyślaniem danych.
 */
export function lungeImpulse(
  lunge: AttackerLunge,
  dir: { x: number; y: number } | null,
): Impulse | undefined {
  if (lunge !== "onAttack") return undefined;
  const d = jednostkowy(dir);
  if (!d) return undefined;
  const cfg = COMBAT_FEEDBACK.lunge;
  if (cfg.px <= 0) return undefined;
  return {
    dirX: d.x,
    dirY: d.y,
    distancePx: cfg.px,
    outMs: cfg.outMs,
    backMs: cfg.backMs,
    curve: "quadOut",
  };
}

/** Znormalizuj albo zwróć `null`, gdy nie ma kierunku. */
function jednostkowy(d: { x: number; y: number } | null): { x: number; y: number } | null {
  if (!d) return null;
  const len = Math.hypot(d.x, d.y);
  if (len < 0.0001) return null;
  return { x: d.x / len, y: d.y / len };
}

/**
 * Rozstrzygnięcie → co ma się ruszyć. Jedno miejsce, w którym ta decyzja
 * zapada — bliźniacze do `cuesFor`.
 *
 * ── ⚠ MACIERZ WYNIK → IMPULS (pilnuje jej §M w `combat_regresja.mjs`) ────
 *
 * | wynik | cel | napastnik | dlaczego |
 * |---|---|---|---|
 * | `miss` | — | — | nic nie trafiło; pudło ma własny kanał (ślad świstu) |
 * | `dodge` | — | — | cios przeszedł OBOK; ciało nie reaguje na to, czego nie dotknęło |
 * | `parry` | — | — | odbicie ma czytać się jako „stanąłem twardo" |
 * | `block` | — | — | j.w.; tarcza zatrzymuje, a nie odpycha broniącego |
 * | `immune` | — | — | nietykalność jest w tej grze CICHA we wszystkich kanałach |
 * | `hit` | **tak** | **tylko gdy `attackerRecoil === "onHit"`** | jedyny wynik, w którym coś w coś uderzyło |
 *
 * ── ⚠ KOPNIĘCIE NAPASTNIKA JEST DEKLARACJĄ AKCJI, NIE WNIOSKIEM ──────────
 *
 * Do 2026-08-23 czytało się to z `attackerOwnsBody` — czyli z odpowiedzi na
 * INNE pytanie („czy akcja steruje ciałem"). Dwie własności zwinięte w jeden
 * bit trzymały się dopóty, dopóki wszystko rozstrzygało się na ciele
 * napastnika; **`spider_web` je rozerwał**: sieciarz strzela stojąc, więc
 * ciałem nie steruje, a mimo to trafienie pocisku — osobne w czasie
 * i przestrzeni — nie ma prawa nim szarpnąć. Dlatego to pole jest
 * niezależną daną (`CombatAction.attackerRecoil`), a `ownsBody` **nie jest
 * tutaj czytany w ogóle**: został przy akcji jako niezmiennik własności ciała
 * (`ownsBody === true` ⇒ `attackerRecoil === "none"`, pilnuje §M2).
 *
 * ⚠ **`block` i `parry` NIE dostają impulsu i to jest DECYZJA PROJEKTOWA, nie
 * przeoczenie.** Kuszące jest odepchnięcie broniącego („poczuł ciężar"), ale
 * niosłoby dokładnie odwrotny komunikat niż mechanika: blok w tej grze jest
 * skuteczny i ma się opłacać. Odwrócenie tego wymaga jawnej decyzji i wpisu
 * w tej tabeli, nie dopisania gałęzi.
 *
 * ⚠ **Bez kierunku nie ma impulsu.** `dir === null` znaczy „cios świadomie bez
 * kierunku" (pułapka, trucizna z podłoża) — nie ma osi, wzdłuż której cokolwiek
 * miałoby się ruszyć, a zgadnięcie jej byłoby wymyśleniem danych.
 */
export function effectsFor(r: ActionResolution): GameplayEffects {
  if (r.outcome !== "hit") return {};
  const dir = jednostkowy(r.dir);
  if (!dir) return {};

  const cfg = COMBAT_FEEDBACK.recoil;
  const t = cfg.target[r.tier];
  const a = cfg.attacker[r.tier];

  return {
    targetImpulse:
      t.px > 0
        ? { dirX: dir.x, dirY: dir.y, distancePx: t.px, outMs: t.ms, backMs: t.ms, curve: "quadOut" }
        : undefined,
    // ⚠ **Kopie tylko ten, kto to ZADEKLAROWAŁ.** Warunek pyta o decyzję
    // akcji, nie o jej ruch: `"none"` bierze się albo stąd, że ciałem steruje
    // sama akcja (szarża, wypad, odskok Szarego — dwa systemy ruchu w jednej
    // klatce to zmierzony błąd tego projektu, patrz `knockedBackUntil`), albo
    // stąd, że trafienie zachodzi z dala od napastnika (pocisk sieciarza).
    // **Tych dwóch powodów nie da się rozróżnić po `ownsBody`** i dlatego
    // `ownsBody` nie jest tu czytany.
    //
    // Deklaracja jest WŁASNOŚCIĄ AKCJI (`CombatAction.attackerRecoil`), nie
    // listą nazw tutaj — lista rozjechałaby się przy pierwszym nowym
    // stworzeniu.
    attackerImpulse:
      a.px > 0 && r.attackerRecoil === "onHit"
        ? { dirX: -dir.x, dirY: -dir.y, distancePx: a.px, outMs: a.ms, backMs: a.ms, curve: "quadOut" }
        : undefined,
  };
}

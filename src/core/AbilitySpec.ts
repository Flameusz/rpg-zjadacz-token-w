/**
 * Umiejętność jako ROZSTRZYGNIĘTE DANE — jedno miejsce, w którym z broni,
 * umiejętności (i kiedyś: poziomu, talentów) powstaje finalny kształt
 * celowania i finalne mnożniki.
 *
 * Prototypy celowania: `Szerokie cięcie` (2026-08-23), `Szarża` (2026-08-23).
 *
 * ── ⚠ PO CO TA WARSTWA ISTNIEJE ──────────────────────────────────────────
 * Wymaganie było jedno i twarde: **podgląd i rozstrzygnięcie mają czytać z tego
 * samego kształtu.** Osobny „stożek UI" ze skopiowanymi liczbami rozjechałby
 * się z resolverem przy pierwszej zmianie i **nikt by tego nie zobaczył** —
 * podgląd kłamałby cicho, a to jest gorsze niż brak podglądu, bo gracz podejmie
 * na jego podstawie decyzję. Ten projekt ma już zapisane, że lustra rozjeżdżają
 * się cicho (`combatOrigin` w `src/core/CLAUDE.md`).
 *
 * ── ⚠ DWA ARCHETYPY, JEDEN SYSTEM CELOWANIA ──────────────────────────────
 * ```
 *   directionArc     → Szerokie cięcie: aim wybiera KIERUNEK kształtu
 *   directionTarget  → Szarża:          aim wybiera PRZECIWNIKA
 * ```
 * Różnica mieszka **w danych (`shape.kind`), nie w gałęziach po `id`**.
 * Wspólna warstwa celowania (`AbilityBar`, sesja w `GameScene`) nie zna ani
 * jednej nazwy umiejętności; jedyne dwa miejsca rozgałęziające się po
 * `shape.kind` to ten plik i renderer podglądu, a jedyne miejsce rozgałęziające
 * się po `id` to `resolveAbility` — czyli funkcja, której to jest cała praca.
 *
 * ⚠ **Ten plik jest Phaser-free i to jest egzekwowane** przez strażnika
 * czystości w `tools/combat_regresja.mjs`.
 */

import { ABILITIES } from "../config/GameConfig";
import { angleBetweenDeg, gapBetween, type CombatBody, type Punkt } from "./CombatGeometry";
import { withinArc } from "./HitResolver";

/**
 * Umiejętności, które przechodzą przez celowanie kierunkowe.
 *
 * ⚠ **Unia, nie `string`** — dołożenie kolejnej ma być pytaniem od kompilatora
 * w `resolveAbility`, a nie cichym `undefined` w kształcie.
 */
/**
 * ⚠ **Filtrowane przez `Extract` z kluczy `ABILITIES`, nie pisane od zera**
 * (D7, 2026-09-03). Celowania **nie da się wyprowadzić z pola configu** —
 * `cleave` nie ma `aimPreview`, a mimo to jest celowalne — więc lista zostaje
 * ręczna. `Extract` pilnuje jednak, że każdy wpis jest **istniejącą**
 * umiejętnością: literówka albo skasowana umiejętność zwężają ten typ do
 * `never` i zapalają `resolveAbility`, zamiast wyjść jako `undefined`
 * w podglądzie celowania.
 *
 * ⛔ Świadomie NIE importujemy `AbilityId` z `core/Abilities` — tamten plik
 * ciągnie `Progression` i `Skills`, a ten musi zostać czysty (strażnik
 * czystości w `tools/combat_regresja.mjs`).
 */
export type AimableAbilityId = Extract<
  keyof typeof ABILITIES,
  "cleave" | "charge" | "heavyStrike" | "lunge" | "shieldBash" | "rend"
>;

/** Czy tę umiejętność się celuje. Czyta UI, żeby wiedzieć, czy `pointerdown`
 *  ma zacząć sesję celowania, czy odpalić natychmiast. */
export function isAimable(id: string): id is AimableAbilityId {
  return (
    id === "cleave" ||
    id === "charge" ||
    id === "heavyStrike" ||
    id === "lunge" ||
    id === "shieldBash" ||
    id === "rend"
  );
}

/**
 * ⚠ **DWA punkty odniesienia napastnika i to nie jest nadmiarowość.**
 *
 * Projekt ma dwie konwencje pomiaru i **obie są dziś żywe**:
 * - `body` — środek CIAŁA (`combatOrigin`), konwencja Fazy 1B; mierzy nią cała
 *   geometria trafień, w tym `directionArc`.
 * - `sprite` — środek DUSZKA, konwencja starsza; mierzy nią **`Szarża`**
 *   (`Math.hypot(target.x - player.x, …)`), czyli jej `minRange`/`maxRange`.
 *
 * Te punkty dzieli u gracza **19 px**, więc przepięcie Szarży na `body`
 * zmieniłoby jej realne progi zasięgu przy niezmienionych liczbach w configu —
 * a iteracja prototypu celowania miała **nie ruszać** min/max range. Wart
 * zapamiętania: to jest dług do spłacenia razem z resztą przejścia na
 * `combatOrigin`, a nie stan docelowy. Kształt wybiera swój punkt sam, więc
 * spłata będzie jedną zmianą w `originFor`/`rangeTo`.
 */
export interface AimFrame {
  readonly body: Punkt;
  readonly sprite: Punkt;
}

/** Kandydat do wskazania. Generyk, żeby ten plik nie znał `Enemy`. */
export interface AimCandidate<T> {
  readonly ref: T;
  /** Hurtbox — mierzy w nim `directionArc`. */
  readonly body: CombatBody;
  /** Środek duszka — mierzy w nim `directionTarget` (patrz `AimFrame`). */
  readonly sprite: Punkt;
}

/**
 * Łuk kierunkowy: aim wybiera KIERUNEK, trafia wszystko w klinie.
 */
export interface DirectionArcShape {
  readonly kind: "directionArc";
  /** Zasięg od `combatOrigin` napastnika do KRAWĘDZI hurtboxa celu. */
  readonly reachPx: number;
  /**
   * ⚠ **PÓŁ-łuk, odchylenie w jedną stronę.** 90 znaczy **180° w sumie**.
   * Podgląd rysuje to wiernie i tak ma być.
   *
   * ⚠ Do 2026-09-18 liczba brała się z `melee.arcDeg` broni; dziś podaje ją
   * umiejętność (`ABILITIES.cleave.halfArcDeg`).
   */
  readonly halfArcDeg: number;
  /**
   * Prześwit, poniżej którego cios pomija test kąta. **0 = brak pominięcia.**
   *
   * ⚠ **Granica jest OSTRA (`> 0`), i to jest decyzja, nie zapis.** `0`
   * znaczy „tej furtki nie ma", a nie „furtka przy prześwicie równym zero".
   */
  readonly pointBlankBypassPx: number;
}

/**
 * Wskazanie CELU: aim wybiera PRZECIWNIKA, nie punkt lądowania.
 *
 * ⚠ **To jest inicjacja na przeciwnika, nie swobodny dash** — i cała różnica
 * wobec `directionArc` sprowadza się do tego, że kierunek jest tu **pytaniem
 * o to, kogo wskazujesz**, a nie opisem obszaru. Wykonanie ruchu należy potem
 * do istniejącej mechaniki umiejętności, nie do tego kształtu.
 *
 * ⚠ **Mierzy w przestrzeni DUSZKÓW, nie ciał** — patrz `AimFrame`.
 */
export interface DirectionTargetShape {
  readonly kind: "directionTarget";
  /**
   * ⚠ **Czym mierzy się pasmo — WŁASNOŚĆ KSZTAŁTU, nie archetypu.**
   *
   * Dwie umiejętności dzielą dziś ten archetyp i **mierzą inaczej**, bo mierzą
   * co innego:
   * - `spriteCentres` — Szarża. Dystans środków duszków, konwencja legacy;
   *   nietknięta, żeby jej `minRange`/`maxRange` nie zmieniły znaczenia.
   * - `surfaceGap` — Ciężkie uderzenie. Prześwit od `combatOrigin` do krawędzi
   *   hurtboxa, czyli **dokładnie to, czym mierzy `targetInReach`** przy
   *   rozstrzyganiu trafienia. Inna miara tutaj znaczyłaby, że podgląd mówi
   *   „w zasięgu", a cios po chwili odpowiada „za daleko".
   *
   * ⚠ **Miara musi zgadzać się z tym, co sprawdzi HIT.** To jest cały powód,
   * dla którego to pole istnieje zamiast twardego wyboru po `kind`.
   */
  readonly metric: "spriteCentres" | "surfaceGap";
  /** Dolna granica pasma. Cel bliżej jest nielegalny („za blisko").
   *  **0 = brak dolnej granicy** (Ciężkie uderzenie: melee nie ma „za blisko"). */
  readonly minRangePx: number;
  readonly maxRangePx: number;
  /**
   * Pół-kąt SEKTORA AKWIZYCJI: jak blisko osi celowania musi stać przeciwnik,
   * żeby dało się go wskazać.
   *
   * ⚠ **Istnieje po to, żeby celowanie w górę nie wybierało jedynego wroga
   * stojącego z prawej.** Bez sektora „wskaż cel" degeneruje się do „weź
   * kogokolwiek", a wtedy manualny aim niczego nie daje.
   */
  readonly acquisitionHalfDeg: number;
}

export type ResolvedHitShape = DirectionArcShape | DirectionTargetShape;

/** Mnożniki obrażeń per rola. Nieobecne u umiejętności, które **nie zadają
 *  obrażeń** — patrz `ResolvedAbilitySpec.damage`. */
export interface AbilityDamage {
  readonly primaryMultiplier: number;
  readonly secondaryMultiplier: number;
}

/** Finalne dane jednego użycia umiejętności. */
export interface ResolvedAbilitySpec {
  readonly id: AimableAbilityId;
  readonly shape: ResolvedHitShape;
  /** Twardy sufit liczby wskazanych. */
  readonly maxTargets: number;
  /**
   * ⚠ **OPCJONALNE, bo nie każda celowana umiejętność zadaje obrażenia.**
   * `Szarża` ich nie ma: cios na końcu to zwykły autoatak, przez własną
   * ścieżkę. Wpisanie jej tu mnożnika 1,0 „dla symetrii" byłoby martwym
   * slotem — polem deklarującym mechanikę, której nie ma
   * (`src/core/CLAUDE.md`).
   */
  readonly damage?: AbilityDamage;
}

/** Czym gracz bije w tej chwili. Strukturalnie, żeby ten plik nie znał
 *  `Progression` ani `StrikeProfile` ze sceny. */
/**
 * Co umiejętność bierze Z BRONI.
 *
 * ⚠⚠ **`arcDeg` wypadł stąd 2026-09-18.** Kąt klina jest własnością
 * umiejętności, nie oręża — patrz `ABILITIES.cleave.halfArcDeg`. Zasięg
 * został, bo wynika z DŁUGOŚCI broni, a ta jest jej cechą fizyczną.
 * ⛔ Nie dokładaj tu pól „bo umiejętność może ich kiedyś chcieć": ten interfejs
 * opisuje granicę broń → umiejętność i ma zostać wąski.
 */
export interface AbilityStrikeInput {
  readonly reach: number;
}

/**
 * Broń + umiejętność → finalny kształt i mnożniki. **Jedyne miejsce, w którym
 * wolno rozgałęzić się po `id`** — to jest cała praca tej funkcji. Tu wejdą
 * kiedyś poziom umiejętności i talenty.
 */
export function resolveAbility(id: AimableAbilityId, strike: AbilityStrikeInput): ResolvedAbilitySpec {
  switch (id) {
    case "cleave": {
      const c = ABILITIES.cleave;
      return {
        id,
        shape: {
          kind: "directionArc",
          // ⚠⚠ **Zasięg z BRONI, kąt z UMIEJĘTNOŚCI** (2026-09-18) — i to jest
          //   cała granica między nimi. Do tej daty oba brały się z oręża,
          //   przez co `melee.arcDeg` istniał wyłącznie dla tej jednej linijki.
          reachPx: strike.reach,
          halfArcDeg: c.halfArcDeg,
          // ⚠ Kierunkowa umiejętność z podglądem NIE MOŻE mieć furtki zwarcia.
          pointBlankBypassPx: 0,
        },
        maxTargets: c.maxTargets,
        /**
         * ⚠ Mnożniki ról MNOŻĄ się przez mnożnik umiejętności, nie zastępują
         * go. Złożenie daje 0,9 dla celu głównego — dokładnie tyle, ile cleave
         * zadawał przed prototypem — i 0,675 dla reszty.
         */
        damage: {
          primaryMultiplier: c.damageMultiplier * c.primaryMultiplier,
          secondaryMultiplier: c.damageMultiplier * c.secondaryMultiplier,
        },
      };
    }
    case "heavyStrike": {
      const h = ABILITIES.heavyStrike;
      return {
        id,
        shape: {
          kind: "directionTarget",
          // ⚠ **Ta sama miara, którą sprawdzi HIT** (`targetInReach` →
          // `withinReach`). Zasięg bierze się z BRONI, nie z umiejętności —
          // ciężki cios to ten sam oręż, tylko wolniej i mocniej.
          metric: "surfaceGap",
          // Melee nie ma „za blisko" — w odróżnieniu od Szarży.
          minRangePx: 0,
          maxRangePx: strike.reach,
          acquisitionHalfDeg: h.acquisitionHalfDeg,
        },
        maxTargets: 1,
        damage: {
          primaryMultiplier: h.damageMultiplier,
          // ⚠ Przy suficie 1 rola `secondary` NIE POWSTAJE. Równa wartość
          // stoi tu po to, żeby ewentualne podniesienie sufitu nie wprowadziło
          // po cichu innej liczby — a nie dlatego, że kiedykolwiek zadziała.
          secondaryMultiplier: h.damageMultiplier,
        },
      };
    }
    case "rend": {
      const r = ABILITIES.rend;
      return {
        id,
        shape: {
          kind: "directionTarget",
          // ⚠ **Ta sama miara, którą sprawdzi HIT** (`targetInReach` →
          // `withinReach`) — jak Ciężkie uderzenie, Wypad i Uderzenie tarczą.
          metric: "surfaceGap",
          // Melee nie zna stanu „za blisko".
          minRangePx: 0,
          // ⚠ **Zasięg BRONI, nie własny.** Reguła autora zapisana przy
          // `shieldBash.maxRangePx`: *jeśli trafiasz kogoś autoatakiem,
          // trafiasz go też umiejętnością na tym celu.* Własna, krótsza liczba
          // dała tam martwe pasmo do 51% zasięgu włóczni; pilnuje tego §T1a.
          maxRangePx: strike.reach,
          acquisitionHalfDeg: r.acquisitionHalfDeg,
        },
        maxTargets: 1,
        damage: {
          primaryMultiplier: r.damageMultiplier,
          // ⚠ Przy suficie 1 rola `secondary` NIE POWSTAJE — równa wartość
          // stoi tu wyłącznie po to, żeby podniesienie sufitu nie wprowadziło
          // po cichu innej liczby (jak przy Ciężkim uderzeniu i Wypadzie).
          secondaryMultiplier: r.damageMultiplier,
        },
      };
    }
    case "lunge": {
      const l = ABILITIES.lunge;
      return {
        id,
        shape: {
          kind: "directionTarget",
          // ⚠ **Ta sama miara, którą sprawdzi HIT** — po dobiegnięciu Wypad
          // rozstrzyga się przez `pendingSwing`/`targetInReach`, czyli przez
          // prześwit od `combatOrigin`. Inna miara tutaj znaczyłaby, że
          // podgląd pozwala wskazać cel, którego pchnięcie nie dosięgnie.
          metric: "surfaceGap",
          // ⚠ **Zero i nie ma tu czego stroić.** „Za blisko" jest pojęciem
          // Szarży (potrzebuje rozbiegu); pchnięcie z kroku wykonuje się
          // z każdej odległości aż do swojego zasięgu. Dolna granica
          // odtworzyłaby dokładnie tę martwą strefę, którą Wypad ma wypełnić.
          minRangePx: 0,
          // Zasięg BRONI razy mnożnik — patrz `rangeReachMul` w configu.
          maxRangePx: strike.reach * l.rangeReachMul,
          acquisitionHalfDeg: l.acquisitionHalfDeg,
        },
        maxTargets: 1,
        damage: {
          primaryMultiplier: l.damageMultiplier,
          // ⚠ Przy suficie 1 rola `secondary` NIE POWSTAJE — równa wartość
          // stoi tu wyłącznie po to, żeby ewentualne podniesienie sufitu nie
          // wprowadziło po cichu innej liczby (jak przy Ciężkim uderzeniu).
          secondaryMultiplier: l.damageMultiplier,
        },
      };
    }
    case "shieldBash": {
      const s = ABILITIES.shieldBash;
      return {
        id,
        shape: {
          kind: "directionTarget",
          // ⚠ **Ta sama miara, którą sprawdzi HIT** (`targetInReach` →
          // `withinReach`) — jak Ciężkie uderzenie i Wypad.
          metric: "surfaceGap",
          // Melee nie zna stanu „za blisko"; tarczą przypiera się do wroga.
          minRangePx: 0,
          /**
           * ⚠ **Zasięg BRONI — zmienione 2026-08-26 po zgłoszeniu z gry, i to
           * była poprawka, nie strojenie.**
           *
           * Pierwsza wersja miała zasięg WŁASNY (48 px), krótszy niż każda broń
           * w grze. Argument brzmiał „tarcza jest narzędziem zwarcia, więc żeby
           * ogłuszyć, musisz podejść bliżej". Rozgrywka pokazała, że to nie jest
           * koszt, tylko **martwe pasmo**: zmierzone 8–50 px, czyli 14% zasięgu
           * przy sztylecie i **51% przy włóczni** — ponad połowa dystansu, na
           * którym włócznik normalnie walczy. Umiejętność nie miała ceny,
           * tylko nie działała z połową rosteru broni.
           *
           * ⚠ **Drugi, gorszy objaw tej samej liczby**: podgląd celowania
           * (`GameScene.updateAimPreview`) rozstrzyga KAŻDĄ umiejętność przez
           * `currentStrike()`, czyli zasięg broni. Przy 48 px podgląd
           * podświetlał cel jako legalny, a commit odrzucał go **cichym
           * `return`** — bez komunikatu, bez cooldownu. Na dotyku martwy
           * przycisk jest nieodróżnialny od zepsutego.
           *
           * ⚠ **Reguła, którą to koduje (decyzja autora):** *jeśli trafiasz
           * kogoś autoatakiem, trafiasz go też umiejętnością na tym celu.*
           * Zasięg płynie więc z `Progression.attackReach` — razem z mnożnikiem
           * aktywnego WARIANTU ataku, więc pchnięcie wydłużające zasięg
           * wydłuża też uderzenie tarczą. Pilnuje tego §T1.
           *
           * ⚠ To **nie** rozmiękcza reguły zawężania: przerwanie i ogłuszenie
           * dalej pochodzą z TARCZY (`GameScene.shieldStrike`), a bez tarczy
           * umiejętność nie istnieje. Zasięg nigdy nie był nośnikiem tożsamości
           * — jest nim to, że walutą jest czas przeciwnika.
           */
          maxRangePx: strike.reach,
          acquisitionHalfDeg: s.acquisitionHalfDeg,
        },
        maxTargets: 1,
        damage: {
          primaryMultiplier: s.damageMultiplier,
          // ⚠ Przy suficie 1 rola `secondary` NIE POWSTAJE — równa wartość
          // stoi tu wyłącznie po to, żeby podniesienie sufitu nie wprowadziło
          // po cichu innej liczby (jak przy Ciężkim uderzeniu i Wypadzie).
          secondaryMultiplier: s.damageMultiplier,
        },
      };
    }
    case "charge": {
      const c = ABILITIES.charge;
      return {
        id,
        shape: {
          kind: "directionTarget",
          // ⚠ LEGACY i nietykalne w tej iteracji — patrz `AimFrame`.
          metric: "spriteCentres",
          // ⚠ Liczby WPROST z dzisiejszego configu Szarży — ta iteracja miała
          // nie ruszać jej pasma zasięgu, tylko sposób wyboru celu.
          minRangePx: c.minRange,
          maxRangePx: c.maxRange,
          acquisitionHalfDeg: c.acquisitionHalfDeg,
        },
        // Szarżuje się na JEDNEGO. To nie jest pokrętło do strojenia —
        // „szarża na dwóch naraz" nie ma znaczenia fizycznego.
        maxTargets: 1,
        // Brak `damage`: Szarża nie zadaje obrażeń, cios na końcu to zwykły
        // autoatak przez własną ścieżkę (patrz `ABILITIES.charge`).
      };
    }
  }
}

/** Czy ten kształt mierzy w przestrzeni CIAŁ (prześwit), czy DUSZKÓW. */
function mierzyCialem(shape: ResolvedHitShape): boolean {
  return shape.kind === "directionArc" || shape.metric === "surfaceGap";
}

/** Punkt, OD którego mierzy dany kształt — patrz `AimFrame`. */
export function originFor(shape: ResolvedHitShape, frame: AimFrame): Punkt {
  return mierzyCialem(shape) ? frame.body : frame.sprite;
}

/** Punkt celu w konwencji danego kształtu. */
function pointOf<T>(shape: ResolvedHitShape, c: AimCandidate<T>): Punkt {
  return mierzyCialem(shape) ? { x: c.body.x, y: c.body.y } : c.sprite;
}

/**
 * Odległość w konwencji danego kształtu.
 *
 * ⚠ **`directionArc` mierzy PRZEŚWIT do krawędzi hurtboxa, `directionTarget`
 * DYSTANS MIĘDZY ŚRODKAMI duszków.** To nie jest niekonsekwencja do
 * posprzątania przy okazji: druga konwencja jest tym, czym Szarża mierzyła
 * zawsze, a zmiana miary przestroiłaby jej `minRange`/`maxRange` przy
 * nietkniętych liczbach.
 */
export function rangeTo<T>(shape: ResolvedHitShape, frame: AimFrame, c: AimCandidate<T>): number {
  const o = originFor(shape, frame);
  if (mierzyCialem(shape)) {
    return gapBetween({ x: o.x, y: o.y, radius: 0 }, c.body);
  }
  return Math.hypot(c.sprite.x - o.x, c.sprite.y - o.y);
}

/**
 * Wektor JEDNOSTKOWY od napastnika do kandydata — **w konwencji tego
 * kształtu** (łuk mierzy ciałami, Szarża duszkami).
 *
 * ⚠ **Istnieje po to, żeby „oś celowania wycelowana w mój cel" liczyła się
 * z tego samego punktu, z którego liczy `coversTarget`.** Scena, która
 * policzyłaby `target.x - player.x` u siebie, minęłaby się o 19 px (środek
 * duszka kontra `combatOrigin` — patrz `AimFrame`) i dostałaby oś, przy której
 * własny cel wypada poza sektorem akwizycji. To jest dokładnie ta klasa
 * cichego lustra, przed którą broni ten plik.
 *
 * ⚠ Zwraca `null` dla kandydata stojącego DOKŁADNIE na napastniku — nie ma
 * wtedy osi, a wołający ma już sensowny wariant zapasowy (zwrot postaci).
 */
export function aimVectorTo<T>(
  shape: ResolvedHitShape,
  frame: AimFrame,
  c: AimCandidate<T>,
): Punkt | null {
  const o = originFor(shape, frame);
  const p = pointOf(shape, c);
  const dx = p.x - o.x;
  const dy = p.y - o.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.0001) return null;
  return { x: dx / len, y: dy / len };
}

/**
 * Czy ten kształt obejmuje tego kandydata. **Jedyny predykat** — woła go
 * podgląd i woła go commit, więc nie mają jak się rozjechać.
 */
export function coversTarget<T>(
  shape: ResolvedHitShape,
  frame: AimFrame,
  aim: Punkt,
  c: AimCandidate<T>,
): boolean {
  if (shape.kind === "directionArc") {
    return withinArc(frame.body, aim, c.body, shape.reachPx, shape.halfArcDeg, shape.pointBlankBypassPx);
  }
  const r = rangeTo(shape, frame, c);
  // ⚠ Pasmo, nie zasięg: Szarża ma zarówno „za blisko", jak i „za daleko".
  // Ciężkie uderzenie ma `minRangePx: 0`, bo melee nie zna stanu „za blisko".
  if (r < shape.minRangePx || r > shape.maxRangePx) return false;
  const o = originFor(shape, frame);
  const p = pointOf(shape, c);
  const kat = angleBetweenDeg(aim.x, aim.y, p.x - o.x, p.y - o.y);
  if (Number.isNaN(kat)) return true;
  return kat <= shape.acquisitionHalfDeg;
}

export type TargetRole = "primary" | "secondary";

export interface SelectedTarget<T> {
  readonly ref: T;
  readonly role: TargetRole;
  /** Odchylenie kątowe od osi celowania (stopnie). */
  readonly deviationDeg: number;
  /** Odległość w konwencji kształtu — patrz `rangeTo`. */
  readonly rangePx: number;
}

/**
 * Kto zostanie wskazany — deterministycznie, z twardym sufitem.
 *
 * Kolejność: **zgodność z osią celowania, potem dystans.** Cel główny to ten
 * o najmniejszym odchyleniu od `aim`.
 *
 * ⚠ **Trzeci klucz (x, potem y) NIE jest ozdobnikiem.** Bez niego dwa cele
 * o identycznym odchyleniu i identycznej odległości rozstrzygałaby stabilność
 * `sort`, czyli kolejność wejścia — czyli kolejność encji w scenie.
 * Symetryczne ustawienie dwóch wilków dawałoby wynik zależny od tego, który
 * się wcześniej odrodził.
 *
 * ⚠ **Cel stojący DOKŁADNIE na napastniku ma odchylenie 0, nie `NaN`.**
 * `NaN` w komparatorze rozwala całe sortowanie, nie tylko swój wiersz.
 */
export function selectTargets<T>(
  spec: ResolvedAbilitySpec,
  frame: AimFrame,
  aim: Punkt,
  candidates: Iterable<AimCandidate<T>>,
): SelectedTarget<T>[] {
  const wZasiegu: { ref: T; p: Punkt; deviationDeg: number; rangePx: number }[] = [];
  const o = originFor(spec.shape, frame);
  for (const c of candidates) {
    if (!coversTarget(spec.shape, frame, aim, c)) continue;
    const p = pointOf(spec.shape, c);
    const kat = angleBetweenDeg(aim.x, aim.y, p.x - o.x, p.y - o.y);
    wZasiegu.push({
      ref: c.ref,
      p,
      deviationDeg: Number.isNaN(kat) ? 0 : kat,
      rangePx: rangeTo(spec.shape, frame, c),
    });
  }

  wZasiegu.sort(
    (a, b) =>
      a.deviationDeg - b.deviationDeg ||
      a.rangePx - b.rangePx ||
      a.p.x - b.p.x ||
      a.p.y - b.p.y,
  );

  return wZasiegu.slice(0, spec.maxTargets).map((t, i) => ({
    ref: t.ref,
    role: i === 0 ? ("primary" as const) : ("secondary" as const),
    deviationDeg: t.deviationDeg,
    rangePx: t.rangePx,
  }));
}

/**
 * Mnożnik obrażeń dla roli. `1` dla umiejętności bez `damage` — ale taka
 * umiejętność nie powinna w ogóle pytać, więc to jest bezpiecznik, nie ścieżka.
 */
export function multiplierFor(spec: ResolvedAbilitySpec, role: TargetRole): number {
  if (!spec.damage) return 1;
  return role === "primary" ? spec.damage.primaryMultiplier : spec.damage.secondaryMultiplier;
}

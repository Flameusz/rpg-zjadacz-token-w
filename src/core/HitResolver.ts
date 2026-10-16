/**
 * Hit Resolver — jedno miejsce odpowiadające na „czy ten cios kogo dosięga".
 *
 * Faza 1A.3–1A.4 Combat v2 (`docs/systemy/combat.md`, §5.2a).
 *
 * ── Dlaczego to jest wyciągnięcie, a nie nowy system ─────────────────────
 * `GameScene.damageMatchingEnemies` **już** był resolverem z wtykanym
 * kształtem: brał `inShape: (enemy, allowance) => boolean` i miał trzy
 * implementacje (cel / stożek / okrąg). Brakowało mu dwóch rzeczy: bycia
 * stronowo-neutralnym i bycia poza sceną Phasera, czyli testowalnym. To jest
 * dokładnie to, co ten plik naprawia — reszta (rzut, popup, XP, łup, respawn)
 * zostaje w `GameScene`, bo to księgowość, nie geometria.
 *
 * ── ✅ Kształty `legacy*` ZNIKNĘŁY w Fazie 1B-b ───────────────────────────
 * Przez całą Fazę 1A ten plik odtwarzał dawną, znaną z błędów geometrię co do
 * bitu — bo 1A miała dowieźć refaktor przy IDENTYCZNYCH trafieniach. Po 1B-b
 * cele są zmierzonymi śladami stopy (`CombatBody`), a `allowance` liczone z
 * `max(displayWidth, displayHeight)` nie istnieje.
 *
 * Bramką jest `tools/combat_regresja.mjs` — 111 zamrożonych przypadków,
 * uruchamianych domyślnie na ŻYWYCH modułach.
 */

import { angleBetweenDeg, gapBetween, type CombatBody, type Punkt } from "./CombatGeometry";

/**
 * Cel widziany przez resolver. Celowo **strukturalny, nie `Enemy`**: gdyby ten
 * plik importował encję, nie dałoby się go uruchomić bez sceny — czyli nie
 * dałoby się go przetestować, a to był jeden z dwóch powodów, dla których
 * powstaje.
 *
 * ⚠ `displayWidth`/`displayHeight` siedzą tu **wyłącznie** dla `legacyAllowance`
 * i wychodzą razem z nim w 1B. Docelowo celem jest `CombatBody`.
 */
export interface HitTarget {
  readonly x: number;
  readonly y: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
}

/* ── Kształty `legacy*` USUNIĘTE w Fazie 1B-b (2026-08-23) ─────────────────
   Były tu: `legacyAllowance`, `withinLegacyReach`, `withinLegacyArc`,
   `withinLegacyCircle`, typ `HitTarget`, unia `LegacyHitShape` i `coversTarget`.

   Odtwarzały dawną geometrię co do bitu, żeby Faza 1A mogła dowieźć refaktor
   przy IDENTYCZNYCH trafieniach. Po 1B-b nikt ich nie woła, a martwy kod
   przy bramce regresyjnej jest gorszy niż brak kodu: uprząż świeciłaby na
   zielono, testując funkcje, których gra nie używa.

   Dawna arytmetyka jest zapisana w `docs/systemy/combat.md` (Faza 1A i 1B),
   a stare wartości progów — w `tools/combat_geometry.mjs`, tabela `PRZED_1B`.
   ────────────────────────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════════════════════════
   FAZA 1B-b — kształty na `CombatBody`
   ══════════════════════════════════════════════════════════════════════════
   Zastępują `legacy*` powyżej. Różnica jest jedna, ale przechodzi przez
   wszystko: zamiast okręgu o promieniu `max(displayWidth, displayHeight) × 0,35`
   celem jest jego ZMIERZONY ślad stopy — kapsuła zorientowana wzdłuż ciała.

   ⚠ **Konwencja zasięgu ZOSTAJE**: mierzy się od punktu napastnika do KRAWĘDZI
   hurtboxa celu, dokładnie jak stare `dist − allowance ≤ reach`. Gdyby zmienić
   też to, każda liczba `reach` w grze zmieniłaby znaczenie naraz z kształtem i
   nie dałoby się rozdzielić skutków.

   ⚠ Zmierzony skutek (miecz, `reach` 68): czołowo wilk **−5,4 px**, Szary
   −6,4; z boku wilk **+8,0**, Szary +11,6. Trafienie w nos trudniejsze, w bok
   łatwiejsze — to jest sylwetka, nie strojenie. Pełna tabela:
   `tools/combat_geometry.mjs`, sekcja I. */

/** Odległość od punktu do KRAWĘDZI ciała. Punkt to ciało o promieniu zero, więc
 *  cała kapsułowa arytmetyka `gapBetween` obsługuje to bez wyjątku. */
function doKrawedzi(origin: Punkt, target: CombatBody): number {
  return gapBetween({ x: origin.x, y: origin.y, radius: 0 }, target);
}

/**
 * Czy cios o tym zasięgu dosięga celu.
 *
 * ⚠⚠ **`minReach` to DOLNA granica tego samego prześwitu** (2026-09-16,
 * `MeleeShape.minReach`). `0` — czyli brak pola na broni — znaczy „bez dolnej
 * granicy" i daje **dokładnie dotychczasowe zachowanie**: każda broń w grze
 * poza piką, halabardą i glewią przechodzi tą samą ścieżką, co przed zmianą.
 *
 * ⚠ **Mierzy się JEDNĄ miarą — prześwitem do krawędzi hurtboxa.** Gdyby dolna
 * granica liczyła się dystansem środków, ta sama liczba znaczyłaby co innego
 * dla królika i dla niedźwiedzia — dokładnie ten błąd, którego `gapBetween`
 * ma nie dopuszczać.
 *
 * ⚠ **`>=`, nie `>`.** Prześwit dokładnie równy `minReach` ma trafiać; próg
 * ma odcinać zwarcie, a nie jeden piksel na granicy rozstrzygany szumem
 * zmiennoprzecinkowym (ta sama lekcja co przy `blockArcDeg` i `isFrontal`).
 */
export function withinReach(
  origin: Punkt,
  target: CombatBody,
  reach: number,
  minReach = 0,
): boolean {
  const gap = doKrawedzi(origin, target);
  return gap <= reach && gap >= minReach;
}

/**
 * Stożek frontalny + opcjonalny bąbel zwarcia.
 *
 * ⚠ **Kąt liczony w STOPNIACH, nie przez cosinusy** — zmiana wobec
 * `withinLegacyArc`, świadomie odłożona do 1B. Przy `arcDeg = 90` próg
 * `Math.cos(90°)` wynosi 6,1e-17 zamiast zera i o trafieniu decyduje szum
 * zmiennoprzecinkowy; dziś żadna broń nie ma 90°, ale wpisanie go budziło
 * pułapkę. Ta forma ją zamyka. Ta sama lekcja co w `Protection.isFrontal`.
 *
 * ── ⚠ `pointBlankBypassPx` jest PARAMETREM, nie stałą (2026-08-23) ────────
 * Do prototypu celowania bąbel zwarcia był wpisany na sztywno jako
 * `PLAYER.pointBlankRadius` (28 px) i dotyczył jedynego wołającego —
 * `Szerokiego cięcia`. Przy umiejętności z PODGLĄDEM łuku to przestało być
 * do obrony: przeciwnik stojący przy plecach ma prześwit poniżej 28 px, więc
 * obrywał **poza narysowanym klinem**. Podgląd, który pokazuje jedno, a cios
 * ląduje gdzie indziej, jest gorszy niż brak podglądu.
 *
 * ⚠ **Wymagany, nie opcjonalny.** Domyślna wartość sprawiłaby, że „ta akcja
 * świadomie nie ma furtki" i „ktoś nie pomyślał" wyglądają identycznie — ta
 * sama reguła co przy `damageType` i `ownsBody`.
 *
 * ⚠ **`> 0` przed porównaniem, i to jest decyzja.** `0` znaczy „furtki nie
 * ma"; bez tego warunku prześwit ≤ 0 (ciała nachodzą) dalej pomijałby kąt,
 * czyli furtka istniałaby nadal, tylko węższa.
 */
export function withinArc(
  origin: Punkt,
  facing: Punkt,
  target: CombatBody,
  reach: number,
  arcDeg: number,
  pointBlankBypassPx: number,
): boolean {
  const gap = doKrawedzi(origin, target);
  if (gap > reach) return false;
  if (pointBlankBypassPx > 0 && gap <= pointBlankBypassPx) return true;
  const kat = angleBetweenDeg(facing.x, facing.y, target.x - origin.x, target.y - origin.y);
  // Cel dokładnie na napastniku nie ma osi — wierzchołek klina leży w tym
  // punkcie, więc „stoi na mnie" jest w łuku niezależnie od kierunku.
  if (Number.isNaN(kat)) return true;
  return kat <= arcDeg;
}

export function withinCircle(center: Punkt, target: CombatBody, radius: number): boolean {
  return doKrawedzi(center, target) <= radius;
}

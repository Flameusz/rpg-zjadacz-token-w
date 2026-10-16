import { ARMOR_PROFILE, COMBAT_FEEDBACK, EQUIPMENT, SHIELD, SHIELD_GEOMETRY } from "../config/GameConfig";
// Kąt frontalny liczy teraz `CombatGeometry` — jedno miejsce na całą geometrię
// walki (Faza 1A.1, `docs/systemy/combat.md`). Wraz z tym zniknął stąd
// import Phasera: `Clamp`/`RadToDeg` były jedynym powodem, dla którego tu był,
// więc ten plik jest dziś czystą arytmetyką bez silnika.
import { angleBetweenDeg } from "./CombatGeometry";
// Type only — erased at compile time, so this file ma dokładnie DWIE zależności
// runtime (`GameConfig` i `CombatGeometry`, obie bezlistne) i nie może utworzyć
// cyklu z `Equipment`, które importuje je z powrotem. ⚠ Do Fazy 1A.1 zależność
// była jedna; `CombatGeometry` nie importuje niczego z `core/`, więc własność,
// o którą chodziło w tym komentarzu — brak cyklu — została zachowana.
import type { DamageType } from "./Equipment";

/** What a piece of protection IS. Not how well it is made — that is quality. */
export type ArmorType = keyof typeof ARMOR_PROFILE;

/** A creature's natural protection, or a piece of worn armour, as data. */
export interface ArmorSpec {
  readonly type: ArmorType;
  readonly points: number;
}

/**
 * The one place damage reduction is computed, for BOTH directions of combat.
 *
 * ── Dlaczego to w ogóle istnieje ──────────────────────────────────────────
 * Before this, the project had two unrelated shapes of protection: the player
 * had defence POINTS run through `d/(d+K)` with a cap, and (after CR-1) an
 * enemy had a raw percentage per damage type. Two shapes means quality,
 * durability and every future modifier need two implementations and drift
 * apart. Points won because everything that will ever modify protection —
 * workmanship (`instanceDefense`), a future durability multiplier, a buff —
 * naturally scales a POINT TOTAL, while scaling a percentage has no single
 * correct answer ("+20% on 60%" is either 72% or 80pp).
 *
 * Deliberately plain functions, not a class or a service: this is arithmetic
 * over data, and the damage RESOLVER stays exactly where it was
 * (`GameScene.damageMatchingEnemies` one way, `Player.takeDamage` the other).
 */

/**
 * Effective defence points against one damage type.
 *
 * ⚠ `damageType` is OPTIONAL and its absence means "no type involved", which
 * returns the points unchanged — i.e. exactly today's uniform behaviour. That
 * is what lets the player's armour keep working untouched while enemies have
 * no damage types of their own yet: nothing has to be built twice, and nothing
 * changes until a type actually arrives.
 */
export function armorPointsAgainst(points: number, type: ArmorType, damageType?: DamageType): number {
  if (!damageType) return points;
  return points * ARMOR_PROFILE[type][damageType];
}

/**
 * Points → fraction of incoming damage blocked. Diminishing returns
 * (`d / (d + K)`), clamped — the curve the player's armour has always used.
 */
export function reductionFromPoints(points: number): number {
  if (points <= 0) return 0;
  return Math.min(points / (points + EQUIPMENT.defenseK), EQUIPMENT.maxDefenseReduction);
}

/**
 * Apply an `ArmorSpec` to an incoming hit. No armour means **full damage** —
 * there is deliberately no "unarmoured resistance" anywhere in this model.
 *
 * Never rounds below 1: a heavily protected target would otherwise be immortal,
 * and a floating "0" reads as the game being broken rather than as armour.
 */
export function mitigate(amount: number, armor: ArmorSpec | undefined, damageType?: DamageType): number {
  if (!armor || armor.points <= 0) return amount;
  const reduction = reductionFromPoints(armorPointsAgainst(armor.points, armor.type, damageType));
  if (reduction <= 0) return amount;
  return Math.max(1, Math.round(amount * (1 - reduction)));
}

/** Która strefa osłony tarczą — patrz `guardZone`. */
export type GuardZone = "front" | "side" | "back";

/**
 * **Geometria osłony jednej tarczy** — dwie granice, ten sam kształt co globalne
 * `SHIELD.fullArcDeg`/`sideArcDeg`.
 *
 * ⚠ To jest MECHANIZM `T-1`, a nie kalibracja: wartości per konstrukcja
 * rozstrzyga `B3` **po pomiarze `P1`**, a do tego czasu `SHIELD_GEOMETRY` jest
 * pusty i wszyscy dostają globalny fallback.
 */
export interface GuardGeometry {
  readonly fullArcDeg: number;
  readonly sideArcDeg: number;
}

/** Globalny profil — dzisiejsze 60°/100°. Jedyne źródło fallbacku. */
export function defaultGuardGeometry(): GuardGeometry {
  return { fullArcDeg: SHIELD.fullArcDeg, sideArcDeg: SHIELD.sideArcDeg };
}

/**
 * Profil dla danej konstrukcji, albo globalny, gdy konstrukcja go nie ma.
 *
 * ⚠⚠ **Niekompletny wpis jest traktowany jak BRAK wpisu.** Połowiczna
 * geometria (`fullArcDeg` bez `sideArcDeg`) dałaby `NaN` w porównaniu kątów,
 * czyli tarczę, która nie blokuje NIGDY — i to po cichu, bo `NaN < x` jest
 * po prostu `false`. Ta sama klasa awarii, co framebuffer 0×0 z `B-1`.
 */
export function shieldGeometryFor(construction: string | null | undefined): GuardGeometry {
  const wpis = construction
    ? (SHIELD_GEOMETRY as Record<string, GuardGeometry | undefined>)[construction]
    : undefined;
  if (!wpis || !Number.isFinite(wpis.fullArcDeg) || !Number.isFinite(wpis.sideArcDeg)) {
    return defaultGuardGeometry();
  }
  return wpis;
}

/**
 * **W której strefie osłony leży nadchodzący cios** — front / bok / tył,
 * liczone od zwrotu, który RYSUJE sprite.
 *
 * ⚠ **Zbudowane NA `isFrontal`, nie obok niego** — i to jest treść, nie styl.
 * Dzięki zagnieżdżeniu istnieje dokładnie JEDNA konwencja granicy (kąt
 * w stopniach, porównanie ostre `<`), JEDNA obsługa `NaN` przy zerowym
 * wektorze i JEDNA obsługa `from === null`. Drugą kopię tej geometrii projekt
 * już raz miał i kosztowała pomiar — patrz komentarz w `isFrontal`
 * o cosinusach. Zagnieżdżenie gwarantuje przy okazji STRUKTURALNIE, że
 * `front ⊆ bok ⊆ blokowalne`: pas bocznego bloku jest RÓŻNICĄ dwóch testów,
 * więc nie potrafi być szerszy od granicy zewnętrznej, choćby ktoś wpisał
 * `fullArcDeg` większe od `sideArcDeg`.
 *
 * ── Dlaczego trzy strefy, a nie dwie (2026-09-05) ───────────────────────
 * Do tej daty blok był binarny: cała przednia półkula dawała PEŁNĄ redukcję,
 * a od granicy bocznej wzwyż zero. Model gameplayowy inspirowany szerokim
 * polem widzenia człowieka — **nie odwzorowaniem anatomii**: gracz widzi atak
 * z boku i zdąży zareagować, ale tarcza nie jest wtedy ustawiona optymalnie.
 * Liczby i uzasadnienie rozdziału `blockArcDeg` ↔ `sideArcDeg`: `SHIELD`
 * w `GameConfig.ts`.
 *
 * ⚠ **Trzy własności bloku, każda zamierzona i NIEZMIENIONA przez podział na
 * strefy:**
 *
 *  • **Deterministyczny.** Zero rzutów. Powód nie jest estetyczny, tylko
 *    zmierzony: gracz przyjmuje 1–4 ciosy na walkę, więc rzut 30% nie jest
 *    „30% redukcji", tylko monetą rzucaną raz na starcie — przy wilku (~2
 *    ciosy) nie robi nic w połowie walk. Strefa nie dokłada tu losowości:
 *    zmienia MNOŻNIK, nie szansę.
 *  • **Neutralny wobec typu obrażeń.** Pancerz odpowiada na „**czym** we mnie
 *    trafiono", tarcza na „**czy zdążyłem ją podstawić**". Własny profil
 *    per-typ byłby drugą tabelą po tej samej stronie walki, a przy widocznych
 *    liczbach dałby wynik będący iloczynem dwóch niewidocznych tabel — nie do
 *    rozłożenia na czynniki przez obserwację. To jest decyzja, nie odroczenie.
 *  • **Nie dotyka jadu.** `Player.takeVenomTick` świadomie omija `takeDamage`,
 *    więc dzieje się to samo z siebie: tarcza nie zatrzymuje toksyny, która
 *    jest już w środku.
 *
 * `from === null` znaczy „cios bez kierunku" i **nie da się go zablokować** —
 * ta sama konwencja, co `damageType: null`: decyzja na zapis, nie przeoczenie.
 * Wypada tu jako `"back"`, bo `isFrontal` zwraca dla niego `false`.
 *
 * ⚠ **Zastąpiło `blockFraction`, usunięte 2026-09-05.** Tamta funkcja była
 * martwa od wyciągnięcia `DamageResolver` (Faza 1A.5) — zero wywołań w `src/`
 * — a mimo to cztery dokumenty rysowały ją jako żywą ścieżkę bloku. Zostawiona
 * obok stref byłaby DRUGĄ, dwustrefową odpowiedzią na to samo pytanie, czyli
 * dokładnie tą klasą rozjazdu, którą ten projekt już raz zapłacił.
 */
export function guardZone(
  facing: GuardFacing,
  from: { x: number; y: number } | null,
  // ⚠ **Parametr z domyślną wartością, nie nowa ścieżka.** Wołanie bez trzeciego
  //   argumentu zachowuje się DOKŁADNIE tak, jak przed `T-1` — to jest warunek,
  //   pod którym `combat_regresja` ma nadal 121/121 bez różnic.
  geo: GuardGeometry = defaultGuardGeometry(),
): GuardZone {
  if (!isFrontal(facing, from, geo.sideArcDeg)) return "back";
  return isFrontal(facing, from, geo.fullArcDeg) ? "front" : "side";
}

/**
 * **Stopień bloku** — jak ciężki był cios W STOSUNKU DO TEJ tarczy (`T-7`).
 *
 * ⚠ **`none` znaczy „tarcza nie weszła w grę"**, nie „blok się nie udał".
 * Blok w tej grze jest deterministyczny (`N-23`) i nie ma czego nie udać —
 * stopień odpowiada wyłącznie na pytanie „ile ta tarcza właśnie przyjęła".
 *
 * ⚠ **Dwie osie, nie jedna.** `GuardZone` mówi, CZY tarcza była ustawiona
 * (geometria); `BlockGrade` mówi, ILE zniosła (ciężar ciosu). Blok od przodu
 * może być `stagger`, a blok z boku `light` — i odwrotnie. ⛔ Nie wyprowadzaj
 * jednego z drugiego.
 */
export type BlockGrade = "none" | "light" | "solid" | "stagger";

/**
 * Sklasyfikuj blok po stosunku **przyjęte punkty / udźwig tarczy**.
 *
 * ⚠ **Czysta arytmetyka nad `SHIELD.block.grade`** — tak samo jak `guardZone`
 * czyta `SHIELD.fullArcDeg`. Progi są konfiguracją, nie liczbą w `if`-ie.
 *
 * ⚠ **`capacity <= 0` daje `stagger`, a nie dzielenie przez zero.** Tarcza
 * o zerowym udźwigu nie istnieje w katalogu, ale rozbita do zera jakość/stan
 * potrafi się do zera zbliżyć — i wtedy „każdy cios ją przeciąża" jest
 * poprawną odpowiedzią, nie awarią.
 */
export function blockGradeFor(absorbed: number, capacity: number): BlockGrade {
  if (!(absorbed > 0)) return "none";
  if (!(capacity > 0)) return "stagger";
  const ratio = absorbed / capacity;
  const g = SHIELD.block.grade;
  if (ratio < g.lightBelow) return "light";
  return ratio > g.staggerAbove ? "stagger" : "solid";
}

/**
 * Czy kierunek `from` leży w przedniej półkuli względem `facing`.
 *
 * ⚠ **Od 2026-08-23 ma TRZECIEGO konsumenta i to zmienia jego status.** Poza
 * Blokiem i Parowaniem (obrona) woła go bramka zwrotu autoataku
 * (`GameScene.canStrikeFacing`) — z wektorem DO CELU zamiast DO NAPASTNIKA,
 * bo to ta sama geometria pytana z drugiej strony. Dzięki temu reguła
 * „trafiasz to, co mógłbyś zablokować" jest JEDNĄ funkcją i JEDNĄ konwencją
 * granicy, a nie dwiema kopiami, które rozjadą się przy pierwszym strojeniu.
 *
 * `arcDeg` jest parametrem (domyślnie `SHIELD.blockArcDeg`) wyłącznie po to,
 * żeby atak mógł nazwać SWÓJ pokrętło (`PLAYER.attackFrontArcDeg`) bez
 * czytania stałej tarczy. Obie wskazują dziś na `FRONT_ARC_DEG`; pilnuje tego
 * asercja §L w `tools/combat_regresja.mjs`. Wspólny geometryczny warunek dla Block I Parry
 * (Attack Resolver, Combat v1) — obie mechaniki są "frontalne" w dokładnie
 * tym samym sensie, więc mają jeden resolver kąta, nie dwa kopiowane osobno.
 *
 * ⚠ Wydzielone z `blockFraction` bez zmiany ANI JEDNEJ liczby ani warunku —
 * patrz komentarz historyczny niżej o tym, dlaczego kąt liczony jest w
 * stopniach i porównywany ostro (`<`), nie przez cosinusy.
 */
export function isFrontal(
  facing: GuardFacing,
  from: { x: number; y: number } | null,
  arcDeg: number = SHIELD.blockArcDeg,
): boolean {
  const kat = guardAngleDeg(facing, from);
  // Napastnik dokładnie na graczu (0 px) nie ma kierunku, z którego nadchodzi.
  // Zdarza się realnie: kontakt to overlap ciał, więc wektor bywa zerowy —
  // `guardAngleDeg` zwraca wtedy NaN i nie blokujemy. Tą samą drogą wychodzi
  // `from === null`.
  if (Number.isNaN(kat)) return false;
  // Granica należy do strony NIEchronionej: dokładnie z boku to krawędź
  // tarczy, nie jej płaszczyzna. Wybór jest arbitralny, ale musi być jakiś i
  // musi być zapisany — inaczej rozstrzygnie go przypadek, tak jak wyżej.
  return kat < arcDeg;
}

/**
 * **Kąt między „gdzie patrzę" a „skąd nadchodzi cios", w stopniach (0…180).**
 * `NaN`, gdy cios nie ma kierunku (`from === null` albo wektor zerowy).
 *
 * ⚠ **Wydzielone z `isFrontal` (2026-09-15, `P1`) i to jest wymóg N-25, nie
 * wygoda.** Przymiar `P1` potrzebuje SUROWEGO kąta, żeby dało się ocenić progi
 * inne niż dzisiejsze 60/100 (`B3` pyta o 45/90/135). Policzenie go drugi raz
 * u wołającego byłoby DRUGĄ KOPIĄ GEOMETRII — dokładnie tym, czego zakazuje
 * niezmiennik „jedna konwencja granicy kąta", i co ten projekt raz już zapłacił
 * pomiarem. Jedno miejsce liczy kąt; `isFrontal` porównuje go z progiem.
 *
 * ⚠ **Refaktor bit-w-bit.** `!from → NaN → isFrontal:false` daje ten sam wynik,
 * co poprzednie `if (!from) return false`. Pilnuje tego `tools/combat_regresja.mjs`,
 * grupa „obrona".
 *
 * ── Dlaczego KĄT, a nie porównanie cosinusów ─────────────────────────────
 * Przy `blockArcDeg = 90` próg `Math.cos(90°)` wynosi 6,1e-17, a nie zero, więc
 * cios dokładnie z boku (iloczyn skalarny równo 0) wypadał po niewłaściwej
 * stronie nierówności. Zmierzone: przy zwrocie w dół cios z (1,0) nie był
 * blokowany — o czym decydował wyłącznie szum zmiennoprzecinkowy. To jest
 * najgorszy możliwy rodzaj reguły w grze o pozycję: prawdziwa, powtarzalna
 * i niemożliwa do wytłumaczenia. Kąt w stopniach ma tu wartości dokładne
 * (0, 90, 180).
 *
 * ⚠ Sama arytmetyka mieszka od Fazy 1A.1 w `CombatGeometry.angleBetweenDeg`,
 * razem z lekcją o prekomputowanej stałej `RAD_TO_DEG`. **Wynik jest bit-w-bit
 * ten sam**: wektor zwrotu (`sin`, `cos`) jest jednostkowy, więc dzielenie przez `|a|·|b|`
 * to dzielenie przez `1 · len`, czyli przez `len` jak dotąd.
 */
export function guardAngleDeg(
  facing: GuardFacing,
  from: { x: number; y: number } | null,
): number {
  if (!from) return NaN;
  const [fx, fy] = facingVector(facing);
  return angleBetweenDeg(fx, fy, from.x, from.y);
}

/**
 * **Zwrot obrony — CIĄGŁY kąt** (radiany, `atan2(x, y)` w osiach ekranu,
 * 0 = w dół) — ta sama konwencja co `Player.zwrotKat` / `Player.guardKat`.
 *
 * ⚠⚠ **Od 2026-09-27 WYŁĄCZNIE liczba.** Do tej daty typ przyjmował też
 * `Direction` (cztery wartości) — pozostałość po arkuszu 2D. Od A6.3
 * (`OI-140`) gra podawała tu zawsze kąt; ćwiartki podawały już tylko DANE
 * TESTOWE w `tools/`, więc gałąź utrzymywana w grze istniała wyłącznie dla
 * testów. Testy przeszły na kąty (0 = w dół, π/2 = w prawo) i dały wynik
 * bit w bit: szum `cos(π/2)` ≈ 6e-17 znika w stopniach poniżej połowy ulp
 * liczby 90, więc granice łuku (`<`) wychodzą identycznie.
 *
 * ⛔ **Nie kwantuj z powrotem do czterech kierunków** — to cofnięcie A5,
 * zakazane przez autora wprost.
 */
export type GuardFacing = number;

function facingVector(facing: GuardFacing): readonly [number, number] {
  return [Math.sin(facing), Math.cos(facing)];
}

/**
 * Jak dobrze DANY TYP obrażeń radzi sobie z DANĄ ochroną — trzy stany, nie
 * liczba. To jest treść koloru i glifu przy liczbie obrażeń.
 *
 * ⚠ **Liczone z MNOŻNIKA (`ARMOR_PROFILE`), nigdy z wyniku.** To jest cała
 * różnica między „pomiarem materiału" a „werdyktem o twoim wyborze":
 *  - mnożnik jest własnością pary (typ × materiał) i ma **naturalne, absolutne
 *    zero w 1,0** — „pancerz liczy się w całości". Nie trzeba go z niczym
 *    porównywać, więc nie ma problemu „odchylenie względem czego";
 *  - normalizacja względem POZOSTAŁYCH typów dałaby ranking („to jest twoja
 *    najlepsza opcja tutaj"), czyli podałaby graczowi odpowiedź zamiast
 *    sprowokować pytanie — a to jest dokładnie to, czego ten kanał ma unikać;
 *  - liczenie z wyniku nie zadziała: obrażenia są losowe, a krytyki zalewają
 *    12-procentową różnicę typów (patrz pomiar przy `COMBAT_FEEDBACK.
 *    typeFeedback`).
 *
 * ⚠ Efekt uboczny wyboru mnożnika, i to POŻĄDANY: kanał działa też dla broni
 * JEDNOWARIANTOWEJ. Młot przeciw metalowi to 0,40 — dostaje „przechodzi", choć
 * gracz nie ma czego wybierać. Kolor mówi o świecie, nie o trafności decyzji.
 *
 * `neutralnie` zwracane jest zawsze, gdy nie ma czego pokazać: brak ochrony,
 * brak typu, albo ochrona zbyt cienka, by różnica sięgnęła jednego punktu
 * wyświetlanych obrażeń (`minArmorPoints`).
 */
export type Effectiveness = "przechodzi" | "neutralnie" | "grzeznie";

export function effectiveness(
  armor: ArmorSpec | undefined,
  damageType?: DamageType,
): Effectiveness {
  const cfg = COMBAT_FEEDBACK.typeFeedback;
  if (!armor || !damageType) return "neutralnie";
  if (armor.points < cfg.minArmorPoints) return "neutralnie";
  const mul = ARMOR_PROFILE[armor.type][damageType];
  if (mul < cfg.slipsBelow) return "przechodzi";
  // 1,0 to zero definicyjne, nie próg do strojenia — patrz `slipsBelow`.
  if (mul > 1) return "grzeznie";
  return "neutralnie";
}

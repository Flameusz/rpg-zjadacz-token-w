/**
 * Damage Resolver — jedno miejsce odpowiadające na „co się z tym ciosem dzieje".
 *
 * Faza 1A.5 Combat v2 (`docs/systemy/combat.md`, §5.6).
 *
 * ── To jest WYCIĄGNIĘCIE, nie nowy system ────────────────────────────────
 * Łańcuch **Dodge → Parry → Block → Pancerz → jedno zaokrąglenie** powstał i
 * został skalibrowany w Combat v1 (2026-08-24) i mieszkał w `Player.takeDamage`
 * — przemieszany z dźwiękiem, mignięciem, trzęsieniem kamerą, staminą i
 * emisją zdarzeń. Ten plik zabiera z tego **wyłącznie rozstrzygnięcie**.
 *
 * Ani jedna liczba, ani jeden warunek się nie zmienia. Pilnuje tego
 * `tools/combat_regresja.mjs`, grupa „obrona" — 15 przypadków dobranych tak,
 * żeby rozróżniały KOLEJNOŚĆ kroków i liczbę zaokrągleń.
 *
 * ── Dlaczego funkcja czysta, a nie metoda ────────────────────────────────
 * 1. **Testowalność.** `Player.takeDamage` da się uruchomić tylko wewnątrz
 *    sceny Phasera. To da się uruchomić w Node, co jest jedynym powodem, dla
 *    którego uprząż regresyjna w ogóle mogła powstać.
 * 2. **Przyszły serwer.** Reguła z §5.1 audytu: resolver zwraca DANE i nie woła
 *    niczego z Phasera. Żadnego `Sfx.play`, `cameras.main.shake`, `flashHit`.
 *    Na serwerze nie ma kamery.
 *
 * ⚠ **Kontekst wchodzi jako DANE, nie przez singletony.** `dodgeChance`,
 * `armorReduction` i reszta są PARAMETRAMI, choć wołający bierze je z
 * `Progression`/`Equipment`. To nie jest ostrożność wobec grafu importów —
 * to jest granica, po której ta funkcja da się odtworzyć gdziekolwiek indziej
 * (test, replay, serwer) bez ciągnięcia stanu gry.
 *
 * ⚠ **Czego tu NIE MA i mieć nie będzie: jadu.** `Player.takeVenomTick`
 * świadomie omija cały ten łańcuch — bez pancerza, bez tarczy, bez typu, bez
 * nietykalności. Każda z tych różnic jest zamierzona (patrz komentarz przy
 * `takeVenomTick`). Podpięcie jadu tutaj skasowałoby cztery decyzje naraz.
 */

import type { DamageType } from "./Equipment";
import { guardZone, isFrontal, type GuardFacing } from "./Protection";
import type { GuardGeometry, GuardZone } from "./Protection";
import { Defense } from "./Defense";

/** Co się stało z ciosem. */
export type DamageOutcome = "immune" | "dodge" | "parry" | "block" | "hit";

/**
 * Wszystko, czego rozstrzygnięcie potrzebuje — i nic więcej.
 *
 * ⚠ `armorReduction` i `blockReduction` to UŁAMKI (0…1), nie punkty. Punkty
 * mieszkają w `core/Protection.ts` i to ono zamienia je na ułamek; ten plik
 * dostaje już wynik. Dzięki temu ta sama funkcja obsługuje obie strony walki,
 * mimo że pancerz gracza i pancerz stworzenia są opisane inaczej.
 */
export interface DamageContext {
  readonly amount: number;
  readonly damageType: DamageType | null;
  /** Wektor DO napastnika. `null` = cios bez kierunku, którego NIE da się
   *  zablokować ani sparować — konwencja na zapis, nie przeoczenie. */
  readonly from: { x: number; y: number } | null;
  /** Zwrot obrony — CIĄGŁY kąt (radiany, 0 = w dół), patrz `GuardFacing`. */
  readonly guardDir: GuardFacing;
  readonly invulnerable: boolean;
  readonly dodgeChance: number;
  readonly parryChance: number;
  readonly armorReduction: number;
  readonly blockReduction: number;
  /**
   * Mnożnik na `blockReduction` w BOCZNEJ strefie osłony (1 = brak kary).
   *
   * ⚠ **Wchodzi PARAMETREM, nie importem `SHIELD`** — dokładnie z tego samego
   * powodu, co `blockReduction` obok. Nagłówek tego pliku stawia to jako
   * warunek: resolver ma dać się odtworzyć w teście, w replayu i na serwerze
   * bez ciągnięcia stanu gry. Geometria stref siedzi w `Protection.guardZone`,
   * bo tam mieszka już konwencja granicy łuku; SIŁA kary jest strojeniem
   * i należy do wołającego.
   */
  readonly blockSideMul: number;
  /**
   * **Udźwig bloku w PUNKTACH** — ile ta tarcza znosi bez przeciążenia (`T-7`).
   *
   * ⚠ Podawany PARAMETREM z tego samego powodu co `blockSideMul`: resolver nie
   * czyta ani `SHIELD`, ani `Equipment`, więc daje się uruchomić w Node i daje
   * się kiedyś policzyć na serwerze. Liczy go `Equipment.blockCapacity`
   * z masy, jakości i stanu egzemplarza.
   *
   * ⚠ **0 znaczy „brak tarczy"** i wtedy `blockReduction` i tak jest zerem —
   * miękkie kolano nigdy nie odpala się samo.
   */
  readonly blockCapacity: number;
  /**
   * Ile z NADWYŻKI ponad udźwig tarcza jeszcze zatrzymuje (0..1).
   *
   * ⚠ **To jest MIĘKKIE KOLANO, nie sufit.** Redukcja procentowa zostaje;
   * maleje wyłącznie tempo, w jakim tarcza zdejmuje punkty powyżej swojego
   * udźwigu. Próg twardy stałby na urwisku — patrz `SHIELD.block.overflowKeep`.
   */
  readonly blockOverflowKeep: number;
  /**
   * **Geometria osłony tarczy trzymanej w tej chwili** (`T-1`, 2026-09-16).
   *
   * ⚠⚠ **OPCJONALNE ŚWIADOMIE.** Brak pola znaczy „użyj globalnych
   * `SHIELD.fullArcDeg`/`sideArcDeg`”, czyli zachowanie bit w bit sprzed `T-1`.
   * Dzięki temu 121 przypadków `combat_regresja` i wszystkie inne uprzęże
   * wołające ten resolver **nie musiały zmienić ani jednej linii**, a fallback
   * jest testowany przez sam fakt, że przechodzą.
   *
   * ⛔ Resolver NIE sięga po nią do katalogu — dostaje ją gotową w kontekście,
   * bo musi dać się odtworzyć w teście, w replayu i na serwerze bez stanu gry.
   */
  readonly blockGeometry?: GuardGeometry;
}

export interface DamageResult {
  readonly outcome: DamageOutcome;
  /** Obrażenia po wszystkich redukcjach. 0, gdy cios w ogóle nie doszedł. */
  readonly mitigated: number;
  /** Czy cios nadszedł z przedniej półkuli. Wołający potrzebuje tego do
   *  wyboru dźwięku i tintu, więc zwracamy zamiast liczyć drugi raz.
   *
   *  ⚠ To jest półkula PAROWANIA (`SHIELD.blockArcDeg`), a od 2026-09-05 **nie
   *  to samo, co „tarcza zadziałała"** — zewnętrzna granica tarczy jest
   *  szersza. Do pytania o tarczę służy `zone`. */
  readonly frontal: boolean;
  /**
   * Strefa osłony tarczą — `front` / `side` / `back`.
   *
   * ⚠ **Zwracana po to, żeby wołający NIE odtwarzał redukcji z `outcome`.**
   * Przed 2026-09-05 `Player.takeDamage` liczył `blocked` drugi raz, wprost
   * z `Equipment.blockSpec.reduction`; przy jednej strefie dawało to tę samą
   * liczbę, przy trzech byłoby po prostu nieprawdą.
   */
  readonly zone: GuardZone;
  /**
   * **Ile PUNKTÓW zatrzymała tarcza** (`T-7`). 0, gdy nie zatrzymała nic.
   *
   * ⚠ **To jest ta liczba, od której wisi cały ciężar bloku** — koszt wysiłku,
   * zużycie trwałości, stopień (`Protection.blockGradeFor`) i praktyka
   * umiejętności władania tarczą. Do 2026-09-15 nie istniała, więc blok był
   * jedynym zdarzeniem w łańcuchu obrony, które nie wiedziało, ile ważyło.
   *
   * ⚠ **Zwracana, żeby wołający jej NIE ODTWARZAŁ** — dokładnie z tego samego
   * powodu, co `zone` obok: po miękkim kolanie `amount × reduction` przestaje
   * być prawdą, a druga kopia wzoru rozjechałaby się cicho.
   *
   * ⚠ **Liczona PRZED zaokrągleniem `mitigated`**, więc `absorbed + mitigated`
   * nie musi się dokładnie równać obrażeniom po pancerzu. To jest ta sama
   * decyzja, co „JEDNO zaokrąglenie na końcu" — dwa zaokrąglenia zjadłyby efekt
   * tarczy na małych ciosach.
   */
  readonly absorbed: number;
}

/**
 * Rozstrzygnij nadchodzący cios.
 *
 * ⚠ **KOLEJNOŚĆ jest treścią tej funkcji, nie szczegółem implementacji.**
 * Dodge → Parry → Block → Pancerz. Uzasadnienie i kalibracja:
 * `docs/dziennik.md`, wpis Combat v1.
 *
 * ⚠ **Dodge jest WSZECHKIERUNKOWY**, próbowany zawsze. **Parry jest FRONTALNE**
 * i zostaje na `isFrontal` (półkula 90°).
 *
 * ⚠⚠ **Od 2026-09-05 Block NIE dzieli już warunku z Parry.** Blok ma trzy
 * strefy (`Protection.guardZone`) i własną, szerszą granicę zewnętrzną, bo
 * odpowiada na inne pytanie: parowanie pyta „czy zdążyłem odbić", tarcza „czy
 * zdążyłem ją podstawić". Do 2026-09-05 obie brały jeden `isFrontal` i to było
 * poprawne, dopóki blok był binarny.
 *
 * ⚠ **JEDNO zaokrąglenie, na samym końcu.** Obie redukcje liczą się jako
 * ułamki i mnożą przed `Math.round`. To ta sama lekcja, którą projekt odrobił
 * przy jakości wykonania: ciosy mają tu 1–22 punktów, więc podwójne
 * zaokrąglenie zjadłoby cały efekt tarczy na małych ciosach. Uprząż ma na to
 * jawny przypadek („rozjazd zaokrągleń: 9 × 0,55 × 0,5").
 *
 * ⚠ **Nigdy poniżej 1 punktu** — cel w ciężkim pancerzu byłby inaczej
 * nieśmiertelny, a pływające „0" czyta się jako zepsutą grę, nie jako pancerz.
 *
 * ⚠ **`Defense` niesie stan między rzutami** (PRD, „bad luck protection").
 * Wołanie tej funkcji ma skutek uboczny w liczniku serii i to jest zamierzone —
 * ale znaczy też, że **nie wolno jej wołać „na próbę"**, np. żeby pokazać
 * podgląd obrażeń. Do tego służy sama arytmetyka z `Protection`.
 */
export function resolveIncoming(ctx: DamageContext): DamageResult {
  if (ctx.invulnerable) {
    return { outcome: "immune", mitigated: 0, frontal: false, zone: "back", absorbed: 0 };
  }

  if (Defense.rollDodge(ctx.dodgeChance)) {
    return { outcome: "dodge", mitigated: 0, frontal: false, zone: "back", absorbed: 0 };
  }

  // ⚠ **PAROWANIE ZOSTAJE NA `isFrontal`, nietknięte** (2026-09-05). Kusi, żeby
  // po dodaniu stref napisać `zone !== "back"` i mieć jeden warunek — ale to
  // POSZERZYŁOBY parowanie o pas boczny przy okazji strojenia tarczy, czyli
  // zmieniło mechanikę, o którą nikt nie prosił. Parowanie i tarcza odpowiadają
  // na różne pytania i mają różne granice: `blockArcDeg` (90°) i `sideArcDeg`
  // (100°).
  const frontal = isFrontal(ctx.guardDir, ctx.from);
  if (frontal && Defense.rollParry(ctx.parryChance)) {
    return {
      outcome: "parry",
      mitigated: 0,
      frontal,
      zone: guardZone(ctx.guardDir, ctx.from, ctx.blockGeometry),
      // ⚠ Parowanie odbija cios ORĘŻEM — tarcza nic nie przyjęła, więc nie ma
      // za co płacić wysiłkiem, zużywać trwałości ani uczyć się jej noszenia.
      absorbed: 0,
    };
  }

  // ⚠ Blok w TRZECH strefach: pełny z przodu, osłabiony z boku, żaden z tyłu.
  // Nadal deterministyczny i nadal JEDNO zaokrąglenie na końcu — strefa zmienia
  // mnożnik, nie liczbę zaokrągleń i nie szansę.
  const zone = guardZone(ctx.guardDir, ctx.from, ctx.blockGeometry);
  const afterArmor = 1 - ctx.armorReduction;
  const blocked =
    zone === "front" ? ctx.blockReduction : zone === "side" ? ctx.blockReduction * ctx.blockSideMul : 0;
  // Punkty, które doszły do tarczy — czyli po pancerzu, przed nią.
  const doTarczy = ctx.amount * afterArmor;
  // ⚠⚠ **MIĘKKIE KOLANO UDŹWIGU (`T-7`, 2026-09-15).** Do tej daty tarcza
  // zdejmowała swój procent od dowolnie ciężkiego ciosu — 45% z draśnięcia
  // królika i 45% z szarży dzika kosztowało tyle samo i działało tak samo
  // dobrze. Powyżej udźwigu tarcza nadal zatrzymuje, ale już **gorzej**:
  // pełną stawkę do `blockCapacity`, potem ułamek nadwyżki.
  //
  // ⚠ Kształt jest ten sam, co w `STAMINA.heavyHit` (próg + stawka za punkt)
  // i w `EQUIPMENT_LOAD` (`effortFreeRatio` + `effortPerRatio`) — piecewise
  // z miękkim kolanem, nie urwisko. Powód też ten sam: próg twardy sprawia, że
  // cios 17,0 i 17,1 to dwa różne zdarzenia.
  // ⚠⚠ **Zapisane jako DOPŁATA do dzisiejszego wzoru, nie jako nowy wzór.**
  // `doTarczy * (1 - blocked)` zostaje dokładnie tym, czym było — łącznie
  // z ostatnim bitem — a przeciążenie dokłada do obrażeń to, czego tarcza nie
  // zdołała zatrzymać. Dzięki temu **cios mieszczący się w udźwigu daje
  // BIT W BIT tę samą liczbę, co przed `T-7`**, a uprząż regresyjna ma czego
  // pilnować. Zapis `round(doTarczy - absorbed)` byłby matematycznie równy
  // i bitowo inny — ta lekcja jest już w projekcie odrobiona (`Math.hypot`).
  const surowy = doTarczy * blocked;
  // ⚠ **Wartość niepoprawna liczbowo wyłącza KOLANO, nie psuje obrażeń.**
  // `NaN`/`undefined` w udźwigu dałoby `mitigated = NaN`, czyli cios, który nie
  // zabija i nie leczy, a HUD pokazuje pustkę — awaria cicha i całkowita, ta
  // sama klasa co framebuffer 0×0 z `B-1`. Zejście na `Infinity` odtwarza
  // dokładnie zachowanie sprzed `T-7`: tarcza zdejmuje swój procent bez sufitu.
  const cap = Number.isFinite(ctx.blockCapacity) ? Math.max(0, ctx.blockCapacity) : Infinity;
  const keep = Number.isFinite(ctx.blockOverflowKeep)
    ? Math.min(1, Math.max(0, ctx.blockOverflowKeep))
    : 1;
  const przeciazenie = Math.max(0, surowy - cap);
  const utracone = przeciazenie * (1 - keep);
  const mitigated = Math.max(1, Math.round(doTarczy * (1 - blocked) + utracone));
  return {
    outcome: blocked > 0 ? "block" : "hit",
    mitigated,
    frontal,
    zone,
    absorbed: surowy - utracone,
  };
}

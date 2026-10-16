import { STAMINA } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";

/** Trzy stany sprawności. Kolejność = rosnące zmęczenie. */
export type StaminaState = "normal" | "tired" | "exhausted";

/** Co dokładnie kosztowało — żeby przyszłe zdolności mogły reagować na RODZAJ
 *  wysiłku, a nie tylko na jego wielkość („taniej za uniki" jest innym talentem
 *  niż „taniej za ciosy"). Od 2026-10-11 rozróżnia też `sprint` od reszty:
 *  wszystko poza nim jest wysiłkiem BOJOWYM (`combatEffortAt`). */
export type EffortKind =
  | "autoAttack"
  | "dodge"
  | "ability"
  | "sprint"
  | "block"
  | "hitTaken";

/**
 * **Stamina — zasób WYSIŁKU.** Kierunek, pomiary i kalibracja:
 * `docs/systemy/stamina.md`; wszystkie liczby: `STAMINA` w `GameConfig.ts`.
 *
 * ⚠ **Najważniejszy niezmiennik całego pliku: `spend()` NIGDY NIE ODMAWIA.**
 * Nie ma tu ścieżki „nie stać cię", nie ma zwracanego `false`, nie ma bramki.
 * Zasób schodzi do zera i tam zostaje, a jedyną konsekwencją jest gorsza
 * sprawność (`state`). To nie jest wygoda implementacyjna — to jest ta
 * własność, która odróżnia zasób wysiłku od many, **i jednocześnie jedyna
 * rzecz, która trzyma Kondycję jako atrybut OPCJONALNY**: gdyby wyczerpanie
 * odcinało umiejętności, w grze bez respeca każdy build musiałby w nią
 * inwestować. Jeżeli kiedykolwiek pojawi się tu `if (this.value < cost)
 * return false`, ten system przestaje być tym, czym miał być.
 *
 * ⚠ **Singleton na poziomie modułu, jak `Progression`** — musi przeżyć obiekt
 * `Player` (śmierć, respawn, przejście portalem przebudowują scenę).
 *
 * ⚠ **Nie importuje `Progression` ani `Equipment`.** Pulę wstrzykuje
 * `Progression.emitAttributes()` przez `syncMax`, a mnożnik obciążenia podaje
 * wołający przy wydatku. Powód jest praktyczny: `Equipment` i `Progression`
 * już się nawzajem importują, a dorzucenie trzeciego wierzchołka do tego cyklu
 * to proszenie się o `undefined` przy starcie modułów.
 */
class StaminaState_ {
  /** Bieżąca wartość. Nigdy < 0 i nigdy > `max`. */
  private value: number = STAMINA.base;
  private maxValue: number = STAMINA.base;
  /** Czas sceny (ms) ostatniego INTENSYWNEGO WYSIŁKU — nie „ostatniej walki". */
  private lastEffortAt = -Infinity;
  /**
   * Czas ostatniego wysiłku BOJOWEGO — każdego poza sprintem. Czyta go bramka
   * kosztu biegu (`STAMINA.sprintCombatWindowMs`): bieg poza walką jest darmowy,
   * a „zadałem/odbiłem cios przed chwilą" to walka, nawet gdy nikt nie goni.
   */
  private lastCombatEffortAt = -Infinity;
  /** Ostatnio ogłoszone wartości, żeby dławić `staminaChanged`. */
  private announcedValue = -1;
  private announcedState: StaminaState | null = null;

  get current(): number {
    return this.value;
  }

  get max(): number {
    return this.maxValue;
  }

  /** Czas sceny ostatniego wysiłku bojowego (`-Infinity` = nigdy). */
  get combatEffortAt(): number {
    return this.lastCombatEffortAt;
  }

  get fraction(): number {
    return this.maxValue > 0 ? this.value / this.maxValue : 0;
  }

  /**
   * Stan sprawności. ⚠ Progi są BEZWZGLĘDNE — patrz komentarz przy
   * `STAMINA.tiredBelow`. Próg procentowy sprawiał, że inwestycja w Kondycję
   * podnosiła też próg i potrafiła karać.
   */
  get state(): StaminaState {
    if (this.value < STAMINA.exhaustedBelow) return "exhausted";
    if (this.value < STAMINA.tiredBelow) return "tired";
    return "normal";
  }

  /** Mnożnik tempa ataku ze stanu (<1 = wolniej). Czyta `Progression`. */
  get attackSpeedMultiplier(): number {
    return STAMINA.states[this.state].attackSpeedMul;
  }

  /** Mnożnik ODZYSKANIA po zamachu (>1 = dłużej). Czyta `Progression`. */
  get recoveryMultiplier(): number {
    return STAMINA.states[this.state].recoveryMul;
  }

  /** Etykieta stanu do UI; pusta dla `normal` (brak stanu = brak komunikatu). */
  get stateLabel(): string {
    return STAMINA.states[this.state].label;
  }

  /**
   * Przelicz pulę z Kondycji. Wołane przez `Progression.emitAttributes()`,
   * czyli przy każdej zmianie atrybutów i przy wczytaniu zapisu.
   *
   * ⚠ **Podniesienie puli DAJE zapas od razu** (tak jak awans daje HP), ale
   * obniżenie tylko przycina — nikt nie ma dziś jak obniżyć Kondycji, ale
   * przyszły respec albo przedmiot z `maxStamina` będzie miał.
   */
  syncMax(conditioning: number): void {
    const previous = this.maxValue;
    this.maxValue = STAMINA.base + conditioning * STAMINA.perConditioning;
    if (this.maxValue > previous) this.value += this.maxValue - previous;
    this.value = Math.min(this.value, this.maxValue);
    this.announce();
  }

  /**
   * Wydaj `cost` staminy. **Zawsze się udaje** — patrz niezmiennik w nagłówku.
   *
   * @param loadMultiplier mnożnik obciążenia; podaje go wołający, bo tylko
   *        unik i sprint mu podlegają (`EQUIPMENT_LOAD`).
   */
  spend(cost: number, kind: EffortKind, nowMs: number, loadMultiplier = 1): void {
    if (cost <= 0) return;
    this.value = Math.max(0, this.value - cost * loadMultiplier);
    this.lastEffortAt = nowMs;
    if (kind !== "sprint") this.lastCombatEffortAt = nowMs;
    this.announce();
  }

  /**
   * Oddaj staminę (Drugi Oddech, mikstura, przyszłe zdolności).
   *
   * ⚠ **NIE resetuje licznika odpoczynku** — odzyskanie sił nie jest wysiłkiem.
   */
  restore(amount: number): void {
    if (amount <= 0) return;
    this.value = Math.min(this.maxValue, this.value + amount);
    this.announce();
  }

  /**
   * Regeneracja. Wołana co klatkę z pętli `GameScene`.
   *
   * ⚠ **Regeneracja jest CIĄGŁA, także w trakcie walki**, i to jest świadome
   * odejście od reguły pięciu sekund, którą stosuje HP. Tamta istnieje, żeby
   * wykluczyć leczenie w walce; stamina ma cel odwrotny — ma wracać, kiedy
   * przestajesz się wysilać. Pomiar, który to rozstrzygnął: odstęp między
   * walkami na mapie lasu wynosi 3,1 s, więc pięciosekundowa blokada oznaczała
   * regenerację, która **nie startuje ani razu przez całe przejście**
   * (`docs/systemy/stamina.md`).
   *
   * ⚠ **DWA TEMPA, nie jedno z mnożnikiem** (§24a, wdrożone 2026-09-02):
   * `regenPerSecond` **przy wysiłku** (3/s) i `regenRestedPerSecond` **po
   * `restedAfterMs` bez wydatku** (4/s). „Wysiłek" to jedyne kryterium —
   * ⛔ **nie ma tu pojęcia „w walce" i nie trzeba go dorabiać**: manekin,
   * wilk i sprint kosztują tak samo i tak samo zerują licznik odpoczynku.
   *
   * @param regenMultiplier mnożnik obciążenia (Model D, `OI-103`) — **kanał
   *        WYDOLNOŚCI**. Podaje go wołający, dokładnie tak jak `loadMultiplier`
   *        przy `spend()` i z tego samego powodu: ten plik **nie importuje
   *        `Equipment` ani `Progression`** i tak ma zostać.
   *        ⭐ Ten kanał, a **nie** koszt zamachu, robi z ciężkiego wyposażenia
   *        gorszą wydolność — dzięki temu ciężki wojownik zachowuje swoje
   *        „kilka pierwszych ciosów". ⛔ Nie przenoś tej kary na `costs`.
   */
  tick(deltaMs: number, nowMs: number, regenMultiplier = 1): void {
    if (this.value >= this.maxValue) return;
    const rested = nowMs - this.lastEffortAt >= STAMINA.restedAfterMs;
    const rate = (rested ? STAMINA.regenRestedPerSecond : STAMINA.regenPerSecond) * regenMultiplier;
    this.value = Math.min(this.maxValue, this.value + (rate * deltaMs) / 1000);
    this.announce();
  }

  /** Czy postać zdążyła odpocząć (UI/debug). */
  isRested(nowMs: number): boolean {
    return nowMs - this.lastEffortAt >= STAMINA.restedAfterMs;
  }

  /**
   * Koszt PRZYJĘTEGO ciosu — krzywa, nie próg. Liczony od obrażeń PO pancerzu
   * i PO tarczy, czyli od tego, co gracz naprawdę dostał.
   *
   * ⚠ Świadomie nie binarne „ciężki / nie ciężki": próg binarny stał na
   * urwisku (kontakt Szarego zabiera 10,2 pkt przy progu 10,0, więc zmiana
   * pancerza o 2% przełączała pięć ciosów w jednej walce). Zwraca 0 dla
   * draśnięć — drobne trafienia mają NIE drenować paska.
   */
  hitCost(mitigatedDamage: number): number {
    const over = mitigatedDamage - STAMINA.heavyHit.thresholdDamage;
    if (over <= 0) return 0;
    return Math.min(over * STAMINA.heavyHit.costPerPointOver, STAMINA.heavyHit.maxCost);
  }

  /**
   * Siła impactu przyjętego ciosu (Combat v1, 2026-08-24) — wyprowadzona z
   * TEJ SAMEJ krzywej co `hitCost`, świadomie zero nowego stanu/statu:
   *
   *  - `"light"`  — poniżej progu, `hitCost` = 0. Zamach gracza leci dalej,
   *    bez żadnej reakcji. Draśnięcie ma zostać draśnięciem.
   *  - `"medium"` — w środku krzywej. Miejsce na feedback (dźwięk/tint), ale
   *    NIE kasuje `pendingSwing` — własny zamach nadal ląduje.
   *  - `"heavy"`  — `hitCost` przy suficie (`STAMINA.heavyHit.maxCost`), czyli
   *    dokładnie ciosy telegrafowane (szarża dzika, ukąszenie Szarego).
   *    Kasuje `pendingSwing` — patrz `GameScene`, ten sam mechanizm co przy
   *    Uniku/Szarży.
   */
  impactTier(mitigatedDamage: number): "light" | "medium" | "heavy" {
    const cost = this.hitCost(mitigatedDamage);
    if (cost <= 0) return "light";
    if (cost >= STAMINA.heavyHit.maxCost) return "heavy";
    return "medium";
  }

  /** Pełna pula. Nowa gra, respawn i wczytanie zapisu bez pola staminy. */
  refill(): void {
    this.value = this.maxValue;
    this.lastEffortAt = -Infinity;
    this.lastCombatEffortAt = -Infinity;
    this.announce();
  }

  /** Do zapisu. */
  snapshot(): number {
    return Math.round(this.value);
  }

  /** Z zapisu. Pole jest OPCJONALNE (stary zapis = pełna pula), więc
   *  `undefined` nie jest błędem — patrz niezmiennik zapisu w `CLAUDE.md`. */
  restoreSnapshot(saved: number | undefined): void {
    if (saved === undefined || !Number.isFinite(saved)) {
      this.refill();
      return;
    }
    this.value = Math.min(Math.max(0, saved), this.maxValue);
    this.lastEffortAt = -Infinity;
    this.lastCombatEffortAt = -Infinity;
    this.announce();
  }

  /**
   * Ogłoś zmianę — **z dławieniem**. Regeneracja rusza wartość w każdej
   * klatce, więc bez tego HUD przerysowywałby się 60 razy na sekundę przez
   * całą grę. Zmiana STANU przechodzi zawsze, bo od niej zależy komunikat.
   */
  private announce(): void {
    const st = this.state;
    if (st === this.announcedState && Math.abs(this.value - this.announcedValue) < 0.5) return;
    this.announcedValue = this.value;
    this.announcedState = st;
    GameEvents.emit(EVENT.staminaChanged, {
      stamina: this.value,
      maxStamina: this.maxValue,
      state: st,
    });
  }
}

export const Stamina = new StaminaState_();

import { ABILITIES, ABILITY_SLOTS } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Progression } from "./Progression";
import { Skills } from "./Skills";

export type AbilityId = keyof typeof ABILITIES;

export function getAbility(id: AbilityId): (typeof ABILITIES)[AbilityId] {
  return ABILITIES[id];
}

/** Texture key of the generated icon for this ability — see Assets.ts. */
export function abilityIconKey(id: AbilityId): string {
  return `ability-icon-${id}`;
}

/**
 * Active abilities: what's unlocked, and what's off cooldown.
 *
 * Deliberately holds NO game logic — it answers "may I?" and "how long left?",
 * and GameScene owns what each ability actually does. That keeps the UI able to
 * read cooldowns without reaching into the scene, the same way the buff bar
 * reads Buffs.
 *
 * ⚠ **Dwie różne rzeczy, dwa różne losy przy zapisie.** Cooldowny są
 * przejściowe i celowo NIE przeżywają wczytania — bankowanie ich pozwalałoby
 * pominąć 24-sekundowy cooldown przez wyjście i wejście. **Ale przypisanie do
 * slotów przeżywa**, bo to nie jest stan chwili, tylko decyzja gracza; siedzi
 * w zapisie jako pole opcjonalne (bez podbicia `SAVE_VERSION`). Samo
 * odblokowanie nie jest tu trzymane wcale — wynika z poziomu i z `Skills`.
 */
class AbilityState {
  /** id → scene time (ms) at which it becomes usable again. */
  private readyAt = new Map<AbilityId, number>();

  /**
   * Co leży na pasku. Indeks = slot, `null` = pusty.
   *
   * ⚠ **Umiejętności jest więcej niż slotów i to jest zamierzone** — pasek
   * mieści `ABILITY_SLOTS`, a nauczyć się można wszystkich. Wybór, co nosić,
   * jest treścią, a nie ograniczeniem do obejścia.
   */
  private slots: (AbilityId | null)[] = new Array(ABILITY_SLOTS).fill(null);

  constructor() {
    // ⚠ Jedno miejsce, które łapie KAŻDY sposób odblokowania: naukę u trenera,
    // awans na poziom i wczytanie zapisu — wszystkie trzy przechodzą przez te
    // dwa zdarzenia. Wołanie `autoSlot` z panelu trenera obsłużyłoby tylko
    // pierwszy przypadek, a gracz, który awansował, patrzyłby na pusty pasek.
    GameEvents.on(EVENT.skillsChanged, this.fillFreeSlots, this);
    GameEvents.on(EVENT.leveledUp, this.fillFreeSlots, this);
  }

  /** Dołóż na wolne sloty wszystko, co świeżo się odblokowało. Nie rusza tego,
   *  co gracz już ułożył — pełny pasek zostaje bez zmian, a nowa umiejętność
   *  czeka w panelu. */
  private fillFreeSlots(): void {
    if (!this.slots.includes(null)) return;
    for (const id of this.unlocked()) this.autoSlot(id);
  }

  /** Every ability id, in config (and therefore unlock) order. */
  all(): AbilityId[] {
    return Object.keys(ABILITIES) as AbilityId[];
  }

  /**
   * ⚠ **DWIE bramki, obie konieczne**: poziom mówi „jesteś gotowy", trener
   * mówi „ktoś ci to pokazał". Zdjęcie którejkolwiek było rozważane i
   * odrzucone — uzasadnienie przy wpisach `SKILLS` w `GameConfig.ts`.
   */
  isUnlocked(id: AbilityId): boolean {
    return Progression.level >= ABILITIES[id].unlockLevel && Skills.hasAbility(id);
  }

  /**
   * Posiadane umiejętności — **w kolejności KONFIGURACYJNEJ**, nie w kolejności
   * zdobywania. Źródło listy w panelu umiejętności; układ paska czyta
   * `slotted()`, nie to.
   *
   * ⚠ Ten komentarz mówił do 2026-08-26 „in the order they were earned" i było
   * to nieprawdą — `all().filter(...)` zachowuje porządek z `ABILITIES`.
   * Kolejność konfiguracyjna jest dla panelu WŁAŚCIWA (wiersz nie skacze między
   * sesjami ani po nauce kolejnej umiejętności), więc poprawiony jest opis,
   * nie zachowanie.
   */
  unlocked(): AbilityId[] {
    return this.all().filter((id) => this.isUnlocked(id));
  }

  /** Zawartość paska, `null` na pustym slocie. */
  slotted(): (AbilityId | null)[] {
    return this.slots.map((id) => (id && this.isUnlocked(id) ? id : null));
  }

  slotOf(id: AbilityId): number {
    return this.slots.indexOf(id);
  }

  /**
   * Połóż umiejętność na slocie. Jeśli leżała już na innym — **przenieś**, a
   * nie skopiuj: ta sama umiejętność na dwóch przyciskach to dwa przyciski
   * dzielące jeden cooldown, czyli slot wyrzucony w błoto bez ostrzeżenia.
   */
  assign(slot: number, id: AbilityId | null): boolean {
    if (slot < 0 || slot >= this.slots.length) return false;
    if (id && !this.isUnlocked(id)) return false;
    if (id) {
      const previous = this.slots.indexOf(id);
      // Zamiana miejscami, gdy cel jest zajęty — inaczej przeciągnięcie na
      // pełny slot po cichu gubiłoby to, co tam leżało.
      if (previous >= 0) this.slots[previous] = this.slots[slot];
    }
    this.slots[slot] = id;
    this.announceLoadout();
    return true;
  }

  /** Dołóż na pierwszy wolny slot — wołane, gdy gracz właśnie się nauczył.
   *  Bez tego nauka kończyłaby się „nic się nie stało", bo pasek czyta sloty. */
  autoSlot(id: AbilityId): void {
    if (!this.isUnlocked(id) || this.slots.includes(id)) return;
    const free = this.slots.indexOf(null);
    if (free >= 0) this.assign(free, id);
  }

  /** Cały układ paska — do zapisu. */
  slotSnapshot(): (AbilityId | null)[] {
    return [...this.slots];
  }

  /** Odtworzenie z zapisu. Nieznane id (usunięta umiejętność) lecą w `null`,
   *  a nie wywalają wczytywania. */
  restoreSlots(saved: readonly (string | null)[] | undefined): void {
    if (!saved) return;
    const known = new Set<string>(this.all());
    for (let i = 0; i < this.slots.length; i++) {
      const id = saved[i];
      this.slots[i] = id && known.has(id) ? (id as AbilityId) : null;
    }
    // Bez `announceLoadout`: to jest ODTWORZENIE zapisanego stanu, a nie
    // decyzja gracza. Zapisywanie tu wywolaloby zapis w trakcie wczytywania.
    GameEvents.emit(EVENT.abilitiesChanged);
  }

  /** Abilities whose unlock level falls in (fromLevel, toLevel] — used to
   *  announce what a level-up just granted. */
  unlockedBetween(fromLevel: number, toLevel: number): AbilityId[] {
    return this.all().filter(
      (id) => ABILITIES[id].unlockLevel > fromLevel && ABILITIES[id].unlockLevel <= toLevel,
    );
  }

  /** Milliseconds until `id` is usable again; 0 when ready. */
  cooldownRemaining(id: AbilityId, nowMs: number): number {
    return Math.max(0, (this.readyAt.get(id) ?? 0) - nowMs);
  }

  isReady(id: AbilityId, nowMs: number): boolean {
    return this.isUnlocked(id) && this.cooldownRemaining(id, nowMs) === 0;
  }

  /** Arm the cooldown. Called by whoever actually performed the ability, so a
   *  refused or impossible cast never burns it. */
  startCooldown(id: AbilityId, nowMs: number): void {
    this.readyAt.set(id, nowMs + ABILITIES[id].cooldown * 1000);
    GameEvents.emit(EVENT.abilitiesChanged);
  }

  /**
   * Skróć TRWAJĄCY cooldown o ułamek jego pełnej długości. Dziś jeden
   * czytelnik: Wypad zwraca `hitCooldownRefund` przy trafieniu (wzorzec Fiora
   * Q), co jest **mechanizmem odgradzającym go od zaparkowanego
   * „auto-podchodzenia do celu"** — pełny koszt za chybienie, ułamek za celne
   * wyprowadzenie. Uzasadnienie: `ABILITIES.lunge` i `docs/odlozone.md` §5.
   *
   * ⚠ **Ułamek liczy się od PEŁNEJ długości cooldownu, nie od pozostałej.**
   * Od pozostałej wynik zależałby od tego, ile trwa zamach umiejętności —
   * czyli wydłużenie animacji po cichu zmieniałoby balans zwrotu, w miejscu,
   * w którym nikt by go nie szukał.
   *
   * ⚠ **Nie potrafi cooldownu ZAŁOŻYĆ.** Wołanie na gotowej umiejętności jest
   * no-opem, a nie ustawieniem ujemnego czasu — zwrot jest nagrodą za
   * trafienie, więc nie ma prawa niczego uzbroić samodzielnie.
   */
  refundCooldown(id: AbilityId, fraction: number, nowMs: number): void {
    const readyAt = this.readyAt.get(id);
    if (readyAt === undefined || readyAt <= nowMs) return;
    const cut = ABILITIES[id].cooldown * 1000 * fraction;
    this.readyAt.set(id, Math.max(nowMs, readyAt - cut));
    GameEvents.emit(EVENT.abilitiesChanged);
  }

  /**
   * Clear every cooldown — on death/respawn and when a run starts.
   *
   * ⚠ **Sloty zostają.** Cooldowny są związane z czasem sceny, więc muszą
   * zniknąć przy każdym `create()` (także po przejściu portalem); układ paska
   * jest decyzją gracza i przeżycie restartu sceny to dokładnie to, czego się
   * po nim spodziewa. Czyszczenie slotów należy do `resetLoadout()`.
   */
  reset(): void {
    this.readyAt.clear();
    GameEvents.emit(EVENT.abilitiesChanged);
  }

  /** Nowa gra: zapomnij też układ paska. */
  resetLoadout(): void {
    this.slots.fill(null);
    this.readyAt.clear();
    GameEvents.emit(EVENT.abilitiesChanged);
  }

  /** Uklad paska sie zmienil z woli gracza — patrz `EVENT.abilityLoadoutChanged`. */
  private announceLoadout(): void {
    GameEvents.emit(EVENT.abilitiesChanged);
    GameEvents.emit(EVENT.abilityLoadoutChanged);
  }
}

export const Abilities = new AbilityState();

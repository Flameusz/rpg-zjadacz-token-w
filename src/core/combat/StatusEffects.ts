/**
 * **WARSTWA EFEKTÓW — jedna księgowość dla wszystkiego, co trwa w czasie.**
 *
 * Wprowadzona 2026-09-03 (D3 audytu `docs/audyt_projektowy_fundamentow_2026-09-03.md`).
 * Do tej daty każdy efekt był **osobnym prywatnym polem na `Player`** (`venom`,
 * `slow`, `damageBuff`, `foodHeal`), z własnym licznikiem, własnym sprzątaniem
 * i własną kopią tej samej arytmetyki czasu. Wróg **nie mógł nosić żadnego
 * efektu**, bo nie było gdzie go trzymać.
 *
 * ── Podział odpowiedzialności — to jest cała treść tego pliku ──────────────
 * ```
 * TA WARSTWA (czysta)     ile jeszcze trwa · ile stosów · kiedy tik · kiedy koniec
 * HOST (Player/Enemy)     CO efekt robi — obrażenia, spowolnienie, leczenie
 * ```
 * ⚠ **Warstwa NIE INTERPRETUJE `payload`.** „2 obrażenia na stos" i „ruch ×0,55"
 * to liczby należące do efektu, nie do księgowości — host czyta je sam. Dzięki
 * temu nowy efekt nie wymaga ani jednej linijki tutaj.
 *
 * ⚠ **Plik jest CZYSTY — żaden Phaser, żadna encja, żaden `GameEvents`** i jest
 * to egzekwowane przez strażnika w `tools/combat_regresja.mjs`. Stąd bierze się
 * jedyny powód, dla którego `tools/effects_weryfikacja.mjs` cokolwiek dowodzi.
 *
 * ⚠ **Czas wchodzi jako `deltaMs`, nie jako „teraz"** — ta sama decyzja co
 * w `Stamina.tick`. Warstwa nie ma prawa znać zegara sceny; dzięki temu test
 * przewija czas bez podmieniania czegokolwiek.
 *
 * ⛔ **Nie ma tu ani jednego konkretnego efektu.** Jad, spowolnienie i buff
 * obrażeń są DANYMI budowanymi przez hosta z `GameConfig` — patrz `Player`.
 */

/** Kto nałożył efekt. Dziś nikt tego nie czyta poza `dispelFrom` — istnieje,
 *  bo atrybucja („czyj DoT zabił") jest pytaniem, które przychodzi później,
 *  a doklejenie jej do żywych efektów jest wtedy zmianą każdego wołającego. */
export interface EffectSource {
  /** Skąd przyszedł — `"enemy"`, `"player"`, `"world"`, `"item"`. */
  readonly kind: string;
  /** Identyfikator konkretnego sprawcy, jeśli jest znany. */
  readonly id?: string;
}

/** Sprawca nieznany albo nieistotny — cztery efekty NOSZONE PRZEZ GRACZA (jad,
 *  sieć, Okrzyk, posiłek) nie podają go do dziś. Pierwszym i jedynym, który
 *  podaje, jest Krwawienie z `Rozcięcia` (`{ kind: "player" }`, 2026-09-04). */
export const UNKNOWN_SOURCE: EffectSource = { kind: "world" };

/**
 * Co składa się na efekt. **Wartość, nie klasa** — host buduje ją z configu
 * w chwili nałożenia.
 */
export interface EffectSpec {
  /** Klucz TOŻSAMOŚCI: dwa nałożenia z tym samym `id` to ten sam efekt. */
  readonly id: string;
  readonly name: string;
  readonly iconKey: string;
  readonly durationMs: number;
  /** Odstęp między tikami. Brak = efekt bez tików (czysty modyfikator). */
  readonly tickMs?: number;
  /** Sufit stosów; brak = 1. */
  readonly maxStacks?: number;
  /** Czy to jest coś złego — wyłącznie do prezentacji na pasku. */
  readonly debuff?: boolean;
  /** Czy `dispel()` ma prawo go zdjąć. Brak = tak. */
  readonly dispellable?: boolean;
  /**
   * Kategorie efektu — „slow", „poison", „buff". Warstwa używa ich wyłącznie
   * do wyszukiwania (`withTag`) i selektywnego rozproszenia; **nie nadaje im
   * znaczenia**. Dzięki temu host nie musi znać identyfikatora efektu, którego
   * szuka (spowolnienie przychodzi dziś z `buffId` pocisku).
   */
  readonly tags?: readonly string[];
  /** WARTOŚCI POCZĄTKOWE liczb tego efektu — kopiowane do `data` przy nałożeniu. */
  readonly payload?: Readonly<Record<string, number>>;
  /**
   * Opis dla paska efektów. ⚠ **Warstwa NIGDY tego nie woła** — to host
   * odpytuje go, budując prezentację. Stoi w specyfikacji, żeby wiedza o jednym
   * efekcie (nazwa, ikona, liczby, opis) mieszkała w jednym miejscu.
   */
  readonly detail?: (effect: ActiveEffect) => string;
}

/** Żywy efekt: specyfikacja + jego bieżąca księgowość. */
export interface ActiveEffect {
  readonly spec: EffectSpec;
  readonly source: EffectSource;
  stacks: number;
  remainingMs: number;
  /** Ile ms minęło od ostatniego tiku. ⚠ **Przeżywa odświeżenie** — patrz `apply`. */
  sinceTickMs: number;
  /**
   * **Żywe liczby efektu**, zainicjowane kopią `spec.payload`.
   *
   * ⚠ Osobne od `payload`, bo część efektów **zużywa się**: posiłek ma „ile HP
   * zostało do oddania", przyszła tarcza pochłaniająca będzie miała „ile
   * jeszcze pochłonie". Warstwa tych liczb **nie interpretuje** — pilnuje
   * wyłącznie, żeby ginęły razem z efektem.
   */
  data: Record<string, number>;
}

/**
 * Co warstwa musi móc zapytać hosta. **Minimum, nie „interfejs walczącego"**.
 *
 * ⭐ **Zapowiedź z 2026-09-03 („`Player` dziś, `Enemy` jutro bez zmiany ani
 * jednej linijki tutaj") SPRAWDZIŁA SIĘ 2026-09-04** — `Enemy` dołączył jako
 * drugi nosiciel razem z Krwawieniem z `Rozcięcia` i **ten plik nie dostał ani
 * jednej linijki kodu**. To jest jedyny dowód, jaki „minimum zamiast interfejsu
 * walczącego" mogło dostać, i powód, dla którego nie wolno tu dokładać metod
 * „bo się przydadzą": drugi host potrzebował dokładnie tych czterech.
 */
export interface EffectHost {
  /** Efekt wykonał tik (tylko gdy `spec.tickMs` istnieje). */
  onEffectTick(effect: ActiveEffect): void;
  /**
   * Stan efektów się zmienił — nałożony, odświeżony, przybył stos, wygasł,
   * zdjęty. Host odświeża prezentację; warstwa nie wie, że pasek istnieje.
   */
  onEffectsChanged(): void;
  /**
   * Odporność / niewrażliwość. Brak metody = nic nie jest odporne.
   * ⛔ **Zaczep, nie mechanika** — dziś nikt tego nie implementuje i żadna
   * liczba odporności w grze nie istnieje.
   */
  isImmuneTo?(spec: EffectSpec, source: EffectSource): boolean;
  /**
   * Czy efekt ma teraz STAĆ (nie odliczać i nie tikać). Brak = nigdy.
   * Istnieje, bo posiłek gracza czeka w walce zamiast się marnować — reguła
   * należy do hosta, bo tylko on wie, co znaczy „w walce".
   */
  isEffectPaused?(effect: ActiveEffect): boolean;
}

/**
 * **Zbiór efektów jednej encji.** Jedna instancja per nosiciel — ⛔ nigdy
 * singleton modułu, bo drugi nosiciel to normalny przypadek, nie wyjątek.
 */
export class EffectSet {
  private readonly effects = new Map<string, ActiveEffect>();

  constructor(private readonly host: EffectHost) {}

  /**
   * Nałóż albo odśwież efekt. Zwraca żywy efekt, albo `null`, gdy odrzucony
   * (zerowy czas, odporność).
   *
   * ⚠ **Odświeżenie NIE ZERUJE zegara tików** — `sinceTickMs` przeżywa, tak
   * jak przeżywał w dawnym `applyVenom` (`nextTickAt: this.venom?.nextTickAt ??
   * …`). Zerowanie sprawiłoby, że dokładanie stosów **odracza obrażenia**,
   * czyli szybsze trucie truje wolniej.
   */
  apply(spec: EffectSpec, source: EffectSource = UNKNOWN_SOURCE): ActiveEffect | null {
    if (spec.durationMs <= 0) return null;
    if (this.host.isImmuneTo?.(spec, source)) return null;

    const sufit = spec.maxStacks ?? 1;
    const istniejacy = this.effects.get(spec.id);
    const efekt: ActiveEffect = {
      spec,
      source,
      stacks: Math.min((istniejacy?.stacks ?? 0) + 1, sufit),
      remainingMs: spec.durationMs,
      sinceTickMs: istniejacy?.sinceTickMs ?? 0,
      // ⚠ Żywe liczby są ZASTĘPOWANE, nie sumowane: zjedzenie drugiego posiłku
      // zastępuje niedokończony, a nie dokłada do niego. To jest przeniesiona
      // reguła, nie nowa (`Player.startHealOverTime`).
      data: { ...spec.payload },
    };
    this.effects.set(spec.id, efekt);
    this.host.onEffectsChanged();
    return efekt;
  }

  /**
   * Przewiń czas. **Kolejność jest treścią:** najpierw wygaśnięcie, potem tik —
   * dokładnie tak, jak robił to dawny `updateVenom`, gdzie tik lądujący równo
   * z końcem trwania **nie padał**.
   */
  tick(deltaMs: number): void {
    if (deltaMs <= 0 || this.effects.size === 0) return;
    let zmiana = false;
    // Kopia listy: `onEffectTick` może zabić nosiciela i wyczyścić zbiór.
    for (const efekt of [...this.effects.values()]) {
      if (this.effects.get(efekt.spec.id) !== efekt) continue;
      if (this.host.isEffectPaused?.(efekt)) continue;

      efekt.remainingMs -= deltaMs;
      if (efekt.remainingMs <= 0) {
        this.effects.delete(efekt.spec.id);
        zmiana = true;
        continue;
      }
      const tickMs = efekt.spec.tickMs;
      if (tickMs === undefined || tickMs <= 0) continue;
      efekt.sinceTickMs += deltaMs;
      // `while`, nie `if`: przy zacięciu klatki delta potrafi objąć dwa tiki,
      // a zgubiony tik jest zgubionymi obrażeniami.
      while (efekt.sinceTickMs >= tickMs) {
        efekt.sinceTickMs -= tickMs;
        this.host.onEffectTick(efekt);
      }
    }
    if (zmiana) this.host.onEffectsChanged();
  }

  get(id: string): ActiveEffect | undefined {
    return this.effects.get(id);
  }

  has(id: string): boolean {
    return this.effects.has(id);
  }

  /** Liczba stosów, albo 0 gdy efektu nie ma — skrót do najczęstszego odczytu. */
  stacksOf(id: string): number {
    return this.effects.get(id)?.stacks ?? 0;
  }

  /** Jedna ŻYWA liczba efektu, albo `fallback`. Host nie sprawdza obecności. */
  dataOf(id: string, key: string, fallback = 0): number {
    return this.effects.get(id)?.data[key] ?? fallback;
  }

  /** Pierwszy efekt z tą kategorią — dla hosta, który nie zna identyfikatora
   *  (spowolnienie przychodzi z `buffId` pocisku, nie ze stałej). */
  firstWithTag(tag: string): ActiveEffect | undefined {
    for (const e of this.effects.values()) {
      if (e.spec.tags?.includes(tag)) return e;
    }
    return undefined;
  }

  list(): readonly ActiveEffect[] {
    return [...this.effects.values()];
  }

  /**
   * Wgraj gotowe efekty (przejście portalem — patrz `Player.captureCondition`).
   * ⚠ Bez ogłoszenia: woła to host w chwili, w której i tak odbudowuje pasek.
   */
  restore(effects: readonly ActiveEffect[]): void {
    this.effects.clear();
    for (const e of effects) this.effects.set(e.spec.id, e);
  }

  /** Zdejmij konkretny efekt — także niedyspelowalny (to jest sprzątanie hosta,
   *  nie mechanika rozpraszania; ta jest niżej). */
  remove(id: string): boolean {
    if (!this.effects.delete(id)) return false;
    this.host.onEffectsChanged();
    return true;
  }

  /**
   * **Rozprosz** — zdejmuje wyłącznie to, co `dispellable`.
   * ⛔ Zaczep dla przyszłej mechaniki; dziś nikt tego nie woła.
   */
  dispel(predicate: (e: ActiveEffect) => boolean = () => true): number {
    let zdjete = 0;
    for (const e of [...this.effects.values()]) {
      if (e.spec.dispellable === false) continue;
      if (!predicate(e)) continue;
      this.effects.delete(e.spec.id);
      zdjete++;
    }
    if (zdjete > 0) this.host.onEffectsChanged();
    return zdjete;
  }

  /** Wszystko naraz — śmierć, odrodzenie, nowa gra. Bez ogłoszenia, bo woła to
   *  host w chwili, w której i tak przebudowuje prezentację. */
  clear(): void {
    this.effects.clear();
  }
}

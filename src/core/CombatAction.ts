/**
 * Akcja bojowa jako DANE + maszyna, która ją odgrywa.
 *
 * Faza 2 Combat v2 (`docs/systemy/combat.md`).
 *
 * ── Po co to powstaje ────────────────────────────────────────────────────
 * Projekt ma **sześć kopii** tej samej maszyny `windup → active → recovery`:
 * `Boar`, `GreyWolf`, `Rabbit`, `Spider`, `VenomSpider`, `Wolf`. Każda osobno
 * pamięta o zerowaniu fazy w `onLoseAggro`, o blokadzie w `canDeaggro`, o
 * obsłudze `interrupt`, o zgaszeniu tintu przy wyjściu i o tym, że cooldown
 * biegnie od ROZSTRZYGNIĘCIA, nie od końca fazy. Siódma kopia (niedźwiedź) była
 * gotowa do napisania — i to jest moment, w którym recenzja kazała przerwać.
 *
 * ── ⚠ Dlaczego w `core/`, a nie w `entities/` ────────────────────────────
 * Audyt zapowiadał `entities/ActionRunner.ts`. Wylądowało w `core/`, bo **to
 * musi być czyste**: bez Phasera, bez sceny, bez encji. Tylko wtedy da się to
 * uruchomić w Node i porównać ze starą maszyną stanów — a bez takiego
 * porównania „migracja bez zmiany zachowania" jest twierdzeniem, nie faktem.
 * Strażnik czystości w `tools/combat_regresja.mjs` pilnuje tego pliku.
 *
 * Konsekwencja podziału: **runner mówi, CO się właśnie stało; encja robi z tym
 * cokolwiek Phaserowego** — ustawia prędkość, tint, gra dźwięk, rozstrzyga
 * trafienie. Runner nie zna żadnej z tych rzeczy.
 */

import type { DamageType } from "./Equipment";

/**
 * Faza akcji.
 *
 * ⚠ `active` bywa **jednoklatkowe** (`activeMs: 0`) i to jest normalny, a nie
 * zdegenerowany przypadek: kęs skoczka, Szarego i królika rozstrzyga się w
 * jednym momencie. Okno o niezerowej długości potrzebne jest dopiero wypadowi
 * wilka i szarży dzika, które przelatują przez przestrzeń.
 */
export type ActionPhase = "idle" | "windup" | "active" | "recovery";

/** Opis jednego ataku. Wyłącznie dane — żadnych funkcji, żeby dało się to
 *  kiedyś przesłać przez sieć albo odtworzyć z zapisu. */
export interface CombatAction {
  readonly id: string;
  /** Zapowiedź. 0 = brak telegrafu (wypad wilka jest taki celowo). */
  readonly windupMs: number;
  /** Okno rozstrzygania. 0 = jeden moment. */
  readonly activeMs: number;
  /** Bezbronna pauza po ciosie — okno na kontrę. */
  readonly recoveryMs: number;
  /**
   * ⚠ **Liczony od chwili, w której akcja SIĘ ROZSTRZYGA — czyli od WYJŚCIA
   * z `active`, nie od jego początku i nie od końca `recovery`.**
   *
   * Dla ciosu natychmiastowego (`activeMs: 0`) wejście i wyjście to ta sama
   * klatka, więc nie ma różnicy. Dla ataku LECĄCEGO przez przestrzeń różnica
   * wynosi całą długość lotu.
   *
   * ⚠ Pierwsza wersja runnera kotwiczyła to w WEJŚCIU w `active` — i to była
   * regresja zgłoszona z rozgrywki („dzik non stop używa skilla"). Szarża i
   * wypad wilka liczyły przerwę od KOŃCA lotu (`enterRecover` w obu starych
   * klasach), więc kotwica na początku skracała ją dzikowi nawet o 420 ms.
   * Zmierzony efekt: udział czasu spędzonego w akcji wzrósł z ~76% do ~88%.
   *
   * Przerwanie zamachu obuchem **nie skraca** przerwy: obuch ma kupować cały
   * cios, a nie go odraczać.
   */
  readonly cooldownMs: number;
  /** Czy obuch kasuje ten atak w fazie `windup`. */
  readonly interruptible: boolean;
  /**
   * Czy w jednym oknie `active` cel może oberwać tylko raz.
   *
   * ⚠ Bez tego wypad trwający 380 ms trafiłby **23 razy** przy 60 fps. Dzik
   * miał na to prywatne pole `lungeHit`; tutaj jest to własność akcji.
   */
  readonly oncePerActive: boolean;
  readonly damageMin: number;
  readonly damageMax: number;
  /** `null` = świadomie bez typu, jak w `EnemyConfig.touchDamageType`. */
  readonly damageType: DamageType | null;
  /** Tint zapowiedzi albo brak. Runner go nie zapala — tylko niesie. */
  readonly telegraphTint?: number;
  /**
   * Czy ta akcja STERUJE ciałem stworzenia na czas swojego przebiegu.
   *
   * ⚠ **To jest WYŁĄCZNIE własność ciała — nie decyzja o feedbacku.** Do
   * 2026-08-23 znaczyło jedno i drugie naraz („akcja rusza ciałem" ORAZ „ta
   * akcja nie dostaje kopnięcia od trafienia") i **`spider_web` pokazał, że to
   * dwie różne rzeczy**: sieciarz strzela stojąc (`ownsBody: false`), a mimo
   * to trafienie POCISKU nie ma prawa szarpnąć strzelcem sekundę później.
   * Decyzja o kopnięciu mieszka teraz w `attackerRecoil` i **nie jest z tego
   * pola wyprowadzana** — `effectsFor` już go nie czyta.
   *
   * ⚠ **Runner tego NIE UŻYWA — tylko niesie**, dokładnie jak `telegraphTint`.
   * Pole odpowiada na jedno pytanie: czy przez cały przebieg ciałem steruje ta
   * akcja (szarża dzika i wypad wilka piszą prędkość co klatkę przez cały
   * `active`, Szary odskakuje natychmiast po rozstrzygnięciu —
   * `enterBackstep`).
   *
   * ⚠ **Dwa niezależne systemy ruszające tym samym ciałem w tej samej klatce
   * to znany, zmierzony błąd tego projektu** — `knockedBackUntil` powstało
   * dokładnie dlatego, że AI nadpisywała impuls odrzutu i z 160 px/s
   * zostawało realne 31 px. Stąd **niezmiennik wiążący oba pola**:
   * `ownsBody === true` ⇒ `attackerRecoil === "none"`. Odwrotna implikacja NIE
   * zachodzi i to jest cały sens rozdzielenia — akcja może nie ruszać ciałem
   * i mimo to świadomie nie chcieć kopnięcia. Pilnuje tego §M2
   * w `tools/combat_regresja.mjs`.
   *
   * ⚠ **Wymagane, nie opcjonalne.** Nowa akcja ma dostać od kompilatora
   * pytanie „czy to się rusza", bo domyślne `false` przy szarży byłoby
   * usterką, której nikt nie zobaczy na oczy — dwa przesunięcia naraz czytają
   * się jak szarpnięcie kamery, nie jak błąd.
   */
  readonly ownsBody: boolean;
  /**
   * Czy trafienie tą akcją kopie NAPASTNIKIEM — jawna decyzja, nie wniosek.
   *
   * ⚠ **Osobne pole, bo `ownsBody` nie potrafi znieść obu znaczeń naraz.**
   * Patrz `spider_web`: ciała nie rusza, więc `ownsBody: false`, ale
   * `attackerRecoil: "none"`, bo między wypuszczeniem pocisku a jego
   * trafieniem mija czas i dystans. Kopnięcie w chwili trafienia szarpnęłoby
   * pająkiem za coś, czego jego ciało nie zrobiło.
   *
   * ⚠ **`"onHit"` to KOTWICA CZASOWA, nie ozdobnik.** Gdyby sieciarz miał
   * kiedyś dostać odrzut od samego wystrzału, jest to INNY moment (wypuszczenie
   * pocisku) i należy mu się WŁASNA wartość (`"onRelease"`), a nie
   * przepisanie tej. Dwuwartościowy typ nazwany po momencie zostawia na to
   * miejsce; typ `boolean` kazałby zgadywać, o który moment chodzi.
   */
  readonly attackerRecoil: AttackerRecoil;
  /**
   * Czy ta akcja WYPYCHA napastnika do przodu w chwili ciosu — gest ataku.
   *
   * ⚠ **TRZECIE niezależne pole o ruchu, i powód jest ten sam, który kazał
   * rozdzielić dwa pierwsze.** Kuszące jest wyprowadzenie tego z
   * `attackerRecoil === "onHit"` — dziś ten warunek wybrałby dokładnie
   * właściwy zbiór akcji. Byłoby to jednak POWTÓRZENIE błędu, który ten plik
   * opisuje kilka linii wyżej: `ownsBody` też „dziś wybierało właściwy zbiór",
   * dopóki `spider_web` nie pokazał, że odpowiada na inne pytanie.
   *
   * Te dwa pola pytają o co innego:
   *  - `attackerRecoil` — czy TRAFIENIE odrzuca mnie do TYŁU („uderzyłem
   *    w coś twardego"), rozstrzygane po wyniku;
   *  - `attackerLunge` — czy ATAK wypycha mnie do PRZODU („rzucam się"),
   *    niezależnie od tego, czy trafił.
   *
   * Stąd kluczowa różnica w momencie: wypad gra **także przy pudle**, bo
   * dokładnie tam jest najbardziej potrzebny — to on odróżnia „uskoczyłem"
   * od „ono w ogóle nie zaatakowało". To ta sama potrzeba, dla której powstał
   * świst w Fazie 5A, tyle że w kanale ciała zamiast dźwięku.
   *
   * ⚠ **Powstaje po to, żeby atak w ogóle był WIDOCZNY.** Żaden przeciwnik
   * w tej grze nie ma klatek animacji ataku (patrz nagłówek `Enemy.ts`) —
   * kęs królika to dziś zmiana tintu i liczba obrażeń. Wypad daje ciosowi
   * gest, nie dokładając ani jednej klatki grafiki.
   *
   * ⚠ **Niezmiennik, ten sam co przy `attackerRecoil`:**
   * `ownsBody === true` ⇒ `attackerLunge === "none"`. Akcja, która i tak
   * prowadzi ciało przez przestrzeń (szarża, wypad wilka), nie ma prawa
   * dostać drugiego, konkurencyjnego przesunięcia w tej samej klatce.
   * Odwrotna implikacja NIE zachodzi: `spider_web` ciałem nie steruje i mimo
   * to nie wypada, bo strzela z dystansu. Pilnuje tego §M2.
   *
   * ⚠ **Wymagane, nie opcjonalne** — z tego samego powodu co oba pola wyżej:
   * „ta akcja świadomie nie wypada" i „ktoś nie pomyślał" nie mogą wyglądać
   * w źródle identycznie.
   */
  readonly attackerLunge: AttackerLunge;
}

/**
 * Kiedy akcja wypycha SWOJEGO napastnika do przodu.
 *
 * - `"none"` — nigdy. Albo ciałem steruje sama akcja (`ownsBody`), albo cios
 *   pada z dala od napastnika (pocisk).
 * - `"onAttack"` — w chwili rozstrzygnięcia, w stronę celu, **niezależnie od
 *   wyniku**. Wychodzi i wraca; netto zero.
 *
 * ⚠ **Nazwa wartości mówi o MOMENCIE**, tak samo jak w `AttackerRecoil`.
 * Wypad zaczynający się już na starcie zapowiedzi to inna wartość
 * (`"onWindup"`), nie przestawienie tej — telegraf i cios to dwa różne
 * wydarzenia i gracz ma je odróżniać.
 */
export type AttackerLunge = "none" | "onAttack";

/**
 * Kiedy akcja kopie SWOIM napastnikiem.
 *
 * - `"none"` — nigdy. Albo ciałem steruje sama akcja (`ownsBody`), albo
 *   trafienie zachodzi z dala od napastnika (pocisk).
 * - `"onHit"` — w chwili rozstrzygnięcia trafienia, przeciwnie do kierunku
 *   ciosu. Jedyna wartość, którą dziś produkuje `effectsFor`.
 *
 * ⚠ **Nazwa wartości mówi o MOMENCIE.** Przyszły odrzut od wystrzału to nowa
 * wartość (`"onRelease"`) i nowa gałąź w wykonaniu, nigdy „to samo, tylko
 * wcześniej".
 */
export type AttackerRecoil = "none" | "onHit";

/** Zmiana fazy, którą encja ma obsłużyć. */
export interface ActionTransition {
  readonly from: ActionPhase;
  readonly to: ActionPhase;
  readonly action: CombatAction;
}

/**
 * Maszyna odgrywająca akcje. Jedna instancja na stworzenie.
 *
 * ⚠ **Nie decyduje, KIEDY atakować** — to jest rola AI (`updateChase`), która
 * woła `request()`. Runner odpowiada wyłącznie za to, czy wolno, i za przebieg.
 * Rozdzielenie „chcę zaatakować" od „atak trwa" jest całym sensem tego pliku:
 * dziś każda podklasa miesza jedno z drugim w tym samym `switch`.
 */
export class ActionRunner {
  private state: ActionPhase = "idle";
  private action: CombatAction | null = null;
  private until = 0;
  /** Kiedy dana akcja będzie znów gotowa. Osobno per akcja, bo dzik ma dwie o
   *  niezależnych cooldownach (szarża i kieł). */
  private readonly readyAt = new Map<string, number>();
  /**
   * Cooldown TEJ konkretnej próby, jeśli wołający go nadpisał.
   *
   * ⚠ Istnieje, bo przerwa między ciosami bywa własnością **stanu stworzenia,
   * nie akcji**: sieciarz dorzuca losowy jitter (`cooldownJitterMs`), a Szary w
   * szale skraca przerwę mnożnikiem. Wpisanie tego do `CombatAction` byłoby
   * błędem dwa razy: akcja przestałaby być stałą daną, a runner musiałby losować
   * — czyli przestałby być czysty i deterministyczny.
   */
  private cooldownTejProby = 0;

  get phase(): ActionPhase {
    return this.state;
  }

  get current(): CombatAction | null {
    return this.action;
  }

  /** Czy trwa cokolwiek — AI ma wtedy oddać sterowanie ruchem runnerowi. */
  get busy(): boolean {
    return this.state !== "idle";
  }

  isReady(action: CombatAction, nowMs: number): boolean {
    return nowMs >= (this.readyAt.get(action.id) ?? 0);
  }

  /** Ile ms zostało do gotowości akcji; 0, gdy już gotowa.
   *  Potrzebne, gdy JEDNA akcja ma zależeć od stanu DRUGIEJ — dzik nie bodzie,
   *  jeśli szarża zaraz wstanie. */
  msUntilReady(action: CombatAction, nowMs: number): number {
    return Math.max(0, (this.readyAt.get(action.id) ?? 0) - nowMs);
  }

  /**
   * Spróbuj rozpocząć akcję. Zwraca przejście, jeśli ruszyła, albo `null`.
   *
   * ⚠ Odrzuca cicho, gdy trwa inna akcja albo cooldown nie minął. **AI nie musi
   * tego pamiętać** — dziś każda z sześciu podklas sprawdza to sama, własnym
   * polem `nextXAt`, i każda może o tym zapomnieć osobno.
   */
  request(
    action: CombatAction,
    nowMs: number,
    cooldownMs: number = action.cooldownMs,
  ): ActionTransition | null {
    if (this.state !== "idle") return null;
    if (!this.isReady(action, nowMs)) return null;
    this.action = action;
    this.cooldownTejProby = cooldownMs;
    // Zerowy windup wchodzi wprost w `active` — inaczej maszyna zatrzymałaby
    // się na fazie o długości 0 i rozstrzygnięcie spóźniłoby się o klatkę.
    if (action.windupMs > 0) {
      this.state = "windup";
      this.until = nowMs + action.windupMs;
      return { from: "idle", to: "windup", action };
    }
    return this.wejdzWAktywna(nowMs, "idle");
  }

  /**
   * Posuń maszynę. Zwraca WSZYSTKIE przejścia z tego tiku — zwykle zero albo
   * jedno, ale akcja z zerowym `activeMs` przechodzi `active → recovery` w tej
   * samej klatce i encja musi zobaczyć oba.
   */
  tick(nowMs: number): ActionTransition[] {
    const przejscia: ActionTransition[] = [];
    // Pętla, nie `if`: faza o zerowej długości musi się domknąć od razu.
    // Ogranicznik jest zabezpieczeniem przed konfiguracją, w której wszystkie
    // czasy są zerowe — bez niego byłaby to pętla nieskończona w klatce gry.
    for (let i = 0; i < 4 && this.action && this.state !== "idle"; i++) {
      if (nowMs < this.until) break;
      const a = this.action;
      if (this.state === "windup") {
        przejscia.push(this.wejdzWAktywna(nowMs, "windup"));
      } else if (this.state === "active") {
        this.zakonczAktywna(nowMs);
        przejscia.push({ from: "active", to: "recovery", action: a });
      } else {
        this.state = "idle";
        this.action = null;
        przejscia.push({ from: "recovery", to: "idle", action: a });
      }
    }
    return przejscia;
  }

  /**
   * Obuch kasuje zamach.
   *
   * ⚠ **Tylko w `windup`, i cooldown i tak biegnie.** Obie reguły są wspólne
   * dla wszystkich stworzeń, które to dziś mają, i obie były przepisywane
   * osobno w każdej podklasie.
   */
  interrupt(nowMs: number): ActionTransition | null {
    const a = this.action;
    if (!a || this.state !== "windup" || !a.interruptible) return null;
    this.readyAt.set(a.id, nowMs + this.cooldownTejProby);
    this.state = "recovery";
    this.until = nowMs + a.recoveryMs;
    return { from: "windup", to: "recovery", action: a };
  }

  /**
   * Zakończ okno `active` WCZEŚNIEJ, niż wynikałoby z `activeMs`.
   *
   * ⚠ Potrzebne akcjom, które **przelatują przez przestrzeń**: wypad wilka
   * kończy się, gdy dojedzie na `lungeStopGap` albo uderzy w teren, a szarża
   * dzika — gdy trafi. Dla nich `activeMs` jest LIMITEM, nie długością.
   *
   * ⚠ Zamyka też okno `oncePerActive` bez osobnego pola: skoro `active` się
   * skończyło, nie ma w czym trafić drugi raz. Dzik miał na to prywatne
   * `lungeHit`.
   */
  endActive(nowMs: number): ActionTransition | null {
    const a = this.action;
    if (!a || this.state !== "active") return null;
    this.zakonczAktywna(nowMs);
    return { from: "active", to: "recovery", action: a };
  }

  /**
   * **Skasuj akcję z DOWOLNEJ fazy — twardszy stop niż `interrupt()`.**
   *
   * ⚠ **To NIE jest `interrupt()` i nie wolno tego zlać**, dokładnie z tego
   * samego powodu, dla którego `interrupt()` i `stagger()` są dwoma
   * pojęciami. Przerwanie kasuje **zamach** (tylko `windup`, tylko przy
   * `interruptible`) i schodzi w `recovery`, bo cios się nie odbył, ale
   * stworzenie zostaje na nogach. Kasowanie znosi **całą akcję** i wraca do
   * `idle`: ono ma opisywać sytuację, w której stworzenie przestaje cokolwiek
   * robić, także w połowie lotu.
   *
   * ── ⚠ PO CO TO ISTNIEJE: `stagger` NIE ZATRZYMUJE TEJ MASZYNY ────────────
   * `Enemy.updateAI` pomija `updateChase`, dopóki trwa `knockedBackUntil`, a
   * każde `tick()` siedzi **wewnątrz** `updateChase`. Terminy runnera są
   * **bezwzględne**, więc zawieszenie stworzenia nie pauzuje jego akcji —
   * mijają w tle, a pierwszy tik po oknie odpala zaległe przejścia naraz.
   *
   * Zmierzone (`tools/combat_regresja.mjs` §T5, delta R1): akcja
   * z 560-milisekundowym telegrafem, zawieszona w t=0 i odpytana dopiero
   * w t=1000, **wchodzi w `active` w tej samej klatce, w której zawieszenie
   * mija** — czyli dzik bodzie bez telegrafu. Przy zachwianiu młota (50 ms)
   * jest to niewidoczne; przy ogłuszeniu to pierwsze zgłoszenie z playtestu.
   *
   * ⚠ **Dlatego ogłuszenie KASUJE akcję, a runner NIE dostaje pauzy.** Pauza
   * uczyniłaby oś czasu warunkową i unieważniła
   * `tools/action_runner_weryfikacja.mjs`, czyli jedyne narzędzie, którym da
   * się cokolwiek o tej maszynie udowodnić. Pełne uzasadnienie:
   * `docs/systemy/abilities.md` R1.
   *
   * ⚠ **Cooldown akcji BIEGNIE** — ta sama reguła co przy `interrupt()`:
   * kontrola ma kupować cały cios, a nie odraczać go. Bez tego ogłuszenie
   * dawałoby stworzeniu atak „za darmo" zaraz po wstaniu.
   */
  cancel(nowMs: number): ActionTransition | null {
    const a = this.action;
    if (!a || this.state === "idle") return null;
    const from = this.state;
    this.readyAt.set(a.id, nowMs + this.cooldownTejProby);
    this.state = "idle";
    this.action = null;
    this.until = 0;
    return { from, to: "idle", action: a };
  }

  /** Wyjście z `active` — jedyne miejsce, w którym startuje cooldown akcji,
   *  która faktycznie doszła do rozstrzygnięcia. */
  private zakonczAktywna(nowMs: number): void {
    const a = this.action as CombatAction;
    this.readyAt.set(a.id, nowMs + this.cooldownTejProby);
    this.state = "recovery";
    this.until = nowMs + a.recoveryMs;
  }

  /** Zerwane agro, śmierć, portal. Cooldowny ZOSTAJĄ — stworzenie, które
   *  właśnie ugryzło, nie ma prawa ugryźć ponownie tylko dlatego, że gracz
   *  wyszedł i wrócił. */
  reset(): void {
    this.state = "idle";
    this.action = null;
    this.until = 0;
  }

  private wejdzWAktywna(nowMs: number, from: ActionPhase): ActionTransition {
    const a = this.action as CombatAction;
    // ⚠ Cooldown NIE startuje tutaj — patrz `cooldownMs`. Kotwicą jest wyjście
    // z `active`, bo dopiero wtedy atak lecący przez przestrzeń się rozstrzyga.
    this.state = "active";
    this.until = nowMs + a.activeMs;
    return { from, to: "active", action: a };
  }
}

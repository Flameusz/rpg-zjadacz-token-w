/**
 * **BIEGŁOŚĆ GRACZA — magazyn `P` per rodzina broni.**
 *
 * Projekt, pomiary i uzasadnienia: `docs/systemy/proficiency.md` (§14 rangi,
 * §14a start nowej rodziny, §15 skala). Liczby stoją w `PROFICIENCY`
 * w `GameConfig`; arytmetyka warstwy 2 stoi w `core/Proficiency.ts`. **Tutaj
 * jest wyłącznie STAN.**
 *
 * ── Co ten plik jest, a czym nie jest ─────────────────────────────────────
 * ```
 * core/Proficiency.ts   wzory: pm(P), ps(P), m(P), executionFor   ← CZYSTE, nietknięte
 * TEN PLIK              ile gracz ma P w każdej rodzinie          ← STAN, zapisywany
 * GameScene             zamraża P w StrikeProfile i rzuca         ← UŻYCIE
 * ```
 *
 * ⚠ **To jest JEDYNY magazyn biegłości gracza w projekcie.** Do 2026-09-02
 * nie istniał żaden — `core/Proficiency.ts` nie ma pamięci, a jedyne wartości
 * `P` w grze siedziały w `EnemyConfig.proficiency` siedmiu stworzeń. Panel
 * rozwoju, narzędzie treningowe Patryczka i rozstrzygnięcie ciosu czytają
 * **to samo pole**; drugi magazyn (choćby „tylko na czas playtestu") rozjechałby
 * się z pierwszym przy pierwszej zmianie i nikt by tego nie zobaczył.
 *
 * ⚠ **Arytmetyka nauki NIE mieszka tutaj — mieszka w `core/Practice.ts`.**
 * Ten plik ma dwa kanały praktyki i oba są cienkie: `practiceOnDummy` (§14b)
 * i `practiceInCombat` (§20–§21, D7, od 2026-09-02). Robią wyłącznie to, czego
 * czysta arytmetyka nie może: pilnują sufitu `P`, zapisują stan i ogłaszają
 * zdarzenia. **Krzywe, funkcja nauczyciela i malejący przyrost są piętro niżej**
 * — i tylko dlatego uprząż potrafi je uruchomić w Node.
 *
 * ⚠⚠ **RANGA MASTERY JEST OSOBNYM, ZAPISANYM STANEM — nie funkcją `P`** (§34,
 * sesja 8). Do 2026-09-02 stało tu odwrotne zdanie („ranga jest ODCZYTEM
 * z progu") i było zgodne z wariantem A, który autor odwrócił. **Dwie postacie
 * z tym samym `P` mogą mieć różne rangi** — zależnie od tego, czy zapłaciły
 * u trenera. To jest jedyna wielkość w tym pliku, której NIE DA SIĘ odtworzyć
 * z `P`, i dlatego jedyna, która musi mieć własne pole zapisu.
 *
 * ── Podział odczytów, §34.5 — najłatwiejsze miejsce do cichego złamania ────
 * ```
 * PRÓG `P`         → softzone (Practice.masteryBand) · P_start (§14a/D3)
 *                    · przyszłe `gate` technik czynnych
 * RANGA WYKUPIONA  → SUFIT `P` (capFor) · przyszłe EFEKTY rang
 * ```
 * ⛔ **Nie przepinaj `masteryBand()` na rangę.** Gracz bez zapłaty nigdy nie
 * opuściłby pasma I i jego progresja **cicho by zwalniała** — czyli Mastery
 * stałoby się bramką NA PROGRESJI biegłości, wprost wbrew §34.4.
 *
 * ⚠ **`P` STAJE TWARDO NA SUFICIE, a praktyka zdobyta na suficie PRZEPADA**
 * (§34.3) — nie jest bankowana ani w `P`, ani w puli. Stąd obowiązek
 * powiadomienia w UI (§34.7): stanie na suficie to czas stracony i gracz musi
 * to wiedzieć.
 *
 * ⚠ **Ładunki rang SĄ wdrożone** (ekonomia wysiłku `effortReduction`, cecha
 * rodziny `traitMultiplier`, `critLowCut`, minimum proporcjonalne
 * `minimumFromRank`) — liczby w `PROFICIENCY.mastery.payload`, czyta je
 * `Progression`. `masteryOf` mówi, jaką rangę gracz KUPIŁ; steruje sufitem `P`
 * ORAZ tymi ładunkami. ⚠ Do 2026-10-09 stało tu „NADAL NIE SĄ wdrożone”
 * (pozycja D8) — nieaktualne od sesji 10–13, `OI-31`.
 */

import { PROFICIENCY, WEAPON_FAMILY } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Inventory } from "./Inventory";
import { Progression } from "./Progression";
import { addPractice, combatPractice, dummyPractice, executionWeight } from "./Practice";
import type { Execution } from "./CombatCues";
import type { WeaponFamily } from "./Equipment";

/** Wszystkie rodziny broni, w kolejności z configu. Import typu-only wobec
 *  `Equipment` (jak `Items.itemFamily`), więc bez cyklu w czasie wykonania. */
export const WEAPON_FAMILIES = Object.keys(WEAPON_FAMILY) as WeaponFamily[];

/** Ranga Mastery: `0` = **brak rangi** (nic nie wykupione), dalej I…IV. */
export type MasteryRank = 0 | 1 | 2 | 3 | 4;

/** Kształt zapisu — rodziny bez wpisu po prostu nie występują. */
export type WeaponProficiencySnapshot = Partial<Record<WeaponFamily, number>>;

/** Co blokuje zakup kolejnej rangi. `null` = nic, można kupować. */
export type MasteryBlock = "maxed" | "proficiency" | "gold" | "points";

/**
 * Wszystko, czego UI potrzebuje o jednej rodzinie — **policzone raz, w jednym
 * miejscu**. Panel BROŃ i panel trenera pytają o to samo (§34.7), a dwie kopie
 * tej arytmetyki rozjechałyby się przy pierwszej zmianie cennika.
 */
export interface MasteryOffer {
  /** Ranga WYKUPIONA. */
  readonly rank: MasteryRank;
  /** Ranga do kupienia, albo `null` na M-IV. */
  readonly next: MasteryRank | null;
  /** Sufit `P` przy dzisiejszej randze; `Infinity` na M-IV. */
  readonly cap: number;
  /** Czy `P` stoi już na suficie (praktyka przepada). */
  readonly atCap: boolean;
  /**
   * `P` wymagane do zakupu `next`; `null` na M-IV.
   *
   * ⚠ **To NIE JEST próg Mastery** — to `cap − unlockLead`, czyli **10 punktów
   * PRZED sufitem** (§34.2a). Próg zostaje tam, gdzie był: nadal wyznacza sufit
   * i nadal jest tym, co czyta `thresholdRankFor`.
   */
  readonly requiredProficiency: number | null;
  readonly goldCost: number;
  readonly pointCost: number;
  /** Czy zakup przejdzie TERAZ. */
  readonly ready: boolean;
  /** Pierwszy powód odmowy — do napisu w UI. */
  readonly blocked: MasteryBlock | null;
}

class WeaponProficiencyState {
  /** ⚠ Brak wpisu ≠ `P = 0`. Znaczy „ta rodzina jeszcze nie wystartowała",
   *  a wartość startową liczy `startValue()` wg §14a. */
  private points = new Map<WeaponFamily, number>();
  /**
   * **`P_start` ZAPISANE przy pierwszym użyciu rodziny** (§14b) — nie
   * wyprowadzane w locie i to jest cała treść tego pola.
   *
   * ⚠ Wyprowadzanie („25, jeśli mam gdzieś Mastery I") jest niestabilne:
   * gracz zaczyna topór przy `P = 0`, wyczerpuje manekina do 10, potem zdobywa
   * Mastery I **mieczem** — i próg topora przeliczyłby się na 25 + 10 = 35,
   * **odblokowując manekina po raz drugi na 25 dodatkowych punktów.**
   */
  private starts = new Map<WeaponFamily, number>();
  /**
   * Praktyka, która nie starczyła jeszcze na kolejny punkt.
   *
   * ⚠ **Bufor, nie ułamek `P`.** `+1` pozostaje atomem systemu (§19) — zmienia
   * się cena punktu, nigdy jednostka. Pula istnieje po to, żeby cios wart 4,7
   * jednostki przy koszcie 262 nie przepadał.
   */
  private pools = new Map<WeaponFamily, number>();
  /**
   * **RANGA WYKUPIONA per rodzina** (§34.1) — brak wpisu = brak rangi.
   *
   * ⚠ **To jest jedyna wielkość w tej klasie, której nie da się odtworzyć
   * z `P`**, i dokładnie dlatego istnieje: `P = 120` może znaczyć „kupił M-II"
   * albo „kupił M-I i stoi na suficie 200 z zapisu sprzed §34". Wyliczanie
   * rangi z `P` (`rankFor`) było modelem sprzed sesji 8 i zostało odwrócone.
   */
  private ranks = new Map<WeaponFamily, MasteryRank>();

  /**
   * Biegłość w tej rodzinie.
   *
   * ⚠ **`null` → punkt neutralny (100), czyli TOŻSAMOŚĆ.** Gołe ręce i osiosany
   * kij nie należą do żadnej rodziny (`Items.itemFamily` zwraca `null` i to
   * jest legalny stan, nie dziura), a `m(100) = 1` co do bitu — więc broń
   * improwizowana zachowuje się **dokładnie jak przed warstwą 2**. `P = 0`
   * byłoby cichym osłabieniem oręża, którego system w ogóle nie modeluje.
   */
  get(family: WeaponFamily | null): number {
    if (family === null) return PROFICIENCY.neutral;
    return this.points.get(family) ?? this.startValue();
  }

  /** Czy ta rodzina ma już ZAPISANĄ wartość — patrz `startValue()`. */
  has(family: WeaponFamily): boolean {
    return this.points.has(family);
  }

  /** Rodziny z zapisaną wartością, w kolejności z configu. */
  known(): WeaponFamily[] {
    return WEAPON_FAMILIES.filter((f) => this.points.has(f));
  }

  /**
   * **Startowe `P` rodziny, która jeszcze nie wystartowała** (§14a).
   *
   * ⚠ **Wartość STAŁA: 0 albo 25**, zależnie wyłącznie od tego, czy
   * JAKAKOLWIEK inna rodzina sięgnęła już PROGU `P ≥ 50`. Nie skaluje się
   * z poziomem postaci ani z tym, jak rozwinięta jest poprzednia broń — model
   * „procent najlepszej innej rodziny" został zmierzony i odrzucony, bo czyni
   * przesiadkę łagodniejszą dla bardziej zaawansowanego.
   *
   * ⚠⚠ **Warunkiem jest PRÓG `P`, NIE wykupiona ranga Mastery I** (D3, §34.8).
   * Do sesji 8 oba zdania znaczyły to samo, bo próg *był* rangą; §34 je
   * rozdzielił. Wybrano próg, bo `P ≥ 50` mówi o **kompetencji gracza**,
   * a posiadana ranga o **zapłacie** — i bo próg jest osiągalny bez trenera
   * (sufit bez rangi to dokładnie 50).
   */
  startValue(): number {
    const { fresh, veteran } = PROFICIENCY.startNewFamily;
    for (const value of this.points.values()) {
      if (this.thresholdRankFor(value) >= 1) return veteran;
    }
    return fresh;
  }

  /**
   * **Zapisane `P_start` tej rodziny** — czyli `P`, od którego zaczęła.
   * Rodzina nierozpoczęta zwraca to, od czego by zaczęła DZIŚ (`startValue()`),
   * ale **niczego nie zapisuje**: odczyt nie może zmieniać stanu.
   */
  startOf(family: WeaponFamily): number {
    return this.starts.get(family) ?? this.startValue();
  }

  /**
   * Zacznij rodzinę, jeśli jeszcze nie zaczęła — **to jest to „pierwsze
   * użycie", o którym mówi §14b**, i jedyne miejsce, w którym `P_start`
   * powstaje.
   *
   * ⚠ Wołane z kanału PRAKTYKI, nie z założenia broni. Rodzina zaczyna
   * istnieć, kiedy nią naprawdę machasz — samo przełożenie topora w plecaku
   * nie ma prawa nic zapisać.
   */
  private ensureStarted(family: WeaponFamily): void {
    if (this.points.has(family)) return;
    const start = this.startValue();
    this.points.set(family, start);
    this.starts.set(family, start);
  }

  /**
   * **Ile praktyki niesie jeden cios w MANEKINA** — bez skutków ubocznych, żeby
   * dało się to pokazać w UI i sprawdzić w uprzęży.
   *
   * ⚠ Liczone z ŻYWEGO `P`, nie z `P` zamrożonego w `StrikeProfile`. To są dwa
   * różne pytania: profil ciosu zamraża „jak dobrze go wyprowadziłeś" (bo
   * przezbrojenie w oknie zamachu nie może zmienić rozstrzygnięcia), a nauka
   * pyta „ile umiesz TERAZ". Między dwoma zamachami i tak nic tego nie rozdziela.
   */
  dummyGainFor(family: WeaponFamily, execution: Execution): number {
    const waga = executionWeight(execution);
    if (waga === 0) return 0;
    // Sufit sprawdzany PRZED krzywą, żeby UI i uprząż widziały to samo zero,
    // które zobaczy praktyka. Praktyka na suficie przepada (§34.3), więc
    // „ile by przybyło" musi tam wynosić dokładnie 0, a nie „tyle, co zwykle".
    if (this.atCap(family)) return 0;
    return dummyPractice(this.get(family), this.startOf(family)) * waga;
  }

  /**
   * **Praktyka z manekina.** Zwraca `true`, gdy przybył PUNKT (nie: gdy przybyła
   * praktyka).
   *
   * ⚠ **Zdarzenie leci WYŁĄCZNIE przy zmianie `P`, nigdy przy samym dolaniu do
   * puli** — i to nie jest oszczędność, tylko warunek działania zapisu.
   * `weaponProficiencyChanged` jest podpięte pod autozapis, a manekina bije się
   * kilkaset razy pod rząd: emisja per cios znaczyłaby **kilkaset zapisów na
   * sesję treningową**. Ta sama lekcja, przez którą układ paska umiejętności ma
   * własne zdarzenie zamiast jechać na `abilitiesChanged` (patrz `Save.ts`).
   *
   * Cena: pula między punktami przepada, jeśli gra zamknie się bez późniejszego
   * zapisu. Maksymalna strata to mniej niż jeden punkt — a punkt jest atomem,
   * więc nic „w połowie zdobytego" i tak nie istnieje.
   */
  practiceOnDummy(family: WeaponFamily, execution: Execution): boolean {
    const waga = executionWeight(execution);
    if (waga === 0) return false;
    this.ensureStarted(family);
    const przed = this.points.get(family) ?? 0;
    const cap = this.capFor(family);
    // ⚠ **Sufit odcina praktykę CAŁKOWICIE, nie tylko przyrost `P`** (§34.3):
    // nic nie wchodzi nawet do puli. Bankowanie praktyki na suficie byłoby
    // odroczonym punktem — czyli dokładnie tym, czego decyzja zabrania.
    if (przed >= cap) {
      this.announceCap(family, cap, false);
      return false;
    }
    const gain = dummyPractice(przed, this.startOf(family)) * waga;
    if (gain <= 0) return false;

    const po = addPractice({ proficiency: przed, pool: this.pools.get(family) ?? 0 }, gain);
    // Zaciśnięcie na suficie: reszta ponad sufit przepada razem z pulą. Punkt
    // jest atomem, więc „pół punktu nad sufitem" nie istnieje i nie ma czego
    // przechowywać.
    const po2 = po.proficiency >= cap ? { proficiency: cap, pool: 0 } : po;
    this.points.set(family, po2.proficiency);
    this.pools.set(family, po2.pool);
    if (po2.proficiency === przed) return false;
    this.emitChanged();
    // ⚠ Po `emitChanged`, nie zamiast niego: pierwsze zdarzenie zapisuje stan,
    // to drugie jest wyłącznie FEEDBACKIEM i leci tylko przy realnym punkcie.
    GameEvents.emit(EVENT.weaponPracticeGained, {
      family,
      points: po2.proficiency - przed,
    });
    // ⚠ **Po `weaponPracticeGained`, nie zamiast niego.** Punkt, który dobił do
    // sufitu, naprawdę przybył i ma się ogłosić — a dopiero po nim informacja,
    // że następny już nie przybędzie.
    if (po2.proficiency >= cap) this.announceCap(family, cap, true);
    return true;
  }

  /**
   * **Ogłoś, że praktyka w tej rodzinie PRZEPADA** (§34.3, kontrakt §34.10
   * poz. 12).
   *
   * ⚠ **Powiadomienie jest OBOWIĄZKOWYM elementem UI, nie ozdobą.** Sufit
   * zatrzymuje progresję po cichu: cios wygląda tak samo, brzmi tak samo
   * i nic nie daje. Trzy widoki, które o suficie mówią (panel BROŃ, wiersz
   * u trenera, panel Mistrzostwa), wymagają, żeby gracz **sam z siebie**
   * postanowił je otworzyć — a nie ma czego go do tego skłonić.
   *
   * ⚠ **Dławienie należy do ODBIORCY, nie do tego miejsca** (`ui/PracticeToast`).
   * Tutaj wiadomo tylko, że zamach przepadł; „ile razy z rzędu" i „jak dawno"
   * to pytania o czas sceny, a ten singleton zegara nie ma i mieć nie musi.
   */
  private announceCap(family: WeaponFamily, cap: number, reached: boolean): void {
    GameEvents.emit(EVENT.weaponCapReached, { family, cap, reached });
  }

  /**
   * **Praktyka z WALKI** (§20–§21, pozycja D7) — właściwy kanał progresji.
   * Zwraca `true`, gdy przybył PUNKT (nie: gdy przybyła praktyka).
   *
   * ```
   * base × teacher(P_wroga / P_gracza) × soft(P) × c × (√k − √(k−1))
   * ```
   *
   * ⚠ **`hitIndex` przychodzi LENIWIE, jako funkcja**, i to jest jedyny sposób,
   * żeby licznik `k` liczył to, co ma liczyć. Kolejność bramek jest tu treścią:
   * waga wykonania → sufit `P` → wartość nauczyciela → **dopiero teraz** `k`.
   * Gdyby scena zwiększała licznik sama, fuszerka, cios w sufit `P` albo cios
   * w przeciwnika, który już nic nie uczy, **zjadałyby malejący przyrost** —
   * czyli kara za powtarzanie tego samego sparingu spadałaby na zamachy, które
   * nikogo niczego nie uczyły.
   *
   * ⚠ **Manekin ma własny kanał** (`practiceOnDummy`) i nie przechodzi tędy.
   * Nawet gdyby przeszedł, dostałby zero: `TRAINING_DUMMY.proficiency = 0`,
   * więc `ρ = 0` i funkcja nauczyciela milknie.
   */
  practiceInCombat(
    family: WeaponFamily,
    execution: Execution,
    enemyProficiency: number,
    hitIndex: () => number,
  ): boolean {
    const waga = executionWeight(execution);
    if (waga === 0) return false;
    this.ensureStarted(family);
    const przed = this.points.get(family) ?? 0;
    const cap = this.capFor(family);
    // Sufit `P` obowiązuje TAK SAMO jak na manekinie (§34.3) — praktyka
    // zdobyta na suficie przepada razem z pulą, niezależnie od źródła.
    // ⚠ Powiadomienie też jest TO SAMO: gracz stojący na suficie w walce traci
    // dokładnie tak samo jak na kukle, tylko rzadziej otwiera panel.
    if (przed >= cap) {
      this.announceCap(family, cap, false);
      return false;
    }
    // Próba „na sucho" na pierwszym trafieniu: jeśli nauczyciel milczy
    // (`ρ ≤ 0,8`), wychodzimy BEZ zużycia `k`.
    if (combatPractice(przed, enemyProficiency, 1) <= 0) return false;
    const gain = combatPractice(przed, enemyProficiency, hitIndex()) * waga;
    if (gain <= 0) return false;

    const po = addPractice({ proficiency: przed, pool: this.pools.get(family) ?? 0 }, gain);
    const po2 = po.proficiency >= cap ? { proficiency: cap, pool: 0 } : po;
    this.points.set(family, po2.proficiency);
    this.pools.set(family, po2.pool);
    if (po2.proficiency === przed) return false;
    this.emitChanged();
    GameEvents.emit(EVENT.weaponPracticeGained, {
      family,
      points: po2.proficiency - przed,
    });
    if (po2.proficiency >= cap) this.announceCap(family, cap, true);
    return true;
  }

  /**
   * **Ile praktyki niesie `k`-te trafienie w tego przeciwnika** — bez skutków
   * ubocznych, do UI i do uprzęży. Ta sama para pytań co `dummyGainFor`.
   */
  combatGainFor(
    family: WeaponFamily,
    execution: Execution,
    enemyProficiency: number,
    hitIndex: number,
  ): number {
    const waga = executionWeight(execution);
    if (waga === 0) return 0;
    if (this.atCap(family)) return 0;
    return combatPractice(this.get(family), enemyProficiency, hitIndex) * waga;
  }

  /**
   * **Ranga, do której UPRAWNIA dana liczba punktów** — czyli ile progów `P`
   * przekroczono.
   *
   * ⚠⚠ **To NIE jest ranga gracza.** Rangę wykupioną zwraca `masteryOf`.
   * Ta funkcja odpowiada wyłącznie na pytania o PRÓG (§34.5): start nowej
   * rodziny (D3), pasek postępu do następnego progu, uprawnienie do zakupu.
   * Nazwana długo świadomie — dawne `rankFor` czytało się jak „ranga" i było
   * nią w wariancie A, który już nie obowiązuje.
   */
  thresholdRankFor(value: number): MasteryRank {
    let rank = 0;
    for (const prog of PROFICIENCY.masteryThresholds) {
      if (value >= prog) rank++;
    }
    return rank as MasteryRank;
  }

  /**
   * **Ranga WYKUPIONA w tej rodzinie** (§34.1) — osobny, zapisany stan.
   *
   * ⚠ Rodzina `null` (gołe ręce, osiosany kij) nie ma rangi i mieć nie może:
   * nie należy do żadnej rodziny, więc nie ma u kogo jej kupić.
   */
  masteryOf(family: WeaponFamily | null): MasteryRank {
    if (family === null) return 0;
    return this.ranks.get(family) ?? 0;
  }

  /**
   * **Twardy sufit `P` przy dzisiejszej randze** (§34.3):
   * `bez rangi → 50 · M-I → 100 · M-II → 200 · M-III → 350 · M-IV → ∞`.
   *
   * ⚠ **Wyprowadzany z `masteryThresholds`, nie z drugiej tabeli** — jedna
   * lista progów, żeby nie dało się ich rozjechać.
   */
  capFor(family: WeaponFamily | null): number {
    if (family === null) return Number.POSITIVE_INFINITY;
    const progi: readonly number[] = PROFICIENCY.masteryThresholds;
    const rank = this.masteryOf(family);
    return rank < progi.length ? progi[rank] : Number.POSITIVE_INFINITY;
  }

  /** Czy `P` stoi na suficie — czyli czy praktyka w tej rodzinie PRZEPADA. */
  atCap(family: WeaponFamily | null): boolean {
    return this.get(family) >= this.capFor(family);
  }

  /* ── ŁADUNKI RANG (§14) ───────────────────────────────────────────────
     ⚠ **Wszystkie trzy czytają RANGĘ WYKUPIONĄ, nigdy `P` ani progu** (§34.5).
     To jest cała różnica między tym kodem a modelem sprzed sesji 8 i jedyne
     miejsce, w którym da się ją złamać po cichu.

     ⚠ Tu mieszkają wyłącznie LICZBY per ranga. **Gdzie się je przykłada,
     wie `Progression`** — bo to tam siedzą efekty (parada, zachwianie, zakres
     obrażeń, czas zamachu), a D1 mówi: mnożymy EFEKT, nie POLE. */

  /** Redukcja kosztu zamachu (0 … 0,35). ⚠ Dotyczy WYŁĄCZNIE autoataku —
   *  umiejętności i blok mają własne koszty i Mastery ich nie tyka (§25). */
  effortReduction(family: WeaponFamily | null): number {
    const tab: readonly number[] = PROFICIENCY.mastery.payload.effortReduction;
    return tab[this.masteryOf(family)] ?? 0;
  }

  /** Mnożnik cechy rodziny o bazie NIEZEROWEJ (miecz, obuch) — D1. */
  traitMultiplier(family: WeaponFamily | null): number {
    const tab: readonly number[] = PROFICIENCY.mastery.payload.traitMultiplier;
    return tab[this.masteryOf(family)] ?? 1;
  }

  /** `φ` — ułamek rozstrzału odcięty od dołu przy losowaniu KRYTYKA (D2,
   *  topór i sztylet). Wartości per ranga, bo baza cechy wynosi zero. */
  critLowCut(family: WeaponFamily | null): number {
    const tab: readonly number[] = PROFICIENCY.mastery.payload.critLowCut;
    return tab[this.masteryOf(family)] ?? 0;
  }

  /** Czy działa **minimum proporcjonalne** (ładunek M-III, rodzinowo neutralny). */
  hasProportionalMinimum(family: WeaponFamily | null): boolean {
    return this.masteryOf(family) >= PROFICIENCY.mastery.payload.minimumFromRank;
  }

  /**
   * **Pełna oferta trenera dla jednej rodziny** — jedno miejsce liczące
   * „co dalej, ile to kosztuje i czego brakuje" (§34.7).
   *
   * ⚠ **Zakup otwiera się `unlockLead` punktów PRZED sufitem** (§34.2a,
   * 2026-09-03), a nie na progu. Sufit, przepadanie praktyki i powiadomienie
   * o suficie **nie zmieniają się ani o punkt** — okno daje wyłącznie czas na
   * dojście do trenera.
   */
  masteryOffer(family: WeaponFamily): MasteryOffer {
    const rank = this.masteryOf(family);
    const progi: readonly number[] = PROFICIENCY.masteryThresholds;
    const cap = this.capFor(family);
    const atCap = this.atCap(family);
    if (rank >= progi.length) {
      return {
        rank,
        next: null,
        cap,
        atCap,
        requiredProficiency: null,
        goldCost: 0,
        pointCost: 0,
        ready: false,
        blocked: "maxed",
      };
    }
    // Rozszerzone do tablicy, bo `as const` robi z cennika KROTKĘ, a
    // indeksowanie jej rangą (zwykłym `number`) nie przechodzi przez `tsc` —
    // ta sama sztuczka co przy `masteryThresholds` niżej.
    const cennik: readonly { gold: number; points: number }[] = PROFICIENCY.mastery.cost;
    const koszt = cennik[rank];
    // ⚠ **OKNO PRZEDSPRZEDAŻY: `cap − unlockLead`, nie sam próg** (decyzja
    // autora, 2026-09-03). Trener sprzedaje kolejną rangę **10 punktów przed
    // sufitem**, żeby dało się zdążyć, zanim praktyka zacznie przepadać.
    //
    // ⚠ **Liczone z `cap`, a nie z `progi[rank]`, choć to dziś ta sama liczba.**
    // `cap` jest tym, co gracz naprawdę uderza (i tym, o czym mówi
    // powiadomienie), więc reguła „dziesięć przed sufitem" ma czytać właśnie
    // sufit. Gdyby kiedykolwiek rozjechały się z progiem, poprawna jest ta
    // wersja — a `Math.max(0, …)` trzyma sens także dla progu ≤ 10.
    //
    // ⛔ **To NIE JEST zmiana progu.** `capFor`, `atCap`, `thresholdRankFor`
    // i `startValue` czytają dalej `masteryThresholds` bez tej stałej — patrz
    // zakaz przy `PROFICIENCY.mastery.unlockLead`.
    const wymagane = Math.max(0, cap - PROFICIENCY.mastery.unlockLead);
    // Kolejność powodów odmowy = kolejność, w jakiej gracz może je usunąć:
    // najpierw dobija `P` do progu, potem zbiera złoto, na końcu punkty.
    const blocked: MasteryBlock | null =
      this.get(family) < wymagane
        ? "proficiency"
        : Inventory.gold < koszt.gold
          ? "gold"
          : Progression.skillPoints < koszt.points
            ? "points"
            : null;
    return {
      rank,
      next: (rank + 1) as MasteryRank,
      cap,
      atCap,
      requiredProficiency: wymagane,
      goldCost: koszt.gold,
      pointCost: koszt.points,
      ready: blocked === null,
      blocked,
    };
  }

  /**
   * **Kup kolejną rangę u trenera** (§34.2, D5) — pobiera ZŁOTO i PUNKTY
   * ROZWOJU z istniejących pul.
   *
   * ⚠ **Oba koszty sprawdzone przed pobraniem KTÓREGOKOLWIEK**, a złoto
   * zwracane, gdyby punkty jednak nie zeszły — dokładnie ten sam kontrakt co
   * `Skills.learn`, i z tego samego powodu: zabranie 1800 g i nienadanie rangi
   * jest gorsze niż odmowa.
   *
   * ⚠ **Nie rusza `P`.** Zakup podnosi wyłącznie SUFIT — punkty biegłości
   * nadal trzeba wypracować praktyką.
   */
  unlockMastery(family: WeaponFamily): boolean {
    const oferta = this.masteryOffer(family);
    if (!oferta.ready || oferta.next === null) return false;

    // NB: `Inventory.spendGold` odrzuca kwotę zerową, więc darmowa ranga
    // (dziś: żadna, ale cennik jest konfigiem) musi ten krok pominąć.
    if (oferta.goldCost > 0 && !Inventory.spendGold(oferta.goldCost)) return false;
    if (!Progression.spendSkillPoints(oferta.pointCost)) {
      if (oferta.goldCost > 0) Inventory.addGold(oferta.goldCost);
      return false;
    }

    this.ranks.set(family, oferta.next);
    this.emitChanged();
    return true;
  }

  /**
   * Ustaw rangę wprost — **bez płacenia**.
   *
   * ⚠ **Dwóch wołających i obaj są uprawnieni:** przywracanie z zapisu
   * (`restore`) i narzędzie playtestowe. ⛔ **Rozgrywka kupuje rangi wyłącznie
   * przez `unlockMastery`** — to jest jedyne miejsce, które pobiera koszt.
   *
   * Obniżenie rangi zacisnie `P` do nowego sufitu, żeby nie zostawić stanu
   * „`P` ponad sufitem", którego model nie zna.
   */
  setMastery(family: WeaponFamily, rank: MasteryRank): void {
    const progi: readonly number[] = PROFICIENCY.masteryThresholds;
    const r = Math.max(0, Math.min(progi.length, Math.floor(rank))) as MasteryRank;
    if (r === 0) this.ranks.delete(family);
    else this.ranks.set(family, r);
    const cap = this.capFor(family);
    const p = this.points.get(family);
    if (p !== undefined && p > cap) {
      this.points.set(family, cap);
      this.pools.set(family, 0);
    }
    this.emitChanged();
  }

  /**
   * Postęp do następnego PROGU `P`, albo `null` powyżej ostatniego progu.
   *
   * ⚠ **Mierzy próg, nie rangę** (§34.5). Przy dzisiejszym modelu próg jest
   * jednocześnie SUFITEM, więc ten pasek czyta się jako „ile zostało do
   * zatrzymania" — i to jest dokładnie ta informacja, której gracz potrzebuje,
   * żeby wiedzieć, kiedy iść do trenera.
   */
  progressTo(
    family: WeaponFamily | null,
  ): { from: number; to: number; ratio: number; rank: MasteryRank } | null {
    const value = this.get(family);
    const rank = this.thresholdRankFor(value);
    // Rozszerzone do `readonly number[]`, bo `as const` robi z tabeli KROTKĘ,
    // a indeksowanie jej rangą (zwykłym `number`) nie przechodzi przez `tsc`.
    const progi: readonly number[] = PROFICIENCY.masteryThresholds;
    if (rank >= progi.length) return null;
    const from = rank === 0 ? 0 : progi[rank - 1];
    const to = progi[rank];
    // Zakres progu nigdy nie jest zerowy (50 → 100 → 200 → 350), więc dzielenie
    // jest bezpieczne bez straży; zaciśnięcie chroni tylko przed wartością
    // wpisaną ręcznie poniżej dolnego progu.
    const ratio = Math.min(1, Math.max(0, (value - from) / (to - from)));
    return { from, to, ratio, rank: (rank + 1) as MasteryRank };
  }

  /**
   * Ustaw biegłość rodziny wprost.
   *
   * ⚠ **Dziś ma dokładnie jednego wołającego: narzędzie playtestowe.** Nauka
   * idzie przez `practiceOnDummy` i `practiceInCombat`, czyli przez krzywą
   * kosztu — nigdy przez podstawianie wyniku tutaj.
   *
   * ⚠ **NIE rusza `P_start`, jeśli rodzina już wystartowała, ale USTALA go dla
   * rodziny nowej** — inaczej ustawienie `P = 100` narzędziem testowym
   * zostawiłoby rodzinę bez zapisanego progu, a pierwszy cios w manekina
   * zapisałby wtedy `P_start = 100` i **odblokował 10 punktów manekina na
   * setce**. Pula praktyki jest zerowana, bo należała do innej wartości `P`.
   *
   * ⚠ **Zaciskane od dołu do zera i OD GÓRY DO SUFITU rangi** (§34.3). Sufit
   * doszedł w sesji 9 razem z §34: narzędzie, które potrafi postawić `P = 350`
   * bez wykupionej rangi, tworzyłoby stan, którego model nie zna — a wtedy
   * playtest mierzyłby zachowanie nieistniejącej konfiguracji. **Chcesz wyżej:
   * najpierw `setMastery`, potem `set`.**
   */
  set(family: WeaponFamily, value: number): void {
    if (!Number.isFinite(value)) return;
    const v = Math.max(0, Math.min(value, this.capFor(family)));
    if (!this.starts.has(family)) this.starts.set(family, v);
    this.points.set(family, v);
    this.pools.set(family, 0);
    this.emitChanged();
  }

  /** Zapomnij zapisaną wartość — rodzina wraca do stanu „nie wystartowała",
   *  razem z progiem, pulą i **wykupioną rangą**. */
  clear(family: WeaponFamily): void {
    const miala = this.points.delete(family);
    const rangaByla = this.ranks.delete(family);
    if (!miala && !rangaByla) return;
    this.starts.delete(family);
    this.pools.delete(family);
    this.emitChanged();
  }

  reset(): void {
    this.points.clear();
    this.starts.clear();
    this.pools.clear();
    this.ranks.clear();
    this.emitChanged();
  }

  snapshot(): WeaponProficiencySnapshot {
    return this.dump(this.points);
  }

  /**
   * **Wykupione rangi per rodzina — osobne pole zapisu** (§34.1).
   *
   * ⚠ **Nie da się go pominąć „bo wynika z `P`".** Właśnie przestało wynikać:
   * to jest cała treść decyzji z sesji 8.
   */
  masterySnapshot(): WeaponProficiencySnapshot {
    return this.dump(this.ranks);
  }

  /** `P_start` per rodzina — **osobne pole zapisu**, bo nie da się go odtworzyć
   *  z `P`: rodzina stojąca na 30 mogła zacząć od 25 albo od 0. */
  startSnapshot(): WeaponProficiencySnapshot {
    return this.dump(this.starts);
  }

  /** Reszty puli. Zapisywane, żeby sesja treningowa nie gubiła postępu przy
   *  wyjściu z gry — patrz `practiceOnDummy` (zdarzenie leci tylko na punkcie). */
  poolSnapshot(): WeaponProficiencySnapshot {
    return this.dump(this.pools);
  }

  private dump(src: Map<WeaponFamily, number> | Map<WeaponFamily, MasteryRank>): WeaponProficiencySnapshot {
    const out: WeaponProficiencySnapshot = {};
    for (const [family, value] of src) out[family] = value;
    return out;
  }

  /**
   * Przywróć z zapisu. Nieznane rodziny i wartości bez sensu są odsiewane —
   * ta sama sanityzacja co w `Skills.restore`.
   *
   * ⚠ **`P_start` starszego zapisu (bez tego pola) jest uzupełniane WARTOŚCIĄ
   * `P`, nie zerem.** Zapis sprzed praktyki niesie rodziny ustawione narzędziem
   * testowym; przyjęcie `P_start = 0` dałoby im `lp = P`, czyli natychmiast
   * powyżej limitu — co akurat jest poprawne dla `P ≥ 10`, ale dla `P = 5`
   * odblokowałoby manekina wstecz. `P_start = P` znaczy „ta rodzina zaczyna się
   * tam, gdzie ją zastaliśmy" i jest jedyną odpowiedzią, która nie zmyśla
   * historii.
   *
   * ⚠⚠ **Zapis SPRZED §34 nie ma rang i dostaje ZERO — a `P` zostaje takie,
   * jakie było, nawet gdy przekracza dzisiejszy sufit.** To jest jedyne
   * miejsce, w którym stan „`P` powyżej sufitu" w ogóle może powstać, i obie
   * alternatywy są gorsze: zaciśnięcie `P` **skasowałoby realny postęp**
   * postaci sprzed tej zmiany, a nadanie rang pasujących do `P`
   * **wyprodukowałoby zakupy, których nikt nie zrobił** — czyli wróciłoby do
   * modelu „próg nadaje rangę", właśnie odwróconego. Taka postać po prostu
   * stoi (praktyka nie płynie), dopóki nie kupi rangi. ⚠ Migracja istniejących
   * zapisów jest w checkpointcie **pozycją otwartą** (§32.1) — to jest wybór
   * najmniej niszczący, nie rozstrzygnięcie tamtego pytania.
   */
  restore(
    data: WeaponProficiencySnapshot | undefined,
    starts?: WeaponProficiencySnapshot,
    pools?: WeaponProficiencySnapshot,
    mastery?: WeaponProficiencySnapshot,
  ): void {
    this.points.clear();
    this.starts.clear();
    this.pools.clear();
    this.ranks.clear();
    const maxRank = PROFICIENCY.masteryThresholds.length;
    for (const family of WEAPON_FAMILIES) {
      // ⚠ Ranga wczytywana NIEZALEŻNIE od `P` — rodzina bez zapisanego `P`
      // może mieć wykupioną rangę (kupiona, zanim gracz nią machnął).
      const rank = mastery?.[family];
      if (typeof rank === "number" && Number.isFinite(rank) && rank >= 1) {
        this.ranks.set(family, Math.min(Math.floor(rank), maxRank) as MasteryRank);
      }

      const value = data?.[family];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) continue;
      this.points.set(family, value);

      const start = starts?.[family];
      this.starts.set(
        family,
        typeof start === "number" && Number.isFinite(start) && start >= 0 ? start : value,
      );

      const pool = pools?.[family];
      if (typeof pool === "number" && Number.isFinite(pool) && pool >= 0) {
        this.pools.set(family, pool);
      }
    }
    this.emitChanged();
  }

  emitChanged(): void {
    GameEvents.emit(EVENT.weaponProficiencyChanged, { proficiency: this.snapshot() });
  }
}

export const WeaponProficiency = new WeaponProficiencyState();

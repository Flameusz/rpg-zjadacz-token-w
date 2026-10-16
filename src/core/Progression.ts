import {
  PROGRESSION,
  ATTRIBUTES,
  PLAYER,
  WEAPON_FAMILY,
  DEFENSE,
  STAMINA,
  PROFICIENCY,
  EQUIPMENT_LOAD,
} from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Stamina } from "./Stamina";
import { Defense } from "./Defense";
/**
 * ⚠ **Import ZAMYKA CYKL `Progression ↔ WeaponProficiency` i jest bezpieczny
 * z jednego konkretnego powodu:** żaden z dwóch modułów nie dotyka drugiego
 * w czasie WYKONANIA CIAŁA MODUŁU. `WeaponProficiency` sięga po `Progression`
 * dopiero w `unlockMastery` (punkty rozwoju), a `Progression` po rangę —
 * dopiero w getterach niżej. Konstruktory obu singletonów inicjalizują same
 * pola. **Trzeci wierzchołek albo jedno odwołanie na poziomie modułu i to
 * przestaje działać** — dokładnie ten powód, dla którego `Stamina` NIE
 * importuje ani `Progression`, ani `Equipment` (patrz `src/core/CLAUDE.md`).
 */
import { WeaponProficiency } from "./WeaponProficiency";
import { familyHasTrait, familyTraitValue } from "./WeaponTraits";
import {
  Equipment,
  type AttackVariant,
  type DamageType,
  type MeleeShape,
  type WeaponFamily,
} from "./Equipment";

/**
 * Attributes the player can put skill points into.
 *
 * ⚠ **`endurance` rozpadło się 2026-08-21 na `vitality` i `conditioning`.**
 * Witalność wzięła całe HP (i regenerację HP), Kondycja wzięła całą staminę.
 * Stara nazwa nie istnieje już nigdzie w kodzie — żyje wyłącznie w ZAPISACH,
 * gdzie `Save` czyta ją jako Witalność (postać nie traci ani punktu HP)
 * i zeruje Kondycję.
 */
export type Attribute = "strength" | "vitality" | "conditioning" | "agility";

/** Display names, so an attribute referenced from data (an item's `requires`)
 *  can be named in the UI without every call site spelling it out. */
export const ATTRIBUTE_LABEL: Record<Attribute, string> = {
  strength: "Siła",
  vitality: "Witalność",
  conditioning: "Kondycja",
  agility: "Zręczność",
};

/**
 * The player's run-long progress: XP, level, and unspent skill points.
 *
 * Deliberately a module-level singleton rather than state on Player, because it
 * has to outlive the Player object. Dying and resurrecting rebuilds nothing but
 * keeps your level; the same will be true when walking between maps, which
 * respawns the whole scene. `reset()` is what starts a fresh run.
 */
class ProgressionState {
  level = 1;
  /** XP accumulated *within* the current level, not lifetime total. */
  xp = 0;
  skillPoints = 0;
  /** Lifetime XP, for display/debugging. */
  totalXp = 0;

  /** Points invested per attribute. Derived stats are computed from these. */
  strength = 0;
  /** Witalność — maks. HP i regeneracja HP. **Nic więcej**: pancerz,
   *  odporności, unik i leczenie otrzymane celowo tu NIE trafiają, żeby
   *  atrybut odpowiadał na jedno pytanie — „ile obrażeń przeżyję". */
  vitality = 0;
  /** Kondycja — cała stamina. Pula, a przez progi bezwzględne także zapas nad
   *  progiem zmęczenia. Patrz `core/Stamina.ts`. */
  conditioning = 0;
  agility = 0;

  /**
   * Mnożnik obrażeń od atrybutów, w tempie zapisanym NA ZAŁOŻONEJ BRONI.
   *
   *     1 + SIŁ × strScale + ZRĘ × dexScale
   *
   * ⚠ **Atrybuty MNOŻĄ obrażenia broni, nie dodają do nich** (zmiana
   * 2026-08-20; pełne uzasadnienie w komentarzu nad `ATTRIBUTES`, kalibracja
   * w `docs/atrybuty.md` §10). Poprzednie `+1 płasko za punkt Siły` odwracało
   * drabinkę broni, rozcieńczało jakość wykonania i spłaszczało wybór wariantu
   * ataku — trzy systemy, które ta gra już miała zbudowane.
   *
   * ⚠ **Obie osie w JEDNYM mnożniku, nie dwa mnożniki po sobie.** Gdyby
   * liczyć `(1+SIŁ×a) × (1+ZRĘ×b)`, build mieszany dostawałby premię za samo
   * mieszanie (człon `SIŁ×ZRĘ×a×b`), czyli 8/7 biłoby 15/0 bez żadnego powodu
   * projektowego. Suma trzyma to liniowo.
   *
   * ⚠ **Gołe ręce mają własne wartości w `PLAYER`, a nie wartości domyślne
   * w kodzie.** Ta sama reguła, co przy `PLAYER.melee` i `PLAYER.attacks`:
   * pięść jest tu pełnoprawnym „przedmiotem", żeby żadna ścieżka nie musiała
   * pytać, czy coś jest założone.
   */
  get attributeDamageMul(): number {
    const s = Equipment.weaponScaling ?? { str: PLAYER.strScale, dex: PLAYER.dexScale };
    return 1 + this.strength * s.str + this.agility * s.dex;
  }

  /**
   * **LICZBY RZUTU DLA BRONI Z DRUGIEJ RĘKI** (Dual Wield, prototyp 2026-09-05).
   *
   * ⚠⚠ **To jest JEDYNE miejsce, w którym rozwiązuje się broń off-handa** — ta
   * sama reguła, przez którą `family` i warianty ataku rozwiązują się wyłącznie
   * tutaj. Scena składa z tego `StrikeProfile`, ale sama nie sięga po
   * `getItem`, nie mnoży przez atrybuty i nie pyta o cechę rodziny.
   *
   * ⚠ **Wariant ataku NIE jest tu stosowany i to jest decyzja, nie brak.**
   * Wariant (`activeVariant`) jest wyborem gracza dotyczącym broni GŁÓWNEJ —
   * jeden pasek wariantów, jeden wybór. Udawanie, że off-hand ma własny
   * aktywny wariant, znaczyłoby drugi stan interfejsu, którego nie ma.
   *
   * ⚠ **`critChance` celowo NIE jest tu liczone.** Szansa krytyka jest
   * własnością POSTACI i sprzętu (`PLAYER.critChance` + bonusy z ekwipunku),
   * a nie ręki; rozdzielenie jej dałoby dwie różne szanse w jednej walce bez
   * powodu w fikcji. Mnożnik krytyka już tak — bo jego cecha jest rodziny.
   */
  get offhandNumbers(): {
    damageMin: number;
    damageMax: number;
    critMultiplier: number;
    critLowCut: number;
    critChance: number;
    staminaCost: number;
    proficiency: number;
    family: WeaponFamily | null;
  } | null {
    const def = Equipment.offhandWeaponDef;
    if (!def) return null;
    const rodzinaId = Equipment.offhandWeaponFamily;
    const rodzina = rodzinaId ? WEAPON_FAMILY[rodzinaId] : null;
    const skala = def.scaling;
    const attrMul = 1 + this.strength * skala.str + this.agility * skala.dex;

    const surowyMax = def.damageMax * attrMul;
    let min = def.damageMin * attrMul;
    // Ten sam ładunek M-III co w `meleeDamageMin` — liczony z ROZSTRZAŁU.
    if (WeaponProficiency.hasProportionalMinimum(rodzinaId)) {
      min += Math.round((surowyMax - min) * PROFICIENCY.mastery.payload.minimumShare);
    }

    // Cecha rodziny × ranga Mastery — ta sama arytmetyka co w `critMultiplier`.
    const zRodziny = familyTraitValue(rodzina, "critMultiplierBonus") * WeaponProficiency.traitMultiplier(rodzinaId);
    return {
      damageMin: min,
      damageMax: surowyMax,
      critMultiplier: PLAYER.critMultiplier + (def.critMultiplierBonus ?? 0) + zRodziny,
      // `φ` należy wyłącznie do rodzin, których cechą jest siła krytyka.
      critLowCut: familyHasTrait(rodzina, "critMultiplierBonus") ? WeaponProficiency.critLowCut(rodzinaId) : 0,
      // ⚠⚠ **Szansa krytyka TEJ ręki** (2026-09-05). Do tej daty `Player.rollDamage`
      //   czytał `Progression.critChance`, a ten bierze `Equipment.weaponMelee`,
      //   czyli broń z ręki GŁÓWNEJ — więc cios off-handem losował krytyka
      //   szansą cudzej broni. Zmierzone: `Sztylet + Miecz` dawał +24,1% dps
      //   zamiast +19,5%, a `Miecz + Sztylet` +11,7% zamiast +16,0%, bo sztylet
      //   (`critChanceBonus: 0,1`) tracił swoją cechę w drugiej ręce.
      //   ⛔ Premia postaci (`Equipment.bonusCritChance`, pierścienie) NIE jest
      //   własnością ręki i wchodzi tak samo do obu.
      critChance: Math.min(
        PLAYER.critChance + Equipment.bonusCritChance + (def.critChanceBonus ?? 0),
        ATTRIBUTES.maxCritChance,
      ),
      staminaCost:
        STAMINA.costs.autoAttackPerSecond *
        (this.offhandSwingDurationMs / Equipment.dualWieldSwingMul / 1000) *
        (1 - WeaponProficiency.effortReduction(rodzinaId)),
      proficiency: WeaponProficiency.get(rodzinaId),
      family: rodzinaId,
    };
  }

  /**
   * Zachwianie z cechy rodziny broni w DRUGIEJ ręce, skalowane JEJ rangą.
   *
   * ⚠ Bliźniak `staggerMs`, nie jego wariant — obie ręce liczą tę samą cechę,
   * każda ze swojej rodziny i swojej rangi. Sztylet w off-handzie ma 0, bo jego
   * rodzina nie ma cechy zachwiania; obuch miałby swoje.
   */
  get offhandStaggerMs(): number {
    const id = Equipment.offhandWeaponFamily;
    if (!id) return 0;
    const stagger = familyTraitValue(WEAPON_FAMILY[id], "staggerMs");
    if (stagger <= 0) return 0;
    return stagger * WeaponProficiency.traitMultiplier(id);
  }

  /**
   * **Kadencja broni z drugiej ręki (sekundy między ciosami)** — bliźniak
   * `attackCooldown`, liczony DOKŁADNIE tym samym wzorem.
   *
   * ⚠⚠ **Model „per-ręka": bramka po ciosie należy do ręki, która uderzyła**
   * (2026-09-05, po analizie czterech modeli kadencji DW). Nadal jest JEDEN
   * timer i jedna sekwencja ciosów — zmienia się wyłącznie to, czyim
   * cooldownem ustawia się następne okno.
   *
   * ⚠ **Ani jednej nowej liczby ani nowego mnożnika.** `swingMulPublic` niesie
   * te same `variantMul("swingMul") × offhandSwingMul`, co ręka główna; tempo
   * ze Zręczności i stan zmęczenia dzielą obie ręce, bo należą do jednego
   * ciała. Różni je wyłącznie CZAS BAZOWY broni.
   *
   * ⚠ Wybrany model zachowuje tempo OBU broni zamiast mieszać je w jedną
   * liczbę — czyli nie unieważnia zdania „`attackCooldown` to tempo tej broni",
   * które czyta też UI. Konsekwencja do świadomości: przy parze mieszanej rytm
   * jest **synkopowany** (dłuższy odstęp po wolniejszej broni).
   */
  get offhandAttackCooldown(): number {
    const def = Equipment.offhandWeaponDef;
    const base = def?.attackCooldown ?? PLAYER.attackCooldown;
    return (base * this.swingMulPublic) / (1 + this.attackSpeedBonus) / Stamina.attackSpeedMultiplier;
  }

  /**
   * Czas zamachu broni z drugiej ręki (ms).
   *
   * ⚠ **Dzieli te same mnożniki co ręka główna** (`swingMul`, tempo z
   * Zręczności, stan zmęczenia) — bo obie ręce należą do jednego ciała i jedna
   * kadencja je prowadzi. Różni je wyłącznie czas bazowy broni.
   */
  get offhandSwingDurationMs(): number {
    const def = Equipment.offhandWeaponDef;
    const base = def?.swingDurationMs ?? PLAYER.swing.durationMs;
    return (base * this.swingMulPublic) / (1 + this.attackSpeedBonus) / Stamina.attackSpeedMultiplier;
  }

  /**
   * Melee damage range: the equipped weapon's range (bare-hands PLAYER range
   * if nothing's equipped), scaled by the active variant and then by the
   * attributes this weapon rewards. Actual hits roll within it — see
   * Player.rollDamage().
   */
  get meleeDamageMin(): number {
    const base = Equipment.weaponDamage?.min ?? PLAYER.damageMin;
    const min = base * this.variantMul("damageMul") * this.attributeDamageMul;
    // ⚠ **MINIMUM PROPORCJONALNE — ładunek M-III** („przestajesz marnować
    // ciosy"). Liczone z ROZSTRZAŁU, nigdy płasko: płaskie `+1` zerowało
    // rozstrzał pięści i było regresywne ×4,3. Samoograniczające się —
    // przy rozstrzale poniżej 3 `round` daje zero.
    //
    // ⚠ Liczone na zakresie PO wariancie i atrybutach, czyli na tym samym,
    // z którego losuje `Player.rollDamage` — inaczej minimum opisywałoby inną
    // broń niż ta, którą gracz macha.
    if (!WeaponProficiency.hasProportionalMinimum(Equipment.weaponFamily)) return min;
    const spread = this.meleeDamageMaxRaw - min;
    return min + Math.round(spread * PROFICIENCY.mastery.payload.minimumShare);
  }

  /** Górna granica bez ładunków Mastery — istnieje, żeby `meleeDamageMin`
   *  mogło policzyć rozstrzał bez rekurencji przez `meleeDamageMax`. */
  private get meleeDamageMaxRaw(): number {
    const base = Equipment.weaponDamage?.max ?? PLAYER.damageMax;
    return base * this.variantMul("damageMul") * this.attributeDamageMul;
  }

  /** ⚠ **Mastery NIE podnosi sufitu obrażeń** — ani ładunek M-III, ani `φ`.
   *  Fikcja mistrzostwa to niezawodność, więc cała drabina pracuje na PODŁODZE
   *  (§13). Ten getter zostaje surowy i tak ma zostać. */
  get meleeDamageMax(): number {
    return this.meleeDamageMaxRaw;
  }

  /** Average melee damage, for display only — hits themselves are rolled, not averaged. */
  get meleeDamage(): number {
    return Math.round((this.meleeDamageMin + this.meleeDamageMax) / 2);
  }

  /** Max HP: base, plus Endurance, plus flat HP from gear (a vigour ring).
   *  Gear can REMOVE max HP again when unequipped, which is why Player
   *  re-clamps its current HP on every equipmentChanged. */
  get maxHp(): number {
    return PLAYER.hp + this.vitality * ATTRIBUTES.hpPerVitality + Equipment.bonusMaxHp;
  }

  /**
   * Passive HP regenerated per second, out of combat only (Player owns the
   * "five second rule" timing — see PLAYER.regenDelayMs). Witalność's second
   * effect, and the reason it isn't a pure max-HP dump stat.
   */
  get hpRegenPerSecond(): number {
    return PLAYER.hpRegenPerSecond + this.vitality * ATTRIBUTES.hpRegenPerVitality;
  }

  /**
   * Szansa na krytyka (0..1): baza + BROŃ + SPRZĘT, capowane przez
   * `ATTRIBUTES.maxCritChance`.
   *
   * ⚠ **Zręczności tu NIE MA i to jest zamierzone (2026-08-20).** Krytyk ma
   * dwóch lepszych właścicieli — broń (`melee.critChanceBonus`, dziś sztylet)
   * i rodzinę (`WEAPON_FAMILY.axe` po stronie SIŁY krytyka) — a człon
   * atrybutowy był poniżej progu zauważalności w walce trwającej 2–5 ciosów.
   * Pełne uzasadnienie stoi przy `ATTRIBUTES.maxCritChance`.
   */
  get critChance(): number {
    return Math.min(
      PLAYER.critChance +
        Equipment.bonusCritChance +
        (Equipment.weaponMelee?.critChanceBonus ?? 0),
      ATTRIBUTES.maxCritChance,
    );
  }

  /**
   * Siła krytyka: baza + premia BRONI + premia RODZINY.
   *
   * ⚠ **Trzy człony, trzy różne właściciele, i to jest cała treść tego
   * gettera.** `PLAYER.critMultiplier` to baza; `melee.critMultiplierBonus` to
   * premia KONKRETNEGO PRZEDMIOTU (dziś żaden — ostatni taki przypadek, sztylet,
   * przeniósł się do rodziny 2026-08-24); `WEAPON_FAMILY[*].critMultiplierBonus`
   * to oś ARCHETYPU (dziś topór i sztylet). Składają się, nie zastępują —
   * dzięki temu przyszła broń z własną, dodatkową premią PRZEDMIOTU (obok
   * tego, co niesie jej rodzina) policzy się tą samą ścieżką, bez wyjątku.
   *
   * ⚠ **Rodzina dokłada się do SIŁY krytyka, nigdy do szansy.** Szansa ma cap
   * (`maxCritChance`) i dzieli go z Zręcznością oraz sprzętem; rozdział jest
   * zamierzony: **Zręczność mówi jak często, rodzina Axe jak mocno.**
   */
  get critMultiplier(): number {
    const f = this.family;
    // `in`, nie `?.` — `WEAPON_FAMILY` jest `as const`, więc typem jest unia
    // wpisów o RÓŻNYCH polach i wspólnego `critMultiplierBonus` tam nie ma.
    // Ta sama technika, którą czytają `itemHands`/`itemRequirements`.
    const zRodziny = familyTraitValue(f, "critMultiplierBonus");
    return PLAYER.critMultiplier + (Equipment.weaponMelee?.critMultiplierBonus ?? 0) + zRodziny;
  }

  // ── Tożsamość rodziny broni ────────────────────────────────────────────
  //
  // ⚠ To jest JEDYNE miejsce, w którym rodzina jest rozwiązywana — tak samo
  // jak warianty ataku wyżej. `GameScene`, `Player` i `Enemy` o rodzinach nie
  // wiedzą i wiedzieć nie mają; czytają te same gettery, co zawsze. Drugi
  // resolver gdziekolwiek indziej znaczy, że fundament jest zepsuty.

  /** Wpis z `WEAPON_FAMILY` dla założonej broni, albo `null` — gołe ręce i
   *  broń świadomie spoza rodzin (kij). `null` znaczy „zachowuj się dokładnie
   *  tak, jak przed wprowadzeniem rodzin". */
  get family(): (typeof WEAPON_FAMILY)[WeaponFamily] | null {
    const id = Equipment.weaponFamily;
    return id ? WEAPON_FAMILY[id] : null;
  }

  // ── ŁADUNKI MASTERY (§14, wdrożone 2026-09-02) ─────────────────────────
  //
  // ⚠ **Wszystkie czytają RANGĘ WYKUPIONĄ w rodzinie ZAŁOŻONEJ BRONI**
  // (`WeaponProficiency.masteryOf`), nigdy `P` ani progu (§34.5). Biegłość
  // steruje osobno: jakością wykonania (warstwa 2), sufitem, softzone
  // i `P_start`.
  //
  // ⚠ **Ładunek działa tylko wtedy, gdy trzymasz broń Z TEJ rodziny.**
  // Wykupione M-IV toporem nie robi nic dla miecza w ręku — i to jest cały
  // sens biegłości per rodzina, nie skutek uboczny.

  /** Mnożnik cechy rodziny — **przykładany do EFEKTU**, nie do pola (D1). */
  private get traitMul(): number {
    return WeaponProficiency.traitMultiplier(Equipment.weaponFamily);
  }

  /**
   * **Koszt staminy jednego zamachu** (§24a + ładunek ekonomii wysiłku).
   *
   * ```
   * C × swingDurationMs/1000 × (1 − redukcja_Mastery)
   * ```
   *
   * ⚠ **Czyta `this.swingDurationMs`, czyli czas PO wszystkich mnożnikach**
   * (wariant, tarcza, Zręczność, stan „Wyczerpany"). Dzięki temu `stamina/s`
   * przy ciągłym biciu jest **niezmiennikiem Zręczności i stanu zmęczenia** —
   * tempo i koszt jadą na tej samej liczbie, więc iloraz się nie rusza.
   * To jest test 7a/7b z §29 spełniony konstrukcyjnie, nie przez strojenie.
   */
  get swingStaminaCost(): number {
    const reduction = WeaponProficiency.effortReduction(Equipment.weaponFamily);
    // ⚠⚠ **Wysiłek liczy się z zamachu BEZ przyspieszenia z Dual Wieldu**
    //   (2026-09-05). Koszt jest proporcjonalny do długości zamachu, a DW skraca
    //   zamach i cooldown tym samym mnożnikiem — więc przed tą zmianą stamina na
    //   sekundę w DW nie rosła ani o punkt, mimo +24% ciosów. Zmierzone:
    //   DW miecz+sztylet 3,71/s wobec 3,96/s samego miecza, czyli DW był TAŃSZY.
    //   ⚠ Reguła w jednym zdaniu: **szybciej machać wolno, machać taniej nie.**
    //   ⛔ To NIE dotyka tarczy — `blockSpec.swingMul` zostaje w `swingDurationMs`,
    //     bo tarcza zamach SPOWALNIA i ma prawo czynić go droższym.
    const dlugoscWysilku = this.swingDurationMs / Equipment.dualWieldSwingMul;
    return STAMINA.costs.autoAttackPerSecond * (dlugoscWysilku / 1000) * (1 - reduction);
  }

  /**
   * **`φ` — ułamek rozstrzału odcięty od dołu przy losowaniu KRYTYKA** (D2).
   * Zero poza rodzinami, których cechą jest siła krytyka (topór, sztylet).
   *
   * ⚠ **Obecność `critMultiplierBonus` służy tu wyłącznie do ROZPOZNANIA
   * rodziny — ta liczba nie jest ruszana ani czytana jako mnożnik.** D2
   * odebrało jej rolę nośnika cechy Mastery; zakaz z §13 („Mastery nie dotyka
   * czterech liczb krytyka") obowiązuje bez zmian.
   */
  get critLowCut(): number {
    const f = this.family;
    if (!familyHasTrait(f, "critMultiplierBonus")) return 0;
    return WeaponProficiency.critLowCut(Equipment.weaponFamily);
  }

  /**
   * Jak długo (ms) trafienie tą bronią zawiesza uchwyt AI na ciele celu.
   * 0, gdy broń nie należy do rodziny obuchowej.
   *
   * ⚠ **To NIE jest przerwanie.** Zachwianie rusza wyłącznie ruch i niczego
   * nie kasuje; `interrupts` zostaje osobną własnością konkretnych broni.
   * Patrz `WEAPON_FAMILY.blunt`.
   */
  get staggerMs(): number {
    const f = this.family;
    const stagger = familyTraitValue(f, "staggerMs");
    if (stagger <= 0) return 0;
    // Cecha rodziny obuchowej — mnożona przez rangę Mastery: 50 → 75 → 100 ms.
    // ⚠ **Tu FIELD ≡ EFFECT**, bo ten getter zwraca pole wprost: D1 jest dla
    // obucha no-opem i **nie dorabiamy mu osobnej ścieżki „bo nic nie robi"**.
    return stagger * this.traitMul;
  }

  /**
   * **Dodatek do parowania z KONSTRUKCJI trzymanej broni** (`melee.parryBonus`).
   *
   * ⚠⚠ **Czytane z broni, nie z rodziny** (2026-09-16). Wcześniej stało tu
   * `familyTraitValue(this.family, "parryBonus")`, przez co każdy miecz parował
   * tak samo — rapier nie miał jak być lepszy, a tasak nie miał jak nie być.
   * Rodzina niesie dziś sam znacznik `parry`; liczba należy do konstrukcji.
   */
  get weaponParryBonus(): number {
    return this.melee.parryBonus ?? 0;
  }

  // ── Attack Resolver: Dodge / Parry (Combat v1, 2026-08-24) ─────────────
  //
  // ⚠ Obie liczby to WEJŚCIA do PRD (`core/Defense.ts`), nie same szanse per
  // cios — `Defense.rollDodge`/`.rollParry` przyjmują to `p` jako
  // DŁUGOTERMINOWĄ docelową średnią, nie próg pojedynczego rzutu.

  /**
   * Wszechkierunkowa szansa uniku. Baza + Zręczność + premia za LEKKOŚĆ.
   *
   * ⚠⚠ **Premia wisi na MASIE BEZWZGLĘDNEJ, nie na klasie obciążenia — i to
   * jest naprawa realnej inwersji (`OI-104`, 2026-09-15).** Do tej daty warunek
   * brzmiał `Equipment.loadMultiplier <= 1.0`, czyli pytał o `ratio`. Ponieważ
   * `ratio` maleje z Siłą, **postać w 75,5 kg pełnej płyty przy Sile 50
   * wpadała do klasy „Lekkie" i dostawała premię ZA LEKKOŚĆ.** Premia za coś,
   * czego build nie ma, jest gorsza niż brak premii.
   *
   * ⚠ **Skala jest CIĄGŁA, nie binarna**, bo taka jest reguła całego Modelu D
   * — i dzięki temu naprawa nie wymagała wymyślania nowego progu w kilogramach.
   * Premia jest ułamkiem tego, ile z kary ruchu jeszcze NIE zapłacono:
   * pełna przy masie poniżej `speedFreeKg`, gasnąca ku podłodze prędkości.
   * Zmierzone: 12 kg → ×1,30 (bez zmian wobec dzisiejszego stanu) · 47,5 kg →
   * ×1,11 · 75,5 kg → ×1,02.
   *
   * ⛔ **Siła nie ma na tę premię wpływu i nie wolno jej tu dopisać.**
   */
  get dodgeChance(): number {
    const base = DEFENSE.dodge.base + this.agility * DEFENSE.dodge.perAgility;
    const zakres = 1 - EQUIPMENT_LOAD.speedFloor;
    const lekkosc =
      zakres > 0
        ? Math.min(1, Math.max(0, (Equipment.speedMultiplier - EQUIPMENT_LOAD.speedFloor) / zakres))
        : 1;
    const lightBonus = 1 + (DEFENSE.dodge.lightLoadBonus - 1) * lekkosc;
    return Math.min(DEFENSE.dodge.cap, base * lightBonus);
  }

  /**
   * Frontalna szansa Parry. **Zero, jeśli trzymana KONSTRUKCJA nie deklaruje
   * `melee.parryBonus`** — a nie „jeśli broń nie jest mieczem". Rodzina
   * decyduje tylko o tym, czy ranga Mastery ma co podnosić.
   */
  get parryChance(): number {
    const bonus = this.weaponParryBonus;
    if (bonus <= 0) return 0;
    // ⚠ **Mnożnik rangi wchodzi na WYNIK, nie na `parryBonus`** (D1) —
    // zmierzone: EFFECT daje 5,75% → 8,63% → 11,50%, FIELD tylko 6,13% →
    // 6,50%, bo pole jest modyfikatorem rdzenia i mnoży się wyłącznie dodatek
    // nad nim. Cap zostaje nietknięty i nie jest wiążący (M-IV to niecała
    // ćwiartka sufitu).
    return Math.min(DEFENSE.parry.cap, DEFENSE.parry.core * (1 + bonus) * this.traitMul);
  }

  /** The equipped weapon's melee shape, or bare hands'. The BASE shape —
   *  the active variant's multipliers are applied by the getters below. */
  get melee(): MeleeShape {
    return Equipment.weaponMelee ?? PLAYER.melee;
  }

  // ── Warianty podstawowego ataku ────────────────────────────────────────
  //
  // This class is the ONLY place a variant is applied. GameScene, Player and
  // Enemy know nothing about variants — they keep reading the same getters
  // they always read, which is what let one weapon grow two basic attacks
  // without touching the combat core (C-01..C-05 unchanged).

  /** Every way the equipped weapon can be used; bare hands fall back to
   *  PLAYER.attacks. Always at least one entry. */
  get attackVariants(): readonly AttackVariant[] {
    return Equipment.weaponAttacks ?? PLAYER.attacks;
  }

  /** Which one is selected, clamped — a weapon swap can leave a stale index
   *  behind for one frame before `emitChanged` resets it. */
  get activeVariantIndex(): number {
    return Math.min(Math.max(Equipment.activeAttack, 0), this.attackVariants.length - 1);
  }

  get activeVariant(): AttackVariant {
    return this.attackVariants[this.activeVariantIndex];
  }

  /** What the next swing will deal. Frozen into `pendingSwing` at swing start
   *  so switching stance mid-swing cannot change a blow already thrown. */
  get damageType(): DamageType {
    return this.activeVariant.damageType;
  }

  /** One multiplier off the active variant; absent means 1. */
  private variantMul(key: "reachMul" | "damageMul" | "swingMul" | "thrustMul" | "sweepMul"): number {
    return this.activeVariant[key] ?? 1;
  }

  // ⚠⚠ **`attackArcDeg` USUNIĘTY 2026-09-18.** Zwracał pół-kąt klina broni,
  //   a jedynym jego konsumentem było Szerokie cięcie; autoatak łuku nie pyta.
  //   Kąt jest dziś własnością umiejętności (`ABILITIES.cleave.halfArcDeg`).
  //   ⛔ Nie odtwarzaj tego gettera — patrz `MeleeShape`.

  /** How far the arc reaches from the player (px). */
  get attackReach(): number {
    return this.melee.reach * this.variantMul("reachMul");
  }

  /**
   * **Dolna granica zasięgu tego ciosu** (px prześwitu). `0` = broń nie ma
   * martwej strefy, czyli zachowanie sprzed 2026-09-16.
   *
   * ⚠ **Skaluje się TYM SAMYM `reachMul`, co zasięg górny** — wariant, który
   * skraca broń, skraca też jej martwą strefę. Inaczej wariant „krótki chwyt"
   * zbliżałby górną granicę do dolnej i mógłby zamknąć okno trafienia do zera.
   */
  get attackMinReach(): number {
    return (this.melee.minReach ?? 0) * this.variantMul("reachMul");
  }

  /**
   * Knockback impulse this weapon applies. Zero for everything but blunt —
   * see COMBAT_FEEDBACK.knockbackDurationMs for why.
   *
   * ⚠ REGUŁA ZAWĘŻANIA: the multiplier is clamped to ≤1, so a variant can only
   * ever give up part of the weapon's knockback. A weapon with none (every one
   * but the hammer) stays at zero however its variants are written — which is
   * what stops the axe's Obuch from awarding itself the hammer's shove.
   */
  get knockback(): number {
    return this.melee.knockback * Math.min(1, Math.max(0, this.activeVariant.knockbackMul ?? 1));
  }

  /**
   * Whether hits from this weapon cancel an enemy's wind-up.
   *
   * ⚠ Same narrowing rule: the weapon has to declare it and the variant may
   * only switch it OFF (`interrupts` is typed `false`, so `true` will not
   * compile). This is what will let the planned halberd interrupt with its
   * hook and not with its blade or its point, while keeping interrupt out of
   * reach of any weapon that never had it.
   */
  get interrupts(): boolean {
    return this.melee.interrupts === true && this.activeVariant.interrupts !== false;
  }

  /**
   * Attack-speed bonus from Agility as a fraction (0.3 = +30% faster), capped
   * by ATTRIBUTES.maxAttackSpeedBonus. Expressed as a *bonus* rather than a
   * multiplier so the UI can print "+30%" without doing arithmetic.
   */
  get attackSpeedBonus(): number {
    // Gear bonuses AND the equipped weapon's workmanship go INSIDE the cap, not
    // on top of it. The cap isn't only balance — swingDurationMs scales by this
    // same number, so an uncapped total would let the next swing start before
    // the attack pose finishes and the sprite visibly stutters. Neither a ring
    // nor a Mistrzowski blade may buy past that.
    return Math.min(
      this.agility * ATTRIBUTES.attackSpeedPerAgility +
        Equipment.bonusAttackSpeed +
        Equipment.weaponQualitySpeed,
      ATTRIBUTES.maxAttackSpeedBonus,
    );
  }

  /**
   * Seconds between allowed attacks: the equipped weapon's own pace (bare-hands
   * PLAYER.attackCooldown if nothing's equipped), divided by the Agility
   * attack-speed bonus. This is Agility's headline effect — it scales every
   * weapon by the same factor, so unlike flat damage it never plays favourites
   * between the dagger and the hammer.
   */
  get attackCooldown(): number {
    const base = Equipment.weaponAttackCooldown ?? PLAYER.attackCooldown;
    return (base * this.swingMul) / (1 + this.attackSpeedBonus) / Stamina.attackSpeedMultiplier;
  }

  /**
   * Wszystko, co spowalnia zamach, w jednym miejscu: wariant ataku × druga
   * ręka.
   *
   * ⚠ Istnieje po to, żeby `attackCooldown` i `swingDurationMs` **nie mogły się
   * rozjechać**. Obie muszą mnożyć DOKŁADNIE to samo — gdyby tarcza trafiła
   * tylko w cooldown, kolejny zamach ruszałby przed końcem pozy i sprite by się
   * rwał; gdyby tylko w czas zamachu, tarcza wydłużałaby ukorzenienie, nie
   * zmieniając tempa, czyli byłaby czystą karą bez ceny po drugiej stronie.
   * Dwa wywołania tego samego gettera nie potrafią się pomylić, dwa osobne
   * wyrażenia potrafią.
   *
   * ⚠ Mnożniki się SKŁADAJĄ (wariant × tarcza) i to jest zamierzone, ale ma
   * granicę: `swingDurationMs` nie może przekroczyć `attackCooldown`, bo poza
   * ataku zacznie się rwać. Dziś zapas jest duży (miecz: 180 ms pozy w cyklu
   * 500 ms), ale nieskończony nie jest — przy dokładaniu broni dwuręcznej
   * trzeba to sprawdzić, nie założyć.
   */
  private get swingMul(): number {
    return this.variantMul("swingMul") * Equipment.offhandSwingMul;
  }

  /** ⚠ Ten SAM mnożnik, którym jedzie ręka główna — patrz `offhandSwingDurationMs`.
   *  Osobne wyrażenie rozjechałoby kadencję obu rąk przy pierwszej zmianie. */
  get swingMulPublic(): number {
    return this.swingMul;
  }

  /**
   * Swing tween timing (visual feel) for the equipped weapon, bare-hands
   * default otherwise — scaled by the same attack-speed bonus as the cooldown.
   * Both must move together: leaving the animation at its base duration while
   * the cooldown shrinks would let the next swing start before the previous
   * pose finished, which reads as the sprite stuttering mid-attack.
   */
  get swingDurationMs(): number {
    const base = Equipment.weaponSwing?.durationMs ?? PLAYER.swing.durationMs;
    // ⚠ `Stamina.attackSpeedMultiplier` MUSI trafić i tu, i w `attackCooldown`
    // — dokładnie ta sama para, co `swingMul`. Rozjazd między nimi rwie pozę
    // ataku; komentarz przy `swingMul` opisuje ten sam mechanizm.
    // ⚠ `swingMul` MUST land here as well as on attackCooldown. Shortening the
    // cooldown alone lets the next swing start before the pose finishes (the
    // stutter `maxAttackSpeedBonus` is capped to avoid). Two things ride along
    // for free by being derived from this number: the commitment root
    // (`Player.rootedUntil`) and the moment the blow lands
    // (`PLAYER.swingHitFraction`) — so a quick thrust roots for less time than
    // a full cut without a single extra field. The shield's own penalty rides
    // the same number, so a heavy shield lengthens the root it exists to cover.
    return (base * this.swingMul) / (1 + this.attackSpeedBonus) / Stamina.attackSpeedMultiplier;
  }

  /**
   * O ile Zręczność skraca ODZYSKANIE po zamachu (0..maxRecoveryReduction).
   * Wyrażone jako redukcja, nie mnożnik, żeby UI mogło wypisać „−20%" bez
   * arytmetyki — ta sama konwencja, co `attackSpeedBonus`.
   */
  get recoveryReduction(): number {
    return Math.min(
      this.agility * ATTRIBUTES.recoveryPerAgility,
      ATTRIBUTES.maxRecoveryReduction,
    );
  }

  /**
   * Jak długo zamach UKORZENIA gracza (ms) — i to jest tożsamość Zręczności.
   *
   * Zamach dzieli się na dwie części, których **nie wolno skracać tak samo**:
   *
   *  • **ZOBOWIĄZANIE** — do klatki trafienia (`PLAYER.swingHitFraction`).
   *    To jest zapowiedź: czas, w którym poza mówi przeciwnikowi i graczowi,
   *    co się właśnie dzieje. Zręczność go **nie tyka**; skracanie zapowiedzi
   *    to psucie czytelności, a nie nagroda za build.
   *  • **ODZYSKANIE** — reszta zamachu plus bufor 40 ms. Tu Zręczność tnie.
   *
   * ⚠ **Do 2026-08-20 root wynosił po prostu `zamach + 40` i to sprawiało, że
   * inwestowanie w Zręczność ZMNIEJSZAŁO wolny czas na sekundę** (zmierzone:
   * 560 → 541 ms/s przy ZRĘ 20), bo zamach skalował się przez `1/(1+bonus)`,
   * a stałe `+40` nie skalowało się wcale. ⚠ Samo przeskalowanie tego `+40`
   * dawało dokładnie ZERO (560 ms/s przy każdej wartości) — dlatego rozdział,
   * a nie poprawka stałej. Po zmianie: 550 → 604 ms/s przy ZRĘ 10.
   *
   * ⚠ **Przy ZRĘ 0 wynik jest identyczny jak dawniej** (`zamach + 40`), więc
   * postać, która w Zręczność nie inwestuje, nie traci ani milisekundy.
   *
   * ⚠ **To NIE jest zaparkowany globalny `MAX_ROOT_MS`** (`docs/odlozone.md`
   * §5). Tamto to wspólny SUFIT dla wszystkich broni, odrzucony pomiarem na
   * 120 trójkach; to jest skalar per punkt atrybutu. Nie mylić — wracają jako
   * ten sam pomysł co kilka sesji.
   *
   * ⚠ **`Player.attackPoseUntil` zostaje `zamach + 40` i NIE idzie za tym.**
   * Poza to animacja i kierunek osłony (`Player.guardDir`), a nie zobowiązanie
   * ciała. Skutek zamierzony: gracz o wysokiej Zręczności rusza się już
   * podczas ogona pozy, mając tarczę wciąż zwróconą w stronę ciosu — czyta się
   * to jako „jeszcze się składasz". Patrz `docs/atrybuty.md` §10.5.
   */
  get rootDurationMs(): number {
    return this.rootDurationForSwing(this.swingDurationMs);
  }

  /**
   * Ukorzenienie wyprowadzone z DOWOLNEGO czasu zamachu.
   *
   * ⚠ **Istnieje, bo off-hand ma własny czas zamachu** (Dual Wield, 2026-09-05),
   * a ukorzenienie musi z niego wynikać — inaczej cios krótszą bronią
   * przyszpilałby postać na czas dłuższej. `rootDurationMs` deleguje tutaj,
   * więc arytmetyka została w JEDNYM miejscu.
   */
  rootDurationForSwing(swingMs: number): number {
    const swing = swingMs;
    const zobowiazanie = swing * PLAYER.swingHitFraction;
    // ⚠ Zmęczenie wydłuża WYŁĄCZNIE odzyskanie, nigdy zobowiązania. Zapowiedź
    // ciosu jest informacją dla przeciwnika i dla gracza; rozciąganie jej,
    // bo postać jest zmęczona, psuje czytelność zamiast ją zmieniać.
    const odzyskanie = (swing * (1 - PLAYER.swingHitFraction) + PLAYER.swingPoseBufferMs) *
      (1 - this.recoveryReduction) * Stamina.recoveryMultiplier;
    return zobowiazanie + odzyskanie;
  }

  get swingThrustPx(): number {
    return (Equipment.weaponSwing?.thrustPx ?? PLAYER.swing.thrustPx) * this.variantMul("thrustMul");
  }

  /**
   * How far the blade sweeps during the swing (degrees each way).
   *
   * Was a bare constant read straight from `PLAYER.swing.arcDeg`. It is a
   * getter now for one reason: with a single attack FRAME per direction, the
   * sweep/thrust pair is the only thing on screen that can tell a cut from a
   * stab. Big sweep + small thrust = cięcie; small sweep + big thrust =
   * pchnięcie. No new art, no second animation system.
   */
  get swingSweepDeg(): number {
    return PLAYER.swing.arcDeg * this.variantMul("sweepMul");
  }

  /** XP required to advance from `level` to `level + 1`. */
  xpToNext(level: number = this.level): number {
    if (level >= PROGRESSION.maxLevel) return Infinity;
    return Math.round(PROGRESSION.baseXp * Math.pow(PROGRESSION.growth, level - 1));
  }

  get isMaxLevel(): boolean {
    return this.level >= PROGRESSION.maxLevel;
  }

  /**
   * Award XP, rolling over as many levels as it covers (a single big reward can
   * cross more than one). Emits `xpChanged` always, and `leveledUp` once per
   * level gained — callers drive UI and feedback off those, never off polling.
   */
  addXp(amount: number): void {
    if (amount <= 0 || this.isMaxLevel) return;
    this.xp += amount;
    this.totalXp += amount;

    while (!this.isMaxLevel && this.xp >= this.xpToNext()) {
      this.xp -= this.xpToNext();
      this.level++;
      this.skillPoints += PROGRESSION.skillPointsPerLevel;
      GameEvents.emit(EVENT.leveledUp, {
        level: this.level,
        skillPoints: this.skillPoints,
        gained: PROGRESSION.skillPointsPerLevel,
      });
    }

    // At max level there is nothing left to fill; park the bar full.
    if (this.isMaxLevel) this.xp = 0;
    this.emitXp();
  }

  /**
   * Put one skill point into an attribute. Returns false (and changes nothing)
   * when there are none left, so callers can stay dumb about the balance.
   *
   * Raising Endurance raises max HP; the caller listening for
   * `attributesChanged` is responsible for granting the player the new headroom
   * rather than leaving the HP bar suddenly short of full.
   */
  spendPoint(attr: Attribute): boolean {
    if (this.skillPoints <= 0) return false;
    this.skillPoints--;
    this[attr]++;
    this.emitAttributes();
    this.emitXp();
    return true;
  }

  /**
   * Spend `n` points on something that isn't an attribute (currently: learning
   * a skill from a trainer). All-or-nothing — it never leaves the player
   * partially charged, which matters because Skills.learn has to take gold and
   * points together and must be able to bail cleanly if either is short.
   */
  spendSkillPoints(n: number): boolean {
    if (n < 0 || this.skillPoints < n) return false;
    if (n === 0) return true;
    this.skillPoints -= n;
    this.emitAttributes();
    this.emitXp();
    return true;
  }

  reset(): void {
    this.level = 1;
    this.xp = 0;
    this.skillPoints = 0;
    this.totalXp = 0;
    this.strength = 0;
    this.vitality = 0;
    this.conditioning = 0;
    this.agility = 0;
    Stamina.refill();
    Defense.reset();
    this.emitAttributes();
    this.emitXp();
  }

  emitAttributes(): void {
    // ⚠ Pula staminy wynika z Kondycji, więc PRZELICZ ją, zanim ktokolwiek
    // odczyta zdarzenie. Jedno miejsce, przez które przechodzi każda zmiana
    // atrybutów — awans, wydanie punktu, wczytanie zapisu i `reset()` — więc
    // nie da się dodać ścieżki, która o tym zapomni.
    Stamina.syncMax(this.conditioning);
    GameEvents.emit(EVENT.attributesChanged, {
      strength: this.strength,
      vitality: this.vitality,
      conditioning: this.conditioning,
      agility: this.agility,
      damage: this.meleeDamage,
      maxHp: this.maxHp,
      maxStamina: Stamina.max,
      critChance: this.critChance,
      attackSpeedBonus: this.attackSpeedBonus,
      skillPoints: this.skillPoints,
    });
  }

  emitXp(): void {
    GameEvents.emit(EVENT.xpChanged, {
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext(),
      skillPoints: this.skillPoints,
      totalXp: this.totalXp,
    });
  }
}

export const Progression = new ProgressionState();

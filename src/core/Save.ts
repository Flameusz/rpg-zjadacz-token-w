import { Progression } from "./Progression";
import { Inventory, type InventorySlot } from "./Inventory";
import { Equipment, BAG_SLOTS, LAYERED_AREAS, layeredSlot, type LayeredArea } from "./Equipment";
import { ARMOR_LAYERS, itemLayer, type ArmorLayer } from "./ArmorLayers";
import { Stamina } from "./Stamina";
import { Quests, type QuestId, type QuestStatus } from "./Quests";
import { TrackedQuest } from "./TrackedQuest";
import { Skills, type SkillId } from "./Skills";
import { Exploration, REVEALED_ALL } from "./Exploration";
import { ArmorTraining } from "./ArmorTraining";
import { ShieldSkill } from "./ShieldSkill";
import { WeaponProficiency } from "./WeaponProficiency";
import { Abilities } from "./Abilities";
import { Dialogue } from "./Dialogue";
import { Gathering } from "./Gathering";
import { Session } from "./Session";
import { WorldState } from "./WorldState";
import { Vitals } from "./Vitals";
import { GameEvents, EVENT } from "./EventBus";
import { INVENTORY, MAP_FOG, MAP_LABEL } from "../config/GameConfig";
import { containerSlots, type ItemId } from "./Items";
import { normalizeInstance, type ItemInstance } from "./Quality";

/**
 * How a worn item is stored. The union is the migration: pre-quality saves hold
 * a bare id, everything since holds a whole copy. See the note on
 * `SaveData.equipment`.
 */
type StoredEquip = ItemId | ItemInstance | null;

/**
 * Read either stored shape back as a copy.
 *
 * A bare id — a character saved before craftsmanship existed — becomes a
 * standard (Zwykła) copy at full durability, which is exactly the promise the
 * system makes: **nothing anyone already owns gets worse than it was.**
 */
function readEquipped(raw: StoredEquip | undefined): ItemInstance | null {
  if (!raw) return null;
  return normalizeInstance(typeof raw === "string" ? { itemId: raw, qty: 1 } : raw);
}

/**
 * Which save this is.
 *
 * `"auto"` is written by the listeners at the bottom of this file, on every
 * change, exactly as the single save always was. `1`–`3` are written only when
 * the player asks (the PlayerPanel "ZAPIS" tab). The split is the whole design:
 * the autosave keeps this file's original guarantee — **nothing is ever lost
 * between sessions** — while a manual slot is a checkpoint the player *chose*,
 * which is the only thing that makes going back to one meaningful.
 *
 * Autosaving into whichever slot was last loaded would collapse the two: there
 * would be no way to return to a decision, because the decision would have been
 * overwritten by the act of continuing past it.
 */
export type SlotId = "auto" | 1 | 2 | 3;

/** The manual slots, in display order. Three because a save list is scanned,
 *  not read — a phone screen with ten rows is a filing cabinet. */
export const MANUAL_SLOTS: readonly SlotId[] = [1, 2, 3];
/** Every slot, autosave first — the order both the title screen and the panel
 *  list them in. */
export const ALL_SLOTS: readonly SlotId[] = ["auto", ...MANUAL_SLOTS];

export const SLOT_LABEL: Record<string, string> = {
  auto: "Autozapis",
  "1": "Slot 1",
  "2": "Slot 2",
  "3": "Slot 3",
};

/**
 * **The autosave deliberately keeps the ORIGINAL key.** That is the entire
 * migration: every character saved before slots existed simply *is* the
 * autosave now, with no conversion step to get wrong and nobody's progress
 * discarded to pay for a UI feature.
 */
function storageKey(slot: SlotId): string {
  return slot === "auto" ? "rpg-save" : `rpg-save-${slot}`;
}

/** Bump whenever the shape below changes INCOMPATIBLY — and from 2026-10-11
 *  every bump ships with a migration in `MIGRACJE` (see the policy below).
 *  ⚠ Until then a mismatched save was simply discarded; v2 was the last one
 *  that went that way.
 *
 *  v3: the shape is untouched, but the *meaning* of `progression` changed —
 *  the XP curve, the points-per-level budget and the per-point bonuses were
 *  all rebalanced. A v2 save would restore a character with ~3× the intended
 *  skill points at a level the new curve never awards, so it's discarded too.
 *
 *  **Slots and `world`/`meta` did NOT bump this**, on purpose: both new fields
 *  are optional and default cleanly (no recorded position → the map's own spawn
 *  point, exactly the pre-slots behaviour), and the autosave kept the original
 *  storage key. Wiping every existing character to gain a slot list would have
 *  been the worst possible trade. */
const SAVE_VERSION = 3;

/**
 * ⭐⭐ **POLITYKA ZAPISU (`OI-51`, 2026-10-11): niezgodny zapis się MIGRUJE,
 * nie kasuje.** Do tej daty obowiązywało „obca wersja = nowa gra, nigdy
 * migracja" — poprawne w prototypie, nie do przyjęcia u gracza, który ma
 * dziesiątki godzin postaci (autor gra na bieżąco). Trzy reguły:
 *
 * 1. **Pole addytywne nadal NIE podbija wersji** (opcjonalne + domyślne
 *    w `load`) — to zostaje najtańszą drogą i obowiązuje dalej.
 * 2. **Podbicie `SAVE_VERSION` WYMAGA migracji** `MIGRACJE[stara]`, która
 *    przerabia zapis o jedną wersję w górę. Zmiana ZNACZENIA (jak v3:
 *    przestrojona krzywa XP i punkty) to też migracja — np. zwrot punktów do
 *    ponownego rozdania — nigdy skasowanie postaci. Przymiar
 *    `tools/zapis_weryfikacja.mjs` §G świeci na czerwono przy luce w łańcuchu.
 * 3. **Czego ta wersja NIE umie wczytać, tego nie niszczy**: zapis z NOWSZEJ
 *    wersji gry (cofnięty build), ze zbyt starej albo uszkodzony trafia do
 *    kopii `<klucz>-kopia-v<wersja>` ZANIM zostanie nadpisany autozapisem albo
 *    usunięty „Nową grą". Tak samo oryginał przed pierwszym zapisem po
 *    migracji — błąd w migracji nie może zabrać jedynej kopii postaci.
 *
 * `MIN_WERSJA` — najstarszy zapis, jaki ten build umie przenieść. 3, bo v2
 * został świadomie porzucony przy przestrojeniu (patrz wyżej) i w obiegu go nie
 * ma; podniesienie progu znaczy „porzucam starsze zapisy" i wymaga decyzji.
 */
export const MIN_WERSJA = 3;
type SurowyZapis = Record<string, unknown> & { version?: unknown };
/** `MIGRACJE[n]` przerabia zapis z wersji `n` na `n + 1`. Pusta, dopóki
 *  `SAVE_VERSION` się nie ruszy. */
export const MIGRACJE: Readonly<Record<number, (d: SurowyZapis) => SurowyZapis>> = {};

/**
 * Doprowadź zapis do `docelowa` łańcuchem migracji. `null` = nie da się
 * (nowsza wersja, starsza niż `min`, brak ogniwa, wyjątek w migracji) — i wtedy
 * NIC nie zostało zmienione: migracje dostają kopię, nie oryginał.
 * Czysta funkcja z parametrami, żeby przymiar sprawdził ją na sztucznym łańcuchu.
 */
export function migruj(
  surowy: SurowyZapis,
  docelowa: number = SAVE_VERSION,
  min: number = MIN_WERSJA,
  migracje: Readonly<Record<number, (d: SurowyZapis) => SurowyZapis>> = MIGRACJE,
): SurowyZapis | null {
  const v = surowy.version;
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > docelowa) return null;
  let d: SurowyZapis = JSON.parse(JSON.stringify(surowy));
  for (let w = v; w < docelowa; w++) {
    const krok = migracje[w];
    if (!krok) return null;
    try {
      d = krok(d);
    } catch {
      return null;
    }
    d.version = w + 1;
  }
  return d;
}

interface SaveData {
  version: number;
  progression: {
    level: number;
    xp: number;
    totalXp: number;
    skillPoints: number;
    strength: number;
    /**
     * ⚠ **Stary atrybut, pisany do 2026-08-21.** Kondycja rozpadła się wtedy
     * na Witalność (HP) i Kondycję (stamina). Pole zostaje **wyłącznie do
     * ODCZYTU zapisów sprzed rozdziału** i jest opcjonalne po obu stronach —
     * dzięki temu `SAVE_VERSION` NIE musiał się ruszyć, a żadna istniejąca
     * postać nie została skasowana. Loader mapuje je na Witalność, czyli stara
     * postać zachowuje co do punktu swoje maks. HP, a Kondycja startuje pusta
     * (nowy atrybut = nowa decyzja, nie darmowe punkty).
     */
    endurance?: number;
    vitality?: number;
    conditioning?: number;
    agility: number;
  };
  /** Bieżąca stamina. Opcjonalna: zapis sprzed systemu wysiłku wczytuje się
   *  jako pełna pula. */
  stamina?: number;
  /**
   * `quickSlot` is optional: it was added after v3 shipped, and a save without
   * it loads perfectly well as "nothing bound". Bumping SAVE_VERSION for a
   * purely additive field would have wiped real progress to gain nothing, so
   * the loader defaults it instead — see load().
   */
  inventory: { gold: number; slots: (InventorySlot | null)[]; quickSlot?: ItemId | null };
  /**
   * ⚠ Kept deliberately loose so `SAVE_VERSION` did NOT have to move when
   * craftsmanship quality arrived.
   *
   * A pre-quality save wrote a worn item as a **bare item id**; from the quality
   * system on it is a whole copy (`ItemInstance`, carrying quality and wear).
   * Both shapes load — see `readEquipped` — so every character saved before this
   * feature keeps their gear, at Zwykła and full durability. Backpack slots need
   * no such union: they were already objects, and the two new fields are simply
   * absent in an old one.
   *
   * The same additive trick as `quickSlot`, the ring slots and `questProgress`.
   * Wiping real progress to gain a stat modifier would be the worst possible
   * trade.
   */
  /** `ring1`/`ring2`/`offhand` are optional for the same reason `quickSlot` is:
   *  each slot was added after v3 shipped, and a save without it loads fine as
   *  "nothing worn there". Bumping SAVE_VERSION for a purely additive field
   *  would wipe real progress to gain nothing — the loader defaults them
   *  instead. This is now the THIRD slot added this way, which is the evidence
   *  the trick is right rather than lucky. */
  equipment: {
    weapon: StoredEquip;
    head: StoredEquip;
    chest: StoredEquip;
    legs: StoredEquip;
    boots: StoredEquip;
    ring1?: StoredEquip;
    ring2?: StoredEquip;
    offhand?: StoredEquip;
    gloves?: StoredEquip;
    amulet?: StoredEquip;
    /** ⭐ Szósta rzecz dodana tą drogą (2026-09-16). OPCJONALNE — zapis bez
     *  tego pola wczytuje się jako „puste ramiona”, co jest dokładnie poprawne.
     *  ⛔ `SAVE_VERSION` NIE ruszyło się. */
    shoulders?: StoredEquip;
  };
  /**
   * **Warstwy pancerza** — decyzja `docs/decyzje/2026-09-15-zapis-warstw-pancerza.md`.
   *
   * ⚠⚠ **OPCJONALNE, i to jest cała kompatybilność.** Zapis bez tego pola
   * wczytuje się dokładnie jak dotąd: płaskie `equipment[obszar]` trafia do
   * SWOJEJ rzeczywistej warstwy przez `itemLayer()`. `SAVE_VERSION` NIE ruszyło
   * się — piąta rzecz dodana tą drogą po `quickSlot`, pierścieniach, `offhand`,
   * `stowed` i `bags`.
   *
   * ⚠ **`layers[obszar]` ma PIERWSZEŃSTWO**; płaskie pole jest wtedy wyłącznie
   * KOTWICĄ dla builda, który tej mapy nie zna (najbardziej zewnętrzna warstwa).
   * ⚠ **Warstwy NAZWANE, nie tablica** — `L1+L3` bez `L2` jest legalną zbroją,
   * więc kolejność nie wystarczyłaby do odtworzenia.
   * ⛔ **`offhand`, `weapon`, `stowed` i ręce NIGDY tu nie trafiają.**
   */
  layers?: Partial<Record<LayeredArea, Partial<Record<ArmorLayer, StoredEquip>>>>;
  /**
   * The four bag slots — optional/additive like every equip field above, so
   * `SAVE_VERSION` did not move for this either. Bag slots live outside
   * `equipment` on purpose: they are not `EquipSlot`s (see `BAG_SLOTS` in
   * `core/Equipment.ts`), and mixing the two unions would make `readEquipped`
   * ambiguous about which kind of slot it was reading.
   */
  bags?: { bag1?: StoredEquip; bag2?: StoredEquip; bag3?: StoredEquip; bag4?: StoredEquip };
  /**
   * Drugi zestaw broni (schowany). Opcjonalny i addytywny jak wszystko wyzej,
   * wiec `SAVE_VERSION` nie ruszyl sie i tutaj — to juz czwarta rzecz dodana
   * ta droga (quickSlot, pierscienie, torby, teraz drugi zestaw).
   *
   * WAZNE: stoi POZA `equipment` z tego samego powodu, co `bags`: `weapon2` /
   * `offhand2` nie sa `EquipSlot`-ami (patrz `STOW_SLOTS` w
   * `core/Equipment.ts`), a zmieszanie obu unii uczyniloby `readEquipped`
   * niejednoznacznym co do rodzaju slotu, ktory czyta.
   */
  stowed?: { weapon2?: StoredEquip; offhand2?: StoredEquip };
  quests: Partial<Record<QuestId, QuestStatus>>;
  /**
   * Latched objective counters and the lifetime kill tally. Both optional for
   * the same reason as `quickSlot` and the ring slots: they were added after v3
   * shipped, and a save without them loads perfectly well as "nothing recorded
   * yet". Bumping SAVE_VERSION for purely additive fields would wipe real
   * progress to gain nothing — the loader defaults them instead.
   *
   * The tally is what makes the Szary's death survive a page reload; without it
   * the map's one-off boss came back every time the tab was refreshed.
   */
  questProgress?: Partial<Record<QuestId, number[]>>;
  /** Which `QuestStage` id a multi-stage quest is currently on — see
   *  `Quests.stageSnapshot`. Optional/additive like everything else on this
   *  interface; absent for every save written before `stages` existed, and
   *  for every quest that still only has flat `objectives`. */
  questStages?: Partial<Record<QuestId, string>>;
  /** Composite `questId::stageId` keys of stages whose `onComplete.grant` has
   *  already been applied — see `Quests.grantedStages`'s own doc comment for
   *  why this is a SEPARATE field from `questStages` rather than derived from
   *  it. Optional/additive, same as everything else here. */
  questGrantedStages?: string[];
  kills?: Partial<Record<string, number>>;
  /** Quests whose one-off grant replacement has been used — see
   *  `Quests.replenishGrants`. Unpersisted, a reload would hand out a fresh
   *  replacement every time. */
  questReplenished?: QuestId[];
  /** Which quest the HUD tracker follows (`core/TrackedQuest`). Optional and
   *  additive like everything around it, so `SAVE_VERSION` did not move: a
   *  save without it restores as "track whatever is active", which is the
   *  same rule a fresh accept uses. */
  trackedQuest?: QuestId | null;
  /** Conversation topics already asked (`core/Dialogue`). Optional for the same
   *  additive reason as the fields above — a save without it loads as "hasn't
   *  asked anything yet", which is exactly right for a pre-topics character. */
  topics?: string[];
  /**
   * Herb regrowth bookmarks, `${mapId}:${species}` -> { active, at }. Optional
   * for the same additive reason as everything above it: a save without it
   * loads as "never gathered anywhere", which makes every location full on
   * arrival — exactly right for a character from before gathering existed.
   *
   * This is the SECOND piece of world state to be persisted at all (the first
   * being the Szary's death, which rides on `kills`), and it is worth noting
   * why it is allowed where live enemies still are not: it is a short list of
   * node indices per species per map and it is read once on arrival, whereas
   * persisting live creatures would mean serialising positions, HP and AI
   * state for things that are supposed to be different every time you come
   * back.
   *
   * `active` is which STANOWISKA indices stood grown, not merely how many —
   * see `Gathering`'s own doc comment for why a bare count let an untouched
   * plant "teleport" to a different spot on every map transition.
   */
  gathering?: Record<string, { active: readonly number[]; at: number }>;
  /** Species picked at least once — what gates Dorota's topic about each plant
   *  and stops the one-off real-world fact firing twice. Optional, same
   *  additive reason as everything above it. */
  discovered?: string[];
  skills: SkillId[];
  /**
   * Odkryty teren (`Exploration`, 2026-10-14): obszar → `"kol×wier:base64"`
   * (albo `"*"` — cały). **Opcjonalne, bez podbicia `SAVE_VERSION`.**
   *
   * ⚠ **Brak pola = zapis sprzed Kartografii** i to jest nośne: taka postać
   * miała mapę i minimapę od pierwszej klatki, więc dostaje Kartografię I+II
   * i odkryte Zagaje z lasem (`Save.load`). Nowa gra zapisuje `{}`, nie brak.
   */
  explored?: Record<string, string>;
  /**
   * Ile rang treningu ciężkiego pancerza wykupiono (`ArmorTraining`, Model D /
   * `OI-103`). Liczba, nie lista — rangi są liniowe, więc licznik jest pełnym
   * stanem.
   *
   * **Opcjonalne, więc bez podbicia `SAVE_VERSION`** — ta sama addytywna droga
   * co `quickSlot`, pierścienie i `offhand`. Zapis sprzed treningu wczytuje się
   * jako zero rang i nie traci ani punktu postępu.
   */
  armorTraining?: number;
  /**
   * Umiejętność władania tarczą (`ShieldSkill`, `T-7`): `points` = `P`,
   * `pool` = bufor praktyki poniżej ceny kolejnego punktu.
   *
   * ⚠ **Bufor jedzie razem z `P` i to nie jest nadmiarowość** — bez niego
   * nauka gubiłaby się przy każdym zapisie, a autozapis leci po każdym
   * zdarzeniu. Ta sama para, co `weaponProficiency` + `weaponPractice`.
   *
   * **Opcjonalne, więc bez podbicia `SAVE_VERSION`** — zapis sprzed `T-7`
   * wczytuje się jako `P = 0`.
   */
  shieldSkill?: { points?: number; pool?: number };
  /**
   * Co gracz położył na paskach umiejętności, indeks = slot, `null` = pusty.
   *
   * **Opcjonalne, więc bez podbicia `SAVE_VERSION`** — ta sama addytywna
   * sztuczka co `quickSlot`, pierścienie i `offhand`. Stary zapis wczytuje się
   * z pustym układem, a `Abilities` dokłada odblokowane na wolne sloty przy
   * pierwszym zdarzeniu, więc gracz nie zostaje z pustym paskiem.
   *
   * ⚠ Zapisywany jest wyłącznie UKŁAD, nigdy cooldowny — te są związane z
   * czasem sceny i ich zbankowanie pozwalałoby ominąć 24 sekundy przez wyjście
   * i wejście.
   */
  abilitySlots?: (string | null)[];
  /**
   * **Biegłość gracza w rodzinach broni** (`docs/systemy/proficiency.md`).
   * Rodzina bez wpisu jeszcze nie wystartowała — patrz `WeaponProficiency`.
   *
   * **Opcjonalne, więc bez podbicia `SAVE_VERSION`** — ta sama addytywna
   * sztuczka co `quickSlot`, pierścienie, `offhand` i `abilitySlots`. Stary
   * zapis wczytuje się bez ani jednej rozpoczętej rodziny, co jest dokładnie
   * prawdą o postaci sprzed tego systemu.
   */
  weaponProficiency?: Record<string, number>;
  /**
   * `P_start` per rodzina (§14b) — **nie da się tego odtworzyć z `P`**: rodzina
   * stojąca na 30 mogła zacząć od 25 albo od 0, a od tej różnicy zależy, czy
   * manekin jeszcze uczy. Opcjonalne; brak = „zaczęła tam, gdzie stoi".
   */
  weaponProficiencyStart?: Record<string, number>;
  /** Reszta praktyki poniżej ceny kolejnego punktu. Opcjonalne, addytywne;
   *  brak = pusta pula, czyli strata mniejsza niż jeden punkt. */
  weaponPractice?: Record<string, number>;
  /**
   * **Wykupione rangi Mastery per rodzina** (§34.1) — 1…4, rodzina bez rangi
   * po prostu nie występuje.
   *
   * ⚠ **Pole MUSI istnieć osobno, bo ranga przestała wynikać z `P`** (§34,
   * sesja 8): dwie postacie z tym samym `P` mają różne rangi zależnie od tego,
   * czy zapłaciły u trenera. **Opcjonalne, więc bez podbicia `SAVE_VERSION`** —
   * ta sama addytywna sztuczka co `weaponProficiency`. Zapis sprzed §34
   * wczytuje się z zerem rang; `P` zostaje nietknięte, patrz
   * `WeaponProficiency.restore`.
   */
  weaponMastery?: Record<string, number>;
  /**
   * **Where the character stood, and how hurt they were.**
   *
   * This file used to persist meta-progression only, and said so: a fresh scene
   * always spawned at the map's own point at full HP. That was defensible while
   * there was one autosave and one "Kontynuuj" button — you resumed the
   * *character*, not the *moment*. It stops being defensible the instant the
   * player can press "Zapisz": the whole meaning of saving here is being put
   * back here, and a manual save that quietly relocates you is a broken promise
   * rather than a design decision.
   *
   * Optional, so every pre-slots save still loads — just without a position,
   * which the loader turns back into "use the map's own spawn point".
   *
   * Live enemies are still NOT persisted, and that is unchanged: they respawn
   * fresh. The one piece of world state that already survived — that the Szary
   * is dead — rides on `kills`, not on anything here.
   */
  world?: {
    mapId: string; x: number; y: number; hp: number;
    /** Otwarty świat (2026-10-09): obszar pod graczem (`village`/`forest`) —
     *  wyłącznie dla podpisu slotu, bo `mapId` to wtedy `swiat`. Opcjonalne. */
    region?: string;
  };
  /** For the slot card, never read back into gameplay. */
  meta?: { savedAt: number; playtimeMs: number };
}

/** What the title screen and the save tab paint a slot row from, without
 *  applying anything. `compatible` false means a real save is sitting there
 *  that this build refuses to load (version mismatch) — worth showing as such
 *  rather than as an empty slot, or the player deletes it not knowing. */
export interface SlotInfo {
  slot: SlotId;
  level: number;
  gold: number;
  mapId: string;
  savedAt: number;
  playtimeMs: number;
  /** Da się wczytać — wprost albo przez łańcuch `MIGRACJE`. */
  compatible: boolean;
  /** Wersja zapisu, jak leży na dysku — do podpisu „z nowszej wersji gry". */
  version: number;
}

/** What `load()` hands back so the caller can hand it straight to GameScene as
 *  scene data. All fields absent for a pre-slots save — which the scene reads
 *  as "use the map's authored spawn", the old behaviour. */
export interface LoadedWorld {
  mapId?: string;
  spawn?: { x: number; y: number };
  hp?: number;
}

/**
 * Persists Progression/Inventory/Equipment/Quests/Skills/Dialogue plus where
 * the character stood, across four slots (see `SlotId`).
 *
 * The autosave writes on every change (see the listeners at the bottom) and on
 * every map transition, so a session is never lost. Manual slots write only
 * when asked.
 */
class SaveSystem {
  /**
   * Set while `load()` is reassigning the singletons.
   *
   * Every one of those assignments emits, and every emit is wired to an
   * autosave — so without this, restoring slot 2 would fire a dozen autosaves
   * mid-restore, each one snapshotting a half-loaded character *and* a
   * `world` block still describing wherever the player was standing before.
   */
  private muted = false;

  /**
   * Polityka zapisu, reguła 3: zanim slot zostanie nadpisany albo usunięty,
   * treść, której ten build nie zapisałby identycznie (inna wersja, uszkodzony
   * JSON), idzie do kopii `<klucz>-kopia-v<wersja>`. Istniejącej kopii NIE
   * nadpisuje — pierwsza zachowana jest tą, o którą chodzi.
   */
  private zabezpiecz(slot: SlotId): void {
    try {
      const klucz = storageKey(slot);
      const raw = localStorage.getItem(klucz);
      // ⚡ Autozapis leci po każdej zmianie stanu, więc zwykły przypadek (slot
      // pisany przez TEN build) rozpoznaje się po początku tekstu, bez parsowania:
      // `save()` składa obiekt z `version` jako pierwszym kluczem.
      if (raw === null || raw.startsWith(`{"version":${SAVE_VERSION},`)) return;
      let wersja: string;
      try {
        const v = (JSON.parse(raw) as SurowyZapis).version;
        if (v === SAVE_VERSION) return;
        wersja = typeof v === "number" ? String(v) : "x";
      } catch {
        wersja = "x";
      }
      const kopia = `${klucz}-kopia-v${wersja}`;
      if (localStorage.getItem(kopia) === null) localStorage.setItem(kopia, raw);
    } catch {
      // Brak dostępu do magazynu — zapisać i tak się nie da.
    }
  }

  save(slot: SlotId = "auto"): void {
    if (this.muted) return;
    this.zabezpiecz(slot);
    const data: SaveData = {
      version: SAVE_VERSION,
      progression: {
        level: Progression.level,
        xp: Progression.xp,
        totalXp: Progression.totalXp,
        skillPoints: Progression.skillPoints,
        strength: Progression.strength,
        vitality: Progression.vitality,
        conditioning: Progression.conditioning,
        agility: Progression.agility,
      },
      stamina: Stamina.snapshot(),
      inventory: {
        gold: Inventory.gold,
        slots: Inventory.slots,
        quickSlot: Inventory.quickSlot,
      },
      equipment: {
        weapon: Equipment.weapon,
        head: Equipment.head,
        chest: Equipment.chest,
        legs: Equipment.legs,
        boots: Equipment.boots,
        ring1: Equipment.ring1,
        ring2: Equipment.ring2,
        offhand: Equipment.offhand,
        gloves: Equipment.gloves,
        amulet: Equipment.amulet,
        shoulders: Equipment.shoulders,
      },
      // ⭐ **Kotwica + mapa.** Pola płaskie wyżej niosą NAJBARDZIEJ ZEWNĘTRZNĄ
      // warstwę (gettery `Equipment.head` itd. robią to same), a `layers` pełną
      // prawdę. ⚠ Powtórzenie jednego egzemplarza w obu miejscach jest CENĄ
      // KOMPATYBILNOŚCI, nie nadmiarowością — patrz decyzja.
      layers: Object.fromEntries(
        LAYERED_AREAS.map((area) => [
          area,
          Object.fromEntries(ARMOR_LAYERS.map((l) => [l, Equipment[layeredSlot(area, l)]])),
        ]),
      ),
      stowed: {
        weapon2: Equipment.weapon2,
        offhand2: Equipment.offhand2,
      },
      bags: {
        bag1: Equipment.bag1,
        bag2: Equipment.bag2,
        bag3: Equipment.bag3,
        bag4: Equipment.bag4,
      },
      quests: Quests.snapshot(),
      questProgress: Quests.progressSnapshot(),
      questStages: Quests.stageSnapshot(),
      questGrantedStages: Quests.grantedStagesSnapshot(),
      kills: Quests.killSnapshot(),
      questReplenished: Quests.replenishedSnapshot(),
      trackedQuest: TrackedQuest.snapshot(),
      topics: Dialogue.snapshot(),
      gathering: Gathering.snapshot(),
      discovered: Gathering.discoveredSnapshot(),
      skills: Skills.snapshot(),
      explored: Exploration.snapshot(),
      armorTraining: ArmorTraining.snapshot(),
      shieldSkill: ShieldSkill.snapshot(),
      abilitySlots: Abilities.slotSnapshot(),
      weaponProficiency: WeaponProficiency.snapshot(),
      weaponProficiencyStart: WeaponProficiency.startSnapshot(),
      weaponPractice: WeaponProficiency.poolSnapshot(),
      weaponMastery: WeaponProficiency.masterySnapshot(),
      meta: { savedAt: Date.now(), playtimeMs: Session.playtimeMs },
    };

    // Only once a real scene has run. TitleScene's "Nowa gra" resets every
    // singleton, and each reset emits — so autosaves fire while GameScene has
    // never existed, when Vitals/WorldState are still all zeros. Writing that
    // would pin the character to (0,0) with 0 HP, which on load is a corpse in
    // the top-left corner of the map.
    if (Vitals.maxHp > 0 && WorldState.widthPx > 0) {
      data.world = {
        mapId: WorldState.mapId,
        x: Math.round(WorldState.playerX),
        y: Math.round(WorldState.playerY),
        hp: Math.max(1, Math.round(Vitals.hp)),
        ...(WorldState.region ? { region: WorldState.region.id } : {}),
      };
    }

    try {
      localStorage.setItem(storageKey(slot), JSON.stringify(data));
    } catch {
      // Private browsing / full quota — losing the autosave isn't fatal.
    }
  }

  /** Parse a slot without applying it. Returns null for missing or corrupt
   *  data; a version mismatch still parses (so `describe` can say "obcy zapis"
   *  instead of "puste"), and is rejected by `load`. */
  private read(slot: SlotId): SaveData | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(storageKey(slot));
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  /**
   * Restore a slot into the live singletons. Returns the world block for the
   * caller to pass on as scene data, or **null** if there is nothing to load —
   * callers must treat null as "did not load", since no state was touched.
   */
  load(slot: SlotId = "auto"): LoadedWorld | null {
    const surowy = this.read(slot);
    // Polityka zapisu (`OI-51`): starszy zapis przechodzi przez łańcuch
    // `MIGRACJE`; nowszy albo bez ogniwa → odmowa, a stan zostaje nietknięty.
    const data = surowy ? (migruj(surowy as unknown as SurowyZapis) as unknown as SaveData | null) : null;
    if (!data) return null;

    this.muted = true;
    try {
      const p = data.progression;
      Progression.level = p.level;
      Progression.xp = p.xp;
      Progression.totalXp = p.totalXp;
      Progression.skillPoints = p.skillPoints;
      Progression.strength = p.strength;
      // ⚠ Kolejność `??` niesie całą kompatybilność wsteczną: nowy zapis ma
      // `vitality`, stary ma tylko `endurance` i wtedy CAŁA dawna Kondycja
      // staje się Witalnością. Postać sprzed rozdziału nie traci ani jednego
      // punktu HP; Kondycję (staminę) dostaje pustą i wydaje na nią przyszłe
      // punkty sama.
      Progression.vitality = p.vitality ?? p.endurance ?? 0;
      Progression.conditioning = p.conditioning ?? 0;
      Progression.agility = p.agility;
      // ⚠ `emitAttributes` przelicza pulę staminy z Kondycji, więc MUSI pójść
      // przed przywróceniem bieżącej wartości — inaczej `restoreSnapshot`
      // przyciąłby ją do starej, mniejszej puli.
      Progression.emitAttributes();
      Stamina.restoreSnapshot(data.stamina);
      Progression.emitXp();

      Inventory.gold = data.inventory.gold;
      // Normalised rather than assigned straight through: a pre-quality slot
      // carries no quality/durability, and an id that no longer exists (an item
      // removed between builds, a hand-edited file) must drop that one slot
      // instead of taking the whole save down with it.
      Inventory.slots = (data.inventory.slots ?? []).map((s) =>
        s ? normalizeInstance(s) : null,
      );
      while (Inventory.slots.length < INVENTORY.slots) Inventory.slots.push(null);
      // Absent in pre-quick-slot saves — see the note on SaveData.inventory.
      Inventory.quickSlot = data.inventory.quickSlot ?? null;

      // Absent in every save written before bags existed — see the note on
      // SaveData.bags. `readEquipped(undefined)` is null, so an old save
      // simply loads as "no bags worn", the pre-bags behaviour.
      const bags = data.bags ?? {};
      Equipment.bag1 = readEquipped(bags.bag1);
      Equipment.bag2 = readEquipped(bags.bag2);
      Equipment.bag3 = readEquipped(bags.bag3);
      Equipment.bag4 = readEquipped(bags.bag4);
      // ⚠ Generous, not strict: `data.inventory.slots` and `data.bags` were
      // written from the same live state, so their lengths already agree —
      // but a hand-edited or corrupted save might not. If the array is
      // SHORTER than what the worn bags imply, pad it out rather than strand
      // capacity the doll claims to grant; never shrink it here — a shorter
      // implied capacity might cut off real items, and `Save.load` refuses
      // to destroy state that already exists, same rule `normalizeHands`
      // follows for a full backpack.
      const expectedCapacity =
        INVENTORY.slots +
        BAG_SLOTS.reduce((sum, s) => sum + (Equipment[s] ? containerSlots(Equipment[s]!.itemId) : 0), 0);
      while (Inventory.slots.length < expectedCapacity) Inventory.slots.push(null);

      Inventory.emitChanged();

      const e = data.equipment;
      Equipment.weapon = readEquipped(e.weapon);
      // ⭐⭐ **Warstwy: mapa wygrywa, brak mapy → kotwica do SWOJEJ warstwy.**
      // To jest cała wstecznej kompatybilność zapisu (decyzja 2026-09-15):
      //  • nowy zapis  → `layers[obszar]` jest prawdą, płaskie pole ignorowane;
      //  • stary zapis → `layers` nieobecne, więc `chest: "steel_chest"` idzie
      //    przez `itemLayer()` do L3 — dokładnie tam, gdzie ten przedmiot należy.
      // ⛔ Nigdy odwrotnie: kotwica NIE nadpisuje mapy, bo przy trzech warstwach
      //    powtórzyłaby jedną z nich i zgubiła dwie.
      const mapaWarstw = data.layers ?? {};
      for (const area of LAYERED_AREAS) {
        for (const l of ARMOR_LAYERS) Equipment[layeredSlot(area, l)] = null;
        const zapisane = mapaWarstw[area];
        if (zapisane) {
          for (const l of ARMOR_LAYERS) Equipment[layeredSlot(area, l)] = readEquipped(zapisane[l]);
          continue;
        }
        const kotwica = readEquipped(e[area]);
        if (!kotwica) continue;
        const warstwa = itemLayer(kotwica.itemId);
        // ⚠ Pancerz bez wyprowadzalnej warstwy jest dziś nieosiągalny; gdyby się
        //   pojawił, ląduje w ochronie zasadniczej — nie ginie.
        Equipment[layeredSlot(area, warstwa ?? "L2")] = kotwica;
      }
      // Absent in pre-ring / pre-shield saves — see the note on
      // SaveData.equipment. `readEquipped(undefined)` is null, so an old save
      // simply loads as "empty hand", which is exactly right.
      Equipment.ring1 = readEquipped(e.ring1);
      Equipment.ring2 = readEquipped(e.ring2);
      Equipment.offhand = readEquipped(e.offhand);
      Equipment.gloves = readEquipped(e.gloves);
      Equipment.amulet = readEquipped(e.amulet);
      Equipment.shoulders = readEquipped(e.shoulders);
      // ⚠ **Te przypisania omijają `equipFromBag`, a więc każdą regułę w nim** —
      // to jedyne takie miejsce w `src/` i dlatego jedyne, które musi po sobie
      // posprzątać. Bez tego bramka dwuręczności byłaby regułą, którą obchodzi
      // najczęstsza operacja w grze. Musi stać PRZED `emitChanged`, żeby
      // słuchacze zobaczyli stan już uporządkowany, a nie chwilowo niespójny.
      // Pełny plecak: przedmiot zostaje na sobie, nic nie ginie — `normalizeHands`.
      // Zestaw schowany — nieobecny w zapisach sprzed drugiego zestawu, wiec
      // `readEquipped(undefined)` daje null i stary zapis wczytuje sie jako
      // "drugi zestaw pusty", co jest dokladnie poprawne.
      const stowed = data.stowed ?? {};
      Equipment.weapon2 = readEquipped(stowed.weapon2);
      Equipment.offhand2 = readEquipped(stowed.offhand2);
      Equipment.normalizeHands();
      Equipment.emitChanged();
      Equipment.emitBagsChanged();

      // Absent in pre-objective-types saves — see the note on SaveData.
      Quests.restore(
        data.quests,
        data.questProgress ?? {},
        data.kills ?? {},
        data.questReplenished ?? [],
        data.questStages ?? {},
        data.questGrantedStages ?? [],
      );
      // ⚠ AFTER `Quests.restore` — it validates the saved id against live
      // quest status, and re-seeds the diffing that `Quests.restore`'s own
      // bulk emit just ran through. See TrackedQuest.restore.
      TrackedQuest.restore(data.trackedQuest);
      // ⚠ Zapis sprzed Kartografii (brak `explored`): ta postać miała mapę
      // i minimapę od zawsze — odebranie ich przy aktualizacji byłoby karą za
      // nic. Dostaje oba poziomy i odkryte obszary, po których na pewno
      // chodziła (wieś i las; Gęstwiny nie wiemy — zostaje we mgle).
      const legacyMap = data.explored === undefined;
      Skills.restore(legacyMap ? [...(data.skills ?? []), "cartography_1", "cartography_2"] : data.skills);
      Exploration.restore(legacyMap ? { village: REVEALED_ALL, forest: REVEALED_ALL } : data.explored);
      ArmorTraining.restore(data.armorTraining);
      ShieldSkill.restore(data.shieldSkill);
      // Po Skills, bo odblokowanie umiejetnosci czynnej zalezy od nauczonych
      // umiejetnosci — odtworzenie ukladu wczesniej odrzucaloby wszystko jako
      // jeszcze niedostepne.
      Abilities.restoreSlots(data.abilitySlots);
      Dialogue.restore(data.topics ?? []);
      Gathering.restore(data.gathering, data.discovered ?? []);
      WeaponProficiency.restore(
        data.weaponProficiency,
        data.weaponProficiencyStart,
        data.weaponPractice,
        data.weaponMastery,
      );
      Session.set(data.meta?.playtimeMs ?? 0);
    } finally {
      this.muted = false;
    }

    const w = data.world;
    if (!w) return {};
    return { mapId: w.mapId, spawn: { x: w.x, y: w.y }, hp: w.hp };
  }

  /** Everything the slot list needs, without touching game state. */
  describe(slot: SlotId): SlotInfo | null {
    const d = this.read(slot);
    if (!d) return null;
    return {
      slot,
      level: d.progression?.level ?? 1,
      gold: d.inventory?.gold ?? 0,
      mapId: d.world?.region ?? d.world?.mapId ?? "",
      savedAt: d.meta?.savedAt ?? 0,
      playtimeMs: d.meta?.playtimeMs ?? 0,
      compatible: migruj(d as unknown as SurowyZapis) !== null,
      version: typeof d.version === "number" ? d.version : 0,
    };
  }

  /** Wipe one slot. "Nowa gra" clears only `"auto"` — the manual slots are the
   *  player's own backups, and starting a new run is not a request to burn
   *  them. */
  clear(slot: SlotId = "auto"): void {
    // „Nowa gra" po niewczytywalnym autozapisie nie może zabrać postaci z nowszej
    // wersji gry — idzie do kopii, jak przed nadpisaniem (reguła 3).
    this.zabezpiecz(slot);
    try {
      localStorage.removeItem(storageKey(slot));
    } catch {
      // ignore
    }
  }

  /** Whether a slot holds anything at all. Doesn't validate its contents. */
  hasSave(slot: SlotId = "auto"): boolean {
    try {
      return localStorage.getItem(storageKey(slot)) !== null;
    } catch {
      return false;
    }
  }

  /** Any slot at all — what decides whether the title screen offers to load. */
  hasAnySave(): boolean {
    return ALL_SLOTS.some((s) => this.hasSave(s));
  }

  /**
   * Most recently written loadable slot — what "Kontynuuj" resumes.
   *
   * Usually the autosave, but not always: save to slot 2, quit, and the
   * autosave is the older of the two only if nothing changed afterwards. Ties
   * (and pre-`meta` saves, which report `savedAt` 0) fall to the autosave
   * because `ALL_SLOTS` lists it first and this keeps the first maximum.
   */
  newestSlot(): SlotId | null {
    let best: SlotId | null = null;
    let bestAt = -1;
    for (const s of ALL_SLOTS) {
      const info = this.describe(s);
      if (!info || !info.compatible) continue;
      if (info.savedAt > bestAt) {
        best = s;
        bestAt = info.savedAt;
      }
    }
    return best;
  }
}

export const Save = new SaveSystem();

/**
 * The slot card's second line — "poz. 7 · 340 g · Zagaje · 1:12 · 07.08.2026".
 *
 * Lives here, next to `describe()`, rather than in either of the two screens
 * that draw it: the title screen and the in-game save tab list the same four
 * slots, and two hand-written formatters would eventually describe one save
 * two different ways.
 *
 * A save with no recorded `mapId` (written before slots existed) reads as
 * "w drodze" rather than guessing a map — it genuinely doesn't know, and the
 * loader will put that character on the map's own spawn point.
 */
export function describeSlot(info: SlotInfo | null): string {
  if (!info) return "— puste —";
  if (!info.compatible) {
    return info.version > SAVE_VERSION ? "zapis z nowszej wersji gry — zaktualizuj grę" : "zapis ze zbyt starej wersji gry";
  }
  const where = MAP_LABEL[info.mapId] ?? "w drodze";
  const when = info.savedAt ? new Date(info.savedAt).toLocaleDateString() : "";
  return `poz. ${info.level} · ${info.gold} g · ${where} · ${Session.format(info.playtimeMs)}${when ? ` · ${when}` : ""}`;
}

// Autosave whenever any persisted system changes. Importing this module is
// enough to activate it — same self-contained-singleton pattern as
// Progression/Inventory/Equipment/Quests themselves. Always the "auto" slot:
// see SlotId for why a manual slot must never be written behind the player's
// back.
GameEvents.on(EVENT.attributesChanged, () => Save.save());
GameEvents.on(EVENT.xpChanged, () => Save.save());
GameEvents.on(EVENT.inventoryChanged, () => Save.save());
GameEvents.on(EVENT.equipmentChanged, () => Save.save());
GameEvents.on(EVENT.bagsChanged, () => Save.save());
GameEvents.on(EVENT.questsChanged, () => Save.save());
GameEvents.on(EVENT.trackedQuestChanged, () => Save.save());
GameEvents.on(EVENT.skillsChanged, () => Save.save());
// Odkrycia lecą kilka razy na sekundę marszu — zapis najwyżej co
// `MAP_FOG.saveEveryMs`, nie co komórkę (`localStorage` bez przerwy).
let lastExplorationSave = 0;
let explorationDirty = false;
GameEvents.on(EVENT.explorationChanged, (e: { cells: number[] | null }) => {
  if (!e.cells) return; // wczytanie / reset — zapisze je ich własna ścieżka
  explorationDirty = true;
  const now = Date.now();
  if (now - lastExplorationSave < MAP_FOG.saveEveryMs) return;
  lastExplorationSave = now;
  explorationDirty = false;
  Save.save();
});
// Schowanie aplikacji (przełączenie na telefonie, zamknięcie karty) dopisuje
// odkrycia sprzed ostatniego zapisu — inaczej przepadałoby do 15 s marszu.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" || !explorationDirty) return;
    explorationDirty = false;
    lastExplorationSave = Date.now();
    Save.save();
  });
}
GameEvents.on(EVENT.armorTrainingChanged, () => Save.save());
// ⚠ `shieldSkillChanged` leci wyłącznie przy ZDOBYCIU punktu, nie przy każdym
// bloku — inaczej autozapis szedłby kilka razy na walkę (patrz `EventBus`).
GameEvents.on(EVENT.shieldSkillChanged, () => Save.save());
// Uklad paska umiejetnosci — WLASNE zdarzenie, nie : tamto
// leci takze przy kazdym starcie cooldownu, wiec zapisywaloby po kazdym uzyciu.
GameEvents.on(EVENT.abilityLoadoutChanged, () => Save.save());
GameEvents.on(EVENT.dialogueChanged, () => Save.save());
GameEvents.on(EVENT.gatheringChanged, () => Save.save());
GameEvents.on(EVENT.weaponProficiencyChanged, () => Save.save());

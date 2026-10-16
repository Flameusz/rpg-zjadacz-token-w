import { QUESTS, ENEMY_NAMES } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Inventory } from "./Inventory";
import { Equipment } from "./Equipment";
import { Progression } from "./Progression";
import { Skills, type SkillId } from "./Skills";
import { getItem, type ItemId } from "./Items";
import type { QualityLevel } from "./Quality";
import { NPCS, type NpcId } from "./Npcs";
import type { EnemyType } from "../entities/Enemy";

export type QuestId = keyof typeof QUESTS;
/** `available` = offered but not taken, `active` = in the log, `completed` = turned in. */
export type QuestStatus = "available" | "active" | "completed";

/**
 * What a quest asks for. Five kinds, and they split into two families that are
 * tracked in completely different ways — see `isLatched` below:
 *
 * - **derived** (`collect`, `equip`): progress is READ LIVE from the backpack /
 *   the equipped slots on every query, never stored. Sell the meat and the
 *   count drops; take the stick off and the objective un-completes. This was
 *   the original design for `collect` and it is kept deliberately: the turn-in
 *   is what consumes the goods, so a stored count could disagree with the bag.
 * - **latched** (`kill`, `talk`, `reach`): nothing in the world remembers that you swung
 *   at a wolf or said hello, so these have to be recorded as they happen. They
 *   are counted ONLY while the quest is active (WoW's rule) — killing the Szary
 *   before anyone asks you to does not silently pre-complete the revenge.
 */
export type Objective =
  | { readonly kind: "collect"; readonly itemId: string; readonly count: number }
  | { readonly kind: "kill"; readonly enemy: EnemyType; readonly count: number }
  /**
   * ⭐ **Uderz** (2026-10-15, samouczek walki u Patryczka): trafienia, nie
   * zabicia — manekina nie da się położyć (`TRAINING_DUMMY.hp` 100 000).
   * Zatrzaskiwany jak `kill`; liczy wyłącznie trafienia GRACZA w czasie,
   * gdy zadanie jest aktywne.
   */
  | { readonly kind: "hit"; readonly enemy: EnemyType; readonly count: number }
  /**
   * ⭐ Od 2026-10-12 (`OI-66`, decyzja autora): „porozmawiaj" znaczy rozmowę
   * W DANYM TEMACIE — `topic` to id tematu z `npc.topics`, a cel zalicza się,
   * gdy gracz ten temat otworzy (także z archiwum, `recordTopic`). Bez `topic`
   * zostaje stare znaczenie: samo otwarcie rozmowy (`recordTalk`).
   */
  | { readonly kind: "talk"; readonly npc: string; readonly topic?: string }
  | { readonly kind: "equip"; readonly itemId: string }
  /**
   * ⭐ **Stań w miejscu** (2026-10-12, pierwsze użycie: Kirka, `OI-174`).
   * `spot` to `id` obiektu `miejsce` na mapie Tiled (`TiledMap.questSpots`);
   * `itemId` — przedmiot, bez którego postój nic nie daje (Kirka nie
   * przyjdzie bez pieczystego). Czasownik i podmiot są DANYMI zadania, bo
   * „Zwab pieczonym mięsem: Kirka" nie da się wyprowadzić z nazwy miejsca.
   * Zatrzaskiwany: zaliczenie zgłasza scena (`QuestSpots`), a co się dzieje
   * w świecie przed zaliczeniem (pies przybiega), to już jej sprawa.
   */
  | {
      readonly kind: "reach";
      readonly spot: string;
      readonly verb: string;
      readonly subject: string;
      readonly itemId?: string;
    };

/** True for objectives whose progress must be stored as it happens. */
function isLatched(o: Objective): boolean {
  return o.kind === "kill" || o.kind === "hit" || o.kind === "talk" || o.kind === "reach";
}

/** How many "units" of an objective are needed. Talk/equip are binary. */
export function goalOf(o: Objective): number {
  return o.kind === "collect" || o.kind === "kill" || o.kind === "hit" ? o.count : 1;
}

export function getQuest(id: QuestId): (typeof QUESTS)[QuestId] {
  return QUESTS[id];
}

/**
 * One STEP of a multi-stage quest (2026-08-20, `docs/QUEST_01_WSTEP_DO_
 * MYSLIWEGO.md` — the request that forced this in, plus the diagnostic pass
 * that designed it). `id` is a stable STRING, deliberately not an array index
 * — an index shifts the moment anyone reorders `stages`, a string never does,
 * and the save file below is keyed on exactly this id for the same reason.
 *
 * Deliberately NOT a graph: `stages` is a plain array, walked strictly in
 * order. No branching, no per-objective `requires`, no conditions between
 * stages — the diagnostic that led here found that ~90% of the social
 * chains this project actually wants (`Marko → equip → Patryczek → Wszebor`,
 * the planned Dobiesław→Dobek→Miłosz→Radzim→Sobek run) are linear, and an
 * index/graph model would spend real complexity solving a problem this
 * project doesn't have yet.
 */
export interface QuestStage {
  readonly id: string;
  readonly objectives: readonly Objective[];
  /** Fired the moment this stage's objectives become met and the quest
   *  auto-advances to the next stage — see `QuestState.advanceStages`. Only
   *  `grant` today (mirrors the accept-time `grant` below), on purpose: this
   *  is meant to answer "hand the player an item mid-quest", not to become a
   *  general effect interpreter. */
  readonly onComplete?: {
    readonly grant?: readonly { itemId: string; count: number; quality?: QualityLevel }[];
  };
}

/** The id an old-style, single-`objectives` quest is modelled as internally —
 *  never written to a save (see `QuestState.stageSnapshot`), never compared
 *  against a real stage id, so any string here is safe as long as it can
 *  never collide with an author-chosen stage id (the leading double
 *  underscore is the whole guarantee). */
const LEGACY_STAGE_ID = "__legacy";

/**
 * A quest's stage list. `stages` wins if present; a quest with only the old
 * flat `objectives` is wrapped as ONE implicit stage — this is the entire
 * compatibility story. Every one of the ~20 quests shipped before this
 * still reads exactly as it did: same file, same `objectives` field, same
 * save shape, just walked through this wrapper instead of read directly.
 */
function stagesOf(id: QuestId): readonly QuestStage[] {
  const q = QUESTS[id] as { objectives?: readonly Objective[]; stages?: readonly QuestStage[] };
  if (q.stages) return q.stages;
  return [{ id: LEGACY_STAGE_ID, objectives: q.objectives ?? [] }];
}

/**
 * A quest's objective list — **of its CURRENT stage only**, not the whole
 * quest. This is the one change that makes the quest log, `reservedCount`
 * and `isObjectiveMet` all stage-aware for free: everything downstream of
 * this function already iterated "the objectives", and none of it had to
 * change to stop seeing objectives from a stage the player has already
 * passed. For a legacy (single-stage) quest this is exactly the old flat
 * list, unchanged.
 */
export function objectivesOf(id: QuestId): readonly Objective[] {
  return Quests.currentStage(id).objectives;
}

/** A quest's item payout — same shape as `grant`'s entries (see
 *  `Quests.grantsOf`), `count` optional because every reward so far is one. */
export interface RewardItem {
  readonly itemId: string;
  readonly count?: number;
  readonly quality?: QualityLevel;
}

/**
 * A quest's payout, with every part optional.
 *
 * The cast is the same widening `objectivesOf` does, for the same reason: the
 * `as const` config makes every quest's reward its own literal type, so a union
 * member that pays in XP alone (`stick_in_hand` — see the note on it in
 * GameConfig) would make `.gold` a compile error at every reader.
 */
export function rewardOf(id: QuestId): { gold?: number; xp?: number; item?: RewardItem } {
  return QUESTS[id].reward as { gold?: number; xp?: number; item?: RewardItem };
}

/**
 * The reward line, assembled from whichever parts a quest actually pays.
 *
 * Both panels used to template `Nagroda: ${gold}g, ${xp} XP` on their own, which
 * printed a literal "undefinedg" the moment a quest left one out — and leaving
 * one out is a thing quests are allowed to do, deliberately. One formatter, so
 * the two lists cannot describe the same reward differently either.
 */
export function rewardText(id: QuestId): string {
  const r = rewardOf(id);
  const parts: string[] = [];
  if (r.gold) parts.push(`${r.gold}g`);
  if (r.xp) parts.push(`${r.xp} XP`);
  // Liczba sztuk z nagrody („2× Ser") — bez niej dwa sery czytały się jak jeden.
  if (r.item) parts.push(`${r.item.count && r.item.count > 1 ? `${r.item.count}× ` : ""}${getItem(r.item.itemId as ItemId).name}`);
  return parts.length ? `Nagroda: ${parts.join(", ")}` : "";
}

/**
 * Per-quest greeting overrides (2026-08-20 — same session as `stages`, same
 * root cause: `NpcDialog.pickGreeting` computes its buckets across ALL of an
 * NPC's quests at once, so two quests in the same state shared one line —
 * discovered on Patryczek, who owns two. `readonly Partial<...>` and every
 * key optional: a quest with none of this defined falls all the way through
 * to the NPC's own bucket, i.e. today's behaviour, unchanged, for every quest
 * that doesn't opt in.
 */
export type QuestGreetings = Partial<
  // `done` — głos dawcy w chwili ODDANIA (rozmowa, D4); nagroda stoi pod nim
  // w nawiasie. Decyzja autora 2026-10-15 (`docs/decyzje/2026-10-15-*`).
  Record<"firstJob" | "newJob" | "working" | "turnIn" | "done" | "allDone", string>
>;

export function questGreetingsOf(id: QuestId): QuestGreetings {
  return (QUESTS[id] as { greetings?: QuestGreetings }).greetings ?? {};
}

/**
 * **Who the player hands this quest in to.** `turnInNpc ?? giver` — the field
 * is optional and no quest sets it today, because every quest in the game is
 * currently handed back to whoever gave it out (`QuestPanel` only lists a
 * quest inside its `giver`'s conversation, and `Quests.complete` is only ever
 * reached from there). Nothing was migrated; this exists so a "take this to
 * the Kowal" quest can be authored without the UI having to guess.
 *
 * ⚠ **On the QUEST, deliberately not on `QuestStage`.** Stages auto-advance
 * the moment their objectives are met (`advanceStages`) — they are progress
 * checkpoints, not places the player is asked to walk back to — so a
 * per-stage turn-in NPC would describe something the model does not have. A
 * stage that genuinely means "go see somebody" already says so as data: a
 * `talk` objective carrying that person's `npc` id.
 *
 * ⚠ The cast is the same widening `objectivesOf`/`rewardOf` do, for the same
 * reason: `as const` on the config makes `giver` a string literal per quest.
 */
export function turnInNpcOf(id: QuestId): NpcId {
  const q = QUESTS[id] as { giver: string; turnInNpc?: string };
  return (q.turnInNpc ?? q.giver) as NpcId;
}

/**
 * An objective split into the two pieces every quest label in this game is
 * built from: **what to do**, and **to what**.
 *
 * ⚠ **`subject` is always NOMINATIVE, and the split is what keeps it that
 * way.** Polish declines a noun after a verb or preposition — „porozmawiaj
 * *z Patryczkiem*", „wróć *do Myśliwego*" — and the names here cannot be
 * declined by rule (*Hanna→Hanny* is regular, *Myśliwy→Myśliwego* is
 * adjectival, *Ojciec→Ojca* changes stem). Keeping the verb and the name in
 * separate fields, joined by a colon, quotes the name instead of putting it
 * in a sentence, so no case is ever needed. That is why every label in this
 * game reads „Zbierz: Krwawnik" rather than „Zbierz krwawnik".
 *
 * ⚠ **Do NOT re-join these into one string down in this module.** The whole
 * point of returning parts is that the caller decides the shape — see
 * `core/QuestGuidance.guidanceText`, which is the one place that composes
 * them for display.
 */
export function objectiveParts(o: Objective): { verb: string; subject: string } {
  switch (o.kind) {
    case "collect":
      return { verb: "Zbierz", subject: getItem(o.itemId as ItemId).name };
    case "kill":
      return { verb: "Ubij", subject: ENEMY_NAMES[o.enemy] };
    case "hit":
      return { verb: "Uderz", subject: ENEMY_NAMES[o.enemy] };
    case "talk":
      return { verb: "Porozmawiaj", subject: NPCS[o.npc as NpcId]?.name ?? o.npc };
    case "equip": {
      // Czasownik z RODZAJU przedmiotu, nie jeden na wszystko: „weź do ręki"
      // było dobre, póki jedynym takim celem był kij ojca, i zrobiło się
      // bezsensowne przy naszyjniku. Wyprowadzone, a nie dopisane per zadanie,
      // żeby kolejny cel `equip` nie musiał o tym pamiętać.
      const def = getItem(o.itemId as ItemId);
      return { verb: def.type === "weapon" ? "Weź do ręki" : "Załóż", subject: def.name };
    }
    case "reach":
      return { verb: o.verb, subject: o.subject };
  }
}

/** One objective as a bare verb+noun, with NO progress counter. */
export function objectiveLabel(o: Objective): string {
  const { verb, subject } = objectiveParts(o);
  return `${verb}: ${subject}`;
}

/**
 * One objective rendered as a player-facing line, progress counter included.
 *
 * ⚠ **Licznik doklejany SPACJĄ, nie drugim dwukropkiem.** Do 2026-08-23
 * wychodziło z tego „Zbierz: Mięso królicze: 5/5" — dwa dwukropki w jednej
 * linii, z których drugi nie znaczy tego samego, co pierwszy.
 */
export function objectiveText(id: QuestId, index: number): string {
  const o = objectivesOf(id)[index];
  const goal = goalOf(o);
  const have = Quests.objectiveProgress(id, index);
  const label = objectiveLabel(o);
  if (goal > 1) return `${label} ${have}/${goal}`;
  return have >= goal ? `${label}  ✓` : label;
}

/**
 * The player's quest log. Module-level singleton for the same reason as
 * Progression/Inventory/Equipment — it outlives the Player across
 * death/respawn and map transitions; `reset()` starts a fresh run.
 */
class QuestState {
  private status = new Map<QuestId, QuestStatus>();
  /**
   * Per-quest counters, one slot per objective, meaningful only for latched
   * kinds (a derived objective's slot stays 0 and is never read). Created on
   * `accept()` and kept until reset, so a completed quest's log entry still
   * shows the counts it finished on.
   */
  private counters = new Map<QuestId, number[]>();
  /** Which `QuestStage` an active/completed quest is currently on, by index
   *  into `stagesOf(id)`. Absent = 0 (also true for every legacy quest,
   *  which has exactly one stage and never advances past it). Always a VALID
   *  index (0..stages.length-1) — the last stage never advances further,
   *  it just sits here forever once met. */
  private stageIndex = new Map<QuestId, number>();
  /**
   * Which stages have already had their `onComplete.grant` applied, keyed by
   * `${questId}::${stageId}` — a STABLE composite key, not an index, for the
   * same reason `QuestStage.id` itself is a string (see its doc comment).
   *
   * ⚠ **This is a SEPARATE concern from `stageIndex`, and conflating them was
   * a real bug caught before shipping.** `stageIndex` says "which stage's
   * OBJECTIVES am I tracking" — for the LAST stage that value never changes
   * once met, because there is nothing to advance the tracking INTO. But its
   * `onComplete.grant` still has to fire exactly once, and re-checking
   * `isObjectiveMet` on every later event (a kill, a pickup) would otherwise
   * either never fire it (if gated on "there's a next stage to move to") or
   * fire it repeatedly (if gated on "objectives are met", which stays true
   * forever after). This set is the only thing that makes "exactly once"
   * true regardless of which case applies.
   */
  private grantedStages = new Set<string>();
  /**
   * Lifetime kills per enemy kind — the one record that survives a page reload.
   * Its only job today is that the Szary stays dead: `respawnDelay: 0` already
   * keeps him gone for the session, but nothing stopped a reload from putting
   * the map's story payoff back on the board. Kill objectives do NOT read this
   * (they use `counters`, so credit only accrues while the quest is active).
   */
  private kills = new Map<EnemyType, number>();
  /** Quests whose grant has already been replaced once. Persisted, or a page
   *  reload would reopen the "one free replacement" tap over and over. */
  private replenished = new Set<QuestId>();

  constructor() {
    this.initStatuses();
    // Equipping is the one derived objective with no natural refresh: the
    // backpack already fires inventoryChanged on every pickup, but moving an
    // item from bag to hand only announces itself here. Also the hook that
    // lets an `equip` objective auto-advance a stage.
    GameEvents.on(EVENT.equipmentChanged, () => {
      this.advanceAllActive();
      this.emitChanged();
    });
    /**
     * ⚠ **Added for stages, and load-bearing for `collect` objectives.**
     * Before this, `QuestState` never listened to `inventoryChanged` at
     * all — `collect` progress was read live by whoever asked (`QuestPanel`/
     * `PlayerPanel` already listen to it themselves, for their own re-render),
     * but nothing here ever re-checked whether picking up the last herb had
     * just finished a STAGE. Without this listener a stage gated purely on
     * `collect` would sit "met" forever without auto-advancing, until some
     * unrelated event (a kill, a conversation) happened to nudge it.
     */
    GameEvents.on(EVENT.inventoryChanged, () => {
      this.advanceAllActive();
      this.emitChanged();
    });
  }

  private initStatuses(): void {
    this.status.clear();
    this.counters.clear();
    this.stageIndex.clear();
    this.grantedStages.clear();
    this.replenished.clear();
    for (const id of Object.keys(QUESTS) as QuestId[]) this.status.set(id, "available");
  }

  getStatus(id: QuestId): QuestStatus {
    return this.status.get(id) ?? "available";
  }

  /** The `QuestStage` an active/completed quest is currently on. Clamped
   *  against the live stage list, not just the stored index, so a content
   *  edit that removes trailing stages from under an in-progress save can
   *  never index off the end. */
  currentStage(id: QuestId): QuestStage {
    const stages = stagesOf(id);
    const idx = Math.min(this.stageIndex.get(id) ?? 0, stages.length - 1);
    return stages[idx];
  }

  private stageGrantKey(id: QuestId, stageId: string): string {
    return `${id}::${stageId}`;
  }

  /* ── Progress ─────────────────────────────────────────────────────────── */

  /** How far along one objective is, capped at its goal. */
  objectiveProgress(id: QuestId, index: number): number {
    const o = objectivesOf(id)[index];
    const goal = goalOf(o);
    if (isLatched(o)) return Math.min(this.counters.get(id)?.[index] ?? 0, goal);
    switch (o.kind) {
      case "collect":
        return Math.min(Inventory.countItem(o.itemId as ItemId), goal);
      case "equip":
        return Equipment.isEquipped(o.itemId as ItemId) ? 1 : 0;
      default:
        return 0;
    }
  }

  isObjectiveDone(id: QuestId, index: number): boolean {
    return this.objectiveProgress(id, index) >= goalOf(objectivesOf(id)[index]);
  }

  /** True once every objective is satisfied, i.e. the quest can be handed in. */
  isObjectiveMet(id: QuestId): boolean {
    return objectivesOf(id).every((_, i) => this.isObjectiveDone(id, i));
  }

  /* ── Recording deeds ──────────────────────────────────────────────────── */

  /** Credit a kill: always to the lifetime tally, and to any active quest
   *  asking for that creature. Called by GameScene when an enemy dies. */
  recordKill(kind: EnemyType): void {
    this.kills.set(kind, (this.kills.get(kind) ?? 0) + 1);
    this.bumpActive((o) => o.kind === "kill" && o.enemy === kind);
    this.advanceAllActive();
    // Even with no matching objective the tally moved, and that is persisted
    // state — the save listener hangs off this event.
    this.emitChanged();
  }

  /** Trafienie gracza w stworzenie (cel `hit` — samouczek). Bez licznika
   *  „na całe życie”: trafień nikt poza zadaniem nie liczy. Emituje tylko,
   *  gdy coś się zaliczyło — trafień jest wiele na sekundę walki. */
  recordHit(kind: EnemyType): void {
    if (!this.bumpActive((o) => o.kind === "hit" && o.enemy === kind)) return;
    this.advanceAllActive();
    this.emitChanged();
  }

  /** Credit a conversation. Called when an NPC's dialogue window opens.
   *  Runs the stage sweep BEFORE emitting — a `talk` objective that finishes
   *  a stage (and hands over that stage's `onComplete.grant`) must land
   *  before anything reads quest state for this same conversation, e.g.
   *  `NpcDialog.pickGreeting` right after this call. */
  recordTalk(npc: NpcId): void {
    const bumped = this.bumpActive((o) => o.kind === "talk" && o.npc === npc && !o.topic);
    const advanced = this.advanceAllActive();
    if (bumped || advanced) this.emitChanged();
  }

  /** Gracz otworzył temat `topicId` u `npc` (`TopicPanel`) — zalicza cele
   *  „porozmawiaj" z tym tematem. Także temat czytany ponownie z archiwum:
   *  zbiór zadanych pytań jest globalny, a cel liczy się tylko w toku zadania. */
  recordTopic(npc: NpcId, topicId: string): void {
    const bumped = this.bumpActive((o) => o.kind === "talk" && o.npc === npc && o.topic === topicId);
    const advanced = this.advanceAllActive();
    if (bumped || advanced) this.emitChanged();
  }

  /** Tematy, o które gracz ma zapytać `npc` w ramach aktywnych zadań —
   *  `TopicPanel` stawia je na początku i oznacza, hub rozmowy daje „!". */
  pendingTopics(npc: string): readonly string[] {
    const out: string[] = [];
    for (const id of Object.keys(QUESTS) as QuestId[]) {
      if (this.getStatus(id) !== "active") continue;
      objectivesOf(id).forEach((o, i) => {
        if (o.kind === "talk" && o.npc === npc && o.topic && !this.isObjectiveDone(id, i)) out.push(o.topic);
      });
    }
    return out;
  }

  /** Zalicz postój w miejscu `spot` (cel `reach`). Woła scena — `QuestSpots`
   *  — dopiero po tym, co ma się wydarzyć w świecie; ta warstwa niczego tam
   *  nie sprawdza. Kształt jak `recordTalk`. */
  recordReach(spot: string): void {
    const bumped = this.bumpActive((o) => o.kind === "reach" && o.spot === spot);
    const advanced = this.advanceAllActive();
    if (bumped || advanced) this.emitChanged();
  }

  /** Cele `reach` bieżących etapów aktywnych zadań, jeszcze niezaliczone —
   *  to, czego scena ma wypatrywać. Pusta lista = scena nic nie sprawdza. */
  pendingReach(): readonly { spot: string; itemId?: string }[] {
    const out: { spot: string; itemId?: string }[] = [];
    for (const id of Object.keys(QUESTS) as QuestId[]) {
      if (this.getStatus(id) !== "active") continue;
      objectivesOf(id).forEach((o, i) => {
        if (o.kind === "reach" && !this.isObjectiveDone(id, i)) out.push({ spot: o.spot, itemId: o.itemId });
      });
    }
    return out;
  }

  /** How many of a creature the player has ever killed. */
  killCount(kind: EnemyType): number {
    return this.kills.get(kind) ?? 0;
  }

  /** Add 1 to every matching latched objective of every ACTIVE quest, capped
   *  at its goal. Returns whether anything actually moved. */
  private bumpActive(match: (o: Objective) => boolean): boolean {
    let changed = false;
    for (const id of Object.keys(QUESTS) as QuestId[]) {
      if (this.getStatus(id) !== "active") continue;
      const slots = this.counters.get(id);
      if (!slots) continue;
      objectivesOf(id).forEach((o, i) => {
        if (!match(o) || slots[i] >= goalOf(o)) return;
        slots[i] += 1;
        changed = true;
      });
    }
    return changed;
  }

  /* ── Transitions ──────────────────────────────────────────────────────── */

  /**
   * What the giver hands over on accept, if anything.
   *
   * `quality` is optional and defaults through to `Inventory.addItem`'s own
   * default (Zwykła) — only `stick_in_hand` sets it today, to Podła: it's a
   * branch the Ojciec cut and sharpened the night before ("Osiosałem go
   * wczoraj przy oborze"), not a shop weapon, and that's a fact about THIS
   * grant, not about the `stick` item type. Buying one from a merchant still
   * follows the vendor's own `stockQuality` range, unaffected by this.
   */
  private grantsOf(id: QuestId): readonly { itemId: string; count: number; quality?: QualityLevel }[] {
    return ((QUESTS[id] as { grant?: readonly { itemId: string; count: number; quality?: QualityLevel }[] })
      .grant ?? []) as readonly { itemId: string; count: number; quality?: QualityLevel }[];
  }

  /**
   * Every item this quest can ever hand over: the accept-time `grant`, PLUS
   * every stage's `onComplete.grant` that has ACTUALLY been applied so far
   * (tracked in `grantedStages`, never guessed from `stageIndex` — see that
   * field's doc comment for why the two are not the same question).
   * Deliberately excludes any stage not yet granted: those items don't exist
   * in the player's world yet, so treating them as "already granted, top up
   * if missing" would hand out a later reward to someone who hasn't earned it.
   *
   * This is what `isQuestItem`/`replenishGrants` read instead of `grantsOf`
   * directly — a mid-quest gift (the Ojciec's stick is accept-time, but a
   * stage's `onComplete.grant` is not) needs the exact same "can't sell it,
   * one free replacement" protection the original design gave the stick, or
   * the whole safety net silently stops covering half of what a quest can
   * give out.
   */
  private allGrantsOf(id: QuestId): readonly { itemId: string; count: number; quality?: QualityLevel }[] {
    const grantedStages = stagesOf(id).filter((s) => this.grantedStages.has(this.stageGrantKey(id, s.id)));
    return [...this.grantsOf(id), ...grantedStages.flatMap((s) => s.onComplete?.grant ?? [])];
  }

  /** Move a quest from `available` into the active log, handing over anything
   *  the giver supplies with it (the Ojciec's stick). */
  accept(id: QuestId): boolean {
    if (this.getStatus(id) !== "available") return false;
    this.status.set(id, "active");
    this.stageIndex.set(id, 0);
    this.counters.set(id, objectivesOf(id).map(() => 0));
    for (const g of this.grantsOf(id)) Inventory.addItem(g.itemId as ItemId, g.count, g.quality);
    // A freshly-accepted quest can already be met on stage 0 (e.g. its sole
    // `collect` objective is satisfied by items the player already carries),
    // exactly as a legacy single-stage quest could already be "ready" the
    // instant it was accepted — this just extends that to auto-advance past
    // it instead of leaving it sitting there unnoticed.
    this.advanceStages(id);
    this.emitChanged();
    return true;
  }

  /**
   * Walk `id` forward through as many already-met stages as it can, in one
   * go — looping rather than advancing once is what makes this correct after
   * a SINGLE event (e.g. accepting the quest already satisfies stage 0 AND
   * stage 1 happens to already be met too).
   *
   * ⚠ **A stage's `onComplete.grant` fires when ITS OWN objectives become
   * met, whether or not there is a next stage to move into — the last stage
   * is not exempt.** The first version of this method treated "is this the
   * last stage" as "nothing to do here", which silently ate the grant on
   * whichever stage happens to be final (`visit_patryczek`'s owijki, in the
   * one quest that uses this today). `grantedStages` is what makes "fire
   * exactly once, regardless of whether the stage ever advances again" safe:
   * without it, the last stage's already-true `isObjectiveMet` would either
   * never grant (gated on "moving to a next stage" that doesn't exist) or
   * grant again on every later event (gated on "objectives are met", which
   * stays true forever after).
   *
   * ⚠ **The backpack-room check runs BEFORE anything else about the grant
   * happens, and blocks the WHOLE step if it fails** — same all-or-nothing
   * rule `Quests.complete` already applies to a reward item. The alternative
   * (advance anyway, drop the item on the ground, or silently skip it) was
   * explicitly rejected: nothing a quest hands over may vanish because the
   * player's bag happened to be full at that exact moment. The stage stays
   * "met but not yet granted" and tries again on the next
   * `inventoryChanged`/`equipmentChanged` — the player freeing one slot is
   * what unblocks it, with no extra input required.
   */
  private advanceStages(id: QuestId): boolean {
    if (this.getStatus(id) !== "active") return false;
    let changed = false;
    for (;;) {
      const stages = stagesOf(id);
      const idx = this.stageIndex.get(id) ?? 0;
      const stage = stages[idx];
      if (!this.isObjectiveMet(id)) return changed; // current stage not done yet

      const key = this.stageGrantKey(id, stage.id);
      if (!this.grantedStages.has(key)) {
        const grants = stage.onComplete?.grant ?? [];
        if (grants.some((g) => !Inventory.hasRoomFor(g.itemId as ItemId, g.count, g.quality))) return changed;
        for (const g of grants) Inventory.addItem(g.itemId as ItemId, g.count, g.quality);
        this.grantedStages.add(key);
        changed = true;
      }

      if (idx >= stages.length - 1) return changed; // last stage — nothing further to move into
      this.stageIndex.set(id, idx + 1);
      this.counters.set(id, stages[idx + 1].objectives.map(() => 0));
      changed = true;
    }
  }

  /**
   * ⚠ **Re-entrancy guard — found live, not in review, and it was a real
   * runaway, not a cosmetic glitch.** `advanceStages` calls `Inventory.
   * addItem` for a stage's `onComplete.grant`; `Inventory.addItem` emits
   * `inventoryChanged` SYNCHRONOUSLY; the `inventoryChanged` listener below
   * calls `advanceAllActive()` again. Without this guard that nested call
   * runs BEFORE the outer frame has reached `grantedStages.add(key)`, so it
   * sees the same stage as still-ungranted and grants it AGAIN — which
   * itself emits `inventoryChanged` again, recursing until either the stack
   * blows or the bag fills up and `hasRoomFor` finally breaks the chain,
   * having handed out a pile of duplicate items and fired dozens of
   * `questsChanged`/`inventoryChanged` events in one synchronous tick. Every
   * NPC dialogue open listens to both (`NpcDialog.refreshOptions`,
   * `QuestPanel.refresh`), so that storm was tearing down and rebuilding the
   * option rows repeatedly inside a single frame — the reported "yellow
   * background while granting mid-conversation" was this, not a colour bug.
   */
  private sweeping = false;

  /** `advanceStages` for every quest currently in the log — the generic
   *  aftermath of an event (a kill, a conversation, an inventory change) that
   *  could have finished ANY active quest's current stage, not just one in
   *  particular. Advancing an unmet stage is a no-op, so sweeping the whole
   *  active set on every such event is safe, just occasionally redundant —
   *  EXCEPT for the re-entrant case `sweeping` guards against; see above. */
  private advanceAllActive(): boolean {
    if (this.sweeping) return false;
    this.sweeping = true;
    try {
      let changed = false;
      for (const id of Object.keys(QUESTS) as QuestId[]) {
        if (this.getStatus(id) === "active" && this.advanceStages(id)) changed = true;
      }
      return changed;
    } finally {
      this.sweeping = false;
    }
  }

  /**
   * Is this item currently a QUEST ITEM — granted by a quest that is still
   * active? Shops refuse to buy these, and that refusal is what makes the
   * whole grant mechanic safe: a stick you can hand back for coin, from a man
   * who will hand you another one, is an infinite gold faucet. The item is
   * yours to sell the moment the quest is turned in, and not before.
   */
  isQuestItem(itemId: ItemId): boolean {
    return (Object.keys(QUESTS) as QuestId[]).some(
      (id) => this.getStatus(id) === "active" && this.allGrantsOf(id).some((g) => g.itemId === itemId),
    );
  }

  /**
   * Ile sztuk tego przedmiotu **trzyma dla siebie** jakieś aktywne zadanie —
   * czyli ile musi zostać w plecaku (albo na postaci), żeby dało się je oddać.
   *
   * ⚠ **To jest osobna reguła od `isQuestItem` i celowo działa inaczej.**
   * `isQuestItem` blokuje sprzedaż CAŁKOWICIE, bo dotyczy przedmiotu, który
   * dawca wręczył i wręczy ponownie — tam wolno tylko „nie" albo „tak". Tu
   * blokada jest **ilościowa**: nadwyżkę wolno sprzedać, ostatnich pięciu
   * kawałków mięsa pod `rabbit_hunt` już nie. Bez tego rozróżnienia albo
   * blokujemy handel surowcami na czas zadania (upierdliwe), albo pozwalamy
   * wysprzedać cel (ślepy zaułek).
   *
   * ⚠ **Powstało pod kieł Szarego i to jest przypadek graniczny, który tę
   * regułę wymusił.** Reszta celów typu `collect` chodzi po przedmiotach,
   * które się odradzają — zając, dzik, pokrzywa. Szary **nie odradza się
   * nigdy** (`respawnDelay: 0` plus bramka na `killCount`), więc sprzedany
   * kieł to zadanie, którego już nikt nie skończy, i naszyjnik, którego już
   * nikt nie dostanie. Tak samo naszyjnik pod celem `equip` u Sołtysa.
   *
   * Liczone SUMĄ po zadaniach, nie maksimum: dwa aktywne zadania po trzy
   * rumianki naprawdę potrzebują sześciu, bo oddanie każdego z nich zjada
   * własne trzy.
   */
  reservedCount(itemId: ItemId): number {
    let total = 0;
    for (const id of Object.keys(QUESTS) as QuestId[]) {
      if (this.getStatus(id) !== "active") continue;
      for (const o of objectivesOf(id)) {
        if (o.kind === "collect" && o.itemId === itemId) total += o.count;
        if (o.kind === "equip" && o.itemId === itemId) total += 1;
      }
    }
    return total;
  }

  /**
   * Re-hand any granted item the player no longer has, for every ACTIVE quest
   * of this giver — **once per quest, ever.** Called when a conversation opens.
   *
   * This is the safety net, not the supply: `isQuestItem` already stops the
   * item being sold while the quest runs, so under normal play this never
   * fires. It exists because the first playtest of the bag-start version sold
   * the stick and left the opening quest impossible, and a touch game has no
   * console to climb out of a dead end with. One replacement is enough to
   * recover from any loss path we don't know about yet; it is capped so that
   * an unforeseen one can never become a repeatable income either.
   *
   * Checks the equipped slots too, or walking up to the Hunter wearing the very
   * stick he gave you would look like a loss and earn you a second one.
   */
  replenishGrants(giver: string): void {
    for (const id of this.questsForGiver(giver)) {
      if (this.getStatus(id) !== "active" || this.replenished.has(id)) continue;
      for (const g of this.allGrantsOf(id)) {
        const itemId = g.itemId as ItemId;
        const held = Inventory.countItem(itemId) + (Equipment.isEquipped(itemId) ? 1 : 0);
        if (held >= g.count) continue;
        Inventory.addItem(itemId, g.count - held, g.quality);
        this.replenished.add(id);
      }
    }
  }

  /**
   * Turn a quest in: it must be active, every objective met, **and the player
   * must be talking to the right person**. Consumes the `collect` objectives'
   * items (nothing else is taken — a kill is spent already, and confiscating
   * the stick you were just told to carry would be absurd) and grants the
   * reward. No-op otherwise.
   *
   * ⚠ **`atNpc` jest WYMAGANY, nie opcjonalny — celowo.** Do 2026-08-23 ta
   * metoda nie pytała o NPC w ogóle, a „u kogo się oddaje" pilnował wyłącznie
   * fakt, że `QuestPanel` listuje zadania po `giver`. Skutek: `turnInNpc`
   * istniało w danych i w etykiecie trackera („Wróć do: Kowal"), ale nie
   * w mechanice — oddać dałoby się u dawcy. Parametr wymagany, bo kompilator
   * ma zadać to pytanie każdemu przyszłemu wołającemu; opcjonalny dawałby się
   * pominąć dokładnie tam, gdzie zapomnienie boli.
   */
  complete(id: QuestId, atNpc: NpcId): boolean {
    if (turnInNpcOf(id) !== atNpc) return false;
    if (this.getStatus(id) !== "active" || !this.isObjectiveMet(id)) return false;
    const objectives = objectivesOf(id);
    // Check every removal is possible before performing any of them — the same
    // rule Skills.learn follows for its two costs, so a partial turn-in cannot
    // eat half the goods and then fail.
    const toConsume = objectives.filter((o) => o.kind === "collect") as Extract<
      Objective,
      { kind: "collect" }
    >[];
    if (toConsume.some((o) => Inventory.countItem(o.itemId as ItemId) < o.count)) return false;

    const r = rewardOf(id);
    // A reward ITEM must have somewhere to land before anything else about
    // this turn-in happens — refuse the whole thing rather than hand it over
    // and lose it to a full backpack. Same rule `GameScene.onGather` already
    // follows for a plant node: never silently waste what the player just
    // earned. Checked here, before the collect objectives are consumed, for
    // the same all-or-nothing reason as the check above.
    if (r.item && !Inventory.hasRoomFor(r.item.itemId as ItemId, r.item.count ?? 1, r.item.quality)) {
      return false;
    }

    for (const o of toConsume) Inventory.removeItem(o.itemId as ItemId, o.count);

    this.status.set(id, "completed");
    if (r.gold) Inventory.addGold(r.gold);
    if (r.xp) Progression.addXp(r.xp);
    if (r.item) Inventory.addItem(r.item.itemId as ItemId, r.item.count ?? 1, r.item.quality);
    this.emitChanged();
    return true;
  }

  /* ── Queries ──────────────────────────────────────────────────────────── */

  /**
   * Ids of quests **authored by** a given NPC (whatever their current status).
   *
   * ⚠ **To pytanie „kto to wymyślił", NIE „kto się tym teraz zajmuje".** Do
   * odpowiedzi na to drugie służy `questsAtNpc` — i to jej używa każde UI,
   * które pyta „co ten mieszkaniec ma dla mnie". Ta zostaje wyłącznie dla
   * `replenishGrants`, bo to DAWCA wręczył przedmiot i dawca wręcza go
   * ponownie.
   */
  questsForGiver(giver: string): QuestId[] {
    return (Object.keys(QUESTS) as QuestId[]).filter((id) => QUESTS[id].giver === giver);
  }

  /**
   * Ids of quests this NPC should surface right now — **the routing rule**,
   * and the one every panel and marker asks.
   *
   * ⚠ **Bierze quest OD dawcy, ale oddaje się go u `turnInNpcOf`**, i to jest
   * cała różnica względem `questsForGiver`:
   *
   *  • `available` → u DAWCY. To on ma robotę do rozdania.
   *  • `active`/`completed` → u `turnInNpcOf` (domyślnie = dawca). To do niego
   *    się z tym wraca.
   *
   * Dopóki żaden quest nie ustawia `turnInNpc`, obie funkcje zwracają
   * identyczne listy — dlatego ta zmiana niczego dziś nie przestawia. Powstała,
   * bo `turnInNpcOf` istniało od poprzedniego passu, ale **czytała je wyłącznie
   * etykieta** (`QuestGuidance`): tracker mówiłby „Wróć do: Kowal", a oddać
   * dałoby się tylko u Myśliwego. Interfejs, który kłamie o tym, dokąd iść,
   * jest gorszy niż brak wskazówki. Pilnuje tego §4
   * `tools/quest_guidance_weryfikacja.mjs`.
   */
  questsAtNpc(npc: string): QuestId[] {
    return (Object.keys(QUESTS) as QuestId[]).filter((id) =>
      this.getStatus(id) === "available" ? QUESTS[id].giver === npc : turnInNpcOf(id) === npc,
    );
  }

  /**
   * True unless the quest has an unmet prerequisite. Two kinds, both optional:
   * a learned skill (`requires`) and a finished earlier quest (`requiresQuest`).
   * A locked quest is hidden from its giver entirely, so a follow-up is never a
   * spoiler and a chain reveals itself one link at a time.
   */
  isUnlocked(id: QuestId): boolean {
    // ⚠ **Warunek odpowiada na „czy mogę to ZACZĄĆ", nigdy na „czy mogę to
    // ODDAĆ".** Zadanie, które jest już w dzienniku, zostaje odblokowane bez
    // względu na warunki — i to nie jest wyjątek dla wygody, tylko naprawa
    // pułapki, która do tej pory blokowała przekładanie kolejności zadań
    // w ogóle.
    //
    // Bez tego dopisanie `requiresQuest` do zadania, które ktoś ma AKTYWNE
    // w zapisie, ukrywa je u dawcy i czyni **nieoddawalnym na zawsze** —
    // postać zostaje z wpisem w dzienniku, którego nie da się domknąć.
    // `CLAUDE.md` notuje to jako powód, dla którego `wolf_pack_cull`
    // świadomie NIE został wstawiony przed `grey_wolf_revenge`, mimo że
    // narracyjnie tam pasował. Przy dokładaniu Patryczka przed zadania
    // Zielarki ta sama pułapka wróciła — więc zamiast omijać ją po raz drugi,
    // znika u źródła.
    if (this.getStatus(id) !== "available") return true;
    if (!this.unlockedExceptTopic(id)) return false;
    const t = (QUESTS[id] as { requiresTopic?: string }).requiresTopic;
    return !t || this.topicAsked(t);
  }

  /**
   * ⭐ **Zadanie czeka WYŁĄCZNIE na rozmowę** (`requiresTopic`, 2026-10-14 —
   * zadania jako gałęzie tematów, pierwszy: Gniewko). Wszystkie inne bramki
   * spełnione, brakuje tylko pytania, z którego zadanie wyrasta. Dla świata
   * to „ma robotę” (`!` nad głową, powitanie `firstJob`), dla rozmowy — temat
   * z `!` na górze kolumny; ofertę otwiera dopiero odpowiedź na niego.
   */
  waitsOnTopic(id: QuestId): boolean {
    if (this.getStatus(id) !== "available") return false;
    const t = (QUESTS[id] as { requiresTopic?: string }).requiresTopic;
    return !!t && !this.topicAsked(t) && this.unlockedExceptTopic(id);
  }

  private unlockedExceptTopic(id: QuestId): boolean {
    const q = QUESTS[id] as { requires?: string; requiresQuest?: string };
    if (q.requires && !Skills.has(q.requires as SkillId)) return false;
    if (q.requiresQuest && this.getStatus(q.requiresQuest as QuestId) !== "completed") return false;
    return true;
  }

  /**
   * Czy temat rozmowy padł (u kogokolwiek). ⚠ **Wstrzykiwane przez
   * `Dialogue`** (`setTopicSource`) — `Dialogue` importuje `Quests`, więc
   * import w drugą stronę zamknąłby pętlę modułów. Bez źródła: „nie padł”
   * (bramka zostaje zamknięta, nie otwarta — bezpieczniej dla zadania).
   */
  private topicAsked: (topicId: string) => boolean = () => false;
  setTopicSource(f: (topicId: string) => boolean): void {
    this.topicAsked = f;
  }

  /**
   * The single quest to surface on a giver's banner: skip prerequisite-locked
   * ones, then prefer an active quest, then an available one, then a completed
   * one (so its ✓ still shows). Undefined if the giver has nothing to show yet.
   */
  bannerQuestForGiver(giver: string): QuestId | undefined {
    const rank = (id: QuestId): number => {
      const s = this.getStatus(id);
      return s === "active" ? 0 : s === "available" ? 1 : 2;
    };
    return this.questsForGiver(giver)
      .filter((id) => this.isUnlocked(id))
      .sort((a, b) => rank(a) - rank(b))[0];
  }

  /** Ids currently in the active/completed log (i.e. not merely available). */
  logQuests(): QuestId[] {
    return (Object.keys(QUESTS) as QuestId[]).filter((id) => this.getStatus(id) !== "available");
  }

  reset(): void {
    this.initStatuses();
    this.kills.clear();
    this.emitChanged();
  }

  /* ── Save ─────────────────────────────────────────────────────────────── */

  /** Snapshot of every quest's status, for saving. */
  snapshot(): Record<QuestId, QuestStatus> {
    return Object.fromEntries(this.status) as Record<QuestId, QuestStatus>;
  }

  /** Latched objective counters, for saving. Separate from `snapshot()` so it
   *  can be an OPTIONAL save field — a pre-existing save without it loads as
   *  "no progress recorded yet" rather than being discarded. */
  progressSnapshot(): Partial<Record<QuestId, number[]>> {
    return Object.fromEntries(this.counters) as Partial<Record<QuestId, number[]>>;
  }

  /** Lifetime kill tally, for saving. Optional field, same reasoning. */
  killSnapshot(): Partial<Record<EnemyType, number>> {
    return Object.fromEntries(this.kills) as Partial<Record<EnemyType, number>>;
  }

  /** Quests that have already used up their one grant replacement. */
  replenishedSnapshot(): QuestId[] {
    return [...this.replenished];
  }

  /**
   * Which stage a multi-stage quest is on, for saving — by STRING id, never
   * by index (the same reason `QuestStage.id` is a string: reordering
   * `stages` in a later content update must not silently repoint a saved
   * "currently on stage 2" at the wrong step). Only written for quests that
   * actually HAVE `stages` — a legacy single-stage quest has nothing to
   * remember here, so it never appears in this record at all.
   */
  stageSnapshot(): Partial<Record<QuestId, string>> {
    const out: Partial<Record<QuestId, string>> = {};
    for (const id of Object.keys(QUESTS) as QuestId[]) {
      if (this.getStatus(id) === "available") continue;
      const stages = stagesOf(id);
      if (stages.length <= 1) continue; // legacy quest — nothing to remember
      out[id] = this.currentStage(id).id;
    }
    return out;
  }

  /**
   * Which stages have already had `onComplete.grant` applied — see
   * `grantedStages`'s own doc comment for why this is NOT derivable from
   * `stageSnapshot()` alone (the last stage's grant and its "current stage"
   * status are two different facts once it's been met). Composite keys
   * (`questId::stageId`), same shape the field already uses internally.
   */
  grantedStagesSnapshot(): string[] {
    return [...this.grantedStages];
  }

  /** Restore from a save — unlike accept()/complete(), this bypasses the normal
   *  transition guards since the data is already known-valid. */
  restore(
    statuses: Partial<Record<QuestId, QuestStatus>>,
    progress: Partial<Record<QuestId, number[]>> = {},
    kills: Partial<Record<EnemyType, number>> = {},
    replenished: readonly QuestId[] = [],
    stages: Partial<Record<QuestId, string>> = {},
    grantedStages: readonly string[] = [],
  ): void {
    this.initStatuses();
    for (const id of Object.keys(QUESTS) as QuestId[]) {
      const status = statuses[id];
      if (status) this.status.set(id, status);
      if (this.getStatus(id) === "available") continue;

      // Resolve the saved stage id to an index BEFORE sizing counters below —
      // `objectivesOf`/`currentStage` read `stageIndex`, so this must be set
      // first or counters would size against stage 0 regardless of where the
      // save actually left off. Unknown/missing saved id (a stage renamed or
      // removed since, or simply a legacy quest that never had one) falls
      // back to index 0 rather than throwing — same "never leave a hole"
      // rule the objective re-fit below already follows.
      const savedStageId = stages[id];
      const allStages = stagesOf(id);
      const idx = savedStageId ? Math.max(0, allStages.findIndex((s) => s.id === savedStageId)) : 0;
      this.stageIndex.set(id, idx);

      // Re-fit to the CURRENT objective list rather than trusting the saved
      // array's length: adding an objective to a quest already in someone's log
      // would otherwise leave a hole that reads as `undefined` progress.
      const saved = progress[id];
      this.counters.set(id, objectivesOf(id).map((_, i) => saved?.[i] ?? 0));
    }
    this.kills.clear();
    for (const [kind, n] of Object.entries(kills)) this.kills.set(kind as EnemyType, n ?? 0);
    this.replenished.clear();
    for (const id of replenished) this.replenished.add(id);
    // Already cleared by initStatuses() above — this only re-populates it.
    // Restoring this WRONG (e.g. deriving it from `stages` instead) is the
    // exact bug `grantedStages`'s doc comment warns about: a reload that
    // forgets a terminal stage's grant already fired would hand it out
    // again on the next `inventoryChanged`/`equipmentChanged`.
    for (const key of grantedStages) this.grantedStages.add(key);
    this.emitChanged();
  }

  emitChanged(): void {
    GameEvents.emit(EVENT.questsChanged, { status: Object.fromEntries(this.status) });
  }
}

export const Quests = new QuestState();

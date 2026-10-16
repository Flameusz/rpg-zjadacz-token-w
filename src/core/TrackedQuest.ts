import { QUESTS } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Quests, type QuestId, type QuestStatus } from "./Quests";

/**
 * Which single quest the HUD tracker is following.
 *
 * ⚠ **Deliberately NOT a field on `QuestState`.** Nothing here affects what a
 * quest IS, what it asks for or whether it can be handed in — it is a
 * presentation preference, the same kind of thing as which backpack slot is
 * selected. `Quests` is the authority every rule in the game reads; putting a
 * "which one am I looking at" flag inside it would mean save/restore, the
 * re-entrancy guard and `advanceAllActive` all carrying a value none of them
 * can act on.
 *
 * It IS persisted (an optional save field — see `Save.trackedQuest`), because
 * losing your tracker on every reload is the sort of small forgetting that
 * makes a game feel careless. Additive and optional, so `SAVE_VERSION` did not
 * move.
 *
 * ── How the tracked quest is chosen ───────────────────────────────────────
 * 1. Accepting a quest tracks it — the one you just agreed to is the one you
 *    are about to go do.
 * 2. Finishing the tracked one falls through to the oldest still-active quest
 *    in config order, or to nothing when the log is empty.
 * 3. The journal can set it by hand, which beats both.
 */
class TrackedQuestState {
  private tracked: QuestId | null = null;
  /**
   * Last seen status per quest, so `questsChanged` can be read as "what
   * transitioned" rather than just "something moved".
   *
   * ⚠ **Diffing here instead of adding a `questAccepted` event, and that is
   * the smaller change of the two.** `Quests` already emits on every accept,
   * kill, pickup, stage advance and turn-in; a second event fired from
   * `accept()` would be a new thing for `QuestState` to remember to do
   * correctly, forever, for the benefit of one listener. This module is the
   * only thing that cares, so it does the work.
   */
  private lastStatus = new Map<QuestId, QuestStatus>();

  constructor() {
    this.seed();
    GameEvents.on(EVENT.questsChanged, this.onQuestsChanged, this);
  }

  get id(): QuestId | null {
    return this.tracked;
  }

  /** Follow this quest. Ignores anything not currently active — the tracker
   *  has nothing useful to say about a quest you haven't taken or have
   *  already finished (see `QuestGuidance`). */
  set(id: QuestId | null): void {
    if (id !== null && Quests.getStatus(id) !== "active") return;
    if (this.tracked === id) return;
    this.tracked = id;
    GameEvents.emit(EVENT.trackedQuestChanged, { id });
  }

  private onQuestsChanged(): void {
    const before = this.lastStatus;
    this.lastStatus = new Map();
    let accepted: QuestId | null = null;
    let acceptedCount = 0;

    for (const id of Object.keys(QUESTS) as QuestId[]) {
      const now = Quests.getStatus(id);
      this.lastStatus.set(id, now);
      if (now === "active" && before.get(id) !== "active") {
        accepted = id;
        acceptedCount++;
      }
    }

    // ⚠ Exactly ONE quest going active means the player just accepted it.
    // Several at once is a save being restored (`Quests.restore` re-emits the
    // whole log in one go), and adopting an arbitrary one of those would
    // fight the tracked id that `Save.load` is about to restore anyway.
    if (acceptedCount === 1 && accepted) {
      this.set(accepted);
      return;
    }

    // The tracked quest finished (or vanished from the log) — fall through to
    // whatever is still open rather than leaving a dead tracker on screen.
    if (this.tracked === null || Quests.getStatus(this.tracked) !== "active") {
      this.set(this.firstActive());
    }
  }

  /** Oldest still-active quest in config order — the order the author wrote
   *  them in, which is as close to "what you took first" as the log gets. */
  private firstActive(): QuestId | null {
    return (Object.keys(QUESTS) as QuestId[]).find((id) => Quests.getStatus(id) === "active") ?? null;
  }

  private seed(): void {
    this.lastStatus = new Map();
    for (const id of Object.keys(QUESTS) as QuestId[]) this.lastStatus.set(id, Quests.getStatus(id));
  }

  /** Snapshot for the save file. */
  snapshot(): QuestId | null {
    return this.tracked;
  }

  /**
   * Restore from a save. **Must run after `Quests.restore`** — it validates
   * against live quest status, and it re-seeds the status snapshot so the
   * diffing above doesn't act on the restore's own bulk emit.
   *
   * A saved id that is no longer active (content changed, or the quest was
   * finished in another slot) falls back to the same rule a fresh accept
   * would use, rather than restoring a tracker pointing at nothing.
   */
  restore(id: QuestId | null | undefined): void {
    this.seed();
    this.tracked = id && Quests.getStatus(id) === "active" ? id : this.firstActive();
    GameEvents.emit(EVENT.trackedQuestChanged, { id: this.tracked });
  }

  reset(): void {
    this.seed();
    this.tracked = null;
    GameEvents.emit(EVENT.trackedQuestChanged, { id: null });
  }
}

export const TrackedQuest = new TrackedQuestState();

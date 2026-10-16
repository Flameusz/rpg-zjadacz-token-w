import { GameEvents, EVENT } from "./EventBus";
import { Quests, type QuestId } from "./Quests";
import { Gathering } from "./Gathering";
import type { NpcDef, Topic } from "./Npcs";

/**
 * What the player has asked about, across every NPC in the world.
 *
 * A module-level singleton for the same reason as Progression/Inventory/
 * Quests: it outlives the Player across death, respawn and map transitions,
 * and `reset()` starts a fresh run.
 *
 * **The set is deliberately GLOBAL, not per-NPC.** A topic's `after` gate can
 * therefore name something you learned from somebody else — the Hunter tells
 * you the wolf has a name, and *that* is what lets you raise him with the
 * Sołtys. Keeping the asked-set per NPC would turn every conversation into its
 * own sealed menu, which is exactly the thing this layer exists to stop being.
 *
 * Nothing here decides what a topic SAYS — the text lives in `NpcDef.topics`
 * in GameConfig, next to the NPC it belongs to. This only answers "may I ask
 * this yet?" and "have I already?", the same split `Abilities` uses against
 * `GameScene` and `Buffs` uses against the buff bar.
 */
class DialogueState {
  private asked = new Set<string>();

  /** Has this exact topic been asked, of anyone? */
  isAsked(id: string): boolean {
    return this.asked.has(id);
  }

  /**
   * Is this topic currently askable? Both gates are AND-ed, and both hide
   * rather than grey out — a question you cannot ask yet is one you have no
   * reason to know exists, and listing it would spoil the chain it belongs to.
   */
  private isUnlocked(t: Topic): boolean {
    if (t.after?.some((id) => !this.asked.has(id))) return false;
    if (t.requiresQuest && Quests.getStatus(t.requiresQuest as QuestId) !== "completed") return false;
    // The only gate keyed to something done in the WORLD rather than said in a
    // conversation: you have to have picked the plant before anyone will tell
    // you what it is. See `Topic.requiresHerb`.
    if (t.requiresHerb && !Gathering.hasDiscovered(t.requiresHerb)) return false;
    return true;
  }

  /** Everything this NPC can be asked about right now, in config order. */
  available(npc: NpcDef): readonly Topic[] {
    return (npc.topics ?? []).filter((t) => this.isUnlocked(t));
  }

  /** How many askable topics this NPC has that the player hasn't raised yet —
   *  what the hub's "Rozmowa" row counts, and the only reason a player would
   *  walk back to a villager they already spoke to. */
  newCount(npc: NpcDef): number {
    return this.available(npc).filter((t) => !this.asked.has(t.id)).length;
  }

  /** Record a topic as asked. Emits only on the FIRST time, because that is the
   *  only moment anything can change: an already-asked topic re-read changes no
   *  gate, and firing anyway would autosave on every click in the panel. */
  ask(id: string): void {
    if (this.asked.has(id)) return;
    this.asked.add(id);
    this.emitChanged();
  }

  reset(): void {
    this.asked.clear();
    this.emitChanged();
  }

  /** For saving. */
  snapshot(): string[] {
    return [...this.asked];
  }

  /** Restore from a save. Unknown ids are kept rather than dropped: a topic
   *  removed from config today may come back tomorrow, and silently forgetting
   *  that the player already heard it would re-flag it as new. */
  restore(ids: readonly string[]): void {
    this.asked = new Set(ids);
    this.emitChanged();
  }

  emitChanged(): void {
    GameEvents.emit(EVENT.dialogueChanged, { asked: [...this.asked] });
  }
}

export const Dialogue = new DialogueState();
// Bramka zadania „po rozmowie” (`requiresTopic`) — `Quests` nie może
// importować tego modułu (pętla), więc dostaje odczyt stąd.
Quests.setTopicSource((id) => Dialogue.isAsked(id));

import {
  Quests,
  getQuest,
  goalOf,
  objectiveLabel,
  objectiveParts,
  objectivesOf,
  objectiveText,
  turnInNpcOf,
  type QuestId,
} from "./Quests";
import { NPCS, type NpcId } from "./Npcs";

/**
 * **The one answer to "what should the player do with this quest right now".**
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * The HUD tracker and both journal views need the same sentence, and before
 * this each of them would have had to assemble it out of the same three
 * pieces by hand: `Quests.isObjectiveMet(id)`, `objectivesOf(id)` and the
 * quest's `giver`. Three hand-rolled copies of one rule is how the reward
 * line ended up printing "undefinedg" in two panels at once (see
 * `Quests.rewardText`, which exists for exactly that reason) — so the rule
 * gets one home before there are three readers, not after.
 *
 * ── What this is NOT ──────────────────────────────────────────────────────
 * Not a planner. With several objectives outstanding it names **the first
 * unmet one in config order** and stops there; it does not rank them by
 * distance, difficulty or what the player is near. That ordering is the
 * author's, in the config, and is good enough for every quest shipped —
 * inventing a smarter one would mean inventing the data it needs.
 *
 * Not a navigator either. `turnIn` carries an NPC **id and name**, nothing
 * about where they stand: no arrow, no marker, no distance. Knowing WHO to
 * look for is the problem being solved here; knowing WHERE is a different
 * feature with different data behind it.
 *
 * Pure: no Phaser, no scene, no side effects. Safe to call from a render
 * loop and safe to test in Node.
 */

/**
 * ⚠ **„Wróć do", z nazwą po dwukropku — wymuszone GRAMATYKĄ, nie gustem.**
 * Polskie „wróć do" rządzi dopełniaczem, a imion w tej grze nie da się
 * odmienić regułą: *Hanna→Hanny* jest regularne, ale *Myśliwy→Myśliwego* jest
 * przymiotnikowe, a *Ojciec→Ojca* zmienia temat. Pierwsza wersja tego modułu
 * składała `Wróć do ${name}` i drukowała **„Wróć do Myśliwy"** — złapane przez
 * `tools/quest_guidance_weryfikacja.mjs`, nie przez lekturę.
 *
 * Rozwiązaniem jest ten sam wzorzec, który mają wszystkie cztery cele
 * (`Quests.objectiveParts`): **CZASOWNIK: Mianownik**. Dwukropek cytuje nazwę
 * zamiast wpinać ją w zdanie, więc przypadek nie jest potrzebny nigdzie —
 * i cały tracker mówi jednym językiem:
 *
 *     Porozmawiaj: Patryczek
 *     Wróć do: Myśliwy
 *     Zbierz: Krwawnik 3/5
 *     Ubij: Wilk 4/6
 *
 * ⚠ Decyzja autora (2026-08-23): **`nameGenitive` na `NpcDef` NIE powstaje.**
 * Tracker jest listą celów, nie zdaniami — fleksja polskiego zostaje poza
 * zakresem projektu.
 */
const TURN_IN_VERB = "Wróć do";

/**
 * What to do next, **as parts** — never as one baked sentence.
 *
 * ⚠ `verb` and `subject` stay separate all the way to the widget, and that is
 * the point: `subject` is a NOMINATIVE name (see `Quests.objectiveParts`),
 * and joining it into prose down here is exactly how „Wróć do Myśliwy" got
 * written the first time. One place composes them for display —
 * `guidanceText` below — and a widget that wants to style the counter or the
 * name differently still can.
 */
export type QuestGuidance =
  /** Something is still outstanding. `index` points into `objectivesOf(id)`,
   *  i.e. the CURRENT stage's list. `have`/`goal` are only meaningful for a
   *  counted objective (`goal > 1`). */
  | {
      readonly kind: "objective";
      readonly verb: string;
      readonly subject: string;
      readonly have: number;
      readonly goal: number;
      readonly index: number;
      readonly npcId?: NpcId;
    }
  /** Every objective of the last stage is met — all that's left is to walk
   *  back and hand it in. */
  | {
      readonly kind: "turnIn";
      readonly verb: string;
      readonly subject: string;
      readonly npcId: NpcId;
      readonly npcName: string;
    }
  /** No live guidance: the quest is finished, or has not been accepted yet. */
  | { readonly kind: "none" };

/**
 * The one place guidance parts become a display string. Both journals and the
 * HUD tracker call this, so the four label shapes above can never drift into
 * three slightly different renderings of the same step.
 */
export function guidanceText(g: QuestGuidance): string {
  if (g.kind === "none") return "";
  const head = `${g.verb}: ${g.subject}`;
  // Counter appended with a SPACE — a second colon would read as a different
  // kind of separator than the first one. Uncounted objectives (talk, equip)
  // and turn-ins have nothing to append.
  if (g.kind === "objective" && g.goal > 1) return `${head} ${g.have}/${g.goal}`;
  return head;
}

/**
 * ⚠ **`available` collapses into `none` on purpose.** A quest nobody has
 * accepted is not in the log (`Quests.logQuests` filters it out) and is never
 * tracked, so "what should I do about it" has no answer this module could
 * give that isn't really "go find the giver" — which is the job of the "!"
 * over their head (`core/NpcStatus`), not of a tracker for quests you already
 * took.
 */
export function guidanceFor(id: QuestId): QuestGuidance {
  if (Quests.getStatus(id) !== "active") return { kind: "none" };

  const objectives = objectivesOf(id);
  const index = objectives.findIndex((_, i) => !Quests.isObjectiveDone(id, i));

  if (index === -1) {
    // Every objective of the current stage is met. Because stages
    // auto-advance the instant that happens (`Quests.advanceStages`), an
    // active quest sitting in this state can only be on its LAST stage —
    // i.e. this really is "ready to hand in", not "ready for step 3".
    const npcId = turnInNpcOf(id);
    const npcName = NPCS[npcId]?.name ?? npcId;
    return { kind: "turnIn", verb: TURN_IN_VERB, subject: npcName, npcId, npcName };
  }

  const o = objectives[index];
  const { verb, subject } = objectiveParts(o);
  return {
    kind: "objective",
    verb,
    subject,
    have: Quests.objectiveProgress(id, index),
    goal: goalOf(o),
    index,
    // ⚠ Read off the objective's own `npc` field, never parsed back out of a
    // rendered string. `talk` is the one objective kind that already names a
    // person as DATA, and that is what makes "Porozmawiaj: Patryczek"
    // trustworthy rather than a label that happens to contain a name.
    npcId: o.kind === "talk" ? (o.npc as NpcId) : undefined,
  };
}

/**
 * One objective rendered for a LOG entry — the completed-quest-safe wrapper
 * around `objectiveText`.
 *
 * ⚠ **Fixes a real reported bug, and fixes it presentationally only.**
 * `Quests.complete` consumes a `collect` objective's items on turn-in, and
 * `objectiveProgress` reads `collect` live off the backpack every time it is
 * asked — by design, so selling the meat un-completes the objective while the
 * quest is still open. The consequence was that a FINISHED quest's journal
 * entry read "Zbierz: Mięso królicze: 0/5", because the five had just been
 * handed over. Both journal views had it, because both called `objectiveText`
 * unconditionally.
 *
 * A completed quest's objectives are, by definition, all met — that is what
 * `complete()` checks before it consumes anything — so this pins the display
 * to the goal instead of re-asking the bag. **Nothing about
 * `objectiveProgress`, `isObjectiveDone` or `Inventory` changes**; this is a
 * formatter, and the live readings stay live for every quest still open.
 */
export function questObjectiveLine(id: QuestId, index: number): { text: string; done: boolean } {
  if (Quests.getStatus(id) !== "completed") {
    return { text: objectiveText(id, index), done: Quests.isObjectiveDone(id, index) };
  }
  const o = objectivesOf(id)[index];
  const goal = goalOf(o);
  const label = objectiveLabel(o);
  // Same two shapes `objectiveText` itself uses, with progress pinned to the
  // goal — so a finished "5/5" looks like the counter it replaced rather than
  // like a different widget. Counter on a SPACE, matching `objectiveText`.
  return { text: goal > 1 ? `${label} ${goal}/${goal}` : `${label}  ✓`, done: true };
}

/** The quest's title — here so a caller assembling a tracker line doesn't
 *  need `getQuest` as a second import just for one field. */
export function questTitle(id: QuestId): string {
  return getQuest(id).name;
}

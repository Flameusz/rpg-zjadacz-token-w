/**
 * Everything in the world the player can stand next to and press `E` on.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * There used to be no such thing. `GameScene.update()` ran TWO independent
 * proximity loops (one over NPCs, one over campfires), emitted two independent
 * events, and `NpcDialog` and `CampfirePrompt` each bound their own
 * `keydown-E` and each drew their own prompt — at the same screen position,
 * bottom-centre.
 *
 * Nothing stopped both from being in range at once except **the geometry of
 * the map**: the campfire is placed further from the Hunter than their two
 * interact ranges combined, checked by hand and asserted in a Python script
 * (see `CAMPFIRE.spawnSearchRadii`). That works for two kinds. It does not
 * work for four, because the guarantee is pairwise: every new kind has to be
 * measured against every existing one, on every map, forever — and the
 * failure mode is silent ("E does nothing" or "E does two things").
 *
 * Herb gathering is what made that untenable: dozens of nodes per map, placed
 * by hand in Tiled next to whatever else is there. So proximity is decided
 * ONCE, centrally, and **the nearest in-range thing wins**. Overlap stops
 * being a correctness bug and becomes at worst a cosmetic one.
 *
 * ── What this is NOT ──────────────────────────────────────────────────────
 * It is deliberately not a "do the thing" interface. Nothing here has an
 * `interact()` method, because the three kinds are answered in completely
 * different places and should stay there: an NPC opens a paused conversation
 * window (`NpcDialog`), a campfire runs one action with no window
 * (`GameScene.cookAt`), a herb is picked instantly (`GameScene.gatherFrom`).
 * All three are reached through one dispatcher, `GameScene.requestInteraction`
 * — but what EACH KIND MEANS still lives in exactly one place per kind, which
 * is the property this comment is actually protecting. Forcing them through
 * one method on `Interactable` itself would move UI decisions into entity
 * code — the exact reach-through every panel in this project avoids.
 *
 * This answers one question only: **what, if anything, is the player standing
 * next to right now.** Same split as `Abilities` ("may I?" vs GameScene's
 * "what happens") and `Buffs` (snapshot vs the bar that draws it).
 */

/** Which family of interaction this is — decides which UI reacts to it. */
export type InteractKind = "npc" | "campfire" | "gather";

export interface Interactable {
  readonly interactKind: InteractKind;
  /**
   * Which one, within its kind: an `NpcId` for a villager, a herb species id
   * for a node, `""` for a campfire (there is only ever one kind of fire).
   *
   * Together with `interactKind` this is what change-detection compares, so it
   * has to be stable for as long as the thing exists — walking from the Kowal
   * to Dorota must read as a change, and standing still must not.
   */
  readonly interactKey: string;
  /** How close the player has to be (px). Per-object, not per-kind: NPCs carry
   *  their own `NpcDef.interactRange`, and a herb's is much smaller. */
  readonly interactRange: number;
  /** World position — supplied for free by any Phaser GameObject. */
  readonly x: number;
  readonly y: number;
}

import { GameEvents, EVENT } from "./EventBus";

/** One species' regrowth bookmark on one map. */
interface Regrowth {
  /** Which STANOWISKO indices stood grown when the player left — not merely
   *  how many. See the class doc comment for why identity, not just count,
   *  has to survive a map transition. */
  active: readonly number[];
  /** Wall-clock time they left, in ms. */
  at: number;
}

/**
 * How far herb regrowth had got on each map the player has visited.
 *
 * ── Why this exists at all ────────────────────────────────────────────────
 * The game only ever has ONE map loaded: a portal is a `scene.restart()`, and
 * everything on the old map is torn down. So the question "what should be
 * growing in the forest while I'm in the village?" has no live answer, and
 * simulating one would mean keeping timers running for maps nobody is on —
 * which costs more with every location the game gains, and this game is
 * planned to gain a lot of them.
 *
 * **So nothing is simulated. Regrowth away from a map is arithmetic done once
 * on arrival**: which stanowiska were standing when you left, plus however
 * many respawn periods have passed since — grown onto NEW random stanowiska,
 * capped. The player cannot tell the difference for anything that happened
 * off-map, because nothing did.
 *
 * ── Identity, not just count ───────────────────────────────────────────────
 * The bookmark used to be a bare count (`active: number`). That is enough to
 * decide HOW MANY plants should be standing on arrival, but not WHICH — so
 * `NodeSpawner` re-rolled every stanowiso from scratch on every visit, and a
 * plant the player had never touched could "teleport" to a different bush on
 * the far side of the meadow purely because they crossed a portal and came
 * back. Reported directly: nothing happened to that plant while the player
 * was away, so it has no reason to move. Fixed by bookmarking the exact node
 * INDICES that were standing, not just how many — an untouched plant now
 * stays exactly where it was for as many map transitions as it takes for
 * someone to actually pick it. Only genuinely NEW growth (computed from
 * elapsed real time) lands on a freshly-chosen random stanowisko, which is
 * the only growth that has any business being random: nobody has seen it yet.
 *
 * Cost is still cheap: a short list of small integers per species per map,
 * not a game object.
 *
 * ── Two deliberate details ────────────────────────────────────────────────
 *  • **Wall clock, not scene time.** The whole point is to survive the game
 *    being closed; `scene.time` restarts with the scene. The known trade is
 *    that changing the system clock changes regrowth — which is a cheat nobody
 *    is being protected from here, since there is no competitive anything.
 *  • **No record means FULL, not empty.** A location visited for the first
 *    time has been growing undisturbed since before the game started; an empty
 *    forest on the first visit would read as the feature being broken. With no
 *    bookmark yet there is no "which stanowisko" to preserve either, so the
 *    first-ever visit is the one time the full set is still chosen at random
 *    (see `NodeSpawner.start`).
 */
class GatheringState {
  /** `${mapId}:${species}` → bookmark. */
  private marks = new Map<string, Regrowth>();
  /**
   * Species the player has picked at least once, ever.
   *
   * Two jobs, both about teaching rather than bookkeeping: it fires the
   * one-off real-world fact on a first pick, and it is what unlocks Dorota's
   * topic about that plant (`Topic.requiresHerb`). **Knowledge arrives from
   * having been in the field**, not from clicking down a menu — she can only
   * tell you about a plant you have actually brought back.
   */
  private discovered = new Set<string>();

  private key(mapId: string, species: string): string {
    return `${mapId}:${species}`;
  }

  /**
   * Which stanowisko indices should already be standing on arrival, or
   * `null` if this species has never been recorded on this map before (the
   * caller then seeds a full, freshly-random set — see `NodeSpawner.start`).
   *
   * `nodeCount`/`max`/`respawnMs` are passed in rather than read from config
   * here, so this module knows nothing about herbs specifically — a wood
   * pile or a mushroom patch will use it unchanged.
   */
  activeNodes(
    mapId: string,
    species: string,
    nodeCount: number,
    max: number,
    respawnMs: number,
  ): number[] | null {
    const mark = this.marks.get(this.key(mapId, species));
    if (!mark) return null; // never been here — nothing to preserve yet

    // Stanowiska that were standing are kept AS-IS: nothing touched them
    // while the player was elsewhere, so they have no reason to move. Guard
    // against the node list having shrunk since the bookmark was written.
    const kept = mark.active.filter((i) => i >= 0 && i < nodeCount);
    const keptSet = new Set(kept);

    // Only the GENUINELY NEW growth since departure is randomised, and only
    // onto stanowiska that were not already standing.
    const elapsed = Math.max(0, Date.now() - mark.at);
    const regrown = respawnMs > 0 ? Math.floor(elapsed / respawnMs) : max;
    const toAdd = Math.max(0, Math.min(max - kept.length, regrown));

    const free: number[] = [];
    for (let i = 0; i < nodeCount; i++) if (!keptSet.has(i)) free.push(i);
    const added: number[] = [];
    for (let i = 0; i < toAdd && free.length > 0; i++) {
      const pick = Math.floor(Math.random() * free.length);
      added.push(free.splice(pick, 1)[0]);
    }

    return [...kept, ...added];
  }

  /** Bookmark exactly which stanowiska were standing on the way out of a
   *  map. */
  record(mapId: string, species: string, activeNodes: readonly number[]): void {
    this.marks.set(this.key(mapId, species), { active: [...activeNodes], at: Date.now() });
    // Persisted state moved, and the autosave hangs off this event — same
    // arrangement every other singleton here uses.
    GameEvents.emit(EVENT.gatheringChanged);
  }

  /**
   * Record a first pick. Returns true only the FIRST time, which is what makes
   * the caller's "and here is what this plant actually is" fire once rather
   * than on every stem — a fact repeated on every pick stops being a reward
   * and becomes noise.
   */
  discover(species: string): boolean {
    if (this.discovered.has(species)) return false;
    this.discovered.add(species);
    GameEvents.emit(EVENT.gatheringChanged);
    return true;
  }

  /** Has the player ever picked this species? Gates Dorota's topic about it. */
  hasDiscovered(species: string): boolean {
    return this.discovered.has(species);
  }

  reset(): void {
    this.marks.clear();
    this.discovered.clear();
    GameEvents.emit(EVENT.gatheringChanged);
  }

  /** For saving. A plain object keyed by `map:species`. */
  snapshot(): Record<string, Regrowth> {
    return Object.fromEntries(this.marks);
  }

  /** Discovered species, for saving. Separate from `snapshot()` so each can be
   *  its own optional save field. */
  discoveredSnapshot(): string[] {
    return [...this.discovered];
  }

  /**
   * Restore from a save. Unknown keys are kept rather than dropped, for the
   * same reason `Dialogue.restore` keeps unknown topic ids: a species or a map
   * removed today may come back, and silently forgetting its bookmark would
   * hand the player a suspiciously full meadow on their next visit.
   *
   * A pre-this-change save carried `active` as a bare number, not an array —
   * coerced to `[]` (unknown WHICH nodes, only how many) rather than crashing
   * on `.filter`. Worst case that map reads as fuller than intended for one
   * visit; it self-corrects as soon as anything is picked.
   */
  restore(marks: Record<string, Regrowth> | undefined, discovered: readonly string[] = []): void {
    const entries = Object.entries(marks ?? {}).map(([k, v]) => {
      const active = Array.isArray(v.active) ? v.active : [];
      return [k, { active, at: v.at }] as const;
    });
    this.marks = new Map(entries);
    this.discovered = new Set(discovered);
  }
}

export const Gathering = new GatheringState();

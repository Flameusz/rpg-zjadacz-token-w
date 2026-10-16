/**
 * Timed effects currently on the player, as a snapshot the UI paints from.
 *
 * Same arrangement as Vitals, and for the same reason: `buffsChanged` tells
 * the UI *that* something appeared or expired, but the buff bar also has to
 * animate a countdown every frame, and firing an event 60 times a second to
 * carry that would be absurd. So the owner (Player) writes the live numbers
 * here and the UI reads them in its own update loop.
 *
 * Player is the single writer. Nothing else assigns.
 */
export interface ActiveBuff {
  /** Stable key — one entry per id, re-applying replaces rather than stacks. */
  id: string;
  name: string;
  /** Texture key for the icon (an item icon, for consumable-granted buffs). */
  iconKey: string;
  remainingMs: number;
  durationMs: number;
  /** Healing still owed by this effect, for buffs that heal over time. */
  remainingHp?: number;
  /**
   * True while the effect is suspended rather than ticking — food waits out
   * the out-of-combat delay instead of burning its duration. The bar greys the
   * icon out in this state, which is how the five-second rule becomes visible
   * to the player at all.
   */
  paused?: boolean;
  /**
   * Harmful effect (the spider's web). Only changes how the bar paints it —
   * red frame instead of gold — but the distinction has to exist, or a debuff
   * sits in the buff row looking like something good just happened.
   */
  debuff?: boolean;
  /**
   * How many stacks this effect is carrying, for effects that have stacks (the
   * venom spider's bite). Absent means "not a stacking effect" and the bar
   * draws no counter — one venom stack must not look different from the web.
   *
   * ⚠ **It rides on the SNAPSHOT, not on `buffsChanged`**, exactly like
   * `remainingMs`. A stack lands mid-fight, and routing it through the event
   * would rebuild every icon in the bar at the worst possible moment. The bar
   * already re-reads this object every frame to animate the countdown; the
   * counter costs one more `setText` in that same loop.
   */
  stacks?: number;
  /**
   * One line of explanation for the tap-to-inspect popup. Without it the popup
   * falls back to the food wording ("works out of combat only"), which is a lie
   * for anything that isn't food.
   */
  detail?: string;
}

export const Buffs = {
  active: [] as ActiveBuff[],

  get(id: string): ActiveBuff | undefined {
    return this.active.find((b) => b.id === id);
  },

  /** Add or replace by id. Returns true if this changed which buffs exist
   *  (i.e. the bar needs rebuilding, not just re-reading). */
  set(buff: ActiveBuff): boolean {
    const i = this.active.findIndex((b) => b.id === buff.id);
    if (i === -1) {
      this.active.push(buff);
      return true;
    }
    this.active[i] = buff;
    return false;
  },

  remove(id: string): boolean {
    const i = this.active.findIndex((b) => b.id === id);
    if (i === -1) return false;
    this.active.splice(i, 1);
    return true;
  },

  clear(): void {
    this.active.length = 0;
  },
};

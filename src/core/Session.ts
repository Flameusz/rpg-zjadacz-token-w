/**
 * How long this character has been played, in milliseconds.
 *
 * Exists for exactly one reason: a save-slot list is unreadable without it.
 * "Poziom 7, 340 g" describes two characters identically when one of them is a
 * three-minute test run — the clock is what tells them apart at a glance, and
 * it is the field every console RPG puts on the slot card for that reason.
 *
 * **Ticked from `GameScene.update()`, so a paused scene does not count.** That
 * is deliberate, not an accident of where the call sits: every panel in the
 * game pauses gameplay while open, and time spent reading the character sheet
 * or shopping is not time played. It also means the title screen, the death
 * prompt and a backgrounded tab all stop the clock for free.
 *
 * Persisted by `Save` and restored on load, so the number belongs to the
 * *character*, not to the browser session — loading a slot resumes its clock
 * rather than starting a new one.
 */
class SessionClock {
  playtimeMs = 0;

  /** Add one frame's worth. `delta` is Phaser's own frame delta (ms). */
  tick(delta: number): void {
    this.playtimeMs += delta;
  }

  /** Restore from a save (or reset to 0 for a fresh run). */
  set(ms: number): void {
    this.playtimeMs = Math.max(0, ms);
  }

  reset(): void {
    this.playtimeMs = 0;
  }

  /** `h:mm` for the slot card — hours, because minutes alone stop being
   *  readable at exactly the point the number starts being interesting. */
  format(ms: number = this.playtimeMs): string {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}:${String(m).padStart(2, "0")}`;
  }
}

export const Session = new SessionClock();

/**
 * The one bridge between the Android system Back button and whichever modal
 * currently owns the screen.
 *
 * Shaped exactly like `InputState.worldHitTest` — a single nullable callback,
 * not an event — and for the same reason: `main.ts` (where the native
 * listener lives) must not import `NpcDialog`/`UIScene` directly, and the
 * only thing it needs is a yes/no answer to "did something on screen just
 * consume this". `NpcDialog` is the one modal this bridge covers today; it
 * sets `consume` in its constructor and clears it on shutdown, the same
 * lifecycle every other cross-scene listener in this codebase already
 * follows.
 *
 * ⚠ Registering ANY `backButton` listener with `@capacitor/app` replaces the
 * platform's own default handling — so `consume` returning `false` is not
 * "do nothing", it's "the caller must now reproduce the default itself"
 * (`App.exitApp()` in `main.ts`). Returning `true` means "handled, and the
 * platform must not also act on this press".
 */
export const BackHandler = {
  consume: null as (() => boolean) | null,
};

import type Phaser from "phaser";

/**
 * Per-scene handle to the `Y_SORTED_WORLD` Phaser `Layer` — the ONLY
 * GameObjects that need to compare depth against the player/enemies every
 * frame (tree trunks, walk-behind decor, and every dynamic entity). Everything
 * else (canopies, background decor, tile layers) stays in the scene's own
 * default display list, whose `depthSort()` becomes a no-op once nothing left
 * in it ever calls `setDepth()` again after construction.
 *
 * Same "WeakMap<Scene, T> + setX/xFor" shape as `core/movement/MovementContext.ts`
 * — reused deliberately so entities can reach it without importing `GameScene`
 * (which would close a cycle, the same reason `ProjectileHost` exists).
 *
 * ⚠ Registering an entity here is only half the job: any CHILD GameObject it
 * creates AFTER the fact (an HP bar, a name label, a stun marker) needs the
 * same `.add()` call at ITS OWN creation site — the Layer does not recurse
 * into children automatically. See `Enemy.createHpBar`/`registerMark` for
 * the pattern.
 */
const perScene = new WeakMap<Phaser.Scene, Phaser.GameObjects.Layer>();

export function setYSortedWorld(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer): void {
  perScene.set(scene, layer);
}

/** `null` on scenes that never set one up (e.g. a scene under test). */
export function ySortedWorldFor(scene: Phaser.Scene): Phaser.GameObjects.Layer | null {
  return perScene.get(scene) ?? null;
}

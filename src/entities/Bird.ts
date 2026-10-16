import Phaser from "phaser";
import { ASSETS, BIRD, DEPTH } from "../config/GameConfig";
import { ySortedWorldFor } from "../core/YSortedWorld";

/**
 * Forest ambient decoration — see `BIRD` in GameConfig for why this is NOT
 * a `FarmAnimal` with a species added: `birds.png` carries 4 distinct still
 * sprites, not a directional walk/eat cycle, so there is nothing to
 * animate and no facing to track. A bird just perches at its spawn point
 * and periodically hops to a nearby one.
 *
 * Self-scheduling via `scene.time`/`scene.tweens` rather than a per-frame
 * `update()` — GameScene never needs to know these exist after spawning
 * them. Phaser tears down a scene's own timers/tweens on shutdown, so
 * there's nothing to clean up by hand either.
 */
export class Bird extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const frame = Phaser.Math.Between(0, ASSETS.birds.cols * ASSETS.birds.rows - 1);
    super(scene, x, y, ASSETS.birds.key, frame);
    scene.add.existing(this);
    // Rendering architecture ETAP 1B (2026-08-31) — FOUND DURING
    // IMPLEMENTATION: `scheduleHop`'s tween calls `setDepth` on every
    // `onUpdate` tick while a bird is mid-hop, and with several birds
    // self-scheduling independently at least one is mid-hop almost
    // continuously — left out of Y_SORTED_WORLD this alone would keep
    // dirtying the SCENE's own sort flag, which is exactly the cost this
    // Layer exists to remove. Not in the original ETAP 1B list (only
    // Player/Enemy/Critter/NPC/Projectile were); extending membership here
    // is the same mechanism, not a new one.
    ySortedWorldFor(scene)?.add(this);
    this.setScale(BIRD.scale);
    this.setDepth(DEPTH.entities + y);
    this.scheduleHop(x, y);
  }

  private scheduleHop(homeX: number, homeY: number): void {
    this.scene.time.delayedCall(Phaser.Math.Between(BIRD.hopMsMin, BIRD.hopMsMax), () => {
      if (!this.active) return;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * BIRD.wanderRadius;
      this.scene.tweens.add({
        targets: this,
        x: homeX + Math.cos(angle) * r,
        y: homeY + Math.sin(angle) * r,
        duration: BIRD.hopDurationMs,
        ease: "Sine.easeInOut",
        onUpdate: () => this.setDepth(DEPTH.entities + this.y),
        onComplete: () => this.scheduleHop(homeX, homeY),
      });
    });
  }
}

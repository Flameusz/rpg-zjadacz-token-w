import Phaser from "phaser";
import { DEPTH, GATHER, HERBS } from "../config/GameConfig";
import { herbTextureKey } from "../core/Assets";
import type { Interactable } from "../core/Interactables";

/** Which plant. The species id and the item id are deliberately the same
 *  string, so a Tiled object named `rumianek` needs no translation table. */
export type HerbId = keyof typeof HERBS;

/**
 * One grown plant standing on one stanowisko.
 *
 * Deliberately the *thinnest* entity in the game: a sprite, a sway tween and
 * an `Interactable`. It has **no `update()`, no physics body and no timer of
 * its own** — regrowth belongs to `NodeSpawner`, which runs one timer per
 * species rather than one per plant, and picking belongs to `GameScene`.
 *
 * No body is not an oversight. A herb the player collides with would be a
 * pebble in the road on every trip through a meadow, and the map has no
 * collision at all today anyway (see CLAUDE.md) — walking *over* a plant and
 * pressing `E` reads better than being stopped by one.
 */
export class Gatherable extends Phaser.GameObjects.Sprite implements Interactable {
  readonly interactKind = "gather" as const;
  readonly interactRange = GATHER.interactRange;
  /** Which stanowisko this grew on, so the spawner can free it when picked. */
  readonly nodeIndex: number;

  /** Non-null exactly while the "player is near" glow is active — doubles as
   *  the on/off state so `setNearPlayer` can no-op on a repeated call. */
  private glowFx: Phaser.FX.Glow | null = null;
  private glowTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly herb: HerbId,
    nodeIndex: number,
  ) {
    super(scene, x, y, herbTextureKey(herb));
    scene.add.existing(this);
    this.nodeIndex = nodeIndex;

    // Under the entity band by its own y, exactly like every other world
    // object, so a plant in front of the player draws in front.
    this.setDepth(DEPTH.entities + y);
    // Origin at the FEET, not the centre: the plant should sit on the point the
    // map author placed, and the interact distance should be measured from the
    // ground it grows out of rather than from somewhere up its stalk.
    this.setOrigin(0.5, 1);
    // Tap-to-pick. Like Enemy, this class only knows it is CLICKABLE — what a
    // click means belongs to GameScene (see registerInteractableTap), which
    // owns the range check and the picking itself. Importing GameScene here
    // would close a cycle, exactly as it would for the enemy's target.
    this.setInteractive({ useHandCursor: true });

    // Fade in, same as a respawning enemy — a plant that pops into existence
    // in front of the player reads as a glitch, one that fades in reads as
    // having been missed.
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 300, ease: "Quad.easeOut" });

    // A slow sway, offset per plant so a meadow doesn't wave in unison like a
    // chorus line — same reasoning as `Enemy.motionPhase`.
    scene.tweens.add({
      targets: this,
      angle: { from: -2.5, to: 2.5 },
      duration: 1800 + Math.random() * 900,
      delay: Math.random() * 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Czy świeci teraz poświata „gracz blisko" — czyta ją widok 3D, który
   *  rysuje model zioła zamiast duszka (`postFX` duszka nie jest wtedy widać). */
  get blisko(): boolean {
    return this.glowFx !== null;
  }

  /** The species id doubles as the interact key, so the prompt can name the
   *  plant without the UI holding a reference to the sprite. */
  get interactKey(): string {
    return this.herb;
  }

  /**
   * Toggle the "player is nearby" resource glow — see `GATHER.nearGlow` for
   * why this exists and what it deliberately isn't (not the sprite itself,
   * not the combat targeting colour, not a quest marker).
   *
   * `GameScene.updateHerbGlow` is the only caller, and it already only calls
   * this on a CHANGE (in ↔ out of `nearPlayerRadius`) — but the guard here
   * stays anyway, because "call it every frame and let it no-op" is a cheaper
   * contract to keep correct than "caller promises to only call on change".
   */
  setNearPlayer(near: boolean): void {
    if (near === (this.glowFx !== null)) return;
    if (near) {
      // WebGL-only FX pipeline. `Phaser.AUTO` picks WebGL on every target this
      // ships to, but a Canvas fallback should skip the glow, not throw.
      if (this.scene.game.renderer.type !== Phaser.WEBGL) return;
      const { color, outerStrengthMin, outerStrengthMax, innerStrength, pulseMs } = GATHER.nearGlow;
      this.glowFx = this.postFX.addGlow(color, outerStrengthMin, innerStrength, false);
      this.glowTween = this.scene.tweens.add({
        targets: this.glowFx,
        outerStrength: outerStrengthMax,
        duration: pulseMs,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.glowTween?.remove();
      this.glowTween = undefined;
      if (this.glowFx) {
        this.postFX.remove(this.glowFx);
        this.glowFx = null;
      }
    }
  }

  /** Picked: shrink into the ground and go. The tween is cosmetic — the caller
   *  has already freed the stanowisko and removed this from the interactable
   *  list, so a half-faded plant can never be picked twice. */
  collect(): void {
    // The glow tween targets `this.glowFx`, not `this` — killTweensOf(this)
    // below would not touch it, and a stray repeating tween on a destroyed
    // object's discarded FX controller is exactly the kind of leak that's
    // invisible until someone profiles a long session.
    this.setNearPlayer(false);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.4,
      duration: 180,
      ease: "Quad.easeIn",
      onComplete: () => this.destroy(),
    });
  }
}

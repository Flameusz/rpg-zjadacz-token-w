import Phaser from "phaser";
import { ASSETS, CAMPFIRE, DEPTH } from "../config/GameConfig";
import { UI, worldTextStyle } from "../core/theme";
import type { Interactable } from "../core/Interactables";

/**
 * The cooking campfire that sits near the Hunter. A static prop, not an NPC:
 * it has no AI and never moves, but it is solid so the player walks around the
 * fire rather than through it.
 *
 * Texture is its own PNG (`ognisko_paleta.png`, see ASSETS.campfire), falling
 * back to a generated placeholder only if that file didn't load — same "always
 * boots" arrangement as the boar and wolf.
 */
export class Campfire extends Phaser.Physics.Arcade.Sprite implements Interactable {
  /** See `core/Interactables.ts`. The key is empty because there is only one
   *  kind of fire — a map with two of them still shows the same prompt, and
   *  which one is nearest is decided by distance, not by identity. */
  readonly interactKind = "campfire" as const;
  readonly interactKey = "";
  readonly interactRange = CAMPFIRE.interactRange;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.campfire.key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(CAMPFIRE.scale);
    this.setDepth(DEPTH.entities + y);
    // Tap-to-cook. Same split as Enemy/Gatherable/Merchant — GameScene owns
    // what the tap means and whether the player is close enough.
    this.setInteractive({ useHandCursor: true });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.moves = false;
    body.setImmovable(true);
    // Collide on the stone ring at the base only — the flame is drawn well
    // above the ground the player actually walks on.
    body.setSize(this.width * 0.8, this.height * 0.35);
    body.setOffset(this.width * 0.1, this.height * 0.6);

    scene.add
      .text(
        x,
        y - this.displayHeight / 2 - 6,
        CAMPFIRE.name,
        worldTextStyle({ fontSize: "11px", color: UI.goldLight, stroke: "#000000", strokeThickness: 3 }),
      )
      .setOrigin(0.5)
      .setDepth(DEPTH.entities + y + 1);

    // A slow flicker so the fire reads as alive. Scale rather than position,
    // so it can never drift away from its (static) physics body.
    scene.tweens.add({
      targets: this,
      scaleY: CAMPFIRE.scale * 1.08,
      scaleX: CAMPFIRE.scale * 0.96,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}

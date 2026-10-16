import Phaser from "phaser";
import { ASSETS, DEPTH } from "../config/GameConfig";

/**
 * The village well — a static landmark prop, not an NPC: no AI, no
 * interaction, never moves, but solid so the player walks around the stone
 * ring rather than through it. Same "static prop with a collider on its
 * base" shape as Campfire, minus the label/interaction (nothing to press E
 * for here — yet; see ASSETS.well for the missing rope/winch).
 */
export class Well extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = ASSETS.well.key) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.entities + y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.moves = false;
    body.setImmovable(true);
    // Collide on the stone ring at the base only — the gantry/bucket above
    // it are well over head height and shouldn't block the player's path.
    body.setSize(this.width * 0.5, this.height * 0.45);
    body.setOffset(this.width * 0.25, this.height * 0.5);
  }
}

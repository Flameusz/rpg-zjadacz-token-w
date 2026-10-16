import Phaser from "phaser";
import { ASSETS, DEPTH, WATERWHEEL } from "../config/GameConfig";

/**
 * The mill's water wheel — a landmark prop that turns.
 *
 * Same shape as `Well`: static, authored from a Tiled point, no AI. Two
 * differences worth knowing.
 *
 * **It has no collider.** The well is solid because a player walking through
 * a stone ring reads as a bug; a wheel stands in the millrace, where the
 * water (not the wheel) is what should eventually stop you. Adding a body
 * here would also fight the rotation — an Arcade body is an axis-aligned box
 * and does not turn with its sprite, so a spinning collider would be a
 * stationary square the size of the wheel's bounding box, which is wrong in
 * every frame.
 *
 * **It turns on a looping tween, not on animation frames.** `kolo_mlynskie.png`
 * is a single drawn frame (see ASSETS.waterwheel), so frames could only come
 * from rotating pixel art off the 90° axis — which shreds the spokes, i.e.
 * destroys the exact detail the drawn art was brought in for. The tween costs
 * no per-frame code and stops on its own whenever a panel pauses the scene,
 * so the wheel never spins on under an open backpack.
 */
export class WaterWheel extends Phaser.GameObjects.Sprite {
  private spin?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ASSETS.waterwheel.key, "lico");
    scene.add.existing(this);

    this.setDepth(DEPTH.entities + y);

    // The frame is 128 wide for a 99px wheel so the hub lands within half a
    // pixel of the frame centre — see ASSETS.waterwheel. That is what lets the
    // default (0.5, 0.5) origin be the axle, with no offset to keep in sync.
    this.spin = scene.tweens.add({
      targets: this,
      angle: 360,
      duration: WATERWHEEL.revolutionMs,
      repeat: -1,
      ease: "Linear",
    });
  }

  destroy(fromScene?: boolean): void {
    this.spin?.remove();
    this.spin = undefined;
    super.destroy(fromScene);
  }
}

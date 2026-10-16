import Phaser from "phaser";
import { DEPTH, LOOT } from "../config/GameConfig";
import { itemIconKey, type ItemId } from "../core/Items";
import type { ItemInstance } from "../core/Quality";

/**
 * A dropped item lying on the ground. Static (no AI/movement) — a small
 * bob idle sells "alive", and it fades away unclaimed after LOOT.lifetimeMs.
 */
export class Loot extends Phaser.Physics.Arcade.Sprite {
  readonly itemId: ItemId;
  /**
   * KONKRETNY egzemplarz (jakość, zużycie), gdy łup ma być czymś innym niż
   * nowa, Zwykła sztuka — np. zniszczony strój zbója (`LOOT.equipmentDrops`).
   * Bez niego podniesienie idzie przez `addItem` jak dotąd.
   */
  readonly instance?: ItemInstance;
  /** Ile sztuk jeszcze leży — maleje przy częściowym podniesieniu (`take`). */
  private _qty: number;
  private collected = false;

  get qty(): number {
    return this._qty;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, itemId: ItemId, qty: number, instance?: ItemInstance) {
    super(scene, x, y, itemIconKey(itemId));
    this.itemId = itemId;
    this._qty = qty;
    this.instance = instance;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.moves = false;
    // Wider than the sprite so "walk near it" reads as pickup, not "walk onto
    // its exact pixel", which feels fussy at this zoom level.
    body.setCircle(this.width, 0, 0);

    this.setDepth(DEPTH.entities + y - 1);
    this.setScale(0.85);

    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 220, ease: "Quad.easeOut" });
    scene.tweens.add({
      targets: this,
      y: y - 3,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.time.delayedCall(LOOT.lifetimeMs, () => this.expire());
  }

  /** Once true, callers should stop treating this as pickable. */
  get isGone(): boolean {
    return this.collected || !this.active;
  }

  /**
   * Podnieś CZĘŚĆ stosu — reszta zostaje na ziemi (`OI-58`, 2026-10-09).
   * ⚠ Do tej daty częściowe podniesienie wołało `collect()`, więc to, co nie
   * weszło do plecaka, znikało bez słowa.
   */
  take(n: number): void {
    if (this.collected) return;
    this._qty = Math.max(0, this._qty - n);
    if (this._qty === 0) this.collect();
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: this.scaleX * 1.3,
      duration: 160,
      ease: "Quad.easeIn",
      onComplete: () => this.destroy(),
    });
  }

  private expire(): void {
    if (this.collected || !this.active) return;
    this.collected = true;
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 400,
      onComplete: () => this.destroy(),
    });
  }
}

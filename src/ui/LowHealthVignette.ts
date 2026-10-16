import Phaser from "phaser";
import { uiW, uiH } from "../core/theme";
import { GameEvents, EVENT } from "../core/EventBus";
import { COMBAT_FEEDBACK, ASSETS } from "../config/GameConfig";

/**
 * Red edge vignette that fades in as the player's HP gets low, with a slow
 * heartbeat pulse.
 *
 * Why it exists: the HP bar is 200px wide in the top-left corner, while on a
 * phone the player is looking at their thumb and at whatever is trying to bite
 * them. Death arrived as a surprise. That is worse here than in most games
 * because dying has a real price — half HP on revive plus 10% of carried gold
 * (see RESPAWN) — and a penalty you never saw coming reads as unfair rather
 * than as tension.
 *
 * Screen-space, in UIScene, so the world camera's zoom and scroll can't touch
 * it. Alpha is driven from the shared `playerHpChanged` event, and the pulse
 * from UIScene's update loop — the same split the HUD and buff bar use, for the
 * same reason (a heartbeat animated by 60 events a second would be absurd).
 */
export class LowHealthVignette {
  private readonly image: Phaser.GameObjects.Image;
  /** Alpha the pulse swings around; 0 when the player is healthy or dead. */
  private targetAlpha = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.image = scene.add
      .image(0, 0, ASSETS.vignette.textureKey)
      .setOrigin(0)
      .setScrollFactor(0)
      // Under the HUD and the death overlay, over the gameplay camera.
      .setDepth(880)
      .setAlpha(0)
      .setVisible(false);

    this.layout();

    GameEvents.on(EVENT.playerHpChanged, this.onHp, this);
    // Explicitly cleared on death and on revive rather than left to the HP
    // event: at 0 HP the vignette would otherwise sit at full strength under
    // the "YOU DIED" overlay and muddy it.
    GameEvents.on(EVENT.playerDied, this.clear, this);
    GameEvents.on(EVENT.playerRespawned, this.clear, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.playerHpChanged, this.onHp, this);
      GameEvents.off(EVENT.playerDied, this.clear, this);
      GameEvents.off(EVENT.playerRespawned, this.clear, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  private layout(): void {
    this.image.setDisplaySize(uiW(this.scene), uiH(this.scene));
  }

  private onHp(p: { hp: number; maxHp: number }): void {
    const cfg = COMBAT_FEEDBACK.lowHealth;
    const ratio = Phaser.Math.Clamp(p.hp / p.maxHp, 0, 1);
    if (ratio >= cfg.threshold || p.hp <= 0) {
      this.clear();
      return;
    }
    // Full strength at 0 HP, nothing at the threshold — so it creeps in rather
    // than switching on, and the player reads "getting worse", not "alarm".
    this.targetAlpha = cfg.maxAlpha * (1 - ratio / cfg.threshold);
    this.image.setVisible(true);
  }

  private clear(): void {
    this.targetAlpha = 0;
    this.image.setAlpha(0).setVisible(false);
  }

  /** Heartbeat, driven from UIScene.update(). */
  update(): void {
    if (this.targetAlpha <= 0) return;
    const cfg = COMBAT_FEEDBACK.lowHealth;
    const t = (this.scene.time.now / cfg.pulseMs) * Math.PI * 2;
    const pulse = 1 - cfg.pulseDepth * (0.5 + 0.5 * Math.cos(t));
    this.image.setAlpha(this.targetAlpha * pulse);
  }
}

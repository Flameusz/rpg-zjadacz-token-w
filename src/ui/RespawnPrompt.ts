import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Controls, CONTROL } from "../core/InputState";
import { RESPAWN } from "../config/GameConfig";
import { UI, textStyle, uiW, uiH } from "../core/theme";

/**
 * Death overlay: a dimmed screen with a "resurrect" button, shown a short beat
 * after the player dies (so the death animation lands first) and hidden again
 * once they respawn.
 *
 * Like the other UI pieces this only talks to gameplay through Controls /
 * GameEvents — it never touches GameScene or the Player directly.
 */
export class RespawnPrompt {
  private container: Phaser.GameObjects.Container;
  private veil: Phaser.GameObjects.Rectangle;
  private button: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  /** What this death cost. Filled from `deathPenalty`, which fires before the
   *  prompt appears, so the text is already right when it fades in. */
  private cost: Phaser.GameObjects.Text;
  private showTimer?: Phaser.Time.TimerEvent;
  /** Guards against a double-tap firing two resurrections. */
  private armed = false;

  private readonly btnWidth = 240;
  private readonly btnHeight = 56;

  constructor(private scene: Phaser.Scene) {
    const depth = 1200;

    this.veil = scene.add.rectangle(0, 0, 10, 10, 0x220000, 0.45).setOrigin(0.5);
    this.button = scene.add
      .rectangle(0, 70, this.btnWidth, this.btnHeight, 0x3a1020, 0.9)
      .setStrokeStyle(3, 0xffcc66, 0.9)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      .text(0, 70, "ZMARTWYCHWSTAŃ", textStyle({ fontSize: "20px", color: UI.gold, fontStyle: "bold" }))
      .setOrigin(0.5);
    this.hint = scene.add
      .text(0, 116, "SPACJA / ENTER", textStyle({ fontSize: "13px", color: UI.white }))
      .setOrigin(0.5)
      .setAlpha(0.75);

    this.cost = scene.add
      .text(0, 12, "", textStyle({ fontSize: "14px", color: "#ff9d3b", align: "center" }))
      .setOrigin(0.5);

    this.container = scene.add
      .container(0, 0, [this.veil, this.cost, this.button, this.label, this.hint])
      .setScrollFactor(0)
      .setDepth(depth)
      .setVisible(false);

    this.button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.press();
    });

    scene.input.keyboard?.on("keydown-SPACE", () => this.press());
    scene.input.keyboard?.on("keydown-ENTER", () => this.press());

    GameEvents.on(EVENT.playerDied, this.onDied, this);
    GameEvents.on(EVENT.playerRespawned, this.hide, this);
    GameEvents.on(EVENT.deathPenalty, this.onPenalty, this);

    this.reposition();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.playerDied, this.onDied, this);
      GameEvents.off(EVENT.playerRespawned, this.hide, this);
      GameEvents.off(EVENT.deathPenalty, this.onPenalty, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
      this.showTimer?.remove();
    });
  }

  /**
   * Name the cost. Losing gold silently reads as a bug, and the halved HP is
   * worth flagging too — otherwise the player just wonders why they got up on
   * half a bar.
   */
  private onPenalty(p: { gold: number }): void {
    const hp = `Wstajesz z ${Math.round(RESPAWN.hpRatio * 100)}% zdrowia`;
    this.cost.setText(p.gold > 0 ? `${hp}\nStracone złoto: ${p.gold}` : hp);
  }

  private onDied(): void {
    this.showTimer?.remove();
    this.showTimer = this.scene.time.delayedCall(RESPAWN.promptDelayMs, () => {
      this.container.setVisible(true).setAlpha(0);
      this.armed = true;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 220,
        ease: "Quad.easeOut",
      });
    });
  }

  private press(): void {
    // Only reacts once the prompt is actually up — SPACE is also the attack key.
    if (!this.armed || !this.container.visible) return;
    this.armed = false;
    Controls.emit(CONTROL.respawn);
  }

  private hide(): void {
    this.showTimer?.remove();
    this.armed = false;
    this.scene.tweens.killTweensOf(this.container);
    this.container.setVisible(false);
  }

  private reposition(): void {
    const w = uiW(this.scene);
    const h = uiH(this.scene);
    this.container.setPosition(w / 2, h / 2);
    this.veil.setSize(w, h);
  }
}

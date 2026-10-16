import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { UI, fontPx, textStyle, uiW } from "../core/theme";
import { WorldState } from "../core/WorldState";
import { KeyFocus } from "./KeyFocus";

/**
 * ⭐ **Głos Patryczka w samouczku walki** (2026-10-15, `COMBAT_TUTORIAL`) —
 * ramka u góry ekranu z bieżącym krokiem. Krok liczy `GameScene` z żywego
 * stanu i ogłasza zdarzeniem `tutorialStep`; ten widżet tylko pokazuje tekst.
 *
 * ⚠ **Bez `setInteractive`** (wzór `CombatHint`): ramka nigdy nie połknie
 * dotyku przeznaczonego dla drążka albo przycisku ataku — samouczek prowadzi
 * grę, nie przerywa jej. Znika sama, gdy krok wraca do `null`.
 *
 * Środek górnego pasa, jak `CombatHint`: lewy górny róg należy do odczytów
 * i trackera zadań, prawy — do minimapy i przycisku menu.
 */
export class TutorialGuide {
  private readonly root: Phaser.GameObjects.Container;
  private readonly box: Phaser.GameObjects.Rectangle;
  private readonly name: Phaser.GameObjects.Text;
  private readonly text: Phaser.GameObjects.Text;
  private readonly w = 560;

  constructor(private readonly scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.box = scene.add.rectangle(0, 0, this.w, 10, UI.bg, 0.92).setOrigin(0.5, 0).setStrokeStyle(2, UI.goldNum, 0.85);
    this.name = scene.add
      .text(-this.w / 2 + 16, 10, "PATRYCZEK", textStyle({ fontSize: fontPx("small"), color: UI.gold, fontStyle: "bold" }));
    this.text = scene.add
      .text(-this.w / 2 + 16, 32, "", textStyle({ fontSize: fontPx("body"), color: "#e4e8f0", wordWrap: { width: this.w - 32, useAdvancedWrap: true } }))
      .setLineSpacing(4);
    this.root.add([this.box, this.name, this.text]);
    this.reposition();
    if (WorldState.tutorial.step) this.onStep(WorldState.tutorial);

    GameEvents.on(EVENT.tutorialStep, this.onStep, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.hideUnderModal, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.hideUnderModal, this);
      GameEvents.off(EVENT.tutorialStep, this.onStep, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });
  }

  private onStep(p: { step: string | null; text: string }): void {
    if (!p.step) {
      this.root.setVisible(false);
      return;
    }
    this.text.setText(p.text);
    this.box.setSize(this.w, this.text.y + this.text.height + 12);
    this.root.setVisible(true).setAlpha(0);
    // Nowy krok wjeżdża łagodnie — gracz ma zauważyć, że tekst się ZMIENIŁ.
    this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 220, ease: "Quad.easeOut" });
  }

  /** Rozmowa albo panel na ekranie (`KeyFocus`) — ramka znika: Patryczek mówi
   *  wtedy w rozmowie, a dwa głosy naraz to szum (render 1:1). Tylko zmiana
   *  widoczności, bez przerysowania. */
  private hideUnderModal(): void {
    const ukryj = KeyFocus.owner !== null;
    const pokaz = !!WorldState.tutorial.step && !ukryj;
    if (this.root.visible !== pokaz) this.root.setVisible(pokaz);
  }

  private reposition(): void {
    this.root.setPosition(Math.round(uiW(this.scene) / 2), 64);
  }
}

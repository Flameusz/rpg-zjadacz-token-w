import Phaser from "phaser";
import { UI, fontPx, textStyle, uiW, uiH } from "../core/theme";

/**
 * A small modal yes/no confirmation, rendered above the panels (a full-screen
 * veil eats clicks to anything behind, so a choice must be made). Reusable —
 * ShopPanel uses it to guard selling equipped/valuable gear, and it's handy for
 * any other "are you sure?" moment later.
 */
export class ConfirmDialog {
  private container: Phaser.GameObjects.Container;
  private veil: Phaser.GameObjects.Rectangle;
  private message: Phaser.GameObjects.Text;
  private onConfirm: (() => void) | null = null;

  // ⭐ Etap E (2026-10-13): role tekstu i przyciski na progu dotyku (68 j.) —
  //   przy 360×160 i przyciskach 34 j. okno było najdrobniejszą kontrolką
  //   w grze, a pyta o rzeczy nieodwracalne (sprzedaż zbiorcza, cenny łup).
  private readonly w = 480;
  private readonly h = 230;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(2600) // above panels (1400) and tooltips (2000)
      .setVisible(false);

    // Full-screen veil: dims the scene and swallows clicks behind the dialog.
    // Clicking it counts as Cancel.
    this.veil = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.55).setInteractive();
    this.veil.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.hide();
    });

    const box = scene.add.rectangle(0, 0, this.w, this.h, UI.bg, 0.98).setStrokeStyle(2, UI.goldNum, 0.9);
    this.message = scene.add
      .text(0, -44, "", textStyle({ fontSize: fontPx("body"), color: UI.white, align: "center", wordWrap: { width: this.w - 48 } }))
      .setOrigin(0.5);

    const yes = this.button(-96, 66, "Tak", 0x2c6e3f, 0x7ddf9a, () => this.confirm());
    const no = this.button(96, 66, "Anuluj", 0x3a3f4a, 0x8892a6, () => this.hide());

    this.container.add([this.veil, box, this.message, ...yes, ...no]);

    this.reposition();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });
  }

  private button(
    x: number,
    y: number,
    label: string,
    fill: number,
    stroke: number,
    onClick: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const box = this.scene.add
      .rectangle(x, y, 176, 64, fill, 1)
      .setStrokeStyle(2, stroke, 0.9)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, textStyle({ fontSize: fontPx("body"), color: UI.white, fontStyle: "bold" }))
      .setOrigin(0.5);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      onClick();
    });
    return [box, text];
  }

  /** Show the dialog with `message`; `onConfirm` runs only if the player says Tak. */
  show(message: string, onConfirm: () => void): void {
    this.message.setText(message);
    this.onConfirm = onConfirm;
    this.reposition();
    this.container.setVisible(true);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  private confirm(): void {
    const cb = this.onConfirm;
    this.hide();
    cb?.();
  }

  hide(): void {
    this.onConfirm = null;
    this.container.setVisible(false);
  }

  private reposition(): void {
    const w = uiW(this.scene);
    const h = uiH(this.scene);
    this.container.setPosition(w / 2, h / 2);
    this.veil.setSize(w, h);
  }
}

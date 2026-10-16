import Phaser from "phaser";
import { UI } from "../core/theme";
import { menuButtonRect } from "./ControlLayout";
import { drawUiIcon } from "./UiIcons";
import { CoachMark } from "./CoachMark";
import { GameEvents, EVENT } from "../core/EventBus";

/**
 * ⭐ **Przycisk MENU — wejście do panelu gracza z HUD-u** (2026-10-12).
 *
 * Kwadrat z plecakiem na lewo od minimapy (`ControlLayout.menuButtonRect`,
 * liczby w `HUD_LAYOUT.menuButton`). Zastąpił rolę minimapy jako wejścia do
 * panelu: minimapa otwiera dziś MAPĘ — tak, jak gracz zna to z każdej innej
 * gry — a panel ma własny, nazwany przycisk z ikoną, której nie trzeba
 * tłumaczyć.
 *
 * ⚠⚠ **Na telefonie to JEDYNE wejście do ekwipunku i zapisu**, więc nie
 * zależy od żadnej tekstury — ikona jest rysowana (`UiIcons`).
 *
 * ⚠ Akcja na PUSZCZENIU, z testem trafienia (ta sama reguła i ten sam powód,
 * co przy minimapie): panel otwarty na `DOWN` dostawałby `UP` tego samego
 * palca, a w prawym górnym rogu panelu stoją zakładki i ✕.
 *
 * Właściciel otwarcia i kropki jest `PlayerPanel` — ten widżet tylko rysuje
 * i zgłasza tapnięcie.
 */
export class MenuButton {
  private readonly root: Phaser.GameObjects.Container;
  private readonly hit: Phaser.GameObjects.Rectangle;
  private readonly badge: Phaser.GameObjects.Arc;
  private pressedId: number | null = null;
  private paintedBadge: boolean | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly onTap: () => void) {
    const { size } = menuButtonRect(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    const bg = scene.add
      .rectangle(0, 0, size, size, UI.bg, 0.85)
      .setStrokeStyle(2, UI.goldNum, 0.7);
    const icon = drawUiIcon(scene.add.graphics(), "bag", size * 0.56, UI.goldNum, UI.bg);
    this.badge = scene.add
      .circle(size / 2 - 3, -size / 2 + 3, 7, 0x66ddff, 1)
      .setStrokeStyle(1.5, 0x000000, 0.85)
      .setVisible(false);
    // ⚠ `fillAlpha` 0, nie `alpha` 0 — obiekt z zerową alfą wypada z testu
    // trafienia (`ControlLayout.hitCircle`).
    this.hit = scene.add
      .rectangle(0, 0, size, size, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.pressedId = p.id;
      this.root.setScale(0.94);
    });
    this.root.add([bg, icon, this.badge, this.hit]);
    this.reposition();

    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUpOutside, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    // Dymek „pierwszego razu": gdy w plecaku pierwszy raz coś leży — wtedy
    // jest po co tu zaglądać (nie na starcie, obok podpowiedzi walki).
    GameEvents.on(EVENT.inventoryChanged, this.onInventory, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.inventoryChanged, this.onInventory, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUpOutside, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });
  }

  private onInventory(p: { slots: readonly unknown[] }): void {
    if (!p.slots.some(Boolean)) return;
    CoachMark.once(
      "menu",
      () => {
        const r = menuButtonRect(this.scene);
        return { x: r.x, y: r.y + r.size / 2 };
      },
      "Plecak, postać, zadania i opcje.",
      "left",
    );
  }

  /** Kropka „masz coś do zrobienia w panelu" (niewydane punkty). Tylko przy zmianie. */
  setBadge(on: boolean): void {
    if (on === this.paintedBadge) return;
    this.paintedBadge = on;
    this.badge.setVisible(on);
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pressedId) return;
    this.pressedId = null;
    this.root.setScale(1);
    if (this.scene.input.hitTestPointer(p).includes(this.hit)) this.onTap();
  }

  private onPointerUpOutside(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pressedId) return;
    this.pressedId = null;
    this.root.setScale(1);
  }

  private reposition(): void {
    // Środek, nie róg: wciśnięcie skaluje kontener wokół jego zera.
    const r = menuButtonRect(this.scene);
    this.root.setPosition(Math.round(r.x + r.size / 2), Math.round(r.y + r.size / 2));
  }
}

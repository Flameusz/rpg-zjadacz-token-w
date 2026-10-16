import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Inventory } from "../core/Inventory";
import { itemIconKey, getItem } from "../core/Items";
import { UI, textStyle } from "../core/theme";
import { floatingText } from "../core/Fx";
import { cellOf, slotOf } from "./ControlLayout";

/**
 * The quick-action slot: one always-visible button on the HUD holding a
 * consumable, so drinking a potion mid-fight doesn't mean opening the backpack
 * (which pauses the game and kills the pace of a fight).
 *
 * ── Placement ────────────────────────────────────────────────────────────
 * Pierwsze miejsce `HUD_LAYOUT.place.quick` (zewnętrzny łuk, slot 0) — najbliższa kciuka pozycja tego łuku
 * (~48 mm), bo mikstura jest z jego trzech mieszkańców jedyną wciskaną pod
 * presją. Geometria i uzasadnienie: `ControlLayout` + `HUD_LAYOUT`.
 *
 * Prawa strona nie podlega negocjacji: `VirtualJoystick` zgłasza się po każde
 * dotknięcie lewej POŁOWY ekranu (baza pojawia się tam, gdzie naciśniesz), więc
 * kontrolka postawiona tam biłaby się z gałką o ten sam palec. Z tego samego
 * powodu co `AttackButton` handler woła `stopPropagation`.
 *
 * ⚠ **Do 2026-08-21 ten plik był właścicielem geometrii CAŁEGO rogu** i
 * eksportował cztery funkcje, z których korzystały trzy inne widżety. To była
 * połowiczna naprawa 11-pikselowej nakładki: liczby miały jeden dom, ale dom
 * był widżetem, który sam był ich klientem. Wyprowadzone do `ControlLayout`.
 *
 * Bind an item by single-clicking a consumable in the backpack — see
 * PlayerPanel.previewSlot. That gesture was previously a no-op for
 * consumables (they have no equip slot to preview), so nothing was displaced.
 */
export class QuickSlot {
  private container: Phaser.GameObjects.Container;
  private frame: Phaser.GameObjects.Arc;
  private icon: Phaser.GameObjects.Image;
  private countText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;

  private readonly size = cellOf("quick");

  constructor(private readonly scene: Phaser.Scene) {
    const depth = 1000;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth);

    // Kółko, nie kafel — patrz `ringVisual`. Kwadraty zostają tam, gdzie znaczą
    // „kafel siatki": w plecaku i na manekinie. Ikona przedmiotu w środku dalej
    // jest kwadratowa i to jest w porządku — kółko trzyma HUD, nie przedmiot.
    this.frame = scene.add
      .circle(0, 0, this.size / 2, UI.slotBg, 0.8)
      .setStrokeStyle(2, UI.goldNum, 0.85)
      .setInteractive({ useHandCursor: true });
    this.icon = scene.add
      .image(0, 0, "")
      .setDisplaySize(this.size * 0.6, this.size * 0.6)
      .setVisible(false);
    this.countText = scene.add
      .text(this.size / 2 - 4, this.size / 2 - 4, "", textStyle({ fontSize: "12px", color: UI.white, stroke: "#000000", strokeThickness: 3 }))
      .setOrigin(1);
    // Doubles as the empty-state instruction: a blank square teaches nothing.
    this.hintText = scene.add
      .text(0, 0, "Q", textStyle({ fontSize: "13px", color: UI.muted, fontStyle: "bold" }))
      .setOrigin(0.5);

    this.container.add([this.frame, this.icon, this.countText, this.hintText]);

    this.frame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation(); // don't let the joystick claim this touch
      this.activate();
    });
    scene.input.keyboard?.on("keydown-Q", () => this.activate());

    GameEvents.on(EVENT.inventoryChanged, this.refresh, this);
    GameEvents.on(EVENT.playerHpChanged, this.refresh, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.inventoryChanged, this.refresh, this);
      GameEvents.off(EVENT.playerHpChanged, this.refresh, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });

    this.reposition();
    this.refresh();
  }

  /**
   * Fire the bound item. Every refusal says why — a button that visibly does
   * nothing is indistinguishable from a broken one, and this one is pressed
   * under pressure.
   */
  private activate(): void {
    const id = Inventory.quickSlot;
    if (!id) {
      this.say("Kliknij miksturę lub jedzenie w plecaku, by przypisać");
      return;
    }
    if (Inventory.countItem(id) < 1) {
      this.say(`Brak: ${getItem(id).name}`);
      return;
    }
    // Pre-checked purely to pick the message; Inventory.useItem enforces it.
    if (Inventory.wouldWasteHeal(id)) {
      this.say("Masz pełne zdrowie");
      return;
    }
    if (!Inventory.useQuickSlot()) return;

    this.scene.tweens.add({
      targets: this.container,
      scale: 0.86,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private say(text: string): void {
    floatingText(this.scene, {
      x: this.container.x,
      y: this.container.y - this.size,
      text,
      color: "#ff9d3b",
      rise: 18,
      duration: 900,
      depth: 1500,
    });
  }

  private refresh(): void {
    const id = Inventory.quickSlot;
    const count = id ? Inventory.countItem(id) : 0;

    this.icon.setVisible(!!id);
    this.hintText.setVisible(!id);
    this.countText.setText(count > 1 ? `${count}` : "");

    if (!id) {
      this.frame.setStrokeStyle(2, 0x556074, 0.7);
      return;
    }
    this.icon.setTexture(itemIconKey(id));

    // Three distinct states, because "can't use it" has three different causes
    // and the player needs to tell them apart at a glance mid-fight.
    const outOfStock = count < 1;
    const wasted = Inventory.wouldWasteHeal(id);
    const dimmed = outOfStock || wasted;
    this.icon.setAlpha(dimmed ? 0.35 : 1);
    this.countText.setColor(outOfStock ? UI.muted : UI.white);
    this.frame.setStrokeStyle(2, dimmed ? 0x556074 : UI.goldNum, dimmed ? 0.7 : 0.85);
  }

  /** Slot 0 pierścienia przedmiotów — patrz nagłówek klasy. */
  private reposition(): void {
    const p = slotOf(this.scene, "quick", 0);
    if (p) this.container.setPosition(p.x, p.y);
  }
}

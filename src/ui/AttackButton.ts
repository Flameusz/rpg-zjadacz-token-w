import Phaser from "phaser";
import { InputState } from "../core/InputState";
import { combatAnchor } from "./ControlLayout";
import { HUD_LAYOUT } from "../config/GameConfig";
import { textStyle } from "../core/theme";
import { GameEvents, EVENT } from "../core/EventBus";
import { Progression } from "../core/Progression";
import { damageIconKey } from "../core/Assets";
import { TYPE_COLOR } from "./AttackModeButton";

/**
 * A tap-and-hold button anchored to the bottom-RIGHT of the screen. Sets
 * `InputState.attackHeld` for as long as it's pressed — the gameplay loop
 * keeps attacking on its own (gated by the weapon's cooldown) while true, so
 * sustaining an attack doesn't need repeated taps. Repositions itself on
 * resize. Also responds to SPACE (held) for desktop.
 */
export class AttackButton {
  private circle: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;
  /**
   * ⭐ **Znak TYPU OBRAŻEŃ na przycisku ataku** (2026-10-12). Do tej daty typ
   * pokazywały przyciski wariantów na wewnętrznym pierścieniu — zawsze, także
   * przy jednym wariancie, bo przy osi typ × materiał pancerza ukrycie typu to
   * ukrycie połowy mechaniki. Wybór zszedł do jednego przycisku
   * (`AttackModeButton`), ODCZYT został tutaj: krążek z glifem w dolnej części
   * i obrys w kolorze typu. Zero dodatkowych kontrolek.
   */
  private typeBadge: Phaser.GameObjects.Arc;
  private typeIcon: Phaser.GameObjects.Image;
  /** Z `HUD_LAYOUT`, bo cały klaster pozycjonuje się względem tego promienia —
   *  trzymanie tu własnej kopii było źródłem 11-pikselowej nakładki. */
  private readonly radius = HUD_LAYOUT.attackRadius;
  /** Which pointer is currently holding this button, if any (multi-touch safe). */
  private pointerId: number | null = null;

  constructor(private scene: Phaser.Scene) {
    const depth = 1000;
    this.circle = scene.add
      .circle(0, 0, this.radius, 0xff5555, 0.35)
      .setStrokeStyle(3, 0xff8888, 0.7)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      // Przez `textStyle`, mimo że nie potrzebuje ani kroju, ani koloru z motywu:
      // to jedyne miejsce w UI, które składało styl ręcznie, więc jako jedyne
      // nie dostawało kompensacji rozdzielczości i ten glif rozpadał się po
      // zmniejszeniu przez kamerę UI.
      .text(0, 0, "⚔", textStyle({ fontSize: "34px", color: "#ffffff" }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.typeBadge = scene.add
      .circle(0, 0, 13, 0x10141c, 0.92)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.typeIcon = scene.add
      .image(0, 0, damageIconKey("blunt"))
      .setDisplaySize(16, 16)
      .setScrollFactor(0)
      .setDepth(depth + 2);

    this.circle.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation(); // don't let the joystick claim this touch
      this.pointerId = p.id;
      this.setHeld(true);
    });
    // The release may land outside the circle (finger dragged off), so listen
    // globally rather than only on the object.
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);

    if (scene.input.keyboard) {
      scene.input.keyboard.on("keydown-SPACE", () => this.setHeld(true));
      scene.input.keyboard.on("keyup-SPACE", () => this.setHeld(false));
    }

    this.reposition();
    this.refreshType();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    GameEvents.on(EVENT.equipmentChanged, this.refreshType, this);
    GameEvents.on(EVENT.attackVariantChanged, this.refreshType, this);
    /**
     * ⚠ **`scene.scale` to menedżer GLOBALNY gry, nie wtyczka sceny** — i to
     * jest cała treść tego bloku (dopisany 2026-09-08; ten widżet był jednym
     * z dwóch, które go nie miały).
     *
     * `scene.input` i `scene.input.keyboard` giną razem ze sceną, więc trzy
     * subskrypcje wyżej sprzątają się same i celowo nie ma ich w tym bloku.
     * `ScaleManager` żyje tyle, co `Phaser.Game`, więc każdy cykl Menu → Nowa
     * gra → Menu zostawiał tu handler wołający `reposition()` na zniszczonym
     * `Arc` i `Text`. Objawiało się dopiero przy zmianie rozmiaru okna po
     * powrocie z ekranu tytułowego — czyli nigdy na telefonie i rzadko na
     * desktopie, co jest najgorszym rodzajem wycieku.
     */
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
      GameEvents.off(EVENT.equipmentChanged, this.refreshType, this);
      GameEvents.off(EVENT.attackVariantChanged, this.refreshType, this);
    });
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pointerId) return;
    this.pointerId = null;
    this.setHeld(false);
  }

  private setHeld(held: boolean): void {
    InputState.attackHeld = held;
    if (!held) return;
    // Quick visual feedback on the initial press only.
    this.scene.tweens.add({
      targets: [this.circle, this.label],
      scale: 0.85,
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  /** Typ obrażeń czynnego wariantu — glif i kolor. Gołe ręce też mają typ. */
  private refreshType(): void {
    const variants = Progression.attackVariants;
    const v = variants[Progression.activeVariantIndex] ?? variants[0];
    if (!v) {
      this.typeBadge.setVisible(false);
      this.typeIcon.setVisible(false);
      return;
    }
    const color = TYPE_COLOR[v.damageType];
    this.typeBadge.setVisible(true).setStrokeStyle(2, color, 1);
    this.typeIcon.setVisible(true).setTexture(damageIconKey(v.damageType)).setDisplaySize(16, 16);
  }

  private reposition(): void {
    // Przez `combatAnchor`, a nie własne `- radius - margines`: ten punkt jest
    // kotwicą, względem której układają się wszystkie trzy pierścienie, więc
    // musi mieć jeden dom (patrz `ControlLayout`).
    const { x, y } = combatAnchor(this.scene);
    this.circle.setPosition(x, y);
    this.label.setPosition(x, y);
    // Znak typu na obwodzie, w lewym dolnym skosie — poza glifem miecza
    // i poza miejscem, w które pada kciuk przy przytrzymaniu.
    const k = this.radius * 0.72;
    this.typeBadge.setPosition(x - k, y + k);
    this.typeIcon.setPosition(x - k, y + k);
  }
}

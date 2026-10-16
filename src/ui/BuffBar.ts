import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Buffs, type ActiveBuff } from "../core/Buffs";
import { UI, textStyle } from "../core/theme";
import { menuButtonRect } from "./ControlLayout";

interface BuffWidget {
  id: string;
  /**
   * Ostatnio ZASTOSOWANY stan pauzy — czyli jedyne, od czego zależą kolory
   * tego widżetu.
   *
   * ⚠ **`Text.setColor` NIE jest tanie i to jest cała treść tego pola.**
   * W Phaserze ustawia styl i woła `updateText()`, czyli przerysowuje płótno
   * napisu i **wysyła teksturę na GPU** — bez względu na to, czy kolor się
   * zmienił. Wołane bezwarunkowo w pętli klatkowej dawało ten koszt 60 razy na
   * sekundę na każdy aktywny efekt. Ten katalog zna już ten mechanizm z drugiej
   * strony: `installTextFiltering()` istnieje właśnie dlatego, że KAŻDE
   * przerysowanie napisu przywraca filtrowanie NEAREST.
   *
   * `null` = jeszcze nie ustawiono, więc pierwsza klatka zawsze maluje.
   */
  paintedPaused: boolean | null;
  container: Phaser.GameObjects.Container;
  icon: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Rectangle;
  /** Dark overlay that climbs the icon as the effect drains. */
  cover: Phaser.GameObjects.Rectangle;
  timeText: Phaser.GameObjects.Text;
  /**
   * Stack counter, top-right of the icon. Created for every widget and simply
   * left blank for effects without stacks — building it lazily would mean
   * rebuilding the widget the first time a second stack lands, i.e. in the
   * middle of the fight the counter exists to be readable during.
   */
  stackText: Phaser.GameObjects.Text;
}

/**
 * WoW-style buff bar: one icon per active timed effect, top-right — a row
 * growing LEFTWARD from the menu button left of the minimap (2026-10-12;
 * 2026-10-11 it grew from the minimap itself). Tapping an icon opens a
 * detail popup.
 *
 * ⚠ **Na lewo od rzędu minimapa + menu, nie pod nim.** Pod minimapą stoi
 * przycisk kontekstowy `E` (`HUD_LAYOUT.rings.context`), więc rząd pod nią
 * wchodziłby na niego. Pozycję daje `menuButtonRect` — margines krawędzi
 * i minimapa są już w nim.
 *
 * Split of responsibilities, mirroring how the HUD already works:
 *  • `buffsChanged` (rare) rebuilds which icons exist;
 *  • `update()` (per frame, driven by UIScene) reads the Buffs snapshot for
 *    the countdown and drain animation. Pushing 60 events/sec to animate a
 *    timer would be absurd, hence the shared snapshot rather than a payload.
 *
 * Tap-to-inspect rather than hover: this targets touch first, where there is
 * no hover state to reveal a tooltip with.
 */
export class BuffBar {
  private widgets: BuffWidget[] = [];
  private popup: Phaser.GameObjects.Container;
  private popupBg: Phaser.GameObjects.Rectangle;
  private popupLines: Phaser.GameObjects.Text[] = [];
  /** Which buff the popup is currently describing, or null when hidden. */
  private openId: string | null = null;

  private readonly cell = 40;
  private readonly gap = 6;
  private readonly depth = 950;

  constructor(private readonly scene: Phaser.Scene) {
    this.popup = scene.add.container(0, 0).setScrollFactor(0).setDepth(this.depth + 10).setVisible(false);
    this.popupBg = scene.add
      .rectangle(0, 0, 240, 90, UI.bg, 0.96)
      .setOrigin(1, 0)
      .setStrokeStyle(2, UI.goldNum, 0.85);
    this.popup.add(this.popupBg);

    GameEvents.on(EVENT.buffsChanged, this.rebuild, this);
    GameEvents.on(EVENT.playerDied, this.hidePopup, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.buffsChanged, this.rebuild, this);
      GameEvents.off(EVENT.playerDied, this.hidePopup, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      // The snapshot is module-level and outlives the scene; leaving stale
      // entries would show a phantom buff on the next run.
      Buffs.clear();
    });

    this.rebuild();
  }

  /** Recreate one widget per active buff. Cheap and rare — buffs appear and
   *  expire, they don't churn. */
  private rebuild(): void {
    for (const w of this.widgets) w.container.destroy(true);
    this.widgets = [];

    for (const buff of Buffs.active) {
      const c = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(this.depth);

      const frame = this.scene.add
        .rectangle(0, 0, this.cell, this.cell, UI.slotBg, 0.95)
        .setStrokeStyle(2, UI.goldNum, 0.9);
      const icon = this.scene.add.image(0, 0, buff.iconKey).setDisplaySize(this.cell - 10, this.cell - 10);
      // Origin at the bottom so growing `height` makes it climb upward.
      const cover = this.scene.add
        .rectangle(0, this.cell / 2, this.cell - 4, 0, 0x000000, 0.55)
        .setOrigin(0.5, 1);
      const timeText = this.scene.add
        .text(0, this.cell / 2 + 2, "", textStyle({ fontSize: "11px", color: UI.white, stroke: "#000000", strokeThickness: 3 }))
        .setOrigin(0.5, 0);

      frame.setInteractive({ useHandCursor: true });
      frame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        this.togglePopup(buff.id);
      });

      // Top-right corner, above the cover so a nearly-drained venom still shows
      // how many stacks are on it.
      const stackText = this.scene.add
        .text(
          this.cell / 2 - 2,
          -this.cell / 2,
          "",
          textStyle({ fontSize: "13px", color: UI.white, stroke: "#000000", strokeThickness: 4 }),
        )
        .setOrigin(1, 0);

      c.add([frame, icon, cover, timeText, stackText]);
      // null = kolory jeszcze nieustawione, wiec pierwsza klatka zawsze maluje.
      this.widgets.push({ id: buff.id, paintedPaused: null, container: c, icon, frame, cover, timeText, stackText });
    }

    // A buff the popup was describing may have just expired.
    if (this.openId && !Buffs.get(this.openId)) this.hidePopup();
    this.layout();
  }

  /** Prawa krawędź rzędu i środek ikon w pionie — oba z przycisku menu. */
  private anchor(): { right: number; y: number } {
    const mm = menuButtonRect(this.scene);
    return { right: mm.x - 2 * this.gap, y: mm.y + this.cell / 2 };
  }

  /** Right-aligned row growing leftward from the menu button's left edge. */
  private layout(): void {
    const { right, y } = this.anchor();
    for (let i = 0; i < this.widgets.length; i++) {
      this.widgets[i].container.setPosition(right - this.cell / 2 - i * (this.cell + this.gap), y);
    }
    if (this.openId) this.positionPopup();
  }

  /** Per-frame: drain the cover, tick the countdown, grey out a paused buff. */
  update(): void {
    if (this.widgets.length === 0) return;
    for (const w of this.widgets) {
      const buff = Buffs.get(w.id);
      if (!buff) continue;
      const elapsed = 1 - Phaser.Math.Clamp(buff.remainingMs / buff.durationMs, 0, 1);
      w.cover.height = (this.cell - 4) * elapsed;
      w.timeText.setText(`${Math.ceil(buff.remainingMs / 1000)}s`);
      // Only from two upward: "×1" on a single stack would read as a quantity
      // the player is supposed to act on, when the interesting number is how
      // far the venom has climbed.
      w.stackText.setText(buff.stacks && buff.stacks > 1 ? `×${buff.stacks}` : "");

      // Paused reads as "not running": desaturated icon, muted frame and text.
      // A debuff keeps a red frame so a harmful effect is never mistaken for a
      // blessing at a glance.
      //
      // ⚠ Kolory **tylko przy zmianie stanu pauzy** — patrz `paintedPaused`.
      // Odliczanie musi lecieć co klatkę (`cover.height`), kolory nie: zmieniają
      // się raz na kilka sekund, a kosztują przerysowanie napisu.
      const paused = buff.paused === true;
      if (w.paintedPaused !== paused) {
        w.paintedPaused = paused;
        const frameColor = paused ? 0x556074 : buff.debuff ? 0xdd4444 : UI.goldNum;
        w.icon.setTint(paused ? 0x777777 : 0xffffff);
        w.timeText.setColor(paused ? UI.muted : UI.white);
        w.frame.setStrokeStyle(2, frameColor, 0.9);
      }
    }
    if (this.openId) this.refreshPopup();
  }

  private togglePopup(id: string): void {
    if (this.openId === id) {
      this.hidePopup();
      return;
    }
    this.openId = id;
    this.refreshPopup();
    this.popup.setVisible(true);
    this.positionPopup();
  }

  private hidePopup(): void {
    this.openId = null;
    this.popup.setVisible(false);
  }

  /** Rebuild the popup's text lines from the live snapshot. */
  private refreshPopup(): void {
    const buff = this.openId ? Buffs.get(this.openId) : undefined;
    if (!buff) {
      this.hidePopup();
      return;
    }

    const lines = this.describe(buff);
    // Reuse the Text objects across frames — this runs every frame while open,
    // so destroying and recreating them would churn objects continuously.
    while (this.popupLines.length < lines.length) {
      const t = this.scene.add.text(0, 0, "", textStyle({ fontSize: "11px", color: UI.text })).setOrigin(1, 0);
      this.popupLines.push(t);
      this.popup.add(t);
    }
    for (let i = 0; i < this.popupLines.length; i++) {
      const t = this.popupLines[i];
      const line = lines[i];
      t.setVisible(!!line);
      if (!line) continue;
      t.setText(line.text).setColor(line.color).setPosition(-12, 10 + i * 16);
      t.setFontStyle(line.bold ? "bold" : "normal");
    }

    const widest = Math.max(...lines.map((_, i) => this.popupLines[i].width));
    this.popupBg.setSize(Math.max(200, widest + 24), 16 + lines.length * 16);
  }

  private describe(buff: ActiveBuff): { text: string; color: string; bold?: boolean }[] {
    const secs = Math.ceil(buff.remainingMs / 1000);
    // Annotated rather than inferred: without it TS narrows the array to the
    // literal type of the first entry and rejects every later colour.
    const lines: { text: string; color: string; bold?: boolean }[] = [
      { text: buff.name, color: buff.debuff ? "#ff8a7a" : UI.gold, bold: true },
    ];
    if (buff.remainingHp !== undefined) {
      lines.push({ text: `Leczy: ${Math.ceil(buff.remainingHp)} PŻ pozostało`, color: UI.text });
    }
    lines.push({ text: `Czas: ${secs}s`, color: UI.text });
    // The last line describes what the effect actually does. Effects that carry
    // their own `detail` use it; only food falls through to the out-of-combat
    // wording, which is the one rule that line was ever written about.
    if (buff.detail) {
      lines.push({ text: buff.detail, color: buff.debuff ? "#ff9d3b" : UI.muted });
    } else {
      lines.push(
        buff.paused
          ? { text: "Wstrzymane — jesteś w walce", color: "#ff9d3b" }
          : { text: "Działa tylko poza walką", color: UI.muted },
      );
    }
    return lines;
  }

  private positionPopup(): void {
    const i = this.widgets.findIndex((w) => w.id === this.openId);
    if (i === -1) return;
    // Anchored to the row's right end rather than the icon: the popup is much
    // wider than a 40px cell and would otherwise hang off-screen.
    const { right, y } = this.anchor();
    this.popup.setPosition(right, y + this.cell / 2 + 6);
  }
}

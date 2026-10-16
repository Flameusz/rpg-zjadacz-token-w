import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Equipment } from "../core/Equipment";
import { Progression } from "../core/Progression";
import { itemIconKey } from "../core/Items";
import { UI } from "../core/theme";
import { iconFitScale } from "./IconFit";
import { CoachMark } from "./CoachMark";
import { hitCircle, slotOf, visualOf, type Point } from "./ControlLayout";

/**
 * **Zmiana zestawu broni z HUD-u** (2026-10-12, prośba autora — przygotowanie
 * pod łucznika z mieczem i tarczą: „szybki swap broni").
 *
 * ── Pokazuje, NA CO się zamienisz, nie co trzymasz ─────────────────────────
 * Ikona to broń z zestawu SCHOWANEGO (`weapon2`, a bez niej `offhand2`). To,
 * co postać ma w rękach, widać na modelu; pytanie, które gracz zadaje temu
 * przyciskowi, brzmi „co dostanę po tapnięciu".
 *
 * ── Istnieje tylko, gdy jest na co zamienić ───────────────────────────────
 * Pusty drugi zestaw = brak przycisku, jak pusty slot umiejętności
 * (`AbilityBar`). ⚠ To NIE łamie reguły „niedostępne jest wyszarzone
 * z powodem": przycisk nie byłby niedostępny CHWILOWO, tylko bez treści —
 * a stały szary krążek na każdym ekranie walki to dokładnie ten szum, którego
 * autor nie chce. Odmowy CHWILOWE (cios w locie, wymagania) nazywa scena.
 *
 * Przycisk niczego nie rozstrzyga: wysyła `weaponSwapRequested`, a decyzję
 * (śmierć, cios w locie, odstęp) podejmuje `GameScene` — reguła
 * `src/ui/CLAUDE.md`: UI nie sięga do sceny gry. Klawisz: `X`.
 *
 * ── PARA BRONI (2026-10-12) ───────────────────────────────────────────────
 * Stoi obok przycisku trybu ataku (`HUD_LAYOUT.place`, `outer` 2 i 3) na
 * wspólnej PODKŁADCE — kapsule rysowanej pod oboma, gdy oba istnieją. Autor:
 * „jeden zmienia broń, a drugi typ obrażeń dla niej", więc to jedna decyzja
 * o broni w dwóch krokach. Wzór: satelity przycisku ataku w MOBA (Mobile
 * Legends, Wild Rift — „atakuj stwora / wieżę" jako para przy ataku);
 * ⚠ nie przy samym ataku, bo pierścień wewnętrzny niesie umiejętności 1–3,
 * a satelita mniejszy od `minTouch` łamałby próg dotykowy.
 */
export class WeaponSwapButton {
  private container: Phaser.GameObjects.Container;
  private frame: Phaser.GameObjects.Arc;
  private icon: Phaser.GameObjects.Image;
  private readonly visual = visualOf("swap");
  /** Podkładka pary broni — pod tym przyciskiem i przyciskiem trybu ataku. */
  private readonly plate: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    this.plate = scene.add.graphics().setScrollFactor(0).setDepth(999);
    const hit = hitCircle(scene, "swap");
    this.frame = scene.add
      .circle(0, 0, this.visual / 2, UI.slotBg, 0.8)
      .setStrokeStyle(2, UI.goldNum, 0.75);
    this.icon = scene.add.image(0, 0, "__DEFAULT");
    // Znak „zamiana": dwie strzałki w małym krążku na obwodzie — rysowane, nie
    // pisane, bo glif „⇄" nie jest pewny w kroju monospace na Androidzie.
    const badge = scene.add.graphics();
    const bx = this.visual * 0.32;
    const by = this.visual * 0.32;
    badge.fillStyle(0x10141c, 0.95).fillCircle(bx, by, 11);
    badge.lineStyle(2, UI.goldNum, 1);
    badge.lineBetween(bx - 6, by - 3, bx + 5, by - 3).lineBetween(bx + 5, by - 3, bx + 2, by - 6);
    badge.lineBetween(bx + 6, by + 3, bx - 5, by + 3).lineBetween(bx - 5, by + 3, bx - 2, by + 6);

    this.container.add([hit, this.frame, this.icon, badge]);

    hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation(); // drążek nie może przejąć tego dotknięcia
      this.request();
    });
    scene.input.keyboard?.on("keydown-X", () => {
      if (this.container.visible) this.request();
    });

    GameEvents.on(EVENT.equipmentChanged, this.refresh, this);
    // Liczba wariantów zmienia się razem z bronią, ale wybór wariantu też
    // przychodzi tym zdarzeniem — podkładka pyta o obie strony pary.
    GameEvents.on(EVENT.attackVariantChanged, this.paintPlate, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.equipmentChanged, this.refresh, this);
      GameEvents.off(EVENT.attackVariantChanged, this.paintPlate, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });

    this.reposition();
    this.refresh();
  }

  private request(): void {
    GameEvents.emit(EVENT.weaponSwapRequested);
    this.scene.tweens.add({ targets: this.container, scale: 0.86, duration: 70, yoyo: true, ease: "Quad.easeOut" });
  }

  private refresh(): void {
    const stowed = Equipment.weapon2 ?? Equipment.offhand2;
    this.container.setVisible(!!stowed);
    this.paintPlate();
    if (!stowed) return;
    CoachMark.once("swap", () => slotOf(this.scene, "swap"), "Zmiana zestawu broni —\njedno dotknięcie, także w walce.", "above");
    const key = itemIconKey(stowed.itemId);
    if (!this.scene.textures.exists(key)) {
      this.icon.setVisible(false);
      return;
    }
    const src = this.scene.textures.get(key).getSourceImage();
    const box = this.visual * 0.66;
    this.icon.setTexture(key).setVisible(true).setScale(iconFitScale(src.width, src.height, box, box, 2));
  }

  private reposition(): void {
    const p = slotOf(this.scene, "swap");
    if (p) this.container.setPosition(p.x, p.y);
    this.paintPlate();
  }

  /**
   * Kapsuła pod parą „tryb ataku + zestaw" — wspólny obszar (prawo Gestalt:
   * rzeczy na jednej podkładce czytają się jako jedna grupa). Rysowana tylko,
   * gdy istnieją OBA przyciski; jeden nie ma z kim tworzyć pary.
   *
   * ⚠ Jeden wielokąt, nie dwa koła + prostokąt: półprzezroczyste kształty
   * nałożone w jednym `Graphics` ciemnieją na zakładkach.
   */
  private paintPlate(): void {
    const g = this.plate;
    g.clear();
    const both = !!(Equipment.weapon2 ?? Equipment.offhand2) && Progression.attackVariants.length > 1;
    const a = slotOf(this.scene, "mode");
    const b = slotOf(this.scene, "swap");
    if (!both || !a || !b) return;
    const pts = capsule(a, b, this.visual / 2 + 7);
    g.fillStyle(UI.bg, 0.45).fillPoints(pts, true);
    g.lineStyle(1.5, UI.goldNum, 0.3).strokePoints(pts, true);
  }
}

/** Obrys kapsuły o środkach półokręgów `a`, `b` i promieniu `r` (12 punktów na łuk). */
function capsule(a: Point, b: Point, r: number): Phaser.Math.Vector2[] {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const pts: Phaser.Math.Vector2[] = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const t = ang - Math.PI / 2 + (Math.PI * i) / steps;
    pts.push(new Phaser.Math.Vector2(b.x + Math.cos(t) * r, b.y + Math.sin(t) * r));
  }
  for (let i = 0; i <= steps; i++) {
    const t = ang + Math.PI / 2 + (Math.PI * i) / steps;
    pts.push(new Phaser.Math.Vector2(a.x + Math.cos(t) * r, a.y + Math.sin(t) * r));
  }
  return pts;
}

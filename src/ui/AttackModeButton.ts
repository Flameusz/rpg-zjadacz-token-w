import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Progression } from "../core/Progression";
import { Equipment, type DamageType } from "../core/Equipment";
import { UI, textStyle } from "../core/theme";
import { damageIconKey } from "../core/Assets";
import { cellOf, hitCircle, modeMenuSlot, slotOf, visualOf } from "./ControlLayout";
import { CoachMark } from "./CoachMark";

/**
 * Kolor per typ obrażeń — „czym bijesz" do odczytania bez czytania słowa.
 * Eksportowany, bo ten sam kolor niesie znaczek typu na przycisku ataku.
 */
export const TYPE_COLOR: Record<DamageType, number> = {
  slash: 0x9fd6ff,
  pierce: 0xffe08a,
  blunt: 0xffa568,
};

interface MenuEntry {
  container: Phaser.GameObjects.Container;
  frame?: Phaser.GameObjects.Arc;
  index: number; // −1 = „✕"
}

/**
 * **Tryb ataku: JEDEN przycisk, wybór w rozwijanej kolumnie** (2026-10-12).
 *
 * ── Dlaczego zszedł z pierścienia ─────────────────────────────────────────
 * Do tej daty `AttackVariantBar` rysował jeden przycisk NA wariant i zajmował
 * cały wewnętrzny pierścień (22–30 mm od kciuka — najlepsze miejsce klastra),
 * z sądem „typ zmienia się częściej niż zdolność". Autor z gry: gracz nie
 * zmienia typu co kilka sekund, więc wybór może być kliknięciem, które dopiero
 * POKAZUJE opcje — „po kliknięciu pokazuje się pasek z przyciskiem anuluj na
 * końcu". Zwolnione miejsce dostały umiejętności 1–3 (`HUD_LAYOUT.place`).
 *
 * ── Typ obrażeń dalej widać ZAWSZE ─────────────────────────────────────────
 * Stara zasada zostaje (przy osi typ × materiał pancerza ukrycie typu to
 * ukrycie połowy mechaniki), zmienia się nośnik: typ niesie znaczek na
 * przycisku ataku (`AttackButton`). Dlatego ten przycisk istnieje TYLKO przy
 * broni z więcej niż jednym sposobem użycia — przy jednym nie ma czego
 * wybierać, a odczyt i tak jest na ataku.
 *
 * ── Kolumna ────────────────────────────────────────────────────────────────
 * Szkic autora: kolumna na lewo od klastra, opcje od dołu, „✕" na końcu
 * (`ControlLayout.modeMenuSlot`). Wybór zamyka kolumnę; „✕" i ponowne
 * tapnięcie przycisku też. Gra się NIE pauzuje — to dwa tapnięcia, nie panel.
 *
 * Przycisk niczego nie rozstrzyga: pisze `Equipment.setActiveAttack` i czyta
 * `Progression`. Cios już w locie zachowuje swój wariant (`pendingSwing`).
 */
export class AttackModeButton {
  private container: Phaser.GameObjects.Container;
  private frame: Phaser.GameObjects.Arc;
  private icon: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private menu: MenuEntry[] = [];
  private readonly visual = visualOf("mode");
  private readonly optionVisual = cellOf("mode") * 0.84;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    const hit = hitCircle(scene, "mode");
    this.frame = scene.add.circle(0, 0, this.visual / 2, UI.slotBg, 0.85).setStrokeStyle(2, 0xffffff, 0.9);
    this.icon = scene.add.image(0, 0, damageIconKey("slash")).setDisplaySize(this.visual * 0.5, this.visual * 0.5);
    // ⚠ Podpis POD kółkiem, nie w nim: w kafelku „Pchnięcie" trzeba by ściskać
    // krój do szerokości, a skróty trzeba by wymyślać per wariant.
    this.label = scene.add
      .text(0, this.visual / 2 + 10, "", textStyle({ fontSize: "12px", color: UI.white, stroke: "#000000", strokeThickness: 3 }))
      .setOrigin(0.5);
    this.container.add([hit, this.frame, this.icon, this.label]);

    hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation(); // drążek nie może przejąć tego dotknięcia
      if (this.menu.length) this.closeMenu();
      else this.openMenu();
    });

    GameEvents.on(EVENT.equipmentChanged, this.onEquipmentChanged, this);
    GameEvents.on(EVENT.attackVariantChanged, this.refresh, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.equipmentChanged, this.onEquipmentChanged, this);
      GameEvents.off(EVENT.attackVariantChanged, this.refresh, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
      this.closeMenu();
    });

    this.reposition();
    this.refresh();
  }

  /** Inna broń = inne warianty: otwarta kolumna opisywałaby poprzednią. */
  private onEquipmentChanged(): void {
    this.closeMenu();
    this.refresh();
  }

  private refresh(): void {
    const variants = Progression.attackVariants;
    this.container.setVisible(variants.length > 1);
    if (variants.length < 2) return;
    CoachMark.once(
      "attackMode",
      () => slotOf(this.scene, "mode"),
      "Ta broń bije na kilka sposobów.\nDotknij, by wybrać — dobierz do pancerza wroga.",
      "left",
    );
    const v = variants[Progression.activeVariantIndex] ?? variants[0];
    const color = TYPE_COLOR[v.damageType];
    this.frame.setStrokeStyle(2, color, 0.95);
    this.icon.setTexture(damageIconKey(v.damageType)).setDisplaySize(this.visual * 0.5, this.visual * 0.5);
    this.label.setText(v.name);
  }

  private openMenu(): void {
    const variants = Progression.attackVariants;
    if (variants.length < 2) return;
    const active = Progression.activeVariantIndex;
    const r = this.optionVisual / 2;

    variants.forEach((v, i) => {
      const color = TYPE_COLOR[v.damageType];
      const on = i === active;
      const c = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1001);
      const hit = hitCircle(this.scene, "mode");
      const frame = this.scene.add
        .circle(0, 0, r, UI.slotBg, on ? 0.95 : 0.85)
        .setStrokeStyle(on ? 3 : 2, color, on ? 1 : 0.7);
      const icon = this.scene.add.image(0, 0, damageIconKey(v.damageType)).setDisplaySize(r, r);
      const label = this.scene.add
        .text(0, r + 9, v.name, textStyle({ fontSize: "12px", color: on ? UI.white : UI.text, stroke: "#000000", strokeThickness: 3 }))
        .setOrigin(0.5);
      hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        Equipment.setActiveAttack(i);
        this.closeMenu();
      });
      c.add([hit, frame, icon, label]);
      this.menu.push({ container: c, frame, index: i });
    });

    // „✕" na KOŃCU kolumny — szkic autora. Mniejszy i bez koloru typu, żeby nie
    // czytał się jak czwarty sposób użycia broni.
    const x = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1001);
    const xHit = hitCircle(this.scene, "mode");
    const xFrame = this.scene.add.circle(0, 0, r * 0.8, UI.slotBg, 0.8).setStrokeStyle(2, 0x8a93a6, 0.8);
    const cross = this.scene.add.graphics().lineStyle(3, 0xc9d1e0, 1);
    const k = r * 0.32;
    cross.lineBetween(-k, -k, k, k).lineBetween(-k, k, k, -k);
    xHit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.closeMenu();
    });
    x.add([xHit, xFrame, cross]);
    this.menu.push({ container: x, index: -1 });

    this.layoutMenu();
    for (const m of this.menu) {
      m.container.setAlpha(0);
      this.scene.tweens.add({ targets: m.container, alpha: 1, duration: 90 });
    }
  }

  private closeMenu(): void {
    for (const m of this.menu) m.container.destroy(true);
    this.menu = [];
  }

  private layoutMenu(): void {
    this.menu.forEach((m, i) => {
      const p = modeMenuSlot(this.scene, i);
      m.container.setPosition(p.x, p.y);
    });
  }

  private reposition(): void {
    const p = slotOf(this.scene, "mode");
    if (p) this.container.setPosition(p.x, p.y);
    this.layoutMenu();
  }
}

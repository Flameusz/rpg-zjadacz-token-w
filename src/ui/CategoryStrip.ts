/**
 * ── PASEK ZAKŁADEK KATEGORII (`OI-130`, 2026-10-11) ─────────────────────────
 *
 * Rząd zakładek nad siatką: półka kupca, plecak w sklepie, plecak w panelu
 * postaci. Co należy do której zakładki, mówi `ItemCategory.ts`; ten plik
 * wyłącznie rysuje i zgłasza wybór.
 *
 * ⚠ **Zakładka to GLIF slotu, a wybrana dostaje też NAPIS.** Kolumna siatki ma
 * na telefonie ~300 j., a kupiec bywa z dziewięcioma kategoriami — napisy na
 * wszystkich zakładkach dałyby ~33 j. na sztukę, czyli poniżej połowy normy
 * dotyku. Glif to ten sam język, co puste kafle lalki, więc nie trzeba go
 * uczyć; napis na wybranej mówi, co się właśnie pokazuje.
 *
 * ⚠ **Gdy zakładki się nie mieszczą, pasek PRZEWIJA SIĘ w poziomie palcem.**
 * Maska przycina RYSOWANIE, nie WEJŚCIE (`src/ui/CLAUDE.md`), więc zakładka
 * wysunięta poza pasek traci wejście (`syncInput`).
 *
 * ⚠ Wybór na POINTER UP i tylko wtedy, gdy palec nie przewijał — ta sama
 * reguła, co wiersze `TopicPanel`.
 */
import Phaser from "phaser";
import { ASSETS } from "../config/GameConfig";
import { UI, fontPx, textStyle, uiScale } from "../core/theme";
import { Sfx } from "../core/Sfx";
import { itemIconKey, type ItemId } from "../core/Items";
import { categoriesPresent, countIn, type CategoryDef, type ItemCategory } from "./ItemCategory";

/** Prostokąt paska w układzie RODZICA (lewy górny róg + rozmiar). */
export interface StripRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const CHIP_W = 52;
/** Wysokość paska, z której liczą układy obu paneli. */
export const STRIP_H = 48;
const GAP = 4;
/** Ruch palca, po którym dotknięcie staje się przewijaniem. */
const SLOP = 8;

interface Chip {
  readonly def: CategoryDef;
  readonly box: Phaser.GameObjects.Rectangle;
  readonly parts: Phaser.GameObjects.GameObject[];
  readonly x: number;
  readonly w: number;
}

export class CategoryStrip {
  private readonly row: Phaser.GameObjects.Container;
  private readonly maskG: Phaser.GameObjects.Graphics;
  private chips: Chip[] = [];
  private _selected: ItemCategory = "all";
  private offset = 0;
  private contentW = 0;
  private pressId = -1;
  private pressX = 0;
  private lastX = 0;
  private scrolled = false;
  private pressChip: Chip | null = null;
  private lastIds: ItemId[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly parent: Phaser.GameObjects.Container,
    private readonly rect: StripRect,
    private readonly onChange: (cat: ItemCategory) => void,
  ) {
    this.row = scene.add.container(rect.x, rect.y);
    parent.add(this.row);
    this.maskG = scene.make.graphics({}, false);
    this.row.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.maskG));

    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  get selected(): ItemCategory {
    return this._selected;
  }

  /**
   * Przebuduj zakładki pod ten zbiór rzeczy. Gdy wybrana kategoria zniknęła
   * (sprzedano ostatni hełm), wraca „Wszystko" i leci `onChange`.
   */
  setItems(ids: ItemId[], silent = false): boolean {
    this.lastIds = ids;
    const defs = categoriesPresent(ids);
    if (!defs.some((d) => d.id === this._selected)) {
      this._selected = "all";
      this.build(defs, ids);
      // `silent`: wołający sam przemaluje widok (inaczej `refresh` → `setItems`
      // → `onChange` → `refresh` zagnieżdżałby się w sobie).
      if (!silent) this.onChange("all");
      return true;
    }
    this.build(defs, ids);
    return false;
  }

  /**
   * Wybierz zakładkę z zewnątrz (tapnięcie pustego slotu lalki → „pokaż, co tu
   * pasuje"). `false`, gdy takiej zakładki dziś nie ma — pusta nie istnieje
   * (`categoriesPresent`), więc wołający mówi graczowi, że nic nie pasuje.
   */
  select(cat: ItemCategory): boolean {
    if (!categoriesPresent(this.lastIds).some((d) => d.id === cat)) return false;
    if (cat === this._selected) return true;
    this._selected = cat;
    this.build(categoriesPresent(this.lastIds), this.lastIds);
    this.onChange(cat);
    return true;
  }

  /** Wróć do „Wszystko" bez zgłaszania (nowa wizyta u kupca). */
  reset(): void {
    this._selected = "all";
    this.offset = 0;
  }

  /**
   * Maska we współrzędnych SCENY — z macierzy świata rodzica, bo pasek siedzi
   * w kontenerach zagnieżdżonych (strona panelu w panelu), a panel bywa
   * zmniejszony skalą (`PanelBase.fitScale`). Woła ją właściciel przy każdym
   * `reposition()`.
   */
  refreshMask(): void {
    const m = this.parent.getWorldTransformMatrix();
    const p = m.transformPoint(this.rect.x, this.rect.y);
    const s = m.scaleX;
    this.maskG.clear().fillStyle(0xffffff).fillRect(p.x, p.y, this.rect.w * s, this.rect.h * s);
  }

  setVisible(v: boolean): void {
    this.row.setVisible(v);
    this.syncInput();
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    this.maskG.destroy();
  }

  private build(defs: CategoryDef[], ids: ItemId[]): void {
    this.row.removeAll(true);
    this.chips = [];
    const h = this.rect.h;
    let x = 0;
    for (const def of defs) {
      const on = def.id === this._selected;
      const count = def.id === "all" ? ids.length : countIn(ids, def.id);
      const label = on || def.id === "all"
        // ⭐ Etap E: napis z roli drugiego planu (15 j.) — przy 11 j. „Wszystko"
        //   było ≈ 7 dp, najdrobniejszym tekstem sklepu i plecaka.
        ? this.scene.add.text(0, h / 2, def.label, textStyle({ fontSize: fontPx("small"), color: on ? UI.gold : UI.muted }))
            .setOrigin(0, 0.5)
        : null;
      const hasPic = def.glyph !== undefined || def.iconItem !== undefined;
      const picW = hasPic ? 30 : 0;
      // `+ 10` przy napisie: licznik w prawym górnym rogu nie może wejść na ostatnią literę.
      const w = Math.max(CHIP_W, (label ? label.width + 22 : 0) + picW + (hasPic && label ? 4 : 0));
      const box = this.scene.add
        .rectangle(x + w / 2, h / 2, w - 2, h - 2, UI.slotBg, 1)
        .setStrokeStyle(on ? 2 : 1, on ? UI.goldNum : 0x3a4058, 1)
        .setInteractive({ useHandCursor: true });
      const parts: Phaser.GameObjects.GameObject[] = [box];
      let cx = x + (label ? 8 : w / 2 - picW / 2);
      if (def.glyph !== undefined && this.scene.textures.exists(ASSETS.slotGlyphs.key)) {
        parts.push(this.scene.add.image(cx + picW / 2, h / 2, ASSETS.slotGlyphs.key, def.glyph).setAlpha(on ? 1 : 0.75));
      } else if (def.iconItem) {
        const key = itemIconKey(def.iconItem);
        const img = this.scene.add.image(cx + picW / 2, h / 2, key).setAlpha(on ? 1 : 0.75);
        img.setScale(Math.min(1, 26 / Math.max(img.width, img.height)));
        parts.push(img);
      }
      if (label) {
        label.setX(hasPic ? cx + picW + 4 : x + (w - label.width) / 2);
        parts.push(label);
      }
      // Liczba rzeczy w zakładce — w prawym górnym rogu, jak licznik stosu.
      parts.push(
        this.scene.add
          .text(x + w - 4, 2, `${count}`, textStyle({ fontSize: "12px", color: UI.white, stroke: "#000000", strokeThickness: 3 }))
          .setOrigin(1, 0),
      );
      this.row.add(parts);
      const chip: Chip = { def, box, parts, x, w };
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        this.pressId = p.id;
        this.pressX = this.lastX = p.x;
        this.scrolled = false;
        this.pressChip = chip;
      });
      this.chips.push(chip);
      x += w + GAP;
    }
    this.contentW = Math.max(0, x - GAP);
    // Wybrana zakładka ma być widoczna — inaczej po przebudowie mogłaby
    // wylądować za krawędzią paska.
    const sel = this.chips.find((c) => c.def.id === this._selected);
    if (sel) {
      if (sel.x < this.offset) this.offset = sel.x;
      else if (sel.x + sel.w > this.offset + this.rect.w) this.offset = sel.x + sel.w - this.rect.w;
    }
    this.applyOffset();
  }

  private maxOffset(): number {
    return Math.max(0, this.contentW - this.rect.w);
  }

  private applyOffset(): void {
    this.offset = Phaser.Math.Clamp(this.offset, 0, this.maxOffset());
    this.row.x = this.rect.x - this.offset;
    this.syncInput();
  }

  /** Wejście tylko dla zakładek widocznych w pasku (maska nie blokuje wejścia). */
  private syncInput(): void {
    for (const c of this.chips) {
      const left = c.x - this.offset;
      const vis = this.row.visible && left + c.w > 8 && left < this.rect.w - 8;
      if (c.box.input) c.box.input.enabled = vis;
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pressId) return;
    // ⚠ Piksele BUFORA → jednostki panelu: dwa przeliczenia (`src/ui/CLAUDE.md`).
    const s = uiScale() * this.parent.getWorldTransformMatrix().scaleX;
    if (!this.scrolled && Math.abs(p.x - this.pressX) / s > SLOP) this.scrolled = true;
    if (this.scrolled) {
      this.offset -= (p.x - this.lastX) / s;
      this.applyOffset();
    }
    this.lastX = p.x;
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pressId) return;
    const chip = this.pressChip;
    this.pressId = -1;
    this.pressChip = null;
    if (this.scrolled || !chip) return;
    if (chip.def.id === this._selected) return;
    Sfx.play("ui-click");
    this._selected = chip.def.id;
    this.build(categoriesPresent(this.lastIds), this.lastIds);
    this.onChange(this._selected);
  }
}

import Phaser from "phaser";
import { UI, textStyle, fontPx, uiW, uiH, formatAmount } from "../core/theme";
import { Sfx } from "../core/Sfx";
import { computeRailLayout, type RailLayout, type Rect } from "./FrameLayout";
import { drawCoin, drawUiIcon, type UiIconKind } from "./UiIcons";

/** Jedna zakładka szyny. */
export interface RailTab<Id extends string> {
  id: Id;
  label: string;
  icon: UiIconKind;
  /** Krótki stan pod podpisem (≤ ~16 znaków): „do oddania", „2 do nauki". */
  note?: string;
  noteColor?: string;
  /** Znacznik po prawej: „!" nowe zadanie, „?" do oddania, „+" do kupienia. */
  marker?: { text: string; color: string };
}

/** Kafel zakładki albo usługi — ten sam rysunek w szynie i w kolumnie rozmowy. */
export interface TileSpec {
  label: string;
  icon: UiIconKind;
  note?: string;
  noteColor?: string;
  marker?: { text: string; color: string };
  /** Czynna zakładka (złota ramka i podpis). */
  active?: boolean;
  /** Ciche wyjście („Do widzenia") — inny wygląd niż akcja (research §4.2). */
  quiet?: boolean;
  /** Sama ikona (szyna wąskiego okna). */
  compact?: boolean;
}

/** Wymiary rysunku kafla (jednostki UI). Geometrię pozycji liczy `FrameLayout`. */
const TILE = {
  padL: 14,
  icon: 28,
  iconGap: 10,
  markerR: 11,
} as const;

const COLORS = {
  fill: UI.slotBg,
  stroke: 0x3a4058,
  activeFill: 0x2a3046,
  pressFill: 0x2a3350,
  quietFill: 0x151925,
  quietStroke: 0x2e3446,
  bg: 0x10131b,
} as const;

/**
 * Narysuj kafel `spec` w prostokącie `r` do kontenera `into` i podepnij
 * gest: **naciśnięcie POKAZUJE, puszczenie WYKONUJE**, zjechanie palcem
 * z kafla anuluje — ten sam kontrakt, co wiersze rozmowy (`ConversationSheet`).
 *
 * Wspólne dla szyny i bloku usług w kolumnie rozmowy: usługa ma w obu trybach
 * tę samą ikonę, podpis i znacznik (research §4.1 — odruch kciuka zostaje).
 * `guard` = czy puszczenie ma być teraz zignorowane (blokada po nowej
 * wypowiedzi w rozmowie).
 */
export function buildTile(
  scene: Phaser.Scene,
  into: Phaser.GameObjects.Container,
  r: Rect,
  spec: TileSpec,
  onClick: () => void,
  guard: () => boolean = () => false,
): void {
  const idleFill = spec.quiet ? COLORS.quietFill : spec.active ? COLORS.activeFill : COLORS.fill;
  const idleStroke = spec.quiet ? COLORS.quietStroke : spec.active ? UI.goldNum : COLORS.stroke;
  const box = scene.add
    .rectangle(r.x, r.y, r.w, r.h, idleFill, 1)
    .setOrigin(0)
    .setStrokeStyle(2, idleStroke, spec.active ? 1 : 0.9)
    .setInteractive({ useHandCursor: true });
  const paintIdle = () => box.setFillStyle(idleFill, 1).setStrokeStyle(2, idleStroke, spec.active ? 1 : 0.9);
  let pressed = false;
  box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
    p.event.stopPropagation();
    pressed = true;
    box.setFillStyle(COLORS.pressFill, 1).setStrokeStyle(3, UI.goldNum, 1);
  });
  box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    if (!pressed) return;
    pressed = false;
    paintIdle();
    if (guard()) return;
    Sfx.play("ui-click");
    onClick();
  });
  box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
    if (!pressed) box.setStrokeStyle(2, UI.goldNum, 1);
  });
  box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
    pressed = false;
    paintIdle();
  });
  into.add(box);

  const cy = r.y + r.h / 2;
  const iconColor = spec.quiet ? 0x8892a6 : spec.active ? UI.goldNum : 0xc8d0e0;
  const iconX = spec.compact ? r.x + r.w / 2 : r.x + TILE.padL + TILE.icon / 2;
  into.add(drawUiIcon(scene.add.graphics({ x: iconX, y: cy }), spec.icon, TILE.icon, iconColor, idleFill));

  if (!spec.compact) {
    const textX = r.x + TILE.padL + TILE.icon + TILE.iconGap;
    const textW = r.w - (textX - r.x) - (spec.marker ? TILE.markerR * 2 + 10 : 10);
    const color = spec.quiet ? UI.muted : spec.active ? UI.gold : UI.white;
    const label = scene.add
      .text(textX, cy, spec.label, textStyle({ fontSize: fontPx("body"), color, fontStyle: spec.quiet ? "normal" : "bold" }))
      .setOrigin(0, 0.5);
    into.add(label);
    if (spec.note) {
      const note = scene.add
        .text(textX, 0, spec.note, textStyle({ fontSize: fontPx("small"), color: spec.noteColor ?? UI.muted }))
        .setOrigin(0, 0);
      // Podpis i dopisek razem, wyśrodkowane w pionie kafla.
      const block = label.height + note.height - 2;
      label.setOrigin(0, 0).setY(cy - block / 2);
      note.setY(label.y + label.height - 2);
      into.add(note);
      if (import.meta.env.DEV && note.width > textW) {
        console.warn(`[Rail] dopisek „${spec.note}" (${Math.round(note.width)} j.) nie mieści się w kaflu (${Math.round(textW)} j.)`);
      }
    }
    if (import.meta.env.DEV && label.width > textW) {
      console.warn(`[Rail] podpis „${spec.label}" (${Math.round(label.width)} j.) nie mieści się w kaflu (${Math.round(textW)} j.)`);
    }
  }

  if (spec.marker) {
    const mx = spec.compact ? r.x + r.w - 12 : r.x + r.w - TILE.markerR - 8;
    const my = spec.compact ? r.y + 12 : cy;
    into.add(
      scene.add
        .text(mx, my, spec.marker.text, textStyle({ fontSize: fontPx("name"), color: spec.marker.color, fontStyle: "bold" }))
        .setOrigin(0.5),
    );
  }
}

/**
 * ⭐ **SZYNA — pionowa nawigacja przy prawej krawędzi** (etap B, 2026-10-13;
 * decyzje autora D13, E4, E5 w `docs/ui_mobile_research.md` §8).
 *
 *   ┌──────────────┐
 *   │ IMIĘ         │  ← tożsamość (w rozmowie: samo imię NPC — E4)
 *   │ ● 3 020      │  ← sakiewka
 *   │ 💬 Rozmowa   │
 *   │ 🪙 Handel  ! │  ← zakładki: ikona + podpis, kafel ≥ 68 j.
 *   │ 📜 Zadania   │
 *   │              │
 *   │ ✕ Do widzenia│  ← wyjście NA DOLE (E5), ≥ 16 j. przerwy, cichy wygląd
 *   └──────────────┘
 *
 * ── Dlaczego szyna, a nie listwa u góry ────────────────────────────────────
 * Na 13 zrzutach ekwipunku z researchu żadna gra mobilna nie przełącza działów
 * listwą u góry; w poziomie brakuje WYSOKOŚCI, nie szerokości (R2). Szyna
 * kosztuje ~16% szerokości, której jest w nadmiarze, a listwa 56–68 j. — rząd
 * plecaka. Jeden wzorzec „opcje = pionowa lista po prawej" w całej grze, jak
 * kolumna odpowiedzi w rozmowie.
 *
 * Widżet niczego nie rozstrzyga: zgłasza wybór i wyjście, stan ustawia
 * właściciel (`setTabs`, `setActive`, `setIdentity`). Geometria —
 * `FrameLayout.computeRailLayout` (czysta, z przymiarem `tools/panel_fit.mjs`).
 */
export class Rail<Id extends string> {
  readonly root: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly walletText: Phaser.GameObjects.Text;
  private readonly coin: Phaser.GameObjects.Graphics;
  private readonly tiles: Phaser.GameObjects.Container;
  private tabs: RailTab<Id>[] = [];
  private active: Id | null = null;
  private wallet: number | null = null;
  /** Szyna samych ikon dla zakładki gęstej treści (`FrameLayout.railCompact`). */
  private dense = false;
  private layoutNow: RailLayout | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: {
      depth: number;
      exitLabel: string;
      onSelect: (id: Id) => void;
      onExit: () => void;
    },
  ) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(opts.depth).setVisible(false);
    // Tło interaktywne na całej wysokości — dotyk między kaflami nie może
    // przejść do panelu pod spodem ani do drążka.
    this.bg = scene.add.rectangle(0, 0, 10, 10, COLORS.bg, 0.97).setOrigin(0).setInteractive();
    this.bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => p.event.stopPropagation());
    this.title = scene.add.text(0, 0, "", textStyle({ fontSize: fontPx("body"), color: UI.gold, fontStyle: "bold" }));
    this.walletText = scene.add
      .text(0, 0, "", textStyle({ fontSize: fontPx("body"), color: UI.goldLight, fontStyle: "bold" }))
      .setOrigin(0, 0.5);
    this.coin = drawCoin(scene.add.graphics(), 20, "gold");
    this.tiles = scene.add.container(0, 0);
    this.root.add([this.bg, this.title, this.coin, this.walletText, this.tiles]);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.render, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.render, this);
    });
  }

  get visible(): boolean {
    return this.root.visible;
  }

  /** Imię (do dwóch wierszy) i stan sakiewki; `null` = bez sakiewki. */
  setIdentity(title: string, wallet: number | null): void {
    this.title.setText(title);
    this.setWallet(wallet);
  }

  setWallet(amount: number | null): void {
    this.wallet = amount;
    if (amount !== null) this.walletText.setText(formatAmount(amount));
    this.applyWallet();
  }

  /** Sakiewka widoczna, gdy jest kwota i szyna ma podpisy (wąska nie ma). */
  private applyWallet(): void {
    const show = this.wallet !== null && !(this.layoutNow?.compact ?? false);
    this.walletText.setVisible(show);
    this.coin.setVisible(show);
  }

  /** `dense` = same ikony (zakładka, której widok potrzebuje szerokości). */
  setTabs(tabs: RailTab<Id>[], active: Id, dense = false): void {
    this.tabs = tabs;
    this.active = active;
    this.dense = dense;
    this.render();
  }

  setActive(id: Id): void {
    if (this.active === id) return;
    this.active = id;
    this.render();
  }

  setVisible(on: boolean): void {
    this.root.setVisible(on);
    if (on) this.render();
  }

  /** Ostatnio policzony układ — dla przejścia kolumna → szyna. */
  get layout(): RailLayout | null {
    return this.layoutNow;
  }

  private render(): void {
    if (!this.root.visible) return;
    const W = uiW(this.scene);
    const H = uiH(this.scene);
    const L = computeRailLayout(W, H, this.tabs.length, this.dense);
    this.layoutNow = L;
    if (L.overflow && import.meta.env.DEV) console.warn(`[Rail] ${L.overflow}`);

    this.bg.setPosition(L.bgX, 0).setSize(L.bgW, H);
    this.bg.input?.hitArea.setTo(0, 0, L.bgW, H);

    const showIdentity = !L.compact;
    this.title.setVisible(showIdentity);
    this.title.setWordWrapWidth(L.w - 8, true).setMaxLines(2);
    // Bez sakiewki (rama rozmowy) imię stoi na środku swojego bloku.
    const titleY = this.wallet === null ? L.identity.y + (L.identity.h - this.title.height) / 2 : L.identity.y + 2;
    this.title.setPosition(L.identity.x + 4, titleY);
    const walletY = L.identity.y + L.identity.h - 14;
    this.coin.setPosition(L.identity.x + 4 + 10, walletY);
    this.walletText.setPosition(L.identity.x + 4 + 20 + 8, walletY);
    this.applyWallet();

    this.tiles.removeAll(true);
    this.tabs.forEach((t, i) => {
      buildTile(
        this.scene,
        this.tiles,
        L.tabs[i],
        { ...t, active: t.id === this.active, compact: L.compact },
        () => {
          if (t.id !== this.active) this.opts.onSelect(t.id);
        },
      );
    });
    buildTile(
      this.scene,
      this.tiles,
      L.exit,
      { label: this.opts.exitLabel, icon: "close", quiet: true, compact: L.compact },
      () => this.opts.onExit(),
    );
  }
}

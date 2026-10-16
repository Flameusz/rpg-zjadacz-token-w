import Phaser from "phaser";
import { UI, fontPx, textStyle, uiScale, formatAmount, type TypeRole } from "../core/theme";
import { Sfx } from "../core/Sfx";
import { drawCoin } from "./UiIcons";
import { LIST_DETAIL, type ListDetailLayout } from "./ListDetailLayout";
import type { Rect } from "./FrameLayout";

/**
 * ── LISTA + KARTA — renderer (etap F, 2026-10-13) ─────────────────────────
 *
 * Jeden widżet dla zadań, szkolenia i Mistrzostwa (research §8 R6). Panele
 * podają DANE (`ListRow[]`, `ListCard`) i reagują na wybór; rysowanie,
 * przewijanie, maski i przycisk główny mieszkają tutaj — do tej daty trzy
 * panele trzymały po kopii tych samych kolumn, ramek wierszy i „brakuje: …".
 *
 * ⚠ **Ten plik RYSUJE, nie liczy.** Geometria: `ListDetailLayout.ts` (czysty).
 * Treść (co jest do wzięcia, ile kosztuje, czego brakuje): panel wołający.
 *
 * Reguły wspólne z resztą katalogu (`src/ui/CLAUDE.md`):
 * - wybór na POINTER UP i tylko bez przewijania (gest czytany ze SCENY);
 * - maska przycina RYSOWANIE, nie WEJŚCIE — wiersz poza oknem traci wejście;
 * - punkt z `pointer.x/y` przez DWA przeliczenia (`uiScale` i skala panelu),
 *   maska wyłącznie przez skalę panelu;
 * - przycisk niedostępny jest WYSZARZONY i WIDOCZNY, z powodem nad nim.
 */

export interface ListRow {
  readonly id: string;
  /** Ikona (klucz tekstury) w lewej kolumnie — zamiast znacznika. */
  readonly icon?: string;
  /** Znacznik w lewej kolumnie: `!` do wzięcia, `?` do oddania, `✓` gotowe, `+` do kupienia. */
  readonly mark?: string;
  readonly markColor?: string;
  readonly name: string;
  readonly nameColor?: string;
  /** Drugi wiersz pod nazwą (`small`) — stan, nie opis. */
  readonly note?: string;
  readonly noteColor?: string;
  /** Liczba przy prawej krawędzi (wyrównana do PRAWEJ — krój bez cyfr tabelarycznych). */
  readonly value?: string;
  readonly valueColor?: string;
}

export interface CardLine {
  readonly text: string;
  readonly color?: string;
  readonly bold?: boolean;
  readonly role?: TypeRole;
  /** Wartość przy prawej krawędzi — wiersz „etykieta … wartość". */
  readonly value?: string;
  readonly valueColor?: string;
  /** Pasek postępu POD wierszem (0…1). */
  readonly bar?: { readonly ratio: number; readonly color?: number };
}

export interface CardSection {
  /** Tytuł sekcji (wersalikami, `small`). Bez tytułu = ciągła proza. */
  readonly title?: string;
  /** Podpis przy prawej krawędzi tytułu („rośnie od używania broni"). */
  readonly aside?: string;
  readonly lines: readonly CardLine[];
}

export interface CardAction {
  /** Napis z kwotą („Naucz · 120 g + 1 pkt") — cena stoi NA przycisku. */
  readonly label: string;
  readonly enabled: boolean;
  readonly onClick: () => void;
}

/**
 * Rząd kafli WYBORU MIEJSCA w pasie akcji (zamiast jednego przycisku) —
 * dziś: „na który slot paska". Kafel aktywny = tu leży; jego dotknięcie
 * cofa wybór. ⭐ Zastąpił stos do sześciu przycisków „Slot N — zamień"
 * pod kartą-okienkiem (Postać → Umiejętności, etap F).
 */
export interface CardPicker {
  readonly slots: readonly {
    readonly label: string;
    readonly icon?: string;
    readonly active: boolean;
    readonly onPick: () => void;
  }[];
}

/** Stan sakiewki w nagłówku karty i wydatek, który przycisk by zrobił. */
export interface CardWallet {
  readonly gold: number;
  readonly spendGold?: number;
  readonly points?: number;
  readonly spendPoints?: number;
}

export interface ListCard {
  readonly title: string;
  readonly titleColor?: string;
  readonly subtitle?: string;
  readonly subtitleColor?: string;
  readonly wallet?: CardWallet;
  readonly sections: readonly CardSection[];
  /** Jedno zdanie NAD przyciskiem, gdy akcja jest niemożliwa. */
  readonly refusal?: string;
  /** Jedno zdanie NAD pasem akcji, gdy nie jest odmową (wyciszone). */
  readonly hint?: string;
  readonly action?: CardAction;
  readonly picker?: CardPicker;
}

const SECTION_COLOR = "#7d889c";
const ROW_STROKE = 0x3a4058;
/** Ile jednostek ruchu palca zanim gest staje się przewijaniem. */
const SLOP = 8;

type Zone = "list" | "body";

export class ListDetail {
  private readonly listRoot: Phaser.GameObjects.Container;
  private readonly listMaskG: Phaser.GameObjects.Graphics;
  private readonly listTrack: Phaser.GameObjects.Rectangle;
  private readonly listThumb: Phaser.GameObjects.Rectangle;
  private readonly headerRoot: Phaser.GameObjects.Container;
  private readonly bodyRoot: Phaser.GameObjects.Container;
  private readonly bodyMaskG: Phaser.GameObjects.Graphics;
  private readonly bodyTrack: Phaser.GameObjects.Rectangle;
  private readonly bodyThumb: Phaser.GameObjects.Rectangle;
  private readonly actionRoot: Phaser.GameObjects.Container;
  private readonly emptyText: Phaser.GameObjects.Text;

  private rowBoxes: { id: string; box: Phaser.GameObjects.Rectangle; top: number }[] = [];
  private listScroll = 0;
  private listContentH = 0;
  private bodyScroll = 0;
  private bodyContentH = 0;
  /** Dolne krawędzie wierszy ciała — okno ucina się na CAŁYM wierszu. */
  private bodyEdges: number[] = [];
  /** Ciało z akcją albo bez — zależy od karty. */
  private bodyRect: Rect;

  private scrollPointerId: number | null = null;
  private scrollZone: Zone | null = null;
  private scrollStartY = 0;
  private scrollLastY = 0;
  /** ⚠ Gaśnie przy NASTĘPNYM wciśnięciu — wiersz pyta o nie na swoim UP,
   *  który Phaser podaje PRZED `POINTER_UP` sceny. */
  private moved = false;

  constructor(
    private readonly scene: Phaser.Scene,
    /**
     * Kontener, do którego widżet się dokłada — panel usługi albo STRONA panelu
     * gracza (zagnieżdżona w panelu). Przeliczenia idą przez jego macierz
     * świata, więc przesunięcie strony w panelu niczego nie psuje.
     */
    private readonly panel: Phaser.GameObjects.Container,
    private readonly L: ListDetailLayout,
    private readonly onSelect: (id: string) => void,
  ) {
    this.bodyRect = L.body;

    // Pionowa kreska: „to dwie rzeczy", nie jedna szeroka.
    panel.add(scene.add.rectangle(L.dividerX, L.list.y + L.list.h / 2, 1, L.list.h, 0xffffff, 0.18));

    this.listRoot = scene.add.container(0, 0);
    this.listMaskG = scene.make.graphics({}, false);
    this.listRoot.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.listMaskG));
    [this.listTrack, this.listThumb] = this.scrollBar(L.list.x + L.list.w - LIST_DETAIL.scrollW / 2);

    this.headerRoot = scene.add.container(0, 0);
    panel.add(
      scene.add
        .rectangle(L.detail.x, L.headerBottom + LIST_DETAIL.headerGap / 2, L.detail.w, 1, 0xffffff, 0.12)
        .setOrigin(0, 0.5),
    );

    this.bodyRoot = scene.add.container(0, 0);
    this.bodyMaskG = scene.make.graphics({}, false);
    this.bodyRoot.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.bodyMaskG));
    [this.bodyTrack, this.bodyThumb] = this.scrollBar(L.detail.x + L.detail.w - LIST_DETAIL.scrollW / 2);

    this.emptyText = scene.add
      .text(L.detail.x + L.detail.w / 2, L.body.y + 40, "", textStyle({ fontSize: fontPx("body"), color: UI.muted, align: "center", wordWrap: { width: L.detail.w - 40 } }))
      .setOrigin(0.5, 0);

    this.actionRoot = scene.add.container(0, 0);
    panel.add([this.listRoot, this.headerRoot, this.bodyRoot, this.emptyText, this.actionRoot]);

    // ⚠ Gest na poziomie SCENY, nie wiersza — palec wyjeżdża poza wiersz,
    //   na którym wystartował (`src/ui/CLAUDE.md`, „Panele").
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onScrollStart, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onScrollMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onScrollEnd, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onScrollEnd, this);
    // ⚠ `POINTER_WHEEL` na wtyczce SCENY — `GAMEOBJECT_WHEEL` na obiekcie po
    //   cichu nigdy nie odpala.
    scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onScrollStart, this);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onScrollMove, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onScrollEnd, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onScrollEnd, this);
      scene.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this);
      this.listMaskG.destroy();
      this.bodyMaskG.destroy();
    });
  }

  /* ══ LISTA ══════════════════════════════════════════════════════════════ */

  /**
   * Przebuduj listę. `keepScroll` = ta sama lista po zmianie stanu (zakup,
   * przyjęcie) — przewinięcie zostaje; nowy rozmówca zaczyna od góry.
   */
  setRows(rows: readonly ListRow[], selected: string | null, keepScroll = true): void {
    const L = this.L;
    const M = LIST_DETAIL;
    this.listRoot.removeAll(true);
    this.rowBoxes = [];
    if (!keepScroll) this.listScroll = 0;

    const w = L.list.w - M.scrollW - 6;
    rows.forEach((r, i) => {
      const top = i * (M.rowH + M.rowGap);
      const chosen = r.id === selected;
      const box = this.scene.add
        .rectangle(L.list.x, 0, w, M.rowH, UI.slotBg, chosen ? 1 : 0.55)
        .setOrigin(0, 0)
        .setStrokeStyle(2, chosen ? UI.goldNum : ROW_STROKE, chosen ? 1 : 0.9)
        .setInteractive({ useHandCursor: true });
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => p.event.stopPropagation());
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.moved) return;
        if (r.id !== selected) Sfx.play("ui-click");
        this.onSelect(r.id);
      });
      const parts: Phaser.GameObjects.GameObject[] = [box];
      if (r.icon) {
        parts.push(this.scene.add.image(L.list.x + M.markW / 2 + 4, M.rowH / 2, r.icon).setDisplaySize(36, 36));
      } else if (r.mark) {
        parts.push(
          this.scene.add
            .text(L.list.x + M.markW / 2, M.rowH / 2, r.mark, textStyle({ fontSize: fontPx("name"), color: r.markColor ?? UI.text, fontStyle: "bold" }))
            .setOrigin(0.5),
        );
      }
      const nameX = L.list.x + M.markW + (r.icon ? 12 : 0);
      const valueW = r.value ? 96 : 0;
      const nameW = w - M.markW - 12 - valueW;
      const name = this.scene.add
        .text(nameX, 0, this.fit(r.name, "name", nameW), textStyle({ fontSize: fontPx("name"), color: r.nameColor ?? UI.white }))
        .setOrigin(0, 0);
      parts.push(name);
      if (r.note) {
        const note = this.scene.add
          .text(nameX, 0, this.fit(r.note, "small", nameW), textStyle({ fontSize: fontPx("small"), color: r.noteColor ?? UI.muted }))
          .setOrigin(0, 0);
        const blok = name.height + 2 + note.height;
        name.y = (M.rowH - blok) / 2;
        note.y = name.y + name.height + 2;
        parts.push(note);
      } else {
        name.y = (M.rowH - name.height) / 2;
      }
      if (r.value) {
        parts.push(
          this.scene.add
            .text(L.list.x + w - 12, M.rowH / 2, r.value, textStyle({ fontSize: fontPx("body"), color: r.valueColor ?? UI.goldLight, fontStyle: "bold" }))
            .setOrigin(1, 0.5),
        );
      }
      // Wiersz jako jeden kontener: przewijanie przesuwa tylko jego `y`.
      const row = this.scene.add.container(0, top, parts);
      this.listRoot.add(row);
      this.rowBoxes.push({ id: r.id, box, top });
    });
    this.listContentH = rows.length > 0 ? rows.length * (M.rowH + M.rowGap) - M.rowGap : 0;
    // Wybrany wiersz musi być widoczny — wybór z zewnątrz (broń w ręku) potrafi
    // wskazać pozycję poza oknem.
    const sel = this.rowBoxes.find((b) => b.id === selected);
    if (sel && (sel.top < this.listScroll || sel.top + M.rowH > this.listScroll + L.list.h)) {
      this.listScroll = sel.top + M.rowH - L.list.h;
    }
    this.setListScroll(this.listScroll);
  }

  private setListScroll(v: number): void {
    const L = this.L;
    const max = Math.max(0, this.listContentH - L.list.h);
    this.listScroll = Math.max(0, Math.min(max, v));
    this.listRoot.y = L.list.y - this.listScroll;
    // ⚠ Maska przycina RYSOWANIE, nie WEJŚCIE: wiersz wyprowadzony poza okno
    //   dalej byłby trafialny — wejście ma tylko wiersz, którego środek widać.
    for (const b of this.rowBoxes) {
      const mid = b.top + LIST_DETAIL.rowH / 2 - this.listScroll;
      if (b.box.input) b.box.input.enabled = mid >= 0 && mid <= L.list.h;
    }
    this.paintBar(this.listTrack, this.listThumb, L.list, this.listContentH, this.listScroll);
  }

  /* ══ KARTA ══════════════════════════════════════════════════════════════ */

  /** Karta wybranej pozycji; `null` + napis = pusty stan („Nie mam teraz roboty"). */
  setCard(card: ListCard | null, emptyText = "", keepScroll = true): void {
    const L = this.L;
    const M = LIST_DETAIL;
    this.headerRoot.removeAll(true);
    this.bodyRoot.removeAll(true);
    this.actionRoot.removeAll(true);
    this.emptyText.setText(card ? "" : emptyText);
    if (!keepScroll) this.bodyScroll = 0;
    if (!card) {
      this.bodyContentH = 0;
      this.bodyEdges = [];
      this.bodyRect = L.bodyFull;
      this.setBodyScroll(0);
      return;
    }

    /* ── nagłówek: tytuł, dopisek stanu, sakiewka ── */
    let walletW = 0;
    if (card.wallet) walletW = this.buildWallet(card.wallet);
    const titleW = L.detail.w - walletW - (walletW > 0 ? 16 : 0);
    const title = this.scene.add
      .text(L.detail.x, L.detail.y, this.fit(card.title, "title", titleW, true), textStyle({ fontSize: fontPx("title"), color: card.titleColor ?? UI.gold, fontStyle: "bold" }))
      .setOrigin(0, 0);
    this.headerRoot.add(title);
    if (card.subtitle) {
      this.headerRoot.add(
        this.scene.add
          .text(L.detail.x, title.y + title.height + 4, this.fit(card.subtitle, "small", titleW), textStyle({ fontSize: fontPx("small"), color: card.subtitleColor ?? UI.muted }))
          .setOrigin(0, 0),
      );
    }

    /* ── pas akcji: odmowa nad przyciskiem, przycisk w prawym dolnym rogu ── */
    this.bodyRect = card.action || card.picker || card.refusal || card.hint ? L.body : L.bodyFull;
    if (card.action) this.buildAction(card.action);
    else if (card.picker) this.buildPicker(card.picker);
    const above = card.refusal ?? card.hint;
    if (above) {
      this.actionRoot.add(
        this.scene.add
          .text(L.detail.x + L.detail.w, L.refusalY, above, textStyle({ fontSize: fontPx("small"), color: card.refusal ? UI.danger : UI.muted, align: "right", wordWrap: { width: L.detail.w } }))
          .setOrigin(1, 1),
      );
    }

    /* ── ciało: sekcje ── */
    this.bodyEdges = [];
    const x = L.detail.x;
    const w = L.detail.w - M.scrollW - 14;
    let y = 0;
    card.sections.forEach((s, i) => {
      if (i > 0) y += 18;
      if (s.title) {
        const t = this.scene.add
          .text(x, y, s.title.toUpperCase(), textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR, fontStyle: "bold" }))
          .setOrigin(0, 0);
        this.bodyRoot.add(t);
        if (s.aside) {
          this.bodyRoot.add(
            this.scene.add
              .text(x + w, y, s.aside, textStyle({ fontSize: fontPx("small"), color: UI.muted }))
              .setOrigin(1, 0),
          );
        }
        y += t.height + 6;
      }
      for (const line of s.lines) {
        y = this.addLine(line, x, y, w);
        this.bodyEdges.push(y);
        y += 6;
      }
    });
    this.bodyContentH = Math.max(0, y - 6);
    this.setBodyScroll(this.bodyScroll);
  }

  /** Jeden wiersz ciała. Zwraca `y` pod nim. */
  private addLine(line: CardLine, x: number, y: number, w: number): number {
    const role = line.role ?? "body";
    const style = { fontSize: fontPx(role), color: line.color ?? UI.text, fontStyle: line.bold ? "bold" : undefined };
    let bottom: number;
    if (line.value !== undefined) {
      const v = this.scene.add
        .text(x + w, y, line.value, textStyle({ ...style, color: line.valueColor ?? UI.white, fontStyle: "bold" }))
        .setOrigin(1, 0);
      const t = this.scene.add
        .text(x, y, line.text, textStyle({ ...style, wordWrap: { width: Math.max(80, w - v.width - 16) } }))
        .setOrigin(0, 0);
      this.bodyRoot.add([t, v]);
      bottom = y + Math.max(t.height, v.height);
    } else {
      const t = this.scene.add.text(x, y, line.text, textStyle({ ...style, wordWrap: { width: w } })).setOrigin(0, 0);
      this.bodyRoot.add(t);
      bottom = y + t.height;
    }
    if (line.bar) {
      const by = bottom + 6;
      this.bodyRoot.add(this.scene.add.rectangle(x, by, w, 10, 0x222735, 1).setOrigin(0, 0).setStrokeStyle(1, ROW_STROKE, 0.8));
      const fill = Math.max(0, Math.min(1, line.bar.ratio)) * (w - 2);
      if (fill > 0) this.bodyRoot.add(this.scene.add.rectangle(x + 1, by + 1, fill, 8, line.bar.color ?? UI.goldNum, 1).setOrigin(0, 0));
      bottom = by + 10;
    }
    return bottom;
  }

  private setBodyScroll(v: number): void {
    const b = this.bodyRect;
    const max = Math.max(0, this.bodyContentH - b.h);
    this.bodyScroll = Math.max(0, Math.min(max, v));
    this.bodyRoot.y = b.y - this.bodyScroll;
    this.paintBar(this.bodyTrack, this.bodyThumb, b, this.bodyContentH, this.bodyScroll);
    this.refreshMasks();
  }

  /**
   * Sakiewka w prawym górnym rogu karty: złoto (i punkty rozwoju), a obok
   * wydatek przycisku „(−120)" w `UI.spend` — ta sama mowa co w sklepie.
   * Zwraca zajętą szerokość.
   */
  private buildWallet(wl: CardWallet): number {
    const L = this.L;
    const right = L.detail.x + L.detail.w;
    /** Jeden wiersz wyrównany do PRAWEJ: kwota, a za nią wydatek. Zwraca szerokość. */
    const row = (y: number, amount: string, spend: number | undefined, role: TypeRole): number => {
      let left = right;
      if (spend && spend > 0) {
        const d = this.scene.add.text(left, y, ` (−${formatAmount(spend)})`, textStyle({ fontSize: fontPx("small"), color: UI.spend, fontStyle: "bold" })).setOrigin(1, 0.5);
        this.headerRoot.add(d);
        left -= d.width;
      }
      const t = this.scene.add.text(left, y, amount, textStyle({ fontSize: fontPx(role), color: UI.goldLight, fontStyle: "bold" })).setOrigin(1, 0.5);
      this.headerRoot.add(t);
      return right - (left - t.width);
    };
    const y1 = L.detail.y + 14;
    let w = row(y1, formatAmount(wl.gold), wl.spendGold, "name");
    const coin = drawCoin(this.scene.add.graphics(), 22, "gold");
    coin.setPosition(right - w - 16, y1);
    this.headerRoot.add(coin);
    w += 30;
    if (wl.points !== undefined) {
      w = Math.max(w, row(y1 + 30, `${wl.points} pkt rozwoju`, wl.spendPoints, "small"));
    }
    return w;
  }

  private buildAction(a: CardAction): void {
    const L = this.L;
    const M = LIST_DETAIL;
    const label = this.scene.add
      .text(0, 0, a.label, textStyle({ fontSize: fontPx("body"), color: a.enabled ? UI.white : UI.muted, fontStyle: "bold" }))
      .setOrigin(0.5);
    const w = Math.min(L.detail.w, Math.max(M.actionMinW, label.width + 48));
    const cx = L.action.x + L.action.w - w / 2;
    const cy = L.action.y + M.actionH / 2;
    const box = this.scene.add
      .rectangle(0, 0, w, M.actionH, a.enabled ? 0x2c6e3f : 0x2a2f3a, 1)
      .setStrokeStyle(2, a.enabled ? 0x7ddf9a : 0x556074, 0.9)
      .setInteractive({ useHandCursor: a.enabled });
    const c = this.scene.add.container(cx, cy, [box, label]);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => p.event.stopPropagation());
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      // ⚠ Po sprawdzeniu `enabled`: wyszarzony przycisk milczy, inaczej
      //   dźwięk kliknięcia czyta się jak „zadziałało".
      if (!a.enabled) return;
      Sfx.play("ui-click");
      this.scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true, ease: "Quad.easeOut" });
      a.onClick();
    });
    this.actionRoot.add(c);
  }

  /**
   * Kafle wyboru miejsca, wyrównane do PRAWEJ krawędzi karty (tam, gdzie
   * w innych kartach stoi przycisk główny). Kafel ustępuje szerokości dopiero,
   * gdy rząd nie mieści się w karcie.
   */
  private buildPicker(pk: CardPicker): void {
    const L = this.L;
    const M = LIST_DETAIL;
    const n = pk.slots.length;
    const gap = 8;
    const size = Math.min(M.actionH, (L.detail.w - gap * (n - 1)) / n);
    const right = L.detail.x + L.detail.w;
    const cy = L.action.y + M.actionH / 2;
    pk.slots.forEach((sl, i) => {
      const cx = right - (n - i) * size - (n - 1 - i) * gap + size / 2;
      const box = this.scene.add
        .rectangle(0, 0, size, size, sl.active ? 0x3a3220 : UI.slotBg, 1)
        .setStrokeStyle(sl.active ? 3 : 2, sl.active ? UI.goldNum : ROW_STROKE, 1)
        .setInteractive({ useHandCursor: true });
      const parts: Phaser.GameObjects.GameObject[] = [box];
      if (sl.icon) parts.push(this.scene.add.image(0, -4, sl.icon).setDisplaySize(size * 0.55, size * 0.55).setAlpha(sl.active ? 1 : 0.55));
      parts.push(
        this.scene.add
          .text(sl.icon ? size / 2 - 6 : 0, sl.icon ? size / 2 - 4 : 0, sl.label, textStyle({ fontSize: fontPx(sl.icon ? "small" : "body"), color: sl.active ? UI.gold : UI.text, fontStyle: "bold" }))
          .setOrigin(sl.icon ? 1 : 0.5, sl.icon ? 1 : 0.5),
      );
      const c = this.scene.add.container(cx, cy, parts);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => p.event.stopPropagation());
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        Sfx.play("ui-click");
        this.scene.tweens.add({ targets: c, scale: 0.92, duration: 70, yoyo: true, ease: "Quad.easeOut" });
        sl.onPick();
      });
      this.actionRoot.add(c);
    });
  }

  /* ══ PRZEWIJANIE ═══════════════════════════════════════════════════════ */

  private scrollBar(x: number): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle] {
    const track = this.scene.add.rectangle(x, 0, LIST_DETAIL.scrollW, 10, 0xffffff, 0.08).setOrigin(0.5, 0).setVisible(false);
    const thumb = this.scene.add.rectangle(x, 0, LIST_DETAIL.scrollW, 10, UI.goldNum, 0.6).setOrigin(0.5, 0).setVisible(false);
    this.panel.add([track, thumb]);
    return [track, thumb];
  }

  private paintBar(track: Phaser.GameObjects.Rectangle, thumb: Phaser.GameObjects.Rectangle, r: Rect, contentH: number, scroll: number): void {
    const over = contentH > r.h + 0.5;
    track.setVisible(over);
    thumb.setVisible(over);
    if (!over) return;
    track.setPosition(track.x, r.y).setSize(LIST_DETAIL.scrollW, r.h);
    const h = Math.max(24, (r.h * r.h) / contentH);
    const y = r.y + ((r.h - h) * scroll) / (contentH - r.h);
    thumb.setPosition(thumb.x, y).setSize(LIST_DETAIL.scrollW, h);
  }

  /**
   * ⚠ Maska rysuje się we współrzędnych sceny UI i nie jedzie za panelem
   * sama — przerysowanie przy każdym `reposition()` panelu. ⛔ `uiScale()` tu
   * NIE wchodzi; wchodzi wyłącznie skala panelu.
   */
  refreshMasks(): void {
    const L = this.L;
    this.fillMask(this.listMaskG, { x: L.list.x - 2, y: L.list.y, w: L.list.w + 4, h: L.list.h });
    const b = this.bodyRect;
    // ⚠ Okno ciała ma CAŁKOWITĄ liczbę wierszy (reguła karty sklepu):
    //   przecięty u dołu wiersz czyta się jak błąd rysowania (render 1:1,
    //   Postać → Broń: pół „Niezgrabnie" pod paskiem przewijania).
    let h = b.h;
    if (this.bodyContentH > b.h) {
      const fits = this.bodyEdges.filter((e) => e - this.bodyScroll <= b.h + 0.5);
      if (fits.length > 0) h = fits[fits.length - 1] - this.bodyScroll + 3;
    }
    this.fillMask(this.bodyMaskG, { x: b.x - 2, y: b.y, w: b.w + 4, h });
  }

  /** Prostokąt w układzie kontenera → maska w układzie sceny UI (macierz
   *  świata kontenera: pozycja i skala panelu, i strony w panelu). */
  private fillMask(g: Phaser.GameObjects.Graphics, r: Rect): void {
    const m = this.panel.getWorldTransformMatrix();
    const a = m.transformPoint(r.x, r.y);
    const b = m.transformPoint(r.x + r.w, r.y + r.h);
    g.clear().fillStyle(0xffffff).fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }

  /** Czy widżet jest na ekranie — kontener I wszyscy jego rodzice. */
  private shown(): boolean {
    let c: Phaser.GameObjects.Container | null = this.panel;
    while (c) {
      if (!c.visible) return false;
      c = c.parentContainer;
    }
    return true;
  }

  /** ⚠⚠ Punkt EKRANU → kontener: `uiScale()`, potem odwrotność macierzy
   *  świata (pozycja i skala panelu — `src/ui/CLAUDE.md`). */
  private zoneAt(px: number, py: number): Zone | null {
    if (!this.shown()) return null;
    const pt = this.panel.getWorldTransformMatrix().applyInverse(px / uiScale(), py / uiScale());
    const x = pt.x;
    const y = pt.y;
    const inside = (r: Rect) => x >= r.x - 4 && x <= r.x + r.w + 4 && y >= r.y && y <= r.y + r.h;
    if (inside(this.L.list)) return "list";
    if (inside(this.bodyRect)) return "body";
    return null;
  }

  /** Skala kontenera na ekranie (ruch palca w px sceny → jednostki kontenera). */
  private worldScale(): number {
    return this.panel.getWorldTransformMatrix().scaleX;
  }

  private onScrollStart(p: Phaser.Input.Pointer): void {
    if (!this.shown() || this.scrollPointerId !== null) return;
    this.moved = false;
    const zone = this.zoneAt(p.x, p.y);
    if (!zone) return;
    this.scrollPointerId = p.id;
    this.scrollZone = zone;
    this.scrollLastY = this.scrollStartY = p.y;
  }

  private onScrollMove(p: Phaser.Input.Pointer): void {
    if (this.scrollPointerId !== p.id || !this.scrollZone) return;
    const k = uiScale() * this.worldScale();
    if (!this.moved && Math.abs(p.y - this.scrollStartY) / k > SLOP) this.moved = true;
    if (!this.moved) return;
    const dy = (p.y - this.scrollLastY) / k;
    this.scrollLastY = p.y;
    if (this.scrollZone === "list") this.setListScroll(this.listScroll - dy);
    else this.setBodyScroll(this.bodyScroll - dy);
  }

  private onScrollEnd(p: Phaser.Input.Pointer): void {
    if (this.scrollPointerId !== p.id) return;
    this.scrollPointerId = null;
    this.scrollZone = null;
  }

  private onWheel(p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void {
    const zone = this.zoneAt(p.x, p.y);
    if (zone === "list") this.setListScroll(this.listScroll + Math.sign(dy) * (LIST_DETAIL.rowH + LIST_DETAIL.rowGap));
    else if (zone === "body") this.setBodyScroll(this.bodyScroll + Math.sign(dy) * 40);
  }

  /* ══ POMOCNICZE ════════════════════════════════════════════════════════ */

  /**
   * Napis skrócony wielokropkiem do `maxW` — nazwa w wierszu listy i tytuł
   * karty mają JEDNĄ linię (wiersz ma stałą wysokość 68 j.). Pełna nazwa
   * zawsze stoi w karcie (tytuł karty zawija się dopiero, gdy nie ma miejsca).
   */
  private fit(text: string, role: TypeRole, maxW: number, bold = false): string {
    const probe = this.scene.add.text(0, 0, text, textStyle({ fontSize: fontPx(role), fontStyle: bold ? "bold" : undefined })).setVisible(false);
    let s = text;
    if (probe.width > maxW) {
      while (s.length > 1) {
        s = s.slice(0, -1);
        probe.setText(`${s.trimEnd()}…`);
        if (probe.width <= maxW) break;
      }
      s = `${s.trimEnd()}…`;
    }
    probe.destroy();
    return s;
  }
}

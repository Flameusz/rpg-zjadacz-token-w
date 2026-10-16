import Phaser from "phaser";
import { UI, fontPx, textStyle, TYPE } from "../core/theme";
import { Sfx } from "../core/Sfx";
import { iconFitScale } from "./IconFit";
import { COMPARE_EPS, toneHex, type CardCompare, type ItemCard } from "./ItemCard";
import type { ShopDetailsLayout } from "./ShopLayout";

/**
 * ── KOLUMNA SZCZEGÓŁÓW (karta przedmiotu) — sklep i panel gracza ──────────
 *
 * ⭐ **Kolumna zamiast dymka** (2026-09-19): stałe miejsce, które niczego nie
 * zasłania, sekcje z nagłówkami i **porównanie z akcją przyklejone do dołu** —
 * zawsze w tym samym miejscu pod kciukiem, niezależnie od długości opisu.
 *
 * ⭐⭐ **Etap E (2026-10-13): role tekstu i karta SZEROKA.** Krój z ról
 * `TYPE` (nazwa 21, tekst 18, drugi plan 15 — research §8 R1: tekst 11 j.
 * to ≈ 7 dp, mniej niż w każdej oglądanej grze). Karta ≥ `WIDE_CARD` j.
 * (sklep na telefonie) stawia ciało OBOK podglądu z tytułami sekcji w lewym
 * marginesie, porównania obu miejsc OBOK SIEBIE (D10) i jeden rząd akcji:
 * licznik po lewej, przycisk główny z ceną w prawym dolnym rogu. Wąska (panel
 * gracza na telefonie) układa to samo w pionie.
 *
 * ⚠ **Ten plik RYSUJE, nie liczy.** Co karta mówi o przedmiocie, decyduje
 * `ItemCard.buildItemCard`. ⛔ Nie sięgaj stąd do `ITEMS` ani do `Quality`.
 */

export type ShopActionTone = "primary" | "neutral" | "danger";

export interface ShopAction {
  readonly label: string;
  readonly tone?: ShopActionTone;
  /** Wyszarzony, ale WIDOCZNY — odmowa niesie informację, brak przycisku nie. */
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

/**
 * Jeden chip przełącznika warstw — jedyne miejsce, w którym warstwa pancerza
 * pojawia się jako WYBÓR (sylwetka pokazuje obszary ciała, nie warstwy).
 * ⛔ Etykieta to słowo („Spód / Środek / Wierzch"), nie kod `L1`/`L2`/`L3`.
 */
export interface ShopLayerChoice {
  readonly label: string;
  readonly active: boolean;
  readonly onPick: () => void;
}

/** Licznik `− n + Max` (ilość kupna/sprzedaży). */
export interface ShopQty {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (v: number) => void;
}

/**
 * Pusty stan kolumny — **wizytówka**, nie samo „dotknij czegoś". Pusty stan
 * to jedna trzecia czasu w tym panelu (otwarcie zaczyna się właśnie tutaj).
 * ⛔ Nie dokładaj tu niczego, co wymaga wyboru.
 */
export interface ShopEmptySummary {
  readonly title: string;
  readonly rows: readonly (readonly [string, string])[];
  readonly hint: string;
  /** Akcje wizytówki (sklep: „Napraw wszystko") — przyklejone do dołu. */
  readonly actions?: readonly ShopAction[];
}

export interface ShopDetailsView {
  readonly card: ItemCard;
  readonly iconKey: string;
  /**
   * „WARTOŚĆ U KUPCA" — czym jest liczba pod spodem. ⚠ W sklepie cena stoi NA
   * przycisku („Kup · 340 g"), więc sklep tego nie podaje; zostaje dla panelu
   * gracza, który nic nie sprzedaje, a cenę pokazuje.
   */
  readonly priceLabel?: string;
  readonly priceValue?: string;
  /** Jednozdaniowy powód, dla którego akcja jest niemożliwa — nad przyciskiem. */
  readonly refusal?: string;
  readonly qty?: ShopQty;
  /** Przełącznik warstw — tylko gdy obszar nosi więcej niż jedną sztukę. */
  readonly layers?: readonly ShopLayerChoice[];
  /** Ostatnia akcja = GŁÓWNA (prawy dolny róg w karcie szerokiej). */
  readonly actions: readonly ShopAction[];
}

const TONES: Record<ShopActionTone, { fill: number; stroke: number; text: string }> = {
  primary: { fill: 0x2c6e3f, stroke: 0x7ddf9a, text: UI.white },
  neutral: { fill: 0x2a2f3a, stroke: 0x556074, text: UI.white },
  danger: { fill: 0x3a1020, stroke: 0xff6666, text: UI.danger },
};

const SECTION_COLOR = "#7d889c";

/**
 * Wysokość rysunku przypadająca na JEDNO pole gabarytu (32 px).
 * ⚠ Skala podglądu liczy się z `PREVIEW_REF_H × liczba pól`, a nie z rozmiaru
 * rysunku — **osiemnaście tarcz `1×2` ma ikonę 32×32**. ⛔ Nie wracaj do
 * `img.width/height`: to ta sama pomyłka, co „gabaryt niesie ikona".
 */
const PREVIEW_REF_H = 32;

/**
 * Najmniejsze sensowne ciało karty. Poniżej zostaje pasek przewijania nad
 * jednym przyciętym wierszem — wtedy porównanie WRACA do przewijanego ciała.
 */
const MIN_BODY_H = 72;

/** Wysokość przycisku akcji — próg dotyku 68 j. w karcie szerokiej. */
const BTN_H_WIDE = 64;
const BTN_H_NARROW = 52;
/** Lewy margines ciała szerokiej karty — tytuły sekcji („WYMAGANIA" ≈ 92 j.). */
const GUTTER = 104;

export class ShopDetails {
  /** Wszystko, co stoi na stałe (ramka, puste tło, pas akcji). */
  private readonly root: Phaser.GameObjects.Container;
  /** Przewijane ciało karty — własny kontener, bo jeździ w pionie. */
  private readonly body: Phaser.GameObjects.Container;
  private readonly maskG: Phaser.GameObjects.Graphics;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly previewBox: Phaser.GameObjects.Rectangle;
  private readonly previewIcon: Phaser.GameObjects.Image;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly typeText: Phaser.GameObjects.Text;
  private readonly ownedText: Phaser.GameObjects.Text;
  /** Wizytówka — widoczna, dopóki nic nie jest wybrane. */
  private readonly emptyBox: Phaser.GameObjects.Container;
  /**
   * ⭐⭐ **PORÓWNANIE STOI POZA PRZEWIJANIEM**, tuż nad akcją. Przewija się
   * opis i statystyki; **porównanie i cena są zawsze na ekranie**.
   * ⛔ Nie wkładaj go z powrotem do `body` (poza zapasowym wyjściem — `MIN_BODY_H`).
   */
  private readonly compareBox: Phaser.GameObjects.Container;
  private readonly separator: Phaser.GameObjects.Rectangle;
  private bodyObjs: Phaser.GameObjects.GameObject[] = [];
  /**
   * Dolne krawędzie kolejnych wierszy karty — po to, żeby maska nie tnęła
   * wiersza W POŁOWIE (przecięty wiersz czyta się jak błąd rysowania).
   */
  private rowEdges: number[] = [];
  /** Pas akcji: przyciski, licznik, cena, odmowa — przebudowywany przy każdej karcie. */
  private actionObjs: Phaser.GameObjects.GameObject[] = [];
  private scrollBar!: Phaser.GameObjects.Rectangle;
  private scroll = 0;
  private contentH = 0;
  private filled = false;
  private lastSummary?: ShopEmptySummary;
  /** Wysokość ciała jest ZMIENNA, bo porównanie i pas akcji są zmienne. */
  private bodyH: number;
  /** Górna krawędź ciała — liczona z treści tytułu (nazwa bywa dwuwierszowa). */
  private bodyTop: number;
  /**
   * ⭐ **Wąska karta, dwa miejsca (D10): JEDEN blok naraz + przełącznik
   * „Zestaw I | Zestaw II".** Dwa bloki jeden pod drugim (~250 j.) wypychały
   * porównanie do przewijanego ciała — czyli najważniejsza informacja przed
   * zakupem wymagała przewinięcia. Wybór trwa, dopóki karta opisuje tę samą
   * rzecz (licznik ilości przerysowuje kartę i nie może go gubić).
   */
  private compareIdx = 0;
  private compareKey = "";
  private lastView: ShopDetailsView | null = null;
  /** Ostatnie współrzędne panelu — maska przerysowuje się przy każdej karcie. */
  private mx = 0;
  private my = 0;
  private ms = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    private L: ShopDetailsLayout,
  ) {
    this.root = scene.add.container(0, 0);
    parent.add(this.root);
    this.bodyH = L.body.h;
    this.bodyTop = L.body.y;

    const l = this.L;
    this.frame = scene.add
      .rectangle(l.left + l.width / 2, l.top + l.height / 2, l.width, l.height, UI.slotBg, 0.55)
      .setStrokeStyle(1, 0x3a4058, 0.9);
    this.root.add(this.frame);

    this.previewBox = scene.add
      .rectangle(l.preview.x + l.preview.w / 2, l.preview.y + l.preview.h / 2, l.preview.w, l.preview.h, 0x11131c, 1)
      .setStrokeStyle(2, 0x3a4058, 1);
    this.previewIcon = scene.add.image(this.previewBox.x, this.previewBox.y, "").setVisible(false);
    this.root.add([this.previewBox, this.previewIcon]);

    this.nameText = scene.add
      .text(l.title.x, l.title.y, "", textStyle({
        fontSize: fontPx("name"),
        color: UI.gold,
        fontStyle: "bold",
        wordWrap: { width: l.title.w - (l.wide ? 90 : 0) },
      }))
      .setOrigin(0, 0);
    this.typeText = scene.add
      .text(l.title.x, 0, "", textStyle({ fontSize: fontPx("small"), color: UI.muted, wordWrap: { width: l.title.w } }))
      .setOrigin(0, 0);
    this.ownedText = scene.add
      .text(l.left + l.width - l.pad, l.title.y + 4, "", textStyle({ fontSize: fontPx("small"), color: UI.muted }))
      .setOrigin(1, 0);
    this.root.add([this.nameText, this.typeText, this.ownedText]);

    this.emptyBox = scene.add.container(0, 0);
    this.root.add(this.emptyBox);

    this.body = scene.add.container(0, 0);
    this.root.add(this.body);
    this.compareBox = scene.add.container(0, 0);
    this.root.add(this.compareBox);
    this.maskG = scene.make.graphics({}, false);
    this.body.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.maskG));

    this.scrollBar = scene.add
      .rectangle(l.body.x + l.body.w - 1, l.body.y, 3, 40, UI.goldNum, 0.6)
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.root.add(this.scrollBar);

    this.separator = scene.add
      .rectangle(l.left + l.width / 2, l.action.y - 4, l.width - 2 * l.pad, 1, 0xffffff, 0.12)
      .setVisible(false);
    this.root.add(this.separator);

    this.clear();
  }

  /** Prostokąt przewijanego ciała — panel pyta o niego przy gestach. */
  get bodyRect(): { x: number; y: number; w: number; h: number } {
    return { ...this.L.body, y: this.bodyTop, h: this.bodyH };
  }

  get scrollable(): boolean {
    return this.maxScroll > 0;
  }

  get hasCard(): boolean {
    return this.filled;
  }

  /**
   * Prawa krawędź wartości wyrównanych do prawej. ⚠ **Zostawia PAS NA SUWAK** —
   * ostatni znak („52%") wchodził pod pasek przewijania i czytał się jak ucięty.
   */
  private get valueX(): number {
    return this.L.body.x + this.L.body.w - 10;
  }

  private get maxScroll(): number {
    return Math.max(0, this.contentH - this.bodyH);
  }

  /** Przesuń treść karty (gest palcem / kółko myszy). */
  scrollBy(dy: number): void {
    this.setScroll(this.scroll + dy);
  }

  private setScroll(v: number): void {
    this.scroll = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.body.y = -this.scroll;
    const max = this.maxScroll;
    this.scrollBar.setVisible(max > 0);
    if (max > 0) {
      const h = Math.max(20, (this.bodyH / this.contentH) * this.bodyH);
      this.scrollBar.height = h;
      this.scrollBar.y = this.bodyTop + (this.scroll / max) * (this.bodyH - h);
    }
  }

  /**
   * Odśwież maskę ciała we WSPÓŁRZĘDNYCH EKRANU. ⚠ `Graphics` maski nie jedzie
   * za panelem sam, a przy `PanelBase.fitScale` ≠ 1 trzeba mnożyć przez skalę
   * kontenera (reguła z `src/ui/CLAUDE.md`). `ox/oy` = przesunięcie strony
   * wewnątrz panelu (panel gracza trzyma kartę w kontenerze strony).
   */
  refreshMask(containerX: number, containerY: number, scale: number): void {
    this.mx = containerX;
    this.my = containerY;
    this.ms = scale;
    const b = this.L.body;
    this.maskG
      .clear()
      .fillStyle(0xffffff)
      .fillRect(containerX + (b.x - 2) * scale, containerY + this.bodyTop * scale, (b.w + 6) * scale, this.bodyH * scale);
  }

  /** Zgaś kartę — kolumna wraca do stanu „nic nie wybrano". */
  clear(summary?: ShopEmptySummary): void {
    this.filled = false;
    this.wipeBody();
    this.wipeActions();
    this.previewBox.setVisible(false);
    this.previewIcon.setVisible(false);
    this.nameText.setVisible(false);
    this.typeText.setVisible(false);
    this.ownedText.setVisible(false);
    this.separator.setVisible(false);
    this.scrollBar.setVisible(false);
    this.compareBox.removeAll(true);
    this.lastView = null;
    this.paintEmpty(summary ?? this.lastSummary);
  }

  /**
   * Wizytówka w pustej kolumnie. ⚠ Trzymana w polu, bo `clear()` bywa wołane
   * z miejsc, które o kupcu nic nie wiedzą (np. po sprzedaży).
   */
  private paintEmpty(summary?: ShopEmptySummary): void {
    this.lastSummary = summary;
    this.emptyBox.removeAll(true);
    this.emptyBox.setVisible(true);
    const l = this.L;
    const x = l.left + l.pad + 4;
    const w = l.width - 2 * l.pad - 8;
    let y = l.top + l.pad + 6;

    if (summary) {
      const t = this.scene.add
        .text(x, y, summary.title, textStyle({ fontSize: fontPx("title"), color: UI.gold, fontStyle: "bold", wordWrap: { width: w } }))
        .setOrigin(0, 0);
      this.emptyBox.add(t);
      y += t.height + 10;
      this.emptyBox.add(this.scene.add.rectangle(x, y, w, 1, 0xffffff, 0.08).setOrigin(0, 0.5));
      y += 12;
      for (const [etykieta, wartosc] of summary.rows) {
        const e = this.scene.add.text(x, y, etykieta, textStyle({ fontSize: fontPx("body"), color: UI.muted })).setOrigin(0, 0);
        const v = this.scene.add
          .text(x + w, y, wartosc, textStyle({ fontSize: fontPx("body"), color: UI.text }))
          .setOrigin(1, 0);
        this.emptyBox.add([e, v]);
        // ⚠ Długa wartość („ruch −7% · wydolność −10%") przy kroju 18 j. wchodziła
        //   na etykietę — schodzi wtedy do drugiej linii, wyrównana do prawej.
        if (e.width + v.width + 16 > w) {
          v.setY(y + e.height + 1);
          y += e.height + 1;
        }
        y += Math.max(e.height, v.height) + 6;
      }
      y += 10;
    }
    this.emptyBox.add(
      this.scene.add
        .text(x, y, summary?.hint ?? "Dotknij przedmiotu, żeby zobaczyć szczegóły i cenę.",
          textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR, wordWrap: { width: w } }))
        .setOrigin(0, 0),
    );
    // Akcje wizytówki — od dołu, jak pas akcji karty (to samo miejsce pod kciukiem).
    const akcje = summary?.actions ?? [];
    let dol = l.top + l.height - l.pad;
    for (let i = akcje.length - 1; i >= 0; i--) {
      const h = l.wide ? BTN_H_WIDE : BTN_H_NARROW;
      this.makeButton(akcje[i], l.left + l.pad, dol - h, l.width - 2 * l.pad, h);
      dol -= h + 8;
    }
  }

  /** Narysuj kartę przedmiotu razem z porównaniem, ceną i akcjami. */
  show(view: ShopDetailsView): void {
    const l = this.L;
    // Wybór bloku porównania trwa dla TEJ SAMEJ rzeczy (patrz `compareIdx`).
    const klucz = `${view.card.itemId}|${view.card.quality}|${view.iconKey}`;
    if (klucz !== this.compareKey) {
      this.compareKey = klucz;
      this.compareIdx = 0;
    }
    this.lastView = view;
    this.filled = true;
    this.emptyBox.setVisible(false);
    this.wipeBody();
    this.wipeActions();

    /* ── podgląd ──────────────────────────────────────────────────────── */
    // ⭐⭐ **RAMKA PODGLĄDU MA KSZTAŁT GABARYTU**, a skala jest WSPÓLNA: rzecz
    //   `1×1` dostaje kwadrat, `1×2` ramkę dwa razy wyższą, rysunek w obu tę
    //   samą skalę (`D4`/`D5` w `tools/sklep_uklad.mjs`).
    const pola = Math.max(1, Math.round(view.card.footprint.h));
    const podgladH = pola > 1 ? l.preview.h : Math.min(l.preview.h, l.preview.w);
    this.previewBox
      .setSize(l.preview.w, podgladH)
      .setPosition(l.preview.x + l.preview.w / 2, l.preview.y + podgladH / 2)
      .setVisible(true);
    this.previewIcon
      .setPosition(this.previewBox.x, this.previewBox.y)
      .setTexture(view.iconKey)
      .setScale(iconFitScale(32, PREVIEW_REF_H * pola, l.preview.w - 12, podgladH - 12, 4))
      .setVisible(true);

    /* ── nazwa, typ · jakość, „masz" ──────────────────────────────────── */
    const c = view.card;
    this.nameText.setText(c.name).setPosition(l.title.x, l.title.y).setVisible(true);
    let y = l.title.y + this.nameText.height + 2;
    // ⭐ Typ i jakość w JEDNYM wierszu (jak w dymku od 2026-10-12): jakość
    //   ma kolor, a jeden wiersz mniej to jeden wiersz statystyk więcej.
    this.typeText
      .setText(c.quality ? `${c.typeLine} · ${c.quality}` : c.typeLine)
      .setColor(c.quality ? c.qualityColor : UI.muted)
      .setPosition(l.title.x, y)
      .setVisible(true);
    y += this.typeText.height;
    if (c.owned > 0) this.ownedText.setText(`masz: ${c.owned}`).setVisible(true);
    else this.ownedText.setVisible(false);

    // ⭐ Warstwy obszaru (rzecz NA SOBIE, obszar z więcej niż jedną sztuką):
    //   chipy pod nazwą — nawigacja, nie treść, więc nie odjeżdżają z ciałem.
    if (view.layers && view.layers.length > 1) {
      y += 8;
      this.paintLayers(view.layers, l.title.x, y, l.title.w, 40);
      y += 40;
    }

    // Ciało: OBOK podglądu (pod nazwą), gdy pas obok ma miejsce na etykietę
    // z wartością (`beside`); inaczej pod podglądem.
    const trescTop = l.beside ? y + 10 : Math.max(y + 8, l.preview.y + podgladH + 8);

    /* ── pas akcji: rysowany PIERWSZY, bo wyznacza dół wszystkiego nad nim ── */
    const akcjaY = l.wide ? this.paintActionsWide(view) : this.paintActionsNarrow(view);

    /* ── porównanie: przypięte nad akcją ──────────────────────────────── */
    this.compareBox.removeAll(true);
    this.compareBox.setPosition(0, 0);
    this.bodyTop = trescTop;
    let poroMin = akcjaY - 10;
    let poroWCiele = false;
    if (c.compares.length) {
      const h = this.paintCompares(c.compares, 0, this.compareBox, l.left + l.pad, l.width - 2 * l.pad, true);
      const gdzie = akcjaY - 10 - h;
      if (gdzie - this.bodyTop - 8 >= MIN_BODY_H) {
        poroMin = gdzie;
        this.compareBox.setY(poroMin);
      } else {
        // ⚠⚠ Zapasowe wyjście: przypięte porównanie nie zostawia ciału miejsca
        //   (rzecz `1×2` w wąskiej karcie z dwoma przyciskami) — wraca do
        //   przewijania zamiast paska nad jednym przyciętym wierszem.
        this.compareBox.removeAll(true);
        poroWCiele = true;
      }
    }

    this.bodyH = Math.max(MIN_BODY_H, poroMin - this.bodyTop - 8);
    this.refreshMask(this.mx, this.my, this.ms);
    this.paintBody(c, poroWCiele);
    this.separator.setPosition(l.left + l.width / 2, akcjaY - 6).setVisible(true);
  }

  /* ── ciało karty ──────────────────────────────────────────────────── */

  private paintBody(card: ItemCard, poroWCiele: boolean): void {
    const b = this.L.body;
    const wide = this.L.wide;
    let y = this.bodyTop;

    // ⭐⭐ **„Nie założysz tego" stoi NA GÓRZE karty, nie w WYMAGANIACH** — to
    //   jest pytanie zadawane PRZED zakupem, a sekcja wymagań bywa poza
    //   widocznym ciałem.
    if (!card.requirementsMet) {
      y = this.addWrapped("⚠ Nie spełniasz wymagań — nie założysz tego.", b.x, y, b.w - 10, "small", "#ff9d3b") + 4;
      this.rowEdges.push(y);
    }
    if (card.description) {
      y = this.addWrapped(card.description, b.x, y, b.w - 10, "small", UI.text) + 8;
      this.rowEdges.push(y);
    }

    const labelX = wide ? b.x + GUTTER : b.x + 2;
    for (let si = 0; si < card.sections.length; si++) {
      if (poroWCiele && si === 1 && card.compares.length) {
        y += this.paintCompares(card.compares, y, this.body, b.x, b.w - 10) + 6;
        this.rowEdges.push(y);
      }
      const s = card.sections[si];
      // ⭐ Szeroka karta: tytuł sekcji w LEWYM MARGINESIE, na wysokości
      //   pierwszego wiersza — tabela zamiast nagłówka nad każdą sekcją
      //   (trzy wiersze ciała więcej przy tej samej wysokości).
      if (wide) {
        this.add(
          this.scene.add
            .text(b.x, y + 3, s.title, textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR, wordWrap: { width: GUTTER - 8 } }))
            .setOrigin(0, 0),
        );
      } else {
        y = this.addSectionTitle(s.title, b.x, y, b.w - 10);
      }
      for (const st of s.stats) {
        const label = this.add(
          this.scene.add.text(labelX, y, st.label, textStyle({ fontSize: fontPx("body"), color: UI.muted })).setOrigin(0, 0),
        );
        this.add(
          this.scene.add
            .text(this.valueX, y, st.value, textStyle({ fontSize: fontPx("body"), color: toneHex(st.tone) }))
            .setOrigin(1, 0),
        );
        y += label.height + 3;
        this.rowEdges.push(y);
      }
      for (const note of s.notes) {
        y = this.addWrapped(note.text, labelX, y, this.valueX - labelX, "small", toneHex(note.tone)) + 2;
        this.rowEdges.push(y);
      }
      y += wide ? 8 : 6;
      this.rowEdges.push(y);
    }

    this.contentH = y - this.bodyTop;
    // ⭐ Docisk do PEŁNEGO wiersza: gdy treść nie mieści się w całości, okno
    //   kończy się na ostatniej krawędzi wiersza, która się mieści.
    if (this.contentH > this.bodyH) {
      const pelne = this.rowEdges.filter((e) => e - this.bodyTop <= this.bodyH);
      const nowa = pelne.length ? pelne[pelne.length - 1] - this.bodyTop : 0;
      if (nowa >= MIN_BODY_H) {
        this.bodyH = nowa;
        this.refreshMask(this.mx, this.my, this.ms);
      }
    }
    this.setScroll(0);
  }

  /**
   * ⭐⭐ **PORÓWNANIE: `nowe → noszone`, blok na każde miejsce (D10).**
   *
   * ⚠⚠ Tabela trzech kolumn była błędem układu (2026-09-19): trzy ruchy oka na
   * jedną liczbę. Strzałka mówi kierunek sama, a kolor pada wyłącznie na
   * wartość NOWĄ — i znaczy **KORZYŚĆ, nie kierunek liczby** (cięższe jest
   * czerwone, choć liczba rośnie; znak przychodzi z modelu). ⛔ Nie koloruj
   * tutaj po `mine > theirs`.
   *
   * ⭐ Dwa miejsca (zestaw I i II, pierścień I i II) stoją OBOK SIEBIE, gdy
   * karta jest szeroka — wtedy jedna kolumna nie zjada ciału wysokości dwa
   * razy. W wąskiej — jeden pod drugim.
   *
   * @returns wysokość narysowanego porównania
   */
  private paintCompares(
    compares: readonly CardCompare[],
    yStart: number,
    sink: Phaser.GameObjects.Container,
    x: number,
    w: number,
    przypiete = false,
  ): number {
    // ⭐ Wąska karta + dwa miejsca + porównanie przypięte: przełącznik i JEDEN
    //   blok (patrz `compareIdx`). W przewijanym ciele (zapasowe wyjście)
    //   bloki stoją jeden pod drugim — tam wysokość nie gra roli.
    if (!this.L.wide && compares.length > 1 && przypiete) {
      const idx = Math.min(this.compareIdx, compares.length - 1);
      const chipH = 40;
      this.paintCompareChips(compares, idx, x, yStart, w, chipH, sink);
      return chipH + 6 + this.paintCompareBlock(compares[idx], x, yStart + chipH + 6, w, sink);
    }
    const obok = this.L.wide && compares.length > 1;
    const gap = 14;
    const kolW = obok ? (w - gap * (compares.length - 1)) / compares.length : w;
    let najnizej = 0;
    let y = yStart;
    for (let i = 0; i < compares.length; i++) {
      const kx = obok ? x + i * (kolW + gap) : x;
      const ky = obok ? yStart : y;
      const h = this.paintCompareBlock(compares[i], kx, ky, kolW, sink);
      najnizej = Math.max(najnizej, h);
      if (!obok) y += h + 8;
    }
    return obok ? najnizej : y - yStart - 8;
  }

  private paintCompareBlock(
    compare: CardCompare,
    x: number,
    top: number,
    w: number,
    sink: Phaser.GameObjects.Container,
  ): number {
    const doKontenera = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      sink.add(o);
      if (sink === this.body) this.bodyObjs.push(o);
      return o;
    };
    // ⚠ W przewijanym ciele (zapasowe wyjście) blok NIE jest jednym wierszem:
    //   bez krawędzi wierszy w środku okno ucinało się PRZED całym blokiem
    //   i zostawiało nad pasem akcji dziurę na pół karty (render 2026-10-13).
    const krawedz = (yy: number) => {
      if (sink === this.body) this.rowEdges.push(yy);
    };
    const prawa = x + w - 8;
    let y = top + 6;
    // Nagłówek: GDZIE (zestaw / palec) i CO tam leży — albo „wolne".
    const gdzie = compare.target ? compare.target.toUpperCase() : "ZAMIAST NOSZONEGO";
    const naglowek = doKontenera(
      this.scene.add
        .text(x + 8, y, gdzie, textStyle({ fontSize: fontPx("small"), color: UI.gold, fontStyle: "bold" }))
        .setOrigin(0, 0),
    );
    y += naglowek.height + 1;
    const podpis = compare.wornName ? `${compare.wornName} · ${compare.wornQuality}` : "wolne — bez zamiany";
    const pod = doKontenera(
      this.scene.add
        .text(x + 8, y, podpis, textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR, wordWrap: { width: w - 16 } }))
        .setOrigin(0, 0),
    );
    y += pod.height + 4;
    krawedz(y);

    for (const r of compare.rows) {
      const lepsze = r.delta > COMPARE_EPS;
      const gorsze = r.delta < -COMPARE_EPS;
      const kolor = lepsze ? "#7ddf9a" : gorsze ? "#ff6b6b" : UI.text;
      const lbl = doKontenera(
        this.scene.add.text(x + 8, y, r.label, textStyle({ fontSize: fontPx("small"), color: UI.muted })).setOrigin(0, 0),
      );
      // Składane OD PRAWEJ: noszone → strzałka → nowe — kolumna liczb ma równą
      // prawą krawędź niezależnie od długości napisów (krój proporcjonalny).
      const stare = doKontenera(
        this.scene.add.text(prawa, y, r.theirs, textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR })).setOrigin(1, 0),
      );
      const strzalka = doKontenera(
        this.scene.add
          .text(prawa - stare.width - 6, y, "→", textStyle({ fontSize: fontPx("small"), color: UI.muted }))
          .setOrigin(1, 0),
      );
      const nowe = doKontenera(
        this.scene.add
          .text(strzalka.x - strzalka.width - 6, y - 2, r.mine, textStyle({ fontSize: fontPx("body"), color: kolor, fontStyle: "bold" }))
          .setOrigin(1, 0),
      );
      y += Math.max(lbl.height, nowe.height - 2) + 3;
      krawedz(y);
    }
    y += 6;
    // Tło pod całym blokiem — dodawane NA KOŃCU i posyłane pod spód, bo
    // wysokość znamy dopiero po wierszach.
    const tlo = doKontenera(this.scene.add.rectangle(x, top, w, y - top, 0x1b2130, 0.75).setOrigin(0, 0));
    sink.sendToBack(tlo);
    return y - top;
  }

  /** Chipy „Zestaw I | Zestaw II" nad blokiem porównania (karta wąska). */
  private paintCompareChips(
    compares: readonly CardCompare[],
    active: number,
    x: number,
    y: number,
    w: number,
    h: number,
    sink: Phaser.GameObjects.Container,
  ): void {
    const gap = 6;
    const cw = (w - gap * (compares.length - 1)) / compares.length;
    compares.forEach((c, i) => {
      const on = i === active;
      const cx = x + i * (cw + gap);
      const box = this.scene.add
        .rectangle(cx + cw / 2, y + h / 2, cw, h, on ? 0x2a3550 : 0x1c2030, 1)
        .setStrokeStyle(on ? 2 : 1, on ? UI.goldNum : 0x3a4058, 1)
        .setInteractive({ useHandCursor: true });
      const t = this.scene.add
        .text(box.x, box.y, c.target || `${i + 1}`, textStyle({ fontSize: fontPx("small"), color: on ? UI.gold : UI.muted, fontStyle: "bold" }))
        .setOrigin(0.5);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (on || !this.lastView) return;
        Sfx.play("ui-click");
        this.compareIdx = i;
        this.show(this.lastView);
      });
      sink.add([box, t]);
    });
  }

  /** Rząd chipów warstw („Spód / Środek / Wierzch") pod nazwą przedmiotu. */
  private paintLayers(layers: readonly ShopLayerChoice[], x: number, y: number, w: number, h: number): void {
    const gap = 6;
    const cw = (w - (layers.length - 1) * gap) / layers.length;
    layers.forEach((c, i) => {
      const cx = x + i * (cw + gap);
      const box = this.addAction(
        this.scene.add
          .rectangle(cx + cw / 2, y + h / 2, cw, h, c.active ? 0x2a3550 : 0x1c2030, 1)
          .setStrokeStyle(c.active ? 2 : 1, c.active ? UI.goldNum : 0x3a4058, c.active ? 0.9 : 0.7)
          .setInteractive({ useHandCursor: true }),
      );
      this.addAction(
        this.scene.add
          .text(box.x, box.y, c.label, textStyle({ fontSize: fontPx("small"), color: c.active ? UI.gold : UI.muted, fontStyle: "bold" }))
          .setOrigin(0.5),
      );
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (c.active) return;
        Sfx.play("ui-click");
        c.onPick();
      });
    });
  }

  /** Nagłówek sekcji (karta wąska): podpis + cienka kreska do prawej krawędzi. */
  private addSectionTitle(title: string, x: number, y: number, w: number): number {
    const t = this.add(this.scene.add.text(x, y, title, textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR })).setOrigin(0, 0));
    const lineX = x + t.width + 6;
    this.add(
      this.scene.add.rectangle(lineX, y + t.height / 2, Math.max(0, x + w - lineX), 1, 0xffffff, 0.08).setOrigin(0, 0.5),
    );
    return y + t.height + 2;
  }

  private addWrapped(text: string, x: number, y: number, w: number, role: "small" | "body", color: string): number {
    const t = this.add(
      this.scene.add.text(x, y, text, textStyle({ fontSize: fontPx(role), color, wordWrap: { width: w } })).setOrigin(0, 0),
    );
    return y + t.height + 2;
  }

  private add<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.body.add(obj);
    this.bodyObjs.push(obj);
    return obj;
  }

  private wipeBody(): void {
    for (const o of this.bodyObjs) o.destroy();
    this.bodyObjs = [];
    this.rowEdges = [];
    this.contentH = 0;
    this.scroll = 0;
    this.body.y = 0;
    this.scrollBar.setVisible(false);
  }

  /* ── pas akcji ────────────────────────────────────────────────────── */

  private wipeActions(): void {
    for (const o of this.actionObjs) o.destroy();
    this.actionObjs = [];
  }

  private addAction<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.root.add(o);
    this.actionObjs.push(o);
    return o;
  }

  /**
   * ⭐ **Karta szeroka: JEDEN rząd na dole** — licznik po lewej, akcje od
   * prawej, GŁÓWNA (ostatnia) w prawym dolnym rogu, pod kciukiem i przy szynie
   * (research §2: główny przycisk w prawym dolnym rogu w każdej oglądanej
   * grze). Odmowa stoi NAD przyciskiem, cena — NA nim (sklep).
   *
   * @returns górna krawędź pasa (razem z wierszem odmowy / ceny)
   */
  private paintActionsWide(view: ShopDetailsView): number {
    const l = this.L;
    const prawa = l.left + l.width - l.pad;
    const dol = l.top + l.height - l.pad;
    const h = BTN_H_WIDE;
    const y = dol - h;
    let x = prawa;
    // Od prawej: główna (ostatnia na liście) przy krawędzi, reszta na lewo.
    for (let i = view.actions.length - 1; i >= 0; i--) {
      const a = view.actions[i];
      const w = this.buttonWidth(a.label, i === view.actions.length - 1 ? 200 : 150);
      this.makeButton(a, x - w, y, w, h);
      x -= w + 10;
    }
    if (view.qty) this.paintQty(view.qty, l.left + l.pad, y, h);
    else if (view.priceLabel && view.priceValue) {
      // Panel gracza na szerokim ekranie: „WARTOŚĆ U KUPCA 40 g" po lewej.
      const lbl = this.addAction(
        this.scene.add.text(l.left + l.pad, y + h / 2, view.priceLabel, textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR })).setOrigin(0, 0.5),
      );
      this.addAction(
        this.scene.add
          .text(lbl.x + lbl.width + 12, y + h / 2, view.priceValue, textStyle({ fontSize: fontPx("title"), color: UI.goldLight, fontStyle: "bold" }))
          .setOrigin(0, 0.5),
      );
    }
    let gora = y;
    if (view.refusal) {
      const t = this.addAction(
        this.scene.add
          .text(prawa, y - 6, view.refusal, textStyle({ fontSize: fontPx("small"), color: UI.danger, wordWrap: { width: l.width - 2 * l.pad } }))
          .setOrigin(1, 1)
          .setAlign("right"),
      );
      gora = y - 6 - t.height;
    }
    return gora;
  }

  /**
   * Karta wąska (panel gracza na telefonie): cena, licznik, odmowa i przyciski
   * jeden pod drugim, przyklejone do dołu.
   */
  private paintActionsNarrow(view: ShopDetailsView): number {
    const l = this.L;
    const n = view.actions.length;
    const btnH = BTN_H_NARROW;
    const cenaH = view.priceLabel || view.priceValue ? 30 : 0;
    const qtyH = view.qty ? 52 : 0;
    const odmowa = view.refusal
      ? this.addAction(
          this.scene.add
            .text(l.action.x, 0, view.refusal, textStyle({ fontSize: fontPx("small"), color: UI.danger, wordWrap: { width: l.action.w } }))
            .setOrigin(0, 0),
        )
      : null;
    const odmowaH = odmowa ? odmowa.height + 6 : 0;
    const przyciskiH = n > 0 ? n * btnH + (n - 1) * 8 : 0;
    const top = l.top + l.height - l.pad - (cenaH + qtyH + odmowaH + przyciskiH);
    let y = top;
    if (cenaH) {
      this.addAction(
        this.scene.add.text(l.action.x, y + 4, view.priceLabel ?? "", textStyle({ fontSize: fontPx("small"), color: SECTION_COLOR })).setOrigin(0, 0),
      );
      this.addAction(
        this.scene.add
          .text(l.action.x + l.action.w, y, view.priceValue ?? "", textStyle({ fontSize: fontPx("name"), color: UI.goldLight, fontStyle: "bold" }))
          .setOrigin(1, 0),
      );
      y += cenaH;
    }
    if (view.qty) {
      this.paintQty(view.qty, l.action.x, y, 44, l.action.w);
      y += qtyH;
    }
    if (odmowa) {
      odmowa.setY(y);
      y += odmowaH;
    }
    for (let i = 0; i < n; i++) this.makeButton(view.actions[i], l.action.x, y + i * (btnH + 8), l.action.w, btnH);
    return top;
  }

  /** Szerokość przycisku z napisu — nie mniej niż `min`, nie więcej niż pół karty. */
  private buttonWidth(label: string, min: number): number {
    const probe = this.scene.add.text(0, 0, label, textStyle({ fontSize: fontPx("body"), fontStyle: "bold" })).setVisible(false);
    const w = probe.width;
    probe.destroy();
    return Math.round(Math.min(this.L.width / 2, Math.max(min, w + 44)));
  }

  /**
   * Licznik ilości `− n + Max`.
   *
   * ⚠ Krańce **wyszarzone, ale widoczne** — odmowa bez powodu czyta się jak
   * zepsute UI, a znikający przycisk tym bardziej. ⭐ „Max" (research §4,
   * Stardew: samo `+` przy dużej ilości to „2000 tapnięć") ustawia sufit
   * podany przez wołającego — przy zakupie ten, na który stać i który się
   * zmieści, przy sprzedaży cały stos.
   */
  private paintQty(qty: ShopQty, x: number, y: number, h: number, fullW?: number): void {
    const side = Math.max(52, h);
    const maxW = 70;
    const valW = fullW ? fullW - 2 * side - maxW - 18 : 92;
    const atMin = qty.value <= qty.min;
    const atMax = qty.value >= qty.max;
    const items: { w: number; label: string; target: number; blocked: boolean; value?: boolean }[] = [
      { w: side, label: "−", target: qty.value - 1, blocked: atMin },
      { w: valW, label: `${qty.value} szt.`, target: qty.value, blocked: true, value: true },
      { w: side, label: "+", target: qty.value + 1, blocked: atMax },
      { w: maxW, label: "Max", target: qty.max, blocked: atMax },
    ];
    let cx = x;
    for (const it of items) {
      const box = this.addAction(
        this.scene.add
          .rectangle(cx + it.w / 2, y + h / 2, it.w, h, it.value ? 0x14161f : 0x1c2030, 1)
          .setStrokeStyle(1, UI.goldNum, it.value ? 0.25 : 0.5),
      );
      this.addAction(
        this.scene.add
          .text(box.x, box.y, it.label, textStyle({
            fontSize: fontPx(it.value || it.label === "Max" ? "body" : "title"),
            color: it.value ? UI.gold : it.blocked ? UI.muted : UI.white,
            fontStyle: "bold",
          }))
          .setOrigin(0.5),
      );
      if (!it.blocked) {
        box.setInteractive({ useHandCursor: true });
        box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
          p.event.stopPropagation();
          Sfx.play("ui-click");
          qty.onChange(Phaser.Math.Clamp(it.target, qty.min, qty.max));
        });
      }
      cx += it.w + 6;
    }
  }

  private makeButton(a: ShopAction, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const tone = TONES[a.disabled ? "neutral" : (a.tone ?? "primary")];
    const c = this.scene.add.container(x + w / 2, y + h / 2);
    const box = this.scene.add
      .rectangle(0, 0, w, h, tone.fill, 1)
      .setStrokeStyle(2, tone.stroke, a.disabled ? 0.35 : 0.9)
      .setInteractive({ useHandCursor: !a.disabled });
    const text = this.scene.add
      .text(0, 0, a.label, textStyle({ fontSize: fontPx("body"), color: a.disabled ? UI.muted : tone.text, fontStyle: "bold" }))
      .setOrigin(0.5);
    // ⚠ Napis dłuższy niż przycisk (wąska karta, długa nazwa celu) — zmniejsz
    //   do roli drugiego planu zamiast wylewać poza ramkę.
    if (text.width > w - 16) text.setFontSize(TYPE.small);
    c.add([box, text]);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      if (a.disabled) return;
      Sfx.play("ui-click");
      this.scene.tweens.add({ targets: c, scale: 0.96, duration: 70, yoyo: true, ease: "Quad.easeOut" });
      a.onClick();
    });
    this.addAction(c);
    return c;
  }

  destroy(): void {
    this.maskG.destroy();
    this.root.destroy(true);
  }
}

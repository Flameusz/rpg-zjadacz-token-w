import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Inventory } from "../core/Inventory";
import { Equipment, EQUIP_SLOTS, STOW_SLOTS, layeredSlot, type GearSlot, type LayeredArea } from "../core/Equipment";
import { getItem, itemFootprint, itemIconKey, type ItemId } from "../core/Items";
import { ASSETS, INVENTORY, ITEMS, SHOP } from "../config/GameConfig";
import {
  buyPriceOf,
  clampQuality,
  describeQuality,
  durabilityOf,
  hasDurability,
  isDestroyed,
  makeInstance,
  maxDurabilityOfInstance,
  qualityColor,
  qualityOf,
  repairCost,
  repairInstance,
  sellPriceOf,
  vendorQuality,
  type ItemInstance,
  type QualityLevel,
} from "../core/Quality";
import { UI, fontPx, textStyle, uiScale, uiW, uiH, formatAmount } from "../core/theme";
import { drawCoin } from "./UiIcons";
import { NPCS, type NpcDef } from "../core/Npcs";
import { Quests } from "../core/Quests";
import { floatingText } from "../core/Fx";
import { Sfx } from "../core/Sfx";
import { PanelBase } from "./PanelBase";
import { iconFitScale } from "./IconFit";
import { ConfirmDialog } from "./ConfirmDialog";
import { buildItemCard } from "./ItemCard";
import { ShopDetails, type ShopAction, type ShopEmptySummary, type ShopLayerChoice, type ShopQty } from "./ShopDetails";
import {
  SHOP_METRICS,
  computeShopLayout,
  fieldRect,
  packShelf,
  scrollWindow,
  shelfSpan,
  shopPanelH,
  shopPanelW,
  tabRects,
  type PlayerView,
  type ShelfPlace,
  type ShopDollCell,
  type ShopGridLayout,
  type ShopLayout as ShopLayoutRects,
  type ShopMode,
  type ShopScrollWindow,
} from "./ShopLayout";
import { handSlot } from "./PaperDoll";
import { serviceArea } from "./FrameLayout";
import { CategoryStrip } from "./CategoryStrip";
import { matchesCategory } from "./ItemCategory";
import { ARMOR_LAYERS, ARMOR_LAYER_SHORT, type ArmorLayer } from "../core/ArmorLayers";

/**
 * Sprzedaje się po jednej sztuce — w odróżnieniu od surowców, które idą
 * stosem. Amulet jest tu mimo że pierścienie nie są: pochodzi z walki, której
 * nie da się powtórzyć (Szary się nie odradza), i nie stoi na żadnej półce.
 */
function sellsOneAtATime(type: string): boolean {
  return type === "weapon" || type === "armor" || type === "amulet";
}

/** Co przewija się w tym panelu: dwie kolumny kafli i ciało karty. */
type ScrollZone = "merchant" | "player" | "details";

/** Co jest wybrane — karta jest JEDNA, więc i zaznaczenie jest jedno. */
type Selection =
  | { kind: "stock"; index: number }
  | { kind: "buyback"; index: number }
  | { kind: "bag"; index: number }
  | { kind: "worn"; slot: GearSlot };

/**
 * Pozycja ODKUPU — egzemplarz sprzedany temu kupcowi w tej sesji.
 * ⚠ Egzemplarz, nie identyfikator: odkupiony miecz wraca z jakością i ZUŻYCIEM,
 * z jakim go sprzedano (inaczej sprzedaż + odkup naprawiałyby za darmo).
 */
interface BuybackEntry {
  readonly inst: ItemInstance;
  /** Cena odkupu za CAŁĄ pozycję (`SHOP.buybackMarkup`). */
  readonly price: number;
}

/** Pozycja naprawy — rzecz NA SOBIE albo w plecaku. */
interface RepairEntry {
  readonly inst: ItemInstance;
  readonly cost: number;
  readonly equipped: boolean;
}

/** Jeden kafel półki albo odkupu — dane, które kafel rysuje. */
interface TileSpec {
  readonly iconKey: string;
  readonly fp: { w: number; h: number };
  /** Ramka spoczynkowa — kolor jakości (albo stanu przy odkupie). */
  readonly frame: number;
  /** Kwota na kaflu („39 g") — cena albo odkup. */
  readonly price: string;
  readonly priceColor: string;
  readonly count?: number;
  /** Brak wymagań — „⚠" w rogu (towar nie znika, mówi, że go nie założysz). */
  readonly warn?: boolean;
}

interface TileWidget {
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly top: number;
  readonly h: number;
  readonly frame: number;
}

/** Kafel plecaka — trwały, jeden na pole `Inventory.slots`. */
interface BagCell {
  readonly box: Phaser.GameObjects.Rectangle;
  readonly icon: Phaser.GameObjects.Image;
  readonly count: Phaser.GameObjects.Text;
}

/** Kafel sylwetki „Na sobie". */
interface DollWidget {
  readonly cell: ShopDollCell;
  readonly box: Phaser.GameObjects.Rectangle;
  readonly glyph: Phaser.GameObjects.Image;
  readonly icon: Phaser.GameObjects.Image;
  /** Kropki warstw — tylko obszary warstwowe. */
  readonly pips: Phaser.GameObjects.Rectangle[];
}

interface TabWidget<T extends string> {
  readonly id: T;
  readonly box: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly badge: Phaser.GameObjects.Text;
}

/** Ruch palca, po którym dotknięcie staje się przewijaniem (jak `CategoryStrip`). */
const SLOP = 8;
const FRAME = 0x3a4058;

/**
 * ── HANDEL — zakładka „Handel" ramy rozmowy (etap E, 2026-10-13) ──────────
 *
 * ⭐⭐ **KUPIEC | GRACZ | KARTA** — decyzje autora po zrzutach 1:1
 * (`ShopLayout.ts`): kolumna kupca **Kup | Odkup**, kolumna gracza
 * **Plecak | Na sobie**, obie z TYMI SAMYMI kaflami (przedmiot wygląda tak
 * samo wszędzie), karta zadokowana po prawej z przyciskiem w prawym dolnym
 * rogu. Kupno i sprzedaż widać NARAZ — sprzedaż to dotknięcie własnej rzeczy.
 * Naprawa należy do rzeczy gracza: „Napraw" na karcie, „Napraw wszystko" na
 * wizytówce kupca (pusta karta).
 *
 * ⚠ **Tapnięcie ZAZNACZA, akcje stoją pod kartą** (`src/ui/CLAUDE.md`), na
 * POINTER UP i tylko gdy palec nie przewijał.
 *
 * ⚠ **Bez okien „Czy na pewno?"** — zamiast nich „↩ Cofnij" ostatniej
 * transakcji (1:1, do końca rozmowy — E3) i Odkup z narzutem. Potwierdzenie
 * zostaje dla rzeczy wysokiej jakości, amuletu i rzeczy zdejmowanej z siebie.
 *
 * Panel nie ma żadnej polityki otwierania: bliskość, klawisz i pauza należą
 * do rozmowy (`NpcDialog`); tu tylko `show/hide/suspend/restore/back`.
 */
export class ShopPanel extends PanelBase {
  /** Handel prosi ramę o menu boczne SAMYCH IKON (autor 2026-10-13) — zgodne
   *  z `host: "frame-dense"` w konstruktorze. */
  readonly denseRail = true;
  private readonly L: ShopLayoutRects;
  private readonly confirm: ConfirmDialog;
  private details!: ShopDetails;
  private helpOverlay: Phaser.GameObjects.Container | null = null;
  private open = false;

  /* ── nagłówek ── */
  private merchantTabs: TabWidget<ShopMode>[] = [];
  private playerTabs: TabWidget<PlayerView>[] = [];
  private goldCoin!: Phaser.GameObjects.Graphics;
  private goldText!: Phaser.GameObjects.Text;
  private goldDelta!: Phaser.GameObjects.Text;
  private undoRoot!: Phaser.GameObjects.Container;

  /* ── kolumna kupca ── */
  private mode: ShopMode = "buy";
  private merchantStrip!: CategoryStrip;
  private merchantCaption!: Phaser.GameObjects.Text;
  private tilesRoot!: Phaser.GameObjects.Container;
  private tilesMaskG!: Phaser.GameObjects.Graphics;
  private tiles: TileWidget[] = [];
  /** Ile wierszy kafli zajęła bieżąca półka (gabaryt `1×2` bierze dwa). */
  private tileRows = 1;
  private merchantEmpty!: Phaser.GameObjects.Text;
  private merchantScroll = 0;
  private merchantTrack!: Phaser.GameObjects.Rectangle;
  private merchantThumb!: Phaser.GameObjects.Rectangle;

  /* ── kolumna gracza ── */
  private view: PlayerView = "bag";
  private bagStrip!: CategoryStrip;
  private playerCaption!: Phaser.GameObjects.Text;
  private bagRoot!: Phaser.GameObjects.Container;
  private bagMaskG!: Phaser.GameObjects.Graphics;
  private bagCells: BagCell[] = [];
  /** Widok filtrowany plecaka: kotwica → miejsce w widoku (`null` = „Wszystko"). */
  private bagView: Map<number, ShelfPlace> | null = null;
  private bagViewRows = 1;
  private dollRoot!: Phaser.GameObjects.Container;
  private dollWidgets: DollWidget[] = [];
  private playerScroll = 0;
  private playerTrack!: Phaser.GameObjects.Rectangle;
  private playerThumb!: Phaser.GameObjects.Rectangle;

  /* ── gest przewijania ── */
  private scrollPointerId: number | null = null;
  private scrollZone: ScrollZone | null = null;
  private scrollLastY = 0;
  private scrollStartY = 0;
  private scrollMoved = false;
  /** Kilka zmian naraz (sprzedaż, odkup) — jedna przebudowa na końcu. */
  private batching = false;

  /* ── stan handlu ── */
  private npc: NpcDef = NPCS.hunter;
  /** Cały asortyment kupca (z ceną kupna) i to, co pokazuje wybrana kategoria. */
  private stockAll: ItemId[] = [];
  private purchasable: ItemId[] = [];
  private selection: Selection | null = null;
  /** Ilość kupna startuje od 1 (pierwsze tapnięcie nie wydaje wszystkiego). */
  private buyQty = 1;
  /** Ilość sprzedaży startuje od PEŁNEGO stosu („zostaw mi kilka" = kilka `−`). */
  private sellQty = 1;
  /**
   * ⭐ **Odkup per kupiec, na czas życia sceny UI** (sesja gry). ⚠ Świadomie
   * NIE w zapisie i NIE w module: zmienna modułu przeżyłaby wczytanie zapisu
   * i podsunęła rzeczy z innej rozgrywki.
   */
  private readonly buyback = new Map<string, BuybackEntry[]>();
  /**
   * Ostatnia transakcja — cofalna dokładnie raz, do końca ROZMOWY (E3).
   *
   * ⚠ **`quality` NIE jest tu dla porządku** — kasa liczy cenę po jakości, więc
   * zwrot z ceny bazowej kłamał o pieniądze w obie strony (2026-08-27).
   * ⚠ **`inst` przy sprzedaży sztuki** (etap E): cofnięcie oddaje TEN egzemplarz,
   * z jego zużyciem. Przez `addItem` wracał nowy — sprzedaż uszkodzonego miecza
   * i cofnięcie były darmową naprawą.
   */
  private lastTransaction: {
    itemId: ItemId;
    qty: number;
    kind: "buy" | "sell";
    quality: QualityLevel;
    inst?: ItemInstance;
  } | null = null;

  // ⚠ Bez `onBack` (etap C): wyjście należy do menu bocznego ramy rozmowy,
  //   a Wstecz do `NpcDialog.back` — ten widok odpowiada za własne okna (`back`).
  constructor(scene: Phaser.Scene) {
    // ⭐⭐ Rozmiar z OBSZARU USŁUGI obok menu bocznego samych ikon (`frame-dense`).
    const area = serviceArea(uiW(scene), uiH(scene), true);
    super(scene, shopPanelW(area.w), shopPanelH(area.h), "frame-dense");
    this.L = computeShopLayout(this.w, this.h);
    // ⚠ Asercja, która potrafi zaświecić na czerwono — ten sam rachunek robi
    //   `tools/sklep_uklad.mjs` bez uruchamiania gry.
    if (this.L.overflow && import.meta.env.DEV) {
      console.warn(`[ShopPanel] układ nie mieści się w panelu ${this.w}×${this.h} j.: ${this.L.overflow}`);
    }
    const L = this.L;
    this.confirm = new ConfirmDialog(scene);

    this.buildHeader();

    // Kreski: pod nagłówkiem i między kolumnami — mierzone do treści.
    this.container.add(scene.add.rectangle(0, L.contentTop - SHOP_METRICS.headerGap / 2, this.w - 2 * SHOP_METRICS.pad, 1, 0xffffff, 0.12));
    for (const x of [L.player.left - SHOP_METRICS.colGap / 2, L.details.left - SHOP_METRICS.colGap / 2]) {
      this.container.add(scene.add.rectangle(x, L.contentTop + L.contentH / 2, 1, L.contentH, 0xffffff, 0.12));
    }

    /* ── kolumna kupca ── */
    this.merchantStrip = new CategoryStrip(scene, this.container, L.merchant.strip, (cat) => {
      this.clearSelection();
      this.purchasable = this.stockAll.filter((id) => matchesCategory(id, cat));
      this.merchantScroll = 0;
      this.refresh();
    });
    this.merchantCaption = this.caption(L.merchant);
    this.tilesRoot = scene.add.container(0, 0);
    this.container.add(this.tilesRoot);
    this.tilesMaskG = scene.make.graphics({}, false);
    this.tilesRoot.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.tilesMaskG));
    this.merchantEmpty = scene.add
      .text(L.merchant.centerX, L.merchant.windowTop + 90, "", textStyle({ fontSize: fontPx("body"), color: UI.muted, align: "center", wordWrap: { width: L.merchant.gridW - 20 } }))
      .setOrigin(0.5, 0);
    this.container.add(this.merchantEmpty);
    [this.merchantTrack, this.merchantThumb] = this.scrollBar(L.merchant);

    /* ── kolumna gracza ── */
    this.bagStrip = new CategoryStrip(scene, this.container, L.player.strip, () => {
      this.playerScroll = 0;
      this.refresh();
    });
    this.playerCaption = this.caption(L.player);
    this.bagRoot = scene.add.container(0, 0);
    this.container.add(this.bagRoot);
    this.bagMaskG = scene.make.graphics({}, false);
    this.bagRoot.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.bagMaskG));
    this.dollRoot = scene.add.container(0, 0);
    this.container.add(this.dollRoot);
    this.buildDoll();
    [this.playerTrack, this.playerThumb] = this.scrollBar(L.player);

    // ⚠ Kolumna szczegółów powstaje NA KOŃCU, żeby jej przyciski leżały nad
    //   wszystkim innym w kontenerze (Container rysuje w kolejności listy).
    this.details = new ShopDetails(scene, this.container, L.details);

    // ⚠ Gest na poziomie SCENY, nie kafla — palec wyjeżdża poza kafel, na
    //   którym wystartował (`src/ui/CLAUDE.md`, „Panele").
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onScrollStart, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onScrollMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onScrollEnd, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onScrollEnd, this);
    // ⚠ `POINTER_WHEEL` na WTYCZCE SCENY — `GAMEOBJECT_WHEEL` na obiekcie nie
    //   odpala się w ogóle (pułapka opisana w `src/ui/CLAUDE.md`).
    scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.onScrollWheel, this);

    GameEvents.on(EVENT.inventoryChanged, this.refresh, this);
    GameEvents.on(EVENT.equipmentChanged, this.refresh, this);

    this.reposition();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.inventoryChanged, this.refresh, this);
      GameEvents.off(EVENT.equipmentChanged, this.refresh, this);
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onScrollStart, this);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onScrollMove, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onScrollEnd, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onScrollEnd, this);
      scene.input.off(Phaser.Input.Events.POINTER_WHEEL, this.onScrollWheel, this);
      // ⚠ `Graphics` masek nie są na liście wyświetlania — niszczy się je ręcznie.
      this.tilesMaskG.destroy();
      this.bagMaskG.destroy();
      this.details.destroy();
    });
  }

  /** Jednozdaniowy podpis w miejscu paska kategorii (Odkup, Na sobie). */
  private caption(col: ShopGridLayout): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(col.strip.x + 4, col.strip.y + col.strip.h / 2, "", textStyle({ fontSize: fontPx("small"), color: UI.muted, wordWrap: { width: col.strip.w - 8 } }))
      .setOrigin(0, 0.5);
    this.container.add(t);
    return t;
  }

  /** Pasek przewijania kolumny — po prawej stronie siatki. */
  private scrollBar(col: ShopGridLayout): [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Rectangle] {
    const track = this.scene.add.rectangle(col.scrollX, col.windowTop, 4, col.windowH, 0xffffff, 0.08).setOrigin(0.5, 0).setVisible(false);
    const thumb = this.scene.add.rectangle(col.scrollX, col.windowTop, 4, 40, UI.goldNum, 0.7).setOrigin(0.5, 0).setVisible(false);
    this.container.add([track, thumb]);
    return [track, thumb];
  }

  /* ══ NAGŁÓWEK ═══════════════════════════════════════════════════════════ */

  private buildHeader(): void {
    const L = this.L;
    const scene = this.scene;
    // ⭐ Ten sam przełącznik po obu stronach (autor 2026-10-13): kupiec
    //   Kup | Odkup, gracz Plecak | Na sobie. Dwie zakładki u każdego kupca,
    //   więc kafle nie skaczą między rozmowami.
    this.merchantTabs = this.buildTabs<ShopMode>(L.merchant, [
      ["buy", "Kup"],
      ["buyback", "Odkup"],
    ], (m) => this.setMode(m));
    this.playerTabs = this.buildTabs<PlayerView>(L.player, [
      ["bag", "Plecak"],
      ["worn", "Na sobie"],
    ], (v) => this.setView(v));

    // „↩ Cofnij" — nad kartą, przed złotem.
    this.undoRoot = scene.add.container(0, 0);
    this.container.add(this.undoRoot);

    // ⭐ ZŁOTO należy do widoku, który je wydaje (autor 2026-10-13): stan
    //   i wydatek „3 020 (−40)" w `UI.spend`; przy sprzedaży wpływ „(+40)".
    this.goldCoin = drawCoin(scene.add.graphics(), 22, "gold");
    this.goldText = scene.add
      .text(0, L.headerY, "0", textStyle({ fontSize: fontPx("name"), color: UI.goldLight, fontStyle: "bold" }))
      .setOrigin(1, 0.5);
    this.goldDelta = scene.add
      .text(L.goldRight, L.headerY, "", textStyle({ fontSize: fontPx("body"), color: UI.spend, fontStyle: "bold" }))
      .setOrigin(1, 0.5);
    this.container.add([this.goldCoin, this.goldText, this.goldDelta]);

    // ⓘ — instrukcja pod przyciskiem. Pole trafienia = norma dotyku (68 j.).
    const hit = scene.add.rectangle(L.infoX, L.headerY, L.btnHit, L.btnHit, 0x000000, 0).setInteractive({ useHandCursor: true });
    const box = scene.add.rectangle(L.infoX, L.headerY, L.btnSize, L.btnSize, 0x2a2f3a, 1).setStrokeStyle(2, UI.goldNum, 0.9);
    const t = scene.add.text(L.infoX, L.headerY, "i", textStyle({ fontSize: fontPx("body"), color: UI.gold, fontStyle: "bold" })).setOrigin(0.5);
    hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      Sfx.play("ui-click");
      this.toggleHelp();
    });
    this.container.add([hit, box, t]);
  }

  private buildTabs<T extends string>(col: ShopGridLayout, defs: [T, string][], onPick: (id: T) => void): TabWidget<T>[] {
    const rects = tabRects(col.tabs, defs.length);
    return defs.map(([id, napis], i) => {
      const r = rects[i];
      const box = this.scene.add
        .rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h, UI.slotBg, 1)
        .setStrokeStyle(1, FRAME, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(box.x, box.y, napis, textStyle({ fontSize: fontPx("body"), color: UI.muted, fontStyle: "bold" }))
        .setOrigin(0.5);
      const badge = this.scene.add
        .text(r.x + r.w - 6, r.y + 4, "", textStyle({ fontSize: fontPx("small"), color: UI.goldLight, fontStyle: "bold" }))
        .setOrigin(1, 0);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        Sfx.play("ui-click");
        onPick(id);
      });
      this.container.add([box, label, badge]);
      return { id, box, label, badge };
    });
  }

  private paintTabs(): void {
    const maluj = <T extends string>(tabs: TabWidget<T>[], aktywna: T, licznik: (id: T) => number) => {
      for (const t of tabs) {
        const on = t.id === aktywna;
        t.box.setFillStyle(on ? 0x2a3550 : UI.slotBg, 1).setStrokeStyle(on ? 2 : 1, on ? UI.goldNum : FRAME, 1);
        t.label.setColor(on ? UI.gold : UI.muted);
        // ⭐ Licznik wyprowadzany ze stanu, nie zapalany zdarzeniem (kropka,
        //   która nie gaśnie — `docs/ui_mobile_research.md` §4).
        const n = licznik(t.id);
        t.badge.setText(n > 0 ? `${n}` : "");
      }
    };
    maluj(this.merchantTabs, this.mode, (id) => (id === "buyback" ? this.buybackList().length : 0));
    // „Na sobie" liczy rzeczy do NAPRAWY — tylko u kupca, który naprawia.
    maluj(this.playerTabs, this.view, (id) => (id === "worn" ? this.repairables().filter((r) => r.equipped).length : 0));
  }

  private setMode(mode: ShopMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.merchantScroll = 0;
    this.refresh();
  }

  private setView(view: PlayerView): void {
    if (this.view === view) return;
    this.view = view;
    this.playerScroll = 0;
    this.refresh();
  }

  /* ══ OTWIERANIE ═════════════════════════════════════════════════════════ */

  show(npc: NpcDef): void {
    this.open = true;
    this.npc = npc;
    // Pomoc jest stanem JEDNEJ wizyty.
    this.helpOverlay?.setVisible(false);
    this.stockAll = this.npc.stock.filter((id) => "buyPrice" in ITEMS[id]);
    this.purchasable = this.stockAll;
    this.merchantStrip.reset();
    this.merchantStrip.setItems(this.stockAll, true);
    this.bagStrip.reset();
    this.mode = "buy";
    this.view = "bag";
    this.merchantScroll = 0;
    this.playerScroll = 0;
    // ⚠ Zaznaczenie gaśnie PRZED przebudową — indeks półki należał do kogoś innego.
    this.clearSelection();
    // ⭐ E3: „Cofnij" trwa do końca ROZMOWY — każda nowa rozmowa zaczyna czysto.
    this.lastTransaction = null;
    this.refresh();
    this.container.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.container.setVisible(false);
    this.helpOverlay?.setVisible(false);
    this.clearSelection();
    this.confirm.hide();
    this.syncInput();
  }

  /**
   * Przejście na inną zakładkę TEJ SAMEJ rozmowy: widoki, zaznaczenie, filtry,
   * przewinięcie i „Cofnij" zostają do powrotu.
   */
  suspend(): void {
    this.open = false;
    this.container.setVisible(false);
    this.helpOverlay?.setVisible(false);
    this.confirm.hide();
    this.syncInput();
  }

  restore(): void {
    this.open = true;
    // ⚠ `refresh()` CELOWO czyści zaznaczenie (osierocone „Sprzedaj" po zmianie
    //   plecaka) — więc zapamiętujemy je i stawiamy z powrotem, jeśli rzecz dalej
    //   tam jest. Karta przelicza się z żywego stanu (złoto wydane w Szkoleniu).
    const sel = this.selection;
    this.refresh();
    if (sel) this.select(sel, true);
    this.container.setVisible(true);
  }

  /** Wstecz WEWNĄTRZ widoku: okno potwierdzenia, potem pomoc; reszta należy do ramy. */
  back(): boolean {
    if (this.confirm.isOpen) {
      this.confirm.hide();
      return true;
    }
    if (this.helpOverlay?.visible) {
      this.helpOverlay.setVisible(false);
      return true;
    }
    return false;
  }

  /* ══ ODŚWIEŻENIE ════════════════════════════════════════════════════════ */

  private refresh(): void {
    // ⚠ **Bramka `this.open`** — `refresh` wisi na `inventoryChanged`, czyli
    //   leci przy KAŻDYM podniesionym łupie, a sklep jest zamknięty przez prawie
    //   całą rozgrywkę (każda przebudowa to nowe obiekty `Text`).
    if (!this.open || this.batching) return;
    // ⚠ `clearSelection`, nie samo zgaszenie karty: inaczej zostaje osierocone
    //   „Sprzedaj" opisujące rzecz, której już nie ma.
    this.clearSelection();
    this.paintTabs();
    this.paintGold();
    this.refreshUndo();

    // ── kupiec ──
    this.merchantStrip.setVisible(this.mode === "buy");
    this.merchantCaption.setText(
      this.mode === "buyback" ? `Sprzedane temu kupcowi — odkupisz je o ${Math.round(SHOP.buybackMarkup * 100)}% drożej.` : "",
    );
    this.rebuildTiles();

    // ── gracz ──
    const plecak = this.view === "bag";
    this.bagStrip.setVisible(plecak);
    this.bagRoot.setVisible(plecak);
    this.dollRoot.setVisible(!plecak);
    this.playerCaption.setText(
      plecak ? "" : `Obciążenie ${formatAmount(Math.round(Equipment.equippedWeight))} / ${formatAmount(Math.round(Equipment.loadCapacity))} kg · ${Equipment.loadLabel.toLowerCase()}`,
    );
    if (plecak) {
      this.bagStrip.setItems(
        Inventory.slots.filter((s): s is NonNullable<typeof s> => s !== null).map((s) => s.itemId),
        true,
      );
      this.computeBagView();
      this.rebuildBag();
    } else {
      this.paintDoll();
    }

    this.setScroll("merchant", this.merchantScroll);
    this.setScroll("player", this.playerScroll);
    this.refreshMasks();
  }

  /** Okno kolumny — góra, wysokość i ile przewinąć. */
  private windowOf(zone: "merchant" | "player"): ShopScrollWindow {
    const G = zone === "merchant" ? this.L.merchant : this.L.player;
    const g = G.grid;
    if (zone === "merchant") return scrollWindow(G.windowTop, G.windowH, g.rowH, g.gap, this.tileRows);
    // Sylwetka mieści się w oknie w całości (`ShopLayout` to sprawdza).
    if (this.view === "worn") return scrollWindow(G.windowTop, G.windowH, g.rowH, g.gap, 1);
    const rows = this.bagView ? this.bagViewRows : Math.ceil(Inventory.slots.length / g.cols);
    return scrollWindow(G.windowTop, G.windowH, g.rowH, g.gap, rows);
  }

  /**
   * Przesuń kolumnę, z ograniczeniem do zakresu. ⚠ Wyłączanie wejścia poza
   * oknem jest częścią naprawy, nie ozdobą: maska ukrywa kafel, ale zostawia go
   * KLIKALNYM („maska przycina RYSOWANIE, nie WEJŚCIE"). ⭐ `maxScroll === 0`
   * gasi pasek.
   */
  private setScroll(zone: "merchant" | "player", v: number): void {
    const okno = this.windowOf(zone);
    const max = okno.maxScroll;
    const wartosc = Phaser.Math.Clamp(v, 0, max);
    if (zone === "merchant") {
      this.merchantScroll = wartosc;
      this.tilesRoot.y = -wartosc;
    } else {
      this.playerScroll = wartosc;
      this.bagRoot.y = -wartosc;
    }
    const track = zone === "merchant" ? this.merchantTrack : this.playerTrack;
    const thumb = zone === "merchant" ? this.merchantThumb : this.playerThumb;
    const przewija = max > 0;
    track.setVisible(przewija);
    thumb.setVisible(przewija);
    if (przewija) {
      const h = Math.max(24, (okno.height / okno.contentH) * okno.height);
      thumb.height = h;
      thumb.y = okno.top + (wartosc / max) * (okno.height - h);
    }
    this.syncInput();
  }

  /** Wejście tylko tam, gdzie widać: kafle w oknie, sylwetka w swoim widoku, nic przy zamkniętym. */
  private syncInput(): void {
    const widac = (zone: "merchant" | "player", top: number, h: number): boolean => {
      const okno = this.windowOf(zone);
      const y = top - (zone === "merchant" ? this.merchantScroll : this.playerScroll);
      return y + h > okno.top + 2 && y < okno.bottom - 2;
    };
    for (const t of this.tiles) {
      if (t.bg.input) t.bg.input.enabled = this.open && widac("merchant", t.top, t.h);
    }
    const plecak = this.open && this.view === "bag";
    for (let i = 0; i < this.bagCells.length; i++) {
      const c = this.bagCells[i];
      if (!c.box.input) continue;
      const on = plecak && c.box.visible && !!Inventory.slots[i];
      c.box.input.enabled = on && widac("player", c.box.y - c.box.height / 2, c.box.height);
    }
    for (const d of this.dollWidgets) {
      if (d.box.input) d.box.input.enabled = this.open && this.view === "worn";
    }
  }

  /* ══ KAFLE KUPCA (Kup · Odkup) ══════════════════════════════════════════ */

  /**
   * ⭐⭐ **Przedmiot wygląda tak samo wszędzie** (decyzja autora 2026-10-13,
   * zrzut A/B lista ↔ kafle): półka i odkup to TEN SAM kafel, co plecak —
   * pole na cały gabaryt (`1×2` = dwa pola), ikona w skali plecaka, kwota
   * NA kaflu. Nazwa, porównanie i akcja — na karcie.
   */
  private rebuildTiles(): void {
    this.tilesRoot.removeAll(true);
    this.tiles = [];
    const specs = this.tileSpecs();
    const G = this.L.merchant;
    const g = G.grid;
    const pack = packShelf(g.cols, specs.map((t) => t.fp));
    this.tileRows = specs.length ? pack.rows : 1;
    specs.forEach((t, i) => {
      const m = pack.places[i];
      this.tiles.push(this.buildTile(t, i, fieldRect(g, G.centerX, G.gridTop, m.col, m.row, m.w, m.h), shelfSpan(g, m.w, m.h)));
    });
    this.merchantEmpty
      .setText(specs.length ? "" : this.mode === "buyback" ? "Nic jeszcze temu kupcowi nie sprzedałeś." : "Pusta półka.")
      .setVisible(!specs.length);
  }

  /** Dane kafli bieżącego widoku kupca — jedno miejsce, z którego rysuje się siatka. */
  private tileSpecs(): TileSpec[] {
    if (this.mode === "buy") {
      return this.purchasable.map((id) => {
        const q = this.stockQuality(id);
        const cena = buyPriceOf(id, q);
        const gear = sellsOneAtATime(getItem(id).type);
        return {
          iconKey: itemIconKey(id),
          fp: itemFootprint(id),
          frame: gear ? qualityColor(q) : FRAME,
          // ⭐ Cena, na którą gracza NIE STAĆ, jest czerwona — przed dotknięciem.
          price: `${formatAmount(cena)} g`,
          priceColor: cena > Inventory.gold ? UI.danger : UI.goldLight,
          // ⭐ Brak Siły to OSTRZEŻENIE na kaflu, nie ukrycie towaru.
          warn: gear && !buildItemCard(makeInstance(id, 1, q)).requirementsMet,
        };
      });
    }
    return this.buybackList().map((e) => {
      const gear = sellsOneAtATime(getItem(e.inst.itemId).type);
      return {
        iconKey: itemIconKey(e.inst.itemId),
        fp: itemFootprint(e.inst.itemId),
        frame: gear ? this.stateFrame(e.inst) : FRAME,
        price: `${formatAmount(e.price)} g`,
        priceColor: e.price > Inventory.gold ? UI.danger : UI.goldLight,
        count: e.inst.qty > 1 ? e.inst.qty : undefined,
      };
    });
  }

  /**
   * Jeden kafel: POLE na cały gabaryt (to ono jest polem trafienia —
   * `Rectangle.setSize` trzyma je w rozmiarze rysunku), ikona w skali plecaka,
   * kwota w prawym dolnym rogu, ostrzeżenie w lewym górnym.
   */
  private buildTile(
    t: TileSpec,
    index: number,
    r: { x: number; y: number; width: number; height: number },
    span: { width: number; height: number },
  ): TileWidget {
    const bg = this.scene.add
      .rectangle(r.x, r.y, r.width, r.height, UI.slotBg, 1)
      .setStrokeStyle(2, t.frame, 1)
      .setInteractive({ useHandCursor: true });
    // ⚠ Skala z CAŁEGO pola, jak w plecaku — kwota leży NA ikonie (obrys),
    //   a nie w zarezerwowanym pasie: pas spychał rzeczy `1×1` do ×1 przy
    //   `1×2` w ×2 (toporek drobny obok miecza — `I3` w przymiarze).
    const icon = this.scene.add.image(r.x, r.y - 3, t.iconKey).setScale(this.iconFit(t.iconKey, span.width, span.height));
    const price = this.scene.add
      .text(r.x + r.width / 2 - 4, r.y + r.height / 2 - 1, t.price, textStyle({
        fontSize: fontPx("small"),
        color: t.priceColor,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      }))
      .setOrigin(1, 1);
    const parts: Phaser.GameObjects.GameObject[] = [bg, icon, price];
    if (t.warn) {
      parts.push(
        this.scene.add
          .text(r.x - r.width / 2 + 4, r.y - r.height / 2 + 2, "⚠", textStyle({ fontSize: fontPx("small"), color: "#ff9d3b", stroke: "#000000", strokeThickness: 3 }))
          .setOrigin(0, 0),
      );
    }
    if (t.count) {
      parts.push(
        this.scene.add
          .text(r.x - r.width / 2 + 4, r.y + r.height / 2 - 1, `${t.count}`, textStyle({ fontSize: fontPx("small"), color: UI.white, stroke: "#000000", strokeThickness: 3 }))
          .setOrigin(0, 1),
      );
    }
    // ⚠ Wybór na POINTER UP i tylko bez przewijania — inaczej każde przewinięcie
    //   otwierałoby kafel, na którym palec stanął.
    bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (this.scrollMoved) return;
      this.toggle(this.mode === "buy" ? { kind: "stock", index } : { kind: "buyback", index });
    });
    this.tilesRoot.add(parts);
    return { bg, top: r.y - r.height / 2, h: r.height, frame: t.frame };
  }

  /* ══ PLECAK ═════════════════════════════════════════════════════════════ */

  /**
   * Widok filtrowany plecaka. ⚠ Czyta `Inventory.slots`, nigdy go nie zmienia —
   * pasujące KOTWICE ułożone tą samą regułą, co `packShelf`.
   */
  private computeBagView(): void {
    const cat = this.bagStrip.selected;
    if (cat === "all") {
      this.bagView = null;
      return;
    }
    const kotwice: number[] = [];
    Inventory.slots.forEach((s, i) => {
      if (s && matchesCategory(s.itemId, cat)) kotwice.push(i);
    });
    const pack = packShelf(this.L.player.grid.cols, kotwice.map((i) => itemFootprint(Inventory.slots[i]!.itemId)));
    this.bagView = new Map(kotwice.map((i, k) => [i, pack.places[k]]));
    this.bagViewRows = pack.rows;
  }

  /**
   * Kafle plecaka. ⭐⭐ **POLE na całe przykrycie** (`fieldRect`): rzecz `1×2`
   * ma jeden prostokąt na dwa pola, a kafel przykryty chowa ramkę. ⭐ Pole
   * jest też POLEM TRAFIENIA — tapnięcie działa z dowolnej części gabarytu.
   */
  private rebuildBag(): void {
    const B = this.L.player;
    const g = B.grid;
    if (this.bagCells.length !== Inventory.slots.length) {
      this.bagRoot.removeAll(true);
      this.bagCells = [];
      for (let i = 0; i < Inventory.slots.length; i++) {
        const box = this.scene.add.rectangle(0, 0, g.cell, g.cell, UI.slotBg, 1).setStrokeStyle(2, FRAME, 1).setInteractive({ useHandCursor: true });
        const icon = this.scene.add.image(0, 0, "").setVisible(false);
        const count = this.scene.add
          .text(0, 0, "", textStyle({ fontSize: fontPx("small"), color: UI.white, stroke: "#000000", strokeThickness: 3 }))
          .setOrigin(1);
        box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
          if (this.scrollMoved) return;
          // ⚠ Pole może być drugą połową rzeczy `1×2` — wybór idzie do KOTWICY.
          const kotwica = Inventory.anchorCovering(i) ?? i;
          if (Inventory.slots[kotwica]) this.toggle({ kind: "bag", index: kotwica });
        });
        this.bagRoot.add([box, icon, count]);
        this.bagCells.push({ box, icon, count });
      }
    }
    for (let i = 0; i < this.bagCells.length; i++) {
      const c = this.bagCells[i];
      const slot = Inventory.slots[i];
      const v = this.bagView?.get(i);
      let col: number;
      let row: number;
      let fp = { w: 1, h: 1 };
      if (this.bagView) {
        if (!v || !slot) {
          c.box.setVisible(false);
          c.icon.setVisible(false);
          c.count.setText("");
          continue;
        }
        col = v.col;
        row = v.row;
        fp = { w: v.w, h: v.h };
      } else {
        const kotwica = Inventory.anchorCovering(i);
        if (!slot && kotwica !== null && kotwica !== i) {
          // Pole PRZYKRYTE przez rzecz wyżej — ramka należy do tamtej rzeczy.
          c.box.setVisible(false);
          c.icon.setVisible(false);
          c.count.setText("");
          continue;
        }
        col = i % g.cols;
        row = Math.floor(i / g.cols);
        if (slot) fp = itemFootprint(slot.itemId);
      }
      const r = fieldRect(g, B.centerX, B.gridTop, col, row, fp.w, fp.h);
      c.box.setPosition(r.x, r.y).setSize(r.width, r.height).setVisible(true);
      if (slot) {
        const span = shelfSpan(g, fp.w, fp.h);
        const key = itemIconKey(slot.itemId);
        c.icon.setTexture(key).setPosition(r.x, r.y).setVisible(true);
        c.icon.setScale(this.iconFit(key, span.width, span.height));
        c.count.setPosition(r.x + r.width / 2 - 4, r.y + r.height / 2 - 2).setText(slot.qty > 1 ? `${slot.qty}` : "");
      } else {
        c.icon.setVisible(false);
        c.count.setText("");
      }
    }
    this.markSelected();
  }

  /**
   * Skala ikony w kaflu — całkowita, sufit ×2 (`IconFit.ts`). ⚠ Margines 4 j.,
   * nie 6: przy kaflu 68 j. (norma dotyku) 6 j. spychało rysunek do ×1,
   * a panel gracza rysuje ten sam kafel w ×2 — ta sama rzecz byłaby w sklepie
   * dwa razy mniejsza (`I3` w `tools/sklep_uklad.mjs`).
   */
  private iconFit(key: string, cellW: number, cellH: number): number {
    const img = this.scene.textures.get(key)?.getSourceImage() as HTMLImageElement | undefined;
    return iconFitScale(img?.width ?? 32, img?.height ?? 32, cellW - 4, cellH - 4, 2);
  }

  /**
   * Ramka rzeczy GRACZA: czerwień = zniszczona, żółć = zużyta (warto dotknąć —
   * tu się naprawia), inaczej kolor jakości. ⭐ Ten sam kod barw, co lalka
   * panelu gracza: ta sama rzecz czyta się tak samo na obu ekranach.
   */
  private stateFrame(inst: ItemInstance): number {
    if (hasDurability(inst.itemId)) {
      if (isDestroyed(inst)) return 0xdd3333;
      if (durabilityOf(inst) < maxDurabilityOfInstance(inst)) return 0xddcc33;
    }
    return qualityColor(qualityOf(inst));
  }

  /* ══ NA SOBIE (sylwetka) ════════════════════════════════════════════════ */

  /**
   * ⭐ Sylwetka „Na sobie" — te same dane (`DOLL_CELLS`), co lalka panelu
   * gracza: obszar ciała = jeden kafel z kropkami warstw, ręce = para W RĘKACH
   * (wysokie na dwa pola). ⚠ Glif i ikona wykluczają się: pusty kafel mówi,
   * CO tu wchodzi.
   */
  private buildDoll(): void {
    for (const cell of this.L.doll) {
      const box = this.scene.add
        .rectangle(cell.x, cell.y, cell.size, cell.height, UI.slotBg, 1)
        .setStrokeStyle(2, FRAME, 1)
        .setInteractive({ useHandCursor: true });
      const glyphScale = Math.max(1, Math.floor((cell.size - 12) / ASSETS.slotGlyphs.cell));
      const glyph = this.scene.add
        .image(cell.x, cell.y, ASSETS.slotGlyphs.key, cell.cell.glyph)
        .setScale(glyphScale)
        .setTint(0x5c6780);
      const icon = this.scene.add.image(cell.x, cell.y, "").setVisible(false);
      const pips: Phaser.GameObjects.Rectangle[] = [];
      if (cell.cell.area) {
        const x0 = cell.x - ((ARMOR_LAYERS.length - 1) * 9) / 2;
        for (let i = 0; i < ARMOR_LAYERS.length; i++) {
          pips.push(this.scene.add.rectangle(x0 + i * 9, cell.y + cell.height / 2 - 6, 3, 3, 0x39405a, 1));
        }
      }
      const widget: DollWidget = { cell, box, glyph, icon, pips };
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        const noszone = this.wornIn(widget);
        if (!noszone.length) return this.clearSelection();
        const s = this.selection;
        if (s?.kind === "worn" && noszone.includes(s.slot)) return this.clearSelection();
        this.select({ kind: "worn", slot: noszone[0] });
      });
      this.dollRoot.add([box, glyph, icon, ...pips]);
      this.dollWidgets.push(widget);
    }
  }

  /** Adresy kafla sylwetki — **od wierzchu do ciała** (pierwszy = widoczny). */
  private addressesOf(w: DollWidget): GearSlot[] {
    const c = w.cell.cell;
    if (c.area) return [...ARMOR_LAYERS].reverse().map((l) => layeredSlot(c.area as LayeredArea, l));
    if (c.hand) return [handSlot(c.hand, 1)];
    return c.slot ? [c.slot] : [];
  }

  /** Adresy tego kafla, na których COŚ leży. */
  private wornIn(w: DollWidget): GearSlot[] {
    return this.addressesOf(w).filter((a) => Equipment[a]);
  }

  private paintDoll(): void {
    for (const w of this.dollWidgets) {
      // ⚠ Adres liczony ZA KAŻDYM RAZEM — „najbardziej zewnętrzna zajęta
      //   warstwa" zmienia się przy każdym założeniu i zdjęciu.
      const noszone = this.wornIn(w);
      const inst = noszone.length ? Equipment[noszone[0]] : null;
      if (inst) {
        const key = itemIconKey(inst.itemId);
        w.icon.setTexture(key).setScale(this.iconFit(key, w.cell.size, w.cell.height)).setVisible(true);
        w.glyph.setVisible(false);
      } else {
        w.icon.setVisible(false);
        w.glyph.setVisible(true);
      }
      if (w.cell.cell.area) {
        ARMOR_LAYERS.forEach((l, i) => {
          const zajeta = !!Equipment[layeredSlot(w.cell.cell.area as LayeredArea, l)];
          w.pips[i].setFillStyle(zajeta ? 0xffcc66 : 0x39405a, 1);
        });
      }
    }
    this.markSelected();
  }

  /**
   * Chipy warstw na karcie rzeczy noszonej — jedyna droga do sztuk POD
   * wierzchnią. ⚠ Od ciała na zewnątrz (`Spód → Wierzch`), jak kropki pod
   * kaflem; ⛔ słowo, nie kod `L1/L2/L3`.
   */
  private layerSwitch(slot: GearSlot): ShopLayerChoice[] | undefined {
    const w = this.dollWidgets.find((d) => this.addressesOf(d).includes(slot));
    if (!w?.cell.cell.area) return undefined;
    const noszone = this.wornIn(w);
    if (noszone.length < 2) return undefined;
    return [...noszone].reverse().map((adres) => ({
      label: ARMOR_LAYER_SHORT[adres.slice(adres.lastIndexOf("_L") + 1) as ArmorLayer],
      active: adres === slot,
      onPick: () => this.select({ kind: "worn", slot: adres }),
    }));
  }

  /* ══ ZAZNACZENIE I KARTA ════════════════════════════════════════════════ */

  /** Ta sama rzecz drugi raz = zdjęcie zaznaczenia (ten sam czasownik wszędzie). */
  private toggle(sel: Selection): void {
    if (this.sameSelection(this.selection, sel)) return this.clearSelection();
    this.select(sel);
  }

  private sameSelection(a: Selection | null, b: Selection): boolean {
    if (!a || a.kind !== b.kind) return false;
    if (a.kind === "worn" && b.kind === "worn") return a.slot === b.slot;
    return (a as { index: number }).index === (b as { index: number }).index;
  }

  /**
   * Postaw zaznaczenie i kartę. `keepQty` — przy przerysowaniu (licznik,
   * powrót na zakładkę) ilość zostaje, przy nowym wyborze startuje od nowa.
   */
  private select(sel: Selection, keepQty = false): void {
    if (!keepQty) {
      this.buyQty = 1;
      if (sel.kind === "bag") {
        const slot = Inventory.slots[sel.index];
        this.sellQty = slot && !sellsOneAtATime(getItem(slot.itemId).type) ? slot.qty : 1;
      }
    }
    this.selection = sel;
    const ok =
      sel.kind === "stock"
        ? this.showStockCard(sel.index)
        : sel.kind === "buyback"
          ? this.showBuybackCard(sel.index)
          : sel.kind === "bag"
            ? this.showBagCard(sel.index)
            : this.showWornCard(sel.slot);
    if (!ok) return this.clearSelection();
    this.markSelected();
    this.paintGold();
  }

  private clearSelection(): void {
    this.selection = null;
    this.details?.clear(this.summary());
    this.markSelected();
    // Złoto niesie „(−x)" — zdjęcie zaznaczenia zdejmuje obietnicę ceny.
    this.paintGold();
  }

  /** Ramka zaznaczenia — na całym polu kafla (półka, odkup, plecak, sylwetka). */
  private markSelected(): void {
    const s = this.selection;
    this.tiles.forEach((t, i) => {
      const on = !!s && (s.kind === "stock" || s.kind === "buyback") && s.index === i;
      t.bg.setStrokeStyle(on ? 3 : 2, on ? UI.goldNum : t.frame, 1).setFillStyle(on ? 0x232a3d : UI.slotBg, 1);
    });
    this.bagCells.forEach((c, i) => {
      const slot = Inventory.slots[i];
      const on = s?.kind === "bag" && s.index === i;
      c.box.setStrokeStyle(on ? 3 : 2, on ? UI.goldNum : slot ? this.stateFrame(slot) : FRAME, 1);
    });
    for (const w of this.dollWidgets) {
      const noszone = this.wornIn(w);
      const inst = noszone.length ? Equipment[noszone[0]] : null;
      const on = s?.kind === "worn" && this.addressesOf(w).includes(s.slot);
      w.box.setStrokeStyle(on ? 3 : 2, on ? UI.goldNum : inst ? this.stateFrame(inst) : FRAME, 1);
    }
  }

  /**
   * Wizytówka kupca w pustej karcie — ⚠ wyłącznie rzeczy, które gracz i tak
   * sprawdza przy wejściu (ile mam, co jest na półce, czy ten człowiek
   * naprawia) — i ⭐ NAPRAWA ZBIORCZA: „Noszone" i „Wszystko" z kwotą na
   * przycisku (wszystko albo nic — brak złota nie naprawia części).
   */
  private summary(): ShopEmptySummary {
    // ⚠ „1 rzeczy" to literówka widoczna u każdego kupca z jedną pozycją.
    const rzeczy = (n: number) => `${n} ${n === 1 ? "rzecz" : "rzeczy"}`;
    const naprawa = this.repairables();
    const suma = (l: RepairEntry[]) => l.reduce((a, r) => a + r.cost, 0);
    const rows: [string, string][] = [
      ["Twoje złoto", `${formatAmount(Inventory.gold)} g`],
      ["Na półce", this.stockAll.length ? rzeczy(this.stockAll.length) : "pusto"],
      [
        "Naprawa",
        !this.canRepairHere() ? "nie u tego kupca" : naprawa.length === 0 ? "nic nie wymaga" : `${rzeczy(naprawa.length)} · ${formatAmount(suma(naprawa))} g`,
      ],
    ];
    const actions: ShopAction[] = [];
    if (naprawa.length) {
      const noszone = naprawa.filter((r) => r.equipped);
      if (noszone.length && noszone.length < naprawa.length) {
        actions.push({
          label: `Napraw noszone · ${formatAmount(suma(noszone))} g`,
          tone: "neutral",
          disabled: suma(noszone) > Inventory.gold,
          onClick: () => this.repairAll(noszone),
        });
      }
      actions.push({
        label: `Napraw wszystko · ${formatAmount(suma(naprawa))} g`,
        disabled: suma(naprawa) > Inventory.gold,
        onClick: () => this.repairAll(naprawa),
      });
    }
    return {
      title: this.npc?.name ?? "Handel",
      rows,
      hint: "Dotknij towaru albo swojej rzeczy — karta, porównanie z tym, co nosisz, i cena staną tutaj.",
      actions,
    };
  }

  /**
   * Karta TOWARU. ⚠ Opisuje EGZEMPLARZ Z PÓŁKI (`stockQuality`) — ta sama
   * jakość idzie do ceny na kaflu, do karty i do kasy (`Inventory.buy`).
   */
  private showStockCard(index: number): boolean {
    const itemId = this.purchasable[index];
    if (!itemId) return false;
    const quality = this.stockQuality(itemId);
    const unit = buyPriceOf(itemId, quality);
    const stackable = !sellsOneAtATime(getItem(itemId).type);
    // ⚠ Sufit licznika: JEDEN STOS, zasobność i MIEJSCE — „Max" ma kupić tyle,
    //   ile naprawdę wejdzie i na ile stać, nie okrągłą stałą.
    let max = Math.max(1, Math.min(INVENTORY.stackSize, Math.floor(Inventory.gold / Math.max(1, unit))));
    while (max > 1 && !Inventory.hasRoomFor(itemId, max, quality)) max--;
    const qty = stackable ? Phaser.Math.Clamp(this.buyQty, 1, max) : 1;
    this.buyQty = qty;
    const koszt = unit * qty;
    const brakuje = koszt - Inventory.gold;
    // ⚠ `hasRoomFor` PRZED zakupem: `buy` przy częściowym miejscu zwraca resztę
    //   pieniędzy — transakcja w połowie jest gorsza od odmowy.
    const zmiesciSie = Inventory.hasRoomFor(itemId, qty, quality);
    const powod = brakuje > 0 ? `Brakuje ${formatAmount(brakuje)} g` : !zmiesciSie ? "Brak miejsca w plecaku" : undefined;
    this.details.show({
      card: buildItemCard(makeInstance(itemId, 1, quality)),
      iconKey: itemIconKey(itemId),
      refusal: powod,
      qty: stackable ? this.qtyFor(qty, max, (v) => (this.buyQty = v)) : undefined,
      actions: [
        {
          label: `Kup · ${formatAmount(koszt)} g`,
          disabled: !!powod,
          onClick: () => {
            if (!this.buy(itemId, qty)) return;
            this.pulse();
            // ⚠ `Inventory.buy` emituje zmianę synchronicznie, a `refresh`
            //   czyści zaznaczenie — stawiamy je z powrotem (asortyment kupca
            //   jest stały w obrębie wizyty, indeks się nie zmienia).
            this.select({ kind: "stock", index }, true);
          },
        },
      ],
    });
    return true;
  }

  private showBuybackCard(index: number): boolean {
    const e = this.buybackList()[index];
    if (!e) return false;
    const brakuje = e.price - Inventory.gold;
    const miejsce = Inventory.hasRoomFor(e.inst.itemId, e.inst.qty, qualityOf(e.inst));
    const powod = brakuje > 0 ? `Brakuje ${formatAmount(brakuje)} g` : !miejsce ? "Brak miejsca w plecaku" : undefined;
    this.details.show({
      card: buildItemCard(e.inst),
      iconKey: itemIconKey(e.inst.itemId),
      refusal: powod,
      actions: [{ label: `Odkup · ${formatAmount(e.price)} g`, disabled: !!powod, onClick: () => this.buyBack(index) }],
    });
    return true;
  }

  /** Karta rzeczy z PLECAKA — sprzedaż (i naprawa, gdy uszkodzona). */
  private showBagCard(index: number): boolean {
    const slot = Inventory.slots[index];
    if (!slot) return false;
    const def = getItem(slot.itemId);
    const stackable = !sellsOneAtATime(def.type) && slot.qty > 1;
    const qty = stackable ? Phaser.Math.Clamp(this.sellQty, 1, slot.qty) : sellsOneAtATime(def.type) ? 1 : slot.qty;
    this.sellQty = qty;
    const utarg = sellPriceOf(slot.itemId, qualityOf(slot)) * qty;
    const powod = this.questRefusal(slot.itemId, qty);
    const akcje: ShopAction[] = [];
    const naprawa = this.repairAction(slot);
    if (naprawa) akcje.push(naprawa);
    akcje.push({
      label: `Sprzedaj · ${formatAmount(utarg)} g`,
      disabled: !!powod,
      onClick: () => this.attemptSell(index, qty),
    });
    this.details.show({
      card: buildItemCard(slot),
      iconKey: itemIconKey(slot.itemId),
      refusal: powod ?? undefined,
      qty: stackable ? this.qtyFor(qty, slot.qty, (v) => (this.sellQty = v)) : undefined,
      actions: akcje,
    });
    return true;
  }

  /**
   * Karta rzeczy NA SOBIE: naprawa i sprzedaż. ⚠ Sprzedaż zdejmuje rzecz
   * z postaci — jedyna akcja w tym panelu, która to robi — więc ma ton
   * ostrzegawczy i okno potwierdzenia (`sellWorn`).
   */
  private showWornCard(slot: GearSlot): boolean {
    const inst = Equipment[slot];
    if (!inst) return false;
    const akcje: ShopAction[] = [];
    const naprawa = this.repairAction(inst);
    if (naprawa) akcje.push(naprawa);
    const powod = this.questRefusal(inst.itemId, 1);
    akcje.push({
      label: `Sprzedaj noszone · ${formatAmount(sellPriceOf(inst.itemId, qualityOf(inst)))} g`,
      tone: "danger",
      disabled: !!powod,
      onClick: () => this.sellWorn(slot),
    });
    this.details.show({
      card: buildItemCard(inst),
      iconKey: itemIconKey(inst.itemId),
      refusal: powod ?? undefined,
      layers: this.layerSwitch(slot),
      actions: akcje,
    });
    return true;
  }

  /**
   * „Napraw · X g" dla uszkodzonej rzeczy — albo `null`. ⚠ Kupiec, który nie
   * naprawia, dostaje WYSZARZONY przycisk z powodem: tu gracz o naprawę pyta
   * (inaczej niż na wizytówce, gdzie usługi po prostu nie ma).
   */
  private repairAction(inst: ItemInstance): ShopAction | null {
    const cost = repairCost(inst);
    if (cost <= 0) return null;
    if (!this.canRepairHere()) return { label: "Tu nie naprawia", tone: "neutral", disabled: true, onClick: () => {} };
    return {
      label: `Napraw · ${formatAmount(cost)} g`,
      tone: "neutral",
      disabled: cost > Inventory.gold,
      onClick: () => this.repairOne(inst, cost),
    };
  }

  /** Licznik ilości — przerysowuje kartę bez zdejmowania zaznaczenia. */
  private qtyFor(value: number, max: number, set: (v: number) => void): ShopQty {
    return {
      value,
      min: 1,
      max,
      onChange: (v: number) => {
        set(v);
        if (this.selection) this.select(this.selection, true);
      },
    };
  }

  /** Krótkie pulsowanie zaznaczonego kafla — potwierdzenie, że „Kup" wylądowało. */
  private pulse(): void {
    const s = this.selection;
    const t = s && (s.kind === "stock" || s.kind === "buyback") ? this.tiles[s.index] : null;
    if (!t) return;
    this.scene.tweens.add({ targets: t.bg, alpha: 0.6, duration: 90, yoyo: true, ease: "Quad.easeOut" });
  }

  /**
   * Licznik złota w nagłówku: stan + wydatek „(−x)" przy wybranym zakupie
   * albo odkupie, wpływ „(+x)" przy sprzedaży. ⚠ Wydatek znika, gdy nie stać —
   * wtedy mówi to odmowa nad przyciskiem.
   */
  private paintGold(): void {
    const L = this.L;
    if (!this.goldText) return;
    const { spend, gain } = this.pendingGold();
    if (spend > 0 && spend <= Inventory.gold) {
      this.goldDelta.setText(`(−${formatAmount(spend)})`).setColor(UI.spend);
    } else if (gain > 0) {
      this.goldDelta.setText(`(+${formatAmount(gain)})`).setColor(UI.green);
    } else this.goldDelta.setText("");
    this.goldText.setText(formatAmount(Inventory.gold));
    const stanX = this.goldDelta.text ? L.goldRight - this.goldDelta.width - 8 : L.goldRight;
    this.goldText.setX(stanX);
    this.goldCoin.setPosition(stanX - this.goldText.width - 8 - 11, L.headerY);
  }

  private pendingGold(): { spend: number; gain: number } {
    const s = this.selection;
    if (!s) return { spend: 0, gain: 0 };
    if (s.kind === "stock") {
      const id = this.purchasable[s.index];
      return { spend: id ? buyPriceOf(id, this.stockQuality(id)) * this.buyQty : 0, gain: 0 };
    }
    if (s.kind === "buyback") return { spend: this.buybackList()[s.index]?.price ?? 0, gain: 0 };
    if (s.kind === "worn") {
      const inst = Equipment[s.slot];
      return { spend: 0, gain: inst ? sellPriceOf(inst.itemId, qualityOf(inst)) : 0 };
    }
    const slot = Inventory.slots[s.index];
    return { spend: 0, gain: slot ? sellPriceOf(slot.itemId, qualityOf(slot)) * this.sellQty : 0 };
  }

  /* ══ KUPNO ══════════════════════════════════════════════════════════════ */

  /**
   * Jakość, w jakiej TEN kupiec trzyma towar. Wyprowadzona, nie losowana —
   * losowanie dałoby się „przewijać" wychodzeniem ze sklepu (`vendorQuality`).
   */
  private stockQuality(itemId: ItemId): QualityLevel {
    const def = getItem(itemId);
    const ranges = this.npc?.stockQuality;
    const range = def.type === "weapon" ? ranges?.weapon : def.type === "armor" ? ranges?.armor : undefined;
    const ustalona = this.npc?.stockQualityFor?.[itemId];
    if (ustalona !== undefined) {
      if (!range) return clampQuality(ustalona);
      const lo = Math.min(range[0], range[1]);
      const hi = Math.max(range[0], range[1]);
      return clampQuality(Math.min(Math.max(ustalona, lo), hi));
    }
    return vendorQuality(this.npc?.id ?? "", itemId, range);
  }

  /**
   * Kup `qty` sztuk i zapisz to jako jedyną cofalną transakcję.
   * ⚠ Jakość idzie do `lastTransaction`, bo od niej zależy CENA zwrotu.
   */
  private buy(itemId: ItemId, qty = 1): boolean {
    const quality = this.stockQuality(itemId);
    if (!Inventory.buy(itemId, qty, quality)) return false;
    this.lastTransaction = { itemId, qty, kind: "buy", quality };
    this.refreshUndo();
    return true;
  }

  /* ══ SPRZEDAŻ ═══════════════════════════════════════════════════════════ */

  /**
   * Czy sprzedaż `qty` sztuk złamie zadanie — powód albo `null`. Dwie reguły
   * (`Quests.isQuestItem` i `reservedCount`); liczy się też to, co gracz ma
   * NA SOBIE, bo cel „załóż" spełnia założony przedmiot.
   */
  private questRefusal(itemId: ItemId, qty: number): string | null {
    const held = Inventory.countItem(itemId) + (Equipment.isEquipped(itemId) ? 1 : 0);
    const lamie = held - qty < Quests.reservedCount(itemId);
    return Quests.isQuestItem(itemId) || lamie ? "To na zadanie — nie na sprzedaż" : null;
  }

  /** Odmowa sprzedaży z powodem (pływający napis) — strażnik ścieżek wykonania. */
  private refuseQuestItem(itemId: ItemId, qty = 1): boolean {
    const powod = this.questRefusal(itemId, qty);
    if (!powod) return false;
    this.refuseUndo(`${getItem(itemId).name} — ${powod.toLowerCase()}`);
    return true;
  }

  /**
   * Sprzedaj `qty` sztuk z pola `index`. ⚠ Bez okna „Czy na pewno?" — siatką
   * bezpieczeństwa jest „Cofnij" i Odkup. Potwierdzenie zostaje dla rzeczy
   * WYSOKIEJ jakości i amuletu (research §4: „przy przedmiotach jakości ≥ X").
   */
  private attemptSell(index: number, qty: number): void {
    const slot = Inventory.slots[index];
    if (!slot) return;
    const def = getItem(slot.itemId);
    const ile = sellsOneAtATime(def.type) ? 1 : Phaser.Math.Clamp(qty, 1, slot.qty);
    if (this.refuseQuestItem(slot.itemId, ile)) return;
    const cenna = def.type === "amulet" || (sellsOneAtATime(def.type) && qualityOf(slot) >= SHOP.confirmSellQuality);
    if (cenna) {
      const price = sellPriceOf(slot.itemId, qualityOf(slot));
      this.confirm.show(`Sprzedać ${def.name} (${describeQuality(slot)}) za ${formatAmount(price)} g?`, () => this.sellAt(index, 1));
      return;
    }
    this.sellAt(index, ile);
  }

  /**
   * Sprzedaj z KONKRETNEGO pola, po cenie tej sztuki (`Inventory.sellAt` zna
   * jakość). Egzemplarz trafia do Odkupu i do „Cofnij".
   * ⚠ Kopia egzemplarza zrobiona PRZED sprzedażą — po niej pola może nie być.
   */
  private sellAt(index: number, qty: number): boolean {
    const slot = Inventory.slots[index];
    if (!slot) return false;
    const itemId = slot.itemId;
    const quality = qualityOf(slot);
    const kopia: ItemInstance = { ...slot, qty };
    // ⚠ Jedna przebudowa NA KOŃCU: `sellAt` emituje zmianę synchronicznie,
    //   a licznik Odkupu na zakładce czytałby listę sprzed `rememberSold`.
    this.batching = true;
    let sprzedane = false;
    try {
      sprzedane = Inventory.sellAt(index, qty);
    } finally {
      this.batching = false;
    }
    if (!sprzedane) return false;
    this.rememberSold(kopia);
    this.lastTransaction = { itemId, qty, kind: "sell", quality, inst: sellsOneAtATime(getItem(itemId).type) ? kopia : undefined };
    this.refresh();
    return true;
  }

  /**
   * Sprzedaj rzecz NA SOBIE — zawsze za potwierdzeniem, bo zdejmuje ją
   * z postaci. `takeFrom`, nie `unequip`: sprzedaż nie może zależeć od wolnego
   * miejsca w plecaku, a rzecz i tak odchodzi.
   */
  private sellWorn(slot: GearSlot): void {
    const inst = Equipment[slot];
    if (!inst) return;
    const def = getItem(inst.itemId);
    if (this.refuseQuestItem(inst.itemId)) return;
    const price = sellPriceOf(inst.itemId, qualityOf(inst));
    this.confirm.show(`Sprzedać założony przedmiot: ${def.name} (${describeQuality(inst)}) za ${formatAmount(price)} g?`, () => {
      this.batching = true;
      let zdjete = false;
      try {
        zdjete = !!Equipment.takeFrom(slot);
        if (zdjete) Inventory.addGold(price);
      } finally {
        this.batching = false;
      }
      if (!zdjete) return;
      const kopia: ItemInstance = { ...inst, qty: 1 };
      this.rememberSold(kopia);
      this.lastTransaction = { itemId: inst.itemId, qty: 1, kind: "sell", quality: qualityOf(inst), inst: kopia };
      this.refresh();
    });
  }

  /* ══ ODKUP ══════════════════════════════════════════════════════════════ */

  /** Odkup TEGO kupca, najnowsze na górze. */
  private buybackList(): BuybackEntry[] {
    return this.buyback.get(this.npc.id) ?? [];
  }

  /** Zapamiętaj sprzedaną pozycję w Odkupie (cena z narzutem, `SHOP`). */
  private rememberSold(inst: ItemInstance): void {
    const unit = sellPriceOf(inst.itemId, qualityOf(inst));
    const jedna = Math.max(unit + 1, Math.ceil(unit * (1 + SHOP.buybackMarkup)));
    const lista = [{ inst, price: jedna * inst.qty }, ...this.buybackList()].slice(0, SHOP.buybackSize);
    this.buyback.set(this.npc.id, lista);
  }

  /** Usuń z Odkupu pozycję, która właśnie wróciła cofnięciem (ten sam egzemplarz albo stos). */
  private forgetSold(itemId: ItemId, qty: number, inst?: ItemInstance): void {
    const lista = [...this.buybackList()];
    const i = lista.findIndex((e) => (inst ? e.inst === inst : e.inst.itemId === itemId && e.inst.qty === qty));
    if (i >= 0) lista.splice(i, 1);
    this.buyback.set(this.npc.id, lista);
  }

  /**
   * Odkup pozycji — ⚠ atomowo jak cofnięcie: miejsce i złoto sprawdzone PRZED
   * mutacją. Egzemplarz sztuki wraca przez `addInstance` (jakość i zużycie).
   */
  private buyBack(index: number): void {
    const e = this.buybackList()[index];
    if (!e) return;
    const name = getItem(e.inst.itemId).name;
    if (Inventory.gold < e.price) return this.refuseUndo(`Brakuje ${formatAmount(e.price - Inventory.gold)} g, żeby odkupić`);
    if (!Inventory.hasRoomFor(e.inst.itemId, e.inst.qty, qualityOf(e.inst))) return this.refuseUndo(`${name} — brak miejsca w plecaku`);
    this.batching = true;
    let wrocil = false;
    try {
      // ⚠ Kopia, nie ten sam obiekt: pozycja Odkupu i „Cofnij" mogą trzymać
      //   referencję do tego samego egzemplarza — żywy obiekt w plecaku
      //   (naprawiany w miejscu) nie może być nim samym.
      wrocil = sellsOneAtATime(getItem(e.inst.itemId).type)
        ? Inventory.addInstance({ ...e.inst })
        : Inventory.addItem(e.inst.itemId, e.inst.qty, qualityOf(e.inst)) === 0;
      if (wrocil) Inventory.spendGold(e.price);
    } finally {
      this.batching = false;
    }
    // Nieosiągalne przy zgodnym `hasRoomFor` (`sklep_cofniecie` §5e) — strażnik.
    if (!wrocil) return this.refuseUndo(`${name} — brak miejsca w plecaku`);
    // ⭐ Z listy znika DOPIERO po udanym odkupie.
    const lista = [...this.buybackList()];
    lista.splice(index, 1);
    this.buyback.set(this.npc.id, lista);
    // Odkup nie jest „ostatnią transakcją" do cofnięcia — ma własną cenę.
    this.lastTransaction = null;
    this.refresh();
  }

  /* ══ NAPRAWA ════════════════════════════════════════════════════════════ */

  /**
   * Czy ten kupiec w ogóle naprawia. Celowo zgrubnie — „sprzedaje broń"
   * (`docs/jakosc_wykonania.md` §5.2: bramka per rzemiosło to otwarte pytanie).
   */
  private canRepairHere(): boolean {
    return this.npc.stock.some((id) => getItem(id).type === "weapon");
  }

  /**
   * Wszystko, co ten kupiec może naprawić — **na sobie (oba zestawy) ORAZ
   * w plecaku**. ⚠ Plecak jest tu, bo bez niego „Napraw wszystko" byłoby
   * kłamstwem. Referencje do ŻYWYCH egzemplarzy — `repairInstance` mutuje.
   */
  private repairables(): RepairEntry[] {
    if (!this.canRepairHere()) return [];
    const out: RepairEntry[] = [];
    const sloty: GearSlot[] = [...EQUIP_SLOTS, ...STOW_SLOTS];
    for (const slot of sloty) {
      const inst = Equipment[slot];
      if (!inst) continue;
      const cost = repairCost(inst);
      if (cost > 0) out.push({ inst, cost, equipped: true });
    }
    for (const inst of Inventory.slots) {
      if (!inst || !hasDurability(inst.itemId)) continue;
      const cost = repairCost(inst);
      if (cost > 0) out.push({ inst, cost, equipped: false });
    }
    return out;
  }

  /** Napraw jedną rzecz — kwota stoi na przycisku, bez okna potwierdzenia. */
  private repairOne(inst: ItemInstance, cost: number): void {
    if (!Inventory.spendGold(cost)) return this.refuseUndo(`Brakuje złota: ${formatAmount(cost)} g`);
    repairInstance(inst);
    Equipment.emitChanged();
    Inventory.emitChanged();
  }

  /**
   * ⚠ **Wszystko albo nic**: brak złota nie naprawia CZĘŚCI rzeczy (ta sama
   * zasada, co przy nauce umiejętności) — dlatego jest też tańsze „Noszone".
   */
  private repairAll(lista: RepairEntry[]): void {
    if (lista.length === 0) return;
    const suma = lista.reduce((a, r) => a + r.cost, 0);
    if (!Inventory.spendGold(suma)) return this.refuseUndo(`Brakuje złota: ${formatAmount(suma)} g`);
    for (const r of lista) repairInstance(r.inst);
    Equipment.emitChanged();
    Inventory.emitChanged();
    floatingText(this.scene, { x: uiW(this.scene) / 2, y: uiH(this.scene) / 2 - 40, text: `Naprawiono: ${lista.length}`, color: UI.green, depth: 1500 });
  }

  /* ══ COFNIĘCIE ══════════════════════════════════════════════════════════ */

  /**
   * Odmów z POWODEM — i **zostaw transakcję na miejscu**, żeby gracz mógł
   * spróbować jeszcze raz. Jeden kanał odmowy w całym panelu.
   */
  private refuseUndo(powod: string): void {
    floatingText(this.scene, { x: uiW(this.scene) / 2, y: uiH(this.scene) / 2 - 40, text: powod, color: UI.danger, depth: 1500 });
  }

  /**
   * Czy `takeBackBought` NA PEWNO się uda — sprawdzone bez ruszania plecaka.
   * Istnieje po to, żeby cofnięcie było ATOMOWE.
   */
  private canTakeBack(itemId: ItemId, qty: number, quality: QualityLevel): boolean {
    if (qty <= 0) return false;
    if (!sellsOneAtATime(getItem(itemId).type)) return Inventory.countItem(itemId) >= qty;
    let widziane = 0;
    for (const s of Inventory.slots) {
      if (s && s.itemId === itemId && qualityOf(s) === quality) widziane += s.qty;
      if (widziane >= qty) return true;
    }
    return false;
  }

  /**
   * Cofnij ostatni zakup albo sprzedaż — siatka bezpieczeństwa, nie historia.
   *
   * ⭐⭐ **OPERACJA ATOMOWA (`OI-133`).** Albo w całości — przedmiot wraca,
   * złoto się zgadza, cofnięcie ZUŻYTE — albo **nie rusza niczego**, a gracz
   * dostaje powód. ⚠ O miejsce pyta `Inventory.hasRoomFor` (zna gabaryt).
   * ⚠ Etap E: sprzedana SZTUKA wraca jako TEN egzemplarz (`addInstance`,
   * z zużyciem) i znika z Odkupu. Pilnuje `tools/sklep_cofniecie.mjs` §5.
   */
  private undoLastTransaction(): void {
    const t = this.lastTransaction;
    if (!t) return;
    const def = getItem(t.itemId);

    if (t.kind === "buy") {
      // ⚠ Zwrot `buyPriceOf(itemId, jakość)`, nigdy `def.buyPrice`.
      if (!("buyPrice" in def)) {
        this.refuseUndo(`${def.name} — kupiec tego nie odkupi`);
        return;
      }
      if (!this.canTakeBack(t.itemId, t.qty, t.quality)) {
        this.refuseUndo(`${def.name} — nie ma już czego zwrócić`);
        return;
      }
      if (!this.takeBackBought(t.itemId, t.qty, t.quality)) {
        // Nieosiągalne przy zgodnym `canTakeBack` — strażnik, nie ścieżka.
        this.refuseUndo(`${def.name} — nie udało się zwrócić`);
        return;
      }
      Inventory.addGold(buyPriceOf(t.itemId, t.quality) * t.qty);
    } else {
      const cost = sellPriceOf(t.itemId, t.quality) * t.qty;
      if (Inventory.gold < cost) {
        this.refuseUndo(`Brakuje ${cost - Inventory.gold} g, żeby odkupić`);
        return;
      }
      if (!Inventory.hasRoomFor(t.itemId, t.qty, t.quality)) {
        this.refuseUndo(`${def.name} — brak miejsca w plecaku`);
        return;
      }
      // ⭐ Sztuka wraca jako TEN egzemplarz (jakość + zużycie); stos — z jakością.
      const leftover = t.inst ? (Inventory.addInstance({ ...t.inst }) ? 0 : t.qty) : Inventory.addItem(t.itemId, t.qty, t.quality);
      if (leftover > 0) {
        // Nieosiągalne, dopóki `hasRoomFor` i dodawanie liczą to samo — strażnik.
        if (leftover < t.qty) this.takeBackBought(t.itemId, t.qty - leftover, t.quality);
        this.refuseUndo(`${def.name} — brak miejsca w plecaku`);
        return;
      }
      Inventory.spendGold(cost);
      this.forgetSold(t.itemId, t.qty, t.inst);
    }

    // ⭐ Dopiero TUTAJ cofnięcie jest zużyte — po stronie, która się udała.
    this.lastTransaction = null;
    this.refreshUndo();
    this.refresh();
  }

  /**
   * Zdejmij z plecaka `qty` sztuk `itemId` **w tej konkretnej jakości** —
   * `removeItem` brałby PIERWSZY pasujący slot, czyli potrafił zabrać lepszą
   * sztukę niż kupiona.
   */
  private takeBackBought(itemId: ItemId, qty: number, quality: QualityLevel): boolean {
    if (qty <= 0) return false;
    if (!sellsOneAtATime(getItem(itemId).type)) return Inventory.removeItem(itemId, qty);
    const pasuje = (i: number) => {
      const s = Inventory.slots[i];
      return s !== null && s.itemId === itemId && qualityOf(s) === quality;
    };
    let zostalo = qty;
    for (let i = 0; i < Inventory.slots.length && zostalo > 0; i++) {
      while (zostalo > 0 && pasuje(i) && Inventory.takeAt(i)) zostalo--;
    }
    return zostalo === 0;
  }

  /**
   * Przycisk „↩ Cofnij" w nagłówku nad kartą — pusty przez większość czasu.
   * ⭐ Napis dobiera się do miejsca: z nazwą rzeczy → sam rodzaj → samo
   * „↩ Cofnij" (na węższym telefonie pas ma ~100 j.).
   */
  private refreshUndo(): void {
    if (!this.undoRoot) return;
    this.undoRoot.removeAll(true);
    const t = this.lastTransaction;
    if (!t) return;
    const r = this.L.undo;
    const verb = t.kind === "buy" ? "zakup" : "sprzedaż";
    const box = this.scene.add
      .rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h, 0x3a2a2a, 1)
      .setStrokeStyle(1, 0x8a6a3a, 0.9)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(r.x + r.w / 2, r.y + r.h / 2, "", textStyle({ fontSize: fontPx("small"), color: UI.goldLight, fontStyle: "bold" }))
      .setOrigin(0.5);
    for (const napis of [`↩ Cofnij ${verb}: ${getItem(t.itemId).name}`, `↩ Cofnij ${verb}`, "↩ Cofnij"]) {
      text.setText(napis);
      if (text.width <= r.w - 16) break;
    }
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      Sfx.play("ui-click");
      this.undoLastTransaction();
    });
    this.undoRoot.add([box, text]);
  }

  /* ══ PRZEWIJANIE ════════════════════════════════════════════════════════ */

  /**
   * Którą strefę trafia punkt EKRANU. ⚠⚠ **DWA przeliczenia**:
   * `(p.x / uiScale() − container.x) / container.scale` (`src/ui/CLAUDE.md`).
   */
  private zoneAt(px: number, py: number): ScrollZone | null {
    if (!this.container.visible) return null;
    const s = this.container.scale;
    const x = (px / uiScale() - this.container.x) / s;
    const y = (py / uiScale() - this.container.y) / s;
    for (const zone of ["merchant", "player"] as const) {
      const G = zone === "merchant" ? this.L.merchant : this.L.player;
      const okno = this.windowOf(zone);
      if (x >= G.left - 4 && x <= G.left + G.width + 4 && y >= okno.top && y <= okno.bottom) return zone;
    }
    const b = this.details?.bodyRect;
    if (b && x >= b.x - 4 && x <= b.x + b.w + 8 && y >= b.y && y <= b.y + b.h) return "details";
    return null;
  }

  private onScrollStart(p: Phaser.Input.Pointer): void {
    if (!this.container.visible || this.scrollPointerId !== null) return;
    this.scrollMoved = false;
    const zone = this.zoneAt(p.x, p.y);
    if (!zone) return;
    this.scrollPointerId = p.id;
    this.scrollZone = zone;
    this.scrollLastY = this.scrollStartY = p.y;
  }

  private onScrollMove(p: Phaser.Input.Pointer): void {
    if (this.scrollPointerId !== p.id || !this.scrollZone) return;
    const k = uiScale() * this.container.scale;
    if (!this.scrollMoved && Math.abs(p.y - this.scrollStartY) / k > SLOP) this.scrollMoved = true;
    if (!this.scrollMoved) return;
    const dy = (p.y - this.scrollLastY) / k;
    this.scrollLastY = p.y;
    if (this.scrollZone === "details") this.details.scrollBy(-dy);
    else if (this.scrollZone === "merchant") this.setScroll("merchant", this.merchantScroll - dy);
    else this.setScroll("player", this.playerScroll - dy);
  }

  private onScrollEnd(p: Phaser.Input.Pointer): void {
    if (this.scrollPointerId !== p.id) return;
    this.scrollPointerId = null;
    this.scrollZone = null;
    // ⚠ `scrollMoved` gaśnie dopiero przy NASTĘPNYM wciśnięciu: Phaser podaje
    //   `GAMEOBJECT_POINTER_UP` kafla przed `POINTER_UP` sceny, więc kafel
    //   zdążył zapytać, czy to było przewinięcie.
  }

  private onScrollWheel(p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number): void {
    const zone = this.zoneAt(p.x, p.y);
    const krok = Math.sign(dy) * (this.L.merchant.grid.rowH + this.L.merchant.grid.gap);
    if (zone === "details") this.details.scrollBy(Math.sign(dy) * 40);
    else if (zone === "merchant") this.setScroll("merchant", this.merchantScroll + krok);
    else if (zone === "player") this.setScroll("player", this.playerScroll + krok);
  }

  /* ══ MASKI ══════════════════════════════════════════════════════════════ */

  /**
   * ⚠ Maska rysuje się we WSPÓŁRZĘDNYCH EKRANU (sceny UI) i nie jedzie za
   * panelem sama — przerysowanie przy każdym `reposition()`.
   * ⛔ `uiScale()` tu NIE wchodzi (kamera zmniejsza maskę razem z panelem);
   * wchodzi wyłącznie `container.scale`.
   */
  private refreshMasks(): void {
    const s = this.container.scale;
    const cx = this.container.x;
    const cy = this.container.y;
    for (const [maska, G] of [
      [this.tilesMaskG, this.L.merchant],
      [this.bagMaskG, this.L.player],
    ] as const) {
      maska.clear().fillStyle(0xffffff).fillRect(cx + (G.centerX - G.gridW / 2 - 2) * s, cy + G.windowTop * s, (G.gridW + 4) * s, G.windowH * s);
    }
  }

  protected reposition(): void {
    super.reposition();
    if (!this.tilesMaskG) return;
    this.refreshMasks();
    this.merchantStrip?.refreshMask();
    this.bagStrip?.refreshMask();
    this.details?.refreshMask(this.container.x, this.container.y, this.container.scale);
  }

  /* ══ POMOC POD ⓘ ════════════════════════════════════════════════════════ */

  private toggleHelp(): void {
    // ⚠ Nowo zbudowana nakładka jest UKRYTA, więc pierwsze tapnięcie ją pokazuje.
    if (!this.helpOverlay) this.helpOverlay = this.buildHelp();
    this.helpOverlay.setVisible(!this.helpOverlay.visible);
  }

  private buildHelp(): Phaser.GameObjects.Container {
    const c = this.scene.add.container(0, 0);
    const w = Math.min(this.w - 60, 900);
    const tlo = this.scene.add.rectangle(0, 0, this.w, this.h, 0x0a0c12, 0.86).setInteractive();
    // Tapnięcie gdziekolwiek zamyka — pomoc nie potrzebuje własnego ✕.
    tlo.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      c.setVisible(false);
    });
    c.add(tlo);
    // ⚠⚠ **Pomoc odpowiada na PYTANIA GRACZA, nie opisuje ekranu**, a hasła
    //   są DYKTOWANE przez autora (2026-09-19) — osiem, w tym brzmieniu.
    //   Etap E zmienił wyłącznie zdania, które przestały być prawdą. ⛔ Nie
    //   dopisuj dziewiątego hasła i ⛔ nie wracaj do słów `L1`/`L2`/`L3`.
    const sekcje: [string, string][] = [
      ["JAK KUPIĆ", "Dotknij towaru — po prawej zobaczysz, co to jest i ile kosztuje. Przycisk z ceną kupuje."],
      ["JAK SPRZEDAĆ", "Dotknij swojej rzeczy w plecaku — po prawej zobaczysz, ile za nią dostaniesz. Rzeczy, które masz na sobie, są w zakładce „Na sobie”."],
      ["CENY", "Kupujesz drożej, niż sprzedajesz. Stan i wykonanie mogą zmieniać cenę."],
      ["PORÓWNANIE", "Przy rzeczy, którą możesz założyć, karta pokazuje „nowe → noszone” — broń i tarczę z oboma zestawami. Zielone oznacza lepszą wartość dla Ciebie — przy obciążeniu mniej znaczy lepiej."],
      ["DUŻE RZECZY", "Duże przedmioty mogą zajmować dwa pola w plecaku. Ich większy rozmiar jest zachowany także przy wyposażeniu — to wciąż jeden przedmiot."],
      ["PANCERZ", "Niektóre części ciała mogą nosić więcej niż jeden element pancerza. Kropki pod kaflem w „Na sobie” pokazują zajęte miejsca."],
      ["NAPRAWA", "Uszkodzone rzeczy mają żółtą albo czerwoną ramkę. Naprawisz je na karcie albo wszystkie naraz, gdy nic nie jest wybrane. Nie każdy kupiec świadczy tę usługę."],
      ["COFNIĘCIE", "Ostatnią transakcję można cofnąć do końca rozmowy. Rzeczy sprzedane wcześniej odkupisz w zakładce Odkup — trochę drożej."],
    ];
    const kolW = (w - 60) / 2;
    const polowa = Math.ceil(sekcje.length / 2);
    const kolumny = [sekcje.slice(0, polowa), sekcje.slice(polowa)];
    const teksty: Phaser.GameObjects.Text[] = [];
    let najnizszy = 0;
    for (let k = 0; k < kolumny.length; k++) {
      const x = -w / 2 + 20 + k * (kolW + 20);
      let y = 0;
      for (const [tytulS, tresc] of kolumny[k]) {
        const th = this.scene.add.text(x, y, tytulS, textStyle({ fontSize: fontPx("small"), color: UI.gold, fontStyle: "bold" })).setOrigin(0, 0);
        const t = this.scene.add.text(x, y + th.height + 2, tresc, textStyle({ fontSize: fontPx("small"), color: UI.text, wordWrap: { width: kolW } })).setOrigin(0, 0);
        teksty.push(th, t);
        y += th.height + 2 + t.height + 12;
      }
      najnizszy = Math.max(najnizszy, y);
    }
    const h = Math.min(this.h - 20, 56 + najnizszy + 30);
    const gora = -h / 2 + 52;
    for (const t of teksty) t.y += gora;
    const ramka = this.scene.add.rectangle(0, 0, w, h, UI.bg, 0.98).setStrokeStyle(2, UI.goldNum, 0.8);
    const tytul = this.scene.add.text(0, -h / 2 + 26, "JAK DZIAŁA HANDEL", textStyle({ fontSize: fontPx("title"), color: UI.gold, fontStyle: "bold" })).setOrigin(0.5);
    c.add([ramka, tytul, ...teksty]);
    c.add(this.scene.add.text(0, h / 2 - 16, "dotknij, żeby zamknąć", textStyle({ fontSize: fontPx("small"), color: UI.muted })).setOrigin(0.5));
    this.container.add(c);
    return c.setVisible(false);
  }
}

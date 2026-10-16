import Phaser from "phaser";
import { Dialogue } from "../core/Dialogue";
import { Quests, getQuest, goalOf, objectiveLabel, objectivesOf, questGreetingsOf, rewardText, type QuestId } from "../core/Quests";
import { UI, TYPE, fontPx, textStyle, uiW, uiH } from "../core/theme";
import { HUD_LAYOUT, TOPIC_GROUPS } from "../config/GameConfig";
import type { NpcDef, Topic } from "../core/Npcs";
import { Sfx } from "../core/Sfx";
import { FRAME, computeRailLayout, talkColumn } from "./FrameLayout";
import { Rail, type RailTab } from "./Rail";
import { drawUiIcon, type UiIconKind } from "./UiIcons";

/** Usługi rozmówcy — kolejność tej unii NIE jest kolejnością na ekranie;
 *  tę ustala `NpcDialog` (stała: Handel, Zadania, Szkolenie, Mistrzostwo). */
export type ServiceId = "shop" | "quests" | "trainer" | "mastery";
/** Zakładka ramy: rozmowa (zakładka 0) albo usługa. */
export type FrameTab = "talk" | ServiceId;

/**
 * Usługa rozmówcy — Handel, Zadania, Szkolenie, Mistrzostwo. Buduje je
 * `NpcDialog` (tylko on zna stan zadań, trenera i rang), rama je rysuje.
 *
 * ⭐ **Od 2026-10-14 usługa jest WYPOWIEDZIĄ GRACZA** (`line`: „Pokaż, co masz
 * na sprzedaż.”), wierszem w tej samej kolumnie co pytania — autor: „dialog
 * ma wyglądać jak dialog, a nie jak zakładki”. Do tej daty był kaflem
 * z rzeczownikiem („Handel”) w bloku usług i zakładką szyny.
 */
export interface ServiceRow {
  id: ServiceId;
  /** Co gracz mówi, żeby tę usługę otworzyć — wiersz kolumny rozmowy. */
  line: string;
  /** Krótka nazwa (dla ikony i podglądu w kodzie) — nie stoi na ekranie rozmowy. */
  label: string;
  icon: UiIconKind;
  /** Krótki stan pod podpisem (≤ ~16 znaków: „do oddania", „2 do nauki"). */
  note?: string;
  noteColor?: string;
  /** „!" nowe zadanie, „?" do oddania, „+" do kupienia — alfabet WoW-a. */
  marker?: { text: string; color: string };
}

/** Gdzie w rozmowie stoi gracz: korzeń, wnętrze grupy tematów, omówione. */
type Level =
  | { kind: "root" }
  | { kind: "group"; id: string }
  | { kind: "archive" }
  /** ⭐ D4 (etap F): oferta zadania — opis w pasie, „Biorę to." w kolumnie. */
  | { kind: "offer"; id: QuestId };
type RowKind = "quest" | "follow" | "plain" | "group" | "nav";

interface RowSpec {
  text: string;
  kind: RowKind;
  /** Ikona RODZAJU przed zdaniem (dymek — pytanie, moneta — handel…). */
  icon?: UiIconKind;
  /** Pożegnanie: działa także w oknie blokady po nowej wypowiedzi. */
  noGuard?: boolean;
  note?: string;
  noteColor?: string;
  marker?: { text: string; color: string };
  onClick: () => void;
}

/* ── Wymiary (jednostki wirtualne UI; telefon: 1257×580) ──────────────────
 * Liczby z researchu `docs/ui_mobile_research.md` §2: pas wypowiedzi ≤ ⅓
 * wysokości ekranu, 3–4 wiersze na stronę, kolumna odpowiedzi pod prawym
 * kciukiem, wiersz ≥ 48 dp (`HUD_LAYOUT.minTouch`), „Bywaj.” osobno.
 * Kolumna i szyna: `FrameLayout` (jeden dom). */
const M = FRAME.marginY;
const ROW_GAP = 8;
/** Wcięcie tekstu wiersza — miejsce na ikonę rodzaju (dymek, moneta…). */
const ROW_TEXT_INSET = 44;
/** Przerwa nad „Bywaj.” — ta sama, co nad wyjściem szyny. */
const LEAVE_GAP = FRAME.rail.exitGap;
/** Oddech między blokiem usług a pytaniami (blok jest STAŁY, pytania płyną). */
const SECTION_GAP = 14;
/** Rozmiary z ról `theme.TYPE` (etap B): proza 21 j. ≈ 14,9 dp, odpowiedzi
 *  `body` 18 j. ≈ 12,8 dp, imię `name` 21 j. (było 14/13 j. monospace). */
const SPEECH_PX = TYPE.prose;
const SPEECH_LINE_GAP = 6;
/** Wierszy wypowiedzi na stronę — więcej idzie na następną stronę. */
const LINES_PER_PAGE = 4;
const NAME_PX = TYPE.name;
/** Po każdej nowej wypowiedzi wiersze odpowiedzi ignorują puszczenie palca
 *  przez tyle ms — tapnięcie przewijające tekst nie może trafić w odpowiedź,
 *  która pojawiła się pod palcem (pułapka z researchu: Diablo Immortal). */
const INPUT_GUARD_MS = 300;
/** Przejście kolumna → szyna (research §4.1: 200–250 ms, nie „nowe okno"). */
const NARROW_MS = 200;
/** Głębokość szyny: NAD podwidokami (1400), pod kartą przedmiotu (2000). */
const RAIL_DEPTH = 1402;

/** `**słowo**` w configu to akcent autora — Phaser `Text` nie składa pogrubień
 *  w środku napisu, bez tego gracz widziałby gwiazdki. */
const plain = (s: string): string => s.replace(/\*\*/g, "");

/** „1 nowy temat", „3 nowe tematy", „5 nowych tematów". */
function newTopics(n: number): string {
  const d = n % 10;
  const s = n % 100;
  if (n === 1) return "1 nowy temat";
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return `${n} nowe tematy`;
  return `${n} nowych tematów`;
}

/**
 * ⭐ **RAMA ROZMOWY: rozmowa to zakładka 0, usługi to kolejne zakładki**
 * (etap C, 2026-10-13; research `docs/ui_mobile_research.md` §8 R3,
 * `docs/research/ui_dialogue_frame_research.md` §4).
 *
 * Jedna prawa kolumna, DWIE szerokości:
 * - **Rozmowa** — pas wypowiedzi na dole (≤ ⅓ ekranu), kolumna odpowiedzi
 *   pod prawym kciukiem: pytania (do zadania pierwsze), grupy tematów (D14),
 *   usługi jako WYPOWIEDZI GRACZA („Pokaż, co masz na sprzedaż.” — od
 *   2026-10-14; wcześniej blok kafli „Handel”, „Szkolenie”), „Porozmawiajmy o…” (wcześniej „Omówione”),
 *   „Bywaj.”.
 * - **Usługa** — kolumna zwęża się do SZYNY (`Rail`): imię rozmówcy u góry,
 *   JEDEN kafel „‹ Rozmowa” (powrót), „Bywaj.” na dole (od 2026-10-14;
 *   wcześniej zakładki wszystkich usług). Treść usługi stoi na lewo od szyny,
 *   bez własnego tytułu i ✕.
 *
 * ⚠⚠ **Usługi stoją w STAŁEJ kolejności i nie skaczą wg pilności.** Do
 * 2026-10-13 wiersz z nagrodą („?" do oddania) szedł na górę listy — kciuk nie
 * wyrabiał odruchu. Pilność niesie dziś ZNACZNIK na kaflu, nie miejsce.
 *
 * ── Z sesji 2026-10-12 (bez zmian, bo z pomiaru) ──────────────────────────
 * Strony wypowiedzi na granicach ZDAŃ (mierzone, nie liczone znakami); ekran
 * pokazuje CHWILĘ rozmowy, nie spis tematów (`OI-87`); blokada
 * `INPUT_GUARD_MS` po nowej wypowiedzi; „Bywaj.” pod przerwą.
 *
 * Rama nie pauzuje i nie wznawia gry — pauza należy do rozmowy (`NpcDialog`).
 */
export class ConversationSheet {
  private readonly container: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly band: Phaser.GameObjects.Rectangle;
  private readonly bandLine: Phaser.GameObjects.Rectangle;
  private readonly column: Phaser.GameObjects.Rectangle;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly playerLine: Phaser.GameObjects.Text;
  private readonly speech: Phaser.GameObjects.Text;
  private readonly pageMark: Phaser.GameObjects.Text;
  private readonly caption: Phaser.GameObjects.Text;
  private readonly rows: Phaser.GameObjects.Container;
  /** Niewidoczny napis do MIERZENIA wierszy przed podziałem na strony. */
  private readonly measurer: Phaser.GameObjects.Text;
  /** Szyna trybu usługi — ta sama kolumna, zwężona. */
  private readonly rail: Rail<FrameTab>;

  private npc: NpcDef | null = null;
  private opening = "";
  private services: () => ServiceRow[] = () => [];
  private current: Topic | null = null;
  private level: Level = { kind: "root" };
  /** Aktywna usługa; `null` = zakładka „Rozmowa". */
  private service: ServiceId | null = null;
  /** Czy aktywna usługa prosi o szynę samych ikon (gęsta treść — Handel). */
  private dense = false;
  private pages: string[] = [""];
  private pageIndex = 0;
  /** Czego dotyczą `pages` — przebudowa listy nie może cofać strony. */
  private pagesKey = "";
  /** Która strona listy pytań (front bywa dłuższy niż kolumna). */
  private frontPage = 0;
  private guardUntil = 0;
  open = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly opts: {
      /** „Bywaj.” — zamyka CAŁĄ rozmowę (decyduje `NpcDialog`). */
      onLeave: () => void;
      /** Wybór zakładki: „Rozmowa" albo usługa (decyduje `NpcDialog`). */
      onTab: (tab: FrameTab) => void;
    },
  ) {
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1400).setVisible(false);

    // ⚠ Przyciemnienie jest INTERAKTYWNE na całym ekranie: bez tego dotknięcie
    // świata nad pasem trafiałoby w drążek ruchu przez otwartą rozmowę
    // (`docs/systemy/ui.md` §3). Tapnięcie w świat = następna strona.
    this.dim = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.28).setOrigin(0).setInteractive();
    this.dim.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.nextPage();
    });

    this.band = scene.add.rectangle(0, 0, 10, 10, 0x10131b, 0.94).setOrigin(0).setInteractive();
    this.band.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.nextPage();
    });
    // Jedna cienka złota krawędź u góry pasa zamiast ramki — oddziela tekst od
    // świata bez ozdób (research: bez ciężkich ramek, tło półprzezroczyste).
    this.bandLine = scene.add.rectangle(0, 0, 10, 2, UI.goldNum, 0.55).setOrigin(0);

    this.column = scene.add.rectangle(0, 0, 10, 10, 0x10131b, 0.97).setOrigin(0).setInteractive();
    this.column.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    this.nameText = scene.add.text(0, 0, "", textStyle({ fontSize: fontPx("name"), color: UI.gold, fontStyle: "bold" }));
    this.playerLine = scene.add.text(0, 0, "", textStyle({ fontSize: fontPx("body"), color: UI.goldLight, fontStyle: "italic" }));
    this.speech = scene.add
      .text(0, 0, "", textStyle({ fontSize: fontPx("prose"), color: "#e4e8f0" }))
      .setLineSpacing(SPEECH_LINE_GAP);
    this.pageMark = scene.add.text(0, 0, "", textStyle({ fontSize: fontPx("small"), color: UI.goldLight })).setOrigin(1, 1);
    // Okruszek nad listą w grupie („Zioła · 3 nowe tematy") — TEKST, nie
    // wiersz: nie zabiera miejsca, którego kolumnie brakuje.
    this.caption = scene.add.text(0, 0, "", textStyle({ fontSize: fontPx("small"), color: UI.gold, fontStyle: "bold" }));
    this.measurer = scene.add
      .text(0, 0, "", textStyle({ fontSize: fontPx("prose") }))
      .setLineSpacing(SPEECH_LINE_GAP)
      .setVisible(false);
    this.rows = scene.add.container(0, 0);

    this.container.add([
      this.dim, this.band, this.bandLine, this.column,
      this.nameText, this.playerLine, this.speech, this.pageMark, this.caption, this.rows,
    ]);

    this.rail = new Rail<FrameTab>(scene, {
      depth: RAIL_DEPTH,
      exitLabel: "Bywaj.",
      onSelect: (tab) => this.opts.onTab(tab),
      onExit: () => this.opts.onLeave(),
    });

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.measurer.destroy();
    });
  }

  /* ── Otwieranie i zakładki ─────────────────────────────────────────────── */

  show(npc: NpcDef, opening: string, services: () => ServiceRow[]): void {
    this.open = true;
    this.npc = npc;
    this.opening = opening;
    this.services = services;
    this.current = null;
    this.level = { kind: "root" };
    this.service = null;
    this.frontPage = 0;
    this.pagesKey = "";
    this.rail.setVisible(false);
    this.container.setVisible(true);
    this.render();
  }

  /**
   * Zakładka „Rozmowa" — powrót z usługi **dokładnie w to miejsce, w którym
   * gracz był** (research §4.2), także wewnątrz grupy. Nowe powitanie tylko
   * wtedy, gdy gracz jeszcze o nic nie zapytał — oddanie zadania w podwidoku
   * zmienia to, co NPC mówi na powitanie.
   */
  resume(opening: string): void {
    if (!this.npc) return;
    this.open = true;
    this.service = null;
    if (!this.current) {
      this.opening = opening;
      this.pagesKey = "";
    }
    this.rail.setVisible(false);
    this.container.setVisible(true);
    this.render();
  }

  /**
   * Zakładka usługi: kolumna zwęża się do szyny. Gdy tło ZWĘŻA się (z rozmowy
   * do szyny albo z szyny z podpisami do samych ikon), szerokie tło ZJEŻDŻA
   * do nowej szerokości (`NARROW_MS`) — rama ma czytać się jako ta sama
   * kolumna, nie jako nowe okno.
   *
   * ⚠ `dense` (autor 2026-10-13: „w Handlu same ikony"): usługa gęstej treści
   * dostaje szynę samych ikon — +112 j. szerokości dla sklepu. Zwija się
   * podpis i imię; kafle, ich kolejność i prawa krawędź zostają.
   * ⚠ Szyna rozmowy NIE ma sakiewki (autor: „złoto jest częścią sklepu") —
   * złoto pokazuje widok, który je wydaje (Handel, Szkolenie, Mistrzostwo).
   */
  showService(id: ServiceId, dense = false): void {
    if (!this.npc) return;
    const W = uiW(this.scene);
    const H = uiH(this.scene);
    const fromBgX = this.service === null
      ? talkColumn(W, H).bgX
      : computeRailLayout(W, H, 0, this.dense).bgX;
    this.service = id;
    this.dense = dense;
    this.container.setVisible(false);
    this.rail.setIdentity(this.npc.name, null);
    this.rail.setTabs(this.tabs(), id, dense);
    this.rail.setVisible(true);
    const toBgX = computeRailLayout(W, H, 0, dense).bgX;
    if (toBgX > fromBgX + 1) this.playNarrow(fromBgX);
  }

  hide(): void {
    this.open = false;
    this.service = null;
    this.container.setVisible(false);
    this.rail.setVisible(false);
  }

  /** Krok wstecz WEWNĄTRZ rozmowy: grupa albo omówione → korzeń. `false` =
   *  krok należy do `NpcDialog` (czyli zamknięcie rozmowy). */
  back(): boolean {
    if (!this.open || this.service !== null || this.level.kind === "root") return false;
    // „Jeszcze nie" z oferty: opis zadania schodzi z pasa — NPC wraca do
    // powitania, zamiast dalej wisieć na nieprzyjętej prośbie.
    if (this.level.kind === "offer") this.current = null;
    this.level = { kind: "root" };
    this.frontPage = 0;
    this.render();
    return true;
  }

  /** Przemaluj po zmianie stanu (zadanie, temat, plecak, złoto) — bez
   *  cofania strony. W trybie usługi: znaczniki zakładek i sakiewka. */
  refresh(): void {
    if (!this.open) return;
    if (this.service !== null) {
      this.rail.setTabs(this.tabs(), this.service, this.dense);
      return;
    }
    this.render();
  }

  /**
   * ⭐ Szyna usługi ma JEDEN kafel: „‹ Rozmowa” (powrót; + imię u góry
   * i „Bywaj.” na dole) — od 2026-10-14, decyzja autora. Do tej daty
   * stały tu zakładki wszystkich usług (Rozmowa · Handel · Szkolenie…),
   * czyli menu zamiast rozmowy. Ze sklepu do nauki idzie się przez rozmowę:
   * wróć, powiedz drugie zdanie — o jeden dotyk więcej, świadomie.
   */
  private tabs(): RailTab<FrameTab>[] {
    return [{ id: "talk", label: "‹ Rozmowa", icon: "talk" }];
  }

  /** Szerokie tło kolumny zjeżdża do szyny — tylko rysunek, zero wejścia. */
  private playNarrow(fromBgX: number): void {
    const L = this.rail.layout;
    if (!L) return;
    const W = uiW(this.scene);
    const H = uiH(this.scene);
    const ghost = this.scene.add
      .rectangle(fromBgX, 0, W - fromBgX, H, 0x10131b, 0.97)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(RAIL_DEPTH - 1);
    this.rail.root.setAlpha(0);
    // ⚠ Licznik + `setSize`, nie tween `width`: pole `width` kształtu zmienia
    // się bez przeliczenia geometrii, więc prostokąt nie drgnąłby na ekranie.
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: NARROW_MS,
      ease: "Quad.easeOut",
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 1;
        const x = fromBgX + (L.bgX - fromBgX) * k;
        ghost.setPosition(x, 0).setSize(W - x, H);
      },
      onComplete: () => ghost.destroy(),
    });
    this.scene.tweens.add({ targets: this.rail.root, alpha: 1, duration: NARROW_MS, ease: "Quad.easeIn" });
  }

  /* ── Co jest do powiedzenia ─────────────────────────────────────────────── */

  /** Tematy „do zadania": wymagane przez aktywny cel i — gdy wymagany stoi
   *  jeszcze za bramką `after` — temat, który go odsłania. */
  private questTopics(): Set<string> {
    if (!this.npc) return new Set();
    const wymagane = Quests.pendingTopics(this.npc.id);
    const out = new Set<string>();
    const avail = new Set(Dialogue.available(this.npc).map((t) => t.id));
    for (const id of wymagane) {
      if (avail.has(id)) { out.add(id); continue; }
      const t = (this.npc.topics ?? []).find((x) => x.id === id);
      for (const a of t?.after ?? []) if (avail.has(a)) out.add(a);
    }
    // ⭐ Temat, z którego wyrasta zadanie (`offersQuest`) — „!” i pierwszy,
    // dopóki nie padł, a zadanie czeka już tylko na niego (2026-10-14).
    // Temat-brama jeszcze UKRYTY za innym pytaniem tego rozmówcy (`after`) —
    // „!” dostaje pytanie, które go odsłania (ten sam wzór co cele wyżej).
    for (const t of this.npc.topics ?? []) {
      if (!t.offersQuest || Dialogue.isAsked(t.id) || !Quests.waitsOnTopic(t.offersQuest as QuestId)) continue;
      if (avail.has(t.id)) { out.add(t.id); continue; }
      for (const a of t.after ?? []) if (avail.has(a) && !Dialogue.isAsked(a)) out.add(a);
    }
    return out;
  }

  private asked(): Topic[] {
    return this.npc ? Dialogue.available(this.npc).filter((t) => Dialogue.isAsked(t.id)) : [];
  }

  /** Niezadane tematy w danej „szufladzie": `null` = korzeń (bez grupy). */
  private freshIn(group: string | null, doZadania: Set<string>): Topic[] {
    if (!this.npc) return [];
    return Dialogue.available(this.npc).filter(
      (t) => !Dialogue.isAsked(t.id) && !doZadania.has(t.id) && (t.group ?? null) === group,
    );
  }

  /** Kontynuacje bieżącego tematu przed resztą — rozmowa płynie sama. */
  private followsFirst(list: Topic[]): Topic[] {
    const cur = this.current?.id;
    if (!cur) return list;
    const follows = (t: Topic) => t.after?.includes(cur) ?? false;
    return [...list.filter(follows), ...list.filter((t) => !follows(t))];
  }

  private topicSpec(t: Topic, doZadania: Set<string>): RowSpec {
    const quest = doZadania.has(t.id);
    const cur = this.current;
    return {
      text: t.q,
      icon: "talk",
      kind: quest ? "quest" : cur && t.after?.includes(cur.id) ? "follow" : "plain",
      marker: quest ? { text: "!", color: UI.gold } : undefined,
      onClick: () => this.ask(t),
    };
  }

  private ask(topic: Topic): void {
    if (!this.npc) return;
    this.current = topic;
    // Z omówionych wraca się do korzenia; z grupy — zostaje w grupie, żeby
    // kolejne pytanie o zioła było pod tym samym kciukiem.
    if (this.level.kind === "archive") this.level = { kind: "root" };
    this.frontPage = 0;
    // `ask` emituje zmianę tylko za PIERWSZYM razem — temat odczytany ponownie
    // z omówionych nie zmienia żadnej bramki, więc tu przebudowujemy sami.
    const wasAsked = Dialogue.isAsked(topic.id);
    // Przed `ask`: jego przebudowa ma już widzieć zaliczony cel (bez „!").
    Quests.recordTopic(this.npc.id, topic.id);
    Dialogue.ask(topic.id);
    // ⭐ Gałąź tematu: odpowiedź kończy się propozycją zadania — pas zostaje
    // z odpowiedzią rozmówcy, kolumna przechodzi w „Biorę to.” / „‹ Jeszcze
    // nie” (ten sam poziom `offer` co wiersz „!”).
    const q = topic.offersQuest as QuestId | undefined;
    if (q && Quests.getStatus(q) === "available" && Quests.isUnlocked(q)) {
      this.level = { kind: "offer", id: q };
      this.render();
      return;
    }
    if (wasAsked) this.render();
  }

  /* ── Strony wypowiedzi ──────────────────────────────────────────────────── */

  private nextPage(): void {
    if (this.pageIndex >= this.pages.length - 1) return;
    this.pageIndex++;
    Sfx.play("ui-click");
    this.paintSpeech();
  }

  private linesOf(s: string): number {
    return this.measurer.setText(s).getWrappedText().length;
  }

  /**
   * Podziel wypowiedź na strony po `LINES_PER_PAGE` wierszy, na granicach
   * ZDAŃ. Zdanie dłuższe niż strona tnie się po wierszach. Pierwsza strona
   * ma mniej miejsca, gdy stoi na niej kwestia gracza.
   */
  private paginate(text: string, firstPageLines: number): string[] {
    const sentences = text.split(/(?<=[.!?…])\s+/).filter((s) => s.length > 0);
    const pages: string[] = [];
    let cur = "";
    const cap = () => (pages.length === 0 ? firstPageLines : LINES_PER_PAGE);
    for (const s of sentences) {
      const cand = cur ? `${cur} ${s}` : s;
      if (this.linesOf(cand) <= cap()) {
        cur = cand;
        continue;
      }
      if (cur) pages.push(cur);
      cur = s;
      // Zdanie dłuższe niż cała strona — tniemy po zawiniętych wierszach.
      while (this.linesOf(cur) > cap()) {
        const wrapped = this.measurer.setText(cur).getWrappedText();
        const n = cap();
        pages.push(wrapped.slice(0, n).join(" ").trim());
        cur = wrapped.slice(n).join(" ").trim();
      }
    }
    if (cur || pages.length === 0) pages.push(cur);
    return pages;
  }

  /* ── Rysowanie ──────────────────────────────────────────────────────────── */

  private onResize(): void {
    if (this.open && this.service === null) {
      this.pagesKey = ""; // inna szerokość = inne zawinięcie wierszy
      this.render();
    }
  }

  /** Geometria liczona z okna przy każdym rysowaniu — arkusz nie ma skali. */
  private geom() {
    const W = uiW(this.scene);
    const H = uiH(this.scene);
    const col = talkColumn(W, H);
    const bandW = col.bgX - 4 - M;
    const lineH = SPEECH_PX + SPEECH_LINE_GAP + 2;
    const bandH = 14 + NAME_PX + 10 + LINES_PER_PAGE * lineH + 26;
    return { W, H, colX: col.x, colW: col.w, colBgX: col.bgX, bandX: M, bandW, bandH, bandY: H - M - bandH, textW: bandW - 40 };
  }

  private render(): void {
    if (!this.npc) return;
    // Grupa, w której nie zostało nic do zapytania, znika (research §4.4) —
    // kolumna wraca do korzenia, odpowiedź zostaje w pasie.
    if (this.level.kind === "group") {
      const doZadania = this.questTopics();
      const gid = this.level.id;
      const left = this.freshIn(gid, doZadania).length
        + Dialogue.available(this.npc).filter((t) => t.group === gid && doZadania.has(t.id)).length;
      if (left === 0) this.level = { kind: "root" };
    }
    if (this.level.kind === "archive" && this.asked().length === 0) this.level = { kind: "root" };
    if (this.level.kind === "offer" && Quests.getStatus(this.level.id) !== "available") this.level = { kind: "root" };

    const g = this.geom();
    this.dim.setSize(g.W, g.H);
    this.dim.input?.hitArea.setTo(0, 0, g.W, g.H);
    this.band.setPosition(g.bandX, g.bandY).setSize(g.bandW, g.bandH);
    this.band.input?.hitArea.setTo(0, 0, g.bandW, g.bandH);
    this.bandLine.setPosition(g.bandX, g.bandY).setSize(g.bandW, 2);
    this.column.setPosition(g.colBgX, 0).setSize(g.W - g.colBgX, g.H);
    this.column.input?.hitArea.setTo(0, 0, g.W - g.colBgX, g.H);

    this.nameText.setText(this.npc.name.toUpperCase()).setPosition(g.bandX + 20, g.bandY + 14);
    this.speech.setWordWrapWidth(g.textW, true);
    this.measurer.setWordWrapWidth(g.textW, true);
    this.playerLine.setWordWrapWidth(g.textW, true);

    // Strony przeliczane tylko przy zmianie tego, co się mówi — przebudowa
    // listy (np. po `dialogueChanged`) nie może cofać gracza na stronę 1.
    const key = this.current ? `t:${this.current.id}` : `o:${this.opening}`;
    if (key !== this.pagesKey) {
      this.pagesKey = key;
      this.pageIndex = 0;
      const q = this.current ? `— ${this.current.q}` : "";
      this.playerLine.setText(q);
      const qLines = q ? this.playerLine.getWrappedText().length : 0;
      const body = plain(this.current ? this.current.a : this.opening);
      this.pages = this.paginate(body, Math.max(1, LINES_PER_PAGE - qLines));
      this.guardUntil = performance.now() + INPUT_GUARD_MS;
    }
    this.paintSpeech();
    this.renderColumn(g);
  }

  private paintSpeech(): void {
    const g = this.geom();
    const top = g.bandY + 14 + NAME_PX + 10;
    const showQ = this.pageIndex === 0 && this.playerLine.text !== "";
    this.playerLine.setVisible(showQ).setPosition(g.bandX + 20, top);
    const speechTop = showQ ? top + this.playerLine.height + 4 : top;
    this.speech.setText(this.pages[this.pageIndex] ?? "").setPosition(g.bandX + 20, speechTop);
    const more = this.pages.length > 1;
    this.pageMark
      .setText(more ? (this.pageIndex < this.pages.length - 1 ? `▼  ${this.pageIndex + 1}/${this.pages.length}` : `${this.pageIndex + 1}/${this.pages.length}`) : "")
      .setPosition(g.bandX + g.bandW - 16, g.bandY + g.bandH - 8);
  }

  /**
   * Kolumna, od DOŁU: „Bywaj.” (pod przerwą) · w korzeniu „Porozmawiajmy o…”
   * i STAŁY blok usług · w grupie „‹ Zmień temat" · nad tym pytania,
   * pakowane od dołu, z podziałem na strony.
   */
  private renderColumn(g: ReturnType<ConversationSheet["geom"]>): void {
    this.rows.removeAll(true);
    const x = g.colX;
    const w = g.colW;
    const leaveH = FRAME.rail.exitH;
    const leaveY = g.H - M - leaveH;
    // „Bywaj.” (2026-10-14, wcześniej „Bywaj.”) — zdanie gracza jak
    // reszta kolumny, w tym samym miejscu co wyjście szyny, i NIE podlega
    // blokadzie po nowej wypowiedzi.
    this.buildRow({ text: "Bywaj.", kind: "nav", noGuard: true, onClick: () => this.opts.onLeave() }, x, leaveY, w, leaveH);
    let bottom = leaveY - LEAVE_GAP;

    let listTop = M;
    const lvl = this.level;
    if (lvl.kind === "root") {
      const archived = this.asked().length;
      if (archived > 0) {
        const h = HUD_LAYOUT.minTouch;
        // „Porozmawiajmy o…” (autor 2026-10-14: „Omówione dziwnie brzmi”) —
        // zdanie gracza jak reszta kolumny; liczba tematów w dopisku.
        this.buildRow({ text: "Porozmawiajmy o…", note: `poruszone wcześniej: ${archived}`, noteColor: UI.muted, kind: "nav", onClick: () => {
          this.level = { kind: "archive" };
          this.frontPage = 0;
          this.render();
        } }, x, bottom - h, w, h);
        bottom -= h + ROW_GAP;
      }
      // ⭐ Usługi = WYPOWIEDZI GRACZA (2026-10-14), wiersze jak pytania, w STAŁEJ
      // kolejności od `NpcDialog`, zawsze w tym samym miejscu nad „Porozmawiajmy o…”.
      // Pilność = znacznik i dopisek przy wierszu, nie miejsce.
      const services = this.services();
      if (services.length > 0) {
        for (let i = services.length - 1; i >= 0; i--) {
          const s = services[i];
          const spec: RowSpec = {
            text: s.line,
            icon: s.icon,
            kind: "plain",
            note: s.note,
            noteColor: s.noteColor,
            marker: s.marker,
            onClick: () => this.opts.onTab(s.id),
          };
          const h = this.rowHeight(spec, w);
          this.buildRow(spec, x, bottom - h, w, h);
          bottom -= h + ROW_GAP;
        }
        bottom += ROW_GAP - SECTION_GAP;
      }
      this.caption.setVisible(false);
    } else {
      const h = HUD_LAYOUT.minTouch;
      this.buildRow({ text: lvl.kind === "offer" ? "‹  Jeszcze nie" : "‹  Zmień temat", kind: "nav", onClick: () => this.back() }, x, bottom - h, w, h);
      bottom -= h + ROW_GAP;
      const doZadania = this.questTopics();
      const text = lvl.kind === "archive"
        ? "Porozmawiajmy o…"
        : lvl.kind === "offer"
          // ⭐ Cel pod nazwą (2026-10-14): oferta z TEMATU zostawia w pasie
          // odpowiedź rozmówcy, nie opis zadania — bez tej linii gracz brałby
          // zlecenie, nie wiedząc, co ma zrobić.
          ? [`Zadanie · ${getQuest(lvl.id).name}`, ...objectivesOf(lvl.id).map((o) => {
              const n = goalOf(o);
              return `${objectiveLabel(o)}${n > 1 ? ` ×${n}` : ""}`;
            })].join("\n")
          : `${TOPIC_GROUPS[lvl.id]?.short ?? lvl.id} · ${newTopics(this.freshIn(lvl.id, doZadania).length)}`;
      this.caption.setText(text).setPosition(x + 4, M).setVisible(true);
      listTop = M + this.caption.height + 8;
    }

    const specs = this.specs();
    const listBottom = bottom;
    let y = listBottom;
    const built = this.fitSpecs(specs, listBottom - listTop, w);
    for (let i = built.length - 1; i >= 0; i--) {
      const { spec, h } = built[i];
      y -= h;
      this.buildRow(spec, x, y, w, h);
      y -= ROW_GAP;
    }
    // Okruszek stoi TUŻ nad pierwszym pytaniem, nie przy górnej krawędzi —
    // lista jest pakowana od dołu, a podpis oderwany od niej o pół ekranu
    // czytał się jak osobny element (zrzut 1:1, 2026-10-13).
    if (this.caption.visible) {
      this.caption.setY(Math.max(M, y + ROW_GAP - this.caption.height - 8));
    }
  }

  /** Pytania bieżącego poziomu, w kolejności: do zadania → kontynuacje →
   *  reszta → (w korzeniu) grupy w stałej kolejności `TOPIC_GROUPS`. */
  private specs(): RowSpec[] {
    if (!this.npc) return [];
    const lvl = this.level;
    if (lvl.kind === "archive") {
      return this.asked().map((t) => ({ text: t.q, icon: "talk" as UiIconKind, kind: "plain" as RowKind, onClick: () => this.ask(t) }));
    }
    if (lvl.kind === "offer") {
      const id = lvl.id;
      return [{
        text: "Biorę to.",
        icon: "quests",
        kind: "quest",
        note: rewardText(id) || undefined,
        noteColor: UI.goldLight,
        marker: { text: "!", color: UI.gold },
        onClick: () => this.acceptQuest(id),
      }];
    }
    const doZadania = this.questTopics();
    const avail = Dialogue.available(this.npc);
    const group = lvl.kind === "group" ? lvl.id : null;
    // ⭐ Tematy do zadania (`OI-66`) idą PIERWSZE i stoją także wtedy, gdy były
    //    już zadane — cel liczy się z rozmowy w toku zadania. W korzeniu
    //    stoją wszystkie (także z grup), w grupie — tylko jej.
    const quest = avail.filter((t) => doZadania.has(t.id) && (group === null || t.group === group));
    const out = [
      // ⭐ D4: zadania stoją NAD pytaniami, w korzeniu — oddanie przed ofertą
      //   (nagroda czeka teraz), oferta przed tematem do celu.
      ...(group === null ? this.questSpecs() : []),
      ...[...quest, ...this.followsFirst(this.freshIn(group, doZadania))].map((t) => this.topicSpec(t, doZadania)),
    ];
    if (group === null) {
      for (const [gid, def] of Object.entries(TOPIC_GROUPS)) {
        const n = this.freshIn(gid, doZadania).length;
        if (n === 0) continue;
        out.push({
          text: def.row,
          icon: "talk",
          kind: "group",
          note: newTopics(n),
          noteColor: UI.goldLight,
          marker: { text: "›", color: UI.goldLight },
          onClick: () => {
            this.level = { kind: "group", id: gid };
            this.frontPage = 0;
            this.render();
          },
        });
      }
    }
    return out;
  }

  /* ── D4: oferta i oddanie zadania W ROZMOWIE (etap F, 2026-10-13) ──────────
   * Research §5 D4 i §8 R6: zadanie bierze się i oddaje tam, gdzie się o nim
   * rozmawia — opis w głosie dawcy w pasie wypowiedzi, decyzja w kolumnie.
   * Zakładka „Zadania" zostaje jako przegląd (cele, nagroda, stan) i ma te
   * same dwa przyciski; to dwie drogi do JEDNEJ operacji `Quests`.
   * ⚠ Wypowiedzi po decyzji to linie z danych (`working`, `turnIn`) albo
   * suchy komunikat w nawiasie — ⛔ agent nie dopisuje NPC-om kwestii
   * (`docs/swiat.md`: teksty dla gracza pisze/odbiera autor). */

  /** Wiersze zadań w korzeniu: „?" do oddania, „!" do wzięcia. */
  private questSpecs(): RowSpec[] {
    if (!this.npc) return [];
    const npc = this.npc.id;
    const ids = Quests.questsAtNpc(npc).filter((id) => Quests.isUnlocked(id));
    const out: RowSpec[] = [];
    for (const id of ids) {
      if (Quests.getStatus(id) === "active" && Quests.isObjectiveMet(id)) {
        out.push({
          text: getQuest(id).name,
          icon: "quests",
          kind: "quest",
          note: "zadanie do oddania",
          noteColor: UI.green,
          marker: { text: "?", color: UI.green },
          onClick: () => this.turnInQuest(id),
        });
      }
    }
    for (const id of ids) {
      if (Quests.getStatus(id) !== "available") continue;
      out.push({
        text: getQuest(id).name,
        icon: "quests",
        kind: "quest",
        note: "zadanie do wzięcia",
        noteColor: UI.goldLight,
        marker: { text: "!", color: UI.gold },
        onClick: () => {
          this.say(`offer:${id}`, "Masz dla mnie jakąś robotę?", getQuest(id).description);
          this.level = { kind: "offer", id };
          this.frontPage = 0;
          this.render();
        },
      });
    }
    return out;
  }

  private acceptQuest(id: QuestId): void {
    if (!this.npc || !Quests.accept(id)) return;
    const g = this.npc.greetings ?? {};
    const line = questGreetingsOf(id).working ?? g.working ?? "";
    this.say(`accepted:${id}`, "Biorę to.", line || `(Przyjęte: ${getQuest(id).name}.)`);
    this.level = { kind: "root" };
    this.frontPage = 0;
    this.render();
  }

  private turnInQuest(id: QuestId): void {
    if (!this.npc) return;
    const name = getQuest(id).name;
    const reward = rewardText(id).replace(/^Nagroda:\s*/, "");
    // ⚠ Jedyne, czego `complete()` może odmówić przy wykonanych celach, to
    //   przedmiot nagrody bez miejsca — wszystko-albo-nic, oddanie czeka.
    if (!Quests.complete(id, this.npc.id)) {
      this.say(`full:${id}`, `${name} — zrobione.`, "(Plecak pełny — zrób miejsce na nagrodę i oddaj jeszcze raz.)");
    } else {
      const note = reward ? `(Otrzymujesz: ${reward}.)` : "(Zadanie oddane.)";
      const voice = questGreetingsOf(id).done;
      this.say(`done:${id}`, `${name} — zrobione.`, voice ? `${voice} ${note}` : note);
    }
    this.frontPage = 0;
    this.render();
  }

  /** Chwila rozmowy spoza tematów (oferta, przyjęcie, oddanie) — pas pokazuje
   *  ją tak samo jak odpowiedź na pytanie: kwestia gracza, potem NPC. */
  private say(id: string, q: string, a: string): void {
    this.current = { id, q, a };
  }

  /** Wysokość wiersza dla danego tekstu (min. próg dotykowy). */
  private rowHeight(spec: RowSpec, rowW: number): number {
    const t = this.scene.add.text(0, 0, spec.text, textStyle({ fontSize: fontPx("body"), wordWrap: { width: rowW - ROW_TEXT_INSET - 36, useAdvancedWrap: true } }));
    let h = t.height + 22;
    t.destroy();
    if (spec.note) h += TYPE.small + 2;
    return Math.max(HUD_LAYOUT.minTouch, h);
  }

  /**
   * Ile pytań się zmieści. Brakujące miejsce dzieli pytania na strony
   * i dokłada wiersz „Zapytaj o coś innego…". Usługi, „Porozmawiajmy o…”
   * i „Zmień temat" stoją POZA tym rachunkiem — są stałe.
   */
  private fitSpecs(specs: RowSpec[], avail: number, rowW: number): { spec: RowSpec; h: number }[] {
    const withH = specs.map((spec) => ({ spec, h: this.rowHeight(spec, rowW) }));
    const total = (list: { h: number }[]) => list.reduce((s, r) => s + r.h, 0) + ROW_GAP * Math.max(0, list.length - 1);
    if (total(withH) <= avail) return withH;

    const moreH = HUD_LAYOUT.minTouch;
    let room = avail - moreH - ROW_GAP;
    const pageList: { spec: RowSpec; h: number }[] = [];
    let start = this.frontPage;
    if (start >= withH.length) start = 0;
    let i = start;
    while (i < withH.length && room - withH[i].h - ROW_GAP >= 0) {
      room -= withH[i].h + ROW_GAP;
      pageList.push(withH[i]);
      i++;
    }
    if (pageList.length === 0 && withH.length > 0) {
      pageList.push(withH[start]);
      i = start + 1;
    }
    const next = i < withH.length ? i : 0;
    const moreSpec: RowSpec = {
      text: next === 0 ? "Wróć do pierwszych pytań" : `Zapytaj o coś innego… (${withH.length - next})`,
      kind: "nav",
      onClick: () => {
        this.frontPage = next;
        this.render();
      },
    };
    return [...pageList, { spec: moreSpec, h: moreH }];
  }

  /**
   * Jeden wiersz kolumny — ⭐ **ZDANIE, nie przycisk** (2026-10-14, wariant A
   * autora: „to nie monolog, wiersze nie mogą być jednakowymi elementami”).
   * Bez ramki i tła: ikona rodzaju, tekst, cienka kreska pod spodem; tło
   * zapala się dopiero pod palcem. ⚠ Pole dotyku dalej ma CAŁĄ wysokość
   * wiersza (≥ `minTouch`) — niewidoczne (`fillAlpha` 0, ⛔ nie `alpha` 0:
   * obiekt z zerową alfą wypada z testu trafienia).
   *
   * ⚠ Naciśnięcie POKAZUJE, puszczenie WYKONUJE — kontrakt z 2026-08-23:
   * zjechanie palcem w bok anuluje, bo wiersze stoją jeden przy drugim.
   * Puszczenie w oknie `INPUT_GUARD_MS` po nowej wypowiedzi jest ignorowane
   * (poza pożegnaniem — `noGuard`).
   */
  private buildRow(spec: RowSpec, x: number, y: number, w: number, h: number): void {
    const accent = spec.kind === "quest" || spec.kind === "follow";
    const dimRow = spec.kind === "nav";
    const box = this.scene.add
      .rectangle(x, y, w, h, 0x2a3350, 0)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    // Cienka kreska POD wierszem — jedyny podział listy (zdania, nie kafle).
    const line = this.scene.add.rectangle(x + 8, y + h + ROW_GAP / 2, w - 16, 1, 0xffffff, 0.1).setOrigin(0, 0.5);
    const color = dimRow ? UI.muted : spec.kind === "quest" ? UI.goldLight : spec.kind === "follow" ? UI.goldLight : UI.white;
    const textX = x + ROW_TEXT_INSET;
    const label = this.scene.add
      .text(textX, y + h / 2 - (spec.note ? (TYPE.small + 2) / 2 : 0), spec.text, textStyle({
        fontSize: fontPx("body"),
        color,
        fontStyle: spec.kind === "group" ? "bold" : dimRow ? "italic" : "normal",
        wordWrap: { width: w - ROW_TEXT_INSET - 36, useAdvancedWrap: true },
      }))
      .setOrigin(0, 0.5);
    const paint = (state: "idle" | "hover" | "pressed") => {
      box.setFillStyle(0x2a3350, state === "pressed" ? 0.85 : state === "hover" ? 0.4 : 0);
      label.setColor(state === "idle" ? color : UI.gold);
    };
    let pressed = false;
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      pressed = true;
      paint("pressed");
    });
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (!pressed) return;
      pressed = false;
      paint("idle");
      if (!spec.noGuard && performance.now() < this.guardUntil) return;
      Sfx.play("ui-click");
      spec.onClick();
    });
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      if (!pressed) paint("hover");
    });
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      pressed = false;
      paint("idle");
    });
    this.rows.add([box, line, label]);
    if (spec.icon) {
      const iconColor = accent ? UI.goldNum : dimRow ? 0x6c768c : 0x9aa4b8;
      this.rows.add(drawUiIcon(this.scene.add.graphics({ x: x + 22, y: label.y }), spec.icon, 22, iconColor, 0x10131b));
    }
    if (spec.note) {
      this.rows.add(
        this.scene.add
          .text(textX, label.y + label.height / 2 + 2, spec.note, textStyle({ fontSize: fontPx("small"), color: spec.noteColor ?? UI.muted }))
          .setOrigin(0, 0),
      );
    }
    if (spec.marker) {
      this.rows.add(
        this.scene.add
          .text(x + w - 20, y + h / 2, spec.marker.text, textStyle({ fontSize: fontPx("name"), color: spec.marker.color, fontStyle: "bold" }))
          .setOrigin(0.5),
      );
    }
  }
}

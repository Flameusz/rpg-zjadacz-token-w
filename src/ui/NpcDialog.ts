import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Quests, questGreetingsOf } from "../core/Quests";
import { Skills } from "../core/Skills";
import { UI } from "../core/theme";
import { PROFICIENCY } from "../config/GameConfig";
import { NPCS, type NpcDef, type NpcId } from "../core/Npcs";
import { BackHandler } from "../core/BackHandler";
import { KeyFocus } from "./KeyFocus";
import { PanelBase } from "./PanelBase";
import { ShopPanel } from "./ShopPanel";
import { QuestPanel } from "./QuestPanel";
import { TrainerPanel } from "./TrainerPanel";
import { ConversationSheet, type ServiceId, type ServiceRow } from "./ConversationSheet";
import { MasteryPanel } from "./MasteryPanel";
import { WeaponProficiency, WEAPON_FAMILIES } from "../core/WeaponProficiency";

type ViewId = ServiceId;

/**
 * ⭐ **STAŁA kolejność usług** (etap C, 2026-10-13; research §8 R3) — ta sama
 * w bloku usług rozmowy i w szynie. Do tej daty usługa z nagrodą skakała na
 * górę listy; kciuk nie wyrabiał odruchu. Pilność niesie ZNACZNIK, nie miejsce.
 */
const SERVICE_ORDER: readonly ViewId[] = ["shop", "quests", "trainer", "mastery"];

/** A sub-view the dialogue hands control to — treść jednej zakładki ramy. */
interface DialogView {
  /** Pierwsze wejście w tej rozmowie: zbuduj widok dla rozmówcy. */
  show(npc: NpcDef, opening?: string): void;
  /** Koniec rozmowy: schowaj i zapomnij stan (zaznaczenie, przewinięcie). */
  hide(): void;
  /**
   * Przejście na INNĄ zakładkę tej samej rozmowy: schowaj, ale zachowaj stan
   * (research §4.2: „stan każdej zakładki trwa do końca rozmowy").
   * Brak metody = zwykłe `hide`.
   */
  suspend?(): void;
  /** Powrót na zakładkę w tej samej rozmowie — bez przebudowy od zera. */
  restore?(): void;
  /** Krok wstecz WEWNĄTRZ widoku (np. okno potwierdzenia). `true` = obsłużony;
   *  brak metody albo `false` = krok należy do ramy. */
  back?(): boolean;
  /**
   * Widok GĘSTEJ treści prosi o szynę samych ikon (autor 2026-10-13: „w Handlu
   * same ikony"). ⚠ Musi zgadzać się z `host: "frame-dense"` widoku — inaczej
   * panel policzy się pod jedną szerokość szyny, a stanie obok drugiej.
   */
  readonly denseRail?: boolean;
}

/**
 * The Hunter's conversation window — the hub every other NPC interaction now
 * hangs off.
 *
 * Previously the shop, the quest banner and the skill trainer were stacked
 * into one 600×560 frame: two item grids, an equipped-gear row, a quest banner
 * and a trainer banner competing for the same screen. On a phone that reads as
 * noise, and each part got whatever space was left rather than what it needed
 * (which is why the quest and trainer sections could only ever show ONE entry).
 *
 * So this owns the *conversation* — the views and the game pause — and hands
 * off to exactly one focused view at a time. The views deliberately do NOT
 * pause or unpause on their own: the pause belongs to the conversation as a
 * whole, or stepping from the shop into the trainer would briefly unpause the
 * world mid-dialogue.
 *
 * ⚠ **Opening is no longer this class's decision.** Proximity and the
 * interact-key/tap/button that activates it now live centrally in
 * `GameScene`/`ContextAction` (`core/Interactables.ts`) — this class only
 * reacts to `npcTalkRequested`, the same event a world tap has always used.
 *
 * ── One back-navigation contract, three doors into it ─────────────────────
 * `back()` is the single rule: a subview steps up to the hub, the hub
 * closes the conversation. `E` (once a conversation is already open),
 * `Escape`, and the Android system Back button all call exactly this and
 * nothing else — none of them gets its own opinion about what "back" means.
 * `E` used to close everything outright from any layer, which meant Escape
 * from the shop and `E` from the shop disagreed about what one step back was.
 *
 * Android Back reaches this through `BackHandler.consume`, set below — see
 * that module's header for why a callback bridge rather than an event.
 */
export class NpcDialog extends PanelBase {
  private shop: ShopPanel;
  private quests: QuestPanel;
  private trainer: TrainerPanel;
  /** Zakup rang Mastery (§34.9) — jedyne miejsce w grze, gdzie ranga zmienia
   *  właściciela. Wiersz pokazuje się wyłącznie u trenera z configu. */
  private mastery: MasteryPanel;
  private views: Record<ViewId, DialogView>;
  /**
   * ⭐ **Rozmowa = RAMA z zakładkami** (2026-10-13, etap C; wcześniej od
   * 2026-10-12 arkusz z usługami jako wierszami). „Rozmowa" jest zakładką 0,
   * usługi kolejnymi — w STAŁEJ kolejności (`SERVICE_ORDER`). Wejście w usługę
   * zwęża kolumnę rozmowy do szyny, a widok usługi (bez własnego tytułu i ✕)
   * staje na lewo od niej. Ta klasa jest WŁAŚCICIELEM rozmowy i maszyną stanów
   * ramy: pauza, `E`/Escape/Back (jeden poziom), ognisko klawiatury, wybór
   * powitania, stan usług i stan zakładek do końca rozmowy (`visited`).
   * ⚠ Własne okno `PanelBase` (`this.container`) NIE jest już pokazywane —
   * dziedziczenie zostało dla pauzy (`pauseGame`/`resumeGame`) i dymka.
   */
  private sheet: ConversationSheet;

  /** Null = zakładka „Rozmowa" na ekranie (albo rozmowa zamknięta). */
  private activeView: ViewId | null = null;
  /** Zakładki odwiedzone w TEJ rozmowie — wracają `restore`, nie `show`. */
  private visited = new Set<ViewId>();
  /** Co NPC powiedział na powitanie — podwidoki dostają to jako `opening`. */
  private greeting = "";
  private open = false;
  /** Whose conversation this is. Set from `npcTalkRequested`, because the
   *  greeting, the stock, the quests and the skills all belong to one NPC. */
  private npc: NpcDef = NPCS.hunter;
  private playerDead = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 440, 430);

    // Zakładki usług. Od etapu C (2026-10-13) nie mają własnych ✕ ani „Wróć"
    // — wyjście i powrót do rozmowy należą do szyny ramy (`ConversationSheet`).
    this.shop = new ShopPanel(scene);
    this.quests = new QuestPanel(scene);
    this.trainer = new TrainerPanel(scene);
    this.mastery = new MasteryPanel(scene);
    this.views = {
      shop: this.shop,
      quests: this.quests,
      trainer: this.trainer,
      mastery: this.mastery,
    };
    // „Do widzenia" w ramie = zamknięcie CAŁEJ rozmowy (jedno wyjście —
    // decyzja z 2026-08-22: trzy kontrolki o jednym skutku każą szukać różnicy).
    // Zakładka „Rozmowa" wraca do rozmowy, usługa otwiera swój widok.
    this.sheet = new ConversationSheet(scene, {
      onLeave: () => this.close(),
      onTab: (tab) => (tab === "talk" ? this.backToDialog() : this.openView(tab)),
    });

    // `E` i Escape wołają `back()` — patrz nagłówek klasy. Otwieranie przychodzi
    // wyłącznie jako `npcTalkRequested`, tak samo jak tapnięcie.
    // ⚠ Naciśnięcie obsłużone tutaj jest ZUŻYTE (`KeyFocus.consume`) —
    // inaczej `ContextAction`, zarejestrowany później, dostawał to samo `E`,
    // widział już zamkniętą rozmowę i otwierał ją z powrotem (`OI-52`).
    const backKey = (e: KeyboardEvent) => {
      if (!this.open) return;
      KeyFocus.consume(e);
      this.back();
    };
    scene.input.keyboard?.on("keydown-E", backKey);
    scene.input.keyboard?.on("keydown-ESC", backKey);

    // Android system Back — third door into the same contract. `false` means
    // "not open, don't consume": `main.ts` falls back to `App.exitApp()`.
    BackHandler.consume = () => {
      if (!this.open) return false;
      this.back();
      return true;
    };

    GameEvents.on(EVENT.npcTalkRequested, this.onTalkRequested, this);
    GameEvents.on(EVENT.playerDied, this.onDied, this);
    GameEvents.on(EVENT.playerRespawned, this.onRespawned, this);
    // Znaczniki usług („!" nowe zadanie, „?" do oddania, „+" do nauki) i front
    // pytań muszą przeżyć to, co gracz zrobi w podwidokach i w samej rozmowie.
    GameEvents.on(EVENT.questsChanged, this.refreshSheet, this);
    GameEvents.on(EVENT.skillsChanged, this.refreshSheet, this);
    GameEvents.on(EVENT.inventoryChanged, this.refreshSheet, this);
    GameEvents.on(EVENT.dialogueChanged, this.refreshSheet, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      BackHandler.consume = null;
      KeyFocus.reset();
      GameEvents.off(EVENT.npcTalkRequested, this.onTalkRequested, this);
      GameEvents.off(EVENT.playerDied, this.onDied, this);
      GameEvents.off(EVENT.playerRespawned, this.onRespawned, this);
      GameEvents.off(EVENT.questsChanged, this.refreshSheet, this);
      GameEvents.off(EVENT.skillsChanged, this.refreshSheet, this);
      GameEvents.off(EVENT.inventoryChanged, this.refreshSheet, this);
      GameEvents.off(EVENT.dialogueChanged, this.refreshSheet, this);
    });
  }

  /* ── Usługi ────────────────────────────────────────────────────────────── */

  private refreshSheet(): void {
    // Rozmowa przebudowuje kolumnę; w usłudze szyna odświeża znaczniki
    // zakładek i sakiewkę (kupno w sklepie zmienia złoto widoczne w szynie).
    if (!this.open) return;
    this.sheet.refresh();
  }

  /**
   * Usługi tego NPC — **WARUNKOWE**: mieszkaniec bez sklepu nie oferuje
   * Handlu (do 2026-08 wszystkie renderowały się zawsze i gadający mieszkaniec
   * zapraszał do trzech pustych pokoi — to czyta się jak zepsuty sklep, nie jak
   * człowiek). Kolejność — `SERVICE_ORDER`, zawsze ta sama.
   *
   * ⭐ Od 2026-10-14 usługa jest wierszem rozmowy (`line` — zdanie gracza),
   * nie kaflem; dopisek („2 do nauki”) stoi pod zdaniem krojem `small`.
   */
  private serviceRows(): ServiceRow[] {
    const has: Record<ViewId, boolean> = {
      shop: this.npc.stock.length > 0,
      quests: Quests.questsAtNpc(this.npc.id).some((id) => Quests.isUnlocked(id)),
      trainer: Skills.forTrainer(this.npc.id).length > 0,
      // **Mistrzostwo broni — zakup rang Mastery** (`docs/systemy/proficiency.md`
      // §34, D5 w §34.9). ⚠ Warunek czyta JEDNĄ STAŁĄ z configu, nie pole
      // w `NpcDef` — systemu wielu trenerów świadomie nie budujemy.
      mastery: this.npc.id === PROFICIENCY.mastery.trainer,
    };
    // ⭐ `line` — co gracz MÓWI (2026-10-14, autor: „zamiast Handel, Mistrzostwo
    // coś, co brzmi jak dialog”). Wspólne dla wszystkich rozmówców; zdanie
    // własne dla jednej postaci (np. karczmarz) to przyszłe pole w `NpcDef`.
    const build: Record<ViewId, () => ServiceRow> = {
      shop: () => ({ id: "shop", line: "Pokaż, co masz na sprzedaż.", label: "Handel", icon: "trade" }),
      // ⚠ Bez znacznika i dopisku: „!”/„?” zlecenia stoją już jako własne
      // wiersze nad pytaniami (D4) — drugi „!” przy przeglądzie był dublem
      // na renderze (2026-10-14).
      quests: () => ({ id: "quests", line: "Wróćmy do twoich zleceń.", label: "Zadania", icon: "quests" }),
      trainer: () => ({ id: "trainer", line: "Czego możesz mnie nauczyć?", label: "Szkolenie", icon: "training", ...this.trainerStatus() }),
      mastery: () => ({ id: "mastery", line: "Chcę dalej ćwiczyć władanie bronią.", label: "Mistrzostwo", icon: "mastery", ...this.masteryStatus() }),
    };
    const rows = SERVICE_ORDER.filter((id) => has[id]).map((id) => build[id]());
    // ⚠ Dopisek zostaje tylko, gdy COŚ ZGŁASZA (znacznik albo kolor inny niż
    // wyciszony). „wszystko poznane", „rangi broni", „nic nowego" to szum —
    // drugi wiersz małego tekstu pod każdą usługą, który niczego nie zmienia.
    for (const r of rows) {
      if (!r.marker && r.noteColor === UI.muted) {
        r.note = undefined;
        r.noteColor = undefined;
      }
    }
    return rows;
  }

  /**
   * WoW's shorthand, because it is universally understood: "!" = something new
   * to take, "?" = something finished to hand in. Turn-in wins when both are
   * true — it is the one with a reward attached to it right now.
   */
  /**
   * Pick what he says, most specific first. Deliberately mirrors the order the
   * player cares about: something to hand in beats something to take, which
   * beats a job already underway.
   *
   * `firstJob` is separated from `newJob` because only the first conversation
   * can carry the handover of the duty — by the second quest the line about
   * his arm is stale.
   *
   * ⚠ **2026-08-20: switched from `.some()` (a bare bool) to `.find()` (which
   * quest, specifically).** The buckets below are shared across EVERY quest an
   * NPC owns, which was fine at one quest per NPC and broke the moment
   * Patryczek got a second: "ready" was true because SOME quest was ready, but
   * the text shown was always `g.turnIn` regardless of which one, so a
   * different quest's turn-in line played over the wrong quest. Knowing the
   * winning quest's id is what lets `questGreetingsOf` below override it —
   * see `Quests.QuestGreetings`.
   */
  private pickGreeting(): string {
    const g = this.npc.greetings ?? {};
    // `waitsOnTopic`: zadanie czeka tylko na pytanie — powitanie to już
    // `firstJob` („jest robota”), nie `notYet` (2026-10-14).
    const ids = Quests.questsAtNpc(this.npc.id).filter((id) => Quests.isUnlocked(id) || Quests.waitsOnTopic(id));
    const readyId = ids.find((id) => Quests.getStatus(id) === "active" && Quests.isObjectiveMet(id));
    const availableId = ids.find((id) => Quests.getStatus(id) === "available");
    const activeId = ids.find((id) => Quests.getStatus(id) === "active");
    const everFinished = ids.some((id) => Quests.getStatus(id) === "completed");
    const skillsLeft = Skills.forTrainer(this.npc.id).some((id) => !Skills.has(id));
    /**
     * He HAS work, but none of it has opened up for you yet — every quest he
     * owns is still behind a prerequisite. Today that is exactly one window,
     * and it is the opening of the game: the Hunter's whole catalogue hangs off
     * `rabbit_hunt`, which hangs off the Ojciec's `stick_in_hand`, so a player
     * who walks south through the portal before talking to his father meets a
     * man with nothing to say about work.
     *
     * It must be checked BEFORE `skillsLeft`, or he greets a boy with bare
     * hands by offering to sell him a 50g skinning lesson. Narrow on purpose:
     * `ids` empty *while the catalogue isn't* can't be confused with "done
     * everything" — a completed quest stays unlocked, so finishing his line
     * leaves `ids` non-empty and `allDone` still wins.
     */
    const gatedOnly = ids.length === 0 && Quests.questsAtNpc(this.npc.id).length > 0;

    // Every branch falls back to the QUEST's own override first, THEN the
    // NPC's plain bucket, THEN the base greeting — a quest that defines none
    // of `greetings` behaves exactly as before this existed. An NPC that
    // grows a quest before it grows the matching line would otherwise render
    // an empty box, which reads as a broken panel rather than as a missing
    // string.
    if (readyId) return questGreetingsOf(readyId).turnIn ?? g.turnIn ?? this.npc.greeting;
    if (availableId) {
      const q = questGreetingsOf(availableId);
      return (everFinished ? q.newJob ?? g.newJob : q.firstJob ?? g.firstJob) ?? this.npc.greeting;
    }
    if (activeId) return questGreetingsOf(activeId).working ?? g.working ?? this.npc.greeting;
    if (gatedOnly) return g.notYet ?? this.npc.greeting;
    if (skillsLeft) return g.moreToTeach ?? this.npc.greeting;
    if (everFinished) {
      // No single "winning" quest here (everything unlocked is completed) —
      // fall back to whichever completed quest defines an `allDone` override,
      // then the NPC bucket. Rare enough (only matters with 2+ finished
      // quests sharing one NPC) that a `.find` here is plenty.
      const doneId = ids.find((id) => Quests.getStatus(id) === "completed");
      return (doneId && questGreetingsOf(doneId).allDone) ?? g.allDone ?? this.npc.greeting;
    }
    return this.npc.greeting;
  }

  private trainerStatus(): { note: string; noteColor: string; marker?: { text: string; color: string } } {
    const ids = Skills.forTrainer(this.npc.id);
    const left = ids.filter((id) => !Skills.has(id)).length;
    if (left === 0) return { note: "wszystko poznane", noteColor: UI.muted };
    const affordable = ids.some((id) => Skills.canLearn(id));
    return {
      note: `${left} do nauki`,
      noteColor: affordable ? UI.green : UI.muted,
      marker: affordable ? { text: "+", color: UI.green } : undefined,
    };
  }

  /**
   * Stan wiersza „Mistrzostwo broni".
   *
   * ⚠ **Wiersz musi mówić o SUFICIE, nie tylko o ofercie** (§34.7): gracz
   * stojący na suficie **traci praktykę**, a jedynym miejscem, gdzie się o tym
   * dowie po wejściu do wioski, jest ta linijka i panel BROŃ.
   */
  private masteryStatus(): { note: string; noteColor: string; marker?: { text: string; color: string } } {
    let gotowe = 0;
    let naSuficie = 0;
    for (const family of WEAPON_FAMILIES) {
      const oferta = WeaponProficiency.masteryOffer(family);
      if (oferta.ready) gotowe++;
      // Tylko rodziny FAKTYCZNIE ćwiczone — nierozpoczęta broń stoi na „suficie"
      // 50 od pierwszej klatki gry i zgłaszanie tego byłoby szumem.
      if (oferta.atCap && WeaponProficiency.has(family)) naSuficie++;
    }
    if (gotowe > 0) {
      return {
        note: `${gotowe} do kupienia`,
        noteColor: UI.green,
        marker: { text: "+", color: UI.green },
      };
    }
    // ⚠ Krótko, bo kafel ma szerokość szyny; liczbę broni na suficie pokazuje
    // panel Mistrzostwa i strona BROŃ.
    if (naSuficie > 0) return { note: "sufit biegłości", noteColor: UI.gold };
    return { note: "rangi broni", noteColor: UI.muted };
  }

  /* ── View switching ──────────────────────────────────────────────────── */

  /**
   * Zakładka usługi. Kolumna rozmowy zwęża się do szyny (`sheet.showService`),
   * a widok usługi staje na lewo od niej. Druga wizyta w tej samej rozmowie
   * wraca do stanu, w którym gracz zakładkę zostawił (`restore`).
   */
  private openView(id: ViewId): void {
    if (!this.open || this.activeView === id) return;
    if (this.activeView) this.suspendView(this.activeView);
    this.activeView = id;
    const view = this.views[id];
    this.sheet.showService(id, view.denseRail === true);
    if (this.visited.has(id) && view.restore) {
      view.restore();
    } else {
      this.visited.add(id);
      view.show(this.npc, this.greeting);
    }
  }

  private suspendView(id: ViewId): void {
    const view = this.views[id];
    if (view.suspend) view.suspend();
    else view.hide();
  }

  /** Zakładka „Rozmowa" — z usługi wraca się do tej samej chwili rozmowy. */
  private backToDialog(): void {
    if (this.activeView) this.suspendView(this.activeView);
    this.activeView = null;
    if (!this.open) return;
    // Także tutaj, nie tylko przy otwarciu: oddanie zadania dzieje się
    // w podwidoku, więc bez tego NPC dalej prosiłby o to, co właśnie dostał.
    this.greeting = this.pickGreeting();
    this.sheet.resume(this.greeting);
  }

  /* ── Open/close plumbing ─────────────────────────────────────────────── */

  /**
   * The one back-navigation contract — see the class header. `E`, Escape and
   * Android Back all call exactly this; none of them has its own idea of
   * what "back" means. A no-op while nothing is open, which is also how
   * `BackHandler.consume` knows whether to report "handled" at all.
   */
  private back(): void {
    if (!this.open) return;
    if (this.activeView) {
      if (this.views[this.activeView].back?.()) return;
      this.backToDialog();
      return;
    }
    // Grupa tematów i „Porozmawiajmy o…” cofają się najpierw do korzenia rozmowy,
    // dopiero potem rozmowa się kończy — inaczej Escape z grupy zamykałby
    // wszystko naraz (Wstecz = jeden poziom, research §4.2).
    if (this.sheet.back()) return;
    this.close();
  }

  /**
   * Range and proximity are GameScene's job now (`requestInteraction`) —
   * this only guards against a request that arrives while a conversation is
   * already open, or after the player died between the request and it
   * landing.
   */
  private openDialog(): void {
    if (this.open || this.playerDead) return;
    this.open = true;
    KeyFocus.take("dialog");
    this.activeView = null;
    // Credit any active "talk to X" objective BEFORE the greeting is picked, so
    // a conversation that finishes a quest already says the turn-in line rather
    // than repeating "off you go" and only catching up on the second visit.
    Quests.recordTalk(this.npc.id);
    // ...and top up anything he gave you for a job you're still on. Losing the
    // quest item must never be a dead end — see Quests.replenishGrants.
    Quests.replenishGrants(this.npc.id);
    this.greeting = this.pickGreeting();
    this.sheet.show(this.npc, this.greeting, () => this.serviceRows());
    this.pauseGame();
  }

  private close(): void {
    if (!this.open) return;
    this.open = false;
    KeyFocus.release("dialog");
    // Koniec rozmowy = koniec stanu zakładek: każdy odwiedzony widok dostaje
    // pełne `hide` (zaznaczenie, potwierdzenie, przewinięcie — od zera).
    for (const id of this.visited) this.views[id].hide();
    this.visited.clear();
    this.activeView = null;
    this.sheet.hide();
    this.resumeGame();
  }

  /**
   * The player asked to talk to this villager — via a direct tap on them, the
   * ContextAction button, or `E`, all of which fund into the same
   * `requestInteraction` dispatch in GameScene (see `core/Interactables.ts`).
   * Range has already been checked there, against this exact NPC, so this
   * does not re-test it — it points the window at whoever was requested and
   * opens.
   */
  private onTalkRequested(p: { id: NpcId }): void {
    if (this.open || this.playerDead) return;
    this.npc = NPCS[p.id];
    this.openDialog();
  }

  private onDied(): void {
    this.playerDead = true;
    this.close();
  }

  private onRespawned(): void {
    this.playerDead = false;
  }
}

import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Quests, getQuest, type QuestId } from "../core/Quests";
import { questSections, questState } from "./QuestCard";

import { UI, uiW, uiH } from "../core/theme";
import { NPCS, type NpcDef } from "../core/Npcs";
import { PanelBase } from "./PanelBase";
import { serviceArea, subviewSize } from "./FrameLayout";
import { ListDetail, type ListCard, type ListRow } from "./ListDetail";
import { computeListDetailLayout } from "./ListDetailLayout";

/**
 * The quest-giver view, reached from the NPC dialogue ("Zadania").
 *
 * Replaces the single-quest banner that used to live inside ShopPanel. That
 * banner could only ever surface ONE quest (Quests.bannerQuestForGiver picked
 * a winner by priority), so a giver with an available quest AND a finished one
 * silently hid half its state. Here every unlocked quest for the giver is
 * reachable, which is also what makes room for givers to hand out more than two.
 *
 * Prerequisite-locked quests stay hidden — same rule the banner used
 * (Quests.isUnlocked), so learning Skinning is still what reveals the follow-up
 * rather than it sitting there greyed out as a spoiler.
 *
 * ── ⭐ Etap F (2026-10-13): lista + karta na CAŁYM obszarze usługi ──────────
 * Rysuje `ListDetail` (research §8 R6, wzór: Postać → Broń): wiersz 68 j.
 * ze znacznikiem i stanem, karta z opisem, celami i nagrodą, JEDEN przycisk
 * w prawym dolnym rogu — ten sam adres co „Kup · 340 g" w sklepie. Do tej daty
 * okno 816×470 z tekstem 11–14 j. stało wyśrodkowane w obszarze 1029×580.
 *
 * ⚠ **Pierwsze zadanie jest wybrane automatycznie**, więc najczęstszy przypadek
 * — jeden dawca, jedno zadanie — kosztuje **zero dodatkowych tapnięć**.
 * Kolejność wyboru: do oddania → do wzięcia → w toku → zrobione.
 */
export class QuestPanel extends PanelBase {
  /** Whose quest board this is. */
  private npc: NpcDef = NPCS.hunter;
  private readonly view: ListDetail;
  private open = false;
  /**
   * Które zadanie jest rozwinięte w karcie.
   *
   * ⚠ Trzymane jako `QuestId`, nie jako indeks: `refresh()` przebudowuje spis
   * przy każdej zmianie stanu zadań, a przyjęcie albo oddanie potrafi zmienić
   * KOLEJNOŚĆ i liczbę wpisów. Indeks przeżyłby taką przebudowę wskazując na
   * inne zadanie — czyli karta podmieniłaby się pod ręką gracza.
   */
  private selected: QuestId | null = null;
  /** Odmowa ostatniej próby oddania (pełny plecak) — znika przy zmianie wyboru. */
  private refusal: { id: QuestId; text: string } | null = null;

  // ⚠ Bez `onBack` (etap C): wyjście z zakładki należy do szyny ramy.
  constructor(scene: Phaser.Scene) {
    const area = serviceArea(uiW(scene), uiH(scene));
    const size = subviewSize(area.w, area.h);
    super(scene, size.w, size.h, "frame");

    this.view = new ListDetail(scene, this.container, computeListDetailLayout(this.w, this.h), (id) => {
      this.selected = id as QuestId;
      this.refusal = null;
      this.refresh(false);
    });

    // Accepting/turning in fires questsChanged; collecting or selling the
    // objective item moves progress without touching quest state at all, hence
    // the inventory listener too.
    GameEvents.on(EVENT.questsChanged, this.onChange, this);
    GameEvents.on(EVENT.inventoryChanged, this.onChange, this);
    GameEvents.on(EVENT.skillsChanged, this.onChange, this);

    this.reposition();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.questsChanged, this.onChange, this);
      GameEvents.off(EVENT.inventoryChanged, this.onChange, this);
      GameEvents.off(EVENT.skillsChanged, this.onChange, this);
    });
  }

  show(npc: NpcDef): void {
    this.open = true;
    this.npc = npc;
    // Wybór należy do DAWCY, nie do panelu — inaczej tablica następnego
    // mieszkańca otwierałaby się na zadaniu poprzedniego.
    this.selected = null;
    this.refusal = null;
    this.refresh(false, false);
    this.container.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.container.setVisible(false);
  }

  /** Powrót na zakładkę w tej samej rozmowie — wybór zostaje (etap C,
   *  research §4.2: stan zakładki trwa do końca rozmowy). */
  restore(): void {
    this.open = true;
    this.refresh();
    this.container.setVisible(true);
  }

  protected reposition(): void {
    super.reposition();
    this.view?.refreshMasks();
  }

  private onChange(): void {
    this.refresh();
  }

  /** Kolejność spisu: to, co wymaga ruchu gracza, na górze. */
  private rank(id: QuestId): number {
    const s = Quests.getStatus(id);
    if (s === "active" && Quests.isObjectiveMet(id)) return 0;
    if (s === "available") return 1;
    if (s === "active") return 2;
    return 3;
  }

  /**
   * @param keepCardScroll przewinięcie karty zostaje (zmiana stanu tej samej
   *   pozycji); wybór innej pozycji czyta od góry.
   * @param keepListScroll nowy dawca zaczyna spis od góry.
   */
  private refresh(keepCardScroll = true, keepListScroll = true): void {
    // Rebuilding is only worth the allocations while the view is on screen;
    // show() refreshes anyway, so an off-screen change is never missed.
    if (!this.open) return;

    // ⚠ `questsAtNpc`, nie `questsForGiver`: nowe zadanie oferuje DAWCA, ale
    // aktywne oddaje się u `turnInNpcOf`. Patrz `Quests.questsAtNpc`.
    const ids = Quests.questsAtNpc(this.npc.id)
      .filter((id) => Quests.isUnlocked(id))
      .sort((a, b) => this.rank(a) - this.rank(b));
    if (ids.length === 0) {
      this.selected = null;
      this.view.setRows([], null, false);
      this.view.setCard(null, "Nie mam teraz dla ciebie żadnej roboty.\nWróć później.");
      return;
    }

    // ⚠ Wybór klamrowany do tego, co NAPRAWDĘ jest na liście. Oddane zadanie
    // potrafi zniknąć ze spisu, a wtedy karta zostałaby z zadaniem, którego
    // już nie ma.
    if (this.selected === null || !ids.includes(this.selected)) this.selected = ids[0];

    this.view.setRows(ids.map((id) => this.row(id)), this.selected, keepListScroll);
    this.view.setCard(this.card(this.selected), "", keepCardScroll);
  }

  /** Jeden wiersz spisu. Znacznik niesie słownictwo znaczników nad głowami
   *  NPC-ów (`core/NpcStatus.ts`): „!" do wzięcia, „?" gotowe do oddania. */
  private row(id: QuestId): ListRow {
    const st = questState(id);
    const done = Quests.getStatus(id) === "completed";
    return { id, mark: st.mark, markColor: st.markColor, name: getQuest(id).name, nameColor: done ? UI.muted : UI.white, note: st.text, noteColor: st.color };
  }

  /** Karta: treść z `QuestCard` i jedna akcja. */
  private card(id: QuestId): ListCard {
    const status = Quests.getStatus(id);
    const met = Quests.isObjectiveMet(id);
    const done = status === "completed";
    const st = questState(id);
    const base = {
      title: getQuest(id).name,
      titleColor: done ? UI.green : UI.gold,
      subtitle: status === "available" ? "Nowe zadanie" : met && !done ? "Cele wykonane — do oddania" : st.text[0].toUpperCase() + st.text.slice(1),
      subtitleColor: st.color,
      sections: questSections(id),
    };
    if (status === "available") {
      return { ...base, action: { label: "Przyjmij zadanie", enabled: true, onClick: () => Quests.accept(id) } };
    }
    if (status === "active") {
      return {
        ...base,
        refusal: this.refusal?.id === id ? this.refusal.text : met ? undefined : "Najpierw wykonaj cele.",
        // Wyszarzony, dopóki cele nie są wykonane; wiersze celów mówią, ile brakuje.
        action: {
          label: "Oddaj zadanie",
          enabled: met,
          // ⚠ Jedyne, czego `complete()` może jeszcze odmówić przy wykonanych
          //   celach, to przedmiot nagrody bez miejsca — ta sama reguła
          //   wszystko-albo-nic co zbieranie (GameScene.onGather): nagroda nie
          //   znika w pełnym plecaku, oddanie czeka.
          onClick: () => {
            if (!Quests.complete(id, this.npc.id)) {
              this.refusal = { id, text: "Plecak pełny — zrób miejsce na nagrodę." };
              this.refresh();
            }
          },
        },
      };
    }
    return base;
  }
}

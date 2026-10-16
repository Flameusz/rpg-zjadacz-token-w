import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { Skills, getSkill, type SkillId } from "../core/Skills";
import { Inventory } from "../core/Inventory";
import { Progression } from "../core/Progression";
import { ABILITIES } from "../config/GameConfig";
import { getAbility, type AbilityId } from "../core/Abilities";

import { UI, uiW, uiH } from "../core/theme";
import { NPCS, type NpcDef } from "../core/Npcs";
import { PanelBase } from "./PanelBase";
import { serviceArea, subviewSize } from "./FrameLayout";
import { abilityCardLines } from "./AbilityCard";
import { ListDetail, type CardLine, type CardSection, type ListCard, type ListRow } from "./ListDetail";
import { computeListDetailLayout } from "./ListDetailLayout";

/**
 * The skill-trainer view, reached from the NPC dialogue ("Szkolenie").
 *
 * Replaces the one-skill-at-a-time trainer banner that used to sit at the
 * bottom of ShopPanel. Showing the trainer's whole catalogue at once is the
 * point: a skill costs scarce skill points (see PROGRESSION.skillPointsPerLevel
 * — one per level), and you cannot budget those sensibly if the game only ever
 * admits to one purchase existing.
 *
 * ── ⭐ Etap F (2026-10-13): lista + karta na CAŁYM obszarze usługi ──────────
 * Rysuje `ListDetail` (research §8 R6). Patryczek uczy DZIEWIĘCIU rzeczy,
 * a wiersz ma dziś próg dotyku (68 j.), więc lista PRZEWIJA się — maszyneria
 * mieszka w `ListDetail`, nie tutaj (do 2026-08-21 ten plik miał własną kopię
 * maski i ciągnięcia, potem podział na spis i szczegóły ją skasował; przy
 * wierszu 34 j. dziewięć pozycji mieściło się w oknie).
 *
 * ⚠ **Karta mówi, CO umiejętność robi**, nie tylko ile kosztuje — wiersze
 * „Co daje" bierze z `AbilityCard.abilityCardLines`, tej samej treści, którą
 * gracz zobaczy potem w Postać → Umiejętności. Druga kopia opisu rozjechałaby
 * się z pierwszą przy pierwszym strojeniu.
 *
 * ⚠ Pierwsza nienauczona umiejętność jest wybrana automatycznie, więc trener
 * uczący jednej rzeczy kosztuje zero dodatkowych tapnięć.
 */
export class TrainerPanel extends PanelBase {
  /** Whose training list this is. */
  private npc: NpcDef = NPCS.hunter;
  private readonly view: ListDetail;
  private open = false;
  /** ⚠ Trzymane jako `SkillId`, nie indeks — nauka zmienia stan wpisu, a przy
   *  indeksie karta podmieniłaby się pod ręką po przebudowie spisu. */
  private selected: SkillId | null = null;

  // ⚠ Bez `onBack` (etap C): wyjście z zakładki należy do szyny ramy.
  constructor(scene: Phaser.Scene) {
    const area = serviceArea(uiW(scene), uiH(scene));
    const size = subviewSize(area.w, area.h);
    super(scene, size.w, size.h, "frame");

    this.view = new ListDetail(scene, this.container, computeListDetailLayout(this.w, this.h), (id) => {
      this.selected = id as SkillId;
      this.refresh(false);
    });

    // Learning spends gold and points, so all three sources can move the
    // affordability of every remaining button.
    GameEvents.on(EVENT.skillsChanged, this.onChange, this);
    GameEvents.on(EVENT.inventoryChanged, this.onChange, this);
    GameEvents.on(EVENT.attributesChanged, this.onChange, this);
    GameEvents.on(EVENT.xpChanged, this.onChange, this);

    this.reposition();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.skillsChanged, this.onChange, this);
      GameEvents.off(EVENT.inventoryChanged, this.onChange, this);
      GameEvents.off(EVENT.attributesChanged, this.onChange, this);
      GameEvents.off(EVENT.xpChanged, this.onChange, this);
    });
  }

  show(npc: NpcDef): void {
    this.open = true;
    this.npc = npc;
    // Wybór należy do TRENERA — inaczej oferta następnego otwierałaby się na
    // umiejętności poprzedniego.
    this.selected = null;
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

  private refresh(keepCardScroll = true, keepListScroll = true): void {
    if (!this.open) return;
    const ids = Skills.forTrainer(this.npc.id);
    if (ids.length === 0) {
      this.selected = null;
      this.view.setRows([], null, false);
      this.view.setCard(null, "Nie mam cię czego nauczyć.");
      return;
    }
    // Pierwsza NIENAUCZONA — po nią gracz przyszedł; poznane są tłem.
    if (this.selected === null || !ids.includes(this.selected)) {
      this.selected = ids.find((id) => !Skills.has(id)) ?? ids[0];
    }
    this.view.setRows(ids.map((id) => this.row(id)), this.selected, keepListScroll);
    this.view.setCard(this.card(this.selected), "", keepCardScroll);
  }

  private row(id: SkillId): ListRow {
    const sk = getSkill(id);
    if (Skills.has(id)) return { id, mark: "✓", markColor: UI.green, name: sk.name, nameColor: UI.muted, note: "poznane" };
    const req = Skills.missingPrereq(id);
    if (req) return { id, mark: "•", markColor: UI.muted, name: sk.name, note: `po: ${getSkill(req).name}`, noteColor: UI.muted };
    const stac = Skills.canLearn(id);
    return {
      id,
      mark: stac ? "+" : "•",
      markColor: stac ? UI.green : UI.muted,
      name: sk.name,
      note: costText(id),
      noteColor: stac ? UI.green : UI.muted,
    };
  }

  private card(id: SkillId): ListCard {
    const sk = getSkill(id);
    const known = Skills.has(id);
    const sections: CardSection[] = [{ lines: [{ text: sk.description }] }];

    // ── Co daje: wiersze karty umiejętności, „etykieta: wartość" rozdzielone ──
    const ability = "unlocksAbility" in sk ? (sk.unlocksAbility as AbilityId) : null;
    if (ability) {
      // Dwie pierwsze linie `abilityCardLines` to nazwa i miejsce na pasku —
      // tu nazwa jest tytułem karty, a pasek nie istnieje, dopóki nie umiesz.
      // Opis umiejętności (ostatnia linia) mówi to samo co opis nauki wyżej
      // — na renderze stały dwa zdania o tym samym zamachu jedno pod drugim.
      const opis = getAbility(ability).description;
      const lines: CardLine[] = abilityCardLines(ability, -1)
        .slice(2)
        .filter((l) => l.text !== opis)
        .map((l) => {
          const i = l.text.indexOf(": ");
          return i > 0 && i < 24
            ? { text: l.text.slice(0, i), value: l.text.slice(i + 2), valueColor: l.color === UI.text ? UI.white : l.color }
            : { text: l.text, color: l.color };
        });
      sections.push({ title: "Co daje", lines });

      // ⚠ Poziom NIE blokuje nauki (bramka jest podwójna: poziom mówi „jesteś
      //   gotowy", trener „ktoś ci to pokazał" — `GameConfig.SKILLS`), ale
      //   umiejętność nauczona za wcześnie nie pojawi się na pasku. Gracz musi
      //   to wiedzieć PRZED zapłatą.
      const lvl = ABILITIES[ability].unlockLevel;
      if (Progression.level < lvl) {
        sections.push({
          title: "Wymagania",
          lines: [{ text: `Użyjesz jej od poziomu ${lvl}`, value: `masz ${Progression.level}`, valueColor: UI.danger, color: UI.goldLight }],
        });
      }
      if (known) {
        sections.push({ lines: [{ text: "Na pasek kładziesz ją w panelu gracza: Postać → Umiejętności.", color: UI.muted, role: "small" }] });
      }
    }

    if (known) return { title: sk.name, titleColor: UI.green, subtitle: "Poznane", subtitleColor: UI.green, sections };

    // Wymóg poprzedniego poziomu (Kartografia II po I) — stoi NAD kosztem:
    // „brakuje 40 g” przy lekcji, której trener i tak nie udzieli, kłamałoby.
    const req = Skills.missingPrereq(id);
    if (req) {
      sections.push({
        title: "Wymagania",
        lines: [{ text: "Najpierw musisz znać", value: getSkill(req).name, valueColor: UI.danger, color: UI.goldLight }],
      });
    }
    const stac = Skills.canLearn(id);
    const missing: string[] = [];
    if (Inventory.gold < sk.goldCost) missing.push(`${sk.goldCost - Inventory.gold} g`);
    if (Progression.skillPoints < sk.skillPointCost) {
      missing.push(`${sk.skillPointCost - Progression.skillPoints} pkt rozwoju`);
    }
    return {
      title: sk.name,
      subtitle: `Nauka u trenera · ${costText(id)}`,
      wallet: {
        gold: Inventory.gold,
        spendGold: sk.goldCost,
        points: Progression.skillPoints,
        spendPoints: sk.skillPointCost,
      },
      sections,
      // Wyszarzony przycisk mówi, KTÓREJ waluty brakuje — przy dwóch walutach
      // „nie stać cię" jest zgadywanką.
      refusal: stac ? undefined : req ? `Najpierw: ${getSkill(req).name}.` : `Brakuje ${missing.join(" i ")}.`,
      action: { label: `Naucz · ${costText(id)}`, enabled: stac, onClick: () => Skills.learn(id) },
    };
  }
}

/** „120 g + 2 pkt" — koszt na przycisku i w wierszu spisu, jednym zapisem. */
function costText(id: SkillId): string {
  const sk = getSkill(id);
  if (sk.skillPointCost > 0 && sk.goldCost > 0) return `${sk.goldCost} g + ${sk.skillPointCost} pkt`;
  if (sk.skillPointCost > 0) return `${sk.skillPointCost} pkt`;
  return `${sk.goldCost} g`;
}

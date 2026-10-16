import { UI } from "../core/theme";
import { QUALITY } from "../config/GameConfig";
import { Quests, getQuest, objectivesOf, rewardOf, turnInNpcOf, type QuestId } from "../core/Quests";
import { guidanceFor, guidanceText, questObjectiveLine } from "../core/QuestGuidance";
import { getItem, type ItemId } from "../core/Items";
import { qualityColorHex } from "../core/Quality";
import { NPCS, type NpcId } from "../core/Npcs";
import type { CardLine, CardSection } from "./ListDetail";

/**
 * ── ZADANIE jako sekcje karty (etap F, 2026-10-13) ────────────────────────
 *
 * Wspólne dla tablicy dawcy (`QuestPanel`, rozmowa → Zadania) i dziennika
 * (panel gracza → Zadania). Do tej daty dwa widoki składały cele i nagrodę
 * osobno; dziennik „Nagroda: 20g, 40 XP", tablica — inaczej.
 *
 * ⚠ Cele przez `questObjectiveLine`, nie `objectiveText` wprost — ukończone
 * zadanie typu `collect` ma przedmioty już oddane, a żywy odczyt plecaka
 * pokazywał wtedy „0/5" (`core/QuestGuidance`).
 */

/** Stan zadania jednym słowem — podpis wiersza i karty. */
export function questState(id: QuestId): { text: string; color: string; mark: string; markColor: string } {
  const status = Quests.getStatus(id);
  if (status === "completed") return { text: "zrobione", color: UI.muted, mark: "✓", markColor: UI.green };
  if (status === "available") return { text: "do wzięcia", color: UI.goldLight, mark: "!", markColor: UI.gold };
  if (Quests.isObjectiveMet(id)) return { text: "do oddania", color: UI.green, mark: "?", markColor: UI.green };
  const g = guidanceFor(id);
  return { text: g.kind === "none" ? "w toku" : guidanceText(g), color: UI.muted, mark: "•", markColor: UI.text };
}

/** Opis, cele, (dokąd z tym iść) i nagroda. */
export function questSections(id: QuestId): CardSection[] {
  const q = getQuest(id);
  const done = Quests.getStatus(id) === "completed";
  const sections: CardSection[] = [{ lines: [{ text: q.description, color: done ? UI.muted : UI.text }] }];

  // Jedna linia na cel, każda w swoim kolorze — zadanie bywa prośbą o trzy
  // rzeczy naraz, a jedna linia „wszystko albo nic" ukryłaby, czego brakuje.
  const cele: CardLine[] = objectivesOf(id).map((_, i) => {
    const line = questObjectiveLine(id, i);
    return { text: `${line.done ? "✓" : "•"} ${line.text}`, color: done ? UI.muted : line.done ? UI.green : UI.white };
  });
  const guidance = guidanceFor(id);
  if (guidance.kind === "turnIn") cele.push({ text: guidanceText(guidance), color: UI.green, bold: true });
  sections.push({ title: "Cele", lines: cele });

  // Gdzie oddać — tylko gdy to INNA osoba niż dawca (inaczej wiadomo).
  const odbiorca = turnInNpcOf(id);
  if (!done && odbiorca && odbiorca !== q.giver) {
    sections.push({ title: "Oddajesz u", lines: [{ text: NPCS[odbiorca as NpcId]?.name ?? odbiorca, color: UI.white }] });
  }

  const nagroda = rewardLines(id);
  if (nagroda.length > 0) sections.push({ title: "Nagroda", lines: nagroda });
  return sections;
}

/** Nagroda rozpisana w wierszach „co … ile" — z liczbą sztuk i jakością. */
export function rewardLines(id: QuestId): CardLine[] {
  const r = rewardOf(id);
  const lines: CardLine[] = [];
  if (r.xp) lines.push({ text: "Doświadczenie", value: `${r.xp} XP`, valueColor: UI.goldLight });
  if (r.gold) lines.push({ text: "Złoto", value: `${r.gold} g`, valueColor: UI.goldLight });
  if (r.item) {
    const name = getItem(r.item.itemId as ItemId).name;
    const count = r.item.count && r.item.count > 1 ? `${r.item.count}× ` : "";
    const q = r.item.quality;
    lines.push({
      text: `${count}${name}`,
      value: q ? QUALITY.levels[q].name : undefined,
      valueColor: q ? qualityColorHex(q) : undefined,
      color: UI.white,
    });
  }
  return lines;
}

import { Quests } from "./Quests";
import { Skills } from "./Skills";
import { TrackedQuest } from "./TrackedQuest";
import { guidanceFor } from "./QuestGuidance";
import { UI } from "./theme";
import type { NpcId } from "./Npcs";


/** Znaczenie znacznika nad NPC — rysunek wybiera `entities/NpcMarkerIcons.ts`. */
export type NpcMarkerKind = "available" | "turnIn" | "talk" | "trainer";

/** Znacznik nad NPC: ZNACZENIE (`kind`), kolor i znak zapasowy (`text`).
 *  ⭐ Od 2026-10-14 rysowany IKONĄ (`entities/NpcMarkerIcons.ts`, autor: „coś
 *  w rodzaju WoW-a"); `text` zostaje jako nazwa znaku w raportach i zapasie. */
export interface NpcGlyph {
  readonly kind: NpcMarkerKind;
  readonly text: string;
  readonly color: string;
}

/**
 * ⚠ **`◆` — „ten NPC jest celem mojego AKTUALNEGO kroku".**
 *
 * Nie `!` i nie `?`, bo te dwa mają już znaczenia, których nie wolno
 * rozcieńczyć („jest tu robota do wzięcia" / „tu ją kończysz"). Prosty
 * geometryczny glif, bez emoji i bez nowej grafiki — ten sam monospace,
 * którym rysowany jest cały tekst w świecie.
 */
const CURRENT_STEP_GLYPH = "◆";

/**
 * Znacznik ZADANIOWY nad NPC — jeden, zawsze najwyżej jeden.
 *
 * ── Priorytet i dlaczego taki ─────────────────────────────────────────────
 *  1. `?` (zielony) — **można tu oddać zadanie**. Najwyżej, bo to jedyny stan,
 *     w którym gracz może coś DOMKNĄĆ; wszystko inne to zaproszenie do dalszej
 *     roboty.
 *  2. `◆` (biały)  — **tu prowadzi bieżący krok śledzonego zadania**.
 *  3. `!` (złoty)  — **jest tu nowe zadanie do wzięcia**.
 *
 * ⚠ **Nadal DOKŁADNIE JEDEN glif, nie trzy naraz.** Nad głową jest miejsce na
 * jeden czytelny znak; trzy zlewają się w ozdobę i przestają cokolwiek znaczyć.
 *
 * ── ⚠ `◆` czyta ŚLEDZONY quest, nie wszystkie aktywne ─────────────────────
 * Źródłem jest `TrackedQuest.id` → `guidanceFor(...)` → `guidance.npcId` —
 * czyli **dokładnie ta sama wskazówka, którą wypisuje tracker na HUD**. To jest
 * cel tej konstrukcji: gdy tracker mówi „Porozmawiaj: Patryczek", `◆` stoi nad
 * Patryczkiem, i te dwie rzeczy nie mogą się rozjechać, bo są tym samym
 * odczytem.
 *
 * Świadomie **nie** skanujemy `objectivesOf()` wszystkich aktywnych zadań:
 * oznaczyłoby to kilku mieszkańców naraz i zamieniło mapę w choinkę, a tracker
 * i tak pokazuje jeden następny krok. Świat ma mówić to samo, co tracker.
 *
 * ⚠ **Przypadek `turnIn` NIE potrzebuje tu własnej gałęzi.** Gdy wskazówka
 * przechodzi na „Wróć do: Ojciec", cele są spełnione — więc `questsAtNpc`
 * kieruje ten quest do `turnInNpcOf`, a gałąź `?` wyżej zapala się nad tą samą
 * osobą. Semantykę oddania niesie routing, nie drugi glif.
 */
export function npcQuestMarker(npcId: NpcId): NpcGlyph | null {
  // ⭐ Zadanie czekające tylko na rozmowę (`waitsOnTopic`) też daje „!” —
  // gracz ma wiedzieć, że jest tu robota, zanim zapyta o temat, z którego
  // ona wyrasta (2026-10-14).
  const questIds = Quests.questsAtNpc(npcId).filter((id) => Quests.isUnlocked(id) || Quests.waitsOnTopic(id));

  if (questIds.some((id) => Quests.getStatus(id) === "active" && Quests.isObjectiveMet(id))) {
    return { kind: "turnIn", text: "?", color: UI.green };
  }

  const tracked = TrackedQuest.id;
  if (tracked) {
    const g = guidanceFor(tracked);
    // ⚠ Zero własnej logiki `if (objective.kind === "talk")` — `QuestGuidance`
    // już to rozstrzygnęło i podało `npcId` prosto z `objective.npc`. Drugie
    // takie miejsce rozjechałoby się z trackerem przy pierwszej zmianie.
    if (g.kind === "objective" && g.npcId === npcId) {
      // ⭐ Rysowany jako ZŁOTY DYMEK rozmowy (cel „porozmawiaj"), nie biały
      // `◆` — na ekranie czytał się jak biała kropka (autor 2026-10-14).
      return { kind: "talk", text: CURRENT_STEP_GLYPH, color: UI.gold };
    }
  }

  if (questIds.some((id) => Quests.getStatus(id) === "available")) {
    return { kind: "available", text: "!", color: UI.gold };
  }
  return null;
}

/**
 * Znacznik USŁUGI: „stać cię na naukę u tego trenera".
 *
 * ⚠ **Wyprowadzone z `npcQuestMarker` 2026-08-23 i to jest rozdzielenie
 * SEMANTYK, nie kosmetyka.** `+` siedziało wcześniej w tym samym łańcuchu
 * priorytetów co `!` i `?`, więc konkurowało z zadaniami o jedno miejsce —
 * mieszkaniec z zadaniem do oddania i z lekcją w ofercie pokazywał tylko
 * `?`, a lekcja znikała bez śladu. To dwie różne obietnice („mam dla ciebie
 * robotę" vs „mam dla ciebie towar/naukę") i mają własne miejsca nad głową:
 * zadania w swoim rzędzie, usługi obok sakiewki kupca.
 *
 * ⚠ Reguła `Skills.canAfford` **nietknięta** — zmienił się tylko rysunek.
 */
export function npcTrainerBadge(npcId: NpcId): NpcGlyph | null {
  const skillIds = Skills.forTrainer(npcId);
  if (skillIds.some((id) => Skills.canLearn(id))) {
    return { kind: "trainer", text: "+", color: UI.green };
  }
  return null;
}

/** Czy ten NPC w ogóle czegoś uczy — **stałe** dla NPC, w przeciwieństwie do
 *  `npcTrainerBadge`, które zależy od zasobności gracza. Rozdzielone, bo układ
 *  rzędu usług ma być USTALONY: slot przyznaje ten predykat, a widoczność
 *  dopiero tamta funkcja. Inaczej sakiewka przesuwałaby się w bok w chwili,
 *  w której gracz uzbiera na lekcję. */
export function npcTeachesAnything(npcId: NpcId): boolean {
  return Skills.forTrainer(npcId).length > 0;
}

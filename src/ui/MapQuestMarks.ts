import Phaser from "phaser";
import { npcQuestMarker, type NpcMarkerKind } from "../core/NpcStatus";
import type { NpcId } from "../core/Npcs";
import { npcMarkerSize, npcMarkerTexture } from "../entities/NpcMarkerIcons";

/**
 * ⭐ **Cele zadań na MAPIE i MINIMAPIE** (autor 2026-10-14: „jeśli mamy do
 * oddania zadanie albo ktoś nas do nich odesłał — oznaczać takie cele na
 * mapie”).
 *
 * ⚠ **To ten sam odczyt, co znacznik nad głową w świecie** —
 * `NpcStatus.npcQuestMarker`, a z niego tylko dwa rodzaje:
 * - `turnIn` — zielone `?`: tu oddasz zadanie;
 * - `talk`   — złoty dymek: tu prowadzi bieżący krok ŚLEDZONEGO zadania
 *              (cel „porozmawiaj” — ktoś cię do tej osoby odesłał).
 * `available` (`!`) i `+` trenera zostają w świecie — na mapie zamieniłyby
 * wieś w choinkę, a pytanie gracza brzmi „dokąd mam iść”, nie „kto ma robotę”.
 *
 * ⚠ **Znacznik jest widoczny także we MGLE** — gracz WIE, dokąd iść (dostał
 * zadanie albo wskazówkę), nawet jeśli tamtego miejsca jeszcze nie widział.
 * Zwykła kropka mieszkańca we mgle dalej się chowa.
 */
export interface MapQuestMark {
  kind: Extract<NpcMarkerKind, "turnIn" | "talk">;
  color: string;
}

export function mapQuestMark(npcId: string): MapQuestMark | null {
  const m = npcQuestMarker(npcId as NpcId);
  if (!m || (m.kind !== "turnIn" && m.kind !== "talk")) return null;
  return { kind: m.kind, color: m.color };
}

/** Ikona znacznika o wysokości `h` j., stopą (dołem) w punkcie `(x, y)`. */
export function mapQuestIcon(scene: Phaser.Scene, mark: MapQuestMark, x: number, y: number, h: number): Phaser.GameObjects.Image {
  const s = npcMarkerSize(mark.kind);
  return scene.add
    .image(x, y, npcMarkerTexture(scene, mark.kind, mark.color))
    .setOrigin(0.5, 1)
    .setDisplaySize((s.w / s.h) * h, h);
}

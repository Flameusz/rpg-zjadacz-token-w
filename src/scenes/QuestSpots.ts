import Phaser from "phaser";
import { KIRKA, QUEST_SPOTS } from "../config/GameConfig";
import { Quests, type QuestId } from "../core/Quests";
import { Inventory } from "../core/Inventory";
import { getItem, type ItemId } from "../core/Items";
import type { FarmAnimal } from "../entities/FarmAnimal";

type Punkt = { x: number; y: number };

/**
 * ⭐ **Cele `reach` w świecie** (2026-10-12, pierwsze użycie: Kirka, `OI-174`).
 *
 * `Quests` wie tylko, że cel „stań w miejscu X" istnieje i czy jest zaliczony
 * (`pendingReach` / `recordReach`). Ten moduł jest drugą połową: co
 * `QUEST_SPOTS.sprawdzCoMs` pyta, czy gracz stoi w promieniu punktu `miejsce`
 * z mapy, i — jeśli cel wymaga przedmiotu — czy ma go w plecaku. Dopiero
 * wtedy zalicza, albo oddaje sprawę scence przypisanej do miejsca (Kirka:
 * pies przybiega, zjada, gna do domu i DOPIERO WTEDY cel jest zaliczony).
 *
 * ⛔ Nie ma tu żadnej mechaniki walki ani AI. Scenka steruje `FarmAnimal`
 * przez jego scenariusz (`biegnij` / `zjedz` / `przenies`).
 */
export class QuestSpots {
  private nextCheckAt = 0;
  /** Miejsca, w których scenka już trwa — żeby nie odpalić jej drugi raz. */
  private readonly trwa = new Set<string>();
  /** Miejsca, w których gracz już usłyszał „bez przedmiotu nic z tego" —
   *  kasowane po wyjściu z promienia, żeby nie powtarzać co 200 ms. */
  private readonly podpowiedziane = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Punkt & { isDead: boolean },
    private readonly spots: Record<string, Phaser.Math.Vector2>,
    private readonly kirka: { pies: FarmAnimal; dom: Punkt } | null,
    private readonly say: (text: string) => void,
  ) {
    if (kirka && kirkaZaginiona()) kirka.pies.setAlpha(0);
  }

  update(nowMs: number): void {
    if (nowMs < this.nextCheckAt) return;
    this.nextCheckAt = nowMs + QUEST_SPOTS.sprawdzCoMs;
    if (this.player.isDead) return;
    for (const { spot, itemId } of Quests.pendingReach()) {
      if (this.trwa.has(spot)) continue;
      const p = this.spots[spot];
      if (!p) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y) > QUEST_SPOTS.promienPx) {
        this.podpowiedziane.delete(spot);
        continue;
      }
      if (itemId && Inventory.countItem(itemId as ItemId) < 1) {
        if (!this.podpowiedziane.has(spot)) {
          this.podpowiedziane.add(spot);
          this.say(`Bez tego nic z tego: ${getItem(itemId as ItemId).name}`);
        }
        continue;
      }
      if (spot === KIRKA.spot && this.kirka) this.zwabKirke(p, itemId);
      else Quests.recordReach(spot);
    }
  }

  /** Kirka wbiega zza najbliższej krawędzi świata, zjada przy graczu i gna z powrotem. */
  private zwabKirke(spot: Phaser.Math.Vector2, itemId: string | undefined): void {
    const k = this.kirka!;
    const pies = k.pies;
    this.trwa.add(KIRKA.spot);
    const wejscie = zaKrawedzia(this.scene, spot, KIRKA.zaKrawedziaPx);
    pies.przenies(wejscie.x, wejscie.y);
    pies.setAlpha(1);
    const przyNodze = () => ({ x: this.player.x - KIRKA.bokPx, y: this.player.y });
    pies.biegnij(przyNodze, KIRKA.biegPxS, 6, () => {
      // Między wbiegnięciem a dobiegnięciem gracz mógł mięso zjeść albo sprzedać.
      if (itemId && !Inventory.removeItem(itemId as ItemId, 1)) {
        this.say("Kirka obwąchała cię i uciekła");
        pies.biegnij(() => wejscie, KIRKA.biegPxS, 8, () => {
          pies.setAlpha(0);
          pies.przenies(k.dom.x, k.dom.y);
          this.trwa.delete(KIRKA.spot);
        });
        return;
      }
      this.say("Kirka!");
      pies.zjedz(this.scene.time.now, KIRKA.jedzenieMs, () => {
        Quests.recordReach(KIRKA.spot);
        pies.biegnij(() => wejscie, KIRKA.biegPxS, 8, () => {
          pies.przenies(k.dom.x, k.dom.y);
          this.trwa.delete(KIRKA.spot);
        });
      });
    });
  }
}

/** Kirki nie ma na mapie, dopóki jej nie zwabiono (Anna już jej szuka). */
export function kirkaZaginiona(): boolean {
  const id = KIRKA.questId as QuestId;
  const status = Quests.getStatus(id);
  if (status === "completed") return false;
  return !(status === "active" && Quests.isObjectiveMet(id));
}

/** Punkt tuż ZA krawędzią świata najbliższą `p` — kamera go nie pokaże. */
function zaKrawedzia(scene: Phaser.Scene, p: Punkt, zapas: number): Punkt {
  const b = scene.physics.world.bounds;
  const odl = [
    { d: p.y - b.top, x: p.x, y: b.top - zapas },
    { d: b.bottom - p.y, x: p.x, y: b.bottom + zapas },
    { d: p.x - b.left, x: b.left - zapas, y: p.y },
    { d: b.right - p.x, x: b.right + zapas, y: p.y },
  ];
  odl.sort((a, c) => a.d - c.d);
  return { x: odl[0].x, y: odl[0].y };
}

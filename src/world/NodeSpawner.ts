import Phaser from "phaser";
import { GATHER, HERBS } from "../config/GameConfig";
import { Gathering } from "../core/Gathering";
import { Gatherable, type HerbId } from "../entities/Gatherable";
import type { Interactable } from "../core/Interactables";

/**
 * What a spawner needs from the scene. A tiny interface for the same reason
 * `ProjectileHost` is one: the spawner must not import `GameScene` (that would
 * close a cycle), and the scene must keep ownership of the interactable list.
 */
export interface GatherHost {
  addInteractable(it: Interactable): void;
  removeInteractable(it: Interactable): void;
}

/**
 * Grows ONE species on ONE map, out of a pool of authored stanowiska.
 *
 * ── The design, and why it is not "a plant per point on a timer" ───────────
 * Classic RPG herb nodes are fixed spawn points, and that is right — a habitat
 * is *content*, guaranteed by whoever placed the point, and randomising a
 * position at runtime would happily drop pokrzywa inside a barn (this game has
 * no collision to prevent it) while making Dorota's "look by the fences" a lie.
 *
 * The thing fixed points get wrong on their own is that after three sessions
 * the player stops looking and runs a memorised lap. So: **more stanowiska than
 * plants.** `GATHER.activeRatio` keeps roughly a third of a map's points grown
 * at any time, which leaves the *habitat* as the useful knowledge and stops
 * any *individual bush* from replacing it.
 *
 * **Only NEW growth is random — a plant nobody picked stays exactly where it
 * was, across any number of map transitions.** Growth (`tick`, and the
 * elapsed-time regrowth computed on arrival) always lands on a freshly
 * *random* stanowisko; but which stanowiska were already standing is
 * bookmarked by INDEX (`Gathering.activeNodes`/`record`), not just counted,
 * and those exact ones are replanted on return. Getting this wrong reads as a
 * plant that was never touched teleporting to a different bush purely
 * because the player crossed a portal and came back — reported directly, and
 * wrong for the same reason a fixed spawn point is right in the first place:
 * nothing happened to that plant while nobody was there to make it happen.
 *
 * ── Why this is cheap, and stays cheap at twenty maps ──────────────────────
 *  • Stanowiska are plain coordinates, not game objects: a 40-point species is
 *    40 records, no sprites, no bodies, nothing drawn.
 *  • **One timer per species, not per node.** It asks "am I below the cap?" and
 *    grows at most one plant per tick.
 *  • Live sprites are capped by `maxActive`, and none of them has an `update()`.
 *  • **Maps the player is not on are never simulated.** Regrowth while away is
 *    arithmetic done once on arrival — see `Gathering.activeNodes`. That is
 *    what makes this scale: twenty maps cost twenty short index lists in the
 *    save and zero background work.
 */
export class NodeSpawner {
  /** Every stanowisko the map authored for this species. */
  private readonly nodes: readonly Phaser.Math.Vector2[];
  /** Indices with nothing growing on them. */
  private free: number[];
  /** nodeIndex → the plant standing there. */
  private readonly grown = new Map<number, Gatherable>();
  private readonly maxActive: number;
  private readonly respawnMs: number;
  private timer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly host: GatherHost,
    private readonly mapId: string,
    readonly herb: HerbId,
    nodes: readonly Phaser.Math.Vector2[],
  ) {
    this.nodes = nodes;
    this.free = nodes.map((_, i) => i);
    // At least one, or a map with a single authored stanowisko would grow
    // nothing at all and read as a placement mistake.
    this.maxActive = Math.max(1, Math.round(nodes.length * GATHER.activeRatio));
    this.respawnMs = HERBS[herb].respawnSec * 1000;
  }

  /**
   * Plant whatever should already be standing when the player walks in, then
   * start topping up. Nothing happens on a map that authored no stanowiska.
   *
   * `Gathering.activeNodes` returns `null` only on the very first-ever visit
   * to this map/species — there is no bookmark yet, so there is nothing to
   * preserve and the initial set is chosen at random like any other growth.
   * On every later visit it returns the EXACT stanowiska to plant: whichever
   * were standing when the player left (unchanged — nothing touched them
   * while nobody was there to) plus whatever regrowth the elapsed time earns,
   * newly randomised. See `Gathering`'s doc comment for why a bare count
   * used to let an untouched plant "teleport" to a different bush.
   */
  start(): void {
    if (this.nodes.length === 0) return;
    const seeded = Gathering.activeNodes(this.mapId, this.herb, this.nodes.length, this.maxActive, this.respawnMs);
    if (seeded === null) {
      for (let i = 0; i < this.maxActive; i++) this.growOne();
    } else {
      for (const nodeIndex of seeded) this.growAt(nodeIndex);
    }

    // Jitter is per-species and applied to the CHECK interval rather than to a
    // per-plant countdown, because there is no per-plant countdown to jitter —
    // it exists so two species with the same respawnSec don't pop in lockstep.
    this.timer = this.scene.time.addEvent({
      delay: GATHER.tickMs + Math.random() * 1000,
      loop: true,
      callback: () => this.tick(),
    });
  }

  /** Record exactly which stanowiska were standing, so the next visit can
   *  preserve them instead of re-rolling every plant from scratch. */
  stop(): void {
    this.timer?.remove();
    this.timer = undefined;
    Gathering.record(this.mapId, this.herb, [...this.grown.keys()]);
  }

  /**
   * Pick this plant: free its stanowisko and take it off the board.
   *
   * The stanowisko is freed and the interactable unregistered BEFORE the
   * collect tween starts, so a plant mid-fade can never be picked a second
   * time — same rule as `Enemy.die` destroying its HP bar immediately rather
   * than on the tween's completion.
   */
  collect(plant: Gatherable): void {
    if (!this.grown.has(plant.nodeIndex)) return;
    this.grown.delete(plant.nodeIndex);
    this.free.push(plant.nodeIndex);
    this.host.removeInteractable(plant);
    plant.collect();
    // ⚠ Zakładka aktualizowana także PRZY ZEBRANIU (`OI-62`, 2026-10-09).
    // Do tej daty powstawała wyłącznie w `stop()`, czyli przy rozbiórce sceny —
    // gracz, który zbierał i wychodził z gry bez przejścia bramą, zastawał po
    // wczytaniu te same rośliny na tych samych stanowiskach, mając już zioła
    // w plecaku. Zegar startuje od zebrania; wzrost w trakcie sesji po nim
    // odtworzy rachunek `Gathering.activeNodes` z upływu czasu. `stop()`
    // nadal zapisuje stan przy wyjściu z mapy i ma ostatnie słowo.
    Gathering.record(this.mapId, this.herb, [...this.grown.keys()]);
  }

  private tick(): void {
    // A plant is grown per tick at most, so a map cleared of a species fills
    // back up gradually rather than all at once behind the player's back.
    if (this.grown.size >= this.maxActive) return;
    if (Math.random() > GATHER.tickMs / this.respawnMs) return;
    this.growOne();
  }

  /** Put one plant on a random free stanowisko. Used for in-session growth
   *  (`tick`) and for the very first-ever visit, where there is no bookmarked
   *  identity yet to plant onto specific stanowiska instead. */
  private growOne(): void {
    if (this.free.length === 0 || this.grown.size >= this.maxActive) return;
    const pick = Math.floor(Math.random() * this.free.length);
    this.growAt(this.free[pick]);
  }

  /** Put one plant on a SPECIFIC stanowisko — used when restoring exactly
   *  which nodes `Gathering.activeNodes` says should already be standing. */
  private growAt(nodeIndex: number): void {
    const freeIdx = this.free.indexOf(nodeIndex);
    if (freeIdx === -1) return; // already grown or out of range — guard, not expected
    this.free.splice(freeIdx, 1);
    const at = this.nodes[nodeIndex];
    const plant = new Gatherable(this.scene, at.x, at.y, this.herb, nodeIndex);
    this.grown.set(nodeIndex, plant);
    this.host.addInteractable(plant);
  }

  /** For verification and the report line: how many are standing right now. */
  get activeCount(): number {
    return this.grown.size;
  }

  get nodeCount(): number {
    return this.nodes.length;
  }

  get cap(): number {
    return this.maxActive;
  }
}

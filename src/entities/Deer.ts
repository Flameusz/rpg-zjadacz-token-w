import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { DEER, AKCJE, ASSETS } from "../config/GameConfig";
import { deerAnim } from "../core/Animations";
import { Sfx } from "../core/Sfx";
import { ActionRunner } from "../core/CombatAction";
import { gapBetween } from "../core/CombatGeometry";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";

/** Poniżej tej prędkości (px/s) stworzenie „stoi" — ten sam próg co reszta rosteru. */
const STOP_SPEED = 2;

/** Płoszenie: `alert` = zauważył cię i stoi, `bolt` = zryw, `watch` = postój. */
type FleePhase = "idle" | "alert" | "bolt" | "watch";

/**
 * **Jeleń — istota NEUTRALNA, która się broni** (2026-10-04). Liczby i ich
 * pochodzenie: `DEER` w `GameConfig.ts`.
 *
 * - **Nie atakuje pierwszy.** Gracz w `flight.alertRange` płoszy go dokładnie
 *   tak, jak płoszył kryttera z Fazy 1 fauny: czujność → zryw → postój → zryw…
 *   aż się odsadzi (`calmGap`).
 * - **Uderzony — broni się.** Od pierwszego ciosu podchodzi, STAJE na
 *   `ram.range`, opuszcza poroże (telegraf) i bodzie, rozstrzygając przeciw
 *   `ram.reach` — wzór rozjuszonego królika.
 * - **Po zerwaniu pościgu uspokaja się całkiem** (jak lis).
 *
 * ⚠ Zachowanie ZGŁASZA INTENCJĘ. Zryw idzie do punktu z `Enemy.escapePoint`
 * (`seek`, z wolną drogą) — krytter zrywał się zamrożonym impulsem wprost od
 * gracza, czyli w lesie prosto w pień.
 */
export class Deer extends Enemy {
  private readonly akcje = new ActionRunner();
  /** Uderzony — broni się do zerwania pościgu. */
  private provoked = false;
  private fleePhase: FleePhase = "idle";
  private fleeUntil = 0;
  /** Punkt bieżącego zrywu — wybrany na starcie i NIE korygowany. */
  private boltTarget: Phaser.Math.Vector2 | null = null;
  /** Gdzie ostatnio był gracz — zwrot modelu 3D w czujności i walce. */
  private lastPlayer: { x: number; y: number } | null = null;
  private hurtUntil3d = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Jawna klatka startowa — ten sam powód co u niedźwiedzia i lisa.
    super(scene, x, y, "deer", DEER, ASSETS.deer.idleKey, 0);
    this.play(deerAnim("idle"));
  }

  /** Cios i zryw to zobowiązania — nie zrywa pościgu w ich trakcie. */
  protected canDeaggro(): boolean {
    return !this.akcje.busy && this.fleePhase !== "bolt";
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
    this.provoked = false;
    this.fleePhase = "idle";
    this.fleeUntil = 0;
    this.setBaseTint(null);
  }

  /** ⚠ Uderzenie ZAWSZE prowokuje — to jest cała „neutralność": nic innego. */
  protected onHurt(): void {
    this.hurtUntil3d = this.scene.time.now + 320;
    if (!this.provoked) Sfx.play("growl");
    this.provoked = true;
    this.fleePhase = "idle";
  }

  interrupt(): void {
    if (this.isDead) return;
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  /** Cios ma własny test zasięgu (`resolveRam`) — kontakt nie ma czego rozstrzygać. */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const you = player.combatOrigin;
    this.lastPlayer = { x: you.x, y: you.y };
    if (this.provoked) this.fight(player, nowMs);
    else this.flee(player, nowMs);
  }

  /** ⚠ Dystanse między ŚRODKAMI CIAŁ — tą samą przestrzenią, w której mierzy walka. */
  private flee(player: CombatTarget, nowMs: number): void {
    const f = DEER.flight;
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);

    if (this.fleePhase === "bolt") {
      if (this.boltTarget) this.move.seek(this.boltTarget.x, this.boltTarget.y, f.boltSpeed);
      else this.move.flee(you.x, you.y, f.boltSpeed);
      if (nowMs >= this.fleeUntil) {
        this.fleePhase = "watch";
        this.fleeUntil = nowMs + f.watchMs;
        this.move.hold();
      }
      return;
    }

    this.move.hold();
    if (dist > f.calmGap) {
      this.fleePhase = "idle";
      this.fleeUntil = 0;
      return;
    }
    if (this.fleePhase === "watch") {
      // `panicGap`: gracz dochodzi w trakcie postoju — zryw od razu
      // (wyprowadzenie: `docs/fauna_faza1.md` §3.3).
      if (dist <= f.panicGap || nowMs >= this.fleeUntil) this.startBolt(player, nowMs);
      return;
    }
    if (this.fleePhase === "alert") {
      // Gracz odszedł przed zrywem — czujność trwa tyle, co zagrożenie.
      if (dist > f.alertRange) {
        this.fleePhase = "idle";
        return;
      }
      if (nowMs >= this.fleeUntil) this.startBolt(player, nowMs);
      return;
    }
    if (dist > f.alertRange) return;
    this.fleePhase = "alert";
    this.fleeUntil = nowMs + f.alertMs;
  }

  private startBolt(player: CombatTarget, nowMs: number): void {
    const f = DEER.flight;
    this.fleePhase = "bolt";
    this.fleeUntil = nowMs + f.boltMs;
    this.boltTarget = this.escapePoint(player, (f.boltSpeed * f.boltMs) / 1000, f.escapeFanDeg);
  }

  /** Obrona — podejdź, STAŃ, opuść poroże, bódź. */
  private fight(player: CombatTarget, nowMs: number): void {
    const r = DEER.ram;
    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveRam(player);
      if (p.to === "recovery") this.setBaseTint(null);
    }
    if (this.akcje.busy) {
      this.move.hold();
      return;
    }
    // ⚠ PRZEŚWIT między hurtboxami, nie dystans środków.
    if (gapBetween(this.combatBody, player.combatBody) > r.range) {
      const cel = player.combatOrigin;
      this.move.seek(cel.x, cel.y, r.approachSpeed);
      return;
    }
    this.move.hold();
    if (player.isDead) return;
    if (this.akcje.request(AKCJE.deerRam, nowMs)) this.setBaseTint(AKCJE.deerRam.telegraphTint);
  }

  /** Cios porożem — dystans PONOWNIE przeciw `reach`; pudło się zgłasza (Faza 5A). */
  private resolveRam(player: CombatTarget): void {
    if (player.isDead) return;
    if (gapBetween(this.combatBody, player.combatBody) > DEER.ram.reach) {
      this.reportAttack(AKCJE.deerRam, "miss", player, 0, "whiff");
      return;
    }
    const wykonanie = this.rollExecution(true);
    if (wykonanie === "fumble") {
      this.reportAttack(AKCJE.deerRam, "miss", player, 0, wykonanie);
      return;
    }
    const wynik = player.takeDamage(
      this.damagePacket(
        Phaser.Math.Between(AKCJE.deerRam.damageMin, AKCJE.deerRam.damageMax),
        AKCJE.deerRam.damageType,
        wykonanie,
      ),
      this.hitVectorTo(player),
      wykonanie,
    );
    this.reportAttack(AKCJE.deerRam, wynik.outcome, player, wynik.mitigated, wykonanie);
  }

  /** ⭐ Co pokazać na modelu 3D (`Creature3D`). ⛔ Nic tu nie zmienia zachowania. */
  stan3d(): Stan3D {
    const g = this.lastPlayer;
    const o = this.combatOrigin;
    const naGracza = g ? Math.atan2(g.x - o.x, g.y - o.y) : null;
    if (this.isStunned) return { klip: "Stunned" };
    const faza = this.akcje.phase;
    if (this.akcje.current?.id === AKCJE.deerRam.id) {
      if (faza === "windup") return { klip: "Lower", kat: naGracza };
      return { klip: "Ram", raz: true, kat: naGracza };
    }
    if (this.scene.time.now < this.hurtUntil3d) return { klip: "Hit", raz: true };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= STOP_SPEED) {
      const czujny = this.isChasing && (this.fleePhase === "alert" || this.fleePhase === "watch" || this.provoked);
      return { klip: czujny ? "Alert" : "Idle", kat: this.isChasing ? naGracza : null };
    }
    return { klip: v > DEER.patrolSpeed * 2 ? "Run" : "Walk" };
  }

  /** Arkusz 2D (ścieżka awaryjna): `deer_*.png` patrzą w LEWO — lustro przy vx > 0. */
  protected updateAnimation(vx: number, vy: number): void {
    const speed = Math.hypot(vx, vy);
    if (speed <= STOP_SPEED) {
      this.play(deerAnim("idle"), true);
      return;
    }
    this.setFlipX(vx > 0);
    this.play(speed > DEER.patrolSpeed * 2 ? deerAnim("run") : deerAnim("walk"), true);
  }
}

import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { AKCJE, ASSETS, BANDIT_AXE, BANDIT_CHIEF, BANDIT_CLUB } from "../config/GameConfig";
import { Sfx } from "../core/Sfx";
import { ActionRunner, type CombatAction } from "../core/CombatAction";
import { angleBetweenDeg, gapBetween } from "../core/CombatGeometry";
import { Enemy, type EnemyType } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";

/** Trzy odmiany zbója — jedna klasa, różni je konfig i akcja zamachu. */
export type BanditKind = "bandit_club" | "bandit_axe" | "bandit_chief";

const ODMIANY: Record<BanditKind, { cfg: typeof BANDIT_CLUB | typeof BANDIT_AXE | typeof BANDIT_CHIEF; akcja: CombatAction }> = {
  bandit_club: { cfg: BANDIT_CLUB, akcja: AKCJE.banditClubSwing },
  bandit_axe: { cfg: BANDIT_AXE, akcja: AKCJE.banditAxeSwing },
  bandit_chief: { cfg: BANDIT_CHIEF, akcja: AKCJE.banditChiefSwing },
};

/** Poniżej tej prędkości (px/s) model stoi — jak u niedźwiedzia. */
const STOP_SPEED = 2;
/** Prędkość, przy której klip chodu gra 1:1 — ta sama co `Character3D`
 *  (`TEMPO_REF_PX_S`): zbój i gracz chodzą tym samym cyklem. */
const TEMPO_REF_PX_S = 120;
/** Klip `Attack` (`tools/char3d_attack.py`): 5 klatek przy 5 fps, cięcie
 *  w klatce 2 — czyli 0,4 s od startu klipu do uderzenia. */
const CIECIE_W_KLIPIE_S = 0.4;

/**
 * ⭐ ZBÓJ — pierwszy humanoidalny wróg (2026-10-11, `OI-171`,
 * `docs/bandyci_plan.md`).
 *
 * ⛔ **Bez nowego systemu.** Zamach to `ActionRunner` w kształcie
 * `Bear.resolveSwipe`: telegraf tintem w `windup`, rozstrzygnięcie na wejściu
 * w `active` (prześwit + łuk), bezbronność w `recovery`. Alarm obozu to wzór
 * wycia wilka: kto rusza w pościg, budzi kompanów w `alarmRadius`
 * (`aggro()` jest publiczne, a na goniącym już zbóju jest no-opem — rekurencja
 * kończy się sama).
 *
 * ⚠ Grafiki 2D zbój nie ma: sprite to pojedyncza klatka mieszkańca
 *   (`ASSETS.npc.portraitKey`) i widać go tylko do chwili, w której wczyta
 *   się model (`Creature3D`, `characters/enemy_<id>.glb`) — gra zawsze się
 *   uruchamia, także bez modelu.
 */
export class Bandit extends Enemy {
  private readonly akcje = new ActionRunner();
  private readonly swingDir = new Phaser.Math.Vector2(0, 1);
  /** Czas sceny startu bieżącego zamachu — `od` klipu `Attack` (nowy zamach = klip od nowa). */
  private zamachOd = 0;
  private readonly odmiana: (typeof ODMIANY)[BanditKind];

  constructor(scene: Phaser.Scene, x: number, y: number, kind: BanditKind) {
    const o = ODMIANY[kind];
    super(scene, x, y, kind as EnemyType, o.cfg, ASSETS.npc.portraitKey);
    this.odmiana = o;
  }

  protected onGainAggro(): void {
    Sfx.play("growl");
    this.zbudzObóz();
  }

  /** Budzi kompanów w promieniu alarmu — obóz walczy razem. */
  private zbudzObóz(): void {
    const r = this.odmiana.cfg.alarmRadius;
    const grupa = (this.scene as unknown as { enemies?: Phaser.GameObjects.Group }).enemies;
    if (!grupa) return;
    for (const obj of grupa.getChildren()) {
      if (obj === this || !(obj instanceof Bandit) || obj.isDead) continue;
      if (Phaser.Math.Distance.Between(this.x, this.y, obj.x, obj.y) <= r) obj.aggro();
    }
  }

  protected canDeaggro(): boolean {
    return !this.akcje.busy;
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
    this.setBaseTint(null);
  }

  interrupt(): void {
    if (this.isDead) return;
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  /** Zbój bije zamachem z własnym testem zasięgu, nie dotykiem. */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const { cfg, akcja } = this.odmiana;
    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveSwing(player);
      if (p.to === "recovery") this.setBaseTint(null);
    }
    if (this.akcje.busy) {
      this.move.hold();
      return;
    }

    const gap = gapBetween(this.combatBody, player.combatBody);
    if (gap > cfg.swing.range) {
      const you = player.combatOrigin;
      this.move.seek(you.x, you.y, cfg.chaseSpeed);
      return;
    }

    this.move.hold();
    if (player.isDead) return;
    if (this.akcje.request(akcja, nowMs)) {
      const o = this.combatOrigin;
      const cel = player.combatOrigin;
      const d = new Phaser.Math.Vector2(cel.x - o.x, cel.y - o.y);
      if (d.lengthSq() < 0.0001) d.set(0, 1);
      this.swingDir.copy(d.normalize());
      this.zamachOd = nowMs;
      this.setBaseTint(akcja.telegraphTint ?? null);
    }
  }

  private resolveSwing(player: CombatTarget): void {
    if (player.isDead) return;
    const { cfg, akcja } = this.odmiana;
    const cel = player.combatBody;
    if (gapBetween(this.combatBody, cel) > cfg.swing.reach) {
      this.reportAttack(akcja, "miss", player, 0, "whiff");
      return;
    }
    const o = this.combatOrigin;
    const kat = angleBetweenDeg(this.swingDir.x, this.swingDir.y, cel.x - o.x, cel.y - o.y);
    if (!Number.isNaN(kat) && kat > cfg.swing.arcDeg) {
      this.reportAttack(akcja, "miss", player, 0, "whiff");
      return;
    }
    const wykonanie = this.rollExecution(false);
    const w = player.takeDamage(
      this.damagePacket(Phaser.Math.Between(akcja.damageMin, akcja.damageMax), akcja.damageType ?? null, wykonanie),
      this.hitVectorTo(player),
      wykonanie,
    );
    this.reportAttack(akcja, w.outcome, player, w.mitigated, wykonanie);
  }

  /**
   * Co pokazuje model (`Creature3D`). Klipy z `tools/npc3d.py` trybu wroga:
   * `Idle`, `Walk`, `Run`, `Attack`; śmierć to upadek korzenia (bez klipu).
   * ⚠ Tempo ciosu dobrane tak, żeby CIĘCIE w klipie (0,4 s) wypadło w chwili
   *   rozstrzygnięcia, czyli na końcu `windup` — model uderza wtedy, gdy gra
   *   liczy trafienie.
   */
  stan3d(): Stan3D {
    if (this.isStunned) return { klip: "Idle" };
    const zamach = Math.atan2(this.swingDir.x, this.swingDir.y);
    if (this.akcje.current?.id === this.odmiana.akcja.id) {
      const tempo = CIECIE_W_KLIPIE_S / (this.odmiana.cfg.swing.windupMs / 1000);
      return { klip: "Attack", raz: true, kat: zamach, tempo, od: this.zamachOd };
    }
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= STOP_SPEED) return { klip: "Idle" };
    const tempo = Phaser.Math.Clamp(v / TEMPO_REF_PX_S, 0.5, 2.0);
    return { klip: v > this.odmiana.cfg.patrolSpeed * 1.5 ? "Run" : "Walk", tempo };
  }

  /** Arkusza 2D nie ma — sprite stoi, dopóki nie zastąpi go model. */
  protected updateAnimation(vx: number): void {
    if (Math.abs(vx) > STOP_SPEED) this.setFlipX(vx < 0);
  }
}

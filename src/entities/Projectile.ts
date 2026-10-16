import Phaser from "phaser";
import type { CombatTarget, EffectTarget } from "../core/combat/Contracts";
import { SLOW } from "../core/combat/EffectKinds";
import { physicalDamage } from "../core/combat/DamagePacket";
import { DEPTH } from "../config/GameConfig";
import { expandingRing } from "../core/Fx";
// Type only — erased at compile time, so this adds no runtime import.
import type { DamageType } from "../core/Equipment";
import { ySortedWorldFor } from "../core/YSortedWorld";

/** Everything a fired projectile needs to know. */
export interface EnemyProjectileOptions {
  x: number;
  y: number;
  /** Unit heading. Committed at fire time — projectiles here never track. */
  dirX: number;
  dirY: number;
  speed: number;
  damageMin: number;
  damageMax: number;
  /**
   * **Skalar jakości wykonania strzelca — `m(P)` z warstwy 2** (`core/Proficiency`).
   *
   * ⚠ **Mnoży WYLOSOWANĄ wartość, nie granice przedziału.** Skalowanie
   * `damageMin`/`damageMax` osobno zwęża rozkład i przesuwa średnią: dla sieci
   * 4–7 przy `m(34) = 0,7515` dawało 3–5, czyli **cztery wartości zamiast
   * trzech i średnią −3,2% poniżej czystego skalaru**. Zmierzone, nie
   * oszacowane.
   *
   * ⚠ **To LICZBA, nie referencja do strzelca** — i to jest cały powód, dla
   * którego pocisk nadal nie zna właściciela. Gdyby niósł encję, zamknąłby cykl
   * importów, przed którym broni się interfejs `ProjectileHost`.
   *
   * ⚠ **Pole WYMAGANE**, z tego samego powodu co `damageType` wyżej: nowy
   * strzał ma zadeklarować decyzję, a nie odziedziczyć milczenie. `1` znaczy
   * „ten kanał świadomie nie ma warstwy 2".
   */
  damageMultiplier: number;
  /** Damage type on impact, or `null` for deliberately untyped (the web —
   *  see `WEB_PROJECTILE.damageType`). Required for the same reason
   *  `EnemyConfig.touchDamageType` is: a new shot must state a decision. */
  damageType: DamageType | null;
  /** Despawns after this long if it hits nothing. */
  lifetimeMs: number;
  textureKey: string;
  bodyRadius: number;
  /** Tint of the impact splash. */
  color: number;
  /** Optional movement debuff applied on hit. */
  slow?: {
    factor: number;
    durationMs: number;
    buffId: string;
    name: string;
    iconKey: string;
  };
}

/**
 * A scene that can host enemy projectiles. GameScene implements it; entities
 * call it through this interface rather than importing GameScene, which would
 * be a cycle (GameScene already imports every entity).
 */
export interface ProjectileHost {
  fireEnemyProjectile(opts: EnemyProjectileOptions): void;
}

/**
 * An enemy's fired shot — currently only the spider's web.
 *
 * Deliberately dumb: it flies in a straight line, hits the player once, and
 * dies on terrain or on a timer. All three matter as counterplay — a shot that
 * homed, pierced, or flew forever would remove the "strafe out of it" answer
 * the spider is built around.
 *
 * The projectile owns nothing about damage rules; it calls Player.takeDamage
 * like everything else, so armour mitigation and the regen lockout apply
 * without a second code path.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private readonly opts: EnemyProjectileOptions;
  private spent = false;

  constructor(scene: Phaser.Scene, opts: EnemyProjectileOptions) {
    super(scene, opts.x, opts.y, opts.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Rendering architecture ETAP 1B — see `core/YSortedWorld.ts`.
    ySortedWorldFor(scene)?.add(this);
    this.opts = opts;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(
      opts.bodyRadius,
      this.width / 2 - opts.bodyRadius,
      this.height / 2 - opts.bodyRadius,
    );

    this.setDepth(DEPTH.entities + opts.y);
    scene.tweens.add({ targets: this, angle: 360, duration: 700, repeat: -1 });

    // `active` is the guard: the timer outlives an early hit, and firing splat()
    // on an already-destroyed sprite would throw inside Phaser's tween manager.
    scene.time.delayedCall(opts.lifetimeMs, () => {
      if (this.active && !this.spent) this.splat();
    });
  }

  /**
   * Set it moving. **Must be called AFTER the scene has added it to the
   * projectile group, never from the constructor.**
   *
   * `Phaser.Physics.Arcade.Group.add()` applies the group's `defaults` to the
   * body it takes in — and those defaults include `setVelocityX/Y: 0` and
   * `setCollideWorldBounds: false`. A velocity set in the constructor is
   * therefore silently wiped the moment the shot joins the group: the web
   * spawned correctly, rendered correctly, and hung motionless 168px from the
   * player forever (measured — 156 frames at a constant offset). Anything that
   * has to survive joining the group belongs here.
   */
  launch(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.opts.dirX * this.opts.speed, this.opts.dirY * this.opts.speed);
    // It must die at the map edge rather than skid along it forever.
    body.setCollideWorldBounds(true);
    body.onWorldBounds = true;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.setDepth(DEPTH.entities + this.y);
    // Reaching the world edge is the same outcome as hitting a tree.
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!this.spent && !body.blocked.none) this.splat();
  }

  /** Land on the player: damage, optional slow, then gone. */
  hitPlayer(player: CombatTarget & EffectTarget): void {
    if (this.spent) return;
    // Not consumed against a corpse — nothing to hit, and it would look like
    // the shot vanished for no reason.
    if (player.isDead) return;
    this.spent = true;

    // ⚠ Kierunek pocisku to **odwrócony kierunek lotu**, a NIE „gdzie jest
    // pocisk względem gracza". W chwili trafienia pocisk nakłada się na
    // gracza, więc różnica pozycji jest bliska zeru i jej kąt byłby szumem —
    // tarcza raz by blokowała, raz nie, przy identycznym strzale. Kierunek
    // lotu jest stały od wystrzału i mówi dokładnie to, o co chodzi: z której
    // strony to przyleciało.
    // ⚠ **Kolejność: LOSUJ z oryginalnego przedziału, potem skaluj.** Odwrotna
    // (skalowanie granic) zwęża rozkład i przesuwa średnią — patrz
    // `damageMultiplier`. Wynik zostaje UŁAMKIEM: jedyne zaokrąglenie w całym
    // łańcuchu należy do `resolveIncoming` (`Math.max(1, Math.round(…))`), tak
    // samo jak dla obrażeń w zwarciu. Drugie zaokrąglenie tutaj byłoby tym
    // samym błędem, przed którym broni się komentarz w `Player.takeDamage`.
    player.takeDamage(
      physicalDamage(
        Phaser.Math.Between(this.opts.damageMin, this.opts.damageMax) * this.opts.damageMultiplier,
        this.opts.damageType,
      ),
      new Phaser.Math.Vector2(-this.opts.dirX, -this.opts.dirY),
    );
    const slow = this.opts.slow;
    // Invulnerability (a dash, or the post-revive grace) has to shrug off the
    // debuff too, or the roll would dodge the damage and still leave you stuck.
    if (slow && !player.isDead && !player.isInvulnerable) {
      // ⚠ Pocisk buduje SWOJE spowolnienie i podaje je celowi — patrz
      // `VenomSpider.venomSpec` po powód, dla którego nie woła już cudzej
      // metody `applySlow`. Liczby z `WEB_PROJECTILE`, bez zmian.
      player.applyEffect({
        id: slow.buffId,
        name: slow.name,
        iconKey: slow.iconKey,
        durationMs: slow.durationMs,
        debuff: true,
        tags: [SLOW.tag],
        payload: SLOW.payload({ factor: slow.factor }),
        detail: (e) => `Ruch −${Math.round((1 - SLOW.get(e, "factor")) * 100)}% — unik działa normalnie`,
      });
    }
    this.splat();
  }

  /** Impact puff + self-destruct. Public because terrain collision is resolved
   *  by the scene's collider, which has to be able to end the shot. */
  splat(): void {
    if (!this.active) return;
    this.spent = true;
    expandingRing(this.scene, {
      x: this.x,
      y: this.y,
      radius: 6,
      color: this.opts.color,
      alpha: 0.5,
      scale: 2.2,
      duration: 220,
      depth: DEPTH.entities + this.y,
    });
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }
}

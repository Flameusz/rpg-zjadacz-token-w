import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { SPIDER, WEB_PROJECTILE, AKCJE, ASSETS } from "../config/GameConfig";
import { Sfx } from "../core/Sfx";
import { ActionRunner } from "../core/CombatAction";
import { movementContextFor } from "../core/movement/MovementContext";
import { qualityMultiplier } from "../core/Proficiency";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";
import type { ProjectileHost } from "./Projectile";


/**
 * **Pająk sieciarz** — the first enemy that fights from range, and the first
 * that backs AWAY from the player.
 *
 * Every creature before it answered the same question ("are you in its face or
 * not?"). The spider asks a different one, and its answer is positional rather
 * than defensive: it holds a firing band between `retreatRange` and
 * `fireRange`, retreating out of melee and shuffling forward if you flee.
 *
 * Its real weapon is not damage (see WEB_PROJECTILE — the numbers are tiny).
 * It is a SUPPORT enemy: the web slows you, which is what makes a boar's
 * dodgeable charge undodgeable and lets a wolf stay glued to you. Hence the
 * spawn layout — one alone to teach what the web does, two beside a boar to
 * teach why it matters, and the roster's first "kill the caster first" lesson.
 *
 * Counterplay is deliberate and worth preserving: the wind-up is visible, the
 * shot commits to where you stood (strafe and it misses), terrain eats it, and
 * **Unik is immune to the slow** because a dash covers a fixed distance in a
 * fixed time.
 */
export class Spider extends Enemy {
  /** Plunięcie prowadzi `ActionRunner` (Faza 2). ⚠ Jitter cooldownu zostaje
   *  TUTAJ — runner jest czysty i nie losuje. */
  private readonly akcje = new ActionRunner();
  /** W tej klatce cofa się z zwarcia — model idzie TYŁEM, przodem do gracza. */
  private cofa3d = false;
  /** Do kiedy grać `Shoot` — sieć nie ma ani `active`, ani bezbronności. */
  private strzalDo3d = 0;
  /** Gdzie ostatnio był gracz (pościg) — zwrot modelu 3D w zamachu i odwrocie. */
  private ostatniGracz3d: { x: number; y: number } | null = null;
  /** Do kiedy grać na modelu 3D klip trafienia. */
  private trafionyDo3d = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "spider", SPIDER, ASSETS.spider.faceKey);
  }

  /** Committed once the legs are up — the wind-up is a promise to the player
   *  that a shot is coming, and it has to be kept. */
  protected canDeaggro(): boolean {
    return !this.akcje.busy;
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
    this.setBaseTint(null);
  }

  /** A blunt hit cancels the spit — the web never leaves, and the cooldown
   *  still runs, so interrupting it actually buys the ground it promises. */
  interrupt(): void {
    if (this.isDead) return;
    // Runner sam pilnuje, że cooldown mimo przerwania biegnie — a to jest cała
    // treść tej mechaniki: obuch ma KUPOWAĆ ziemię, nie odraczać sieć.
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  /** Ogłuszenie kasuje plucie z każdej fazy — sieć nie wychodzi, a cooldown
   *  i tak biegnie (ta sama reguła co przy przerwaniu). */
  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  /**
   * ⚠ **Kontakt WŁĄCZONY świadomie.** Sieciarz nie wchodzi w gracza — cofa się
   * poniżej `retreatRange` i trzyma pas ognia — więc zetknięcie zdarza się
   * wyłącznie wtedy, gdy to GRACZ w niego wejdzie. To nie jest ten kanał, który
   * Combat v2 usuwał (atak przez wchodzenie w sylwetkę), tylko „nadepnąłeś na
   * pająka".
   *
   * ⚠ Nie jest to jednak kanał poboczny: **3–5 obrażeń wobec 4–7 z sieci**.
   * Wyłączenie go to realne osłabienie i wymaga decyzji, nie porządków.
   */
  protected get contactDamageEnabled(): boolean {
    return true;
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const r = SPIDER.ranged;
    // ⚠ **Pasmo ognia mierzy się między ŚRODKAMI CIAŁ (2026-09-07).** To jest ta
    // sama przestrzeń, w której `fire()` niżej już celuje (`combatOrigin`) —
    // do tej daty sieciarz USTAWIAŁ SIĘ według duszków, a STRZELAŁ według ciał.
    // `retreatRange`/`fireRange` nietknięte.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);
    this.setFlipX(player.x < this.x);
    this.ostatniGracz3d = { x: you.x, y: you.y };
    this.cofa3d = false;

    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.fire(player, nowMs);
      if (p.to === "recovery" || p.to === "idle") this.setBaseTint(null);
    }
    if (this.akcje.busy) {
      this.move.hold();
      return;
    }

    if (dist < r.retreatRange) {
      // Too close — scuttle backwards. Slower than the player on purpose: it is
      // meant to be catchable, just irritating to catch.
      // ⚠ `flee`, nie `seek` w tył: odwrót nie ma punktu docelowego, więc nie
      // wolno mu zawracać ku graczowi przy omijaniu przeszkody.
      this.move.flee(you.x, you.y, r.retreatSpeed);
      this.cofa3d = true;
      return;
    }

    if (dist > r.fireRange) {
      this.move.seek(you.x, you.y, SPIDER.chaseSpeed);
      return;
    }

    // In the firing band: plant and shoot.
    this.move.hold();
    if (player.isDead) return;

    // ⚠ LOS check PRZED wejściem w windup, nie w `fire()`. Bez tego sieciarz
    // ogłaszał zamiar (tint + growl), blokował własny cooldown i tak czy
    // owak trafiał w pień — koszt strzału bez jego skutku. Sprawdzane na
    // `NavGrid` (ta sama siatka co kolizja terenu, `src/world/CLAUDE.md`:
    // „nie buduj drugiego systemu kolizji"), szerokością realnego pocisku
    // (`WEB_PROJECTILE.bodyRadius`), nie ciała pająka — to POCISK ma dolecieć.
    const from = (this.body as Phaser.Physics.Arcade.Body).center;
    // ⚠ `combatOrigin` to DOKŁADNIE `body.center` — ta sama liczba, tylko
    // pytana kontraktem zamiast rzutowania na ciało Arcade'a.
    const to = player.combatOrigin;
    const nav = movementContextFor(this.scene).nav;
    if (nav && !nav.hasClearLine(from.x, from.y, to.x, to.y, WEB_PROJECTILE.bodyRadius * 2)) {
      return; // brak czystego pola ognia — nie zaczynaj zamachu, cooldown się nie rusza
    }

    // ⚠ Jitter dokładany PER PRÓBĘ, nie w akcji: runner jest czysty i nie ma
    // prawa losować. Dzięki temu wataha sieciarzy nie plunie równo w takt.
    const cd = SPIDER.ranged.cooldownMs + Math.random() * SPIDER.ranged.cooldownJitterMs;
    if (this.akcje.request(AKCJE.spiderWeb, nowMs, cd)) {
      this.setBaseTint(AKCJE.spiderWeb.telegraphTint);
      Sfx.play("growl");
    }
  }

  protected onHurt(): void {
    this.trafionyDo3d = this.scene.time.now + 320;
  }

  /**
   * ⭐ **Co pokazać na modelu 3D** (`Creature3D`, 2026-10-04) — odczyt fazy
   * `ActionRunner`a, ogłuszenia i ruchu. ⛔ Nic tu nie zmienia zachowania.
   */
  stan3d(): Stan3D {
    const g = this.ostatniGracz3d;
    const naGracza = g ? Math.atan2(g.x - this.combatOrigin.x, g.y - this.combatOrigin.y) : null;
    if (this.isStunned) return { klip: "Stunned" };
    const faza = this.akcje.phase;
    if (this.akcje.current?.id === AKCJE.spiderWeb.id) {
      if (faza === "windup") return { klip: "Rear", kat: naGracza };
      // ⚠ `active` trwa tu JEDNĄ klatkę (rozstrzygnięcie natychmiastowe), więc
      // klip ciosu gra w bezbronności PO nim — inaczej model przeskakiwał z
      // zamachu prosto w bezruch i ciosu nie było widać wcale (test w grze).
      if (faza === "active" || faza === "recovery") return { klip: "Shoot", raz: true, kat: naGracza };
    }
    if (this.scene.time.now < this.strzalDo3d) return { klip: "Shoot", raz: true, kat: naGracza };
    if (this.scene.time.now < this.trafionyDo3d) return { klip: "Hit", raz: true };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= 2) return { klip: "Idle", kat: this.isChasing ? naGracza : null };
    // Odwrót: chód WSTECZ, przodem do gracza — inaczej odwracałby się tyłem.
    if (this.cofa3d) return { klip: "Walk", tempo: -1.3, kat: naGracza };
    return { klip: v > this.cfg.patrolSpeed * 1.6 ? "Run" : "Walk" };
  }

  private fire(player: CombatTarget, _nowMs: number): void {
    this.strzalDo3d = this.scene.time.now + 350;
    // ⚠ Fazą, tintem i cooldownem zarządza runner — tutaj zostaje SAM STRZAŁ.

    // Aimed in BODY space, not sprite space. Every entity here anchors its
    // collision body at the feet, well below the sprite's centre — firing from
    // one sprite centre at another sends the web along a line that misses the
    // player's actual body underneath. Measured: a level shot from 180px passed
    // 5px under the player's hitbox and expired on its lifetime, every time.
    const from = (this.body as Phaser.Physics.Arcade.Body).center;
    const target = player.combatOrigin;
    const dir = new Phaser.Math.Vector2(target.x - from.x, target.y - from.y);
    if (dir.lengthSq() < 0.0001) dir.set(this.flipX ? -1 : 1, 0);
    dir.normalize();

    // The scene owns the projectile group and its collisions. Reached through
    // the ProjectileHost interface rather than by importing GameScene, which
    // would close a cycle — and guarded, so an alternate host (or a test
    // harness) that can't fire simply doesn't, instead of throwing per shot.
    const host = this.scene as unknown as Partial<ProjectileHost>;
    if (typeof host.fireEnemyProjectile !== "function") return;

    // ── ⚠ WARSTWA 2: pocisk dostaje SKALAR `m(P)` i nic poza tym ───────────
    // Kategorie (`fumble`/`graze`) go NIE dotyczą, i to jest rozstrzygnięcie
    // architektoniczne, nie strojenie. Cztery powody, każdy osobny:
    //
    //  1. **Na sieciarzu nie ma chwili rozstrzygnięcia** — `fire()` tylko
    //     wystrzeliwuje; czy sieć trafi, decyduje `overlap` do 1300 ms później,
    //     w innym obiekcie. Kontrakt warstwy 2 („atak przeszedł geometrię →
    //     jak go wykonano") jest tu niewykonalny w wymaganej kolejności.
    //  2. **`Projectile.hitPlayer` nie produkuje `ActionResolution`** — woła
    //     `takeDamage` wprost. Execution Miss byłby DOSŁOWNIE niewidoczny:
    //     sieć wlatuje w gracza, robi `splat()` i nie dzieje się nic.
    //  3. **Warstwa 1 odpowiada na to pytanie już trzy razy**: LOS na `NavGrid`
    //     przed windupem, zamrożony kierunek (strafe = pudło) i teren zjadający
    //     pocisk. Czwarty, losowy tryb porażki odbiera kontrgrę, a nie dokłada.
    //  4. **Spowolnienie zostaje NIETKNIĘTE** (kontrakt H1): efekt statusowy
    //     jest ładunkiem kontaktu, a nie wielkością skalowaną przez `m(P)`.
    //
    // ⚠ **Pocisk dostaje SKALAR jako LICZBĘ, nie referencję do strzelca** —
    // dzięki temu nadal nie zna właściciela i nie powstaje cykl importów, dla
    // którego istnieje cały interfejs `ProjectileHost`. Mnożenie WYLOSOWANEJ
    // wartości (a nie granic przedziału) należy do `Projectile.hitPlayer`;
    // uzasadnienie liczbowe stoi przy `EnemyProjectileOptions.damageMultiplier`.
    Sfx.play("spit");
    host.fireEnemyProjectile({
      // Spawned a little ahead of the spider's own body so it doesn't clip it.
      x: from.x + dir.x * 12,
      y: from.y + dir.y * 12,
      dirX: dir.x,
      dirY: dir.y,
      speed: WEB_PROJECTILE.speed,
      // Przedział zostaje ORYGINALNY — skalar idzie osobnym polem niżej.
      damageMin: WEB_PROJECTILE.damageMin,
      damageMax: WEB_PROJECTILE.damageMax,
      damageMultiplier: qualityMultiplier(SPIDER.proficiency),
      damageType: WEB_PROJECTILE.damageType,
      lifetimeMs: WEB_PROJECTILE.lifetimeMs,
      textureKey: ASSETS.web.textureKey,
      bodyRadius: WEB_PROJECTILE.bodyRadius,
      color: WEB_PROJECTILE.color,
      slow: {
        factor: WEB_PROJECTILE.slowFactor,
        durationMs: WEB_PROJECTILE.slowMs,
        buffId: WEB_PROJECTILE.buffId,
        name: WEB_PROJECTILE.name,
        iconKey: ASSETS.web.textureKey,
      },
    });
  }
}

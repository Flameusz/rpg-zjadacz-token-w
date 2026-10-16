import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { GREY_WOLF, AKCJE, ASSETS, DEPTH } from "../config/GameConfig";
import { greyWolfAnim } from "../core/Animations";
import { expandingRing, floatingText } from "../core/Fx";
import { Sfx } from "../core/Sfx";
import { gapBetween } from "../core/CombatGeometry";
import { Wolf } from "./Wolf";

/** The duel cycle. Distinct from the pack's circle/lunge/recover. */

/**
 * **Szary** — the named wolf that mauled the Hunter, and the one enemy on this
 * map the player has a personal reason to want dead (docs/swiat.md; the
 * Hunter's closing line, "ten szary wciąż gdzieś tam jest").
 *
 * He is a Wolf, deliberately: he answers a howl and howls himself, because the
 * fiction says he leads the pack. What he replaces is the hunt cycle.
 *
 * **The duel.** He closes, bites, and immediately springs back out of reach.
 * That single rule is the whole fight: standing still and swinging accomplishes
 * nothing, slow weapons whiff into the space he just left, and the player has
 * to chase their damage. It is the third distinct question the roster asks —
 * the boar tests reading a telegraph, the pack tests handling several at once,
 * the Szary tests landing a hit on something that will not hold still.
 *
 * **The second act.** Below `enrage.hpFraction` he stops retreating altogether,
 * turns red, and simply comes at you, faster and harder. The retreat was the
 * player's safety as much as his — losing it flips the fight from patient to
 * frantic at exactly the moment they can taste the kill.
 *
 * Counterplay, all of it already in the game: **Unik** closes the gap his
 * backstep opens, **Okrzyk bojowy** turns the enraged phase into a race worth
 * winning, and the wind-up is long enough to walk out of if you are watching.
 */
export class GreyWolf extends Wolf {
  /**
   * ⚠ **Szary DZIEDZICZY `akcje` po `Wolf`** — jeden runner, dwie zupełnie
   * różne akcje (`wolf_lunge` u watahy, `grey_bite` u niego). Cooldowny są
   * kluczowane po `id`, więc się nie mieszają, a Szary i tak nigdy nie woła
   * wypadu: nadpisuje `updateChase` w całości.
   */
  /** Dokąd trwa ODSKOK wewnątrz fazy `recovery`. Runner nie zna ruchu, więc
   *  encja odmierza tę część sama — patrz `AKCJE.greyBite.recoveryMs`. */
  private backstepUntil = 0;
  private enraged = false;
  private readonly backstepVel = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // His own sheet (greywolf.png), his own anim-key function — NOT
    // wolf.png at a bigger scale. See the comment on ASSETS.greyWolf.
    super(scene, x, y, "greywolf", GREY_WOLF, ASSETS.greyWolf.key, 0, greyWolfAnim);
  }

  /** Only breaks off while stalking — never mid-bite, and never once enraged
   *  (an enraged Szary that gave up and wandered home would be absurd). */
  protected canDeaggro(): boolean {
    // „Stalk" to dziś: nic nie trwa I cooldown jeszcze nie minął. Zerwać
    // pościg wolno wyłącznie w tym oknie — nigdy w trakcie kęsa i nigdy w szale.
    return !this.akcje.busy && !this.akcje.isReady(AKCJE.greyBite, this.scene.time.now) && !this.enraged;
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
    this.backstepUntil = 0;
    this.refreshTint();
  }

  /**
   * Derive the tint from state instead of setting it at each transition.
   *
   * The enrage red must outrank the wind-up amber (he is permanently enraged
   * but only briefly winding up), and four separate call sites each remembering
   * `if (!this.enraged)` is exactly how that ordering rots. Routed through
   * `setBaseTint` so the hit flash restores it rather than wiping it.
   */
  private refreshTint(): void {
    if (this.enraged) this.setBaseTint(GREY_WOLF.enrage.tint);
    else if (this.akcje.phase === "windup") this.setBaseTint(GREY_WOLF.duel.windupTint);
    else this.setBaseTint(null);
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const d = GREY_WOLF.duel;

    this.checkEnrage();

    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveBite(player, nowMs);
      if (p.to === "idle") this.refreshTint();
    }

    if (this.akcje.phase === "windup") {
      this.move.hold();
      this.setFlipX(player.x < this.x);
      return;
    }
    if (this.akcje.busy) {
      // ⚠ `recovery` niesie DWIE rzeczy: odskok, a po nim bezbronność. Runner
      // nie zna ruchu, więc podział odmierza encja. Odskok kończy się też o
      // teren — sprężyna w drzewo ma stanąć przy drzewie.
      if (nowMs < this.backstepUntil && body.blocked.none) {
        // Odskok jest ZOBOWIĄZANIEM — solver się nie odzywa.
        this.move.impulse(this.backstepVel.x, this.backstepVel.y);
      } else {
        this.backstepUntil = 0;
        this.move.hold();
      }
      return;
    }

    // Cooldown jeszcze biegnie — krąży, dokładnie jak jego wataha.
    if (!this.akcje.isReady(AKCJE.greyBite, nowMs)) {
      this.circleStep(player);
      return;
    }

    // ⚠ PRZEŚWIT między hurtboxami (Faza 1B-a), nie dystans środków.
    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > d.biteRange) {
      // ⚠ Cel w przestrzeni CIAŁ — tej samej, w której `dist` powyżej decyduje
      // o zatrzymaniu (`core/movement/MoveSolver.ts`, 2026-09-07).
      const you = player.combatOrigin;
      this.move.seek(you.x, you.y, this.speed);
      this.setFlipX(player.x < this.x);
      return;
    }

    this.move.hold();
    this.setFlipX(player.x < this.x);
    // ⚠ Szał skraca przerwę — to własność STANU stworzenia, nie akcji, więc
    // wchodzi jako nadpisanie cooldownu tej próby.
    const cd = d.cooldownMs * (this.enraged ? GREY_WOLF.enrage.cooldownMul : 1);
    if (this.akcje.request(AKCJE.greyBite, nowMs, cd)) {
      this.playOneShot("growl", player.x - this.x, player.y - this.y);
      this.refreshTint();
      Sfx.play("growl");
    }
  }

  /**
   * A blunt hit cancels the bite. Denying the Szary his wind-up is the one
   * counter to a duellist who otherwise decides when every exchange happens —
   * and it stays useful in the enrage phase, where he no longer backs off.
   */
  interrupt(): void {
    if (this.isDead) return;
    if (!this.akcje.interrupt(this.scene.time.now)) return;
    // Przerwany zamach nie daje odskoku — Szary zostaje tam, gdzie stał.
    this.backstepUntil = 0;
    this.refreshTint();
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  /**
   * ⚠ **Własne, mimo że `Wolf` ma już swoje — Szary trzyma stan, którego wilk
   * nie zna.** `backstepUntil` prowadzi jego ciało po rozstrzygnięciu kęsa
   * (`ownsBody`), więc zostawiony niewyzerowany kazałby ogłuszonemu Szaremu
   * odskoczyć w klatce, w której ogłuszenie mija. To jest ten sam catch-up,
   * przed którym broni `ActionRunner.cancel`, tylko na liczniku encji —
   * a runner nie ma o nim pojęcia.
   *
   * ⚠ Tintu tu NIE ruszamy — `Enemy.stun` i tak nadpisze go zaraz po powrocie
   * stąd. Przywróceniem po wygaśnięciu zajmuje się `restoreStateTint` niżej.
   */
  protected onStunned(): void {
    super.onStunned();
    this.backstepUntil = 0;
  }

  /**
   * ⚠ **Po ogłuszeniu Szary wraca do tintu SWOJEJ fazy, nie do braku tintu.**
   * Szał jest tu stanem trwałym i widocznym; gdyby ogłuszenie go gasiło,
   * gracz traciłby jedyny sygnał, że pojedynek wszedł w drugą połowę —
   * i to akurat w chwili, w której właśnie zadał serię darmowych ciosów.
   */
  protected restoreStateTint(): void {
    this.refreshTint();
  }

  /**
   * ⚠ **Przywraca obrażenia od kontaktu, które `Wolf` wyłączył.**
   *
   * U Szarego zwykły kontakt to **29% wyjścia w zwarciu** — zmierzone i
   * zaprojektowane, nie odziedziczone przez przypadek (patrz cztery kanały
   * obrażeń w `src/entities/CLAUDE.md`). Wilk zrezygnował z tego kanału, bo
   * jego kęs dostał własny test zasięgu; pojedynek Szarego stoi na obu naraz.
   */
  protected get contactDamageEnabled(): boolean {
    return true;
  }


  /**
   * The bite lands only if the player is still inside `biteReach` when the
   * wind-up ends — walking (or dashing) out of it is the counterplay, and the
   * reason the wind-up exists at all.
   */
  private resolveBite(player: CombatTarget, nowMs: number): void {
    const d = GREY_WOLF.duel;
    this.playOneShot("bite", player.x - this.x, player.y - this.y);
    this.refreshTint();

    // ⚠ PRZEŚWIT między hurtboxami (Faza 1B-a), nie dystans środków.
    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist <= d.biteReach && !player.isDead) {
      const roll = Phaser.Math.Between(d.biteDamageMin, d.biteDamageMax);
      const mul = this.enraged ? GREY_WOLF.enrage.damageMul : 1;
      // The enrage multiplier is applied to the ROLL, before mitigation — the
      // type only ever decides how much of the result the armour stops.
  // ── WARSTWA 2 (Proficiency) ───────────────────────────────────────────
      // ⚠ Fumble kończy się TUTAJ, BEZ `player.takeDamage` — i to nie jest
      // optymalizacja. `resolveIncoming` ma skutek uboczny w liczniku PRD
      // (`core/Defense.ts`), więc wywołanie go „na zero" spaliłoby graczowi
      // postęp Uniku i Parowania na ciosie, który i tak nie miał wylądować.
      const wykonanie = this.rollExecution(true);
      if (wykonanie === "fumble") {
        this.reportAttack(AKCJE.greyBite, "miss", player, 0, wykonanie);
      } else {
        const w = player.takeDamage(
          this.damagePacket(Math.round(roll * mul), d.biteDamageType, wykonanie),
          this.hitVectorTo(player),
          wykonanie,
        );
        this.reportAttack(AKCJE.greyBite, w.outcome, player, w.mitigated, wykonanie);
      }
    } else if (!player.isDead) {
      // ⚠ Szary jako jedyny NIE MIAŁ gałęzi pudła w ogóle — cios po prostu
      // przepadał w ciszy. Teraz jest zgłaszany jak u reszty.
      this.reportAttack(AKCJE.greyBite, "miss", player, 0, "whiff");
    }

    // Enraged he never gives the ground back — that IS the second act.
    // ⚠ Czas `recovery` zostaje ten sam: szał odbiera GRUNT, nie tempo.
    if (this.enraged) {
      this.backstepUntil = 0;
      return;
    }
    this.enterBackstep(player, nowMs);
  }

  /** Movement speed, enrage included. */
  private get speed(): number {
    return GREY_WOLF.chaseSpeed * (this.enraged ? GREY_WOLF.enrage.speedMul : 1);
  }

  private enterBackstep(player: CombatTarget, nowMs: number): void {
    const d = GREY_WOLF.duel;
    this.backstepUntil = nowMs + d.backstepMs;

    // ⚠ Kierunek odskoku w przestrzeni CIAŁ (2026-09-07) — dystans, który
    // odskok ma zrobić, mierzy potem `gapBetween` w tej samej przestrzeni.
    const o = this.combatOrigin;
    const cel = player.combatOrigin;
    const dir = new Phaser.Math.Vector2(o.x - cel.x, o.y - cel.y);
    if (dir.lengthSq() < 0.0001) dir.set(this.flipX ? 1 : -1, 0);
    // Velocity, not a tween: a spring backwards into a tree has to stop at the
    // tree rather than teleport through it (same reason as the player's dash).
    dir.normalize().scale(d.backstepPx / (d.backstepMs / 1000));
    this.backstepVel.copy(dir);
  }

  /** One-way transition into the second act. */
  private checkEnrage(): void {
    if (this.enraged || this.hp > this.maxHp * GREY_WOLF.enrage.hpFraction) return;
    this.enraged = true;
    this.refreshTint();
    this.playOneShot("growl");
    Sfx.play("howl");
    expandingRing(this.scene, {
      x: this.x,
      y: this.y,
      radius: 16,
      color: GREY_WOLF.enrage.tint,
      alpha: 0.55,
      scale: 3.6,
      duration: 560,
      depth: DEPTH.entities + this.y - 1,
    });
    // Said out loud, because the tint alone is easy to miss mid-fight and the
    // rule that just changed (he stops retreating) is one the player is
    // actively relying on.
    floatingText(this.scene, {
      x: this.x,
      y: this.y - 26,
      text: "Szary wpada w szał!",
      color: "#ff6a4a",
      fontSize: 13,
      bold: true,
      rise: 26,
      duration: 1100,
      depth: DEPTH.entities + this.y + 200,
    });
    this.scene.cameras.main.shake(200, 0.006);
  }
}

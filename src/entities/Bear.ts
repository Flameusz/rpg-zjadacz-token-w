import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { BEAR, AKCJE, ASSETS } from "../config/GameConfig";
import { bearAnim } from "../core/Animations";
import { Sfx } from "../core/Sfx";
import { ActionRunner } from "../core/CombatAction";
import { angleBetweenDeg, gapBetween } from "../core/CombatGeometry";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";

/** Below this speed (px/s) the velocity the base class wrote counts as "not
 *  moving at all" — same reasoning as Rabbit/Boar's own STOP_SPEED. */
const STOP_SPEED = 2;

/**
 * Forest bear — najcięższy przeciwnik w grze, od Fazy 3.3 Combat v2 z własnym
 * atakiem: **ciężkie podejście → długa zapowiedź → szeroki zamach łapą →
 * długa bezbronność**.
 *
 * ⚠ **Napisany od razu na `ActionRunner` i na geometrii prześwitu** — jako
 * jedyny nie przeszedł migracji, bo nie miał czego migrować. Powód, dla którego
 * czekał do teraz, jest zapisany przy `BEAR` w configu (decyzja odwrócona).
 *
 * ⚠ **Jedyny atak w grze rozstrzygany w ŁUKU.** Kierunek zamachu zamraża się na
 * starcie zapowiedzi; obejście niedźwiedzia w bok podczas 620 ms kończy się
 * pudłem, mimo że dystans dalej się zgadza. Za jego plecami jest bezpiecznie.
 *
 * `bear_idle/walk/run.png` are three separate single-direction (facing
 * left) sheets — see `ASSETS.bear`'s comment for the shape and how it
 * differs from every other creature sheet in the game. `setFlipX` mirrors
 * for rightward movement, same trick `Rabbit`/`Boar` already use.
 */
export class Bear extends Enemy {
  private readonly akcje = new ActionRunner();
  /** Kierunek zamachu, ZAMROŻONY w chwili startu zapowiedzi. To jest cała
   *  kontrgra — patrz nagłówek klasy. */
  private readonly swipeDir = new Phaser.Math.Vector2(1, 0);
  /** Do kiedy grać na modelu 3D klip trafienia (`onHurt`). */
  private trafionyDo3d = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Explicit initial frame — same reason as every other real-sheet
    // enemy: Enemy's constructor sizes restHeight/the hitbox from
    // this.width/height before any subclass code runs.
    super(scene, x, y, "bear", BEAR, ASSETS.bear.idleKey, 0);
    this.play(bearAnim("idle"));
  }

  /**
   * Noticing you is the only thing this creature announces — one growl, on
   * the single door into the chase state (`Enemy.beginChase` → this hook),
   * so it cannot double-fire while already chasing.
   *
   * ⚠ Deliberately NOT a telegraph. The boar's growl warns of a specific
   * committed charge you can side-step; the bear has no such phase (see
   * `BEAR` in GameConfig for why it was given no bespoke mechanic), so this
   * says "it has seen you", nothing more. Do not grow it into a per-attack
   * cue without giving the bear a real attack to cue.
   */
  protected onGainAggro(): void {
    Sfx.play("growl");
  }

  /** Zamach jest zobowiązaniem — niedźwiedź nie odchodzi w jego trakcie. */
  protected canDeaggro(): boolean {
    return !this.akcje.busy;
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
    this.setBaseTint(null);
  }

  /** Obuch kasuje zamach. Cooldown i tak biegnie — pilnuje tego runner. */
  interrupt(): void {
    if (this.isDead) return;
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  /** Ogłuszenie kasuje zamach z każdej fazy. ⚠ Zamrożony kierunek (`swipeDir`)
   *  zostaje bez znaczenia, bo następny zamach ustala go od nowa na starcie
   *  zapowiedzi — to jest cała kontrgra niedźwiedzia. */
  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  /**
   * ⚠ **Niedźwiedź nie rani przez nakładanie ciał** — od Fazy 3.3 ma własny
   * atak z testem zasięgu. Kontakt był jego JEDYNYM kanałem i wymagał
   * zanurzenia **24 px w sylwetce gracza**, najwięcej w rosterze. To był
   * dokładnie zgłoszony objaw, w najgorszym możliwym wydaniu.
   */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const sw = BEAR.swipe;

    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveSwipe(player);
      if (p.to === "recovery") this.setBaseTint(null);
    }
    if (this.akcje.busy) {
      // Zapowiedź i bezbronność są nieruchome — masa nie koryguje kursu.
      this.move.hold();
      return;
    }

    // ⚠ PRZEŚWIT między hurtboxami (Faza 1B), nie dystans środków sprite'ów.
    const gap = gapBetween(this.combatBody, player.combatBody);
    if (gap > sw.range) {
      // ⚠ Cel w przestrzeni CIAŁ — tej samej, w której `gap` powyżej decyduje
      // o zatrzymaniu (`core/movement/MoveSolver.ts`, 2026-09-07).
      const you = player.combatOrigin;
      this.move.seek(you.x, you.y, BEAR.chaseSpeed);
      return;
    }

    this.move.hold();
    if (player.isDead) return;
    if (this.akcje.request(AKCJE.bearSwipe, nowMs)) {
      // Kierunek zamrożony TUTAJ i nie korygowany — patrz nagłówek klasy.
      // ⚠⚠ **W przestrzeni CIAŁ (2026-09-07), bo `resolveSwipe` porównuje ten
      // wektor z `cel.x - combatOrigin.x` — czyli już w niej.** Zamrożenie go
      // z duszków znaczyło, że łuk zamachu był mierzony wobec osi przekoszonej
      // o różnicę offsetów (niedźwiedź 10,4 px, gracz 19 px), więc „obszedłem
      // go" rozstrzygało się względem innej osi, niż zapowiadał telegraf.
      const o = this.combatOrigin;
      const cel = player.combatOrigin;
      const d = new Phaser.Math.Vector2(cel.x - o.x, cel.y - o.y);
      if (d.lengthSq() < 0.0001) d.set(this.flipX ? 1 : -1, 0);
      this.swipeDir.copy(d.normalize());
      // setBaseTint, nigdy setTint: mignięcie po trafieniu przywraca tint stanu.
      this.setBaseTint(AKCJE.bearSwipe.telegraphTint);
      Sfx.play("growl");
    }
  }

  /**
   * Zamach ląduje — albo i nie.
   *
   * ⚠ **Dwa warunki, nie jeden.** Dystans sprawdzany PONOWNIE (jak u całego
   * rosteru) ORAZ kąt względem ZAMROŻONEGO kierunku. Drugi warunek jest tym,
   * co odróżnia ten atak od wszystkich pozostałych: cofnięcie się ratuje przed
   * każdym z nich, ale przed tym ratuje też **zejście w bok**.
   */
  private resolveSwipe(player: CombatTarget): void {
    if (player.isDead) return;
    const sw = BEAR.swipe;
    const cel = player.combatBody;
    if (gapBetween(this.combatBody, cel) > sw.reach) {
      // Odszedłeś — zamach poszedł w powietrze.
      this.reportAttack(AKCJE.bearSwipe, "miss", player, 0, "whiff");
      return;
    }

    const o = this.combatOrigin;
    const kat = angleBetweenDeg(this.swipeDir.x, this.swipeDir.y, cel.x - o.x, cel.y - o.y);
    // NaN = gracz dokładnie na środku niedźwiedzia; nie ma kierunku, więc trafia.
    if (!Number.isNaN(kat) && kat > sw.arcDeg) {
      // ⚠ Pudło Z ŁUKU, nie z dystansu — obszedłeś go. To jest jedyna taka
      // sytuacja w grze i bez sygnału gracz nigdy by się tej kontrgry nie
      // nauczył.
      this.reportAttack(AKCJE.bearSwipe, "miss", player, 0, "whiff");
      return;
    }

    // ── WARSTWA 2 (Proficiency) ───────────────────────────────────────────
    // ⚠ **`allowFumble: false` — i to jest decyzja ARCHITEKTONICZNA, nie
    // balansowa.** Warstwa 1 tego ataku zawiera już komponent CELOWANIA:
    // test łuku wyżej nie pyta „czy byłeś w zasięgu", tylko „czy zamach poszedł
    // tam, gdzie jesteś" — czyli dokładnie o to samo, co Execution Miss, tylko
    // deterministycznie i z widoczną przyczyną. Drugi, losowy rzut na to samo
    // zjawisko łamie zakaz podwójnego liczenia osi zagrożenia (§3).
    //
    // ⚠ Ześlizg ZOSTAJE: odbicie po sierści na wielkiej łapie to kontakt, nie
    // pudło, i jest najlepszym nośnikiem tej kategorii w rosterze.
    const wykonanie = this.rollExecution(false);
    const w = player.takeDamage(
      this.damagePacket(
        Phaser.Math.Between(AKCJE.bearSwipe.damageMin, AKCJE.bearSwipe.damageMax),
        AKCJE.bearSwipe.damageType,
        wykonanie,
      ),
      this.hitVectorTo(player),
      wykonanie,
    );
    this.reportAttack(AKCJE.bearSwipe, w.outcome, player, w.mitigated, wykonanie);
  }

  protected onHurt(): void {
    this.trafionyDo3d = this.scene.time.now + 320;
  }

  /**
   * ⭐ **Co pokazać na modelu 3D** (`Creature3D`, 2026-10-04) — odczyt fazy
   * zamachu, ogłuszenia i ruchu. ⛔ Nic tu nie zmienia zachowania.
   *
   * ⚠ Zamach nie ma fazy `active` (rozstrzyga się w jednej klatce), więc klip
   * CIOSU gra przez całą bezbronność — inaczej model przeskakiwał ze wspięcia
   * prosto w bezruch (lekcja pająków). Długości klipów dobrane do faz:
   * `Rear` 625 ms ≈ `windupMs`, `Swipe` 833 ms ≈ `recoveryMs`.
   * Zwrot w zamachu = ZAMROŻONY kierunek (`swipeDir`), nie bieżący gracz —
   * model pokazuje to samo, co rozstrzyga łuk.
   */
  stan3d(): Stan3D {
    if (this.isStunned) return { klip: "Stunned" };
    const zamach = Math.atan2(this.swipeDir.x, this.swipeDir.y);
    if (this.akcje.current?.id === AKCJE.bearSwipe.id) {
      if (this.akcje.phase === "windup") return { klip: "Rear", raz: true, kat: zamach };
      return { klip: "Swipe", raz: true, kat: zamach };
    }
    if (this.scene.time.now < this.trafionyDo3d) return { klip: "Hit", raz: true };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= STOP_SPEED) return { klip: "Idle" };
    // Ten sam próg co arkusz 2D (`updateAnimation`).
    return { klip: v > BEAR.patrolSpeed * 1.3 ? "Run" : "Walk" };
  }

  /** Idle while stopped, walk while patrolling/ambling, run once actually
   *  chasing — same speed-threshold split Rabbit/Boar use, just against
   *  three separate textures instead of rows of one sheet.
   *
   * ⚠ `bear_*.png` faces LEFT natively — the opposite of `rabbit.png`/
   * `boar.png`, which are OUR OWN generated art and face right (see
   * Animations.ts's comment on that convention). This pack is an external
   * source with its own convention, confirmed by eye rather than assumed
   * from the in-house sheets, so the flip test is inverted: `vx > 0` (not
   * `< 0`) is what needs mirroring here. */
  protected updateAnimation(vx: number, vy: number): void {
    const speed = Math.hypot(vx, vy);
    if (speed <= STOP_SPEED) {
      this.play(bearAnim("idle"), true);
      return;
    }
    this.setFlipX(vx > 0);
    const running = speed > BEAR.patrolSpeed * 1.3;
    this.play(running ? bearAnim("run") : bearAnim("walk"), true);
  }
}

import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { RABBIT, AKCJE, ASSETS } from "../config/GameConfig";
import { rabbitAnim } from "../core/Animations";
import { gapBetween } from "../core/CombatGeometry";
import { ActionRunner } from "../core/CombatAction";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";

/** Below this speed (px/s) the velocity the base class wrote counts as "not
 *  moving at all" — small enough that residual sub-pixel drift never reads as
 *  an intent to move. NB this tests what patrol/chase WANTED, not what the hop
 *  gate left behind: the gate runs after it. */
const STOP_SPEED = 2;

/**
 * One hop lasts exactly one pass of the sprite's own cycle, computed from the
 * sheet rather than written down twice. `rabbit.png` is 4 frames at 6 fps
 * walking (667ms) and 10 fps running (400ms); hard-coding those would mean a
 * retimed animation silently desynchronising from the movement it describes.
 */
const CYCLE_FRAMES = ASSETS.rabbit.cycleToCol - ASSETS.rabbit.cycleFromCol + 1;
const WALK_CYCLE_MS = (CYCLE_FRAMES / ASSETS.rabbit.walkFps) * 1000;
const RUN_CYCLE_MS = (CYCLE_FRAMES / ASSETS.rabbit.runFps) * 1000;

/** Where in a single hop the rabbit currently is. `still` means the AI itself
 *  chose not to move (patrol's idle beat), not that it is between hops. */
type HopPhase = "still" | "push" | "rest";

/**
 * The sploch, as a small state machine. `pending` exists because the flee
 * direction is "away from the player" and the hook that arms this (`onHurt`)
 * is not given one — see updateChase.
 */
type PanicPhase = "none" | "pending" | "bolt" | "freeze";

/**
 * Rabbit — the first enemy in the game, and the last one to get a mechanic.
 *
 * Two behaviours on top of the base Enemy's patrol/chase/contact damage, both
 * tuned in RABBIT.hop / RABBIT.panic (read the notes there before touching the
 * numbers — the hop's duty cycle is also its speed compensation):
 *
 * - **It hops instead of gliding.** Movement is bursts with pauses, one burst
 *   per animation cycle, and while chasing each hop jinks ±jinkDeg off the
 *   straight line. Average speed is unchanged, so nothing tuned around
 *   patrolSpeed/chaseSpeed moves; what changes is that landing the frontal
 *   attack arc on one is now a matter of timing.
 * - **Sploch: it bolts once, then freezes.** Below RABBIT.panic.hpFraction it
 *   breaks off, sprints flat out away from you, and then sits motionless for
 *   over a second — a free window to finish it. Bounded by construction and
 *   latched to once per rabbit, which is what keeps it from being the endless
 *   chase this mechanic usually turns into.
 */
export class Rabbit extends Enemy {
  /** Mirrors the base class's private AI state via the two aggro hooks — the
   *  hop reads it to pick walk vs run and to decide whether to jink. */
  private chasing = false;

  private hopPhase: HopPhase = "still";
  /** End of the current hop; crossing it starts the next one. */
  private hopEndsAt = 0;
  /** End of the propulsion part of the current hop. */
  private hopPushUntil = 0;
  /** Set at take-off, consumed by updateAnimation to re-sync the sprite cycle. */
  private hopStarted = false;
  /** Start i długość bieżącego skoku — model 3D zaczyna klip `Hop` od nowa
   *  na każdym wybiciu, w tempie tego cyklu (`stan3d`). */
  private hopOd = 0;
  private hopCykl = WALK_CYCLE_MS;
  /** Do kiedy grać na modelu 3D klip trafienia. */
  private trafionyDo = 0;
  /** Flipped every hop so the jink alternates rather than curving one way. */
  private jinkSign = 1;
  /**
   * Direction of travel, remembered across the pause between hops. The gate
   * zeroes the body's velocity for that pause, so reading the live velocity for
   * facing/animation would flicker the sprite back to its idle frame twice a
   * second.
   */
  private readonly intent = new Phaser.Math.Vector2(0, 1);

  /**
   * Czy zwierzę zostało UDERZONE i się odgryza.
   *
   * ⚠ Jednokierunkowe do końca życia tego obiektu — spłoszony królik może
   * przestać uciekać, ale rozjuszony nie wraca do bycia zwierzyną. Bez tego
   * wystarczyłoby odejść na `calmGap`, żeby skasować konsekwencję ciosu, a
   * „uderz i odejdź" byłoby darmowe.
   */
  private provoked = false;
  /** Odgryzanie się prowadzi `ActionRunner` (Faza 2) — zniknęły stąd trzy pola
   *  fazy i cały `switch`. Zostaje decyzja „chcę ugryźć" i to, co widać. */
  private readonly akcje = new ActionRunner();
  /**
   * Faza płoszenia się. `watch` = stoi czujnie (i WTEDY da się go trafić),
   * `bolt` = zrywa się na `prey.boltMs`.
   *
   * ⚠ **Ucieczka jest z założenia PRZERYWANA.** Ciągła sprawiała, że zwierzęcia
   * nie dało się trafić w ogóle — patrz komentarz przy `RABBIT.prey.boltMs`.
   */
  private fleePhase: "idle" | "watch" | "bolt" = "idle";
  private fleeUntil = 0;
  /** Kierunek zrywu, ustalany na starcie i NIE korygowany co klatkę: zwierzę
   *  ucieka gdzieś, a nie „ciągle od gracza" — dzięki temu da się je odciąć,
   *  zamiast gonić po łuku. Ta sama zasada co przy splochu. */
  private readonly boltVel = new Phaser.Math.Vector2();

  private panicPhase: PanicPhase = "none";
  private panicUntil = 0;
  /** One sploch per rabbit, for its whole life — see RABBIT.panic. A respawn is
   *  a new object, so it resets there and only there. */
  private hasPanicked = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Explicit initial frame: Enemy's constructor computes restHeight and the
    // collision body from this.width/height BEFORE any subclass code runs, so
    // an unset frame here (defaulting to the whole sheet, not one 24×24 cell)
    // would poison both the HP bar offset and the hitbox for good.
    super(scene, x, y, "rabbit", RABBIT, ASSETS.rabbit.key, ASSETS.rabbit.idleDownFrame);
    this.play(rabbitAnim.idleDown);
  }

  protected onGainAggro(): void {
    this.chasing = true;
  }

  protected onLoseAggro(): void {
    this.chasing = false;
    // ⚠ `provoked` CELOWO nie jest tu zerowane — patrz komentarz przy polu.
    this.akcje.reset();
    this.fleePhase = "idle";
    this.setBaseTint(null);
    // Reachable despite canDeaggro() below: the player DYING drops every
    // enemy's aggro without consulting it. Without this reset the rabbit would
    // be left frozen in the meadow permanently, since only updateChase — which
    // no longer runs — ticks the panic timer.
    this.panicPhase = "none";
  }

  /** The bolt/freeze is one closed beat; letting the rabbit wander off halfway
   *  through would throw away the free window that is the whole payoff. */
  protected canDeaggro(): boolean {
    // Telegraf jest obietnicą wobec gracza; zwierzę, które w jego trakcie
    // odchodzi, jest gorsze niż brak telegrafu. Ta sama reguła co u skoczka.
    if (this.provoked && this.akcje.busy) return false;
    return this.panicPhase === "none";
  }

  protected onHurt(): void {
    // ⚠ Uderzenie ZAWSZE prowokuje, niezależnie od HP i od splochu. To jest
    // reguła gatunku („płochliwe, ale uderzone atakuje"), nie próg balansowy.
    this.provoked = true;
    this.trafionyDo = this.scene.time.now + 300;
    if (this.hasPanicked || this.panicPhase !== "none") return;
    if (this.hp > this.maxHp * RABBIT.panic.hpFraction) return;
    this.hasPanicked = true;
    // Armed here, launched in updateChase: this hook isn't handed the player,
    // and the flee direction has to be away from them. One frame of delay,
    // which also means a hammer's knockback resolves first and the rabbit bolts
    // out of wherever it was shoved to.
    this.panicPhase = "pending";
  }

  /**
   * Obuch kasuje kęs rozjuszonego królika.
   *
   * ⚠ Dodane razem z dzikiem (2026-08-23), bo brak tego był **niespójnością, nie
   * decyzją**: każde inne stworzenie z zamachem daje się przerwać, a rodzina
   * obuchowa ma to jako oś tożsamości. Cooldown i tak biegnie — przerwanie ma
   * kupować cały cios, nie odraczać go.
   */
  interrupt(): void {
    if (this.isDead) return;
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  /**
   * ⚠ **Kasuje kęs, ale NIE rusza splochu.** Sploch (`fleePhase`) jest stanem
   * NAD walką — wchodzi poniżej 40% HP i opisuje zwierzę, które przestało
   * walczyć, a nie akcję, którą wykonuje. Ogłuszenie zabiera prawo do akcji;
   * strach nie jest akcją.
   */
  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    // ⚠ Wszystkie dystanse i kierunki tej metody liczą się między ŚRODKAMI CIAŁ
    // (2026-09-07) — tą samą przestrzenią, w której kęs mierzy prześwit.
    // Ani jedna liczba `RABBIT.*` nie została ruszona.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    if (this.panicPhase === "pending") {
      const away = new Phaser.Math.Vector2(me.x - you.x, me.y - you.y);
      if (away.lengthSq() < 0.0001) away.set(0, -1);
      away.normalize().scale(RABBIT.panic.boltSpeed);
      // Sploch to ZOBOWIĄZANIE — kierunek zamrożony na starcie i nigdy nie
      // korygowany, żeby gracz mógł wejść mu w tor.
      this.move.impulse(away.x, away.y);
      this.intent.set(away.x, away.y);
      this.panicPhase = "bolt";
      this.panicUntil = nowMs + RABBIT.panic.boltMs;
      return;
    }

    if (this.panicPhase === "bolt") {
      // Velocity is set once, at take-off, and deliberately never re-aimed: a
      // bolt that kept tracking the player would just be a chase in reverse,
      // and the player could not sidestep into its path to cut it off.
      //
      // Ends on EITHER the timer or the distance cap, whichever comes first —
      // see RABBIT.panic.boltMaxGap for why the distance one has to be there.
      const gap = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);
      if (nowMs >= this.panicUntil || gap >= RABBIT.panic.boltMaxGap) {
        this.panicPhase = "freeze";
        this.panicUntil = nowMs + RABBIT.panic.freezeMs;
        this.move.hold();
      }
      return;
    }

    if (this.panicPhase === "freeze") {
      this.move.hold();
      if (nowMs >= this.panicUntil) this.panicPhase = "none";
      return;
    }

    // ⚠ **`super.updateChase` NIE JEST już tu wołane** i to jest cała Faza 4.
    // Baza idzie `moveToObject` bez progu zatrzymania, a obrażenia królika
    // padały przez nakładanie CIAŁ — czyli zwierzę musiało wejść w sylwetkę
    // gracza, żeby cokolwiek zrobić. To był zgłoszony objaw, nie usterka AI.
    if (this.provoked) this.fight(player, nowMs);
    else this.flee(player, nowMs);
  }

  /**
   * Zwierzyna: stój nastroszony, potem uciekaj, aż się odsadzisz.
   *
   * Bieg jest przepuszczany przez tę samą bramkę `hop` co zawsze, więc ucieczka
   * to zrywy z pauzami — i to w pauzach gracz nadrabia dystans. Średnia
   * `fleeSpeed` (108) jest poniżej gracza (150), ale zryw sięga ~166 px/s.
   */
  private flee(player: CombatTarget, nowMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const p = RABBIT.prey;
    // ⚠ Między ŚRODKAMI CIAŁ (2026-09-07) — patrz `updateChase`. `calmGap`,
    // `panicGap` i reszta liczb nietknięte.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);

    if (this.fleePhase === "bolt") {
      this.move.impulse(this.boltVel.x, this.boltVel.y);
      this.intent.set(this.boltVel.x, this.boltVel.y);
      // Kończy się na czasie ALBO na terenie — zryw w drzewo ma stanąć przy
      // drzewie, a nie szorować o nie przez pół sekundy.
      if (nowMs >= this.fleeUntil || !body.blocked.none) {
        this.fleePhase = "watch";
        this.fleeUntil = nowMs + p.watchMs;
        this.move.hold();
      }
      return;
    }

    // Odsadził się — przestaje się płoszyć. Agro zerwie za chwilę baza.
    if (dist > p.calmGap) {
      this.move.hold();
      this.fleePhase = "idle";
      this.fleeUntil = 0; // następne zbliżenie ma znów zacząć od nastroszenia
      return;
    }

    if (this.fleePhase === "watch") {
      // ⚠ **Stoi. To jest okno, w którym gracz może się zatrzymać i trafić.**
      // Bez niego cel ucieka spod każdego zamachu — zgłoszone z rozgrywki.
      this.move.hold();
      if (nowMs >= this.fleeUntil && dist <= p.alertRange) this.enterBolt(player, nowMs);
      return;
    }

    // `idle`: pierwsze spotkanie. Nastroszenie, potem pierwszy zryw.
    this.move.hold();
    if (dist > p.alertRange) return;
    if (this.fleeUntil === 0) {
      this.fleeUntil = nowMs + p.alertMs;
      return;
    }
    if (nowMs >= this.fleeUntil) this.enterBolt(player, nowMs);
  }

  private enterBolt(player: CombatTarget, nowMs: number): void {
    const p = RABBIT.prey;
    this.fleePhase = "bolt";
    this.fleeUntil = nowMs + p.boltMs;
    // ⚠ Kierunek ucieczki liczony między ŚRODKAMI CIAŁ (2026-09-07) — ta sama
    // reguła, co przy `hitVectorTo`: ciało siedzi u stóp, więc wektor
    // duszek→duszek jest przekoszony wobec tego, gdzie zwierzę naprawdę stoi.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const away = new Phaser.Math.Vector2(me.x - you.x, me.y - you.y);
    if (away.lengthSq() < 0.0001) away.set(0, -1);
    away.normalize().scale(p.fleeSpeed);
    this.boltVel.copy(away);
  }

  /**
   * Rozjuszony: podejdź na `bite.range`, **stań**, nastrosz się, ugryź.
   *
   * ⚠ Zatrzymanie na dystansie jest tu treścią, nie ozdobą — to jedyna
   * różnica między „zwierzę atakuje" a „zwierzę wchodzi w postać".
   */
  private fight(player: CombatTarget, nowMs: number): void {
    const b = RABBIT.bite;

    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveBite(player, nowMs);
      if (p.to === "recovery") this.setBaseTint(null);
    }
    if (this.akcje.busy) {
      this.move.hold();
      return;
    }

    // ⚠ PRZEŚWIT między hurtboxami, nie dystans środków sprite'ów (Faza 1B-a).
    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > b.range) {
      // ⚠ `bite.approachSpeed`, NIE `chaseSpeed`. Ten drugi (70) jest wolniejszy
      // od gracza (150), więc rozjuszony królik nie mógł go dosięgnąć w ogóle.
      // ⚠ Cel i kierunek w przestrzeni CIAŁ — tej samej, w której `dist` powyżej
      // decyduje o zatrzymaniu (2026-09-07).
      const skad = this.combatOrigin;
      const cel = player.combatOrigin;
      this.move.seek(cel.x, cel.y, b.approachSpeed);
      this.intent.set(cel.x - skad.x, cel.y - skad.y);
      return;
    }

    this.move.hold();
    if (player.isDead) return;
    if (this.akcje.request(AKCJE.rabbitBite, nowMs)) {
      // setBaseTint, nigdy setTint: mignięcie po trafieniu przywraca tint
      // stanu, więc cios w trakcie zamachu nie może skasować telegrafu.
      this.setBaseTint(AKCJE.rabbitBite.telegraphTint);
      // ⚠ Kierunek w przestrzeni CIAŁ, jak reszta tej klasy (2026-09-07).
      const skad = this.combatOrigin;
      const cel = player.combatOrigin;
      this.intent.set(cel.x - skad.x, cel.y - skad.y);
    }
  }

  /**
   * Ugryzienie — albo i nie.
   *
   * ⚠ Dystans testowany PONOWNIE, przeciw `reach`, a nie `range`. Bez tego
   * wynik byłby przesądzony w chwili startu zamachu i cofanie się byłoby
   * teatrem. Zamachy gracza rozstrzygają się dokładnie tak samo
   * (`pendingSwing`), więc obie strony wymiany chodzą jedną regułą.
   */
  private resolveBite(player: CombatTarget, _nowMs: number): void {
    // ⚠ Fazą i cooldownem zarządza runner — tutaj zostaje SAM CIOS.
    const b = RABBIT.bite;
    if (player.isDead) return;

    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > b.reach) {
      // ⚠ **Było tu `return` BEZ ZGŁOSZENIA — i to była luka, nie decyzja.**
      // `src/entities/CLAUDE.md` stawia regułę Fazy 5A wprost: „chybiony cios
      // ZGŁASZA SIĘ, nigdy nie kończy cichym `return`". Cały roster ją
      // spełniał; królik — **pierwszy przeciwnik w grze** — jako jedyny nie,
      // więc jego pudło nie miało ani świstu, ani śladu, ani wypadu. Dokładnie
      // ten przypadek, dla którego 5A powstało: „uskoczyłem" i „ono nie
      // zaatakowało" wyglądały identycznie, i to w pierwszej walce nowego
      // gracza.
      this.reportAttack(AKCJE.rabbitBite, "miss", player, 0, "whiff");
      return;
    }

    // ⚠ Wynik czytany po POLACH, nie jako `boolean` — `takeDamage` zwraca
    // `{ outcome, mitigated, killed }`, a `if (!wynik)` byłoby zawsze fałszywe
    // i `tsc` by tego nie złapał (patrz ostrzeżenie w `src/entities/CLAUDE.md`).
    // ── WARSTWA 2 (Proficiency) ───────────────────────────────────────────
    // ⚠ Fumble kończy się TUTAJ, BEZ `player.takeDamage` — i to nie jest
    // optymalizacja. `resolveIncoming` ma skutek uboczny w liczniku PRD
    // (`core/Defense.ts`), więc wywołanie go „na zero" spaliłoby graczowi
    // postęp Uniku i Parowania na ciosie, który i tak nie miał wylądować.
    const wykonanie = this.rollExecution(true);
    if (wykonanie === "fumble") {
      this.reportAttack(AKCJE.rabbitBite, "miss", player, 0, wykonanie);
      return;
    }
    const wynik = player.takeDamage(
      this.damagePacket(
        Phaser.Math.Between(AKCJE.rabbitBite.damageMin, AKCJE.rabbitBite.damageMax),
        AKCJE.rabbitBite.damageType,
        wykonanie,
      ),
      this.hitVectorTo(player),
      wykonanie,
    );
    this.reportAttack(AKCJE.rabbitBite, wynik.outcome, player, wynik.mitigated, wykonanie);
  }

  /**
   * ⚠ **Obrażenia od kontaktu WYŁĄCZONE.** To był jedyny kanał ataku królika i
   * jednocześnie powód, dla którego wchodził w sylwetkę gracza: overlap ciał
   * zaskakuje dopiero po ~9 px zanurzenia. Kęs ma własny test zasięgu
   * (`resolveBite`), więc kontakt nie ma już czego rozstrzygać.
   *
   * ⚠ Wyrażone GETTEREM, nie nadpisaniem `tryTouchDamage` — tak samo jak u
   * wilka, dzika i niedźwiedzia. Do 2026-08-23 królik robił to inaczej niż
   * reszta rosteru i **ta sama decyzja miała dwa różne kształty w kodzie**,
   * co jest zaproszeniem do pominięcia jednego z nich przy przeglądzie.
   */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  /**
   * The hop gate: turn the steady velocity patrol/chase just wrote into a burst
   * plus a pause, without either of them knowing. See RABBIT.hop.
   */
  protected postMove(nowMs: number): void {
    // Panic owns the body outright, exactly like the knockback impulse does.
    if (this.panicPhase !== "none") return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = Math.hypot(vx, vy);

    // The AI chose to stand still (patrol's idle beat). Nothing to gate, and
    // the next move should open a fresh hop rather than resume a stale one.
    if (speed <= STOP_SPEED) {
      this.hopPhase = "still";
      this.hopEndsAt = 0;
      return;
    }
    this.intent.set(vx, vy);

    if (nowMs >= this.hopEndsAt) {
      const cycle = this.chasing ? RUN_CYCLE_MS : WALK_CYCLE_MS;
      this.hopEndsAt = nowMs + cycle;
      this.hopPushUntil = nowMs + cycle * RABBIT.hop.pushFraction;
      this.hopStarted = true;
      this.hopOd = nowMs;
      this.hopCykl = cycle;
      this.jinkSign = -this.jinkSign;
    }

    if (nowMs < this.hopPushUntil) {
      this.hopPhase = "push";
      // Dividing by the duty cycle is what holds the AVERAGE speed at exactly
      // patrolSpeed/chaseSpeed — see the warning on RABBIT.hop.pushFraction.
      const burst = speed / RABBIT.hop.pushFraction;
      let angle = Math.atan2(vy, vx);
      if (this.chasing) angle += Phaser.Math.DegToRad(RABBIT.hop.jinkDeg) * this.jinkSign;
      body.setVelocity(Math.cos(angle) * burst, Math.sin(angle) * burst);
    } else {
      this.hopPhase = "rest";
      body.setVelocity(0, 0);
    }
  }

  /**
   * Driven by the hop STATE rather than by the velocity the base class hands
   * in: the pause between hops zeroes that velocity, and a rabbit mid-hop is
   * airborne, not sitting down.
   */
  /**
   * ⭐ **Co pokazać na modelu 3D** (`Creature3D`, 2026-10-03) — odczyt stanu,
   * który królik i tak prowadzi: faza skoku, płoszenie, sploch, kęs.
   * ⛔ Nic tu nie zmienia zachowania. Klip `Hop` (`tools/rabbit3d.py`) trwa
   * 667 ms przy tempie 1 = cykl patrolu, więc tempo = 667 / cykl skoku.
   */
  stan3d(): Stan3D {
    const kat = this.intent.lengthSq() > 0.01 ? Math.atan2(this.intent.x, this.intent.y) : null;
    if (this.isStunned) return { klip: "Stunned", kat };
    if (this.panicPhase === "freeze") return { klip: "Freeze", kat };
    // Sploch: ciągły zryw bez bramki skoku — pętla skoków w tempie pościgu.
    if (this.panicPhase !== "none") return { klip: "Hop", tempo: (WALK_CYCLE_MS / RUN_CYCLE_MS) * 1.2, kat };
    const faza = this.akcje.phase;
    if (this.akcje.current?.id === AKCJE.rabbitBite.id && (faza === "windup" || faza === "active")) {
      return { klip: "Bite", raz: true, kat };
    }
    if (this.scene.time.now < this.trafionyDo) return { klip: "Hit", raz: true, kat };
    if (this.fleePhase === "watch") return { klip: "Alert", kat };
    if (this.hopPhase !== "still") {
      return { klip: "Hop", raz: true, tempo: WALK_CYCLE_MS / this.hopCykl, od: this.hopOd, kat };
    }
    return { klip: "Idle", kat };
  }

  protected updateAnimation(_vx: number, _vy: number): void {
    const idleKey = this.intent.y < 0 ? rabbitAnim.idleUp : rabbitAnim.idleDown;

    if (this.panicPhase === "freeze") {
      this.play(idleKey, true);
      return;
    }
    const bolting = this.panicPhase !== "none";
    if (!bolting && this.hopPhase === "still") {
      this.play(idleKey, true);
      return;
    }
    // Documented scope cut, unchanged: only horizontal-ish travel gets the real
    // cycle, since the sheet only draws one in profile. Vertical-dominant
    // movement falls back to the static idle frame — the same texture-only
    // baseline every other enemy has.
    if (Math.abs(this.intent.y) > Math.abs(this.intent.x)) {
      this.play(idleKey, true);
      return;
    }

    this.setFlipX(this.intent.x < 0);
    const key = this.chasing || bolting ? rabbitAnim.run : rabbitAnim.walk;
    // Restart on take-off so the cycle's first frame is the frame the body
    // actually leaves the ground on. `play(key, true)` alone would let the two
    // drift apart within a couple of hops, which is the sliding this replaced.
    if (this.hopStarted) {
      this.hopStarted = false;
      this.play(key);
    } else {
      this.play(key, true);
    }
  }
}

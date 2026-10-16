import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { WOLF, AKCJE, ASSETS, DEPTH } from "../config/GameConfig";
import { type Direction, type WolfAnimState, wolfAnim } from "../core/Animations";
import { expandingRing } from "../core/Fx";
import { Sfx } from "../core/Sfx";
import { gapBetween } from "../core/CombatGeometry";
import { ActionRunner } from "../core/CombatAction";
import { Enemy, type EnemyConfig, type EnemyType } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";

/** A config that carries the pack block — WOLF and GREY_WOLF both do. */
export type PackConfig = EnemyConfig & { pack: typeof WOLF.pack };


/** Below this speed (px/s) the wolf is considered stopped — see Rabbit.ts,
 *  same reasoning. */
const STOP_SPEED = 2;

/**
 * Forest wolf — the map's pack hunter.
 *
 * It used to be the plain base Enemy with a high chaseSpeed, i.e. a rabbit that
 * ran faster. Now it hunts like a pack, which is a different SHAPE of fight
 * rather than a bigger stat block (see the long note on WOLF in GameConfig):
 *
 *   circle → dart in → peel off → circle
 *
 * Two things this buys that no stat change could:
 *  • **Damage arrives in bursts.** Circling means a wolf is only in contact
 *    during its lunge, so three wolves are readable instead of an unbroken
 *    drain — and, counter-intuitively, fairer than three of the old gluing
 *    ones, because you get gaps to swing and to heal in.
 *  • **You fight the pack, not a wolf.** The first one to notice you HOWLS and
 *    pulls every wolf-kin within `pack.callRadius`.
 *
 * Also the base class for the Szary (see GreyWolf), who is a wolf in every way
 * that matters — he answers a howl and howls himself — and only replaces the
 * hunt cycle.
 */
export class Wolf extends Enemy {
  /** Wypad prowadzi `ActionRunner` (Faza 2). `activeMs` jest LIMITEM lotu, nie
   *  jego długością — kończy go `endActive`, gdy wilk dojedzie albo uderzy. */
  protected readonly akcje = new ActionRunner();
  private nextHowlAt = 0;
  /**
   * Strażnik przed rozstrzygnięciem kęsa DWA RAZY w jednym wypadzie.
   *
   * ⚠ Po Fazie 2 jest to **nadmiarowe, ale celowo zostawione**: cooldown wypadu
   * (1,9 s) prowadzi runner i jest dużo dłuższy niż ten (0,9 s), więc ten gate
   * nigdy nie zadziała w normalnym przebiegu. Zostaje jako siatka bezpieczeństwa
   * pod jedyny realny błąd tej migracji — `resolvePackBite` jest wołane z DWÓCH
   * miejsc (naturalny koniec lotu przez `tick`, i wcześniejszy przez
   * `endActive`) i pomylenie ich dałoby podwójne obrażenia z jednego skoku.
   */
  private nextPackBiteAt = 0;
  private readonly lungeVel = new Phaser.Math.Vector2();
  /**
   * Which way round this wolf orbits, chosen once at spawn. Fixed rather than
   * re-rolled, or a wolf would flip-flop across the player's face every few
   * frames instead of circling.
   */
  protected readonly orbitSign = Math.random() < 0.5 ? -1 : 1;
  /** The pack block driving this creature (WOLF's, or the Szary's copy of it). */
  protected readonly packCfg: typeof WOLF.pack;
  /** Facing to animate while stationary (idle keeps whatever it last faced,
   *  rather than snapping back to a default). */
  private lastDir: Direction = "down";
  /**
   * Which sheet's animation keys this instance plays. Wolf defaults to
   * `wolfAnim`; GreyWolf passes `greyWolfAnim` (his own sheet — see the note
   * on `ASSETS.greyWolf`, he is deliberately NOT the wolf texture at a bigger
   * scale). Assigned in the constructor body rather than as a field default,
   * because a subclass's field initializers run AFTER `super()` returns —
   * relying on one here would still see Wolf's default at the point the
   * base constructor's own `this.play(...)` call runs.
   */
  private readonly animFn: (state: WolfAnimState, dir: Direction) => string;
  /**
   * ⭐ Jednorazowy stan dla modelu 3D (`stan3d`) — zapisywany TAM, gdzie arkusz
   * 2D dostaje swój `playOneShot`, więc model i arkusz nie mogą się rozjechać
   * co do tego, CO wilk właśnie robi. `do` = czas sceny (ms).
   */
  private jednorazowy3d: { klip: string; do: number; kat: number | null } | null = null;
  /** `howl()` w toku — ten sam `"growl"` arkusza to na modelu WYCIE, nie warkot. */
  private wyjeTeraz = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: EnemyType = "wolf",
    cfg: PackConfig = WOLF,
    textureKey: string = ASSETS.wolf.key,
    initialFrame = 0,
    animFn: (state: WolfAnimState, dir: Direction) => string = wolfAnim,
  ) {
    // Explicit initial frame — same reason as Rabbit/Boar (Enemy sizes
    // restHeight/the hitbox from this.width/height before any subclass code
    // runs). Both Wolf and GreyWolf now have real directional sheets, so
    // both want this (default 0 = idle-down, row 0 of either sheet).
    super(scene, x, y, kind, cfg, textureKey, initialFrame);
    this.packCfg = cfg.pack;
    this.animFn = animFn;
    this.play(this.animFn("idle", "down"));
  }

  /**
   * Continuous idle/walk, picked from facing + whether it's moving — the
   * same speed-threshold trick as Rabbit/Boar, but with 4 REAL directions
   * instead of a mirrored side view, since both sheets draw all of them.
   *
   * Declines to interrupt a one-shot (growl/bite/hurt/death) that's still
   * mid-flight — `repeat === 0` marks those apart from the looping idle/walk
   * clips, and letting them get stomped by this every frame would mean they
   * never visibly play at all.
   */
  protected updateAnimation(vx: number, vy: number): void {
    // circleStep/enterLunge/patrol/GreyWolf's close phase all still call
    // setFlipX — inherited logic written back when every wolf-kind creature
    // was one generic mirrored face. Both sheets' left/right frames are
    // already correct, independently drawn art (baked mirrors of each other,
    // not runtime-flipped), so leaving flipX on would mirror them a SECOND
    // time — e.g. moving left would pick the (correct) "left" clip and then
    // flip it back into looking like "right". Force it off every frame.
    this.setFlipX(false);
    const current = this.anims.currentAnim;
    if (current && current.repeat === 0 && this.anims.isPlaying) return;

    const speed = Math.hypot(vx, vy);
    if (speed > STOP_SPEED) this.lastDir = this.directionFrom(vx, vy);
    this.play(this.animFn(speed > STOP_SPEED ? "walk" : "idle", this.lastDir), true);
  }

  protected onHurt(): void {
    this.playOneShot("hurt");
  }

  protected onDeathVisual(): void {
    this.playOneShot("death");
  }

  /**
   * Play a one-shot (non-looping) state. `dx`/`dy`, if given, reorient
   * `lastDir` first — e.g. the bite should face the direction of the lunge
   * that triggered it, not whatever the wolf was last doing before that.
   */
  protected playOneShot(state: Exclude<WolfAnimState, "idle" | "walk">, dx?: number, dy?: number): void {
    if (dx !== undefined && dy !== undefined && dx * dx + dy * dy > 1) {
      this.lastDir = this.directionFrom(dx, dy);
    }
    this.play(this.animFn(state, this.lastDir), true);
    // Model 3D: ten sam moment, nazwa klipu z `tools/wolf3d.py`. Śmierć prowadzi
    // `Creature3D` sam (`isDead`).
    const KLIPY: Partial<Record<string, [string, number]>> = {
      growl: this.wyjeTeraz ? ["Howl", 1500] : ["Growl", 700],
      bite: ["Bite", 420],
      hurt: ["Hit", 330],
    };
    const k = KLIPY[state];
    if (k) {
      const kat = dx !== undefined && dy !== undefined && dx * dx + dy * dy > 1 ? Math.atan2(dx, dy) : null;
      this.jednorazowy3d = { klip: k[0], do: this.scene.time.now + k[1], kat };
    }
  }

  /**
   * ⭐ **Co pokazać na modelu 3D** (`Creature3D`, 2026-10-03) — wyłącznie
   * odczyt stanu, który wilk i tak ma (jednorazowy z `playOneShot`, faza
   * wypadu, ogłuszenie, prędkość). ⛔ Nic tu nie zmienia zachowania.
   */
  stan3d(): Stan3D {
    if (this.isStunned) return { klip: "Stunned" };
    const now = this.scene.time.now;
    // ⚠ Lot wypadu PRZED jednorazowym: `enterLunge` woła `playOneShot("bite")`
    // już na starcie doskoku (arkusz 2D pokazuje kęs przez cały lot), a model
    // ma w tym czasie SKOK. Klip jest dłuższy niż lot, stąd tempo.
    if (this.akcje.current?.id === AKCJE.wolfLunge.id && this.akcje.phase === "active") {
      return { klip: "Lunge", raz: true, tempo: 1.6 };
    }
    const j = this.jednorazowy3d;
    if (j && now < j.do) return { klip: j.klip, raz: true, kat: j.kat };
    // Każdy ZAMACH (wypad watahy, kęs Szarego) czyta się jako przyczajenie —
    // u Szarego to jego telegraf i trwa dłużej niż zapisany warkot.
    if (this.akcje.phase === "windup") return { klip: "Growl" };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= STOP_SPEED) return { klip: "Idle" };
    if (v < this.cfg.patrolSpeed * 1.5) return { klip: "Walk" };
    if (v < this.cfg.chaseSpeed * 0.85) return { klip: "Trot" };
    return { klip: "Run" };
  }

  private directionFrom(dx: number, dy: number): Direction {
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
    return dy < 0 ? "up" : "down";
  }

  /** Spotting the player — or being shot at, or being called by a packmate —
   *  is what raises the alarm. */
  protected onGainAggro(): void {
    this.howl();
  }

  /** Don't break off mid-lunge; drifting in the orbit is fair game. */
  protected canDeaggro(): boolean {
    return !this.akcje.busy;
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    for (const p of this.akcje.tick(nowMs)) {
      // ⚠ Kęs rozstrzyga się na KOŃCU wypadu, nie na jego początku — inaczej
      // niż u skoczka, który stoi. Dlatego reaguje na wyjście z `active`, a nie
      // na wejście: wilk gryzie tam, dokąd doleciał.
      if (p.from === "active") this.resolvePackBite(player, nowMs);
    }

    if (this.akcje.phase === "active") {
      // Wypad jest ZOBOWIĄZANIEM — solver się nie odzywa.
      this.move.impulse(this.lungeVel.x, this.lungeVel.y);
      // ⚠ PRZEŚWIT między hurtboxami (Faza 1B-a), nie dystans środków.
      const gap = gapBetween(this.combatBody, player.combatBody);
      if (gap <= this.packCfg.lungeStopGap || !body.blocked.none) {
        for (const p of [this.akcje.endActive(nowMs)]) {
          if (p) this.resolvePackBite(player, nowMs);
        }
      }
      return;
    }
    if (this.akcje.busy) {
      this.move.hold();
      return;
    }

    // ⚠ Dystans wyzwalający wypad — między ŚRODKAMI CIAŁ (2026-09-07), czyli
    // w tej samej przestrzeni, w której wilk orbituje i w której walka liczy
    // prześwit. `lungeRange` nietknięte.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);
    if (this.akcje.isReady(AKCJE.wolfLunge, nowMs) && dist <= this.packCfg.lungeRange) {
      this.enterLunge(player, nowMs);
    } else {
      this.circleStep(player);
    }
  }

  /** A blunt hit swats a wolf out of its dart. */
  interrupt(): void {
    if (this.isDead) return;
    // ⚠ Obuch wytrąca wilka z LOTU, nie z zamachu — wypad nie ma zamachu.
    // `interrupt` runnera obsługuje `windup`, więc tutaj domykamy okno `active`.
    if (this.akcje.phase !== "active") return;
    this.akcje.endActive(this.scene.time.now);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  /**
   * Ogłuszenie zdejmuje wilka z wypadu — **także tego, którego `interrupt()`
   * nie umie ruszyć.**
   *
   * ⚠ To jest jedyne miejsce w rosterze, gdzie różnica między przerwaniem
   * a ogłuszeniem jest widoczna gołym okiem: `AKCJE.wolfLunge` ma
   * `windupMs: 0` (groźbą watahy jest liczba ataków, nie jeden czytelny
   * zamach), więc `ActionRunner.interrupt` — działający wyłącznie w `windup`
   * — **nie ma czego przerwać**. Wilk łata to wyżej ręcznie, przez
   * `endActive`. `cancel()` nie potrzebuje takiej łatki.
   */
  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  /**
   * One step of the orbit: steer at a point `orbitLeadDeg` further around the
   * ring, at `circleRadius` from the player. Aiming at a lead point rather than
   * integrating an angle keeps this frame-rate independent and self-correcting
   * — knocked back or shoved by a packmate, the wolf simply resumes from
   * wherever it now stands.
   *
   * ⚠⚠ **Środkiem orbity jest CIAŁO gracza (`combatOrigin`), nie jego duszek
   * (2026-09-07) — i to jest cała ta naprawa.** Do tej daty wilk krążył wokół
   * punktu leżącego 19 px NAD ciałem gracza, a trafienie rozstrzygał
   * `targetInReach`, mierzący od ciała. Ponieważ przesunięcie jest pionowe,
   * ten sam `circleRadius` 96 dawał prześwit **75,2 px** dla wilka stojącego
   * pod graczem i **93,4 px** dla stojącego nad nim: 18,2 px rozjazdu, którego
   * nie opisywało żadne pole konfiguracji.
   *
   * ⛔ **`circleRadius` NIE ZOSTAŁ ruszony.** Zmieniła się przestrzeń, w której
   * ta liczba obowiązuje, więc realny prześwit jest dziś stały — ale INNY niż
   * średnia sprzed zmiany. Rekalibracja tej wartości to osobny etap.
   */
  protected circleStep(player: CombatTarget): void {
    const p = this.packCfg;
    const you = player.combatOrigin;
    // Cała orbita — łącznie z dobieganiem, gdy wilk jest za daleko, żeby
    // cokolwiek okrążać — mieści się w JEDNEJ intencji. ⚠ Dwie prędkości są
    // osobne celowo: dobiega `chaseSpeed`, krąży `circleSpeed`.
    this.move.ring(
      you.x,
      you.y,
      p.circleRadius,
      this.orbitSign as 1 | -1,
      Phaser.Math.DegToRad(p.orbitLeadDeg),
      p.circleSpeed,
      p.circleRadius * p.closeInFactor,
      this.cfg.chaseSpeed,
    );
    this.setFlipX(player.x < this.x);
  }

  private enterLunge(player: CombatTarget, nowMs: number): void {
    // ⚠ Jitter cooldownu dokładany PER PRÓBĘ — runner jest czysty i nie losuje.
    // Bez tego trzy wilki, których cooldowny raz się zejdą, darłyby w takt.
    const cd = this.packCfg.lungeCooldownMs + Math.random() * this.packCfg.lungeJitterMs;
    if (!this.akcje.request(AKCJE.wolfLunge, nowMs, cd)) return;

    // Committed to where the player is NOW. Short and untelegraphed on purpose:
    // the pack's threat is the number of attacks, not one readable haymaker
    // (that's the boar's job).
    // ⚠ Kierunek wypadu w przestrzeni CIAŁ (2026-09-07) — lot zatrzymuje
    // `lungeStopGap`, a kęs rozstrzyga `biteReach`, obie liczone `gapBetween`.
    // Celowanie w duszka znaczyło, że wilk leciał w punkt 19 px NAD graczem.
    const skad = this.combatOrigin;
    const cel = player.combatOrigin;
    const dir = new Phaser.Math.Vector2(cel.x - skad.x, cel.y - skad.y);
    if (dir.lengthSq() < 0.0001) dir.set(this.flipX ? -1 : 1, 0);
    dir.normalize().scale(this.packCfg.lungeSpeed);
    this.lungeVel.copy(dir);
    this.setFlipX(dir.x < 0);
    // The bite plays facing the lunge direction, not whatever "lastDir" was
    // left over from circling — reorienting is exactly what the dx/dy
    // overload of playOneShot is for.
    this.playOneShot("bite", dir.x, dir.y);
    // Throttled inside Sfx, which matters here: three wolves whose cooldowns
    // happen to line up would otherwise fire three identical growls at once.
    Sfx.play("growl");
  }

  /**
   * Kęs kończący wypad — albo i nie.
   *
   * ⚠ Nazwa `resolvePackBite`, nie `resolveBite`: `GreyWolf` ma własną metodę
   * o tej drugiej nazwie dla swojego pojedynku. To dwa różne ataki dwóch
   * różnych stworzeń, które łączy tylko drzewo dziedziczenia.
   *
   * ⚠ **Dystans testowany PONOWNIE, tutaj, przeciw `biteReach`.** To jest cały
   * powód, dla którego wypad da się w ogóle uniknąć: bez tego testu o wyniku
   * decydowałby moment startu, a uskok w bok byłby teatrem. Zamachy gracza
   * rozstrzygają się dokładnie tak samo (`pendingSwing`), więc obie strony
   * wymiany chodzą jedną regułą.
   *
   * ⚠ Wołane przy KAŻDYM zakończeniu wypadu — także po wyczerpaniu czasu i po
   * uderzeniu w teren. Nie trzeba tych przypadków rozróżniać, bo test zasięgu
   * i tak je rozstrzyga: wypad, który nie dojechał, kończy się pudłem.
   *
   * ⚠ Obrażenia biorą `touchDamageMin/Max/Type` — te same liczby co dotąd. Dla
   * wilka **przestały opisywać kontakt** (jest wyłączony) i opisują teraz kęs.
   * Celowo NIE zduplikowane w `pack`: to jest ten sam ugryz, ta sama rana.
   */
  /**
   * ⚠ **Wilk nie rani przez nakładanie ciał** — kęs ma własny test zasięgu
   * (`resolvePackBite`). Kontakt był jedynym kanałem i jednocześnie powodem,
   * dla którego zwierzę wjeżdżało w gracza.
   *
   * ⚠ **Szary NADPISUJE to z powrotem na `true`** — u niego kontakt to 29%
   * wyjścia w zwarciu i jest zaprojektowany. Dlatego to getter, a nie no-op na
   * `tryTouchDamage`: nadpisanie metody zabrałoby kanał także podklasie.
   */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  private resolvePackBite(player: CombatTarget, nowMs: number): void {
    if (this.isDead || player.isDead) return;
    if (nowMs < this.nextPackBiteAt) return;
    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > this.packCfg.biteReach) {
      // ⚠ Chybienie jest ZGŁASZANE, nie przemilczane — patrz `reportAttack`.
      this.reportAttack(AKCJE.wolfLunge, "miss", player, 0, "whiff");
      return;
    }
    this.nextPackBiteAt = nowMs + this.cfg.touchDamageCooldown * 1000;
    // ── WARSTWA 2 (Proficiency) ───────────────────────────────────────────
    // ⚠ Fumble kończy się TUTAJ, BEZ `player.takeDamage` — i to nie jest
    // optymalizacja. `resolveIncoming` ma skutek uboczny w liczniku PRD
    // (`core/Defense.ts`), więc wywołanie go „na zero" spaliłoby graczowi
    // postęp Uniku i Parowania na ciosie, który i tak nie miał wylądować.
    const wykonanie = this.rollExecution(true);
    if (wykonanie === "fumble") {
      this.reportAttack(AKCJE.wolfLunge, "miss", player, 0, wykonanie);
      return;
    }
    const w = player.takeDamage(
      this.damagePacket(
        Phaser.Math.Between(this.cfg.touchDamageMin, this.cfg.touchDamageMax),
        this.cfg.touchDamageType,
        wykonanie,
      ),
      this.hitVectorTo(player),
      wykonanie,
    );
    this.reportAttack(AKCJE.wolfLunge, w.outcome, player, w.mitigated, wykonanie);
  }


  /**
   * Call every wolf-kin in earshot.
   *
   * Found via `physics.overlapCirc` rather than a pack roster handed down from
   * the scene: the bodies are already in the physics world, so this needs no
   * plumbing and cannot go stale when one dies or respawns.
   *
   * A called wolf howls in turn, which is how an alarm relays across a
   * strung-out pack. That cannot loop: `aggro()` is a no-op on a wolf already
   * chasing, so the relay stops the moment everyone in range is awake. The
   * duplicate sounds collapse into one through Sfx's retrigger gate.
   */
  protected howl(): void {
    const nowMs = this.scene.time.now;
    if (nowMs < this.nextHowlAt) return;
    this.nextHowlAt = nowMs + this.packCfg.howlCooldownMs;

    this.wyjeTeraz = true;
    this.playOneShot("growl");
    this.wyjeTeraz = false;
    Sfx.play("howl");
    expandingRing(this.scene, {
      x: this.x,
      y: this.y,
      radius: 14,
      color: 0x9fb4c8,
      alpha: 0.45,
      scale: 3.4,
      duration: 520,
      depth: DEPTH.entities + this.y - 1,
    });

    // ⚠ Środek kręgu z CIAŁA wyjącego wilka, nie z jego duszka (2026-09-07).
    // `overlapCirc` i tak testuje CIAŁA pozostałych, więc mieszanie tu duszka
    // znaczyło, że krąg wychodzi z innego punktu, niż w nim szuka.
    // `callRadius` nietknięty.
    const skad = this.combatOrigin;
    const bodies = this.scene.physics.overlapCirc(
      skad.x,
      skad.y,
      this.packCfg.callRadius,
      true,
      false,
    );
    for (const b of bodies) {
      const other = (b as Phaser.Physics.Arcade.Body).gameObject;
      if (other === this) continue;
      if (other instanceof Wolf && !other.isDead) other.aggro();
    }
  }
}

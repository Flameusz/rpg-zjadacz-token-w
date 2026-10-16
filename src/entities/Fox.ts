import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { FOX, AKCJE, ASSETS } from "../config/GameConfig";
import { foxAnim } from "../core/Animations";
import { Sfx } from "../core/Sfx";
import { ActionRunner } from "../core/CombatAction";
import { gapBetween } from "../core/CombatGeometry";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";

/** Poniżej tej prędkości (px/s) stworzenie „stoi" — ten sam próg co reszta rosteru. */
const STOP_SPEED = 2;

/** Ucieczka: `alert` = zauważył cię i stoi nastroszony, `bolt` = zryw,
 *  `watch` = postój z oglądaniem się (okno, w którym da się go trafić). */
type FleePhase = "idle" | "alert" | "bolt" | "watch";

/** `flee` = zwierzyna, `turn` = zwrot (telegraf), `fight` = walczy. */
type Mode = "flee" | "turn" | "fight";

/**
 * **Lis — złodziej z kurnika** (2026-10-04). Archetyp „zwierzyna, która się
 * odgryza", ale z innym spustem niż królik: nie cios, tylko **bezskuteczność
 * ucieczki**. Liczby i ich wyprowadzenie: `FOX` w `GameConfig.ts`.
 *
 * - Zauważony gracz → nastroszenie → **zrywy z postojami**. Zryw kończy się
 *   BILANSEM: nieudany, gdy dystans od jego startu urósł za mało
 *   (`minGainPx`) ALBO gdy gracz w tym czasie przebiegł w stronę lisa
 *   ≥ `pursuitShare` jego drogi (pogoń nie odpuściła — 2026-10-05, bez tego
 *   gracz w zbroi albo na niepełnym wychyleniu drążka nie odwracał lisa
 *   nigdy); `strikesToTurn` pod rząd → **zwrot**. Udany cofa licznik.
 * - Dogoniony w postoju (`cornerGap`) — nieudany zryw więcej i zryw od razu.
 *   UDERZONY — zwrot od razu.
 * - Zwrot to telegraf (`snarl.turnMs`: stoi, jeży się, warczy), potem walka
 *   jak u rozjuszonego królika: podejście, stop na `bite.range`, kęs
 *   rozstrzygany przeciw `bite.reach`.
 * - Odsadził się (`calmGap`) — przestaje uciekać; po zerwaniu pościgu
 *   uspokaja się CAŁKIEM (licznik i tryb wracają do zera).
 *
 * ⚠ Zachowanie ZGŁASZA INTENCJĘ (`move.flee` / `seek` / `hold`), nigdy nie
 * pisze prędkości. Zryw idzie `flee`, nie zamrożonym impulsem jak sploch
 * królika: lis ucieka PRZED KIMŚ i poprawia kurs, a ściana nie kończy zrywu —
 * kończy go bilans (wbity w drzewo nie zyska dystansu, więc i tak przegrywa).
 */
export class Fox extends Enemy {
  private readonly akcje = new ActionRunner();
  private mode: Mode = "flee";
  private fleePhase: FleePhase = "idle";
  private fleeUntil = 0;
  /** Dystans między ciałami w chwili startu zrywu — podstawa bilansu. */
  private gapAtBolt = 0;
  /** Punkt, do którego biegnie bieżący zryw — wybrany na starcie i NIE
   *  korygowany (jak sploch królika: da się lisowi wejść w tor). `null` =
   *  osaczony, zryw tylko się ślizga (`move.flee`). */
  private boltTarget: Phaser.Math.Vector2 | null = null;
  /** Nieudane zrywy pod rząd (udany cofa o jeden). */
  private failedBolts = 0;
  /** Droga lisa i droga gracza W STRONĘ lisa w bieżącym zrywie — drugi
   *  warunek bilansu (`FOX.flight.pursuitShare`). */
  private boltFoxPath = 0;
  private boltChasePath = 0;
  private boltPrev: { mx: number; my: number; yx: number; yy: number } | null = null;
  private turnUntil = 0;
  /** Gdzie ostatnio był gracz — zwrot modelu 3D w postoju, zwrocie i walce. */
  private lastPlayer: { x: number; y: number } | null = null;
  /** Do kiedy grać na modelu 3D klip trafienia. */
  private hurtUntil3d = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Jawna klatka startowa — `Enemy` liczy z niej `restHeight` i ciało, zanim
    // ruszy kod podklasy (ten sam powód co u niedźwiedzia).
    super(scene, x, y, "fox", FOX, ASSETS.fox.idleKey, 0);
    this.play(foxAnim("idle"));
  }

  /** Zwrot i kęs to obietnice wobec gracza — nie odchodzi w ich trakcie. */
  protected canDeaggro(): boolean {
    // ⚠ Także nie w ZRYWIE: zryw trasą do punktu, do którego A* nie znalazł
    // drogi, zgłasza `targetUnreachable`, a zerwanie pościgu kasuje licznik
    // nieudanych zrywów — lis wracałby do zera i nigdy by się nie odwrócił.
    return this.mode !== "turn" && !this.akcje.busy && this.fleePhase !== "bolt";
  }

  /** ⚠ Uspokaja się CAŁKIEM — patrz `FOX`: to zwierzyna, nie drapieżnik na gracza. */
  protected onLoseAggro(): void {
    this.akcje.reset();
    this.mode = "flee";
    this.fleePhase = "idle";
    this.fleeUntil = 0;
    this.failedBolts = 0;
    this.setBaseTint(null);
  }

  /** Złapany = ucieczka nie działa. Zwrot przez ten sam telegraf, nie od razu kęs. */
  protected onHurt(): void {
    this.hurtUntil3d = this.scene.time.now + 300;
    if (this.mode === "flee") this.startTurn(this.scene.time.now);
  }

  interrupt(): void {
    if (this.isDead) return;
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  /** Ogłuszenie zdjęte w trakcie zwrotu — telegraf ma wrócić, nie zgasnąć. */
  protected restoreStateTint(): void {
    this.setBaseTint(this.mode === "turn" ? FOX.snarl.tint : null);
  }

  /** Kęs ma własny test zasięgu (`resolveBite`) — kontakt nie ma czego rozstrzygać. */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const you = player.combatOrigin;
    this.lastPlayer = { x: you.x, y: you.y };
    if (this.mode === "fight") {
      this.fight(player, nowMs);
      return;
    }
    if (this.mode === "turn") {
      this.move.hold();
      if (nowMs >= this.turnUntil) {
        this.mode = "fight";
        this.setBaseTint(null);
      }
      return;
    }
    this.flee(player, nowMs);
  }

  private startTurn(nowMs: number): void {
    this.mode = "turn";
    this.turnUntil = nowMs + FOX.snarl.turnMs;
    this.fleePhase = "idle";
    // setBaseTint, nigdy setTint: mignięcie po trafieniu przywraca tint stanu.
    this.setBaseTint(FOX.snarl.tint);
    Sfx.play("growl");
  }

  /** ⚠ Dystanse między ŚRODKAMI CIAŁ — tą samą przestrzenią, w której mierzy walka. */
  private flee(player: CombatTarget, nowMs: number): void {
    const f = FOX.flight;
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);

    if (this.fleePhase === "bolt") {
      this.trackBolt(me, you);
      if (this.boltTarget) this.move.seek(this.boltTarget.x, this.boltTarget.y, f.fleeSpeed);
      else this.move.flee(you.x, you.y, f.fleeSpeed);
      if (nowMs < this.fleeUntil) return;
      // ── Bilans zrywu: czy ucieczka cokolwiek dała ─────────────────────────
      // Nieudany, gdy nic nie zyskał (osaczony, szybki gracz) ALBO gdy pogoń
      // nie odpuściła — patrz `FOX.flight.pursuitShare`.
      const nieZyskal = dist - this.gapAtBolt < f.minGainPx;
      const pogonTrwa = this.boltChasePath >= f.pursuitShare * this.boltFoxPath;
      if (nieZyskal || pogonTrwa) this.failedBolts++;
      else this.failedBolts = Math.max(0, this.failedBolts - 1);
      if (this.failedBolts >= f.strikesToTurn) {
        this.startTurn(nowMs);
        return;
      }
      this.fleePhase = "watch";
      this.fleeUntil = nowMs + f.watchMs;
      this.move.hold();
      return;
    }

    // Odsadził się — przestaje uciekać. Pościg zerwie za chwilę baza.
    if (dist > f.calmGap) {
      this.move.hold();
      this.fleePhase = "idle";
      this.fleeUntil = 0;
      return;
    }

    if (this.fleePhase === "watch") {
      // ⚠ Stoi — okno, w którym gracz może się zatrzymać i trafić.
      this.move.hold();
      // Dogoniony w postoju: to jeszcze jeden dowód, że ucieczka nie działa —
      // liczy się jak nieudany zryw, a lis zrywa się OD RAZU.
      // ⚠ Nie „zwrot natychmiast": tak było w pierwszej wersji i w lesie, gdzie
      // wolny bywa tylko kierunek w bok, pościg kończył się po 1,2–1,6 s.
      if (dist <= f.cornerGap) {
        this.failedBolts++;
        if (this.failedBolts >= f.strikesToTurn) this.startTurn(nowMs);
        else this.startBolt(player, dist, nowMs);
        return;
      }
      if (nowMs >= this.fleeUntil) this.startBolt(player, dist, nowMs);
      return;
    }

    if (this.fleePhase === "alert") {
      this.move.hold();
      if (nowMs >= this.fleeUntil || dist <= f.alertPanicGap) this.startBolt(player, dist, nowMs);
      return;
    }

    // `idle`: pierwsze spotkanie (albo powrót po odsadzeniu się).
    this.move.hold();
    if (dist > f.alertRange) return;
    this.fleePhase = "alert";
    this.fleeUntil = nowMs + f.alertMs;
  }

  private startBolt(player: CombatTarget, dist: number, nowMs: number): void {
    const f = FOX.flight;
    this.fleePhase = "bolt";
    this.fleeUntil = nowMs + f.boltMs;
    this.gapAtBolt = dist;
    this.boltTarget = this.escapePoint(player, (f.fleeSpeed * f.boltMs) / 1000, f.escapeFanDeg);
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    this.boltFoxPath = 0;
    this.boltChasePath = 0;
    this.boltPrev = { mx: me.x, my: me.y, yx: you.x, yy: you.y };
  }

  /**
   * Co klatkę zrywu: droga lisa i przesunięcie gracza RZUTOWANE na kierunek
   * do lisa. ⚠ Rzut, nie długość drogi — gracz idący w bok albo odchodzący
   * nie goni, a w bilansie wyglądałby jak pogoń.
   */
  private trackBolt(me: { x: number; y: number }, you: { x: number; y: number }): void {
    const p = this.boltPrev;
    if (p) {
      this.boltFoxPath += Math.hypot(me.x - p.mx, me.y - p.my);
      const kx = p.mx - p.yx;
      const ky = p.my - p.yy;
      const k = Math.hypot(kx, ky);
      if (k > 0) this.boltChasePath += ((you.x - p.yx) * kx + (you.y - p.yy) * ky) / k;
    }
    this.boltPrev = { mx: me.x, my: me.y, yx: you.x, yy: you.y };
  }

  /** Walka — wzór rozjuszonego królika: podejdź, STAŃ, nastrosz się, ugryź. */
  private fight(player: CombatTarget, nowMs: number): void {
    const b = FOX.bite;
    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveBite(player);
      if (p.to === "recovery") this.setBaseTint(null);
    }
    if (this.akcje.busy) {
      this.move.hold();
      return;
    }
    // ⚠ PRZEŚWIT między hurtboxami, nie dystans środków.
    if (gapBetween(this.combatBody, player.combatBody) > b.range) {
      const cel = player.combatOrigin;
      this.move.seek(cel.x, cel.y, b.approachSpeed);
      return;
    }
    this.move.hold();
    if (player.isDead) return;
    if (this.akcje.request(AKCJE.foxBite, nowMs)) this.setBaseTint(AKCJE.foxBite.telegraphTint);
  }

  /**
   * Kęs — albo i nie. Dystans testowany PONOWNIE, przeciw `reach`; pudło się
   * ZGŁASZA (reguła Fazy 5A), a fumble kończy się bez `takeDamage` (PRD obrony
   * gracza nie może spłonąć na ciosie, który i tak nie wylądował).
   */
  private resolveBite(player: CombatTarget): void {
    if (player.isDead) return;
    if (gapBetween(this.combatBody, player.combatBody) > FOX.bite.reach) {
      this.reportAttack(AKCJE.foxBite, "miss", player, 0, "whiff");
      return;
    }
    const wykonanie = this.rollExecution(true);
    if (wykonanie === "fumble") {
      this.reportAttack(AKCJE.foxBite, "miss", player, 0, wykonanie);
      return;
    }
    const wynik = player.takeDamage(
      this.damagePacket(
        Phaser.Math.Between(AKCJE.foxBite.damageMin, AKCJE.foxBite.damageMax),
        AKCJE.foxBite.damageType,
        wykonanie,
      ),
      this.hitVectorTo(player),
      wykonanie,
    );
    this.reportAttack(AKCJE.foxBite, wynik.outcome, player, wynik.mitigated, wykonanie);
  }

  /**
   * ⭐ **Co pokazać na modelu 3D** (`Creature3D`). ⛔ Nic tu nie zmienia
   * zachowania. W postoju, alarmie i zwrocie model patrzy NA GRACZA — lis
   * ogląda się na pogoń; w biegu zwrot bierze `Creature3D` z prędkości.
   */
  stan3d(): Stan3D {
    const g = this.lastPlayer;
    const o = this.combatOrigin;
    const naGracza = g ? Math.atan2(g.x - o.x, g.y - o.y) : null;
    if (this.isStunned) return { klip: "Stunned" };
    const faza = this.akcje.phase;
    if (this.akcje.current?.id === AKCJE.foxBite.id && (faza === "windup" || faza === "active")) {
      return { klip: "Bite", raz: true, kat: naGracza };
    }
    if (this.mode === "turn") return { klip: "Snarl", kat: naGracza };
    if (this.scene.time.now < this.hurtUntil3d) return { klip: "Hit", raz: true };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= STOP_SPEED) {
      const czujny = this.isChasing && (this.fleePhase === "alert" || this.fleePhase === "watch" || this.mode === "fight");
      return { klip: czujny ? "Alert" : "Idle", kat: this.isChasing ? naGracza : null };
    }
    return { klip: v > FOX.patrolSpeed * 2 ? "Run" : "Walk" };
  }

  /** Arkusz 2D (ścieżka awaryjna): `fox_*.png` patrzą w LEWO — lustro przy vx > 0. */
  protected updateAnimation(vx: number, vy: number): void {
    const speed = Math.hypot(vx, vy);
    if (speed <= STOP_SPEED) {
      this.play(foxAnim("idle"), true);
      return;
    }
    this.setFlipX(vx > 0);
    this.play(speed > FOX.patrolSpeed * 2 ? foxAnim("run") : foxAnim("walk"), true);
  }
}

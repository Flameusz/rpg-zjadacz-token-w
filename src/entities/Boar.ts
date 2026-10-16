import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { BOAR, AKCJE, ASSETS } from "../config/GameConfig";
import { boarAnim } from "../core/Animations";
import { Sfx } from "../core/Sfx";
import { gapBetween } from "../core/CombatGeometry";
import { ActionRunner } from "../core/CombatAction";
import { movementContextFor } from "../core/movement/MovementContext";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";


/** Below this speed (px/s) the boar is considered stopped — see Rabbit.ts,
 *  same reasoning. */
const STOP_SPEED = 2;

/**
 * Forest boar. Extends the base Enemy with a telegraphed charge: it closes in
 * (approach), plants and winds up with a red tint (telegraph), commits to a
 * fast lunge in a fixed direction — side-steppable (lunge) — then stands
 * stunned and takes free hits (recover). Everything else (patrol, damage,
 * knockback, death) is the shared base behaviour, tuned by the BOAR config.
 *
 * Also the second enemy (after Rabbit) with a real directional sheet — see
 * `updateAnimation` below.
 */
export class Boar extends Enemy {
  /**
   * Obie akcje dzika prowadzi jeden `ActionRunner` (Faza 2). ⚠ Cooldowny są
   * kluczowane po `id`, więc szarża i kieł stygną **niezależnie** — dokładnie
   * to, co wcześniej wymagało dwóch osobnych pól.
   */
  private readonly akcje = new ActionRunner();
  private readonly lungeVel = new Phaser.Math.Vector2();
  /** Gdzie ostatnio był gracz (pościg) — zwrot modelu 3D w telegrafie i kle. */
  private ostatniGracz: { x: number; y: number } | null = null;
  /** Do kiedy grać klip trafienia na modelu 3D (`onHurt`). */
  private trafionyDo = 0;
  /** Cofa się na rozbieg (do `BOAR.backoff.gap`). */
  private cofa = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Explicit initial frame — see the matching note in Rabbit.ts: Enemy's
    // constructor sizes restHeight/the hitbox from this.width/height before
    // any subclass code runs, so an unset frame (defaulting to the whole
    // sheet) would poison both for good.
    super(scene, x, y, "boar", BOAR, ASSETS.boar.key, ASSETS.boar.idleDownFrame);
    this.play(boarAnim.idleDown);
  }


  /**
   * A blunt hit cancels the charge. This is the payoff for carrying a slow
   * weapon: the boar's whole threat is a committed lunge, and a hammer can take
   * that lunge away — dropping it straight into the vulnerable recovery it
   * would normally only reach after connecting.
   */
  /** Committed once the wind-up starts: a telegraph a boar can walk out of is
   *  worse than no telegraph at all. */
  protected canDeaggro(): boolean {
    return !this.akcje.busy;
  }

  protected onLoseAggro(): void {
    this.cofa = false;
    this.akcje.reset();
    this.setBaseTint(null);
  }

  protected updateChase(player: CombatTarget, nowMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const c = BOAR.charge;

    this.ostatniGracz = { x: player.combatOrigin.x, y: player.combatOrigin.y };
    for (const p of this.akcje.tick(nowMs)) {
      // Kieł rozstrzyga się na WEJŚCIU w `active` (dzik stoi i bodzie). Szarża —
      // co klatkę w trakcie lotu, niżej. Dwie akcje, dwa różne momenty.
      if (p.to === "active" && p.action.id === AKCJE.boarGore.id) this.resolveGore(player, nowMs);
      if (p.to === "recovery" || p.to === "idle") this.setBaseTint(null);
    }

    // ── Lot szarży ─────────────────────────────────────────────────────────
    if (this.akcje.phase === "active" && this.akcje.current?.id === AKCJE.boarCharge.id) {
      // Kierunek zamraża się w pierwszej klatce lotu — dzik jedzie tam, gdzie
      // gracz BYŁ, i to jest cała jego kontrgra.
      if (this.lungeVel.lengthSq() < 0.0001) this.aimLunge(player);
      // Szarża jest ZOBOWIĄZANIEM — solver się do niej nie odzywa. To ta sama
      // własność, którą `CombatAction` deklaruje jako `ownsBody`.
      this.move.impulse(this.lungeVel.x, this.lungeVel.y);

      if (!player.isDead) {
        // ⚠ Tor sprawdzany CO KLATKĘ — przy 300 px/s i 60 fps to test co 5 px,
        // czyli w praktyce kapsuła zamiatana wzdłuż drogi szarży.
        const dist = gapBetween(this.combatBody, player.combatBody);
        if (dist <= c.hitReach) {
          // ── WARSTWA 2 (Proficiency) ─────────────────────────────────
          // ⚠ **`allowFumble: false` — decyzja ARCHITEKTONICZNA.** Szarża nie
          // ma dyskretnej chwili rozstrzygnięcia: tor jest testowany CO KLATKĘ,
          // czyli kapsułą zamiataną wzdłuż drogi. „Kapsuła dotknęła, ale rzut
          // mówi nie" znaczyłoby na ekranie, że dzik PRZENIKA przez gracza —
          // to nie czyta się jako nieudolność, tylko jako usterka silnika.
          //
          // ⚠ Ześlizg i `m(P)` zostają: muśnięcie bokiem w rozpędzie jest
          // dokładnie tym, co ta kategoria ma znaczyć.
          const wykonanie = this.rollExecution(false);
          const w = player.takeDamage(
            this.damagePacket(
              Phaser.Math.Between(c.damageMin, c.damageMax),
              c.damageType,
              wykonanie,
            ),
            this.hitVectorTo(player),
            wykonanie,
          );
          this.reportAttack(AKCJE.boarCharge, w.outcome, player, w.mitigated, wykonanie);
          // Trafienie KOŃCZY szarżę — to jest okno na kontrę. `endActive`
          // zamyka zarazem okno `oncePerActive`, więc nie ma czym trafić drugi
          // raz; wcześniej pilnowało tego prywatne pole `lungeHit`.
          this.akcje.endActive(nowMs);
          this.setBaseTint(null);
          return;
        }
      }
      if (!body.blocked.none) {
        this.akcje.endActive(nowMs);
        this.setBaseTint(null);
      }
      return;
    }

    // Telegraf i bezbronność są nieruchome.
    if (this.akcje.busy) {
      this.move.hold();
      this.setFlipX(player.x < this.x);
      return;
    }

    // ── Decyzja ────────────────────────────────────────────────────────────
    this.setFlipX(player.x < this.x);
    // ⚠ Dystans wyzwalający szarżę — między ŚRODKAMI CIAŁ (2026-09-07), czyli
    // w tej samej przestrzeni, w której kieł niżej mierzy prześwit.
    // `triggerRange` nietknięte.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);

    // ⚠ Kolejność jest treścią: **szarża ma pierwszeństwo**, kieł wypełnia jej
    // cooldown. Odwrotnie dzik w zwarciu przestałby szarżować w ogóle — czyli
    // straciłby swoją jedyną mechanikę dokładnie wtedy, gdy walka trwa.
    // ⚠⚠ **DWA WARUNKI WEJŚCIA, dopisane po playteście 2026-09-05.** Do tej daty
    // jedynym warunkiem był `dist <= triggerRange`, więc dzik szarżował **stojąc
    // przy graczu** (czytało się to jak „mam tylko jeden atak") i **przez
    // drzewo** — zaczynał lot, zapierał się o kolizję i tracił całą akcję.
    //
    // ⚠ Oba warunki **muszą stać PRZED `request`**, bo `request` startuje akcję.
    //   Sprawdzone po kolejności `&&`: żaden zablokowany warunek nie zostawia
    //   dzika w stanie szarży — akcja po prostu się nie zaczyna, a sterowanie
    //   spada niżej, do istniejącego kła albo pościgu.
    //
    // ⛔ **Ani jedna liczba szarży się nie zmienia** — obrażenia, cooldown,
    //   prędkość, czas, zasięg wyzwalania i knockback zostają. Zmienia się
    //   wyłącznie KIEDY wolno zacząć.
    if (dist <= c.triggerRange && this.chargeOdlegloscOk(player) && this.chargeTorWolny(player) && this.akcje.request(AKCJE.boarCharge, nowMs)) {
      this.lungeVel.reset();
      // setBaseTint, nie setTint: mignięcie po trafieniu przywraca tint stanu,
      // więc cios w trakcie telegrafu nie kasuje zapowiedzi.
      this.setBaseTint(AKCJE.boarCharge.telegraphTint);
      // Tint działa tylko, gdy dzik jest na ekranie; pomruk niesie to samo
      // ostrzeżenie, gdy go nie ma.
      Sfx.play("growl");
      this.move.hold();
      return;
    }

    // ⚠ PRZEŚWIT między hurtboxami (Faza 1B-a), nie dystans środków.
    const gap = gapBetween(this.combatBody, player.combatBody);
    const doSzarzy = this.akcje.msUntilReady(AKCJE.boarCharge, nowMs);
    if (gap <= BOAR.gore.range) {
      // ⚠ **Kieł ustępuje szarży, i to nie tylko pierwszeństwem.** Nie wolno mu
      // wejść, gdy szarża zaraz wstanie — inaczej dzik jest w akcji niemal bez
      // przerwy i nie daje okna na kontrę. Patrz `gore.requiresChargeAwayMs`.
      if (doSzarzy >= BOAR.gore.requiresChargeAwayMs && !player.isDead && this.akcje.request(AKCJE.boarGore, nowMs)) {
        this.move.hold();
        this.setBaseTint(AKCJE.boarGore.telegraphTint);
        Sfx.play("growl");
        return;
      }
      // ⚠⚠ Bez dostępnego kła — ROZBIEG, nigdy stanie w zwarciu (2026-10-04).
      // Stało tu `hold()` + `return`, a szarża w zwarciu nie startuje
      // (`chargeOdlegloscOk`), więc gotowa szarża zakleszczała dzika na stałe —
      // „stoi jak debil" z gry. Patrz `BOAR.backoff`.
      this.cofanie(player);
      return;
    }
    if (this.cofa && gap < BOAR.backoff.gap) {
      this.cofanie(player);
      return;
    }
    this.cofa = false;
    // Szarża stygnie, a dzik stoi na rozbiegu — czeka łbem do gracza, nie
    // wraca w zwarcie (tam znów nie miałby czym uderzyć).
    if (doSzarzy > 0 && gap <= BOAR.backoff.waitGap) {
      this.move.hold();
      return;
    }

    // ⚠ Cel w przestrzeni CIAŁ (2026-09-07) — `you` policzone wyżej.
    this.move.seek(you.x, you.y, BOAR.chaseSpeed);
  }

  /**
   * **Warunek 1 — czy gracz NIE jest już w zwarciu.**
   *
   * ⚠ **Próg to istniejące `BOAR.gore.range`, nie nowa liczba.** Reguła brzmi:
   * „jeśli mogę dziabnąć kłem, nie rozpędzam się" — czyli dokładnie ta sama
   * granica, która i tak decyduje o ataku bliskiego zasięgu dwie linijki niżej.
   * Dzięki temu w zwarciu sterowanie spada do **istniejącej** gałęzi kła.
   *
   * ⚠ **Mierzy PRZEŚWIT między hurtboxami** (`gapBetween`), tak jak gałąź kła —
   * nie dystans środków. Porównywanie tych dwóch różnymi miarami dałoby pas,
   * w którym żaden atak nie wchodzi.
   *
   * ⚠ Priorytet szarży nad kłem **zostaje nietknięty poza zwarciem** — to była
   * świadoma decyzja (komentarz przy gałęzi wyżej) i ten warunek jej nie cofa,
   * tylko wycina z niej przypadek kontaktu.
   */
  /** Cofanie na rozbieg — tyłem, łbem do gracza (`stan3d`), aż prześwit
   *  dojdzie do `BOAR.backoff.gap`. ⚠ `flee`, nie `seek`: cofanie nie ma
   *  punktu docelowego, a przy przeszkodzie ma się ślizgnąć, nie zawracać. */
  private cofanie(player: CombatTarget): void {
    const you = player.combatOrigin;
    this.cofa = true;
    this.move.flee(you.x, you.y, BOAR.backoff.speed);
  }

  private chargeOdlegloscOk(player: CombatTarget): boolean {
    return gapBetween(this.combatBody, player.combatBody) > BOAR.gore.range;
  }

  /**
   * **Warunek 2 — czy tor szarży jest wolny.**
   *
   * ⚠ **Pyta `NavGrid`, czyli tę samą siatkę prześwitu, po której chodzi cały
   * roster** — nie własną kopią kolizji. Ta sama metoda (`hasClearLine`)
   * obsługuje podgląd celowania gracza, więc reguła „widzę drzewo → nie ma
   * trasy" jest w grze JEDNA.
   *
   * ⛔ **To nie jest omijanie przeszkód.** Zablokowany tor po prostu nie
   * pozwala zacząć szarży; dzik korzysta wtedy z istniejącego pościgu
   * (`move.seek`), który ma własny solver i sam obejdzie drzewo.
   *
   * ⚠ Brak siatki (mapa bez kolizji kafli — Zagaje, Gęstwina) znaczy „nic nie
   * blokuje", czyli **zachowanie sprzed tej zmiany**. To jest decyzja na zapis:
   * dzik na mapie bez kolizji ma szarżować jak dotąd.
   */
  private chargeTorWolny(player: CombatTarget): boolean {
    const nav = movementContextFor(this.scene).nav;
    if (!nav) return true;
    // ⚠ Tor trasowany między ŚRODKAMI CIAŁ (2026-09-07) — bo to CIAŁO ma tędy
    // przelecieć, i to jego szerokość podajemy obok. Ta sama poprawka, którą
    // sieciarz ma u siebie od początku (`Spider.updateChase`: `body.center` →
    // `player.combatOrigin`).
    const o = this.combatOrigin;
    const cel = player.combatOrigin;
    return nav.hasClearLine(o.x, o.y, cel.x, cel.y, this.body?.width ?? 0);
  }

  /**
   * Walk while ambling/approaching, run for the chase proper and the lunge
   * (both comfortably above the patrol/run threshold) — same speed-based
   * split as Rabbit, so this needs no awareness of `phase`. Only set flipX
   * while actually moving horizontally: the telegraph/recover phases already
   * set their own facing (toward the player) and must not be overridden back
   * to "right" here just because velocity is momentarily zero.
   */
  protected updateAnimation(vx: number, vy: number): void {
    const speed = Math.hypot(vx, vy);
    if (speed <= STOP_SPEED || Math.abs(vy) > Math.abs(vx)) {
      this.play(vy < 0 ? boarAnim.idleUp : boarAnim.idleDown, true);
      return;
    }
    this.setFlipX(vx < 0);
    const running = Math.abs(vx) > BOAR.patrolSpeed * 1.3;
    this.play(running ? boarAnim.run : boarAnim.walk, true);
  }

  protected onHurt(): void {
    this.trafionyDo = this.scene.time.now + 320;
  }

  /**
   * ⭐ **Co pokazać na modelu 3D** (`Creature3D`, 2026-10-03). Czyta WYŁĄCZNIE
   * stan, który dzik i tak ma — fazę `ActionRunner`a, ogłuszenie, prędkość.
   * ⛔ Nic tu nie zmienia zachowania; to jest odczyt dla prezentacji, ten sam
   * rodzaj co `updateAnimation` dla arkusza 2D.
   */
  stan3d(): Stan3D {
    const now = this.scene.time.now;
    const naGracza = this.ostatniGracz
      ? Math.atan2(this.ostatniGracz.x - this.combatOrigin.x, this.ostatniGracz.y - this.combatOrigin.y)
      : null;
    if (this.isStunned) return { klip: "Stunned" };
    const akcja = this.akcje.current?.id;
    const faza = this.akcje.phase;
    if (akcja === AKCJE.boarCharge.id) {
      if (faza === "windup") return { klip: "Telegraph", kat: naGracza };
      if (faza === "active") return { klip: "Charge", tempo: 1.6 };
      if (faza === "recovery") return { klip: "Stunned" };
    }
    if (akcja === AKCJE.boarGore.id && (faza === "windup" || faza === "active")) {
      return { klip: "Gore", raz: true, kat: naGracza };
    }
    if (now < this.trafionyDo) return { klip: "Hit", raz: true };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= STOP_SPEED) return { klip: "Idle", kat: this.akcje.busy || this.isChasing ? naGracza : null };
    // Rozbieg: chód TYŁEM, łbem do gracza — inaczej odwracałby się zadem.
    if (this.cofa) return { klip: "Walk", tempo: -1.0, kat: naGracza };
    return { klip: v > BOAR.patrolSpeed * 1.6 ? "Run" : "Walk" };
  }

  private aimLunge(player: CombatTarget): void {
    // ⚠ Kierunek szarży w przestrzeni CIAŁ (2026-09-07) — lot rozstrzyga się
    // przez `gapBetween`/kapsułę, czyli już w niej. Celowanie w duszka znaczyło,
    // że dzik leciał w punkt 19 px NAD ciałem gracza.
    const o = this.combatOrigin;
    const cel = player.combatOrigin;
    const dir = new Phaser.Math.Vector2(cel.x - o.x, cel.y - o.y);
    if (dir.lengthSq() < 0.0001) dir.set(this.flipX ? -1 : 1, 0);
    dir.normalize().scale(BOAR.charge.speed);
    this.lungeVel.copy(dir);
  }

  interrupt(): void {
    if (this.isDead) return;
    // Runner sam pilnuje, że przerwać da się tylko ZAMACH (telegraf szarży albo
    // kieł) i że cooldown mimo to biegnie — obuch ma kupować cały cios.
    if (this.akcje.interrupt(this.scene.time.now)) {
      this.setBaseTint(null);
      return;
    }
    // Obuch wytrąca też dzika z samego LOTU szarży, który zamachem nie jest.
    if (this.akcje.phase === "active" && this.akcje.current?.id === AKCJE.boarCharge.id) {
      this.akcje.endActive(this.scene.time.now);
      this.setBaseTint(null);
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
  }

  /**
   * Ogłuszenie kasuje **wszystko**, także lot szarży.
   *
   * ⚠ Różnica wobec `interrupt()` wyżej jest tu widoczna najlepiej z całego
   * rosteru: przerwanie musi rozróżniać zamach (`interrupt`) od lotu
   * (`endActive`), bo to dwie różne rzeczy i po każdej dzik zostaje w innej
   * fazie. Ogłuszenie nie rozróżnia — `cancel()` bierze każdą fazę i zwraca
   * maszynę do `idle`. Bez tego telegraf szarży „doczekałby" końca ogłuszenia
   * i wystartował bez zapowiedzi (patrz `ActionRunner.cancel`).
   */
  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
    // Zamrożony kurs szarży przestaje obowiązywać — następna zacznie się od
    // nowego namiaru, a nie od tego sprzed ogłuszenia.
    this.lungeVel.reset();
    this.setBaseTint(null);
  }

  /**
   * ⚠ **Dzik nie rani przez nakładanie ciał** — od 2026-08-23 oba jego ciosy
   * mają własny test zasięgu (szarża: `hitReach` co klatkę wzdłuż toru; kieł:
   * `resolveGore`).
   *
   * ⚠ **Kontakt NIE był tu kanałem pobocznym.** Config wycenia go na **54%
   * surowego wyjścia dzika** — dlatego wyłączenie go musiało przyjść RAZEM z
   * `gore`, a nie przed nim. Samo zdjęcie kontaktu obcięłoby zwierzęciu połowę
   * obrażeń i zrobiło z niego manekina do jednej szarży na 2,2 s.
   */
  protected get contactDamageEnabled(): boolean {
    return false;
  }


  /**
   * Cios kłem ląduje — albo i nie.
   *
   * ⚠ Dystans testowany PONOWNIE, przeciw `reach`, a nie `range`. Bez tego
   * wynik zapadałby w chwili startu zamachu, a odejście o krok byłoby teatrem.
   */
  private resolveGore(player: CombatTarget, _nowMs: number): void {
    // ⚠ Fazą, tintem i cooldownem zarządza runner — tutaj zostaje SAM CIOS.
    const g = BOAR.gore;
    if (player.isDead) return;

    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > g.reach) {
      this.reportAttack(AKCJE.boarGore, "miss", player, 0, "whiff"); // odszedłeś — kieł w powietrzu
      return;
    }
    // ── WARSTWA 2 (Proficiency) ───────────────────────────────────────────
    // ⚠ Kieł ma dyskretną chwilę rozstrzygnięcia i czysto DYSTANSOWY test
    // warstwy 1, więc dostaje pełną trójkę — inaczej niż szarża wyżej.
    //
    // ⚠ Fumble kończy się TUTAJ, BEZ `player.takeDamage`: `resolveIncoming`
    // ma skutek uboczny w liczniku PRD (`core/Defense.ts`), więc wywołanie go
    // „na zero" spaliłoby graczowi postęp Uniku i Parowania na ciosie, który
    // i tak nie miał wylądować.
    const wykonanie = this.rollExecution(true);
    if (wykonanie === "fumble") {
      this.reportAttack(AKCJE.boarGore, "miss", player, 0, wykonanie);
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
    this.reportAttack(AKCJE.boarGore, w.outcome, player, w.mitigated, wykonanie);
  }
}

import Phaser from "phaser";
import type { CombatTarget, EffectTarget } from "../core/combat/Contracts";
import type { EffectSpec } from "../core/combat/StatusEffects";
import { POISON } from "../core/combat/EffectKinds";
import { VENOM_SPIDER, VENOM_SPIDER_BITE_ACTION, ASSETS } from "../config/GameConfig";
import { Sfx } from "../core/Sfx";
import { gapBetween } from "../core/CombatGeometry";
import { ActionRunner } from "../core/CombatAction";
import { Enemy } from "./Enemy";
import type { Stan3D } from "../render3d/Creature3D";


/**
 * **Skoczek jadowity** — the melee spider, and the first enemy whose threat
 * GROWS during a fight instead of being a constant.
 *
 * It exists to make three things that already worked separately work together:
 * target selection, the armed autoattack, and the **root a swing costs you**.
 * The tell (480 ms) is deliberately longer than that root plus the walk out of
 * `bite.reach` (~450 ms worst case, with the hammer), so "read it and step
 * back" is genuinely available with no ability and no particular weapon — but
 * it costs a swing, and that trade is the whole creature.
 *
 * Everything about the numbers, including why a single one of these can never
 * deliver three venom stacks, is in `docs/pajak_jadowity_koncepcje.md` and in
 * the VENOM_SPIDER config block. Do not retune here.
 */
export class VenomSpider extends Enemy {
  /**
   * ⚠ **Pierwsze stworzenie na `ActionRunner` (Faza 2 Combat v2).**
   *
   * Zniknęły stąd trzy pola (`phase`, `phaseUntil`, `nextBiteAt`) i cały
   * `switch` po fazach — razem z pamiętaniem, że cooldown biegnie od
   * rozstrzygnięcia, a nie od końca bezbronności. To jest ta sama maszyna,
   * którą przepisywało sześć podklas, każda osobno i każda mogąca osobno o
   * czymś zapomnieć.
   *
   * Zostaje wyłącznie to, czego runner z definicji nie wie: kiedy CHCĘ
   * zaatakować (bo to zależy od dystansu) i co się dzieje na ekranie.
   *
   * Równoważność ze starą maszyną sprawdza `tools/action_runner_weryfikacja.mjs`
   * — siedem scenariuszy, porównanie list zdarzeń co do milisekundy.
   */
  private readonly akcje = new ActionRunner();
  /** Gdzie ostatnio był gracz (pościg) — zwrot modelu 3D w zamachu i odwrocie. */
  private ostatniGracz3d: { x: number; y: number } | null = null;
  /** Do kiedy grać na modelu 3D klip trafienia. */
  private trafionyDo3d = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "venomspider", VENOM_SPIDER, ASSETS.venomSpider.faceKey);
  }

  /** Committed once the legs are up: a telegraph is a promise to the player,
   *  and one that can be walked out of by the spider is worse than none. */
  protected canDeaggro(): boolean {
    return !this.akcje.busy;
  }

  protected onLoseAggro(): void {
    this.akcje.reset();
    this.setBaseTint(null);
  }

  /**
   * A blunt hit cancels the bite outright — no venom, and the full cooldown
   * still runs, so the hammer's interrupt buys a whole stack rather than
   * delaying one.
   *
   * ⚠ This must NOT become the only answer to the creature. The pair is tuned
   * so that movement alone beats it (see the config); if a balance pass ever
   * makes the interrupt mandatory, the spider has stopped being a test of
   * positioning and become a test of inventory.
   */
  interrupt(): void {
    if (this.isDead) return;
    // Runner sam pilnuje, że przerwać da się tylko zamach i że cooldown mimo to
    // biegnie. Tutaj zostaje wyłącznie zgaszenie tintu.
    if (this.akcje.interrupt(this.scene.time.now)) this.setBaseTint(null);
  }

  /** Ogłuszenie kasuje kęs z każdej fazy. ⚠ **Nie dotyka stosów jadu już
   *  wstrzykniętych** — te są konsekwencją ciosów, które padły, a nie akcją,
   *  którą skoczek właśnie wykonuje. */
  protected onStunned(): void {
    this.akcje.cancel(this.scene.time.now);
  }

  /**
   * ⚠ **Kontakt WŁĄCZONY świadomie.** Skoczek staje na `bite.range` i nie
   * dochodzi bliżej, więc zetknięcie inicjuje gracz. Patrz ten sam komentarz w
   * `Spider.ts`.
   *
   * ⚠ **2–3 obrażenia wobec 3–5 z kęsa** — czyli niemal tyle samo. Wyłączenie
   * byłoby odczuwalnym osłabieniem, nie sprzątaniem.
   */
  protected get contactDamageEnabled(): boolean {
    return true;
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
    if (this.akcje.current?.id === VENOM_SPIDER_BITE_ACTION.id) {
      if (faza === "windup") return { klip: "Threat", kat: naGracza };
      // ⚠ `active` trwa tu JEDNĄ klatkę (rozstrzygnięcie natychmiastowe), więc
      // klip ciosu gra w bezbronności PO nim — inaczej model przeskakiwał z
      // zamachu prosto w bezruch i ciosu nie było widać wcale (test w grze).
      if (faza === "active" || faza === "recovery") return { klip: "Bite", raz: true, kat: naGracza };
    }
    if (this.scene.time.now < this.trafionyDo3d) return { klip: "Hit", raz: true };
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    const v = body ? Math.hypot(body.velocity.x, body.velocity.y) : 0;
    if (v <= 2) return { klip: "Idle", kat: this.isChasing ? naGracza : null };
    return { klip: v > this.cfg.patrolSpeed * 1.6 ? "Run" : "Walk" };
  }

  protected updateChase(player: CombatTarget & EffectTarget, nowMs: number): void {
    const b = VENOM_SPIDER.bite;
    this.setFlipX(player.x < this.x);
    this.ostatniGracz3d = { x: player.combatOrigin.x, y: player.combatOrigin.y };

    // Runner posuwa się PIERWSZY, żeby zakończona faza otworzyła miejsce na
    // decyzję jeszcze w tej samej klatce.
    for (const p of this.akcje.tick(nowMs)) {
      if (p.to === "active") this.resolveBite(player, nowMs);
      if (p.to === "recovery") this.setBaseTint(null);
    }

    if (this.akcje.busy) {
      // Zamach i bezbronność są nieruchome — jedno i drugie.
      this.move.hold();
      return;
    }

    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > b.range) {
      // Closes at chaseSpeed, which is below the player's own 150 px/s — you
      // can always walk away from one of these; the question is what it costs.
      // ⚠ Cel w przestrzeni CIAŁ — tej samej, w której `dist` powyżej decyduje
      // o zatrzymaniu (`core/movement/MoveSolver.ts`, 2026-09-07).
      const you = player.combatOrigin;
      this.move.seek(you.x, you.y, VENOM_SPIDER.chaseSpeed);
      return;
    }

    this.move.hold();
    if (player.isDead) return;
    if (this.akcje.request(VENOM_SPIDER_BITE_ACTION, nowMs)) {
      // setBaseTint, never setTint: the hit flash restores the stored state tint
      // when it ends, so a sword blow mid-tell can't delete the telegraph.
      this.setBaseTint(VENOM_SPIDER_BITE_ACTION.telegraphTint ?? null);
      Sfx.play("growl");
    }
  }

  /**
   * The bite lands — or doesn't.
   *
   * ⚠ **The range is tested AGAIN, here, at the moment of impact**, against
   * `bite.reach` rather than `bite.range`. That second test is the entire
   * reason the telegraph means anything: without it the outcome would be
   * decided when the wind-up started, and stepping back during it would be
   * theatre. The player's own swings resolve exactly this way (`pendingSwing`),
   * so the two sides of the exchange follow one rule.
   */
  private resolveBite(player: CombatTarget & EffectTarget, _nowMs: number): void {
    // ⚠ Fazą i cooldownem zarządza teraz runner — tutaj zostaje SAM CIOS.
    const b = VENOM_SPIDER.bite;
    if (player.isDead) return;
    const dist = gapBetween(this.combatBody, player.combatBody);
    if (dist > b.reach) {
      this.reportAttack(VENOM_SPIDER_BITE_ACTION, "miss", player, 0, "whiff"); // jaws close on nothing
      return;
    }

    // ── WARSTWA 2 (Proficiency) ───────────────────────────────────────────
    // ⚠ Fumble kończy się TUTAJ, BEZ `player.takeDamage` — i to nie jest
    // optymalizacja. `resolveIncoming` ma skutek uboczny w liczniku PRD
    // (`core/Defense.ts`), więc wywołanie go „na zero" spaliłoby graczowi
    // postęp Uniku i Parowania na ciosie, który i tak nie miał wylądować.
    const wykonanie = this.rollExecution(true);
    if (wykonanie === "fumble") {
      // ⚠ **H1: fumble = brak kontaktu = BRAK JADU.** Jad jest ładunkiem
      // KONTAKTU, nie osobnym rzutem — patrz warunek nałożenia niżej.
      this.reportAttack(VENOM_SPIDER_BITE_ACTION, "miss", player, 0, wykonanie);
      return;
    }
    const wynik = player.takeDamage(
      this.damagePacket(Phaser.Math.Between(b.damageMin, b.damageMax), b.damageType, wykonanie),
      this.hitVectorTo(player),
      wykonanie,
    );
    // Venom only on a bite that connected AND was survived — a dash through the
    // bite has to be clean, not "dodged the damage, kept the poison". Ta sama
    // reguła co przy spowolnieniu z sieci.
    //
    // ⚠ **Od Fazy 5A `takeDamage` zwraca OBIEKT, nie `boolean`.** Stało tu
    // `if (!killed && ...)`, co po zmianie byłoby zawsze fałszem (obiekt jest
    // prawdziwy) i **jad przestałby działać CAŁKOWICIE, bez błędu kompilacji**.
    // Dlatego wynik czyta się dziś po polach, nie po prawdziwości.
    this.reportAttack(VENOM_SPIDER_BITE_ACTION, wynik.outcome, player, wynik.mitigated, wykonanie);
    // ⚠ **KONTRAKT H1 — efekt statusowy jest ŁADUNKIEM KONTAKTU i dzieli jego
    // los, a warstwa 2 NIE skaluje jego siły ani czasu trwania.** Ześlizg to
    // kontakt, więc nakłada PEŁNY stos; fumble kontaktem nie jest i wyszedł
    // wyżej. Pełna wycena obu wariantów: `docs/systemy/proficiency.md`.
    // Zmierzone: przy H1 solo traci 5,6% starć bez jadu, przy wariancie
    // odwrotnym 14,0% — czyli 1 na 7 zamiast 1 na 18.
    if (!wynik.killed && wynik.outcome !== "immune" && !player.isDead && !player.isInvulnerable) {
      player.applyEffect(this.venomSpec());
    }
  }

  /**
   * **Jad skoczka jako gotowa specyfikacja efektu.**
   *
   * ⚠ Stoi TUTAJ, a nie w `Player`, i to jest cała treść odsprzężenia
   * z 2026-09-03: do tej daty gracz miał metodę `applyVenom`, czyli mechanikę
   * skoczka mieszkającą w cudzej klasie. Cel jest dziś `EffectTarget` — nosi
   * efekt, nie zna go.
   *
   * ⛔ **Żadna liczba nie została zmieniona** — `VENOM_SPIDER.venom` jak dotąd.
   *
   * ⚠ Dwie reguły są nośne i zapadły z pomiaru (`docs/pajak_jadowity_koncepcje.md`):
   * czas trwania jest ODŚWIEŻANY, a zegar tików NIE (inaczej para skoczków
   * gryzących co ~590 ms resetowałaby odliczanie i jad nigdy by nie tikał);
   * **przewrót NIE czyści jadu** — unik zatrzymuje ukąszenie, nie truciznę,
   * inaczej Unik stałby się przyciskiem „skasuj moje debuffy".
   */
  private venomSpec(): EffectSpec {
    const v = VENOM_SPIDER.venom;
    return {
      id: v.buffId,
      name: v.name,
      iconKey: ASSETS.venomSpider.faceKey,
      durationMs: v.durationMs,
      tickMs: v.tickMs,
      maxStacks: v.maxStacks,
      debuff: true,
      tags: [POISON.tag],
      payload: POISON.payload({ damagePerStack: v.damagePerStack, tickMs: v.tickMs }),
      detail: (e) =>
        `${e.stacks}× jad — ${POISON.get(e, "damagePerStack") * e.stacks} obr. co ${(
          POISON.get(e, "tickMs") / 1000
        ).toFixed(1)} s, blokuje regenerację`,
    };
  }
}

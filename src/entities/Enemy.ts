import Phaser from "phaser";
import type { CombatTarget, EffectTarget, Targetable } from "../core/combat/Contracts";
import {
  EffectSet,
  type ActiveEffect,
  type EffectHost,
  type EffectSource,
  type EffectSpec,
} from "../core/combat/StatusEffects";
import { BLEED } from "../core/combat/EffectKinds";
import { DEPTH, COMBAT_FEEDBACK, ENEMY_MOTION } from "../config/GameConfig";
import { UI, worldTextStyle } from "../core/theme";
// Type only — erased at compile time, so this adds no runtime import and no
// cycle with the Equipment/Progression pair.
import type { DamageType } from "../core/Equipment";
import { effectiveness, mitigate, type ArmorSpec, type Effectiveness } from "../core/Protection";
import { cuesFor, type ActionOutcome, type ActionResolution, type Execution } from "../core/CombatCues";
import {
  rollExecution,
  scaleDamage,
  type ExecutionLanded,
  type ExecutionRolled,
} from "../core/Proficiency";
import { physicalDamage, primaryType, totalAmount, type DamagePacket } from "../core/combat/DamagePacket";
import { playCues, type FlashTarget } from "../core/CombatFx";
import { effectsFor, lungeImpulse } from "../core/GameplayEffects";
import { applyImpulse } from "../core/CombatImpulse";
import { applyBody } from "../core/movement/BodySpec";
import { Locomotion, type SolverKind } from "../core/movement/Locomotion";
import { movementContextFor } from "../core/movement/MovementContext";
import { Stamina } from "../core/Stamina";
import type { CombatAction } from "../core/CombatAction";
import type { CombatBody } from "../core/CombatGeometry";
import { ySortedWorldFor } from "../core/YSortedWorld";

/**
 * Klucze rzędu znaczników stanu (`Enemy.statusMarks`).
 *
 * ⚠ **Ogłuszenie ma tu własny klucz, bo NIE jest efektem czasowym** — mieszka
 * w `stunnedUntil` i mówi CIAŁU, co ma robić (`src/entities/CLAUDE.md`).
 * Efekty z `EffectSet` biorą klucz ze SWOJEGO tagu (`BLEED.tag`), więc nowy
 * efekt nie dopisuje się tutaj.
 */
const MARK = { stun: "stun" } as const;

/** Enemy kinds — used to spawn the right class and respawn the same one. */
export type EnemyType =
  | "rabbit"
  | "boar"
  | "bear"
  | "fox"
  | "deer"
  | "wolf"
  | "greywolf"
  | "spider"
  | "venomspider"
  // Pierwsi humanoidalni wrogowie (`OI-171`) — jedna klasa `Bandit`, trzy konfigi.
  | "bandit_club"
  | "bandit_axe"
  | "bandit_chief"
  // A practice target, not a monster — see `TRAINING_DUMMY` in GameConfig.ts
  // and `TrainingDummy.ts` for why it's still an `Enemy` and not a second
  // system.
  | "training_dummy";

/**
 * The stat shape every enemy is driven by (RABBIT / BOAR / WOLF / GREY_WOLF /
 * SPIDER all satisfy it). Keeping the base Enemy config-driven means a new
 * creature is a config block + optional behaviour override, not a forked copy
 * of the AI.
 */
export interface EnemyConfig {
  /**
   * **Biegłość — jak czysto stworzenie ląduje SWÓJ atak, kiedy się na niego
   * zdecyduje.** Warstwa 2, `core/Proficiency.ts`. Wartości i pełne
   * uzasadnienie per gatunek: `docs/systemy/proficiency.md`
   *
   * ⚠ **Pole WYMAGANE i BEZ DERYWACJI.** Nie wyprowadza się go z HP, obrażeń,
   * poziomu ani groźności — to świadoma decyzja projektowa, po jednej liczbie
   * ręką na każde stworzenie.
   *
   * ⚠ **To NIE jest „combat level" ani miara groźności.** `EnemyConfig` ma już
   * cztery działające osie zagrożenia (`hp`+`armor`, `touchDamage*`+knockback,
   * `chaseSpeed`+`reach`+telegraf) i zwinięcie ich tutaj byłoby liczeniem tego
   * samego dwa razy. Niedźwiedź jest przykładem: 130 HP i najszerszy łuk w grze
   * przy `proficiency: 60`.
   */
  proficiency: number;
  /**
   * **Czy zobowiązujemy się, żeby to stworzenie było sensownym SPARINGIEM.**
   * `docs/systemy/proficiency.md`, wartości per gatunek — §16.
   *
   * ⚠ **Pole PROJEKTOWE, wymagane, bez derywacji** — ta sama klasa co
   * `proficiency`. ⛔ **Wykluczenie musi mieć powód w ROLI w lokacji, nigdy
   * w wygodzie liczbowej**: jeśli jedynym powodem wpisania `false` jest to, że
   * stworzenie nie przechodzi jakiegoś progu, to jest usterka wyceny.
   *
   * ⚠⚠ **`false` NIE ZNACZY „nie uczy nigdy" i NIE JEST bramką na praktykę.**
   * To jest najłatwiejsza pomyłka w tym polu i checkpoint mówi o niej wprost:
   * ile ktoś uczy, rozstrzyga WYŁĄCZNIE funkcja nauczyciela z `P` obu stron
   * (`Practice.teacher`) — sieciarz daje `×2,29` graczowi z `P = 0` i `×0,83`
   * temu z `P = 25`, bez żadnej flagi. Flaga mówi tylko, **czy trzymamy dla
   * niego margines R1/R2 przy kalibracji manekina** (§14b).
   *
   * ⛔ Gdyby kiedyś stała się bramką, znikłyby pierwsze punkty zdobywane
   * w walce: królik i sieciarz to jedyni przeciwnicy nowej postaci, a §16
   * zapisuje wprost, że królik uczy do `P = 25`.
   */
  teachingRole: boolean;
  hp: number;
  xpReward: number;
  touchDamageMin: number;
  touchDamageMax: number;
  touchDamageCooldown: number;
  /**
   * Damage type of this creature's CONTACT tick, or `null` for "deliberately
   * untyped" (rabbit, spider — see their config blocks for why).
   *
   * ⚠ **Required, not optional, and that is the whole point of the field.**
   * The type could have ridden on an optional parameter at the call site; it
   * does not, because this project has already shipped the failure that
   * produces: `Player.takeDamage(amount, damageType?)` accepted a type for two
   * whole steps while every single caller omitted it, so `ARMOR_PROFILE`'s
   * `metal` column did nothing at all and nobody noticed. A required field
   * makes the compiler ask a new creature's author for a decision, and `null`
   * makes "no type" something that was WRITTEN rather than forgotten.
   *
   * ⚠ For several creatures this contact tick is not a side channel — it is
   * the attack. The wolf's bite lands through it (its lunge has no hit test of
   * its own), and it is 54% of the boar's raw output and 29% of the Szary's.
   * Measured, not assumed; see the config blocks.
   */
  touchDamageType: DamageType | null;
  patrolSpeed: number;
  chaseSpeed: number;
  aggroRange: number;
  deAggroRange: number;
  patrolRadius: number;
  /** Seconds before a replacement returns. **Zero means it never comes back** —
   *  see GREY_WOLF, where that is the point. */
  respawnDelay: number;
  respawnJitter: number;
  respawnSafeRadius: number;
  scale: number;
  /**
   * Ślad stopy w rzucie z góry (px tekstury) — hurtbox, czyli GDZIE DA SIĘ
   * TRAFIĆ. Osobne od `bodyWidth`/`bodyHeight`, które opisują ciało FIZYCZNE
   * (czym stworzenie się rozpycha). Nie muszą być równe.
   *
   * ⚠ Pole WYMAGANE, nie opcjonalne, i to jest ta sama decyzja co przy
   * `touchDamageType`: opcjonalne sprawiłoby, że „nie zmierzyliśmy" i
   * „zapomnieliśmy" wyglądają w źródle identycznie. Nowe stworzenie ma dostać
   * od kompilatora pytanie o pomiar.
   */
  hurt: { length: number; depth: number };
  /**
   * Ciało FIZYCZNE, w pikselach KLATKI.
   *
   * ⚠ **Realny rozmiar to `bodyWidth × scale`** — Arcade mnoży przez skalę
   * duszka co klatkę. Dzik (22 × 2,1) ma naprawdę **46 px**, nie 22. Pełne
   * wyjaśnienie i historia pomyłki: `src/core/movement/BodySpec.ts`.
   */
  bodyWidth: number;
  bodyHeight: number;
  /**
   * Który solver ruchu prowadzi to stworzenie (`src/core/movement/`).
   * Brak = `"direct"`, czyli dzisiejszy ruch w linii prostej.
   *
   * ⚠ **Omijanie (`"steer"`) włącza się PER GATUNEK, nigdy globalnie.**
   * Stworzenie, które nagle obchodzi drzewa, czyta się inaczej niż to, które
   * w nie wchodzi — to jest zmiana odczucia walki, a nie poprawka techniczna.
   */
  solver?: SolverKind;
  /** Named foes only: printed over the HP bar. Ordinary creatures leave it unset. */
  displayName?: string;
  /** Elite presentation: wider bar that stays up for the whole fight. */
  elite?: boolean;
  /**
   * Override for `ENEMY_MOTION.breatheAmount`, the idle "breathe" pulse
   * `updateMotionFx` applies to every creature every frame. Absent = the
   * global default, which is every creature's behaviour today.
   *
   * ⚠ Added for `TRAINING_DUMMY`: a carved wooden post doesn't breathe, and
   * that's a presentation call, not a reason to touch the shared global
   * constant every living creature is tuned against. `0` here means "hold
   * still" — hit-pop and stretch/lean are untouched, they aren't breathe.
   */
  breatheAmount?: number;
  /**
   * This creature's natural protection, or absent for no protection at all
   * (which is the default and stays the default for most of the roster).
   *
   * ⚠ This is the READER that makes damage types mean anything. A damage type
   * with nothing on the other side of it is dead data (this project has shipped
   * that mistake twice: `pole_tileset` registered before any map painted it,
   * and `armorType` sitting unread on every piece of armour).
   *
   * ⚠ **Points and a type, NOT a percentage per damage type.** It was the
   * latter for exactly one iteration (CR-1) and was replaced before anything
   * used it, because the player's armour already ran points through
   * `d/(d+K)` — two shapes of the same idea would have meant implementing
   * quality, durability and every future modifier twice. See `core/Protection`.
   *
   * Deliberately minimal: no penetration, no vulnerability, no flat reduction
   * alongside the curve, no per-type durability.
   */
  armor?: ArmorSpec;
}

type AiState = "patrol" | "chase";

/**
 * Base enemy: wanders within a small radius around its spawn; chases the player
 * on aggro; deals contact damage on a cooldown; takes knockback and dies.
 *
 * Behaviour is driven entirely by an EnemyConfig, so the rabbit is just this
 * class with the RABBIT config. Subclasses (see Boar) override the protected
 * hooks — `updateChase` for what "chasing" means, `canDeaggro`/`onLoseAggro`
 * for committing to an attack — without touching the shared patrol/damage/death.
 *
 * NOTE: most sprites are still static face portraits (the boar, wolf, Szary
 * and spider are generated placeholders) — liveliness there is the procedural
 * "breathe" idle only, via `updateMotionFx`. The rabbit is the one exception:
 * it has a real directional sheet (idle down/up + walk/run), driven through
 * the `updateAnimation` hook below.
 */
/**
 * ⚠ **`implements Targetable` jest DEKLARACJĄ, nie zmianą zachowania.**
 * `Enemy` spełniał ten kontrakt strukturalnie od 2026-09-03 (`combatOrigin`,
 * `combatBody`, `isDead` oraz `x`/`y` sprite'a), ale nigdzie tego nie mówił —
 * więc zmiana nazwy któregokolwiek z tych pól zapalałaby się dopiero
 * w kilkunastu WYWOŁANIACH, zamiast tutaj. Kontrakt jest ten sam; różnica
 * jest w tym, GDZIE kompilator postawi błąd.
 *
 * ⚠ **`EffectTarget` + `EffectHost` doszły 2026-09-04 razem z Rozcięciem** —
 * czyli razem z PIERWSZYM efektem, który cokolwiek na wroga nakłada. To jest
 * dokładnie przypadek zapowiedziany w nagłówku `Contracts.ts`: *„Kiedy pojawi
 * się pierwszy taki przypadek (DoT na wrogu…), `Enemy` dopisze implementację,
 * a wołający **nie zmienią ani linijki**"* — i tak się stało, żadne z
 * dotychczasowych wywołań nie zostało tknięte.
 *
 * ⛔ **`AttackTarget` NADAL nie jest tu deklarowany** i to jest stan faktyczny,
 * nie luka: `Enemy.takeDamage` przyjmuje odrzut i zwraca „czy zabity", więc ma
 * inną sygnaturę z powodu, nie z zaniedbania (tabela w `Contracts.ts`).
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite implements Targetable, EffectTarget, EffectHost {
  readonly kind: EnemyType;
  protected readonly cfg: EnemyConfig;
  maxHp: number;
  hp: number;

  /**
   * Warstwa ruchu: zachowanie zgłasza tu INTENCJĘ (`seek`/`ring`/`flee`/
   * `impulse`/`hold`), a solver zamienia ją na prędkość ciała.
   *
   * ⚠ **Podklasa, która jeszcze nie zgłasza intencji, działa jak dawniej** —
   * `resolve()` milczy, gdy w tej klatce nikt nic nie zgłosił. Dzięki temu
   * siedem podklas migruje po jednej, a nie jednym wsadem.
   */
  protected readonly move: Locomotion;

  private homeX: number;
  private homeY: number;
  // NB: named `aiState` (not `state`) to avoid clashing with GameObject.state.
  private aiState: AiState = "patrol";
  private nextPatrolAt = 0;
  private patrolTarget: Phaser.Math.Vector2;
  private nextTouchDamageAt = 0;
  private dead = false;

  /** HP bar, hidden until this enemy has actually been hit. */
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  /** Name plate over the bar — elite/named foes only, null for everything else. */
  private nameLabel: Phaser.GameObjects.Text | null = null;
  /** Scene time at which the bar fades out again; 0 while hidden. Stays 0 for
   *  an elite, whose bar never retires mid-fight. */
  private hpBarHideAt = 0;
  /** Whether the bar is currently on screen. Tracked separately from
   *  `hpBarHideAt` because an elite's bar is visible with no expiry time, and
   *  it still has to be re-pinned over the sprite every frame. */
  private hpBarVisible = false;
  /** Sprite height at rest — the procedural breathe animates scaleY, so reading
   *  displayHeight would make the bar bob up and down. */
  private restHeight = 0;
  /**
   * The tint this enemy should be wearing when nothing transient is happening:
   * a telegraph, a wind-up, the Szary's enrage — or null for "no tint".
   *
   * It exists because the hit flash has to know what to put BACK. Subclasses
   * must change tints through `setBaseTint`, never `setTint`/`clearTint`
   * directly, or a single hit will erase the state they were signalling.
   */
  private baseTint: number | null = null;

  /**
   * Kogo mignąć przy trafieniu tego stworzenia i co przywrócić po błysku.
   *
   * ⚠ **Istnieje po to, żeby `baseTint` ZOSTAŁ prywatny (5B).** Błysk wroga
   * przeniósł się do `GameScene.damageMatchingEnemies`, bo dopiero tam znany
   * jest krytyk decydujący o dźwięku — ale gdyby scena musiała po drodze
   * czytać `baseTint`, telegrafy przestałyby być własnością encji.
   *
   * ⚠ **`restoreTint` MUSI być funkcją, nie wartością.** Rozwiązana na starcie
   * mignięcia przywraca telegraf nieaktualny: dzik trafiony pod koniec zamachu
   * wracał na pomarańczowo już PO starcie szarży, a fałszywy telegraf jest
   * gorszy niż żaden, bo gracz na niego reaguje. Patrz `src/entities/CLAUDE.md`.
   */
  get flashTarget(): FlashTarget {
    // `pop` odpada po stronie `cuesFor` — proceduralny ruch nadpisuje skalę
    // co klatkę, więc konkurencyjny tween leciałby na nic.
    return { sprite: this, restoreTint: () => this.baseTint };
  }
  /** Per-enemy offset into the breathe cycle, so a pack doesn't pulse in sync. */
  private motionPhase = 0;
  /** While now < this, the sprite carries the "just got hit" scale bump. */
  private hitPopUntil = 0;
  /** While now < this, the knockback impulse owns the body and the AI must not
   *  write velocity. Same ownership trick the boar's charge and the Szary's
   *  backstep already use — see takeDamage(). */
  private knockedBackUntil = 0;
  /**
   * Dokąd trwa OGŁUSZENIE: stworzenie nie rusza się i nie zaczyna akcji.
   *
   * ⚠ **Osobne pole od `knockedBackUntil`, i to jest decyzja, nie
   * nadmiarowość.** Oba zawieszają uchwyt AI, ale mówią o różnych rzeczach
   * i chcą od ciała czegoś innego:
   * - odrzut — ciało **ma jechać** impulsem, AI nie może go nadpisać;
   * - ogłuszenie — ciało **ma stać**, AI nie ma prawa go ruszyć.
   *
   * Zlanie ich przez `Math.max` (kuszące, bo obie bramki wyglądają tak samo)
   * daje ogłuszonego wroga, który dryfuje, albo odrzut zjedzony przez
   * ogłuszenie — a to na ekranie czyta się jak drgnięcie kamery, nie jak
   * usterka. Ten projekt ma już zapisane, ile kosztuje jedno pole niosące dwa
   * znaczenia (`ownsBody` vs `attackerRecoil`, `docs/systemy/presentation.md`).
   *
   * Priorytet jest w `updateAI` jawny: **impuls > ogłuszenie > AI.**
   */
  private stunnedUntil = 0;
  /**
   * **Znaczniki stanu nad głową — JEDEN rząd, klucz na stan.**
   *
   * ⚠ **Do 2026-09-04 było tu pojedyncze pole `stunMarker`** i dołożenie
   * Krwawienia jako drugiego takiego pola postawiłoby oba znaczniki
   * **dokładnie na sobie**: geometria liczyła się z jednego `offsetY`,
   * a ogłuszenie i rana **występują naraz** (Uderzenie tarczą i Rozcięcie
   * niczym się nie wykluczają). Stąd mapa i układanie w rząd — to jest cała
   * zmiana, nie „system statusów".
   *
   * ⛔ **To NIE jest źródło prawdy o stanie i nie wolno mu nim zostać.**
   * Ogłuszenie mieszka w `stunnedUntil`, Krwawienie w `EffectSet`; ta mapa
   * jest wyłącznie tym, co z nich WIDAĆ. Pytanie „czy krwawi" zadaje się
   * `this.effects`, nigdy temu polu.
   *
   * Znaczniki powstają leniwie (płaci tylko stworzenie, które faktycznie
   * jakiś dostało), potem już tylko pokazują się i chowają.
   */
  private readonly statusMarks = new Map<string, Phaser.GameObjects.Text | Phaser.GameObjects.Image>();
  /**
   * Orientacja kapsuły hurtboxa (radiany) — zwierzę jest „długie" wzdłuż tego,
   * w którą stronę idzie.
   *
   * Aktualizowana tylko przy realnym ruchu i ZAPAMIĘTYWANA na postoju: podczas
   * zamachu prędkość jest zerowa, a stworzenie wciąż jest zwrócone tam, gdzie
   * przed chwilą szło — czyli w gracza. Czytanie żywej prędkości obracałoby
   * hurtbox do losowej osi za każdym razem, gdy zwierzę stanie.
   */
  private axisRad = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    kind: EnemyType,
    cfg: EnemyConfig,
    textureKey: string,
    // Only the rabbit needs this: its texture is a multi-frame sheet, and
    // without an explicit frame Phaser's default is the whole sheet's raw
    // source size — which would poison `restHeight` and the body size below,
    // both computed from this.width/height ONCE, right here, before a
    // subclass gets a chance to call play() and correct the frame. Every
    // other enemy is a single-frame texture, where this has never mattered.
    initialFrame?: number,
  ) {
    super(scene, x, y, textureKey, initialFrame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Rendering architecture ETAP 1B — see `core/YSortedWorld.ts`. Covers
    // every subclass (Rabbit, Boar, Wolf, GreyWolf, Spider, VenomSpider,
    // Bear, TrainingDummy): none of them override the constructor's own
    // Y_SORTED_WORLD registration.
    ySortedWorldFor(scene)?.add(this);

    this.kind = kind;
    this.cfg = cfg;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;

    this.homeX = x;
    this.homeY = y;
    this.patrolTarget = new Phaser.Math.Vector2(x, y);

    this.setScale(cfg.scale);
    this.setCollideWorldBounds(true);
    this.setDepth(DEPTH.entities + y);
    // Tap/click-to-target. This class doesn't know what happens on the click
    // (that would mean importing GameScene, which owns the target state and
    // would close a cycle — see ProjectileHost for the same reasoning) —
    // GameScene attaches the actual handler right after creating each enemy,
    // in spawnEnemy(). Default hit area (the sprite's own frame bounds) is
    // used, same as every other clickable icon in this project.
    this.setInteractive({ useHandCursor: true });

    // ⚠ Ciało powstaje w JEDNYM miejscu w całej grze (`applyBody`) — reguła
    // wprowadzona po tym, jak `Critter` okazał się nie deklarować go wcale.
    // Liczby są w pikselach KLATKI; Arcade mnoży je przez skalę duszka.
    applyBody(this, { w: cfg.bodyWidth, h: cfg.bodyHeight, feetPadding: 2 });
    this.move = new Locomotion(this, cfg.solver ?? "direct");

    // Fade in, so a respawning enemy appears rather than popping into being.
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 260, ease: "Quad.easeOut" });

    // Captured before anything starts driving scaleY.
    this.restHeight = this.height * cfg.scale;
    this.createHpBar(scene);

    // Idle breathe, lean and squash/stretch are all driven per frame by
    // updateMotionFx() rather than by tweens — see ENEMY_MOTION for why.
    // Offset per enemy so a pack doesn't breathe in unison like a chorus line.
    this.motionPhase = Math.random() * Math.PI * 2;
  }

  /** Bar geometry for this enemy — elites get a bigger one. */
  private get barGeom(): { width: number; height: number; offsetY: number } {
    const b = COMBAT_FEEDBACK.enemyHpBar;
    return this.cfg.elite
      ? { width: b.eliteWidth, height: b.eliteHeight, offsetY: b.eliteOffsetY }
      : { width: b.width, height: b.height, offsetY: b.offsetY };
  }

  private createHpBar(scene: Phaser.Scene): void {
    const g = this.barGeom;
    this.hpBarBg = scene.add
      .rectangle(this.x, this.y, g.width, g.height, 0x000000, 0.6)
      .setOrigin(0.5)
      .setVisible(false);
    // Origin on the left edge so shrinking `width` drains it rightwards.
    this.hpBarFill = scene.add
      .rectangle(this.x, this.y, g.width - 2, g.height - 2, 0x33dd55, 1)
      .setOrigin(0, 0.5)
      .setVisible(false);

    // A named foe has to be legible as one BEFORE the fight is over, or the
    // player kills the story's antagonist without ever learning it was him.
    if (this.cfg.displayName) {
      this.nameLabel = scene.add
        .text(
          this.x,
          this.y,
          this.cfg.displayName,
          worldTextStyle({ fontSize: "11px", color: UI.gold, stroke: "#000000", strokeThickness: 4 }),
        )
        .setOrigin(0.5, 1)
        .setVisible(false);
    }

    // These three ride `this.y` every frame the bar is up (`refreshHpBar`),
    // same reasoning as the enemy sprite itself — see `core/YSortedWorld.ts`.
    const layer = ySortedWorldFor(scene);
    if (layer) {
      layer.add(this.hpBarBg);
      layer.add(this.hpBarFill);
      if (this.nameLabel) layer.add(this.nameLabel);
    }
  }

  /** Reveal the bar (or extend how long it stays) and redraw it. */
  private showHpBar(nowMs: number): void {
    // An elite's bar is pinned up for the whole fight (hideAt stays 0): a boss
    // bar that fades while you are still circling the boss reads as the fight
    // being over. Everything else keeps the fade — see COMBAT_FEEDBACK.
    this.hpBarHideAt = this.cfg.elite ? 0 : nowMs + COMBAT_FEEDBACK.enemyHpBar.visibleMs;
    this.hpBarVisible = true;
    this.hpBarBg.setVisible(true);
    this.hpBarFill.setVisible(true);
    this.nameLabel?.setVisible(true);
    this.refreshHpBar();
  }

  private hideHpBar(): void {
    this.hpBarHideAt = 0;
    this.hpBarVisible = false;
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
    this.nameLabel?.setVisible(false);
  }

  /** Keep the bar pinned over the sprite and matching current HP. */
  private refreshHpBar(): void {
    const g = this.barGeom;
    const inner = g.width - 2;
    const top = this.y - this.restHeight / 2 - g.offsetY;

    this.hpBarBg.setPosition(this.x, top);
    this.hpBarFill.setPosition(this.x - inner / 2, top);

    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    this.hpBarFill.width = inner * ratio;
    // Same green → yellow → red reading as the player's own bar, so the colour
    // means the same thing wherever it appears.
    this.hpBarFill.setFillStyle(ratio > 0.5 ? 0x33dd55 : ratio > 0.25 ? 0xddcc33 : 0xdd3333, 1);

    // Just above this enemy in the entity band, below anything overhead.
    const depth = DEPTH.entities + this.y + 5;
    this.hpBarBg.setDepth(depth);
    this.hpBarFill.setDepth(depth + 1);
    if (this.nameLabel) {
      this.nameLabel
        .setPosition(this.x, top - g.height / 2 - COMBAT_FEEDBACK.enemyHpBar.eliteLabelGap)
        .setDepth(depth + 2);
    }
  }

  get isDead(): boolean {
    return this.dead;
  }

  /** XP granted to the player for killing this enemy. */
  get xpReward(): number {
    return this.cfg.xpReward;
  }

  /** Biegłość tego stworzenia — wejście funkcji nauczyciela (§21). */
  get proficiency(): number {
    return this.cfg.proficiency;
  }

  /** Patrz `EnemyConfig.teachingRole` — **deklaracja projektowa, nie bramka.** */
  get teachingRole(): boolean {
    return this.cfg.teachingRole;
  }

  /**
   * Ile ciosów gracza, które NIOSŁY PRAKTYKĘ, ten egzemplarz już przyjął.
   *
   * ⚠ **Licznik `n` z modelu `c·√n`** (§20) — mieszka na EGZEMPLARZU, bo to on
   * jest „tym przeciwnikiem". Respawn tworzy zawsze **nową instancję `Enemy`**,
   * więc zeruje się sam i **nie potrzebuje ani timeoutu, ani pojęcia „koniec
   * walki"** — drugi mechanizm na to samo byłby długiem, nie funkcją.
   */
  private practiceHits = 0;

  /**
   * Zwiększ i zwróć numer kolejnego ciosu niosącego praktykę (`k ≥ 1`).
   *
   * ⚠ **Wołane WYŁĄCZNIE wtedy, gdy praktyka naprawdę zostanie przyznana** —
   * fuszerka i pudło nie mogą zużywać `k`, bo malejący przyrost karałby wtedy
   * za nietrafione zamachy zamiast za powtarzanie tego samego sparingu.
   */
  nextPracticeHit(): number {
    this.practiceHits += 1;
    return this.practiceHits;
  }

  /** The spawn point this enemy patrols around — where its replacement returns. */
  get home(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.homeX, this.homeY);
  }

  /** Per-frame AI update. */
  updateAI(player: CombatTarget, nowMs: number): void {
    if (this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    // ⚠ MUST run before anything below reads `body.width/height` (Locomotion,
    // PathFollower). Arcade recomputes both from the sprite's CURRENT scale
    // every physics step (`Body.updateBounds`, confirmed in Phaser's own
    // source) — and `updateMotionFx` below changes that scale every frame for
    // purely cosmetic squash/stretch/breathe/pop. Left alone, the gameplay
    // body silently inherits that cosmetic jitter as its collision size.
    // `body.setSize()` can't fix this — it multiplies by the body's own
    // (already stale) cached scale, so it would just re-bake in whatever
    // stretch is currently live. Writing the world-space numbers directly is
    // the only way to make them independent of scale.
    this.restoreBodySize(body);
    // ⚠ **Dystans agro liczy się między ŚRODKAMI CIAŁ (2026-09-07), nie duszków.**
    // `aggroRange`/`deAggroRange` są nietknięte — zmienia się wyłącznie punkt,
    // od którego się je mierzy, i to na ten sam, którym mierzy walka
    // (`combatOrigin`). Do tej daty ciało gracza leżało 19 px pod jego duszkiem,
    // więc próg agro był o te 19 px inny w zależności od tego, czy gracz
    // podchodził od góry, czy od dołu. Patrz `core/movement/MoveSolver.ts`.
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const dist = Phaser.Math.Distance.Between(me.x, me.y, you.x, you.y);

    // State transitions. A subclass mid-attack can veto the de-aggro via
    // canDeaggro() so it doesn't break off a committed lunge.
    if (this.aiState === "patrol" && !player.isDead && dist <= this.cfg.aggroRange) {
      this.enterChase();
    } else if (
      this.aiState === "chase" &&
      (player.isDead ||
        (dist > this.cfg.deAggroRange && this.canDeaggro()) ||
        // ⚠⚠ **BRAK DROGI do celu kończy pościg tak samo jak zbyt duży dystans**
        //   (2026-09-05, po playteście: dzik dobijał się do gęstwiny bez końca).
        //   Odpowiedź pochodzi z `findPath` (A* nad `NavGrid`), czyli z warstwy,
        //   którą `Locomotion` i tak liczy dla każdego `seek` — do tej daty jej
        //   wynik był wyrzucany, a stworzenie zostawało z surowym „idź na
        //   gracza" i kręciło się lokalnie w nieskończoność.
        //   ⛔ To NIE jest timeout ani licznik prób. To pytanie „czy w ogóle
        //     jest którędy" — i tylko ono.
        //   ⚠ Ta sama bramka `canDeaggro()` co wyżej: stworzenie w trakcie
        //     zobowiązanej akcji nie przerywa jej przez brak trasy.
        (this.move.targetUnreachable && this.canDeaggro()))
    ) {
      this.aiState = "patrol";
      this.nextPatrolAt = 0; // pick a fresh wander target immediately
      this.onLoseAggro();
    }

    // Being knocked back suspends the AI's grip on the body — but nothing
    // else: depth, the HP bar and the motion FX below all keep running, so a
    // shoved enemy still reads as alive rather than as a frozen sprite.
    //
    // ⚠ **TRZY STANY, JAWNY PRIORYTET: impuls > ogłuszenie > AI.** Kolejność
    // nie jest kosmetyczna. Odrzut i ogłuszenie chcą od ciała czegoś
    // przeciwnego — pierwszy żeby JECHAŁO, drugie żeby STAŁO — więc wróg
    // ogłuszony w locie odrzutu musi najpierw dolecieć. Odwrotna kolejność
    // (albo `Math.max` na jednym polu) kasowałaby odrzut, czyli tożsamość
    // rodziny obuchowej. Patrz `stunnedUntil`.
    if (nowMs < this.knockedBackUntil) {
      // Impuls jest właścicielem ciała — nie ma tu nic do zrobienia.
    } else if (nowMs < this.stunnedUntil) {
      // ⚠ Prędkość zerowana CO KLATKĘ, nie raz w `stun()`: kolizja z innym
      // stworzeniem potrafi rozepchnąć ciało (jest collider `enemies ×
      // enemies`), a ogłuszony ma stać, nie sunąć.
      body.setVelocity(0, 0);
    } else {
      // Klatka, w której ogłuszenie mija — zdejmij oznaczenie dokładnie raz.
      if (this.stunnedUntil > 0) this.clearStunVisual();
      // Intencja ruchu żyje JEDNĄ klatkę: bez tego stworzenie, które w tej
      // klatce niczego nie zgłosiło, jechałoby dalej wektorem z poprzedniej.
      this.move.beginFrame();
      if (this.aiState === "chase") {
        this.updateChase(player, nowMs);
      } else {
        this.patrol(nowMs);
      }
      // Intencja → prędkość. Milczy, gdy zachowanie nic nie zgłosiło (podklasa
      // jeszcze niezmigrowana pisze prędkość wprost i ta linia jej nie dotyka).
      this.move.resolve();
      // Deliberately INSIDE the knockback guard: postMove shapes the velocity
      // the AI just wrote, and while an impulse owns the body there is no AI
      // velocity to shape.
      this.postMove(nowMs);
    }

    this.setDepth(DEPTH.entities + this.y);
    // Oś hurtboxa jedzie z ruchem — patrz `axisRad`. Próg 2 px/s to ten sam
    // `STOP_SPEED`, którym podklasy odróżniają „stoi" od „idzie".
    if (Math.hypot(body.velocity.x, body.velocity.y) > 2) {
      this.axisRad = Math.atan2(body.velocity.y, body.velocity.x);
    }
    this.updateMotionFx(nowMs);
    this.updateAnimation(body.velocity.x, body.velocity.y);

    // The bar rides along with the enemy while it's up, and retires itself
    // (unless it's an elite's, which has no expiry — hpBarHideAt stays 0).
    if (this.hpBarVisible) {
      if (this.hpBarHideAt > 0 && nowMs >= this.hpBarHideAt) this.hideHpBar();
      else this.refreshHpBar();
    }
    // Tylko gdy jest co przypinać — znaczniki istnieją u stworzenia, które
    // kiedykolwiek jakiś dostało, a nie tylko u oznaczonego teraz. Sam
    // `refreshStatusMarks` wychodzi po pustym rzędzie (patrz tam).
    if (this.statusMarks.size > 0) this.refreshStatusMarks();
  }

  /**
   * Force this enemy into the chase state from outside — a packmate's howl.
   * Public because aggro is a thing one creature can do TO another; the
   * transition still runs through the same hook as spotting the player itself,
   * so a subclass can't end up in "chasing" without its own state prepared.
   */
  aggro(): void {
    if (this.dead) return;
    this.enterChase();
  }

  /**
   * True while this creature is actively coming for the player, rather than
   * wandering its patrol.
   *
   * The read-only counterpart to `aggro()`: that one tells a creature to start
   * chasing, this one asks whether it already is. GameScene uses it to pick
   * the next target when the current one dies — "whoever is still fighting
   * me", which is why it must NOT be a distance test. A rabbit peacefully
   * grazing two tiles away is nearer than the wolf mid-lunge, and auto-focusing
   * the rabbit would start a fight the player never picked.
   */
  get isChasing(): boolean {
    return !this.dead && this.aiState === "chase";
  }

  /** One door into the chase state, so `onGainAggro` can't be skipped by a
   *  caller that sets the field directly. */
  private enterChase(): void {
    if (this.aiState === "chase") return;
    this.aiState = "chase";
    this.onGainAggro();
  }

  /**
   * Cancel whatever this enemy was winding up — the blunt category's payoff.
   *
   * Base enemies have nothing to interrupt, so this is a no-op; the ones with
   * committed attack phases (boar charge, Szary bite, spider spit, wolf lunge)
   * override it and drop back to a neutral state. It exists on the base class
   * so `GameScene` can call it on anything it hits without type checks.
   */
  interrupt(): void {}

  /**
   * Zachwianie: zawiesza uchwyt AI na ciele na `ms` milisekund, **bez
   * impulsu**. Oś rodziny obuchowej (`WEAPON_FAMILY.blunt`).
   *
   * ⚠ **To NIE jest `interrupt()` i nie wolno tego zlać.** Przerwanie kasuje
   * przeciwnikowi rozpoczęty ZAMACH i jest własnością konkretnych broni (dziś
   * młot). Zachwianie rusza wyłącznie ruch — fazy ataku nadpisują je same,
   * dokładnie tak, jak od zawsze nadpisują odrzut.
   *
   * ⚠ **Zero nowego stanu.** Przedłuża to samo `knockedBackUntil`, którym od
   * dawna rządzi odrzut, i jest czytane przez tę samą jedną bramkę w
   * `update()`. `Math.max` jest konieczny: młot ma oba naraz (odrzut 180 ms +
   * zachwianie 50 ms) i krótsze nie może skracać dłuższego.
   */
  stagger(ms: number): void {
    if (ms <= 0 || this.isDead) return;
    this.knockedBackUntil = Math.max(this.knockedBackUntil, this.scene.time.now + ms);
  }

  /**
   * **Ogłuszenie: przez `ms` ani się nie ruszasz, ani nie zaczynasz akcji.**
   *
   * Trzecie pojęcie obok `interrupt()` i `stagger()`, i **żadne z tamtych go
   * nie zastępuje**: przerwanie kasuje jeden zamach, zachwianie rusza tylko
   * ruch. Dopiero to odbiera **prawo do akcji**.
   *
   * ⚠ **KASUJE trwającą akcję, nie zawiesza jej** — przez `onStunned()`.
   * Powód jest zmierzony i mieszka w `ActionRunner.cancel`: terminy runnera są
   * bezwzględne, a `tick()` nie jest wołane, dopóki AI stoi, więc samo
   * zawieszenie sprawia, że stworzenie wykonuje zaległą akcję **w klatce, w
   * której ogłuszenie mija**. Dzik bodzie wtedy bez telegrafu.
   *
   * ⚠ **`Math.max`, ta sama reguła co przy `stagger`**: krótsze ogłuszenie nie
   * może skrócić dłuższego.
   *
   * ⚠ **Tu wejdzie kiedyś DR i odporność** — i dlatego długość jest
   * PARAMETREM, a nie polem akcji. Skalowanie po kolejnych ogłuszeniach albo
   * odmowa u bossa mieszczą się w całości wewnątrz tej metody, **bez zmiany
   * ani jednego wołającego**. Dziś takiego mechanizmu świadomie nie ma
   * (`docs/systemy/abilities.md`) — dokładanie go „na zapas" byłoby martwym
   * slotem.
   */
  stun(ms: number): void {
    if (ms <= 0 || this.isDead) return;
    // Najpierw skasuj to, co robi — dopiero potem zabroń mu robić cokolwiek.
    this.onStunned();
    this.stunnedUntil = Math.max(this.stunnedUntil, this.scene.time.now + ms);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    // `setBaseTint`, nigdy `setTint` — inaczej pierwszy cios w ogłuszonego
    // skasowałby oznaczenie, czyli dokładnie wtedy, gdy jest potrzebne.
    this.setBaseTint(COMBAT_FEEDBACK.stun.tint);
    this.showGlyphMark(MARK.stun, COMBAT_FEEDBACK.stun.glyph, COMBAT_FEEDBACK.stun.color);
  }

  /** Czy stworzenie jest właśnie ogłuszone. Podklasy pytają, zanim uznają, że
   *  ich własne liczniki faz cokolwiek prowadzą. */
  protected get isStunned(): boolean {
    return this.scene.time.now < this.stunnedUntil;
  }

  /**
   * Hook: skasuj to, co stworzenie właśnie robi. Na bazie no-op — podklasy
   * z `ActionRunner`em wołają `cancel()`.
   *
   * ⚠ **Hook, a nie `if` po typie w `stun()`** — dokładnie wzorzec
   * `interrupt()`. Baza nie ma runnera i nie może go dostać przy okazji:
   * przeniesienie `ActionRunner` na `Enemy` jest osobnym refaktorem
   * (`docs/systemy/abilities.md` D-6), a nie doklejką do umiejętności.
   */
  protected onStunned(): void {}

  /**
   * Hook: przywróć tint, który wynika z TWOJEGO stanu. Baza nie ma żadnego
   * stanu do pokazania, więc gasi.
   *
   * ⚠ **Istnieje, bo zdjęcie ogłuszenia inaczej GASIŁO PRAWDZIWY telegraf.**
   * Szary w szale nosi własny tint; gdyby `clearStunVisual` po prostu
   * wołało `setBaseTint(null)`, ogłuszenie kasowałoby oznaczenie szału na
   * stałe. Ten projekt ma zapisane, że **fałszywy telegraf jest gorszy niż
   * żaden** (`restoreTint` jako getter) — utrata prawdziwego jest tym samym
   * błędem od drugiej strony.
   *
   * ⚠ **Nie da się tego zastąpić zapamiętaniem tintu sprzed ogłuszenia**:
   * stan może się zmienić W TRAKCIE (Szary wpada w szał od ciosów, które
   * dostaje właśnie dlatego, że jest ogłuszony), więc odtworzenie zapisanej
   * wartości przywracałoby tint już nieaktualny. Podklasa musi zostać
   * zapytana, a nie odtworzona.
   */
  protected restoreStateTint(): void {
    this.setBaseTint(null);
  }

  /** Zdejmij ogłuszenie: tint i znacznik. Wołane z `updateAI` w klatce, w
   *  której okno mija, oraz przy śmierci. */
  private clearStunVisual(): void {
    this.stunnedUntil = 0;
    // Tylko jeśli na wierzchu wciąż jest tint OGŁUSZENIA — telegraf zapalony
    // w międzyczasie ma zostać.
    if (this.baseTint === COMBAT_FEEDBACK.stun.tint) this.restoreStateTint();
    this.hideStatusMark(MARK.stun);
  }

  /* ── RZĄD ZNACZNIKÓW STANU ─────────────────────────────────────────────
     Trzy metody na wszystko, co wisi nad głową. Ogłuszenie wchodzi tu glifem
     (`COMBAT_FEEDBACK.stun` jest placeholderem do czasu grafiki), Krwawienie
     ikoną swojej umiejętności — patrz `onEffectsChanged`. */

  /** Pokaż znacznik-GLIF pod tym kluczem (placeholder do czasu grafiki). */
  private showGlyphMark(key: string, glyph: string, color: string): void {
    let mark = this.statusMarks.get(key);
    if (!mark) {
      mark = this.scene.add
        .text(this.x, this.y, glyph, worldTextStyle({ fontSize: "12px", color, stroke: "#000000", strokeThickness: 4 }))
        .setOrigin(0.5, 1);
      this.registerMark(key, mark);
    }
    mark.setVisible(true);
  }

  /**
   * Pokaż znacznik-IKONĘ pod tym kluczem.
   *
   * ⚠ **Tekstura jest PARAMETREM, a nie stałą tej klasy** — Krwawienie wozi
   * swój `iconKey` w `EffectSpec` (dokłada go tłumacz z `action.id`, patrz
   * `SwingBleed` w `GameScene`). Wpisanie tu `ability-icon-rend` na sztywno
   * byłoby tożsamością umiejętności w warstwie ogólnej: druga zdolność
   * z raną dostałaby cudzą ikonę i nikt by tego nie zauważył.
   */
  private showIconMark(key: string, texture: string): void {
    const istniejacy = this.statusMarks.get(key);
    if (istniejacy instanceof Phaser.GameObjects.Image) {
      // Ten sam slot, inne źródło rany — podmień teksturę zamiast mnożyć obiekty.
      if (istniejacy.texture.key !== texture) istniejacy.setTexture(texture);
      istniejacy.setVisible(true);
      return;
    }
    const px = COMBAT_FEEDBACK.statusMarks.iconPx;
    const mark = this.scene.add.image(this.x, this.y, texture).setOrigin(0.5, 1).setDisplaySize(px, px);
    this.registerMark(key, mark);
    mark.setVisible(true);
  }

  /** Schowaj — bez niszczenia. Ten sam stan potrafi wrócić za sekundę. */
  private hideStatusMark(key: string): void {
    this.statusMarks.get(key)?.setVisible(false);
  }

  /** Wspólne dla obu rodzajów: rejestracja świeżo powołanego znacznika. */
  private registerMark(key: string, mark: Phaser.GameObjects.Text | Phaser.GameObjects.Image): void {
    // Powstaje leniwie (płaci tylko stworzenie, które faktycznie jakiś
    // dostało), więc melduje się w Y_SORTED_WORLD tutaj, a nie w
    // konstruktorze — patrz `setDepth` co klatkę w `refreshStatusMarks`.
    ySortedWorldFor(this.scene)?.add(mark);
    this.statusMarks.set(key, mark);
  }

  /**
   * Przypnij rząd nad sprite'em. Wołane tylko, gdy mapa jest niepusta — patrz
   * reguła o koszcie klatki w `src/ui/CLAUDE.md`.
   *
   * ⚠ **Bez ani jednej tablicy pośredniej** — dwa przebiegi po mapie zamiast
   * `filter().map()`. Ta pętla chodzi co klatkę dla każdego stworzenia, które
   * kiedykolwiek coś nosiło, a rząd ma dziś co najwyżej dwie pozycje.
   */
  private refreshStatusMarks(): void {
    const s = COMBAT_FEEDBACK.statusMarks;
    let szerokosc = 0;
    let ile = 0;
    for (const mark of this.statusMarks.values()) {
      if (!mark.visible) continue;
      szerokosc += mark.displayWidth;
      ile++;
    }
    if (ile === 0) return;
    szerokosc += s.gapPx * (ile - 1);

    const g = this.barGeom;
    const top = this.y - this.restHeight / 2 - g.offsetY - s.offsetY;
    const depth = DEPTH.entities + this.y + 8;
    let x = this.x - szerokosc / 2;
    for (const mark of this.statusMarks.values()) {
      if (!mark.visible) continue;
      mark.setPosition(x + mark.displayWidth / 2, top);
      mark.setDepth(depth);
      x += mark.displayWidth + s.gapPx;
    }
  }

  /** True while the knockback impulse still owns this body. Subclasses check it
   *  before assuming their own phase timers are driving movement. */
  protected get isKnockedBack(): boolean {
    return this.scene.time.now < this.knockedBackUntil;
  }

  /** Hook fired the moment this enemy picks up the chase — from spotting the
   *  player, being struck, or being called in. The wolf howls here. */
  protected onGainAggro(): void {}

  /**
   * Set (or clear, with null) the tint that represents this enemy's STATE.
   *
   * Subclasses must use this instead of `setTint`/`clearTint`: the hit flash
   * restores whatever is stored here when it ends, so a telegraph survives
   * being hit. Going straight to `setTint` works until the first sword blow,
   * then silently disappears — which is the worst possible failure mode for a
   * signal the player is supposed to react to.
   */
  protected setBaseTint(color: number | null): void {
    this.baseTint = color;
    if (color === null) this.clearTint();
    else this.setTint(color);
  }

  /**
   * Pin the gameplay body back to its declared, constant world-space size —
   * see the call site in `updateAI()` for why this has to happen every frame.
   *
   * ⚠ Deliberately writes `width`/`height`/`halfWidth`/`halfHeight` + re-runs
   * `updateCenter()` directly, NOT `body.setSize()`: `setSize()` computes
   * `width = sourceWidth × body's cached scale`, and that cached scale is
   * exactly the thing `updateMotionFx` just perturbed — so `setSize()` would
   * still bake the cosmetic stretch back in.
   *
   * ⚠ Does NOT touch `body.offset`. Offset is what keeps the body
   * foot-anchored (`applyBody`, `src/entities/CLAUDE.md`) and nothing about
   * squash/stretch should move it — this only ever corrects size.
   *
   * ⚠ Phaser's own `Body.js` assigns `width`/`height` directly (see
   * `updateBounds`/`setSize` in its source) — its public `.d.ts` marks them
   * `readonly` anyway, so the cast below matches what the engine itself does,
   * not a way around it.
   */
  private restoreBodySize(body: Phaser.Physics.Arcade.Body): void {
    const w = this.cfg.bodyWidth * this.cfg.scale;
    const h = this.cfg.bodyHeight * this.cfg.scale;
    const mutable = body as unknown as {
      width: number;
      height: number;
      halfWidth: number;
      halfHeight: number;
    };
    mutable.width = w;
    mutable.height = h;
    mutable.halfWidth = Math.floor(w / 2);
    mutable.halfHeight = Math.floor(h / 2);
    body.updateCenter();
  }

  /**
   * Fake animation from the physics body's own velocity: lean into travel,
   * stretch along it, squash across it, breathe when still, pop when hit.
   *
   * All of it is summed into a SINGLE scale/angle assignment per frame. That is
   * the whole point — these effects previously wanted to be four separate
   * tweens on the same two properties, which no amount of tuning can make
   * behave. See ENEMY_MOTION.
   *
   * ⚠ Purely cosmetic — `sprite.setScale()` here no longer feeds the physics
   * body (see `restoreBodySize`, called at the top of `updateAI()` each
   * frame). Squash/stretch/breathe/pop stay exactly as they were on screen;
   * only their old, unintended leak into `body.width/height` is gone.
   */
  private updateMotionFx(nowMs: number): void {
    const m = ENEMY_MOTION;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = Math.hypot(vx, vy);
    // Normalised against this creature's own top speed, so "flat out" means
    // something different for a boar than for a wolf. A charge or lunge runs
    // several times chase speed and is allowed to exceed 1, up to maxDrive.
    const drive = Phaser.Math.Clamp(speed / this.cfg.chaseSpeed, 0, m.maxDrive);

    // Breathe belongs to standing still; it fades out as the creature moves.
    // `cfg.breatheAmount` overrides the global amplitude per-creature — see
    // its doc comment on `EnemyConfig` (added for `TRAINING_DUMMY`, which
    // has no reason to breathe).
    const breathe =
      Math.sin(this.motionPhase + (nowMs / m.breatheMs) * Math.PI * 2) *
      (this.cfg.breatheAmount ?? m.breatheAmount) *
      (1 - Math.min(drive, 1));
    const stretch = drive * m.stretch;
    const pop = nowMs < this.hitPopUntil ? m.hitPop : 0;
    // Stretch goes along the dominant axis of travel — stretching X while
    // running vertically would read as sliding, which is the thing this exists
    // to fix.
    const horizontal = Math.abs(vx) >= Math.abs(vy);
    const alongX = horizontal ? stretch : -stretch * 0.5;
    const alongY = horizontal ? -stretch * 0.5 : stretch;

    const s = this.cfg.scale;
    this.setScale(s * (1 + alongX + pop - breathe), s * (1 + alongY + pop + breathe));
    // Lean is horizontal-only: at this sprite size a full 2D tilt is unreadable
    // and mostly looks like the creature is falling over.
    this.setAngle(Phaser.Math.Clamp(vx / this.cfg.chaseSpeed, -1, 1) * m.leanDeg);
  }

  /**
   * What "chasing" does. Default: walk straight at the player. Overridden by
   * enemies with a fancier approach (the boar's telegraph → charge → recover).
   */
  protected updateChase(player: CombatTarget, _nowMs: number): void {
    // ⚠ Cel podaje się jako `combatOrigin`, nigdy jako `player.x/.y` — warstwa
    // ruchu mierzy od 2026-09-07 w przestrzeni CIAŁ (`core/movement/MoveSolver.ts`).
    const you = player.combatOrigin;
    this.move.seek(you.x, you.y, this.cfg.chaseSpeed);
    // ⚠ Lustro zostaje na duszku i to jest poprawne: `applyBody` centruje ciało
    // w poziomie, więc przesunięcie duszek→ciało jest pionowe z dokładnością do
    // ułamka piksela (0,00–0,40 px na rosterze — patrz `MoveSolver`), a to nie
    // ma jak przewrócić pytania „w lewo czy w prawo".
    this.setFlipX(player.x < this.x);
  }

  /** May the enemy give up the chase right now? Subclasses committed to an
   *  attack return false so a lunge is never cut short. */
  protected canDeaggro(): boolean {
    return true;
  }

  /**
   * Czy to stworzenie rani przez NAKŁADANIE CIAŁ.
   *
   * ⚠ **Getter, a nie zwykłe nadpisanie `tryTouchDamage`** — i to jest wymuszone
   * dziedziczeniem: `GreyWolf extends Wolf`. Gdyby wilk wyciszał kontakt
   * nadpisując metodę na no-op, Szary straciłby go razem z nim, a u niego to
   * **29% wyjścia w zwarciu** (patrz `src/entities/CLAUDE.md`, cztery kanały).
   * Z getterem każda podklasa odpowiada za siebie i odpowiedź jest widoczna w
   * jednej linijce.
   *
   * ⚠ Wyłączenie ma sens **wyłącznie wtedy, gdy stworzenie dostało własny test
   * zasięgu.** Samo zdjęcie kontaktu robi z wroga manekina — kontakt bywa
   * jedynym kanałem, jaki ma (tak było u królika i tak jest dziś u
   * niedźwiedzia).
   */
  protected get contactDamageEnabled(): boolean {
    return true;
  }

  /** Hook fired when the enemy drops back to patrol — reset any attack state. */
  protected onLoseAggro(): void {}

  /**
   * Hook for a subclass with a real directional sheet to pick and play its
   * animation from the body's current velocity. Default no-op — every
   * texture-only enemy (Szary, spider) relies on `updateMotionFx` alone,
   * exactly as before. Rabbit, Boar and the base Wolf override this today.
   */
  protected updateAnimation(_vx: number, _vy: number): void {}

  /**
   * Hook fired immediately after `patrol`/`updateChase` has written this
   * frame's velocity — a chance to SHAPE that velocity without reimplementing
   * either of them.
   *
   * It exists because `patrol` is private and deliberately stays that way: the
   * rabbit's hop gate has to apply to wandering AND chasing alike, and the
   * alternative was either exposing the wander logic for a subclass to copy, or
   * gating the velocity inside `updateAnimation` — which runs after
   * `updateMotionFx`, so the lean/stretch would still be computed from the
   * ungated glide it was meant to replace.
   *
   * Default no-op; Rabbit is the only override today.
   */
  protected postMove(_nowMs: number): void {}

  /**
   * One-shot hook: a hit landed. Default no-op — most enemies still only
   * get `flashHit`'s tint. A subclass with a real sheet plays its "hurt"
   * clip here; see Wolf.onHurt (currently the only override — kept generic
   * on the base class so the next creature with a sheet gets it for free).
   */
  protected onHurt(): void {}

  /**
   * One-shot hook: this enemy just died, fired at the very start of `die()`
   * — before the fade/shrink tween starts, so a "collapse" clip plays
   * UNDER that fade rather than after it. Default no-op; see Wolf.onDeathVisual.
   */
  protected onDeathVisual(): void {}

  // ⚠ Nie bierze już ciała: od wprowadzenia warstwy ruchu patrol ZGŁASZA
  // intencję, a prędkość wpisuje `Locomotion`. Nic tu nie ma prawa dotknąć
  // `body.setVelocity` — inaczej solver dostawałby wektor do nadpisania.
  private patrol(nowMs: number): void {
    // ── ⚠ PATROL W PRZESTRZENI CIAŁ — i to jest ZMIANA ZEROWA ──────────────
    // Od 2026-09-07 intencje ruchu przyjmują współrzędne `body.center`, więc
    // `patrolTarget` musi być w tej samej przestrzeni co reszta warstwy.
    //
    // ⚠ **`homeX/homeY` ZOSTAJE w przestrzeni duszka i nie wolno tego zmieniać**
    // — to jest punkt SPAWNU, z którego `GameScene` odtwarza wroga (`get home`).
    // Podnosimy więc kotwicę na miejscu, o własny offset ciała.
    //
    // ⚠ **Dowód, że to nie rusza rozgrywki:** duszek i ciało są sztywno związane
    // stałym przesunięciem pionowym, więc podniesienie OBU stron każdego
    // porównania o tę samą wartość daje ten sam dysk pozycji, ten sam próg
    // dojścia i ten sam tor. Zmienia się wyłącznie to, którym punktem
    // stworzenia opisujemy jego pozycję.
    const o = this.combatOrigin;
    const reached =
      Phaser.Math.Distance.Between(o.x, o.y, this.patrolTarget.x, this.patrolTarget.y) < 6;

    if (nowMs >= this.nextPatrolAt || reached) {
      // Sometimes idle, sometimes pick a new spot within the patrol radius.
      if (Math.random() < 0.35) {
        this.move.hold();
        this.nextPatrolAt = nowMs + Phaser.Math.Between(600, 1600);
        this.patrolTarget.set(o.x, o.y);
        return;
      }
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.cfg.patrolRadius;
      this.patrolTarget.set(
        this.homeX + Math.cos(angle) * r,
        this.homeY + Math.sin(angle) * r + this.move.bodyOffsetY,
      );
      this.nextPatrolAt = nowMs + Phaser.Math.Between(1200, 2600);
    }

    this.move.seek(this.patrolTarget.x, this.patrolTarget.y, this.cfg.patrolSpeed);
    this.setFlipX(this.patrolTarget.x < this.x);
  }

  /**
   * Called while overlapping the player. Applies contact damage on cooldown.
   *
   * The damage TYPE comes from this creature's config, never from a literal
   * here — same rule the player's side follows, where the type rides on the
   * attack variant in `ITEMS` rather than on the code that swings it.
   */
  tryTouchDamage(player: CombatTarget, nowMs: number): void {
    if (this.dead || player.isDead) return;
    if (!this.contactDamageEnabled) return;
    if (nowMs < this.nextTouchDamageAt) return;
    this.nextTouchDamageAt = nowMs + this.cfg.touchDamageCooldown * 1000;
    // ── ⚠ WARSTWA 2 wchodzi tu WYŁĄCZNIE skalarem `m(P)` ───────────────────
    // Kontakt rozstrzyga `physics.add.overlap`, więc nie ma dyskretnej chwili
    // ataku — a bez niej nie ma `ActionResolution`, czyli nie ma czym ogłosić
    // Execution Missa ani Ześlizgu. `m(P)` żadnego ogłoszenia nie potrzebuje
    // (jest skalarem, nie zdarzeniem), więc obejmuje ten kanał normalnie.
    //
    // ⚠ **To NIE jest dziura do zalatania.** Gdyby kontakt został poza warstwą
    // 2 w całości, poza `P` wypadłoby 29% wyjścia Szarego w zwarciu — dokładnie
    // ten błąd, który `src/entities/CLAUDE.md` zapisał przy typach obrażeń
    // („otypowanie tylko zaprojektowanego ataku zostawia większość obrażeń poza
    // systemem"). Skalar bez kategorii jest odpowiedzią na oba wymagania naraz.
    const raw = Phaser.Math.Between(this.cfg.touchDamageMin, this.cfg.touchDamageMax);
    player.takeDamage(
      this.damagePacket(raw, this.cfg.touchDamageType, "clean"),
      this.hitVectorTo(player),
    );
  }

  /**
   * **Punkt zrywu zwierzyny** — pierwszy kierunek z wachlarza `fanDeg`
   * (° od „wprost od gracza", kolejność = preferencja) na odległość `len`:
   * najpierw z WOLNĄ prostą (`NavGrid.hasClearLine`), potem dowolny, w którym
   * ciało stanie (`passable` — `seek` dojdzie tam trasą). `null` = osaczony.
   *
   * ⚠ Wspólne od trzeciego użytkownika (lis 2026-10-04, jeleń tego samego
   * dnia; królik ma sploch z zamrożonym impulsem i tego nie używa). Zryw
   * „wprost od gracza" w lesie kończył się na pierwszym pniu — zmierzone na
   * `forrest.tmj`: prosta 160 px bywa wolna w 2 z 24 kierunków.
   * ⚠ Teren pyta się tej samej siatki co reszta rosteru, nie własnej kopii.
   */
  protected escapePoint(player: CombatTarget, len: number, fanDeg: readonly number[]): Phaser.Math.Vector2 | null {
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    const away = Math.atan2(me.y - you.y, me.x - you.x);
    const nav = movementContextFor(this.scene).nav;
    if (!nav) return new Phaser.Math.Vector2(me.x + Math.cos(away) * len, me.y + Math.sin(away) * len);
    const w = this.body?.width ?? 0;
    const punkty = fanDeg.map((deg) => {
      const a = away + Phaser.Math.DegToRad(deg);
      return new Phaser.Math.Vector2(me.x + Math.cos(a) * len, me.y + Math.sin(a) * len);
    });
    return punkty.find((q) => nav.hasClearLine(me.x, me.y, q.x, q.y, w))
      ?? punkty.find((q) => nav.passable(q.x, q.y, w))
      ?? null;
  }

  /**
   * Wektor OD gracza DO tej istoty — „z której strony przyszedł cios", dla
   * tarczy. Liczony w przestrzeni CIAŁ, nie sprite'ów.
   *
   * ⚠ To nie jest drobiazg: każda istota w tej grze ma ciało zaczepione u stóp,
   * wyraźnie poniżej środka sprite'a. Ta sama pomyłka raz już kosztowała czas
   * po drugiej stronie walki — pocisk sieciarza celowany ze środka sprite'a
   * w środek sprite'a przechodził 5 px POD hitboxem gracza, czyli chybiał za
   * każdym razem i nic na ekranie tego nie tłumaczyło (patrz `Projectile.ts`).
   * Tutaj skutek byłby cichszy i gorszy: kąt liczony między środkami sprite'ów
   * przesuwa się o kilka stopni, więc cios przy samej granicy ćwiartki raz
   * byłby blokowany, a raz nie, bez żadnej widocznej przyczyny.
   */
  protected hitVectorTo(player: CombatTarget): Phaser.Math.Vector2 {
    const me = this.combatOrigin;
    const you = player.combatOrigin;
    return new Phaser.Math.Vector2(me.x - you.x, me.y - you.y);
  }

  /**
   * Środek CIAŁA tej istoty — punkt, względem którego liczy się walkę.
   *
   * Powstał w Fazie 1A.2 Combat v2 jako **no-op wobec ówczesnego kodu**:
   * `hitVectorTo` już liczyło z `body.center`, tyle że było jedyną taką funkcją
   * w projekcie. Getter nadał temu nazwę, żeby reszta progów mogła się na nią
   * przepiąć w Fazie 1B — i przepięła się. Dziś czytają go m.in. `combatBody`
   * (niżej), `Bear.resolveSwipe` i `reportAttack`, a `Player` ma bliźniaczy.
   *
   * ⚠ **Bierze `body.center`, a NIE liczy wzoru `skala × (frameH/2 − bodyH/2 −
   * pad)`.** Ten wzór istnieje (w `tools/combat_geometry.mjs`, bo tamten skrypt
   * działa bez silnika), ale jest LUSTREM — a lustra rozjeżdżają się cicho
   * (`tools/CLAUDE.md`). W grze autorytetem jest Phaser i tylko on.
   *
   * ⚠ Nie zwraca `CombatBody` i **nie ma tego zacząć robić** — to są dwa różne
   * kształty (`docs/systemy/combat.md`). Hurtbox stoi w osobnym getterze
   * `combatBody` niżej i bierze wymiary z `cfg.hurt`, zmierzone w Fazie 1B.
   * Do 1B `radius` nie istniał jako dana i ten akapit ostrzegał, żeby nie
   * podstawiać tu liczby zastępczej (np. połowy `bodyWidth`) — zakaz nadal
   * obowiązuje: origin to PUNKT, nie rozmiar.
   */
  get combatOrigin(): { x: number; y: number } {
    const b = this.body as Phaser.Physics.Arcade.Body;
    return { x: b.center.x, y: b.center.y };
  }

  /**
   * Hurtbox tego stworzenia — gdzie DA SIĘ JE TRAFIĆ (Faza 1B).
   *
   * ⚠ Kapsuła powstaje tylko wtedy, gdy zwierzę jest realnie wydłużone
   * (`length > depth`). Dla krępych `length` zostaje pominięte i `gapBetween`
   * degeneruje je do okręgu — bez wyjątków w kodzie wołającym.
   */
  get combatBody(): CombatBody {
    const o = this.combatOrigin;
    const h = this.cfg.hurt;
    const dl = h.length * this.cfg.scale;
    const gl = h.depth * this.cfg.scale;
    return {
      x: o.x,
      y: o.y,
      radius: gl / 2,
      length: dl > gl ? dl : undefined,
      axis: this.axisRad,
    };
  }

  /**
   * What this creature would actually take from a `damageType` hit of
   * `amount`, after its own armour. Pure and public: `takeDamage` uses it, and
   * `GameScene` calls it to print the SAME number in the damage popup.
   *
   * Calling it twice on the same raw amount is safe by construction (no state
   * touched) and is the cheaper trade against moving the popup after the hit,
   * which would have to survive `die()` tearing the enemy down.
   *
   * An unarmoured creature — most of them — takes the amount unchanged; there
   * is no "unarmoured resistance" anywhere in this model.
   */
  damageAfterArmor(amount: number, damageType?: DamageType): number {
    return mitigate(amount, this.cfg.armor, damageType);
  }

  /**
   * Jak dobrze `damageType` radzi sobie z ochroną TEGO stwora — treść koloru i
   * glifu przy liczbie obrażeń. Cała logika jest w `core/Protection`; to jest
   * tylko dostęp do `cfg.armor`, którego GameScene nie ma i mieć nie musi.
   *
   * ⚠ Zwraca `neutralnie` dla stwora bez pancerza, czyli dziś dla SZEŚCIU z
   * siedmiu — i to jest bramkowanie odstępstwem, nie brak zawartości. Jedyny
   * przypadek w grze, który dziś zapala ten kanał, to pchnięcie w dzika.
   */
  effectivenessOf(damageType?: DamageType): Effectiveness {
    return effectiveness(this.cfg.armor, damageType);
  }

  /**
   * **Zgłoś, co się stało z WYKONANYM atakiem (Faza 5A).**
   *
   * ⚠ **Jedno miejsce dla całego rosteru — i to jest cała treść tej metody.**
   * Do 2026-08-23 chybiony cios kończył się cichym `return` w pięciu klasach
   * naraz, więc „uskoczyłem" i „on nie zaatakował" wyglądały identycznie.
   * Naprawą NIE było dorzucenie efektu przed te pięć `return`-ów — to
   * odtworzyłoby dług, którego pozbyła się Faza 2. Zamiast tego akcja
   * **produkuje semantyczne rozstrzygnięcie**, a prezentacja jest jego
   * konsumentem, jednym z kilku możliwych.
   *
   * ⚠ **`ActionResolution` powstaje TYLKO dla ataku, który doszedł do
   * rozstrzygnięcia.** „Atak nie nastąpił" to brak tego obiektu, nie osobny
   * wynik — dzięki temu log, AI i sieć dostaną w przyszłości jednoznaczną
   * odpowiedź, czy zwierzę w ogóle się zamachnęło.
   */
  /**
   * **Rzut na pasek wykonania (warstwa 2) dla ataku TEGO stworzenia.**
   *
   * ⚠ **`allowFumble` jest WYMAGANY** — patrz `Proficiency.executionFor`.
   * Dwa ataki w rosterze dostają `false` i oba z powodu architektonicznego,
   * nie balansowego: `boarCharge` (kapsuła zamiatana co klatkę — brak
   * dyskretnej chwili) i `bearSwipe` (test łuku już pyta o celowanie).
   */
  protected rollExecution(allowFumble: false): ExecutionLanded;
  protected rollExecution(allowFumble: boolean): ExecutionRolled;
  protected rollExecution(allowFumble: boolean): ExecutionRolled {
    return rollExecution(this.cfg.proficiency, allowFumble);
  }

  /** Surowe obrażenia → po warstwie 2. Cienka otoczka, żeby `cfg.proficiency`
   *  nie było przepisywane w sześciu encjach. */
  protected scaledDamage(raw: number, execution: ExecutionLanded): number {
    return scaleDamage(raw, this.cfg.proficiency, execution);
  }

  /**
   * **Surowe obrażenia → gotowy pakiet dla `AttackTarget.takeDamage`.**
   *
   * ⚠ Powstało 2026-09-03 razem z `DamagePacket`, żeby przejście na pakiety
   * **nie rozlało się po siedmiu encjach**: każde wołanie zamieniło jedną
   * linijkę na jedną linijkę, a warstwa 2 (`scaledDamage`) i typ obrażeń
   * zostały dokładnie tam, gdzie były.
   *
   * ⛔ Pakiet jest JEDNOSKŁADNIKOWY i taki ma zostać, dopóki nie zapadnie
   * decyzja o mitygacji wieloskładnikowej (nagłówek `DamagePacket`).
   */
  protected damagePacket(
    raw: number,
    damageType: DamageType | null,
    execution: ExecutionLanded,
  ): DamagePacket {
    return physicalDamage(this.scaledDamage(raw, execution), damageType);
  }

  /**
   * ⚠ **`execution` jest WYMAGANY, nie opcjonalny — ta sama decyzja co przy
   * `EnemyConfig.touchDamageType`.** Domyślna wartość sprawiłaby, że
   * „ten atak świadomie nie ma warstwy 2" i „ktoś nie dopisał argumentu"
   * wyglądają w źródle identycznie, a `tsc` nie zapyta. Ten projekt ma już
   * zapisane, ile kosztowała ta pomyłka przy `damageType`: parametr był
   * opcjonalny przez dwa wydania, każdy wołający go pomijał, i cała kolumna
   * `metal` w `ARMOR_PROFILE` nie robiła nic.
   */
  protected reportAttack(
    action: CombatAction,
    outcome: ActionOutcome,
    player: CombatTarget,
    mitigated: number,
    execution: Execution,
  ): void {
    const o = this.combatOrigin;
    const cel = player.combatOrigin;
    const dx = cel.x - o.x;
    const dy = cel.y - o.y;
    const len = Math.hypot(dx, dy);
    const dir = len > 0.0001 ? { x: dx / len, y: dy / len } : null;
    // ⚠ Punkt rozstrzygnięcia liczony w POŁOWIE drogi do celu, nie na
    // stworzeniu: ślad świstu ma pokazać, że cios przeszedł OBOK gracza, a
    // narysowany na pysku zwierzęcia niczego by o tym nie mówił.
    const at = dir ? { x: o.x + dir.x * (len * 0.6), y: o.y + dir.y * (len * 0.6) } : o;
    // ⚠ Jeden obiekt, dwóch konsumentów — patrz `Player.takeDamage`, gdzie
    // stoi pełne uzasadnienie, dlaczego to NIE mogą być dwa literały.
    const rozstrzygniecie: ActionResolution = {
      actionId: action.id,
      outcome,
      execution,
      mitigated,
      tier: Stamina.impactTier(mitigated),
      crit: false,
      againstPlayer: true,
      at,
      dir,
      // ⚠ **Deklaracja akcji, przepisana bez interpretacji.** Nie liczy się jej
      // z `action.ownsBody` — to dwie różne własności i `spider_web` pokazuje
      // różnicę: ciałem nie steruje, a kopnięcia od trafienia pocisku mieć nie
      // może. Patrz `CombatAction.attackerRecoil`.
      attackerRecoil: action.attackerRecoil,
    };
    // ── ⚠ Napastnik ogłasza WYŁĄCZNIE pudło ────────────────────────────────
    // Każdy inny wynik dosięgnął gracza, a wtedy właścicielem feedbacku jest
    // `Player.ogloszCios` — tylko tam wiadomo, czy cios przeszedł przez tarczę
    // i ile z niego zostało.
    //
    // ⚠ **Bez tego warunku 5B zaczęłoby grać ten sam cios DWA razy**, bo od
    // 5B `cuesFor` zwraca dźwięk i błysk także dla `hit`/`block`/`dodge`/
    // `parry`. I nie jest to hipoteza: przed 5B `hurt` już leciał trzykrotnie
    // na jedno trafienie (surowo z `takeDamage`, przez `cuesFor` tamże i stąd),
    // a **słychać tego nie było wyłącznie dzięki przepustnicy
    // `Sfx.minRetriggerMs`**. Przepustnica maskowała błąd zamiast go pokazać —
    // dlatego podział własności jest tu jawnym warunkiem, a nie liczeniem na
    // to, że duplikat i tak przepadnie.
    if (outcome === "miss") playCues(this.scene, cuesFor(rozstrzygniecie), at, dir);
    // ⚠ **Kopnięcie napastnika należy TUTAJ, bo tutaj jest „jedno miejsce dla
    // całego rosteru".** Rozpisane po pięciu gatunkach byłoby dokładnie tym
    // długiem, którego pozbyła się Faza 2 — i którego uniknięcie jest jedynym
    // powodem, dla którego ta metoda w ogóle powstała w 5A.
    //
    // Szarpnięcie CELU (gracza) leci osobno, z `Player.takeDamage`: tylko tam
    // wiadomo, czy cios przeszedł przez tarczę, a blok świadomie nie rusza
    // ciałem.
    // ── Wypad: gest ataku, gra przy KAŻDYM wyniku ─────────────────────────
    // ⚠ **Tu, w `reportAttack`, bo to jedyne miejsce w projekcie, przez które
    // przechodzi cały roster** (patrz nagłówek tej metody i `src/entities/
    // CLAUDE.md`). Rozpisany po podklasach byłby dokładnie tym długiem, którego
    // pozbyła się Faza 2 — a przy okazji ominąłby stworzenia, które o nim
    // zapomną.
    //
    // ⚠ **Świadomie PRZED kopnięciem i wykluczający się z nim.** Oba ruszają
    // TYM SAMYM ciałem w TEJ SAMEJ chwili, w przeciwnych kierunkach: wypad
    // w przód („rzucam się"), kopnięcie w tył („trafiłem w coś twardego").
    // Puszczone razem sumują się przyrostowo i częściowo znoszą — 7 px w przód
    // minus 4 px w tył daje 3 px szumu zamiast dwóch czytelnych sygnałów. To
    // ta sama reguła, którą `takeDamage` stosuje do pary odrzut/recoil: dwa
    // pojęcia, jedno ciało, pierwszeństwo ma jedno.
    //
    // Pierwszeństwo ma WYPAD, bo niesie więcej informacji: gra także przy
    // pudle, czyli odróżnia „uskoczyłem" od „ono nie zaatakowało" — a to jest
    // ta sama luka, którą w kanale dźwięku zatkał świst z Fazy 5A.
    const wypad = lungeImpulse(action.attackerLunge, dir);
    if (wypad) {
      applyImpulse(this.scene, this, wypad);
    } else {
      const skutki = effectsFor(rozstrzygniecie);
      if (skutki.attackerImpulse) applyImpulse(this.scene, this, skutki.attackerImpulse);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     EFEKTY CZASOWE NA STWORZENIU (2026-09-04, razem z Rozcięciem)
     ══════════════════════════════════════════════════════════════════════
     ⚠ **Ta sama warstwa co u gracza — `core/combat/StatusEffects.ts`, jedna
     instancja per nosiciel.** Nie ma tu ani jednego licznika czasu, ani jednej
     kopii arytmetyki stosów: całą księgowość prowadzi `EffectSet`, a ta klasa
     odpowiada wyłącznie na pytanie „co ten efekt ROBI".

     ⛔ **To NIE jest miejsce na drugi system statusów.** `stun`, `stagger`
     i odrzut zostają tam, gdzie są, i nie przechodzą tutaj — chcą od CIAŁA
     rzeczy przeciwnych (stać vs jechać), mają jawny priorytet w `updateAI`
     i mają własne, udokumentowane pojęcia (`src/entities/CLAUDE.md`). Ich
     zlanie z efektami byłoby przebudową, a nie dołożeniem krwawienia. */
  private readonly effects = new EffectSet(this);

  /**
   * **Nałóż efekt czasowy** (`core/combat/Contracts.EffectTarget`).
   *
   * ⚠ **Bierze GOTOWĄ specyfikację i nie wie, czym ona jest** — dokładnie jak
   * `Player.applyEffect`. Krwawienie buduje jego właściciel (wykonawca
   * Rozcięcia w `GameScene`), a stworzenie jest tylko nosicielem. Dzięki temu
   * dołożenie podpalenia nie wymaga tu ani jednej linijki.
   */
  applyEffect(spec: EffectSpec, source?: EffectSource): void {
    if (this.dead) return;
    this.effects.apply(spec, source);
  }

  /**
   * **Przewiń efekty tego stworzenia. Zwraca `true`, jeśli tik ZABIŁ.**
   *
   * ⚠ **Osobna metoda wołana ze sceny, a nie kod w `updateAI`** — ta sama
   * decyzja i ten sam kształt co `Player.updateEffects(delta)`. Dwa powody,
   * oba nośne:
   *  1. `updateAI` dostaje `nowMs`, a warstwa efektów z założenia przyjmuje
   *     `deltaMs` (jak `Stamina.tick`) — liczenie delty tutaj byłoby drugim
   *     zegarem obok tego, który scena już ma;
   *  2. `updateAI` pomija całą gałąź AI, gdy stworzenie jest ogłuszone albo
   *     leci odrzutem. **Ogłuszony ma dalej krwawić.**
   *
   * ⚠ **Zwrot NIE jest ozdobą.** Księgowość zabójstwa — XP, łup, respawn,
   * `Quests.recordKill`, licznik pozostałych — należy do WOŁAJĄCEGO, tak samo
   * jak przy `takeDamage`. Bez tego zwrotu wróg dobity krwawieniem umierałby
   * bez nagrody i bez odrodzenia, a nic by tego nie zgłosiło.
   */
  updateEffects(deltaMs: number): boolean {
    if (this.dead) return false;
    this.effects.tick(deltaMs);
    // `onEffectTick` mogło wywołać `die()` — patrz komentarz wyżej.
    return this.dead;
  }

  /** Tik efektu. Dziś jedyny tikający efekt po tej stronie to Krwawienie. */
  onEffectTick(effect: ActiveEffect): void {
    if (BLEED.carries(effect)) {
      this.takeEffectTick(BLEED.get(effect, "damagePerTick") * effect.stacks);
    }
  }

  /**
   * Stan efektów się zmienił — odśwież to, co WIDAĆ.
   *
   * ⚠ **Stworzenie dalej NIE MA paska efektów.** `core/Buffs.ts` jest listą
   * dla HUD-u GRACZA i ma jednego pisarza (`Player.syncBuffBar`) — po tej
   * stronie efekt ogłasza się **paskiem HP** (odświeżanym na każdym tiku,
   * patrz `takeEffectTick`) i **znacznikiem nad głową** (2026-09-04, druga
   * runda Rozcięcia). Trzeciego kanału nie ma i nie ma powstać.
   *
   * ⚠⚠ **Cała księgowość ikony siedzi w tej jednej metodzie i to jest cały
   * powód, dla którego jest poprawna.** Warstwa woła ją przy nałożeniu,
   * odświeżeniu, wygaśnięciu i zdjęciu (`EffectSet.apply`/`tick`/`remove`/
   * `dispel`), więc:
   *  - ponowne Rozcięcie **odświeża** efekt o tym samym `id` i trafia tu
   *    ponownie — `showIconMark` widzi zajęty slot i **nie tworzy drugiej
   *    ikony**;
   *  - wygaśnięcie ogłasza się samo, więc ikona gaśnie **bez ani jednego
   *    licznika czasu po tej stronie**.
   *
   * ⛔ **Nie odpytuj tu efektów po `id`.** Pytamy `BLEED` (rodzaj), a ikonę
   * bierzemy z `spec.iconKey`, więc druga zdolność zadająca ranę pokaże
   * SWOJĄ ikonę bez zmiany ani jednej linijki tutaj.
   */
  onEffectsChanged(): void {
    const rana = BLEED.find(this.effects);
    if (rana) this.showIconMark(BLEED.tag, rana.spec.iconKey);
    else this.hideStatusMark(BLEED.tag);
  }

  /**
   * **Jeden tik efektu obrażeniowego — CICHA ścieżka**, bliźniacza wobec
   * `Player.takeVenomTick` i różniąca się od `takeDamage` dokładnie tam, gdzie
   * tamta.
   *
   * ⚠ **Bez pancerza i bez typu obrażeń — i to jest DECYZJA, nie skrót.**
   * Trzy powody, każdy sprawdzalny:
   *  1. taką samą regułę ma jad po stronie gracza („pancerz zatrzymuje cios,
   *     nie truciznę, która jest już w środku") — tu brzmi ona identycznie:
   *     kolczuga nie zaciska rozciętej tętnicy;
   *  2. `ARMOR_PROFILE.metal.slash = 1,4`, więc puszczenie Krwawienia przez
   *     profil jako `slash` sprawiłoby, że **stal ZWIĘKSZA** obrażenia rany —
   *     wynik odwrotny do zamierzonego;
   *  3. przy tikach rzędu 1–10 punktów `Math.round(x × (1 − redukcja))` rusza
   *     wynik najwyżej o jeden punkt, więc „pancerz opiera się krwawieniu"
   *     byłoby twierdzeniem, którego liczby i tak nie uniosą.
   *
   * ⚠ **Bez odrzutu, bez `hitPop`, bez cue i bez agro.** `takeDamage` odpala
   * wszystkie cztery, co jest właściwe dla ciosu i nie do zniesienia przy
   * pięciu tikach — to ta sama lekcja, którą zapisał `Player.takeVenomTick`
   * („cztery tiki = cztery trzęsienia ekranu, czyta się jak usterka").
   * Agro jest zbędne z innego powodu: żeby krwawić, trzeba było oberwać, a to
   * już wprowadziło stworzenie w pościg.
   *
   * ⚠ **Nie woła `onHurt()`** — ten hook odtwarza klip zranienia i jest
   * własnością CIOSU (`takeDamage`/`die`). Pięć klipów pod rząd czytałoby się
   * jak zacięcie animacji.
   *
   * ⚠ **Nie omija `dead`.** W odróżnieniu od jadu gracza nie ma tu pojęcia
   * nietykalności do ominięcia — jest tylko trup, którego nie ma czym ranić.
   */
  private takeEffectTick(amount: number): void {
    if (this.dead || amount <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    // Jedyny kanał, którym Krwawienie się ogłasza — i dlatego pasek jest tu
    // POKAZYWANY, nie tylko odświeżany: bez tego rana wygasłaby za wygaszonym
    // paskiem i gracz nie zobaczyłby ani jednego z pięciu tików.
    this.showHpBar(this.scene.time.now);
    if (this.hp <= 0) this.die();
  }

  /**
   * Take a hit from the player. Applies knockback away from `fromX/fromY`.
   * Returns true if this killed the enemy.
   *
   * ⚠ **`fromX`/`fromY` są w przestrzeni CIAŁ (`combatOrigin`), nie duszków
   * (2026-09-07).** To jest lustro `hitVectorTo`, które mierzy między ciałami
   * od dawna i z tego samego powodu: ciało siedzi u stóp, więc wektor
   * duszek→duszek jest przekoszony o kilka stopni względem tego, gdzie obie
   * strony naprawdę stoją — a odrzut PRZESUWA ciało, nie duszka.
   *
   * Typ obrażeń pochodzi z WARIANTU ataku, którym wyprowadzono zamach
   * (zamrożony na starcie — `GameScene.pendingSwing`); `null` znaczy „bez
   * typu", czyli cios omija profil materiału pancerza.
   *
   * ⚠ **Przyjmuje PAKIET** (2026-09-03, `core/combat/DamagePacket.ts`).
   * ⛔ **Sygnatura świadomie NIE jest zrównana z `Player.takeDamage`:** tu
   * wchodzi odrzut i wychodzi „czy zabity", bo po tej stronie nie ma łańcucha
   * obrony. Patrz `core/combat/Contracts.ts`.
   */
  takeDamage(
    packet: DamagePacket,
    fromX: number,
    fromY: number,
    knockback: number,
  ): boolean {
    if (this.dead) return false;
    // Ten sam szew co po stronie gracza — patrz nagłówek `DamagePacket`.
    const mitigated = this.damageAfterArmor(totalAmount(packet), primaryType(packet) ?? undefined);
    this.hp = Math.max(0, this.hp - mitigated);
    // Restores the state tint rather than clearing it, so a hit never erases a
    // telegraph; the scale pop is off because motion drives scale every frame.
    // A getter, not a value: the enemy may change state during the 120ms flash
    // (a boar's wind-up ending, the Szary enraging), and the tint that goes
    // back on must be the one that is true THEN. See HitFlashOptions.
    this.hitPopUntil = this.scene.time.now + ENEMY_MOTION.hitPopMs;

    // Knockback impulse away from the attacker — and, crucially, a window in
    // which the AI is not allowed to overwrite it. Without that window the
    // impulse survives about one frame, because chase/patrol/attack states all
    // write velocity every tick; measured at the old global 160px/s, an enemy
    // moved 31px while chasing against a 66px melee reach, i.e. the "knockback"
    // never once created space. Most weapons now pass 0 here on purpose.
    if (knockback > 0) {
      // ⚠ Od CIAŁA, nie od duszka — patrz nagłówek metody.
      const o = this.combatOrigin;
      const dir = new Phaser.Math.Vector2(o.x - fromX, o.y - fromY);
      if (dir.lengthSq() < 0.0001) dir.set(0, -1);
      dir.normalize().scale(knockback);
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(dir.x, dir.y);
      this.knockedBackUntil = this.scene.time.now + COMBAT_FEEDBACK.knockbackDurationMs;
    }

    if (this.hp <= 0) {
      this.die();
      return true;
    }

    // ── Szarpnięcie od ciosu (Faza 5B) ────────────────────────────────────
    // ⚠ **Po `die()`, świadomie.** Ta sama reguła, co przy `interrupts`
    // i `staggerMs` niżej w `GameScene`: trupem się nie szarpie. Jest tu
    // jednak drugi, techniczny powód — `nudge` cofa swój offset dopiero
    // w `onUpdate`/`onComplete`, a oba wychodzą przy nieaktywnym celu.
    // Szarpnięcie zaczęte na ciosie zabijającym zostawiłoby więc trwałe
    // przesunięcie na obiekcie, który właśnie przestaje być aktywny.
    //
    // ⚠ **Pomijane, gdy zadziałał ODRZUT.** Ciało należy wtedy do impulsu na
    // `knockedBackUntil`, a recoil wracający do zera ciągnąłby cel z powrotem
    // do punktu, z którego odrzut go właśnie zabrał — czyli zjadłby dokładnie
    // tę własność, która jest tożsamością rodziny obuchowej. Dwa pojęcia,
    // jedno ciało, pierwszeństwo ma to, które tworzy dystans.
    if (knockback <= 0) {
      const skutki = effectsFor({
        actionId: "player_swing",
        outcome: "hit",
        // ⚠ **`"clean"`, bo kierunek GRACZ → WRÓG nie ma jeszcze warstwy 2.**
        // Biegłość gracza to osobna funkcja (rodziny broni, praktyka, pola
        // zapisu) i dopóki nie istnieje, każdy jego cios jest z definicji
        // wykonany czysto. To jest DEKLARACJA stanu, nie zaślepka: gdy
        // warstwa 2 wejdzie po tej stronie, `tsc` wskaże dokładnie te
        // miejsca, bo pole jest wymagane.
        execution: "clean",
        mitigated,
        tier: Stamina.impactTier(mitigated),
        crit: false,
        againstPlayer: false,
        at: { x: this.x, y: this.y },
        // Kierunek ciosu = od napastnika do celu. `effectsFor` normalizuje.
        dir: { x: this.x - fromX, y: this.y - fromY },
        // ⚠ Deklaracja zamachu gracza jest ta sama co wszędzie (`"onHit"`) —
        // rozstrzygnięcie tego samego ciosu nie może raz mówić jedno, raz
        // drugie. **Powstałe stąd `attackerImpulse` jest tu ŚWIADOMIE
        // ignorowane**: to jedno rozstrzygnięcie NA WROGA, a kopnięcie gracza
        // należy się raz na zamach i leci z `GameScene.damageMatchingEnemies`.
        // Czytamy niżej wyłącznie `targetImpulse`.
        attackerRecoil: "onHit",
      });
      if (skutki.targetImpulse) applyImpulse(this.scene, this, skutki.targetImpulse);
    }
    // Only on a hit that's SURVIVED — a killing blow goes straight to
    // onDeathVisual() via die(), not flinch-then-collapse in the same frame.
    this.onHurt();
    // First blood is what puts the bar on screen.
    this.showHpBar(this.scene.time.now);
    // Aggro instantly when struck — through enterChase, so a wolf shot in the
    // back still calls its pack.
    this.enterChase();
    return false;
  }

  private die(): void {
    this.dead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    // Before the fade tween below, so a "collapse" clip plays under the fade
    // rather than never getting the chance to.
    this.onDeathVisual();
    // Straight away, not on the tween's completion: an empty bar hanging over
    // a corpse for the length of the death animation reads as a leftover.
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.nameLabel?.destroy();
    // Ten sam powód co przy pasku: znacznik wiszący nad zapadającym się
    // ciałem czyta się jak pozostałość po usterce, a nie jak stan.
    for (const mark of this.statusMarks.values()) mark.destroy();
    this.statusMarks.clear();
    this.stunnedUntil = 0;
    // Bez ogłoszenia (`clear`, nie `remove`) — nie ma czego odświeżać, a tik
    // wołany na zapadającym się ciele nie miałby czego ranić. Ta sama reguła,
    // którą stosuje `Player.die` → `clearVenom`.
    this.effects.clear();
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: this.scaleX * 1.4,
      scaleY: this.scaleY * 0.6,
      angle: 20,
      duration: 300,
      ease: "Quad.easeIn",
      onComplete: () => this.destroy(),
    });
  }
}

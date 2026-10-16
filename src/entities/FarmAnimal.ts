import Phaser from "phaser";
import {
  ASSETS,
  DEPTH,
  CHICKEN,
  COW,
  PIG,
  SHEEP,
  CAT,
  DOG,
  SHEEPDOG,
  BULL,
  RAM,
  type FarmAnimalTuning,
} from "../config/GameConfig";
import { applyBody } from "../core/movement/BodySpec";
import {
  type Direction,
  type FarmAnimalAnimState,
  type CatColor,
  chickenAnim,
  cowAnim,
  pigAnim,
  sheepAnim,
  catAnim,
  dogAnim,
  ramAnim,
  bullAnim,
} from "../core/Animations";
import { ySortedWorldFor } from "../core/YSortedWorld";

interface FarmAnimalAssetCfg {
  walkKey: string;
  /** Absent for species with no second texture at all (cats — see
   *  ASSETS.cat). A resting animal then just holds a still walk frame
   *  instead of playing a second animation (see `decide()`). */
  eatKey?: string;
  shadowKey?: string;
  cols: number;
  dirRow: Record<Direction, number>;
}

/**
 * ⚠ **Był tu strukturalny SOBOWTÓR `FarmAnimalTuning` z `GameConfig`** —
 * osobna deklaracja tych samych ośmiu pól, trzymana w zgodzie wyłącznie przez
 * typowanie strukturalne. Milczała dokładnie tak długo, jak długo nikt nie
 * dokładał pola: dopisanie `body` w configu skończyło się błędem „Property
 * 'body' does not exist", a nie ostrzeżeniem, że kopia się zestarzała.
 * Teraz jest jeden typ, importowany — tak samo jak `CritterTuning`.
 */
interface FarmAnimalKindEntry {
  assets: FarmAnimalAssetCfg;
  tuning: FarmAnimalTuning;
  anim: (state: FarmAnimalAnimState, dir: Direction) => string;
}

/** Picks one of the 4 cat colours at random — called fresh per spawned cat
 *  (not once per species) so a cluster of strays doesn't come out as
 *  clones. See `ASSETS.cat` for why colour, not species, is the texture
 *  axis for cats specifically. */
function pickCatVariant(): FarmAnimalKindEntry {
  const colors = Object.keys(ASSETS.cat.colors) as CatColor[];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return {
    assets: { walkKey: ASSETS.cat.colors[color].walkKey, cols: ASSETS.cat.cols, dirRow: ASSETS.cat.dirRow },
    tuning: CAT,
    anim: catAnim(color),
  };
}

/**
 * Every species this entity can be, bundling its art (`ASSETS.<x>`), its
 * behaviour tuning (`CHICKEN`/`COW`/`PIG`/`SHEEP`/`CAT`) and its anim-key
 * function (`Animations.ts`) in one place — the table `GameScene`/`TiledMap`
 * read from instead of each spawn site wiring up three separate imports.
 *
 * Four entries are static bundles; `cat` is a FUNCTION instead, because a
 * cat's art isn't one fixed pair of textures — it's one of 4 colours picked
 * per instance. `resolveFarmAnimalKind` is the one place that distinction
 * gets resolved, so callers (GameScene) don't need to care which shape a
 * given species is.
 */
export const FARM_ANIMAL_KINDS = {
  chicken: { assets: ASSETS.chicken, tuning: CHICKEN, anim: chickenAnim },
  cow: { assets: ASSETS.cow, tuning: COW, anim: cowAnim },
  pig: { assets: ASSETS.pig, tuning: PIG, anim: pigAnim },
  sheep: { assets: ASSETS.sheep, tuning: SHEEP, anim: sheepAnim },
  cat: pickCatVariant,
  ram: { assets: ASSETS.ram, tuning: RAM, anim: ramAnim },
  // Psy (2026-10-11): model 3D z wilka, awaryjny chód 2D z `wolf.png` — patrz `ASSETS.dog`.
  dog: { assets: ASSETS.dog, tuning: DOG, anim: dogAnim },
  sheepdog: { assets: ASSETS.dog, tuning: SHEEPDOG, anim: dogAnim },
  // ASSETS.bull has no `eatKey` field (it's ONE texture, not a walk/eat
  // pair — see its comment) — pointing both walkKey and eatKey at the same
  // key is deliberate: FarmAnimal only checks eatKey for TRUTHINESS to
  // decide whether to play a second animation, never reads it as a texture
  // to load, so this correctly tells it "yes, bull has a real eat anim"
  // without needing a second FarmAnimalAssetCfg shape just for one species.
  bull: {
    assets: { walkKey: ASSETS.bull.key, eatKey: ASSETS.bull.key, cols: ASSETS.bull.cols, dirRow: ASSETS.bull.dirRow },
    tuning: BULL,
    anim: bullAnim,
  },
} as const;

export type FarmAnimalSpecies = keyof typeof FARM_ANIMAL_KINDS;

/** Resolve a `FARM_ANIMAL_KINDS` entry to a concrete bundle — calling it
 *  through here (rather than reading the table directly) is what makes the
 *  static/function split above invisible to callers. Call this ONCE PER
 *  SPAWNED INSTANCE, not once per species: for `cat` it rerolls the colour
 *  every time, which is the whole point. */
export function resolveFarmAnimalKind(species: FarmAnimalSpecies): FarmAnimalKindEntry {
  const entry = FARM_ANIMAL_KINDS[species];
  return typeof entry === "function" ? entry() : entry;
}

function directionFrom(dx: number, dy: number): Direction {
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

/**
 * Shared entity for every ambient animal (chicken/cow/pig/sheep/cat) — see
 * `CHICKEN`/`COW`/`PIG`/`SHEEP`/`CAT` in GameConfig.ts for why this is ONE
 * class rather than five near-identical subclasses: they have zero
 * behavioural divergence, only different numbers and art (see
 * `ASSETS.chicken`'s comment on the shared sheet shape). No HP, no aggro, no
 * contact damage, no death, no interaction — deliberately none of `Enemy`'s
 * machinery. Two states forever — wander to a spot near home, or stop and
 * eat (peck/graze — or, for a cat with no second texture, just hold still)
 * — chosen at random, same "reached-or-timeout" reselection shape as
 * `Enemy.patrol`, just with nothing chasing it and nothing to fight.
 */
export class FarmAnimal extends Phaser.Physics.Arcade.Sprite {
  private readonly homeX: number;
  private readonly homeY: number;
  private readonly target = new Phaser.Math.Vector2();
  private eating = false;
  private dir: Direction = "down";
  private nextDecisionAt = 0;
  /**
   * ⭐ **Scenariusz** (2026-10-12, Kirka — `scenes/QuestSpots.ts`): bieg do
   * celu albo postój na jedzenie, zlecony z zewnątrz. Dopóki trwa, zwierzę nie
   * losuje sobie wędrówki. To nie jest AI ani różnica gatunku — każde
   * zwierzę gospodarskie da się tak poprowadzić, a po końcu wraca do swojego
   * zwykłego chodzenia wokół domu.
   */
  private bieg: { cel: () => { x: number; y: number }; tempo: number; zasieg: number; gotowe: () => void } | null = null;
  private postojDo = 0;
  private poPostoju: (() => void) | null = null;
  /**
   * A separate sprite, not a child of this one — Phaser containers would
   * work too, but a plain sibling kept one depth-band behind this sprite is
   * simpler and matches how every other entity here is drawn. Null for
   * species with no shadow art (see `ASSETS.pig`/`.sheep`/`.cat`'s
   * comments): only chicken and cow shipped with one.
   */
  private readonly shadow: Phaser.GameObjects.Sprite | null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly assetCfg: FarmAnimalAssetCfg,
    private readonly tuning: FarmAnimalTuning,
    private readonly animKey: (state: FarmAnimalAnimState, dir: Direction) => string,
  ) {
    super(scene, x, y, assetCfg.walkKey, 0);
    this.homeX = x;
    this.homeY = y;
    this.target.set(x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Rendering architecture ETAP 1B (2026-08-31) — FOUND DURING
    // IMPLEMENTATION, not in the original spec: `FarmAnimal` roams and
    // re-depths itself (and its shadow) every frame in `update()` below,
    // exactly like `Critter`/`Enemy` — but wasn't named in the ETAP 1B list
    // (only Player/Enemy/Critter/NPC/Projectile were). Left in the default
    // scene list, every wandering chicken/cow/pig/sheep/cat would keep
    // dirtying that list's OWN sort flag every frame, undoing the reason
    // this Layer exists. Extending membership here is the same mechanism,
    // not a new one — see the reply text for the full explanation.
    ySortedWorldFor(scene)?.add(this);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setScale(tuning.scale);
    // ⚠ **Domknięcie reguły, nie naprawa objawu.** Do 2026-08-28 `FarmAnimal`
    // — tak jak `Critter` przed poprawką tego samego dnia — wołał `setScale`
    // i nigdy `setSize`, więc dostawał domyślne ciało Arcade, czyli KLATKĘ
    // ARKUSZA razy skalę: krowa 112 × 112 px, byk 122 × 122. Dziś nie koliduje
    // to z niczym (zwierzęta gospodarskie nie mają ani jednego collidera,
    // a Zagaje nie mają kolizji kafli), więc w rozgrywce nic się nie zmienia —
    // ale reguła „każde ciało fizyczne jest ZADEKLAROWANE" ma nie mieć
    // wyjątków, bo to ona odpowiada za `auditBodies`/`dev.bodies()`.
    // Mechanizm: `src/core/movement/BodySpec.ts`, pomiary: `GameConfig`.
    applyBody(this, tuning.body);
    this.setDepth(DEPTH.entities + y);

    // Frame index on a 1-column shadow sheet is just the row number, which
    // is exactly what `dirRow` already holds (see Assets.ts's slicing).
    this.shadow = assetCfg.shadowKey
      ? scene.add
          .sprite(x, y, assetCfg.shadowKey, assetCfg.dirRow[this.dir])
          .setScale(tuning.scale)
          .setDepth(DEPTH.entities + y - 1)
      : null;
    if (this.shadow) ySortedWorldFor(scene)?.add(this.shadow);

    this.decide(0);
  }

  update(nowMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.bieg || this.postojDo) {
      this.updateScenariusz(nowMs, body);
      this.syncShadow();
      return;
    }
    const reached =
      !this.eating && Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 4;
    if (nowMs >= this.nextDecisionAt || reached) this.decide(nowMs);

    if (this.eating) {
      body.setVelocity(0, 0);
    } else {
      this.scene.physics.moveTo(this, this.target.x, this.target.y, this.tuning.walkSpeed);
    }
    this.syncShadow();
  }

  private syncShadow(): void {
    this.setDepth(DEPTH.entities + this.y);
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y);
      this.shadow.setDepth(DEPTH.entities + this.y - 1);
      this.shadow.setFrame(this.assetCfg.dirRow[this.dir]);
    }
  }

  private updateScenariusz(nowMs: number, body: Phaser.Physics.Arcade.Body): void {
    if (this.postojDo) {
      body.setVelocity(0, 0);
      if (nowMs < this.postojDo) return;
      const potem = this.poPostoju;
      this.postojDo = 0;
      this.poPostoju = null;
      this.eating = false;
      potem?.();
      return;
    }
    const b = this.bieg;
    if (!b) return;
    const c = b.cel();
    if (Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y) <= b.zasieg) {
      body.setVelocity(0, 0);
      this.bieg = null;
      this.nextDecisionAt = 0;
      b.gotowe();
      return;
    }
    const dir = directionFrom(c.x - this.x, c.y - this.y);
    if (dir !== this.dir || !this.anims.isPlaying) {
      this.dir = dir;
      this.play(this.animKey("walk", this.dir), true);
    }
    this.scene.physics.moveTo(this, c.x, c.y, b.tempo);
  }

  /** Biegnij do (ruchomego) celu z prędkością `tempo`; `gotowe` woła się raz,
   *  gdy zwierzę stanie w odległości `zasieg`. Kasuje poprzedni scenariusz. */
  biegnij(cel: () => { x: number; y: number }, tempo: number, zasieg: number, gotowe: () => void): void {
    this.postojDo = 0;
    this.poPostoju = null;
    this.eating = false;
    this.bieg = { cel, tempo, zasieg, gotowe };
  }

  /** Stój i jedz przez `ms` (klip `Eat`), potem `potem`. */
  zjedz(nowMs: number, ms: number, potem: () => void): void {
    this.bieg = null;
    this.eating = true;
    if (this.assetCfg.eatKey) this.play(this.animKey("eat", this.dir), true);
    else this.anims.stop();
    this.postojDo = nowMs + ms;
    this.poPostoju = potem;
  }

  /** Przenieś bez biegu (poza kadrem) i wróć do zwykłego chodzenia. */
  przenies(x: number, y: number): void {
    this.bieg = null;
    this.postojDo = 0;
    this.poPostoju = null;
    this.setPosition(x, y);
    (this.body as Phaser.Physics.Arcade.Body).reset(x, y);
    this.nextDecisionAt = 0;
    this.syncShadow();
  }

  private decide(nowMs: number): void {
    if (Math.random() < this.tuning.eatChance) {
      this.eating = true;
      if (this.assetCfg.eatKey) {
        this.play(this.animKey("eat", this.dir), true);
      } else {
        // No second texture (cats — see ASSETS.cat): stop the walk cycle
        // dead rather than let it keep looping on a stationary body, which
        // would read as moonwalking. Column 0 of the current direction's
        // row is as good a "standing still" frame as this sheet offers.
        this.anims.stop();
        this.setFrame(this.assetCfg.dirRow[this.dir] * this.assetCfg.cols);
      }
      this.nextDecisionAt = nowMs + Phaser.Math.Between(this.tuning.eatMsMin, this.tuning.eatMsMax);
      return;
    }
    this.eating = false;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * this.tuning.wanderRadius;
    this.target.set(this.homeX + Math.cos(angle) * r, this.homeY + Math.sin(angle) * r);
    this.dir = directionFrom(this.target.x - this.x, this.target.y - this.y);
    this.play(this.animKey("walk", this.dir), true);
    this.nextDecisionAt = nowMs + Phaser.Math.Between(this.tuning.walkMsMin, this.tuning.walkMsMax);
  }

  /** Zwierzę gospodarskie nie ginie — pole wymagane przez `Creature3D`. */
  readonly isDead = false;

  /**
   * ⭐ Stan dla modelu 3D (`Creature3D`, 2026-10-09): idzie albo je/stoi.
   * Zwrot model bierze z prędkości ciała; klip `Eat` ma każdy gatunek
   * (`tools/farm3d.py`) — kot z niego „wącha" trawę, jak arkusz 2D stał.
   */
  stan3d(): { klip: string } {
    return { klip: this.eating ? "Eat" : "Walk" };
  }

  /** Model 3D stanął — pikselowy cień spod arkusza 2D już nie pasuje. */
  ukryjCien2D(): void {
    this.shadow?.setVisible(false);
  }

  destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}

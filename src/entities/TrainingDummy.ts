import Phaser from "phaser";
import type { CombatTarget } from "../core/combat/Contracts";
import { TRAINING_DUMMY, ASSETS, DEPTH } from "../config/GameConfig";
import { UI, worldTextStyle } from "../core/theme";
import { Enemy } from "./Enemy";
import { ySortedWorldFor } from "../core/YSortedWorld";
import type { Stan3D } from "../render3d/Creature3D";

/** Which of the two zones (see `TRAINING_DUMMY.hint`) is currently shown, or
 *  neither. Tracked so `updateAI` only touches visibility on a real crossing,
 *  not every frame — same "paint on change" rule the rest of this project's
 *  per-frame code follows (`src/ui/CLAUDE.md`). */
type HintZone = "none" | "label" | "ring";

/**
 * A safe practice target by Patryczek's yard — targeting, range, weapon
 * variants, abilities, hit feedback, all through the exact combat pipeline a
 * real fight uses. See `TRAINING_DUMMY` in GameConfig.ts for the full design
 * rationale (the two independent guarantees that it can never die, and why
 * XP/loot/quest-kill/respawn need no code of their own to stay cut off).
 *
 * v1.5's visual affordance is two distance zones — see `TRAINING_DUMMY.hint`
 * for the full history of what was tried and cut to get here (emoji icon,
 * permanent label, "shown once ever" label). No `E`, no dialog, no second
 * way to select it; tapping it is still exactly what tapping any other
 * `Enemy` does.
 */
export class TrainingDummy extends Enemy {
  private readonly hintRing: Phaser.GameObjects.Image;
  private readonly hintLabel: Phaser.GameObjects.Text;
  private hintZone: HintZone = "none";
  /** Czas sceny ostatniego trafienia — start klipu `Hit` modelu 3D; −1 = nigdy. */
  private trafionyOd = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "training_dummy", TRAINING_DUMMY, ASSETS.trainingDummy.key);

    this.hintRing = scene.add
      .image(x, y, ASSETS.trainingDummyHint.textureKey)
      .setAlpha(TRAINING_DUMMY.hint.ring.alpha)
      .setVisible(false);
    // Same style/convention an NPC's own overhead nameplate uses
    // (`Merchant.ts`), so this reads as "a named thing in the world", not as
    // a UI tooltip.
    this.hintLabel = scene.add
      .text(x, y, TRAINING_DUMMY.hint.label, worldTextStyle({ fontSize: "11px", color: UI.goldLight, stroke: "#000000", strokeThickness: 3 }))
      .setOrigin(0.5)
      .setVisible(false);

    // Both get `setDepth` per zone crossing in `updateAI` below — same
    // Y_SORTED_WORLD reasoning as the base `Enemy`'s own HP bar.
    const layer = ySortedWorldFor(scene);
    if (layer) {
      layer.add(this.hintRing);
      layer.add(this.hintLabel);
    }
  }

  /**
   * Guarantee #2 against ever dying (see the big comment on `TRAINING_DUMMY`):
   * top the HP bar back up after every survived hit, so damage can never add
   * up across multiple swings. Guarantee #1 (the absurd base `hp`) is what
   * stops any SINGLE hit from mattering; this stops a long practice session
   * from mattering either. `takeDamage()`/`die()` on the base class are not
   * touched at all.
   */
  protected onHurt(): void {
    this.hp = this.maxHp;
    this.trafionyOd = this.scene.time.now;
  }

  /**
   * ⭐ Model 3D (2026-10-11, `tools/dummy3d.py`, `MODELE_3D.training_dummy`):
   * zachwianie `Hit` na każde trafienie, od nowa przy kolejnym (`od`), potem
   * bezruch. Zawsze przodem do kamery (`kat` 0) — manekin się nie obraca.
   * Wyłącznie prezentacja; mignięcie trafienia przechodzi tintem, jak u wrogów.
   */
  stan3d(): Stan3D {
    const trwa = this.trafionyOd >= 0 && this.scene.time.now - this.trafionyOd < TRAINING_DUMMY.hitWobbleMs;
    return trwa ? { klip: "Hit", raz: true, od: this.trafionyOd, kat: 0 } : { klip: "Idle", kat: 0 };
  }

  /**
   * A dummy doesn't flinch from being touched — same reasoning and same
   * pattern as `Rabbit`'s Prey archetype (`src/entities/CLAUDE.md`), just in
   * the other direction: this disables the creature's OWN contact damage
   * rather than the player's. `touchDamageMin/Max` are already 0 in config,
   * but zeroed numbers would still roll a `player.takeDamage(0, …)` on every
   * approach — a stray zero-damage flash/popup for standing next to it.
   * Overriding the gate itself removes the channel outright.
   */
  protected get contactDamageEnabled(): boolean {
    return false;
  }

  /**
   * `updateAI` is the only override point that already receives the player
   * reference every frame — `updateChase` never fires (aggroRange: 0), and
   * `postMove`/`updateAnimation` don't carry a player at all. `super.
   * updateAI()` runs FIRST and is untouched; everything below is presentation
   * only; it reads combat state (nothing here is combat state), it doesn't
   * write any.
   */
  updateAI(player: CombatTarget, nowMs: number): void {
    super.updateAI(player, nowMs);

    const h = TRAINING_DUMMY.hint;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const zone: HintZone = dist <= h.radius ? "ring" : dist <= h.labelRadius ? "label" : "none";

    if (zone === this.hintZone) {
      // Already in this zone — just follow the enemy's own position (it
      // never actually moves, but `super.updateAI()` above is where a future
      // change could start it, so this stays correct rather than assuming).
      if (zone === "ring") this.hintRing.setPosition(this.x, this.y);
      else if (zone === "label") this.repositionLabel();
      return;
    }
    this.hintZone = zone;
    this.hintRing.setVisible(zone === "ring");
    this.hintLabel.setVisible(zone === "label");
    if (zone === "ring") {
      this.hintRing.setPosition(this.x, this.y).setDepth(DEPTH.entities + this.y + 50);
    } else if (zone === "label") {
      this.repositionLabel();
    }
  }

  private repositionLabel(): void {
    // Origin is centre (0.5, 0.5), so the sprite's top edge is only HALF its
    // display height above `y` — the same fix `Merchant.ts`'s own nameplate
    // comment documents (a full `displayHeight` offset floats the label way
    // above the actual head).
    this.hintLabel
      .setPosition(this.x, this.y - this.displayHeight / 2 - 6)
      .setDepth(DEPTH.entities + this.y + 1);
  }
}

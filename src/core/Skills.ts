import { SKILLS } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Inventory } from "./Inventory";
import { Progression } from "./Progression";

export type SkillId = keyof typeof SKILLS;

export function getSkill(id: SkillId): (typeof SKILLS)[SkillId] {
  return SKILLS[id];
}

/**
 * Learned abilities. Module-level singleton like Progression/Inventory/etc., so
 * it outlives the Player across death/respawn (and map transitions); `reset()`
 * starts a fresh run. Persisted by Save.ts.
 *
 * A skill is a one-off unlock bought with gold at a trainer NPC — learning is
 * intentionally routed through here so the cost is charged once and the state
 * is saved.
 */
class SkillState {
  private learned = new Set<SkillId>();

  has(id: SkillId): boolean {
    return this.learned.has(id);
  }

  /**
   * Czy gracz nauczył się umiejętności odblokowującej czynną `abilityId`.
   *
   * ⚠ Odpowiada **`true` dla umiejętności, których nikt nie uczy** — czyli
   * takich bez żadnego wpisu w `SKILLS` z `unlocksAbility`. To jest celowe:
   * brak nauczyciela ma znaczyć „nie wymaga nauki", a nie „niedostępna na
   * zawsze". Inaczej dodanie nowej umiejętności czynnej bez pary w `SKILLS`
   * dawałoby przycisk, którego nie da się zdobyć, i nic by tego nie zgłosiło.
   *
   * Typowane po `string`, nie po `AbilityId`, żeby nie robić cyklu importów:
   * `Abilities` importuje `Skills`, więc `Skills` nie może importować z niego
   * typu.
   */
  hasAbility(abilityId: string): boolean {
    const gate = (Object.keys(SKILLS) as SkillId[]).find(
      (id) => "unlocksAbility" in SKILLS[id] && SKILLS[id].unlocksAbility === abilityId,
    );
    return gate ? this.learned.has(gate) : true;
  }

  /** Umiejętność czynna, którą ten wpis odblokowuje — jeśli w ogóle. */
  abilityOf(id: SkillId): string | null {
    const def = SKILLS[id];
    return "unlocksAbility" in def ? def.unlocksAbility : null;
  }

  /**
   * Umiejętność, którą trzeba znać wcześniej (`requiresSkill` w `SKILLS` —
   * dziś Kartografia II wymaga I). `null`, gdy wpis nie ma wymogu albo
   * wymóg jest spełniony.
   */
  missingPrereq(id: SkillId): SkillId | null {
    const def = SKILLS[id];
    const req = "requiresSkill" in def ? (def.requiresSkill as SkillId) : null;
    return req && !this.learned.has(req) ? req : null;
  }

  /** Czy da się tego nauczyć TERAZ: nie znana, wymóg spełniony, stać cię.
   *  To pytanie zadają znaczniki „+” nad trenerem — samo `canAfford`
   *  zapalałoby „+” nad lekcją, której trener jeszcze nie udzieli. */
  canLearn(id: SkillId): boolean {
    return !this.has(id) && !this.missingPrereq(id) && this.canAfford(id);
  }

  /** Can the player pay for `id` right now (both gold AND skill points)? */
  canAfford(id: SkillId): boolean {
    const def = SKILLS[id];
    return Inventory.gold >= def.goldCost && Progression.skillPoints >= def.skillPointCost;
  }

  /**
   * Learn `id`, charging BOTH its gold and its skill-point cost. No-op
   * (returns false) if it's already known or the player can't afford it — so
   * callers can stay dumb.
   *
   * Both costs are verified before EITHER is charged: taking the gold and then
   * discovering the points are short would silently rob the player of 35 gold
   * and teach them nothing. The refund below is belt-and-braces for the same
   * reason — it should be unreachable given the check above.
   */
  learn(id: SkillId): boolean {
    if (this.has(id)) return false;
    if (this.missingPrereq(id)) return false;
    if (!this.canAfford(id)) return false;

    const def = SKILLS[id];
    // NB: Inventory.spendGold rejects a zero amount, so a free skill must skip it.
    if (def.goldCost > 0 && !Inventory.spendGold(def.goldCost)) return false;
    if (!Progression.spendSkillPoints(def.skillPointCost)) {
      if (def.goldCost > 0) Inventory.addGold(def.goldCost);
      return false;
    }

    this.learned.add(id);
    this.emitChanged();
    return true;
  }

  /** Every skill a given trainer teaches, in config order. */
  forTrainer(trainer: string): SkillId[] {
    return (Object.keys(SKILLS) as SkillId[]).filter((id) => SKILLS[id].trainer === trainer);
  }

  /**
   * The single skill to surface on a trainer's banner: the first one not yet
   * known. Undefined once the trainer has nothing left to teach, which the UI
   * renders as a "everything learned" line instead of an offer.
   */
  bannerSkillForTrainer(trainer: string): SkillId | undefined {
    return this.forTrainer(trainer).find((id) => !this.has(id));
  }

  reset(): void {
    this.learned.clear();
    this.emitChanged();
  }

  /** The learned ids, for saving. */
  snapshot(): SkillId[] {
    return [...this.learned];
  }

  /** Restore from a save (bypasses the cost/guards — data is already valid). */
  restore(ids: SkillId[] | undefined): void {
    this.learned = new Set((ids ?? []).filter((id) => id in SKILLS));
    this.emitChanged();
  }

  emitChanged(): void {
    GameEvents.emit(EVENT.skillsChanged, { learned: this.snapshot() });
  }
}

export const Skills = new SkillState();

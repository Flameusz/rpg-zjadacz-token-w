import { ARMOR_TRAINING } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { Progression } from "./Progression";

export type ArmorTrainingRank = (typeof ARMOR_TRAINING.ranks)[number];

/**
 * **Trening ciężkiego pancerza** — trzy rangi zdejmujące CZĘŚĆ kary
 * obciążenia (Model D, `OI-103`). Moduł-singleton jak `Skills`, bo przeżywa
 * `Player` przez śmierć, respawn i przejścia między mapami.
 *
 * ⚠ **Rangi są LINIOWE: II wymaga I, III wymaga II.** Trzymamy licznik
 * `rank` (0–3), nie zbiór — kolejność jest częścią projektu (najtańsza siedzi
 * na kanale, którego Siła nie dotyka), a zbiór pozwalałby kupić samą trzecią.
 *
 * ⚠ **Ulga ZDEJMUJE ułamek kary, nigdy jej nie kasuje.** Po wszystkich trzech
 * rangach 75,5 kg ma nadal 116 px/s wobec 148 px/s postaci w 12 kg.
 * ⛔ Nie „naprawiaj" tego podnoszeniem `relief` — to jest zasada, nie liczba.
 *
 * ⛔ **Kosztuje WYŁĄCZNIE punkty umiejętności.** Ceny złota świadomie nie ma:
 * ekonomia złota jest otwarta (`OI-46`), a decyzja o obciążeniu jawnie jej nie
 * zamykała. Wpięcie do sklepu trenera razem z ceną należy do `OI-46`.
 *
 * ⚠ **Nie importuje `Equipment`** — to `Equipment` czyta ulgi stąd. Odwrotny
 * kierunek zamknąłby cykl `Equipment → ArmorTraining → Equipment`.
 */
class ArmorTrainingState {
  /** Ile rang wykupiono: 0 (brak) … `ARMOR_TRAINING.ranks.length`. */
  private rankCount = 0;

  get rank(): number {
    return this.rankCount;
  }

  get maxRank(): number {
    return ARMOR_TRAINING.ranks.length;
  }

  /** Wykupione rangi, w kolejności. */
  get owned(): readonly ArmorTrainingRank[] {
    return ARMOR_TRAINING.ranks.slice(0, this.rankCount);
  }

  /** Następna ranga do kupienia, albo `null` gdy wszystko wykupione. */
  get next(): ArmorTrainingRank | null {
    return this.rankCount < this.maxRank ? ARMOR_TRAINING.ranks[this.rankCount] : null;
  }

  /** Czy stać gracza na następną rangę (punkty umiejętności). */
  canAfford(): boolean {
    const next = this.next;
    return next !== null && Progression.skillPoints >= next.points;
  }

  /**
   * Wykup następną rangę, pobierając jej koszt w punktach.
   *
   * Zwraca `false`, gdy nie ma czego kupować albo brakuje punktów — wołający
   * może zostać głupi, tak samo jak przy `Skills.learn`.
   */
  learn(): boolean {
    const next = this.next;
    if (!next) return false;
    if (!this.canAfford()) return false;
    if (!Progression.spendSkillPoints(next.points)) return false;

    this.rankCount++;
    this.emitChanged();
    return true;
  }

  // ── ULGI ────────────────────────────────────────────────────────────────
  //
  // ⚠ Sumują się po wykupionych rangach, bo każda ranga siedzi na INNYM
  // kanale. Gdyby kiedyś dwie rangi dotknęły tego samego kanału, sumowanie
  // przestaje być poprawne — wtedy składaj je multiplikatywnie
  // (`1 − Π(1 − relief)`), nie przez dodawanie.

  private sum(key: "regenRelief" | "effortRelief" | "speedRelief"): number {
    const total = this.owned.reduce((acc, rank) => acc + rank[key], 0);
    return Math.min(1, Math.max(0, total));
  }

  /** Ułamek kary REGENERACJI zdejmowany przez trening (0..1). */
  get regenRelief(): number {
    return this.sum("regenRelief");
  }

  /** Ułamek kary WYSIŁKU zdejmowany przez trening (0..1). */
  get effortRelief(): number {
    return this.sum("effortRelief");
  }

  /** Ułamek kary RUCHU zdejmowany przez trening (0..1). */
  get speedRelief(): number {
    return this.sum("speedRelief");
  }

  reset(): void {
    this.rankCount = 0;
    this.emitChanged();
  }

  /** Liczba rang, do zapisu. */
  snapshot(): number {
    return this.rankCount;
  }

  /**
   * Przywróć z zapisu.
   *
   * ⚠ **Pole jest OPCJONALNE i nie podbija `SAVE_VERSION`** — zapis sprzed
   * treningu wczytuje się jako zero rang, bez straty postępu. Ta sama droga,
   * którą weszły `quickSlot`, pierścienie i `offhand`.
   */
  restore(rank: number | undefined): void {
    const n = Math.floor(rank ?? 0);
    this.rankCount = Number.isFinite(n) ? Math.min(this.maxRank, Math.max(0, n)) : 0;
    this.emitChanged();
  }

  private emitChanged(): void {
    GameEvents.emit(EVENT.armorTrainingChanged, { rank: this.rankCount });
  }
}

export const ArmorTraining = new ArmorTrainingState();

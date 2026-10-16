import { SHIELD_SKILL } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { addPractice } from "./Practice";
import type { BlockGrade } from "./Protection";

/**
 * **UMIEJĘTNOŚĆ WŁADANIA TARCZĄ** (`T-7`, 2026-09-15). Moduł-singleton jak
 * `Skills` i `ArmorTraining`, bo przeżywa `Player` przez śmierć, respawn
 * i przejścia między mapami.
 *
 * ── Po co istnieje ────────────────────────────────────────────────────────
 * Blok był jedyną akcją bojową, której **nie dało się nauczyć**. Broń rośnie
 * przez `WeaponProficiency`, ciężki pancerz przez `ArmorTraining`, a tarcza
 * kosztowała tyle samo w pierwszej i w tysięcznej walce.
 *
 * ── Trzy decyzje, każda z powodem ────────────────────────────────────────
 *
 * ⚠ **1. To NIE jest rodzina broni.** `WEAPON_FAMILY` niesie tożsamość ATAKU
 * (parowanie miecza, krytyk topora, typ obrażeń) i wisi na `def.family`
 * przedmiotów `type: "weapon"`; tarcza jest `type: "armor"`. Wpuszczenie jej
 * tam dołożyłoby piątej rodzinie pól, których nigdy nie użyje, i kazałoby
 * `Progression.familyParryBonus` odpowiadać na pytanie o tarczę.
 *
 * ⚠ **2. Arytmetyka wzrostu jest POŻYCZONA, nie napisana od nowa.**
 * `Practice.addPractice` / `pointCost` — dokładnie ta krzywa, po której rośnie
 * biegłość broni (`koszt(P) = a + b·P`, więc suma jest kwadratowa).
 * ⛔ **Drugiej krzywej nauki w tym projekcie nie ma i nie ma powstać.**
 *
 * ⚠ **3. Praktyka idzie od PRZYJĘTYCH PUNKTÓW, nie od liczby bloków.** Inaczej
 * najtańszą drogą do mistrzostwa byłoby stanie przed królikiem — ta sama
 * pomyłka, którą biegłość broni rozwiązała przez `teacher(ρ)`
 * (`docs/systemy/proficiency.md` §20).
 *
 * ⚠ **Nie importuje `Equipment` ani `Progression`** — to `Equipment` czyta
 * ulgę stąd. Odwrotny kierunek zamknąłby cykl `Equipment → ShieldSkill →
 * Equipment`; ta sama reguła, co przy `ArmorTraining` i `Stamina`.
 *
 * ⛔ **To nie są rangi i nie ma tu ceny.** Umiejętność rośnie z UŻYCIA;
 * kupowana ranga tarczy (odpowiednik Mastery) nie jest tym zakresem otwierana
 * ani przesądzana.
 */
class ShieldSkillState {
  /** `P` — punkty umiejętności władania tarczą. */
  private points = 0;

  /** Reszta praktyki poniżej ceny kolejnego punktu. **Bufor, nie ułamek `P`.** */
  private pool = 0;

  get proficiency(): number {
    return this.points;
  }

  get atCap(): boolean {
    return this.points >= SHIELD_SKILL.cap;
  }

  /**
   * **Ułamek kosztu bloku zdejmowany przez umiejętność** (0..1).
   *
   * ⚠ **Kształt `K/(K+x)` — ten sam, co `d/(d+defenseK)` w `Protection`
   * i co obie osie bezwzględne Modelu D.** Projekt ma jedną rodzinę krzywych
   * nasycenia i nowa oś nie dostaje własnej.
   *
   * ⚠ **ZDEJMUJE UŁAMEK, nigdy nie kasuje.** Przy `P = cap` zostaje
   * `1 − maxRelief` kosztu. Kanał, który da się wyzerować, przestaje być
   * kanałem — ta sama zasada, co przy `ARMOR_TRAINING`.
   */
  get relief(): number {
    const p = Math.max(0, this.points);
    return SHIELD_SKILL.maxRelief * (p / (p + SHIELD_SKILL.k));
  }

  /**
   * Zapisz naukę z JEDNEGO zablokowanego ciosu.
   *
   * `absorbed` to punkty, które tarcza faktycznie zatrzymała
   * (`DamageResult.absorbed`), `grade` — jak ciężko jej z tym poszło.
   * Zwraca `true`, gdy `P` faktycznie urosło (wołający może to ogłosić).
   *
   * ⚠ **Emisja TYLKO przy zdobyciu punktu**, nie przy każdym doładowaniu puli
   * — ta sama zasada, co w `Equipment.wearShield`: zdarzenie na każdy blok
   * ciągnęłoby za sobą HUD, panele i autozapis kilka razy na walkę.
   */
  practice(absorbed: number, grade: BlockGrade): boolean {
    if (grade === "none" || !(absorbed > 0)) return false;
    if (this.atCap) return false;
    const waga = SHIELD_SKILL.gradeWeight[grade];
    const gain = absorbed * SHIELD_SKILL.practicePerPoint * waga;
    const po = addPractice({ proficiency: this.points, pool: this.pool }, gain);
    const urosl = po.proficiency > this.points;
    this.points = Math.min(SHIELD_SKILL.cap, po.proficiency);
    this.pool = po.pool;
    if (urosl) this.emitChanged();
    return urosl;
  }

  reset(): void {
    this.points = 0;
    this.pool = 0;
    this.emitChanged();
  }

  /** Do zapisu — `P` i bufor, bo bez bufora nauka gubiłaby się przy każdym zapisie. */
  snapshot(): { points: number; pool: number } {
    return { points: this.points, pool: this.pool };
  }

  /**
   * Przywróć z zapisu.
   *
   * ⚠ **Pole jest OPCJONALNE i nie podbija `SAVE_VERSION`** — zapis sprzed
   * `T-7` wczytuje się jako `P = 0`, bez straty postępu. Ta sama droga, którą
   * weszły `quickSlot`, pierścienie, `offhand` i `armorTraining`.
   */
  restore(saved: { points?: number; pool?: number } | undefined): void {
    const p = Number(saved?.points ?? 0);
    const b = Number(saved?.pool ?? 0);
    this.points = Number.isFinite(p) ? Math.min(SHIELD_SKILL.cap, Math.max(0, Math.floor(p))) : 0;
    this.pool = Number.isFinite(b) ? Math.max(0, b) : 0;
    this.emitChanged();
  }

  private emitChanged(): void {
    GameEvents.emit(EVENT.shieldSkillChanged, {
      proficiency: this.points,
      relief: this.relief,
    });
  }
}

export const ShieldSkill = new ShieldSkillState();

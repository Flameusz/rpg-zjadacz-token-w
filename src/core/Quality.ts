import { EQUIPMENT, ITEMS, QUALITY, variantPriceMul } from "../config/GameConfig";
import { getItem, itemRequirements, itemVariant, type ItemId } from "./Items";
import { itemMaterial, materialDefenseMul, materialPriceMul } from "./ArmorMaterials";
import { weaponMaterial, weaponDamageMul, weaponMaterialPriceMul } from "./WeaponMaterials";
import type { Attribute } from "./Progression";

/**
 * **Jakość wykonania** — craftsmanship, and the module that turns it into
 * numbers. Tuning lives in `GameConfig.QUALITY`; the accepted scope of the
 * whole system is written up in `docs/jakosc_wykonania.md`.
 *
 * The one idea underneath everything here: **an item stopped being a string.**
 * Until now an item WAS its `itemId` — two swords in the backpack were the same
 * object twice, and equipping one kept nothing but its name. Quality and
 * durability are properties of a concrete copy, so a copy needs to exist:
 * that is `ItemInstance`.
 *
 * Type-only import of `Attribute` (same trick, same reason as `Items.ts`): this
 * stays a pure reader over config and instances, with no runtime dependency on
 * player state. Whether the player MEETS a requirement is Equipment's business.
 */

export type QualityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** What an item with nothing recorded is — see `GameConfig.QUALITY.defaultLevel`. */
export const DEFAULT_QUALITY = QUALITY.defaultLevel as QualityLevel;

/* ⛔ USUNIĘTE 2026-09-08: `QUALITY_LEVELS` (tablica 1..7) i `SHOP_MAX_QUALITY`.
   Oba były eksportowane od początku systemu jakości i **nie miały ani jednego
   czytelnika** — ani w `src/`, ani w `tools/`, ani w `docs/`. Zakres poziomów
   pilnuje `isQualityLevel`/`clampQuality`, a sufit sklepu czyta się wprost
   z `QUALITY.shopMaxLevel`, czyli z konfigu — tam, gdzie mieszka balans. */

/**
 * One concrete copy of an item.
 *
 * `quality` and `durability` are **optional on purpose, and that optionality is
 * the entire save migration.** A pre-quality save stores `{ itemId, qty }`;
 * absent fields read as Zwykła at full durability, so no existing character is
 * discarded to pay for this feature. Same additive trick `quickSlot`, the ring
 * slots and `questProgress` all used — see `Save.SAVE_VERSION`, which is
 * deliberately NOT bumped.
 *
 * In a running game they are always populated (everything goes through
 * `makeInstance`/`normalizeInstance`); read them through the helpers below
 * rather than directly, so the default lives in exactly one place.
 */
export interface ItemInstance {
  itemId: ItemId;
  qty: number;
  quality?: QualityLevel;
  durability?: number;
}

function isQualityLevel(v: unknown): v is QualityLevel {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 7;
}

export function clampQuality(v: number): QualityLevel {
  return Math.min(7, Math.max(1, Math.round(v))) as QualityLevel;
}

function qualityName(q: QualityLevel): string {
  return QUALITY.levels[q].name;
}

export function qualityColor(q: QualityLevel): number {
  return QUALITY.levels[q].color;
}

/** `#rrggbb`, for the text styles — Phaser shapes take the number instead. */
export function qualityColorHex(q: QualityLevel): string {
  return `#${qualityColor(q).toString(16).padStart(6, "0")}`;
}

/**
 * Display a derived stat with just enough precision to tell two adjacent
 * quality levels apart, never more.
 *
 * ⚠ Exists because `instanceDamage`/`instanceDefense` deliberately stopped
 * rounding (see their comments) — on small base numbers a whole-number display
 * would round two different quality levels to the identical figure (measured:
 * the stick's Zwykła and Dobra both showed "6-9", two levels of the sztylet
 * showed the same DPS). Whole numbers print as whole numbers; anything else
 * gets exactly one decimal, comma for the Polish UI.
 */
export function formatStat(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
}

type ScaleKey = "damage" | "defense" | "maxDurability" | "attackSpeed";

/** Multiplier (or fraction, for `attackSpeed`) this quality applies to a stat. */
export function qualityMul(key: ScaleKey, q: QualityLevel): number {
  return QUALITY.modifiers[key][q];
}

// ---------------------------------------------------------------------------
// Durability
// ---------------------------------------------------------------------------

/**
 * Does this item type track durability at all?
 *
 * Driven by the presence of a `durability` value in `ITEMS`, not by item type —
 * which is what lets armour join later by gaining that one field, with no code
 * change here. Today only weapons carry it (armour durability is deliberately
 * out of scope for this pass).
 */
export function hasDurability(itemId: ItemId): boolean {
  return "durability" in getItem(itemId);
}

/** Base (Zwykła) durability of this item type, or 0 if it doesn't track any. */
function baseDurability(itemId: ItemId): number {
  const def = getItem(itemId);
  return "durability" in def ? def.durability : 0;
}

/** Max durability of a copy of this quality — quality's only job here. */
function maxDurabilityOf(itemId: ItemId, q: QualityLevel): number {
  const base = baseDurability(itemId);
  return base <= 0 ? 0 : Math.max(1, Math.round(base * qualityMul("maxDurability", q)));
}

// ---------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------

export function makeInstance(itemId: ItemId, qty = 1, quality: QualityLevel = DEFAULT_QUALITY): ItemInstance {
  const inst: ItemInstance = { itemId, qty, quality };
  if (hasDurability(itemId)) inst.durability = maxDurabilityOf(itemId, quality);
  return inst;
}

export function qualityOf(inst: ItemInstance): QualityLevel {
  return isQualityLevel(inst.quality) ? inst.quality : DEFAULT_QUALITY;
}

export function maxDurabilityOfInstance(inst: ItemInstance): number {
  return maxDurabilityOf(inst.itemId, qualityOf(inst));
}

/** Current durability. An unrecorded value reads as FULL, never as broken —
 *  the opposite default would break every weapon in every existing save. */
export function durabilityOf(inst: ItemInstance): number {
  const max = maxDurabilityOfInstance(inst);
  if (max <= 0) return 0;
  return typeof inst.durability === "number" ? Math.min(Math.max(inst.durability, 0), max) : max;
}

/**
 * Fill in whatever a stored slot is missing, and repair anything nonsensical.
 *
 * Runs on every load. Being generous here rather than strict is the point: a
 * slot from a pre-quality save, a hand-edited value, or an item whose base
 * durability changed between builds all have to come out as something playable
 * rather than as a discarded save.
 */
export function normalizeInstance(raw: unknown): ItemInstance | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ItemInstance>;
  // An unknown id (an item removed between builds, a hand-edited save) drops
  // the slot rather than crashing the load.
  if (typeof r.itemId !== "string" || !(r.itemId in ITEMS)) return null;
  const itemId = r.itemId as ItemId;
  const qty = typeof r.qty === "number" && r.qty > 0 ? Math.floor(r.qty) : 1;
  const quality = isQualityLevel(r.quality) ? r.quality : DEFAULT_QUALITY;

  const inst: ItemInstance = { itemId, qty, quality };
  if (hasDurability(itemId)) {
    const max = maxDurabilityOf(itemId, quality);
    inst.durability =
      typeof r.durability === "number" && Number.isFinite(r.durability)
        ? Math.min(Math.max(Math.round(r.durability), 0), max)
        : max;
  }
  return inst;
}

// ---------------------------------------------------------------------------
// Condition
// ---------------------------------------------------------------------------

/**
 * Is this copy worn out?
 *
 * ⚠ **"Zniszczona" is a STATE, not an eighth quality level.** A Mistrzowski
 * sword at zero durability is a broken Mistrzowski sword: it keeps its quality,
 * keeps its slot, still works (at `destroyedMultiplier`), and is repairable the
 * day a repair mechanic exists. It is never deleted — see the note on
 * `EQUIPMENT.durability.destroyedMultiplier`.
 */
export function isDestroyed(inst: ItemInstance): boolean {
  return hasDurability(inst.itemId) && durabilityOf(inst) <= 0;
}

/**
 * Multiplier applied to damage/defense for the item's CONDITION, as opposed to
 * its quality. 1 while it holds together.
 *
 * ⚠ **Wyeksportowane w `T-5` (2026-09-15), bo `Equipment.blockSpec` musi je
 * czytać.** Do tej daty było prywatne i konsumowały je wyłącznie
 * `instanceDamage`/`instanceDefense` — czyli punkty obrony zniszczonej tarczy
 * spadały, a jej BLOK działał w pełni. To była dziura zapisana w checkpointcie
 * i zamknięta razem z dodaniem pola `durability` tarczom.
 *
 * ⚠ **To NIE jest ósmy poziom jakości.** Zniszczony Mistrzowski miecz zostaje
 * Mistrzowski — patrz `isDestroyed`. Stan i jakość to dwie prostopadłe osie
 * i naprawa rusza wyłącznie pierwszą.
 */
export function conditionMul(inst: ItemInstance): number {
  return isDestroyed(inst) ? EQUIPMENT.durability.destroyedMultiplier : 1;
}

/**
 * Spend one swing's worth of durability. Returns true if this call is what
 * broke the item, so the caller can say so once instead of every frame.
 *
 * ⚠ Call this **once per swing**, never once per enemy hit — see the warning on
 * `EQUIPMENT.durability.wearChance`.
 */
export function applyWear(inst: ItemInstance, strain = 1): boolean {
  if (!hasDurability(inst.itemId)) return false;
  if (isDestroyed(inst)) return false;
  const d = EQUIPMENT.durability;
  // ⚠⚠ **`strain` skaluje SZANSĘ, nie stawkę — i to jest JEDEN model zużycia,
  // nie drugi (`T-7`, 2026-09-15).** Do tej daty stawka była stała dla
  // wszystkiego, a komentarz przy `Equipment.wearShield` bronił tego zdaniem
  // „osobny model zużycia dla tarcz byłby drugim systemem naprawy". **Ten
  // powód zostaje uszanowany:** nadal jest jeden `wearChance`, jeden
  // `wearAmount`, jedna naprawa i jeden config. Zmienia się tylko to, że
  // wołający może powiedzieć, ile dane zdarzenie WAŻYŁO — tak samo jak
  // `Stamina.hitCost` liczy się od `mitigated`, a nie od liczby ciosów.
  //
  // ⚠ **`strain = 1` daje DOKŁADNIE dawne zachowanie**: jedno losowanie,
  // ten sam próg, ten sam kierunek porównania. Broń woła bez argumentu,
  // więc jej zużycie jest nietknięte — pilnuje tego zamek §K6
  // w `tools/tarcze_przymiar.mjs`.
  const szansa = d.wearChance * Math.max(0, strain);
  // Powyżej 1 szansa przestaje być szansą — całość idzie w GWARANTOWANE
  // ubytki, a reszta ułamkowa dalej się losuje. Bez tego mnożnik 2,5 przy
  // `wearChance 0,15` byłby nie do odróżnienia od 1,0 dla gracza, bo oba
  // wychodziłyby „prawie zawsze nic".
  const pewne = Math.floor(szansa);
  let ubytek = pewne * d.wearAmount;
  if (Math.random() < szansa - pewne) ubytek += d.wearAmount;
  if (ubytek <= 0) return false;
  inst.durability = Math.max(0, durabilityOf(inst) - ubytek);
  return inst.durability <= 0;
}

/**
 * Gold cost to fully repair this copy right now — 0 if it doesn't track
 * durability or is already full.
 *
 * Scales with the MISSING fraction, not a flat fee: a lightly worn weapon
 * costs almost nothing, a broken one costs close to (but always under, see
 * `repairPriceFraction`) the price of a fresh copy. See `ShopPanel.
 * repairEquipped` for where this is actually charged.
 */
export function repairCost(inst: ItemInstance): number {
  if (!hasDurability(inst.itemId)) return 0;
  const max = maxDurabilityOfInstance(inst);
  if (max <= 0) return 0;
  const missing = 1 - durabilityOf(inst) / max;
  if (missing <= 0) return 0;
  const full = buyPriceOf(inst.itemId, qualityOf(inst)) * EQUIPMENT.durability.repairPriceFraction;
  return Math.max(1, Math.round(full * missing));
}

/**
 * Restore a copy to full durability, in place.
 *
 * Fixes CONDITION only — quality (workmanship) is untouched, a repaired
 * Podła sword is still Podła. Mutates the instance directly rather than
 * returning a new one: callers already hold a reference into `Equipment` or
 * `Inventory` and must announce the change themselves (`Equipment.
 * emitChanged()` / `Inventory.emitChanged()`) since this module has no event
 * bus of its own.
 */
export function repairInstance(inst: ItemInstance): void {
  if (!hasDurability(inst.itemId)) return;
  inst.durability = maxDurabilityOfInstance(inst);
}

/**
 * Ustaw STARTOWY stan świeżo zrobionego egzemplarza na ułamek pełnej
 * trwałości (łup ze zniszczonym strojem zbója — `LOOT.equipmentDrops`).
 *
 * ⚠ **To jest inicjalizacja, nie kanał zużycia** — i mieszka TU, bo pole
 * `durability` ma jednego właściciela (zamek `D13` w `tools/tarcze_przymiar.mjs`:
 * „mutowane TYLKO w `Quality.ts`"). Do 2026-10-13 ten zapis stał w
 * `GameScene` (łup bandytów, 2026-10-11) i zamek świecił na czerwono.
 * Najmniej 1 punkt: łup leży zniszczony, nie rozbity.
 */
export function setDurabilityFraction(inst: ItemInstance, frac: number): void {
  if (!hasDurability(inst.itemId)) return;
  inst.durability = Math.max(1, Math.round(maxDurabilityOfInstance(inst) * Math.min(1, Math.max(0, frac))));
}

// ---------------------------------------------------------------------------
// Derived stats
// ---------------------------------------------------------------------------

/**
 * Weapon damage range of this copy, after quality and condition.
 *
 * ⚠ Deliberately NOT rounded. `Player.rollDamage()` rolls a float in this
 * exact range (`Phaser.Math.FloatBetween`) and rounds only the final applied
 * amount — rounding here first would collapse small quality differences to
 * nothing before the dice ever see them (a stick's Zwykła and Dobra both
 * round `damageMax` to 9, so a pre-rounded roll couldn't tell them apart even
 * though the +5% is real). Round at display time with `formatStat`, not here.
 */
export function instanceDamage(inst: ItemInstance): { min: number; max: number } | null {
  const def = getItem(inst.itemId);
  if (def.type !== "weapon") return null;
  // ⭐ **Trzy niezależne mnożniki na tym samym zakresie: gatunek × jakość ×
  // stan** — dokładny bliźniak `instanceDefense` niżej. Gatunek jest
  // własnością TYPU broni (żelazny kord to inny `ItemId` niż stalowy), jakość
  // i stan — własnością egzemplarza. ⚠ Broń bez pola `material` jest stalowa,
  // czyli ×1,00: ta linijka nie zmieniła ani jednej istniejącej liczby.
  const mul =
    weaponDamageMul(weaponMaterial(inst.itemId)) *
    (1 + qualityMul("damage", qualityOf(inst))) *
    conditionMul(inst);
  return {
    // Floored at 1: a Podła, broken stick still has to be able to hurt something,
    // or the weapon silently stops being a weapon.
    min: Math.max(1, def.damageMin * mul),
    max: Math.max(1, def.damageMax * mul),
  };
}

/**
 * Armour protection of this copy, after quality and condition.
 *
 * ⚠ Deliberately NOT rounded, same reasoning as `instanceDamage` — this feeds
 * `Equipment.totalDefense` and then `defenseReduction`'s `d/(d+K)` curve
 * directly, no dice roll involved, so keeping the fraction is strictly more
 * accurate and costs nothing. Round at display time with `formatStat`.
 */
export function instanceDefense(inst: ItemInstance): number {
  const def = getItem(inst.itemId);
  if (def.type !== "armor") return 0;
  // ⭐ **Trzy niezależne mnożniki na tych samych punktach: gatunek × jakość ×
  // stan.** Gatunek jest własnością TYPU przedmiotu (żelazny napierśnik to
  // inny `ItemId` niż stalowy), jakość i stan — własnością egzemplarza. Żaden
  // nie musi wiedzieć o pozostałych, bo wszystkie mnożą PUNKTY, nigdy wynik
  // (`N-16`). Profil materiału (`ARMOR_PROFILE`) dokłada się później, w
  // `armorPointsAgainst`, tą samą drogą.
  const mul =
    materialDefenseMul(itemMaterial(inst.itemId)) *
    (1 + qualityMul("defense", qualityOf(inst))) *
    conditionMul(inst);
  return Math.max(0, def.defense * mul);
}

/**
 * Handling bonus (a fraction, like a ring's) from this copy's workmanship.
 *
 * ⚠ Returned RAW — the caller must fold it into the same
 * `ATTRIBUTES.maxAttackSpeedBonus` cap that gear bonuses go through, not add it
 * afterwards. `swingDurationMs` scales off the capped number, so anything that
 * sneaks past the cap makes the attack pose stutter. See
 * `Progression.attackSpeedBonus`.
 */
export function instanceAttackSpeed(inst: ItemInstance): number {
  return getItem(inst.itemId).type === "weapon" ? qualityMul("attackSpeed", qualityOf(inst)) : 0;
}

/**
 * Attribute minimums for this copy — the item type's own, shifted by
 * workmanship.
 *
 * ⚠ The shift applies **only to attributes the item already asks for**.
 * Requirement-free gear stays requirement-free at every quality; see the
 * warning on `QUALITY.modifiers.requirement` for why that invariant is
 * load-bearing rather than tidy.
 */
export function instanceRequirements(inst: ItemInstance): Partial<Record<Attribute, number>> {
  const base = itemRequirements(inst.itemId);
  const shift = QUALITY.modifiers.requirement[qualityOf(inst)];
  if (shift === 0) return base;
  const out: Partial<Record<Attribute, number>> = {};
  for (const [attr, need] of Object.entries(base)) {
    out[attr as Attribute] = Math.max(1, need + shift);
  }
  return out;
}

/**
 * Buy price of one copy at this quality (see `QUALITY.priceMul`).
 *
 * ⭐ **Cena konstrukcji × gatunek × jakość.** Żelazna sztuka deklaruje tę samą
 * `buyPrice`, co jej stalowy bliźniak — obniżkę robi `materialPriceMul`,
 * dokładnie tak jak obniżkę punktów robi `materialDefenseMul`. Dzięki temu
 * strojenie ceny konstrukcji przestraja oba gatunki naraz i nie da się ich
 * rozjechać.
 */
export function buyPriceOf(itemId: ItemId, q: QualityLevel): number {
  const def = getItem(itemId);
  if (!("buyPrice" in def)) return 0;
  // ⚠ Obie osie gatunku stoją obok siebie i **żadna nie musi wiedzieć o drugiej**:
  //   `itemMaterial` milczy na broni, `weaponMaterial` milczy na pancerzu, więc
  //   dla każdego przedmiotu dokładnie jedna z nich jest różna od 1.
  const mul =
    materialPriceMul(itemMaterial(itemId)) *
    weaponMaterialPriceMul(weaponMaterial(itemId)) *
    variantPriceMul(itemVariant(itemId)) *
    QUALITY.priceMul[q];
  return Math.max(1, Math.round(def.buyPrice * mul));
}

/** Sell price of one copy at this quality. Ta sama złożona ścieżka co przy
 *  kupnie — inaczej żelazo sprzedawałoby się po cenie stali. */
export function sellPriceOf(itemId: ItemId, q: QualityLevel): number {
  const mul =
    materialPriceMul(itemMaterial(itemId)) *
    weaponMaterialPriceMul(weaponMaterial(itemId)) *
    variantPriceMul(itemVariant(itemId)) *
    QUALITY.priceMul[q];
  return Math.max(1, Math.round(getItem(itemId).sellPrice * mul));
}

/** "Zwykła" / "Mistrzowska (zniszczona)" — one phrasing, so no two widgets can
 *  describe the same copy differently. */
export function describeQuality(inst: ItemInstance): string {
  const name = qualityName(qualityOf(inst));
  return isDestroyed(inst) ? `${name} (zniszczona)` : name;
}

/**
 * The quality a given vendor stocks a given item at.
 *
 * **Deliberately derived, never rolled.** `ShopPanel.show()` recomputes stock on
 * every single open, so a random quality would let the player walk out and back
 * in until a good one appeared — which turns a characterisation system into a
 * slot machine. Hashing (vendor, item) instead makes each shelf stable forever,
 * costs no save data, and means the Kowal's sword is the Kowal's sword.
 *
 * The RANGE comes from the vendor, which is the point: a village smith who
 * mostly forges mill parts and horseshoes does not turn out fine blades, while
 * the Hunter tans his own leather. Vendors without a declared range sell Zwykła.
 */
export function vendorQuality(npcId: string, itemId: ItemId, range?: readonly [number, number]): QualityLevel {
  if (!range) return DEFAULT_QUALITY;
  const lo = clampQuality(Math.min(range[0], range[1]));
  const hi = clampQuality(Math.max(range[0], range[1]));
  if (lo === hi) return lo;
  let h = 2166136261;
  const key = `${npcId}:${itemId}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return clampQuality(lo + (Math.abs(h) % (hi - lo + 1)));
}

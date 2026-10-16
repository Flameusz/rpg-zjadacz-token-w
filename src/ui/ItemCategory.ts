/**
 * ── KATEGORIE PRZEDMIOTÓW DLA FILTRA (`OI-130`, 2026-10-11) ────────────────
 *
 * Jedno miejsce, które odpowiada „do której zakładki należy ta rzecz" — dla
 * półki kupca, plecaka w sklepie i plecaka w panelu postaci. ⚠ **Zero Phasera
 * i zero stanu**: pasek zakładek (`CategoryStrip`) tylko to rysuje, a przymiar
 * (`tools/filtr_przymiar.mjs`) sprawdza tę samą funkcję bez uruchamiania gry.
 *
 * ⭐ Decyzja autora: **zakładki kategorii, nie przygaszanie**. Półka pokazuje
 * wyłącznie wybraną kategorię, dosuniętą; plecak — WIDOK filtrowany (prawdziwe
 * miejsca rzeczy się nie zmieniają, przestawianie tylko w „Wszystko").
 *
 * ⚠ Kategoria wynika z MIEJSCA, w które rzecz się zakłada (obszar ciała,
 * ręka), nie z materiału ani warstwy — gracz pyta „co mam na głowę", nie
 * „co mam na L2". Tarcza to osobna zakładka, choć w danych jest `armor`.
 */
import { getItem, type ItemId } from "../core/Items";

export type ItemCategory =
  | "all"
  | "weapon"
  | "shield"
  | "head"
  | "chest"
  | "shoulders"
  | "gloves"
  | "legs"
  | "boots"
  | "jewelry"
  | "usable"
  | "material";

export interface CategoryDef {
  readonly id: ItemCategory;
  readonly label: string;
  /** Klatka `ASSETS.slotGlyphs` — ten sam język, co puste kafle lalki. */
  readonly glyph?: number;
  /** Ikona przedmiotu tam, gdzie glifu slotu nie ma. */
  readonly iconItem?: ItemId;
}

/** Kolejność zakładek = kolejność na pasku. „Wszystko" zawsze pierwsze. */
export const CATEGORIES: readonly CategoryDef[] = [
  { id: "all", label: "Wszystko" },
  { id: "weapon", label: "Broń", glyph: 10 },
  { id: "shield", label: "Tarcze", glyph: 11 },
  { id: "head", label: "Głowa", glyph: 1 },
  { id: "chest", label: "Tors", glyph: 3 },
  { id: "shoulders", label: "Ramiona", glyph: 2 },
  { id: "gloves", label: "Ręce", glyph: 4 },
  { id: "legs", label: "Nogi", glyph: 6 },
  { id: "boots", label: "Stopy", glyph: 7 },
  { id: "jewelry", label: "Biżuteria", glyph: 8 },
  { id: "usable", label: "Użytkowe", iconItem: "health_potion" },
  { id: "material", label: "Surowce", iconItem: "leather_scraps" },
];

const SLOT_CATEGORY: Record<string, ItemCategory> = {
  offhand: "shield",
  head: "head",
  chest: "chest",
  shoulders: "shoulders",
  gloves: "gloves",
  legs: "legs",
  boots: "boots",
};

/** Do której zakładki należy przedmiot (nigdy „all"). */
export function categoryOf(itemId: ItemId): Exclude<ItemCategory, "all"> {
  const def = getItem(itemId) as { type: string; slot?: string };
  if (def.type === "weapon") return "weapon";
  if (def.type === "ring" || def.type === "amulet") return "jewelry";
  if (def.type === "consumable" || def.type === "container") return "usable";
  if (def.type === "armor") {
    const c = def.slot ? SLOT_CATEGORY[def.slot] : undefined;
    if (c && c !== "all") return c as Exclude<ItemCategory, "all">;
  }
  return "material";
}

/**
 * Zakładka plecaka dla SLOTU lalki (pusty kafel → „co tu pasuje"). Adresy
 * warstwowe (`chest_L2`) i drugi zestaw (`weapon2`) sprowadzają się do obszaru.
 * `null` dla slotów bez zakładki (szybki slot, torby).
 */
export function categoryOfSlot(slot: string): Exclude<ItemCategory, "all"> | null {
  if (slot === "weapon" || slot === "weapon2") return "weapon";
  if (slot === "offhand" || slot === "offhand2") return "shield";
  if (slot === "ring1" || slot === "ring2" || slot === "amulet") return "jewelry";
  const area = slot.replace(/_L\d$/, "");
  const c = SLOT_CATEGORY[area];
  return c && c !== "all" ? (c as Exclude<ItemCategory, "all">) : null;
}

export function matchesCategory(itemId: ItemId, cat: ItemCategory): boolean {
  return cat === "all" || categoryOf(itemId) === cat;
}

/**
 * Zakładki, które mają sens dla tego zbioru rzeczy: „Wszystko" + kategorie
 * OBECNE, w stałej kolejności. ⚠ Pusta zakładka nie istnieje — dotknięcie jej
 * dawałoby pustą siatkę, która na dotyku czyta się jak zepsuty filtr.
 */
export function categoriesPresent(ids: Iterable<ItemId>): CategoryDef[] {
  const obecne = new Set<ItemCategory>();
  for (const id of ids) obecne.add(categoryOf(id));
  return CATEGORIES.filter((c) => c.id === "all" || obecne.has(c.id));
}

/** Ile rzeczy z listy należy do kategorii — liczba na zakładce. */
export function countIn(ids: Iterable<ItemId>, cat: ItemCategory): number {
  let n = 0;
  for (const id of ids) if (matchesCategory(id, cat)) n++;
  return n;
}

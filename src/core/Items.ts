import { ITEMS } from "../config/GameConfig";
import type { WeaponFamily } from "./Equipment";
import type { Attribute } from "./Progression";

export type ItemId = keyof typeof ITEMS;
export type ItemDef = (typeof ITEMS)[ItemId];

export function getItem(id: ItemId): ItemDef {
  return ITEMS[id];
}

/**
 * Attribute minimums needed to equip this item — `{}` when it has none (the
 * dagger, all leather). Type-only import of `Attribute`, so this stays a pure
 * config reader with no runtime dependency on player state; whether the player
 * actually MEETS these is Equipment's business.
 */
export function itemRequirements(id: ItemId): Partial<Record<Attribute, number>> {
  const def = ITEMS[id];
  return "requires" in def ? def.requires : {};
}

/**
 * Ile rąk zajmuje ta broń: 1 albo 2. **Brak pola znaczy 1**, więc każdy
 * istniejący przedmiot zachowuje się dokładnie tak, jak przed wprowadzeniem
 * dwuręczności — zero migracji, zero zmian w zapisie.
 *
 * ⚠ **To jest własność KONKRETNEGO PRZEDMIOTU, nigdy rodziny broni.** Młot
 * jednoręczny i młot dwuręczny mogą istnieć obok siebie, tak samo miecz czy
 * topór; „dwuręczność" nie jest kategorią mechaniczną i nie niesie ze sobą
 * żadnego bonusu. Zasięg, łuk, odrzut i przerywanie zostają tam, gdzie były —
 * w `melee` i `attacks` danego przedmiotu. Pełne uzasadnienie i zamknięty
 * review: `docs/systemy/weapons.md` (R-1).
 *
 * Czytane przez `in`, tak samo jak `itemRequirements` wyżej, bo `ITEMS` jest
 * `as const` i pole występuje tylko na części przedmiotów.
 */
export function itemHands(id: ItemId): 1 | 2 {
  const def = ITEMS[id];
  return "hands" in def && def.hands === 2 ? 2 : 1;
}

/**
 * **Czy ta broń umie chwyt MNIEJSZY, niż deklaruje `hands`** — kategoria 1.5H.
 *
 * ⚠⚠ **`hands` i `grip` odpowiadają na DWA RÓŻNE pytania i dlatego stoją
 * obok siebie, a nie zamiast siebie.** `hands` mówi, ilu rąk broń CHCE — czyli
 * czym jest jej pełny profil. `grip` mówi, czy istnieje profil mniejszy.
 * Półtorak deklaruje więc `hands: 2` **oraz** `grip: "either"`: jego linia
 * katalogowa jest oburęczna, a chwyt jednoręczny jest z niej ODJĘCIEM.
 *
 * ⭐ Dzięki temu `itemHands` **nie zmienia znaczenia dla żadnej z 37 broni**,
 * a wszystko, co po nim dziedziczy — `§Y` regresji, kolumna katalogu, bramka
 * drugiej ręki na `accepts` — działa dalej bez zmiany ani jednej linijki.
 * ⛔ **Nie zastępuj tego wartością `hands: 1.5`.** `itemHands` zwraca `1 | 2`
 * i trójargument sprowadziłby 1,5 do `1` **po cichu**, otwierając drugą rękę
 * na półtorak jako broń dual wield i wrzucając go do zbioru 1H w `§Y`.
 *
 * Model: `docs/decyzje/2026-09-18-kategoria-1-5h.md`.
 */
export function itemGrip(id: ItemId): "full" | "either" {
  const def = ITEMS[id];
  return "grip" in def && def.grip === "either" ? "either" : "full";
}

/**
 * Archetyp tej broni, albo `null`, gdy do żadnego nie należy.
 *
 * **Brak pola jest legalnym stanem, nie dziurą** — dziś gołe ręce i osiosany
 * kij (broń improwizowana, patrz komentarz przy `ITEMS.stick`). Przedmiot bez
 * rodziny zachowuje się dokładnie tak, jak przed wprowadzeniem rodzin, więc
 * całość weszła bez migracji i bez podbicia `SAVE_VERSION`.
 *
 * ⚠ Czytane przez `in`, tak samo jak `itemHands`/`itemRequirements` — `ITEMS`
 * jest `as const`, a pole występuje tylko na części przedmiotów.
 */
export function itemFamily(id: ItemId): WeaponFamily | null {
  const def = ITEMS[id];
  return "family" in def ? def.family : null;
}

/**
 * Wariant konstrukcyjny tego przedmiotu albo `null`, gdy go nie ma.
 *
 * **Brak pola jest legalnym stanem i znaczy „zwykły"** — tak jak przy
 * `itemHands` i `itemFamily`. Dzięki temu każdy istniejący przedmiot
 * zachowuje się dokładnie tak, jak przed wprowadzeniem wariantów: zero
 * migracji, zero zmian w zapisie, zero podbicia `SAVE_VERSION`.
 *
 * ⛔ **Wariant nie niesie ŻADNEJ własnej właściwości** (`B1`, 2026-09-16) —
 * jest wyłącznie adresem do `SHIELD_VARIANT` przy wyliczaniu ceny. Liczby
 * fizyczne są już wyliczone w definicji przez `statTarczy`.
 */
export function itemVariant(id: ItemId): "light" | "heavy" | null {
  const def = ITEMS[id];
  return "variant" in def ? def.variant : null;
}

/**
 * Konstrukcja tarczy albo `null`, gdy przedmiot nią nie jest.
 *
 * ⚠ To jest KLASYFIKACJA, nie liczba — adres do `SHIELD_GEOMETRY` (`T-1`).
 * Brak pola jest legalny i znaczy „nie tarcza”, dokładnie jak przy
 * `itemVariant` i `itemFamily`.
 */
export function itemConstruction(id: ItemId): string | null {
  const def = ITEMS[id];
  return "construction" in def ? def.construction : null;
}

/**
 * **GABARYT W PLECAKU** — ile pól siatki zajmuje jeden egzemplarz.
 *
 * ⚠⚠ **To jest OŚ CAŁKOWICIE NIEZALEŻNA** od slotu Equipment, od `hands`,
 * od `grip`, od masy i od statystyk. Bastard może być jednocześnie
 * `hands: 2` · `grip: "either"` · gabaryt `1×2` — i te trzy liczby nie
 * wynikają z siebie nawzajem. ⛔ **Nie wyprowadzaj gabarytu z `hands`.**
 *
 * ⚠ **Brak pola znaczy `1×1`**, więc każdy istniejący przedmiot zachowuje się
 * dokładnie tak, jak przed wprowadzeniem gabarytu — zero migracji, zero zmian
 * w zapisie, zero podbicia `SAVE_VERSION`. Ta sama addytywna droga, co
 * `hands`, `grip`, `material` i `variant`.
 *
 * ⚠ **Nazwa mówi `inventory`, bo `footprint` jest w tym projekcie ZAJĘTE** —
 * `movement/BodySpec` nazywa tak ślad stopy stworzenia w świecie. Dwa różne
 * „obrysy" pod jedną nazwą rozjechałyby się przy pierwszym wyszukiwaniu.
 *
 * ⏳ Dziś w użyciu są wyłącznie `1×1` i `1×2`; kształt `{ w, h }` jest ogólny,
 * żeby `2×1` i `2×2` weszły później bez wyrzucania architektury.
 * ⛔ **Żaden przedmiot nie ma dziś zadeklarowanego gabarytu** — przypisanie
 * konkretnych broni i tarcz jest osobną decyzją contentową.
 */
export function itemFootprint(id: ItemId): { w: number; h: number } {
  const def = ITEMS[id];
  if (!("inventoryFootprint" in def)) return { w: 1, h: 1 };
  const fp = def.inventoryFootprint as { w?: number; h?: number };
  return { w: fp.w ?? 1, h: fp.h ?? 1 };
}

/** Texture key of the (placeholder) icon generated for this item — see Assets.ts. */
export function itemIconKey(id: ItemId): string {
  return `item-icon-${id}`;
}

/**
 * How many backpack slots this item adds when worn in a `BAG_SLOT` — 0 for
 * everything that isn't `type: "container"`. Same `in`-guarded read as
 * `itemRequirements`/`itemHands` above: `ITEMS` is `as const` and the field
 * exists only on containers.
 */
export function containerSlots(id: ItemId): number {
  const def = ITEMS[id];
  return "containerSlots" in def ? def.containerSlots : 0;
}

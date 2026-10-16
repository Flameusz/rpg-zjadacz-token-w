import { ARMOR_MATERIAL, ITEMS } from "../config/GameConfig";
import type { ArmorType } from "./Protection";
import { getItem, type ItemId } from "./Items";

/**
 * ── GATUNEK MATERIAŁU ──────────────────────────────────────────────────────
 *
 * ⚠⚠ **Dwie osie, nie jedna — i to jest cały powód istnienia tego pliku.**
 *
 * ```
 * armorType  →  PROFIL: jak ta konstrukcja reaguje na typy obrażeń   (poziomo)
 * material   →  GATUNEK: z jakiego metalu ją zrobiono                (pionowo)
 * ```
 *
 * Dowód, że są naprawdę prostopadłe: **kolczuga i płyta bywają z tego samego
 * metalu, a mają różne profile.** Żelazo jest jednocześnie drutem (`mail`)
 * i blachą (`metal`), więc gatunku nie da się wyrazić wierszem profilu —
 * musiałby być dwiema rzeczami naraz.
 *
 * ⛔ **Gatunek NIGDY nie staje się wierszem `ARMOR_PROFILE`.** `N-7` żąda od
 * nowego wiersza typu obrażeń, w którym ten materiał wygrywa; żelazo
 * z definicji nie wygrywa ze stalą w niczym. Odwrotnie też: nowy PROFIL
 * (przyszła łuska, `OI-100`) nie jest gatunkiem i nie wchodzi tutaj.
 *
 * ⭐ **Poziom zerowy to STAL — cały dzisiejszy katalog.** Drabinka rośnie
 * W DÓŁ. Żaden istniejący przedmiot nie zmienił ani jednej liczby; żelazo
 * dokłada szczebel poniżej, więc kirys (28 PP) zostaje szczytem, a scope PP
 * pojedynczej warstwy (~30) pozostaje nietknięty.
 *
 * ⛔ **Gatunek nie rusza MASY ani `requires`** (decyzja autora 2026-09-15).
 * `iron X` i `steel X` ważą tyle samo i mają tę samą bramkę Siły — różnica
 * gęstości obu metali jest za mała na mechanikę, a masa jest już osią rozmiaru
 * konstrukcji. ⛔ Nie „naprawiaj" tego, dokładając żelazu wagi.
 *
 * Pełna decyzja z wyprowadzeniem korytarza:
 * `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`.
 */
export type MaterialGrade = keyof typeof ARMOR_MATERIAL;

/** Kolejność OD NAJGORSZEGO. Jedno źródło porządku drabinki — tak jak
 *  `ARMOR_LAYERS` jest jedynym źródłem porządku warstw. */
export const MATERIAL_GRADES: readonly MaterialGrade[] = ["iron", "steel"];

/** Nazwa gatunku dla gracza — jedna linia na karcie przedmiotu. */
export function materialLabel(grade: MaterialGrade): string {
  return ARMOR_MATERIAL[grade].name;
}

/**
 * **Które profile w ogóle mają drabinkę gatunków.**
 *
 * ⚠ `padded` i `leather` mają PUSTĄ listę i to nie jest „jeszcze nie" tylko
 * z nazwy: „żelazny len" nie znaczy nic, a różnica między skórą surową
 * a garbowaną jest jakością wykonania, nie gatunkiem metalu. Gdyby kiedyś
 * skóra dostała własną oś, dostanie własne nazwy gatunków — nie `iron`.
 *
 * ⚠ **`mail` MA drabinkę i to jest ważniejsze, niż wygląda.** Gdyby drut był
 * bezgatunkowy, a blacha nie, „materiał" znaczyłby raz gatunek metalu, a raz
 * rodzaj konstrukcji — czyli dokładnie to zlanie dwóch osi, które ten plik
 * rozdziela.
 *
 * ⚠ Typowane przez `Record<ArmorType, …>`, więc **nowy materiał pancerza nie
 * skompiluje się, dopóki nie odpowie, czy ma gatunki** — ta sama reguła, co
 * przy `LAYER_OF_MATERIAL`.
 */
const GRADES_OF_ARMOR_TYPE: Record<ArmorType, readonly MaterialGrade[]> = {
  padded: [],
  leather: [],
  mail: ["iron", "steel"],
  metal: ["iron", "steel"],
};

/**
 * Gatunek DOMYŚLNY dla profilu — czyli poziom zerowy drabinki.
 *
 * ⭐ To jest miejsce, w którym „dzisiejszy katalog = stal" jest zapisane raz
 * i dla wszystkich. Dzięki temu **ani jedna z 18 istniejących sztuk `mail`
 * i `metal` nie musiała dostać pola `material`** — dokładnie tak, jak żadna
 * nie musiała dostać pola `layer`.
 */
const DEFAULT_GRADE: Partial<Record<ArmorType, MaterialGrade>> = {
  mail: "steel",
  metal: "steel",
};

/**
 * Gatunek tego przedmiotu, albo `null`, gdy pytanie nie ma sensu (przeszywanica,
 * skóra, broń, pierścień, surowiec).
 *
 * Czytane przez `in`, tak samo jak `itemLayer`/`itemHands` — pole `material`
 * występuje dziś na siedmiu przedmiotach (żelazo), a pozostałe jedenaście
 * `metal` i siedem `mail` bierze gatunek z mapy domyślnej.
 */
export function itemMaterial(id: ItemId): MaterialGrade | null {
  const def = getItem(id);
  if (def.type !== "armor") return null;
  if ("material" in def) return def.material as MaterialGrade;
  return "armorType" in def ? DEFAULT_GRADE[def.armorType as ArmorType] ?? null : null;
}

/**
 * Mnożnik PUNKTÓW ochrony dla tego gatunku. Bezgatunkowy pancerz (len, skóra)
 * dostaje 1 — brak gatunku nie może znaczyć „słabszy".
 *
 * ⚠ **Mnoży PUNKTY, nigdy wynik** (`N-16`), więc gatunek, jakość i profil
 * materiału składają się przemiennie i żadne z trzech nie musi wiedzieć
 * o pozostałych.
 */
export function materialDefenseMul(grade: MaterialGrade | null): number {
  return grade ? ARMOR_MATERIAL[grade].defenseMul : 1;
}

/**
 * Mnożnik CENY dla tego gatunku — osobna oś od `defenseMul` i celowo niższa.
 *
 * ⚠ **Warunek, który musi zostać spełniony przy każdym strojeniu: `priceMul`
 * NIŻSZY niż `defenseMul`.** Inaczej żelazo jest gorsze pod każdym względem
 * naraz (słabsze ORAZ gorsze na złotówkę) i przestaje być wyborem, a staje się
 * pułapką. Pilnuje tego przymiar.
 */
export function materialPriceMul(grade: MaterialGrade | null): number {
  return grade ? ARMOR_MATERIAL[grade].priceMul : 1;
}

/**
 * **Zamek na deklarację `material`** — czy pole postawione na przedmiocie ma
 * gdzie zadziałać.
 *
 * Trzy sposoby, na jakie deklaracja bywa CICHYM kłamstwem:
 *  • na przedmiocie, który nie jest pancerzem — `itemMaterial` go nie zapyta,
 *    a karta i tak wypisze „Materiał: …";
 *  • na profilu bez drabinki (`padded`, `leather`) — gatunek nic tam nie mnoży,
 *    bo mnożniki są jego jedyną treścią;
 *  • z wartością spoza `ARMOR_MATERIAL` — mnożnik wychodzi `undefined`
 *    i punkty robią się `NaN`, co widać dopiero na ekranie postaci.
 *
 * ⚠ Bierze `items` parametrem, żeby dało się zaświecić na czerwono na danych
 * podstawionych w przymiarze — asercja, której nie da się złamać w teście,
 * jest dekoracją.
 */
export function materialDeclarationProblems(
  items: Record<string, unknown> = ITEMS,
): string[] {
  const problemy: string[] = [];
  for (const [id, raw] of Object.entries(items)) {
    const def = raw as { type?: string; armorType?: string; material?: string };
    if (!("material" in def) || def.material === undefined) continue;
    /**
     * ⚠⚠ **BROŃ jest wyłączona — od 2026-09-17, i to nie jest poluzowanie
     * zamka, tylko oddanie sprawy WŁAŚCIWEMU zamkowi.** `material` na broni
     * oznacza gatunek z `WEAPON_MATERIAL` (bliźniacza oś, `core/WeaponMaterials.ts`);
     * pyta o niego `weaponMaterial`, a pilnuje `weaponMaterialProblems`.
     * Zdanie „nikt o nie nie zapyta" przestało być prawdą w dniu, w którym
     * nóż i cep zadeklarowały żelazo.
     * ⛔ **Nie rozszerzaj tego wyjątku na inne typy.** Mikstura albo surowiec
     * z polem `material` to dalej błąd i dalej ma tu zapalać — pilnuje `§E E2`.
     */
    if (def.type === "weapon") continue;
    if (def.type !== "armor") {
      problemy.push(`${id}: \`material\` na przedmiocie typu "${def.type}" — nikt o nie nie zapyta`);
      continue;
    }
    if (!(def.material in ARMOR_MATERIAL)) {
      problemy.push(`${id}: \`material: "${def.material}"\` spoza ${MATERIAL_GRADES.join("/")}`);
      continue;
    }
    const dozwolone = GRADES_OF_ARMOR_TYPE[def.armorType as ArmorType] ?? [];
    if (!dozwolone.includes(def.material as MaterialGrade)) {
      problemy.push(
        `${id}: gatunek "${def.material}" niedozwolony dla \`armorType: "${def.armorType}"\`` +
          (dozwolone.length === 0 ? " — ten profil nie ma drabinki gatunków" : ""),
      );
    }
  }
  return problemy;
}

/* Asercja startowa. ⚠ Stoi TUTAJ, a nie w `Equipment`, bo w odróżnieniu od
   zamka warstw nie potrzebuje niczyjej listy slotów — wszystko, o co pyta,
   jest w tym pliku i w `ITEMS`. */
for (const problem of materialDeclarationProblems()) {
  console.warn(`[ArmorMaterials] ${problem}`);
}

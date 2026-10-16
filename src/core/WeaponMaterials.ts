import { WEAPON_MATERIAL, ITEMS } from "../config/GameConfig";
import { getItem, type ItemId } from "./Items";

/**
 * ── GATUNEK MATERIAŁU BRONI ────────────────────────────────────────────────
 *
 * ⚠ **To jest BLIŹNIAK `core/ArmorMaterials.ts`, celowo zbudowany tym samym
 * kształtem**: tabela mnożników w configu, pole `material` na przedmiocie,
 * mapa domyślna dla tych, którzy pola nie deklarują, i zamek na deklarację,
 * która nie ma gdzie zadziałać. Kto zna tamten plik, zna ten.
 *
 * ⚠⚠ **Gatunek jest OSIĄ KONSTRUKCYJNĄ, nie rodziną.** Rodzina (`sword`,
 * `polearm`) jest szeroką kategorią BIEGŁOŚCI — decyduje, w czym gracz ćwiczy
 * i którą rangę Mastery kupuje. Gatunek nie rusza ani biegłości, ani rodziny,
 * ani wariantów: mnoży **obrażenia i cenę**, i nic poza tym. ⛔ Nie rób
 * z żelaznego miecza osobnej rodziny i nie dawaj gatunkowi cech.
 *
 * ⭐ **Poziom zerowy to STAL — cały dotychczasowy katalog.** Drabinka rośnie
 * W DÓŁ, dokładnie jak przy pancerzu: ani jedna istniejąca liczba obrażeń się
 * nie zmieniła, bo każda broń bez pola `material` dostaje `steel`, czyli ×1,00.
 *
 * ⛔ **Gatunek NIE rusza masy, `requires`, tempa ani zasięgu** — ta sama
 * granica, co po stronie pancerza. Różnica gęstości żelaza i stali jest za mała
 * na mechanikę, a masa jest osią ROZMIARU konstrukcji, nie jej tworzywa.
 *
 * ⚠ **Nie mnożymy katalogu.** Oś istnieje, żeby *dało się* wystawić żelazny
 * wariant konstrukcji, a nie żeby każdą z nich natychmiast podwoić.
 *
 * ⭐ **Od 2026-09-17 pole ma dwóch użytkowników: `knife` i `peasant_flail`** —
 * i żaden z nich nie jest żelaznym bliźniakiem istniejącej konstrukcji. Obie są
 * żelazne dlatego, że **wychodzą z wiejskiej kuźni**, a nie z warsztatu
 * płatnerza; gatunek jest tu faktem świata, nie wyborem projektanta.
 * ⚠⚠ **Ich `damageMin/Max` i `buyPrice` w `ITEMS` są RÓWNOWAŻNIKIEM STALOWYM.**
 * Kto stroi te liczby, stroi nominał, a nie to, co widzi gracz — mnożnik
 * przykłada `Quality.instanceDamage` i `Quality.buyPriceOf`.
 * ⛔ Nie jest to zaproszenie do podwojenia katalogu żelaznymi bliźniakami:
 * zawartość dochodzi wtedy, gdy ma powód.
 */

/** Gatunki, w jakich broń może być wykonana. */
export type WeaponMaterialGrade = keyof typeof WEAPON_MATERIAL;

/** Nazwa gatunku dla gracza (karta przedmiotu, katalog). */
export function weaponMaterialLabel(grade: WeaponMaterialGrade): string {
  return WEAPON_MATERIAL[grade].name;
}

/**
 * **Gatunek DOMYŚLNY — stal.** Wydzielony jako stała, a nie wpisany w trzech
 * miejscach: przy trzecim gatunku (brąz? stal tyglowa?) zmienia się tu jedna
 * linijka, a nie trzy rozsiane literały.
 *
 * ⚠ Broń, która pola nie deklaruje, **nie jest bezgatunkowa** — jest stalowa.
 * To różnica wobec pancerza, gdzie len i skóra gatunku nie mają w ogóle
 * (`null`), bo drabinka metali ich nie dotyczy. Każda broń w tej grze ma głownię
 * albo okucie, więc pytanie zawsze ma sens.
 */
const DEFAULT_GRADE: WeaponMaterialGrade = "steel";

/**
 * Gatunek tej broni, albo `null`, gdy pytanie nie ma sensu (pancerz, surowiec,
 * mikstura).
 *
 * ⚠ Czytane przez `in`, tak samo jak `itemLayer`/`itemMaterial` — pole jest
 * opcjonalne i **jego brak znaczy `steel`**, a nie „nie wiadomo".
 */
export function weaponMaterial(id: ItemId): WeaponMaterialGrade | null {
  const def = getItem(id);
  if (def.type !== "weapon") return null;
  if ("material" in def) return def.material as WeaponMaterialGrade;
  return DEFAULT_GRADE;
}

/**
 * Mnożnik OBRAŻEŃ dla tego gatunku.
 *
 * ⚠⚠ **Mnoży ZAKRES BAZOWY broni, nigdy wynik ciosu** — dokładnie jak
 * `materialDefenseMul` mnoży punkty, a nie redukcję. Dzięki temu gatunek,
 * jakość i stan składają się przemiennie, a płaska premia z Siły
 * (`Progression`) zostaje POZA gatunkiem: żelazna broń ma gorszą głownię,
 * a nie słabszego właściciela.
 */
export function weaponDamageMul(grade: WeaponMaterialGrade | null): number {
  return grade ? WEAPON_MATERIAL[grade].damageMul : 1;
}

/**
 * Mnożnik CENY dla tego gatunku — osobna oś i celowo niższa od `damageMul`.
 *
 * ⚠ **Warunek nietykalny przy każdym strojeniu: `priceMul` NIŻSZY niż
 * `damageMul`.** Inaczej tańszy gatunek jest słabszy **oraz** gorszy na
 * złotówkę, czyli przestaje być wyborem, a staje się pułapką. Ta sama reguła
 * i ten sam powód, co przy pancerzu — pilnuje jej przymiar.
 */
export function weaponMaterialPriceMul(grade: WeaponMaterialGrade | null): number {
  return grade ? WEAPON_MATERIAL[grade].priceMul : 1;
}

/**
 * **Zamek na deklarację `material` po stronie broni.**
 *
 * ⚠ Asercja, która potrafi zaświecić na czerwono — dwa sposoby, na jakie
 * deklaracja bywa CICHYM kłamstwem:
 *  • na przedmiocie, który nie jest bronią — `weaponMaterial` go nie zapyta,
 *    a karta i tak wypisze gatunek. ⚠ Ten przypadek jest od 2026-09-17 JEDYNYM
 *    powodem, dla którego zamek po stronie PANCERZA przepuszcza `type: "weapon"`
 *    (`ArmorMaterials.materialDeclarationProblems`): dwie osie wymieniły się
 *    odpowiedzialnością, żadna jej nie oddała;
 *  • z wartością spoza `WEAPON_MATERIAL` — mnożnik wychodzi `undefined`
 *    i obrażenia robią się `NaN`, co widać dopiero na ekranie postaci.
 *
 * ⚠ Broni z `material` jest dziś zero, więc ta funkcja **nie ma czego zgłosić
 * i to jest poprawny wynik** — stoi tu, żeby pierwszy żelazny kord nie
 * przeszedł niezauważony, jeśli ktoś wpisze `"iron "` ze spacją.
 */
export function weaponMaterialProblems(): string[] {
  const problemy: string[] = [];
  for (const [id, def] of Object.entries(ITEMS) as [string, Record<string, unknown>][]) {
    if (!("material" in def)) continue;
    if (def.type !== "weapon") continue;
    if (!(String(def.material) in WEAPON_MATERIAL)) {
      problemy.push(
        `"${id}" deklaruje material "${String(def.material)}", którego nie ma w WEAPON_MATERIAL ` +
          `— mnożnik wyjdzie undefined, a obrażenia NaN.`,
      );
    }
  }
  return problemy;
}

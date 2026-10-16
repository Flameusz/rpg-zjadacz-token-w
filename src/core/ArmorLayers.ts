import { ARMOR_PROFILE, ITEMS } from "../config/GameConfig";
import type { ArmorType } from "./Protection";
import { getItem, type ItemId } from "./Items";

/**
 * ── WARSTWY PANCERZA ───────────────────────────────────────────────────────
 *
 * ⭐⭐ **WARSTWA JEST MECHANIKĄ od 2026-09-15 (model C).** Adres slotu niesie
 * warstwę (`chest_L1` / `chest_L2` / `chest_L3`), `EQUIP_SLOTS` ma 19 pozycji,
 * a `totalDefense`, `equippedWeight` i `sumBonus` sumują wszystkie warstwy.
 * ⛔ **Do tej daty stało tu „to jest DZIŚ METADANA, nie mechanika" i to jest
 * nieprawda** — ten plik odpowiada dziś na pytanie, POD JAKIM ADRESEM rzecz
 * wyląduje, a nie tylko „na której warstwie by leżała".
 *
 * ⚠⚠ **Warstwy są arytmetycznie RÓWNOWAŻNE — decyzja 2026-09-15**
 * (`docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md`).
 * Punkty ochrony przedmiotu **nie zależą** od jego pozycji w stosie ani od
 * tego, co leży nad nim i pod nim: `PP(L1) + PP(L2) + PP(L3)`, suma zwykła.
 * ⛔ Nie dodawaj mnożników pozycyjnych, „premii L1 pod L3" ani kar za pominiętą
 * warstwę — i **nie szukaj takiego kodu w `Protection.ts`**, bo go tam nie ma.
 * Różnica między warstwami pochodzi WYŁĄCZNIE z katalogu: jakie przedmioty się
 * na nich mieszczą, ile mają punktów, ile ważą, czego wymagają i ile kosztują.
 *
 * ⚠ **TRZY warstwy, nie cztery — zatwierdzona taksonomia, 2026-09-12**
 * (`docs/decyzje/2026-09-12-taksonomia-pancerza.md`). Do tej daty stały tu
 * cztery nazwy materiałowe (`wewnetrzna` / `ochronna` / `metalowa` /
 * `zewnetrzna`), a **kolczuga i płyta dzieliły warstwę `metalowa`**. To
 * czyniło kanoniczny stos „przeszywanica → kolczuga → napierśnik"
 * NIEWYRAŻALNYM: dwie z trzech warstw kolidowały. Kolczuga jest L2.
 *
 * ⚠ **Nazwy są POZYCYJNE (`L1`/`L2`/`L3`), nie materiałowe, i to jest ta
 * naprawa.** Warstwa nazwana „metalowa" zaprasza do pytania „czy kolczuga jest
 * metalowa?" — na które odpowiedź brzmi tak, i dlatego poprzedni model się
 * rozjechał. Pozycja w stosie nie ma takiej dwuznaczności.
 *
 * ⚠ **Warstwa jest własnością PRZEDMIOTU, nie sytuacji.** Przeszywanica
 * noszona sama jest dalej L1, z pustym L2 i L3 — nie „awansuje" na ochronę
 * zasadniczą. `armorType` daje tylko wartość DOMYŚLNĄ; pole `layer` na
 * przedmiocie wygrywa zawsze, a domyślnej mapy nie wolno rozbudowywać
 * o wyjątki — od wyjątków jest to pole.
 */
export type ArmorLayer = "L1" | "L2" | "L3";

/** Kolejność OD CIAŁA NA ZEWNĄTRZ. To jest kolejność rysowania pasków kropek
 *  i przyszła kolejność nakładania — jedno źródło, żeby nie rozjechały się
 *  dwa porządki tej samej listy. */
export const ARMOR_LAYERS: readonly ArmorLayer[] = ["L1", "L2", "L3"];

/**
 * Nazwa warstwy dla gracza.
 *
 * ⚠ Niesie OBA odczyty naraz — pozycyjny („wewnętrzna / pośrednia /
 * zewnętrzna") i funkcjonalny („podkład / ochrona zasadnicza / wzmocnienie") —
 * bo taksonomia definiuje warstwy jednym i drugim, a karta przedmiotu ma
 * miejsce tylko na jedną linię.
 */
export const ARMOR_LAYER_LABEL: Record<ArmorLayer, string> = {
  L1: "L1 · podkład",
  L2: "L2 · ochrona zasadnicza",
  L3: "L3 · wzmocnienie",
};

/**
 * ⭐⭐ **JĘZYK GRACZA — to, co wolno pokazać na ekranie.**
 *
 * ⚠⚠ `ARMOR_LAYER_LABEL` wyżej jest słownikiem SYSTEMU: `L1`/`L2`/`L3` to
 * adresy w modelu, których używa kod, generowany katalog i dokumentacja.
 * ⛔ **Do interfejsu one nie należą** (decyzja autora, 2026-09-19): gracz ma
 * rozumieć „na tej części ciała noszę kilka rzeczy", a nie „mam trzy sloty
 * L1/L2/L3". Kod warstwy nic mu nie mówi, a wygląda jak nazwa slotu — czyli
 * niesie **dokładnie to nieporozumienie**, które sylwetka miała usunąć.
 *
 * ⚠ Dwa słowniki, bo dwie publiczności. ⛔ Nie scalaj ich: `doc_check`
 * i `katalog_ekwipunku.mjs` opisują warstwy adresami i mają tak zostać.
 */
export const ARMOR_LAYER_PLAYER: Record<ArmorLayer, string> = {
  L1: "warstwa spodnia",
  L2: "ochrona zasadnicza",
  L3: "wierzchnie wzmocnienie",
};

/** Krótka nazwa warstwy na przełącznik — od ciała na zewnątrz. */
export const ARMOR_LAYER_SHORT: Record<ArmorLayer, string> = {
  L1: "Spód",
  L2: "Środek",
  L3: "Wierzch",
};

/**
 * Domyślna warstwa dla materiału.
 *
 * ⚠ **`mail` → `L2`, NIE razem z płytą.** To jest cała treść poprawki
 * z 2026-09-12: kolczuga jest giętką ochroną zasadniczą, płyta sztywnym
 * wzmocnieniem, i dopiero przy tym podziale kanoniczny stos trzywarstwowy
 * (przeszywanica → kolczuga → napierśnik) da się w ogóle zapisać.
 *
 * ⚠ **`leather` i `mail` dzielą L2 i to jest POPRAWNE**, nie kompromis: obie
 * są giętką ochroną noszoną jako odzież, a różni je profil obrażeń i masa.
 * Dokładnie tak samo zachowają się przyszła łuska i brygantyna — jedna warstwa
 * może mieć wiele rodzin.
 *
 * ⚠ **Typowane przez `keyof typeof ARMOR_PROFILE`, nie przepisane ręcznie** —
 * ta sama reguła, co przy `DamageType` w `Equipment.ts`. Nowy materiał pancerza
 * NIE SKOMPILUJE SIĘ, dopóki nie dostanie tu warstwy, zamiast po cichu wypaść
 * na `undefined`.
 */
const LAYER_OF_MATERIAL: Record<ArmorType, ArmorLayer> = {
  padded: "L1",
  leather: "L2",
  mail: "L2",
  metal: "L3",
};

/** Asercja startowa: materiał bez warstwy to cicha dziura, nie błąd typów,
 *  gdyby `ARMOR_PROFILE` kiedykolwiek urosło po stronie danych. */
for (const material of Object.keys(ARMOR_PROFILE) as ArmorType[]) {
  if (!LAYER_OF_MATERIAL[material]) {
    console.warn(`[ArmorLayers] Materiał bez warstwy: ${material}`);
  }
}

/**
 * Na której warstwie leży ten przedmiot, albo `null`, gdy pytanie nie ma sensu
 * (broń, pierścień, surowiec).
 *
 * Czytane przez `in`, tak samo jak `itemHands`/`itemRequirements` — `ITEMS`
 * jest `as const`, a pole `layer` występuje dziś na ZERU przedmiotów. To jest
 * poprawny stan, nie brak: domyślna mapa materiałów odpowiada za wszystkie
 * dwadzieścia trzy istniejące pancerze.
 *
 * ⚠⚠ **Odpowiada także dla slotów NIEWARSTWOWANYCH** (rękawice, naramienniki,
 * druga ręka) — warstwowane są cztery obszary ciała (`LAYERED_AREAS`
 * w `Equipment.ts`), a **filtruje PYTAJĄCY**. Wycinanie tego tutaj znaczyłoby,
 * że ten plik musi znać listę slotów, czyli cudzą domenę.
 *
 * ⛔⛔ **I to jest kontrakt, który wolno złamać tylko w jedną stronę.**
 * 2026-09-19 karta przedmiotu zapytała bez filtra i napisała graczowi
 * „Pancerz · Druga ręka · **L2 · ochrona zasadnicza**" na drewnianej pawęży:
 * u tarcz `armorType` jest decyzją o PROFILU OBRAŻEŃ (deska z okuciem jest
 * mechanicznie skórą albo metalem — `docs/systemy/shields.md` §1), więc
 * wyprowadzona z niego warstwa jest tam **fikcją**. Wzorzec poprawnego
 * pytania — trzy miejsca, z których każde filtruje u siebie:
 * `Equipment.armorAddress`, `Save` i `tools/katalog_ekwipunku.mjs`.
 * Pilnuje tego `T1`–`T3` w `tools/karta_przedmiotu.mjs`.
 */
export function itemLayer(id: ItemId): ArmorLayer | null {
  const def = getItem(id);
  if ("layer" in def) return def.layer as ArmorLayer;
  if (def.type !== "armor") return null;
  return "armorType" in def ? LAYER_OF_MATERIAL[def.armorType as ArmorType] ?? null : null;
}

/**
 * **Zamek na DEKLARACJĘ `layer`** — czy pole postawione na przedmiocie w ogóle
 * ma gdzie zadziałać.
 *
 * ⚠⚠ **Nie sprawdza, czy warstwa „pasuje" do materiału, i nie może.** Pole
 * `layer` istnieje dokładnie po to, żeby być WYJĄTKIEM od domyślnej mapy
 * materiałów (brygantyna, szyna, przyszła łuska) — reguła „ma się zgadzać
 * z materiałem" zabiłaby jego jedyny powód istnienia. Ten zamek pyta o coś
 * innego i węższego: **czy deklaracja ma jakikolwiek skutek**.
 *
 * Trzy sposoby, na jakie `layer` bywa CICHYM kłamstwem:
 *  • na przedmiocie, który nie jest pancerzem — `armorAddress` nigdy go nie
 *    zapyta, a karta przedmiotu i tak wypisze „Warstwa: …";
 *  • na pancerzu spoza obszaru warstwowanego (rękawice, tarcza) — adres nie ma
 *    sufiksu, więc deklaracja jest ignorowana **bez śladu**;
 *  • z wartością spoza `ARMOR_LAYERS` — `layeredSlot` skleiłby adres, którego
 *    nie ma w `EQUIP_SLOTS`, czyli przedmiot nie do założenia.
 *
 * ⚠ **Dziś `layer` nie występuje na ŻADNYM z 32 pancerzy**, więc zamek zwraca
 * pustą listę i zaświeci dopiero przy pierwszym użyciu pola — o to chodzi.
 * Bierze listę obszarów parametrem, żeby nie importować `Equipment` (to jest
 * cykl: `Equipment` → `ArmorLayers`).
 */
export function layerDeclarationProblems(
  layeredAreas: readonly string[],
  items: Record<string, unknown> = ITEMS,
): string[] {
  const problemy: string[] = [];
  for (const [id, raw] of Object.entries(items)) {
    const def = raw as { type?: string; slot?: string; layer?: string };
    if (!("layer" in def) || def.layer === undefined) continue;
    if (def.type !== "armor") {
      problemy.push(`${id}: pole \`layer\` na przedmiocie typu "${def.type}" — nikt o nie nie zapyta`);
      continue;
    }
    if (!ARMOR_LAYERS.includes(def.layer as ArmorLayer)) {
      problemy.push(`${id}: \`layer: "${def.layer}"\` spoza ${ARMOR_LAYERS.join("/")}`);
      continue;
    }
    if (!layeredAreas.includes(def.slot ?? "")) {
      problemy.push(`${id}: \`layer\` na slocie "${def.slot}", który nie ma warstw — deklaracja bez skutku`);
    }
  }
  return problemy;
}

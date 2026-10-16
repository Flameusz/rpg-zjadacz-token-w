import { ITEM_SETS, ITEMS } from "../config/GameConfig";
import { getItem, type ItemId } from "./Items";

export type SetId = keyof typeof ITEM_SETS;
export type SetDef = (typeof ITEM_SETS)[SetId];
export type SetTier = SetDef["tiers"][number];

/** Premia, jakiej zestaw może udzielić. **Ta sama unia, co `bonus` na
 *  przedmiocie** (`Equipment.BonusKey`) — i to jest wymóg, nie zbieg
 *  okoliczności: zestaw sumuje się tym samym kanałem, co pierścień, więc nie
 *  może umieć niczego, czego nie umie pierścień. */
export type SetBonusKey = "maxHp" | "critChance" | "attackSpeed" | "defense";

/**
 * ── ZESTAWY: LICZENIE ──────────────────────────────────────────────────────
 *
 * Dane (nazwy, progi, premie) mieszkają w `ITEM_SETS` w `GameConfig.ts`, bo są
 * balansem. Tutaj jest wyłącznie logika: kto należy, ile masz, co z tego wynika.
 *
 * ⚠⚠ **Liczone są MIEJSCA, nie sztuki — reguła `(set, area)`, decyzja
 * 2026-09-15** (`docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md`).
 * **Jeden obszar ciała wnosi do danego zestawu najwyżej jeden element.** Trzy
 * warstwy torsu to trzy adresy, ale jedno MIEJSCE — więc zestaw, którego trzech
 * członków da się założyć jeden na drugim, liczy z torsu jeden element, a nie
 * trzy. ⛔ Do 2026-09-15 liczyły się sztuki i wtedy próg „2 szt." dawał się
 * spełnić JEDNYM obszarem ciała.
 *
 * ⭐ **Na katalogu z dnia decyzji ta reguła jest ZEROWA** — cztery istniejące
 * zestawy mają po pięciu członków w pięciu RÓŻNYCH obszarach, więc żadna liczba
 * się nie zmieniła. Zamek (`tools/zestawy_przymiar.mjs`) świeci na czerwono
 * dopiero przy pierwszym zestawie PIONOWYM i dokładnie po to istnieje.
 *
 * ⛔⛔ **Ten plik NIE CZYTA `layer` i nie wolno mu tego dodać.** Klucz grupujący
 * bierze się z ADRESU wyposażenia (`Equipment.placeOfSlot`), nie z warstwy
 * przedmiotu — `D4` (`set` ⊥ `layer`) mówi wprost, że powiązania zestawu
 * z warstwą tworzyć nie wolno. Reguła „licz tylko jedną warstwę" jest z nim
 * sprzeczna i została odrzucona.
 *
 * ⚠ **Zestaw nie zna swoich slotów i nie ma ich znać.** Członkostwo jest
 * TAGIEM na przedmiocie (`ITEMS[x].set`), nie listą w definicji zestawu — więc
 * zestaw „4 z sześciu" i zestaw „2 z pięciu" to ta sama struktura, a dodanie
 * członka jest jednym polem na przedmiocie. Lista w definicji byłaby drugą
 * kopią tej samej prawdy i rozjechałaby się przy pierwszym nowym przedmiocie.
 */

/**
 * Jeden **element** na potrzeby liczenia zestawu: co jest założone i JAKIE
 * MIEJSCE to wnosi.
 *
 * ⚠ `place` to adres wyposażenia z **warstwą zwiniętą do obszaru**
 * (`chest_L2` → `chest`); sloty niewarstwowe zostają sobą, więc `ring1`
 * i `ring2` są dwoma różnymi miejscami i dwa jednakowe pierścienie liczą się
 * dwa razy. Słownik miejsc produkuje `Equipment.placeOfSlot` — ⚠ `placesOfItem`
 * niżej musi mówić **tym samym słownikiem**, a pilnuje tego przymiar.
 */
export interface WornElement {
  readonly place: string;
  readonly itemId: ItemId;
}

/** Do którego zestawu należy ten przedmiot, albo `null`. Czytane przez `in`,
 *  tak samo jak `itemHands`/`itemFamily` — `ITEMS` jest `as const`, a pole
 *  występuje tylko na części przedmiotów. */
export function itemSet(id: ItemId): SetId | null {
  const def = getItem(id);
  if (!("set" in def)) return null;
  const set = def.set as string;
  // Literówka w tagu nie może wywalić gry (niezmiennik „gra ZAWSZE się
  // uruchamia"), ale ma krzyczeć w konsoli — inaczej przedmiot po cichu
  // wypada ze swojego kompletu i nikt tego nie zauważy poza graczem.
  if (!(set in ITEM_SETS)) {
    warnUnknownSet(id, set);
    return null;
  }
  return set as SetId;
}

const warnedUnknown = new Set<string>();
function warnUnknownSet(id: ItemId, set: string): void {
  if (warnedUnknown.has(set)) return;
  warnedUnknown.add(set);
  console.warn(`[ItemSets] Przedmiot ${id} wskazuje na nieistniejący zestaw "${set}"`);
}

export function setDef(id: SetId): SetDef {
  return ITEM_SETS[id];
}

/**
 * **MIEJSCA, jakie ten przedmiot może zająć** — słownik wspólny
 * z `Equipment.placeOfSlot`.
 *
 * ⚠ Pancerz deklaruje `slot` jako OBSZAR (`chest`, `gloves`), czyli dokładnie
 * to, czym jest miejsce — warstwa nie pojawia się tu ani razu i pojawić się nie
 * może. ⚠ Pierścień ma DWA miejsca, bo naprawdę da się nosić dwa jednakowe;
 * to jedyny przedmiot, który wnosi do zestawu więcej niż jeden element.
 */
function placesOfItem(id: ItemId): readonly string[] {
  const def = getItem(id);
  if (def.type === "armor") return [def.slot as string];
  if (def.type === "weapon") return ["weapon"];
  if (def.type === "ring") return ["ring1", "ring2"];
  if (def.type === "amulet") return ["amulet"];
  return [];
}

/**
 * **Ile ELEMENTÓW da się z tego zestawu zdobyć** — mianownik „4/5" na karcie.
 *
 * ⚠⚠ **To NIE jest liczba członków.** Od reguły `(set, area)` mianownikiem jest
 * liczba odrębnych MIEJSC, jakie członkowie mogą zająć: zestaw z przeszywanicą
 * i kolczugą ma dwóch członków, ale oba wchodzą w tors, więc da się z nich
 * zdobyć **jeden** element. Liczenie członków pokazywałoby nieosiągalne „4/6",
 * czyli pasek postępu obiecujący coś, czego nie ma jak zrobić.
 *
 * Liczone z `ITEMS`, nie deklarowane, więc nowy przedmiot z tagiem podnosi je
 * sam.
 */
export function setSize(id: SetId): number {
  const places = new Set<string>();
  for (const itemId of membersOf(id)) for (const p of placesOfItem(itemId)) places.add(p);
  return places.size;
}

let memberCache: Map<SetId, ItemId[]> | null = null;
function membersOf(id: SetId): ItemId[] {
  if (!memberCache) {
    memberCache = new Map();
    for (const key of Object.keys(ITEM_SETS) as SetId[]) memberCache.set(key, []);
    for (const itemId of allItemIds()) {
      const set = itemSet(itemId);
      if (set) memberCache.get(set)!.push(itemId);
    }
  }
  return memberCache.get(id) ?? [];
}

/** Jedyne miejsce w tym pliku, które czyta `ITEMS` jako CAŁOŚĆ — reszta idzie
 *  przez `getItem`. Wynik jest zapamiętany w `memberCache`, więc ta pętla
 *  chodzi raz na sesję, a nie przy każdym odświeżeniu panelu. */
function allItemIds(): ItemId[] {
  return Object.keys(ITEMS) as ItemId[];
}

/** Stan jednego zestawu u gracza — to, co rysuje panel. */
export interface SetProgress {
  id: SetId;
  name: string;
  /** Ile MIEJSC tego zestawu gracz obsadził — nie ile sztuk ma na sobie. */
  worn: number;
  /** Ile elementów da się z zestawu zdobyć — patrz `setSize`. */
  total: number;
  /** Progi z zaznaczeniem, które są już czynne. */
  tiers: { count: number; text: string; active: boolean }[];
}

/**
 * Policz zestawy z listy WYPOSAŻONYCH elementów.
 *
 * ⚠ **Bierze listę, a nie sięga do `Equipment`, i to jest celowe** — dzięki
 * temu ten sam kod odpowiada na „co mam teraz" i na „co bym miał, gdybym
 * założył to zamiast tamtego". Funkcja sięgająca do stanu globalnego umiałaby
 * tylko pierwsze z tych dwóch pytań.
 *
 * ⚠ **Liczone są odrębne MIEJSCA**, więc dwie sztuki tego samego zestawu
 * w jednym obszarze (dwie warstwy torsu) dają jeden element, a nie dwa.
 *
 * Zwraca WYŁĄCZNIE zestawy, z których gracz ma choć jeden element — pusta lista
 * jest poprawną odpowiedzią i panel ma wtedy co powiedzieć („nie nosisz
 * żadnego"), zamiast wypisywać cztery zera.
 */
export function setProgressFor(worn: readonly WornElement[]): SetProgress[] {
  const places = new Map<SetId, Set<string>>();
  for (const { place, itemId } of worn) {
    const set = itemSet(itemId);
    if (!set) continue;
    let zajete = places.get(set);
    if (!zajete) places.set(set, (zajete = new Set<string>()));
    zajete.add(place);
  }
  const out: SetProgress[] = [];
  for (const [id, zajete] of places) {
    const def = ITEM_SETS[id];
    const ile = zajete.size;
    out.push({
      id,
      name: def.name,
      worn: ile,
      total: setSize(id),
      tiers: def.tiers.map((t) => ({ count: t.count, text: t.text, active: ile >= t.count })),
    });
  }
  // Najpierw najbardziej zaawansowane — w późnej grze lista ma zaczynać się od
  // tego, na czym stoi build, a nie od przypadkowej jednej sztuki.
  out.sort((a, b) => b.worn - a.worn || a.name.localeCompare(b.name, "pl"));
  return out;
}

/**
 * Suma premii ze wszystkich czynnych progów, w jednym kanale.
 *
 * ⚠ **Progi SUMUJĄ się, nie zastępują** (2 i 4 razem, gdy nosisz cztery) —
 * inaczej czwarty element odbierałby premię drugiego i „więcej kompletu"
 * bywałoby gorsze. To jest ta sama reguła, którą stosuje WoW i Diablo, i jedyna,
 * przy której gracz nigdy nie musi liczyć, czy mu się opłaca.
 *
 * ⛔ **Premie są dziś PUSTE** (`bonus: {}`, `OI-94`), więc ta funkcja zwraca
 * zero. ⚠ Zanim dostaną treść, trzeba rozstrzygnąć `OI-104`: od modelu C trzy
 * zestawy materiałowe mogą być częściowo czynne JEDNOCZEŚNIE (L1 + L2 + L3),
 * bo leżą na rozłącznych warstwach. Pierwsza liczba wpisana przed tą decyzją
 * zostanie wpisana w złej skali.
 */
export function setBonusFor(
  worn: readonly WornElement[],
  key: SetBonusKey,
): number {
  let total = 0;
  for (const progress of setProgressFor(worn)) {
    const def = ITEM_SETS[progress.id];
    for (const tier of def.tiers) {
      if (progress.worn < tier.count) continue;
      const bonus = tier.bonus as Partial<Record<SetBonusKey, number>>;
      total += bonus[key] ?? 0;
    }
  }
  return total;
}

import { getItem, itemFootprint, itemGrip, itemHands, type ItemId } from "../core/Items";
import { Equipment, LAYERED_AREAS, type ArmorItemSlot, type GearSlot, type LayeredArea } from "../core/Equipment";
import { ARMOR_LAYER_PLAYER, itemLayer } from "../core/ArmorLayers";
import { itemMaterial, materialLabel } from "../core/ArmorMaterials";
import { weaponMaterial, weaponMaterialLabel } from "../core/WeaponMaterials";
import { itemSet, setDef, setSize } from "../core/ItemSets";
import { Inventory } from "../core/Inventory";
import { ATTRIBUTE_LABEL, Progression, type Attribute } from "../core/Progression";
import { EQUIPMENT, EQUIPMENT_LOAD, SHIELD } from "../config/GameConfig";
import {
  buyPriceOf,
  conditionMul,
  describeQuality,
  durabilityOf,
  formatStat,
  hasDurability,
  instanceDamage,
  instanceDefense,
  instanceRequirements,
  isDestroyed,
  maxDurabilityOfInstance,
  qualityColorHex,
  qualityMul,
  qualityOf,
  sellPriceOf,
  type ItemInstance,
} from "../core/Quality";

/**
 * ── KARTA PRZEDMIOTU JAKO DANE ─────────────────────────────────────────────
 *
 * ⚠⚠ **Po co ten plik powstał (2026-09-19).** Opis przedmiotu istniał w grze
 * jako **płaska lista linijek** budowana wprost w `ItemTooltip.rebuild()`:
 * dwadzieścia kilka `lines.push({text, color})` jedna pod drugą. Dopóki karta
 * była dymkiem przy kursorze, to wystarczało. Panel handlu dostał **własną
 * kolumnę szczegółów** z sekcjami, tabelą porównania i przyklejonym do dołu
 * pasem ceny — a tego z płaskiej listy linijek nie da się złożyć, bo nie wie
 * ona, gdzie kończy się „obrona", a zaczyna „stan".
 *
 * ⚠ **JEDNO wydobycie danych — i to jest cała zasada tego pliku.**
 * `buildItemCard()` czyta katalog i egzemplarz; `ShopDetails` rysuje z tego
 * kolumnę (sklep i panel gracza). Do etapu F (2026-10-13) był też drugi
 * renderer — dymek `ItemTooltip`, spłaszczający kartę do linijek. ⛔ Nie
 * dopisuj statystyki do renderera — dopisz ją tutaj. Dwa niezależne opisy tego
 * samego przedmiotu rozjeżdżają się w tym projekcie zawsze („Blok:" w dawnym
 * dymku przez trzy tygodnie pokazywał pełny procent rozbitej tarczy).
 *
 * ⚠ **Plik jest CZYSTY — zero Phasera.** Sprawdza go `node tools/karta_przedmiotu.mjs`
 * bez uruchamiania gry: puste sekcje, brakujące ceny, porównanie bez odpowiednika.
 */

/** Odczyt semantyczny wartości — renderer dobiera kolor, nie odwrotnie. */
export type CardTone = "plain" | "muted" | "good" | "bad" | "warn" | "gold" | "info";

export interface CardStat {
  readonly label: string;
  readonly value: string;
  readonly tone?: CardTone;
}

/** Zdanie bez pary „etykieta : wartość" (ostrzeżenie, warunek, opis progu). */
export interface CardNote {
  readonly text: string;
  readonly tone?: CardTone;
}

export interface CardSection {
  readonly title: string;
  readonly stats: readonly CardStat[];
  readonly notes: readonly CardNote[];
}

/** Jeden wiersz tabeli porównania: ta sama wielkość po obu stronach. */
export interface CardCompareRow {
  readonly label: string;
  readonly mine: string;
  readonly theirs: string;
  /** Znak decyduje o kolorze; `0` = bez różnicy. */
  readonly delta: number;
}

/**
 * Jeden blok porównania: nowa rzecz ZAMIAST tego, co leży w jednym miejscu.
 *
 * ⭐ **D10 (etap E, 2026-10-13): broń, tarcza i pierścień porównują się
 * z OBOMA miejscami** — zestaw I i II, pierścień I i II. Do tej daty karta
 * porównywała wyłącznie z `slotForItem` (zestaw I), więc przy przycisku
 * „Załóż · Zestaw II" gracz nie widział, co tam leży.
 */
export interface CardCompare {
  /** „Zestaw I", „Pierścień II" — pusty, gdy cel jest jeden (pancerz, amulet). */
  readonly target: string;
  /** `null` = miejsce WOLNE: rzecz weszłaby tam bez zamiany. */
  readonly wornName: string | null;
  readonly wornQuality: string;
  readonly rows: readonly CardCompareRow[];
}

export interface ItemCard {
  readonly itemId: ItemId;
  readonly name: string;
  /** „Pancerz · Klatka piersiowa" — czym to JEST i gdzie wchodzi. */
  readonly typeLine: string;
  /** „Zwykła", „Mistrzowska" — puste dla rzeczy bez wykonania. */
  readonly quality: string;
  readonly qualityColor: string;
  /** Ile sztuk gracz ma przy sobie (cały plecak, nie jeden stos). */
  readonly owned: number;
  /**
   * ⭐ **Gabaryt w polach** — ta sama liczba, którą rządzi się plecak, półka
   * i kafel ręki. Karta niesie ją, żeby PODGLĄD też mógł pokazać przedmiot
   * w prawdziwej proporcji. ⛔ Nie licz go w rendererze z rozmiaru rysunku:
   * osiemnaście tarcz `1×2` ma ikonę 32×32.
   */
  readonly footprint: { readonly w: number; readonly h: number };
  /**
   * Opis przedmiotu — ⚠ **PUSTY dla rzeczy ze statystykami** (broń, pancerz,
   * tarcza, pierścień, amulet, torba; decyzja autora 2026-10-12). Na telefonie
   * opis takiej rzeczy wypychał porównanie i liczby, o które gracz naprawdę
   * pyta. Zostaje dla zioła, surowca, mikstury i rzeczy z zadania — tam opis
   * JEST informacją. Teksty w `ITEMS` zostają nietknięte: czekają na dziennik
   * albo bestiariusz (`SHOWS_DESCRIPTION`).
   */
  readonly description: string;
  readonly sections: readonly CardSection[];
  /**
   * Bloki porównania — 0, 1 albo 2 (D10). ⚠ Pusta lista, gdy nie ma z czym
   * porównać (nic nie noszone w żadnym z miejsc); wolne miejsce obok zajętego
   * daje blok z `wornName: null`.
   */
  readonly compares: readonly CardCompare[];
  /** Cena kupna tego egzemplarza; `null`, gdy nie ma go na żadnej półce. */
  readonly buyPrice: number | null;
  readonly sellPrice: number;
  /** Czy gracz spełnia wszystkie wymagania — do wyszarzenia „Kup". */
  readonly requirementsMet: boolean;
}

/** Rodzaje przedmiotów, których karta pokazuje opis — te BEZ statystyk.
 *  Wszystko inne ma liczby, a opis tylko je wypycha (patrz `description`). */
const SHOWS_DESCRIPTION: ReadonlySet<string> = new Set(["material", "consumable"]);

const TYPE_LABEL: Record<string, string> = {
  material: "Surowiec",
  consumable: "Eliksir",
  weapon: "Broń",
  armor: "Pancerz",
  ring: "Pierścień",
  amulet: "Amulet",
  container: "Torba",
};

/** ⚠ Pełny `Record`, nie `Record<string, string>` — nowy obszar pancerza NIE
 *  skompiluje się bez nazwy. Tak samo, jak w dawnym dymku `ItemTooltip` (tam
 *  luźny typ dał na zrzucie „Slot: undefined"). */
const SLOT_LABEL: Record<ArmorItemSlot, string> = {
  offhand: "Druga ręka",
  head: "Głowa",
  chest: "Klatka piersiowa",
  gloves: "Dłonie",
  shoulders: "Ramiona",
  legs: "Nogi",
  boots: "Buty",
};

const BONUS_LABEL: Record<string, string> = {
  maxHp: "Punkty życia",
  critChance: "Szansa na kryt.",
  attackSpeed: "Szybkość ataku",
  defense: "Obrona",
};

/* ══ WSPÓLNE RACHUNKI TARCZY ═════════════════════════════════════════════ */

/**
 * Procent bloku TEGO egzemplarza (jakość × stan).
 *
 * ⚠⚠ **Jedno miejsce, bo `Equipment.blockSpec` liczy to WYŁĄCZNIE dla tarczy
 * ZAŁOŻONEJ** (czyta `this.offhand`), a karta opisuje egzemplarz z półki albo
 * z plecaka. Do 2026-09-19 wzór stał drugi raz w `ItemTooltip`; trzecia kopia
 * powstałaby w kolumnie szczegółów sklepu. ⛔ Nie licz tego u siebie.
 */
export function shieldReductionOf(inst: ItemInstance): number | null {
  const def = getItem(inst.itemId);
  if (!("block" in def)) return null;
  return def.block.reduction * (1 + qualityMul("defense", qualityOf(inst))) * conditionMul(inst);
}

/**
 * Udźwig bloku TEGO egzemplarza — bliźniak `Equipment.blockCapacity`
 * (masa × jakość × stan) dla sztuki, której nikt nie trzyma w ręce.
 */
export function shieldCapacityOf(inst: ItemInstance): number | null {
  const def = getItem(inst.itemId);
  if (!("block" in def)) return null;
  const kg = "weight" in def ? def.weight : 0;
  return (
    (SHIELD.block.capacityBase + SHIELD.block.capacityPerKg * kg) *
    (1 + qualityMul("defense", qualityOf(inst))) *
    conditionMul(inst)
  );
}

/* ══ BUDOWA KARTY ════════════════════════════════════════════════════════ */

interface SectionDraft {
  title: string;
  stats: CardStat[];
  notes: CardNote[];
}

/**
 * Zbuduj kartę dla KONKRETNEGO egzemplarza.
 *
 * ⚠ **Egzemplarz, nie typ przedmiotu.** Wszystkie liczby są po wykonaniu
 * i zużyciu — karta opisująca „wzorcowy miecz" opisywałaby inny miecz niż ten,
 * który gracz trzyma albo za chwilę kupi.
 *
 * ⚠ **Puste sekcje NIE powstają** (wymóg wprost: *nie pokazuj pustych
 * sekcji*): sekcja bez ani jednej statystyki i notatki nie trafia do wyniku.
 */
export function buildItemCard(inst: ItemInstance): ItemCard {
  const itemId = inst.itemId;
  const def = getItem(itemId);
  const gear = def.type === "weapon" || def.type === "armor";
  const sections: SectionDraft[] = [];
  const push = (title: string): SectionDraft => {
    const s: SectionDraft = { title, stats: [], notes: [] };
    sections.push(s);
    return s;
  };

  /* ── co to jest i gdzie wchodzi ─────────────────────────────────────── */
  // ⭐⭐ **TARCZA TO TARCZA, NIE PANCERZ** (2026-09-19, zgłoszone z renderu).
  //   W danych tarcza jest `type: "armor"`, bo dzieli z pancerzem profil
  //   obrażeń i slot — ale to jest szczegół MODELU, a wiersz tożsamości mówi
  //   graczowi, CZYM rzecz jest. ⛔ Nie „upraszczaj" tego z powrotem do
  //   `TYPE_LABEL[def.type]`: karta pisała wtedy „Pancerz · Druga ręka".
  const tarcza = "block" in def;
  // ⚠ Jedzenie (leczenie rozłożone w czasie) to nie eliksir — chleb pisał się
  //   „Eliksir", co na liście kupca karczmarza czytało się jak pomyłka.
  const jedzenie = def.type === "consumable" && "healOverTime" in def;
  const typeCzesci: string[] = [tarcza ? "Tarcza" : jedzenie ? "Jedzenie" : (TYPE_LABEL[def.type] ?? def.type)];
  if (def.type === "armor") typeCzesci.push(SLOT_LABEL[def.slot]);
  // ⭐⭐ **Warstwa stoi w wierszu TOŻSAMOŚCI, nie wśród statystyk** (2026-09-19).
  //   `L2 · ochrona zasadnicza` odpowiada na pytanie „czym ta rzecz jest
  //   w stosie pancerza", a nie „ile daje" — a sylwetka nie pokazuje już
  //   warstw jako slotów, więc to jedyne miejsce, w którym gracz je czyta.
  //
  // ⚠⚠ **PYTA TYLKO ZA CZTERY OBSZARY CIAŁA** — i to jest cała naprawa
  //   z 2026-09-19. `itemLayer()` odpowiada dla KAŻDEGO pancerza (tak jest
  //   napisana i tak ma być: filtruje PYTAJĄCY), więc bez tego warunku karta
  //   wyprowadzała warstwę z `armorType`, który u tarcz jest decyzją o PROFILU
  //   OBRAŻEŃ, nie o stosie. Drewniana pawęż dostawała „L2 · ochrona
  //   zasadnicza", żelazna „L3 · wzmocnienie" — 30 tarcz, 5 par rękawic
  //   i 4 naramienniki kłamały o warstwie, której nie mają.
  //   ⛔ Nie naprawiaj tego w `itemLayer()`: zmusiłbyś `ArmorLayers` do
  //   znajomości listy slotów, a `Equipment.armorAddress` i `Save` już dziś
  //   filtrują tak samo. Ta sama reguła stoi w `tools/katalog_ekwipunku.mjs`.
  const warstwa =
    def.type === "armor" && LAYERED_AREAS.includes(def.slot as LayeredArea)
      ? itemLayer(itemId)
      : null;
  // ⛔ **Nazwa po ludzku, nie adres systemowy** (2026-09-19): „wierzchnie
  //   wzmocnienie", nie „L3 · wzmocnienie". Kod warstwy wygląda jak nazwa
  //   slotu i sam z siebie tworzy nieporozumienie „mam trzy sloty".
  if (warstwa) typeCzesci.push(ARMOR_LAYER_PLAYER[warstwa]);
  const typeLine = typeCzesci.join(" · ");

  /* ── ATAK ───────────────────────────────────────────────────────────── */
  if (def.type === "weapon") {
    const s = push("ATAK");
    const dmg = instanceDamage(inst);
    if (dmg) {
      const avg = (dmg.min + dmg.max) / 2;
      s.stats.push({
        label: "Obrażenia",
        value: `${Math.round(dmg.min)}–${Math.round(dmg.max)}`,
        tone: "plain",
      });
      // ⚠ Średnia z miejscem po przecinku: dwa sąsiednie poziomy jakości
      //   potrafią mieć te same zaokrąglone krańce i **tylko ta liczba** je
      //   odróżnia (patrz `formatStat`).
      s.stats.push({ label: "Średnio", value: formatStat(avg), tone: "muted" });
    }
    // ⭐ Gatunek stali/żelaza: nazwy są asymetryczne („Kord" nie mówi, że
    //   stalowy), więc to ta linia niesie prawdę o materiale.
    const gatunek = weaponMaterial(itemId);
    if (gatunek && gatunek !== "steel") {
      s.stats.push({ label: "Materiał", value: weaponMaterialLabel(gatunek), tone: "muted" });
    }
    // ⚠ Martwa strefa — **jedyna własność, która POGARSZA broń** i do
    //   2026-09-17 nie była nigdzie napisana.
    const martwa = "melee" in def ? ((def.melee as { minReach?: number }).minReach ?? 0) : 0;
    if (martwa > 0) {
      s.notes.push({ text: `Nie trafia bliżej niż ${martwa}`, tone: "warn" });
    }
    if (itemGrip(itemId) === "either") {
      s.notes.push({ text: "Jedna lub obie ręce", tone: "info" });
      const oh = "oneHanded" in def ? def.oneHanded : null;
      const kary: string[] = [];
      if (oh && "damageMul" in oh) kary.push(`obrażenia ×${formatStat(oh.damageMul)}`);
      if (oh && "minReachAdd" in oh) kary.push(`martwa strefa ${martwa + oh.minReachAdd}`);
      // ⚠ „Jedną ręką", NIE „z tarczą" (`OI-122`): chwyt pyta, czy druga ręka
      //   jest ZAJĘTA, a nie co w niej leży.
      if (kary.length) s.notes.push({ text: `Jedną ręką: ${kary.join(", ")}`, tone: "warn" });
    } else if (itemHands(itemId) === 2) {
      s.notes.push({ text: "Dwuręczna — zajmuje drugą rękę", tone: "warn" });
    }
  }

  /* ── OCHRONA ────────────────────────────────────────────────────────── */
  if (def.type === "armor") {
    const s = push("OCHRONA");
    s.stats.push({ label: "Obrona", value: `+${formatStat(instanceDefense(inst))}`, tone: "plain" });
    const red = shieldReductionOf(inst);
    if (red !== null && "block" in def) {
      // ⚠ Z jednostką I WARUNKIEM, nigdy samą liczbą: gołe „Blok: 30" może
      //   znaczyć cztery różne mechaniki (`docs/systemy/shields.md` §B.11).
      s.stats.push({ label: "Blok", value: `${Math.round(red * 100)}%`, tone: "info" });
      const udzwig = shieldCapacityOf(inst);
      if (udzwig !== null) {
        s.stats.push({ label: "Udźwig", value: `${udzwig.toFixed(1)} pkt`, tone: "info" });
      }
      s.stats.push({
        label: "Zamach",
        value: `−${Math.round((1 - 1 / def.block.swingMul) * 100)}% tempa`,
        tone: "bad",
      });
      s.notes.push({ text: "Blokuje od strony, w którą patrzysz", tone: "muted" });
      s.notes.push({ text: "Cięższy cios przebija udźwig", tone: "muted" });
    }
    const material = itemMaterial(itemId);
    if (material) s.stats.push({ label: "Materiał", value: materialLabel(material), tone: "muted" });
  }

  /* ── DZIAŁANIE (eliksiry i jedzenie) ────────────────────────────────── */
  if (def.type === "consumable") {
    const s = push("DZIAŁANIE");
    if ("healOverTime" in def) {
      const secs = Math.round(def.healOverTime.durationMs / 1000);
      s.stats.push({ label: "Leczy", value: `${def.healOverTime.amount} PŻ / ${secs}s`, tone: "good" });
      // Nie ozdoba: jedzenie przerywa KAŻDE trafienie, a gracz, który tego nie
      // wie, uzna to za błąd gry.
      s.notes.push({ text: "Tylko poza walką — trafienie przerywa", tone: "warn" });
    } else {
      s.stats.push({ label: "Leczy", value: `${def.healAmount} PŻ`, tone: "good" });
    }
  }

  /* ── PREMIE (biżuteria) ─────────────────────────────────────────────── */
  if ("bonus" in def) {
    const s = push("PREMIE");
    for (const [key, value] of Object.entries(def.bonus as Record<string, number>)) {
      const procent = key === "critChance" || key === "attackSpeed";
      s.stats.push({
        label: BONUS_LABEL[key] ?? key,
        value: procent ? `+${Math.round(value * 100)}%` : `+${value}`,
        tone: "good",
      });
    }
  }

  /* ── POJEMNOŚĆ (torby) ──────────────────────────────────────────────── */
  if (def.type === "container") {
    push("POJEMNOŚĆ").stats.push({ label: "Miejsca", value: `+${def.containerSlots}`, tone: "good" });
  }

  /* ── STAN: trwałość, masa, obciążenie ───────────────────────────────── */
  // ⚠ Porównanie liczone PRZED stanem: gdy istnieje, prognoza obciążenia
  //   mieszka w nim (osobno dla każdego miejsca — D10), a nie w STANIE.
  const compares = buildCompares(inst);
  const stan: SectionDraft = { title: "STAN", stats: [], notes: [] };
  if (hasDurability(itemId)) {
    const cur = durabilityOf(inst);
    const max = maxDurabilityOfInstance(inst);
    stan.stats.push({
      label: "Trwałość",
      value: `${cur} / ${max}`,
      tone: cur <= 0 ? "bad" : cur <= max * 0.25 ? "warn" : "plain",
    });
    if (isDestroyed(inst)) {
      // Wyprowadzone z konfiguracji, nigdy wpisane: „o połowę" zaczęłoby
      // kłamać przy pierwszym strojeniu.
      const weaker = Math.round((1 - EQUIPMENT.durability.destroyedMultiplier) * 100);
      stan.notes.push({ text: `Zniszczona — słabsza o ${weaker}%`, tone: "bad" });
    }
  }
  if ("weight" in def) {
    stan.stats.push({ label: "Masa", value: formatStat(def.weight), tone: "plain" });
    // ⚠ Prognoza („po założeniu") NIE dotyczy sztuki już noszonej — tam ta sama
    //   liczba stoi na ekranie postaci i nie jest żadną hipotezą.
    //   `isWorn`, nie `Equipment[slot] === inst`: zestaw schowany też waży.
    // ⭐ Przy porównaniu prognoza stoi W BLOKU porównania („Obciążenie po →
    //   teraz", osobno dla zestawu I i II) — tu byłaby trzecią, niezwiązaną
    //   z żadnym miejscem liczbą.
    if (!Equipment.isWorn(inst) && compares.length === 0) {
      const slot = Equipment.slotForItem(itemId);
      const worn = slot ? Equipment[slot] : null;
      const wornDef = worn ? getItem(worn.itemId) : null;
      const wornWeight = wornDef && "weight" in wornDef ? wornDef.weight : 0;
      const po = Math.max(0, Equipment.equippedWeight - wornWeight + def.weight);
      const udzwig = Equipment.loadCapacity;
      const ratio = udzwig > 0 ? po / udzwig : 0;
      const klasa =
        ratio > EQUIPMENT_LOAD.heavyAbove ? "heavy" : ratio > EQUIPMENT_LOAD.mediumAbove ? "medium" : "light";
      stan.stats.push({
        label: "Obciążenie",
        value: `${formatStat(po)}/${formatStat(udzwig)} · ${EQUIPMENT_LOAD.label[klasa]}`,
        // Kolor mówi o KLASIE, nie o tym, czy zmiana jest na plus — „ciężkie"
        // nie jest błędem, tylko innym stylem gry.
        tone: klasa === "heavy" ? "warn" : klasa === "medium" ? "plain" : "good",
      });
    }
  }
  if (stan.stats.length || stan.notes.length) sections.push(stan);

  /* ── WYMAGANIA ──────────────────────────────────────────────────────── */
  const reqs = Object.entries(instanceRequirements(inst)) as [Attribute, number][];
  let requirementsMet = true;
  if (reqs.length) {
    const s = push("WYMAGANIA");
    for (const [attr, need] of reqs) {
      const ok = Progression[attr] >= need;
      if (!ok) requirementsMet = false;
      // Spełniony wymóg zostaje wypisany — to on mówi „tę rzecz wolno kupić",
      // a znikający wiersz kazałby karcie skakać między dwoma przedmiotami
      // z tej samej półki.
      s.stats.push({ label: ATTRIBUTE_LABEL[attr], value: `${need}`, tone: ok ? "muted" : "bad" });
    }
  }

  /* ── ZESTAW ─────────────────────────────────────────────────────────── */
  const setId = itemSet(itemId);
  if (setId) {
    const sdef = setDef(setId);
    const postep = Equipment.setProgress.find((p) => p.id === setId);
    const worn = postep?.worn ?? 0;
    const total = postep?.total ?? setSize(setId);
    const s = push(`ZESTAW: ${sdef.name.toUpperCase()} (${worn}/${total})`);
    // ⚠ Progi WSZYSTKIE, także nieosiągnięte — to jest cała wartość tego bloku:
    //   gracz kompletujący zestaw pyta „po co mi piąta sztuka".
    for (const tier of sdef.tiers) {
      s.notes.push({ text: `${tier.count} szt.: ${tier.text}`, tone: worn >= tier.count ? "good" : "muted" });
    }
  }

  return {
    itemId,
    name: def.name,
    typeLine,
    footprint: itemFootprint(itemId),
    quality: gear ? describeQuality(inst) : "",
    qualityColor: qualityColorHex(qualityOf(inst)),
    owned: Inventory.countItem(itemId),
    description: SHOWS_DESCRIPTION.has(def.type) ? (def.description ?? "") : "",
    sections: sections.filter((s) => s.stats.length > 0 || s.notes.length > 0),
    compares,
    buyPrice: "buyPrice" in def ? buyPriceOf(itemId, qualityOf(inst)) : null,
    sellPrice: sellPriceOf(itemId, qualityOf(inst)),
    requirementsMet,
  };
}

/**
 * Miejsca, z którymi porównuje się ta rzecz — D10 (etap E, 2026-10-13).
 *
 * ⚠ **Ta sama lista celów, co przyciski „Załóż · Zestaw I / II" w panelu
 * gracza** (`PlayerPanel.equipTargetsFor`): broń i tarcza mają dwa zestawy,
 * pierścień dwa palce. Reszta ma jeden dom (`slotForItem`, przy pancerzu
 * ADRES Z WARSTWĄ — kirys porównuje się z kirysem, nie z przeszywanicą).
 */
function compareTargets(itemId: ItemId): { slot: GearSlot; target: string }[] {
  const def = getItem(itemId);
  if (def.type === "weapon") {
    return [
      { slot: "weapon", target: "Zestaw I" },
      { slot: "weapon2", target: "Zestaw II" },
    ];
  }
  if (def.type === "armor" && def.slot === "offhand") {
    return [
      { slot: "offhand", target: "Zestaw I" },
      { slot: "offhand2", target: "Zestaw II" },
    ];
  }
  if (def.type === "ring") {
    return [
      { slot: "ring1", target: "Pierścień I" },
      { slot: "ring2", target: "Pierścień II" },
    ];
  }
  const slot = Equipment.slotForItem(itemId);
  return slot ? [{ slot, target: "" }] : [];
}

/**
 * Bloki NOWY ↔ ZAŁOŻONY, po jednym na miejsce (D10).
 *
 * ⚠ **Pusta lista, gdy wszystkie miejsca są wolne** — nie ma z czym
 * porównywać, a karta nie wymyśla odpowiednika (`P1` w przymiarze). Wolne
 * miejsce OBOK zajętego daje blok bez wiersza: „Zestaw II — wolne" mówi, że
 * rzecz weszłaby tam bez zamiany.
 *
 * ⚠ Karta rzeczy NOSZONEJ nie porównuje się sama ze sobą: miejsce, w którym
 * leży ten egzemplarz, wypada z listy.
 */
function buildCompares(inst: ItemInstance): CardCompare[] {
  // ⚠ Rzecz NOSZONA (w którymkolwiek zestawie) nie porównuje się wcale —
  //   miecz z zestawu I zestawiony z toporem z zestawu II czytał się na
  //   renderze jak „zamiast noszonego: Siekiera", czyli jak zakup.
  if (Equipment.isWorn(inst)) return [];
  const cele = compareTargets(inst.itemId);
  if (!cele.some(({ slot }) => Equipment[slot])) return [];
  // Jeden cel bez nazwy: pancerz i amulet nie potrzebują podpisu „gdzie".
  const jeden = cele.length === 1;
  return cele.map(({ slot, target }) => {
    const worn = Equipment[slot];
    const nazwa = jeden ? "" : target;
    if (!worn) return { target: nazwa, wornName: null, wornQuality: "", rows: [] };
    return {
      target: nazwa,
      wornName: getItem(worn.itemId).name,
      wornQuality: describeQuality(worn),
      rows: compareRows(inst, worn),
    };
  });
}

/** Wiersze jednego bloku: ta sama wielkość po obu stronach, potem masa i obciążenie. */
function compareRows(inst: ItemInstance, worn: ItemInstance): CardCompareRow[] {
  const def = getItem(inst.itemId);
  const eq = getItem(worn.itemId);
  const rows: CardCompareRow[] = [];

  if (def.type === "weapon" && eq.type === "weapon") {
    const mine = instanceDamage(inst);
    const theirs = instanceDamage(worn);
    if (mine && theirs) {
      rows.push({
        label: "Obrażenia",
        mine: `${Math.round(mine.min)}–${Math.round(mine.max)}`,
        theirs: `${Math.round(theirs.min)}–${Math.round(theirs.max)}`,
        delta: (mine.min + mine.max) / 2 - (theirs.min + theirs.max) / 2,
      });
      const a = (mine.min + mine.max) / 2;
      const b = (theirs.min + theirs.max) / 2;
      rows.push({ label: "Średnio", mine: formatStat(a), theirs: formatStat(b), delta: a - b });
    }
  } else if (def.type === "armor" && eq.type === "armor") {
    const a = instanceDefense(inst);
    const b = instanceDefense(worn);
    rows.push({ label: "Obrona", mine: formatStat(a), theirs: formatStat(b), delta: a - b });
    const ra = shieldReductionOf(inst);
    const rb = shieldReductionOf(worn);
    if (ra !== null && rb !== null) {
      rows.push({
        label: "Blok",
        mine: `${Math.round(ra * 100)}%`,
        theirs: `${Math.round(rb * 100)}%`,
        delta: ra - rb,
      });
      const ca = shieldCapacityOf(inst) ?? 0;
      const cb = shieldCapacityOf(worn) ?? 0;
      rows.push({ label: "Udźwig", mine: ca.toFixed(1), theirs: cb.toFixed(1), delta: ca - cb });
    }
  } else if (
    (def.type === "ring" && eq.type === "ring") ||
    (def.type === "amulet" && eq.type === "amulet")
  ) {
    const mine = def.bonus as Record<string, number>;
    const theirs = eq.bonus as Record<string, number>;
    // Suma kluczy z OBU stron: zamiana pierścienia krytu na PŻ musi pokazać
    // kryt, który TRACISZ, nie tylko PŻ, które zyskujesz.
    for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
      const procent = key === "critChance" || key === "attackSpeed";
      const a = mine[key] ?? 0;
      const b = theirs[key] ?? 0;
      rows.push({
        label: BONUS_LABEL[key] ?? key,
        mine: procent ? `${Math.round(a * 100)}%` : `${a}`,
        theirs: procent ? `${Math.round(b * 100)}%` : `${b}`,
        delta: a - b,
      });
    }
  }

  // ⭐ **Obciążenie po → teraz** (brief etapu E) — skutek zamiany dla CAŁEJ
  //   postaci, w tym samym porządku co reszta bloku (nowe → noszone). Masa
  //   to jedyna wielkość, która bywa argumentem PRZECIW lepszej statystyce
  //   (`Equipment.loadMultiplier`), i ten wiersz ją niesie.
  //   ⚠ Osobnego wiersza „Masa" (sztuka → sztuka) już nie ma: dawał tę samą
  //   różnicę w kilogramach, a masa sztuki stoi w STANIE. Przy dwóch blokach
  //   (D10) każdy wiersz to 24 j. wysokości karty.
  //   ⚠ Znak ODWRÓCONY: cięższe jest GORSZE — kolor mówi o korzyści.
  //   Zestaw schowany waży w pełni (`OI-96`), więc rachunek jest ten sam dla
  //   zestawu I i II — różni je tylko to, CO się zdejmuje.
  if ("weight" in def && "weight" in eq) {
    const teraz = Equipment.equippedWeight;
    const po = Math.max(0, teraz - eq.weight + def.weight);
    rows.push({ label: "Obciążenie", mine: formatStat(po), theirs: formatStat(teraz), delta: teraz - po });
  }
  return rows;
}

/* ══ SPŁASZCZENIE DO LINII (stary dymek) ═════════════════════════════════ */

/** Kolor linii dla starego, płaskiego renderera kart. */
const TONE_HEX: Record<CardTone, string> = {
  plain: "#c8d0e0",
  muted: "#8892a6",
  good: "#7ddf9a",
  bad: "#ff6b6b",
  warn: "#ff9d3b",
  gold: "#ffe680",
  info: "#9fd4ff",
};

export function toneHex(tone: CardTone | undefined): string {
  return TONE_HEX[tone ?? "plain"];
}

/**
 * Od ilu różnica w porównaniu LICZY SIĘ jako różnica.
 *
 * ⚠ **0,02, a nie 0,05** — bo nie wszystkie wielkości są całkowite. Blok
 * tarczy to ułamek (`0,42` wobec `0,47`), czyli realne pięć punktów
 * procentowych; przy progu 0,05 taka zamiana czytała się jako „bez różnicy".
 * Niżej też nie schodzimy: przy 0,001 dwie liczby wyświetlone identycznie
 * (`formatStat` zaokrągla do jednego miejsca) dostawałyby różny kolor.
 */
export const COMPARE_EPS = 0.02;


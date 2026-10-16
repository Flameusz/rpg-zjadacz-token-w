// ⚠ `ARMOR_PROFILE` i `WEAPON_FAMILY` są tu importowane WYŁĄCZNIE jako źródło
// TYPÓW (`DamageType`, `WeaponFamily`) — patrz komentarze przy nich niżej.
// Arytmetyka pancerza mieszka w `Protection`, tożsamość rodzin w `Progression`.
import {
  ARMOR_PROFILE,
  DUAL_WIELD,
  EQUIPMENT_LOAD,
  SHIELD,
  STAMINA,
  WEAPON_FAMILY,
} from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
// The reduction curve and the armour-type profile both live here now, shared
// with enemy armour — this file no longer computes either itself.
import {
  armorPointsAgainst,
  reductionFromPoints,
  type ArmorType,
  type BlockGrade,
  shieldGeometryFor,
  type GuardGeometry,
} from "./Protection";
import { Inventory } from "./Inventory";
import { containerSlots, getItem, itemConstruction, itemFamily, itemFootprint, itemGrip, itemHands, itemRequirements, type ItemId } from "./Items";
import { Progression, ATTRIBUTE_LABEL, type Attribute } from "./Progression";
import { setBonusFor, setProgressFor, type SetProgress, type WornElement } from "./ItemSets";
// ⚠ `ArmorLayers` nie importuje `Equipment` (tylko `Protection` typem), więc
// cyklu runtime nie ma — ta sama własność, która chroni `Protection`.
import {
  ARMOR_LAYERS,
  itemLayer,
  layerDeclarationProblems,
  type ArmorLayer,
} from "./ArmorLayers";
// ⚠ Kierunek importu jest JEDNOSTRONNY: `ArmorTraining` nie zna `Equipment`.
// Ulgi treningu wchodzą do trzech mnożników obciążenia niżej.
import { ArmorTraining } from "./ArmorTraining";
// ⚠ Ten sam jednostronny kierunek: `ShieldSkill` nie zna `Equipment`. Ulga
// umiejętności władania tarczą wchodzi do `blockStaminaCostFor` niżej.
import { ShieldSkill } from "./ShieldSkill";

import {
  applyWear,
  conditionMul,
  instanceAttackSpeed,
  instanceDamage,
  instanceDefense,
  instanceRequirements,
  isDestroyed,
  qualityMul,
  qualityOf,
  type ItemInstance,
} from "./Quality";

/**
 * The melee shape a weapon (or bare hands) fights with.
 *
 * ⚠⚠ **`arcDeg` ZNIKŁ STĄD 2026-09-18 i nie wraca pod żadną nazwą.** Niósł
 * pół-kąt klina, którego **nie czytało nic poza Szerokim cięciem** — autoatak
 * trafia wybrany cel i pyta wyłącznie o zasięg (`GameScene.damageLockedTarget`).
 * Łuk jest dziś własnością UMIEJĘTNOŚCI (`ABILITIES.cleave.halfArcDeg`), bo
 * szeroki zamach da się wykonać mieczem, toporem i maczugą tak samo:
 * **rozmach ramienia nie jest cechą konstrukcji oręża.**
 *
 * ⭐ Zasięg został — i to jest cała granica: `reach` bierze się z DŁUGOŚCI
 * broni, więc umiejętność dalej go pożycza (`AbilitySpec.resolveAbility`).
 */
export interface MeleeShape {
  /** How far the blow reaches from the player, in px. */
  readonly reach: number;
  /**
   * **Minimalny prześwit, poniżej którego ten cios NIE TRAFIA.** Brak pola
   * znaczy `0`, czyli dotychczasowe zachowanie każdej broni w grze.
   *
   * ⚠⚠ **Własność KONSTRUKCJI, nie rodziny.** Pika jest bezradna w zwarciu,
   * włócznia nie — i obie są `polearm`. ⛔ Nie przenoś tego do
   * `WEAPON_FAMILY`: rodzina jest kategorią biegłości, nie zestawem
   * parametrów.
   *
   * ⚠ Mierzy się tą samą miarą co `reach` — prześwit od `combatOrigin`
   * napastnika do KRAWĘDZI hurtboxa celu (`HitResolver.withinReach`). Liczba
   * znaczy więc dokładnie to samo, co liczba zasięgu, i nie da się jej
   * pomylić z dystansem środków.
   */
  readonly minReach?: number;
  /** Impulse applied to anything hit, px/s. Zero on everything but blunt. */
  readonly knockback: number;
  readonly critChanceBonus?: number;
  readonly critMultiplierBonus?: number;
  /**
   * **Dodatek do rdzenia parowania** (`DEFENSE.parry.core`). Brak = broń nie
   * paruje.
   *
   * ⚠⚠ **Własność KONSTRUKCJI od 2026-09-16.** Wcześniej niosła ją rodzina
   * `sword`, więc każdy miecz parował identycznie — a rapier i tasak nie mają
   * ze sobą wspólnego nic poza kategorią biegłości. Rodzina deklaruje dziś
   * wyłącznie ZNACZNIK `parry` (`core/WeaponTraits.ts`), po którym ranga
   * Mastery wie, że ma podnosić właśnie paradę.
   */
  readonly parryBonus?: number;
  /** Cancels an enemy's committed wind-up on hit. */
  readonly interrupts?: boolean;
}

/**
 * How a blow is delivered. Carried by the attack VARIANT, never by the weapon
 * — "miecz zadaje cięte + kłute" is a sentence with no content, because which
 * one it is depends on how you swing it.
 *
 * ⚠ **WYPROWADZANY Z `ARMOR_PROFILE`, nie przepisywany ręcznie** (D7,
 * 2026-09-03). Indeksowanie unią typów materiałów daje `keyof` z ich
 * **przecięcia**, więc typ obrażeń istnieje dopiero wtedy, gdy **każdy**
 * materiał pancerza ma dla niego wpis. Dawna, ręcznie utrzymywana lista
 * literałów stała obok tabeli i mogła się z nią rozjechać **bez błędu
 * kompilatora** — a to jest ta klasa błędu, która wychodzi dopiero jako
 * `undefined` w mnożniku.
 */
export type DamageType = keyof (typeof ARMOR_PROFILE)[ArmorType];

/**
 * Archetyp broni — **tożsamość wspólna dla wszystkich modeli rodziny**.
 * Dziesięć przyszłych mieczy dziedziczy oś miecza bez kopiowania mechaniki do
 * każdego z nich; różnią się wyłącznie parametrami modelu. Tabela osi:
 * `WEAPON_FAMILY` w `GameConfig.ts`, składana w `Progression`.
 *
 * ── Trzy rozdziały, których NIE WOLNO zlać ────────────────────────────────
 * ⚠ **Rodzina ≠ `damageType`.** Rodzina mówi, czym broń JEST; typ obrażeń
 * mówi, jak akurat zadano cios. Wyprowadzanie `family` z `damageType` zepsułoby
 * dwie rzeczy naraz: przyszły nadziak (`pierce` + `blunt`) nie miałby gdzie
 * mieszkać, a **wariant Obuch siekiery** — który jest `blunt` — odziedziczyłby
 * oś rodziny obuchowej, czyli wariant przyznałby zdolność, czego zabrania
 * REGUŁA ZAWĘŻANIA.
 *
 * ⚠ **Rodzina ≠ `hands`.** Młot jednoręczny i dwuręczny to jedna rodzina,
 * dwa modele — dokładnie tak, jak `itemHands` opisuje przedmiot, nie kategorię.
 *
 * ⚠ **Rodzina ≠ jakość.** Podła siekiera jest tak samo siekierą jak
 * mistrzowska (niezmiennik N-3). Świadomie NIE kopiujemy tu rozwiązania WFRP,
 * gdzie cechy rodzin przysługują wyłącznie broni najlepszej jakości.
 *
 * **Brak rodziny jest legalny** i znaczy „ta broń do żadnej nie należy" —
 * dziś gołe ręce i osiosany kij (broń improwizowana). Nie jest to dziura do
 * zapełnienia.
 *
 * ⚠ **WYPROWADZANA Z `WEAPON_FAMILY`, nie przepisywana ręcznie** (D7,
 * 2026-09-03). Do tej daty stała tu lista literałów obok tabeli w configu,
 * a `WEAPON_FAMILIES` powstawało przez **rzutowanie** `Object.keys(...) as
 * WeaponFamily[]` — czyli rozjazd typu z konfiguracją nie zapaliłby ani
 * kompilatora, ani uprzęży. Dziś dodanie rodziny do `WEAPON_FAMILY` jest
 * jedyną czynnością, jakiej to wymaga.
 */
export type WeaponFamily = keyof typeof WEAPON_FAMILY;

/**
 * One way of using a weapon: a named basic attack with its own damage type and
 * its own shape. A weapon carries 1–3 of them in `ITEMS[*].attacks`.
 *
 * ── Mnożniki, nie wartości bezwzględne ───────────────────────────────────
 * Every field scales the weapon's OWN number, and an absent field means 1.
 * Three reasons, each forced by something that already exists:
 *  1. Quality already multiplies the base (`instanceDamage`), so a variant
 *     composes with it instead of needing its own quality table.
 *  2. "A variant must not eat the category" becomes a checkable interval
 *     rather than an opinion.
 *  3. A weapon whose first variant sets nothing behaves EXACTLY as it did
 *     before variants existed — which is why five of the six weapons needed
 *     no numbers at all.
 *
 * ⚠ REGUŁA ZAWĘŻANIA: a variant may only take a capability away, never grant
 * one. `interrupts` is typed `false` (literally not `true`) and
 * `knockbackMul` is clamped to ≤1 in Progression, so the axe's Obuch cannot
 * award itself the hammer's interrupt, while the planned halberd will be able
 * to declare `interrupts` once on the WEAPON and switch it off on the two
 * variants that shouldn't have it.
 */
export interface AttackVariant {
  readonly id: string;
  /** Shown on the variant button. */
  readonly name: string;
  readonly damageType: DamageType;
  /** ⚠ `arcMul` usunięty 2026-09-18 razem z `melee.arcDeg` — mnożnik pola,
   *  którego nie ma, jest gorszy niż brak pola: wygląda na oś strojenia.
   *  Łuk należy do umiejętności (`ABILITIES.cleave.halfArcDeg`). */
  /** Hit-arc reach. */
  readonly reachMul?: number;
  /** Weapon damage ONLY — never the flat Strength bonus (see Progression). */
  readonly damageMul?: number;
  /** Cooldown AND swing duration together; >1 = slower. Never one alone. */
  readonly swingMul?: number;
  /** How far the hilt pushes forward — visual. */
  readonly thrustMul?: number;
  /** How far the blade sweeps — visual. Big sweep + small thrust reads as a
   *  cut, small sweep + big thrust as a stab; with one attack frame per
   *  direction this pair is the only thing telling the two apart on screen. */
  readonly sweepMul?: number;
  /** 0..1. Cannot exceed the weapon's own knockback. */
  readonly knockbackMul?: number;
  /** Only ever `false`: switches OFF an interrupt the weapon already has. */
  readonly interrupts?: false;
}

/**
 * **Obszar ciała noszący WARSTWY.** Cztery, zgodnie z taksonomią pancerza
 * (2026-09-12). ⚠ Ręce mają jedną warstwę i **celowo nie są tu wymienione** —
 * model nie jest jednorodny i nie ma udawać, że jest.
 */
export type LayeredArea = "head" | "chest" | "legs" | "boots";
export const LAYERED_AREAS: readonly LayeredArea[] = ["head", "chest", "legs", "boots"];

/** Asercja startowa: `layer` zadeklarowany tam, gdzie nikt go nie zapyta, jest
 *  CICHYM kłamstwem na karcie przedmiotu. Stoi tutaj, bo dopiero tu istnieje
 *  lista obszarów warstwowanych — `ArmorLayers` nie może jej importować bez
 *  cyklu. Pełne uzasadnienie przy `layerDeclarationProblems`. */
for (const problem of layerDeclarationProblems(LAYERED_AREAS)) {
  console.warn(`[ArmorLayers] ${problem}`);
}

/**
 * **Adres warstwowy: obszar + warstwa.** `chest_L3` znaczy „płyta na torsie".
 *
 * ⚠⚠ **To jest MODEL C, wybrany 2026-09-15 po audycie trzech wariantów.**
 * Magazyn zostaje PŁASKI — rośnie liczba ADRESÓW, nie zmienia się typ tego, co
 * pod adresem leży. Dzięki temu `this[slot]` nadal jest `ItemInstance | null`,
 * a `equippedWeight`, `armorPieces`, `sumBonus` i `wornItemIds` **iterują
 * dłuższą listę bez zmiany ani jednej linijki logiki**. ⛔ Odrzucone:
 * `LayerStack` jako wartość slotu (łamie 48 miejsc indeksujących) oraz
 * `Equipment.layers` równolegle do pól (dwa źródła prawdy).
 */
export type LayeredSlot = `${LayeredArea}_${ArmorLayer}`;

/**
 * **Slot ZADEKLAROWANY na przedmiocie pancerza** — obszar (warstwowany) albo
 * slot bez warstw. ⚠ To NIE jest adres w magazynie: `chest` opisuje, gdzie
 * rzecz się nosi, a `chest_L3` — w której warstwie leży.
 */
// ⚠ `shoulders` dopisane 2026-09-16 razem z pierwszymi naramiennikami —
//   slot niewarstwowany, jak `gloves`.
export type ArmorItemSlot = LayeredArea | "gloves" | "shoulders" | "offhand";

export type EquipSlot =
  | "weapon"
  | "offhand"
  | "gloves"
  | "shoulders"
  | "amulet"
  | "ring1"
  | "ring2"
  | LayeredSlot;

/** Adres warstwowy z obszaru i warstwy. Jedno miejsce sklejające tę nazwę. */
export function layeredSlot(area: LayeredArea, layer: ArmorLayer): LayeredSlot {
  return `${area}_${layer}`;
}

/**
 * **MIEJSCE, które ten adres wnosi do zestawu** — adres z warstwą zwiniętą do
 * obszaru (`chest_L2` → `chest`); każdy inny slot zostaje sobą.
 *
 * ⚠⚠ **Jedyny słownik miejsc w projekcie** (decyzja `(set, area)`, 2026-09-15).
 * `ItemSets.placesOfItem` mówi tym samym słownikiem od drugiej strony — od
 * przedmiotu, nie od adresu — i to, że oba dają te same napisy, jest
 * zabezpieczone przymiarem, a nie zbiegiem okoliczności. Pancerz deklaruje
 * `slot` jako OBSZAR, więc obie drogi kończą się na `"chest"`.
 *
 * ⚠ `ring1` i `ring2` zostają DWOMA miejscami: dwa jednakowe pierścienie to
 * naprawdę dwa elementy, a nie jedno „miejsce na palcach".
 */
export function placeOfSlot(slot: EquipSlot): string {
  return parseLayeredSlot(slot)?.area ?? slot;
}

/** Czy ten adres jest warstwowy, i jeśli tak — czego dotyczy. */
export function parseLayeredSlot(slot: string): { area: LayeredArea; layer: ArmorLayer } | null {
  const i = slot.lastIndexOf("_");
  if (i < 0) return null;
  const area = slot.slice(0, i) as LayeredArea;
  const layer = slot.slice(i + 1) as ArmorLayer;
  return LAYERED_AREAS.includes(area) && ARMOR_LAYERS.includes(layer) ? { area, layer } : null;
}

/**
 * Jak tarcza broni — jedna liczba plus jej cena. Warunek („z której strony")
 * stoi POZA przedmiotem, w `SHIELD.blockArcDeg`, i to jest decyzja projektowa,
 * nie skrót: warunek jest mechaniką, a nie własnością egzemplarza. Dzięki temu
 * przyszłe „Raise Shield" jest chwilową zmianą tej stałej, a nie przebudową
 * każdej tarczy. Analiza: `docs/systemy/shields.md`/§B.9.
 */
export interface BlockSpec {
  /** Ułamek obrażeń zdejmowany PO pancerzu, gdy cios idzie od przodu. */
  readonly reduction: number;
  /** Kara: mnożnik na tempo ataku ORAZ czas zamachu — nigdy jedno bez
   *  drugiego. Ta sama ścieżka, którą jedzie `AttackVariant.swingMul`. */
  readonly swingMul: number;
  /**
   * Ile staminy kosztuje ZABLOKOWANIE jednego ciosu. Własność KONKRETNEJ
   * tarczy, bo puklerz przyjmuje mniej masy niż pawęż.
   *
   * ⚠ Świadomie **nie** skaluje się jakością wykonania, w odróżnieniu od
   * `reduction`. Lepiej wykuta tarcza chroni lepiej; nie sprawia, że cios ma
   * mniejszy pęd. Do rozważenia po playteście, nie przed.
   */
  readonly staminaCost: number;
  /**
   * **Geometria osłony TEJ konstrukcji** (`T-1`, 2026-09-16).
   *
   * ⚠⚠ Komentarz nad tym interfejsem mówił, że warunek „z której strony” stoi
   * POZA przedmiotem — i to było prawdą do dziś. Od `T-1` warunek nadal jest
   * MECHANIKĄ (nie własnością egzemplarza), ale adresowaną per konstrukcja:
   * pole niesie **profil współdzielony przez wszystkie tarcze tej konstrukcji**,
   * a nie liczbę zapisaną na sztuce. ⛔ Wariant i jakość go NIE ruszają.
   *
   * ⏳ Dziś każda konstrukcja dostaje globalny fallback 60°/100°, bo
   * `SHIELD_GEOMETRY` jest pusty do czasu `B3` (po pomiarze `P1`).
   */
  readonly geometry: GuardGeometry;
}

/** Payload of `EVENT.equipmentChanged` — the worn COPIES, so a listener can
 *  read workmanship and wear without reaching back into Equipment. */
export type EquipmentSnapshot = Record<EquipSlot, ItemInstance | null>;

/** Payload of `EVENT.bagsChanged` — same shape as `EquipmentSnapshot`, one
 *  copy per bag slot. */
export type BagSnapshot = Record<BagSlot, ItemInstance | null>;

/** Every slot in display order — the one source of truth for the UI rows and
 *  for iterating equipped gear, so adding a slot never means hunting arrays. */
export const EQUIP_SLOTS: readonly EquipSlot[] = [
  "weapon",
  "offhand",
  // ⭐ **Cztery obszary × trzy warstwy.** Kolejność OD CIAŁA NA ZEWNĄTRZ w obrębie
  // obszaru — ta sama, którą rysuje pasek kropek (`ARMOR_LAYERS`).
  // ⚠ Ta lista jest JEDYNYM źródłem adresów: `equippedWeight`, `armorPieces`,
  // `sumBonus`, `wornItemIds`, `reset` i migawka iterują właśnie ją, więc
  // warstwy weszły do wszystkich pięciu **bez zmiany logiki**.
  "head_L1", "head_L2", "head_L3",
  "chest_L1", "chest_L2", "chest_L3",
  // ⚠ Ręce mają JEDNĄ warstwę (taksonomia 2026-09-12) — adres bez sufiksu.
  "gloves",
  // ⭐ **OŻYWIONE 2026-09-16** — kafel „Ramiona” stał w `EQUIP_CELLS` (dziś `DOLL_CELLS`) jako
  // `planned` od 2026-09-11 z regułą: *komórki manekina są martwe, dopóki nie
  // istnieje przedmiot, który w nie wejdzie; ożywają jednym wpisem w unii
  // `EquipSlot` w dniu, w którym powstanie pierwszy taki przedmiot*. Ten dzień
  // nastąpił: naramienniki. ⚠ JEDNA warstwa, adres bez sufiksu — tak jak ręce.
  "shoulders",
  "legs_L1", "legs_L2", "legs_L3",
  "boots_L1", "boots_L2", "boots_L3",
  // Trzeci kafel lalki, który ożył (po drugiej ręce i rękawicach) — otwarty
  // przez `grey_fang_necklace`, czyli nagrodę za Szarego. Stoi obok
  // pierścieni, bo to biżuteria: nie chroni, tylko dodaje statystykę pochodną.
  "amulet",
  "ring1",
  "ring2",
];

export const EQUIP_SLOT_LABEL: Record<EquipSlot, string> = {
  weapon: "Broń",
  shoulders: "Ramiona",
  // ⚠ NIE „Tarcza". Slot trzyma dziś tarcze, ale ma trzymać też pochodnie,
  // kołczany i drugie sztylety — nazwanie go po jednym z jego przyszłych
  // mieszkańców to ta sama pomyłka, co nazwanie kategorii bronią, która akurat
  // w niej stoi.
  offhand: "Druga ręka",
  // ⭐ **Pełny `Record` jest tu OCHRONĄ, nie formalnością**: nowy adres nie
  // skompiluje się, dopóki nie dostanie nazwy. Ta sama reguła naprawiła raz
  // „Slot: undefined" w karcie przedmiotu.
  head_L1: "Głowa · podkład",
  head_L2: "Głowa · ochrona",
  head_L3: "Głowa · wzmocnienie",
  chest_L1: "Tors · podkład",
  chest_L2: "Tors · ochrona",
  chest_L3: "Tors · wzmocnienie",
  gloves: "Rękawice",
  legs_L1: "Nogi · podkład",
  legs_L2: "Nogi · ochrona",
  legs_L3: "Nogi · wzmocnienie",
  boots_L1: "Stopy · podkład",
  boots_L2: "Stopy · ochrona",
  boots_L3: "Stopy · wzmocnienie",
  amulet: "Amulet",
  ring1: "Pierścień",
  ring2: "Pierścień",
};


/**
 * **Adres, w który wchodzi ta sztuka pancerza.** Dla czterech obszarów
 * warstwowanych — `obszar_warstwa`; dla reszty (`gloves`, `offhand`) — slot
 * zadeklarowany na przedmiocie, bez sufiksu.
 *
 * ⚠⚠ **Warstwa jest WYPROWADZANA, nie wybierana** (`itemLayer`), więc ten sam
 * przedmiot zawsze ląduje w tej samej warstwie — i `slotForItem`, `accepts`
 * oraz loader zapisu mówią jednym głosem. ⛔ Nie dodawaj tu wyboru „pierwsza
 * wolna warstwa": to zrobiłoby z warstwy właściwości SYTUACJI, a jest
 * właściwością PRZEDMIOTU (taksonomia 2026-09-12).
 *
 * `null`, gdy obszar jest warstwowany, a przedmiot nie ma warstwy — dziś
 * nieosiągalne (każdy pancerz ma `armorType`), ale odmowa jest tańsza niż
 * zgadywanie.
 */
function armorAddress(itemId: ItemId, declared: string): EquipSlot | null {
  if (!LAYERED_AREAS.includes(declared as LayeredArea)) return declared as EquipSlot;
  const layer = itemLayer(itemId);
  return layer ? layeredSlot(declared as LayeredArea, layer) : null;
}

/** Slots a "ring" item may occupy, in fill order. Rings are the first item
 *  kind with MORE THAN ONE home, which is why `accepts` exists alongside
 *  `slotForItem`: the latter picks a slot for you, the former answers about a
 *  specific one (a drop onto ring2 has to mean ring2, not "wherever"). */
const RING_SLOTS: readonly EquipSlot[] = ["ring1", "ring2"];

/**
 * The four bag slots a `type: "container"` item can be worn in.
 *
 * ⚠ **Deliberately NOT part of `EQUIP_SLOTS`.** That list is iterated by
 * `equippedWeight`, `totalDefense`, `sumBonus` and the save — a bag worn here
 * must NOT weigh, protect, or grant a bonus; the one thing it does is raise
 * `Inventory.capacity`. See `docs/inventory_scroll_ux.md` §3/§9 for why this
 * split is load-bearing, not incidental: folding bags into `EQUIP_SLOTS`
 * would silently retune the dodge/sprint stamina cost, which is a separate,
 * still-unplaytested system (`STAMINA` in GameConfig).
 */
export type BagSlot = "bag1" | "bag2" | "bag3" | "bag4";
export const BAG_SLOTS: readonly BagSlot[] = ["bag1", "bag2", "bag3", "bag4"];

/**
 * ── DRUGI ZESTAW BRONI — SCHOWANY, nie noszony ────────────────────────────
 *
 * Para slotów trzymająca broń i drugą rękę, których postać w tej chwili NIE ma
 * w rękach. `swapWeaponSet()` wymienia ją z parą czynną.
 *
 * ⚠ **Świadomie POZA `EQUIP_SLOTS`, ale NIE poza obciążeniem.** Tamta lista
 * jest pętlą `totalDefense`, `sumBonus` i zapisu — schowany topór nie chroni
 * i nie daje premii. **Waży za to w pełni.**
 *
 * ✅ **DŁUG SPŁACONY 2026-09-15 (`OI-96`).** Do tej daty stało tu, że schowana
 * broń nie waży, z adnotacją *„to jest dług, a nie teza"* i warunkiem spłaty
 * („obciążenie jest niestrojone"). Warunek zniknął razem z `OI-103`, więc
 * `equippedWeight` iteruje dziś `EQUIP_SLOTS` **oraz** `STOW_SLOTS`:
 * **schowany zestaw liczy 100% swojej masy, bo leży na ciele.**
 * Decyzja: `docs/decyzje/2026-09-15-masa-schowanego-zestawu.md`.
 *
 * ⛔ **Plecak i torby nadal ważą zero** — to OSOBNA, nietknięta decyzja
 * (`docs/inventory_scroll_ux.md` §3). Wynikającą z tego asymetrię (zapasowy
 * młot w plecaku tańszy niż w `weapon2`) przyjęto świadomie jako cenę za
 * sparowaną zamianę jednym kliknięciem.
 *
 * ⚠ **Zamiana zestawu jest w panelu ORAZ na HUD-zie (od 2026-10-12, decyzja
 * autora — „szybki swap broni" pod łucznika).** Przycisk `WeaponSwapButton`
 * prosi scenę, a `GameScene.onWeaponSwapRequested` odmawia przy ciosie w locie
 * i pilnuje odstępu `WEAPON_SWAP`. ⚠ „Zamiana broni w walce" jako MECHANIKA
 * (czas przełożenia, okno bezbronności, koszt staminy) dalej nie istnieje —
 * to otwarta decyzja (`OI-177`), nie przeoczenie.
 */
export type StowSlot = "weapon2" | "offhand2";
export const STOW_SLOTS: readonly StowSlot[] = ["weapon2", "offhand2"];

/** Każdy slot, w którym może leżeć KONKRETNY egzemplarz sprzętu — czynny albo
 *  schowany. To jest typ, którym adresuje się przeciąganie i zdejmowanie;
 *  `EquipSlot` zostaje typem tego, co postać ma NA SOBIE. */
export type GearSlot = EquipSlot | StowSlot;

/** Która para rąk: 1 = czynna (`weapon`/`offhand`), 2 = schowana. */
export type WeaponSetIndex = 1 | 2;

/**
 * **Jak broń jest TRZYMANA** — kategoria 1.5H (2026-09-18).
 *
 * ⚠ To nie jest liczba rąk przedmiotu (`itemHands`), tylko stan POSTACI:
 * ta sama broń o `grip: "either"` daje `"two"` z pustą drugą ręką i `"one"`
 * z zajętą. Broń bez `grip` odpowiada tym, czym jest, i nigdy się nie zmienia.
 */
export type GripMode = "one" | "two";

/** Sloty rąk danego zestawu. Jedno miejsce, w którym stoi para „główna ręka +
 *  druga ręka" — żeby reguły dwuręczności dały się napisać RAZ dla obu
 *  zestawów, zamiast raz dla czynnego i drugi raz dla schowanego. */
export function handSlotsOf(set: WeaponSetIndex): { main: GearSlot; off: GearSlot } {
  return set === 1 ? { main: "weapon", off: "offhand" } : { main: "weapon2", off: "offhand2" };
}

/** Do którego zestawu należy ten slot rąk, albo `null` dla wszystkiego innego. */
export function weaponSetOf(slot: GearSlot): WeaponSetIndex | null {
  if (slot === "weapon" || slot === "offhand") return 1;
  if (slot === "weapon2" || slot === "offhand2") return 2;
  return null;
}

/** Czy ten slot jest GŁÓWNĄ ręką swojego zestawu. */
function isMainHand(slot: GearSlot): boolean {
  return slot === "weapon" || slot === "weapon2";
}

/** Czy ten slot jest DRUGĄ ręką swojego zestawu. */
function isOffHand(slot: GearSlot): boolean {
  return slot === "offhand" || slot === "offhand2";
}

/** Dlaczego zamiana zestawów właśnie teraz się nie uda. `null` = uda się. */
export type SwapRefusal =
  /** Oba zestawy puste — nie ma czego zamieniać. */
  | { kind: "empty" }
  /** Coś w zestawie schowanym przerasta dziś postać. Możliwe wyłącznie
   *  z ZAPISU: panel nie pozwoli tego tam włożyć. Stan istniejący się toleruje,
   *  akcję się odmawia — ta sama reguła co `normalizeHands`. */
  | { kind: "requirements"; itemName: string; unmet: UnmetRequirement[] };

/** Jedno brzmienie odmowy zamiany dla wszystkich ścieżek UI. */
export function describeSwapRefusal(r: SwapRefusal): string {
  if (r.kind === "empty") return "Oba zestawy są puste";
  return `${r.itemName} — wymaga: ${r.unmet.map(describeRequirement).join(", ")}`;
}

/** Last-resort variant for a weapon whose data forgot `attacks` — see
 *  `weaponAttacks`. Never reached with the current ITEMS. */
const FALLBACK_ATTACKS: readonly AttackVariant[] = [
  { id: "strike", name: "Atak", damageType: "slash" },
];
/** One warning per offending item, not one per frame. */
const warnedMissingAttacks = new Set<ItemId>();

/** Derived stats a piece of gear can add on top of its base numbers. */
type BonusKey = "maxHp" | "critChance" | "attackSpeed" | "defense";

/** One attribute an item asks for that the player doesn't have yet. */
export interface UnmetRequirement {
  attr: Attribute;
  need: number;
  have: number;
}

/** "Siła 6 (masz 4)" — the shared phrasing for a failed requirement, so the
 *  tooltip and the equip refusal can never word the same fact differently. */
export function describeRequirement(r: UnmetRequirement): string {
  return `${ATTRIBUTE_LABEL[r.attr]} ${r.need} (masz ${r.have})`;
}

/**
 * Dlaczego dwuręczność nie pozwala teraz na to założenie. `null` = pozwala.
 *
 * Dwa powody, bo walidacja ma **dwa kierunki** i tylko jeden z nich obsługuje
 * `accepts` (patrz `docs/systemy/weapons.md` R-4).
 */
export type HandsRefusal =
  /** Coś do drugiej ręki, a w rękach jest broń dwuręczna. */
  | { kind: "offhandBlocked"; weaponName: string }
  /** To, co musi wrócić do plecaka (zdjęta rzecz, a przy broni dwuręcznej
   *  także druga ręka), się w nim nie mieści. `need` = ile pól brakuje,
   *  `returning` = nazwy, `tall` = czy wśród nich jest przedmiot `1×2`. */
  | { kind: "noRoom"; need: number; returning: string[]; tall: boolean };

/**
 * Jedno brzmienie odmowy dla wszystkich ścieżek UI.
 *
 * ⚠ **Komunikat jest INSTRUKTAŻOWY, nie samą odmową, i to jest wymaganie, nie
 * uprzejmość:** nic innego w tej grze nie uczy, że broń dwuręczna zajmuje drugą
 * rękę — nie robi tego żaden samouczek ani żaden dialog. Ten tekst jest jedynym
 * miejscem, w którym gracz się o tym dowie. Osobno obowiązuje istniejąca reguła
 * całego panelu: drop, który po cichu wraca na miejsce, jest na dotyku
 * nieodróżnialny od zepsutego interfejsu, więc brakujące miejsce podaje LICZBĘ.
 */
export function describeHandsRefusal(r: HandsRefusal): string {
  if (r.kind === "offhandBlocked") {
    return `Obie ręce zajęte (${r.weaponName}). Załóż broń jednoręczną, żeby korzystać z drugiej ręki`;
  }
  const miejsc = r.need === 1 ? "1 wolne miejsce" : `${r.need} wolne miejsca`;
  // ⚠ Przy rzeczy `1×2` sama liczba pól kłamie: osiem wolnych pól bez pary
  //   JEDNO NAD DRUGIM nie przyjmie miecza. Stąd dopisek zamiast samej liczby.
  const pion = r.tall ? " (przedmiot na 2 pola potrzebuje ich jedno nad drugim)" : "";
  const co = r.returning.join(" i ");
  return `Brak miejsca — potrzebujesz ${miejsc}${pion}: ${co} ${r.returning.length > 1 ? "muszą" : "musi"} trafić do plecaka`;
}

/** Why `unequipBag(slot)` would refuse right now — see `Equipment.
 *  bagUnequipRefusal`. `need` is how many backpack slots have to be freed
 *  first: items sitting past where the bag would shrink the bag to, plus one
 *  more if there'd be no room left for the bag itself. */
export interface BagUnequipRefusal {
  need: number;
}

/** "Opróżnij 3 miejsca w plecaku" — one phrasing, so the card action and any
 *  other caller never word the same refusal differently. */
export function describeBagUnequipRefusal(r: BagUnequipRefusal): string {
  const miejsc = r.need === 1 ? "1 miejsce" : `${r.need} miejsc`;
  return `Opróżnij ${miejsc} w plecaku, żeby zdjąć tę torbę`;
}

/**
 * What the player currently has equipped. A thin layer over Inventory rather
 * than separate state: an equipped item simply isn't in the backpack —
 * equip()/unequip() move it across that boundary, gold and stacking rules
 * stay in one place (Inventory).
 *
 * NOTE ON THE IMPORT CYCLE: this imports Progression (to check an item's
 * attribute requirements) and Progression imports this (to read the equipped
 * weapon's damage/speed). That cycle is safe *only* because neither module
 * touches the other at import time — both dereference it exclusively inside
 * methods/getters, which run long after both modules have finished loading.
 * Don't move either reference to module scope.
 */
class EquipmentState {
  // Each slot holds a CONCRETE COPY, not just a name — an equipped item keeps
  // its workmanship and its wear. See `ItemInstance` in Quality.ts.
  weapon: ItemInstance | null = null;
  /**
   * Index into the equipped weapon's `attacks` — WHICH way the player is
   * currently holding it.
   *
   * Deliberately NOT on `ItemInstance`: quality and wear are properties of a
   * particular sword (two of them can differ), but how you happen to be
   * gripping it is not a property of the sword at all.
   *
   * Deliberately NOT persisted, by the same rule that keeps ability cooldowns
   * out of the save: transient state, reset on load. Adding it later needs no
   * SAVE_VERSION bump (optional field, same trick as `quickSlot`/rings).
   *
   * Reset to 0 whenever the equipped weapon CHANGES — see `emitChanged`.
   */
  activeAttack = 0;
  /** Which weapon `activeAttack` was last valid for, so a swap resets it. */
  private lastWeaponId: ItemId | null = null;
  offhand: ItemInstance | null = null;
  /* ── Cztery obszary warstwowane: dwanaście adresów ────────────────────────
     ⚠ **Magazyn jest PŁASKI.** Pod każdym adresem leży `ItemInstance | null`,
     dokładnie jak pod każdym innym slotem — więc `this[slot]` nie zmieniło typu
     i żadne z 48 miejsc indeksujących nie wymagało przeróbki. */
  head_L1: ItemInstance | null = null;
  head_L2: ItemInstance | null = null;
  head_L3: ItemInstance | null = null;
  chest_L1: ItemInstance | null = null;
  chest_L2: ItemInstance | null = null;
  chest_L3: ItemInstance | null = null;
  legs_L1: ItemInstance | null = null;
  legs_L2: ItemInstance | null = null;
  legs_L3: ItemInstance | null = null;
  boots_L1: ItemInstance | null = null;
  boots_L2: ItemInstance | null = null;
  boots_L3: ItemInstance | null = null;
  /** ⚠ Ręce mają JEDNĄ warstwę — zwykłe pole, bez sufiksu. */
  gloves: ItemInstance | null = null;
  /** ⚠ Ramiona też mają JEDNĄ warstwę — zwykłe pole, bez sufiksu.
   *  ⛔ `LAYERED_AREAS` się NIE zmieniło: warstwowane są nadal cztery obszary. */
  shoulders: ItemInstance | null = null;

  /* ── Nazwane obszary: GETTERY TYLKO DO ODCZYTU ─────────────────────────
     ⭐ `Equipment.chest` nadal znaczy **„przedmiot reprezentujący tors"**, a nie
     „L2" — zwraca najbardziej ZEWNĘTRZNĄ istniejącą warstwę (L3 → L2 → L1).
     Dzięki temu każdy dotychczasowy ODCZYT po nazwie działa bez zmiany.

     ⛔ **Świadomie BEZ setterów.** `equipment.chest = …` musiałoby zgadywać
     warstwę, a zapis ma przechodzić przez konkretny adres wynikający
     deterministycznie z `itemLayer()`. Brak settera sprawia, że próba zapisu
     **nie kompiluje się** zamiast po cichu trafić w złą warstwę. */
  private outermost(area: LayeredArea): ItemInstance | null {
    for (let i = ARMOR_LAYERS.length - 1; i >= 0; i--) {
      const inst = this[layeredSlot(area, ARMOR_LAYERS[i])];
      if (inst) return inst;
    }
    return null;
  }
  get head(): ItemInstance | null {
    return this.outermost("head");
  }
  get chest(): ItemInstance | null {
    return this.outermost("chest");
  }
  get legs(): ItemInstance | null {
    return this.outermost("legs");
  }
  get boots(): ItemInstance | null {
    return this.outermost("boots");
  }

  /**
   * **Adres, na którym operuje KAFEL lalki** dla obszaru warstwowanego:
   * najbardziej zewnętrzna ZAJĘTA warstwa, a przy pustym obszarze — adres L3.
   *
   * ⭐ Kafel zdejmuje więc warstwy **od wierzchu**, co jest jedynym porządkiem,
   * który czyta się sam. ⚠ Zakładanie tą drogą NIE idzie — ono adresuje przez
   * `slotForItem`, czyli przez warstwę wyprowadzoną z przedmiotu.
   */
  outermostSlotOf(area: LayeredArea): LayeredSlot {
    for (let i = ARMOR_LAYERS.length - 1; i >= 0; i--) {
      const adres = layeredSlot(area, ARMOR_LAYERS[i]);
      if (this[adres]) return adres;
    }
    return layeredSlot(area, ARMOR_LAYERS[ARMOR_LAYERS.length - 1]);
  }
  amulet: ItemInstance | null = null;
  ring1: ItemInstance | null = null;
  ring2: ItemInstance | null = null;
  /** The four bag slots — see `BAG_SLOTS` for why these live outside
   *  `EQUIP_SLOTS` entirely. */
  bag1: ItemInstance | null = null;
  bag2: ItemInstance | null = null;
  bag3: ItemInstance | null = null;
  bag4: ItemInstance | null = null;
  /** Drugi zestaw broni — schowany. Poza `EQUIP_SLOTS` z tego samego powodu co
   *  torby; pełne uzasadnienie przy `STOW_SLOTS`. */
  weapon2: ItemInstance | null = null;
  offhand2: ItemInstance | null = null;

  /** The item id worn in a slot, for everything that only cares WHAT is worn
   *  (icons, quest objectives) rather than which copy. */
  idIn(slot: EquipSlot): ItemId | null {
    return this[slot]?.itemId ?? null;
  }

  /** Shorthand for the slot everything asks about most. */
  get weaponId(): ItemId | null {
    return this.weapon?.itemId ?? null;
  }

  /**
   * Which of this COPY's attribute requirements the player falls short of —
   * empty when it can be worn (including when it asks for nothing at all).
   *
   * Instance-based because workmanship shifts the minimums (a clumsy weapon
   * takes more muscle). See `instanceRequirements`, and note the invariant it
   * protects: gear that asks for nothing keeps asking for nothing at every
   * quality.
   */
  unmetFor(inst: ItemInstance): UnmetRequirement[] {
    const unmet: UnmetRequirement[] = [];
    for (const [attr, need] of Object.entries(instanceRequirements(inst))) {
      const have = Progression[attr as Attribute];
      if (have < need) unmet.push({ attr: attr as Attribute, need, have });
    }
    return unmet;
  }

  /** True if the player can wear this exact copy. */
  canEquipInstance(inst: ItemInstance): boolean {
    return this.unmetFor(inst).length === 0;
  }

  /**
   * Requirements of a STANDARD (Zwykła) copy of `itemId`. Kept for the places
   * that reason about an item type rather than a copy in hand.
   */
  unmetRequirements(itemId: ItemId): UnmetRequirement[] {
    const unmet: UnmetRequirement[] = [];
    for (const [attr, need] of Object.entries(itemRequirements(itemId))) {
      const have = Progression[attr as Attribute];
      if (have < need) unmet.push({ attr: attr as Attribute, need, have });
    }
    return unmet;
  }

  /** True if the player meets every attribute requirement on a standard copy. */
  canEquip(itemId: ItemId): boolean {
    return this.unmetRequirements(itemId).length === 0;
  }

  /**
   * Czy trzymana broń zajmuje obie ręce.
   *
   * ⚠ **Wyprowadzane, nigdy przechowywane.** Kuszące i błędne jest wpisanie
   * tego samego egzemplarza w oba sloty: `sumBonus` policzyłby każdy `bonus`
   * dwa razy, dwie kopie `ItemInstance` rozjechałyby się przy pierwszym
   * zużyciu trwałości (rzut idzie raz na zamach i trafiłby w jedną z nich),
   * a zapis niósłby dwa egzemplarze jednego przedmiotu.
   */
  get usesBothHands(): boolean {
    return this.usesBothHandsIn(1);
  }

  /** To samo pytanie dla DOWOLNEGO zestawu — czynnego albo schowanego.
   *  Reguła dwuręczności obowiązuje w obu, bo zestaw schowany ma być gotowy do
   *  włożenia w ręce, a nie legalny tylko do czasu zamiany. */
  usesBothHandsIn(set: WeaponSetIndex): boolean {
    const inst = this[handSlotsOf(set).main as "weapon" | "weapon2"];
    if (!inst) return false;
    // ⭐⭐ **1.5H: `hands: 2` JUŻ NIE WYSTARCZA, żeby zablokować drugą rękę.**
    // Półtorak deklaruje pełny profil (`hands: 2`) i osobno to, że umie chwyt
    // mniejszy (`grip: "either"`). Blokuje wyłącznie broń, która mniejszego
    // chwytu NIE MA. ⚠ To jest jedyna linijka, którą trzeba było zmienić, żeby
    // tarcza weszła — `handsRefusalFor`, `accepts`, `normalizeHands` i zasłona
    // kafla w `PlayerPanel` pytają właśnie tutaj i dziedziczą odpowiedź.
    return itemHands(inst.itemId) === 2 && itemGrip(inst.itemId) !== "either";
  }

  /**
   * **Jak postać TRZYMA broń tego zestawu** — `"two"` (pełny profil) albo
   * `"one"` (profil ograniczony). Kategoria 1.5H.
   *
   * ⚠⚠ **Tryb jest WYPROWADZANY ze stanu drugiej ręki, nigdy wybierany.**
   * Zajęta druga ręka znaczy „nie mam jej dla tej broni" — niezależnie od tego,
   * co w niej leży. ⛔ Brak przełącznika, brak pola w zapisie, brak zmiany
   * w walce: wyposażenie zmienia się wyłącznie w panelu, który pauzuje grę.
   *
   * ⚠ Broń bez `grip: "either"` odpowiada tym, czym jest: `hands: 2` → `"two"`,
   * reszta → `"one"`. Dzięki temu getter jest sensowny dla całego rosteru
   * i `Character3D` może go czytać zamiast zaglądać do `ITEMS`.
   */
  gripOf(set: WeaponSetIndex): GripMode {
    const { main, off } = handSlotsOf(set);
    const inst = this[main as "weapon" | "weapon2"];
    if (!inst) return "one";
    if (itemGrip(inst.itemId) !== "either") return itemHands(inst.itemId) === 2 ? "two" : "one";
    return this[off as "offhand" | "offhand2"] ? "one" : "two";
  }

  /** Chwyt ręki CZYNNEJ — jedno pytanie dla 3D, UI i warstwy statystyk. */
  get weaponGrip(): GripMode {
    return this.gripOf(1);
  }

  /**
   * **Mnożnik ograniczenia jednoręcznego** dla broni w ręce czynnej; `1` zawsze,
   * gdy chwyt jest pełny albo broń nie zna mniejszego.
   *
   * ⛔⛔ **Nie dopisuj tu `swingMul` ani `cooldownMul`.** Tempo jest już
   * opodatkowane przez `offhandSwingMul` (tarcza ×1,08…×2,15, dual wield ×0,85)
   * i płynie przez `swingDurationMs` dalej w koszt staminy, ukorzenienie
   * i moment trafienia. Druga kara na tej samej osi to podwójne opodatkowanie
   * JEDNEJ decyzji gracza — i gracz nie odróżniłby jej od „tarcze są ciężkie".
   */
  private gripDamageMul(): number {
    if (!this.weapon || this.weaponGrip === "two") return 1;
    const def = getItem(this.weapon.itemId);
    // ⚠ Czytane przez `in`, tak jak `weight`/`hands`/`material` obok — `ITEMS`
    //   jest `as const`, więc każdy brakujący klucz jest błędem typu, nie `undefined`.
    if (!("oneHanded" in def)) return 1;
    return "damageMul" in def.oneHanded ? def.oneHanded.damageMul : 1;
  }

  /**
   * **Przyrost martwej strefy przy chwycie jednoręcznym**, w pikselach; `0`,
   * gdy chwyt jest pełny.
   *
   * ⚠⚠ **DODAWANY, nie mnożony — i to nie jest wybór stylu.** Włócznia ma dziś
   * `minReach: 0`; mnożnik dałby zero razy cokolwiek, czyli **karę nieistniejącą
   * dla broni, dla której ta kara powstała**. Dodawanie działa też dla wideł,
   * które startują z 20.
   */
  private gripMinReachAdd(): number {
    if (!this.weapon || this.weaponGrip === "two") return 0;
    const def = getItem(this.weapon.itemId);
    if (!("oneHanded" in def)) return 0;
    return "minReachAdd" in def.oneHanded ? def.oneHanded.minReachAdd : 0;
  }

  /**
   * Czy dwuręczność blokuje założenie `itemId` w `slot`. `null` = nie blokuje.
   *
   * ⚠ **Musi być wołane osobno w `equipFromBag`, mimo że `accepts` już zna
   * pierwszy kierunek.** Rozstrzyganie slotu wygląda tak:
   * `preferred && accepts(preferred) ? preferred : slotForItem(...)` — więc
   * gdy `accepts("offhand", tarcza)` zwróci false, kod **spada do
   * `slotForItem`, które i tak odpowiada `"offhand"`**, i tarcza by się
   * założyła. Sam `accepts` bramkuje podświetlanie celu, nie samą operację.
   */
  handsRefusalFor(itemId: ItemId, slot: GearSlot, fromIndex?: number): HandsRefusal | null {
    const set = weaponSetOf(slot);
    if (set !== null) {
      const { main } = handSlotsOf(set);
      if (isOffHand(slot) && this.usesBothHandsIn(set)) {
        const held = this[main as "weapon" | "weapon2"]!;
        return { kind: "offhandBlocked", weaponName: getItem(held.itemId).name };
      }
    }
    // ⚠⚠ Miejsce sprawdza się dla KAŻDEGO slotu, nie tylko dla broni dwuręcznej
    //   (do 2026-10-01 tylko tam, licząc sztuki). Zamiana jeden na jeden
    //   przestała być bezpieczna w dniu, w którym pojawił się gabaryt `1×2`:
    //   sztylet zwalnia jedno pole, miecz potrzebuje dwóch jedno nad drugim —
    //   patrz `Inventory.canFitAll`. Slot, który tego przedmiotu nie przyjmie,
    //   nie jest tu oceniany: tamten powód podaje wołający (`accepts`),
    //   a „brak miejsca" byłby fałszywy.
    if (!this.accepts(slot, itemId)) return null;
    const wraca = this.returningFor(itemId, slot);
    if (wraca.length === 0) return null;
    const from = fromIndex ?? Inventory.slots.findIndex((s) => s?.itemId === itemId);
    const fps = wraca.map((i) => itemFootprint(i.itemId));
    if (Inventory.canFitAll(fps, from < 0 ? undefined : from)) return null;
    const pol = fps.reduce((s, f) => s + f.w * f.h, 0);
    const zwolni = from < 0 ? 0 : (() => {
      const f = itemFootprint(itemId);
      return f.w * f.h;
    })();
    return {
      kind: "noRoom",
      need: Math.max(1, pol - (Inventory.freeSlotCount + zwolni)),
      returning: wraca.map((i) => getItem(i.itemId).name),
      tall: fps.some((f) => f.h > 1 || f.w > 1),
    };
  }

  /**
   * Co wraca do plecaka, gdy `itemId` wejdzie do `slot` — **w kolejności
   * odkładania** (największy gabaryt pierwszy). Ta sama lista służy
   * sprawdzeniu (`handsRefusalFor`) i wykonaniu (`equipFromBag`); dwie
   * kolejności znaczyłyby, że sprawdzenie mówi „zmieści się", a first-fit
   * położy inaczej. „Duże najpierw" daje mniej fałszywych odmów: drobiazg
   * położony pierwszy potrafi rozbić jedyną pionową parę.
   */
  private returningFor(itemId: ItemId, slot: GearSlot): ItemInstance[] {
    const out: ItemInstance[] = [];
    const set = weaponSetOf(slot);
    if (set !== null && isMainHand(slot) && itemHands(itemId) === 2) {
      const off = this[handSlotsOf(set).off as "offhand" | "offhand2"];
      if (off) out.push(off);
    }
    const previous = this[slot];
    if (previous) out.push(previous);
    const pole = (i: ItemInstance) => {
      const f = itemFootprint(i.itemId);
      return f.w * f.h;
    };
    return out.sort((a, b) => pole(b) - pole(a));
  }

  /**
   * Sprowadź stan do zgodnego z dwuręcznością — **wołane po odtworzeniu zapisu**.
   *
   * ⚠ Istnieje, bo `Save.load()` pisze WPROST w sloty (`Equipment.weapon = …`),
   * omijając `equipFromBag` i każdą bramkę w nim. Sprawdzone grepem: to jedyne
   * takie miejsce w `src/`, więc jest dokładnie jedna granica do pilnowania.
   *
   * ⚠ **Pełny plecak NIE powoduje utraty przedmiotu — stan zostaje tolerowany.**
   * Zasada: akcję można odmówić, stanu, który już istnieje, nie. Lalka pokazuje,
   * co masz; reguła bramkuje, co wolno ZROBIĆ. Stan sam się leczy, gdy gracz
   * zwolni slot, a ta funkcja jest idempotentna. Świadomie odrzucone
   * rozwiązanie „zostaw tarczę, ale wyłącz jej blok": wymagałoby warunku w
   * `blockSpec`, czyli w jedynej funkcji, której czystość dowodzi poprawności
   * całego modelu. Szczegóły: `docs/systemy/weapons.md` R-6.
   */
  normalizeHands(): boolean {
    // OBA zestawy, nie tylko czynny: `Save.load()` pisze wprost rowniez
    // w `weapon2`/`offhand2`, wiec ta sama nielegalna para (dwureczna + druga
    // reka) moze przyjsc z zapisu w zestawie schowanym. Gdyby zostala, pierwsza
    // zamiana zestawu wniosla by ja do rak — czyli omineloby to bramke, ktorej
    // ta funkcja pilnuje.
    let zmieniono = false;
    for (const set of [1, 2] as WeaponSetIndex[]) {
      const off = handSlotsOf(set).off as "offhand" | "offhand2";
      const inst = this[off];
      if (!this.usesBothHandsIn(set) || !inst) continue;
      if (!Inventory.addInstance(inst)) continue;
      this[off] = null;
      zmieniono = true;
    }
    return zmieniono;
  }

  /**
   * Move `itemId` from the backpack into its slot, returning whatever was
   * previously equipped there back to the backpack. False if the item isn't
   * equippable, doesn't meet its attribute requirements, or isn't actually in
   * the backpack.
   *
   * The requirement check runs BEFORE the item leaves the backpack. Getting
   * that order wrong would delete the item on a refused equip — the same class
   * of bug as charging for a skill that then fails to be taught.
   *
   * There is no un-equipping when requirements stop being met, because they
   * can't: attributes only ever go up (spendPoint) and there is no respec.
   * Adding one would mean revisiting this.
   */
  equip(itemId: ItemId, preferred?: EquipSlot): boolean {
    const index = Inventory.slots.findIndex((s) => s?.itemId === itemId);
    if (index < 0) return false;
    return this.equipFromBag(index, preferred);
  }

  /**
   * Wear the copy sitting in backpack slot `index`, returning whatever was in
   * the target slot to the backpack.
   *
   * **Slot-addressed, and that is the whole reason this exists.** Once two
   * swords in the bag can differ in workmanship and wear, "equip a sword" is an
   * ambiguous instruction; the UI always knows exactly which one was clicked or
   * dragged, so it says so.
   *
   * The requirement check runs BEFORE the copy leaves the backpack. Getting that
   * order wrong would delete the item on a refused equip — the same class of bug
   * as charging for a skill that then fails to be taught.
   */
  equipFromBag(index: number, preferred?: GearSlot): boolean {
    const inBag = Inventory.at(index);
    if (!inBag) return false;
    const itemId = inBag.itemId;
    // `preferred` is how a drag onto a specific ring finger wins over
    // slotForItem's "first empty" default.
    //
    // ⚠ **Wskazany slot, który ODMAWIA, kończy operację — nie ma zejścia na
    // `slotForItem`. To jest naprawa błędu znalezionego w silniku 2026-09-11,
    // nie ostrożność.** Poprzednia wersja mówiła „ignorowany, jeśli slot nie
    // może tego pomieścić, więc wołający może podać cel na ślepo" i to było
    // prawdą dokładnie do czasu, aż sloty przestały być jednym zestawem:
    // upuszczenie TARCZY na drugą rękę zestawu II (zablokowaną toporem
    // dwuręcznym) dawało `accepts → false`, zejście na `slotForItem → "offhand"`
    // i **założenie tarczy w zestawie CZYNNYM**, wyrzucając stamtąd puklerz.
    // Zmierzone: `equipFromBag(i, "offhand2")` zwracało `true`, a tarcza
    // lądowała w `offhand`. Akcja „załóż tu" nie może po cichu znaczyć
    // „załóż gdzie indziej" — to jest ta sama reguła, przez którą każda odmowa
    // w panelu podaje POWÓD.
    if (preferred && !this.accepts(preferred, itemId)) return false;
    const slot = preferred ?? this.slotForItem(itemId);
    if (!slot) return false;
    if (!this.canEquipInstance(inBag)) return false;
    // ⚠ Osobno od `accepts` — patrz komentarz przy `handsRefusalFor`: gdy
    // `accepts` odmówi, rozstrzyganie slotu spada do `slotForItem` i tarcza
    // weszłaby mimo wszystko. Sprawdzane PRZED `takeAt`, bo odmowa po wyjęciu
    // przedmiotu z plecaka zostawiłaby go w powietrzu.
    // ⚠ Z indeksem: o tym, czy zdjęta rzecz się zmieści, decyduje, KTÓRE pola
    //   zwolni zakładana — nie tylko ile.
    if (this.handsRefusalFor(itemId, slot, index)) return false;

    const taken = Inventory.takeAt(index);
    if (!taken) return false;

    // Broń dwuręczna opróżnia drugą rękę. Dopiero TU, nie wyżej: miejsce dla
    // tarczy bierze się częściowo z pól, które przed chwilą zwolniła sama broń.
    // ⚠ Odkładamy listą `returningFor` W JEJ KOLEJNOŚCI — tą samą, którą
    //   `handsRefusalFor` przepuściło przez `Inventory.canFitAll`, więc
    //   `addInstance` nie może się tu nie udać. Lista jest liczona PRZED
    //   zmianą slotów, bo po niej `this[slot]` to już zakładana rzecz.
    const wraca = this.returningFor(itemId, slot);
    const set = weaponSetOf(slot);
    if (set !== null && isMainHand(slot) && itemHands(itemId) === 2) {
      this[handSlotsOf(set).off as "offhand" | "offhand2"] = null;
    }
    this[slot] = taken;
    // addInstance, not addItem: the copy coming off has to keep its own wear.
    // Routing it through addItem would hand back a factory-fresh replacement,
    // quietly repairing whatever the player had been fighting with.
    for (const inst of wraca) Inventory.addInstance(inst);

    this.emitChanged();
    return true;
  }

  /** Return the copy in `slot` to the backpack and clear the slot. */
  unequip(slot: GearSlot): boolean {
    const inst = this[slot];
    if (!inst) return false;
    if (!Inventory.addInstance(inst)) return false;
    this[slot] = null;
    this.emitChanged();
    return true;
  }

  /**
   * Zamien zestaw czynny ze schowanym. `null` = zamieniono.
   *
   * WAZNE: **Zamiana jest FIZYCZNYM przeniesieniem zawartosci, a nie
   * przestawieniem wskaznika "ktory zestaw jest czynny", i ta roznica byla
   * decyzja.** Wariant ze wskaznikiem wymagalby, zeby `Equipment.weapon` stalo
   * sie getterem — a `Save.load()` pisze w to pole WPROST (jedyne takie miejsce
   * w `src/`, patrz `normalizeHands`), `Progression` i `Player` czytaja je co
   * klatke, a `this[slot] = taken` w `equipFromBag` adresuje je indeksem.
   * Przeniesienie zawartosci nie dotyka zadnego z tych trzech miejsc; getter
   * dotykalby wszystkich.
   *
   * WAZNE: **Nie wraca przez plecak i nie moze.** Gdyby zamiana odkladala bron
   * do plecaka i wyjmowala druga, pelny plecak blokowalby zamiane — a wtedy
   * drugi zestaw przestawalby dzialac dokladnie wtedy, kiedy jest potrzebny
   * (w terenie, z pelnym workiem lupu).
   *
   * WAZNE: **`emitChanged` zeruje `activeAttack` przy zmianie broni** i to jest
   * tu dokladnie pozadane: wariant ataku wybrany dla topora nie moze zostac
   * indeksem w tablicy mlota.
   */
  swapWeaponSet(): SwapRefusal | null {
    if (!this.weapon && !this.offhand && !this.weapon2 && !this.offhand2) {
      return { kind: "empty" };
    }
    // Sprawdzane PRZED jakakolwiek mutacja — odmowa w polowie zamiany
    // zostawilaby zestaw rozdzielony miedzy obie pary.
    for (const inst of [this.weapon2, this.offhand2]) {
      if (!inst) continue;
      const unmet = this.unmetFor(inst);
      if (unmet.length > 0) {
        return { kind: "requirements", itemName: getItem(inst.itemId).name, unmet };
      }
    }
    const heldWeapon = this.weapon;
    const heldOffhand = this.offhand;
    this.weapon = this.weapon2;
    this.offhand = this.offhand2;
    this.weapon2 = heldWeapon;
    this.offhand2 = heldOffhand;
    this.emitChanged();
    return null;
  }

  /** Czy w zestawie schowanym cokolwiek lezy — panel maluje tym przycisk
   *  zamiany, a nie chowa go: przycisk niedostepny ma byc WIDOCZNY z powodem
   *  (regula `src/ui/CLAUDE.md`). */
  get hasStowedSet(): boolean {
    return !!this.weapon2 || !!this.offhand2;
  }

  /**
   * Where `itemId` would go, or null if it isn't equippable. Public so the UI
   * can highlight the target slot when an item is selected.
   *
   * For a ring this prefers an EMPTY finger, falling back to the first one so
   * a plain double-click with both fingers full still swaps something rather
   * than appearing to do nothing.
   */
  slotForItem(itemId: ItemId): EquipSlot | null {
    const def = getItem(itemId);
    if (def.type === "weapon") return "weapon";
    if (def.type === "armor") return armorAddress(itemId, def.slot);
    if (def.type === "ring") return RING_SLOTS.find((s) => this[s] === null) ?? RING_SLOTS[0];
    if (def.type === "amulet") return "amulet";
    return null;
  }

  /** Can this CONCRETE slot hold `itemId`? Unlike slotForItem this answers
   *  about one specific slot, which is what a drop target needs. */
  accepts(slot: GearSlot, itemId: ItemId): boolean {
    const def = getItem(itemId);
    const set = weaponSetOf(slot);
    // Druga ręka zajęta przez broń dwuręczną nie przyjmuje niczego. To bramkuje
    // PODŚWIETLANIE celu upuszczenia; samą operację bramkuje `equipFromBag`
    // przez `handsRefusalFor` — potrzebne są oba, patrz komentarz tam.
    //
    // ⚠ Pytane o WŁASNY zestaw slotu, nie o czynny: dwuręczny topór schowany
    // w zestawie II blokuje `offhand2`, a nie `offhand`.
    if (set !== null && isOffHand(slot) && this.usesBothHandsIn(set)) return false;
    if (def.type === "weapon") {
      // ⚠ **Broń JEDNORĘCZNA wolno położyć w drugiej ręce (Dual Wield,
      // prototyp 2026-09-05).** Dwuręczna nie — `itemHands` jest tu jedynym
      // pytaniem, bo `usesBothHands` wyżej pilnuje już drugiej strony
      // (dwuręczna w GŁÓWNEJ ręce blokuje slot obok).
      //
      // ⛔ **Bramki poziomu Dwuręczności tu NIE MA i to jest świadome** —
      // system poziomów DW nie istnieje, więc udawanie go warunkiem na typ
      // broni byłoby wymyśloną regułą w miejscu, które o niej nie decyduje.
      if (set !== null && isOffHand(slot)) return itemHands(itemId) === 1;
      return set !== null && isMainHand(slot);
    }
    // ⚠ Tarcza to `type: "armor"` ze `slot: "offhand"`, więc ta gałąź musi znać
    // schowaną drugą rękę — inaczej „broń + tarcza" dałoby się zbudować
    // wyłącznie w zestawie czynnym, czyli w zestawie, który akurat trzymasz.
    if (def.type === "armor") {
      // ⚠ Druga ręka zestawu schowanego przyjmuje to, co czynnego — bez zmian.
      if (slot === "offhand2" && def.slot === "offhand") return true;
      // ⭐ Dla obszarów warstwowanych adres musi zgadzać się **co do WARSTWY**,
      // nie tylko co do obszaru. Inaczej upuszczenie kirysu na kafel podkładu
      // po cichu zrobiłoby z płyty wyściółkę.
      return slot === armorAddress(itemId, def.slot);
    }
    if (def.type === "ring") return RING_SLOTS.includes(slot as EquipSlot);
    if (def.type === "amulet") return slot === "amulet";
    return false;
  }

  /* ── Bags ────────────────────────────────────────────────────────────── */

  /** Which BAG_SLOT an unworn container would fill — first empty, like rings
   *  (`RING_SLOTS`). `null` for anything that isn't a container. */
  bagSlotFor(itemId: ItemId): BagSlot | null {
    if (getItem(itemId).type !== "container") return null;
    return BAG_SLOTS.find((s) => this[s] === null) ?? BAG_SLOTS[0];
  }

  /** Can this CONCRETE bag slot hold `itemId`? Every bag slot takes any
   *  container — unlike EQUIP_SLOTS there is no per-slot restriction — so
   *  this only answers "is it a bag at all", the way a drop target needs. */
  acceptsBag(itemId: ItemId): boolean {
    return getItem(itemId).type === "container";
  }

  /**
   * Hand a worn container back to the backpack, shrinking capacity by its
   * slots first. Refuses (no change AT ALL — not even a partial shrink) if
   * any occupied slot would fall outside the smaller capacity, or if there
   * would be no room left for the container itself.
   *
   * ⚠ **"No auto-reorganizing" (`docs/inventory_scroll_ux.md` §7/§8) is the
   * reason this can refuse at all** — a system willing to shuffle items down
   * to make room would never need to. Kept private: callers check
   * `bagUnequipRefusal` first to explain WHY, and `unequipBag`/
   * `equipBagFromBag` are the only two paths that ever call it.
   */
  private tryReturnBag(inst: ItemInstance): boolean {
    const shrinkBy = containerSlots(inst.itemId);
    const newCap = Inventory.capacity - shrinkBy;
    if (!Inventory.canSetCapacity(newCap)) return false;
    if (Inventory.freeSlotCountBelow(newCap) < 1) return false;
    if (!Inventory.setCapacity(newCap)) return false;
    if (!Inventory.addInstance(inst)) {
      // Shouldn't happen given the checks above — but never strand a bag
      // mid-air. Same "refused action, not lost state" rule as `Save.load`.
      Inventory.setCapacity(Inventory.capacity + shrinkBy);
      return false;
    }
    return true;
  }

  /**
   * Why `unequipBag(slot)` would refuse right now, or `null` if it wouldn't.
   * Pure — makes no changes, mirrors `handsRefusalFor`'s role for the doll.
   *
   * `need` counts two things: copies sitting at an index the shrink would cut
   * off (`overflow`), plus one more if there'd be no free slot left below
   * that line for the container itself once it comes off.
   */
  bagUnequipRefusal(slot: BagSlot): BagUnequipRefusal | null {
    const inst = this[slot];
    if (!inst) return null;
    const shrinkBy = containerSlots(inst.itemId);
    const newCap = Inventory.capacity - shrinkBy;
    let overflow = 0;
    for (let i = newCap; i < Inventory.slots.length; i++) {
      if (Inventory.at(i)) overflow++;
    }
    const needsRoomForItself = Inventory.freeSlotCountBelow(newCap) > 0 ? 0 : 1;
    const need = overflow + needsRoomForItself;
    return need > 0 ? { need } : null;
  }

  /** Return the container in `slot` to the backpack, shrinking capacity.
   *  False (no change) exactly when `bagUnequipRefusal(slot)` is non-null. */
  unequipBag(slot: BagSlot): boolean {
    const inst = this[slot];
    if (!inst) return false;
    if (!this.tryReturnBag(inst)) return false;
    this[slot] = null;
    this.emitBagsChanged();
    return true;
  }

  /**
   * Wear the container sitting in backpack slot `index`. Grows capacity
   * BEFORE anything else, so swapping a bag for an equal-or-bigger one never
   * looks momentarily full. If the target slot already holds a bag, that one
   * is handed back through the same check `unequipBag` uses — on refusal,
   * the whole swap is undone rather than leaving the old bag stranded.
   */
  equipBagFromBag(index: number, preferred?: BagSlot): boolean {
    const inBag = Inventory.at(index);
    if (!inBag) return false;
    const itemId = inBag.itemId;
    if (getItem(itemId).type !== "container") return false;
    const slot = preferred && this.acceptsBag(itemId) ? preferred : this.bagSlotFor(itemId);
    if (!slot) return false;

    const taken = Inventory.takeAt(index);
    if (!taken) return false;

    const grownBy = containerSlots(itemId);
    Inventory.setCapacity(Inventory.capacity + grownBy);
    const previous = this[slot];
    this[slot] = taken;

    if (previous && !this.tryReturnBag(previous)) {
      // Undo everything — the outgoing bag has nowhere to go, so nothing
      // about this drop happened.
      this[slot] = previous;
      Inventory.setCapacity(Inventory.capacity - grownBy);
      Inventory.addInstance(taken);
      return false;
    }

    this.emitBagsChanged();
    return true;
  }

  emitBagsChanged(): void {
    GameEvents.emit(EVENT.bagsChanged, {
      bag1: this.bag1,
      bag2: this.bag2,
      bag3: this.bag3,
      bag4: this.bag4,
    });
  }

  /** Is this item worn in ANY slot right now? Scans every slot rather than
   *  asking `slotForItem` where it *would* go, because a ring is legitimately
   *  worn on either finger. Used by `equip` quest objectives, which read the
   *  worn state live instead of latching (see `Quests.Objective`). */
  isEquipped(itemId: ItemId): boolean {
    return EQUIP_SLOTS.some((slot) => this[slot]?.itemId === itemId);
  }

  /**
   * Lift the copy out of `slot` without putting it anywhere — for callers that
   * are about to dispose of it themselves (selling equipped gear).
   *
   * Separate from `unequip` on purpose: unequip has to refuse when the backpack
   * is full, and a sale must not.
   */
  takeFrom(slot: GearSlot): ItemInstance | null {
    const inst = this[slot];
    if (!inst) return null;
    this[slot] = null;
    this.emitChanged();
    return inst;
  }

  /**
   * Identyfikatory wszystkiego, co postac ma NA SOBIE — wejscie do liczenia
   * zestawow.
   *
   * WAZNE: idzie po `EQUIP_SLOTS`, wiec zestaw SCHOWANY sie nie liczy. To nie
   * jest przeoczenie: komplet w plecaku nie jest kompletem na sobie, a inaczej
   * daloby sie nosic premie dwoch kompletow naraz.
   */
  get wornItemIds(): ItemId[] {
    const out: ItemId[] = [];
    for (const slot of EQUIP_SLOTS) {
      const inst = this[slot];
      if (inst) out.push(inst.itemId);
    }
    return out;
  }

  /**
   * **ELEMENTY zestawu, jakie postać ma na sobie: przedmiot + MIEJSCE.**
   *
   * ⚠⚠ To jest wejście do liczenia zestawów od reguły `(set, area)`
   * (decyzja 2026-09-15), a nie `wornItemIds`. Różnica jest jedna i cała:
   * **trzy warstwy obszaru zwijają się do jednego miejsca**, więc zestaw,
   * którego dwóch członków da się nosić jeden na drugim, liczy z tego obszaru
   * jeden element. ⛔ Nie wołaj tu `itemLayer()` — miejsce bierze się z ADRESU
   * (`placeOfSlot`), żeby `set` i `layer` zostały rozłączne (`D4`).
   */
  get wornElements(): WornElement[] {
    const out: WornElement[] = [];
    for (const slot of EQUIP_SLOTS) {
      const inst = this[slot];
      if (inst) out.push({ place: placeOfSlot(slot), itemId: inst.itemId });
    }
    return out;
  }

  /** Stan zestawow przedmiotow — to, co rysuje panel. Liczone na swiezo, bo
   *  wola to wylacznie otwarty ekwipunek, nie petla klatkowa. */
  get setProgress(): SetProgress[] {
    return setProgressFor(this.wornElements);
  }

  /**
   * Premie zestawow, policzone RAZ na zmiane ekwipunku.
   *
   * WAZNE: **bez tego bufora `sumBonus` przeliczalby zestawy w petli
   * klatkowej.** `Progression.maxHp`/`critChance`/`attackSpeed` czyta HUD
   * i walka, a `setProgressFor` buduje mape i sortuje wynik — sensowna cena raz
   * na zalozenie przedmiotu, bezsensowna szescdziesiat razy na sekunde.
   * Uniewazniane w `emitChanged`, czyli w jedynym miejscu, przez ktore
   * przechodzi KAZDA zmiana zalozonego sprzetu.
   */
  private setBonusCache: Partial<Record<BonusKey, number>> | null = null;

  private setBonus(key: BonusKey): number {
    if (!this.setBonusCache) {
      const worn = this.wornElements;
      this.setBonusCache = {
        maxHp: setBonusFor(worn, "maxHp"),
        critChance: setBonusFor(worn, "critChance"),
        attackSpeed: setBonusFor(worn, "attackSpeed"),
        defense: setBonusFor(worn, "defense"),
      };
    }
    return this.setBonusCache[key] ?? 0;
  }

  /** Sum one derived-stat bonus across everything worn. Scans every slot, not
   *  just the rings, so armour can grow a `bonus` later for free.
   *
   *  WAZNE: **premia ZESTAWU wchodzi tym samym kanalem, co premia przedmiotu**
   *  — i to jest jedyny powod, dla ktorego zestawy nie wymagaly ani jednej
   *  zmiany w `Progression`, `Player` czy HUD. Gdyby zestawy mialy wlasny
   *  kanal, kazdy konsument statystyki pochodnej musialby o nich wiedziec. */
  private sumBonus(key: BonusKey): number {
    const fromItems = EQUIP_SLOTS.reduce((total, slot) => {
      const inst = this[slot];
      if (!inst) return total;
      const def = getItem(inst.itemId);
      const bonus = ("bonus" in def ? def.bonus : {}) as Partial<Record<BonusKey, number>>;
      return total + (bonus[key] ?? 0);
    }, 0);
    return fromItems + this.setBonus(key);
  }

  // ── OBCIĄŻENIE WYPOSAŻENIA — MODEL D, DWIE OSIE ────────────────────────
  //
  // ⭐⭐ **Siła może kompensować względny WYSIŁEK, ale nie kompensuje
  // bezwzględnej MASY.** To zdanie generuje całą tę sekcję
  // (`docs/decyzje/2026-09-15-obciazenie-dwie-osie.md`).
  //
  // ⚠ **Liczy się to, co postać ma NA SOBIE** — `EQUIP_SLOTS` **oraz
  // `STOW_SLOTS`**. Schowany zestaw broni waży 100% swojej masy, bo leży na
  // ciele (`OI-96`, 2026-09-15). ⛔ **Plecak, dodatkowe torby i skrzynia nadal
  // nie ważą ani grama** — osobna, nietknięta decyzja: gracz ma móc nosić dużo
  // rzeczy, a płacić za to, co ma na sobie (`docs/inventory_scroll_ux.md` §3).
  //
  // ⚠ **Obciążenie ma DOKŁADNIE TRZY kanały** i każdy wisi na innej osi:
  //   • `speedMultiplier` ← masa bezwzględna  (Siła NIE pomaga)
  //   • `regenMultiplier` ← masa bezwzględna  (Siła NIE pomaga)
  //   • `loadMultiplier`  ← `loadRatio`       (Siła wykupuje)
  // ⛔ **Czwartym kanałem NIE jest tempo ataku.** Koszt zamachu zostaje poza
  // tym modelem, żeby ciężki wojownik zachował swoje „kilka pierwszych ciosów";
  // gorsza ma być wydolność, nie burst.

  /**
   * Suma wag tego, co postać ma na sobie — sprzęt założony **i schowany
   * zestaw broni**. Przedmiot bez `weight` waży zero (biżuteria nie ma po co
   * deklarować masy).
   *
   * ⚠ **`STOW_SLOTS` wchodzą TYLKO tutaj.** `totalDefense` i `sumBonus`
   * zostają na samym `EQUIP_SLOTS` — schowany topór nadal nie chroni i nie
   * daje premii, zmienił się wyłącznie jego udział w masie.
   *
   * ⭐ Zamiana zestawów jest przez to **neutralna masowo**: `swapWeaponSet()`
   * wymienia zawartość par, więc suma się nie zmienia.
   */
  get equippedWeight(): number {
    const weightOf = (inst: ItemInstance | null): number => {
      if (!inst) return 0;
      const def = getItem(inst.itemId);
      return "weight" in def ? def.weight : 0;
    };
    const worn = EQUIP_SLOTS.reduce((total, slot) => total + weightOf(this[slot]), 0);
    return STOW_SLOTS.reduce((total, slot) => total + weightOf(this[slot]), worn);
  }

  /**
   * Czy ten KONKRETNY egzemplarz jest w tej chwili na postaci — w slocie
   * czynnym **albo w schowanym zestawie broni**.
   *
   * ⚠ Istnieje, bo `slotForItem()` odpowiada na pytanie „gdzie TAKI przedmiot
   * wchodzi" i zwraca zawsze slot CZYNNY. Od chwili, gdy `STOW_SLOTS` ważą
   * (`OI-96`), pytanie „czy ta sztuka już się liczy do obciążenia" przestało
   * mieć tę samą odpowiedź — a karta przedmiotu (`ItemCard`) zadaje właśnie to drugie.
   */
  isWorn(inst: ItemInstance): boolean {
    return EQUIP_SLOTS.some((slot) => this[slot] === inst) || STOW_SLOTS.some((slot) => this[slot] === inst);
  }

  /**
   * Ile postać unosi bez kary WYSIŁKU.
   *
   * ⚠ **Malejący przyrost powyżej `softCapStrength`.** Przy dawnym wzorze
   * liniowym bez sufitu 107 kg mieściło się w klasie „Lekkie" przy Sile 70,
   * czyli atrybut normalizował dowolną masę. Poniżej progu nic się nie zmienia.
   *
   * ⚠ **Udźwig NIE dotyka prędkości ani regeneracji** — te wiszą na
   * kilogramach i Siła ich nie rusza. To jest cała treść „Siła pozwala nosić
   * ciężki loadout, ale nie sprawia, że przestaje być ciężki".
   */
  get loadCapacity(): number {
    const str = Progression.strength;
    const soft = EQUIPMENT_LOAD.softCapStrength;
    if (str <= soft) return EQUIPMENT_LOAD.base + str * EQUIPMENT_LOAD.perStrength;
    return (
      EQUIPMENT_LOAD.base +
      soft * EQUIPMENT_LOAD.perStrength +
      (str - soft) * EQUIPMENT_LOAD.perStrengthAbove
    );
  }

  /** Wykorzystanie udźwigu, 0..∞. Powyżej 1 znaczy „ponad stan", ale **nie
   *  jest to bramka** — nic się nie odmawia, rośnie tylko koszt wysiłku. */
  get loadRatio(): number {
    return this.loadCapacity > 0 ? this.equippedWeight / this.loadCapacity : 0;
  }

  /**
   * Klasa obciążenia — dziś **wyłącznie ETYKIETA dla HUD**, nie próg kary.
   *
   * ⚠ Kara jest ciągła na wszystkich trzech kanałach; trzy nazwy nad wartością
   * ciągłą to ten sam wzorzec, co `STAMINA.states`. ⛔ Nie buduj na tej
   * wartości żadnej mechaniki — model progowy nie potrafił rozróżnić `ratio`
   * 0,91 od 1,82 (`OI-101`) i właśnie dlatego odszedł.
   */
  get loadClass(): "light" | "medium" | "heavy" {
    const r = this.loadRatio;
    if (r > EQUIPMENT_LOAD.heavyAbove) return "heavy";
    if (r > EQUIPMENT_LOAD.mediumAbove) return "medium";
    return "light";
  }

  /**
   * **Kanał WYSIŁKU** — mnożnik kosztu uniku i sprintu. Czyta go
   * `GameScene`/`Player`, bo `Stamina` celowo nie importuje ani `Equipment`,
   * ani `Progression`.
   *
   * ⚠ **Ciągły i BEZ SUFITU** (`OI-101`): `ratio` 1,00 i 2,67 różnią się
   * dziś ×2,07, a przed zmianą kosztowały identycznie.
   * ⭐ **Jedyny kanał, który Siła wykupuje** — przy Sile 70 z kary 75,5 kg
   * zostaje 7%.
   */
  get loadMultiplier(): number {
    const over = Math.max(0, this.loadRatio - EQUIPMENT_LOAD.effortFreeRatio);
    const kara = EQUIPMENT_LOAD.effortPerRatio * over;
    return 1 + kara * (1 - ArmorTraining.effortRelief);
  }

  /**
   * **Kanał RUCHU** — mnożnik prędkości chodu (i przez to sprintu, bo ten jest
   * krotnością chodu). Czyta go `Player.speedMultiplier`.
   *
   * ⛔⛔ **Siła NIE wchodzi do tego wzoru i nie wolno jej tu dopisać.**
   * To jest ten kanał, przez który 75,5 kg porusza się tak samo wolno przy
   * Sile 10 i przy Sile 70 — czyli cała zasada Modelu D.
   *
   * ⚠ Kształt `K/(K+x)` jest ten sam, co `d/(d+defenseK)` w `Protection`.
   */
  get speedMultiplier(): number {
    return this.masaMultiplier(
      EQUIPMENT_LOAD.speedFreeKg,
      EQUIPMENT_LOAD.speedK,
      EQUIPMENT_LOAD.speedFloor,
      ArmorTraining.speedRelief,
    );
  }

  /**
   * **Kanał WYDOLNOŚCI** — mnożnik tempa regeneracji staminy. Podaje go
   * `GameScene` do `Stamina.tick`.
   *
   * ⭐ **To jest mechanika „kilku pierwszych ciosów".** Koszt zamachu zostaje
   * nietknięty, więc ciężki wojownik uderza tak samo od pierwszej sekundy —
   * po prostu nie odrabia. ⛔ Nie zastępuj tego karą do tempa ataku.
   */
  get regenMultiplier(): number {
    return this.masaMultiplier(
      EQUIPMENT_LOAD.regenFreeKg,
      EQUIPMENT_LOAD.regenK,
      EQUIPMENT_LOAD.regenFloor,
      ArmorTraining.regenRelief,
    );
  }

  /**
   * Wspólny kształt obu osi bezwzględnych: `K / (K + max(0, kg − próg))`,
   * z podłogą i z ulgą treningu zdejmującą UŁAMEK KARY (nie mnożącą wyniku).
   *
   * ⚠ **Próg swobodny jest PARAMETREM, nie stałą wspólną.** Dziś obie osie mają
   * go równego (10 kg), ale sczytanie jednej stałej dla obu kanałów sprawiłoby,
   * że przestrojenie `regenFreeKg` po cichu nic nie robi.
   *
   * ⚠ Ulga działa na KARĘ, nie na mnożnik — inaczej `relief = 1` dawałoby
   * mnożnik większy od 1, czyli premię za noszenie ciężaru.
   */
  private masaMultiplier(freeKg: number, k: number, floor: number, relief: number): number {
    const nad = Math.max(0, this.equippedWeight - freeKg);
    const surowy = Math.max(floor, k / (k + nad));
    return 1 - (1 - surowy) * (1 - relief);
  }

  get loadLabel(): string {
    return EQUIPMENT_LOAD.label[this.loadClass];
  }

  /**
   * Ile staminy kosztuje ZABLOKOWANIE jednego ciosu tą tarczą.
   *
   * ⚠ **Koszt należy do TARCZY, nie do mechaniki** (mała tarcza przyjmuje
   * mniej masy niż pawęż), a `blockFallback` istnieje dla tarcz, które go nie
   * zadeklarowały. ⚠ Płaci się za **faktycznie zablokowany cios**, nigdy za
   * samo trzymanie tarczy — bierny podatek za posiadanie sprzętu to dokładnie
   * ta mechanika, której nie chcemy.
   */
  get blockStaminaCost(): number {
    return this.blockSpec?.staminaCost ?? 0;
  }

  /**
   * **UDŹWIG BLOKU w punktach** — ile ta tarcza znosi bez przeciążenia
   * (`T-7`, 2026-09-15). `0`, gdy druga ręka nie blokuje.
   *
   * ```
   * (capacityBase + capacityPerKg × kg) × (1 + jakość) × stan
   * ```
   *
   * ⚠ **Ani jednego nowego pola na przedmiocie.** Masa niesie materiał
   * i grubość (dziś: konstrukcję), `QUALITY.modifiers.defense` — wykonanie,
   * `conditionMul` — zużycie. ⛔ To jest warunek, pod którym ten zakres nie
   * otwiera osi `Variant` z `docs/tarcze_checkpoint.md` §1.2.
   *
   * ⚠ **Ta sama tabela jakości, co przy `blockSpec.reduction`** — bo to jest
   * pojęciowo ta sama rzecz („jak blisko potencjału stoi ten egzemplarz").
   * Druga tabela zaczęłaby się rozjeżdżać przy pierwszym strojeniu.
   *
   * Dziś: puklerz (1,5 kg, Q3, całe) → **6,5**; tarcza okuta (5 kg) → **17,0**.
   */
  get blockCapacity(): number {
    if (!this.offhand) return 0;
    const def = getItem(this.offhand.itemId);
    if (!("block" in def)) return 0;
    const b = SHIELD.block;
    // ⚠ Ta sama konwencja, co w `equippedWeight`: przedmiot bez `weight`
    // waży zero. Odczyt przez `in`, bo `ItemDef` jest unią i pole nie istnieje
    // na każdym wariancie — `?.` nie wystarczy, `tsc` odmówi.
    const kg = "weight" in def ? def.weight : 0;
    const baza = b.capacityBase + b.capacityPerKg * kg;
    const skala = (1 + qualityMul("defense", qualityOf(this.offhand))) * conditionMul(this.offhand);
    return Math.max(0, baza * skala);
  }

  /**
   * **Koszt wysiłku za JEDEN zablokowany cios** — zależny od tego, ile tarcza
   * faktycznie przyjęła (`T-7`, 2026-09-15).
   *
   * ```
   * (rdzeń + strainPerPoint/(kg + massSoftening) × przyjęte) × costMul[stopień]
   *          × (1 − ShieldSkill.relief)
   * ```
   *
   * ⚠⚠ **To zastąpiło stawkę RYCZAŁTOWĄ i to jest cała treść zmiany.** Do
   * 2026-09-15 blok kosztował `BlockSpec.staminaCost` — 3 albo 5 punktów,
   * identycznie za draśnięcie królika i za szarżę dzika. Ten getter zostaje
   * jako **rdzeń** (cena samego podstawienia tarczy, własność konstrukcji),
   * a reszta rachunku przychodzi z ciosu.
   *
   * ⭐⭐ **Masa działa tu w DWIE strony i z tego wychodzi tożsamość
   * konstrukcji, bez ani jednej tabeli per tarcza:** ciężka ma wysoki rdzeń
   * i NISKI koszt za punkt (cios idzie w ramę), lekka — odwrotnie (cios idzie
   * w rękę). Puklerz jest więc tani na lekkie ciosy i drogi na ciężkie,
   * tarcza okuta odwrotnie.
   *
   * ⚠ **Stawka jest nadal ta sama w OBU STREFACH bloku** (`front`/`side`)
   * i to jest niezmieniona decyzja z 2026-09-05: kara za gorszą strefę
   * przychodzi sama, bo słabszy blok przepuszcza więcej punktów — a od `T-7`
   * także **zatrzymuje ich mniej**, więc różnicuje się i ta strona rachunku.
   *
   * ⚠ **Nigdy nie schodzi poniżej zera** — `spend()` nie zna ujemnego kosztu,
   * a ulga umiejętności ma sufit ułamkowy (`SHIELD_SKILL.maxRelief`).
   */
  blockStaminaCostFor(absorbed: number, grade: BlockGrade): number {
    const spec = this.blockSpec;
    if (!spec || grade === "none") return 0;
    const b = SHIELD.block;
    const def = this.offhand ? getItem(this.offhand.itemId) : null;
    const kg = def && "weight" in def ? def.weight : 0;
    const zaPunkt = b.strainPerPoint / (kg + b.massSoftening);
    const surowy = (spec.staminaCost + zaPunkt * Math.max(0, absorbed)) * b.costMul[grade];
    return Math.max(0, surowy * (1 - ShieldSkill.relief));
  }

  /** Flat max-HP granted by gear (rings). Folded into Progression.maxHp. */
  get bonusMaxHp(): number {
    return this.sumBonus("maxHp");
  }

  /** Extra crit chance (0..1) from gear, before Progression's cap. */
  get bonusCritChance(): number {
    return this.sumBonus("critChance");
  }

  /** Extra attack-speed fraction from gear, before Progression's cap. */
  get bonusAttackSpeed(): number {
    return this.sumBonus("attackSpeed");
  }

  /** Equipped weapon's damage range **after workmanship and wear**, or null for
   *  bare hands. */
  get weaponDamage(): { min: number; max: number } | null {
    if (!this.weapon) return null;
    const base = instanceDamage(this.weapon);
    if (!base) return null;
    // ⭐ **Czwarty mnożnik na tym samym zakresie: gatunek × jakość × stan ×
    // CHWYT.** Trzy pierwsze przykłada `instanceDamage` (własność egzemplarza
    // i typu); czwarty należy do SYTUACJI, więc mieszka tutaj, a nie w `Quality`.
    // ⚠ Dzięki temu karta przedmiotu (`instanceDamage`) dalej pokazuje pełny
    // profil konstrukcji, a walka (`Progression` → ten getter) liczy to, czym
    // gracz naprawdę macha.
    const mul = this.gripDamageMul();
    return mul === 1 ? base : { min: base.min * mul, max: base.max * mul };
  }

  /**
   * Jak mocno założona broń skaluje się z Siłą i Zręcznością, albo `null` dla
   * gołych rąk (wtedy `Progression` bierze `PLAYER`).
   *
   * ⚠ **To jest oś należąca do PRZEDMIOTU, nie do atrybutu** — tak samo jak
   * `hands` czy `attackCooldown`. Atrybut mówi „ile mam", broń mówi „ile ci
   * z tego oddam", i dlatego młot i sztylet potrafią należeć do dwóch różnych
   * buildów mimo jednej tabeli `ATTRIBUTES`. Uzasadnienie i kalibracja:
   * komentarz nad `ATTRIBUTES` oraz `docs/atrybuty.md` §10.
   *
   * ⚠ **Świadomie NIE przechodzi przez jakość wykonania.** Arcymistrzowski
   * miecz jest lepszym mieczem, a nie mieczem, który nagle nagradza inny
   * build — jakość skaluje `instanceDamage` (bazę), a skalowanie mnoży to, co
   * z tego wyszło. Zmieszanie obu dałoby jakość podnoszącą wpływ atrybutu,
   * czyli dokładnie ten łańcuch mnożników, przed którym ostrzega
   * `docs/atrybuty.md` §8.4.
   */
  get weaponScaling(): { str: number; dex: number } | null {
    if (!this.weapon) return null;
    const def = getItem(this.weapon.itemId);
    if (def.type !== "weapon") return null;
    return { str: def.strScale, dex: def.dexScale };
  }

  /** Equipped weapon's seconds-between-attacks, or null for bare hands.
   *
   *  The BASE cadence — workmanship's contribution rides on
   *  `weaponQualitySpeed` instead, because it has to pass through the same cap
   *  as gear bonuses before it can touch the swing. See Progression. */
  get weaponAttackCooldown(): number | null {
    if (!this.weapon) return null;
    const def = getItem(this.weapon.itemId);
    return def.type === "weapon" ? def.attackCooldown : null;
  }

  /**
   * Handling bonus from the equipped weapon's workmanship, as a raw fraction.
   *
   * ⚠ Must be folded into `ATTRIBUTES.maxAttackSpeedBonus` alongside gear, never
   * added after it — `swingDurationMs` scales off the capped number, and
   * anything that gets past the cap makes the attack pose stutter.
   */
  get weaponQualitySpeed(): number {
    return this.weapon ? instanceAttackSpeed(this.weapon) : 0;
  }

  /** Is the equipped weapon worn out? Its damage is already reduced; this is for
   *  telling the player so. */
  get weaponBroken(): boolean {
    return !!this.weapon && isDestroyed(this.weapon);
  }

  /**
   * Spend one swing's worth of the equipped weapon's durability. Returns true
   * only on the swing that broke it, so the caller announces it once.
   *
   * ⚠ Called ONCE PER SWING, never once per enemy hit — see
   * `EQUIPMENT.durability.wearChance` for the measured reason.
   */
  wearWeapon(slot: "weapon" | "offhand" = "weapon"): boolean {
    // ⚠ **Parametr, a nie druga metoda** (2026-09-05, Dual Wield): zużywa się
    // ta ręka, która wyprowadziła cios. Domyślnie główna, więc ani jedno
    // istniejące wywołanie nie zmienia zachowania.
    const w = slot === "offhand" ? this.offhandWeapon : this.weapon;
    if (!w) return false;
    const broke = applyWear(w);
    // Emitting on every wear tick would fire ~2 events/second and drag the HUD,
    // both panels and an autosave along with it; the durability readout is
    // pulled fresh whenever a panel opens. Breaking, though, changes the
    // player's damage and has to land immediately.
    if (broke) this.emitChanged();
    return broke;
  }

  /**
   * **Zużyj trwałość tarczy za JEDEN ZABLOKOWANY CIOS.** `true` tylko wtedy,
   * gdy to wywołanie ją rozbiło — żeby wołający ogłosił to raz, nie co klatkę.
   *
   * ⚠ **Bliźniak `wearWeapon`, celowo osobna metoda, a nie jego parametr.**
   * Tamta pyta „która ręka wyprowadziła cios"; ta pyta o przedmiot, który cios
   * PRZYJĄŁ. To są dwa różne zdarzenia bojowe i wołają je dwa różne miejsca —
   * sklejenie ich jednym parametrem robiłoby z nich jedno pojęcie.
   *
   * ⚠ **Wołane za FAKTYCZNIE ZABLOKOWANY cios, nigdy za noszenie tarczy** —
   * dokładnie tą samą regułą, którą rządzi się koszt wysiłku (N-27). Stoi
   * w `Player.takeDamage` obok `Stamina.spend(blockStaminaCost)`, bo odpowiada
   * na to samo pytanie: „co kosztowało zasłonięcie się".
   *
   * ⚠ **Stawka jest ta sama w obu strefach bloku** — ta sama decyzja, co przy
   * staminie: zużycie należy do ciosu przyjętego na tarczę, nie do jakości
   * ustawienia. Kara za gorszą strefę i tak przychodzi sama, bo słabszy blok
   * przepuszcza więcej obrażeń.
   *
   * ⚠⚠ **`strain` skaluje SZANSĘ zużycia stopniem bloku** (`T-7`, 2026-09-15)
   * — `SHIELD.block.wearStrain`. Do tej daty stało tu „`applyWear` bez zmian:
   * ta sama szansa i ten sam ubytek, co przy broni", z uzasadnieniem *osobny
   * model zużycia dla tarcz byłby drugim systemem naprawy i pierwszą rzeczą,
   * która rozjechałaby się z bronią*.
   *
   * ⭐ **To uzasadnienie ZOSTAJE W MOCY i nic go nie łamie.** Model jest nadal
   * JEDEN (`Quality.applyWear`), config jeden (`EQUIPMENT.durability`),
   * naprawa jedna. Zmieniło się wyłącznie to, że wołający mówi, **ile
   * zdarzenie ważyło** — dokładnie tak, jak `Stamina.hitCost` liczy się od
   * `mitigated`, a nie od liczby ciosów. ⚠ **Broń woła bez argumentu**, więc
   * jej zużycie jest nietknięte co do bitu.
   */
  wearShield(strain = 1): boolean {
    if (!this.offhand) return false;
    // ⚠ Pyta o ZDOLNOŚĆ, nie o typ przedmiotu: tarczą jest to, co potrafi
    // blokować (ta sama reguła, co w bramce Uderzenia tarczą). Pochodnia albo
    // kołczan w tym slocie nie zużyje się od cudzego ciosu.
    if (!("block" in getItem(this.offhand.itemId))) return false;
    const broke = applyWear(this.offhand, strain);
    // Emisja tylko przy ROZBICIU — ta sama zasada, co w `wearWeapon`: tick co
    // kilka bloków ciągnąłby za sobą HUD, oba panele i autozapis, a odczyt
    // trwałości i tak jest pobierany świeżo przy otwarciu panelu. Rozbicie
    // zmienia skuteczność bloku, więc musi dojść natychmiast.
    if (broke) this.emitChanged();
    return broke;
  }

  /**
   * Equipped weapon's melee shape — hit arc, reach, knockback, crit bonuses and
   * whether it interrupts. Null for bare hands, which fall back to
   * `PLAYER.melee`.
   *
   * This is what makes a weapon CATEGORY mean something: before it, every
   * weapon differed only in damage and cadence, so "axe" and "sword" were two
   * names for the same object.
   */
  /**
   * The equipped weapon's attack variants, or null for bare hands (which fall
   * back to `PLAYER.attacks` — same split as `weaponMelee`/`PLAYER.melee`).
   *
   * ⚠ Deliberately NOT scaled by quality, for exactly the reason `weaponMelee`
   * isn't: an Arcymistrzowski miecz still cuts and thrusts, it just does both
   * better. Workmanship changes how well a thing is made, never what it is.
   */
  get weaponAttacks(): readonly AttackVariant[] | null {
    if (!this.weapon) return null;
    const def = getItem(this.weapon.itemId);
    if (def.type !== "weapon") return null;
    if ("attacks" in def && def.attacks.length > 0) return def.attacks;
    // A weapon without `attacks` is a data bug, not a supported case — every
    // weapon in ITEMS has one. Warn once and keep swinging rather than crash:
    // silently falling through to PLAYER.attacks would give a sword the
    // fists' blunt damage type, which is worse than a wrong-but-loud default.
    if (!warnedMissingAttacks.has(this.weapon.itemId)) {
      warnedMissingAttacks.add(this.weapon.itemId);
      console.warn(`[Equipment] "${this.weapon.itemId}" nie ma pola \`attacks\` — używam wariantu zastępczego.`);
    }
    return FALLBACK_ATTACKS;
  }

  /**
   * Pick which variant the NEXT swing uses. Clamped, so a stale index from a
   * UI built for a different weapon can never point past the array.
   *
   * A swing already in flight is unaffected — the variant is frozen into
   * `pendingSwing` at swing start (C-01, extended by one field).
   */
  setActiveAttack(index: number): void {
    const count = Progression.attackVariants.length;
    const next = Math.min(Math.max(Math.round(index), 0), Math.max(0, count - 1));
    if (next === this.activeAttack) return;
    this.activeAttack = next;
    GameEvents.emit(EVENT.attackVariantChanged, { index: next });
  }

  /**
   * Jak dobrze blokuje to, co gracz trzyma w drugiej ręce — z redukcją JUŻ
   * przeskalowaną jakością wykonania. Null, gdy druga ręka jest pusta albo
   * trzyma coś, co nie blokuje.
   *
   * ⚠ **Jakość rusza redukcję, nigdy kąt** — to jest dokładnie ta sama reguła,
   * którą `weaponMelee` stosuje po stronie broni („jakość zmienia, jak dobrze
   * rzecz jest zrobiona, nigdy — czym ona jest"). Analogia jest ścisła:
   *
   *     obrażenia : łuk broni  ::  redukcja bloku : kąt tarczy
   *
   * ⚠ Świadomie użyta jest ISTNIEJĄCA tabela `QUALITY.modifiers.defense`, a nie
   * nowa — to jest pojęciowo ta sama rzecz. Ale jedna asymetria jest realna i
   * warto o niej wiedzieć: blok mnoży się POZA krzywą malejących przyrostów,
   * więc +20% jakości daje pełne +20% skuteczności bloku, podczas gdy +20%
   * punktów pancerza daje realnie znacznie mniej. **Procent jakości na tarczy
   * jest wart więcej niż procent jakości na zbroi** (§8G) — świadomie
   * zaakceptowane, do przeliczenia razem z cenami po playteście.
   */
  get blockSpec(): BlockSpec | null {
    if (!this.offhand) return null;
    const def = getItem(this.offhand.itemId);
    if (!("block" in def)) return null;
    // ⚠⚠ **`conditionMul` wchodzi tu w `T-5` (2026-09-15) i to jest ZAMKNIĘCIE
    // DZIURY, nie nowa mechanika.** Do tej daty zniszczona tarcza traciła punkty
    // obrony (`instanceDefense` mnoży przez `conditionMul` od zawsze), ale
    // **blokowała w pełni** — czyli jedyna rzecz, po którą się ją nosi, była
    // odporna na zużycie. Dziura była zapisana w checkpointcie i czekała
    // dokładnie na dzień, w którym tarcze dostaną pole `durability`.
    //
    // ⚠ **Ta sama funkcja, co przy obrażeniach i punktach obrony** — nie druga
    // tabela i nie własny mnożnik tarczy. Stan przedmiotu ma jedno miejsce.
    // ⚠ Kolejność mnożenia jest obojętna; zapisane jako `jakość → stan`, bo
    // tak czyta się zdanie „dobrze wykonana rzecz, ale rozbita".
    const scaled =
      def.block.reduction * (1 + qualityMul("defense", qualityOf(this.offhand))) * conditionMul(this.offhand);
    return {
      reduction: Math.max(0, scaled),
      swingMul: def.block.swingMul,
      staminaCost: "staminaCost" in def.block ? def.block.staminaCost : STAMINA.costs.blockFallback,
      // ⚠ Rozstrzygane RAZ, tutaj — resolver nie ma prawa pytać katalogu o geometrię,
      //   bo musi dać się odtworzyć w teście i w replayu bez stanu gry.
      geometry: shieldGeometryFor(itemConstruction(this.offhand.itemId)),
    };
  }

  /**
   * Kara tempa z drugiej ręki, jako mnożnik (1 = brak).
   *
   * ⚠ **Musi trafić i w `attackCooldown`, i w `swingDurationMs`** — nigdy w
   * jedno bez drugiego, bo poza ataku zacznie się rwać (to samo ostrzeżenie
   * stoi przy `maxAttackSpeedBonus` i przy `AttackVariant.swingMul`). Dwie
   * rzeczy jadą wtedy za tym za darmo, bo są z `swingDurationMs` wyprowadzone:
   * ukorzenienie (`Player.rootedUntil`) i moment trafienia
   * (`PLAYER.swingHitFraction`). Tarcza spowalniająca zamach sama wydłuża
   * okno, w którym gracz stoi zakorzeniony — czyli sama sobie tworzy sytuację,
   * w której jest potrzebna. To sprzężenie jest zamierzone, nie uboczne.
   *
   * ⚠ **Nie jest skalowana jakością.** Cena to tożsamość kategorii, jak `melee`
   * broni — Mistrzowska tarcza okuta nadal jest ciężka.
   */
  /**
   * Ile z `offhandSwingMul` pochodzi **wyłącznie z Dual Wieldu** (1 = nic).
   *
   * ⚠ Istnieje po to, żeby dało się zapytać „ile trwałby ten zamach, gdyby nie
   * przyspieszenie z drugiej ręki" — a to jest potrzebne do wyceny WYSIŁKU
   * (`Progression.swingStaminaCost`). Bez tego szybszy cykl DW robił się
   * darmowy: koszt zamachu jest proporcjonalny do jego długości, więc skrócenie
   * zamachu o 15% skracało też rachunek i **stamina na sekundę zostawała bez
   * zmian** (zmierzone: DW miecz+sztylet 3,71/s wobec 3,96/s samego miecza —
   * czyli DW dostawał +24% ciosów TANIEJ niż jedna broń).
   *
   * ⚠ **Nie mieszać z `blockSpec.swingMul`.** Tarcza spowalnia zamach i ma
   * prawo czynić go droższym — to jej koszt. Dual Wield zamach PRZYSPIESZA
   * i nie ma prawa czynić go tańszym.
   */
  get dualWieldSwingMul(): number {
    return this.dualWielding ? DUAL_WIELD.swingMul : 1;
  }

  get offhandSwingMul(): number {
    // ⚠ **Trzy stany, jeden kanał**: tarcza spowalnia (`blockSpec.swingMul`),
    // broń w drugiej ręce zmienia tempo Dual Wieldu, pusta ręka nie robi nic.
    // Kanał jest ten sam, bo pytanie jest to samo — „co druga ręka robi
    // z tempem" — a dwa osobne mnożniki musiałyby i tak trafić w te same dwa
    // miejsca (`attackCooldown` ORAZ `swingDurationMs`).
    if (this.dualWielding) return DUAL_WIELD.swingMul;
    return this.blockSpec?.swingMul ?? 1;
  }

  /**
   * **Komplet liczb broni z drugiej ręki** — jeden odczyt zamiast pięciu
   * getterów bliźniaczych do tych, które ma ręka główna.
   *
   * ⚠ **Obrażenia idą przez `instanceDamage`, czyli TĘ SAMĄ ścieżkę co ręka
   * główna** — więc jakość wykonania skaluje off-handa dokładnie tak samo.
   * Osobne mnożenie tutaj byłoby drugim opisem tej samej reguły.
   *
   * ⚠ **Kształt (`melee`) NIE jest skalowany jakością** — ta sama reguła co
   * przy `weaponMelee`: zasięg i łuk należą do KATEGORII broni.
   */
  get offhandWeaponDef(): {
    damageMin: number;
    damageMax: number;
    scaling: { str: number; dex: number };
    swingDurationMs: number;
    /** Bazowa kadencja tej broni (s) — patrz `Progression.offhandAttackCooldown`. */
    attackCooldown: number;
    critMultiplierBonus?: number;
    /** Premia do SZANSY krytyka tej broni — patrz `Progression.offhandNumbers`. */
    critChanceBonus?: number;
    melee: MeleeShape | null;
  } | null {
    const w = this.offhandWeapon;
    if (!w) return null;
    const def = getItem(w.itemId);
    if (def.type !== "weapon") return null;
    const dmg = instanceDamage(w);
    if (!dmg) return null;
    // ⚠ `in`, nie `?.` — `melee` jest unią kształtów o RÓŻNYCH polach
    // (nie każda broń ma bonus krytyka). Ta sama technika co w `Progression`.
    const melee = "melee" in def ? def.melee : null;
    return {
      damageMin: dmg.min,
      damageMax: dmg.max,
      scaling: { str: def.strScale, dex: def.dexScale },
      swingDurationMs: def.swingDurationMs,
      attackCooldown: def.attackCooldown,
      // ⚠ `in`, nie `?.` — z tego samego powodu co wiersz niżej.
      critChanceBonus: melee && "critChanceBonus" in melee ? (melee.critChanceBonus as number) : undefined,
      critMultiplierBonus: melee && "critMultiplierBonus" in melee ? (melee.critMultiplierBonus as number) : undefined,
      melee,
    };
  }

  /**
   * Domyślny typ obrażeń broni z drugiej ręki.
   *
   * ⚠ **Pierwszy wariant z listy, nie „aktywny"** — off-hand nie ma własnego
   * wyboru wariantu (pasek wariantów należy do ręki głównej), więc bierze to,
   * czym ta broń jest domyślnie.
   */
  get offhandDamageType(): DamageType | null {
    const w = this.offhandWeapon;
    if (!w) return null;
    const def = getItem(w.itemId);
    if (def.type !== "weapon" || !("attacks" in def)) return null;
    return def.attacks[0]?.damageType ?? null;
  }

  /** Broń w drugiej ręce, albo `null` (tarcza i pusta ręka dają `null`). */
  get offhandWeapon(): ItemInstance | null {
    if (!this.offhand) return null;
    const def = getItem(this.offhand.itemId);
    return def.type === "weapon" ? this.offhand : null;
  }

  /**
   * **Czy gracz walczy dwiema broniami.**
   *
   * ⚠ Jedno pytanie, jedno miejsce — scena, `Progression` i UI nie mają prawa
   * pytać o to własnym warunkiem po typie przedmiotu. To ta sama reguła, przez
   * którą `weaponFamily` jest getterem, a nie odczytem `getItem` u wołającego.
   */
  get dualWielding(): boolean {
    return this.offhandWeapon !== null;
  }

  /** Rodzina broni z drugiej ręki — adres jej Władania. `null` bez broni. */
  get offhandWeaponFamily(): WeaponFamily | null {
    const w = this.offhandWeapon;
    if (!w) return null;
    const def = getItem(w.itemId);
    return def.type === "weapon" && "family" in def ? (def.family as WeaponFamily) : null;
  }

  get weaponMelee(): MeleeShape | null {
    if (!this.weapon) return null;
    const def = getItem(this.weapon.itemId);
    // ⚠ Deliberately NOT scaled by quality. Arc, reach, knockback and interrupt
    // belong to the CATEGORY — they are what makes an axe an axe — and a
    // Mistrzowski hammer has to still be a hammer. Workmanship changes how well
    // a thing is made, never what kind of thing it is.
    if (!(def.type === "weapon" && "melee" in def)) return null;
    // ⭐ **Martwa strefa rośnie przy chwycie jednoręcznym** (1.5H, oś `D-B`).
    // ⚠ Kształt wraca jako NOWY obiekt tylko wtedy, gdy naprawdę się zmienia —
    // inaczej oddajemy referencję do `ITEMS`, tak jak przed tą zmianą.
    // ⛔ `reach` zostaje NIETKNIĘTY i to jest cała idea 1.5H dla drzewcowych:
    //    włócznia z tarczą dalej sięga 98, po prostu przestaje radzić sobie
    //    w zwarciu. Obcinanie zasięgu było rozważone i odrzucone.
    const add = this.gripMinReachAdd();
    if (add === 0) return def.melee;
    const baza = "minReach" in def.melee ? def.melee.minReach : 0;
    return { ...def.melee, minReach: baza + add };
  }

  /**
   * Archetyp założonej broni, albo `null` (gołe ręce, broń bez rodziny).
   *
   * ⚠ **Tak samo jak `weaponMelee`: NIE skalowane jakością.** Podła siekiera
   * jest tak samo siekierą jak mistrzowska — jakość opisuje, jak dobrze rzecz
   * jest zrobiona, nigdy czym jest (niezmiennik N-3).
   */
  get weaponFamily(): WeaponFamily | null {
    return this.weapon ? itemFamily(this.weapon.itemId) : null;
  }

  /** Equipped weapon's swing feel (visual tween timing), or null for bare hands. */
  get weaponSwing(): { durationMs: number; thrustPx: number } | null {
    if (!this.weapon) return null;
    const def = getItem(this.weapon.itemId);
    return def.type === "weapon" ? { durationMs: def.swingDurationMs, thrustPx: def.swingThrustPx } : null;
  }

  /**
   * Every worn piece that is ARMOUR, derived from the item's own type.
   *
   * ⚠ This replaced the list `["head","chest","legs","boots"]`, which was
   * written out TWICE (here and in `defenseAgainst`). Two hand-kept copies of
   * "which slots protect you" is a trap with a specific, silent failure: add a
   * slot to one and not the other, and the character sheet reports a different
   * Obrona than the one combat actually applies. The shield is exactly the
   * addition that would have triggered it. Deriving from `def.type === "armor"`
   * means a future greave, cloak or bracer is protective the moment it says so
   * in `ITEMS`, and cannot be forgotten in one of two places.
   */
  private armorPieces(): { inst: ItemInstance; def: ReturnType<typeof getItem> }[] {
    const out: { inst: ItemInstance; def: ReturnType<typeof getItem> }[] = [];
    for (const slot of EQUIP_SLOTS) {
      const inst = this[slot];
      if (!inst) continue;
      const def = getItem(inst.itemId);
      if (def.type === "armor") out.push({ inst, def });
    }
    return out;
  }

  /** Sum of defense across armor pieces, plus any `bonus.defense` from gear
   *  that isn't armour (a warding ring). */
  get totalDefense(): number {
    const fromArmor = this.armorPieces().reduce((sum, p) => sum + instanceDefense(p.inst), 0);
    return fromArmor + this.sumBonus("defense");
  }

  /**
   * Defence points against a specific damage type — each worn piece counted
   * through its OWN `armorType` profile, then summed.
   *
   * Per piece rather than per set, and that falls out of the slots being
   * independent: a steel breastplate over leather everything-else is a legal
   * loadout today, and it should read as mostly-metal without anyone writing a
   * rule for mixed sets.
   *
   * ⚠ No `damageType` means "no type involved" and returns the plain total —
   * which is exactly what `defenseReduction` has always computed. Enemies do
   * not deal typed damage yet, so this changes nothing today; it is the hook
   * that lets Enemy → Player use the same model later without a second system.
   */
  defenseAgainst(damageType?: DamageType): number {
    const fromArmor = this.armorPieces().reduce((sum, { inst, def }) => {
      // Quality scales the POINTS (instanceDefense), the profile scales the
      // same points — so workmanship and material compose without either
      // needing to know about the other.
      const pts = instanceDefense(inst);
      return sum + ("armorType" in def ? armorPointsAgainst(pts, def.armorType, damageType) : pts);
    }, 0);
    // A warding ring protects against everything equally — it is not made of
    // anything, so it has no profile to apply.
    return fromArmor + this.sumBonus("defense");
  }

  /**
   * Fraction (0..maxDefenseReduction) of incoming damage that armor blocks.
   * Diminishing returns: `defense / (defense + K)` — the one curve, shared with
   * enemy armour through `core/Protection`.
   */
  reductionAgainst(damageType?: DamageType): number {
    return reductionFromPoints(this.defenseAgainst(damageType));
  }

  /** Untyped reduction — what the character sheet shows and what an untyped
   *  hit uses. Unchanged in value and in meaning. */
  get defenseReduction(): number {
    return this.reductionAgainst();
  }

  reset(): void {
    for (const slot of EQUIP_SLOTS) this[slot] = null;
    // Bags too, else the doll shows a phantom worn bag while `Inventory.
    // reset()` (which runs BEFORE this — see TitleScene) has already dropped
    // capacity back to the base 16 out from under it.
    for (const slot of BAG_SLOTS) this[slot] = null;
    // ...i zestaw schowany, z tego samego powodu: nowa gra z toporem wiszacym
    // w drugim zestawie to najbardziej zdradliwy mozliwy stan startowy.
    for (const slot of STOW_SLOTS) this[slot] = null;
    this.emitChanged();
    this.emitBagsChanged();
  }

  emitChanged(): void {
    // Swapping the WEAPON resets the stance: a dagger's "Pchnięcie" must not
    // silently become a sword's index 1 (its own Pchnięcie) or, worse, point
    // past a one-variant weapon's array. Keyed to the item id, not the
    // instance, so repairing or breaking the sword you are holding leaves the
    // chosen variant alone — this runs on every equipment change, including
    // rings and a weapon breaking mid-fight.
    // Uniewaznienie bufora premii zestawow — TU, bo przez te metode przechodzi
    // kazda zmiana zalozonego sprzetu, lacznie z ta pisana wprost przez
    // `Save.load()`.
    this.setBonusCache = null;
    const weaponId = this.weapon?.itemId ?? null;
    if (weaponId !== this.lastWeaponId) {
      this.lastWeaponId = weaponId;
      this.activeAttack = 0;
    }
    GameEvents.emit(
      EVENT.equipmentChanged,
      Object.fromEntries(EQUIP_SLOTS.map((s) => [s, this[s]])) as EquipmentSnapshot,
    );
  }
}

export const Equipment = new EquipmentState();

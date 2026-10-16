import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";
import { GameEvents, EVENT } from "../core/EventBus";
import { Progression, type Attribute } from "../core/Progression";
import { KeyFocus } from "./KeyFocus";
import { Settings, AIM_MODE_TEXT } from "../core/Settings";
import {
  Equipment,
  describeBagUnequipRefusal,
  describeHandsRefusal,
  describeRequirement,
  describeSwapRefusal,
  BAG_SLOTS,
  EQUIP_SLOTS,
  EQUIP_SLOT_LABEL,
  type BagSlot,
  type BagSnapshot,
  type EquipmentSnapshot,
  type GearSlot,
} from "../core/Equipment";
import { ARMOR_LAYERS, ARMOR_LAYER_SHORT, type ArmorLayer } from "../core/ArmorLayers";
import { computeInventoryLayout, INV, slotHasItems, type DollRect, type Rect as InvRect } from "./EquipLayout";
import { DOLL_CELLS, handSlot, type DollCell } from "./PaperDoll";
import {
  durabilityOf,
  hasDurability,
  maxDurabilityOfInstance,
  qualityColor,
  qualityOf,
  sellPriceOf,
  type ItemInstance,
} from "../core/Quality";
import { Inventory, type InventorySlot } from "../core/Inventory";
import { getItem, itemIconKey, type ItemId, itemFootprint } from "../core/Items";
import { iconFitScale } from "./IconFit";
import { Quests, getQuest, type QuestId } from "../core/Quests";
import { TrackedQuest } from "../core/TrackedQuest";
import { Sfx } from "../core/Sfx";
import {
  ABILITY_SLOTS,
  ASSETS,
  ATTRIBUTES,
  INVENTORY,
  MAP_ATLAS,
  MAP_BY_ID,
  PLAYER,
  SKILLS,
  STAMINA,
  WEAPON_FAMILY,
} from "../config/GameConfig";
import { WEAPON_FAMILIES } from "../core/WeaponProficiency";
import type { WeaponFamily } from "../core/Equipment";
import { layeredSlot } from "../core/Equipment";
import { Abilities, getAbility, abilityIconKey, type AbilityId } from "../core/Abilities";
import { Stamina } from "../core/Stamina";
import { Vitals } from "../core/Vitals";
import { WorldState } from "../core/WorldState";
import { UI, TYPE, fontPx, textStyle, uiW, uiH, uiScale } from "../core/theme";
import { floatingText } from "../core/Fx";
import { ListDetail } from "./ListDetail";
import { computeListDetailLayout } from "./ListDetailLayout";
import { familyRow, familySections } from "./WeaponFamilyCard";
import { questSections, questState } from "./QuestCard";
import { PanelBase } from "./PanelBase";
import { Minimap } from "./Minimap";
import { fogTexture, regionSizePx } from "./MapFog";
import { mapQuestIcon, mapQuestMark } from "./MapQuestMarks";
import { PARCHMENT, parchmentSheet } from "./MapParchment";
import { Exploration } from "../core/Exploration";
import { Skills, getSkill, type SkillId } from "../core/Skills";
import { NPCS } from "../core/Npcs";
import { MenuButton } from "./MenuButton";
import { Rail, type RailTab } from "./Rail";
import { ShopDetails, type ShopAction, type ShopEmptySummary } from "./ShopDetails";
import { buildItemCard } from "./ItemCard";
import { drawUiIcon } from "./UiIcons";
import { CategoryStrip, STRIP_H } from "./CategoryStrip";
import { categoryOfSlot, matchesCategory } from "./ItemCategory";
import { packShelf, type ShelfPlace } from "./ShopLayout";
import { abilityCardLines, abilityCostLine } from "./AbilityCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { playerPanelSize, serviceArea } from "./FrameLayout";
import { Save, ALL_SLOTS, SLOT_LABEL, describeSlot, type SlotId } from "../core/Save";

type TabId = "character" | "inventory" | "quests" | "map" | "save";

/** Podstrony strony POSTAĆ. `weapons` doszło z warstwą 2 (biegłość broni). */
type CharSubTab = "traits" | "skills" | "weapons";

/** Akcja karty przedmiotu w plecaku — tłumaczona na `ShopAction` kolumny karty
 *  (`showItemCard`; pierwsza = główna). Mieszkała w `CardActions.ts` razem
 *  z rzędem przycisków pod dymkiem, usuniętym w etapie F. */
interface CardAction {
  label: string;
  onClick: () => void;
  /** Ramka przycisku — do odróżnienia akcji niszczącej od zwykłej. */
  color?: number;
  /** Wyszarzony i nieklikalny, ale WIDOCZNY: „tego teraz nie da się zrobić". */
  disabled?: boolean;
}

/** Slot border colours at rest. A filled slot overrides these with the item's
 *  workmanship colour, which is how quality is read at a glance. */
/**
 * Liczba dziesiętna po polsku: `1.46` → „1,46", `34` → „34,0" przy `miejsc = 1`.
 *
 * ⚠ **Jedno miejsce, bo `.replace(".", ",")` było już rozsiane po czterech**
 * (podpisy atrybutów, obciążenie, karta umiejętności, karta przedmiotu) i za
 * każdym razem z inną liczbą miejsc. Panel POSTAĆ pokazywał przy tym `1.46`
 * i `1,50` w dwóch sąsiednich wierszach.
 */
function dec(v: number, miejsc: number): string {
  return v.toFixed(miejsc).replace(".", ",");
}

/** Klatka strzałki zamiany w `ASSETS.slotGlyphs` — ostatnia w `ORDER`
 *  generatora (`tools/build_slot_glyphs.py`). */
const SWAP_GLYPH = 12;

const EQUIP_FRAME = 0x5a4a2f;
const BAG_FRAME = 0x3a4058;

/**
 * Jeden kafel lalki, złożony z warstw. Kolejność pól jest kolejnością
 * rysowania: ramka → glif slotu → ikona przedmiotu → pasek warstw → zasłona.
 *
 * ⚠ **Glif i ikona to DWIE różne rzeczy i nigdy nie widać ich razem.** Glif
 * (wygrawerowany hełm, pierścień, pas) mówi, CO tu wchodzi, gdy slot jest
 * pusty; ikona mówi, co tu leży. Do 2026-09-11 glif był wypalony w tle lalki,
 * więc ikona przedmiotu rysowała się NA NIM — i przy ciemnej ikonie nie było
 * wiadomo, czy slot jest zajęty.
 */
interface EquipCellWidget {
  readonly cell: DollCell;
  /**
   * Adres, który kafel POKAZUJE w tej chwili — tylko dla kafli `gear`.
   * ⚠ Zmienny od etapu D: ręka zależy od pokazywanego zestawu (E2), obszar
   * warstwowy od przełącznika warstw (E1). Liczy go `addressOf`; tu trzymany
   * jest wynik ostatniego przemalunku (cel upuszczenia, podświetlenie).
   */
  slot?: GearSlot;
  /** Ramka kafla; przemalowywana na jakość wykonania i na podświetlenie celu. */
  readonly box: Phaser.GameObjects.Rectangle;
  /** Wygrawerowany glif slotu — widoczny WYŁĄCZNIE, gdy slot jest pusty. */
  readonly glyph: Phaser.GameObjects.Image;
  /** Ikona przedmiotu — widoczna wyłącznie, gdy slot jest zajęty. */
  readonly icon: Phaser.GameObjects.Image;
  /** Wysokość kafla. Kafle rąk są wyższe (dwa pola), bo trzymają przedmioty
   *  o gabarycie 1×2 — patrz `rows` w `PaperDoll.ts`. */
  readonly cellH: number;
  /**
   * Pasek warstw — jedna kropka na warstwę (dziś TRZY: L1/L2/L3), przy dolnej
   * krawędzi, wyłącznie na czterech slotach warstwowych. Dziś zapala jedną
   * (warstwę noszonej sztuki); jutro będzie ich tyle, ile warstw naprawdę leży
   * w slocie. ⚠ Liczba kropek jest WYPROWADZONA z `ARMOR_LAYERS.length`, nie
   * wpisana — taksonomia zeszła 2026-09-12 z czterech warstw na trzy i ten
   * widżet nie wymagał ani jednej zmiany. Patrz `core/ArmorLayers.ts`.
   */
  readonly pips?: Phaser.GameObjects.Rectangle[];
  /**
   * Zasłona włączana, gdy slot jest chwilowo niedostępny — dziś wyłącznie
   * druga ręka przy broni dwuręcznej.
   *
   * ⚠ Osobna rzecz niż kafel `planned`. Tamto znaczy „takich przedmiotów
   * jeszcze nie ma w grze" i jest stałe; to znaczy „nie teraz, bo trzymasz coś
   * innego" i zmienia się w trakcie gry. Zlanie ich w jedno kazałoby graczowi
   * czytać ten sam wygląd jako dwie różne informacje.
   */
  veil?: Phaser.GameObjects.Rectangle;
}

/**
 * What a doll cell can be aimed at while dragging. `EquipSlot` is real gear;
 * `"quick"` is the quick-action cell, which is NOT an equip slot — it binds
 * `Inventory.quickSlot` (the `Q` button on the HUD) and holds nothing.
 */
type DollTarget = GearSlot | "quick";

/**
 * ⚠ **`DOLL_LAYOUT` i `DollCellDef` stały tu do 2026-09-11 i ZOSTAŁY USUNIĘTE.**
 * Były tablicą 3×4 sprzężoną z kratą 3×4 wypaloną w `assets/ui/slots.png`, więc
 * układ lalki był własnością obrazka: dwanaście kafli, bok 32 px, stała
 * kolejność. Układ jest dziś DANYMI w `DOLL_CELLS` (`src/ui/PaperDoll.ts`,
 * od etapu D wspólna sylwetka panelu i sklepu), a geometrię liczy
 * `computeInventoryLayout` z rozmiaru panelu.
 *
 * ⛔ Nie odtwarzaj tu drugiej listy slotów „dla wygody" — to dokładnie ta
 * choroba, którą ten katalog zna z dwóch stron: rząd slotów liczony ze stałych
 * przerósł panel po cichu (dziesiąty pierścień poza ramką), a tabela nazw
 * slotów przestała nadążać za `EquipSlot` („Slot: undefined").
 */

/* ── ROZMIAR PANELU ───────────────────────────────────────────────────────
 *
 * ⚠ **Panel był do 2026-09-11 STAŁY — 816×530 jednostek — i to była jego
 * największa wada, widoczna na obu platformach naraz.** Wirtualna wysokość na
 * telefonie to zawsze 580 j., a szerokość ≈1257 przy 19,5:9 (patrz `UI_SCALE`),
 * więc panel zajmował **65% szerokości i 91% wysokości** — pas pustki po obu
 * bokach na ekranie, na którym ekwipunek ma być widokiem pełnoekranowym.
 * Na monitorze 1920×1080 bez HiDPI skala wynosi 1, czyli przestrzeń wirtualna
 * = 1920×1080, a ten sam panel zajmował **42% szerokości i 49% wysokości** —
 * stąd zgłoszenie „na PC obecny widok jest zdecydowanie za mały".
 *
 * ⚠ **Rozmiar liczy się RAZ, w konstruktorze, a nie przy każdym RESIZE.**
 * Przebudowa pięciu zakładek przy każdym przeciągnięciu ramki okna byłaby
 * kosztowna i ryzykowna (panele trzymają zaznaczenia, maski i sesje
 * przeciągania). `PanelBase.reposition` dalej RECENTRUJE panel na zmianę
 * rozmiaru, więc okno zmienione po otwarciu gry nie zostawia panelu w rogu —
 * zmienia się tylko to, że nie rośnie. Na telefonie nie ma to znaczenia
 * (orientacja jest zablokowana w manifeście).
 *
 * ⚠ **Podłoga 816×530 to DOKŁADNIE stary rozmiar** i to jest celowe: żaden
 * ekran nie dostaje panelu mniejszego niż ten, pod który wymierzono cztery
 * pozostałe zakładki.
 *
 * ⚠ **Liczby (`PLAYER_PANEL`) i rachunek (`playerPanelSize`) mieszkają od
 * 2026-10-13 w `src/ui/FrameLayout.ts`** — bez zmiany wartości; przymiar
 * mieszczenia się paneli (`tools/panel_fit.mjs`, `OI-68`) musi je znać bez
 * sceny.
 */
// ⭐ Etap D (2026-10-13): panel stoi w RAMIE — w obszarze na lewo od szyny
//   nawigacji (`FrameLayout.serviceArea`), jak usługi w rozmowie. Rozmiar liczy
//   się z tego obszaru, nie z całego okna.
function panelArea(scene: Phaser.Scene): { w: number; h: number } {
  const a = serviceArea(uiW(scene), uiH(scene));
  return playerPanelSize(a.w, a.h);
}

function panelWidth(scene: Phaser.Scene): number {
  return panelArea(scene).w;
}

function panelHeight(scene: Phaser.Scene): number {
  return panelArea(scene).h;
}

/**
 * Combined character sheet + backpack, as tabs on one frame — they're the
 * same size/style and both pause the game, so there was never a reason to
 * have them open side by side. C opens straight to "Postać", B to "Plecak";
 * pressing the other key while open switches tabs instead of closing, and
 * pressing the key for the tab you're already on closes the panel.
 *
 * Talks to gameplay only through GameEvents / Progression / Inventory /
 * Equipment, never by reaching into the Player — using a potion or equipping
 * gear fires an event and GameScene/Equipment apply the effect.
 */
/** Prefiks id wiersza umiejętności BIERNEJ na liście Umiejętności. */
const PASSIVE_ROW = "passive:";

export class PlayerPanel extends PanelBase {
  private menuButton: MenuButton;
  /**
   * Zakładka, na której otwiera się panel z PRZYCISKU MENU — ostatnia
   * odwiedzona inna niż MAPA (mapę otwiera minimapa). Domyślnie PLECAK:
   * najczęstszy powód wejścia do panelu w walce i po niej.
   */
  private menuTab: TabId = "inventory";
  /**
   * ⭐ **Nawigacja panelu = SZYNA przy prawej krawędzi** (etap D, 2026-10-13;
   * D13). Do tej daty poziomy `TabBar` u góry zabierał pas 56 j. KAŻDEJ
   * stronie — w poziomie brakuje wysokości, nie szerokości (research R2).
   */
  private rail!: Rail<TabId>;
  /** Kropka „masz punkty do wydania" na zakładce Postać — stan ostatnio narysowany. */
  private railPointsBadge = false;
  private characterPage: Phaser.GameObjects.Container;
  /**
   * Strona POSTAĆ dzieli się na dwie podstrony.
   *
   * ⚠ **Podzakładki, a nie szósta zakładka główna** — i to nie jest kwestia
   * gustu. Pasek główny dzieli stałą szerokość, więc przy pięciu zakładkach
   * font musiał już zejść do 11 px („ZADANIA" to 55 px monospace w polu 58 px);
   * szósta by go rozsadziła.
   *
   * ⚠ **NIE naprawia to jednak dostępności na telefonie, i pierwsza wersja
   * tego komentarza twierdziła, że naprawia — nieprawda, zmierzone.** Strona
   * zaczyna się na `contentTop` = −225, więc pasek podzakładek stoi na
   * absolutnym **y = −207**, a widoczny obszar przy 812×375 zaczyna się na
   * **−187,5**: brakuje **19,5 px**. Podzakładki dziedziczą więc dokładnie ten
   * sam zaparkowany defekt, co pasek główny (`docs/odlozone.md`, „Zoom i HUD
   * pod telefon") — na desktopie działają, na telefonie nie da się ich dotknąć.
   *
   * Przesunięcie ich w dół o te 33 px jest możliwe, ale zjada margines nad
   * pierwszym wierszem cech (`Poziom` na −178, zostałyby 3 px prześwitu), więc
   * należy do przebudowy wysokości całego panelu, a nie do tej zmiany.
   */
  private traitsPage!: Phaser.GameObjects.Container;
  private skillsPage!: Phaser.GameObjects.Container;
  /**
   * Podstrona BROŃ — biegłość (Proficiency) i ranga Mastery per rodzina.
   * `docs/systemy/proficiency.md`§16.
   *
   * ⚠ **Czyta `WeaponProficiency`, czyli DOKŁADNIE ten sam magazyn, z którego
   * `GameScene.currentStrike()` zamraża `P` do rozstrzygnięcia ciosu.** Panel
   * pokazujący własną kopię tej liczby rozjechałby się z walką przy pierwszej
   * zmianie i nikt by tego nie zobaczył.
   */
  private weaponsPage!: Phaser.GameObjects.Container;
  /** ⭐ Etap F (2026-10-13): lista rodzin + karta — ten sam widok i te same
   *  sekcje co Mistrzostwo u trenera (`WeaponFamilyCard`), ⛔ bez zakupu (D5). */
  private weaponsView!: ListDetail;
  /** ⚠ Trzymane jako `WeaponFamily`, nie indeks — ta sama reguła co przy
   *  `TrainerPanel.selected`: stan wpisu się zmienia, a przy indeksie karta
   *  podmieniłaby się pod ręką po przebudowie spisu. */
  private selectedFamily: WeaponFamily | null = null;
  private charSubTab: CharSubTab = "traits";
  private subTabWidgets: {
    id: CharSubTab;
    box: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
  }[] = [];
  /** ⭐ Etap F (2026-10-13): Umiejętności = lista posiadanych + karta,
   *  przypisanie na pasek rzędem kafli slotów w pasie akcji karty. */
  private skillsView!: ListDetail;
  /** ⚠ `AbilityId`, nie indeks — nauka przebudowuje listę. */
  private selectedAbility: AbilityId | null = null;
  /** ⭐ Wybrana umiejętność BIERNA (2026-10-14) — gdy ustawiona, karta mówi
   *  o niej zamiast o czynnej. ⚠ `SkillId`, nie indeks (nauka przestawia listę). */
  private selectedPassive: SkillId | null = null;
  private inventoryPage: Phaser.GameObjects.Container;
  private questsPage: Phaser.GameObjects.Container;
  private mapPage: Phaser.GameObjects.Container;
  private savePage: Phaser.GameObjects.Container;
  private saveList!: Phaser.GameObjects.Container;
  private confirm: ConfirmDialog;
  /** ⭐ Etap F (2026-10-13): dziennik = lista zadań + karta (`ListDetail`). */
  private questsView!: ListDetail;
  /** ⚠ `QuestId`, nie indeks — oddanie zadania przestawia listę. */
  private selectedQuest: QuestId | null = null;
  /** ⭐ Podzakładka dziennika (autor 2026-10-14): aktywne albo ukończone. */
  private journalTab: "active" | "done" = "active";
  private journalTabWidgets: { id: "active" | "done"; box: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }[] = [];
  private mapTitle!: Phaser.GameObjects.Text;
  /** Widok strony MAPA — zostaje między otwarciami panelu (w pamięci sceny). */
  private mapView: "region" | "world" = "region";
  private mapToggle!: Phaser.GameObjects.Container;
  private mapSegments: { id: "region" | "world"; box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }[] = [];
  private mapSheet!: Phaser.GameObjects.Graphics;
  /** Okno rysunku na kartce, we współrzędnych strony. */
  private mapArea = { x: 0, y: 0, w: 0, h: 0 };
  private mapContent!: Phaser.GameObjects.Container;
  /**
   * Gdzie stoją mieszkańcy w ATLASIE świata (px), zapamiętane z ostatniej
   * sceny, która ich miała. ⚠ Potrzebne, bo w Gęstwinie (osobna mapa)
   * `WorldState.npcs` jest pusty, a widok „Świat” ma dalej pokazać, że zadanie
   * oddaje się w Zagajach. Mieszkańcy stoją w miejscu, więc pamięć nie kłamie.
   */
  private atlasNpcs = new Map<string, { ax: number; ay: number; name: string }>();
  private mapLegend!: Phaser.GameObjects.Container;
  private mapMarker!: Phaser.GameObjects.Arc;
  private mapUnavailableText!: Phaser.GameObjects.Text;
  /** One dot + name label per NPC on the current map — rebuilt on every
   *  refreshMap() call, same "cheap enough to redo on open" reasoning as the
   *  player's own mapMarker. Deliberately plain dots, not the overhead
   *  "!"/"?"/sack markers (`Merchant.ts`) — those answer "what does this NPC
   *  want right now", this answers "where is this NPC on the whole map",
   *  and a tiny minimap has no room to also carry live quest state legibly. */
  private npcMarkers!: Phaser.GameObjects.Container;

  private rows = new Map<string, Phaser.GameObjects.Text>();
  /** Podpisy pod nazwami atrybutów. Osobno od `rows`, bo `rows` trzyma KOLUMNĘ
   *  WARTOŚCI, a te są opisem efektu — i od 2026-08-20 zależą od broni. */
  private attrEffects = new Map<Attribute, Phaser.GameObjects.Text>();
  private plusButtons: Phaser.GameObjects.Container[] = [];
  private slotIcons: Phaser.GameObjects.Image[] = [];
  private slotCounts: Phaser.GameObjects.Text[] = [];
  /** Kept so a cell's border can be recoloured to its contents' workmanship:
   *  the frames were previously fire-and-forget drop zones. */
  /**
   * Zaznaczony kafel plecaka, albo `null`.
   *
   * ⚠ **Model zaznaczenia istnieje dla DOTYKU, nie dla wygody.** Karta
   * przedmiotu jechała wcześniej wyłącznie na najechaniu, którego palec nie ma:
   * `POINTER_OVER`/`OUT` to na dotyku „dotknąłem"/„puściłem", więc karta żyła
   * tylko pod trzymanym palcem i była nim zasłonięta. Tapnięcie **przypina** ją
   * teraz w stałym miejscu i zostaje tam, gdy palec już nie.
   *
   * Gramatyka jest celowo TA SAMA, co w walce — tapnięcie wybiera, ponowne
   * tapnięcie odznacza, akcja jest osobna. Gracz zna ją z targetowania, więc to
   * nie jest nowy idiom do nauczenia, tylko ten sam przeniesiony do panelu.
   *
   * Najechanie myszą **nadal działa**: pokazuje kartę, dopóki nic nie jest
   * zaznaczone (patrz `POINTER_OUT` przy kaflach). Zaznaczenie ma pierwszeństwo.
   */
  private selectedBagIndex: number | null = null;
  /**
   * Zaznaczony slot na lalce, albo `null`. **Wzajemnie wykluczające się z
   * `selectedBagIndex`** — karta jest jedna, więc zaznaczenie też musi być.
   *
   * ⚠ **Powstało, bo dotknięcie założonego przedmiotu ZDEJMOWAŁO go**, i to na
   * `POINTER_DOWN`, czyli zanim gracz zdążył podnieść palec. Na dotyku jedyny
   * gest, jakim dawało się sięgnąć własnego ekwipunku, jednocześnie go ściągał
   * — obejrzeć założonego miecza nie dało się w ogóle. Teraz tapnięcie
   * pokazuje kartę, a zdejmuje osobny przycisk.
   */
  private selectedDollSlot: GearSlot | null = null;
  /** Przycisk akcji doklejany pod kartą. Żyje w przestrzeni EKRANU obok karty,
   *  nie w kontenerze panelu — inaczej rozjechałby się z nią przy klamrowaniu. */
  private slotBoxes: Phaser.GameObjects.Rectangle[] = [];
  /** Thin wear bar along the bottom of each cell, hidden unless the item in it
   *  tracks durability. */
  private slotWear: Phaser.GameObjects.Rectangle[] = [];
  private equipCells: EquipCellWidget[] = [];
  /**
   * ⭐ **Filtr plecaka = zakładki kategorii + WIDOK filtrowany** (`OI-130`,
   * decyzja autora 2026-10-11 — zastąpił przygaszanie). `bagView` mapuje
   * KOTWICĘ na miejsce w widoku; `null` = „Wszystko", czyli prawdziwy układ.
   */
  private bagStrip?: CategoryStrip;
  private bagView: Map<number, ShelfPlace> | null = null;
  private bagViewRows = 1;
  /** Kontener lalki. Stoi w środku kolumny wyposażenia, więc kafle liczą się
   *  względem zera — patrz `buildEquipColumn`. */
  private equipRoot!: Phaser.GameObjects.Container;
  /**
   * ⭐ **Karta przedmiotu = STAŁA KOLUMNA** (etap D, research R5) — ten sam
   * komponent, co w sklepie (`ShopDetails`): podgląd, nazwa, przewijane ciało,
   * porównanie i akcje przyklejone do dołu. Do tej daty karta była dymkiem
   * (`ItemTooltip`, usunięty w etapie F) z doklejanym rzędem przycisków. Pusty
   * stan kolumny = statystyki postaci i zestawy (dawne „W WALCE").
   */
  private card!: ShopDetails;
  /**
   * ⭐ **Przełącznik warstw CAŁEJ lalki** (E1). `null` = „to, co widać" —
   * najbardziej zewnętrzna zajęta warstwa w każdym obszarze; warstwa = każdy
   * z czterech obszarów pokazuje DOKŁADNIE tę warstwę (pusta → glif).
   */
  private layerView: ArmorLayer | null = null;
  /** ⭐ **Który zestaw pokazują ręce lalki** (E2): 1 = w rękach, 2 = schowany. */
  private setView: 1 | 2 = 1;
  /** Segmenty przełącznika warstw: `null` = „to, co widać". */
  private layerSegments: { layer: ArmorLayer | null; box: Phaser.GameObjects.Rectangle; label?: Phaser.GameObjects.Text; icon?: Phaser.GameObjects.Graphics }[] = [];
  /** Segmenty przełącznika zestawów — każdy z dwiema miniaturami swojej pary. */
  private setSegments: { set: 1 | 2; box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; minis: Phaser.GameObjects.Image[] }[] = [];
  private swapBox!: Phaser.GameObjects.Rectangle;
  private swapGlyph!: Phaser.GameObjects.Image;
  /** Trzy duże liczby pod lalką: wartość + podpis. */
  private numberTexts: { value: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text }[] = [];
  /** The doll's quick-action cell. Not an EquipSlotWidgets: it shows a
   *  BINDING (`Inventory.quickSlot`), not a worn copy, so it has no
   *  workmanship border and nothing to unequip. */
  private quickCell: {
    icon: Phaser.GameObjects.Image;
    box: Phaser.GameObjects.Rectangle;
    glyph: Phaser.GameObjects.Image;
  } | null =
    null;
  /** The four bag-row cells — same tap-to-select/"Zdejmij" pattern as the
   *  doll's `equipSlots`, kept separate because a bag slot is a `BagSlot`,
   *  not an `EquipSlot` (see `BAG_SLOTS`). */
  private bagEquipWidgets: {
    slot: BagSlot;
    icon: Phaser.GameObjects.Image;
    box: Phaser.GameObjects.Rectangle;
    glyph: Phaser.GameObjects.Graphics;
  }[] = [];
  /** Zaznaczony slot torby, albo `null`. Wzajemnie wykluczające się z
   *  `selectedBagIndex`/`selectedDollSlot` — jedna karta, jedno zaznaczenie. */
  private selectedBagEquipSlot: BagSlot | null = null;
  private capacityText!: Phaser.GameObjects.Text;

  private open = false;
  private activeTab: TabId = "character";
  private playerDead = false;


  /**
   * Wysokość strony = CAŁA wysokość panelu (etap D, 2026-10-13).
   *
   * ⚠ Do tej daty odejmowało się tu pasek zakładek u góry (`tabBarH` 40 → 56).
   * Nawigacja zeszła na szynę po prawej (D13), więc każda strona odzyskała
   * pas 56 j. — na telefonie to jeden rząd plecaka.
   *
   * ⚠ **Wyprowadzona, nie stała (2026-09-11).** Stało tu pięć razy `490`, czyli
   * jedna liczba przepisana pięć razy, prawdziwa dla jednego rozmiaru panelu.
   */
  private readonly pageH = this.h;
  private readonly characterPageH = this.pageH;
  private readonly inventoryPageH = this.pageH;
  private readonly questsPageH = this.pageH;
  private readonly mapPageH = this.pageH;
  private readonly savePageH = this.pageH;

  // ⚠ `cell` / `gap` / `cols` / `iconScale` stały tu jako stałe (64 / 8 / 4 / 2)
  // do 2026-09-11. Dziś są LICZONE razem z resztą układu — patrz pole `inv`
  // i `src/ui/EquipLayout.ts`. Reguła, którą tamte stałe niosły, została
  // i jest tam wymuszona jedną linią: lalka i siatka mają równy bok kafla.

  /* ── Scrollowana siatka plecaka (docs/inventory_scroll_ux.md) ──────────
   *
   * Okno widoku jest STAŁE — zawsze 4 rzędy (`columnH`, 280 j.), niezależnie
   * od pojemności. Wszystkie 48 kafli (`INVENTORY.maxSlots`) budowane są RAZ
   * w `buildGrid()`; poza kaflem widocznym decyduje wyłącznie widoczność
   * i `input.enabled` (patrz `syncSlotIO`), tak jak lalka i szybki slot są
   * budowane raz i tylko przemalowywane — nigdy nie przebudowuje się tego
   * co klatkę pobrania łupu.
   */
  private readonly gridMaxSlots = INVENTORY.maxSlots;
  /** Długie przytrzymanie zanim pełny kafel wejdzie w tryb przeciągania.
   *  Egzekwowane przez `scene.input.dragTimeThreshold` (ustawione raz w
   *  konstruktorze), NIE przez własny zegar — patrz nagłówek komentarza nad
   *  `beginGridGesture`. */
  private readonly LONG_PRESS_MS = 300;
  /** Ruch ponad to PRZED progiem czasu anuluje podniesienie i wchodzi
   *  w przewijanie — większe niż TAP_SLOP celowo (utrzymanie nieruchomo jest
   *  trudniejsze niż nieruszenie się w trakcie szybkiego tapnięcia). */
  private readonly HOLD_SLOP = 8;
  /** Ruch poniżej tego przy puszczeniu liczy się jako tapnięcie, nie gest. */
  private readonly TAP_SLOP = 4;

  private bagGridList!: Phaser.GameObjects.Container;
  private gridMaskG!: Phaser.GameObjects.Graphics;
  private gridScrollTrack!: Phaser.GameObjects.Rectangle;
  private gridScrollThumb!: Phaser.GameObjects.Rectangle;
  private gridScroll = 0;
  private gridGestureState: "idle" | "pending" | "scrolling" | "dragging" = "idle";
  private gridGestureIndex: number | null = null;
  private gridGesturePointerId = -1;
  private gridPressX = 0;
  private gridPressY = 0;
  /** Akumulowany ruch gestu SCROLLING — mirror `questDragDist`, decyduje czy
   *  puszczenie palca na pustym kaflu było tapnięciem czy przewinięciem. */
  private gridDragDist = 0;
  private gridAutoScrollTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    // ⚠ Rozmiar jest LICZONY z okna — patrz `PANEL` nad tą klasą. Stało tu
    // „816 = trzy kolumny obok siebie", czyli rozmiar wyprowadzony z treści
    // JEDNEJ zakładki przy JEDNYM rozmiarze kafla. Kierunek jest dziś odwrotny:
    // panel bierze tyle ekranu, ile go jest, a treść układa się w tym, co
    // dostała (`computeInventoryLayout`).
    //
    // ⚠ **Poszerzenie z 550 do 816 podniosło minimalną PROPORCJĘ okna
    // z ~0,95:1 na ~1,45:1.** Marginesy: 221 j. przy 20:9 (telefon docelowy),
    // 108 j. przy 16:9, a przy 4:3 panel już nie mieści się w oknie. Telefonu
    // to nie dotyczy — orientacja jest zablokowana w manifeście — ale okno
    // przeglądarki na desktopie może mieć dowolny kształt, więc pilnuje tego
    // asercja `PanelBase.warnIfClipped`.
    //
    // Poszerzenie nie rusza pozostałych zakładek: żadna nie ma zaszytej
    // szerokości, wszystkie liczą marginesy z `this.w`. Minimapa też nie —
    // o jej skalę decyduje wysokość (`mapPageH`), nie szerokość.
    super(scene, panelWidth(scene), panelHeight(scene), "frame");

    this.buildRail();

    const contentTop = -this.h / 2;
    this.characterPage = scene.add.container(0, contentTop + this.characterPageH / 2);
    this.inventoryPage = scene.add.container(0, contentTop + this.inventoryPageH / 2);
    this.questsPage = scene.add.container(0, contentTop + this.questsPageH / 2);
    this.mapPage = scene.add.container(0, contentTop + this.mapPageH / 2);
    this.savePage = scene.add.container(0, contentTop + this.savePageH / 2);
    this.container.add([
      this.characterPage,
      this.inventoryPage,
      this.questsPage,
      this.mapPage,
      this.savePage,
    ]);

    // Its own instance rather than the shop's: both panels are modals over the
    // same scene and each owns its own "are you sure?".
    this.confirm = new ConfirmDialog(scene);

    this.buildCharacterPage();
    this.buildInventoryPage();
    this.buildQuestsPage();
    this.buildMapPage();
    this.buildSavePage();

    // ⚠ Bez `addCloseButton` (dolne „Wróć do gry", 2026-08-21 … 2026-10-12):
    // wyjściem jest „Wróć do gry” na dole szyny (E5; do etapu D — ✕ w pasku
    // zakładek `TabBar`, usuniętym 2026-10-13), plus Android Back i ESC.
    // ⭐ Wejścia z HUD-u (2026-10-12): MINIMAPA otwiera MAPĘ — odruch z każdej
    // innej gry — a PRZYCISK MENU obok niej otwiera panel na ostatniej
    // zakładce innej niż mapa (`menuTab`). Od 2026-10-11 do tej daty jedynym
    // wejściem była minimapa, więc tapnięcie „w mapę" otwierało plecak.
    // ⚠ Żadne nie otwiera panelu NA rozmowie — ta sama bramka co przy skrótach
    // klawiszowych niżej (`OI-52`): zamknięcie panelu wznawiałoby świat, choć
    // rozmowa dalej stoi otwarta.
    const hudGate = () => KeyFocus.owner === null || KeyFocus.owner === "panel";
    new Minimap(scene, () => {
      if (hudGate()) this.openTo("map");
    });
    this.menuButton = new MenuButton(scene, () => {
      if (hudGate()) this.openTo(this.menuTab);
    });
    this.setTab("character");
    // `setTab` zapamiętuje zakładkę dla przycisku menu — pierwsze otwarcie
    // z HUD-u ma jednak trafić w PLECAK, nie w zakładkę ustawioną przy budowie.
    this.menuTab = "inventory";

    // ⚠ Skróty panelu NIE działają, gdy ekran należy do rozmowy (`OI-52`) —
    // otwierały panel NA niej, a jego zamknięcie wznawiało świat, choć rozmowa
    // dalej stała otwarta. Własne ognisko (`owner === "panel"`) przepuszcza,
    // bo ten sam klawisz przełącza i zamyka.
    const hotkey = (tab: TabId) => (e: KeyboardEvent) => {
      if (KeyFocus.consumed(e) || (KeyFocus.owner !== null && KeyFocus.owner !== "panel")) return;
      KeyFocus.consume(e);
      this.openTo(tab);
    };
    scene.input.keyboard?.on("keydown-C", hotkey("character"));
    scene.input.keyboard?.on("keydown-B", hotkey("inventory"));
    scene.input.keyboard?.on("keydown-L", hotkey("quests"));
    scene.input.keyboard?.on("keydown-M", hotkey("map"));
    scene.input.keyboard?.on("keydown-Z", hotkey("save"));
    scene.input.keyboard?.on("keydown-ESC", (e: KeyboardEvent) => {
      if (!this.open || KeyFocus.consumed(e)) return;
      KeyFocus.consume(e);
      this.close();
    });

    scene.input.on(Phaser.Input.Events.DRAG_START, this.onBagDragStart, this);
    scene.input.on(Phaser.Input.Events.DRAG, this.onBagDrag, this);
    scene.input.on(Phaser.Input.Events.DROP, this.onBagDrop, this);
    scene.input.on(Phaser.Input.Events.DRAG_END, this.onBagDragEnd, this);
    scene.input.on(Phaser.Input.Events.DRAG_ENTER, this.onBagDragEnter, this);
    scene.input.on(Phaser.Input.Events.DRAG_LEAVE, this.onBagDragLeave, this);
    // Scroll/tap/long-press-drag state machine for the backpack grid — SCENE
    // listeners, not per-object, because a gesture that starts on one cell
    // routinely ends over another (or over nothing at all mid-scroll). See
    // docs/inventory_scroll_ux.md §5 and the CLAUDE.md rule this mirrors
    // ("Gest przeciągnięcia czyta się z listenerów SCENY, nie z obiektu").
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onGridPointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onGridPointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onGridPointerUp, this);
    // ⚠ Ruch i puszczenie na poziomie SCENY, nie obiektu: palec ciągnący listę
    // umiejętności wyjeżdża poza wiersz, na którym wystartował, a
    // GAMEOBJECT_POINTER_MOVE przestaje wtedy lecieć. Bez UP_OUTSIDE
    // puszczenie poza płótnem zostawiłoby gest otwarty na zawsze.
    // ⚠ SCENE-WIDE: this is what actually enforces the backpack grid's long
    // press (see `beginGridGesture`'s header comment for why nothing else
    // can). Side effect, accepted deliberately: ShopPanel's drag-to-buy/sell
    // shares this same scene's input plugin, so it now needs the same
    // 300ms hold too — its click-to-buy and double-click-to-sell paths are
    // unaffected (`docs/inventory_scroll_ux.md` — bug notes, 2026-08-27).
    scene.input.dragTimeThreshold = this.LONG_PRESS_MS;

    GameEvents.on(EVENT.xpChanged, this.refreshCharacter, this);
    GameEvents.on(EVENT.attributesChanged, this.refreshCharacter, this);
    GameEvents.on(EVENT.playerHpChanged, this.refreshCharacter, this);
    GameEvents.on(EVENT.equipmentChanged, this.onEquipmentChanged, this);
    GameEvents.on(EVENT.inventoryChanged, this.onInventoryChanged, this);
    GameEvents.on(EVENT.bagsChanged, this.onBagsChanged, this);
    // Nauka u trenera zmienia LISTĘ, nie tylko pasek — bez tego panel
    // otwarty w trakcie rozmowy zostawałby z poprzednim zestawem wierszy.
    GameEvents.on(EVENT.abilitiesChanged, this.onAbilitiesChanged, this);
    GameEvents.on(EVENT.questsChanged, this.refreshQuests, this);
    GameEvents.on(EVENT.trackedQuestChanged, this.refreshQuests, this);
    // Tapnięcie trackera na HUD. Otwiera zakładkę zadań — bez celowania
    // w konkretną kartę: dziennik nie ma dziś pojęcia „zaznaczona karta"
    // (karty nie mają własnego wejścia, patrz `questCardBounds`), a dorabianie
    // go tylko po to byłoby przebudową panelu, nie podpięciem przycisku.
    // Śledzone zadanie jest i tak oznaczone „▸" w tytule.
    // Biegłość zmienia się dziś u Patryczka, czyli PRZY OTWARTYM panelu bywa
    // rzadko — ale zmienia ją też wczytanie zapisu, a wtedy panel musiałby
    // inaczej zostać z liczbami poprzedniej postaci.
    GameEvents.on(EVENT.weaponProficiencyChanged, this.onWeaponProficiencyChanged, this);
    GameEvents.on(EVENT.questJournalRequested, this.onJournalRequested, this);
    GameEvents.on(EVENT.playerPanelRequested, this.onPanelRequested, this);
    GameEvents.on(EVENT.playerDied, this.onDied, this);
    GameEvents.on(EVENT.playerRespawned, this.onRespawned, this);
    // Kartografia I odblokowuje stronę mapy — nauka przy otwartej stronie
    // (konsola, przyszły zwój) ma ją odświeżyć od razu.
    GameEvents.on(EVENT.skillsChanged, this.onSkillsChangedForMap, this);

    this.reposition();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.xpChanged, this.refreshCharacter, this);
      GameEvents.off(EVENT.attributesChanged, this.refreshCharacter, this);
      GameEvents.off(EVENT.playerHpChanged, this.refreshCharacter, this);
      GameEvents.off(EVENT.equipmentChanged, this.onEquipmentChanged, this);
      GameEvents.off(EVENT.inventoryChanged, this.onInventoryChanged, this);
      GameEvents.off(EVENT.bagsChanged, this.onBagsChanged, this);
      GameEvents.off(EVENT.abilitiesChanged, this.onAbilitiesChanged, this);
      GameEvents.off(EVENT.weaponProficiencyChanged, this.onWeaponProficiencyChanged, this);
      GameEvents.off(EVENT.questsChanged, this.refreshQuests, this);
      GameEvents.off(EVENT.trackedQuestChanged, this.refreshQuests, this);
      GameEvents.off(EVENT.questJournalRequested, this.onJournalRequested, this);
      GameEvents.off(EVENT.playerPanelRequested, this.onPanelRequested, this);
      GameEvents.off(EVENT.playerDied, this.onDied, this);
      GameEvents.off(EVENT.playerRespawned, this.onRespawned, this);
      GameEvents.off(EVENT.skillsChanged, this.onSkillsChangedForMap, this);
      scene.input.off(Phaser.Input.Events.DRAG_START, this.onBagDragStart, this);
      scene.input.off(Phaser.Input.Events.DRAG, this.onBagDrag, this);
      scene.input.off(Phaser.Input.Events.DROP, this.onBagDrop, this);
      scene.input.off(Phaser.Input.Events.DRAG_END, this.onBagDragEnd, this);
      scene.input.off(Phaser.Input.Events.DRAG_ENTER, this.onBagDragEnter, this);
      scene.input.off(Phaser.Input.Events.DRAG_LEAVE, this.onBagDragLeave, this);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onGridPointerMove, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onGridPointerUp, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onGridPointerUp, this);
      this.gridAutoScrollTimer?.remove(false);
      // Not on the display list (it's a mask source), so nothing else destroys
      // it when the scene tears down.
      this.gridMaskG?.destroy();
    });

    // ⚠ Panel startuje ZAMKNIĘTY, więc bramka `this.open` (patrz
    // `refreshCharacter`) przepuszcza z tego tylko odznakę punktu i manekin —
    // reszta i tak przemaluje się z żywego stanu przy pierwszym `openTo()`.
    // Wołania zostają: są tanie, a gdyby panel kiedyś startował otwarty, to one
    // są jedyną rzeczą, która by go wypełniła.
    this.refreshCharacter();
    this.refreshInventory({ slots: Inventory.slots, gold: Inventory.gold });
    this.refreshEquipIcons(Equipment);
    // ⚠⚠ **Rząd TOREB musi dostać ten sam pierwszy przemalunek co reszta.**
    //   Bez tej linijki ikony slotów na torby zostawały na teksturze
    //   `__MISSING` Phasera — a to jest ten biały znaczek, który w grze czytał
    //   się jako „biała kreska zamiast plecaka". Malowały się dopiero przy
    //   PIERWSZYM zdarzeniu `bagsChanged`, więc panel zbudowany, gdy torba
    //   JUŻ była założona (wczytany zapis, restart `UIScene` po śmierci albo
    //   zmianie mapy), pokazywał ją pustą w nieskończoność. Podpowiedź działała,
    //   bo czyta `Equipment[slot]` na żywo — stąd „nazwa i opis OK, ikony brak".
    //   ⛔ To NIE był problem plecaka ani jego assetu: `icon-bag-4` ładuje się
    //     normalnie, a `item-icon-leather_backpack` powstaje tak samo jak każda
    //     inna ikona. Brakowało wyłącznie pierwszego przemalunku z żywego stanu,
    //     który `refreshEquipIcons` linijkę wyżej robi dla `EQUIP_SLOTS` —
    //     a `BAG_SLOTS` są świadomie osobną listą i wypadły z tego kroku.
    this.onBagsChanged(Equipment);
    this.refreshQuests();
    this.refreshMap();
  }

  /* ── Tabs ─────────────────────────────────────────────────────────────── */

  /**
   * ⭐ **Szyna nawigacji** (etap D, 2026-10-13; D13, E5): sakiewka u góry,
   * zakładki ikona + podpis, „Wróć do gry" NA DOLE — ten sam widżet i ten sam
   * wzorzec „opcje = pionowa lista po prawej", co rama rozmowy.
   * ⚠ Zakładka `save` nazywa się dla gracza „Opcje" z kołem zębatym: niesie
   * zapis, USTAWIENIA i wyjście (każda gra mobilna). Klucz `save` i klawisz
   * `Z` zostają.
   */
  private buildRail(): void {
    this.rail = new Rail<TabId>(this.scene, {
      depth: 1402,
      exitLabel: "Wróć do gry",
      onSelect: (id) => this.setTab(id),
      onExit: () => this.close(),
    });
    this.rail.setIdentity("", Inventory.gold);
    this.rail.setTabs(this.railTabs(), this.activeTab);
  }

  private railTabs(): RailTab<TabId>[] {
    return [
      {
        id: "character",
        label: "Postać",
        icon: "character",
        // Ta sama kropka, co na odznace poziomu w HUD — punkty do wydania.
        marker: this.railPointsBadge ? { text: "●", color: "#66ddff" } : undefined,
      },
      { id: "inventory", label: "Plecak", icon: "bag" },
      { id: "quests", label: "Zadania", icon: "quests" },
      { id: "map", label: "Mapa", icon: "map" },
      { id: "save", label: "Opcje", icon: "options" },
    ];
  }

  private setTab(id: TabId): void {
    this.activeTab = id;
    if (id !== "map") this.menuTab = id;
    this.characterPage.setVisible(id === "character");
    this.inventoryPage.setVisible(id === "inventory");
    this.questsPage.setVisible(id === "quests");
    this.mapPage.setVisible(id === "map");
    this.savePage.setVisible(id === "save");
    // Slot cards carry a clock and a timestamp, so they go stale just by
    // sitting there — rebuild on every entry rather than only on open.
    if (id === "save") this.refreshSave();
    this.rail.setActive(id);
    this.clearBagSelection();
  }

  /** Open straight to `tab`; switch to it if already open on the other tab;
   *  close if already open on that same tab (mirrors a single toggle key). */
  private openTo(tab: TabId): void {
    if (this.playerDead) return;
    if (!this.open) {
      this.open = true;
      KeyFocus.take("panel");
      this.container.setVisible(true);
      this.rail.setVisible(true);
      this.setTab(tab);
      this.refreshCharacter();
      this.refreshInventory({ slots: Inventory.slots, gold: Inventory.gold });
      this.refreshQuests();
      this.refreshMap();
      this.pauseGame();
    } else if (this.activeTab === tab) {
      this.close();
    } else {
      this.setTab(tab);
    }
  }

  private close(): void {
    this.open = false;
    KeyFocus.release("panel");
    this.container.setVisible(false);
    this.rail.setVisible(false);
    // Zaznaczenie nie moze przezyc zamkniecia: karta jest przypieta na stale,
    // wiec bez tego zostalaby na ekranie nad zamknietym panelem.
    this.clearBagSelection();
    this.resumeGame();
  }

  /* ── Character page ──────────────────────────────────────────────────── */

  private buildCharacterPage(): void {
    // Obie podstrony są dziećmi strony POSTAĆ, więc przełączanie to jedna
    // widoczność, a nie przebudowa — i `setTab` nic o nich nie musi wiedzieć.
    this.traitsPage = this.scene.add.container(0, 0);
    this.skillsPage = this.scene.add.container(0, 0).setVisible(false);
    this.weaponsPage = this.scene.add.container(0, 0).setVisible(false);
    this.characterPage.add([this.traitsPage, this.skillsPage, this.weaponsPage]);
    this.buildCharSubTabs();
    this.buildSkillsSubPage();
    this.buildWeaponsSubPage();
    this.buildTraitsSubPage();
  }

  /**
   * **CECHY w DWÓCH KOLUMNACH — atrybuty osobno od tego, co z nich wynika.**
   *
   * ⚠ **Powód jest zmierzony, nie estetyczny.** Do 2026-09-03 wszystkie
   * trzynaście wierszy stało w JEDNEJ kolumnie na całą szerokość panelu:
   * etykieta przy lewej krawędzi, wartość przy prawej, 816 j. pustki między
   * nimi. Na monitorze 32" to kilkadziesiąt centymetrów wodzenia wzrokiem na
   * każdy odczyt — a przy tym „Siła 5" wyglądała dokładnie tak samo jak
   * „Obrażenia 12–18", mimo że pierwsze jest DECYZJĄ gracza, a drugie
   * WYNIKIEM systemu.
   *
   * Podział niesie tę różnicę:
   * - **lewa kolumna = co WYDAJESZ** — cztery atrybuty (większy font, przycisk
   *   „+", podpis „co kupuje punkt") i pula punktów rozwoju pod nimi;
   * - **prawa kolumna = co z tego WYCHODZI** — walka i zasoby, drobniejszym
   *   krojem, bez żadnej kontrolki.
   *
   * ⚠ **„Punkty rozwoju" przeniosły się do lewej kolumny i to NAPRAWIA BŁĄD.**
   * Stały na `y = 190` z wartością przy prawej krawędzi (x ≈ 388), czyli
   * dokładnie pod przyciskiem „Wróć do gry" (x 276…396, y 194…228), który jest
   * dodawany PÓŹNIEJ, więc rysuje się na wierzchu. **Liczby punktów po prostu
   * nie było widać** — dokładnie ta klasa usterki, o której mówi
   * `src/ui/CLAUDE.md` („przemieć WSZYSTKIE dzieci strony względem granic
   * panelu"). W lewej kolumnie kolizja jest niemożliwa geometrycznie.
   *
   * ⚠ **Obciążenie NIE jest już tutaj** (decyzja autora, 2026-09-03). Opisuje
   * NOSZONY SPRZĘT, nie postać — jego dom jest w zakładce PLECAK, nad
   * manekinem, obok pojemności plecaka. Karta przedmiotu i tak liczyła już
   * skutek założenia (dziś `ItemCard` w kolumnie karty), więc informacja nie znika, tylko wraca
   * tam, gdzie gracz podejmuje decyzję.
   */
  private buildTraitsSubPage(): void {
    const page = this.traitsPage;
    // ⭐ Etap F (2026-10-13): role tekstu (`body` 18 j., nazwy atrybutów
    // `name` 21 j.) i geometria z pasa podzakładek, nie ze stałych pod 816×530.
    // Dwie kolumny po połowie strony z rynkiem pośrodku i pionową kreską.
    const R = PlayerPanel.TRAITS;
    const top = -this.characterPageH / 2 + this.charSubBand();
    const gutter = 48;
    const colW = (this.w - 2 * R.pad - gutter) / 2;
    const lx = -this.w / 2 + R.pad;
    const rx = lx + colW + gutter;

    // ── Pas postępu: dwie liczby, które opisują POSTAĆ, a nie walkę ────────
    this.addStatRow(page, "level", "Poziom", lx, colW, top + 4);
    this.addStatRow(page, "exp", "Doświadczenie", rx, colW, top + 4);
    page.add(this.scene.add.rectangle(0, top + 40, this.w - 2 * R.pad, 1, 0xffffff, 0.18));

    // ── Lewa kolumna: atrybuty (to, co gracz WYDAJE) ──────────────────────
    const sekcja = top + 56;
    this.addSectionHeader(page, lx, sekcja, "ATRYBUTY");
    // ⚠ Podpisy Siły i Zręczności są PUSTE przy budowie i wypełnia je
    // `refreshCharacter`, bo od 2026-08-20 **zależą od trzymanej broni**
    // (`ITEMS[*].strScale`/`dexScale`). Stała z configu kłamałaby przy każdej
    // broni poza jedną.
    const a0 = sekcja + 24;
    this.addAttribute("strength", "Siła", "", a0, lx, colW);
    this.addAttribute(
      "vitality",
      "Witalność",
      `+${ATTRIBUTES.hpPerVitality} HP, +${dec(ATTRIBUTES.hpRegenPerVitality, 2)} HP/s`,
      a0 + R.attrH,
      lx,
      colW,
    );
    this.addAttribute("conditioning", "Kondycja", `+${STAMINA.perConditioning} wysiłku / pkt`, a0 + 2 * R.attrH, lx, colW);
    this.addAttribute("agility", "Zręczność", "", a0 + 3 * R.attrH, lx, colW);
    const podAtr = a0 + 4 * R.attrH + 4;
    page.add(this.scene.add.rectangle(lx + colW / 2, podAtr, colW, 1, 0xffffff, 0.12));
    // Pula stoi pod atrybutami, bo jest ICH walutą — nie kolejną statystyką.
    this.addStatRow(page, "points", "Punkty rozwoju", lx, colW, podAtr + 12);

    // ── Prawa kolumna: co z atrybutów i sprzętu WYCHODZI ───────────────────
    page.add(this.scene.add.rectangle(lx + colW + gutter / 2, (top + 52 + this.characterPageH / 2 - 20) / 2, 1, this.characterPageH / 2 - 20 - top - 52, 0xffffff, 0.18));
    this.addSectionHeader(page, rx, sekcja, "WALKA");
    const walka: [string, string][] = [
      ["damage", "Obrażenia"],
      ["atkSpeed", "Szybkość ataku"],
      // Ukorzenienie zaraz pod tempem — dwie połowy jednej rzeczy: jak często
      // machasz i jak długo po tym stoisz (40–46% każdej sekundy walki).
      ["recovery", "Ukorzenienie"],
      ["crit", "Szansa na kryt."],
      ["critDmg", "Obrażenia kryt."],
      ["defense", "Obrona"],
    ];
    walka.forEach(([key, label], i) => this.addStatRow(page, key, label, rx, colW, a0 + i * R.statH));
    const zasoby = a0 + walka.length * R.statH + 10;
    this.addSectionHeader(page, rx, zasoby, "ZASOBY");
    (
      [
        ["hp", "Punkty życia"],
        ["stamina", "Wysiłek"],
        ["regen", "Regeneracja"],
      ] as [string, string][]
    ).forEach(([key, label], i) => this.addStatRow(page, key, label, rx, colW, zasoby + 24 + i * R.statH));
  }

  /** Geometria strony CECHY (etap F): margines, wiersz statystyki, wiersz atrybutu. */
  private static readonly TRAITS = { pad: 24, statH: 32, attrH: 64 } as const;

  /** Nagłówek sekcji: złote wersaliki + cienka kreska pod spodem. Jedyny
   *  ozdobnik na tej stronie i celowo jedyny — informacja przed dekoracją. */
  private addSectionHeader(
    page: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
  ): void {
    page.add(
      this.scene.add
        .text(x, y, label, textStyle({ fontSize: fontPx("small"), color: UI.gold, fontStyle: "bold" }))
        .setOrigin(0, 0.5),
    );
  }

  /** Pas podzakładek u góry strony POSTAĆ: margines + kafel + odstęp. */
  private static readonly SUB_TAB = { top: 12, h: 52, gap: 10 } as const;

  /** Wysokość pasa podzakładek — podstrony stoją pod nim. */
  private charSubBand(): number {
    const T = PlayerPanel.SUB_TAB;
    return T.top + T.h + T.gap;
  }

  /**
   * Podzakładki u góry strony POSTAĆ.
   *
   * ⭐ **Etap F (2026-10-13): kafel 52 j. i krój `body`** — były 26 j. i 10 px,
   * czyli połowa progu dotyku i ≈ 6 dp tekstu. Szerokość liczona z LICZBY
   * podzakładek (rząd liczony ze stałych przerasta panel po cichu —
   * `src/ui/CLAUDE.md`).
   */
  private buildCharSubTabs(): void {
    const T = PlayerPanel.SUB_TAB;
    const tabs: { id: CharSubTab; label: string }[] = [
      { id: "traits", label: "Cechy" },
      { id: "skills", label: "Umiejętności" },
      { id: "weapons", label: "Broń" },
    ];
    const pad = 18;
    const gap = 8;
    const w = (this.w - 2 * pad - gap * (tabs.length - 1)) / tabs.length;
    const y = -this.characterPageH / 2 + T.top + T.h / 2;
    for (let i = 0; i < tabs.length; i++) {
      const { id, label } = tabs[i];
      const x = -this.w / 2 + pad + i * (w + gap) + w / 2;
      const box = this.scene.add
        .rectangle(x, y, w, T.h, UI.slotBg, 1)
        .setStrokeStyle(2, 0x3a4058, 0.5)
        .setInteractive({ useHandCursor: true });
      const text = this.scene.add
        .text(x, y, label, textStyle({ fontSize: fontPx("body"), color: UI.muted, fontStyle: "bold" }))
        .setOrigin(0.5);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.charSubTab !== id) Sfx.play("ui-click");
        this.setCharSubTab(id);
      });
      this.characterPage.add([box, text]);
      this.subTabWidgets.push({ id, box, text });
    }
    this.setCharSubTab("traits");
  }

  private setCharSubTab(id: CharSubTab): void {
    this.charSubTab = id;
    this.traitsPage.setVisible(id === "traits");
    this.skillsPage.setVisible(id === "skills");
    this.weaponsPage.setVisible(id === "weapons");
    for (const t of this.subTabWidgets) {
      const on = t.id === id;
      t.box.setStrokeStyle(2, on ? UI.goldNum : 0x3a4058, on ? 1 : 0.5);
      t.text.setColor(on ? UI.gold : UI.muted);
    }
    if (id === "skills") this.refreshSkills();
    if (id === "weapons") this.refreshWeapons();
  }

  /**
   * **Podstrona BROŃ — biegłość (Proficiency) i ranga Mastery per rodzina.**
   * Projekt: `docs/systemy/proficiency.md` (rangi), §14a (start rodziny).
   *
   * ⭐ **Etap F (2026-10-13): `ListDetail`** — lista pięciu rodzin i karta
   * z sekcjami Biegłość / Ranga / Następna / W walce, te same co
   * w Mistrzostwie u trenera (`WeaponFamilyCard.familySections`). Do tej daty
   * strona składała własne napisy 10–15 j. z tych samych liczb.
   *
   * ⚠ **Wszystkie liczby są ODCZYTEM z `WeaponProficiency` i `Proficiency`**
   * — z magazynu, z którego `GameScene.currentStrike()` zamraża `P`.
   * ⚠ **Lista pokazuje WSZYSTKIE pięć rodzin**, także nierozpoczęte (§14a:
   * karta mówi, od czego wystartują). ⛔ Panel NIE sprzedaje rangi (D5) —
   * mówi, gdzie i za ile.
   */
  private buildWeaponsSubPage(): void {
    const band = this.charSubBand();
    const host = this.scene.add.container(0, band / 2);
    this.weaponsPage.add(host);
    this.weaponsView = new ListDetail(this.scene, host, computeListDetailLayout(this.w, this.characterPageH - band), (id) => {
      this.selectedFamily = id as WeaponFamily;
      this.refreshWeapons(false);
    });
  }

  /**
   * Przemaluj podstronę BROŃ. Wołane przy wejściu na nią, przy zmianie
   * biegłości i przy zmianie sprzętu (znacznik „w ręku" należy do broni).
   */
  private refreshWeapons(keepCardScroll = true): void {
    const noszona = Equipment.weaponFamily;
    if (this.selectedFamily === null) this.selectedFamily = noszona ?? WEAPON_FAMILIES[0];
    const family = this.selectedFamily;
    this.weaponsView.setRows(WEAPON_FAMILIES.map((f) => familyRow(f)), family);
    this.weaponsView.setCard(
      {
        title: WEAPON_FAMILY[family].label,
        subtitle: family === noszona ? "w ręku" : "Jak dobrze władasz tą rodziną — nie jak mocna jest broń.",
        subtitleColor: family === noszona ? UI.green : UI.muted,
        sections: familySections(family, "panel"),
      },
      "",
      keepCardScroll,
    );
    this.weaponsView.refreshMasks();
  }

  /**
   * Podstrona UMIEJĘTNOŚCI: lista POSIADANYCH umiejętności i karta wybranej.
   *
   * ⚠ **Ten ekran zarządza tym, CO MASZ — nie jest katalogiem gry** (decyzja
   * D-1/D-2, `docs/gui_umiejetnosci_handoff.md`). Źródłem listy jest
   * `Abilities.unlocked()`. Nienauczone mieszkają u trenera (`TrainerPanel`).
   *
   * ⭐ **Etap F (2026-10-13): `ListDetail`.** Do tej daty: pasek sześciu kafli
   * u góry, lista z własną kopią maski i ciągnięcia, karta-okienko
   * (dawny `ItemTooltip.showLines`) i pod nią stos do sześciu przycisków „Slot N —
   * zamień", wszystko krojem 10–13 j. Dziś pas akcji karty to RZĄD SZEŚCIU
   * KAFLI PASKA (`CardPicker`): pokazuje, co gdzie leży (ikony), a dotknięcie
   * wolnego kładzie, zajętego zamienia, złotego (tu leży) zdejmuje.
   *
   * ⚠ **Przypisanie idzie WYŁĄCZNIE przez kartę** (D-5). Tapnięcie wiersza
   * zaznacza; na pasek kładzie dopiero kafel slotu. Skrót „przytrzymaj, żeby
   * położyć" był rozważany i **odrzucony świadomie** — nie przywracaj go.
   */
  private buildSkillsSubPage(): void {
    const band = this.charSubBand();
    const host = this.scene.add.container(0, band / 2);
    this.skillsPage.add(host);
    this.skillsView = new ListDetail(this.scene, host, computeListDetailLayout(this.w, this.characterPageH - band), (id) => {
      if (id.startsWith(PASSIVE_ROW)) {
        this.selectedPassive = id.slice(PASSIVE_ROW.length) as SkillId;
      } else {
        this.selectedPassive = null;
        this.selectedAbility = id as AbilityId;
      }
      this.refreshSkills(false);
    });
  }

  /** Lista posiadanych umiejętności się zmieniła (nauka, wczytanie zapisu). */
  private onAbilitiesChanged(): void {
    if (this.open && this.charSubTab === "skills") this.refreshSkills();
  }

  /**
   * ⭐ **Umiejętności BIERNE na tej samej liście, POD czynnymi** (autor
   * 2026-10-14: nauczone Skórowanie, Pieczenie czy Kartografia nie były
   * widoczne NIGDZIE w panelu). Bierna = wpis `SKILLS` bez `unlocksAbility`:
   * działa sama, nie ma miejsca na pasku, więc karta nie ma rzędu slotów.
   */
  private passiveSkills(): SkillId[] {
    return (Object.keys(SKILLS) as SkillId[]).filter((id) => Skills.has(id) && !Skills.abilityOf(id));
  }

  private refreshSkills(keepCardScroll = true): void {
    // ⚠ `Abilities.unlocked()` zwraca kolejność KONFIGURACYJNĄ — wiersz nie
    // skacze między sesjami ani po nauce kolejnej umiejętności.
    const order = Abilities.unlocked();
    const passives = this.passiveSkills();
    if (order.length === 0 && passives.length === 0) {
      this.selectedAbility = null;
      this.selectedPassive = null;
      this.skillsView.setRows([], null, false);
      // ⚠ To NIE jest komunikat błędu: świeża postać nie zna żadnej
      // umiejętności, więc pusta lista jest normalnym stanem gry.
      this.skillsView.setCard(null, "Nie znasz jeszcze żadnej umiejętności.\nNaucz się ich u trenera.");
      this.skillsView.refreshMasks();
      return;
    }
    if (this.selectedPassive !== null && !passives.includes(this.selectedPassive)) this.selectedPassive = null;
    if (this.selectedAbility === null || !order.includes(this.selectedAbility)) this.selectedAbility = order[0] ?? null;
    if (this.selectedAbility === null && this.selectedPassive === null) this.selectedPassive = passives[0];
    const id = this.selectedAbility;
    const slotted = Abilities.slotted();

    this.skillsView.setRows(
      [
        ...order.map((a) => {
          const slot = Abilities.slotOf(a);
          return {
            id: a,
            icon: abilityIconKey(a),
            name: getAbility(a).name,
            // Podpis odpowiada na „gdzie leży / co kosztuje", nie „co masz zrobić".
            note: slot >= 0 ? `na pasku — slot ${slot + 1}` : abilityCostLine(a),
            noteColor: slot >= 0 ? UI.gold : UI.muted,
          };
        }),
        ...passives.map((sk) => ({
          id: PASSIVE_ROW + sk,
          mark: "◆",
          markColor: UI.goldLight,
          name: getSkill(sk).name,
          note: "bierna — działa sama",
          noteColor: UI.muted,
        })),
      ],
      this.selectedPassive !== null ? PASSIVE_ROW + this.selectedPassive : id,
    );

    if (this.selectedPassive !== null || id === null) {
      const sk = getSkill(this.selectedPassive ?? passives[0]);
      const nauczyciel = NPCS[sk.trainer as keyof typeof NPCS]?.name;
      this.skillsView.setCard(
        {
          title: sk.name,
          subtitle: "Umiejętność bierna — działa sama, bez miejsca na pasku",
          subtitleColor: UI.goldLight,
          sections: [
            { lines: [{ text: sk.description }] },
            ...(nauczyciel ? [{ lines: [{ text: "Nauczył cię", value: nauczyciel, color: UI.muted }] }] : []),
          ],
        },
        "",
        keepCardScroll,
      );
      this.skillsView.refreshMasks();
      return;
    }

    // Karta: wiersze `abilityCardLines` (jedno źródło treści — D-11), od trzeciej;
    // pierwsze dwie (nazwa, miejsce na pasku) niesie nagłówek i rząd slotów.
    const lines = abilityCardLines(id, Abilities.slotOf(id)).slice(2);
    const opis = getAbility(id).description;
    const mySlot = Abilities.slotOf(id);
    this.skillsView.setCard(
      {
        title: getAbility(id).name,
        subtitle: mySlot >= 0 ? `Na pasku — slot ${mySlot + 1}` : "Poza paskiem",
        subtitleColor: mySlot >= 0 ? UI.gold : UI.muted,
        sections: [
          { lines: [{ text: opis }] },
          {
            title: "Działanie",
            lines: lines
              .filter((l) => l.text !== opis)
              .map((l) => {
                const i = l.text.indexOf(": ");
                return i > 0 && i < 24
                  ? { text: l.text.slice(0, i), value: l.text.slice(i + 2), valueColor: l.color === UI.text ? UI.white : l.color }
                  : { text: l.text, color: l.color };
              }),
          },
        ],
        hint: "Na pasek: dotknij miejsca. Zajęte — zamienisz, złote — zdejmiesz.",
        picker: {
          slots: Array.from({ length: ABILITY_SLOTS }, (_, i) => {
            const here = slotted[i];
            return {
              label: String(i + 1),
              icon: here ? abilityIconKey(here) : undefined,
              active: here === id,
              onPick: () => {
                Abilities.assign(i, here === id ? null : id);
                this.refreshSkills();
              },
            };
          }),
        },
      },
      "",
      keepCardScroll,
    );
    this.skillsView.refreshMasks();
  }

  /**
   * Wiersz „etykieta … wartość" wewnątrz JEDNEJ kolumny.
   *
   * ⚠ **`x` i `width` są parametrami, a nie krawędziami panelu** (2026-09-03).
   * Wersja licząca `-w/2 + 20` … `w/2 - 20` rozciągała każdy odczyt na całą
   * szerokość 816 j.; przy dwóch kolumnach wartość ma stać przy SWOJEJ
   * etykiecie, nie przy ramce.
   */
  private addStatRow(
    page: Phaser.GameObjects.Container,
    key: string,
    label: string,
    x: number,
    width: number,
    y: number,
  ): void {
    page.add(this.scene.add.text(x, y, label, textStyle({ fontSize: fontPx("body"), color: UI.text })));
    const value = this.scene.add
      .text(x + width, y, "-", textStyle({ fontSize: fontPx("body"), color: UI.white, fontStyle: "bold" }))
      .setOrigin(1, 0);
    page.add(value);
    this.rows.set(key, value);
  }

  /** An attribute row: name, what a point buys, current value and a + button. */
  private addAttribute(
    attr: Attribute,
    label: string,
    effect: string,
    y: number,
    left: number,
    width: number,
  ): void {
    this.traitsPage.add(
      this.scene.add.text(left, y, label, textStyle({ fontSize: fontPx("name"), color: UI.white, fontStyle: "bold" })),
    );
    const effectText = this.scene.add.text(
      left,
      y + TYPE.name + 6,
      effect,
      textStyle({ fontSize: fontPx("small"), color: UI.muted }),
    );
    this.traitsPage.add(effectText);
    this.attrEffects.set(attr, effectText);

    // ⚠ Wartość atrybutu stoi rolą `name`, większą od statystyk w prawej
    // kolumnie — to jest liczba, którą gracz PODNOSI, a nie odczyt.
    // ⭐ Przycisk „+" 52 j. (był 26 j. — połowa progu dotyku).
    const btnSize = 52;
    const value = this.scene.add
      .text(left + width - btnSize - 14, y + btnSize / 2 - 4, "0", textStyle({ fontSize: fontPx("name"), color: UI.white, fontStyle: "bold" }))
      .setOrigin(1, 0.5);
    this.traitsPage.add(value);
    this.rows.set(attr, value);

    const btn = this.scene.add.container(left + width - btnSize / 2, y + btnSize / 2 - 4);
    const box = this.scene.add
      .rectangle(0, 0, btnSize, btnSize, 0x2c6e3f, 1)
      .setStrokeStyle(2, 0x7ddf9a, 0.9)
      .setInteractive({ useHandCursor: true });
    const plus = this.scene.add
      .text(0, 0, "+", textStyle({ fontSize: fontPx("title"), color: UI.white, fontStyle: "bold" }))
      .setOrigin(0.5);
    btn.add([box, plus]);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.spend(attr, btn);
    });
    // Na podstronę CECHY, nie na stronę — inaczej przyciski wydawania punktów
    // wisiałyby nad listą umiejętności.
    this.traitsPage.add(btn);
    this.plusButtons.push(btn);
  }

  private spend(attr: Attribute, btn: Phaser.GameObjects.Container): void {
    const before = Progression.maxHp;
    if (!Progression.spendPoint(attr)) return;
    // Hand the player the HP that Endurance just unlocked.
    GameEvents.emit(EVENT.maxHpGranted, { delta: Progression.maxHp - before });
    this.scene.tweens.add({
      targets: btn,
      scale: 0.85,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  /**
   * ── ⚠ BRAMKA `this.open` — reguła wspólna dla czterech odświeżaczy ───────
   *
   * `refreshCharacter`, `refreshInventory` i `refreshQuests` wiszą na
   * zdarzeniach, które lecą **przez całą rozgrywkę**: `playerHpChanged` przy
   * każdej regeneracji, `inventoryChanged` przy każdym podniesionym łupie,
   * `questsChanged` przy każdym postępie. Panel jest przy tym zamknięty przez
   * ~99% czasu, a przemalowywał się mimo to.
   *
   * Najdroższy był dziennik: `refreshQuests` **niszczy i buduje od zera**
   * wszystkie karty zadań, czyli tworzy garść nowych obiektów `Text` — a każdy
   * nowy napis to płótno 2D plus **synchroniczna wysyłka tekstury na GPU**.
   * Pomiar z trace'u 2026-08-23: `refreshQuests` 236 ms, `Text2` 234 ms,
   * `updateText` 190 ms, `texImage2D` 72 ms — i cały ten koszt szedł w kadr,
   * którego nikt nie oglądał. To jest **skokowe** zacięcie przy podniesieniu
   * łupu, nie stały narzut, więc w średnim FPS nie było go widać.
   *
   * ⚠ **Bramka nie potrzebuje flagi „brudne" i celowo jej nie ma.** Jedyną
   * drogą do otwarcia panelu jest `openTo()`, które ustawia `this.open = true`
   * **przed** wywołaniem wszystkich odświeżaczy — więc otwarcie zawsze maluje
   * z żywego stanu. Flaga byłaby drugim źródłem prawdy o tym samym.
   *
   * ⚠ **`refreshEquipIcons` NIE jest bramkowane i to jest różnica świadoma.**
   * `openTo()` go nie woła (manekin jest odświeżany tylko przez
   * `equipmentChanged`), więc bramka zgubiłaby zmianę sprzętu dokonaną przy
   * zamkniętym panelu. Kosztuje przy tym `setTexture`/`setVisible` na dziesięć
   * slotów, bez jednego napisu — w profilu nie pojawia się w ogóle.
   */
  private refreshCharacter(): void {
    // ⚠ Odznaka „masz punkt do wydania" siedzi na MINIMAPIE (wejściu do panelu),
    // poza panelem — jest jedyną rzeczą z tej metody widoczną przy zamkniętym,
    // więc jedyną PRZED bramką. Bez tego awans w trakcie gry nie zapalałby kropki.
    const canSpend = Progression.skillPoints > 0;
    this.menuButton.setBadge(canSpend);
    if (this.railPointsBadge !== canSpend) {
      this.railPointsBadge = canSpend;
      this.rail.setTabs(this.railTabs(), this.activeTab);
    }
    if (!this.open) return;

    // Odblokowanie umiejętności zależy od POZIOMU, a poziom zmienia się poza
    // panelem — więc podstrona umiejętności musi się odświeżyć razem z cechami,
    // inaczej awans w otwartym panelu zostawia „zablokowane, poziom 6" nad
    // umiejętnością, która właśnie stała się dostępna. Tylko gdy jest widoczna:
    // przy zamkniętej i tak przeliczy ją `setCharSubTab`.
    if (this.charSubTab === "skills") this.refreshSkills();
    const toNext = Progression.xpToNext();
    this.rows.get("level")?.setText(`${Progression.level}`);
    this.rows.get("exp")?.setText(Number.isFinite(toNext) ? `${Progression.xp} / ${toNext}` : "MAX");
    // Rounded for display — the unrounded fraction (see Quality.instanceDamage)
    // is what the actual roll and the item tooltip use; the character sheet
    // just needs a clean range here.
    this.rows
      .get("damage")
      ?.setText(`${Math.round(Progression.meleeDamageMin)}–${Math.round(Progression.meleeDamageMax)}`);
    // Attacks per second is the number that actually means something in the
    // hand; the "+X%" beside it is what the next Agility point moves.
    const bonus = Progression.attackSpeedBonus;
    this.rows
      .get("atkSpeed")
      ?.setText(
        `${dec(1 / Progression.attackCooldown, 2)} ciosu/s` +
          (bonus > 0 ? `  (+${Math.round(bonus * 100)}% tempa)` : ""),
      );
    // Ukorzenienie: ile stoisz po zamachu i jaką część cyklu to zjada. Udział
    // procentowy jest tu ważniejszy od samych milisekund — 220 ms nic nie mówi,
    // a „44% cyklu" mówi, że prawie połowę walki stoisz w miejscu.
    // ⚠ Samo „−2%" obok dwóch innych liczb czytało się jak wpis debugowy —
    // gracz nie miał jak zgadnąć, czego te procenty dotyczą. Zostają dwie
    // liczby, które NIOSĄ sens: ile stoisz i jaką część cyklu to zjada.
    // Skrócenie ukorzenienia przez Zręczność jest już w tych milisekundach.
    const root = Progression.rootDurationMs;
    const udzial = Math.round((root / (Progression.attackCooldown * 1000)) * 100);
    this.rows.get("recovery")?.setText(`${Math.round(root)} ms  ·  ${udzial}% cyklu`);
    this.rows.get("crit")?.setText(`${Math.round(Progression.critChance * 100)}%`);
    this.rows
      .get("critDmg")
      ?.setText(
        `${Math.round(Progression.critMultiplier * 100)}%  ` +
          `(${Math.round(Progression.meleeDamageMin * Progression.critMultiplier)}–` +
          `${Math.round(Progression.meleeDamageMax * Progression.critMultiplier)})`,
      );
    this.rows.get("hp")?.setText(`${Math.ceil(Vitals.hp)} / ${Progression.maxHp}`);
    // Spelled out as "poza walką" because the five-second rule is invisible
    // otherwise — players would read a flat HP/s and wonder why it stalls the
    // moment something bites them.
    this.rows
      .get("regen")
      ?.setText(`${dec(Progression.hpRegenPerSecond, 2)} HP/s  ·  poza walką`);
    // ⚠ **`Math.round` na punktach obrony jest NAPRAWĄ, nie kosmetyką.**
    // `Equipment.totalDefense` sumuje wartości skalowane jakością, więc
    // wychodziło z niego `69.46000000000001` i panel pokazywał tę liczbę
    // dosłownie. Rozstrzygnięcie ciosu i tak liczy w pełnej precyzji —
    // zaokrąglenie jest wyłącznie po stronie odczytu.
    this.rows
      .get("defense")
      ?.setText(
        `${Math.round(Equipment.totalDefense)} pkt  ·  −${Math.round(Equipment.defenseReduction * 100)}% obrażeń`,
      );
    this.rows.get("strength")?.setText(`${Progression.strength}`);
    this.rows.get("vitality")?.setText(`${Progression.vitality}`);
    this.rows.get("conditioning")?.setText(`${Progression.conditioning}`);
    this.rows.get("agility")?.setText(`${Progression.agility}`);
    // ⚠ Stan wysiłku dopisywany tylko wtedy, gdy JEST stanem — „Normalny"
    // dopisany zawsze zamieniłby informację w tło, a etykieta pustego stanu
    // jest w configu pusta właśnie po to.
    const stan = Stamina.stateLabel;
    this.rows
      .get("stamina")
      ?.setText(
        `${Math.round(Stamina.current)} / ${Stamina.max}${stan ? ` — ${stan}` : ""}`,
      );
    // ⚠ Obciążenie NIE jest statystyką postaci — mieszka przy lalce na stronie
    // PLECAK (liczby pod lalką + pusty stan karty), bo opisuje NOSZONY SPRZĘT.
    this.refreshNumbers();
    this.refreshDetails();

    // ── Podpisy zależne od BRONI ─────────────────────────────────────────
    // ⚠ Liczone z tego samego źródła, z którego liczy walka
    // (`Equipment.weaponScaling`), a nie ze stałej w configu — inaczej panel
    // opisywałby model, a nie broń, którą gracz właśnie trzyma. To jest
    // jedyne miejsce w grze, w którym widać, że młot nagradza Siłę, a sztylet
    // Zręczność, więc ta linijka niesie całą naukę nowego modelu.
    const skal = Equipment.weaponScaling ?? { str: PLAYER.strScale, dex: PLAYER.dexScale };
    const pct = (v: number) => dec(v * 100, 1);
    this.attrEffects.get("strength")?.setText(`+${pct(skal.str)}% obr. bronią / pkt`);
    // Zręczność ma trzy efekty i nie mieszczą się w jednej linii 11 px, więc
    // ukorzenienie ma własny wiersz wyżej — tu zostają dwa, które zmieniają
    // liczbę obrażeń i tempo.
    this.attrEffects
      .get("agility")
      ?.setText(`+${pct(skal.dex)}% obr., +${pct(ATTRIBUTES.attackSpeedPerAgility)}% tempa`);
    this.rows.get("points")?.setText(`${Progression.skillPoints}`);

    // Grey out the + buttons when there is nothing to spend.
    for (const b of this.plusButtons) b.setAlpha(canSpend ? 1 : 0.35);
  }

  /* ── Inventory page ──────────────────────────────────────────────────── */

  /**
   * ⭐ **Strona PLECAK po etapie D (2026-10-13):** lalka-sylwetka | plecak
   * 4 kol. z torbami pod siatką | STAŁA kolumna karty — geometria
   * `computeInventoryLayout` (`EquipLayout.ts`), dane sylwetki `DOLL_CELLS`.
   * Research: `docs/ui_mobile_research.md` §8 R5; decyzje E1, E2.
   *
   * ⚠ **Kolejność dodawania do strony jest nośna:** lalka → karta → kategorie
   * → torby → siatka. Przeciągana ikona jest wynoszona na wierzch dzieci
   * `bagGridList`, więc siatka musi stać NAD lalką i nad torbami, żeby ikona
   * w locie rysowała się nad nimi.
   */
  private buildInventoryPage(): void {
    const page = this.inventoryPage;
    const L = this.inv;

    this.buildEquipColumn();

    // Pionowa kreska między tym, co „na sobie", a tym, co „w plecaku".
    const kreskaX = L.doll.left + L.doll.width + L.colGap / 2;
    page.add(this.scene.add.rectangle(kreskaX, (L.top + L.bottom) / 2, 1, L.bottom - L.top, 0xffffff, 0.18));

    this.card = new ShopDetails(this.scene, page, L.card);
    this.card.clear(this.emptyCardSummary());
    this.attachCardScroll();

    // Pojemność: między siatką a torbami, przy prawej krawędzi siatki — każda
    // kolumna mówi, ile się w niej mieści (obciążenie stoi w liczbach lalki).
    this.capacityText = this.scene.add
      .text(L.bag.gridLeft + L.bag.gridW, L.bag.capacityY, "", textStyle({ fontSize: fontPx("small"), color: UI.muted }))
      .setOrigin(1, 0.5);
    page.add(this.capacityText);

    this.buildBagFilterRow();
    this.buildBagSlots();
    this.buildGrid();
    if (L.overflow) console.warn(`[PlayerPanel] Układ strony PLECAK nie mieści się: ${L.overflow}`);
  }

  /* ── KARTA: stała kolumna (`ShopDetails`) ─────────────────────────────────
   *
   * ⚠ **Pusty stan kolumny NIE jest pusty** (lekcja z 2026-08-21): gdy nic nie
   * jest wybrane — a to jest stan zaraz po otwarciu — kolumna pokazuje
   * statystyki postaci i zestawy. Karta przedmiotu je wypiera; ⛔ nie rysuj
   * obu naraz w jednym miejscu (najechanie kontra zaznaczenie).
   */
  private emptyCardSummary(): ShopEmptySummary {
    const rows: [string, string][] = [
      ["Obrażenia", `${Math.round(Progression.meleeDamageMin)}–${Math.round(Progression.meleeDamageMax)}`],
      // ⚠ `attackCooldown` jest w SEKUNDACH (pierwsza wersja dzieliła 1000
      // przez tę liczbę i wypisywała „1051,85/s").
      ["Szybkość ataku", `${dec(1 / Progression.attackCooldown, 2)} ciosu/s`],
      ["Szansa na kryt.", `${Math.round(Progression.critChance * 100)}%`],
      // ⚠ Obrona RAZEM z redukcją — gołe punkty nie mówią, ile ciosu zostaje.
      ["Obrona", `${Math.round(Equipment.totalDefense)} pkt · −${Math.round(Equipment.defenseReduction * 100)}%`],
      ["Punkty życia", `${Math.ceil(Vitals.hp)} / ${Progression.maxHp}`],
      ["Obciążenie", `${dec(Equipment.equippedWeight, 1)} / ${dec(Equipment.loadCapacity, 1)} · ${Equipment.loadLabel}`],
    ];
    const kary = this.loadPenalties();
    if (kary.length) rows.push(["Kara obciążenia", kary.join(" · ")]);
    // ⚠ Zestawy widać POZA kartą przedmiotu (lekcja z WoW-a: postęp kompletu
    // czytany wyłącznie z dymka sztuki wymaga dotknięcia pięciu rzeczy).
    for (const set of Equipment.setProgress) {
      const progi = set.tiers.map((t) => `${t.count}${t.active ? "✓" : "·"}`).join(" ");
      rows.push([`${set.name} ${set.worn}/${set.total}`, progi]);
    }
    return {
      title: "Na sobie",
      rows,
      hint: Equipment.setProgress.length
        ? "Dotknij przedmiotu albo slotu — jego karta stanie tutaj. Przytrzymaj i przeciągnij, żeby przełożyć."
        : "Dotknij przedmiotu albo slotu — jego karta stanie tutaj. Dwie sztuki jednego zestawu dają pierwszą premię.",
    };
  }

  /**
   * ⚠ **Trzy kanały Modelu D pokazujemy OSOBNO** (`OI-104`), bo wiszą na dwóch
   * różnych osiach: ruch i wydolność na kilogramach (Siła ich nie zdejmuje),
   * wysiłek na stosunku do udźwigu (Siła go wykupuje). Jedna liczba zbiorcza
   * kłamałaby o tym, co gracz może z tym zrobić.
   */
  private loadPenalties(): string[] {
    const ruchKara = Math.round((1 - Equipment.speedMultiplier) * 100);
    const wydolnoscKara = Math.round((1 - Equipment.regenMultiplier) * 100);
    const wysilek = Equipment.loadMultiplier;
    const czesci: string[] = [];
    if (ruchKara > 0) czesci.push(`ruch −${ruchKara}%`);
    if (wydolnoscKara > 0) czesci.push(`wydolność −${wydolnoscKara}%`);
    if (wysilek > 1.005) czesci.push(`unik i bieg ×${dec(wysilek, 2)}`);
    return czesci;
  }

  /** Kolumna wraca do pustego stanu, ale tylko gdy nic nie jest wybrane. */
  private refreshDetails(): void {
    if (!this.card) return;
    if (this.selectedBagIndex === null && this.selectedDollSlot === null && this.selectedBagEquipSlot === null) {
      this.card.clear(this.emptyCardSummary());
    }
  }

  /** Pokaż kartę egzemplarza z akcjami (pierwsza = główna, zielona). */
  private showItemCard(inst: ItemInstance, actions: CardAction[]): void {
    const def = getItem(inst.itemId) as { sellPrice?: number };
    // Wartość u kupca — jedyna cena, która w panelu postaci coś znaczy.
    const cena = typeof def.sellPrice === "number" ? sellPriceOf(inst.itemId, qualityOf(inst)) : 0;
    this.card.show({
      card: buildItemCard(inst),
      iconKey: itemIconKey(inst.itemId),
      priceLabel: cena > 0 ? "WARTOŚĆ U KUPCA" : "",
      priceValue: cena > 0 ? `${cena} g` : "",
      actions: actions.map((a, i): ShopAction => ({
        label: a.label,
        onClick: a.onClick,
        disabled: a.disabled,
        tone: i === 0 ? "primary" : "neutral",
      })),
    });
  }

  /**
   * Najechanie myszą — podgląd w tej samej kolumnie, BEZ zmiany zaznaczenia.
   * ⚠ Reguła „najechanie ustępuje zaznaczeniu" (`src/ui/CLAUDE.md`): gdy coś
   * jest wybrane, podgląd nie przestawia karty, a jego zgaszenie jej nie gasi.
   */
  private previewCard(inst: ItemInstance | null): void {
    if (this.selectedBagIndex !== null || this.selectedDollSlot !== null || this.selectedBagEquipSlot !== null) return;
    if (inst) this.showItemCard(inst, []);
    else this.card.clear(this.emptyCardSummary());
  }

  /**
   * Przewijanie ciała karty: kółko i przeciągnięcie palcem po ciele.
   * ⚠ Gest na poziomie SCENY (palec wyjeżdża poza prostokąt), punkt
   * przeliczony przez skalę UI i kontener — `(p.x / uiScale() − container.x) /
   * container.scale` (reguła z `src/ui/CLAUDE.md`, sklep).
   */
  private cardScrollPointer: number | null = null;
  private cardScrollLastY = 0;
  private attachCardScroll(): void {
    const local = (p: Phaser.Input.Pointer) => {
      const s = this.container.scale;
      return {
        x: (p.x / uiScale() - this.container.x) / s - this.inventoryPage.x,
        y: (p.y / uiScale() - this.container.y) / s - this.inventoryPage.y,
      };
    };
    const inBody = (p: Phaser.Input.Pointer) => {
      if (!this.open || this.activeTab !== "inventory" || !this.card.hasCard) return false;
      const r = this.card.bodyRect;
      const q = local(p);
      return q.x >= r.x && q.x <= r.x + r.w && q.y >= r.y && q.y <= r.y + r.h;
    };
    const down = (p: Phaser.Input.Pointer) => {
      if (inBody(p) && this.card.scrollable) {
        this.cardScrollPointer = p.id;
        this.cardScrollLastY = p.y / uiScale();
      }
    };
    const move = (p: Phaser.Input.Pointer) => {
      if (this.cardScrollPointer !== p.id) return;
      const y = p.y / uiScale();
      this.card.scrollBy((this.cardScrollLastY - y) / this.container.scale);
      this.cardScrollLastY = y;
    };
    const end = (p: Phaser.Input.Pointer) => {
      if (this.cardScrollPointer === p.id) this.cardScrollPointer = null;
    };
    const wheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (inBody(p)) this.card.scrollBy(dy * 0.5);
    };
    const input = this.scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, down);
    input.on(Phaser.Input.Events.POINTER_MOVE, move);
    input.on(Phaser.Input.Events.POINTER_UP, end);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, end);
    input.on(Phaser.Input.Events.POINTER_WHEEL, wheel);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.off(Phaser.Input.Events.POINTER_DOWN, down);
      input.off(Phaser.Input.Events.POINTER_MOVE, move);
      input.off(Phaser.Input.Events.POINTER_UP, end);
      input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, end);
      input.off(Phaser.Input.Events.POINTER_WHEEL, wheel);
      this.card.destroy();
    });
  }

  /**
   * ⭐ **Trzy duże liczby pod lalką** (Eternium; research §6.1): Obrażenia,
   * Ochrona, Obciążenie — odpowiedź na „co mi to zmieniło" widoczna obok
   * lalki, a nie dopiero w pustej karcie. Pełny zestaw liczb: pusty stan
   * kolumny karty i strona POSTAĆ.
   * ⚠ Obciążenie zeszło tu z napisu nad lalką (dom od 2026-09-03: „opisuje
   * sprzęt ZAŁOŻONY, więc należy do kolumny lalki") — ta sama zasada, inny
   * kształt.
   */
  private buildNumbers(r: InvRect): void {
    const n = 3;
    const w = r.w / n;
    for (let i = 0; i < n; i++) {
      const cx = r.x + w * i + w / 2;
      const value = this.scene.add
        .text(cx, r.y + 2, "", textStyle({ fontSize: fontPx("body"), color: UI.white, fontStyle: "bold" }))
        .setOrigin(0.5, 0);
      const label = this.scene.add
        .text(cx, r.y + r.h - 2, "", textStyle({ fontSize: fontPx("small"), color: UI.muted }))
        .setOrigin(0.5, 1);
      this.equipRoot.add([value, label]);
      this.numberTexts.push({ value, label });
    }
    this.refreshNumbers();
  }

  private paintedHeavy: boolean | null = null;
  private refreshNumbers(): void {
    if (this.numberTexts.length < 3) return;
    const [dmg, def, load] = this.numberTexts;
    dmg.value.setText(`${Math.round(Progression.meleeDamageMin)}–${Math.round(Progression.meleeDamageMax)}`);
    dmg.label.setText("obrażenia");
    // ⚠ Kolumna liczby ma ~81 j. (lalka / 3) — podpisy jednym słowem, liczby
    // bez dopisków (render 1:1: „ochrona −41%" wchodziło na sąsiada). Redukcja
    // procentowa i udźwig stoją w pustym stanie karty.
    def.value.setText(`${Math.round(Equipment.totalDefense)}`);
    def.label.setText("ochrona");
    load.value.setText(`${dec(Equipment.equippedWeight, 1)} kg`);
    load.label.setText(Equipment.loadLabel.toLowerCase());
    // Kolor obciążenia = ten sam sygnał, co dawny napis nad lalką: złoto,
    // gdy obciążenie już coś kosztuje (którykolwiek z trzech kanałów Modelu D).
    // ⚠ Tylko przy ZMIANIE — `setColor` przerysowuje płótno zawsze.
    const ciezko = this.loadPenalties().length > 0;
    if (this.paintedHeavy !== ciezko) {
      this.paintedHeavy = ciezko;
      load.value.setColor(ciezko ? UI.gold : UI.white);
    }
  }

  /* ── FILTR PLECAKA ────────────────────────────────────────────────────────
   *
   * ⭐⭐ **WIDOK filtrowany, nie przestawienie — i nie przygaszanie** (`OI-130`,
   * decyzja autora 2026-10-11: „przygaszanie to nie najlepszy sposób
   * filtrowania"). Zakładka pokazuje WYŁĄCZNIE pasujące rzeczy, dosunięte
   * (`packShelf`, ta sama reguła co półka kupca).
   *
   * ⚠ **`Inventory.slots` nie rusza się ani o pole** — mapa `kotwica → miejsce
   * w widoku` żyje tylko tutaj. Dlatego reguła „żadnego automatycznego
   * porządkowania" (`docs/inventory_scroll_ux.md` §7/§8) zostaje w mocy:
   * w widoku filtrowanym działa tapnięcie (karta, akcje) i przeciągnięcie
   * NA lalkę, ⛔ a przestawianie w plecaku tylko w „Wszystko" — upuszczenie na
   * pole widoku nie miałoby prawdziwego adresu.
   */
  private buildBagFilterRow(): void {
    // Prostokąt z układu (`computeInventoryLayout`) — wysokość `STRIP_H`, jak w sklepie.
    const r = this.inv.bag.strip;
    this.bagStrip = new CategoryStrip(
      this.scene,
      this.inventoryPage,
      { x: r.x, y: r.y, w: r.w, h: STRIP_H },
      () => {
        this.refreshInventory({ slots: Inventory.slots, gold: Inventory.gold });
        this.setGridScroll(0);
      },
    );
  }

  /** Przelicz widok filtrowany. Czyta `Inventory.slots`, nigdy go nie zmienia. */
  private computeBagView(): void {
    const cat = this.bagStrip?.selected ?? "all";
    if (cat === "all") {
      this.bagView = null;
      return;
    }
    const kotwice: number[] = [];
    Inventory.slots.forEach((sl, i) => {
      if (sl && matchesCategory(sl.itemId, cat)) kotwice.push(i);
    });
    const pack = packShelf(this.cols, kotwice.map((i) => itemFootprint(Inventory.slots[i]!.itemId)));
    this.bagView = new Map(kotwice.map((i, k) => [i, pack.places[k]]));
    this.bagViewRows = pack.rows;
  }

  /* ── GEOMETRIA STRONY PLECAK ──────────────────────────────────────────────
   *
   * ⚠ **Cała geometria jest LICZONA** — jedno pole trzyma wynik, a liczy go
   * czysta funkcja bez Phasera (`computeInventoryLayout`, `EquipLayout.ts`),
   * więc układ da się sprawdzić bez uruchamiania gry
   * (`node tools/ekwipunek_uklad.mjs`). ⛔ Nie wpisuj tu współrzędnych.
   */
  private readonly inv = computeInventoryLayout(this.w, this.pageH);
  /** Bok kafla PLECAKA. */
  private readonly cell = this.inv.cell;
  private readonly gap = this.inv.gap;
  private readonly cols = this.inv.cols;
  /** Ikony przedmiotów są rysowane w 32 px i skalują się tylko CAŁKOWICIE —
   *  skala ułamkowa rozmywa pixel-art pod NEAREST. */
  private readonly iconScale = this.inv.iconScale;
  /** Góra kolumn strony. */

  /** Góra okna siatki plecaka — pod pasem kategorii. ⚠ To NIE jest
   *  `columnsTop`: zlanie obu w jedną liczbę dawało przyciski filtra
   *  narysowane NA pierwszym rzędzie kafli (zgłoszone z renderu). */
  private readonly gridTop = this.inv.bag.gridTop;
  /** Wysokość OKNA siatki plecaka (nie jej zawartości — ta się przewija). */
  private readonly columnH = this.inv.bag.gridH;
  private readonly gridW = this.inv.bag.gridW;
  private readonly gridLeft = this.inv.bag.gridLeft;

  /**
   * ── LALKA EKWIPUNKU: SYLWETKA (etap D, 2026-10-13) ──────────────────────
   *
   * Kafle buduje `DOLL_CELLS` (`PaperDoll.ts` — ta sama lista, z której sklep
   * bierze swoją sylwetkę), pozycje liczy `computeInventoryLayout`. Ta metoda
   * wyłącznie SKŁADA widżety.
   *
   * ⚠ Kontener stoi w (0, 0) strony, a prostokąty z układu są we
   * współrzędnych strony — bez przesunięć liczonych tutaj.
   *
   * ⚠ **Tło kafla rysujemy SAMI**; glify slotów to klatki `ASSETS.slotGlyphs`
   * (`tools/build_slot_glyphs.py`), tintowane pod motyw.
   */
  private buildEquipColumn(): void {
    this.equipRoot = this.scene.add.container(0, 0);
    this.inventoryPage.add(this.equipRoot);
    const L = this.inv.doll;

    this.buildLayerToggle(L.layerToggle);
    for (const rect of L.cells) this.buildEquipCell(rect);
    this.buildSetToggle(L.setToggle);
    this.buildNumbers(L.numbers);

    // ⚠ Asercja, która potrafi zaświecić na czerwono: slot rdzenia bez kafla
    // znaczy sprzęt NIEOSIĄGALNY — dziura widoczna dopiero dla gracza, który
    // ma go w zapisie. Ręce i obszary warstwowe liczą się przez swoje adresy.
    const placed = new Set<string>();
    for (const c of DOLL_CELLS) {
      if (c.slot) placed.add(c.slot);
      if (c.hand) placed.add(handSlot(c.hand, 1)).add(handSlot(c.hand, 2));
      if (c.area) for (const w of ARMOR_LAYERS) placed.add(layeredSlot(c.area, w));
    }
    const brak = EQUIP_SLOTS.filter((slot) => !placed.has(slot));
    if (brak.length > 0) console.warn(`[PlayerPanel] Sloty bez kafla w lalce: ${brak.join(", ")}`);
  }

  /**
   * ⭐ **Przełącznik warstw CAŁEJ lalki** (E1, decyzja autora 2026-10-13):
   * `👁 | Spód | Środek | Wierzch`. Oko = „to, co widać" (najbardziej
   * zewnętrzna zajęta warstwa w każdym obszarze) i jest stanem domyślnym —
   * gracz w samej przeszywanicy nie może zobaczyć pustego torsu tylko dlatego,
   * że przełącznik stoi na „Wierzch".
   * ⚠ Do tej daty warstwę wybierało się per obszar, w karcie (wzorzec sklepu).
   * Kropki zajętości pod kaflami zostają: mówią, CO leży pod spodem, zanim
   * gracz przełączy.
   */
  private buildLayerToggle(r: InvRect): void {
    const choices: (ArmorLayer | null)[] = [null, ...ARMOR_LAYERS];
    const segGap = 4;
    const eyeW = 44;
    const restW = (r.w - eyeW - segGap * (choices.length - 1)) / (choices.length - 1);
    let x = r.x;
    for (const layer of choices) {
      const w = layer === null ? eyeW : restW;
      const box = this.scene.add
        .rectangle(x + w / 2, r.y + r.h / 2, w, r.h, UI.slotBg, 1)
        .setStrokeStyle(2, 0x3a4058, 0.9)
        .setInteractive({ useHandCursor: true });
      this.equipRoot.add(box);
      const seg: (typeof this.layerSegments)[number] = { layer, box };
      if (layer === null) {
        seg.icon = drawUiIcon(this.scene.add.graphics({ x: box.x, y: box.y }), "eye", 26, 0xc8d0e0, UI.slotBg);
        this.equipRoot.add(seg.icon);
      } else {
        seg.label = this.scene.add
          .text(box.x, box.y, ARMOR_LAYER_SHORT[layer], textStyle({ fontSize: fontPx("small"), color: UI.text }))
          .setOrigin(0.5);
        this.equipRoot.add(seg.label);
      }
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.layerView === layer) return;
        Sfx.play("ui-click");
        this.layerView = layer;
        this.clearBagSelection();
        this.refreshEquipIcons(Equipment);
      });
      this.layerSegments.push(seg);
      x += w + segGap;
    }
  }

  /**
   * ⭐ **Przełącznik zestawów nad rękami** (E2, decyzja autora 2026-10-13):
   * `[I ▪▪] ⇄ [II ▪▪]`. Segment wybiera, którą parę POKAZUJĄ ręce lalki
   * (I = w rękach, II = schowana); miniatury mówią, co leży w KAŻDEJ parze, więc
   * zestaw niepokazany nie znika za przełącznikiem (research: antywzorzec 8).
   * „⇄" zamienia zestawy NAPRAWDĘ (`Equipment.swapWeaponSet`) — to jest akcja,
   * segmenty to widok. ⚠ W modelu zestaw I to ZAWSZE para w rękach
   * (`weapon`/`offhand`), więc po zamianie widok I pokazuje nową parę w rękach.
   */
  private buildSetToggle(r: InvRect): void {
    const swapW = 44;
    const segGap = 4;
    const segW = (r.w - swapW - 2 * segGap) / 2;
    const make = (set: 1 | 2, x: number) => {
      const box = this.scene.add
        .rectangle(x + segW / 2, r.y + r.h / 2, segW, r.h, UI.slotBg, 1)
        .setStrokeStyle(2, 0x3a4058, 0.9)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(x + 12, r.y + r.h / 2, set === 1 ? "I" : "II", textStyle({ fontSize: fontPx("body"), color: UI.text, fontStyle: "bold" }))
        .setOrigin(0, 0.5);
      // Miniatura ×1 to pełna klatka 32 j. — środki co 32 j., 2 j. od ramki
      // (przy 14 j. tarcza okrągła wchodziła na krawędź segmentu; render D).
      const minis = [0, 1].map((i) =>
        this.scene.add.image(x + segW - 18 - (1 - i) * 32, r.y + r.h / 2, "").setVisible(false),
      );
      this.equipRoot.add([box, label, ...minis]);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.setView === set) return;
        Sfx.play("ui-click");
        this.setView = set;
        this.clearBagSelection();
        this.refreshEquipIcons(Equipment);
      });
      this.setSegments.push({ set, box, label, minis });
    };
    make(1, r.x);
    const swapX = r.x + segW + segGap;
    make(2, swapX + swapW + segGap);

    this.swapBox = this.scene.add
      .rectangle(swapX + swapW / 2, r.y + r.h / 2, swapW, r.h, UI.slotBg, 1)
      .setStrokeStyle(2, EQUIP_FRAME, 1)
      .setInteractive({ useHandCursor: true });
    this.swapGlyph = this.scene.add.image(this.swapBox.x, this.swapBox.y, ASSETS.slotGlyphs.key, SWAP_GLYPH).setTint(0x8892a6);
    this.equipRoot.add([this.swapBox, this.swapGlyph]);
    // ⚠ Widoczny zawsze, odmowa z POWODEM (`src/ui/CLAUDE.md`): przy obu
    // zestawach pustych mówi to wprost.
    this.swapBox.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const refusal = Equipment.swapWeaponSet();
      if (refusal) {
        this.flash(describeSwapRefusal(refusal), "#ff9d3b");
        return;
      }
      Sfx.play("ui-click");
      this.clearBagSelection();
      this.flash("Zestaw broni zamieniony", "#88ddff");
    });
  }

  /** Jeden kafel lalki. Trzy rodzaje (`gear` / `quick` / `planned`) różnią się
   *  wyłącznie tym, co dzieje się po dotknięciu — wygląd składa się tak samo. */
  private buildEquipCell(rect: DollRect): void {
    const { cell, x, y, size } = rect;
    const cellH = rect.height;
    const root = this.equipRoot;

    const box = this.scene.add
      .rectangle(x, y, size, cellH, UI.slotBg, 1)
      .setStrokeStyle(2, EQUIP_FRAME, 1);
    root.add(box);

    // Glif slotu: widoczny, dopóki slot jest pusty. Skala CAŁKOWITA (glif ma
    // 32 px), więc kafel 68 j. dostaje ×2 — 64 j. z czterema jednostkami luzu.
    const glyphScale = Math.max(1, Math.floor((size - 8) / ASSETS.slotGlyphs.cell));
    const glyph = this.scene.add
      .image(x, y, ASSETS.slotGlyphs.key, cell.glyph)
      .setScale(glyphScale)
      .setTint(0x4a5063);
    root.add(glyph);

    const icon = this.scene.add.image(x, y, "").setVisible(false).setScale(this.iconScale);
    root.add(icon);

    // Kropki zajętości warstw — wyłącznie na czterech obszarach warstwowych.
    // Kropka mówi „ta warstwa jest ZAJĘTA"; pokazywana warstwa ma kropkę
    // jaśniejszą (`paintLayerPips`).
    let pips: Phaser.GameObjects.Rectangle[] | undefined;
    if (cell.area) {
      pips = [];
      const pipW = 7;
      const pipGap = 4;
      const totalW = ARMOR_LAYERS.length * pipW + (ARMOR_LAYERS.length - 1) * pipGap;
      for (let i = 0; i < ARMOR_LAYERS.length; i++) {
        const pip = this.scene.add
          .rectangle(x - totalW / 2 + i * (pipW + pipGap) + pipW / 2, y + cellH / 2 - 6, pipW, 4, 0x39405a, 1);
        root.add(pip);
        pips.push(pip);
      }
    }

    if (cell.kind === "planned") {
      // Przygaszony i bezczynny, ale INTERAKTYWNY — bez `dropZone`, więc
      // przedmiot upuszczony tutaj wraca na miejsce, a tapnięcie mówi DLACZEGO.
      const dim = this.scene.add.rectangle(x, y, size, cellH, 0x000000, 0.5);
      root.add(dim);
      box.setInteractive({ useHandCursor: false });
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        this.flash(`${cell.label} — ${cell.pending ?? "jeszcze niedostępny"}`, UI.muted);
      });
      this.equipCells.push({ cell, box, glyph, icon, pips, cellH });
      return;
    }

    box.setInteractive({ useHandCursor: true, dropZone: true });

    if (cell.kind === "quick") {
      box.setData("quickCell", true);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        // Slot użytkowy nie trzyma przedmiotu, tylko PRZYPISANIE, więc odpina,
        // a nie oddaje.
        if (Inventory.quickSlot) Inventory.setQuickSlot(null);
        else this.flash(`${cell.label} — przeciągnij tu miksturę`, UI.muted);
      });
      this.quickCell = { icon, box, glyph };
      this.equipCells.push({ cell, box, glyph, icon, pips, cellH });
      return;
    }

    // ⚠⚠ **Adres liczony przy KAŻDYM użyciu** (`addressOf`): ręka zależy od
    // pokazywanego zestawu, obszar warstwowy od przełącznika warstw i od tego,
    // co jest zajęte. Zamrożony przy budowie wskazywałby slot, którego kafel
    // już nie pokazuje.
    const w: EquipCellWidget = { cell, box, glyph, icon, pips, cellH };
    w.slot = this.addressOf(cell) ?? undefined;
    box.setData("equipSlot", w.slot);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const adres = this.addressOf(cell);
      if (adres) this.toggleDollSelection(adres);
    });
    const showTip = () => {
      const adres = this.addressOf(cell);
      this.previewCard(adres ? Equipment[adres] : null);
    };
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, showTip);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.previewCard(null));

    // Zasłona drugiej ręki — pyta o zestaw, który kafel POKAZUJE: dwuręczny
    // topór schowany w zestawie II nie może gasić tarczy trzymanej w rękach.
    if (cell.hand === "off") {
      const veil = this.scene.add.rectangle(x, y, size, cellH, 0x000000, 0.55).setVisible(false);
      root.add(veil);
      w.veil = veil;
    }
    this.equipCells.push(w);
  }

  /**
   * Recolour equip-slot borders to spotlight `target` (or clear the spotlight).
   * `usable: false` spotlights in red instead of cyan — the preview then also
   * answers "can I actually wear this?", which is the question a requirement
   * gate creates.
   */
  private highlightSlot(target: DollTarget | null, usable = true): void {
    for (const w of this.equipCells) {
      if (w.cell.kind === "planned") continue;
      const on = w.cell.kind === "quick" ? target === "quick" : w.slot === target;
      // Un-spotlighted slots fall back to their WORKMANSHIP colour, not to the
      // bare frame — otherwise picking an item up would wipe the quality
      // colouring off every other slot until the next equipment change.
      if (on) w.box.setStrokeStyle(2, usable ? 0x66ddff : 0xff6b6b, 1);
      else w.box.setStrokeStyle(2, w.slot ? this.equipFrameColor(w.slot) : EQUIP_FRAME, 1);
    }
  }

  /**
   * ⚠ **`restStroke` odeszło razem z obrazkiem lalki (2026-09-11).** Istniało
   * po to, żeby NIE rysować ramki, gdy krata była już namalowana w
   * `slots.png` — czyli obsługiwało sprzężenie kodu z obrazkiem, którego już
   * nie ma. Dziś kafel rysuje się w całości sam i ramkę ma zawsze.
   */

  /** Border colour for an equip slot at rest: the worn copy's workmanship, or
   *  the plain frame when the slot is empty. */
  private equipFrameColor(slot: GearSlot): number {
    const inst = Equipment[slot];
    return inst ? qualityColor(qualityOf(inst)) : EQUIP_FRAME;
  }

  /** Bag-row equivalent of `highlightSlot` — a separate small function rather
   *  than folding `BagSlot` into `DollTarget`, since a picked-up item is
   *  EITHER a container (bag row) OR equippable gear/a consumable (doll),
   *  never both, so the two never need to light up together. */
  private highlightBagRow(target: BagSlot | null, usable = true): void {
    for (const w of this.bagEquipWidgets) {
      if (w.slot === target) w.box.setStrokeStyle(2, usable ? 0x66ddff : 0xff6b6b, 1);
      else w.box.setStrokeStyle(2, this.bagEquipFrameColor(w.slot), 1);
    }
  }

  /** Border colour for a bag-row cell at rest: the worn bag's workmanship, or
   *  the plain frame when empty — mirrors `equipFrameColor`. */
  private bagEquipFrameColor(slot: BagSlot): number {
    const inst = Equipment[slot];
    return inst ? qualityColor(qualityOf(inst)) : EQUIP_FRAME;
  }

  /**
   * Which doll cell an item is aimed at — the one place that answers it for
   * both gear and consumables.
   *
   * `Equipment.slotForItem` returns null for a potion, which was correct while
   * the only targets were equip slots; the doll now has a cell a potion DOES
   * belong in, so the question is bigger than Equipment and is answered here.
   */
  private dollTargetFor(itemId: ItemId): DollTarget | null {
    if (getItem(itemId).type === "consumable") return "quick";
    return Equipment.slotForItem(itemId);
  }

  /**
   * Single click. For gear this previews the equip slot it would go to; for a
   * consumable there is nothing to preview (no equip slot), so that gesture was
   * dead — it now binds the item to the HUD quick-action slot instead. No
   * existing interaction was displaced.
   */
  /*
   * ⚠ `cardAnchor` zniknął w etapie D (2026-10-13): karta PRZEDMIOTU nie jest
   * już dymkiem przypinanym w punkcie ekranu z doklejanym rzędem przycisków,
   * tylko STAŁĄ kolumną strony (`ShopDetails`, `showItemCard`) z akcjami
   * przyklejonymi do dołu.
   */

  // ⚠ `showCardAction`/`hideCardAction` (przyciski pod DYMKIEM) zniknęły
  //   w etapie F (2026-10-13) razem z ostatnim klientem — kartą umiejętności,
  //   dziś kolumną `ListDetail` z rzędem kafli paska.

  /** Tapnięcie komórki lalki: pokaż kartę i przycisk „Zdejmij", zamiast
   *  zdejmować od razu. */
  private toggleDollSelection(slot: GearSlot): void {
    if (this.selectedDollSlot === slot) {
      this.clearBagSelection();
      return;
    }
    const inst = Equipment[slot];
    if (!inst) {
      this.clearBagSelection();
      // ⚠ Pusty kafel MÓWI, co w nim stoi. Glif jest podpowiedzią, nie nazwą,
      // a martwy kwadrat, który na dotknięcie nie robi nic, czyta się jak
      // zepsute UI — ta sama reguła, co przy kaflach `planned`.
      const label =
        DOLL_CELLS.find(
          (c) =>
            c.slot === slot ||
            (c.area && slot.startsWith(c.area + "_")) ||
            (c.hand && (handSlot(c.hand, 1) === slot || handSlot(c.hand, 2) === slot)),
        )?.label ?? slot;
      // ⭐ **Najpierw slot, potem przedmiot** (2026-10-12; Genshin „Switch",
      // Diablo III na konsoli): pusty kafel odpowiada na pytanie „co tu
      // pasuje?" — plecak przełącza się na zakładkę tego slotu. Na dotyku to
      // jedyna droga bez przeciągania, a gracz nie musi wiedzieć, w której
      // kategorii szukać. ⚠ Tylko PUSTY slot: tapnięcie zajętego pokazuje
      // kartę noszonej rzeczy i nie rusza filtra, który gracz ustawił sam.
      const cat = categoryOfSlot(slot);
      if (cat && this.bagStrip?.select(cat)) {
        this.flash(`${label} — pasujące rzeczy z plecaka`, UI.muted);
        return;
      }
      this.flash(
        slotHasItems(slot) ? `${label} — w plecaku nic tu nie pasuje` : `${label} — brak takich przedmiotów`,
        UI.muted,
      );
      return;
    }
    this.clearBagSelection();
    this.selectedDollSlot = slot;
    // ⭐ Przepływ „od slotu" (research §6.2): karta noszonej rzeczy + plecak
    // PODŚWIETLA to, co tu pasuje (`markSelectedCell`). ⚠ Podświetla, nie
    // filtruje — filtr ustawiony przez gracza zostaje (reguła z 2026-10-12).
    this.markSelectedCell();
    this.showItemCard(inst, [
      {
        label: "Zdejmij",
        onClick: () => {
      const s = this.selectedDollSlot;
      if (!s) return;
      // ⚠ `unequip` odmawia przy pełnym plecaku i to jest jedyny powód, dla
      // którego może się nie udać — powiedz to, zamiast nic nie robić.
      if (!Equipment.unequip(s)) {
        this.flash("Plecak pełny — nie ma gdzie tego odłożyć", "#ff9d3b");
        return;
      }
          this.clearBagSelection();
        },
      },
    ]);
  }

  /** Tapnięcie kafla: zaznacz, albo odznacz, jeśli to ten sam. */
  private toggleBagSelection(rawIndex: number): void {
    // ⚠⚠ **Sprowadzenie do KOTWICY, i to jest naprawa zgłoszonego błędu.**
    //   Tapnięcie dolnej połowy tarczy `1×2` trafiało w pole, w którym
    //   `slots[i]` jest `null` — czyli **odznaczało przedmiot** zamiast go
    //   wybrać. Reguła: *tapnięcie dowolnej części gabarytu wskazuje ten sam
    //   przedmiot*. Ta sama metoda, którą posługuje się przeciąganie i
    //   `markSelectedCell`.
    const index = this.bagAnchor(rawIndex);
    if (this.selectedBagIndex === index) {
      this.clearBagSelection();
      return;
    }
    const slot = Inventory.slots[index];
    if (!slot) {
      this.clearBagSelection();
      return;
    }
    this.selectedDollSlot = null;
    this.selectedBagEquipSlot = null;
    this.selectedBagIndex = index;
    // Podświetlenie slotu docelowego zostaje bez zmian — mówi „to by tu poszło",
    // czyli coś innego niż karta, i obie informacje są przydatne naraz.
    this.previewSlot(index);
    this.markSelectedCell();
    this.showItemCard(slot, this.bagActionsFor(index, slot));
  }

  /**
   * Co da sie zrobic z zaznaczona rzecza. Zastepuje podwojne tapniecie:
   * gest byl niewidoczny (nic nie mowilo, ze przedmiot da sie zalozyc) i
   * kosztowal ujednoznacznianie czasem.
   *
   * Surowiec nie dostaje zadnego przycisku i to jest informacja: pasek
   * pusty znaczy "z tym nic tu nie zrobisz", a nie "cos sie nie wczytalo".
   */
  private bagActionsFor(index: number, slot: InventorySlot): CardAction[] {
    const def = getItem(slot.itemId);
    if (def.type === "consumable") {
      return [
        {
          label: "Uzyj",
          // Odmowa przy pelnym zdrowiu jest juz w `useSlot` i nazywa powod.
          onClick: () => this.useSlot(index),
        },
        {
          label: Inventory.quickSlot === slot.itemId ? "Juz na Q" : "Przypisz do Q",
          disabled: Inventory.quickSlot === slot.itemId,
          onClick: () => {
            Inventory.setQuickSlot(slot.itemId);
            this.highlightSlot("quick");
            this.flash(`Przypisano do Q: ${def.name}`, "#88ddff");
            this.refreshSelectionCard();
          },
        },
      ];
    }
    if (
      def.type === "weapon" ||
      def.type === "armor" ||
      def.type === "ring" ||
      def.type === "amulet"
    ) {
      const unmet = Equipment.unmetRequirements(slot.itemId);
      if (unmet.length > 0) {
        return [
          {
            // Wymaganie widac NA przycisku, a nie dopiero po nacisnieciu —
            // wyszarzony przycisk z powodem jest informacja, brak przycisku nie.
            label: `Wymaga: ${unmet.map(describeRequirement).join(", ")}`,
            disabled: true,
            onClick: () => this.useSlot(index),
          },
        ];
      }
      // ⭐ **Gdy rzecz ma DWA sensowne miejsca, karta pyta o miejsce** (autor
      // 2026-10-12: „przycisk Załóż działa tylko dla jednej broni"). Do tej
      // daty „Załóż" broni szło zawsze do zestawu I (`slotForItem` → `weapon`),
      // a pierścienia przy dwóch zajętych — zawsze na pierwszy palec; drugi
      // zestaw dawało się zbudować wyłącznie przeciąganiem, o którym karta nie
      // mówi. Wzór z konsolowych portów ARPG (Diablo IV, D2R): przycisk niesie
      // CEL, a odmowę nazywa ta sama ścieżka co upuszczenie na kafel lalki.
      const targets = this.equipTargetsFor(slot.itemId);
      if (targets.length > 1) {
        return targets.map((t) => ({
          label: t.label,
          onClick: () => this.dropOntoEquipSlot(index, t.slot),
        }));
      }
      return [{ label: "Załóż", onClick: () => this.useSlot(index) }];
    }
    if (def.type === "container") {
      return [{ label: "Załóż", onClick: () => this.useSlot(index) }];
    }
    return [];
  }

  /**
   * Miejsca, między którymi gracz MA wybór — tylko wtedy, gdy wybór jest
   * prawdziwy. Broń i tarcza: zestaw I albo II (oba zawsze, bo tak się
   * buduje drugi zestaw). Pierścień: tylko przy dwóch zajętych palcach —
   * przy wolnym `slotForItem` i tak trafia w wolny, a pytanie byłoby szumem.
   *
   * ⚠ Druga ręka dla broni jednoręcznej (Dual Wield) NIE jest tu trzecią
   * opcją: to prototyp (`Equipment.accepts`), a trzy przyciski pod kartą
   * na telefonie zjadają wysokość porównania. Zostaje przeciągnięcie.
   */
  private equipTargetsFor(itemId: ItemId): { slot: GearSlot; label: string }[] {
    const def = getItem(itemId);
    if (def.type === "weapon") {
      return [
        { slot: "weapon", label: "Załóż · Zestaw I" },
        { slot: "weapon2", label: "Załóż · Zestaw II" },
      ];
    }
    if (def.type === "armor" && def.slot === "offhand") {
      return [
        { slot: "offhand", label: "Załóż · Zestaw I" },
        { slot: "offhand2", label: "Załóż · Zestaw II" },
      ];
    }
    if (def.type === "ring" && Equipment.ring1 && Equipment.ring2) {
      return [
        { slot: "ring1", label: "Zamień · pierścień I" },
        { slot: "ring2", label: "Zamień · pierścień II" },
      ];
    }
    return [];
  }

  private clearBagSelection(): void {
    this.selectedBagIndex = null;
    this.selectedDollSlot = null;
    this.selectedBagEquipSlot = null;
    this.highlightSlot(null);
    this.highlightBagRow(null);
    this.markSelectedCell();
    // Karta zeszła — statystyki wracają na jej miejsce.
    this.refreshDetails();
  }

  /** Ramka na zaznaczonym kaflu — bez niej karta opisywałaby przedmiot, o
   *  którym nie wiadomo, który to. */
  private markSelectedCell(): void {
    const dollSlot = this.selectedDollSlot;
    for (let i = 0; i < this.slotBoxes.length; i++) {
      // ⚠⚠ **Ramka obejmuje CAŁE PRZYKRYCIE, nie samą kotwicę.** Zgłoszone
      //   z gry przy pierwszych przedmiotach `1×2`: tarcza zajmowała dwa pola,
      //   a złota ramka zaznaczenia świeciła tylko na górnym — czyli UI mówiło
      //   „wybrałeś pół przedmiotu". `bagAnchor` sprowadza pole do kotwicy tą
      //   samą metodą, co przeciąganie i `takeAt`, więc pytanie jest jedno dla
      //   całego panelu. ⛔ Nie licz tu przykrycia drugi raz z `itemFootprint`.
      const on = this.selectedBagIndex !== null && this.bagAnchor(i) === this.selectedBagIndex;
      const sl = Inventory.slots[i];
      // ⭐ Przepływ „od slotu" (etap D): wybrany kafel lalki podświetla w plecaku
      //   to, co do niego pasuje — cyjan, jak przy podniesieniu przedmiotu.
      const fits = !on && dollSlot !== null && !!sl && this.fitsDollSlot(dollSlot, sl.itemId);
      // ⚠ Spoczynek = KOLOR JAKOŚCI zajętego pola, nie gołej ramki — inaczej
      //   każde zaznaczenie zmywało jakość z całej siatki do najbliższego
      //   przemalunku plecaka.
      const base = sl ? qualityColor(qualityOf(sl)) : BAG_FRAME;
      this.slotBoxes[i].setStrokeStyle(on || fits ? 3 : 2, on ? UI.goldNum : fits ? 0x66ddff : base, 1);
    }
    for (const w of this.equipCells) {
      if (w.cell.kind !== "gear" || !w.slot) continue;
      const on = dollSlot !== null && w.slot === dollSlot;
      w.box.setStrokeStyle(on ? 3 : 2, on ? UI.goldNum : this.equipFrameColor(w.slot), 1);
    }
    for (const w of this.bagEquipWidgets) {
      const on = w.slot === this.selectedBagEquipSlot;
      w.box.setStrokeStyle(on ? 3 : 2, on ? UI.goldNum : this.bagEquipFrameColor(w.slot), 1);
    }
  }

  /**
   * Czy rzecz z plecaka pasuje do slotu lalki. ⚠ Dla obszaru warstwowego
   * pytamy o OBSZAR, nie o pokazywany adres: warstwa jest wyprowadzana
   * z przedmiotu, nigdy wybierana, więc przy torsie pasuje każda zbroja torsu.
   */
  private fitsDollSlot(slot: GearSlot, itemId: ItemId): boolean {
    const m = /^(.*)_L\d$/.exec(slot);
    if (m) return Equipment.slotForItem(itemId)?.startsWith(m[1] + "_") ?? false;
    return Equipment.accepts(slot, itemId);
  }

  /**
   * Adres, na który upuszczenie NAPRAWDĘ trafia. ⚠ Kafel obszaru warstwowego
   * pokazuje jedną warstwę, ale przedmiot ma własną — kirys upuszczony na tors
   * pokazujący „Spód" idzie na swoją warstwę, a nie dostaje odmowy „to nie ten
   * slot". Adres z kafla zostaje tylko wtedy, gdy przedmiot nie należy do tego
   * obszaru (wtedy odmowę nazwie `dropOntoEquipSlot`).
   */
  private dropTargetFor(from: number, zoneSlot: GearSlot): GearSlot {
    const sl = Inventory.slots[from];
    const m = /^(.*)_L\d$/.exec(zoneSlot);
    if (!sl || !m) return zoneSlot;
    const own = Equipment.slotForItem(sl.itemId);
    return own && own.startsWith(m[1] + "_") ? own : zoneSlot;
  }

  /** Tapnięcie komórki torby: pokaż kartę i przycisk „Zdejmij", ten sam wzorzec
   *  co `toggleDollSelection`. */
  private toggleBagEquipSelection(slot: BagSlot): void {
    if (this.selectedBagEquipSlot === slot) {
      this.clearBagSelection();
      return;
    }
    const inst = Equipment[slot];
    if (!inst) {
      this.clearBagSelection();
      return;
    }
    this.clearBagSelection();
    this.selectedBagEquipSlot = slot;
    this.markSelectedCell();
    this.showItemCard(inst, [
      {
        label: "Zdejmij",
        onClick: () => {
          const s = this.selectedBagEquipSlot;
          if (!s) return;
          const refusal = Equipment.bagUnequipRefusal(s);
          if (refusal) {
            this.flash(describeBagUnequipRefusal(refusal), "#ff9d3b");
            return;
          }
          Equipment.unequipBag(s);
          this.clearBagSelection();
        },
      },
    ]);
  }

  /**
   * Karta opisuje KONKRETNY egzemplarz (jakość, zużycie), więc po każdej
   * zmianie plecaka trzeba ją odświeżyć albo zamknąć — inaczej po wypiciu
   * mikstury zostałaby karta rzeczy, której już nie ma.
   */
  private refreshSelectionCard(): void {
    if (this.selectedDollSlot !== null) {
      // Noszona rzecz mogła zejść (zamiana zestawu, zdjęcie z innej drogi).
      if (!Equipment[this.selectedDollSlot]) this.clearBagSelection();
      return;
    }
    if (this.selectedBagIndex === null) {
      this.refreshDetails();
      return;
    }
    const slot = Inventory.slots[this.selectedBagIndex];
    if (!slot) {
      this.clearBagSelection();
      return;
    }
    // ⚠ Karta i jej akcje idą RAZEM — po zmianie przedmiotu w slocie
    // (wypicie, zużycie) karta opisuje nowy stan, a nie poprzedni.
    this.showItemCard(slot, this.bagActionsFor(this.selectedBagIndex, slot));
  }

  private previewSlot(index: number): void {
    const slot = Inventory.slots[index];
    if (!slot) {
      this.highlightSlot(null);
      return;
    }
    if (getItem(slot.itemId).type === "consumable") {
      // Tylko podswietlenie. Wczesniej to tapniecie SAMO przypisywalo
      // mikstura do Q — czyli gest "obejrzyj" mial skutek uboczny, o ktory
      // nikt nie prosil. Przypisanie ma teraz wlasny przycisk pod karta.
      this.highlightSlot("quick");
      return;
    }
    if (getItem(slot.itemId).type === "container") {
      this.highlightBagRow(Equipment.bagSlotFor(slot.itemId));
      return;
    }
    this.highlightSlot(this.dollTargetFor(slot.itemId), Equipment.canEquipInstance(slot));
  }

  /** One-line notice floated over the panel — used for actions that change
   *  something outside the panel, or refusals that would otherwise be silent. */
  private flash(text: string, color: string): void {
    floatingText(this.scene, {
      // Środek PANELU, nie ekranu (panel stoi w ramie na lewo od szyny).
      x: this.container.x,
      y: this.container.y - 40,
      text,
      color,
      depth: 1500,
    });
  }

  /**
   * Grid-cell centre for backpack slot `index`, LOCAL to `bagGridList` — the
   * list itself carries `gridLeft`/`columnsTop` and the scroll offset, so a
   * cell's position within it never changes, only the list's own `y`. Also
   * where a dragged icon snaps back to.
   */
  private bagSlotXY(index: number): { x: number; y: number } {
    // Widok filtrowany: rzecz stoi tam, gdzie ją dosunął `computeBagView`.
    const v = this.bagView?.get(index);
    if (v) {
      return {
        x: this.cell / 2 + v.col * (this.cell + this.gap),
        y: this.cell / 2 + v.row * (this.cell + this.gap),
      };
    }
    return {
      x: this.cell / 2 + (index % this.cols) * (this.cell + this.gap),
      y: this.cell / 2 + Math.floor(index / this.cols) * (this.cell + this.gap),
    };
  }

  /** Środek POLA, czyli całego przykrycia — nie kafla kotwicy. */
  private bagFieldXY(index: number, fp: { w: number; h: number }): { x: number; y: number } {
    const { x, y } = this.bagSlotXY(index);
    return {
      x: x + ((fp.w - 1) * (this.cell + this.gap)) / 2,
      y: y + ((fp.h - 1) * (this.cell + this.gap)) / 2,
    };
  }

  /**
   * ⭐⭐ **POLE PRZEDMIOTU: jeden prostokąt na jeden przedmiot.**
   *
   * Kafel kotwicy rozciąga się na całe przykrycie; kafle przykryte chowają
   * własne ramki (patrz `refreshInventory`). ⛔ Nie wracaj do dwóch ramek —
   * przy przedmiocie z ikoną 32×32 i gabarytem `1×2` czytały się jak
   * „przedmiot + pusty slot obok".
   */
  private paintBagField(index: number, fp: { w: number; h: number }): void {
    const box = this.slotBoxes[index];
    if (!box) return;
    const { x, y } = this.bagFieldXY(index, fp);
    const w = fp.w * this.cell + (fp.w - 1) * this.gap;
    const h = fp.h * this.cell + (fp.h - 1) * this.gap;
    box.setPosition(x, y).setSize(w, h).setVisible(true);
    // ⚠ Pasek zużycia trzyma się DOLNEJ krawędzi POLA, nie kafla kotwicy —
    //   inaczej przy gabarycie `1×2` wisiałby w połowie przedmiotu.
    const wear = this.slotWear[index];
    if (wear) {
      wear.setPosition(x - w / 2 + 3, y + h / 2 - 4);
      wear.width = Math.max(1, w - 6);
    }
  }

  /**
   * Pole trafienia ikony = całe przykrycie.
   *
   * ⚠ Prostokąt podaje się w układzie LOKALNYM klatki (piksele tekstury),
   * stąd dzielenie przez skalę. ⚠ `setInteractive` buduje nowy obiekt
   * wejścia, więc `setDraggable` trzeba nałożyć PONOWNIE.
   */
  private fitBagHitArea(icon: Phaser.GameObjects.Image, fp: { w: number; h: number }): void {
    const sc = icon.scale || 1;
    const fw = icon.frame?.width ?? 32;
    const fh = icon.frame?.height ?? 32;
    const w = (fp.w * this.cell + (fp.w - 1) * this.gap) / sc;
    const h = (fp.h * this.cell + (fp.h - 1) * this.gap) / sc;
    const ksztalt = new Phaser.Geom.Rectangle((fw - w) / 2, (fh - h) / 2, w, h);
    // ⚠⚠ **ANI `setInteractive(kształt)`, ANI `input.setHitArea` NIE PODMIENIĄ
    //   kształtu obiektowi, który JUŻ MA WEJŚCIE.** Obie drogi kończą się
    //   w Phaserze na `if (!gameObject.input) …` i przy istniejącym wejściu
    //   ustawiają wyłącznie `dropZone` / `customHitArea`, **po cichu
    //   zostawiając prostokąt KLATKI**. Zmierzone: po obu wywołaniach
    //   `hitArea` dalej 32×64 zamiast 35×74 — a objawem była „martwa dolna
    //   połowa tarczy", czyli dokładnie ta usterka, którą to miało naprawić.
    //   ⭐ Jedyna droga, która działa na żywym obiekcie: podmiana pól wprost.
    if (!icon.input) {
      icon.setInteractive(ksztalt, Phaser.Geom.Rectangle.Contains);
    } else {
      icon.input.hitArea = ksztalt;
      icon.input.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
      // `customHitArea` broni kształtu przed zresetowaniem przy `setTexture`.
      icon.input.customHitArea = true;
    }
    this.scene.input.setDraggable(icon);
  }

  /**
   * The bag row under the doll — one cell per `BagSlot`. Tap-to-select +
   * "Zdejmij" button, same pattern as a doll cell (`toggleDollSelection`);
   * dragging a container from the backpack onto a cell equips it
   * (`dropOntoBagEquipSlot`).
   */
  private buildBagSlots(): void {
    // ⭐ Etap D (2026-10-13): torby stoją POD SIATKĄ plecaka, w pełnej normie
    // dotyku (research §6.1). Do tej daty siedziały pod lalką w kaflach 40 j.
    // (≈ 28 CSS px) — najmniejsze cele w całym panelu, i to przy rzeczy, która
    // decyduje o pojemności plecaka.
    const row = this.inv.bag.bagRow;
    const size = row.h;
    const gap = this.gap;
    const count = BAG_SLOTS.length;
    const y = row.y + size / 2;

    for (let i = 0; i < count; i++) {
      const slot = BAG_SLOTS[i];
      const x = row.x + size / 2 + i * (size + gap);
      const box = this.scene.add
        .rectangle(x, y, size, size, UI.slotBg, 1)
        .setStrokeStyle(2, EQUIP_FRAME, 1)
        .setInteractive({ useHandCursor: true, dropZone: true })
        .setData("bagEquipSlot", slot);
      this.inventoryPage.add(box);

      // Glif torby, dopóki slot jest pusty — pusty kafel mówi, CO tu wchodzi.
      // ⚠ Rysowany (`UiIcons`), bo `slotGlyphs` nie ma klatki torby.
      const glyph = drawUiIcon(this.scene.add.graphics({ x, y }), "bag", size * 0.5, 0x4a5063, UI.slotBg);
      this.inventoryPage.add(glyph);
      // Skala CAŁKOWITA ×2 (32 px → 64 j. w kaflu 68): ułamkowa rozmywa pixel-art.
      const icon = this.scene.add.image(x, y, "").setScale(2).setVisible(false);
      this.inventoryPage.add(icon);

      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        this.toggleBagEquipSelection(slot);
      });
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.previewCard(Equipment[slot]));
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.previewCard(null));

      this.bagEquipWidgets.push({ slot, icon, box, glyph });
    }
  }

  /**
   * Build all `gridMaxSlots` (48) cells once — beyond-capacity and
   * beyond-window cells are toggled by `syncSlotIO`/`refreshInventory`, never
   * rebuilt. Cells live in `bagGridList`, a sub-container clipped to the
   * fixed 4-row window (`refreshGridMask`, called from `reposition()`) and
   * scrolled by moving its own `y` (`setGridScroll`) — the window itself
   * never moves.
   */
  private buildGrid(): void {
    this.bagGridList = this.scene.add.container(this.gridLeft, this.gridTop);
    this.inventoryPage.add(this.bagGridList);

    for (let i = 0; i < this.gridMaxSlots; i++) {
      const { x, y } = this.bagSlotXY(i);

      // The slot frame doubles as the drop target for manual reordering.
      // Phaser only hit-tests `dropZone` objects when resolving a drop, so the
      // draggable icons sitting on top of these never shadow them.
      const box = this.scene.add
        .rectangle(x, y, this.cell, this.cell, UI.slotBg, 1)
        .setStrokeStyle(2, BAG_FRAME, 1)
        .setInteractive({ useHandCursor: true, dropZone: true })
        .setData("bagIndex", i);
      this.bagGridList.add(box);
      this.slotBoxes.push(box);

      const icon = this.scene.add
        .image(x, y, "")
        .setVisible(false)
        .setScale(this.iconScale)
        .setInteractive({ useHandCursor: true })
        .setData("bagIndex", i);
      // ⚠ Draggable PERMANENTLY (not toggled per-gesture) — Phaser decides
      // whether a press counts as a drag candidate at POINTERDOWN time
      // (`processDragDownEvent`, before any of our own handlers run), so
      // flipping `draggable` on later in response to a long-press timer is a
      // no-op for the press already in progress. See `onBagDragStart` for how
      // the long-press delay is actually enforced instead.
      this.scene.input.setDraggable(icon);
      icon.input!.enabled = false; // empty slot — nothing to pick up yet
      this.bagGridList.add(icon);
      this.slotIcons.push(icon);

      const count = this.scene.add
        .text(
          x + this.cell / 2 - 4,
          y + this.cell / 2 - 4,
          "",
          textStyle({ fontSize: fontPx("small"), color: UI.white, fontStyle: "bold", stroke: "#000000", strokeThickness: 3 }),
        )
        .setOrigin(1);
      this.bagGridList.add(count);
      this.slotCounts.push(count);

      // Wear bar, hugging the bottom edge of the cell. Origin on the left so
      // draining it shortens it rightwards, same as every other bar here.
      const wear = this.scene.add
        .rectangle(x - this.cell / 2 + 3, y + this.cell / 2 - 4, this.cell - 6, 3, 0x33dd55, 1)
        .setOrigin(0, 0.5)
        .setVisible(false);
      this.bagGridList.add(wear);
      this.slotWear.push(wear);

      // Both the frame and the icon carry the same handlers. Phaser delivers a
      // pointer event to the topmost hit object only (`topOnly`, on by
      // default), so exactly one of the two fires: the icon on a filled slot,
      // the frame on an empty one.
      this.attachSlotInput(box, i);
      this.attachSlotInput(icon, i);
    }

    // ⚠⚠ **IKONY NAD WSZYSTKIMI RAMKAMI — naprawa z RENDERU, nie z liczb.**
    // Kafle powstają po kolei (ramka → ikona → licznik), więc ramka pola 7
    // ląduje na liście wyświetlania PÓŹNIEJ niż ikona pola 3 — i przykrywa ją.
    // Przy gabarycie `1×1` nie miało to znaczenia, bo ikona nie wychodziła poza
    // swój kafel. Od chwili, w której tarcza migdałowa zajęła dwa pola, jej
    // dolna połowa znikała pod tłem pola poniżej: w silniku widać było SAME
    // GÓRNE POŁOWY trzech dużych tarcz, przy wszystkich asercjach na zielono.
    // ⛔ Nie „rozwiązuj" tego przezroczystym tłem kafla — pusty kafel ma być
    //    widoczny, a kolejność i tak wróciłaby przy następnym elemencie.
    for (const ic of this.slotIcons) this.bagGridList.bringToTop(ic);
    for (const ct of this.slotCounts) this.bagGridList.bringToTop(ct);
    for (const wr of this.slotWear) this.bagGridList.bringToTop(wr);

    // Clipped to the fixed 4-row window — same pattern as the quest journal's
    // mask, restricted to the grid's own rectangle so the doll and card
    // columns are never clipped by it.
    this.gridMaskG = this.scene.make.graphics({}, false);
    this.bagGridList.setMask(new Phaser.Display.Masks.GeometryMask(this.scene, this.gridMaskG));

    const barX = this.gridLeft + this.gridW + 5;
    this.gridScrollTrack = this.scene.add
      .rectangle(barX, this.gridTop + this.columnH / 2, 4, this.columnH, 0xffffff, 0.08)
      .setVisible(false);
    this.gridScrollThumb = this.scene.add
      .rectangle(barX, this.gridTop, 4, 40, UI.goldNum, 0.7)
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.inventoryPage.add([this.gridScrollTrack, this.gridScrollThumb]);

    this.syncSlotIO();
  }

  /**
   * Click/hover behaviour for one backpack slot, plus starting the
   * tap/long-press-drag/scroll gesture (`beginGridGesture` — the rest of the
   * state machine is scene-level, see `onGridPointerMove`/`onGridPointerUp`).
   *
   * ⚠ No tap-on-pointerup here anymore: a tap is now resolved by the gesture
   * state machine (PENDING, or `scrolling` with no real movement → tap).
   */
  private attachSlotInput(
    target: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image,
    index: number,
  ): void {
    target.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.beginGridGesture(p, index);
    });

    // ⚠ Podgląd na OVER, nie na MOVE: karta w kolumnie przebudowuje się
    // w całości, a MOVE leci przy każdym pikselu ruchu myszy.
    // ⚠ Zgaszenie podglądu NIE gasi karty wybranej (`previewCard` sprawdza
    // zaznaczenie) — inaczej zaznaczenie działałoby wyłącznie na dotyku.
    target.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      this.previewCard(Inventory.at(this.bagAnchor(index)));
    });
    target.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.previewCard(null));
  }

  /* ── Scroll / tap / long-press-drag gesture (docs/inventory_scroll_ux.md §5) ─
   *
   * PENDING (filled cell) → DRAGGING (Phaser's own `dragTimeThreshold` elapses
   * without us aborting it, see below) or SCROLLING (moved past HOLD_SLOP
   * before that) or TAP (released within TAP_SLOP). Empty cell skips straight
   * to SCROLLING — see `beginGridGesture`. Only one gesture at a time (budget:
   * two touch pointers total, and this machine tracks the one that started it).
   *
   * ⚠ **The long press is enforced by Phaser itself, not by a timer of ours.**
   * `scene.input.dragTimeThreshold` (set once, in the constructor) delays
   * every native DRAG_START in this scene by `LONG_PRESS_MS` — the *only*
   * mechanism that can do this job, because Phaser decides whether a press is
   * a drag candidate at POINTERDOWN time (`processDragDownEvent`, before any
   * handler of ours runs); an icon that isn't already `draggable` by then can
   * never become one for that press, no matter when we flip the flag
   * afterwards. That was the bug: a `delayedCall`-armed `setDraggable` was
   * always too late, so drag never started. Icons are draggable permanently
   * now (`buildGrid`) and Phaser's own threshold supplies the delay.
   *
   * ⚠ **That threshold is TIME-only** (`dragDistanceThreshold` stays at its
   * default 0, i.e. disabled) — Phaser would otherwise start a native drag
   * at the 300ms mark regardless of how far the pointer had travelled by
   * then, which would hijack an obvious scroll the instant the clock ran
   * out. `onGridPointerMove`'s PENDING branch pre-empts that itself: once our
   * own HOLD_SLOP is crossed, we call `scene.input.setDragState(pointer, 0)`
   * to cancel Phaser's candidacy outright, so the delayed DRAG_START never
   * fires for that press.
   */

  private beginGridGesture(p: Phaser.Input.Pointer, index: number): void {
    if (this.gridGestureState !== "idle") return;
    this.gridGestureIndex = index;
    this.gridGesturePointerId = p.id;
    this.gridPressX = p.x / uiScale();
    this.gridPressY = p.y / uiScale();
    this.gridDragDist = 0;
    // Pusty kafel nie czeka — chwyt za puste miejsce przewija natychmiast.
    // (Nie ma tam nic draggable, więc Phaser i tak nie zbudowałby kandydata.)
    this.gridGestureState = Inventory.at(this.bagAnchor(index)) ? "pending" : "scrolling";
  }

  private onGridPointerMove(p: Phaser.Input.Pointer): void {
    if (this.gridGestureState === "idle" || p.id !== this.gridGesturePointerId) return;
    const x = p.x / uiScale();
    const y = p.y / uiScale();

    if (this.gridGestureState === "pending") {
      const dist = Phaser.Math.Distance.Between(this.gridPressX, this.gridPressY, x, y);
      if (dist > this.HOLD_SLOP) {
        // Ruch przed progiem — anuluj Phaserowego kandydata na drag (inaczej
        // odpaliłby DRAG_START na własną rękę, gdy tylko minie 300 ms, mimo
        // że to już jest przewijanie) i wejdź w przewijanie.
        this.scene.input.setDragState(p, 0);
        this.gridGestureState = "scrolling";
        this.gridPressY = y;
      }
      return;
    }
    if (this.gridGestureState === "scrolling") {
      const dy = y - this.gridPressY;
      this.gridDragDist += Math.abs(dy);
      this.setGridScroll(this.gridScroll - dy);
      this.gridPressY = y;
    }
    // "dragging": Phaser's native DRAG event already moves the icon
    // (onBagDrag) and runs auto-scroll (tickGridAutoScroll) — nothing here.
  }

  private onGridPointerUp(p: Phaser.Input.Pointer): void {
    if (this.gridGestureState === "idle" || p.id !== this.gridGesturePointerId) return;
    const state = this.gridGestureState;
    const index = this.gridGestureIndex;
    this.gridGestureState = "idle";
    this.gridGestureIndex = null;
    this.gridGesturePointerId = -1;

    if (state === "pending" && index !== null) {
      // Native DRAG_START never fired (either under 300ms, or held past it
      // without moving again — see the header comment) — a tap only if the
      // FINAL position is still within TAP_SLOP.
      const x = p.x / uiScale();
      const y = p.y / uiScale();
      const dist = Phaser.Math.Distance.Between(this.gridPressX, this.gridPressY, x, y);
      if (dist <= this.TAP_SLOP) this.toggleBagSelection(index);
    } else if (state === "scrolling" && index !== null && this.gridDragDist <= this.TAP_SLOP) {
      // Barely moved — a tap on an empty cell (clears selection, see
      // toggleBagSelection's own null-slot branch).
      this.toggleBagSelection(index);
    }
    // "dragging" resolves through onBagDragEnd (Phaser's own DRAG_END),
    // never through this handler.
  }

  /** Undo the lifted look `onBagDragStart` applies — called when a native
   *  drag ends (`onBagDragEnd`), success or not. */
  private resetArmedDragVisual(index: number): void {
    this.slotIcons[index]?.setScale(this.iconScale);
    this.slotBoxes[index]?.setAlpha(1);
  }

  /* ── Grid scrolling ──────────────────────────────────────────────────── */

  /** Rows the current capacity needs, times the row pitch — the content
   *  height `setGridScroll` clamps against. */
  private gridContentH(): number {
    const rows = this.bagView ? this.bagViewRows : Math.ceil(Inventory.capacity / this.cols);
    return rows * (this.cell + this.gap) - this.gap;
  }

  /** Is grid row `i` at least partly inside the fixed window right now? Drives
   *  `syncSlotIO` — a cell scrolled out must lose input, since the mask clips
   *  DRAWING but not HIT-TESTING (`docs/inventory_scroll_ux.md` §6). */
  private slotWithinWindow(i: number): boolean {
    const row = this.bagView?.get(i)?.row ?? Math.floor(i / this.cols);
    const top = row * (this.cell + this.gap) - this.gridScroll;
    return top + this.cell > 0 && top < this.columnH;
  }

  /** Clamp, apply, resize the scrollbar thumb, and resync input — the only
   *  place `bagGridList.y` is written. Mirrors `setQuestScroll`. */
  private setGridScroll(v: number): void {
    const max = Math.max(0, this.gridContentH() - this.columnH);
    this.gridScroll = Phaser.Math.Clamp(v, 0, max);
    this.bagGridList.y = this.gridTop - this.gridScroll;

    const overflows = max > 0;
    this.gridScrollTrack.setVisible(overflows);
    this.gridScrollThumb.setVisible(overflows);
    if (overflows) {
      const thumbH = Math.max(24, (this.columnH / this.gridContentH()) * this.columnH);
      this.gridScrollThumb.height = thumbH;
      this.gridScrollThumb.y = this.gridTop + (this.gridScroll / max) * (this.columnH - thumbH);
    }
    this.syncSlotIO();
  }

  /** Toggle `input.enabled` for every cell beyond capacity or scrolled out of
   *  the window — see `slotWithinWindow`'s doc comment for why this can't be
   *  skipped. Called on scroll, and from `refreshInventory` on capacity
   *  change. Visibility (content-driven) is `refreshInventory`'s job; this is
   *  input only, EXCEPT for the beyond-capacity case, which must not even be
   *  drawn (see the loop in `refreshInventory`). */
  /**
   * **Pole siatki → KOTWICA przedmiotu, który je przykrywa** (gabaryt, 2026-09-18).
   *
   * ⚠⚠ Istnieje, bo od chwili, gdy przedmiot może zająć dwa pola, **dotknięcie
   * nie jest już tożsame z przedmiotem**. Dolna połowa `1×2` ma w `Inventory.
   * slots` wartość `null`, więc każde `Inventory.at(index)` na ścieżce gestu
   * odpowiadałoby „tu nic nie ma" nad kaflem, w którym gracz widzi przedmiot.
   * ⛔ To jest jedyne miejsce, w którym UI tłumaczy pole na przedmiot — nie
   * rozsiewaj tej arytmetyki po handlerach.
   */
  private bagAnchor(index: number): number {
    return Inventory.anchorCovering(index) ?? index;
  }

  private syncSlotIO(): void {
    const capacity = Inventory.capacity;
    for (let i = 0; i < this.gridMaxSlots; i++) {
      const active = i < capacity && this.slotWithinWindow(i);
      const box = this.slotBoxes[i];
      const icon = this.slotIcons[i];
      // ⚠ W widoku filtrowanym pola NIE są strefami upuszczania — przestawianie
      //   tylko w „Wszystko" (patrz `buildBagFilterRow`).
      if (box?.input) box.input.enabled = active && !this.bagView;
      if (icon?.input) icon.input.enabled = active && Inventory.at(i) !== null && (!this.bagView || this.bagView.has(i));
    }
  }

  /* ── Auto-scroll while dragging (docs/inventory_scroll_ux.md §6) ───────── */

  private startGridAutoScroll(): void {
    this.gridAutoScrollTimer?.remove(false);
    this.gridAutoScrollTimer = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => this.tickGridAutoScroll(),
    });
  }

  private stopGridAutoScroll(): void {
    this.gridAutoScrollTimer?.remove(false);
    this.gridAutoScrollTimer = undefined;
  }

  /** Runs every ~16ms while a native drag from the grid is in flight —
   *  a timer, not the DRAG event, because auto-scroll has to keep going even
   *  while the finger holds still at the edge. */
  private tickGridAutoScroll(): void {
    const pointer = this.scene.input.activePointer;
    // Ta sama poprawka na skalę, co w `refreshGridMask` — patrz komentarz tam.
    const s = this.container.scale;
    const windowTop = this.container.y + (this.inventoryPage.y + this.gridTop) * s;
    const localY = (pointer.y / uiScale() - windowTop) / s;
    const band = 40;
    let speed = 0;
    if (localY < band) {
      speed = -Phaser.Math.Linear(2, 6, 1 - Phaser.Math.Clamp(localY, 0, band) / band);
    } else if (localY > this.columnH - band) {
      speed = Phaser.Math.Linear(2, 6, Phaser.Math.Clamp(localY - (this.columnH - band), 0, band) / band);
    }
    if (speed !== 0) this.setGridScroll(this.gridScroll + speed);
  }

  /* ── Manual reordering (drag a slot onto another slot) ────────────────── */

  /**
   * These four run off scene-wide input events, which ShopPanel also listens
   * to. Both sides gate on their own marker data — `bagIndex` here, `side`
   * there — so a drag started in one panel is inert in the other.
   */
  private onBagDragStart(_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject): void {
    if (typeof obj.getData("bagIndex") !== "number") return;
    // This IS the moment the long press won — see the header comment on
    // `beginGridGesture` for why Phaser's own `dragTimeThreshold`, not a
    // timer of ours, is what gated getting here at all.
    this.gridGestureState = "dragging";
    this.startGridAutoScroll();
    this.setGridMaskWide(true);
    obj.setData("wasDragging", true);
    // A Container draws its children in list order, not by depth — bringToTop
    // is what actually lifts the dragged icon above the other slot frames
    // (and, since `bagGridList` is added to the page AFTER the doll and the
    // bag row, above those too).
    this.bagGridList.bringToTop(obj as Phaser.GameObjects.Image);
    // The stack count belongs to the slot, not to the icon in flight.
    const index = obj.getData("bagIndex") as number;
    this.slotCounts[index]?.setVisible(false);
    this.clearBagSelection();

    // Lifted look: bigger icon, dimmed source cell, a tap of haptics —
    // confirms the long press registered, since the finger is covering the
    // icon and can't otherwise tell.
    (obj as Phaser.GameObjects.Image).setScale(this.iconScale * 1.15);
    this.slotBoxes[index]?.setAlpha(0.4);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Haptics are a nicety, not a requirement.
      }
    }

    // Spotlight where this item could go the moment it's picked up, rather
    // than only once it happens to pass over the right slot — on a phone the
    // finger covers the icon, so "aim first, learn later" is a bad trade.
    // A container aims at the bag row instead of the doll — never both.
    const slot = Inventory.at(index);
    if (slot) {
      if (getItem(slot.itemId).type === "container") {
        this.highlightBagRow(Equipment.bagSlotFor(slot.itemId));
      } else {
        this.highlightSlot(this.dollTargetFor(slot.itemId), Equipment.canEquipInstance(slot));
      }
    }
  }

  /** Passing over an equipped-gear slot: confirm (cyan) or warn (red) before
   *  the player commits, since the drop itself is the irreversible part. */
  private onBagDragEnter(
    _p: Phaser.Input.Pointer,
    obj: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.GameObject,
  ): void {
    const index = obj.getData("bagIndex") as number | undefined;
    if (typeof index !== "number") return;
    const slot = Inventory.at(index);
    if (!slot) return;

    if (zone.getData("quickCell")) {
      this.highlightSlot("quick", getItem(slot.itemId).type === "consumable");
      return;
    }
    const bagEquipSlot = zone.getData("bagEquipSlot") as BagSlot | undefined;
    if (bagEquipSlot) {
      this.highlightBagRow(bagEquipSlot, getItem(slot.itemId).type === "container");
      return;
    }
    const zoneSlot = zone.getData("equipSlot") as GearSlot | undefined;
    if (!zoneSlot) return;
    const target = this.dropTargetFor(index, zoneSlot);
    const fits = Equipment.accepts(target, slot.itemId) && Equipment.canEquipInstance(slot);
    // Podświetla KAFEL, nad którym jest palec (jego obecny adres), werdykt —
    // dla adresu, w który przedmiot naprawdę trafi.
    this.highlightSlot(zoneSlot, fits);
  }

  private onBagDragLeave(
    _p: Phaser.Input.Pointer,
    obj: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.GameObject,
  ): void {
    const index = obj.getData("bagIndex") as number | undefined;
    if (typeof index !== "number") return;
    const slot = Inventory.at(index);
    if (zone.getData("bagEquipSlot")) {
      // Fall back to the pick-up spotlight — the item is still in hand.
      this.highlightBagRow(
        slot && getItem(slot.itemId).type === "container" ? Equipment.bagSlotFor(slot.itemId) : null,
      );
      return;
    }
    if (!zone.getData("equipSlot")) return;
    // Fall back to the pick-up spotlight rather than clearing outright — the
    // item is still in hand, so where it belongs is still worth showing.
    this.highlightSlot(
      slot ? Equipment.slotForItem(slot.itemId) : null,
      slot ? Equipment.canEquipInstance(slot) : true,
    );
  }

  private onBagDrag(
    _p: Phaser.Input.Pointer,
    obj: Phaser.GameObjects.GameObject,
    dragX: number,
    dragY: number,
  ): void {
    if (typeof obj.getData("bagIndex") !== "number") return;
    (obj as Phaser.GameObjects.Image).setPosition(dragX, dragY);
  }

  private onBagDrop(
    _p: Phaser.Input.Pointer,
    obj: Phaser.GameObjects.GameObject,
    zone: Phaser.GameObjects.GameObject,
  ): void {
    const from = obj.getData("bagIndex") as number | undefined;
    if (typeof from !== "number") return;

    // Four kinds of target share this handler: another bag cell (reorder), a
    // gear cell of the doll (equip), the doll's quick-action cell (bind), and
    // a bag-row cell (wear a container).
    const equipSlot = zone.getData("equipSlot") as GearSlot | undefined;
    if (equipSlot) {
      this.dropOntoEquipSlot(from, this.dropTargetFor(from, equipSlot));
      return;
    }
    if (zone.getData("quickCell")) {
      this.dropOntoQuickCell(from);
      return;
    }
    const bagEquipSlot = zone.getData("bagEquipSlot") as BagSlot | undefined;
    if (bagEquipSlot) {
      this.dropOntoBagEquipSlot(from, bagEquipSlot);
      return;
    }

    const to = zone.getData("bagIndex") as number | undefined;
    if (typeof to !== "number") return;
    if (this.bagView) {
      this.flash("Przestawiasz w widoku „Wszystko”", "#ff9d3b");
      return;
    }
    Inventory.moveSlot(from, to);
    this.highlightSlot(null);
    this.highlightBagRow(null);
  }

  /**
   * Wear the dragged container in a specific bag slot, or explain why not.
   * Same "name the reason" rule as `dropOntoEquipSlot` — a snap-back with no
   * message is indistinguishable from a broken drag on touch.
   */
  private dropOntoBagEquipSlot(from: number, target: BagSlot): void {
    this.highlightBagRow(null);
    const slot = Inventory.at(from);
    if (!slot) return;
    if (getItem(slot.itemId).type !== "container") {
      this.flash(`${getItem(slot.itemId).name} — to nie jest torba`, "#ff9d3b");
      return;
    }
    if (!Equipment.equipBagFromBag(from, target)) {
      this.flash("Nie ma miejsca, żeby wymienić torbę — opróżnij plecak", "#ff9d3b");
      return;
    }
    this.clearBagSelection();
  }

  /**
   * Equip the dragged item, or explain why not. Each refusal names its own
   * reason: a drop that just quietly snaps back is indistinguishable from the
   * drag not having registered at all, which on touch is the difference
   * between "wrong slot" and "this UI is broken".
   */
  private dropOntoEquipSlot(from: number, target: GearSlot): void {
    this.highlightSlot(null);
    this.highlightBagRow(null);
    const slot = Inventory.slots[from];
    if (!slot) return;

    const itemSlot = Equipment.slotForItem(slot.itemId);
    if (!itemSlot) {
      this.flash(`${getItem(slot.itemId).name} — tego nie można założyć`, "#ff9d3b");
      return;
    }
    // ⚠ PRZED generycznym „to nie ten slot". Tamten komunikat brzmiałby tu
    // „załóż w: Druga ręka" w odpowiedzi na upuszczenie tarczy dokładnie w
    // drugiej ręce — czyli mówiłby graczowi, żeby zrobił to, co właśnie zrobił.
    const hands = Equipment.handsRefusalFor(slot.itemId, target, from);
    if (hands) {
      this.flash(describeHandsRefusal(hands), "#ff9d3b");
      return;
    }
    // `accepts`, not `itemSlot === target`: a ring is happy in either finger,
    // and slotForItem only names the one it would pick by default.
    if (!Equipment.accepts(target, slot.itemId)) {
      this.flash(`To nie ten slot — załóż w: ${EQUIP_SLOT_LABEL[itemSlot]}`, "#ff9d3b");
      return;
    }
    const unmet = Equipment.unmetRequirements(slot.itemId);
    if (unmet.length > 0) {
      this.flash(`Wymaga: ${unmet.map(describeRequirement).join(", ")}`, "#ff9d3b");
      return;
    }
    // ⚠ **`equipFromBag(from, …)`, nie `equip(itemId, …)`** — adresowane
    // KAFLEM, z którego przeciągnięto. Dwa miecze w plecaku mogą różnić się
    // jakością i zużyciem, więc „załóż miecz" jest od wprowadzenia egzemplarzy
    // poleceniem niejednoznacznym; panel zawsze wie, który to był.
    Equipment.equipFromBag(from, target);
    this.clearBagSelection();
  }

  /**
   * Bind the dragged item to the quick-action slot.
   *
   * ⚠ This MOVES NOTHING. The quick slot is a pointer at an item id, not a
   * place an item sits — `Inventory.useQuickSlot` looks the item up in the bag
   * when it fires. Taking the copy out of the backpack here would make the
   * binding consume a slot and would break the moment the last one is drunk.
   */
  private dropOntoQuickCell(from: number): void {
    this.highlightSlot(null);
    this.highlightBagRow(null);
    const slot = Inventory.slots[from];
    if (!slot) return;
    const def = getItem(slot.itemId);
    if (def.type !== "consumable") {
      // Named, like every other refusal here: a drop that silently snaps back
      // is indistinguishable from a drag that never registered.
      this.flash(`${def.name} — tego się nie wypije`, "#ff9d3b");
      return;
    }
    Inventory.setQuickSlot(slot.itemId);
    this.flash(`Przypisano do Q: ${def.name}`, "#88ddff");
    this.refreshSelectionCard();
  }

  /** Fires after `drop`, or alone when dropped nowhere valid — either way put
   *  the icon back on its cell and let refreshInventory redraw the truth. */
  private onBagDragEnd(_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject): void {
    const index = obj.getData("bagIndex") as number | undefined;
    if (typeof index !== "number") return;
    this.stopGridAutoScroll();
    this.resetArmedDragVisual(index);
    this.setGridMaskWide(false);
    // This is the ONLY place "dragging" resolves back to "idle" —
    // `onGridPointerUp` deliberately doesn't touch that state (see its own
    // comment), so a drag that ends without this running would leave the
    // machine stuck forever.
    if (this.gridGestureState === "dragging" && this.gridGestureIndex === index) {
      this.gridGestureState = "idle";
      this.gridGestureIndex = null;
      this.gridGesturePointerId = -1;
    }
    // ⚠ Środek PRZYKRYCIA, nie kotwicy: przy gabarycie `1×2` odłożenie na
    //   środek kafla kotwicy podnosiło ikonę o pół pola i zostawiało ją tam
    //   do następnej przebudowy panelu.
    const slotWr = Inventory.slots[index];
    const { x, y } = this.bagFieldXY(index, slotWr ? itemFootprint(slotWr.itemId) : { w: 1, h: 1 });
    (obj as Phaser.GameObjects.Image).setPosition(x, y);
    this.highlightSlot(null);
    this.highlightBagRow(null);
    this.refreshInventory({ slots: Inventory.slots, gold: Inventory.gold });
  }

  private useSlot(index: number): void {
    const slot = Inventory.slots[index];
    if (!slot) return;
    const def = getItem(slot.itemId);
    if (def.type === "consumable") {
      // Refuse at full HP instead of burning the item for nothing. Food is the
      // reason this matters: its buff would be created and cancelled on the
      // same frame, so the icon would flash and vanish — indistinguishable
      // from a bug. Saying why is what makes the refusal readable.
      if (Inventory.wouldWasteHeal(slot.itemId)) {
        this.flash("Masz pełne zdrowie", "#ff9d3b");
        return;
      }
      Inventory.useItem(slot.itemId);
      // Slot mógł opustoszeć albo zmienić stos — karta idzie za stanem.
      this.refreshSelectionCard();
    } else if (def.type === "weapon" || def.type === "armor") {
      // Say WHY it was refused. Equipment.equip would just return false, and a
      // double-click that silently does nothing reads as a broken button.
      const unmet = Equipment.unmetRequirements(slot.itemId);
      if (unmet.length > 0) {
        this.flash(`Wymaga: ${unmet.map(describeRequirement).join(", ")}`, "#ff9d3b");
        return;
      }
      // Ta sama zasada „powiedz DLACZEGO" co wyżej, dla dwuręczności. Bez tego
      // podwójne kliknięcie na tarczy przy broni dwuręcznej nie robiłoby nic i
      // nie mówiło nic — najgorszy wariant, bo wygląda jak zepsuty przycisk.
      const target = Equipment.slotForItem(slot.itemId);
      const hands = target ? Equipment.handsRefusalFor(slot.itemId, target, index) : null;
      if (hands) {
        this.flash(describeHandsRefusal(hands), "#ff9d3b");
        return;
      }
      // ⚠ Ten egzemplarz, nie „pierwszy taki" — sprawdzenie miejsca wyżej
      //   dotyczyło pól TEGO kafla.
      Equipment.equipFromBag(index);
      this.clearBagSelection();
    } else if (def.type === "container") {
      if (!Equipment.equipBagFromBag(index)) {
        this.flash("Nie ma miejsca, żeby założyć tę torbę", "#ff9d3b");
        return;
      }
      this.clearBagSelection();
    }
  }

  private refreshInventory(p: {
    slots: (InventorySlot | null)[];
    gold: number;
    quickSlot?: ItemId | null;
  }): void {
    if (!this.open) return; // patrz bramka `this.open` przy `refreshCharacter`
    this.rail.setWallet(p.gold);
    this.refreshQuickCell();
    // Karta opisuje KONKRETNY egzemplarz — po wypiciu, sprzedazy czy zmianie
    // zuzycia musi sie odswiezyc albo zamknac.
    this.refreshSelectionCard();

    // Zakładki idą za zawartością; zniknięcie wybranej kategorii wraca do
    // „Wszystko" po cichu (`silent`) — przemalowujemy właśnie tutaj.
    this.bagStrip?.setItems(
      p.slots.filter((sl): sl is InventorySlot => sl !== null).map((sl) => sl.itemId),
      true,
    );
    this.computeBagView();

    const capacity = p.slots.length;
    // ⚠ **Liczymy POLA ZAJĘTE, nie wpisy w tablicy.** Przedmiot `1×2` ma jeden
    //   wpis i dwa pola — licznik „12/16" ma mówić o miejscu, nie o sztukach.
    const occupied = Inventory.capacity - Inventory.freeSlotCount;
    this.capacityText.setText(`${occupied}/${capacity}`);

    for (let i = 0; i < this.slotIcons.length; i++) {
      const icon = this.slotIcons[i];
      const count = this.slotCounts[i];
      const box = this.slotBoxes[i];
      const wear = this.slotWear[i];
      // A slot's contents can move mid-drag, so re-seat the icon on its cell
      // as well as re-texturing it — otherwise an icon left mid-flight by a
      // reorder would stay stranded where the pointer dropped it.
      const { x, y } = this.bagSlotXY(i);
      icon.setPosition(x, y);
      count.setPosition(x + this.cell / 2 - 4, y + this.cell / 2 - 4);

      if (i >= capacity || (this.bagView && !this.bagView.has(i))) {
        // Past the current backpack size entirely — not just empty, ABSENT.
        // Must stay invisible even mid-row (capacity need not be a multiple
        // of `cols`), or a "ghost" cell would render inside a visible row.
        icon.setVisible(false);
        icon.input!.enabled = false;
        count.setVisible(false);
        box?.setVisible(false);
        wear?.setVisible(false);
        continue;
      }
      box?.setVisible(true);
      const slot = p.slots[i];
      count.setVisible(true);
      // ⭐⭐ **DRUGA POŁOWA przedmiotu o gabarycie > 1×1.** W `slots` leży tu
      //   `null`, ale pole JEST zajęte. Rysujemy je jako zajęte (ramka w kolorze
      //   jakości właściciela), **bez drugiej ikony i bez licznika** — jeden
      //   przedmiot ma mieć dokładnie jedno wyobrażenie na ekranie.
      //   ⛔ Nie pokazuj tu kopii ikony: to jest dokładnie ten „duch", którego
      //   cały model kotwicy ma nie dopuścić.
      const kotwica = Inventory.anchorCovering(i);
      if (!slot && kotwica !== null && kotwica !== i) {
        // ⭐⭐ **Pole przykryte CHOWA WŁASNĄ RAMKĘ** (2026-09-19, zgłoszone
        //   z renderu sklepu i wyrównane tutaj). Wcześniej dostawało ramkę
        //   w kolorze jakości właściciela — lepsze niż nic, ale dalej były to
        //   DWA pola obok siebie. Dziś kafel kotwicy rozciąga się na całe
        //   przykrycie, więc przedmiot ma **jedno pole i jedną ramkę**.
        icon.setVisible(false);
        icon.input!.enabled = false;
        count.setText("");
        box?.setVisible(false);
        wear?.setVisible(false);
        continue;
      }
      // Zwykłe pole wraca do kwadratu — rzecz mogła się stąd przed chwilą
      // wyprowadzić.
      this.paintBagField(i, slot ? itemFootprint(slot.itemId) : { w: 1, h: 1 });
      if (slot) {
        // ⚠ **Ikona siada na ŚRODKU zajmowanego obszaru**, nie na kotwicy —
        //   inaczej przedmiot `1×2` wisiałby przy górnej krawędzi swojej pary.
        //   Przy `1×1` wychodzi z tego zero przesunięcia, więc dzisiejszy roster
        //   rysuje się co do piksela tak, jak przedtem.
        const fp = itemFootprint(slot.itemId);
        if (fp.w > 1 || fp.h > 1) {
          icon.setPosition(
            x + ((fp.w - 1) * (this.cell + this.gap)) / 2,
            y + ((fp.h - 1) * (this.cell + this.gap)) / 2,
          );
        }
        icon.setTexture(itemIconKey(slot.itemId)).setVisible(true);
        // ⭐ Pole trafienia idzie za POLEM, nie za rysunkiem: tapnięcie
        //   i przeciągnięcie działa z dowolnej części gabarytu, także gdy
        //   przedmiot ma ikonę 32×32 przy gabarycie `1×2`.
        this.fitBagHitArea(icon, fp);
        icon.input!.enabled = true; // only a filled slot can be dragged
        count.setText(slot.qty > 1 ? `${slot.qty}` : "");
        // The border IS the quality readout: colour is the only thing that
        // survives a 52px cell, and it means the tooltip only ever confirms
        // what the grid already said.
        box?.setStrokeStyle(2, qualityColor(qualityOf(slot)), 1);
        if (wear) this.drawWearBar(wear, slot);
      } else {
        icon.setVisible(false);
        icon.input!.enabled = false;
        count.setText("");
        box?.setStrokeStyle(2, BAG_FRAME, 1);
        wear?.setVisible(false);
      }
    }
    // Re-clamp the scroll to the (possibly changed) content height, resize
    // the scrollbar, and resync input for whatever fell in/out of the window
    // — capacity and scroll position both feed `syncSlotIO`.
    this.setGridScroll(this.gridScroll);
  }

  /**
   * Sync the doll's quick-action cell with `Inventory.quickSlot`.
   *
   * Read straight off `Inventory` rather than from the event payload, because
   * this also runs on the panel's very first refresh (a loaded save has a
   * binding before any change event fires) — and the two can never disagree,
   * since the event is emitted from the same field.
   */
  private refreshQuickCell(): void {
    if (!this.quickCell) return;
    const id = Inventory.quickSlot;
    if (id) this.quickCell.icon.setTexture(itemIconKey(id)).setVisible(true);
    else this.quickCell.icon.setVisible(false);
  }

  /** Fill and colour one cell's wear bar; hidden for anything that doesn't wear
   *  out, and for anything still at full durability: a permanently full bar on
   *  every weapon in the bag is noise, not information. */
  private drawWearBar(bar: Phaser.GameObjects.Rectangle, slot: InventorySlot): void {
    if (!hasDurability(slot.itemId)) {
      bar.setVisible(false);
      return;
    }
    const max = maxDurabilityOfInstance(slot);
    const cur = durabilityOf(slot);
    if (max <= 0 || cur >= max) {
      bar.setVisible(false);
      return;
    }
    const ratio = Math.max(0, cur / max);
    bar.setVisible(true);
    bar.width = Math.max(1, (this.cell - 6) * ratio);
    // Same green / yellow / red thresholds the HP bars use, so the colour means
    // one thing everywhere in this game.
    bar.setFillStyle(ratio > 0.5 ? 0x33dd55 : ratio > 0.25 ? 0xddcc33 : 0xdd3333, 1);
  }

  private onEquipmentChanged(p: EquipmentSnapshot): void {
    this.refreshCharacter();
    this.refreshEquipIcons(p);
    // Znacznik „w ręku" na liście rodzin należy do BRONI, nie do biegłości —
    // więc rusza się przy zmianie sprzętu, a nie przy zmianie `P`.
    if (this.open && this.charSubTab === "weapons") this.refreshWeapons();
  }

  /** Biegłość zmieniła się poza panelem (Patryczek, wczytanie zapisu, konsola
   *  `dev.WeaponProficiency`). Przemaluj, jeśli akurat na to patrzymy. */
  private onWeaponProficiencyChanged(): void {
    if (this.open && this.charSubTab === "weapons") this.refreshWeapons();
  }

  /** Sync the equip-slot icons with whatever's currently equipped, and tint the
   *  frame with that copy's workmanship. */
  /**
   * **Adres kafla, liczony ZA KAŻDYM RAZEM.**
   *
   * ⚠⚠ Kafel warstwowy reprezentuje TRZY adresy, a „najbardziej zewnętrzna
   * zajęta warstwa" zmienia się przy każdym założeniu i zdjęciu. Adres
   * zamrożony przy tworzeniu kafla wskazywałby warstwę, której już nie ma —
   * cicho, bo typ się zgadza.
   */
  private addressOf(cell: DollCell): GearSlot | null {
    if (cell.area) {
      return this.layerView ? layeredSlot(cell.area, this.layerView) : Equipment.outermostSlotOf(cell.area);
    }
    if (cell.hand) return handSlot(cell.hand, this.setView);
    return cell.slot ?? null;
  }

  /**
   * Skala ikony w kaflu lalki.
   *
   * ⚠⚠ **Wyprowadzana z WYSOKOŚCI TEKSTURY, nie wpisana.** Od 2026-09-19
   * istnieją ikony 32×64 (tarcze o gabarycie 1×2) i stałe ×2 wysyłałoby je
   * 128 j. w kaflu wysokim na 68. Skala zostaje CAŁKOWITA — ułamkowa rozmywa
   * pixel-art pod NEAREST-em (ta sama reguła, co `iconScale`).
   */
  private iconScaleFor(key: string, cellW: number, cellH: number): number {
    const img = this.scene.textures.get(key)?.getSourceImage() as HTMLImageElement | undefined;
    // ⚠ Margines 4, nie 6: kafel 68 j. ma mieścić ikonę ×2 (64 j.) — przy 6
    //   broń 32×64 w ręce wypadała ×1, a ta sama broń w plecaku stała ×2
    //   (render 1:1, etap D). Jedna rzecz = jedna skala (reguła z `Z9`).
    return iconFitScale(img?.width ?? 32, img?.height ?? 32, cellW - 4, cellH - 4, this.iconScale);
  }

  private refreshEquipIcons(_p: EquipmentSnapshot): void {
    for (const w of this.equipCells) {
      if (w.cell.kind !== "gear") continue;
      const adres = this.addressOf(w.cell);
      if (!adres) continue;
      // ⚠ Adres i cel upuszczenia idą za WIDOKIEM (warstwa, zestaw) — kafel
      //   ręki pokazujący zestaw II przyjmuje rzecz do zestawu II.
      w.slot = adres;
      w.box.setData("equipSlot", adres);
      // ⚠ Czytane ze STANU, nie z migawki `p` — migawka niesie wyłącznie
      // `EQUIP_SLOTS`, a ręce pokazują też zestaw schowany (`STOW_SLOTS`).
      const inst = Equipment[adres];
      if (inst) {
        const key = itemIconKey(inst.itemId);
        w.icon.setTexture(key).setScale(this.iconScaleFor(key, w.box.width, w.cellH)).setVisible(true);
      } else w.icon.setVisible(false);
      // Glif slotu i ikona przedmiotu wykluczają się nawzajem: pusty kafel mówi
      // CO tu wchodzi, zajęty mówi CO tu leży.
      w.glyph.setVisible(!inst);
      w.box.setStrokeStyle(2, this.equipFrameColor(adres), 1);
      if (w.veil) w.veil.setVisible(Equipment.usesBothHandsIn(this.setView));
      this.paintLayerPips(w);
    }
    this.refreshLayerToggle();
    this.refreshSetToggle();
    this.refreshNumbers();
    this.markSelectedCell();
    this.refreshDetails();
  }

  /**
   * Kropki zajętości warstw na kaflu obszaru. ⭐ Kropka mówi „ta warstwa jest
   * ZAJĘTA" (od modelu C mogą świecić trzy naraz); kropka warstwy POKAZYWANEJ
   * w kaflu jest jaśniejsza — gracz widzi, co leży pod spodem, zanim przełączy.
   */
  private paintLayerPips(w: EquipCellWidget): void {
    if (!w.pips || !w.cell.area) return;
    const pokazywana = w.slot ? /_(L\d)$/.exec(w.slot)?.[1] : undefined;
    for (let i = 0; i < w.pips.length; i++) {
      const warstwa = ARMOR_LAYERS[i];
      const zajeta = !!Equipment[layeredSlot(w.cell.area, warstwa)];
      const teraz = warstwa === pokazywana;
      w.pips[i].setFillStyle(zajeta ? (teraz ? 0xffe680 : 0xb08a3e) : teraz ? 0x66708a : 0x39405a, 1);
    }
  }

  /** Segmenty przełącznika warstw — czynny złoty. Malowane przy zmianie stanu. */
  private refreshLayerToggle(): void {
    for (const seg of this.layerSegments) {
      const on = seg.layer === this.layerView;
      seg.box.setFillStyle(on ? 0x2a3046 : UI.slotBg, 1).setStrokeStyle(2, on ? UI.goldNum : 0x3a4058, on ? 1 : 0.9);
      if (seg.label && seg.label.style.color !== (on ? UI.gold : UI.text)) seg.label.setColor(on ? UI.gold : UI.text);
      if (seg.icon) drawUiIcon(seg.icon, "eye", 26, on ? UI.goldNum : 0xc8d0e0, on ? 0x2a3046 : UI.slotBg);
    }
  }

  /**
   * Przełącznik zestawów: czynny segment złoty, w każdym DWIE miniatury jego
   * pary (główna, druga ręka). ⚠ Miniatura ×1 (32 px) — skala całkowita.
   */
  private refreshSetToggle(): void {
    for (const seg of this.setSegments) {
      const on = seg.set === this.setView;
      seg.box.setFillStyle(on ? 0x2a3046 : UI.slotBg, 1).setStrokeStyle(2, on ? UI.goldNum : 0x3a4058, on ? 1 : 0.9);
      if (seg.label.style.color !== (on ? UI.gold : UI.text)) seg.label.setColor(on ? UI.gold : UI.text);
      (["main", "off"] as const).forEach((hand, i) => {
        const inst = Equipment[handSlot(hand, seg.set)];
        const mini = seg.minis[i];
        if (inst) {
          const key = itemIconKey(inst.itemId);
          mini.setTexture(key).setScale(1).setVisible(true);
          // Wysoka ikona (32×64) w miniaturze ×1 nie zmieści się w pasku 44 j. —
          // dostaje połowę, a ułamek jest tu do przyjęcia: miniatura jest
          // znakiem „coś tu leży", nie ikoną do oglądania.
          const img = this.scene.textures.get(key)?.getSourceImage() as HTMLImageElement | undefined;
          if ((img?.height ?? 32) > 40) mini.setScale(0.5);
        } else mini.setVisible(false);
      });
    }
    if (this.swapBox) {
      const ready = Equipment.hasStowedSet || !!Equipment.weapon || !!Equipment.offhand;
      this.swapGlyph.setTint(ready ? 0xffcc66 : 0x4a5063);
      this.swapBox.setStrokeStyle(2, ready ? EQUIP_FRAME : 0x2a2f3a, 1);
    }
  }

  /**
   * Sync the bag-row icons with whatever's worn there. The capacity change
   * itself (and the grid resync it needs) rides on `inventoryChanged` —
   * `Equipment.equipBagFromBag`/`unequipBag` call `Inventory.setCapacity`
   * BEFORE emitting this, so `refreshInventory` has already run by the time
   * this fires. This handler only owns the four cells' own icons/borders.
   */
  private onBagsChanged(p: BagSnapshot): void {
    for (const w of this.bagEquipWidgets) {
      const inst = p[w.slot];
      if (inst) w.icon.setTexture(itemIconKey(inst.itemId)).setVisible(true);
      else w.icon.setVisible(false);
      w.glyph.setVisible(!inst);
      if (this.selectedBagEquipSlot !== w.slot) w.box.setStrokeStyle(2, this.bagEquipFrameColor(w.slot), 1);
    }
  }

  /** Backpack change also moves quest progress (collect objectives read the bag). */
  private onInventoryChanged(p: {
    slots: (InventorySlot | null)[];
    gold: number;
    quickSlot?: ItemId | null;
  }): void {
    this.refreshInventory(p);
    this.refreshQuests();
  }

  /* ── Quests page ─────────────────────────────────────────────────────── */

  /**
   * **Dziennik zadań — lista + karta** (etap F, 2026-10-13; research §8 R6).
   *
   * Do tej daty: karty jedna pod drugą (opis, cel, nagroda — krój 9–13 j.),
   * filtr AKTYWNE / UKOŃCZONE nad nimi (26 j. — pod progiem dotyku), śledzenie
   * tapnięciem w kartę, rozpoznawane arytmetycznie (`questCardBounds`), bo
   * karty nie miały wejścia. Dziś lista ma wiersz 68 j. na zadanie: najpierw
   * do oddania, potem w toku, na końcu zrobione (wyciszone, „✓") — archiwum
   * nie wypycha bieżących, bo stoi POD nimi. Karta = `QuestCard` (ta sama
   * treść co tablica dawcy), śledzenie = przycisk karty.
   */
  private buildQuestsPage(): void {
    // ⭐ Dwie podzakładki: „Aktywne” i „Ukończone” (autor 2026-10-14) — ten
    // sam pas co Postać (`SUB_TAB`). Do tej daty jedna lista: do oddania →
    // w toku → zrobione, a archiwum rosło pod bieżącymi bez końca.
    const T = PlayerPanel.SUB_TAB;
    const tabs: { id: "active" | "done" }[] = [{ id: "active" }, { id: "done" }];
    const pad = 18;
    const gap = 8;
    const w = (this.w - 2 * pad - gap * (tabs.length - 1)) / tabs.length;
    const y = -this.questsPageH / 2 + T.top + T.h / 2;
    tabs.forEach(({ id }, i) => {
      const x = -this.w / 2 + pad + i * (w + gap) + w / 2;
      const box = this.scene.add
        .rectangle(x, y, w, T.h, UI.slotBg, 1)
        .setStrokeStyle(2, 0x3a4058, 0.5)
        .setInteractive({ useHandCursor: true });
      const text = this.scene.add
        .text(x, y, "", textStyle({ fontSize: fontPx("body"), color: UI.muted, fontStyle: "bold" }))
        .setOrigin(0.5);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.journalTab === id) return;
        Sfx.play("ui-click");
        this.journalTab = id;
        this.selectedQuest = null;
        this.refreshQuests(false);
      });
      this.questsPage.add([box, text]);
      this.journalTabWidgets.push({ id, box, text });
    });
    const band = this.charSubBand();
    const host = this.scene.add.container(0, band / 2);
    this.questsPage.add(host);
    this.questsView = new ListDetail(this.scene, host, computeListDetailLayout(this.w, this.questsPageH - band), (id) => {
      this.selectedQuest = id as QuestId;
      this.refreshQuests(false);
    });
  }

  /** Podpisy i wygląd podzakładek dziennika (liczby się zmieniają). */
  private paintJournalTabs(active: number, done: number): void {
    for (const t of this.journalTabWidgets) {
      const on = t.id === this.journalTab;
      t.box.setStrokeStyle(2, on ? UI.goldNum : 0x3a4058, on ? 1 : 0.5);
      t.text.setText(t.id === "active" ? `Aktywne (${active})` : `Ukończone (${done})`).setColor(on ? UI.gold : UI.muted);
    }
  }

  /** Kolejność dziennika: do oddania → w toku → zrobione. */
  private journalRank(id: QuestId): number {
    if (Quests.getStatus(id) === "completed") return 2;
    return Quests.isObjectiveMet(id) ? 0 : 1;
  }

  /**
   * Redraw the backpack grid's clip rectangle in screen coordinates. Must
   * re-run whenever the panel moves, i.e. on every reposition() — same
   * pattern as `refreshQuestMask`, but scoped to the grid's OWN rectangle
   * (`gridLeft`/`gridW`/`columnsTop`/`columnH`) rather than the full page
   * width, since the doll and card columns must never be clipped by it.
   */
  private refreshGridMask(): void {
    if (!this.gridMaskG) return;
    // ⚠ **Maska żyje w przestrzeni EKRANU, więc musi znać SKALĘ kontenera.**
    // `PanelBase.reposition` zmniejsza panel, gdy nie mieści się w oknie
    // (od 2026-09-11); bez tego mnożnika okno maski zostałoby w rozmiarze
    // nieskalowanym i przycinało siatkę w złym miejscu — cichy błąd, bo maska
    // nigdy nie zgłasza, że przycina nie to.
    const s = this.container.scale;
    const pageY = this.container.y + this.inventoryPage.y * s;
    const x = this.container.x + this.gridLeft * s;
    this.gridMaskG
      .clear()
      .fillStyle(0xffffff)
      .fillRect(x, pageY + this.gridTop * s, this.gridW * s, this.columnH * s);
    // ⚠ **Na czas przeciągania maska obejmuje też kolumny NA LEWO i NA PRAWO
    // od siatki** (lalka, karta) — ikona w locie jest dzieckiem `bagGridList`,
    // więc maska samej siatki gasiła ją w chwili wyjazdu nad lalkę: palec
    // niósł „nic" dokładnie nad celem (render etapu D, 2026-10-13; błąd był
    // starszy). Wiersze spoza okna leżą wyłącznie w pasie siatki, więc te dwa
    // prostokąty żadnego z nich nie odsłonią.
    if (this.gridMaskWide) {
      const left = this.container.x - (this.w / 2) * s;
      const right = this.container.x + (this.w / 2) * s;
      const top = pageY + this.inv.top * s;
      const h = (this.inv.bottom - this.inv.top) * s;
      const gapL = x - 2 * s;
      const gapR = x + (this.gridW + INV.scrollW + 2) * s;
      this.gridMaskG.fillRect(left, top, gapL - left, h).fillRect(gapR, top, right - gapR, h);
    }
  }
  /** Maska siatki poszerzona o kolumny lalki i karty — tylko w trakcie przeciągania. */
  private gridMaskWide = false;
  private setGridMaskWide(on: boolean): void {
    if (this.gridMaskWide === on) return;
    this.gridMaskWide = on;
    this.refreshGridMask();
  }

  private refreshQuests(keepCardScroll = true): void {
    if (!this.open) return; // patrz bramka `this.open` przy `refreshCharacter`
    if (!this.questsView) return;
    const all = Quests.logQuests()
      .map((id, i) => ({ id, i }))
      .sort((a, b) => this.journalRank(a.id) - this.journalRank(b.id) || a.i - b.i)
      .map((x) => x.id);
    const isDone = (id: QuestId) => Quests.getStatus(id) === "completed";
    const ids = all.filter((id) => (this.journalTab === "done" ? isDone(id) : !isDone(id)));
    this.paintJournalTabs(all.length - all.filter(isDone).length, all.filter(isDone).length);
    if (ids.length === 0) {
      this.selectedQuest = null;
      this.questsView.setRows([], null, false);
      this.questsView.setCard(
        null,
        this.journalTab === "done"
          ? "Nie ukończyłeś jeszcze żadnego zadania."
          : "Nie masz teraz żadnego zadania.\nPorozmawiaj z mieszkańcami, aby jakieś zdobyć.",
      );
      this.questsView.refreshMasks();
      return;
    }
    // Wejście otwiera ŚLEDZONE zadanie — to, o które gracz zwykle pyta.
    if (this.selectedQuest === null || !ids.includes(this.selectedQuest)) {
      this.selectedQuest = TrackedQuest.id && ids.includes(TrackedQuest.id) ? TrackedQuest.id : ids[0];
    }
    const sel = this.selectedQuest;
    this.questsView.setRows(
      ids.map((id) => {
        const st = questState(id);
        const done = Quests.getStatus(id) === "completed";
        const tracked = !done && TrackedQuest.id === id;
        return {
          id,
          mark: st.mark,
          markColor: st.markColor,
          name: getQuest(id).name,
          nameColor: done ? UI.muted : UI.white,
          // ⚠ Śledzone niesie DWA sygnały: dopisek i złoty „▸" zamiast kropki —
          //   na dotyku nie ma najechania, stan musi być widoczny od razu.
          note: tracked ? `▸ śledzone · ${st.text}` : st.text,
          noteColor: tracked ? UI.gold : st.color,
        };
      }),
      sel,
    );
    const status = Quests.getStatus(sel);
    const done = status === "completed";
    const st = questState(sel);
    const tracked = !done && TrackedQuest.id === sel;
    this.questsView.setCard(
      {
        title: getQuest(sel).name,
        titleColor: done ? UI.green : UI.gold,
        subtitle: st.text[0].toUpperCase() + st.text.slice(1),
        subtitleColor: st.color,
        sections: questSections(sel),
        hint: done ? undefined : tracked ? "Śledzone — cel widać w rogu ekranu, pod paskiem życia." : undefined,
        action: done || tracked
          ? undefined
          : { label: "Śledź na ekranie", enabled: true, onClick: () => TrackedQuest.set(sel) },
      },
      "",
      keepCardScroll,
    );
    this.questsView.refreshMasks();
  }

  /* ── Save page ────────────────────────────────────────────────────────── */

  /**
   * Manual saving, and the only place in the game it can be done.
   *
   * The panel is a good home for it precisely because of a property it already
   * had for other reasons: **it pauses gameplay while open**, so a manual save
   * can never be taken mid-swing, and the position it records is one the player
   * was standing still at.
   *
   * The autosave row is deliberately listed alongside the three manual ones,
   * and deliberately has no "Zapisz" button. Hiding it would leave a player
   * wondering where the game had been putting their progress all along; giving
   * it a button would suggest the autosave is something you have to remember to
   * do.
   */
  /**
   * ⭐ Etap F (2026-10-13): role tekstu i próg dotyku. Do tej daty: przyciski
   * slotów 90×32 j. krojem 11 px („częściowa poprawa, nie docelowy stan" —
   * audyt 2026-08-24), opisy 10 px. Dziś dwie kolumny: ZAPIS (wiersz slotu =
   * nazwa i opis po lewej, przyciski 56 j. po prawej w tym samym wierszu) |
   * USTAWIENIA nad wyjściem z gry.
   */
  private static readonly SAVE = { pad: 24, gutter: 40, rowH: 84, btnW: 112, btnH: 56, sideW: 300 } as const;

  private buildSavePage(): void {
    const h = this.savePageH;
    const S = PlayerPanel.SAVE;
    const left = -this.w / 2 + S.pad;
    const sideX = this.w / 2 - S.pad - S.sideW;
    this.savePage.add(
      this.scene.add
        .text(left, -h / 2 + S.pad, "Zapis gry", textStyle({ fontSize: fontPx("title"), color: UI.gold, fontStyle: "bold" }))
        .setOrigin(0, 0),
    );
    this.saveList = this.scene.add.container(0, -h / 2 + S.pad + 52);
    this.savePage.add(this.saveList);
    this.savePage.add(this.scene.add.rectangle(sideX - S.gutter / 2, 0, 1, h - 2 * S.pad, 0xffffff, 0.18));

    // USTAWIENIA (`OI-56`) — te same przełączniki co w menu głównym, żeby
    // wyciszenie nie wymagało wyjścia z gry. Kontener przebudowywany przy
    // zmianie, bo napis niesie stan.
    this.settingsBox = this.scene.add.container(sideX, -h / 2 + S.pad);
    this.savePage.add(this.settingsBox);
    this.refreshSettings();

    // ⭐ 2026-10-11 (autor): „Zapisz i wyjdź do menu" + „Zapisz i wyjdź z gry".
    // Ten drugi wyłącznie w aplikacji — strona w przeglądarce nie zamknie
    // własnej karty, a przycisk, który nic nie robi, jest gorszy niż żaden.
    // Na DOLE prawej kolumny, osobno od „Wróć do gry" w szynie: to jedyne
    // miejsce, z którego da się wrócić do ekranu tytułowego.
    const wyjscieZGry = Capacitor.isNativePlatform();
    const bottom = h / 2 - S.pad - S.btnH / 2;
    const wyjscia: [string, () => void][] = [["Zapisz i wyjdź do menu", () => this.returnToTitle()]];
    if (wyjscieZGry) wyjscia.push(["Zapisz i wyjdź z gry", () => this.exitGame()]);
    wyjscia.reverse().forEach(([label, onClick], i) => {
      this.savePage.add(
        this.makeButton({
          x: sideX + S.sideW / 2,
          y: bottom - i * (S.btnH + 10),
          w: S.sideW,
          h: S.btnH,
          label,
          fontSize: fontPx("body"),
          tone: "neutral",
          onClick,
        }),
      );
    });
  }

  private settingsBox?: Phaser.GameObjects.Container;

  private refreshSettings(): void {
    const box = this.settingsBox;
    if (!box) return;
    const S = PlayerPanel.SAVE;
    box.removeAll(true);
    const onOff = (on: boolean) => (on ? "wł." : "wył.");
    box.add(
      this.scene.add
        .text(0, 0, "Ustawienia", textStyle({ fontSize: fontPx("title"), color: UI.gold, fontStyle: "bold" }))
        .setOrigin(0, 0),
    );
    const przelaczniki: [string, boolean, () => void][] = [
      ["Dźwięk", Settings.sound, () => Settings.setSound(!Settings.sound)],
      ["Odgłosy tła", Settings.ambient, () => Settings.setAmbient(!Settings.ambient)],
    ];
    przelaczniki.forEach(([nazwa, on, toggle], i) => {
      box.add(
        this.makeButton({
          x: S.sideW / 2,
          y: 52 + S.btnH / 2 + i * (S.btnH + 10),
          w: S.sideW,
          h: S.btnH,
          label: `${nazwa}: ${onOff(on)}`,
          fontSize: fontPx("body"),
          tone: on ? "primary" : "neutral",
          onClick: () => {
            toggle();
            this.refreshSettings();
          },
        }),
      );
    });
    // ⭐ Sposób celowania umiejętnościami (autor 2026-10-14, `Settings.aimMode`):
    //   dwa tryby, nie wł./wył. — napis mówi WYBRANY tryb, zdanie pod nim jak
    //   działa. Neutralny kolor w obu stanach: żaden nie jest „włączony".
    const aimY = 52 + S.btnH / 2 + przelaczniki.length * (S.btnH + 10);
    box.add(
      this.makeButton({
        x: S.sideW / 2,
        y: aimY,
        w: S.sideW,
        h: S.btnH,
        label: AIM_MODE_TEXT[Settings.aimMode].label,
        fontSize: fontPx("body"),
        tone: "neutral",
        onClick: () => {
          Settings.setAimMode(Settings.aimMode === "drag" ? "tap" : "drag");
          this.refreshSettings();
        },
      }),
    );
    box.add(
      this.scene.add
        .text(0, aimY + S.btnH / 2 + 8, AIM_MODE_TEXT[Settings.aimMode].hint, textStyle({ fontSize: fontPx("small"), color: UI.muted, wordWrap: { width: S.sideW } }))
        .setOrigin(0, 0),
    );
  }

  /**
   * Zawsze potwierdzone, i tekst nazywa, co się dzieje — w odróżnieniu od
   * `loadFromSlot` to NIE jest akcja niszcząca postęp: `Save.save()` (autosave)
   * leci PRZED przejściem, więc jedyne, co gracz traci, to bieżącą sesję na
   * ekranie, nie dane.
   */
  private returnToTitle(): void {
    this.confirm.show("Zapisać grę i wrócić do menu głównego?", () => {
      this.close();
      GameEvents.emit(EVENT.returnToTitleRequested);
    });
  }

  /** Potwierdzone z tego samego powodu co powrót do menu — przypadkowe
   *  dotknięcie zamyka aplikację. Zapis robi `GameScene` (gwarantowany
   *  autozapis), dopiero potem `App.exitApp()`. */
  private exitGame(): void {
    this.confirm.show("Zapisać grę i zamknąć aplikację?", () => {
      this.close();
      GameEvents.emit(EVENT.exitGameRequested);
    });
  }

  /** Rebuild every slot row against what is on disk right now. */
  private refreshSave(): void {
    if (!this.saveList) return;
    this.saveList.removeAll(true);
    const S = PlayerPanel.SAVE;
    const left = -this.w / 2 + S.pad;
    const colRight = this.w / 2 - S.pad - S.sideW - S.gutter;
    // Przyciski od PRAWEJ krawędzi kolumny: Usuń · Wczytaj · Zapisz — ten sam
    // adres w każdym wierszu, także gdy któregoś brak (autozapis nie ma
    // „Zapisz" ani „Usuń").
    const slotX = (k: number) => colRight - S.btnW / 2 - k * (S.btnW + 8);
    const textW = colRight - left - 3 * (S.btnW + 8) - 8;
    let y = 0;

    for (const slot of ALL_SLOTS) {
      const info = Save.describe(slot);
      const isAuto = slot === "auto";
      const loadable = info !== null && info.compatible;
      // Trzy wyraźnie różne stany trzema barwami motywu: autozapis jaśniejsze
      // złoto, zajęty slot złoto, pusty wyciszony.
      const labelColor = isAuto ? UI.goldLight : loadable ? UI.gold : UI.muted;
      const name = this.scene.add
        .text(left, y + 6, SLOT_LABEL[String(slot)], textStyle({ fontSize: fontPx("name"), color: labelColor, fontStyle: "bold" }))
        .setOrigin(0, 0);
      const desc = this.scene.add
        .text(left, y + 6 + name.height + 2, describeSlot(info), textStyle({ fontSize: fontPx("small"), color: info ? UI.text : UI.muted, wordWrap: { width: textW } }))
        .setOrigin(0, 0);
      this.saveList.add([name, desc]);

      const btnY = y + S.rowH / 2 - 4;
      const btn = (k: number, label: string, onClick: () => void, opts: { tone?: "neutral"; enabled?: boolean } = {}) =>
        this.saveList.add(
          this.makeButton({ x: slotX(k), y: btnY, w: S.btnW, h: S.btnH, label, fontSize: fontPx("body"), onClick, ...opts }),
        );
      if (!isAuto) btn(2, "Zapisz", () => this.saveToSlot(slot, info !== null));
      btn(1, "Wczytaj", () => this.loadFromSlot(slot), { tone: "neutral", enabled: loadable });
      if (!isAuto && info !== null) {
        btn(0, "Usuń", () =>
          this.confirm.show(`Usunąć ${SLOT_LABEL[String(slot)]}?`, () => {
            Save.clear(slot);
            this.refreshSave();
          }),
          { tone: "neutral" },
        );
      }

      y += S.rowH + 12;
      if (slot !== ALL_SLOTS[ALL_SLOTS.length - 1]) {
        this.saveList.add(this.scene.add.rectangle(left + (colRight - left) / 2, y - 6, colRight - left, 1, 0xffffff, 0.12));
      }
    }
  }

  /** Overwriting an occupied slot is confirmed; writing into an empty one is
   *  not — there is nothing to lose, and a prompt for a free action trains
   *  people to dismiss the prompt that matters. */
  private saveToSlot(slot: SlotId, occupied: boolean): void {
    const write = () => {
      Save.save(slot);
      this.refreshSave();
      this.flash("Zapisano", UI.green);
    };
    if (occupied) this.confirm.show(`Nadpisać ${SLOT_LABEL[String(slot)]}?`, write);
    else write();
  }

  /**
   * Always confirmed, and it names what is at stake: everything since the last
   * save is gone, including whatever the *autosave* had been faithfully
   * keeping. Loading is the one button in this panel that destroys progress.
   *
   * Closes the panel first (which resumes GameScene) before firing the event:
   * the handler restarts that scene, and restarting a paused scene leaves it
   * paused — the new map would build and then sit frozen.
   */
  private loadFromSlot(slot: SlotId): void {
    this.confirm.show(
      `Wczytać ${SLOT_LABEL[String(slot)]}? Bieżący postęp od ostatniego zapisu przepadnie.`,
      () => {
        this.close();
        GameEvents.emit(EVENT.loadGameRequested, { slot });
      },
    );
  }

  /* ── Map page ─────────────────────────────────────────────────────────── */

  /**
   * ⭐ **Strona MAPA = kartka pergaminu z dwoma widokami** (2026-10-14):
   * „Okolica” (obszar, w którym stoisz — jak dotąd) i „Świat” (wszystkie
   * obszary z `MAP_ATLAS` naraz, także te za portalem — gracz widzi, jak duży
   * jest świat i co leży dalej). Rysunek idzie z tekstur MGŁY (`MapFog`):
   * nieodkryty teren to czysty pergamin, nieodwiedzony obszar ma tylko
   * obrys i „?”.
   *
   * ⭐ **Kartografia I odblokowuje stronę** (decyzja autora 2026-10-14). Bez
   * niej zakładka zostaje — i mówi, KTO uczy; brak zakładki niczego by nie
   * nauczył.
   */
  private buildMapPage(): void {
    const h = this.mapPageH;
    const w = this.w;
    const pad = 16;
    const headH = 56;
    const footH = 40;

    // ⚠ Nagłówek niesie NAZWĘ MIEJSCA, nie słowo „MAPA". Przy trzech mapach
    // sama etykieta zakładki nie mówi już tego, po co się ją otwiera.
    this.mapTitle = this.scene.add
      .text(-w / 2 + pad, -h / 2 + headH / 2 + 4, "Mapa", textStyle({ fontSize: fontPx("title"), color: UI.gold, fontStyle: "bold" }))
      .setOrigin(0, 0.5);
    this.mapPage.add(this.mapTitle);

    // Przełącznik widoku: dwa segmenty po prawej (wzorzec przełącznika warstw).
    const segW = 120;
    const segH = 48;
    const segGap = 4;
    const views: { id: "region" | "world"; label: string }[] = [
      { id: "region", label: "Okolica" },
      { id: "world", label: "Świat" },
    ];
    this.mapToggle = this.scene.add.container(0, 0);
    let sx = w / 2 - pad - views.length * segW - (views.length - 1) * segGap;
    for (const v of views) {
      const box = this.scene.add
        .rectangle(sx + segW / 2, -h / 2 + headH / 2 + 4, segW, segH, UI.slotBg, 1)
        .setStrokeStyle(2, 0x3a4058, 0.9)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(box.x, box.y, v.label, textStyle({ fontSize: fontPx("body"), color: UI.text }))
        .setOrigin(0.5);
      box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.mapView === v.id) return;
        Sfx.play("ui-click");
        this.mapView = v.id;
        this.refreshMap();
      });
      this.mapToggle.add([box, label]);
      this.mapSegments.push({ id: v.id, box, label });
      sx += segW + segGap;
    }
    this.mapPage.add(this.mapToggle);

    // Kartka: rysowana RAZ (rozmiar strony jest stały — `PanelBase` skaluje
    // cały panel, nie przebudowuje stron).
    const sheetW = w - 2 * pad;
    const sheetH = h - headH - footH - 8;
    const sheetX = -w / 2 + pad;
    const sheetY = -h / 2 + headH + 8;
    const kartka = parchmentSheet(sheetW, sheetH, { cell: 4, band: 3, shadow: 4 });
    const sheet = this.scene.add.graphics({ x: sheetX, y: sheetY });
    sheet.fillStyle(PARCHMENT.shadow, PARCHMENT.shadowAlpha);
    for (const r of kartka.silhouette) sheet.fillRect(r.x + kartka.shadow.dx, r.y + kartka.shadow.dy, r.w, r.h);
    for (const r of kartka.rects) sheet.fillStyle(PARCHMENT[r.tone], 1).fillRect(r.x, r.y, r.w, r.h);
    const c = kartka.content;
    sheet.fillStyle(PARCHMENT.paper, 1).fillRect(c.x, c.y, c.w, c.h);
    this.mapSheet = sheet;
    this.mapArea = { x: sheetX + c.x, y: sheetY + c.y, w: c.w, h: c.h };
    this.mapPage.add(sheet);

    // Treść kartki — przebudowywana przy każdym otwarciu (gracz zwykle się
    // przesunął, a przejście portalem mogło zmienić obszar).
    this.mapContent = this.scene.add.container(0, 0);
    this.npcMarkers = this.scene.add.container(0, 0);
    this.mapMarker = this.scene.add
      .circle(0, 0, 5, UI.dangerNum, 1)
      .setStrokeStyle(2, 0xffffff, 0.95)
      .setVisible(false);
    // Draw order: map, then NPC dots, then the player's own marker on top —
    // he's the one thing on this screen you always want to find first.
    this.mapPage.add([this.mapContent, this.npcMarkers, this.mapMarker]);

    this.mapUnavailableText = this.scene.add
      .text(0, 0, "", textStyle({ fontSize: fontPx("body"), color: UI.muted, align: "center", lineSpacing: 6 }))
      .setOrigin(0.5)
      .setVisible(false);
    this.mapPage.add(this.mapUnavailableText);

    // Legenda pod kartką: mówi to, co mapa RYSUJE.
    this.mapLegend = this.scene.add.container(0, h / 2 - footH / 2);
    this.mapPage.add(this.mapLegend);
  }

  /** Legenda: kropka „ty”, w Okolicy kropka mieszkańców, a na końcu ile
   *  odkryto (w Świecie — odpowiedź na „jak duży jest świat”). */
  private paintMapLegend(world: boolean, explored: number): void {
    this.mapLegend.removeAll(true);
    const wpisy: Phaser.GameObjects.GameObject[] = [];
    let lx = 0;
    const kropki: [number, string][] = world
      ? [[UI.dangerNum, "ty"]]
      : [[UI.dangerNum, "ty"], [UI.goldNum, "mieszkańcy"]];
    for (const [kolor, tekst] of kropki) {
      const kropka = this.scene.add.circle(lx, 0, 6, kolor, 1).setStrokeStyle(1, 0x000000, 0.8);
      const podpis = this.scene.add
        .text(lx + 12, 0, tekst, textStyle({ fontSize: fontPx("small"), color: UI.muted }))
        .setOrigin(0, 0.5);
      wpisy.push(kropka, podpis);
      lx += 12 + podpis.width + 24;
    }
    // Znaczniki zadań — ten sam rysunek co na mapie i nad głową w świecie.
    for (const [mark, tekst] of [
      [{ kind: "turnIn", color: UI.green }, "oddaj zadanie"],
      [{ kind: "talk", color: UI.gold }, "porozmawiaj"],
    ] as const) {
      wpisy.push(mapQuestIcon(this.scene, mark, lx, 9, 18));
      const podpis = this.scene.add
        .text(lx + 12, 0, tekst, textStyle({ fontSize: fontPx("small"), color: UI.muted }))
        .setOrigin(0, 0.5);
      wpisy.push(podpis);
      lx += 12 + podpis.width + 24;
    }
    const proc = this.scene.add
      .text(lx, 0, `odkryto ${Math.round(explored * 100)}% ${world ? "świata" : "okolicy"}`, textStyle({ fontSize: fontPx("small"), color: UI.muted }))
      .setOrigin(0, 0.5);
    wpisy.push(proc);
    lx += proc.width;
    this.mapLegend.add(wpisy);
    this.mapLegend.setX(-lx / 2);
  }

  /**
   * Odbudowa treści kartki z żywego stanu: `WorldState` (pozycja — snapshot
   * z chwili, w której panel zapauzował grę), `Exploration` (mgła),
   * `Skills` (Kartografia I).
   */
  private refreshMap(): void {
    this.rememberAtlasNpcs();
    this.mapContent.removeAll(true);
    this.npcMarkers.removeAll(true);
    this.mapMarker.setVisible(false);

    if (!Skills.has("cartography_1")) {
      this.mapTitle.setText("Mapa");
      this.mapToggle.setVisible(false);
      this.mapSheet.setVisible(false);
      this.mapLegend.setVisible(false);
      this.mapUnavailableText
        .setText("Nie umiesz jeszcze czytać ani prowadzić mapy.\nKartografii uczy Myśliwy.")
        .setVisible(true);
      return;
    }
    this.mapToggle.setVisible(true);
    this.mapSheet.setVisible(true);
    this.mapLegend.setVisible(true);
    this.mapUnavailableText.setVisible(false);
    for (const seg of this.mapSegments) {
      const on = seg.id === this.mapView;
      seg.box.setFillStyle(on ? 0x3a3220 : UI.slotBg, 1).setStrokeStyle(2, on ? UI.goldNum : 0x3a4058, 0.9);
      seg.label.setColor(on ? UI.gold : UI.text);
    }
    if (this.mapView === "world") this.paintWorldMap();
    else this.paintRegionMap();
  }

  private onSkillsChangedForMap(): void {
    if (this.open && this.activeTab === "map") this.refreshMap();
    // Umiejętność bierna nie zmienia paska (`abilitiesChanged` nie leci),
    // a stoi na liście Umiejętności.
    if (this.open && this.activeTab === "character" && this.charSubTab === "skills") this.refreshSkills();
  }

  private rememberAtlasNpcs(): void {
    const regions = WorldState.regions.length ? WorldState.regions : [this.currentRegion()];
    for (const n of WorldState.npcs) {
      const r = regions.find((q) => n.x >= q.x && n.y >= q.y && n.x < q.x + q.w && n.y < q.y + q.h);
      const at = r && MAP_ATLAS.find((a) => a.id === r.id);
      if (r && at) this.atlasNpcs.set(n.id, { ax: at.x + n.x - r.x, ay: at.y + n.y - r.y, name: n.name });
    }
  }

  /** Obszar, w którym stoi gracz, i jego prostokąt w px świata sceny. */
  private currentRegion(): { id: string; x: number; y: number; w: number; h: number } {
    const reg = WorldState.region;
    return reg ?? { id: WorldState.mapId, x: 0, y: 0, w: WorldState.widthPx, h: WorldState.heightPx };
  }

  /** Widok „Okolica”: obszar gracza na całą kartkę, z mieszkańcami. */
  private paintRegionMap(): void {
    const reg = this.currentRegion();
    const entry = MAP_BY_ID[reg.id];
    this.mapTitle.setText(entry?.label ?? "Mapa");
    const key = fogTexture(this.scene, reg.id);
    const A = this.mapArea;
    if (!key) {
      this.paintMapLegend(false, 0);
      this.mapContent.add(
        this.scene.add
          .text(A.x + A.w / 2, A.y + A.h / 2, "Mapa niedostępna", textStyle({ fontSize: fontPx("body"), color: "#5e4630" }))
          .setOrigin(0.5),
      );
      return;
    }
    const source = this.scene.textures.get(key).getSourceImage() as { width: number; height: number };
    // ⚠ **Powiększenie CAŁKOWITE, pomniejszenie może nie być** — skala ułamkowa
    // rozmywa pixel-art (ten sam argument, co zoom kamery), a rozmyta mapa
    // jest i tak lepsza niż ucięta.
    const fit = Math.min(A.w / source.width, A.h / source.height);
    const scale = fit >= 1 ? Math.floor(fit) : fit;
    const dispW = source.width * scale;
    const dispH = source.height * scale;
    const left = Math.round(A.x + (A.w - dispW) / 2);
    const top = Math.round(A.y + (A.h - dispH) / 2);
    this.mapContent.add(this.scene.add.image(left, top, key).setOrigin(0).setDisplaySize(dispW, dispH));
    this.paintMapLegend(false, Exploration.fraction(reg.id));

    const mw = reg.w;
    const mh = reg.h;
    const fx = mw > 0 ? (WorldState.playerX - reg.x) / mw : 0.5;
    const fy = mh > 0 ? (WorldState.playerY - reg.y) / mh : 0.5;
    this.mapMarker.setPosition(left + fx * dispW, top + fy * dispH).setVisible(true);

    // ⚠ **Kropka zawsze, PODPIS tylko jeśli się mieści.** Zagaje mają
    // mieszkańców stłoczonych przy placu — bezwarunkowe podpisy zlewały się
    // w kaszę („RolnHanna”). Zachłannie, w stałej kolejności spawnu, więc
    // mapa nie migocze różnymi imionami przy każdym otwarciu.
    // ⭐ Mieszkaniec na NIEODKRYTYM terenie nie ma kropki — mgła ukrywa też ludzi.
    const zajete: Phaser.Geom.Rectangle[] = [];
    // Podpisy POWYŻEJ wszystkich kropek — kropka następnego mieszkańca
    // przykrywała podpis poprzedniego (render 1:1).
    const podpisy: Phaser.GameObjects.Text[] = [];
    // ⭐ Cele zadań NAJPIERW (`MapQuestMarks`): ikona zamiast kropki, widoczna
    // także we mgle, a jej podpis wygrywa miejsce przed resztą.
    const oznaczeni = new Set<string>();
    for (const npc of WorldState.npcs) {
      if (npc.x < reg.x || npc.y < reg.y || npc.x >= reg.x + mw || npc.y >= reg.y + mh) continue;
      const mark = mapQuestMark(npc.id);
      if (!mark) continue;
      oznaczeni.add(npc.id);
      const px = left + ((npc.x - reg.x) / mw) * dispW;
      const py = top + ((npc.y - reg.y) / mh) * dispH;
      const icon = mapQuestIcon(this.scene, mark, px, py + 6, 26);
      this.npcMarkers.add(icon);
      const label = this.scene.add
        .text(px, py - 22, npc.name, textStyle({ fontSize: fontPx("small"), color: UI.goldLight, fontStyle: "bold", stroke: "#000000", strokeThickness: 3 }))
        .setOrigin(0.5, 1);
      zajete.push(new Phaser.Geom.Rectangle(label.x - label.width / 2 - 2, label.y - label.height - 2, label.width + 4, label.height + 4));
      podpisy.push(label);
    }
    for (const npc of WorldState.npcs) {
      if (oznaczeni.has(npc.id)) continue;
      if (npc.x < reg.x || npc.y < reg.y || npc.x >= reg.x + mw || npc.y >= reg.y + mh) continue; // inny obszar
      if (!Exploration.isRevealed(reg.id, npc.x - reg.x, npc.y - reg.y)) continue;
      const px = left + ((npc.x - reg.x) / mw) * dispW;
      const py = top + ((npc.y - reg.y) / mh) * dispH;
      this.npcMarkers.add(this.scene.add.circle(px, py, 3, UI.goldNum, 1).setStrokeStyle(1, 0x000000, 0.8));
      const label = this.scene.add
        .text(px, py - 8, npc.name, textStyle({ fontSize: fontPx("small"), color: UI.goldLight, fontStyle: "bold", stroke: "#000000", strokeThickness: 3 }))
        .setOrigin(0.5, 1);
      // +2 px luzu — stykające się podpisy czytają się jako jedno słowo.
      const box = new Phaser.Geom.Rectangle(label.x - label.width / 2 - 2, label.y - label.height - 2, label.width + 4, label.height + 4);
      if (zajete.some((r) => Phaser.Geom.Intersects.RectangleToRectangle(r, box))) {
        label.destroy();
        continue;
      }
      zajete.push(box);
      podpisy.push(label);
    }
    this.npcMarkers.add(podpisy);
  }

  /**
   * Widok „Świat”: każdy obszar z `MAP_ATLAS` w swoim miejscu. Nieodwiedzony
   * obszar to czysty pergamin z obrysem i „?” — gracz wie, że TAM coś jest
   * i jak daleko, ale nie co.
   */
  private paintWorldMap(): void {
    this.mapTitle.setText("Świat");
    const A = this.mapArea;
    const parts: { id: string; x: number; y: number; w: number; h: number }[] = [];
    for (const a of MAP_ATLAS) {
      const size = regionSizePx(this.scene, a.id);
      if (size) parts.push({ id: a.id, x: a.x, y: a.y, w: size.w, h: size.h });
    }
    if (!parts.length) {
      this.paintMapLegend(true, 0);
      return;
    }
    const minX = Math.min(...parts.map((a) => a.x));
    const minY = Math.min(...parts.map((a) => a.y));
    const maxX = Math.max(...parts.map((a) => a.x + a.w));
    const maxY = Math.max(...parts.map((a) => a.y + a.h));
    // Margines pergaminu wokół świata: kartka nie ucina świata krawędzią.
    const margin = 12;
    const k = Math.min((A.w - 2 * margin) / (maxX - minX), (A.h - 2 * margin) / (maxY - minY));
    const left = A.x + (A.w - (maxX - minX) * k) / 2;
    const top = A.y + (A.h - (maxY - minY) * k) / 2;
    const toX = (wx: number): number => left + (wx - minX) * k;
    const toY = (wy: number): number => top + (wy - minY) * k;

    const ink = this.scene.add.graphics();
    let known = 0;
    let total = 0;
    const labels: Phaser.GameObjects.Text[] = [];
    for (const a of parts) {
      const key = fogTexture(this.scene, a.id);
      const x = Math.round(toX(a.x));
      const y = Math.round(toY(a.y));
      const dw = Math.round(a.w * k);
      const dh = Math.round(a.h * k);
      if (key) this.mapContent.add(this.scene.add.image(x, y, key).setOrigin(0).setDisplaySize(dw, dh));
      // Obrys czterema prostokątami, nie `strokeRect`: linia 1 j. przy
      // ułamkowym powiększeniu kamery UI gubiła pionowe boki (render 1:1).
      const t = 2;
      ink.fillStyle(PARCHMENT.outline, 0.5);
      ink.fillRect(x, y, dw, t).fillRect(x, y + dh - t, dw, t).fillRect(x, y, t, dh).fillRect(x + dw - t, y, t, dh);
      const frac = Exploration.fraction(a.id);
      known += frac * a.w * a.h;
      total += a.w * a.h;
      const name = frac > 0 ? (MAP_BY_ID[a.id]?.label ?? a.id) : "?";
      // Nazwa odwiedzonego obszaru pod GÓRNĄ krawędzią obrysu, nie na środku —
      // na środku zasłaniała odkryty rysunek i znacznik gracza (render 1:1).
      // „?” nieznanego obszaru zostaje na środku: tam nie ma czego zasłonić.
      labels.push(
        frac > 0
          ? this.scene.add
              .text(x + dw / 2, y + 4, name, textStyle({ fontSize: fontPx("body"), color: "#5e4630", fontStyle: "bold", stroke: "#e6d7b4", strokeThickness: 4 }))
              .setOrigin(0.5, 0)
          : this.scene.add
              .text(x + dw / 2, y + dh / 2, name, textStyle({ fontSize: fontPx("title"), color: "#5e4630", fontStyle: "bold", stroke: "#e6d7b4", strokeThickness: 4 }))
              .setOrigin(0.5),
      );
    }
    this.mapContent.add(ink);
    this.mapContent.add(labels);
    // ⭐ Cele zadań także w widoku „Świat” — z pamięci atlasu, więc z Gęstwiny
    // widać, że zadanie oddaje się w Zagajach.
    for (const [npcId, p] of this.atlasNpcs) {
      const mark = mapQuestMark(npcId);
      if (mark) this.npcMarkers.add(mapQuestIcon(this.scene, mark, toX(p.ax), toY(p.ay) + 4, 20));
    }
    this.paintMapLegend(true, total > 0 ? known / total : 0);

    // Gracz: obszar, w którym stoi, przesunięty o pozycję tego obszaru w atlasie.
    const reg = this.currentRegion();
    const at = MAP_ATLAS.find((a) => a.id === reg.id);
    if (at) {
      this.mapMarker.setPosition(toX(at.x + WorldState.playerX - reg.x), toY(at.y + WorldState.playerY - reg.y)).setVisible(true);
    }
  }

  /* ── Shared chrome ────────────────────────────────────────────────────── */

  /** HUD tracker tapped — open straight to the journal, ON the tracked quest
   *  (etap F: dziennik ma dziś zaznaczenie, więc tracker wskazuje kartę). */
  private onJournalRequested(): void {
    if (TrackedQuest.id) {
      this.selectedQuest = TrackedQuest.id;
      // Śledzone jest zawsze aktywne — tracker prowadzi na „Aktywne”.
      this.journalTab = "active";
    }
    if (this.open && this.activeTab === "quests") {
      this.refreshQuests(false);
      return;
    }
    this.openTo("quests");
  }

  /** Prośba z HUD-u o konkretną zakładkę (odznaka poziomu → POSTAĆ). Ta sama
   *  bramka rozmowy co minimapa i przycisk menu (`OI-52`). */
  private onPanelRequested(p: { tab: TabId }): void {
    if (KeyFocus.owner !== null && KeyFocus.owner !== "panel") return;
    if (this.open && this.activeTab === p.tab) return;
    this.openTo(p.tab);
  }

  private onDied(): void {
    this.playerDead = true;
    if (this.open) this.close();
  }

  private onRespawned(): void {
    this.playerDead = false;
  }

  protected reposition(): void {
    super.reposition();
    // Minimapa (wejście do panelu) rozstawia się sama na RESIZE.
    this.questsView?.refreshMasks();
    this.refreshGridMask();
    this.skillsView?.refreshMasks();
    this.weaponsView?.refreshMasks();
    this.bagStrip?.refreshMask();
    // ⚠ Maska ciała karty żyje w przestrzeni EKRANU: pozycja strony × skala.
    const s = this.container.scale;
    this.card?.refreshMask(
      this.container.x + this.inventoryPage.x * s,
      this.container.y + this.inventoryPage.y * s,
      s,
    );
  }
}

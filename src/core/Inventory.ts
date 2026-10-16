import { INVENTORY, CURRENCY } from "../config/GameConfig";
import { GameEvents, EVENT } from "./EventBus";
import { getItem, type ItemId, itemFootprint } from "./Items";
import {
  DEFAULT_QUALITY,
  buyPriceOf,
  hasDurability,
  makeInstance,
  qualityOf,
  sellPriceOf,
  type ItemInstance,
  type QualityLevel,
} from "./Quality";
import { Vitals } from "./Vitals";

/**
 * A backpack slot IS an item instance — see `ItemInstance` in Quality.ts for
 * why an item stopped being a bare id, and why `quality`/`durability` are
 * optional (that optionality is the whole save migration).
 *
 * Kept as a named alias rather than renaming every usage: the save file, the
 * `inventoryChanged` event and both panels all speak in "slots".
 */
export type InventorySlot = ItemInstance;

/**
 * The player's backpack: a fixed number of stacking slots plus a gold purse.
 * Module-level singleton for the same reason Progression is — it outlives any
 * single Player instance across death/respawn and (later) map transitions.
 */
class InventoryState {
  gold: number = CURRENCY.startingGold;
  slots: (InventorySlot | null)[] = new Array(INVENTORY.slots).fill(null);
  /**
   * Item bound to the HUD quick-action slot, or null.
   *
   * Deliberately an item *id*, not a backpack index: stacks move between slots
   * as things are added and removed, so an index would silently start pointing
   * at a different item. The binding also survives running out — the slot greys
   * out and re-arms when you restock, the way an action bar should.
   */
  quickSlot: ItemId | null = null;

  countItem(itemId: ItemId): number {
    return this.slots.reduce((sum, s) => (s && s.itemId === itemId ? sum + s.qty : sum), 0);
  }

  /** Max copies of `itemId` per slot: weapons, armor and containers never
   *  stack (each takes its own slot), everything else stacks up to
   *  `INVENTORY.stackSize`. */
  private maxStack(itemId: ItemId): number {
    const t = getItem(itemId).type;
    // Amulet nie stakuje się mimo że pierścienie tak: jest dziś dokładnie
    // jeden i jest trofeum z jednorazowej walki. Stos z liczbą nad ikoną
    // sugerowałby, że można mieć drugi. Torba z tego samego powodu co broń i
    // pancerz: dwie różne torby w jednym slocie ukryłyby jedną z nich.
    return t === "weapon" || t === "armor" || t === "amulet" || t === "container"
      ? 1
      : INVENTORY.stackSize;
  }

  /** Current backpack size — base plus whatever worn bags add. The single
   *  source of truth `Equipment` writes to via `setCapacity`; nothing else
   *  should assign `this.slots.length` directly. */
  /* ── GEOMETRIA SIATKI (gabaryt przedmiotu, 2026-09-18) ──────────────────
   *
   * ⚠⚠ **Magazyn zostaje PŁASKI.** `slots` to dalej jedna tablica, a przedmiot
   * leży w niej **wyłącznie pod swoją KOTWICĄ** (lewe górne pole). Pozostałe
   * pola, które zajmuje, są **WYPROWADZANE**, nigdy przechowywane — dzięki
   * temu nie istnieje stan, w którym „druga połowa" przedmiotu przeżyje jego
   * usunięcie, a **format zapisu nie zmienił się ani o pole**.
   * ⛔ Nie wkładaj do `slots` znaczników, kopii ani wskaźników na kotwicę.
   *
   * ⚠ Szerokość siatki czytamy z `INVENTORY.cols` — GEOMETRII MODELU. ⛔ Nigdy
   * z UI: tam liczba kolumn była zmienna (4/5/6 wg szerokości okna), więc ten
   * sam zapis układałby się inaczej na telefonie i na monitorze.
   */

  /** Szerokość siatki w polach. Stała modelu, nie układ ekranu. */
  get cols(): number {
    return INVENTORY.cols;
  }

  /** Liczba wierszy przy dzisiejszej pojemności; ostatni bywa NIEPEŁNY. */
  get rows(): number {
    return Math.ceil(this.capacity / this.cols);
  }

  /**
   * Pola, które zajmie przedmiot zakotwiczony w `anchor` — albo `null`, gdy
   * gabaryt **wychodzi poza siatkę**.
   *
   * ⚠ Dwie różne granice i obie są konieczne: prawa krawędź (kolumna kotwicy
   * plus szerokość nie może przekroczyć `cols`) i dolna (żadne pole nie może
   * wypaść poza `capacity`). ⭐ Ta druga załatwia też **niepełny ostatni
   * wiersz** — torby dodają 2, 4, 6 i 8 pól, więc pojemność bywa
   * niewielokrotnością czterech i nie ma potrzeby jej wyrównywać.
   */
  cellsFor(anchor: number, fp: { w: number; h: number } = { w: 1, h: 1 }): number[] | null {
    if (!Number.isInteger(anchor) || anchor < 0 || anchor >= this.capacity) return null;
    const cols = this.cols;
    if (anchor % cols + fp.w > cols) return null;
    const out: number[] = [];
    for (let dy = 0; dy < fp.h; dy++) {
      for (let dx = 0; dx < fp.w; dx++) {
        const cell = anchor + dy * cols + dx;
        if (cell >= this.capacity) return null;
        out.push(cell);
      }
    }
    return out;
  }

  /** Gabaryt przedmiotu leżącego pod tą kotwicą (`1×1`, gdy pole puste). */
  footprintAt(anchor: number): { w: number; h: number } {
    const inst = this.slots[anchor];
    return inst ? itemFootprint(inst.itemId) : { w: 1, h: 1 };
  }

  /**
   * Mapa `pole → kotwica`, budowana leniwie i unieważniana w `emitChanged()`.
   * ⚠ Ten sam wzorzec, co `Equipment.setBonusCache`: przez `emitChanged`
   * przechodzi **każda** zmiana plecaka, łącznie z tą, którą `Save.load()`
   * pisze wprost w `slots`.
   */
  private coverCache: (number | null)[] | null = null;

  private get cover(): (number | null)[] {
    if (this.coverCache) return this.coverCache;
    const mapa: (number | null)[] = new Array(this.capacity).fill(null);
    for (let a = 0; a < this.capacity; a++) {
      const inst = this.slots[a];
      if (!inst) continue;
      // ⚠ Gabaryt, który nie mieści się w dzisiejszej siatce (np. po zdjęciu
      //   torby), zajmuje wtedy **samą kotwicę** — stan jest tolerowany, nie
      //   naprawiany. Ta sama zasada, co `Equipment.normalizeHands`: akcję
      //   wolno odrzucić, stanu, który już istnieje — nie.
      const cells = this.cellsFor(a, itemFootprint(inst.itemId)) ?? [a];
      for (const c of cells) mapa[c] = a;
    }
    this.coverCache = mapa;
    return mapa;
  }

  /** Kotwica przedmiotu przykrywającego to pole, albo `null`. */
  anchorCovering(cell: number): number | null {
    return this.cover[cell] ?? null;
  }

  /** Czy pole jest wolne. `ignoreAnchor` pozwala pytać „wolne, gdybym najpierw
   *  podniósł TEN przedmiot" — bez tego przesunięcie o jedno pole w dół
   *  odbijałoby się od samego siebie. */
  isCellFree(cell: number, ignoreAnchor?: number): boolean {
    const a = this.anchorCovering(cell);
    return a === null || a === ignoreAnchor;
  }

  /** Czy gabaryt tego przedmiotu zmieści się kotwicą w `anchor`. */
  canPlaceAt(anchor: number, fp: { w: number; h: number }, ignoreAnchor?: number): boolean {
    const cells = this.cellsFor(anchor, fp);
    return cells !== null && cells.every((c) => this.isCellFree(c, ignoreAnchor));
  }

  /** Pierwsza kotwica, w której zmieści się ten gabaryt. `null` = nie ma miejsca. */
  firstFitFor(fp: { w: number; h: number }, ignoreAnchor?: number): number | null {
    for (let a = 0; a < this.capacity; a++) {
      if (this.canPlaceAt(a, fp, ignoreAnchor)) return a;
    }
    return null;
  }

  /**
   * Czy te gabaryty zmieszczą się PO KOLEI — first-fit, dokładnie tak, jak
   * położy je seria `addInstance` — gdyby najpierw podnieść całą kopię spod
   * pola `freed`? Czyste, niczego nie zmienia.
   *
   * ⚠⚠ **Po to, żeby zamiana w lalce nie niszczyła przedmiotu.** Do 2026-10-01
   * `Equipment.equipFromBag` zakładał wymianę jeden na jeden („zdjęta rzecz
   * wejdzie na pole zwolnione przez zakładaną"). Przy gabarytach to nieprawda:
   * sztylet zwalnia jedno pole, a miecz `1×2` potrzebuje dwóch jedno nad
   * drugim — przy pełnym plecaku `addInstance` odmawiało, wynik był
   * ignorowany i **miecz znikał** (zmierzone; tak samo pawęż za puklerz).
   * ⚠ Kolejność ma znaczenie i wołający MUSI potem kłaść w tej samej.
   */
  canFitAll(fps: { w: number; h: number }[], freed?: number): boolean {
    const freedAnchor = freed === undefined ? null : (this.anchorCovering(freed) ?? freed);
    // Podnoszona jest CAŁA kopia tylko wtedy, gdy to nie stos (`takeAt` zdejmuje
    // ze stosu jedną sztukę, a pole zostaje zajęte).
    const zwalnia = freedAnchor !== null && (this.slots[freedAnchor]?.qty ?? 0) === 1;
    const zajete: boolean[] = [];
    for (let c = 0; c < this.capacity; c++) {
      const a = this.anchorCovering(c);
      zajete.push(a !== null && !(zwalnia && a === freedAnchor));
    }
    for (const fp of fps) {
      let polozono = false;
      for (let a = 0; a < this.capacity && !polozono; a++) {
        const cells = this.cellsFor(a, fp);
        if (!cells || cells.some((c) => zajete[c])) continue;
        for (const c of cells) zajete[c] = true;
        polozono = true;
      }
      if (!polozono) return false;
    }
    return true;
  }

  get capacity(): number {
    return this.slots.length;
  }

  /** Free slots strictly before index `n` — what a caller shrinking capacity
   *  to `n` needs to know: is there room in the surviving region for
   *  whatever is about to be handed back (the bag coming off itself)? */
  freeSlotCountBelow(n: number): number {
    let count = 0;
    for (let i = 0; i < Math.min(n, this.slots.length); i++) {
      if (this.anchorCovering(i) === null) count++;
    }
    return count;
  }

  /**
   * Would `setCapacity(n)` succeed right now, without touching anything?
   * Growing always succeeds; shrinking is refused the moment any occupied
   * slot would fall outside the smaller size — items are NEVER moved or
   * dropped to make room (`docs/inventory_scroll_ux.md` §8).
   */
  canSetCapacity(n: number): boolean {
    if (n >= this.slots.length) return true;
    // ⚠ **`anchorCovering`, nie `slots[i] !== null`.** Przedmiot `1×2`
    //   zakotwiczony nad granicą ma pod nią pole PUSTE w tablicy, ale zajęte —
    //   zdjęcie torby ucięłoby mu drugą połowę.
    for (let i = n; i < this.slots.length; i++) {
      if (this.anchorCovering(i) !== null) return false;
    }
    return true;
  }

  /**
   * Grow or shrink the backpack to exactly `n` slots. Returns false (no
   * change at all) if `canSetCapacity(n)` would refuse — see there for why a
   * shrink can be refused. Callers that need to know WHY (to show a reason,
   * not just fail silently) check `canSetCapacity`/`freeSlotCountBelow`
   * themselves first; see `Equipment.bagUnequipRefusal`.
   */
  setCapacity(n: number): boolean {
    if (!this.canSetCapacity(n)) return false;
    if (n > this.slots.length) {
      this.slots = this.slots.concat(new Array(n - this.slots.length).fill(null));
    } else if (n < this.slots.length) {
      this.slots.length = n;
    } else {
      return true;
    }
    this.emitChanged();
    return true;
  }

  /**
   * May these two pile into one slot?
   *
   * Same item is no longer enough: **two copies of different workmanship are
   * different things** and merging them would silently destroy one of them's
   * quality. Anything that tracks durability is refused outright — two half-worn
   * swords cannot become one stack of two without inventing a durability for
   * the pile.
   *
   * In practice weapons and armour already have `maxStack` 1 so they never got
   * here anyway; this makes the rule explicit instead of accidental, which
   * matters the moment anything else grows a quality.
   */
  private stacksWith(slot: InventorySlot, itemId: ItemId, quality: QualityLevel): boolean {
    if (slot.itemId !== itemId) return false;
    if (hasDurability(itemId)) return false;
    return qualityOf(slot) === quality;
  }

  /**
   * Ile slotów jest pustych. Osobno od `hasRoomFor`, bo odpowiada na inne
   * pytanie: tamto pyta o JEDEN rodzaj przedmiotu i dolicza miejsce w
   * istniejących stosach, a bywa potrzebne „czy zmieszczą się DWIE różne
   * rzeczy naraz".
   *
   * ⚠ Dwa wywołania `hasRoomFor` po kolei na to nie odpowiedzą — każde
   * policzyłoby ten sam wolny slot jako swój. Dla broni i pancerza problem
   * znika, bo mają `maxStack` 1, a `stacksWith` odrzuca wszystko z
   * trwałością: **każda taka sztuka potrzebuje własnego pustego slotu**, więc
   * gołe liczenie pustych jest dokładną odpowiedzią. Pierwszy użytkownik:
   * zakładanie broni dwuręcznej, które musi odłożyć broń ORAZ tarczę
   * (`Equipment.equipFromBag`).
   */
  get freeSlotCount(): number {
    // ⚠ **Liczy POLA NIEPRZYKRYTE, nie `null`-e w tablicy.** Pole pod drugą
    //   połową przedmiotu `1×2` jest w `slots` puste, ale zajęte — i gdyby
    //   liczyło się jako wolne, każdy licznik miejsca kłamałby o jeden.
    let n = 0;
    for (let c = 0; c < this.capacity; c++) if (this.anchorCovering(c) === null) n++;
    return n;
  }

  /**
   * Would `addItem(itemId, qty, quality)` place all of it, with nothing left
   * over? Read-only — mirrors `addItem`'s own placement logic without
   * mutating anything.
   *
   * For a caller that must refuse rather than partially grant (a quest
   * reward, unlike ordinary loot): checking the RETURN VALUE of `addItem`
   * after the fact is too late, because whatever DID fit is already in the
   * bag by then — see `Quests.complete`, which needs a clean yes/no before it
   * commits to consuming the quest's collect-objective items.
   */
  hasRoomFor(itemId: ItemId, qty: number, quality: QualityLevel = DEFAULT_QUALITY): boolean {
    const max = this.maxStack(itemId);
    let remaining = qty;
    for (const slot of this.slots) {
      if (remaining <= 0) break;
      if (slot && this.stacksWith(slot, itemId, quality) && slot.qty < max) {
        remaining -= Math.min(max - slot.qty, remaining);
      }
    }
    if (remaining <= 0) return true;
    // ⚠ **Gabaryt: „ile wolnych pól" nie wystarczy.** Przedmiot `1×2` potrzebuje
    //   dwóch pól JEDNO NAD DRUGIM, a nie dwóch dowolnych. Liczymy więc, ile
    //   kotwic da się faktycznie postawić — na gabarycie `1×1` wychodzi z tego
    //   dokładnie stara liczba, więc dzisiejszy roster nie zmienia zachowania.
    const fp = itemFootprint(itemId);
    if (fp.w === 1 && fp.h === 1) return remaining <= this.freeSlotCount * max;
    let miejsc = 0;
    const zajete = new Set<number>();
    for (let a = 0; a < this.capacity && miejsc * max < remaining; a++) {
      const cells = this.cellsFor(a, fp);
      if (!cells) continue;
      if (cells.some((c) => zajete.has(c) || this.anchorCovering(c) !== null)) continue;
      for (const c of cells) zajete.add(c);
      miejsc++;
    }
    return remaining <= miejsc * max;
  }

  /**
   * Add up to `qty` of an item, stacking into existing slots first, then
   * spilling into empty ones. Returns how many could NOT be added — 0 means
   * everything fit, a partial or full backpack returns the remainder.
   */
  addItem(itemId: ItemId, qty: number, quality: QualityLevel = DEFAULT_QUALITY): number {
    let remaining = qty;
    const max = this.maxStack(itemId);

    for (const slot of this.slots) {
      if (remaining <= 0) break;
      if (slot && this.stacksWith(slot, itemId, quality) && slot.qty < max) {
        const take = Math.min(max - slot.qty, remaining);
        slot.qty += take;
        remaining -= take;
      }
    }
    // ⚠ **Pierwsza KOTWICA, w którą wejdzie gabaryt** — nie pierwszy `null`.
    //   Dla `1×1` to ta sama pętla, co przedtem, bo każde wolne pole jest wtedy
    //   poprawną kotwicą.
    const fp = itemFootprint(itemId);
    while (remaining > 0) {
      const anchor = this.firstFitFor(fp);
      if (anchor === null) break;
      const take = Math.min(max, remaining);
      this.slots[anchor] = makeInstance(itemId, take, quality);
      this.coverCache = null;
      remaining -= take;
    }
    if (remaining < qty) this.emitChanged();
    return remaining;
  }

  /**
   * Put a CONCRETE copy back in the bag, keeping its quality and its current
   * durability. This is what unequipping uses: routing it through `addItem`
   * would hand the player back a factory-fresh item, quietly repairing whatever
   * they had been fighting with.
   *
   * Returns false (and changes nothing) when there is no free slot.
   */
  addInstance(inst: InventorySlot): boolean {
    const free = this.firstFitFor(itemFootprint(inst.itemId));
    if (free === null) return false;
    this.slots[free] = inst;
    this.emitChanged();
    return true;
  }

  /** The copy in a specific slot, or null. */
  at(index: number): InventorySlot | null {
    return this.slots[index] ?? null;
  }

  /**
   * Lift one whole copy out of a specific slot and hand it over — identity,
   * quality and wear intact.
   *
   * Slot-addressed rather than id-addressed on purpose: once two swords in the
   * bag can differ, "remove a sword" is an ambiguous instruction and the UI
   * always knows exactly which one the player pointed at.
   */
  takeAt(index: number): InventorySlot | null {
    // ⚠ **Pole może być drugą połową przedmiotu `1×2`.** W `slots` jest tam
    //   `null`, więc bez tej linijki tapnięcie w dolny kafel nie robiłoby NIC —
    //   a gracz widzi tam przedmiot.
    const anchor = this.anchorCovering(index) ?? index;
    const slot = this.slots[anchor];
    if (!slot) return null;
    if (slot.qty > 1) {
      slot.qty -= 1;
      const one: InventorySlot = { ...slot, qty: 1 };
      this.emitChanged();
      return one;
    }
    this.slots[anchor] = null;
    this.emitChanged();
    return slot;
  }

  /** Remove up to `qty` of an item across slots. False (no change) if short. */
  removeItem(itemId: ItemId, qty: number): boolean {
    if (this.countItem(itemId) < qty) return false;
    let remaining = qty;
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId) {
        const take = Math.min(slot.qty, remaining);
        slot.qty -= take;
        remaining -= take;
        if (slot.qty <= 0) this.slots[i] = null;
      }
    }
    this.emitChanged();
    return true;
  }

  /**
   * Manual reordering: drag the contents of slot `from` onto slot `to`.
   *
   * Three outcomes, picked to match what a player dragging a stack expects:
   *   • empty target      → plain move
   *   • same item, room   → MERGE (top the target up, leave any remainder
   *                         behind — a partial stack must not vanish)
   *   • anything else     → swap the two slots, including two full stacks of
   *                         the same item and any weapon/armor pair (those have
   *                         maxStack 1, so "merge" would silently destroy one)
   *
   * Returns false without touching anything when there is nothing to do, so
   * callers can drop the result on the floor.
   */
  moveSlot(from: number, to: number): boolean {
    if (from === to) return false;
    if (from < 0 || to < 0 || from >= this.slots.length || to >= this.slots.length) return false;

    // ⚠ **Chwyt i cel mogą być DRUGĄ POŁOWĄ przedmiotu.** Źródło sprowadzamy
    //   do kotwicy; cel zostaje tam, gdzie palec — upuszczone pole staje się
    //   NOWĄ KOTWICĄ, dokładnie jak przy `1×1`.
    const srcAnchor = this.anchorCovering(from) ?? from;
    const src = this.slots[srcAnchor];
    if (!src) return false;
    if (srcAnchor === to) return false;

    const srcFp = itemFootprint(src.itemId);
    const celCells = this.cellsFor(to, srcFp);
    // ⛔ **Wychodzi poza siatkę → NIC się nie dzieje.** Żadnego przycinania,
    //   żadnego „przesunę o jedno pole w górę, to się zmieści" — akcja, która
    //   nie może się wykonać w całości, nie wykonuje się wcale.
    if (!celCells) return false;

    // Kto leży pod celem, nie licząc samego przenoszonego przedmiotu.
    const pod = new Set<number>();
    for (const c of celCells) {
      const a = this.anchorCovering(c);
      if (a !== null && a !== srcAnchor) pod.add(a);
    }

    // ⛔ **Więcej niż jeden przedmiot pod celem = odmowa.** Zamiana ma sens dla
    //   pary; przy trzech przedmiotach nie ma jednej poprawnej odpowiedzi,
    //   a zgadywanie zostawiłoby stan gorszy niż brak akcji.
    if (pod.size > 1) return false;

    if (pod.size === 0) {
      this.slots[srcAnchor] = null;
      this.slots[to] = src;
    } else {
      const dstAnchor = [...pod][0];
      const dst = this.slots[dstAnchor]!;
      if (
        // ⚠ Stakowanie tylko przy upuszczeniu **na kotwicę** — inaczej stos
        //   rósłby od dotknięcia cudzej drugiej połowy. Dziś stakują się same
        //   przedmioty `1×1`, więc ta gałąź zachowuje się jak przed zmianą.
        dstAnchor === to &&
        this.stacksWith(dst, src.itemId, qualityOf(src)) &&
        dst.qty < this.maxStack(src.itemId)
      ) {
        const take = Math.min(this.maxStack(src.itemId) - dst.qty, src.qty);
        dst.qty += take;
        src.qty -= take;
        if (src.qty <= 0) this.slots[srcAnchor] = null;
      } else {
        // ZAMIANA: drugi przedmiot musi zmieścić się tam, skąd wyszedł pierwszy.
        const dstFp = itemFootprint(dst.itemId);
        const wroci = this.cellsFor(srcAnchor, dstFp);
        if (!wroci) return false;
        const mieszcziSie = wroci.every((c) => {
          const a = this.anchorCovering(c);
          return a === null || a === srcAnchor || a === dstAnchor;
        });
        if (!mieszcziSie) return false;
        this.slots[srcAnchor] = null;
        this.slots[dstAnchor] = null;
        this.slots[to] = src;
        this.slots[srcAnchor] = dst;
      }
    }

    this.emitChanged();
    return true;
  }

  addGold(amount: number): void {
    if (amount <= 0) return;
    this.gold += amount;
    this.emitChanged();
  }

  spendGold(amount: number): boolean {
    if (amount <= 0 || this.gold < amount) return false;
    this.gold -= amount;
    this.emitChanged();
    return true;
  }

  /**
   * Sell `qty` of an item at its base sell price.
   *
   * Id-addressed, so it prices at the DEFAULT quality — correct for the stacking
   * materials and consumables this is used for, all of which are Zwykła by
   * definition. Selling a specific piece of gear goes through `sellAt`, which
   * knows which copy it is holding.
   */
  sell(itemId: ItemId, qty: number): boolean {
    if (!this.removeItem(itemId, qty)) return false;
    this.addGold(getItem(itemId).sellPrice * qty);
    return true;
  }

  /** Sell the copy sitting in a specific slot, priced for ITS workmanship. */
  sellAt(index: number, qty = 1): boolean {
    const slot = this.slots[index];
    if (!slot || qty <= 0 || slot.qty < qty) return false;
    const price = sellPriceOf(slot.itemId, qualityOf(slot)) * qty;
    slot.qty -= qty;
    if (slot.qty <= 0) this.slots[index] = null;
    this.addGold(price);
    this.emitChanged();
    return true;
  }

  /**
   * Buy `qty` of an item from the merchant (anything with a buyPrice —
   * consumables, weapons, armor; plain materials aren't merchant stock).
   * Spends gold first, then refunds whatever the backpack couldn't hold (so a
   * full backpack can't silently eat gold).
   */
  buy(itemId: ItemId, qty: number, quality: QualityLevel = DEFAULT_QUALITY): boolean {
    const def = getItem(itemId);
    if (!("buyPrice" in def)) return false;
    const unit = buyPriceOf(itemId, quality);
    if (!this.spendGold(unit * qty)) return false;
    const leftover = this.addItem(itemId, qty, quality);
    if (leftover > 0) this.addGold(unit * leftover);
    return leftover < qty;
  }

  /**
   * Consume one consumable from the backpack and fire its effect.
   *
   * Two flavours: an instant heal (potions) and a heal-over-time (food, which
   * only ticks out of combat — see Player.regenerate). The item decides which
   * by carrying `healAmount` or `healOverTime`; nothing here needs to know
   * about combat state.
   */
  useItem(itemId: ItemId): boolean {
    const def = getItem(itemId);
    if (def.type !== "consumable") return false;
    // Refusing at full HP lives HERE, not in the UI, because there are now two
    // ways in (backpack double-click and the quick slot) and a rule about
    // wasting an item belongs with the item, not with each button that uses it.
    // Callers re-check the same condition only to choose what message to show.
    if (this.wouldWasteHeal(itemId)) return false;
    if (!this.removeItem(itemId, 1)) return false;

    if ("healOverTime" in def) {
      // itemId rides along so the buff bar can label and illustrate the effect
      // with the food's own name and icon, rather than needing a second lookup
      // table that would drift out of sync with ITEMS.
      GameEvents.emit(EVENT.healOverTimeRequested, {
        amount: def.healOverTime.amount,
        durationMs: def.healOverTime.durationMs,
        itemId,
      });
    } else {
      GameEvents.emit(EVENT.healRequested, { amount: def.healAmount });
    }
    return true;
  }

  /**
   * True if using `itemId` right now would heal nothing and burn the item.
   * Reads Vitals rather than Progression on purpose: Progression pulls in
   * Equipment, which imports this module — that would be a circular import.
   * Vitals carries both hp and maxHp and has no imports of its own.
   */
  wouldWasteHeal(itemId: ItemId): boolean {
    const def = getItem(itemId);
    const heals = "healAmount" in def || "healOverTime" in def;
    return heals && Vitals.maxHp > 0 && Vitals.hp >= Vitals.maxHp;
  }

  /**
   * Take a share of carried gold — the death penalty. Returns how much was
   * actually lost, so the caller can tell the player instead of silently
   * shrinking the number in the corner.
   *
   * Floors rather than rounds, so a player with almost nothing loses nothing.
   */
  loseGoldFraction(fraction: number): number {
    const lost = Math.floor(this.gold * fraction);
    if (lost <= 0) return 0;
    this.gold -= lost;
    this.emitChanged();
    return lost;
  }

  /** Bind (or clear) the quick-action slot. Only consumables are bindable —
   *  the slot exists to fire something off mid-fight, not to swap gear. */
  setQuickSlot(itemId: ItemId | null): boolean {
    if (itemId !== null && getItem(itemId).type !== "consumable") return false;
    this.quickSlot = itemId;
    this.emitChanged();
    return true;
  }

  /** Use whatever the quick slot points at. False if it's empty, out of stock,
   *  or the use itself was refused (e.g. already at full HP). */
  useQuickSlot(): boolean {
    if (!this.quickSlot) return false;
    if (this.countItem(this.quickSlot) < 1) return false;
    return this.useItem(this.quickSlot);
  }

  reset(): void {
    this.gold = CURRENCY.startingGold;
    this.slots = new Array(INVENTORY.slots).fill(null);
    this.quickSlot = null;
    this.emitChanged();
  }

  emitChanged(): void {
    // ⚠⚠ **Bufor przykrycia ginie TUTAJ, bo przez tę metodę przechodzi KAŻDA
    //   zmiana plecaka** — łącznie z tą, którą `Save.load()` pisze wprost
    //   w `slots`, omijając wszystkie mutatory. Ten sam wzorzec i ten sam
    //   powód, co `Equipment.setBonusCache`.
    this.coverCache = null;
    GameEvents.emit(EVENT.inventoryChanged, {
      slots: this.slots,
      gold: this.gold,
      quickSlot: this.quickSlot,
    });
  }
}

export const Inventory = new InventoryState();

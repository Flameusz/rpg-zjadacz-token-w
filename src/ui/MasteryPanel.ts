import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { UI, fontPx, uiW, uiH } from "../core/theme";
import { PROFICIENCY, WEAPON_FAMILY } from "../config/GameConfig";
import { Equipment, type WeaponFamily } from "../core/Equipment";
import { Inventory } from "../core/Inventory";
import { Progression } from "../core/Progression";
import { WeaponProficiency, WEAPON_FAMILIES, type MasteryRank } from "../core/WeaponProficiency";
import type { NpcDef } from "../core/Npcs";
import { MASTERY_LABEL, familyRow, familySections, masteryCost, masteryRefusal } from "./WeaponFamilyCard";
import { PanelBase } from "./PanelBase";
import { serviceArea, subviewSize } from "./FrameLayout";
import { ListDetail, type ListCard } from "./ListDetail";
import { computeListDetailLayout, LIST_DETAIL, type ListDetailLayout } from "./ListDetailLayout";

/**
 * **MISTRZOSTWO BRONI — widok trenera.** `docs/systemy/proficiency.md`
 * (Mastery jako stan kupowany), §34.2 (cennik), §34.3 (sufit `P`),
 * §34.9 (D5: zakup u trenera).
 *
 * ⚠ **To jest JEDYNE miejsce w grze, w którym ranga zmienia właściciela.**
 * Panel BROŃ w `PlayerPanel` pokazuje ten sam stan i tę samą cenę, ale **nie
 * sprzedaje** — decyzja D5 mówi wprost: zakup u NPC-trenera, nie z panelu
 * postaci. Rozdzielenie jest treścią decyzji, nie układem okien.
 *
 * ⚠ **Jeden trener, nie system trenerów.** Kto sprzedaje, mówi
 * `PROFICIENCY.mastery.trainer` (dziś: Patryczek) i jest to JEDNA STAŁA,
 * świadomie nie pole w `NpcDef`. ⛔ Systemu trenerów **nie budujemy teraz**.
 *
 * ⚠ **Panel niczego nie liczy sam.** Cena, próg, sufit i powód odmowy
 * przychodzą z `WeaponProficiency.masteryOffer` — tej samej funkcji, z której
 * czyta panel BROŃ.
 *
 * ⭐ **Etap F (2026-10-13): lista + karta** (`ListDetail`, research §8 R6).
 * Karta rozdziela BIEGŁOŚĆ (ćwiczy się) od RANGI (kupuje się) sekcjami —
 * ta sama granica, którą niesie strona Postać → Broń. Do tej daty był tu
 * jeden `Text` z dziewięcioma liniami krojem 11 j.
 *
 * ⚠ **Blok playtestowy pod listą jest DEV-ONLY** (`import.meta.env.DEV`):
 * ustawia `P` i rangę **wprost, bez kosztu** — playtest warstwy 2 wciąż nie
 * został wykonany (§33.4). W buildzie produkcyjnym nie ma go wcale.
 */
export class MasteryPanel extends PanelBase {
  private open = false;
  /** ⚠ `WeaponFamily`, nie indeks — zakup przebudowuje spis, a przy indeksie
   *  karta podmieniłaby się pod ręką. Ta sama reguła co w `TrainerPanel`. */
  private selected: WeaponFamily = WEAPON_FAMILIES[0];
  private readonly L: ListDetailLayout;
  private readonly view: ListDetail;
  /** Przebudowywane przy każdym odświeżeniu — `makeButton` zamraża `enabled`
   *  w domknięciu. Wyłącznie blok DEV. */
  private devButtons: Phaser.GameObjects.Container[] = [];

  // ⚠ Bez `onBack` (etap C): wyjście z zakładki należy do szyny ramy.
  constructor(scene: Phaser.Scene) {
    const area = serviceArea(uiW(scene), uiH(scene));
    const size = subviewSize(area.w, area.h);
    super(scene, size.w, size.h, "frame");

    this.L = computeListDetailLayout(this.w, this.h);
    this.view = new ListDetail(scene, this.container, this.L, (id) => {
      this.selected = id as WeaponFamily;
      this.refresh(false);
    });

    // Zakup rusza złotem i punktami, biegłość rusza uprawnieniem, a broń
    // w ręku decyduje o zaznaczeniu — każde z tych trzech zmienia ten widok.
    GameEvents.on(EVENT.weaponProficiencyChanged, this.onChange, this);
    GameEvents.on(EVENT.equipmentChanged, this.onChange, this);
    GameEvents.on(EVENT.inventoryChanged, this.onChange, this);
    GameEvents.on(EVENT.attributesChanged, this.onChange, this);
    GameEvents.on(EVENT.xpChanged, this.onChange, this);

    this.reposition();

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.weaponProficiencyChanged, this.onChange, this);
      GameEvents.off(EVENT.equipmentChanged, this.onChange, this);
      GameEvents.off(EVENT.inventoryChanged, this.onChange, this);
      GameEvents.off(EVENT.attributesChanged, this.onChange, this);
      GameEvents.off(EVENT.xpChanged, this.onChange, this);
    });
  }

  /** ⚠ `NpcDef` przyjmowane i świadomie nieużywane: kto sprzedaje, rozstrzyga
   *  `PROFICIENCY.mastery.trainer` po stronie huba rozmowy — panel nie ma
   *  własnego zdania o trenerze. Sygnatura należy do `DialogView`. */
  show(_npc: NpcDef): void {
    this.open = true;
    // Wejście zaznacza rodzinę, którą gracz TRZYMA — po rangę idzie się dla
    // broni, którą się bije, a nie dla pierwszej pozycji listy.
    this.selected = Equipment.weaponFamily ?? this.selected;
    this.refresh(false);
    this.container.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.container.setVisible(false);
  }

  /** Powrót na zakładkę w tej samej rozmowie — wybór zostaje (etap C,
   *  research §4.2: stan zakładki trwa do końca rozmowy). */
  restore(): void {
    this.open = true;
    this.refresh();
    this.container.setVisible(true);
  }

  protected reposition(): void {
    super.reposition();
    this.view?.refreshMasks();
  }

  private onChange(): void {
    this.refresh();
  }

  private refresh(keepCardScroll = true): void {
    if (!this.open) return;
    this.view.setRows(WEAPON_FAMILIES.map((f) => familyRow(f)), this.selected);
    this.view.setCard(this.card(this.selected), "", keepCardScroll);

    for (const b of this.devButtons) b.destroy();
    this.devButtons = [];
    if (import.meta.env.DEV) this.addDevTools();
  }

  private card(family: WeaponFamily): ListCard {
    const oferta = WeaponProficiency.masteryOffer(family);
    const base = {
      title: WEAPON_FAMILY[family].label,
      subtitle: family === Equipment.weaponFamily ? "w ręku" : undefined,
      subtitleColor: UI.green,
      sections: familySections(family, "trainer"),
    };
    if (oferta.next === null) return base;
    return {
      ...base,
      wallet: { gold: Inventory.gold, spendGold: oferta.goldCost, points: Progression.skillPoints, spendPoints: oferta.pointCost },
      // Wyszarzony przycisk mówi, CZEGO brakuje — przy trzech niezależnych
      // warunkach „nie stać cię" jest zgadywanką.
      refusal: masteryRefusal(family),
      action: {
        label: `Odblokuj ${MASTERY_LABEL[oferta.next]} · ${masteryCost(family)}`,
        enabled: oferta.ready,
        onClick: () => {
          WeaponProficiency.unlockMastery(family);
          this.refresh();
        },
      },
    };
  }

  /**
   * ⚠⚠ **NARZĘDZIE PLAYTESTOWE — DEV-ONLY, DO USUNIĘCIA.** ⚠⚠
   *
   * Ustawia `P` i rangę **wprost, bez kosztu i bez krzywej nauki**, żeby dało
   * się wejść do walki przy `P = 0 / 25 / 50 / 100` i sprawdzić, jak warstwa 2
   * się czuje — playtest z §33.4 nadal nie został wykonany.
   *
   * ⚠ **`set` zaciska `P` do sufitu rangi** (§34.3), więc kolejność jest
   * nośna: najpierw ranga, potem biegłość.
   *
   * Stoi POD listą rodzin (pięć wierszy nie wypełnia kolumny), żeby nie
   * mieszać się z kartą, która jest grą.
   */
  private addDevTools(): void {
    const L = this.L;
    const progi: readonly number[] = PROFICIENCY.masteryThresholds;
    const top = L.list.y + WEAPON_FAMILIES.length * (LIST_DETAIL.rowH + LIST_DETAIL.rowGap) + 8;
    const w = L.list.w - LIST_DETAIL.scrollW - 6;
    if (top + 120 > L.list.y + L.list.h) return;

    this.devButtons.push(
      this.makeButton({
        x: L.list.x + w / 2,
        y: top + 12,
        w,
        h: 24,
        label: "narzędzie testowe — bez kosztu",
        fontSize: fontPx("small"),
        enabled: false,
        tone: "neutral",
        onClick: () => {},
      }),
    );

    // Rząd 1: ranga wprost (0…IV). Zakup jest w karcie i to on jest grą.
    const rangi: MasteryRank[] = [0, 1, 2, 3, 4];
    const rw = (w - 4 * 6) / rangi.length;
    rangi.forEach((r, i) => {
      this.devButtons.push(
        this.makeButton({
          x: L.list.x + rw / 2 + i * (rw + 6),
          y: top + 52,
          w: rw,
          h: 40,
          label: r === 0 ? "—" : MASTERY_LABEL[r],
          fontSize: fontPx("small"),
          tone: "neutral",
          onClick: () => {
            WeaponProficiency.setMastery(this.selected, r);
            this.refresh();
          },
        }),
      );
    });

    // Rząd 2: biegłość na progu / na kotwicach skali (§14a, §15).
    const wartosci = [0, PROFICIENCY.startNewFamily.veteran, progi[progi.length - 1]];
    const pw = (w - 2 * 6) / wartosci.length;
    wartosci.forEach((v, i) => {
      this.devButtons.push(
        this.makeButton({
          x: L.list.x + pw / 2 + i * (pw + 6),
          y: top + 98,
          w: pw,
          h: 40,
          label: `P = ${v}`,
          fontSize: fontPx("small"),
          tone: "neutral",
          onClick: () => {
            WeaponProficiency.set(this.selected, v);
            this.refresh();
          },
        }),
      );
    });
    for (const b of this.devButtons) this.container.add(b);
  }
}

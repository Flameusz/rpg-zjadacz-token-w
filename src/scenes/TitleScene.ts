import Phaser from "phaser";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Save, ALL_SLOTS, SLOT_LABEL, describeSlot, type SlotId, type LoadedWorld } from "../core/Save";
import { Progression } from "../core/Progression";
import { Inventory } from "../core/Inventory";
import { Equipment } from "../core/Equipment";
import { Quests } from "../core/Quests";
import { TrackedQuest } from "../core/TrackedQuest";
import { Exploration } from "../core/Exploration";
import { Skills } from "../core/Skills";
import { ArmorTraining } from "../core/ArmorTraining";
import { ShieldSkill } from "../core/ShieldSkill";
import { WeaponProficiency } from "../core/WeaponProficiency";
import { Abilities } from "../core/Abilities";
import { Dialogue } from "../core/Dialogue";
import { Gathering } from "../core/Gathering";
import { Session } from "../core/Session";
import { Settings, AIM_MODE_TEXT } from "../core/Settings";
import { INVENTORY } from "../config/GameConfig";
import { type ItemId } from "../core/Items";
import { qualityOf, type QualityLevel } from "../core/Quality";
import { UI, textStyle, uiW, uiH, applyUiCamera } from "../core/theme";

/**
 * Title screen — the one place that decides whether GameScene starts from a
 * save or from a wiped state. Shown once per page load, after BootScene
 * finishes loading assets and before GameScene/UIScene ever exist.
 *
 * Two views on one screen, swapped in place rather than stacked (`view`): the
 * menu, and the save-slot list. Same rule the NPC dialogue hub follows — a
 * second panel sliding over the first is where a phone player loses track of
 * where they are.
 *
 * "Kontynuuj" resumes the most recently written slot, which is usually but not
 * always the autosave. "Nowa gra" wipes **only the autosave** and every
 * persisted singleton before starting: the manual slots are the player's own
 * backups, and starting a fresh run is not a request to burn them. GameScene
 * itself never resets or loads anything on its own.
 */
export class TitleScene extends Phaser.Scene {
  private view: "menu" | "slots" | "settings" = "menu";

  constructor() {
    super("Title");
  }

  create(): void {
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  /** (Re)builds everything from scratch against the current screen size —
   *  simplest way to stay centred through a resize on a screen this sparse.
   *
   *  Przebudowa od zera znaczy też, że ta scena jako jedyna dostaje skalę UI
   *  w pełni na żywo: czcionki powstają na nowo przy każdej zmianie rozmiaru. */
  private layout(): void {
    this.children.removeAll(true);
    applyUiCamera(this);

    const width = uiW(this);
    const height = uiH(this);
    const cx = width / 2;

    this.add
      .text(
        cx,
        height / 2 - 140,
        "Nevermore",
        textStyle({ fontSize: "36px", color: UI.gold, fontStyle: "bold" }),
      )
      .setOrigin(0.5);

    if (this.view === "slots") this.layoutSlots(cx, height);
    else if (this.view === "settings") this.layoutSettings(cx, height);
    else this.layoutMenu(cx, height);
  }

  private layoutMenu(cx: number, height: number): void {
    const entries: { label: string; run: () => void }[] = [];
    const newest = Save.newestSlot();
    if (newest !== null) {
      entries.push({ label: "Kontynuuj", run: () => this.loadSlot(newest) });
    }
    // Offered on `hasAnySave`, not on `newest`: a slot holding a save this
    // build can't read still deserves to be visible and deletable, and hiding
    // the list would leave the player with no way to reach it at all.
    if (Save.hasAnySave()) {
      entries.push({ label: "Wczytaj grę", run: () => this.setView("slots") });
    }
    entries.push({ label: "Nowa gra", run: () => this.startFresh() });
    entries.push({ label: "Ustawienia", run: () => this.setView("settings") });
    // ⚠ Tylko w aplikacji (Android). Strona w przeglądarce nie może zamknąć
    // własnej karty (`window.close` działa wyłącznie na oknach otwartych
    // skryptem), więc przycisk, który nic nie robi, byłby gorszy niż żaden.
    // Bez potwierdzenia: autozapis leci przy każdej zmianie stanu, więc
    // wyjście z menu niczego nie traci.
    if (Capacitor.isNativePlatform()) {
      entries.push({ label: "Wyjdź z gry", run: () => void App.exitApp() });
    }

    // ⚠ Wyśrodkowane, ale nigdy wyżej niż 70 j. pod tytułem (`height/2 − 140`):
    // przy pięciu pozycjach (Android, z „Wyjdź z gry”) czysty środek wpychał
    // pierwszy przycisk na napis tytułu.
    const step = 58;
    const startY = Math.max(height / 2 - 70, height / 2 - ((entries.length - 1) * step) / 2);
    entries.forEach((e, i) => this.buildButton(cx, startY + i * step, e.label, e.run));
  }

  /**
   * One row per slot, each carrying enough to tell two characters apart:
   * level, gold, where they stood and how long they've been played. A bare
   * "Slot 2" list is unusable the moment there is more than one real run in it.
   */
  private layoutSlots(cx: number, height: number): void {
    const rowH = 56;
    const startY = height / 2 - 90;

    ALL_SLOTS.forEach((slot, i) => {
      const info = Save.describe(slot);
      const y = startY + i * (rowH + 8);
      const enabled = info !== null && info.compatible;

      const box = this.add
        .rectangle(cx, y, 320, rowH, UI.slotBg, 1)
        .setStrokeStyle(2, enabled ? UI.goldNum : 0x3a4058, enabled ? 0.9 : 0.5);
      if (enabled) box.setInteractive({ useHandCursor: true });

      this.add
        .text(
          cx - 145,
          y - 12,
          SLOT_LABEL[String(slot)],
          textStyle({ fontSize: "13px", color: enabled ? UI.gold : UI.muted, fontStyle: "bold" }),
        )
        .setOrigin(0, 0.5);
      this.add
        .text(
          cx - 145,
          y + 12,
          describeSlot(info),
          textStyle({ fontSize: "11px", color: enabled ? UI.text : UI.muted }),
        )
        .setOrigin(0, 0.5);

      if (enabled) {
        box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
          p.event.stopPropagation();
          this.loadSlot(slot);
        });
      }
    });

    this.buildButton(cx, startY + ALL_SLOTS.length * (rowH + 8) + 24, "Wstecz", () =>
      this.setView("menu"),
    );
  }

  /**
   * Ustawienia urządzenia (`core/Settings`, `OI-56`). Przełącznik pokazuje
   * STAN w napisie („Dźwięk: wł.”) — na dotyku nie ma najechania, więc kolor
   * ramki sam nie powie, w którą stronę zadziała tapnięcie.
   */
  private layoutSettings(cx: number, height: number): void {
    const onOff = (on: boolean) => (on ? "wł." : "wył.");
    const top = height / 2 - 60;
    this.buildButton(cx, top, `Dźwięk: ${onOff(Settings.sound)}`, () => {
      Settings.setSound(!Settings.sound);
      this.layout();
    });
    this.buildButton(cx, top + 64, `Odgłosy tła: ${onOff(Settings.ambient)}`, () => {
      Settings.setAmbient(!Settings.ambient);
      this.layout();
    }, Settings.sound);
    // ⭐ Sposób celowania umiejętnościami (2026-10-14) — patrz `Settings.aimMode`.
    this.buildButton(cx, top + 128, AIM_MODE_TEXT[Settings.aimMode].label, () => {
      Settings.setAimMode(Settings.aimMode === "drag" ? "tap" : "drag");
      this.layout();
    });
    this.buildButton(cx, top + 212, "Wstecz", () => this.setView("menu"));
  }

  private setView(v: "menu" | "slots" | "settings"): void {
    this.view = v;
    this.layout();
  }

  /** `bright: false` przygasza przycisk, ale go NIE wyłącza — „Odgłosy tła”
   *  przy wyciszonej grze dalej da się przestawić na później. */
  private buildButton(x: number, y: number, label: string, onClick: () => void, bright = true): void {
    const box = this.add
      .rectangle(x, y, 240, 48, 0x1c2030, 1)
      .setStrokeStyle(2, 0xffcc66, bright ? 0.9 : 0.35)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, textStyle({ fontSize: "16px", color: bright ? UI.white : UI.muted, fontStyle: "bold" }))
      .setOrigin(0.5);
    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      onClick();
    });
  }

  private loadSlot(slot: SlotId): void {
    const world = Save.load(slot);
    // Null only if the slot vanished or turned out to be incompatible between
    // painting the row and clicking it. Nothing was touched, so just re-render.
    if (!world) {
      this.setView("menu");
      return;
    }
    this.start(world);
  }

  private startFresh(): void {
    Save.clear("auto");
    Progression.reset();
    Inventory.reset();
    Equipment.reset();
    Quests.reset();
    // Po `Quests.reset()`, bo czyta z niego stan przy przesiewaniu — patrz
    // `TrackedQuest.restore`/`reset`. Nowa gra zaczyna bez śledzonego zadania;
    // pierwsze przyjęte samo się nim stanie.
    TrackedQuest.reset();
    Skills.reset();
    // Nowa postać nie zna okolicy: mapa i minimapa to czysty pergamin.
    Exploration.reset();
    // Nowa postać nie ma wykupionej ani jednej rangi treningu ciężkiego
    // pancerza — pełna kara obciążenia od pierwszego kilograma ponad próg.
    ArmorTraining.reset();
    ShieldSkill.reset();
    // Nowa postać nie umie żadnej rodziny broni — pierwsza, po którą sięgnie,
    // wystartuje od `PROFICIENCY.startNewFamily.fresh` (§14a).
    WeaponProficiency.reset();
    // `resetLoadout`, nie `reset` — to drugie czyści tylko cooldowny i jest
    // wołane przy każdym `create()` sceny (także po przejściu portalem), więc
    // celowo NIE rusza układu paska. Nowa gra ma zapomnieć i układ.
    Abilities.resetLoadout();
    Dialogue.reset();
    // Herb regrowth bookmarks AND which species have been discovered — without
    // this a new character would arrive already knowing every plant, and
    // Dorota would have nothing left to tell them.
    Gathering.reset();
    Session.reset();
    this.grantStartingGear();
    this.start({});
  }

  /**
   * Hand GameScene the loaded position, or nothing at all for a fresh run.
   *
   * The three fields are exactly what a portal passes, through the same door.
   * All three undefined — a fresh run, or a save written before slots existed —
   * leaves `GameScene.init` to apply its own fallbacks, which is precisely what
   * "Kontynuuj" always did. A pre-slots character last seen in the forest will
   * therefore wake up in the village; we genuinely don't know where they were,
   * and inventing a position would be worse than using the opening one.
   */
  private start(world: LoadedWorld): void {
    this.scene.start("Game", { mapId: world.mapId, spawn: world.spawn, hp: world.hp });
    this.scene.launch("UI");
  }

  /**
   * Hand a fresh run its `INVENTORY.startingItems` — **into the backpack, not
   * into the hand**, and that list is currently empty.
   *
   * Runs AFTER every reset above, not inside `Inventory.reset()` — the resets
   * are sequential and `Equipment.reset()` would strip anything equipped
   * earlier in the list.
   *
   * This used to grant the stick and equip it, because with no tutorial in
   * place a player starting bare-handed at 8 dps would read the game as broken.
   * `QUESTS.stick_in_hand` is that tutorial (`docs/swiat.md` §5.4) and the
   * Ojciec now hands the stick over himself — pre-equipping it would
   * auto-complete the first quest in the game before the player touched
   * anything, and merely putting it in the bag left it sellable into a dead
   * end. The loop is kept because the list is config, not a constant.
   */
  private grantStartingGear(): void {
    for (const id of INVENTORY.startingItems as readonly ItemId[]) {
      Inventory.addItem(id, 1);
    }
    // Strój na sobie (`INVENTORY.startingWorn`): przez plecak, bo zakładanie
    // jest adresowane slotem plecaka — ta sama droga co przeciągnięcie w UI,
    // z tymi samymi wymaganiami. Odmowa nie wywraca startu, tylko ostrzega.
    for (const { itemId, quality } of INVENTORY.startingWorn) {
      const id = itemId as ItemId;
      const q = quality as QualityLevel;
      Inventory.addItem(id, 1, q);
      const i = Inventory.slots.findIndex((s) => s?.itemId === id && qualityOf(s) === q);
      if (i < 0 || !Equipment.equipFromBag(i)) {
        console.warn(`[start] nie udało się założyć ${itemId} na start`);
      }
    }
  }
}

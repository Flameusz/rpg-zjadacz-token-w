import { TutorialGuide } from "../ui/TutorialGuide";
import Phaser from "phaser";
import { VirtualJoystick } from "../ui/VirtualJoystick";
import { AttackButton } from "../ui/AttackButton";
import { HUD } from "../ui/HUD";
import { RespawnPrompt } from "../ui/RespawnPrompt";
import { PlayerPanel } from "../ui/PlayerPanel";
import { NpcDialog } from "../ui/NpcDialog";
import { ContextAction } from "../ui/ContextAction";
import { QuestTracker } from "../ui/QuestTracker";
import { PracticeToast } from "../ui/PracticeToast";
import { BuffBar } from "../ui/BuffBar";
import { QuickSlot } from "../ui/QuickSlot";
import { AbilityBar } from "../ui/AbilityBar";
import { AttackModeButton } from "../ui/AttackModeButton";
import { WeaponSwapButton } from "../ui/WeaponSwapButton";
import { LowHealthVignette } from "../ui/LowHealthVignette";
import { CombatHint } from "../ui/CombatHint";
import { CoachMark } from "../ui/CoachMark";
import { applyUiCamera } from "../core/theme";
import { assertTouchTargets } from "../ui/ControlLayout";

/**
 * Overlay scene: HUD + touch controls. Runs in parallel on top of GameScene so
 * UI elements are never affected by the world camera scroll/zoom.
 */
export class UIScene extends Phaser.Scene {
  private joystick!: VirtualJoystick;
  private buffBar!: BuffBar;
  private abilityBar!: AbilityBar;
  private lowHealth!: LowHealthVignette;
  private hud!: HUD;
  /**
   * Held like the other UI pieces rather than constructed and forgotten. Public
   * because nothing inside this scene reads it — it exists so the conversation
   * can be reached from outside (debugging, and driving it in verification
   * runs), which a private field would only hide.
   */
  npcDialog!: NpcDialog;
  playerPanel!: PlayerPanel;

  constructor() {
    super("UI");
  }

  create(): void {
    // ⚠ MUSI być pierwsze. Każdy widżet czyta wirtualny rozmiar ekranu
    // (`uiW`/`uiH`) już w konstruktorze, a te dzielą przez współczynnik, który
    // ustawia dopiero to wywołanie. Wołane też przy RESIZE, bo obrót ekranu
    // zmienia krótszą oś — na Androidzie orientacja jest zablokowana, ale
    // okno przeglądarki na desktopie już nie.
    applyUiCamera(this);
    // Po `applyUiCamera`, bo dopiero ono ustawia skalę, w której te liczby coś
    // znaczą. Zapala się na czerwono, gdy któraś komórka zjedzie pod próg
    // dotykowy — sprawdzone celowym zepsuciem, patrz `assertTouchTargets`.
    assertTouchTargets();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    });

    // Before the HUD so it sits under the bars rather than over them.
    // Przed widżetami: przyciski zgłaszają swój dymek „pierwszego razu" już
    // przy budowie (np. drugi zestaw wczytany z zapisu).
    CoachMark.attach(this);
    this.lowHealth = new LowHealthVignette(this);
    this.hud = new HUD(this);
    // Continues the HUD's top-left readout column — see QuestTracker's header
    // for why it anchors to a fixed y rather than under the points line.
    new QuestTracker(this);
    // Znikające „+1 Władanie bronią: …" pod tą samą kolumną. Nasłuchuje
    // zdarzenia o ZDOBYTYM PUNKCIE — patrz nagłówek klasy.
    new PracticeToast(this);
    this.joystick = new VirtualJoystick(this);
    new AttackButton(this);
    new QuickSlot(this);
    this.abilityBar = new AbilityBar(this);
    // Tryb ataku: jeden przycisk na zewnętrznym łuku, wybór w rozwijanej
    // kolumnie; zmiana zestawu broni — tylko gdy drugi zestaw nie jest pusty.
    new AttackModeButton(this);
    new WeaponSwapButton(this);
    new RespawnPrompt(this);
    // Pole, nie sam `new`: panel jest sięgany ze scenariuszy renderu 1:1
    // (`tools/phone_render_frame.json`), tak samo jak `npcDialog`.
    this.playerPanel = new PlayerPanel(this);
    // Owns the whole NPC interaction: it builds the shop / quest / trainer
    // views itself and switches between them (see NpcDialog).
    this.npcDialog = new NpcDialog(this);
    // The one button/`E` for npc/campfire/gather — see ContextAction's header.
    new ContextAction(this);
    this.buffBar = new BuffBar(this);
    // One-shot "tap an enemy, tap ⚔" banner — no-ops after the first time
    // it's ever shown in this browser. See CombatHint's own header for why
    // it lives last/standalone rather than folded into any other widget.
    new CombatHint(this);
    new TutorialGuide(this);
  }

  /**
   * ⚠ Przelicza tylko KAMERĘ. Rozmiary czcionek już utworzonych napisów zostają
   * takie, jakie były w chwili tworzenia — widżety rozstawiają się ponownie
   * (mają własne `reposition`), ale nie przebudowują się od zera. Na telefonie
   * to nie ma znaczenia (orientacja zablokowana w manifeście); na desktopie
   * mocna zmiana rozmiaru okna domyka się dopiero przy restarcie sceny.
   */
  private onResize(): void {
    applyUiCamera(this);
  }

  update(): void {
    this.joystick.update();
    // Buff countdowns animate here rather than off events — see BuffBar.
    // UIScene keeps running while GameScene is paused by a panel, so the
    // timer is read from the (frozen) snapshot and simply holds still.
    this.buffBar.update();
    this.abilityBar.update();
    // Heartbeat pulse; same snapshot-not-events split as the buff countdown.
    this.lowHealth.update();
    // Znacznik biegu przy pasku wysiłku — ten sam podział co wyżej: stan biegu
    // zmienia się przy każdym drgnięciu kciuka na granicy stref drążka.
    this.hud.update();
  }
}

import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { TrackedQuest } from "../core/TrackedQuest";
import { guidanceFor, guidanceText, questTitle } from "../core/QuestGuidance";
import { UI, textStyle } from "../core/theme";
import { HUD_LAYOUT } from "../config/GameConfig";

/**
 * The always-on quest tracker: **one** quest, **two** lines.
 *
 *     Plaga królików
 *     Ubij: Królik 4/5
 *
 * ...and once the last objective lands:
 *
 *     Plaga królików
 *     ✓ Wróć do Hanny
 *
 * ── What it does not do ───────────────────────────────────────────────────
 * No description, no full objective list, no second quest. The journal is
 * where a quest is READ; this is what stops the player having to open it to
 * remember what they were doing. Everything it says comes from
 * `core/QuestGuidance` — it neither knows nor decides what the next step is.
 *
 * ── Placement ─────────────────────────────────────────────────────────────
 * Under the HP/XP/stamina/gold block, continuing the top-left column that is
 * already this game's "read this" zone. Two consequences worth writing down:
 *
 *  • **Fixed `y`, not "below the points line".** `HUD.pointsText` is hidden
 *    at zero unspent points, so anchoring to it would make the tracker hop
 *    up and down as the player levels and spends.
 *  • **It is in the joystick's half, and that is safe for one specific
 *    reason**: `VirtualJoystick.onDown` runs `hitTestPointer` before claiming
 *    a touch, so an INTERACTIVE object here takes the tap instead of placing
 *    the stick under it. It costs a small dead zone for stick placement, in
 *    the top corner, which is about as far from a steering thumb as this
 *    screen gets.
 */
export class QuestTracker {
  private readonly container: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly hit: Phaser.GameObjects.Rectangle;
  private readonly title: Phaser.GameObjects.Text;
  private readonly step: Phaser.GameObjects.Text;
  private playerDead = false;

  /**
   * Last text/colour actually applied.
   *
   * ⚠ **`questsChanged` fires on every pickup and every kill**, and
   * `Text.setColor` redraws the text canvas and re-uploads the texture EVERY
   * time — unlike `setText`, which Phaser skips when the string is equal (see
   * `src/ui/CLAUDE.md`). Without this the tracker would repaint two labels
   * every time the player picked a flower.
   */
  private painted: { title: string; step: string; color: string } | null = null;

  private readonly x = 16;
  /** Below gold (≈71) and the points line (≈89–104), with room to spare. */
  private readonly y = 116;
  /** ⚠ Maksimum, nie szerokość. Tło i pole dotykowe zwężają się do TEKSTU —
   *  patrz `resize`. Przy 210 j. na sztywno tracker odbierał gałce pas przez
   *  jedną szóstą ekranu, także wtedy, gdy krok miał trzy słowa. */
  private readonly wrapW = 200;
  private readonly padX = 7;
  private readonly padY = 5;

  constructor(scene: Phaser.Scene) {
    const depth = 900;
    this.container = scene.add
      .container(this.x, this.y)
      .setScrollFactor(0)
      .setDepth(depth)
      .setVisible(false);

    /**
     * ⚠ **Tło jest tu dla CZYTELNOŚCI, nie dla ozdoby** — a przy okazji
     * załatwia to, żeby „widoczny tracker" i „to, co da się nacisnąć" były tym
     * samym prostokątem. Napisy HUD-u leżą na mapie, a mapa to jasna trawa;
     * złoty tytuł i biały krok na niej same z siebie mają kiepski kontrast.
     * Bez obrysu i przy niskiej alfie — to ma być podkładka, nie ramka.
     */
    this.bg = scene.add
      .rectangle(0, 0, 10, 10, UI.bg, 0.55)
      .setOrigin(0, 0);
    /**
     * ⚠ **Tytuł jest CICHSZY od kroku, i to jest odwrócenie pierwszej wersji.**
     * Tam tytuł był większy, pogrubiony i złoty, a krok mniejszy i szary —
     * czyli mocniej krzyczała nazwa zadania, którą gracz zna, niż zdanie
     * mówiące, co ma teraz zrobić. Podczas biegu czyta się dokładnie jedną
     * linię i to ma być ta druga.
     */
    this.title = scene.add
      .text(0, 0, "", textStyle({ fontSize: "10px", color: UI.muted, wordWrap: { width: this.wrapW } }))
      .setOrigin(0, 0);
    this.step = scene.add
      .text(0, 0, "", textStyle({ fontSize: "12px", color: UI.white, fontStyle: "bold", wordWrap: { width: this.wrapW } }))
      .setOrigin(0, 0);
    /**
     * ⚠ **Osobne od tła WYŁĄCZNIE po to, żeby dołożyć WYSOKOŚCI, nigdy
     * szerokości.** Zarzut do poprzedniej wersji dotyczył pasa zabranego
     * gałce w poziomie, więc szerokość jest co do piksela szerokością tła
     * (patrz `resize`); w pionie pole dorasta do `HUD_LAYOUT.minTouch`, bo to
     * jest kontrolka, którą gracz naciska, a dwie linijki tekstu mają ~30 j.
     * przy progu 68. Nadmiar wychodzi w górę i w dół w pas, w którym nie ma
     * niczego innego.
     */
    this.hit = scene.add
      .rectangle(0, 0, 10, HUD_LAYOUT.minTouch, 0x000000, 0)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    this.container.add([this.bg, this.hit, this.title, this.step]);

    this.hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      GameEvents.emit(EVENT.questJournalRequested);
    });

    // `questsChanged` alone covers progress of every objective kind: kills and
    // conversations emit it directly, and `Quests` re-emits it from its own
    // `inventoryChanged`/`equipmentChanged` listeners, which is what makes
    // `collect`/`equip` progress land here too. No per-frame polling.
    GameEvents.on(EVENT.questsChanged, this.refresh, this);
    GameEvents.on(EVENT.trackedQuestChanged, this.refresh, this);
    GameEvents.on(EVENT.playerDied, this.onDied, this);
    GameEvents.on(EVENT.playerRespawned, this.onRespawned, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.questsChanged, this.refresh, this);
      GameEvents.off(EVENT.trackedQuestChanged, this.refresh, this);
      GameEvents.off(EVENT.playerDied, this.onDied, this);
      GameEvents.off(EVENT.playerRespawned, this.onRespawned, this);
    });

    this.refresh();
  }

  private onDied(): void {
    this.playerDead = true;
    this.container.setVisible(false);
  }

  private onRespawned(): void {
    this.playerDead = false;
    this.refresh();
  }

  private refresh(): void {
    const id = TrackedQuest.id;
    const guidance = id ? guidanceFor(id) : { kind: "none" as const };
    if (!id || guidance.kind === "none" || this.playerDead) {
      this.container.setVisible(false);
      return;
    }

    const title = questTitle(id);
    const ready = guidance.kind === "turnIn";
    // Etykietę składa `guidanceText`, nie ten widżet — patrz `QuestGuidance`.
    const line = guidanceText(guidance);
    /**
     * ⚠ **Gotowe do oddania musi wyglądać INACZEJ, nie tylko mówić co innego.**
     * „Zbierz: Mięso 4/5" i „Wróć do: Myśliwy" różniły się wcześniej wyłącznie
     * treścią — ten sam kolor, ten sam kształt, więc przejście z „zbieraj" na
     * „masz komplet, idź oddać" nie rzucało się w oczy w biegu. Dwa sygnały
     * naraz i oba z istniejącego języka UI: **znacznik ✓** (ten sam, którym
     * dziennik oznacza wykonane cele) i **`UI.green`** (ten sam, którym
     * `NpcStatus` maluje „?" nad głową dawcy). Zero nowej palety.
     */
    const step = ready ? `✓ ${line}` : line;
    const color = ready ? UI.green : UI.white;

    this.container.setVisible(true);
    if (this.painted && this.painted.title === title && this.painted.step === step && this.painted.color === color) {
      return;
    }
    this.painted = { title, step, color };
    this.title.setText(title);
    this.step.setText(step).setColor(color);
    this.resize();
  }

  /**
   * Dociśnij tło i pole dotykowe do TEKSTU, który właśnie stanął.
   *
   * ⚠ Szerokość liczona z faktycznych napisów, nie ze stałej: `wrapW` jest
   * sufitem zawijania, a nie szerokością widżetu. Krok „Porozmawiaj: Kuba"
   * ma zajmować tyle, ile zajmuje — pas 200 j. rezerwowany na najdłuższy
   * możliwy tekst byłby przez większość gry pusty, a i tak odbierałby
   * tapnięcia gałce.
   */
  private resize(): void {
    const w = Math.ceil(Math.max(this.title.width, this.step.width)) + this.padX * 2;
    const h = Math.ceil(this.title.height + this.step.height) + this.padY * 2 + 2;
    this.title.setPosition(this.padX, this.padY);
    this.step.setPosition(this.padX, this.padY + this.title.height + 2);
    this.bg.setSize(w, h);
    // Ta sama szerokość co tło, wyśrodkowane w pionie na nim — patrz komentarz
    // przy budowie `hit`.
    this.hit.setSize(w, HUD_LAYOUT.minTouch);
    this.hit.setPosition(0, h / 2);
  }
}

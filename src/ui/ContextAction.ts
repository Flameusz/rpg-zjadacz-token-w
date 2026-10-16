import Phaser from "phaser";
import { GameEvents, EVENT } from "../core/EventBus";
import { UI, textStyle } from "../core/theme";
import type { InteractKind } from "../core/Interactables";
import { hitCircle, slotOf, visualOf } from "./ControlLayout";
import { KeyFocus } from "./KeyFocus";

/** Presentational only — no execution meaning. See the class header for why
 *  this is the one place a kind is allowed to appear in this file. */
const ICON: Record<InteractKind, string> = {
  npc: "💬",
  campfire: "🔥",
  gather: "✋",
};

/**
 * Fonts that actually carry colour emoji glyphs. `textStyle`'s default
 * (`monospace`, generic) is why the first version of this button showed a
 * blank square instead of 💬/🔥/✋ — a generic family name has no obligation
 * to include emoji at all, and on the tested renderer it didn't. Used ONLY
 * for the icon glyph; every other label in this widget stays on the theme's
 * normal font.
 */
const EMOJI_FONT = "'Noto Color Emoji', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";

/**
 * The single contextual-action button for `npc`/`campfire`/`gather` — one
 * widget where `NpcDialog`'s own prompt, `CampfirePrompt` and `GatherPrompt`
 * used to be three separate `WorldPrompt` instances, each independently
 * gating on `interactableNearby` and each independently binding `keydown-E`.
 *
 * ⚠ **This widget knows NOTHING about what a kind means.** `GameScene`
 * (`describeInteractable`) decides the label and whether the action would
 * currently succeed; this only displays that and forwards "activate" as an
 * event, exactly like a tap on the object itself does. Adding a future kind
 * (chest, door, quest object) is adding a case to that switch in GameScene —
 * this file changes only if it also needs a new icon glyph.
 *
 * ── Layout, twice revised on playtest feedback ────────────────────────────
 * v1 drew one rectangle sized to the fixed `context` cell with the label
 * wrapped inside it — looked like a debug tooltip in a HUD otherwise made of
 * circles, and a name wrapped illegibly across two cramped lines. v2 kept a
 * full-cell circle but put the label in its own box ABOVE it — better, but
 * still the heaviest-looking button in the cluster for its least-frequent
 * control (see `HUD_LAYOUT.visual.context`'s comment), and reading order was
 * "name, then icon" from the top, backwards from how the rest of the HUD
 * reads. This version:
 *
 *  • **`hit`** (from `hitCircle`) — the actual touch target, invisible, full
 *    `context` cell. Fixed, and has to stay fixed: `ControlLayout`'s
 *    geometry is hand-verified against every neighbour
 *    (`tools/hud_uklad.mjs`), and a hit box that grows with the label could
 *    silently re-collide with the middle/outer rings the moment an NPC
 *    has a long name.
 *  • **`frame`/`icon`** — drawn at `visualOf("context")`, the same weight
 *    as the attack-mode button (`HUD_LAYOUT.visual`) — both are rare
 *    controls, neither may weigh what an ability does.
 *  • **`caption`** — a single-line label to the LEFT of the icon, vertically
 *    centred on it, growing leftward into the wide-open band at this
 *    anchor's height (nothing else in the cluster sits up there — see the
 *    `context` ring's comment in `GameConfig.ts`). Unlike `hit`, this is not
 *    interactive, so it is free to size itself to the text without risking
 *    the geometry check.
 */
export class ContextAction {
  private readonly container: Phaser.GameObjects.Container;
  private readonly hit: Phaser.GameObjects.Arc;
  private readonly frame: Phaser.GameObjects.Arc;
  private readonly icon: Phaser.GameObjects.Text;
  private readonly captionBg: Phaser.GameObjects.Rectangle;
  private readonly caption: Phaser.GameObjects.Text;
  private kind: InteractKind | null = null;
  private enabled = false;
  private playerDead = false;

  /** Cap, not a target width — keeps even the longest real string (the
   *  campfire's "Ognisko — wymaga: Zielarstwo") from reaching offscreen; most
   *  labels are well under this and stay on one line. */
  private static readonly CAPTION_MAX_W = 300;
  private static readonly CAPTION_GAP = 10;

  constructor(private readonly scene: Phaser.Scene) {
    const visual = visualOf("context");
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000).setVisible(false);

    this.hit = hitCircle(scene, "context");
    this.frame = scene.add.circle(0, 0, visual / 2, UI.slotBg, 0.85).setStrokeStyle(2, UI.goldNum, 0.85);
    this.icon = scene.add
      .text(0, 0, "", textStyle({ fontSize: `${Math.round(visual * 0.55)}px`, fontFamily: EMOJI_FONT }))
      .setOrigin(0.5);

    // To the LEFT of the icon, vertically centred — anchored past the visible
    // frame's edge so it reads "label, then icon" left-to-right, same order
    // as the rest of this game's UI.
    const anchorX = -(visual / 2) - ContextAction.CAPTION_GAP;
    this.captionBg = scene.add.rectangle(anchorX, 0, 0, 0, UI.bg, 0.75).setStrokeStyle(1, UI.goldNum, 0.6);
    this.caption = scene.add
      .text(
        anchorX,
        0,
        "",
        textStyle({
          // 12px → 13.5px (+12.5%): the label now names just the object
          // ("Hanna", "Ognisko", the herb's species), never the verb, so it
          // reads shorter and had headroom to grow a bit — see
          // GameScene.describeInteractable's header for the split.
          fontSize: "13.5px",
          color: UI.gold,
          align: "right",
          wordWrap: { width: ContextAction.CAPTION_MAX_W - 14 },
        }),
      )
      .setOrigin(1, 0.5);

    this.container.add([this.captionBg, this.hit, this.frame, this.icon, this.caption]);

    // Tap the button — same "activate" as `E`, see EventBus.contextActionRequested.
    this.hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.activate();
    });
    // The one remaining `keydown-E` for interaction-activation — replaces the
    // three independent bindings this widget's predecessors each had.
    // ⚠ Tylko gdy ekran należy do ŚWIATA i nikt tego naciśnięcia nie zużył
    // (`OI-52`): rozmowa zamykana `E` otwierała się w tym samym naciśnięciu
    // z powrotem, a przy otwartym panelu `E` zaczynało rozmowę pod nim.
    scene.input.keyboard?.on("keydown-E", (e: KeyboardEvent) => {
      if (!KeyFocus.worldMay(e)) return;
      this.activate();
    });

    GameEvents.on(EVENT.interactableNearby, this.onNearby, this);
    GameEvents.on(EVENT.playerDied, this.onDied, this);
    GameEvents.on(EVENT.playerRespawned, this.onRespawned, this);

    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      GameEvents.off(EVENT.interactableNearby, this.onNearby, this);
      GameEvents.off(EVENT.playerDied, this.onDied, this);
      GameEvents.off(EVENT.playerRespawned, this.onRespawned, this);
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });

    this.reposition();
  }

  /** Greyed-out means the same as everywhere else in this game (see
   *  `src/ui/CLAUDE.md`): visible, with the reason, and a tap does nothing —
   *  never emit for a kind that isn't actually actionable right now. */
  private activate(): void {
    if (!this.kind || !this.enabled || this.playerDead) return;
    GameEvents.emit(EVENT.contextActionRequested);
  }

  private onNearby(p: { kind: InteractKind | null; key: string | null; label: string; enabled: boolean }): void {
    this.kind = p.kind;
    this.enabled = p.enabled;
    this.refresh(p.label);
  }

  private onDied(): void {
    this.playerDead = true;
    this.container.setVisible(false);
  }

  private onRespawned(): void {
    this.playerDead = false;
  }

  private refresh(text: string): void {
    const visible = this.kind !== null && !this.playerDead;
    this.container.setVisible(visible);
    if (!visible || !this.kind) return;

    const color = this.enabled ? UI.gold : UI.muted;
    const stroke = this.enabled ? UI.goldNum : 0x556074;

    this.icon.setText(ICON[this.kind]);
    this.frame.setStrokeStyle(2, stroke, 0.85);
    this.caption.setText(text).setColor(color);
    this.captionBg.setStrokeStyle(1, stroke, 0.6);
    this.captionBg.setSize(this.caption.width + 14, this.caption.height + 8);
    // Origin (1, 0.5) on the text means its own x already anchors the right
    // edge; the background needs its centre pulled back to the middle of
    // that same span, which shifts left as the label gets shorter.
    this.captionBg.setPosition(this.caption.x - this.caption.width / 2, 0);
  }

  private reposition(): void {
    const p = slotOf(this.scene, "context", 0);
    if (p) this.container.setPosition(p.x, p.y);
  }
}

import Phaser from "phaser";
import { textStyle, worldTextStyle } from "./theme";

/**
 * Small, self-cleaning visual effects shared by the gameplay scene: floating
 * combat/loot labels and expanding rings. Each was copy-pasted at several call
 * sites ("add object → tween → destroy on complete"); centralising them means a
 * tweak to the feel lands everywhere at once.
 */

export interface FloatingTextOptions {
  x: number;
  y: number;
  text: string;
  /** CSS colour string. Default white. */
  color?: string;
  /** Font size in px. Default 11. */
  fontSize?: number;
  /** Bold weight (used by crits). Default false. */
  bold?: boolean;
  /** How far up the label drifts, in px. Default 24. */
  rise?: number;
  /** Fade/rise duration in ms. Default 700. */
  duration?: number;
  /** Render depth — callers pass a Y-sorted value so popups layer sensibly. */
  depth?: number;
  /** A quick scale bounce for emphasis (used by crits). Default false. */
  pulse?: boolean;
  /**
   * Wołane, gdy napis skończył się i został ZNISZCZONY.
   *
   * ⚠ Istnieje dla wołających, którzy układają napisy w stos i muszą wiedzieć,
   * kiedy zwolnić miejsce (`ui/PracticeToast`). Bez tego jedyną alternatywą
   * byłby własny timer o tej samej długości co tween — czyli druga kopia
   * czasu trwania, gotowa rozjechać się przy pierwszej zmianie `duration`.
   */
  onDone?: () => void;
  /**
   * Wrap the label at this width (px). Unset = one line, which is right for
   * every number and item name here — and wrong for the one caller that shows
   * a whole sentence (the herb fact on a first pick), which would otherwise
   * render as a single line wider than the screen.
   */
  wrapWidth?: number;
  /**
   * Hold at full opacity for this long before starting to rise and fade (ms).
   *
   * Default 0, which is the right feel for a damage number: it exists to be
   * *glimpsed*. A label carrying a sentence has to be **read**, and fading it
   * from the first frame means it is half gone by the time the reader is
   * halfway through.
   */
  hold?: number;
  /**
   * Texture drawn to the LEFT of the text, vertically centred on it.
   *
   * Exists for the damage number's type icon (miecz / włócznia / młot) and is
   * deliberately a texture rather than a character in the string: the shared
   * font is `monospace`, i.e. a SYSTEM font, so an emoji would render from the
   * platform's fallback face — full colour, rounded, different on every device,
   * and not monospace-wide. See `ASSETS.damageTypeIcons`.
   *
   * When set, the label becomes a Container (icon + text) instead of a bare
   * Text; everything else about the tween is identical, so callers that don't
   * pass an icon pay nothing.
   */
  iconKey?: string;
}

/** Spawn a floating label that rises, fades, and cleans itself up. */
export function floatingText(scene: Phaser.Scene, opts: FloatingTextOptions): void {
  const rise = opts.rise ?? 24;
  const duration = opts.duration ?? 700;

  const label = scene.add
    .text(
      opts.x,
      opts.y,
      opts.text,
      // ⚠ Ta funkcja obsługuje OBIE strony — liczby obrażeń w świecie i
      // komunikaty ze slotu Q w scenie UI — a każda z nich chce innej
      // rozdzielczości tekstu (patrz `textStyle` / `worldTextStyle`). Scenę i
      // tak dostaje w argumencie, więc pyta jej kamerę zamiast zgadywać:
      // kamera UI zmniejsza (zoom < 1 w jednostkach logicznych panelu),
      // kamera świata powiększa.
      (scene.scene.key === "Game" ? worldTextStyle : textStyle)({
        fontSize: `${opts.fontSize ?? 11}px`,
        color: opts.color ?? "#ffffff",
        fontStyle: opts.bold ? "bold" : "normal",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
        ...(opts.wrapWidth ? { wordWrap: { width: opts.wrapWidth } } : {}),
      }),
    )
    .setOrigin(0.5);

  // With an icon the whole thing is one Container so a single tween still moves
  // and fades both parts together — and `pulse`, which scales its target, keeps
  // scaling icon and number as one object rather than drifting them apart.
  let target: Phaser.GameObjects.GameObject & {
    setDepth(v: number): unknown;
    destroy(): void;
  } = label;

  if (opts.iconKey && scene.textures.exists(opts.iconKey)) {
    const icon = scene.add.image(0, 0, opts.iconKey).setOrigin(0.5);
    const gap = 2;
    const total = icon.width + gap + label.width;
    // Laid out around the container's own origin, so the pair stays centred on
    // (x, y) exactly as a bare label would — the caller's positioning is
    // unchanged whether or not an icon is present.
    icon.setPosition(-total / 2 + icon.width / 2, 0);
    label.setPosition(total / 2 - label.width / 2, 0);
    const box = scene.add.container(opts.x, opts.y, [icon, label]);
    target = box;
  }

  if (opts.depth !== undefined) target.setDepth(opts.depth);

  scene.tweens.add({
    targets: target,
    y: opts.y - rise,
    alpha: 0,
    delay: opts.hold ?? 0,
    duration,
    ease: "Quad.easeOut",
    onComplete: () => {
      target.destroy();
      // Wołane PO zniszczeniu, żeby wołający mógł na tym zwolnić swój slot
      // układu (`PracticeToast`) i mieć pewność, że napis już nie istnieje.
      opts.onDone?.();
    },
  });

  if (opts.pulse) {
    scene.tweens.add({
      targets: target,
      scale: 1.35,
      duration: 110,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }
}

export interface ExpandingRingOptions {
  x: number;
  y: number;
  /** Starting radius in px. */
  radius: number;
  /** Fill colour (0xRRGGBB). */
  color: number;
  /** Starting alpha. Default 0.5. */
  alpha?: number;
  /** Target scale the ring grows to as it fades. */
  scale: number;
  /** Grow/fade duration in ms. */
  duration: number;
  /** Render depth. */
  depth?: number;
}

/** Spawn a circle that scales up while fading out, then destroys itself —
 *  used for swing arcs, level-up bursts, and resurrection halos. */
export function expandingRing(scene: Phaser.Scene, opts: ExpandingRingOptions): void {
  const ring = scene.add.circle(opts.x, opts.y, opts.radius, opts.color, opts.alpha ?? 0.5);
  if (opts.depth !== undefined) ring.setDepth(opts.depth);
  scene.tweens.add({
    targets: ring,
    scale: opts.scale,
    alpha: 0,
    duration: opts.duration,
    ease: "Quad.easeOut",
    onComplete: () => ring.destroy(),
  });
}

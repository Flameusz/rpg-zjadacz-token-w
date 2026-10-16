import Phaser from "phaser";

/**
 * Shared input state written by the UI controls (UIScene) and read by the
 * gameplay (GameScene). Keeping it in one small module decouples the two
 * scenes without threading references everywhere.
 */
export const InputState = {
  /** Normalized movement vector, length 0..1. */
  move: new Phaser.Math.Vector2(0, 0),
  /** True while the attack button/key is held down — the gameplay loop keeps
   *  attacking (subject to the weapon's cooldown) for as long as this is true. */
  attackHeld: false,

  /**
   * True while the player is asking to SPRINT.
   *
   * ⚠ **Deliberately not derived from the joystick magnitude alone.** The
   * keyboard path normalises its vector to length 1, so "pushed all the way"
   * would mean "always sprinting" on desktop. The joystick sets this from how
   * far the thumb is pushed; the keyboard sets it from Shift. Two sources, one
   * flag, and neither can lie about the other's input device.
   */
  sprintHeld: false,

  /**
   * Answers ONE question for the UI: is this pointer over an interactive
   * object in the *world*? Registered by GameScene, called by the joystick.
   *
   * It exists because Phaser hit-tests PER SCENE. `VirtualJoystick` lives in
   * UIScene, so its own `scene.input.hitTestPointer()` only ever sees UI
   * objects — never an enemy, which is interactive in GameScene. Measured:
   * over an enemy rendered at (440, 353), UIScene's hit test returned 0 while
   * GameScene's returned 1, and the joystick dropped itself on top of the
   * enemy the player was tapping. A tap on the world belongs to the world.
   *
   * Deliberately a plain callback on this existing bridge rather than the UI
   * reaching for GameScene: UIScene must not import or look up the gameplay
   * scene (that coupling is what `InputState`/`Controls`/`GameEvents` exist to
   * prevent). It carries no target, no movement and no enemy reference — it
   * answers a hit test and nothing else.
   *
   * Null when no world is listening (title screen, or a scene mid-restart),
   * in which case the UI simply behaves as it did before this existed.
   */
  worldHitTest: null as ((pointer: Phaser.Input.Pointer) => boolean) | null,
};

/** Event emitter for discrete control actions (e.g. respawn tap). */
export const Controls = new Phaser.Events.EventEmitter();
export const CONTROL = {
  /** Player asked to resurrect after dying. */
  respawn: "control-respawn",
} as const;

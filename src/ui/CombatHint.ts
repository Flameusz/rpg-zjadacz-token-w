import Phaser from "phaser";
import { UI, textStyle, uiW } from "../core/theme";
import { CoachMark } from "./CoachMark";

/** Separate from `Save`'s keys on purpose — this is "has this browser ever
 *  seen the hint", not character state, so it must survive "Nowa gra" and
 *  outlive any single save slot. */
const STORAGE_KEY = "rpg-hint-combat-seen";

/**
 * One-shot onboarding banner: "tap an enemy to target it, tap ⚔ to attack".
 *
 * Gameplay Feel Audit (2026-08-24) found zero proactive control guidance
 * anywhere — `VirtualJoystick`/`AttackButton` carry no label, and the only
 * existing text feedback ("Brak celu", "Za daleko", `GameScene.
 * announceAttackRefusal`) fires AFTER a failed action, never before the
 * first one. This closes that gap with the smallest possible shape: no new
 * tutorial system, no steps, no sequencing — one message, shown once ever.
 *
 * ⚠ **Deliberately NOT interactive.** No `setInteractive()` anywhere on this
 * widget, which is what makes "nieblokująca" and "możliwa do pominięcia" the
 * same guarantee: with no hit area, it can never intercept a tap meant for
 * the joystick or the attack button underneath it — dismissal is simply
 * "keep playing", not an action the player has to find and press. It fades
 * on its own.
 *
 * ⚠ **Flag is set the moment the hint is SHOWN, not after it finishes
 * fading.** A player who backgrounds the tab or returns to the title screen
 * mid-fade has still "seen" it in the sense that matters here — showing it
 * again on the next session would be the actual bug.
 */
export class CombatHint {
  private static seen(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      // Private browsing / blocked storage: fail open (show it), the same
      // "never let storage errors break the game" rule Save.ts follows.
      return false;
    }
  }

  private static markSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to do — worst case the hint reappears next session.
    }
  }

  constructor(scene: Phaser.Scene) {
    if (CombatHint.seen()) return;
    CombatHint.markSeen();

    const w = 420;
    const h = 62;
    // Top-CENTER, deliberately: the HUD's readout column (HP/XP/stamina/gold,
    // continued downward by QuestTracker) owns top-LEFT, and BuffBar owns
    // top-RIGHT (`HUD_LAYOUT.edgeRight`). Centre is the one strip nothing else
    // claims. Comfortably clear of both at this width on a locked-landscape
    // phone screen (`UI_SCALE.designShortAxis` keeps `uiH` at 580; `uiW` is
    // wider still by the aspect ratio).
    const y = 66;

    const container = scene.add.container(uiW(scene) / 2, y).setScrollFactor(0).setDepth(1000).setAlpha(0);
    const box = scene.add
      .rectangle(0, 0, w, h, UI.bg, 0.92)
      .setStrokeStyle(2, UI.goldNum, 0.85);
    const text = scene.add
      .text(
        0,
        0,
        "Dotknij przeciwnika, aby go zaznaczyć\nDotknij ⚔, aby rozpocząć atak",
        textStyle({ fontSize: "13px", color: UI.text, align: "center" }),
      )
      .setOrigin(0.5);
    container.add([box, text]);

    scene.tweens.add({ targets: container, alpha: 1, duration: 250, ease: "Quad.easeOut" });

    const HOLD_MS = 6000;
    const FADE_MS = 500;
    // Dymki „pierwszego razu" czekają, aż ta podpowiedź zejdzie z ekranu.
    CoachMark.holdFor(HOLD_MS + FADE_MS + 1500);
    const hideTimer = scene.time.delayedCall(HOLD_MS, () => {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: FADE_MS,
        ease: "Quad.easeIn",
        onComplete: () => container.destroy(),
      });
    });

    // Recentred on resize (desktop window drag; Android orientation is
    // locked) — same pattern as every other screen-anchored widget here.
    const reposition = () => container.setX(uiW(scene) / 2);
    scene.scale.on(Phaser.Scale.Events.RESIZE, reposition);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, reposition);
      hideTimer.remove();
      scene.tweens.killTweensOf(container);
      // Container may already be destroyed if the hold+fade completed
      // naturally before shutdown — guard, don't assume.
      if (container.active) container.destroy();
    });
  }
}

import Phaser from "phaser";
import { COMBAT_FEEDBACK } from "../config/GameConfig";

export interface HitFlashOptions {
  /**
   * Tint to return to when the flash ends, instead of clearing to none.
   *
   * **This is not cosmetic.** The flash used to end with an unconditional
   * `clearTint()`, which quietly erased whatever tint the target was already
   * wearing — and every telegraph in the game is a tint. Measured: hitting a
   * boar mid-wind-up wiped its red charge tell while `phase` was still
   * "telegraph", and one hit on the enraged Szary removed his red for the rest
   * of the fight. Telegraphs only matter *while* you are trading blows, which
   * was exactly when they were being deleted.
   */
  /**
   * Pass a FUNCTION when the target's tint can change during the flash — it is
   * resolved when the flash ends, not when it starts. A plain value captures
   * the tint at the moment of the hit, which goes wrong the other way: hit a
   * boar in the last frames of its wind-up and the flash would restore the
   * orange telegraph *after* it had already launched, leaving it tinted as if
   * it were still winding up. A stale tell is worse than none, because the
   * player reacts to it.
   */
  restoreTint?: number | null | (() => number | null);
  /**
   * Scale "pop" for punch. Default true. Turned off by anything that drives its
   * own scale every frame (see Enemy's procedural motion), where a competing
   * tween would simply be overwritten and left running for nothing.
   */
  pop?: boolean;
  /**
   * Czas trwania błysku (ms). Domyślnie `COMBAT_FEEDBACK.hitFlashMs`.
   *
   * ⚠ Istnieje dla TIERÓW (2026-08-23). `COMBAT_FEEDBACK.tiers[].flashMs` był
   * zapisany w configu i **nieużywany** — każde trafienie migało tak samo
   * długo, więc draśnięcie i cios niedźwiedzia różniły się w tym kanale
   * niczym. Przekazywany wyłącznie tam, gdzie tier jest znany.
   */
  ms?: number;
  /**
   * Siła skoku skali. Domyślnie 1,12 — wartość, którą ten plik miał wpisaną na
   * sztywno od zawsze, więc pominięcie parametru nie zmienia niczego.
   *
   * ⚠ **Skok jest SYMETRYCZNY i wraca w miejsce.** Nie wolno z niego zrobić
   * przesunięcia: sprite ma potwierdzać `CombatBody`, a nie udawać ruch,
   * którego w symulacji nie ma (patrz `core/CombatFx.ts`).
   */
  popScale?: number;
  /**
   * Kolor błysku. Domyślnie `COMBAT_FEEDBACK.hitTint` — czerwień „oberwałeś".
   *
   * Istnieje dla tarczy i jest ważniejszy, niż wygląda: `flashHit` jest
   * JEDYNYM błyskiem, jaki ta gra rysuje na graczu, więc jego kolor jest całym
   * słownikiem tego kanału. Blok musi się w nim odróżniać od trafienia, bo
   * poza dźwiękiem gracz nie ma skąd wiedzieć, że tarcza zadziałała —
   * otrzymane obrażenia nie mają liczby.
   */
  tint?: number;
}

/**
 * Flash a sprite red briefly to sell a hit (WoW/LoL-style "you felt that").
 * Safe to call repeatedly.
 */
export function flashHit(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  opts: HitFlashOptions = {},
): void {
  target.setTintFill(opts.tint ?? COMBAT_FEEDBACK.hitTint);
  scene.time.delayedCall(opts.ms ?? COMBAT_FEEDBACK.hitFlashMs, () => {
    // Object may have been destroyed (e.g. enemy died) before the callback.
    if (!target.active) return;
    const restore = typeof opts.restoreTint === "function" ? opts.restoreTint() : opts.restoreTint;
    if (restore === undefined || restore === null) target.clearTint();
    else target.setTint(restore);
  });

  if (opts.pop === false) return;
  // A tiny scale "pop" adds punch without needing extra art.
  //
  // ⚠ **Skala odczytana z BAZY, nie z bieżącej `target.scaleX`.** Przy dwóch
  // ciosach w ciągu 60 ms drugi tween czytał skalę w połowie pierwszego i
  // mnożył ją ponownie — a `yoyo` wracał do tej rozdmuchanej wartości, nie do
  // pierwotnej. Sprite zostawał trwale za duży. Trafienia serią to w tej
  // walce norma (wataha), więc to nie jest przypadek brzegowy.
  // ⚠ Świadomie BEZ `killTweensOf(target)`: ten sprite bywa w tym samym czasie
  // celem upadku po śmierci i migania nietykalności, a kasowanie „wszystkiego"
  // zabrałoby oba. Zamiast tego każdy skok kończy się twardym powrotem do bazy
  // — nakładające się skoki mogą przez chwilę szarpnąć, ale ostatni kończący
  // się zawsze przywraca właściwą skalę.
  const pop = opts.popScale ?? 1.12;
  const baseX = target.getData("flashBaseScaleX") as number | undefined;
  const baseY = target.getData("flashBaseScaleY") as number | undefined;
  const fromX = baseX ?? target.scaleX;
  const fromY = baseY ?? target.scaleY;
  target.setData("flashBaseScaleX", fromX);
  target.setData("flashBaseScaleY", fromY);
  target.setScale(fromX, fromY);
  scene.tweens.add({
    targets: target,
    scaleX: fromX * pop,
    scaleY: fromY * pop,
    duration: 60,
    yoyo: true,
    ease: "Quad.easeOut",
    onComplete: () => {
      if (!target.active) return;
      target.setScale(fromX, fromY);
    },
  });
}

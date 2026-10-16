import Phaser from "phaser";
import { UI, textStyle, uiW, uiH } from "../core/theme";
import { KeyFocus } from "./KeyFocus";

/** Skąd dymek wskazuje cel — strona DYMKA względem celu. */
export type CoachSide = "left" | "below" | "right" | "above";

interface Pending {
  id: string;
  target: () => { x: number; y: number } | null;
  text: string;
  side: CoachSide;
}

const PREFIX = "rpg-hint-";

/**
 * **Dymek „pierwszego razu"** (coach mark, 2026-10-12) — jedno zdanie przy
 * kontrolce, która właśnie POJAWIŁA SIĘ po raz pierwszy: zmiana zestawu
 * broni, wybór sposobu ataku, przycisk menu.
 *
 * ── Dlaczego tak, a nie samouczek ──────────────────────────────────────────
 * Research (Wild Rift, Mobile Legends, Diablo Immortal — `docs/ui_mobile_
 * research.md` §5): po krótkim obowiązkowym wstępie gry uczą funkcji W CHWILI,
 * gdy gracz pierwszy raz może jej użyć, a nie z góry. Kontrolka, której
 * jeszcze nie ma (drugi zestaw pusty, broń z jednym sposobem), nie ma czego
 * tłumaczyć — więc dymek wisi na jej POJAWIENIU, nie na starcie gry.
 *
 * ── Zasady ─────────────────────────────────────────────────────────────────
 * - Każdy dymek RAZ na urządzenie (`localStorage`, wzór `CombatHint`) —
 *   ⚠ świadomie nie w zapisie: to wiedza gracza, nie postaci.
 * - JEDEN naraz; kolejne czekają w kolejce. Dwa dymki naraz to szum.
 * - Nie przykrywa modala: przy otwartym panelu albo rozmowie (`KeyFocus`)
 *   czeka, aż ekran wróci do świata.
 * - Gaśnie po tapnięciu GDZIEKOLWIEK albo po 7 s i ⛔ nie połyka tapnięcia —
 *   gracz, który właśnie naciska kontrolkę, ma ją nacisnąć.
 */
export class CoachMark {
  private static queue: Pending[] = [];
  private static showing: Phaser.GameObjects.Container | null = null;
  private static scene: Phaser.Scene | null = null;
  /** Do kiedy (`scene.time.now`) kolejka czeka — np. na podpowiedź walki. */
  private static heldUntil = 0;

  /** Podepnij do sceny UI (raz, z `UIScene.create`). */
  static attach(scene: Phaser.Scene): void {
    CoachMark.scene = scene;
    CoachMark.heldUntil = 0;
    CoachMark.queue = [];
    CoachMark.showing = null;
    scene.events.on(Phaser.Scenes.Events.UPDATE, CoachMark.pump);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(Phaser.Scenes.Events.UPDATE, CoachMark.pump);
      CoachMark.scene = null;
      CoachMark.queue = [];
      CoachMark.showing = null;
    });
  }

  /**
   * Pokaż dymek `id`, jeśli gracz go jeszcze nie widział. `target` liczy
   * punkt w chwili pokazania (widżet mógł się przestawić). Wielokrotne
   * wołanie z tym samym `id` nic nie psuje — kolejka trzyma jeden wpis.
   */
  /**
   * Wstrzymaj dymki na `ms` — dla innej podpowiedzi, która właśnie stoi na
   * ekranie (`CombatHint`). Dwie podpowiedzi naraz czyta się jak żadną.
   */
  static holdFor(ms: number): void {
    const now = CoachMark.scene?.time.now ?? 0;
    CoachMark.heldUntil = Math.max(CoachMark.heldUntil, now + ms);
  }

  static once(id: string, target: Pending["target"], text: string, side: CoachSide): void {
    if (CoachMark.seen(id) || CoachMark.queue.some((p) => p.id === id)) return;
    CoachMark.queue.push({ id, target, text, side });
  }

  private static seen(id: string): boolean {
    try {
      return localStorage.getItem(PREFIX + id) !== null;
    } catch {
      return false;
    }
  }

  private static markSeen(id: string): void {
    try {
      localStorage.setItem(PREFIX + id, "1");
    } catch {
      // Tryb prywatny / pełny magazyn: dymek pokaże się jeszcze raz. Lepsze
      // niż wyjątek w pętli sceny.
    }
  }

  /** Co klatkę, ale pracuje tylko przy niepustej kolejce i wolnym ekranie. */
  private static pump = (): void => {
    const scene = CoachMark.scene;
    if (!scene || CoachMark.showing || CoachMark.queue.length === 0) return;
    if (KeyFocus.owner !== null || scene.time.now < CoachMark.heldUntil) return;
    const next = CoachMark.queue.shift()!;
    if (CoachMark.seen(next.id)) return;
    const at = next.target();
    if (!at) return;
    CoachMark.markSeen(next.id);
    CoachMark.showing = CoachMark.build(scene, at, next.text, next.side);
  };

  private static build(
    scene: Phaser.Scene,
    at: { x: number; y: number },
    text: string,
    side: CoachSide,
  ): Phaser.GameObjects.Container {
    const pad = 12;
    const gapToTarget = 52;
    const label = scene.add
      .text(0, 0, text, textStyle({ fontSize: "15px", color: UI.white, wordWrap: { width: 300 }, lineSpacing: 3 }))
      .setOrigin(0.5);
    const w = label.width + pad * 2;
    const h = label.height + pad * 2;
    // Środek dymka po wskazanej stronie celu, przyciśnięty do ekranu.
    const off = { left: [-1, 0], right: [1, 0], above: [0, -1], below: [0, 1] }[side];
    let cx = at.x + off[0] * (gapToTarget + w / 2);
    let cy = at.y + off[1] * (gapToTarget + h / 2);
    cx = Phaser.Math.Clamp(cx, w / 2 + 8, uiW(scene) - w / 2 - 8);
    cy = Phaser.Math.Clamp(cy, h / 2 + 8, uiH(scene) - h / 2 - 8);

    const c = scene.add.container(cx, cy).setScrollFactor(0).setDepth(1350).setAlpha(0);
    const g = scene.add.graphics();
    g.fillStyle(UI.bg, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.lineStyle(2, UI.goldNum, 0.95).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    // Grot: od krawędzi dymka ku celowi, przycięty do jego boku.
    const tx = at.x - cx;
    const ty = at.y - cy;
    const k = 9;
    g.fillStyle(UI.goldNum, 1);
    if (side === "left" || side === "right") {
      const ex = (side === "left" ? 1 : -1) * (w / 2);
      const ey = Phaser.Math.Clamp(ty, -h / 2 + k + 4, h / 2 - k - 4);
      const dir = side === "left" ? 1 : -1;
      g.fillTriangle(ex, ey - k, ex, ey + k, ex + dir * k * 1.4, ey);
    } else {
      const ey = (side === "above" ? 1 : -1) * (h / 2);
      const ex = Phaser.Math.Clamp(tx, -w / 2 + k + 4, w / 2 - k - 4);
      const dir = side === "above" ? 1 : -1;
      g.fillTriangle(ex - k, ey, ex + k, ey, ex, ey + dir * k * 1.4);
    }
    c.add([g, label]);
    scene.tweens.add({ targets: c, alpha: 1, duration: 180, ease: "Quad.easeOut" });

    const dismiss = () => {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, dismiss);
      timer.remove(false);
      scene.tweens.add({
        targets: c,
        alpha: 0,
        duration: 220,
        onComplete: () => {
          c.destroy();
          if (CoachMark.showing === c) CoachMark.showing = null;
        },
      });
    };
    const timer = scene.time.delayedCall(7000, dismiss);
    // Pierwsze tapnięcie GDZIEKOLWIEK zamyka — i idzie dalej do kontrolki.
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, dismiss);
    return c;
  }
}

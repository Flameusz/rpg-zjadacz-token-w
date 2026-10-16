import type Phaser from "phaser";
import { boundsInView, type Rect } from "../world/RenderCulling";

/**
 * Wiring Phasera nad czystą geometrią `world/RenderCulling.ts`.
 *
 * ⚠ **Zakres jest CELOWO wąski: tylko statyczna, NIEinteraktywna treść świata**
 * (korony, pnie, `DECOR_PROPS` — obie warstwy, `"background"` i `"ysorted"`).
 * Gracz/Enemy/Critter/NPC/Bird/Projectile NIE są tu rejestrowane:
 *   1. `NPC`/`Enemy` mają `setInteractive()`, a sprawdzone w źródle Phasera —
 *      hit-test WEJŚCIA **nie sprawdza `.visible`** (`InputManager`/`InputPlugin`
 *      nigdzie tego nie robi) — ukryty, ale wciąż zarejestrowany jako
 *      interaktywny obiekt zostałby klikalny w miejscu, w którym go nie widać.
 *      To nie jest hipotetyczne ryzyko — to zmierzone zachowanie silnika.
 *   2. Populacja dynamicznych encji to dziesiątki, nie tysiące — tam nie ma
 *      dużego zysku do zdobycia, a jest gdzie się pomylić.
 *
 * ⚠ **Bounds liczone RAZ, przy `register()`, nie co klatkę.** Bezpieczne
 * wyłącznie dlatego, że kandydaci są z definicji statyczni (nigdy nie
 * wywołują `setPosition`/`setScale` po zbudowaniu mapy) — encja, która się
 * rusza, nie ma tu czego szukać.
 *
 * ⚠ **Dotyka WYŁĄCZNIE `.visible`.** Nigdy `.setActive()`, nigdy `.destroy()`,
 * nigdy `.depth`, nigdy przynależności do `Y_SORTED_WORLD` ani domyślnej listy
 * sceny — patrz uzasadnienie w odpowiedzi (punkt 14 tej tury).
 */
export interface CullStats {
  readonly total: number;
  readonly visible: number;
  readonly hidden: number;
}

interface Candidate {
  readonly obj: Phaser.GameObjects.Image;
  readonly bounds: Rect;
  visible: boolean;
}

export class RenderCuller {
  private readonly candidates: Candidate[] = [];
  private lastStats: CullStats = { total: 0, visible: 0, hidden: 0 };

  /** Woła się RAZ, zaraz po tym jak obiekt ma ostateczne origin/pozycję —
   *  a więc PO `.setOrigin()`, nie przed. */
  register(obj: Phaser.GameObjects.Image): void {
    const bounds: Rect = {
      x: obj.x - obj.displayWidth * obj.originX,
      y: obj.y - obj.displayHeight * obj.originY,
      w: obj.displayWidth,
      h: obj.displayHeight,
    };
    this.candidates.push({ obj, bounds, visible: obj.visible });
  }

  /**
   * Wołane raz na klatkę z `GameScene.update()`. `marginFactor` to
   * `CAMERA.cullMarginFactor` — mnożnik BIEŻĄCEGO `worldView.width/height`,
   * liczony osobno na oś, bo viewport rzadko jest kwadratowy (patrz
   * `world/RenderCulling.ts`).
   */
  update(camera: Phaser.Cameras.Scene2D.Camera, marginFactor: number): void {
    const view = camera.worldView;
    const viewport: Rect = { x: view.x, y: view.y, w: view.width, h: view.height };
    const marginX = view.width * marginFactor;
    const marginY = view.height * marginFactor;

    let visibleCount = 0;
    for (const c of this.candidates) {
      const shouldBeVisible = boundsInView(c.bounds, viewport, marginX, marginY);
      // Zapisz TYLKO przy zmianie — ta sama reguła co gdzie indziej w
      // projekcie („maluj przy zmianie stanu", `src/ui/CLAUDE.md`), tu z
      // dodatkowym powodem: `setVisible()` przechodzi przez `Visible.js`
      // i dirtuje `renderFlags`, więc powtarzanie go bez potrzeby to czysty
      // koszt bez żadnego efektu.
      if (shouldBeVisible !== c.visible) {
        c.visible = shouldBeVisible;
        c.obj.setVisible(shouldBeVisible);
      }
      if (shouldBeVisible) visibleCount++;
    }

    this.lastStats = {
      total: this.candidates.length,
      visible: visibleCount,
      hidden: this.candidates.length - visibleCount,
    };
  }

  get stats(): CullStats {
    return this.lastStats;
  }
}

const perScene = new WeakMap<Phaser.Scene, RenderCuller>();

export function setRenderCuller(scene: Phaser.Scene, culler: RenderCuller): void {
  perScene.set(scene, culler);
}

export function renderCullerFor(scene: Phaser.Scene): RenderCuller | null {
  return perScene.get(scene) ?? null;
}

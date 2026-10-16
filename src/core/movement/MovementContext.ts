/**
 * Usługa sceny: wszystko, o co ruch może zapytać ŚWIAT.
 *
 * Istnieje po to, żeby ani `Locomotion`, ani żaden solver nie sięgał po scenę
 * z osobna — jedno wejście do przestrzeni znaczy jedno miejsce do podmiany,
 * gdy dojdzie `PathSolver`, i jedno miejsce do zaślepienia w teście.
 */
import Phaser from "phaser";
import { NavGrid } from "./NavGrid";

export class MovementContext {
  /**
   * Siatka prześwitu mapy — **CZYTANA** (szukanie drogi w `Locomotion`,
   * `Enemy`, `Boar`, `Spider`, punkt startu i dobiegnięcie w `GameScene`).
   * Puste (null) dla map zbudowanych awaryjnie z kodu (`MapBuilder`), które
   * nie mają kolizji kafli — wtedy każdy czytelnik schodzi na sterowanie
   * lokalne. ⚠ Do 2026-10-09 stało tu „BUDOWANA, ale jeszcze nie CZYTANA"
   * (`OI-75`).
   */
  readonly nav: NavGrid | null;

  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, nav: NavGrid | null) {
    this.scene = scene;
    this.nav = nav;
  }

  /**
   * Czy prostokąt ciała (środek + rozmiar) jest wolny od TERENU.
   *
   * ⚠ **Pyta o PRZYSZŁOŚĆ, nie o przeszłość, i to jest cała różnica wobec
   * `body.blocked`.** Flagi kontaktu mówią, że ciało już w coś wjechało —
   * czyli reagują o klatkę za późno i (zmierzone przy impulsach walki, patrz
   * `src/core/CLAUDE.md`) nie zapalają się wcale, gdy ruch był wpisany
   * pozycją. Sonda pyta „czy tam mogę być", zanim tam pojedzie.
   *
   * ⚠ **Tylko ciała STATYCZNE.** Wrogowie rozpychają się osobnym colliderem
   * i wciąganie ich tutaj zamieniłoby omijanie terenu w omijanie kolegów —
   * a to jest inna decyzja projektowa, nie skutek uboczny sondy.
   */
  isFree(cx: number, cy: number, w: number, h: number): boolean {
    const found = this.scene.physics.overlapRect(
      cx - w / 2,
      cy - h / 2,
      w,
      h,
      /* includeDynamic */ false,
      /* includeStatic */ true,
    );
    return found.length === 0;
  }
}

/**
 * Rejestr kontekstów per scena.
 *
 * ⚠ **Świadomie NIE przez konstruktory encji.** Przepchnięcie kontekstu przez
 * `Enemy` → siedem podklas → `Critter` → `GameScene.spawnEnemy` znaczyłoby
 * kilkanaście zmienionych sygnatur po to, żeby przekazać rzecz, której jest
 * dokładnie jedna na scenę. Odczyt jest LENIWY, więc encja stworzona przed
 * zbudowaniem mapy też trafi na gotowy kontekst.
 *
 * ⚠ To nie jest singleton w sensie `src/core/CLAUDE.md` — nie przeżywa sceny
 * i nie ma `reset()`. Klucz to konkretna instancja sceny, żeby dwie sceny (gra
 * + nakładka UI) nie dzieliły przestrzeni.
 */
const perScene = new WeakMap<Phaser.Scene, MovementContext>();

export function setMovementContext(scene: Phaser.Scene, ctx: MovementContext): void {
  perScene.set(scene, ctx);
}

/**
 * Kontekst sceny; gdy nikt go nie ustawił (mapa awaryjna z `MapBuilder`, testy),
 * powstaje w locie **bez siatki nawigacyjnej**. Sonda terenu działa i wtedy —
 * pyta silnik, nie siatkę.
 */
export function movementContextFor(scene: Phaser.Scene): MovementContext {
  let ctx = perScene.get(scene);
  if (!ctx) {
    ctx = new MovementContext(scene, null);
    perScene.set(scene, ctx);
  }
  return ctx;
}

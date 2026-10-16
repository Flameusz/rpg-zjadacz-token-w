import Phaser from "phaser";
import { InputState } from "../core/InputState";
import { STICK } from "../config/GameConfig";
import { UI, uiW, uiScale } from "../core/theme";

/**
 * A floating virtual joystick for the LEFT half of the screen.
 *
 * Touch/click anywhere in the left half to place the joystick base there; drag
 * to steer. Releasing recentres and zeroes the movement vector. Writes a
 * normalized vector into InputState.move.
 *
 * Also supports WASD / arrow keys on desktop for convenience.
 *
 * ── ⚠ Obrót, marsz i bieg: TRZY STREFY jednego drążka ─────────────────────
 * ⚠ **Ten widżet zna dwie z nich.** Trzecia — obrót w miejscu poniżej
 * `STICK.turnZoneFrac` (2026-09-11) — rozstrzyga się w `Player.handleMovement`,
 * bo drążek przenosi WYCHYLENIE, a nie znaczenie wychylenia (`input.md` §1:
 * „ta domena nie wie, co znaczy żadna z intencji, które przenosi"). Granica
 * jest tu jednak już NARYSOWANA i to nie przypadek: próg równa się promieniowi
 * rysowanej gałki (`thumb`), więc „gałka zakrywa środek" = „obracam się".
 * ⛔ Nie dokładaj tu czwartego okręgu na tę strefę.
 *
 * Wychylenie do `STICK.radius` skaluje prędkość marszu; wypchnięcie poza
 * `STICK.runEngage` włącza bieg, a ten gaśnie dopiero poniżej
 * `STICK.runRelease`. Granica jest **narysowana** (drugi okrąg) i **zapala
 * się** podczas biegu, więc nie ma tu ukrytego gestu — jest widoczna strefa.
 *
 * Do 2026-08-21 próg stał na 92% promienia 60 j., czyli **6,5 mm od punktu
 * dotknięcia**: chodzenie było wtedy fizycznie niewykonalne, a gracz płacił
 * staminą za bieg, o którym nie wiedział. Pełny rachunek i uzasadnienie —
 * przy `STICK` w `GameConfig.ts`.
 *
 * ⚠ **Sprint ma DWA różne wejścia i to nie jest niekonsekwencja.** Dotyk:
 * strefa zewnętrzna drążka. Klawiatura: Shift. Powód jest techniczny —
 * ścieżka klawiaturowa normalizuje wektor do długości 1, więc „wychylenie"
 * na klawiaturze nie niesie żadnej informacji.
 */
export class VirtualJoystick {
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  /** Narysowana granica marszu i biegu — patrz nagłówek klasy. */
  private runRing: Phaser.GameObjects.Arc;
  private pointerId: number | null = null;
  private origin = new Phaser.Math.Vector2();
  private radius = STICK.radius;
  /** Czy drążek jest w tej chwili w strefie biegu. Trzymane jako STAN, bo
   *  wejście i wyjście mają różne progi (histereza). */
  private running = false;
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  } | null = null;

  constructor(private scene: Phaser.Scene) {
    const depth = 1000;
    this.base = scene.add
      .circle(0, 0, this.radius, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.35)
      .setScrollFactor(0)
      .setDepth(depth)
      .setVisible(false);
    this.thumb = scene.add
      .circle(0, 0, this.radius * 0.45, 0xffffff, 0.3)
      .setStrokeStyle(2, 0xffffff, 0.5)
      .setScrollFactor(0)
      .setDepth(depth + 1)
      .setVisible(false);
    // Pod bazą w kolejności głębokości: to tło informacyjne, nie kontrolka.
    this.runRing = scene.add
      .circle(0, 0, STICK.runEngage, 0x000000, 0)
      .setStrokeStyle(2, 0xffffff, 0.18)
      .setScrollFactor(0)
      .setDepth(depth - 1)
      .setVisible(false);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);

    if (scene.input.keyboard) {
      const KC = Phaser.Input.Keyboard.KeyCodes;
      this.keys = {
        up: scene.input.keyboard.addKey(KC.UP),
        down: scene.input.keyboard.addKey(KC.DOWN),
        left: scene.input.keyboard.addKey(KC.LEFT),
        right: scene.input.keyboard.addKey(KC.RIGHT),
        w: scene.input.keyboard.addKey(KC.W),
        a: scene.input.keyboard.addKey(KC.A),
        s: scene.input.keyboard.addKey(KC.S),
        d: scene.input.keyboard.addKey(KC.D),
        shift: scene.input.keyboard.addKey(KC.SHIFT),
      };
    }
  }

  /** Only claim pointers that start on the left half of the screen. */
  private isLeftHalf(p: Phaser.Input.Pointer): boolean {
    return this.px(p.x) < uiW(this.scene) * 0.5;
  }

  /**
   * Współrzędna wskaźnika przeliczona do przestrzeni, w której rysuje ten
   * widżet. `pointer.x/y` są w pikselach EKRANU, a kamera UI stoi na zoomie
   * `uiScale()` — bez tego podstawa joysticka lądowałaby w ~57% odległości od
   * rogu, czyli wyraźnie obok palca, a promień 60 px oznaczałby inny wychył
   * kciuka niż zakłada `radius`.
   */
  private px(v: number): number {
    return v / uiScale();
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.pointerId !== null || !this.isLeftHalf(p)) return;
    // An interactive object under the touch claims this tap instead of placing
    // the joystick base on top of it. Without this, tapping an enemy standing
    // in the left half of the screen — which is most of the map, since this
    // listener claims that whole half rather than a fixed joystick footprint —
    // would ALSO start steering from that point, on top of whatever the
    // enemy's own click handler does.
    //
    // TWO hit tests, because Phaser hit-tests per scene and this widget lives
    // in UIScene: the local one guards the HUD's own buttons, and only the
    // bridge below can see an enemy (interactive in GameScene). The local test
    // alone silently never matched a single enemy — see InputState.worldHitTest.
    if (this.scene.input.hitTestPointer(p).length > 0) return;
    if (InputState.worldHitTest?.(p)) return;
    this.pointerId = p.id;
    const x = this.px(p.x);
    const y = this.px(p.y);
    this.origin.set(x, y);
    this.base.setPosition(x, y).setVisible(true);
    this.thumb.setPosition(x, y).setVisible(true);
    this.runRing.setPosition(x, y).setVisible(true);
    this.running = false;
    this.paintRing();
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pointerId) return;
    const dx = this.px(p.x) - this.origin.x;
    const dy = this.px(p.y) - this.origin.y;
    // ⚠ Odległość SUROWA, osobno od przyciętej: przycięta wysyca się na
    // `radius` i nie potrafi już odróżnić „wychylony" od „wypchnięty", czyli
    // dokładnie tej informacji, na której stoi podział marsz/bieg.
    const raw = Math.hypot(dx, dy);
    const dist = Math.min(raw, this.radius);
    const angle = Math.atan2(dy, dx);
    this.thumb.setPosition(
      this.origin.x + Math.cos(angle) * dist,
      this.origin.y + Math.sin(angle) * dist,
    );
    // Normalized vector (magnitude scales with how far you push).
    const mag = dist / this.radius;
    InputState.move.set(Math.cos(angle) * mag, Math.sin(angle) * mag);

    // Histereza: wejście przy `runEngage`, wyjście dopiero pod `runRelease`.
    // Dwa różne progi to nie niedbałość — patrz `STICK.runRelease`.
    if (!this.running && raw >= STICK.runEngage) this.running = true;
    else if (this.running && raw < STICK.runRelease) this.running = false;
    InputState.sprintHeld = this.running;
    this.paintRing();
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id !== this.pointerId) return;
    this.pointerId = null;
    this.base.setVisible(false);
    this.thumb.setVisible(false);
    this.runRing.setVisible(false);
    this.running = false;
    InputState.move.set(0, 0);
    InputState.sprintHeld = false;
  }

  /**
   * Zapal albo wygaś pierścień biegu.
   *
   * ⚠ **To jest wskaźnik przy kciuku, a nie JEDYNY wskaźnik.** Reguła tego
   * katalogu mówi, że palec zasłania to, czego dotyka — więc stan biegu ma
   * drugie miejsce, z dala od dłoni: znacznik przy pasku wysiłku (`HUD`).
   */
  private paintRing(): void {
    this.runRing.setStrokeStyle(
      this.running ? 3 : 2,
      this.running ? UI.goldNum : 0xffffff,
      this.running ? 0.9 : 0.18,
    );
  }

  /** Fold keyboard input in when the joystick isn't being touched. */
  update(): void {
    if (this.pointerId !== null || !this.keys) return;
    let x = 0;
    let y = 0;
    if (this.keys.left.isDown || this.keys.a.isDown) x -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) x += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) y -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) y += 1;
    const v = new Phaser.Math.Vector2(x, y);
    if (v.lengthSq() > 0) v.normalize();
    InputState.move.copy(v);
    // ⚠ Na klawiaturze wektor jest ZAWSZE znormalizowany do 1, więc progu
    // wychylenia użyć się nie da — stąd osobny klawisz. To jest ten sam fakt,
    // który stoi w komentarzu przy `InputState.sprintHeld`.
    InputState.sprintHeld = v.lengthSq() > 0 && this.keys.shift.isDown;
  }
}

import Phaser from "phaser";
import { UI, fontPx, textStyle, uiW, uiH } from "../core/theme";
import { Sfx } from "../core/Sfx";
import { panelFitScale, screenArea, serviceArea, type Rect } from "./FrameLayout";

/**
 * Gdzie panel stoi: na całym ekranie (panel gracza) albo w RAMIE rozmowy —
 * w obszarze usługi na lewo od szyny (`FrameLayout.serviceArea`).
 * `"frame-dense"` = obok szyny SAMYCH IKON (zakładka gęstej treści — Handel).
 */
export type PanelHost = "screen" | "frame" | "frame-dense";

/** Przyciemnienie pod panelem: kolor i krycie (etap B, 2026-10-13). */
const SCRIM = { color: 0x05070b, alpha: 0.85 } as const;

/** Button colour schemes. `primary` is the affirmative action (accept, learn,
 *  buy), `neutral` everything else (back, cancel, secondary navigation). */
export type ButtonTone = "primary" | "neutral";

const TONES: Record<ButtonTone, { fill: number; stroke: number }> = {
  primary: { fill: 0x2c6e3f, stroke: 0x7ddf9a },
  neutral: { fill: 0x2a2f3a, stroke: 0x556074 },
};

/**
 * Shared chrome for the game's modal panels (character sheet, shop). Both were
 * duplicating the same boilerplate: a screen-centred container with a bordered
 * background, a corner close button, and the
 * pause-the-game-while-open plumbing. This owns exactly that; subclasses build
 * their own content into `container` and keep their own open/close rules (the
 * shop gates on merchant range, the character sheet on tabs), so nothing about
 * those diverging behaviours is forced into a shared shape.
 */
export abstract class PanelBase {
  protected readonly container: Phaser.GameObjects.Container;
  // ⚠ `tooltip` (karta-DYMEK `ItemTooltip`) i `cardActions` (rząd przycisków
  //   doklejany pod nim) zniknęły w etapie F (2026-10-13) razem z ostatnim
  //   klientem: karta przedmiotu to stała kolumna `ShopDetails`, karta
  //   umiejętności — `ListDetail`. Historia: `git log -p src/ui/ItemTooltip.ts`.
  /**
   * ⭐ **Przyciemnienie pod panelem, na CAŁY ekran** (etap B, 2026-10-13).
   * Audyt researchu 2: tło 95% krycia przebijało HUD (pasek HP, minimapa,
   * dymki), a podwidoki 816×440 stały z HUD-em dookoła — gracz widział dwa
   * interfejsy naraz. Tło panelu ma dziś pełne krycie, a pod nim leży ten
   * prostokąt: HUD i świat gasną, panel jest jedyną rzeczą do czytania.
   *
   * ⚠ Jest DZIECKIEM kontenera (pierwszym), więc widoczność idzie za panelem
   * bez żadnego zachodu w podklasach — a współrzędne liczy `layoutScrim`
   * odwrotnie przez pozycję i skalę kontenera, żeby pokrył ekran, nie panel.
   * ⚠ Interaktywny: dotknięcie OBOK panelu też nie może trafić w drążek
   * (ten sam błąd, co tło bez `setInteractive`, opisany niżej).
   */
  private readonly scrim: Phaser.GameObjects.Rectangle;

  constructor(
    protected readonly scene: Phaser.Scene,
    protected readonly w: number,
    protected readonly h: number,
    /** Ekran albo rama rozmowy — patrz `PanelHost`. */
    protected readonly host: PanelHost = "screen",
  ) {

    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(1400)
      .setVisible(false);

    this.scrim = scene.add.rectangle(0, 0, 10, 10, SCRIM.color, SCRIM.alpha).setOrigin(0).setInteractive();
    this.scrim.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
    });
    this.container.add(this.scrim);

    /**
     * ⚠ **Interaktywne na całym `w×h`, i to jest łata na buga, nie polish.**
     * Bez `setInteractive()` tło było zwykłym rysunkiem: tapnięcie w PUSTY
     * obszar panelu (między przyciskami, nad kartą) nie trafiało w NIC
     * interaktywnego w tej scenie, więc `VirtualJoystick.onDown` — który
     * odpytuje `hitTestPointer` samodzielnie, bez polegania na propagacji —
     * uznawał je za wolne i przestawiał tam bazę drążka, mimo otwartego
     * modala. Pole trafienia to WIDOCZNY obszar panelu wprost (ten sam
     * prostokąt, który gracz widzi), nie osobno dobrany hitbox.
     *
     * ⚠ **`stopPropagation()` tu wystarcza, bo Phaser oddaje zdarzenie
     * najpierw obiektowi NA WIERZCHU.** Każdy przycisk panelu już dziś
     * wywołuje `stopPropagation()` na własnym `POINTER_DOWN`, więc trafienie
     * w przycisk (leżący nad tłem w tym samym kontenerze) nigdy nie dochodzi
     * do tego listenera — to tło łapie WYŁĄCZNIE to, czego nie złapał nikt
     * inny.
     */
    // ⚠ Krycie 1,0, nie 0,95 (etap B): przy 0,95 przez panel prześwitywał
    // HUD i napisy świata — na zrzucie 1:1 czytało się to jak brud na szybie.
    const bg = scene.add
      .rectangle(0, 0, w, h, UI.bg, 1)
      .setStrokeStyle(2, UI.goldNum, 0.8)
      .setInteractive();
    bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
    });
    this.container.add(bg);

    // Note: we deliberately don't call reposition() here — a subclass override
    // may touch satellites (a prompt, an open button) that don't exist until
    // the subclass constructor finishes. Subclasses call reposition() at the
    // end of their own constructor; this just keeps it live across resizes.
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.reposition, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, this.reposition, this);
    });
  }

  // ⚠ `addCloseButton` (dolne „✕ Zamknij" / „← Wróć", 2026-08-21) ZNIKNĄŁ
  //   2026-10-13 razem z ostatnimi klientami: panel gracza i usługi rozmowy
  //   wychodzą kaflem na dole szyny („Wróć do gry” / „Do widzenia”).
  //   Trzy lekcje z jego nagłówka (próg 68 j., pole trafienia do krawędzi,
  //   przycisk z podpisem zamiast naklejki) żyją w `Rail`;
  //   pełna historia — `git log -p src/ui/PanelBase.ts`.

  /**
   * A labelled button: filled box + centred text, with the click swallowed so
   * it never reaches whatever sits behind the panel. Every panel was
   * hand-rolling this same shape, which is how the accept/learn/undo buttons
   * ended up with three slightly different hit behaviours.
   *
   * `enabled: false` renders the muted variant AND drops the click — a greyed
   * button that still fires is worse than no button at all.
   */
  protected makeButton(opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    onClick: () => void;
    enabled?: boolean;
    tone?: ButtonTone;
    fontSize?: string;
  }): Phaser.GameObjects.Container {
    const { x, y, w, h, label, onClick } = opts;
    const enabled = opts.enabled ?? true;
    const tone = TONES[enabled ? (opts.tone ?? "primary") : "neutral"];

    const c = this.scene.add.container(x, y);
    const box = this.scene.add
      .rectangle(0, 0, w, h, tone.fill, 1)
      .setStrokeStyle(2, tone.stroke, 0.9)
      .setInteractive({ useHandCursor: enabled });
    const text = this.scene.add
      .text(
        0,
        0,
        label,
        textStyle({ fontSize: opts.fontSize ?? fontPx("body"), color: enabled ? UI.white : UI.muted }),
      )
      .setOrigin(0.5);
    c.add([box, text]);

    box.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      if (!enabled) return;
      // After the enabled check: a greyed-out button must stay silent, or the
      // click sound reads as "it worked" when nothing happened.
      Sfx.play("ui-click");
      this.scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true, ease: "Quad.easeOut" });
      onClick();
    });
    return c;
  }

  /**
   * Centre the panel on screen. Subclasses override to also place their
   * satellites (a nearby prompt, an open button), calling super.reposition()
   * first.
   */
  protected reposition(): void {
    const w = uiW(this.scene);
    const h = uiH(this.scene);
    const area = this.hostArea();
    const cx = area.x + area.w / 2;
    const cy = area.y + area.h / 2;
    const scale = panelFitScale(this.w, this.h, area);
    this.container.setPosition(cx, cy);
    this.container.setScale(scale);
    this.layoutScrim(cx, cy, scale, w, h);
    this.warnIfClipped(area);
  }

  /** Obszar, w którym panel się centruje i do którego dopasowuje skalę. */
  protected hostArea(): Rect {
    const w = uiW(this.scene);
    const h = uiH(this.scene);
    if (this.host === "screen") return screenArea(w, h);
    return serviceArea(w, h, this.host === "frame-dense");
  }

  /** Przyciemnienie na cały ekran — w układzie kontenera, czyli odwrotnie
   *  przez jego pozycję i skalę. */
  private layoutScrim(cx: number, cy: number, scale: number, screenW: number, screenH: number): void {
    const lw = screenW / scale;
    const lh = screenH / scale;
    this.scrim.setPosition(-cx / scale, -cy / scale).setSize(lw, lh);
    this.scrim.input?.hitArea.setTo(0, 0, lw, lh);
  }

  /**
   * Skala dopasowania: `FrameLayout.panelFitScale` (od 2026-10-13 — jedna
   * kopia reguły, czytana też przez `tools/panel_fit.mjs`). Historia:
   *
   * ⚠ **Powstało 2026-09-11, razem z panelem o rozmiarze liczonym z okna.**
   * Do tej pory każdy panel miał rozmiar STAŁY i mniejszy od najmniejszego
   * sensownego okna, więc „nie mieści się" było stanem, który zdarzał się
   * wyłącznie przy dziwnie ukształtowanym oknie przeglądarki i kończył się
   * ramką wychodzącą poza ekran (patrz `warnIfClipped` — asercja zostaje,
   * bo dalej chcemy o tym wiedzieć). `PlayerPanel` liczy dziś rozmiar RAZ,
   * w konstruktorze; okno zmniejszone PO otwarciu gry zastałoby panel za duży.
   *
   * ⚠ **Skalowanie kontenera to świadomie TAŃSZA odpowiedź niż przebudowa.**
   * Przebudowa pięciu zakładek przy każdym drgnięciu krawędzi okna byłaby
   * kosztowna i ryzykowna (panele trzymają zaznaczenia, maski i otwarte sesje
   * przeciągania). Cena: przy skali ≠ 1 tekst jest próbkowany, a nie rysowany
   * w docelowym rozmiarze. Dotyczy wyłącznie okien MNIEJSZYCH niż panel
   * (w praktyce: przeglądarka w orientacji pionowej), bo telefon ma orientację
   * zablokowaną w manifeście.
   *
   * ⚠ Od 2026-10-13 dopasowanie liczy się do OBSZARU GOSPODARZA (`hostArea`),
   * nie do całego okna — panel w ramie rozmowy nie może wejść pod szynę.
   */

  /**
   * ⚠ **Panel jest tylko CENTROWANY — nic go nie klamruje do ekranu.** Jeśli
   * okno jest węższe albo niższe od panelu, ramka po prostu z niego wychodzi
   * i nie ma o tym ani słowa. Ta asercja zapala się na czerwono, bo cicha
   * awaria układu to najdroższa klasa błędu w tym katalogu.
   *
   * Realne po co: `PlayerPanel` urósł 2026-08-21 z 550 do **816 j.**
   * (trzecia kolumna na kartę przedmiotu), więc **minimalna proporcja okna
   * podskoczyła z ~0,95:1 na ~1,45:1**. Telefonu to nie dotyczy — orientacja
   * jest zablokowana w manifeście, a 20:9 daje 220 j. marginesu — ale okno
   * przeglądarki na desktopie może mieć dowolny kształt.
   *
   * Ostrzeżenie leci przy WEJŚCIU w stan za ciasny i zeruje się po powrocie,
   * bo `reposition()` jest wołane przy każdej zmianie rozmiaru okna i inaczej
   * zalałoby konsolę w trakcie przeciągania krawędzi.
   */
  private narrowWarned = false;
  private warnIfClipped(area: Rect): void {
    if (!import.meta.env.DEV) return;
    const tight = panelFitScale(this.w, this.h, area) < 1;
    if (tight && !this.narrowWarned) {
      this.narrowWarned = true;
      console.warn(
        `[PanelBase] ${this.constructor.name} (${this.w}×${this.h} j.) nie mieści się ` +
          `w obszarze ${Math.round(area.w)}×${Math.round(area.h)} j. — panel jest zmniejszany.`,
      );
    } else if (!tight) {
      this.narrowWarned = false;
    }
  }

  protected pauseGame(): void {
    this.scene.scene.pause("Game");
  }

  protected resumeGame(): void {
    this.scene.scene.resume("Game");
  }
}

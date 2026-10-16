import Phaser from "phaser";
import { UI_SCALE } from "../config/GameConfig";
import { pixelRatio, cssSize } from "./Viewport";

/**
 * The single source of truth for the UI's look. Colours were previously
 * hard-coded as raw hex at ~50 call sites across nine files; naming them here
 * means a palette tweak (part of the visual polish a paid mobile build needs)
 * lands everywhere at once instead of via find-and-replace.
 */
export const UI = {
  /** Panel/HUD background fill. */
  bg: 0x14161f,
  /** Inset slot / sub-panel fill. */
  slotBg: 0x1c2030,
  /** Primary accent (borders, headings) as number / css string. */
  goldNum: 0xffcc66,
  gold: "#ffcc66",
  /** Lighter gold used for currency/reward text. */
  goldLight: "#ffe680",
  white: "#ffffff",
  /** Body/label text. */
  text: "#c8d0e0",
  /** Muted secondary text (hints, inactive tabs). */
  muted: "#8892a6",
  /** Positive / success (quest done, upgrades). */
  green: "#7ddf9a",
  /** Negative / close button, as css string / number. */
  danger: "#ff6666",
  /**
   * WYDATEK („3 020 (−40)" w sklepie, 2026-10-13) — lekko czerwony, celowo
   * jaśniejszy i cieplejszy niż `danger`: koszt, na który cię stać, to nie
   * odmowa. Odmowę („Brakuje 40 g") mówi przycisk, w `danger`.
   */
  spend: "#f4a08c",
  dangerNum: 0xff6666,
} as const;

/**
 * ⭐ **Krój CAŁEGO interfejsu — proporcjonalny** (D1, decyzja autora
 * 2026-10-13, `docs/ui_mobile_research.md` §8).
 *
 * Do tej daty UI stało na `monospace`, a proporcjonalny miała tylko rozmowa
 * (`READING_FONT`, 2026-10-12). Zrzut A/B 1:1 z telefonem: przy tej samej
 * wysokości wiersze są ~15% węższe, a czytelność wyraźnie wyższa — wszystkie
 * trzy raporty researchu mierzą czytelność na krojach proporcjonalnych
 * (Roboto na Androidzie). ⚠ Liczby w kolumnach NIE mają `tabular-nums` —
 * wyrównuj je do PRAWEJ (`setOrigin(1, …)`), nie spacjami.
 */
const UI_FONT = '"Roboto", "Segoe UI", "Noto Sans", "Helvetica Neue", Arial, sans-serif';

/**
 * Krój napisów w ŚWIECIE (`worldTextStyle`) zostaje o stałej szerokości:
 * kamera świata powiększa, a te napisy mają być klockowate jak kafle. D1
 * dotyczy interfejsu, nie świata.
 */
const WORLD_FONT = "monospace";

/**
 * ⭐ **Role rozmiarów tekstu** (B, 2026-10-13) — jedno miejsce dla skali
 * czytelności zamiast literałów `"12px"` rozsianych po widżetach.
 *
 * Liczby z researchu (`docs/ui_mobile_research.md` §8, R1): tekst w panelach
 * 11–13 j. to 1,9–2,2% wysokości ekranu, wzorce gier mobilnych 2,5–4%.
 * Przelicznik projektuje się pod GORSZY telefon: 1 j. ≈ 0,62 dp (powiększony
 * widok), domyślnie na S21 FE 0,709 dp.
 *
 * ⚠ Nowy widżet bierze rozmiar STĄD (`fontPx("body")`). Panele zbudowane pod
 * 11–13 j. przechodzą na role w etapach D–F razem z przebudową układu —
 * podmiana samej liczby rozsadziłaby ich geometrię. Pliki już przeniesione
 * pilnuje skan literałów w `tools/panel_fit.mjs` (§L).
 */
export const TYPE = {
  /** Tytuł ekranu albo sekcji — 22–24 j. */
  title: 23,
  /** Proza do czytania: wypowiedź NPC w rozmowie — ≥ 18 j., tu 21 j. (≈ 13 dp). */
  prose: 21,
  /** Nazwy w listach: przedmiot, temat, usługa, rozmówca — 20–23 j. */
  name: 21,
  /** Tekst główny: wiersze odpowiedzi, etykiety zakładek, kwoty — ≥ 18 j. */
  body: 18,
  /** Drugi plan: dopiski stanu, podpisy, liczniki — ≥ 15 j. */
  small: 15,
} as const;

export type TypeRole = keyof typeof TYPE;

/** Rozmiar roli jako wartość `fontSize` Phasera („18px"). */
export function fontPx(role: TypeRole): string {
  return `${TYPE[role]}px`;
}

/**
 * „4270" → „4 270". Odstęp tysięcy to spacja nierozdzielająca (U+00A0) —
 * wąska U+202F bywa poza krojem na Androidzie, a przecinek w polszczyźnie
 * znaczy ułamek. Mieszkała w `TabBar.ts` do etapu D (2026-10-13), kiedy
 * poziomy pasek zakładek zastąpiła szyna.
 */
export function formatAmount(n: number): string {
  const s = Math.round(n).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

/**
 * Pixel-art rysujemy NEAREST-em, ale TEKST tak się nie da — i tego jednej flagi
 * w Phaserze nie da się wyrazić inaczej niż tak.
 *
 * ⚠ **Problem, zgłoszony jako „napisy wyglądają niewyraźnie".** `pixelArt: true`
 * ustawia `antialias: false`, a to w Phaserze znaczy NEAREST dla **każdej**
 * tekstury, łącznie z płótnem, na którym rysowany jest tekst. Dopóki skala UI
 * wynosiła równo 1, było to niegroźne. Przy dowolnej innej `Text.updateText`
 * robi `canvas.width = szerokość × resolution` (DOM ucina do liczby całkowitej),
 * ale `frame.setSize` dostaje wartość **ułamkową** — zmierzone 64,66 texela
 * w płótnie o szerokości 64. Kwad próbkuje więc ~1% poza teksturę i przy NEAREST
 * gubi albo dubluje kolumnę pikseli w środku wyrazu. Litery robią się nierówne.
 *
 * ⚠ **Ustawienie filtra na obiekcie NIE wystarcza**: `WebGLRenderer.canvasToTexture`
 * czyta `config.antialias` na sztywno i przywraca NEAREST przy KAŻDYM
 * przerysowaniu tekstu — czyli przy każdym `setText`, a więc na liczniku HP,
 * złocie i odliczaniu umiejętności. Dlatego filtr musi być nakładany PO
 * `updateText`, a nie raz przy tworzeniu.
 *
 * ⚠ **Warunek `resolution !== 1` jest tym, co chroni wygląd świata.** Napisy
 * w świecie idą przez `worldTextStyle`, czyli zostają na `resolution` 1 i dalej
 * są klockowate tak samo jak kafle, przez które przechodzi ten sam zoom kamery.
 * Przy skali UI równej 1 (desktop bez HiDPI) warunek nie zachodzi nigdzie
 * i renderowanie jest **dosłownie takie jak przed wprowadzeniem skali**.
 */
export function installTextFiltering(): void {
  const proto = Phaser.GameObjects.Text.prototype as unknown as {
    updateText: () => unknown;
    __uiFilterPatched?: boolean;
  };
  if (proto.__uiFilterPatched) return;
  proto.__uiFilterPatched = true;

  const original = proto.updateText;
  proto.updateText = function (this: Phaser.GameObjects.Text) {
    const result = original.call(this);
    if (this.style.resolution !== 1) {
      this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    return result;
  };
}

/**
 * Współczynnik skali interfejsu — patrz `UI_SCALE` w GameConfig po powody.
 * Trzymany modułowo, bo pyta o niego zarówno każda scena UI, jak i `textStyle`,
 * a przekazywanie go przez konstruktory oznaczałoby przewleczenie jednej liczby
 * przez dwadzieścia klas.
 */
let factor = 1;

/**
 * Przelicz współczynnik z krótszej osi okna. Wołane przez scenę UI **zanim**
 * powstanie pierwszy widżet — widżety czytają wirtualny rozmiar ekranu już
 * w konstruktorach.
 */
export function setUiScale(): void {
  const css = cssSize();
  const fit = Phaser.Math.Clamp(
    Math.min(css.width, css.height) / UI_SCALE.designShortAxis,
    UI_SCALE.min,
    UI_SCALE.max,
  );
  // Liczone z rozmiaru CSS, nie z `scene.scale`: `scene.scale` jest już
  // w pikselach urządzenia, więc dzielenie go przez `designShortAxis` mieszałoby
  // dwie różne jednostki i na ekranie Retina dawało inny wynik niż na zwykłym
  // o tej samej wielkości fizycznej.
  factor = pixelRatio() * fit;
}

export function uiScale(): number {
  return factor;
}

/**
 * Wirtualna szerokość/wysokość ekranu: tyle, ile widżet ma do dyspozycji
 * w SWOICH współrzędnych, po tym jak kamera sceny zmniejszy wszystko o `factor`.
 *
 * ⚠ Każde `scene.scale.width` w `src/ui/` musi być tym — inaczej rzecz kotwiczona
 * do prawej krawędzi wyląduje w `factor` × szerokości, czyli w środku ekranu.
 */
export function uiW(scene: Phaser.Scene): number {
  return scene.scale.width / factor;
}

export function uiH(scene: Phaser.Scene): number {
  return scene.scale.height / factor;
}

/**
 * Ustaw kamerze sceny wirtualną rozdzielczość: `origin(0,0)` sprawia, że zoom
 * kotwiczy się w lewym górnym rogu, więc punkt (0,0) zostaje w rogu ekranu,
 * a punkt (x,y) ląduje w (x·factor, y·factor). To jest cała implementacja
 * skalowania UI — reszta plików tylko przestawia się na `uiW`/`uiH`.
 */
export function applyUiCamera(scene: Phaser.Scene): void {
  setUiScale();
  scene.cameras.main.setOrigin(0, 0).setZoom(factor);
}

/**
 * Base text style: every interface label shares one proportional face
 * (`UI_FONT`, D1). Pass per-call overrides (size, colour, weight); they win
 * over the base.
 *
 * ⚠ **`resolution: factor` to jedyna rzecz, która decyduje, czy tekst jest
 * czytelny, i kierunek tego mnożnika jest łatwy do odwrócenia.** Reguła:
 * `resolution` mówi, ile PIKSELI TEKSTURY przypada na piksel logiczny, a
 * kamera UI rysuje `factor` pikseli ekranu na piksel logiczny. Równość obu daje
 * 1 teksel na 1 piksel urządzenia, czyli tekst ostry jak w aplikacji natywnej.
 *
 * ⚠ Stało tu przez chwilę `1 / factor` i **to był realny błąd, zgłoszony jako
 * „napisy nieczytelne"**: przy skali 0,57 tekst renderował się 1,75× za duży,
 * a potem był próbkowany w dół prawie 3:1 — a że `pixelArt: true` wymusza
 * NEAREST, z liter zostawała miazga. Odwrotność wygląda prawdopodobnie, więc
 * jeśli kiedyś znów wyda się „oczywista", to jest ten moment.
 */
export function textStyle(
  overrides: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: UI_FONT, resolution: factor, ...overrides };
}

/**
 * Styl dla tekstu rysowanego w ŚWIECIE (liczby obrażeń, imiona nad NPC-ami).
 *
 * ⚠ Osobny od `textStyle`, bo **kamera świata POWIĘKSZA, a nie zmniejsza** —
 * stoi na zoomie 2 na desktopie i 3 na telefonie. Kompensacja dałaby tam tekst
 * gładki i wygładzony, a on ma być klockowaty tak samo jak kafle, przez które
 * przechodzi ten sam zoom. `resolution` zostaje na domyślnej jedynce, czyli
 * napisy w świecie wyglądają dokładnie tak, jak przed wprowadzeniem skali UI.
 */
export function worldTextStyle(
  overrides: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: WORLD_FONT, ...overrides };
}

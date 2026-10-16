import Phaser from "phaser";
import { HUD_LAYOUT } from "../config/GameConfig";
import { uiW, uiH } from "../core/theme";

export type RingId = keyof typeof HUD_LAYOUT.rings;

/**
 * Geometria klastra kontrolek bojowych — **jedyny dom tych liczb**.
 *
 * ⚠ **Powód istnienia jest historyczny i drogi.** Przed tym modułem prawy dolny
 * róg liczył się w czterech miejscach naraz; dwa z nich trzymały własną kopię
 * offsetu i **rozjechały się o 11 px nakładki**. Poprzednia naprawa (eksport
 * czterech funkcji z `QuickSlot`) rozwiązała to tylko w połowie: geometria dalej
 * mieszkała w widżecie, który sam był jednym z jej klientów, więc każdy nowy
 * element musiał importować „z quick slota", co nic nie znaczy.
 *
 * Kontrakt: **widżet nie liczy własnej pozycji.** Pyta o slot i dostaje punkt.
 * Wszystkie strojone liczby (promienie, kąty, rozmiary komórek) są w
 * `HUD_LAYOUT` w `GameConfig.ts` — tam też stoi pełne uzasadnienie kształtu
 * (dlaczego łuk, a nie kolumna) i pomiar zasięgu kciuka.
 *
 * ⚠ **Kąty są w konwencji EKRANU, nie matematycznej.** Oś Y rośnie w dół, więc
 * 90° to DÓŁ, a 270° GÓRA. Zapisane, bo przy pierwszym czytaniu tablicy
 * `angles` odruch mówi coś przeciwnego, a błąd znaku daje układ, który wygląda
 * „prawie dobrze" — odbity w poziomie.
 */

/** Punkt w wirtualnej przestrzeni interfejsu. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Środek przycisku ataku — kotwica całego klastra.
 *
 * ⚠ Liczony od PRAWEJ i DOLNEJ krawędzi, nigdy od (0,0): szerokość wirtualna
 * zależy od proporcji ekranu (≈1257 przy 19,5:9, ≈1031 przy 16:9), więc
 * cokolwiek zakotwiczonego do lewej krawędzi wędrowałoby po ekranie między
 * telefonami. Wysokość wirtualna jest stała (580) tylko dopóki krótsza oś
 * mieści się w widełkach `UI_SCALE` — na desktopie z wysokim oknem nie jest,
 * więc dół też liczy się od krawędzi.
 */
export function combatAnchor(scene: Phaser.Scene): Point {
  return {
    x: uiW(scene) - HUD_LAYOUT.anchor.right,
    y: uiH(scene) - HUD_LAYOUT.anchor.bottom,
  };
}

/**
 * Środek `index`-tego slotu na danym pierścieniu.
 *
 * ⚠ **Indeks jest STAŁY, nie porządkowy.** Slot 2 stoi w tym samym miejscu
 * niezależnie od tego, ile slotów jest zajętych — patrz komentarz przy
 * `HUD_LAYOUT.rings`. Widżet, który chce „ułożyć N elementów", ma je włożyć
 * w sloty 0..N-1 i zostawić resztę pustą, a nie centrować je na łuku.
 *
 * Zwraca `null` dla indeksu poza tablicą kątów — to jest sygnał „ten pierścień
 * nie ma tylu slotów", a nie błąd do przemilczenia. Wołający ma go zgłosić
 * (patrz `warnIfOverflow`), bo cicho pominięty przycisk to dokładnie ta klasa
 * awarii, przez którą dziesiąty slot ekwipunku wisiał poza ramką panelu.
 */
export function ringSlot(scene: Phaser.Scene, ring: RingId, index: number): Point | null {
  const cfg = HUD_LAYOUT.rings[ring];
  const deg = cfg.angles[index];
  if (deg === undefined) return null;
  const a = combatAnchor(scene);
  const rad = Phaser.Math.DegToRad(deg);
  return {
    x: a.x + cfg.radius * Math.cos(rad),
    y: a.y + cfg.radius * Math.sin(rad),
  };
}

/**
 * Prostokąt minimapy (lewy górny róg + bok) — prawy GÓRNY róg ekranu,
 * odsunięty o margines krawędzi (`edgeRight`). Mieszka tutaj z tego samego powodu co pierścienie:
 * pasek buffów ustawia się względem niej, a przymiar `tools/hud_uklad.mjs`
 * sprawdza ją razem z przyciskiem kontekstowym, który stoi tuż pod nią.
 */
export function minimapRect(scene: Phaser.Scene): Point & { size: number } {
  const { size, top } = HUD_LAYOUT.minimap;
  return { x: uiW(scene) - HUD_LAYOUT.edgeRight - size, y: top, size };
}

/**
 * Prostokąt przycisku MENU (wejście do panelu gracza) — na LEWO od minimapy,
 * wyrównany do jej góry. Pasek buffów ustawia się na lewo od NIEGO.
 */
export function menuButtonRect(scene: Phaser.Scene): Point & { size: number } {
  const mm = minimapRect(scene);
  const { size, gap } = HUD_LAYOUT.menuButton;
  return { x: mm.x - gap - size, y: mm.y, size };
}

/** Ile slotów ma pierścień. Widżet wymiaruje się z tego, nie ze stałej. */
export function ringCapacity(ring: RingId): number {
  return HUD_LAYOUT.rings[ring].angles.length;
}

/**
 * Bok komórki — czyli **POLE DOTYKOWE**, nie rozmiar grafiki.
 *
 * ⚠ To jest liczba, którą sprawdza `assertTouchTargets` i którą przymiar
 * `tools/hud_uklad.mjs` porównuje z prześwitami. Grafika bywa mniejsza (patrz
 * `visualOf`) i to jest w porządku; pole dotykowe mniejsze — nie jest.
 */
export function ringCell(ring: RingId): number {
  return HUD_LAYOUT.rings[ring].cell;
}

/** Rodzaj kontrolki klastra — klucz `HUD_LAYOUT.place` i `HUD_LAYOUT.visual`. */
export type ControlKind = keyof typeof HUD_LAYOUT.place;

type Placement = readonly [RingId, number];

/**
 * Gdzie stoi `index`-ta kontrolka danego rodzaju: `[pierścień, slot]` albo
 * `null`, gdy rodzaj nie ma tylu miejsc.
 *
 * ⚠ **Od 2026-10-12 pierścień to sama GEOMETRIA, a przypisanie mieszka
 * w `HUD_LAYOUT.place`.** Wcześniej pierścień był rodzajem („types",
 * „abilities", „items"), więc przeniesienie umiejętności bliżej kciuka
 * wymagało przemianowania pierścienia — a o miejscu ma decydować pilność,
 * nie nazwa łuku.
 */
export function placeOf(kind: ControlKind, index = 0): Placement | null {
  const p = HUD_LAYOUT.place[kind] as unknown;
  const list = (Array.isArray((p as unknown[])[0]) ? p : [p]) as readonly Placement[];
  return list[index] ?? null;
}

/** Ile miejsc ma rodzaj kontrolki. Widżet wymiaruje się z tego, nie ze stałej. */
export function capacityOf(kind: ControlKind): number {
  const p = HUD_LAYOUT.place[kind] as unknown;
  return Array.isArray((p as unknown[])[0]) ? (p as unknown[]).length : 1;
}

/** Środek `index`-tej kontrolki danego rodzaju — `ringSlot` przez `place`. */
export function slotOf(scene: Phaser.Scene, kind: ControlKind, index = 0): Point | null {
  const pl = placeOf(kind, index);
  return pl ? ringSlot(scene, pl[0], pl[1]) : null;
}

/** Bok komórki (pole dotykowe) kontrolki danego rodzaju. */
export function cellOf(kind: ControlKind, index = 0): number {
  const pl = placeOf(kind, index) ?? placeOf(kind, 0);
  return pl ? ringCell(pl[0]) : HUD_LAYOUT.minTouch;
}

/**
 * Średnica WIDOCZNEGO kółka kontrolki danego rodzaju.
 *
 * ⚠ **Kółka, nie kwadraty, i to nie jest gust.** Świat jest z kwadratowych
 * kafli, więc kwadratowa ramka HUD-u konkuruje z nim kształtem zamiast się od
 * niego odcinać; kciuk ma zresztą okrągły ślad. Kwadraty zostają tam, gdzie
 * znaczą „kafel siatki" — w plecaku i na manekinie.
 */
export function visualOf(kind: ControlKind, index = 0): number {
  return cellOf(kind, index) * HUD_LAYOUT.visual[kind];
}

/**
 * Środek `i`-tego przycisku kolumny wyboru trybu ataku (`HUD_LAYOUT.modeMenu`).
 * `i` = 0 na dole; ostatni (najwyżej) należy do „✕".
 *
 * Kolumna stoi na LEWO od najdalej wysuniętego slotu zewnętrznego łuku —
 * liczone z geometrii łuku, nie wpisane, żeby zmiana kąta nie wjechała nią
 * w miksturę.
 */
export function modeMenuSlot(scene: Phaser.Scene, i: number): Point {
  const outer = HUD_LAYOUT.rings.outer;
  const cell = outer.cell;
  let left = Infinity;
  for (let k = 0; k < outer.angles.length; k++) {
    const p = ringSlot(scene, "outer", k);
    if (p) left = Math.min(left, p.x);
  }
  const m = HUD_LAYOUT.modeMenu;
  return {
    x: left - cell - m.gap,
    y: uiH(scene) - m.bottom - i * m.step,
  };
}

/**
 * Niewidzialne koło trafienia o pełnym polu komórki.
 *
 * ⚠ **`fillAlpha` 0, a NIE `alpha` 0.** Phaser liczy `willRender` z alfy
 * OBIEKTU, więc obiekt z `alpha = 0` wypada z testu trafienia i przycisk
 * przestaje działać — cicho, bez błędu. Zerowe wypełnienie zostawia obiekt
 * widocznym dla wejścia, a niewidocznym dla oka.
 */
export function hitCircle(scene: Phaser.Scene, kind: ControlKind, index = 0): Phaser.GameObjects.Arc {
  return scene.add
    .circle(0, 0, cellOf(kind, index) / 2, 0x000000, 0)
    .setInteractive({ useHandCursor: true });
}

/**
 * ⚠ **Asercja, nie komentarz.** Reguła projektu mówi, że asercja niepotrafiąca
 * zaświecić na czerwono jest dekoracją — ta świeci: zejdź `HUD_LAYOUT.minTouch`
 * poniżej `cell` któregokolwiek pierścienia albo zmniejsz `cell`, a konsola
 * dostanie ostrzeżenie przy starcie sceny UI. Sprawdzone celowym zepsuciem.
 *
 * Powód: przed przebudową **wszystko poza przyciskiem ataku było pod progiem
 * dotykowym** (umiejętności 50 j. = 5,9 mm przy normie 8,0 mm), a nic w kodzie
 * o tym nie mówiło. Rozmiary zjeżdżają w dół same, gdy trzeba coś dołożyć.
 */
export function assertTouchTargets(): void {
  if (!import.meta.env.DEV) return;
  const min = HUD_LAYOUT.minTouch;
  for (const [name, cfg] of Object.entries(HUD_LAYOUT.rings)) {
    if (cfg.cell < min) {
      console.warn(
        `[HUD_LAYOUT] pierścień "${name}": komórka ${cfg.cell} j. jest PONIŻEJ progu dotykowego ${min} j. ` +
          `(${(cfg.cell * 0.647).toFixed(1)} CSS px przy krótszej osi 375). Norma Material to 48 dp.`,
      );
    }
  }
  const attack = HUD_LAYOUT.attackRadius * 2;
  if (attack < min) {
    console.warn(`[HUD_LAYOUT] przycisk ataku ${attack} j. jest poniżej progu dotykowego ${min} j.`);
  }
}

/**
 * Zgłoś, że widżet chciał więcej slotów, niż pierścień ma kątów.
 *
 * Osobno od `ringSlot`, bo tamta jest wołana przy każdym przeliczeniu układu
 * (także przy zmianie rozmiaru okna) i zalałaby konsolę; ta idzie z budowy.
 */
export function warnIfOverflow(kind: ControlKind, wanted: number): void {
  if (!import.meta.env.DEV) return;
  const have = capacityOf(kind);
  if (wanted > have) {
    console.warn(
      `[HUD_LAYOUT] kontrolka "${kind}" ma ${have} miejsc, a widżet chce ${wanted}. ` +
        `Nadmiarowe NIE zostaną narysowane — dopisz miejsce w HUD_LAYOUT.place.${kind}.`,
    );
  }
}

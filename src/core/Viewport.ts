/**
 * Jak duże jest okno i ile ma NAPRAWDĘ pikseli.
 *
 * ⚠ **To jest jedna z dwóch rzeczy, które psuły cały obraz na telefonie**, więc
 * warto wiedzieć, po co istnieje. Domyślnie Phaser w trybie `RESIZE` robi
 * płótno o rozmiarze okna w pikselach **CSS** — na telefonie z `DPR ≈ 2,6`
 * oznacza to płótno 891×411 rozciągane przez przeglądarkę do 2340×1080. A że
 * `pixelArt: true` ustawia `image-rendering: pixelated`, rozciąganie jest
 * najbliższym sąsiadem: kafle to znoszą (i tak są klockowate), ale **tekst się
 * rozpada** — zgłoszone wprost jako „napisy nieczytelne, w aplikacjach mam
 * mniejszą czcionkę i czytam normalnie". Aplikacja natywna rysuje tekst w
 * pikselach URZĄDZENIA i dlatego wygrywa przy dowolnym rozmiarze.
 *
 * Gra liczy więc wszystko w pikselach urządzenia (`main.ts` używa
 * `Scale.NONE` + `zoom: 1/DPR`), a `UI_SCALE`/`CAMERA` mnożą przez `DPR`, żeby
 * fizyczny rozmiar rzeczy się nie zmienił.
 */

/**
 * Ile pikseli urządzenia przypada na piksel CSS, przycięte od góry.
 *
 * ⚠ Sufit jest po to, żeby telefon QHD (DPR 3,5+) nie kazał rysować 4 mln
 * pikseli na klatkę — Phaser i tak przepuszcza przez GPU całą mapę kafli.
 * Powyżej sufitu przeglądarka dorzuca resztę skalowania sama; jest to
 * odstępstwo od 1:1, ale znacznie mniejsze niż brak tej poprawki w ogóle.
 */
export function pixelRatio(): number {
  return Math.min(devOverride() ?? window.devicePixelRatio ?? 1, 3);
}

/**
 * `?dpr=2.625` w adresie — wyłącznie w buildzie deweloperskim.
 *
 * ⚠ Istnieje, bo **tej ścieżki nie da się sprawdzić na desktopie**: przeglądarka
 * na monitorze bez HiDPI raportuje DPR 1, więc cała różnica między „płótno w
 * pikselach CSS" a „płótno w pikselach urządzenia" jest tam niewidoczna, a to
 * właśnie ona zepsuła obraz na telefonie. Ten sam powód, dla którego istnieje
 * `window.dev`: alternatywą jest budowanie APK po każdej zmianie liczby.
 */
function devOverride(): number | null {
  if (!import.meta.env.DEV) return null;
  const raw = new URLSearchParams(window.location.search).get("dpr");
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Ostatnia deska ratunku, gdy **żadne** źródło rozmiaru nie odpowiedziało.
 *
 * ⚠ Celowo `1`, a nie „rozsądny domyślny telefon": zmyślony rozmiar wyglądałby
 * na działający i przeżyłby do pierwszego zrzutu ekranu. Jeden piksel jest
 * bezpieczny dla WebGL, natychmiast korygowany przez `fitToWindow()`
 * i **widoczny**, gdyby korekta kiedyś nie dojechała.
 */
const MIN_CSS_PX = 1;

/**
 * Rozmiar okna w pikselach CSS, czyli w tym, co odpowiada FIZYCZNEJ wielkości.
 *
 * ⚠⚠ **NIGDY nie zwraca zera w żadnej osi — i to jest niezmiennik, nie
 * ostrożność** (`B-1`, naprawione 2026-09-15).
 *
 * `main.ts` woła tę funkcję **w trakcie ewaluacji modułu** i wynikiem karmi
 * `Phaser.Game`. Dokument, który nie ma jeszcze layoutu, raportuje `0` —
 * a wtedy Phaser tworzy framebuffer **0×0**, WebGL odpowiada
 * `INCOMPLETE_ATTACHMENT`, renderer ginie na niezłapanym wyjątku i **żadna
 * scena nie startuje**: czarny ekran bez komunikatu.
 *
 * ⚠ **`fitToWindow()` tego NIE ratuje**, mimo że wygląda na zabezpieczenie:
 * wisi na zdarzeniu `resize`, czyli odpala się **po** śmierci renderera.
 * Zmierzone w panelu przeglądarki: `game.scale` pokazywał już 1024×768,
 * a `game.config` nadal `0×0`.
 *
 * Dlatego kolejka zejść jest tutaj, przy ŹRÓDLE pomiaru, a nie u wołającego —
 * `fitToWindow()` czyta tę samą funkcję i dostaje tę samą gwarancję za darmo.
 */
export function cssSize(): { width: number; height: number } {
  const parent = document.getElementById("game");
  const doc = document.documentElement;
  // Każde `||` przeskakuje zero i `undefined` — kolejno: kontener gry, okno,
  // korzeń dokumentu, ekran urządzenia (jedyne, co ma rozmiar także wtedy,
  // gdy dokument nie ma jeszcze layoutu).
  const width = parent?.clientWidth || window.innerWidth || doc?.clientWidth || window.screen?.width || 0;
  const height =
    parent?.clientHeight || window.innerHeight || doc?.clientHeight || window.screen?.height || 0;

  if (width > 0 && height > 0) return { width, height };

  // ⚠ **Ostrzeżenie, nie cicha podmiana.** Ta sama reguła, co przy brakującym
  // PNG (`core/Assets.ts`): gra ma wstać zawsze, ale degradacja musi zostawić
  // ślad w konsoli. Jeżeli to kiedykolwiek zobaczysz na urządzeniu, znaczy to,
  // że WebView policzył layout po starcie skryptu.
  console.warn(
    `[Viewport] Okno zgłosiło rozmiar ${width}×${height} przy starcie — ` +
      `podstawiam ${MIN_CSS_PX}×${MIN_CSS_PX} px, żeby Phaser nie dostał framebuffera 0×0. ` +
      `Właściwy rozmiar wejdzie pierwszym \`fitToWindow()\`.`,
  );
  return { width: MIN_CSS_PX, height: MIN_CSS_PX };
}

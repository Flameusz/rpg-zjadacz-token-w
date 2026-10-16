/**
 * Bounds-vs-viewport test for render culling — the geometry ONLY, no Phaser.
 *
 * ⚠ **Czysty moduł, jak `core/movement/MoveIntent.ts`/`NavGrid.ts`, i z tego
 * samego powodu**: da się go uruchomić w Node (`tools/culling_geometria_weryfikacja.mjs`),
 * więc da się deterministycznie dowieść, że drzewo z podstawą poza kadrem a
 * koroną w kadrze zostaje widoczne, zanim to w ogóle trafi na ekran telefonu.
 *
 * ⚠ **To NIE jest transformacja macierzowa kamery** (jak `Camera.cull()` w
 * Phaserze) — celowo, bo żaden z naszych kandydatów (korony, pnie, decor) nie
 * jest obracany ani przycinany kontenerem. Oba prostokąty (obiekt, viewport)
 * są już we WSPÓLNEJ przestrzeni świata (`camera.worldView` daje to za darmo,
 * bez odwracania macierzy) — więc zwykłe porównanie AABB jest tu poprawne i
 * tańsze niż to, co Phaser robi wewnętrznie dla ogólnego przypadku.
 */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Czy `bounds` (prawdziwy world-space bounding box JEDNEGO obiektu — korony
 * LUB pnia LUB dekoracji, nigdy „drzewa" jako pojęcia) nachodzi na `viewport`
 * powiększony o margines z każdej strony.
 *
 * ⚠ **Margines jest w pikselach ŚWIATA, osobno dla X i Y**, nie w „krotności
 * viewportu" — to ostatnie to decyzja WOŁAJĄCEGO (`RenderCuller`,
 * `CAMERA.cullMarginFactor × viewport.w` dla X, `× viewport.h` dla Y, bo
 * viewport rzadko jest kwadratowy), ta funkcja dostaje już gotowe liczby,
 * żeby test geometrii dało się sprawdzić niezależnie od tego, jak margines
 * jest dziś liczony.
 */
export function boundsInView(bounds: Rect, viewport: Rect, marginX: number, marginY: number): boolean {
  const left = viewport.x - marginX;
  const top = viewport.y - marginY;
  const right = viewport.x + viewport.w + marginX;
  const bottom = viewport.y + viewport.h + marginY;

  // Standardowy test nachodzenia dwóch AABB — ten sam kształt porównania co
  // `Phaser.Cameras.Scene2D.BaseCamera#cull` (`tw>left && tx<right && ...`),
  // tylko z jawnym marginesem zamiast surowych granic kamery.
  return bounds.x + bounds.w > left && bounds.x < right && bounds.y + bounds.h > top && bounds.y < bottom;
}

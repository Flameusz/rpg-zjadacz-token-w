/**
 * ── SKALA IKONY PRZEDMIOTU W KAFLU ─────────────────────────────────────────
 *
 * ⚠ **Ten plik powstał, bo ikona przestała być kwadratem (2026-09-19).**
 * Do tej daty każda ikona miała 32×32 px i każdy widżet mógł wpisać stałą
 * (`iconScale` w plecaku, ×1 w sklepie). Tarcza migdałowa, legionowa i pawęż
 * mają **32×64** — zajmują w plecaku dwa pola (`inventoryFootprint`) — więc
 * stała skala albo je zgniata, albo wysyła poza kafel.
 *
 * ⚠ **Plik jest CZYSTY — zero Phasera, zero stanu.** Ten sam powód, co przy
 * `EquipLayout`/`ShopLayout`: regułę, którą da się policzyć bez sceny, da się
 * sprawdzić bez uruchamiania gry.
 */

/**
 * Największa skala, przy której obrazek `w × h` mieści się w kaflu `boxW × boxH`.
 *
 * ⚠⚠ **Skala jest CAŁKOWITA, a przy zmniejszaniu — ODWROTNOŚCIĄ CAŁKOWITEJ**
 * (1, 1/2, 1/3 …). Powód jest ten sam, dla którego kafel plecaka ma `iconScale`
 * całkowite: ułamek w rodzaju 0,8125 rozmywa pixel-art pod NEAREST-em, a 1/2
 * wyrzuca co drugi piksel i zostaje ostre. ⛔ Nie „dopasowuj dokładnie" —
 * rozmyta ikona wygląda na zepsutą, mniejsza tylko na mniejszą.
 *
 * `max` ogranicza powiększenie (kafel plecaka nie chce ikon większych niż ×2,
 * choćby się mieściły); zmniejszanie nie ma dolnej granicy poza 1/8, bo niżej
 * z ikony 32 px zostaje kilka pikseli i nie niesie już żadnej informacji.
 */
export function iconFitScale(w: number, h: number, boxW: number, boxH: number, max = 2): number {
  if (w <= 0 || h <= 0) return 1;
  for (let s = Math.floor(max); s >= 1; s--) {
    if (w * s <= boxW && h * s <= boxH) return s;
  }
  for (let d = 2; d <= 8; d++) {
    if (w / d <= boxW && h / d <= boxH) return 1 / d;
  }
  return 1 / 8;
}

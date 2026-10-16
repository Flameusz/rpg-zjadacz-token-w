import type { Rect } from "./RenderCulling";

/**
 * Siatka zasłon — **geometria WYŁĄCZNIE, zero Phasera**.
 *
 * ⚠ **Czysty moduł, jak `RenderCulling.ts` / `movement/MoveIntent.ts`, i z tego
 * samego powodu**: da się go uruchomić w Node
 * (`tools/occlusion_weryfikacja.mjs`), więc „gracz pod koroną dostaje obrys,
 * gracz obok korony nie dostaje" da się udowodnić deterministycznie, zanim
 * cokolwiek trafi na ekran telefonu. Wpięcie Phasera mieszka osobno,
 * w `core/Occluders.ts`.
 *
 * ── Po co siatka, a nie zwykła pętla ──────────────────────────────────────
 * Mapa lasu autoruje **1641 koron** (`forrest.tmj`, warstwa `trees`), a pytanie
 * „czy coś zasłania gracza" pada CO KLATKĘ. Liniowe przemiatanie to ~98 tys.
 * testów AABB na sekundę za odpowiedź, która dotyczy jednego punktu na mapie.
 * Kubełki robią z tego kilka testów.
 *
 * ⚠ **Zasłony są STATYCZNE i to jest warunek poprawności tej struktury** —
 * dokładnie ten sam warunek, pod którym `RenderCuller` liczy swoje `bounds`
 * raz, przy rejestracji. Korona drzewa i kafel dachu nigdy nie wołają
 * `setPosition`. ⛔ Cokolwiek się rusza, nie ma tu czego szukać.
 *
 * ⚠ **To NIE jest system kolizji ani nawigacji.** `NavGrid` odpowiada „czy tędy
 * przejdę", ta siatka — „czy mnie stąd widać". Dwie różne przestrzenie
 * (kolizja pnia to 16 px, korona to 96) i zlanie ich dałoby obrys wszędzie
 * tam, gdzie stoi drzewo, zamiast tam, gdzie ono naprawdę przykrywa.
 */

/**
 * Bok kubełka w px świata.
 *
 * ⚠ Cztery kafle (4 × 32). Największa korona w rosterze ma 96 px
 * (`TREE_STAMP_CELL`), więc jedna zasłona trafia najwyżej do 2×2 kubełków —
 * czyli indeks nie puchnie, a zapytanie o sylwetkę gracza (31×60 px) dotyka
 * najwyżej czterech.
 */
const CELL = 128;

/** Nachodzenie dwóch AABB. Ta sama forma porównania co `boundsInView`. */
function overlap(a: Rect, b: Rect): boolean {
  return a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h;
}

/**
 * Statyczne prostokąty zasłon, kubełkowane po siatce.
 *
 * ⚠ **Prostokąt ma opisywać RYSUNEK, nie komórkę arkusza.** Stempel drzewa
 * siedzi w komórce 96 × 96, ale sadzonka zajmuje w niej 32 px szerokości —
 * zarejestrowanie całej komórki dałoby obrys graczowi stojącemu **32 px obok**
 * drzewa, czyli dokładnie ten fałszywy alarm, którego to zadanie ma nie mieć.
 * Zmierzone `w`/`h` niesie wygenerowany `TreeStampManifest`.
 */
export class OcclusionGrid {
  private readonly buckets = new Map<number, Rect[]>();
  private licznik = 0;

  /** Ile zasłon zarejestrowano — do raportu `dev`, nie do logiki. */
  get size(): number {
    return this.licznik;
  }

  private static klucz(cx: number, cy: number): number {
    // Para (cx, cy) → jedna liczba. Cantor byłby ładniejszy, ale mapa ma
    // 240×90 kafli (las po rozstawie 2026-10-04), więc mnożenie przez 100 000
    // jest tu bezpieczne i tańsze.
    return cx * 100_000 + cy;
  }

  add(rect: Rect): void {
    if (rect.w <= 0 || rect.h <= 0) return; // zasłona bez powierzchni nic nie zasłania
    this.licznik++;
    const x0 = Math.floor(rect.x / CELL);
    const x1 = Math.floor((rect.x + rect.w) / CELL);
    const y0 = Math.floor(rect.y / CELL);
    const y1 = Math.floor((rect.y + rect.h) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = OcclusionGrid.klucz(cx, cy);
        const lista = this.buckets.get(k);
        if (lista) lista.push(rect);
        else this.buckets.set(k, [rect]);
      }
    }
  }

  /**
   * Czy którakolwiek zasłona nachodzi na `query`.
   *
   * ⚠ **Wychodzi na PIERWSZYM trafieniu** — pytanie brzmi „czy cokolwiek",
   * nie „ile rzeczy". Przy gęstym lesie to jest różnica między jednym testem
   * a kilkunastoma.
   */
  covers(query: Rect): boolean {
    const x0 = Math.floor(query.x / CELL);
    const x1 = Math.floor((query.x + query.w) / CELL);
    const y0 = Math.floor(query.y / CELL);
    const y1 = Math.floor((query.y + query.h) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const lista = this.buckets.get(OcclusionGrid.klucz(cx, cy));
        if (!lista) continue;
        for (const r of lista) if (overlap(r, query)) return true;
      }
    }
    return false;
  }

  clear(): void {
    this.buckets.clear();
    this.licznik = 0;
  }
}

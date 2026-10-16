/**
 * **Ognisko klawiatury** — kto w tej chwili ma ekran, a więc i klawisze
 * (`OI-52`, 2026-10-09).
 *
 * Uchwyty klawiszy w Phaserze są globalne dla sceny: działają przy otwartym
 * panelu i w trakcie rozmowy. Do tej daty dawało to dwa zmierzone skutki:
 * **(a)** `E` na najwyższym poziomie rozmowy zamykał ją (`NpcDialog`)
 * i w TYM SAMYM naciśnięciu otwierał z powrotem (`ContextAction` widział już
 * zamkniętą rozmowę i NPC obok); **(b)** `C`/`B`/`L`/`M`/`Z` otwierały panel
 * postaci NA rozmowie, a jego zamknięcie wznawiało świat, choć rozmowa
 * dalej była otwarta.
 *
 * Dwa mechanizmy, bo to dwa różne pytania:
 * - `owner` — „czy ekran należy teraz do kogoś innego niż świat". Właściciel
 *   (modal) ustawia go przy otwarciu i zwalnia przy zamknięciu.
 * - `consume`/`consumed` — „czy TO naciśnięcie zostało już obsłużone".
 *   Potrzebne, bo właściciel zwalnia ognisko w trakcie obsługi zdarzenia,
 *   a uchwyty zarejestrowane po nim dostają ten sam obiekt zdarzenia —
 *   samo `owner` widziałyby już jako wolne. Stąd błąd (a).
 *
 * ⚙ Dotyku to nie dotyczy — tam arbitraż istnieje osobno
 * (`docs/systemy/input.md` §4). Android Back idzie przez `core/BackHandler`.
 */
export type KeyFocusOwner = "dialog" | "panel";

const handled = new WeakSet<object>();

export const KeyFocus = {
  owner: null as KeyFocusOwner | null,

  /** Ten modal przejmuje ekran (wołane przy otwarciu). */
  take(owner: KeyFocusOwner): void {
    this.owner = owner;
  },

  /** Zwolnij ekran — tylko jeśli należał do `owner` (zamknięcie cudzego
   *  modala nie może oddać ogniska, którego nie miał). */
  release(owner: KeyFocusOwner): void {
    if (this.owner === owner) this.owner = null;
  },

  /** Czy klawisz świata może działać: nikt nie trzyma ekranu i nikt tego
   *  naciśnięcia jeszcze nie obsłużył. */
  worldMay(event: unknown): boolean {
    return this.owner === null && !this.consumed(event);
  },

  /** Oznacz naciśnięcie jako obsłużone. */
  consume(event: unknown): void {
    if (event && typeof event === "object") handled.add(event);
  },

  consumed(event: unknown): boolean {
    return !!event && typeof event === "object" && handled.has(event);
  },

  /** Restart sceny UI — żaden modal nie przeżywa `SHUTDOWN`. */
  reset(): void {
    this.owner = null;
  },
};

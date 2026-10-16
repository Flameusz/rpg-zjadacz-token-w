/**
 * **CECHY RODZIN BRONI — deklaracja, nie opcjonalne pole liczbowe.**
 *
 * Wprowadzone 2026-09-03 (D5 audytu `docs/audyt_projektowy_fundamentow_2026-09-03.md`).
 *
 * ── Co było źle ──────────────────────────────────────────────────────────
 * Tożsamość rodziny była **opcjonalnym polem** na wpisie `WEAPON_FAMILY`
 * (`parryBonus`, `critMultiplierBonus`, `staggerMs`), czytanym przez
 * `"parryBonus" in f` w czterech miejscach `Progression` i w trzech gałęziach
 * `ui/MasteryCard`. Ten kształt ma sufit i **już go dotknął**:
 *
 *  - **włócznia nie ma czego zadeklarować** — jej tożsamością jest ZASIĘG,
 *    czyli parametr modelu, a nie mnożnik do pomnożenia. Skończyło się
 *    zapisaną decyzją, że M-II i M-IV są dla niej PUSTE (D3, §14 checkpointu);
 *  - **topór i sztylet potrzebowały osobnego nośnika** (`φ`), bo ładunek rangi
 *    mnoży EFEKT cechy, a ich cecha miała bazę zero.
 *
 * Każda przyszła rodzina, której tożsamość nie jest liczbą (łuk — dystans,
 * kostur — zasób, tarcza bojowa — kontrola), powtórzyłaby jedną z tych dwóch
 * historii.
 *
 * ── Co jest teraz ────────────────────────────────────────────────────────
 * Rodzina **deklaruje listę cech**. Cecha może nieść liczbę (`parryBonus`),
 * może być czystym znacznikiem (`reach`), a w przyszłości może opisywać
 * zachowanie — bez dokładania pola do wpisu i bez `in`-guarda u czytelnika.
 *
 * ⛔ **Ani jedna liczba nie została zmieniona**: miecz 0,15, topór 0,25,
 * sztylet 0,20, obuch 50 ms. Włócznia dostała `reach` jako **jawną deklarację
 * tego, co i tak było prawdą** — jej cecha jest w modelu broni, nie w rodzinie.
 *
 * ⚠ **Ładunek rangi Mastery mnoży EFEKT, nie tę wartość** (D1, §14). Ten plik
 * dostarcza wyłącznie bazę; mnożnik przykłada `Progression`.
 */

/**
 * Jedna cecha rodziny.
 *
 * ⚠ **Unia po `kind`, nie worek opcjonalnych pól** — nowa cecha dokłada wariant
 * i kompilator wskazuje każde miejsce, które musi się do niej odnieść.
 */
export type WeaponTrait =
  /**
   * Rodzina, której osią jest PAROWANIE. **Znacznik bez wartości** — dokładnie
   * jak `reach` niżej i z tego samego powodu: liczba mieszka w MODELU broni
   * (`melee.parryBonus`), a rodzina mówi tylko, czym jest.
   *
   * ⚠⚠ **Do 2026-09-16 ta cecha niosła `value: 0.15` i przez to KAŻDY miecz
   * parował tak samo** — rapier, kord i tasak dostawałyby premię rapiera
   * wyłącznie dlatego, że dzielą rodzinę. Rodzina jest szeroką kategorią
   * BIEGŁOŚCI, a nie zestawem parametrów; tożsamość konstrukcji należy do
   * konstrukcji. ⛔ Nie przywracaj tu wartości liczbowej.
   *
   * ⭐ Znacznik zostaje, bo czyta go ranga Mastery: `Progression.parryChance`
   * mnoży EFEKT przez `traitMul`, a karta rangi musi wiedzieć, że akurat
   * w tej rodzinie ranga podnosi paradę.
   */
  | { readonly kind: "parry" }
  /** Rodzina, która bije MOCNIEJ w krytyku — dodatek do `PLAYER.critMultiplier`. */
  | { readonly kind: "critMultiplierBonus"; readonly value: number }
  /** Rodzina, która ZACHWIEWA — ile ms trafienie blokuje ruch celu. */
  | { readonly kind: "staggerMs"; readonly value: number }
  /**
   * Rodzina, której tożsamością jest ZASIĘG. **Znacznik bez wartości i to jest
   * cała treść tego wariantu**: liczba mieszka w modelu broni (`melee.reach`),
   * a rodzina tylko mówi, czym jest. Do 2026-09-03 włócznia nie miała jak tego
   * powiedzieć i wyglądała na rodzinę z brakującym polem.
   */
  | { readonly kind: "reach" };

export type WeaponTraitKind = WeaponTrait["kind"];

/** Wpis rodziny, o który da się zapytać o cechy. */
export interface HasWeaponTraits {
  readonly traits: readonly WeaponTrait[];
}

/** Cecha danego rodzaju, albo `null`. `null` jako rodzina = gołe ręce i kij. */
export function familyTrait<K extends WeaponTraitKind>(
  family: HasWeaponTraits | null | undefined,
  kind: K,
): Extract<WeaponTrait, { kind: K }> | null {
  const t = family?.traits.find((x) => x.kind === kind);
  return (t as Extract<WeaponTrait, { kind: K }>) ?? null;
}

/** Czy rodzina niesie tę cechę — bez pytania o jej wartość. */
export function familyHasTrait(
  family: HasWeaponTraits | null | undefined,
  kind: WeaponTraitKind,
): boolean {
  return familyTrait(family, kind) !== null;
}

/**
 * Liczba niesiona przez cechę, albo `fallback`.
 *
 * ⚠ Cecha bez wartości (`reach`) zwraca `fallback` — pytanie „ile" nie ma dla
 * niej sensu i **nie ma udawać, że ma**.
 */
export function familyTraitValue(
  family: HasWeaponTraits | null | undefined,
  kind: WeaponTraitKind,
  fallback = 0,
): number {
  const t = familyTrait(family, kind);
  return t && "value" in t ? t.value : fallback;
}

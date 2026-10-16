import type { ActiveEffect, EffectSet } from "./StatusEffects";

/**
 * **RODZAJE EFEKTÓW — jedno miejsce, w którym zapisane są ich TAGI i KLUCZE.**
 *
 * Wprowadzone 2026-09-03 po niezależnym review warstwy efektów. Powód jest
 * konkretny i był realną dziurą, nie estetyką:
 *
 * ── Co było źle ───────────────────────────────────────────────────────────
 * Odsprzężenie z D3 rozdzieliło **producenta** efektu (`VenomSpider`,
 * `Projectile`) od jego **konsumenta** (`Player`) — słusznie. Ale umowa między
 * nimi została gołym stringiem po obu stronach granicy modułu:
 *
 * ```
 * VenomSpider   tags: ["poison"]   payload: { damagePerStack, tickMs }
 * Player        TAG_POISON         effect.data.damagePerStack
 * ```
 *
 * `data` to `Record<string, number>`, `tags` to `string[]`, a stałe `TAG_*`
 * były **prywatne w `Player.ts`**. Literówka po którejkolwiek stronie
 * kompilowała się, przechodziła `tsc` i przechodziła uprząż efektów (ta
 * testuje księgowość własnymi literałami) — a objawiała się jako **jad, który
 * nie zadaje obrażeń**. Bez błędu, bez logu. To jest dokładnie ta klasa
 * awarii, którą projekt ma opisaną jako najdroższą („lustra rozjeżdżają się
 * cicho", `src/core/CLAUDE.md`).
 *
 * ── Co jest teraz ─────────────────────────────────────────────────────────
 * Rodzaj efektu deklaruje **tag i komplet swoich kluczy JEDEN RAZ**. Producent
 * buduje payload przez `payload()`, konsument czyta przez `get()`, a oba
 * wywołania odnoszą się do tego samego typu — więc niezgodność jest **błędem
 * kompilacji u obu stron naraz**, nie ciszą w czasie gry.
 *
 * ⛔ **To NIE jest rejestr efektów i nie wolno mu nim zostać.** Nie ma tu
 * czasów trwania, obrażeń, ikon, nazw ani `detail` — te należą do właściciela
 * efektu i mają tam zostać (skoczek buduje SWÓJ jad, `combat/Contracts.ts`).
 * Tutaj mieszka wyłącznie **słownictwo**: jak ten efekt się nazywa w `tags`
 * i jakie liczby wozi w `payload`.
 *
 * ⛔ **Nie dokładaj rodzaju, dopóki nie ma efektu, który go używa.** Cztery
 * niżej to komplet dzisiejszych efektów gry — ta sama reguła, co o martwych
 * slotach manekina (`src/core/CLAUDE.md`).
 *
 * ⚠ **Plik jest CZYSTY — żadnego Phasera, żadnej encji** — i jest to pilnowane
 * przez strażnika czystości w `tools/combat_regresja.mjs`.
 */

/**
 * Słownik kategorii efektów.
 *
 * ⚠ **`EffectSpec.tags` zostaje `readonly string[]`, a nie `EffectTag[]`** —
 * i to jest świadome. Zawężenie tamtego pola kazałoby `StatusEffects.ts`
 * (czysta księgowość, która z założenia **nie zna żadnego konkretnego
 * efektu**) zaimportować listę konkretnych efektów. Warstwa ma nie wiedzieć,
 * czym jest jad; producent zapisuje tag przez `KIND.tag`, więc string i tak
 * powstaje w jednym miejscu.
 */
export const EFFECT_TAG = {
  poison: "poison",
  bleed: "bleed",
  slow: "slow",
  buff: "buff",
  food: "food",
} as const;

export type EffectTag = (typeof EFFECT_TAG)[keyof typeof EFFECT_TAG];

/**
 * Rodzaj efektu: tag + kontrakt jego liczb.
 *
 * `P` opisuje **komplet** kluczy payloadu tego efektu. Producent i konsument
 * odnoszą się do tego samego `P`, więc rozjechanie się nazwy klucza jest
 * błędem kompilacji, a nie cichym zerem.
 */
export interface EffectKind<P extends Readonly<Record<string, number>>> {
  readonly tag: EffectTag;
  /**
   * Payload do `EffectSpec`. ⚠ **Jedyne miejsce, w którym producent zapisuje
   * liczby tego efektu** — brakujący albo nadmiarowy klucz nie kompiluje się.
   */
  payload(values: P): Readonly<Record<string, number>>;
  /** Jedna ŻYWA liczba efektu. Brak klucza → wartość domyślna z deklaracji. */
  get(effect: ActiveEffect, key: keyof P & string): number;
  /**
   * Zapis żywej liczby — dla efektów, które się ZUŻYWAJĄ (pula posiłku).
   * ⚠ Nie „nowa mechanika": `Player.regenerate` odejmował `data.remaining`
   * wprost od 2026-09-03, to jest ta sama operacja pod nazwą.
   */
  set(effect: ActiveEffect, key: keyof P & string, value: number): void;
  /** Czy ten żywy efekt jest tego rodzaju. */
  carries(effect: ActiveEffect): boolean;
  /** Pierwszy żywy efekt tego rodzaju w zbiorze — host nie musi znać `id`
   *  (jad i spowolnienie mają `buffId` z configu, nie ze stałej). */
  find(set: EffectSet): ActiveEffect | undefined;
}

/**
 * Zadeklaruj rodzaj efektu.
 *
 * ⚠ **Wartości w `defaults` służą DWÓM rzeczom naraz**: nazywają komplet kluczy
 * (stąd typ `P`) i podają odczyt awaryjny, gdy klucza w żywych danych nie ma.
 * Dlatego muszą być **neutralne** — takie, przy których efekt niczego nie robi.
 */
function defineKind<P extends Readonly<Record<string, number>>>(
  tag: EffectTag,
  defaults: P,
): EffectKind<P> {
  return {
    tag,
    payload: (values) => ({ ...values }),
    get: (effect, key) => effect.data[key] ?? defaults[key],
    set: (effect, key, value) => {
      effect.data[key] = value;
    },
    carries: (effect) => effect.spec.tags?.includes(tag) ?? false,
    find: (set) => set.firstWithTag(tag),
  };
}

/**
 * **Jad** — jedyny dziś efekt tikający. Nakłada go `VenomSpider`, obrażenia
 * liczy `Player.onEffectTick`.
 *
 * ⚠ `tickMs` jedzie w payloadzie **obok** `spec.tickMs` i to nie jest
 * duplikat do posprzątania: `spec.tickMs` steruje księgowością, a ten wozi tę
 * samą liczbę do OPISU na pasku (`detail`). Rozdzielone, bo pierwsza należy
 * do warstwy, druga do prezentacji.
 */
export const POISON = defineKind(EFFECT_TAG.poison, { damagePerStack: 0, tickMs: 0 });

/**
 * **Krwawienie** — nakłada je `Rozcięcie` gracza, obrażenia liczy
 * `Enemy.onEffectTick`. Pierwszy efekt w grze jadący w kierunku
 * **gracz → wróg** (2026-09-04).
 *
 * ⚠ **`damagePerTick`, nie `damagePerStack` jak jad — i różnica jest
 * zamierzona.** Jad skacze do 3 stosów i mnoży obrażenia przez ich liczbę;
 * Krwawienie ma `maxStacks: 1`, więc „na stos" opisywałoby mechanikę, której
 * nie ma. Gdyby stosy kiedyś doszły, zmiana nazwy klucza będzie **błędem
 * kompilacji u producenta i u konsumenta naraz** — o to w tym pliku chodzi.
 *
 * ⛔ **Zero pól pod przyszłe warianty.** Rozdarcie, Rozszarpanie i konsumpcja
 * Krwawienia dokładają swoje klucze RAZEM ze swoim kodem, nie wcześniej.
 */
export const BLEED = defineKind(EFFECT_TAG.bleed, { damagePerTick: 0 });

/** **Spowolnienie** — sieć sieciarza. `factor` to MNOŻNIK prędkości, więc
 *  neutralną wartością jest 1, nie 0. */
export const SLOW = defineKind(EFFECT_TAG.slow, { factor: 1 });

/** **Buff obrażeń** — Okrzyk bojowy. `bonus` jest DODATKIEM do mnożnika (`1 +
 *  bonus`), więc neutralne jest 0. */
export const DAMAGE_BUFF = defineKind(EFFECT_TAG.buff, { bonus: 0 });

/** **Posiłek** — leczenie rozłożone w czasie. `remaining` ZUŻYWA się w miarę
 *  oddawania HP (patrz `set`), `perSecond` jest stałe. */
export const FOOD_HEAL = defineKind(EFFECT_TAG.food, { remaining: 0, perSecond: 0 });

import type { DamageType } from "../Equipment";

/**
 * **PAKIET OBRAŻEŃ — kontrakt, którym cios podróżuje między encjami.**
 *
 * ⚠ **To jest zmiana KONTRAKTU, nie mechaniki** (2026-09-03, D2 audytu
 * `docs/audyt_projektowy_fundamentow_2026-09-03.md`). Do tej daty obrażenia
 * jechały przez granicę encji jako `(amount: number, damageType)` — jedna
 * liczba z **wyłączną** etykietą. Ten kształt nie ma gdzie pomieścić ciosu
 * „12 ciętych + 5 ognia", więc żywioły, obrażenia mieszane i odporności
 * wymagałyby przepisania każdego wywołania w grze. Dziś takich wywołań jest
 * kilkanaście; przy 200 broniach i 50 umiejętnościach będzie ich kilkaset.
 *
 * ⛔ **Ani jednej nowej mechaniki.** Żywiołów, odporności, penetracji,
 * absorpcji i lifestealu tu NIE MA i mieć nie miało. Każdy dzisiejszy cios
 * niesie **dokładnie jeden** komponent i liczy się co do bitu tak, jak przed
 * tą zmianą.
 *
 * ── Otwarta decyzja, świadomie NIEROZSTRZYGNIĘTA ──────────────────────────
 * ⚠ **Jak mitygować pakiet WIELOSKŁADNIKOWY** — to jest pytanie projektowe,
 * nie techniczne, i nie wolno go rozstrzygnąć przez przypadek implementacji:
 *
 *  - podłoga `Math.max(1, …)` na KAŻDYM komponencie daje ciosowi dwuskładnikowemu
 *    minimum 2, jednoskładnikowemu 1 — czyli sam podział na składowe zmieniałby
 *    dolny koniec;
 *  - blok i pancerz mają dziś jeden mnożnik na cały cios; przy żywiołach każdy
 *    komponent może chcieć własnej redukcji.
 *
 * Dlatego **warstwa 3 (`DamageResolver`) dalej pracuje na SUMIE** i tak ma
 * zostać do chwili, gdy pojawi się pierwszy realny drugi komponent. Szew jest
 * tutaj: `totalAmount()` i `primaryType()` są jedynymi miejscami, w których
 * pakiet spłaszcza się do dzisiejszej pary liczba+typ.
 */
export interface DamageComponent {
  readonly amount: number;
  /**
   * Typ obrażeń tego komponentu. `null` = **bez typu**, czyli pancerz nie ma
   * profilu do zastosowania (kontakt, pocisk sieciarza) — to jest legalny stan
   * modelu, nie brak danych (`Protection.armorPointsAgainst`).
   */
  readonly type: DamageType | null;
}

export interface DamagePacket {
  readonly components: readonly DamageComponent[];
}

/**
 * Cios jednoskładnikowy — **dzisiaj każdy cios w grze**.
 *
 * ⚠ Nazwa mówi „physical" nie dlatego, że istnieje magia, tylko dlatego, że
 * `DamageType` to dziś wyłącznie trzy typy fizyczne (`slash`/`pierce`/`blunt`)
 * wyprowadzone z `ARMOR_PROFILE`.
 */
export function physicalDamage(amount: number, type: DamageType | null = null): DamagePacket {
  return { components: [{ amount, type }] };
}

/** Suma wszystkich komponentów — wejście do warstwy 3 (patrz nagłówek). */
export function totalAmount(packet: DamagePacket): number {
  let suma = 0;
  for (const c of packet.components) suma += c.amount;
  return suma;
}

/**
 * Typ **pierwszego** komponentu, czyli „czym ten cios jest" dla pancerza,
 * ikony obrażeń i cue.
 *
 * ⚠ **Poprawne dokładnie dopóki pakiety są jednoskładnikowe.** Kiedy pojawi
 * się drugi komponent, to wywołanie stanie się pytaniem bez dobrej odpowiedzi
 * i **musi** zostać zastąpione mitygacją per komponent — nie „ulepszone"
 * heurystyką typu „największy komponent wygrywa".
 */
export function primaryType(packet: DamagePacket): DamageType | null {
  return packet.components[0]?.type ?? null;
}

/**
 * Przeskaluj każdy komponent tą samą funkcją — dla mnożników, które dotyczą
 * CAŁEGO ciosu: `m(P)`, Ześlizg, mnożnik umiejętności, buff Okrzyku.
 *
 * ⚠ Zwraca NOWY pakiet; `DamagePacket` jest niemutowalny z założenia, bo jeden
 * zamach potrafi trafić kilku przeciwników i każdy liczy sobie własną redukcję.
 */
export function mapAmounts(packet: DamagePacket, f: (amount: number) => number): DamagePacket {
  return { components: packet.components.map((c) => ({ amount: f(c.amount), type: c.type })) };
}

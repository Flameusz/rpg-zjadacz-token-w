---
typ: DECYZJA
domena: proces
tytul: Efekty czasowe są osobną domeną
stan: zamkniety
moc: ACTIVE
data: 2026-09-06
kotwice: [src/core/combat/StatusEffects.ts, tools/effects_weryfikacja.mjs]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Efekty czasowe są osobną domeną

## Rozstrzygnięcie

> **`effects` zostaje **27. domeną** na liście kanonicznej. Nie jest częścią
> `abilities` ani `combat`.**

Właściciel **księgowości tego, co trwa w czasie**: tożsamość efektu, stosy
i odświeżanie, kadencja tików, wygasanie, rozproszenie, tagi, atrybucja
sprawcy, przenoszenie między scenami — oraz reguła nadrzędna **„warstwa mówi
ILE JESZCZE, host mówi CO TO ROBI"**.

**Decyzja autora, 2026-09-06**, po analizie granic wykonanej przed ekstrakcją
domeny `abilities`.

## Co odrzucono i dlaczego

⛔ **`effects` jako część `abilities`.** Odrzucone **pomiarem producentów**:
z pięciu rodzajów efektów w grze **trzy nie pochodzą od umiejętności** (jad —
stworzenie, spowolnienie — pocisk stworzenia, leczenie posiłkiem —
**przedmiot konsumpcyjny**). Z pięciu miejsc nałożenia efektu tylko dwa należą
do umiejętności. Warstwa byłaby wtedy domem, w którym większość mieszkańców
jest gośćmi.

⛔ **`effects` jako część `combat`.** Odrzucone jednym kontrprzykładem:
**leczenie posiłkiem nie jest walką**. Czyta definicję przedmiotu i jego ikonę,
a host wstrzymuje je regułą pięciu sekund poza walką. Umieszczenie go w `combat`
oznaczałoby, że domena walki opisuje jedzenie.

⛔ **`effects` bez własnej domeny, opisane „przy okazji" w trzech miejscach.**
To jest stan dzisiejszy i właśnie on jest problemem: reguły warstwy żyją
**wyłącznie w komentarzach kodu**, a dwie z nich zostały opisane w dokumencie
o **jednej konkretnej umiejętności**.

## Co przesądziło

1. **Warstwa nie interpretuje ładunku.** Deklaruje to wprost i dowodzi tym, że
   drugi nosiciel (`Enemy`, 2026-09-04) doszedł **bez ani jednej linijki zmiany
   w niej samej**. System, który nie zna żadnego swojego klienta, nie jest
   częścią żadnego z nich.
2. **Obaj nosiciele.** Gracz i stworzenie implementują ten sam kontrakt, więc
   domena obejmuje obie strony walki — i jedną rzecz spoza walki.
3. **Własny przymiar** — `tools/effects_weryfikacja.mjs`, 65 sprawdzeń na
   czystym module.
4. **Test kontraktu §4:** „domena jest jednostką, o którą ktoś pyta". Pytanie
   „jak działają efekty czasowe w tej grze" jest zadawane i dziś nie ma jednego
   adresu.

## Co z tego wynika

- `DOC_CONTRACT.md` §4 dostaje **jedną linię** w bloku domen. To jedyna zmiana
  kontraktu wynikająca z tej decyzji.
- Reguły warstwy przenoszą się do `docs/systemy/effects.md`.
- ⚠ **Dokumenty o konkretnych efektach zostają tam, gdzie są** (`HISTORIA` /
  `DECYZJA`) — decyzja SYSTEM/CONTENT nie zmienia się ani o zdanie.

## Znane ryzyko

⚠ **Lista domen przestała być zamknięta.** Do 2026-09-06 kontrakt miał 26 pozycji
i traktowaliśmy je jak zbiór skończony; teraz wiadomo, że **kod potrafi
wyprodukować system, którego na liście nie ma**. ⛔ To **nie** jest zgoda na
dokładanie domen wygodą — §4 kontraktu („nie dodawaj domeny, żeby zmieścić jeden
dokument") obowiązuje bez zmian, a każda kolejna wymaga **osobnej decyzji
z dowodami**, takimi jak wyżej.

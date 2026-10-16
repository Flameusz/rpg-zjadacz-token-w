---
typ: DECYZJA
domena: [items, weapons]
tytul: Schowany zestaw broni waży pełną masę
stan: zamkniety
moc: ACTIVE
data: 2026-09-15
kotwice:
  - src/core/Equipment.ts
otwarte: [OI-104]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-15
---

# Schowany zestaw broni waży pełną masę

> **Rozstrzyga `OI-96`** — czy `weapon2` / `offhand2` mają wchodzić do
> obciążenia. Decyzja autora, 2026-09-15.
>
> ⚠ **Domyka to, co `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` §7
> zostawiła świadomie otwarte.** Tamta decyzja zawierała rekomendację i jawnie
> jej nie zamykała; ta ją zamyka. Model D, jego architektura i **wszystkie jego
> parametry startowe pozostają nietknięte**.
>
> ⛔ **Nie rozstrzyga niczego w `src/` — kod jest nietknięty.** Wdrożenie
> należy do `OI-104`.

---

## 1. CO ROZSTRZYGNIĘTO

> ## ⭐ Przedmiot schowany NA CIELE liczy się do obciążenia dokładnie tak samo, jak noszony.

- **`weapon2` = 100% swojej masy.**
- **`offhand2` = 100% swojej masy.**
- ⛔ **Nie wprowadzamy `stowedWeightFactor = 0,5`** ani żadnego innego mnożnika.
- ⛔ **Nie tworzymy wyjątku dla `weapon2` / `offhand2`.**

**Uzasadnienie autora.** Schowany zestaw znajduje się **na postaci** i jest
częścią wyposażenia. Przy mechanice, w której masa steruje ruchem i zmęczeniem
(Model D), **nie może ważyć zera**.

⚠ **To nie jest nowa teza — to spłata długu, który kod sam nazwał.** Komentarz
przy `STOW_SLOTS` w `src/core/Equipment.ts` brzmi: *„To, że schowana broń nie
WAŻY, jest DŁUGIEM, a nie tezą"*, i podaje spłatę: *„jedna pętla po
`STOW_SLOTS` w `equippedWeight`"*. Powodem odroczenia było wtedy to, że
**obciążenie jest niestrojone** — ten warunek zniknął razem z `OI-103`.

---

## 2. CZEGO TA DECYZJA NIE RUSZA

⛔ **PLECAK ZOSTAJE BEZ ZMIAN.** Przedmiot w plecaku, w dodatkowych torbach
i w skrzyni **nadal waży zero** (`BAG_SLOTS` poza `EQUIP_SLOTS`; reguła:
*„gracz ma móc nosić dużo rzeczy, a płacić tylko za to, co ma na sobie"*,
`docs/inventory_scroll_ux.md` §3). **To jest osobna decyzja i nie wolno jej
zmieniać przy okazji tej.**

⛔ **Model D bez zmian.** `speedK`, `regenK`, `effortFreeRatio`,
`effortPerRatio`, podłogi, soft cap Siły 20 i trening 1+2+3 — **żaden parametr
nie jest tą decyzją ruszany**. `OI-103` zostaje zamknięte jako **„Model D —
dwie osie, parametry STARTOWE do playtestu"**.

⛔ Bez zmian: `totalDefense`, `sumBonus`, zapis, `SAVE_VERSION`, wymagania Siły.
Schowany zestaw dalej **nie chroni i nie daje premii** — zmienia się wyłącznie
jego udział w **masie**.

---

## 3. ZNANA ASYMETRIA — nazwana, nie ukryta

Po wdrożeniu **zapasowy młot w plecaku będzie tańszy (0 kg) niż ten sam młot
w `weapon2` (7 kg)**.

To jest **przyjęta cena za wygodę sparowanej zamiany jednym kliknięciem**, a nie
przeoczenie. ⚠ Zapisane tutaj po to, żeby nie wróciło za trzy sesje jako
„znalazłem błąd: plecak omija obciążenie". Jeżeli kiedyś uznamy, że przenoszona
masa ma kosztować, **plecak i schowany zestaw wchodzą razem, osobną decyzją.**

---

## 4. ZMIERZONE SKUTKI

Koszt schowanego zestawu przy parametrach startowych Modelu D
(chód w px/s, w nawiasie delta):

| baza | bez zestawu | miecz + puklerz (4 kg) | młot + tarcza (12 kg) |
|---|---|---|---|
| strzelec 12 kg | 148 | 144 (−3,8) | 137 (−10,8) |
| lekki wojownik 25 kg | 136 | 133 (−3,2) | 127 (−9,2) |
| ciężki 40 kg | 125 | 122 (−2,7) | 117 (−7,8) |
| maks dziś 47,5 kg | 120 | 117 (−2,5) | 113 (−7,2) |
| ekstremum 62 kg | 111 | 109 (−2,2) | 105 (−6,2) |

⚠ **Potrafi przenieść build przez próg fauny** — świadomie przyjęte:

- 25 kg + topór i tarcza: 136 → 130 px/s — **przestaje odchodzić od Szarego (132)**
- 47,5 kg + topór i tarcza: 120 → 115 px/s — **przestaje odchodzić od watahy (115)**

⭐ **Zamiana zestawów jest neutralna masowo.** `swapWeaponSet()` wymienia
zawartość par, więc suma się nie zmienia — zamiana broni w panelu **nigdy nie
przeskoczy klasy obciążenia**. To wynika z decyzji, nie z osobnej reguły.

---

## 5. CO ODRZUCONO

### ⛔ 5.1 `stowedWeightFactor = 0,5`

Wymagałby **nowej stałej bez kotwicy pomiarowej** — a projekt ma regułę, że
liczba, której nic nie uzasadnia, jest długiem. Do tego nie rozwiązywałby
asymetrii z §3 (6 kg wciąż przegrywa z 0 kg w plecaku), więc płaciłby stałą za
nic.

### ⛔ 5.2 Zostawienie 0 kg

Sprzeczne z Modelem D: masa steruje ruchem, a 12 kg na plecach to masa.
Utrzymanie zera znaczyłoby, że **pierwszy playtest (`OI-105`) mierzy model
z dwunastokilogramową dziurą**.

### ⛔ 5.3 Wyjątek „schowane liczy się inaczej"

Wyjątek trzeba by potem obsłużyć w każdym miejscu liczącym masę. Reguła bez
wyjątku — *„na ciele waży, w plecaku nie"* — jest jednym zdaniem i nie ma
przypadków brzegowych.

---

## 6. CO TO ZNACZY DLA WDROŻENIA (`OI-104`)

⛔ **Niezrobione. To jest lista dla wdrożenia, nie opis stanu.**

1. `equippedWeight` iteruje `EQUIP_SLOTS` **i** `STOW_SLOTS`.
   ⚠ **Wyłącznie `equippedWeight`** — `totalDefense` i `sumBonus` zostają na
   samym `EQUIP_SLOTS`, bo schowany zestaw nadal nie chroni.
2. ⚠ **`ItemTooltip.weightLines` wymaga poprawki, inaczej zacznie kłamać.**
   Liczy podmianę przez `Equipment.slotForItem()`, które zwraca **slot CZYNNY**.
   Dwa skutki do naprawienia razem ze zmianą:
   - sztuka leżąca już w `weapon2` nie zostanie rozpoznana jako noszona
     (`worn === inst` nie zadziała) → podgląd **doliczy jej masę drugi raz**;
   - podgląd upuszczenia do slotu schowanego policzy podmianę w slocie czynnym.
3. Trzy miejsca czytające `equippedWeight` (`loadRatio`, `ItemTooltip`,
   `PlayerPanel` ×2) dostaną nową sumę **same** — są po stronie obciążenia
   i o to chodzi.
4. ⚠ **Komentarz przy `STOW_SLOTS` w `Equipment.ts` oraz przy torbach
   w `GameConfig.ts:5671` mówi dziś „nie waży".** Po zmianie **kłamie o kodzie**
   — to jest dokładnie klasa `DOCUMENTATION` z rejestru.
5. Przymiar `tools/obciazenie_przymiar.mjs` dostaje regułę na tę sumę
   — dziś jej nie ma i **to jest warunek odbioru `OI-104`**, nie „miło by było".

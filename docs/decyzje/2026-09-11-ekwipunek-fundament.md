---
typ: DECYZJA
domena: inventory
tytul: Fundament wyposażenia — układ z danych, warstwy, zestawy, dwa zestawy broni
stan: zywy
moc: ACTIVE
data: 2026-09-11
kotwice:
  - src/ui/EquipLayout.ts
  - src/ui/PlayerPanel.ts
  - src/core/Equipment.ts
  - src/core/ItemSets.ts
  - src/core/ArmorLayers.ts
  - GameConfig.ITEM_SETS
  - tools/ekwipunek_uklad.mjs
  - tools/build_slot_glyphs.py
otwarte: [OI-EQ-1, OI-EQ-2, OI-EQ-3, OI-EQ-4]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-11
---

# Fundament wyposażenia

## Co zostało rozstrzygnięte

Ekwipunek przestaje być **jednym rozmiarem i jednym obrazkiem**. Rozstrzygnięte
zostały cztery rzeczy naraz, bo każda z osobna wymagałaby ruszenia tego samego
kodu:

1. **Układ lalki jest DANYMI** (`EQUIP_CELLS` w `src/ui/EquipLayout.ts`),
   a geometrię liczy czysta funkcja z dostępnego miejsca.
2. **Panel bierze tyle ekranu, ile go jest** — rozmiar liczony z okna zamiast
   stałych 816×530 j.
3. **Zestawy przedmiotów istnieją jako SILNIK** (tag → próg → premia pochodna),
   bez ani jednego nowego przedmiotu.
4. **Drugi zestaw broni** jako para slotów poza `EQUIP_SLOTS`, z zamianą.

⚠ **Warstwowego pancerza NIE wdrożono i to jest częścią decyzji, nie jej
brakiem.** Wdrożone zostały dwie rzeczy, bez których warstwy byłyby przebudową
całego ekwipunku: kafel z miejscem na pasek warstw i **liczenie zestawów po
ELEMENTACH, nie po slotach**.

## Dlaczego stary układ nie dało się „poprawić"

Trzy sprzężenia, każde zmierzone, nie oszacowane:

- **Układ był własnością PNG.** `assets/ui/slots.png` to krata 3×4 z wypalonymi
  glifami, a `DOLL_LAYOUT` w `PlayerPanel.ts` był jej odbiciem w kodzie. Liczba
  slotów, ich bok (32 px × 2) i kolejność mieszkały w pikselach. Dołożenie
  slotu = przemalowanie grafiki.
- **Panel miał stały rozmiar 816×530 j.** Na telefonie (wirtualne 1257×580)
  zajmował **65% szerokości**; na monitorze 1920×1080 przy skali 1 — **42%
  szerokości i 49% wysokości**. Komentarz przy `columnsTop = −172` sam
  przyznawał, że jego uzasadnienie (budżet pionowy sprzed skali UI) jest
  nieaktualne.
- **Osiemnaście stałych** (`dollLeft`, `gridLeft`, `cardLeft`, `cell = 64`,
  `cols = 4`…) było prawdziwych dla dokładnie jednej kombinacji rozmiaru panelu
  i rozmiaru kafla.

## Czego uczą WoW i Eternium

Nie skopiowano żadnego z nich; wzięto po jednej właściwości:

| stamtąd | co działa | co z tego wzięto |
|---|---|---|
| WoW | **flanka wokół sylwetki** — stałe pozycje, pamięć mięśniowa, brak przewijania przy 19 slotach | trzy kolumny sylwetki, pozycja slotu niezależna od tego, ile masz |
| WoW | Equipment Manager — zapisane loadouty | **dwa zestawy broni** jako pierwszy, najmniejszy krok w tę stronę |
| WoW | ⛔ postęp setu **tylko w dymku sztuki** — „ile mam razem" wymaga najechania na pięć rzeczy | odwrócone: pasek zestawów i kolumna SZCZEGÓŁY mówią to bez dotykania czegokolwiek |
| Eternium | pełnoekranowy ekwipunek, wielkie cele dotykowe | panel liczony z okna, kafel z podłogą 68 j. |
| Eternium | **automatyczne porównanie** z noszonym | już było (`ItemTooltip.comparisonLines`), zostaje osią karty |
| Eternium | ⛔ płytka lista slotów | docelowe 14 slotów w układzie od razu |

**Odpowiedź na „prosty na początku, wygodny po setkach godzin"** nie brzmi
„więcej slotów". Brzmi: *stałe miejsca + filtr + porównanie + widoczny postęp
zestawu*. Trzy z tych czterech rzeczy nie zależą od liczby przedmiotów.

## Rozważone układy

**A. Flanka z figurą (WoW).** Dwie kolumny po bokach renderu postaci, broń pod
spodem. ⛔ **Odrzucony:** środek kosztuje ~150 j. szerokości, a figury w panelu
dziś nie ma (render 3D jest w świecie, nie w UI). Pusty środek to najdroższy
piksel w układzie, który na telefonie ma 516 j. wysokości na wszystko.

**B. Bloki tematyczne.** Osobne prostokąty PANCERZ / BIŻUTERIA / UŻYTKOWE /
BROŃ, każdy podpisany. ⛔ **Odrzucony:** cztery podpisy to 4 × 14 j. pionu,
a układ traci metaforę ciała — czyli jedyną rzecz, dzięki której gracz wie,
gdzie patrzeć, zanim przeczyta.

**C. Kręgosłup pancerza.** Cztery sloty warstwowe w jednej wysokiej kolumnie,
reszta satelitarnie. ⛔ **Odrzucony wprost przez autora:** *„unikaj sytuacji,
w której większość slotów znajduje się jeden pod drugim w jednej kolumnie"*.

**D. SYLWETKA — wybrany.** Trzy kolumny × cztery wiersze; **kolumna środkowa to
czwórka warstwowa** (głowa → tors → nogi → stopy), rale po bokach niosą resztę.
Broń osobno pod spodem: dwa podpisane zestawy po dwa kafle z przyciskiem
zamiany między nimi.

Dlaczego ten:
- żadna kolumna nie ma więcej niż cztery kafle — wymóg autora spełniony
  **z definicji siatki**, a nie przez staranność (pilnuje `ekwipunek_uklad.mjs`);
- oś ciała czytana z góry na dół siedzi w środku, czyli tam, gdzie pada wzrok;
- cztery sloty, które urosną o warstwy, są w jednej kolumnie — więc rozwinięcie
  kafla w listę warstw nie przestawi ani jednego innego slotu;
- regularna krata skaluje się jedną liczbą (bok kafla), a nie szesnastoma.

## Co z tego wyszło w liczbach

| ekran | panel (% okna) | bok kafla | widoczne kafle plecaka |
|---|---|---|---|
| S21 FE poziomo | 1225×556 (**97% / 96%**) | 70 j. | **25** (było 16) |
| laptop 1366×768 | 1280×744 (94% / 97%) | 82 j. | 35 |
| monitor 1920×1080 | 1280×860 (67% / 80%) | 82 j. | 40 |

Wcześniej: 816×530 na każdym z nich, 16 kafli, bok 64 j.

## Trzy rzeczy, które wyszły dopiero z RENDERU

Wszystkie trzy przeszły przez asercje arytmetyczne i **żadnej nie pokazała
liczba** — to ten sam wniosek, co reguła numer jeden w `tools/CLAUDE.md`:

1. **Przyciski filtra narysowane NA pierwszym rzędzie kafli** — siatka
   zaczynała się na tej samej wysokości co filtr. Stąd `gridTop` osobne od
   `columnsTop`.
2. **Rząd toreb wchodził na pasek zestawów** — torby były centrowane w kolumnie,
   a pasek liczył swoją lewą krawędź od krawędzi kolumny. Dwa elementy dzielące
   pas muszą liczyć się od tej samej krawędzi.
3. **Przycisk zamiany 34×34 j.** = 24 CSS px na telefonie przy normie 48 dp —
   jedyna kontrolka bloku była najmniejszym celem w panelu.

## Błąd znaleziony przy okazji (rdzeń, nie UI)

`equipFromBag(index, preferred)` przy slocie, który ODMAWIA, spadał na
`slotForItem` i zakładał przedmiot **gdzie indziej**. Dopóki sloty były jednym
zestawem, kończyło się to co najwyżej wyborem palca. Od drugiego zestawu:
upuszczenie tarczy na drugą rękę zestawu II (zablokowaną toporem dwuręcznym)
**zakładało ją w zestawie CZYNNYM**, wyrzucając stamtąd puklerz — i zwracało
`true`. Naprawa: wskazany slot, który odmawia, kończy operację.

## Co NIE weszło i dlaczego

- **`shoulders` / `belt` / drugi slot użytkowy nie są w `EquipSlot`.** Kafle są
  rysowane (układ docelowy ma być widoczny od razu), ale przygaszone, z powodem
  na dotknięcie. Reguła z `src/core/CLAUDE.md`: *komórka manekina jest martwa,
  dopóki nie istnieje przedmiot, który w nią wejdzie* — pusty slot w rdzeniu
  i tak przechodzi przez `sumBonus`, ląduje w każdym zapisie i odpowiada
  w `accepts`. Ożywają jednym wpisem w unii; **UI nie wymaga wtedy zmiany**,
  bo `slotHasItems()` wyprowadza „czy już są takie przedmioty" z `ITEMS`.
- **Warstwy jako mechanika.** Dziś warstwa jest metadaną: linia na karcie
  i kropka w kaflu.
- **Zamiana zestawu w walce.** Przycisk żyje w panelu, który pauzuje grę.
  Przełożenie broni w boju to osobna mechanika (czas, okno bezbronności, koszt),
  nie skutek uboczny drugiego slotu.
- **Waga schowanej broni.** Drugi młot na plecach nie waży — świadomy dług,
  bo obciążenie czeka na playtest i nie miesza się dwóch niezależnych zmian.

## Moc

**ACTIVE.** Punkty „co NIE weszło" są zamknięte jako zakres tej zmiany, nie jako
tezy na zawsze — każdy z nich ma w `docs/zadania.md` własną pozycję.

---
typ: DECYZJA
domena: [inventory, items]
tytul: Gabaryt w plecaku — siatka 4 kolumn jako geometria modelu
stan: zywy
moc: ACTIVE
data: 2026-09-18
kotwice:
  - GameConfig.INVENTORY.cols
  - src/core/Items.ts
  - src/core/Inventory.ts
  - src/ui/EquipLayout.ts
  - src/ui/PlayerPanel.ts
  - tools/gabaryt_przymiar.mjs
otwarte: [OI-123, OI-124]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-18
---

# Gabaryt w plecaku

## Co rozstrzygnięto

> **Gabaryt w plecaku (`inventoryFootprint`) określa fizyczną przestrzeń,
> jaką jeden przedmiot zajmuje w siatce plecaka. Jest NIEZALEŻNY od slotu
> Equipment, od `hands`, od `grip`, od masy i od statystyk.
> Dziś obsługiwane są `1×1` i `1×2`; `2×1`, `2×2` i obracanie są odłożone.**

> **Plecak pozostaje slotem Equipment** i to on określa dostępną pojemność
> Inventory (`containerSlots` → `Inventory.setCapacity`). ⛔ Plecak nie jest
> elementem siatki i nie zajmuje w niej pola.

⛔ **Żaden przedmiot nie ma dziś zadeklarowanego gabarytu.** Cały roster to
`1×1` i zachowuje się dokładnie jak przed tą zmianą. Przypisanie konkretnych
broni i tarcz jest **osobną decyzją contentową**.

---

## 1. ⭐⭐ Liczba kolumn przeszła z UI do MODELU

To jest właściwa treść tej decyzji; reszta z niej wynika.

**Stan przed:** `computeInventoryLayout` liczyło kolumny z szerokości okna:
`clamp(Math.floor((bagBudget + gap) / (cell + gap)), 4, 8)`.

**Pomiar** (całe pasmo panelu 816–1280 j. × cztery wysokości strony):

| szerokość panelu | kolumny |
|---|---|
| 816 – 1024 | **4** |
| 1088 – 1280 | **5** |
| wąskie pasmo | 6 |

⚠⚠ **Trzy presety urządzeń w `tools/ekwipunek_uklad.mjs` wszystkie trafiały na
5 kolumn**, więc przy pobieżnym czytaniu system wyglądał na stabilny. Nie był:
wystarczyło zwęzić okno przeglądarki.

**Dlaczego to blokowało `1×2`:** sąsiad pionowy pola `i` to `i + cols`. Przy
zmiennej liczbie kolumn **ten sam zapis układałby się inaczej na telefonie i na
zwężonym oknie** — czyli gabaryt nie byłby deterministyczny (§8 zlecenia).

**Rozstrzygnięcie:** `INVENTORY.cols = 4` jako **stała modelu**.
⛔ Nie wolno jej przenieść z powrotem do UI ani uzależnić od ekranu.
**Kierunek się odwrócił: to kafel ustępuje kolumnom, nie odwrotnie.**

### Dlaczego akurat 4

Zmierzone przeciw normie dotyku `HUD_LAYOUT.minTouch` = 68 j. (48 dp Material):

| kolumn | najmniejszy kafel w paśmie panelu | norma 48 dp |
|---|---|---|
| **4** | **70 j.** | ✅ |
| 5 | 54 j. (poniżej 1088 j. szerokości) | ⛔ łamie |
| 6 | 44 j. | ⛔ łamie |

⭐ **Skutek uboczny, który działa na korzyść:** kafel rośnie (telefon ~70 → 70,
laptop 82), a przy `cell >= 100` ikona rysowałaby się w skali ×3 zamiast ×2.
⚠ **Koszt:** telefon pokazuje **4 kolumny zamiast 5** — mniej kafli w wierszu.
Cofa to fragment decyzji `2026-09-11-ekwipunek-fundament.md` o kolumnach
wyprowadzanych z szerokości; **reszta tamtej decyzji zostaje w mocy.**

---

## 2. Reprezentacja: KOTWICA plus wyprowadzenie

⭐⭐ **Magazyn zostaje PŁASKI.** `Inventory.slots` to dalej jedna tablica,
a przedmiot leży w niej **wyłącznie pod swoją kotwicą** (lewe górne pole).

```
slots[5] = { itemId: "…", qty: 1 }     ← kotwica, JEDYNE źródło prawdy
slots[9] = null                        ← druga połowa: PUSTA w tablicy
anchorCovering(9) === 5                ← zajętość WYPROWADZANA, nigdy zapisana
```

⛔ **Nie wkładamy do `slots` znaczników, kopii ani wskaźników na kotwicę.**
To jest jedyna reprezentacja, w której „duch drugiej połowy" jest
**niewyrażalny**: nie ma czego zostawić po usunięciu kotwicy.

⭐ **Konsekwencja dla zapisu: format nie zmienił się ani o pole.**
`SAVE_VERSION` nietknięte, stary zapis wczytuje się bez migracji (wszystko
`1×1`), a nowy niesie jeden wpis na przedmiot, nie dwa.

⚠ Mapa `pole → kotwica` jest buforowana i unieważniana w `emitChanged()` —
ten sam wzorzec i ten sam powód, co `Equipment.setBonusCache`: przez tę metodę
przechodzi **każda** zmiana plecaka, łącznie z tą, którą `Save.load()` pisze
wprost w `slots`, omijając wszystkie mutatory.

---

## 3. Atomowość: akcja albo się wykonuje w całości, albo wcale

| operacja | reguła |
|---|---|
| **placement** | `cellsFor` odrzuca gabaryt wychodzący poza prawą krawędź **albo** poza pojemność; `canPlaceAt` wymaga, żeby **wszystkie** pola były wolne |
| **move** | upuszczone pole staje się **nową kotwicą**; nie mieści się → **`false` i zero zmian** |
| **chwyt za drugą połowę** | `moveSlot` i `takeAt` sprowadzają pole do kotwicy — gracz widzi tam przedmiot, więc ma nim móc ruszać |
| **swap** | tylko gdy pod celem leży **dokładnie jeden** inny przedmiot **i** mieści się on tam, skąd wyszedł pierwszy. ⛔ Dwa przedmioty pod celem → odmowa |
| **remove** | zwalnia całe przykrycie, bo przykrycie jest wyprowadzane z kotwicy |
| **pojemność** | `canSetCapacity` pyta o **przykrycie**, nie o `slots[i] !== null` — inaczej zdjęcie torby ucięłoby przedmiot w pół |

⛔ **Żadnego przycinania i żadnego „przesunę o jedno pole, to się zmieści".**

---

## 4. Co ODRZUCONO

| odrzucone | dlaczego |
|---|---|
| **zostawić kolumny w UI i liczyć sąsiada z bieżącego layoutu** | łamie determinizm; ten sam zapis inaczej na telefonie i na monitorze — **zmierzone**, nie teoretyczne |
| **`cols = 5`** (zachowałoby dzisiejszy wygląd) | schodzi do 54 j. kafla poniżej 1088 j. szerokości, czyli **łamie normę dotyku 48 dp** |
| **tablica column-major** (sąsiad pionowy = `i+1`) | przenosi zależność na liczbę WIERSZY, a ta zmienia się jeszcze bardziej (5/6/7/8) |
| **„bulk" — N dowolnych pól, bez geometrii** | tańsze i wystarczające dla samego kosztu, ⛔ ale nie przygotowuje kierunku z §5 zlecenia (Diablo) i nie daje kafla `1×2` |
| **druga połowa jako wpis w `slots`** | tworzy dokładnie ten stan („duch", kopia, podwójny zapis), którego cały model ma nie dopuścić |
| **przypisanie gabarytu broniom i tarczom** | osobna decyzja contentowa — mechanizm najpierw |
| **`2×1`, `2×2`, obracanie** | poza zakresem; kształt `{ w, h }` jest ogólny, więc wejdą bez wyrzucania architektury |

---

## 5. Gabaryt ⊥ Equipment ⊥ ręce

```
inventoryFootprint  →  ile miejsca zajmuje w plecaku
Equipment slot      →  gdzie się to zakłada
hands / grip        →  jak się tym walczy
weight              →  ile to waży na postaci
```

⛔ **Cztery niezależne osie.** `hands: 2` **nie implikuje** `1×2` i nigdy nie
będzie implikować — gabaryt deklaruje przedmiot, a nie wyprowadza go kod.
⭐ Pilnuje tego `tools/gabaryt_przymiar.mjs` §J: żadna broń dwuręczna ani żadna
tarcza nie ma dziś zadeklarowanego gabarytu, i asercja to sprawdza.

---

## 6. Zakres wdrożenia — co ZOSTAŁO NIETKNIĘTE

⛔ **Zero zmian contentu:** żaden przedmiot nie ma zadeklarowanego gabarytu;
statystyki, ceny, masy, `hands`, `grip` i wymagania nietknięte.
⛔ **Zero zmian w `Equipment`** — plecak pozostaje slotem Equipment i określa
POJEMNOŚĆ; nie jest przedmiotem wewnątrz siatki.
⛔ **`SAVE_VERSION` nietknięte**, stare zapisy w pełni kompatybilne.
⛔ **Nie ma:** obracania · `2×1` · `2×2` · większych gabarytów · systemu Tetris ·
automatycznego przesuwania przedmiotu · przycinania gabarytu.

⚠⚠ **Wizualna ścieżka `1×2` NIE ZOSTAŁA zweryfikowana na realnym przedmiocie** —
bo żaden go nie ma (to jest `OI-123`). Zweryfikowany jest MODEL
(`tools/gabaryt_przymiar.mjs`, 45 asercji, sabotaż zapala 4) oraz geometria
panelu (`ekwipunek_uklad`: `plecak 4×5 / 4×6 / 4×8`). Render drugiej połowy
i wyśrodkowanie ikony są **przygotowane, ale nieobejrzane okiem**.

⚠ **Telefon pokazuje odtąd 4 kolumny zamiast 5** (20 widocznych kafli zamiast
25, kafel bez zmian 70 j.). To jest zapisana cena determinizmu, nie usterka.

---

## Czego ta decyzja NIE rozstrzyga

- **Które przedmioty dostaną `1×2`** — osobna decyzja contentowa (`OI-123`).
- **Czy licznik miejsca w `Equipment` ma znać gabaryt** — `handsRefusalFor`,
  `tryReturnBag` i `bagUnequipRefusal` liczą wracające przedmioty w SZTUKACH.
  Dopóki wszystko jest `1×1`, jest to tożsame; przy pierwszym `1×2` w rękach
  przestaje być (`OI-124`).
- **Kiedy i czy wejdzie `2×1` / `2×2` / obracanie** — kierunek otwarty, zakres nie.
- **Czy większy plecak ma dawać więcej przestrzeni fizycznej** — dziś daje
  więcej PÓL i to wystarcza; model gabarytowy plecaków to przyszłość.

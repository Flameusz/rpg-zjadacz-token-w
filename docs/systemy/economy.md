---
typ: STAN
domena: economy
tytul: Ekonomia — złoto, ceny, ujścia
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check, przymiar:katalog_ekwipunku]
kotwice:
  - src/core/Inventory.ts
  - src/core/Quality.ts
  - GameConfig.QUALITY.priceMul
  - GameConfig.EQUIPMENT.durability
  - GameConfig.LOOT
otwarte: [OI-45, OI-46]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-13
---

# Ekonomia — złoto, ceny, ujścia

> **Czym jest ten dokument.** Odpowiedzią na pytanie **skąd bierze się złoto
> i gdzie znika**: jakie są źródła, jak powstaje cena i co ją pochłania.
>
> **Czym NIE jest.** ⛔ **Nie podaje ceny żadnego przedmiotu** — to są dane.
> Nie opisuje przedmiotu jako przedmiotu ani zadań; granice w §0.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| skąd złoto, jak powstaje cena, co ją pochłania | **`economy`** |
| czym jest przedmiot; pola ceny, jakość, trwałość | `items` |
| co gracz dostaje za zadanie | `quests` |
| ile kosztuje nauka umiejętności | `abilities` |
| cennik rang | `proficiency` |
| co wypada ze stworzenia | `creatures` |
| XP i punkty rozwoju | `progression` |

⚠⚠ **Złoto i punkty rozwoju to ROZŁĄCZNE waluty.** Nie ma kursu wymiany
w żadną stronę. Jedyny punkt styku: **dwa ujścia pobierają OBIE naraz**
(nauka umiejętności i rangi) — i wtedy obowiązuje reguła „sprawdź oba, zanim
pobierzesz którykolwiek".

### 0.1 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `economy` **bierze** | `items` | pola ceny kupna i sprzedaży oraz **jakość egzemplarza** |
| `economy` **bierze** | `quests` | nagrody w złocie — pula **jednorazowa** |
| `economy` **bierze** | `creatures` | łup, czyli **towar do sprzedania** |
| `economy` **daje** | `abilities`, `proficiency` | możliwość zapłaty |
| `economy` **daje** | `items` | naprawę jako usługę |

---

## 1. Źródła złota

⚠⚠ **ZABÓJSTWO NIE DAJE ZŁOTA.** Ani jedno stworzenie w grze nie upuszcza
monet. To jest decyzja o kształcie całej ekonomii, nie przeoczenie: pieniądz
przychodzi z **handlu**, nie z ubijania.

| źródło | charakter |
|---|---|
| **nagrody zadań** | ⚠ **jednorazowe** — pula skończona i niepowtarzalna |
| **sprzedaż** | ⚠ **jedyne powtarzalne źródło dochodu w grze** |

⚠ **Cały dochód długiej gry przechodzi przez jedną czynność: sprzedaż łupu
i zbiorów.** Wszystko, co zmienia wartość łupu albo szansę na niego, zmienia
tempo całej ekonomii — a nie „ile daje ten potwór".

⚠ **Część łupu jest bramkowana umiejętnością bierną** *(zdzieranie skór)*, więc
gracz, który jej nie ma, ma **istotnie niższy dochód**. To jest zamierzone
i jest to jedyna dziś inwestycja ekonomiczna.

⛔ **Zwrot kosztów nie jest dochodem.** Wycofanie zakupu, który się nie powiódł,
oddaje dokładnie to, co pobrano.

⚠ **Odkup w sklepie nie jest kranem** (2026-10-13): rzecz sprzedaną kupcowi
odkupuje się DROŻEJ, niż ją sprzedano (`SHOP.buybackMarkup`, co najmniej
+1 g), a „Cofnij" ostatniej transakcji oddaje dokładnie to, co pobrano —
ten sam egzemplarz, z tym samym zużyciem (inaczej sprzedaż + cofnięcie były
darmową naprawą).

---

## 2. Cena

```
cena = cena bazowa przedmiotu × mnożnik JAKOŚCI egzemplarza
```

⚠ **Mnożnik jakości działa na kupno I na sprzedaż**, tą samą tabelą. Egzemplarz
lepiej wykonany jest droższy w obie strony.

⚠⚠ **Brak ceny kupna znaczy „nie do kupienia" i jest DECYZJĄ.** Dotyczy
wszystkich surowców, ziół i części sprzętu — to **jedyny rodzaj nagrody, którego
złoto nie obejdzie**.

⚠ **Cena kupna i sprzedaży to dwa niezależne pola przedmiotu**, nie jedna
liczba z marżą. ⚠ **Nigdy nie schodzi poniżej jednego złota** — pozycja warta
zero czytałaby się jako zepsuty sklep.

⚠ **Jakość półki jest własnością SPRZEDAWCY, nie przedmiotu**, i osobno dla
broni i dla pancerza. To jest **charakterystyka postaci wyrażona towarem**:
rzemieślnik sprzedaje własną robotę lepiej wykonaną niż to, co ma z drugiej ręki.
⚠ **Skutek, o którym trzeba wiedzieć:** jakość rusza także **wymagania Siły**,
więc egzemplarz z półki bywa cięższy do założenia niż nominalny *(domena
`items`)*.

---

## 3. Ujścia

| ujście | charakter |
|---|---|
| **towar u sprzedawców** | jednorazowe per pozycja, skończone |
| **nauka umiejętności** | jednorazowe; ⚠ pobiera złoto **i** punkty |
| **rangi Mastery** | ⚠⚠ **największe ujście w grze**; rośnie z decyzjami gracza |
| **naprawa** | ⚠ **jedyne POWTARZALNE ujście** — ułamek ceny proporcjonalny do brakującej trwałości |

⚠⚠ **Naprawa jest jedynym ujściem, które wraca.** Wszystkie pozostałe kończą
się, gdy gracz kupi wszystko — a wtedy złoto przestaje mieć zastosowanie.

⚠ **Rangi są ujściem rosnącym, nie listą** — koszt kolejnej rangi rośnie,
a pomnożony przez rodziny broni daje kwotę o rząd wielkości większą niż cały
asortyment sklepów. ⚠⚠ **Ale trzy z czterech rang są przy dzisiejszej
zawartości nieosiągalne** *(`OI-28`, domena `proficiency`)* — więc **największe
ujście gry jest dziś w praktyce zamknięte** (OI-46).

⚠ **Dwa ujścia pobierają dwie waluty naraz** i obowiązuje je reguła atomowa:
sprawdź złoto i punkty, zanim pobierzesz którekolwiek, a przy niepowodzeniu
zwróć to, co już zeszło.

---

## 4. Niezmienniki

- **N-102** — **zabójstwo nie daje złota**; pieniądz przychodzi z handlu (§1).
- **N-103** — **sprzedaż jest jedynym powtarzalnym źródłem dochodu** (§1).
- **N-104** — **naprawa jest jedynym powtarzalnym ujściem** (§3).
- **N-105** — **jakość mnoży cenę w obie strony**, tą samą tabelą (§2).
- **N-106** — **brak ceny kupna = nie do kupienia**, i jest to decyzja (§2).
- **N-107** — **cena nigdy nie schodzi poniżej jednego złota** (§2).
- **N-108** — **jakość półki należy do sprzedawcy**, osobno per kategoria (§2).
- **N-109** — **przy dwóch walutach sprawdź obie przed pobraniem
  którejkolwiek**, ze zwrotem przy niepowodzeniu (§3).
- **N-110** — ⛔ **złoto i punkty rozwoju nie wymieniają się** w żadną stronę.

---

## 5. Checklista

**Nowa pozycja w sklepie:** ⚠ rozstrzygnij, czy w ogóle ma cenę kupna (N-106) ·
sprawdź, u którego sprzedawcy i z jaką jakością półki (N-108) · policz ją wobec
**całego dzisiejszego asortymentu**, nie wobec sąsiedniej pozycji.

**Nowe źródło złota:** ⚠ rozstrzygnij jawnie, czy jest **powtarzalne** — to
jedyna cecha, która zmienia ekonomię całej gry (N-102, N-103).

**Nowe ujście:** ⚠ powtarzalne czy jednorazowe (N-104); jeśli pobiera dwie
waluty — N-109.

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/katalog_ekwipunku.mjs` (⚠ bez `--zapisz`, `OI-7`).

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| brak złota z zabójstw | ✅ *(świadomie)* | ✅ | `kod:2026-09-06` |
| sprzedaż jako jedyny powtarzalny dochód | ✅ | ✅ | `kod:2026-09-06` |
| łup bramkowany umiejętnością bierną | ✅ | ✅ | `kod:2026-09-06` |
| cena = baza × jakość, w obie strony | ✅ | ✅ | `przymiar:katalog_ekwipunku` |
| brak ceny kupna = nie do kupienia | ✅ | ✅ | `kod:2026-09-06` |
| podłoga jednego złota | ✅ | ✅ | `kod:2026-09-06` |
| jakość półki per sprzedawca i kategoria | ✅ | ✅ | `kod:2026-09-06` |
| naprawa jako ułamek ceny | ✅ | ✅ | `kod:2026-09-06` |
| atomowość przy dwóch walutach | ✅ | ✅ | `kod:2026-09-06` |
| **bilans źródeł i ujść** | ✅ | ⚠ | ❌ **policzone, nierozstrzygnięte** — OI-46 |
| zestawienie cen i bilansu | ❌ | ⚠ | ❌ **brak generatora** — OI-45 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-46** | ⚠⚠ **Największe ujście złota jest dziś w praktyce zamknięte, a pozostałe są skończone.** Rangi Mastery to ujście o rząd wielkości większe niż cały asortyment sklepów — ale `OI-28` wykazało, że **trzy z czterech rang są przy dzisiejszej zawartości nieosiągalne**. Zostają: asortyment (skończony), nauka (skończona), naprawa (jedyne powtarzalne). ⚠ **Zaparkowana pozycja „ujście dla złota" ma więc dziś DRUGĄ przyczynę**, której parking nie znał: nie tylko brakuje ujść, ale to, które wybrano jako główne, jest zablokowane brakiem zawartości. Liczby i metoda: `docs/proces/ekstrakcja_progression.md` §5. ⛔ **Czytać razem z `OI-28` i `OI-44`** — trzy pozycje opisują jeden układ. |
| **OI-45** | ⚠ **Brak infrastruktury danych** — żaden skrypt nie produkuje ani zestawienia cen z podziałem na sprzedawców i jakość półki, ani **bilansu źródeł i ujść**. ⚠ Zapisane w dokumentach liczby ekonomiczne pochodzą z pomiarów ręcznych i **rozjechały się z rosterem** (patrz `ekstrakcja_progression.md` §3, rozjazdy `E-1` i `E-2`). ⛔ Generatora nie zbudowano. |

---

## Czego ten dokument nie rozstrzyga

- **Ceny żadnego przedmiotu** ani żadnej liczby cennika.
- **Czy ekonomia jest wyważona** — `OI-46`.
- **Czym ma być ujście dla złota** — pozycja zaparkowana, decyzja autora.
- **Co gracz dostaje za zadanie** — `quests`.
- **Czym jest przedmiot i jak działa jakość** — `items`.
- **Ile kosztuje nauka i rangi** — `abilities`, `proficiency`.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| dlaczego jakość rusza cenę w obie strony | `docs/jakosc_wykonania.md` | ACTIVE |
| dlaczego brak ceny kupna jest decyzją | `docs/systemy/items.md` §1.2 | ACTIVE |
| stan zaparkowanego „ujścia dla złota" i pomiary portfela | `docs/odlozone.md` | ACTIVE |
| pełny rozbiór osi progresji i ekonomii | `docs/systemy/combat.md`§6 | ACTIVE |
| pomiary, rozjazdy i metoda tej ekstrakcji | `docs/proces/ekstrakcja_progression.md` | — |

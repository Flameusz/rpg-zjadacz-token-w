---
typ: OPERACYJNE
domena: proces
tytul: Canon Extraction — domena architecture (ostatnia)
stan: zamkniety
kotwice: [tools/doc_check.mjs, src/core/EventBus.ts, src/core/Save.ts]
otwarte: [OI-81, OI-82, OI-83]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Canon Extraction — `architecture`

> **Ostatnia ekstrakcja domenowa.** Materiał dowodowy; treść poszła do
> `docs/systemy/architecture.md`. ⛔ **Nie jest źródłem stanu gry.**

---

## 1. Krok 0 — architektura opisana przez WŁASNOŚĆ, nie przez katalogi

⚙ **Model zbudowany od zera z kodu**, nie z poprzedniego opisu. Rozstrzygające
były cztery pytania, zadane w tej kolejności: **kto jest właścicielem stanu →
którędy przechodzi granica → jakim kanałem → co przeżywa**.

⚠⚠ **Katalog okazał się złym kryterium po raz trzeci w serii** — i tym razem
w obie strony: kod prezentacji leży w katalogu interfejsu, a reguły wydajności
**nie mają ani katalogu, ani domeny**, bo są właściwością reguł cudzych.

---

## 2. Pomiary

| pomiar | wynik |
|---|---|
| moduły-właściciele stanu *(singletony)* | **18** |
| rodzaje zdarzeń na szynie | **40** |
| ⭐ mosty callbackowe *(wyjątek od zdarzeń)* | **2** |
| pliki rdzenia **bez silnika** | **46 z 66** ⚙ ≈ 7 na 10 |
| pliki czytające konfigurację | **72** ⚠ największy węzeł |
| ⚠ rzutowania identyfikatorów **między domenami** | **43** |
| właściciele, których dotyka zapis | **14** |
| ⛔ zapisy **wprost w cudzy stan** | **10** — wszystkie w jednym module |
| scena gry: linie · zależności | **4 729** · **59** |
| `STAN`-y systemów po tej misji | **25** |

**Co z tego wynika:**

1. ⭐ **Rdzeń jest w większości czysty i to jest fundament całego przymiaru.**
   Siedem plików na dziesięć da się uruchomić poza grą — dlatego **osiem
   niezależnych narzędzi** potrafi sprawdzać reguły bez Phasera.
2. ⚠⚠ **Zapis jest jedynym miejscem, które zna wszystkich.** Czternastu
   właścicieli i dziesięć zapisów omijających bramki — ⛔ **żaden inny moduł nie
   pisze w cudzy stan ani razu**.
3. ⚠ **Konfiguracja jest większym węzłem niż jakikolwiek moduł kodu.**
   Siedemdziesiąt dwa pliki ją czytają — zamierzone *(„balans w konfiguracji")*,
   ale znaczy, że **jej zmiana dotyka wszystkiego**.

---

## 3. Granice — weryfikacja kodem

| granica | wynik |
|---|---|
| `combat` ↔ `presentation` | ⭐ **najostrzejsza w projekcie**: rozstrzygnięcie jest **danymi**, prezentacja ⛔ nie zmienia pozycji, czasu ani stanu — z **egzekutorem** |
| `combat` ↔ `effects` | ⚙ czysta: efekty mają **własny cykl życia** i własny przymiar |
| `combat` ↔ `weapons` · `abilities` ↔ `combat` | ⚙ czyste: broń i zdolność **wnoszą dane**, rozstrzyga jedna ścieżka |
| `creatures` ↔ `movement` | ⚙ czysta: zachowanie zgłasza **intencję**, nigdy wektor |
| `creatures` ↔ `effects` | ⚙ czysta od 2026-09-04 *(przeciwnik jest gospodarzem efektów)* |
| `world` ↔ `creatures` · `gathering` · `quests` | ⭐ **jednokierunkowa i nieoczywista**: mapa daje **uprawnienie**, domena bytu decyduje, czy coś powstanie |
| `world` ↔ `assets` | ⚙ czysta: **materiał nie zna map**; wiązanie nazwy z kluczem stoi po stronie świata |
| `assets` ↔ runtime | ⚠ **asymetryczna**: materiał potrafi **zatrzymać budowę mapy** — jedyny taki przypadek |
| `input` ↔ `ui` | ⭐ **zero wyszukań sceny gry**; granica dotrzymana w stu procentach |
| `input` ↔ rozgrywka | ⚙ trzy kształty intencji; arbitraż należy do **silnika** |
| `ui` ↔ `presentation` | ⚠ **rozstrzygnięta czasem życia**, nie widocznością — i **przecina katalog** |
| `presentation` ↔ `audio` | ⚙ czysta: prezentacja **wybiera**, dźwięk **odtwarza** |
| `progression` ↔ `attributes` · `proficiency` | ⚙ czyste: jedna pula, trzy ujścia |
| `inventory` ↔ `items` | ⚙ czysta: pojemnik zna **cztery** właściwości przedmiotu, nie więcej |
| `save` ↔ wszyscy | ⛔ **jedyna granica przekraczana wprost** — §4 |

---

## 4. Niezgodności

| # | rzecz | klasyfikacja |
|---|---|---|
| **R-1** | **zapis pisze wprost w cudzy stan** *(10 miejsc)*, omijając każdą bramkę; sprząta **jedną** łatą, pokrywającą **jedną** z omijanych reguł | ⚙ **CURRENT — świadome**, ⚠ zakres sprzątania → `OI-83` |
| **R-2** | **43 rzutowania identyfikatorów na styku domen**, każde wyłącza kompilator; tą drogą przeszło realne znalezisko | ⚙ **CURRENT — konieczne** *(dane zamrożone jako literały)* → `OI-82` |
| **R-3** | **cykl importów w rdzeniu**, bezpieczny **warunkowo** *(żadna strona nie dotyka drugiej przy ładowaniu)*; ⛔ nic tego warunku nie pilnuje | ⚙ **CURRENT — udokumentowane** |
| **R-4** | **scena gry: 4 729 linii, 59 zależności** — orkiestrator trzymający kolejność zdarzeń w klatce | ⚙ **CURRENT**, ⛔ nie postuluję podziału |
| **R-5** | **katalog nie odpowiada domenie** w dwóch miejscach | ⚙ **CURRENT**, opisane w `ui` i `performance` |
| **R-6** | **stary dokument architektury** opisuje nieistniejący stan i **był już cytowany jako reguła** mimo banera | ⛔ **HISTORICAL** → `OI-81` |

⚠ **Żadnej z nich nie naprawiam** — misja zabrania, a wszystkie sześć jest
**rzeczywistych, nie przypadkowych**.

---

## 5. Architektura a dokumentacja

| pytanie | odpowiedź |
|---|---|
| `STAN`-y **bez właściciela w kodzie** | ⛔ **brak** — każdy z 25 ma moduł albo warstwę, którą opisuje |
| **właściciele kodowi bez `STAN`-u** | ⛔ **brak** po tej misji |
| granice **wyłącznie dokumentacyjne** | ⚠ **jedna**: podział `ui` ↔ `presentation` **przecina katalog**, więc w drzewie plików nie widać go wcale |
| ważne reguły **wyłącznie w kodzie** | ⚙ **już nie** — seria wyciągnęła je do `STAN`-ów; ⚠ zostają reguły **produkcji** materiału, żyjące w opisie *(oznaczone)* |
| **stare dokumenty** opisujące nieistniejący stan | ⚠ **jeden krytyczny** *(architektura)* + wcześniej odnotowana lista barierek `OI-60` |

⭐ **Domknięcie: po tej misji nie ma ani jednego systemu bez dokumentu, ani
jednego dokumentu bez systemu.**

---

## 6. Los niezmienników

| niezmiennik | los |
|---|---|
| jeden fakt — jeden właściciel | 🆕 **N-259** |
| stan chwilowy nie trafia do zapisu | 🆕 **N-260** — ⚙ depozyt z `save`/`abilities`, potwierdzony globalnie |
| kanał po TRWANIU faktu | 🆕 **N-261** — ⭐ uogólnienie reguły z `input` na cały projekt |
| most jednopytaniowy, bezstanowy, zerowany | 🆕 **N-262** |
| interfejs nie sięga do sceny gry | 🆕 **N-263** — ⚙ potwierdzenie `ui` N-213 na poziomie systemu |
| rozstrzygnięcie jest danymi; prezentacja nie rusza stanu | 🆕 **N-264** — z egzekutorem |
| arbitraż wejścia należy do silnika | 🆕 **N-265** |
| czysty rdzeń jako warunek przymiarów | 🆕 **N-266** — ⭐ nigdzie wcześniej nienazwane jako **reguła architektury** |
| zawartość w danych; system jej nie wylicza | 🆕 **N-267** |
| cykl importów tylko bez dotknięcia przy ładowaniu | 🆕 **N-268** |
| kto omija bramki, sprząta po sobie | 🆕 **N-269** (R-1) |
| katalog nie determinuje domeny | 🆕 **N-270** (R-5) |
| wszystkie reguły mechanik | ➡ **ZOSTAJĄ** w `STAN`-ach swoich domen — ⛔ ani jednej nie powtórzyłem |

---

## 7. Czego procedura tu NIE złapała

1. ⭐⭐ **ARCHITEKTURY NIE DA SIĘ WYCIĄGNĄĆ Z KODU BEZ WCZEŚNIEJSZYCH
   `STAN`-ów — ANI Z `STAN`-ów BEZ KODU.** Importy pokazują **połączenia**, nie
   **własność**; dokumenty pokazują **zamiar**, nie **rzeczywistość**. Dopiero
   zestawienie obu dało zdanie, którego żadne źródło nie niosło samo:
   ⭐ **„zapis jest jedynym modułem piszącym w cudzy stan"** wymagało policzenia
   zapisów **i** wiedzy, że każdy inny właściciel ma bramkę.

2. ⚠⚠ **REGUŁA MOŻE BYĆ FUNDAMENTEM I NIGDY NIE ZOSTAĆ NAZWANA** (N-266).
   „Rdzeń jest czysty" pojawiało się w komentarzach jako uzasadnienie
   pojedynczych modułów — a jest **warunkiem istnienia całego aparatu
   przymiarów** tego projektu. ⛔ Żadna pojedyncza ekstrakcja nie mogła tego
   zobaczyć: widać to **dopiero z góry**.

3. ⚠ **GRANICA, KTÓREJ NIE WIDAĆ W DRZEWIE PLIKÓW, JEST NAJDROŻSZA**
   (R-5). Podział `ui` ↔ `presentation` biegnie **w poprzek katalogu**, więc
   jedyne, co go utrzymuje, to **dwa zdania w dwóch dokumentach**. ⛔ Kompilator
   nie ma o nim pojęcia.

4. ⚠ **Czego nie zweryfikowałem** *(kontekst na wyczerpaniu)*: pełnego grafu
   importów **wszystkich** 66 plików rdzenia — sprawdziłem właścicieli stanu,
   kanały i deklarowane cykle, ⛔ nie budowałem grafu maszynowo. ⚙ Nie zmienia
   to modelu, ale **drugi cykl istniejący po cichu byłby niewidoczny** dla tej
   procedury.

⚙ **Co zadziałało:** pytanie **„kto jest właścicielem"** postawione przed
pytaniem „co z czego korzysta" — bo lista importów odpowiada na drugie
i **milczy o pierwszym**.

---

## 8. Koniec serii

⭐ **To była ostatnia ekstrakcja domenowa.** ⚙ Po niej **25 `STAN`-ów systemów**,
`performance` jako przekrój bez `STAN`-u *(`OI-74`)* i `proces` jako warstwa
operacyjna. ⛔ **Nie ma już domeny systemowej bez dokumentu.**

⚠ **Otwarte pozostają 44 pozycje `OI`**, z czego większość wymaga **jednego
zdania autora**, nie pracy. ⭐ To jest właściwy stan zakończenia: dokumentacja
opisuje **to, co jest**, a nie to, co powinno być — a każde miejsce, gdzie te
dwie rzeczy się różnią, ma **numer i właściciela**.

---
typ: STAN
domena: assets
tytul: Assety — klucz, ładowanie, degradacja
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-06, przymiar:doc_check]
kotwice:
  - src/core/Assets.ts
  - src/world/TreeStampManifest.ts
  - src/world/TreeLayer.ts
  - GameConfig.ASSETS
  - GameConfig.MAPS
otwarte: [OI-78, OI-80]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-06
---

# Assety — klucz, ładowanie, degradacja

> **Czym jest ten dokument.** Odpowiedzią na pytanie **jak materiał graficzny
> wchodzi do gry**: czym jest klucz, co się dzieje, gdy pliku nie ma, i gdzie
> przebiega umowa między obrazkiem a mapą.
>
> **Czym NIE jest.** ⛔ **Nie opisuje ani jednej grafiki, arkusza czy drzewa** —
> to jest zawartość. Nie jest też źródłem zasad **wyglądu**.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| **czym** narysować: klucz, ładowanie, cięcie arkusza, degradacja | **`assets`** |
| **co i gdzie** stoi na mapie | `world` |
| jak ma wyglądać: paleta, styl, proporcje | `proces` *(kierunek artystyczny)* |
| kiedy i jak coś jest **rysowane** *(błysk, wstrząs, napis)* | `presentation` |
| co gracz widzi jako panel | `ui` |

### 0.1 `world` ↔ `assets` — granica potwierdzona

⭐ **Reguła wyjściowa potwierdzona kodem: MAPA mówi CO i GDZIE, ASSET mówi
CZYM TO NARYSOWAĆ.** ⚙ Dowód jest asymetrią: **jeden arkusz obsługuje wiele
map**, a **mapa działa z obrazkiem zastępczym** — ⛔ w drugą stronę żadne z tych
zdań nie jest prawdziwe.

⚠⚠ **Klucze są DWA i mają dwóch właścicieli:**

| klucz | kto go nadaje | kto tłumaczy |
|---|---|---|
| **nazwa obiektu / tilesetu w mapie** | autor mapy | ⚙ **`world`** |
| **klucz tekstury** | ⚙ **`assets`** | silnik |

⭐ **Tabela wiążąca jedno z drugim mieszka po stronie `world`** — i to jest cała
odpowiedź na pytanie o własność: `assets` **nie wie nic o mapach**, `world`
**nie wie nic o plikach**. ⛔ *(`OI-76` — nieweryfikowana nazwa obiektu — jest
więc otwarciem `world`, nie tej domeny; tutaj otwarty jest bliźniaczy brak dla
nazwy tilesetu, `OI-78`.)*

⚠ **Nazwa tilesetu bywa przyjmowana w DWÓCH pisowniach**, bo edytor nazywa
tileset po pliku, dopóki nikt go ręcznie nie przemianuje. ⚙ To jest łata na
zachowanie narzędzia, nie decyzja projektowa.

### 0.2 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `assets` **daje** | wszystkim | teksturę pod kluczem |
| `assets` **daje** | `world` | ⚠ **jedyny arkusz nienegocjowalny** — bez niego mapa się nie buduje |
| `assets` **bierze** | `proces` | narzędzia wytwarzające pliki |
| `assets` **nie zna** | `world` | ⛔ **żadnego odwołania do map** |

---

## 1. Klucz, nie ścieżka

⚠⚠ **Wszystko w grze odwołuje się do materiału KLUCZEM, nigdy ścieżką.**
Ścieżka pojawia się dokładnie raz — przy kolejkowaniu do wczytania.

⚠ **Klucze bytów treściowych są WYPROWADZANE z identyfikatora**, nie
wypisywane: przedmiot, zdolność i gatunek mają funkcję, która robi z ich
identyfikatora klucz tekstury. ⭐ Dzięki temu **nowy przedmiot nie wymaga wpisu
w rejestrze grafik** — wymaga pliku o przewidywalnej nazwie.

⚠ **Rejestr materiału jest DANYMI**: blisko dwustu wpisów, z czego połowa niesie
ścieżkę do pliku, a reszta opisuje **wytwarzane w locie** tekstury i geometrię
cięcia. ⛔ Ta liczba jest zawartością, nie regułą.

---

## 2. Ładowanie i cięcie

```
kolejkuj PLIK  →  wczytaj  →  sprawdź, CO NAPRAWDĘ JEST  →  dotnij / podstaw zastępnik
```

⚠⚠ **„Brakujący" rozstrzyga się przez ISTNIENIE TEKSTURY, nie przez zdarzenie
błędu.** Zdarzenia loadera potrafią przyjść **po** zbudowaniu sceny, więc
decyzja oparta na nich byłaby **zależna od czasu**. ⭐ Sprawdzenie stanu jest
niezależne od kolejności.

⚠⚠ **Rozmiar klatki wyprowadza się z RZECZYWISTYCH wymiarów tekstury**, a nie
zapisuje obok. ⛔ Wpisana ręcznie liczba rozjeżdża się przy pierwszej
przebudowie arkusza — **bez błędu**.

⚠ **Arkusz tnie się dopiero PO wczytaniu**, bo dopiero wtedy znane są wymiary.

---

## 3. Degradacja ma TRZY stopnie

⚠⚠ **„Gra zawsze się uruchamia" nie znaczy „każdy brak jest równy".**

| stopień | co się dzieje | kiedy |
|---|---|---|
| **zastępnik** | generowana tekstura, gra wygląda źle, ale działa | byty, których brak zatrzymałby rozgrywkę |
| **ciche pominięcie** | rzecz **po prostu się nie pojawia** | gotowe kompozycje: studnia, ognisko, zwierzę, dekoracja |
| ⛔ **nienegocjowalny** | **mapa odmawia budowy** | ⚠ **arkusz terenu** |

⭐ **Arkusz terenu jest wyjątkiem z policzonego powodu, nie z ostrożności:**
zastępnik ma **inne wymiary**, więc **każdy indeks kafla wskazywałby śmieci** —
mapa zbudowana z takiego arkusza byłaby gorsza niż jej brak.

⚠ **Zastępnik nie jest generowany dla wszystkiego** i to jest decyzja per byt.
⚙ Reguła: **im bardziej rzecz jest gotową kompozycją, tym ciszej znika**.

⚠ **Rejestr brakujących jest stanem RUNTIME** — czyszczonym i wypełnianym przy
każdym starcie, wypisywanym do konsoli **raz**. ⛔ Nie trafia do zapisu.

---

## 4. Materiał wytwarzany

⚠⚠ **Większość materiału tej gry jest GENEROWANA, nie rysowana ręcznie** —
przez kilkadziesiąt narzędzi wytwórczych. ⚙ Z tego wynikają dwie reguły, których
nie miałby projekt z ręcznie malowanymi plikami:

⚠⚠ **Wycinek z regenerowanego arkusza NIE MA WŁAŚCICIELA.** Współrzędne
wycięte z arkusza **przeżywają jego przebudowę** i zaczynają wskazywać coś
innego — ⛔ **bez błędu i bez śladu**. ⭐ Reguła: **kafel wycinany z poziomu kodu
musi mieć NAZWANY wpis w narzędziu, nigdy same współrzędne.**

⚠ **Plik generowany deklaruje to w pierwszej linii** i ⛔ **nie wolno go
edytować ręcznie** — jego kolejność wpisów jest **tym samym**, co lokalne
numery w edytorze. ⚙ Ręczna poprawka rozjeżdża arkusz z mapą.

⚠ **Wspólny strumień losowy narzędzi sprawia, że DOPISANIE jest tanie,
a WSTAWIENIE drogie** *(ta sama reguła, co przy dźwięku)*.

---

## 5. Manifest jako umowa

⚠⚠ **Tam, gdzie mapa stawia obiekt wycięty z arkusza, umową jest MANIFEST** —
plik generowany razem z arkuszem, niosący rozmiar komórki, liczbę kolumn
i podział na części.

⭐ **To jest jedyne miejsce, w którym `assets` i `world` naprawdę się
spotykają**: mapa mówi „ten obiekt", manifest mówi „to jest ta komórka i tak
się ją dzieli", a rysowanie należy do `world`.

⚠ **Podział komórki niesie ZNACZENIE, nie tylko geometrię** — jedna część
sortuje się razem z bytami, druga nad nimi. ⛔ Zmiana tego podziału jest zmianą
**porządku rysowania**, nie rozmiaru obrazka.

---

## 6. Reguły, które żyją TYLKO w opisie

⚠⚠ **Część reguł produkcji nie ma odpowiednika w kodzie i nie da się ich
złamać „przez błąd" — tylko przez nieprzeczytanie.** Należą do nich: układ
katalogów materiału, **nazwy plików po angielsku**, obowiązek załatania narzędzi
po przeniesieniu pliku i zasady wyglądu.

⚠ **Nazwy plików są w trakcie niedokończonej przeprowadzki** — istniejące
polskie nazwy są **osobną, jeszcze niezrobioną zmianą**, nie wyjątkiem od
reguły.

⚠ **Jedno ostrzeżenie silnika jest znane, policzone i zaakceptowane** —
arkusze mają szerokość niepodzielną przez rozmiar kafla, a geometria wychodzi
mimo to poprawnie. ⛔ To jest **ostrzeżenie, nie błąd**.

⚙ **Zasady wyglądu są osobnym dokumentem i ta domena ich nie powtarza.**

---

## 7. Niezmienniki

- **N-249** — **odwołanie idzie KLUCZEM, nigdy ścieżką**; ścieżka pojawia się
  raz (§1).
- **N-250** — **klucz bytu treściowego jest WYPROWADZANY z identyfikatora**
  (§1).
- **N-251** — **„brakujący" rozstrzyga ISTNIENIE tekstury**, nie zdarzenie
  błędu (§2).
- **N-252** — **rozmiar klatki wyprowadza się z rzeczywistych wymiarów** (§2).
- **N-253** — **degradacja ma trzy stopnie**, a stopień jest **decyzją per
  byt** (§3).
- **N-254** — ⛔ **arkusz terenu jest nienegocjowalny**: mapa odmawia budowy
  (§3).
- **N-255** — **wycinek z generowanego arkusza wymaga NAZWANEGO wpisu
  w narzędziu**, nigdy samych współrzędnych (§4).
- **N-256** — **pliku generowanego nie edytuje się ręcznie**; jego kolejność
  jest kontraktem (§4).
- **N-257** — **manifest jest umową między arkuszem a mapą**, a podział komórki
  niesie porządek rysowania (§5).
- **N-258** — **`assets` nie zna map**; wiązanie nazwy mapy z kluczem należy do
  `world` (§0.1).

---

## 8. Checklista

**Nowy plik graficzny:** ⚠ nazwa **po angielsku**, w katalogu tematycznym
(§6) · ⚠ jeśli byt treściowy — **nazwa musi pasować do wyprowadzanego klucza**
(N-250) · ⚠ rozstrzygnij **stopień degradacji** (N-253).

**Nowy arkusz cięty:** ⛔ nie zapisuj rozmiaru klatki obok — **wyprowadź go**
(N-252) · ⚠ jeśli mapa ma z niego stawiać obiekty, potrzebny **manifest**
(N-257).

**Przebudowa istniejącego arkusza:** ⚠⚠ **sprawdź, czy ktoś nie tnie go po
współrzędnych** (N-255) · ⚠ dopisuj **na końcu** (§4) · ⛔ nie edytuj plików
generowanych.

**Przeniesienie pliku:** ⚠ załataj także narzędzia — inaczej wytwarzają do
starego miejsca, a gra czyta z nowego: **cicha rozbieżność** (§6).

**Bramki:** `npx tsc --noEmit` · `npm run build` · `node tools/doc_check.mjs` ·
✅ **przymiar kompletności materiału: `node tools/assety_przymiar.mjs`** (`OI-79`, 2026-10-11) — raportuje, niczego w grze nie zmienia.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| odwołanie kluczem, nie ścieżką | ✅ | ✅ | `kod:2026-09-06` |
| klucz wyprowadzany z identyfikatora | ✅ | ✅ | `kod:2026-09-06` |
| „brakujący" z istnienia tekstury | ✅ | ✅ | `kod:2026-09-06` |
| rozmiar klatki z rzeczywistych wymiarów | ✅ | ✅ | `kod:2026-09-06` |
| trzy stopnie degradacji | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| arkusz terenu nienegocjowalny | ✅ | ✅ | `kod:2026-09-06` |
| manifest jako umowa z mapą | ✅ | ✅ | `kod:2026-09-06` |
| plik generowany nieedytowalny ręcznie | ✅ | ✅ | ⚙ **deklaracja w pliku**, brak przymiaru |
| **wycinek po współrzędnych** | ⚠ **reguła istnieje, nic jej nie pilnuje** | ✅ | ❌ — OI-80 |
| **nazwa tilesetu jako klucz** | ⚙ **dwie pisownie; ostrzeżenie + `dev.mapWarnings()`** | ✅ | ✅ wykrywanie `reka:2026-10-11`; surowość — OI-78 (DESIGN) |
| **kompletność materiału** | ⚙ **konsola przy starcie + przymiar offline** | ✅ | ✅ `przymiar:assety_przymiar` (2026-10-11) |
| reguły produkcji i nazewnictwa | ⚙ **tylko w opisie** | ✅ *(oznaczone jako takie)* | ❌ **niewykonalne maszynowo** |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-78** | ⚠ **Nazwa tilesetu w pliku mapy jest kluczem bez weryfikacji** — tileset o nazwie spoza tabeli jest **pomijany z ostrzeżeniem**, a mapa buduje się dalej, po prostu bez tych kafli. ⚙ Zachowanie jest **świadome i poprawne** *(tylko arkusz terenu jest nienegocjowalny)*, ⚠ ale skutkiem literówki jest **mapa wyglądająca na niedokończoną**, nie komunikat o błędzie. ⚙ **Bliźniak `OI-76`** — tam nazwa obiektu, tu nazwa tilesetu; ⛔ **własność klucza rozstrzygnięta**: tłumaczenie należy do `world`, plik do `assets`. **Decyzja AUTORA**: czy pominięty tileset ma być błędem. ⚙ **2026-10-11: wykrywanie zrobione** — ostrzeżenie trafia do `dev.mapWarnings()`; otwarte zostaje WYŁĄCZNIE pytanie o surowość. |
| **OI-79** | ✅ **ZAMKNIĘTE 2026-10-11** — `node tools/assety_przymiar.mjs`: każda ścieżka z konfigu (+ dźwięki) na dysku, 326 plików. Cicha degradacja w grze nietknięta — przymiar tylko raportuje. |
| **OI-80** | ⚠⚠ **Reguła „nie tnij arkusza po współrzędnych" nie ma egzekutora, a jej złamanie już raz zaszło.** Wycinek przeżył przebudowę arkusza i zaczął wskazywać inny fragment — **bez błędu i bez śladu**. ⚙ Reguła jest zapisana *(nazwany wpis w narzędziu zamiast współrzędnych)*, ⛔ ale **nic nie wykrywa jej naruszenia**: współrzędne w kodzie wyglądają identycznie jak przed przebudową. **Decyzja AUTORA**: czy dopuszczalne jest w ogóle cięcie z poziomu kodu. |

---

## Czego ten dokument nie rozstrzyga

- **Żadnej grafiki, arkusza, drzewa ani pliku z osobna** — to jest content.
- **Jak coś ma wyglądać** — paleta, styl i proporcje mają własny dokument.
- **Co i gdzie stoi na mapie** — `world`.
- **Kiedy i jak coś jest rysowane** *(błysk, wstrząs, napis)* — `presentation`.
- **Czy dzisiejszy materiał jest dobry** — to jest ocena artystyczna.
- ⛔ **Statusu niedokończonej przeprowadzki nazw plików** — to jest osobna,
  zaplanowana zmiana, nie wyjątek do rozstrzygnięcia tutaj.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| ładowanie, zastępniki, cięcie arkuszy | `src/core/Assets.ts` *(przy kodzie)* | ACTIVE |
| stan materiału, pułapki, przeprowadzka nazw | `public/assets/README.md` | ACTIVE — ⚠ **reguły produkcji, nie mechaniki** |
| zasady wyglądu | `docs/ART_DIRECTION.md` | ACTIVE |
| model instancji drzew i podział komórki | `docs/tree_instances.md`, `src/world/TreeLayer.ts` | ACTIVE |
| kiedy wolno zapisać wynik narzędzia | `tools/CLAUDE.md` | ACTIVE |
| co mapa robi z kluczem tilesetu | `docs/systemy/world.md` §0.1 | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_assets.md` | — |

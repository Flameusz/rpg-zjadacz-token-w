---
typ: DECYZJA
domena: [ui, items, inventory]
tytul: Ekran handlu — cztery kolumny, karta jako kolumna, układ liczony z okna
stan: zastapiony
moc: SUPERSEDED
data: 2026-09-19
kotwice:
  - src/ui/ShopLayout.ts
  - src/ui/ShopPanel.ts
  - src/ui/ShopDetails.ts
  - src/ui/ItemCard.ts
  - tools/sklep_uklad.mjs
otwarte: [OI-130, OI-131, OI-132]
zastepuje: []
zastapione-przez: docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md
aktualizacja: 2026-10-13
---

# Ekran handlu — przebudowa UX

> ⚠ **ZASTĄPIONA 2026-10-13** przez `docs/decyzje/2026-10-13-sklep-kupiec-gracz-karta.md`
> (kupiec | gracz | karta, kafle po obu stronach). Układ czterech kolumn i stały
> blok ZAŁOŻONE nie obowiązują; reguły karty i gabarytu przejęła nowa decyzja.

## Co rozstrzygnięto

> **Panel handlu ma CZTERY kolumny w kolejności decyzji gracza:
> `KUPIEC → PLECAK → ZAŁOŻONE → SZCZEGÓŁY`. Rozmiar panelu liczy się z okna,
> a układ z rozmiaru. Karta przedmiotu dostaje własną kolumnę z przyklejonym
> do dołu pasem `CENA → AKCJA`. Instrukcja chowa się pod `ⓘ`, zamknięcie to
> `✕` w prawym górnym rogu.**

⛔ **Zero zmian w mechanice.** Ceny, jakość, trwałość, masa, obciążenie,
gabaryt, zasady kupna, sprzedaży, naprawy i cofnięcia — nietknięte. Ta decyzja
dotyczy wyłącznie tego, **jak te same liczby są pokazane i w jakiej kolejności
gracz na nie patrzy**.

---

## 1. Dlaczego — cztery mierzalne wady starego ekranu

| wada | pomiar |
|---|---|
| **marnowana powierzchnia** | panel 816×500 j. na ekranie 1257×580 j. (S21 FE) — **441 j. niewykorzystanej szerokości**, jedna trzecia ekranu |
| **kafle poniżej normy dotyku** | półka 46 j., plecak 52 j., ZAŁOŻONE **32 j.** przy normie `HUD_LAYOUT.minTouch` = 68 j. (48 dp) |
| **karta zasłaniała półkę** | dymek do 250 j. nad kolumną kupca szerokości 254 j. — **trzy z pięciu kolumn towaru niewidoczne w trakcie oglądania towaru** |
| **ściana tekstu** | opis przedmiotu to 20+ linijek jednym ciągiem, bez nagłówków; cena w środku listy, przycisk akcji w innym miejscu ekranu |

Do tego **19 adresów ekwipunku rysowanych jako jeden ciąg kafli** — broń,
trzy warstwy hełmu, trzy warstwy torsu i dwa pierścienie wyglądały jak ta sama
lista, bez podziału i bez podpisów.

---

## 2. Układ

```
┌──────────────────────────────────────────────────────────────────────┐
│ HANDEL                                     1 250 złota   [ⓘ]  [✕]   │
├───────────────┬───────────────┬────────────┬─────────────────────────┤
│ SOBEK         │ PLECAK        │ ZAŁOŻONE   │ SZCZEGÓŁY               │
│ (filtr →)     │ (filtr →)     │            │ ┌────┐ Nazwa            │
│ [ ][ ][ ][ ]  │ [ ][ ][ ][ ]  │ [szyja][głowa][dłonie]│ │ikona│ typ · warstwa │
│ [ ][ ][ ][ ]  │ [ ][ ][ ][ ]  │ [barki][tors ][ring ] │ └────┘ jakość │
│ [ ][ ][ ][ ]  │ [ ][ ][ ][ ]  │       [nogi ][ring ]  │  [L1][L2][L3] ←przełącznik│
│ [ ][ ][ ][ ]  │ [ ][ ][ ][ ]  │       [stopy]         │ OCHRONA / ATAK          │
│ [ ][ ][ ][ ]  │ [ ][ ][ ][ ]  │  RĘCE                 │ PORÓWNANIE nowy↔noszony │
│ [ ][ ][ ][ ]  │ [ ][ ][ ][ ]  │  [broń][tarcza]       │ STAN · WYMAGANIA        │
│               │               │                       │ ──────────────────────  │
│ ↩ Cofnij      │               │  napraw 55g           │ CENA          175 g     │
│               │               │                       │ [   KUP   ]             │
└───────────────┴───────────────┴────────────┴─────────────────────────┘
```

**Kolejność kolumn jest kolejnością decyzji**: patrzę na półkę → porównuję ze
swoim → widzę, co noszę → czytam szczegóły → płacę.

⚠ **Kupiec i plecak są RÓWNORZĘDNE**: ta sama liczba kolumn (4, zgodna
z `INVENTORY.cols`) i ten sam bok kafla. Nie dlatego, że tak ładniej — dlatego
że handel ma dwie strony i żadna nie jest dodatkiem do drugiej.

⚠ **Plecak i ZAŁOŻONE stoją po tej samej stronie kreski grupującej.** To jedna
rzecz — „co mam" — w dwóch stanach: w torbie i na sobie.

### 2.1 Liczby (S21 FE, 1257×580 j.)

| element | przed | po |
|---|---|---|
| panel | 816×500 | **1225×556** (liczony z okna) |
| kafel półki / plecaka | 46 / 52 | **68 / 68** (= norma dotyku) |
| widoczne rzędy półki | 4 | **5** *(przy większej siatce)* |
| kafel ZAŁOŻONE | 32 | **74** (11 kafli zamiast 19–21) |
| karta przedmiotu | dymek ~250 j. NAD kolumną | **kolumna 322 j., niczego nie zasłania** |

---

## 2.2 ⭐⭐ ZAŁOŻONE: SYLWETKA, nie tabela warstw

⛔⛔ **`L1` / `L2` / `L3` NIE SĄ slotami widocznymi dla gracza.** To warstwy
wewnątrz modelu pancerza. Pierwsza wersja tej przebudowy (ranek 2026-09-19)
narysowała **tabelę `wiersz = część ciała` × `kolumna = L1/L2/L3`** — czyli
przeniosła do interfejsu **wewnętrzną strukturę danych**. Wada była widoczna
na zrzucie:

- **trzy identyczne glify hełmu obok siebie** („GŁOWA [hełm][hełm][hełm]"),
  z których dwa są PUSTE i na zawsze puste w sklepie *(niczego się tu nie
  zakłada)*,
- **21 narysowanych pól na 19 realnych adresów**,
- kafel **49 j.** przy normie dotyku 68,
- pytanie gracza „czym różnią się te trzy hełmy" bez odpowiedzi.

⭐ **Dziś blok jest SYLWETKĄ: jedenaście kafli na dziewiętnaście adresów.**
Cztery obszary ciała w środku (głowa → tors → nogi → stopy), biżuteria
i osłony na railach, **ręce w railach na wysokości stóp** (patrz §2.4 —
kafel ręki jest wysoki na dwa pola i nie mieścił się w osobnym rzędzie).
Kafel ma **70 j.** na telefonie docelowym — powyżej normy dotyku.

**Jak warstwa wraca do gracza, skoro nie jest slotem:**

| gdzie | co mówi |
|---|---|
| **kropki pod kaflem obszaru** | ile warstw jest zajętych (0–3), bez nazw |
| **wiersz tożsamości karty** | `Pancerz · Tors · ochrona zasadnicza` — ⚠ **bez kodu warstwy**, patrz §2.5 |
| **przełącznik na karcie** | chipy `Spód / Środek / Wierzch`; pojawia się TYLKO, gdy obszar nosi >1 sztukę — jedno dotknięcie do każdej |

⚠ **Żaden z 19 adresów nie zniknął** i pilnuje tego asercja `Z1`
(`tools/sklep_uklad.mjs`): każdy adres `EQUIP_SLOTS` musi leżeć pod dokładnie
jednym kaflem sylwetki. `Z4` pilnuje odwrotnej strony: **żadna warstwa nie
wolno, by stała się osobnym kaflem**.

⛔ **Nie projektuj UI z modelu danych.** Gracz pyta „co mam na głowie", a nie
„co mam na trzeciej warstwie głowy".

---

## 2.3 ⭐⭐ GABARYT NIESIE POLE, NIE IKONA

⛔ **Przedmiot `1×2` ma JEDEN prostokąt na dwa pola** — kafel kotwicy o
wysokości `2·cell + gap`, kafel przykryty bez własnej ramki (`fieldRect`).

⚠ **Powód jest mierzalny, nie estetyczny.** Gabaryt niosła wyłącznie ikona:
sześć drewnianych tarcz ma rysunek 32×64 i widać było dwa pola, ale
**osiemnaście żelaznych i stalowych ma ten sam gabaryt przy rysunku 32×32**
— i wyglądało jak `1×1`. To samo dotyczyło dotyku: drugie pole było martwe.

| reguła | gdzie |
|---|---|
| pole = jeden prostokąt na cały gabaryt | `fieldRect`, `paintField`, `paintBagField` |
| pole trafienia = całe przykrycie | `fitHitArea`, `fitBagHitArea` |
| wybór z dowolnej części → ten sam przedmiot | `bagAnchor`, `anchorCovering` |
| zaznaczenie = jedna ramka | wynika z pola, bez osobnego stylu |

⚠ **Pułapka Phasera:** `setInteractive(kształt)` i `InputPlugin.setHitArea`
**nie podmienią kształtu obiektowi, który już ma wejście**. Trzeba przypisać
`input.hitArea` / `input.hitAreaCallback` / `input.customHitArea` wprost i
nałożyć `setDraggable` PONOWNIE.

⛔ **Gabaryt to nie slot Equipment.** `1×2` znaczy dwa pola w plecaku i
**jeden** slot wyposażenia, jeden rekord, jeden zapis.

---

## 2.4 ⭐⭐ GABARYT OBOWIĄZUJE TAKŻE PO ZAŁOŻENIU

⛔ **Kafel ręki jest wysoki na dwa pola** (`SHOP_METRICS.handRows`), bo trzyma
przedmioty o gabarycie `1×2`. ⛔ **To jeden slot**, nie dwa: jedna ramka, jedna
ikona, jeden adres `Equipment`.

⚠ **Powód:** tarcza zajmowała dwa pola w plecaku i kurczyła się do kwadratu po
założeniu — rozmiar rzeczy znikał tam, gdzie zaczynał mieć znaczenie.

⚠ **Koszt:** rząd rąk pod ciałem byłby szóstym wierszem (≈512 j. przy 496
dostępnych na telefonie), więc ręce stoją w railach. Sylwetka jest siatką
`3 × 5`, a jej układ jest DANĄ (`SHOP_DOLL`: `col`/`row`/`rows`).

| pilnuje | co |
|---|---|
| `Z7` | wysokie są dokładnie dwa kafle rąk |
| `Z8` | gabaryt nie tworzy drugiego kafla wyposażenia (11 kafli / 19 adresów) |
| `Z9` | ta sama tarcza ma tę samą skalę w plecaku i w ręce |

---

## 2.5 ⭐⭐ JĘZYK GRACZA I PODGLĄD (dopracowanie)

⛔ **`L1`/`L2`/`L3` nie wychodzą na ekran.** Kod warstwy wygląda jak nazwa
slotu i tak był czytany. Dwa słowniki, dwie publiczności:

| słownik | dla kogo | przykład |
|---|---|---|
| `ARMOR_LAYER_LABEL` | kod, `doc_check`, generowany katalog | `L3 · wzmocnienie` |
| `ARMOR_LAYER_PLAYER` | karta przedmiotu | `wierzchnie wzmocnienie` |
| `ARMOR_LAYER_SHORT` | chipy przełącznika | `Wierzch` |

⭐ **Podgląd ma kształt gabarytu przy WSPÓLNEJ skali rysunku.** Skala „pod
obrazek" pokazywała hełm 32×32 większym niż tarczę 32×64. Pilnuje `D4`/`D5`.

⭐ **Porównanie jest przypięte nad ceną** (poza przewijaniem), z awaryjnym
powrotem do treści, gdy ciału zostaje mniej niż `MIN_BODY_H`.

---

## 3. Karta przedmiotu: jeden model, dwa renderery

⭐⭐ **`src/ui/ItemCard.ts` jest JEDYNYM miejscem, które czyta katalog i liczy,
co powiedzieć o przedmiocie.** `ShopDetails` rysuje z tego kolumnę z sekcjami,
a `ItemTooltip` spłaszcza to z powrotem do linijek dla panelu postaci
(`cardToLines`).

⚠ **Powód jest historyczny i konkretny.** Wzór na procent bloku stał w dwóch
miejscach (`Equipment.blockSpec` i `ItemTooltip`) i **rozjechał się**: rozbita
tarcza pokazywała na karcie pełny procent, choć w walce blokowała o połowę
słabiej. Trzecia kopia — w kolumnie sklepu — była nieunikniona, gdyby każdy
widok czytał katalog sam.

**Kolejność informacji** (wprost z wymagania autora): nazwa → typ i jakość →
najważniejsze statystyki → **porównanie** → stan → wymagania → cena → akcja.
⛔ Porównanie NIE jest na końcu karty: tam wypadało poza widoczne ciało
i wymagało przewinięcia, czyli najważniejsza informacja decyzyjna była
najtrudniej dostępna.

⚠ **Puste sekcje nie powstają.** Surowiec pokazuje nazwę i opis; pancerz bez
trwałości nie ma wiersza „Trwałość"; przedmiot bez odpowiednika na ciele nie ma
sekcji PORÓWNANIE.

---

## 4. Co zostało ŚWIADOMIE usunięte

| rzecz | dlaczego |
|---|---|
| **podpowiedź na dole panelu** (2 wiersze × zawsze) | 30 j. pionu wydane przy każdym otwarciu na zdanie, które gracz wie po pierwszym tapnięciu — dziś pod `ⓘ` |
| **przycisk „← Wróć"** | zamknięcie to `✕` w rogu; ⚠ `PanelBase.addCloseButton` mierzył ten róg jako najgorszy dla kciuka (75–79 mm przy zasięgu ~55 mm) — **decyzja autora, świadomie przeciw tamtemu pomiarowi**, rekompensata to pole trafienia 68 j. plus Escape i systemowe Wstecz |
| **dwa przyciski „Tu nie naprawia"** (170 j. każdy, w nagłówku) | usługa, której ten NPC nie świadczy, nie potrzebuje dwóch pełnowymiarowych kontrolek — dziś podpis `NAPRAWA` + jedno zdanie „Ten kupiec nie naprawia" (⚠ usługa **zostaje widoczna**, patrz §8) |
| **podgląd karty na najechanie** | karta ma stałe miejsce i nic nie zasłania, więc spór „najechanie kontra zaznaczenie" zniknął razem z przyczyną; na telefonie najechania nie ma |
| **`CardActions` w sklepie** | rząd przycisków doklejany pod dymkiem przeskakiwał nad niego, gdy się nie mieścił; dziś akcja jest przyklejona do dołu kolumny i **nie płynie z treścią** |

⛔ **Nie przywracaj żadnej z tych pięciu rzeczy bez nowego powodu z gry.**

---

## 5. Miejsce na przyszły filtr

⭐ **Prawa połowa wiersza podpisu każdej siatki jest ZAREZERWOWANA**
(`ShopColumnLayout.filter`, ≥ 84 j. w najwęższym oknie). Nic jej dziś nie
rysuje i to jest cel: filtr (slot / typ / jakość / nazwa) ma kiedyś wejść
w istniejący wiersz, a nie wymusić trzecią przebudowę panelu.
⛔ Nie zapełniaj tego miejsca niczym innym „bo jest wolne".
Pilnuje tego asercja `F1` w `tools/sklep_uklad.mjs`.

---

## 6. Czego ta decyzja NIE rozstrzyga

- ✅ **`OI-129` ZAMKNIĘTE tego samego dnia** — „kafel ZAŁOŻONE 49 j. przy
  normie 68" rozwiązała sylwetka: jedenaście kafli zamiast dziewiętnastu daje
  **74 j.** Rachunek szerokości kolumn (`0,25` karta / `0,19` sylwetka) jest
  dobrany tak, żeby **obie** normy — siatki i sylwetki — były spełnione na
  telefonie docelowym.
- **`OI-130` — filtr półki i plecaka.** Miejsce jest, mechaniki nie ma.
- **`OI-132` — sprzedaż z zestawu SCHOWANEGO** (`weapon2`/`offhand2`).
  Sylwetka pokazuje wyłącznie `EQUIP_SLOTS`, czyli to, co na sobie; schowana
  para jest poza sklepem tak samo jak przed przebudową. ⚠ To jest stan
  odziedziczony, nie regres — ale teraz widać go wprost.
- **`OI-131` — panel liczy rozmiar RAZ, w konstruktorze.** Okno zmienione po
  starcie gry skaluje panel zamiast go przebudować (ta sama cena, co
  w `PlayerPanel`). Na telefonie bez znaczenia (orientacja zablokowana).
- ✅✅ **`OI-133` ZAMKNIĘTE 2026-09-21 — cofnięcie jest operacją ATOMOWĄ**
  (decyzja autora). Albo całość, albo nic, plus konkretny powód; dotyczy
  wszystkich trzech ścieżek. Bramka: `tools/sklep_cofniecie.mjs` §5.
  ⚠ Opis poniżej zostaje w brzmieniu z 2026-09-19 — mówi, **co było wadą**,
  nie co obowiązuje dziś.
- **`OI-133` — cofnięcie sprzedaży potrafi ZAMILKNĄĆ.** `undoLastTransaction`
  kasuje transakcję przed próbą, a gdy w plecaku nie ma miejsca, wycofuje się
  bez słowa: baner znika, złota nie ubywa, rzecz nie wraca. ⚠ Najłatwiej
  trafić rzeczą `1×2` (osiem wolnych pól, ale bez dwóch sąsiadujących
  pionowo — zmierzone 2026-09-19). Dotyka `undo` i `Inventory`, więc **nie
  jest to sprawa UI** i czeka na decyzję autora.

---

## 7. Stan na zamknięcie sesji (2026-09-19)

### ✅ Wdrożone

Cztery kolumny w kolejności `KUPIEC → PLECAK → ZAŁOŻONE → SZCZEGÓŁY`; układ
liczony z okna (§2) · sylwetka zamiast tabeli warstw (§2.2) · **gabaryt
niesie POLE, nie ikona** (§2.3) · **gabaryt obowiązuje także po założeniu** —
kafel ręki wysoki na dwa pola (§2.4) · **język gracza zamiast kodów warstw**
i podgląd o kształcie gabarytu (§2.5) · karta: jeden model, dwa renderery
(§3) · porównanie `nowe → noszone` **przypięte nad ceną**, poza przewijaniem ·
ostrzeżenie „nie spełniasz wymagań" na górze karty · pusty stan = wizytówka
kupca · pasek naprawy na dole kolumny, z kwotą i **widoczny także wtedy, gdy
kupiec nie naprawia** · sprzedaż rzeczy ZAŁOŻONEJ z sylwetki (potwierdzenie
+ „Sprzedaj — zdejmie") · pomoc pod `ⓘ` · zamknięcie `✕`.

⛔ **Pomoc `ⓘ` ma treść PODYKTOWANĄ przez autora** (2026-09-19) — osiem haseł:
`JAK KUPIĆ` · `JAK SPRZEDAĆ` · `CENY` · `PORÓWNANIE` · `DUŻE RZECZY` ·
`PANCERZ` · `NAPRAWA` · `COFNIĘCIE`. Brzmienie stoi w `ShopPanel.buildHelp`
i **nie jest tu powielane** (dwa egzemplarze tego samego tekstu rozjeżdżają
się zawsze). ⛔ Nie dopisuj dziewiątego hasła i ⛔ nie wracaj w nim do
`L1`/`L2`/`L3`.

⛔⛔ **Zero zmian w mechanice** — ekonomia, ceny, jakość, trwałość, gabaryt,
warstwy, zasady kupna, sprzedaży, naprawy, cofnięcia i `SAVE` **nietknięte**.

### 🔍 Zweryfikowane w grze

Ramka docelowa (S21 FE, 1257×580 j.) oraz 1000×470: pusty sklep · rzecz `1×1`
i `1×2` obok siebie · **`1×2` w plecaku i w ręce w tej samej skali** · zakup
dotknięciem i przeciągnięciem · sprzedaż z plecaka i z sylwetki · naprawa
z kwotami (Kowal) i brak usługi (Zielarka) · cofnięcie · brak złota ·
brak miejsca · niespełnione wymagania · pomoc · zamknięcie.
Bramki: `tsc`, `build` i trzynaście przymiarów — zielone.

### ⏳ Otwarte

⚠ **To jest wersja GOTOWA DO PLAYTESTU, nie zatwierdzona.** Ergonomia na
fizycznym urządzeniu — kafel 70 j., karta ~299 j., przyciski akcji 46 j. przy
normie dotyku 68 — **zostaje do potwierdzenia ręką**, nie rachunkiem.
Otwarte sprawy: `OI-130`, `OI-131`, `OI-132` (§6). `OI-133` ZAMKNIĘTE 2026-09-21.

---

## 8. Bramki

```
node tools/sklep_uklad.mjs      # 6 ramek ekranu × kolumny, okna, ZAŁOŻONE, karta, filtr
node tools/karta_przedmiotu.mjs # model karty na WSZYSTKICH 155 przedmiotach
node tools/ekwipunek_uklad.mjs  # lalka panelu postaci — NIETKNIĘTA
node tools/sklep_cofniecie.mjs  # arytmetyka cofnięcia — NIETKNIĘTA
node tools/gabaryt_przymiar.mjs # gabaryt 1×2 w modelu
npx tsc --noEmit && npm run build
```

⚠ **Przymiar sprawdza SZEŚĆ ramek, nie jedną** — od telefonu 640×300 po monitor
1920×1080. Przy jednej ramce zieleń nic nie znaczy: rozjazd pokazał się
wyłącznie w oknie pionowym (kolumny nachodziły na siebie o 36 j., `K1`).

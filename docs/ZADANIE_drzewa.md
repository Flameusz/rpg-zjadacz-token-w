---
typ: HISTORIA
domena: assets
tytul: Brief na grafikę drzew
stan: zamrozony
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Zadanie: drzewa słowiańskiego lasu

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/assets.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> Brief dla kolejnej sesji. Zanim zaczniesz — przeczytaj `public/assets/README.md`
> (stan assetów, pułapki) i `docs/ART_DIRECTION.md` (zasady graficzne, paleta).
> Ten plik mówi CO zrobić; tamte mówią JAK i CZEGO NIE.

---

## STAN: pięć gatunków, 18 drzew

`tools/build_drzewa.py` rysuje **dąb, świerk, brzozę, buk i grab**. Pierwsze
trzy mają po cztery odmiany (mały 1×2, średni 2×2, duży, drugi duży o innej
sylwetce), buk i grab po trzy. Siedzą w `Nature.png`, wiersze 2–6. Pełny
katalog z identyfikatorami kafli jest w `public/assets/README.md`. Wszystkie
warunki weryfikacji przechodzą — skrypt drukuje liczby przy każdym uruchomieniu.

To realizuje pozycje 1–6 z „Kolejności produkcji" poniżej. Zostały: **martwe
drzewo, powalone, lipa, wierzba**.

Dwa drzewa przemalowane ze starego arkusza zostały **usunięte** — nigdy nie
były rysowane, tylko przekolorowane, i było to po nich widać (płaskie plamy
z losowymi kropkami, poziomy szew na granicy kafli).

Do weryfikacji doszły trzy testy, których brief nie przewidywał, a każdy złapał
realny błąd niewidoczny na planszy stykowej:

- **mieszczenie się w kaflach** — korony bywały ścięte płaską linią po krawędzi;
- **porównanie IoU tylko w obrębie tej samej klasy wielkości** — zestawienie
  sadzonki 1×2 z koroną 3×3 zawsze wychodzi różne i zawsze przechodzi, czyli
  nie jest testem. Ryzyko siedzi tam, gdzie dwa drzewa mają to samo płótno;
- **styk korony z drewnem** — mała brzoza wyszła z arkusza z dwoma pikselami
  czystej trawy między pniem a koroną. Paleta poprawna, kontrast poprawny,
  sylwetka rozróżnialna, w kaflach się mieściło. **Sprite może przejść
  wszystko i nadal nie być drzewem.**

To jest wzór, który się powtarza i warto go znać przed dokładaniem gatunków:
każdy z tych trzech błędów zgłosił autor projektu, patrząc na arkusz — nie
złapała ich żadna liczba, bo wszystkie mierzyły kolor i sylwetkę całości,
a błąd siedział w detalu, w fakturze krawędzi albo w relacji dwóch części.

Trzy rozstrzygnięcia podjęte przy okazji, żeby ich nie podejmować drugi raz:

1. **Dostarczony `height32_trees_mega_pack.png` jest referencją, nie źródłem.**
   Jego drzewa mają 23×30 px — mniej niż nasz kafel. Pomiary i uzasadnienie
   w `public/assets/README.md`.
2. **Rysujemy, nie konwertujemy.** Stąd generator zamiast konwertera.
3. **Reguła „ranking kolorów → stopnie rampy" z tego briefu ma wadę** —
   normalizuje kontrast per obiekt i kasuje różnice jasności *między*
   gatunkami. Opis i obejście w `public/assets/README.md`.

**Czego NIE zrobiono:** gra nadal się nie uruchamia (patrz sekcja niżej) —
świadoma decyzja autora projektu, praca szła tylko po grafice. Ocena odbyła się
na symulacji widoku z gry (trawa z `Teren.png`, zoom 2, gracz obok dla skali),
nie w silniku. **To nadal nie jest test w silniku i przed pójściem dalej warto
go zrobić.**

Kolejne w kolejce: **martwe drzewo i powalone** — pierwsze dwa assety, które
nie są „pień + korona", więc sprawdzą, czy generator w ogóle to udźwignie.
Warianty wielkości są zrobione; brakuje wariantów stanu (uszkodzone, z mchem,
jesienne), ale mają mniejszą wartość niż kolejny rozpoznawalny gatunek — brief
mówi to wprost.

---

## Materiał dostarczony 2026-08-18 — ZMIERZONY, jeszcze NIEPRZETWORZONY

Trzy pliki w `public/assets/`: `gpt-oak.png` (84×79), `gpt-plum-tree.png`
(82×88), `gpt-apple-tree.png` (77×74). **Źródło: wygenerowane w ChatGPT**
(potwierdzone przez autora). Autor zaznaczył, że w innej, wcześniejszej
sesji generowaliśmy razem drzewa **jeszcze lepsze** niż te trzy — te pliki
nie są ostatecznym wyborem, tylko tym, co akurat trafiło na dysk teraz.
Jeśli tamten komplet się znajdzie, może zastąpić ten wpis.

**Pomiar (krok 1 z „Adaptacja materiału źródłowego" — zrobiony, konwersja
NIE):**

| plik | treść (bbox) | kolorów | alfa pośrednia | mediana biegu | dystans do palety (śr. ważona) |
|---|---|---|---|---|---|
| gpt-oak.png | 81×75 | 49 | 0,1% | 1px | 20,9 |
| gpt-plum-tree.png | 71×82 | 53 | 0,1% | 1px | 21,7 |
| gpt-apple-tree.png | 60×65 | 56 | 0,0% | 1px | 23,2 |

Wszystkie trzy przechodzą bramkę #1 czysto: **prawdziwa alfa** (binarna, nie
namalowana), **dziesiątki kolorów** (nie setki tysięcy), **mediana biegu 1px**
— czyli to jest narysowane na siatce, nie wyrenderowane w wysokiej
rozdzielczości i zmniejszone (ten drugi przypadek dopiero co kosztował czas
przy Sulisławie — `tools/build_sulislaw.py`, JPEG 14× za duży). Klasa
rozmiaru: dąb i śliwa bliżej „duże" 3×3, jabłoń bliżej „średnie" 2×2 — **nie
zmniejszać, ciąć na siatkę** (reguła #2).

⚠ **Przeznaczenie DWÓCH z trzech jest już zapisane w `wioska_plan.md`, tylko
bez grafiki** — to nie jest nowa treść, to domknięcie starego wpisu:
- `gpt-apple-tree` → jabłoń: pas „**Sad i ogrody**" (y34–44, „jabłonie, śliwy,
  pasieka ⏳") i wprost obejście Sołtysa („sad jabłoniowy, **8 drzew**, status ⏳", §5.6).
- `gpt-plum-tree` → śliwa: ten sam pas, plus majątek Doroty Zielarki („śliwy"
  wymienione, nigdy niepostawione — ten sam rodzaj rozjazdu co „chata zachód").
- `gpt-oak` → rola **nierozstrzygnięta**. Mamy już 4 warianty dębu w
  `Nature.png` (`tools/build_drzewa.py`); czy ten ma je zastąpić, uzupełnić,
  czy służyć czemu innemu — do ustalenia przed konwersją.

**AKTUALIZACJA 2026-08-18 (później tego samego dnia): jabłoń i śliwa
PRZETWORZONE i WKLEJONE.** `tools/build_drzewa_owocowe.py`, wiersze 7–9
`Nature.png` (`jablon_duza` 2×3 kol. 0–1 id 133, `sliwa_duza` 3×3 kol. 2–4
id 135). Dąb (`gpt-oak.png`) **zostaje nieprzetworzony** — rola wciąż
nieustalona (§ wyżej).

Metoda: ranking DYSTYNKTYWNYCH kolorów wg jasności → równoliczne kubełki
(nie ważone masą pikseli) → stopnie rampy, osobno per rodzina barw. **Cztery
rodziny, nie trzy** — brief przewidywał zieleń/korę, ale jabłko i śliwka
potrzebowały własnej: `akcent_cieply` dla czerwieni jabłka (hue ok. 280–5°),
`akcent_chlodny` dla fioletu śliwki (hue ok. 259–333°) — dokładnie ta sama
zasada, którą brief zapisał dla jarzębiny, użyta tu pierwszy raz naprawdę.

⚠ **Jeden błąd znaleziony WYŁĄCZNIE na renderze, nie w liczbach — dokładnie
wzór, o którym ostrzega ten plik.** Cztery prawie-czarne piksele cienia (jabłoń)
i dwa (śliwa) miały niestabilny hue przez niskie nasycenie (R≈G≈B), więc
trafiły do rampy owocu zamiast kory — pień wyszedł czerwono/fioletowo
przebarwiony. Wszystkie testy liczbowe (paleta, kontrast, spójność) przeszły
mimo tego, bo `akcent_cieply`/`akcent_chlodny` **są** poprawną paletą, tylko nie
dla pnia. Naprawione progiem nasycenia (`PROG_NASYCENIA_OWOCU = 0.45`) — poniżej
niego piksel nigdy nie idzie do rampy owocu, niezależnie od wyliczonego odcienia.

Weryfikacja: **wszystkie 6 testów przeszło**, liczone razem z pełnym
istniejącym katalogiem (nie tylko dwoma nowymi drzewami) — w tym test [1]
(IoU sylwetek) przeciw `swierk_duzy`/`dab_duzy` i reszcie klasy 2×3/3×3.
Zero kolorów spoza palety, margines ≥1px z góry i boków, kontrast wobec
trawy −49,3 (dobrze poza progiem ±15), pień i korona jako jeden spójny
obiekt (290/393 px styku).

**Czego zabraknie do kompletnego sadu z `wioska_plan.md`** (pas „Sad i
ogrody" + sad Sołtysa 8 drzew): dziś jest **jeden rozmiar na gatunek**
(„duży"). Osiem drzew tej samej sylwetki obok siebie czyta się jak
kopiuj-wklej, nie jak sad — brakuje **wariantów wielkości/wieku** (młody,
średni) tego samego materiału źródłowego, tym samym przepisem. Nie zrobione
teraz, bo nie było o to proszone.

## AKTUALIZACJA 2026-08-18 (jeszcze później): grusza doszła, czwarta rodzina barw

`gpt-pear-tree.png` (94×106, wygenerowane w ChatGPT, ta sama jakość co
jabłoń/śliwa) przeszła bramkę pomiaru czysto: alfa realnie binarna, 47
kolorów, mediana biegu 1px. `grusza_duza` — **3×4 kafle (96×128)**, większa
klasa niż jabłoń/śliwa, bo treść (83×101) wymagała więcej wysokości niż
dawały 3 wiersze. Kolumny 5–7, wiersze 7–10, id lewego górnego kafla **138**.

⚠ **Owoce gruszy (złoto-żółte) nie miały gdzie wylądować w istniejącej
palecie** — ani `piasek` (dystans 32+, zbyt brązowy/przygaszony), ani
`akcent_cieply` (zajęty przez czerwień jabłka, zresztą złe hue). Dodana
czwarta rodzina barw: **`akcent_zlocisty`** w `tools/gen_palette.py`
(`h_cien=45, h_swiatlo=49, s_baz=0,75, v_baz=1,0` → `#8c6e13 #bc9a29 #ecc846
#ffdf61 #ffe675`), dobrana przemieceniem siatki parametrów pod zmierzone
kolory źródła — średni dystans 20,7, w tym samym zakresie co dopasowanie
czerwieni/fioletu do ICH ram. **Decyzja autora, potwierdzona przed
dodaniem** — to jest współdzielony system, każdy przyszły żółty/złoty
element w grze go odziedziczy. `docs/paleta.json` przegenerowany
(`tools/gen_palette.py`) — wszystkie 12 wcześniejszych ramp wyszły bajt w
bajt identyczne, sprawdzone przed zapisem.

Klasyfikator (`klasyfikuj_grusze`) używa **niższego progu nasycenia niż
jabłoń/śliwa** (0,35, nie 0,45) — najjaśniejszy, najczęstszy odcień owocu
(`#fce48e`) ma nasycenie 0,44, więc wyższy próg wyciąłby go samego z rampy.
Bezpieczne tylko dlatego, że sprawdzone: żaden ciemny/dwuznaczny piksel
gruszy nie wypada w paśmie hue 35–62 (są w 316–335, poza zakresem).

Weryfikacja: wszystkie 6 testów przeszło, liczone razem z pełnym katalogiem
(18 istniejących + 3 owocowe). Zero kolorów spoza palety, pień czysto brązowy
(bez powtórki błędu z pierwszej wersji jabłoni/śliwy — próg nasycenia
zapobiegł mu od razu, nie trzeba było łapać na renderze drugi raz).

**Sad z `wioska_plan.md` ma teraz trzy z trzech nazwanych gatunków**
(jabłoń, śliwa — sad Sołtysa i pas „Sad i ogrody"; grusza — pojedyncze
drzewo na placu, `Rdzeń` §wyżej). Zostaje: warianty wielkości (patrz akapit
wyżej) i pasieka (prop, nie drzewo).

## AKTUALIZACJA 2026-08-18 (trzeci przebieg): warianty wielkości — dziura zamknięta

Autor wskazał materiał już leżący w `public/assets/` (nazwy `apple`/`plum`/
`pear`, część `-pixel-snapper`), którego nie było w pierwszym przebiegu.
**11 drzew razem** po tym przebiegu, patrz pełna tabela w
`public/assets/README.md` (katalog `UKLAD`). Jabłoń ma teraz **pięć**
rozmiarów (duża, duża², średnia, mała, młoda), śliwa **trzy**, grusza
**trzy** — dokładnie zamyka lukę „8 drzew tej samej sylwetki czyta się jak
kopiuj-wklej" zapisaną w poprzedniej aktualizacji.

**Jeden plik odrzucony w tym przebiegu, jeden podmieniony przez autora po
odrzuceniu.** Pierwsza wersja `gpt-pear-tree-young.png` nie przeszła bramki
pomiaru: 52 685 kolorów, białe OPAKOWE tło (nie alfa), treść 765×1096 na
kanwie 1231×1278 — ten sam błąd jakości co `height32_trees_mega_pack.png`,
zgłoszony wprost zamiast przemilczany. Autor podmienił na
`gpt-pear-tree-young-pixel-snapper.png` (72×76, 43 kolory, alfa realnie
binarna) — przeszło czysto, wpięte jako `grusza_srednia`.

**Dwie pułapki złapane wyłącznie pomiarem/renderem, nie na oko przy
oglądaniu źródła:**

1. **Martwa alfa.** Trzy pliki jabłoni (`apple-medium/medium2/01-pixel-
   snapper.png`) miały `alfa min==max==255` — czarne tło namalowane w
   pikselach. Dokładnie pułapka #1 z sekcji „Adaptacja materiału
   źródłowego" wyżej w tym pliku, tyle że tym razem naprawdę się
   zdarzyła. Bez kluczowania **89% „korony"** jablon_srednia wyszłoby jako
   najciemniejszy stopień `kora` — złapane najpierw na liczbie (89%
   pikseli = `#000000`), dopiero potem potwierdzone na renderze (trzy
   ciemne kwadraty zamiast drzew, żaden test automatyczny tego nie
   zasygnalizował, bo `#000000` jest formalnie prawidłowym, choć
   nieużywanym kolorem tła — nic w weryfikacji nie sprawdza UDZIAŁU
   pojedynczego koloru). Naprawa: `alfa_bez_czerni()` w
   `build_drzewa_owocowe.py`, flood-fill od krawędzi kanwy — ta sama
   technika co usuwanie zielonego ekranu w `build_gniewko.py`/
   `build_hanna.py` z wcześniejszej sesji, tylko kluczowana do czerni
   zamiast zieleni.
2. **Wyspa.** `apple-big-pixel-snapper.png` (duża², id 209) miał 10-pikselowy
   biały zawijas 17px od korony, odcięty od głównej masy drzewa. Żaden z
   testów liczbowych (paleta, kontrast, margines) tego nie łapał — tylko
   test [6] („spójność sprite'a") zgłosił `czesci: 2` zamiast 1. Naprawa:
   `usun_wysepki()` (import z `build_drzewa.py`, tej samej funkcji, którą
   `sprzataj()` już używał do tego samego celu w lesie), `min_px=12`.

Weryfikacja: wszystkie 6 testów przeszło na pełnym katalogu **29 drzew**
(18 leśnych + 11 owocowych). `Nature.png` teraz 640×593 (18 wierszy), id
istniejących kafli nietknięte.

## AKTUALIZACJA 2026-08-18 (czwarty przebieg): jabłka wyglądały jak zgniłe — dwie kolejne pułapki

Zgłoszone przez autora po obejrzeniu zapisanego arkusza: jabłonie (zwłaszcza
duże) wyglądają dziwnie, jabłka jak zgniłe, plus czarne plamy w koronie
mniejszych wariantów. Żaden z 6 testów automatycznych tego nie złapał —
dokładnie wzór, który ten plik opisuje od pierwszego dnia: **wszystko może
przejść testy i nadal nie być drzewem.**

**Plamy w koronie okazały się byc percepcją, nie realnym błędem** — sprawdzone
bezpośrednio na zapisanych kaflach (`#000000` search, próg <20,20,20): zero
pikseli. Ciemnoczerwone jabłka (patrz niżej) w małej skali/skompresowanym
podglądzie czytają się jak ciemne plamy — to ten sam problem co „zgniłe
jabłka", nie osobny.

**Prawdziwa przyczyna „zgniłych" jabłek — DWIE, obie w klasyfikatorze
`akcent_cieply`, obie zmierzone, nie zgadnięte:**

1. **Rampa `akcent_cieply` jest CELOWO zaprojektowana pod żar/zachód słońca**
   (`tools/gen_palette.py`: hue 350°→30° od cienia do światła — świadomie
   ucieka w pomarańcz przy rozjaśnianiu). Zmierzone na renderze przed
   naprawą: **47% pikseli owocu w `#cc7448`** (rdzawy pomarańcz), prawie
   zero w najciemniejszym stopniu. Naprawa: jabłoń używa tylko **trzech
   najciemniejszych** stopni rampy (`650a19`/`871919`/`aa432e`) —
   pomarańczowo-brzoskwiniowy koniec (`cc7448`/`efac69`) zostaje
   nieużywany przez ten gatunek. Owoc zostaje w rodzinie czerwieni/rdzy,
   nigdy nie dryfuje w pomarańcz.
2. **Połysk na jabłku dzieli pasmo odcienia z korą** (5–25°) — zmierzone na
   `apple-big-pixel-snapper.png`: `#fb561e` (H=15°, S=0,88, **V=0,98**)
   wpadał do `kora` jako „najjaśniejszy z ciemnych" i lądował w jasnym,
   szarawym stopniu (`kora[3]`, #6c5545) — widoczny jako brudna plama W
   ŚRODKU jabłka. Naprawa: prawdziwa kora w tym źródle nie przekracza
   V≈0,72 (najjaśniejszy stopień samej rampy `kora` to V≈0,49), więc
   `V≥0,85 przy S≥0,7` nie jest korą pod żadnym wiarygodnym odcieniem
   drewna — zawsze połysk. Taki piksel idzie teraz do `akcent_cieply`
   zamiast do `kora`.

**Trzecia, mniejsza poprawka przy okazji**: próg jasności `PROG_JASNOSCI_
JABLKA = 0,35` — `apple-big-pixel-snapper.png` miał WŁASNE, inne niż
`gpt-apple-tree.png`, ciemne kolory cienia pnia (`#381d20` V=0,22,
`#4b2523` V=0,29) które przechodziły próg nasycenia 0,45, ale nie próg
jasności. Sam próg nasycenia z poprzedniej aktualizacji nie wystarczył —
**każdy nowy plik źródłowy może przynieść własny wariant tej samej
pułapki**, nie jest to jednorazowa łatka.

Wszystkie 6 testów przeszło ponownie po tej naprawie, na tym samym
rozmieszczeniu w arkuszu (id kafli bez zmian). Zweryfikowane wizualnie —
nie tylko liczbowo — zbliżeniem na pojedyncze jabłko przed i po, bo to
właśnie ten rodzaj błędu żaden test nie łapie.

---

## Zanim dotkniesz drzew: dwie rzeczy do rozstrzygnięcia

**1. ~~Gra się nie uruchomi~~ — ZROBIONE.** `Teren.png` jest wczytywany
i związany z tilesetem `Teren`, a `forrest.tmj` powstała od nowa
(`tools/build_mapa.py`, 100×60 kafli). Wszystkie drzewa z katalogu stoją na
mapie, w silniku, na trawie. Szczegóły w `public/assets/README.md`.

Powód, dla którego to było pierwsze: **drzewa ocenia się w grze, na trawie,
przy `zoom: 2`, a nie na planszy stykowej.** W poprzedniej sesji wielokrotnie
„zweryfikowałem" grafikę liczbami, które przechodziły, a wynik był brzydki.
Kafel oglądany osobno kłamie — i tak samo kłamie sama liczba w raporcie: trzy
błędy układu mapy wyszły dopiero po złożeniu jej w jeden PNG i obejrzeniu.

Czego mapa jeszcze nie ma: **kolizji** (żadnych, celowo — najpierw układ)
i **budynków** (chata zniknęła razem ze starym arkuszem).

**2. Materiał źródłowy będzie dostarczony.** Autor projektu przekaże plik
z drzewami. Zadanie to więc **adaptacja cudzej grafiki do naszego standardu**,
a nie generowanie kształtów od zera — i to dobrze, bo generator potrafi składać
masy listowia, ale nie narysuje liścia klonu ani dziupli.

Ten proces jest już przećwiczony w tym projekcie (kępki trawy i dwa obecne
drzewa przeszły dokładnie przez niego). Opis w sekcji „Adaptacja materiału"
poniżej — **przeczytaj ją przed pierwszą konwersją**, bo każda z wymienionych
tam pułapek kosztowała już jedną nieudaną próbę.

---

## Cel

Rozbudować system drzew dla średniowiecznego świata RPG inspirowanego lasami
Europy Środkowo-Wschodniej i kulturą słowiańską. Drzewa mają pasować do
drewnianych osad, palisad, terenów wiejskich i naturalnych lasów.

**Nie chodzi o pojedyncze ilustracje.** Każde drzewo jest elementem
modularnego tilesetu.

Las ma wyglądać na: różnorodny, naturalny, stary, zamieszkały.

---

## Zasady techniczne (nienegocjowalne)

- pixel art, widok z góry, kafel **32×32 px**, skok w arkuszu **33 px**
- **19 kolumn** — nie zmieniać, bo `id = wiersz × kolumny + kolumna`
- **prawdziwa alfa**, piksel w pełni kryjący albo w pełni przezroczysty
- **żadnego terenu namalowanego pod drzewem** — drzewo trafia do `Nature.png`,
  który zawiera wyłącznie obiekty
- **tylko paleta** z `docs/paleta.json` (rampy `korona`, `listowie`, `kora`,
  `neutralne` na cień)
- **cień kontaktowy** pod każdym drzewem — jeden ciemny ciepły kolor z alfą,
  nie czerń wtopiona w sprite
- światło z **góry, lekko z lewej**
- **obiekt musi mieścić się w swoich kaflach w całości** — bez zawijania

### Rozmiary

| klasa | kafle |
|---|---|
| małe | 1×2 |
| średnie | 2×2 |
| duże | 3×3 |
| pradawne / specjalne | 3×4 lub większe |

Referencja z pomiaru cudzego pakietu: ich drzewa miały 79–113 px szerokości na
139 px wysokości, czyli 3–4 kafle na 4–5. Nasze obecne dwa drzewa są mniejsze
(2×2 i 1×2) i to jest do poprawienia.

### Warianty każdego gatunku

młode · dorosłe · stare · uszkodzone · naturalnie odmienne

Różnorodność ma wynikać z **innej sylwetki korony, innego ułożenia gałęzi,
innego kształtu pnia i innych proporcji** — nie z powielenia jednego kształtu.

---

## Gatunki

### Główne

**1. Dąb szypułkowy** — główne drzewo puszczy. Szeroka korona, masywny pień,
grube gałęzie, rozłożysty. Warianty: młody, dorosły, pradawny, z mchem,
z widocznymi korzeniami. Do puszcz, świętych miejsc, okolic osad.

**2. Sosna zwyczajna** — najczęstsze drzewo nizin. Wysoki pień, smukła
sylwetka, rzadsza korona, jasna kora. Warianty: młoda, normalna, wysoka,
grupa sosen.

**3. Brzoza** — jasny element krajobrazu. **Biały pień**, delikatna korona,
lekka sylwetka. Warianty: pojedyncza, grupa, młody zagajnik. Na polany,
granice lasu, okolice rzek.

**4. Świerk** — gęsty ciemny las. **Stożkowata korona**, gęste igliwie,
pionowa sylwetka. Warianty: młody, duży, grupa. Do starych lasów, gór,
terenów północnych.

**5. Buk** — stary las liściasty. Gładki pień, szeroka korona, elegancka
sylwetka. Warianty: zielony, jesienny, stary.

### Uzupełniające

**6. Grab** — gęsty zagajnik, krzywy pień, ciemniejsza zieleń.
**7. Klon** — charakterystyczne liście, warianty jesienne, średnia korona.
**8. Lipa** — szeroka korona, drzewo osad i miejsc spotkań. Centrum wioski,
okolice chat, miejsca kultowe.
**9. Jarzębina** — małe drzewo, **czerwone owoce**, dekoracyjne. Drogi, chaty,
polany.
**10. Wierzba** — **pochylony pień, zwisające gałęzie**. Rzeki, mokradła,
brzegi jezior.

### Specjalne

**11. Pradawny dąb** — asset fabularny. Ogromny pień, dziupla, korzenie, mech,
nieregularna korona. **Minimum 3×3 kafle.**

**12. Martwe drzewo** — mroczny las, ruiny, stare pola bitew. Warianty: suche,
złamane, spróchniałe.

**13. Powalone drzewa** — dekoracja. Warianty: świeżo ścięte, omszałe, stare
spróchniałe. Dodatki: pień, gałęzie, grzyby, mech.

### Runo (uzupełnienie lasu)

Młode sadzonki · korzenie · kępki mchu · małe krzewy · paprocie · grzyby przy
pniach · opadłe liście · gałęzie na ziemi.

---

## Kolejność produkcji

1. Dąb · 2. Sosna · 3. Brzoza · 4. Świerk · 5. Buk · 6. Martwe drzewo ·
7. Powalone · 8. Lipa · 9. Wierzba · 10. reszta

**Najpierw zestawy bazowe wszystkich gatunków z priorytetu, potem warianty.**
Pięć rozpoznawalnych gatunków jest warte więcej niż jeden gatunek w pięciu
odmianach.

### Kolory poza obecną paletą

Trzy gatunki wymagają barw, których nie ma:

- **brzoza** — biały pień (`neutralne` może wystarczyć, sprawdź na trawie)
- **jarzębina** — czerwone owoce (`akcent_cieply`)
- **buk jesienny / klon jesienny** — pomarańcz i rdza

Jeśli paleta wymaga rozszerzenia, **dodaj rampę w `tools/gen_palette.py`**, nie
wyjątek w jednym pliku. Tak powstała rampa `korona` — bo `listowie` jest
ciemniejsze od trawy i drzewo na nim znikało zamiast się odcinać.

---

## Adaptacja materiału źródłowego

Proces przećwiczony na kępkach trawy i dwóch obecnych drzewach. Kolejność ma
znaczenie.

### 1. Najpierw POMIAR, nie obróbka

Sprawdź na pliku źródłowym, zanim cokolwiek przetworzysz:

- **czy jest prawdziwa alfa** — `alfa min/max`. Materiał z Gemini miał
  `min 255, max 255`, czyli szachownica i magenta były **namalowane w pikselach**;
  tło trzeba wtedy kluczować, a antyaliasing zostawia po nim obwódkę
- **ile kolorów** — pixel art ma dziesiątki, malunek udający pixel art ma
  setki tysięcy
- **czy jest równa siatka pikseli** — jeśli nie ma, to nie jest pixel art
  i zmniejszanie da rozmytą miniaturę
- **efektywny rozmiar obiektu** w pikselach — stąd wynika, ile kafli zajmie

### 2. Nie zmniejszać, tylko ciąć na siatkę

Drzewo narysowane na 128 px ma detal wart 3–4 kafli. Wciśnięte w jeden kafel
zamienia się w papkę. **Prop wielokaflowy tnie się na siatkę 32 px**, zachowując
detal.

### 3. Przemalowanie na paletę — trzy zasady, każda okupiona błędem

**Mapuj ODRĘBNE KOLORY po kolejności jasności, nie percentyle pikseli.**
Korona składa się zwykle w ~⅔ z jednego koloru. Progi liczone po masie pikseli
trafiają w jego środek i dzielą go arbitralnie — dominująca zieleń ląduje na
najciemniejszym stopniu i drzewo wychodzi ciemniejsze od trawy. Ranking
zachowuje strukturę cieniowania oryginału jeden do jednego: n-ty najciemniejszy
kolor → n-ty stopień rampy.

**Progi licz dla CAŁEGO obiektu, nie per kafel.** Każdy kafel z własnym
kontrastem = korona rozpadająca się na łatki na granicach kafli. Ten sam błąd
zepsuł wcześniej kępki trawy.

**Zieleń i brąz rozdzielaj po ODCIENIU, nie po jasności.** Pień bywa jaśniejszy
od cienia korony, więc sam próg jasności wymiesza korę z liściem.

### 4. Sprawdź kontrast wobec podłoża

Dominujący kolor korony musi być **jaśniejszy niż trawa (jasność 115)**.
Rampa `listowie` ma 88 i drzewo na niej znikało — dlatego istnieje osobna rampa
`korona` (123). Jeśli gatunek ma być ciemny (świerk, grab), użyj `listowie`
świadomie i sprawdź, czy nadal się odcina.

### 5. Alfa i cień

Piksel w pełni kryjący albo w pełni przezroczysty — alfa poniżej 128 wypada.
Potem **cień kontaktowy**: jeden ciemny ciepły kolor z alfą ~110, nie czerń
wtopiona w sprite. Bez niego drzewo wisi w powietrzu.

### 6. Zapisz pochodzenie

W komentarzu generatora **i** w `public/assets/README.md`: skąd materiał, jaka
licencja. Przemalowanie nie zmienia pochodzenia — te kafle pozostają pracą
pochodną. Za pół roku nie będzie jak tego odtworzyć.

### Kształty w repo trzymamy jako maski stopni rampy

Nie jako piksele w docelowych kolorach — patrz `tools/zrodla/kepki_trawy.npz`.
Dzięki temu zmiana palety projektu przemalowuje wszystko automatycznie.

---

## Weryfikacja — warunek zaliczenia

Liczba plików nie mówi nic o treści. W poprzedniej sesji wygenerowałem 47 kafli
kompletu obszarowego i uznałem to za dowód poprawności — **z 47 unikalnych było
19**. Dlatego:

1. **Rozróżnialność gatunków.** Policz sylwetki (maskę alfy) parami. Jeśli dwa
   gatunki mają podobieństwo maski powyżej ~85%, to jest jeden gatunek w dwóch
   kolorach. Zgłoś to zamiast ukrywać.
2. **Rozróżnialność wariantów** w obrębie gatunku — ten sam test, luźniejszy próg.
3. **Zgodność z paletą** — zero kolorów spoza `docs/paleta.json`.
4. **Kontrast wobec podłoża.** Dominujący kolor korony porównaj z jasnością
   trawy (115). Drzewo, które ma tę samą jasność co podłoże, znika.
5. **Test w grze.** Postaw las na mapie, uruchom, zrób zrzut przy `zoom: 2`.
   To jest jedyny test, który się liczy — plansza stykowa kłamie.

Jeśli coś nie wyjdzie, **powiedz to wprost i pokaż liczbę.** Milczące oddanie
„13 gatunków gotowych", gdzie osiem to ta sama plama, jest gorsze niż oddanie
pięciu dobrych i informacji, że reszta wymaga grafika.

---

## Pierwszy krok

**Nie konwertuj całego pliku na raz.** Weź **trzy gatunki o skrajnie różnych
sylwetkach** — świerk (stożek), brzoza (wąska, jasna), dąb (szeroka kula) —
przeprowadź je przez pełny proces i **postaw w grze na trawie**.

Jeśli te trzy są jednoznacznie rozróżnialne i zgodne z paletą, proces działa
i reszta jest powtórzeniem. Jeśli nie — problem jest w metodzie i lepiej to
wiedzieć po trzech drzewach niż po trzydziestu.

Osobno zgłoś autorowi, czego w dostarczonym pliku **brakuje** względem
specyfikacji — łatwiej dorzucić brakujące gatunki na początku niż po złożeniu
całego arkusza.

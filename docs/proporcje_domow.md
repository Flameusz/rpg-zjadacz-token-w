---
typ: HISTORIA
domena: assets
tytul: Proporcje pionowe domów
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-19
---

# Proporcje pionowe domów — wnioski z rozmowy

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/assets.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> **Status: notatka robocza, nie specyfikacja gotowa do wdrożenia.** Zapis
> wniosków z sesji poświęconej geometrii modularnych budynków (parter,
> piętro, poddasze, styk dwóch brył), na wyraźną prośbę autora. Część liczb
> jest **potwierdzona pomiarem** (oznaczone „zmierzone"), część to **kierunek
> zaakceptowany przez autora, jeszcze bez ostatecznych liczb** (oznaczone
> „do ustalenia"). Nie mylić jednego z drugim.
>
> Siostrzany dokument: `docs/geometria_dachow_LTU.md` — tamten odpowiada na
> pytanie „jakich KLAS kafli brakuje dla footprintu L/T/U" (połacie,
> narożniki, valleye). Ten odpowiada na pytanie „ile bloków wysokości ma
> parter/piętro/poddasze" — inna oś tego samego problemu.

---

## 1. Wysokość postaci — punkt odniesienia

**Zmierzone**: `ASSETS.character.frameHeight = 60px`, kafel `T = 32px`,
`PLAYER.scale = 1`. Postać ma więc **60/32 = 1,875 kafla** wysokości —
blisko „dwóch kafli", ale precyzyjnie mniej.

## 2. Parter = 3 kratki wysokości ściany

**Ustalone i potwierdzone** (nie do zmiany bez wyraźnej decyzji):

- Przy 2 kratkach zapas nad głową postaci to ~0,125 kafla — praktycznie
  zero, postać ociera się o sufit.
- Przy 3 kratkach zapas to ~1,125 kafla — realny prześwit.
- **Zgadza się to z tym, co kod już ma**: `WZORY["stajnia"]` (najniższy
  istniejący budynek) używa `sciana=3`. Komentarz w `build_budynki.py`
  nazywa to progiem wprost: „`sciana=3` korpusu to w praktyce JEDEN rzad
  bali" (jeden kafel zjada cień okapu, jeden fundament, zostaje jeden
  środkowy, widoczny rząd), a „przy `sciana=5` już czyta się jak
  dwukondygnacyjny spichlerz".

**Konsekwencja zmierzona na renderze**: przy `sciana=3` sam parter wygląda
na bardzo krótki względem dachu — dach (3 kratki `GRUBOSC_DACHU`) wizualnie
dominuje nad jednym widocznym rzędem bali. To nie jest błąd generatora,
to jest **za mało ściany, żeby parter czytał się jako kondygnacja**, zanim
zacznie się dach. Patrz punkt 4.

⚠ **Realny, zmierzony defekt przy `sciana=3`**: zwykłe okno w bocznej
kolumnie ściany może kolidować z dachem, jeśli kolumna jest blisko krawędzi
szczytu (dach zaczyna się tam wcześniej, niż zakłada stała pozycja okna).
Potwierdzone porównaniem z `chata` (`sciana=5`, gdzie identyczne okno
działa poprawnie) — przy `sciana=3` to samo okno w kolumnie bliskiej
krawędzi zostało ucięte przez skos dachu w ~80%. Bezpieczne dziś: okno pod
szczytem (`okno_szczyt`, sprawdzona pozycja) zawsze działa; zwykłe okno
boczne przy `sciana=3` — tylko blisko osi (małe `d`), do zweryfikowania
każdorazowo renderem, nie zakładać.

## 3. Dach ≠ pusta czapka — to jest bryła poddasza

Kluczowe zdanie autora: **dach geometrycznie JEST poddaszem, nie tylko
zewnętrzną powłoką**. Skos połaci od zewnątrz = skos sufitu poddasza od
środka — ta sama płaszczyzna, dwie strony.

`GRUBOSC_DACHU = 3` to dziś **minimum geometryczne** wymagane, żeby
`_dach_szczytowy` w ogóle narysował poprawny szczyt (kalenica + belka +
okap w trzech oddzielnych rzędach kafli, patrz komentarz przy tej stałej).
To NIE jest wybór „ile poddasza chcemy" — to jest „ile kafli potrzeba, żeby
dach się w ogóle złożył".

## 4. „Pseudostrych" — dach głębszy niż minimum daje płaski sufit w środku

**Ustalony kierunek (do ustalenia: dokładne liczby)**. Autor: „dach możemy
liczyć ponad 3 bloki, wtedy będzie pseudostrych, tak by pomieszczenie
mieszkalne w środku nie miało skosów."

Rozumowanie: głębokość dachu ponad `GRUBOSC_DACHU`=3 nie musi być w całości
skosem od okapu do kalenicy. Nadwyżkę można rozumieć jako **realną,
płaskosufitową przestrzeń mieszkalną**, z samym skosem (i jego niską,
nieużytkową krawędzią przy okapie) ograniczonym do zewnętrznego pierścienia
tej nadwyżki. Innymi słowy: więcej kratek dachu ≠ „większy strych ze
skosami wszędzie" — to „ten sam strych, tylko z kawałkiem, w którym można
normalnie stanąć, zanim zacznie się skos".

To jest **inna oś niż `sciana`**: `sciana` daje parter bez skosów w ogóle;
dach głębszy niż minimum daje DRUGĄ kondygnację, częściowo bez skosów
(blisko kalenicy), częściowo ze skosami (blisko okapu) — czyli klasyczne
poddasze użytkowe, nie strych na rupiecie.

⚠ **Do ustalenia, nie zakładać**: dokładna proporcja płaskie/skośne w
głębszym dachu, i czy podział jest liczony w pełnych kratkach, czy (jak
sugerował autor przy poprzedniej turze — „dach możemy zaczynać od 2/3
bloku") w ułamkach kafla. Dzisiejszy generator (`_dach_szczytowy`,
`kafel_szczyt_dol`, `_belka_kalenicy` itd.) pracuje wyłącznie w pełnych
wierszach kafli — rozpoczęcie połaci w 2/3 wysokości bloku to nowa
geometria, nie istnieje dziś w kodzie.

## 5. Prawdziwy footprint L/T/U — wiersz maski = wiersz w finalnym obrazku

Ustalone na przykładzie:
```
OOOOOOOOOOO   <- gorna belka (tylna/wyzsza bryla), 3 wiersze = 1 parter
OOOOOOOOOOO
OOOOOOOOOOO
OOOOO......   <- noga (przednia/nizsza bryla), DALEJ W DOL tej samej siatki
OOOOO......      nie na wspolnym fundamencie z belka
OOOOO......
OOOOO......
OOOOO......
```
(„O" = zajęty kafel podłogi, „." = pusty — dosłowny odczyt siatki, wiersz
maski to wiersz w finalnym, renderowanym obrazku, nie abstrakcyjna głębia).

Potwierdzone na referencyjnym obrazku (dom pół-drewniany, dwie bryły):
**tylna/prawa bryła jest wyższa** (dwa poziomy ściany), **przednia/lewa
niższa** (jeden poziom), i **oba dachy zaczynają się z tego samego,
wspólnego wierzchołka** — nie są to dwie niezależne, osobno stojące
kalenice.

### Kafel styku — potwierdzony kształt

Kwadrat 32×32 przecięty JEDNĄ przekątną (ta sama matematyka co istniejący
`kafel_skos`/`_od_krawedzi`, `x+y=const`):
- **Trójkąt A** (nad przekątną): własna połać dachu niższej/przedniej bryły,
  kontynuacja jej skosu.
- **Trójkąt B** (pod przekątną): to, co znajduje się za tym rogiem w
  wyższej/tylnej bryle — **ściana ALBO dach, zależnie od faktycznej relacji
  wysokości obu brył w tym konkretnym miejscu** (sprawdzać zawsze przez
  render, nie zakładać jednego z góry — patrz punkt 7, historia błędu).
- Ciemne załamanie na styku (jak w `kafel_dolina`), inaczej obie
  powierzchnie zlewają się w jedną plamę.

Zaimplementowane w kodzie jako `kafel_styk_dachowy` (`build_budynki.py`) —
**na razie tylko przymiar w pamięci, nie zapisane do `Buildings.png` ani
`docs/budynki.json`**.

## 6. `zloz_zlozony` (istniejący kod) to NIE jest prawdziwy footprint L/T/U

Ważne ustalenie z wcześniejszej części tej samej sesji (pełny wywód:
`docs/geometria_dachow_LTU.md` §5.1). `_sciany`/`_pas_sciany` rysuje
wyłącznie jeden prosty prostokąt — `zloz_zlozony` zmienia TYLKO sylwetkę
dachu nad jednym wspólnym prostokątem ścian, nigdy sam obrys budynku. To
jest poprawne narzędzie do tego, do czego było zrobione (`chalupa_T` itp.,
zweryfikowane renderem, DZIAŁA poprawnie) — ale to inne zadanie niż
footprint z punktu 5, gdzie druga bryła naprawdę stoi gdzie indziej i ma
własne, niezależne ściany.

## 7. Historia błędu — do zapamiętania jako ostrzeżenie

Pierwsze podejście do kafla styku zakładało (bez potwierdzenia), że obie
bryły stoją na WSPÓLNYM fundamencie, więc tylna bryła musiała być SZTUCZNIE
podniesiona (`sciana=6` wymyślone, nieuzgodnione), żeby trójkąt B miał sens
jako ściana. Słusznie odrzucone — złamało to wprost ustalone „3 kratki
parteru". Druga próba (obie bryły po 3, wspólny fundament) też była zła
z innego powodu: przy tej samej wysokości trójkąt B wypada w polaci dachu
sąsiada, nie w jego ścianie. Dopiero obrazek referencyjny (punkt 5)
rozstrzygnął: bryły NIE stoją na wspólnym fundamencie — przednia jest
niżej, w tej samej siatce, zaczynając tam, gdzie kończy się tylna.

**Wniosek ogólny, nie tylko dla tego przypadku**: przy geometrii złożonych
brył nie zgadywać relacji wysokości/fundamentu — sprawdzać na konkretnym
przykładzie/obrazku, bo błąd w tym założeniu jest niewidoczny w kodzie
i widoczny dopiero na renderze.

---

## Otwarte pytania (do ustalenia przed kodowaniem)

1. Dokładna liczba kratek „drugiej ściany" tylnej/wyższej bryły z rysunku
   (widoczna jako pozioma kreska w połowie jej wysokości) — nie podana
   jeszcze wprost.
2. Dokładny podział płaskie/skośne wewnątrz pogłębionego dachu
   („pseudostrych") — czy w pełnych kratkach, czy w ułamkach (2/3 bloku).
3. Czy generator ma zacząć obsługiwać start połaci we FRAKCJI kafla, czy
   zaokrąglamy do pełnych wierszy i tylko dobieramy proporcje tak, żeby
   efekt wizualny się zgadzał.

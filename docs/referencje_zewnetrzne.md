---
typ: OPERACYJNE
domena: assets
tytul: Referencje zewnętrzne — rejestr
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Referencje zewnętrzne — rejestr

> **Po co ten plik istnieje.** `public/assets/tem/` urósł do **16 plików**
> (obrazy referencyjne, część 2048×2048), z których **żaden nie miał ani
> jednego zdania opisu** — nie w `README.md`, nie w `CLAUDE.md`, nie w kodzie.
> To dokładnie ten problem, o którym mówi ten plik: bez rejestru każda kolejna
> paczka referencji ląduje w katalogu i czeka, aż ktoś ją sobie przypomni.
> Ten dokument katalogu tem/ **nie zastępuje**, dopisuje do niego opis, a nowe
> paczki referencji mają dostawać wpis TUTAJ w tej samej sesji, w której
> lądują na dysku — nie „później, jak będzie okazja".

## Zasada: referencja ≠ źródło

`CLAUDE.md` już to rozstrzygnął dla `b1.jpg`/`b2.png`/`a1.jpg`/`a2.webp`/
`a3.webp` w głównym katalogu `public/assets/` — te pliki są **„reference only,
shape vocabulary only, licence unresolved"**: dostarczają geometrii i
konwencji, nie pikseli. `tem/` jest tą samą kategorią, w innym miejscu:
**nic stąd nie jest wczytywane przez grę i nic stąd nie powinno być cięte
1:1**. Każdy plik jest w innej rozdzielczości, innej perspektywie
(prawdziwy izometryczny rzut, nie nasz „top-down z odrobiną skosu") i innej
palecie niż `docs/paleta.json` — dokładnie te trzy różnice, przez które
Nature/Character/Buildings nie miały ani jednego wspólnego koloru, zanim
`ART_DIRECTION.md` to naprawił.

**Licencja: nieustalona dla wszystkich 15 plików.** Nie wiadomo, skąd
pochodzą (paczka komercyjna? itch.io? własna kolekcja?). Dopóki się to nie
wyjaśni, żaden kafel stąd nie trafia do `public/assets/*.png` w stanie
nieprzerysowanym — tylko jako **przerysowana, sprowadzona do naszej palety
wersja**, tak jak już się stało z `znaki.png` (metoda opisana w
`public/assets/README.md`, sekcja „Metoda sprowadzania cudzej grafiki do
palety").

**Dwa miejsca na referencje, i to jest warte ujednolicenia kiedyś, nie
teraz**: luźne pliki w `public/assets/` (udokumentowane w `CLAUDE.md`) i
`public/assets/tem/` (udokumentowane tutaj). Nie przenoszę ani nie
zmieniam nazw — to decyzja porządkowa, nie techniczna, i należy do Ciebie.

---

## `tem/a1/` — trzy pliki, powód tej sesji

### `thatched-roof.png` (512×512)
⚠ **Pierwsza ocena tego pliku w tej sesji była błędna** („nie wnosi nowej
geometrii") — padła po jednym rzucie oka, bez rozłożenia arkusza na moduły,
czyli dokładnie odwrotnie niż metoda, którą ten projekt wymusza na sobie przy
własnych sheetach. Po przybliżeniu (autor wskazał konkretny screen z grą
zbudowaną na tej paczce) obraz jest inny.

**To jest kompletny, modułowy dach CZTEROSPADOWY (hip) — trzeci kształt
dachu, którego nasz kit nie ma wcale.** `tools/build_mapa.py` zna dziś tylko
`kalenica` (płaski prostokątny dach, żadnego domknięcia na krótkich bokach)
i `szczyt` (nasz `/\`, z prawdziwą pionową ścianą szczytową). Dach
czterospadowy — połacie schodzące się do jednego punktu na WSZYSTKICH
czterech bokach, bez pionowej ściany szczytowej w ogóle — to trzecia,
nieobecna dziś kategoria. Na arkuszu (dwa warianty kolorystyczne, jasny i
ciemny, ten sam komplet w obu):
- **czapa/grzbiet** — kafel w kształcie latawca, połacie zbiegające się po
  przekątnej z obu stron frontu;
- **dwie skrajne połacie boczne** — skośne trapezy, NIE pionowe ściany (to
  jest ta różnica względem `szczyt`);
- **prosty odcinek do wydłużania grzbietu** — ta sama czapa, szersza, więc
  dach skaluje się na dowolną długość budynku, nie tylko kwadratowy „kapelusz";
- **słupki narożne w DWÓCH różnych wysokościach** — bo przekątna grzbietu
  hip roofa zmienia wysokość wzdłuż swojej długości, więc różne pozycje na
  skosie potrzebują różnych zakończeń. To dokładnie ta klasa szczegółu, którą
  łatwo przeoczyć rysując od zera (nasza własna belka kalenicy — płaskie
  ucięcie zamiast zwężenia — to ten sam błąd w innym miejscu).
- **strzecha nad drzwiami z przerwą** — kity słomy z prześwitem pośrodku,
  osadzone nad otworem drzwiowym pod OKAPEM, nie pod ścianą szczytową; nasz
  `_dach_szczytowy` tego rozróżnienia dziś nie robi.
- **szary łukowy przejazd z kawałkiem dachu nad nim** — pasuje do krytego
  łącznika między dwoma budynkami widocznego na screenie autora.

### `11_roofs.png` (512×512) — bliźniak powyższego, nie osobna referencja
Dorzucony do `tem/a1/` po pierwszej wersji tego rejestru. **Sprawdzone
różnicą pikselową względem `thatched-roof.png`, nie na oko**: te same
moduły w tym samym układzie (czapa hip roofa, boczne połacie, przerwa na
drzwi pod okapem, słupki narożne w dwóch wysokościach), różniące się
wyłącznie przebiegiem cieniowania/szumu tekstury — jeden panel ściany
różni się w całości (inny szum), reszta różnic siedzi na obrysach kształtów
(typowe dla drugiego przebiegu renderu tego samego projektu, nie innego
projektu). **Nie wnosi nowej konstrukcji** — traktować jako tę samą
referencję, nie liczyć osobno.

**Nie jest to gotowy kafel do wycięcia** (zła rozdzielczość, zła
perspektywa, obca paleta) — ale jest to pierwsza konkretna referencja
KONSTRUKCJI dla trzeciego archetypu dachu, gdyby kiedyś był potrzebny
(dziś żadna zaplanowana budowla go po imieniu nie żąda — `stodoła`/`stajnia`
zostają przy `kalenica`, chata przy `szczyt`; wartość jest w tym, że
różnorodność sylwetek w 30-osobowej wsi dziś stoi na dwóch kształtach, nie
trzech).

### `roofs.png` (2048×2048) + `roofs-preview.png` (1536×1536, katalog z podpisami)
Duży katalog **architektury dachów** w wielu stylach i przemalowaniach:
Hipped (z płaskim wierzchołkiem, stromy), Gambrel, Cross-Gabled, Gable,
Gable (Shallow), „Zelda", Flat, Flared Hipped (fake Mansard), **Asymmetric
Gable (Saltbox)**, warianty ośmiokątne. `roofs-preview.png` jest czytelną
mapą — każdy kształt podpisany, więc **to jest ten plik, do którego wracać
przy pytaniu „jak nazywa się dach, który właśnie widzę"**.

⚠ **„Asymmetric Gable (Saltbox)" (etykieta z `roofs-preview.png`) — SPRAWDZONE,
że istnieje jako prawdziwy kafel w `roofs.png`, nie tylko na podglądzie
marketingowym.** Pierwsza wersja tego wpisu poprzestała na etykietce; po
pytaniu wprost odnalazłem go w realnym arkuszu po kolorze (okolice
x≈1050–1400, y≈1500–1900 na 2048×2048 — bladoszara faktura długiego ramienia
jest tam unikalna, więc dała się wyszukać).

**Konstrukcja, nie tylko sylwetka**: saltbox jest zbudowany jako **dwa
ramiona kalenicy o różnej długości, schodzące się w kalenicy PRZESUNIĘTEJ
od środka** — jedno długie i płaskie, drugie krótkie i strome. To OSOBNY
kształt od dachu jednospadowego (pulpitowego) — ma własną kalenicę, tylko
przesuniętą, a nie oparcie o ścianę bez żadnej kalenicy.

⚠ **Skorygowane po sprawdzeniu własnego kodu: to NIE jest brakujący
element.** `CLAUDE.md` opisywał to jako „the kit cannot build an ANNEX", ale
w `tools/build_budynki.py` **już jest gotowa funkcja planu dachu
jednospadowego przybudówki** — `_dach_przybudowki()` (ten sam układ co
`_dach_plaski`, jeden rząd podmieniony z `kalenica` na `przybud_styk`) plus
`kafel_przybud_styk()` rysujący sam kafel (styk słomy ze ścianą domu
głównego). Oba działają. **Nikt jej jednak nie wywołuje** — zero wpisów w
`WZORY`/`BUDYNKI_NA_MAPIE` — więc nigdy nie została złożona z prawdziwą
ścianą i nikt nie sprawdził, czy wychodzi poprawnie (ta sama klasa ryzyka co
przy L/T/U, gdzie „kafle istnieją" i „kafle składają się poprawnie" okazały
się dwoma różnymi twierdzeniami, wymagającymi trzech osobno zmierzonych
poprawek).

**Rola saltboxa w tym kontekście: alternatywny STYL na później, nie
brakujący element dziś.** Właściwym pierwszym krokiem jest podłączenie i
zaudytowanie `_dach_przybudowki` — dopiero gdyby ten prosty dach pulpitowy
okazał się za mało zróżnicowany wizualnie w 30-osobowej wsi, saltbox
(kalenica przesunięta, a nie oparcie bez kalenicy) jest gotowym drugim
wariantem sylwetki. Poprawka w `CLAUDE.md` przy tej samej pozycji.

**Reszta katalogu (Gambrel, Cross-Gabled, „Zelda", Flat, ośmiokątne) nie ma
dziś żadnego zaczepienia w projekcie** — żadna zaplanowana budowla ich nie
potrzebuje. Zostaje jako słownik kształtów na przyszłość, nie jako zadanie.

### `cottage.png` (512×512)
⚠ Przeniesiony tu z `tem/` (główny katalog) po pierwszej wersji tego
rejestru — ten sam plik, nie nowy. Ściany i okna w konstrukcji **muru
pruskiego** (szachulec, tynk + belki na krzyż), trzy warianty faktury tynku
(biały, kremowy, kamienny cokół). **Nie pasuje do naszego stylu
materiałowego** — `CLAUDE.md` jest tu jednoznaczny: „the whole village is
thatched" i budynki to bale/deski, nie mur pruski. Trzymać jako czystą
referencję „jak inni robią okna", nie jako kandydata do przerysowania.

### `porąbane-drewno.png` + `worek.png` + `worek-z-ziarnem.png` (32×32 każdy)
Trzy małe rekwizyty (stos porąbanego drewna, zamknięty worek, otwarty worek
ze zbożem) — jedyne pliki w `tem/`, które **już przestały być referencją**:
zmierzone (6-10 kolorów każdy, już blisko pixel-artu, nie setki kolorów
z antyaliasingu jak `studnia.png` swego czasu) i przepuszczone przez
`tools/snap_paleta.py` (nowe wpisy `ZRODLO`/`CELE`) do wspólnej palety świata.
Zapisane jako właściwe assety: `drewno_porabane.png`, `worek.png`,
`worek_ziarno.png` w `public/assets/` wprost — nic w kodzie ich jeszcze nie
ładuje, to gotowe surowce, nie wpięta zawartość.

Worek trafił w całości w `piasek`/`ziemia`/`kora` bez żadnej pustej rampy.
Złote ziarno (`#d4b22b`/`#e3c654`) leżało 1261-4609 (odległość euklidesowa
RGB²) od najbliższego istniejącego koloru palety — świat nie ma nasyconej
żółci — więc dostało **dwa jawne wyjątki**, ten sam trik co rdzeń ognia
w `ognisko.png`, zamiast zblednąć w `akcent_cieply` i przestać czytać się
jako zboże.

---

## Reszta `tem/` — 11 plików, do dziś bez opisu

### `barn.png` (1024×1536)
Duży, wielowątkowy arkusz: **stodoła w konstrukcji szkieletowej** (ryglowa,
biało-czerwona, NIE bale — inny materiał niż nasz kit „log wall"), drzwi/okna
stodoły z okuciami w kształcie X, **wieże-spichlerze** (silosy) w dwóch
wariantach — kamienna podstawa + stożkowy dach kryty gontem, oraz słoma +
kopulasty dach kryty strzechą, chatka zrębowa ze strzechą (bardzo bliska
naszemu stylowi), płoty, koryta, ule, stogi siana, kompletna zabudowa
targowa z markizami. **Wieże-spichlerze to jedyna rzecz stąd bez odpowiednika
w naszym kicie** — `docs/wioska_plan.md` planuje młyn, ale nie osobny
spichlerz; jeśli taki kiedyś powstanie, to jest referencja kształtu.
Reszta (stodoła ryglowa) jest w innym języku materiałowym niż nasza wieś
(bale + deski, zero muru pruskiego) — nie przerysowywać wprost.

### `chicken_eat.png` + `chicken_walk.png` (128×128 każdy, siatka 4×4 po 32px)
**Prawdziwe sprite'y kury** — animacje jedzenia i chodu, cztery klatki,
rozdzielczość **zgadzająca się z naszym pitchem** (32px, do zweryfikowania
co do faktycznej siatki wycięcia — nie robiłem tu analizy alfa-kanału na
poziomie, jaki ten projekt stosuje dla źródeł wchodzących do gry).
**To jedyne pliki w `tem/`, które w ogóle mają sens jako kandydat do
bezpośredniej ekstrakcji, nie tylko jako wzór kształtu** — ale dopiero po
tej samej rangi pomiaru, jaką dostał `rabbit.png`/`boar.png` (progi alfa,
pitch, klatki), nie „wygląda dobrze więc wycinam".
⚠ **Kurnik (chicken coop) jest jednym z dwunastu budynków już postawionych
w Zagaje** (`CLAUDE.md`, lista `BUDYNKI_WIOSKI`). ~~stał pusty~~ — **2026-08-14:
te dwa pliki DOSTAŁY pomiar w randze `rabbit.png`/`boar.png`** (skan
kanału alfa: czysta siatka 32×32 bez marginesu — konwencja `items.png`,
nie 33px pitch `Nature.png` — wszystkie 16 komórek obu arkuszy niepuste) i
**wygraduowały z `tem/` do `public/assets/chicken_walk.png` /
`chicken_eat.png`**, realnie wczytywane przez grę (`ASSETS.chicken`,
`src/entities/FarmAnimal.ts`). Kurnik ma teraz trzy błąkające się kury —
czysta dekoracja otoczenia (bez HP, walki, interakcji), zobacz `CHICKEN` w
`GameConfig.ts` i wpis w checkliście `CLAUDE.md`. `pig.png` wciąż czeka na
to samo (`docs/odlozone.md` — „Świnia... zawartość czeka na potrzebę") —
ten plik pozostaje wzorem tego, jak taka gradacja wygląda, gdyby świnia
kiedyś wygrała kolejkę.

### `fence.png` (96×192, siatka 3×6 po 32px)
Prosty, drewniany płot/furtka — **najmniejszy i najbliższy naszej skali
plik w całym katalogu**. Nie ma dziś żadnego konkretnego zaczepienia (nasz
płot forestowy/wioskowy już istnieje jako `zagroda_*` w `Buildings.png`),
ale warto wiedzieć, że jest, jeśli kiedyś potrzebny będzie WARIANT płotu
(np. inny dla zagrody Gniewka niż dla progu wsi).

### `fence_medieval.png` (512×1024)
Płoty drewniane (kilka wariantów szerokości/gęstości szczebli) **plus mur
warowny z blankami i most linowy**. Ta druga połowa **nie pasuje do
projektu w ogóle** — nie ma tu zamku ani twierdzy, a `docs/swiat.md` mówi
wprost o „palisadzie", nie murze obronnym. Górna połowa (płoty) jest
tego samego rzędu użyteczności co `fence.png`.

### `container.png` (512×2048)
Bardzo duży arkusz **rekwizytów sklepowych/magazynowych**. ⚠ Poprzednia
wersja tego wpisu mówiła „dolna połowa neutralna, reszta odrzucić" — za
ogólne, przydatne rzeczy leżą rozrzucone po całym arkuszu, nie w jednej
połowie (obejrzane ponownie, dokładnie, 2026-08-14):

Przydatne (pasuje do „ciepłego realizmu" — zwykłe drewno/wiklina/glina/metal,
bez zdobień): **beczki** (górne ~3 rzędy — stojące/leżące/spiętrzone/małe
baryłki/otwarta niecka, szerszy wybór niż dzisiejszy kit), **zwykłe
drewniane skrzynie/skrzynki** bez okuć i kolorowych zamków (środek arkusza),
**wiklinowe kosze**, puste i wypełnione plonami/sianem (nic takiego nie mamy
— mocny kandydat na targ/zagrodę), **płócienne worki** w większej liczbie
poz niż `worek.png`/`worek_ziarno.png` (patrz wyżej), **zwykłe metalowe
wiadra/cebrzyki** (np. do studni), **nieszkliwione gliniane garnki** bez
wzorków.

Do odrzucenia: kolorowe okute „skrzynie skarbów" (czerwone/niebieskie/białe
z zamkami, czysty RPG Maker loot chest), **cały blok niebiesko-świecących
fiolek alchemicznych** (jednoznacznie fantasy-magia), malowana/szkliwiona
ceramika w kwiatowe wzory (zbyt „porcelanowo-orientalna"), jaskrawe
kolorowe skrzynki targowe (zbyt nasycone wobec naszej stonowanej palety),
ozdobne mosiężne/miedziane naczynia na samym dole arkusza (czytają się jako
bliskowschodnie, poza naszym rejestrem).

✅ **13 z nich już wyciętych i wpiętych** (2026-08-14, `tools/
build_rekwizyty_kontener.py --zapisz` → `public/assets/rekwizyty_kontener.png`,
650×198, siatka 5×3 — druga tura dodała 5 przedmiotów do pierwszych 8, na
wyraźną prośbę „jeśli uznajesz je za potrzebne to bierz"): klaster 3 beczek,
okrągła kadź/balia, pojedyncza beczka, 4 warianty małych skrzynek, wysoka
skrzynia z listwami, klaster worków w kratkę, mały kosz wiklinowy
z uchwytami, wiązana sakiewka, **żeliwny kociołek** (pasuje do ogniska —
ta sama rola co kociołek w `ognisko.png`), **klaster drewnianych cebrzyków**,
**klaster bel siana/słomy** (do stodoły/zagrody), **okrągły kosz wiklinowy**,
**zwykły gliniany garnek** bez wzorków. Wszystkie 13 razem dały niecałe 40
unikalnych kolorów przed snapowaniem — każdy trafił do `drewno`/`kora`/
`piasek`/`ziemia`/`neutralne`/`kamień` (ta ostatnia doszła w drugiej turze,
dla żeliwa kociołka) w rozsądnym dystansie, bez potrzeby jawnego wyjątku
(w odróżnieniu od złota w `worek-z-ziarnem.png`). Sam arkusz **nic jeszcze
nie ładuje w grze** — to gotowe surowce, jak `drewno_porabane.png`/
`worek*.png` wyżej, nie wpięta zawartość.

### `decorations-medieval.png` (512×2048)
Zbiór drobiazgów: **nagrobki i krzyże cmentarne**, ikony szyldów sklepowych,
latarnie/pochodnie, fontanna, studnia (osobny wariant niż nasza
`studnia_zlozona.png`), **stogi siana i bele** (mamy już własne przez
`stog_*` w Buildings.png), markizy/namioty targowe, wóz drabiniasty,
**szubienica i tarcza łucznicza** (odrzucić — zły ton dla tego świata),
proporce, obóz z namiotami. Trzy pozycje warte odnotowania jako
**bezpośrednie trafienie w już zaplanowaną, jeszcze niezbudowaną treść**:
- **tablica ogłoszeń** — `docs/wioska_plan.md` §7.3 pozycja **B10**, dziś bez
  żadnych kafli (wprost wymieniona w `CLAUDE.md` jako brakująca).
- **wóz drabiniasty** — pasuje do gospodarskiego charakteru wsi, brak
  odpowiednika dziś.
- **markizy/namioty targowe** — jeśli kiedyś powstanie prawdziwy plac
  targowy (dziś jest tylko pusty plac), to jest punkt startowy.
Cmentarz/krzyże: możliwe w kontekście kapliczki (§7.3 **B11**), ale nagrobki
w rzędach to osobna, większa decyzja fabularna (czy wieś ma cmentarz) —
nie zakładać, tylko odnotować że materiał istnieje.

✅ **3 z nich już wyciętych i wpiętych** (2026-08-14, `tools/
build_rekwizyty_dekoracje.py --zapisz` → `public/assets/rekwizyty_dekoracje.png`,
444×71): **tablica ogłoszeń** (dokładnie B10 — tablica na pojedynczym słupie,
z teksturą tekstu, choć ta ostatnia zbladła po snapowaniu palety do gołej
deski), **pięć narzędzi ogrodowych** oparte pod kątem (szpadel, grabie,
motyka, dwa warianty wideł) i **drewniana taczka dwukołowa** — żadne z tych
dwóch ostatnich nie było wcześniej w rejestrze, znalezione przy tym samym
przeglądzie co tablica. Wóz drabiniasty i markizy targowe (patrz wyżej)
świadomie jeszcze nie wzięte — czekają na realną potrzebę (plac targowy,
gospodarski wóz). Druga tura (pranie na sznurze, duży wóz, koła, zapalona
latarnia) była zbudowana i **cofnięta na wyraźną prośbę** (2026-08-14) —
kod dalej istnieje w historii `tools/build_rekwizyty_dekoracje.py`, gdyby
ktoś chciał do niej wrócić, ale aktualny plik i arkusz jej nie zawierają.
Nic z tego jeszcze nie ładuje się w grze.

### `farming_fishing.png` (640×640)
Siano, worki zboża, warzywa w skrzynkach (marchew, kapusta, ziemniak,
pomidor — **ten sam zestaw co `pole.json`**, ale inny styl rysunku), surowe
mięso/kurczak, **ryby kilku gatunków i wielkości**, oraz **cztery drewniane
łódki wiosłowe stojące w wodzie**. ⚠ **Łódki są jedyną rzeczą w całym `tem/`,
która nie ma dziś ŻADNEGO odpowiednika ani planu w projekcie** — rzeka
istnieje (`forrest.tmj`), bród istnieje, ale przeprawa łodzią nie jest
wspomniana nigdzie w `swiat.md` ani `wioska_plan.md`. To nie jest luka do
zamknięcia — to obserwacja, że gdyby kiedyś rzeka miała nieść więcej niż
tylko most, tu jest punkt wyjścia. Ryby są zaczepieniem pod ewentualne
wędkarstwo, o którym `wioska_plan.md` też nic nie mówi.

### `rocks.png` / `rocks-snow.png` / `rocks-snow-overlay.png` (1024×1024
każdy)
Formacje skalne — głazy, kamienie polne, **dolmeny** (kamienny „stół"), stosy
kamieni, w czterech paletach materiałowych (jasny wapień, ciemny łupek,
brąz, i **wariant śnieżny**). ⚠ **Wariant śnieżny jest całkowicie
nieprzystający** — w tym świecie nie ma biomu śniegu, `rocks-snow-overlay.png`
to warstwa nakładki śniegu na te same głazy. Pozostałe trzy palety są
neutralne stylistycznie i mogłyby kiedyś dać **głazy jako nowy typ
przeszkody terenowej** — ale las dziś **nie ma żadnej kolizji kafelkowej w
ogóle** (`CLAUDE.md`, świadomie odłożone), więc głaz jako przeszkoda nie ma
dziś czego blokować. Czysto na później.

---

## `stog-siana.png` — poza `tem/`, wprost w `public/assets/`

Pojedynczy rekwizyt (51×45), nie część większej paczki — okrągły, organiczny
kopiec siana, w odróżnieniu od istniejącego `stog_0..3` w `Buildings.png`
(wysoki stożek z widocznym palikiem, cztery kafle 32×32, `docs/budynki.json`
kolumny 5-8/wiersz 5, już użyty na mapie wsi). Autor ocenił istniejący jako
nieudany („wygląda jak g.") — porównanie side-by-side pokazało dlaczego:
sztywne, geometryczne pasy i sterczący palik czytają się bardziej mechanicznie
niż jak siano.

✅ **Przekolorowany i zapisany** (`tools/build_stog_siana.py --zapisz` →
`public/assets/stog_siana_paleta.png`). ⚠ **Nie najbliższy-sąsiad, tylko
podmiana RANGOWA**: 4 odcienie słomy w źródle leżały 5000-7700 (dystans
RGB²) od najbliższego istniejącego koloru — zwykłe snapowanie wybrałoby
`akcent_cieply` (rampa ognia) i wyszłoby czerwono-pomarańczowe. Zamiast tego
każdy odcień źródła podmieniony na odcień w tej samej pozycji rankingu
jasności z rampy `piasek` (piaskowo-słomiana, tematycznie właściwa) —
kształt/cieniowanie źródła zostaje, kolor w całości nasz.

⚠ **To NIE jest jeszcze podmiana `stog_0..3` w `Buildings.png`.** Prawdziwe
zastąpienie budynkowego kafla wymaga ręcznego przecięcia tego obrazka na
4 kafle 32×32 pasujące do istniejącej siatki — osobna, większa robota,
niezrobiona tutaj. Dziś to gotowy, przekolorowany luźny rekwizyt, czeka na
decyzję czy/jak wejść nim do `Buildings.png`.

---

## Skrót — co jest warte pamiętania

| plik | werdykt stylu | konkretne zaczepienie w projekcie |
|---|---|---|
| `a1/thatched-roof.png` | zgodny — **i konstrukcyjnie nowy** (poprawiona ocena) | **trzeci archetyp dachu (hip)**, którego kit nie ma; brak dziś budowli po niego wołającej |
| `a1/roofs.png` + `-preview` | częściowo | **Saltbox, zweryfikowany w realnym arkuszu** — alternatywny styl NA PÓŹNIEJ; realny priorytet dziś to podłączyć już istniejącą, niewywoływaną `_dach_przybudowki()` (`wioska_plan.md` §7.3b) |
| `barn.png` | częściowo (spichlerz tak, ryglówka nie) | wieża-spichlerz, jeśli kiedyś potrzebna |
| `a1/cottage.png` | nie (mur pruski) | — |
| `chicken_eat/walk.png` | ✅ zmierzony i wygraduowany | in-game od 2026-08-14 — `public/assets/chicken_*.png`, `Chicken.ts` |
| `fence.png` | neutralny | wariant płotu na przyszłość |
| `fence_medieval.png` | częściowo (płoty tak, mur warowny nie) | — |
| `container.png` | częściowo (proste tak, zdobione/magiczne nie) | ✅ 13 rekwizytów wycięte → `rekwizyty_kontener.png`, jeszcze nie wpięte w grę |
| `decorations-medieval.png` | częściowo | ✅ tablica ogłoszeń (`wioska_plan.md` §7.3 B10) + taczka + narzędzia ogrodowe wycięte → `rekwizyty_dekoracje.png`, jeszcze nie wpięte; wóz drabiniasty i markizy targowe czekają |
| `farming_fishing.png` | częściowo | łódki/wędkarstwo — brak dziś w fabule, tylko obserwacja |
| `rocks*.png` | częściowo (śnieg — nie) | głazy jako przeszkoda, czeka na kolizje w lesie |
| **`docs/ai-pixel-snapped-…`** (80 plików, 11 MB) | nie dotyczy — **metoda, nie assety** | ✅ wnioski wyciągnięte do `prompty_gemini.md`; `build_pole.py` cytuje `prompts/05`. **Otwarta decyzja: czy 11 MB zostaje w repo** |

---

## Znalezione przy okazji: prawdopodobny śmieć w `public/assets/`

Nie ruszałem żadnego z tych plików — to obserwacja z audytu nazw, nie
sprzątanie. Wszystkie pasują do reguły z `CLAUDE.md`, którą sam projekt już
ma spisaną i którą to łamie: *„never leave scratch/debug images (crops, grid
overlays) there — write those to a temp/scratchpad location"*.

- **`test1.png` … `test10.png` + `blacksimth-test.png`** — wszystkie 50×102,
  identyczny rozmiar, zero wzmianek w dokumentacji. Wygląda na serię
  iteracji dopasowania sprite'a kowala, zostawioną po drodze.
- **`kowal_palette_swatch.png`** (288×32) — pasek próbek kolorów, typowy
  output narzędzia do dopasowania palety, nie asset gry.
- **`idle_guide_5x2.png`** (250×204) — nazwa wprost mówi „prowadnica siatki",
  czyli narzędzie pomocnicze do wycinania animacji idle, nie finalny plik.
- **`gejmini.png`** (1824×2298, **6,8 MB** — największy plik w całym
  `public/assets/`) — surowy zrzut/generacja Gemini bez przycięcia, którego
  nic nie ładuje.

Żadnego z nich nie usunąłem ani nie przeniosłem — to są pliki robocze
z realnej pracy, nie moje do kasowania bez pytania. Jeśli faktycznie są
zbędne, `git rm` ich to jedna decyzja do podjęcia, nie coś wymagającego
dalszej analizy.

---

## `public/assets/temp/` — przejrzany i ZLIKWIDOWANY (2026-08-14)

Osobna paczka od `tem/` (myląco podobna nazwa, inna zawartość), przejrzana
w całości na prośbę autora *przed* skasowaniem katalogu. Ten wpis istnieje
po to, żeby powód decyzji przeżył sam katalog — inaczej za miesiąc nikt nie
będzie wiedział, czy coś stamtąd odrzucono świadomie, czy przeoczono.

**Zawartość (4 pliki, w tym jeden duplikat):**

| plik | werdykt |
|---|---|
| `nature_assets.png` (512×279) | ✅ **wzięte 4 rekwizyty** — patrz niżej |
| `village_assets.png` (400×352) | ❌ odrzucone świadomie — patrz niżej |
| `market_assets.png` (400×352) | ❌ **bajt w bajt identyczny** z `village_assets.png` (zweryfikowane md5) — nie osobny plik, tylko kopia |
| `houses.png` (1166×572) | ❌ inny język wizualny — domki „z bajki" w rzucie czołowym, nie nasz top-down; ten sam werdykt co domy w `tem/` |

### Co wzięto z `nature_assets.png` (4 z ~40 rekwizytów)

Kryterium było jedno: **czy to wypełnia dziurę, której nic w grze nie
pokrywa.** Reszta arkusza (drzewa, krzaki, kwiatki, ławka, drogowskaz,
sąg drewna, drobne kamienie) ma już realny odpowiednik w `Nature.png`,
`lawka.png`, `znaki.png`, `drewno_porabane.png`, `kamienie.png` — branie
drugiej wersji tego samego to nie zysk, tylko niespójność.

Wzięte → `pniak_z_siekiera.png`, `grzyby.png`, `brzeg_stawu.png`,
`lilia_wodna.png` (i ich `_paleta.png`), opisane w
`public/assets/README.md`.

⚠ **Każdy wymagał izolacji przez connected-component labelling, nie samego
prostokątnego przycięcia** — sprite'y stoją na tyle blisko siebie, że
prostokąt łapał 6-8-pikselowe skrawki sąsiada (grzyb i lilia oba miały taki
ogon). Prostokąt + oko by tego nie złapał przy tej wielkości.

⚠ **Lilia obnażyła realną dziurę w palecie świata: nie ma rampy różowej.**
Snapowana na `akcent_cieply` (jedyna czerwonawa) koralowy kwiat wyszedł
POMARAŃCZOWY i przestał czytać się jak lilia. Rozwiązane jawnymi wyjątkami
kolorów — ten sam mechanizm i ten sam powód co ziarno w
`worek-z-ziarnem.png`. To jest dokładnie ta pułapka, o której mówi nagłówek
`tools/snap_paleta.py`: przy najbliższym sąsiedzie cała kategoria koloru
potrafi zniknąć.

Pozytywny efekt uboczny: turkus `brzeg_stawu.png` po snapie wpadł w rampę
`woda` i **teraz pasuje do rzeki w grze**, czego oryginał nie robił.

### Dlaczego odrzucono stragany (`village_assets.png`)

Nie dlatego, że grafika jest słaba — jest dobra i skalą pasuje. Odrzucona,
bo **kłóci się z już zapisaną decyzją projektową**: `wioska_plan.md` §5.5
mówi wprost, że sklep kowala „jest wydarzeniem, a nie **straganem**", a
`swiat.md` §3 stawia kuźnię jako *miejsce*, nie budę handlową. Ekonomia
Zagaja jest celowo zbudowana z wizyt w konkretnych obejściach, nie z bazaru.
Postawienie kramów z markizami sugerowałoby graczowi mechanikę targu, której
nie ma i której ten projekt świadomie nie chce.

Gdyby kiedyś powstał jarmark jako *wydarzenie* (nie stała zabudowa), to jest
paczka, po którą wtedy sięgnąć — ale wtedy wraca jako świadoma decyzja, nie
jako „mieliśmy grafikę, to postawiliśmy".

---

## `docs/ai-pixel-snapped-game-sprites-main/` — obcy pipeline, 80 plików, 11 MB

> ⛔ **Usunięty z repozytorium 2026-10-11** (decyzja autora: gra idzie w 3D,
> animacja 2D porzucona). Pliki są w historii gita — ostatni commit z nimi:
> `e9486c3`; wnioski — `docs/prompty_gemini.md`.

Dopisane 2026-08-16 podczas audytu katalogu `docs/`. ⚠ **Ten pakiet leżał w
repozytorium nieopisany — i to jest dokładnie ta sytuacja, dla której ten plik
powstał.** Jest przy tym **największym pojedynczym zrzutem referencji w całym
projekcie** (11 MB wobec 952 KB, jakie waży cała reszta dokumentacji razem
wzięta) i jedynym, który wcześniej nie trafił do żadnego rejestru.

**Łamie trzy założenia tego dokumentu naraz, więc czytaj go osobno:**

| założenie rejestru | ten pakiet |
|---|---|
| referencje to OBRAZY | to przede wszystkim **metoda i prompty** — 8 plików `.md`, obrazy są ilustracją |
| „licencja nieustalona" | **MIT, Chong-U Lim** — znana i pozwalająca na wszystko |
| leżą w `public/assets/` | leży w **`docs/`** |

**Co to jest:** cudzy, dużo bardziej rozbudowany pipeline do problemu, który
ten projekt rozwiązuje własnymi środkami — generowanie sprite'ów AI i
sprowadzanie ich do prawdziwego pixel-artu. Prompty (`prompts/01`…`08`:
kotwica południowa, pixel-snap, kotwice kierunkowe, arkusz akcji, odzyskiwanie
klatek, cykl chodu, snap per klatka, normalizacja w runtime), referencje
pokazujące typowe błędy (dryf stopy, bleeding między klatkami, „mixele") i
gotowe arkusze dwóch postaci.

⚠ **Wiedza z niego jest już WYCIĄGNIĘTA i to jest kluczowe dla decyzji, co z
nim zrobić.** `docs/prompty_gemini.md` ma sekcję „Lekcje z zewnętrznego
pipeline'u", która zaczyna się od słów **„Przejrzane w całości"** i wypisuje,
co się z tego przekłada na naszą pracę. Osobno `tools/build_pole.py` cytuje w
komentarzu jeden konkretny plik (`prompts/05-frame-recovery.md`) jako źródło
metody odzyskiwania klatek. Czyli **wartość tekstowa została skonsumowana**;
to, co zostało na dysku, to głównie ~11 MB PNG-ów i GIF-ów ilustrujących cudze
postacie (pirat, szkielet), których ta gra nie użyje.

**Werdykt stylu: nie dotyczy.** To nie jest paczka assetów do oceny pod kątem
palety czy perspektywy — nic stąd nie zostanie wycięte, przerysowane ani
sprowadzone do `docs/paleta.json`. Reguła „referencja ≠ źródło" obowiązuje tu
w mocniejszej wersji: **to nie jest nawet słownik kształtów, tylko cudza
instrukcja obsługi.**

**Zaczepienie w projekcie:** żadnego zaplanowanego. ⚠ Warto jednak wiedzieć,
że projekt ma **własną, działającą metodę** na ten sam problem —
`tools/snap_paleta.py` plus reguła z `CLAUDE.md`, że snapowanie idzie PRZED
skalowaniem (tak powstały `suszona_skora`, `strach_paleta`, `studnia-gpt`).
Ta metoda jest z tym pipeline'em zgodna, nie sprzeczna, i nie ma powodu jej
zastępować. Osobno: `public/assets/README.md` zapisuje **sprawdzone i
odrzucone** rozszerzenie tej metody na ikony przedmiotów (chleb wyszedł po
snapie błotnisty, bo `items.png` samo w sobie nie jest w palecie).

### ✅ DECYZJA (2026-08-16): zostaje w całości, nieruszany

Rozstrzygnął pomiar podziału wagi, nie sama liczba 11 MB:

| katalog | waga | plików | co to |
|---|---|---|---|
| `prompts/` | **40 KB** | 8 | **cała treść** — osiem promptów; to je cytuje `tools/build_pole.py` |
| `references/` | **9,0 MB** | 33 | cudze sprite'y pirata i szkieletu, ilustracje do promptów |
| reszta | ~2 MB | — | README pakietu, LICENCJA, arkusze |

**99,6% wagi to obrazki, a 100% cytowanej wartości to 40 KB tekstu.**
Kuszące jest więc wyciąć `references/` i zostawić same prompty — i to jest
właśnie rozwiązanie **odrzucone**, z trzech powodów:

1. ⚠ **Nie odzyskuje ani jednego bajta.** Pakiet jest śledzony przez git od
   dawna, więc usunięcie zdejmuje go z dysku roboczego, ale **nie z historii**.
   Jedyną korzyścią byłby porządek w drzewie roboczym — a to jest tanie do
   zniesienia.
2. **Rozbiłoby spójną cudzą paczkę na kikut.** README pakietu odwołuje się do
   tych obrazków, a one **są** demonstracją usterek, o których mówią prompty
   (dryf stopy, bleeding, „mixele"). Zostałoby coś, co nie jest ani
   oryginałem, ani naszym materiałem.
3. **Prawdziwy defekt nie polegał na megabajtach, tylko na tym, że nikt nie
   umiał powiedzieć, co to jest.** To zostało naprawione tym wpisem.

**Nawigacja — jedyna rzecz, którą trzeba stąd wiedzieć:** czytaj `prompts/`
(40 KB, osiem plików). `references/` to ilustracje do nich, nie materiał do
wykorzystania — nic stamtąd nie trafi do gry, bo to sprite'y cudzych postaci.

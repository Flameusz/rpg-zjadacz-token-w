# `tools/` — generatory grafiki, map, audio i katalogów

Reguły dotyczące **wyłącznie** tego katalogu. Co robią te pliki z mapami po
stronie silnika → `src/world/CLAUDE.md`. Fakty o pikselach arkuszy →
`public/assets/README.md`. Stan projektu → `CLAUDE.md` w korzeniu.

⚠ **Ten plik dochodzi automatycznie tylko przy `Read`/`Edit` na plikach z tego
katalogu.** Odczyt bashem (`cat`/`sed`/`grep`) niczego nie wstrzykuje.

---

## Reguła numer jeden: PATRZ NA RENDER, NIE TYLKO NA RAPORT

To najdroższa lekcja w projekcie i powtórzyła się na czterech niezależnych
generatorach. **Wyłącznie** złożeniem wyniku do PNG i obejrzeniem go wyszły:

- bród przecinający rzekę wzdłuż całej doliny; droga wycinająca kanał w jeziorze;
- las czytający się jak sad (za płytki szum gęstości — średnia 0,56 przy bazie 0,66);
- **pionowy szew przez całą mapę** przy idealnych sumach w liczniku gatunków;
- rozlewisko wyglądające jak basen; ścieżka gasnąca per kafel wyglądająca jak błąd renderowania;
- kafel trawy w środku pola i **ćwiartka stogu** w zagrodzie;
- korona bez pnia po wycięciu przesmyku; podpisy NPC zlepione w „RolnHanna";
- ramię dachu wiszące nad trawą; dziura w gąszczu przy poprawnej sylwetce.

**Żadnego z nich nie pokazała ani jedna liczba.** Raport mówi, czy program
zrobił to, co napisano; render mówi, czy to, co napisano, było dobre.

⚠ **Do OSTROŚCI (tekst, krawędzie kafli) rób wycinek i powiększ go 3–4× przy
`imageSmoothingEnabled = false`.** W pełnej klatce te same błędy giną. Zrzut
przysłany przez czat mógł zostać po drodze przeskalowany — zanim uznasz „napisy
są rozmyte" za potwierdzone albo obalone, zrób własny zrzut 1:1.

---

## Reguła numer dwa: generator jest PRZYMIAREM

Domyślnie **drukuje raport i nie zapisuje nic**; zapis wyłącznie pod `--zapisz`
(55 z 59 skryptów). Wyjątki, każdy świadomy: `portale.py` (moduł wspólny, nie
skrypt), `audyt_rekwizytow.py` (sam audyt), `gen_audio.py` i `build_nature.py`
(piszą wprost).

⚠ **`.tmj` tkniętej w Tiled mapy JEST mapą — `--zapisz` skasuje tamtą pracę.**
Kilka rzeczy istnieje wyłącznie w `.tmj` i żaden generator o nich nie wie
(młyn w Zagajach, brama wschodnia, warstwy `rosliny`/`kamienie`/`znaki`).
**Nie proponuj „synchronizacji" mapy z generatorem.**

**Wzorzec zmiany punktowej na żywej mapie:** jednorazowy skrypt, który rusza
wyłącznie swój prostokąt, jest idempotentny (czyści go przed zapisem) i **nie
zostaje w `tools/`**.

⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
Dokładając regułę (np. odległość spawnu) sprawdź, że po celowym zepsuciu danych
raport faktycznie zgłasza BŁĄD. Niedźwiedź stał poza raportem odległości i nikt
tego nie zauważył, bo raport był zielony.

⚠ **Zamek czytający TEKST źródła sprowadza końce linii do LF, zanim użyje
wzorca.** Repo trzyma LF, ale checkout z `core.autocrlf=true` (Windows) ma
CRLF — wycinek ciała funkcji do `"\n  }\n"` dawał tam `indexOf` = −1, „ciałem"
stawała się reszta pliku i `tarcze_przymiar` N1 świecił na czerwono od słowa
z innej metody (2026-10-13), choć na LF przechodził. Wzór: `lf()` w
`tarcze_przymiar.mjs`. Wzorce kończące się na `"\n  }"` (bez `\n` na końcu)
tej pułapki nie mają.

---

## Generator postaci (`char3d_base.py`) — kontrakt KOTWIC i dowód „nic się nie zmieniło"

Stan postaci 3D (baza V5 = MASTER, etap zamknięty 2026-10-10): `docs/postac3d_checkpoint.md`;
przebieg A1–A6: `docs/handoff_2026-09-20_fundament_postaci.md` (`HISTORIA`).
Niezmienniki rigu (nazwy kości, skala 1,6527, kość dłoni): docstring modułu.
Tutaj wyłącznie dwie rzeczy, które trzeba znać **przed** zmianą.

### Pierścienie są UŁAMKAMI KOTWICY, nie liczbami (od 2026-09-20, A4)

Tabele `tulow` i `noga` w `_cialo()` nie mają już wymiarów wpisanych wprost.
Każdy pierścień to `P["kotwica"] * mnoznik`, gdzie mnożnik 1,000 wskazuje
pierścień kotwiczący. Kotwice: `klatka_polszer`/`_glebokosc`,
`talia_*`, `biodro_*`, `szyja_promien`, `krocze`, `udo_promien`,
`kolano_promien`, `lydka_promien`, `kostka_promien`.

- **Wariant postaci** (inna waga, muskulatura, sylwetka żeńska) robi się
  ruszając KOTWICĘ w `PROPORCJE` — cała grupa skaluje się zachowując
  wyrzeźbiony kształt.
- **Mnożniki to dorobek kilkunastu rund rzeźbienia.** Rusza się je tylko wtedy,
  gdy zmienia się KSZTAŁT, nie rozmiar.
- ⚠ **Nie każdy klucz `PROPORCJE` steruje czymkolwiek.** `masa_kg` i
  `bark_polszerokosc` są **opisowe celowo** i mają to napisane przy sobie.
  Obrys naramiennika powstaje z `bark_polrozstaw` + `ramie_promien`, nie
  z `bark_polszerokosc`. Do 2026-09-20 **czternaście** kluczy było martwych po
  cichu — objaw był podstępny: „poszerzam klatkę i nic się nie dzieje".
- ⚠ Wysokości (`z(...)`) i wsunięcia w X **zostają literałami** — to przebieg
  kończyny, nie oś typu ciała.

### Cykl chodu: `char3d_walk.py`, 4 klucze + osobna klatka bezruchu (A2, 2026-09-20)

Akcja `Walk` jest **budowana w całości**, nie łatana. Układ klatek:
`0` kontakt A · `1` przeniesienie A · `2` kontakt B · `3` przeniesienie B ·
`4` domknięcie pętli (== 0) · **`5` poza bezruchu, POZA pętlą**.

- **Parametry chodu mieszkają wyłącznie w `CHOD`** (półkrok, uniesienie,
  bujanie, ustawienie stopy w powietrzu). Liczba wpisana gdzie indziej w tym
  pliku opisuje RIG, nie chód.
- ⚠ **Półkrok i bujanie są ZE SOBĄ związane.** Noga w pozie mijania jest już
  na 99,5% zasięgu, więc dłuższy krok bez głębszego opadu biodra kończy się
  zablokowanym kolanem i stopą, która nie nadąża za celem IK. Generator liczy
  to sam i **odmawia zapisu**, gdy asercja świeci na czerwono.
  ⚠ **Procent zasięgu w kontakcie czyta się z RAPORTU, nie z pamięci** — zależy
  od obu liczb naraz. Stan obowiązujący (półkrok 1,55 · bujanie **0,30**):
  **97,1–98,2%**, kolano 153–159°. Przy bujaniu 0,42 było 94,9–96,1% — czyli
  obniżenie bujania zjada zapas do granicy 100%, mimo że sam półkrok stoi.
- ⚠ **`Bone.005` (korzeń WSZYSTKICH kontrolek IK) musi zostać nieruchomy.**
  Stary cykl podnosił go razem z miednicą, więc stopy jechały w górę z
  biodrem i uniesienie samo się kasowało — objaw: „podbijam liczbę i nic
  z tego nie widać".
- ⚠ **Spoczynek kości stopy to „wzdłuż goleni", nie „płasko".** W kontakcie
  noga stoi ukośnie, więc stopa zostawiona w spoczynku wbija piętę 0,6 j.
  w grunt przy IDEALNIE poprawnej kostce. Poziomuje `_wypoziomuj_stope`.
- ⚠ **Znak pochylenia stopy w powietrzu jest odwrotny, niż podpowiada
  intuicja.** Palce W DÓŁ zjadają prześwit (5,6 px → 3 px w buforze gry);
  w połowie wymachu stopa ma być zgięta grzbietowo.
- ⚠ **Klatka bezruchu jest konieczna, bo w poprawnym cyklu nie ma ani jednej
  klatki z obiema stopami płasko i razem.** Stary, 3-kluczowy cykl taką miał
  tylko dlatego, że był zdegenerowany. Podział klipu na pętlę i pozę robi
  `Character3D.paraKlipow` przez `subclip` — **jeden klip na stan
  wyposażenia**, dwie akcje po stronie silnika.
- ⚠ **Interpolacja w akcji jest LINIOWA, nie Bezier.** Do glTF i tak idzie
  `export_force_sampling`, więc gracz widzi proste między kluczami. Bezier
  w podglądzie schodził palcami 0,35 j. pod podłogę, czego w grze nie było
  wcale — czyli oceniało się co innego niż to, co idzie na ekran.
- ⚠ **`KLATKI` czyta się z `char3d_walk`**, nigdy nie przepisuje: ten sam
  układ musi znać `char3d_chod`, `char3d_export_gltf` i `Character3D.ts`.
- ⚠⚠ **Przymiar MUSI jawnie ustawić klatkę przed renderem.** `apply_zones()`
  robi `frame_set(1)`, bo potrzebuje zdefiniowanej pozy do stref głowy —
  a do A2 klatka 1 BYŁA pozą stojącą, więc arkusz `nowy_*` trafiał w nią
  przypadkiem. Po A2 poza stojąca to `BEZRUCH` (5), a klatka 1 to
  `przeniesienie A`: nogi w rozkroku, jedna stopa w górze. **Arkusz po cichu
  przestał pokazywać sylwetkę, a zaczął pokazywać pozę chodu**, i żadna liczba
  w raporcie tego nie mówiła. Naprawione w `build_char3d_base.main()`
  (2026-09-20). Każdy nowy skrypt renderujący postać ustawia klatkę sam.

### Przenikanie: ⛔ NIE licz parzystości promienia dla CIENKICH brył

⚠⚠ **Tarcza to cienki dysk i parzystość przecięć promienia na niej NIE
DZIAŁA** — promień biegnący blisko płaszczyzny lica przecina wiele ścian
współpłaszczyznowych i liczba przecięć przestaje cokolwiek znaczyć. Przyrząd
oparty na parzystości raportował ~100 wierzchołków przedramienia „wewnątrz
tarczy" przy tarczy odsuniętej **1,45 j. poza rękę**, przy siatce szczelnej co
do jednej krawędzi. Kosztowało to jedną pełną iterację doboru wartości.

⭐ **Bryłę o znanym kształcie licz wzorem, nie promieniem.** Tarcza jest
dyskiem z konstrukcji (`char3d_shields._krazek`), więc odległość punktu od niej
to walec: `char3d_clearance.odleglosc_od_dysku`. Zero iteracji, zero
przypadków zdegenerowanych.

⚠ Parzystość zostaje dobra dla CIAŁA (bryła gruba, wypukła w przekroju) —
`char3d_sprawdz_tarcze._wewnatrz`. Tam też jednak wymaga samokontroli:
przy włączonym `Solidify` (odwrócony hull konturu) **każdy** punkt czyta się
jako wewnętrzny, a przy siatce połówkowej + Mirror wersja licząca po znaku
normalnej myli środek tułowia z „na zewnątrz".

⭐ **Każdy przyrząd geometryczny ma mieć SAMOKONTROLĘ na przypadkach
o znanej odpowiedzi**, i to co najmniej jeden PASS i jeden FAIL. Wzorzec:
`char3d_clearance.samokontrola` — cztery przypadki, z czego pierwszy
i ostatni identyczne (sprawdzają determinizm i brak przecieku stanu).

### Refaktor generatora wymaga DWÓCH asercji, nie jednej

Przepięcie literałów na parametry (albo dowolna zmiana „nic nie powinno się
zmienić") jest udowodnione dopiero, gdy przejdą obie:

1. **Siatka identyczna.** Zrzuć wszystkie wierzchołki **i wszystkie kości**
   (head+tail, w świecie) do pliku przed i po, porównaj co do wartości.
   Próg 1e-6 j. przy postaci 12,8 j. Samo „wzrost się zgadza" NIE wystarcza —
   raport proporcji przechodzi na zielono przy przestawionym pierścieniu.
   ⚠ Mnożniki zapisuj na **sześć** miejsc po przecinku: przy czterech błąd
   sięga 6e-05 j. i asercja słusznie świeci na czerwono.
2. **Parametr naprawdę działa.** Podbij każdy o 20% i policz, ile wierzchołków
   się ruszyło. Zero = klucz jest martwy, niezależnie od tego, co mówi
   komentarz przy nim.
   ⚠ **Nie sprawdzaj tego mierząc szerokość na jednej wysokości** — pasmo
   łapie sąsiedni pierścień i zdrowy parametr wychodzi „martwy". Złapane
   dwa razy pod rząd przy A4; rozstrzyga dopiero porównanie całego zbioru
   wierzchołków.
   ⚠ **Kontrolki IK porównuj po HEADZIE, nie po ogonie.** Więz IK czyta
   z nich wyłącznie pozycję (`use_rotation=False`), nic ich nie renderuje
   i nic do nich nie jest przypięte, więc ich ogon potrafi przeskoczyć
   o 3,8 j. przy siatce nietkniętej co do 0,0001 j. — czyli dać czerwoną
   asercję bez żadnej treści.
   ⚠ **Próg 1e-6 obowiązuje przy przepinaniu literałów** (ta sama
   arytmetyka). Gdy poza przechodzi przez ITERACYJNY solver, bitowa zgodność
   jest nieosiągalna i próg dobiera się do WIDOCZNOŚCI: 5e-4 j. przy postaci
   12,8 j. to 0,004 piksela w buforze gry.

⚠ `blender` **nie jest w `PATH`**:
`"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"`.

---

## Katalogi generowane (`docs/*.md`, `docs/*.json`)

`katalog_ekwipunku.mjs` i `macierz_walki.mjs` czytają **prawdziwe wartości**
przez esbuild → node, nie parsują tekstu. `katalog_pole.py`, `budynki.json`,
`kafle.json` — analogicznie po stronie grafiki.

⚠ **Nigdy nie edytuj ręcznie liczby w wygenerowanym dokumencie.** Zmień
`GameConfig.ts` i przepuść generator jeszcze raz. `docs/ekwipunek_przedmioty.md`
jest generowany w całości — ręczna poprawka zniknie przy następnym przebiegu i
do tego czasu będzie kłamać.

⚠ **Nowa oś mechaniki wymaga NAUCZENIA generatora.** Rodziny broni musiały
trafić do `katalog_ekwipunku.mjs`, inaczej kolumna DPS zaniżałaby topory i
katalog zacząłby po cichu zmyślać. Ta sama reguła dla nowego materiału pancerza
(`MAT_PL` + lista kompletów) — bez tego tabela wypisze surowy angielski klucz
obok trzech polskich.

⚠ **Generator liczący cokolwiek równolegle do gry musi sprawdzać SAM SIEBIE**
przeciwko liczbie zapisanej w dokumentacji (53,3% / 35,1% dla redukcji) —
wzory lustrzane rozjeżdżają się cicho.

---

## Grafika: paleta, tło, kontur

**`snap_paleta.py`** sprowadza gotowy rekwizyt (PNG z alfą) do wspólnej rampy
świata. Przeczytaj jego nagłówek przed użyciem — cała trudność jest tam opisana.

⚠ **Zbiór ramp jest RESTRYKCYJNY, bo przy snapowaniu do najbliższego sąsiada
CAŁA KATEGORIA KOLORU potrafi zniknąć** (najbliższy sąsiad leży w obcej rampie).
Rdzeń ognia mapował się na `piasek`, jasne piksele uciekały w prawie-biel z
`neutralne`. Wyjątek dopisuje się jako **jeden jawny kolor**, nie przez otwarcie
całej rampy.

⭐⭐ **DREWNO EKWIPUNKU MA WŁASNY, WSPÓLNY STANDARD: `tools/wood_palette.py`.**
23 kolory (rampa 10 stopni + słój na stopniach 3-8 + kontur) na tarcze,
rękojeści, trzonki, styliska, drzewce, łuki, skrzynie i beczki. **Importuj go,
nie wpisuj własnych brązów** — inaczej każdy generator dorobi sobie mikro-paletę
i gracz przestanie widzieć jeden materiał. Plik uruchomiony wprost drukuje
paletę i sprawdza swoje niezmienniki (monotoniczność, skok jasności, zapas
konturu). ⚠ Amplitudy cieniowania w generatorach liczy się w SZCZEBLACH tej
rampy, więc zmiana jej gęstości wymaga przeliczenia ich wszystkich.

⚠ **Paleta świata NIE obowiązuje IKON PRZEDMIOTÓW — sprawdzone i odrzucone.**
Chleb po snapie wyszedł błotnisty (`ziemia` wchłonęła 10600 z 13800 px), ale
prawdziwy powód jest szerszy: `items.png`, źródło 19 z 20 ikon, **sam nie jest w
palecie** (48% pikseli dalej niż 30). Reguła: **rekwizyt stojący obok trawy idzie
przez snap, ikona leżąca w panelu ma pasować do `items.png`.**

⚠ **Zdejmowanie zielonego tła „na oko" zjada jasnozielone ubrania.** Luźna
heurystyka nasycenia (`g>140 & g>r+30 & g>b+30`) skasowała Dobrawie całą spódnicę
jako tło — i **nie widać tego w histogramie wyciętego obrazka**, tylko w próbce
surowych pikseli w miejscu, które wygląda na czystą biel. Używaj ciasnego progu
odległości euklidesowej od dokładnego koloru tła, a każdy pastelowy zielony lub
żółty strój sprawdzaj próbką surowych pikseli.

⭐⭐ **Kontur ikon: 4-SĄSIEDNI** (dylatacja bez przekątnych) — broń od 2026-10-02,
pancerz i tarcze wcześniej. 8-sąsiedni kładzie na ukośnych krawędziach podwójny
ciemny pas (~1,7 px konturu na piksel obwodu). Mikrodziury, które on zalewał,
zatyka się konturem (≤ 2 px), nie powrotem do 8.

⭐⭐ **Każda ikona przedmiotu jest WYŚRODKOWANA w swoim polu** (decyzja autora
2026-10-02). Generator ikon kończy na `icon_center.wysrodkuj` + `bledy_srodka`
— przesunięcie całkowite, więc kontrole kształtu (SHA1, długość) robi się
PRZED nim. ⛔ Nie kotwicz broni w rogu kafla — to był relikt rigu 2D.

⚠ **Kolejność przy ikonach: kwantyzacja WNĘTRZA najpierw, kontur na końcu.**
Odwrotnie median-cut skleja czerń z najciemniejszym tonem wnętrza i obwódka
znika tam, gdzie jest najcieńsza. Pierwsza wersja `build_ikony_jedzenia.py`
zgubiła w ten sposób kontur jajka.

⚠ **Przy bryłce ~13×15 px taniej NARYSOWAĆ niż odzyskiwać z downscalu.** Próba
zachowania rysunku ze źródła (box → kwantyzacja → remapowanie rang jasności)
dała cieniowanie **odwrócone** — środek ciemny, brzeg jasny — więc jajka czytały
się jak miseczki.

⚠ **Konsola Windows startuje w cp1250 i WYWALA skrypt na `⛔` w RAPORCIE.**
Nie na błędzie danych — na własnym wydruku. `build_ikony_mieczy.py` przerwał się
w ten sposób **po pierwszym z dwóch kafli**, zostawiając robotę w połowie. Każdy
nowy `tools/*.py`, który drukuje znaki spoza latin-2, zaczyna od
`sys.stdout.reconfigure(encoding="utf-8", errors="replace")` — `replace`, a nie
`strict`, bo raport ma dojść zawsze, nawet zniekształcony.

⚠ **Generator piszący w arkusz musi odróżniać „kafel zajęty CUDZĄ grafiką" od
„kafel zajęty własnym poprzednim wynikiem".** Wersja pytająca tylko „czy pusty"
**nie daje się uruchomić drugi raz** — po pierwszym zapisie odmawia pracy nad
własnymi pikselami, czyli łamie idempotencję wymaganą wyżej. Porównuj ZAWARTOŚĆ,
nie samą obecność.

⚠ **Próg w asercji nie może być własnym wynikiem generatora.** Pierwsza wersja
reguły „ikona ma być większa od sąsiadów" miała wpisaną liczbę, którą ten sam
kod rysował — asercja porównywała się ze sobą i **nie potrafiła zaświecić**.
Progiem jest zawsze coś, czego ten generator NIE produkuje (tu: rozmiar tasaka
z `items.png`).

⚠ **Powiększenie musi być CAŁKOWITE; pomniejszenie może nie być.** Skala ułamkowa
rozmywa pixel-art. W dół idziemy płynnie tylko wtedy, gdy inaczej się nie mieści —
rozmyte jest lepsze niż ucięte.

---

## Arkusze: dokładanie kafli

⚠ **Nowe kafle w NOWYCH WIERSZACH, na końcu.** Id to `wiersz*kolumny + kolumna`,
więc dopisanie wiersza nie rusza żadnego istniejącego id, a wstawienie kolumny
przerabia mapę na mozaikę.

⚠ **Kafel wycięty ze WSPÓŁRZĘDNYCH regenerowanego arkusza to współrzędna bez
właściciela.** Ognisko było cięte z `Nature.png` z piksela (132,198); przebudowa
arkusza przesunęła wszystko i ten wycinek stał się fragmentem korony drzewa —
ekstrakcja dalej „działała". Jeśli kod potrzebuje kafla z tych arkuszy, **daj mu
najpierw nazwany wpis w generatorze**, nie współrzędną.

⚠ **Rekwizyt bywa ZŁOŻONY z kilku kafli i to już dwa razy pojechało w połowie.**
Sprawdź w `docs/budynki.json`, ile kafli ma jego rodzina: `stog` 4 (układ 2×2!),
`lawka` 2, `koryto` 1. Sam `stog_0` czyta się dokładnie jako „ćwiartka rekwizytu".

⚠ **Każdy pas rysowany wzdłuż PRZEKĄTNEJ wylewa się poza kafel, który tę
przekątną niesie** — pas szeroki na *w* px wpycha trójkąt w dwa sąsiednie kafle,
a te nic o nim nie wiedzą. Złapane trzykrotnie (cień okapu, gruba krawędź okapu,
wałek kalenicy) i **za każdym razem dopiero na złożonym budynku**. Konsekwencja:
kafle wewnątrz pasa **nie są wymienne**.

⚠ **Test sylwetki nie zastąpi testu wzoru.** Sprawdzenie obrysu zostaje zielone,
gdy pas jest rozbity w środku; wyłapuje to dopiero porównanie każdego piksela z
globalnie policzonym wzorcem (wyłączenie narożnika okapu: sylwetka OK, wzór 234
złe piksele).

---

## Audio (`gen_audio.py`)

⚠ **Nowe dźwięki dopisuj na KOŃCU `SOUNDS`.** Ziarno jest stałe, ale `rng` jest
wspólny i zużywany w kolejności słownika — wstawienie wpisu w środek przesuwa
strumień i **po cichu zmienia każdy plik poniżej**. Sprawdzone: dopisanie
`village-ambient` na końcu zostawiło wszystkie 17 istniejących wavów
bajt-w-bajt identycznymi.

⚠ **Pasmo częstotliwości trzeba ZMIERZYĆ, nie ocenić uchem.** Pierwszy bed to
był biały szum przez filtr jednobiegunowy — **24% energii powyżej 2 kHz**,
zgłoszone jako „ciągły syk jak stary telewizor". Przekorygowanie jest równie
łatwe: brązowy szum przez cztery bieguny dał **86–100% poniżej 120 Hz**, czyli
podźwięk, którego głośnik telefonu nie odtworzy. Cel: <3% powyżej 2 kHz, rdzeń
w 120–1000 Hz.

⚠ **Stała amplituda sama w sobie jest sygnałem „zepsuty sprzęt"**, niezależnie
od widma. Szum na równym poziomie czyta się jako usterka; dopiero narastanie i
opadanie czyta się jako pogoda.

⚠ **Pętla musi być przenikana koniec-w-początek**, inaczej szew klika przy każdym
przejściu.

---

## Portrety NPC: TRZY kroki, trzeci zawodzi po cichu

1. `tools/build_<imie>.py` → PNG w `public/assets/characters/`
2. `ASSETS.<imie>` (klucz + ścieżka) **oraz** `<NPC>.portraitTexture` w konfigu

3. ⚠ **jawna linia `load.image(...)` w `queueImages()`** (`src/core/Assets.ts`)

**`BootScene` NIE ładuje `ASSETS` generycznie** — komentarz twierdzący inaczej był
sam nieprawdziwy. Bez kroku 3 `textures.exists(...)` zwraca po prostu `false`,
NPC dalej renderuje się na wspólnym `NPC.png` z `tint`, a `tsc --noEmit` jest
czysty. Tak przepadli Witek, Sobek, Agata i Dobrawa — do zgłoszenia autora.

⚠ **Nietrafiona ścieżka nie wywala gry** (`Assets.ts` podstawia placeholder), więc
po każdej przeprowadzce plików sprawdź w silniku, że `window.dev.missing` jest
puste i `load.totalFailed` wynosi zero. Przenosząc asset **załataj też `tools/`** —
inaczej generator pisze w starą lokalizację, a gra czyta z nowej.

---

## Mapy: co jeszcze łatwo przeoczyć

⚠ **Więcej PRZEBIEGÓW sadzenia, nie wyższe szanse.** Przy nasyceniu decyduje, ile
razy małe drzewa dostaną szansę wejść w luki po dużych: baza 0,66 → 0,78 dała
670 → 684 drzewa, a jeden przebieg więcej dał 793.

⚠ **Rekwizyt „przy budynku" bez sprawdzenia kafla DRZWI ląduje w progu** — trzy z
siedmiu rekwizytów jednego przebiegu tak wylądowały. Licz drzwi z danych
(`kafle_domu` albo skan `buildings-detale` po id `drzwi*`), nie z offsetu na oko.

⚠ **Ręcznie stemplowane kafle NIE trafiają automatycznie do masek zakazu** —
domieszaj je do `budynki_kafle`/`zakazy` z buforem kafla, inaczej wyrosną na nich
drzewa.

⚠ **Pozycję budynku potwierdzaj skanem żywych warstw `.tmj`**, nie liczbą z
generatora ani z `docs/wioska_plan.md`. „Chata zachód" była przesunięta ręcznie i
pierwszy przebieg rekwizytów użył nieaktualnych współrzędnych.

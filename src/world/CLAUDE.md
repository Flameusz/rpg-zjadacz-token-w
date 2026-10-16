# `src/world/` — mapy Tiled, warstwy, spawny

Reguły dotyczące wczytywania i budowania map. Zawartość konkretnych map (kto
gdzie stoi, co jest zbudowane) → `CLAUDE.md` w korzeniu + `docs/wioska_plan.md`.

⚠ **Ten plik dochodzi automatycznie tylko przy `Read`/`Edit` na plikach z tego
katalogu.** Odczyt bashem niczego nie wstrzykuje — otwórz go wprost.

**Generatory mają własny `tools/CLAUDE.md`** — tam mieszkają reguły przymiaru,
palety, arkuszy i audio. Tutaj zostaje wyłącznie to, co dotyczy MAPY.

---

## Reguła numer jeden: `.tmj` JEST mapą

`tools/build_*.py` to rusztowanie, nie źródło prawdy. Mapa raz tknięta w Tiled
ma w `.tmj` pracę, której generator nie zna — dlatego każdy generator jest
**przymiarem**: drukuje raport i **nie zapisuje nic bez `--zapisz`**.

⚠ **Nie proponuj „synchronizacji" mapy z generatorem.** Kilka rzeczy na mapach
(m.in. młyn w Zagajach, brama wschodnia w lesie, warstwy `rosliny`/`kamienie`/
`znaki`) istnieje **wyłącznie** w `.tmj` — `--zapisz` je skasuje.

⚠ **Pozycję czegokolwiek potwierdzaj skanem żywego `.tmj`, nie liczbą z
dokumentacji ani z generatora.** Budynki i NPC bywały przesuwane w Tiled bez
aktualizacji notatek; korzeniowy `CLAUDE.md` łapał się na tym co najmniej trzy
razy (współrzędne Doroty, „chata zachód").

**Wzorzec zmiany punktowej:** jednorazowy skrypt, który rusza wyłącznie swój
prostokąt, jest idempotentny i **nie zostaje w `tools/`**.

---

## Eksport z Tiled — cztery ustawienia, wszystkie obowiązkowe

**JSON** · **Tile Layer Format = CSV** (base64/zlib daje po cichu pustą mapę —
Phaser nie ma dekompresora) · **Infinite off** · **Embed Tileset** (zewnętrzne
`.tsx` są odrzucane).

⚠ **Mapa bez warstwy obiektów traci cały roster CICHO.** Bez obiektu `player`
spawn szuka się skanem, a bez warstwy obiektów w ogóle lista wrogów spada na
`defaultEnemySpawns`. Ponowny eksport bez tej warstwy wygląda więc jak „mapa
działa, tylko gra jest pusta". **Sprawdź, czy warstwa przeżyła eksport, zanim
zaczniesz debugować cokolwiek innego.**

⭐ **Po każdej zmianie mapy w Tiled: `dev.mapWarnings()` ma być puste**
(2026-10-11) — zbiera ostrzeżenia ostatnio zbudowanej mapy: nieznany tileset,
nierozpoznana nazwa obiektu, brama bez `target`, pusta warstwa, duplikat
tilesetu ponad liczbę map członkowskich świata. Obok `dev.missing()`
i `dev.failed()` — trzecia liczba, bo konsoli po zmianie mapy nikt nie czyta.

⚠ **Pusta lista wrogów to NIE ta awaria — rozróżnia je `hasObjectLayer`.**
„Ta mapa celowo nie ma wrogów" i „tej mapie wyparowała warstwa obiektów"
przychodzą jako to samo puste `enemySpawns`, a siatka bezpieczeństwa jest
napisana tylko pod to drugie. Mapa, która zadeklarowała jakiekolwiek obiekty,
jest brana za słowo. **To był prawdziwy błąd**: wioska nie ma wrogów, więc
siatka wystrzeliła i rozsypała trzy króliki wokół punktu startu gracza —
czyli dzikie zwierzęta pod drzwiami Sołtysa. Ta sama reguła rządzi ogniskiem.

---

## Tilesety: łączy NAZWA, nie ścieżka

`TILESET_TEXTURES` mapuje nazwę tilesetu **wewnątrz pliku Tiled** na klucz
tekstury, pod którym ją wczytaliśmy. Trzy konsekwencje, każda już raz bolała:

- **Zmiana nazwy w Tiled = kafle przestają się rysować**, dopóki tabela nie
  zostanie zaktualizowana.
- **Nieznany albo niewczytany tileset jest POMIJANY, nie fatalny** — mapa buduje
  się bez tych kafli, z ostrzeżeniem w konsoli. Obowiązkowy jest wyłącznie
  `MAPS.requiredTilesetName`: mapa bez rekwizytów to łąka, po której da się
  chodzić, mapa bez gruntu to nic.
- ⚠ **Kolizja jest kluczowana `nazwaTilesetu#localId`, nie samym localId.**
  Przy dwóch różnych arkuszach same localId się zderzają (kafel 16 z `Teren` i
  16 z `Nature` to inne obrazki) i skrzynia kolizji drzewa zaczęłaby po cichu
  blokować drzwi.

⚠ **Rejestruj nowy arkusz pod OBIEMA nazwami** (np. `Pole` i `pole_tileset`).
Tiled nazywa nowy tileset od pliku obrazu, a niezgodność nazw to dokładnie ta
cicha awaria. Ta sama zasada co przy polskich/angielskich nazwach obiektów.

⚠ **Nowe kafle dokłada się w NOWYCH WIERSZACH, na końcu arkusza.** Id to
`wiersz*kolumny + kolumna`, więc dopisanie wiersza nie rusza żadnego istniejącego
id, a wstawienie kolumny przerobi mapę na mozaikę. Z tego samego powodu nowy
tileset dopina się na KOŃCU listy — wstawienie w środek przenumeruje wszystko po
nim.

---

## Warstwy: jedna na rodzaj rzeczy

Wszystko zielone na jednej warstwie jest nieutrzymywalne — poprawka jednego
drzewa w gąszczu oznacza wycinanie go spod kęp trawy.

⚠ **Nazwa kończąca się na `-over` dostaje `DEPTH.overhead`** i to jedyny sposób,
żeby dało się przejść ZA rekwizytem. Warstwa kafli rysuje się jednym wsadem i
nie potrafi sortować po Y per kafel.

⚠ **Dolny rząd rekwizytu musi zostać pod spodem**, inaczej korona zasłoni gracza
stojącego PRZED drzewem. Stempel całego drzewa w Tiled ląduje na JEDNEJ
warstwie — przenieś jego dolny rząd do `trees-base` ręcznie.

⚠ **Budynki dzieli LINIA LICZONA, nie „dolny rząd".** Ściana ma dwa kafle
wysokości, więc reguła drzewa schowałaby gracza za jego własnym domem.

⚠ **Kolizja jest SPŁASZCZANA między warstwami**: o przechodniości komórki
decyduje **najwyższy niepusty** kafel — ale kafel korony domalowany nad litym
pniem czyni tę komórkę z powrotem przechodnią.
⭐ **Wyjątek jest jeden i jawny: obiekt `kladka` OTWIERA komórki pod sobą**
(`TiledMap.komorkiKladek`, 2026-10-11). Do tej daty przejście dawały kafle `path`
położone na wodzie, a te rysowały pod mostkiem pas gołej ziemi (zrzut autora).
⛔ Nie kładź ścieżki na wodzie pod nową kładką.

---

## Spawny i obiekty punktowe

Nazwa obiektu → typ, przez tabele: `NPC_OBJECT_NAMES`, `FARM_ANIMAL_OBJECT_NAMES`,
`DECOR_BY_OBJECT_NAME` (**wyprowadzana** z `DECOR_PROPS`, nigdy drugi ręczny
literał). Wszystkie przyjmują pisownię **angielską i polską**, bo mapy są
autorowane po polsku, a id są angielskie.

⚠ **Nierozpoznana nazwa OSTRZEGA.** Kiedyś spadała cicho z końca pętli — do
przeżycia przy 18 obiektach, nie do przeżycia przy pięćdziesięciu ręcznie
wpisanych polskich nazwach ziół. Obiekty **bez nazwy** milczą celowo (to kształty
rysowane na własny użytek).

⚠ **`anna` i `hanna` różnią się jedną literą i obie są prawdziwe.** Literówka nie
da ostrzeżenia „nieznana nazwa" — da po cichu nie tę postać.

⭐ **`miejsce` (2026-10-12) — punkt celu zadania `reach`**: właściwość `id`
wiąże go z `QUESTS[*].objectives[].spot` (`TiledMap.questSpots`). Pies `kirci`
jest **zwierzęciem z imieniem** (`NAMED_ANIMAL_OBJECTS`), nie pulą psów — jego
obecność zależy od zadania (`scenes/QuestSpots.ts`).

⚠ **Dodanie NPC to KONFIG + PUNKT, i tak ma zostać.** Kiedyś były to cztery
edycje w trzech plikach, z których żadna nie krzyczała przy pominięciu.

**`DECOR_PROPS` jest wyłącznie dla STATYCZNYCH OBRAZKÓW.** Cokolwiek ma
zachowanie (`Bird`, `FarmAnimal`, `Critter`, `Well` z kolizją) ma własną ścieżkę.
Rekwizyt, któremu urośnie zachowanie, **wychodzi z tabeli, a nie dostaje w niej
flagi**.

⚠ **Odległości spawnów są NOŚNE, nie dekoracyjne** — trzymają je asercje w
`tools/build_mapa.py` (wołanie howlu, dystans elity od sfory, rozdział zasięgów
interakcji dla klawisza `E`). Ręczne przesunięcie w Tiled łamie je **cicho**;
przebiegnij raport generatora po każdej takiej zmianie.

---

## Budynki: OBIEKT w warstwie `budynki`, nie kafle (od 2026-10-09)

Budynek to prostokąt `budynek` w warstwie obiektów `budynki`, **na siatce
kafli**, z właściwościami (`typ`, `dach`, `sciany`, `obrot`, `drzwi`, `okna`,
`komin`, `klapa`, `okno_szczyt`, `otwor` — pełny opis w nagłówku
`tools/houses3d.py`). Mapa ma właściwość `prefiks3d`; model 3D nazywa się
`dom-<prefiks3d>-<id obiektu>`.

- ⚠ **Nowy albo przerysowany obiekt = NOWE id = brak modelu**, dopóki nie
  przejdzie `tools/houses3d.py --zapisz`. Silnik ostrzega w konsoli
  („brak modelu"), kolizja działa i bez modelu.
- ⚠ **Prostokąt jest lity w CAŁOŚCI** — także narożniki przy trójkącie
  szczytu, które jako kafle były przejściowe. Przy migracji 2026-10-09 zioło
  (rumianek 45,43) wylądowało w środku chałupy — po każdej zmianie obrysu
  sprawdź, czy żaden punkt z `objects`/`rosliny` nie leży w prostokącie.
- ⚠ **Przesuwając budynek-obiekt, przesuń albo usuń jego KAFLE** — ich
  kolizja `solid` (K3) nie wie o obiekcie i zostałaby w starym miejscu jako
  niewidzialna ściana.
- Skrzydła L/T/U = dwa nakładające się obiekty; dachy przenikają się w 3D.
- ⭐⭐ **Po każdej zmianie zabudowy wsi: `python tools/wies_przechodniosc.py`**
  (przymiar, kod wyjścia 1 przy błędzie). Mieszkańcy będą SYMULOWAĆ zajęcia
  i chodzić między budynkami (autor 2026-10-10), więc kafel przed KAŻDYMI
  drzwiami musi mieć drogę do placu, a wrota/furtki — obie strony. Pierwszy
  przebieg na K2 złapał pięć ślepych drzwi: płot frontowy przed drzwiami
  chałupy, warsztat odgrodzony od placu, skład frontem do płotu, furtki
  w ścianę stodoły i młyn z drzwiami od wody (stan sprzed K2).
  ⚠ Front domu liczy się z `obrot` + przesunięcia w `drzwi` — płot frontowy
  OMIJA front chałupy, inaczej drzwi wychodzą w płot.
  ⚠ Woda blokuje w przymiarze tak jak w silniku — po NAJWYŻSZYM kafelku
  komórki; komórki pod obiektem `kladka` są przechodnie (jak w silniku), a osobna
  część pilnuje, że **oba końce kładki** są osiągalne z placu.
  ⚠ **Pieszy test przepuszcza szczelinę 1 kafla** — dlatego osobna część
  sprawdza PRZEJAZD WOZU (wrota ≥ 3 kafle: korytarz 3 kafli z obu stron).
  Przybudówka przy froncie łatwo zastawia przejazd od wrót.
  ⚠ **Oba końce wrót muszą stykać się z płotem albo ścianą** (K6, 2026-10-11).
  Wrota o kafel obok linii zabudowy wyglądają jak „furtka w powietrzu" i zostawiają
  podwórze otwarte szczeliną. Przymiar to sprawdza i świeci na czerwono.
- ⚠ **Podwórze to TRAWA z wydeptanymi ścieżkami, nie plama `path`** (K6,
  zrzut autora 2026-10-11). Klepisko leży tylko na trasach wrota → drzwi
  i drzwi ↔ drzwi, przed wejściami i na placu przy trakcie i studni. Ścieżka idzie
  na przełaj, po skosie. Proste odcinki pod kątem prostym tną trawę na trawniki jak
  w parku. Wyjątki świadome: podwórze kuźni i warsztat Sobka.
- ⚠ **Płot nie stoi obok płotu.** Sąsiednia zagroda (kuźnia pod obwodem wsi,
  obwód pod żerdziami chmielnika) używa WSPÓLNEJ linii płotu — dwa równoległe
  płoty w odstępie 1 kafla robią wnękę (zrzut autora 2026-10-10).
- ⚠ **Narożnik płotów: oba odcinki obejmują kafel narożny i cofają się o 0,5**
  (`skroc_l` / `skroc_p` w `tools/houses3d.py`; dla `obrot 90` „lewo" = południe).
  Pal płotu stoi na KRAWĘDZI prostokąta, a płot prostopadły w OSI swojego kafla —
  bez cofnięcia w każdym rogu zostaje pół kafla szczeliny.
- ⚠ **Dach modelu 3D sięga wyżej niż obrys** — budynki sąsiednich zagród
  potrzebują 2–3 kafli odstępu, inaczej z kamery 40° zlewają się w jeden blok.
- ⭐ **Płot to też obiekt** (`plot` — plecionka, `zerdzie`, `wrota` z
  `kolizja=false`), odcinek ≤ 10 kafli, grubość 1 kafla; pionowy = `obrot 90`.
  ⛔ We wsi nie stawiaj `palisada` — to szczebel grodu.
- ⭐ **Sprzęt zagród też jest obiektem `budynki`** (K5, 2026-10-10): `woz`,
  `stragan`, `kozel`, `snopki`, `kladka` — bo potrzebuje OBROTU i (poza kładką)
  KOLIZJI, a rekwizyt `DECOR_PROPS` nie ma żadnego z nich i wymaga obrazka 2D.
  Przymiar przechodniości liczy go jako przeszkodę, ale nie sprawdza mu drzwi.
  ⚠ Rząd wzdłuż osi patrzenia kamery (N–S) zlewa się w jeden słupek — snopki
  stawiaj rzędem W–E.

---

## Otwarty świat: plik `.world` + `WorldComposer` (od 2026-10-09)

Wieś i las leżą obok siebie w `public/assets/maps/swiat.world` (edytowalnym
w Tiled jako jeden teren) i są **sklejane przy starcie w jedną mapę**
(`SWIAT` w `GameConfig`, klucz `map-swiat`). Gęstwina zostaje osobna.

- ⚠ **Przesunięcia map muszą leżeć na siatce kafli** i dawać ciągłą drogę
  przez szew — trakt wsi (x62–63) trafia w drogę lasu (x60–63), a młynówka
  (x15–17) w koryto wycięte w lesie. Przestawiając mapę w `.world`, sprawdź
  szew chodem i wodą.
- ⚠ **Portal, którego `target` jest mapą świata, ZNIKA** przy sklejaniu —
  przejście jest płynne. Portal do mapy spoza świata (Gęstwina) zostaje, a
  jego punkt lądowania podaje się we współrzędnych MAPY CZŁONKOWSKIEJ
  (`GameScene.init` dolicza przesunięcie).
- ⚠ **Budynek w świecie bierze nazwę modelu z właściwości `model`**
  (stare id), bo id obiektów są przenumerowane.
- Pola świata bez mapy → warstwa `pustka` (lita, pomijana przy spawnach).
- ⚠ **`mapId` sceny to wtedy `swiat`** — o wieś/las pytaj
  `WorldState.region`, nie `mapId`.

---

## Portale

⚠ **Współrzędne bram NIE są duplikowane — obie mapy importują `tools/portale.py`.**
Portal potrzebuje tych samych liczb po obu stronach, a dwie niezależne kopie
rozjeżdżają się przy pierwszej zmianie układu którejkolwiek mapy. **Poszerzenie
bramy robi się TAM, na obu mapach naraz** — nigdy przez dostawienie drugiego
obiektu obok pierwszego (raz już tak powstał piąty, sierocy portal).

⚠ **Brama pozioma i pionowa to DWIE funkcje, nie flaga** (`piksele_brama()` /
`piksele_brama_pozioma()`). Przy krawędzi poziomej szerokość przejścia leży na
osi X, przy pionowej na Y. Użycie nie tej zostawia kilkanaście pikseli przejścia
poza zasięgiem wyzwalania — **awaria jest CICHA**: brama działa, tylko czasem
gracz „przechodzi obok" bramy, którą widzi.

⚠ **Brama stoi na SZWIE między kaflami** (centralna oś drogi), nie w środku
kafla, i promień wyzwalania musi pokryć **całą szerokość drogi**. Obie liczby
zakładają PARZYSTĄ szerokość drogi.

⚠ **Punkt lądowania leży poza promieniem wyzwalania bramy po TAMTEJ stronie** —
inaczej odbija z powrotem.

⚠ **Brama na skrajnym kaflu świata nie działa** — gracz nie może stanąć na nim
środkiem ciała, więc połowa promienia byłaby poza mapą. Kafel do wewnątrz.

Ikona wejścia rysuje się **z samego obiektu `portal`**, więc nowa brama dostaje
ją za darmo i nie da się jej zapomnieć. Kierunek bierze się z najbliższej
krawędzi mapy — poprawnie dla bramy przy drodze wychodzącej z mapy, błędnie dla
pierwszych drzwi w głębi lądu; stąd opcjonalna właściwość `dir`, której
nierozpoznana wartość **wraca do wyprowadzenia zamiast rzucać** (literówka w
Tiled ma kosztować złą strzałkę, nie mapę, która się nie wczyta).

---

## Generatory map → `tools/CLAUDE.md`

Reguły przymiaru (`--zapisz`), palety, arkuszy kafli i audio mieszkają tam, żeby
nie stały w dwóch miejscach naraz — ten projekt zmierzył już, że **dwa
streszczenia tego samego rozjeżdżają się niezależnie, a diff tego nie widzi**.

⚠ **Zagnieżdżony `CLAUDE.md` działa per KATALOG, więc praca w `tools/` nie
dociąga tego pliku ani odwrotnie.** Zmieniając generator mapy trzymaj przy sobie
oba: tamten mówi, kiedy wolno zapisać, ten — co zapisany plik musi spełniać.

Trzy reguły mapowe, które najczęściej łamią się właśnie w generatorze, są opisane
wyżej w tym pliku i tam zostają: odległości spawnów (asercje), maski zakazu dla
ręcznie stemplowanych kafli i sieroty po wycinaniu przesmyku.

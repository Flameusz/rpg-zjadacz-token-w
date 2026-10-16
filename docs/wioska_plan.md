---
typ: KANON
domena: world
tytul: Zagaje — plan wsi na 30 dusz
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-08
---

> ⚠⚠ **UKŁAD WSI ZMIENIONY 2026-10-09 — Zagaje są OWALNICĄ 128×128**
> (`docs/decyzje/2026-10-09-owalnica-zagajow.md`). Rozkład, strefy,
> współrzędne i palisada w §4 opisują **poprzedni** układ 100×100.
> ⛔ **Wieś nie ma palisady** (płot; palisada = gród). W mocy zostają:
> obsada (§6), ekonomia (§3), zasada częstotliwości (§4.1) i obejścia.


# Zagaje — plan wsi na 30 dusz

> **Czym jest ten plik.** Projekt wsi: kto tu mieszka, z czego żyje, co
> posiada i gdzie to stoi. Warstwa między `docs/swiat.md` (fabuła, ton,
> obsada w zarysie) a `CLAUDE.md` (kod) — to, czego brakowało, żeby dało się
> podjąć decyzje o **kaflach i kodzie**, zamiast zgadywać.
>
> **Czego tu nie ma i celowo nie będzie na tym etapie:** kodu, grafiki,
> edycji `.tmj`. To jest dokument do sporu, nie do wykonania. Kiedy zarys
> się ustabilizuje, sekcje 7 i 8 są gotowymi listami zakupów.
>
> Iterujemy po tym pliku wg protokołu z `docs/prompt_wioska.md`.

---

## 0. Zasada nadrzędna tego planu

> **Wieś ma być zrozumiała, nie kompletna.**

Trzydziestu ludzi nie da się zagrać trzydziestoma sprite'ami z dialogami — i
nie trzeba. Gracz nie liczy mieszkańców, tylko sprawdza, **czy to, co widzi,
trzyma się kupy**: czy stodoła stoi przy polu, czy jest gdzie trzymać te
krowy, czy ktoś tu w ogóle rąbie drewno.

Z tego wynika cała reszta: projektujemy **10 obejść**, nie 30 postaci.
Obejście to gospodarstwo domowe — dom, jego zabudowa, jego ziemia, jego
zwierzęta, jego ludzie. Człowiek, którego nie widać, ale którego pole,
kurnik i sznur z praniem widać, **istnieje** dla gracza tak samo jak ten,
który stoi i mówi.

---

## 1. Stan zastany — zmierzony, nie pamiętany

Wszystko poniżej odczytane z plików dzisiaj (`village-zagaje.tmj`,
`tools/build_wioska.py --raport`, `GameConfig.ts`).

| fakt | wartość |
|---|---|
| rozmiar mapy | **100 × 100 kafli** = 3200 × 3200 px |
| brama do lasu | kafel (50, 98), południowa krawędź |
| punkt lądowania gracza | kafel (50, 93) |
| droga | kolumny 50–51, od y=20 do południowej krawędzi |
| plac | x 44–56, y 57–63 |
| budynki | **12** (9 z generatora + chałupy Zofii, Doroty i Gniewka z owczarnią, dostawione ręcznie 2026-08-10) |
| kafle pól | `pola` 595 + `uprawy` 492 — trzy niwy trójpolówki (E1) |
| pokrycie ścieżką / drzewami | 3,1 % / 5,5 % |
| kafle kolizji | **0** (poza kręgiem studni w `Well.ts`) — 12 budynków, przez każdy da się przejść; to następne zadanie, K3 |
| prędkość gracza | 150 px/s → **przebiegnięcie mapy N–S ≈ 21 s** |
| brama → plac | 38 kafli = 1216 px ≈ **8,1 s** |
| zoom kamery | ×2 → na telefonie 375 px widać **≈ 5,9 kafla szerokości** |

### 1.1 Budynki, które już stoją

> ⚠⚠ **2026-10-09: budynki są OBIEKTAMI** (warstwa `budynki`) i zachód wsi
> został rozstawiony pod 3D — stodoła, kurnik, obora, dom L i chałupa Dobka
> stoją gdzie indziej niż w tabelach niżej (`docs/dziennik.md` 2026-10-09 (13)).
> Pozycję czytaj z warstwy `budynki` w `.tmj`.

⚠ **Współrzędne poniżej są z generatora i dla ośmiu budynków wciąż się
zgadzają z `.tmj` — ALE NIE dla „chaty zachód" (patrz (d) niżej).** Przed
stawianiem czegokolwiek przy budynku sprawdź jego PRAWDZIWĄ pozycję w
`.tmj` (skanując warstwy `buildings`/`buildings-detale`), nie ufaj tej
tabeli w ciemno — to jest dokładnie ten błąd, który kosztował dwie
poprawki pod rząd 2026-08-10.

| budynek w generatorze | x | y | komu go przypisujemy (sekcja 5) |
|---|---|---|---|
| „chałupa Dobka" (dawniej „dom gracza") | 30–37 | 45–53 | **Dobek** — ✅ rozstrzygnięte i zastosowane (patrz (b)) |
| stodoła | 18–27 | 45–55 | Dobek |
| kurnik | 18–23 | 56–62 | Dobek |
| obora | 16–23 | 66–74 | Zofia |
| chata zachód | ⚠ **NIE 22–27/79–85 — patrz (d), realnie ok. 10–15/83–89** | | **obejście Marka (dom gracza)** — ✅ rozstrzygnięte, ⚠ ale przesunięte w Tiled po rozstrzygnięciu |
| chata wschód 1 | 58–63 | 45–51 | Sobek Stolarz |
| sołtys | 58–65 | 60–68 | Dobiesław |
| chata wschód 2 | 60–65 | 76–82 | Witek |
| kuźnia + podwórze | 34–39 | 54–67 | Radzim Kowal |

Trzy budynki **nie pochodzą z generatora** — dostawione ręcznie 2026-08-10
skryptem append-only, więc `build_wioska.py` o nich nie wie (to normalny stan,
patrz (a) niżej). Ich współrzędne są PRAWDZIWE, odczytane z `.tmj`:

| budynek | x | y | czyje |
|---|---|---|---|
| chałupa Zofii | 26–31 | 68–74 | **Zofia** — dostawiona do jej obory |
| chata Doroty | 82–87 | 78–84 | **Dorota Zielarka** — wschodnia flanka, przy lesie (D-3) |
| chałupa Gniewka | 17–22 | 19–25 | **Gniewko Pasterz** |
| owczarnia (otwarta wiata) | 26–33 | 19–24 | Gniewko — osobny budynek obok chałupy, **nie przybudówka** (§7.3b) |

### 1.2 Trzy rzeczy, które trzeba wiedzieć, zanim się cokolwiek ruszy

**(a) Mapa jest w Tiled i to ona jest mapą. Generator jest rusztowaniem.**

Plik `.tmj` ma dziś (2026-08-11) **392** kafle warstwy `buildings`, 75
`buildings-detale`, 15 `wyposazenie`, 546 drzew, **595 `pola` + 492 `uprawy`**
oraz **całą warstwę `uprawy`, której generator nie tworzy**, a do tego
obiekty, o których nie wie (`studnia`, 16 punktów NPC, 56 stanowisk ziół).
`build_wioska.py` liczy 294 / 13 / 467 i nie zna niczego z powyższych.
Rozjazd rośnie z każdą ręczną poprawką i **to jest oczekiwane**.

To **nie jest rozjazd do naprawienia** — to normalny stan. Mapy robimy w
Tiled właśnie po to, żeby dało się je edytować ręcznie; generator postawił
rusztowanie i od pierwszego ludzkiego dotknięcia mapy jest z definicji
nieaktualny. Ponowne `--zapisz` nie byłoby „synchronizacją", tylko
cofnięciem pracy.

| | generator | Tiled (`.tmj`) |
|---|---|---|
| 10 000 kafli podłoża, blob-47, pole gęstości drzew | ✅ | ❌ nikt tego nie klika |
| przesunięcie budynku, postawienie studni, spawn NPC | ❌ | ✅ |
| **ocena, czy to dobra wieś** | ❌ nigdy | ✅ jedyne miejsce |

**Co generatorowi zostaje na stałe:** *przymiar*. Uruchomiony bez `--zapisz`
niczego nie rusza, a sprawdza kolizje budynków, czy brama leży na ścieżce i
pokrycie terenu — a w lesie asercje odległości spawnów (wilki 115/132/133 px,
Szary 296 px, ognisko 119 px od Myśliwego). To jest jedyna rzecz, która łapie
ręczną edycję psującą mechanikę, i warto ją zachować — odciętą od pisania po
mapie.

⚠ **Ryzyko, które zostaje:** `--zapisz` w obu generatorach nadpisuje `.tmj`
bezwarunkowo. Dziś ratuje git (praca zacommitowana w `81cdceb`), ale tylko
dopóki ktoś zauważy przed kolejnym commitem. Patrz K10.

→ Konsekwencja projektowa: **planujemy przez dokładanie, nie przez
przestawianie.** Każdy istniejący budynek dostaje właściciela tam, gdzie
stoi. Ruszamy jedną rzecz (patrz (b)) i tylko dlatego, że jest sprzeczna.

**(b) Dom gracza był w dwóch miejscach naraz — ✅ ROZSTRZYGNIĘTE I
ZASTOSOWANE (2026-08-10).** Budynek nazwany w generatorze „dom gracza"
stał na (30–37, 45–53) bez nikogo przy nim; Ojciec i Matka stali przy
„chacie zachód" (22–27, 79–85). **Wygrała pozycja rodziców**: domem
gracza jest chata zachód (mała, 6 kafli — rodzina bohatera ma być
najbiedniejsza z rolniczych, nie mieszkać w największej chałupie), budynek
30–37 przejął Dobek. To już nie jest tylko decyzja na papierze — Peasant
(Dobek) i Hanna stoją dziś w Tiled przy 30–37/45–53, generator nazywa ten
budynek `"chalupa Dobka"` (D-5).

**(c) ⚠ NOWE (2026-08-10): „chata zachód" sama zmieniła miejsce w Tiled, PO
tym jak (b) zostało napisane — i generator o tym nie wie.** Rozstrzygnięcie
(b) zakładało budynek na (22–27, 79–85). Ktoś odtąd przesunął go ręcznie w
Tiled na ok. (10–15, 83–89) — mierzone bezpośrednio ze skanu warstw
`buildings`/`buildings-detale` tego `.tmj`, drzwi realnie na (13, 88)-(13, 89).
**To jest DOKŁADNIE ten błąd, przed którym ostrzega (a)**, tylko złapany z
opóźnieniem: praca oparta na starych współrzędnych (22–27/79–85) ustawiła
Ojca/Matkę/ławkę w polu, kilkanaście kafli od prawdziwych drzwi, zanim
zauważono to na zrzucie ekranu i poprawiono. Nowa, prawdziwa pozycja leży
**bardzo blisko Doroty Zielarki** (13,6/92) — mniej niż 4 kafle w linii
prostej — więc każde kolejne stawianie czegokolwiek tutaj MUSI liczyć
odległość od niej (O1, >96px), nie tylko od samego budynku. Ojciec dziś
stoi na (9,90) — 139px od Doroty, Matka na (17,90) — 136px, ławka na
(5-6,90) — 282px. **Nauka na przyszłość: przy KAŻDYM budynku w tym
dokumencie sprawdź jego realną pozycję w `.tmj` przed pracą — ta tabela
(1.1) i schemat (4.2) to punkt startowy, nie źródło prawdy.**

**(d) Geografia jest odwrócona względem `swiat.md` i tak zostaje** (ten
punkt nosił literę (c) przed dopisaniem (c) powyżej 2026-08-10 — jeśli coś
jeszcze linkuje do „§1.2c", ma teraz na myśli to miejsce).
Dokument świata opisuje wieś na **południe** od lasu (rzeka i młyn na
południu). Mapa stoi na **północ**. Ten plan przyjmuje układ mapy i
przepisuje geografię pod niego — patrz sekcja 4. ✅ `swiat.md` poprawiony
2026-10-09 (kierunki w układzie mapy; trakt do miasta za rzeką, na południu).

---

## 2. Siedem ograniczeń, które rządzą tym planem

Każde z nich jest zmierzone albo wynika wprost z istniejącej mechaniki. To
nie są preferencje — to warunki brzegowe zadania.

| # | ograniczenie | skąd | co z niego wynika |
|---|---|---|---|
| **O1** | dwóch NPC musi dzielić **> 96 px** (2 × `interactRange` 48) | `GameConfig`, zweryfikowane przy Kowalu | 30 NPC na jednym placu jest fizycznie niemożliwe; ludzie muszą być rozrzuceni po obejściach |
| **O2** | na telefonie widać **≈ 6 × 13 kafli** | zoom ×2, 375 px | budynek 8-kaflowy nie mieści się w kadrze; **czytelność robi się po pionie** (ruch N–S), nie po szerokości |
| **O3** | wieś ma być **przebiegana, nie zwiedzana** | `swiat.md` | podatek od powrotu z lasu płaci się tylko wtedy, gdy sklep leży głęboko — patrz D-1 |
| **O4** | **rekwizyt charakteryzuje taniej niż sprite** | podwórze kowala | 10 scharakteryzowanych obejść > 30 postaci |
| **O5** | **nikt nie żyje z jednej rzeczy** | `swiat.md` | każde obejście ma ogród, kury i drewutnię *zanim* dostanie zawód |
| **O6** | nowy kafel to nowa robota; **substytut = dług** | historia komina/kalenicy | brakujących elementów **nie zastępujemy** podobnymi — po prostu ich jeszcze nie ma |
| **O7** | skala mapy jest **teatralna, nie metryczna** | patrz 3.3 | pola pokazujemy skrótem; reszta „ciągnie się poza kadr" |

---

## 3. Ekonomia wsi — model, z którego wynika wszystko inne

Tu robi się „urealnienie". Wieś ma się utrzymać sama i **liczby mają się
zgadzać ze sobą nawzajem** — nie z podręcznikiem historii.

### 3.1 Gospodarstwa domowe

**10 obejść, 30 dusz** (w tym gracz), plus Wszebor Myśliwy **poza palisadą**
— on nie jest mieszkańcem wsi i to jest cały sens jego domu.

Średnio 3 osoby na obejście. Rozstęp 1–4: wdowa mieszka sama, młyn i
sołtysówka mają po czworo. To jest ta różnica, która sprawia, że wieś czyta
się jak wieś, a nie jak osiedle.

### 3.2 Trzy filary utrzymania

1. **Zboże** — podstawa. Trójpolówka (patrz 4.3): dwa pola pracują, trzecie
   odpoczywa i jest wypasane.
2. **Zwierzęta** — mięso, mleko, wełna, jaja, obornik (bez którego pole
   przestaje rodzić — to jest powód istnienia obory, nie ozdoba).
3. **Rzemiosło** — kowal, młynarz, stolarz, zielarka, pasterz. **Dochód, nie
   całe życie** (O5): kowal też ma kury i grządki.

Trzy zawody i tylko trzy są **wymianą wewnątrz wsi**, i to one domykają
obieg: młynarz miele (bierze miarkę mąki), kowal kuje (bierze zboże albo
odrobek), zielarka leczy (bierze jajka i mleko). Pieniądz jest rzadki —
dlatego gracz z workiem złota z lasu jest tu **zjawiskiem**, i dlatego
sprzedaje skóry Myśliwemu, a nie sąsiadom.

### 3.3 Ile ziemi — i dlaczego nie zmieści się na mapie

Uczciwy rachunek: dziesięć gospodarstw żyjących ze zboża potrzebuje ziemi
liczonej w dziesiątkach hektarów. Kafel ma 32 px, a postać jest wysoka na
~60 px — czyli kafel to jakieś **pół metra do metra**. Cała mapa 100 × 100
kafli to zatem najwyżej **1 hektar**. Pola nie zmieszczą się i nigdy się nie
zmieszczą.

→ **Zasada O7 w praktyce: pola są synekdochą.** Pokazujemy przy wsi **trzy
niwy po kilka zagonów każda** — dość, żeby było widać płodozmian i pracę — a
horyzont zamykamy zaroślami i drzewami z komunikatem „ciągnie się dalej".
`swiat.md` już to zakłada („pola ciągnące się poza kadr"). Ten plan tylko
nazywa to wprost, żeby nikt później nie próbował „dorysować reszty".

### 3.4 Inwentarz całej wsi

Suma z kart obejść (sekcja 5). To jest budżet, z którego wynika, ile
kurników, chlewów i obór musi stać na mapie — i w jakiej kolejności warto
robić grafikę zwierząt.

⚠ **Zrewidowane (2026-08-10) w dół** — pierwsza wersja tej tabeli była
ekonomicznie zawyżona dla wsi tej wielkości. Nowe liczby to stan docelowy
zarówno dla lore, jak i dla tego, co kiedyś stanie na mapie jako sprite —
**nie wracamy do modelu „duża liczba w lore, mała na mapie"**: skoro dialog
NPC (Gniewko) wypowiada konkretne liczby, mają się zgadzać z tym, co
faktycznie istnieje w świecie.

| zwierzę | sztuk | gdzie | uwaga produkcyjna |
|---|---|---|---|
| **kury** | 22 | każde obejście, po 2–3 | **priorytet 1** — `swiat.md` ma rację, najwyższy zwrot na piksel |
| **owce** | 16 | stado Gniewka (9) + po 1–3 u Kuźni/Sołtysa/Dobka/Sobka | jedno duże stado na ugorze czyta się za całą wieś, nie musi być liczne |
| **świnie** | 5 | Witek 2 (najwięcej), Marek 1, Młyn 1, Dobek 1 | **`pig.png` już istnieje i nie jest podpięta** — najtańszy zysk w projekcie |
| **gęsi** | 4–6 | Zofia (pierze = dochód wdowy) | przy sadzawce |
| **krowy** | 5 | Sołtys 2 (najwięcej), reszta po 1 | obora, koryto, gnojownik |
| **woły robocze** | 2 (1 para) | **wyłącznie Dobiesław** | pożyczane za odrobek innym gospodarstwom (w tym Dobkowi) — generator relacji, nie inwentarz |
| **konie** | 2 | Miłosz (wóz), Dobiesław | koń = status |
| **kozy** | 2 | Dorota | mleko dla chorych i dzieci |
| **ule (kłody)** | 6 | Dorota | miód = lek i jedyny słodzik |
| **psy / koty** | 5 / dużo | wszędzie | pies przy owcach i przy bramie |

**Para wołów jest najważniejszą rzeczą w tej tabeli.** Ma ją TYLKO
Dobiesław, a orać musi każdy — reszta wsi, w tym Dobek i ojciec bohatera,
jest mu winna dni pracy za pożyczkę. To jedno zdanie tłumaczy, dlaczego
„pole samo się nie zaorze" jest groźbą, a nie gadaniem, i daje darmowe
kwestie dialogowe dla połowy obsady — **teraz jeszcze mocniej niż przy
dwóch parach**, bo Sołtys jest JEDYNYM źródłem, więc dług wobec niego jest
bez alternatywy.

---

## 4. Rozkład wsi

### 4.1 Oś częstotliwości — reguła, która ustawia wszystko

> **Im częściej gracz czegoś potrzebuje, tym bliżej bramy to stoi.**

To rozwiązuje pozorny konflikt między „wieś na 30 osób" a „wieś ma być
przebiegana" (O3). Podatek od powrotu z lasu płaci się **tylko za rzeczy
używane co wyprawę**:

| jak często | co | gdzie | koszt dojścia |
|---|---|---|---|
| co wyprawę | Myśliwy: skup, szkolenie, ognisko | **przed palisadą**, przy bramie (centrum pasa południowego) | ~0 s |
| co kilka wypraw | Kowal, plac, studnia | rdzeń, y 54–67 | ~8 s |
| raz na akt | sołtys | rdzeń, y 60–68 | ~8 s |
| raz na akt, ale przy bramie | **młyn** (zachodnia flanka), **zielarka** (wschodnia flanka) | ten sam pas co Myśliwy (y 76–99), boczne skrzydła | ~3–5 s |
| tło | pastwisko, sad, dalsze obejścia | krawędzie | tyle, ile gracz zechce |

⚠ Młyn i zielarka złamały czystą regułę „rzadko używane = daleko od bramy"
(D-2/D-3, rozstrzygnięte z użytkownikiem): zielarka ma stać blisko lasu i łąk,
bo stamtąd bierze zioła — to jest silniejszy powód niż utrzymanie odległości
jako sztucznej przeszkody. Odległość nadal jest **boczna, nie na trasie**:
gracz idący z bramy prosto do wsi (drogą, x 50–51) mija oboje o kilkanaście
kafli w bok, więc zakup mikstury czy przemiał zboża zostaje świadomym
odbiciem od trasy, nie czymś, co dzieje się przy okazji.

Dlatego duża mapa nie boli: **głębia jest opcjonalna**, a pętla las → łup →
sprzedaż w ogóle nie wchodzi za palisadę.

### 4.2 Schemat (1 znak ≈ 4 kafle)

```
        x=0        20        40        60        80      99
 y=0    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^   ^ las/krawędź (dekoracja, brzeg mapy)
 y=8    ^^^^^^^^^^^^^^^^^^^^^^ || ^^^^^^^^^^^^^^^^^^^^^^^^   || droga DO MIASTA (ślepa na razie)
 y=16   . . . . . . . . . . . . || . . . . . . . . . . . . .   rezerwa / łąka otwarta
 y=24   , , , , , , , , , , , , || , , , , , , , , , , , , ,   , UGÓR (3. niwa)
 y=28   , , , , [OWCZARNIA] , , || , , , , , , , , , , , , ,     — wypas owiec
 y=32   , , , , , , , , , , , , || , , , , , , , , , , , , ,
 y=36   o o o o o o o . . . . . || . . . . . o o o o o o o o   o SAD + pasieka
 y=40   o o o o o . . . . . . . || . . . . . o o o o . . . .
 y=44   [--STODOŁA--][CHATA   ] || . . . . [STOLARZ] . . . .   obejścia północne
 y=48   [  Dobek    ][ Dobka  ] || . . . . [       ] . . . .
 y=52   [--KURNIK--] [KUŹNIA ] || . . . . . . . . . . . . . .
 y=56   [ Dobek    ] [podw.  ] ##PLAC## . [--SOŁTYS--] . . .   ## plac ze studnią
 y=60   . . . . . . . [       ] #(S) ## . [          ] . . .   (S) studnia — na
                                                               ZACHODNIEJ flance
                                                               placu, nie na osi
 y=64   [--OBORA--] . . . . . . || . . . [ sad       ] . . .
 y=68   [  Zofia  ][CHATA   ] . || . . . . . . . . . . . . .   obejścia południowe
 y=72   . . . . . . [ Zofii  ] . || . . . . [--WITEK--] . . .
 y=76   [MŁYN]~staw ; ; ; ; ; || ; ; ; [ +chlew ]   [ZIELARKA]  ; NIWA WSCHODNIA
 y=80   ~jaz~ [-DOM GRACZA-]; || ; ; ; ; ; ; ; ;     (przy lesie/łące,
 y=84   ~~~~~ [Marko+Alina]; ; || ; ; ; ; ; ; ; ;      na uboczu)
 y=88   ####################BRAMA####################          # PALISADA
 y=92   . . . . . [CHATA MYŚLIWEGO] . . . . . . . . . . . .   przedpole (centrum, przy bramie)
 y=96   . . . . . ognisko  suszarnie  || . . . . . . . . . .
 y=99   ================== BRAMA DO LASU =====================
```

Trzy skrzydła jednego pasa (y 76–99, decyzja D-2/D-3): **Myśliwy w centrum**
przy bramie, **młyn na zachodniej flance** nad własnym, lokalnym stawem i
jazem (nie rzeką ciągnącą się przez całą mapę — prościej w kaflach, i tak
powinno być dla małej wsi), **zielarka na wschodniej flance**, najbliżej
lasu i otwartej niwy — dokładnie tam, gdzie rosną zioła, które zbiera.
Wszyscy troje mieszkają „na uboczu" z tego samego geograficznego powodu,
każde z innego zawodowego uzasadnienia.

**Uwaga:** to jest schemat, nie plan wykonawczy. Współrzędne budynków
istniejących są dokładne (tabela 1.1); nowe elementy mają zaproponowane
przedziały w sekcji 5 i **wymagają sprawdzenia kolizji** przed wpięciem —
w szczególności ten pas: młyn, dom gracza, zielarka, chlew Witka i chata
Myśliwego dzielą wąski pas 24 kafli wysokości, i to jest pierwsze miejsce,
gdzie audyt gęstości (P4) może wykazać, że trzeba je rozsunąć.

### 4.3 Strefy

| strefa | y | co tam jest | stan |
|---|---|---|---|
| **Przedpole** | 90–99 | ~~chata Myśliwego~~, brama do lasu | ❌ **Myśliwy tu NIE ZAMIESZKA — decyzja autora 2026-08-17: zostaje w lesie.** D-1 zakładało przeprowadzkę „kiedyś"; to jest odpowiedź „nie". Przedpole zostaje pasem przed palisadą, ale bez jego zabudowy — jeśli ma tu kiedyś coś stanąć, to nie jego chata. |
| **Palisada** | 88 | ostrokół x 8–99 (od stawu młyńskiego do krawędzi; pnie na x95, 96, 99 w linii) + brama nad drogą x49–52 | ✅ **2026-10-09 — obiekty 3D** (`palisada`/`brama` w warstwie `budynki`), bez kafli. ⚠ Do x99, nie do x80: przy x80 wieś dało się obejść od wschodu i „poza palisadą" nic nie znaczyło. Plac ćwiczeń Patryczka przesunięty do środka (84,86 / 87,86) |
| **Pas południowy — flanki** | 76–87 | **młyn + staw/jaz** (zachód), dom gracza (środek-zachód), ~~chlew Witka (środek-wschód)~~, **zielarka** (wschód, przy lesie) | 🟡 młyn ✅, zielarka ✅. ⚠ **Chlew Witka NIE MA GDZIE STANĄĆ: wschodnia niwa (E1) została pomalowana dokładnie na jego strefie.** Przemiecenie całego pasa za wolnym prostokątem 6×7 z marginesem dało **jedno** miejsce — x53/y74, czyli środek-ZACHÓD. Do tego sam Witek i obie świnie stoją dziś **wewnątrz zboża**. Decyzja zaparkowana w `docs/odlozone.md` §1. |
| **Niwa południowa/wschodnia** | 76–87 | ozimina i jarzyna między budynkami tego pasa | ✅ obie pomalowane (E1) |
| **Obejścia południowe** | 64–76 | Zofia, Witek | ✅ chałupa Zofii dostawiona do obory |
| **Rdzeń** | 54–67 | plac, studnia, kuźnia, tablica, ławki, grusza, sołtys | 🟡 studnia i kuźnia stoją; studnia przesunięta o 2 kafle na zachód (2026-08-11), żeby nie siedziała na osi drogi |
| **Obejścia północne** | 44–56 | Dobek, Stolarz | ✅ **warsztat Sobka postawiony 2026-08-17** (x66–71/y45–51, deski + wrota, Sobek przy wrotach na 68,52); 4 budynki stoją |
| **Sad i ogrody** | 34–44 | jabłonie, śliwy, pasieka | ⏳ |
| **Ugór / pastwisko** | 24–36 | owce, owczarnia, sadzawka, gęsi | 🟡 ugór pomalowany (~48% krycia) + owczarnia i chałupa Gniewka stoją; sadzawka i gęsi ⏳ |
| **Rezerwa / łąka otwarta** | 16–24 | nic — była tu propozycja młyna, przeniesiona na południe (D-2) | ⏳ wolne |
| **Droga na północ** | 0–16 | zapowiedź miasta (wątek kowala) — ślepa na razie | ⏳ |

### 4.4 Dlaczego pole leży między lasem a wsią

`swiat.md` stawia to jako świadomy zapis fabuły w geografii: gracz codziennie
mija to, czego broni. Po odwróceniu geografii (1.2c) reguła zostaje w mocy —
**niwa południowa leży dokładnie między bramą a wsią** — z jednym bonusem,
którego pierwotny układ nie miał: dom bohatera stoi **w tej niwie**, nie za
nią. Wybiegasz z domu prosto w zboże, którego bronisz.

I dlatego pole wdowy Zofii (5.3) leży przy samej ścianie lasu, w rogu
niwy — najbardziej narażone we wsi. To jej pole ratujesz i to ona pierwsza
nazwie cię myśliwym.

### 4.5 Trójpolówka — trzy niwy, jeden system, zero nowej grafiki

Pola nie są jedną teksturą. Wieś dzieli ziemię na **trzy niwy**, a każde
gospodarstwo ma zagony w **każdej z nich** (stąd charakterystyczny pasiasty
układ — nikt nie ma jednego kawałka, wszyscy mają po pasku wszędzie).

| niwa | y | co rośnie | co widać |
|---|---|---|---|
| **południowa** | 76–87 | ozimina — żyto | wysokie, dojrzewające zboże |
| **wschodnia** | 68–88 (wschód) | jarzyna — owies, jęczmień, **len** | niższe, różne stadia; len moczony w sadzawce |
| **północna** | 24–36 | **ugór** — odpoczywa | rżysko + wypasane owce, gdzieniegdzie zaorane |

To jest dokładnie to, do czego przygotowany jest `pole_tileset.png` (163
kafle: zaorana ziemia, kapusta, zboże i korzeniowe w **kolejnych stadiach
wzrostu**) plus `pole_over_*.png` na warstwę nad postacią. Płodozmian
zamienia trzy stadia z arkusza w **system**, a nie w losowy szum — i przy
okazji tłumaczy, dlaczego owce pasą się akurat tam, gdzie się pasą.

⚠ Zagony biegną **prostopadle do drogi**, pasami po 2–3 kafle. Pasy równoległe
do drogi czytałyby się jak kolejna droga.

---

## 5. Dziesięć obejść

Format karty jest ustalony w `docs/prompt_wioska.md` i każde kolejne przejście
ma go pogłębiać, nie zmieniać. Poniżej **pierwszy zarys** — dość, żeby
sprawdzić spójność ekonomii, za mało, żeby pisać dialogi.

Legenda stanu: ✅ stoi na mapie · 🟡 częściowo · ⏳ do postawienia

> ✅ **OBSADA ROZSTRZYGNIĘTA 2026-10-10 (autor)** — dawniej stał tu znany
> brak (2026-09-08: Patryczek i Anna bez obejścia, `docs/swiat.md` §7,
> pytanie 5):
> - **Patryczek** (~20) — wnuk zielarki, mieszka u babki → obejście Doroty
>   (§5.8) ma **2 osoby**, nie 1.
> - **Adrian** (ok. 29) — czeladnik kowala, obejście kuźni (§5.5).
> - **Bogusz** — karczmarz, **wdowiec**, mieszka w karczmie; przejezdni śpią
>   w stodole przy karczmie (dialog). Anna gotuje, obsługuje gości i lżej
>   sprząta — ale „nie jest służącą" (`docs/swiat.md`, sekcja o Annie).
> - **Anna** — **kuzynka Bogusza**, która się zbuntowała: „nie będzie kurą
>   domową", nie da się wyswatać rodzicom „z tym, kto więcej zaoferuje",
>   sama na siebie zarabia handlem. Mieszka u kuzyna przy karczmie; matka żyje
>   (dialog `slimaki`), rodzice poza Zagajami (założenie, nie słowa autora).
> - **Drwale** — ojciec **Ciechan** z synami **Bolkiem** i **Zbychem**, dwie
>   chałupy na południowo-zachodnim skraju (K5, `docs/swiat.md`, sekcja
>   o drwalach).
> Karty §5 do przepisania razem z nowym planem gospodarki
> (`docs/prompt_wies_gospodarka.md`, decyzja 2026-10-10 o układzie).

---

### 5.1 Obejście Marka — dom gracza 🟡

**Gdzie:** chata zachód, x 22–27, y 79–85, w niwie południowej.
**Ludzie (3):** Marko (54, ojciec), Alina (49, matka), **gracz** (18).

**Majątek:** najmniejszy z rolniczych. Zagony w trzech niwach (ledwo starczy),
1 krowa, 1 świnia, ~2 kury, ogród, drewutnia. **Wołów nie ma** — orze
pożyczonymi od Dobiesława i **odrabia to dniówkami**. To jest ekonomiczne
źródło zdania „pole samo się nie zaorze": nie chodzi o pług, chodzi o to, że
odrobek trzeba odpracować własnym grzbietem, a grzbiet ma 54 lata.

**Zabudowa:** chałupa (✅), drewutnia z pieńkiem i siekierą (⏳), chlewik (⏳),
kurnik przystawiony do chałupy (⏳), grządki (⏳), sznur z praniem (⏳).

**Co gracz ma zrozumieć bez dialogu:** tu mieszkają ludzie, którzy pracują
więcej niż mają. Podwórze zamiecione, płot naprawiany kilka razy, ale drewno
w stosie policzone co do polana.

---

### 5.2 Obejście Dobka — największe gospodarstwo zbożowe 🟡

**Gdzie:** chałupa x 30–37, y 45–53 (dawny „dom gracza"); stodoła x 18–27,
y 45–55; kurnik x 18–23, y 56–62.
**Ludzie (3):** Dobek (41), Hanna (38, żona), Wojtek (14, syn).

**Majątek:** najwięcej zboża we wsi, 1 krowa, 1 świnia, ~3 kury, 2 owce, wóz.
**Wołów własnych nie ma** — orze na pożyczonych od Sołtysa, tak jak reszta
wsi (patrz konflikt niżej rozstrzygnięty D-8). Stodoła jest największym
budynkiem gospodarczym w Zagajach i to jest widoczne z drogi — **wielkość
gospodarstwa czyta się z budynku, nie z wołów**.

**Rola w ekonomii:** odrabia u Sołtysa za pożyczone woły, zwozi do młyna
najwięcej zboża. Jeśli zające zjedzą jego pole, młyn traci połowę przemiału
— **to Dobek jest tym, przez kogo stawka fabularna jest liczbowa**.

**Zabudowa:** chałupa (✅), stodoła (✅), kurnik (✅), bróg/stóg (⏳, kafle są),
wóz (⏳), gnojownik (⏳).

---

### 5.3 Obejście wdowy Zofii — to jej pole ratujesz 🟡

**Gdzie:** obora x 16–23, y 66–74; chałupa **x 26–31, y 68–74 ✅**
(postawiona 2026-08-10 — profil „chaty zachód": 6×7, bale, dach szczytowy,
komin, drzwi, jedno okno). Zofia (`widow`) przeniesiona pod własne drzwi na
(944, 2416); stała dotąd na (2069, 2700), przy niczym.
**Ludzie (4):** Zofia (35, wdowa), Sulisław (**81**, teść), Janek (11 — `ZOFIA.topics.sama`: „chłopak jedenaście”), Marysia (7).

⚠ **Sulisław miał tu 68 i to była nasza własna sprzeczność, rozstrzygnięta
2026-08-18 na 81.** Wygrała kwestia, którą gracz może już usłyszeć w grze —
`ZOFIA.topics.sama`: „teść ma osiemdziesiąt jeden lat i połowę wzroku".
Reguła, którą to ustala na przyszłość: **wypowiadany dialog bije planowanie**,
bo dialogu nie da się cofnąć z zapisów gracza, a planu tak. Sam Sulisław nadal
nie podaje liczby i nie musi.

**Majątek:** 1 krowa, **4–6 gęsi** (pierze — to jest realny dochód wdowy, nie
detal), ~2 kury, zagony w trzech niwach. Wołów nie ma, siły roboczej nie ma:
teść jest za stary, Janek za mały.

**Dlaczego to ona:** jej zagon leży w rogu niwy południowej, przy samej
ścianie lasu — najbardziej narażony we wsi, bo nie ma komu go pilnować.
`swiat.md` chce sceny, w której sąsiadka pierwszy raz nazywa bohatera
*myśliwym*; **kobieta, która sama nie da rady obronić własnego pola, jest
jedyną osobą, dla której to zdanie coś kosztuje.**

**Sulisław** to jeden z dwóch starców przy studni. Mieszka u synowej, bo syn
nie żyje — i to jest cała jego historia, opowiedziana przez adres.

---

### 5.4 Obejście Witka — len i świnie 🟡

**Gdzie:** chata wschód 2, x 60–65, y 76–82; chlew ⏳ obok.
**Ludzie (4):** Witek (44), Marta (40), Kuba (66, ojciec Marty), Staszek (16).

**Majątek:** **2 świnie** (najwięcej we wsi), ~2 kury, dużo lnu w niwie
wschodniej — bez krowy, bo cała ziemia orna idzie pod len i zboże. Len moczy
w sadzawce — stąd sadzawka jest **funkcją, nie ozdobą**.

**Kuba** to drugi starzec przy studni.
**Staszek** służy u sołtysa za parobka — jedna linijka, która wiąże dwa
obejścia i pokazuje, że biedniejsi wynajmują dzieci bogatszym.

---

### 5.5 Kuźnia — Radzim Kowal ✅ (jedyne gotowe obejście)

**Gdzie:** kuźnia x 34–39, y 54–60 + podwórze z wyposażeniem y 61–67.
**Ludzie (3):** Radzim (46), Agata (43, kowalowa), Adrian (ok. 29, czeladnik — dawniej „Bolko"; wiek poprawiony 2026-10-10 decyzją autora, wzór: realna osoba).

**Majątek:** kuźnia z pełnym wyposażeniem (✅ `Kuznia.png`), 1 krowa, ~2 kury,
1 owca, ogród. **Nie ma ziemi ornej** — i to jest ważne: kowal jest jedynym
mieszkańcem, który *musi* kupować zboże. Dlatego bierze zapłatę w naturze i
dlatego zależy mu na młynie.

**Robi:** lemiesze, podkowy, okucia wozów, **części do mechanizmu młyńskiego**.
Broń — sporadycznie, i dlatego jego sklep z mieczami jest wydarzeniem, a nie
straganem.

**To obejście jest wzorcem dla pozostałych dziewięciu** (O4): dziewięć
rekwizytów i wiadomo o człowieku wszystko.

---

### 5.6 Obejście sołtysa Dobiesława — urząd na doczepkę 🟡

**Gdzie:** x 58–65, y 60–68, przy placu; sad od południa ⏳.
**Ludzie (3):** Dobiesław (52), Małgorzata (50), Dobrawa (19, córka).

**Majątek:** najzamożniejszy we wsi — **jedyna para wołów w Zagajach, koń**,
2 krowy (najwięcej we wsi), 3 owce, sad jabłoniowy (8 drzew, status),
największa chałupa. Ale **sam orze**: urząd pełni dodatkowo, nie zamiast.

**Rola:** ściąga daninę, rozsądza spory, odpowiada przed panem. Jest
**jedynym właścicielem wołów we wsi** i przez to wierzycielem połowy wsi
(odrobek za ich pożyczanie), łącznie z ojcem bohatera i Dobkiem — **co czyni
każdą rozmowę z nim lekko niewygodną, zanim padnie jedno słowo**. ⚠ D-8
(2026-08-10): wcześniej Dobek miał osobną, własną parę — usunięte, bo dwóch
niezależnych właścicieli podważało sens Sołtysa jako jedynego wierzyciela;
patrz też poprawiona kwestia Hanny (`woly_rywalizacja`, `GameConfig.ts`).

**Dobrawa** (19) jest w wieku bohatera. Nie robimy z tego romansu na siłę;
wystarczy, że jest jedyną rówieśniczką, która **została** we wsi.

---

### 5.7 Warsztat stolarza — Sobek 🟡

**Gdzie:** chata wschód 1, x 58–63, y 45–51; warsztat i skład drewna ⏳ obok.
**Ludzie (2):** Sobek (38), Barbara (36).

**Majątek:** warsztat (kozioł do piłowania, deski, beczki, obręcze), 1 krowa,
~2 kury, 1 owca. Robi wozy, koła, płoty, dachy, beczki i **trumny** — o czym się nie mówi,
ale skrzynia stoi w kącie.

⚠ **Stolarz jest mechaniką w kostiumie** (`swiat.md`): „naprawia" rzeczy,
których trwałości w grze nie ma. Patrz D-4.

---

### 5.8 Chata zielarki — Dorota 🟡 — sklep rozstrzygnięty, patrz D-3

**Gdzie:** **wschodnia flanka pasa południowego, x 82–87, y 78–84 ✅**
(postawiona 2026-08-10, ten sam profil 6×7 co u Zofii) — wewnątrz strefy
x 80–90 / y 78–86 z D-3, tuż przy granicy lasu (treeline zaczyna się x 92).
**Ludzie (1):** Dorota (61, wdowa).

⚠ **Dorota faktycznie stała gdzie indziej niż mówi D-3 — poprawione przy
okazji stawiania chaty.** Jej punkt w `.tmj` był na (434, 2946) = kafel
(13.6, 92), czyli na **południowym zachodzie**, cztery kafle od „chaty
zachód" (dom rodziny gracza) — dokładne przeciwieństwo „na uboczu", i
sprzeczne z D-3, które przeniosło ją na wschód *właśnie po to*, żeby
mieszkała przy lesie, skąd bierze zioła. Przeniesiona na (2736, 2736),
pod własne drzwi. To jest ten sam rodzaj cichego rozjazdu co „chata
zachód" w §1.2a: decyzja zapisana w planie, nigdy nieprzeniesiona na mapę.

**Majątek:** 2 kozy, ~2 kury, **6 uli**, ogród ziołowy, suszarnia ziół pod
okapem, śliwy, mały płat dziko rosnących ziół tuż za progiem (nie osobny
tileset — kilka kafli `kepki`/`krzaki` z istniejącego `Nature.png`, gęściej
niż gdziekolwiek indziej na mapie). Żyje z leczenia — bierze jajkami i
mlekiem, i teraz też **gotówką za mikstury**.

**Nie jest alchemiczką ani czarownicą** (`swiat.md` jest tu kategoryczne).
Zioła, opatrunki, porody. Odbierała porody **większości dzieci we wsi**, co
daje jej darmową linijkę relacji do praktycznie każdego mieszkańca.

**✅ D-3 rozstrzygnięte:** sprzedaje **proste mikstury** — mały, drogi sklep,
zakup przed wyprawą, nie uzupełnienie w biegu (patrz 4.1). **Szkolenia nie
ma na razie** — user zaznaczył to jako „możliwe kiedyś", nie zobowiązanie;
zostaje w sekcji 8/K jako możliwe rozszerzenie, nie w zakresie tego etapu.
Lokalizacja „blisko lasu i łąk" jest **wprost fabularna, nie tylko
mechaniczna**: zioła, które sprzedaje, rosną tam, gdzie mieszka — to samo
uzasadnienie geograficzne co u Myśliwego (5.11), inny zawód. Zielarki
tradycyjnie trzymały się na uboczu, i to jest teraz widoczne na mapie, nie
tylko w opisie.

---

### 5.9 Owczarnia — Gniewko Pasterz 🟡

> ⚙ **NIEAKTUALNE POŁOŻENIE od 2026-10-11 (K6c, decyzja autora):** zagroda
> Gniewka przeniesiona z rogu za polami do wsi — przy trakcie nad kuźnią
> (K6c, potem zamiana zagród K6f). Chałupa frontem do traktu, owczarnia za
> nią, wrota na pastwisko owiec. Stan: `zagaje_projekt_ukladu.md` „K6f”.
> Poniższe współrzędne są historyczne.

**Gdzie:** **chałupa x 17–22, y 19–25 ✅ + otwarta owczarnia x 26–33,
y 19–24 ✅** (postawione 2026-08-10). Gniewko (`gniewko`) przeniesiony pod
własne drzwi na (656, 848); stał dotąd na (944, 976), czyli **w szparze
między dwoma pasami ugoru** — na polu, nie przy zabudowie.
**Ludzie (3):** Gniewko (33), Elżbieta (31), Jaśko (13).

Dwie rzeczy, których pierwotna propozycja („x 24–34, y 26–34, przy ugorze")
nie mogła przewidzieć, bo ugór powstał dopiero w E1:
- **Ugór LEŻY w tym prostokącie** (wtedy 20 kafli `pola`, dziś cała niwa
  x 18–46/y 27–36), więc budynek postawiony wg propozycji nadpisałby pole.
  Zabudowa poszła **na północ od ugoru** — pole zostaje pastwiskiem PRZED
  nią, co jest zgodne z sensem tego obejścia („jedno duże stado na ugorze
  czyta się za całą wieś"), a nie przeciw niemu.
- **Owczarnia ma dach KALENICOWY, nie szczytowy.** Przy szer=8 dach `/\` ma
  9 wierszy wysokości (ramiona schodzą niżej niż ściana), kalenicowy — 6.
  Otwarta szopa nie może górować nad chałupą obok. Ta sama decyzja co przy
  stajni w komplecie (`CLAUDE.md`: „stable 9×6, ridge roof, not gable").

**Majątek:** **9 owiec własnych + wypasa cudze** (stąd łączne 16 w całej wsi —
zrewidowane w dół 2026-08-10, patrz §3.4), ~2 kury, 2 psy, chałupa i otwarta
owczarnia (wiata — kafel istnieje), koryto, sadzawka.

**Po co jest:** wełna → materiał → surowiec dla przyszłego krawca. Jedno duże
stado na ugorze **czyta się za całą wieś** i jest najtańszym sposobem
pokazania, że tu mieszka więcej ludzi, niż widać.

---

### 5.10 Młyn — Miłosz Młynarz ✅ **ZBUDOWANY** (potwierdzone 2026-08-17) — lokalizacja wg D-2

> ⚠ **Ten nagłówek mówił „największy brak na mapie" długo po tym, jak młyn
> stanął.** Bryła stoi na x2–9/y74–81, staw na x0–7/y82–89, koło młyńskie na
> styku (4,82) — czyli **dokładnie w przedziale, który D-2 wyznaczyło niżej**
> (x 0–14, y 78–90, własny zbiornik zamiast rzeki). Namalowany ręcznie w Tiled,
> **nie ma go w `BUDYNKI_WIOSKI` w `build_wioska.py`**, więc regeneracja mapy by
> go skasowała i żaden raport generatora o nim nie wie. To jedyny powód, dla
> którego mógł zniknąć z radaru. **Miłosz stoi przy nim od 2026-08-17** (9,82);
> wcześniej stał przy studni na placu.

**Gdzie:** propozycja **zachodnia flanka pasa południowego**, x 0–14,
y 78–90, w narożniku mapy — **nad własnym stawem i jazem**, nie nad rzeką
ciągnącą się przez całą wieś (patrz uzasadnienie niżej).
**Ludzie (4):** Miłosz (47), Agnieszka (44), Mirek (18), Sulko (15).

**Majątek:** młyn wodny z kołem, jaz, koń i wóz, 1 świnia, ~2 kury. Bierze
**miarkę** od każdego przemiału — dlatego młynarz w każdej wsi był
podejrzewany o bogactwo, i dlatego jest jedynym, kto ma gotówkę.

**Dlaczego wieś tu stoi:** to jest punkt wyjścia całej osady (`swiat.md`).
Rzeka napędza koło, droga wywozi mąkę, kowal ma z czego żyć (mechanizm
młyński, nie kilka chałup). **A fabularnie:** jeśli zające zeżrą zboże, młyn
nie ma czego mielić i stawka rośnie z „będzie głodno" do „osada się rozejdzie".

**✅ D-2 rozstrzygnięte:** młyn ląduje na **południu** wsi, blisko bramy —
nie na dalekiej północy, jak pierwotnie proponowałem (patrz uwaga niżej).
Żeby nie ścisnąć się z Myśliwym i zielarką na tym samym wąskim pasie,
młyn dostaje **własny, lokalny zbiornik** (staw + jaz w rogu mapy) zamiast
rzeki biegnącej przez całą wioskę — mniejsze koło, skromniejszy młyn, ale to
pasuje do małej wsi i jest o rząd wielkości tańsze w kaflach niż prowadzenie
wody przez 80 kafli terenu.

⚠ Rzeka leśna (w `forrest.tmj`) i ten staw **nie są hydrologicznie
połączone** — nie ma dziś żadnego mostu danych między mapami poza portalem,
więc nie ma czego „zszywać". To jest osobny, samodzielny zbiornik wodny,
wymyślony wyłącznie na potrzeby młyna.

⚠ Młyn jest **jedynym elementem tego planu, który nie ma ani jednego kafla**
poza samym stawem/jazem (blob-47 wody z `Teren.png` już umiemy stawiać —
patrz las). Koło młyńskie i sam budynek — patrz sekcja 7.

---

### 5.11 Poza palisadą — Wszebor Myśliwy ⏳

**Gdzie:** przedpole, y 90–97 (propozycja: chata x 20–28, ognisko i suszarnie
x 30–44).
**Ludzi:** 1 (nie liczony w trzydziestce — **on nie jest mieszkańcem wsi**).

**Dlaczego poza:** tam ma robotę, suszarnie i ognisko. **I dlatego wilk dopadł
jego, a nie kogokolwiek ze wsi.** Układ wioski tłumaczy prolog bez jednego
zdania dialogu.

⚠ Dziś Myśliwy stoi w lesie, a jego pozycja ma **zmierzone, asercjonowane
odległości** do ogniska (115 px, wymóg > 92). Przeniesienie to osobna decyzja
— D-1.

---

## 6. Trzydzieści dusz

Konwencja: **30 mieszkańców za palisadą, w tym gracz.** Wszebor jest 31.,
mieszka poza — i to jest jego charakterystyka.

| # | imię | wiek | obejście | zajmuje się | sprite | interakcja |
|---|---|---|---|---|---|---|
| 1 | **Gracz** | 18 | Marka | wszystkim, czym każą | ✅ | — |
| 2 | **Marko** | 54 | Marka | rola; ojciec bohatera | ✅ | rozmowa |
| 3 | **Alina** | 49 | Marka | dom, obrządek; matka | ✅ | rozmowa |
| 4 | **Dobek** | 41 | Dobka | największe pole (orze na wołach sołtysa — D-8) | ✅ (peasant) | rozmowa |
| 5 | Hanna | 38 | Dobka | dom, krowy, ser | ⏳ | rozmowa |
| 6 | Wojtek | 14 | Dobka | pomaga przy wołach | ⏳ | tło |
| 7 | **Zofia** | 35 | Zofii | wdowa; gęsi, pierze | ⏳ | **kluczowa scena** |
| 8 | Sulisław | 81 | Zofii | starzec przy studni | ✅ (elder) | rozmowa/tło |
| 9 | Janek | 11 | Zofii | pasie gęsi | ⏳ | tło |
| 10 | Marysia | 7 | Zofii | — | ⏳ | tło |
| 11 | Witek | 44 | Witka | len, świnie | ⏳ | rozmowa |
| 12 | Marta | 40 | Witka | len, przędza | ⏳ | tło |
| 13 | Kuba | 66 | Witka | drugi starzec przy studni | ⏳ | rozmowa/tło |
| 14 | Staszek | 16 | Witka | parobek u sołtysa | ⏳ | tło |
| 15 | **Radzim Kowal** | 46 | Kuźnia | kuźnia — **sklep** | ✅ | **sklep** |
| 16 | Agata | 43 | Kuźnia | dom, ogród, rachunki kuźni | ⏳ | rozmowa |
| 17 | **Adrian** *(do 2026-10-09 „Bolko")* | ok. 29 | Kuźnia | czeladnik; miech, węgiel, mielerz | ✅ | rozmowa |
| 18 | **Dobiesław Sołtys** | 52 | Sołtysa | urząd + własne pole, woły | ✅ | rozmowa |
| 19 | Małgorzata | 50 | Sołtysa | dom, sad, danina | ⏳ | tło |
| 20 | Dobrawa | 19 | Sołtysa | dom, rówieśniczka bohatera | ⏳ | rozmowa |
| 21 | Sobek Stolarz | 38 | Stolarza | wozy, koła, beczki | ⏳ | rozmowa |
| 22 | Barbara | 36 | Stolarza | dom, ogród | ⏳ | tło |
| 23 | **Dorota Zielarka** | 61 | Zielarki | zioła, opatrunki, porody | ⏳ | **kandydat: mikstury** |
| 24 | Gniewko Pasterz | 33 | Owczarnia | stado wsi | ⏳ | rozmowa |
| 25 | Elżbieta | 31 | Owczarnia | wełna, przędza, ser | ⏳ | tło |
| 26 | Jaśko | 13 | Owczarnia | pomaga przy owcach | ⏳ | tło |
| 27 | **Miłosz Młynarz** | 47 | Młyn | młyn, miarka | ✅ (miller) | rozmowa |
| 28 | Agnieszka | 44 | Młyn | dom, wymiana | ⏳ | tło |
| 29 | Mirek | 18 | Młyn | kamień, wóz | ⏳ | tło |
| 30 | Sulko | 15 | Młyn | kamień, pole | ⏳ | tło |
| — | **Wszebor Myśliwy** | 57 | poza palisadą | **sklep, szkolenie, zlecenia** | ✅ | **pełny** |

**Uzupełnienie 2026-10-12 (`OI-175`, `docs/character_consistency.md` A6)** —
mieszkańcy dodani po tej tabeli; „30 dusz” zostaje konwencją planu, liczby
nie przeliczam:

| imię | wiek | gdzie | zajmuje się | interakcja |
|---|---|---|---|---|
| **Bogusz** | — | karczma | karczmarz, wdowiec; piwo, nocleg w stodole | rozmowa + jedzenie |
| **Anna** | do 30 | u Bogusza przy karczmie | kuzynka Bogusza; jedzenie, targ raz w tygodniu; pies Kira | rozmowa + jedzenie |
| **Patryczek** | ~20 | u Doroty (§5.8 — 2 osoby) | wnuk zielarki, ręka w łubkach | zadania, nauka |
| **Ciechan** | ~55 | drwale, SW skraj | drwal, ojciec | zadanie |
| żona Ciechana | — | drwale | — (istnieje w dialogu: „Matka mówi, że to po mnie”) | tło, bez imienia |
| **Bolko** | ~28 | drwale, własna chałupa | wyręb, szczapy na mielerz | rozmowa |
| **Zbych** | ~19 | drwale | sągi; ciągnie go do miasta | rozmowa |

**Stan (2026-08-11): 16 z 30 stoi na mapie** — gracz, Marko, Alina, Dobek,
Hanna, Zofia, Sulisław, Witek, Kuba, Radzim, Agata, Dobiesław, Dobrawa,
Sobek, Dorota, Gniewko, Miłosz. Mechaniki: **Kowal i Dorota** mają sklep,
**Ojciec** i **Sołtys** dają zadania, reszta to rozmowa (tier „rozmowa" z §6
jest w całości wpięty). Brakuje 14 osób i wszystkie są z tieru **„tło"** —
świadomie odłożonego, bo NPC bez kwestii kosztuje więcej niż jego brak (zjada
slot w audycie zasięgów `E` i uczy gracza, że rozmowa nie popłaca).

### 6.1 Ile realnie sprite'ów

`swiat.md` szacuje 14–16 baz i ma rację. Rozkład dla tej obsady:

| baza | wariantów | pokrywa |
|---|---|---|
| chłop dorosły | 4 | Marko, Dobek, Witek, Sobek, Gniewko, Staszek, Adrian |
| chłopka dorosła | 4 | Alina, Hanna, Marta, Barbara, Elżbieta, Agata, Agnieszka |
| starzec | 1 | Sulisław, Kuba |
| starsza kobieta | 1 | Dorota, Małgorzata |
| młodzieniec | 2 | Mirek, Sulko, Staszek |
| dziewczyna | 1 | Dobrawa |
| dziecko | 2 | Wojtek, Janek, Marysia, Jaśko |
| **osobne, rozpoznawalne** | 5 | Kowal ✅, Myśliwy ✅, Ojciec ✅, Matka ✅, Sołtys ✅ |

Razem **15 baz**, z czego **5 już istnieje**. Wrażenie trzydziestki robią
kolory ubrań, chusty, brody i nakrycia głowy — nie nowe arkusze.

### 6.2 Kto z kim — relacje jako darmowa treść

`NpcDef.greetings` już obsługuje kwestie zależne od stanu. Zasada `swiat.md`:
**każdy wymienia z imienia jedną–dwie osoby.** Siatka dla tej obsady:

- **Marko → Dobiesław** — winien mu dni za woły (i wstyd mu).
- **Dobiesław → Dobek** — rywalizują o to, kto pierwszy zaorze, choć Dobek orze na wołach Dobiesława; Dobek nie przeboleje jego konia (D-8, `HANNA.topics.woly_rywalizacja`).
- **Zofia → Dorota** — zielarka odbierała jej wszystkie porody.
- **Alina → Agnieszka (młynarzowa)** — wymienia jajka na mąkę.
- **Radzim → Miłosz** — kuje części do młyna, młynarz płaci mąką.
- **Radzim → Sobek** — okucia do wozów; stolarz robi drewno, kowal żelazo.
- **Witek → Dobiesław** — oddał mu syna na parobka.
- **Sulisław i Kuba → wszyscy** — dwaj starcy przy studni są żywą kroniką i
  komentują każdą zmianę stanu gry. **To jest najtańszy system reakcji świata,
  jaki ta gra może dostać** — jedno miejsce, dwie postacie, a mówią o
  wszystkim, co się właśnie wydarzyło.
- **Dorota → wszyscy** — odbierała porody, więc ma prawo mówić o każdym jak o
  dziecku.

---

## 7. Czego brakuje w kaflach

To jest lista zakupów wynikająca z sekcji 4–6. Kolejność = wartość na piksel.

### 7.1 Mamy i wystarczy (zero nowej grafiki)

| element | źródło |
|---|---|
| ściany bali i desek, dwa dachy, drzwi, wrota, okna, komin | `Buildings.png` |
| klapa kurza, otwór siana, wiata, płot żerdziowy | `Buildings.png` |
| ławka, beczka, koryto, stóg siana | `Buildings.png` (wiersz 7, **nieużyte na mapie**) |
| wyposażenie kuźni (13 elementów) | `Kuznia.png` ✅ |
| studnia z kołowrotem | `studnia_zlozona.png` ✅ (64×64, na placu). Druga, mała 32×32 (`studnia_mala.png`) też wpięta — czeka na decyzję, gdzie stanie |
| uprawy w stadiach wzrostu | `pole_tileset.png` ✅ wpięte, katalog `docs/pole.json`; malowane na warstwach `pola` (ziemia) + `uprawy` (roślina) |
| warstwa `-over` dla wysokich roślin | `pole_over_*.png` ❌ **17 luźnych plików, nie arkusz** — Phaser wiąże jeden obraz na tileset, więc dopóki ktoś ich nie spakuje, warzywa korzeniowe (jedyne cięte na pół) są nie do postawienia |
| sadzawka, rzeka, bród | `Teren.png` blob-47 ✅ |
| chlew, owczarnia, drewutnia, składy | **opisy**, nie nowa grafika — składane z istniejącego kompletu |

### 7.2 Brakuje — priorytet 1 (bez tego wieś nie jest wsią)

| # | co | dlaczego | szacunek |
|---|---|---|---|
| B1 | ✅ **Palisada + brama** (2026-10-09, obiekty 3D — kafle niepotrzebne) | próg dom/las; bez niej „poza palisadą" nie znaczy nic, a to jest fundament prologu | komplet ~12 kafli (odcinek, róg, brama, uszkodzony) |
| B2 | **Młyn wodny**: koło, jaz, kamień, worki | racja bytu osady; jedyny landmark bez kafla | budynek + 6–8 propów |
| B3 | **Kury** (encja + arkusz) | najwyższy zwrot na piksel w całym projekcie | jak jeden przeciwnik |
| B4 | **Świnia — wpięcie** | `pig.png` **istnieje** i leży niepodpięta | 4 kroki wg przepisu z `CLAUDE.md` |
| B5 | **Stos drewna + pieniek z siekierą** | „ktoś tu rąbie" — najtańszy komunikat o życiu | 2–3 kafle |
| B6 | **Grządki warzywne** | O5: każde obejście ma ogród | ✅ **sprawdzone w `docs/pole.json` (2026-08-11): grafika JEST, zero nowych kafli.** Kapusta 12 kafli w 3 fazach (sadzonka → młoda → dojrzała) + `nac` 29 kafli. ⚠ Warzywa **korzeniowe odpadają** — z 29 kafli **16 to połówki** bez działającej warstwy `-over`. Grządka = kapusta i nać na `uprawy`, ziemia na `pola`, dokładnie jak niwy. To jest **zadanie na rozstawienie, nie na rysowanie** |

### 7.3 Brakuje — priorytet 2 (charakteryzacja)

| # | co | do czego |
|---|---|---|
| B7 | wóz drabiniasty + koła | Dobek, młyn, stolarz |
| B8 | ✅ **sznur z praniem** (K6b 2026-10-11: Marko, Zofia, Witek — obiekt `pranie`) / suszarnia | „ktoś tu mieszka i pierze" |
| B9 | płot pleciony (wiklina) | podwórza; żerdziowy zostaje dla pastwiska |
| B10 | tablica zleceń | przy studni; namiastka gildii |
| B11 | ⛔ kapliczka przydrożna — **WSTRZYMANE** (autor 2026-10-11: religia nieokreślona; `odlozone.md` §5) | klimat + przyszły punkt odrodzenia |
| B12 | ule (kłody bartne) | Dorota |
| B13 | ✅ drzewa owocowe (jabłoń, śliwa, grusza) — K3 sad sołtysa, **K6 także NA podwórzach**, K6b grusza na placu | sad — wariant istniejących drzew |
| B14 | ✅ **gnojowisko** — KOPIEC obornika ze słomą **za oborą, nie na podwórzu** (autor 2026-10-11, K6h): za oborą Zofii, za chlewem Witka i chlewikiem Marka, po drugiej stronie płotu. Dobek (tył obory = droga do młyna) i sołtys (tył obory = plac) — bez kopca | obora bez gnojownika to obora-atrapa |
| B15 | suszarnie skór | Myśliwy; wizualny dowód fachu |
| B16 | owce ✅, **pies ✅** (K6b 2026-10-11: Kirci Anny, dwa owczarki Gniewka), gęsi ⏳ (brak modelu) | po kurach |

### 7.3b ✅ Przybudówki — kafle GOTOWE (2026-08-11), B17 zamknięte

> **Stan aktualny.** Sekcja poniżej opisuje stan sprzed 2026-08-11 i zostaje
> jako zapis rozumowania. Co się zmieniło:
>
> **Komplet kosztował TRZY kafle, nie 12–16** — `przybud_styk_0/1/2`
> (id **137/138/139**, wiersz 7, kolumny 4–6). Wycena B17 zakładała
> narysowanie dachu jednospadowego od zera. Nie było trzeba: dach pulpitowy
> w tym rzucie to **dokładnie** dach kalenicowy z `_dach_plaski` (kursy
> poziome, okap u dołu) z jedną różnicą — górna krawędź nie kończy się
> grzbietem, tylko wchodzi pod ścianę. `polac`, `polac2` i `okap` są więc
> reużywane bez zmiany, a nowy jest wyłącznie rząd zastępujący `kalenicę`.
> Układ składa `_dach_przybudowki(szer, głębokość)` w `build_budynki.py`;
> słupy otwartego frontu to, zgodnie z planem, reużyte `wiata_slup_1`/`wiata_1`.
>
> **Narożniki styku (2 kafle) okazały się niepotrzebne.** B17 powoływała się
> na regułę `_naroznik_okapu` („pasmo wylewa się poza swój kafel"), ale ta
> reguła dotyczy pasm biegnących **po skosie** — przekątna przecina rogi
> sąsiadów. Dach pulpitowy nie ma tu ani jednej przekątnej: kursy poziome,
> styk poziomy, krawędzie boczne pionowe. Nie ma czemu się wylać.
>
> **Warstwowanie rozstrzygnięte: bez nowej warstwy.** Cień ściany jest
> **wypieczony** w górne piksele kafla styku, a kafel nie wchodzi w komórkę
> ściany — ta sama zasada, którą komplet stosuje już przy kominie („kafel
> komina ZASTĘPUJE kafel dachu"). Przybudówka jedzie więc na `buildings-over`
> jak każdy inny dach, ściana zostaje na `buildings`, nigdy nie dzielą
> komórki, więc nie ma żadnej kolejności rysowania do popsucia.
>
> ⚠ **Przybudówka musi ZACHODZIĆ na rząd fundamentu (`OFS_Y = wys − 1`), a nie
> zaczynać się pod nim.** `kafel_fundament` kończy się **cieniem kontaktowym**
> (`neutralne[0]`, alfa 110, wiersze 29–31) — świadomym detalem, żeby budynek
> nie unosił się nad trawą. Przybudówka postawiona pod nim zostawia ten cień
> nad sobą, a że jest półprzezroczysty i leży wtedy na ZIELENI, wychodzi
> zielonkawy pasek rozdzielający oba dachy: zmierzone (76,145,65) trawy +
> `neutralne[0]` @110 = **(51,89,48)**. Zachodzenie na fundament jest zresztą
> poprawne fizycznie — przystawka zasłania dół ściany, do której jest doklejona.
>
> ⚠ **Wiersz 7 NIE był pusty i to omal nie kosztowało ławek.** Mimo że
> `zbuduj_kafle()` kończy się na wierszu 6, w wierszu 7 siedzą `lawka_l`
> (id 133), `lawka_p` (134) i `barrel_0` (136) — doklejone przez
> `build_lawka.py`/`build_barrel.py` prosto do PNG-a, z pominięciem tej
> funkcji. Komplet postawiony na kolumnach 0–2 przejąłby id 133/134,
> **użyte na mapie wsi po 3 razy**, i każda ławka w Zagajach zamieniłaby się
> w kawałek strzechy. **Test [7] tego nie łapie** — sprawdza kolizje tylko
> wewnątrz `kafle`. Przy dopisywaniu czegokolwiek sprawdzaj wolne komórki
> w `docs/budynki.json`, nie w `zbuduj_kafle()`.
>
> ⚠ **Arkusz nie może urosnąć o wiersz.** `Buildings` ma dokładnie 152 kafle
> (19×8), a kolejne tilesety w obu mapach startują od `firstgid` = 362 + 152
> = **514** (Kuznia) i **571** (Pole). Dziewiąty wiersz przesunąłby oba
> zestawy o 19 i przemalował całe wyposażenie kuźni oraz wszystkie pola.
> Nowe kafle idą więc w **wolne komórki istniejących wierszy**.
>
> ⚠ **`build_budynki.py --zapisz` kasował kafle doklejone z zewnątrz** —
> odtwarzał arkusz wyłącznie z `zbuduj_kafle()`, więc `lawka_l`/`lawka_p`/
> `barrel_0` znikały z gry bez śladu w raporcie. Naprawione: `main()`
> przepisuje piksel w piksel każdy kafel, który jest w `budynki.json`, a nie
> jest generowany (rozpoznanie po NAZWIE, nie po komórce — kafel własny wolno
> przesunąć, cudzego nie), i twardo przerywa, gdy nowy kafel celuje w zajętą
> komórkę. Zweryfikowane: po zapisie wszystkie **91** wcześniejszych kafli
> jest bajt‑w‑bajt identycznych na tych samych id.
>
> ### Rzuty L / T / U — kosz (dolina), 4 kafle (2026-08-11)
>
> Osobna sprawa od przybudówki i **ważniejsza**: budynek, którego rzut z góry
> jest literą L, T albo odwróconym U — skrzydło wychodzące **na gracza**
> wcinające się w połać skrzydła biegnącego w głąb. Wszystkie trzy kształty
> to **ten sam styk**, tylko powtórzony (skrzydło przy końcu / w środku /
> przy obu końcach), więc jeden komplet obsługuje je wszystkie.
>
> Kafle: `dolina_szczyt_0/2` i `dolina_skos_0/2` (id **140–143**, wiersz 7,
> kolumny 7–10).
>
> ⚠ **Dlaczego to wymagało kafli, a nie tylko układu.** `szczyt` i `skos` są
> **z definicji przezroczyste na zewnątrz przekątnej** — tak powstaje sylwetka
> szczytu (zmierzone: po 496 px przezroczystych, 76% w górnej połowie kafla;
> wszystkie `_kal` są w pełni kryjące). Na mapie kafel skrzydła bliższego
> **zastępuje** kafel dalszego w tej samej komórce, więc ta przezroczystość
> zamienia się w **trawę**. Skutek: szczyt bliższego skrzydła nie mógł wejść
> w połać dalszego, mógł się tylko pod nią zatrzymać — a dwa dachy, które się
> stykają zamiast przenikać, zawsze czytają się jak dwa budynki. Zgłoszone
> wprost („nie wygląda na połączony, szczyt dachów nie jest złączony").
>
> **Dlaczego tylko cztery kafle.** `_dach_szczytowy` daje każdej kolumnie
> dokładnie JEDEN kafel na górnej krawędzi pasa (`szczyt` przy osi, `skos`
> poza nią), a wiersze powyżej są w planie puste — kafel skrzydła dalszego
> po prostu tam zostaje. Komplet to więc `szczyt`+`skos` razy dwie strony.
> Budowane **z istniejących kafli ramienia** (`kafel_dolina` bierze bazowy
> kafel, wypełnia zewnętrze strzechą i dokłada załamanie), więc nie mogą się
> z nimi rozjechać, a ani jeden piksel oryginału się nie zmienia.
>
> ⚠ **Do kompletu potrzebne są DWIE reguły układu, bez nich kafle nie
> wystarczą:**
> 1. Kafel ramienia lądujący w komórce zajętej przez połać skrzydła dalszego
>    musi zostać podmieniony na wariant `dolina_*`.
> 2. **Okap skrzydła dalszego znika w kolumnach styku** (`okap` → `polac`).
>    Tam, gdzie dachy się zlewają, dach dalszego się nie kończy — biegnie
>    dalej w połać bliższego. Zostawiony okap zwisa postrzępionym frędzlem
>    nad połacią bliższego skrzydła i to on, mocniej niż brak kosza, krzyczy
>    „to są dwa budynki". Zmierzone po obu poprawkach: **0 pikseli trawy**
>    w strefie zlania, we wszystkich trzech kształtach.
>
> **Zostaje do zrobienia:** wpięcie `_dach_przybudowki` ORAZ obu powyższych
> reguł w `kafle_domu` w `build_mapa.py` (generator map nie umie jeszcze
> opisać ani przybudówki, ani skrzydła w `BUDYNKI_NA_MAPIE`) — z asercją na
> konflikt komórek, bo to jedyna rzecz, którą da się tu cicho zepsuć.
> Dopiero potem wpisy z §5 — kurnik Marka, drewutnia, chlewik, chlew Witka,
> warsztat Sobka.

<details>
<summary>Zapis stanu sprzed 2026-08-11 (dlaczego było niewykonalne)</summary>

### 7.3b ⚠ Przybudówki są dziś NIEWYKONALNE — i to blokuje konkretne wpisy

Zweryfikowane w `docs/budynki.json` (2026-08-10): komplet ma **91 kafli i ani
jednego do przybudówki**. Nie ma dachu jednospadowego, nie ma narożnika „dach
styka się ze ścianą", nie ma kafli wspólnej ściany. Każdy budynek jest
**samodzielnym prostokątem** z dachem kalenicowym albo szczytowym `/\`.

Jedyne, co komplet daje w stronę „otwartej szopy", to `otwarty=(od,do)` —
zamienia OSTATNI rząd ściany na słupy (`wiata_slup_1`/`wiata_1`). To nadal
osobny budynek stojący obok, nie przybudówka.

Co z tego wynika dla wpisów w §5, żeby nikt nie próbował ich „po prostu
postawić":

| wpis | status |
|---|---|
| „kurnik **przystawiony do chałupy**" (§5.1, obejście Marka) | ❌ dosłownie przybudówka — czeka na kafle |
| drewutnia, chlewik (§5.1), chlew Witka (§5.4), warsztat Sobka (§5.7) | ⚠ wykonalne **tylko** jako osobne budynki z odstępem |
| owczarnia Gniewka (§5.9) | ✅ zrobione tak właśnie — osobna wiata obok chałupy |

To nie jest powód, żeby doklejać budynki „na styk" i udawać przybudówkę:
dwa prostokąty stykające się ścianami dadzą dwa pełne dachy wrastające w
siebie, czyli dokładnie ten rodzaj wizualnej wpadki, który przy kominie i
kalenicy kosztował już czas (`CLAUDE.md`). Odstęp albo nic.

**B17 — komplet przybudówki (dach jednospadowy), szacunek ~12–16 kafli.**
Jedyna pozycja w §7, która długo nie miała wyceny, a blokuje najwięcej wpisów
z §5. Kalibracja: sam dach szczytowy `/\` kosztował **~28 kafli**, bo każde
pasmo biegnące po skosie musi nieść kawałek sąsiedniego pasma (`szczyt`,
`*_kal`, `*_okp`, `okap_skos`, `podokap`, `kon_*`). Jednospadowy jest tańszy —
jedna połać, bez kalenicy i bez ściany szczytowej — ale ma własny problem,
którego dach szczytowy nie ma:

| element | ile | uwaga |
|---|---|---|
| połać jednospadowa (lewa / środek / prawa) × (rząd górny / środkowy / okap) | 9 | środek powtarzalny, brzegi nie |
| **styk ze ścianą budynku głównego** | 3 | ⚠ to jest ta część, której komplet nie ma w żadnej postaci — górna krawędź połaci nie kończy się okapem, tylko **wchodzi w ścianę**, i ta ściana musi być nad nią |
| narożniki styku (lewy / prawy) | 2 | ta sama reguła co `_naroznik_okapu`: pasmo wylewa się poza swój kafel |
| słupy otwartej przybudówki | 0 | **reużywamy** `wiata_slup_1`/`wiata_1` |

⚠ **Kolejność warstw przy przybudówce jest odwrotna niż przy dachu głównym.**
Dach budynku idzie na `buildings-over` (nad postaciami). Przybudówka **wchodzi
pod** ścianę budynku głównego, więc jej połać musi rysować się PRZED tą
ścianą — inaczej wystaje na nią i wygląda jak naklejka. To prawdopodobnie
oznacza osobną warstwę albo świadomy podział połaci, i jest to rzecz do
rozstrzygnięcia **przed** rysowaniem kafli, nie po.

Miejsce w arkuszu jest: `Buildings.png` ma dziś 91 nazwanych kafli na 152
komórki (19 × 8), czyli **61 wolnych** — komplet przybudówki zmieści się bez
powiększania arkusza. ⚠ Dopisywać **nowymi wierszami**, nigdy kolumną: `id =
wiersz * 19 + kolumna`, więc kolumna przenumerowałaby całą mapę (patrz
`CLAUDE.md`).

</details>

### 7.4 Świadomie NIE robimy teraz

- **Wnętrz** — trzy izby (`swiat.md`) po ustabilizowaniu zewnętrza.
- **Zastępników** dla B1–B2. Płot żerdziowy **nie udaje** palisady, a chałupa
  **nie udaje** młyna. To jest reguła O6 i dokładnie ten błąd kosztował już
  czas przy kominie i kalenicy.
- **Harmonogramu dnia mieszkańców.** Do tego czasu rekwizyty (O4).

---

## 8. Co z tego wynika dla kodu

Nie do zrobienia teraz — do policzenia, ile to jest.

| # | rzecz | rozmiar | uwaga |
|---|---|---|---|
| K1 | ~24 nowe wpisy w `Npcs.ts` + spawny w Tiled | mały, powtarzalny | każdy NPC to blok konfiguracji + punkt |
| K2 | **audyt gęstości O1** | mały skrypt | 30 NPC × sprawdzenie > 96 px; ten sam przemiot, którym sprawdzono Kowala |
| K3 | kolizje kafli w wiosce | średni | dziś **0 kafli kolizji**; palisada bez kolizji to malowidło |
| K4 | encja „kura" (+ świnia z gotowej grafiki) | jak przeciwnik | B3/B4 |
| K5 | wpięcie `pole_tileset.png` jako tileset + warstwa `pola-over` | mały | **✅ zrobione poza `-over` (E1, 2026-08-11)**: tileset „Pole" zarejestrowany (firstgid 571), katalog `docs/pole.json` (`tools/katalog_pole.py`), wszystkie trzy niwy pomalowane na warstwach `pola` (ziemia) + `uprawy` (roślina). `pola-over` wciąż niemożliwe — `pole_over_*.png` to 17 luźnych plików bez spakowanego arkusza; dotyczy **wyłącznie warzyw korzeniowych**, bo zboże i len mieszczą się w kaflu. Patrz CLAUDE.md |
| K6 | typy celów zadań: „porozmawiaj z X", „załóż przedmiot" | średni | `QUESTS` zna dziś tylko „zbierz N" |
| K7 | wnętrza (3 mapy + portale) | duży | portal mapa↔mapa **już działa** |
| K8 | `greetings` zależne od stanu dla starców przy studni | mały | najtańsza reakcja świata (6.2) |
| K9 | osobne tło dźwiękowe wsi | mały | dziś gra las również w wiosce |
| K10 | **generator wczytuje `.tmj` jako stan bazowy i DOPISUJE, nie buduje od zera** | średni, **pilny** | patrz 1.2a. Ustalony kierunek (user): generator parsuje istniejącą mapę do tych samych struktur (`Warstwa`, obiekty) zamiast tworzyć puste warstwy, i nową masową treść (pole, palisada, drzewa) **dopisuje na wczytanym stanie**. Mechanizm musi być prosty i bezpieczny: **wypełnia tylko puste kafle, nigdy nie nadpisuje zajętych** — `.tmj` nie ma metadanych „kto to postawił", więc „pusta komórka = wolno" jest jedynym rozróżnieniem, jakie się da zrobić. Konsekwencja: dzisiejsze pełne przemalowanie warstwy `ground` w `build_wioska.py` (losowa trawa dla KAŻDEJ komórki, bezwarunkowo) trzeba zmienić na „tylko puste komórki", inaczej pierwsze dopisanie nadpisałoby ręczne poprawki. Dla decyzji o KONKRETNYM umiejscowieniu (budynek, NPC, prop) generator nie decyduje sam — raportuje propozycję (współrzędne + uzasadnienie) i czeka na rozstrzygnięcie w Tiled, zamiast pisać to od razu |

---

## 9. Etapy

Każdy etap ma się kończyć czymś, co da się **zobaczyć w grze**, nie
„przygotowaniem do".

| etap | zawartość | efekt dla gracza |
|---|---|---|
| **E0** ✅ | ten dokument + `prompt_wioska.md`; rozstrzygnięcie D-1…D-8 | zrobione |
| **E1** ✅ | rozstawienie **istniejących** rekwizytów (ławka, beczka, koryto, stóg, płot) po obejściach + `pole_tileset` na trzech niwach | wieś przestaje być pusta; **zero nowej grafiki**. **Stan (2026-08-10, niezacommitowane — czysta praca robocza na `.tmj`/kodzie):** 7 rekwizytów postawionych (2× ławka-para przy Dobku/kuźni, ławka-para u Marka i Sobka, 2× koryto u obory/Witka, stóg u Dobka), pierwsza z trzech niw (ugorowa) obsadzona 20 kaflami `pole_tileset`. ⚠ **Stóg stał przez jakiś czas jako 1/4 stogu** — to CZTERY kafle (`stog_0..3`, układ 2×2, indeks `kol*2 + wiersz`), a postawiony był tylko `stog_0`. Zgłoszone jako „masz tylko 1/4 ula", bo sam lewy górny narożnik czyta się właśnie jak ul. Uzupełnione; obie mapy przeskanowane, zero niekompletnych rekwizytów. To już **drugi** raz, kiedy rekwizyt wielokaflowy wyszedł połowiczny (wcześniej ławka) i **za każdym razem złapane ze zrzutu, nigdy z raportu** — przed postawieniem czegokolwiek sprawdź w `docs/budynki.json`, ile kafli ma dana rodzina. **Domknięte 2026-08-11:** niwa **południowa** (żyto, x18-46/y77-86, na zachód od drogi) i **wschodnia** (owies/jęczmień na przemian z kwitnącym lnem, x66-78/y70-86) — 457 kafli ziemi + 457 kafli uprawy. Wymagało **dwóch warstw**: z 13 kafli zboża tylko 3 to `rola: grunt`, a lnu i naci **ani jeden**, więc `pola` niesie ZIEMIĘ (`grunt`+`czysty`), a nowa warstwa `uprawy` ROŚLINĘ (`nakladka`) — przez jej dziury widać bruzdy. Zagony **poziome**, bo droga główna biegnie pionowo (x50-51), pasy po 2–3 wiersze; ⚠ sąsiednie pasy nie mogą mieć tego samego wariantu, bo między zagonami nie ma miedzy w kaflach i to **wyłącznie** różnica uprawy rysuje granicę. Warzywa korzeniowe świadomie pominięte — z 17 kafli ciętych na pół **16 to `korzeniowe`** (siedemnasty to `pedy_mlode_5`), a bez działającej warstwy `-over` byłyby bez wierzchołków. Stanowisko krwawnika z (74,82) przeniesione na łąkę (80,74): wycięcie pola wokół niego dawało polanę 5×5 w środku lanu, a niwa jest treścią autorską, podczas gdy stanowisk jest z założenia więcej niż roślin. **Ugór poszerzony** z symbolicznych 20 kafli do pełnej trzeciej niwy (x18-46/y27-36, ta sama szerokość co południowa) — ale **malowany inną regułą i to jest sedno trójpolówki**: ta sama struktura zagonów, za to krycie ~48%, pasy na przemian zaorane / ścierniskowe / zarastające odrostami / zostawione samą trawą pod wypas owiec Gniewka (§5.9). Zamalowany tak gęsto jak żyto przestałby być ugorem, a trzy identyczne pola pokazują trzy pola, nie płodozmian. Paleta prawie nie potrzebuje drugiej warstwy: `ugor_bruzdy_pion_*` i **`pedy_kielki_*` (id25-28, ziemia z kiełkami)** to pełne kafle `grunt`; tylko ściernisko jest `nakladka`. **Stanowiska rumianku i krwawniku zostają w lukach celowo** — `HERBS[*].siedlisko` mówi „otwarte, słońce", więc ugór jest dla nich siedliskiem właściwym, w przeciwieństwie do łanu żyta, z którego krwawnik trzeba było wyprowadzić. **Zostaje:** rekwizyty u kuźni (jest, ale można dołożyć), płot poza progiem bramy. ⚠ **Rekwizyty Sobka i Witka stoją przy PRZYPISANYCH im budynkach (chata wschód 1/2), nie przy samych postaciach** — Sobek i Witek nadal stoją tam, gdzie ich GameConfig każe im stać „prowizorycznie" (osobno, czekając na swój warsztat/chlew), 330-435px od własnego rekwizytu. Nie poprawione w E1 — przesunięcie NPC to decyzja treściowa (patrz K1 w sekcji 8), nie rzecz do zrobienia przy okazji. Metoda dla wszystkiego powyżej: dedykowany, jednorazowy append-only skrypt Python (NIE `build_wioska.py --zapisz` — K10 wciąż nie istnieje), osobny dla każdej poprawki, nie zachowany jako narzędzie w `tools/`. |
| **E2** | palisada + brama (B1) + kolizje (K3) | „za palisadą" zaczyna coś znaczyć. ⚠ **Kolizje (K3) nie muszą czekać na palisadę** i po E1 są pilniejsze: stoi dwanaście budynków i przez każdy da się przejść, a jedyna kolizja w całej wsi to krąg studni. Palisada wymaga ~12 nowych kafli (pierwsze prawdziwie graficzne zadanie w tym planie), kolizje budynków — zera. Do rozważenia rozbicie E2 na E2a (kolizje, dane) i E2b (palisada, grafika) |
| **E3** | kury i świnie (B3, B4) | podwórza żyją |
| **E4** | pozostali mieszkańcy jako obecność (K1, K8) | wieś ma 30 dusz |
| **E5** | młyn (B2) + przeniesienie Myśliwego (D-1) | ekonomia domknięta, pętla las↔wieś bez podatku |
| **E6** | wnętrza (K7) | prolog da się zagrać |

---

## 10. Decyzje

Osiem rzeczy, których ten dokument nie rozstrzygał sam — teraz wszystkie
mają odpowiedź (D-1…D-6 z pierwszego przejścia, D-7 i D-8 dopisane
2026-08-10). Zapisane z uzasadnieniem, żeby nie trzeba było ich
odtwarzać przy kolejnym przejściu.

**D-1. Czy Myśliwy przenosi się z lasu na przedpole wsi? — ✅ ROZSTRZYGNIĘTE:
tak, w E5, po palisadzie.**
Zgodne z kanonem `swiat.md`, domyka oś częstotliwości (4.1), sprawia, że
wieś ma po co istnieć, i sprzedaż łupu przestaje kosztować bieg. Dopiero
gdy przedpole ma palisadę — inaczej „mieszka poza murem" nie jest widoczne
i przenosiny nic nie znaczą. Jego dzisiejsza pozycja w lesie ma **zmierzone,
asercjonowane** odległości do ogniska (115 px, wymóg > 92) i do Kowala —
przeniesienie oznacza powtórzenie tych pomiarów po drugiej stronie, nie
przeciągnięcie punktu.

**D-2. Skąd woda pod młyn — ✅ ROZSTRZYGNIĘTE: młyn na południu wsi, przy
bramie, na zachodniej flance jednego pasa z Myśliwym; własny lokalny
staw + jaz, nie rzeka przez całą mapę.**
Pierwsza propozycja (młyn daleko na północy, z dala od bramy) zakładała
mirror geografii `swiat.md` 1:1 — ale user zdecydował inaczej: młyn ma
stać na południu, blisko lasu, tak jak reszta „rzemiosł zależnych od
surowca" (patrz D-3). Żeby nie ścisnąć młyna, Myśliwego i zielarki na tym
samym wąskim pasie w linii, rozstawiamy ich na **trzech flankach jednego
pasa** (y 76–99): Myśliwy w centrum przy bramie, młyn na zachodzie,
zielarka na wschodzie — patrz zaktualizowany schemat w 4.2. Woda: rzeka
leśna (`forrest.tmj`) i wioska **nie są dziś hydrologicznie połączone**
(zero mostu danych między mapami poza portalem), więc ciągnięcie jednej
rzeki przez obie mapy nic by nie kosztowało realizmu, za to dużo kafli.
Młyn dostaje **własny, samodzielny zbiornik** w rogu mapy — mniejsze koło,
skromniejszy młyn, i to pasuje do małej wsi.

**D-3. Czy zielarka zostaje sprzedawcą mikstur — ✅ ROZSTRZYGNIĘTE: tak,
proste mikstury teraz; szkolenie odłożone jako „może kiedyś", nie
zobowiązanie.**
Mikstury nie mają dziś sprzedawcy, a cała ekonomia HP (regen → jedzenie →
mikstura) jest zaprojektowana wokół tego, że mikstura jest droga i działa w
walce. Dorota sprzedaje — mały, drogi sklep, zakup przed wyprawą, nie
uzupełnienie w biegu. **Lokalizacja zmieniona względem pierwszej wersji
planu**: nie „na uboczu wewnątrz palisady" (x 70–75, y 40–46), tylko na
**wschodniej flance pasa południowego** (x 80–90, y 78–86) — blisko lasu i
łąk, bo stamtąd bierze zioła. To jest silniejszy, bardziej konkretny powód
niż utrzymanie sztucznego dystansu od bramy jako przeszkody; odległość
zostaje zachowana inaczej — bocznie, nie na trasie (patrz 4.1). Zielarki
tradycyjnie trzymały się na uboczu — teraz to widać na mapie, nie tylko w
opisie postaci.

**D-4. Stolarz: klimat czy trwałość sprzętu? — ✅ ROZSTRZYGNIĘTE: klimat.**
`swiat.md` stawia to wprost: stolarz „naprawia" rzeczy, których trwałości nie
ma. Albo powstaje durability, albo Sobek zostaje klimatem. Wybieramy klimat —
durability to nowy system ekonomiczny do zbalansowania w grze, która ma
jeszcze niezałatane `Siła jako płaski bonus` (patrz ⏳ w `CLAUDE.md`). Sobek
robi wozy i beczki, i to wystarczy, żeby istniał. Rewidowalne, jeśli kiedyś
powstanie realny powód do durability — nie jest to teraz.

**D-5. Nazwa „dom gracza" w generatorze — ✅ ROZSTRZYGNIĘTE I ZASTOSOWANE
(2026-08-10).** Rozstrzygnięcie 1.2b oznacza, że budynek nazwany w kodzie
`"dom gracza"` przestaje nim być (przejmuje go Dobek). W `build_wioska.py`
zmienione na `"chalupa Dobka"` — jako **osobna, jednolinijkowa zmiana od
razu**, nie odłożona do przebudowy generatora pod K10 jak pierwotnie
planowano: K10 wciąż nie istnieje, a nazwa w rusztowaniu i tak nie wpływa
na `.tmj` (nikt nie odpalił `--zapisz`), więc nie było powodu czekać.

**D-6. Dzieci — kolizja czy duch? — ✅ ROZSTRZYGNIĘTE: całkiem nieruchome,
bez animacji, bez kolizji.**
Węższe niż moja pierwsza rekomendacja (animacja w miejscu) — user wybrał
**statyczne** postaci. Konsekwencja: skoro się nie ruszają, problem kolizji
nigdy nie powstaje sam z siebie — dziecko jest w praktyce **rekwizytem z
twarzą**, tej samej kategorii co ławka czy stóg siana (O4). Tańsze niż
animacja w miejscu, i nadal spełnia test z sekcji 11 („czy widać, że ten
człowiek żył tu wczoraj").

Skąd „~6 kafli szerokości" na telefonie, o co user zapytał wprost: gra
renderuje się w `Phaser.Scale.RESIZE` (`src/main.ts:21`) — canvas wypełnia
100% szerokości okna **w pikselach CSS**, nie fizyczną rozdzielczość
ekranu. Telefon dzieli fizyczną rozdzielczość przez `devicePixelRatio`
(na Androidzie zwykle ~2,75–3×), więc nawet flagowiec z ekranem 2340×1080 px
(np. Samsung S21 FE) raportuje przeglądarce **~360–412 px CSS** szerokości —
praktycznie tyle samo, co budżetowy telefon. Przy `setZoom(2)`
(`GameScene.ts:118`) i kaflu 32 px: `360÷64 ≈ 5,6`, `412÷64 ≈ 6,4` kafla.
Liczba nie zależy od jakości ekranu — to jest dokładnie to, po co istnieje
`devicePixelRatio`: żeby strona nie robiła się mikroskopijna na gęstszych
wyświetlaczach. Zdanie „na telefonie widać ~6 kafli szerokości" zresztą
**już było w `swiat.md`** przed tą sesją — nie jest wymyślone tutaj, tylko
potwierdzone z kodu.

**⚠ D-7. Otwarte (dotyka kodu, nie tylko planu): zoom ×2 jest za duży dla
budynków wiejskich.** Zwizualizowane interaktywnie w tej sesji: przy ×2
chata (6 kafli) zajmuje **~108% szerokości ekranu** (nie mieści się w
całości), stodoła (10 kafli) **~180%** (trzeba przewijać wzrokiem). Przy
×1,25 obie mieszczą się z zapasem (~9 kafli w poziomie). Zoom ×2 był
ustawiony z komentarzem „chunkier action feel" (`GameScene.ts:118`) — sensowne
w lesie, gdzie nie ma budynków do pomieszczenia w kadrze; wioska to
ujawniła. Trzy opcje na przyszłość, żadna nie jest decyzją tego planu (to
already zmiana w kodzie): (1) zmniejszyć zoom globalnie, (2) osobny,
mniejszy zoom tylko dla mapy wioski (`GameScene` już zna `mapId`),
(3) projektować budynki węższe/głębsze zamiast szerokich — częściowe
obejście, bo stodoła i tak musi być gdzieś szeroka. Do rozstrzygnięcia przed
E1, bo wpływa na to, jak czytelne będą rekwizyty i budynki na ekranie.

⚠ **Wciąż nierozstrzygnięte — E1 ruszyło mimo to (2026-08-10).** Pierwsze
rekwizyty i pierwsza niwa `pole_tileset` stanęły na mapie zanim ktokolwiek
wybrał jedną z trzech opcji wyżej. To działa (nic nie jest technicznie
zepsute), ale czytelność tych detali na docelowym ekranie telefonu jest
wciąż niesprawdzona — jeśli zoom ma się zmienić, warto zweryfikować, czy
ławka/koryto/stóg (małe, jednokaflowe) nie giną wtedy zupełnie w kadrze,
zanim dołoży się ich więcej.

**Zoom ×2 zostaje na razie — decyzja świadoma (2026-08-10), nie
przeoczenie.** Testowanie idzie dziś na komputerze, gdzie ×2 wygląda
dobrze; etap wejścia na telefon (Capacitor/Android, patrz ⏳ w
`CLAUDE.md`) jest jeszcze daleko, więc rozstrzyganie zoomu pod telefon
teraz byłoby przedwczesne. Problem z czytelnością budynków na wąskim
ekranie (opisany wyżej) nie zniknął — jest odłożony razem z całym
pakietem mobilnym, do rozwiązania w jednym przejściu z resztą punktów
z `CLAUDE.md`'s Capacitor/Android checklist entry (integer zoom +
`HUD.barWidth`), nie osobno.

**D-8. Ekonomia zwierząt — ✅ ROZSTRZYGNIĘTE (2026-08-10): jedna para wołów
w całej wsi, wyłącznie u Sołtysa; pozostałe gatunki zrewidowane w dół
(§3.4).**
Pierwsza wersja tabeli (§3.4) była ekonomicznie zawyżona dla dziesięciu
gospodarstw tak małej, biednej wsi — potwierdzone niezależnym audytem
(Gemini) i skonfrontowane z tym, co NPC już mówią w grze. Dwie decyzje
składowe:
- **Woły: Dobek traci „własną parę".** Wcześniejsza karta (§5.2) dawała mu
  osobne woły OBOK pary Sołtysa — ale to podważało sens Sołtysa jako
  „wierzyciela połowy wsi" (jeśli największy gospodarz ma własne woły, nie
  jest nikomu winien odrobku za nie). Jedna para, wyłącznie u Sołtysa, jest
  silniejsza fabularnie: dług ojca bohatera i Dobka wobec niego jest teraz
  bez alternatywy. Wymagało poprawki kwestii Hanny (`woly_rywalizacja`,
  `GameConfig.ts`), która wcześniej zakładała dwóch niezależnych właścicieli
  ścigających się wołami — przerobiona na rywalizację jednostronną (Dobek
  orze na pożyczonych i mimo to bije Sołtysa czasem, ale nie ma jego konia).
- **Liczby fabularne, nie tylko liczba sprite'ów, idą w dół.** Świadomie
  odrzucony model „34 owce w lore, 3 na mapie" — skoro dialog Gniewka
  (`czyje_owce`, `pasterz_wilk`) wypowiada konkretne liczby, mają się
  zgadzać z tym, co faktycznie istnieje w świecie, nie tylko z tym, co
  narysowane. Nowe liczby (§3.4) są też tym, co kiedyś, przy większej
  liczbie widocznych sprite'ów na mapie, będzie tam stało.

---

## 11. Test, którym to sprawdzać

`swiat.md` daje jedno kryterium i ono obowiązuje też tutaj:

> Gracz ma odnieść wrażenie, że Zagaje istniały długo przed rozpoczęciem gry
> i będą istnieć, gdy bohater stąd odejdzie.

Operacyjnie, dla każdego obejścia:

1. **Czy widać, że ten człowiek żył tu wczoraj?** (rekwizyt, nie dialog)
2. **Czy widać, z czego je?** (ogród, kury, zagon — O5)
3. **Czy widać, komu jest coś winien?** (woły, odrobek, miarka — sekcja 3)
4. **Czy da się to przebiec, nie zwiedzając?** (O3)
5. **Czy dwóch NPC nie stoi bliżej niż 96 px?** (O1)

Obejście, które przechodzi całą piątkę, jest gotowe. Które nie — jest
dekoracją, i trzeba wiedzieć które.

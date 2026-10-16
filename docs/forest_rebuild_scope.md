---
typ: HISTORIA
domena: world
tytul: Las — zakres przebudowy w Tiled
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-31
---


> ⚠⚠ **2026-10-04: etap OTWARTY PONOWNIE decyzją autora** —
> `docs/decyzje/2026-10-04-rozstaw-lasu.md`. Las ×1,5 (240×90), odstęp pni we
> wnętrzu ≥ 84 px, polana pod każdym spawnem. Liczby drzew, współrzędne i
> rozmiar mapy z tego dokumentu opisują stan SPRZED rozstawu.

# Las — ZAKRES PRZEBUDOWY W TILED (dokument roboczy dla level designera)

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/world.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> # ✅✅ ETAP ZAMKNIĘTY — 2026-08-31, decyzja autora
>
> ```
> LAS — ART / WORLD DESIGN = CLOSED
> LAS — GAMEPLAY / AI = READY FOR RUNTIME TESTING
> ```
>
> Zamknięte tym zdaniem: finalny zestaw 7 gatunków drzew + nowy buk, 21
> pniaków, jeden system 23 kamieni (stary pack całkowicie wycofany), 286
> krzewów, 72 stanowiska ziół, 244 obiekty flory wodnej, finalne podłoże,
> obecny model twardych kolizji (`map.solids`), `NavGrid`, `PathSolver` +
> `PathFollower` (cały ruchomy roster `Enemy`+`Critter`), `SteerSolver` jako
> lokalny fallback, LOS-check sieciarza, poprawki spawnów wilka #4 i
> niedźwiedzia, umiarkowany wzrost populacji (23→26 + ptaki 3→5). Pełny zapis
> decyzji i liczb: `docs/dziennik.md` 2026-08-31 (4), (5), (6).
>
> ⚠ **NIE OTWIERAĆ PONOWNIE etapów assetowych/world-space bez konkretnego
> błędu wykazanego w DZIAŁAJĄCEJ GRZE.** Świadomie pozostawione jako gameplay
> polish, nie jako luka do domknięcia: wilk #2 (16 px prześwitu na spawnie —
> lokalnie odcięta kieszeń, PathSolver bezpiecznie wraca do surowego ruchu),
> standard prześwitu (§10 `las_faza1b_final.md`, formalnie nierozstrzygnięty,
> ale NIEBLOKUJĄCY — PathSolver go obchodzi), soft-collision krzewów
> (`speedMultiplierAt`, zaprojektowane miejsce w `MovementContext`, świadomie
> niewdrożone).
>
> ⚠ **To zamknięcie NIE obejmuje reszty pierwotnego zakresu TEGO dokumentu.**
> **A9 · Brzeg Północny** i **A10 · Źródło** (kolumny x100–159, strukturalnie
> gotowe od resize'u, teren dalej NIEPOMALOWANY) oraz pełny cel populacji Z-9
> z `las_faza1b_final.md` (wrogowie 19→25, ambient 7→15 — dziś jesteśmy
> dopiero na 23→26 ambient/wrogów łącznie) **zostają OSOBNĄ, przyszłą
> decyzją** — nie są ani zamknięte, ani odrzucone, po prostu poza tym etapem.
> Kolejny etap to **testowanie tego świata w działającej grze** (runtime
> PathSolver, ruch wszystkich stworzeń, LOS sieciarza, stuck detection,
> ewentualne soft-collision krzewów) — nie dalsza przebudowa geometrii.

**Status: ZAKRES PRAC. Nie jest to projekt kafli ani implementacja.** To jest
lista tego, **co i gdzie zmienić**, dla osoby, która otworzy Tiled.

> ✅ **SYSTEM DRZEW GOTOWY (2026-08-29).** Las jest zmigrowany na model
> obiektowy: 1633 drzewa jako tile-objecty na warstwie `trees` (tileset
> **TreeStamps**), `trees-base`/`trees-over` skasowane. Rozmieszczenie 1:1 ze
> stanu sprzed migracji — **to jest baza do ręcznej przebudowy layoutu, o której
> jest ten dokument.** Jak stawiać/przesuwać drzewa: `docs/tree_instances.md`
> §5a. §6.2 (drzewa) — zaktualizowane, D9/R-10 nieaktualne. ⚠ Nie uruchamiać
> ponownie `migrate_forest_trees_to_objects.py` (R-11).

**Powstał na brief z konsultacji zewnętrznej (2026-08-27)** — patrz
`prompt_collision_review.md` po kontekst. ⚠ **Brief przyszedł od recenzenta,
który widział tylko `las_projekt_docelowy.md` i `las_audyt_level_design.md`,
a NIE widział `las_faza1b_final.md` ani tego, że Step 0–2 są już wdrożone.**
Rozbieżności rozstrzygnięte przez autora są oznaczone w §0.

> ⚠⚠ **CZĘŚCIOWO NIEAKTUALNE 2026-08-28 — mapa docelowo 160×60, nie 140×60,
> i dostała DWA nowe pasma zamiast wydłużonego A8.** Po review Senior Game
> Architecta (dziennik 2026-08-28): **A8 zostaje przy x112–139** (bez zmian
> treści z tego dokumentu — ruiny, barłóg, obsada), **A9 · Brzeg Północny**
> (x80–140, y0–16, **niedźwiedź** — rozstrzyga sprzeczność S4 vs ten
> dokument na korzyść północy) i **A10 · Źródło** (x140–159, cała wysokość,
> mokradło źródłowe rzeki, 2 skoczki, tożsamość pozytywna zamiast „najciszej
> jak się da"). Techniczny resize wykonany — `PROJECT_CHECKPOINT_RESIZE160.md`.
> **Diagram §4, tabela §5 i lista prac §6 niżej opisują wciąż wariant 140×60
> ze starym A8 jako jedynym rozszerzeniem — nie malować z nich wprost, dopóki
> nie powstanie zaktualizowana wersja przy terrain passie.** Populacja
> (Z-9) też ponownie otwarta — kierunek: wrogowie 19→25, ambient 7→15,
> rozkład rdzeń+peryferie, nie proporcjonalne mnożenie.

## Jak się ma do pozostałych dokumentów

| plik | rola | co z niego wciąż obowiązuje |
|---|---|---|
| `las_faza1b_final.md` | **plan wykonawczy, decyzje Z-1…Z-10** | wszystko poza Z-6 (patrz §0) — rozmiar 140×60, rozbudowa tylko na wschód, brak zmian współrzędnych x 0–99, rzeka E→W, bród, wilki jako anomalia, linia ubytku, +0 mobów, Myśliwy na skraju |
| `las_projekt_docelowy.md` | uzasadnienia „dlaczego" | §8 (warstwa ludzka) — **ten dokument jest jego rozwinięciem**, nie zaprzeczeniem |
| `las_audyt_level_design.md` | pomiar stanu wyjściowego | §1.3, §2.3, §4.1 — trzy dowody, na których stoi cała przebudowa |
| **ten plik** | **co zrobić w Tiled** | — |

⚠ **Nie powtarzam tu uzasadnień.** Jeśli coś wygląda na arbitralne, powód jest
w jednym z trzech plików wyżej.

---

## 0. Co zmienia ten dokument wobec zatwierdzonego planu

**Jedna zmiana, zatwierdzona przez autora 2026-08-27:**

> **P6 · STARA PUSZCZA przestaje istnieć w tej mapie. Pasmo x 112–139 staje
> się A8 · KONIEC GOSPODARKI.** Prawdziwa stara puszcza jest odłożona na
> osobną, przyszłą mapę za bramą do Gęstwiny.

Konsekwencje, każda rozstrzygnięta:

| co | rozstrzygnięcie |
|---|---|
| **Z-6 — niedźwiedź do starej puszczy** | **zostaje w mocy co do KIERUNKU, zmienia się nazwa celu.** Powód Z-6 to nie „puszcza", tylko „614 px od Myśliwego się nie broni". Niedźwiedź idzie na wschód, do zarzuconego wyrębu w A8 — obraz nawet lepszy niż „niedźwiedź w puszczy": zwierzę zajmuje miejsce, które ludzie porzucili |
| **Ruiny starsze niż Zagaje** | **wypadają z tej mapy**, przechodzą na przyszłą mapę starej puszczy. W lesie gospodarczym byłyby obcym ciałem |
| **Pusty barłóg** | **zostaje w A8.** Nadal tłumaczy watahę z A5b bez jednego słowa — a w zarzuconym wyrębie działa tak samo dobrze |
| **Zwarcie ≥ 75 % w skrajnym paśmie** | **spada do 55–65 %.** A8 nie jest starym lasem, tylko młodnikiem i samosiewem na porzuconej gospodarce — gęsto, ale nisko i młodo, nie katedralnie |
| **Brama do Gęstwiny** | **staje się PROGIEM**, nie kolejnym stopniem. Za nią zaczyna się to, czego w tej mapie świadomie nie ma |

⚠ **Reguła Gęstwiny obowiązuje dalej: NICZEGO NIE TŁUMACZYMY.** Zarzucony
wyrąb nie dostaje notatki, tabliczki ani NPC-a wyjaśniającego, czemu ludzie
stąd odeszli.

### 0.1 ⚠ Zależność od `las_faza1b_final.md` §10 — czytaj przed malowaniem

Trwa nierozstrzygnięta sprawa **standardu prześwitu między drzewami** (§10:
52 bramy w lesie mają dokładnie 18 px, tyle co ciało gracza; dzik 22 px nie
przechodzi; zwierzęta ambientowe mają ciała wielkości klatki arkusza).

**Dla tego dokumentu znaczy to tyle:**

- ⚠ **Nigdzie nie podaję prześwitów w pikselach.** Wszędzie, gdzie mowa
  o szerokości przejścia, jest napisane **„prześwit do ustalenia po standardzie
  §10"**. Nie wpisuj tam własnych liczb.
- **Nie projektujemy lasu pod obecne, ślepe AI** — nie robimy sztucznych
  korytarzy ani nie rozrzedzamy lasu, żeby dzik dojechał.
- **Ale nie zakładamy też konkretnego rozwiązania.** Nie planuj niczego, co ma
  sens tylko przy pełnym pathfindingu (np. labiryntów, ślepych zaułków jako
  pułapek, wąskich gardeł jako mechaniki).
- Zasada praktyczna na czas niepewności: **projektuj przepływy, nie bramki.**
  Miejsce ma być przechodnie w wielu punktach, bo tak działa użytkowany las —
  a nie w jednym, bo to zawsze będzie zależne od liczby, której jeszcze nie ma.

---

## 1. Diagnoza w trzech liczbach — po to, żeby wiedzieć, co się naprawia

**Nie chodzi o liczbę drzew.** Chodzi o to, że nic się od niczego nie różni.

1. **Podłoże nie niesie żadnej informacji.** Sześciostopniowa skala gęstości
   trawy, średnia w blokach 10×10 na całej mapie: rozstęp **2,3–2,9**.
   Sześćdziesiąt bloków, jednorodny szum. `Teren.png` ma gotowe `ziemia 1/2`,
   `kamien 1/2`, `listowie 1/2` — **nieużyte poza brodem**.
   (`las_audyt_level_design.md` §1.3)
2. **Nie ma ani jednej polany.** Otwartej przestrzeni jest 45 %, ale w dwóch
   największych plamach o bounding boksach obejmujących **pół mapy i całą
   mapę**. To nie są polany — to jedna prześwitująca dziura biegnąca przez
   wszystko. Drzewa stoją pojedynczo, równomiernie i **nigdzie się nie
   stykają**. (§2.3)
3. **28 % mapy leży dalej niż pół kadru telefonu od czegokolwiek żywego**,
   największa pustka to 1250 px. Cała północ (50 % powierzchni) mieści
   **jednego** wroga. (§4.1–4.2)

Do tego trzy pomiary zrobione na potrzeby tego dokumentu, na żywym `.tmj`:

**Zwarcie koron i gatunki po pasmach dziesięciokolumnowych:**

```
 pas x   zwarcie  trakt  woda  runo |  dąb  buk świerk brzoza grab
 0-9        62%      0    76    4% |   63   21    134     34   120
 10-19      44%      0    78    5% |   65    2    122     12    62
 20-29      56%      0    50    6% |   60   31    114     32    98
 30-39      46%     39    48    7% |   89   84     26     44    30
 40-49      38%     93    44    5% |   81   53     42     28    25
 50-59      54%     20    48    6% |  108   72     45     64    36
 60-69      31%     20    47    9% |   66   46     23     42     9
 70-79      39%      2    44    7% |   72   40     29     70    22
 80-89      40%      0    33    7% |   76   48     44     42    29
 90-99      53%      0    35    6% |   53   65     91     54    57
```

⚠ **Runo (`undergrowth` + `bushes`) nie przekracza 9 % w ŻADNYM paśmie.**
To jest jedna z najtańszych dźwigni w całej przebudowie — runo kosztuje kafle,
nie kod, a robi różnicę między „drzewa na trawniku" a „las".

**Trakt jest jednorodny na całej długości: dokładnie 2 kafle szerokości od
y1 do y59**, z jedną odnogą na wschód w y8–9 (x41→70, do Myśliwego).
Nie poszerza się przy wsi, nie zwęża się w głębi, nie zarasta. **To jest
najbardziej rzucający się w oczy brak gradientu na mapie** — i jednocześnie
rzecz, którą najłatwiej naprawić, bo trakt już istnieje i tylko nie opowiada.

**Ślady ludzi na całej mapie: jeden pniak** (obiekt `pniak`, x2272 y400).

---

## 2. Tożsamość lokacji — jedno zdanie, do którego wraca każda decyzja

> **To jest las gospodarczy Zagajów. Ludzie biorą stąd drewno od pokoleń,
> trakt jest utrzymywany, a im dalej od wsi, tym mniej widać rękę człowieka —
> aż na wschodnim skraju gospodarka się kończy i las zaczyna odbierać swoje.**

Z tego wynikają **dwa gradienty biegnące w tę samą stronę**, i to jest cała
reżyseria mapy:

```
   ZACHÓD/PÓŁNOC ────────────────────────────────────► WSCHÓD/POŁUDNIE
   człowiek:   wyręb czynny → delianki → ostatnie znaki → wyręb zarzucony → nic
   zwierzę:    ptaki, sarny → króliki, lis → dziki      → sieciarze        → niedźwiedź
   las:        młody, cięty → grupy i polany → gęstniejący → samosiew, młodnik
```

⚠ **Gradient człowieka i gradient zwierzęcia są przesunięte o jedno pasmo, nie
zsynchronizowane.** Tam, gdzie znika ostatni ślad pracy, zwierzęta są już duże.
To jest to, co robi napięcie — nie sama gęstość drzew.

---

## 3. Co ZOSTAJE bez zmian

⚠ **Z-3: żaden istniejący obiekt ani kafel w x 0–99 nie zmienia
współrzędnych.** Resize do 140 jest czystym dopiskiem kolumn.

| co | dlaczego zostaje |
|---|---|
| **Rzeka, bród, brzegi (y 16–26)** | ⚠ **przebudowane w Step 2, 2026-08-27** — bród ma realną wodę, profil szerokości regionalnie monotoniczny, 400 kafli piasku, 103 kępki trzciny, jeden spójny zbiornik. **NIE PRZEPROJEKTOWYWAĆ.** Brief recenzenta prosi o zaprojektowanie brzegów, bo recenzent nie wiedział, że są zrobione. Zostają wyłącznie DODATKI z §5.4 |
| **Kolizja pni i chaty Myśliwego** | Step 1A; ⚠ szerokości prześwitów mogą się zmienić po §10, ale sam mechanizm zostaje |
| **Pozycje watahy wilków i Szarego** | **Z-7 — anomalia fabularna.** Zmienia się otoczenie, nigdy pozycja |
| **Pozycje obu dzików** | dzik #1 (kafel 62,34) stoi już na skraju przyszłej olszyny. **Buduje się teren wokół nich** |
| **Chata Myśliwego, ognisko, portal północny** | Z-10 |
| **Dwanaście warstw kafli** | audyt §1.2: podział jest w porządku, nie ruszamy |
| **Liczba stworzeń: 26** | Z-9, bilans +0 |

---

## 4. Podział na obszary

⚠ **Ta sekcja i diagram niżej opisują wariant 140×60 — patrz ramka na
początku dokumentu.** Mapa docelowo jest teraz **160 × 60**: A8 poniżej
zostaje dokładnie taki, jak opisany (x112–139, treść bez zmian), ale przestaje
być ostatnim pasmem — dochodzą **A9 · Brzeg Północny** (x80–140, y0–16,
niedźwiedź) i **A10 · Źródło** (x140–159), żadne z nich nie ma tu diagramu.
Granice A1–A8 poniżej zachowane z `las_faza1b_final.md` §2, żeby oba
dokumenty nie walczyły — zmienia się **treść** A8, nie jego zakres.

```
   x:  0    22        52   60      80        100  112        139
   y0  ┌────┬─────────────────┬──────────┐
       │ A1 │       A2        │    A3    │              (nowe kolumny)
   y16 ├────┴─────────────────┴──────────┤────────────────────────────┐
       │            A4 · RZEKA I BRÓD    │  (przedłużenie na wschód)  │
   y26 ├────┬──────────────┬─────────────┼─────────────┬──────────────┤
       │    │      A5      │     A6      │     A7      │      A8      │
   y36 │A5b │              │  olszyna    │             │    koniec    │
       │bór │  delianki    │  mokradła   │  odległe    │  gospodarki  │
   y48 │wilk│              ├─────────────┤  delianki   │              │
   y59 └────┴──────────────┴─────────────┴─────────────┴──────────────┘
```

---

### A1 · WYRĄB CZYNNY — x 0–22, y 0–16

**Dziś: najmartwiejsza ćwiartka mapy** (największa pustka, 1250 px od
czegokolwiek żywego, jeden lis w całym sektorze).

| | |
|---|---|
| **rola w świecie** | miejsce, z którego Zagaje biorą drewno **teraz**. Pustka dostaje POWÓD |
| **klimat** | jasno, otwarcie, świeżo pracowane. Słychać, że las się tu kończy, a nie zaczyna |
| **gęstość** | **niska, 20–30 %** — i to jest jedyne miejsce na mapie, gdzie niska gęstość jest zamierzona |
| **gatunki** | to, co zostało po cięciu: **młody dąb i brzoza**, pojedyncze duże nasienniki zostawione celowo. ⚠ **Bez świerku** — świerk zaczyna się głębiej |
| **teren** | ⚠ **`ziemia 1/2` w płatach** — pierwszy raz na tej mapie podłoże ma cokolwiek znaczyć. Koleiny (`sciezka` blob-47) od traktu w głąb wyrębu, urywające się w polu |
| **dekoracje** | **pniaki — kilkanaście, nie jeden.** Stosy dłużycy wzdłuż koleiny, gałęziówka (`kepki`/`krzaki` w kupkach, nie równomiernie), kozioł do cięcia |
| **ludzie** | **najgęściej na mapie.** Ślad świeżej pracy: stosy ułożone, nie porzucone |
| **fauna** | **celowo uboga** — zwierzyna wyniosła się z hałasu. Ptak przy krawędzi wschodniej i tyle. ⚠ To jest jedyne miejsce, gdzie brak zwierząt jest TREŚCIĄ, a nie dziurą |
| **przeciwnicy** | **żadnych.** Pasmo y 0–16 ma zerowe zagrożenie na całej szerokości |
| **ruch gracza** | otwarcie, wiele dróg, nic nie prowadzi. Wyrąb to miejsce, przez które się **przechodzi w bok**, nie wzdłuż. Prześwity do ustalenia po standardzie §10 |

---

### A2 · TRAKT I SKRAJ LASU — x 22–60, y 0–16

| | |
|---|---|
| **rola** | pierwsze, co gracz widzi po wejściu bramą północną, i pasmo, przez które przejdzie **dwieście razy w obie strony** |
| **klimat** | jasno, szeroko, spokojnie. Las uporządkowany |
| **gęstość** | 35–45 %, **ale grupami** — nie równomiernie jak dziś |
| **gatunki** | **brzoza i buk** (najjaśniejsze w arkuszu), dąb pojedynczo |
| **teren** | ⚠ **trakt się POSZERZA przy bramie** — dziś ma 2 kafle na całej długości. Przy y 1–8 ma mieć 3, z wydeptanymi poboczami (`ziemia`). Rozjazd na odnogę do Myśliwego (y 8–9) ma być **widoczny jako rozjazd**, a nie jako kafle skręcające pod kątem prostym |
| **dekoracje** | **drogowskaz na rozjeździe** (`znaki.png` — 15 kafli nieużytych), kapliczka albo kamień milowy przy trakcie, wydeptane ścieżki-skróty odchodzące od traktu i wracające |
| **ludzie** | trakt utrzymany: bez zarastania, pobocza wykoszone |
| **fauna** | **sarna przy trakcie** (podejście po osi POZIOMEJ — patrz §7), ptaki, króliki na skraju |
| **przeciwnicy** | **żadnych** |
| **ruch** | ⚠ **trakt prowadzi, ale nie może być jedyną drogą.** Dziś jest — bo poza nim nie ma żadnego powodu, żeby gdziekolwiek pójść. Skróty i prześwity mają dawać wybór; wybór ma być **równie dobry**, nie karany |

---

### A3 · OBEJŚCIE MYŚLIWEGO — x 60–80, y 0–16

**Dziś: chata stoi w gołej trawie.** `mapy.md` obiecuje „trader's glade".

| | |
|---|---|
| **rola** | jedyne miejsce w lesie, gdzie **mieszka człowiek**. Punkt zaczepienia dla zadań |
| **klimat** | zadbane obejście wydarte lasowi. Ciasno, ale po ludzku |
| **gęstość** | **0 % w obrysie obejścia (~120 kafli)**, gwałtownie 45 % zaraz za nim — ⚠ **to jest jedyna twarda krawędź lasu na mapie i ma taka być** |
| **gatunki** | za płotem: dąb i buk duże, jako ściana |
| **teren** | wydeptana `ziemia` w obrysie, `sciezka` od odnogi traktu do drzwi |
| **dekoracje** | **płot** (Buildings: `zagroda_*` — ⚠ dziś dwa takie kafle stoją przy bramie północnej i są PRZECHODNIE, patrz §8), drewutnia, skóry na rozpięciu, ognisko (już jest, kafel 62,9) |
| **ludzie** | 100 % |
| **fauna** | ptak nad obejściem; ⚠ **nic większego** — Myśliwy tu mieszka |
| **przeciwnicy** | **żadnych** |
| **ruch** | ślepy zaułek **z własnej woli**: wchodzisz, bo tam jest człowiek, wychodzisz tą samą drogą. To jedyne takie miejsce na mapie |

---

### A4 · RZEKA I BRÓD — cała szerokość, y 16–26

⚠ **W 90 % ZROBIONE w Step 2. Nie przeprojektowywać.** Poniżej wyłącznie to,
czego brakuje.

| | |
|---|---|
| **rola** | **próg.** Granica świata ludzi i natury (Z-4). Woda płynie z głębi lasu ku wsi |
| **klimat** | cicho. Groźnie robi się dopiero po drugiej stronie |
| **teren — JEST** | woda 503 kafle, piasek 400, jeden spójny zbiornik, profil szeroki na zachodzie (7 kafli) i wąski na wschodzie (4), bród x 39–44 |
| **teren — DO ZROBIENIA** | **rozlewisko na zachodzie** (x 0–12, gdzie rzeka jest najszersza) — płycizna, wysepki, `kepki` w wodzie. **Miejsca podmokłe** na styku z A6 |
| **dekoracje** | wierzby nad wodą (duże stemple, pochylone ku wodzie), kamienie w nurcie, kładka z bala przy brodzie |
| **ludzie** | bród utrzymany: faszyna, koleiny wjazdu i wyjazdu. ⚠ **Nie most** (Z-5) |
| **fauna** | sarny przy wodopoju, lis węszący brzegiem, ptaki wodne |
| **przeciwnicy** | **żadnych.** Próg ma być cichy |
| **ruch** | ⚠ **kolizja wody to Step 1B, jeszcze nie wykonany.** Do tego czasu rzeka jest kolorem, nie progiem. **Bród ma zostać jedynym przejściem** — ale przejściem szerokim i wygodnym, nie bramką |

---

### A5 · DELIANKI ROBOCZE — x 22–60, y 26–48

**Serce lasu gospodarczego.** Dziś: najbardziej jednorodny fragment mapy.

| | |
|---|---|
| **rola** | „twój rewir" — las, w którym gracz spędzi najwięcej czasu i który ma się dać **opisać**, a nie tylko przejść |
| **klimat** | roboczy, znajomy, poszatkowany. Nie ściana drzew i nie park |
| **gęstość** | ⚠ **od 15 % do 70 % w obrębie jednego pasma.** To jest cała rzecz. Grupy drzew 6–15 sztuk ze **stykającymi się koronami**, między nimi polany 40–120 kafli z **czytelnym obrysem** |
| **gatunki** | **dąb i buk** dominują; **młodnik** = gęste kępy `*_maly` w miejscach po cięciu; świerk zaczyna się dopiero przy wschodniej krawędzi |
| **teren** | ⚠ **drogi zrywkowe** — wąskie pasy `sciezka`/`ziemia` odchodzące od traktu do delianek, **kończące się w polu, nie łączące się w sieć**. To jest najtańszy sposób na „ludzie tu pracują" |
| **dekoracje** | **mielerz** (ostatni ślad wsi przed dziczą), stosy sągów przy drogach zrywkowych, pniaki grupami, powalone kłody, znaki ciosane na drzewach |
| **ludzie** | ⚠ **średnio i MALEJĄCO ku wschodowi.** Zachodnie delianki świeże, wschodnie zarastające |
| **fauna** | **króliki na polanach** (nie w gąszczu — królik na polanie to zwierzę, królik w krzakach to niespodzianka), lis |
| **przeciwnicy** | niskie zagrożenie. ⚠ **Samotny wilk (kafel 28,51) zostaje na miejscu** jako ostrzeżenie z zachodu |
| **ruch** | **polana → prześwit → polana**, nie korytarz. Gracz ma mieć w każdej chwili 2–3 sensowne kierunki. Prześwity do ustalenia po standardzie §10 |

⚠ **Polana musi mieć OBRYS.** Dzisiejsze 45 % otwartej przestrzeni to jedna
dziura przez całą mapę. Polana = zwarty obszar 40–120 kafli, dookoła którego
korony się stykają. Bez obrysu to nie polana, tylko rzadszy las.

---

### A5b · BÓR WILKÓW — x 0–22, y 36–59  ⚠ ANOMALIA

| | |
|---|---|
| **rola** | **nie jest stopniem progresji.** *„Coś w głębi lasu wypchnęło watahę pod wioskę"* — zła głębokość JEST fabułą (Z-7) |
| **klimat** | najciemniejszy fragment zachodu, ciasny, bez śladu człowieka |
| **gęstość** | **wysoka, 60–70 %** (dziś pas x 0–9 ma już 62 % — to jedyne miejsce, gdzie zastane dane są zgodne z zamiarem) |
| **gatunki** | **świerk i grab** (dziś: 134 i 120 sztuk w x 0–9 — ⚠ **zostawić, to działa**) |
| **teren** | bez dróg, bez ścieżek, runo gęste, `listowie` na ziemi |
| **dekoracje** | kości, ⚠ **żadnych śladów pracy** — tu ludzie nie chodzą |
| **ludzie** | **zero. Świadomie** |
| **fauna** | zero drobnicy — wilki ją wyjadły |
| **przeciwnicy** | wataha ×3 + Szary. ⚠ **Pozycje NIETKNIĘTE** (Z-7) |
| **ruch** | wchodzi się tu **przez pomyłkę albo z ciekawości**, i to ma być czuć. Żadnego traktu, żadnej drogi zrywkowej |

---

### A6 · OLSZYNA I MOKRADŁA — x 52–80, y 26–44

**Do zbudowania od zera.** Dziś: nieodróżnialne od reszty.

| | |
|---|---|
| **rola** | pierwszy teren, który **utrudnia**, i pierwsze prawdziwe siedlisko |
| **klimat** | mokro, grząsko, ciemna ziemia, cicho inaczej niż w borze |
| **gęstość** | 40–50 %, ale **nierówno** — kępy na suchszym, otwarte lustra wody |
| **gatunki** | **olcha i świerk**; ⚠ **brak dębu i buku** — to ma być czytelne po samych koronach |
| **teren** | ⚠ **rozlewiska bez odpływu** (woda blob-47, małe plamy 4–20 kafli), kałuże, `ziemia` ciemna między nimi, trzcina (`kepki`) na obrzeżach. **Staw** — jeden, 30–60 kafli, na styku z A4 |
| **dekoracje** | przewrócone pnie w wodzie, babrzysko (`ziemia` wydeptana), tropy, kępy trzcin |
| **ludzie** | ⚠ **prawie zero — i to jest informacja.** Drwale tu nie wchodzą, bo nie da się wywieźć drewna. Najwyżej zerwany płot pułapki na skraju |
| **fauna** | **dziki — wreszcie we własnym siedlisku.** ⚠ Dzik #1 (62,34) już tu stoi — **buduje się teren wokół niego, nie przesuwa się dzika** |
| **przeciwnicy** | średnie zagrożenie: dwa dziki |
| **ruch** | ⚠ **teren spowalnia bez blokowania.** Woda i błoto rozbijają linie proste, ale zawsze jest droga naokoło. **Nie robić z tego labiryntu** — patrz §0.1 |

---

### A7 · ODLEGŁE DELIANKI — x 80–112, y 26–58

| | |
|---|---|
| **rola** | pasmo, w którym **gospodarka słabnie**, a las wygrywa. Ostatnie miejsce z jakimkolwiek śladem człowieka |
| **klimat** | ciemniej, ciaśniej, linie widzenia spadają |
| **gęstość** | **55–65 %**, rosnąco ku wschodowi |
| **gatunki** | ⚠ **świerk przejmuje, brzoza znika.** Dziś jest ODWROTNIE — patrz §8, to jest największa pojedyncza sprzeczność z `swiat.md` |
| **teren** | ⚠ **trakt przestaje być utrzymywany** — zwęża się z 2 kafli do 1, zarasta `kepkami`, w końcu urywa. **To jest najważniejsze pojedyncze zdanie tego pasma** |
| **dekoracje** | **ostatni znak ciosany na drzewie**, ostatni sąg — zwietrzały, nie odebrany. Nic za nim |
| **ludzie** | **gaśnie do zera w obrębie pasma** |
| **fauna** | ⚠ **linia ubytku x = 95** (Z-8): ostatni dzik na zachód od niej, sieciarze na wschód. **Zero ptaków, saren, lisów i królików za x = 95** |
| **przeciwnicy** | wysokie zagrożenie: sieciarze, skoczki jadowite |
| **ruch** | trakt przestaje pomagać. Gracz po raz pierwszy idzie **bez drogi** |

---

### A8 · KONIEC GOSPODARKI — x 112–139  (NOWE KOLUMNY)

⚠ **To jest pasmo, które zastępuje P6 · STARA PUSZCZA** (§0).

| | |
|---|---|
| **rola** | miejsce, które ludzie **porzucili**, i próg przed tym, czego w tej mapie nie ma |
| **klimat** | ⚠ **nie „katedralny stary las", tylko zarastający chaos.** Młodnik, samosiew, gałęziówka, której nikt nie sprzątnął. Ciasno i nisko, nie wysoko i cicho |
| **gęstość** | **55–65 %** (⚠ **nie ≥ 75 % jak w skasowanym P6**) — ale gęstość ma być **nierówna i „brudna"**: kępy młodnika nieprzejezdne obok otwartych, zarośniętych składnic |
| **gatunki** | **samosiew: świerk mały + brzoza mała w gęstych kępach**, między nimi pojedyncze duże nasienniki, których nie ścięto. ⚠ **Przewaga stempli `*_maly`** — to odróżnia A8 od A7 na pierwszy rzut oka |
| **teren** | **zarzucona składnica** (płat ubitej `ziemi`, dziś już zarastający), drogi zrywkowe **zarośnięte i urwane**, koleiny wypełnione wodą |
| **dekoracje** | **zawalona buda drwali**, zwietrzały sąg rozsypany, **pusty barłóg** (przeniesiony z P6 — nadal tłumaczy watahę z A5b bez słowa), ⚠ **BEZ ruin** — te idą na przyszłą mapę starej puszczy |
| **ludzie** | ⚠ **zero teraz, ale ślad, że byli.** To jest inna rzecz niż A5b, gdzie ludzi nie było nigdy. **Różnica między „nie chodzą" a „przestali chodzić" musi być czytelna** |
| **fauna** | **niedźwiedź** (przeniesiony — Z-6). ⚠ **Ani jednego małego zwierzęcia, ani jednego ptaka** — linia ubytku obowiązuje |
| **przeciwnicy** | najwyższe zagrożenie na mapie |
| **ruch** | ⚠ **brama do Gęstwiny jest PROGIEM, nie kolejnym krokiem.** Ostatnie 3–4 kafle przed nią mają być otwarte — próg ma być widoczny, do niego się dochodzi, a nie wpada się w niego z gąszczu |

⚠ **Zagrożenie R:** A8 najłatwiej zepsuć, malując go jak A5b (ciemny bór).
Wtedy mapa ma dwa nieodróżnialne ciemne kąty i traci całą różnicę. **A5b jest
stary i nietknięty. A8 jest młody i porzucony.** Jeśli na renderze wyglądają
tak samo — A8 jest zrobiony źle.

---

## 5. Stworzenia — obecne miejsce, docelowe miejsce, teren

⚠ **Nie dodajemy ani jednego stworzenia** (Z-9). Poniżej wyłącznie ocena
i przesunięcia. Współrzędne w kaflach (piksele ÷ 32).

| stworzenie | dziś | sens obecnego miejsca | docelowo | teren, który je wspiera |
|---|---|---|---|---|
| **królik ×5** | 28,37 · 45,38 · 33,33 · 48,45 · 35,40 | ⚠ **wszystkie w A5, ale żaden na polanie — bo polan nie ma** | **bez przesunięć**, ale **pod każdym ma powstać polana** | polana 40–120 kafli z obrysem; królik na otwartym jest zwierzęciem, w gąszczu jest zaskoczeniem |
| **dzik ×2** | 62,34 · 58,46 | ✅ **#1 stoi już na skraju przyszłej olszyny** | ⚠ **NIE PRZESUWAĆ** | A6: rozlewiska, babrzysko, olcha. Buduje się teren wokół nich |
| **wilk ×3 + Szary** | 14,44 · 18,44 · 16,48 · 8,53 + 28,51 | ✅ **anomalia fabularna** (Z-7) | ⚠ **NIETKNIĘTE** | A5b: świerk i grab, zwarcie 60–70 %, zero śladów człowieka. **Zmienia się otoczenie, nie pozycja** |
| **sieciarz ×3** | 50,55 · 67,55 · 73,56 | ⚠ **wszystkie na zachód od linii ubytku (x=95)** — sprzeczne z Z-8 | **na wschód od x = 95**, w A7 | gęstniejący świerk, urwany trakt, runo |
| **skoczek jadowity ×3** | 72,42 · 84,45 · 87,47 | częściowo — dwa są blisko właściwego pasma | **A7/A8**, za linią ubytku | najciemniejsze, najgęstsze fragmenty |
| **niedźwiedź** | 84,15 | ❌ **618 px = 0,80 kadru od Myśliwego.** Nie broni się w żadnym czytaniu | **A8** — zarzucona składnica | porzucony wyrąb: zwierzę zajmuje miejsce, które ludzie oddali. ⚠ Sprawdzić asercję `niedzw-hub` |
| **sarna ×2** | 40,46 · 78,21 | ⚠ #1 w środku A5, #2 przy rzece — **obie sensowne, ale żadna nie ma terenu** | #1 → **skraj polany w A5**, #2 → **wodopój w A4** | ⚠ **podejście gracza po osi POZIOMEJ** — przy pionowym zryw wyprowadza sarnę z kadru po ~1,3 skoku (`fauna_faza1.md` §8.2) |
| **lis ×2** | 28,28 · 59,18 | ❌ **#2 stoi W WODZIE** (audyt §4.2) | #1 → A5 przy polanie, #2 → **brzeg rzeki w A4**, na lądzie | lis kieruje wędrówkę na stanowiska ziół (`interestRadius` 150) — ⚠ **postawić go w zasięgu jakiegoś stanowiska**, inaczej mechanika nie działa |
| **ptak ×3** | 37,50 · 60,10 · 52,29 | ⚠ **żaden nie stoi tam, gdzie gracz wchodzi na mapę** | **jeden pod bramę północną** (y 2–5, przy trakcie) | „coś żywego w pierwszych 5 sekundach" — checklista §6.2 planu |
| **Myśliwy + ognisko** | 66,8 · 62,9 | ✅ Z-10 | **bez zmian**, dostaje obejście (A3) | ⚠ asercja `kupiec-fire > 92` |

⚠ **Największa dziura po tych przesunięciach zostaje w A1 i A2** — północny
zachód dalej będzie pusty. **To jest teraz zamierzone** (wyrąb płoszy
zwierzynę), ale ⚠ **sprawdź na renderze, czy pustka czyta się jako wyrąb, a nie
jako niedokończona mapa.** Różnicę robią wyłącznie dekoracje: pniaki, stosy,
koleiny.

---

## 6. Lista prac

Kolejność jest istotna: **teren → drzewa → dekoracje → obiekty → spawny.**
Malowanie drzew przed terenem to malowanie po czymś, co się zmieni.

### 6.1 Teren (warstwy `ground`, `path`, `water`, `sand`)

| # | co | gdzie | uwagi |
|---|---|---|---|
| T1 | **Płaty `ziemia 1/2`** — wyrąb, składnice, babrzyska, wydeptane obejścia | A1, A3, A5, A6, A8 | ⚠ **pierwsze użycie tych kafli poza brodem.** Dziś podłoże to jednorodny szum 2,3–2,9 |
| T2 | **`listowie 1/2`** pod zwartymi grupami drzew | A5b, A7, A8 | tanie, a robi „las" zamiast „drzewa na trawie" |
| T3 | **`kamien 1/2`** — pojedyncze wychodnie | A5b, A7 | oszczędnie, jako akcent |
| T4 | **Poszerzenie traktu do 3 kafli** przy bramie | A2, y 1–8 | dziś 2 kafle na całej długości |
| T5 | **Zwężenie i zarośnięcie traktu** 2 → 1 → urwanie | A7, ku wschodowi | ⚠ **najważniejszy pojedynczy gest całej przebudowy** |
| T6 | **Drogi zrywkowe** — krótkie odnogi `sciezka`/`ziemia`, urywające się | A1, A5, A7 | ⚠ **nie łączyć w sieć.** Droga zrywkowa prowadzi do delianki i kończy się |
| T7 | **Rozlewiska i staw** | A6; staw na styku z A4 | woda blob-47, plamy 4–20 kafli + jeden staw 30–60 |
| T8 | **Rozlewisko zachodnie rzeki** | A4, x 0–12 | jedyny brakujący fragment rzeki po Step 2 |
| T9 | **Resize 100 → 140** | cała mapa | ⚠ Map ▸ Resize, kotwica **lewa-górna**; sprawdzić, że 40 obiektów i 12 warstw przeżyło |
| T10 | **Podłoże nowych kolumn** | A8 | koleiny z wodą, ubita ziemia składnicy |

### 6.2 Drzewa i roślinność (warstwa obiektów `trees`, `undergrowth`, `bushes`)

⚠ **ZMIANA MODELU 2026-08-29 (`docs/tree_instances.md`): drzewa to teraz
tile-objecty na warstwie `trees`, nie kafle `trees-base`/`trees-over`.**
Stawianie: paleta tilesetu **TreeStamps** → `T` (Insert Tile) → klik. Drzewo w
pełnym rozmiarze, swobodny overlap, drag, `Delete`, prawy-klik → *Replace Tile*.
**D9/R-10 (ręczne dzielenie stempla na dwie warstwy) NIE OBOWIĄZUJĄ** — głębię
liczy renderer per drzewo (pień w paśmie encji, korona nad, sortowane po
`object.y`). „Grupy stykających się koron" (D1) robi się teraz po prostu
stawiając obiekty blisko siebie.

| # | co | gdzie | uwagi |
|---|---|---|---|
| D1 | ⚠ **Przebudowa rozkładu drzew na GRUPY** — korony stykające się, między grupami polany z obrysem | A2, A5, A7 | **to jest sedno całej przebudowy.** Dziś drzewa stoją pojedynczo i równomiernie |
| D2 | **2–3 prawdziwe polany** 40–120 kafli, każda z obrysem | A5 | pod króliki (§5) |
| D3 | ⚠ **Odwrócenie gradientu gatunkowego** — świerk rośnie ku wschodowi, brzoza znika | A7, A8 | **dziś jest odwrotnie**: idąc ku Gęstwinie brzoza rośnie 38→77, świerk spada 123→34. Próg dzieje się w drzwiach zamiast po drodze |
| D4 | **Młodnik** — gęste kępy stempli `*_maly` | A5 (po cięciu), A8 (samosiew) | odróżnia A8 od A7 na pierwszy rzut oka |
| D5 | **Olcha + świerk, zero dębu i buku** | A6 | siedlisko ma być czytelne po koronach |
| D6 | **Nasienniki** — pojedyncze duże drzewa zostawione w wyrębie | A1, A8 | mówią „tu cięto", a nie „tu nie ma lasu" |
| D7 | ⚠ **Runo z 4–9 % na 20–30 %** w pasmach głębokich | A5b, A6, A7, A8 | **najtańsza dźwignia w dokumencie** — kafle, nie kod |
| D8 | **Trzcina** na obrzeżach rozlewisk i stawu | A6, A4 | częściowo zrobione w Step 2 wzdłuż rzeki |
| ~~D9~~ | ~~Dolny rząd każdego stempla → `trees-base`, reszta → `trees-over`~~ | — | ⚠ **NIEAKTUALNE od 2026-08-29** — drzewa są tile-objectami, renderer sortuje sam. Patrz ramka nad tabelą |

### 6.3 Dekoracje i ślady ludzi

| # | co | gdzie | uwagi |
|---|---|---|---|
| K1 | **Pniaki — kilkanaście, grupami** | A1, A5, A8 | dziś na całej mapie jest **jeden** |
| K2 | **Stosy sągów i dłużycy** | A1 (ułożone), A5 (przy drogach), A7/A8 (rozsypane) | ⚠ stan stosu niesie gradient: ułożony → zwietrzały → rozsypany |
| K3 | **Drogowskaz na rozjeździe** | A2, y 8–9 | `znaki.png`, 15 kafli nieużytych |
| K4 | **Płot obejścia + drewutnia + skóry** | A3 | `zagroda_*` z Buildings |
| K5 | **Mielerz** | A5 | ostatni ślad wsi przed dziczą |
| K6 | **Znaki ciosane na drzewach** | A5 (kilka), A7 (ostatni) | gradient człowieka |
| K7 | **Zawalona buda drwali + zarzucona składnica** | A8 | ⚠ **bez ruin** — te idą na przyszłą mapę |
| K8 | **Pusty barłóg** | A8 | przeniesiony z P6; tłumaczy watahę z A5b bez słowa |
| K9 | **Wierzby, kamienie w nurcie, kładka z bala** | A4 | dodatki do gotowej rzeki |
| K10 | **Kości** | A5b | jedyna dekoracja boru wilków |

### 6.4 Obiekty Tiled (warstwy `objects`, `rosliny`, `kamienie`)

| # | co | uwagi |
|---|---|---|
| O1 | **Przesunięcie bramy wschodniej** | ⚠ **trzy pliki jedną operacją**: `tools/portale.py`, `forrest.tmj`, `thicket-gestwina.tmj`. Brama jest POZIOMA → `piksele_brama_pozioma()`, nie `piksele_brama()`. Awaria pomyłki jest cicha (16 px martwej strefy) |
| O2 | **Stanowiska ziół w zasięgu lisów** | `interestRadius` 150 — bez tego mechanika „lis kieruje wędrówkę na POI" nie działa |
| O3 | **Nowe stanowiska ziół w A6** | siedlisko mokre = inne zioła; ⚠ sprawdzić, które gatunki `swiat.md` tam dopuszcza |
| O4 | **Dekoracje `kamienie`** | ⚠ tworzone bez fizyki (`GameScene`) — kolizja dla nich to osobna, nierozstrzygnięta sprawa |

### 6.5 Zmiany spawnów

⚠ **Po KAŻDYM przesunięciu — pełna koperta asercji** (`las_faza1b_final.md`
§6.1). Asercje łamie się po cichu.

| # | co | z | na |
|---|---|---|---|
| S1 | sieciarz ×3 | 50,55 · 67,55 · 73,56 | **za linię ubytku (x > 95)** |
| S2 | skoczek ×3 | 72,42 · 84,45 · 87,47 | A7/A8 |
| S3 | niedźwiedź | 84,15 | **A8**, ⚠ `niedzw-hub` do podniesienia do 2300 |
| S4 | lis #2 | 59,18 (**w wodzie**) | brzeg rzeki, na lądzie |
| S5 | ptak #2 | 60,10 | **pod bramę północną**, y 2–5 |
| S6 | sarna #2 | 78,21 | wodopój, ⚠ z **poziomym** podejściem |
| S7 | ⚠ **królik ×5, dzik ×2, wilki ×4, Szary** | — | **NIE PRZESUWAĆ.** Buduje się teren wokół nich |

### 6.6 Do ponownego sprawdzenia po przebudowie

| # | co | dlaczego |
|---|---|---|
| C1 | ⚠ **Standard prześwitu (§10)** | wszystkie prześwity w tym dokumencie są nieokreślone do czasu tej decyzji |
| C2 | **Pełna koperta asercji** + dwie nowe (`linia-ubytku`, `rzeka-spójna`) | po każdym przesunięciu |
| C3 | **`niedzw-hub` podniesione do 2300** | trzy kadry od obejścia Myśliwego |
| C4 | **Zwarcie koron zmierzone per pasmo** | czy A8 (55–65 %) faktycznie różni się od A5b (60–70 %) — jeżeli nie, A8 jest zrobiony źle |
| C5 | **Runo zmierzone per pasmo** | cel 20–30 % w pasmach głębokich, dziś 4–9 % |
| C6 | ⚠ **Mapa pustki przeliczona od nowa** | dziś 28 % mapy > 386 px od czegokolwiek żywego. Po przebudowie pustka ma zostać **tylko w A1** |
| C7 | **Render, nie raport** | ⚠ najdroższa lekcja projektu. Cztery generatory i UI: liczby czyste, obraz zły |
| C8 | **`window.dev.missing` puste, `load.totalFailed` = 0** | po każdej zmianie ścieżek |
| C9 | **Obie kopie `.tmj` zsynchronizowane** | po każdym kroku, nie na końcu |
| C10 | ⚠ **Kolizja płotu `zagroda_*`** | dziś kafle (39,1) i (42,1) przy bramie północnej są **przechodnie** — jeśli A3 dostaje płot, ta sprawa wraca |

---

## 7. Pytanie kontrolne — czy gracz opisze tę lokację inaczej niż „las"?

**Po tej przebudowie: tak, i to sześcioma różnymi zdaniami.**

| obszar | zdanie, którym gracz opisze to miejsce |
|---|---|
| A1 | „ten wyrąb przy drodze, gdzie leżą stosy" |
| A2 | „trakt od bramy, z drogowskazem na rozjeździe" |
| A3 | „obejście Myśliwego za płotem" |
| A4 | „bród" |
| A5 | „ta polana z mielerzem" / „delianki" |
| A5b | „bór, w którym siedzą wilki" |
| A6 | „mokradła, gdzie są dziki" |
| A7 | „miejsce, gdzie kończy się droga" |
| A8 | „zarzucony wyrąb przed bramą do Gęstwiny" |

**Czego by zabrakło, gdyby przebudowa poszła tylko w drzewa:** wszystkie
powyższe zdania poza A4 i A5b opierają się na **warstwie ludzkiej albo na
podłożu**, nie na drzewach. Gracz nie zapamiętuje zwarcia koron — zapamiętuje
stos drewna, drogowskaz i miejsce, gdzie droga się urwała.

⚠ **Dlatego kolejność z §6 jest odwrotna do intuicji: teren i dekoracje niosą
tożsamość, drzewa niosą tylko klimat.** Las przebudowany wyłącznie stemplami
drzew dalej będzie się nazywał „las".

---

## 8. Ryzyka tej przebudowy

| # | ryzyko | co je zdejmuje |
|---|---|---|
| **R-1** | ⚠ **`tools/build_mapa.py --zapisz` SKASUJE całą pracę** | generator zna `SZER, WYS = 100, 60` i nie zna niczego z Tiled. **Nigdy w tej fazie** |
| **R-2** | **A8 pomalowany jak A5b** — dwa nieodróżnialne ciemne kąty | A5b jest stary i nietknięty, A8 młody i porzucony. Sprawdzić **na renderze**, nie w liczbach |
| **R-3** | **Wpisanie konkretnych prześwitów przed rozstrzygnięciem §10** | wszystkie miejsca oznaczone „do ustalenia po standardzie §10" |
| **R-4** | **Sztuczne korytarze** zbudowane pod ślepe AI | projektuj przepływy wynikające z użytkowania terenu, nie bramki |
| **R-5** | **Nowe kolumny malowane jak sad** — pojedyncze drzewa równomiernie | duże stemple, korony stykające się. To jest ten sam błąd, który zmierzył audyt |
| **R-6** | **Dodanie stworzeń „przy okazji"** | Z-9, bilans **+0** |
| **R-7** | **Przesunięcie łamiące asercje po cichu** | koperta §6.1 po KAŻDYM przesunięciu |
| **R-8** | ⚠ **Przeprojektowanie rzeki, która jest już zrobiona** | Step 2 z 2026-08-27. Z A4 bierzemy **wyłącznie dodatki** |
| **R-9** | **Wyjaśnianie, czemu ludzie odeszli z A8** | reguła Gęstwiny: niczego nie tłumaczymy |
| ~~R-10~~ | ~~Stempel zostawiony na jednej warstwie~~ | ⚠ **NIEAKTUALNE od 2026-08-29** — drzewa to tile-objecty, renderer sortuje pień/koronę sam (`docs/tree_instances.md`) |
| **R-11** | ⚠ **`tools/migrate_forest_trees_to_objects.py --zapisz` ponownie** — nadpisze ręczną pracę w `trees` | migracja jest JEDNORAZOWA, wykonana. Więcej jej nie uruchamiać. Skrypt do skasowania po tej fazie |
| **R-12** | **`build_mapa.py` / stary generator dopisuje `trees-base`/`trees-over`** z powrotem | te warstwy są skasowane celowo; generator ich nie zna. Nie „synchronizować" mapy z generatorem (reguła `src/world/CLAUDE.md`) |

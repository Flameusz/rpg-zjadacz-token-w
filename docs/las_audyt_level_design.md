---
typ: HISTORIA
domena: world
tytul: Las — audyt level designu
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-27
---

# Las — audyt level designu (Faza 1B: „Reżyseria lasu")

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/world.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: AUDYT. Nic nie wdrożone, nic nie zmienione w `.tmj` ani w kodzie
(2026-08-27).** Odpowiada na jedno pytanie ze zlecenia: *„czy obecny las jest
dobrą sceną dla istniejących stworzeń?"*. Rekomendacje w §8 są **materiałem do
decyzji autora**, nie planem wykonawczym.

Wszystkie liczby policzone z **żywego `public/assets/maps/forrest.tmj`**
i z **żywego `GameConfig.ts`** (skrypty jednorazowe w scratchpadzie, **nie
zostawione w `tools/`** — reguła `src/world/CLAUDE.md`). Nic tu nie pochodzi
z dokumentacji ani z generatora.

Poprzedniki: `docs/bestiariusz_audyt.md` (co za stworzenia),
`docs/fauna_faza1.md` (Faza 1A — zachowanie sarny i lisa, ✅ wdrożone).
**Ten dokument nie powtarza żadnego z nich** — pyta wyłącznie o miejsce.

> ## Odpowiedź w jednym akapicie
>
> Las **nie jest złą sceną — jest sceną bez ścian.** Ma dobry szkielet
> (droga, rzeka dzieląca mapę w całości, jeden bród, wataha w SW rogu) i jedno
> naprawdę zdrowe terytorium. Ale **żaden z tych elementów nic nie blokuje ani
> nie odgradza** — w trzech mapach projektu jest **zero kafli z kolizją** — a
> podłoże, gęstwina i runo są w każdym miejscu takie same. Wynik: mapa,
> po której da się iść na skos przez rzekę w linii prostej i której **nie da
> się opisać słowami inaczej niż „las"**. Powiększenie tego nie naprawi.
> **Brakuje granic, nie powierzchni** (dowód liczbowy: §10).

---

## 1. Pliki i warstwy

### 1.1 Co w ogóle istnieje

| plik | rola |
|---|---|
| `public/assets/maps/forrest.tmj` | **mapa, którą czyta gra** (`GameConfig.ts:364`) |
| `public/assets/forrest.tmj` | druga kopia, inna ścieżka do PNG (żeby otwierała się w Tiled na miejscu) — ⚠ **rozjechana: 235 689 B z 2026-08-14 vs 247 416 B z 2026-08-17, inne md5** |
| `public/assets/maps/forrest.json` | martwy eksport ze starych tilesetów, nic go nie czyta |
| `tools/build_mapa.py` | generator (rusztowanie); pisze **obie** kopie przy `--zapisz` |

⚠ **Pierwsza rzecz do zgłoszenia i najtańsza:** dwie kopie `forrest.tmj` **nie
mają już tej samej treści**. `mapy.md` opisuje je jako „same content, different
relative PNG path". To przestało być prawdą trzy dni po tym, jak zostało
zapisane. Kto otworzy kopię z `assets/` w Tiled, będzie edytował mapę sprzed
sarny i lisa.

### 1.2 Warstwy kafli — dwanaście, i to jest w porządku

| warstwa | wypełnienie | co niesie | ocena |
|---|---|---|---|
| `ground` | **100 %** | 6 wariantów trawy (czysta → b. gęsta) | ⚠ **szum, nie informacja** — patrz niżej |
| `water` | 8,4 % | rzeka, blob-47 | ✅ jedyna prawdziwa struktura |
| `sand` | 0,4 % | **22 kafle** — wyłącznie bród | zbyt mało, żeby coś powiedzieć |
| `path` | 2,9 % | droga N–S + odnoga E do Myśliwego | ✅ |
| `undergrowth` | 3,2 % | 190 kępek trawy | praktycznie nieobecne |
| `bushes` | 1,1 % | 67 krzaków | praktycznie nieobecne |
| `buildings` + `-detale` + `-over` | 0,7 % razem | chata Myśliwego, **jeden budynek na całą mapę** | |
| `znaki` | 0,1 % | **3 kafle** — drogowskaz przy bramie | |
| `trees-base` | 20,5 % | pnie | |
| `trees-over` | 25,8 % | korony (`-over` = `DEPTH.overhead`) | |

**Zwarcie koron (base ∪ over): 46,3 % mapy.**

Podział warstw jest zrobiony poprawnie i zgodnie z `src/world/CLAUDE.md`
(jedna warstwa na rodzaj rzeczy, `-over` osobno, dolny rząd drzewa w `-base`).
**Problemem nie jest struktura warstw, tylko to, co na nich stoi.**

### 1.3 ⚠ Podłoże nie niesie ŻADNEJ informacji — pomiar

`ground` używa wszystkich sześciu stopni gęstości trawy (1783 / 1596 / 1142 /
749 / 484 / 246 kafli). Wygląda to jak zróżnicowanie. **Nie jest.** Średnia
gęstość w blokach 10×10 kafli, cała mapa:

```
       0   1   2   3   4   5   6   7   8   9
   0  2.9 2.4 2.4 2.5 2.5 2.6 2.7 2.6 2.7 2.5
  10  2.7 2.5 2.5 2.6 2.4 2.4 2.6 2.6 2.5 2.5
  20  2.3 2.4 2.6 2.6 2.6 2.5 2.9 2.6 2.4 2.6
  30  2.5 2.6 2.6 2.5 2.6 2.6 2.6 2.5 2.6 2.6
  40  2.4 2.5 2.5 2.4 2.4 2.8 2.4 2.5 2.5 2.7
  50  2.5 2.6 2.6 2.6 2.7 2.5 2.6 2.6 2.3 2.6
```

Rozstęp **2,3–2,9 na sześciostopniowej skali, na sześćdziesięciu blokach.**
To jest jednorodny szum. **Nie ma na tej mapie ani jednego miejsca, w którym
sama ziemia wygląda inaczej niż wszędzie indziej** — a arkusz `Teren.png` ma
gotowe `ziemia 1/2`, `kamien 1/2`, `listowie 1/2` i pełne zestawy blob-47 dla
piasku i wody, których nikt nie użył poza brodem.

### 1.4 Mapa techniczna terenu (ASCII, 1 znak = 1 kafel)

`T` drzewo · `~` woda · `=` droga · `s` piasek · `H` budynek · `b` krzak ·
`u` runo · `.`/`,`/`;`/`:` trawa

```
     0         1         2         3         4         5         6         7         8         9
  0  TTTTTT.TT;TTTTTTTTTTTuu;,TTTTTTTu.T.u`::.,,TTTTTTT:;,`TTuTTTTTTu,.,`."TTTTTTTb,.,TTb:TTTTTT`TTTT.`TT
  4  TTTT`;T;u"TT;,T,.TT.T,TTTTTTTTTTTTTTTTT;:==;`TTTTTTTTTTTTTTTTT;uHHHHH,TTT`TTT`TT.TTTTTTTTTTTTTTT:,TT
  8  TTTTT``T,`,,..,,,:,b.u.T.,TT;TTTT`TT:TTT:==============================,:.TTT.TTTTTTTTTT:TTTTTu`TTTT
 12  TTTT;T`.`:T,,,`;,,,:,,,``,;;T;.TTTTTTTu..==;TTTTTTTTTTTTTT;TT`T,.`,.:..,;TT,TTTTTTTTTTTTTTTTT;TT,TTT
 16  TTTT;;T:T.T,u.`u`,;,,u.`..,,T:TTTTT`TT.,==;,TTTTTTTTT..,:.;u~~~~~~~~~~~~~~~~~~~~~~...:"`,",;:..b.;TT
 18  ~~~~:,..:;~~~~~~~~~~~;:;;.TT..:TT;;Tub:.==u,TTT.,;;u~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 20  ~~~~~~~~~~~~~~~~~~~~~~~.;.,.,`;T";,:Tsss==sss~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:bT"..,.:.,u;:;,:,"~~~~~~~
 22  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~s==s~~~~~~~~~~~~~~~~~~~~~~;;";TT,;,T,T.,.:...,,;`;;;,.;,;TTTT
 24  TT;~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~s==s~~~::TTTTTTT.;uTTT"TT;TT;..TTT.":;T;.,:..;,.u`,;.,;"TTTT
 26  TTTT..,,.:..:;,,~~b,T,:.;;T.T`TTTTTTTTT;b==:,TTTTT,TTT:;TTTTTTTTT.TTTTTTT;T:T:..,,:u..`,.,`:,:,,.TT.
 30  "TTTTTT,,,.;:".T.,T;,.;;TTTTTTTTTTTTuTTT".==.TTTTTTTTTTTT`T.`TT;.;.,TT`T.T`....,;`,;.u,,.",u`:`TTTTT
 34  TTTTTuTTTb,;;TuTu,TTT.,TTTTTT.TT"TTTTT:;`==:."TT;TTTTTTTTT;.,,.;TTTT:u;TT;."TT,..;`,.,;.";.,T;.T;,TT
 38  TTTTTTT.,TTTT;TTTTTT.TTbTTTTTT,TTTTT::.,==::;.,TT`uuTTTT,TT;TTu:T:.TTuTT,TbTTTTT.TTu";.`;,TuT:TTTTTT
 42  TTT.uTTTT:.,TTTTTTTTT`TTTT;.,,T.uT;,..==`",T,TTTTT;TTT;,":,.T.T,,u,T.;TT:.:TTT:,TTT;T.TTT.``:::TT`,,
 46  TTTT.TTTTTTTTTTTT.TT;TTT`..TTTTT.,.:==.,,TT`,.TT;TbTTTTT:":;Tu;,:,:,,....::;u`.,"T"u.;,;u.uT;,:.,,:,
 50  TTTTTTTTT;TTTTTT`Tu.TTTTTT.TTTT,."==::.,:``;u.TT:,TTT;TT;,T:Tu..,u.,...;;.T.;".:T.T.Tb;.,.TT,T.TTTTT
 54  TTTTTTTuTTTTTTTTTTTT.,TTuTT,TTT:,u==,;,;T:u:u`.TTTTTTT:,,.`,".:T,;`T.:;.;:..;;":T.TbTTT;;TTTTTTTTTTT
 58  TTTT.TTTTTTTTTTTTTT,TTTTTTTTTTTT;,==..TTTTTTTTTTTTTTTTTTTTTTT`TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
```

Czyta się z tego cała geografia:

- **Rama z drzew.** Górne 4 wiersze, dolne 4, lewa kolumna 0–4 — lite `T`.
  Wnętrze rzadkie. Makro-kształt mapy to **misa**, nie las.
- **Rzeka dzieli mapę w CAŁOŚCI.** Nie ma wiersza, w którym da się ją obejść:
  wschodni klin lądu (x 74–99, y 19–25) jest od północy zamknięty wodą
  w wierszach 17–19, zachodni skrawek (x 0–6, y 24–26) tak samo.
  **Jedyne przejście to bród na drodze, x 38–45.**
- **Lejek.** Północny brzeg zwęża się z ~30 kafli w wierszu 17 do 4 kafli
  w wierszu 22. To jest dobra robota level designerska — **i jest niewidoczna**,
  bo przy kadrze 24 kafli szerokości nigdy nie widać jednocześnie obu brzegów
  lejka.
- **Droga wybiega poza południową krawędź mapy i nie ma tam bramy.** Wiersz 59,
  kafle 35–36. Obiektów `portal` są dwa: północ (41,1) i wschód (98,46).
  To jest **kopalny ślad odwróconej geografii** — `swiat.md` §4 wciąż zakłada
  wioskę na południu, a decyzja D-2/D-3 (`wioska_plan.md`) przeniosła ją na
  północ. Droga obiecuje kierunek i kończy się ścianą drzew.

---

## 2. Tilesety — co jest w palecie i ile z tego użyto

### 2.1 Paleta

| arkusz | kafli | co daje |
|---|---|---|
| `Teren` | 228 | trawa **6 stopni gęstości**, ziemia ×2, piasek ×2, **kamień ×2**, woda ×2, **listowie ×2**, + zestawy blob-47 dla **ścieżki, wody i piasku** |
| `Nature` | 133 | 16 kępek trawy, 8 krzaków, **5 gatunków drzew × 3 wielkości** (dąb, buk, świerk, brzoza, grab) |
| `Buildings` | 152 | chaty, dachy, detale |
| `Znaki` | 16 | drogowskazy, tablice, krzyże — **użyty 1 kafel z 16** |

**Paleta jest bogata i wystarcza na wszystko, o co pyta zlecenie.** Polana =
brak drzew + trawa czysta + kępki. Gęstwina = świerk duży zwarty. Mokradło =
blob-47 wody w plamach + ziemia + trzcina z kępek. Ciemna część lasu = świerk +
grab. Miejsce specjalne = kamień, głazy (58 obiektów `kamienie` już jest),
`znaki.png`.

### 2.2 Co z tej palety mapa faktycznie wykorzystuje

| możliwość | stan |
|---|---|
| polana | ❌ **nie istnieje ani jedna** — dowód §2.3 |
| gęstwina | ❌ zwarcie 46,3 %, nigdzie nie tworzy masy |
| mokradła | ❌ zero — woda występuje wyłącznie jako rzeka |
| okolice wody | 🟡 rzeka jest, ale **bez brzegu**: 22 kafle piasku w całym lesie, zero trzcin |
| ciemna część lasu | 🟡 SW róg jest ciemny **przypadkiem** (70–83 % drzew), nic tego nie podkreśla |
| miejsce specjalne | ❌ **na całej mapie są dwa punkty orientacyjne: chata Myśliwego i bród.** Nic więcej nie da się drugiemu graczowi opisać. |

### 2.3 „Polany" — dlaczego twierdzę, że nie ma ani jednej

Spójne obszary bez drzewa i bez wody (4-sąsiedztwo):

```
  1184 kafli   bbox x0-97  y0-59     ← bbox = CAŁA MAPA
   899 kafli   bbox x51-99 y19-56
   107 kafli   bbox x2-18  y24-38
    43 kafli   bbox x58-68 y27-39
   ...
  razem 2725 / 6000 kafli (45 %) w 159 kawałkach
```

⚠ **45 % mapy jest otwarte, ale dwie największe plamy mają bounding boksy
obejmujące pół mapy i całą mapę.** To nie są polany — to jest **jedna
prześwitująca dziura biegnąca przez wszystko.** Polana to zwarty obszar
40–120 kafli obrysowany drzewami; tutaj każde otwarte miejsce łączy się
z każdym innym.

To jest dokładnie ta „najdroższa lekcja projektu" z korzeniowego `CLAUDE.md`
(*„las czytający się jak sad"*), zmierzona: **drzewa stoją pojedynczo,
równomiernie, i nigdzie się nie stykają.**

Runo tego nie ratuje: `undergrowth` + `bushes` nie przekracza **~15 % kafli
w żadnym bloku 5×5** na całej mapie.

### 2.4 ⚠ Porównanie z Gęstwiną — projekt umie już zrobić las

|  | zwarcie koron | udział świerku | udział brzozy |
|---|---|---|---|
| **Wschodnia Gęstwina** (64×64, zrobiona później) | **76,9 %** | **51 %** | 3,6 % |
| **Las** (100×60, flagowa lokacja) | **46,3 %** | 22 % | 16 % |
| **Las — wschodni skraj** (S, x ≥ 50) | ~30–40 % | **9 %** | **21 %** |

`swiat.md` opisuje zasadę Gęstwiny wprost: *„Las ciemnieje w głąb. Brzoza —
drzewo światłolubne i najjaśniejsze w arkuszu — praktycznie znika, a jej
miejsce zajmują świerk i grab."*

⚠ **Wschodni skraj lasu robi DOKŁADNIE ODWROTNIE.** Idąc od środka mapy na
wschód, w stronę bramy do Gęstwiny: brzoza rośnie z 38 do 77 sztuk, świerk
spada ze 123 do 34, grab ze 105 do 15. **Im bliżej gęstwiny, tym jaśniej
i rzadziej.** Potem gracz przechodzi przez bramę i wpada w 77 % świerku.

**Próg dzieje się w drzwiach zamiast po drodze.** To jest największa
pojedyncza sprzeczność między mapą a biblią świata, jaką znalazłem — i jest
naprawialna wyłącznie kaflami.

---

## 3. Obiekty Tiled

Trzy warstwy obiektów: `objects` (40), `rosliny` (42), `kamienie` (58).
Wszystkie obiekty są punktowe. **Zero obiektów prostokątnych, zero stref.**

### 3.1 Roster i ocena miejsca

| obiekt | pozycja px | kafel | teren pod spodem | aktualna rola | czy miejsce ma sens |
|---|---|---|---|---|---|
| `player` | 1232,1616 | 38,50 | trawa | start nowej gry | 🟡 **prawie nieużywany** — po pierwszej wizycie w Zagajach każde wejście idzie bramą północną |
| `portal`→village | 1312,48 | 41,1 | droga | brama do wsi | ✅ na drodze, oznaczona drogowskazem |
| `portal`→thicket | 3152,1472 | 98,46 | trawa | brama do Gęstwiny | ⚠ **nie ma do niej drogi** — ostatnie 1200 px na przełaj |
| `merchant` (Myśliwy) | 2128,284 | 66,8 | droga | sklep + trener | 🟡 chata stoi **w gołej trawie**, bez podwórza i płotu; `mapy.md` obiecuje „trader's glade" — polany tam nie ma |
| `campfire` | 2010,314 | 62,9 | droga | gotowanie | ✅ 122 px od kupca (asercja > 92 OK) |
| `rabbit` ×5 | 912–1552, 1072–1456 | — | trawa/runo | rewir gracza, quest Myśliwego | ✅ **jedyna sensowna grupa fauny** — sąsiad 205–244 px, zwarty rewir 640×384 px |
| `wolf` ×3 (sfora) | 464/579/516, 1424–1545 | 14–18, 44–48 | 70–74 % drzew | wataha | ✅✅ **najlepsze miejsce na mapie** — najciemniej, najgęściej, z dala od drogi |
| `wolf` #4 (samotny) | 912,1648 | 28,51 | drzewa | próba na jednym wilku | ✅ 399 px od sfory (asercja > 300 OK), 192 px od drogi |
| `greywolf` (Szary) | 272,1712 | 8,53 | **83 % drzew** | elita, nie odradza się | ✅ najgęstszy punkt mapy, 296 px za sforą |
| `boar` ×2 | 2000,1104 / 1872,1488 | 62,34 / 58,46 | **goła trawa** | telegrafowana szarża | ❌ **złe siedlisko** — dzik to zwierzę mokrego podszytu i babrzysk, stoi na otwartej łące, 587–609 px od drogi |
| `spider` (sieciarz) ×3 | 1616/2160/2352, 1776–1808 | 50/67/73, 55–56 | drzewa | „wschodnia gęstwina" | ❌ **stoją na POŁUDNIOWEJ krawędzi mapy**, 3–4 kafle od brzegu, w litym pasie drzew; `swiat.md` umieszcza je we wschodniej gęstwinie |
| `venomspider` (skoczek) ×3 | 2320/2704/2800, 1360–1520 | 72/84/87, 42–47 | trawa, 30–40 % drzew | „za dzikami, głębiej" | 🟡 **linia na wschód jest dobra**, ale prowadzi przez najrzadszy teren na mapie |
| `bear` | 2704,496 | 84,15 | krzak, 27 % wody | osobne spotkanie | 🟡 **1850 px od startu, 1420 px od bramy północnej, nigdy nie wchodzi w kadr z drogi** — pilnuje niczego |
| `deer` #1 | 1300,1500 | 40,46 | trawa | pierwsze żywe stworzenie (Faza 1A) | ✅ 134 px od startu nowej gry, 101 px od drogi |
| `deer` #2 | 2500,700 | 78,21 | brzeg, 34 % wody | — | ❌ **martwy róg NE**, 1564 px od startu, 465 px od drogi, nigdy niewidziana |
| `fox` #1 | 900,900 | 28,28 | trawa, 24 % wody | zamiar (Faza 1A) | 🟡 423 px od drogi, ale blisko stanowisk ziół — działa |
| `fox` #2 | 1900,600 | 59,18 | ❌ **WODA (62 % w promieniu 5 kafli)** | — | ❌ **lis stoi w środku rzeki** |
| `bird` ×3 | 1184,1600 / 1920,320 / 1680,944 | — | — | tło | 🟡 #1 przy starcie ✅, #2 przy chacie, #3 w gąszczu |
| `rosliny` ×42 | — | — | — | zbieractwo | ✅ **jedyna warstwa z prawdziwą logiką siedlisk** — §3.2 |
| `kamienie` ×58 | — | — | — | dekoracja | 🟡 rozsypane równomiernie; **żaden nie tworzy punktu orientacyjnego** |
| `pniak`, `grzyby` ×3, `brzeg_stawu` ×2, `lilia` ×2, `suszona_skora` | — | — | — | dekoracja | 🟡 `lilia`/`brzeg_stawu` przy rzece — jedyny ślad, że ktoś myślał o brzegu |

### 3.2 ⚠ Rośliny są rozstawione po siedliskach. Zwierzęta nie.

To jest najważniejsza obserwacja tej sekcji, bo pokazuje, że **wzorzec
istnieje w tym projekcie i został już raz wykonany dobrze**:

| ziele | n | średnie zadrzewienie w promieniu 3 kafli | zgodność z `HERBS[*].siedlisko` |
|---|---|---|---|
| **krwawnik** | 8 | **0 %** | ✅ *„rośnie na suchym i słonecznym, w cieniu go nie znajdziesz"* |
| **dziurawiec** | 12 | 11 % | ✅ *„słoneczna polana albo skraj lasu — w cień za nim nie idź"* |
| **babka** | 12 | 15 %, skupiona przy drodze | ✅ *„trzyma się dróg i wydeptanych klepisk"* |
| **pokrzywa** | 10 | **46 %** | ✅ cień, żyzna ziemia |

Krwawnik ma **zero procent** zadrzewienia na ośmiu stanowiskach. To nie jest
przypadek — ktoś to postawił świadomie, a Dorota mówi o tym w dialogu.

**Fauna nie ma nic podobnego.** Dzik stoi na łące, lis w wodzie, sarna
w martwym rogu. Zlecenie pyta „czy obecne stworzenia mają sens przestrzenny" —
odpowiedź brzmi: **rośliny tak, zwierzęta nie, i różnica nie wynika z braku
mechaniki, tylko z tego, że nikt nie zrobił dla zwierząt tego, co zrobił dla
ziół.**

### 3.3 Asercje generatora — wszystkie przechodzą na żywej mapie

`src/world/CLAUDE.md` ostrzega: *„Ręczne przesunięcie w Tiled łamie je CICHO"*.
Sprawdziłem, stosując asercje z `tools/build_mapa.py:1240–1305` do żywego
`.tmj` (generator raportuje o SWOIM wyniku, nie o pliku):

```
  wilk-wilk      132, 115, 133  (każda < 200 = callRadius)   OK
  samotny-sfora  399            (> 300)                      OK
  samotny-Szary  643            (> 300)                      OK
  Szary-wilk     296            (> 200)                      OK
  kupiec-fire    122            (> 92)                       OK
  dzik-pajak     385            (> 340)                      OK
  zajac-wilk     404            (> 380)                      OK
  gracz-zajac    334            (> 200)                      OK
  niedzw-wrog    930            (> 400)                      OK
  niedzw-hub     614            (> 400)                      OK
```

✅ **Ręczne edycje z 2026-08-14 (sarna, lis, ptaki, niedźwiedź) niczego nie
złamały.** To jest dobra wiadomość i zarazem **koperta ograniczeń dla każdego
przesunięcia proponowanego niżej** — sprawdziłem w niej wszystkie propozycje
z §8.

### 3.4 ⚠ Sprzeczność do rozstrzygnięcia przez autora, nie przeze mnie

`swiat.md` (§4, pająki): *„Rozstawienie jest celowe: **jeden osobno** i **dwa
przy dziku** (gracz uczy się, po co ona jest)."*

`tools/build_mapa.py:1264`: *„Regula ODWROCONA 2026-08-13: bylo »< 175«, czyli
pajak CELOWO w zasiegu aggro dzika. Teraz maja byc dwa osobne spotkania"* →
asercja `dzik-pajak > 340`.

**To są dwie sprzeczne decyzje o tym samym.** Kod jest nowszy i zmierzony,
mapa idzie za kodem (385 px). `swiat.md` nie został zaktualizowany.
**Nie wybieram za autora** — zgłaszam, bo każda propozycja ruszenia sieciarzy
musi wiedzieć, której zasady słucha.

---

## 4. Wizualizacja

Dwa obrazy renderowane z **prawdziwych tilesetów i prawdziwego `.tmj`**
(nie schemat — render, zgodnie z niezmiennikiem *„patrz na render, nie tylko
na raport"*):

- `docs/img/las_stan_obecny.png` — mapa + znaczniki + zdiagnozowane problemy,
  z zacieniowaniem obszarów oddalonych o > 600 px i > 900 px od jakiegokolwiek
  stworzenia.
- `docs/img/las_propozycja.png` — ta sama mapa z siedmioma proponowanymi
  strefami i sześcioma przesunięciami spawnów.

### 4.1 ⚠ Mapa pustki — najmocniejszy pojedynczy dowód

Dystans do najbliższego stworzenia. `#` < 200 px · `+` < 400 · `-` < 600 ·
`.` < 900 · **spacja ≥ 900 px**:

```
     0         1         2         3         4         5         6         7         8         9
  0                         .......... ..........--------++++++++++++++++----------------------------....
  4               .............................-------++++++++######++++++++--------+++++++++++----------
  8          .................................-------++++++############++++++--+++++++++++++++++++++-----
 12       .............--------------------...-------++++++############+++++++++++++###########+++++++---
 16     ..........-----------+++++++++--------------+++++++###########++++++++++################++++++---
 20  ...........-------++++++++++++++++++++------+++++++++############+++++++################++++++++----
 24  ..........------+++++++##########++++++++++++++++#######+#####++++++++++############+++++++++-------
 28  .....-----------++++++###############+++++++++#############++###+++++++++++++++++++++++++---------..
 32  -----------+++++++++++++################++++########################+++++++++++++++++--------------.
 36  -----+++++++++++++++++#############################++++++###########+++###+++++++++++++++++++-------
 40  ---+++++++##########################################+++++###+###+++###########+++#######++++++++++--
 44  ++++++++################+++++++#################################+++##########################+++++++
 48  +++++###########################################################+++++++###+++++###############++++++
 52  ++###################+#####################++###########+###++################++++++#######++++++++-
 56  +++###########+++++++++++#######++++++++++++#############++++###################++++++++++++++++----
 59  +++++++###++++++++++++++++++++++++++++++++++++#########++++++++################++++++++++++---------
```

- **Największa pustka: 1250 px od czegokolwiek żywego**, w kafelku (16,16) —
  czyli północno-zachodnia ćwiartka.
- **28,0 % mapy leży dalej niż 386 px (pół szerokości kadru telefonu) od
  jakiegokolwiek stworzenia.**
- Gradient jest ostry i diagonalny: pusto na NW, tłok na SE.

### 4.2 Spis po sektorach (mapa podzielona na 3 × 2)

| sektor | stworzeń | co tam jest |
|---|---|---|
| WN (płn.-zach.) | **1** | 1 lis |
| CN (płn.-środek) | 3 | 2 ptaki, 1 lis (**w wodzie**) |
| EN (płn.-wsch.) | 2 | niedźwiedź, sarna |
| WS (płd.-zach.) | 6 | **sfora + Szary + królik** |
| CS (płd.-środek) | 9 | 4 króliki, 2 dziki, sieciarz, ptak, sarna |
| ES (płd.-wsch.) | 5 | 2 sieciarze, 3 skoczki |

⚠ **Cała północ mapy (50 % powierzchni) mieści JEDNEGO wroga — niedźwiedzia.**
Południe mieści osiemnastu. Gradient „bezpiecznie → niebezpiecznie" istnieje,
jest zgodny z fabułą (wieś na północy) i **powstał przypadkiem** — nic go nie
zaznacza i nikt go nie zaprojektował.

---

## 5. Doświadczenie gracza

### 5.1 Kalibracja kadru

| urządzenie | zoom | widok świata | w kaflach |
|---|---|---|---|
| telefon (891×411 CSS, DPR 2,6) | 3 | **772 × 356 px** | **24 × 11** |
| desktop 1280×720 | 2 | 640 × 360 | 20 × 11 |

Mapa = **4,1 ekranu w poziomie × 5,4 w pionie ≈ 22 nienachodzące ekrany.**

### 5.2 Symulacja: przejście drogą z bramy północnej na południe

Gracz stępa (150 px/s). Notowane wejście w kadr telefonu:

```
   t=0      wychodzi z Zagajów, brama (1328,144)
   t=4 s    ptak, 137 px               ← pierwsze i jedyne życie
   t=4-11 s NIC
   t=11 s   ptak, 372 px
   t=12 s   królik, 316 px
   t=13 s   królik ×2
   t=15 s   królik ×2, sarna 180 px
   t=16 s   ptak; wilk 316 px
   t=19 s   koniec drogi (2863 px), południowa krawędź mapy
```

- **Cała droga: 2863 px = 19 s stępa, 12 s sprintem.**
- **16 z 26 stworzeń NIGDY nie wchodzi w kadr z drogi.** Nigdy nie wchodzą:
  oba dziki, wszystkie trzy sieciarze, wszystkie trzy skoczki, cała sfora,
  Szary, niedźwiedź, sarna #2, oba lisy.
- **5 z 59 wierszy drogi leży w zasięgu agro jakiegokolwiek wroga.**
- **24,2 % mapy leży w zasięgu agro** (licząc od punktów spawnu).

#### Pierwsze 30 sekund
Gracz widzi **ptaka o czwartej sekundzie, potem siedem sekund pustej drogi.**
Nie ma życia, nie ma ciszy jako efektu, nie ma zagrożenia. Jest **przejazd**.
Pierwszy wróg (królik) jest 963 px od bramy — **6,4 sekundy sprintem.**
⚠ Sarna, której zachowanie zbudowaliśmy w Fazie 1A, wchodzi w kadr
**w 15. sekundzie** i tylko wtedy, gdy gracz idzie do końca.

#### Dwie minuty
Wystarczą na przejście mapy **wzdłuż i wszerz**. Różnorodność, która się
wtedy pojawia, jest **listą przeciwników, nie listą miejsc**: dzik na łące,
wilki w gąszczu, pająki na krawędzi. Podłoże pod nimi jest identyczne.

#### Pięć minut
Gracz odkrył wszystko poza dwoma zakątkami: martwą ćwiartką NW (gdzie nie ma
nic) i niedźwiedziem na NE. **Nie ma czego odkrywać, bo nie ma miejsc — są
tylko pozycje.**

### 5.3 ⚠ Główna oś mapy leży na najgorszej osi telefonu

Kadr ma **772 px szerokości, ale tylko 356 wysokości** (proporcja 2,17).
Mapa ma proporcję **1,67**, czyli jest **5,4 ekranu wysoka przy 4,1 szerokim** —
więcej ekranów na osi, na której gracz widzi 2,2 × mniej.

To nie jest estetyka. `fauna_faza1.md` §3.3 zmierzył konsekwencję **przed
tym audytem, przy zupełnie innej okazji**:

> *„Jeleń uciekający »od gracza« w pionie wychodzi z kadru po ~1,3 zrywu,
> w poziomie mieści się przez całą pętlę pościgu. Żadna wartość `boltSpeed`
> tego nie naprawia, bo to jest kształt ekranu, nie liczba."*

Czyli: **droga-kręgosłup biegnie N–S, a mechanika ucieczki sarny, którą
właśnie wdrożyliśmy, działa poprawnie tylko przy podejściu E–W.** Mapa
i Faza 1A ciągną w przeciwne strony.

---

## 6. Propozycja stref ekologicznych

Siedem stref na **tej samej mapie 100×60**. Granice w kaflach.
Podgląd: `docs/img/las_propozycja.png`.

### Z1 · STARY WYRĄB — x 0–19, y 0–16 (dziś: martwa ćwiartka)

**Klimat:** cisza i ślady ludzi. **Pustka jako treść, nie jako brak treści.**

**Fauna:** ⚠ **żadna, celowo.** To jest strona najbliżej Zagajów — tu wieś bierze
drewno, więc zwierzyna się wyniosła.

**Zagrożenia:** żadne.

**Dlaczego tutaj:** ten obszar **już jest pusty** (1250 px od czegokolwiek).
Dziś czyta się jako „niedokończone". Wystarczy dać mu powód: pieńki (`pniak`
istnieje, użyty raz), wydeptane klepisko z kafli `ziemia`, mielerz, odnoga
ścieżki, która się urywa. **Zero nowej grafiki, zero nowych stworzeń** —
najtańsza strefa w dokumencie i jedyna, która realizuje „ten las istniał zanim
tu przyszedłem" przez człowieka, a nie przez zwierzę.

### Z2 · SKRAJ LASU — x 19–58, y 0–16

**Klimat:** pierwszy kontakt, jasno, szerokie prześwity. Brzoza i buk.

**Fauna:** ptak i **sarna przy drodze** (dziś pierwsza sarna stoi przy starcie
nowej gry — czyli w miejscu, do którego gracz wraca raz w życiu).

**Zagrożenia:** zero albo jeden królik na skraju.

**Dlaczego tutaj:** to jest wejście, którym gracz wchodzi **za każdym razem**
po pierwszej wizycie w Zagajach. Dziś pierwsze 11 sekund tej drogi jest puste.

### Z3 · RZEKA — PRÓG — cała szerokość, y 16–26

**Klimat:** granica. Woda, brzeg, szuwary, jedno przejście.

**Fauna:** sarna przy wodopoju (**podejście po osi POZIOMEJ**, §5.3), lis
węszący po brzegu, ptaki wodne.

**Zagrożenia:** żadne. **Próg ma być cichy — groźnie robi się po drugiej
stronie.**

**Dlaczego tutaj:** to jest **najlepsza kość tej mapy i dziś martwa**. Rzeka
dzieli mapę w całości, ma jedno przejście i lejkowaty północny brzeg. Potrzebuje
trzech rzeczy: **kolizji na wodzie**, brzegu (piasek/trzcina zamiast 22 kafli),
i mostu albo wyraźnie zwężonego brodu — `swiat.md` §4.3 prosi o to od dawna
(*„zwężenie, rozpadające się barierki"*).

### Z4 · TWÓJ REWIR — x 22–54, y 26–52

**Klimat:** las roboczy. Znany, przewidywalny, twój.

**Fauna:** króliki (**zostają tam, gdzie są** — jedyna dobrze rozstawiona grupa
na mapie).

**Zagrożenia:** króliki, samotny wilk na zachodnim skraju jako ostrzeżenie.

**Dlaczego tutaj:** `swiat.md` §4.2 zapisał to zadanie i nigdy go nie wykonano:
*„Zagęścić drzewa na południe od rzeki, żeby polany z zającami były czytelne.
Teraz las jest rzadki i wszystko wygląda tak samo."* **Potrzeba 2–3 zwartych
polan po 40–120 kafli, obrysowanych drzewami** — i to samo w sobie naprawia
§2.3.

### Z5 · BÓR WILKÓW — x 0–22, y 36–59

**Klimat:** zagrożenie. Najciemniej, najgęściej, świerk i grab.

**Fauna:** żadna. Zwierzyna nie mieszka u wilków.

**Zagrożenia:** sfora (3), Szary głębiej.

**Dlaczego tutaj:** ⚠ **nie ruszać.** `swiat.md`: *„Wilk zostaje w SW rogu.
Leży idealnie: blisko wioski (dlatego przyszedł), z dala od drogi (dlatego nie
spotkasz go przypadkiem na 1. poziomie)."* Pomiar to potwierdza: 70–83 %
zadrzewienia (najwięcej na mapie), 548–832 px od drogi, sfora zwarta w 115–133 px.
**To jedyna strefa, która już działa.** Brakuje jej wyłącznie **czytelnej
krawędzi** — ściany świerku wzdłuż x ≈ 22 i y ≈ 36, żeby wejście w nią było
zdarzeniem, a nie kolejnym krokiem.

### Z6 · OLSZYNA / MOKRADŁO — x 54–74, y 26–40 (nowa)

**Klimat:** mokro, ciemno, grząsko. Rozlewiska bez odpływu, ciemna ziemia,
świerk.

**Fauna:** żadna stała.

**Zagrożenia:** **dziki.**

**Dlaczego tutaj:** dwa powody. Po pierwsze, to jest **duży pusty obszar tuż
przy trasie gracza** (mapa pustki, wiersze 26–33). Po drugie —
**dzik jest zwierzęciem mokrego podszytu i babrzysk, a dziś stoi na gołej
trawie 600 px od drogi.** Nie trzeba go przesuwać daleko: dzik #1 (62,34)
leży już na południowym skraju tego obszaru. **Trzeba zbudować teren wokół
niego, nie przesuwać jego.**

### Z7 · SKRAJ GĘSTWINY — x 74–99, y 26–56

**Klimat:** las robi się cudzy. Świerk wypiera brzozę, prześwity się zamykają.

**Fauna:** żadna. **Brak zwierzyny JEST informacją** — `bestiariusz_audyt.md`
§3 nazwał to „największą pojedynczą szansą ekosystemową w projekcie".

**Zagrożenia:** sieciarze, potem skoczki, potem brama.

**Dlaczego tutaj i dlaczego pająki tutaj:** `swiat.md` mówi, że pająki *„nie
polują jak zwierzę, tylko oplątują i czekają"* i mają sprawiać wrażenie, że
*„wschodnia gęstwina należy już do kogoś innego"*. Linia skoczków na wschód
(72,42) → (84,45) → (87,47) **już to robi**. ⚠ **Ale teren pod nią jest
najrzadszy na mapie i gradient gatunków drzew jest odwrócony (§2.4).**
To jest strefa wymagająca największej pracy kaflami i dająca największy zwrot:
**przejście do Gęstwiny przestaje być drzwiami, a staje się drogą.**

---

## 7. Ocena obecnego rozkładu — odpowiedzi wprost

| pytanie ze zlecenia | odpowiedź | dowód |
|---|---|---|
| **Wilki — czy tworzą terytorium?** | ✅ **TAK, jako jedyne.** | 3 sztuki w promieniu 115–133 px (`callRadius` 200 działa), 70–74 % zadrzewienia, 548–660 px od drogi, Szary 296 px głębiej przy 83 % drzew |
| **Wilki — czy wyglądają jak wataha?** | ✅ tak przestrzennie, ⚠ nie wizualnie | teren wokół nich jest ciemny, ale **nic nie zaznacza, że to ICH miejsce** — brak granicy, brak śladów, brak legowiska |
| **Dziki — czy mają odpowiednie środowisko?** | ❌ **NIE** | oba na gołej trawie (53 % i 39 % drzew, 0 % wody w promieniu 5 kafli); dzik potrzebuje podszytu i błota, których na tej mapie nie ma nigdzie |
| **Pająki — czy mają swoją strefę?** | 🟡 **skoczki tak, sieciarze nie** | skoczki tworzą linię na wschód ✅; sieciarze stoją na **południowej krawędzi mapy** (y 55–56 z 60), czyli poza jakąkolwiek strefą opisaną w `swiat.md` |
| **Jeleń — czy gracz ma szansę go zobaczyć?** | 🟡 **jedną z dwóch** | sarna #1: 134 px od startu nowej gry ✅, 180 px od drogi ✅. Sarna #2: martwy róg NE, 1564 px od startu, **nigdy nie wchodzi w kadr z drogi** ❌ |
| **Lis — czy jego miejsce pasuje do charakteru?** | 🟡 **jeden tak, drugi stoi w rzece** | lis #1 (900,900): 24 % wody, blisko stanowisk ziół → `FOX.interestRadius` ma na co działać ✅. Lis #2 (1900,600): **62 % wody w promieniu 5 kafli — spawn w środku rzeki** ❌ |
| **Niedźwiedź** | 🟡 pilnuje niczego | 1850 px od startu, 1420 px od bramy północnej, poza kadrem z drogi; asercje „osobne spotkanie" spełnia z dużym zapasem (930 px) |
| **Króliki** | ✅ | zwarty rewir 640×384 px, sąsiedzi 205–244 px, 101–345 px od drogi |
| **Ptaki** | 🟡 | 3 sztuki na 6000 kafli; #1 przy starcie działa |

### Wniosek §7

**Na dziewięć grup: jedna jest wzorowa (wilki), jedna dobra (króliki), dwie
mają połowę sztuk w złym miejscu (sarny, lisy — w tym jedna w wodzie), jedna
ma złe siedlisko (dziki), jedna stoi poza swoją fabularną strefą (sieciarze).**

⚠ To nie jest problem AI. Faza 1A dała sarnie działającą maszynę stanów
i pomiarowo potwierdzoną pętlę ucieczki. **Ta maszyna działa dziś przy
gęstości 0,09 sarny w kadrze i przy jednej z dwóch sztuk stojącej tam, gdzie
gracz nigdy nie chodzi.** Podejrzenie ze zlecenia — „problemem nie jest AI,
tylko lokacja" — **jest potwierdzone liczbowo.**

---

## 8. Propozycje zmian, w trzech zakresach

### 8.1 MINIMALNE — same dane, bez kodu, bez malowania

Sześć przesunięć. **Liczba stworzeń bez zmian (26).** Każda pozycja
zweryfikowana: teren suchy, nie na drodze, nie w budynku, **i przechodzi
wszystkie dziesięć asercji `build_mapa.py`**.

| # | co | z | na | dlaczego |
|---|---|---|---|---|
| M1 | **lis #2** | (1900,600) — **woda** | (1712,496) kafel 53,15 | naprawa błędu; brzeg zamiast toni, 34 % wody w promieniu 8 → siedlisko zostaje „przy wodzie" |
| M2 | **sarna #2** | (2500,700) — martwy róg NE | (2064,848) kafel 64,26 | brzeg rzeki na **osi poziomej** (`fauna_faza1.md` §3.3 — pionowa ucieczka wychodzi z kadru po 1,3 zrywu) |
| M3 | **ptak #2** | (1920,320) | (1360,432) kafel 42,13 | 290 px od bramy północnej — wypełnia dziurę „4–11 s pustej drogi" |
| M4–M6 | **sieciarze ×3** | y 1776–1808 (płd. krawędź) | (2480,1104), (2480,1680), (2608,1744) | wschód zamiast południowej krawędzi; ⚠ **zależy od rozstrzygnięcia §3.4** |

Po zmianach: `dzik-pajak` nadal > 340 ✅, wszystkie pozostałe asercje bez
zmian, widoczność z drogi 10 → 11 z 26.

⚠ **M4–M6 nie wykonywać przed decyzją z §3.4** (`swiat.md` „dwa przy dziku"
vs asercja „> 340"). Reszta jest bezsporna.

**Czego NIE proponuję w tym zakresie i dlaczego:**
- **nie ruszać wilków** — `swiat.md` mówi „leżą idealnie", pomiar to potwierdza;
- **nie ruszać królików** — jedyna dobrze rozstawiona grupa;
- **nie dodawać stworzeń** — zlecenie tego zabrania i słusznie: nie zoo.

### 8.2 ŚREDNIE — malowanie kafli, nadal bez kodu

| # | co | gdzie | koszt | co daje |
|---|---|---|---|---|
| **S1** | **2–3 czytelne polany w rewirze** | Z4, x 22–54 / y 26–52 | ~200 kafli drzew dostawionych wokół, ~80 wyczyszczonych w środku | naprawia §2.3 (zero polan) **i** wykonuje zaległe zadanie z `swiat.md` §4.2 |
| **S2** | **Odwrócić gradient wschodni** | Z7, x 74–99 | ~250 kafli: brzoza → świerk/grab, zwarcie 35 % → 65 % | naprawia największą sprzeczność z biblią świata (§2.4); brama do Gęstwiny przestaje być drzwiami |
| **S3** | **Brzeg rzeki** | Z3, cała szerokość y 16–26 | ~150 kafli piasku blob-47 + trzciny z kępek | rzeka dostaje brzeg zamiast krawędzi; siedlisko dla sarny/lisa/ptaków |
| **S4** | **Most albo zwężony bród** | x 38–45, y 20–25 | ~40 kafli + kafle z `Buildings` | `swiat.md` §4.3, zaległe; **próg staje się widoczny** |
| **S5** | **Podwórze Myśliwego** | Z2, x 60–72 / y 4–12 | ~120 kafli ziemi + płot + `znaki.png` | `mapy.md` obiecuje „trader's glade" — dziś chata stoi w gołej trawie |
| **S6** | **Ściana świerku na granicy boru** | Z5, x ≈ 22 i y ≈ 36 | ~100 kafli | wejście w terytorium wilków staje się zdarzeniem |
| **S7** | **Stary wyrąb** | Z1, x 0–19 / y 0–16 | ~150 kafli ziemi + istniejące `pniak` | martwa ćwiartka dostaje powód, żeby być pusta |
| **S8** | **Olszyna** | Z6, x 54–74 / y 26–40 | ~200 kafli wody plamami + ziemia + świerk | dziki dostają siedlisko **bez przesuwania dzików** |
| **S9** | **Zamknąć albo otworzyć drogę na południu** | x 34–36, y 55–59 | ~20 kafli **albo** 1 obiekt `portal` | dziś droga obiecuje kierunek i kończy się ścianą (kopalina po odwróconej geografii) |

⚠ **S1 i S2 robią najwięcej. Reszta jest dopracowaniem.**

### 8.3 DUŻE — wymagają kodu albo decyzji o przebudowie

| # | co | dlaczego to jest duże | warunek |
|---|---|---|---|
| **D1** | ⚠ **KOLIZJA KAFLI** | `docs/odlozone.md` §3: *„Zero static bodies — cały świat przechodni. Warunek powrotu: **layout mapy lasu uznany za ustabilizowany**."* | **Ten audyt jest tym momentem — albo decyzją, że jeszcze nie.** Patrz §8.4 |
| **D2** | Powiększenie mapy | patrz §10 | **nie rekomendowane teraz** |
| **D3** | Podział na kilka map | patrz §10 | **nie rekomendowane** |

### 8.4 ⚠ D1 jest warunkiem koniecznym dla połowy tego dokumentu

Bez kolizji:
- **rzeka nie jest progiem** — przechodzi się ją wszędzie, bród jest ozdobą;
- **bór wilków nie ma granicy** — wchodzi się w niego z każdej strony po skosie;
- **polany nie mają ścian** — obrys z drzew jest obrazkiem, nie kształtem;
- **skraj gęstwiny nie zwęża się** — zagęszczenie świerku to tylko kolor;
- ⚠ i, jak notuje `odlozone.md`, **jeden z trzech counterplayów sieciarza jest
  martwy od zawsze**: `map.solids` jest pusta, więc „teren pochłania sieć"
  nigdy nie działało (dokumentacja opisywała zamiar, nie stan).

**Sprawdzone w kodzie, nie założone:** `TiledMap.ts:478–498` buduje `solids`
wyłącznie z kształtów kolizji zdefiniowanych w tilesecie (`boxCache.boxesFor`).
Policzone: **w `forrest.tmj`, `village-zagaje.tmj` i `thicket-gestwina.tmj`
jest łącznie ZERO kafli z kształtem kolizji.** Dekoracje (`kamienie`, 58 sztuk)
też nie mają ciał — `GameScene.ts:804` tworzy je jako `this.add.image`.

⚠ **Konsekwencja dla Fazy 1A, o której trzeba wiedzieć:**
`fauna_faza1.md` R5 przyjął brak collidera krytterów jako świadomą cenę
(„zrywająca się sarna wejdzie w drzewo"). **Włączenie kolizji terenu nie
naprawia tego samo z siebie** — kryttery nie są wpięte w
`collider(_, map.solids)` (są tylko gracz, wrogowie i pociski —
`GameScene.ts:556/652/876`). Po D1 sarna nadal będzie przechodzić przez drzewa,
ale **teraz na tle świata, w którym gracz przez nie nie przechodzi** — czyli
błąd, który dziś jest niewidoczny, stanie się widoczny. To jest osobna, drobna
zmiana (jedna linia w `GameScene`), **ale musi wejść razem z D1, nie po**.

---

## 9. Tabela stworzeń — obecna rola → docelowa rola

| stworzenie | obecna rola | docelowa rola | miejsce występowania (strefa) |
|---|---|---|---|
| **Ptak** ×3 | tło, przeskoki tweenem | **pierwszy dźwięk życia po wyjściu z Zagajów** | Z2 Skraj (1 tuż za bramą), Z3 Rzeka (wodne); Z1 — ⚠ **nie** |
| **Sarna** ×2 | 1× wzorowo przy starcie, 1× w martwym rogu | **miara, że las jest większy niż gracz**; reakcja z Fazy 1A wreszcie widziana | Z2 Skraj (przy drodze), Z3 Rzeka (wodopój, **oś pozioma**) |
| **Lis** ×2 | 1× działa, 1× **w wodzie** | **dowód, że las ma własne sprawy** — kierunek wędrówki jako zamiar | Z3 brzeg rzeki, Z4 skraj rewiru przy stanowiskach ziół |
| **Królik** ×5 | rewir gracza, quest Myśliwego | **bez zmian — to działa** | Z4 Rewir, na polanach (S1) |
| **Wilk** ×3 + **Szary** | terytorium ✅ | **bez zmian w pozycjach**; dostają czytelną granicę | Z5 Bór wilków |
| **Dzik** ×2 | telegrafowana szarża na gołej łące | **strażnik mokradła** — środowisko zgodne z gatunkiem | Z6 Olszyna (teren zbudowany **wokół nich**) |
| **Sieciarz** ×3 | na południowej krawędzi mapy | **pierwszy znak, że las należy do kogoś innego** | Z7 Skraj gęstwiny ⚠ po decyzji §3.4 |
| **Skoczek** ×3 | linia na wschód ✅ | **bez zmian w pozycjach**; teren wokół ma się zamykać | Z7 Skraj gęstwiny, głębiej |
| **Niedźwiedź** | osobne spotkanie w martwym rogu | **strażnik czegoś** — albo zostaje jako nagroda za zapuszczenie się | Z1/Z2 pogranicze, albo bez zmian |
| **Zwierzęta gospodarskie** | — | **nie w lesie** | (Zagaje) |

⚠ **Neutralność sarny, lisa i ptaków zostaje na stałe** — `bestiariusz_audyt.md`
§5.5 jest tu barierką: *„las, w którym wszystko da się zabić, jest listą celów"*.

---

## 10. Skala lokacji — czy powiększać?

### 10.1 Pomiar

| | |
|---|---|
| mapa | 3200 × 1920 px = 100 × 60 kafli = **6000 kafli** |
| kadr telefonu | 772 × 356 px = **24 × 11 kafli** |
| **ekrany** | 4,1 w poziomie × 5,4 w pionie ≈ **22 nienachodzące** |
| przejście E–W | 21 s stępa / 13 s sprintem |
| przejście N–S | 13 s / 8 s |
| **droga N–S w całości** | **19 s / 12 s** |
| przekątna | 25 s |

Podział powierzchni:

| | udział |
|---|---|
| otwarte (bez drzewa, bez wody) | 45 % — ale w 2 wielkich, bezkształtnych plamach |
| pod koronami | 46,3 % |
| woda | 8,4 % |
| droga | 2,9 % |
| **dalej niż pół kadru od czegokolwiek żywego** | **28,0 %** |
| w zasięgu agro jakiegokolwiek wroga | 24,2 % |

### 10.2 Arena czy lokacja?

**Dziś: ani jedno, ani drugie — to jest przejazd.**

Nie arena, bo arena ma ściany i te 6000 kafli nie mają żadnych. Nie lokacja,
bo przez lokację się **podróżuje**, a tę przechodzi się drogą w 19 sekund,
mijając 10 z 26 stworzeń.

### 10.3 Pojemność na strefy — liczba, która rozstrzyga

Strefa czytelna na telefonie musi mieć **co najmniej ~20 × 14 kafli** (kadr
plus margines, żeby dało się zobaczyć wnętrze i krawędź) i **najwyżej ~35 × 25**
(powyżej przestaje różnić się od „mapy"). To daje 280–875 kafli na strefę;
przyjmijmy 500.

| wariant | kafli | użytecznych (bez rzeki i drogi) | stref po ~500 kafli |
|---|---|---|---|
| **dziś 100×60** | 6000 | 5316 | **10,6** |
| B: 140×60 | 8400 | 7442 | 14,9 |
| C: trzy mapy 64×64 | 12288 | 10887 | 21,8 |

⚠ **Obecna mapa mieści dziesięć stref. Zaproponowałem siedem.
Powierzchnia nie jest ograniczeniem — nie jest nim nawet z zapasem 50 %.**

To jest odpowiedź na pytanie ze zlecenia i jest liczbowa: **problemem nie
jest ile mapy jest, tylko że nic jej nie dzieli.** Powiększenie
nieodgrodzonego pola daje większe nieodgrodzone pole.

### 10.4 Porównanie z pozostałymi mapami projektu

| mapa | kafli | zawartość |
|---|---|---|
| **Zagaje** 100×100 | 10 000 | 0 wrogów, 16 zwierząt gospodarskich, 19 NPC |
| **LAS** 100×60 | **6 000** | 19 wrogów, 7 fauny, rzeka, kupiec, 2 bramy |
| **Gęstwina** 64×64 | 4 096 | 5 wrogów, 0 fauny |

⚠ **Flagowa lokacja jest o 40 % mniejsza od wsi, w której nie ma ani jednego
wroga.** To jest argument ZA powiększeniem — ale dopiero drugi w kolejności,
po tym z §10.3.

### 10.5 Trzy opcje

#### Opcja A — zostawić 100×60

**Plusy**
- Pojemność wystarcza z zapasem 50 % (§10.3).
- Zero pracy z portalami: `tools/portale.py` (`BRAMA_GESTWINY`), obie kopie
  `.tmj`, `spawnX/spawnY` po obu stronach — nic z tego nie trzeba ruszać.
- Cała praca idzie w to, co faktycznie brakuje: **granice, siedliska, gradient**.
- **Nie zwiększa puli XP** — a ta jest już przestrzelona i `odlozone.md`
  ma na to jawny warunek: *„nowa zawartość nie dokłada do przestrzelonej puli"*.
- Nie rusza dziesięciu przechodzących asercji.

**Minusy**
- Zostaje ~19 s na przejście drogi. Poczucie „podróży" wróci tylko przez
  spowolnienie ruchu przez teren — czyli przez kolizję (D1), nie przez metry.
- Nie da się zbudować pełnej progresji „obrzeże → głęboki las → za rzeką →
  gęstwina" na osi wschód–zachód **z dzisiejszym rozstawieniem bram**
  (brama wschodnia siedzi na krawędzi).

#### Opcja B — powiększyć, i to **wyłącznie w poziomie** (np. 140×60)

**Plusy**
- ⚠ **Rośnie oś, którą gracz w ogóle widzi.** Kadr jest 2,17 raza szerszy niż
  wyższy; mapa jest dziś 5,4 ekranu wysoka przy 4,1 szerokim, czyli
  **odwrotnie niż powinna**.
- Naprawia to, co §5.3 wykryło jako konflikt z Fazą 1A: sarna ucieka czytelnie
  tylko w poziomie, a kręgosłup mapy biegnie w pionie.
- Daje miejsce na prawdziwe wejście do Gęstwiny **na mapie**, zamiast bramy
  wciśniętej w krawędź.
- Przyszłe polowanie i tropienie potrzebują dystansu na osi widzenia.

**Minusy**
- `tools/portale.py` + obie kopie `.tmj` + `spawnX/spawnY` w Gęstwinie.
  ⚠ **Reguła `src/world/CLAUDE.md`: poszerzenie bramy robi się TAM, na obu
  mapach naraz** — nigdy przez dostawienie drugiego obiektu.
- +2400 kafli do zamalowania, w tym rama drzew od nowa.
- **Dokłada do puli XP**, jeśli powiększenie przyjdzie ze stworzeniami.
- `tools/build_mapa.py` (`SZER, WYS = 100, 60`) odjeżdża jeszcze dalej od `.tmj`.

#### Opcja C — podzielić las na kilka mniejszych map

**Plusy**
- Każda mapa może mieć własny charakter bez kompromisów.
- Wzorzec sprawdzony — Gęstwina działa i jest najlepiej wyglądającą mapą w grze.

**Minusy**
- ⚠ **Podatek od przejść.** `swiat.md` §3 zapisał to jako zmierzony problem
  wioski: *„im większa mapa, tym dotkliwszy podatek od każdego powrotu z lasu"*.
  Trzy mapy zamiast jednej to dwa dodatkowe ładowania na każdą pętlę
  wieś → las → łup → powrót.
- **Zabija wszystko, co ten audyt proponuje.** Sarna, która ucieka za granicę
  mapy, znika. Wilki, które wyją przez granicę, nie słyszą się. Lis idący do
  ziela za granicą nie ma dokąd iść. **Ekosystem nie przechodzi przez bramę.**
- Zwiększa liczbę bram z 2 do 4–5, każda z własnymi `spawnX/spawnY` po obu
  stronach.

### 10.6 ⚠ Rekomendacja: **A teraz, B później i wyłącznie w poziomie. C — nie.**

**Uzasadnienie, nie preferencja:**

1. **Powierzchnia nie jest wąskim gardłem** (§10.3: mieści 10 stref, potrzeba 7).
   Powiększanie przed odgrodzeniem to leczenie objawu.
2. **Wszystkie problemy z §2, §3 i §5 są niezależne od rozmiaru.** Jednorodne
   podłoże, brak polan, odwrócony gradient, dzik na łące, lis w wodzie — żaden
   z nich nie zniknie po dołożeniu kafli i żaden nie wymaga ich dołożenia.
3. **Warunek powrotu kolizji brzmi „layout uznany za ustabilizowany".**
   Powiększenie mapy resetuje ten warunek na kolejne miesiące. Kolizja jest
   warunkiem koniecznym dla siedmiu stref (§8.4); rozmiar nie jest warunkiem
   dla żadnej.
4. **Pula XP jest przestrzelona i ma jawną barierkę.** A powiększenie zwykle
   przychodzi ze stworzeniami.
5. **Ale argument z §5.3 jest realny i nie zniknie**: mapa rośnie na złej osi
   względem telefonu, a Faza 1A właśnie zbudowała mechanikę, która to czuje.
   Dlatego B nie jest odrzucone — jest **odłożone z warunkiem**: wraca, gdy
   polowanie albo tropienie stanie się tematem sesji, i wtedy **rośnie w X**.

**Kolejność, którą proponuję:**

> **D1 (kolizja) → S1 + S2 (polany i gradient wschodni) → M1–M3 (naprawy
> spawnów) → playtest → dopiero potem reszta S i ewentualnie B.**

Uzasadnienie kolejności: D1 zmienia to, jak czyta się KAŻDY kafel postawiony
później. Malowanie polan przed kolizją to malowanie ścian, przez które się
przechodzi.

---

## 11. Wynik: A czy B?

> ### Faza 1B wymaga **głównie zmian danych i mapy (A)**, z jednym wyjątkiem w kodzie, który jest warunkiem koniecznym dla reszty.
>
> **Dane i mapa (A):** 6 przesunięć spawnów, ~1200 kafli do przemalowania
> w dziewięciu miejscach, 1 obiekt `portal` do dodania albo usunięcia.
>
> **Kod (B) — dokładnie dwie rzeczy, obie z `odlozone.md`, nie nowe:**
> 1. **Kształty kolizji w tilesecie** — `TiledMap` już to czyta i spłaszcza
>    między warstwami; wystarczy narysować boksy w Tiled. ⚠ Zero linii nowego
>    kodu ładującego, ale **decyzja**, że layout jest ustabilizowany.
> 2. **Jedna linia: `collider(critters, map.solids)`** — musi wejść razem
>    z (1), inaczej Faza 1A zacznie wyglądać na zepsutą (§8.4).
>
> **Nie wymaga:** nowych systemów AI, nowych stworzeń, nowych relacji
> międzygatunkowych, powiększania mapy.

---

## 12. Pliki wymagające zmian

| plik | zakres | uwagi |
|---|---|---|
| `public/assets/maps/forrest.tmj` | spawny (§8.1), kafle (§8.2), kształty kolizji (§8.3) | ⚠ skryptem jednorazowym albo w Tiled; **skrypt NIE zostaje w `tools/`** |
| `public/assets/forrest.tmj` | ⚠ **najpierw zsynchronizować z kopią z `maps/`** — dziś się różnią | §1.1 |
| `docs/swiat.md` | §4: rozstrzygnąć sprzeczność „dwa sieciarze przy dziku" (§3.4); zaktualizować geografię po D-2/D-3 | ⚠ tekst wciąż zakłada wioskę na południu |
| `docs/mapy.md` | „a trader's glade in the NE" — polany tam nie ma; „same content, different path" — nieprawda | |
| `docs/odlozone.md` | §3 „Kolizje kafelkowe w lesie" — warunek powrotu spełniony albo świadomie odroczony | **decyzja autora** |
| `docs/README.md` | wpis dla tego dokumentu | ⚠ **w tej samej sesji** |
| `src/scenes/GameScene.ts` | 1 linia: `collider(critters, map.solids)` | **tylko razem z kolizją** |
| `tools/build_mapa.py` | ⚠ **NIE ruszać** — `--zapisz` skasuje pracę z Tiled | asercje z `raport()` zostają kopertą ograniczeń |
| `tools/portale.py` | **tylko przy Opcji B** | obie mapy naraz |
| `docs/img/` | **nowy katalog** — dwa renderowane obrazy do tego raportu | pierwszy katalog obrazów w `docs/` |

---

## 13. Ryzyka

| # | ryzyko | dlaczego groźne | co je zdejmuje |
|---|---|---|---|
| R1 | **Malowanie stref przed kolizją** | ściany, przez które się przechodzi; praca do powtórzenia | D1 idzie pierwsze (§8.4) |
| R2 | **Kolizja bez collidera dla krytterów** | Faza 1A zacznie wyglądać na zepsutą — sarna przechodząca przez drzewo w świecie, gdzie gracz nie przechodzi | jedna linia, **razem z D1** |
| R3 | **Ruszenie wilków** | jedyna działająca strefa; `swiat.md` mówi „leżą idealnie", pomiar potwierdza | §6 Z5 mówi „nie ruszać" |
| R4 | **Przesunięcie łamiące asercje po cichu** | `build_mapa.py` raportuje o SWOIM wyniku, nie o `.tmj` | wszystkie propozycje z §8.1 sprawdzone w kopercie; sprawdzać każdą następną |
| R5 | **Dodanie stworzeń „przy okazji"** | zlecenie zabrania; pula XP przestrzelona | liczba stworzeń w §8 = 26, bez zmian |
| R6 | **Powiększenie mapy jako pierwszy ruch** | resetuje warunek powrotu kolizji na miesiące, dokłada do puli XP, nie rozwiązuje żadnego problemu z §2–§5 | §10.6 |
| R7 | **Ruszenie sieciarzy przed decyzją §3.4** | `swiat.md` i `build_mapa.py` mówią przeciwne rzeczy o tym samym | M4–M6 wstrzymane do decyzji |
| R8 | **Praca na złej kopii `.tmj`** | `assets/forrest.tmj` jest o 3 dni starszy | §1.1, synchronizacja przed czymkolwiek |

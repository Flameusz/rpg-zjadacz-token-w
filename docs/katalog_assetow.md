---
typ: KANON
domena: assets
tytul: Katalog assetów środowiska
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-07
---

# Katalog assetów środowiska — drzewa, pniaki, krzewy, zioła, skały, dekoracje

**Kanoniczny inwentarz assetów środowiska.** Ten plik odpowiada na pytania
„co faktycznie istnieje, gdzie leży, w jakim jest stanie, czego brakuje" —
`docs/README.md` nie miał wcześniej takiego dokumentu (sprawdzone przeglądem
całego indeksu 2026-08-30, patrz checkpoint w `docs/dziennik.md`).
Najbliżsi krewni i jak się dzielą zakresem:

| plik | czym jest | czym NIE jest |
|---|---|---|
| **ten plik** | status per asset (FINAL/TEST/LEGACY), gdzie leży, jakie ma ograniczenia | nie tłumaczy PIKSELI arkuszy |
| `public/assets/README.md` | ⚠ **źródło prawdy o PIKSELACH** — układ arkuszy, siatki, metody cięcia | nie śledzi statusu projektowego per asset |
| `docs/mapy.md` | co stoi NA MAPACH i dlaczego (rozmieszczenie) | nie jest listą plików |
| `docs/forest_rebuild_scope.md` | zakres przebudowy TERENU (A1–A10, Tiled) | nie jest inwentarzem grafik |
| `docs/ZADANIE_drzewa.md` | ⚠ **NIEAKTUALNY** stały brief („5 z 9 gatunków") — ten plik go zastępuje jako źródło stanu | — |

⚠ **Zasada utrzymania**: nowy asset środowiska dostaje wiersz TUTAJ w tej samej
sesji, w której powstaje — inaczej ten katalog rozjeżdża się z kodem tak samo,
jak rozjechał się `ZADANIE_drzewa.md`.

---

## 1. ASSET INVENTORY

### 1.1 Drzewa

⚠⚠ **Najważniejszy fakt tej sekcji**: prawdziwy atlas renderujący 1595 drzew
na żywej mapie (`src/world/TreeStampManifest.ts`, `TREE_STAMPS`/
`TREE_STAMPS_BIG`, generowany przez `tools/build_tree_stamps.py`) **NIE jest
tym samym, co „drzewa zamknięte w tej sesji"**. Sprawdzone czytaniem pliku
2026-08-30, nie z pamięci:

| gatunek | w `TREE_STAMPS` (żywy atlas, id) | status |
|---|---|---|
| dąb | `dab_duzy_new`/`duzy2` (0,1), `dab_sredni_new` (15), `dab_maly_new` (24) | ✅ FINAL, atlas = docelowa grafika |
| **buk** | **NOWY (buki-v1):** `buk_sredni`/`buk_sredni2` (35,36), `buk_maly` (37) w `TREE_STAMPS`; `buk_duzy`/`buk_duzy2` (2,3) w `TREE_STAMPS_BIG` (128 px, komórka 160). **STARY:** `buk_duzy_new`/`sredni_new`/`maly_new` (2,16,25) = LEGACY, niereferowany przez mapę | ✅ FINAL (ETAP4, 2026-08-31), atlas = docelowa grafika |
| świerk | `swierk_duzy_new`/`duzy2`/`duzy3` (3-5), `swierk_sredni_new` (17), `swierk_maly_new`/`maly2` (26-27) | ✅ FINAL |
| brzoza | `brzoza_duza_new`/`duza2`/`duza3` (6-8), `brzoza_srednia_new`/`srednia2` (18-19), `brzoza_mala_new` (28) | ✅ FINAL |
| grab | `grab_duzy_new`/`duzy2`/`duzy3` (9-11), `grab_sredni_new`/`sredni2` (20-21), `grab_maly_new` (29) | ✅ FINAL |
| olcha | `olcha_duza_new`/`duza2`/`duza3` (12-14), `olcha_srednia_new`/`srednia2` (22-23), `olcha_mala_new` (30) | ✅ FINAL |
| wierzba | `wierzba_srednia_new`/`srednia2` (31-32), `wierzba_mala_new`/`sadzonka` (33-34) w `TREE_STAMPS`; **`wierzba_duza_new`/`duza2` w OSOBNYM `TREE_STAMPS_BIG`** (komórka 160px, tileset `TreeStampsBig`) | ✅ FINAL — jedyny gatunek z własną, większą klasą komórki |

**Nowy zestaw buka — ZMIGROWANY DO STEMPLI (ETAP4, 2026-08-31).** 5 wariantów
z `buki-v1.png`, wpięte jako **standalone** (klucz `beeches` w
`docs/forrest_atlas.json`, mechanika identyczna z `willows` — osobne PNG, nie
crop z `forrest.png`). Renderowane jak każde inne drzewo: pień (pas dolny,
pasmo encji) + korona (nad encjami), depth per-drzewo.

| wariant (manifest) | plik standalone | komórka | sheet |
|---|---|---|---|
| `buk_duzy` | `docs/art-review/trees/buk_v1_large-128x128.png` | 128 px | `TreeStampsBig` (160) |
| `buk_duzy2` | `…/buk_v1_large2-128x128.png` | 128 px | `TreeStampsBig` (160) |
| `buk_sredni` | `…/buk_v1_medium-96x96.png` | 96 px | `TreeStamps` (96) |
| `buk_sredni2` | `…/buk_v1_medium2-96x96.png` | 96 px | `TreeStamps` (96) |
| `buk_maly` | `…/buk_v1_small-64x96.png` | 64×96 px | `TreeStamps` (96) |

Duży buk (128 px) > dąb (96) — świadome, wynika z zaakceptowanej grafiki
(native, bez upscalingu). **Nie wymyślono nowej klasy komórki** — 128 mieści
się w istniejącej `TreeStampsBig` (160), tej samej co wierzba duża.

Status: **FINAL, aktywny w atlasie.** 140 obiektów buka na mapie przepięte ze
starego stempla na nowy (55 duży → BIG 160, 51 średni, 34 mały). Testowe
`buk_test_*` na `objects` (5 szt.) — USUNIĘTE. `beechTree*` w
`ASSETS`/`DECOR_PROPS` + pliki `props/beech_tree_*.png` — USUNIĘTE.

⚠ **STARY buk = LEGACY.** `buk_duzy_new`/`buk_sredni_new`/`buk_maly_new`
(id 2/16/25 w `TREE_STAMPS`, grafika w `forrest.png`) — **niereferowany przez
żaden obiekt na mapie**. Zostaje w arkuszu `tree_stamps.png` i manifescie
TYLKO dlatego, że usunięcie przenumerowałoby 1633 drzewa (id 3..37). **Nie
usuwać, nie przypisywać roli.** Źródła: `docs/art-review/trees/
buk_duzy_new-96x96.png` (+ `_sredni`/`_maly`) — zachowane jako historia.

**Decyzje projektowe (obowiązujące, patrz §2):** skala drzewa wynika z
wielkości względem gracza, nie ma jednej wspólnej skali dla wszystkich
gatunków, wierzba ma własną, większą klasę komórki (`TreeStampsBig`),
proporcje źródła zachowane. **Wszystkie 7 gatunków (w tym buk od ETAP4) są
w atlasie stempli** — jeden system renderowania drzew.

---

### 1.2 Pniaki — 7 gatunków × 3 stany = 21, FINAL; renderowane jako `DECOR_PROPS` (bez `StumpStamps`)

Źródła: `docs/art-review/{dab-pniaki-alt,pniaki-brzozy,swierk-pniaki,buki-v1,
graby-pien,olcha-pien,wierzba-pnie}.png`. Stany: `fresh`/`weathered`/`old`
(pol. świeży/zwietrzały/stary). Pliki: `public/assets/props/
<gatunek>_stump_{fresh,weathered,old}.png`.

| gatunek | szer. świeżego | baza dużego drzewa (zmierzona) | stosunek |
|---|---|---|---|
| dąb | 38 px | 43 px | ×0,88 |
| brzoza | **23 px** (skorygowane z 40) | 17 px | ×1,35 |
| świerk | **20 px** (skorygowane z 34, dobrane wizualnie) | ~10 px (pomiar niepewny — pień ucięty krawędzią kanwy) | — |
| buk | 48 px | 40 px | ×1,20 |
| grab | **28 px** (skorygowane z 36) | 21 px | ×1,33 |
| olcha | 33 px | 25 px | ×1,32 |
| wierzba | 58 px (świadomie największy) | 49 px | ×1,18 |

⚠ **Zasada obowiązująca (§2.3) — NIE zmieniać tych liczb bez nowej, wyraźnej
decyzji autora.** Brzoza/świerk/grab zostały świadomie skorygowane po
porównaniu z podstawą odpowiadającego dużego drzewa (pierwsza wersja
wszystkich trzech była przewymiarowana, do ×3,4 rzeczywistej podstawy pnia).

Status: **FINAL jako assety i skala.**

**Sposób renderowania — `DECOR_PROPS` (ETAP4, 2026-08-31; `StumpStamps` NIE
powstał — nie był potrzebny).** Analiza: A. `DECOR_PROPS` / B. `StumpStamps` /
C. inne — wybrano **A**, bo pniaki już są w `DECOR_PROPS` i to spełnia
wszystkie wymagania:
- origin (0.5, 1) — punkt Tiled = linia gruntu ✓
- depth `DEPTH.entities + spot.y` — sortuje się po stopach z graczem/obiektami ✓
- **brak podziału pień/korona** — pniak to jeden sprite naziemny, nie ma
  korony „nad encjami" → osobny system stempli nie ma czego rozwiązać
- stan `swiezy`/`zwietrzaly`/`stary` — 3 osobne wpisy `DECOR_PROPS` na gatunek
- **bez fizyki** — `DECOR_PROPS` renderuje `add.image` bez ciała; obiekty
  punktowe **bez `gid`** → `buildTreeLayer` je pomija, **nie dziedziczą
  kolizji drzew**
`StumpStamps` byłby uzasadniony tylko przy: podziale pień/korona (nie ma),
tilesecie edytorowym dla dużych nakładających się sprite'ów (pniaki są małe,
punktowe jak grzyby/kamienie), collision boxach (świadomie brak teraz),
setkach instancji (świadomie NIE masowo).

**Rozmieszczenie testowe (ETAP4):** z 34 zdublowanych instancji zostawiono
**21** — jedna na gatunek × stan, na sensownym gruncie, bez krawędzi mapy.
Klaster grab+olcha na x34–46/y44 = A5 delianki (las roboczy). Nazwy
`<gatunek>_pniak_{swiezy,zwietrzaly,stary}` w warstwie `objects`. Generyczny
`pniak` (`ASSETS.stump`, 1 szt.) — osobny LEGACY, nietknięty.
⚠ **Masowe rozmieszczenie pniaków po mapie (`forest_rebuild_scope.md` K1) —
NIE zrobione, świadomie.** To osobny, przyszły etap.

---

### 1.3 Krzewy — 11 wariantów FINAL; ETAP 2 rozmieszczenia wykonany (cała mapa, warstwa `krzewy`)

Źródło: `docs/art-review/krzewy.png` (11 rozłącznych komponentów). Pliki:
`public/assets/props/bush_*.png`. Trzy rodziny sylwetkowe:

| rodzina | warianty (klucz `ASSETS`) | canvas | opis |
|---|---|---|---|
| gęsta kopuła | `bushDomeSmall`/`Medium`/`Large` | 41×29 / 49×36 / 60×43 | progresja rozmiaru z JEDNEGO wspólnego współczynnika skalowania (0,737) |
| gęsta kopuła — akcenty | `bushDomeBerry`, `bushDomeFlower`, `bushDomeOlive` | 52×42 / 55×41 / 52×43 | jagody czerwone / kwiat biały / ton oliwkowy |
| gałęzisty/dziki | `bushTwiggyBareLeaf`, `bushTwiggyBerry`, `bushTwiggyBare` | 51×43 / 57×45 / 57×40 | widoczne drewniane gałęzie, coraz rzadszy listwo aż do zupełnie bezlistnego |
| niski/szeroki | `bushLowWide`, `bushLowSticks` | 74×28 / 75×32 | płaski profil, drugi z widocznymi skrzyżowanymi patykami |

Status: **assety FINAL** (izolacja bez przenikania, brak recoloru — paleta już
spójna z `forrest.png`, zmierzony średni dystans 23/mediana 21/zero
outlierów >60). **Skala zamrożona — współczynnik 0,737 dla rodziny gęstej
kopuły, nie normalizować ponownie.**

**ETAP 2 rozmieszczenia wykonany (2026-08-31, sesja przebudowy lasu)** —
33 testowe `krzew_*` skasowane z `objects`, **286 obiektów** na NOWEJ warstwie
obiektowej `krzewy` (osobna, jak `flora-wodna` — filtrowalna, nie mieszać z
florą wodną). Nazwy = te co w `DECOR_PROPS` (bez nowych). Model (z polecenia
autora):
- **gęsta kopuła (mały/średni/duży, 129)** — podstawowy podszyt, najczęstszy.
- **oliwkowy (48)** — subtelny wariant koloru **wmieszany w kępy kopuł**, nadal
  podstawowa flora (nie osobne skupiska).
- **kwitnący (19)** — rzadszy akcent na słonecznych polanach (środek polany,
  z dala od gęstego boru).
- **gałęzisty / suchy (51)** — skraje lasu, przejścia las↔polana, luźniejsze
  fragmenty.
- **niski / chrust (29)** — przy ścieżkach + gdzie wyższy krzew psułby
  widoczność.
- **jagodowe `dome_berry`/`twiggy_berry` (10)** — rzadkie akcenty. ⚠ **BEZ
  mechaniki zbierania, świadomie** — mogą kiedyś zostać zasobem, nie dodawać
  bez osobnej decyzji.
- Strefy (kafle): gęsty bór 9 (celowo lekko), luźny las 118, polana 116,
  przy ścieżce 38, otwarte/wyrąb 5 (celowo puste).
- Zasady: skupiska + prześwity, zmienny odstęp ziaren (4–9 kafli) i wewnątrz
  klastra (15–30 px), rozmiary klastrów 1 / 2–4 / 4–8 / 7–13, **brak rzędów**.
  Relacja z drzewami: max **2 krzewy** blisko jednego pnia (24 pnie na limicie),
  zakaz „ściany przed pniem" (strefa |dx|<13 px & pas pnia). 0 na ścieżce/
  wodzie, ≥24 px od flory wodnej, ≥36 px od stanowiska zioła.
- ⚠ **STREFA WYKLUCZENIA BUDYNKÓW — cała wizualna zabudowa, nie footprint
  przejścia.** Pierwsza wersja (2026-08-31) wykluczała tylko warstwę
  `buildings` (ściany) → **6 krzewów wylądowało na DACHU chaty Myśliwego**
  (`buildings-over`, rysowany nad encjami, bez kolizji). Poprawka
  (2026-08-31, korekta chirurgiczna — 7 przeniesionych tuż obok, reszta 279
  bez zmian): strefa = **suma wszystkich warstw kafli `buildings*` +
  `wyposazenie` + `znaki`, bufor 1 kafla**. Reguła ogólna — działa dla
  każdego budynku z modularnego zestawu (zawsze maluje na te warstwy), nie
  hardkod chaty. Skan wszystkich warstw obiektów (`krzewy`/`flora-wodna`/
  `objects`/`rosliny`/`kamienie`): 0 obiektów na kaflu konstrukcyjnym.
- ⚠ **Soft-collision / spowolnienie ruchu dla krzewów NIE zaimplementowane** —
  świadomie odłożone, autor chce najpierw ocenić rozmieszczenie wizualne.
- Skrypt jednorazowy `rozstaw_krzewy.py` **NIE zostaje w `tools/`**.

⚠ **Nazewnictwo**: obiekty na mapie to `krzew_*` (np. `krzew_jagodowy`,
`krzew_chrust`) — od ETAP 2 na własnej warstwie **`krzewy`**. **To NIE jest
to samo, co tile-layer `bushes`** (płaska warstwa kafli runa/podszytu,
malowana, część systemu terenu — patrz §4) — nazwa się powtarza przypadkowo,
dwa różne systemy.

---

### 1.4 Zioła — 11 gatunków, FINAL jako assety i siedliska

Źródło: `docs/art-review/ziola.png`. Pliki: `public/assets/props/
herb_<id>.png`. **Nie są `DECOR_PROPS`** — mają własny system
(`HERBS`/`Gatherable`/`NodeSpawner`/`Gathering`, `src/entities/
Gatherable.ts`), bo mają zachowanie (kołysanie, zbieranie, odrost).

| gatunek | plik | wysokość (px) | siedlisko (§gameplay, nie tylko dekoracja) |
|---|---|---|---|
| Babka lancetowata | `herb_babka.png` | 23 | pobocza dróg, wydeptane miejsca, murawy, wieś |
| Krwawnik pospolity | `herb_krwawnik.png` | 26 | suche łąki, miedze, przydroża, słoneczne polany |
| Pokrzywa zwyczajna | `herb_pokrzywa.png` | 33 | żyzna azotowa ziemia, płoty, obejścia, żyzne skraje lasu |
| Rumianek pospolity | `herb_rumianek.png` | 23 | ugory, miedze, skraje pól, pełne słońce |
| Dziurawiec zwyczajny | `herb_dziurawiec.png` | 28 | słoneczne polany/skraje lasu, suche zbocza — **nigdy gęsty cień** |
| Lebiodka pospolita | `herb_lebiodka.png` | 25 | suche ciepłe murawy, słoneczne polany, suche skraje lasu |
| Wrotycz pospolity | `herb_wrotycz.png` | 32 | przydroża, miedze, ugory, nieużytki, słoneczne naruszone tereny |
| Mięta polna | `herb_mieta.png` | 26 | wilgotne łąki, brzegi cieków, wilgotne rowy, okolice wody |
| Nawłoć pospolita | `herb_nawloc.png` | 28 | polany, skraje lasów, widne zarośla, świeże/umiarkowanie suche |
| Dziewanna | `herb_dziewanna.png` | 36 (najwyższa) | suche, mocno nasłonecznione, ugory — **zdecydowanie NIE mokradła** |
| Żywokost lekarski | `herb_zywokost.png` | 30 | wilgotne żyzne miejsca, brzegi cieków, wilgotne skraje zarośli/lasów |

⚠ **Judgment call do ewentualnej weryfikacji**: `lebiodka` vs `mieta` — źródło
miało dwa fioletowo kwitnące sprite'y bez podpisów, przypisane po
morfologii liścia (szerokie unerwione = mięta, wąskie skąpe = lebiodka).
Potwierdzone w sesji jako najlepsze dostępne dopasowanie, nie zmieniane.

**Siedlisko jest elementem gameplayu, nie dekoracją** — `HERBS[*].siedlisko`
w `GameConfig.ts` napędza docelowo zadania zbierackie. Rozmieszczenie
testowe zweryfikowane systematycznie (72 stanowiska, 0 na wodzie, 0
sprzeczności ekologicznych po korekcie 4 wcześniej błędnych stanowisk
babki/dziurawca).

**Proximity highlight — w RENDERERZE, nie w PNG.** `Gatherable.setNearPlayer()`
+ `GameScene.updateHerbGlow()`, Phaserowy `postFX.addGlow` (WebGL,
zabezpieczone na Canvas), pulsujący, kolor `GATHER.nearGlow` (0xc9d97a,
świadomie inny niż kolor znacznika celu walki). ⚠ **Nie zweryfikowane na
żywym renderze** — sandboxowa przeglądarka ma trwale zepsute WebGL (fakt
środowiskowy, niezwiązany z kodem). Sprawdzić w prawdziwej przeglądarce
przed poleganiem na tym efekcie.

Status: **FINAL jako roster/skala/siedliska. Rozmieszczenie zweryfikowane.
Proximity-glow zaimplementowany, ale wizualnie nie potwierdzony w silniku.**

---

### 1.5 Kamienie / skały — JEDEN system (23 warianty). Stary system WYCOFANY (ETAP 3, 2026-08-31)

**System kamieni (FINAL, jedyny) — 23 małe/średnie kamienie dekoracyjne.**
Źródło: `docs/art-review/kamienie-snapped.png` (41 wyizolowanych, 23
wybrane, 18 zostaje jako rezerwa w `docs/art-review/kamienie/`). Pliki:
`public/assets/props/stone_<klasa>_<nr>.png`, przepuszczone przez
`tools/snap_paleta.py` (wpis `_KAMIENIE_*`, patrz §4).

| klasa | n wariantów | wysokość | uwaga |
|---|---|---|---|
| drobny | 4 | 7–15 px | ~0,2–0,5 m |
| mały | 6 | 13–27 px | |
| średni | 6 | 21–35 px | |
| duży | 4 | 32–39 px | |
| głaz | 3 | 42–48 px | ~1,3–1,5 m, ⚠ **świadomie NIE większe niż sensowna przeszkoda terenowa** — dlatego stary `glaz_wielki` (136 px) NIE ma odpowiednika 1:1 |

⚠ **Rampa `mech`** (`docs/paleta.json`, 2026-08-30) — bez niej mech na
omszałych kamieniach snapował się do `ziemia`/`kora` i wychodził żółto-
brązowy. **Rampa `kamien` (chłodny szaro-niebieski) świadomie NIEUŻYWANA** —
źródło jest cieplejsze z założenia. **Ciepły ton to teraz celowa cecha
całego systemu** — siada spójnie obok `ziemia`/`kora`/traktu/flory wodnej,
gdzie stary chłodny `kamien` odstawał jako obcy materiał.

**Rozmieszczenie (ETAP 3, 2026-08-31): warstwa obiektowa `kamienie`, 142
obiekty.** Nazwy `kamien_<klasa>_<nr>` (= klucze `DECOR_PROPS`). Migracja ze
starego systemu: 58 starych kotwic + 34 wcześniejsze nowe → 142, przez model
kontekstowy (rozmiar wg strefy: otwarty teren większe, gęsty las drobne,
brzeg na LĄDZIE otoczaki). Landmarki: 3× stary `glaz_wielki` → **wychodnia**
(ciasna kępa 6–8 kamieni: 2 głaz + 2 duży + średnie/małe, promień ~1 kafla),
1× (róg x3,y3) → pojedynczy głaz. Stare `kupa_*` → kępy 2–3, `kamyki` →
rozsypki 3–5 drobnych, `filar` → pojedynczy duży, 4 kamienie na wodzie →
znikają (nowy pakiet nie ma wariantu wodnego). Bez kolizji (konwencja
zachowana). Skrypt `migracja_kamienie.py` **nie zostaje w `tools/`**.

**Stary system (LEGACY / RETIRED, 2026-08-14 → wycofany 2026-08-31).**
`kamienie.png` + `ASSETS.kamienie` + `ROCK_OBJECT_NAMES` + `RockSpawn` +
`map.rockSpawns` + `sliceKamienie()` + osobna pętla renderowania w
`GameScene` + `tools/build_kamienie.py` + `tools/rozstaw_kamieni.py` — **cały
łańcuch USUNIĘTY z aktywnego kodu i z `public/assets/`.** Historia w git;
`docs/referencje_zewnetrzne.md` (źródło `rocks.png`) zachowane. Powód: dwa
równoległe, stylistycznie różne systemy kamieni (chłodny 150-px vs ciepły
≤48-px) czytały się jak dwa niezwiązane pakiety — decyzja autora: jeden
spójny system.

---

### 1.6 Grzyby, brzeg stawu, lilia wodna, pniak z siekierą — LEGACY/FINAL, sprzed tej sesji

Cztery „drobiazgi przyrodnicze" z `public/assets/temp/` (skasowany po
przejęciu), wpięte 2026-08-14, udokumentowane w `public/assets/README.md`
(sekcja „Cztery drobiazgi przyrodnicze"). **Ten plik ich nie duplikuje —
patrz tamten dla pełnej historii izolacji/palety.**

| asset | plik | canvas | `DECOR_PROPS` | rozstawienie na mapie lasu |
|---|---|---|---|---|
| pniak (z siekierą) | `pniak_z_siekiera_paleta.png` | 48×36 | `stump` | 1× (+1 we wsi) |
| grzyby | `grzyby_paleta.png` | 14×19 | `mushrooms` | 3× na runie |
| brzeg stawu | `brzeg_stawu_paleta.png` | 36×32 | `pondEdge` | 2× przy rzece |
| lilia wodna | `lilia_wodna_paleta.png` | 22×14 | `lilyPad` | 2× na wodzie |

Status: **FINAL, nietknięte tą sesją.** ⚠ `stump`/`pniak_z_siekiera` to
**generyczny** pieniek (jeden, uniwersalny) — coś innego niż 21 gatunkowych
pniaków z §1.2; nie mylić przy szukaniu „pniaka" w kodzie.

---

### 1.7 Drewno, pnie, konary — stosy/dłużyce FINAL (2026-09-07); reszta wciąż TODO

**Stosy drewna / dłużyce — zamknięte tą sesją.** Źródło: `stosy-i-klody.png`
(22 gotowe sprite'y w arkuszu; użyto 6, per brief autora „modularność, nie
wszystkie warianty naraz"). Izolacja connected-component per sprite.

⚠ **Paleta: SNAPOWANA (2026-09-07, poprawka), nie zostawiona bez zmian.**
Pierwsza wersja tego wpisu twierdziła, że snap nie jest potrzebny, bo średnie
RGB materiału (H≈36°, S≈0,49, V≈0,32) mieściło się w zakresie ramp
`kora`/`drewno`. **Średnia myliła** — po obejrzeniu w lesie autor zgłosił, że
kłody wyraźnie odstają (za ciepłe, żółto-pomarańczowe, zbyt jaskrawe
przekroje). Prawdziwa przyczyna: paleta świata **desaturuje w stronę
światła** (`gen_palette.py`: `s_swiatlo < s_cien` w każdej rampie), a
oryginalny render AI robił odwrotnie — najjaśniejsze rozjaśnienia (przekroje,
połysk wzdłuż pnia) były NAJBARDZIEJ nasycone, dokładnie ten sam błąd, przed
którym ostrzega nagłówek `tools/snap_paleta.py` przy ognisku. Uśrednienie
całego sprite'u to rozmywało — dopiero rozkład per-piksel to pokazał.

Naprawa: ten sam mechanizm co `pniak_z_siekiera.png` w `snap_paleta.py`
(nearest-neighbor do restrykcyjnego zbioru ramp), zastosowany na CAŁYM
`stosy-i-klody.png` (nie na sześciu już wyciętych plikach — recolor na
źródle, potem ponowne cięcie tymi samymi bboxami/skalami, żeby geometria
i rozmiar zostały bit-w-bit takie same). Zbiór: `kora` + `drewno` +
`piasek` (pierwsze 4 z 5 stopni — **bez** najjaśniejszego `#f9ecad`, bo to
dokładnie ten sam złocisty żółty, którego `snap_paleta.py` unika przy ogniu)
+ `neutralne` (3 najciemniejsze, kontur). 17 kolorów w zbiorze, każdy
dostał piksele (raport, nie zgadywanie) — 96 380 kolorów źródła → 17.
Zweryfikowane renderem obok `oak_stump_fresh`/pnia drzewa (rodzina barw
spójna) i w kompozycie wszystkich czterech stref na mapie (drewno przestało
„świecić" na tle koron). Kopia oryginału (przed snapem) zachowana w
scratchpadzie sesji, nie w repo.

Skala: **NIE jeden wspólny współczynnik** (jak przy krzewach/florze wodnej) —
dłużyce to niełupane odcinki pnia (grubsze), stosy to już rozłupane szczapy
(cieńsze), więc jeden mnożnik dla obu albo rozdąłby kłody, albo spłaszczył
stosy. Każdy z sześciu wariantów skalowany osobno do wysokości/długości
mieszczącej się w podanym przez autora paśmie „stos 1–2 m, dłużyca kilka
metrów", zweryfikowany porównaniem z realnym rozmiarem `oak_stump_fresh`
(41×33 px) i graczem (klatka 31×60 px) — nie „na oko".

| plik (`public/assets/props/`) | wymiary finalne | rola | `DECOR_PROPS` / nazwa obiektu | renderLayer |
|---|---|---|---|---|
| `woodpile_small.png` | 45×34 | mały uporządkowany stos | `woodpileSmall` / `stos_maly` | background (57% gracza) |
| `woodpile_large.png` | 72×46 | większy uporządkowany stos | `woodpileLarge` / `stos_duzy` | ysorted (77%) |
| `logs_loose.png` | 29×34 | 2–3 luźno ułożone kłody | `logsLoose` / `kupka_klod` | background (57%) |
| `logs_scattered.png` | 54×40 | większy, starszy rozsypany stos | `logsScattered` / `klody_rozsypane` | ysorted (67%) |
| `log_horizontal.png` | 110×26 | dłużyca leżąca (pojedynczy pień) | `logHorizontal` / `dluzyca_pozioma` | background (leży płasko) |
| `log_vertical.png` | 19×38 | dłużyca postawiona (odcięty odcinek pnia) | `logVertical` / `dluzyca_pionowa` | background (63%) |

**Bez kolizji, świadomie — ta sama konwencja co pniaki/kamienie/krzewy**
(§1.2/§1.5): `DECOR_PROPS` renderuje `add.image` bez ciała fizycznego, a
obiekty punktowe bez `gid` nie dziedziczą kolizji drzew. Autor wprost
zastrzegł priorytet przejrzystej przestrzeni dla gracza i zwierząt (wilk,
dzik, niedźwiedź) — nowa dekoracja nie miała prawa dołożyć wąskiego gardła,
więc nie dostała nawet furtki do niego.

**Rozmieszczenie: 15 obiektów, nowa warstwa `drewno` w obu kopiach
`forrest.tmj`** (ta sama konwencja co `krzewy`/`kamienie`/`flora-wodna` —
osobna warstwa, nie `objects`). Gradient działalności ludzkiej z
`forest_rebuild_scope.md` §2, NIE sztywny podział strefowy:

| strefa | szt. | charakter |
|---|---|---|
| A1 (wyrąb czynny) | 5 | najgęściej, najbardziej uporządkowane — duży+mały stos, dłużyca pozioma i pionowa, luźna kupka |
| A5 (delianki robocze) | 5 | mieszane, malejąco ku wschodowi — zachód dostaje uporządkowany stos przy pasie ścieżki (x41–43), wschód kończy się jednym rozsypanym stosem |
| A7 (odległe delianki) | 2 | „ostatni sąg" — jeden rozsypany stos + jedna dłużyca, blisko granicy z A5, nic dalej na wschód (zgodnie z „gaśnie do zera") |
| A8 (koniec gospodarki) | 3 | rozsypany stos + dłużyca pozioma i pionowa, czytane jako porzucona składnica |

Dobór punktów: skrypt filtrował kandydatów po (a) obecności 1–7 drzew w
promieniu 110 px — dekoracja siedzi przy realnym drzewostanie, nie w pustce
zostawionej przez korektę zagęszczenia z tej samej sesji — (b) ≥26 px od
istniejącej dekoracji, (c) ≥140 px od spawnu stworzenia/ogniska/kupca/portalu,
(d) poza kaflami `path`/`water`/`sand`. Każdy z 15 punktów zweryfikowany
osobno (zero naruszeń) i obejrzany na renderze (kompozyt z realnych sprite'ów
drewna + atlasu dekoracji + przybliżonych koron drzew) — żaden nie nachodzi na
pień, ścieżkę ani na inny punkt dekoracji.

⚠ **Nie tknięto:** terenu, dróg, drzew, spawnów, żadnej z pozostałych sześciu
pozycji z `forest_rebuild_scope.md` §6.3 (K1 pniaki masowo, K3–K10) ani
istniejącej dekoracji.

| asset | plik | status |
|---|---|---|
| drewno porąbane | `public/assets/drewno_porabane.png` (poza `props/`!) | **plik istnieje, przepuszczony przez Snapper, ale ŻADNEGO wpisu w `ASSETS`/`DECOR_PROPS`** — sprawdzone grepem, zero trafień poza komentarzem. Nieużywany, nietknięty tą sesją (inne źródło niż `stosy-i-klody.png`). |
| stosy drewna / dłużyce | `public/assets/props/{woodpile_small,woodpile_large,logs_loose,logs_scattered,log_horizontal,log_vertical}.png` | ✅ **FINAL (2026-09-07)** — patrz wyżej |
| mielerz | — | ❌ TODO — brak pliku |
| zacios na pniu | — | ❌ TODO — brak pliku |
| wykrot / powalone drzewo | — | ❌ TODO — brak pliku |
| kładka z bala | — | ❌ TODO — brak pliku |
| kości / padlina / czaszka | — | ❌ TODO — brak pliku |

Sześć z siedmiu wymienionych w `docs/forest_rebuild_scope.md` §6.3 (K1–K10,
dekoracje warstwy ludzkiej lasu gospodarczego) **wciąż nie wykonane** — tylko
pozycje planu, nie assety. `stosy drewna / dłużyce` (K2) zamknięte tą sesją.

---

### 1.8 Flora wodna — 17 assetów FINAL; ETAP 1 rozmieszczenia wykonany (3 obszary), ETAP 1b otwarty

**Lilia wodna** — ✅ FINAL od dawna, patrz §1.6. **Nie generować ponownie bez
konkretnego powodu.**

**Roślinność brzegowa/bagienna — 17 nowych assetów (2026-08-30), zamyka
podstawową florę dekoracyjną.** Źródło: `docs/art-review/rosliny-wodne.png`
— **materiał już po Pixel Snapperze** (przekazany gotowy, Snapper NIE był
uruchamiany ponownie), 17 rozłącznych komponentów wyizolowanych techniką
connected-component (bez przenikania sąsiadów; unia kolorów wszystkich 17
plików PRZED recolorem = dokładnie 63 kolory źródła — potwierdzone, że nic
nie zgubiono ani nie dodano przy cięciu).

Pliki: `public/assets/props/<nazwa>.png`. Cztery rodziny, każda skalowana
**osobnym, wspólnym współczynnikiem w obrębie rodziny** (zachowuje
zaprojektowaną progresję duży/średni/mały bez spłaszczania jej do jednego
rozmiaru — ta sama zasada co przy krzewach i buku):

| rodzina | pliki | finalny rozmiar (canvas) | współczynnik | rola środowiskowa |
|---|---|---|---|---|
| **pałka wodna** (1 „gatunek", 3 rozmiary) | `cattail_large/medium/small.png` | 34×54 / 30×46 / 27×36 | 0,510 | wysoka roślinność dominująca bezpośrednio przy wodzie |
| **trzcina/sitowie piórkowe** (1 „gatunek", 2 rozmiary) | `reed_plume_large/small.png` | 37×52 / 30×35 | 0,549 | druga wysoka rodzina, mieszana z pałką na linii brzegu |
| **kępy bagienne** (6 neutralnych wariantów) | `marsh_tuft_01`…`06.png` | 35×31 → 21×21 | 0,667 | wypełnienie średniej strefy mokradła/wilgotnej trawy, czysto dekoracyjne |
| **roślinność brzegowa** (6 wariantów, bez nazw gatunkowych) | `shore_plant_01`…`06.png` | 31×28 → 40×20 (rozmiar nieliniowy — różne pokroje, nie jedna progresja) | 0,565 | najniższa roślinność, bezpośrednio na granicy wody i lądu |

⚠ **Kępy bagienne i roślinność brzegowa NIE mają przypisanych gatunków
botanicznych świadomie** — źródło miało funkcję środowiskową, nie naukową
(user 2026-08-30). Nie przypisywać im nazw gatunkowych później bez nowego
materiału źródłowego, który by to uzasadniał.

**Recolor (2026-08-30, po akceptacji funkcjonalnej, PRZED integracją)** —
kontrolowany, bez zmiany geometrii/proporcji/alfy, wykonany PO cięciu, nie
przez ponowne uruchomienie Snappera:
- Powód: zmierzone HSV pokazało realny „odjazd" — średnie nasycenie zieleni
  0,91 wobec 0,71 w prawdziwych koronach drzew z `forrest.png` (efekt
  „innego tilesetu").
- Metoda: dla każdego z 63 oryginalnych kolorów — dokładnie JEDEN najbliższy
  kolor z trzech małych ramp (6 zieleni / 5 tonów kory / 5 tonów złota),
  zbudowanych z **rzeczywistych próbek**: korony dębu/buka/brzozy/świerka z
  `forrest.png` + już zaakceptowane krzewy leśne (zieleń), kora pni z
  `forrest.png` (brąz pałek/kwiatostanów), kwiaty dziurawca/wrotyczu/
  rumianku już w grze (złoty akcent). Ten sam remap zastosowany identycznie
  we wszystkich 17 plikach — ten sam kolor źródłowy zawsze daje ten sam
  kolor docelowy.
- ⚠ **Pierwsza próba (percentile-rank per piksel) dała 318 kolorów zamiast
  kilkunastu — złapane i poprawione przed zapisem**, nie zostało w wyniku.
- **Wynik: 63 → 14 kolorów łącznie w całym pakiecie 17 plików.** Żaden
  kolor spoza trzech ramp nie został użyty.

**Ograniczenia i status**:
- **Brak mechaniki zbierania — świadomie, to NIE jest `HERBS`.** Czysta
  dekoracja środowiskowa, tak jak krzewy.
- **Nie zintegrowane z żadnym systemem stampów.**
- Zarejestrowane w `ASSETS`/`DECOR_PROPS`/`Assets.ts` (klucze
  `cattail*`/`reedPlume*`/`marshTuft*`/`shorePlant*`, nazwy obiektów Tiled
  `palka_*`/`trzcina_*`/`kepa_bagienna_*`/`roslina_brzegowa_*`).
- **ETAP 1 + 1b rozmieszczenia wykonane (2026-08-30, sesja przebudowy lasu)** —
  17 testowych obiektów skasowano, na NOWEJ warstwie obiektowej `flora-wodna`
  (osobnej od `objects`, żeby cała flora wodna dała się w Tiled znaleźć/
  przełączyć jednym oczkiem) jest teraz **244 obiekty**:
  - **ETAP 1 (152)** — trzy obszary flagowe: zachodnie rozlewisko (x 2–30,
    oba brzegi), A6 rozlewiska + staw (x 46–76 / y 26–52), A10 Źródło
    (x 139–158). Zaakceptowane przez autora jako baza modelu.
  - **ETAP 1b (+92)** — ten sam model na pozostałych brzegach rzeki:
    odcinek środkowy przy brodzie (x 31–45, tylko 6 — bród flankowany
    kilkoma trzcinami) i odcinek wschodni (x 77–138). Regiony 1b to zwykły
    brzeg rzeki, nie mokradło — bazowe prawdopodobieństwa, bez boostu
    „marsh". ETAP 1 nietknięty (osobny seed, obiekty zachowane 1:1).
  Rodziny łącznie: pałka 55 · trzcina 38 · roślina_brzegowa 50 ·
  kępa_bagienna 101. Skrypty jednorazowe (`rozstaw_flora_wodna.py`,
  `rozstaw_flora_wodna_1b.py`) **NIE zostają w `tools/`** — model i parametry
  w `docs/dziennik.md` (wpisy 2026-08-30 (5) i (6)).
- **Model strefowy zaimplementowany** (BFS `d_water` z żywego `.tmj`):
  `roslina_brzegowa` na lądzie przy samej granicy (d_water==1),
  `palka`/`trzcina` w nieregularnych **skupiskach** na linii brzegu i
  płytkiej wodzie (tylko krawędź, `d_land==1` — nigdy głęboka woda),
  `kepa_bagienna` w paśmie średnim (d_water 1–3) + zagęszczona w regionach
  mokradłowych. Bród i pas traktu wykluczone (bufor 2 kafle od `path`),
  stanowiska ziół nietknięte (bufor 40 px), 44 px od każdego rekwizytu/NPC.
  Zweryfikowane renderem kompozytowym przed/po (kafle+drzewa+rekwizyty) —
  brak rzędów, środek wody czysty, naturalne prześwity, brak obiektów na
  głębokiej wodzie / brodzie / pod budynkiem (0/244).

**Docelowa logika strefy** (wdrożona na wszystkich brzegach rzeki; A9 brzeg
północny i przyszłe zbiorniki dojdą przy odpowiednich etapach):

```
woda → roślinność przybrzeżna → trzciny/sitowie → wilgotna trawa → zwykła flora → las
```

---

### 1.9 Podłoże

`Teren.png` (640×395, siatka 32×32) — oznaczone w `public/assets/README.md`
jako „✅ nowy, kompletny". **Odświeżone, zachowane, nie generować ponownej
wersji.** Warstwy kafli terenu na mapie lasu (sprawdzone w żywym `.tmj`,
§4): `ground`, `water`, `sand`, `path`, `undergrowth`, `bushes`.

---

### 1.10 Pozostałe naturalne/quasi-naturalne dekoracje (dla kompletności, nie flora leśna)

| asset | plik | `ASSETS` klucz | status |
|---|---|---|---|
| koło młyńskie | `kolo_mlynskie.png` | `waterwheel` | FINAL, element młyna, nie lasu |
| stóg siana | `stog_siana.png` | `haystack` | FINAL |
| strach na wróble | `strach_paleta.png` | `scarecrow` | FINAL |
| suszona skóra | `suszona_skora.png` | `driedHide` | FINAL |
| studnia (mała) | `studnia_mala.png` | — | FINAL, do późniejszego użycia |
| studnia (gpt) | `studnia-gpt_paleta.png` | — | kandydat na zamiennik `studnia_zlozona.png`, nierozstrzygnięte |
| ognisko | `ognisko_paleta.png` | — | FINAL |
| ule (kłody bartne) | `ul00/01/02_paleta.png` | `beehiveA/B/C` | FINAL, pasieka Doroty |
| manekin treningowy | `training-dummy.png` | `trainingDummy` | FINAL, prop walki, nie flora |

---

## 2. DESIGN DECISIONS — zasady obowiązujące, nie zmieniać bez nowej decyzji

### 2.1 Skalowanie
- **Brak jednej sztywnej skali dla całej kategorii.** Rozmiar wynika z
  rzeczywistych proporcji assetu, jego roli, relacji do gracza i do innych
  elementów świata.
- **Nigdy niezależne rozciąganie X/Y** tylko po to, żeby dopasować do
  komórki — kanwa dostaje padding (wyśrodkowanie/dosunięcie do dołu), nie
  deformację.
- Gdy w źródle jest progresja rozmiaru wariantów tego samego materiału
  (np. krzew mały/średni/duży, buk duży/duży2), skaluje się ją JEDNYM
  wspólnym współczynnikiem — zachowuje to proporcje i celowo zaprojektowaną
  różnicę, zamiast normalizować do jednego rozmiaru.
- Gatunki/rodziny różnią się skalą między sobą, jeśli różnią się naturalnym
  pokrojem (świerk smuklejszy niż dąb, wierzba świadomie największa).

### 2.2 Pixel Snapper i przygotowanie grafiki
- Limit **64 kolory** na asset (a raczej na cały arkusz źródłowy — mierzone
  per plik przy integracji).
- Materiał przed Snapperem ma być możliwie czysty; **budżet kolorów nie
  idzie na glow/halo/tło/zbędne elementy.**
- Twarde, pixel-artowe krawędzie. Bez antyaliasingu, bez wygładzania.
- **Po Snapperze nie uruchamiać go ponownie bez wyraźnej decyzji** — jeśli
  źródło jest już oznaczone jako „po Snapperze", traktować jako gotowe.
- Wycinanie sprite'ów z arkusza zbiorczego: **izolacja komponentów
  (connected-component na masce alfa), nigdy prostokątny crop** — odstępy w
  źródle nie gwarantują, że prostokąt nie złapie fragmentu sąsiada. Cały
  asset zachowany, żadnego ucięcia, minimalny padding (zwykle 2px).
- Miękkie/ciemne obszary (cień kontaktowy) należą do assetu, jeśli są
  rzeczywistym cieniem — nie wolno ich ani wyciąć jako "tło", ani zostawić
  jako twardy prostokąt.

### 2.3 Konkretne zamrożone liczby (nie zmieniać bez decyzji)
- Szerokości świeżych pniaków — tabela w §1.2.
- Skala krzewów — współczynnik 0,737 (§1.3).
- Zioła — wysokości i siedliska w §1.4.
- Wierzba ma własną klasę komórki (`TreeStampsBig`, 160px) — jedyny taki
  przypadek.

---

## 3. TODO / MISSING / STATUS SUMMARY

**FINAL (zamknięte, zintegrowane z grą i sprawdzone):**
**7× rodzina drzew w atlasie stempli — WSZYSTKIE 7 gatunków** (dąb/świerk/
brzoza/grab/olcha/wierzba + **buk** od ETAP4, nowy zestaw buki-v1), **21
pniaków — FINAL, renderowane `DECOR_PROPS`, 21 obiektów testowych na mapie
(ETAP4)**, 11 krzewów (assety + rozmieszczenie ETAP 2), 11 ziół (assety +
siedliska + rozmieszczenie), **23 kamienie — jedyny system, rozmieszczenie
ETAP 3 (142 obiekty); stary system WYCOFANY**, grzyby/brzeg stawu/lilia/pniak
generyczny, `Teren.png`, ognisko/stóg/strach/skóra/ule/studnie/manekin,
**17 assetów flory wodnej/bagiennej (grafika + kolorystyka finalne, patrz
§1.8)**.

**TEST / DO OCENY (istnieje, wymaga decyzji przed dalszą pracą):**
- **Krzewy (§1.3) — ETAP 2 wykonany (286 obiektów, warstwa `krzewy`,
  cała mapa wg modelu strefowego).** Otwarte: **soft-collision/spowolnienie
  ruchu** (świadomie odłożone do osobnej decyzji po ocenie wizualnej).
- Proximity-glow ziół — zaimplementowany, nie potwierdzony na żywym
  renderze (środowiskowe ograniczenie WebGL).
- `studnia-gpt_paleta.png` jako kandydat na zamiennik istniejącej studni.
- **Flora wodna (§1.8) — ETAP 1 + 1b wykonane (244 obiekty, warstwa
  `flora-wodna`).** Wszystkie brzegi rzeki lasu obsadzone wg modelu
  strefowego. Otwarte: A9 brzeg północny + ew. przyszłe zbiorniki.

**TODO (naprawdę brakujące, potwierdzone brakiem pliku):**
- Elementy gospodarki leśnej: stosy drewna/dłużyce, mielerz, zacios na
  pniu, wykrot/powalone drzewo, kładka z bala, kości/padlina/czaszka.
- `drewno_porabane.png` — plik istnieje, ale nie ma wpisu w `ASSETS`/
  `DECOR_PROPS` — najtańsze z TODO, bo grafika już gotowa.
- `StumpStamps` — **NIE potrzebny, nie powstał** (ETAP4). Pniaki = `DECOR_PROPS`.

> # ✅✅ 2026-08-31 (decyzja autora, po audycie kolizji + PathSolverze)
>
> ```
> LAS — ART / WORLD DESIGN = CLOSED
> LAS — GAMEPLAY / AI = READY FOR RUNTIME TESTING
> ```
>
> Cała flora dekoracyjna lasu opisana w tym pliku jest **FINAL** — assety,
> skala i rozmieszczenie. Globalny collision pass drzew wykonany (trunk boxy
> zweryfikowane wizualnie na wszystkich 39 wariantach), `PathSolver`+
> `PathFollower` dołożone nad `NavGrid`. Nie generować/wymieniać żadnego
> assetu środowiska bez konkretnego błędu z działającej gry. Pełny zapis:
> `docs/dziennik.md` 2026-08-31 (4)–(6), baner zamknięcia:
> `docs/forest_rebuild_scope.md`.
>
> **Świadomie POZA tym zamknięciem** (gameplay polish, nie luka): soft-
> collision krzewów (`speedMultiplierAt`, zaprojektowane miejsce w
> `MovementContext`, niewdrożone), masowe rozmieszczenie pniaków (`scope`
> K1 — 21 sztuk zostaje zestawem reprezentacyjnym, nie masowym), A9 brzeg
> północny / A10 źródło dla flory wodnej (teren tych stref dalej
> niepomalowany, poza zakresem tej przebudowy).

⚠ **Podstawowa flora dekoracyjna lasu jest ZAMKNIĘTA jako etap generowania
grafiki ORAZ integracji technicznej** (drzewa — wszystkie 7 gatunków w
stemplach; pniaki — `DECOR_PROPS`; krzewy, zioła, kamienie, flora wodna).
Otwarte zostają: zachowanie ruchowe krzewów (soft-collision), masowe
rozmieszczenie pniaków (`scope` K1), A9 brzeg północny dla flory wodnej.

**LEGACY (świadomie zachowane stare assety):**
- **Stary buk** `buk_duzy_new`/`buk_sredni_new`/`buk_maly_new` (id 2/16/25 w
  `TREE_STAMPS`, grafika w `forrest.png`) — **niereferowany przez żaden
  obiekt na mapie od ETAP4**. Zostaje w `tree_stamps.png`/manifescie tylko po
  to, żeby nie przenumerować 1633 drzew. **Nie usuwać.** Kanoniczny buk to
  teraz `buk_duzy/duzy2/sredni/sredni2/maly` (§1.1).
- Generyczny `pniak` (`ASSETS.stump`, `pniak_z_siekiera_paleta.png`) — 1 szt.
  na mapie, osobny od 21 gatunkowych, nietknięty.

---

## 4. Architektura — jak assety środowiska trafiają na ekran

Sprawdzone czytaniem kodu 2026-08-30 (nie z pamięci):

```
GameConfig.ts: ASSETS            — klucz + ścieżka pliku, ALBO (od 2026-08-31,
                                    patrz niżej) klucz atlasu + nazwa klatki
GameConfig.ts: DECOR_PROPS       — nazwa(-y) obiektu Tiled → ASSETS.<klucz>
                                    TYLKO dla statycznych obrazków bez zachowania
src/core/Assets.ts               — load.image(...) LUB load.atlas(...) w
                                    queueImages(); brak wpisu tu = tekstura
                                    nigdy się nie wczyta, mimo że
                                    ASSETS/DECOR_PROPS wyglądają poprawnie
src/world/TiledMap.ts            — DECOR_BY_OBJECT_NAME (WYPROWADZONE z DECOR_PROPS)
                                    + osobna tabela HERB_OBJECT_NAMES (zioła).
                                    ⚠ ROCK_OBJECT_NAMES/RockSpawn USUNIĘTE
                                    (ETAP 3) — kamienie to teraz zwykłe DECOR_PROPS
src/scenes/GameScene.ts          — jedna pętla renderująca DECOR_PROPS
                                    (origin 0.5,1, DEPTH.entities+y, bez ciała
                                    fizycznego = bez kolizji), w tym KAMIENIE.
                                    Osobna pętla tylko dla ziół (własny system)
src/world/TreeStampManifest.ts   — GENEROWANY (`build_tree_stamps.py`), osobny
                                    od DECOR_PROPS. Wszystkie 1595 drzew idzie
                                    TĘDY. Od ETAP4 nowy buk TU JEST (id 35–37 +
                                    BIG 2–3); stary buk (2/16/25) = LEGACY,
                                    niereferowany. Standalone-drzewa (wierzby,
                                    buk) wpięte przez `forrest_atlas.json`
                                    klucze `willows`/`beeches`.
docs/forrest_atlas.json          — ⚠ pół-generowany: `build_forrest_atlas.py`
                                    pisze `sprites`/`kolizja_tiles`, ale
                                    `willows`+`beeches` to RĘCZNY dopisek.
                                    Nie re-generować bez ich odtworzenia.
```

**Nie zakładać, że nowy asset jest już w `TreeStamps`** — sprawdzić
`TreeStampManifest.ts` wprost. Trzy różne „systemy dekoracji" istnieją
naraz i to jest świadome, nie bałagan: `DECOR_PROPS` (bez zachowania —
tu też należą kamienie od ETAP 3), zioła (zachowanie: wzrost/zbiór) i drzewa
(własna tabela i pętla renderowania, bo mają inną głębię pień/korona).

**Warstwy kafli na mapie lasu** (żywy `.tmj`, sprawdzone): `ground`,
`water`, `sand`, `path`, `undergrowth`, `bushes` (⚠ nazwa koliduje słownie z
nowymi krzewami-sprite'ami z §1.3, ale to inny system — kafle runa, nie
obiekty), `buildings`, `buildings-detale`, `znaki`, `buildings-over` +
warstwy obiektowe `trees` (**1595** — po korekcie zagęszczenia
2026-09-07 było 1641, patrz `dziennik.md` 2026-09-07 (3); w tym **140 buków przepiętych na nowy
zestaw** w ETAP4; TreeStampsBig 2→4 kafle), `objects` (**61** — po wyjęciu
33 krzewów [E2], 34 kamieni [E3], 5 `buk_test_*` + 13 zdublowanych pniaków
[E4]; zostaje 21 pniaków gatunkowych + generyczny `pniak`), `rosliny` (72, zioła),
`kamienie` (**142** — nowy system kamieni, ETAP 3; warstwa o tej samej
nazwie co stara, ale całkowicie nowa zawartość `kamien_*`),
`flora-wodna` (244, roślinność wodna/bagienna — ETAP 1 + 1b, §1.8),
`krzewy` (**286**, krzewy dekoracyjne — ETAP 2, §1.3; nazwy `krzew_*`).
Wszystkie warstwy obiektów renderowane wspólną pętlą `DECOR_PROPS` w
`GameScene` (origin 0.5,1, `DEPTH.entities + y`, bez ciała fizycznego).

### 4.1 Atlasowanie decoru (2026-08-31) — mechaniczne spakowanie, zero zmiany treści

```
ATLASOWANIE (forest_decor_atlas + water_flora_atlas) = IMPLEMENTED
RUNTIME VALIDATION (na telefonie, S21 FE)             = PENDING
HERBS ATLAS                                            = NOT IMPLEMENTED
```

Runtime test na S21 FE i decyzja o dalszej optymalizacji: `docs/plan_dalszych_prac.md` ETAP A/F.

Dwa nowe pliki, **zastępujące osobne `load.image()` dla 75 z tych plików**
(kamienie, krzewy, pniaki, flora wodna + `brzeg_stawu`/`lilia_wodna`) —
`tools/build_forest_atlases.py` (przymiar domyślnie, `--zapisz` do zapisu,
ten sam wzorzec co `build_tree_stamps.py`):

| atlas | rozmiar | klatek | zawartość |
|---|---|---|---|
| `public/assets/props/forest_decor_atlas.png` (+ `.json`) | 512×512 (30,9% wypełnienia) | 56 | 23 kamienie (§1.5) + 11 krzewów (§1.3) + 21 pniaków gatunkowych + `pniak_z_siekiera_paleta` (§1.2/§1.6) |
| `public/assets/props/water_flora_atlas.png` (+ `.json`) | 256×256 (27,2% wypełnienia) | 19 | 17 flora wodna (§1.8) + `brzeg_stawu_paleta` + `lilia_wodna_paleta` (§1.6) |

⚠ **Mechaniczne pakowanie, nic więcej.** Zero recoloru, zero antyaliasingu,
zero zmiany rozmiaru/proporcji/palety, zero ponownego Pixel Snappera —
generator kopiuje surowe bloki pikseli (`Image.paste`, nie `alpha_composite`,
bo to drugie przelicza RGB pod przezroczystymi pikselami i dawało bajt-w-bajt
różne, choć wizualnie identyczne wyniki — złapane na `birch_stump_*`/
`spruce_stump_*` podczas budowy). Każda klatka zweryfikowana **bajt-w-bajt**
przeciw źródłowemu PNG, dwa razy: raz przed zapisem (przymiar), raz po
odczytaniu zapisanego pliku z dysku — `tools/atlas_weryfikacja.mjs` pilnuje
tego samego (plus brak duplikatów nazw klatek, brak osieroconych klatek,
zero starych kluczy tekstur nadal w użyciu) jako stały regression gate.

`DECOR_PROPS` (nazwy Tiled, `renderLayer`) i `.tmj` **nietknięte** — Tiled nie
wie i nie musi wiedzieć, czy `bush_dome_large` renderuje się z osobnego pliku
czy z atlasu. `GameScene`'s decor loop dostał jedną dodatkową zmienną
(`.add.image(x, y, key, frame)` zamiast `.add.image(x, y, key)`) — `frame`
jest `undefined` dla wszystkiego, co zostało poza atlasem (`mushrooms` i
reszta §1.6/§1.10), co Phaser traktuje identycznie jak jego pominięcie.

**Nie zaatlasowane świadomie:** `mushrooms` (grzyby — 0–3 instancje na żywej
mapie), pojedyncze rzadkie dekoracje spoza `forest_decor`/`water_flora`
(`suszona_skora`, `stog_siana`, `strach_paleta`, ule), `TreeStamps`/
`TreeStampsBig` (już własny, zamknięty system — `tools/build_tree_stamps.py`
NIETKNIĘTY), oraz tekstury `Well`/`Campfire`/`WaterWheel`/`TrainingDummy`
(własne encje, nie `DECOR_PROPS`). `herbs_atlas` rozważony i **odłożony** —
populacja żywych sprite'ów ziół jest ograniczona `Gathering.maxActive`, nie
setkami instancji jak kamienie/krzewy, więc zysk z atlasowania jest tam
wyraźnie mniejszy.

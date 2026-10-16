# Assets — stan i jak w to wejść

> ⚠ **Kalibracja (2026-10-11): gra idzie w 3D.** Obraz świata, postacie,
> zwierzęta, drzewa, rekwizyty i domy to modele (`docs/systemy/render3d.md`).
> Ten plik rósł chronologicznie od epoki pixel-artu, więc czytaj go tak:
> **żywe** są sekcje o modelach 3D i ich generatorach, o kaflach gruntu
> (`Teren`/`Nature`/`forrest` — w widoku 3D wypiekane w grunt), o ikonach
> przedmiotów i palecie drewna/metalu oraz o glifach UI. Sekcje o arkuszach
> postaci i zwierząt (`rabbit.png`, `wolf.png`…), o `Buildings.png`
> i `Kuznia.png` opisują **ścieżkę awaryjną 2D** — nadal ładowaną, ale nie
> kierunek. Nowego materiału świata nie rysuj jako pixel-art.

> **Ten plik jest wprowadzeniem dla kolejnej sesji.** Mówi, co jest, co się
> właśnie dzieje i czego NIE ruszać bez zrozumienia. Zasady graficzne są
> w `docs/ART_DIRECTION.md` — to jest źródło prawdy dla wyglądu.

---

## ✅ Gra znowu się uruchamia — co zostało wpięte

Arkusze były przebudowane, a kod i mapa zostały przy starych. Domknięte:

| co | jak |
|---|---|
| `Teren.png` | `ASSETS.teren` + `queueImages` + `TILESET_TEXTURES` (nazwa tilesetu `Teren`) |
| `MAPS.requiredTilesetName` | `"Teren"`, nie `"Nature"` — mapa bez propów to puste pole, mapa bez ziemi to nic |
| `forrest.tmj` | **wygenerowana od nowa** przez `tools/build_mapa.py` (patrz niżej) |
| ognisko | rysowane proceduralnie; **było wycinane z `Nature.png`** i po przebudowie arkusza ten sam wycinek stał się kawałkiem korony |
| `MapBuilder` (awaryjna mapa z kodu) | wskazuje na oba arkusze, most rysuje kolorowym prostokątem |

**Pułapka warta zapamiętania: wycinek z regenerowanego arkusza nie ma
właściciela.** `extractTile(nature, 132, 198)` działał dalej po przebudowie —
tyle że pod tym adresem nie było już ogniska. Nic nie zgłosiło błędu.
Jeśli kiedyś trzeba wyciąć kafel z `Teren.png`/`Nature.png` z poziomu kodu,
najpierw daj mu **nazwany wpis w generatorze**, a nie współrzędne.

Zostaje jedno ostrzeżenie w konsoli: `Image tile area not tile size multiple`.
Oba arkusze mają 640 px szerokości, a 19 kolumn po 33 px zajmuje 626 — Phaser
zauważa 14 px luzu. Geometria wychodzi mimo to dokładnie tak, jak trzeba
(sprawdzone w silniku: Teren 19×12 = 228 kafli, Nature 19×7 = 133, wycinki na
skoku 33 px). To ostrzeżenie, nie błąd.

---

## Mapa lasu — `tools/build_mapa.py`

`public/assets/maps/forrest.tmj` (**80×60 kafli, 2560×1920 px**) jest dziś
generowana skryptem, nie malowana ręcznie. Druga kopia leży w
`public/assets/forrest.tmj` — ta sama treść, inna ścieżka do PNG, żeby otwierała
się w Tiled z miejsca, w którym leży. Gra czyta tę z `maps/`.

**Po pierwszej ręcznej poprawce w Tiled źródłem prawdy jest `.tmj`, nie
skrypt.** Dlatego `build_mapa.py` domyślnie nic nie zapisuje (`--zapisz`) — ta
sama zasada, co przy arkuszach: mapa jest **artefaktem**, nie wynikiem funkcji.

Warstwy (jedna na jeden rodzaj rzeczy — inaczej poprawienie drzewa w gąszczu
wymaga wycinania go spod kępek trawy):

| warstwa | zawartość | arkusz |
|---|---|---|
| `ground` | trawa, warianty mieszane | Teren |
| `water` | rzeka i rozlewisko (blob 47) | Teren |
| `sand` | ławica brodu (blob 47) | Teren |
| `path` | drogi (blob 47) | Teren |
| `undergrowth` | kępki trawy | Nature |
| `bushes` | krzaki | Nature |
| `buildings` | ściany budynków | Buildings |
| `buildings-detale` | drzwi, okna (nakładki na ścianę) | Buildings |
| `trees` | ⚠ **od 2026-08-29 (forrest.tmj): warstwa OBIEKTÓW** — 1 tile-object na drzewo z tilesetu `TreeStamps`, renderowana przez `src/world/TreeLayer.ts`. `trees-base`/`trees-over` skasowane. Wieś i Gęstwina nie mają drzew. | TreeStamps |
| `buildings-over` | dachy — rysowane **nad** postaciami | Buildings |
| `objects` | spawny (gracz, przeciwnicy, kupiec, kowal, ognisko) | — |

Na mapie stoi dziś jeden budynek: **chata myśliwego** na polanie w NE
(kafel 64,2; 5 kafli szerokości, 3 wiersze ściany, 3 wiersze dachu), a Myśliwy
stoi przed jej drzwiami. Dom składa się z kafli — opis siedzi w
`BUDYNKI_NA_MAPIE` w `tools/build_mapa.py` i jest jedną linijką. Wiersze dachu
idą na `buildings-over` (nad postaciami), wiersze ściany na `buildings`, drzwi
i okna na `buildings-detale`. Reguła „tylko dolny rząd pod spodem", poprawna
dla drzewa, byłaby tu zła: ściana ma trzy kafle wysokości i gracz stojący przy
niej znikałby za własnym domem.

⚠ **`forrest.tmj` NIE używa już `trees-base`/`trees-over`** (migracja
2026-08-29, `docs/tree_instances.md`). Drzewo jest tile-objectem na warstwie
`trees`; `TreeLayer` renderuje je jako pień (pasmo encji) + korona
(`DEPTH.overhead`), każde sortowane po własnej kotwicy. Reguła „dolny rząd pod
spodem" była obejściem tego, że warstwa kafli nie sortuje per kafel — obiekty
sortują. **Opis niżej dotyczy STANU SPRZED migracji / generatora `build_mapa.py`.**

Podział drzewa na `trees-base` + `trees-over` był jedynym sposobem, w jaki gracz
mógł wejść ZA drzewo w modelu kafli: warstwa o nazwie kończącej się na `-over`
dostaje `DEPTH.overhead`, reszta idzie pod postaciami. Kafel z pniem musiał
zostać pod spodem, inaczej korona zakrywałaby gracza stojącego **przed** drzewem.

**Kolizji nie ma — żadnych, celowo.** Zero ciał statycznych, cały świat jest
przechodni (sprawdzone w silniku). Kolizje dorabia się w Tiled, edytorem
kolizji kafla albo właściwością `solid`; silnik czyta obie ścieżki od dawna.

Trzy błędy układu złapane dopiero na złożonym podglądzie całej mapy, nie na
liczbach — warto je znać przed następną generacją:

- **bród wycinał rzekę na całej wysokości doliny**, bo zakres `y` był wpisany
  ręcznie zamiast policzony z przecięcia drogi z wodą. Rzeka wyglądała, jakby
  się urywała;
- **pozioma odnoga drogi przecinała jezioro** i wycinała w nim kanał. Drogi
  poziomej nie da się poprowadzić „gdzieś tam": albo jest po tej samej stronie
  wody co cel, albo jej nie ma;
- **las czytał się jak sad** — równomierny rozstaw, żadnego gąszczu, żadnej
  polany. Winna była amplituda szumu gęstości (±0,3) i szansa liczona od zera,
  a nie od progu: kafel ledwie nad progiem dostawał niemal tę samą szansę co
  środek puszczy. Las poznaje się po RÓŻNICY gęstości, nie po liczbie drzew.

---

## Układ katalogów (od 2026-08-14)

Assety wczytywane przez grę leżą w katalogach tematycznych. **Ścieżki w
`GameConfig.ts` są jedynym źródłem prawdy** — jeśli któraś nie trafia,
gra NIE wywala błędu, tylko po cichu podstawia placeholder (tak jest
zaprojektowana). Dlatego po każdej przeprowadzce sprawdzaj, że
`window.dev.missing` jest puste, a `load.totalFailed` wynosi zero.

| katalog | co tam jest | ile |
|---|---|---|
| `characters/` | `Character.png`, `NPC.png`, wszystkie portrety NPC, `kowal_idle.png` | 14 |
| `animals/` | arkusze stworzeń — królik, dzik, wilki, niedźwiedź, jeleń, lis, cała zagroda, koty, ptaki, cienie | 31 |
| `props/` | rekwizyty stawiane na mapie — studnie, ognisko, koło młyńskie, stóg, strach, skóra, pniak, grzyby, brzeg stawu, lilia, manekin treningowy + pakiety środowiskowe: `bush_*` (11 krzewów), `cattail/reed/marsh_tuft/shore_plant_*` (17 flora wodna), `stone_*` (23 kamienie — ⚠ stary `kamienie.png` WYCOFANY w ETAP 3, 2026-08-31), `*_stump_*` (21 pniaków), `herb_*` (11 ziół), `beech_tree_*` (5 buk-test) | — |
| `props/props3d.glb` | modele 3D krzewów, kamieni i ziół dla widoku 3D (`tools/props3d.py`; nazwa = obiekt z Tiled bez numeru albo `ziolo_<gatunek>`); od 2026-10-09 także sprzęt kuźni (z kafli `Kuznia`, `REKWIZYTY_3D.kafleKuznia`) i uprawy (z kafli `Pole` w warstwie `uprawy`, `REKWIZYTY_3D.kafleUprawy` — jeden model na kafel, płaski obrazek zostaje pod spodem jako podłoże) | 1 |
| `props/houses3d.glb` | domy 3D (`tools/houses3d.py`): JEDEN model na OBIEKT `budynek` z warstwy `budynki` (od 2026-10-09; wcześniej z plam kafli), nazwa `dom-<prefiks3d>-<id>`; front modelu do kamery, obrót robi silnik; generator odmawia zapisu przy nieznanym typie, detalu poza frontem, obrocie spoza 0/90/180/270 | 1 |
| `trees/` | modele drzew 3D dla widoku 3D: `trees.glb` (`tools/tree3d.py`, jeden obiekt na wariant `gatunek_rozmiar`, 13 gatunków × duzy/sredni/maly; drzewa z kafli `Nature` mapuje `DRZEWA_3D.kafleNature`) | 1 |
| `items/` | `items.png` + ikony jedzenia (`ikona_*.png`) | 4 |
| `ui/` | grafika samego interfejsu: `slot_glyphs.png` (glify slotów, rysowane), `slots.png` (ich źródło) + ikony umiejętności | 9 |
| `maps/` | `.tmj` + minimapy | — |
| `audio/` | dźwięki | — |
| **korzeń** | **arkusze kafli** + materiały źródłowe i półprodukty | 85 |

⚠ **Arkusze kafli ZOSTAJĄ w korzeniu i to nie jest niedokończona
przeprowadzka.** `Teren.png`, `Nature.png`, `Buildings.png`, `Kuznia.png`,
`pole_tileset.png`, `znaki.png` (oraz `Indoor.png` na przyszłość) są
wskazywane **ścieżką względną wewnątrz plików `.tmj`** (`../Teren.png`).
Gra ich nie używa — wiąże tileset po NAZWIE, nie po ścieżce — ale **Tiled
używa**, a `.tmj` jest źródłem prawdy przy ręcznej edycji map. Przeniesienie
ich zepsułoby otwieranie map w edytorze, a zyskiem byłby sam porządek.

⚠ **W korzeniu zostały też 78 plików, których gra NIE wczytuje** — źródła
do generatorów (`anna.png`, `bread.png`, `egg.png`, `Cheese.png`,
`strach.png`…), półprodukty (`*_paleta.png` tam, gdzie finalny plik ma inną
nazwę), kopie zapasowe (`*_v1_backup.png`) i scratch (`test1-10.png`,
`kowal_palette_swatch.png`, `idle_guide_5x2.png`). To jest kandydat na
kolejny etap porządków; wymaga przejrzenia, bo generatory z nich czytają.

### ⏳ Zostało do przemianowania na angielski

Decyzja autora (2026-08-14): nazwy plików i katalogów po angielsku, bo
docelowo angielski ma być głównym językiem projektu. Katalogi już są
(`characters`/`animals`/`props`/`items`), ikony jedzenia też
(`icon_bread.png` itd.). **Zostaje 15 plików, które gra wczytuje:**

- **11 „drobnych" rekwizytów w `props/`** — `ognisko_paleta`, `studnia_mala`,
  `studnia-gpt_paleta`, `kolo_mlynskie`, `stog_siana`,
  `strach_paleta`, `pniak_z_siekiera_paleta`, `grzyby_paleta`,
  `brzeg_stawu_paleta`, `lilia_wodna_paleta`, `suszona_skora`.
  ⚠ `kamienie.png` USUNIĘTY (ETAP 3, 2026-08-31 — stary system kamieni
  wycofany na rzecz pakietu `stone_*`).
  ⚠ Nazwa wynikowa jest u nich **powiązana z nazwą źródła** przez
  `snap_paleta.py` (domyślnie `<źródło>_paleta.png`), więc przemianowanie
  samego wyniku rozjedzie się z tabelą `CELE`/`WYJSCIE`. Robić razem ze
  źródłami albo wcale.
- **3 arkusze kafli w korzeniu** — `Kuznia.png`, `znaki.png`,
  `pole_tileset.png`. ⚠ Te są **podwójnie zaczepione**: ścieżką w `.tmj`
  (Tiled) i osobno NAZWĄ tilesetu w `TILESET_TEXTURES` (gra). Zmiana pliku
  wymaga ruszenia obu map i tabeli naraz — najdroższe z całej listy przy
  najmniejszym zysku.

⚠ **Przenosząc cokolwiek dalej, pamiętaj o `tools/`.** 21 generatorów pisze
do tych plików i po przeprowadzce pisałyby do starej lokalizacji, podczas
gdy gra czyta z nowej — **cicha rozbieżność**, nie błąd. Przy tej
przeprowadzce trzeba było załatać wszystkie 21 (18 miało wzorzec
`os.path.join(ASSETS, "plik.png")`, a `build_ikony_jedzenia.py`,
`build_kolo_z_grafiki.py` i `snap_paleta.py` własne).

## Co jest czym

### `items.png` — rzędy pancerza i jak do nich dopisywać (2026-09-12)

Arkusz ma **20 kolumn × 30 wierszy** po 32 px, bez marginesu i bez odstępu.
Pancerz mieszka w rzędach **20–29**, gdzie **WIERSZ = slot, KOLUMNA = wariant**:

| wiersz | slot | wiersz | slot |
|---|---|---|---|
| 20 | rękawice *(warianty brązowe)* | 25 | głowa |
| 21 | głowa *(brązowe)* | 26 | tors |
| 22 | tors *(brązowe)* | 27 | nogi |
| 23 | nogi *(brązowe)* | 28 | stopy |
| 24 | stopy *(brązowe)* | 29 | rękawice |

⚠ **Wolnych kafli jest dużo i to jest pierwsze miejsce, w które należy
zajrzeć przed rysowaniem czegokolwiek.** Partia pancerza z 2026-09-12 (dziewięć
sztuk) wzięła siedem ikon z wolnych kafli tych rzędów — zero nowej grafiki.

⚠ **Wpisywanie w wolny kafel istniejącego rzędu jest tu BEZPIECZNE**, w
odróżnieniu od arkuszy kafli mapy. `items.png` nie idzie przez Tiled:
`ITEMS[x].icon` podaje jawne `col`/`row`, więc nie ma arytmetyki
`wiersz*kolumny + kolumna`, którą wstawienie mogłoby przesunąć. Reguła „nowe
kafle w NOWYCH WIERSZACH" z `tools/CLAUDE.md` chroni arkusze adresowane
indeksem — ten nim nie jest.

⚠ **Kolczugę poznaje się po FAKTURZE SZACHOWNICY**, i to jest jedyna rzecz,
która w tych rzędach naprawdę odróżnia materiały. Wszystkie wolne kafle rzędów
25–28 są gładką płytą — **żaden nie ma siatki**. Dlatego warianty kolczugi
(`short_hauberk`, `demi_chausses`) **nie mogły wziąć wolnego kafla** i są
wyprowadzane ze źródła przez `tools/build_mail_variants.py`: pełna sztuka
ucięta na zadanej wysokości, z domknięciem własnym obrysem autora. Kafle
docelowe: **(7,26)** i **(7,27)**.

⛔ **Dwie alternatywy zostały odrzucone i obie były gorsze.** Ta sama ikona co
pełna kolczuga to dokładnie usterka zapisana przy `gambeson` („dwa różne
pancerze z jedną ikoną to najgorszy możliwy przypadek w slocie, w którym gracz
porównuje towar w sklepie"). Ikona płytowa na przedmiocie kolczym jest gorsza
od duplikatu, bo **kłamie o materiale**, a materiał decyduje o profilu obrażeń.

⚠ **Jedyny zdublowany kafel w rzędach pancerza to `(0,20)`** — `padded_gloves`
i `worn_wraps`. Stan sprzed tej partii, nie przez nią wprowadzony.

### `items.png` — rzędy BRONI i które kafle są wolne (2026-09-17)

⚠⚠ **To jest druga połowa mapy tego arkusza.** Sekcja wyżej opisuje rzędy
**20–29** (pancerz); broń mieszka w rzędach **0–8** i do 2026-09-17 nikt tego nie
spisał. Efekt był taki, że każda partia broni zaczynała się od przycinania
kandydatów i zgadywania — dokładnie ta archeologia pikseli, której ten plik ma
oszczędzać.

| rząd | co tam jest | kolumny |
|---|---|---|
| **0** | miecze z jelcem, od najkrótszego (0) do zdobnego złotego (9) | 0–9 |
| **1** | krzywe i jednosieczne: sztylet, kord, szabla, krótki miecz; **(1,4) i (1,5) NARYSOWANE** — wielki miecz, miecz długi | 0–5 |
| **2** | topory — od toporka po halabardę; **(2,5) to długi półksiężyc = berdysz** | 0–9 |
| **3** | młoty o gładkim łbie — (3,0) mały, (3,1) pobijak, (3,2) młot bojowy | 0–2 |
| **4** | pałki drewniane (0–2), buzdygany z kolczastym łbem (3–4), kiścienie (5–6), młoty (7–8) | 0–8 |
| **5** | drzewce — (5,0) goły kij, (5,2) kij OKUTY, (5,3) cienki grot, (5,4) pika, (5,5) włócznia liściasta | 0, 2–5 |
| **6** | łuki (6 sztuk) — ⛔ **martwe**, broń dystansowa nie istnieje | 0–5 |
| **7** | (7,0) **kilof**, (7,1–3) kusze — ⛔ kusze martwe | 0–3 |
| **8** | **(8,0) jedyna na arkuszu głownia BEZ JELCA** — stąd ikona noża | 0 |

⚠⚠ **Trzy najwęższe głownie rozstrzygają się TRZEMA różnymi cechami** — i to jest
jedyny powód, dla którego sztylet, mizerykordia i nóż da się przy 17,6 px odróżnić
na jednej półce: **(1,0) sztylet** — pierścień rękojeści · **(0,1) mizerykordia** —
najdłuższa z trzech · **(8,0) nóż** — BRAK jelca. ⛔ Mizerykordia miała najpierw (0,0)
i przy tej wielkości **była prawie nie do odróżnienia od sztyletu**; długość jest
ostatnią cechą, która się tam jeszcze czyta.

⭐ **(8,0) jest cenniejsze, niż wygląda.** Wszystkie wolne kafle rzędu 0 mają krzyż
rękojeści i przy 17,6 px czytają się jako MIECZ. Nóż z jelcem kłamie o tym, czym
jest — dokładnie tak samo, jak ikona płytowa kłamałaby o kolczudze (wyżej).

⚠ **Czego na tym arkuszu NIE MA i nie da się podrobić:** zakrzywionego ostrza na
długim drzewcu, czyli **kosy bojowej**. (2,5) i (2,8) są toporami i przy 17,6 px
czytają się jako topory. Konstrukcja czeka na ikonę, nie na projekt — zapis
w `docs/decyzje/2026-09-17-katalog-broni-warstwy-spoleczne.md` §2.

⚠⚠ **DWA KAFLE TEGO RZĘDU SĄ NARYSOWANE, nie wzięte z arkusza źródłowego:**
**(1,4) Wielki miecz** i **(1,5) Miecz długi** — generator `tools/build_ikony_mieczy.py`.
Powód jest POLICZONY, nie estetyczny: obie wolne głownie rzędu 0 są **mniejsze od
zwykłego miecza** — (0,2) ma 174 px, (0,3) 185 px, a `sword` (0,5) **239 px**. Ikona
„miecza długiego" mniejsza od miecza kłamie o jedynej cesze przedmiotu.
⚠ **Wielkiego miecza nie wystarczyło narysować WIĘKSZEGO**: przy 17,6 px czytał się
tak samo jak tasak, bo obie głownie są szerokie i liściaste. Rozstrzygnęło dopiero
**ZBROCZE** — ciemna bruzda wzdłuż środka głowni, której nie ma żadna inna ikona
tego arkusza. ⛔ Nie kasuj jej „dla czystości".

⚠⚠ **SKANUJ KOLIZJE, NIE UFAJ PAMIĘCI.** Przy domknięciu puli (2026-09-18) sześć
nowych broni dostało kafle z głowy i **trzy z nich powtarzały już zajęte**:
topór duński = berdysz (2,5), młot bojowy 1H = nadziak (3,0), widły = rohatyna
(5,3). Wyłapał to dopiero skan `icon.row/col` po całym `ITEMS`, nie oko.
⛔ Dwa różne przedmioty z jedną sylwetką to najgorszy przypadek w slocie,
w którym gracz porównuje towar w sklepie — patrz ostrzeżenie przy `gambeson`.

⚠ **Widły stoją na IKONIE PLACEHOLDEROWEJ (2,5)** — okutym drągu. Na arkuszu
nie ma sylwetki z zębami i żadne przycięcie tego nie da. `OI-114`.

⚠ **Wolne kafle po domknięciu puli (2026-09-18):** (0,2), (0,3), (0,9) miecze ·
(2,5) — zwolniony? **NIE**, berdysz · (2,7) topór dwusieczny · (4,0), (4,3)
obuchy · (7,0) **kilof** — zwolniony po usunięciu konstrukcji z katalogu broni.
⚠ Skanowanie robi się alfą, nie okiem: kafel „pusty" to taki, w którym mniej niż
20 pikseli ma `A > 8`.

### ⭐⭐ Rodzina SZTYLETÓW dostała własne PNG (2026-09-27)

`knife`, `dagger` i `misericorde` **przestały czytać kafle `items.png`** opisane
wyżej ((8,0), (1,0), (0,1)) — te pola zostają w `icon` wyłącznie jako ŚCIEŻKA
AWARYJNA. Pliki `public/assets/items/icon_weapon_*.png` (32×32) pisze
**generator `tools/build_ikony_sztyletow.py`** (przymiar; zapis pod `--zapisz`),
wpięcie przez `iconTexture`. Wsad Gemini z `docs/gemini_weapon_icons.md` był
tylko projektem — ⛔ skalowanie go do 32 px zjadało jelce i dawało szum, więc
nie jest źródłem pikseli.

⚠⚠⚠ **Pięty noża NIE DA SIĘ narysować profilem „jeden zakres [lo..hi] na
wiersz płótna".** Cięcie prostopadłe do osi 45° sprawia, że poziomy wiersz
przechodzi przez RÓG PIĘTY, pustą szczelinę i rękojeść — trzy odcinki, nie
jeden. ~20 iteracji 2026-09-27 dawało przez to rampę, poziomą belkę albo
narośl. Noże są opisane w osiach broni (`s = x+y` wzdłuż, `u = x−y`
w poprzek, `u = 0` grzbiet) i rasteryzowane piksel po pikselu; generator
pilnuje tego asercją „jest wiersz z luką". Dotyczy każdej przyszłej broni
z piętą, ricasso albo wycięciem (tasak, sierp, berdysz).

⚠ **Łuk czubka to parabola, nie ćwiartka elipsy.** Elipsa ma pionową styczną
na starcie, więc krawędź spotyka grzbiet pod kątem prostym — wychodzi łopatka.
Parabola daje ostry drop point i brzuch dalej.

⚠ **Sztylet i mizerykordia są ZAMROŻONE złotym SHA1 w generatorze** —
rysowane starym profilem per wiersz, bo tak je zatwierdzono. Czerwony SHA1
znaczy: ktoś ruszył wspólny helper albo paletę.

⚠ **`icon_weapon_hunting_knife.png` NIE ma przedmiotu w `ITEMS`** — plik
czeka bez wpięcia; nowa pozycja katalogu to decyzja contentowa.

### ⭐⭐ BROŃ ZAWSZE PO SKOSIE — kąt z gabarytu (2026-10-01)

⭐ **Każda ikona wyśrodkowana w polu** (2026-10-02, `tools/icon_center.py`).
**`1×1` → oś 45°** — wyłącznie broń **do ~45 cm** (sztylety, toporek;
decyzja autora 2026-10-02), **`1×2` → skos 1:2 od rogu do rogu** — cała
reszta (wszystkie miecze, topory od siekiery, obuchy, drzewcowe). Decyzja autora po przymiarze pion
vs skos na półce plecaka. Generatory: `build_ikony_sztyletow.py`,
`build_sword_icons.py`, `build_polearm_icons.py`.

⚠⚠ **Na skosie 1:2 tony rysuj w PASACH, nie od ciągłej odległości od osi.**
Pas = dwie kolejne wartości `u = 2x − y` = dokładnie 1 px w każdym wierszu.
Próg liczony od ciągłego `v` wypadał raz między pikselami, raz na pikselu
i głownia miecza wyszła kropkowana po przekątnej (przymiar 2026-10-01).
⚠ Prawy dolny róg jest ciasny (jelec w poprzek osi przy rękojeści) —
kotwicę głowicy dobiera generator, a pałąk rapiera leży po stronie światła.

⚠⚠ **Kształt biegnący W POPRZEK osi (głowa topora) rysuj WIELOKĄTEM, nie
w pasach** (`build_axe_icons.py`, 2026-10-02). Pasy są dobre dla tego, co
biegnie WZDŁUŻ osi (trzonek, głownia); poprzeczny brzeg w pasach wychodzi
poszarpany, bo pas wiersza dostaje 0–2 piksele. Wielokąt z punktów (t, w),
rasteryzowany po środkach pikseli i cieniowany w pikselach, daje czysty obrys
i krawędź tnącą jako łamaną.
⚠ **Ostrze topora po stronie światła (lewa-dół) zabiera miejsce przy lewym
górnym rogu** — szeroki topór nie dojdzie osią do rogu (duński 50 px,
berdysz 57 px zamiast 62/70).

### ⭐ Wrogowie-humanoidzi 3D — `characters/enemy_<id>.glb` (2026-10-11, `OI-171`)

`tools/npc3d.py -- <bandit_club|bandit_axe|bandit_chief> --zapisz` — preset
mieszkańca z polem `wrog` (broń z `char3d_weapons`) i klipami walki zamiast
samego `Idle`: `Idle` (bezruch chodu z bronią + oddech), `Walk`, `Run`
(warianty `*_Armed` przemianowane), `Attack`. Silnik: `Creature3D`
(`MODELE_3D.bandit_*`), stan z `Bandit.stan3d()`.
- ⚠ `Walk`/`Run` eksportowane z zakresem **0–4** — klatka 5 to bezruch POZA
  pętlą, a `Creature3D` gra cały klip w pętli (szarpnięcie raz na cykl).
- ⚠ Chód i bieg budowane OD NOWA na szkielecie presetu (`zbuduj_chod`,
  `zbuduj_bieg`) — `Walk` z pliku ma cele IK bazy i przy innych proporcjach
  dłonie wiszą na złej wysokości.
- ⚠ **Śmierci jako klipu nie ma** — `Creature3D` przewraca korzeń (400 ms),
  gdy model nie ma `Death`; bez tego `Idle` w pętli nigdy by się nie skończył
  i ciało nie znikało.
- Ostrzeżenie `[BLAD]` zasięgu ramienia w klatce cięcia `Attack` — ten sam
  stan, co u gracza (`char3d_export_gltf`), nie błąd presetu.

### ⭐⭐ Czworonogi 3D — RDZEŃ `tools/quad3d.py` + gatunki (2026-10-03)

- **Gatunek = DANE** (`quad3d.Gatunek`): profil tułowia, przebieg nóg, kości,
  kolory stref, chody, klipy własne. Rdzeń nie zna żadnego gatunku.
  Gatunki: `tools/boar3d.py` (dzik), `tools/wolf3d.py` (wilk + Szary).
- ⭐ **Zwierzęta wsi (2026-10-09): `tools/farm3d.py`** — `cow`, `bull`, `sheep`,
  `ram`, `pig`, `chicken`, `cat_<black|brown|orange|white>.glb`. Gatunki to
  PRZEKSZTAŁCENIA istniejących danych: przeżuwacze z jelenia (jedno `T` na
  profil, nogi i kości naraz — szkielet zostaje zgodny z siatką), świnia
  z dzika, kot z lisa. Kura idzie przez ten sam rdzeń: tułów-jajo z profilu,
  dwie nogi = tylne nogi rdzenia, PRZEDNIE schowane w tułowiu (rdzeń zawsze
  ma cztery), grzebień = blaszka „uszu". Łaty, wełna i rogi przez `dodatki`
  gatunku — rdzeń bez zmian. Klip `Eat` własny (łeb przy ziemi / dziobanie).
- ⚠ **Dowód wydzielenia rdzenia:** zrzut wierzchołków, kości, kolorów i póz
  dzika w 30 klatkach przed/po — identyczny (a porównanie łapie 0,001 j.).
  Zmieniając rdzeń, powtórz ten zrzut: nowe pole gatunku dodaje się jako
  OPCJONALNE (`getattr`, jak `BRZUCH_KAT`), żeby stare gatunki się nie ruszyły.
- **Wilk** (`animals/wolf.glb`) i **Szary** (`animals/greywolf.glb`, ta sama
  bryła w bledszej rampie, w grze ×1,3 — `MODELE_3D.greywolf.skala`):
  11 klipów — `Idle`, `Walk`, `Trot` (okrążanie), `Run` (bieg skokami),
  `Howl` (alarm watahy), `Growl` (każdy zamach — u Szarego telegraf),
  `Lunge` (skok wypadu), `Bite`, `Hit`, `Stunned`, `Death`. 745 wierzch.,
  30 kości, ~318 KB.
- ⚠ **Łapa pozioma = pierścień pionowy:** jego środek musi być ≥ promień nad
  gruntem (pierwsza wersja: łapa 0,17 j. pod ziemią w spoczynku — bramka
  gruntu zaświeciła).
- ⚠ **Pomiar referencji to POZA, nie anatomia:** zwierzę stało pochylone
  z łbem nisko, więc zad opadał o 20% od kłębu (wilk jak hiena), a łeb wisiał
  pod grzbietem. Poprawione w tabelach — oglądaj render, nie tylko liczby.
- ⚠ **Światło gry rozjaśnia bardziej niż podgląd Blendera:** Szary z pełną
  rampą `greywolf.png` wychodził w grze prawie biały — rampy wilków ×0,90.
- **Królik** (`animals/rabbit.glb`, ~237 KB, 8 klipów: `Idle`, `Hop`, `Alert`,
  `Freeze`, `Bite`, `Hit`, `Stunned`, `Death`). ⚠⚠ **W SKALI GRY, nie natury**
  (~×1,8): prawdziwy królik przy gęstości gracza miałby 7 px; sprite 2D ma
  ~34×32 px i model trzyma tę wielkość. Jedyny świadomy wyjątek od realnej
  skali (dzik i wilk są realni i i tak trafiają w swoje sprite'y).
- ⚠ **Królik nie chodzi, tylko SKACZE** — nie ma `CHODY`; `Hop` to JEDEN skok
  (667 ms = cykl patrolu `Rabbit.WALK_CYCLE_MS`), restartowany na każdym
  wybiciu przez `Stan3D.od`, w tempie `667 / cykl`. Bez restartu łapy
  rozjeżdżają się z ruchem (ta sama pułapka, którą ma arkusz 2D).
- **Pająki** (`tools/spider3d.py` → `animals/spider.glb` sieciarz,
  `animals/venomspider.glb` skoczek; ~285 KB, 9 klipów każdy). Ośmionóg NIE
  ma ciała czworonoga — rdzeń przyjmuje od gatunku własne `cialo` i własne
  `zbuduj_klipy` (zaczepy opcjonalne, dzik identyczny w zrzucie). Chód:
  naprzemienne czwórki łap; łapa = udo z kolanem W GÓRĘ (IK w płaszczyźnie
  łapy) + goleń + stopa. Sieciarz: `Rear` (przód w górę, odwłok podwinięty
  kądziołkami do przodu) → `Shoot`; skoczek: `Threat` (przednie dwie pary
  wysoko — jego telegraf) → `Bite`; śmierć = łapy podkurczone, na grzbiecie.
- ⚠ **Skoczek NIE w oliwkowej zieleni placeholdera** — na trawie znikał.
  Barwy ostrzegawcze (ochra z żółtymi plamami).
- ⚠ **Ciało pająka OBNIŻONE względem referencji** (tam brzuch ~4,8 j. nad
  gruntem) — mieści się w kadrze 128×96 i czyta z kamery 15°.
- ⚠ **Akcja bez fazy `active`/bezbronności (sieć) albo z `active` na jedną
  klatkę (kęs) ZJADA klip ciosu** — model przeskakiwał z zamachu w bezruch.
  Sieciarz zapisuje moment strzału w `fire()`, skoczek gra `Bite` także
  w `recovery`.
- **Jeleń** (`tools/deer3d.py` → `animals/deer.glb`, ~310 KB, 10 klipów).
  Byk jelenia szlachetnego, ~1,17 m w kłębie. Klipy pod `Deer.ts`: `Alert`
  (płoszenie), `Lower` (zapowiedź: łeb w dół, poroże w przód, racica w
  ziemię), `Ram` (wypad i podrzut poroża); galop = zryw. Bufor 176×144 —
  poroże sięga 13,6 j.
- ⚠ **Poroże NIE z referencji** — tam wapiti z rozłożystym porożem ±3,8 j.;
  z kamery gry byłoby kratą kresek większą od zwierzęcia. Tu sześć grubszych
  odnóg na stronę, końcówki jaśniejsze.
- ⚠ **Łeb +1,0 j. ponad pomiar** — referencja (poza oddechu) trzymała łeb
  prawie na piersi; jeleń z kamery gry nie miał szyi.
- **Lis** (`tools/fox3d.py` → `animals/fox.glb`, ~287 KB, 10 klipów).
  Skala z KŁĘBU (0,40 m), nie z najwyższego punktu — referencja stała
  w czujności z łbem w górze. W grze ×1,25 (`MODELE_3D.fox.skala`). Klasyczny
  rudy z białym spodem i końcówką kity (`OGON_KONCOWKA` — opcjonalne pole
  rdzenia, dzik identyczny w zrzucie), czarne „pończochy”. Klipy pod
  `Fox.ts`: `Alert` (postój w ucieczce — ogląda się), `Snarl` (zwrot:
  przyczajenie, łeb nisko, uszy po sobie), `Bite`; galop = zryw.
- ⚠ **Lis NIE w ciemnej rdzy `fox_*.png`** — z kamery gry zlewał się
  z dzikiem i niedźwiedziem.
- ⚠ **Uszy lisa mają BRYŁĘ** — blaszka licem do przodu (wilk) była z boku
  kolcem. Ta sama lekcja co u królika i niedźwiedzia.
- ⚠ **Warkot (`Snarl`) przy przysiadzie −0,16 nie odróżniał się od
  bezruchu** — dziś −0,32 i łeb −26°.
- **Niedźwiedź** (`tools/bear3d.py` → `animals/bear.glb`, ~297 KB, 9 klipów).
  Garb nad łopatkami najwyżej, łeb ~0,9 j. niżej, kark WĘŻSZY od policzków,
  obie łapy płasko (`SRODRECZE_ZA_NOGA` 0 — stopochód). Zapowiedź `Rear`
  (wspięcie na tylne, prawa łapa w górze, 625 ms ≈ `windupMs`) → `Swipe`
  (zgarnięcie łapą i ciężka bezbronność, 833 ms ≈ `recoveryMs`); zwrot
  w zamachu = ZAMROŻONY `swipeDir`, nie bieżący gracz. Bufor 160×128.
- ⚠ **Niedźwiedź z pierwszej wersji czytał się jak KAPIBARA**: łeb na
  wysokości grzbietu i kark grubości łba dawały jedną bryłę od nosa do zadu.
  Rozdziela je dopiero zagłębienie karku za czaszką i łeb niżej garbu.
- ⚠ **Tułów niedźwiedzia +15% za łopatką względem referencji** — tamta była
  krępa jak maskotka (1,59 m przy 1,15 m w kłębie).
- ⚠ **Uszy królika mają BRYŁĘ** (`UCHO_BLASZKA=False` + `dodatki`): blaszka
  licem do przodu (dzik, wilk) z profilu była kreską i królik czytał się jak
  szczur. Stopa leży płasko → `SRODRECZE_ZA_NOGA = 0`.

### ⭐⭐ Dzik 3D — `tools/boar3d.py` → `animals/boar.glb` (2026-10-03)

- **Własny generator czworonoga**, ta sama metoda co baza postaci: bryła
  z pierścieni (`PROFIL` — 25 przekrojów od tarczy ryja do zadu, superelipsa
  2,5 + podniesiona grzywa), nogi jako rury z wagami na pierścieniach, kły,
  uszy, oczy i ogon z własnej geometrii, kolor = kolory wierzchołków stref
  z rampy `boar.png`. Scena od zera — źródłem jest skrypt, nie `.blend`.
- Konwencje: ryj w **−Y**, racice na **z = 0**, jednostki postaci
  (0,85 m w kłębie = 5,9 j.), szkielet z transformem jednostkowym.
- **10 klipów** pod stany `Boar.ts`: `Idle`, `Walk` (stępa 4-taktowa),
  `Trot` (kłus po przekątnej), `Run` (galop), `Telegraph` (ryj przy ziemi +
  grzebanie przednią racicą), `Charge` (galop z łbem nisko), `Gore`
  (przysiad → wypad i podrzut łba), `Hit`, `Stunned`, `Death` (ugięcie nóg
  i przewrót na bok). 823 wierzchołki, 29 kości, `.glb` ~300 KB.
- Przymiar jak wszędzie: bez `--zapisz` tylko raport (zasięg IK nóg, grunt
  w każdym klipie) i podgląd; zapis odmawia przy czerwonej bramce.
- ⚠ **Górne pierścienie nóg MUSZĄ leżeć w tułowiu** (x + r < pół szerokości) —
  inaczej z boku szynki wystaje płaska „klapa".
- ⚠ **Noga nie może stać w spoczynku jak słup.** Łokieć jest cofnięty za
  linię nogi; przy prostej nodze (zapas 0,08 j.) pęcina nie dosięgała celu
  o 0,4–0,7 j. przy każdym kroku. Łopatka waha się ZA racicą — ⚠ ze znakiem
  DODATNIM wokół +X (ujemny odpychał bark od racicy).
- ⚠⚠ **Konwencja kątów tułowia: dodatni = przód w górę** (`_tulow` neguje
  kąt, bo obrót wokół +X opuszcza ryj). Bez tego telegraf podnosił łeb.
- ⚠⚠ **Przewrót przy śmierci idzie wokół osi Y ŚWIATA**, nie wokół Y kości
  `root` — ta stoi pionowo, więc jej Y to pion i „przewrót" był obrotem
  w miejscu (dokładnie wada skryptu wilka z dziennika).
- ⚠ Uszy to blaszka **licem do przodu** — bokiem wzdłuż Y czytały się od
  przodu jak rogi; materiał bez odrzucania tylnych ścian.
- ⚠⚠ **`predkosciKlipow` = krok / (udział podparcia × czas cyklu)** — łapa
  przesuwa się po ziemi tylko w podporze; do 2026-10-04 wpisy były
  „krok / cykl" (1,6–3,3× za mało) i łapy przebierały szybciej, niż jechało
  ciało.
- ✅ **W grze od 2026-10-03:** `MODELE_3D.boar` (`GameConfig.ts`) → `Creature3D`
  podpinany w `GameScene.spawnEnemy`; klip i zwrot z `Boar.stan3d()`, tempo
  lokomocji z prędkości ciała (`predkosciKlipow`, j./s z generatora:
  krok / czas cyklu). Arkusz `boar.png` zostaje ścieżką awaryjną.

### ⭐⭐ BIEG postaci 3D (2026-10-03)

- Klip `Run` (`tools/char3d_run.py`) + `Run_*` dla każdego wariantu chodu
  z bronią/tarczą — eksport NAGRYWA wywołania `zbuduj_chod_uzbrojony`
  i odtwarza je z `zrodlo="Run"`. ⛔ Nie dopisuj wariantów biegu ręcznie.
- `Character3D`: chód → bieg 85–125 px/s, tempo = prędkość/120. ⚠ Faza biegu
  jest zrównywana z fazą chodu co klatkę (ten sam układ: 0 = lewa podpiera).

### ⭐⭐ Pancerz na modelu 3D — CAŁY katalog (2026-10-03)

- Baza w BIELIŹNIE (`char3d_zones.BONE_ZONE`: wszystko skóra, miednica =
  bielizna); 55 sztuk jako węzły `Pancerz_<id>` (`tools/char3d_armor.py`),
  widoczne, gdy gracz ma je na sobie (`Equipment.wornItemIds`). Pokrycie
  z KONSTRUKCJI (`POKRYCIE`: kości + cięcia `dol`/`gora` po wysokości,
  `x_min`/`x_max` dla rąk w T-pozie), grubość z WARSTWY i slotu, kolor
  z IKONY (dla metalu z pikseli szarych), wzór z konstrukcji w kolorach
  wierzchołków (`COLOR_0`). Głowa: kopia siatki `Cube` — „czapka" albo
  „kaptur", kapalin z rondem. Kopie BEZ `Subdivision` (~27 KB na sztukę).
- ⚠⚠ **Ciało ma normalne DO ŚRODKA** na torsie i ramionach (materiały są
  dwustronne, więc tego nie widać). Kopia pancerza napuchnięta „wzdłuż
  normalnych" chowała się w ciele — każda ściana dostaje dziś lico od osi
  ŚRODKA CIĘŻKOŚCI ścian swojej kości na zewnątrz (oś kości myliła się na
  ścianach zamykających — dziura na czubku buta). ⛔ Nie usuwaj tego kroku.
- ⚠ Dół i góra sztuki tnie WYSOKOŚĆ, nie granica kości — przy biodrach wagi
  się mieszają i brzeg szedł zygzakiem.

### ⭐⭐ Broń i tarcze OKUTE w dłoni modelu 3D (2026-10-03)

- **Broń**: kształt, długość i przekrój 37 broni w `tools/weapon_shapes.py`
  (jedno źródło, bliźniak `shield_shapes.py`); `char3d_weapons.py` trzyma
  wyłącznie MOCOWANIE. Skala: historyczne cm do 120, nadwyżka ×0,3 (pika
  450 → 219 cm). ⚠ Broń jest dzieckiem kości i dziedziczy **skalę armatury
  1,6527** — przeliczenie cm → jednostki lokalne (`CM_NA_LOKALNE`) uwzględnia
  ją; bez tego cały arsenał wyszedłby ×1,65.
- ⚠ **Ostrze do przodu**: bryła jest skręcona −90° wokół osi broni, bo
  lokalne X kości dłoni patrzy w BOK — bez skrętu topory w profilu stały
  krawędzią i czytały się jak włócznie.
- **Tarcze okute**: węzły `Tarcza_<konstrukcja>_<gatunek>` (obręcz, umbo,
  lity puklerz) z macierzy `shield_shapes.OKUCIA`, wspólnej z ikonami
  (generator ikon sprawdza zgodność). Silnik wybiera wariant PO IKONIE.
- **Broń drzewcowa poza walką** idzie klipem `Walk_Armed_Pole` (+ `_Shielded`,
  `_Shielded_Large`): pionowo przy boku, jednorącz — `char3d_chod.NIESIENIE_DRZEWCE`.
  ⛔ Nie wracaj do `Walk_Armed_2H` w marszu: drzewce przy barku czytało się
  „jak bazooka" (autor 2026-10-03).
- **Broń drzewcowa w walce i w ataku kłutym** (2026-10-03): gotowość
  `Walk_Armed_Pole_Combat` / `_Shielded_Combat` (drzewce opuszczone do przodu)
  i PCHNIĘCIE `Attack_Thrust_2H` / `Attack_Thrust` (`tools/char3d_thrust.py`,
  z wypadem miednicy) — silnik gra je, gdy wariant ataku jest kłuty. Drzewcowa
  skraca się łagodniej (`weapon_shapes.SKROT_DRZEWCOWEJ` ×0,6), pika ma sufit
  273 cm (noszenie pionowe). ⚠ Klip, który obraca kość dłoni albo przesuwa
  miednicę, MUSI je wyzerować na końcu — klipy bez kluczy na tych kościach
  czytają przy eksporcie OSTATNIĄ wartość (zmierzony wyciek: chwyt 0,39 → 0,59).
- **Uderzenie tarczą** `Attack_ShieldBash` (2026-10-11, `tools/char3d_shield_bash.py`):
  lewa dłoń wybija tarczę z gardy (`NIESIENIE_TARCZA_WALKA`), wypad miednicy, lico
  tarczy w przód w klatce uderzenia; 5 klatek, cios w 2 jak `Attack`. Silnik gra
  go przy `poza: "tarcza"` (`PLAYER_ACTIONS.shieldBash`). ⚠ Klip zeruje obrót
  OBU kości dłoni i miednicę — ta sama reguła co wyżej.
- **Manekin treningowy** `props/training_dummy.glb` (2026-10-11, `tools/dummy3d.py`):
  klipy `Idle`/`Hit` jako animacja OBIEKTU (bez szkieletu). ⚠⚠ **Model bez
  armatury musi dostać skalę armatury postaci (1,6527) W WIERZCHOŁKACH** —
  wymiary w „j. pliku postaci" (~8,4 j. człowieka) dawały w grze manekina do
  pasa gracza, bo postać renderuje się ×1,6527 (~13,9 j.). Zmierzone na renderze.
- **Bufor postaci 320×184** (było 96×128; wcześniej 192×160) przy stałej gęstości
  `J_NA_PX` — przy 96 px broń dwuręczna była ucinana przy każdym zwrocie
  bokiem, a zamach nad głową górną krawędzią. Bramka:
  `tools/char3d_sprawdz_bron.py` (kolumny „rama", stałe czytane z TS).

### ⭐⭐ Tarcze METALOWE: warstwa metalu na drewnianym masterze (2026-10-02)

`icon_shield_{iron|steel}_{buckler|round|heater|almond|scutum}.png` pisze
`tools/build_metal_shield_icons.py` z rysunku `build_shield_icons.rysuj`
(master nietknięty). Kolory metalu: **`tools/metal_palette.py`** — wspólny
standard, ⛔ nie wpisuj szarości lokalnie. ⚠ Umbo rysuj jako koło `d ≤ r`
z kołnierzem = koło minus jego erozja — pas odległości daje zębatkę, a próg
`r + 0,3` kwadrat (szczegóły: `docs/tarcze_grafika_checkpoint.md` §15).

### ⭐⭐ Rodzina DRZEWCOWYCH: 32×64 po SKOSIE 1:2 (2026-09-30)

`spear`, `pike`, `halberd`, `glaive`, `boar_spear`, `pitchfork` czytają
`public/assets/items/icon_weapon_*.png` (**32×64**, gabaryt 1×2 w plecaku);
kafle `items.png` w `icon` zostają ŚCIEŻKĄ AWARYJNĄ. Piksele rysuje
**`tools/build_polearm_icons.py`**; arkusz Gemini `polearms_v1_raw.png` był
tylko projektem. Decyzje i ocena: `docs/gemini_weapon_icons.md` §11.

⭐ **Oś 1:2 (1 px w lewo na 2 px w górę), od rogu do rogu kafla.** Opis
w CAŁKOWITYCH osiach broni `s = x + 2y`, `u = 2x − y`: w jednym wierszu
sąsiednie piksele różnią się o 2 w `u`, więc **pas 4 kolejnych `u` = dokładnie
2 px na wiersz** (drzewce), pas 2 = dokładnie 1 px (igła, zęby wideł). Bez
tego drzewce wychodzi „koralikami" 2/3/2 px.

⚠ **45° w 32 px kończy się na ~43 px** — rohatyna czytała się wtedy jak miecz
z jelcem. ⚠ Odbicie względem osi 1:2 nie przekłada kratki na siebie, więc
symetryczny liść ma krawędzie o różnych schodkach (koszt przyjęty).

⚠ **Dwie równoległe cienkie linie na skosie (zęby wideł) potrzebują ≥ 2,8 px
rozstawu.** Przy 2,3 szczelina na schodkach domykała się konturem — zamknięta
dziura i trzeci „ząb" z konturu.

### ⭐⭐ PANCERZ dostaje własne PNG z arkuszy Gemini (2026-09-28, w toku)

31 z 55 sztuk pancerza (głowa, klata, nogi z lnu/skóry/kolczugi)
**przestało czytać kafle rzędów 20–29 `items.png`** — `icon` zostaje przy
nich jako ŚCIEŻKA AWARYJNA. Pliki `public/assets/items/icon_armor_*.png`
(32×32) pisze **`tools/build_armor_icons.py`** (przymiar; `--podglad`,
`--zapisz`) z arkuszy `docs/art-review/gemini/armor_*_raw.png`; wpięcie
przez `iconTexture` + listę `ASSETS.iconArmor`. Plan, prompty i ocena
każdego arkusza: `docs/gemini_armor_icons.md`. ⛔ **Nie poprawiaj tych PNG
ręcznie** — następny `--zapisz` je nadpisze.

**Inaczej niż sztylety:** tu piksele IDĄ z arkusza (pancerz to zwarte
bryły, przeżywają zejście ~2×). Generator tylko zmniejsza, przyciąga do
ramp materiałów i dokłada to, czego zejście nie przenosi.

⚠⚠ **Faktura drobniejsza niż 2 px NIE przeżywa zejścia 2×** — szachownica
kolczugi (mora albo gładka szarość), ćwieki, nity, łuski, szczeliny lamelki.
Każda idzie **natywnie po zmniejszeniu**. Raport był przy tym zielony za
każdym razem; brak faktury widać wyłącznie na renderze.

⚠⚠ **Kontur: 4-sąsiedztwo, nie 8** (jak tarcze, nie jak sztylety) i obwódka
arkusza Gemini zdejmowana przed dołożeniem własnej. Oba błędy razem dały
„nieprzyzwoicie duży obrys" na wszystkich 25 ikonach pierwszej partii;
pilnuje tego asercja `gruby_kontur`.

⚠ **Żelazo = zamiana rampy stali stopień w stopień**, nie osobny rysunek.
Rampa `IRON` jest SZARSZA niż żelazo noża — ciepła rampa noża na dużej
płaszczyźnie czytała się jako brąz.

⭐ **Slot NÓG to zawsze SPODNIE** (także metal: płyty NA spodniach) — model
3D gracza będzie w bieliźnie, przedmioty nakładane jak w WoW.

### ⭐⭐ IKONA PRZEDMIOTU PRZESTAŁA BYĆ KWADRATEM (2026-09-19)

Sześć tarcz z `tools/build_shield_icons.py` to pierwsze ikony **32×64 px** —
migdałowa, legionowa i pawęż zajmują w plecaku dwa pola (`inventoryFootprint`).
Pliki: `public/assets/items/icon_shield_wood_*.png`, wpinane przez `iconTexture`
(ta sama, trzecia ścieżka ikony, co chleb i mięso — sprawdzana PRZED `icon`).

⚠ **`makeItemIcons` zachowuje rozmiar źródła tylko dla plików o kroku 32 px.**
Do tej daty każdy samodzielny PNG był wciskany w 32×32 i nikt tego nie widział,
bo wszystkie były kwadratowe. Plik o innym kroku dalej wpada w 32×32, żeby
przypadkowy obrazek nie wjechał do UI w swoich wymiarach.

⚠⚠ **Trzy rzeczy w UI trzeba było nauczyć, że ikona bywa wyższa niż kafel** —
i każdą wykrył RENDER, nie asercja:
1. **Kolejność rysowania w plecaku.** Kafle powstają po kolei (ramka → ikona),
   więc ramka pola 7 lądowała NA ikonie pola 3: w grze widać było **same górne
   połowy** trzech dużych tarcz. Ikony idą teraz na wierzch po zbudowaniu kraty.
2. **Podświetlenie zaznaczenia** obejmowało samą kotwicę — złota ramka świeciła
   na połowie przedmiotu. Dziś pyta o przykrycie (`bagAnchor`).
3. **Sklep zmniejszał ikonę do kafla** (46 j.), czyli dokładnie to, przed czym
   ostrzega `SHOP_LAYOUT`. Kolumna kupca dostała własną **wysokość rzędu**
   (`rowH` 70), a kolumna gracza — jako lustro plecaka — rozciąga ikonę na dwa
   pola. ⛔ Nie podnoś `rowH` kolumny gracza: zabiera jej czwarty wiersz
   i bazowy plecak przestaje się mieścić bez paska (asercje S4/S5/S6).

⚠ **Kafel ręki w lalce ma dwa pola w pionie** (`WEAPON_ROWS_MAX`), ale liczba
wierszy jest **wynikiem pomiaru**: na telefonie kolumna wyposażenia potrzebowała
514 j. przy 460 dostępnych, więc schodzi tam do jednego wiersza, a ikona rysuje
się w skali ×1 zamiast ×2. Reguła skali: `src/ui/IconFit.ts` (skala całkowita,
przy zmniejszaniu odwrotność całkowitej — ułamek rozmywa pixel-art pod NEAREST).

### Ikony TOREB w stylu skórzanego ekwipunku (2026-10-04)

`icon_bag_1..4.png` (sakiewka, torba, sakwa, plecak) RYSUJE
`tools/build_bag_icons.py` — kształty z geometrii (elipsy, wielokąty, łuki),
jedno światło z lewej-góry, szwy klap świadomie. `bag-1..4.png` (64×64)
zostają wyłącznie REFERENCJĄ kształtu.
- ⚠ **Zmniejszenie źródeł ścieżką skórzanego kaftana NIE wystarcza.** Kolor
  i kontur się zgadzały, ale klapy, pasek sakwy, sprzączki i paski plecaka
  rozpłynęły się w bryły z jasnymi plamami — sakwa czytała się jak kamień.
- Kolory wyłącznie ze wspólnych ramp: skóra `wood_palette` (stopnie
  2·4·7·10·11), sznurek i mosiądz `BAST`, sprzączka sakwy `IRON`.
  ⛔ Rampy mosiądzu nie ma i nie dopisuje się jej „tylko dla torby”.
- Każda torba ma ZNAK rozpoznawczy pilnowany w raporcie (sznurek ≥ 12 px,
  kołeczek ≥ 6, sprzączki ≥ 8/12) i parami odrębność ≥ 0,12 — bez tego
  cztery brązowe bryły zlewały się w jedną.
- ⚠ **Ukośna linia cieńsza niż ~1,5 px gubi co drugi piksel** przy progu
  pokrycia 50 %; a jej cień BAST[0] leży o krok od skóry — końce sznurka
  sakiewki były w buforze, a na worku ich nie było widać.
- ⚠⚠ **Sakwa z paskiem ŁUKIEM nad bryłą i jedną sprzączką na środku czytała
  się jak DAMSKA TOREBKA, nie ekwipunek** (autor, 2026-10-04). Drogę mówi
  zwinięte POSŁANIE na wierzchu (rampa `LINEN`) i dwa ciężkie paski z ramkami
  sprzączek; pasek na ramię zwisa z lewego boku (wyprowadzony w górę sterczał
  jak antena). ⚠ Kwadratowe ramki 5×5 parą obok siebie czytały się jak OCZY —
  sprzączka to pionowa ramka 4×6 z poprzeczką.
- Raport dopuszcza prześwit (`PRZESWIT`) wyłącznie duży — mała dziura czyta
  się w 1x jak błąd siatki; dziś żadna torba go nie ma.

### ⚠ Ikona BRONI ma dwie skale, a decyduje ta mniejsza

Ikona z `items.png` jest rysowana w **dwóch zupełnie różnych wielkościach**, i
to nie jest szczegół:

| gdzie | wielkość | skąd |
|---|---|---|
| plecak / lalka | **64 px** | kafel 32 px × 2 (`PlayerPanel`) |
| **broń w dłoni podczas walki** | **17,6 px** | 32 px × `PLAYER.heldWeaponScale` 0,55 |

> **Ikonę broni ocenia się przy 17,6 px, nie przy 64.** Plecak wybacza wszystko,
> walka nie wybacza niczego.

⚠ **Ta reguła powstała z błędu, nie z teorii (2026-08-16).** Ikonę włóczni
wybrano oglądając ją przy 64 px — wąski grot był tam wyraźnie widoczny i wygrał
z szerszym wariantem jako „ładniejszy". W grze zgłoszono to natychmiast:
*„włócznia wygląda jak patyk w dłoni"*. Zmierzone po fakcie: ikona włóczni i
ikona kija mają **tę samą oś 45° i praktycznie tę samą długość** (40,3 vs
39,6 px), więc przy 17,6 px różni je wyłącznie grot — a ten schodzi wtedy do
kilku pikseli. Jedyny wariant, który się broni, to najszersze ostrze.

Przy okazji zmierzone i warte zapamiętania — **rig broni w dłoni zakłada, że
każda ikona jest narysowana tak samo**: oś 45°, rękojeść w prawym dolnym rogu
kafla. Sprawdzone dla wszystkich siedmiu broni: miecz, kij i włócznia mają oś
dokładnie 45° i rękojeść w (0,94, 0,91) kafla; toporek i siekiera odstają
(31,6° i 35,0°). Kod kotwiczy sprite w `PLAYER.swing.gripOrigin` = 0,78 i obraca
względem stałego `iconRestDeg` −135, więc **ikona narysowana pod innym kątem
będzie trzymana krzywo** — i nie ma na to pola per przedmiot.

⚠ Stąd druga konsekwencja: **`swingThrustPx` nie jest wolnym pokrętłem.**
Wysunięcie liczy się jako `sin(π·t) × swingThrustPx` wzdłuż kierunku ciosu,
a origin 0,78 jest już ~6,6 px przed prawdziwym końcem drzewca (0,94). Odstępy
się sumują, więc duża wartość odrywa broń od pięści w połowie zamachu —
zgłoszone jako *„przy ataku lewituje poza dłonią"* przy `swingThrustPx: 13`.
Praktyczny sufit to okolice 9–11 (młot ma 11). Różnicę „pchnięcie vs cięcie"
nieś przez `sweepMul` na wariancie, nie przez wysunięcie.

### ⭐⭐ Tarcze — MASTER SHIELD CONSTRUCTION STANDARD (2026-09-18, rewizja 3)

Sześć bazowych konstrukcji tarcz ma **jeden wzorzec graficzny**, z którego mają
wyrastać wszystkie przyszłe materiały (żelazo, stal), jakości (Q1–Q7) i warianty.
Generator: `tools/build_shield_icons.py` (przymiar, zapis pod `--zapisz`, test
redukcji pod `--snapper`). Wzorzec: `docs/art-review/shields-master.png` +
`shields-master/*.png`.

#### ⛔ Baza to SAME PIONOWE DESKI — i to jest decyzja, nie brak czasu

⭐⭐ **Każda z sześciu tarcz to deska przy desce, przycięta do kształtu
konstrukcji.** Bez umba, bez okuć, bez obrzeży, bez poziomych belek, bez
centralnych grzbietów, bez heraldyki, bez metalu. Różnica między tarczami
płynie **wyłącznie z kształtu, proporcji i światła**.

⛔ **Nie „uzupełniaj" tego z powrotem o historyczne detale.** Umbo, obrzeże,
wzmocnienie i metal są osiami WARIANTU (materiał / jakość / konstrukcja) i
dokładają się DO tej bryły. Baza ma być najczystszą reprezentacją swojej
konstrukcji, żeby wariant miał gdzie się pokazać. Rewizja 2 miała piastę
(puklerz, okrągła), poziomą belkę (legionowa) i pionowy grzbiet (pawęż) —
wszystkie trzy zdjęte świadomie 2026-09-18.

⚠ Lekcje z tamtego kodu, przydatne, **gdy wariant je przywróci**: umbo
progowane po promieniu przy r = 2 px wychodzi **rombem**, nie kołem · pełny łuk
cienia pod piastą 5 px czyta się jak **uśmiech** (twarz, nie wypukłość) · rampa
elementu przy `B:R = 0,60` czyta się jak **kamień** wciśnięty w deskę · piasta
jaśniejsza od oświetlonego lica pcha się na pierwszy plan.

#### Skala

⭐⭐ **Rozmiar ikony tarczy NIE jest decyzją estetyczną — wychodzi z jednej
skali świata: `0,44 px = 1 cm`.** Nowa konstrukcja dostaje rozmiar z tabliczki
mnożenia, nie z oka.

| konstrukcja | historycznie (wys × szer) | px | pole px | ×okrągła | desek | gabaryt |
|---|---|---|---|---|---|---|
| buckler / puklerz | 38 × 38 cm | **17 × 17** | 225 | 0,34 | 3 | 1×1 |
| round / okrągła | 66 × 66 cm | **29 × 29** | 665 | 1,00 | 5 | 1×1 |
| heater / rycerska | 68 × 62 cm | **29 × 27** | 619 | 0,93 | 5 | 1×1 |
| almond / migdałowa | 105 × 55 cm | **45 × 23** | 745 | 1,12 | 4 | **1×2** |
| scutum / legionowa | 106 × 57 cm | **47 × 25** | 1111 | 1,67 | 5 | **1×2** |
| pavise / pawęż | 112 × 48 cm | **49 × 21** | 963 | 1,45 | 4 | **1×2** |

#### ⭐⭐ Skala OPTYCZNA rodziny — cztery reguły, które trzymają ją w ryzach

⚠⚠ **Tarcza wypukła ma szerokość CIĘCIWY, nie ŁUKU.** Ikona jest widokiem
z przodu, a scutum i pawęż to wycinki walca: ich „szerokość" z tabel
historycznych bywa mierzona po łuku (Dura-Europos: łuk 86 cm, cięciwa 41 cm).
Legionowa stała przez to na 63 cm i dominowała nad całą rodziną (1,88×
okrągłej). Dziś 57 cm cięciwy → 1,67×. ⭐ **Reguła skali się nie ugięła —
poprawione zostało WEJŚCIE do niej**, i to jest jedyny dopuszczalny sposób
korygowania gabarytu. ⛔ Nie „dostrajaj" tu mnożnika 0,44 px/cm.

⚠⚠ **Szerokość DESKI jest w tym świecie stała (11–14 cm).** Większa tarcza ma
WIĘCEJ desek, nie szersze: 3 (puklerz) → 4 → 5 (okrągła, rycerska, legionowa).
To samo niesie skalę bez jednej dodatkowej linii kodu: liczba spoin mówi
o wielkości tarczy nawet wtedy, gdy stoi sama, bez sąsiadek do porównania.

⚠⚠ **Sylwetka 1×1 ma SUFIT 30 px i rycerska już w nim siedzi.** Przy 68 cm
wychodzi 29 px, więc „powiększenia" tarczy rycerskiej nie da się załatwić
wysokością — zostaje szerokość (56 → 62 cm) i **obniżenie tych dużych**.
⛔ Nie obchodź tego dając jej 1×2: gabaryt jest decyzją mechaniczną
(`docs/decyzje/2026-09-18-gabaryt-w-plecaku.md`), nie kompozycyjną.

⚠ **Wypełnienie ramki (fill) jest ukrytym mnożnikiem masy optycznej:**
prostokąt 94%, dysk 79%, migdał 72%. Dwie tarcze o tej samej ramce różnią się
przez to o jedną trzecią „ciężaru". Dlatego porównuj POWIERZCHNIĘ sylwetki
(kolumna wyżej), nie wymiary ramki — inaczej legionowa zawsze będzie wyglądała
na większą, niż wynika z liczb. Materiał do oceny: `shields-master-skala.png`
(master + same sylwetki + słupki powierzchni na jednej planszy).

⚠ **Pawęż przeszła 44 → 48 cm i to był świadomy handel.** Przy 44 cm deska
miała 11,0 cm, czyli sam skraj reguły, a sylwetka czytała się już jak deska,
nie jak tarcza. Przy 48 cm deska ma 12,0 cm (środek pasma), masa rośnie do
1,45× okrągłej — **kosztem podobieństwa do legionowej: IoU 0,70 → 0,81**
(próg asercji: 0,86). To, co je trzyma osobno, to dwie niezależne cechy:
szerokość 21 vs 25 px oraz geometria szczytu i spodu (łuk + płaska podstawa
vs wybrzuszony szczyt i spód). ⛔ Nie poszerzaj pawęży dalej — przy 52 cm
IoU dobija do 0,86 i tarcze zaczynają być jedną sylwetką w dwóch rozmiarach.

⚠ **32×32 to POLE, nie wymiar do wypełnienia.** Puklerz zajmuje 22% swojego
kafla i tak ma być — to on niesie komunikat „mały przedmiot". Gradacja powierzchni
w rodzinie: **0,34 → 0,93 → 1,00 → 1,12 → 1,45 → 1,67**, czyli żadna tarcza nie
przeskakuje o całą klasę wielkości bez powodu.

⚠ **Migdałowa dostała 1×2 Z POMIARU, nie z gustu.** Przy skali rodziny nawet
najkrótszy historyczny wariant (75 cm) to 33 px, a w 1×1 mieści się 30.

#### ⭐⭐ Paleta: NIE jest paletą tarcz — jest standardem DREWNA `tools/wood_palette.py`

⛔ **Kolory nie mieszkają w generatorze tarcz.** Mieszkają w osobnym module,
bo to samo drewno ma nieść rękojeści mieczy, trzonki toporów, styliska młotów,
pałki, drzewce włóczni, widły, łuki, kusze, skrzynie, beczki i meble. Import
zamiast własnych brązów:

```python
from wood_palette import RAMPA, ton, KONTUR, DROBNE
```

⛔ **Nie dopisuj brązu „tylko dla tego przedmiotu"** — od tego zaczyna się
dwadzieścia mikro-palet zamiast jednego materiału. Potrzebny inny gatunek
drewna? To osobna, świadoma oś (jak `material` w pancerzu), nie kolor dorzucony
przy okazji jednej ikony.

| element standardu | ile | funkcja |
|---|---|---|
| `RAMPA[0..11]` | 12 | kręgosłup materiału: cień → baza → światło |
| słój cieplejszy / chłodniejszy | 16 | ta sama jasność, inna barwa — **tylko stopnie 3–10** |
| `KONTUR` | 1 | obwódka całego ekwipunku |
| **razem** | **29** | budżet 40 |

⚠⚠ **Górna granica pasma słoja (D10) to POMIAR, nie symetria.** D10 był
**największą jednolitą plamą całej rodziny: 591 px = 15,7% lica w jednym
kolorze**, i to po stronie oświetlonej, gdzie materiał czyta się najmocniej.
Po dołożeniu wariantów plama spada do 163 px, a 428 px (11,3% lica) dostaje
zróżnicowanie deska-po-desce. ⛔ **D11 wariantów NIE dostaje** i to też jest
pomiar: na tarczach niosłyby 2,9% (cienki kant), a na próbce dziewięciu
przedmiotów spoza tarcz — **zero pikseli**. Kolor bezużyteczny poza jednym
rodzajem przedmiotu nie należy do standardu materiału.

⚠ **Standard sprawdza się na przedmiotach, dla których powstał** —
`python tools/wood_palette.py --probka` rysuje rękojeść, stylisko, trzonek,
drzewce, pałkę, beczkę, skrzynię, wieko i blat, po czym raportuje, które tony
na nich pracują (dziś **24 z 29**). ⚠ W próbce muszą być DUŻE oświetlone lica
(wieko, blat): zestaw z samych cienkich przedmiotów fałszywie uznałby górne
szczeble za „kolor tylko dla tarczy" — rękojeść nigdy tam nie sięgnie.

⚠⚠ **Słój istnieje tylko tam, gdzie oko go widzi — to pomiar, nie oszczędność.**
W wersji z wariantami na wszystkich szczeblach jedenaście kolorów niosło łącznie
**0,26% pikseli rodziny** (skrajne warianty po 2–6 pikseli). Odcień
prawie-czerni i prawie-bieli jest nierozróżnialny. **W cieniu i w świetle
drewno różni się jasnością, nie barwą.**

⚠⚠ **DRYF BARWY WZDŁUŻ RAMPY MUSI BYĆ MAŁY — inaczej różnica WARTOŚCI czyta się
jako różnica GATUNKU.** Kosztowało to osobne zgłoszenie („legionowa
żółto-pomarańczowa, pawęż spłowiała"): przy G:R 0,615 → 0,700 tarcza sięgająca
częściej po górne szczeble stawała się optycznie **innym drewnem**.

⭐⭐ **Rampa jest liczona na trzech osiach, przy stałej jasności:**

| oś | wartość | powód |
|---|---|---|
| **jasność** | 30 → 150, geometrycznie (×1,15/szczebel) | niesie formę; ⛔ nie ruszaj jej przy poprawkach koloru |
| **nasycenie** | **0,64 na dole → 0,45 na szczycie** | ⚠⚠ lekarstwo na **żółto-morelowe drewno** |
| **odcień** | **24,5° → 22°** w górnej połowie | morela to żółto-pomarańczowy, więc światło odchyla się ku czerwieni |

⚠⚠ **Brąz o nasyceniu 0,55 przy jasności 150 przestaje być drewnem i staje się
MORELĄ.** W cieniu jest odwrotnie — ciemny ton musi zostać nasycony, inaczej
robi się szary muł. Stąd nasycenie **maleje ku górze**, a nie jest stałe.
Zmierzone na licu: jasne partie (jasność > 100) miały nasycenie **0,580 przy
odcieniu 25,0°**, dziś **0,514 przy 22,7°**.
⛔ **Nie schodź odcieniem do 20°** — sprawdzone renderem, całość ucieka w mahoń,
czyli dokładnie tam, skąd wyszliśmy, odrzucając rampę z `items.png`.
⚠ Warianty słoja też zostały **osłabione** (ciepły z R×1,06/B×0,90 na
R×1,035/B×0,945), bo mnożyły nasycenie na szczycie rampy: `D10c` miało 0,625 —
najbardziej nasycony jasny ton w całej palecie i główne źródło moreli.

⚠ **Rampa ma 12 stopni (skok 1,15–1,17×).** Przeszła 13 → 10 → 12: przy 10
przejścia na dużej płaszczyźnie bandowały, przy 13 skrajne cztery szczeble były
martwe. Dwanaście trafia w oba warunki. ⚠ Liczba kolorów **nie jest celem** —
23 nie było sukcesem, a 29 nie jest porażką; liczy się, że każdy ton ma zadanie.

⚠⚠ **Amplitudy cieniowania są w SZCZEBLACH, więc zależą od gęstości rampy.**
`SKALA = (liczba przedziałów) / 12` — przy każdej zmianie gęstości standardu
przelicza się je tym ułamkiem, inaczej „−3,4 szczebla" na spoinie znaczy inną
jasność. ⚠ **Baza trzyma JASNOŚĆ, nie numer szczebla** (dziś `BAZA = 7,0`,
czyli jasność ~83): naiwne przeliczenie numeru dało już raz rodzinę o 15%
ciemniejszą od zaakceptowanego renderu.

**Zmierzone współdzielenie** (plansza `shields-master-paleta.png`):

| | kolorów | % pikseli rodziny |
|---|---|---|
| we **wszystkich sześciu** tarczach | **13** | **87,1%** |
| w czterech–pięciu | 7 | 12,0% |
| w dwóch–trzech | 4 | 0,7% |
| tylko w jednej | 1 | 0,2% |

⭐⭐ **Standard jest słownikiem, tarcza jest zdaniem.** Rodzina używa 25 z 29
tonów, pojedyncza tarcza **17–23**, a cztery tony standardu (`D3c`, `D8z`,
`D9z`, `D10z`) nie pojawiają się na żadnej tarczy i **tak ma być** — pracują na
próbce beczki, wieka i blatu. ⛔ Nie „domykaj" tego wymuszając użycie całej
palety na każdej ikonie; to jest dokładnie ta droga, która prowadzi do
patchworku.

⚠ **Na cienkim elemencie (trzonek, drzewce, łuk — 2–4 px) bierz co trzeci
szczebel** (`DROBNE` = 2/5/8/10) i **nie używaj słojów**: przy jednym pikselu na
ton różnica sąsiednich szczebli ginie, a barwa per deska nie ma czego
różnicować. Słoje są dla dużych płaszczyzn.

⚠ **Wzory desek są WYŚRODKOWANE** (`DESKI_WZOR`, deska w osi neutralna) —
przy wzorze „po kolei" środkowa deska czytała się jak doklejony centralny pas.

⚠⚠ **DESKA CIEPŁA NIGDY NIE SĄSIADUJE Z CHŁODNĄ.** To jest najważniejsza reguła
mapowania i kosztowała osobne zgłoszenie: *„widzę deskę żółto-pomarańczową obok
kremowo-orzechowej, to wygląda jak kilka gatunków drewna"*. Sąsiedztwo
ciepła↔chłodna to **największy możliwy skok barwy w standardzie** (B:R ×0,85
obok ×1,17), a miał go wzór czterodeskowy — czyli dokładnie pawęż i migdałowa,
które w pomiarze wyszły z **największym rozrzutem barwy w rodzinie**
(±0,061 i ±0,058 B:R wobec ±0,040 puklerza).

Dziś: **najwyżej dwie deski w tarczy mają słój**, leżą po przeciwnych brzegach
(ciepła od strony światła, chłodna od strony cienia — zgodnie z padaniem
światła), a między nimi są wyłącznie neutralne. Rozrzut barwy spadł o **45–56%**
(pawęż ±0,061 → ±0,033, migdałowa ±0,058 → ±0,025), a udział tonów wspólnych dla
całej szóstki wzrósł z 67% do **87% pikseli**.

⭐ **Kolejność ważności, od której zaczyna się każda decyzja o kolorze:**
1. wartość (światło–cień) · 2. czytelność konstrukcji · 3. materiał ·
4. subtelna temperatura · 5. indywidualne różnice desek. ⛔ Nigdy odwrotnie.
⚠⚠ **Różnica między deskami idzie przez WARTOŚĆ, temperatura tylko ją
doprawia** (offset jasności ≤ 0,35 szczebla). Deska jaśniejsza o cały szczebel
obok ciemniejszej to zebra; deska o innej barwie obok innej barwy to patchwork.

#### Co złapał wyłącznie render i test redukcji

⚠ **Rewizja 1 stała na drewnie z `items.png` (`115,51,23`, R:G = 1:0,44) w
siedmiu tonach i czytała się jak rdzawa terakota w pasy.** Rampa idzie dziś
linią `forrest.png` (R:G:B ≈ 1 : 0,62–0,70 : 0,31–0,41) — to jest barwa drewna
w tym świecie. ⛔ Nie wracaj do rampy `items.png` „dla spójności ze starymi ikonami":
stare ikony tarcz są 4-tonowe i to one odstają, nie ta rodzina.

⚠ **Kontur musi mieć ZAPAS jasności do najciemniejszego drewna — minimum ×2,00**
(dziś `14,9,5` vs `40,26,15`, czyli ×2,88). Przy `20,13,8` median cut na sześciu
kolorach skleja je i tarcza traci obwódkę. ⚠ Sam test `--snapper` tego **nie
pilnował** (sylwetka zostawała nietknięta, więc świecił na zielono przy zepsutej
palecie) — regułą jest zapas jasności i to on ma asercję.

⚠ **Sylwetka po redukcji to za mało.** Tarcza może przetrwać snapper jako
jednolita plama i dalej „zdać". Dlatego generator liczy osobno **granice
tonalne w wierszu przez środek**, przed i po redukcji: deski są tu połową
tożsamości przedmiotu.

⚠ Pozostałe pułapki złapane na renderze: wykładnik zbieżności (1,5 / 0,5) dał
rycerską kończącą się na 5 px i w samej sylwetce czytającą się jak **U** (dziś
2,2 / 0,7, koniec na 3 px) · migdałowa z prostym odcinkiem pełnej szerokości
czytała się jak **jajko/kropla** — migdał nie ma prostej, ma jeden ciągły łuk ·
spoiny liczone jako `w*i/deski` przy 15 px stoją o piksel obok środka i tarcza
wygląda na krzywą.

⚠⚠ **TEN SAM MATERIAŁ TO TEN SAM ZAKRES DYNAMIKI, nie ta sama średnia barwa.**
Zgłoszenie „legionowa i pawęż wyglądają jak dwa gatunki drewna" okazało się
w pomiarze **nie mieć nic wspólnego z barwą**: średnie G:R obu tarcz różniło
się o 0,004. Różnił je zakres — rozrzut 2,20 vs 1,81 szczebla i 26% vs 16%
pikseli w górnych szczeblach. Tarcza siedząca w środku rampy czyta się jako
spłowiały, inny gatunek. Pilnuje tego dziś asercja (`rozrzut max/min ≤ 1,25`,
`udział górnych szczebli max/min ≤ 1,80`, `odchylenie średniego szczebla ≤ 0,7`),
sprawdzona na czerwono przez spłaszczenie światła pawęży.
⛔ **Nie naprawiaj takiego zgłoszenia kolorem per tarcza** — to jest wada
MAPOWANIA światła, a nie palety.

⚠ **Rysowane NATYWNIE w 32×32 / 32×64**, alfa 0/255, zero AA. Konsekwencja:
master jest już „po redukcji" — median cut do 16/10/6 kolorów zostawia sylwetkę
nietkniętą dla wszystkich sześciu, a deski czytelne do końca.

### Arkusze kafli (siatka 32 px, skok 33 px, 19 kolumn — `forrest.png` wyjątek: skok 32)

| plik | rola | stan |
|---|---|---|
| **`Teren.png`** 640×395 | **powierzchnie** — po czym się chodzi. Zawsze kryjący. | ✅ nowy, kompletny |
| **`Nature.png`** 640×593 | **obiekty** — co stoi na ziemi. Zawsze z przezroczystością. | ✅ nowy |
| **`forrest.png`** 608×320 | **drzewa lasu** — 31 stempli AI, tileset `Forrest`, **skok 32 / spacing 0**. Patrz „`forrest.png`" niżej. | ✅ 2026-08-28 |
| **`tree_stamps.png`** 768×384 | **edytorowy** repack `forrest.png` — 1 drzewo / komórkę 96×96, tileset `TreeStamps`. Drzewa jako tile-objecty w Tiled. Patrz „`tree_stamps.png`" niżej. | ✅ 2026-08-29 (prototyp) |
| **`Buildings.png`** 640×263 | **budynki** — komplet modułowy, tileset `Buildings` | ✅ nowy, generowany |
| `Indoor.png` | wnętrza, **nieużywany**, nieprzeanalizowany | ⏳ |

⚠ **Wysokości `Nature.png` i `Buildings.png` poprawione 2026-08-26 — zmierzone
z nagłówków PNG, nie przepisane.** Stały tu 640×230 i 640×197, czyli stan sprzed
rozbudowy arkuszy; `docs/assety.md` niósł trzecią liczbę (640×230 dla obu).
Żadna z nich nie wpływała na kod — cięcie klatek idzie ze stałych, nie z tych
wartości — ale to są liczby, po które sięga się przy liczeniu wierszy.
**Po każdym `--od-zera` na generatorze zmierz je ponownie.**

Podział Teren/Nature jest **roboczy, nie estetyczny**: komplet obszarowy ma
47 kafli i będzie rósł. Gdyby siedział razem z propami, każde powiększenie
terenu przesuwałoby drzewa i psuło mapę.

### Układ `Teren.png`

| wiersz | zawartość | id |
|---|---|---|
| 0 | materiały bazowe: trawa ×6 (od czystej do bardzo gęstej), ziemia, piasek, kamień, woda, listowie | 0–15 |
| 1–3 | **ścieżka** — komplet obszarowy 47 | 19–65 |
| 4–6 | **woda** — komplet obszarowy 47 | 76–122 |
| 7–9 | **piasek** — komplet obszarowy 47 | 133–179 |

### Układ `Nature.png`

| wiersz | zawartość | id |
|---|---|---|
| 0 | kępki trawy jako propy | 0–18 |
| 1 | krzaki, pięć wielkości, z cieniem kontaktowym | 19–26 |
| 2–4 | **drzewa duże** — dokładnie 19 kolumn | 38–94 |
| 5–6 | **średnie 2×2** (kol. 0–9) i **małe 1×2** (kol. 10–14) | 95–128 |
| 7–10 | **drzewa owocowe, przebieg 1** (`tools/build_drzewa_owocowe.py`) — jabłoń duża 2×3 (kol. 0–1, id **133**), śliwa duża 3×3 (kol. 2–4, id **135**), grusza duża 3×4 (kol. 5–7, id **138**) | 133–208 |
| 11–17 | **drzewa owocowe, przebieg 2 — warianty wielkości** (ten sam skrypt, materiał z katalogu `assets`, nie tylko ChatGPT) — 8 kolejnych sprite'ów, patrz tabela niżej | 209–342 |

Arkusz ma **640×593** (18 wierszy). Dokładanie wierszy nie rusza żadnego
istniejącego id — poszerzenie w bok przenumerowałoby wszystko.

**Katalog drzew owocowych (`tools/build_drzewa_owocowe.py`, stała `UKLAD`)**

| gatunek | duży | duży(2) | średni | mały | młody |
|---|---|---|---|---|---|
| jabłoń | 2×3, **133** | 4×4, **209** | 2×2, **213** | 2×2, **216** | 2×1, **219** |
| śliwa | 3×3, **135** | — | 3×3, **222** | 2×2, **225** | — |
| grusza | 3×4, **138** | — | 2×3, **285** | 2×2, **257** | — |

Podane id to lewy górny kafel. `grusza_mala` (2×2, id 257) siedzi w dziurze
pod `jablon_mloda` (kol. 10–11, wiersz 13–14) zamiast otwierać nowy blok.

⚠ **Dwie pułapki złapane w drugim przebiegu, obie warte znajomości:**
- **Martwa alfa.** `apple-medium/medium2/01-pixel-snapper.png` miały
  alfa min==max==255 — czarne tło namalowane w pikselach, nie w
  przezroczystości (dokładnie pułapka z `ZADANIE_drzewa.md`). Bez
  kluczowania 89% korony wyszło jako najciemniejszy stopień `kora` —
  złapane na liczbie (89% pikseli = `#000000`), potwierdzone na renderze
  (trzy ciemne kwadraty zamiast drzew). Naprawa: `alfa_bez_czerni()`,
  flood-fill od krawędzi kanwy, ta sama technika co usuwanie zielonego
  ekranu w `build_gniewko.py`/`build_hanna.py`.
- **Wyspa.** `apple-big-pixel-snapper.png` miał 10px biały zawijas 17px od
  korony — żaden test liczbowy (paleta, kontrast, margines) go nie łapał,
  tylko test spójności sprite'a (2 części zamiast 1). Naprawa:
  `usun_wysepki()` (import z `build_drzewa.py`), min_px=12.
- **Materiał odrzucony**: `gpt-pear-tree-young.png` (pierwsza wersja) —
  52 685 kolorów, białe OPAKOWE tło, 1231×1278 — ten sam błąd jakości co
  `height32_trees_mega_pack.png`. Autor podmienił na
  `gpt-pear-tree-young-pixel-snapper.png` (72×76, 43 kolory, alfa
  realna), które przeszło bramkę czysto.

Czwarta rodzina barw doszła do palety przy okazji gruszy: **`akcent_zlocisty`**
(`tools/gen_palette.py`, 2026-08-18) — żadna istniejąca rampa nie pasowała do
złota owoców (najbliższa, `piasek`, dawała dystans 32+). Parametry dobrane
przemieceniem siatki pod zmierzone kolory źródła, średni dystans 20,7.

### Katalog drzew (`tools/build_drzewa.py`, stała `DRZEWA`)

| gatunek | mały 1×2 | średni 2×2 | duży | drugi duży |
|---|---|---|---|---|
| dąb | 105 | 95 | 3×3, **38** | 3×3 **rozwidlony**, 41 |
| świerk | 106 | 97 | 2×3, **47** | 2×3 **leśny**, 49 |
| brzoza | 107 | 99 | 2×3, **51** | 2×3 **kępa dwupienna**, 53 |
| buk | 108 | 101 | 3×3, **44** | — |
| grab | 109 | 103 | 2×3, **55** | — |

Podane id to **lewy górny kafel** propu; resztę Tiled dobiera sam przy
zaznaczeniu prostokąta. `sprawdz_kolizje()` w generatorze pilnuje, żeby żaden
prop nie nachodził na drugi ani nie wyszedł poza 19 kolumn.

**Tabela `DRZEWA` jest kontraktem z mapą.** Przesunięcie wpisu przenumerowuje
id i mapa zaczyna rysować połówki innych drzew — cicho, bo bezsensowny układ
kafli niczego nie zgłasza. Układ przełożono na czysto tylko dlatego, że mapa
i tak powstaje od nowa.

⚠ **Od 2026-08-28 mapa lasu NIE używa już tych kafli.** `forrest.tmj` (obie
kopie) ma warstwy `trees-base`/`trees-over` przepięte na nowy arkusz
`forrest.png` (patrz niżej). Kafle drzew w `Nature.png` zostają fizycznie na
miejscu (id 38–128) jako materiał `Nature` dla Zagajów/Gęstwiny i jako historia
— ale w lesie są martwe. `build_drzewa.py` dalej je opisuje.

### `forrest.png` — arkusz drzew lasu (`tools/build_forrest_atlas.py`)

**608×320, tileset `Forrest`, firstgid 530, `spacing 0 / margin 0 / pitch 32`**
(jedyny arkusz bez 1 px luzu — świadomie, dla tego przejścia). 31 zaakceptowanych
stempli AI z `docs/art-review/trees/`, składane 1:1 bez skalowania; alfa
wymuszana do 0/255 na wejściu generatora.

| gatunek | duże (2×3, o ile nie zazn.) | średnie 2×2 | małe 1×2 |
|---|---|---|---|
| dąb | `dab_duzy_new` **3×3** gid 530, `dab_duzy2_new` **3×3** gid 533 | `dab_sredni_new` 644 | `dab_maly_new` 682 |
| buk | `buk_duzy_new` **3×3** gid 536 | `buk_sredni_new` 646 | `buk_maly_new` 683 |
| świerk | `swierk_duzy_new` 539, `_duzy2_new` 541, `_duzy3_new` 543 | `swierk_sredni_new` 648 | `swierk_maly_new` 684, `_maly2_new` 685 |
| brzoza | `brzoza_duza_new` 545, `_duza2_new` 547, `_duza3_new` 587 | `brzoza_srednia_new` 650, `_srednia2_new` 652 | `brzoza_mala_new` 686 |
| grab | `grab_duzy_new` 589, `_duzy2_new` 591, `_duzy3_new` 593 | `grab_sredni_new` 654, `_sredni2_new` 656 | `grab_maly_new` 687 |
| olcha | `olcha_duza_new` 595, `_duza2_new` 597, `_duza3_new` 599 | `olcha_srednia_new` 658, `_srednia2_new` 660 | `olcha_mala_new` 688 |

Podane gid to **lewy górny kafel**; pełne podkafle + tabela remapu `Nature`→
`Forrest` + 28 skrzynek kolizji są w `docs/forrest_atlas.json`.

⚠ **Warianty, których dzisiejsza mapa nie używa** (`*_duzy3`, `swierk_maly2`,
`*_srednia2`, cała **olcha**) są w arkuszu celowo — do ręcznego sadzenia
w Tiled. Nie mają jeszcze żadnego kafla na mapie i żadnej skrzynki kolizji.

⚠ **`Forrest` łączy się po NAZWIE** (`TILESET_TEXTURES`, dwie pisownie
`Forrest`/`forrest`) — nie po ścieżce w `.tmj`. `ASSETS.forrest` +
`load.image` w `queueImages` + wpis w `TILESET_TEXTURES` = trzy miejsca,
tak jak przy `Teren`.

### `tree_stamps.png` — edytorowy repack `forrest.png` (`tools/build_tree_stamps.py`, 2026-08-29)

**768×384, tileset `TreeStamps`, `spacing 0 / margin 0`, komórka 96×96, 8 kolumn,
kolejność == `FOREST_SPRITES` / `docs/forrest_atlas.json`.** Każdy z 31
wariantów wycięty z `forrest.png` **bez zmiany pikseli** i wklejony do jednej
komórki 96×96 (= największe drzewo, `dab_duzy` 3×3), **dosunięty do DOŁU
i wyśrodkowany w poziomie**.

Po co drugi arkusz: `forrest.png` zostaje arkuszem RENDEROWYM warstw
`trees-base`/`trees-over`; `tree_stamps.png` jest **dla edytora** — w Tiled
drzewo stawia się jako pojedynczy *tile object* (widać cały obraz, swobodny
overlap, drag/delete). W grze `src/world/TreeLayer.ts` renderuje **wprost z tego
arkusza**: dolny pas 32 px komórki = pień (`DEPTH.entities + y`), reszta
96×64 = korona (`DEPTH.overhead`). Kotwica = `object.y` (Tiled tile-object ma
origin w lewym-dolnym rogu). Pełny opis: `docs/tree_instances.md`.

⚠ **`TreeStamps` łączy się po NAZWIE** — `ASSETS.treeStamps` (`tree-stamps`) +
`load.image` + `TILESET_TEXTURES["TreeStamps"]` (dwie pisownie), jak `Forrest`.

⚠ **Pudełka kolizji pnia** (`TreeStampManifest.ts`, GENEROWANE) są wyprowadzone
z `docs/forrest_atlas.json` → `kolizja_tiles`: 18 z 31 wariantów ma zmierzone
pudełko, 13 (m.in. cała **olcha**, `*_duzy3`, `*_srednia2`) dostaje awaryjne
16×14 px na środku podstawy — do zmierzenia, gdy wejdą na mapę.

⚠ **`tree_proto.tmj`** (`public/assets/maps/`, mapId `treeproto`) to DEV-owa
mapa testowa systemu, ładowana tylko w dev-buildzie. `window.dev.treeProto.load()`.

**Drugi duży wariant to inna SYLWETKA, nie inne ziarno.** Przekręcenie ziarna
daje ten sam kształt w innym rozsypie kęp i weryfikacja słusznie uzna to za
jedno drzewo. Dlatego dąb rozwidlony ma koronę rozdzieloną na dwie masy
i widlasty pień, świerk leśny jest węższy, wyższy i ma goły dół pnia, a brzoza
rośnie kępą z dwóch pni z jednej szyi korzeniowej.

### Czym gatunki różnią się między sobą

Kolor to za mało — weryfikacja porównuje sylwetki i słusznie nie przepuściłaby
dwóch drzew różniących się samą rampą. Każdy gatunek ma cechę, po której da się
go poznać **nawet gdy korona zejdzie z ekranu**:

| gatunek | rampa korony | cecha rozpoznawcza |
|---|---|---|
| dąb | `korona` | ciemna, bruzdowana kora, nabieg korzeniowy, szeroka lobowana korona |
| buk | `korona` | **gładki, jasny pień** (rampa `kora` w zakresie 2–4), korona wyższa niż szersza i gładko obrysowana |
| brzoza | `korona` | **biały pień** z poziomymi kreskami, ażurowa korona z dziurami |
| świerk | `listowie` | **stożek** z piętrami, ząbkowany obrys |
| grab | `listowie` | **krzywy pień**, zwarty ciemny owal |

Świerk i grab dzielą rampę, dąb, buk i brzoza dzielą rampę — rozróżnia je
wyłącznie kształt. To jest zamierzone i to jest właśnie test, który generator
uruchamia przy każdym przebiegu.

### ⚠ Gdzie w dolnym rzędzie (`trees-base`) faktycznie siedzi pień — zmierzone 2026-08-27 (Faza 1B, kolizja)

Zanim las dostał kolizję, nikt nie musiał wiedzieć, gdzie dokładnie w 32×32
kaflu leży pień pod koroną. Skrzynka kolizji ma trafiać w pień, nie w całą
komórkę (`src/world/CLAUDE.md`), więc to jest teraz źródło prawdy o pikselach
dla każdego przyszłego stempla drzewa:

- **Drzewa 1-kaflowe** (`*_maly`, id 105–109 → dolny rząd 353–357): pień
  w przybliżeniu wyśrodkowany, ale **nie u każdego gatunku prosto** — `grab_maly`
  wychyla się w prawo u podstawy (korzenie rozlane szerzej niż u `dab_maly`).
  Box **musi być trochę szerszy niż "na oko środek"**, żeby złapać oba warianty:
  `x=9, y=19, w=14, h=13` (w lokalnych pikselach kafla).
- **Drzewa 2-kaflowe** (`*_duzy`/`*_duzy2` 2×3 i `*_sredni` 2×2): pień stoi
  **dokładnie na szwie między dwoma kaflami**, symetrycznie — sprawdzone na
  `swierk_duzy`, `grab_duzy`, `brzoza_duza`, `buk_sredni`. Lewy kafel pary
  dostaje box przy swojej PRAWEJ krawędzi, prawy kafel przy swojej LEWEJ:
  `{x:24,y:19,w:8,h:13}` / `{x:0,y:19,w:8,h:13}` — razem dają 16 px pnia
  wyśrodkowanego na granicy kafli.
- **Drzewa 3-kaflowe** (`dab_duzy`, `dab_duzy2`, `buk_duzy`, 3×3): pień
  siedzi **wyłącznie w ŚRODKOWYM kaflu** — sprawdzone na `dab_duzy` i
  `dab_duzy2`. Lewy i prawy kafel dolnego rzędu są w tym miejscu **puste**
  (sam cień kontaktowy/korzenie na przezroczystości), więc dostają zero
  kolizji, nie mniejszy box. Środkowy kafel: `{x:8,y:17,w:16,h:15}`
  (podstawa pnia rozszerza się ku dołowi — stąd trochę szersza i niższa
  skrzynka niż u drzew 2-kaflowych).

Reguła nie została zweryfikowana per-gatunek dla WSZYSTKICH pięciu gatunków
w każdej klasie szerokości (spot-check: dąb, buk, świerk, brzoza, grab —
po jednym-dwóch na klasę), ale artysta trzyma tę samą siatkę bazową dla
całej rodziny, więc uogólnienie po SZEROKOŚCI stempla (1/2/3 kafle), a nie
po gatunku, jest tym, co faktycznie zaimplementowano.

⚠ **Od 2026-08-28 te 28 skrzynek żyją na tilesecie `Forrest`, nie `Nature`.**
Przy przepięciu mapy na `forrest.png` przeniesiono je **1:1** (te same piksele
`x/y/w/h`) na odpowiadający podkafel nowego drzewa — decyzja autora: footprint
kolizji bez zmian, mimo że dolne rzędy nowych stempli bywają szersze niż stary
wąski pień (`swierk_duzy_new`, `olcha_duza_new`, `dab_duzy_new` kryją pełną
szerokość kafla). **Dostrojenie boxów do pikseli nowych stempli jest odłożone
i wpięte w otwartą decyzję o „standardzie prześwitu"** (`PROJECT_CHECKPOINT_RESUME.md`
§5). Kopia skrzynek dalej stoi na `Nature` (martwa). Mapowanie:
`docs/forrest_atlas.json` klucz `kolizja_tiles`.

### Układ `Buildings.png` (`tools/build_budynki.py`) — KOMPLET MODUŁOWY

**96 kafli w 8 wierszach** (640×263), dwa materiały ścian (bale, deski) i dwa
kształty dachu z trzciny: **kalenicowy prostokątny** i **szczytowy /\**.
Katalog kafli i wymiary arkusza są w `docs/budynki.json`; mapa czyta ten plik,
a nie importuje generatora.

| blok | wiersz / kolumny | zawartość |
|---|---|---|
| ściana z bali | 0, kol. 0–2 | 3×3: góra / środek / fundament, kolumna lewa i prawa z zamkami |
| dach kalenicowy | 0–2, kol. 3–5 | 3×3: kalenica / połać / okap, kolumna lewa i prawa z zawiniętą krawędzią |
| nakładki | 0–1, kol. 6–11 | drzwi (1×2), okno, okno bez okiennic, komin (1×2), wrota (2×2) |
| warianty ściany | 1, kol. 12–16 | drugi/trzeci kafel ściany i połaci — przeciw kracie |
| **dach szczytowy /\\** | 3 i 6 | pas ma **co najmniej** 3 wiersze (więcej dla szerszych budynków — patrz niżej) i **każdy wiersz to inny kafel**: szczyt / szczyt\_kal / szczyt\_dół (przy osi), skos / połać\_kal / połać\_okp (środek), skos / kon\_połać\_kal / kon\_połać\_okp (koniec ramienia), pod nimi okap ukośny i podokap; do tego gładka połać, komin dolny i górny, oraz dwa wypełniacze dodatkowych wierszy: `kon_polac` (brzeg, bez naroża) i `szczyt_fill` (belka bez czoła) |
| **ściana z desek** | 4, kol. 0–9 | 3×3 (góra / środek / dół) + wariant środka |
| **otwarty front** | 4, kol. 10–11 | wiata (przęsło) + słup nośny z zastrzałem |
| **płot żerdziowy** | 4, kol. 12–14 | słupek lewy / przęsło / słupek prawy — nakładka na trawę |
| **nakładki gospodarcze** | 5, kol. 0–4 | okienko poddasza, otwór na siano, kurza klapa z trapem, drzwi połówkowe (1×2) |
| **rekwizyty** | 5, kol. 5–9 | stóg siana (2×2), koryto |
| **przybudówka** | 7, kol. 4–6 | styk dachu pulpitowego ze ścianą (lewy / środek / prawy) |
| **kosz (dolina)** | 7, kol. 7–8 | `dolina_skos` L/P — rzuty L / T / U, patrz niżej |
| *(doklejone z zewnątrz)* | 7, kol. 0, 1, 3 | `lawka_l`, `lawka_p`, `barrel_0` — **nie z tego generatora** |

**Dach /\\ to SZEWRON, a nie wypełniony trójkąt** — i to jest jedyna rzecz,
którą trzeba tu zrozumieć, bo pierwsze podejście zrobiło dokładnie to drugie
i zostało odrzucone. Prawdziwy dach dwuspadowy ma **stałą grubość**: kalenica
biegnie po jego górnej krawędzi, okap po dolnej, obie ukosem i równolegle,
a **między ramionami widać ścianę szczytową** z okienkiem poddasza. Wypełniony
trójkąt tę ścianę zjada i budynek traci piętro, które w każdej referencji jest
jego główną cechą.

Trzy konsekwencje geometrii, każda wymuszona, nie wybrana:

1. **Szerokość budynku pod dachem /\\ musi być PARZYSTA.** Kalenica siedzi na
   granicy kafli, więc przekątne 45° trafiają dokładnie w rogi kafli. Przy
   nieparzystej szerokości wierzchołek wypada w połowie kafla i każda krawędź
   dachu robi schodek na granicy wiersza.
2. **Dach szczytowy jest WARSTWĄ NAD ścianą** (`buildings-over`), a nie
   warstwą obok niej: ramiona zachodzą na górne rogi ściany, a między
   ramionami ściana ma być widoczna. Ściana zaczyna się w wierszu `lico`
   i musi mieć co najmniej `szer/2 + 1` wierszy, inaczej ramię wisi nad
   trawą zamiast nad ścianą.
3. **Kursy trzciny biegną RÓWNOLEGLE DO OKAPU, czyli ukosem.** Poziome kursy
   na ukośnym pasie czytają się jak płachta narzucona na dach: krawędź idzie
   w jedną stronę, faktura w drugą. Okres kursu to 16 px (a nie 8), bo 16
   dzieli 32 — ta sama zasada co „wszystkie okresy dzielą 32", przełożona na
   ukos. Okres 12 dawałby ładniejszą grubość kursu, ale 32 % 12 ≠ 0 i kursy
   rozjeżdżałyby się na każdej granicy kafla.

**Cała wieś jest kryta trzciną.** Jedna z iteracji przemalowała połać dachu /\
na dyle, biorąc materiał referencyjny za wzornik poszycia — a służył on za
wzornik KSZTAŁTU. Drewniana jest tylko belka kalenicowa w szczycie.

Cztery detale dachu /\\ okupione nieudaną iteracją, wszystkie widoczne dopiero
na złożonym budynku:

- **Oba końce belki kalenicowej były zgłaszane jako urwane i każdy wymaga
  innego rozwiązania.** Dół: okrągła TARCZA przeciętego drewna („kalenica
  wygląda, jakby była zrobiona w połowie") — czoło siedzi dokładnie na granicy
  dwóch kafli i każdy rysuje swoją połowę ze **środkiem ułamkowym**, bo przy
  całkowitym obie połówki wychodzą przesunięte o piksel i tarcza pęka wzdłuż
  osi. To trzecie użycie tego kształtu w arkuszu (zamek w narożniku ściany,
  czoło płatwi pod okapem) i stąd działa: budynek z bali kończy KAŻDĄ kłodę
  tarczą. Góra: belka **zwęża się ku wierzchołkowi**, od 2 px w szczycie do
  pełnych 10 px osiem wierszy niżej („kalenica na końcu jest urwana nagle").
  Wersja z płaskim początkiem na stałej wysokości dawała poziome cięcie
  w poprzek szczytu, a wersja bez zwężenia wypełniała cały klin i czytała się
  jak maszt — zwężenie załatwia jedno i drugie naraz.
- **Faza fali kursów jest STAŁA, nie losowana per kafel.** Kurs biegnie przez
  całą połać, więc jego granica musi być ciągła przez granicę kafli; przy
  losowej fazie dach łamał się na każdym styku, a najlepiej było to widać
  wokół komina (jego kafel ma własne tło) jako prostokątną łatę.
  Konsekwencja: **połać ma jeden kafel, bez wariantów** — krata nie ma z czego
  powstać, bo rysunek jest liczony z położenia globalnego, więc granicy kafla
  po prostu nie widać. Dołożenie wariantu WPROWADZIŁOBY szew, a nie usunęło.
  Z tego samego powodu źdźbła są liczone deterministycznie z `u` i parzystości
  numeru kursu — jedynych wielkości ciągłych przez granicę kafla.
- **Pod strzępami okapu musi być cień, a nie przezroczystość** — ta sama
  zasada co przy okapie poziomym, tylko że cień idzie ukosem. Bez niego między
  dachem a ścianą szczytową świeci pas trawy.
- **KAŻDY pas rysowany wzdłuż przekątnej wychodzi poza kafel, który tę
  przekątną niesie — i to jest najważniejsza reguła tego kompletu.** Przekątna
  idzie przez kafel od rogu do rogu, więc pas o szerokości *w* wystaje
  trójkącikiem o boku *w* w dwa kafle stykające się z jej końcami. Te kafle
  są zwykłymi połaciami i o pasie nic nie wiedzą, więc pas urywa się na każdej
  granicy kafla i wraca po 32 px. Złapane TRZY razy, za każdym razem dopiero
  na złożonym budynku:
  1. **cień pod okapem** → kafel `podokap` (trójkącik 9 px poniżej okapu).
     Bez niego dolna krawędź dachu była SCHODAMI: zmierzone, obrys schodził
     o 22 px na 31 px szerokości zamiast o 31;
  2. **gruby brzeg okapu** (11 px) → `_naroznik_okapu` doklejany do połaci
     leżącej nad okapem (`*_okp`);
  3. **wałek kalenicy** (4 px) → `_naroznik_kalenicy` doklejany do połaci
     leżącej pod kalenicą (`*_kal`).

  Stąd **kafle w pasie nie są wymienne**: górny styka się rogiem z kalenicą,
  dolny z okapem, i każdy musi nieść kawałek tamtego pasa. Zgłoszone dwa razy
  jako „kafelki przy połączeniach nie tworzą spójnej całości".

  Pilnują tego dwa testy, oba potrzebne: **[9]** liczy rozrzut sumy
  *(kolumna + najniższy kryjący wiersz)* — na ukosie 45° jest ona stała, więc
  rozrzut to wprost wysokość schodka; **[10]** porównuje KAŻDY piksel pasa
  z rysunkiem liczonym globalnie (`_wzor_pasa`). Test [9] patrzy tylko na
  obrys i punktów 2 i 3 nie widział — sprawdzone: po wyłączeniu narożnika
  okapu [9] nadal świeci OK, a [10] pokazuje 234 niezgodne piksele.
- **Czoła płatwi** (okrągłe końce belek więźby) idą co 23 px i mają promień 4;
  wersja co 11 px o promieniu 3 czytała się jak sznur rombowych ćwieków,
  a nie jak końce belek.

**Grubość pasa dachu to co najmniej 3 kafle (96 px), a nie 2, i generator tego
pilnuje.** W widoku od góry-przodu dach jest główną masą budynku i ma być go
widać jako POWIERZCHNIĘ, a nie jako obramowanie szczytu; przy dwóch kaflach dom
czytał się jak ściana z daszkiem. Liczba 3 jest wpisana w komplet (górny
wiersz przy kalenicy, dolny przy okapie, środkowy z czołem belki), więc
`_dach_szczytowy` odrzuca inną grubość dla POJEDYNCZEGO kafla zamiast po cichu
położyć zły.

**Wiersz, w którym zaczyna się ściana (`lico`), MUSI rosnąć razem z szerokością
budynku — i poprawka musi DOKŁADAĆ kafle dachu, a nie tylko przesuwać ścianę.**
To były dwa osobne, kolejno zgłoszone błędy tego samego mechanizmu:

1. **„Belki wystają."** Każda kolumna zaczyna swój własny pas w innym
   wierszu (`d`, dalej od osi = niżej), więc kolumna brzegowa nie ma tam
   jeszcze ŻADNEGO w pełni kryjącego kafla, dopóki `lico` trzymało się na
   sztywno `GRUBOSC_DACHU`. Jej zamek w narożniku ściany (ten sam kształt, co
   przy zwykłej ścianie z bali) wystawał więc na goły trawnik — niewidoczne
   przy szer=6, dokładna równość przy szer=8, a od szer=10 w górę kolumna
   brzegowa nie miała tam NIC, bo jej pas jeszcze się nie zaczął.
2. **„Przesunąłeś rząd kafelków zamiast dodać rząd kafelków, mamy dziurę."**
   Pierwsza poprawka podniosła `lico` do `max(GRUBOSC_DACHU, szer/2)`, ale nie
   ruszyła samego dachu — kolumna PRZY KALENICY kończyła swój pas dokładnie na
   starym `GRUBOSC_DACHU`, a ściana zaczynała się dopiero przy nowym, większym
   `lico`. Między nimi nie było NIC, dokładnie tam, gdzie ma być widoczna
   ściana szczytowa.

Poprawny mechanizm: każda kolumna dostaje `dodatkowe = max(0, szer/2 -
GRUBOSC_DACHU)` dodatkowych, w pełni kryjących kafli połaci, wstawionych PRZED
okapem — **także kolumna przy kalenicy**, więc koniec dachu i początek ściany
przesuwają się o tyle samo, razem. Dwa detale, złapane dopiero przez test [10],
nie okiem:

- **Wpieczony gruby brzeg okapu (kafel `*_dol`/`*_okp`) jest poprawny TYLKO
  bezpośrednio przed prawdziwym okapem** — musi więc siedzieć na `lico - 1`,
  nie na stałym `2`, inaczej maluje się w środku zwykłego poszycia.
- **Belka kalenicowa potrzebuje własnego, „jeszcze się ciągnie, bez czoła"
  wypełniacza** (`szczyt_fill`) na dodatkowe wiersze — bez niego belka znikała
  na tych wierszach i pojawiała się znowu dopiero na kaflu z czołem, jakby
  miała przerwę na środku.

Test [11] składa PRAWDZIWY budynek (dach + ściana razem, nie sam dach) i szuka
w każdej kolumnie pierwszego przezroczystego piksela między pierwszym kryjącym
kaflem dachu a fundamentem — to jedyny test, który złapałby którąkolwiek wersję
tego błędu, bo [8]–[10] patrzą wyłącznie na sam dach. Za tym mechanizmem idą
faktyczne wymiary budynków: chata 8×9 kafli, stodoła 10×11, obora 8×9,
kurnik 6×7 (bez zmian — `dodatkowe=0` przy tej szerokości), stajnia 9×6
(dach kalenicowy, nie dotyczy).

**Czoło belki kalenicowej rysuje się TYLKO w ostatnim wierszu pasa.** Wersja
kładąca ten sam kafel we wszystkich wierszach połaci dawała dwa okrągłe czoła
na jednej belce — jedno w połowie dachu, drugie nad wnęką. Niewidoczne przy
pasie dwukaflowym, oczywiste po pogrubieniu do trzech.

**Komin ma wpieczone tło w OBU swoich kaflach.** Warstwa jest jedna
(`buildings-over`), więc to samo miejsce nie może naraz należeć do dachu i do
komina — kafel komina nie nakłada się na dach, tylko go ZASTĘPUJE. Zdarzyło
się to dwa razy: najpierw dolny kafel wycinał przerwę w kalenicy, potem górny
wycinał zieloną dziurę w połaci dachu /\. Puste tło jest poprawne tylko tam,
gdzie komin naprawdę wystaje ponad dach (górny kafel przy dachu kalenicowym).

**Ściany z desek istnieją po to, żeby stodoła nie była domem o innych
proporcjach.** Deski idą z rampy `kora`, nie `drewno` — budynek gospodarczy ma
być CIEMNIEJSZY od chaty, a nie tylko inaczej prążkowany; rama (podwalina,
oczep, słupy narożne) zostaje w `drewno`, więc widać szkielet. Deska ma 8 px,
tak jak belka i kurs strzechy, więc żadna nie jest przecięta granicą kafla.
Zwietrzenie losowane jest **na deskę**, nie na piksel — szum per piksel dawał
cętki zamiast drewna, dokładnie jak przy strzesze sypanej losowo.

**Drzwi i okna są NAKŁADKAMI na osobnej warstwie, nie są wpieczone w ścianę.**
To jest cała różnica między tilesetem a kompletem gotowych domów: drzwi
w trzech miejscach ściany to trzy kafle, a nie trzy komplety ścian. Dom składa
się z opisu (`BUDYNKI_NA_MAPIE` w `tools/build_mapa.py`), więc dom 7×3 kosztuje
jedną linijkę.

**Dwa poprzednie podejścia rysowały CAŁE budynki jako propy wielokaflowe i oba
zostały odrzucone przez autora projektu.** Powody warto znać, bo są to te same
błędy, które wracają:

1. **Elewacja z boku zamiast rzutu z góry-przodu.** Płaski prostokąt ściany
   i jednotonowy trapez dachu. Dach musi być główną masą i mieć więcej niż
   jeden ton.
2. **Kombinatoryka.** Każde położenie drzwi to był nowy komplet kafli.
3. **Zerowa elastyczność.** Z gotowego domu 4×4 nie zrobi się domu 5×3.

Co zadecydowało o jakości obecnej wersji — trzy rzeczy, każda okupiona
nieudaną iteracją:

- **Belka to WALEC, nie pasek.** 8 px z pełnym profilem (ciemny rant, światło
  bliżej góry, dwa stopnie zejścia, ciemny szew). Poprzednia wersja miała 5 px
  z jednym pikselem światła i czytała się jak deska położona poziomo.
- **Zamek w narożniku to KOŁO.** Wystający koniec belki rysowany jak tarcza
  z oświetlonym łukiem. To po nim widać, że to dom z bali.
- **Strzecha ma KURSY, a granica kursu musi FALOWAĆ.** Bez kursów słoma czyta
  się jak futro; z idealnie poziomymi kursami — jak tektura falista. Fala
  liczona z dwóch sinusoid o okresie 32 i 16. Wersja z losowaniem per kolumna
  rozbijała ciemny spód kursu na kropki i dach wychodził cętkowany.
- **Szpara między belkami musi być prawie czarna** (dwa dolne piksele profilu
  na `drewno[0]`). To ona, a nie samo cieniowanie, oddziela belkę od belki —
  przy jednym ciemnym pikselu ściana z dwóch metrów czyta się jak jednolita
  płyta w brązowe prążki. Drugi warunek: **jeden słój na belkę, żadnych
  sęków.** Kilka kresek plus czarne kwadraciki dawały ścianę, która wygląda
  na zapleśniałą — drewno było pod tym szumem, tylko go nie było widać.
- **Kalenica to WAŁEK ZE SŁOMY, nie konstrukcja z żerdzi.** Wersja z dwiema
  poziomymi żerdziami i pionowymi przewiązkami co 8 px czytała się w grze jak
  **płot postawiony na dachu** i przez to cały dach wyglądał na uciętą płytę
  (zgłoszone przy oglądaniu zrzutu z gry). Górny piksel kalenicy jest średni,
  nie najjaśniejszy — dach kończący się najjaśniejszym stopniem daje twardą,
  świecącą krawędź i to jest właśnie „urwanie".
- **Komin w kalenicy musi mieć kalenicę wpiętą w swój kafel.** Warstwa jest
  jedna (`buildings-over`), więc kafel nakładkowy nie ma czego przykryć —
  zastępował kafel kalenicy i robił w grzbiecie dziurę.

**Wszystkie okresy dzielą 32** (belka 8, kurs 8, kamień 8). To jedyny powód,
dla którego kafel środkowy da się powtarzać bez szwu — pilnuje tego test [4],
który porównuje styk z **90. percentylem** różnic wewnętrznych, a nie z medianą
(pierwsza wersja z medianą wyrzucała strzechę jako zepsutą ze wskaźnikiem 10,9,
bo mierzyła „czy kafel jest gładki", a nie „czy kafel się składa").

Dwa błędy złapane po drodze, oba znane z drzew:

- **`strzecha()` i `sciana_belki()` kasowały wszystko poza swoim zakresem** —
  `kafel_kalenica` malował grzbiet w wierszach 0–9, a następne wywołanie
  strzechy od y=10 wycierało go do zera. Dach wychodził płaską matą bez
  kalenicy i przez dwie iteracje wyglądało to na wadę rysunku słomy;
- **postrzępiony okap wygryzał dziurę do tła** i po złożeniu domu między dachem
  a ścianą świecił pas trawy. Pod strzępami jest teraz cień okapu.

Dwa warunki weryfikacji są dziś **na czerwono i nie podkręcałem progu**:
ściana (48%) i fundament (39%) mają poniżej 60% pikseli odcinających się
jasnością od trawy. Kontrast niosą tam odcień i sylwetka, nie jasność — ale
test mierzy jasność i liczba jest jaka jest.

#### Rzuty złożone L / T / U — `zloz_zlozony()`, i dlaczego kafle to była mniejsza połowa

Podgląd: `python tools/build_budynki.py --podglad-zlozone X.png`.

Pierwsza wersja składała L z **dwóch niezależnych budynków**, przesuwając
bliższy o kilka wierszy w dół, żeby „wyszedł na gracza". Odrzucone od razu
i słusznie — *„wygląda jak budynek za budynkiem, a nie jak jeden budynek"*.
Trzy przyczyny, wszystkie zmierzone na wygenerowanym PNG, żadna widoczna
w raporcie:

1. **Dwie linie gruntu z trawą pomiędzy.** Korpus kończył fundament 64 px
   wyżej niż skrzydło, więc w podwórzu U było widać pełną elewację korpusu
   (okap → ściana → fundament → **trawa**), a dopiero pod nią osobne
   fundamenty skrzydeł. Jeden budynek ma jeden obrys.
2. **Okap korpusu zwisał w narożniku wklęsłym.** Kasowano go w kolumnach
   *zasłoniętych* przez skrzydło; kolumny podwórza zasłonięte nie są, więc
   trzymały frędzel i cień wiszące w powietrzu dokładnie tam, gdzie ma być
   kosz.
3. **Różne wysokości kondygnacji** — `sciana=3` to w praktyce **jeden** rząd
   bali (wiersz zjada `sciana_gora`, wiersz `fundament`), `sciana=4` to trzy.

**Lekarstwem jest jedna ściana, nie więcej kafli.** Korpus i skrzydła dzielą
ten sam pas `_sciany`: te same wiersze, ten sam fundament, ta sama wysokość.
Skrzydło wnosi **wyłącznie dach**; ściana szczytowa w klinie między jego
ramionami to po prostu ściana korpusu, zaczynająca się wyżej.

**Ile kafli kosza naprawdę trzeba: DWA, i to jest wynik pomiaru.**
Przezroczyste zewnętrze ma pięć rodzin kafli ramienia — zliczone piksele
`alfa == 0` w kaflu:

| rodzina | przezroczystych px | wariant `dolina_` potrzebny? |
|---|---|---|
| `szczyt` / `skos` | 496 | **tylko `skos`** |
| `okap_skos` / `kon_okap` | 253 | nie |
| `podokap` | 979 | nie |
| `*_kal`, `*_dol`, `*_okp`, `polac`, `kon_polac`, `szczyt_fill` | 0 | nie |

Kuszące — i błędne — jest zrobić wariant dla każdej z pięciu. Podmiana ma sens
**wyłącznie tam, gdzie za kaflem stoi inny kafel DACHU**:

- dach jedzie na `buildings-over`, ściana na `buildings`, więc kafel leżący na
  **ścianie** ma przez co świecić i ma świecić. Pod okapem ramienia stoi ściana
  szczytowa skrzydła — wariant `dolina_` zamalowałby szczyt chałupy słomą.
  (Zweryfikowane naocznie: pierwsza wersja `zloz_zlozony` robiła dokładnie to
  i **przeszła wszystkie testy**.)
- przy `PODNIESIENIE = 2` wierzchołek skrzydła stoi **nad** kalenicą korpusu,
  więc `szczyt` (kolumna przy osi) ląduje na niebie, nie na cudzym dachu.

Zostaje `skos` kolumny brzegowej. Policzone na trzech rzutach: użyty 4 razy,
pozostałych ośmiu wariantów — zero. Arkusz nie może urosnąć o wiersz (firstgid
Kuźni 514 i Pola 571), więc osiem kafli „na wszelki wypadek" to osiem komórek
zabranych czemuś realnemu.

⚠ **Kafel kosza ma TŁO WPIECZONE — `kalenica`/1 — i to nie jest szczegół.**
Pierwotnie wypełniał zewnętrze płaską `strzecha()`. Kafel wyglądał poprawnie
sam z siebie i **urywał kalenicę korpusu na dokładnie jeden kafel przed
skrzydłem** — grzbiet dachu kończył się w powietrzu. Widać to wyłącznie na
zbliżeniu styku. `zloz_zlozony` sprawdza więc, że pod spodem naprawdę jest
`kalenica`/1, i **rzuca wyjątkiem** zamiast cicho narysować zły grzbiet — stąd
warunek, że skrzydło nie może stać w skrajnej kolumnie korpusu (tam byłaby
`kalenica`/0 lub /2, z zawiniętym końcem).

Ograniczenia, wszystkie wymuszone przez komplet, nie wybrane:

- **szerokość skrzydła parzysta i najwyżej 6.** Powyżej `_dach_szczytowy`
  dokłada dodatkowe wiersze połaci i pas skrzydła przestaje być równy pasowi
  korpusu — cała arytmetyka `PODNIESIENIE` się rozjeżdża. Generator to sprawdza.
- **`sciana=4`.** Nad większością szerokości stoi dach kalenicowy (3 kafle),
  a komplet jest strojony pod relację „dach 3 / ściana 3". Przy `sciana=5`
  budynek ma 10 wierszy, z czego połowa to goła ściana — czyta się jak
  dwukondygnacyjny spichlerz.
- **`build_mapa.py` nadal nie umie opisać skrzydła w `BUDYNKI_NA_MAPIE`** —
  grafika i składanie są, postawienia L na mapie jeszcze nie ma.

### `Kuznia.png` — wnetrze kuzni, KOMPLET W BUDOWIE (faza 1/3)

`tools/build_kuznia.py`. Osobny arkusz, nie rzedy w `Buildings.png` — ten sam
wybor co przy `rabbit.png`/`boar.png`/`wolf.png`: nowa domena tresci dostaje
wlasny plik zamiast dokladania sie do istniejacego. Nie wpiety do zadnej sceny
(nie ma jeszcze systemu wnetrz) — art przygotowany z wyprzedzeniem, tym samym
trybem co `pig.png` i komplet obora/kurnik/stajnia w `Buildings.png` przed
wioska.

**Punkty wyjscia — pieciu zrodel, dwie rozne kategorie:**

- `Gemini_Generated_Image_5bbt8s5bbt8s5bbt.png` — material REFERENCYJNY,
  wzornik ASORTYMENTU (co w kuzni w ogole stoi, jaka jest wzajemna skala
  ~70 przedmiotow). Ta sama kategoria co `b1.jpg`/`b2.png` przy
  `Buildings.png` nizej: 2048x2048, gradienty, antyaliasing — render, nie
  pixel art. Zero jego pikseli w arkuszu. Licencja: NIEUSTALONA.
- `anvi.png` — ten sam typ materialu, wzornik KONSTRUKCJI. Pierwsza, czysto
  proceduralna wersja pieca/kowadla/miecha (gladki "zwezajacy sie blob",
  plaska tarcza-z-gory zamiast profilu bocznego, prosty klin) zostala
  zgloszona wprost jako „wyglada jak grafika pieciolatka" z tym plikiem jako
  kontrprzyklad. Zero jego pikseli w arkuszu — tylko sylwetka/proporcje.
  **Zastapiona krok pozniej** przez wyciecie gotowych sprite'ow (nizej) —
  nawet poprawiona wg tego wzornika procedura wciaz czytala sie gorzej.
- **`Nature_v1_backup.png`, `piec.png`, `grind.png` — TO NIE MATERIAL
  REFERENCYJNY, to ZRODLOWE sprite'y, WYCIETE WPROST.** Pierwszy to wlasny,
  juz-uzywany zasob projektu (oryginalny arkusz sprzed przebudowy
  `Nature.png` — stad tez pochodza drzewa); drugie dwa to material
  wygenerowany przez usera w Gemini SPECJALNIE pod ten plik („wygenerowałem
  je sam, więc nikt nie będzie miał problemu" — brak niejasnosci licencyjnej,
  w odroznieniu od reszty materialow z Gemini w projekcie). Wszystkie trzy sa
  prawdziwym pixel-artem (kontur + plaskie cieniowanie), nie renderem, i ich
  KSZTALT + CIENIOWANIE zostaly przejete 1:1 — tylko KOLORY sa przeliczone na
  `docs/paleta.json` (`_skwantuj`: kazdy piksel na najblizszy dozwolony
  kolor, osobno dla kamienia/drewna/ognia wg klasyfikatora, bo zrodlowe
  kolory nie byly w palecie). `piec.png` i `grind.png` sa na chroma-green tle
  (`_wczytaj_zielony` kluczuje #00FF00 na starcie), `Nature_v1_backup.png` ma
  juz prawdziwa alfe.

**Faza 1 (zrobiona): piec kowalski + stanowiska robocze, 14 kafli, 3 wiersze.**
Uklad w `docs/kuznia.json`. Siatka/skok/paleta identyczne jak `Buildings.png`
(32px kafel, 33px skok, tylko `docs/paleta.json` — zelazo/stal to rampa
`kamien`, juz chlodno-szara, zar to `akcent_cieply`; zadnych nowych kolorow).

**Uklad to JEDNA sasiadujaca grupa robocza** (na zyczenie — "piece umiesc
obok kowadel i kol szlifierskich i obok miecha, reszta narazie jest
zbedna"), nie osobne rzedy: piec (3 stany) w kolumnach 0–5, zaraz obok w
tym samym pasie (wiersz dolny) kowadlo duze/male i tocznia/oselka, na koncu
miech.

**Wolnostojacy komin (proceduralny, kursy kamienia rysowane kodem) zdjety z
arkusza — "odstaje od reszty".** I mial powod: to byl jedyny element w tej
grupie bez zrodla w ktoryms z materialow Gemini usera (`piec.png` /
`grind.png` / `Nature_v1_backup.png`) — reszta jest wycieta i dokwantowana
z gotowej sylwetki, komin byl czysto proceduralny (kursy `ciosy()`), i ta
roznica metody byla widoczna golym okiem jako niespojnosc stylu, nie tylko
koloru. **Stoly robocze (tez proceduralne) zdjete wczesniej z tego samego
powodu zbednosci narazie.** Obie funkcje (`stol`,
`_komin_pelny`/`komin_gora`/`komin_dol`) zostaja w skrypcie nieuzywane w
katalogu, gdyby ktora byla potrzebna pozniej — ale kolejny proceduralny prop
bez zrodlowego sprite'a w tej samej grupie powinien dostac wlasny zielony
material, nie proba dopasowania samym kodem.

| wiersz | zawartosc |
|---|---|
| 0–1 | piec kowalski (z `piec.png`), 3 stany ognia (zimny/rozpalony/wygaszony), kazdy **2x2** (64x64, w rozdzielczosci zrodla, bez skalowania), kol. 0–5 |
| 1 | kowadlo duze, kowadlo male (`Nature_v1_backup.png`), tocznia, oselka (`grind.png`), miech (proceduralny), stojak narzedzi, stojak broni, worek wegla, skrzynia rudy (`tools.png`) — kol. 6–14, w TYM SAMYM wierszu co dol pieca |

**`kowal.png`** — szosty material, DWIE role naraz. Cztery meble (stojak
zbroi, stol z imadlem+mlotkiem, stol z hakami/szczypcami+plytkami, scienna
szafka na narzedzia) sa wyciete i dokwantowane jak wyzej — kol. 0–5,
wiersz 2. **Sama postac kowala w koncu NIE pochodzi z tego arkusza** — patrz
`blacksmith.png` nizej. Trzy podejscia do postaci, w kolejnosci: proceduralny
rysunek od zera (odrzucony, za daleko od stylu gry) -> wyciecie z `kowal.png`
(technicznie dzialalo, ale to malarski/wysokiej-wiernosci material, wiec
przekolorowanie musialo robic duzo pracy) -> **`blacksmith.png`**, dedykowana
generacja Gemini juz w niskiej-wiernosci stylu gry, patrz nizej.

**`blacksmith.png` (50x101)** — postac kowala, wygenerowana Gemini
promptem dopasowanym pod ten pipeline (pelny prompt + uzasadnienie kazdej
klauzuli: `docs/prompty_gemini.md`). W przeciwienstwie do `kowal.png` to
DEDYKOWANA generacja postaci — zero innych obiektow w kadrze (zaden trzymany
mlot, zaden stolik), co usuwa najwiekszy problem poprzedniej sciezki
(dlon dotykajaca sasiedniego propu, przez co kazdy prostokatny kadr albo
urywal reke, albo lapal kawalek mebla).

**Zrobione: `tools/build_kowal.py` -> `kowal_portrait.png`.** Wyciecie +
przekolorowanie, ta sama technika co reszta tego pliku — NIE rysunek od zera.
`_BOX` to ciasny, POLICZONY bounding-box nieprzezroczystej tresci
(x7-42/y16-82) — bez recznego dobierania kadru, bo w kadrze nie ma nic poza
postacia. Zielone tlo zdejmowane DWA razy (flood-fill od krawedzi + globalny
prog na resztkach, ktorych flood-fill nie dosiegnal). Przekolorowanie to
JAWNA tabela ~16 kolorow (nie klasyfikator progowy jak
`_klasyfikuj_kamien_drewno` — tu kolorow jest za malo i za blisko siebie,
zeby prog byl bezpieczny), zbudowana przez wypisanie najczestszych kolorow
kadru i sprawdzenie kazdego na osobnej masce: fartuch/pasy -> `drewno`,
buty -> `neutralne`, spodnie -> `listowie[0]` (najblizszy numerycznie
stonowany zielony w palecie projektu). Skora i plocienna koszula pod
szelkami zostaja BLISKIE oryginalowi — to nie material ktory ma pasowac do
otoczenia, tylko kolor postaci (ta sama zasada co Character.png/NPC.png:
wlasna domena pikseli, nie w `docs/paleta.json`). Piksele spoza tabeli
(antyaliasing na krawedziach) dostaja kolor NAJBLIZSZEGO wpisu w tabeli.

**Kontur ZOSTAJE, mimo `docs/ART_DIRECTION.md` 4.4** ("prop: bez czarnego
obrysu"). Wyprobowane bez obrysu (ten sam trik „cienki obrys -> jeden stopien
ciemniej" co `_usun_kontur` w `build_kuznia.py`) i porzucone po podgladzie —
sylwetka robi sie miekka, granice reka/tulow zlewaja sie. Kowal to jedyna
RUCHOMA postac w tym zestawie, ktora musi czytac sie na tle bezkonturowej
trawy — `docs/ART_DIRECTION.md` 4.6 stawia kontrast jasnosci wyzej niz
czystosc stylu, i to przewazylo.

Jedna statyczna poza (idle-down) — `Merchant.ts` nigdy nie animuje NPC-ow,
wiec arkusz kierunkow/stanow jak u wilka nie byl potrzebny.
Wpiete jako `ASSETS.kowal` + `BLACKSMITH.portraitTexture`; `Merchant.ts`
sprawdza `scene.textures.exists(...)` i spada z powrotem na tintowany portret
NPC.png, jesli plik kiedykolwiek zniknie.

Stol_imadlo/stol_haki maja drobny detal na blacie (hak, szczypce, plytki
metalu) i przy tej samej skali co zwarte propy (~30px, cel dla stojaka
zbroi/szafki) detal rozsypywal sie w szum nieczytelny jako narzedzia.
Naprawa: `_stol_szeroki_z_tools` — plotno **2x1** (jak `stol()`), wyzsza
zachowana rozdzielczosc zrodla. Druga usterka zlapana na tym samym
podgladzie: prog klasyfikatora kamien/drewno (35/18, dobrany na
`grind.png`) lapal glowny brazowy ton nog stolu (85,63,51, r-b=**34**) o
WLOS pod sitem i malowal drewniane nogi na szaro. Poluzowany do 28/14 —
zweryfikowane, ze nie psuje wczesniejszych wyciec (grind.png/tools.png).

**`tools.png`** — piaty material Gemini usera (bez problemu licencyjnego),
cztery gotowe sprite'y wyciete i dokwantowane tym samym `_klasyfikuj_
kamien_drewno` co `grind.png`: stojak narzedzi (dluta/przebijaki na
drewnianym stelazu), stojak broni (piec mieczy), worek wegla (juta +
czarne bryly), skrzynia rudy (drewniana skrzynia z szarymi blokami). Wszystkie
cztery skalowane tak, zeby dluzszy bok wyszedl ~30px — ta sama klasa
rozmiaru co kowadlo/kola, zeby grupa zostala jednolita zamiast rosnac o
wielokaflowe propy bez potrzeby.

**Piec byl najpierw skalowany W DOL o polowe, zeby zmiescic sie w jednym
kaflu — i wyszedl z tego, cytujac, „malutki piecyk do robienia gwoździ",
mniejszy od kowadla stojacego obok.** To odwrotnosc zamierzonej hierarchii:
piec to najwieksza, najbardziej stacjonarna bryla w kuzni, kowadlo ma byc
PRZY nim male. Naprawa: zero skalowania — sylwetka zostaje w rozdzielczosci
zrodla (~44x52px) i idzie na plotno **2x2 kafle (64x64)**, pociete na cztery
kafle 32x32 (`_na_cwiartki`), dokladnie jak stog siana w `Buildings.png`.
Ogolna zasada, warta pamietania przy kazdym kolejnym duzym propie z
zewnetrznego zrodla: **nie skaluj w dol tylko po to, zeby zmiescic sie w
jednym kaflu — zmien liczbe kafli, nie rozmiar przedmiotu.**

Rzeczy zlapane dopiero na ZLOZONYM PODGLADZIE (`--podglad`), nie w kodzie —
ta sama lekcja co przy `Buildings.png`, "kafel ogladany osobno klamie":

- **Kamien losowany PER PIKSEL brzegu czytal sie jak szum, nie jak mur.**
  Naprawa (`ciosy`, uzyta dzis tylko przez wolnostojacy komin — piec ma juz
  wlasna, wyciety sylwetke): rowne KURSY w ukladzie muratorskim — kazdy cios
  to `blok()` (wlasny fazowany brzeg jasny-gora-lewo/ciemny-dol-prawo), wiec
  sasiednie ciosy stykaja sie szwem z natury.
- **Piec i kowadlo rysowane proceduralnie od zera (schodkowa piramida z
  lukiem promienistym; profil boczny na pniu) wciaz czytaly sie gorzej niz
  gotowe sprite'y, mimo poprawnej konstrukcji wg `anvi.png`.** Zamiast
  trzeciej iteracji proceduralnej — wyciecie i dokwantowanie gotowych
  assetow. Kod tamtych podejsc (razem z proceduralnymi `tocznia`/`oselka`,
  zastapionymi w tym samym ruchu przez `grind.png`) zostal CALKOWICIE
  zastapiony, nie zostawiony jako martwa alternatywa.
- **Prog rozdzielajacy „kamien" od „ognia" (R-B > próg) NIE PRZENOSI SIE
  miedzy zrodlami.** Kamien w `Nature_v1_backup.png` jest chlodny (R-B <= 0),
  wiec prog 25 dzialal. Kamien w `piec.png` jest CIEPLEJSZY (R-B siega ~40
  na samym murze), a plomien zaczyna sie dopiero ~180 — ten sam prog 25
  zlapal kamien jako „ogien" i CALA bryla piecowa wyszla pomaranczowa (a przy
  „wygaszony" niemal caly piec zgasl na czarno, bo maska ognia objela tez
  mur). Zgloszone jako zle kolory. Naprawa: prog 100, dobrany z rzeczywistej
  przerwy miedzy probkami kamienia i ognia w TYM zrodle — nie ma jednej
  stalej, kazde nowe zrodlo trzeba zmierzyc osobno (patrz `_klasyfikuj_piec`).
- **Miech przeszedl DWIE zle wersje, obie zlapane dopiero na podgladzie:**
  pasy poziome na stalej wysokosci czytaly sie jak zwiniety dywan; symetryczna
  „soczewka" (polowa szerokosci rosnie i opada tym samym tempem) czytala sie
  jak kamien/kupa — okragla sylwetka byla winna, nie kolor czy detal. Naprawa:
  asymetryczny profil KOMETY (polowa szerokosci rosnie SZYBKO od zawiasu,
  opada WOLNO ku obejmie) plus TWARDY ciemny SZEW na osi, dzielacy gorna plyte
  od dolnej na calej dlugosci — to pojedyncza kreska, po ktorej wachlarz czyta
  sie jako dwie deski, a nie jedna bryla. Pozostaje proceduralny (brak
  gotowego bellowsa w zadnym ze zrodel).

**Zostaje (faza 2): przechowywanie (stojaki, beczki, skrzynie, kufry) +
surowce (sztaby, wegiel, ruda). Faza 3: narzedzia + detale warsztatowe +
dekoracje.** Nie doklad tych kategorii do arkusza bez ponownego `--podglad` —
kazda nowa partia kafli wymaga tego samego zlozonego podgladu, nie tylko
zielonego raportu w konsoli.

### Kopie zapasowe

- `Nature_v1_backup.png` — **oryginalny arkusz** sprzed wszystkiego. Stąd
  pochodzą drzewa, i stąd `tools/build_kuznia.py` wycina (i dokwantowuje do
  palety) kowadło do `Kuznia.png` — patrz sekcja `Kuznia.png` niżej (piec i
  koła szlifierskie w tym samym arkuszu są wycięte skądinąd — z `piec.png`/
  `grind.png`, materiału wygenerowanego przez usera w Gemini specjalnie pod
  ten plik). Nie kasować — to już nie tylko historia, to żywe źródło art-u.
- `Nature_v2_backup.png` — wersja pośrednia (640×800, stary układ z balastem).
- `Buildings_v1_backup.png` — **ręczny arkusz budynków sprzed generatora.**
  Nie kasować; `Buildings.png` jest dziś nadpisywany przez `build_budynki.py`.

### `b1.jpg`, `b2.png` — materiał REFERENCYJNY, nie źródłowy

Ta sama zasada, co przy `height32_trees_mega_pack.png` i z tego samego powodu.
Zmierzone: `b2.png` ma **2816×1536 przy siatce ~117 px**, **98 573 kolory**
i **alfa min 255 / max 255** — tło jest w nim NAMALOWANE, nie przezroczyste.
To nie jest pixel art, tylko pomniejszony render. Posłużyły jako wzornik
słownictwa (jak czyta się ściana z kłód, jak wygląda okap, jakie proporcje
ma dach) i **ani jeden ich piksel nie trafił do arkusza**.

**Licencja i pochodzenie: NIEUSTALONE** (materiał z Gemini). Skoro nic z nich
nie przenosimy, dziś nas nie wiąże — ale gdyby ktoś kiedyś chciał wziąć stamtąd
piksele, trzeba to najpierw rozstrzygnąć.

### `rabbit.png` — pierwszy stwór z prawdziwą animacją ruchu

Wygenerowany przez `tools/build_rabbit.py` (uruchom bez flag na podgląd/raport,
`--zapisz` żeby nadpisać). Zastąpił stary arkusz 3 statycznych portretów —
królik był jedynym z pięciorga potworów bez żadnej animacji chodu
(`CLAUDE.md`, sekcja "Rabbit directional walk spritesheet"). Nowy arkusz JEST
w palecie projektu (`docs/paleta.json`, rampy `neutralne` + `akcent_cieply`),
w przeciwieństwie do `Character.png`/`NPC.png`/`items.png`, które zostają
**nietknięte** — patrz sekcja "Pozostałe" niżej.

- **96×72px, siatka 4×3 po 24px, ZERO przerwy.** Nie 32px/33px skok Teren/Nature
  — to zasada siatki TERENU (ART_DIRECTION 4.1), a arkusz sam generujemy, więc
  nie ma ryzyka "sąsiad wciągnięty przez filtrowanie", które uzasadnia 1px
  przerwę gdzie indziej. 24px trzyma królika wyraźnie mniejszym od dzika/wilka
  na ekranie (~38px po `RABBIT.scale=1.6` vs ~54–92px dla reszty).
- **Układ: wiersz 0 = idle w dół / idle w górę (+2 nieużywane komórki), wiersz
  1 = chód (4 klatki, bok, w prawo), wiersz 2 = bieg (jak wyżej, niżej przy
  ziemi, większa amplituda).** Lewa/prawa strona NIE są osobnymi klatkami —
  `Enemy`/`Rabbit` już odbijały przez `setFlipX` zanim była jakakolwiek
  animacja do odbicia, więc jeden widok boczny + odbicie to naturalne
  rozszerzenie, nie skrót.
- **Cieniowanie każdej bryły to prawdziwa rampa, nie przyciemniony okrąg.**
  `elipsa_cien()` liczy stopień z iloczynu skalarnego przybliżonej normalnej
  elipsoidy ze światłem (góra, lekko z lewej) — ta sama technika co
  `zamek()` w `build_budynki.py` (tarcza-kula, nie płaskie kółko). Bez
  kierunku światło byłoby płaskie jak stary zarzut ART_DIRECTION wobec
  `Nature.png`.
- **Pułapka złapana dopiero na 8x podglądzie, nie w raporcie krycia:**
  pierwsza wersja `ucho()` szła PO parametrze `t` i stawiała piksele wzdłuż
  obliczonych `x,y` z `np.linspace` — przy ułamkowych krokach zostawiało to
  dziury i ucho wyszło jako przerywana "cukierkowa" kreska zamiast litego
  kształtu. Naprawa: odwrotne przekształcenie (dla każdego piksela w
  otoczeniu liczymy jego `u,v` względem osi ucha i testujemy przynależność) —
  gęste wypełnienie, zero dziur, niezależnie od kąta/długości.
- **Drugi błąd tej samej klatki:** uszy w `idle` (baza `cy=0.2T`, długość 9px)
  wychodziły POZA górną krawędź kadru — ucinane na każdej klatce. Skrócone do
  ~5.6–6px z bazą niżej (`cy≈0.27T`); to samo dotknęło ucho w fazie "lot" bocznego
  cyklu biegu (głowa unosi się z ciałem, ucho ma mniej marginesu niż w chodzie).
  **Test krycia (>20px/klatkę) tego nie łapie** — ucięta koncówka nadal daje
  dużo pikseli, tylko nie tam gdzie trzeba; złapane wyłącznie na wizualnym
  podglądzie 8x. Każda zmiana geometrii ucha/głowy wymaga ponownego
  wizualnego sprawdzenia, nie tylko zielonego raportu.
- **Cień kontaktowy ma być SUBTELNY.** Pierwsza wersja (promień ~7px, alfa 95)
  była niemal tak szeroka jak tułów i na podglądzie czytała się jak trzecia,
  płaska łapa zamiast cienia pod stworem. Zmniejszony do promienia ~4-4.5px,
  alfa 70.
- **Ogon musi być jaśniejszy stopień rampy niż łapy**, inaczej dwa szare
  kształty przy tylnej części sylwetki bocznej zlewają się w jeden. `ogon()`
  bierze górne 2 stopnie rampy `neutralne` (prawie biel), łapy — środkowe/ciemne.
- **Chód i bieg dzielą JEDNĄ tabelę faz** (`FAZY`, 4-fazowy skok: przysiad →
  odbicie → lot → lądowanie) z mnożnikiem amplitudy zamiast osobnego kompletu
  klatek biegu — inaczej dwa cykle zaczną się z czasem rozjeżdżać przy każdej
  poprawce. Bieg = te same fazy × 1.7 (unos, rozciągnięcie), plus uszy
  zaczesane do tyłu zamiast prosto w górę (ten sam język co "ears trailing" w
  `ENEMY_MOTION` dla wilka — sygnał prędkości).
- **`ASSETS.rabbit.idleDownFrame` musi iść jako jawna klatka startowa do
  `Enemy`'s super() (via nowy opcjonalny `initialFrame` parametr), nie tylko
  jako pierwszy `this.play(...)` w `Rabbit`'s konstruktorze.** `Enemy`
  liczy `restHeight` i rozmiar ciała z `this.width/height` PRZED uruchomieniem
  jakiegokolwiek kodu podklasy — bez jawnej klatki Phaser domyślnie pokazuje
  cały arkusz (96×72), co zatrułoby offset paska HP i hitbox na stałe (nie da
  się tego naprawić późniejszym `play()`, bo te liczby są już przeliczone).

### `boar.png` — drugi stwór z prawdziwą animacją, ten sam komplet co królik

`tools/build_dzik.py` (siostrzany skrypt `build_rabbit.py` — te same
`kladz`/`elipsa_cien`/`ucho`/`cien_kontaktowy`, tylko dostrojone pod
czworonoga). Zastępuje `makeBoarPlaceholder`, jedyną dotąd formę dzika
(procedura w silniku, zero PNG-a). **112×84px, siatka 4×3 po 28px**
(królik: 24px) — dzik ma być wyraźnie większy/cięższy na ekranie.
Ten sam `ASSETS.boar` kształt co `ASSETS.rabbit` (frameWidth/cols/idleDown
Frame/walkRow/runRow/...), więc `Assets.ts` tnie oba jedną funkcją,
`sliceCreatureSheet()`, zamiast dwóch prawie identycznych.

Co jest INNE niż u królika (różnice, nie powtórki — szczegóły cieniowania/
odwrotnego-mapowania uszu są identyczne, patrz sekcja rabbit.png wyżej):

- **Czworonóg na TROCIE, nie skaczący dwunóg.** Cykl chodu/biegu to proste
  naprzemienne przód/tył (`FAZY`, 4 fazy) bez fazy "lotu" — dzik nie odrywa
  się od ziemi jak skaczący królik.
- **Paleta `ziemia`** (ciepły brąz) zamiast `neutralne` królika; kły i ryjek
  dostały osobne, świadome wyjątki od tej rampy (niżej).
- **Pułapka: uszy i grzywa tą samą rampą i podobnym kątem czytały się jak
  JEDEN rząd kolców** (rogi/mohawk), nie jak dwa osobne elementy. Naprawa:
  uszy przeszły na rampę `ziemia` (kolor futra, nie grzywy), skrócone
  (dl 5→3.5) z zaokrągloną końcówką (`t²` zamiast liniowego zwężania) i
  rozsunięte szerzej niż zasięg grzywy w x — dwie osobne strefy zamiast
  jednej ciągłej.
- **Kły z rampy `piasek`, NIE `neutralne`.** Pierwsza wersja użyła
  `neutralne[4]` (chłodny szaro-niebieski) i na ciepłym brązowym pysku kły
  czytały się jak sztuczna szczęka. `piasek[4]` (ciepły kremowy) pasuje do
  reszty palety i wygląda jak kość, nie plastik.
- **Grzywa** — rząd ciemnych kolców (`kora`) wzdłuż grzbietu, jedyny element
  odróżniający sylwetkę dzika od zwykłej "świni" na pierwszy rzut oka (patrz
  `pig.png` niżej — świnia świadomie NIE ma tego rzędu).

### `wolf.png` — najbogatszy arkusz w grze, 4 PRAWDZIWE kierunki × 6 stanów

`tools/build_wilk.py`. Zastępuje `makeWolfPlaceholder` (pojedyncza statyczna
twarz) dla **bazowego wilka ze stada** (`Wolf`, kind `"wolf"`) — Szary
(`GreyWolf`) świadomie NIE dostał tego arkusza, patrz sekcja "Co NIE zostało
zrobione" niżej.

Zakres ustalony z userem PRZED rysowaniem (patrz nagłówek skryptu i
`CLAUDE.md` przy `ASSETS.wolf`): Idle/Walk/Growl/Bite Attack/Hurt
Reaction/Death, każdy w 4 kierunkach. To pierwszy arkusz w projekcie z
prawdziwie **czterema niezależnymi** kierunkami — królik i dzik świadomie
robią tylko 3 (dół/góra/prawo) + lustro na lewo. Tu user chciał inaczej;
technicznie "lewo" i tak jest lustrzaną kopią "prawo" (jak wiersze
`Character.png`), tylko wypalone w PLIKU przez skrypt (`np.fliplr`), nie
liczone w silniku przez `setFlipX`.

- **112×672px, siatka 4 kolumny × 24 wiersze, kafel 28px** (jak dzik).
  `wiersz = stan_idx*4 + kierunek_idx`, kierunki w kolejności
  down/up/left/right (ta sama konwencja co `ASSETS.character.dirRows`) —
  identyczna formuła w `tools/build_wilk.py`, `ASSETS.wolf` (GameConfig) i
  `createWolfAnimations` (Animations.ts). Zmiana kolejności stanów/kierunków
  w jednym miejscu bez zmiany pozostałych dwóch cicho przesuwa każdą klatkę.
- **`CreatureSheetCfg` w `Assets.ts` przeszedł z `walkRow`/`runRow` na jawne
  `rows`.** Arkusz wilka ma tabelę `states` (6 wpisów × 4 kierunki), nie parę
  `walkRow`/`runRow` — pierwszy kształt nie dawał się wywieść z niczego, co
  miał królik/dzik. `sliceCreatureSheet()` tnie teraz WSZYSTKIE trzy
  (rabbit/boar/wolf) jedną funkcją mimo różnych kształtów animacji, bo
  cięcie i animowanie to dwie różne warstwy — cięcie tylko potrzebuje
  frameWidth/frameHeight/cols/rows, o kolejności klatek nic nie wie.
- **Wspólna funkcja `wyrostek()` rysuje i uszy, i ogon** — oba to "stożkowaty
  wyrostek od punktu bazowego pod kątem", tylko inny punkt zaczepienia,
  długość i kierunek. Jeden odwrotnie-mapowany wypełniacz (jak `ucho()` u
  królika/dzika), zero duplikacji.
- **Złapane dopiero na renderze, nie w raporcie krycia — ogon wskazywał W
  CIAŁO, nie na zewnątrz.** Kąt 130° w konwencji tego skryptu (0°=w górę,
  rośnie zgodnie z ruchem wskazówek zegara) daje kierunek w DÓŁ-W-PRZÓD, czyli
  w stronę głowy — dokładna odwrotność tego, co potrzeba (ogon ma iść w
  dół-w-tył, z dala od głowy). Naprawione na 230°. Ten sam błąd w widoku
  tył/przód był subtelniejszy: kąt (178°, w dół) był poprawny, ale ogon miał
  ten sam ciemny stopień rampy co zacieniony zad i czytał się jak zwykłe
  zwężenie sylwetki, nie jak osobny kształt — naprawione jaśniejszym
  koniuszkiem (`K[4]`) i dłuższym/dalej wysuniętym wyrostkiem.
- **PUŁAPKA WPIĘCIA (nie w skrypcie — w silniku): `setFlipX` z poprzedniej
  epoki podwójnie odbijał już poprawnie narysowane klatki.** `circleStep`/
  `enterLunge`/`patrol` wołają `setFlipX` od czasów, gdy wilk był jedną,
  zawsze-w-prawo twarzą (tak jak dziś nadal robi Szary). Z prawdziwym
  arkuszem 4-kierunkowym `Wolf.updateAnimation` wybiera już PRAWIDŁOWĄ,
  niezależnie narysowaną klatkę `"left"` — zostawienie `flipX` włączonego
  odbijało ją PONOWNIE, więc wilk idący w lewo pokazywał klatki wyglądające
  jak idące w prawo. Naprawione jawnym `this.setFlipX(false)` na początku
  `updateAnimation` dla `kind === "wolf"`. Ten błąd nie objawia się na
  pojedynczym kafelku — widać go dopiero w silniku, w ruchu.
- **Jeden wspólny słownik stanu (`stan()`) czytany przez dwa rysowniki**
  (`rysuj_bok` dla lewo/prawo, `rysuj_przod_tyl` dla góra/dół) — bez tego 6
  animacji × 4 kierunki to 24 osobne rysunki do ręcznej synchronizacji.
  Parametry abstrakcyjne (bob/lean/mouth/ear_back/collapse/leg_swing...), nie
  "narysuj mi klatkę 7" — dzięki temu Growl i Bite różnią się tylko wartościami
  w jednej tabeli (`stan()`), a nie kodem rysującym.

**Co NIE zostało zrobione (celowo, na razie):**

- **Szary (`GreyWolf`) nie dostał tego arkusza.** Ma dalej własny, osobny
  placeholder (`ASSETS.greyWolf`/`makeGreyWolfPlaceholder`) — z zasady "nie
  jest wilkiem w większej skali" (patrz komentarz przy `ASSETS.greyWolf` w
  GameConfig — i sekcja `greywolf.png` niżej, gdzie Szary DOSTAŁ własny
  arkusz). Mechanizm gotowy na to od początku: `Wolf`'s `updateAnimation`/
  `onHurt`/`onDeathVisual`/`playOneShot` czytają teksturę/klucze animacji z
  `this.animFn`, ustawianego w konstruktorze — `Wolf` domyślnie na
  `wolfAnim`, `GreyWolf` na `greyWolfAnim` — więc dziedziczenie po `Wolf`
  automatycznie dawało Szaremu poprawne zachowanie w dniu, w którym dostał
  własny arkusz, bez dotykania tych czterech metod.
- **Growl NIE gra przed każdym `lunge` zwykłego wilka** — tylko przy
  `howl()` (alarm/wezwanie stada). Dart pozostaje celowo nietelegrafowany —
  patrz komentarz w `Wolf.ts` o `lungeMs`/`lungeSpeed` ("the pack's threat is
  the volume of attacks, not one big readable haymaker"). U Szarego Growl
  gra na `windup` — to jest jego PRAWDZIWY telegraf, patrz `greywolf.png`
  niżej.
- **Pounce/Leap** z pierwszej rozmowy — pominięty. User: "narazie tylko
  odświeżamy grafikę placeholderów, nie dokładamy nowej logiki do kodu".

### `greywolf.png` — Szary, WŁASNY arkusz (nie wilk w większej skali)

`tools/build_szary.py`, siostrzany skrypt `build_wilk.py` (ten sam komplet 6
stanów × 4 kierunki, ta sama technika). User: "z racji że to lider stada
musi być ciut przerośnięty w porównaniu do reszty i bardziej groźny z
wyglądu". **128×768px, kafel 32px** (wilk: 28px) — przy tym samym
`GREY_WOLF.scale=2.4` (bez zmian) daje to ~77px na ekranie vs ~50px
zwykłego wilka (`WOLF.scale=1.8`) — zweryfikowane side-by-side, oba
przeskalowane do swoich RZECZYWISTYCH rozmiarów w grze (frame×scale), nie do
wspólnego zoomu, bo ten drugi ukrywa wlaśnie tę różnicę.

Co konkretnie sprzedaje "przerośnięty i groźny", nie tylko "większy":

- **Bledsza sierć** — rampa `kamien` rozjaśniona o 32% w stronę bieli
  (`PALE = [... c + (255-c)*0.32 ...]`), niezależna od rozmiaru kafla.
  Wyplowiały futrzak, nie młody ciemnoszary wilk ze stada.
- **Ciężki, ciemny łuk brwiowy** nad oczami (`luk_brwiowy()`) — jeden gruby
  pasek z ciemnego końca rampy `neutralne`. Bez tego "przerośnięty wilk"
  czyta się jak duży szczeniak, nie jak stary wojownik — sam rozmiar kafla
  tego nie sprzedaje.
- **Blizna** przez grzbiet nosa, pod okiem/brwią (`blizna()`) — konkretny,
  czytelny ślad walki. **Dwie poprzednie pozycje obie zawiodły, złapane
  dopiero w żywej grze, nie na podglądzie arkusza:** pierwsza wersja szła
  przez sam pysk i user zgłosił, że czyta się jak krew ciekąca z ust, nie
  jak zagojona rana — poprawka nr 1 przesunęła ją przez brew/oko, co
  usunęło skojarzenie z krwią, ale stłoczyło oko+brew+bliznę w jeden
  nieczytelny kleks w rogu 32px głowy (trzy różne detale w jednym ciasnym
  regionie). Dopiero **własny, osobny pas** — pod okiem, nad nozdrzami, nic
  z nim nie koliduje — zadziałał. Kolor (`akcent_cieply`, ciemny rdzeń
  `A[1]` + jasna krawędź `A[3]` przesunięta o pełny piksel prostopadle, nie
  płaska jednokolorowa kreska) nie był problemem ani razu — to POZYCJA
  psuła czytelność za każdym razem, warto to pamiętać przy każdym kolejnym
  detalu upychanym w tak małą głowę.
- **Jaśniejsze oko, dwupikselowe** zamiast jednego piksela u zwykłego wilka.
- **Sylwetka x1.08 masywniejsza** (`BUDOWA` — mnożnik rx/ry niezależny od
  samego powiększenia kafla), żeby nie czytał się jak zwykły wilk zbliżony
  do kamery.
- **Ten sam błąd co u wilka: `wyrostek()` reużyty na ogon i uszy** — bez
  nowych pomyłek tym razem, bo geometria (kąt 230°, jasny koniuszek) była
  już wcześniej naprawiona w `build_wilk.py` i skopiowana tu poprawnie.

**Nowa pułapka, złapana na renderze frontu/tyłu, nie w raporcie krycia:**
`luk_brwiowy()` bierze `kat_deg` w tej samej konwencji co `wyrostek()`
(`dx=cos, dy=sin` — 0° JUŻ znaczy "poziomo", x się zmienia). Pierwsza wersja
wołała `luk_brwiowy(..., kat_deg=90)` dla widoku przód/tył, myśląc "90° =
poziomy pasek nad oczami" — w tej konwencji 90° daje PIONOWĄ kreskę (y się
zmienia, x stałe), która na renderze wyglądała jak czarna linia biegnąca od
czoła w górę poza kadr. Widoczne dopiero na 6x podglądzie — test krycia
przechodził (kreska ma piksele, tylko nie w tym kierunku co trzeba).
Naprawione na `kat_deg=0`.

**Mapowanie stanów na `GreyWolf.ts`** (inne nazwy fazy niż zwykły wilek, ten
sam szkielet):

| stan | GreyWolf.ts |
|---|---|
| Idle | pauzy, `recover` |
| Walk | `stalk` (krążenie) / `close` (podejście) / `backstep` (odskok — reużywa Walk, nie ma osobnej "cofania się" klatki) |
| Growl | `windup` — PRAWDZIWY telegraf ugryzienia, w przeciwieństwie do zwykłego wilka + `checkEnrage()` (ryk szału) |
| Bite Attack | `resolveBite` |
| Hurt Reaction | `onHurt` (dziedziczony z `Wolf`) |
| Death | `onDeathVisual` (dziedziczony z `Wolf`) |

Enrage (czerwony tint) zostaje BEZ osobnego stanu animacji — działa już
przez `setBaseTint`/`refreshTint()`, nie było w oryginalnej liście 6 stanów;
Growl przy `checkEnrage()` dokłada ryk, tint nadal niesie sam fakt szału.

### `pig.png` — przygotowana pod wioskę, dalej NIEWPIĘTA w grę

⚠ **Nazewnicza pułapka od 2026-08-14: `ASSETS.pig` w `GameConfig` istnieje
teraz, ale wskazuje na `pig_walk.png`/`pig_eat.png` (prawdziwy zewnętrzny
arkusz, patrz sekcja „Zwierzęta gospodarskie" wyżej), NIE na ten plik.** Ten
`pig.png` (opisany niżej) jest osobnym, starszym materiałem i wciąż nie ma
żadnego zaczepienia w kodzie — nazwa klucza w `ASSETS` już jest zajęta przez
inny plik, więc wpięcie tego świniowatego szkicu wymaga innej nazwy klucza
(np. `ASSETS.pigProcedural`), nie samego dopisania `ASSETS.pig`, jak
sugerował ten akapit przed tą datą.

`tools/build_swinia.py`. W przeciwieństwie do `rabbit.png`/`boar.png` **żaden
kod jej nie ładuje** — nie ma klasy/bytu w `src/entities` wskazującego na
nią. To materiał przygotowany z wyprzedzeniem pod wiejski inwentarz
(`docs/swiat.md`), tym samym trybem co komplet budynków (`build_budynki.py`
miał oborę/kurnik/stajnię dawno zanim jest gdzie je postawić — patrz
`CLAUDE.md`, sekcja "The village"). Dziś, z `ASSETS.pig` już zajętym przez
prawdziwy arkusz, ten plik zostaje czystym rezerwowym materiałem bez
oczywistej ścieżki wpięcia — chyba że jako WARIANT (np. młode prosię obok
dorosłej świni z `pig_walk.png`).

104×78px, siatka 4×3 po 26px, ten sam komplet (idle dół/góra + chód/bieg w
profilu, TROT jak dzik — nie skok jak królik). Co odróżnia ją od dzika,
mimo wspólnego szkieletu kodu:

- **Paleta `akcent_cieply`** (ciepły brzoskwiniowo-różowy) jako PEŁNA rampa
  ciała, nie tylko akcent — ART_DIRECTION 3.3 wprost dopuszcza to dla
  assetu, któremu ten odcień należy do tożsamości (przykład z dokumentu:
  "czerwony kapelusz"; tu — różowa świnia). Najciemniejszy stopień rampy
  jest pomijany (`min_st=1`) — czytał się jak siniak, nie jak cień.
- **Uszy OPADAJĄCE, nie postawione** (`ucho_opadajace`, kąt liczony od pionu
  W DÓŁ) — to jest głowna cecha odróżniająca sylwetkę świni od dzika na
  pierwszy rzut oka, obok koloru.
- **Ryjek to TARCZA** (`ryjek()`) — płaski, okrągły dysk z dwiema dziurkami
  nozdrzy, w kolorze `kora`, NIE `akcent_cieply`. Pierwsza wersja rysowała
  dysk tym samym różowym co reszta głowy i przy dwóch ciemnych dziurkach
  czytał się jak DRUGA para oczu, nie jak pysk — wyraźny szaro-brązowy kolor
  usuwa tę dwuznaczność. Dzik ma odwrotny kształt: wydłużony, zwężający się
  ryj (patrz `boar.png` wyżej).
- **Brak kłów, brak grzywy** — oba należą wyłącznie do dzika.
- **Ogonek — ciasna spirala** (`ogonek()`, kilka przesuwanych o promień
  punktów w kolorze `A[1]`), nie prosty kikut dzika. Pierwsza wersja użyła
  koloru bliskiego tonowi futra i ogonek ginął w tułowiu; podniesiony kontrast
  (ciemniejszy stopień rampy) naprawił to bez zmiany kształtu.

### Zwierzęta gospodarskie — `chicken`/`cow`/`pig`/`sheep`, WPIĘTE 2026-08-14

Cztery gatunki, JEDNA klasa encji (`src/entities/FarmAnimal.ts`) — zerowa
rozbieżność zachowania między nimi (idź w losowe miejsce koło spawnu, albo
stój i jedz — ten sam kształt „reached-or-timeout" co `Enemy.patrol`, tylko
bez niczego, co by je goniło), więc `FarmAnimal` przyjmuje konfigurację
assetów + strojenie zachowania + funkcję kluczy animacji jako parametry
zamiast być czterema prawie identycznymi podklasami. `Animations.ts`'s
`createFarmAnimalAnimations` i `Assets.ts`'s pętla ładowania/cięcia są
współdzielone tym samym trybem.

`chicken_walk.png`/`chicken_eat.png` to jedyna para z `public/assets/tem/`
(patrz `docs/referencje_zewnetrzne.md`), która wygraduowała z „materiał
referencyjny" na realnie wczytywany asset — po tej samej randze pomiaru co
`rabbit.png`/`boar.png`. `cow_walk/eat.png`, `pig_walk/eat.png`,
`sheep_walk/eat.png` przyszły już wprost do korzenia `public/assets/`, ale
dostały dokładnie ten sam pomiar zanim cokolwiek je wczytało.

**Wszystkie sześć par: skan kanału alfa (nie oko na miniaturce) potwierdził
czystą siatkę 4×4, ZERO marginesu** (konwencja `items.png`, nie 33px pitch
`Teren.png`/`Nature.png`) — 32×32 dla kury, 128×128 dla krowy/świni/owcy —
wszystkie 16 komórek każdego arkusza niepuste (bounding-box alfy każdej
komórki z osobna, nie sama obecność treści w arkuszu jako całości). Kolumna
= klatka 4-klatkowego cyklu: chodu (`*_walk.png`) albo jedzenia
(`*_eat.png`, głowa opada i wraca w kolejnych klatkach — dziobanie u kury,
skubanie trawy u reszty).

⚠ **Wiersz = kierunek, ale porządek NIE jest ten sam we wszystkich
czterech, i to zostało sprawdzone, nie założone.** `chicken_walk.png` to
**DÓŁ, LEWO, GÓRA, PRAWO** od góry do dołu (potwierdzone wizualnie na
4×-owym renderze). `cow_walk.png`/`pig_walk.png`/`sheep_walk.png` to
**GÓRA, LEWO, DÓŁ, PRAWO** — ustalone przez zestawienie wiersza 0 i wiersza
2 obok siebie: wiersz bez pyska/oczu (widoczny tył zwierzęcia) to GÓRA,
wiersz z pyskiem/oczami to DÓŁ. Inny pakiet źródłowy, inna konwencja —
`ASSETS.<gatunek>.dirRow` niesie mapowanie per gatunek właśnie po to, żeby
błędne założenie tutaj kosztowało jedno pole, a nie cicho zamienione
góra/dół w rozgrywce. We wszystkich czterech **oba boki są narysowane
NIEZALEŻNIE**, nie przez runtime'owe lustro jak `rabbit.png`/`boar.png`.

**Dwa OSOBNE pliki na gatunek, nie dwa pasma jednego arkusza** — inaczej niż
`wolf.png`/`greywolf.png`, gdzie „stan" to `row + dirRow[kierunek]` na
jednej teksturze. Tu „stan" to który plik, więc `ASSETS.<gatunek>` niesie
`walkKey`/`eatKey` zamiast jednego `key`.

**Cienie istnieją dla DWÓCH z czterech gatunków** — `chicken_shadow.png`
(32×128) i `cow_shadow.png` (128×512), obie JEDNA kolumna × 4 wiersze na
dokładnie tym samym rozmiarze komórki co arkusze chodu/jedzenia tego
gatunku (brak `pig_shadow.png`/`sheep_shadow.png` — `FarmAnimal` po prostu
nie rysuje cienia dla tych dwóch, to świadomy zakres dostarczonych plików,
nie przeoczenie). Cięte tym samym `sliceCreatureSheet` co reszta, z
`cols: 1` — indeks klatki na jednokolumnowym arkuszu to po prostu numer
wiersza, czyli dokładnie ta sama wartość co `dirRow`.

⚠ **Wyrównanie cienia zostało zweryfikowane, nie założone z rozmiaru
komórki.** Złożenie klatki chodu krowy z jej pasującym cieniem (te same
współrzędne lokalne klatki, bez przesunięcia) pokazuje cień DOKŁADNIE pod
stopami sprite'a dla każdego kierunku — sprawdzone dla widoku „dół" (cień w
większości ukryty za sylwetką, jak w naturze) i „lewo" (cień w pełni
widoczny jako owalna plama pod nogami). To jest to, co pozwala `FarmAnimal`
rysować sprite zwierzęcia i jego cień w TYM SAMYM (x, y) bez żadnej poprawki
per gatunek. Kształt cienia krowy naprawdę zmienia się z kierunkiem
(zmierzony bbox: ~25×36px zwarta plama dla góra/dół, ~58×8px szeroka elipsa
dla lewo/prawo) — to nie jest jeden kształt wklejony 4×.

13 sztuk stoi w Zagaje: 3 kury koło kurnika (obiekty `"chicken"`/`"kura"`),
2 krowy + **1 byk** na południe od obory (`"cow"`/`"krowa"`,
`"bull"`/`"byk"`), 2 świnie koło (wciąż bezbudynkowego) miejsca Witka
(`"pig"`/`"swinia"`), 3 owce + **1 baran** na ugorze koło Gniewka-pasterza
(`"sheep"`/`"owca"`, `"ram"`/`"baran"`) — każde miejsce ręcznie
zweryfikowane jako wolne od drzew/budynków przez skan warstw kafli samego
`.tmj`, nie założone z nominalnych współrzędnych generatora budynków.
Strojenie zachowania per gatunek: `CHICKEN`/`COW`/`BULL`/`PIG`/`SHEEP`/`RAM`
w `GameConfig.ts`.

### Byk i baran — `bull.png`, `ram_walk/eat.png`, WPIĘTE 2026-08-14

Dwa towarzysze stada, dorzucone tej samej sesji co reszta. Baran to
dokładnie kształt owcy (dwa osobne pliki 512×512, ten sam porządek
GÓRA/LEWO/DÓŁ/PRAWO co `sheep_walk.png`, zmierzony tą samą metodą — nie
domyślony) — jedyna różnica to złociste zakręcone rogi wrysowane w sam
sprite, nie doklejone osobno.

⚠ **Byk NIE ma pary plików jak reszta — `bull.png` to JEDEN arkusz 512×1024,
8 wierszy × 4 kolumny, nie dwa arkusze 512×512.** Zmierzone (skan alfy,
wszystkie 32 komórki niepuste): wiersze 0-3 to cykl chodu o DOKŁADNIE tym
samym kształcie bounding-boxów co `cow_walk.png` (potwierdza ten sam
`dirRow` GÓRA/LEWO/DÓŁ/PRAWO), wiersze 4-7 to cykl skubania — ta sama
progresja opadającej głowy w kolumnach co `cow_eat.png` — doklejony wprost
pod spodem. To jest kształt `wolf.png`/`greywolf.png` (`row = state.row +
dirRow[kierunek]`), nie kształt reszty zwierząt gospodarskich (dwie osobne
tekstury). `Animations.ts`'s `createBullAnimations` to własny, mały
budowniczy dla dokładnie tego układu — ani `createFarmAnimalAnimations`
(zakłada dwie tekstury), ani uogólnienie `createWolfLikeAnimations` (jego
tabela stanów jest otypowana pod `wolf.png` konkretnie) nie pasowały bez
wygięcia na siłę.

`FARM_ANIMAL_KINDS.bull` wskazuje `walkKey` I `eatKey` na TEN SAM klucz
tekstury — celowo: `FarmAnimal` sprawdza `eatKey` tylko pod kątem
prawdziwości (czy w ogóle grać drugą animację), nigdy nie ładuje go jako
osobnej tekstury, więc dwa pola wskazujące jedno miejsce są nieszkodliwe i
oszczędzają osobnego kształtu konfiguracji dla jednego gatunku.

### Koty wioskowe — `cat_black/brown/orange/white-32x48.png`, WPIĘTE 2026-08-14

Piąty gatunek na tym samym silniku (`FarmAnimal`), ale z dwoma realnymi
różnicami wobec kury/krowy/świni/owcy — obie sprawdzone pomiarem, nie
domyślone z istniejącej konwencji.

**Jeszcze INNY porządek `dirRow`, trzeci w tej samej sesji.** Wiersz 0/2
(góra/dół) sprawdza się tak samo jak u krowy — wiersz bez pyska to góra,
wiersz z pyskiem to dół — ale wiersz 1/3 to **PRAWO, LEWO** (odwrotnie niż
u krowy/świni/owcy, gdzie 1/3 to LEWO, PRAWO). Ustalone przez pomiar
x-pozycji czubków uszu (najwyższy nieprzezroczysty piksel w komórce): dla
wiersza 1 uszy siedzą przy x=20/24 (prawa strona 32px klatki), dla wiersza
3 przy x=7/11 (lewa strona) — a nie przez oglądanie miniaturki, bo dwa
profile kota są łatwe do pomylenia na pierwszy rzut oka.

**Brak arkusza jedzenia w ogóle** — `cat_eat.png` nie istnieje, tylko chód
(3 klatki × 4 kierunki). `cat.png` (512×256, kontaktowy arkusz wszystkich
czterech kolorów obok siebie, NIGDY nie wczytywany) ma dodatkową pozę
„leżącą" na kolor, ale te per-kolorowe eksporty jej nie niosą — wyciąganie
jej z niejednolitego arkusza kontaktowego byłoby dokładnie tym rodzajem
zgadywania układu pikseli, przed którym ostrzega reszta tego pliku, więc
tego nie zrobiono. Zamiast tego `FarmAnimalAssetCfg.eatKey` jest
OPCJONALNE — gdy go brak, `FarmAnimal.decide()` zatrzymuje cykl chodu i
zamraża na kolumnie 0 bieżącego kierunku (`dirRow[kierunek] * cols`),
zamiast pozwolić animacji chodu kręcić się dalej na nieruchomym ciele (co
czytałoby się jak poślizg/„moonwalk"). Zweryfikowane w silniku: zamrożone
klatki lądują dokładnie na 0/3/6/9.

**Cztery kolory to cztery OSOBNE tekstury, nie jeden przemalowywany w
locie** (`ASSETS.cat.colors`) — `FARM_ANIMAL_KINDS.cat` to FUNKCJA
(`pickCatVariant`), nie stały zestaw jak u pozostałych czterech gatunków:
losuje kolor przy KAŻDYM wywołaniu. `GameScene`'s pętla spawnu wywołuje ją
osobno na każdy punkt (nie raz na listę gatunku) — inaczej trzy koty z
jednego spawnu wyszłyby identycznym kolorem. Zweryfikowane: trzy koty w
Zagaje wyszły pomarańczowy/brązowy/biały, nie trzy takie same.

`cat_white-32x32.png` (32px klatka, INNY rozmiar niż pozostałe trzy kolory
i niż `cat_white-32x48.png`) to niewykorzystany duplikat — prawdziwy biały
kot już istnieje w rozmiarze pasującym do reszty, więc ten dodatkowy plik
kupiłby tylko niespójność rozmiaru.

3 koty stoją w Zagaje jako luźne, niezwiązane z żadnym konkretnym budynkiem
włóczęgi: koło stodoły/kurnika (myszy przy zbożu), koło studni na placu,
koło zagrody kowala (obiekty `"cat"`/`"kot"`). Strojenie zachowania: `CAT`
w `GameConfig.ts`.

### Ptaki leśne — `birds.png`, WPIĘTE 2026-08-14

Najmniejsza dekoracja otoczenia w grze, i jedyna, która NIE jest
`FarmAnimal` mimo bycia zwierzęciem — inny kształt źródła to wymusił, nie
wybór.

**64×64, czysta siatka 2×2 po 32px — ale, inaczej niż każdy inny arkusz
stworzeń w tym pliku, każda z 4 komórek to ODRĘBNY, nieruchomy ptak** (inny
gatunek/kolor, inna poza), nie klatki jednej animacji chodu. Zmierzone
bounding-boxy czterech komórek się nie pokrywają tak, jak pokrywałyby się
klatki chodu tego samego ptaka — to potwierdza, że to cztery osobne
sprite'y, nie cykl. Więc: brak kierunku, brak stanu chodu/jedzenia, nic do
animowania. `src/entities/Bird.ts` po prostu JEST jedną z 4 klatek
(wylosowaną raz przy tworzeniu) i co jakiś czas przeskakuje (tween pozycji,
nie fizyka) do losowego punktu w małym promieniu wokół miejsca spawnu.

**Samoplanujący się przez `scene.time`/`scene.tweens`, ZERO wywołań
`update()` z `GameScene`.** Każdy skok planuje sam swój następny przez
`delayedCall` → `tweens.add` → `onComplete` planuje kolejny — Phaser sam
sprząta te timery/tweeny przy zamknięciu sceny, więc `GameScene` nie musi
trzymać żadnej listy ptaków do posprzątania (inaczej niż `farmAnimals`).

Postawione w LESIE, nie w wiosce — na wyraźną prośbę autora ("noi birds do
lasu"), nie domysł. 3 sztuki: koło polany startowej gracza, koło ogniska
myśliwego, i w środku lasu przy trakcie — każde miejsce sprawdzone względem
warstw kafli `.tmj`, choć dla ptaka siedzącego W drzewie (bez kolizji na
tej mapie) wymóg czystości jest luźniejszy niż dla zwierzęcia chodzącego po
ziemi. Strojenie: `BIRD` w `GameConfig.ts` (obiekty `"bird"`/`"ptak"`).

### Niedźwiedź, jeleń, lis — `bear/deer/fox_idle/walk/run.png`, WPIĘTE 2026-08-14

`public/assets/tem/Bear|Deer|Fox|Boar|Wolf|Rabbit` przyszły tego samego dnia
jako jeden pakiet (2019, przypuszczalnie gotowy zestaw itch.io — bardzo
niski koszt kolorów, patrz niżej). **Wpięte zostały tylko trzy pierwsze.**
`Boar`/`Wolf`/`Rabbit` mają już w tej grze prawdziwy, głęboko dostrojony
sprite (`boar.png`/`wolf.png`/`rabbit.png`) i mechanikę, której timing
zależy WPROST od liczby klatek obecnego arkusza (patrz notatka o skoku
królika w `rabbit.png`'s sekcji wyżej) — podmiana byłaby osobną, dużą
decyzją, nie tym zadaniem. Zapytane wprost, autor to potwierdził.

**Trzeci kształt arkusza w tej sesji.** `bear_idle/walk/run.png` (i analogicznie
`deer_*`/`fox_*`) to TRZY OSOBNE jednowierszowe paski — jeden kierunek
profilu (zwrócony w LEWO — odwrotnie niż `rabbit.png`/`boar.png`, które są
WŁASNĄ wygenerowaną grafiką tego projektu i patrzą w prawo, potwierdzone
okiem, nie założone), lustrzane przez `setFlipX`. Nie kształt
`ASSETS.chicken` (prawdziwe kierunki przez `dirRow`), nie kształt
`ASSETS.bull` (przesunięcie wiersza na jednej teksturze) — trzy tekstury,
jeden kierunek.

Zmierzone (skan alfy, każda komórka niepusta):
- **Niedźwiedź**: siatka 64px. `bear_idle.png` 768px → **12** klatek,
  `bear_walk.png` 512px → **8**, `bear_run.png` 320px → **5**. Wysokość
  klatki 33px, realna treść ~55-57×29px.
- **Jeleń**: siatka 72px (szersza — poroże potrzebuje miejsca). `deer_idle.png`
  720px → **10** klatek (to naprawdę powolne opuszczanie/podnoszenie głowy,
  nie statyczne stanie), `deer_walk.png` 576px → **8**, `deer_run.png`
  432px → **6**. Wysokość klatki 52px.
- **Lis**: siatka 64px. `fox_idle.png` 384px → **6** klatek, `fox_walk.png`
  512px → **8**, `fox_run.png` 384px → **6**. Wysokość klatki 36px.

**Bardzo niski koszt kolorów — 5-9 barw na plik** (dla porównania: AI-owe
rekwizyty tej samej sesji miały 78-87). To już czysty, płasko cieniowany
pixel art bez antyaliasingu, więc `tools/snap_paleta.py` NIE został
zastosowany — wymuszanie własnej palety na już spójnym, minimalnym zestawie
kolorów byłoby stratą czasu i ryzykiem, nie poprawą.

`Animations.ts`'s `createSingleDirAnimations`/`SingleDirAnimState` buduje
wszystkie trzy z jednej wspólnej funkcji (analogicznie do
`createFarmAnimalAnimations` dla czterokierunkowych).

**Niedźwiedź to prawdziwy `Enemy`** (`src/entities/Bear.ts`, `BEAR` w
`GameConfig.ts`) — patrol/pościg/obrażenia z kontaktu z klasy bazowej,
ŚWIADOMIE bez unikalnej mechaniki (bez szarży, bez stada): taka mechanika to
osobny, zmierzony etap projektowy (patrz metoda w `docs/pajaki_ocena.md`),
a improwizowanie jej w jednej sesji byłoby dokładnie tym, przed czym
ostrzegają własne dokumenty projektu. Niebezpieczny czysto przez liczby —
130 HP, 10-14 obrażeń kontaktowych (`blunt`), powyżej dzika i poniżej
imiennego Szarego na każdej osi — jawnie oznaczone w kodzie jako PIERWSZE
PODEJŚCIE, nie przetestowany balans. Stoi samotnie głęboko w
północno-wschodniej części lasu (2700,500).

**Jeleń i lis to `Critter`** (`src/entities/Critter.ts`, `CRITTER_KINDS`,
`DEER`/`FOX` w `GameConfig.ts`) — kuzyn `FarmAnimal` (ta sama pętla
„idź losowo albo stój" co `Enemy.patrol`), ale świadomie osobna klasa: brak
`dirRow`, jeden kierunek lustrzany przez flipX, brak cienia. Bez HP, bez
agresji, bez obrażeń z kontaktu — prawdziwa dzika zwierzyna, nie
inwentarz, nie zagrożenie. `runKey` obu gatunków jest wczytany i wycięty,
ale NIEUŻYWANY przez `Critter` — otoczenie nigdy nie musi biegać, tylko
`Bear` (prawdziwy `Enemy`) czyta stan biegu. 2 jelenie + 2 lisy rozrzucone
po lesie, pozycje sprawdzone względem `trees-base`.

### `pole_tileset.png` — uprawy. ⚠ NIE jest szczelnym tilesetem gruntu

`tools/build_pole.py` (cięcie z `pole.png`), katalog semantyczny
`docs/pole.json` (`tools/katalog_pole.py`). **461×395, 14 kolumn × 12
wierszy, kafel 32 px, skok 33 px, 163 kafle** (5 komórek ostatniego wiersza
pustych) — inna siatka niż `Teren.png`/`Nature.png`, które mają 19 kolumn.

**Arkusz miesza dwie różne rzeczy: kafle GRUNTU i same ROŚLINY na
przezroczystym tle** — bo `build_pole.py` tnie **etykietowaniem spójnych
obszarów**, więc „kafel" to tyle, ile udało się połączyć w jeden komponent.
Krycie (udział pikseli nieprzezroczystych) rozkłada się ciągle od 0.12 do
1.00. `docs/pole.json` nadaje więc każdemu kaflowi `rola`:
- **`grunt`** (krycie ≥ 0.95, **68 kafli**) — zakrywa własną komórkę, wolno
  kłaść jako lite pole,
- **`nakladka`** (95 kafli) — WYMAGA kafla ziemi pod spodem.

⚠ **Dopełnianie krawędzi (`_dopelnij_krawedzie`) jest tym, co czyni ten
arkusz bezpiecznym do ręcznego malowania w Tiled — nie usuwaj go.** Kafel
jest skalowany jednolitą skalą, potem centrowany w poziomie i dosuwany do
dołu; po zaokrągleniu `round(w * skala)` wychodzi często 29–31 px zamiast 32,
więc zostaje 1–3 px przezroczystości przy krawędzi. Na mapie to **włosowa
szczelina, przez którą widać trawę spod spodu** — zgłoszone wprost („kafelki
działek nie pasują"). Skrypt rozciąga skrajne piksele w ten margines: kafli w
pełni kryjących **11 → 56**, `grunt` **38 → 68**, przy zerowej zmianie
oryginalnej treści (weryfikowane pikselowo względem kopii sprzed zmiany).

Trzy rzeczy, na których ta funkcja się wywróciła, zanim zaczęła działać —
wszystkie wrócą przy każdym arkuszu ciętym komponentami:
- **Nie wolno iść po obrysie nieprzezroczystym.** Wersja licząca `xs.min()`
  dopełniała tylko pełne puste pasy i przepuszczała najczęstszy przypadek:
  kolumnę **częściowo** przezroczystą. Kafel id6 miał w kolumnie 0
  dwadzieścia osiem pustych pikseli na trzydzieści dwa, więc `xs.min()` = 0,
  warunek nie działał, a szczelina zostawała przez 7/8 wysokości kafla.
  Poprawnie: kopiować od bezpośredniego sąsiada.
- **⚠ Bramka „czy to w ogóle grunt" jest OBOWIĄZKOWA.** Kuszące i
  **nieprawdziwe** założenie: „kopiowanie od sąsiada samo się zabezpiecza, bo
  w marginesie rośliny sąsiad też jest przezroczysty". Trzyma się tylko
  dopóki roślina nie dotyka krawędzi — a część dotyka. Bez bramki id90
  dostał poziomą smugę wyciągniętą z kwiatu aż do prawej krawędzi, a id147
  zielony słupek na całej lewej. Widać to natychmiast na porównaniu
  przed/po i wcale nie widać w raporcie liczbowym.
- **Rozróżnienie jest ostre, nie arbitralne**: kafel gruntu ma środkowy blok
  16×16 wypełniony w 0.99–1.00, każda roślina ma go najwyżej 0.78 (najgęstsza
  `nac` — 0.78, sadzonka — 0.32). Między grupami jest pusta przerwa, więc
  próg 0.99 nie balansuje na niczyjej granicy.

Zostaje świadomie niedopełnione: **marginesy szersze niż 3 px**. To już nie
zaokrąglenie skali, tylko prawdziwy kształt — np. `przejscie_ziemia_1` (id7)
ma 6 px pustki u góry i zostaje `nakladka`.

⚠ **Sam pas krawędzi NIE wystarcza do rozpoznania kafla brzegowego — to był
realny błąd tego katalogu.** Kępa darni siedząca w ROGU zajmuje kilkanaście
pikseli z ~124-pikselowego pasa krawędzi, czyli około 0.15 — poniżej progu
0.25. Skutkiem **id6** (zielony blok w prawym dolnym rogu) i **id11** (to samo
w lewym dolnym) — para kafli **narożnych** — były opisane jako czysty `ugor`,
czyli jako środek niwy. Jeden z nich został na tej podstawie wmalowany w
środek zagonu w Zagajach i widać go tam było jako kępę trawy w polu.
**Zgłoszone przez użytkownika z samego zrzutu — żadna liczba w raporcie tego
nie pokazała.** Katalog mierzy teraz osobno rogi (blok 10×10, próg 0.12) i
wystawia pole `naroznik`.

Praktyczna konsekwencja przy malowaniu: **do środka niwy wolno użyć wyłącznie
kafla z `czysty: true`** (zero zielonych pikseli w ogóle), a takich jest w
całym arkuszu **cztery**: `ugor_bruzdy_pion_2/4/5` (id18/20/21, bruzda
pionowa) i `ugor_bruzdy_poz_2` (id2, pozioma). Wszystko inne wniesie zieleń w
pole. `katalog_pole.py` wypisuje tę listę na samej górze raportu.

Katalog dzieli pracę tak, żeby nikt nie zgadywał dwa razy — **mierzone przy
każdym uruchomieniu**: obrys, krycie, `rola`, udziały barwne, `trawa` (przy
których krawędziach kafel styka się z darnią), `naroznik` (w których rogach)
i `czysty`. **Zapisane raz z oglądania**: gatunek uprawy i faza wzrostu
(`kapusta` sadzonka→młoda→dojrzała, `zboze` zielone/dojrzałe, `korzeniowe`,
`len`, `nac`, `pedy`, `sciernisko`, `ugor`) oraz kierunek bruzd.

Dwie pułapki pomiarowe, obie kosztowały fałszywe wyniki zanim zostały
naprawione, i obie wrócą przy każdym arkuszu ciętym komponentami:
- **Pas „4 px od krawędzi KAFLA" trafia w pustkę.** Przy obrysie 32×25 darń
  zaczyna się dopiero w 4. wierszu obrazu, więc połowa kafli brzegowych
  wychodziła jako środkowe. Trzeba mierzyć **wewnątrz obrysu**, nie w
  prostokącie komórki.
- **Kierunku bruzd NIE da się tu wykryć automatem** — próbowane i odrzucone.
  Wariancja rzędów łapie pas trawy (kafle przejściowe wychodziły „najbardziej
  bruzdowane" z całego arkusza), a analiza częstotliwości łapie rytm ROŚLIN
  (najwyższe wyniki: kapusta i rzepa, nie zaorana ziemia). Dlatego kierunek
  jest w tabeli, czytany okiem.

Połówki `-over` (`pole_over_*.png`) to nadal **17 luźnych plików**, nie
arkusz — Phaser wiąże jeden obraz na tileset, więc wysokie zboże nie może
mieć warstwy `-over`, dopóki ktoś ich nie spakuje (patrz `CLAUDE.md`).

### `gpt-wheel.png` + `kolo_mlynskie.png` — koło wodne młyna

`gpt-wheel.png` (163×104, generacja GPT image) to **źródło**;
`kolo_mlynskie.png` (192×96) to gotowy asset, wyprodukowany przez
`tools/build_kolo_z_grafiki.py` (bez flag = raport, `--zapisz` pisze,
`--podglad KAT` daje przed/po). Wpięty jako `ASSETS.waterwheel` +
`src/entities/WaterWheel.ts`.

Dwa widoki, pocięte na nazwane klatki (NIE `load.spritesheet` — mają różne
rozmiary, więc nie ma jednego `frameWidth`, który je opisuje):

| klatka | rozmiar | co to |
|---|---|---|
| `lico` | 128×96 (4×3 kafle) | koło na wprost — to się kręci |
| `bok` | 64×96 (2×3 kafle) | to samo koło z boku, z czopem osi, do zamontowania płasko przy ścianie młyna |

⚠ **Klatka `lico` ma 128 px szerokości dla koła o 99 px i to jest celowe.**
Rysunek mierzy 99×96, czyli o trzy piksele więcej niż trzy kafle. Przycięcie
do 96 obcięłoby końcówki dwóch skrzynek czerpakowych, a skalowanie pixel artu
jest zabronione wprost (§4.1 `ART_DIRECTION`). Koło siedzi więc wyśrodkowane na
płótnie 4×3 z przezroczystymi marginesami — co przy okazji stawia piastę pół
piksela od środka klatki, i **to jest to, co pozwala obracać sprite wokół
własnego origin bez bicia**.

⚠ **Całe źródło ma alfę ≤ 254** (maksimum w pliku to 254, minimum 1) — ani
jeden piksel nie jest w pełni kryjący. Artefakt generatora, nie zamysł. Bez
binaryzacji (próg 128) koło prześwitywałoby trawą.

**Kręci się tweenem na `angle`, nie klatkami** (`WATERWHEEL.revolutionMs`,
7 s na obrót). Źródło to jedna narysowana klatka, więc klatki obrotu można by
zrobić tylko obracając pixel art poza osią 90°, co szarpie szprychy — czyli
niszczy dokładnie ten detal, po który tę grafikę wzięliśmy. Tween nie kosztuje
kodu w `update()` i zatrzymuje się sam, gdy panel pauzuje scenę.

**Bez kolizji, i to nie jest przeoczenie**: ciało Arcade jest prostokątem
osiowym i **nie obraca się razem ze spritem**, więc wirujący collider byłby
nieruchomym kwadratem wielkości bounding boxa — zły w każdej klatce.

Stawiane **wyłącznie z punktu w Tiled** o nazwie `kolo` / `kolo_mlynskie` /
`waterwheel` (`TiledMap.readSpawns` → `GameScene`). Zero fallbacku
proceduralnego — koło należy do konkretnego młyna nad konkretną strugą, a
zgadywanie miejsca powtórzyłoby wpadkę z ogniskiem na pustej łące. Żadna mapa
nie ma jeszcze takiego punktu, więc dziś nic się nie pojawia.

### `xd.png` + `znaki.png` — drogowskazy, tablice, krzyże, strach, pranie

`xd.png` (128×128 = 4×4 kafle) to **źródło**, `znaki.png` to gotowy arkusz
w palecie (27 kolorów, wszystkie z `docs/paleta.json`). Generator:
`tools/build_znaki.py`.

**WPIĘTE (2026-08-13)** — pierwszym użyciem jest **drogowskaz strzałkowy
(w0k0) przy obu bramach między mapami**. Arkusz jest zarejestrowany jako
tileset `Znaki` (firstgid **514** w lesie, **739** w wiosce — dopisany na
KOŃCU, bo wciśnięty w środek przenumerowałby wszystko po sobie) i malowany
na własnej warstwie `znaki`, wstawionej przed `trees-base`. ⚠ **Siatka jest
32px BEZ przerwy** (`spacing: 0`), inaczej niż Teren/Nature z ich pitchem
33px — wpis tilesetu w `.tmj` musi to mówić, albo kafle wyjdą przesunięte.
Reszta arkusza (tablica ogłoszeń, krzyże, strach, pranie) wciąż czeka.

⚠ **Co przy okazji zmierzono i co jest pułapką dla następnego rekwizytu:**
`wiata_slup_1` (id 87) i `wiata_1` (id 86) mają **1024/1024 pikseli
nieprzezroczystych** — to elementy pasa ściany wiaty z zapieczonym ciemnym
wnętrzem, a nie wolnostojące słupy. Postawione na trawie jako „słupki bramy"
dały dwie czarne dziury przy drodze. Widać to tylko na renderze; żaden
raport tego nie pokazywał. Prawdziwą nakładką jest `zagroda_*` (~334/1024)
i to jej użyto: `zagroda_2` po zachodniej stronie, `zagroda_0` po wschodniej,
żeby SŁUPY stały przy drodze, a żerdzie odchodziły od niej.

Trzynaście obiektów zamykających trzy pozycje z `docs/wioska_plan.md` §7.3:
**B8** (sznur z praniem), **B10** (tablica ogłoszeń), **B11** (kapliczka).

| kafel | co | rozmiar |
|---|---|---|
| w0k0, w0k1 | drogowskaz strzałkowy, drogowskaz tablicowy | 1×1 |
| w0k2, w1k2 | krzyż przydrożny drewniany / kamienny, na kopczyku | 1×1 |
| w0k3+w1k3 | strach na wróble | 1×2 |
| w1k0, w1k1 | tablica ogłoszeń pusta / z kartkami | 1×1 |
| w2k0–k2 | stelaż (dwa słupki + drąg) | 3×1 |
| w3k0–k2 | pranie na drągu | 3×1 |

⚠ **Stelaż i pranie to para `buildings` / `buildings-detale`, nie dwa
osobne rekwizyty.** Drąg leży w OBU wierszach dokładnie na tej samej
wysokości (y=8, zmierzone) — w3 nakłada się na w2 i dopiero razem dają pełny
sznur z praniem. Postawione osobno: w2 to goły stelaż, w3 to pranie wiszące
w powietrzu.

### Metoda sprowadzania cudzej grafiki do palety (oba powyższe)

Wspólna dla `build_znaki.py` i `build_kolo_z_grafiki.py`, i **inna niż
`snap_paleta.py`**, bo tamten szuka po prostu najbliższego koloru.

**Rampę wybiera najbliższy sąsiad w RGB** (jaki to materiał — drewno, zieleń,
czerwień, kamień, płótno), **a stopień rampy — jasność ważona populacją**
(jaki to walor). Dwa powody, oba zmierzone:

- ⚠ **Sam najbliższy sąsiad spłaszcza rysunek.** Źródło znaków ma **sześć**
  poziomów drewna (#ccbd7b 186 → #573726 63); najbliższy sąsiad, nawet przy
  zbiorze `drewno`+`kora`+`neutralne`, wrzuca je na **cztery** — `#986a20`
  i `#85581b` sklejają się na `drewno[2]`, a **kontur `#573726` ląduje na tym
  samym `drewno[1]` co `#684415`, czyli znika**. Przy rekwizycie, którego cała
  wartość polega na tym, że został ładnie narysowany, to strata dokładnie
  tego, po co się go bierze. Dlatego rampa drewna jest **rozszerzona w dół
  o `kora[0]`** — sześć poziomów źródła potrzebuje sześciu docelowych.
- ⚠ **Ważenie populacją nie jest drobiazgiem — bez niego rozsypują się
  krzyże.** Zwykła ranga (i-ty z n kolorów) jest poprawna dla czystej palety
  (drogowskaz ma 8 kolorów) i katastrofalna przy antyaliasingu: krzyże mają
  **88 i 96 kolorów**, w większości pojedyncze piksele krawędzi. Równy udział
  w rampie wypycha półtony na skrajności — kamienny krzyż wyszedł bladą,
  niebieskawą sztabką. Ważenie sprawia, że kolor trzymający 40% pikseli
  zajmuje szeroki pas rampy, a samotne piksele doklejają się do sąsiadów.
- ⚠ **Zbiór ramp jest PER OBIEKT** (ta sama lekcja co w `snap_paleta.py`:
  przy najbliższym sąsiedzie cała kategoria koloru potrafi zniknąć w obcej
  rampie). Skrajny przykład: **krzyż kamienny nie dostaje rampy `kamien`** —
  jasność jego źródła to **28–115**, a `kamien` zaczyna się dopiero od **75**
  i sięga 196, więc źródło w całości leży poniżej jej środka i rozciągnięcie
  go rozjaśniało. Siedzi na `neutralne` (18–228). Raport krzyczy, gdy któraś
  rampa dostała zero pikseli — wtedy albo była zbędna, albo (gorzej) jej
  materiał wchłonęła sąsiednia.

**Alfa półprzezroczysta = cień, nie antyaliasing.** Sprawdzone: siedzi pod
obiektami, nie na krawędziach. Sprowadzana do konwencji projektu z
`kafel_zagroda` (`neutralne[0]` przy alfie 110), poniżej progu 30 kasowana,
żeby nie została mgiełka.

### `suszona_skora.png` — suszona skóra na stelażu, WPIĘTA 2026-08-14

Gotowy rekwizyt (nie arkusz do cięcia) — skóra rozciągnięta do suszenia na
ramie z gałęzi, stoi koło chaty myśliwego w lesie (przy jego wschodniej
ścianie, obiekt `"suszona_skora"` we `forrest.tmj`). Źródło od ChatGPT
(`suszona-skora.png` w korzeniu `public/assets/`, 123×123, 52 kolory
antyaliasingu) — dokładnie problem, o którym mówi nagłówek
`tools/snap_paleta.py`: obcy rekwizyt „nie siada obok reszty wsi", dopóki
nie przejdzie przez paletę świata.

**Kolejność miała znaczenie: najpierw snap koloru, DOPIERO POTEM przycięcie
i pomniejszenie** — snapowanie na już pomniejszonym obrazku wprowadziłoby
piksele spoza palety (uśrednienie przy downsamplingu), snapowanie na
źródle i pomniejszanie NEAREST tego wyniku trzyma finalne piksele
dokładnie na kolorach rampy. Trzy kroki:

1. `tools/snap_paleta.py --tylko suszona --zapisz` → `suszona-skora_paleta.png`,
   52→11 kolorów. Zmierzone rampy (bez zgadywania — patrz metoda w
   nagłówku skryptu): `akcent_cieply` (ciemna czerwień → ciepły złoty) na
   skórę, `drewno`+`kora` na stelaż z gałęzi, ciemny koniec `neutralne` na
   kontur (zmierzony czysty `#000000`, 143px). Raport: **żadna rampa nie
   dostała zera pikseli** — cztery użyte, cztery potrzebne.
2. Przycięcie do bounding-boxa alfy (marża źródła była **3px**, nie warta
   zachowania jako pustej przestrzeni w budżecie 2×2 kafli).
3. Pomniejszenie `Image.NEAREST` do **64×64** — maksymalny footprint, o jaki
   proszono (2×2 kafle po 32px). Sprawdzone na 8×-owym renderze: cienkie
   sznurki wiążące skórę ze stelażem PRZETRWAŁY pomniejszenie, nic się nie
   rozpadło na pojedyncze piksele.

`ASSETS.driedHide` — pojedynczy statyczny obrazek, ten sam „gotowy komplet,
bez arkusza do cięcia" tryb co `well`/`campfire`; brak generatora
placeholdera, ta sama historia „brakujący plik po prostu nic nie rysuje".

### Ule (kłody bartne) — trzy warianty, SPALETOWANE 2026-08-18, jeszcze NIE wpięte

Materiał od ChatGPT (`ul00.png`/`ul01.png`/`ul02.png`, korzeń
`public/assets/`, potwierdzone przez autora), przeznaczenie: pasieka Doroty
Zielarki, `docs/wioska_plan.md` B12 (6 kłód bartnych, dziś ⏳). Ten sam
gotowy-komplet tryb co suszona skóra/strach na wróble — 43–48 kolorów
każdy, prawdziwa alfa (mediana biegu 1px, sprawdzone przed czymkolwiek
innym) — i ten sam brak znacznika `gpt-` w nazwie co reszta plików z tej
sesji dostarczonych bez prefiksu.

`tools/snap_paleta.py --tylko ul00/ul01/ul02 --zapisz` →
`props/ul00_paleta.png` / `ul01_paleta.png` / `ul02_paleta.png`, 50→16 (ul00),
50→16 (ul01), 45→15 (ul02) kolorów. Zmierzone rampy: kłoda i strzecha to
ten sam rdzawo-brązowy zakres co `studnia-gpt.png` (`kora`+`drewno`+`ziemia`
na drewno, `akcent_cieply` na strzechę), ciemny koniec `neutralne` na
kontur. **Pierwsze realne użycie `akcent_zlocisty` poza gruszką** — pszczoły
(2–8 px na plik, czysty nasycony żółty) mapują się na nią z dystansem
60–70; przy tak małej liczbie pikseli nie uznane za warte jawnego wyjątku
(w przeciwieństwie do ziarna w `worek-z-ziarnem.png`, które miało dominującą
masę pikseli w kolorze bez dobrego dopasowania). Raport: żadna z sześciu
ramp w zbiorze nie dostała zera pikseli w żadnym z trzech plików.

**Nie wpięte jeszcze do `GameConfig.ts`/`DECOR_PROPS`/żadnej mapy** — trzy
warianty czekają na decyzję, czy stają jako grupa przy chacie Doroty (jak
`wioska_plan.md` B12 przewiduje) czy gdzieś indziej.

### Stóg siana (podmiana), strach na wróble, studnia (podmiana) — WPIĘTE 2026-08-14

Trzy kolejne rekwizyty od ChatGPT tego samego dnia, ten sam przepis co
suszona skóra: `tools/snap_paleta.py` NAJPIERW, wpięcie POTEM.

**`stog_siana.png`** zastępuje stary kaflowy rekwizyt `stog_0..3`
(`Buildings.png`, `docs/budynki.json`) w zagrodzie Dobka — jedynym miejscu,
gdzie ten kafel 2×2 kiedykolwiek stał (`village-zagaje.tmj`, kafle
28-29/49-50). Kafle WYCZYSZCZONE z warstwy `buildings-detale` (ustawione na
0), a w ich miejscu stoi jeden punkt `"stog_siana"`. Same kafle ZOSTAJĄ w
`Buildings.png` — usuwanie z współdzielonego arkusza grozi przenumerowaniem
wszystkiego po nim, dokładnie to samo ryzyko, co przy DODAWANIU kafla.
Źródło: `stog-siana.png`/`stog_siana_paleta.png` (już scommitowane wcześniej,
pierwotnie NIE miały zastąpić kafla kitowego — ta decyzja się zmieniła).
`stog_siana.png` to `stog_siana_paleta.png` przeskalowany (`Image.NEAREST`,
zachowane proporcje) do **64×56**, pasujące do starego footprintu 2×2 kafli
bez zniekształcenia do kwadratu.

**`strach_paleta.png`** (ze `strach.png`, 57×67, 78 kolorów) stoi w
południowej niwie żytniej (`wioska_plan.md` §4.5, kafel 35/80 —
zweryfikowane bezpośrednio w warstwach `pola`+`uprawy`, obie niepuste w tym
miejscu). Zmierzone rampy: `akcent_cieply` (złota słoma), `piasek` (worek na
głowę/twarz), `drewno`+`kora` (drewniany krzyż), `neutralne` (ciemny
czerwono-brązowy kontur).

**`studnia-gpt_paleta.png`** (ze `studnia-gpt.png`, 62×66, 87 kolorów)
ZASTĘPUJE `studnia_zlozona.png` jako `ASSETS.well` — ma strzechę, która
pasuje do „cała wieś jest kryta strzechą" lepiej niż stary, goły kamienny
cembrowin. Zmierzone rampy: `akcent_cieply` (złoto-pomarańczowy dach),
`drewno`+`kora` (słupy i belka), `kamien` (cembrowina), `neutralne`
(cień pod okapem — sprawdzone: szaro-niebieskie tony NIE są `akcent_chlodny`,
za mało nasycone na fiolet, to cień, nie kolor materiału). Zachowany w
oryginalnym rozmiarze — ta sama zasada „rysowane w skali, nie powiększane"
co reszta komentarza `ASSETS.well`. `studnia_zlozona.png` zostaje na dysku,
nieużywany, tak jak `pig.png`.

### Cztery drobiazgi przyrodnicze — `pniak_z_siekiera`/`grzyby`/`brzeg_stawu`/`lilia_wodna`, WPIĘTE 2026-08-14

Ostatnie, co zostało z `public/assets/temp/` — paczki referencyjnej
przejrzanej i **skasowanej** po przejęciu (pełny werdykt, w tym czego NIE
wzięto i dlaczego, w `docs/referencje_zewnetrzne.md`). Wybrane po jednym
kryterium: **czy wypełniają dziurę, której nic w grze nie pokrywa.** Reszta
tamtego arkusza (drzewa, krzaki, kwiatki, ławka, drogowskaz, sąg drewna,
drobne kamienie) miała już realny odpowiednik w `Nature.png`/`lawka.png`/
`znaki.png`/`drewno_porabane.png`/`kamienie.png`.

⚠ **Każdy wymagał izolacji przez connected-component labelling (scipy
`ndimage.label`), nie prostokątnego przycięcia.** Sprite'y na arkuszu stoją
tak blisko, że prostokąt łapał 6-8-pikselowe skrawki sąsiada — grzyb i
lilia oba wyszły z takim ogonem. Przy 14×19px tego nie widać na oko, a w
grze byłby to pływający artefakt obok rekwizytu.

⚠ **Lilia obnażyła realną dziurę w palecie: NIE MA rampy różowej.**
Snapowany na `akcent_cieply` (jedyna czerwonawa rampa) koralowy kwiat
wyszedł **pomarańczowy** i przestał czytać się jak lilia — zaczął jak
nagietek. `akcent_chlodny` sprawdzone i odrzucone (to fiolety, jeszcze
dalej). Rozwiązane czterema jawnymi wyjątkami kolorów w `CELE` — ten sam
mechanizm i ten sam powód co ziarno w `worek-z-ziarnem.png`. Dokładnie ta
pułapka, którą opisuje nagłówek `snap_paleta.py`: przy najbliższym sąsiedzie
cała kategoria koloru potrafi zniknąć.

**Raport zrobił swoje trzy razy — i za każdym razem coś usunięto, nie
zostawiono „na wszelki wypadek":** `kora` dostała zero pikseli przy pniaku
(wchłonęło ją `drewno`) i przy grzybach; `kamien`+`neutralne` dostały zero
przy brzegu stawu (wierzch okazał się czysto piaskowy, mimo że na oko
wygląda jak głaz). Wszystkie trzy wypadły ze zbiorów.

Efekt uboczny na plus: turkusowa woda `brzeg_stawu.png` po snapie wpadła w
rampę `woda` i **teraz pasuje do rzeki w grze**, czego oryginalny turkus nie
robił — podmiana koloru była tu ulepszeniem, nie stratą.

Grzyby: sam `akcent_cieply` ścisnął sprite z 28 kolorów do **dwóch**, co
przy 14×19px czyta się płasko; dołożony `piasek` daje najjaśniejszemu
refleksowi własny stopień (28→3).

Rozstawione: pniak przy chacie myśliwego (las) i na podwórzu przy stodole
(wioska), 3 kępki grzybów na runie leśnym, 2 głazy przy brzegu rzeki,
2 lilie na wodzie — każde miejsce sprawdzone względem warstw kafli `.tmj`
(dwa pierwsze wytypowane spoty odpadły, bo stało na nich drzewo).

### Pająki — dwa gatunki, ZERO plików

Ani `Pająk sieciarz`, ani `Skoczek jadowity` nie ma PNG-a. Obie tekstury (plus
pocisk sieci) są **zawsze** generowane w `src/core/Assets.ts` —
`makeSpiderPlaceholder` / `makeVenomSpiderPlaceholder` / `makeWebPlaceholder`,
sterowane blokami `ASSETS.spider` / `.venomSpider` / `.web`, które jako jedyne
w tym pliku nie mają `key`/`path`. Wrzucenie `assets/spider.png` i wpięcie
prawdziwej ekstrakcji to osobna robota; gwarancja „gra zawsze się uruchamia"
działa tak czy tak.

⚠ **Skoczek NIE JEST sieciarzem w innej skali, i to jest reguła, nie
preferencja** — ta sama, przez którą Szary dostał własny arkusz zamiast
powiększonego wilka (patrz `greywolf.png` wyżej): dwa rozmiary jednego sprite'a
czytają się jako perspektywa, nie jako dwa stworzenia. Różnice są celowo w
sylwetce i w kolorze, bo przy 24–28 px nic więcej nie zostaje:

| | sieciarz | skoczek |
|---|---|---|
| klatka | 28×22 | **24×18** |
| korpus | ciemny fiolet (`0x3a3340`) | ziemisty brąz (`0x5c4a28`) |
| odwłok | ciemny | **jadowicie zielony** (`0x7d9b33`) |
| odnóża | wyżej, rozstawione — „wisi w sieci" | niżej i szerzej — „przyczajony do skoku" |
| zieleń jadu | tylko w oczach (pasuje do sieci) | **na ciele** |

Tell ukąszenia to tint (`bite.windupTint`), więc jasne piksele oczu są celowo
jedynym mocnym akcentem — na wytintowanej sylwetce muszą dawać czytelny odczyt.

### `ui/slot_glyphs.png` — POJEDYNCZE glify slotów, WPIĘTE 2026-09-11

⚠ **NASTĘPCA `slots.png` w roli lalki.** Tamten obrazek niósł CAŁY układ
(krata 3×4, bok 32 px, stała kolejność), więc liczba slotów była własnością
pliku PNG i każdy nowy slot wymagał przemalowania grafiki. Tu jest jeden glif
na klatkę, tło rysuje panel, a układ jest danymi w `src/ui/EquipLayout.ts`.

| | wartość |
|---|---|
| rozmiar | 256×64 |
| krata | 8 kolumn × 2 wiersze po **32 px** |
| klatek użytych | **13** (reszta kraty pusta) |
| treść | **biała maska na alfie 0**, tintowana w silniku |

Kolejność klatek (`ORDER` w `tools/build_slot_glyphs.py`, ten sam porządek
czyta `EQUIP_CELLS[].glyph`): `neck 0 · head 1 · shoulders 2 · chest 3 ·
gloves 4 · belt 5 · legs 6 · boots 7 · ring 8 · utility 9 · weapon 10 ·
offhand 11 · swap 12`.

⚠ **Indeks klatki jest ADRESEM.** Przestawienie `ORDER` bez przejrzenia
`EQUIP_CELLS` niczego nie wywali — po prostu da pasowi glif nogawic.

⚠ **Dziewięć glifów jest WYCIĘTYCH z `slots.png`, cztery narysowane**
(`boots`, `shoulders`, `belt`, `swap`). Wycinanie idzie **progiem LOKALNYM**
(piksel kontra ten sam kafel rozmyty gaussem r=4,5), a nie stałym: kafel źródła
ma winietę od 68 (suma RGB) w lewym górnym rogu wnętrza do 146 w prawym dolnym,
więc próg z mediany całego kafla brał cały ciemny róg za glif — w masce lądowała
litera „L" wzdłuż górnej i lewej krawędzi, **identycznie na wszystkich
dziesięciu kaflach**.

⚠ **`boots` jest rysowany, choć w źródle JEST.** Tamten glif to dwa WYPEŁNIONE
buty, a nie kontur; model tła rozmywa się wtedy razem z wypełnieniem i maska
wychodzi połamana (lewy but rozpadał się na trzy kawałki). Reszta dziewięciu to
kontury i wychodzą czysto.

⚠ **Wnętrze wcinane o 3 px, nie o `origin` z configu.** `origin` (4) wskazuje
pierwszy piksel za kratą, ale kafel ma jeszcze własny cień wewnętrzny szeroki na
~2 px — zmierzone: kolumny i = 0..1 mają stałe 33, i = 2 dopiero 45–63.

### `ui/slots.png` — ramka lalki ekwipunku, WPIĘTA 2026-08-15

⚠ **Od 2026-09-11 NIE JEST już rysowany przez grę.** Został ŹRÓDŁEM, z którego
`tools/build_slot_glyphs.py` wycina `slot_glyphs.png` przy każdym przebiegu —
i dlatego zostaje w repo oraz dalej jest wczytywany (`ASSETS.equipDoll`).
Wszystko niżej opisuje ten plik jako źródło; opis „panel kładzie obrazek raz"
opisuje stan sprzed tej daty.


Pierwszy asset czysto interfejsowy w projekcie i dlatego jedyny lokator
katalogu `ui/`. Generuje go `tools/build_slots.py` ze **źródła narysowanego
ręką autora** (`sloty.png` w korzeniu) — 10 z 12 kafli to jego glify skopiowane
piksel w piksel, przestawione na inne pozycje.

**Zmierzone (skan alfy + profil jasności), nie zgadnięte:**

| | wartość |
|---|---|
| rozmiar | 107×140 |
| siatka | 3 kolumny × 4 wiersze |
| podziałka | **33 px** |
| wnętrze kafla | **32×32** — dokładnie tyle, co ikona z `items.png` |
| linie kraty | x = 3/36/69/102, y = 3/36/69/102/135 |
| alfa | **217 na całej treści, nie 255** |

⚠ **Półprzezroczystość jest cechą, nie usterką.** Arkusz ma leżeć na tle
panelu (`UI.bg`) i się w nie wtapiać; „naprawienie" alfy do 255 zrobi z niego
naklejkę.

⚠ **To JEDEN obrazek, nie arkusz do pocięcia.** Linia kraty jest WSPÓLNA dla
dwóch sąsiednich kafli — jedna kolumna pikseli rozdziela oba. Pocięcie na 12
tekstur albo zdublowałoby każdą taką linię, albo zostawiło szew. Panel kładzie
obrazek raz i nakłada na niego własne prostokąty (trafienia, obramowanie
jakości, podświetlenie celu).

⚠ **Rysowany jest w skali ×2 (kafel 64 px), i to jest wymuszone przez sąsiada.**
Siatka plecaka stoi obok, więc oba pola muszą być równe; 32 → 52 px to mnożnik
1,625, czyli rozmyty pixel-art, więc to siatka zeszła do 64, a nie lalka do 52.
Skala całkowita = ostro. To samo dotyczy ikon przedmiotów (32 px → ×2).

**Trzy rzeczy, które generator musiał rozwiązać, i każda kosztowała podejście:**

1. **Źródło jest KRZYŻEM (9 kafli), cel PROSTOKĄTEM (12).** Brakujące
   narożniki powstają przez **odbicie lustrzane lewego górnego** — legalne
   tylko dlatego, że symetria fazy została zmierzona (lewa 10/91/29/87, prawa
   86/29/90/10, różnica ≤1), a nie założona.
2. **Czyste tło kafla trzeba było ODTWORZYĆ**, bo żaden kafel źródła nie jest
   pusty. Mediana z 9 kafli sama nie wystarcza: **90 pikseli ma glif w co
   najmniej 5 z 9**, więc tam mediana JEST glifem. Te miejsca są domalowywane
   z mediany czystych pikseli tego samego wiersza, a osobne, drugie sito
   przycina pojedyncze ciemne resztki — nie dlatego, że jedna byłaby widoczna,
   tylko dlatego, że ta sama trafiłaby w TRZY kafle naraz (spodnie + dwie
   mikstury) i przestałaby czytać się jak ziarno, a zaczęła jak smuga.
3. **Nowe glify rysuje się KONTUREM, nie bryłą.** Sprawdzone przed rysowaniem,
   wydrukiem ASCII tuniki i butów ze źródła: każdy glif to pusty w środku obrys
   1–2 px, ciemniejszy od tła o ~15–20 luminancji, z rzadkimi jaśniejszymi
   pikselami jako fazką. Wypełniona sylwetka odcinałaby się od reszty.

Nowe są dokładnie **dwa glify — spodnie i fiolka** (ta druga użyta dwa razy),
plus pierścień skopiowany na drugi palec. Glif „4 pionowe słupki" z lewego
górnego rogu źródła **wypadł** — nie odpowiada niczemu w grze.

```bash
python tools/build_slots.py                    # zapis arkusza + raport
python tools/build_slots.py --podglad p.png    # + podgląd 6× NA TLE PANELU
```

Podgląd składa arkusz na `UI.bg` celowo: ocenianie półprzezroczystej grafiki
w próżni nie ma sensu.

### Pozostałe

`Character.png`, `NPC.png`, `items.png` — **nietknięte**, opisane w historii
projektu. Uwaga: mają własne palety, niezgodne z paletą projektu (`Nature` i
`Character` nie miały ani jednego wspólnego koloru). Postacie są świadomie
odłożone na koniec — przemalowanie dotknie każdej klatki animacji.

---

## `char.blend` — postać 3D i pre-render do sprite'a (2026-09-08)

Model postaci w Blenderze + rig.

⚠ **Od 2026-09-09 trafia do gry JAKO MODEL 3D**, renderowany w locie
(`characters/char.glb` → `src/render3d/Character3D.ts`) — zdanie „do gry trafia
nie jako 3D", które stało tu do 2026-09-11, opisywało stan sprzed tej decyzji.
Ścieżka pre-renderu do arkusza (`tools/build_char3d.py`: Blender bez okna,
cztery kierunki × cykl chodu, pixel-art w palecie `characters/Character.png`)
nadal działa i nadal jest opisana niżej, ale jest dziś **drogą awaryjną**, nie
główną.

⚠⚠ **Od 2026-09-19 ciało i głowa są GENEROWANE** przez `tools/char3d_base.py`
z proporcji podanych jako ułamek wzrostu; `char.blend` trzyma **wersję roboczą
V3**, która **NIE JEST jeszcze zaakceptowaną bazą**. Wersje, powody odrzucenia
poprzedniej, niezmienniki rigu i plan dalszych prac:
**`docs/postac3d_checkpoint.md`** — zaczynaj TAM, nie tutaj.

**Co jest w pliku** (zmierzone na V3, nie zgadnięte):

| obiekt | co to |
|---|---|
| `Cube.001` | ciało — **363 wierzchołki bazowe**, **24 grupy** (14 z wagami + 10 pustych lustrzanych `_R`), modyfikator `Armature`; połówka na `x >= 0` |
| `Cube` | głowa — **przypięta do KOŚCI** `Bone.004` (`parent_type='BONE'`), bez armature; **314 wierzchołków, ma twarz, uszy i włosy jako geometrię** |
| `Armature` | rig, 34 kości, IK na obu rękach i obu nogach + pole targets, korzeń `Bone.005` |
| akcja `Walk` | 241 krzywych, klatki 0–11 |

⚠ **`Subdivision` stoi na poziomie 1** (było 2) — baza jest gęstsza, więc
poziom 2 dawał ~4× więcej wierzchołków bez zysku widocznego na 60 px.

⚠⚠ **PUSTE GRUPY WAG `_R` SĄ OBOWIĄZKOWE.** `Mirror` przerzuca wagi,
zamieniając `_L` na `_R` **w nazwie**, ale trafia wyłącznie do grupy, która
JUŻ ISTNIEJE na siatce. Bez niej odbity wierzchołek zostaje przy grupie lewej
i jedzie za lewą ręką. Objaw jest mylący: kości w pozie stoją idealnie
(sprawdzone pomiarem), a w renderze jedna ręka wystrzeliwuje pionowo nad głowę.

⚠ **Kości NIE MAJĄ nazw anatomicznych** — są `Bone`, `Bone.001`, `Bone.002_L.004`
i tak dalej. Mapa „kość → część ciała" żyje w `tools/char3d_zones.py`
(`BONE_ZONE`) i jest jedynym miejscem, które to wie. Zmiana rigu wymaga
poprawienia tej mapy — nic innego nie zaświeci na czerwono.

### Ekwipunek doczepiany do rigu (broń, tarcza)

Trzy liczby i dwie nazwy, bez których każda następna rzecz w dłoni ląduje
w złym miejscu:

| co | wartość | gdzie używane |
|---|---|---|
| kość PRAWEJ dłoni | `Bone.002_R.003` | `tools/char3d_weapons.py` (`KOSC_DLONI`) |
| kość LEWEJ dłoni | `Bone.002_L.003` | `tools/char3d_shields.py` (`KOSC_DLONI`) |
| **skala obiektu `Armature`** | **1,6527** | wszystko, co opisuje rozmiar w jednostkach |
| wysokość ciała | 12,96 j. świata | miara odniesienia dla rozmiarów |
| rozstaw barków | 4,72 j. świata | jw. |

⚠ **`Armature` jest przeskalowany 1,65× i to przewraca każdy rachunek rozmiaru
zrobiony „na oko z wysokości postaci".** Wymiary wpisane w `char3d_weapons.py`
i `char3d_shields.py` są w przestrzeni LOKALNEJ, więc tarcza o promieniu 1,65
ma w świecie 5,45 j. średnicy przy 12,96 j. wzrostu — 42%, nie 25%. Pierwsza
wersja tarczy okutej była przez to o połowę za duża (promień 2,25 → 57% wzrostu)
i zasłaniała nogę do kostki. Sprawdzone: `bpy.data.objects["Armature"].scale`.

⚠ **Przy `parent_type='BONE'` obiekt siada na OGONIE kości, a jego lokalne +Y
biegnie wzdłuż kości na zewnątrz dłoni.** Broń jest więc budowana wzdłuż +Y
i cofana o `chwyt`; tarcza leży w płaszczyźnie X–Y, a jej lico patrzy wzdłuż
lokalnego Z. Zmierzone na `Bone.002_L.003` w klatce 0: lokalne Z → światowe
(−0,65, −0,76, 0,01), czyli przód i lekko w poprzek ciała. Stąd kąt noszenia
tarczy `(0, −20, 0)` — bez niego lico jest za bardzo bokiem do kamery gry
(porównane renderem 0° vs −20°).

⚠ **Sprzęt w dłoni trzeba oglądać W MARSZU, nie w bezruchu.** `Walk_Armed`
zatrzymuje wyłącznie rękę Z BRONIĄ, więc ręka z tarczą macha dalej. W bezruchu
wszystko wygląda poprawnie nawet wtedy, gdy w marszu ostrze orze ziemię —
tak przepadła pierwsza wersja chwytu miecza (2,18 j. pod linią stóp).
Bramki: `tools/char3d_sprawdz_bron.py`, `tools/char3d_sprawdz_tarcze.py`.

Węzły w `char.glb` mają przedrostki `Pancerz_`, `Bron_`, `Tarcza_` —
`Character3D` rozpoznaje sloty **po przedrostku**, więc dołożenie przedmiotu
po stronie Blendera nie wymaga zmiany w TypeScripcie.

### Cztery pułapki, każda kosztowała jeden błędny render

⚠ **Akcja `Walk` to NIE 12-klatkowy cykl chodu.** To **3 pozy** (kontakt-L,
przejście, kontakt-P) powtórzone czterokrotnie, **plus wkluczowany obrót całego
obiektu o −90° na klatkach 0/3/6/9** — autor zrobił „chód oglądany z czterech
stron" w jednej akcji. Widać to wyłącznie w trzech krzywych `rotation_euler`
**na poziomie OBIEKTU**, nie w `pose.bones`; typowy zrzut fcurve po nazwach
kości je pomija, bo ich data_path nie ma cudzysłowu. Kto renderuje kierunki
kamerą, MUSI te krzywe zdjąć — inaczej postać obraca się dwa razy i w rzędzie
„down" wychodzą profile. Dane pozy powtarzają się co 3 klatki i to jest zgodne
z modelem; renderowane klatki różniły się wszystkie — ta sprzeczność jest
sygnaturą tego błędu.

⚠ **Modyfikator `Solidify` to nie pogrubienie, tylko inverted-hull outline**
(odwrócone normalne, ujemna grubość −0,15, `material_offset=1`). Powłoka bierze
materiał o **jeden slot dalej** i stąd czarny kontur w widoku 3D. Konsekwencja
przy pre-renderze: nadanie modelowi więcej niż jednego materiału przesuwa
**każdą** strefę koloru o jeden slot — skóra renderuje się włosami, koszula
spodniami, a ostatnia strefa jest przycinana. Do sprite'a powłokę się wyłącza,
kontur rysuje Workbench.

⚠ **`material.diffuse_color` jest LINIOWE, a Blender dokłada transformację
widoku (AgX).** Wpisanie tam wartości sRGB wprost daje w renderze zupełnie inną
jasność — biała koszula `#f7f7f7` wychodziła szarością w połowie jasności i po
kwantyzacji siadała na `#979797`. Trzeba `view_transform = "Standard"` **i**
konwersji sRGB → liniowe.

⚠ **Maskę stref zmniejsza się przez `NEAREST`, nigdy przez interpolację.**
Piksel na styku dwóch stref dostaje przy LANCZOS ich ŚREDNIĄ, a taki kolor nie
należy do żadnej strefy — i najbliższym sąsiadem bywa trzecia. Zmierzone:
średnia białej koszuli i ciemnych spodni to ok. `#999899`, do którego bliżej
jest ze **skóry** `#e1ab9f` niż z obu źródeł. Efekt: pasek gołej skóry przez
cały brzuch, **niewidoczny w pełnej klatce, widoczny dopiero przy 8×**.

### Ustalenia o samym sprite

- **Kąt kamery ≈ 15° nad horyzontem** jest najbliższy obecnemu `Character.png`.
  Drabinka 0/15/25/35/45 pokazuje, że od 25° w górę nogi się skracają, a głowa
  zaczyna dominować.
- **Profil prawy jest LUSTREM lewego, wypalonym w pliku** (`np.fliplr`, ta sama
  konwencja co reszta arkuszy). Powód zmierzony: studyjne światło Workbencha
  jest kierunkowe, więc renderowany osobno profil prawy wychodził wyraźnie
  jaśniejszy i chód migotał przy zmianie kierunku.
- **Klatka 24×60 (wysokość obecnego `Character.png`) jest ZA MAŁA dla tego
  modelu.** Ramię ma wtedy 2–3 px, a kontur po obu stronach zjada z niego
  prawie wszystko. Sylwetka czyta się dopiero od ok. **38×96**. To jest decyzja
  o rozmiarze postaci w grze, nie usterka generatora.
- Kwantyzacja idzie **rampami per strefa**, nie snapem do całej palety. Paleta
  `Character.png` ma 31 kolorów, w tym kilkanaście szarości i tylko pięć tonów
  ciepłych, więc zacieniona skóra `(184,140,130)` miała bliżej do `#979797` niż
  do `#e1ab9f` i twarz wychodziła szara. Ta sama pułapka co przy
  `snap_paleta.py`.

### Czego model jeszcze NIE ma

⛔ **Nie zgłaszaj „model nie ma twarzy, dłoni, szyi ani uszu" — od 2026-09-19
ma je wszystkie.** Strefy `eyes` i `mouth` jedzie **atrybut `zona` na
wielokącie** (`char3d_base.ZONY_GLOWY`), a nie cięcie po wysokości czaszki;
włosy mają własną objętość, nie są kolorem malowanym na czaszce. Palców NIE MA
i mieć nie mają: przy 60 px postaci dłoń ma ~3 px.

Co zostaje **otwarte i niezaakceptowane** — pełna lista z pomiarami w
`docs/postac3d_checkpoint.md` §4: sylwetka może być nadal zbyt szczupła wobec
NPC-ów, twarz jest stylistycznie miększa od pixel-artu, brakuje czarnego
konturu (`Solidify` gasi `apply_zones`), a miecz schodzi ~1,09 j. pod stopy
w cyklu chodu.

---

## Narzędzia

```bash
blender -b public/assets/char.blend --python tools/build_char3d_base.py        # PRZYMIAR bazy; NIC nie nadpisuje
blender -b public/assets/char.blend --python tools/build_char3d_base.py -- --zapisz  # przebudowa -> public/assets/char.blend
blender -b public/assets/char.blend --python tools/char3d_export_gltf.py -- public/assets/characters/char.glb
blender -b public/assets/char.blend --python tools/char3d_sprawdz_bron.py     # bramka broni (kod 1 = bledy)
blender -b public/assets/char.blend --python tools/char3d_sprawdz_tarcze.py   # bramka tarcz
python tools/build_char3d.py                # char.blend -> arkusz; PRZYMIAR, NIC nie nadpisuje
python tools/build_char3d.py --zapisz       # zapis do characters/char3d.png
python tools/gen_palette.py                 # paleta -> docs/paleta.json
python tools/build_tilesets.py              # tylko raport, NIC nie nadpisuje
python tools/build_tilesets.py --od-zera    # przebudowa obu arkuszy
python tools/build_drzewa.py                # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_drzewa.py --zapisz       # wkleja dąb/świerk/brzozę do Nature.png
python tools/build_budynki.py               # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_budynki.py --zapisz      # generuje Buildings.png + docs/budynki.json
python tools/build_budynki.py --podglad X.png   # składa chatę/stodołę/oborę/kurnik/stajnię do PNG
python tools/build_mapa.py                  # raport mapy, NIC nie nadpisuje
python tools/build_mapa.py --zapisz         # generuje forrest.tmj od nowa
python tools/build_rabbit.py                # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_rabbit.py --zapisz       # generuje rabbit.png (idle/chód/bieg)
python tools/build_dzik.py                  # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_dzik.py --zapisz         # generuje boar.png (idle/chód/bieg)
python tools/build_wilk.py                  # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_wilk.py --zapisz         # generuje wolf.png (6 stanów x 4 kierunki)
python tools/build_szary.py                 # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_szary.py --zapisz        # generuje greywolf.png (Szary, wlasny arkusz)
python tools/build_swinia.py                # podgląd + weryfikacja, NIC nie nadpisuje
python tools/build_swinia.py --zapisz       # generuje pig.png — NIEWPIĘTY w grę, patrz wyżej
python tools/audyt_rekwizytow.py            # audyt ROZSTAWIENia obu map, NIC nie zapisuje
python tools/audyt_rekwizytow.py --mapa las # tylko jedna mapa
python tools/audyt_rekwizytow.py --cicho    # tylko błędy (kod wyjścia 1 = są błędy)
```

**`audyt_rekwizytow.py` pilnuje ROZSTAWIENIA, nie grafiki** — to druga
połowa tego, co `build_mapa.py --raport` robi dla odległości spawnów.
Czyta wyłącznie wyeksportowane `.tmj` (nie generatory — patrz wpadka z
„chatą zachód", gdzie rekwizyty liczono od nieaktualnych współrzędnych
generatora) i sprawdza pięć klas błędu, z których **każda realnie się już
wydarzyła i za każdym razem złapał ją dopiero screenshot**: rekwizyt/zwierzę
na ścianie budynku, mebel blokujący próg, rekwizyt na pniu drzewa, rekwizyt
na trakcie (uwaga, nie błąd — ognisko przy drodze bywa zamierzone), zasięgi
interakcji dwóch NPC-ów zachodzące na siebie (<96 px = 2× `interactRange`),
oraz niekompletne kompozyty kafelkowe (`stog` to 4 kafle, `lawka` 2).

⚠ **Pierwsza wersja tego skryptu zgłosiła 5 „błędów" i wszystkie pięć było
FAŁSZYWE** — reguły były za szerokie. NPC stojący we własnych drzwiach jest
poprawny (`build_mapa.py`: *„Myśliwy stoi PRZED własnymi drzwiami — placówka
handlowa ma mieć adres"*), a koło młyńskie **ma** być zamontowane na ścianie
młyna (`ASSETS.waterwheel` ma do tego osobną klatkę „bok"). Reguły zostały
ZAWĘŻONE, nie wyciszone przy zgłaszaniu: raport, który krzyczy na poprawny
stan, uczy czytać się po łebkach i jest gorszy niż jego brak. Ta sama zasada
co przy `snap_paleta.py`, który krzyczy o rampach bez ani jednego piksela.

Przy pierwszym poprawnym przebiegu znalazł prawdziwy błąd: **suszona skóra
stała na drodze** przed chatą myśliwego zamiast przy jej wschodniej ścianie.

**Kolejność ma znaczenie:** `build_budynki.py --zapisz` musi pójść przed
`build_mapa.py --zapisz`, bo mapa czyta `docs/budynki.json`. Zmiana katalogu
budynków bez przebudowy arkusza sprawia, że mapa stawia kafle, których w nim
nie ma — po cichu, bo bezsensowny układ kafli niczego nie zgłasza.

`build_mapa.py` przy każdym uruchomieniu drukuje **odległości nośne** spawnów
i mówi wprost OK/BŁĄD: trzy wilki muszą się widzieć w promieniu wycia
(`WOLF.pack.callRadius` = 200), Szary musi być poza nim, a ognisko dalej od
kupca niż suma zasięgów interakcji (48 + 44 = 92), bo inaczej jedno `E` odpala
oba. Aktualnie: wilki 115/132/133, Szary 296, ognisko 119.

`build_drzewa.py` **rysuje** drzewa, nie konwertuje cudzych — patrz „Skąd
pochodzą kształty" niżej. Sam sprawdza pięć warunków z `docs/ZADANIE_drzewa.md`
(paleta, kontrast wobec trawy, rozróżnialność sylwetek, mieszczenie się
w kaflach, liczba kolorów na kafel) i drukuje liczby. **Ten raport jest częścią
narzędzia celowo** — poprzednia sesja oddała 47 kafli, z których 19 było
unikalnych, bo liczyła pliki zamiast treści.

**Arkusz jest artefaktem, nie wynikiem funkcji.** Skrypt domyślnie niczego nie
nadpisuje, bo ręczna poprawka piksela musi przeżyć następne uruchomienie. To
była świadoma zmiana modelu — wcześniejsza wersja przebudowywała cały plik przy
każdym przebiegu i kasowałaby każdą ręczną pracę.

**`build_tilesets.py --od-zera` przebudowuje OBA arkusze**, więc `Nature.png`
też. Dlatego `buduj_nature()` woła teraz `build_drzewa.py` i dorysowuje dąb,
świerk i brzozę — bez tego jedno uruchomienie „żeby odświeżyć trawę" kasowało
je bez ostrzeżenia. Jeśli import się nie uda, skrypt mówi to wprost zamiast
zostawić puste wiersze.

`tools/build_nature.py` to **poprzedni generator, już nieaktualny** — budował
arkusz 640×800 ze starym układem. Zostawiony na razie jako referencja.

---

## Paleta

`docs/paleta.json` — **61 kolorów, 12 ramp po 5 stopni + 6 neutralnych**.
Generowana z `tools/gen_palette.py`, nie wpisywana ręcznie.

Zasada, na której wszystko stoi: **cień przesuwa odcień w chłód, światło
w ciepło**. To jest zmierzona różnica między materiałem, który wygląda dobrze
(rozpiętość odcienia 47°), a starym `Nature.png` (4°).

Rampa **`korona`** istnieje osobno od `listowie`, bo listowie jest ciemniejsze
od trawy (jasność 88 wobec 115) — drzewo na nim znikało zamiast się odcinać.
Korona ma 123 i drzewo jest jaśniejsze od podłoża, tak jak w oryginale.

---

## Pułapki, które już raz kosztowały czas

**Skok siatki to 33 px, nie 32.** Kafel 32 px + 1 px przerwy.

**Kolumn jest 19 i to nie może się zmienić bez konsekwencji.** Identyfikator
kafla = `wiersz × kolumny + kolumna`. Dokładanie wierszy nie rusza istniejących
id; poszerzenie w bok przenumerowuje wszystko i niszczy każdą mapę.

**Tło musi być bezszwowe, obiekt musi być cały.** Dwie różne rzeczy. Zawijanie
modulo jest poprawne dla tekstury tła i błędne dla kępki trawy — dawało źdźbła
przecięte krawędzią, poprawne tylko gdyby sąsiad je kontynuował.

**Teren to płaskie tło + kilka procent pikseli detalu.** Zmierzone na
działającym materiale. Ciągły szum po całej powierzchni czyta się jak brud, nie
jak trawa — pierwsza wersja miała 22% i wyglądała gorzej od tego, co zastępowała.

**Ale gęstość to połowa sprawy, druga połowa to ROZKŁAD.** Druga wersja miała
już 6,7% i nadal czytała się jak szum, bo sypała akcenty **per piksel**:
w rampie 5-stopniowej sąsiedni stopień leży **+36 / −28 jasności** od bazy, więc
każda samotna kropka krzyczy. Te same piksele ułożone w **skupiska po 2–4**
czytają się jako kępka źdźbeł. Trzy piksele obok siebie to trawa, trzy
rozrzucone to brud — dokładnie ta sama lekcja, co przy kępach listowia
w `tools/build_drzewa.py`.

Trawa jest dziś na **2,1%**, w skupiskach, z akcentem ciemnym 3× częstszym niż
jasny (ciemna plamka czyta się jak cień między źdźbłami, jasna jak błysk).

**Trzecia pułapka: im rzadszy i większy detal, tym wyraźniej widać
powtarzalność kafla.** Samo ściszenie szumu odsłania ukośną kratę, bo oko
zaczyna rozpoznawać pojedyncze plamki. **Malując duże połacie, mieszaj warianty
trawy (kolumny 0–2), nie kładź jednego kafla tysiąc razy** — to jedyne, co
naprawdę usuwa kratę. Sprawdzone na polu 17×5 kafli.

**Komplet obszarowy ma cztery przypadki na ćwiartkę, nie trzy.** Pominięcie
„brak jednego sąsiada" powodowało, że pionowy pasek wypełniał cały kafel
i wychodził identycznie jak kafel otoczony ze wszystkich stron — siedem układów
łapało się na jeden obrazek. Po każdej zmianie generatora **sprawdzaj hashem,
czy 47 kafli jest naprawdę różnych** — liczba plików nie mówi nic o treści.

**Nie generuj pixel artu ciągłym szumem z sumy sinusoid.** Iloczyny sinusów
tworzą regularne ukośne prążki i wychodzi tkanina.

**Małe koło zrasteryzowane na siatce pikseli to GWIAZDKA, nie plamka.** Warunek
`dx² + dy² <= r²` daje dla `r=2` romb z czterema kolcami, a dla `r=3` i `r=4`
pojedynczy wystający piksel na każdej z czterech osi. Kilkadziesiąt takich kęp
rozsypanych po koronie czyta się jak gwiazdki naklejone na drzewo — zgłoszone
przez autora projektu przy oglądaniu arkusza w edytorze. **Żaden test tego nie
złapał**, bo wszystkie dotyczyły koloru i sylwetki całego drzewa, a nie kształtu
detalu. Lekarstwo w `tools/build_drzewa.py`, funkcja `plamka()`: suma 2–3
przesuniętych kół plus wygryzienie ~35% pikseli brzegowych.

**Ten sam jasny stopień rampy waży inaczej na jasnej i ciemnej rampie.** Kępa
`listowie[4]` na masie świerka jest o 60 punktów jasności powyżej otoczenia
i świeci jak pyłek; ta sama kępa `korona[4]` na dębie jest normalnym
rozjaśnieniem. Zakres kęp dobiera się do rampy, nie na sztywno.

**Korona i pień muszą się STYKAĆ, i to trzeba wymusić, a nie założyć.** Płaty
korony są losowe, a pień kończy się w konkretnym miejscu — przy małej brzozie
wyszły **2 piksele czystej trawy** między białym pniem a zieloną masą i drzewo
rozpadło się na dwa osobne obiekty. Żaden z pięciu testów tego nie łapał:
paleta poprawna, kontrast poprawny, sylwetka rozróżnialna, w kaflach się
mieściło. **Sprite może przejść wszystko i nadal nie być drzewem.** Stąd test
[6] w `build_drzewa.py` i „kotwica" — obowiązkowy płat liści nad wierzchołkiem
każdego pnia.

Dwie rzeczy przy kotwicy okupione nieudaną wersją:
- **koło ma wąski dolny brzeg**, więc korona dotykała pnia stycznie, na 2–3
  pikselach — formalnie styk, wizualnie nadal odklejona korona. Kotwica jest
  pionową kapsułą (trzy plamki jedna pod drugą), żeby pień wchodził w masę
  liści i wychodził z niej bokami;
- **pnia pod koroną nie wolno kasować.** Kasowanie „na zapas" zostawiało obie
  masy stykające się wzdłuż jednej poszarpanej krawędzi. Kasujemy tylko
  drewno, które wystaje **nieprzykryte** — wewnątrz obwiedni gatunku, ale poza
  masą korony. To dokładnie ten przypadek, który dawał szare placki.

**Jeden materiał = JEDNO progowanie na rampę, choćby składał się z kilku
części.** Konary i pień dębu były dwoma osobnymi wywołaniami
`stopnie_na_kolory` — konary na zakresie (0,3), pień na (0,4), każde
normalizowane na **własnym** minimum i maksimum. To samo drewno wychodziło
w dwóch tonacjach, a na granicy, dokładnie w rozwidleniu, siedział poziomy szew.
Zgłoszone jako „konar wygląda jak sklejony z dwóch grafik" — i to jest dosłownie
to, co się działo.

To ta sama pomyłka, przed którą ostrzega `docs/ZADANIE_drzewa.md` przy kaflach
(*„progi licz dla CAŁEGO obiektu, nie per kafel"*), tylko popełniona **per
część** zamiast per kafel. Dlatego `pien()` ma tryb `maluj_teraz=False`
(zwraca maskę i pole zamiast malować), a `galaz()` przyjmuje tablicę pola —
wołający scala jedno i drugie i mapuje **raz**.

**Samo scalenie progowania nie wystarczyło — pola muszą jeszcze mówić to samo.**
Po scaleniu szew nadal był widoczny, z dwóch niezależnych powodów, oba wykryte
liczbowo, nie okiem:

1. **Znak był odwrócony.** `SWIATLO` wskazuje NA źródło, więc iloczyn skalarny
   odsunięcia z tym wektorem jest **dodatni po stronie oświetlonej**. Gałąź
   liczona z wiodącym minusem była oświetlona od dołu z prawej, czyli
   z przeciwnej strony niż pień.
2. **Walec cieniuje się względem OSI, nie promieniowo od środka.** Wersja
   promieniowa dawała jasną plamkę tylko przy krańcu każdego krążka, a kolejne
   krążki ją zamazywały — zmierzone: **55% konarów w najciemniejszym stopniu**
   przy pniu rozłożonym równomiernie. Poprawnie: `jasność ~ (odsunięcie od osi)
   × (na ile normalna patrzy w światło)`. Ten sam wzór daje dla pionowego pnia
   dokładnie jego dotychczasowe cieniowanie, więc obie części wychodzą
   oświetlone z tej samej strony i tak samo mocno.

**Nie różnicuj tego samego materiału wysokością.** Wspólna „głębia" (drewno
ciemniejsze przy ziemi) przy współczynniku 0,45 robiła konary o dwa stopnie
jaśniejsze od pnia — znowu dwa materiały. Kora pnia i kora konara to ta sama
kora; różnicować ma je krzywizna. Współczynnik zszedł do 0,20.

**Masa dołożona po stronie cienia potrafi przewrócić test kontrastu.** Kotwica
siedzi u nasady korony, czyli w cieniu; przy równomiernym podziale pola światła
przeciągnęła dominujący kolor brzozy na `korona[2]` (jasność 123 wobec 115
trawy). Lekarstwo to `krzywa` w `stopnie_na_kolory()` — zwężenie zakresu do
(3,4) zabrałoby stopień cieniowania, krzywa zostawia wszystkie trzy i zmienia
tylko, ile pikseli dostaje który.

---

## Skąd pochodzą kształty

**Kępki trawy** (`tools/zrodla/kepki_trawy.npz`) pochodzą z pakietu
**Pixel Art Top Down - Basic v1.2.3** (Cainos, Unity Asset Store), przekolorowane
na naszą rampę. W repo trzymamy je jako **maski stopni rampy**, nie jako piksele
w ich kolorach — zmiana palety przemalowuje je automatycznie.

**To są ich kształty, więc te kafle są pracą pochodną i obowiązuje licencja
tamtego pakietu.** Przekolorowanie tego nie zmienia. Sam folder pakietu został
usunięty z projektu; zip leży poza repo.

**Wszystkie drzewa są rysowane od zera** przez `tools/build_drzewa.py`. Nie są
pracą pochodną niczyjej grafiki.

Dwa drzewa **przemalowane** ze starego `Nature.png` (`Nature_v1_backup.png`)
zostały **usunięte** — były płaskimi plamami z losowymi kropkami udającymi
listowie i miały poziomy szew na granicy kafli. Zastąpił je buk i grab.
`przemaluj_drzewo()` w `build_tilesets.py` zostaje jako referencja metody
przemalowania cudzej grafiki na paletę; sama metoda jest poprawna, brakowało
jej tylko dobrego materiału.

### `height32_trees_mega_pack.png` — materiał REFERENCYJNY, nie źródłowy

Leży w `public/assets/`, ale **nic go nie wczytuje i żaden jego piksel nie
trafił do arkusza**. Posłużył wyłącznie jako wzornik sylwetek. Powód jest
zmierzony, nie estetyczny — warto mieć te liczby, żeby nie mierzyć ich drugi raz:

| co | pakiet | nasze arkusze |
|---|---|---|
| rozmiar drzewa (mediana) | **23×30 px** | dąb 96×96, gracz 31×60 |
| drzew szerszych niż kafel | 31 z 312 | — |
| unikalnych kolorów na piksel kryjący | **0,88** | **0,003** |
| alfa półprzezroczysta | 42% pikseli | 0% |

Nazwa „height32" jest dosłowna: drzewa mają 32 px wysokości, bo pakiet
narysowano pod kafel 16 px. Przy naszym kaflu 32 px użyte 1:1 byłyby **o połowę
niższe od gracza**. Przy 0,88 koloru na piksel to nie jest pixel art, tylko
pomniejszony render — próbna konwersja czterech drzew na paletę dała jedno
dobre, jedno pozbawione własnej ciemności (o tym niżej) i dwa rozsypane
w konfetti. Ostrych, czytelnych sylwetek jest tam ok. 17%.

**Licencja i pochodzenie pakietu: NIEUSTALONE.** Skoro nic z niego nie
przenosimy, nie wiąże nas ona dziś — ale gdyby ktoś kiedyś chciał wziąć stamtąd
piksele, trzeba to najpierw rozstrzygnąć.

### Pułapka w metodzie przemalowania, na którą trzeba uważać

`docs/ZADANIE_drzewa.md` każe mapować odrębne kolory **po kolejności jasności**
(n-ty najciemniejszy → n-ty stopień rampy). To jest słuszne wewnątrz jednego
obiektu, ale **normalizuje kontrast per obiekt**: każde drzewo dostaje pełne
5 stopni niezależnie od tego, jak ciemne było w oryginale. Zmierzone na próbie —
ciemny dąb wyszedł **jaśniejszy** niż jasny dąb obok. Świerk i brzoza wyszłyby
tak samo jasne.

Jeśli kiedyś wrócimy do konwersji cudzego materiału: mapować na **podzakres
rampy**, zakotwiczony w bezwzględnej jasności źródła. W generatorze rozwiązuje
to `zakres` w `stopnie_na_kolory()` — dąb i brzoza dostają (1,4) i (2,4),
świerk pełne (0,4) na ciemniejszej rampie `listowie`.

Cała reszta jest generowana z palety.

---

## Co dalej

**Zadanie w kolejce: `docs/ZADANIE_drzewa.md`** — rozbudowa drzew o gatunki
i warianty słowiańskiego lasu (dąb, sosna, brzoza, świerk, buk, martwe,
powalone…). Brief zawiera specyfikację, ograniczenia techniczne i — istotne —
warunki weryfikacji, bo największym ryzykiem jest trzynaście gatunków
wyglądających jak trzynaście wariantów tej samej plamy.

1. ~~Dokończyć wpięcie~~ — zrobione, patrz góra pliku. Kolejne w tej linii:
   **kolizje na mapie** (dziś zero) i **budynki** — chata zniknęła razem ze
   starym arkuszem, `Buildings.png` nie jest już przez mapę używany.
2. Woda i piasek mają komplety obszarowe, **listowie i kamień jeszcze nie**.
3. Brakuje propów: kamienie, kłody, grzyby, kwiaty. Generator krzaków
   (`krzak()`) jest dobrym punktem wyjścia — kępy jasnych skupisk na
   ciemniejszej masie, nie gładki gradient (ten wychodzi jak arbuz).
4. Drzewa to nadal **przemalowana cudza grafika**. Docelowo własne, większe —
   w materiale referencyjnym drzewa miały 3–4 kafle szerokości na 4–5 wysokości.
5. `Character.png` i `NPC.png` czekają na przemalowanie do palety — najdroższy
   element, świadomie na końcu.

### Zioła — jedenaście ikon z arkuszy Gemini (2026-10-05)

⭐ **Obowiązuje.** Wszystkie 11 ikon zioł rysuje `tools/build_herb_icons.py`
z `docs/art-review/gemini/herbs_{a,b}_v1_raw.png` (prompty i ocena:
`docs/gemini_item_icons.md` §3). Pięć plików niżej zostało NADPISANYCH
(te same nazwy), sześć jest nowych: `icon_mullein` (dziewanna),
`icon_goldenrod` (nawłoć), `icon_tansy` (wrotycz), `icon_corn_mint` (mięta),
`icon_wild_marjoram` (lebiodka), `icon_comfrey` (żywokost). Źródła w korzeniu
(`chamomile.png` itd.) nie są już przez nic czytane.

Fakty o arkuszach, których nie widać w promptach:
- ⚠ **Arkusz A przyszedł na SZAROBRĄZOWYM tle (136,117,106), nie na magencie**
  z promptu; B — na cyjanie, ale z innym odcieniem w każdej komórce.
- ⚠ **Gemini położyło 5 z 6 gałązek arkusza B ODWROTNIE** (ucięty koniec
  w lewym dolnym) mimo jawnego zdania w prompcie — generator je lustruje.
  Żywokost (korzeń w prawym dolnym) był dobrze.
- ⭐ **Zejście ~60 → 28 px: głosowanie kolorów WNĘTRZA przy pokryciu ≥ 0,25**,
  nie 0,5 — przy 0,5 łodygi (1 px wnętrza + 2 px konturu) znikały.
- ⭐ **Ciemne przerwy arkusza → krok ciemniejszy ton własnego koloru, nie
  czerń.** Głosowanie czerni wprost zjadało łodygi i robiło dziury; zamiana
  na ciemniejszy ton zachowuje żyłki liści, gwiazdki dziurawca i zęby pokrzywy.
- ⚠ **Ciemne zielenie ginęły na kafelku plecaka** (pokrzywa: kontrast 32 przy
  progu 50) — rozjaśnienie gammą per zioło, pokrzywa zostaje najciemniejsza.
- ⚠ **Jednopikselowe dziury tła między kwiatami** dostawały własny pierścień
  konturu i podbijały miarę „grubego konturu" (dziurawiec 0,20) — zatykane
  konturem, jak w pancerzu.

### Biżuteria, jedzenie, surowce — osiemnaście ikon z Gemini (2026-10-05)

⭐ **Obowiązuje.** `tools/build_misc_icons.py` z `jewelry_v1_raw.png`,
`food_v1_raw.png`, `materials_v1_raw.png` (`docs/gemini_item_icons.md`
§4–§6). Zejście do 28 px — ten sam potok co zioła (importowany).
Nowe pliki: `icon_ring_{precision,swiftness,vigor,warding}.png`,
`icon_grey_fang.png`, `icon_grey_fang_necklace.png`; dwanaście pozostałych
nadpisało dotychczasowe nazwy. Źródła sierpniowe w korzeniu (`bread.png`,
`wolf-hide.png`, `lesser-healing-potion.png`…) nie są już przez nic czytane.

- ⚠ **Żaden z trzech arkuszy nie miał magenty**: beż z liniami siatki
  (biżuteria), szarość 128 (jedzenie), inny beż w każdej komórce (surowce).
- ⭐ **Tło zalewane OD BRZEGU KOMÓRKI**, nie dopasowane kolorem — szare futro
  wilka, szkło fiolki i nić leżą blisko tych beży/szarości. ⚠ Za tło uznaje
  się tylko kolory zajmujące ≥ 5% obwodu: łapy niedźwiedzia dotykają brzegu
  i ze wszystkimi kolorami brzegu zalewanie zjadło całą skórę.
- ⚠ **Zamknięte okna tła** (wnętrze pierścienia) zalewanie omija — zdejmowane
  osobno, gdy plama koloru tła ma ≥ 12 px.
- ⚠ **Prawie czarnych brązów NIE rozjaśniaj gammą po kanałach RGB** — kanały
  się wyrównują i skóra dzika wyszła szara jak kamień. Gamma na samej
  jasności V zostawia odcień.
- ⚠ **`venom_gland` ma OSOBNE źródło** `venom_gland_v2_raw.png` (cały arkusz =
  jedna sztuka). Wersja z `materials_v1_raw.png` czytała się jak gruszka
  (przewód narysowany jak ogonek owocu) — `docs/gemini_item_icons.md` §6.5–§6.6.

### Zioła — komplet pięciu ikon (2026-08-23) — ⛔ HISTORIA, zastąpione wyżej

⚠ Opis potoku sprzed 2026-10-05 (GPT image → BOX → MEDIANCUT). Pliki
wynikowe zostały nadpisane; lekcje o kwantyzacji zostają prawdziwe.

| źródło (korzeń) | ikona (`items/`) | id przedmiotu |
|---|---|---|
| `ribwort-plantain.png` | `icon_ribwort_plantain.png` | `babka` |
| `st-johns-wort.png` | `icon_st_johns_wort.png` | `dziurawiec` |
| `nettle.png` | `icon_nettle.png` | `pokrzywa` |
| `chamomile.png` | `icon_chamomile.png` | `rumianek` |
| `yarrow.png` | `icon_yarrow.png` | `krwawnik` |

⚠ **Nazwy plików po angielsku, ID przedmiotów po polsku** — to nie jest
niespójność, tylko dwie różne reguły: pliki idą regułą z 2026-08-14, a `id` w
`GameConfig` są starsze i wiążą się z ikoną przez jawny `iconTexture`. Tak samo
`wolf-hide.png` → `icon_wolf_pelt` → `wolf_pelt`.

⚠ **RUMIANEK wymagał PODZIAŁU BARW przed kwantyzacją.** Jego białe płatki to
tylko **9% pikseli**, a MEDIANCUT rozdaje budżet palety według LICZBY pikseli,
nie według wyróżnialności — zlałby je z żółcią środka. Pozostałe trzy to jedna
rodzina barw (zieleń z gradientem jasności) i przeszły standardowym pipeline'em.
Ta sama pułapka zjadła wcześniej woreczek jadu i jasną końcówkę kości.

⚠ **`key` w `ASSETS` musi mieć przedrostek `icon-`** (`icon-nettle`, nie
`nettle`) i zgadzać się z `iconTexture`. Przy tych czterech pomyliłem to za
pierwszym razem — **gra by się uruchomiła i podstawiła placeholder**, bez błędu
w konsoli. Wpięcie ma trzy miejsca i wszystkie trzy są konieczne: `iconTexture`
w `ITEMS`, wpis w `ASSETS`, **jawna linia w pętli loadera** w `core/Assets.ts`.

⚠ **KRWAWNIK wymagał KADRU (88% wysokości) i to jest decyzja o czytelności.**
Źródło to wysoki pęk (65×104) przewiązany sznurkiem. Przy skalowaniu całości do
26 px baldachy (~10 px w źródle) schodzą do **2,5 px**, a BOX uśrednia je z
zielenią w jedną oliwkę — render czytał się jak **brunatna plama**, nie jak
roślina.

Sprawdzone po kolei i **odrzucone**: podział barw przed skalowaniem (zamiast po)
dał różnicę ledwie widoczną — problem nie leżał w kolejności, tylko w tym, że
przy 4× redukcji baldach po prostu nie ma z czego powstać.

Porównane na renderze cztery kadry (70 / 80 / 88 / 100%). **70% czytało się
najlepiej jako roślina, ale wypadało z rodziny** — gęsty, poziomy krzak obok
czterech ukośnych gałązek. **88% obcina samą przewiązkę**, zostawia pionową
sylwetkę zgodną z resztą i baldachy nadal rozpoznawalne.

⚠ To jedyne zioło z kadrem. Pozostałe cztery idą w całości — kadr **nie jest**
domyślnym krokiem pipeline'u, tylko odpowiedzią na konkretną proporcję źródła.

### Skóra niedźwiedzia i mikstura (2026-08-23)

| źródło (korzeń) | ikona (`items/`) | id przedmiotu |
|---|---|---|
| `bear-hide.png` | `icon_bear_hide.png` | `bear_hide` |
| `lesser-healing-potion.png` | `icon_health_potion.png` | `health_potion` |

⚠ **Źródło mikstury nazywa się `lesser-…`, a przedmiot to zwykłe
`health_potion`** — w grze jest DZIŚ jeden poziom mikstury. Ikona nazwana od
PRZEDMIOTU, nie od pliku, zgodnie z precedensem `wolf-hide.png` →
`icon_wolf_pelt`. Gdyby kiedyś powstały poziomy miksturek, ta ikona jest już
narysowana jako „mniejsza" i wystarczy dodać wpis.

⚠ **Mikstura dostała 30 px treści zamiast konwencyjnych 26 — sprawdzone na
renderze, nie przyjęte.** Jej źródło ma bbox **11×34 px**, czyli jest już
mniejsze niż kafel. Przy 26 px wychodzi 8 px szerokości i **korek praktycznie
znika**; przy 30 widać korek, szyjkę i płyn. 30 to maksimum zostawiające miejsce
na kontur (30 + 2 = 32). To jedyna ikona odstępująca od 26 px.

⚠ **Skóra niedźwiedzia to najbardziej ekstremalna redukcja w projekcie:
958×1053 px i 56 782 kolory → 24×26 px i 6 kolorów (~40×).** Wyszła czytelna i
to nie jest przypadek: płat futra jest **duży i płaski**, więc BOX uśrednia po
jednolitych obszarach. Odwrotnie niż przy krwawniku, gdzie ginęły małe baldachy.
**Wielkość źródła nie mówi nic o tym, czy pipeline sobie poradzi — mówi o tym
wielkość DETALU.**

## `characters/adrian_portrait.png` (2026-10-10)

Źródło TWARZY modelu 3D Adriana (`tools/npc3d.py`, preset `adrian`, rzut
`_twarz_z_portretu`), nie portret do dialogu — gra go dziś nie wczytuje jako
2D (Adrian w 2D to wspólny sprite NPC z odcieniem). Powstał z pseudo-assetu
autora (1024×1024, pixel-art przeskalowany ~10,24×, z AI): próbkowanie środków
pikseli na siatce **100×100**, białe tło → przezroczyste. Kalibracja twarzy:
oś x 50,5, oczy w wierszu 15,5, dół brody 25, pół szerokości 7,5.
⚠ Siatka 100 jest PRZYBLIŻONA (asset nie ma idealnej siatki) — do twarzy
wystarcza; jako portret 2D w dialogu trzeba by go przerysować.

## `characters/player_face.png` (2026-10-10)

Twarz GRACZA, 24×28, generowana przez `tools/build_player_face.py` (pixel-art
postawiony ręcznie wg referencji autora — zdjęcia NIE w repo). Rzut na przód
głowy w eksporcie `char.glb` (`tools/char3d_face.py`, lustro UV). ⚠ Oś twarzy
MUSI być na x = 12 (środek), rysunek symetryczny — pilnuje tego samokontrola
generatora. ⚠ Rysy są ściśnięte w dół (`oczy_y` 13,5 przy oczach w wierszu
15): daszek włosów bazy chował z kamery 40° brwi i górę oczu.

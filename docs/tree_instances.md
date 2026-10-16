---
typ: HISTORIA
domena: [world, assets]
tytul: Instancje drzew — migracja na tile-objecty
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-29
---

# Instancje drzew — Tiled tile-object → sprite z własną głębią

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/world.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


**Status: WDROŻONE + LAS ZMIGROWANY (2026-08-29).** `forrest.tmj` (obie kopie)
trzyma teraz 1633 drzewa jako tile-objecty na warstwie `trees`; `trees-base`/
`trees-over` skasowane. Czeka na playtest ręką i test FPS na telefonie.
Rozmieszczenie lasu NIE ruszane (migracja czysto techniczna). Wieś i Gęstwina
nietknięte.

Odpowiedź na pytanie z `PROJECT_CHECKPOINT` (sekcja „system drzew"): jak
najprościej reprezentować jedno drzewo jako pojedynczy obiekt w Tiled, tak żeby
jego pełna grafika renderowała się wprost w grze, mogła mieć dowolny rozmiar
oraz własną kotwicę i głębię.

---

## 1. Decyzja

> **Jedno drzewo = jeden Tiled *tile object* (obiekt z `gid`) na warstwie
> obiektów `trees`.**

`gid` wskazuje do **arkusza stempli** `public/assets/tree_stamps.png` —
edytorowego repacku `forrest.png`, w którym każdy z 31 wariantów zajmuje jedną
komórkę siatki **96×96** (największe drzewo w atlasie), dosuniętą do DOŁU i
wyśrodkowaną w poziomie. Piksele są identyczne z `forrest.png` — to nie jest
przebudowa atlasu renderowego, tylko osobny arkusz **dla edytora**.

**Workflow w Tiled** (to była kluczowa wymagana rzecz):
- dodajesz tileset „TreeStamps" (based on image, 96×96, embed in map),
- klikasz drzewo w palecie, klikasz na mapę → pełny obraz w prawdziwym rozmiarze,
- stawianie w dowolnym pikselu, **drzewa mogą się swobodnie nakładać**,
- przeciągasz myszą, kasujesz `Delete`, zmiana wariantu = prawy-klik → *Replace
  Tile* albo skasuj i postaw inny,
- **żadnego generatora po edycji, żadnej drugiej listy, żadnej synchronizacji.**
  `.tmj` jest jedynym źródłem rozmieszczenia.

**Dlaczego nie inne warianty:**
| wariant | czemu odrzucony |
|---|---|
| punkt + właściwość `variant` | eksportuje się trywialnie, kod silnika prostszy, ale w Tiled widać **kropkę** — nie da się projektować gęstych, nachodzących skupisk „na oko" |
| szablony `.tx` | dają podgląd, ale każdy wariant to osobny plik do utrzymania, a zmiana wariantu jest bardziej niezręczna niż wybór innego kafla z palety |
| kolejne globalne warstwy `trees-back`/`trees-front` | odrzucone już przez `TreeZOrderPrototype` — nie rozwiązują głębi *między* drzewami |

---

## 2. Model renderowania i głębi

Ten sam model, który `TreeZOrderPrototype` dowiódł na ~110 realnych drzewach —
zmienia się tylko WEJŚCIE (jeden obiekt zamiast rekonstrukcji z dwóch warstw
kafli).

Każde drzewo to **dwa obrazy** z tej samej komórki 96×96:

| część | wycinek komórki | głębia | skutek |
|---|---|---|---|
| **PIEŃ** | dolny pas `TREE_STAMP_TRUNK_SLICE` = 32 px | `DEPTH.entities + anchorY` | sortuje się **z graczem i wrogami** po „stopach": gracz na południe od pnia rysuje się PRZED nim, na północy — ZA. Pnie różnych drzew sortują się między sobą po własnej kotwicy Y. |
| **KORONA** | reszta (96×64) | `DEPTH.overhead + anchorY·0,01` | zawsze nad encjami = **walk-behind**. Korony różnych drzew nadal sortują się między sobą po Y — drzewo bliżej kamery przykrywa koronę drzewa dalej na północ. |

`anchorY = object.y`, bo tile-object w Tiled ma origin w LEWYM-DOLNYM rogu
(`objectalignment: "bottomleft"`) — czyli `o.y` to linia gruntu drzewa, `o.x`
lewa krawędź komórki (drzewo wyśrodkowane → środek drzewa = `o.x + 48`).

⚠ **Konwencja głębi pnia (`DEPTH.entities + groundline`) jest ZGODNA z
`rockSpawns`/`decorSpawns`** w `GameScene` — kamienie i dekoracje już tak
sortują. Gracz liczy głębię od ŚRODKA duszka (`DEPTH.entities + this.y`, origin
0.5), nie od stóp — ta niespójność jest w projekcie od dawna i drzewa ją tylko
dziedziczą, nie pogłębiają. Skutek: „remis" głębi wypada, gdy podstawa drzewa
jest ~27 px na południe od stóp gracza. Niewidoczne w praktyce.

---

## 3. Kolizja

Pudełko **PNIA** (z `TreeStampManifest`, wyprowadzone z `docs/forrest_atlas.json`
→ `kolizja_tiles`; 18 z 31 wariantów ma zmierzone pudełko, reszta dostaje
awaryjne 16×14 px) ląduje jako statyczne ciało w `map.solids` **i** jako
`NavBox` w siatce `NavGrid` — tym samym przebiegiem co kolizja kafli w
`TiledMap`. `GameScene` już zderza gracza/wrogów/krittery/pociski z `map.solids`,
więc drzewa nie wymagają nowego collidera. Korona niczego nie blokuje.

---

## 4. Pliki

| plik | rola |
|---|---|
| `tools/build_tree_stamps.py` | generator (przymiar; `--zapisz`). Czyta `forrest.png` + `docs/forrest_atlas.json`, pisze `tree_stamps.png`, `TreeStampManifest.ts`, `tree_proto.tmj`, `tools/podglad_tree_stamps.png` |
| `public/assets/tree_stamps.png` | arkusz edytorowy, 768×384, 8×4 komórek 96 px (31 drzew) |
| `src/world/TreeStampManifest.ts` | ⚠ GENEROWANY. Kolejność wariantów (== lokalne id kafla) + pudełko pnia każdego drzewa względem punktu wstawienia obiektu |
| `src/world/TreeLayer.ts` | `buildTreeLayer()` — czyta tile-objecty z `map.objects`, stawia pień+koronę, dokłada kolizję. Wołany z `buildTiledMap` |
| `public/assets/maps/tree_proto.tmj` | ⚠ DEV. Mapa testowa (`window.dev.treeProto.load()`, mapId `treeproto`) — grunt + ~16 nachodzących drzew + gracz |
| `TiledMap.ts` | `TILESET_TEXTURES["TreeStamps"]`, wołanie `buildTreeLayer`, `treeCount` w `TiledBuiltMap`, pominięcie obiektów z `gid` w `readSpawns` |
| `GameConfig.ts` | `ASSETS.treeStamps`, `MAPS.treeproto`, `MAP_BY_ID.treeproto` |
| `Assets.ts` / `BootScene.ts` | `load.image` arkusza (zawsze) + `.tmj` prototypu (tylko dev) |
| `main.ts` | `window.dev.treeProto.load()` / `.back()` |

---

## 5. Co zweryfikowano (2026-08-29)

### Workflow Tiled — `tree_proto.tmj` (~20 drzew, 3 skupiska + kolumna testu głębi)

- ✅ **Round-trip przez Tiled BYTE-IDENTYCZNY.** `tiled.exe --export-map json
  tree_proto.tmj out.json` → `out.json` == `tree_proto.tmj` co do bajta.
  Otwarcie w edytorze i zapis = no-op, żadnego dryfu. (Generator celowo
  wpisuje `firstgid` 229, `draworder: "topdown"`, `opacity: 1` na obiektach,
  `tiledversion 1.12.2` — dokładnie to, co Tiled by wygenerował.)
- ✅ **Renderer Tiled (`tmxrasterizer`) pokazuje mapę poprawnie** — wszystkie
  drzewa w pełnym rozmiarze z arkusza stempli, swobodny overlap, żaden grid
  32×32 nie ogranicza drzewa, punkt `player` na miejscu. `tools/podglad_tree_proto_tiled.png`.
- ✅ **Grid tilesetu 96×96 to tylko paleta** — nie wymusza granicy drzewa ani
  nie blokuje overlapu. Obiekty stawiają się w dowolnym pikselu (snapping w
  Tiled jest domyślnie wyłączony; można włączyć „Snap to Fine Grid" wg uznania).
- ⏳ **Ręczne przesuwanie drzewa myszą w edytorze** — do sprawdzenia przez
  level designera (nie da się z CLI).

### Silnik — mapa testowa `tree_proto.tmj` (21 drzew)

- ✅ 21 drzew renderuje się, różne rozmiary, swobodny overlap — bez „wrastania".
- ✅ **walk-behind** (gracz N od świerka → za koroną), **walk-in-front** (S → nad).
- ✅ 21 statycznych ciał pni, głębie pni = `DEPTH.entities + anchorY`.

### Silnik — ZMIGROWANY LAS `forrest.tmj`

- ✅ `tsc --noEmit` i `npm run build` czyste.
- ✅ **1633 pnie + 1633 korony** = 3266 obrazów `tree-stamps` w scenie (tyle,
  ile obiektów w `.tmj`). Zero starych kafli drzew (warstwy skasowane).
- ✅ **1633 statyczne ciała pni** w `map.solids` (na 2647 wszystkich —
  reszta to kolizja kafli budynków/wody); sprawdzone: każdy pień w kadrze ma
  pasujące ciało 16×13–16×15 px z atlasu.
- ✅ walk-behind / walk-in-front działa w realnym lesie (gracz w gęstym
  skupisku wschodnim → schowany za koronami; wyjście na południe → przed pniami).
- ✅ Renderer Tiled (`tmxrasterizer`) pokazuje zmigrowany las poprawnie —
  `tools/podglad_forrest_migrated.png`.
- ⏳ **NIE zweryfikowano wejścia w pień ręką w ruchu**: panel przeglądarki tej
  sesji dławi pętlę do ~4 FPS. Kolizja = ten sam `collider(player, map.solids)`
  co kafle (dowiedziony w grze).
- ⏳ **Test FPS na telefonie** — 1633 drzewa = 3266 obiektów Image + 1633 ciała
  statyczne. Pomiar prototypu sprite'owego (checkpoint §12) obiecujący, ale to
  inna ścieżka renderowania (klatki cache'owane po wariancie, nie po instancji).

---

## 5a. Jak edytować drzewa w Tiled

**Zmigrowany las: `public/assets/maps/forrest.tmj`, warstwa `trees`.**
Mała mapa do zabawy: `public/assets/maps/tree_proto.tmj`.

⚠ **`forrest.tmj` NIE robi czystego round-tripu przez Tiled — i to jest sprzed
migracji, nie z jej powodu.** Tileset `Nature` deklaruje `tilecount: 133`, a
`Nature.png` ma 342 kafle; Tiled przy zapisie przesuwa `firstgid` wszystkich
tilesetów za `Nature` (o +209) i przenumerowuje dane warstw. **Gra to znosi**
(wiąże tileset po NAZWIE, czyta `firstgid` dynamicznie) — ale plik po zapisie
w Tiled różni się od tego z generatora. To osobna sprawa do naprawy
(`Nature tilecount` w `.tmj`), NIE dotyka edycji warstwy `trees`.

Kroki (dla `tree_proto.tmj` albo `forrest.tmj`):
1. Otwórz mapę w Tiled.
2. Warstwa `trees` — kliknij drzewo w palecie tilesetu **TreeStamps**, wstaw
   **Insert Tile** (`T`), klikaj po mapie. Drzewo pojawia się w pełnym rozmiarze.
3. Sprawdź: przesuwanie (narzędzie **Select Objects**, `S`), overlap (stawiaj
   drzewa na sobie — nic tego nie blokuje), `Delete`, zmiana wariantu
   (prawy-klik obiektu → *Replace Tile*).
4. **Zapisz** (`Ctrl+S`). Dla `tree_proto.tmj` round-trip jest byte-identyczny;
   dla `forrest.tmj` patrz ostrzeżenie o `Nature` wyżej.
5. W grze: konsola → `window.dev.treeProto.forest()` (las) /
   `.load()` (mapa testowa) / `.back()` (wieś).

⚠ **Nie ruszaj `firstgid` tilesetu ręcznie** — Tiled zarządza tym sam; silnik
czyta go dynamicznie.

## 6. Migracja produkcyjnego lasu — WYKONANA 2026-08-29

`tools/migrate_forest_trees_to_objects.py --zapisz` (jednorazowy, można skasować):

1. wykrywa instancje drzew w `trees-base`/`trees-over` (port
   `TreeInstanceExtractor.ts` — kotwica = dolny rząd stempla, walidacja pełnego
   odcisku); **1633 drzew**, tyle co dokumentowane w checkpoincie,
2. pisze jeden tile-object na drzewo do NOWEJ warstwy `trees`
   (`gid = 897 + index_wariantu`, `x = x0·32 − (96−cols·32)/2`,
   `y = (y0+rows)·32`) — wyrenderowane drzewo trafia **piksel w piksel** tam,
   gdzie stały kafle,
3. **kasuje `trees-base` i `trees-over`** (koniec podwójnego renderowania),
4. dopina `TreeStamps` na KOŃCU listy tilesetów (firstgid 897 — nie rusza
   niczego przed nim),
5. zapisuje **obie kopie** `.tmj` z właściwą ścieżką obrazu.

Tileset `Forrest` (530, 28 skrzynek kolizji) **zostaje nietknięty** — nieużywany
po migracji, ale jego usunięcie przenumerowałoby ForestGround/ForestTransitions
i warstwę `ground`. Kolizja pni po migracji pochodzi z `TreeStampManifest`
(to samo źródło: `forrest_atlas.json`).

### Różnice wobec stanu sprzed migracji (świadome, wynikają z modelu)

- **~1076 drzew miało `matched < total`** (kafle przykryte przez sąsiednie
  drzewo), z tego **165 mocno** (<34%). Renderują się teraz jako PEŁNE sprite'y —
  to jest dokładnie to, co model naprawia (checkpoint §6, komentarz w
  `TreeInstanceExtractor.ts`). Efekt: gęste skupiska są czytelniejsze, bez
  szwów kafli.
- **~518 „koron bez pnia"** (kafle `trees-over`, których kotwica w `trees-base`
  całkowicie zniknęła — znany artefakt, `public/assets/README.md`) **NIE zostały
  zmigrowane**; z tego ~194 czyta się po migracji jako goła trawa (drobne
  świerki/brzozy, skupione w niepomalowanych kolumnach wschodu x 100–140).
  ⚠ **DECYZJA autora 2026-08-29: zostawiamy pominięte.** To artefakty starego
  systemu, wschód i tak do przebudowy w następnym etapie. **Nie używać
  `--orphans`.**

### Edycja w Tiled po migracji — sprawdzone

- ✅ Tiled otwiera zmigrowany `forrest.tmj`, warstwa `trees` = zwykłe
  tile-objecty, edycja jak na `tree_proto.tmj`.
- ✅ **Zapis w Tiled → gra dalej wczytuje poprawnie.** Round-trip przez
  `tiled.exe` + wczytanie w silniku: 3266 obrazów drzew, 1633 ciała pni.
  Tiled przy zapisie przenumerowuje `TreeStamps firstgid` 897 → 1106 (kaskada
  od `Nature tilecount`), ale `TreeLayer` czyta `firstgid` dynamicznie i wiąże
  tileset po nazwie — **bez szkody.**

### Bezpiecznik

`tools/migrate_forest_trees_to_objects.py --revert` — `trees` → z powrotem
`trees-base`/`trees-over` pełnymi stemplami. **Nie bit-w-bit** sprzed migracji
(nie odtwarza dawnego wzoru przykrywania — daje las „wyleczony"), ale zachowuje
teren WIP i ~98% drzew. Ostrzeżenie: `git checkout` cofa też niezapisany WIP terenu.

## 7. NASTĘPNY ETAP: ręczna przebudowa layoutu lasu w Tiled

**System drzew jest zamknięty.** Dalej pracuje LEVEL DESIGNER, nie system —
przebudowa rozmieszczenia drzew (grupy, polany, gradient gatunkowy, młodnik) na
obecnej mapie jako bazie. Zakres: `docs/forest_rebuild_scope.md` §6.2
(zaktualizowany pod model obiektowy) + `docs/las_faza1b_final.md`. Nie generować
rozmieszczenia automatycznie, nie ruszać terenu/rzeki/ścieżek/budynków.

## 8. Otwarte / do decyzji

- ✅ **194 „korony bez pnia"** — zostawione pominięte (decyzja autora). `--orphans`
  wycofane z użycia.
- ⚠ **`Nature tilecount` w `forrest.tmj`** (133 vs realne 342 w PNG) — sprawa
  sprzed migracji, niezależna. Zostawiona na później (decyzja autora). Nie psuje
  wczytania w grze; przy zapisie w Tiled przenumerowuje firstgidy (gra to znosi).
- ⚠ **Nadpisany WIP** — `forrest.tmj` w working tree miał niezapisane zmiany
  terenu (ground/water/path/runo, 3 rozlewiska, drzewa wschodu). Migracja
  przepuściła je bez zmian; kopia stanu po migracji: scratchpad tej sesji.
  `git HEAD` to DUŻO starsza wersja mapy.
- **Runo (`undergrowth`/`bushes`) zostaje kaflami** — płaska warstwa terenu.
- **`buildings-over` vs korona** — obie `DEPTH.overhead`, korona o włos wyżej.
  Chata Myśliwego to jedyny budynek w lesie; OK na renderze.
- **Odbicie/obrót tile-objectu drzewa** ignorowane (ostrzeżenie w konsoli).
- **Stary prototyp** — `src/world/TreeZOrderPrototype.ts` + `TreeInstanceExtractor.ts`
  + `ForestAtlasManifest.ts` są po migracji NIEUŻYWANE (nic ich nie importuje),
  logika ekstrakcji przeniesiona do `tools/migrate_forest_trees_to_objects.py`.
  Do skasowania.
- **Arkusze/manifesty generowane** — `TreeStampManifest.ts` to jawny dług.

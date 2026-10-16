# Checkpoint — Faza 1B, po Step 2 (2026-08-27)

> ⚠ **Step 1B jest zrobiony od 2026-08-28 — patrz `PROJECT_CHECKPOINT_STEP1B.md`.**
> Ten plik zostaje jako historia Step 0–2 i jest dalej poprawny w swoim
> zakresie; nie doczytuj stąd stanu kolizji wody, sekcja 7/9 niżej jest
> nieaktualna w tej jednej sprawie.

**Ten plik opisuje wyłącznie to, co FAKTYCZNIE wykonano i zweryfikowano do
tego momentu.** Nie zawiera planów, propozycji ani wariantów — te są
w `docs/las_faza1b_final.md` (plan wykonawczy, decyzje zamknięte),
`docs/las_projekt_docelowy.md` i `docs/las_audyt_level_design.md`
(uzasadnienia „dlaczego").

Kolejność faz z `docs/las_faza1b_final.md` §6, z korektą nałożoną przez
autora w tej sesji: Step 1 podzielony na **1A** (kolizje stabilne: drzewa,
budynki) i **1B** (kolizja wody/brzegów, DOPIERO po ustaleniu finalnej
geometrii rzeki). Zrobione: **Step 0, Step 1A, Step 2.** Step 1B jeszcze
NIE wykonany.

---

## 1. Co zostało wykonane

### Step 0 — synchronizacja kopii `.tmj`

`public/assets/forrest.tmj` był sprzed trzech dni (inne md5 niż
`public/assets/maps/forrest.tmj`, który czyta gra). Zsynchronizowany:
skopiowana treść z `maps/forrest.tmj`, z podmianą wyłącznie ścieżek do PNG
w tilesetach (`../Teren.png` → `Teren.png`, tak samo dla `Nature`,
`Buildings`, `znaki`) — to jedyna zamierzona różnica między kopiami.

### Step 1A — kolizje stabilne (drzewa, budynki)

Dodano prawdziwą kolizję kafli (Tile Collision Editor w formacie Tiled,
klucz `tiles[]` w tilesecie) tam, gdzie do tej pory **nie było jej wcale**
(potwierdzone wcześniejszym audytem: zero kafli z kolizją we wszystkich
trzech mapach projektu).

**Pnie drzew** (`Nature`, firstgid 229) — kolizja tylko na pniu, nie na
całej komórce, na podstawie **realnego pomiaru pikseli** (przycięte
i powiększone próbki z `Nature.png`, nie zgadywanie):

| klasa drzew | reguła | box (lokalne px kafla) |
|---|---|---|
| 1-kaflowe (`*_maly`, 5 gat.) | pień wyśrodkowany, poszerzony o wariancję (`grab_maly` wychyla się) | `x=9,y=19,w=14,h=13` |
| 2-kaflowe (`*_duzy`/`*_duzy2` 2×3 i `*_sredni` 2×2, 10 par) | pień na szwie kafli — lewy kafel dostaje box przy prawej krawędzi, prawy przy lewej | lewy `x=24,y=19,w=8,h=13`; prawy `x=0,y=19,w=8,h=13` |
| 3-kaflowe (`dab_duzy`, `dab_duzy2`, `buk_duzy`) | pień WYŁĄCZNIE w środkowym kaflu; skrajne kafle bez kolizji (puste piksele, potwierdzone wizualnie) | środek: `x=8,y=17,w=16,h=15` |

Razem: **28 wpisów kolizji** w tilesecie `Nature`.

Fakt pikselowy dopisany do `public/assets/README.md` (sekcja „Gdzie w dolnym
rzędzie (`trees-base`) faktycznie siedzi pień") zgodnie z regułą projektu
o zapisywaniu odkryć pikselowych.

**Chata Myśliwego** (`Buildings`, firstgid 362) — kolizja pełnokaflowa
(property `solid: true`) na ścianach i fundamencie, **z wyjątkiem kafli
drzwi** (`drzwi_0` local 6, `drzwi_1` local 25) — te leżą TOPMOST nad
ścianą w tej samej komórce, więc pominięcie ich w liście kolizji jest tym,
co robi otwarte przejście (mechanizm „najwyższy kafel decyduje", już
istniejący w `TiledMap.ts`). Nazwy zdekodowane z `docs/budynki.json`, nie
zgadywane. Lista solid: `sciana_gora_0/1/2`, `sciana_1`, `sciana2_1`,
`sciana3_1`, `sciana_3`, `sciana_4`, `fundament_0/1/2`, `okno_0` — **12
wpisów** w tilesecie `Buildings`.

> ⚠ **POPRAWKA 2026-08-27 (3) — ta lista była NIEKOMPLETNA i dom dało się
> przejść od północy.** Objęła tylko trzy dolne wiersze budynku (y5–y7).
> Dach — `kalenica_0/1/2`, `polac_0/1/2`, `polac2_1`, `komin_1`,
> `okap_0/1/2`, wiersze y2–y4 — leży na warstwie `buildings-over`, więc to
> ON jest kaflem najwyższym w tych komórkach; brak `solid` czynił litą
> ścianę z bali przechodnią. **Dopisane: 11 kafli, razem 23 wpisy.**
> `komin_0` (67,1) zostaje przechodni świadomie. Komórek solid na mapie:
> 1188 → **1203**. Szczegóły i asercja `chata-szczelna`:
> `docs/dziennik.md` 2026-08-27 (3), `docs/las_faza1b_final.md` §6.1.

**Kod:** jedna linia w `src/scenes/GameScene.ts`, zaraz po pętli
budującej `this.critters`:

```ts
this.physics.add.collider(this.critters, map.solids);
```

Musiała wejść RAZEM z kolizją kafli, nie po — inaczej sarna z Fazy 1A
zaczęłaby wyglądać na zepsutą (przechodzi przez drzewa w świecie, w którym
gracz już nie przechodzi).

### Step 2 — rzeka + bród

**Kolejność zachowana zgodnie z instrukcją autora: najpierw geometria,
DOPIERO POTEM (w Step 1B) kolizja wody/brzegów — Step 2 nie dodaje żadnej
kolizji wody.**

1. **Naprawiony bród.** Przy x=39–42 rzeka miała **zero kafli wody**
   (dziura, nie płycizna) — droga i piasek przykrywały pustkę. Woda
   przywrócona pod całym brodem; most/przejście nadal jest wyłącznie drogą
   + piaskiem na wierzchu wody (kolizja wody czeka na 1B).
2. **Wygładzony profil szerokości.** Stary profil miał trzy niezależne
   naruszenia trendu zachód-szeroko/wschód-wąsko: dziurę przy brodzie,
   dołek-potem-wybrzuszenie zaraz po niej, i drugi garb (x55–64) SZERSZY
   niż odcinek przed nim. Naprawione **regionalną** izotoniczną regresją
   (10-kolumnowe biny, dopasowanie monotoniczne na średnich binów, lokalny
   wobble z surowych danych zachowany względem trendu binu) — trend
   makro jest teraz nierosnący zachód→wschód, ale rzeka nie jest sztywnym
   kanałem o stałej szerokości.
3. **Brzegi.** Pas piasku (`sand`, blob-47) i akcent trzciny (kępki trawy
   z `Nature.png` na warstwie `undergrowth`) po obu stronach wody, na całej
   długości rzeki (wcześniej istniały tylko 22 kafle piasku, wyłącznie
   przy brodzie).
4. Jedna dekoracja `brzeg_stawu` (x1664,y792 → x1680,y720) przesunięta na
   nowy pas piasku — po zmianie szerokości rzeki stała w gołej trawie,
   dwa kafle od najbliższego brzegu.

**Wynik liczbowy (z żywego `.tmj`):**

| | wartość |
|---|---|
| kafle wody | 503 (z 502 przed zmianą) |
| kafle piasku | 400 (z 22 przed zmianą) |
| kafle runa (`undergrowth`) | 293 (z 190 przed zmianą — 103 nowe kępki-trzciny) |
| osobne zbiorniki wody | **1** (były 2, rozdzielone dziurą przy brodzie) |
| szerokość rzeki, zachód (x=0) | 7 kafli |
| szerokość rzeki, wschód (x=99) | 4 kafle |
| szerokość przy brodzie (x=40–41) | 3 kafle |
| woda dotyka krawędzi zachodniej | tak, wiersze 17–23 |
| woda dotyka krawędzi wschodniej | tak, wiersze 17–20 |
| wyspy lądu w pasie rzeki | 0 |

---

## 2. Zmienione pliki

**Mapa (dane, nie kod):**
- `public/assets/maps/forrest.tmj` — mapa czytana przez grę. Zmiany:
  `tiles[]` w tilesetach `Nature` i `Buildings` (kolizja), warstwy `water`,
  `sand`, `undergrowth` (rzeka), jeden obiekt `brzeg_stawu` przesunięty.
- `public/assets/forrest.tmj` — druga kopia, zsynchronizowana po KAŻDYM
  kroku (deep-equal potwierdzony modulo ścieżek do PNG).

**Kod:**
- `src/scenes/GameScene.ts` — jedna linia (`collider(critters, map.solids)`)
  + komentarz. Reszta różnicy w tym pliku widocznej w `git diff` pochodzi
  z WCZEŚNIEJSZEJ sesji (Faza 1A, `critter.update(now, this.player)` i
  przekazanie `critterPoi`) — nietknięta w tej sesji.

**Dokumentacja:**
- `public/assets/README.md` — nowa sekcja z faktem pikselowym o pniach
  drzew (patrz Step 1A wyżej).

**Nie zmienione, mimo że widoczne w `git status` jako zmodyfikowane** (to
jest dorobek WCZEŚNIEJSZYCH sesji — Faza 1A i migracja sklepu — nietknięty
w tej sesji implementacyjnej): `src/config/GameConfig.ts`,
`src/entities/Critter.ts` (usunięty 2026-10-04), `src/entities/CLAUDE.md`, `src/ui/CLAUDE.md`,
`src/ui/ItemTooltip.ts`, `src/ui/ShopPanel.ts`, `docs/dziennik.md`,
`docs/bestiariusz_audyt.md`, `docs/fauna_faza1.md`,
`docs/sklep_migracja_wzorca.md`, `tools/sklep_cofniecie.mjs`. Wpisy w
`docs/README.md` i `docs/odlozone.md` dodane wcześniej w tej samej sesji
(faza audytu/projektu, przed implementacją) — dotyczą dokumentów
`las_audyt_level_design.md`, `las_projekt_docelowy.md`,
`las_faza1b_final.md`, nie samej implementacji Step 0–2.

---

## 3. Narzędzia i skrypty użyte

Wszystkie skrypty jednorazowe — **żaden nie został zapisany w `tools/`**,
zgodnie z regułą `src/world/CLAUDE.md`.

- **Node.js, skrypty ad-hoc** (czytanie/pisanie `.tmj` jako JSON, synchronizacja
  kopii, scalanie warstw) — uruchamiane bezpośrednio przez `node -e` albo
  z plików w scratchpadzie sesji.
- **`tools/build_mapa.py` — zaimportowany jako biblioteka Pythona
  (`import build_mapa as bm`), NIE uruchomiony jako program.** Użyte
  funkcje czysto obliczeniowe, bez żadnego zapisu na dysk: `maluj_obszar()`
  (auto-tiling blob-47 z maski boolowskiej na kafle), `Warstwa`,
  `pusta_maska()`, stałe `BLOB`, `KEPKI`, `FIRST_TEREN`, `FIRST_NATURE`.
  **`--zapisz` ani `main()` generatora NI GDY nie zostały wywołane.**
  Potwierdzone przed użyciem: import jest bezstanowy (czyta tylko
  `docs/kafle.json`, `docs/budynki.json` i PNG-e w trybie tylko-odczyt).
- **Własny serializer JSON** (`ser()`, rekurencyjna funkcja w Node) zamiast
  `JSON.stringify` — żeby zachować formatowanie zgodne z eksportem Tiled
  (spacja po `:` i `,`, jedna linia, bez wcięć), więc plik wygląda tak,
  jakby zapisał go sam Tiled, nie zewnętrzny skrypt.
- **PIL/Pillow (Python)** — renderowanie podglądów z prawdziwych
  tilesetów (nie schematy) do weryfikacji wizualnej („patrz na render, nie
  tylko na raport").
- **Izotoniczna regresja (PAVA, własna implementacja JS)** — dopasowanie
  monotonicznego trendu szerokości rzeki, na poziomie binów 10-kolumnowych,
  nie per-kolumna (per-kolumna dawało sztuczny, płaski „kanał" na 30+
  kolumnach).
- **`git show HEAD:...`** — do wyciągnięcia czystej (sprzed sesji) warstwy
  `undergrowth`, żeby druga próba rozstawienia trzciny nie nakładała się
  na pierwszą (wadliwą) próbę.

---

## 4. Znalezione i rozwiązane problemy

| # | problem | jak znaleziony | rozwiązanie |
|---|---|---|---|
| P1 | `public/assets/forrest.tmj` rozjechany z kopią czytaną przez grę (inne md5, sprzed 3 dni) | porównanie md5 obu plików | resync w Step 0, powtarzany po każdym kolejnym kroku |
| P2 | Zero kolizji kafli we wszystkich mapach projektu | ustalone we wcześniejszym audycie, potwierdzone ponownie przed Step 1A | dodano `tiles[]` z kształtami/property `solid` |
| P3 | Bez wiedzy o realnym układzie pikseli pnia, kolizja na całej komórce zablokowałaby przejście między drzewami | przycięcie i powiększenie próbek z `Nature.png` (8 gatunków/klas sprawdzonych) | boxy tylko na pniu, reguła per szerokość stempla (1/2/3 kafle), udokumentowana w `public/assets/README.md` |
| P4 | Drzwi Myśliwego omal nie zostały zablokowane (mieszają się z wpisem „ściana" w tej samej komórce) | analiza `docs/budynki.json` + siatka warstw `buildings`/`buildings-detale` | drzwi (local 6, 25) świadomie pominięte na liście solid — mechanizm „najwyższy kafel wygrywa" robi resztę |
| P5 | Bród był DZIURĄ w rzece (zero wody na 4 kolumnach), nie płycizną | pełny skan profilu rzeki kolumna po kolumnie | woda przywrócona pod całym brodem |
| P6 | Profil szerokości rzeki niemonotoniczny w TRZECH miejscach, nie jednym (dziura + dołek-wybrzuszenie + drugi, szerszy garb x55-64) | pełny skan profilu + wykres tekstowy | izotoniczna regresja na poziomie 10-kolumnowych binów (nie per-kolumna, żeby uniknąć sztucznego płaskiego kanału) |
| P7 | ⚠ **Pierwsza wersja brzegu (pas piasku 1 kafel) wyglądała źle na renderze mimo poprawnych danych** — pojedyncza kolumna wody wystająca o 1 kafel niżej niż sąsiednie tworzyła wizualny „ząb"/oderwaną kałużę, a cienki pierścień piasku dawał izolowane, oderwane plamy piasku (kafle blob-47 bez sąsiadów tego samego materiału) | **wykryte na renderze, nie na liczbach** — raport (maska bez dziur, 200 kafli) był czysty, ale obraz pokazywał defekt | brzeg przebudowany od zera: linia banku liczona z mocniej wygładzonej (okno 7) wersji krawędzi wody, pas piasku poszerzony do 2 kafli, trzcina odtworzona na czystej (sprzed sesji) warstwie `undergrowth`, żeby nie nakładać się na pierwszą, wadliwą próbę |
| P8 | Dekoracja `brzeg_stawu` (x1664,y792) po zmianie szerokości rzeki stała 2 kafle od najbliższego piasku, w gołej trawie | ręczny przegląd obiektów dekoracyjnych blisko rzeki po zmianie | przesunięta na (x1680,y720), na nowy pas piasku |
| P9 | Zabłąkany plik tymczasowy `.river_edges.json` w korzeniu repo (pominięty przy sprzątaniu jednego z kroków diagnostycznych) | `git status` przed checkpointem | usunięty |
| P10 | `screenshot`/`javascript_tool` w Browser pane nie działają w tej sesji (`document.hidden: true` nawet po sfrontowaniu zakładki) — ten sam znany limit środowiska co przy Fazie 1A | próba weryfikacji w silniku po Step 1A | zamiast tego: bezpośrednia symulacja rzeczywistej ścieżki kodu (`ParseTilesets`/`topmostTileAt`/`CollisionLookup` z `TiledMap.ts`) przeciw żywemu `.tmj`, plus `tsc`/`build` |

---

## 5. Wykonane testy i walidacje

**Po Step 1A:**
- `npx tsc --noEmit` — czyste.
- `npm run build` — czyste (jedyne ostrzeżenie: rozmiar chunka, niezwiązane).
- **Symulacja rzeczywistej logiki kolizji** (reimplementacja `ParseTilesets`
  Tiled 1.2+, `topmostTileAt`, `CollisionLookup.boxesFor` z `TiledMap.ts`,
  uruchomiona przeciw żywemu `.tmj`) — 1188 komórek solid, drzwi Myśliwego
  otwarte, zero konfliktów spawn↔solid (sprawdzone: `player`, `deer`, `fox`,
  `rabbit`, `wolf`, `greywolf`, `boar`, `spider`, `venomspider`, `bear`,
  `merchant`), bród nietknięty (0 kolizji w jego obszarze poza jednym
  legalnym drzewem przy brzegu, potwierdzonym ręcznie).
- **Renderowane podglądy z prawdziwych tilesetów** (nie schemat): pełna
  mapa z nałożonymi boxami kolizji, przybliżenie chaty Myśliwego (drzwi
  otwarte, ściany zablokowane), gęsty fragment lasu (kolizja tylko na
  pniach, nie na koronach).

**Po Step 2:**
- `npx tsc --noEmit` + `npm run build` — czyste (river/sand nie dotyka
  kodu, ale sprawdzone dla pewności).
- **10 asercji z `tools/build_mapa.py`** (`wilk-wilk`, `samotny-sfora`,
  `samotny-Szary`, `Szary-wilk`, `kupiec-fire`, `dzik-pajak`, `zajac-wilk`,
  `gracz-zajac`, `niedzw-wrog`, `niedzw-hub`) zastosowane do żywego `.tmj`
  — **wszystkie OK**, bez zmian względem stanu przed Step 2 (rzeka nie
  rusza żadnego spawnu).
- **Skan spójności rzeki**: liczba osobnych zbiorników wody = 1 (flood-fill
  4-kierunkowy), zero wysp lądu w pasie rzeki, woda dotyka obu krawędzi
  mapy (zachodniej i wschodniej).
- **Liczba komórek solid niezmieniona (1188)** po zmianach w
  wodzie/piasku/runie — potwierdza, że Step 2 nie dotknął przypadkiem
  żadnej kolizji z Step 1A.
- **Renderowane podglądy** (pełna szerokość rzeki, zbliżenie na bród) —
  dwie iteracje: pierwsza ujawniła defekt (P7), druga potwierdzona jako
  poprawna i wysłana do autora jako checkpoint.
- Weryfikacja w silniku (Browser pane) — **niedostępna w tej sesji**
  (środowisko, nie kod — patrz P10). Zastąpiona symulacją kodu + renderem.

---

## 6. Aktualny stan mapy — co jest zatwierdzone i czego NIE ruszać

**Zatwierdzone i zamknięte w tej sesji (nie cofać, nie przerabiać bez
wyraźnej decyzji autora):**

- Kolizja pni drzew i chaty Myśliwego (Step 1A) — kompletna dla WSZYSTKICH
  gatunków/rozmiarów drzew obecnych na mapie i dla jedynego budynku w lesie.
  ⚠ **Dla chaty stało się to prawdą dopiero po poprawce 2026-08-27 (3)** —
  patrz ramka przy Step 1A wyżej; do tego czasu dach był przechodni.
- Kształt i szerokość rzeki (Step 2) — bród ma realną wodę, profil
  szerokości jest regionalnie monotoniczny, jeden spójny zbiornik.
- Brzegi (pas piasku 2 kafle + trzcina) wzdłuż całej rzeki.
- Pozycje wszystkich 26 stworzeń i wszystkich obiektów fabularnych
  (Myśliwy, ognisko, portale) — **żadne nie zostało przesunięte** w
  Step 0–2 poza jedną dekoracją (`brzeg_stawu`, kosmetyka brzegu).
- Rozmiar mapy: **wciąż 100×60** — resize do 140×60 to Step 4, jeszcze nie
  wykonany.

**Czego NIE wolno ruszać bez decyzji autora** (zgodnie z
`docs/las_faza1b_final.md` §1, decyzje zamknięte Z-1…Z-10):
- Pozycji wataha wilków (Z-7, anomalia fabularna).
- Kierunku rzeki E→W i statusu młyna jako „poza mapą" (Z-4).
- Rozstawienia sieciarzy (czeka na decyzję z `las_faza1b_final.md` §1.1 —
  sprzeczność `swiat.md` vs asercja `dzik-pajak`).
- Generatora `tools/build_mapa.py` — **nigdy nie uruchamiać z `--zapisz`**
  w tej fazie; zna tylko 100×60 i nadpisałby całą pracę Step 0–2.

**Nie zaczęte jeszcze:** Step 1B (kolizja wody/brzegów), Step 3 (przemalowanie
istniejącego terenu — polany, gradient wschodni, olszyna, ściana boru,
wyrąb, podwórze Myśliwego), Step 4 (resize 100→140), Step 5 (przesunięcie
bramy wschodniej), Step 6 (nowe kolumny), Step 7 (obiekty i ślady), Step 8
(spawny), Step 9 (dokumentacja), Step 10 (build/test finalny).

---

## 7. Następny krok — Step 1B (kolizja wody/brzegów)

Warunek wstępny **spełniony**: geometria finalnej rzeki (Step 2) jest
zamknięta i zweryfikowana. Step 1B może się zacząć.

Zakres, zgodnie z `docs/las_faza1b_final.md` §3.7: kafle wody (blob-47,
gid 77–123 w Teren) dostają kolizję pełnokaflową, **z wyjątkiem kafli
brodu** (x39–44 w obecnym układzie 100-kolumnowym) — mechanizm „najwyższy
kafel decyduje" ma sprawić, że droga/piasek narysowane NA WIERZCHU wody
przy brodzie automatycznie znoszą kolizję wody w tych konkretnych
komórkach, tak samo jak już działa most nad wodą gdzie indziej w silniku.
Do potwierdzenia przy wykonaniu: które dokładnie komórki brodu mają
`path`/`sand` jako topmost (nie każda z 3-4 kolumn brodu musi mieć drogę
dokładnie na wierzchu — trzeba to sprawdzić na żywych danych, nie założyć).

Po dodaniu kolizji wody: render pełnej szerokości rzeki + zbliżenie na
bród, dokładnie jak w Step 2, plus ręczne przejście checklisty z
`las_faza1b_final.md` §6.2 (gracz nie przechodzi przez rzekę poza brodem)
— w miarę możliwości środowiska (patrz P10).

---

## 8. Jak wznowić pracę na innym komputerze

1. **Sklonuj/zsynchronizuj repo i zrób `git pull`.** ⚠ **Ta linia mówiła do
   2026-08-27, że postęp jest tylko na dysku i nic nie jest scommitowane — to
   już NIEPRAWDA.** Step 0–2 jest w `a8279a6`, a poprawka dachu chaty i cała
   dokumentacja z 2026-08-27 w commicie następnym. Zamiast wierzyć tej
   sekcji:

   ```bash
   git log --oneline -3 && git status --short
   ```

2. **Przeczytaj w tej kolejności:**
   - **`docs/forest_rebuild_scope.md`** — ⭐ **zakres prac w Tiled.** Co
     malować i gdzie: obszary A1–A8 + A5b, tabela 26 stworzeń, lista prac.
     ⚠ **To jest plik, który się otwiera przed Tiled**, nie plan niżej.
   - `docs/las_faza1b_final.md` — decyzje **Z-1…Z-10** i **kolejność §6**.
     **Nie analizuj wariantów ponownie.** ⚠ **§2 P6 jest nieaktualne**
     (stara puszcza wyszła z tej mapy); ⚠ **§10 jest otwartą sprawą**
     (standard prześwitu — patrz punkt 6 niżej).
   - `PROJECT_CHECKPOINT_STEP2.md` (ten plik) — co faktycznie zrobiono.
   - `src/world/CLAUDE.md` — reguły katalogu (musi być doczytany przez
     `Read`/`Edit`, nie samym `cat`).
3. **Zweryfikuj stan przed kontynuacją:**
   ```bash
   npx tsc --noEmit && npm run build
   ```
   Oba muszą przejść czysto. Jeśli nie — coś się zepsuło poza tą sesją,
   zatrzymaj się i zdiagnozuj przed Step 1B.
4. **Potwierdź, że pracujesz na właściwym pliku**:
   `public/assets/maps/forrest.tmj` (nie na `public/assets/forrest.tmj` —
   to kopia do Tiled, synchronizowana PO każdym kroku, nigdy źródło).
5. **Zacznij od Step 1B** (sekcja 7 wyżej). Nie uruchamiaj
   `tools/build_mapa.py --zapisz` — patrz sekcja 6, „czego nie ruszać".
6. Po Step 1B: render pełnej rzeki + brodu, zweryfikuj kolizję wody
   (gracz nie wchodzi w wodę poza brodem), zaktualizuj ten plik albo
   utwórz `PROJECT_CHECKPOINT_STEP1B.md` na tej samej zasadzie.

---

## 9. ⚠ Co się zmieniło 2026-08-27, po zamknięciu tego checkpointu

Trzy rzeczy, które unieważniają część powyższego. **Czytaj to przed sekcjami
1–8**, one opisują stan sprzed tych zmian.

1. **Dach chaty Myśliwego dostał kolizję** (poprawka do Step 1A). Lista solid
   w tilesecie `Buildings`: 12 → **23 wpisy**; komórek solid na mapie
   1188 → **1203**. Szczegóły w ramce przy Step 1A wyżej.
2. **Tożsamość lasu zmieniona na GOSPODARCZY**, stara puszcza wyprowadzona
   na osobną, przyszłą mapę. **`docs/forest_rebuild_scope.md`** jest odtąd
   dokumentem, który się otwiera przed Tiled. **§2 P6 planu — nieaktualne.**
3. ⚠ **Otwarta sprawa blokująca malowanie: `las_faza1b_final.md` §10.**
   Playtest wykrył, że **52 bramy w lesie mają prześwit 18 px** — dokładnie
   tyle, co ciało gracza — więc dzik (22 px) nie przechodzi tam, gdzie gracz
   przechodzi; pościg klinuje się na pniu w 11–20 % pozycji; a sarna ma ciało
   79×57 px i dostęp do 40 % mapy. **Standard prześwitu nie jest ustalony**,
   dlatego `forest_rebuild_scope.md` celowo nie podaje ani jednej liczby
   prześwitu. **Nie wymyślaj jej samodzielnie** — to decyzja autora.

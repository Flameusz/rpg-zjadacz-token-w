# Checkpoint — resize lasu 100×60 → 160×60 (2026-08-28)

> ⚠ **Kolejny krok jest zrobiony od tego samego dnia — patrz
> `PROJECT_CHECKPOINT_TERRAIN.md`** (warstwa `ground` dla całego A1–A10).
> Ten plik zostaje poprawny w swoim zakresie (resize, brama, minimapa), nie
> doczytuj stąd stanu terenu.

**Ten plik opisuje wyłącznie to, co FAKTYCZNIE wykonano i zweryfikowano.**
Poprzedni stan: `PROJECT_CHECKPOINT_STEP1B.md` (kolizja wody, zamknięta).
Kontekst decyzji (dlaczego 160, nie 140; dlaczego A9/A10, nie wydłużony A8) —
`docs/dziennik.md` 2026-08-28, wpis „Review Senior Game Architecta: las
160×60". Ten checkpoint nie powtarza tamtej argumentacji, tylko zapisuje
wykonanie.

**Zakres tego kroku: WYŁĄCZNIE techniczne rozszerzenie mapy.** Zero nowych
drzew, zero dekoracji, zero zmian populacji poza jednym, wcześniej
zatwierdzonym wyjątkiem (§1.2). Terrain pass A1–A10 to następny, osobny krok.

---

## 1. Co zostało wykonane

### 1.1 Resize 100×60 → 160×60, wschód wyłącznie

Obie kopie (`public/assets/maps/forrest.tmj`, `public/assets/forrest.tmj`):
wszystkie 12 warstw kafli przeszły z 100×60 na 160×60, kotwica lewa-górna.
Nowe kolumny x100–159 są **całkowicie puste** (gid 0 na każdej warstwie) —
zgodnie z poleceniem, terrain pass ich nie dotyczy w tym kroku.

**Zweryfikowane, nie założone**: diff każdej komórki x0–99 każdej z 12 warstw
przeciw commitowi sprzed tej zmiany — **bajt w bajt identyczne**, zero
wyjątków. Diff wszystkich trzech warstw obiektów (`objects` 40, `rosliny` 42,
`kamienie` 58) — dokładnie **dwa** obiekty zmienione (portal wschodni, lis #2
— patrz §1.2–1.3), **38 pozostałych nietkniętych co do piksela**.

### 1.2 Brama wschodnia — przesunięta na nową krawędź

Ta sama operacja, którą `las_faza1b_final.md` §3.5 opisywał dla 140 (teraz
wykonana dla 160), tym samym wzorem „krawędź minus jeden kafel":

| stała (`tools/portale.py`) | było | jest |
|---|---|---|
| `BRAMA_LAS_WSCHOD` | tx=98 | **tx=158** |
| `WEJSCIE_DO_LASU_ZE_WSCHODU` | tx=95 | **tx=155** |
| `BRAMA_GESTWINY` / `WEJSCIE_DO_GESTWINY` | — | **bez zmian** (leżą na mapie Gęstwiny, niezależne od szerokości lasu) |

Zmiany w danych:

| plik | pole | było | jest |
|---|---|---|---|
| `forrest.tmj` (obie kopie) | obiekt `portal` (target=`thicket`), `x` | 3152 | **5072** (=158×32+16) |
| `thicket-gestwina.tmj` | obiekt `portal` (target=`forest`), `spawnX` | 3056 | **4976** (=155×32+16) |

`y`/`spawnY` nietknięte (ty=46/ty=45 się nie zmieniają — resize jest tylko na
osi X). `tools/portale.py` zaktualizowany jako jedyne źródło prawdy dla tych
liczb, z komentarzem wyjaśniającym przeliczenie.

⚠ **`thicket-gestwina.tmj` sam pozostaje 64×64** — nie rośnie razem z lasem,
leży ZA bramą (`docs/swiat.md`: „strefa wschodnia gęstwina" wewnątrz lasu ≠
osobna mapa `thicket-gestwina.tmj` za nią).

### 1.3 Lis #2 — przeniesiony z wody na brzeg

**Jedyny wyjątek od „nie ruszaj spawnów"**, jawnie dopuszczony przez autora,
bo to nie nowa decyzja — `forest_rebuild_scope.md` wiersz S4 śledził to
przesunięcie od przed tą sesją, a `PROJECT_CHECKPOINT_STEP1B.md` §1.3
potwierdził, że to prawdziwy konflikt fizyki (Critter ma ciało + collider z
`map.solids`), nie tylko wizualny.

Obiekt `fox` (id=131): **(59,18) w wodzie → (59,16) na piasku brzegu**, dwa
kafle prosto na północ — najkrótszy ruch, który zdejmuje konflikt. Sprawdzone
na żywych danych: warstwa `water` w (59,16) ma gid 0.

---

## 2. Techniczna walidacja

Metoda: symulacja prawdziwej ścieżki silnika (`topmostTileAt` +
`CollisionLookup` z `TiledMap.ts`) na żywym, już zresize'owanym `.tmj` — ta
sama metoda co w Step 1A/1B, nie przybliżenie.

| sprawdzenie | wynik |
|---|---|
| Wymiary mapy | 160×60 ✅ |
| x0–99, wszystkie 12 warstw | bajt w bajt identyczne z poprzednim commitem ✅ |
| x100–159, wszystkie 12 warstw | całkowicie puste (0 niezerowych kafli) ✅ |
| Obiekty (3 warstwy, 140 obiektów razem) | 2 zmienione (portal, lis #2), 138 nietkniętych ✅ |
| Obie kopie `forrest.tmj` w sync | deep-equal modulo ścieżka PNG ✅ |
| Kolizja — suma komórek solid | **1673** (identycznie jak przed resize — nowa przestrzeń nie dodaje żadnej kolizji) ✅ |
| `NavGrid` (symulacja rozmiaru, `NAV_CELL=8`) | 640×240 = 153 600 B ≈ **150 KB** (skaluje się liniowo, jak przewidziano w analizie przed decyzją) |
| Konflikty spawn↔solid | 6 — te same fałszywe alarmy co w Step 1B (`lilia`×2 — lilia wodna, poprawnie w wodzie; `babka`/`dziurawiec`/kamienie — bez ciała fizycznego). **Lis #2 usunięty z listy** ✅ |
| `linia-ubytku` (zero bird/deer/fox/rabbit przy x>95) | 0 naruszeń ✅ |
| `rzeka-spojna` (liczba zbiorników wody) | 1 ✅ |
| `kupiec-fire` (> 92 px) | 122 px ✅ |
| `niedzw-hub` (> 400 px, próg dzisiejszy — niedźwiedź nieruszony w tym kroku) | 614 px ✅ (⚠ przeliczyć na nowo, gdy niedźwiedź faktycznie przejdzie do A9 w kroku populacji — nie zakładać, że 614 zostanie aktualne) |
| `npx tsc --noEmit` | czyste |
| `npm run build` | czyste |

**Minimapa** (`tools/build_minimap.py --zapisz`): `forest_minimap.png`
przebudowana, teraz 640×240 px (było 400×240). `thicket_minimap.png` bez
zmian (mapa nietknięta). `village_minimap.png` **wygenerowała się inaczej niż
w repo mimo nietkniętej `village-zagaje.tmj`** — to jest realny, wcześniejszy
dryf między tamtą mapą a jej ostatnio zapisaną minimapą, niezwiązany z tą
sesją. **Cofnięte do wersji z repo**, żeby nie mieszać go z tym commitem —
zgłoszone niżej jako osobne znalezisko, nie naprawione.

⚠ **Nie zweryfikowane w silniku** — ten sam, powtarzający się limit
środowiska (Browser pane nie uruchamia Phasera w tej sesji). Cała walidacja
wyżej to symulacja danych i kodu, nie gra. W szczególności **„brama działa w
obie strony i nie odbija" (checklista §6.2 planu) wymaga przejścia w grze.**

---

## 3. Znalezisko poza zakresem — dryf minimapy wsi

`village_minimap.png` w repo nie odpowiada dziś treści `village-zagaje.tmj`
(regenerowana różni się o kilkaset bajtów, ten sam rozmiar 400×400, inna
treść pikseli). Nieznana przyczyna — mapa wsi nie była dotykana w żadnej
sesji od dłuższego czasu. **Nienaprawione celowo** — poza zakresem tego kroku
i nie chciałem mieszać dwóch niepowiązanych zmian w jednym commicie.
Warunek powrotu: sesja dotykająca `village-zagaje.tmj` albo osobne
zlecenie „odśwież minimapy".

---

## 4. Otwarte punkty — kolejne kroki, świadomie nierozpoczęte

| # | co | gdzie |
|---|---|---|
| 1 | **Terrain pass A1–A10** — x0–99 (P3 polany, gradient) i x100–159 (A9 Brzeg Północny, A10 Źródło) RAZEM, jednym przebiegiem | następny, osobny etap (decyzja autora) |
| 2 | Populacja (Z-9) — wrogowie 19→25, ambient 7→15, rozkład rdzeń+peryferie | po terrain passie, osobny etap |
| 3 | `niedzw-hub` — przeliczyć próg, gdy niedźwiedź faktycznie przejdzie do A9 | krok populacji |
| 4 | `forest_rebuild_scope.md` §4–§6 (diagram, tabela obszarów, lista prac) — opisują wciąż wariant 140×60 ze starym, wydłużonym A8 | zaktualizować przy terrain passie, nie teraz |
| 5 | Dryf `village_minimap.png` | osobne zlecenie |
| 6 | Standard prześwitu (`las_faza1b_final.md` §10) | dalej odłożony, nietknięty tą sesją |

**Nie ruszone w tym kroku, celowo**: żadne drzewo, dekoracja ani kafel terenu
w x0–159; żaden spawn poza lisem #2; warstwa ruchu (zamknięta wcześniejszym
checkpointem).

---

## 5. Jak wznowić

1. `git log --oneline -3 && git status --short` — nie wierz prozie.
2. Ten plik + `PROJECT_CHECKPOINT_STEP1B.md` + `PROJECT_CHECKPOINT_STEP2.md`
   dają pełny stan techniczny mapy.
3. `npx tsc --noEmit && npm run build` — oba muszą przejść czysto.
4. Kontekst decyzji o 160×60/A9/A10/populacji: `docs/dziennik.md` 2026-08-28.
5. Następny krok to **terrain pass A1–A10** — `docs/forest_rebuild_scope.md`
   jest dokumentem otwieranym przed Tiled, ale jego §4–§6 wymagają
   uzgodnienia z nowym układem przed malowaniem (patrz §4 punkt 4 wyżej).

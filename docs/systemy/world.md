---
typ: STAN
domena: world
tytul: Świat — mapa, spawn, przejście
stan: zywy
implemented: tak
documented: tak
verified: [kod:2026-09-07, przymiar:doc_check, przymiar:culling_geometria_weryfikacja, przymiar:occlusion_weryfikacja, przymiar:forest_clearance, przymiar:kadr_pustka_weryfikacja, przymiar:mapa_przymiar]
kotwice:
  - src/world/TiledMap.ts
  - src/world/WorldComposer.ts
  - src/world/VoidFraming.ts
  - GameConfig.SWIAT.czlonkowie
  - src/world/Buildings.ts
  - src/world/MapBuilder.ts
  - src/world/RenderCulling.ts
  - src/core/WorldState.ts
  - src/core/Exploration.ts
  - GameConfig.MAP_FOG
  - GameConfig.MAP_ATLAS
  - src/core/RenderCuller.ts
  - GameConfig.WORLD.tileSize
  - GameConfig.CAMERA.cullMarginFactor
otwarte: [OI-77, OI-165]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-14
---

# Świat — mapa, spawn, przejście

> **Czym jest ten dokument.** Odpowiedzią na pytanie **skąd bierze się miejsce,
> w którym toczy się gra**: kto czyta mapę, co mapa ma prawo powiedzieć, jak
> działa przejście między mapami i co przeżywa taką zmianę.
>
> **Czym NIE jest.** ⛔ **Nie opisuje żadnej konkretnej mapy ani żadnego
> arkusza grafiki** — pierwsze jest zawartością, drugie należy do `assets`.

---

## 0. Granice domeny

| pytanie | domena |
|---|---|
| **co i gdzie** stoi na mapie, przejezdność, przejścia | **`world`** |
| **jak** mapa staje się sceną: odczyt, budowa, siatka nawigacji | **`world`** |
| widoczność treści statycznej *(culling)* i porządek rysowania | **`world`** |
| **z czego** narysowany jest kafel, arkusz, atlas, styl | `assets` |
| jakim wektorem ktoś się przemieszcza | `movement` |
| **kiedy** stworzenie goni i ile ma HP | `creatures` |
| kiedy stanowisko odrasta | `gathering` |
| kto daje zadanie i jakie | `quests` |
| co przeżywa wyjście z gry | `save` |

### 0.1 Granica `world` ↔ `assets` — rozstrzygnięta kodem

⭐ **Test: co się stanie, gdy tego zabraknie?**

| brakuje | skutek | domena |
|---|---|---|
| **pliku graficznego** | ⚙ **gra działa** — podstawia się obrazek zastępczy | `assets` |
| **punktu na mapie** | ⛔ **byt nie istnieje w grze** | **`world`** |

⚠⚠ **Mapa mówi CO i GDZIE; arkusz mówi CZYM to narysować.** Ta sama grafika
obsługuje wiele map, a ta sama mapa działa z obrazkiem zastępczym — ⛔ **żadna
z tych rzeczy nie jest prawdą w drugą stronę**.

⚠ **Jeden szew jest realny i biegnie przez nazwę**: nazwa obiektu w edytorze
mapy jest **kluczem**, który `world` tłumaczy na byt gry — a nazwa pliku
graficznego jest **osobnym** kluczem, tłumaczonym przez `assets`. ⚙ Tabele
tłumaczeń są dwie i **nic ich nie wiąże** (`OI-76`).

### 0.2 Zależności

| kierunek | domena | przez co |
|---|---|---|
| `world` **daje** | `movement` | **przejezdność** jako siatkę nawigacji |
| `world` **daje** | `creatures`, `quests`, `gathering` | **punkty**, w których ich byty powstają |
| `world` **bierze** | `quests` | ⚠ **fakt, że elita już padła** — wtedy jej punkt jest pomijany |
| `world` **bierze** | `assets` | materiał do narysowania |
| `world` **daje** | `save` | tożsamość mapy i pozycję gracza |

---

## 1. Mapa jest DANYMI, scena jest wynikiem

⚠⚠ **Jedna mapa naraz.** Przejście to **przebudowa sceny od zera** — nic
z poprzedniej mapy nie zostaje. ⭐ Z tego wynikają wszystkie pozostałe reguły
tego dokumentu: nie ma czego symulować w tle, nie ma czego przenosić, a to, co
ma przeżyć, musi **zostać jawnie przeniesione** (§4).

⚠ **Mapa autorska ma ścieżkę awaryjną w kodzie.** Gra **zawsze się uruchamia**:
brak pliku mapy daje mapę zbudowaną z tablicy. ⚙ Awaryjna **nie buduje siatki
nawigacji** i to jest poprawne — sterowanie schodzi wtedy na ruch wprost.

⚠ **Odczyt idzie po WSZYSTKICH warstwach obiektów**, więc podział na warstwy
w edytorze jest **wygodą autora, nie kontraktem**.

---

## 2. Co mapa ma prawo powiedzieć

**Mapa autoruje dwanaście rodzajów punktów** — przeciwników, mieszkańców,
stanowiska zbieractwa, zwierzęta, drobną faunę, ptaki, ogniska, studnie, koła
wodne, dekoracje, **przejścia** i **miejsca celów zadań** (`miejsce` z `id`,
2026-10-12).

⚠⚠ **Punkt jest UPRAWNIENIEM, nie bytem.** To, czy w danym punkcie coś stanie,
rozstrzyga **domena tego bytu**: stanowisko zbieractwa bywa puste *(`gathering`)*,
a punkt elity jest **pomijany, gdy zadanie już ją zamknęło** *(`quests`)*,
a pies z imieniem (Kirka) **nie jest widoczny, dopóki zadanie go nie zwróci**.

⭐ **To jest najważniejsza właściwość tej domeny: mapa nie ma władzy nad
zawartością, tylko nad miejscem.**

⚠ **Nazwa obiektu jest kluczem tłumaczonym przez tabele** — i tabele przyjmują
**dwa zapisy nazw** *(polski i angielski)*, żeby autor mapy nie musiał pamiętać,
który jest „ten właściwy".

⚠ **Rozmiar kafla jest jedną liczbą** dla całego projektu; wszystko inne —
rozmiar mapy, pozycje — wynika z niej i z pliku mapy.

⭐ **Budynek = obiekt** warstwy `budynki` → kolizja i model 3D (`src/world/CLAUDE.md`).

---

## 3. Przejezdność

⚠⚠ **Siatka nawigacji powstaje z TEGO SAMEGO przebiegu, który tworzy
przeszkody fizyczne.** ⛔ Dwa niezależne odczyty tej samej mapy rozjechałyby
się cicho: gracz zatrzymywałby się tam, gdzie ścieżka mówi „przejdziesz".

⚠ **Siatka zna szerokość ciała** — pytanie brzmi „czy **to** ciało tędy
przejdzie", nie „czy kafel jest wolny" *(reguła należy do `movement`)*.

⚠ **Kolizja terenu istnieje dziś na jednej mapie z trzech.** ⚙ To jest stan
zawartości, nie wada systemu — mapa bez kolizji jest legalna i działa.

⭐ **Las ma regułę ROZSTAWU** (N-271, liczby → decyzja 2026-10-04). ⚠ Pień
przesunięty w Tiled łamie ją cicho — strażnik `tools/forest_clearance.py`.

---

## 4. Przejście między mapami

```
dotknięcie przejścia → przygaszenie → PRZEBUDOWA SCENY → punkt przybycia
```

⚠⚠ **Przejście przenosi, nie leczy.** Stan chwilowy postaci jest **jawnie
przekazywany** do nowej sceny — bo scena buduje się od zera, więc wszystko, co
nie zostanie podane wprost, **przepadnie**.

⚠ **Punkt przybycia autoruje MAPA ŹRÓDŁOWA**, nie docelowa — przejście wie,
dokąd prowadzi **i gdzie się w tym miejscu staje**.

⚠ **Trwałe zasoby postaci nie potrzebują przenoszenia** — żyją poza sceną
i przebudowa ich nie dotyka.

⚠⚠ **Przejście jest też punktem zapisu** *(`save`)* i **momentem, w którym
świat zapisuje swoją zakładkę** *(`gathering`)*. ⭐ Jedna czynność gracza
domyka trzy różne mechanizmy w trzech domenach.

### 4.1 Otwarty świat — mapy sklejane w jedną

⭐ **Obszary leżą obok siebie w pliku świata Tiled** (`SWIAT`) i przy budowie
sceny są **sklejane w JEDNĄ mapę w pamięci**, zanim zobaczy ją reszta silnika.
Kolizje, nawigacja, spawny i obraz widzą jedną mapę — więc przejście między
obszarami jest **płynne**: bez przejścia, bez przebudowy sceny. Przejście
z §4 zostaje dla miejsc spoza pliku świata.

- Warstwy łączą się **po nazwie**; tilesety są doklejane kopiami; obiekty
  przesunięte o położenie obszaru. Przejścia MIĘDZY obszarami świata znikają.
- Pole świata poza obszarami jest **lite** jak krawędź mapy.
- ⭐ **Kadr nie pokazuje pustki** (2026-10-12). Wieś ma 128 kafli szerokości,
  las 240, więc na wschód od wsi leży pole bez gruntu, rysowane na czarno.
  Co klatkę scena liczy kadr wyśrodkowany na graczu i, jeśli zachodzi na
  pustkę, przesuwa cel kamery (`followOffset`). ⚠ Reguła jest CIĄGŁA:
  krótsza oś w pełni, dłuższa `max(0, 2·krótsza − dłuższa)`. „Najkrótsza
  droga" przeskakiwała przy wewnętrznym narożniku wieś↔las o ~470 px.
  Zapas 40 px pokrywa niedojazd kamery. Przymiar: `kadr_pustka_weryfikacja`
  (sabotaż świeci). Ślad zostaje tylko przy biegu po skosie przez sam
  narożnik: ≤ 12 px przez ułamek sekundy przy ~36 kl./s.
- ⚠ **Identyfikator obszaru przeżywa jako adres**: zapis albo przejście
  wskazujące obszar trafia do świata z przesunięciem pozycji — stare zapisy
  działają bez migracji.
- Obszar pod graczem steruje **tłem dźwiękowym** i **minimapą** (`ui`).
- ⚠ **Degradacja:** nieudane sklejenie → pierwszy obszar jako osobna mapa.
  Gra startuje zawsze.

---

## 5. Co ze świata przeżywa

⚠⚠ **Domyślnie: nic.** Świat odtwarza się z mapy przy każdym wejściu — i to
jest reguła, nie oszczędność.

**Dwa wyjątki, obie krótkie listy czytane raz przy wejściu:**

| wyjątek | dlaczego wolno |
|---|---|
| **elita, która nie wraca** | jej punkt jest pomijany na podstawie stanu zadań |
| **zakładka odrastania stanowisk** | lista małych liczb, nie byty *(`gathering`)* |
| **odkryty teren** (2026-10-14) | bity per obszar, nie byty *(§5.1)* |

⚠ **Tożsamość mapy i pozycja gracza są migawką, nie zdarzeniem** — czyta je
ekran mapy, który potrafi otworzyć się długo po ostatniej zmianie.

⚠ **Pozycje mieszkańców zapisuje się RAZ na budowę sceny**, bo się nie ruszają;
pozycję gracza — co klatkę. ⚙ Rozdział jest świadomy: to samo pole odświeżane
sześćdziesiąt razy na sekundę dla nieruchomego bytu byłoby pracą za nic.

### 5.1 Odkryty teren — mgła na mapie (2026-10-14)

`core/Exploration.ts`: siatka komórek `MAP_FOG.cellPx` (64 px) per OBSZAR
(`village`, `forest`, `thicket` — id obszaru, nie pliku świata), koło
`revealRadiusPx` wokół gracza; `GameScene.update` woła `visit`, które liczy
coś tylko przy zmianie komórki. ⚠ Pamięć działa ZAWSZE, także bez
Kartografii (decyzja autora) — umiejętność decyduje tylko, czy mapę WIDAĆ:
I (Myśliwy, 0 zł) — zakładka MAPA, II (Sołtys, 60 zł, `requiresSkill`) —
minimapa; bez II róg jest pusty (`ui` §6.1). Siatka powstaje leniwie; wymiary jadą w zapisie (`save`, „`explored`”).

⭐ **Atlas świata** (`MAP_ATLAS`): pozycja każdego obszaru na mapie całego
świata, także mapy za portalem — Gęstwina stoi brama do bramy przy lesie
(240; 165 kafli). Rozmiar obszaru wynika z obrazu minimapy. Nowy obszar
bez wpisu w atlasie nie pojawi się w widoku „Świat”. Cele zadań
(oddaj / porozmawiaj) są na mapie także we mgle (`src/ui/CLAUDE.md`).

Bramka: `node tools/mapa_przymiar.mjs` — atlas ↔ `swiat.world`, bramy
portali stykają się w atlasie (portal do obszaru spoza atlasu = BŁĄD),
obrazy minimapy ↔ mapy Tiled, koło i zapis mgły, Kartografia na starym
zapisie; każda reguła z kontrolą na zepsutych danych.

---

## 6. Widoczność i porządek rysowania

⚠⚠ **Ukrywanie treści poza kadrem dotyka WYŁĄCZNIE widoczności.** ⛔ Nigdy
aktywności, głębi, przynależności do listy ani kolizji. ⭐ Powód jest
zmierzony, nie ostrożnościowy: **trafianie wejściem nie sprawdza widoczności**,
więc ukryty obiekt interaktywny zostałby **klikalny tam, gdzie go nie widać**.

⚠ **Objęta jest wyłącznie treść STATYCZNA i NIEinteraktywna.** Byty ruchome są
poza tym mechanizmem: jest ich dziesiątki, nie tysiące — ⚙ **mało do zyskania,
dużo do pomylenia**.

⚠ **Obrys liczy się RAZ, przy rejestracji.** Bezpieczne wyłącznie dlatego, że
kandydaci nigdy się nie ruszają — ⛔ byt, który się przesuwa, **nie ma tu czego
szukać**.

⚠⚠ **Porządek rysowania ma dwie listy i to jest ograniczenie pracy, nie jej
źródło.** Osobna warstwa zbiera **wyłącznie to, co naprawdę musi porównywać się
z graczem co klatkę**; wszystko inne zostaje w liście, której sortowanie staje
się przez to **bezczynne**.

⚠ **Dopisanie bytu do warstwy to POŁOWA roboty** — każde dziecko utworzone
później *(pasek, etykieta, znacznik)* wymaga tego samego przy swoim własnym
powstaniu.

⚠ **Geometria widoczności jest CZYSTA** *(bez silnika)* i ma własny przymiar —
⭐ dlatego da się dowieść, że **drzewo z podstawą poza kadrem, a koroną
w kadrze, zostaje widoczne**, zanim trafi to na telefon.

### 6.1 Gracz zasłonięty przez świat — obrys

Widok z góry ma wadę wrodzoną: postać wchodzi pod to, co rysuje się nad nią,
i **gracz przestaje wiedzieć, gdzie stoi** — mimo że w rozgrywce nic się nie
zmieniło. Odpowiedzią jest **sylwetka postaci rysowana nad zasłoną**, zapalana
wyłącznie wtedy, gdy zasłona faktycznie zachodzi.

⚠⚠ **Zasłoną jest DOKŁADNIE to, co rysuje się nad pasmem bytów** — i takich
klas są dwie: **korony drzew** (osobne obrazy) oraz **warstwy kafli, których
nazwa kończy się na `-over`** (dachy, korony malowane kaflami). ⛔ **Pnie i
dekoracja NIE są zasłonami**: siedzą w warstwie porządku rysowania, więc
przykrywają postać tylko wtedy, gdy stoją PRZED nią — a to jest poprawny obraz,
nie zgubiona postać. Dopisanie ich dałoby obrys przy każdym krzaku.

⭐ **Jedna reguła nazwy `-over` rządzi od tej pory DWIEMA rzeczami** — tym, co
rysuje się nad bytami, i tym, co może je schować. ⚠ Drugi test tej nazwy
w innym pliku rozjechałby się przy pierwszej zmianie konwencji, a diff by tego
nie pokazał.

⚠⚠ **Zasłoną jest RYSUNEK, nie komórka arkusza.** Stempel drzewa siedzi
w komórce 96 px, ale sadzonka zajmuje w niej **32 px** rysunku — rejestracja
komórki dawałaby obrys postaci stojącej **32 px OBOK** drzewa. Wymiary bierze
się ze zmierzonego, **wygenerowanego** manifestu stempli. Pas pnia jest z tej
wysokości odjęty (pień nie jest zasłoną).

⚠ **Stan wynika WYŁĄCZNIE z bieżącej klatki** — bez timera, tweenu i progu
procentowego. Wyjście zza drzewa gasi obrys w tej samej klatce; nie da się go
zostawić zapalonego.

⛔ **To jest prezentacja i nic więcej.** Nie dotyka kolizji, nawigacji,
geometrii walki ani **głębi istniejących warstw** — obrys dostał WŁASNE piętro,
wstawione między to nad bytami a podgląd celowania, i żadne z dotychczasowych
nie zostało przestawione. Rejestr zasłon ma jednego czytelnika.

⚠ **Geometria zapalania też jest CZYSTA** i ma własny przymiar
(`tools/occlusion_weryfikacja.mjs`) — dowodzi m.in., że kubełkowanie nie gubi
zasłon i że postać w pustym marginesie komórki obrysu **nie dostaje**.

---

## 7. Niezmienniki

- **N-239** — **jedna mapa naraz**; przejście to **przebudowa od zera** (§1).
- **N-240** — **brak pliku mapy nie zatrzymuje gry** (§1).
- **N-241** — **punkt jest uprawnieniem, nie bytem**; o obecności rozstrzyga
  domena bytu (§2).
- **N-242** — **przejezdność i przeszkody powstają z JEDNEGO przebiegu** (§3).
- **N-243** — **co ma przeżyć przejście, musi zostać podane wprost** (§4).
- **N-244** — **punkt przybycia autoruje mapa źródłowa** (§4).
- **N-245** — **domyślnie ze świata nie przeżywa nic**; wyjątkiem jest **krótka
  lista czytana raz przy wejściu** (§5).
- **N-246** — **ukrywanie dotyka wyłącznie widoczności** (§6).
- **N-247** — **culling obejmuje tylko treść statyczną i nieinteraktywną**;
  obrys liczony raz (§6).
- **N-248** — **warstwa porządku rysowania jest ograniczeniem pracy**;
  dopisanie bytu obejmuje jego dzieci (§6).
- **N-271** — **w lesie każda istota mieści się między każdą parą pni
  wnętrza, a spawn wroga stoi na polanie**; pilnuje `forest_clearance` (§3).

---

## 8. Checklista

**Nowy punkt na mapie:** ⚠ dopisz nazwę do **tabeli tłumaczeń**, inaczej punkt
jest cicho ignorowany (`OI-76`) · ⚙ pamiętaj, że punkt to **uprawnienie**
(N-241).

**Nowa mapa:** ⚠ jeśli ma mieć kolizję, musi ją mieć **w warstwach terenu** —
siatka nawigacji powstaje z tego samego przebiegu (N-242) · ⚠ autoruj punkty
przybycia **po stronie źródła** (N-244) · ⚙ mapa bez stanowisk, bez kolizji
i bez mieszkańców jest **legalna**.

**Nowy byt statyczny:** ⚠ zarejestruj go do ukrywania **po ustaleniu pozycji**,
nigdy przed (N-247) · ⛔ nie rejestruj bytu, który się rusza albo przyjmuje
dotknięcie (N-246).

**Nowy byt ruchomy:** ⚠ dopisz go do warstwy porządku rysowania **razem
z dziećmi** (N-248).

**Bramki:** `npx tsc --noEmit` · `npm run build` ·
`node tools/culling_geometria_weryfikacja.mjs` · `node tools/doc_check.mjs`.

---

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| jedna mapa naraz; przejście = przebudowa | ✅ | ✅ | `kod:2026-09-06` |
| otwarty świat: obszary sklejone w jedną mapę, adres obszaru przeżywa | ✅ | ✅ | `kod:2026-10-11` |
| mapa awaryjna z kodu | ✅ | ✅ | `kod:2026-09-06` |
| jedenaście rodzajów punktów, nazwa jako klucz | ✅ | ✅ | `kod:2026-09-06` |
| **punkt jako uprawnienie, nie byt** | ✅ | ✅ *(opisane po raz pierwszy)* | `kod:2026-09-06` |
| przejezdność z tego samego przebiegu | ✅ | ✅ | `kod:2026-10-09` |
| przenoszenie stanu przez przejście | ✅ | ✅ | `kod:2026-09-06` |
| dwa wyjątki stanu świata | ✅ | ✅ | `kod:2026-09-06` |
| migawka mapy i pozycji | ✅ | ✅ | `kod:2026-09-06` |
| culling: wyłącznie widoczność, treść statyczna | ✅ | ✅ | ✅ `przymiar:culling_geometria` |
| warstwa porządku rysowania | ✅ | ✅ | `kod:2026-09-06` |
| **spójność nazw obiektów mapy z tabelami** | ⚙ **ostrzeżenie w silniku + `dev.mapWarnings()`** | ✅ | ✅ `reka:2026-10-11` (wstrzyknięta literówka → 1 ostrzeżenie) — OI-76 zamknięte |
| **kolizja terenu** | ⚙ **jedna mapa z trzech** | ✅ | ❌ — OI-77 |

---

## Otwarte

| id | rzecz |
|---|---|
| **OI-75** | ✅ **ZAMKNIĘTE 2026-10-09** — komentarze w `MapBuilder` i `MovementContext` mówią dziś, że siatka jest CZYTANA, i wymieniają czytelników. |
| **OI-76** | ✅ **ZAMKNIĘTE 2026-10-11** — silnik ostrzega o nierozpoznanej nazwie, a `dev.mapWarnings()` zbiera ostrzeżenia ostatniej mapy (sprawdzone wstrzykniętą literówką). |
| **OI-77** | ⚠ **Kolizja terenu istnieje na jednej mapie z trzech** — pozostałe dwie są w pełni przechodnie. ⚙ To jest **stan zawartości, nie wada systemu**: mapa bez kolizji jest legalna i działa, a sterowanie schodzi wtedy na ruch wprost. ⚠ Ale znaczy, że reguły przejezdności *(szerokość ciała, obchodzenie przeszkód, „nie ma drogi" jako odpowiedź)* są **ćwiczone przez jedną trzecią świata**. ⛔ **Decyzja AUTORA**: czy pozostałe mapy mają dostać kolizję, czy są świadomie otwarte. |

---

## Czego ten dokument nie rozstrzyga

- **Żadnej konkretnej mapy** — co gdzie stoi jest zawartością.
- **Z czego mapa jest narysowana** — kafle, arkusze, atlasy, styl: `assets`.
- **Jakim wektorem ktoś się przemieszcza** — `movement`.
- **Kiedy stworzenie goni i ile ma HP** — `creatures`.
- **Kiedy stanowisko odrasta** — `gathering`.
- **Kto daje zadanie** — `quests`.
- **Co przeżywa wyjście z gry** — `save`.
- ⛔ **Czy mapy są dobrze zaprojektowane** — to jest praca nad zawartością,
  z własnym, zamkniętym etapem.

---

## Gdzie szukać POWODÓW

| pytanie | dokument | moc |
|---|---|---|
| odczyt mapy, tabele nazw, budowa sceny | `src/world/TiledMap.ts` *(przy kodzie)* | ACTIVE |
| dlaczego culling dotyka wyłącznie widoczności | `src/core/RenderCuller.ts` | ACTIVE |
| geometria widoczności i jej dowód | `src/world/RenderCulling.ts` | ACTIVE |
| przebudowa lasu, kolizja i nawigacja — zamknięty etap | `docs/las_faza1b_final.md`, `docs/plan_dalszych_prac.md` | HISTORICAL — ⚠ etap zamknięty, nie stan |
| dlaczego las ma 240×90 i odstęp pni 84 px | `docs/decyzje/2026-10-04-rozstaw-lasu.md` | ACTIVE |
| eksport z edytora, tilesety, warstwy, spawny | `src/world/CLAUDE.md` | ACTIVE |
| rozjazdy, pomiary i rejestr tej ekstrakcji | `docs/proces/ekstrakcja_world.md` | — |

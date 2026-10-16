---
typ: HISTORIA
domena: world
tytul: Las, Faza 1B — dokument przekazania
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-09-05
---

# Las, Faza 1B — DOKUMENT PRZEKAZANIA (źródło prawdy dla sesji implementacyjnej)

> ## ⚠ STAN TEJ DOMENY MIESZKA GDZIE INDZIEJ
>
> Aktualny opis mechaniki: **`docs/systemy/world.md`** (`STAN`).
> **Przy sprzeczności wygrywa tamten plik** — jest kotwiczony w kodzie
> i pilnowany przez `tools/doc_check.mjs`.
>
> ⛔ **Tego dokumentu nie czyta się po odpowiedź na „jak jest dziś”.** Zostaje
> jako `HISTORIA`: pomiary, uzasadnienia, odrzucone warianty i wiedza o tym,
> czego już próbowano. To jest jego pełna funkcja, nie brak.


> ## ✅ ETAP ZAMKNIĘTY 2026-08-31 — poprawka księgowa 2026-09-05
>
> ```
> LAS — ART / WORLD DESIGN  = CLOSED
> LAS — AI / NAVIGATION     = STABLE WITH POLISH
> ```
>
> **Ten plik zostaje ŹRÓDŁEM PRAWDY dla decyzji Z-1…Z-10 (§1) i tylko dla
> nich.** Statusy wykonania kroków niżej opisują 2026-08-27 i **nie są stanem
> bieżącym** — pełny zapis zamknięcia: `docs/forest_rebuild_scope.md` (baner)
> oraz `docs/dziennik.md` 2026-08-31 (4)–(6), (9), (10).
>
> ⚠ **Dwa zdania w tym pliku były nieaktualne i zostały tak oznaczone:**
> „reszta kroków (1B, 3–11) **nie jest wdrożona**" oraz „§10 jest
> **niezatwierdzoną propozycją**, konsultacja w toku". Step 1B, resize i
> terrain pass są wykonane (checkpointy w korzeniu repo); konsultacja z §10
> odbyła się i została rozstrzygnięta. **Część kroków świadomie pozostawiono
> jako gameplay polish, a nie jako lukę do domknięcia** — to jest różnica
> między „niezrobione" a „zamknięte z decyzją".
>
> ⛔ **Nie otwierać etapu ponownie bez konkretnego błędu z DZIAŁAJĄCEJ GRY.**

**Status: PLAN WYKONAWCZY etapu ZAMKNIĘTEGO. Zatwierdzony przez autora
2026-08-27, etap zamknięty 2026-08-31.**

⚠ **Zapis stanu wykonania z 2026-08-27, zachowany jako historia:** zrobione
Step 0, 1A, 2 — synchronizacja kopii `.tmj`, kolizja pni i chaty Myśliwego,
rzeka z brodem i brzegami. Szczegóły w `PROJECT_CHECKPOINT_STEP2.md` (poza tą
paczką, w korzeniu repo). Reszta kroków (1B, 3–11) była wtedy niewdrożona —
**patrz baner wyżej po stan na dziś.**

⚠ **Do Tiled otwieraj `docs/forest_rebuild_scope.md`, nie ten plik.** Ten
zostaje źródłem prawdy dla **decyzji Z-1…Z-10 i kolejności kroków §6**; treść
obszarów (co malować i gdzie) przeszła tam 2026-08-27 razem ze zmianą
tożsamości lokacji na **las gospodarczy** i z wyprowadzeniem starej puszczy
poza tę mapę (**§2 P6 jest nieaktualne** — patrz ramka w tamtej sekcji).

⚠ **Zanim zaczniesz Step 3 — przeczytaj §10.** Playtest autora wykrył, że
kolizja z Step 1A weszła w konflikt z rozmiarami ciał stworzeń: część lasu
przepuszcza gracza, a nie przepuszcza dzika, a sarna została zamknięta na 40 %
mapy. **§10 jest niezatwierdzoną propozycją i zmienia kolejność §6** —
konsultacja w toku.

⚠ **Ten dokument NIE przedstawia wariantów.** Warianty były rozważane
w `docs/las_audyt_level_design.md` (audyt stanu) i `docs/las_projekt_docelowy.md`
(projekt i uzasadnienia). **Tu są wyłącznie decyzje i sposób ich wykonania.**
Tamte dokumenty otwieraj po uzasadnienie „dlaczego", nigdy po to, żeby wrócić
do wyboru.

Schemat układu: **`docs/img/las_uklad_docelowy.png`**.

> ## ⚠ Przeczytaj, zanim cokolwiek zaproponujesz
>
> 1. **Kierunek jest zamknięty.** Nie wracaj do wariantu „zostawić 100×60".
>    Autor zamknął to 2026-08-27. Jeśli coś w trakcie pracy wygląda na argument
>    przeciw — **zanotuj i pracuj dalej**, nie przerywaj na dyskusję.
> 2. **Nie dodawaj stworzeń.** Bilans całej fazy to **+0 mobów**; jedyne ruchy
>    to przesunięcia. Pula XP jest przestrzelona i ma jawną barierkę
>    (`odlozone.md`).
> 3. **`tools/build_mapa.py --zapisz` SKASUJE tę pracę.** Generator zna
>    `SZER, WYS = 100, 60` i nie zna niczego, co powstało w Tiled. Nie
>    uruchamiaj go z `--zapisz` **nigdy w tej fazie**.
> 4. **Pracuj na `public/assets/maps/forrest.tmj`** — druga kopia
>    (`public/assets/forrest.tmj`) jest o trzy dni starsza i ma inne md5.
>    Synchronizacja jest krokiem 0 (§6).
> 5. **Reguły katalogu obowiązują.** Otwórz `src/world/CLAUDE.md` wprost —
>    odczyt bashem go nie wstrzykuje.

---

## 1. Decyzje ZAMKNIĘTE

Nie otwierać bez wyraźnego sygnału od autora.

| # | decyzja | uzasadnienie (nie powtarzać, tylko odsyłać) |
|---|---|---|
| **Z-1** | ⚠ **PODNIESIONE 2026-08-28: mapa rośnie do 160 × 60** (5120 × 1920 px), nie 140 × 60. Decyzja autora po review Senior Game Architecta — A8 przy 140 był przeładowany (4 set-piece'y na 28 kolumnach), a 20 dodatkowych kolumn dostało własną tożsamość (A10 · Źródło) zamiast wydłużać A8. **Technicznie wdrożone** — `PROJECT_CHECKPOINT_RESIZE160.md`. Teren nowych kolumn (x100–159) **jeszcze niepomalowany** | pierwotne: `las_projekt_docelowy.md` §7.1 — na wschód od drogi mieszczą się dziś 2 pasma progresji z 3 potrzebnych |
| **Z-2** | **Rozszerzenie WYŁĄCZNIE na wschód**, kolumny 100–159 (⚠ było 100–140) | §7.2 — północ to brama do wsi, zachód to wieś i młyn, południe to najgorsza oś telefonu |
| **Z-3** | **Obecna część zachodnia (x 0–99) zostaje bazą** — żaden istniejący obiekt ani kafel **nie zmienia współrzędnych** | resize jest czystym dopiskiem kolumn |
| **Z-4** | **Rzeka = granica świata ludzi i natury, przepływ E → W** | §2.3 — dzisiejszy profil szerokości (2–5 kafli na wschodzie, 6–9 na zachodzie) **już** jest profilem rzeki płynącej na zachód; fabuła i koszt wskazują to samo |
| **Z-5** | **Bród = kontrolowane przejście** (nie most) | §2.2 — most jako późniejsza inwestycja wsi, potencjalnie zadanie |
| **Z-6** | **Niedźwiedź przenosi się do starej puszczy (P6)** | §4.2 — dziś stoi **614 px = 0,80 kadru** od Myśliwego, co nie broni się w żadnym czytaniu |
| **Z-7** | **Wilki zostają w SW jako ANOMALIA FABULARNA** — pozycje bez zmian | §5 P3b — *„coś w głębi lasu wypchnęło wilka pod wioskę"* znaczy, że zła głębokość JEST fabułą |
| **Z-8** | **Dzik ↔ pająki = granica dwóch światów** (LINIA UBYTKU) | §6.3 — nie granica biomów, tylko sukcesja: dzik ostatni, pająk pierwszy |
| **Z-9** | ⚠ **PONOWNIE OTWARTE 2026-08-28.** Było zamknięte jako „+0" dla mapy 140×60 (8400 kafli, 323 kafle/stworzenie — już 40% spadek gęstości wobec dzisiejszych 231). Przy 160×60 (9600 kafli) „+0" oznaczałoby 369 kafli/stworzenie, **60% spadek**, na mapie, która przy dzisiejszej gęstości i tak nie przechodzi własnego testu pustki (§4.1 audytu: 28% mapy > pół kadru od czegokolwiek żywego). Kierunek z review Senior Game Architecta: **wrogowie 19→25 (+32%), ambient 7→15 (+114%)** — rozkład, nie mnożenie walk. **To jest wciąż decyzja projektowa do wykonania w kroku populacji, nie liczba z tej tabeli** | poprzednie uzasadnienie (nieaktualne): bilans fazy +0 |
| **Z-10** | **Myśliwy zostaje na skraju** | decyzja autora z 2026-08-17 (`swiat.md`); pomiar potwierdza (812 px = 1,05 kadru od bramy) |

### 1.1 Konsekwencje Z-8, które trzeba było rozstrzygnąć po drodze

⚠ Z-8 **unieważnia zdanie ze `swiat.md`** §4: *„Rozstawienie jest celowe:
jeden osobno i **dwa przy dziku**"*. To zdanie było już wcześniej sprzeczne
z asercją `dzik-pajak > 340` w `tools/build_mapa.py:1264` (odwróconą
świadomie 2026-08-13). **Zamknięcie Z-8 rozstrzyga tę sprzeczność na korzyść
asercji.** `swiat.md` trzeba poprawić — patrz §6, krok 9.

---

## 2. Docelowy układ mapy

Kształt to **litera „L"**: gracz wchodzi bramą północną (x 41), idzie na
południe przez rzekę, a za nią skręca na wschód. Moment skrętu jest momentem,
w którym droga przestaje prowadzić do wsi i zaczyna prowadzić w las.

### P1 · SKRAJ LASU  —  x 0–75, y 0–16  (istniejące)

| | |
|---|---|
| **Funkcja** | pierwsze 30 sekund; pasmo, przez które gracz przechodzi za każdym razem, w obie strony, przez całą grę |
| **Klimat** | jasno, szerokie prześwity, ślady ludzi bliżej wsi |
| **Teren** | brzoza + buk (jaśniejsze gatunki), zwarcie **30–40 %**, trawa czysta/pojedyncza; droga, ślepa odnoga do Myśliwego, wyręb na zachodzie |
| **Zagrożenie** | ⚠ **ZERO. Nic tu nie zabija — to jest decyzja, nie luka.** Pasmo przechodzone dwieście razy nie może mieć w sobie walki |
| **Stworzenia** | ptaki, **sarna przy drodze**, króliki na wschodnim skraju |
| **Człowiek** | wyręb + pieńki (zachód), obejście Myśliwego (wschód), **drogowskaz na rozjeździe** |

### P2 · RZEKA  —  cała szerokość, y 16–26  (istniejące, do przebudowy)

| | |
|---|---|
| **Funkcja** | **próg świata**: za nią kończy się teren wsi |
| **Klimat** | woda płynie z głębi lasu ku wsi; szeroko i wolno na zachodzie, wąsko i szybko na wschodzie |
| **Teren** | rzeka **2 kafle na wschodzie → 9 na zachodzie, monotonicznie**; brzegi: piasek blob-47, trzcina z kępek, olcha; **bród x 38–45** |
| **Zagrożenie** | ⚠ **ZERO. Próg ma być cichy — groźnie robi się po drugiej stronie** |
| **Stworzenia** | sarny u wodopoju (**podejście po osi POZIOMEJ**), lis węszący brzegiem, ptaki wodne |
| **Człowiek** | bród; miejsce pod przyszły most |

⚠ **Bez kolizji to pasmo nie istnieje.** Rzeka bez kolizji jest kolorem.

### P3 · LAS WŁAŚCIWY  —  x 15–65, y 26–52  (istniejące, do przebudowy)

| | |
|---|---|
| **Funkcja** | twój rewir; grunt pod zadania Myśliwego |
| **Klimat** | znany, roboczy, przewidywalny |
| **Teren** | dąb + buk, zwarcie **50–60 %**, ⚠ **2–3 PRAWDZIWE POLANY** (§3.3); koniec utrzymywanej drogi i skręt na wschód |
| **Zagrożenie** | **niskie** — króliki; samotny wilk na zachodnim skraju jako ostrzeżenie |
| **Stworzenia** | króliki (na polanach), lis |
| **Człowiek** | mielerz, ostatnie znaki ciosane na drzewach |

### P3b · BÓR WILKÓW  —  x 0–22, y 36–59  ⚠ ANOMALIA, nie stopień progresji

| | |
|---|---|
| **Funkcja** | **fabuła, nie progresja.** Leży POZA osią (oś idzie na południe, potem wschód; bór jest na zachód) |
| **Klimat** | najciemniej i najgęściej na mapie; **wygląda na miejsce, w którym ktoś jest od niedawna** |
| **Teren** | świerk + grab, zwarcie **75–85 %** (już jest 70–83 %); ⚠ **ściana świerku na granicy x ≈ 22 i y ≈ 36** |
| **Zagrożenie** | **wysokie, na złej głębokości i to jest sens** |
| **Stworzenia** | wataha ×3 + Szary — ⚠ **POZYCJE BEZ ZMIAN** |
| **Ślady** | ⚠ **brak wydeptanych ścieżek**, nora rozkopana pod wykrotem, świeża padlina. **Nie wygląda jak dom** |

⚠ **Bramkowanie jest OSTRZEŻENIEM, nie dystansem** — Myśliwy ostrzega
o Szarym z imienia. To już działa i jest poprawnym narzędziem.

### P4 · OLSZYNA / MOKRADŁA  —  x 52–78, y 26–42  (istniejące, do zbudowania)

| | |
|---|---|
| **Funkcja** | pierwsze siedlisko zbudowane **wokół** stworzenia, a nie pod nie |
| **Klimat** | mokro, grząsko, ciemna ziemia |
| **Teren** | ⚠ **rozlewiska bez odpływu** (woda blob-47 plamami, NIE połączona z rzeką), ziemia 1/2, olcha i świerk, przewrócone pnie, zwarcie 55–65 % |
| **Zagrożenie** | **średnie** |
| **Stworzenia** | **dziki ×2** — ⚠ **POZYCJE BEZ ZMIAN**, teren powstaje wokół nich |
| **Człowiek** | babrzysko, tropy |

### P5 · GŁĘBOKI LAS  —  x 78–112, y 26–58  (część istniejąca, część nowa)

| | |
|---|---|
| **Funkcja** | **przekroczenie linii ubytku**; miejsce, w którym las przestaje być lasem |
| **Klimat** | świerk zamyka się nad głową, brzoza znika, runo gęstnieje, linie widzenia spadają |
| **Teren** | świerk + grab, zwarcie **65–75 %**, runo `undergrowth` gęste; trakt przestaje być utrzymywany |
| **Zagrożenie** | **wysokie** |
| **Stworzenia** | ⚠ **ostatni dzik = linia ubytku (x = 95)**; na wschód od niej sieciarze ×3 |
| **Człowiek** | miejsce zarezerwowane pod **obóz bandytów** — ⚠ **NIE stawiać w tej fazie** (§7) |

### P6 · STARA PUSZCZA  —  x 112–140, cała wysokość  (**NOWA**)

> ⚠ **NIEAKTUALNE od 2026-08-27.** Autor zdecydował, że stara puszcza
> **wychodzi z tej mapy** na osobną, przyszłą lokację za bramą do Gęstwiny.
> Pasmo x 112–140 zostaje, ale staje się **A8 · KONIEC GOSPODARKI** —
> zarzucony wyrąb, młodnik i samosiew, zwarcie 55–65 % zamiast ≥ 75 %.
> **Z-6 zostaje w mocy co do kierunku** (niedźwiedź idzie na wschód, daleko od
> Myśliwego); **ruiny wypadają**, **pusty barłóg zostaje**. Treść pasma:
> `docs/forest_rebuild_scope.md` §0 i A8. Tabela niżej opisuje wariant
> odrzucony — zostaje jako zapis, czym P6 miało być.

| | |
|---|---|
| **Funkcja** | najgłębszy punkt lokacji; przedsionek wszystkiego, co przyjdzie później |
| **Klimat** | najstarszy i najciemniejszy las; ⚠ **cisza jest treścią** |
| **Teren** | świerk duży + grab duży, zwarcie **≥ 75 %** (poziom Gęstwiny — 76,9 %); ⚠ **runo ZNIKA, bo korona je dusi**; brzoza praktycznie nieobecna; źródło rzeki na wschodniej krawędzi |
| **Zagrożenie** | **najwyższe** |
| **Stworzenia** | **niedźwiedź** (przesunięty), skoczki ×3 (przesunięte); ⚠ **ANI JEDNEGO małego zwierzęcia, ani jednego ptaka** |
| **Człowiek** | **ruiny** starsze niż Zagaje, **pusty stary barłóg**, brama do Gęstwiny |

⚠ **Ruiny i barłóg NICZEGO NIE TŁUMACZĄ.** Reguła Gęstwiny obowiązuje:
*„kto zechce tę mapę rozbudować — niech nie zaczyna od wyjaśnienia"*. Żadnego
NPC, żadnej notatki, żadnego znaleziska z tekstem.

---

## 3. Plan przebudowy Tiled

### 3.1 Stałe, których nie wolno zgubić

```
✅ mapa dziś (od 2026-08-28) 160 × 60 kafli = 5120 × 1920 px, kafel 32 px,
              orthogonal, right-down, infinite=off — resize wykonany,
              x100–159 strukturalnie w miejscu, TEREN JESZCZE PUSTY
warstwy kafli 12: ground, water, sand, path, undergrowth, bushes,
                  buildings, buildings-detale, znaki, trees-base,
                  trees-over, buildings-over
warstwy obiektów 3: objects (40), rosliny (42), kamienie (58)
tilesety      Teren firstgid 1 · Nature 229 · Buildings 362 · Znaki 514
eksport       JSON · CSV · Infinite OFF · Embed Tileset   (wszystkie cztery obowiązkowe)
```

⚠ **Ta sekcja (§3) opisuje wciąż plan wykonawczy dla docelowego 140×60**
(gidy, N1–N10, O1 poniżej) — **techniczny resize do 160 jest zrobiony
(`PROJECT_CHECKPOINT_RESIZE160.md`), ale malowanie terenu N1–N10 jeszcze
nie.** Zakres nowych kolumn (x100–139 vs x100–159) i podział A8/A9/A10 do
zaktualizowania przy terrain passie — patrz checkpoint resize i dziennik
2026-08-28 (review Senior Game Architecta) po pełny, aktualny układ.

⚠ **Resize w Tiled: Map ▸ Resize Map, kotwica LEWA-GÓRNA.** Wszystkie
warstwy kafli i wszystkie obiekty zachowują współrzędne; dochodzą puste
kolumny 100–139.

### 3.2 Co ZOSTAJE nietknięte

| element | powód |
|---|---|
| brama północna `portal` (1312,48) → village | Z-3 |
| `player` (1232,1616) | start nowej gry |
| `merchant` (2128,284), `campfire` (2010,314), `suszona_skora`, `pniak` | Z-10 |
| **wilki ×4, `greywolf`** | Z-7 |
| **dziki ×2** | Z-8 / §2 P4 |
| **króliki ×5** | jedyna dobrze rozstawiona grupa |
| **skoczki ×3 — na razie**; przenoszone dopiero w kroku 7 | patrz §4.2 |
| wszystkie 42 stanowiska `rosliny` | jedyna warstwa z prawdziwą logiką siedlisk |
| 58 obiektów `kamienie` | dekoracja, przenoszenie nic nie da |
| droga N–S i odnoga do Myśliwego | Z-3 |

### 3.3 Co się ZMIENIA w istniejących kolumnach (x 0–99)

| # | zmiana | warstwa | zakres | szacunek |
|---|---|---|---|---|
| **T1** | **Polany w rewirze** — 2–3 zwarte obszary **40–120 kafli**, obrysowane drzewami | `trees-base`/`-over` | x 22–54, y 26–52 | ~200 kafli dostawić wokół, ~80 wyczyścić w środku |
| **T2** | **Odwrócenie gradientu wschodniego** — brzoza → świerk/grab; zwarcie 35 % → 65 % | `trees-*` | x 74–99, y 26–56 | ~250 kafli |
| **T3** | **Brzegi rzeki** — piasek blob-47, trzcina z kępek, olcha | `sand`, `undergrowth`, `trees-*` | cały pas y 16–26 | ~150 kafli |
| **T4** | **Wygładzenie profilu rzeki** do monotonicznego (2 na wschodzie → 9 na zachodzie) | `water` | y 16–26 | ~120 kafli |
| **T5** | ⚠ **BRÓD: woda MUSI wrócić na x 39–44** | `water` + `sand` | x 38–45, y 20–25 | ~40 kafli |
| **T6** | **Rozlewiska olszyny** — plamy wody NIEpołączone z rzeką + ziemia 1/2 | `water`, `ground` | x 52–78, y 26–42 | ~200 kafli |
| **T7** | **Ściana świerku na granicy boru** | `trees-*` | x ≈ 22 (pion), y ≈ 36 (poziom) | ~100 kafli |
| **T8** | **Wyręb** — klepisko `ziemia`, pieńki, urwana odnoga ścieżki | `ground`, `path` | x 0–19, y 0–16 | ~150 kafli |
| **T9** | **Podwórze Myśliwego** — `ziemia`, płot, suszarnie | `ground`, `buildings-detale` | x 60–72, y 4–12 | ~120 kafli |
| **T10** | **Drogowskaz na rozjeździe** | `znaki` | x 40–41, y 8 | ⚠ **1 kafel** |
| **T11** | **Zamknąć drogę na południu** — dziś wybiega poza krawędź bez bramy (kopalina po odwróconej geografii) | `path`, `trees-*` | x 34–36, y 55–59 | ~20 kafli |

⚠ **T5 jest krytyczne i łatwe do przeoczenia.** Dziś przy **x = 42 nie ma ani
jednego kafla wody** — rzeka jest przecięta na wylot i przykryta piaskiem.
Bród ma być **płycizną (woda widoczna, kafle przechodnie)**, nie dziurą.
Po tej poprawce program liczący zbiorniki musi zwrócić **JEDEN**, nie dwa.

### 3.4 Co DODAJEMY w nowych kolumnach (x 100–139)

| # | element | zakres | uwagi |
|---|---|---|---|
| **N1** | **Rzeka — przedłużenie** | y ~16–21, x 100–139 | ⚠ **wąska: 1,5–2,5 kafla**; wychodzi wschodnią krawędzią jako **źródło** |
| **N2** | **Stara puszcza — masyw drzew** | x 112–139, cała wysokość | zwarcie **≥ 75 %**; ⚠ **świerk_duzy / swierk_duzy2 / grab_duzy stemplowane ZWARCIE, tak by korony się stykały** |
| **N3** | **Strefa przejściowa P5→P6** | x 100–112 | zwarcie rośnie płynnie 65 % → 75 %; brzoza znika całkowicie |
| **N4** | ⚠ **Runo ZNIKA w P6** | x 112–139 | `undergrowth`/`bushes` = 0. Zwarta korona dusi runo — **i to jest sygnał dla gracza** |
| **N5** | **Ruiny** | ok. x 124–130, y 8–16 | kafle `Buildings` + `kamienie`; **bez tekstu, bez NPC** |
| **N6** | **Pusty stary barłóg** | ok. x 113–118, y 40–44 | wykrot + `kamienie` + kości; ⚠ **wygląda jak DOM, którego nikt nie pilnuje** |
| **N7** | **Brama do Gęstwiny — przesunięta** | tx 98 → **tx 138** | patrz §3.5 |
| **N8** | **Przesmyk w ścianie drzew** przy bramie | x 134–139, y 44–48 | dziś istnieje przy x 98; **odtworzyć na nowym miejscu i ZAROSNĄĆ stary** |
| **N9** | **Trakt** — od skrętu w P3 na wschód, urywający się w P5 | x 60–105, y ~40–52 | ⚠ **NIE dociąga do bramy** — `swiat.md`: do gęstwiny nie prowadzi żadna droga |
| **N10** | **Stanowiska ziół w nowych kolumnach** | x 100–139 | ⚠ **tylko `dziurawiec` i `pokrzywa`** (cień, żyzna ziemia); ⚠ **krwawnik NIE** — wymaga 0 % zadrzewienia |

### 3.5 ⚠ Przesunięcie bramy wschodniej — trzy pliki, jedna operacja

Reguła `src/world/CLAUDE.md`: **bramę rusza się w `tools/portale.py`, na obu
mapach naraz** — nigdy przez dostawienie drugiego obiektu (tak powstał kiedyś
piąty, sierocy portal).

```python
# tools/portale.py — WARTOŚCI DZIŚ:
BRAMA_LAS_WSCHOD            = dict(tx=98, ty=46)   ->  tx=138
WEJSCIE_DO_LASU_ZE_WSCHODU  = dict(tx=95, ty=45)   ->  tx=135
BRAMA_GESTWINY              = dict(tx=1,  ty=32)   ->  bez zmian
WEJSCIE_DO_GESTWINY         = dict(tx=4,  ty=31)   ->  bez zmian
```

Wynikające zmiany w danych:

| plik | pole | dziś | docelowo |
|---|---|---|---|
| `forrest.tmj` | obiekt `portal` (wschodni) | x=3152, y=1472 | **x=4432**, y=1472 |
| `thicket-gestwina.tmj` | `portal` → `spawnX` | 3056 | **4336** |

⚠ **Brama wschodnia jest POZIOMA** (przejście idzie w lewo/prawo), więc liczy
się ją przez `piksele_brama_pozioma()`, nie `piksele_brama()`. Pomyłka jest
**cicha**: brama działa, tylko ma 16 px martwej strefy przy jednej krawędzi.

⚠ `tx=138`, nie 139 — kafel skrajny dotyka granicy świata, gracz nie może
stanąć w jego środku. Ta sama zasada, która dała dziś `tx=98`.

### 3.6 Ściągawka gidów — żeby nie robić archeologii po arkuszach

**Teren (firstgid 1):** `gid = localId + 1`

```
  1 trawa czysta      2 pojedyncze     3 rzadka      4 srednia    5 gesta    6 b.gesta
  7 ziemia 1          8 ziemia 2       9 piasek 1   10 piasek 2  11 kamien 1  12 kamien 2
 15 listowie 1       16 listowie 2
 woda   blob-47:  gid  77–123
 piasek blob-47:  gid 134–180
 sciezka blob-47: gid  20– 66
```

**Nature (firstgid 229)** — pełne stemple drzew.
⚠ **DOLNY RZĄD każdego stempla idzie do `trees-base`, reszta do `trees-over`.**
Stempel w Tiled ląduje na JEDNEJ warstwie — dolny rząd przenosi się ręcznie,
inaczej korona zasłoni gracza stojącego PRZED drzewem.

```
  dab_duzy      3x3   267,268,269 | 286,287,288 | 305,306,307
  dab_duzy2     3x3   270,271,272 | 289,290,291 | 308,309,310
  buk_duzy      3x3   273,274,275 | 292,293,294 | 311,312,313
  swierk_duzy   2x3   276,277     | 295,296     | 314,315
  swierk_duzy2  2x3   278,279     | 297,298     | 316,317
  brzoza_duza   2x3   280,281     | 299,300     | 318,319
  brzoza_duza2  2x3   282,283     | 301,302     | 320,321
  grab_duzy     2x3   284,285     | 303,304     | 322,323
  dab_sredni    2x2   324,325     | 343,344
  swierk_sredni 2x2   326,327     | 345,346
  brzoza_srednia2x2   328,329     | 347,348
  buk_sredni    2x2   330,331     | 349,350
  grab_sredni   2x2   332,333     | 351,352
  dab_maly      1x2   334 | 353      swierk_maly 1x2  335 | 354
  brzoza_mala   1x2   336 | 355      buk_maly    1x2  337 | 356
  grab_maly     1x2   338 | 357
  kepki trawy   gid 229–244        krzaki  gid 248–255
```

⚠ **Zwarcie robi się DUŻYMI stemplami stawianymi tak, by korony się
stykały** — nie zagęszczaniem małych. Dzisiejszy las ma 46 % zwarcia
z pojedynczych, równomiernie rozstawionych drzew i **czyta się jak sad**.
To jest najdroższa lekcja tego projektu; nie powtórz jej na nowych kolumnach.

### 3.7 Kolizja — co dokładnie dostaje kształt

`TiledMap.ts:478–498` buduje `map.solids` **wyłącznie** z kształtów kolizji
zdefiniowanych w tilesecie (`boxCache.boxesFor`). Dziś we wszystkich trzech
mapach jest **zero** takich kafli. Kolizję rysuje się w Tiled ▸ Tile
Collision Editor.

| co | kształt | uwaga |
|---|---|---|
| **woda** (blob-47, gid 77–123) | pełny kafel 32×32 | ⚠ **z wyjątkiem kafli brodu** — te zostają przechodnie |
| **pnie drzew** (dolny rząd stempli, `trees-base`) | ⚠ **tylko pień, nie cała komórka** — ok. 10×12 px, wyśrodkowany u dołu | Arcade sprowadza kształt do bounding boksu; to właśnie pozwala przejść między drzewami |
| **głazy** `glaz_a/b/wielki`, `filar` | to są OBIEKTY, nie kafle — patrz niżej | |
| **budynki** | bryła ściany | |

⚠ **Kolizja jest kluczowana `nazwaTilesetu#localId`**, nie samym localId —
kafel 16 z `Teren` i 16 z `Nature` to różne obrazki.

⚠ **Kolizja jest SPŁASZCZANA między warstwami**: o przechodniości komórki
decyduje **najwyższy niepusty** kafel. Dzięki temu bród działa bez wyjątków
w kodzie (piasek nad wodą = przechodnie) — **ale kafel korony domalowany nad
litym pniem czyni tę komórkę z powrotem przechodnią.**

⚠ **Dekoracje `kamienie` nie dostaną ciał z tej ścieżki** —
`GameScene.ts:804` tworzy je jako `this.add.image`, bez fizyki. **Zostawić
tak w tej fazie**; nadanie ciał dekoracjom to osobna zmiana.

---

## 4. Rozmieszczenie stworzeń — SIEDLISKA, nie punkty

⚠ **Wzorzec do naśladowania już istnieje na tej mapie: stanowiska ziół.**
Krwawnik stoi na **0 % zadrzewienia** na ośmiu stanowiskach, dziurawiec na
11 %, pokrzywa na 46 % — i to nie jest przypadek, tylko wykonanie
`HERBS[*].siedlisko`. **Fauna dostaje ten sam traktament.**

### 4.1 Tabela siedlisk

| gatunek | GDZIE żyje (reguła, nie punkt) | CZEGO unika | pasmo |
|---|---|---|---|
| **Ptak** | skraj lasu, brzeg wody, otwarte prześwity | zwarcie > 65 % | P1, P2 |
| **Sarna** | ⚠ **skraj i brzeg wody, na osi POZIOMEJ podejścia**; zwarcie 20–40 % | gęstwina, bór wilków, wszystko na wschód od linii ubytku | P1, P2 |
| **Królik** | ⚠ **polany** (T1) i ich obrzeża; trawa czysta/rzadka | zwarcie > 60 %; promień 380 px od wilków (asercja) | P3 |
| **Lis** | brzeg rzeki i skraj rewiru, **w pobliżu stanowisk ziół** (`FOX.interestRadius` 150 ma mieć na co działać) | otwarta woda, bór wilków | P2, P3 |
| **Wilk ×3 + Szary** | ⚠ **BEZ ZMIAN** — bór SW, zwarcie 75–85 % | — | P3b |
| **Wilk samotny** | zachodni skraj rewiru, > 300 px od sfory (asercja) | — | P3 |
| **Dzik ×2** | ⚠ **BEZ ZMIAN** — mokry podszyt, rozlewiska, ciemna ziemia | otwarta trawa | P4 |
| **Sieciarz ×3** | ⚠ **na WSCHÓD od linii ubytku**, zwarcie > 65 %, > 340 px od dzików (asercja) | wszystko na zachód od linii | P5 |
| **Skoczek ×3** | głębiej niż sieciarze, w starej puszczy | — | P6 |
| **Niedźwiedź** | stara puszcza, przy ruinach albo źródle rzeki | huby, drogi | P6 |

### 4.2 Granice — trzy, każda o innym charakterze

| granica | gdzie | czym jest wyrażona | co znaczy |
|---|---|---|---|
| **RZEKA** | y 16–26 | woda + kolizja, jedno przejście | ludzie ↔ natura |
| **ŚCIANA BORU** | x ≈ 22, y ≈ 36 | zwarcie świerku, brak zwierzyny, świeża padlina | terytorium zajęte przez kogoś |
| ⚠ **LINIA UBYTKU** | **x = 95** | **brak fauny**, nie kafle | natura ↔ to, co po niej zostało |

**Reguła linii ubytku, do wykonania dosłownie:**

```
  x <  95   normalna gęstość fauny — dziki, króliki, ptaki, sarny, lisy
  x =  95   ⚠ OSTATNI DZIK — najgłębszy punkt, w którym zwykły las jeszcze działa
  x >  95   ZERO fauny neutralnej, ZERO ptaków.  Sieciarze, potem skoczki.
```

⚠ **Dzik jest ostatni, pająk pierwszy. Nie sąsiadują przypadkiem — stoją po
dwóch stronach granicy i to jest ich relacja.** Asercja `dzik-pajak > 340`
spełnia się wtedy sama i przestaje być arbitralną liczbą.

### 4.3 Zasada nadrzędna

⚠ **Terytorium poznaje się po tym, czego w nim NIE MA.**
Bór wilków — brak zwierzyny. Stara puszcza — brak runa i ptaków. Strefa
pająków — brak wszystkiego. **To jest tańsze niż stawianie czegokolwiek
i czyta się mocniej.**

### 4.4 Przesunięcia — pełna lista, +0 mobów

**Zweryfikowane w istniejącej mapie** (teren suchy, nie na drodze, przechodzą
wszystkie 10 asercji `build_mapa.py`):

| # | co | z | na | powód |
|---|---|---|---|---|
| **S1** | **lis #2** | (1900,600) | **(1712,496)** kafel 53,15 | ⚠ dziś stoi **w wodzie** (62 % wody w promieniu 5 kafli) |
| **S2** | **sarna #2** | (2500,700) | **(2064,848)** kafel 64,26 | z martwego rogu NE na brzeg rzeki, oś pozioma |
| **S3** | **ptak #2** | (1920,320) | **(1360,432)** kafel 42,13 | 290 px od bramy — wypełnia dziurę „4–11 s pustej drogi" |

**Do wyznaczenia PO pomalowaniu nowych kolumn** (podane są pola docelowe, nie
punkty — punkt wybiera się po siedlisku i weryfikuje asercjami):

| # | co | pole docelowe | minimum do sprawdzenia |
|---|---|---|---|
| **S4** | **niedźwiedź** | P6, x 115–135, y 8–30 | ⚠ `niedzw-hub` — **podnieść próg z 400 px na 2300 px** (trzy kadry). Z pola P6 wychodzi ≥ **1456 px** od Myśliwego i ≥ **2256 px = 2,9 kadru** od bramy (dziś 614 i 1420) |
| **S5** | **sieciarze ×3** | P5, x 96–110, y 30–52 | > 340 px od dzików; **na wschód od x = 95** |
| **S6** | **skoczki ×3** | P6, x 116–136, y 34–54 | > 300 px między sobą tam, gdzie mają być osobne spotkania |

⚠ **Przy KAŻDYM przesunięciu przebiegnij pełną kopertę asercji** (§6 krok 8).
`tools/build_mapa.py` raportuje o **swoim** wyniku, nie o `.tmj` — ręczne
przesunięcie łamie asercje **cicho**.

---

## 5. Warstwa świata

### 5.1 Rzeka

| własność | wartość docelowa |
|---|---|
| kierunek | ⚠ **E → W** (Z-4) |
| źródło | wschodnia krawędź mapy, y ~16–21; fabularnie: *„dalej, niż ktokolwiek z Zagajów był"* |
| ujście | zachodnia krawędź, y 18–23; fabularnie: *skręca do Zagajów pod koło Miłosza* |
| szerokość | **monotoniczna**: 1,5–2,5 kafla na wschodzie → 6–9 kafli na zachodzie |
| brzegi | piasek blob-47, trzcina (kępki), olcha; **rozlewisko na zachodzie** |
| kolizja | **pełna**, poza kaflami brodu |

⚠ **Młyn zostaje POZA mapą lasu i nie rysujemy go drugi raz.**
`wioska_plan.md` §4 rozstrzygnął, że młyn ma własny lokalny staw i jaz.
Zmierzone: staw wsi zajmuje x 0–7 / y 82–98, oś bram daje **wieś x0 = las
x −10**, czyli młyn leżałby tuż za zachodnią krawędzią lasu, na północy —
**dokładnie tam, gdzie powinien być przy przepływie E → W.** Fabuła to
domyka; kafle nie muszą.

⚠ **Rzeka jest drugą strzałką wskazującą na wschód** — obok pytania o most
i obok traktu, który urywa się w Gęstwinie. **Żadna z nich niczego nie
tłumaczy.** Nie łamać tego.

### 5.2 Bród

- **x 38–45, y 20–25.** Woda **wraca** na x 39–44 (T5).
- Kafle brodu: **piasek blob-47 nad wodą**, kolizja **wyłączona** — działa
  dzięki spłaszczaniu kolizji między warstwami, bez wyjątków w kodzie.
- ⚠ **Nie stawiać mostu w tej fazie** (Z-5). Miejsce ma zostać wolne.

### 5.3 Myśliwy

- **Pozycja bez zmian** (Z-10). 812 px = 1,05 kadru od bramy — dokładnie próg.
- **T9: podwórze** — `ziemia` pod chatą, płot, suszarnie. Dziś chata stoi
  w gołej trawie, a `mapy.md` obiecuje „trader's glade", której nie ma.
- ⚠ **T10: drogowskaz na rozjeździe (x 40–41, y 8).** Odnoga ma **832 px**
  przy kadrze ±386 px, więc z rozjazdu **nie widać chaty** — gracz idzie dwa
  ekrany ślepą odnogą w wierze, że coś tam jest. Arkusz `znaki.png` jest
  wpięty i ma **16 kafli, z których używany jest jeden**. Najtańsza poprawka
  w całym dokumencie.
- ⚠ **Niedźwiedź znika z jego sąsiedztwa** (S4). Dziś 614 px = 0,80 kadru.

### 5.4 Wyręby i ślady ludzi

⚠ **Gradient jest odwrotny do intuicji: ślady ludzi są NAJGĘSTSZE przy wsi
i znikają w głąb.** Ostatni znak ciosany na drzewie, ostatni mielerz, ostatni
kilometr utrzymanego traktu. **Znikanie człowieka to ten sam gradient, co
znikanie zwierząt (§4.2), tylko przesunięty o pasmo. Dwa gradienty, jeden
kierunek — to jest cała reżyseria tego lasu.**

| element | pasmo | krok |
|---|---|---|
| wyręb + pieńki + klepisko | P1 zachód (martwa ćwiartka) | T8 |
| podwórze Myśliwego | P1 wschód | T9 |
| drogowskaz | P1, rozjazd | T10 |
| mielerz | P3 | wraz z T1 |
| ostatnie znaki ciosane | P3/P5 | wraz z N9 |
| trakt urywający się | P5 | N9 |
| ruiny | P6 | N5 |
| pusty barłóg | P6 | N6 |

⚠ **`pniak` istnieje jako `DECOR_PROPS` i jest użyty na całej mapie RAZ.**
Wyręb to jego naturalne miejsce.

### 5.5 Pusty barłóg — mechanizm anomalii wilczej

To jedyny element, który **wyjaśnia Z-7 bez jednego słowa tekstu**:

| miejsce | co gracz widzi | co rozumie |
|---|---|---|
| **P3b, bór SW** | brak wydeptanych ścieżek, nora rozkopana pod wykrotem, świeża padlina | *ktoś tu jest od niedawna* |
| **P6, stara puszcza** | barłóg wygryziony w korzeniach, kości obrośnięte mchem, ścieżki zarosłe | *tu był ich dom — i został pusty* |

⚠ **Zero nowych mobów, zero kodu, wyłącznie dekoracje.** I ⚠ **żadnego
tekstu** — ani NPC, ani notatki, ani wpisu w dzienniku.

### 5.6 Miejsca zarezerwowane pod przyszłość — ⚠ NIE stawiać w tej fazie

| miejsce | pod co | dlaczego zostawić puste |
|---|---|---|
| P5, x ~98–104, y ~46–52 | **obóz bandytów** | ludzki przeciwnik = zmiana tonu całej gry; osobna decyzja |
| P2, x 38–45 | **most** | inwestycja wsi, potencjalnie zadanie |
| P1, obejście Myśliwego | **tablica zleceń** | wymaga systemu zleceń |
| P6, przy ruinach | — | ⚠ **zostawić puste i nie tłumaczyć** |

---

## 6. Kolejność implementacji

⚠ **Kolejność nie jest sugestią.** Kolizja przed malowaniem, bo zmienia to,
jak czyta się każdy kafel postawiony później — malowanie polan przed kolizją
to malowanie ścian, przez które się przechodzi. Resize po naprawie
istniejącego, bo inaczej powiększamy problem.

✅ **ODSTĘPSTWO 2026-08-28, świadome, decyzja autora: krok 4 (resize) i 5
(brama) wykonane PRZED krokiem 3 (teren x0–99).** Powód: autor chciał domkniętą
infrastrukturę mapy (rozmiar, portal, minimapa, NavGrid, asercje) jako jeden
czysty checkpoint, zanim zacznie się terrain pass — a terrain pass ma objąć
**x0–159 razem** (istniejące kolumny + A9/A10), nie x0–99 osobno i x100–159
osobno. Kroki 3 i 6 łączą się odtąd w jeden „terrain pass A1–A10" — patrz
`PROJECT_CHECKPOINT_RESIZE160.md` §5.

| # | krok | zakres | weryfikacja przed przejściem dalej |
|---|---|---|---|
| **0** | **Synchronizacja kopii `.tmj`** | skopiować `maps/forrest.tmj` → `assets/forrest.tmj`, poprawiając ścieżkę do PNG (`../Teren.png` → `Teren.png`) | md5 treści bez ścieżek zgodne |
| **1** | **KOLIZJA** — kształty w tilesecie (§3.7) | woda + pnie + budynki | ✅ **ZROBIONE 2026-08-28** (pnie/budynki: Step 1A 2026-08-27; woda: Step 1B 2026-08-28, `PROJECT_CHECKPOINT_STEP1B.md`). ⚠ Zweryfikowane symulacją silnika na żywym `.tmj`, **nie w silniku samym** (środowisko). Trzy mikro-znaleziska, wszystkie **rozstrzygnięte przez autora jako odłożone** (żadne nie czeka na decyzję): zwężenie brodu do 1 kafla i 7 izolowanych kieszeni wody pod dekoracją → `docs/odlozone.md` §3; spawn lisa w wodzie → już śledzony w `forest_rebuild_scope.md` S4, nie nowa sprawa. Szczegóły: checkpoint §1.1–1.3. |
| **2** | **Rzeka: bród (T5) + profil (T4) + brzegi (T3)** | y 16–26, x 0–99 | ⚠ **liczba osobnych zbiorników wody = 1**, nie 2 |
| **3** | **Teren w istniejących kolumnach** — T1, T2, T6, T7, T8, T9, T11 | x 0–99 | 🟡 **CZĘŚCIOWO** (2026-08-28): warstwa `ground` zrobiona dla całej mapy naraz razem z krokiem 6 (`PROJECT_CHECKPOINT_TERRAIN.md`), pięć polan A5 ma czytelny obrys. **T1/T2 (drzewa/listowie) jeszcze nie** — stare drzewa z pierwszej generacji nadal stoją w nowych polanach, priorytet następnego etapu |
| **4** | ✅ **RESIZE 100 → 160** (nie 140 — patrz Z-1) — kotwica lewa-górna, wschód wyłącznie | obie kopie | ✅ **ZROBIONE 2026-08-28**: wszystkie 40 obiektów i 12 warstw przeżyły co do bajtu w x0–99, `PROJECT_CHECKPOINT_RESIZE160.md` |
| **5** | ✅ **Brama wschodnia** — `portale.py` + `forrest.tmj` + `thicket-gestwina.tmj` (§3.5) | 3 pliki naraz | ✅ **ZROBIONE 2026-08-28**: tx=98→**158** (nie 138 — mapa 160, nie 140), spawn Gęstwiny→lasu przeliczony analogicznie (tx=95→**155**). ⚠ Formuła weryfikowana danymi, „w obie strony i nie odbija" **nie zweryfikowane w silniku** (środowisko) |
| **6** | **Nowy teren** — N1, N2, N3, N4, N8, N9 | x 100–159 | 🟡 **CZĘŚCIOWO** (2026-08-28): `ground` zrobiony (A9 Brzeg Północny, A10 Źródło mają zmierzoną, różną gęstość — checkpoint §2.2). **N1 (rzeka-źródło), drzewa, N5/N6/N9 (obiekty/ślady) jeszcze nie** — świadomie: nowy kafel wody dostaje kolizję automatycznie (Step 1B), więc N1 czeka na osobną decyzję, nie na ten krok |
| **7** | **Obiekty i ślady** — T10, N5, N6, N10, mielerz, znaki ciosane | | nierozpoznana nazwa obiektu **ostrzega** w konsoli — przejrzeć log |
| **8** | **SPAWNY** — S1, S2, S3, potem S4, S5, S6 | | ⚠ **pełna koperta asercji** (§6.1) po KAŻDYM przesunięciu |
| **9** | **Dokumentacja** — `swiat.md` §4 (Z-8, geografia po D-2/D-3), `mapy.md` (rozmiar, „trader's glade"), `odlozone.md` §3 (kolizja zamknięta), `docs/README.md` | | ⚠ **w tej samej sesji** |
| **10** | **`npx tsc --noEmit` + `npm run build`** | | ⚠ **oba czyste** przed uznaniem czegokolwiek za zrobione |
| **11** | **PLAYTEST RĘKĄ** (§6.2) | | `tsc` i `build` nie widzą **niczego** z tej listy |

### 6.1 Koperta asercji — do przebiegnięcia po każdym przesunięciu

Skrypt jednorazowy stosujący asercje z `tools/build_mapa.py:1240–1305` do
**żywego `.tmj`**. ⚠ **Nie zostawiać go w `tools/`** — reguła katalogu.

```
  wilk-wilk      każda para z trójki < 200   (WOLF.pack.callRadius)
  samotny-sfora  > 300
  samotny-Szary  > 300
  Szary-wilk     > 200
  kupiec-fire    > 92                        (48 + 44 zasięgi interakcji)
  dzik-pajak     > 340                       (SPIDER.aggroRange 230 + zapas)
  zajac-wilk     > 380                       (WOLF.deAggroRange 320 + zapas)
  gracz-zajac    > 200
  niedzw-wrog    > 400
  niedzw-hub     > 400   ⚠ PODNIEŚĆ DO 2300  (trzy kadry — patrz S4)
```

⚠ **Trzy asercje do DOPISANIA w tej fazie:**

```
  linia-ubytku   zero obiektów bird/deer/fox/rabbit przy x > 95
  rzeka-spójna   liczba osobnych zbiorników wody == 1
  chata-szczelna obrys chaty (x64–68, y2–7) jest solid WSZĘDZIE poza
                 drzwiami (66,6) i (66,7)
```

⚠ **`chata-szczelna` musi liczyć z kafla NAJWYŻSZEGO, nie z warstwy
`buildings`.** Liczona z `buildings` świeciłaby na zielono przez cały czas,
kiedy przez pół domu dało się przejść — dach (`kalenica`/`połać`/`okap`) leży
na `buildings-over` i to on wygrywa w tych komórkach. Patrz 2026-08-27 (3)
w `docs/dziennik.md`.

⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
Po dopisaniu każdej z nich zepsuj dane celowo i sprawdź, że raport zgłasza BŁĄD.

### 6.2 Checklista ręczna — czego kompilator nie zobaczy

1. Gracz **nie przechodzi** przez rzekę poza brodem; bród przechodzi się
   swobodnie.
2. Idąc od bramy północnej na południe, gracz mija **coś żywego w pierwszych
   5 sekundach** (ptak S3).
3. Sarna reaguje (`alert` → zryw → postój → **powrót do wędrówki**) i robi to
   **przy podejściu poziomym** — pionowe wyprowadza ją z kadru po ~1,3 zrywu.
4. ⚠ **Sarna nie wchodzi już w drzewa** — po kroku 1 kryttery wymagają
   collidera; patrz §7 R-1.
5. Polany w P3 czytają się jako **miejsca**, nie jako przerwy w drzewach.
6. Idąc na wschód, gracz **przestaje słyszeć i widzieć ptaki** za x = 95.
7. Stara puszcza jest **wyraźnie ciemniejsza i gęstsza** niż reszta mapy.
8. Niedźwiedź nie jest widoczny ani słyszalny z obejścia Myśliwego.
9. Brama do Gęstwiny działa w obie strony i **nie odbija** gracza.
10. `window.dev.missing` puste, `load.totalFailed` = 0.

---

## 7. Rzeczy ODŁOŻONE

⚠ **To nie jest backlog tej fazy.** Każda pozycja ma warunek powrotu.

| co | dlaczego nie teraz | warunek powrotu |
|---|---|---|
| **Kruk** (sygnał — krąży nad padliną) | ⭐ najtańszy zwrot z odłożonych: `Bird` istnieje i nie ma `update()`. Ale to **nowy arkusz**, a ta faza jest o mapie | osobna sesja o faunie; pierwszy do zrobienia |
| **Borsuk** (nie ucieka i nie goni) | nowy arkusz + wariant `Rabbit` bez ucieczki | jw. |
| **Żubr** (neutralny, opancerzony) | ⚠ dotyka **balansu pancerza** — byłby drugim w grze prawdziwym testem osi *typ obrażeń × materiał* (dziś `armor` ma **1 z 7** wrogów) | sesja o walce, nie o mapie |
| **Ryś** | ⚠ **właściwa odpowiedź, ale niewykonalna** — wymaga linii wzroku i zwrotu, których AI nie ma (`bestiariusz_audyt.md` §2.3: agro to czysty dystans). **Bez nich jest wilkiem z inną grafiką** | powstanie linii wzroku |
| **Bandyci** | ludzki przeciwnik = **zmiana tonu całej gry**; byłby też drugim dystansowym (dziś 1 z 7) | osobna decyzja autora; miejsce zarezerwowane (§5.6) |
| **Relacje międzygatunkowe** (lis płoszy królika, wilk płoszy faunę) | `Rabbit.flee` przyjmuje **gracza**, nie „zagrożenie" — dodanie kanału to przebudowa najlepiej ogranego stworzenia w grze (`fauna_faza1.md` §5) | ⚠ **po tej fazie warunek się zmienia**: dziś żaden krytter nie stoi w zasięgu wilczego wycia (415 px przy `callRadius` 200), ale po zbudowaniu siedlisk odległości będą inne. **Przeliczyć ponownie** |
| **Most zamiast brodu** | Z-5; inwestycja wsi | gdy powstanie system zleceń |
| **Tablica zleceń u Myśliwego** | wymaga systemu zleceń | jw. |
| **Kolizja dla dekoracji `kamienie`** | `GameScene.ts:804` tworzy je bez fizyki; osobna zmiana | po playteście kolizji terenu |
| **Dalsze lokacje za Gęstwiną** | ⚠ **niczego nie tłumaczyć** — reguła `swiat.md` | — |
| **Krzywa XP** | przestrzelona; ta faza jej **nie rusza** (+0 mobów) | `odlozone.md` — czeka na content |

---

## 8. Ryzyka tej fazy

| # | ryzyko | co je zdejmuje |
|---|---|---|
| **R-1** | ⚠ **Kolizja bez collidera dla krytterów.** `fauna_faza1.md` R5 przyjął przechodzenie sarny przez drzewa jako świadomą cenę — **niewidoczną, dopóki gracz też przechodzi**. Po kroku 1 stanie się widoczna | **jedna linia w `GameScene`: `collider(critters, map.solids)`** — musi wejść **razem z krokiem 1**, nie po |
| **R-2** | **Uruchomienie `build_mapa.py --zapisz`** | generator zna 100 × 60 i nie zna niczego z Tiled — **skasuje całą fazę** |
| **R-3** | **Praca na `assets/forrest.tmj`** zamiast `maps/` | krok 0 |
| **R-4** | **Przesunięcie łamiące asercje po cichu** | §6.1 po każdym przesunięciu, także niedźwiedzia |
| **R-5** | **Nowe kolumny malowane jak sad** — pojedyncze drzewa, równomiernie | §3.6: duże stemple, korony stykające się; **PATRZ NA RENDER** |
| **R-6** | **Dodanie stworzeń „przy okazji"** | Z-9, bilans **+0** |
| **R-7** | **Ruszenie wilków „dla progresji"** | Z-7 — ich pozycja jest fabułą; zmienia się otoczenie, nie pozycja |
| **R-8** | **Wyjaśnienie ruin albo starej puszczy** | §2 P6 — reguła Gęstwiny |
| **R-9** | **Brama wschodnia liczona `piksele_brama()`** zamiast `_pozioma()` | awaria **cicha**: 16 px martwej strefy przy jednej krawędzi |
| **R-10** | **Stempel drzewa zostawiony na jednej warstwie** | dolny rząd → `trees-base` ręcznie, inaczej korona zasłoni gracza stojącego przed drzewem |

---

## 9. Definicja ukończenia fazy

Faza 1B jest zamknięta, gdy **wszystkie** poniższe są prawdziwe:

- [x] `forrest.tmj` ma 160 × 60 (nie 140 — Z-1), obie kopie zgodne treścią — ZROBIONE 2026-08-28
- [ ] `npx tsc --noEmit` i `npm run build` czyste
- [ ] gracz **nie przechodzi** przez rzekę poza brodem
- [ ] liczba osobnych zbiorników wody = **1**
- [ ] zwarcie koron w P6 ≥ **75 %**, runo w P6 = **0**
- [ ] **zero** obiektów `bird`/`deer`/`fox`/`rabbit` przy x > 95
- [ ] pełna koperta asercji przechodzi, z podniesionym `niedzw-hub`
- [ ] `window.dev.missing` puste, `load.totalFailed` = 0
- [ ] brama do Gęstwiny działa w obie strony
- [ ] **checklista ręczna §6.2 wykonana przez człowieka**
- [ ] `swiat.md`, `mapy.md`, `odlozone.md`, `docs/README.md` zaktualizowane
- [ ] liczba stworzeń na mapie: **26** (bez zmian)

---

## 10. ⚠ ZNALEZISKO 2026-08-27 (4) — kolizja terenu vs ciała stworzeń

> **Status: NIEZATWIERDZONE. Nic z tej sekcji nie jest wdrożone.** To jest
> materiał do decyzji autora i do konsultacji zewnętrznej, dopisany do planu,
> bo **dotyka kolejności §6** — jeżeli propozycja z §10.6 zostanie przyjęta,
> musi wejść **przed Step 3 i Step 6**, z dokładnie tego samego powodu, dla
> którego §6 stawia kolizję przed malowaniem.
>
> ⚠ Sekcja jest napisana tak, żeby dała się czytać **bez repozytorium** —
> odwołania do kodu mają przepisaną treść, nie same ścieżki.

> ## ⚠⚠ POPRAWKA 2026-08-28 — TA SEKCJA LICZY W ZŁEJ JEDNOSTCE
>
> **Wszystkie liczby ciał stworzeń w §10.2 i §10.6 są wzięte wprost z pola
> `bodyWidth` w `GameConfig.ts` i przez to ZANIŻONE 1,5–2,4×.**
>
> `Body.setSize` zapisuje `sourceWidth`, a `updateBounds()` przelicza co klatkę
> `width = sourceWidth × |scaleX|`. Liczba w configu jest więc w pikselach
> **KLATKI ARKUSZA**, nie świata. Realne ciała (`dev.bodies()`, 2026-08-28):
>
> ```
>   gracz 18   królik 21   skoczek 24   wilk 29   sieciarz 31
>   dzik 46    Szary 48    niedźwiedź 48
> ```
>
> Gracz jest najwęższy w grze, bo jako jedyny ma `scale: 1` — i dlatego
> **tylko jego liczba w tabeli §10.2 jest przypadkiem poprawna.**
>
> **Co z tego wynika, punkt po punkcie:**
>
> - **Tabela w §10.2 („dzikowi brakuje 4 px", „Szaremu 2 px", „niedźwiedziowi
>   12 px") jest nieprawdziwa.** Dzikowi brakuje **28 px**, Szaremu i
>   niedźwiedziowi po **30 px**. Wilk (29 px) też **nie przechodzi**, choć
>   tabela mówi, że przechodzi z 2 px zapasu.
> - **Propozycja standardu 24 px w §10.6 jest policzona na tych samych złych
>   danych i jest NIEAKTUALNA.** Jej uzasadnienie brzmiało „najszerszy wróg
>   poza niedźwiedziem ma 22 px + 2 px zapasu"; przy realnych ciałach to zdanie
>   nie opisuje niczego. Tak samo cały §10.7 punkt 1, którego alternatywy
>   (32 px / 20 px) były dobierane wokół tej samej nieprawdziwej liczby.
> - **Fakty POZOSTAŁE stoją.** Prześwity (18 px / 33 px, 52 + 389 bram)
>   zmierzone na pikselach mapy, a nie na configu, więc są poprawne. Tak samo
>   §10.3 (pościg klinuje się na pniu, 11–20 %) i §10.4 (ciała krytterów =
>   klatka arkusza), bo tam już liczono `klatka × skala`.
> - ⚠ **Źródłem tej pomyłki nie jest kod, tylko DWA LICZYDŁA.**
>   `tools/combat_geometry.mjs:375` mnoży przez skalę od dawna i liczy dobrze.
>   §10 mieszał obie konwencje **w jednej tabeli**: krytterom liczył
>   `klatka × skala` (poprawnie), wrogom sam `bodyWidth` (niepoprawnie). Nic
>   tego nie zgłosiło, bo obie liczby nazywają się „szerokość ciała".
>
> ✅ **DECYZJA AUTORA 2026-08-28: propozycja 24 px jest ODŁOŻONA, nie odrzucona
> po dyskusji.** Powód jest wprost taki: nie podejmujemy decyzji geometrycznej
> na podstawie tabeli policzonej w złej jednostce. Wraca dopiero jako **nowa**
> analiza na realnych wymiarach ciał. **Nie wznawiaj sporu o 24 / 32 / 20 px —
> tamten spór dotyczył liczb, których nie ma.**
>
> **STANDARD PRZEŚWITU NADAL NIE JEST USTALONY i ta poprawka go NIE USTALA.**
> Nie wpisuj tu własnej liczby i nie maluj pod nią lasu — decyzja należy do
> autora i zostanie podjęta na realnych wymiarach, nie na tej tabeli. Do tego
> czasu obowiązuje `forest_rebuild_scope.md` §0.1: **projektuj przepływy, nie
> bramki.**
>
> Pomiary i kontekst: `docs/dziennik.md` 2026-08-28, mechanizm i konwencja:
> `src/core/movement/BodySpec.ts`. Jak zapytać o realne ciało zamiast czytać
> config: `dev.bodies()`.
>
> ⚠ **Wdrożone od 2026-08-28 są dokładnie DWA punkty z §10.6** — nr 2 (ciało
> `Critter`, i przy okazji `FarmAnimal`) oraz warstwa ruchu, która zastąpiła
> punkt 3 (`src/core/movement/`, ale przez intencje i solvery, nie przez
> `body.blocked` + histerezę, jak proponowała tabela). **Punkt 1 — zwężenie
> boxów pni — NIE jest wdrożony i nie będzie, dopóki nie ma standardu.**

### 10.1 Skąd to się wzięło

Zgłoszenie autora z bieżącej rozgrywki, dosłownie: *„dziki np łatwo zablokować
w drzewach blisko siebie, my przejdziemy, dzik nie — wtedy walka jest łatwa,
i takich miejsc jest bardzo wiele"*, a po nim drugie: *„a co potem z jeleniami
i innymi dzikimi stworzeniami? będziemy je blokować drzewami i bić z
dystansu?"*.

⚠ **Pierwsza analiza agenta ODRZUCIŁA to zgłoszenie i była błędna.** Zapisuję
to razem z przyczyną, bo błąd jest metodologiczny i łatwy do powtórzenia:

- Agent zmierzył **spójność** wolnej przestrzeni (czy istnieje objazd) i na tej
  podstawie napisał „to nie jest problem rozstawienia drzew". Objazd faktycznie
  istnieje — wolna przestrzeń dzika to jedna składowa. **Ale objazd, którego AI
  idąca w linii prostej nigdy nie wybierze, nie jest objazdem.** Spójność
  odpowiada na inne pytanie niż zadane.
- Siatka pomiarowa miała krok **4 px**. W bramie o prześwicie 18 px ciało
  szerokie na 18 px mieści się w praktycznie jednej kolumnie pikseli. Pomiar
  był **fizycznie ślepy** na zjawisko, o którym mówiło zgłoszenie.

Wniosek do zapamiętania: **przy pytaniach „czy X się tu przeciśnie" mierzy się
prześwit, nie spójność, i w rozdzielczości piksela.**

### 10.2 Fakt 1 — w lesie są 52 bramy o prześwicie DOKŁADNIE 18 px

Box kolizji pnia drzewa 1-kaflowego (ustalony w Step 1A z pomiaru pikseli
`Nature.png`) to `x=9, y=19, w=14, h=13`. Pień zajmuje więc piksele **9…23**
w kaflu 32 px. Dwa takie drzewa w sąsiadujących kaflach dają:

```
prześwit = (32 + 9) − 23 = 18 px
```

⚠⚠ **TABELA NIŻEJ JEST NIEPRAWDZIWA — czyta `bodyWidth` bez skali duszka.**
Realne ciała są 1,5–2,4× większe (dzik 46, nie 22). Patrz ramka „POPRAWKA
2026-08-28" na początku §10. Zostawiona w oryginalnym brzmieniu, żeby dało się
prześledzić, skąd wzięła się propozycja 24 px.

Zestawienie z `bodyWidth` z `GameConfig.ts` (ciało FIZYCZNE, osobne od
hurtboxa walki):

| stworzenie | `bodyWidth` | brama 18 px |
|---|---|---|
| **gracz** | **18** | przechodzi z zapasem **0 px** |
| wilk | 16 | przechodzi (2 px zapasu) |
| **Szary** | **20** | **brakuje 2 px** |
| **dzik** | **22** | **brakuje 4 px** |
| **niedźwiedź** | **30** | **brakuje 12 px** |

⚠ **Rozkład prześwitów w lesie jest zero-jedynkowy.** Bram jest 441 i mają
tylko dwie szerokości: **18 px (52 sztuki** — pnie w sąsiednich kaflach) albo
**32–33 px (389 sztuk** — jeden pusty kafel między pniami). Nic pośrodku.

Bramy 18 px leżą po całej mapie (najgęściej pas y 40–49: 18 sztuk).
**Każdy z dwóch dzików ma 4–12 z nich w zasięgu swojego pościgu.** To jest
„takich miejsc jest bardzo wiele" wyrażone liczbą.

Pionowo problemu nie ma: pnie siedzą przy dolnej krawędzi kafla, więc pionowy
prześwit to 19 px, a **każde** ciało w grze ma ≤ 16 px wysokości. Dlatego
objaw jest wyłącznie poziomy — „przechodzę MIĘDZY drzewami".

### 10.3 Fakt 2 — pościg jest linią prostą i klinuje się na pniu

`Enemy.updateChase` to jedno wywołanie `physics.moveToObject(this, player,
chaseSpeed)`. Zero omijania. Wróg wchodzi w pień i wpada w lokalne minimum:
ślizga się w jedną stronę, przez co cel przechodzi na drugą stronę pnia,
ślizga się z powrotem — i tak w nieskończoność.

Symulacja kroku Arcade (separacja osiami, 60 fps) przeciw żywym danym kolizji
`forrest.tmj`, dla pozycji gracza w zasięgu agro każdego spawnu:

| stworzenie | pozycji gracza, do których wróg **nigdy nie dochodzi** (20 s) |
|---|---|
| dzik @(2000,1104) | **14 %** |
| dzik @(1872,1488) | **19 %** |
| wilki (4 spawny) | 11–20 % |
| niedźwiedź | 15 % |

⚠ **To jest zero-jedynkowe, nie „wolniej".** Wśród tych, które docierają,
tylko 0–5 % dociera ponad 2× wolniej. Ślad jednego przypadku:

```
t= 0.0 s  dzik(2000,1104)  dystans 171 px
t= 2.0 s  dzik(1981,1032)  dystans  97 px
t= 4.0 s  dzik(1972,1032)  dystans  96 px
   …
t=18.0 s  dzik(1968,1032)  dystans  96 px
```

Podchodzi dwie sekundy i **stoi osiemnaście**.

To jest **drugi, niezależny błąd** — nie ten sam co §10.2. Osobno powstaje
i osobno się go naprawia.

**Zależność od gęstości** (okno 7×7 kafli, udział kafli z kolizją):

```
  gęstość kolizji     dzik utknął na zawsze
   0– 5 %                    2 %
  10–15 %                    7 %
  20–30 %                   19 %
  30 %+                     20 %
```

⚠ **To dotyczy planu wprost.** Zwarcie koron przekłada się na gęstość kolizji
mniej więcej tak: zwarcie 40–50 % → kolizja 20 %; zwarcie **70–80 % → kolizja
32 %**. **P6 „stara puszcza" ma zaprojektowane zwarcie ≥ 75 %** (§2) i zajmie
40 nowych kolumn, czyli **29 % gotowej mapy** — w najgorszym paśmie tej
krzywej, i to tam idzie niedźwiedź (D-2). Dziś mediana zwarcia na mapie to
47 %.

### 10.4 Fakt 3 — kryttery mają ciało wielkości CAŁEJ KLATKI ARKUSZA

`Critter` (sarna i lis) w konstruktorze woła `setScale`, ale **nigdy nie woła
`setSize`**. Każde inne stworzenie w grze ma ciało wpisane ręcznie (13–30 px
szerokości). Krytter dostaje domyślne ciało Arcade, czyli klatkę arkusza
przemnożoną przez skalę (potwierdzone w źródle Phasera, `Body.js`:
`this.width = this.sourceWidth * this._sx`):

| | klatka | skala | **ciało fizyczne** |
|---|---|---|---|
| sarna | 72×52 | 1,10 | **79 × 57 px** |
| lis | 64×36 | 0,85 | **54 × 31 px** |

To jest w większości powietrze wokół zwierzęcia. Skutek zmierzony na mapie:

| | ciało | mapa dostępna | osobnych wysp |
|---|---|---|---|
| gracz (odniesienie) | 18×16 | 86,6 % | **1** |
| dzik (odniesienie) | 22×15 | 85,1 % | **1** |
| **lis** | **54×31** | **63,1 %** | **40** |
| **sarna** | **79×57** | **40,1 %** | **163** |

Sarna ma ciało **szersze niż dwa i pół kafla**. Nie przechodzi nie tylko przez
bramy 18 px — **nie przechodzi przez żadną z 389 bram po 33 px również.**
Mieści się wyłącznie na polanach.

Do tego jej zryw: `boltSpeed` 170 px/s × `boltMs` 450 ms = **76 px lotu**, przy
ciele szerokim na 79 px. **Sarna nie jest w stanie odskoczyć o własną
długość.**

⚠ **TO JEST REGRESJA WPROWADZONA W STEP 1A.** Linia
`this.physics.add.collider(this.critters, map.solids)` w `GameScene` została
dodana świadomie (ryzyko R-1: „sarna przechodzi przez drzewa w świecie, w
którym gracz już nie przechodzi"). Do tego momentu ciało 79×57 nie miało
żadnego znaczenia, bo nic się z niczym nie zderzało. **Ta jedna linia zamieniła
je w klatkę.** R-1 zdjął objaw i odsłonił przyczynę, o której nie wiedział.

Dokłada się do tego trzecie miejsce bez obsługi przeszkód: `Critter.enterBolt`
ustawia prędkość „od gracza" i **ani razu nie sprawdza `body.blocked`**. Sarna
prze w pień przez pełne 450 ms, stoi 900 ms w fazie `watch`, i zrywa się w ten
sam pień znowu — pętla bez wyjścia. Cała maszyna `alert → bolt → watch →
powrót` z `docs/fauna_faza1.md`, wdrożona 2026-08-27 (2), jest w gęstym lesie
martwa.

Sarna i lis **nie obrywają** (nie ma ich w żadnym overlapie obrażeń), więc
dosłowne „bić z dystansu" ich dziś nie dotyczy — ale królik **jest** wrogiem
i **jest** do zabicia. Królik ma ciało 13×12, przechodzi wszędzie, a jego
`flee` jako **jedyne w grze** sprawdza `body.blocked`.

### 10.5 Co te trzy fakty znaczą razem

To nie są trzy błędy do trzech łatek. To **jeden brak: nigdzie nie jest
zapisane, ile ma mieć najwęższe przejście w lesie.**

Ciała stworzeń były strojone **pojedynczo, w świecie bez kolizji**, gdzie ta
liczba nie znaczyła nic — na wszystkich trzech mapach projektu było **zero**
kafli z kolizją aż do Step 1A. Step 1A dał światu ściany i wszystkie te
niezależne decyzje po raz pierwszy zaczęły ze sobą rozmawiać. Stąd trzy objawy
naraz i stąd wrażenie, że „takich miejsc jest bardzo wiele" — bo jest.

Osobna obserwacja z tego samego przeglądu: **pięć encji czyta `body.blocked`
i wszystkie pięć znaczy przez to „przerwij akcję"** (`Boar` — szarża,
`GreyWolf` — odskok, `Wolf` — wypad, `Rabbit` — ucieczka, `Projectile` —
rozbicie). Cała reakcja rostera na teren została napisana dla świata, w którym
w nic nie dało się wjechać. ⚠ U dzika ma to konkretną konsekwencję bojową:
szarża kasuje się o **cokolwiek** i wrzuca dzika prosto w bezbronne
`recovery`, więc pień między graczem a dzikiem zamienia jedyne zagrożenie
dzika w darmowe okno na ciosy. **Autor zdecydował 2026-08-27, że tej reguły
NIE ruszamy do czasu playtestu naprawionego pościgu** — zapisane, żeby nie
wróciło jako propozycja.

### 10.6 Propozycja — NIEZATWIERDZONA, ~~do decyzji~~ **NIEAKTUALNA w punkcie 1**

⚠⚠ **Liczba 24 px jest policzona na `bodyWidth` bez skali i nie opisuje niczego
realnego** — patrz ramka „POPRAWKA 2026-08-28" na początku §10. Punkty 2 i 3 są
wdrożone (ciało krytterów i warstwa ruchu); **punkt 1 nie jest i czeka na
standard, którego dalej nie ma.**

**Jedna decyzja: „najwęższe przejście w lesie ≥ 24 px", i trzy konsekwencje.**

| # | co | efekt | koszt |
|---|---|---|---|
| 1 | **Boxy pni 14 → 8 px** (`x=12, w=8` zamiast `x=9, w=14`) dla drzew 1-kaflowych; analogicznie dla 2- i 3-kaflowych | 52 bramy 18 px → **24 px**; przechodzi dzik (22) i Szary (20) | gracz wchodzi ~3 px w namalowany pień z każdej strony |
| 2 | **`Critter` dostaje prawdziwe ciało** przez `setSize`/`setOffset`, jak `Enemy`: sarna ~26×14, lis ~18×10 | sarna wraca z 40 % mapy na ~85 %, zryw ma dokąd prowadzić | wartości do wystrojenia okiem, nie z arkusza |
| 3 | **Pościg i zryw sprawdzają `body.blocked`** i przecelowują zamiast przeć w korę (ślizg z histerezą, jedno miejsce w `Enemy.updateChase` + `Critter`) | zaklinowanie 11–20 % → **1–7 %** (zmierzone na kandydacie) | ~30 linii; histereza liczona w **pikselach**, nie ms — optimum różni się z prędkością (wilk 96 px/s vs dzik 52 px/s) |

**Niedźwiedź (30 px) zostaje jedynym, którego las zatrzymuje — jako DECYZJA,
nie skutek uboczny.** Niedźwiedź, który nie wciśnie się za graczem w gąszcz,
jest treścią; dzik, który nie może, jest zepsutą walką.

Do tego **asercja mapowa `brama-min`: żadna brama < 24 px**, z kontrolą
negatywną — inaczej Step 3 i Step 6 odtworzą problem przy malowaniu, a P6 przy
zwarciu 75 % wyprodukuje takich bram dużo więcej niż dzisiejsze 52.

⚠ **Czego ta propozycja świadomie NIE zawiera:** prawdziwego szukania drogi
(A\*/flow-field). Ślizg zdejmuje ¾–⅞ zaklinowania za ~30 linii; A\* zdjąłby
resztę, ale za cenę nowego systemu i za cenę zmiany charakteru wrogów.
Reszta (2–7 %) siedzi tam, gdzie gęstość jest największa, **czyli dokładnie
w P6** — więc naturalnym wyzwalaczem tej decyzji jest playtest starej puszczy,
a nie dzisiejsze przeczucie.

### 10.7 Pytania otwarte — to jest materiał do konsultacji

1. **Czy 24 px to właściwy standard?** Wynika z „najszerszy wróg poza
   niedźwiedziem ma 22 px + 2 px zapasu". Alternatywy: 32 px (nikt się nigdy
   nie klinuje, ale las traci ciasnotę) albo 20 px (mieści Szarego, nie mieści
   dzika).
2. **Zwężać pnie czy zwężać zwierzęta?** `bodyWidth` jest osobne od hurtboxa
   walki, więc zwężenie ciała dzika 22 → 18 **nie zmieniłoby ani zasięgu, ani
   trafialności**. Byłaby to łatka na jedno zwierzę zamiast reguły — ale
   zachowałaby boxy pni zgodne z namalowanymi pikselami.
3. **Czy niedźwiedź ma się mieścić?** Propozycja mówi „nie, świadomie".
   To jest decyzja projektowa o tym, czy masa ma coś znaczyć.
4. **Czy ślizg wystarczy, czy od razu A\*?** Liczby są w §10.6; pytanie brzmi,
   czy zostawienie 2–7 % na P6 jest do przyjęcia.
5. **Czy kolejność §6 się zmienia?** Propozycja twierdzi, że tak: to musi wejść
   przed Step 3 i 6, bo inaczej malujemy 40 kolumn terenu, którego walki nie
   da się ocenić.

### 10.8 Jak to zmierzono — żeby dało się podważyć

Wszystkie liczby z §10.2–§10.4 pochodzą ze skryptów jednorazowych (Node,
uruchamiane ze scratchpada sesji, **nie zapisane w `tools/`** — reguła
`src/world/CLAUDE.md`), działających na **żywym `public/assets/maps/forrest.tmj`**:

- **Maska kolizji** budowana tą samą ścieżką co silnik: kafel najwyższy
  w komórce (`topmostTileAt`) → `CollisionLookup` (boxy z `objectgroup` albo
  property `solid` = pełny kafel) → piksele. Nie jest to przybliżenie danych
  Tiled, tylko odtworzenie reguły z `src/world/TiledMap.ts`.
- **Prześwity** (§10.2) liczone na pikselu, między prawą krawędzią jednego
  boxu a lewą krawędzią następnego, z wymogiem pokrycia w pionie ≥ 8 px
  (inaczej to nie jest brama, tylko dwa niezwiązane pnie).
- **Zaklinowanie** (§10.3) to symulacja kroku Arcade: prędkość prosto na cel,
  separacja najpierw w osi X, potem Y, dt = 1/60, limit 20 s. Odtwarza
  `moveToObject` + zachowanie silnika przy zderzeniu ze statycznym ciałem.
- **Dostępność mapy** (§10.4) liczona przy kroku **2 px** — świadomie, po
  błędzie opisanym w §10.1; przy kroku 4 px bramy 18 px są niewidoczne.

⚠ **Czego NIE zrobiono: weryfikacji w silniku.** Panel przeglądarki w tej
sesji nie uruchamia Phasera (`document.visibilityState` zostaje `"hidden"`,
ten sam limit co przy Fazie 1A i przy migracji sklepu). Wszystkie liczby są
z symulacji kodu i danych, nie z gry. **Zgłoszenie autora pochodzi
z rozgrywki i jest w tej sprawie mocniejszym dowodem niż którakolwiek z tych
tabel** — tabele mówią, ILE tego jest i dlaczego, nie CZY.

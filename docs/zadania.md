---
typ: OPERACYJNE
domena: proces
tytul: Rejestr zadań — jedna lista aktywnych OI
stan: zywy
otwarte: []
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Rejestr zadań

> **Czym ten plik JEST.** Jedną, kanoniczną listą **identyfikatorów** otwartych
> spraw (`OI-n`) z ich **kategorią** i **adresem pełnego opisu**. Odpowiada na
> „co jest otwarte i jakiego rodzaju to praca".
>
> ⛔ **Czym ten plik NIE JEST.** Nie jest opisem żadnej z tych spraw. Pełny
> opis — pomiar, powód, co wolno, a czego nie — mieszka **w dokumencie
> wskazanym w kolumnie „gdzie" i tylko tam**. Ten plik jest indeksem; kopia
> opisu tutaj byłaby drugim źródłem prawdy, czyli zerem.
>
> ⛔ **Nie jest planem.** Kolejność prac ustala autor; `docs/odlozone.md` mówi,
> **co odblokowuje** zaparkowaną pozycję, a ten plik — czym ona jest.

## Kategorie

| kategoria | znaczy |
|---|---|
| **BUG** | żywy błąd, odtworzony pomiarem — do naprawy |
| **IMPLEMENTATION** | brakująca funkcja albo brakujący **przymiar**, którą chcemy mieć |
| **DESIGN** | otwarte pytanie projektowe — **jedno zdanie autora jest tu całą robotą** |
| **CALIBRATION** | strojenie liczby; wymaga playtestu albo większego rosteru |
| **CONTENT** | brakuje zawartości gry (przedmiot, dźwięk, rozmowa, roster) |
| **DOCUMENTATION** | problem wyłącznie dokumentacyjny (w tym **komentarz w kodzie, który kłamie**) |

⚠ **Kategoria nie jest priorytetem.** `DESIGN` bywa najtańszy do zamknięcia
i najdroższy do pominięcia.

## Bilans (przeliczony 2026-10-11)

Liczone skryptem po sekcjach `AKTYWNE`. Od 2026-10-11 stoją tam WYŁĄCZNIE
sprawy otwarte — zamknięte są w `docs/issues_archive.md` (pilnuje `doc_check` §Z2).

```
AKTYWNE (otwarte)         72   BUG 7 · IMPL 10 · DESIGN 40 · CALIB 6 · CONTENT 8 · DOC 1
   ⚠ „BUG" niesie dziś głównie pozycje UI handlu i grafiki tarcz, nie żywe błędy.
```

⚠⚠ **Ponad połowa listy (38 z 69, przeliczone 2026-10-11) to `DESIGN`, a nie robota kodowa.** To nie jest wada
rejestru — to jest jego najważniejsza informacja: **projekt czeka dziś na
decyzje, nie na implementację.**

⚠ Sześć wierszy przyciętych 2026-10-11 do etykiety (`OI-116`, `OI-161`…`OI-165`)
ma pełne dawne brzmienie, z pomiarami, w `docs/issues_archive.md`.

---

## AKTYWNE

### BUG (7)

| id | rzecz | gdzie |
|---|---|---|
| **OI-176** | ⏳ **Halabarda i glewia w ZAMACHU prowadzą hakiem/grzbietem** (ostrze·ruch −0,26 w klatce cięcia `Attack_2H`). Reszta rosteru naprawiona 2026-10-12 odwróceniem siatki (`char3d_weapons.OSTRZE_LOKALNE`); drzewcowych tak nie wolno — ich ostrze ustawia poza noszenia, więc odwrócenie skręciłoby nadgarstek o 180°. Naprawa = skręt dłoni w zamachu drzewcowej. Bramka `char3d_sprawdz_bron` drukuje to jako „ZNANE, OTWARTE” | `tools/char3d_weapons.py` „Ostrze prowadzi cios” |
| OI-126 | 🟡 **CZĘŚĆ TARCZOWA ZAMKNIĘTA 2026-10-02** — wspólny standard metalu `tools/metal_palette.py` istnieje (pancerz i tarcze z niego czytają), 18 tarcz żelaznych/stalowych + „Tarcza okuta” mają ikony z warstwy metalu na masterze (`tools/build_metal_shield_icons.py`). ⏳ **Otwarte:** nóż, sztylet i nóż myśliwski stoją na starej, 3-tonowej rampie noża (kontrast 14–28 przy progu 50) — przejście na standard zmienia zamrożone SHA1 sztyletów, więc wymaga decyzji autora | `docs/tarcze_grafika_checkpoint.md` §15 |
| OI-127 | jakość **Q1–Q7 przez geometrię desek** (spasowanie, różne szerokości), nie przez kolor — master jest pod to przygotowany, nic nie jest wdrożone | `docs/tarcze_grafika_checkpoint.md` §5 |
| **OI-144** | ⏳ **ROZMIAR TRZECH DUŻYCH TARCZ 3D JEST ROBOCZY** (migdałowa 89, legionowa 90, pawęż 95 cm po skali rodziny 0,8485). Czytelność oceniano **tylko na okrągłej** (66 → 56 cm, zasłona głowy 47% → 24%); duże niosą `rozmiar_roboczy=True` i generator drukuje przy nich `ROBOCZY`. ⚠ Głowa pawęży zostaje zasłonięta w **~41% niezależnie od kąta gardy** — to rozmiar, nie orientacja, więc kant tego nie naprawi. ⛔ Nie „zamykaj" bez obejrzenia w grze | `docs/tarcze_grafika_checkpoint.md` §9, §14 |
| **OI-145** | fasetowanie obrysu tarcz widoczne przy DUŻYCH renderach (16–22 wierzchołki konturu, `shield_shapes.TOLERANCJA_J = 0,05`). ⚠ W buforze gry to **0,23 px**, czyli niewidoczne — próg był dobrany pod bufor, nie pod podgląd. Jedna liczba, jeśli kiedyś zacznie przeszkadzać | `docs/tarcze_grafika_checkpoint.md` §14 |
| OI-132 | **sprzedaż zestawu SCHOWANEGO** (`weapon2`/`offhand2`) — sylwetka w sklepie pokazuje wyłącznie `EQUIP_SLOTS`, więc schowana para jest poza handlem. ⚠ Stan odziedziczony sprzed przebudowy, nie regres | `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md` §6 |
| OI-131 | **panel handlu liczy rozmiar RAZ, w konstruktorze** — okno zmienione po starcie gry skaluje panel zamiast go przebudować (ta sama cena, co w `PlayerPanel`); na telefonie bez znaczenia, orientacja zablokowana | `src/ui/ShopPanel.ts` |

### IMPLEMENTATION (10)

⚠ Osiem z dwunastu to **brakujący przymiar**, nie brakująca mechanika.

| id | rzecz | gdzie |
|---|---|---|
| **OI-171** | ⏳ **BANDYCI — pierwsi humanoidalni wrogowie** (decyzja autora 2026-10-11: „Tak, całość”). Obóz w lesie (miejsce robocze, do ustalenia — `docs/odlozone.md` §1), zadanie Ciechana po Szarym, zbój z pałką / z toporem / herszt w paśmie `P` 100–160, łup ze złotem i nieosiągalnym pancerzem. ✅ **Wdrożone 2026-10-11** (model, klasa, obóz, łup, zadanie, rozmowy — sprawdzone w silniku); ⏳ **CALIBRATION**: playtest liczb i pomiar pięciu modeli na S21 FE | `docs/bandyci_plan.md` |
| **OI-161** | ⏳ **Zwierzęta 3D — cały roster walczący ma modele** (`Creature3D`, generatory `tools/*3d.py`). Otwarty zostaje **pomiar N stworzeń na S21 FE** (`dev.char3d.manekiny(n, "wolf")` + `dev.perf.watch(15)`) | `docs/systemy/render3d.md`; `public/assets/README.md` („Czworonogi 3D”) |
| **OI-162** | ⏳ **Lis — ucieka, aż uzna, że to nic nie daje** (wdrożony 2026-10-04, poprawka 10-05). CALIBRATION: odbiór pościgu z ręki (3–4 s). ⏸ Lis pod kurnikiem → `docs/odlozone.md` §4. ⏸ CONTENT (skóra lisa — ikona) odłożony przez autora 2026-10-12: „drobnica, która nic nie zmienia w rozgrywce” | `docs/systemy/creatures.md` §2.4; `docs/dziennik.md` 2026-10-04 (3) |
| **OI-163** | ⏳ **Jeleń — neutralny, broni się uderzony** (wdrożony 2026-10-04). CALIBRATION: HP 70, obrażenia, ucieczka przy niskim HP. ⏸ CONTENT (dziczyzna, skóra jelenia — ikony) odłożony przez autora 2026-10-12 | `docs/systemy/creatures.md` §2.4; `docs/dziennik.md` 2026-10-04 (4) |
| **OI-164** | ⏳ **Świat w 3D — DOMYŚLNY od 2026-10-06** (kamera A: stała kamera 3D, rozgrywka 2D bez zmian; las i wieś na S21 FE 119,8 FPS). Otwarte: kąt kamery i zoom (DESIGN), pomiar wsi z uprawami na S21 FE, zacięcia przy pierwszym wejściu w fragment lasu, Gęstwina. ⭐ **Autor 2026-10-14: migracja na widok IZOMETRYCZNY — zaplanowana na 2026-10-17** (top-down pokazuje budynek z 4 stron; koło młyna wymagało skrętu 25°). Część rzeczy zostaje, część trzeba dopasować, żeby gra pokazała nie tylko młyn | `docs/systemy/render3d.md` |
| **OI-165** | ⏳ **Rozstaw lasu ×1,5 (240×90) — wdrożony 2026-10-04**, S21 FE zaliczone. Otwarte: odbiór w grze (czy las czyta się jak las, dosiew spawnów 26 → 39); Gęstwina ma tę samą chorobę; stare zapisy z lasu lądują obok | `docs/decyzje/2026-10-04-rozstaw-lasu.md` |
| OI-1 | indeks `docs/README.md` utrzymywany ręcznie; da się generować z nagłówków | `docs/DOC_CONTRACT.md` §14 |
| OI-50 | ⚠ **ZAWĘŻONE 2026-09-21 — NIE ZAMKNIĘTE.** Domena ma przymiar: `tools/zapis_weryfikacja.mjs` (59 asercji, sabotaż 14/14). Poprzednie brzmienie — „nie ma **ani jednej** asercji" — jest od tej daty nieprawdziwe. ⛔ Otwarte zostaje to, czego przymiar zobaczyć nie może: czy nowe pole *zadeklarowano* jako opcjonalne i czy `SAVE_VERSION` nie poszedł w górę bez powodu. **Zamknięcie to decyzja autora** | `docs/systemy/save.md` |
| OI-68 | modalność bez właściciela (osiem flag otwarcia, pauza niezliczana); część „przymiar paneli” zrobiona 2026-10-13 (`tools/panel_fit.mjs`) | `docs/systemy/ui.md` |
| OI-80 | reguła „nie tnij arkusza po współrzędnych" bez egzekutora; złamanie już raz zaszło | `docs/systemy/assets.md` |

### DESIGN (40) — jedno zdanie autora

| id | rzecz | gdzie |
|---|---|---|
| **OI-178** | ⏳ **Typografia interfejsu na telefonie** — ✅ 2026-10-13: D1 (krój proporcjonalny w całym UI) i role rozmiarów `TYPE` (≥ 18 j. tekst, ≥ 15 j. drugi plan); na role przeszły szyna, pasek zakładek i rozmowa. ✅ 2026-10-13 etapy D–F: wszystkie PANELE na rolach (plecak, sklep, usługi rozmowy, Postać, dziennik, Opcje, Mapa — `panel_fit` §L). Otwarte: widżety HUD-u (pasek buffów, tracker, przyciski walki, monit odrodzenia — 12 plików, ~23 literały) i D6 (rozmiar tekstu jako ustawienie) | `docs/ui_mobile_research.md` §8–§9 |
| **OI-177** | ⏳ **Zamiana zestawu broni W WALCE — koszt** (autor 2026-10-12 zlecił przycisk na HUD-zie: „szybki swap broni” pod łucznika z mieczem i tarczą). Dziś roboczo: zero kosztu, odstęp 1 s, odmowa przy ciosie w locie (`WEAPON_SWAP`). Do decyzji: czas przełożenia z animacją / koszt staminy / okno bezbronności — i czy zamiana podmienia pasek umiejętności (D3). Najlepiej razem z łukiem (etap 3) | `docs/ui_mobile_research.md` §3 D2–D3 |
| **OI-172** | ⏳ **KOLONIA PAJĄKÓW W GĘSTWINIE — miejsce w kręgosłupie** (zamiar autora 2026-10-11: leże w jaskini, zwierzyna wciągana do środka, role jak w mrowisku — sieciarz ✅, skoczek ✅, robotnica, obrońca, królowa). ✅ **Miejsce w łańcuchu rozstrzygnięte 2026-10-11: kolonia WYPCHNIĘTA, szczytem jest nekromanta** (`swiat.md` §1). ⏳ Zostaje jedno zdanie autora: **w której fali gracz widzi leże** (ofiary w jaskini = druga fala). ⛔ Nie implementacja; pajęcza rasa humanoidalna → `docs/odlozone.md` §3 | `docs/spider_colony.md` |
| **OI-166** | ⭐⭐ **KREATOR POSTACI — awatar gracza i fabryka wariantów NPC** (2026-10-09, autor). Osie v1: 5 sylwetek + wzrost, 8 fryzur (z zachowaniem pod hełmem), zarost, kolory włosów i skóry; detale twarzy dopiero z portretami 3D (reguła „co widać z 60 px"). Opcje jako DANE (katalog), wygląd jako opcjonalne pole zapisu, NPC = preset. Plan w 6 etapach; ✅ `OI-134` zamknięte 2026-10-10 (baza V5 = MASTER) — kreator ma na czym stanąć. D1 ✅ bohater zostaje synem (2026-10-09); otwarte D2–D5 (tony skóry, imię, odblokowania, akceptacja list) | `docs/kreator_postaci.md` |
| **OI-168** | ⭐ **TRYB CO-OP DLA ZNAJOMYCH — kierunek długoterminowy** (2026-10-09, autor), razem z nim wybór płci. ⛔ Nie implementacja — wpływa na decyzje teraz: drugi typ ciała na tym samym szkielecie, pancerz sterowany kotwicami ciała, ⚠ **rozdział zapisu POSTAĆ ↔ ŚWIAT** (najdroższy, jeśli odłożony) | `docs/kreator_postaci.md` §10 |
| **OI-167** | ⭐ **MODEL BIZNESOWY gry — premium czy kosmetyka** (2026-10-09, autor: „produkt, na którym można kiedyś zarobić"). Rozstrzyga m.in. odblokowania w kreatorze (D4). ⛔ W każdym wariancie: zero statystyk za pieniądze | `docs/kreator_postaci.md` §8 |
| **OI-119** | ⏳ **`minReach` jako możliwa podstawa przyszłej JAKOŚCI TRAFIENIA zależnej od dystansu.** `minReach` jest **istniejącym mechanizmem** (martwa strefa w zwarciu, własność konstrukcji) i gdyby kiedyś powstała mechanika „sweet spot / degradacja na skraju zasięgu", mogłaby się na nim oprzeć. ⛔ **Obecnie NIE implementować** sweet spotu ani degradacji — to jest zanotowana możliwość, nie plan. ⚠ Przy powrocie najpierw sprawdzić, czy istniejące pola wystarczą | `docs/odlozone.md` §3 |
| **OI-117** | ⏳ **Przyszły rozwój tożsamości BUZDYGANU — hipoteza ODŁOŻONA, nie zadanie.** Jedyna konstrukcja w katalogu, którą fikcja obiecuje jako **specjalistyczną** (przeciw ciężkiej ochronie), a dane opisują jako **czysty standard kinetyczny**; z Młotem bojowym 1H dzieli `cd 0,52`, `swing 185` i DPS 23,08 co do joty, a różni go wyłącznie BRAK cech. ⛔ **Świadomie BEZ Construction Traita, bez wariantu, bez nowej mechaniki**; wartości nietknięte. ⚠ Wraca dopiero po rozbudowie katalogu broni, systemu walki i obrony **oraz** po danych z właściwego gameplayu — a wtedy **najpierw** sprawdzić istniejące mechaniki i parametry, ⛔ nie zakładać nowej statystyki | `docs/odlozone.md` §3 |
| **OI-116** | ⚠ **HIPOTEZA, nie decyzja:** czy `attackCooldown` i `swingDurationMs` mają być osobnymi osiami katalogu (r = 0,97 na 37 konstrukcjach). Pierwszy krok: PLAYTEST trzech par (Buzdygan↔Młot 1H, Miecz↔Miecz długi, Włócznia↔Rohatyna). ⛔ Do tego czasu nie ruszać wartości | `docs/odlozone.md` §2; `docs/dziennik.md` 2026-09-18 (3) |
| **OI-108** | ⚙ **ZAWĘŻONE 2026-09-18 — pytanie o KONSTRUKCJę, nie o mechanikę.** „Włócznia z tarczą" **da się dziś złożyć** (1.5H). ⭐ Korytarz „jednoręczna drzewcowa ≤ 74 px" był pusty, bo **szukano na złej osi**: ceną chwytu jest MARTWA STREFA, nie długość drzewca — zasięg 98/102 został nietknięty. ⏳ Otwarte zostaje węższe pytanie: **czy ma istnieć osobna konstrukcja DZIDA** (krótsza drzewcowa, natywnie 1H), czy 1.5H wystarcza | `docs/decyzje/2026-09-18-kategoria-1-5h.md` §5 |
| OI-94 | czym mają być premie zestawów — dziś celowo PUSTE. ⚠ **Zablokowane przez OI-143**: skalę premii ustala się po rozstrzygnięciu kumulacji | `docs/systemy/items.md` §9.2 |
| OI-143 | ⭐ **NUMER NADANY 2026-09-21 — rozstrzygnięcie zderzenia.** Do tej daty ta sprawa nosiła kolidujący `OI-104`. **Treść: czy trzy zestawy materiałowe wolno mieć CZĘŚCIOWO CZYNNE NARAZ** — model C położył L1/L2/L3 na rozłącznych warstwach, więc pełne przeszywanica + kolczuga + stal daje trzy progi „4 szt." jednocześnie. Dziś maskuje to `bonus: {}`. **Warunek wstępny `OI-94`.** ⚠ `OI-104` NIE jest już tym numerem — należy wyłącznie do wdrożenia Modelu D (ZAMKNIĘTE 2026-09-15), bo zamknięte decyzje zachowują swoje numery | `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md` |
| OI-100 | czy domykamy trójkąt typów obrażeń piątym PROFILEM (łuska) — przestraja całą broń ciętą. ⭐ **Oś gatunku (2026-09-15) już z tym nie konkuruje**: profil i gatunek są prostopadłe | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` |

| OI-97 | czy zamiana zestawu broni ma działać w walce, i jakim kosztem | `docs/systemy/weapons.md` |
| OI-91 | dwie zdolności o identycznej mechanice mówią dwoma językami podglądu | `docs/odlozone.md` §1 |
| OI-93 | pasek zdolności miesza dwa typy przycisków, wyglądające identycznie | `docs/systemy/ui.md` |
| OI-5 | `swiat.md` (`KANON`) niesie tabelę „co już jest w grze" — mechanika w złym typie | `docs/DOC_CONTRACT.md` §2.2 |
| OI-14 | `ATTRIBUTES.maxCritChance` w bloku atrybutów, choć nie dotyczy atrybutu | `docs/systemy/attributes.md` |
| OI-20 | czym miał być sufit `maxDefenseReduction` — margines cieńszy, niż mówi dokumentacja | `docs/systemy/armor.md` |
| OI-27 | dwa mechanizmy stanów w grze — ogłuszenie nie weszło do warstwy efektów | `docs/systemy/effects.md` |
| OI-33 | dwie ścieżki obrażeń rozstrzyga fizyka silnika, nie geometria walki | `docs/systemy/combat.md` |
| OI-34 | mitygacja pakietu wieloskładnikowego — żyje wyłącznie w komentarzu kodu | `docs/systemy/combat.md` |
| OI-36 | trzy zaczepy warstwy efektów bez konsumenta, a uprząż testuje wszystkie trzy | `docs/systemy/effects.md` |
| OI-49 | czy „żadna prędkość pościgu nie przekracza marszu gracza" jest regułą, czy zbiegiem | `docs/systemy/movement.md` |
| OI-54 | trzy progi „tapnięcie czy przeciągnięcie", jeden globalny dla sceny | `docs/systemy/input.md` |
| OI-59 | sufit pojemności plecaka nigdzie nie jest egzekwowany | `docs/systemy/inventory.md` |
| OI-60 | trzy pozycje z listy „czego świadomie NIE MA" zostały zbudowane | `docs/systemy/inventory.md` |
| OI-64 | czy warstwa rozmowy ma być osobną domeną — dowody zebrane, decyzja nie | `docs/systemy/quests.md` |
| OI-67 | próg dotykowy pilnowany w klastrze walki, szynie i listach + kartach (`panel_fit` §F); część przycisków paneli dalej poniżej | `docs/systemy/ui.md` |
| OI-69 | odmowa ma dwa kształty i żadnej reguły wyboru (5 przycisków vs 21 komunikatów) | `docs/systemy/ui.md` |

**Osobno — decyzje o samej dokumentacji, o narzędziach i o kodzie jako całości:**

| id | rzecz | gdzie |
|---|---|---|
| OI-57 | wspólny strumień losowy generatora audio czyni WSTAWIENIE dźwięku drogim | `docs/systemy/audio.md` |
| OI-73 | projekt nie ma **ani jednego** zadeklarowanego celu wydajnościowego | `docs/proces/ekstrakcja_performance.md` |
| OI-77 | kolizja terenu istnieje na jednej mapie z trzech | `docs/systemy/world.md` |
| OI-78 | ⚙ wykrywanie zrobione 2026-10-11 (`dev.mapWarnings()`); ⏳ **DESIGN**: czy pominięty tileset ma być błędem | `docs/systemy/assets.md` |
| OI-82 | 43 rzutowania identyfikatora domeny na domenę — kompilator wyłączony na styku | `docs/systemy/architecture.md` |
| OI-83 | odtwarzanie zapisu omija każdą bramkę, a sprząta jedną łatą | `docs/systemy/architecture.md` |
| OI-84 | osiem dokumentów ponad limitem §8 — cięcie to praca nad treścią | `PROJECT_DOCS_CHECKPOINT.md` |
| OI-85 | `STAN` odsyła do `stan: zamrozony` wbrew kontraktowi §6 — zmierzone 2026-10-11: **4 odwołania** (było 13), wszystkie w tabelach powodów do `audyt_projektowy_fundamentow_2026-09-03.md` (D3, D5 ×2, §2.9) | `PROJECT_DOCS_CHECKPOINT.md` |
| **OI-87** | ⭐ **prezentacja rozmowy: dane są rozmową, interfejs był indeksem** — ✅ 2026-10-09 przebieg rozmowy zamiast listy tematów; ✅ 2026-10-12 hub zniknął (arkusz); ✅ **2026-10-13 rama usług** (rozmowa = zakładka 0, usługi w stałej kolejności, szyna, Wstecz o poziom) i **grupy tematów** (D14). ✅ **2026-10-13 zadania w rozmowie** (D4: „!" oferta w głosie dawcy, „?" oddanie). Otwarte: reprezentacja NPC (D5), odbiór na telefonie | `docs/ui_mobile_research.md` |

### CALIBRATION (6) — czeka na playtest albo na większy roster

⚠ **Żadnej z tych liczb nie wolno „nudgować" przed playtestem.**

| id | rzecz | gdzie |
|---|---|---|
| **OI-113** | ⭐ **`ABILITIES.cleave.halfArcDeg = 90` — jedyna liczba, której migracja łuku nie mogła „zachować".** Stanu sprzed nie było: 32 bronie niosły 32 różne kąty (22°…104°, mediana ~58). 90 to `FRONT_ARC_DEG`, czyli to, co gra już nazywa „przodem" — ale **poszerza klin wobec 26 z 32 dotychczasowych broni**. ⛔ Nie stroić z wyliczenia; `maxTargets: 3` i tak ogranicza skutek. ⚠ Zmiana tej liczby wymaga przeliczenia punktu testowego w `§O6` | `docs/decyzje/2026-09-18-luk-nalezy-do-umiejetnosci.md` §3 |
| **OI-105** | ⭐ playtest parametrów STARTOWYCH Modelu D — **rozdzielony: `105a` pasmo 12–46,5 kg (teraz), `105b` pasmo 47–75,5 kg (po OI-98)**. ⚠⚠ **`W4` pokazuje od 2026-09-17 `59,7 kg` zamiast `58,7` — przesunął go WIELKI MIECZ** (8 kg, najcięższa broń w katalogu). ⛔ Nie jest to nowa usterka ani powód do obniżenia jego masy; dominującą przyczyną zostaje ciężka pawęż (16,2 kg) | `docs/playtest_protocol_oi105a.md` |
| OI-29 | odbiór warstwy 2 nie sprawdzony przez człowieka ani razu (pięć pytań) | `docs/odlozone.md` §2 |
| OI-70 | kanały prezentacji skanalizowane w różnym stopniu i nic tego nie pilnuje | `docs/systemy/presentation.md` |
| OI-71 | łata filtrowania tekstu bez przymiaru; awaria niewidoczna w liczbach | `docs/systemy/presentation.md` |

⚠ **`OI-72` stoi na granicy `CALIBRATION` i `DESIGN`** — jeśli playtest
potwierdzi, że barwa nie wystarcza, rozstrzygnięciem będzie **zmiana nośnika,
nie liczby**, a to jest już decyzja projektowa.
| **OI-159** | ⏳ **Martwa strefa drzewcowej a szybkie zwierzęta** — zgłoszone przez autora (2026-10-03): „trzeba się nachodzić, bo króliki ciągną do martwej strefy, z której nie da się atakować”. `melee.minReach` mają pika 62, halabarda 34, glewia 28, widły 20 px; królik po skoku ląduje w niej i gracz musi się cofać. ⚠ Sprawdzić najpierw, którą bronią (włócznia minReach nie ma) — potem decyzja: mniejsza strefa, odskok, czy tożsamość konstrukcji | `docs/checkpoint_2026-09-17.md` (`minReach`) |

### CONTENT (8)

| id | rzecz | gdzie |
|---|---|---|
| **OI-175** | ⏳ **Spójność postaci: opis w kanonie ↔ to, co mówią o sobie w grze** (autor 2026-10-11). Porównać opis każdego NPC w `swiat.md` / `wioska_plan.md` z jego kwestiami, powitaniami i tematami w `GameConfig.ts` — charakter, przeszłość, relacje, sposób mówienia. Wynik: lista rozjazdów do decyzji autora (co jest kanonem, co poprawić). Cel: łatwiej rozwijać spójne postacie. Przykład rozjazdu: ruda Kira (`OI-174`). ⚙ **Przegląd zrobiony 2026-10-12:** 6 poprawek od ręki, **7 kart do decyzji (B1–B7)**, 9 luk w relacjach do wspólnego pisania | `docs/character_consistency.md` |
| **OI-174** | ⏳ **Kirka — zadanie „Poszukaj Kirki” i wyrównanie psa z kanonem** (autor 2026-10-11). ✅ **Zadanie wpięte 2026-10-12** (`QUESTS.szukaj_kirki`, nowy cel `reach`, `scenes/QuestSpots.ts`): z pieczonym mięsem gracz staje na łące w NW rogu wsi (obiekt `miejsce`), Kirka wbiega zza krawędzi świata, je przy nodze i gna do domu; do tego czasu jej nie ma na mapie. Sprawdzone w silniku i zrzutem 3D. ✅ Wyrównane 2026-10-11: powitanie, pytanie „Kirka?”/„Kira?”, maść `dog.glb`. ⏳ Odbiór autora: teksty zadania i miejsce (`docs/content_expansion.md` §3) | `docs/swiat.md` „Anna” |
| **OI-115** | ⏳ **Kilof — przyszły przedmiot UŻYTKOWY / narzędzie.** Usunięty z katalogu broni 2026-09-18 (F2); ⛔ **systemu narzędzi świadomie NIE projektujemy teraz** — `Gathering.ts` nie zna dziś pojęcia narzędzia w rękach. Wraca razem z nim, nie wcześniej | `docs/dziennik.md` 2026-09-18 (2) |
| **OI-110** | **Kosa bojowa** (drzewcowa chłopska) przeszła projektowo i jest zablokowana **ARTEM**: na `items.png` nie ma sylwetki, która przy 17,6 px czyta się jako kosa, a nie jako topór | `public/assets/README.md` „`items.png` — rzędy BRONI" |
| **OI-120** | ⏳ **Bestiariusz nie wykorzystuje równomiernie kanałów obrażeń — KIERUNEK CONTENTOWY, nie zadanie.** Zmierzony rozkład źródeł trafiających w gracza: **kłute 4** (wilk, Szary ×2, skoczek) · **bez typu 5** · **obuchowe 2** (dzik) · **cięte 1** (niedźwiedź). Skutek: kolczuga ma tożsamość na `slash 1,80` i `blunt 0,35`, a oba te kanały ma dziś po JEDNYM dostawcy. ⏳ Przeciwnicy ludzcy domykają rozkład sami. ⛔ **Nie dodawać nowych typów obrażeń, nie ruszać `ARMOR_PROFILE`, nie ruszać `Protection.ts`** | `docs/pancerz_checkpoint.md`; `docs/decyzje/2026-09-18-zamkniecie-audytu-pancerza.md` |
| OI-99 | ⚠ **POŁOWA ZAMKNIĘTA 2026-09-16** — slot RAMIONA ma dziś **cztery naramienniki**; kafel **PAS** nadal stoi pusty i przygaszony. ⚙ 2026-10-03: rzemień istnieje jako GEOMETRIA koszuli (`linen_shirt`, `char3d_armor.P(pas=…)`), nie jako przedmiot — slot `belt` ożyje z pierwszym przedmiotem-pasem i decyzją, co pas robi w mechanice. ✅ naramienniki są od 2026-10-11 w sklepach (`OI-106`) | `docs/decyzje/2026-09-11-ekwipunek-fundament.md`; `docs/pancerz_checkpoint.md` |
| OI-10 | poziomy jakości 5–7 nie są produkowane przez nic — rezerwa bez wydawcy | `docs/systemy/items.md` |

### DOCUMENTATION (1)

| id | rzecz | gdzie |
|---|---|---|
| **OI-111** | ⚠⚠ **`combat.md` ma 0 BAJTÓW, `weapons.md` 10** (2026-09-18 — obie musiały wyciąć tyle, ile dopisały). Dawniej: **`weapons.md` 48 BAJTÓW zapasu** do limitu `STAN` (20 KB) — druga taka pozycja obok `combat.md` (13 bajtów, `OI-84`). Następne zdanie o broni nie zmieści się nigdzie; obie partie 2026-09-17 musiały **wyciąć tyle, ile dopisały**. ⚠ Osobno: **`checkpoint_2026-09-17.md` urosł do 26 KB** (limit `OPERACYJNE` 20 KB) — trzy etapy w jednym punkcie wejścia. Cięcie to praca nad treścią i należy do autora | `docs/DOC_CONTRACT.md` §8 |

---

## ODŁOŻONE

⚠ **`docs/odlozone.md` jest jedynym pełnym parkingiem** — ma podział po tym,
**co pozycję odblokowuje** (§1 decyzja · §2 playtest · §3 osobna sesja ·
§4 materiał z zewnątrz), i tego podziału ten plik nie powiela.

| rzecz | gdzie |
|---|---|
| `OI-89` — czy klin łuku kierunkowego ma obracać się do celu w tłumie (cel ↔ grupa) ⏸ zamrożone 2026-10-11: walka — playtest | `docs/odlozone.md` §2 |
| `OI-90` — bramka ruchu jest asymetryczna: autoatak odmawia w marszu, zdolność nie ⏸ zamrożone 2026-10-11: walka — playtest | `docs/odlozone.md` §2 |
| `OI-12` — czy Zręczność ma za dużo korzyści (4 kanały wobec 1 Kondycji) ⏸ zamrożone 2026-10-11: balans atrybutów | `docs/systemy/attributes.md` |
| `OI-16` — górne tempo regeneracji staminy: `4` czy `4,5` ⏸ zamrożone 2026-10-11: stamina — playtest | `docs/systemy/stamina.md` |
| `OI-21` — materiał bazowy pancerza zdominowany na wszystkich trzech typach naraz ⏸ zamrożone 2026-10-11: FREEZE pancerza 2026-09-18 | `docs/systemy/armor.md` |
| `OI-22` — „trzecia kategoria ochrony" — uzasadnienie parkingu obalone danymi ⏸ zamrożone 2026-10-11: FREEZE pancerza 2026-09-18 | `docs/systemy/armor.md` |
| `OI-25` — koszt alternatywny noszenia tarczy — pogłębiony przez Uderzenie tarczą ⏸ zamrożone 2026-10-11: FREEZE tarcz 2026-09-18 | `docs/systemy/shields.md` |
| `OI-44` — budżet punktów rozwoju niemal wyczerpany przez ujścia poza atrybutami ⏸ zamrożone 2026-10-11: balans punktów (razem z krzywą XP) | `docs/systemy/progression.md` |
| `OI-88` — próg strefy obrotu drążka (0,45) zabrał marsz poniżej 45% prędkości ⏸ zamrożone 2026-10-11: sterowanie — playtest | `docs/odlozone.md` §2 |
| `OI-92` — trzeci stan pierścienia celu dzieli rodzinę barw z tintem ogłuszenia ⏸ zamrożone 2026-10-11: odbiór barw — playtest | `docs/systemy/presentation.md` |
| `OI-13` — liczby budżetu punktów przeliczone na starym rosterze ⏸ zamrożone 2026-10-11: balans atrybutów | `docs/systemy/attributes.md` |
| `OI-18` — czy stan „Zmęczony" jest w ogóle odczuwalny ⏸ zamrożone 2026-10-11: stamina — playtest | `docs/systemy/stamina.md` |
| `OI-19` — kalibracja staminy stoi na nieodtwarzalnym pomiarze tempa gry ⏸ zamrożone 2026-10-11: stamina — playtest | `docs/systemy/stamina.md` |
| `OI-26` — pas boczny bloku jest niewidzialny dla gracza — playtest strukturalnie nie odpowie ⏸ zamrożone 2026-10-11: FREEZE tarcz 2026-09-18 | `docs/systemy/shields.md` |
| `OI-40` — dwie liczby progu zasięgu: czy `allowance` ma wchodzić, i pas ±2 px ⏸ zamrożone 2026-10-11: walka — playtest | `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md` |
| `OI-72` — ⚠ barwa jest jedynym nośnikiem (unik, parowanie, wynik warstwy 2) — odbiór niesprawdzony ⏸ zamrożone 2026-10-11: odbiór barw — playtest | `docs/systemy/presentation.md` |
| `OI-86` — mnożnik kadencji dwóch rąk (`DUAL_WIELD.swingMul`) to **placeholder** ⏸ zamrożone 2026-10-11: walka — playtest | `docs/systemy/combat.md` |
| `OI-43`, `OI-28`, `OI-46` — krzywa XP, nieosiągalne rangi Mastery, zamknięte ujście złota. ⏸ **Za wcześnie (autor 2026-10-11):** przeciwnikami są zwierzęta i świeżo dodani bandyci — to nie są wrogowie, na których zdobywa się mistrzostwo; przy tej skali gry i liczbie umiejętności poziomy nie są problemem. ⛔ Nie stroić krzywej ani nie dokładać wrogów „pod rangi". Wraca, gdy świat dostanie kolejny szczebel przeciwników | `docs/systemy/progression.md`, `docs/systemy/proficiency.md` |
| `OI-63` — druga połowa (zgodność stanowiska z siedliskiem); **zablokowana**: `.tmj` nie koduje typu terenu wokół punktu | `docs/systemy/gathering.md` |
| `OI-42` — generator macierzy nie zapisuje; ⚠ blokada `OI-7` **przestała obowiązywać 2026-09-07** | `docs/systemy/weapons.md` |
| ETAP A planu lasu — runtime test na S21 FE, **nadal PENDING** | `docs/plan_dalszych_prac.md` |
| Bear — drugie gardło w A9; GreyWolf — Wariant B (druga trasa) | `docs/plan_dalszych_prac.md` OPEN DECISIONS |
| Długi Biegłości **D2 / D3 / D4** | `docs/systemy/proficiency.md` |
| Dług nazewniczy `SHIELD.blockArcDeg` | `docs/systemy/shields.md` |
| Balans wartości broni, kary MH/OH, Mastery dla DW i 2H, `uninterruptible` dla 2H | `docs/konfiguracje_broni_checkpoint.md` §4.4 |
| Asercja cenowa: 23 naruszenia zamiast 4 (roster urósł 7 → 11 broni) | `docs/atrybuty.md` §10.4(a) |
| `docsy.zip` w `docs/` — do usunięcia albo wyprowadzenia poza repo | `docs/README.md` |
| `OI-146` (reszta) — ciągłe zwracanie się do stargetowanego zagrożenia BEZ ciosu; decyzja 2026-08-23 z epoki 2D wraca do oceny po wdrożeniu 3D (autor 2026-10-09) | `docs/dziennik.md` 2026-10-09 (2) |
| **Pomiar 3D na S21 FE** — `OI-157` (bufor 320×200), `OI-158` (mała broń w dłoni), `OI-169` (kamera ×0,8), `OI-170` (~8 MB `.glb` mieszkańców); odłożone przy zamknięciu prototypu postaci 3D 2026-10-10 | `docs/odlozone.md` §2 |

⛔ **Czego świadomie NIE budujemy** (barierki — wracają jako „dobry pomysł" co
kilka sesji): `docs/odlozone.md` §5. To nie jest backlog.

---

## ZAMKNIĘTE

⛔ **Zamknięte sprawy są w `docs/issues_archive.md`** (dosłownie, z pomiarem
i adresem) — także te z dawnej sekcji „ZAMKNIĘTE W OSTATNICH SESJACH”.
Zamykając sprawę, przenieś jej wiersz TAM; `doc_check` §Z2 świeci na
zamkniętym wierszu w sekcji AKTYWNE.

## ODRZUCONE

⛔ **Rozstrzygnięte NEGATYWNIE.** Wracają jako propozycja, bo wyglądają na
oczywistą poprawkę — i dlatego stoją tu z nazwy.

| co | kiedy | uwaga |
|---|---|---|
| **OI-135** — kontur (obrys) postaci 3D | 2026-10-10, decyzja autora | przy ~150 px postaci i przy obrocie obrys się sypie, a postaci czytają się bez niego — „bardziej przeszkadza, niż pomaga". Kod zostaje (`STYL_POSTACI.kontur = 0`) |
| **P1-2 / `OI-35`** — łuk wokół zablokowanego wektora przy kęsie wilka („wilk trafia praktycznie zawsze") | 2026-09-08, decyzja autora | ⛔ **Nie implementować.** Narzędzie do naprawy istnieje — to nie jest powód, żeby jej dokonać |
| Dwie cechy tożsamości 2H zależne od obrony wroga | 2026-09-07 | wróg nie ma bloku ani parowania — `docs/decyzje/2026-09-07-obrona-wroga-nie-istnieje.md` |
| „Premia przeciw blokowi" dla 2H | 2026-09-05 | nie ma na co działać — `docs/konfiguracje_broni_checkpoint.md` §4.3 |
| Rekompensata za alternowanie w Dual Wield | 2026-09-05 | stara liczba „strata 17–43%" mierzona przed `swingMul`; DW daje dziś +16…18% dps |
| Naprawa kosztu alternatywnego tarczy **nerfem tarczy** | 2026-08-25 | świadoma decyzja autora — koszt ma wynikać z całego systemu ekwipunku |
| Pełny zestaw barierek („czego celowo NIE budujemy") | różne | `docs/odlozone.md` §5 |

---

## Zasady utrzymania tego pliku

1. ⚠ **Wiersz zawiera etykietę, nie opis.** Jeśli zaczyna tłumaczyć *dlaczego*,
   uzasadnienie należy do dokumentu z kolumny „gdzie".
2. ⚠ **Kanonicznym domem sprawy z domeny jest `## Otwarte` jej dokumentu
   `STAN`.** Ten plik tylko na niego wskazuje — i dlatego wolno mu być krótkim.
3. **Zamknięcie sprawy to trzy ruchy**: wiersz `## Otwarte` w `STAN`, pole
   `otwarte:` w nagłówku, przeniesienie wiersza **do `docs/issues_archive.md`**
   (dosłownie, z datą zamknięcia). W sekcji AKTYWNE nie zostaje nic ✅ —
   `doc_check` §Z2 świeci także na wierszu dłuższym niż 700 znaków.
4. ⛔ **Nie nadawaj nowych numerów `OI` kosmetyce.** Numer dostaje sprawa,
   o którą ktoś zapyta drugi raz.

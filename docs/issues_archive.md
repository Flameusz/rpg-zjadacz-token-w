---
typ: HISTORIA
domena: proces
tytul: Archiwum rejestru OI
stan: zywy
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-12
---

# Archiwum rejestru `OI`

> **Czym jest.** Sprawy ZAMKNIĘTE z `docs/zadania.md`, przeniesione tu
> **dosłownie** — z pomiarem, powodem i adresem. Szukasz numeru? `grep OI-133`
> trafi albo w rejestr (otwarte), albo tutaj (zamknięte). Tylko dopisywanie.
>
> ⛔ **Nic stąd nie jest otwarte.** Wpis zostaje po to, żeby sprawa nie wróciła
> jako „znaleziony problem". Nie otwieraj jej bez konkretnego sygnału z gry.
>
> Powód rozdzielenia (2026-10-11): sekcja AKTYWNE niosła 45 zamkniętych wierszy
> „dla adresu", więc odpowiedź na „co jest otwarte" wymagała czytania 60 KB.
> Reguła pilnująca: `tools/doc_check.mjs` §Z2.

---

## Zamknięte 2026-10-12

| id | rzecz | gdzie |
|---|---|---|
| OI-66 | ✅ **ZAMKNIĘTE 2026-10-12 decyzją autora**: „zadanie z celem porozmawiaj powinno dotyczyć rozmowy w danym temacie”. Cel `talk` ma pole `topic` i zalicza się po otwarciu tego tematu (także z archiwum), nie po otwarciu okna; temat do zadania stoi pierwszy ze złotym „!”, a gdy jest za bramką `after` — „!” dostaje temat, który go odsłania; hub pokazuje „temat do zadania”. Pięć celów przepiętych (Patryczek `reka`, Gniewko `czyje_owce`, Młynarz `bez_zboza`, Sobek `kola`, Zielarka `gdzie_szukac`); `rozmowy_przymiar` §Z8. Wcześniej: `cel „porozmawiaj" zalicza się w chwili otwarcia okna` | `docs/systemy/quests.md` §2 |
| OI-61 | ✅ **ZAMKNIĘTE 2026-10-12 decyzją autora**: zioła bez zastosowania zostają **towarem na sprzedaż** — „na tym etapie to planowanie zbędne”. Wcześniej: `lżejsza połowa: sześć ziół nie ma konsumenta odkrycia ani celu zadania` | `docs/systemy/gathering.md` |

---

## Zamknięte 2026-10-11 — po przeglądzie

| id | rzecz | gdzie |
|---|---|---|
| OI-95 | ✅ **ZAMKNIĘTE 2026-10-11** — zakładki kategorii w panelu postaci mają 48 j., jak w sklepie (`CategoryStrip.STRIP_H`); pasmo `FILTER_ROW_H` 46 → 52 w `src/ui/EquipLayout.ts` — przy 54 monitor 1920×1080 tracił rząd plecaka, przy 52 żaden ekran nie traci nic (`ekwipunek_uklad`). Dalej poniżej `minTouch` 68 — świadomie, zakładka jest szeroka. Sprawdzone renderem (891×411). Dawniej: przyciski filtra plecaka mają 40 j. wysokości przy normie 68 j. (48 dp) | `docs/decyzje/2026-09-11-ekwipunek-fundament.md` |
| OI-152 | ✅ **ZAMKNIĘTE 2026-10-11** (autor: nazwy mają pasować do gry i nie przytłaczać — „stalowe szyny nie brzmią jak przedmiot, który chcesz założyć”). Reguła: znany rzeczownik + najwyżej dwa przymiotniki, bez żargonu; ikona ma rację. Nogawice → **spodnie** (pikowane, skórzane, kolcze, lamelkowe, łuskowe, żelazne kolcze; półnogawice → **spodenki kolcze**), Szyszak → **Hełm stożkowy**, Nagolennice segmentowe → **Okute spodnie**, Nabiodrki z nagolennikami → **Pełne nagolenniki**, Półpłytowe → **Półstalowe buty** (autor; pierwsza wersja „Nakładki na buty” odrzucona), Skórzany ćwiekowany → **Kaftan ćwiekowany**; opisy bez „szyn” i „nogawic”. Id bez zmian — zapisy nietknięte. Dawniej: ⏳ **Nazwa/opis pancerza ↔ grafika rozjeżdżają się w trzech miejscach** (2026-09-28, odświeżenie ikon): „Szyszak” ma id i ikonę spangenhelmu; „nogawice” pikowane i kolcze są rysowane jako SPODNIE (regu | `docs/gemini_armor_icons.md` §4.1, §7.1, §8.1, §9.0 |

---

## Zamknięte w przeglądzie rejestru 2026-10-11 (decyzja autora, hurtem)

Propozycja: `docs/dziennik.md` 2026-10-11 (24), grupa A.

| id | rzecz | gdzie |
|---|---|---|
| OI-3 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — checkpointy w korzeniu zostają jako `HISTORIA` z banerem; cytują je komentarze w kodzie. Dawniej: pięć `PROJECT_CHECKPOINT_*.md` w korzeniu repo, poza `docs/` | `PROJECT_DOCS_CHECKPOINT.md` |
| OI-30 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — duplikat długu D1 w `docs/systemy/proficiency.md` (asymetria zaakceptowana). Dawniej: krytyk po stronie wroga nie wynika z biegłości — dług spójności semantycznej | `docs/systemy/proficiency.md` |
| OI-41 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — `N-5` zostaje wskazówką projektową bez metryki (`docs/systemy/weapons.md`). Dawniej: `N-5` jest nieweryfikowalny w swoim brzmieniu | `docs/systemy/weapons.md` |
| OI-11 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — kosmetyka dokumentacji, nikt o nią nie zapytał od 2026-09-05. Dawniej: numeracja `N-n` globalna, a domeny rozłączne | `docs/proces/ekstrakcja_items.md` §5 |
| OI-15 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — świadome ograniczenie przymiaru — komentarza w kodzie nie da się tanio sprawdzić. Dawniej: nie sprawdzamy, czy komentarze w kodzie nie kłamią o kodzie | `docs/proces/ekstrakcja_attributes.md` §6 |
| OI-37 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — po przepisaniu §11 kontrakt jest zwykłym ostrzeżeniem rozmiaru — scalone z `OI-84`. Dawniej: `DOC_CONTRACT.md` jest strukturalnie pełny (~9 bajtów zapasu) | `docs/DOC_CONTRACT.md` §8 |
| OI-74 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — `performance` jest przekrojem, nie domeną — rozstrzygnięte 2026-09-06. Dawniej: `performance` na liście domen, a nigdy nie dostanie `STAN`-u | `docs/proces/ekstrakcja_performance.md` |
| OI-39 | ✅ **ZAMKNIĘTE 2026-10-11** (przegląd rejestru, decyzja autora) — autor gra w grę na bieżąco — pytanie, czy playtest się odbył, nie ma wartości. Dawniej: nie da się ustalić, czy playtest celowania się odbył | `docs/systemy/abilities.md` |

---

## Zamknięte — przeniesione z sekcji AKTYWNE (2026-10-11)

### BUG (15)

| id | rzecz | gdzie |
|---|---|---|
| OI-107 | ✅ **ZAMKNIĘTE 2026-09-18** — obie bramki liczą dziś **19 adresów i 11 miejsc**; stałe poprawione, `warstwy_przymiar` i `zestawy_przymiar` zielone. ⚠ Przy okazji naprawiono trzecią fałszywą bramkę: `katalog_ekwipunku` porównywał bloki z LF w pliku o CRLF, więc `doc_check` §T był czerwony przy **zerowym** rozjeździe treści | `docs/pancerz_checkpoint.md` |
| OI-125 | ✅ **ZAMKNIĘTE 2026-09-19** — nie było czego rozstrzygać: „3 rzędy zamiast 4" brało się z podniesionego rzędu (`rowH` 70), a nie z pełnej skali ikon. Półka kupca układa dziś **gabaryt** jak plecak (`packShelf`), rząd wrócił na 46 j. i widocznych rzędów jest znowu cztery | `docs/tarcze_grafika_checkpoint.md` §2 |
| OI-128 | ✅ **ZAMKNIĘTE 2026-10-01** — reguła autora: broń > 45 cm = 1×2 | `docs/systemy/inventory.md` §11 |
| **OI-146** | ✅ **ZAMKNIĘTE 2026-10-09** (decyzja autora: „skakanie między pozycjami w walce wygląda dziwnie”) — zamach **na stojąco** przepisuje `zwrotRad = attackRad` (`Player.triggerAttack`); w marszu rozdział zostaje. Zmierzone w silniku: cel pod 40°, zwrot/osłona przed 0°, po pierwszym ciosie 40° i tak już między ciosami; cel za plecami (179°) — 0 zamachów, bramka nietknięta. ⏳ Otwarte jako osobne pytanie: ciągłe zwracanie się do stargetowanego zagrożenia BEZ ciosu (koliduje z decyzją 2026-08-23). ⚙ **ODŁOŻONE przez autora 2026-10-09:** decyzja 08-23 zapadła w epoce 2D i ataku 4-kierunkowego — wraca do oceny po wdrożeniu 3D, nie wcześniej; warianty A/B/C w dzienniku 2026-10-09 (2) | `src/entities/CLAUDE.md` („Zwrot postaci…”) |
| **OI-147** | ✅ **ZAMKNIĘTE 2026-09-27 — wariant A wdrożony.** To był PIERŚCIEŃ EFEKTU, nie hitbox (autoatak trafia po celu + zasięgu + bramce zwrotu). `heading` w `triggerAttack` idzie za `attackRad`; wypad i pierścień mają jeden wektor. Zmierzone na żywo: różnica pierścień↔`attackRad` **0°** na 8 kątach. Prawdziwy rozjazd (celowanie duszek→duszek, do 36,7°) naprawiony 2026-09-23 | `docs/postac3d_historia.md` §36 |
| **OI-148** | ✅ **ZAMKNIĘTE 2026-09-27 (wycofanie 4 kierunków, etap 1).** `facingVector` liczy się z ciągłego `zwrotRad`; Szerokie cięcie bez celu, Wypad bez celu i intencja domyślna idą co do 0,1° za zwrotem (na żywo, 6 kątów). Ślad pudła — za kątem CIOSU | `docs/postac3d_historia.md` §38 |
| **OI-149** | ✅ **ZAMKNIĘTE 2026-09-27 (etap 1).** Unik bez drążka leci wzdłuż `zwrotRad` (na żywo, 6 kątów, 0,0° odchyłki) | `docs/postac3d_historia.md` §38 |
| **OI-150** | ✅ **ZAMKNIĘTE 2026-09-27.** Wir ostrzy woła `aimAttackAlongMovement()` przed `triggerAttack`, więc poza, model i osłona idą za ZWROTEM postaci, nie za poprzednim ciosem. Zmierzone przez prawdziwą ścieżkę umiejętności: **5/5** kombinacji (np. poprzedni cios 90°, zwrot 270° → model i osłona 270°; przed poprawką 90°, czyli tarcza na plecach) | `docs/postac3d_historia.md` §36.3 |
| OI-129 | ✅ **ZAMKNIĘTE 2026-09-19** — rozwiązała to SYLWETKA: 11 kafli zamiast 19, kafel **70 j.** (≥ norma 68) ⛔ Nie wracaj do tabeli `część ciała × L1/L2/L3`: warstwy nie są slotami widocznymi dla gracza | `docs/decyzje/2026-09-19-ekran-handlu-przebudowa.md` §2.2 |
| OI-133 | ✅✅ **ZAMKNIĘTE 2026-09-21 — cofnięcie jest operacją ATOMOWĄ** (decyzja autora). Albo wykonuje się w całości (przedmiot wraca · złoto się zgadza · cofnięcie ZUŻYTE), albo **nie rusza niczego**: transakcja zostaje do ponowienia, a gracz dostaje konkretny powód. Wdrożone dla wszystkich **trzech** ścieżek — brak miejsca · brak złota · nieudane `takeBackBought`. ⭐ O miejsce pyta `Inventory.hasRoomFor` (świadome GABARYTU), nie licznik wolnych pól; doszedł nie-mutujący `canTakeBack`. ⚠ **Świadomy koszt:** zakup rzeczy już zużytej jest nieodwracalny na zawsze, a przycisk „Cofnij" zostaje i powtarza odmowę — dawny kod kupował brak tego przycisku ceną milczenia we wszystkich trzech ścieżkach. Bramka: `tools/sklep_cofniecie.mjs` §5 (11 asercji, sabotaż 6/6) | `docs/systemy/inventory.md` §9 |
| OI-130 | ✅ **ZAMKNIĘTE 2026-10-11** (decyzja autora: „przygaszanie to nie najlepszy sposób filtrowania”) — ZAKŁADKI KATEGORII nad półką kupca (filtr prawdziwy) i nad plecakiem w sklepie i w panelu (WIDOK filtrowany, `Inventory.slots` nietknięte, przestawianie tylko w „Wszystko”). `ItemCategory.ts` + `CategoryStrip.ts`; bramki `tools/filtr_przymiar.mjs`, `sklep_uklad` §F2 (sabotaż świeci) | `src/ui/CLAUDE.md` („Filtr = zakładki…”) |
| OI-136 | ✅✅ **ZAMKNIĘTE 2026-09-20 (A6.1).** Kąt noszenia miecza `16° → 30°` (`tools/char3d_weapons.py`) — zapas 0,46 j. pod limitem, zamiast 0,16 j. ponad nim. ⭐ Przyczyną NIE była poza niesienia ani model miecza: `NIESIENIE_1H` trzyma dłoń na STAŁYM Z na każdej klatce, ale więz IK nie kontroluje OBROTU kości, więc nadgarstek wychodzi raz pod 65,8°, a raz pod **80,7°**. ⚠ Przy okazji naprawiona **ślepa plama bramki**: kolumna „bezruch" mierzyła klatkę 0 akcji ATAKU (gotowość bojową) zamiast klatki `BEZRUCH` klipu `Walk_Armed`, więc nie potrafiła zaświecić dla pozy, którą gracz widzi na co dzień | `docs/handoff_2026-09-20_fundament_postaci.md` §3h |
| OI-52 | ✅ **ZAMKNIĘTE 2026-10-09** — ognisko klawiatury `src/ui/KeyFocus.ts` | `docs/systemy/input.md` |
| OI-58 | ✅ **ZAMKNIĘTE 2026-10-09** — reszta zostaje na ziemi (`Loot.take`) | `docs/systemy/inventory.md` |
| OI-62 | ✅ **ZAMKNIĘTE 2026-10-09** — zakładka zapisywana także przy zebraniu | `docs/systemy/gathering.md` |

### IMPLEMENTATION (9)

| id | rzecz | gdzie |
|---|---|---|
| OI-137 | ✅ **ZAMKNIĘTE 2026-09-27 — nieaktualne od A4 (2026-09-20).** Zmierzone w Blenderze na kopii pliku: 42 z 44 kluczy steruje siatką, kośćmi albo strefą ust; martwe tylko `masa_kg` i `bark_polszerokosc`, oba celowo OPISOWE. Pierwotne brzmienie: **14 kluczy `PROPORCJE` w `char3d_base.py` NIC NIE ROBI** — tabele pierścieni tułowia i nogi mają liczby wpisane wprost, więc `klatka_polszer`, `talia_polszer`, `udo_promien`, `szyja_promien` i dziesięć innych są martwe. ⛔ Pułapka: „poszerzam klatkę i nic się nie dzieje”. Do podpięcia, **zanim** ktokolwiek nazwie ten plik generatorem parametrycznym | `docs/postac3d_historia.md` §3 |
| OI-98 | ✅ **ZAMKNIĘTE W CAŁOŚCI 2026-09-15** — model C (adres = slot + warstwa) **plus** `setProgressFor` po regule `(set, area)`. ⛔ Nic tu nie zostało otwarte | `docs/decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md` |
| OI-102 | ✅ **ZAMKNIĘTE 2026-09-15** — trzy pętle chodzą po `EQUIP_SLOTS` (**19 adresów** od 2026-09-16), więc sumują warstwy bez zmiany własnej logiki. ✅ Zweryfikowane 28/28 konfiguracji 2026-09-18 | `docs/decyzje/2026-09-12-taksonomia-pancerza.md` D3 |
| OI-38 | ✅ **ZAMKNIĘTE 2026-10-11** — `tools/katalog_umiejetnosci.mjs` → `docs/umiejetnosci_katalog.md` (parametry, nauka, poziomy, siatka ról) | `docs/systemy/abilities.md` |
| OI-45 | ✅ **ZAMKNIĘTE 2026-10-11** — `tools/katalog_postepu.mjs` → `docs/postep_katalog.md` (krzywa, pula map, nagrody, ujścia) | `docs/systemy/progression.md` |
| OI-47 | ✅ **ZAMKNIĘTE 2026-10-11** — `tools/katalog_stworzen.mjs` → `docs/stworzenia_katalog.md` (roster, siatka ról, kanały obrażeń) | `docs/systemy/creatures.md` |
| OI-53 | ✅ **ZAMKNIĘTE 2026-10-11** — `hud_uklad.mjs` §7 (strefa drążka) i §8 (budżet palców) | `docs/systemy/input.md` |
| OI-56 | ✅ **ZAMKNIĘTE 2026-10-09** — `core/Settings`: Dźwięk / Odgłosy tła (menu główne + zakładka ZAPIS) | `docs/systemy/audio.md` |
| OI-79 | ✅ **ZAMKNIĘTE 2026-10-11** — `node tools/assety_przymiar.mjs` (326 plików z konfigu, w tym dźwięki); gra dalej degraduje cicho | `docs/systemy/assets.md` |

### DESIGN (8)

| id | rzecz | gdzie |
|---|---|---|
| **OI-141** | ✅✅ **ZAMKNIĘTE 2026-09-20 tego samego dnia — ROZPUŚCIŁO SIĘ przy korekcie kryterium.** Powstało przy `chwyt −1,16`, dobranym pod „minimalne przenikanie". Po korekcie autora (tarcza niesiona przy boku MA nachodzić na obrys) wartość zmieniono na **−0,85**, a wtedy GUARD spadł z 0,460 do **0,164 j.** (8% tarczy w ciele). ⭐ Lekcja: `chwyt` jest WSPÓLNY dla CARRY i GUARD, więc odsuwanie tarczy dalej poprawia jedną pozę i psuje drugą | `docs/handoff_2026-09-20_fundament_postaci.md` §3i |
| **OI-140** | ✅✅ **ZAMKNIĘTE 2026-09-21 (A6.3).** `Protection.guardAngleDeg` przyjmuje teraz `Direction` **albo ciągły kąt** (`GuardFacing`); `Player.guardKat` niesie zwrot osłony regułą przepisaną z `guardDir`, a `GameScene.canStrikeFacing` czyta `zwrotKat`. ⭐ Pomiar, który to uzasadnia: stojąc na NE (model 135°) cios z N — 45° od tego, w co postać JAWNIE patrzy — **nie był blokowany** (ćwiartka dawała równo 90°, poza łukiem); dziś jest, a łuk 90° jest symetryczny wokół realnego zwrotu. ⛔ `FRONT_ARC_DEG` nietknięte; podanie `Direction` daje wynik bit-w-bit jak przedtem, stąd regresja 121/121 bez różnic. ⏳ Poza ataku (`attackDir`) zostaje czterokierunkowa — świadomie, to osobna decyzja | `docs/handoff_2026-09-20_fundament_postaci.md` §3j |
| OI-112 | ✅✅ **ZAMKNIĘTE 2026-09-18 — powstała kategoria 1.5H.** Bastard, włócznia i widły deklarują `hands: 2` **oraz** `grip: "either"`; chwyt jest WYPROWADZANY ze stanu drugiej ręki (pusta → pełny profil, zajęta → derogacja). ⭐ Pytanie, które blokowało — *czym staje się tożsamość 2H* — rozstrzygnięte: **linia katalogowa półtoraka JEST jego profilem oburęcznym**, więc `§Y1–Y3` nie wymagały przeformułowania i zostały zielone. ⛔ Bez przełącznika, bez pola w zapisie, bez kary do tempa | `docs/decyzje/2026-09-18-kategoria-1-5h.md` |
| OI-142 | ✅ **ZAMKNIĘTE 2026-09-21** — powstał `docs/checkpoint_2026-09-21.md` i to on jest bieżącym punktem wejścia; `CLAUDE.md` i `docs/README.md` na niego wskazują, a `checkpoint_2026-09-17.md` został zdegradowany z zachowaniem swojego zakresu. ⛔ Starych checkpointów nie usunięto | `docs/checkpoint_2026-09-21.md` |
| OI-24 | ✅ **POMIAR WYKONANY 2026-09-16** (prawdziwe `Equipment`, komplet 13 elementów + tarcza): kanał PANCERZA dobija **dokładnie do capu 0,75 już przy jakości 4** (161,7 pkt), a ŁĄCZNA mitygacja wychodzi **91,8% ze sprzętu Z PÓŁKI** i 94,2% teoretycznie — bo tarcza mnoży się PO capie. ⚠⚠ **Cap zdejmuje tylko 0,5–0,9 pp** — na tym poziomie punktów ogranicza KRZYWA, nie sufit. ⛔ W swoim kanale cap jest NIE DO OBEJŚCIA (zamki §C: pełny sprzęt Q7 × cztery typy obrażeń). ⏳ Otwarte zostaje pytanie PROJEKTOWE: czy łączna mitygacja ma dostać wspólny sufit — **decyzja, nie pomiar** | `docs/decyzje/2026-09-15-zakres-pp-i-capu.md` §5 |
| OI-51 | ✅ **ZAMKNIĘTE 2026-10-11** (autor: „zajmij się przy okazji polityką zapisu") — niezgodny zapis się MIGRUJE (`MIGRACJE`, `migruj`), a niewczytywalny idzie do kopii przed nadpisaniem; przymiar §G/§H | `docs/systemy/save.md` §2 |
| OI-76 | ✅ **ZAMKNIĘTE 2026-10-11** — ostrzeżenie silnika zbierane w `dev.mapWarnings()` | `docs/systemy/world.md` |
| OI-81 | ✅ **ZAMKNIĘTE 2026-10-09** — `docs/architektura.md` jest `HISTORIA` z następcą od 2026-09-07; nikt nie cytuje go jako reguły | `docs/systemy/architecture.md` |

### CONTENT (8)

| id | rzecz | gdzie |
|---|---|---|
| **OI-153** | ✅ **ZAMKNIĘTE — wykonane 2026-10-05, w rejestrze odnotowane 2026-10-11.** Wszystkie 11 ikon ziół z arkuszy Gemini A/B rysuje `tools/build_herb_icons.py` (`public/assets/README.md` „Zioła — jedenaście ikon”). Wiersz został otwarty przez pomyłkę: bliźniaczy `OI-154` zamknięto tego samego dnia, ten nie. Dawniej: ⏳ **Ikony ZIÓŁ — odświeżenie całej jedenastki** (plan 2026-10-02; ✅ prompty gotowe 2026-10-05). 5 istniejących jest ciemnych i do siebie podobnych (rumianek ≈ krwawnik), 6 stoi na plamce koloru. Dwa arkusze Gemini (A: żółte i białe — 6, B: liście i fioletowe — 5 + kotwica, **tło cyjan**), gałązka po… | `docs/gemini_item_icons.md` §3.6 |
| **OI-154** | ✅ **Ikony BIŻUTERII, kła Szarego, JEDZENIA i SUROWCÓW — wpięte 2026-10-05** (`tools/build_misc_icons.py`, 18 ikon; gruczoł jadowy z ponowionego arkusza v2). 155/155 przedmiotów ma własną ikonę. ⏳ Zostaje wyłącznie ocena autora w grze | `docs/gemini_item_icons.md` §4.4, §5.4, §6.4–§6.6 |
| **OI-114** | ✅ **ZAMKNIĘTE 2026-09-30** — widły mają własną ikonę 32×64 (dwa żelazne zęby w U, `tools/build_polearm_icons.py`); kafel `(2,5)` z `items.png` został ścieżką awaryjną. ⚠ Opis „okuty drąg przy 17,6 px" dotyczył rigu 2D, który jest legacy | `docs/gemini_weapon_icons.md` §11 |
| **OI-106** | ✅ **ZAMKNIĘTE 2026-10-11** (decyzja autora: „na razie wszystko do sklepów”) — 127/127 sztuk ekwipunku ma źródło; reguła ETAPU TESTÓW: każda broń i pancerz stoi w sklepie, łup z wroga = to, co miał na sobie, rzadko i zniszczone. Bramka `tools/dystrybucja_przymiar.mjs` (sabotaż świeci) |
| **OI-121** | ✅ **ZAMKNIĘTE 2026-10-11** (decyzja autora) — Buty piechura PP 4 → 6; Rękawice pikowane `buyPrice` 18 / `sellPrice` 7 (18 stało jako cena sprzedaży) |
| **OI-122** | ✅ **ROZSTRZYGNIĘTE 2026-09-18 — konfiguracja DOZWOLONA ŚWIADOMIE.** „1.5H może być używana jako broń główna jedną ręką i może współistnieć z dozwoloną bronią 1H w drugiej ręce. Jest to świadomie dozwolona konsekwencja modelu chwytu i istniejących zasad dual wield, a nie osobny archetyp wyposażenia.” ⛔⛔ **1.5H NIE JEST kategorią „broń + tarcza”** — chwyt pyta wyłącznie, czy druga ręka jest ZAJĘTA; tarcza jest jednym z jej użyć. ⛔ **Żadnej osobnej kary „bo konfiguracja jest nietypowa”** — koszt liczą mechanizmy, które już są: `oneHanded`, `offhandSwingMul`, wymagania i masa obu broni, biegłość per ręka. ⏳ Zachowana MOŻLIWOŚĆ projektowa (nie zobowiązanie): silniejszy albo lepiej wyszkolony gracz może kiedyś efektywnie używać konfiguracji nieopłacalnej dla słabszego — ⛔ bez nowego systemu biegłości i bez nowych premii teraz. Bramka: `tools/rece_przymiar.mjs` §H8 | `docs/decyzje/2026-09-18-kategoria-1-5h.md` §7 |
| **OI-123** | ✅ **ZAMKNIĘTE 2026-10-01 — REGUŁA autora:** „gabaryt 1×2 mają mieć też bronie — to nie wyjątek, to reguła; łatwiej rysować duże i średnie bronie na dwóch kratkach". Dziś: tarcze migdałowe, legionowe i pawęże, drzewcowe, wszystkie miecze i topory od siekiery (34 szt.); **1×1 tylko do ~45 cm** — sztylety i toporek (doprecyzowanie autora 2026-10-02). ⭐ **Gabaryt wynika z IKONY KONSTRUKCJI** (32×64 ⟺ 1×2) — pilnuje `gabaryt_przymiar` §A na plikach PNG, nie na deklaracjach. ⚠ Przypisanie nadal jest polem na przedmiocie, nie wyprowadza go kod | `docs/systemy/inventory.md` §11 |
| **OI-124** | ✅ **ZAMKNIĘTE 2026-10-01 — i było ŻYWYM BŁĘDEM, nie tylko długiem.** `equipFromBag` zakładał wymianę jeden na jeden i ignorował wynik `addInstance`: sztylet za miecz `1×2` (albo puklerz za pawęż) przy pełnym plecaku zwracał `true`, a zdjęta rzecz **znikała** — od pierwszych tarcz 1×2 (2026-09-19). Naprawa: `Inventory.canFitAll` (symulacja first-fit z polami zwolnionymi przez zakładaną rzecz) + `Equipment.returningFor` (ta sama kolejność w sprawdzeniu i wykonaniu); odmowa dla KAŻDEGO slotu, z komunikatem. Bramka: `gabaryt_przymiar` §K (7 przypadków, dwa czerwone bez naprawy). ⚠ `tryReturnBag`/`bagUnequipRefusal` liczą dalej sztuki — poprawnie, bo torby są 1×1, a granicę pilnuje `canSetCapacity` po przykryciu | `docs/systemy/inventory.md` §11 |
| OI-55 | ✅ **ZAMKNIĘTE 2026-10-09** — pliki są, zgodność pilnuje `tools/audio_przymiar.mjs` | `docs/systemy/audio.md` |

### DOCUMENTATION (6)

| id | rzecz | gdzie |
|---|---|---|
| OI-173 | ✅ **ZAMKNIĘTE 2026-10-11** — `docs/systemy/world.md` §4.1 opisuje otwarty świat (`WorldComposer`, adres obszaru przeżywa, degradacja), `docs/systemy/ui.md` §6.1 — minimapę jako jedyne wejście do panelu na telefonie | `docs/systemy/world.md`, `docs/systemy/ui.md` |
| OI-23 | ✅ **ZAMKNIĘTE 2026-10-09** — A-9: kierunek `ARMOR_PROFILE` w `src/entities/CLAUDE.md` poprawiony; A-14: `katalog_ekwipunku.mjs` porównuje lustra z prawdziwym `Protection` (401 próbek + 4 profile × 4 typy), sabotaż świeci na czerwono | `docs/proces/ekstrakcja_armor.md` |
| OI-31 | ✅ **ZAMKNIĘTE 2026-10-09** — komentarz poprawiony | `docs/systemy/proficiency.md` |
| OI-32 | ✅ **ZAMKNIĘTE 2026-10-09** — komentarz przy `SHIELD` poprawiony | `docs/systemy/combat.md` |
| OI-65 | ✅ **ZAMKNIĘTE 2026-10-11** — przymiar `node tools/rozmowy_przymiar.mjs` (R1–R5, Z1–Z6, N1); świeci na literówce w bramce | `docs/systemy/quests.md` |
| OI-75 | ✅ **ZAMKNIĘTE 2026-10-09** — komentarze o siatce nawigacji poprawione | `docs/systemy/world.md` |

---

## Zamknięte w sesjach 2026-08-31 … 2026-10-10 (dawna sekcja rejestru)


⛔ **Nie otwierać ponownie bez konkretnego sygnału z działającej gry.**
Wpisy zostają wyłącznie po to, żeby nie wróciły jako „znaleziony problem".

| co | kiedy | ślad |
|---|---|---|
| **OI-134** — baza postaci 3D **V5 = MASTER** (decyzja autora: „na razie nic lepszego nie wyczarujemy"); humanoidalni wrogowie odblokowani na tej bazie. ⛔ Nie podnosić jakości bazy bez nowego narzędzia albo materiału — granica jest świadoma | 2026-10-10 | `docs/postac3d_checkpoint.md` (baner), `docs/postac3d_historia.md` dopisek (36) |
| **OI-155** — ikony toreb rysowane w stylu skórzanego ekwipunku (`tools/build_bag_icons.py`: rampa skóry `wood_palette.py`, kontur 4-sąsiedni, każda torba ze swoim znakiem); wiersz wisiał jako otwarty do 2026-10-05 | 2026-10-04 | commity `ab69ca0`, `d3c6aa9`, `09cad3f`; komentarz `ASSETS.iconBag1` |
| **OI-138** — skala lokomocji: lokomocja grana jako BIEG (`tools/char3d_run.py`, 13 wariantów z bronią/tarczą), przejście chód→bieg 85–125 px/s, tempo klipu = prędkość/120 (bieg ×1,25, sprint ×2,0) | 2026-10-03 | `docs/dziennik.md` 2026-10-03 (8) |
| **OI-160** — rozmiar `char.glb` przy pancerzu: kopie bez `Subdivision` (~71 → ~27 KB na sztukę); cały katalog 55 sztuk = 1,89 MB pliku (było 1,1 MB bez pancerza) | 2026-10-03 | `docs/dziennik.md` 2026-10-03 (7) |
| **OI-151** — klip ciosu 3D grał 2–3× w jednym zamachu: start na ZBOCZU (`Player.zamach.od`), zmierzone 1× dla 130–880 ms | 2026-10-03 | `docs/dziennik.md` 2026-10-03 (4) |
| **OI-118** — tempo klipu ciosu z `swingDurationMs` (cięcie w chwili trafienia, dolna granica 240 ms): Ciężkie uderzenie +4 ms, Uderzenie tarczą +8 ms | 2026-10-03 | `docs/dziennik.md` 2026-10-03 (4) |
| **OI-156** — tarcze 3D ×1,65 za duże (skala armatury): obiekt kompensuje skalę, `SKALA_GRY` 1,0 — wymiar historyczny 1:1 jak broń; zasłona głowy okrągłej 0% | 2026-10-03 | `docs/dziennik.md` 2026-10-03 (4) |
| **OI-109** — 26 z 37 broni bez modelu 3D (pusta dłoń): cały roster z `tools/weapon_shapes.py`, bramka komplet + grunt + chwyt + RAMA | 2026-10-03 | `docs/dziennik.md` 2026-10-03 (2) |
| **P0-1** — ruch i AI w przestrzeni ciał (`MoveIntent → PathSolver → SteerSolver → DirectSolver`) | 2026-08-31 | `docs/dziennik.md` 2026-08-31 (4)–(6) |
| GreyWolf — siedlisko połączone z lasem; Bear — główny bród | 2026-08-31 | `docs/dziennik.md` 2026-08-31 (9), (10) |
| Las — ART / WORLD DESIGN | 2026-08-31 | `docs/forest_rebuild_scope.md` |
| **P0-2** — zasięg w Dual Wield: zasięg należy do POSTACI, nie do ręki (zastój autoataku) | 2026-09-07 | `src/scenes/GameScene.ts` → `offhandStrike()` |
| **P1-1** — stara geometria zasięgu; `macierz_walki.md` usunięty jako zastały snapshot | 2026-09-07 | `docs/decyzje/2026-09-07-prog-zasiegu-orbity.md` |
| **OI-103 + OI-101** — model obciążenia: **Model D, dwie osie**; oś wysiłku bez sufitu. ⛔ Nie wracać do Modeli A/B/C ani do osi liniowej | 2026-09-15 | `docs/decyzje/2026-09-15-obciazenie-dwie-osie.md` |
| **OI-96** — schowany zestaw (`weapon2`/`offhand2`) waży **100% masy**. ⛔ Bez `stowedWeightFactor`, bez wyjątku; ⛔ plecak BEZ ZMIAN | 2026-09-15 | `docs/decyzje/2026-09-15-masa-schowanego-zestawu.md` |
| **OI-17 + OI-48** — ile kanałów dotyka obciążenie i czy rusza prędkość: **CZTERY kanały, prędkość TAK** | 2026-09-15 | `docs/systemy/stamina.md` §6 |
| **OI-104** — wdrożenie Modelu D: trzy kanały + masa `STOW_SLOTS` + `ARMOR_TRAINING` + naprawa inwersji `lightLoadBonus`. ⭐ Kształt naprawy uniku **zaakceptowany przez autora po review** (ciągła zależność od masy, bez Siły, bez nowych parametrów) | 2026-09-15 | `docs/systemy/stamina.md` §6, `tools/obciazenie_przymiar.mjs` |
| Sylwetka gracza za koronami drzew | 2026-09-07 | `src/core/PlayerSilhouette.ts`, `tools/occlusion_weryfikacja.mjs` |
| `OI-2` — `zaimplementowane.md` przestało być checklistą stanu gry | 2026-09-07 | `docs/decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md` |
| `OI-4` — `docs/` wolno mieć podkatalogi | 2026-09-05 | `docs/decyzje/2026-09-05-struktura-docs.md` |
| `OI-6` — `src/*/CLAUDE.md` poza kontraktem, ale pod przymiarem | 2026-09-05 | `docs/decyzje/2026-09-05-instrukcje-przy-kodzie.md` |
| `OI-7` — niestabilny wynik `katalog_ekwipunku.mjs` **nie odtwarza się** | 2026-09-07 | `PROJECT_DOCS_CHECKPOINT.md` |
| `OI-8` — `N-7` nie był złamany, tylko niedookreślony | 2026-09-06 | `docs/systemy/armor.md` §5 |
| `OI-9` — `size` tarczy: zero czytelników, czterech kandydatów odmówiło | 2026-09-06 | `docs/systemy/shields.md` |
| `OI-61` — **cięższa połowa**: sześć ziół dostało wpis przedmiotu | 2026-09-06 | `docs/dziennik.md` 2026-09-06 (2) |
| `OI-63` — **pierwsza połowa**: `tools/gathering_kompletnosc.mjs` | 2026-09-06 | j.w. |
| Odchudzenie dokumentacji walki — 27 dokumentów | 2026-09-07 | `docs/decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md` |
| Klasyfikacja całego `docs/` — nagłówek maszynowy w każdym pliku | 2026-09-07 | `PROJECT_DOCS_CHECKPOINT.md` |
| **OI-125** — „półka kupca pokazuje 3 rzędy zamiast 4": objaw podniesionego rzędu, nie cena ikon. Kolumna kupca układa dziś **gabaryt** (`packShelf`), rząd wrócił na 46 j., rzędy znowu cztery. ⛔ Nie podnoś `rowH` pod wyższą ikonę | 2026-09-19 | `docs/tarcze_grafika_checkpoint.md` §2 |

---

---

## Pełne brzmienie wierszy przyciętych 2026-10-11

Sprawy OTWARTE, których wiersz urósł w opis (> 700 znaków). W rejestrze
została etykieta; tu — stan wiersza z dnia przycięcia, słowo w słowo.

| id | rzecz (pełne brzmienie z 2026-10-11) | gdzie |
|---|---|---|
| **OI-161** | ⏳ **ZWIERZĘTA 3D — CAŁY ROSTER WALCZĄCY W GRZE (dzik, wilk, Szary, królik, oba pająki, niedźwiedź, lis, jeleń), czeka na pomiar na telefonie** (2026-10-04). Rdzeń `tools/quad3d.py` + gatunki (`boar3d.py`, `wolf3d.py`) — siatki, szkielety i animacje NASZE, z referencji tylko liczby. ✅ Wspólny renderer (`Shared3D`), ✅ `Creature3D` (opcje na gatunek: skala, bufor, środek kadru), ✅ `Boar.stan3d()`, ✅ `Wolf.stan3d()` (dziedziczy Szary): wycie przy alarmie, kłus przy okrążaniu, skok wypadu, kęs, warkot w każdym zamachu. ✅ `Rabbit.stan3d()`: skok od nowa na każdym wybiciu, czujność, sploch (zryw → przyczajenie), ugryzienie rozjuszonego. Sprawdzone w grze na żywej watasze. ⏳ **Pomiar N stworzeń na S21 FE** (`dev.char3d.manekiny(n, "wolf")` + `dev.perf.watch(15)` + `dev.char3d.stworzenia()`). ✅ `Spider.stan3d()` (zamach → strzał, odwrót TYŁEM przodem do gracza), `VenomSpider.stan3d()` (groźba → kęs). ✅ `Bear.stan3d()` (wspięcie w zapowiedzi → zamach przez całą bezbronność, zwrot z zamrożonego kierunku). ✅ `Fox.stan3d()` (lis jest od 2026-10-04 przeciwnikiem — `OI-162`). ✅ `Deer.stan3d()` (jeleń jest od 2026-10-04 przeciwnikiem — `OI-163`); leśnej zwierzyny bez 3D już nie ma. ⚙ Blokada §7 zdjęta dla ZWIERZĄT; humanoidalni wrogowie czekają na `OI-134` | `public/assets/README.md` („Czworonogi 3D”); `src/render3d/Creature3D.ts` |
| **OI-162** | ⏳ **LIS — PRZECIWNIK „ucieka, aż uzna, że to nic nie daje”** (decyzja autora 2026-10-04): z dekoracji (`Critter`) w `Enemy` — `src/entities/Fox.ts`, `FOX` w `GameConfig.ts` (wyprowadzenie liczb tamże), 3D `tools/fox3d.py`. Zmierzone w silniku na `forrest.tmj` (36 pościgów): stępa → zwrot po 3,6–3,9 s, sprint ~2 s, stojący gracz — lis uchodzi. ⚙ **2026-10-05 BUG naprawiony** (zgłoszenie autora „lis ucieka cały czas”): tamten pomiar był na GOŁYM graczu, a próg zysku 45 px miał zapas 7–12 px — w zbroi (133/112 px/s) i przy niepełnym wychyleniu drążka każdy zryw był „udany”, zero zwrotu w 15 s. Drugi warunek bilansu `pursuitShare` 0,4 (wariant A, decyzja autora): goły / pół wychylenia / ciężki zestaw stępa → 3,6–4,1 s, sprint 2,3–2,6 s, stojący — lis uchodzi. Łup: jajka (bez Skórowania), skrawki skóry (ze Skórowaniem). ⏳ **CALIBRATION:** odbiór pościgu z ręki (czy 3–4 s to „uparł się”, czy „za krótko”). ⏸ **lis pod kurnikiem Dobka** (fabuła „złodziej jaj”) — **odłożone do cyklu dnia i nocy** (autor 2026-10-11: „lis w biały dzień nie podejdzie do kurnika, tylko wpada nocą”), `docs/odlozone.md` §4; ⏳ własna skóra lisa (wymaga ikony) — dziś skrawki jak z zająca | `docs/systemy/creatures.md` §2.4; `docs/dziennik.md` 2026-10-04 (3) |
| **OI-163** | ⏳ **JELEŃ — istota NEUTRALNA, która się broni** (decyzja autora 2026-10-04): z dekoracji (`Critter`) w `Enemy` — `src/entities/Deer.ts`, `DEER` w `GameConfig.ts`, 3D `tools/deer3d.py`. Nie atakuje pierwszy: płoszy się liczbami Fazy 1 fauny (przeniesionymi bez zmian); UDERZONY podchodzi, opuszcza poroże (560 ms) i bodzie (8–12 `pierce`) do zerwania pościgu. Zmierzone w silniku: stępa za nim przez 8 s — zero obrażeń, dystans trzymany ~60 px; po ciosie — bodnięcie co ~1,9 s; po odejściu — uspokojony. `Critter` usunięty (bez gatunków). ⏳ **CALIBRATION:** HP 70 / obrażenia / czy ma uciekać przy niskim HP (dziś walczy do końca). ⏳ **CONTENT:** dziczyzna i skóra jelenia (wymagają ikon) — dziś strzępy skóry pod Skórowaniem | `docs/systemy/creatures.md` §2.4; `docs/dziennik.md` 2026-10-04 (4) |
| **OI-164** | ⏳ **PROTOTYP „świat w 3D” — czeka na BRAMKĘ na S21 FE** (2026-10-04). Rozgrywka 2D bez zmian, obraz w jednej scenie three.js (`src/render3d/WorldView3D.ts`, `?widok3d` / build `VITE_WIDOK3D=1`). Pulpit: 10,4 / 14,4 ms (p50/p95) wobec 11,1 / 15,1 ms w 2D, ~1,3–1,7× więcej gruntu w pionie. ✅ **BRAMKA ZALICZONA na S21 FE (2026-10-04, zmierzone):** las, zapis autora (poz. 27), 15 s × 2 próby — **119 FPS** (ekran 120 Hz), p50 8,3 ms, p95 8,4 ms, p99 8,5 ms, 2 klatki > 33 ms. Pomiar przez `adb` + DevTools Protocol (rAF), bo build na telefon nie ma `window.dev`. ⭐ **KIERUNEK: kamera A — stała kamera 3D (LoL / Wild Rift), rozgrywka 2D bez zmian, Tiled zostaje edytorem** (decyzja autora 2026-10-04; ⛔ swobodna kamera odrzucona — przekreśla celowanie z rodziny LoL). ✅ **Wioska, rzeka, domy i NPC-e w 3D (2026-10-04 (11)):** budynki i drzewa z warstw kafli stają jako billboardy, pikselowi NPC-e i rekwizyty sortują się z bryłami, podpisy nad głowami. ⏳ Pomiar wioski na S21 FE (APK zainstalowany, telefon był zablokowany). ⚠ Pierwsze „płynnie” było starym APK 2D (`gradlew assembleDebug` NIE instaluje — `adb install -r`). ⚠ Na telefonie wyszło, że HUD był POD światem 3D (płótno `absolute` przykrywa statyczne) — naprawione z-indexem ⏳ **DESIGN:** kąt kamery (35/40/45°) i zoom. ⚙ **Drzewa → modele 3D, styl Wild Rift (decyzja autora 2026-10-05):** `tools/tree3d.py` → `src/render3d/Trees3D.ts`, 13 gatunków; las 1017/1017, Zagaje 284/284, Gęstwina 476/476 (drzewa z kafli po dolnym kaflu `Nature`). ✅ **S21 FE z modelami (2026-10-05 (6)):** postój 119,8 FPS / p95 8,4 ms (wieś i las), marsz w lesie 110,6 FPS / p95 16,7 ms, zero klatek > 17 ms. `trees.glb` 1,37 MB (meshopt, 78 kształtów). ⚙ **Rekwizyty 3D (2026-10-05 (7)):** krzewy, kamienie, zioła (`tools/props3d.py`), las **1030/1032** (dokończony 2026-10-05 (8): flora wodna, pniaki, drewno, drobiazgi); ⏳ rekwizyty wsi; ⏳ pomiar S21 FE z pełnym lasem. ⚙ **Zasłony (2026-10-05 (9)):** stały okrąg prześwitu zastąpiony bladnięciem CAŁEGO obiektu, który naprawdę zakrywa tułów (`ZASLONY_3D`); ⏳ odbiór z ręki na telefonie. ✅ **2026-10-06: widok 3D DOMYŚLNY** (2D: `?widok2d`); zrobione z listy „przed decyzją tak”: tap w cel (obszar trafienia rozciągany od stóp), napisy/paski (×1/sinθ na czas rysowania), woda (shader). ⏳ Zostaje: wieś w 3D (grunt, rekwizyty, domy), ognisko, chata Myśliwego. ⚙ **2026-10-06 (2):** wieś — leśny grunt (ForestGround/ForestTransitions), kępki i krzaczki z kafli jako modele, stóg/strach/ule/ławki/beczki/koryta/płot w 3D; woda we wsi lita (K3 część 1); ⚙ **budynki lite (K3 część 2, 2026-10-06 (4))**. ⚙ **kuźnia i pola w 3D (2026-10-09 (9))** — ⏳ pomiar S21 FE z uprawami (+~164 tys. trójkątów we wsi). ⚙ **domy 3D: 15 we wsi + chata Myśliwego (2026-10-09 (10), `tools/houses3d.py`)**. ⚙ **studnia, koło młyńskie, ognisko i zwierzęta wsi w 3D (2026-10-09 (11))**. ✅ **S21 FE 2026-10-09 (15): wieś 119,8 FPS / p95 8,4 ms przy 120 Hz, las bez powtarzalnych zacięć** (jednorazowe przy pierwszym wejściu w fragment — ⏳ rozgrzanie). ⏳ kąt kamery po domach (dachy przy 40°), Gęstwina. ⏳ Przed decyzją „tak”: paski HP/liczby w rzucie 3D, dachy, woda, wioska, tap w cel. ⚙ Związane z przebudową lasu (wolna przestrzeń walki: 17 % lądu ma koło ≥ 100 px, 10 % ≥ 130 px) | `docs/dziennik.md` 2026-10-04 (9) |
| **OI-165** | ⏳ **ROZSTAW LASU — WDROŻONY, czeka na odbiór w grze i pomiar na S21 FE** (2026-10-04). Las 160×60 → **240×90**, odstęp pni we wnętrzu ≥ 84 px, polana pod każdym spawnem, pościg sfory „goni, ale stoi” 28–40% → 0–4%. ✅ **S21 FE, widok 3D, zapis autora (poz. 27), 2026-10-04:** 24 kawałki gruntu; skraj lasu i najgęstsze miejsce (51 pni w 450 px) — **119,1–119,8 FPS** (ekran 120 Hz), p50 8,3 / p95 8,4 / p99 8,5 ms, **0 klatek > 33 ms** w 4 × 15 s; sterta JS 116 MB. ⏳ Otwarte: czy las nadal czyta się jak las (1017 pni + 601 krzewów); ✅ gęstość spawnów: **dosiew 26 → 39** (zając 10, lis 5, jeleń 5, sieciarz 5, skoczek 4, dzik 4; sfora, Szary i niedźwiedź bez zmian), każdy nowy na polanie i ≥ 380 px od innych spawnów — ⏳ odbiór w grze; Gęstwina ma tę samą chorobę (pnie z kafli, osobna mapa); stare zapisy z lasu lądują w innym miejscu (gra zsuwa na najbliższe wolne pole). ⚙ Strażnik: `tools/forest_clearance.py` | `docs/decyzje/2026-10-04-rozstaw-lasu.md` |
| **OI-116** | ⚠⚠ **HIPOTEZA, NIE DECYZJA — czy `attackCooldown` i `swingDurationMs` mają być OSOBNYMI osiami katalogu.** Przymiar 37 konstrukcji: `r = 0,9689`, `ρ = 0,9808`, `r² = 0,9389` — jedna oś „ciężkości" zamiast dwóch, a ćwiartka **„długi cd + krótki swing" jest PUSTA** (0/37). Runtime konsumuje je rozłącznie (`cd` → kadencja i DPS; `swing` → root, trafienie `swing × 0,5`, koszt staminy ciosu), więc ⭐ **rozdzielenie nie wymaga zmian w kodzie**. ⚠ **Pierwszym krokiem jest PLAYTEST trzech par, nie edycja katalogu**: Buzdygan ↔ Młot bojowy 1H · Miecz ↔ Miecz długi · ⭐ Włócznia ↔ Rohatyna. Dopiero po nim decyzja autora. ⛔ Do tego czasu nie ruszać wartości, nie robić rebalansu, nie dodawać statystyk ani archetypów. Temat 3D osobno (`OI-109`) | `docs/odlozone.md` §2; pomiar `docs/dziennik.md` 2026-09-18 (3) |

---

## Notatki o nadawaniu numerów (dawny nagłówek rejestru)

⚠ **`OI-118` i `OI-119` nadano 2026-09-18** przy archiwizacji sesji.
⛔ **Żadne z nich nie jest zadaniem do wykonania** — oba są zanotowanymi
tematami: `OI-118` to przyszły AUDYT warstwy 3D, `OI-119` to zapisana
możliwość oparcia przyszłej mechaniki na istniejącym `minReach`.

⚠ **`OI-117` nadano 2026-09-18**, po audycie tożsamości 37 konstrukcji.
⛔ **Nie jest brakiem do uzupełnienia** — jest świadomie odłożonym pytaniem
o buzdygan; audyt zamknął się wnioskiem, że katalog **nie potrzebuje ani
jednego nowego Construction Traita**.

⚠ **`OI-116` nadano 2026-09-18**, po przymiarze relacji `attackCooldown` ↔
`swingDurationMs`. ⭐ **Nie jest błędem ani zadaniem do wykonania** — jest
hipotezą projektową z pomiarem, a jej pierwszym krokiem jest playtest.

⚠ **`OI-113` nadano 2026-09-18**, po przeniesieniu łuku z broni do umiejętności.
⭐ Jedyna liczba, którą ta migracja musiała WYBRAĆ, a nie przepisać.

⚠ **Pięć numerów (`OI-108` … `OI-112`) nadano 2026-09-17**, po dwóch partiach
katalogu broni. ⭐ **Żaden nie jest błędem**: dwa pytania projektowe, które
zablokowały niezmienniki, dwie luki zawartości i jeden dokument przy suficie.
⚠ `OI-108` (jednoręczna drzewcowa) i `OI-112` (bastard 1H/2H) to **ta sama klasa
sprawy**: świat chce zestawu, którego dzisiejszy model `hands` nie umie wyrazić.

⚠ **`OI-107` nadano 2026-09-16**, po sesji układu panelu handlu — nie jest
ujęty w bilansie wyżej. ✅ **Zderzenie `OI-104` przestało go blokować
2026-09-21** (Model D zachował numer, kumulacja zestawów dostała `OI-143`);
przeliczenie bilansu zostaje do zrobienia, ale nie czeka już na nic.

⚠ **Sześć numerów (OI-94 … OI-99) nadano 2026-09-11**, po przebudowie ekwipunku
(`docs/decyzje/2026-09-11-ekwipunek-fundament.md`). Żaden nie jest
błędem: to kalibracje, pytania projektowe i brak zawartości — zakres, który
świadomie został poza tamtą zmianą.

⚠ **Sześć numerów (OI-88 … OI-93) nadano 2026-09-11**, po przebudowie celowania
i review modelu walki. ⭐ **Wszystkie sześć czeka na RĘKĘ NA GAŁCE, żadne na
kod** — dwa to strojenie liczby, cztery to jedno zdanie autora po graniu. To jest
lista do przejrzenia **po pierwszym pełnym playteście walki**, nie przed nim.


---
typ: OPERACYJNE
domena: proces
tytul: Indeks dokumentacji
stan: zywy
otwarte: [OI-1]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# `docs/` — indeks

> ## Kalibracja — przeczytaj, zanim ocenisz stan projektu
>
> **Co to jest.** Top-down action RPG: rozgrywka 2D (Phaser 3 + TypeScript),
> obraz świata w 3D (three.js) domyślnie od 2026-10-06. Grywalny prototyp —
> nie demo. Działa w przeglądarce i ma zbudowany projekt `android/`.
>
> 1. **Projekt jest rozwijany długoterminowo** (≥ rok, docelowo produkt). Nie
>    argumentuj przeciwko decyzjom terminami — to rozstrzygnięte.
> 2. ⚠ **Autor regularnie gra w aktualną wersję.** Relacji z playtestów jest
>    tu MAŁO (ostatnia pełna: 2026-08-12) — to mówi, ile się **zapisuje**, nie
>    ile się **gra**. Brak dokumentu playtestowego nie oznacza braku testów.
> 3. **Głębia systemów przed pełną zawartością jest świadomym wyborem** —
>    przyjęty koszt, nie dryf.
> 4. **Tylko `STAN` (`systemy/*.md`) opisuje dzisiejszą mechanikę.** Wszystko
>    inne mówi o świecie (`KANON`), powodach (`DECYZJA`), przeszłości
>    (`HISTORIA`), liczbach (`GENEROWANE`) albo pracy (`OPERACYJNE`).

---

**Punkt wejścia sesji: `docs/current.md`** (wczytywany automatycznie przez
`CLAUDE.md`). Ten plik odpowiada na „który dokument otworzyć" — jeden wiersz
na dokument, bez statusu (status mieszka w `current.md`). Reguły:
`DOC_CONTRACT.md`; pilnuje `tools/doc_check.mjs` (budżet tego pliku: 24 KB).

## Routing — od pytania do dokumentu

| pytanie | zacznij tutaj | dalej |
|---|---|---|
| Gdzie jest projekt, co dalej, na co czeka autor? | **`current.md`** | `zadania.md`, `dziennik.md` |
| Jak działa walka? | `systemy/combat.md` | `systemy/weapons.md`, `armor.md`, `shields.md`, `proficiency.md`; decyzje broni w `decyzje/2026-09-1*` |
| Jak działa rozwój postaci? | `systemy/progression.md` | `systemy/attributes.md`, `abilities.md`, `proficiency.md`, `postep_katalog.md` |
| Jak działa stamina i obciążenie? | `systemy/stamina.md` | `decyzje/2026-09-15-obciazenie-dwie-osie.md`, `playtest_protocol_oi105a.md` |
| Jak działa ekwipunek? | `systemy/items.md` | `systemy/inventory.md`, `economy.md`, `ekwipunek_przedmioty.md`, `dystrybucja_ekwipunku.md` |
| Jak gra rysuje świat w 3D? | `systemy/render3d.md` | `postac3d_checkpoint.md`, `public/assets/README.md` |
| Jak działa świat, mapy, przejścia? | `systemy/world.md` | `systemy/movement.md`, `mapy.md` |
| Jak działają przeciwnicy? | `systemy/creatures.md` | `stworzenia_katalog.md`, `bandyci_plan.md` |
| Co gracz może przeczytać? | `swiat.md` | `wioska_plan.md` (wygrywa o wieś), `systemy/quests.md` |
| Jak wygląda / ma wyglądać wieś? | `wioska_plan.md` | `zagaje_projekt_ukladu.md`, `decyzje/2026-10-10-zagaje-droga-plac-krokowo.md` |
| Jak wygenerować grafikę? | `ART_DIRECTION.md` | `gemini_*_icons.md`, `prompty_gemini.md`, `public/assets/README.md` |
| Co jest otwarte? Co zamknięte? | `zadania.md` | `issues_archive.md`, `odlozone.md` |
| Kolejność dużych etapów? | `roadmap.md` | `current.md` §3 (pytanie o aktualność) |
| Jak przetestować ręką? | `dev_console.md` | `CLAUDE.md` — polecenia |
| Jak pisać dokumentację? | `DOC_CONTRACT.md` | `decyzje/` o dokumentacji (2026-09-05…07, 2026-10-11) |

⚠ Nie ma `STAN` „wydajności" — to przekrój, nie domena (`proces/ekstrakcja_performance.md`).

## `STAN` — jak działa dziś mechanika (26 domen)

| dokument | o czym |
|---|---|
| `systemy/combat.md` | pipeline ciosu: bramki, commit, rozstrzygnięcie w połowie zamachu |
| `systemy/weapons.md` | pięć osi broni, reguła zawężania, zasięg |
| `systemy/armor.md` | punkty → materiał → krzywa → sufit |
| `systemy/shields.md` | blok kierunkowy w trzech strefach, koszt osłony |
| `systemy/abilities.md` | bramki zdobycia, sloty, archetypy wykonania (`umiejetnosci_katalog.md`) |
| `systemy/effects.md` | księgowość tego, co trwa: warstwa mówi ILE, host mówi CO |
| `systemy/proficiency.md` | warstwa 2, praktyka, Mastery jako ranga kupowana |
| `systemy/attributes.md` | cztery atrybuty z listami konsumentów |
| `systemy/stamina.md` | kanały wysiłku, obciążenie; `spend()` nigdy nie odmawia |
| `systemy/progression.md` | XP, poziomy, wspólna pula punktów |
| `systemy/economy.md` | złoto z handlu, naprawa jako ujście |
| `systemy/items.md` | typy, jakość, trwałość, waga |
| `systemy/inventory.md` | lalka nad plecakiem, gabaryt, zero auto-reorganizacji |
| `systemy/gathering.md` | stanowisko ≠ roślina, odrost |
| `systemy/creatures.md` | kontrakt gatunku, agresja, priorytet ciała (`stworzenia_katalog.md`) |
| `systemy/movement.md` | intencja → solver → ciało |
| `systemy/world.md` | mapa, spawn, przejście; punkt to uprawnienie |
| `systemy/quests.md` | zadania, rozmowy i NPC razem |
| `systemy/ui.md` | powierzchnia, modal, afordancja |
| `systemy/input.md` | trzy kształty intencji, budżet dwóch palców |
| `systemy/presentation.md` | cue i kanał sygnału walki |
| `systemy/render3d.md` | obraz świata w 3D: scena, kamera, modele, zasłony |
| `systemy/audio.md` | jeden właściciel odtwarzania |
| `systemy/save.md` | sloty, wersja, migracja, pole addytywne |
| `systemy/assets.md` | odwołanie kluczem, trzy stopnie degradacji |
| `systemy/architecture.md` | pięć warstw, 18 właścicieli stanu |

## `GENEROWANE` — aktualne liczby (pierwszeństwo przed `STAN` w liczbach)

⚠ Ręczna poprawka liczby w tych plikach jest błędem — przegeneruj.

| dokument | generator |
|---|---|
| `ekwipunek_przedmioty.md` | `tools/katalog_ekwipunku.mjs` |
| `umiejetnosci_katalog.md` | `tools/katalog_umiejetnosci.mjs` |
| `postep_katalog.md` | `tools/katalog_postepu.mjs` |
| `stworzenia_katalog.md` | `tools/katalog_stworzen.mjs` |
| `dystrybucja_ekwipunku.md` | `tools/dystrybucja_przymiar.mjs` |

Macierz walki nie ma pliku — `node tools/macierz_walki.mjs` drukuje do konsoli
(`decyzje/2026-09-07-prog-zasiegu-orbity.md`).

## `KANON` — świat i reguły produkcji materiału

| dokument | kiedy otworzyć |
|---|---|
| `swiat.md` | zanim napiszesz cokolwiek, co gracz przeczyta |
| `wioska_plan.md` | zanim zdecydujesz, gdzie we wsi coś stoi |
| `spider_colony.md` | kolonia pająków w Gęstwinie — zamiar autora i zderzenia z kręgosłupem (`OI-172`) |
| `kreator_postaci.md` | kreator: osie wariantów, opcje jako dane, D1–D5 (`OI-166`, projekt bez kodu) |
| `mapy.md` | zanim tkniesz `.tmj` albo dołożysz coś do świata |
| `ART_DIRECTION.md` | zanim narysujesz albo wygenerujesz cokolwiek |
| `katalog_assetow.md` | status assetów środowiska, plik po pliku |

## `DECYZJA` — dlaczego model wygląda tak (`decyzje/`, niezmienne po zamknięciu)

| dokument | co rozstrzyga |
|---|---|
| `decyzje/2026-09-05-system-vs-content.md` | SYSTEM jest dokumentem, CONTENT jest danymi |
| `decyzje/2026-09-05-moc-decyzji.md` | `moc` decyzji niezależna od `stan` pliku |
| `decyzje/2026-09-05-struktura-docs.md` | `docs/` ma podkatalogi; płaski eksport robi narzędzie |
| `decyzje/2026-09-05-instrukcje-przy-kodzie.md` | `src/*/CLAUDE.md` poza kontraktem, ale pod przymiarem |
| `decyzje/2026-09-06-effects-jako-domena.md` | `effects` jako domena; kiedy wolno rozszerzyć listę |
| `decyzje/2026-09-07-klasyfikacja-zamiast-przeprowadzki.md` | dokumenty klasyfikujemy w miejscu, nie przenosimy |
| `decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md` | dokumentacja walki opisuje STAN; 27 plików usuniętych — co ocalono |
| `decyzje/2026-09-07-obrona-wroga-nie-istnieje.md` | wróg nie blokuje ani nie paruje |
| `decyzje/2026-09-07-prog-zasiegu-orbity.md` | zasięg ma próg binarny wobec krążącego celu |
| `decyzje/2026-09-08-dlugosc-wypowiedzi-nie-jest-problemem.md` | wypowiedź NPC może być długa, nie może być zamknięta |
| `decyzje/2026-09-08-postac-3d-jako-zrodlo.md` | postać z modelu 3D, nie z arkusza — powodem jest RUCH |
| `decyzje/2026-09-08-prezentacja-przed-modelem-danych.md` | przebudowa rozmowy zaczyna się od prezentacji |
| `decyzje/2026-09-11-ekwipunek-fundament.md` | układ lalki jako DANE, panel z okna, zestawy, drugi zestaw broni |
| `decyzje/2026-09-12-taksonomia-pancerza.md` | trzy warstwy na czterech obszarach; ⛔ `coverage` nie powstanie |
| `decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md` | gatunek materiału jako oś prostopadła do profilu |
| `decyzje/2026-09-15-masa-schowanego-zestawu.md` | schowany zestaw waży 100% |
| `decyzje/2026-09-15-obciazenie-dwie-osie.md` | Model D: `kg` → ruch i regeneracja, `ratio` → unik i sprint |
| `decyzje/2026-09-15-warstwy-rownowazne-i-zestaw-po-obszarach.md` | warstwy arytmetycznie równoważne; zestaw liczony po obszarach |
| `decyzje/2026-09-15-zakres-pp-i-capu.md` | skala PP i cap zamrożone |
| `decyzje/2026-09-15-zapis-warstw-pancerza.md` | warstwy w zapisie: płaska kotwica + opcjonalna mapa |
| `decyzje/2026-09-17-drabinka-mieczy-i-chwyt.md` | drabinka rozmiaru mieczy; bastard `hands: 2` |
| `decyzje/2026-09-17-katalog-broni-warstwy-spoleczne.md` | katalog broni rośnie po warstwach społecznych |
| `decyzje/2026-09-18-gabaryt-w-plecaku.md` | gabaryt 1×1 / 1×2; liczba kolumn w modelu |
| `decyzje/2026-09-18-kategoria-1-5h.md` | półtoraręczność jako druga oś (`grip`) |
| `decyzje/2026-09-18-katalog-broni-zamkniety-37.md` | katalog broni zamknięty na 37 konstrukcjach |
| `decyzje/2026-09-18-luk-nalezy-do-umiejetnosci.md` | kąt obszaru należy do umiejętności, nie do broni |
| `decyzje/2026-09-18-zamkniecie-audytu-pancerza.md` | ARMOR SYSTEM FREEZE |
| `decyzje/2026-09-19-ekran-handlu-przebudowa.md` | ⚠ zastąpiona 10-13 — ekran handlu w czterech kolumnach; jeden model karty |
| `decyzje/2026-10-04-rozstaw-lasu.md` | las ×1,5, odstęp pni ≥ 84 px, polana pod spawnem |
| `decyzje/2026-10-09-owalnica-zagajow.md` | ⚠ układ unieważniony 10-10; płoty, karczma, kuźnia, młynówka w mocy |
| `decyzje/2026-10-10-zagaje-droga-plac-krokowo.md` | Zagaje: jedna droga z placem, zagroda wg majątku, rozwój krokowy |
| `decyzje/2026-10-11-render3d-jako-domena.md` | obraz 3D jako 28. domena z własnym `STAN` |
| `decyzje/2026-10-13-sklep-kupiec-gracz-karta.md` | sklep: kupiec \| gracz \| karta, kafle po obu stronach, Kup·Odkup i Plecak·Na sobie, Cofnij + Odkup |
| `decyzje/2026-10-14-uslugi-jako-wypowiedzi.md` | rozmowa: usługi jako wypowiedzi gracza, szyna usługi tylko „‹ Rozmowa” i pożegnanie |

## `OPERACYJNE` — wątki, plan, narzędzia, prompty

| dokument | kiedy otworzyć |
|---|---|
| **`current.md`** | ⭐ na starcie sesji — stan, wątki, pytania do autora |
| **`zadania.md`** | lista OTWARTYCH spraw `OI` (etykieta + adres) |
| `odlozone.md` | parking: co odłożone i co je odblokuje; §5 barierki |
| `roadmap.md` | kolejność etapów wyposażenia i archetypów |
| `pomysly.md` | kierunki niezatwierdzone |
| `zagaje_projekt_ukladu.md` | wątek układu Zagajów — „Stan kroków" K1–K6j |
| `bandyci_plan.md` | wątek bandytów (`OI-171`) — ustalenia, roster, kroki |
| `content_expansion.md` | ⭐ wątek rozbudowy zawartości przed krzywą XP — tory, **„do odbioru”**, kolejka Blendera, karty decyzji |
| `ui_mobile_research.md` | ⭐ wątek interfejsu na telefon: research gier mobilnych (MOBA, ARPG, MMO), stan HUD-u, panelu i rozmowy, decyzje D1–D12 |
| `research/ui_shop_research.md` · `research/ui_inventory_research.md` · `research/ui_dialogue_frame_research.md` | surowe raporty researchu UI z 2026-10-13 (sklep, ekwipunek, rozmowa jako rama usług); synteza w `ui_mobile_research.md` §8 |
| `character_consistency.md` | przegląd `OI-175`: kanon postaci ↔ ich kwestie w grze — poprawki, karty B1–B7, luki w relacjach |
| `region_geography_proposal.md` | propozycja geografii regionu — ⛔ nie kanon do decyzji autora (§8) |
| `pancerz_checkpoint.md` | wątek pancerza i tarcz — FREEZE: co zweryfikowane, co odroczone |
| `tarcze_grafika_checkpoint.md` | wątek grafiki tarcz, standard drewna, gabaryt 1×2 |
| `tarcze_katalog.md` | katalog kandydacki tarcz — profil ordynalny, bez liczb |
| `postac3d_checkpoint.md` | postać 3D (zamknięta 10-10): baza V5, niezmienniki rigu, jak powstaje mieszkaniec |
| `plan_dalszych_prac.md` | plan wyłącznie lasu i optymalizacji mobilnej (ETAP A) |
| `playtest_protocol_oi105a.md` | protokół playtestu Modelu D |
| `archetypy_walki.md` | 1H+tarcza / 2H / dual wield |
| `gemini_weapon_icons.md` | ikony broni przez Gemini — potok i wsady |
| `gemini_armor_icons.md` | ikony pancerza przez Gemini — wsady 1–4 wpięte, wsad 5 gotowy |
| `gemini_item_icons.md` | ikony reszty rosteru (155/155) |
| `prompty_gemini.md` | gotowe bloki „Character identity" do portretów NPC |
| `prompt_wies_gospodarka.md` | zlecenie dla zewnętrznych modeli: gospodarka wsi |
| `prompt_sciany_gemini.md` | prompt na kafle ścian |
| `prompt_wioska.md` | protokół iteracji `wioska_plan.md` |
| `prompt_collision_review.md` | prompt konsultacyjny o kolizji (użyty, zamknięty) |
| `referencje_zewnetrzne.md` | zanim dorzucisz materiał do `public/assets/tem/` |
| `dev_console.md` | `window.dev` — złoto, poziomy, cooldowny |
| `DOC_CONTRACT.md` | zanim napiszesz albo przeklasyfikujesz dokument |
| `proces/` | 25 zapisów Canon Extraction — rozjazdy kod↔dokumentacja, rejestry decyzji |

## `HISTORIA` — jak do tego doszliśmy (⛔ nigdy jako stan)

`zamkniety` — wolno cytować jako źródło powodów · `zamrozony` — częściowo
nieprawdziwy, nic nie cytuj · `zastapiony` — ma następcę.

| dokument | co zachowuje |
|---|---|
| `dziennik.md` | ⭐ dziennik sesji, najnowsze na górze — jedyny żywy dziennik |
| `issues_archive.md` | sprawy `OI` zamknięte, dosłownie, z pomiarem |
| `postac3d_historia.md` | etapy postaci 3D §1–§38 i dopiski; numeracja zachowana |
| `checkpoint_2026-09-21.md` | punkt wejścia do 2026-10-11 → `current.md` |
| `checkpoint_2026-09-17.md` | roster broni, oś materiału, `minReach` |
| `checkpoint_2026-09-16.md` | 30 tarcz, `T-1`, pomiar `OI-24` |
| `checkpoint_2026-09-15.md` | model C, żelazo/stal, audyt obciążenia |
| `ekwipunek_checkpoint.md` | wątek ekwipunku do 2026-09-15 |
| `tarcze_checkpoint.md` | projekt tarcz 2026-09-14…15 |
| `konfiguracje_broni_checkpoint.md` | trzy konfiguracje broni (2026-09-05) |
| `handoff_2026-09-20_fundament_postaci.md` | fundament rigu i chodu A1–A6, błędy poprzedniego agenta (§6) |
| `audyt_zagaje_swiat_2026-10-09.md` | audyt Zagajów w 3D, ocena materiału ChatGPT |
| `tarcze_konstrukcje_2026-09-14.md` | audyt tarcz i robocza taksonomia konstrukcji |
| `audyt_obciazenia_kalibracja_2026-09-15.md` | kalibracja Modelu D |
| `audyt_obciazenia_i_warstw_2026-09-14.md` | matematyka warstw i obciążenia |
| `audyt_projektowy_fundamentow_2026-09-03.md` ⚠ zamrożony | czy fundament udźwignie duże RPG |
| `atrybuty.md` | pomiar, który obalił płaską Siłę |
| `atrybuty_ocena.md` | pakiet rebalansu wysłany na zewnątrz |
| `ekwipunek_mechanika.md` | 15 niezmienników przedmiotu zakładanego |
| `jakosc_wykonania.md` | analiza jakości wykonania przed wdrożeniem |
| `jakosc_wykonania_ocena.md` | pakiet wysłany na zewnątrz |
| `inventory_scroll_ux.md` | torby jako przedmioty, scrollowany plecak |
| `sklep_migracja_wzorca.md` | sklep na wzorcu „tapnięcie zaznacza" |
| `gui_umiejetnosci_handoff.md` | 12 decyzji ekranu umiejętności |
| `bestiariusz_audyt.md` | roster przed pracą nad AI |
| `fauna_faza1.md` | fauna neutralna — „las zaczyna żyć" |
| `pajaki_ocena.md` | specyfikacja sieciarza |
| `pajak_jadowity_koncepcje.md` | trzy koncepcje skoczka i co je zabiło |
| `las_audyt_level_design.md` | las jako scena dla stworzeń |
| `las_projekt_docelowy.md` | las jako pierwsza duża lokacja |
| `las_faza1b_final.md` | źródło prawdy dla decyzji Z-1…Z-10 |
| `forest_rebuild_scope.md` | przebudowa lasu w Tiled — zamknięta 2026-08-31 |
| `tree_instances.md` | jedno drzewo = jeden tile-object |
| `QUEST_01_WSTEP_DO_MYSLIWEGO.md` | analiza zewnętrzna pierwszego questa |
| `rozdzial1_questy_ocena.md` | Rozdział I jako sieć questów |
| `geometria_dachow_LTU.md` | czemu dwa prostokąty czytają się jak dwa budynki |
| `proporcje_domow.md` | zmierzone proporcje pionowe domów |
| `ZADANIE_drzewa.md` ⚠ zamrożony | stary brief na drzewa |
| `assety.md` ⚠ zamrożony | wycinek dawnego `CLAUDE.md` |
| `architektura.md` ⛔ zastąpiony | → `systemy/architecture.md` |
| `zaimplementowane.md` | checklista sprzed ekstrakcji: pomiary, powody |
| `archiwum/` | dawne `CLAUDE.md`/`AGENTS.md` i pełne opisy dokumentów sprzed 2026-09-07 |
| `art-review/` | pliki robocze z konwersji grafiki — nic nie jest wpięte do gry |

Walka nie ma historii celowo — 27 dokumentów usunięto 2026-09-07
(`decyzje/2026-09-07-odchudzenie-dokumentacji-combat.md`); przebiegi są w gicie.

## Poza `docs/`

| plik | co niesie |
|---|---|
| `CLAUDE.md` (korzeń) | router, kalibracja, niezmienniki globalne, polecenia, barierki |
| `src/*/CLAUDE.md`, `tools/CLAUDE.md` | reguły przy kodzie (poza kontraktem, pod przymiarem) |
| `public/assets/README.md` | źródło prawdy o pikselach i generatorach modeli |
| `PROJECT_DOCS_CHECKPOINT.md` | historia porządków dokumentacji 2026-09-05…08 |
| `PROJECT_CHECKPOINT_STEP2.md`, `PROJECT_CHECKPOINT_STEP1B.md`, `PROJECT_CHECKPOINT_RESIZE160.md`, `PROJECT_CHECKPOINT_TERRAIN.md`, `PROJECT_CHECKPOINT_RESUME.md` | historia etapu lasu 2026-08-27…28 (`OI-3`) |

Paczkę na zewnątrz składa `node tools/doc_export.mjs --domena <d>` — z
kalibracją z góry tego pliku i listą tego, czego w paczce nie ma.

**Dane, nie proza:** `budynki.json` · `kafle.json` · `nature_kafle.json` ·
`pole.json` · `kuznia.json` · `paleta.json` · `droga_blob47.json` ·
`forrest_atlas.json` · `terrain_forest_transitions.json` — wejścia
generatorów z `tools/` (czytają je dziesiątki skryptów — ⛔ nie przenoś).
Cudzy pipeline pixel-artu postaci 2D (`ai-pixel-snapped-game-sprites-main/`)
usunięty 2026-10-11 — gra idzie w 3D; wnioski: `prompty_gemini.md`, pliki: git.

## Zasady utrzymania tego pliku

1. **Nowy dokument dostaje wiersz TUTAJ w tej samej sesji** (`doc_check` §I).
2. **Jeden wiersz, bez statusu i bez „⭐⭐ bieżący"** — status jest
   w `current.md`, uzasadnienie w dokumencie. Budżet 24 KB (§B).
3. Sufiks `_ocena` = pakiet wysłany na zewnątrz, nie werdykt.
4. Łącza ścieżką od korzenia repo, nigdy względną.

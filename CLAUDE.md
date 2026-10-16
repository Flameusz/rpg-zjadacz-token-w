# RPG Prototype

Top-down action RPG (WoW/LoL-style combat feel): **rozgrywka 2D w Phaserze 3,
obraz świata w 3D (three.js) domyślnie od 2026-10-06** — postacie, zwierzęta,
drzewa i domy są modelami generowanymi skryptami Blendera. TypeScript + Vite.
Działa w przeglądarce i ma zbudowany projekt `android/` (Capacitor).

> ⚠ **Ten plik jest ROUTEREM** — ładuje się w całości co sesję, więc trzyma
> wyłącznie to, co potrzebne ZAWSZE. **Budżet 28 KB pilnuje
> `tools/doc_check.mjs` §B.** Status („co teraz", „co otwarte") NIE mieszka
> tutaj — tylko w `docs/current.md`.

## Teraz — punkt wejścia

Stan projektu, aktywne wątki, pytania do autora i bramki:

@docs/current.md

(Plik dochodzi do kontekstu automatycznie przez import. Gdyby go nie było
widać, otwórz `docs/current.md` — to pierwsza lektura każdej sesji.)

## Kalibracja — przeczytaj, zanim ocenisz stan projektu

⚠ **Jak DZIAŁA mechanika, mówi wyłącznie `docs/systemy/<domena>.md`** (`STAN`,
26 domen, kotwiczone w kodzie, pilnowane przez `tools/doc_check.mjs`).
⛔ `docs/zaimplementowane.md` i stare checkpointy to `HISTORIA` — pomiary
i powody, nigdy stan gry. Spis „co już jest" — niżej.

> **Autor GRA W TĘ GRĘ NA BIEŻĄCO.** Zapisanych relacji z playtestów jest
> mało (ostatnia pełna 2026-08-12) — to mówi, ile się **zapisuje**, nie ile
> się **gra**. Nie wyciągaj z braku dokumentu wniosku „to nigdy nie było
> grane" i nie proponuj „zagraj w to" jako wniosku z przeglądu (pomyłka
> z 2026-08-14 — zrzuty z gry pokazały postać na poziomie 27).
>
> **Horyzont: ≥ rok, gra ma być produktem.** Kolejność: *najpierw to, co grę
> wyróżni; dopracowanie, ergonomia telefonu i pakowanie potem.* Głębia
> systemów wyprzedzająca zawartość to **przyjęty koszt, nie dryf**. Nie
> argumentuj terminami — to rozstrzygnięte.
>
> **Cała gra idzie w 3D** (autor, 2026-10-11): wieś, budynki, postacie,
> zwierzęta — modele i animacje 3D wyglądają lepiej niż assetownia 2D
> i łatwiej je animować niż klatki. Nowy materiał świata powstaje jako model
> (generator Blender → `.glb`), nie jako pixel-art; arkusze 2D zostają
> ścieżką awaryjną. Dawne zdanie „grafika wioski to świadomie otwarta
> dziura" (2026-08-14) nie obowiązuje. ⚠ Obowiązuje dalej zakaz zastępników
> (`wioska_plan.md` §7.4): płot nie udaje palisady, chałupa nie udaje młyna.

## Gdzie co jest

**Ten plik odpowiada „gdzie", dokumenty — „dlaczego".** Indeks wszystkich
dokumentów z tabelą „pytanie → dokument": `docs/README.md`.

### Zagnieżdżone `CLAUDE.md` (reguły przy kodzie)

| plik | zakres |
|---|---|
| `src/core/CLAUDE.md` | singletony, re-entrancy zdarzeń, `Quests`/etapy, `Inventory`/`Equipment`, `Save`, `Protection` |
| `src/entities/CLAUDE.md` | hooki `Enemy`, tinty i telegrafy, `interrupt` vs `stagger`, cztery kanały obrażeń, kształty arkuszy klatek |
| `src/ui/CLAUDE.md` | skala UI i `resolution`, dotyk zamiast podwójnych tapnięć, `NpcDialog`, geometria prawego dolnego rogu, minimapa |
| `src/world/CLAUDE.md` | Tiled: eksport, tilesety, warstwy, spawny, portale, budynki-obiekty |
| `src/render3d/CLAUDE.md` | renderery three.js, host 2D ↔ model 3D, zrzut widoku 3D |
| `tools/CLAUDE.md` | przymiar i `--zapisz`, „patrz na render", paleta, arkusze, audio, portrety, generator postaci |

⚠ **Dochodzą AUTOMATYCZNIE tylko przy `Read`/`Edit` na pliku z danego
katalogu** — odczyt bashem (`cat`, `sed`, `grep`) nie wstrzykuje niczego,
więc pracując bashem otwórz właściwy `CLAUDE.md` wprost. Działają per
KATALOG, nie rekurencyjnie. **`tools/` mówi, KIEDY wolno zapisać i jak
sprawdzić wynik; `src/world/` — CO zapisany plik musi spełniać.**

### `docs/`

| plik | co to |
|---|---|
| `docs/current.md` | ⭐ **punkt wejścia** — wczytywany wyżej; jedyny plik, który ogłasza, od czego zaczyna się sesja |
| `docs/systemy/` | ⭐ **26 dokumentów `STAN` — jedyne źródło prawdy o mechanice**, jeden na domenę |
| `docs/zadania.md` | ⭐ **jedyna lista OTWARTYCH spraw `OI`** (etykieta + adres). Zamknięte: `docs/issues_archive.md`. ⛔ Zanim zgłosisz „znalazłem problem", sprawdź oba pliki |
| `docs/odlozone.md` | rzeczy świadomie odłożone + §5 **barierki: czego celowo NIE budujemy** |
| `docs/dziennik.md` | dziennik sesji, najnowsze na górze — szczegóły „co i dlaczego" |
| `docs/decyzje/` | decyzje projektowe, jedna sprawa = jeden plik, **niezmienne po zamknięciu** (pole `moc`) |
| `docs/proces/` | 25 zapisów Canon Extraction — „skąd wiadomo, że tak jest" |
| `docs/roadmap.md` | kolejność dużych etapów (archetypy). ⛔ Nie projektuje przyszłych archetypów — nie buduj blokad klasowych „pod maga" na zapas |
| `docs/swiat.md` | biblia świata — przed **czymkolwiek, co gracz przeczyta** |
| `docs/wioska_plan.md` | plan Zagajów; **przy sprzecznościach o wieś wygrywa ze `swiat.md`** |
| `docs/DOC_CONTRACT.md` | typy dokumentów, nagłówek maszynowy, §11 — ciągłość pracy |
| `docs/dev_console.md` | komendy `window.dev` — złoto, poziomy, punkty, sprzęt, cooldowny |

Dokumenty wątków (Zagaje, bandyci, pancerz, postać 3D…) wskazuje
`docs/current.md` §2 — nie ten plik. `AGENTS.md` w korzeniu jest wyłącznie
wskaźnikiem tutaj; ⛔ nie odtwarzaj w nim treści (dwa streszczenia tego
samego kodu zawsze się rozjeżdżają).

## Polecenia i weryfikacja

- **`window.dev` exposes the live core singletons** (Progression, Inventory, Equipment, Quests, Skills, Buffs, Abilities) in dev builds. Use it instead of `import()` from the console: a dynamic import gives you a SECOND module graph, so `Equipment.equip(...)` typed at the console mutates a copy nothing renders and every reading comes back stale. That cost real debugging time twice before the handle existed.
  - ⚠ **Gotowe komendy do USTAWIANIA stanu postaci (złoto, poziomy, punkty, nauka umiejętności, sprzęt, zerowanie cooldownów) → `docs/dev_console.md`.** Trzymane tam, a nie tutaj, bo ten plik ładuje się w całości co sesję, a ściągawka jest potrzebna warunkowo. **Druga pułapka jest opisana tamże i objawia się tak samo jak pierwsza — jako „nic się nie dzieje": przypisanie do pola (`Inventory.gold = 5000`) NIE emituje zdarzenia**, więc HUD zostaje z poprzednią liczbą. Gdzie jest metoda, używaj metody.
- **`dev.perf` mierzy klatki** (dev-build): `dev.perf.overlay()` — licznik
  w rogu ekranu, `dev.perf.watch(15)` — percentyle i **licznik zacięć**,
  `dev.perf.scene()` — rozmiar listy wyświetlania i liczba obiektów `Text`.
  ⚠ **Średnie FPS to zła miara ścinania**: 58 FPS potrafi ukryć dwadzieścia
  klatek po 40 ms, a to zupełnie inna naprawa niż „za dużo rysowania".
  Nakładka jest elementem DOM, nie napisem Phasera — miernik nie ma
  dokładać pracy, której szuka.
- `npm run dev` — dev server (also wired into `.claude/launch.json` as `rpg-dev` for the Browser pane / `preview_start`)
- `npm run build` / `npx tsc --noEmit` — must both pass clean before calling any change done
- **APK na telefon (S21 FE przez USB, `adb devices`):** `npm run build` → `npx cap copy android` →
  w `android/`: `JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"` +
  `JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=C:/rpg/android/.gradle-tmp"` → `./gradlew assembleDebug`
  → `adb install -r app/build/outputs/apk/debug/app-debug.apk` (`-r` zachowuje zapisy). ⚠ Bez tej opcji Gradle
  pada na „Unable to establish loopback connection" (gniazdo NIO w podmienionym katalogu tymczasowym sesji);
  `assembleDebug` NIE instaluje.
- ⚠ **Zrzut widoku 3D (domyślnego): `window.__widok3dObiekt.zrzut()`** — świat three.js z HUD-em Phasera na wierzchu. `game.renderer.snapshot()` łapie WYŁĄCZNIE płótno Phasera (HUD, pierścienie), bez świata; nadaje się do ścieżki `?widok2d` i do samego HUD-u. `canvas.toDataURL()` wprost daje pusty obraz (bufor WebGL nie jest zachowywany).
  - **Do sprawdzania OSTROŚCI (tekst, krawędzie kafli) użyj `renderer.snapshotArea(x, y, w, h, cb)` i powiększ wycinek 3–4× przez `imageSmoothingEnabled = false`.** Wtedy widać pojedyncze piksele urządzenia; w pełnej klatce te same błędy giną. Zrzut wychodzi z przeglądarki najprościej jako `fetch('http://127.0.0.1:PORT', {method:'POST', body: base64})` do dziesięciolinijkowego odbiornika w Node z `Access-Control-Allow-Origin: *` — przepychanie base64 przez konsolę kosztuje wielokrotnie więcej.
  - ⚠ **Zrzut przysłany przez czat mógł zostać po drodze przeskalowany** (obserwowane 1047×589 dla okna, które nie miało takich wymiarów), a to samo w sobie rozmazuje tekst. Zanim uznasz zgłoszenie „napisy są rozmyte" za potwierdzone albo obalone, zrób własny zrzut 1:1 — inaczej diagnozujesz artefakt transportu.

## Architektura w skrócie

Pełny opis: `docs/systemy/architecture.md` (`STAN` domeny `architecture`:
pięć warstw po odpowiedzialności, 18 właścicieli stanu, cztery kanały granic).
⛔ `docs/architektura.md` jest jego zamrożonym poprzednikiem — nie czytaj go
jako mapy dzisiejszego `src/`. Szkielet:

- **`src/config/GameConfig.ts`** — WSZYSTKIE strojone liczby (statystyki,
  czasy walki, przedmioty, zadania, dialogi) + stałe cięcia arkuszy.
- **`src/core/`** — singletony przeżywające `Player`: `Progression`,
  `Inventory`, `Equipment`, `Quests`, `Skills`, `Buffs`, `Abilities`,
  `Gathering`, `Dialogue`, `Save`, plus `Protection` (redukcja obrażeń w obu
  kierunkach), `Assets`, `Sfx`, `theme`, `EventBus`, `InputState`.
- **`src/entities/`** — `Player`, `Enemy` (baza sterowana konfigiem) + **dziewięciu
  przeciwników** (królik, dzik, wilk, Szary, sieciarz, skoczek, niedźwiedź, lis,
  jeleń) i **bandyci** (`Bandit`: zbój z pałką, z toporem, herszt — 2026-10-11),
  `Projectile`, oraz istoty bez walki (`FarmAnimal`, `Bird`) i
  rekwizyty z zachowaniem (`Well`, `Campfire`, `Gatherable`, `Loot`).
- **`src/scenes/`** — `BootScene` → `TitleScene` → `GameScene` + `UIScene`
  (nakładka działająca równolegle).
- **`src/ui/`** — HUD, sterowanie dotykowe i panele nad `PanelBase`; rozmowa z
  NPC to hub `NpcDialog` oddający sterowanie jednemu widokowi naraz.
- **`src/world/`** — `TiledMap` (główna ścieżka map), `WorldComposer` (sklejanie
  map w jeden otwarty świat), `MapBuilder` (awaryjna mapa z kodu), `NodeSpawner`.
- **`src/render3d/`** — obraz świata w three.js: `WorldView3D` (scena, kamera,
  grunt, budynki), `Character3D`/`Creature3D` (modele), `Trees3D`, `Shared3D`.
  ⛔ Wyłącznie rysuje — `docs/systemy/render3d.md`, reguły `src/render3d/CLAUDE.md`.

## Niezmienniki globalne

Rzeczy przecinające katalogi. Reguły jednego katalogu → jego `CLAUDE.md`.

- ⚠ **Balans mieszka w `GameConfig.ts`, nigdy w kodzie encji.** Liczba wpisana
  w klasie jest liczbą, której nikt nie znajdzie przy strojeniu.
- ⚠ **Gra ZAWSZE się uruchamia.** Brakujący PNG → generowany placeholder +
  ostrzeżenie w konsoli; brakujący dźwięk → cisza; nieznany tileset →
  pominięty. **Konsekwencja: nietrafiona ścieżka NIE wywala buildu** —
  po każdej przeprowadzce plików sprawdź w silniku, że `window.dev.missing()`
  jest puste i `load.totalFailed` wynosi zero — a bez silnika:
  `node tools/assety_przymiar.mjs` (każda ścieżka z konfigu na dysku).
- ⚠ **Nowe pole zapisu dodaje się jako OPCJONALNE, bez podbijania
  `SAVE_VERSION`.** Tak weszły `quickSlot`, pierścienie, `offhand`, `gloves`,
  `amulet`. ⭐ **Od 2026-10-11 (`OI-51`) podbicie wersji WYMAGA migracji**
  (`MIGRACJE` w `core/Save.ts`) — niezgodny zapis się migruje, a czego build nie
  umie wczytać, idzie do kopii przed nadpisaniem. ⛔ Nigdy „nowa gra" za
  zmianę wersji (`docs/systemy/save.md` §2).
- ⚠ **PATRZ NA RENDER, NIE TYLKO NA RAPORT.** Najdroższa lekcja projektu,
  powtórzona na czterech generatorach i w UI: bród przecinający rzekę, las
  czytający się jak sad, ćwiartka stogu, nieczytelne napisy przy idealnych
  liczbach. Raport mówi, czy program zrobił to, co napisano; render mówi, czy
  to, co napisano, było dobre. Szczegóły: `tools/CLAUDE.md`.
- ⚠ **Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją.**
  Dokładając regułę sprawdź, że po celowym zepsuciu danych raport zgłasza BŁĄD.
- ⚠ **Reguła zawężania:** wariant/rodzaj użycia może zdolność **odebrać, nigdy
  dodać** (obuch siekiery nie przyznaje sobie przerwania młota).
- ⚠ **Ochrona liczy się w PUNKTACH, nie w procentach**, i jest jedno miejsce,
  które ją liczy (`core/Protection.ts`) — dla obu kierunków walki.
- ⚠ **Nazwy plików i katalogów po ANGIELSKU** (decyzja autora 2026-08-14).
  Komentarze i dokumentacja zostają po polsku. Istniejące polskie nazwy plików
  to osobna, niezrobiona przeprowadzka — lista w `public/assets/README.md`.

## Co już jest — skrócony spis

**Ten spis odpowiada wyłącznie na „czy to już istnieje".** Jak to działa →
`docs/systemy/<domena>.md`. Pomiary, odrzucone warianty i powody →
`docs/zaimplementowane.md` (`HISTORIA`) oraz dokumenty wymienione
w `docs/README.md`.

**Walka:** atak celowany (tap → uzbrojony autoatak → zamach z ukorzenieniem →
trafienie w połowie zamachu) · **celowanie: tap = „zrób to mojemu celowi",
drag = wskaż sam** (intencja domyślna, 2026-09-11 — `docs/systemy/abilities.md`
§6.1) · **obrót w miejscu na drążku** (trzecia strefa; obrót NIE jest ruchem —
`docs/systemy/input.md` §9) · warianty ataku (jedna broń, 1–3 sposoby) ·
tożsamość rodzin broni · typy obrażeń × materiały pancerza · tarcze (blok
kierunkowy) · **dziewięć umiejętności czynnych** (bramka poziom + nauka
u trenera, sześć slotów na pasku) · krytyki, hit-stop, przerwania, zachwianie ·
**ogłuszenie** (`Enemy.stun`, pierwsza twarda kontrola — `docs/systemy/abilities.md`) ·
**KRWAWIENIE na wrogu** (`Rozcięcie`, 2026-09-04 — **pierwszy efekt czasowy
nakładany na przeciwnika**; `Enemy` jest od tej daty `EffectHost`, a księgowość
zabójstwa mieszka w `GameScene.creditKill`, bo tik potrafi dobić) ·
pociski wroga · **BIEGŁOŚĆ (warstwa 2) w obu kierunkach** — `Execution` jako oś
prostopadła do wyniku ataku (Niezgrabnie / Ześlizg / czysto), mnożnik jakości
`m(P)`, `P` gracza per rodzina broni (`core/WeaponProficiency.ts`) · **praktyka
z WALKI i z manekina** (`core/Practice.ts` — `teacher(ρ) × c·√n` oraz kanał
`P_start → P_start + 10`) · **MASTERY I–IV jako ranga KUPOWANA u trenera**
(§34: próg `P` daje twardy sufit i uprawnienie, ranga daje EFEKTY — ekonomia
wysiłku, cecha rodziny, minimum proporcjonalne) + powiadomienie o suficie.
⚠ **Cały zakres jest w kodzie od 2026-09-03; otwarty jest PLAYTEST**, nie
implementacja — `docs/systemy/proficiency.md` i §34.

**Przeciwnicy:** królik (skok + sploch) · dzik (telegrafowana szarża) · sfora
wilków (okrążanie + wycie) · Szary (elita, nie odradza się) · sieciarz (sieć
spowalniająca) · skoczek jadowity (kumulujący się jad) · niedźwiedź ·
**lis** (ucieka; po kilku nieudanych zrywach albo ciosie staje i gryzie —
`docs/systemy/creatures.md` §2.4, `OI-162`) · **jeleń** (NEUTRALNY: płoszy
się, a bodzie porożem dopiero uderzony — `OI-163`) · ⭐ **bandyci** (pierwsi
humanoidalni wrogowie, 2026-10-11, `OI-171`): obóz w lesie (⚠ miejsce ROBOCZE, do ustalenia — `docs/odlozone.md` §1),
zbój z pałką / z toporem / herszt (elita), alarm obozu, złoto z wroga, łup
z dotąd nieosiągalnego pancerza — `docs/bandyci_plan.md`.

**Postać i ekwipunek:** XP/poziomy/**4 atrybuty** (Siła, Witalność, Kondycja,
Zręczność) · **stamina jako zasób wysiłku** (trzy miękkie stany, zero nigdy nie
blokuje akcji, koszt autoataku/uniku/umiejętności/bloku/sprintu/ciężkiego ciosu)
· **obciążenie założonego sprzętu** (udźwig od Siły, mnożnik na unik i sprint) ·
sprint · 10 slotów na manekinie + **drugi ZESTAW BRONI** (schowana para
`weapon2`/`offhand2` z zamianą) · **ZESTAWY PRZEDMIOTÓW** (tag → próg → premia
pochodna; cztery komplety pancerza z ISTNIEJĄCYCH sztuk, zero nowych
przedmiotów) · **warstwowy pancerz jako MECHANIKA** (trzy przedmioty na obszar,
warstwa wyprowadzana z konstrukcji — 2026-09-15) ·
16-slotowy plecak z przeciąganiem i **zakładkami kategorii** (widok filtrowany, układ nietknięty; także półka kupca — `OI-130`) ·
**GABARYT W PLECAKU MA PIERWSZYCH UŻYTKOWNIKÓW** (2026-09-19): dwanaście tarcz
o konstrukcji migdałowej, legionowej i pawęży zajmuje **1×2**, ma własne ikony
32×64 i wysoki kafel ręki w lalce — `docs/tarcze_grafika_checkpoint.md`;
**od 2026-09-30 także sześć DRZEWCOWYCH** (32×64 po skosie 1:2 —
`docs/gemini_weapon_icons.md` §11); ⭐ **od 2026-10-01 REGUŁA: broń średnia
i duża = 1×2** (1×1 tylko do ~45 cm: sztylety i toporek — `docs/systemy/inventory.md` §11),
**ikona zawsze po skosie** (1×1 → 45°, 1×2 → 1:2 — `public/assets/README.md`) ·
⛔ **LICZEBNOŚĆ ROSTERU CZYTA SIĘ Z `docs/ekwipunek_przedmioty.md`** (generator:
`tools/katalog_ekwipunku.mjs`), nie stąd. Stały tu „11 broni" i „39 sztuk
pancerza" — obie zestarzały się w dniu dopisania przedmiotu, a ten plik ładuje
się w całości co sesję, więc kłamał najgłośniej ze wszystkich. ·
broń jedno- i dwuręczna w **pięciu rodzinach** (miecz, topór, obuch, sztylet,
drzewcowe) · **oś GATUNKU materiału także po stronie broni** (2026-09-16:
`WEAPON_MATERIAL`, stal = poziom zerowy) · **`melee.minReach`** — martwa strefa
w zwarciu, własność KONSTRUKCJI, dziś niesie ją pika, halabarda i glewia ·
pancerz w 4 profilach
(skóra, przeszywanica, kolczuga, metal) ułożonych w **TRZY WARSTWY** (L1 podkład →
L2 ochrona zasadnicza → L3 wzmocnienie) na czterech obszarach — ✅ **warstwy są
od 2026-09-15 MECHANIKĄ** (model C: adres = slot + warstwa, 18 adresów) ·
✅ **GATUNEK materiału jako druga, prostopadła oś** (2026-09-15): `armorType` to
profil obrażeń, `material` to poziom rozwoju — **stal = dotychczasowy katalog,
żelazo = szczebel poniżej** (PP ×0,80, cena ×0,60, **masa bez zmian**), siedem
nowych sztuk · pierścienie i amulet · jakość wykonania (7
poziomów, w obiegu 1–4) + trwałość i naprawa (także zbiorcza) · wymagania Siły.

**Świat:** trzy mapy Tiled (las **240×90** — po ROZSTAWIE ×1,5 z 2026-10-04: każdy
pień we wnętrzu ≥ 84 px od sąsiada, polana pod każdym spawnem, strażnik
`tools/forest_clearance.py`, decyzja `docs/decyzje/2026-10-04-rozstaw-lasu.md`;
⭐ **Zagaje 128×128: jedna droga z placem, zagrody wg majątku przy trakcie,
płoty zagród w jeden obwód**, pola wg zamożności, moczydło, kładka, drwale
(2026-10-10, K1–K5; owalnica unieważniona —
`docs/decyzje/2026-10-10-zagaje-droga-plac-krokowo.md`, stan kroków:
`docs/zagaje_projekt_ukladu.md`),
Wschodnia Gęstwina 64×64) · ⭐ **wieś + las = jeden świat** (`swiat.world`,
`WorldComposer`, przejście płynne) + brama do Gęstwiny · zbieractwo **jedenastu** prawdziwych ziół · gotowanie
przy ognisku · zwierzęta gospodarskie, leśne i ptaki · dekoracje.

**NPC i zadania:** 24 NPC-ów (od 2026-10-09 także karczmarz Bogusz i czeladnik kowala Adrian, od 2026-10-10 drwale Ciechan, Bolko i Zbych) · **17 zadań u dwunastu dawców** (od 2026-10-12 „Poszukaj Kirki” u Anny), pięć rodzajów
celów (zbierz / zabij / porozmawiaj / załóż / stań w miejscu) + etapy · **92 tematy** rozmów z
GLOBALNYM zbiorem zadanych pytań · sklepy, trener, dziennik zadań.
⚠ **Po każdej zmianie rozmów albo zadań: `node tools/rozmowy_przymiar.mjs`**
— literówka w bramce tematu ukrywa go NA ZAWSZE, bez błędu (`OI-65`).

**Prezentacja i platforma:** ⭐ **świat rysowany w 3D DOMYŚLNIE** (od 2026-10-06; `src/render3d/WorldView3D.ts`, drzewa i rekwizyty jako modele z `tools/tree3d.py`/`props3d.py`; 2D tylko awaryjnie `?widok2d`) · dźwięk (18 efektów + bed per mapa) · ⭐ **minimapa → MAPA, przycisk z plecakiem obok → panel gracza** (2026-10-12; ramka postaci z pierścieniem XP, para broni na podkładce, pasek zakładek z ✕ i sakiewką — `docs/ui_mobile_research.md`, reguły w `src/ui/CLAUDE.md`) · ⭐ **mapa z mgłą (odkrywanie terenu), widok Świat, Kartografia I = mapa, II = minimapa** (2026-10-14, `docs/systemy/world.md` §5.1) · pasek buffów ·
winieta niskiego HP · cztery sloty zapisu · skala UI i kamery pod telefon ·
projekt `android/` (Capacitor, pełny ekran, orientacja pozioma).

### ⛔ Barierki — nie otwieraj bez konkretnego błędu z gry

Status otwartych spraw: `docs/current.md`. Tu wyłącznie to, co wraca jako
„znaleziony problem", choć jest rozstrzygnięte:

- **Postać 3D: ZAMKNIĘTA, baza V5 = MASTER** (2026-10-10, `OI-134`) — nie
  proponuj ulepszania bazy. ⛔ Nie zgłaszaj „gracz to nadal `Character.png`"
  — arkusz jest ŚCIEŻKĄ AWARYJNĄ. ⚠ Nienaruszalne: nazwy kości,
  `Cube`/`Cube.001`, **skala `Armature` 1,6527**, kość dłoni 0,680 j.,
  T-poza, `roll`. Humanoida ocenia się RENDEREM GRY, nie antropometrią;
  w V5 barki sięgają podbródka — nic nie może rozkładać się poziomo od
  podbródka na barki. ⛔ Obrys odrzucony (`OI-135`). Wejście:
  `docs/postac3d_checkpoint.md`; reguły kodu: `src/render3d/CLAUDE.md`;
  decyzja i cena: `docs/decyzje/2026-09-08-postac-3d-jako-zrodlo.md`.
- **Biegłość: cały zakres w kodzie od 2026-09-03** (warstwa 2, praktyka,
  Mastery I–IV kupowane u trenera). Otwarty jest PLAYTEST odbioru, nie
  implementacja — ⛔ nie planuj tego od nowa. Długi D1–D4:
  `docs/systemy/proficiency.md`.
- **Siła to płaska premia do obrażeń** — poprawka wymaga przestrojenia całej
  broni i HP wrogów. ⛔ Nie „naprawiaj" przesuwaniem liczb.
- **Krzywa XP i rangi Mastery (`OI-43`, `OI-28`, `OI-46`) — ODŁOŻONE przez
  autora (2026-10-11):** za wcześnie przy zwierzętach i świeżych bandytach,
  poziomy nie są problemem. ⛔ Nie stroić krzywej, nie dokładać wrogów „pod
  rangi". Liczby tylko z `node tools/katalog_postepu.mjs`.
- **Las: kolizja, nawigacja, GreyWolf, Bear — ZAMKNIĘTE 2026-08-31.**
  Rozstaw ×1,5 (2026-10-04) czeka na odbiór; standard prześwitu
  nierozstrzygnięty i nieblokujący — PathSolver obchodzi ciasne miejsca.
- **Ekwipunek:** ⛔ nie zgłaszaj „lalka to krata 3×4 ze `slots.png`" (układ
  to dane w `EquipLayout.ts`; obrazek jest źródłem glifów). Schowany zestaw
  waży 100% masy.
- **Pancerz i tarcze: FREEZE 2026-09-18.** ⛔ `coverage`, hit location
  i penetracja NIE POWSTANĄ; ⛔ nie otwieraj D1–D4; ⛔ nie audytuj bez
  danych z playtestu (`docs/pancerz_checkpoint.md`).
- **Wieś ma płot, nie palisadę** (palisada to szczebel grodu).
- **Czego jeszcze nie ma:** broń dystansowa (etap 3 roadmapy), wnętrza
  (`Indoor.png` bez analizy pikseli), tablica ogłoszeń, dzieci i trasy
  mieszkańców.

Barierki „czego celowo NIE budujemy" (auto-podchodzenie do celu, globalny
`MAX_ROOT_MS`, `metal` dla pająków…) → `docs/odlozone.md` §5.

## Ciągłość pracy i dokumentacja

Pełne zasady: `docs/DOC_CONTRACT.md` §11. W skrócie:

- **Start:** `docs/current.md` (wyżej). Szczegóły ostatnich sesji — górę
  `docs/dziennik.md`. Mechanika — `STAN` domeny.
- **W trakcie:** mechanika → `STAN` domeny; świat, zawartość, grafika →
  **dokument wątku** (stała nazwa, sekcja stanu na górze); decyzja autora →
  nowy plik w `docs/decyzje/` (albo wiersz w dokumencie wątku, gdy drobna).
- **Po dużym kroku:** jeden krótki wpis w dzienniku z adresem szczegółów;
  `docs/current.md` tylko, gdy zmienił się wątek, następny krok albo pytanie
  do autora; sprawa zamknięta → wiersz z `zadania.md` do `issues_archive.md`;
  `node tools/doc_check.mjs` zielone.
- ⛔ **Bez checkpointów i handoffów z datą w nazwie** — ich rolę pełni
  `docs/current.md` (historia w gicie) i dokument wątku. ⛔ Bez dopisywania
  statusu do tego pliku i do `docs/README.md` (budżety §B).
- **Nowy dokument → wiersz w `docs/README.md` w tej samej sesji** (§I).
  **Nowy podsystem w `src/` → `STAN` albo wiersz `OI` (DOCUMENTATION).**

## Współpraca z autorem

(Pamięć agenta jest per komputer — tu to, co ma obowiązywać wszędzie.)

- Commity **rzadko** (duży etap), prosto na `main`; push i APK tylko na prośbę.
- Opis usterki („podwórka są ciasne") to **zarzut, nie reguła** projektu.
- Uwagi o układzie wsi rozwiązuj **całym blokiem** ze szkicem „dziś / plan"
  na minimapie, nie łatką; wzór wsi to ulicówka z Roztocza (pasy pól
  prostopadłe do drogi).
- Grafika: przy drugiej chybionej poprawce kształtu — poproś o referencję
  i szkic na renderze zamiast kolejnych opisów słownych.
- Punkty odniesienia: celowanie — LoL / Wild Rift; czytelność sylwetek —
  Stronghold Crusader; NPC-e pixel-art to **próg** jakości 3D, nie wzór.

## Konwencje pracy

- Only edit `public/assets/` to add/replace source PNGs, drop in Tiled maps, or update `README.md` — never leave scratch/debug images (crops, grid overlays) there; write those to a temp/scratchpad location and clean up after analysis.
- **Nazwy PLIKÓW i KATALOGÓW po angielsku** (decyzja autora, 2026-08-14) — docelowo angielski ma być głównym językiem projektu. Dotyczy nowych rzeczy; komentarze i dokumentacja zostają po polsku, a **istniejące polskie nazwy plików to osobna, jeszcze niezrobiona przeprowadzka** (patrz lista w `public/assets/README.md`).
- **Assety wczytywane przez grę są poukładane tematycznie** (2026-08-14): `characters/`, `animals/`, `props/`, `items/`. Pełna tabela i powody w `public/assets/README.md` — ⚠ **arkusze kafli zostają w korzeniu celowo**, bo `.tmj` wskazuje je ścieżką i przeniesienie zepsułoby Tiled (gra wiąże je po nazwie, więc jej to nie dotyczy).
  - ⚠ **Przenosząc asset, załataj też `tools/`.** 21 generatorów zapisuje do tych plików; po przeprowadzce pisałyby do starej lokalizacji, a gra czytałaby z nowej — **cicha rozbieżność, nie błąd**.
  - ⚠ **Nietrafiona ścieżka NIE wywala gry** — `Assets.ts` podstawia placeholder, bo tak jest zaprojektowany. Po każdej takiej zmianie sprawdź w silniku, że `window.dev.missing` jest puste i `load.totalFailed` wynosi zero; sam `tsc`/`build` tego nie złapią.
- Keep balance numbers in `GameConfig.ts`, not scattered in entity code.
- When you discover a new hard-won fact about an asset's real pixel layout, add it to `public/assets/README.md` immediately — that file is what saves the next session from repeating the same pixel-archaeology.

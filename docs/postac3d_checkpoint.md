---
typ: OPERACYJNE
domena: [assets, proces]
tytul: Postać 3D (gracz i mieszkańcy) — punkt wejścia
stan: zamkniety
kotwice:
  - tools/char3d_base.py
  - tools/build_char3d_base.py
  - tools/char3d_variants.py
  - tools/npc3d.py
  - tools/char3d_hair.py
  - tools/char3d_odziez.py
  - tools/char3d_face.py
  - tools/char3d_armor.py
  - tools/char3d_walk.py
  - src/render3d/Character3D.ts
otwarte: [OI-166]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-10
---

# Postać 3D — punkt wejścia (stan na 2026-10-10)

> ## ✅ PROTOTYP POSTACI 3D = ZAMKNIĘTY (2026-10-10)
>
> Decyzja autora: **baza V5 jest MASTER** — „na razie nic lepszego nie
> wyczarujemy" (kilka sesji na innym koncie poszło na dowiezienie tego
> poziomu; to granica tego, co dziś robimy z AI). Gracz, cała wieś (21 NPC)
> i zwierzęta są w 3D.
> - ✅ `OI-134` zamknięte — **humanoidalni wrogowie mogą powstawać na tej bazie**.
> - ⛔ `OI-135` odrzucone — obrys przy tej wielkości postaci i przy obrocie się
>   sypie, postaci czytają się bez niego.
> - 📦 Pomiary z telefonu (`OI-157`, `OI-158`, `OI-169`, `OI-170`) i resztki
>   (chwyt oburęczny w marszu, kształt głowy, rekwizyty, twarz z boku,
>   fryzura gracza) → `docs/odlozone.md` §2 i §3.
> - Jedyny wątek, który zostaje otwarty, to **osobny przyszły etap**:
>   kreator postaci (`OI-166`).
>
> ⛔ **Nie otwierać ponownie bez konkretnego błędu z działającej gry** albo
> nowego narzędzia / materiału, które realnie podnoszą jakość. „Dałoby się
> ładniej" nie jest powodem — to jest świadoma granica etapu.

> ⭐⭐ **Ten plik mówi, JAK JEST i GDZIE czego szukać.** Jak do tego doszliśmy
> (pomiary, odrzucone warianty, 34 dopiski, V1 → V5) — **`docs/postac3d_historia.md`**
> (`HISTORIA`). Do 2026-10-10 oba były jednym plikiem o 163 KB; etapy zostały
> przeniesione dosłownie, z tą samą numeracją (tabela na końcu).
>
> ⚠ Jak działa sama MECHANIKA gry (cios, osłona, zwrot, tarcze) — wyłącznie
> `docs/systemy/<domena>.md`. Ten plik dotyczy MODELU i jego generatorów.

## 1. Stan w pięciu zdaniach

- **Baza V5** (2026-10-10) — jedna parametryczna baza humanoida dla gracza
  i mieszkańców: głowa ~3,9 (`glow` 3,9, uniesiona o 0,046 wzrostu), grubsze
  kończyny, duże dłonie (0,118 × 0,066), szerokie barki. Gracz i wieś różnią
  się tylko `rozpietosc`: **gracz 1,10** (nosi broń — przy 1,17 czubki broni 1H
  wchodziły w grunt), **mieszkańcy 1,17**.
- **Gracz** — model 3D jest domyślną postacią od 2026-09-09; cały katalog
  pancerza (warstwy L1/L2/L3), 37/37 broni i tarcze na modelu; klipy chodu,
  biegu, ciosów i pchnięć generowane. Twarz to pixel-art
  (`tools/build_player_face.py`), fryzura to jeszcze strefa czaszki bazy.
- **Mieszkańcy** — **cała wieś (21 NPC) w 3D** jako presety tej samej bazy
  (`tools/npc3d.py`), twarze z portretów 2D albo z pixel-artu.
- **Zwierzęta** — cały roster w 3D z osobnego generatora czworonogów
  (`tools/quad3d.py` + generatory gatunków); poza zakresem tego pliku.
- **Baza V5 = MASTER** (decyzja autora 2026-10-10, `OI-134`). Humanoidalni
  wrogowie powstają na niej tak jak mieszkańcy: preset osi + strój z katalogu.

## 2. Pliki i polecenia

| plik | rola |
|---|---|
| `tools/char3d_base.py` | generator ciała i głowy z `PROPORCJE` (kotwice pierścieni, `KOTWICE_PIONU` / `ZRODLO_PIONU`) |
| `tools/build_char3d_base.py` | przymiar + `--zapisz` bazy gracza do `public/assets/char.blend` |
| `tools/char3d_export_gltf.py` | `char.blend` → `public/assets/characters/char.glb` (klipy, pancerz, broń, twarz) |
| `tools/char3d_variants.py` | osie wariantów jako DELTY do bazy; uruchomiony wprost sprawdza 60 kombinacji |
| `tools/npc3d.py` | mieszkaniec = preset (`PRESETY`) → `characters/npc_<id>.glb`; ⛔ nie zapisuje `char.blend` |
| `tools/char3d_hair.py` | fryzury, zarost, brwi, nakrycia głowy (bryły na profilu czaszki) |
| `tools/char3d_odziez.py` | odzież spoza katalogu: spódnica, fartuch, pas (z narzędziami) |
| `tools/char3d_face.py` | rzut twarzy (portret / pixel-art) na przód głowy — wspólny dla gracza i NPC |
| `tools/char3d_armor.py` | przedmioty katalogu jako kopie fragmentów ciała (`POKRYCIE`, warstwy) |
| `tools/char3d_walk.py` / `char3d_run.py` / `char3d_attack.py` / `char3d_thrust.py` / `char3d_shield_bash.py` | klipy |

```bash
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b public/assets/char.blend --python tools/build_char3d_base.py
```

```bash
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b public/assets/char.blend --python tools/npc3d.py -- hanna --podglad KATALOG
```

- `npc3d.py -- <npc>` bez flag = przymiar (raport); `--podglad KATALOG` =
  rendery `front` / `bok` / `tyl` / `gra` / `gra_skos` / **`gra_px`** (wielkość
  z S21 FE — oceniaj TEN); `--zapisz` = eksport `.glb`. ~10 s na postać.
- ⚠ `blender` nie jest w `PATH`. Reguły generatorów (przymiar, kotwice, dowód
  „nic się nie zmieniło") — `tools/CLAUDE.md`.

## 3. ⛔ Niezmienniki rigu — łatwo zepsuć

| rzecz | wartość | dlaczego |
|---|---|---|
| nazwy 34 kości | `Bone`, `Bone.001`…, `Bone.002_R.003`, `HandIK_*`, `Elbow_*.007`… | strefy, pancerz, chwyt broni i tarczy, IK |
| obiekty | ciało **`Cube.001`**, głowa **`Cube`** (rodzic: kość `Bone.004`, `parent_type='BONE'`) | pobierane po nazwie przez generatory i silnik |
| skala `Armature` | **1,6527** | broń i tarcze mają wymiary LOKALNE — zmiana przeskalowałaby cały ekwipunek |
| kość dłoni | `Bone.002_R.003` (broń) / `Bone.002_L.003` (tarcza), **0,680 j.** w świecie (0,411 lokalnie) | przedmiot siada na ogonie tej kości |
| poza spoczynkowa | **T-poza**, `roll` z pliku | klipy trzymają obroty względem spoczynku; ⚠ T-poza to NIE poza gry (ręce poziomo) |
| akcja w pliku | `Walk` 0–5: cykl 0–3, 4 domyka pętlę, **5 = bezruch poza pętlą** | `Character3D` tnie klip `subclip`-em; każdy skrypt renderujący ustawia klatkę sam |
| obrót turntable | wkluczowany obrót obiektu w `Walk` | każda ścieżka czytająca akcję zdejmuje go (`char3d_attack.zdejmij_obrot_turntable`) |
| atrybut `zona` głowy | `INT` na `FACE` | strefy `skin` / `hair` / `eyes` / `mouth` |
| podłoga | stopy na `PODLOGA` = −11,3 j. | eksport NPC podnosi armaturę, inaczej model stoi pod ziemią |
| renderer three.js | **WSPÓLNY** (`src/render3d/Shared3D.ts`) | ⛔ nie twórz `WebGLRenderer` per postać i nie wołaj na nim `dispose()` |

Bufor postaci w silniku: `RENDER_W × RENDER_H` = **320 × 200**,
`ZAPAS_GORA_PX` 59 (`Character3D.ts`; koszt — `OI-157`).

## 4. Baza — decyzje, które obowiązują

- ⭐⭐ **Humanoida ocenia się RENDEREM GRY, nie antropometrią.** V2 (6,34 głowy)
  przeszła asercje i przegrała wizualnie; V4 (~5,8 głowy, poprawna
  anatomicznie) przegrała z V3.7 w identycznej zbroi przy 70 px postaci.
  ⛔ **Nie wracaj do realistycznych proporcji** bez testu w skali gry.
- ⭐⭐ **Pixel-artowi NPC-e są PROGIEM, nie wzorem** (autor, 2026-10-03):
  pytanie brzmi „czy 3D czyta się LEPIEJ — ubrane i w ruchu", ⛔ nigdy „czy
  pasuje do nich stylem".
- **Wzór czytelności sylwetek: Stronghold Crusader** (postawa, szyja, sprzęt).
  Z kamery 40° widać głównie czubek głowy i fryzurę — tożsamość niesie
  **fryzura + kolor włosów + plama stroju**, potem twarz.
- **Poprawiamy BAZĘ (generator), nie rzeźbimy postaci ręcznie.** Klucze
  `PROPORCJE` sterują (`OI-137` zamknięte); opisowe celowo zostają
  `masa_kg` i `bark_polszerokosc`.
- **Obrys ODRZUCONY** (`OI-135`, 2026-10-10): przy ~150 px i przy obrocie się
  sypie (znikał przy wszystkim, co leży przed tułowiem), a postaci czytają się
  bez niego. `STYL_POSTACI.kontur = 0`, kod zostaje. Cieniowanie tonowe
  (3 tony) i nasycenie ×1,2 zostają.

## 5. Mieszkańcy — jak powstają

- **Preset = osie, nie słownik proporcji.** `_mieszkaniec(opis, (płeć, wiek,
  budowa), …)`; osie w `char3d_variants`: płeć (m/k) × wiek (młody/dorosły/
  stary) × **5 budów** (szczupła · średnia · atletyczna · krępa · tęga)
  × styl, plus `dodatki` osobnicze (też delty). ⛔ Pełny słownik w presecie
  zostaje na starej bazie po cichu przy każdej zmianie bazy.
- **Realne wzory postaci** (autor): budowę wybiera BMI, wzrost daje `skala`
  w `NPC_3D.modele` (baza = 185 cm). Reguła pod kreator: < 21 szczupła,
  21–25 średnia/atletyczna, 25–28 średnia z brzuchem lub krępa, > 28 tęga.
- **Twarz**: tekstura z portretu 2D rzutem z przodu (kalibracja `twarz`
  w presecie), kolor skóry modelu = mediana policzków portretu (brak szwu);
  bez portretu — pixel-art z `build_player_face.py` (gracz, Bogusz).
- **Strój**: przedmioty katalogu w barwach mieszkańca (`stroj`, wartość może
  być słownikiem nadpisań) + odzież spoza katalogu: suknia (krój kamizelki)
  + spódnica (z fartuchem jako plamą koloru), fartuch męski i pas rzutem
  promieni, **pelerynka jako powłoka ciała**. Wysokości stroju jako
  `(kotwica, delta)` — jadą z sylwetką.
- **Nakrycia** (`char3d_hair.NAKRYCIA`): `chusta` (pod brodą) i `kaptur`
  domykają się NA SZYI; `chusta_wiazana` (z tyłu, węzeł na karku);
  `slomkowy` / `filcowy` / `czapka_haft`.
  ⚠⚠ **Nic nie może rozkładać się poziomo od podbródka na barki** — w bazie
  V5 barki sięgają podbródka i każdy taki spływ jest z kamery TALERZEM
  (historia (30) i (35)).
- **Stały strój → zbędne ściany znikają**: skóra pod ubraniem, warstwa
  wewnętrzna pod zewnętrzną, nogi i biodra pod spódnicą. ⛔ Nie u gracza —
  jego ekwipunek się zmienia.
- **Pozy**: dziś **wszyscy stoją `wzdluz`** (dłoń przy boku biodra) — żaden
  preset nie ustawia `poza`. W kodzie są jeszcze `splecione` (dłonie na pasie;
  test: `--poza splecione`), `biodra` i `za_plecami` — ⛔ dwie ostatnie
  odrzucone (kulturysta, skucie; historia (27)–(28)).

⚠ **Pułapki podglądu `npc3d --podglad`:** Workbench NIE pokazuje kolorów
wierzchołków (fartuchy, pas, AO, brzegi — wychodzą białe albo ich nie ma)
i NIE stosuje `skala` z `NPC_3D.modele`. Kolory i wzrost ocenia się w grze.
⚠ W grze: `renderer.snapshotArea` Phasera nie łapie warstwy 3D; w ukrytym
panelu przeglądarki pętla gry stoi (pompuje ją zrzut panelu albo
`game.step`). Model mieszkańca ma `bezTintu` — tint awaryjny sprite'a
przyciemniał Adriana do czerni.

## 6. Weryfikacja zmiany

| bramka | kiedy |
|---|---|
| `build_char3d_base.py` (asercje chodu, poza bezruchu bit w bit) | zmiana bazy |
| `char3d_sprawdz_bron.py`, `char3d_sprawdz_tarcze.py` (z samokontrolą) | zmiana bazy, klipów, chwytu |
| `char3d_variants.py` uruchomiony wprost (60/60, sabotaż świeci) | zmiana osi lub bazy |
| `npc3d --podglad` → `gra_px` + przegląd w grze | zmiana mieszkańca lub wspólnego generatora |
| `dev.missing()` puste, `dev.failed()` = 0 | po każdym eksporcie `.glb` |

⚠ Zmiana wspólnego generatora (`char3d_hair`, `char3d_odziez`, `_SUKNIA`,
reguły ukrywania) dotyka wielu mieszkańców — przepuść podgląd WSZYSTKICH,
nie tylko zgłoszonego, i wyeksportuj każdego, którego dotyczy.

## 7. Po zamknięciu — co gdzie trafiło

| co | gdzie |
|---|---|
| akceptacja bazy V5 jako MASTER | ✅ `OI-134` zamknięte (2026-10-10) |
| kontur postaci | ⛔ `OI-135` odrzucone (2026-10-10) |
| bufor 320×200, mała broń w dłoni, kamera ×0,8, ~8 MB `.glb` mieszkańców — pomiar na S21 FE | 📦 `docs/odlozone.md` §2 (`OI-157`, `OI-158`, `OI-169`, `OI-170`) |
| chwyt oburęczny w marszu, kształt głowy jako oś, rekwizyty w dłoniach, twarz z boku, fryzura gracza pod hełmem | 📦 `docs/odlozone.md` §3 |
| kreator postaci (awatar gracza, biblioteka twarzy, fryzury pod hełmem) | ⏳ osobny etap — `OI-166`, `docs/kreator_postaci.md` |
| humanoidalni wrogowie | odblokowani — nowy etap, gdy autor go otworzy |
| przegląd umiejętności na modelu (2026-10-11): klip `Attack_ShieldBash`, obrót przy Wirze, tint/alfa/upadek gracza | ✅ `docs/dziennik.md` 2026-10-11 (4) — nowy KLIP, baza V5 nietknięta (geometria `char.glb` identyczna co do wierzchołka) |

## 8. Gdzie leżą stare numery (`docs/postac3d_historia.md`)

| odwołanie | treść |
|---|---|
| §1–§10 | stan z 2026-09-19: wersje V1/V2/V3 z md5, odrzucenie V2, proporcje V3, ocena, niezmienniki V3, MCP, testy, plan |
| §11 + „Dopisek 1–32" | rundy V3.3x (nogi, ręce, łokieć, chód, tarcza w ruchu); ⚠ §11 ma błąd jednostek (handoff 2026-09-20 §6) |
| §32–§38 | cios i obrót bez czterech kierunków, wypad, audyt geometrii ataku, tempo ciosu, wycofanie 4 kierunków |
| dopiski 2026-10-03 (1)–(12) | roster broni, pancerz na modelu, bieg, V3.6, NPC = próg, szyja V3.7, czytelność z telefonu, strój startowy, zwierzęta |
| dopiski (13)–(34) | pilot NPC, test A, fasety, V4, V4.5 i warianty, mieszkańcy, stylizacja, twarz z portretu, budowy, V5, twarz gracza, Bogusz |
| dopisek (35) | okrycia bez talerza, przegląd całej wsi (2026-10-10) |
| dopisek (36) | zamknięcie etapu prototypu (2026-10-10) |

Fundament rigu i chodu (A1–A6, kryteria tarczy, `MODEL BASE = LOCKED`
z 2026-09-20): `docs/handoff_2026-09-20_fundament_postaci.md`. Decyzja
o postaci 3D jako źródle: `docs/decyzje/2026-09-08-postac-3d-jako-zrodlo.md`.

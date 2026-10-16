---
typ: HISTORIA
domena: [assets, proces]
tytul: Postać 3D — historia etapów (V1 → V5, mieszkańcy)
stan: zywy
kotwice:
  - tools/char3d_base.py
  - tools/npc3d.py
  - src/render3d/Character3D.ts
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-10
---

# Postać 3D — historia etapów

> ⚠ **To jest `HISTORIA`, nie stan.** Bieżący stan postaci 3D (baza, rig,
> mieszkańcy, polecenia, otwarte sprawy) jest w **`docs/postac3d_checkpoint.md`**
> — zaczynaj TAM. Ten plik czyta się po pomiary, odrzucone warianty i powody.
>
> **Pochodzenie (2026-10-10):** cała treść poniżej linii została PRZENIESIONA
> DOSŁOWNIE z `docs/postac3d_checkpoint.md` (163 KB przy limicie 20 KB dla
> `OPERACYJNE`, kontrakt §8: „historia i relacje z wykonania → `HISTORIA`").
> ⭐ **Numeracja jest zachowana 1:1** — §1–§38, „Dopisek 1–32" (rundy V3.3x)
> i dopiski z datą (1)–(34). Odwołania w kodzie, w dzienniku i w rejestrze
> `OI` typu „`postac3d_checkpoint.md` §38" albo „dopisek (21)" znajdują swój
> tekst TUTAJ, pod tym samym numerem.
>
> ⚠ Sekcje §1–§10 opisują stan z **2026-09-19 (baza V3)**: wersje, proporcje,
> ocena i plan z tamtego dnia. Wszystko to zostało później zastąpione (V3.6,
> V3.7, V4, V4.5, **V5**). Dopiski 1–32 to rundy V3.3x, §11 według handoffu
> 2026-09-20 §6 zawiera błąd jednostek. Nowe etapy DOPISUJE SIĘ na końcu
> tego pliku; checkpoint dostaje tylko zmianę stanu.

---

# Postać gracza 3D — checkpoint 2026-09-19

> ✅ **CHÓD (etap A2) ZAMKNIĘTY 2026-09-20.** Akcja `Walk` jest od tej daty
> **generowana parametrycznie** przez `tools/char3d_walk.py`: symetryczny cykl
> 4-kluczowy (0–3), klatka 4 domyka pętlę, **klatka 5 to poza bezruchu poza
> pętlą**. Obowiązujące parametry: `polkrok 1,55 · uniesienie 0,70 ·
> **bujanie 0,30** · pochylenie_stopy −10°`.
> ⛔ **Nie opisuj już cyklu jako 3-kluczowego** i nie szukaj pozy stojącej
> na klatce 1 — `Character3D` tnie klip `subclip`-em na pętlę 0–4 i zamrożoną
> klatkę 5. Pełny zapis (pomiary, pułapki, czego A2 nie ruszało):
> `docs/handoff_2026-09-20_fundament_postaci.md` §3d.
> ⏳ Jedyna otwarta pozycja samego chodu to **poślizg stopy (`OI-138`)** —
> skala lokomocji, nie animacja.
>
> ⛔⛔ **V3 NIE JEST ZAAKCEPTOWANĄ „MASTER HUMANOID BASE".**
> Jest **aktualną wersją roboczą**, czekającą na ocenę wizualną autora.
> Nikt — ani człowiek, ani kolejna sesja — nie ma prawa nazwać jej bazą
> ani zacząć na niej budować kolejnych humanoidów, dopóki autor nie powie,
> że sylwetka jest dobra. Punkt „MASTER" jest **nieustalony**.

## 1. Trzy wersje i gdzie one fizycznie są

| wersja | co to | plik | md5 |
|---|---|---|---|
| **V1** | model oryginalny (sprzed 2026-09-19) | `blender/wersje/char_v1_oryginal.blend` | `7d6496ad7c48164f2c4e4fae73a48621` |
| **V2** | ⛔ **ODRZUCONA** — „szczupła/manekinowa" | `blender/wersje/char_v2_szczuply_ODRZUCONY_2026-09-19.blend` | `d1caa56d262ac6fdd8eb4645f504c930` |
| V2 (glTF) | ⛔ odrzucona, do porównań | `blender/wersje/char_v2_szczuply_ODRZUCONY_2026-09-19.glb` | `b5ffe49e817ee765ec4fc227d8be2fd4` |
| **V3** | **aktualna wersja robocza** — źródło | `public/assets/char.blend` | `54f8f52c894edccca4d607e1ae035992` |
| **V3** | **aktualna wersja robocza** — to, co wczytuje gra | `public/assets/characters/char.glb` | `094f8498231f104b73fcc70b91e0bd0b` |

⚠ **V1 pochodzi z gita**, z commita `c5e1d4e` (`modeling 3d char`), i jest
tam nadal — plik w `blender/wersje/` to wygodna kopia, nie jedyny egzemplarz:

```bash
git show c5e1d4e:public/assets/char.blend > /tmp/char_v1.blend
```

**Narzędzia:**

| plik | rola |
|---|---|
| `tools/char3d_base.py` | **generator** ciała i głowy z proporcji (893 linie) |
| `tools/build_char3d_base.py` | **przymiar + zapis** (159 linii) |
| `tools/char3d_export_gltf.py` | `char.blend` → `char.glb` (istniał wcześniej) |
| `tools/char3d_sprawdz_bron.py` | bramka broni (istniała wcześniej) |
| `tools/char3d_sprawdz_tarcze.py` | bramka tarcz (istniała wcześniej) |

```bash
# przymiar — NIC nie nadpisuje, renderuje podgląd do docs/podglad/
blender -b public/assets/char.blend --python tools/build_char3d_base.py
# przebudowa i zapis
blender -b public/assets/char.blend --python tools/build_char3d_base.py -- --zapisz
# eksport do gry
blender -b public/assets/char.blend --python tools/char3d_export_gltf.py -- public/assets/characters/char.glb
```

⚠ **`--zapisz` pisze pod JAWNĄ ścieżkę `public/assets/char.blend`**, nie do
pliku otwartego w Blenderze. Wcześniejsza wersja używała `save_mainfile()`
i przy uruchomieniu na kopii z `blender/wersje/` **nadpisała kopię zapasową,
zostawiając `public/assets/char.blend` z poprzednią postacią** — a raport
pisał przy tym „char.blend nadpisany" i był prawdziwy, tylko o innym pliku.
Złapane dopiero na `md5` wyeksportowanego `.glb`.

## 2. ⛔ Dlaczego V2 została ODRZUCONA — nie wracaj w tę stronę

V2 została odrzucona **wizualnie**, przy przechodzących wszystkich asercjach:

- zbyt szczupła — „manekin",
- zbyt wąskie barki (określone jako **kobieca linia barków**),
- zbyt wąski tors,
- **głowa jak pinezka**,
- twarz słabo czytelna w kamerze gry,
- całość wyglądała **jak model z innej stylistyki** niż istniejące NPC-e.

### Lekcja, która to spowodowała

⛔⛔ **Humanoida do TEJ gry nie ocenia się antropometrią.** V2 miała
**6,34 głowy w sylwetce**, co jest bliskie dorosłemu człowiekowi (7,5) i było
zielone wobec mojej własnej asercji „6,5 = dobrze". Ta asercja mierzyła nie to,
co trzeba.

**Benchmarkiem są istniejące NPC-e i render z gameplayu.** Zmierzone na
pixel-artowych NPC-ach (`peasant`, `hanna`, `miller`, `hunter`, `sulislaw`,
`elder`, `father`, `anna`, `witek`) skryptem liczącym profil szerokości:

| miara | NPC-e | V2 (odrzucona) |
|---|---|---|
| głów w sylwetce | **3,0 – 3,9** (średnia ~3,5) | 6,34 |
| szerokość głowy / szerokość barków | **0,64 – 0,71** | 0,33 |
| szerokość sylwetki / wzrost | **0,47 – 0,55** | ~0,25 |

⚠ Pomiar NPC-ów **nie jest zapisany jako skrypt w `tools/`** — powstał
jednorazowo. Jeżeli następna sesja go potrzebuje, liczy profil szerokości
wiersz po wierszu z PNG w `public/assets/characters/` i wykrywa linię barków
jako pierwszy wiersz o szerokości ≥ 72% maksimum.

## 3. Co faktycznie zmieniono w V3 — wartości odczytane z kodu i modelu

**Proporcje** (`tools/char3d_base.py`, słownik `PROPORCJE`), wartości bieżące:

| klucz | V2 | **V3** |
|---|---|---|
| `glow` | 6.5 | **4.6** |
| `bark_polrozstaw` (staw barkowy) | 0.085 | **0.130** |
| `ramie_promien` | 0.034 | **0.052** |
| `nadgarstek_promien` | 0.023 | **0.030** |
| `dlon_szerokosc` | 0.040 | **0.086** |
| `dlon_grubosc` | 0.021 | **0.042** |
| `szyja_promien` | 0.030 | **0.046** |
| `glowa_szerokosc` | 0.76 | **0.72** |
| `glowa_glebokosc` | 0.90 | **0.88** |
| `glowa_linia_wlosow` | 0.72 | **0.655** |
| `ucho_wysokosc` | — | **0.50** (nowy) |

Pionowe punkty orientacyjne V3 (ułamek wzrostu): `kostka` 0.042, `kolano`
0.255, `krocze` 0.440, `biodro` 0.470, `talia` 0.560, `klatka` 0.655,
`bark` 0.725, `obojczyk` 0.745, `czaszka` 0.815.

**Geometria** (dopisana w V3 względem V2): szczęka jako prawie pionowa ściana
profilu między `t=0,06` a `t=0,30` zamiast gładkiego stożka; **uszy** jako
osobna bryła (`ucho_wysokosc`); **włosy z własną objętością** — wierzchołki
powyżej linii włosów idą promieniowo na zewnątrz, więc linia włosów tworzy
widoczny próg zamiast być kolorem malowanym na czaszce; większe plamki oczu.

**Zmierzone na zbudowanym V3** (przymiar, turntable zdjęty, po `apply_zones`):

```
wzrost              12,834 j.
głów w sylwetce     4,48
głowa               2,08 × 2,57 × 2,86 j.   W/H = 0,73
głowa / rozpiętość ciała   45%
ciało               363 wierzchołki, 364 wielokąty, 14 grup wag
głowa               314 wierzchołków, 316 wielokątów
po modyfikatorach   5 286 wierzchołków
strefy głowy        skin 177, hair 133, eyes 4, mouth 2
```

⚠ **W/H głowy wynosi 0,73, a nie 0,81.** Liczba 0,81 padła w raporcie z sesji
i pochodziła z przebiegu POŚREDNIEGO, w którym uszy były o połowę większe
i powiększały skrajnię X głowy (2,31 j.). Po ich zmniejszeniu skrajnia spadła
do 2,08 j. **Wartością bieżącą jest 0,73** i zgadza się z parametrem
`glowa_szerokosc = 0.72`.

### ✅ `OI-137` ZAMKNIĘTE — klucze `PROPORCJE` STERUJĄ (podpięte w A4, 2026-09-20; zmierzone 2026-09-27)

⚠⚠ **Opis niżej jest HISTORYCZNY** — stan z 2026-09-19. A4 podpiął klucze
jako kotwice grup pierścieni (komentarz przy `PROPORCJE` w
`tools/char3d_base.py`), ale rejestr i ten plik tego nie zauważyły.

**Pomiar** (Blender 5.2 bez okna, na KOPII `char.blend`, `zbuduj({klucz: ×1,2})`
kontra przebudowa bazowa): generator odtwarza plik **bit w bit** (0 ruszonych
wierzchołków), a **42 z 44 kluczy coś zmienia**:
- geometrię tułowia, nóg, rąk i głowy — w tym wszystkie czternaście klucze
  z listy niżej poza `masa_kg` i `bark_polszerokosc`;
- **kości** zamiast siatki: `biodro` (3 kości), `talia` (2), `lokiec_wysun` (6);
- **strefę ust** na głowie (atrybut `zona`, nie `material_index`):
  `glowa_linia_ust` przesuwa 2–6 ścian.

Martwe zostają WYŁĄCZNIE `masa_kg` i `bark_polszerokosc` — **oba oznaczone
w kodzie jako OPISOWE z zakazem podpinania**, więc to jest zamierzony stan.
⚠ Mierząc następnym razem, patrz na siatkę, kości ORAZ atrybut `zona` —
pomiar samych wierzchołków fałszywie zgłasza cztery żywe klucze jako martwe.

#### Historyczne brzmienie (2026-09-19)

Tabele pierścieni tułowia i nogi w `_cialo()` mają **wpisane liczby wprost**,
a nie odczyty z `PROPORCJE`. Te klucze są więc dziś **martwe** — zmiana ich
wartości nie zmienia modelu:

```
bark_polszerokosc, biodro_glebokosc, biodro_polszer, klatka_glebokosc,
klatka_polszer, kolano_promien, kostka_promien, krocze, lydka_promien,
masa_kg, szyja_promien, talia_glebokosc, talia_polszer, udo_promien
```

⛔ **To jest realna pułapka dla następnej sesji**: „poszerzam klatkę przez
`klatka_polszer` i nic się nie dzieje". Klatkę poszerza się dziś w liście
`tulow` wewnątrz `_cialo()`. `masa_kg` jest referencją opisową i nie ma
prawa nic robić — reszta powinna zostać podpięta, zanim ktokolwiek nazwie
ten plik generatorem parametrycznym.

## 4. Ocena wizualna — stan na koniec sesji

**V3 jest lepsza od V2 i kierunek jest właściwszy, ale NIE JEST ZATWIERDZONA.**

⛔ **Żaden z poniższych punktów nie jest rozwiązany tylko dlatego, że test
techniczny przechodzi.**

| # | do oceny | stan |
|---|---|---|
| 1 | sylwetka nadal może być **zbyt szczupła** — ⤳ od 2026-10-03: czy **czyta się** w skali gry (NPC-e = próg) | otwarte |
| 2 | ~~twarz **stylistycznie miększa** od NPC-ów~~ ⤳ czy twarz jest **czytelna** (styl NPC-ów nie jest celem) | otwarte |
| 3 | **kontur** — ⤳ wyłącznie jako pytanie o czytelność (`OI-135`) | otwarte |
| 4 | czy **głowa jest już dość czytelna** w normalnej kamerze gry | otwarte |
| 5 | **barki/tors** — czy ubiór i zamach czytają się lepiej niż u Rolnika / Kowala / Hanny | otwarte |
| 6 | ~~**spójność stylu** z pixel-artowymi NPC-ami~~ | ⛔ nie jest kryterium (autor, 2026-10-03) |
| 7 | ~~miecz schodzi ~1,09 j. poniżej stóp~~ | ✅ zamknięte (bramka broni zielona, 2026-10-03) |
| 8 | **tarcza** — działa, brak krytycznego problemu | bez zastrzeżeń |
| 9 | animacje działają, ale ich **jakość wizualna podlega ocenie razem z ostateczną sylwetką** | otwarte |

Kontekst do punktu 7: miecz schodził **1,76 j.** przy V1 i **0,65 j.** przy V2.
Liczba śledzi wysokość dłoni, a ta zależy od wysokości barku, więc **nie jest
to osobna usterka, tylko skutek proporcji**. Model miecza ma ~5,6 j. przy ~4,5 j.
prześwitu od opuszczonej dłoni — samym kątem noszenia tego nie da się uratować
(potrzeba ok. 41° pochylenia).

## 5. ⛔ NIENARUSZALNE — co łatwo zepsuć przy następnej iteracji

Odczytane z `public/assets/char.blend` (V3) i z kodu:

| rzecz | wartość | dlaczego |
|---|---|---|
| nazwy 34 kości | `Bone`, `Bone.001`…, `Bone.002_L.003`, `Bone_R.004`, `HandIK_L.005`… | mapa stref `char3d_zones.BONE_ZONE`, wycinanie pancerza `char3d_armor`, chwyt broni i tarczy |
| nazwa obiektu ciała | **`Cube.001`** | pobierana wprost przez `char3d_zones` i `char3d_armor` |
| nazwa obiektu głowy | **`Cube`** | jw.; parent = **kość `Bone.004`**, `parent_type='BONE'` |
| **skala obiektu `Armature`** | **1,6527** | bronie i tarcze mają rozmiary w przestrzeni LOKALNEJ — zmiana przeskalowałaby CAŁY ekwipunek naraz |
| kość prawej dłoni (broń) | **`Bone.002_R.003`**, head `(−5,234, 0,100, −2,020)`, **długość 0,680 j.** | przedmiot siada na OGONIE tej kości |
| kość lewej dłoni (tarcza) | **`Bone.002_L.003`**, head `(+5,234, 0,100, −2,020)`, długość 0,680 j. | jw. |
| poza spoczynkowa | **T-poza** dla rąk, nogi w dół | akcja `Walk` trzyma obroty WZGLĘDEM spoczynku |
| `roll` kości | zachowywany z pliku wejściowego | lokalne osie = osie animacji |
| kontrolki IK | kierunek i długość **niezmienne**, wolno ruszać tylko GŁOWĄ kości | `pose.bone.location` żyje w lokalnych osiach spoczynku |
| atrybut `zona` na głowie | obecny (`INT`, domena `FACE`) | niesie strefy `skin`/`hair`/`eyes`/`mouth` |
| grupy wag | 24 na ciele (14 z wagami + **10 pustych lustrzanych `_R`**) | `Mirror` przerzuca wagi tylko do grupy, która JUŻ ISTNIEJE |
| modyfikatory ciała | `MIRROR` → `SUBSURF` (1/1) → `ARMATURE` → `SOLIDIFY` | kolejność i poziom podziału |
| akcja w pliku | **`Walk`**, klatki 0–11 | `Attack`, `Walk_Armed*` są **budowane przy eksporcie**, nie leżą w pliku |
| wpięcie w grę | `src/render3d/Character3D.ts`, sloty po przedrostkach `Pancerz_` / `Bron_` / `Tarcza_` | dołożenie przedmiotu w Blenderze nie wymaga zmian w TS |

⚠ **`Walk` ma wkluczowany obrót CAŁEGO OBIEKTU o −90°** na klatkach 0/3/6/9.
Każda ścieżka czytająca tę akcję musi go zdjąć (`char3d_attack.zdejmij_obrot_turntable`).
Zapis do `char.blend` robiony przez `build_char3d_base.py` **celowo następuje
PRZED** tym krokiem i przed `apply_zones`, żeby plik źródłowy nie utrwalił
kroków eksportu.

⚠ **Nadgarstek przesunął się w V3**: V1/V2 miały go na ±5,08 / ±5,09 j.,
V3 ma **±5,234 j.** To jedyny ruch punktu montażowego broni i jest skutkiem
poszerzenia barków (rozpiętość ramion trzymana na równi ze wzrostem).

## 6. Architektura — po co to w ogóle powstaje

Ta postać **nie jest jednorazowym graczem**. Jest prototypem bazy, z której
mają powstawać przyszli gracze, NPC-e, humanoidalni przeciwnicy, sylwetki
kobiece i męskie oraz warianty wyposażenia.

⭐ **Konsekwencja dla kolejnych iteracji: poprawiamy BAZĘ (generator), a nie
rzeźbimy gracza ręcznie.** Docelowo zmiana proporcji albo wariantu humanoida
ma być zmianą **danych**, przy zachowaniu wspólnego rigu i punktów montażowych
tam, gdzie ma to sens. Dzisiejszy stan jest w połowie drogi — patrz pułapka
14 martwych kluczy w §3.

## 7. ⛔ Poza zakresem — czego teraz NIE robimy

Najpierw musi zostać zaakceptowana **jedna** dobra baza humanoidalna.
Do tego czasu nie zaczynamy:

pełnego generatora NPC · modelu kobiecego · modeli przeciwników · pełnego
systemu equipment attachment · wariantów twarzy · pełnych włosów · palców ·
mimiki · systemu personalizacji · nowych animacji · kolejnych modeli broni ·
przebudowy NPC-ów pixel-artowych.

## 8. Blender MCP — ✅ DZIAŁA od 2026-10-03 (opis niżej HISTORYCZNY)

⚠ Połączenie potwierdzone 2026-10-03 (`get_objects_summary` odpowiada), ale
Blender startuje z DOMYŚLNĄ sceną — `char.blend` trzeba w nim otworzyć.
Pipeline (`--python`, bez okna) dalej jest źródłem prawdy; MCP służy do
podglądu na żywo. Stan z 2026-09-19:

Stan na 2026-09-19, sprawdzony dwukrotnie w trakcie sesji:

- serwer MCP `blender` kończy się `CONNECTION_CLOSED`,
- **`uvx` nie jest dostępne** — brak `uv` w `PATH` (`.mcp.json` uruchamia
  `uvx blender-mcp`),
- Blender **5.2.1 LTS działa** (proces obecny), ale **addon BlenderMCP nie
  nasłuchuje na porcie 9876** — brak jakiegokolwiek portu nasłuchu tego procesu.

**Warunek techniczny na następną sesję** (dwa niezależne kroki, oba konieczne):

```bash
pip install uv          # albo winget install astral-sh.uv
```

a następnie w otwartym Blenderze włączyć panel **BlenderMCP** i kliknąć
**„Connect to Claude"**, po czym port 9876 musi zacząć nasłuchiwać.

⛔ **Nie przedstawiaj MCP jako działającego.** Cała praca tej sesji szła przez
`blender --background --python` (`bpy`), a **ocena wizualna V3 została zrobiona
na rzeczywistych zrzutach z działającej gry**, nie na renderach z Blendera.
Skryptowany render w Blenderze **nie jest równoważny** testowi wizualnemu.

## 9. Testy — stan faktyczny na koniec sesji

| test | wynik |
|---|---|
| `npx tsc --noEmit` | ✅ czysto (kod gry nietknięty) |
| `npm run build` | ✅ `built in 14.97s` |
| eksport glTF | ✅ `char.glb` 522 660 bajtów |
| wczytanie w grze | ✅ `dev.missing` puste, `load.totalFailed` = 0, brak błędów w konsoli |
| animacje | ✅ 5 klipów, chód i cios działają |
| koszt mostu 3D | p50 **0,9 ms**, p95 1,1, p99 1,3, max 2,1 (600 klatek, bufor 96×128, desktop) |
| bramka tarcz | ✅ obie tarcze OK, żadna nie zamiata gruntu |
| bramka broni | ⚠ **27 błędów** (V1 miał 29) |

Rozbiór 27 błędów bramki broni:

- **22 × „brak modelu 3D dla broni z `GameConfig`"** — katalog broni ma
  **37 konstrukcji**, modeli 3D jest **11**. ⛔ **To jest stan sprzed tej pracy
  i osobny problem — nie naprawiaj go przy okazji bazy humanoidalnej.**
  Ma już swój numer: **`OI-109`** (opisany tam jeszcze jako „19 z 30" — katalog
  urósł od tamtego zapisu, liczba modeli nie).
- **1 × miecz schodzi 1,09 j. pod stopy w chodzie** (limit 0,30) — §4 pkt 7,
- pozostałe to pochodne powyższych w raporcie zbiorczym.

Chwyt oburęczny: lewa dłoń **0,39 j.** od drzewca przy limicie 0,55 — mieści się.

## 10. Plan następnej sesji — kolejność

| krok | co |
|---|---|
| **1** | **Ocena V3 przez autora.** Nic innego nie zaczyna się przed tym. |
| **2** | Jeżeli sylwetka zaakceptowana → dopracowanie stylistyczne **twarzy i konturu**. |
| **3** | Jeżeli nadal za szczupła → korekta **barków / klatki / torsu**, bez niszczenia rigu (patrz §5 i pułapka martwych kluczy w §3). |
| **4** | Naprawa **pozycji/rozmiaru miecza w chodzie**. |
| **5** | Ponowny test: bez wyposażenia → miecz → miecz + tarcza → ruch → atak. |
| **6** | Porównanie z istniejącymi NPC-ami (Rolnik, Kowal, Hanna) — **czy 3D czyta się LEPIEJ**, nie czy jest podobne. |
| **7** | **Dopiero po akceptacji autora** — oznaczenie wersji jako MASTER HUMANOID BASE. |
| **8** | Dopiero wtedy przygotowanie kolejnych humanoidów. |

⚠ Podgląd renderuje się do `docs/podglad/` i ten katalog jest **w `.gitignore`**
— jest generowany przy każdym przebiegu przymiaru, nie jest dokumentacją.

## 11. V3.3i (2026-09-19) — nogi/stopy w mesh, i dlaczego POSTAWA to NIE mesh

⚠ **Ten dokument nie ma wpisów V3.1-V3.3h** — te rundy się odbyły (w tej samej
sesji, przed kompaktowaniem kontekstu), ale checkpoint nie został wtedy
zaktualizowany. Nie odtwarzaj tej historii z pamięci we wpisie — jeśli
potrzebna, jest w dzienniku sesji/transkrypcie, nie tutaj.

**Zmiany w `tools/char3d_base.py` (mesh, bezpieczne, bez ryzyka dla riggingu):**

- `kolano`: 0,255 → 0,230 — udo i łydka były niemal równe (0,215 vs 0,213 j.),
  stąd „bocianie nogi". Kolano niżej przenosi ~0,025 wzrostu z łydki do uda
  (teraz 0,240 vs 0,188), CAŁKOWITA długość nogi (biodro-kostka) NIETKNIĘTA.
- `noga_polrozstaw`: 0,075 → 0,082 — szersza PODSTAWA (rozstaw osi nóg), nie
  promień - inna dźwignia niż `udo_promien`/`lydka_promien`.
- `stopa_szerokosc`: 0,070 → 0,088 — stopa z przodu wyraźnie większa
  (zgłoszone wprost, z odniesieniem do WoW/Myśliwego). Długość stopy
  nietknięta.

Zweryfikowane: `tsc --noEmit` czysto, `dev.missing`/`load.totalFailed`=0 w
grze, bramka tarcz OK, bramka broni bez NOWYCH błędów (patrz niżej).

### ⚠⚠ Odkrycie: "manekinowe ręce"/"bocianie nogi" to POZA, nie mesh

**Przedramię i łydka mają wiąz IK celujący w `HandIK_*.005`/`FootIK_*.006`.
Górne człony (ramię/udo) NIE MAJĄ własnej rotacji w akcji `Walk`** (sprawdzone
wprost we fcurve — tożsamościowy kwaternion na każdej klatce) — kąt zgięcia
stawu jest WYŁĄCZNIE funkcją odległości kontrolki od barku/biodra względem
PEŁNEGO zasięgu kończyny.

Zmierzone (klatki 0-2 chodu, rig V3.3i): kontrolka dłoni siedzi **3,49 j.**
od barku przy naturalnym zasięgu ramienia **2,11 j.** (165%); kontrolka stopy
**5,1-5,5 j.** od biodra przy naturalnym zasięgu nogi **3,33 j.** (153-165%).
Kontrolki IK mają `use_stretch=True`, więc solver przy tak przesadzonym celu
**nie gnie stawu — ROZCIĄGA kości w idealnie prostą linię**, bo to jedyny
sposób dosięgnięcia punktu dalej niż pełny wyprost. **Żaden kształt mesha
(embed barku, łuk ramienia „(", redystrybucja masy nogi...) nie może pokazać
zgięcia, którego bryła kości fizycznie nie ma.** Cel animacji jest STARY —
pochodzi sprzed przebudowy bazy (2026-09-19) i nigdy nie został przeliczony
pod nowe długości kończyn, w odróżnieniu od `Attack`/`Walk_Armed`, które mają
własny przelicznik (`char3d_attack._przelicznik`/`_przenies`).

⛔ **Próba naprawy w tej sesji (przysunięcie kontrolek IK bliżej stawu,
`tools/char3d_walk_posture.py`, USUNIĘTY po nieudanej próbie) NIE ZADZIAŁAŁA.**
Nawet przy celu geometrycznie W ZASIĘGU (np. 90% naturalnego zasięgu ramienia),
solver IK (iteracyjny, 500 iteracji, `chain_count=3`) **konsekwentnie zostawiał
efektor dokładnie tam, gdzie był** (odległość od barku niezmieniona co do
trzeciego miejsca po przecinku, niezależnie od tego, czy jakobian liczono raz
czy świeżo w każdej iteracji) — najprawdopodobniej lokalne minimum solvera przy
w pełni rozciągniętej, idealnie prostej konfiguracji startowej. **To wymaga
albo żywego podglądu w Blenderze (MCP nie działa w tej sesji - patrz §8), albo
innej techniki** (np. rozwiązanie zgięcia analitycznie z twierdzenia
cosinusów i ustawienie kontrolki na wynik, zamiast liczyć na solver Blendera).
Nie próbuj tej samej metody (przysunięcie promienia + iteracja Newtona) bez
nowego pomysłu na ominięcie tego minimum — już raz nie zadziałała.

**Konsekwencja dla przyszłych sesji:** dalsze rundy mesha (kolejne V3.3x) NIE
poprawią czytelności zgięcia łokcia/kolana w `bezruch` — to jest oddzielny,
nierozwiązany problem animacji, warty własnej, ostrożnej sesji z żywym
podglądem, nie kolejnej iteracji `char3d_base.py`.

### Bramka broni — bez nowych błędów, jeden PRZEDTEM już znany

`char3d_sprawdz_bron.py` po V3.3i: 26 × brak modelu 3D (katalog urósł do 37
pozycji, `OI-109`, bez zmian z tej sesji), 1 × miecz schodzi pod stopy w
chodzie (znane, ~1 j., niezmienione), 3 × chwyt oburęczny (`spear`/
`battle_axe`/`war_hammer`, lewa dłoń 1,46 j. od drzewca przy limicie 0,55) —
**wszystkie trzy pre-existing, potwierdzone porównaniem z checkpointem sprzed
V3.3i** (identyczne liczby). Dodatkowo `Attack_2H` zgłasza 5/5 pozycji poza
tolerancją dla prawej dłoni (błąd 1,08-3,43 j.) — **też pre-existing**,
zmierzone wprost: cofnięcie `kolano`/`noga_polrozstaw`/`stopa_szerokosc` do
wartości V3.3h **nie zmienia pozycji barku ani zasięgu ramienia ani o
milimetr** (identyczne `bark`/`reach` przed i po cofnięciu), więc to nie jest
regresja tej sesji — to ten sam, znany rozjazd kalibracji ataku z rigiem,
pogłębiony w którejś z rund V3.1-V3.3h (nieudokumentowanych tutaj, patrz
uwaga na początku tej sekcji). Osobny temat, poza zakresem tej rundy.

### Dopisek: boczny "wychył" (kontrapost) w `Walk` — `tools/char3d_walk_lean.py`

To DZIAŁA, w odróżnieniu od próby zgięcia łokcia/kolana wyżej — z innego
powodu: kości kręgosłupa (`Bone`=miednica-talia, `Bone.001`=talia-klatka,
`Bone.002`=klatka-obojczyk) są zwykłymi kośćmi FK, bez wiązu IK, więc
przypisana rotacja po prostu działa, bez solvera po drodze.

Dodano stały boczny skłon wokół LOKALNEJ osi Z (zmierzone probą: lokalne X =
pochylenie przód-tył, Y = skręt, Z = wychył boczny) na klatkach 0-3 akcji
`Walk`, doklejony przez mnożenie kwaternionów (istniejący @ dodatek), więc
naturalne wahanie chodu (już tam było, sprawdzone we fcurve) zostaje
nietknięte. Kąty: biodro +20°, talia -14°, klatka -4° (kości są zagnieżdżone
i sumują się w górę łańcucha, stąd ujemne wartości częściowo znoszą
nachylenie, żeby ramiona zostały blisko poziomu, a głowa prawie pionowo).

Zweryfikowane: bramka tarcz OK, bramka broni bez nowych błędów — a przy
okazji dwa ZNANE, pre-existing problemy złagodniały (chwyt oburęczny
1,46→0,56 j. od limitu 0,55; miecz w chodzie 0,95→0,74 j. pod stopami przy
limicie 0,3), przypadkowy efekt uboczny zmiany kształtu torsu, nie celowa
naprawa.

Otwarte: nogi w `bezruch` nie dostały analogicznej asymetrii (jedna noga
lekko ugięta/przeniesiona ciężarem) — wraca do tego samego bloku co zgięcie
kolana wyżej (`FootIK` zablokowane przez solver IK). Kąty (20°/-14°/-4°) to
pierwsza próba, oceniona na jednym zrzucie z gry — kolejna runda może
wymagać dostrojenia w górę lub w dół.

### Dopisek 2: ręce ODCHYLONE OD TUŁOWIA — i poważny błąd idempotencji po drodze

⚠ **Pierwsza interpretacja „wychyl" (S-krzywa kręgosłupa wyżej) była
niewłaściwa.** Autor sprecyzował: chodziło o to, żeby ręce nie wyglądały „na
baczność" w widoku frontowym — czyli o WIDOCZNĄ PRZERWĘ między ramieniem a
tułowiem, nie o pochylenie miednicy. Dodano `dodaj_rozchylenie_ramion` w tym
samym module: przesuwa kontrolki `HandIK_L/R.005` o 0,45 j. DALEJ na zewnątrz
(świat X) na klatkach 0-3.

⚠ **To DZIAŁA, bo idzie w przeciwnym kierunku niż nieudana próba zgięcia
łokcia** (patrz wyżej) — tam PRZYSUWANIE celu bliżej barku niż pełny zasięg
wpadało w osobliwość solvera IK. Tutaj cel idzie DALEJ (odległość od barku
ROŚNIE) — to ten sam rodzaj ruchu, co już działa w oryginalnym cyklu (ramię
jest i tak rozciągnięte ponad naturalny zasięg przez `use_stretch`), więc
solver nie ma nic do „wymyślenia": zbieżność 0,03-0,55 j. od celu, zero
przypadków utknięcia.

⛔⛔ **Po drodze złapany POWAŻNY błąd idempotencji, wart zapamiętania na
przyszłość.** Pierwsza wersja obu funkcji (`dodaj_wychyl` i
`dodaj_rozchylenie_ramion`) liczyła nową pozę jako `biezaca_z_pliku @
dodatek` — poprawnie przy PIERWSZYM przebiegu, ale `build_char3d_base.py`
jest wołany za każdym `--zapisz`, a plik startuje od tego, co ostatnio
zapisano. Przy DRUGIM przebiegu „bieżąca" była już poprzednią poprawką, więc
kąt/odsunięcie SIĘ PODWAJAŁO, i tak dalej przy każdym kolejnym zapisie.
Objaw, który to zdradził: `wzrost_j` w raporcie kurczyło się z każdym
przebiegiem (13,18 → 12,22 → 11,33...), bo postać coraz mocniej się
przechylała i rozkładała ramiona, aż sylwetka spłaszczała się w pionie. Do
tego doszła osobna, gorsza usterka przy próbie „naprawy przez czyszczenie
pozy" (`pb.rotation_quaternion = identity` na żywo) — zamiast pomóc,
POPSUŁA geometrię głowy (wymiar Y skoczył z 2,50 na 1,33 j., liczba
wierzchołków z 6054 na 6162) — wycofana, przyczyna nie do końca zdiagnozowana
i **nie warta ponownej próby bez żywego podglądu**.

✅ **Naprawa: `ORIG_ROT`/`ORIG_LOC`** — obie funkcje liczą teraz od wpisanych
NA SZTYWNO oryginalnych wartości akcji `Walk` (zmierzone raz na czystym `git
show HEAD:public/assets/char.blend`, sprzed jakiejkolwiek pracy tej sesji nad
postawą), nigdy od tego, co akurat leży w pliku. Zweryfikowane wprost:
`--zapisz` uruchomiony trzykrotnie pod rząd daje IDENTYCZNY `wzrost_j`
(13,18) za każdym razem.

**Lekcja dla `tools/CLAUDE.md` reguły nr 2 (generator ma być PRZYMIAREM /
idempotentny):** dotyczy to również generatorów, które modyfikują ISTNIEJĄCE
krzywe animacji na bazie samych siebie — nie tylko tych, co piszą nowe pliki.
Test na czerwono, który by to złapał od razu: uruchom `--zapisz` DWA razy pod
rząd i porównaj liczby w raporcie.

Zweryfikowane po naprawie: bramka tarcz OK, bramka broni — te same trzy
znane, pre-existing błędy co poprzednio (chwyt oburęczny 0,56 j., miecz w
chodzie 0,74 j.), `tsc --noEmit` czysto, `dev.missing`/`load.totalFailed`=0 w
żywej grze, zrzut z zoomem 6x pokazuje wyraźną przerwę ramię-tułów po obu
stronach.

### Dopisek 3: ODWRÓT od IK, powrót do mesha — poprawny "diament" ramienia

⚠⚠ **Dopisek 2 (ręce odsunięte przez `HandIK`) i wychył kręgosłupa ZDJĘTE z
pipeline'u.** Zgłoszone wprost jako „zataczający się pijak": cała, sztywna,
PROSTA ręka wychylona na zewnątrz w jednym kawałku (bo IK i tak trzyma ją
prostą - patrz dopisek 1) plus przechył całego tułowia dały razem wrażenie
kołysania/zataczania się, nie naturalnej postawy. Autor narysował referencję:
łokieć ma być WYRAŹNIE dalej od tułowia niż bark i nadgarstek (diament/romb),
nie cała ręka przesunięta o stały kąt. `char3d_walk_lean.py` zostaje w
`tools/` jako działający, idempotentny kod, ale `build_char3d_base.py` go
NIE WOŁA - oryginalna akcja `Walk` przywrócona 1:1 (`ORIG_ROT`/`ORIG_LOC`).

✅ **Zamiast IK: pogłębiony `_luk_ramienia`** w `char3d_base.py` (mesh, zero
ryzyka dla riggingu — dokładnie ta sama, wcześniej bezpieczna technika z
V3.3f/g, tylko z inną amplitudą i o jeden wymiar więcej). Amplitudy bark→
łokieć/łokieć→nadgarstek zwiększone ~3× (0,014/0,006 → 0,046/0,020 do
łokcia; 0,022/0,018 → 0,052/0,044 od łokcia) — poprzednia była mniejsza niż
promień samego ramienia, więc "diament" ginął w grubości kończyny.

⚠⚠ **Odkrycie po drodze: przesunięcie w osi REST-Z ramienia (`zb`), NIE w
osi X/Y, daje boczną (widoczną z przodu) wybrzuszkę.** Pierwsza próba
zwiększenia tylko istniejących X/Y dawała wybrzuszenie widoczne z BOKU
(profil), ale ŻADNEGO z przodu — bo w T-pozie (spoczynek) ramię biegnie
wzdłuż światowego X, a po obróceniu do zwisającej pozy (chód/bezruch) to
własnie REST-Z (dotąd stała `zb`, nigdy nieoffsetowana) mapuje się na
światowe X (boczne, to co widać z przodu), a REST-X mapuje się na światowe Z
(pionowo, wzdłuż zwisającej ręki). Dodano trzeci składnik `dz` do
`_luk_ramienia` (zwraca teraz `(dx, dy, dz)`) - `dz` rośnie do łokcia (+0,060)
i wraca w okolice zera przy nadgarstku (-0,010) - to on tworzy widoczny z
przodu diament, `dx`/`dy` dają dodatkowo lekkie wybrzuszenie w profilu.

Zweryfikowane: bramka tarcz OK, bramka broni wraca do liczb SPRZED dopisku 2
(chwyt oburęczny 1,46 j., miecz w chodzie 0,95 j. — te same, znane,
pre-existing wartości, bo zmiana jest czysto mesh, nie dotyka `Walk`), `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 6x —
widoczny diament po obu stronach, żadnego wychylenia tułowia.

### Dopisek 4: przedramię "trzymało się za tyłek" — spłaszczony odcinek łokieć→nadgarstek

Zgłoszone z narysowaną czerwoną linią odniesienia: odcinek łokieć→nadgarstek
wracał ZA MOCNO do środka/do tyłu (`dy` -0,020→-0,044, `dz` +0,060→-0,010 -
ujemne `dz` cofa nadgarstek ZA oś barku), więc przedramię czytało się jak
dłoń trzymająca się pośladka zamiast zwisać w dół. Poprawka: `dy` przy
nadgarstku spłaszczone do -0,010, `dz` do +0,020 (zostaje PRZED osią barku,
nie za nią) - łokieć (szczyt diamentu) NIETKNIĘTY. Przedramię teraz opada
bardziej pionowo od wysuniętego łokcia, zamiast zakrzywiać się w stronę
pleców. Zweryfikowane identycznie jak dopisek 3 (te same liczby bramki
broni/tarcz, `tsc` czysto, sprawdzone w żywej grze).

### Dopisek 5: wyraźniejszy kontrast mięsień/staw na rękach i nogach

Zgłoszone rysunkiem odniesienia (czerwony obrys narysowany w Paincie,
odbity w pionie i nałożony na render) — biceps/przedramię i udo/łydka mają
być WYRAŹNIE szersze niż sąsiadujące stawy (łokieć/kolano), więcej niż
dotychczas. To WAHADŁO tego samego parametru, co V3.2 (kontrast podniesiony)
→ V3.3d (kontrast zdjęty, bo "segment+segment+segment") → teraz znowu w górę,
ale celowo NIE do poziomu V3.2 — promienie STAWÓW (łokieć, kolano) też
zwężone, nie tylko brzuśce powiększone, żeby kontrast czytał się jako
"mięsień", nie jako z powrotem widoczne oddzielne segmenty.

Ramię (`ramie` w `_cialo`): biceps 0,87→1,02× (ponad naramiennik), łokieć
0,87→0,68× (wyraźnie węższy staw), brzusiec przedramienia 1,17→1,38×.
Noga (`noga`): szczyt uda 0,069→0,078, kolano 0,045/0,044→0,038/0,037,
szczyt łydki 0,059/0,060→0,068/0,069. Kostka i naramiennik (jedyny punkt
NAPRAWDĘ widoczny na zewnątrz z V3.3d/f) NIETKNIĘTE.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby (zmiana
czysto mesh, promienie nie dotykają kości/wag), `tsc` czysto,
`dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 6x — widoczny
kontrast na obu rękach i obu nogach.

### Dopisek 6: profil przedramienia i stopy skręcone na zewnątrz

Dwie niezależne poprawki w tej samej rundzie:

1. **Przedramię z boku czytało się jako oderwana bryła**, nie mięsień - skok
   promienia 1,38×→1,06× (dopisek 5) na JEDNYM kroku plus wypchnięcie w przód
   (`dy`) dawały razem "kluskę" doklejoną do ręki. Naprawa: dodany pierścień
   pośredni (0,35→0,55→0,78→nadgarstek zamiast 0,35→0,70→nadgarstek) łagodzi
   skok promienia, a `dy` zdjęte niemal do zera (-0,020/-0,010 → -0,008/-0,004)
   - diament w widoku FRONTOWYM (`dz`) i pozycja łokcia (`dx`) NIETKNIĘTE,
   to wyłącznie profil.
2. **Stopy skręcone NA ZEWNĄTRZ** - zgłoszone wprost. Nowa funkcja
   `_skret_stopy(y)` w `_cialo()`: czubek stopy dostaje odchylenie w X rosnące
   od pięty (0) do czubka (+0,028×H) - stopa przestaje być równoległa do osi
   Y, czubek ucieka od osi ciała. Pięta (punkt kontaktu z kostką) NIETKNIĘTA.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby (miecz w
chodzie 0,95→0,93 j., różnica w szumie pomiaru), `tsc` czysto,
`dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 6x - stopy
wyraźnie skręcone na zewnątrz, przedramię czytelniejsze z profilu.

### Dopisek 7: dziura w łokciu (prawdziwa, nie złudzenie) + dłoń "trzymająca się tyłka"

Zgłoszone zrzutem z gry pokazującym RZECZYWISTE tło przeświecające między
ramieniem a przedramieniem - łokieć (dopisek 5) był RÓWNOCZEŚNIE najwęższy
(0,68/0,72×) i najbardziej wysunięty na zewnątrz (szczyt diamentu w `dz`),
więc pod kątem widocznym w grze sylwetka miała wnękę na tyle głęboką, że
przez nią widać tło - nie dziura topologiczna, ale realny efekt na renderze.

Naprawa (trzy niezależne zmiany, mesh, zero ryzyka dla riggingu):
1. **Promień łokcia podniesiony** (0,68/0,72× → 0,78/0,82×) - zamyka wnękę,
   pozycja (diament) NIETKNIĘTA.
2. **Nadgarstek wysunięty dalej na zewnątrz** (`dz` 0,020× → 0,038×) i dalej
   W DÓŁ (`dx` 0,010× → 0,020×, ta oś mapuje się po pozowaniu na pionową
   długość kończyny - patrz dopisek 3) - przedramię opada bardziej pionowo i
   dalej od bioder, zamiast czytać się jak dłoń trzymająca pośladek.
3. **Nadgarstek i dłoń pogrubione** (`nadgarstek_promien` 0,030→0,034,
   `dlon_szerokosc` 0,086→0,098, `dlon_grubosc` 0,042→0,048) - większa,
   wyraźniejsza bryła czyta się jako dłoń, nie jako palce.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 8x -
wnęka w łokciu zamknięta, dłoń wyraźnie odsunięta od bioder.

### Dopisek 8: przedramię dłuższe KOSZTEM ramienia

Zgłoszone wprost. `PROPORCJE["ramie"]` 0,1575→0,1425, `PROPORCJE["przedramie"]`
0,1440→0,1590 - suma NIETKNIĘTA, więc **rozpiętość ramion (== wzrost) i
pozycja nadgarstka względem barku zostają te same** (`_uklad` liczy obie
długości z tego samego stałego `dl`) - to jest realna zmiana KOŚCI (długość
ramienia/przedramienia), nie mesha, ale w ustalonym, bezpiecznym wzorcu
(pozycja stawu, nie nazwa/hierarchia/skala).

⚠ Bramka broni: chwyt oburęczny pogorszył się nieznacznie (1,46→1,61 j. od
drzewca) - to ten sam, znany, pre-existing rozjazd kalibracji ataku z rigiem
(patrz dopisek 2 i checkpoint głównego tekstu), poruszony przez zmianę
proporcji ramienia, NIE nowy błąd. Miecz w chodzie i tarcze bez zmian.

Zweryfikowane: `tsc` czysto, `dev.missing`/`totalFailed`=0, sprawdzone w
żywej grze zoomem 8x - przedramię widocznie dłuższe względem rękawa.

### Dopisek 9: dłoń bliżej środka, uda pochylone do środka, biodro niżej

Cztery drobne, niezależne dostrojenia w jednej rundzie (zgłoszone wprost,
autor ocenił poprzednią rundę jako "lepiej" i poszedł dalej w tym samym
kierunku):

1. **Dłoń cofnięta bliżej środka** - `dz` przy nadgarstku w `_luk_ramienia`
   0,038× → 0,028× (połowa drogi między "za blisko tyłka" 0,020× a "za daleko"
   0,038×). `dx` (zasięg w dół) NIETKNIĘTY.
2. **Górna część uda węższa w styku z biodrem** - pierścień "gorne udo"
   (z(0.446)) 0,065/0,063× → 0,058/0,056×. SZCZYT UDA (masa mięśnia, z(0.427))
   NIETKNIĘTY.
3. **Całe udo pochylone bardziej do środka** - punkty taperu `xl(0.22)`→
   `xl(0.32)`, `xl(0.38)`→`xl(0.48)` (te same wysokości Z, większe "t" ciągnie
   punkt bliżej kostki = bliżej osi ciała).
4. **Najszersza część biodra zniżona** - było plateau 0,101×/0,101× na
   0,425/0,470, teraz szczyt na 0,400 (0,098×), a 0,425/0,470 opadają
   łagodnie (0,096×/0,092×) zamiast trzymać płaskie maksimum. Talia (0,560) i
   wyżej NIETKNIĘTE.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 8x.

### Dopisek 10: "gumiaki do kolan" — łydka metodą z V3.3d, nie punktową poprawką

Zgłoszone wprost: przejście kolano→łydka wyglądało jak sztywna cholewka buta.
Diagnoza: skok promienia 0,037×→0,068× (V3.3k) na JEDNYM kroku - dokładnie
ten sam rodzaj błędu co "segment+segment+segment" na ramieniu w V3.3d.
Naprawa TĄ SAMĄ metodą (więcej małych kroków zamiast jednego skoku, szczyt
przesunięty dalej od kolana i obniżony), zamiast zgadywania jednej liczby:

- Kolano (0,038/0,037×) NIETKNIĘTE.
- Trzy nowe pierścienie pośrednie zamiast jednego skoku: narastanie
  (xl 0.63, 0,048×) → szczyt łydki (xl 0.68, 0,058× - był 0,068× na xl 0.66,
  teraz niżej i dalej od kolana) → początek zwężania (xl 0.74, 0,050×) →
  dalsze zwężanie (xl 0.80, 0,041×) → reszta (xl 0.88/0.94/kostka) NIETKNIĘTA.
  Ciąg promieni a: 0,037/0,048/0,058/0,050/0,041/0,033/0,030/0,028 - jeden
  szczyt, potem stały spadek, bez skoku.

Przy okazji kontynuacja dwóch wątków z dopisku 9 (ten sam kierunek, kolejny
mały krok):
- **Obwód biodra** dalej w dół: 0,098/0,096/0,092× → 0,093/0,091/0,088×.
- **Górna część uda w styku z biodrem** węższa (0,058×→0,052×) i **cała noga
  pochylona mocniej do środka** (`xl(0.32)`→`xl(0.38)`, `xl(0.48)`→`xl(0.45)`
  - uwaga: kolejność `t` musi zostać ROSNĄCA wzdłuż nogi, inaczej siatka się
  zapętla do tyłu - złapane i poprawione w tej samej rundzie, zanim trafiło
  do zapisu).

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 8x -
łydka czyta się jako mięsień ze stopniowym zwężeniem, nie jako cylinder.

### Dopisek 11: przedramię przechylone na zewnątrz (wybrzuszenie w środku odcinka)

Zgłoszone rysunkiem z widoku od tyłu: samo przedramię (nie tylko końcówka
przy nadgarstku) ma się przechylać bardziej na zewnątrz. Dodano composowalne
wybrzuszenie `4·t·(1-t)` (parabola, szczyt przy t=0,5 - środek drogi
łokieć→nadgarstek) do `dz` w drugiej gałęzi `_luk_ramienia`, amplituda
0,024×. Końce (łokieć, nadgarstek) NIETKNIĘTE - to jest dodatek WYŁĄCZNIE w
środku odcinka, nie przesunięcie punktów granicznych ustalonych w dopiskach
3/9/... wcześniej.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby (zmiana
czysto mesh), `tsc` czysto, `dev.missing`/`totalFailed`=0, sprawdzone w
żywej grze zoomem 8x - widoczne wybrzuszenie przedramienia na zewnątrz.

### Dopisek 12: dopisek 11 COFNIĘTY — "pozycja bramkarza", zła diagnoza kierunku

⛔ **Dopisek 11 był błędem.** Zgłoszone wprost: nałożone na już istniejące
wysunięcie przy łokciu i nadgarstku wybrzuszenie w środku przedramienia dało
całą rękę wypchniętą na zewnątrz od barku po dłoń - czyli sylwetkę gotowości
("bramkarz"), nie zwis. Do tego złudzenie optyczne: mocne boczne wygięcie
skracało WIZUALNIE odcinek łokieć-nadgarstek, mimo że kość jest dłuższa od
dopisku 8 - stąd wrażenie "krótkie przedramię, długie ramię, jak deformacja".

**Naprawa - inna oś, nie to samo z mniejszą amplitudą:**
- Wybrzuszenie z dopisku 11 USUNIĘTE w całości.
- **Łokieć cofnięty W PROFILU** (`dy` na gałęzi bark→łokieć: -0,008 → -0,016).
- **Przedramię pochylone LEKKO DO PRZODU od łokcia** (`dy` przy nadgarstku:
  -0,004 → +0,006) - łokieć z tyłu, dłoń lekko z przodu, naturalne złamanie
  w profilu zamiast prostej linii.
- **Więcej zasięgu W DÓŁ** (`dx` przy nadgarstku: 0,020× → 0,038×) - dłoń
  opada bardziej pionowo zamiast po skosie do bioder, przedramię czyta się
  jako dłuższe (bez zmiany faktycznej długości kości).
- Boczne wysunięcie diamentu (`dz`, widoczne z przodu) NIETKNIĘTE - problem
  był wyłącznie w profilu/wypchnięciu sumarycznym, nie w kształcie frontowym.

⚠ **Lekcja:** to już drugi raz w tym wątku (po dopisku 4 - "trzyma się za
tyłek"), gdy kolejna, osobno rozsądna poprawka w TYM SAMYM miejscu (koniec
przedramienia) skumulowała się z poprzednimi w coś, czego nikt osobno nie
chciał. Przy dalszym dostrajaniu ramienia sprawdzaj CAŁY łańcuch zmian
`_luk_ramienia`, nie tylko najnowszy dodatek.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze na zoomie 1x
i 4x (pełna sylwetka, nie tylko zbliżenie) - naturalny zwis, bez gestu
gotowości.

### Dopisek 13: PRZEPROST w profilu (dopisek 12 zawierał ten sam błąd co dopisek 11)

⛔ Dopisek 12 naprawił "bramkarza", ale wprowadził NOWY, pokrewny błąd:
łokieć (`dy` -0,016) był NAJBARDZIEJ cofniętym punktem całej ręki, a
nadgarstek (`dy` +0,006) już z powrotem do przodu - ciąg bark(0)→łokieć
(-0,016)→nadgarstek(+0,006) był zygzakiem, który PRZEKRACZAŁ punkt startowy
(0) w stronę przodu. Wizualnie: staw wyglądał, jakby zginał się w złą stronę
(przeprost - hiperekstensja), zamiast płynnie w jedną.

Naprawa: **cały ciąg `dy` płynny w JEDNĄ stronę, nigdy nie przekracza zera**
- bark(0) → łokieć(-0,005, blisko neutralnego, NIE najgłębszy punkt) →
nadgarstek(-0,001, dalej PRAWIE neutralnie, nigdy do przodu). Przy okazji
zmniejszony diament z przodu (`dz` przy łokciu: 0,060×→0,046×) - zgłoszone
wprost jako "łokcie za daleko od ciała".

⚠ **Wzorzec do zapamiętania na przyszłość przy tej konkretnej krzywej:**
dwa razy z rzędu (dopisek 11 i 12) poprawka DODAJĄCA wychylenie w jedną
stronę na końcu odcinka, bez sprawdzenia znaku/kierunku WZGLĘDEM sąsiednich
punktów całego ciągu, dała zygzak zamiast płynnej krzywej. Przy każdej
kolejnej zmianie `_luk_ramienia` sprawdzać ciąg (bark, łokieć, nadgarstek)
jako CAŁOŚĆ, czy jest monotoniczny w każdej osi osobno - dokładnie ta sama
zasada co "ciąg liczb" z V3.3d dla promieni ramienia.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 1x i
4x obok Rolnika/Hanny - ręka w profilu jedną płynną linią, łokcie bliżej
ciała z przodu.

### Dopisek 14: porównanie z Myśliwym — postawa bardziej osadzona, ręce prostsze

Poproszony o analizę bez matematyki: zestawienie z Myśliwym (referencyjny
NPC) pokazało, że postawa gracza czyta się jako mniej stabilna, a ręka wciąż
zbyt mocno rozstawiona względem prostszego, bardziej naturalnego zwisu u
Myśliwego. Dwie zmiany:

1. **Szerszy rozstaw nóg** - `noga_polrozstaw` 0,082→0,088 (kontynuacja
   V3.3g/V3.3i, ten sam parametr, kolejny krok).
2. **Diament ramienia dalej złagodzony** - szczyt przy łokciu 0,046×→0,036×
   (skala, nie kształt - ten sam ciąg z dopisku 13 zostaje płynny, tylko
   mniejszy).

Nazwane, ale NIE ruszone w tej rundzie (osobne tematy, głównie tekstura/
materiał, nie bryła): brak kontrastu kolorystycznego na ubraniu gracza
(jedna płaska plama koloru vs warstwowy strój Myśliwego), krótka/niewidoczna
szyja.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 1x i
4x obok Rolnika/Hanny.

### Dopisek 15: dopisek 14 pkt 1 COFNIĘTY — rozstaw nóg psuł styk biodro/udo

⛔ Zgłoszone wprost: szerszy rozstaw nóg (0,082→0,088 w dopisku 14) odsunął
uda dalej od tułowia i rozjechał dopiero co dostrojony styk biodro/udo/
krocze (dopisek 9/10) - same promienie nóg się nie zmieniły, ale większy
dystans do tułowia sprawił, że nogi zaczęły czytać się jako chudsze, a
zwężenie bioder i wcięcie krocza optycznie zniknęło.

`noga_polrozstaw` COFNIĘTY z powrotem do 0,082 (V3.3i). Zmiana ramienia z
dopisku 14 (diament złagodzony do 0,036×) zostaje - skargi dotyczyły
wyłącznie nóg.

⚠ **Lekcja:** `noga_polrozstaw` (rozstaw osi nóg) i promienie/kształt tułowia
w okolicy bioder (`tulow` 0,400-0,515, dopisek 9/10) są ZALEŻNE od siebie
wizualnie, mimo że to osobne parametry - zmiana jednego bez przeliczenia
drugiego rozjeżdża efekt, który wyglądał dobrze. Przy przyszłych zmianach
rozstawu nóg sprawdzić, czy styk z biodrem nadal się zgadza.

Zweryfikowane: bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 1x i
8x - wcięcie krocza i zwężenie bioder znowu widoczne.

### Dopisek 16: DRUGA, NIEUDANA próba prawdziwego zgięcia łokcia — zamknięte bez żywego Blendera

Cała praca nad ramieniem od dopisku 3 w górę to **iluzja w mesh-u**: kość
bark→nadgarstek jest cały czas SZTYWNA (tożsamościowa rotacja w `Walk`),
mesh tylko udaje zgięcie przesunięciem pierścieni. Podjęto drugą próbę
prawdziwego zgięcia stawu przez IK, tym razem z inną metodą niż nieudana
próba z §11: policzona trygonometrycznie pozycja nadgarstka dla ŁAGODNEGO
zgięcia (12° ramię na zewnątrz od pionu, +15° dodatkowego zgięcia w łokciu -
celowo dużo skromniej niż "45°/45°" z ogólnego researchu postaci w grach, bo
nasza siatka jest skalibrowana pod dużo subtelniejszy luk), i próba trafienia
tam DZIAŁAJĄCYM mechanizmem z `char3d_attack._dopasuj` (ten sam, który
poprawnie liczy zgięty łokieć w animacji ataku), zamiast własnego, wcześniej
nieudanego solvera numerycznego.

⛔ **Też się nie udało - i to mimo że cel leżał PRAWIE DOKŁADNIE w granicach
naturalnego zasięgu ramienia** (2,10 j. przy zasięgu 2,11 j., czyli to NIE był
ten sam problem co w §11 - target za blisko). Nawet sprawdzony mechanizm
`_dopasuj` wylądował z błędem 6 jednostek - kompletnie obok celu. Test był
izolowany (nie zapisany do `char.blend`).

**Wniosek: problem nie jest w metodzie liczenia celu (numeryczny solver
własny vs `_dopasuj`) - jest w samym solverze IK tego riggu** (konfiguracja
pole targetu i/lub `use_stretch`), który zachowuje się niestabilnie w tym
rejonie przestrzeni niezależnie od tego, jak dobrze policzony jest cel.

⛔⛔ **TEMAT ZAMKNIĘTY do czasu żywego podglądu w Blenderze.** Dwie
niezależne, dobrze uzasadnione próby (§11 i ten dopisek) zawiodły z różnych
przyczyn technicznych - dalsze próby na ślepo (headless, bez wizualnego
debugowania w viewporcie) tylko zgadywałyby. Nie zaczynaj trzeciej próby bez
działającego połączenia MCP do Blendera. Obecne rozwiązanie mesh (diament +
łuk przedramienia z dopisków 3-15) zostaje jako praktyczny sufit tej
techniki.

### Dopisek 17: PRAWDZIWE odsunięcie ręki wraca — nie zgięcie, tylko przesunięcie sztywnego łańcucha

Po analizie 7 referencyjnych baz humanoidalnych (low-poly, różne źródła):
**żadna nie ma ręki zgiętej w łokciu w kształt rombu/diamentu** — wszystkie
pokazują PROSTĄ rękę, odsuniętą od tułowia jako CAŁOŚĆ, pod niewielkim,
stałym kątem. To odpowiada dokładnie temu, co nasz rig faktycznie umie
zrobić dobrze (przesunąć sztywny łańcuch IK jako całość — sprawdzone,
zbieżne, bez solvera), a nie temu, czego nie umie (zgiąć staw — dwie
nieudane próby, dopisek 16 i §11).

⛔ **Próba pośrednia: obrót samego obojczyka (kość FK, rodzic łańcucha IK)
też nie zadziałała** — zmierzone: obrót o 15° przesunął nadgarstek o
0,02-0,08 j., praktycznie nic, bo kontrolka IK i tak celuje w punkt w
przestrzeni ŚWIATA, więc solver odtwarza tę samą pozycję końcówki
niezależnie od tego, gdzie zacznie się łańcuch.

✅ **Naprawa: `dodaj_rozchylenie_ramion` (dopisek 2) WŁĄCZONE Z POWROTEM**,
ale z dużo mniejszą wartością (0,45× → 0,16×) i BEZ żadnej dodatkowej
krzywizny naniesionej na to (nauczka z dopisków 11/12 - tam właśnie
nawarstwienie dawało "bramkarza"). `dodaj_wychyl` (przechył tułowia) ZOSTAJE
wyłączony - to był osobny, odrzucony pomysł. Diament w mesh-u (`_luk_ramienia`)
ZDJĘTY do ~1/3 poprzedniej amplitudy - realne odsunięcie robi teraz
kontrolka IK, mesh dokłada już tylko subtelną czytelność mięśnia.

Zweryfikowane: `--zapisz` dwa razy pod rząd daje identyczny wynik
(idempotentne), bramka tarcz OK, bramka broni te same znane liczby, `tsc`
czysto, `dev.missing`/`totalFailed`=0, sprawdzone w żywej grze zoomem 1x i
8x - prosta ręka z realną, widoczną przerwą od tułowia, bez zgięcia, bez
gestu gotowości.

### Dopisek 18: proporcja głowy (4,29) ŚWIADOMIE zostawiona - rozbieżność z §3.3 zaakceptowana

Trzy niezależne źródła wskazywały w tę samą stronę: własny dokument projektu
(§3.3 wyżej: pixel-artowi NPC mierzą 3,0-3,9 głowy), ogólny research
gatunku (chibi/mobile RPG czytelność) i realny przykład z branży (Daniel
Vicente, "WindShire" - postać gracza Hyve Studios, głowa ~3-3,5). Zgłosiłem
to trzy razy.

⚠ **Autor obejrzał uważnie żywe zrzuty z gry (nie izolowane rendery) i ocenił,
że obecna proporcja NIE czyta się jako wadliwa** - w przeciwieństwie do
wszystkich innych problemów tej sesji (dziura w łokciu, przeprost, "bramkarz"),
które BYŁY widoczne na pierwszy rzut oka. Różnica: powyższe trzy źródła to
argument za ZGODNOŚCIĄ z regułą/konwencją, nie dowód na wizualną wadę - a to
dwie różne rzeczy. Po jawnym postawieniu tego rozróżnienia autor potwierdził
świadomie: zostawiamy jak jest.

⛔ **`glow` (aktualnie 4,29, cel z §3.3 to 3,0-3,9) NIE JEST błędem do
naprawienia w przyszłej sesji** - to jest ŚWIADOMA, zweryfikowana wizualnie
decyzja, zamknięta 2026-09-20. Nie zgłaszaj tego ponownie bez nowego,
konkretnego argumentu wizualnego (nie kolejnej referencji/liczby).

### Dopisek 19: audyt końcowy V3.3g/h — baseline vs. current w realnej kamerze gry, GEOMETRIA ZAMKNIĘTA

Na żądanie autora (poddane w wątpliwość: "poprzednia [baseline sprzed sesji]
ma bardziej czytelne kończyny niż przeróbki") wykonano bezpośrednie
porównanie **baseline (`git show HEAD:public/assets/char.blend`, stan sprzed
całej sesji) vs. current (dopisek 1-18)** w PRAWDZIWEJ kamerze gry (Phaser +
three.js, nie render Blendera): ta sama lokacja świata (wioska, x=1392
y=1776), ten sam zoom (2× gameplay, 5× zbliżenie), plik `.glb` podmieniany
tymczasowo w `public/assets/characters/` i przywracany zaraz po zrzutach
(backup w scratchpadzie, zweryfikowany md5 po przywróceniu).

Wynik (pełne A/B/C/D w transkrypcie sesji, streszczenie tutaj):
- Obie wersje czytają się jako czysta, zamknięta sylwetka - żadnej regresji
  (bramkarza, przeprostu, dziury przy łokciu, "gumiaków") nie widać w
  żadnej z nich na zoomie gameplayowym.
- Realna, choć subtelna poprawa w current: odstęp ramię-tułów (efekt
  `dodaj_rozchylenie_ramion`, dopisek 17) czytelny na 5×, ledwo zauważalny
  na 2× (malejący zwrot z dalszego dokręcania tego parametru); węższy styk
  uda z biodrem (dopisek 9/10) niż w baseline; gradientowy taper
  udo→kolano→łydka→kostka zamiast prostszego stożka baseline'u.
- Żaden strukturalny defekt nieznany wcześniej nie ujawnił się w normalnej
  kamerze. Wątpliwość autora ("baseline czytelniejszy") nie potwierdziła się
  przy realnym porównaniu obok siebie - różnica jest mniejsza niż sugerowała
  intuicja, ale idzie w stronę current, nie baseline.

✅ **DECYZJA: GEOMETRIA BAZOWA ZAMKNIĘTA (2026-09-20).** Zgodnie z briefem
audytu: **nie otwierać kolejnej rundy mikro-poprawek anatomii** bez nowego,
konkretnego zastrzeżenia z żywej gry (nie z kolejnej referencji/pomiaru).
Znany problem chwytu broni dwuręcznej (patrz punkt niżej) pozostaje osobnym,
nietkniętym zagadnieniem.

⚠ **OI nowe: chwyt broni dwuręcznej w zamachu.** `char3d_sprawdz_bron.py`
zgłasza `spear`/`battle_axe`/`war_hammer`: lewa dłoń 1,61 j. od drzewca w
klatce zamachu (limit 0,55) - błąd ZNANY, PRZEDWCZEŚNIEJSZY niż ten audyt
(potwierdzone: identyczny wynik na pliku sprzed dzisiejszej sesji). Nie
naprawiane teraz - wymaga osobnej sesji poświęconej wyłącznie temu.

### Dopisek 20: korekta miednicy/ud PO zamknięciu geometrii — "biodra za wydatne od przodu"

Zaraz po zamknięciu (dopisek 19) autor wrócił z konkretnym, wizualnym
zastrzeżeniem (przekazanym przez ChatGPT, ale osadzonym w realnej krytyce
frontowej sylwetki) — dokładnie ten typ argumentu, który dopisek 19
zastrzegał jako jedyny ważny powód do ponownego otwarcia: **przejście
tors→miednica→udo daje zbyt mocne boczne wybrzuszenie, "pośladek widoczny od
przodu"**. Żądanie: zwęzić boczny obrys miednicy, ale NIE spłaszczać/chudzić
uda — pełną masę skierować bardziej w dół (środek/góra uda), nie na boki;
zero zmian w pionowej przestrzeni krocza; nogi mają wyglądać na osadzone POD
miednicą, nie wyrastające z dwóch szerokich kul po bokach.

**Diagnoza (przed zmianą kodu):** policzone geometrycznie, że główny
winowajca to NIE pierścień tułowia (miednica), tylko **SZCZYT UDA** —
pierścień nogi osadzony na `noga_x` (1,05 j.) z promieniem 0,078 (=1,00 j.),
czyli sięgający do X=2,05 j. od osi ciała na wysokości ~0,427 wzrostu. To
prawie 2× dalej niż sam pierścień tułowia w tym miejscu (0,088 = 1,13 j.
przed poprawką). Miednica (tułów) i udo (noga) to dwie NIEZALEŻNE rury bez
boola/scalenia — sylwetka to suma ich obrysów, więc szerszy z dwóch
wygrywa. Stąd zmiana idzie GŁÓWNIE w SZCZYT UDA, nie w miednicę.

**Zmiana (`tools/char3d_base.py`, oznaczona "V3.4a" w komentarzach):**
- `tulow` (pierścienie 0,400/0,425/0,470/0,515): szerokość (nie głębokość)
  zmniejszona jednostajnie o ~7-8% na wszystkich czterech naraz — sam
  kształt/krzywa nietknięty, tylko skala. Talia (0,560) i wszystko powyżej
  NIETKNIĘTE.
- `noga`, SZCZYT UDA (z 0,427): promień 0,078→0,068 (-13% szerokości, zasięg
  boczny spada z 2,05 do ~1,92 j.), GŁĘBOKOŚĆ 0,075→0,080 (+7%, kompensuje
  objętość w osi przód-tył zamiast na boki), a sam szczyt przesunięty NIŻEJ
  (z(0,427)→z(0,420)) — pełnia uda ma się zaczynać kawałek niżej, nie tuż
  pod stawem biodrowym.
- Pierścień ZARAZ ZA szczytem (`xl(0.38)`) dostał WIĘCEJ masy niż miał
  (0,065→0,068), żeby taper po szczycie był łagodniejszy — pełnia "spływa w
  dół" zamiast kończyć się od razu po szczycie (to jest operacjonalizacja
  "skieruj bryłę w dół, nie na boki").
- Styk uda z biodrem (`gorne udo`, z 0,446) lekko węższy (0,052→0,048) dla
  gładszego przejścia tułów→miednica→udo bez skoku tuż przed szczytem.
- Kolano i niżej (`xl(0.50)` w dół) NIETKNIĘTE. Żadna kość/`_uklad` NIE
  zmieniona — to wyłącznie mesh (loft points), zero ryzyka dla IK/animacji/
  chwytu broni.

**Zweryfikowane:** `--zapisz` bez błędów, wzrost 12,84 j. (cel ~12,8, bez
zmian), `glow` 4,29 (nietknięte), eksport `.glb` czysto, `tsc --noEmit`
czysto, `dev.missing`/`totalFailed`=0. `char3d_sprawdz_bron.py` — te same
znane błędy co PRZED tą zmianą (zweryfikowane wprost na pliku sprzed edycji:
identyczny wynik), żadnego nowego. `char3d_sprawdz_tarcze.py` — obie tarcze
OK, żadna nie zamiata gruntu. Sprawdzone w żywej grze (zoom 2× i 5×, ta sama
lokacja co dopisek 19): sylwetka wyraźnie węższa w biodrach, bez nowego
defektu (dziury, szwu, "chudych nóg"). Widok z boku w pozie marszu pokazywał
pozornie odrębną "bryłę" przy biodrze — zweryfikowane jako naturalny artefakt
dwóch nóg w różnej fazie kroku (zniknął w pozie spoczynkowej/T-pozie), nie
defekt tej zmiany.

⚠ To jest reopening PO formalnym zamknięciu geometrii (dopisek 19) — świadomy
wyjątek, bo zastrzeżenie było konkretne i wizualne (nie kolejna referencja/
pomiar), zgodnie z warunkiem, jaki dopisek 19 sam postawił. Nie traktować
jako otwarcia kolejnej ogólnej rundy anatomii.

### Dopisek 21: druga korekta tego samego obszaru — spłaszczenie widoku OD TYŁU

Zaraz po dopisku 20 autor przysłał render od tyłu z czerwoną linią po
zewnętrznym obrysie uda (od paska do kolana) i zgłosił wprost: "rzuca się to
w oczy w grze", widok od tyłu czyta się jak przesadnie zaokrąglone
biodro/pośladek ("jak latina MILF", żartem, ale diagnoza poważna). Kontur
zaznaczony linią: wybrzuszenie na zewnątrz, potem ostry zakręt do kolana,
zamiast jednego płynnego zwężenia.

**Diagnoza:** dopisek 20 skupił się na zasięgu w osi X (front) i przy okazji
ZWIĘKSZYŁ głębokość SZCZYTU UDA (0,075→0,080) plus dołożył masy pierścieniowi
ZARAZ ZA szczytem (0,065→0,068, prawie równo ze szczytem = "plateau" zamiast
zwężenia). To, razem z `TULOW_Y_OFFSET` (pchnięcie pośladka tułowia do tyłu),
złożyło się na wyraźnie bardziej zaokrąglony tył niż przed dopiskiem 20 -
poprawka frontu pogorszyła tył.

**Zmiana (`tools/char3d_base.py`, oznaczona "V3.4b"):**
- `TULOW_Y_OFFSET`: {0,425:0,006→0,004; 0,470:0,012→0,007; 0,515:0,008→0,005}
  - pchnięcie pośladka zmniejszone o ~40%, sam mechanizm (tylko te trzy
    pierścienie, przód prawie nietknięty) z V3.3c bez zmian.
  - SZCZYT UDA: głębokość 0,080→0,074 (blisko oryginalnej 0,075 sprzed
    dopisku 20 - szerokość 0,068 z dopisku 20 NIETKNIĘTA, to był dobry wynik
    z frontu).
  - Pierścień zaraz za szczytem (`xl(0.38)`): szerokość 0,068→0,060, głębokość
    0,065→0,058 - zdjęte "plateau", zwężenie zaczyna się OD RAZU po szczycie
    jedną płynną krzywą, nie po dwóch pierścieniach o tej samej masie. To jest
    dokładnie ta linia, którą autor zaznaczył na renderze.
- Kolano i niżej, `gorne udo` (styk z biodrem), przód miednicy — NIETKNIĘTE.

**Zweryfikowane:** rebuild czysto, wzrost 12,84 j. / `glow` 4,29 (bez zmian od
dopisku 20), eksport `.glb` czysto, `tsc --noEmit` czysto, `dev.missing`/
`totalFailed`=0 w żywej grze. `char3d_sprawdz_bron.py` — te same 30 błędów co
przed tą zmianą (identyczna lista, zero nowych - broń wisi na kości dłoni,
nie na mesh-u nogi, więc zmiana uda nie mogła tego ruszyć). Render od tyłu
(`rest_tyl`/`nowy_tyl`) i z boku (`rest_bok`) w Blenderze: wyraźnie płaszszy,
bardziej bezpośredni spadek od biodra do kolana, bez wybrzuszenia-a-potem-
-zakrętu. Widok z przodu w żywej grze (zoom 2×/5×, ta sama lokacja co
dopiski 19/20) bez regresji. Widok OD TYŁU w żywej grze NIE zweryfikowany
bezpośrednio - obrót postaci przez syntetyczny input (`moveDir`, klawiatura)
okazał się niewiarygodny w tej sesji (potwierdzone ponownie: ustawienie
`player.moveDir` wprost nie zmienia orientacji modelu, nadpisywane przez
pętlę gry) - weryfikacja oparta na renderze Blendera z tej samej kamery
(15° elewacji, jak `Character3D.ELEV_DEG`), nie na żywym zrzucie.

### Dopisek 22: nogi "doklejone" — wsunięcie mesh-u, i lekcja o jednostkach `u()`

Zgłoszone wprost ze zrzutu z gry (zoom bliski `game_px`): między nogawkami
widać tło od okolicy kolana w dół, noga czyta się jak sztywna rura doklejona
pod biodrem. `noga_x` (KOŚĆ, `noga_polrozstaw`) zostaje NIETKNIĘTA — ta sama
dźwignia zepsuła już raz styk biodro/udo/krocze (V3.3t/u). Naprawa: czysto
kosmetyczne wsunięcie siatki nogi w stronę X=0 (ten sam trik co
`_luk_ramienia` dla ręki), zero przy biodrze/kostce (kostka MUSI zostać
nietknięta — `stopa` zaczyna się wprost od `kostka.x`, inaczej nowy szew),
szczyt wsunięcia w okolicy kolana/łydki.

⚠⚠ **Pierwsza próba użyła `u(0,02–0,10)` myśląc o tych liczbach jako o
jednostkach świata wprost — a `u()` mnoży przez WZROST (12,8 j.), więc
`u(0,10)` to 1,28 j., nie 0,10 j.** Efekt: obie nogi razem przesunęły się o
>2,5 j. do środka i ZLAŁY SIĘ W JEDNĄ BRYŁĘ — zgłoszone wprost i dosadnie
("złamałeś mu nogi", "złączyłeś nogi w jedną"). Autor doprecyzował: chodziło
o ~2 PIKSELE do przycięcia, nie o zlanie. Naprawione: ta sama krzywa, wartości
mniejsze o rząd wielkości (`u(0,002)` do `u(0,010)`, szczyt przy kolanie).

**Zweryfikowane (po poprawce skali):** rebuild czysto, render REST frontu —
nogi wyraźnie OSOBNE z małą przerwą, żadnego zlania. Żywa gra (zoom 8×): to
samo. `tsc` czysto, `dev.missing`/`totalFailed`=0. Skrypt broni: te same 30
znanych błędów, zero nowych. Tarcze: OK.

### Dopisek 23 (V3.5): zmiana CELU — czytelność na telefonie, nie realizm; baza pod inne postacie

Autor przeformułował cel wprost: nie dopracowujemy już postaci pod realizm
jednego modelu — **celem jest czytelność na małym ekranie i solidna BAZA pod
przyszłe warianty** (inni NPC, np. "Patryczek"). Stara kotwica "60 px
`Character.png`" przestaje obowiązywać jako sufit. Impuls: bezpośrednie
porównanie obok żywego NPC (Patryczek, trener walki) pokazało naszą postać
jako "niedożywionego manekina" — dłonie, przedramiona, barki wyraźnie
szczuplejsze niż stylizowany pixel-art sąsiad, mimo że to WŁAŚNIE ten model ma
być donorem dla takich postaci.

**To jest świadome ponowne otwarcie DWÓCH wcześniej zamkniętych wątków**
(proporcja głowy — dopisek 18; ogólna sylwetka/szerokość barków — dopisek 19)
na podstawie nowego, konkretnego argumentu wizualnego (bezpośrednie
porównanie z konkretnym NPC), czyli dokładnie warunku, jaki te zamknięcia same
postawiły do ponownego otwarcia.

**Zmiany, w kolejności rosnącego ryzyka:**

1. **`PLAYER.scale`** (`GameConfig.ts`) 1,0 → **1,15**. Jednolity mnożnik
   wyświetlania — więcej pikseli na każdy szczegół, zero ryzyka geometrii.
2. **Dłonie/przedramię/ramię** (`dlon_szerokosc` 0,098→0,112, `dlon_grubosc`
   0,048→0,054, `ramie_promien` 0,052→0,058, `lokiec_promien` 0,044→0,049,
   `nadgarstek_promien` 0,034→0,038) — jeden wspólny krok w górę na promieniach
   bazowych; CAŁY ciąg mnożników w tabeli `ramie` jest względny wobec tych
   wartości, więc kontrast biceps/łokieć/przedramię z V3.3d-l zostaje
   zachowany, tylko grubiej.
3. **Barki** (`bark_polrozstaw` 0,138→0,148, `bark_polszerokosc` 0,182→0,195)
   + odpowiadające poszerzenie trzech torsowych pierścieni na wysokości barku
   (0,702/0,738/0,752, +6-7% szerokości, głębokość nietknięta) — ta sama
   technika co V3.3g, żeby nie zostawić "stopnia" barku.
4. **`glow`** 4,4 → **3,9** (dolna granica już-udokumentowanego celu z
   pomiaru NPC-ów w nagłówku `PROPORCJE`, nie nowa liczba). Tylko skala
   głowy — `glowa_szerokosc` (kształt) NIETKNIĘTE.
5. **`biodro`/`krocze`/`kolano`** (0,470/0,440/0,230 → 0,450/0,420/0,221) —
   ⚠⚠ **JEDYNA zmiana w tej rundzie, która rusza KOŚĆ**, nie kosmetykę.
   Sama głowa (pkt. 4) nie wystarczyła — bezpośrednie porównanie z Patryczkiem
   dalej pokazywało wyraźnie dłuższą nogę. Ryzyko nazwane wprost przed
   realizacją: `_uklad()` czyta te wartości jako pozycje `Bone_L.001`/
   `Bone_L.002`, a akcja "Walk" ma już wytrenowane cele IK (`FootIK`,
   `PoleKnee`) dobrane pod dotychczasową długość kości. `kostka` (0,042)
   NIETKNIĘTA, więc pozycja stopy w świecie się nie zmieniła - skróceniu
   ulega WYŁĄCZNIE odcinek biodro-kolano-kostka, noga krótsza o ~0,26 j.
   jako CAŁOŚĆ (proporcja udo:łydka zachowana, `kolano` przesunięte
   proporcjonalnie, nie o stałą wartość). Autor zaakceptował próbę wprost
   ("spróbujmy") po nazwaniu ryzyka.
6. **`dodaj_rozchylenie_ramion`** (`build_char3d_base.py`) 0,16 → **0,20** —
   po poszerzeniu barku (pkt. 3) ta sama bezwzględna przerwa ręka-tułów
   czytała się jako mniejsza względem szerszej sylwetki; zgłoszone wprost
   ("ramiona bardziej rozłożyste"). Dalej daleko od odrzuconej 0,45
   (dopisek 2).

**Zweryfikowane (każdy krok osobno, rebuild + eksport + `tsc` + skrypty +
żywa gra po każdym):**
- Kroki 1-4: zero regresji, `tsc`/`dev.missing`/`totalFailed` czyste, skrypt
  broni/tarcz — te same 30 znanych błędów, zero nowych.
- Krok 5 (skrócenie nogi): render REST i Walk (przód/bok) w Blenderze —
  BEZ przeprostu/cięcia, stopa poprawnie osadzona na ziemi w obu pozach.
  Skrypt broni: te same 30 błędów, ale DWIE już-otwarte pozycje przesunęły
  się liczbowo (nie nowy problem, ten sam): miecz "w chodzie" 0,93→0,83 j.
  (lepiej), chwyt broni dwuręcznej w zamachu 1,61→1,75 j. (gorzej — patrz OI
  niżej). Tarcze: dalej 100% OK, żadna nie zamiata gruntu. Żywa gra obok
  Patryczka (zoom 5×, x=2672 y=2832): proporcje wyraźnie bliższe - nogi
  krótsze, głowa/tors grubsze, stopy stoją równo na ziemi.
- Krok 6: render + żywa gra (zoom 8×) - widoczna, umiarkowana przerwa
  ręka-tułów, bez regresji.

⚠ **OI: chwyt broni dwuręcznej w zamachu POGORSZONY liczbowo przez skrócenie
nogi** (1,61→1,75 j. od drzewca, limit 0,55) — dalej ten sam, PRZEDWCZEŚNIEJ
znany problem (patrz dopisek 19), nie nowy, ale wymaga uwzględnienia przy
docelowej naprawie (będzie liczyć się od nowej geometrii nogi/postawy).

⛔ **Ten dopisek PONOWNIE OTWIERA `glow` i ogólną szerokość sylwetki** -
kolejna reopening tego samego tematu wymaga równie konkretnego, świeżego
argumentu wizualnego (nie kolejnej liczby/referencji), zgodnie z regułą,
którą ten sam dopisek właśnie zastosował do wcześniejszych zamknięć.

### Dopisek 24: stopy jak "kreski" z boku — grubość, nie szerokość

Zgłoszone wprost ze zrzutu z profilu: stopa z boku czyta się jako płaska
kreska. Diagnoza: pierścienie pięty i palców w `stopa` (`tools/char3d_base.py`)
miały grubość (`rz`, dosłownie połowa wysokości pierścienia NAD podłogą)
0,17/0,11 — najcieńsze wartości w całej tabeli — podczas gdy pierścień przy
kostce (0,46, chowa się pod nogawką) był już solidny. Podniesione: pięta
0,17→0,23, środek stopy 0,26→0,32, okolica palców 0,16→0,21/0,11→0,14.
Szerokość (`rx`, oparta na `sz`) NIETKNIĘTA — to inna oś, niezwiązana ze
zgłoszonym problemem. Zweryfikowane: render `bok` (REST i Walk) pokazuje
pełną bryłę buta zamiast kreski, `tsc`/eksport/skrypty broni i tarcz bez
zmian w liczbie błędów, żywa gra (zoom 8×) potwierdza.

### Dopisek 25: "kulanie" i "ręce jak wachadła" — zdiagnozowany, ale NIE naprawiony w pełni

Zgłoszone wprost: chód wygląda jakby postać kulała, a ręce machają jak
wahadła. Zbadane metodą render + inspekcja danych animacji (bez żywego
podglądu ruchu — syntetyczny input, klawiatura i drag joysticka, dalej nie
działa w tym środowisku, potwierdzone ponownie wieloma metodami).

**Co znaleziono i NIE jest przyczyną (ale było realnym błędem, naprawionym):**
`HandIK_R.005` (kontrolka IK prawej ręki) miała jawnie uszkodzoną wartość na
klatkach 0 i 3 akcji "Walk" (X=-11,52, Z=18,34 zamiast rozsądnych ~-1 do -2).
Źródło: `_przesun` (numeryczny solver Jacobianowy w `char3d_walk_lean.py`)
trafia dla tej konkretnej geometrii na OSOBLIWY jakobian (wyznacznik ~0) już
od pierwszej iteracji — `R.inverted()` na prawie-zerowym wyznaczniku nie
rzuca wyjątku, tylko zwraca ogromne, źle uwarunkowane współczynniki, więc
krok pcha kontrolkę w przypadkowym kierunku daleko od sensownej pozycji,
a błąd maleje na tyle wolno (0,20→0,11 po 40 iteracjach), że mechanizm
"zapamiętaj najlepszy wynik" NAGRADZA rozjeżdżanie się zamiast go wyłapać.
Sprawdzone bezpośrednio (pozycja świata `Bone.002_R.003`, czyli FAKTYCZNIE
renderowanej kości dłoni, nie kontrolki): mimo tej usterki efektor lądował w
normalnym miejscu na każdej klatce — **błąd był niewidoczny w grze**, bo
eksport `.glb` piecze już ROZWIĄZANĄ pozycję kości, nie surową wartość
kontrolki IK (potwierdzone komunikatem eksportera "Baking animation because
of unsupported constraints"). Mimo to naprawione: `_przesun` dostał strażnika
wykrywającego osobliwy jakobian (`|det| < 0.05`) i przerywa NATYCHMIAST
zamiast kontynuować rozjeżdżanie się, zostając przy dotychczas najlepszej
(zwykle: nietkniętej) pozycji. Efekt uboczny: przy tej samej osobliwości
odsunięcie ręki od tułowia (`dodaj_rozchylenie_ramion`) po prostu NIE
aplikuje się na klatkach 0/3 dla obu dłoni (drukuje ostrzeżenie, zostaje
przy pozycji sprzed odsunięcia) — kosmetycznie drobna niespójność w cyklu,
bezpieczniejsza niż zepsute dane.

**Prawdopodobna PRAWDZIWA przyczyna (NIE zweryfikowana wizualnie w ruchu):**
ręka porusza się o ~2,36 j. (18% wzrostu) między skrajnymi klatkami cyklu
(zmierzone na kanale Y `HandIK_L.005`), a akcja "Walk" ma tylko 4 kluczowe
klatki na cykl (0-3) bez śladu złagodzenia (wszystkie klucze `BEZIER`/`AUTO`,
ale to nie wyklucza sztywnego odczucia przy dużej amplitudzie i rzadkich
klatkach). Duży wymach przy niewielkiej liczbie klatek to podręcznikowy
przepis na "wahadłowy" odbiór. To samo prawdopodobnie tłumaczy "kulanie" -
mózg wnioskuje o rytmie chodu częściowo z ruchu rąk, więc przesadzony/sztywny
wymach mógł zaburzać odbiór SAMEGO chodu, mimo że nogi (zweryfikowane
renderem 4 klatek z boku i z przodu) mają poprawne, naprzemienne zgięcie w
kolanie i nie wyglądają na uszkodzone.

⛔ **NIE naprawione dalej w tej sesji.** Dostrojenie amplitudy/wygładzenia
wymachu wymaga oglądania animacji W RUCHU, żeby nie strzelać na ślepo kolejną
rundą liczb - a tego akurat nie da się zrobić bez żywego testu (czy to w
przeglądarce z prawdziwym inputem, czy w viewporcie Blendera). Punkt wejścia
do kontynuacji: kanały `pose.bones["HandIK_L.005"/"HandIK_R.005"].location`
w akcji "Walk" (12 klatek — 3 powtórzenia 4-klatkowego cyklu, prawdopodobnie
pod turntable), oraz analogiczna analiza dla `FootIK_L/R.006` po stronie nóg.

### Dopisek 26: ślizganie stóp NAPRAWIONE (właściwie), fałszywy trop tarczy, i falstart z bezruchem

Kontynuacja dopisku 25. Autor doprecyzował objawy: "ślizga się po gruncie",
"ręce idą razem" (dane pokazały że jednak NIE - naprzemiennie, prawidłowo),
i osobno: tarcza podczas chodu przechylona bardziej do boku niż "przed
siebie".

**Ślizganie stóp — zdiagnozowane i naprawione.** Akcja "Walk" to prosty cykl
co 3 klatki (0-2, powtórzony 3× na 12 klatek; `FootIK_?.006.location`).
Wysokość niesie **lokalna oś X** tej kości (nie Z — spoczynek stopy jest
przechylony względem świata, zmierzone empirycznie przez `_swiat`). Błąd:
szczyt wysokości siedział dokładnie w klatce "przód" (stopa NAJWYŻEJ dokładnie
wtedy, gdy powinna już dotykać ziemi) zamiast w "środku" wymachu - stąd
wrażenie ciągnięcia się po gruncie między szczytem a nagłym powrotem nisko-
-i-do-tyłu na pętli.

⚠⚠ **Pierwsza próba naprawy przeniosła szczyt na klatkę "środek" (indeks 1) —
i to ZEPSUŁO BEZRUCH.** `src/render3d/Character3D.ts` (`POZA_BEZRUCHU = 0.2`,
z komentarzem "to jest klatka 1") **zatrzymuje animację dokładnie na tej
klatce, gdy postać stoi** - to jedyna klatka cyklu, gdzie obie stopy są razem
i (w oryginale) nisko. Podniesienie jej dla OBU nóg jednocześnie (potrzebne,
bo to jedyna wspólna "środkowa" klatka) sprawiło, że w bezruchu obie stopy są
uniesione naraz - zgłoszone wprost ze zrzutu jako "ugięła kolana, stanęła na
palcach". Złapane i cofnięte w tej samej sesji, zanim dotarło do gracza jako
"naprawiony" stan.

**Finalna, bezpieczna wersja:** poprawiona WYŁĄCZNIE zła klatka "przód" (dla
każdej nogi osobno, bo mają "przód" w innym miejscu cyklu) - sprowadzona do
poziomu "tyłu" (ta sama, już istniejąca wartość, żadna nowa liczba). Klatka
"środek" (indeks 1) jawnie PRZYWRÓCONA do oryginalnej wartości `0,000` dla
obu nóg - i to musiało być jawne, bo poprzedni (cofnięty) przebieg już
zapisał złą wartość do `char.blend`; sama zmiana kodu bez jawnego
przywrócenia zostawiłaby zepsute dane na stałe.

⚠ **Kompromis, nazwany wprost:** przy tylko 3 unikalnych klatkach na nogę i
jednej zarezerwowanej pod bezruch, nie ma miejsca na WYRAŹNY szczyt wymachu
bez kolizji z pozą stojącą. Uniesienie jest teraz poprawnie ZSYNCHRONIZOWANE
(rośnie od tyłu do środka, opada do przodu), ale SKROMNE (0,065 j., było
źle-rozłożone 0,463 j.). Wyraźniejsze uniesienie wymagałoby DODATKOWEJ klatki
kluczowej w akcji "Walk" - to przebudowa struktury animacji, nie korekta
wartości, i lepiej pasuje do sesji z żywym podglądem Blendera.

**Tarcza — teoria z poprzedniego dopisku ANULOWANA.** Zmierzono kierunek
lica tarczy (`Bone.002_L.003`, `parent_type='BONE'`, sztywne dziecko kości
dłoni) na każdej klatce chodu, PRZED i PO dzisiejszym zwiększeniu rozstawu
ramion (0,16→0,20) - wyniki niemal identyczne (odchylenie od "przodu" ~14-28°
w obu wersjach). **To nie jest regresja z tej sesji** - to cecha ISTNIEJĄCA w
samym wymachu ręki od dawna. Właściwa naprawa (przeciw-rotacja kompensująca
naturalny obrót przedramienia podczas wymachu) to osobna, nowa mechanika -
odłożona na wyraźne życzenie autora ("na początku dopracujmy chód").

**Zweryfikowane (finalna wersja):** render klatki 1 (`walkcheck_f1_bok`) -
stopy razem, płasko, symetrycznie - poprawny bezruch. Render klatek 0/2 -
poprawny, płynny krok. `tsc`/eksport/skrypty broni/tarcz - te same 30
znanych błędów, zero nowych. Żywa gra (nowa postać, tarcza wyposażona przez
`window.dev`): bezruch pokazuje proste nogi, stopy płasko - **bez** efektu
"ugiętych kolan/na palcach". `dev.missing`/`totalFailed` puste.

⏳ **Otwarte, świadomie odłożone:** (1) wyraźniejszy szczyt wymachu (wymaga
nowej klatki kluczowej + żywego podglądu), (2) przeciw-rotacja tarczy podczas
chodu, (3) amplituda/złagodzenie wymachu ręki (dopisek 25, nie zweryfikowane
w ruchu).

### Dopisek 27: tarcza przenika przez postać — poza niesienia dla lewej dłoni (WDROŻONE)

Zgłoszone wprost ze zrzutu: tarcza przenika przez ciało zarówno w bezruchu,
jak i w marszu; autor: nie musi być trzymana w pełni frontalnie, w realu
tarczę nosi się na przedramieniu, przechyloną do boku — więc dopasowanie kąta
zamiast wymuszania "przodem" jest w porządku.

**To była już PRZEWIDZIANA, ale NIGDY NIEZROBIONA naprawa** — nagłówek
`tools/char3d_shields.py` mówił wprost: „jeśli tarcza zacznie... wjeżdżać w
udo, lekarstwem jest POZA NIESIENIA dla lewej dłoni w `char3d_chod.py`,
dokładnie ta sama technika co dla prawej" (broń). Przyczyna: lewa dłoń
ZAWSZE machała pełnym cyklem chodu, niezależnie od tego, co niesie — dopiero
`Walk_Armed`/`Walk_Armed_2H` (istniejące od dawna) zatrzymują PRAWĄ dłoń przy
broni; analogicznego mechanizmu dla lewej/tarczy nigdy nie napisano.

**Wdrożone (`tools/char3d_chod.py`, `tools/char3d_export_gltf.py`,
`src/render3d/Character3D.ts`):**
- `NIESIENIE_TARCZA` — lustro (w X) już sprawdzonej `NIESIENIE_1H` (dłoń przy
  biodrze, ten sam układ co w bezruchu, gdzie tarcza nie przenikała).
- `zbuduj_chod_uzbrojony()` przerobione na DWIE NIEZALEŻNE flagi (`bron`,
  `tarcza` — chwyt oburęczny wyklucza tarczę z definicji), zamiast jednego
  przełącznika broń/gołe ręce. Prawa dłoń zamraża się do pozy niesienia TYLKO
  gdy `bron=True`; lewa TYLKO gdy `tarcza=True` — niezależnie od siebie.
- Dwie nowe akcje eksportowane obok istniejących: **`Walk_Shielded`** (goła
  prawa ręka + tarcza) i **`Walk_Armed_Shielded`** (broń jednoręczna +
  tarcza).
- `Character3D.ts`: nowe pola `chodTarcza`/`chodBronTarcza`, doczytane z
  klipów, dopisane do WSZYSTKICH miejsc, gdzie dotąd wymieniano `chod`/
  `chodBron`/`chodBron2h` z osobna (wybór aktywnego klipu w `krok()`,
  wygaszanie przy ataku, przywracanie wagi po ataku) — łatwo przeoczyć jedno
  z tych miejsc i dostać niewidoczny, cichy błąd (klip zbudowany, ale nigdy
  nie odtwarzany albo nigdy nie wygaszany).

**Zweryfikowane:** `tsc --noEmit` czysto. Eksport: obie nowe akcje budują się
bez błędu (`[chod] akcja 'Walk_Shielded': 4 klatek`, analogicznie dla
`_Armed_Shielded`). Render `Walk_Shielded` (przód i bok, wszystkie 4 klatki) —
tarcza stoi przy biodrze, NIE wjeżdża w udo na żadnej klatce, noga swobodnie
przechodzi pod/za nią niezależnie od fazy kroku. Skrypt broni: te same 30
znanych błędów (w tym oba znane, niezwiązane z tą zmianą - `atak` poza
zasięgiem ramienia, potwierdzone identyczne na kopii zapasowej sprzed
całej dzisiejszej sesji). Skrypt tarcz: 2/2 OK, nic nie zamiata gruntu (choć
ten skrypt na razie sprawdza tylko `Walk`/`Walk_Armed`, nie nowe warianty -
przenikanie przez CIAŁO to inna kategoria błędu niż zamiatanie gruntu, którą
ten skrypt w ogóle mierzy). Żywa gra: tarcza wyposażona przez `window.dev`,
bezruch czysty, `dev.missing`/`totalFailed` puste.

⛔ **NIE zweryfikowane w RUCHU na żywo** — syntetyczny input dalej nie działa
w tym środowisku (ta sama, wielokrotnie potwierdzona bariera). Weryfikacja
oparta na renderze wszystkich 4 klatek `Walk_Shielded` z Blendera, tą samą
kamerą co silnik - to samo ograniczenie dotyczyło już dopisków 25-26.

⏳ Otwarte: przeciw-rotacja lica tarczy (dopisek 26, osobna sprawa - dziś w
POZIE NIESIENIA lico i tak stoi stabilnie, więc przechylenie z dopisku 26
dotyczyło STAREGO, machającego zachowania i może już nie być aktualne -
wymaga ponownego pomiaru, jeśli po żywym teście dalej będzie razić).

### Dopisek 28: "trzyma jak za rękojeść miecza" — pozycja NIESIENIE_TARCZA, druga iteracja

Dopisek 27 poprawił RUCH (tarcza przestała machać), ale zgłoszone wprost i
dosadnie: sama POZYCJA dalej wyglądała jak trzymanie miecza za rękojeść —
tarcza dyndająca przy nodze, nie noszona na przedramieniu. Przyczyna:
pierwsza wersja `NIESIENIE_TARCZA` była LUSTREM `NIESIENIE_1H` (poza
spoczynkowa miecza — ręka opuszczona przy biodrze), poprawna dla broni, ale
dla tarczy dająca dokładnie ten sam "wiszący" odczyt. Autor podesłał
referencję (rycerz z pawężem — przedramię ugięte W POPRZEK ciała, tarcza
wyżej, kąt osłaniający) i wprost zapytał, czy duże tarcze (pawęż) też
trzymałyby się jak miecz — tak, dokładnie tym samym mechanizmem, więc
naprawa jest wspólna dla całego systemu tarcz, nie tylko puklerza.

**Pierwsza próba naprawy** — użycie pozy "gotowość" z `POZY[0]`
(`char3d_attack.py`, wcześniej odrzucona dla BRONI jako "wygląda jak
zamach") — dała za MAŁY efekt: po przeliczeniu przez `_przenies` na
dzisiejsze (skrócone w tej sesji) proporcje, wysokość dłoni wyszła na ~44%
wzrostu, czyli DALEJ w okolicy biodra (samo biodro to 45% po dzisiejszym
skróceniu nóg), więc wizualnie prawie bez zmian. **Nauka:** wartości z
`POZY`/`NIESIENIE_*` są kalibrowane pod PROPORCJE Z MOMENTU ICH POMIARU, nie
pod procent wzrostu — po zmianie proporcji (dopisek 23, skrócenie nóg) ta
sama "readable" liczba przestała dawać ten sam odczyt.

**Finalna wersja:** `NIESIENIE_TARCZA` podniesiona i przesunięta mocniej do
przodu wprost liczbowo (nie przez pożyczenie innej gotowej pozy) —
zmierzona bezpośrednio na aktualnym rigu: dłoń ląduje na ~55% wzrostu (w
okolicy dołka podżebrza/dolnej klatki, wyraźnie nad biodrem) i wyraźnie
przed ciałem. Sprawdzone na renderze `game_px` (96×128, faktyczna
rozdzielczość gry): tarcza czyta się jako trzymana na przedramieniu i
prezentowana na zewnątrz, nie dyndająca.

⚠ Z boku ramię wychodzi dość mocno WYSUNIĘTE (nie ugięte ciasno w łokciu w
poprzek klatki, jak na referencji) — konsekwencja tego samego, wcześniej
zamkniętego ograniczenia: rig ma `use_stretch` na łańcuchu IK ręki i nie
zgina się naturalnie w łokciu (§11, dopisek 16, dzisiejszy dopisek 25) — to
NIE jest coś, co ta poprawka mogła naprawić przy okazji. Efekt end-to-end
(tarcza uniesiona, prezentowana na zewnątrz, nieruchoma w marszu) jest
mimo to wyraźnie bliższy referencji niż wcześniejsze "jak miecz".

**Zweryfikowane:** debug-pomiar bezpośredni (world position dłoni i środka
tarczy) potwierdza przesunięcie w górę o >2 j. i do przodu o >1,5 j.
względem dopisku 27. Render frontu i boku (wszystkie kąty, `game_px`
włącznie) — tarcza wyraźnie wyżej, prezentowana na zewnątrz. Eksport: obie
akcje z tarczą budują się czysto, te same (nienowe) 6 ostrzeżeń `atak` co na
kopii zapasowej sprzed sesji. `tsc` czysto. Skrypt broni: 30 znanych błędów,
zero nowych. Skrypt tarcz: 2/2 OK. Żywa gra: bezruch pokazuje tarczę wyraźnie
wyżej niż w dopisku 27, `dev.missing`/`totalFailed` puste.

⛔ Ruch dalej NIE zweryfikowany na żywo (bariera syntetycznego inputu, patrz
dopisek 25-27) — ocena oparta na renderze wszystkich klatek `Walk_Shielded`.
⏳ Otwarte: kąt łokcia z boku (wymaga faktycznego zgięcia stawu, zamknięte
bez viewportu Blendera), przeciw-rotacja lica przy większych tarczach
(pawęż) - do sprawdzenia analogicznie, gdy będzie testowana.

### Dopisek 29: "jak taca do pizzy" — dwa osobne błędy pod jednym objawem

Zgłoszone dosadnie ("on pizzę podaje?") ze zrzutów pokazujących tarczę raz
poprawnie, raz płasko-poziomo — NIEJEDNOLICIE między różnymi ujęciami tej
samej, statycznej (po dopisku 28) pozy niesienia. Zbadane pomiarem, nie
zgadywaniem, i znalezione DWIE niezależne przyczyny:

**Przyczyna 1 — niespójna zbieżność solvera między klatkami.** `_dopasuj`
liczy jakobian względem OBECNEJ konfiguracji reszty ramienia (bark/łokieć),
a ta była RÓŻNA na każdej klatce cyklu chodu (odziedziczona z oryginalnego
wymachu, zanim `_dopasuj` w ogóle zaczął liczyć). Zmierzone wprost: dla
tego samego celu klatka 2 lądowała 1,1 j. NIŻEJ niż klatki 0/1/3. Naprawa:
cały łańcuch lewego ramienia (bark/łokieć/cel łokcia) resetowany do JEDNEJ
stałej referencji (poza klatki 0) PRZED wywołaniem `_dopasuj` na każdej
klatce — ten sam trik co `ORIG_LOC` w `char3d_walk_lean.py` dla identycznego
rodzaju problemu po stronie chodu (dopisek 22). Po naprawie pozycja dłoni
zgodna w granicach ~0,4 j. na wszystkich 4 klatkach (było: rozjazd >1 j.).

**Przyczyna 2 — fizyczna, nie błąd: uniesienie dłoni w górę-i-w-przód
naturalnie SUPINUJE nadgarstek.** Zmierzone: lico tarczy (dotąd ~pionowe,
`normal.z≈0,01`) przechylało się do 0,40–0,55 w Z po podniesieniu pozy
niesienia w dopisku 28 — **to samo dzieje się z prawdziwą ręką**, gdy
unosisz ją i wyciągasz do przodu. Naprawa siedzi więc we WŁAŚCIWYM miejscu:
`obrot` tarczy (`char3d_shields.py`), nie w pozie ręki — dokładnie tę rolę
pełni pasek naramienny na prawdziwej tarczy (trzyma lico stabilnie mimo
obrotu przedramienia). Dodany kompensujący skręt −40° w X (obie tarcze,
`buckler` i `ironbound_shield`), dobrany pomiarem (test 5 kątów, wybrany
ten, który zbija `normal.z` najbliżej zera). Po naprawie: `normal.z` = od
−0,05 do −0,08 na wszystkich 4 klatkach (blisko pionu, spójnie).

⚠⚠ **`obrot` tarczy jest teraz SPRZĘŻONY z `NIESIENIE_TARCZA`** — to nie są
już niezależne stałe. Zmiana jednej bez przeliczenia drugiej wróci do
"tacy do pizzy". Komentarze w obu plikach wskazują na siebie nawzajem.

**Zweryfikowane:** pomiar bezpośredni (`normal` obiektu tarczy w świecie) na
wszystkich 4 klatkach `Walk_Shielded` — spójny, blisko pionu. Render frontu
i boku — pełne kolisty lico z przodu, cienka krawędź z boku (poprawne dla
pionowej tarczy), żadnej klatki "płasko". Eksport: 4 akcje budują się
czysto, te same (nienowe) 6 ostrzeżeń `atak`. `tsc` czysto. Skrypt broni: 30
znanych błędów, zero nowych. Skrypt tarcz: 2/2 OK. Żywa gra: tarcza
prezentuje się jako pełne koło, uniesione, bez przechylenia; `dev.missing`/
`totalFailed` puste.

⛔ Ruch dalej NIE zweryfikowany na żywo — ta sama, wielokrotnie potwierdzona
bariera syntetycznego inputu w tym środowisku.

### Dopisek 30: "W WALCE" jako prawdziwy stan gry, spięty z istniejącym aggro/pościgiem (WDROŻONE)

Autor doprecyzował dopisek 29: nie chce prostego timera po ataku/obrażeniu —
chce stanu analogicznego do Combat we WoW, i **wprost poprosił, żeby najpierw
sprawdzić, czy gra już ma z czego wywnioskować "gracz jest w walce"**, zanim
cokolwiek zbuduję. Sprawdzone: `Enemy.isChasing` (publiczny getter,
`src/entities/Enemy.ts`) **już jest dokładnie tym sygnałem** — prawda, gdy
`aiState === "chase"`, już używany produkcyjnie przez `GameScene.
refocusReachableAttacker` do wyboru celu. Zero nowego mechanizmu potrzebne.

**Wdrożone, najmniejszym możliwym krokiem:**
- `Player.wWalce` — publiczne, ustawiane POLE (nie getter liczący coś
  wewnętrznie), bo Player nie ma i nie powinien mieć wglądu w listę wrogów.
- `GameScene.update()` ustawia je co klatkę: `this.enemies.getChildren().
  some(e => !e.isDead && e.active && e.isChasing)` — jeden żywy wróg
  aktywnie ścigający gracza wystarczy; patrolujący/uciekający się nie liczy
  (ta sama dystynkcja, którą `isChasing` już niesie gdzie indziej).
- Cofnięty wcześniejszy pomysł (timer na `lastDamagedAt`/`lastAttackedAt`,
  `PLAYER.combatStanceMs`) — usunięty z `Player.ts`/`GameConfig.ts` w całości,
  zero pozostałości.
- `Character3D.ts` czyta `gracz.wWalce` w `krok()` (ten sam wzorzec co
  `isSwinging`/`attackFacing`) i wybiera jedną z DWÓCH par animacji chodu z
  tarczą: `Walk_Shielded`/`Walk_Shielded_Combat` i `Walk_Armed_Shielded`/
  `Walk_Armed_Shielded_Combat` (cztery klipy zamiast dwóch — `char3d_chod.py`
  i `char3d_export_gltf.py` budują teraz obie wersje na zapas).

**Tarcza — dwie pozy, jeden kompromis nazwiany wprost:** `NIESIENIE_TARCZA_
SPOCZYNEK` (mirror `NIESIENIE_1H`, opuszczona wzdłuż ciała) ma poprawny pion
(`normal.z≈0,02-0,09`). `NIESIENIE_TARCZA_WALKA` (wysunięta) dalej ma
resztkowe przechylenie (~0,34-0,4 zamiast 0) — **próba kompensacji przez
`obrot` przedmiotu ZDJĘTA**, bo jedna, współdzielona wartość psuła spoczynek
bardziej niż brak kompensacji (zmierzone: normal.z spadał do -0,56 do -0,63).
Sprawdzona też i ZAMKNIĘTA ślepa uliczka: obrót KONTROLKI IK (`HandIK_L.005`)
nie ma żadnego wpływu na obrót efektora — zmierzone wprost (4 różne obroty,
identyczny wynik za każdym razem) — więc kompensacja per-poza nie da się
zrobić tą drogą. Zamiast tego dobrany najłagodniejszy z przetestowanych
celów (mniej ekstremalny, ale wciąż wyraźnie wysunięty).

**Zweryfikowane na ŻYWYM wrogu (nie manekinie treningowym — patrz pułapka
niżej):** króliczek zaagrowany wprost (`rabbit.aggro()`) na mapie lasu →
`player.wWalce` faktycznie przeszło na `true` w kolejnej klatce → żywy zrzut
pokazuje tarczę wyraźnie wyżej/do przodu (widoczna zza krzaka), różna od
pozycji spoczynkowej. `tsc --noEmit` czysto. `dev.missing`/`totalFailed`
puste. Skrypty broni/tarcz: te same 30 znanych błędów broni + 2/2 tarcz OK
(niezmienione przez tę rundę - dotyczy tylko wyboru animacji/logiki gry).

⚠⚠ **Pułapka złapana W TRAKCIE tej weryfikacji, warta zapisania**: pierwszy
test używał `TrainingDummy` (jedyny wróg na mapie wioski) i `wWalce` uparcie
zostawało `false` mimo `dummy.isChasing === true` zaraz po `.aggro()`.
Debugowanie (console.log na każdym kroku, potwierdzenie że `update()`
faktycznie się wykonuje) doprowadziło do: `TrainingDummy` ma **`aggroRange:
0`** (celowo - to manekin do ćwiczeń, nie potwór) i jego własna pętla AI
deaggruje go w tej samej lub następnej klatce, zanim zdąży to złapać
jakikolwiek zewnętrzny odczyt oparty na pollingu. **Manekin treningowy nie
nadaje się do testowania trwałego stanu pościgu** - właściwy test wymaga
prawdziwego, wrogiego stworzenia (potwierdzone na króliku na mapie lasu).

⏳ Otwarte: przechylenie lica tarczy w pozie walki (~0,35 zamiast 0) -
zaakceptowane jako świadomy kompromis, opisany wprost w komentarzu przy
`NIESIENIE_TARCZA_WALKA`. Poprawna naprawa wymagałaby drugiego wariantu
siatki tarczy przełączanego w `Character3D.ts` (odłożone na wyraźne
życzenie autora - "nie rób teraz drugiego mesha tarczy").

### Dopisek 31: SPOCZYNEK dalej przenikał ciało — źle zweryfikowane w dopisku 30

Zgłoszone dosadnie: mimo raportu "spoczynek ma poprawny pion" w dopisku
28/30, tarcza w tej pozie **faktycznie przenikała biodro/udo** i wizualnie
czytała się jako trzymana "przed sobą", nie "z boku". Błąd był mój — dopisek
28 zmierzył wyłącznie ORIENTACJĘ lica (`normal.z`), nigdy nie sprawdził
renderem, czy sam DYSK nie zachodzi na tors. Dokładnie ta pułapka, przed
którą ostrzega `tools/CLAUDE.md` ("PATRZ NA RENDER, NIE TYLKO NA RAPORT") -
sprawdziłem liczbę, nie obraz.

**Przyczyna geometryczna:** `NIESIENIE_TARCZA_SPOCZYNEK` był mirrorem
`NIESIENIE_1H` (dłoń ~1,79 j. od osi ciała) — poprawne dla MIECZA (cienkie
ostrze, wisi wzdłuż nogi), ale tarcza to **płaski dysk o promieniu 0,82 j.**
wyśrodkowany blisko tej samej dłoni. Przy promieniu prawie połowy odległości
dłoni od osi ciała, WEWNĘTRZNA krawędź dysku nieuchronnie ląduje głęboko
wewnątrz obrysu tułowia, niezależnie od orientacji lica.

**Naprawa:** dłoń odsunięta dalej od ciała i lekko do przodu/niżej
(`(1,79, 0,45, -6,74)` → `(2,2, 0,1, -6,6)`) — sam mirror pozostaje ideą
(opuszczona, spoczynkowa reka), ale z odległością dobraną pod SZEROKOŚĆ
DYSKU, nie pod cienkie ostrze. `obrot` przedmiotu nietknięty.

**Zweryfikowane RENDEREM tym razem** (przód/bok/`game_px`, wszystkie 4
klatki): tarcza wyraźnie odseparowana od uda, żadnego zachodzenia na tors.
Żywa gra (postać na otwartym terenie, zoom 9×): to samo — tarcza czytelnie
"z boku", nie "przed sobą", bez przenikania. `tsc` czysto, eksport 6 akcji
bez błędu, skrypty broni/tarcz — te same 30/0 znanych błędów, zero nowych.

⚠ **Lekcja do zapamiętania na przyszłość**: przy KAŻDEJ zmianie pozycji
przedmiotu o realnej OBJĘTOŚCI (nie tylko orientacji) trzeba sprawdzić
renderem, czy sama BRYŁA nie zachodzi na ciało - pomiar samej orientacji
(normal wektora) nie wystarcza i może dać fałszywe "OK".

### Dopisek 32: dopisek 31 też był złym kierunkiem — grif ma zostać PRZY biodrze, nie odjeżdżać od niego

Autor przesłał referencję (grafika wojowniczki wikińskiej) i sprecyzował
istotę problemu inaczej niż dopisek 31 ją zrozumiał: **"jak idziesz lub
biegniesz to nie trzymasz tarczy na przeciw ciała tylko z boku ciała"** —
porównanie do referencji pokazuje, że NA CAŁEJ referencji łokieć/uchwyt
siedzi blisko biodra, a tarcza zasłania bok sylwetki, **nie wisi na
wyciągniętym ramieniu z dala od tułowia**. Dopisek 31 poszedł w złą stronę:
odsunięcie dłoni od ciała (`1,79→2,2` j.) naprawiło przenikanie, ale
zamieniło "trzyma z boku" na "trzyma na wyciągniętej ręce" — de facto ten
sam błąd z innej strony.

**Naprawa: `NIESIENIE_TARCZA_SPOCZYNEK` cofnięty do `(1,79, 0,45, -6,74)`**
(mirror `NIESIENIE_1H`, jak przed dopiskiem 31) — grif wraca blisko ciała.
Przenikanie z dopisku 31 miało zostać rozwiązane INNĄ osią: przez `chwyt`
tarczy (`char3d_shields.py`, przesunięcie dysku względem dłoni), nie przez
oddalanie całej ręki od tułowia.

⚠⚠ **`chwyt` w tym kierunku NIE POMAGA — zmierzone, nie zgadywane.**
Test bezpośredni (`chwyt.z` 0,30→0,45→0,60→0,75 na pozycji spoczynku)
pokazał, że zwiększanie tego parametru przesuwa środek dysku w świecie
BLIŻEJ osi ciała (X dysku: 2,02→1,88→1,75→1,61), nie dalej — bo przy
orientacji dłoni w tej konkretnej pozie lokalna oś Z częściowo wskazuje
z powrotem w stronę tułowia. Skutek: **`chwyt` pozostawiony na wartości
domyślnej `(0,0, -0,05, 0,30)`, nietknięty.** Pewien poziom styku
dłoń/biodro-dysk jest przy tej geometrii (promień dysku 0,82 j.) fizycznie
nieunikniony przy pozycji "blisko ciała" — i to jest **zgodne z referencją**,
która też pokazuje tarczę stykającą się z sylwetką, nie unoszącą się w
próżni obok niej.

**Zweryfikowane RENDEREM i ŻYWĄ GRĄ (nie samym raportem):**
- Blender: `spoczcheck_f1_front.png`/`_bok.png` w 96×128 (`game_px`) i
  400×600 — tarcza blisko biodra, mały, naturalny zachód, porównywalny do
  poziomu styku widocznego na samej referencji.
- Żywa gra (zoom 9×, front): tarcza czytelnie przy biodrze, bez dramatycznego
  przenikania przez tors.
- Żywa gra (zoom 14×, profil — `p.moveDir = "right"`/`"left"` ustawione
  wprost z konsoli, bo syntetyczny input klawiatury/joysticka nie działa w
  tym środowisku, patrz pułapka niżej): tarcza w większości ZASŁONIĘTA przez
  ramię/tułów (poprawna okluzja profilowa dla tarczy trzymanej pionowo przy
  boku), widoczny tylko wąski skrawek krawędzi na wysokości biodra — bez
  śladu przebijania siatki przez klatkę piersiową czy nogę.
- `tsc --noEmit` czysto, eksport 6 akcji chodu bez błędu, `dev.missing`/
  `load.totalFailed` puste, skrypty broni/tarcz: te same znane 30/0 błędów,
  zero nowych.

⚠⚠ **Pułapka złapana przy tej weryfikacji: `p.moveDir = "..."` zmienia
widoczną orientację modelu 3D TYLKO gdy jest ustawiane RAZEM z ruchem
(nawet minimalnym) — ustawione samo, przy `body.velocity` zerowym, NIE
zmienia renderowanej klatki.** Prawdziwy ruch (klawiatura przez
`KeyboardEvent`/`PointerEvent` syntetyczne, joystick przez `pointerdown`/
`pointermove`/`pointerup` syntetyczne, wymuszona prędkość przez
`body.setVelocity` utrzymywana w pętli `requestAnimationFrame`) **nie
zadziałał w tej sesji przeglądarkowej** — pozycja gracza nigdy się nie
zmieniła mimo kilku niezależnych prób. Zadziałało dopiero ustawienie
`p.moveDir` w momencie, gdy sekwencja poprzednich prób zostawiła jakiś ruch
"w locie" — nie w pełni wyjaśnione, ale odtwarzalne: ustaw `moveDir`, zrób
zrzut, jeśli kąt się nie zmienił, spróbuj ponownie po dowolnej próbie
wymuszenia prędkości. Dla przyszłej sesji: **nie ufaj pierwszemu zrzutowi
po samej zmianie `moveDir` bez ruchu** — potwierdź kątem sylwetki na
zrzucie, nie tylko brakiem błędu w konsoli.

⏳ Otwarte (bez zmian względem dopisku 30): przechylenie lica tarczy w pozie
WALKI (~0,35 zamiast 0) — świadomy, opisany kompromis. Pozycja SPOCZYNEK
uznana za zamkniętą do czasu konkretnej uwagi z rozgrywki.

---

## 32. Cios przestał być czterokierunkowy (2026-09-22)

⭐⭐ **Domknięcie tego, co A5 zaczęło dla ruchu.** Model obracał się ciągle
w marszu i w bezruchu od A5, a osłona od `OI-140` (A6.3) — ale **sam zamach
dalej skakał do jednej z czterech stron**. `atakTrwa` blokuje ciągłą
aktualizację zwrotu na CAŁY czas ciosu, więc postać stała przekrzywiona aż do
jego końca. Zgłoszone przez autora z manekina: *„postać atakuje tylko jakby
była topdown, a jest przecież 3D"*.

⚠ **To był relikt arkusza, nie decyzja o walce.** `aimAttackAt` dostaje wektor
celowania w pełnych 360° i **kwantował go do czterech stron**, bo w epoce
`Character.png` nie było komu podać czegoś więcej. Kąt analogowy był więc na
miejscu i był wyrzucany.

### Co się zmieniło

| | przed | po |
|---|---|---|
| `Player.attackDir` | `Direction` (4) | **bez zmian** — arkusz 2D ma fizycznie cztery rzędy |
| `Player.attackRad` | — | nowe, ciągłe; ta sama para co `moveDir`/`zwrotRad` |
| `Character3D.zagrajAtak` | `Direction` | `Direction \| number` |
| `Player.guardKat` w oknie zamachu | `dirToAngle(attackDir)` | `attackRad` |

⛔ **`attackDir` NIE znika i nie ma zniknąć** — arkusz 2D jest ścieżką
awaryjną, a geometria łuku korzysta z niego od dawna. To jest DRUGI ODBIORCA
tego samego wektora, nie drugi system celowania.

⚠⚠ **`guardKat` MUSIAŁO pójść razem — to nie jest poszerzenie zakresu.**
Reguła tej własności brzmi „osłona kryje to, co widać". Dopóki zamach skakał do
ćwiartki, ćwiartka BYŁA tym, co widać. Zostawienie tam `dirToAngle` po
uciągleniu ciosu odtworzyłoby **`OI-140` wewnątrz okna zamachu**: tarcza
kryłaby ćwiartkę, a postać jawnie patrzyłaby pod innym kątem.

### Dlaczego animacja nie wymagała niczego

⭐ Klip `Attack` jest **kierunkowo obojętny** — orientuje go obrót korzenia
(`korzen.rotation.y`). Uciąglenie to wyłącznie inny kąt podany do tego samego
obrotu; po stronie Blendera zero zmian.

### Regresja

Na czterech kierunkach kardynalnych nowy kąt ciągły daje **bit-w-bit** to, co
dawała ćwiartka (`atan2(x, y)`: down 0, right π/2, up π, left −π/2 — różnica
< 1e-12). Ten sam argument, którym zamknięto `OI-140`. Kierunki pośrednie,
dawniej niedostępne: SE 45°, NE 135°, SSE 26,6°.

`tsc` i `npm run build` czysto.

⚠ **Usunięte przy okazji: `dirToAngle`** w `Player.ts` — straciło ostatniego
czytelnika. ⛔ Nie przywracaj go „na wszelki wypadek": jego istnienie kusiło,
żeby osłona wracała do ćwiartki.

### ⏳ Co to ODSŁANIA, a czego nie rusza

⛔ **Przeciwnicy są dalej dwuwymiarowi** (`OI-3D-3`) i ta zmiana ich nie
dotyczy. Oryginalna decyzja (`2026-09-08-postac-3d-jako-zrodlo.md`) wyłączyła
ich explicite: zmierzony koszt dotyczył JEDNEJ postaci, siedmiu wrogów to
osobny rachunek — nie „przy okazji".

⏳ Niezweryfikowane w uruchomionej grze: zmiana jest sprawdzona typami,
buildem i regresją kąta, ale **nie oglądana w ruchu**. Pierwsza rzecz do
obejrzenia na manekinie.

---

## 33. Obrót postaci przestał być skokowy (2026-09-22)

Zgłoszone zaraz po §32: *„idle jest 4-kierunkowe, po ataku pod kątem postać
wraca jakby była w 4 kierunkach"*.

⚠⚠ **Diagnoza rozdzieliła to na dwie rzeczy i tylko jedna była po stronie
modelu.**

**(1) Ziarnistość wejścia — NIE do naprawienia w modelu.** Klawiatura buduje
wektor jako `x, y ∈ {−1, 0, 1}` po normalizacji
(`VirtualJoystick.update`), czyli najwyżej **osiem** kierunków, a przy jednym
klawiszu cztery. `zwrotRad = atan2(x, y)` nie ma z czego wziąć nic pomiędzy.
⛔ Żadna zmiana w `Character3D` tego nie poszerzy — to jest decyzja
o STEROWANIU, nie o postaci. Na dotyku wejście jest ciągłe
(`InputState.move.set(cos·mag, sin·mag)`) i tam problemu nie było.

**(2) SKOK między kierunkami — to było do naprawienia.** `this.kat`
przeskakiwał do `zwrotKat` natychmiast, więc 45-stopniowe kroki czytały się
jak postać czterokierunkowa. Doszło `TEMPO_OBROTU = 14 rad/s` i dociąganie
najkrótszym łukiem (`dociagnijKat`).

Zmierzone: 90° w **117 ms** (7 klatek), przekątna 45° w 67 ms, pełny zawrót
180° w 233 ms.

⚠ **Owijanie przez ±π jest istotą, nie ozdobą**: bez sprowadzenia różnicy do
(−π, π] obrót ze 170° na −170° jechałby 340° dookoła zamiast 20° w drugą
stronę — czyli dokładnie w momencie, w którym gracz zawraca. Sprawdzone:
**2 klatki**, nie 26.

⛔ **Wejście w cios zostaje natychmiastowe** (`zagrajAtak` ustawia `kat`
wprost). Wygładzenie obejmuje ruch, bezruch i POWRÓT PO CIOSIE — czyli to,
co autor zgłosił — ale zamach nie „dojeżdża" do celu.

⚠ To jest tempo **PREZENTACJI**. Geometria ciosu i osłony czyta `Player`
(`attackRad`, `zwrotRad`) i obrotu modelu nie widzi, więc wygładzenie nie może
wpłynąć na to, co trafia ani co blokuje.

⏳ Niezweryfikowane w ruchu — `TEMPO_OBROTU` to jedna liczba do pokręcenia,
jeśli 117 ms na 90° okaże się za wolne albo za szybkie.

---

## 34. Wymach rąk zmniejszony (2026-09-21) — zapisane po fakcie

⚠ Chronologicznie POPRZEDZA §32–33; wpisane później, bo sesja szła dalej.

`char3d_walk.WYMACH_RAK = 0,70` — rozpiętość nadgarstka **33 cm → 23 cm**.

⚠⚠ **Wymach był wpisany w DWÓCH miejscach** — `char3d_walk.RECE`
i `char3d_walk_lean.ORIG_LOC`, te same sześć krotek. Ponieważ `walk_lean`
biegnie PO `walk` i nadpisuje kanały `HandIK`, to **druga kopia decydowała
o wyniku** — zmiana tylko w pierwszej nie dałaby nic widocznego. Dziś jedno
źródło, `walk_lean` importuje.

⛔ **`srodek` nie jest skalowany i nie może być** — to poza kalibrująca bazę
liniową ciosu (`char3d_attack.BAZA_LOCAL`), lądująca na klatce bezruchu.
Amplituda ściąga skrajne pozy DO środka, zamiast przesuwać całość.

Weryfikacja: `[chod] asercje: OK`, `[bezruch] 12552 pozycji, max różnica
0,00e+00 j.` — poza stojąca bit w bit nietknięta. Sprawdzone też 0,55 (18 cm),
też zielone, gdyby trzeba było mocniej.

⚠ **Stan zastany, nie regresja:** eksport zgłasza `[atak] UWAGA: 3 pozy poza
tolerancją 0,85` (prawa dłoń, klatki 1–2). Sprawdzone na `char.blend` sprzed
zmiany — **identyczne**.

---

## 35. Wypad zamachu zrównany z pozą (2026-09-22)

Zgłoszone po §32–33: *„mimowolnie się przemieszcza do celu i potem wraca
czasami dziwnie do pozycji, w której stał"*.

**Ruch jest prawdziwy i zamierzony:** `PLAYER.swingLunge = { px: 6, ms: 70 }`,
`applyImpulse` rusza FIZYCZNYM ciałem 6 px do przodu i wraca. To nie jest
błąd — to „feel" zamachu, istniejący od dawna.

⚠⚠ **Ale kierunek wypadu był mój błąd.** `heading = dirToOffset(attackDir)`
jest SKWANTOWANE. Odkąd model obraca się pod prawdziwy kąt (`attackRad`, §32),
wypad wzdłuż ćwiartki odjeżdżał nawet **45° od tego, w co postać jawnie
patrzy** — przy celu pod 45° składowa boczna to **4,2 px z 6 px** wypadu.
Stąd „dziwnie".

Naprawa: wypad liczy się z `attackRad`. ⛔ **Trafianie nietknięte** — `offset`
(środek hitboxa) dalej z `heading`.

### ⏳ Co to ODSŁONIŁO — `OI-147`

Hitbox **od zawsze** siedzi na osi kardynalnej, 40 px przed postacią.
Odsunięcie jego środka od rzeczywistego kierunku celu: 15° → **10,4 px**,
26,6° → **18,4 px**, 45° → **30,6 px**, przy promieniu hitboxa 26 px.

⚠ To jest stan ZASTANY, nie regresja: gdy poza też była czterokierunkowa,
poza i hitbox zgadzały się ze sobą (oba skwantowane). Dziś poza i wypad idą
za `attackRad`, więc rozjazd hitboxa stał się widoczny.

⛔ Zrównanie hitboxa z celowaniem **rusza geometrią walki** — to decyzja
autora, nie poprawka przy okazji.

⚠⚠ **Ten podrozdział jest NIEAKTUALNY w swojej przesłance — patrz §36.**
„Hitbox" z `triggerAttack` nie bierze udziału w trafianiu; niesie wyłącznie
pierścień efektu.

## 36. Audyt geometrii ataku — `OI-147` przeformułowane, celowanie w przestrzeni CIAŁ (2026-09-23)

Kierunek po §32–35: *nie modelujemy dalej anatomii, stabilizujemy geometrię
walki.* Łańcuch `input → moveDir → zwrotRad → attackRad → obrót → Attack →
lunge → hitbox → reach → guard` sprawdzony w kodzie i **na żywo** (las,
siedem gatunków, 8–13 kątów, miecz, zasięg 68). Tymczasowa nakładka debugowa
żyła wyłącznie w konsoli przeglądarki — w kodzie gry nie została.

### 36.1 `OI-147`: hitboxa ciosu NIE MA

Autoatak jest od 2026-08-23 jednocelowy. O trafieniu decydują wyłącznie:

- **tożsamość celu + zasięg** — `damageLockedTarget` → `targetInReach`,
  od `combatOrigin` gracza do KRAWĘDZI hurtboxa celu;
- **bramka zwrotu** — `canStrikeFacing`, ciągły `zwrotKat`, ±90°
  (`FRONT_ARC_DEG`), w przestrzeni ciał, sprawdzana PRZED zamachem.

`x/y` zwracane przez `triggerAttack` **nie są czytane nigdzie**; `dirX/dirY`
jadą do `pendingSwing` wyłącznie po to, żeby narysować `spawnSwingFx`.
Odrzut wroga liczy się od `combatOrigin`, nie od `heading`.

Pomiar na manekinie, 13 kątów: model = `attackRad` = wypad co do 0,1°,
wypad 5,88 px, **trafienie 13/13** — także tam, gdzie środek pierścienia leżał
**52 px** od celu przy promieniu 26. Pierścień stoi na ćwiartce, do 43,7 px
w bok od linii ciosu.

**Warianty z zapytania:** A (pierścień za `attackRad`) zmienia WYŁĄCZNIE
prezentację — zero skutków dla zasięgu, granic trafienia, tarczy i balansu;
B to stan zastany; C (łuk/margines) jest zbędne, bo ten łuk już istnieje:
to `canStrikeFacing` + zasięg w chwili trafienia. ⏳ Wariant A **niewdrożony**.

### 36.2 Rozjazd, który był naprawdę: celowanie DUSZEK → DUSZEK — ✅ NAPRAWIONE

Trzy miejsca celowały wektorem `target.x − player.x` (środki SPRITE'ÓW):
autoatak (`resolveAttack`), Ciężkie uderzenie / Uderzenie tarczą
(`commitPlayerAction`) i lot Szarży/Wypadu (`stepRush` — kurs, zwrot w locie
i celowanie na dobiegnięciu). Zasięg i bramka zwrotu mierzą w przestrzeni ciał.
Ciało gracza leży **21,7 px** pod duszkiem, ciała wrogów 2,3–15,7 px — wektor
przekrzywiał się ku pionowi, różnie dla każdego gatunku.

Błąd `attackRad` względem kierunku do ciała celu (odstęp 8 px), PRZED:

| wróg | 90° | 45° | 135° |
|---|---|---|---|
| skoczek jadowity | 30,3° | **36,7°** | 17,5° |
| królik | 25,4° | 28,8° | 13,8° |
| sieciarz | 21,0° | 22,8° | 9,5° |
| dzik | 19,0° | 16,8° | 11,1° |
| niedźwiedź / wilk | – | 16,8 / 16,7° | 12,1 / 8,9° |
| Szary | 8,7° | 8,3° | 7,1° |

Na osi N/S zero. Za `attackRad` szły model, wypad zamachu i — w oknie
zamachu — **osłona** (`guardKat`), a ciosy przychodzące liczą się
w przestrzeni ciał (`Enemy.hitVectorTo`) — więc granice stref tarczy
przesuwały się na czas zamachu nawet o ~37°. Przy nachodzących ciałach cios
w cel na północy odwracał się o 180° (zmierzone 188,9°).

**Naprawa:** `GameScene.bodyVectorTo(target)` — `combatOrigin` →
`combatBody` — w tych trzech miejscach. Ta sama lekcja, którą wcześniej
dostał pocisk sieciarza (`Spider.fire`).

**PO (na żywo, 7 gatunków × 8 kątów):** błąd `attackRad`, modelu i osłony
**0,0°** wszędzie; wypad 5,99 px wzdłuż tej samej osi. Lot: kurs ≤ 0,8° od
ciała celu, zwrot na dobiegnięciu ≤ 1,7°. `tsc`, `build`,
`combat_regresja` 121/121 bez różnic.

⚠ **Wypad 0 px to NIE regresja.** Występuje dokładnie wtedy, gdy prostokąt
kroku zahacza STATYCZNE ciało terenu — zawór `zablokowaneW`
w `core/CombatImpulse.ts` (zmierzone 12/12: 0 px ⇔ przeszkoda statyczna).

⚠ **Test na żywo w ukrytym panelu przeglądarki:** `requestAnimationFrame`
staje, zegar sceny też (0 klatek / 500 ms) — zamach nigdy się nie rozstrzyga,
a model nie obraca. Pompowane ręcznie `game.step(performance.now(), 16.67)`
co 16 ms. Bez tego pomiar wygląda jak zepsuty kod.

### 36.3 Co zostało czterokierunkowe (potwierdzone na żywo, NIE naprawiane)

| OI | gdzie | pomiar | skutek |
|---|---|---|---|
| `OI-148` | `Player.facingVector` = `dirToOffset(moveDir)` — oś zapasowa Szerokiego cięcia, Wypadu bez celu, `defaultAimIntent` | model 30°/45°/60° → oś 0°/0°/90° | klin wybiera cele do 45° obok tego, w co postać patrzy; model przeskakuje do ćwiartki |
| `OI-149` | `Player.dash` bez drążka → `dirToOffset(moveDir)` | model 45° → unik 0° | przewrót do 45° obok zwrotu |
| `OI-150` | Wir ostrzy: `triggerAttack` bez celowania, `attackRad` z POPRZEDNIEGO ciosu | zwrot 270° → model i osłona 90° | przez pozę Wiru tarcza kryje PLECY; odziedziczone po 2D |
| (w `OI-148`) | ślad pudła (`damageMatchingEnemies`) z `facingVector` | – | wyłącznie prezentacja |

⚠ Komentarz przy `facingVector` („zwrot wizualny zostaje czterokierunkowy”)
opisuje stan sprzed A5. `OI-148`, `OI-149` i ślad pudła rozstrzyga JEDNA
decyzja: czy `facingVector` ma być ciągły.

**Spójne i zweryfikowane:** `canStrikeFacing`, zasięg, reguła `guardKat`,
`Character3D` (`attackKat`), wypad zamachu, `castCleave` przy przeciągnięciu,
`hitVectorTo`, pocisk sieciarza, odrzut. `attackDir` zostaje wyłącznie dla
arkusza 2D (miecz 2D gaśnie przy modelu 3D).

**Poza zakresem, zapisane:** kierunek kopnięcia napastnika przy trafieniu
(`effectsFor.dir`) i sortowanie odległości przy Wypadzie liczą się między
duszkami — nie celują ciosu, nie ruszane.

## 37. Audyt `OI-118` — tempo ciosu 3D a `swingDurationMs` (2026-09-27)

Audyt TECHNICZNY, zgodnie z brzmieniem `OI-118`: **opis stanu, bez zmian
w `Character3D` i bez ruszania `TEMPO_ATAKU`**. Pomiar na żywo (wioska,
miecz; zamachy wyzwalane `triggerAttack` z zadanym `durationMs`).

### 37.1 Stan

- Klip `Attack` / `Attack_2H`: klatki 0–4 przy scenie 5 fps = **0,8 s**,
  `timeScale = TEMPO_ATAKU` (2,2) → **364 ms dla KAŻDEJ broni i akcji**.
  Warstwa 3D **nie czyta** `swingDurationMs`, `durationMs` akcji ani
  `attackPoseUntil` — zna wyłącznie zbocze `isSwinging` i kąt `attackKat`.
- Faza „cięcie" to klatka 2 (`tools/char3d_attack.py`, `POZY`) → na ekranie
  **182 ms** po starcie ciosu, zawsze.
- Gra rozstrzyga trafienie w `swingDurationMs × swingHitFraction` (0,5), poza
  trwa `swingDurationMs + swingPoseBufferMs` (40). Zakres katalogu:
  **130 ms (nóż) … 340 ms (miecz dwuręczny)**; akcje: Wypad 300,
  Uderzenie tarczą 360, **Ciężkie uderzenie 840** (`windupMs × 2`).

| cios | trafienie w grze | cięcie na modelu | różnica |
|---|---|---|---|
| nóż / sztylet / mizerykordia | 65 / 70 / 75 ms | 182 ms | trafienie **107–117 ms PRZED** cięciem — w fazie zamachu |
| miecz | 90 ms | 182 ms | 92 ms przed |
| miecz dwuręczny | 170 ms | 182 ms | ~zgodne |
| Uderzenie tarczą | 180 ms | 182 ms | zgodne, ale klip gra **2×** (niżej) |
| Ciężkie uderzenie | 420 ms | 182 ms | klip gra **3×** (niżej) |

### 37.2 ⚠ Usterka odkryta przy audycie — klip gra kilka razy (`OI-151`)

Wyzwalanie jest POZIOMOWE: `krok()` woła `zagrajAtak`, gdy
`isSwinging && !atakTrwa`. Gdy poza trwa dłużej niż klip, po jego końcu
(`finished` zeruje `atakTrwa`) warunek jest znów prawdziwy i cios startuje od
nowa. Zmierzone liczniki startu klipu w jednym zamachu:

| poza | starty klipu (t od początku) |
|---|---|
| sztylet 180 ms · miecz 220 · miecz dwuręczny 380 | **1×** |
| Uderzenie tarczą 400 ms | **2×** (16, 384 ms) |
| Ciężkie uderzenie 880 ms | **3×** (15, 383, 752 ms) |

Gracz widzi trzy ciosy, gra zadaje jeden. ⚠ Miecz dwuręczny (380 ms) mieści
się tylko dzięki zanikaniu wagi — o włos.

### 37.3 Fakty dla decyzji autora (nie propozycja)

- Klatka cięcia leży w **połowie** klipu (2 z 4), a gra trafia w **połowie**
  zamachu (`swingHitFraction` 0,5). Klip rozciągnięty do długości zamachu
  (`timeScale = 800 / swingDurationMs`) trafiałby cięciem dokładnie w chwilę
  rozstrzygnięcia — ta zbieżność wynika z danych, nie jest projektem.
- Po takiej zmianie `timeScale` sięgałby od **0,95** (Ciężkie uderzenie)
  do **6,15** (nóż): jedna klatka zamachu noża i sztyletu trwałaby 33–35 ms.
  Czytelność tak szybkiego zamachu to pytanie o odbiór, nie o liczby.
- `OI-151` jest rozłączne z synchronizacją: znika też przy samym wyzwalaniu
  ZBOCZEM (nowy zamach, nie trwająca poza), bez ruszania tempa.

## 38. Wycofanie modelu 4 kierunków gracza (2026-09-27)

Decyzja autora (skonsultowana też z ChatGPT): **4 kierunki przestają być
źródłem prawdy o graczu.** Gracz operuje na ciągłym kącie, a przeliczenie na
ćwiartkę zostaje wyłącznie na granicy legacy 2D. **Arkusz 2D zostaje** jako
ścieżka awaryjna i obraz pierwszych klatek sceny (model wczytuje się
asynchronicznie, portal restartuje scenę). `Direction` zwierząt i wrogów
nieruszane — ich przejście na 3D to osobny temat.

### 38.1 Audyt — co zależało od 4 kierunków

| grupa | miejsca | los |
|---|---|---|
| mechanika | `facingVector` (oś zapasowa Szerokiego cięcia, Wypadu, `defaultAimIntent`, ślad pudła), `dash()` bez drążka | etap 1 — na kąt |
| martwe | `guardDir`, `attackFacing`, `facingDir` (zero konsumentów w grze), `KAT_ZWROTU` + ścieżka awaryjna w `Character3D` | etap 2 — usunięte |
| stan | pola `moveDir`, `attackDir`, `vectorToDirection` | etap 3 — usunięte; rząd arkusza z `wierszArkusza(rad)` |
| typ | `GuardFacing = Direction \| number` — ćwiartki podawały już tylko dane testowe | etap 4 — `number` |

### 38.2 Wyniki etapów

- **Etap 1 (zmienia rozgrywkę; `OI-148`, `OI-149` ZAMKNIĘTE).** Na żywo,
  6 kątów × 5 ścieżek: zwrot = intencja domyślna = Szerokie cięcie = Wypad bez
  celu = unik bez drążka, co do 0,1°. Przed zmianą 30° → 0°, 60° → 90°.
  Ślad pudła idzie za kątem CIOSU (`attackKat`), nie zwrotu — pudło należy do
  zamachu, a bramka dopuszcza cel do 90° od zwrotu.
- **Etap 2.** Asercja `tarcze_przymiar` N1 przepisana na regułę `guardKat`.
  ⚠ **Stara N1 przeszłaby po usunięciu gettera NA PUSTYM WYCINKU**
  (`indexOf` = −1). Nowa wymaga istnienia gettera i czyta kod bez komentarzy;
  sprawdzone mutacjami, że każda z trzech linii potrafi zaświecić na czerwono.
  `dev.char3d.cios(stopnie)` — kompas ekranu (0 = w górę, 90 = w prawo).
- **Etap 3.** `Player` trzyma wyłącznie `zwrotRad` i `attackRad`. Arkusz 2D
  (animacja, miecz 2D z `handOffsets`/`tiltDeg` per rząd) bierze rząd
  z `wierszArkusza` w chwili rysowania. Na żywo z wymuszonym arkuszem,
  16 kątów: rząd chodu i ciosu identyczny ze starą regułą na 14/16; dwa
  „różne" to ten sam punkt **dokładnie 45°** — remis osi rozstrzygany szumem
  zmiennoprzecinkowym (stara: `cos(π/4)` o bit większy → „up"; nowa przez
  `atan2` → „right"). Obie odpowiedzi równie dobre, dotyczy tylko arkusza.
- **Etap 4.** Dane testowe przeszły na kąty (0 = w dół, π/2 = w prawo) —
  konwersja żyje w `tools/`, nie w grze. `combat_regresja` **121/121 bit
  w bit**, `tarcze_przymiar` 0 czerwonych **łącznie z testami granic ostrych
  na dokładnie 90°**: szum `cos(π/2)` ≈ 6e-17 daje w stopniach ~3,5e-15, mniej
  niż pół ulp liczby 90, więc kąt wychodzi równo 90,0.

Po każdym etapie: `tsc`, `build`, `combat_regresja` 121/121, `doc_check`.

### 38.3 Co zostaje świadomie

- `Direction` + `anim.walk/idle/attack(dir)` + `ASSETS.character.handOffsets`
  + `PLAYER.swing.tiltDeg` — **wyłącznie** arkusz 2D gracza.
- Pole kontekstu `DamageContext.guardDir` — NAZWA zostaje (niesie liczbę);
  przemianowanie łamałoby asercje regex w dwóch narzędziach za zero zysku.

## Dopisek 2026-10-03: cały roster broni w dłoni, tarcze okute, bufor 192×160

- Broń: 37/37 modeli z `tools/weapon_shapes.py` (mocowanie w
  `char3d_weapons.py`); znany błąd z §4 pkt 7 (miecz pod stopami) i stare
  „30 znanych błędów broni" NIE obowiązują — bramka `char3d_sprawdz_bron.py`
  jest dziś zielona w całości (komplet, grunt, chwyt, RAMA).
- Tarcze: warianty okute `Tarcza_<konstrukcja>_<gatunek>` ze
  `shield_shapes.OKUCIA`, wybierane w silniku po ikonie.
- Bufor `RENDER_W×RENDER_H` = 192×160 przy stałej gęstości `J_NA_PX`;
  bryła i skala postaci liczone z samego ciała, bez slotów.
- Pełny zapis: `docs/dziennik.md` 2026-10-03 (2). Otwarte: `OI-156`
  (tarcze ×1,65 w świecie), `OI-157`, `OI-158`.

## Dopisek 2026-10-03 (2): `OI-151`, `OI-118`, `OI-156` zamknięte

- **Cios raz na zamach** — `Character3D` startuje klip na ZBOCZU nowego zamachu
  (`Player.zamach.od`), nie na poziomie `isSwinging`. Zmierzone na żywo:
  1 start dla 130 / 180 / 340 / 400 / 880 ms (było 2× i 3× dla dwóch ostatnich).
- **Tempo z zamachu** — `tempoCiosu(ms)`: klip trwa `max(ms, 240)`, więc cięcie
  (połowa klipu) ląduje w `swingHitFraction`. Cięcie względem trafienia: +4 ms
  (Ciężkie uderzenie), +8 (Uderzenie tarczą), +17 (dwuręczny), +44 (miecz),
  +68 (nóż — granica czytelności). §37 opisuje stan SPRZED tej zmiany.
- **Tarcze 1:1** — obiekt tarczy kompensuje skalę armatury, `SKALA_GRY` = 1,0
  (`tools/shield_shapes.py`). Zmierzone w świecie: puklerz 37 / okrągła 65 /
  legionowa 106 cm (było 52 / 91 / 149). Bramka tarcz zielona.

## Dopisek 2026-10-03 (3): broń drzewcowa — PCHNIĘCIE, gotowość w walce, zasięg

Zgłoszone wprost: „ataki drzewcowych za krótkie, włócznią się dźga, nie macha".
- **`tools/char3d_thrust.py`** — `Attack_Thrust_2H` / `Attack_Thrust` (z tarczą):
  cofnięcie za biodro → pchnięcie z WYPADEM miednicy (stopy na gruncie),
  drzewce w linii celu (obrót kości dłoni jak w noszeniu). Silnik
  (`Character3D.klipCiosu`) gra je przy drzewcowej + `Progression.damageType`
  = `pierce`; halabarda rąbie zamachem, dźga pchnięciem.
- **Gotowość w walce**: `Walk_Armed_Pole_Combat` / `_Shielded_Combat` — drzewce
  opuszczone do przodu zamiast gardy przy barku.
- **Zasięg**: drzewcowa ×0,6 nadwyżki (włócznia 180, pika 273 — sufit pod
  noszenie pionowe). Grot w pchnięciu (+6 px wypadu zamachu) wobec zasięgu gry:
  włócznia 75/98, pika 102/128, halabarda 72/110, widły 65/102 px — było ~54 px.
- ⚠ Dwie pułapki rozbrojone: `_dopasuj` przycinał cel do zasięgu wokół barku ze
  SPOCZYNKU (dziś opcja `bark_z_pozy`), a klipy obracające dłoń zostawiały obrót
  dla klipów bez kluczy (zerowanie + jawny klucz w `Attack`).
- Bufor 320×184 (`OI-157`). Bramka broni: przebiegi „(pchn.)" i gotowość
  drzewcowej, grunt także W CIOSIE.

## Dopisek 2026-10-03 (4): PANCERZ NA MODELU — pilot torsu

⭐ Pierwszy krok etapu „jak model się zmienia po nałożeniu przedmiotu".
- **Baza w bieliźnie na torsie**; 15 sztuk `chest` z gry jako `Pancerz_<id>`,
  widoczne wg `Equipment.wornItemIds`, wszystkie warstwy naraz (zewnętrzna
  grubsza: L1 0,05 · L2 0,10 · L3 0,15). Pokrycie z konstrukcji (koszula —
  długi rękaw, przeszywanica — do bioder, kolczuga — do pół uda, napierśnik —
  sam tors), kolor z ikony. `dev.char3d.pancerz([...])` / `("auto")`.
- **Zweryfikowane na renderze z gry** (9 zestawów × 4 kąty): warstwy czytają
  się poprawnie — rękawy koszuli spod kolczugi, napierśnik na kolczudze,
  brygantyna na rękawach przeszywanicy.
- ⚠ Odkrycie: **normalne ciała na torsie patrzą DO ŚRODKA** — pierwsza wersja
  chowała pancerz w tułowiu (widać było tylko uda kolczugi). Naprawa w
  `char3d_armor`: lico każdej ściany od osi jej kości.
- ⏳ Do dopracowania w pilocie: **ząbkowana dolna krawędź** (przeszywanica,
  brygantyna — granica „kości dominującej" przy biodrach), **jednolite kolory**
  (kolczuga czyta się jak tkanina), rozmiar pliku (`OI-160`). Potem kolejne
  obszary: nogi (zawsze spodnie), stopy, dłonie, ramiona, głowa.

## Dopisek 2026-10-03 (5): PANCERZ NA MODELU — cały katalog (55 sztuk)

- Tors dopracowany: równy dół (cięcie po WYSOKOŚCI, nie po kości), wzór
  w kolorach wierzchołków (kolczuga cętki, łuska/lamelka rzędy, płyta żebro,
  przeszywanica przeszycia), kopie bez `Subdivision` (`OI-160` zamknięte —
  1,89 MB pliku z całym katalogiem).
- Nogi (zawsze spodnie od pasa do kostki), stopy (cholewa `gora`), dłonie
  (cięcie po |x| — ręce w T-pozie poziomo), naramienniki, głowa („czapka" /
  „kaptur", kapalin z rondem). Baza w bieliźnie na całym ciele.
- Zweryfikowane na renderze z gry: pięć pełnych zestawów × 4 kąty i dziesięć
  nakryć głowy w zbliżeniu. Poprawione po drodze: dziura na czubku buta
  (lico od środka ciężkości kości) i brązowe nogi płytowe (kolor metalu
  z pikseli szarych ikony).
- ⏳ Do oceny autora: czapki czytają się trochę jak fryzura, rękawy i nogawki
  są gładkie (brak mankietów), brak nosala w spangenhelmie.

## Dopisek 2026-10-03 (6): BIEG, hełmy, ocena bazy

**Bieg (`OI-138` zamknięte).** Lokomocja 150 px/s to tempo biegu, więc gra
gra BIEG: `tools/char3d_run.py` — klip `Run` (ten sam układ klatek co `Walk`:
podpora / lot ×2, domknięcie, bezruch), tułów pochylony 11°, ręce zgięte
(cele w świecie, `_dopasuj` z `bark_z_pozy`), pięta wysoko z tyłu, kolano
z przodu, miednica nisko w podporze. Eksport nagrywa wszystkie warianty chodu
z bronią/tarczą i odtwarza je z `zrodlo="Run"` (13 klipów `Run_*`).
`Character3D`: udział biegu 85–125 px/s (wygładzany), tempo obu klipów =
prędkość/120 (0,5…2,2), faza biegu = faza chodu. Zmierzone w grze: 60 px/s
chód ×0,5 · 105 px/s pół na pół · 150 px/s bieg ×1,25 · 240 px/s (sprint)
bieg ×2,0. Bramki broni i tarcz mierzą też bieg — z gruntem z POZY STOJĄCEJ
(w fazie lotu najniższy punkt ciała to uniesiona stopa). W biegu dłoń
z bronią 1H idzie wyżej (`NIESIENIE_1H_BIEG`) — długie ostrza schodziły pod
grunt.

**Hełmy „jak fryzura”** (autor): większa objętość, ciemny otok przy brzegu,
odblask na szczycie metalu, nosal w hełmie stalowym, żelaznym i spangenhelmie.

**Ocena bazy (`OI-134`) — pomiar, nie decyzja.** Tą samą miarą co NPC-e
(czubek → linia barków ≥72% maks. szerokości): **4,42 głowy** (NPC 3,0–3,9),
głowa/barki 0,71 (NPC 0,64–0,71), szerokość/wzrost **0,42** (NPC 0,47–0,55).
Przymiar A/B bez zapisu (`build_char3d_base.renderuj`): B = `glow` 3,9→3,45,
klatka ×1,09, talia ×1,07, biodra ×1,06, bark ×1,05, ramię/udo ×1,06,
rozchylenie 0,20→0,26 — szersza, krępsza sylwetka bliższa NPC-om. Na gołej
nodze widać dziś zgrubienie „cholewy” na łydce i pierścień na styku uda
(zasłaniały je dawne strefy `trousers`/`boots`). ⛔ Baza NIE przebudowana —
czeka na zdanie autora.

## Dopisek 2026-10-03 (7): V3.6 — tułów i nogi JEDNĄ siatką, wariant B

Autor: „nogi i biodra wyglądają jak doklejone" + zgoda na dopracowanie bazy
(„śmiało"), bo baza ma być źródłem mieszkańców wioski i humanoidalnych wrogów.

**Przyczyna (topologia, nie promienie).** Tułów kończył się czapką w kroczu,
a każda noga była OSOBNĄ rurą wsuniętą w miednicę z własną czapką — dwie
przenikające się bryły, twarde załamanie na styku. Do tego dolny pierścień
bioder miał połowę szerokości 0,086 wzrostu, a szczyt uda sięgał 0,150:
UDA były szersze od bioder i wystawały bokiem. Skargi V3.3o–V3.4a „biodra za
wydatne" dotyczyły w rzeczywistości szczytu uda.

**Naprawa (`tools/char3d_base.py`):**
- `_zszyj_krocze` — dolny połówkowy pierścień tułowia zszyty „zamkiem"
  z zewnętrznym łukiem pierwszego pierścienia uda, krocze domknięte dwoma
  czworokątami z wierzchołkiem na x = 0 (lustro spaja nogi). Usunięte trzy
  pierścienie uda schowane w miednicy i obie czapki.
- Dolne pierścienie tułowia WYPROWADZONE z uda (`noga_polrozstaw` +
  0,92 · `udo_promien`); pierwszy pierścień uda waży pół na pół z miednicą
  (prosta granica bielizny, łagodniejszy staw biodrowy).
- Łydka bez „cholewy": kolano 0,038 → 0,049, łydka 0,058 → 0,054, narastanie
  pod kolanem pełniejsze.
- Wariant B: `glow` 3,9 → 3,45 (głowa 3,29 → 3,71 j.), klatka 0,133 → 0,145,
  talia 0,099 → 0,106, biodro (kotwica 0,470) 0,081 → 0,112, staw barkowy
  0,148 → 0,155, ramię 0,058 → 0,0615, udo 0,068 → 0,072, rozchylenie ramion
  0,20 → 0,26.

**Zweryfikowane:** przymiar bazy (asercje chodu OK, poza stojąca NIETKNIĘTA,
`--zapisz`), bramka broni i tarcz zielone, render z gry (5 zestawów × 4 kąty)
i zrzut sceny obok Rolnika i Hanny. Kopia sprzed zmiany:
`blender/wersje/char_v3_przed_zszyciem_2026-10-03.blend`.

⚠ **Miara „głów w sylwetce" (czubek → linia barków ≥ 72%) tej zmiany NIE
widzi**: barki wyznacza szkielet, a większa głowa schodzi podbródkiem w dół.
Dalej mierzy 4,42 — to ograniczenie miary, nie brak zmiany.
⏳ Zostaje: cienka linia na kolanie (styk dwóch pierścieni kolana), brak
czarnego konturu wobec NPC-ów (`OI-135`) — ⤳ przeformułowane w dopisku (8). `OI-134` (akceptacja MASTER) — po obejrzeniu w grze.

## Dopisek 2026-10-03 (8): ⭐⭐ NPC-e 2D to PRÓG, nie wzór

Decyzja autora: wszystkie postacie pixel-artowe zostaną **zastąpione**
modelami 3D z tej bazy (mieszkańcy, humanoidalni wrogowie). Nie wyznaczają
jakości — wyznaczają **minimum**. 3D ma je przebić **nie szczegółowością,
lecz CZYTELNOŚCIĄ**, zwłaszcza ubrany i w animacji.

Skutki dla oceny bazy:
- ⛔ **„Czy pasuje do NPC-ów stylem" przestaje być kryterium** — dotyczy
  `OI-135` (kontur, miękkość twarzy) i punktów 2/3/6 tabeli ocen.
- Pytanie brzmi: **czy w skali gry (69 px) sylwetka, ubiór i ruch czytają się
  lepiej niż u pixel-artowego odpowiednika.** Porównanie z Rolnikiem czy Hanną
  zostaje jako miara progu, nie celu.
- Kontur (`OI-135`) wraca wyłącznie jako hipoteza czytelności: obrys mocno
  oddziela sylwetkę od pstrego tła lasu, ale skleja się przy ciemnym pancerzu
  i może zjadać detal dłoni z bronią. Rozstrzyga render gry z obrysem i bez.
- Liczby NPC-ów z dopisku (6) (3,0–3,9 głowy, 0,47–0,55 szerokości) to punkt
  odniesienia dla odczytu w małej skali, nie cel do dobicia.

## Dopisek 2026-10-03 (9): SZYJA (V3.7) i bieg wojownika

Autor: „brak szyi, głowa zatopiona w karku — jak goryl" oraz „bieg wygląda,
jakby się skradał pochylony między drzewami, a nie jak wojownik". Wzór
czytelności sylwetek wskazany przez autora: **Stronghold Crusader**.

**Szyja — przyczyna.** Głowa stała czubkiem na `WYSOKOSC`, więc przy
`glow` 3,45 broda wypadała na 0,710 wzrostu, PONIŻEJ góry tułowia
(`obojczyk` 0,745). Szyi nie było nigdy (nagłówek generatora: „szyja: brak —
głowa siedzi na barkach"), a większa głowa V3.6 wbiła się jeszcze głębiej.
**Naprawa:** klucz `glowa_uniesienie` = **0,09 wzrostu** podnosi siatkę głowy,
kości `Bone.003`/`Bone.004` (`czaszka` + uniesienie) i dwa górne pierścienie
szyi. A/B 0 / 0,055 / 0,080 / 0,100 w renderze i w buforze gry — 0,055 dawało
~1 px szyi, 0,10 zaczynało czytać się jak „lizak". Ciało poniżej barków
i rig ramion/nóg NIETKNIĘTE. Figura ma 13,99 j. zamiast 12,85; silnik i tak
dociąga ją do 69 px, więc na ekranie to krótszy tułów pod tą samą głową.
- Hełmy: progi `brzeg`/owal twarzy/nosal/rondo liczone w układzie głowy
  przesuniętym o `DZ_GLOWY` (`tools/char3d_armor.py`) — render z gry, siedem
  zestawów × cztery kąty, wszystkie leżą na głowie.
- `ZAPAS_GORA_PX` 56 → 47 (`Character3D.ts`): zamach i pionowa pika liczą
  się od barków, więc zapas nad głową maleje o uniesienie; bez tego środek
  kadru jechał w górę i bastard 1H wypadał DOŁEM kadru (bramka `rama nosz.`
  +0,38 → ok).
- ⚠ Ostrzeżenia `[atak] UWAGA … poza tolerancją` i `[postawa] osobliwy
  jakobian` są IDENTYCZNE z uniesieniem 0 (sprawdzone) — stare, nie z szyi.

**Bieg — przyczyna.** Miednica −0,38 w podporze, tułów 11° + pierś 5,5°,
głowa jechała z tułowiem, stopa podpory pod ciałem, pięta pod pośladek —
sylwetka przyczajona. **Dziś** (`tools/char3d_run.py`, A/B trzech wariantów
z boku i ze skosu): tułów 5° + pierś 1°, szyja i głowa skontrowane do pionu
(`kontra_szyi`/`kontra_glowy` 0,5), miednica −0,12 / +0,22, stopa ląduje
0,45 j. przed ciałem, kolano wychodzi w przód, szerszy wymach rąk. Wariant
mocniejszy (ręce wyciągnięte przed siebie) odrzucony — czytał się jak lunatyk.
Render z silnika (klip `Run`, 150 px/s, bok i skos) potwierdza.

Bramki broni i tarcz zielone, `dev.missing`/`failed` puste.
`char.blend` md5 `6a5bc9f3d6fb286c75eca0f3efe80322`.

## Dopisek 2026-10-03 (10): czytelność z telefonu — cień, światło, jasność, hełm, mała broń

Źródło: pięć zrzutów autora z buildu na **S21 FE**. Kryterium z dopisku (8):
czy postać czyta się lepiej niż pixel-artowi NPC-e. Pięć poprawek, każda
z renderem z gry przed i po:

1. **Cień pod stopami** (`Character3D`: `CIEN_*`) — elipsa 0,46 × 0,13
   wysokości sprite'a, alfa 0,32, warstwa `DEPTH.overlay + 5` (pod wszystkimi
   bytami, nigdy nie przykrywa sąsiada); stopy z wiersza `dol` zmierzonej
   treści. Postać przestała unosić się nad trawą — robi to samo, co
   namalowane cienie krzaków obok.
2. **Światło bryły** — było rozproszone 1,8 + słońce 1,6 Z PRZODU kamery:
   każda widoczna ściana oświetlona tak samo, „plastikowa figurka". Dziś
   niebo/ziemia (`HemisphereLight` 1,0, od dołu ciemna oliwka) + słońce 3,2
   z GÓRY-LEWEJ, bardziej z boku (−1,0; 0,9; 0,25) + kontra 1,0 z tyłu-prawej.
   A/B czterech ustawień × trzy zestawy; wybrane jako jedyne dające wyraźną
   jasną i ciemną połowę bez zgaszenia twarzy.
3. **Jasność wg slotu** (`char3d_armor.JASNOSC_SLOTU`) — ikony jednego
   materiału mają ten sam ton, więc komplet żelazny był „szarym
   kombinezonem", a skórzany jednym brązem. Mnożnik sRGB: tors 1,00,
   naramienniki 1,06, nogi 0,74, rękawice 0,66, buty 0,56. Render: skóra
   czyta się jako kamizelka + spodnie + buty, len jako koszula + spodnie +
   trzewiki.
4. **Hełm jak kaszkiet** — kopia czaszki napuchnięta równo jest szeroka
   i płaska, a szeroki ciemny otok czytał się jak daszek. `kopula` (j.)
   podnosi szczyt rosnąco od brzegu jak h^`szpic`: hełm żelazny/stalowy 0,50,
   spangenhelm 0,85 (`szpic` 2,6 — stożek), kapalin 0,35, skórzany 0,30;
   czapka przeszywana i kaptury bez kopuły. Napuchnięcie hełmów mniejsze
   (0,07 → 0,04), otok na hełmie wąski (0,20 j., ×0,62).
5. **Mała broń** — `OI-158` (opis tam): łby obuchów ×1,25–1,35, nóż 32 cm,
   sztylety szersze, głownie grubsze. Obuchy dają się odróżnić; nóż i sztylet
   nadal drobne.

Bramki broni i tarcz zielone, `dev.missing`/`failed` puste.
⏳ Ocena na telefonie — tak jak zgłoszenie, nie w przeglądarce.

## Dopisek 2026-10-03 (11): strój startowy, rzemień, duży nóż

Decyzje autora (pytania wprost): strój startowy to **prawdziwe przedmioty,
już założone, kiepskiej jakości**; skład **koszula + spodnie + pas + łapcie**;
warianty kolorystyczne **tylko dla gracza** (mieszkańcy później); nóż jako
**duży nóż chłopski**.

- `INVENTORY.startingWorn` (`GameConfig.ts`) + `TitleScene.grantStartingGear`:
  `linen_shirt`, `linen_trousers`, `bast_shoes` w jakości 2 („Niska"),
  zakładane przez plecak. Sprawdzone w grze: nowa gra → trzy sztuki na
  postaci, plecak pusty. ⚠ Istniejące zapisy NIE dostają stroju — dotyczy
  tylko nowej gry.
- **Rzemień** = geometria koszuli (`P(pas=0,488)` → `_dodaj_pas`): pół-opaska
  na BIODRACH, interpolowana między dwoma pierścieniami tułowia na dokładnej
  wysokości, 0,07 j. nad koszulą, ~6 cm wysokości; koszula do 0,42. ⚠ Pierwsza
  wersja (0,555, przyklejona do najbliższego pierścienia) stała NA SPLOCIE
  SŁONECZNYM — 0,56 to najwęższy pierścień generatora („talia"), który na tej
  krępej figurze wypada tuż pod klatką; pas nosi się nad szczytem bioder. Skóra
  `wood_palette.RAMPA[5]`, WAGI z wierzchołka koszuli pod spodem — render
  z gry: rzemień jedzie z tułowiem w biegu i przez cały zamach.
  ⛔ Nie jest przedmiotem — slot `belt` (`OI-99`) dalej planowany.
- **Nóż** (`weapon_shapes.DLUGOSC_MODELU_CM`): 22 → 36 cm na modelu, szeroka
  jednosieczna głownia bez jelca; sztylet 42, mizerykordia 48 (kolejność
  rodziny zachowana). Render: czyta się jako nóż, nie obieraczka.

Bramki broni i tarcz zielone; zapis przeglądarki przywrócony z kopii po
teście nowej gry.

## Dopisek 2026-10-03 (12): §7 zdjęte dla ZWIERZĄT — dzik 3D z własnego generatora

Autor przeszedł do przeciwników w 3D, zaczynając od dzika. ⚙ Blokada §7
(„modele przeciwników dopiero po akceptacji bazy") dotyczyła humanoidów, które
mają powstawać z tej bazy — **dla czworonogów zdjęta**; humanoidalni wrogowie
dalej czekają na `OI-134`. Dzik powstaje we WŁASNYM generatorze czworonoga
(ta sama metoda co baza: pierścienie, parametry, bramki); proporcje i fazy
ruchu wzięte z pomiaru modelu referencyjnego. Kolejność: `OI-161`.

## Dopisek 2026-10-09 (13): kamera ×0,8 i PILOT NPC — Ojciec

Decyzja autora: zamiast abstrakcyjnej akceptacji bazy (`OI-134`) — **pilot**
na rodzinie gracza; baza zostaje MASTER po dowodzie z gry. Najpierw kamera.

- **Kamera ×0,8** (`KAMERA_3D.przyblizenie`): postać 17% → ~13–14% wysokości
  ekranu (pomiar zrzutu z S21 FE; szacunek: Wild Rift ~9–11%, Diablo Immortal
  / Metin ~12–15%). ⏳ Pomiar FPS/czytelności na telefonie — `OI-169`.
- **NPC = preset bazy** (`tools/npc3d.py`, `PRESETY`): proporcje, kolory
  skóry/oczu/ust, strój z katalogu w barwach mieszkańca (koszula, spodnie,
  trzewiki), fryzura/zarost/wąsy/brwi (`tools/char3d_hair.py` — bryły na
  profilu głowy, katalog stylów pod kreator), animacja `Idle` (poza bezruchu
  + zgarbienie + oddech). Wynik: `characters/npc_father.glb` (543 KB,
  ~21 tys. trójkątów). `char.glb` gracza NIETKNIĘTY.
- Silnik: `NPC_3D` (konfig), `Merchant.stan3d()` (stanie; zwrot ku graczowi
  bliżej niż 140 px), `Creature3D` przy spawnie, napisy nad modelem
  (`napisyNadModelem`). NPC bez wpisu zostaje pixel-artem.
- ⚠ Trzy pułapki złapane renderem: (1) stopy bazy na `PODLOGA` −11,3 j. —
  NPC stał pod ziemią, wystawał czubek głowy (eksport podnosi armaturę);
  (2) obrót miednicy łamał koszulę na barku (dłonie trzyma IK) — usunięty;
  (3) czupryna jako mnożnik promienia była płaska jak beret — warstwa
  zewnętrzna dostaje uniesienie ku czubkowi, przedni brzeg schodzi do zera.
- ⭐⭐ **Wniosek z podglądu w skali gry:** z kamery 40° widać głównie CZUBEK
  głowy i fryzurę, twarz prawie wcale. Tożsamość mieszkańca niesie
  **fryzura + kolor włosów + plama stroju**, nie twarz.
- ⏳ Zostaje: stopień koszuli na barku (jest też BEZ postawy — usterka bazy,
  nie pilota), fryzura nadal „hełmowata", rozmiar pliku per NPC (21 NPC ×
  ~0,5 MB → wspólna baza + części), budżet trójkątów przy ~20 NPC w kadrze,
  Mama (drugi typ ciała).

## Dopisek 2026-10-09 (14): fryzura bez hełmu, Mama — drugi typ ciała

- **Fryzura Ojca czytała się jak HEŁM** (autor). Hełm robiły: równa
  grubość, gładka powierzchnia, prosty dolny brzeg, jeden kolor. Dziś
  (`char3d_hair._fryzura_zaczesana`): PASMA zaczesane do tyłu (żłobienia
  w grubości i jasności), nierówny brzeg na karku i nad uszami, BACZKI,
  cienkie boki, ciemniejszy odrost — kolor na wierzchołkach (`Col`, droga
  pancerza). ⚠ Podgląd Workbench NIE pokazuje kolorów wierzchołków —
  oceniaj w grze.
- **Mama = drugi typ ciała na TYM SAMYM szkielecie**: nowy klucz bazy
  `biust` (0 = gracz bez zmian) + kotwice siatki (węższa klatka i talia,
  szersze biodra, cieńsze ramiona i szyja). ⛔ Kości nietknięte.
- **Odzież spoza katalogu** (`tools/char3d_odziez.py`): SPÓDNICA jako
  osobna bryła (obejmuje obie nogi — powłoka ciała tego nie umie), skinowana
  do miednicy z domieszką ud; FARTUCH = plama koloru + odsunięcie na
  przodzie spódnicy. Góra sukni bez rękawów = krój kamizelki z katalogu
  we wzorze lnu. Fryzura `kok`.
- Napisy nad modelem z wysokości modelu w PLIKU (`NPC_3D.wysokoscJ` 8,5 j. —
  armatura ma skalę 1,6527), nie z obrazka gracza (ten niesie zapas bufora).
- ⏳ `npc_mother.glb` 722 KB, ~26 tys. trójkątów; barki nadal męskie
  (staw barkowy to kość — świadomie nieruszany).

## Dopisek 2026-10-09 (15): TEST A — „ludzik Michelin" na Ojcu

Autor: postacie wyglądają jak ludziki Michelin, a Diablo Immortal / Eternium
pokazują, że stać nas na więcej. Diagnoza: kończyny jak rury, strój jako
„napompowana" kopia ciała, gładki kolor bez cieniowania, miękkie światło.
Test A (tylko Ojciec; Mama bez zmian — do porównania):
1. **Anatomia** (kotwice siatki w presecie, kości nietknięte): ramię 0,058 →
   łokieć 0,040 → nadgarstek 0,028; udo 0,070 → kolano 0,043 → łydka 0,051 →
   kostka 0,025; dłoń 0,094 × 0,046.
2. **Strój cieńszy**: `napuchniecie` × 0,55 (`jakosc` w presecie).
3. **Brzegi ubrań**: wierzchołki krawędzi otwartych ×0,62, pierścień obok
   ×0,84 — mankiety, kołnierz, dół koszuli jako linie.
4. **AO wypieczone w `Col`**: 20 promieni w półsferze z każdego wierzchołka
   w pozie stania, przeciw wszystkim bryłom postaci (pacha, krok, broda,
   fałdy); Mirror/Subsurf zastosowane w pamięci, eksport
   `export_vertex_color="ACTIVE"` → three.js mnoży COLOR_0 przez kolor strefy.
5. **Światło krawędziowe** (`Shared3D.dodajKrawedz`, `Model3DCfg.krawedz`):
   dopisek do shadera po oświetleniu. ⚠ Pierwsza wersja (wykładnik 2,6,
   siła 0,45) WYBIELIŁA postać — przy kamerze 40° większość brył stoi
   „w skos"; dziś wykładnik 4,5, siła 0,30.
Wynik (render z gry, ten sam kadr przed/po): sylwetka smukła, cień w fałdach
i pod pachami, krawędź odcina od drogi; gracz obok (stara baza) wyraźnie
„nadmuchany". ⏳ Decyzja autora: przenieść A na bazę gracza i wszystkich
mieszkańców; dłonie i twarz nadal najsłabsze.

## Dopisek 2026-10-09 (16): krok A2 — fasety po kącie (lekcja z referencji low-poly)

Autor podrzucił dwa modele bazowe low-poly jako MATERIAŁ REFERENCYJNY
(obejrzane i zmierzone, **żadna geometria nie została skopiowana**, pliki
usunięte po użyciu). Lekcje:
- ⭐ **Płaszczyzny zamiast wygładzenia** — fasety czytają się jak świadomy
  styl low-poly, wygładzone bryły jak nadmuchana guma. Na NASZEJ siatce
  (pierścienie wzdłuż ciała) same płaskie ściany dały poziome PASY na
  tułowiu, więc: bez Subsurf + krawędź ostra powyżej 28° (`jakosc.fasety`,
  `_fasety_po_kacie`) — tułów gładki, kończyny, barki i strój z fasetami.
  Plik Ojca 838 → 600 KB.
- Sylwetka w V (kaptury mięśni karku → bark → klatka → wąska talia),
  przedramię grube przy łokciu, łydka wysunięta do tyłu, dłoń z odstającym
  kciukiem — do przeniesienia w generator bazy (kolejny krok, nie zrobiony).
- Referencje mają ~8 głów w sylwetce, baza ~4,4 — duża głowa jest
  ŚWIADOMĄ decyzją czytelności (V2 z 6,34 głowy odrzucona); nie zmieniamy
  bez decyzji autora.

## Dopisek 2026-10-09 (17): proporcje DOROSŁE na Ojcu + broda wzdłuż żuchwy

Autor: „sylwetki tamtych postaci są lepsze, broda wygląda jak worek".
- **Proporcje w pionie** (`char3d_base.KOTWICE_PIONU`, `_przesun_pion`):
  wysokości pierścieni tułowia i nóg to LITERAŁY, więc zmiana kotwic ruszała
  same kości. Dziś siatka powstaje na starych wysokościach i jest
  przesuwana odcinkami między parami kotwic (stara → nowa); rig z nowych.
  ⭐ Przy domyślnych kotwicach droga się NIE uruchamia — gracz bit w bit.
- **Ojciec**: ~5,8 głowy (`glow`), krok 0,465, biodro 0,505, talia 0,605,
  klatka 0,700, bark 0,772, obojczyk 0,788, czaszka 0,836, talia 0,100 —
  sylwetka w V przy tych samych szerokich barkach.
- **Ręce w staniu**: cele IK dłoni w `Walk` to stałe pozycje dla szkieletu
  bazy — przy dłuższym tułowiu dłonie wisiały za wysoko. `zbuduj_stanie`
  liczy je z bieżącego szkieletu (ręka opuszczona, lekko na zewnątrz).
- **Broda** (`_broda_krotka`): gęsta na podbródku i pod nim, na bokach
  cienki pas wzdłuż żuchwy do baczków, policzki odsłonięte.
- ⏳ Decyzja autora: proporcje dorosłe dla GRACZA i wszystkich (zmiana
  bazy — gracz potrzebuje nowego chodu/biegu/ciosów: ich cele IK są
  stałymi pozycjami jak w staniu). Barki z fasetami czytają się trochę
  jak „pudełka" — do dopracowania.

## Dopisek 2026-10-09 (18): dopracowanie — barki, kciuk, Mama dorosła

- **Kciuk** (`char3d_base` klucz `kciuk`, 0 = gracz bez zmian): bryła od
  nasady dłoni do przodu.
- **Barki**: ostre krawędzie zostają na kończynach, okolica obojczyka
  i nasady ramienia jest gładka (`npc3d.GLADKIE_KOSCI`). Klucz `kaptury`
  (spadek mięśni karku, 0 = bez zmian). ⚠ Kanciastość NIE znika do końca:
  rura ramienia zaczyna się głęboko w tułowiu i przy opuszczonej ręce skóra
  ZAŁAMUJE się w stawie barkowym — to wagi/topologia barku bazy, osobne
  zadanie (wspólne z przejściem gracza na proporcje dorosłe).
- **Mama**: proporcje dorosłe (~5,9 głowy) + cały pakiet A (anatomia
  kobieca, fasety, AO, brzegi, kciuk); góra sukni do talii (`suknia.dol`
  0,56), spódnica od 0,545, koszula schowana (`stroj_dol` — rzemień
  koszuli przenoszony nad skrócony brzeg).
- `NPC_3D.wysokoscJ` 8,5 → 7,8 (czubek głowy na 1,0 wzrostu).

## Dopisek 2026-10-10 (19): ręce przy udach, sylwetka Ojca

Zrzut autora (rodzice obok gracza): ręce rodziców STERCZAŁY na boki,
a Ojciec był wątły.
- ⚠⚠ Dłoń w staniu wisiała pionowo POD STAWEM BARKOWYM — przy szerokich
  barkach to daleko za biodrem. Dziś cel IK dłoni = bok biodra
  (`biodro_polszer` + grubość dłoni), lekko z przodu; łokieć ugina IK.
- Ojciec: klatka 0,154 × 0,086, `bark_polrozstaw` 0,162, `kaptury` 1,0 →
  0,35 (spadek karku robił barki opadające), talia 0,104, koszula do bioder
  (`stroj_dol` 0,50 — nogi widoczne na całej długości).

## Dopisek 2026-10-10 (20): ⭐⭐ BAZA V4 — proporcje DOROSŁE dla gracza (decyzja autora)

Autor: „dorosłe proporcje, zrób nową bazę dla gracza". Kopia V3.7 w scratchpadzie
sesji; V3.7 w gicie (commit przed tym wpisem).
- **`PROPORCJE` = V4**: ~5,8 głowy (`glow`), bez uniesienia głowy, krok 0,465,
  biodro 0,505, talia 0,605, klatka 0,700, bark 0,772, obojczyk 0,788,
  czaszka 0,836; anatomia z testu A (zwężenia kończyn, dłoń 0,094 × 0,046),
  `kaptury` 0,35, `kciuk` 1,0. ⛔ `bark_polrozstaw` i `dlon` NIETKNIĘTE —
  długość kości dłoni (0,680 j.) jest nienaruszalna.
- **`ZRODLO_PIONU`**: literały wysokości `_cialo` są wyrzeźbione pod kotwice
  V3.7 — te kotwice są zamrożone jako źródło `_przesun_pion`, baza zawsze
  idzie tą drogą.
- **Hełmy** (`char3d_armor.GLOWA_DO_V36`): kopia głowy przeliczana do układu
  głowy V3.6 (przesunięcie + skala wokół brody) — progi brzegu/owalu/nosala
  bez zmian.
- **Ciosy** (`char3d_attack`): `_przenies` liczy oś BOCZNĄ od osi ciała
  i zachowuje odległość od barku (ułamek zasięgu) — przy szerszych barkach
  chwyt oburęczny wylatywał w bok; `_dopasuj` startuje z kontrolki postawionej
  WPROST w celu (układ armatury) + numeryczny jakobian w bieżącym punkcie
  (stała baza osi z V3.7 kłamała co do kierunku). Pozostałe 4 ostrzeżenia
  `[atak] UWAGA` są IDENTYCZNE na V3.7 (sprawdzone eksportem kopii).
- **Garda tarczy** `NIESIENIE_TARCZA_WALKA` (1,3; −2,0 → −2,3; −4,4), tarcza
  migdałowa `uchwyt` 0,40 → 0,45 — róg wchodził w kolano w biegu bojowym.
- `Character3D.ZAPAS_GORA_PX` 47 → 64 (głowa nie jest uniesiona, pika noszona
  pionowo wystawała nad kadr). Przymiar bazy: flaga `--nowa-baza`.
- ✅ Bramki: chód (asercje OK), broń 0 błędów, tarcze 0 błędów,
  `dev.missing` puste. ⏳ Test na S21 FE (autor).

## Dopisek 2026-10-10 (21): ⭐⭐ BAZA V4.5 — HYBRYDA i WARIANTY z jednej bazy

Pytanie autora: „czy nowszy model jest lepszy od starego? jeśli poprzedni był
lepszy, to może coś zrobiliśmy źle". **Pomiar**: V3.7 i V4 w IDENTYCZNEJ
zbroi (przeszywanica, kolczuga, nogawice, buty, rękawice, hełm), kąt kamery
gry, wielkość z telefonu (70×86 px). V3.7 czytała się LEPIEJ: większy hełm,
widoczna twarz, mocniejsza sylwetka. V4 była poprawna anatomicznie, ale
proporcje realistyczne (~5,8 głowy) przegrywają przy ~13% wysokości ekranu
i kamerze 40° — gry mobilne (Wild Rift, Diablo Immortal) PRZESADZAJĄ głowę,
barki i dłonie właśnie z tego powodu. Błąd nie był w wykonaniu, tylko
w celu: referencje low-poly to modele do oglądania z bliska.
- **`PROPORCJE` = V4.5 (hybryda)**: głowa ~4,8 (`glow` 4,8; kotwice pionu
  0,041 / 0,242 / 0,435 / 0,478 / 0,583 / 0,678 / 0,750 / 0,767 / 0,806),
  nogi i zwężenia kończyn z V4, **dłoń większa** (0,104 × 0,050), ramię 0,060.
  Zestawienie trzech baz w grze: twarz pod hełmem widać jak w V3.7, sylwetka
  dorosła jak w V4.
- **Garda** `NIESIENIE_TARCZA_WALKA` Y −2,3 → −2,5 (pawęż 0,93 j. przy limicie
  0,9 — grubsze przedramię).
- ⚠⚠ **Bramka tarcz: fałszywy alarm parzystości** (puklerz 0,92 j. „w ciele"
  we wszystkich klatkach). Diagnoza: najgłębszy punkt 0,92 j. OD dłoni, siedem
  kierunków promienia zgodnie „na zewnątrz", jeden promień bramki „wewnątrz" —
  kciuk V4 to osobna, zachodząca powłoka i promień przez jej szew liczy
  przecięcia nieparzyście. Naprawa: **głosowanie trzech promieni**
  (`KIERUNKI_PROMIENI`) + **samokontrola metryki** (`_samokontrola_wnetrza`:
  środek miednicy/brzucha/klatki WEWNĄTRZ, punkty 4 j. obok NA ZEWNĄTRZ).
  Sabotaż (`_wewnatrz` → zawsze True) świeci 4+ błędami samokontroli.
  ⛔ Przesuwanie `chwyt` puklerza NIE było naprawą: −0,629 gasiło chód, ale
  zapalało bieg 1,00 j. — dwa warunki się wykluczały, bo jeden był fałszywy.
- ⭐⭐ **WARIANTY: `tools/char3d_variants.py`** — trzy osie jako DELTY do bazy:
  `plec` (m/k — różnica Mama−Ojciec z pilotów), `wiek` (mlody/dorosly/stary)
  i `budowa` (szczupla/srednia/krepa/tega), plus `dodatki` osobnicze (też
  delty). `postawa(wiek)` daje garb/głowę/oddech. Plik uruchomiony wprost
  sprawdza WSZYSTKIE 24 kombinacje (kolejność kotwic pionu, promienie > 0,
  zwężenia kończyn, talia nie szersza od klatki); sabotaż świeci na czerwono.
  ⛔ Osie NIE ruszają `glow` — wielkość głowy to decyzja czytelności obsady.
  Powód istnienia: Ojciec i Mama nieśli po ~30 kluczy wprost i po zmianie bazy
  ZOSTALI na V4 — po cichu. Dziś: Ojciec = `("m", "dorosly", "krepa")`
  + szersze barki, Mama = `("k", "dorosly", "srednia")`. To jest też
  fundament kreatora (OI-166).
- **Wysokości stroju jako (kotwica, delta)** w `npc3d` (`_wys`): brzeg koszuli,
  sukni, spódnicy i fartucha jedzie z sylwetką zamiast stać na ułamku wzrostu
  starej bazy. Spódnica Mamy od `biodro`+0,012 — wyżej obręcz (szerokość bioder)
  odstawała od talii i z góry widać było ciemne wnętrze jako pas.
- ⚠ **`npc3d --podglad` renderuje w trybie MATERIAL**: kolory wierzchołków
  (fartuch, AO, brzegi) w nim NIE WYSTĘPUJĄ. Fartuch jest w danych (80
  wierzchołków) — oceniaj go w grze, nie w podglądzie.
- ✅ Bramki: chód OK, broń „w normie" (te same 4 ostrzeżenia co V3.7), tarcze
  OK z samokontrolą, warianty 24/24, `tsc` czysty. Render w grze (zrzut 1:1
  przez `__widok3dObiekt.zrzut()` + `game.step`, bo ukryty panel nie daje
  klatek): gracz, Ojciec, Mama czytelni. ⏳ S21 FE.

## Dopisek 2026-10-10 (22): ⭐ MIESZKAŃCY 3D — 17 presetów z osi wariantów

Autor: „przygotuj mieszkańców". Wszyscy NPC z portretami poza Boguszem
i Adrianem (zostają na koniec — po nich wiadomo, czego brakuje do odróżnienia
i do kreatora). Każdy preset to `_mieszkaniec(opis, (płeć, wiek, budowa), …)`
w `tools/npc3d.py`: proporcje i postawa WYPROWADZONE z `char3d_variants`,
barwy z portretu 2D, strój z katalogu przedmiotów.
- **Nowe kształty głowy** (`char3d_hair`): `wieniec` (łysina; też pod
  kapelusz — czubek nie przebija nakrycia), `dlugie` (kurtyna z tyłu do
  łopatek, `_kurtyna`), `warkocz` (łańcuch ogniw), `broda_dluga`.
  ⚠ **Profil czaszki zwęża się do zera w podbródku** — broda liczona dla
  t < 0 zapadała się w pasek i „długa" czytała się jak krótka. Długość daje
  przesunięcie `dz` od profilu tuż nad podbródkiem.
- **Nakrycia z katalogu przemalowane**: `kettle_hat` jako filcowy kapelusz,
  `padded_cap` jako czapka, `cloth_coif` jako chusta/kaptur,
  `leather_pauldrons` jako płócienna pelerynka (wartość w `stroj` może być
  słownikiem nadpisań: `kolor`, `metal`, `wzor`).
- **Fartuch męski** (`char3d_odziez.fartuch`): kształt z RZUTU PROMIENI na
  ciało + założony strój (nie z kotwic), poniżej krocza płótno wisi płasko
  — leży na każdej sylwetce bez strojenia.
- **Wzrost osobnika**: `skala` presetu = `skala` w `NPC_3D.modele`
  (Kowal 0,95, Zofia i Anna 1,04); napisy nad głową idą za nią.
- ⏳ Koszt: ~8 MB `.glb` (OI-170, pomiar na S21 FE).

## Dopisek 2026-10-10 (23): ⭐⭐ STYLIZACJA MIESZKAŃCÓW — kontur, tony, styl „czytelny", pozy

Autor po teście na telefonie: mieszkańcy 3D „bez wyrazu, każdy wygląda jak
patyczak i każdy tak samo — największy spadek jakości względem pixel-artu".
**Zgoda: próg (pixel-art) NIE był przekroczony.** Zestawienie Adrian (2D) /
Kowal (3D) z jednego zrzutu: pixel-art wygrywał głową ~1/3 postaci z twarzą,
ciemnym KONTUREM, mocnym cieniowaniem i nasyconą barwą, szerokim rozkrokiem
i grubymi ramionami; 3D miało głowę ~1/5, brak obrysu, gładki niskokontrastowy
PBR, cienkie kończyny i jedną pozę dla wszystkich. Decyzja autora: zostaje 3D,
**pełna stylizacja**.
- **Silnik** (`Shared3D.stylizuj`, `Model3DCfg.styl`): `MeshToonMaterial`
  w 3 tonach (najciemniejszy 42%, nie czerń), nasycenie ×1,2 (1,35 dawało
  jaskrawą Hannę), KONTUR jako odwrócona powłoka liczona na żywo: osobna
  `SkinnedMesh` na tym samym szkielecie, odsunięcie w przestrzeni WIDOKU o 1,1 px
  gry (stała grubość niezależnie od skali), kierunek z normalnych uśrednionych
  po pozycji (`konturN`) — fasety rozrywałyby obrys. Materiał konturu jest
  WSPÓLNY, więc pętla przezroczystości go pomija.
- **Styl `czytelny`** (`char3d_variants.STYL`, czwarta oś): głowa 3,9 zamiast
  4,8, UNIESIONA o 0,046 wzrostu (tułów się nie skraca), grubsze kończyny,
  dłonie i stopy, szersze barki. Jedyna oś, której wolno ruszyć `glow`.
  Reguła w `sprawdz()`: podbródek nad obojczykiem (sabotaż: 24 błędy).
  `NPC_3D.wysokoscJ` 7,8 → 8,15. Nakrycia głowy liczone z proporcji POSTACI
  (`char3d_armor.ustaw_glowe(P)`), nie z bazy.
- **Pozy** (`poza` w presecie, cele IK z kotwic): `splecione` (sołtys,
  zielarka, Dobrawa, Mama), `biodra` (Hanna, Kowal, Patryczek — cel bieguna
  łokcia `Elbow_*.007` odsunięty w bok, inaczej IK zginał rękę do tyłu),
  `za_plecami` (Sulisław, Kuba), reszta `wzdluz`. Test: `npc3d.py -- <npc>
  --poza <rodzaj> --podglad`.
- **Usta**: przyciemniona skóra czytała się u kobiet jak WĄSIK — ciepły,
  różowawy odcień skóry.
- ⏳ Następne: twarz (białko oka / mocniejsze brwi), rekwizyty w dłoniach
  (młot, koszyk, laska), pomiar kosztu konturu na S21 FE (OI-170: ~2× wywołań
  rysowania na mieszkańca).

## Dopisek 2026-10-10 (24): ⭐⭐ TWARZ Z PORTRETU 2D + sylwetka bez klepsydry

Autor po stylizacji na telefonie: postacie „jak z plasteliny zrobionej przez
dziecko", twarze bez wyrazu, „tylko na tyle nas stać?". Research (mobilne
low-poly, hand-painted): **rysy twarzy to TEKSTURA, nie geometria** — oczy
jako duże kontrastowe plamy, jedna ręcznie malowana mapa koloru niesie
charakter. Generator nie miał ŻADNYCH tekstur. Mamy jednak 19 portretów
pixel-art z wyrazem.
- **`npc3d._twarz_z_portretu`**: przód głowy (strefy skóra/oczy/usta) dostaje
  materiał z teksturą PORTRETU w rzucie z przodu, próbkowaną ostro
  (`Closest` → `NEAREST` w glTF). Oczy portretu na `glowa_linia_oczu`,
  podbródek na podbródek. Kalibracja per portret w presecie (`twarz`:
  `srodek_x`, `oczy_y`, `broda_y`, `pol_szer`) — odczytana z arkuszy głów
  z siatką co 5 px. Bez skrajnych boków (|x| > 0,82 pół szer.) i ponad linią
  włosów: tam portret ma KONTUR i włosy.
  ⚠⚠ **Normalne siatki głowy są ODWRÓCONE** (oko z przodu ma normalną +y) —
  pierwszy filtr „zwrócone do przodu" oteksturował TYŁ głowy. Przód wybierany
  po POŁOŻENIU względem środka głowy.
  ⚠ Podgląd w trybie `TEXTURE` + węzeł obrazu AKTYWNY (Workbench pokazuje
  tylko aktywny).
  Przy twarzy z portretu brwi/wąsy/krótka broda nie są bryłami (są
  w teksturze); `zarost_bryla` zostawia długą białą brodę (sołtys, Kuba).
- **Sylwetka**: baza miała talię 0,100 przy biodrach 0,110 — u mężczyzn
  KLEPSYDRA (autor). `plec="m"`: talia +0,010, biodra −0,004 (V / prostokąt).
  **Budowa** wzmocniona ~2× (delty ±0,01 były niewidoczne z kamery): tęga
  z brzuchem (talia +0,048, głęb. +0,060), krępa z klatką, karkiem
  i barkami, szczupła naprawdę wąska.
- ⏳ Gracz nie ma portretu — jego twarz to nadal strefy. Dla kreatora:
  biblioteka twarzy pixel-art (oczy, brwi, nos, zarost jako warstwy tekstury).

## Dopisek 2026-10-10 (25): RĘCE — rozpiętość jako dźwignia (analiza Gemini, zweryfikowana)

Autor przekazał analizę Gemini (4 punkty). Każdy sprawdzony na kodzie
i pomiarem, nie przyjęty na słowo:
1. **„Mężczyźni jak klepsydra"** — TRAFNE, poprawione już w dopisku (24)
   (`plec="m"`). Ostrzeżenie „krępy ≠ kulturysta" też trafne: Ojciec miał
   klatkę 0,182 przy talii 0,118 → dodatki osobnicze dają brzuch zamiast klina.
2. **„Ręce to kikuty kończące się na biodrach"** — DIAGNOZA TRAFNA (pomiar:
   palce Ojca na **0,506 wzrostu**, NAD kroczem 0,435), **RECEPTA BŁĘDNA**:
   podniesienie `ramie`/`przedramie`/`dlon` nie zmienia nic — to proporcje
   PODZIAŁU normalizowane przez sumę, długość ręki daje kotwica „rozpiętość =
   wzrost". Przy szerokich barkach stylu i nisko osadzonym barku (wielka głowa)
   ta kotwica daje kikuty. **Nowy klucz `rozpietosc`** (mnożnik rozpiętości;
   baza 1,0 → gracz i bramki bit w bit bez zmian, ×1,0 jest tożsamością),
   styl `czytelny` +0,17. Reguła w `sprawdz()`: palce prostej ręki na udzie
   (poniżej krocza − 0,015, powyżej kolana + 0,04); sabotaż (delta 0) świeci
   na krępych.
   Dłoń: z przodu widać jej GRUBOŚĆ (wnętrze do uda) — `dlon_grubosc` +0,016,
   udział `dlon` −0,014 (dłuższa ręka nie wydłuża dłoni w patyk).
3. **„Pionek ze skutymi rękami" — światło między ręką a tułowiem** — TRAFNE.
   Poza `wzdluz`: dłoń 2,2% wzrostu od szerszego z (biodro, talia), ręka
   prosta w 99% (było 97%). Wynik: palce Ojca 0,506 → 0,433 (koniec kości;
   widoczna dłoń sięga ~0,38). ⛔ Nie szerzej — ręce na boki odrzucone
   2026-10-09 jako manekin.
4. **Minimalizm siatki** — zgodne z tym, co robimy; detal z tekstur (twarz
   z portretu) i nakładek.
⚠ Analiza powoływała się na „Patrycję (kobietę)" — takiej postaci nie ma
(Patryczek to mężczyzna); punkt pominięty.

## Dopisek 2026-10-10 (26): poszarpany obrys i szpary pod kolanami (druga analiza Gemini)

Druga analiza Gemini: obie usterki z gry (drzazgi obrysu u gracza, szpary na
kolanach Ojca) przypisała `fasety=True` i kazała wyłączyć fasety oraz usunąć
kciuk. **Objawy prawdziwe, diagnoza nie**:
- Kontur od początku bierze kierunek z normalnych uśrednionych po pozycji
  (`konturN`), a gracz faset nie ma, a i tak miał drzazgi. **Przyczyna:
  warstwy.** Ciało, koszula i spodnie mają po własnym obrysie; obrys ciała POD
  ciasną koszulą wychodził przez nią. Naprawa: kontur odsunięty w GŁĄB widoku
  (`STYL_POSTACI.glebiaKonturu` = 3 px gry). Obrysy warstw wewnętrznych chowają
  się za ubraniem, obrys sylwetki na tle zostaje (zrzut przed/po, zbliżenie 2×).
- **Szpara pod kolanem**: spodnie mają DOKŁADNIE te same wielokąty kolana co
  ciało (zmierzone) — nic nie wypada. Noga to dwie rury (udo, goleń)
  zachodzące na siebie na kolanie; kopia odsunięta o grubość warstwy ma przy
  końcach rur szczeliny i świeciła przez nie SKÓRA. ⛔ Hipoteza „zły kierunek
  napuchnięcia" sprawdzona i ODRZUCONA (zmiana cofnięta — nic nie dała).
  Naprawa: `npc3d._ukryj_cialo_pod_ubraniem` — mieszkaniec ma STAŁY strój, więc
  wielokąty skóry pod sztukami katalogu są usuwane (dopasowanie po środku
  ściany: sztuka to kopia fragmentu ciała). Ojciec: −388 wielokątów.
  ⛔ Nie u gracza (zmienny ekwipunek).
- **Kciuk**: porównanie z/bez w skali S21 FE — różnica ≤ 1 px; zostaje
  (usunięcie zmienia bazę gracza i wymaga bramek, zysk zerowy).
- **Fasety zostają** — nie były przyczyną.

## Dopisek 2026-10-10 (27): bez obrysu, bez „kajdanek", bez Pudzianów

Autor: „na co nam ten obrys? gubi się na dłoniach; postawa jakby byli skuci;
Patryczek i Kowal dalej Pudziany".
- **Obrys WYŁĄCZONY** (`STYL_POSTACI.kontur = 0`, `stylizuj` go pomija). Po
  odsunięciu w głąb (dopisek 26) znikał wszędzie, gdzie coś leży przed
  tułowiem — niekonsekwentny obrys jest gorszy niż żaden. Kod zostaje.
  Cieniowanie tonowe i nasycenie zostają.
- **`splecione`**: dłonie na wysokości PASA (było: biodro + 0,06, przed
  kroczem — czytało się jak kajdanki), cel bieguna łokcia w bok — jak na
  portretach sołtysa, zielarki i Dobrawy.
- **Kowal, Patryczek, Hanna → `wzdluz`** (na portretach ręce wzdłuż ciała;
  „ręce na biodrach" dokładało kulturystę).
- **`krepa` = gruby wszędzie, nie klin**: klatka +0,012 (było +0,024), ramię
  +0,006 (+0,016), barki +0,004 (+0,012), talia +0,014 z głębokością. Styl
  `czytelny`: ramię +0,005 (+0,009). Dodatki Kowala usunięte. Razem ramię
  Kowala było ~48% grubsze od bazy.

## Dopisek 2026-10-10 (28): PIĘĆ BUDÓW i budowa z REALNYCH wymiarów

Trzecia analiza Gemini (5 budów pod kreator) — koncepcja PRZYJĘTA: z kamery
z góry o sylwetce decyduje stosunek klatki do talii i brzucha. `budowa`:
`szczupla` · `srednia` · **`atletyczna`** (nowa: trójkąt V, płaska talia,
z umiarem — „Pudzian" odrzucony) · `krepa` (beczka: gruba talia i kark) ·
`tega` (gruszka: brzuch i biodra). Sprawdzanie: **60 kombinacji** (5 × 2 × 3
× 2 style). ⛔ Ponownie ODRZUCONE z tej analizy: wyłączenie faset i kciuka
(dopiski 24–27: obrysu już nie ma, kolana naprawione inaczej, kciuk ≤ 1 px).
⭐⭐ **Postacie mają REALNE WZORY** (autor): budowę wybiera BMI, wzrost daje
`skala` w `NPC_3D.modele` (baza = 185 cm):
| postać | wzrost / waga | BMI | budowa | skala |
|---|---|---|---|---|
| Patryczek (MMA) | 180 / 80 | 24,7 | atletyczna | 0,973 |
| Ojciec | 188 / 90 | 25,5 | średnia + lekki brzuch | 1,016 |
| Mama | 170 / 75–90 | 26–31 | tęga | 0,92 |
| gracz (autor) | 185 / 69–75 | 20–22 | baza (średnia) | 1,0 |
| Konrad — PRZYSZŁY strażnik miejski | 180 / 135 | 41,7 | tęga, mocno | 0,973 |
Reguła na kreator: wzrost → `skala`, BMI → `budowa` (próg orientacyjny:
< 21 szczupła, 21–25 średnia/atletyczna wg treningu, 25–28 średnia z brzuchem
lub krępa, > 28 tęga).
- **Poza „za_plecami" USUNIĘTA** (Sulisław, Kuba): z kamery z góry ręce
  znikają za tułowiem = skucie. `splecione` zostaje sołtysowi i zielarce
  (portrety), na pasie.
- **Łokieć 0,99 → 0,95**: prosta ręka to rura; zasięg pilnuje `rozpietosc`
  (palce Ojca 0,426 / Witka 0,415 — dalej poniżej krocza 0,435).

## Dopisek 2026-10-10 (29): poprawki po review (Gemini + autor)

Review arkuszy 2D↔3D. Z oceny Gemini odrzucone jako niewiarygodne: „3D
przebija 2D" (sprzeczne z oceną autora z gry), „Zofia i Anna wyższe" (podgląd
z Blendera NIE stosuje `skala` — nie dało się tego zobaczyć), „Sulisław
z brodą" (pomyłka postaci). Przyjęte cztery poprawki:
1. **Szew twarzy** → `npc3d._skora_z_portretu`: kolor skóry modelu = mediana
   pikseli POLICZKÓW portretu (wiersze tuż pod oczami, kolumny 0,35–0,8 pół
   szerokości, filtr ciepłego odcienia). Ten sam kolor po obu stronach szwu.
   ⛔ Zamiast miękkiego brzegu alfa (propozycja Gemini): przezroczystość na
   twarzy to sortowanie i migotanie na telefonie.
2. **Nakrycia jako bryły** (`char3d_hair.NAKRYCIA`), nie kopie głowy:
   `_okrycie` — JEDEN generator luźnego okrycia (luz wokół czaszki, okno na
   twarz z ciemnym brzegiem, spływ na kark i barki, szpic z tyłu): `chusta`
   (zielarka, wdowa, Hanna) i `kaptur` (Agata; ⭐ docelowo zabójca, mag,
   kapłan — autor: kaptur ma ODSTAWAĆ, nie przylegać). `_kapelusz`: niska
   główka + rondo: `slomkowy` (Dobek — wieś nosiła słomę) i `filcowy` (Kuba).
   ⚠ Luz działa też W GÓRĘ — `punkt` rozsuwa tylko promień, a wypukła strefa
   włosów czaszki przebijała wierzch chusty (było widać sam kołnierz) i środek
   kapelusza. ⚠ Rondo 2,25× zasłaniało z kamery gry CAŁĄ twarz → 1,65×.
3. **Fartuch** (`char3d_odziez.fartuch`, `szelki_on`): paski od rogów
   napierśnika obok szyi i **PĘTLA NA KARKU** (autor: „szelki powinny łączyć
   się przy szyi — tak wygląda fartuch"; pierwsza wersja biegła w dół pleców
   jak szelki od spodni) + **troczek w pasie** z tyłu. Rzut promieni jak
   płachta; ⚠ bez nakryć głowy w osłonie — promień wspinał się na czapkę.

## Dopisek 2026-10-10 (30): suknie bez dziur, kaptur bez talerza, pelerynka

Druga runda review (Gemini + uwagi autora) — trzy usterki potwierdzone na
renderach i naprawione; „płaskie twarze / dłonie" pominięte (poniżej progu
widoczności przy ~150 px, zgodnie z wątpliwością autora).
- **Warstwa wewnętrzna pod zewnętrzną znika** (`_ukryj_cialo_pod_ubraniem`
  rozszerzone na warstwy stroju, kolejność po `napuchniecie`): koszula pod
  suknią traci tułów (zostają rękawy), spodnie pod tuniką — górę ud. Dół
  koszuli i jej rzemień przebijały suknię w talii (Agata, Mama). Pod suknią
  koszula bez rzemienia; góra sukni schodzi POD górny brzeg spódnicy.
- **Kaptur**: `splyw_z` / `splyw_szer` — pelerynka kaptura niżej i węziej, po
  skosie barków (była poziomym „talerzem").
- **Pelerynka** (`char3d_hair._pelerynka`, Gniewko zamiast przemalowanych
  naramienników): cztery jawne pierścienie MALEJĄCE w pionie — kołnierz,
  nad barkami, krawędź barków, zwis. ⚠ W tym stylu szczyt barków sięga do
  żuchwy: spływ od podbródka przebijały barki, kołnierz od obojczyka dawał
  „poduszkę pod szyję".
⏳ Pomysł autora: **kształt głowy** jako oś (owalna, okrągła, kwadratowa,
prostokątna, serce, trójkątna, diament) — do decyzji, patrz rozmowa.

## Dopisek 2026-10-10 (31): Adrian — dorosły, z pasem narzędzi

Adrian (czeladnik kowala) zrobiony z referencji autora (pseudo-asset pixel-art
+ zdjęcia realnej osoby, NIE w repo): 183 cm / 112 kg → `tega` + trochę klatki
i ramion (praca fizyczna), `skala` 0,989; twarz z `adrian_portrait.png`
(pseudo-asset zmniejszony do siatki 100×100 — `public/assets/README.md`).
Wiek poprawiony decyzją autora: **ok. 29 lat** (było „18" w komentarzu
`ADRIAN` i w `wioska_plan.md`; teksty rozmów nie zależały od wieku).
⭐ **`char3d_odziez.pas_narzedzia`** (preset `pas_narzedzia`): rzemień rzutem
promieni na fartuch i strój, klamra z przodu, młotek przy prawym biodrze,
szczypce przy lewym, sakwa z przodu — prostopadłościany, kolory bezwzględne
w wierzchołkach (podgląd Blendera pokazuje je białe — w grze są właściwe).
- ⚠⚠ **Adrian w grze był PRAWIE CZARNY** (autor, 2026-10-10). Przyczyna: tint
  AWARYJNY sprite'a (`ADRIAN.tint` 0x9a8f86 — Adrian nie ma portretu 2D) był
  przejmowany przez model 3D (`Creature3D` → `wSwiecie`, mechanizm telegrafów
  wrogów) i mnożył CAŁĄ postać ×~0,6. Inni mieszkańcy mają portrety, więc
  tintu nie mieli. Naprawa: `Model3DCfg.bezTintu` = true dla `NPC_3D.modele`.
  Diagnoza z ŻYWEJ sceny (materiały modelu), nie z pliku — `.glb` był poprawny.
  Przy okazji skóra portretu rozjaśniona do karnacji ze zdjęć (228, 172, 140).

## Dopisek 2026-10-10 (32): ⭐⭐ BAZA V5 — styl mieszkańców wpisany w bazę gracza

Autor: „przenieś styl mieszkańców na bazę". Gracz odstawał od wsi (mniejsza
głowa, cieńsze kończyny). Styl `czytelny` WPISANY w `PROPORCJE`: głowa 3,9
uniesiona o 0,046, grubsze kończyny, dłonie 0,118 × 0,066, stopy, klatka,
bark 0,163, szyja. `STYL["czytelny"]` = tylko `rozpietosc` +0,07,
`STYL["bazowy"]` = bryła sprzed V5 (ujemne delty); domyślny styl
`proporcje()` → `czytelny`. **Mieszkańcy bajt w bajt identyczni** (20 `.glb`
bez zmian w gicie).
- **Rozpiętość gracza 1,10, mieszkańców 1,17**: gracz NOSI broń — przy 1,17
  dłoń opadała ~0,7 j. i czubki broni 1H wchodziły w grunt (bastard 1H +0,66).
  Palce gracza nadal na udzie (0,363 wzrostu).
- `NIESIENIE_1H` z −6,74 → −6,44 (bastard 1H w chodzie 0,35 → 0,09).
- Kadr bufora: `RENDER_H` 184 → 200 (broń 1H niżej), `ZAPAS_GORA_PX` 64 → 59
  (głowa wyżej o 0,59 j. — ta sama reguła co SZYJA 2026-10-03).
- ✅ Bramki: chód OK; broń „Wszystkie bronie w normie" (3 ostrzeżenia ataku,
  było 4); tarcze 6/6 OK; warianty 60/60. Render w grze: gracz w stylu wsi,
  w pełnym rynsztunku (hełm, kolczuga, miecz, tarcza) poprawnie.
⏳ Twarz gracza to nadal strefy (gracz nie ma portretu) — biblioteka twarzy
pixel-art przy kreatorze (OI-166).

## Dopisek 2026-10-10 (33): twarz GRACZA (pixel-art wg referencji autora)

Gracz nie ma portretu 2D, więc twarz jest postawiona ręcznie
(`tools/build_player_face.py` → `player_face.png`, 24×28): gęste ciemne brwi,
oczy, cień nosa, lekki uśmiech, krótki zarost na żuchwie, włosy ciemnobrązowe
(= `PAL["hair"]`), skóra = `PAL["skin"]` (brak szwu). Bez okularów.
- **Rzut wspólny z mieszkańcami** — `tools/char3d_face.naloz_twarz` (wyjęty
  z `npc3d`; mieszkańcy po refaktorze bajt w bajt bez zmian). Gracz: głowa
  z NIEZASTOSOWANYM lustrem → `lustro_u=True` (oś twarzy na środku obrazka,
  lustro z odbiciem UV); wołane w `char3d_export_gltf` PO pancerzu, żeby
  kopie głowy (hełmy) nie niosły materiału twarzy.
- ⚠ **Daszek włosów bazy** (objętość czupryny nad linią włosów) chował
  z kamery 40° brwi i górę oczu — rysy ściśnięte na teksturze w dół o ~2 rzędy.
- ⏳ Fryzura gracza to nadal czupryna-strefa bazy (okrągła), nie „quiff" ze
  zdjęć: geometryczna fryzura gracza musi chować się pod hełmem — razem
  z kreatorem (OI-166).

## Dopisek 2026-10-10 (34): Bogusz, karczmarz — cała wieś w 3D

Według referencji autora (strój ludowy: biały len, sukmana, szeroki pas,
haftowana czapka, czarne buty) + wydatny brzuch. `tega` + dodatki brzucha
(talia_glebokosc +0,03, talia_polszer +0,012). Twarz pixel-art
(`build_player_face.py`, `LEWA_BOGUSZ`: pełna, ogolona, rumiane policzki,
szeroki nos i uśmiech). Nowe opcje:
- `char3d_hair.NAKRYCIA["czapka_haft"]` — kapelusz bez ronda (`rondo` 0)
  z haftowanymi pasami (`haft`); niski toczek (główka 0,22 = doniczka).
- `char3d_odziez.pas_narzedzia(narzedzia=False, szer, wys)` — szeroki pas
  bez narzędzi w TALII (na brzuchu).
- Sukmana = przeszywanica (`_LEN`) + POŁY (`spodnica` od talii do kolan) —
  sama obcisła przeszywanica i spodnie w jednym kolorze czytały się jak
  biały kombinezon; góra kończy się POD brzegiem poł (`stroj_dol` talia −0,035).

## Dopisek 2026-10-10 (35): okrycia bez talerza — przegląd całej wsi

Autor: „Hanna ma kołnierz, który w grze wygląda jak talerz wokół szyi —
sprawdź inne modele". Przegląd wszystkich 21 mieszkańców (`npc3d --podglad`:
`gra`, `bok`, `gra_px`) + sprawdzenie w grze. Znalezione i naprawione:
- **Chusta / kaptur — talerz.** W bazie V5 (głowa ~3,9) szczyt barków leży
  prawie na wysokości podbródka, więc spływ okrycia „z podbródka na barki"
  był z konieczności POZIOMY — z kamery 40° czytał się jak talerz (Hanna,
  zielarka; u Agaty jako skrzydła kaptura). Dopisek (30) tylko go zwęził.
  Dziś: `_okrycie(do_szyi=True)` — okrycie domyka się pod brodą NA SZYI
  (zielarka, Agata); **`chusta_wiazana`** (Hanna, Zofia — jak na portretach):
  płat jak czupryna (`_plat`), brzeg od czoła nad uszami do karku, węzeł
  z dwoma końcami na potylicy, bez części pod brodą. ⚠ Pierwsza wersja (luz
  0,20 narastający do u = 0,35) robiła GRZYBEK — dziś 0,13 do u = 0,6.
- **Pelerynka Gniewka — kryza.** Pierścienie na kości głowy, budowane w T-pozie
  spoczynku, nie leżały na barkach w pozie stania. Dziś pelerynka jest
  POWŁOKĄ CIAŁA (`npc3d`, preset `pelerynka`: kości tors + barki + ramiona,
  cięcie po wysokości `bark − 0,075`, `x_max` 2,9, napuchnięcie 0,16) —
  skinowana jak koszula. `char3d_hair._pelerynka` zostaje nieużywana.
- **Ząbki na biodrach Agaty** (ciemne i cieliste, nad dłońmi) — to nie dół
  sukni, tylko boczne ściany bioder i ud (wagi ud rozchodzą się w rozkroku
  stania) wychodzące przez spódnicę. `_ukryj_nogi_pod_spodnica`: ściany nóg
  i bioder (ciało + powłoki) pod spódnicą usuwane. ⚠ Próba „wyżej dół sukni"
  (biodro +0,002) ząbków nie usunęła, a dała ciemną obwódkę nad spódnicą —
  cofnięta.
- **Bogusz.** (1) Kaftan cięty pod brzuchem (talia −0,035) miał brzeg
  odstający poziomo jak talerz (napuchnięcie wzdłuż normalnych na spodzie
  brzucha), a pas leżał na tym brzegu z dala od ciała → kaftan i koszula
  cięte W TALII (najszerszy pierścień brzucha), poły od talii −0,008
  z obwodem brzucha (`spodnica(na_brzuchu=True)`: ×1,05 talii; ×1,30 dawało
  bęben), pas `odsun` 0,04. (2) Toczek od t 0,78 z główką 0,15 kończył się na
  0,93 wysokości głowy — czubek czaszki przebijał wieczko, z góry pusta
  obręcz → t 0,84, główka 0,19.
- **Warkocz Dobrawy** — 7 ogniw na tej długości stało z przerwami (z boku
  koraliki na nitce) → 12.

⚠ Zrzut Phasera (`renderer.snapshotArea`) NIE łapie warstwy 3D (wychodzi
pusty) — w grze sprawdzone przez wymuszony zoom kamery (`postupdate`
→ `setZoom` + `centerOn`) i zwykły zrzut panelu; pętla gry w ukrytym panelu
rusza tylko przy zrzutach. Bez zmian: pozostałych 12 mieszkańców (przegląd
nie znalazł usterek tej klasy). Twarz z portretu z boku rozmazuje się
w paski (rzut z przodu) — znane ograniczenie metody, nie poprawiane.

## Dopisek 2026-10-10 (36): ✅ ETAP PROTOTYPU POSTACI 3D ZAMKNIĘTY

Autor: „chciałem zamknąć kwestie prototypu postaci 3D na tym etapie tworzenia
gry", żeby przejść do innego tematu. Rozstrzygnięcia (pytania wprost):
- **`OI-134` — baza V5 = MASTER.** Słowa autora: „na razie nic lepszego nie
  wyczarujemy; na innym koncie zużyłem kilka sesji, by dowieźć ten poziom
  postaci; póki co z AI chyba nic lepszego nie zrobimy". Akceptacja jest więc
  świadomą GRANICĄ etapu, nie oceną „idealnie". Humanoidalni wrogowie
  odblokowani na tej bazie.
- **`OI-135` — kontur ODRZUCONY**: „obrys nie radzi sobie przy tej wielkości
  postaci i przy obrocie są z nim problemy, a postaci są na tyle dobrze
  widoczne, że bardziej przeszkadza, niż przynosi pożytek". Kod zostaje
  (`STYL_POSTACI.kontur = 0`).
- **Pomiary na S21 FE** (`OI-157`, `OI-158`, `OI-169`, `OI-170`) → parking
  (`docs/odlozone.md` §2) jednym pakietem.
- **Resztki** (chwyt oburęczny w marszu, kształt głowy jako oś, rekwizyty
  w dłoniach, twarz z portretu z boku, fryzura gracza pod hełmem) →
  `docs/odlozone.md` §3; wracają z kreatorem (`OI-166`), z humanoidalnymi
  wrogami albo z konkretnym błędem z gry.
- Podział checkpoint (stan) / historia (etapy) zostaje; checkpoint dostał
  baner zamknięcia i `stan: zamkniety`.

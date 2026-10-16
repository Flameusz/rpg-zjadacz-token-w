---
typ: STAN
domena: render3d
tytul: Obraz świata w 3D
stan: zywy
implemented: tak
documented: tak
verified: [kod, render:2026-10-11]
kotwice:
  - src/render3d/WorldView3D.ts
  - src/render3d/Shared3D.ts
  - src/render3d/Character3D.ts
  - src/render3d/Creature3D.ts
  - src/render3d/Trees3D.ts
  - GameConfig.KAMERA_3D
  - GameConfig.GRUNT_3D
  - GameConfig.ZASLONY_3D
  - GameConfig.WODA_3D
  - GameConfig.DRZEWA_3D
  - GameConfig.REKWIZYTY_3D
  - GameConfig.MODELE_3D
  - GameConfig.NPC_3D
  - GameConfig.STYL_POSTACI
  - GameConfig.AKTYWNOSC_STWORZEN
otwarte: [OI-164, OI-161, OI-166]
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# Obraz świata w 3D

> **Jedno zdanie.** Gra jest dwuwymiarowa — Phaser liczy ruch, kolizje, AI,
> walkę i HUD — a three.js wyłącznie **rysuje** ten sam świat jako scenę 3D
> z pochyloną kamerą. Nic z rozgrywki nie czyta niczego z tej domeny.
>
> Reguły przy kodzie (czego nie wolno): `src/render3d/CLAUDE.md`.
> Postać i rig: `docs/postac3d_checkpoint.md`. Skąd się bierze plik `.glb`:
> `public/assets/README.md` (generatory `tools/*3d.py`, Blender).

## 1. Dwie ścieżki rysowania

| ścieżka | kiedy | jak |
|---|---|---|
| **Scena świata** (`WorldView3D`) | domyślnie | jedna scena three.js na cały świat, własny renderer, płótno POD płótnem Phasera |
| **Most przez teksturę** (`Shared3D.renderujDo`) | `?widok2d`, build `VITE_WIDOK3D=0` | każdy model rysuje się do wycinka WSPÓLNEGO bufora, wynik idzie do Phasera jako zwykła tekstura w warstwie Y-sortowanej |

Przełącznikiem jest `swiat3d.scena` w `Shared3D`: gdy jest ustawiona, modele
postaci i stworzeń nie rysują się do własnych buforów, tylko przenoszą się
(`wSwiecie`) do sceny świata. Logika, AI i `stan3d()` encji są identyczne
w obu ścieżkach — zmienia się wyłącznie, GDZIE model jest rysowany.

⚠ **Ścieżka 2D nie jest martwym kodem.** Brak pliku modelu albo widok 2D
musi dawać grywalną grę (niezmiennik „gra ZAWSZE się uruchamia"); arkusze 2D
gasną dopiero, gdy model naprawdę stanął w świecie.

## 2. Co stoi w scenie świata

| warstwa | źródło | uwagi |
|---|---|---|
| grunt | warstwy kafli Tiled wypieczone w tekstury na płaszczyźnie | doczytywany kawałkami wokół kadru (`GRUNT_3D`), zwalniany za oknem |
| woda | warstwy `water*` | osobna płaszczyzna z shaderem falowania i refleksów (`WODA_3D`) |
| drzewa | stemple drzew → modele z `trees.glb` | instancje grupowane po wariancie × kwadracie mapy; wiatr w shaderze (`DRZEWA_3D`) |
| rekwizyty | `props3d.glb` | jak drzewa; lista bez losowego obrotu w `REKWIZYTY_3D` |
| koło młyńskie | `kolo_mlynskie` (obraca się) + `mlynowka` (nieruchoma) w punkcie z Tiled | ⭐ 2026-10-14: koło PIONOWO w nurcie, oś w zachodnią ścianę młyna, całość skręcona o 25° (`KOLO_SKRET` = `animacje.kolo_mlynskie.skretDeg`), żeby kamera z południa widziała lico — ustawione dokładnie prostopadle koło czytało się bokiem jak taśmociąg; `mlynowka` = komora ze stopniami, kozioł z łożyskiem, krótkie koryto z drewnianej skrzyni wlotu z zastawką, jaz, strumień na wierzch koła, strugi i piana (`tools/props3d.py`) |
| budynki | obiekty warstwy `budynki` → `houses3d.glb` | model nazwany obrysem `dom-x0-y0-x1-y1`; zespół bez modelu zostaje billboardem |
| obiekty pionowe z kafli | atlas z kafli Tiled | **billboardy** równoległe do płaszczyzny obrazu, instancjonowane |
| gracz | `characters/char.glb` (`Character3D`) | ekwipunek doczepiany do rigu |
| stworzenia, mieszkańcy, bandyci | `MODELE_3D`, `NPC_3D` (`Creature3D`) | gatunek bez wpisu zostaje arkuszem 2D |

Nowe obiekty (łup, odrodzenia) dostają billboard albo model przy
okresowym przeskanowaniu listy wyświetlania.

## 3. Kamera i zgodność z rozgrywką 2D

- Kamera ortogonalna pochylona o kąt θ (domyślnie 40°, `dev.widok3d.kat`),
  przybliżenie `KAMERA_3D.przyblizenie`. ⭐ **Decyzja autora 2026-10-04:
  kamera A — STAŁA** (rodzina LoL / Wild Rift); swobodna kamera odrzucona,
  bo przekreśla model celowania (`docs/systemy/input.md`).
- **Kamera Phasera jest ściśnięta w pionie o sin θ.** Dzięki temu wszystko,
  co leży NA GRUNCIE (pierścień celu, tap → pozycja w świecie, kafel pod
  stopą) trafia w to samo miejsce ekranu co w scenie 3D.
- Obszar trafienia palcem rośnie od stóp w górę × 1/sin θ — tap w tułów
  modelu trafia w encję.
- Paski HP i napisy są podnoszone nad pełnowymiarowe postacie na czas
  rysowania — **„mniej więcej" nad głową, nie dokładnie** (znany koszt).
- Płótno Phasera leży NAD płótnem świata (z-index), inaczej HUD i drążek
  znikają pod sceną — złapane dopiero na telefonie.

## 4. Gracz i stworzenia: host 2D, obraz 3D

- **Encją jest zawsze obiekt Phasera.** Model co klatkę kopiuje z niego
  pozycję, przezroczystość i **tint** (telegrafy wrogów są tintami —
  `src/entities/CLAUDE.md`), a z `stan3d()` — klip, tempo i zwrot.
- Sprite hosta **nie jest gaszony `setVisible(false)`**: Phaser pominąłby go
  w trafieniu wskaźnikiem. Instancja dostaje puste rysowanie i zostaje
  „widoczna" dla wejścia.
- Materiały modelu są **klonowane przy wejściu do świata** — tint telegrafu
  barwi jedno stworzenie, nie cały gatunek.
- **Skalę obrazu ustala gracz** (`skalaSwiata`): stworzenia dostają tę samą
  gęstość pikseli na metr, więc gatunków nie stroi się „na oko".
- Światło jest wspólne (`dodajSwiatlo`) i pada z tej samej strony co
  namalowane cienie pixel-artu.
- Styl postaci: cieniowanie tonowe + krawędź (`STYL_POSTACI`, jeden dla
  gracza i wsi). ⛔ Kontur `0` — obrys odrzucony (`OI-135`).
- Stworzenie dalej niż `AKTYWNOSC_STWORZEN.promienPx` od środka kadru nie
  odgrywa animacji i nie jest rysowane (śpi też jego AI — domena `creatures`).
- Mieszkaniec bliżej niż `NPC_3D.zwrotPx` odwraca się ku graczowi.

## 5. Zasłony

Obiekt, który naprawdę zasłania tułów gracza (liczone z wysokości bryły
i kąta kamery), blednie CAŁY, ditheringiem Bayera, bez sortowania
przezroczystości (`ZASLONY_3D`). Niższe niż `minWysokosc` (krzak, kamień,
zioło) nie bledną nigdy. ⚠ To wyłącznie obraz — logiczne zasłony
(`Occluders`) i kolizja pnia dalej liczą się ze stempla 2D (domena `world`).

## 6. Renderery i koszt

- Scena świata ma **jeden** renderer na stronę (`WorldView3D.plotno`).
- Most przez teksturę ma **jeden wspólny** renderer (`wspolnyRenderer`) dla
  wszystkich modeli: render → natychmiastowa kopia do canvasa modelu, bo
  bufor WebGL nie jest zachowywany. Renderer żyje do końca strony.
- Koszt mostu mierzy `dev.char3d.koszt`, płaty gruntu `dev.widok3d.grunt()`,
  klatki `dev.perf.watch(15)`.

## Pokrycie

| mechanika | impl. | dok. | weryfikacja |
|---|---|---|---|
| scena świata domyślna, 2D przez `?widok2d` | ✅ | ✅ | `kod` |
| grunt kawałkami, woda z shaderem | ✅ | ✅ | pomiar S21 FE 2026-10-09: wieś 119,8 FPS, p95 8,4 ms (`docs/dziennik.md` 2026-10-09 (15)) |
| drzewa, rekwizyty, budynki jako modele | ✅ | ✅ | `render:2026-10-11` (Zagaje K6j) |
| zgodność gruntu z ekranem (ściśnięcie sin θ) | ✅ | ✅ | `kod` |
| paski HP i napisy nad postacią | ✅ | ⚠ przybliżone | ❌ czeka na odbiór |
| gracz, stworzenia, mieszkańcy, bandyci w 3D | ✅ | ✅ | `render:2026-10-11` |
| zasłony per obiekt | ✅ | ✅ | ❌ odbiór z ręki na telefonie |
| koszt N stworzeń na telefonie | ✅ | ✅ | ❌ `OI-161` |

## Otwarte

- `OI-164` — kąt kamery (35/40/45°) i zoom to wciąż DECYZJA; pomiar wsi
  z uprawami na S21 FE; zacięcia przy pierwszym wejściu w fragment lasu.
- `OI-161` — pomiar N stworzeń na S21 FE.
- Pomiary odłożone przy zamknięciu postaci 3D (`OI-157`, `OI-158`, `OI-169`,
  `OI-170`) — `docs/odlozone.md` §2.
- `OI-166` — kreator postaci (awatar i warianty NPC z jednej bazy).

## Czego ten dokument nie rozstrzyga

- Geometrii rozgrywki: zasięgi, kolizje, nawigacja i zasłony logiczne są
  w `world`, `movement`, `combat` — a tam w pikselach 2D.
- Rigu, proporcji i wyglądu postaci — `docs/postac3d_checkpoint.md`.
- Tego, jak powstaje model w Blenderze — `public/assets/README.md`.
- Kiedy model 3D zastępuje arkusz w nowym gatunku — to decyzja zawartości,
  nie reguła tej domeny.

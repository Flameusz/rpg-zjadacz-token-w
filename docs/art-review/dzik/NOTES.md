---
typ: HISTORIA
domena: assets
tytul: Dzik — notatki z testów konwersji
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Dzik — test pipeline'u „arkusz GPT → nasz pixel-art" (2026-08-28)

**Status: TEST. Nic nie wpięte do gry, `public/assets/animals/boar.png` nietknięty.**

## Co jest w folderze
- `dzik_test.png` — 192×96, 6 kolumn × 3 wiersze, klatka 32×32
  - wiersz 0: IDLE DOWN ×4
  - wiersz 1: WALK LEFT ×5  (⚠ GPT dał tylko 5 mimo etykiety „6 klatek")
  - wiersz 2: ATTACK LEFT ×4
- `dzik_test_frames.json` — mapowanie klatek, paleta, opis pipeline'u
- `dzik_test_9x.png`, `strip_*.png` — podglądy
- źródło: `docs/art-review/dzik-gpt.png` (referencja od GPT)

## Pipeline (deterministyczny, ten sam dla wszystkich ~101 klatek)
wycięcie okna klatki → maska tła (dystans od koloru tła, największy komponent) →
klasa tonu (futro / grzywa+nogi / kieł) → stopień rampy z luminancji (percentyle
per klatka, jak `stopnie_na_kolory` w `build_drzewa.py`) → **twardy downscale
nearest** (mode klasy + średnia luminancji bloku, próg krycia 0,45) → kontur 1 px
(`kora[0]`) → czyszczenie (kolce / dziury / wysepki) → kotwica (stopy w wierszu
30 z 32, środek masy w x=16).

Paleta: `ziemia` (futro), `kora` (grzywa/nogi/kontur), `piasek[4]` (kły),
`neutralne[0]` (oko). **8 kolorów, alfa wyłącznie 0/255.**

## Kontrola spójności (zmierzona)
| animacja | wysokość | szerokość | stopy | środek x |
|---|---|---|---|---|
| idle_down | 25 px (stała) | 17–18 | wiersz 30 | 16 |
| walk_left | 18 px (stała) | 25–26 | wiersz 30 | 16 |
| attack_left | 17–18 px | 26–27 | wiersz 30 | 16 |

Zachowane między klatkami: krępa sylwetka, ryj z kłami do przodu, grzywa na
grzbiecie (ciemniejsza), oko, ogon-nub, krótkie nogi. Brak deformacji, brak
skoków proporcji.

## Korekta WALK LEFT (2026-08-28)
Cykl chodu doprawiony ręcznie — **wyłącznie operacje na istniejących pikselach
pasa łap** (poniżej linii brzucha): na przemian przód/tył przycięcie 1–2 dolnych
rzędów jednej połowy łap (łapa uniesiona) + drift 1 px w poziomie. Zero nowych
pikseli, korpus / sylwetka / proporcje bez zmian (wysokość 18, środek x=16,
stopy w wierszu 30 — stałe we wszystkich 5 klatkach).

Fazy (`front_trim` / `back_trim` = ile dolnych rzędów łapy uciąć; `dx` = drift):
```
       f0  f1  f2  f3  f4
przód   0   0   0   1   2      dx: +1  0  0  -1  -1
tył     2   1   0   0   0      dx: -1 -1  0  +1  +1
```
f0–f2 przód w stance, tył w wykroku; f3–f4 odwrotnie; f2 = mijanie (wszystkie
łapy na ziemi). Pętla f4→f0 zamyka wymach.

## Znane słabości (decyzja przed pełnym przebiegiem)
1. Chód czyta się jako trot, ale jest „spokojny" — źródłowe klatki GPT niosą
   minimalny ruch, więc cały sygnał chodu to naprzemienna głębokość łapy.
2. **WALK LEFT: 5 klatek zamiast 6** w źródle.
3. **IDLE DOWN (przód) najsłabszy** — czworonóg en face przy 32 px jest z natury
   „bryłowaty", detal twarzy ograniczony.
4. ATTACK czyta się jako „obniżenie łba + cios kłem" — poprawne wg briefu,
   mogłoby być mocniejsze.

## Kierunek
`walk_left` / `attack_left` patrzą w LEWO (jak źródło). Konwencja silnika dla
arkuszy profilowych (`boar.png`, `rabbit.png`) to profil w PRAWO + `setFlipX` —
do rozstrzygnięcia przy wpinaniu (albo trzymamy oba kierunki osobno).

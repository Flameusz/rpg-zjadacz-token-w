---
typ: HISTORIA
domena: assets
tytul: Dzik — notatki, wariant alternatywny
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Test konwersji `dzik-alt.png` → 32×32 (2026-08-28)

**Status: TEST. Nic nie wpięte do gry.** Źródło docelowe: `dzik-alt.png`
(do `dzik-gpt.png` nie wracamy).

## Pliki
- `dzik_alt_test.png` — 5 kol × 3 wiersze, klatka 32×32
  - w0: IDLE DOWN ×4
  - w1: WALK LEFT ×5
  - w2: ATTACK LEFT ×3  ⚠ (patrz niżej)
- `dzik_alt_test_frames.json` — mapowanie + pipeline
- `dzik_alt_test_8x.png` / `_9x.png`, `alt_strip_*.png`, `anim_alt_*.gif`
- `dzik_alt_extract.py` — skrypt

## Pipeline (`wycięcie → tło → paleta → hard nearest → 32×32 → alfa 0/255`)
1. wycięcie okna klatki (ramki zmierzone z rzutów konturu)
2. **usunięcie tła (gradient!)**: residuum po odjęciu mocno rozmytego obrazu
   (gradient znika, dzik ma fakturę/kontur → zostaje) + narysowany ciemny
   kontur; największy komponent, wypełnienie
3. klasa tonu: futro / grzywa+nogi / kieł. **Nogi = klasa priorytetowa** —
   w dolnym pasie przetrwają downscale nawet jako 1 px w bloku (inaczej
   znikają i cykl chodu się gubi)
4. stopień rampy z luminancji (percentyle 20/80)
5. **twardy downscale nearest** (mode klasy w bloku)
6. wygładzenie sylwetki + kontur 1 px `kora[0]` + oko
7. kotwica: stopy w wierszu 30, środek masy x=16

Paleta: **8 kolorów** — `ziemia[2..4]` futro, `kora[0..2]` grzywa/nogi/kontur,
`piasek[4]` kieł, `neutralne[0]` oko. Alfa 0/255. Zero AA, zero glow.
Kurz/krew ze źródła **nie przeniesione** (brief: bez efektów).

## Kontrola spójności
| | wysokość | szerokość | stopy | kolory |
|---|---|---|---|---|
| idle_down | 22–23 | 15–16 | wiersz 30 | 8 |
| walk_left | 17–19 | 24–26 | wiersz 30 | 8 |
| attack_left | 14–16 | 25–27 | wiersz 30 | 8 |

## Uwagi
1. **ATTACK LEFT: 3 klatki, nie 4.** `dzik-alt` w rzędzie ATTACK LEFT ma
   fizycznie 3 klatki (ATTACK DOWN ma 4). Nie dorabiałem czwartej.
2. **Ruch nóg WALK — prosto ze źródła**, bez ręcznego doprawiania cyklu.
   Widoczny, ale subtelny: nogi źródła to ~3 px w klatce ~60 px, downscale
   do 27 px je spłaszcza.
3. **Sylwetka wychodzi „krępa/oblała"** — narysowany kontur `dzik-alt` jest
   ostrzejszy niż to, co odtwarza automat po redukcji do 27 px.
4. Jakość: „akceptowalny sprite wroga RPG" (poziom obecnego proceduralnego
   dzika 28 px, rozpoznawalny w ruchu) — ale **nie** oddaje pełnej przewagi
   `dzik-alt` (ostry kontur, wyraźna artykulacja nóg). Do tego trzeba albo
   lekkiego ręcznego czyszczenia per klatka (kilka px: nogi / kontur /
   krawędź grzbietu), albo źródła bliżej rozdzielczości docelowej.

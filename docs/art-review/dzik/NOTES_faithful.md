---
typ: HISTORIA
domena: assets
tytul: Dzik — notatki, wariant wierny
stan: zamkniety
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-08-30
---

# Czysty test wierności źródła `dzik-alt.png` (2026-08-28)

**Status: TEST. Nic nie wpięte do gry. Kod gry nietknięty.**
Cel: zobaczyć dzika **dokładnie takiego, jaki jest w `dzik-alt`**, tylko
oczyszczonego z tła i przygotowanego jako pixel-art. **Bez redukcji palety.**

## Pliki
- `dzik_alt_faithful.png` — arkusz, wiersze IDLE DOWN×4 / WALK LEFT×5 / ATTACK LEFT×3
- `dzik_alt_faithful_8x.png` / `_9x.png` — powiększenia
- `anim_faithful_{idle_down,walk_left,attack_left}.gif` — zapętlone, 8×, na szarym tle (żeby ocenić sam kolor dzika)
- `faithful_strip_*.png` — statyczne paski
- `dzik_alt_faithful_frames.json` — mapowanie + pełny opis pipeline'u
- `dzik_alt_faithful.py` — skrypt

## Pipeline
1. wycięcie okna klatki
2. **usunięcie tła + gradientu**: próg na **residuum** po odjęciu mocno
   rozmytego obrazu.
   - gładki gradient tła → residuum ~3 → **wypada**
   - miękki cień pod dzikiem → residuum ~7–13 → **wypada sam** (cień jest
     gładki — to jego zaleta, nie trzeba go ręcznie wycinać)
   - ciało / nogi / kontur dzika → residuum ~20–70 → **zostaje**
   - **żadnego progu na luminancję** — to on wcześniej wciągał cień (cień ma
     lum ~58, podobnie jak ciemna sierść)
3. domknięcie sylwetki, największy komponent, cięcie cienkich wypustek
4. **de-AA**: pierścień brzegowy 1 px zastąpiony kolorem najbliższego piksela
   wnętrza → twarda krawędź, brak półprzezroczystych mieszanek tła
5. **hard nearest-neighbor**: 1 piksel źródła na piksel docelowy, skala
   wspólna **0.73** (bok źródła ~63 px → ~46 px)
6. alfa **0/255**
7. kotwica: stopy 3 px od dołu, środek masy w x; **canvas = naturalny bbox**
   (IDLE 29×39, WALK 54×39, ATTACK 61×39) — **NIE wciskane w 32×32**

## Czego NIE zrobiono (zgodnie z zadaniem)
redukcji palety · posteryzacji / kwantyzacji · dopasowania kolorów do
`paleta.json` · zmiany proporcji dzika · przeniesienia kurzu / krwi / cienia ·
doprawiania animacji

## Wynik
- **Kolory zachowane**: IDLE 2470, WALK 3695, ATTACK 2859 różnych odcieni —
  pełna tonalność źródła
- alfa wyłącznie 0/255, zero AA
- ruch nóg WALK i pozy ATTACK — prosto ze źródła
- **ATTACK LEFT: 3 klatki** (`dzik-alt` fizycznie ma 3 w tym rzędzie)

## Znane drobiazgi
- krawędź grzywy/grzbietu miejscami postrzępiona (residuum łapie pojedyncze
  jasne piksele nad konturem)
- dzik jest dość ciemny — **ale to jest kolor źródła**, świadomie niezmieniany

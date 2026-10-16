---
typ: DECYZJA
domena: proces
tytul: render3d jako domena
stan: zamkniety
moc: ACTIVE
data: 2026-10-11
zastepuje: []
zastapione-przez: null
aktualizacja: 2026-10-11
---

# `render3d` jako 28. domena

## Co rozstrzygnięto

Obraz świata w 3D (three.js) dostaje własną domenę `render3d` i własny `STAN`:
`docs/systemy/render3d.md`. Reguły przy kodzie: `src/render3d/CLAUDE.md`.

## Dowód

- Od 2026-10-06 widok 3D jest **domyślny**, a gracz (od 2026-09-09),
  mieszkańcy, cały roster zwierząt i bandyci są modelami. `src/render3d/` to
  ~3700 linii, czyli więcej niż niejedna domena z listy.
- Do 2026-10-11 **żaden `STAN` nie wymieniał tego kodu**: `presentation`,
  `assets` i `architecture` mają zero odwołań do `render3d`. Wiedza leżała
  w wierszu rejestru `OI-164` (3,5 KB, rósł z każdą sesją), w punkcie
  wejścia postaci 3D, w dzienniku i w akapicie „Otwarte" korzenia `CLAUDE.md`.
- Pytanie, które ta domena odpowiada — „jak gra rysuje świat i co z tego
  wolno ruszyć, nie psując rozgrywki" — zadaje się co kilka sesji, a za każdym
  razem odpowiedź trzeba było składać z czterech miejsc.

## Co ODRZUCONO

- **Dopisanie do `presentation`.** Ta domena to cue i kanał sygnału walki
  (hit-stop, liczby, błysk) i jest przy limicie 20 KB. Obraz świata ma inny
  cykl życia (renderer żyje dłużej niż scena) i innych właścicieli.
- **Dopisanie do `assets`.** `assets` mówi, jak gra ODWOŁUJE SIĘ do pliku
  i jak degraduje się, gdy go brak; nie mówi, jak plik staje się obrazem.
- **Brak `STAN`, tylko `src/render3d/CLAUDE.md`.** Instrukcja przy kodzie
  może nieść niezmiennik, ale nie może być jedynym opisem mechaniki
  (`DOC_CONTRACT.md` §2.7) — a o widoku 3D pyta się także bez dotykania kodu.

## Co zostaje otwarte

Generatory modeli (`tools/*3d.py`, Blender) opisuje `public/assets/README.md`
i punkt wejścia postaci 3D, nie ten `STAN` — dokument kończy się na pliku
`.glb` i jego kluczu w konfigu.

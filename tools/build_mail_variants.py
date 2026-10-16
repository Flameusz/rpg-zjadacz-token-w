#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dwie WARIANTOWE ikony kolczugi w `assets/items/items.png`.

⚠ **Po co to istnieje.** Partia pancerza z 2026-09-12 dokłada `kolczuga krótka`
(tors, L2) i `półnogawice kolcze` (nogi, L2). Arkusz `items.png` ma wolne kafle
w rzędach pancerza, ale **żaden z nich nie ma faktury SIATKI** — wszystkie wolne
są gładką płytą. Dwa wyjścia były złe:
  • ta sama ikona co pełna kolczuga — dokładnie usterka zapisana przy
    `gambeson` („dwa różne pancerze z jedną ikoną to najgorszy możliwy przypadek
    w slocie, w którym gracz porównuje towar w sklepie");
  • ikona płytowa na przedmiocie kolczym — kłamstwo o materiale, gorsze od
    duplikatu.

Dlatego warianty są WYPROWADZANE z prawdziwego źródła: krótka kolczuga to
pełna kolczuga ucięta w pasie, półnogawice to nogawice ucięte nad kolanem.
Zero malowania od zera — kopiowana jest faktura i obrys autora.

⚠ **Pisanie w WOLNE kafle istniejących rzędów jest tu bezpieczne**, w odróżnieniu
od arkuszy kafli mapy. `items.png` nie idzie przez Tiled: `ITEMS[x].icon` podaje
JAWNE `col`/`row`, więc nie ma arytmetyki `wiersz*kolumny + kolumna`, którą
wstawienie kafla mogłoby przesunąć. Reguła „nowe kafle w NOWYCH WIERSZACH"
z `tools/CLAUDE.md` chroni arkusze adresowane indeksem — ten nie jest.

⚠ **Idempotentny**: czyści kafel docelowy przed zapisem, więc powtórny przebieg
daje bajt-w-bajt to samo.

Domyślnie PRZYMIAR — drukuje raport i nie zapisuje nic. Zapis pod `--zapisz`.
Podgląd: `--podglad PLIK.png`.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "public" / "assets" / "items" / "items.png"
TILE = 32

# (nazwa, kafel ŹRÓDŁOWY, kafel DOCELOWY, wiersz cięcia)
WARIANTY = [
    # Kolczuga pełna ma treść w wierszach 4–26: kołnierz ~4–9, rękawy ~10–16,
    # korpus ~17–26. Cięcie na 21 zostawia korpus do pasa.
    ("kolczuga krótka", (6, 26), (7, 26), 21),
    # Nogawice mają treść w 2–30. Cięcie na 19 zostawia biodra i uda.
    ("półnogawice kolcze", (6, 27), (7, 27), 19),
]


def obrys(tile):
    """Najciemniejszy kolor kafla — u autora zawsze jest nim kontur."""
    px = tile.load()
    naj, kolor = 10**9, None
    for x in range(TILE):
        for y in range(TILE):
            p = px[x, y]
            if p[3] < 200:
                continue
            s = p[0] + p[1] + p[2]
            if s < naj:
                naj, kolor = s, p
    return kolor


def wytnij(tile, ciecie):
    """Utnij kafel na wysokości `ciecie` i domknij go własnym obrysem autora."""
    out = Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0))
    out.paste(tile.crop((0, 0, TILE, ciecie)), (0, 0))
    op = out.load()
    kolor = obrys(tile)

    # Domknięcie: w każdej kolumnie, w której treść dochodzi do linii cięcia,
    # ostatni wiersz zostaje przemalowany na kontur. To jest ten sam zabieg,
    # który autor stosuje u dołu każdej sztuki — nie nowy kształt.
    for x in range(TILE):
        if op[x, ciecie - 1][3] > 8:
            op[x, ciecie - 1] = kolor
    return out


def main():
    zapisz = "--zapisz" in sys.argv
    podglad = None
    if "--podglad" in sys.argv:
        podglad = Path(sys.argv[sys.argv.index("--podglad") + 1])

    if not SHEET.exists():
        print("BLAD: brak " + str(SHEET))
        return 1
    sheet = Image.open(SHEET).convert("RGBA")
    print("arkusz %dx%d = %d kolumn x %d wierszy" % (sheet.width, sheet.height, sheet.width // TILE, sheet.height // TILE))

    nowe = []
    bledy = 0
    for nazwa, (sc, sr), (dc, dr), ciecie in WARIANTY:
        src = sheet.crop((sc * TILE, sr * TILE, (sc + 1) * TILE, (sr + 1) * TILE))
        cel = sheet.crop((dc * TILE, dr * TILE, (dc + 1) * TILE, (dr + 1) * TILE))
        zajete = sum(1 for p in list(cel.getdata()) if p[3] > 8)

        # ⚠ Asercja, która potrafi zaświecić na czerwono: zapis w zajęty kafel
        # skasowałby cudzą ikonę bez słowa.
        if zajete > 20:
            print("BLAD: kafel docelowy (%d,%d) NIE JEST PUSTY (%d px)" % (dc, dr, zajete))
            bledy += 1
            continue

        wynik = wytnij(src, ciecie)
        n_src = sum(1 for p in list(src.getdata()) if p[3] > 8)
        n_out = sum(1 for p in list(wynik.getdata()) if p[3] > 8)
        udzial = n_out / n_src if n_src else 0
        status = ""
        # Wariant, który zachował prawie całe źródło albo prawie nic, nie jest
        # wariantem — jest kopią albo śmieciem.
        if not (0.45 <= udzial <= 0.85):
            status = "  <<< PODEJRZANY UDZIAL"
            bledy += 1
        print(
            "%-20s (%d,%d) -> (%d,%d)  ciecie %2d  %3d -> %3d px (%.0f%% zrodla)%s"
            % (nazwa, sc, sr, dc, dr, ciecie, n_src, n_out, udzial * 100, status)
        )
        nowe.append((dc, dr, wynik, nazwa, src))

    if podglad and nowe:
        S = 6
        out = Image.new("RGBA", (len(nowe) * 2 * (TILE * S + 10) + 10, TILE * S + 20), (30, 34, 48, 255))
        for i, (_, _, wynik, _, src) in enumerate(nowe):
            out.alpha_composite(src.resize((TILE * S, TILE * S), Image.NEAREST), (10 + i * 2 * (TILE * S + 10), 10))
            out.alpha_composite(wynik.resize((TILE * S, TILE * S), Image.NEAREST), (10 + (i * 2 + 1) * (TILE * S + 10), 10))
        podglad.parent.mkdir(parents=True, exist_ok=True)
        out.save(podglad)
        print("podglad (zrodlo | wariant) -> " + str(podglad))

    if bledy:
        print("!!! %d problemow - nie zapisuje" % bledy)
        return 1

    if zapisz:
        for dc, dr, wynik, _, _ in nowe:
            # Idempotencja: wyczyść kafel, potem wklej.
            sheet.paste(Image.new("RGBA", (TILE, TILE), (0, 0, 0, 0)), (dc * TILE, dr * TILE))
            sheet.paste(wynik, (dc * TILE, dr * TILE))
        sheet.save(SHEET)
        print("zapisano -> " + str(SHEET.relative_to(ROOT)))
    else:
        print("PRZYMIAR - nic nie zapisano (dodaj --zapisz)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

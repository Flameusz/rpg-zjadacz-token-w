"""
Przepuszcza `public/assets/stog-siana.png` (nowy rekwizyt, okragly kopiec
siana) przez palete swiata i zapisuje `public/assets/stog_siana_paleta.png`.

Uruchom:  python tools/build_stog_siana.py            (podglad, NIC nie zapisuje)
          python tools/build_stog_siana.py --zapisz   (pisze stog_siana_paleta.png)

⚠ **Nie najblizszy-sasiad, tylko podmiana RANGOWA.** 4 odcienie slomy w
zrodle (najciemniejszy do najjasniejszego) leza 5000-7700 (dystans
euklidesowy RGB²) od najblizszego istniejacego koloru — `snap_paleta.py`-
stylowe snapowanie wybraloby `akcent_cieply` (rampa ognia/zaru) i haystack
wyszedlby czerwono-pomaranczowy, nie slomiano-zloty. Zamiast tego kazdy
z 4 odcieni zrodla jest podmieniony na odcien w TEJ SAMEJ POZYCJI rankingu
jasnosci z rampy `piasek` (piaskowo-slomiana, tematycznie wlasciwa) —
ksztalt/cieniowanie zrodla zostaje, kolor w calosci nasz.

⚠ **To NIE jest podmiana istniejacego `stog_0..3` w `Buildings.png`.** Ten
plik siedzi w `Buildings.png` jako 4 osobne kafle 32x32 (`docs/budynki.json`,
kolumny 5-8 wiersz 5) i jest juz uzyty na mapie wsi. Zrodlowy obrazek tutaj
to jeden kawalek 51x45, nie 4-kaflowa siatka — realna podmiana w Buildings.png
wymaga recznego przeciecia go na 4 kafle 32x32 (osobna, wieksza robota,
nie zrobiona tutaj). Ten skrypt produkuje tylko przekolorowany LUZNY
rekwizyt, do ewentualnego uzycia gdzie indziej niz jako budynkowy `stog_*`.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))
ZRODLO = os.path.join(ASSETS, "stog-siana.png")

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


# (kolor zrodla, ciemny->jasny) -> pozycja w rampie 'piasek'.
SLOMA_ZRODLO = ["#704c00", "#aa7800", "#d89608", "#ffae13"]
KONTUR_ZRODLO = "#3e2613"
KONTUR_DOCELOWY = "#49231d"  # drewno, najciemniejszy — juz bliski (d=230)


def przetworz():
    im = Image.open(ZRODLO).convert("RGBA")
    arr = np.array(im)
    piasek = PALETA["piasek"]
    docelowe = [piasek[0], piasek[1], piasek[3], piasek[4]]
    mapa = {hx(s): hx(d) for s, d in zip(SLOMA_ZRODLO, docelowe)}
    mapa[hx(KONTUR_ZRODLO)] = hx(KONTUR_DOCELOWY)

    rgb = arr[..., :3].astype(int)
    out = arr.copy()
    trafienia = {}
    for src, dst in mapa.items():
        m = (rgb[..., 0] == src[0]) & (rgb[..., 1] == src[1]) & (rgb[..., 2] == src[2])
        out[..., :3][m] = dst
        trafienia[src] = (dst, int(m.sum()))
    return out, trafienia


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    a = ap.parse_args()

    out, trafienia = przetworz()
    print("stog_siana_paleta.png:")
    for src, (dst, n) in trafienia.items():
        print("   #%02x%02x%02x -> #%02x%02x%02x  %d px" % (src + dst + (n,)))

    if a.zapisz:
        dest = os.path.join(ASSETS, "stog_siana_paleta.png")
        Image.fromarray(out, "RGBA").save(dest)
        print("   zapisano -> %s" % dest)
    else:
        print("   (nic nie zapisano - dodaj --zapisz)")


if __name__ == "__main__":
    main()

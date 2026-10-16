"""
Generator portretu Matki -> public/assets/mother_portrait.png

Uruchom:  python tools/build_mother.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_mother.py --zapisz    (nadpisuje public/assets/mother_portrait.png)
          python tools/build_mother.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

Ten sam przepis co `tools/build_father.py`. Zrodlo (`mother.png`) przeszlo
dwie tury korekty proporcji w sesji: pierwsza wersja wyszla za smukla/
wysoka wzgledem reszty obsady ("mama jest bardziej krepa i nizsza"), druga
poprawka poszla za daleko w druga strone (karykaturalnie okragla — "nie az
tak krepa"). Finalna wersja: te same proporcje co reszta rosteru (glowa
30-38% wysokosci, ramiona 90-95% szerokosci), bez sztucznego pomniejszania/
poszerzania.
"""

import argparse
import json
import os
from collections import deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC_PATH = os.path.join(ASSETS, "mother.png")
OUT_PATH = os.path.join(ASSETS, "characters", "mother_portrait.png")

# Ciasny bounding-box nieprzezroczystej tresci w mother.png, policzony (nie
# zgadniety): x1-47, y9-95 wlacznie.
_BOX = (1, 9, 48, 96)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]       # fartuch/gorsecik
PI = PAL["piasek"]      # bluzka pod fartuchem, spodnica jasniejsza
N = PAL["neutralne"]    # kontur, buty

_SKORA_LIGHT = (254, 186, 148)
_SKORA_MID = (217, 135, 105)
# Piaskowo-jasny brąz wlosow — wlasna domena, nie z listy powyzej (ten sam
# powod co siwizna Soltysa w build_elder.py).
_WLOSY = (206, 169, 126)

_MAPA = {
    (154, 106, 78): PI[0],       # bluzka/rekawy, glowny ton
    (1, 3, 28): N[0],            # kontur
    (115, 70, 53): D[0],         # spodnica, cien
    (195, 104, 77): D[1],        # fartuch/gorsecik, glowny ton
    (206, 169, 126): _WLOSY,
    (254, 186, 148): _SKORA_LIGHT,
    (143, 65, 47): D[0],         # fartuch/gorsecik, cien
    (184, 150, 98): PI[1],       # spodnica, glowny ton
    (217, 135, 105): _SKORA_MID,
    (58, 56, 59): N[0],          # buty, najciemniejsze
    (98, 92, 94): N[2],          # buty, jasniejszy ton
}
_KLUCZE = np.array(list(_MAPA.keys()))
_WARTOSCI = np.array(list(_MAPA.values()))


def _usun_zielone(arr):
    h, w, _ = arr.shape
    bg = np.array([3, 255, 3])
    diff = np.abs(arr[..., :3].astype(int) - bg).sum(axis=2)
    is_bg = diff < 60

    visited = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    still_green = (g > 140) & (g > r + 30) & (g > b + 30)

    alpha = np.where(visited | still_green, 0, 255).astype(np.uint8)
    return alpha


def _przekoluj(rgb, alpha):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask]
    d = ((px[:, None, :].astype(int) - _KLUCZE[None, :, :].astype(int)) ** 2).sum(axis=2)
    nearest = _WARTOSCI[np.argmin(d, axis=1)]
    out[mask] = nearest
    return out


def raport(alpha):
    h, w = alpha.shape
    n = int((alpha > 0).sum())
    print("Mother portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
          % (w, h, n, 100 * n / (w * h)))


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    x0, y0, x1, y1 = _BOX
    crop = src[y0:y1, x0:x1].copy()
    alpha = _usun_zielone(crop)
    kolor = _przekoluj(crop, alpha)
    out = np.dstack([kolor, alpha])
    return out


def main(zapisz, podglad):
    px = zbuduj()
    raport(px[..., 3])
    img = Image.fromarray(px, "RGBA")
    if podglad:
        img.resize((img.width * 6, img.height * 6), Image.NEAREST).save(podglad)
        print("Podglad (6x): %s" % podglad)
    if zapisz:
        img.save(OUT_PATH)
        print("Zapisano: %s" % OUT_PATH)
    else:
        print("Nic nie zapisano — uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

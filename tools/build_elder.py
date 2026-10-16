"""
Generator portretu Soltysa -> public/assets/elder_portrait.png

Uruchom:  python tools/build_elder.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_elder.py --zapisz    (nadpisuje public/assets/elder_portrait.png)
          python tools/build_elder.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

Ten sam przepis co `tools/build_hunter.py`/`tools/build_peasant.py`. Zrodlo
(`elder.png`) przeszlo przez rowna sciezke co reszta rodziny DOPIERO po
recznej naprawie marginesu — pierwsza generacja wyszla wycieta "na styk"
(44x87 canvas, zero marginesu) zamiast 50x102 z marginesem 8/7/3/3 jak
wszyscy inni; dolozony margines (patrz historia w docs/prompty_gemini.md),
tresc sama w sobie mial poprawna skale od poczatku (identyczna wysokosc
87px co Kowal/Myśliwy/Rolnik/Mlynarz).

**Siwe wlosy/broda to WLASNA domena, NIE `neutralne`** — to jedyna realna
pulapka tutaj. `neutralne` w docs/paleta.json jest chlodne/niebieskawe
(kazdy odcien ma B>R), siwizna Soltysa jest cieplejsza/neutralna (R>=B) —
zmapowanie jej na `neutralne` upodobnioby wlosy do spodni/butow tym samym
szarym, gubiac odrebnosc materialu. Traktowana identycznie jak skora.
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

SRC_PATH = os.path.join(ASSETS, "elder.png")
OUT_PATH = os.path.join(ASSETS, "characters", "elder_portrait.png")

# Ciasny bounding-box nieprzezroczystej tresci w elder.png (PO naprawie
# marginesu — patrz docstring), policzony (nie zgadniety): x3-46, y8-94.
_BOX = (3, 8, 47, 95)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]       # kamizelka
PI = PAL["piasek"]      # kamizelka, jasniejszy ton
N = PAL["neutralne"]    # kontur, spodnie, buty

_SKORA_LIGHT = (253, 183, 143)
_SKORA_MID = (216, 138, 104)
_SKORA_CIEN = (116, 74, 59)
# Siwizna — wlasna domena, patrz docstring. Cztery tony (cien -> highlight).
_WLOSY_CIEN = (132, 130, 137)
_WLOSY_MID = (119, 116, 122)
_WLOSY_JASNE = (156, 153, 157)
_WLOSY_HIGHLIGHT = (211, 199, 192)

_MAPA = {
    (13, 12, 25): N[0],           # kontur
    (177, 145, 107): PI[1],       # kamizelka, glowny ton (jasny)
    (95, 56, 42): D[0],           # kamizelka, cien
    (46, 45, 57): N[0],           # spodnie
    (137, 102, 74): D[2],         # kamizelka, srodkowy ton
    (253, 183, 143): _SKORA_LIGHT,
    (67, 33, 27): D[0],           # kamizelka, najciemniejszy cien
    (211, 199, 192): _WLOSY_HIGHLIGHT,
    (216, 138, 104): _SKORA_MID,
    (76, 73, 86): N[2],           # spodnie/buty, jasniejszy ton
    (132, 130, 137): _WLOSY_CIEN,
    (116, 74, 59): _SKORA_CIEN,
    (119, 116, 122): _WLOSY_MID,
    (156, 153, 157): _WLOSY_JASNE,
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
    print("Elder portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
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

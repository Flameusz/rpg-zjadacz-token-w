"""
Generator portretu Ojca -> public/assets/father_portrait.png

Uruchom:  python tools/build_father.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_father.py --zapisz    (nadpisuje public/assets/father_portrait.png)
          python tools/build_father.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

Ten sam przepis co `tools/build_hunter.py`/`tools/build_elder.py`. Zrodlo
(`father.png`) generowane Gemini na podstawie prawdziwego zdjecia (identity
reference), NIE malarskiego referencyjnego arkusza jak Kowal — patrz
`docs/prompty_gemini.md`. Dwie poprawki w sesji zanim wyszedl akceptowalny:
fryzura (uciete podgolone boki + kucyk/kok samurajski, nie zakola) i paleta
ubrania (koszula/spodnie wyszly za pierwszym razem w khaki/granacie zamiast
naszych hexow — trzeba bylo wprost wypisac "NOT khaki/olive/navy").

Siwe wlosy -> WLASNA domena, NIE `neutralne` (ten sam powod co Soltys w
build_elder.py: `neutralne` jest chlodne/niebieskawe, siwizna cieplejsza).
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

SRC_PATH = os.path.join(ASSETS, "father.png")
OUT_PATH = os.path.join(ASSETS, "characters", "father_portrait.png")

# Ciasny bounding-box nieprzezroczystej tresci w father.png, policzony (nie
# zgadniety): x2-47, y4-93 wlacznie.
_BOX = (2, 4, 48, 94)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]       # koszula
N = PAL["neutralne"]    # kontur, spodnie, buty

_SKORA_LIGHT = (252, 180, 141)
_SKORA_MID = (211, 133, 102)
_SKORA_CIEN = (156, 83, 69)
_WLOSY_MID = (146, 138, 133)
_WLOSY_JASNE = (212, 208, 198)

_MAPA = {
    (3, 4, 22): N[0],            # kontur
    (130, 88, 65): D[1],         # koszula, glowny ton
    (45, 42, 56): N[0],          # spodnie, glowny ton
    (252, 180, 141): _SKORA_LIGHT,
    (24, 21, 34): N[0],          # spodnie/buty, najciemniejsze
    (91, 52, 41): D[0],          # koszula, cien
    (211, 133, 102): _SKORA_MID,
    (146, 138, 133): _WLOSY_MID,
    (59, 57, 71): N[2],          # spodnie, jasniejszy ton
    (156, 83, 69): _SKORA_CIEN,
    (83, 80, 93): N[2],          # buty, jasniejszy ton
    (212, 208, 198): _WLOSY_JASNE,
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
    print("Father portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
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

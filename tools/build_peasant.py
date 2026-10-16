"""
Generator portretu Rolnika -> public/assets/peasant_portrait.png

Uruchom:  python tools/build_peasant.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_peasant.py --zapisz    (nadpisuje public/assets/peasant_portrait.png)
          python tools/build_peasant.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

Ten sam przepis co `tools/build_hunter.py`/`tools/build_kowal.py`: wytnij +
przekoluj, nie rysuj od nowa. Zrodlo (`peasant.png`) wygenerowane Gemini z
promptem z `docs/prompty_gemini.md` (Image 1 = juz zaakceptowany Kowal,
WYLACZNIE jako referencja stylu/proporcji, nie tozsamosci) — trzecia postac
w tej rodzinie sprite'ow, zmierzony bounding-box tresci niemal identyczny
jak Kowal (48x87 vs 46x87), wiec canvas 50x102 zostaje bez zmian.

Kolory zidentyfikowane przez Counter na wycietym kadrze + porownanie ze
szkicem (nie zgadywane z nazwy): kapelusz -> piasek (jasniejsza, plocienna
rodzina odcieni niz koszula), koszula/pasek -> drewno, spodnie/buty ciemne
-> neutralne. Skora zostaje wlasna domena jak wszedzie dotad.
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

SRC_PATH = os.path.join(ASSETS, "peasant.png")
OUT_PATH = os.path.join(ASSETS, "characters", "peasant_portrait.png")

# Ciasny bounding-box nieprzezroczystej tresci w peasant.png, policzony (nie
# zgadniety): x1-48, y8-94 wlacznie.
_BOX = (1, 8, 49, 95)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]       # koszula, pasek/buty
PI = PAL["piasek"]      # kapelusz
N = PAL["neutralne"]    # kontur, spodnie, buty ciemne

# Skora (i drobny cien pod broda) zostaja wlasna domena, blisko oryginalu —
# jak Character.png/NPC.png/Kowal/Myśliwy (patrz CLAUDE.md).
_SKORA_LIGHT = (253, 176, 132)
_SKORA_MID = (198, 121, 88)
_SKORA_CIEN = (136, 74, 61)

# Jawna tabela zrodlo -> cel, kazdy wpis z Counter() na wycietym kadrze
# (patrz docstring).
_MAPA = {
    (4, 2, 22): N[0],           # kontur
    (128, 86, 62): D[1],        # koszula, glowny ton
    (87, 53, 45): D[0],         # koszula, cien
    (47, 45, 58): N[0],         # spodnie
    (77, 73, 85): N[2],         # spodnie, jasniejszy ton
    (162, 123, 89): PI[0],      # kapelusz, glowny ton
    (40, 32, 43): N[0],         # buty, najciemniejsze
    (117, 83, 60): D[1],        # buty/pasek, jasniejszy brąz
    (201, 160, 114): PI[1],     # kapelusz, jasniejszy ton
    (221, 189, 139): PI[2],     # kapelusz, najjasniejszy ton
    (253, 176, 132): _SKORA_LIGHT,
    (198, 121, 88): _SKORA_MID,
    (136, 74, 61): _SKORA_CIEN,
}
_KLUCZE = np.array(list(_MAPA.keys()))
_WARTOSCI = np.array(list(_MAPA.values()))


def _usun_zielone(arr):
    """Chroma-key w DWA przebiegi: flood-fill od krawedzi kadru lapie
    wiekszosc, globalny prog domyka izolowane resztki. Identyczne jak
    build_hunter.py/build_kowal.py."""
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
    print("Peasant portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
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

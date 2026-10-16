"""
Generator portretu wdowy Zofii -> public/assets/zofia_portrait.png

Uruchom:  python tools/build_zofia.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_zofia.py --zapisz    (nadpisuje public/assets/zofia_portrait.png)
          python tools/build_zofia.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

Zrodlo: `zofia.png` (docs/prompty_gemini.md, sekcja "Wdowa Zofia"). Ciasny
bounding-box POLICZONY flood-fillem od krawedzi kadru na zielonym tle (ten
sam algorytm co build_elder.py/build_dorota.py), NIE zgadniety: x5-55,
y10-115 (50x105).

**Tylko jedna wlasna domena, NIE snapowana do palety srodowiskowej**
(docs/paleta.json): SKORA (3 tony, cieply jasny). W odroznieniu od Doroty
jej WLOSY nie dostaja osobnego przypadku — sa brazowe, a jej deklarowana
paleta (piasek/ziemia) jest tez brazowa/piaskowa, wiec zwykly
najblizszy-sasiad trafia w prawdopodobny odcien wlosow bez ryzyka, jakie
mialaby siwizna Doroty (nie ma tu kategorii koloru, ktora zniknelaby po
zmapowaniu — patrz `build_dorota.py`).

**`ZOFIA`/`NpcId "zofia"` NIE istnieje jeszcze w kodzie** (deliberately —
user poprosil w poprzedniej sesji tylko o prompt, jej docelowa tresc to
scena "nazywam cie mysliwym", nie zwykla rozmowa). Ten portret jest wiec
przygotowany PRZED kodem, tym samym wzorcem co `pig.png` (patrz CLAUDE.md)
— zero wpisu w GameConfig.ts/Npcs.ts, dopoki ktos nie zdecyduje wpiac ja
jako NPC.
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

SRC_PATH = os.path.join(ASSETS, "zofia.png")
OUT_PATH = os.path.join(ASSETS, "characters", "zofia_portrait.png")

# Ciasny bounding-box nieprzezroczystej tresci, POLICZONY flood-fillem
# (patrz `raport` — drukuje go na kazdym uruchomieniu).
_BOX = (5, 10, 55, 115)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
# Dokladnie te ramy, ktore prompt (docs/prompty_gemini.md) jej zadeklarowal:
# suknia=piasek, fartuch=ziemia, lata na fartuchu=kamien, kontur/buty=neutralne.
_ENV_KEYS = np.array(PAL["piasek"] + PAL["ziemia"] + PAL["kamien"] + PAL["neutralne"])

# Skora — zmierzone wprost z 3 najczestszych cieplych, jasnych klastrow
# (kryterium: R-G>40, R-B>60, R>150), NIE z palety.
_SKORA = np.array([(234, 158, 112), (203, 121, 83), (200, 114, 76)])


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


def _nearest(px, keys):
    d = ((px[:, None, :].astype(int) - keys[None, :, :].astype(int)) ** 2).sum(axis=2)
    return keys[np.argmin(d, axis=1)]


def _przekoluj(rgb, alpha):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)
    r, g, b = px[:, 0], px[:, 1], px[:, 2]

    is_skora = (r - g > 40) & (r - b > 60) & (r > 150)
    is_env = ~is_skora

    result = np.empty_like(px, dtype=np.uint8)
    if is_skora.any():
        result[is_skora] = _nearest(px[is_skora], _SKORA)
    if is_env.any():
        result[is_env] = _nearest(px[is_env], _ENV_KEYS)

    out[mask] = result
    return out, int(is_skora.sum()), int(is_env.sum())


def raport(alpha, n_skora, n_env):
    h, w = alpha.shape
    n = int((alpha > 0).sum())
    print("Zofia portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
          % (w, h, n, 100 * n / (w * h)))
    print("  skora=%d otoczenie(suknia/fartuch/lata/wlosy/kontur)=%d" % (n_skora, n_env))


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    x0, y0, x1, y1 = _BOX
    crop = src[y0:y1, x0:x1].copy()
    alpha = _usun_zielone(crop)
    kolor, n_skora, n_env = _przekoluj(crop, alpha)
    out = np.dstack([kolor, alpha])
    return out, n_skora, n_env


def main(zapisz, podglad):
    px, n_skora, n_env = zbuduj()
    raport(px[..., 3], n_skora, n_env)
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

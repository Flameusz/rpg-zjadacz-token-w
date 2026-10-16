"""
Generator portretu Doroty Zielarki -> public/assets/herbalist_portrait.png

Uruchom:  python tools/build_dorota.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_dorota.py --zapisz    (nadpisuje public/assets/herbalist_portrait.png)
          python tools/build_dorota.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

Zrodlo: `dorota-pixel-snapper.png` (juz przepuszczone przez
spritefusion.com/pixel-snapper przed dostarczeniem, jak kazda inna postac
- patrz docs/prompty_gemini.md). Ciasny bounding-box POLICZONY flood-fillem
od krawedzi kadru na zielonym tle (ten sam algorytm co build_elder.py),
NIE zgadniety: x4-51, y8-99 (47x91).

**Dwie wlasne domeny, NIE snapowane do palety srodowiskowej**
(docs/paleta.json) — bo ta paleta nie ma odpowiadajacych odcieni:
- SKORA (3 tony, cieply jasny — dokladnie tyle, ile prompt prosil o
  "2-3 tones").
- WLOSY (3 tony, siwe/achromatyczne). Gdyby je snapowac do ziemia/drewno
  (jedynych brazowych ramp w jej deklarowanej palecie), wyszlyby BRAZOWE —
  siwizna zniknelaby calkowicie, dokladnie ta pulapka, ktora
  `tools/build_elder.py` juz raz opisal jako "siwe wlosy to WLASNA domena,
  NIE neutralne".

Reszta (kontur, suknia, fartuch, chusta) idzie NAJBLIZSZYM sasiadem do
polaczonej puli ramp ziemia/drewno/neutralne/listowie — dokladnie tych,
ktore prompt jej zadeklarowal (docs/prompty_gemini.md, sekcja Dorota).
Kontur nie potrzebuje osobnego przypadku: jego najciemniejszy odcien jest
i tak najblizej neutralne[0], wiec zwykly nearest-neighbour trafia w niego
bez pomocy.
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

SRC_PATH = os.path.join(ASSETS, "dorota-pixel-snapper.png")
OUT_PATH = os.path.join(ASSETS, "characters", "herbalist_portrait.png")

# Ciasny bounding-box nieprzezroczystej tresci, POLICZONY flood-fillem
# (patrz `zbuduj`/`raport` — drukuje go na kazdym uruchomieniu).
_BOX = (4, 8, 51, 99)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
# Dokladnie te ramy, ktore prompt (docs/prompty_gemini.md) jej zadeklarowal.
_ENV_KEYS = np.array(PAL["ziemia"] + PAL["drewno"] + PAL["neutralne"] + PAL["listowie"])

# Skora — zmierzone wprost z 3 najczestszych cieplych, jasnych klastrow
# (kryterium: R-G>40, R-B>60, R>150 — patrz docstring wyzej), NIE z palety.
_SKORA = np.array([(253, 185, 147), (214, 137, 106), (176, 104, 77)])
# Wlosy — siwizna, zmierzona z 3 nisko-nasyconych, cieplo-neutralnych
# klastrow (max-min kanal < 30, R>=G>=B, R>60 — odroznia je od konturu
# ktory jest zbyt ciemny/chlodny, i od sukni/fartucha ktore sa zbyt
# nasycone).
_WLOSY = np.array([(98, 94, 82), (131, 116, 108), (191, 173, 161)])


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
    sat = px.max(axis=1) - px.min(axis=1)
    is_wlosy = (~is_skora) & (sat < 30) & (r >= g) & (g >= b) & (r > 60)
    is_env = ~is_skora & ~is_wlosy

    result = np.empty_like(px, dtype=np.uint8)
    if is_skora.any():
        result[is_skora] = _nearest(px[is_skora], _SKORA)
    if is_wlosy.any():
        result[is_wlosy] = _nearest(px[is_wlosy], _WLOSY)
    if is_env.any():
        result[is_env] = _nearest(px[is_env], _ENV_KEYS)

    out[mask] = result
    return out, int(is_skora.sum()), int(is_wlosy.sum()), int(is_env.sum())


def raport(alpha, n_skora, n_wlosy, n_env):
    h, w = alpha.shape
    n = int((alpha > 0).sum())
    print("Dorota portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
          % (w, h, n, 100 * n / (w * h)))
    print("  skora=%d wlosy=%d otoczenie(suknia/fartuch/chusta/kontur)=%d"
          % (n_skora, n_wlosy, n_env))


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    x0, y0, x1, y1 = _BOX
    crop = src[y0:y1, x0:x1].copy()
    alpha = _usun_zielone(crop)
    kolor, n_skora, n_wlosy, n_env = _przekoluj(crop, alpha)
    out = np.dstack([kolor, alpha])
    return out, n_skora, n_wlosy, n_env


def main(zapisz, podglad):
    px, n_skora, n_wlosy, n_env = zbuduj()
    raport(px[..., 3], n_skora, n_wlosy, n_env)
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

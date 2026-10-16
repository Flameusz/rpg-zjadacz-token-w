"""
Generator portretu Patryczka -> public/assets/characters/patryczek_portrait.png

Uruchom:  python tools/build_patryczek.py                  (raport, NIC nie zapisuje)
          python tools/build_patryczek.py --zapisz
          python tools/build_patryczek.py --podglad X.png

Zrodlo: `patryczek.png` (prompt w `docs/prompty_gemini.md`, sekcja
"Patryczek"). Ten sam przepis co `build_zofia.py`: flood-fill po zielonym
tle, przyciecie do tresci, snapowanie na palete swiata z JEDNYM wyjatkiem.

── DLACZEGO TYLKO JEDNA WLASNA DOMENA (inaczej niz u Anny) ───────────────
Anna potrzebowala trzech wyjatkow, bo blond nie ma odpowiednika w
`docs/paleta.json` i wyszlaby brunetka. U Patryczka takiego problemu NIE MA
i zostalo to zmierzone, nie zalozone: jego 25 kolorow to wylacznie ciepla
skora, ciemnobrazowe wlosy, brazowo-piaskowa przeszywanica i prawie czarne
spodnie. Wlosy i ubranie sa brazowe, a rampy `drewno`/`kora`/`ziemia`/
`piasek` tez sa brazowe, wiec zwykly najblizszy-sasiad trafia w sensowny
odcien. Zostaje sama SKORA — tak samo jak u Zofii.

Prog `R > 170` wystarcza i to tez jest zmierzone: cztery tony skory maja
R = 254/254/217/214, a najjasniejszy kolor przeszywanicy to #8d6d4e (R=141).
Miedzy nimi jest 73 jednostki pustki, wiec prog nie balansuje na niczyjej
krawedzi.

⚠ Jego kaftan to PRZESZYWANICA — ta sama rzecz, ktora jest w grze jako
`ITEMS.gambeson` (`ARMOR_PROFILE.padded`). Zbieg okolicznosci z generacji,
ale zgodny: Witek takie szyje, piesciarz taka nosi. Nie snapowac tego na
`kamien` ani nic szarego — to len, ma zostac brazowo-piaskowy.
"""

import argparse
import json
import os
from collections import Counter, deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC_PATH = os.path.join(ASSETS, "patryczek.png")
OUT_PATH = os.path.join(ASSETS, "characters", "patryczek_portrait.png")

_MARGINES = 1


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()

# Przeszywanica (len) = piasek/drewno/ziemia, wlosy = kora/drewno,
# spodnie i kontur = neutralne. Bez `kamien` — patrz naglowek.
_ENV_KEYS = np.array(
    PAL["piasek"] + PAL["drewno"] + PAL["ziemia"] + PAL["kora"] + PAL["neutralne"]
)


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
    return np.where(visited | still_green, 0, 255).astype(np.uint8)


def _nearest(px, keys):
    d = ((px[:, None, :].astype(int) - keys[None, :, :].astype(int)) ** 2).sum(axis=2)
    return keys[np.argmin(d, axis=1)]


def _przekoluj(rgb, alpha):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)
    r, b = px[:, 0], px[:, 2]
    skora = (r > 170) & (r - b > 60)
    env = ~skora

    ramp_skora = None
    result = np.empty_like(px, dtype=np.uint8)
    if skora.any():
        c = Counter(map(tuple, px[skora]))
        ramp_skora = np.array([k for k, _v in c.most_common(3)])
        result[skora] = _nearest(px[skora], ramp_skora)
    if env.any():
        result[env] = _nearest(px[env], _ENV_KEYS)

    out[mask] = result
    return out, int(skora.sum()), int(env.sum()), ramp_skora


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    alpha = _usun_zielone(src)
    ys, xs = np.nonzero(alpha > 0)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    crop = src[box[1]:box[3], box[0]:box[2]].copy()
    a = alpha[box[1]:box[3], box[0]:box[2]].copy()

    kolor, n_s, n_e, rs = _przekoluj(crop, a)
    out = np.dstack([kolor, a])
    if _MARGINES:
        m = _MARGINES
        h, w, _ = out.shape
        pad = np.zeros((h + 2 * m, w + 2 * m, 4), np.uint8)
        pad[m:m + h, m:m + w] = out
        out = pad
    return out, box, n_s, n_e, rs


def main(zapisz, podglad):
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    a0 = _usun_zielone(src)
    przed = len({tuple(c) for c in src[a0 > 0]})

    out, box, n_s, n_e, rs = zbuduj()
    h, w = out.shape[:2]
    po = len({tuple(c) for c in out[..., :3][out[..., 3] > 0]})
    print("Patryczek portrait: %dx%d (bbox zrodla %s + %dpx marginesu)" % (w, h, box, _MARGINES))
    print("  kolorow: %d -> %d" % (przed, po))
    print("  skora=%d  otoczenie=%d" % (n_s, n_e))
    if rs is not None:
        print("  rampa skory: " + " ".join("#%02x%02x%02x" % tuple(c) for c in rs))
    if n_s == 0:
        print("  BLAD: zero pikseli skory — prog R>170 jest zly")

    img = Image.fromarray(out, "RGBA")
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

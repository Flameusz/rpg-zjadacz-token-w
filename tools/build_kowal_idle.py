"""
Generator spritesheeta idle-loopu Kowala -> public/assets/kowal_idle.png

Uruchom:  python tools/build_kowal_idle.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_kowal_idle.py --zapisz    (nadpisuje public/assets/kowal_idle.png)
          python tools/build_kowal_idle.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

── SKAD TO SIE WZIELO ───────────────────────────────────────────────────────
10 klatek (`public/assets/test1.png` .. `test10.png`) wygenerowanych Gemini
jedna po drugiej, kazda zakotwiczona w tym samym `blacksimth-test.png`
(Image 1), patrz `docs/prompty_gemini.md` -> "Animacja idle". Kazda klatka ma
identyczny bounding-box tresci (zmierzony, nie zgadniety): (2,8)-(47,94) wlacznie,
czyli 46x87 na canvasie 50x102 z zielonym chroma-tlem.

── TECHNIKA: WYTNIJ + ZDEJMIJ ZIELONE + SNAPNIJ DO PALETY ANCHORA ───────────
Inaczej niz `build_kowal.py` (jawna tabela ~16 kolorow zbudowana recznie z
Counter() na JEDNEJ statycznej klatce), tutaj kolory driftuja klatka-do-klatki
(inna generacja = inny szum), wiec jawna tabela zbudowana na jednej klatce nie
lapalaby kolorow pozostalych dziewieciu. Zamiast tego: nearest-neighbour snap
kazdego piksela do STALEJ 14-kolorowej palety wyciagnietej z zaakceptowanego
anchora (`kowal_palette_swatch.png` - juz istnial w repo, wyciagniety recznie
podczas sesji ktora zaakceptowala Frame 1/2). To ten sam "pixel-snapper"
wspominany wielokrotnie w `docs/prompty_gemini.md`, tylko wreszcie jako skrypt
zamiast recznej obrobki w edytorze za kazdym razem.

Zielone tlo zdejmowane DWA razy, identycznie jak w `build_kowal.py`:
flood-fill od krawedzi kadru (lapie zielone "zatoki" miedzy konczynami) +
globalny prog na tym, co flood-fill nie dosiegnal.
"""

import argparse
import os
from collections import deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))

FRAMES = ["test%d.png" % i for i in range(1, 11)]
SWATCH_PATH = os.path.join(ASSETS, "kowal_palette_swatch.png")
OUT_PATH = os.path.join(ASSETS, "characters", "kowal_idle.png")

# Bounding-box tresci, identyczny co do piksela we wszystkich 10 klatkach
# (zmierzone, patrz docstring). Polprzedzialy (x1/y1 wylaczajace).
_BOX = (2, 8, 48, 95)  # x0,y0,x1,y1 -> 46x87


def wczytaj_palete_swatcha():
    im = Image.open(SWATCH_PATH).convert("RGB")
    w, h = im.size
    n = w // 32
    cols = []
    for i in range(n):
        cols.append(im.getpixel((i * 32 + 16, 16)))
    return np.array(cols)


def _usun_zielone(arr):
    """Chroma-key w DWA przebiegi, identycznie jak build_kowal.py."""
    h, w, _ = arr.shape
    bg = np.array([6, 253, 3])
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


def _snap(rgb, alpha, palette):
    """Plain nearest-neighbour snap. Returns (snapped_rgb, chosen_idx),
    chosen_idx == -1 on background pixels."""
    out = rgb.copy()
    idx = np.full(rgb.shape[:2], -1, dtype=int)
    mask = alpha > 0
    px = rgb[mask].astype(int)
    d = ((px[:, None, :] - palette[None, :, :].astype(int)) ** 2).sum(axis=2)
    nearest_idx = np.argmin(d, axis=1)
    out[mask] = palette[nearest_idx]
    idx[mask] = nearest_idx
    return out, idx


# How much closer a candidate colour must be than the anchor's own choice at
# that exact pixel before a later frame is allowed to switch to it. Without
# this, per-frame generation noise nudges a pixel a few units across the
# boundary between two close palette entries (e.g. two near-identical shirt
# tones), and a whole material visibly flickers between them across the idle
# loop even though every individual frame looks internally clean — this was
# reported on sight in the assembled sheet (shirt/belt colour popping frame
# to frame) before this bias existed.
_ANCHOR_BIAS = 6000


def _snap_biased(rgb, alpha, palette, anchor_idx):
    """Nearest-neighbour snap with a distance discount toward whatever
    palette entry Frame 1 (the anchor) used at the SAME coordinate — the
    bbox is pixel-identical across all 10 frames, so position-for-position
    comparison is valid with no realignment. Only a genuinely different
    colour (not just noise) overcomes the discount."""
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)
    d = ((px[:, None, :] - palette[None, :, :].astype(int)) ** 2).sum(axis=2).astype(float)
    anchor_here = anchor_idx[mask]
    has_anchor = anchor_here >= 0
    rows = np.where(has_anchor)[0]
    d[rows, anchor_here[rows]] -= _ANCHOR_BIAS
    nearest = palette[np.argmin(d, axis=1)]
    out[mask] = nearest
    return out


def zbuduj_klatke(path, palette, anchor_idx=None):
    src = np.array(Image.open(path).convert("RGB"))
    x0, y0, x1, y1 = _BOX
    crop = src[y0:y1, x0:x1].copy()
    alpha = _usun_zielone(crop)
    if anchor_idx is None:
        kolor, idx = _snap(crop, alpha, palette)
        return np.dstack([kolor, alpha]), idx
    kolor = _snap_biased(crop, alpha, palette, anchor_idx)
    return np.dstack([kolor, alpha]), None


def zbuduj():
    palette = wczytaj_palete_swatcha()
    anchor_frame, anchor_idx = zbuduj_klatke(os.path.join(ASSETS, FRAMES[0]), palette)
    klatki = [anchor_frame]
    for f in FRAMES[1:]:
        frame, _ = zbuduj_klatke(os.path.join(ASSETS, f), palette, anchor_idx)
        klatki.append(frame)
    fw, fh = klatki[0].shape[1], klatki[0].shape[0]
    sheet = np.zeros((fh, fw * len(klatki), 4), dtype=np.uint8)
    for i, k in enumerate(klatki):
        sheet[:, i * fw:(i + 1) * fw] = k
    return sheet, fw, fh


def raport(sheet, fw, fh):
    n_klatek = sheet.shape[1] // fw
    print("Kowal idle spritesheet: %d klatek, %dx%d kazda, arkusz %dx%d"
          % (n_klatek, fw, fh, sheet.shape[1], sheet.shape[0]))
    for i in range(n_klatek):
        a = sheet[:, i * fw:(i + 1) * fw, 3]
        n = int((a > 0).sum())
        print("  klatka %d: %d nieprzezroczystych pikseli" % (i + 1, n))


def main(zapisz, podglad):
    sheet, fw, fh = zbuduj()
    raport(sheet, fw, fh)
    img = Image.fromarray(sheet, "RGBA")
    if podglad:
        img.resize((img.width * 4, img.height * 4), Image.NEAREST).save(podglad)
        print("Podglad (4x): %s" % podglad)
    if zapisz:
        img.save(OUT_PATH)
        print("Zapisano: %s (%dx%d)" % (OUT_PATH, img.width, img.height))
    else:
        print("Nic nie zapisano — uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

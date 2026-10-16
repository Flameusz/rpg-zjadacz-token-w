"""
Generator portretu Myśliwego -> public/assets/hunter_portrait.png

Uruchom:  python tools/build_hunter.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_hunter.py --zapisz    (nadpisuje public/assets/hunter_portrait.png)
          python tools/build_hunter.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

── SKAD TO SIE WZIELO ───────────────────────────────────────────────────────
Ten sam przepis co `tools/build_kowal.py` (patrz jego docstring po pelne tlo),
zastosowany do drugiego NPC-a: Myśliwego (`docs/swiat.md` — ranny przez
wilka, poszarpane/owiniete lewe ramie, juz nie wraca do lasu). Zrodlo:
`hunter.png`, wygenerowane Gemini z promptem opisanym w
`docs/prompty_gemini.md`, DRUGA proba — pierwsza wyszla zbyt malarska/
wysoko-wierna (widoczne pojedyncze zmarszczki, gradienty), wiec prompt
dostal Kowala jako obraz referencyjny WYLACZNIE od stylu/proporcji (nie
tozsamosci) plus zmierzone liczby (glowa ~30% wysokosci, ramiona ~90-95%
szerokosci) zamiast samych przymiotnikow. Druga proba: 44x86 (Kowal: 46x87),
glowa ~40% wysokosci, ramiona ~95% szerokosci — wystarczajaco blisko.

── TECHNIKA: WYTNIJ + PRZEKOLORUJ, NIE NARYSUJ OD NOWA ─────────────────────
Identyczne dwa przebiegi zdejmowania zielonego tla co build_kowal.py.
Tabela przekolorowania tym razem ma tylko 12 wejsciowych kolorow (zrodlo
JUZ trzymalo sie podanej w promptcie palety duzo scislej niz blacksmith.png
w swoim czasie) — kazdy zidentyfikowany przez podswietlenie wlasnej maski
na osobnym eksporcie (nie zgadywany z nazwy/pozycji na oko):
- Kontur, kamizelka (glowny+cien), tunika, spodnie, buty (ciemny+jasny)
  -> najblizszy kolor z `docs/paleta.json` (neutralne/drewno/piasek),
  policzony programowo (odleglosc euklidesowa), nie dobrany na oko.
- Skora, wlosy, brwi/cien twarzy, bandaz -> WLASNA domena, zostaja
  blisko oryginalu (jak Character.png/NPC.png i skora/koszula Kowala,
  patrz CLAUDE.md) — to nie „material" ktory ma pasowac do otoczenia.
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

SRC_PATH = os.path.join(ASSETS, "hunter.png")
OUT_PATH = os.path.join(ASSETS, "characters", "hunter_portrait.png")

# (x0, y0, x1, y1) w oryginalnym hunter.png — ciasny bounding-box
# nieprzezroczystej tresci, policzony (nie zgadniety): x2-45, y8-93 wlacznie.
_BOX = (2, 8, 46, 94)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]       # kamizelka
N = PAL["neutralne"]    # kontur, spodnie, buty
PI = PAL["piasek"]      # tunika (ta sama rodzina hexow co "cloth" w promptcie)

# Skora, wlosy, brwi/cien twarzy, bandaz zostaja bliskie oryginalowi z
# hunter.png — wlasna domena, jak Character.png/NPC.png (nie ma jej w
# docs/paleta.json).
_SKORA_LIGHT = (254, 198, 153)
_SKORA_MID = (225, 153, 112)
_WLOSY = (158, 117, 98)
_BRWI_CIEN = (82, 70, 72)
_BANDAZ = (186, 163, 141)

# Jawna tabela zrodlo -> cel. Kazdy wpis zidentyfikowany przez podswietlenie
# wlasnej maski na osobnym eksporcie (patrz docstring), nie zgadywany.
_MAPA = {
    (7, 6, 23): N[0],           # kontur
    (105, 63, 49): D[1],        # kamizelka, glowny ton
    (68, 38, 35): D[0],         # kamizelka, cien
    (138, 105, 79): PI[1],      # tunika pod kamizelka
    (52, 50, 64): N[1],         # spodnie
    (30, 27, 40): N[0],         # buty, najciemniejsze
    (83, 77, 91): N[2],         # buty, jasniejsze
    (254, 198, 153): _SKORA_LIGHT,
    (225, 153, 112): _SKORA_MID,
    (158, 117, 98): _WLOSY,
    (82, 70, 72): _BRWI_CIEN,
    (186, 163, 141): _BANDAZ,
}
_KLUCZE = np.array(list(_MAPA.keys()))
_WARTOSCI = np.array(list(_MAPA.values()))


def _usun_zielone(arr):
    """Chroma-key w DWA przebiegi: flood-fill od krawedzi kadru lapie
    wiekszosc, globalny prog domyka izolowane resztki, ktorych flood-fill
    nie dosiegnie bo nie stykaja sie z brzegiem kadru. Identyczne jak
    build_kowal.py."""
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
    print("Hunter portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
          % (w, h, n, 100 * n / (w * h)))
    print("  OK: chroma-key zdjety (flood-fill + prog resztkowy).")


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

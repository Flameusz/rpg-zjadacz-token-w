"""
Generator portretu Kowala -> public/assets/kowal_portrait.png

Uruchom:  python tools/build_kowal.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_kowal.py --zapisz    (nadpisuje public/assets/kowal_portrait.png)
          python tools/build_kowal.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

── SKĄD TO SIĘ WZIĘŁO (trzy podejscia, w kolejnosci) ───────────────────────
1. Proceduralny rysunek od zera (blokowe prymitywy jak build_wilk.py) —
   odrzucony na pierwszy rzut oka, za daleko od stylu gry.
2. Wyciecie + przekolorowanie z `kowal.png` (arkusz-referencja Gemini usera,
   malarski/wysokiej wiernosci styl) — TECHNICZNIE dzialalo (ten sam trik co
   `build_kuznia.py` na tym samym pliku), ale user zauwazyl cos wazniejszego:
   skoro i tak tylko PRZEKOLOROWUJEMY cudza grafike, niech Gemini od razu
   generuje w docelowym, niskiej-wiernosci stylu gry — mniej pracy dla nas,
   lepszy material wejsciowy. `kowal.png` zostaje uzyte gdzie indziej
   (`build_kuznia.py`, meble kuzni), ale NIE jako zrodlo tego portretu.
3. **Ten skrypt: `blacksmith.png`**, wygenerowany Gemini z promptem
   napisanym pod TEN projekt (patrz `docs/prompty_gemini.md` — pelny prompt,
   z wlasciwa paleta projektu i instrukcja plaskiego cieniowania). Dedykowana
   generacja postaci, bez zadnych innych obiektow w kadrze — stad prostsza
   technika niz #2: jeden prostokat bounding-box, bez recznego dobierania
   kadru zeby ominac sasiadujacy prop (nie ma go w kadrze).

── TECHNIKA: WYTNIJ + PRZEKOLORUJ, NIE NARYSUJ OD NOWA ─────────────────────
1. `_BOX` to ciasny bounding-box nieprzezroczystej (nie-zielonej) tresci w
   `blacksmith.png` (50x101, postac zajmuje x7-42/y16-82) — policzony, nie
   zgadniety.
2. Zielone tlo zdejmowane DWA razy, jak w poprzedniej wersji tego skryptu:
   flood-fill od krawedzi kadru (lapie zielone „zatoki" miedzy konczynami a
   tulowiem) + globalny prog na tym, co flood-fill nie dosiegnal.
3. Przekolorowanie to JAWNA tabela (~16 kolorow w tym zrodle, policzone przez
   Counter na wycietym kadrze) — kazdy sprawdzony na osobnej masce, nie
   zgadywany z nazwy. Piksele spoza tabeli (antyaliasing na krawedziach)
   dostaja kolor NAJBLIZSZEGO wpisu w tabeli, nie najblizszy kolor rampy.
   - Skora i plocienna koszula pod fartuchem zostaja BLISKIE oryginalowi —
     to nie „material" ktory ma pasowac do otoczenia (analogicznie
     NPC.png/Character.png, patrz CLAUDE.md), tylko kolor postaci.
   - Fartuch/pasy -> `drewno` (ta sama rampa co reszta skorzanych mebli w
     kuzni). Buty/kontur -> `neutralne` (ciemne, prawie-czarne). Spodnie
     (pojedynczy, ciemnozielony odcien) -> `listowie[0]`, najblizszy
     numerycznie ciemny stonowany zielony w palecie projektu.

── ŚWIADOME ODSTĘPSTWO: KONTUR ZOSTAJE ──────────────────────────────────────
`docs/ART_DIRECTION.md` 4.4 mowi „prop: bez czarnego obrysu, krawedz
ciemniejsza o jeden stopien wlasnej rampy" — i `build_kuznia.py` trzyma sie
tego dla mebli z tego samego Gemini zrodla. Sprobowane tu (ten sam trik:
cienki 1px obrys wykryty erozja, zastapiony najblizszym kolorem wypelnienia
o jeden stopien ciemniejszym) i PORZUCONE po podgladzie — bez obrysu sylwetka
robi sie miekka, granice reka/tulow i noga/but zlewaja sie. To duza roznica
wzgledem nieruchomego propu: kowal to jedyna ruchoma postac tego zestawu,
ktora ma czytac sie na tle trawy BEZ wlasnego konturu (`docs/ART_DIRECTION.md`
4.6: kontrast jasnosci wazniejszy niz czystosc stylu). Kontur zostaje.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC_PATH = os.path.join(ASSETS, "blacksmith.png")
OUT_PATH = os.path.join(ASSETS, "characters", "kowal_portrait.png")

# (x0, y0, x1, y1) w oryginalnym blacksmith.png — ciasny bounding-box
# nieprzezroczystej tresci, policzony (nie zgadniety).
_BOX = (7, 16, 43, 83)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]       # fartuch, pasy
N = PAL["neutralne"]    # buty, kontur
LI = PAL["listowie"]    # spodnie (ciemna zielen)

# Skora i plocienna koszula zostaja bliskie oryginalowi z blacksmith.png —
# wlasna domena, jak Character.png/NPC.png (nie ma jej w docs/paleta.json).
_SKORA_DARK = (140, 88, 64)
_SKORA_MID = (182, 116, 84)
_SKORA_LIGHT = (225, 167, 124)
_KOSZULA_MID = (90, 90, 80)
_KOSZULA_LIGHT = (140, 130, 122)

# Jawna tabela zrodlo -> cel, zbudowana z Counter() na wycietym kadrze
# i zweryfikowana per-kolor maska (patrz punkt 3 w docstringu).
_MAPA = {
    (1, 1, 1): N[0],            # kontur
    (96, 54, 38): D[1],         # fartuch, glowny ton
    (228, 169, 125): _SKORA_LIGHT,
    (62, 33, 30): D[0],         # wlosy/broda-cien (ten sam surowy kolor co fartuch-cien)
    (85, 87, 77): _KOSZULA_MID,
    (135, 127, 121): _KOSZULA_LIGHT,
    (111, 71, 49): D[2],        # fartuch, jasniejszy
    (184, 116, 83): _SKORA_MID,
    (27, 27, 27): N[0],         # buty, najciemniejsze
    (48, 48, 48): N[1],         # buty, srodek
    (35, 58, 39): LI[0],        # spodnie
    (70, 39, 33): D[0],         # fartuch, najciemniejszy cien
    (163, 145, 132): _KOSZULA_LIGHT,
    (140, 88, 64): _SKORA_DARK,
    (32, 30, 30): N[0],
    (12, 3, 2): N[0],
}
_KLUCZE = np.array(list(_MAPA.keys()))
_WARTOSCI = np.array(list(_MAPA.values()))


def _usun_zielone(arr):
    """Chroma-key w DWA przebiegi: flood-fill od krawedzi kadru lapie
    wiekszosc, globalny prog domyka izolowane resztki, ktorych flood-fill
    nie dosiegnie bo nie stykaja sie z brzegiem kadru."""
    from collections import deque
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
    print("Kowal portrait: %dx%d, %d nieprzezroczystych pikseli (%.0f%% wypelnienia)"
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

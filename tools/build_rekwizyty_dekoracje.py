"""
Wycina rekwizyty z referencji `public/assets/tem/decorations-medieval.png`
(patrz `docs/referencje_zewnetrzne.md`), snapuje do wspolnej palety swiata
i sklada w jeden maly arkusz `public/assets/rekwizyty_dekoracje.png`.

Uruchom:  python tools/build_rekwizyty_dekoracje.py            (podglad, NIC nie zapisuje)
          python tools/build_rekwizyty_dekoracje.py --zapisz   (pisze rekwizyty_dekoracje.png)

Ten sam schemat co `tools/build_rekwizyty_kontener.py` — wybor rekwizytow
jest RECZNY (arkusz miesza nagrobki, szubienice i tarcze lucznicze, ktore
nie pasuja, z rzeczami ktore pasuja, patrz rejestr). `tablica_ogloszen`
trafia wprost w luke wymieniona w `docs/wioska_plan.md` §7.3 pozycja B10
("dziś bez żadnych kafli").
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))
ZRODLO = os.path.join(ASSETS, "tem", "decorations-medieval.png")

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def rampa(nazwa, ile=None):
    v = PALETA[nazwa]
    return [(nazwa, h) for h in (v[:ile] if ile else v)]


# (nazwa, (x0, y0, x1, y1)) w px na oryginalnym 512x2048 arkuszu.
BOXY = [
    # Tablica na pojedynczym slupie, z tekstem — bezposrednie trafienie
    # w wioska_plan.md §7.3 B10.
    ("tablica_ogloszen", (223, 129, 257, 164)),
    # Piec narzedzi ogrodowych oparte pod katem: szpadel, grabie, motyka,
    # dwa warianty widel.
    ("narzedzia_ogrodowe", (200, 580, 342, 640)),
    # Drewniana taczka dwukolowa.
    ("taczka", (190, 510, 290, 575)),
]

CEL = (
    rampa("drewno") + rampa("kora") + rampa("piasek") + rampa("ziemia")
    + rampa("neutralne", 3) + rampa("kamien", 3)
)


def _snapuj(rgba, target):
    rgb, a = rgba[..., :3].astype(int), rgba[..., 3]
    m = a > 0
    out = rgba.copy()
    if m.any():
        d = ((rgb[m][:, None, :] - target[None, :, :]) ** 2).sum(axis=2)
        out[..., :3][m] = target[d.argmin(axis=1)]
    return out


def buduj():
    im = Image.open(ZRODLO).convert("RGBA")
    arr = np.array(im)
    target = np.array([hx(h) for _, h in CEL])

    szer = [x1 - x0 for _, (x0, _, x1, _) in BOXY]
    wys = [y1 - y0 for _, (_, y0, _, y1) in BOXY]
    CW, CH = max(szer) + 6, max(wys) + 6
    cols = len(BOXY)
    sheet = np.zeros((CH, CW * cols, 4), dtype=np.uint8)
    for i, (nazwa, (x0, y0, x1, y1)) in enumerate(BOXY):
        crop = _snapuj(arr[y0:y1, x0:x1], target)
        h, w = crop.shape[:2]
        oy, ox = (CH - h) // 2, i * CW + (CW - w) // 2
        sheet[oy:oy + h, ox:ox + w] = crop
    return sheet


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="PLIK")
    a = ap.parse_args()

    sheet = buduj()
    kolory = len({tuple(c) for c in sheet.reshape(-1, 4) if c[3] > 0})
    print("rekwizyty_dekoracje.png: %dx%d, %d kolorow po snapowaniu" %
          (sheet.shape[1], sheet.shape[0], kolory))

    if a.podglad:
        bg = np.zeros_like(sheet)
        bg[..., 1] = 140
        bg[..., 0] = 60
        bg[..., 2] = 50
        bg[..., 3] = 255
        al = sheet[..., 3:4].astype(float) / 255.0
        podg = (sheet[..., :3] * al + bg[..., :3] * (1 - al)).astype("uint8")
        Image.fromarray(podg).resize(
            (sheet.shape[1] * 4, sheet.shape[0] * 4), Image.NEAREST
        ).save(a.podglad)
        print("   podglad -> %s" % a.podglad)

    if a.zapisz:
        out = os.path.join(ASSETS, "rekwizyty_dekoracje.png")
        Image.fromarray(sheet, "RGBA").save(out)
        print("   zapisano -> %s" % out)
    else:
        print("   (nic nie zapisano - dodaj --zapisz)")


if __name__ == "__main__":
    main()

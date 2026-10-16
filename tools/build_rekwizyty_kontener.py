"""
Wycina 8 rekwizytow z referencji `public/assets/tem/container.png` (bardzo
duzy, wielowatkowy arkusz sklepowo-magazynowy, patrz `docs/
referencje_zewnetrzne.md`), snapuje je do wspolnej palety swiata i sklada
w jeden mały arkusz `public/assets/rekwizyty_kontener.png`.

Uruchom:  python tools/build_rekwizyty_kontener.py            (podglad, NIC nie zapisuje)
          python tools/build_rekwizyty_kontener.py --zapisz   (pisze rekwizyty_kontener.png)

Wybor 8 z ~360 spojnych skladowych na arkuszu jest RECZNY, nie automatyczny —
container.png miesza plaskie beczki/skrzynie/kosze (pasuja) z okutymi
skrzyniami skarbow, swiecacymi fiolkami alchemicznymi i zdobiona porcelana
(nie pasuja, patrz `docs/referencje_zewnetrzne.md`), wiec zadne proste
kryterium rozmiaru/pozycji nie odrozni jednych od drugich. Kazdy `BOX` ponizej
byl wybrany po obejrzeniu wyciecia, nie zgadniety z listy wspolrzednych.

Paleta: wszystkie 8 rekwizytow razem daja tylko 34 unikalne kolory (miary w
sesji, ktora to zbudowala) i kazdy z nich ma najblizszego sasiada w jednej
z piatki `drewno`/`kora`/`piasek`/`ziemia`/`neutralne` w dystansie <950 —
zaden nowy jawny wyjatek nie byl potrzebny (w odroznieniu od `worek-z-
ziarnem.png`, ktorego zloto zbierz w `tools/snap_paleta.py`).
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))
ZRODLO = os.path.join(ASSETS, "tem", "container.png")

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def rampa(nazwa, ile=None):
    v = PALETA[nazwa]
    return [(nazwa, h) for h in (v[:ile] if ile else v)]


# (nazwa, (x0, y0, x1, y1)) w px na oryginalnym 512x2048 arkuszu.
BOXY = [
    ("beczki_trzy", (72, 1, 120, 62)),      # klaster 3 beczek
    ("kadz", (3, 133, 61, 192)),            # okragla, otwarta kadz/balia
    ("beczka", (3, 7, 31, 45)),             # pojedyncza beczka
    ("skrzynki_4", (33, 491, 96, 544)),     # 4 warianty malych skrzynek 2x2
    ("skrzynia", (392, 608, 444, 672)),     # wysoka skrzynia z listwami
    ("worki_kratka", (97, 801, 158, 864)),  # klaster workow w kratke
    ("kosz_maly", (2, 742, 30, 766)),       # maly kosz wiklinowy z uchwytami
    ("sakiewka", (296, 835, 316, 860)),     # mala wiazana sakiewka
    # Druga tura (2026-08-14, na wyrazna prosbe — "jesli uznajesz je za
    # potrzebne to bierz"), kategorie zapowiedziane w docs/referencje_
    # zewnetrzne.md, ktorych pierwsza tura celowo nie wziela:
    ("kociolek", (459, 1043, 501, 1088)),     # zeliwny kociolek (do ogniska)
    ("cebrzyki", (384, 935, 508, 992)),       # klaster drewnianych cebrzykow
    ("bele_trzy", (449, 749, 511, 800)),      # klaster bel siana/slomy
    ("kosz_okragly", (162, 733, 190, 772)),   # okragly kosz wiklinowy
    ("garnek", (65, 1110, 100, 1148)),        # zwykly gliniany garnek
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

    CW, CH = 130, 66
    cols, rows = 5, 3
    sheet = np.zeros((CH * rows, CW * cols, 4), dtype=np.uint8)
    for i, (nazwa, (x0, y0, x1, y1)) in enumerate(BOXY):
        crop = _snapuj(arr[y0:y1, x0:x1], target)
        h, w = crop.shape[:2]
        r, c = divmod(i, cols)
        oy, ox = r * CH + (CH - h) // 2, c * CW + (CW - w) // 2
        sheet[oy:oy + h, ox:ox + w] = crop
    return sheet


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="PLIK")
    a = ap.parse_args()

    sheet = buduj()
    kolory = len({tuple(c) for c in sheet.reshape(-1, 4) if c[3] > 0})
    print("rekwizyty_kontener.png: %dx%d, %d kolorow po snapowaniu" %
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
        out = os.path.join(ASSETS, "rekwizyty_kontener.png")
        Image.fromarray(sheet, "RGBA").save(out)
        print("   zapisano -> %s" % out)
    else:
        print("   (nic nie zapisano - dodaj --zapisz)")


if __name__ == "__main__":
    main()

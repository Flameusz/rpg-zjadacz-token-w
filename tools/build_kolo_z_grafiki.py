"""
Sprowadza `gpt-wheel.png` (kolo mlynskie, generacja GPT image) do palety swiata.

Uruchom:  python tools/build_kolo_z_grafiki.py                (raport, NIC nie pisze)
          python tools/build_kolo_z_grafiki.py --podglad KAT  (przed/po)
          python tools/build_kolo_z_grafiki.py --zapisz       (pisze kolo_mlynskie.png)

── DLACZEGO Z GRAFIKI, A NIE Z GEOMETRII ─────────────────────────────────
Kolo bylo najpierw RYSOWANE proceduralnie, od zera. Wynik przeszedl wszystkie
testy i zostal oceniony jako "jako tako" — proceduralny pixel art ma sufit:
da sie nim zrobic rzecz poprawna, nie da sie ladnej. Ta proba wysypala sie
trzy razy z rzedu i za kazdym razem na rozkladzie masy: promieniste wypustki
poza obrysem czytaly sie jako ZEBATKA, a po ich schowaniu i zageszczeniu pasa
czerpakow — jako WIRNIK.

`gpt-wheel.png` rozwiazuje to jednym chwytem, ktorego geometria nie da:
**lopatki sa narysowane jako OTWARTE SKRZYNKI**, z widocznym wnetrzem i
gruboscia scianki. Plaski zab jest albo zebem, albo lopata turbiny; skrzynka
jest czerpakiem.

Dlatego tutaj obowiazuje ta sama zasada co w `build_znaki.py`:

    ANI JEDEN PIKSEL NIE ZMIENIA KSZTALTU. Zmienia sie wylacznie KOLOR.

── CO JEST W ZRODLE ──────────────────────────────────────────────────────
Zmierzone, nie przyjete — dwa osobne obiekty:
  lico   x=8  y=2  99x96 px  -> 3,09 x 3,00 kafla, srodek ciezkosci (49,1; 48,9)
  bok    x=118 y=5 40x91 px  -> 1,25 x 2,84 kafla

⚠ **Lico ma 99 px szerokosci, nie 96** — o trzy za duzo na 3 kafle. Skrajne
kolumny niosa realna tresc (3-4 px konca lopatki), wiec przyciecie do 96
obcieloby koncowki dwoch lopatek. Zamiast tego canvas ma **128x96 (4x3 kafle)**
i kolo siedzi na nim wysrodkowane: nic nie ginie, siatka 32 zachowana, a
marginesy sa przezroczyste. Skalowania nie ma i nie bedzie — patrz
`docs/ART_DIRECTION.md` §4.1.

⚠ **Cala grafika ma alfe <= 254** (maksimum w pliku to 254, minimum 1), czyli
ani jeden piksel nie jest w pelni kryjacy. To artefakt generatora, nie zamysl.
Bez binaryzacji kazdy piksel bylby lekko przezroczysty i kolo swiecilo by
trawa. Prog 128 tnie to na rysunek/nic; miekka otoczka 1-9 idzie do zera.

── METODA KOLORU: TA SAMA CO W `build_znaki.py` ──────────────────────────
Rampa z najblizszego sasiada (jaki to material), stopien z jasnosci wazonej
populacja (jaki to walor). Uzasadnienie i pulapki — w naglowku tamtego pliku;
tutaj liczy sie zwlaszcza wazenie populacja, bo zrodlo ma 61 kolorow, w tym
sporo pojedynczych pikseli na krawedziach.
"""

import argparse
import importlib.util
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
KORZEN = os.path.normpath(os.path.join(TU, ".."))
ASSETS = os.path.join(KORZEN, "public", "assets")
DOCS = os.path.join(KORZEN, "docs")

_spec = importlib.util.spec_from_file_location("znaki", os.path.join(TU, "build_znaki.py"))
Z = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(Z)

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
ZRODLO = "gpt-wheel.png"   # przemianowane z wheel.png
WYNIK = os.path.join("props", "kolo_mlynskie.png")  # assety poukladane w katalogi tematyczne

# (nazwa, x, y, szer, wys, canvas_szer, canvas_wys)
WIDOKI = [
    ("lico", 8, 2, 99, 96, 128, 96),
    ("bok", 118, 5, 40, 91, 64, 96),
]

# Samo drewno. `kamien` byl w zbiorze na okucie osi i dostal ZERO pikseli —
# w zrodle czop i piasta sa narysowane drewnem, nie metalem. Usuniete zamiast
# zostawione jako martwy wpis (konwencja z `snap_paleta.py`).
ZBIORY = {
    "drewno": Z.DREWNO6,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="KATALOG")
    a = ap.parse_args()

    src = np.array(Image.open(os.path.join(ASSETS, ZRODLO)).convert("RGBA"))
    print("== zrodlo %s: alfa %d..%d (maks < 255 -> binaryzacja obowiazkowa)"
          % (ZRODLO, src[..., 3].min(), src[..., 3].max()))
    print()

    wyniki = []
    ok = True
    for nazwa, x, y, w, h, cw, ch in WIDOKI:
        blok = src[y:y + h, x:x + w]
        nowy, kolory, mapa, trafienia, cieni = Z.przetworz(blok, ZBIORY)

        canvas = np.zeros((ch, cw, 4), np.uint8)
        ox, oy = (cw - w) // 2, (ch - h) // 2
        canvas[oy:oy + h, ox:ox + w] = nowy
        wyniki.append((nazwa, canvas))

        print("== %-5s %dx%d -> canvas %dx%d (%dx%d kafli), przesuniecie (%d,%d)"
              % (nazwa, w, h, cw, ch, cw // 32, ch // 32, ox, oy))
        print("   kolorow: %d -> %d,  pikseli cienia: %d"
              % (len(kolory), len({tuple(v) for v in mapa.values()}), cieni))
        print("   " + ", ".join("%s:%d px" % (n, c) for n, c in trafienia.most_common()))
        puste = sorted(set(ZBIORY) - set(trafienia))
        if puste:
            print("   ⚠ RAMPY BEZ ANI JEDNEGO PIKSELA: %s" % ", ".join(puste))
        odwrocone = 0
        for n in trafienia:
            g = sorted([k for k in mapa if Z._rampa_koloru(k, mapa, ZBIORY) == n], key=Z.lum)
            v = [Z.lum(mapa[k]) for k in g]
            odwrocone += sum(1 for i in range(1, len(v)) if v[i] < v[i - 1])
        print("   walor: %d odwrocen wewnatrz ramp  %s"
              % (odwrocone, "OK" if not odwrocone else "⚠ modelunek odwrocony"))
        ok = ok and not odwrocone
        print()

    paleta_ok = {Z.hx(h) for l in PALETA.values() for h in l}
    for nazwa, c in wyniki:
        m = c[..., 3] > 0
        obce = {tuple(p) for p in c[..., :3][m]} - paleta_ok
        alfy = sorted(set(np.unique(c[..., 3]).tolist()))
        print("   %-5s alfa %s, spoza palety: %d" % (nazwa, alfy, len(obce)))
        ok = ok and not obce
    print("   %s" % ("WSZYSTKO OK" if ok else "⚠ SA BLEDY"))

    if a.podglad:
        os.makedirs(a.podglad, exist_ok=True)
        przed = Image.fromarray(src, "RGBA")
        tlo = Image.new("RGBA", przed.size, (120, 150, 110, 255))
        tlo.alpha_composite(przed)
        tlo.resize((przed.width * 5, przed.height * 5), Image.NEAREST).save(
            os.path.join(a.podglad, "przed_kolo.png"))
        szer = sum(c.shape[1] for _, c in wyniki) + 16
        pas = Image.new("RGBA", (szer, 96), (120, 150, 110, 255))
        dx = 0
        for _, c in wyniki:
            pas.alpha_composite(Image.fromarray(c, "RGBA"), (dx, 0))
            dx += c.shape[1] + 16
        pas.resize((pas.width * 5, pas.height * 5), Image.NEAREST).save(
            os.path.join(a.podglad, "po_kolo.png"))
        print("   podglad -> %s" % a.podglad)

    if a.zapisz:
        szer = sum(c.shape[1] for _, c in wyniki)
        ark = np.zeros((96, szer, 4), np.uint8)
        dx = 0
        for _, c in wyniki:
            ark[:, dx:dx + c.shape[1]] = c
            dx += c.shape[1]
        Image.fromarray(ark, "RGBA").save(os.path.join(ASSETS, WYNIK))
        print("   zapisano -> public/assets/%s (%dx96)" % (WYNIK, szer))
    else:
        print("   (nic nie zapisano — dodaj --zapisz)")


if __name__ == "__main__":
    main()

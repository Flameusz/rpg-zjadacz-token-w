"""
Generator arkusza swini -> public/assets/pig.png

Uruchom:  python tools/build_swinia.py            (podglad + raport, NIC nie zapisuje)
          python tools/build_swinia.py --zapisz   (nadpisuje public/assets/pig.png)

**Ten arkusz NIE jest dzis wpiety w gre.** Zaden `Pig`/`Swinia` byt nie
istnieje w `src/` — to material przygotowany z wyprzedzeniem pod wioske
(`docs/swiat.md`), tym samym trybem co komplet budynkow (`build_budynki.py`
dawno ma oborę/kurnik/stajnię, zanim jest gdzie je postawic). Zeby wpiac:
ASSETS.pig w GameConfig (ten sam ksztalt co ASSETS.rabbit/ASSETS.boar) +
sliceCreatureSheet/placeholder w Assets.ts + createPigAnimations w
Animations.ts + nowa klasa NPC/zwierzecia w src/entities — patrz jak zrobiono
to dla krolika (tools/build_rabbit.py) i dzika (tools/build_dzik.py).

Ten sam komplet co u krolika/dzika: idle w dol/gore + 4-klatkowy chod +
4-klatkowy bieg w profilu (TROT, bez fazy lotu — jak dzik, nie jak skaczacy
krolik). Technika cieniowania identyczna (rampa 6-stopniowa z iloczynu
skalarnego normalnej elipsoidy ze swiatlem) — patrz build_rabbit.py po
szczegoly, tutaj tylko to, co odrozniz swinie od dzika:

* **Paleta `akcent_cieply`** (cieply brzoskwiniowo-rozowy), nie `ziemia` —
  ART_DIRECTION 3.3 wprost dopuszcza akcent jako PELNA rampe dla assetu,
  ktoremu ten odcien nalezy do tozsamosci (przyklad z dokumentu: "czerwony
  kapelusz"; tu — rozowa swinia). Najciemniejszy stopien (prawie bordowy)
  jest POMIJANY (`min_st=1`) — na swini czytal sie jak siniak, nie jak cien.
* **Uszy OPADAJACE, nie postawione.** Kierunek ucha w dol-do-przodu zamiast
  w gore (kat ~130-150 st. zamiast ~20-30 u dzika) — to jest GLOWNA cecha
  odrozniajaca sylwetke swini od dzika na pierwszy rzut oka, obok koloru.
* **Ryjek to TARCZA, nie zwezony pysk.** Plaski, okragly dysk na przedzie
  pyska z dwoma dziurkami nozdrzy — sygnaturowy ksztalt swini. Dzik ma
  wydluzony, zwezajacy sie ryj (patrz build_dzik.py); pomylenie tych dwoch
  ksztaltow to najszybszy sposob, zeby swinia wygladala jak dzik w innym
  kolorze.
* **Brak kłów, brak grzywy.** Oba naleza wylacznie do dzika.
* **Ogonek — ciasna spirala** (2 zwoje z przesuwanych o promien punktow), nie
  prosty kikut dzika.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 26
COLS = 4
ROWS = 3
OUT_PATH = os.path.join(ASSETS, "pig.png")

SWIATLO = (-0.45, -0.9)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
A = PAL["akcent_cieply"]  # 0 bordowy (pomijany) .. 4 jasny brzoskwiniowy — futro
K = PAL["kora"]           # kopytka, dziurki nozdrzy — ciemny, neutralny akcent
N = PAL["neutralne"]      # oko


def pusty():
    return np.zeros((T, T, 4), np.uint8)


def kladz(px, y, x, kolor, alfa=255):
    y, x = int(round(y)), int(round(x))
    if 0 <= y < px.shape[0] and 0 <= x < px.shape[1]:
        if alfa >= 255:
            px[y, x, :3] = kolor
            px[y, x, 3] = 255
        else:
            a = alfa / 255.0
            base = px[y, x]
            if base[3] == 0:
                px[y, x, :3] = kolor
                px[y, x, 3] = alfa
            else:
                px[y, x, :3] = (np.array(kolor) * a + base[:3] * (1 - a)).astype(np.uint8)
                px[y, x, 3] = max(base[3], alfa)


def prostokat(px, y0, y1, x0, x1, kolor, alfa=255):
    for y in range(int(round(y0)), int(round(y1))):
        for x in range(int(round(x0)), int(round(x1))):
            kladz(px, y, x, kolor, alfa)


def elipsa_cien(px, cy, cx, ry, rx, ramp, min_st=1, max_st=None):
    if max_st is None:
        max_st = len(ramp) - 1
    lx, ly = SWIATLO
    dl = (lx * lx + ly * ly) ** 0.5
    lx, ly = lx / dl, ly / dl
    y0, y1 = int(cy - ry - 1), int(cy + ry + 2)
    x0, x1 = int(cx - rx - 1), int(cx + rx + 2)
    for y in range(y0, y1):
        ny = (y - cy) / ry
        if abs(ny) > 1.06:
            continue
        for x in range(x0, x1):
            nx = (x - cx) / rx
            d2 = nx * nx + ny * ny
            if d2 > 1.0:
                continue
            nz = max(0.0, 1 - d2) ** 0.5
            ekspozycja = nx * (-lx) + ny * (-ly) * 0.55 + nz * 0.85
            st = min_st + int(round((ekspozycja + 1) / 2 * (max_st - min_st)))
            st = max(min_st, min(max_st, st))
            kladz(px, y, x, ramp[st])


def cien_kontaktowy(px, cy, cx, ry, rx, alfa=75):
    for y in range(int(cy - ry), int(cy + ry) + 1):
        ny = (y - cy) / ry
        if abs(ny) > 1:
            continue
        for x in range(int(cx - rx), int(cx + rx) + 1):
            nx = (x - cx) / rx
            if nx * nx + ny * ny <= 1:
                kladz(px, y, x, N[1], alfa=alfa)


def ucho_opadajace(px, cy, cx, dl, szer, kat_deg):
    """Opadajace ucho — ten sam odwrotnie-mapowany wypelniacz co u dzika/
    krolika (zero dziur), ale `kat_deg` mierzony od PIONU W DOL (nie w gore):
    dzik/krolik maja uszy postawione, swinia — opadajace do przodu. To jest
    GLOWNA rozroznialna cecha sylwetki na pierwszy rzut oka."""
    rad = np.radians(kat_deg)
    dy, dx = np.cos(rad), np.sin(rad)  # kierunek "w dol ucha"
    py, pxk = -dx, dy
    y0, y1 = int(cy - 2), int(cy + dl + 2)
    x0, x1 = int(cx - dl - 2), int(cx + dl + 2)
    for y in range(y0, y1):
        for x in range(x0, x1):
            ry, rx = y - cy, x - cx
            u = ry * dy + rx * dx
            if u < 0 or u > dl:
                continue
            v = ry * py + rx * pxk
            t = u / dl
            half = szer * (1 - 0.55 * t * t) / 2
            if abs(v) > half:
                continue
            brzeg = abs(v) > half - 0.9
            kladz(px, y, x, A[1] if brzeg else A[2])


def laba(px, y, x, w=3, h=2.6):
    prostokat(px, y, y + h, x, x + w, K[1])


def ryjek(px, cy, cx, r):
    """Tarcza ryjka + dwie dziurki nozdrzy — SYGNATUROWY ksztalt swini,
    odwrotnosc wydluzonego ryju dzika. Kolor z `kora`, NIE `akcent_cieply`:
    pierwsza wersja rysowala tarcze tym samym rozowym co reszta glowy i przy
    dwoch ciemnych dziurkach nozdrzy czytala sie jak DRUGA para oczu, nie jak
    plaski pysk. Wyrazny szaro-brazowy dysk usuwa te dwuznacznosc."""
    elipsa_cien(px, cy, cx, r, r * 1.2, K, min_st=2, max_st=4)
    kladz(px, cy, cx - r * 0.42, K[0])
    kladz(px, cy, cx + r * 0.42, K[0])


def ogonek(px, cy, cx):
    """Ciasna spirala — 2 zwoje, kazdy odsuniety o promien od poprzedniego.
    Ciemniejszy stopien (A[1]) i wiekszy promien niz pierwsza proba: przy
    A[2] (blisko tonu futra) i pojedynczych pikselach ogonek ginal w tulowiu
    zamiast czytac sie jak charakterystyczny kreconyl ogon."""
    pts = [
        (0, 0), (0, 1), (1, 1.6), (1.8, 1.2), (1.8, 0.2), (1, -0.4),
        (0.2, -0.2), (0.2, 0.6),
    ]
    for dy, dx in pts:
        kladz(px, cy + dy, cx + dx, A[1])


# ── SYLWETKA PRZODEM / TYLEM ─────────────────────────────────────────────

def klatka_idle(z_tylu):
    px = pusty()
    cien_kontaktowy(px, T - 0.9, T / 2, 0.9, 4.6)

    elipsa_cien(px, T * 0.64, T / 2, T * 0.27, T * 0.33, A)   # tulow — okragly
    elipsa_cien(px, T * 0.4, T / 2, T * 0.2, T * 0.19, A)     # glowa

    if not z_tylu:
        ryjek(px, T * 0.48, T / 2, T * 0.1)
        kladz(px, T * 0.32, T * 0.42, N[0])
        kladz(px, T * 0.32, T * 0.58, N[0])
    else:
        ogonek(px, T * 0.82, T / 2)

    # Uszy opadajace do przodu, po obu stronach glowy.
    ucho_opadajace(px, T * 0.28, T * 0.36, 5.5, 4.6, -35)
    ucho_opadajace(px, T * 0.28, T * 0.64, 5.5, 4.6, 35)

    laba(px, T * 0.85, T * 0.33)
    laba(px, T * 0.85, T * 0.6)
    return px


# ── SYLWETKA BOCZNA (chod / bieg — TROT) ─────────────────────────────────
FAZY = [
    (0.28, 0.88, 0.66, 0.82),
    (0.36, 0.80, 0.58, 0.90),
    (0.32, 0.88, 0.62, 0.86),
    (0.40, 0.90, 0.54, 0.80),
]


def klatka_bok(faza_i, biegowy):
    px = pusty()
    plx, ply, tlx, tly = FAZY[faza_i]
    rozc = 0.14 if biegowy else 0.0
    bob = (1 if faza_i % 2 == 0 else -1) * (1.4 if biegowy else 0.5)

    cien_kontaktowy(px, T - 0.7, T * 0.5, 0.8, 5.4)

    cy = T * 0.6 - bob * 0.1
    elipsa_cien(px, cy, T * 0.48, T * 0.21, T * (0.33 + rozc), A)
    hx = T * (0.77 + rozc * 0.1)
    hy = cy - T * 0.15
    elipsa_cien(px, hy, hx, T * 0.15, T * 0.14, A)
    ryjek(px, hy + T * 0.02, hx + T * 0.12, T * 0.06)
    kladz(px, hy - 1, hx - T * 0.02, N[0])

    ucho_opadajace(px, hy - T * 0.08, hx - T * 0.06, 4, 3.4, -60 + faza_i * 3)

    ogonek(px, cy + T * 0.02, T * 0.17)

    laba(px, T * ply, T * plx, w=3.2, h=2.6)
    laba(px, T * tly, T * tlx, w=3.4, h=2.8)
    return px


def zbuduj_arkusz():
    ark = np.zeros((T * ROWS, T * COLS, 4), np.uint8)

    def wklej(kafel, kol, wiersz):
        ark[wiersz * T:(wiersz + 1) * T, kol * T:(kol + 1) * T] = kafel

    wklej(klatka_idle(z_tylu=False), 0, 0)
    wklej(klatka_idle(z_tylu=True), 1, 0)
    for i in range(4):
        wklej(klatka_bok(i, biegowy=False), i, 1)
    for i in range(4):
        wklej(klatka_bok(i, biegowy=True), i, 2)
    return ark


def raport(ark):
    print("pig.png %dx%d (%d kolumn x %d wierszy, kafel %dpx)" %
          (ark.shape[1], ark.shape[0], COLS, ROWS, T))
    uzywane = [(0, 0, "idle-dol"), (1, 0, "idle-gora")]
    uzywane += [(i, 1, "chod %d" % i) for i in range(4)]
    uzywane += [(i, 2, "bieg %d" % i) for i in range(4)]
    ok = True
    for kol, wiersz, nazwa in uzywane:
        kafel = ark[wiersz * T:(wiersz + 1) * T, kol * T:(kol + 1) * T]
        krycie = int((kafel[..., 3] > 0).sum())
        stan = "OK" if krycie > 25 else "BLAD (prawie pusta klatka)"
        if krycie <= 25:
            ok = False
        print("  [%d,%d] %-10s krycie=%4dpx  %s" % (kol, wiersz, nazwa, krycie, stan))
    print("WYNIK:", "OK" if ok else "BLAD")
    return ok


def main(zapisz):
    ark = zbuduj_arkusz()
    ok = raport(ark)
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    if not ok:
        print("\nPrzerwano zapis — raport zglosil blad.")
        return
    Image.fromarray(ark, "RGBA").save(OUT_PATH)
    print("\n-> %s (NIEWPIETY w gre — patrz naglowek pliku)" % OUT_PATH)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Buduje pig.png. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true")
    args = ap.parse_args()
    main(args.zapisz)

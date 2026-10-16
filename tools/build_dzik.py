"""
Generator arkusza dzika -> public/assets/boar.png

Uruchom:  python tools/build_dzik.py            (podglad + raport, NIC nie zapisuje)
          python tools/build_dzik.py --zapisz   (nadpisuje public/assets/boar.png)

Zastepuje `makeBoarPlaceholder` (Assets.ts) — dzik byl jednym z czterech
przeciwnikow bez zadnego PNG-a, zawsze rysowanym proceduralnie w silniku
(CLAUDE.md: "the boar, wolf, Szary, spider... have no PNGs at all"). Ten
skrypt daje mu prawdziwy arkusz, tym samym kompletem co krolik
(tools/build_rabbit.py): idle w dol/gore + 4-klatkowy chod + 4-klatkowy bieg
w profilu. Uklad, technika cieniowania (rampa 6-stopniowa liczona z iloczynu
skalarnego normalnej elipsoidy ze swiatlem) i sposob mielenia lewej/prawej
strony (jeden widok boczny + setFlipX) sa identyczne — patrz komentarze w
build_rabbit.py po szczegoly, tutaj tylko to, co jest INNE.

── CO JEST INNE NIZ U KROLIKA ───────────────────────────────────────────
* **Czworonog, nie dwunog na dwoch tylnych labach.** Krolik siedzi/skacze;
  dzik CHODZI na czterech nogach. Cykl to prosty TROT (przod/tyl na przemian),
  bez fazy "lotu" — dzik nie odrywa sie od ziemi.
* **Ryj, nie pyszczek.** Wydluzona, splaszczona przednia czesc glowy,
  ciemniejsza koncowka (piatak).
* **Kly** — dwa jasne trojkaty przy pysku, widoczne tylko z przodu/boku.
* **Grzywa** — rzad ciemnych kolcow wzdluz grzbietu, od karku do polowy
  tulowia. To jedyna rzecz odrozniajaca sylwetke dzika od zwyklej "swini" na
  pierwszy rzut oka — patrz build_swinia.py, ktory NIE ma tego rzedu.
* **Paleta:** rampa `ziemia` (cieply braz, pasuje do starego placeholdera
  0x6b4a2f/0x7d5836) zamiast `neutralne` krolika; kly i oko z `neutralne`.

── ROZMIAR ────────────────────────────────────────────────────────────
28x28 (krolik: 24x24) — dzik ma byc WYRAZNIE wiekszy i ciezszy na ekranie;
przy `BOAR.scale=2.0` to ~56px, w okolicy starego placeholdera (30x24 @ 2.1
= 63x50) ale bardziej kwadratowy krok siatki (spojny z krolikiem = ten sam
kod tnacy w Assets.ts).
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 28
COLS = 4
ROWS = 3
OUT_PATH = os.path.join(ASSETS, "animals", "boar.png")

SWIATLO = (-0.45, -0.9)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
Z = PAL["ziemia"]        # 0 najciemniejszy .. 4 najjasniejszy — futro, uszy
K = PAL["kora"]          # grzywa — ciemniejsza, chlodniejsza niz futro
N = PAL["neutralne"]     # oko
P = PAL["piasek"]        # kly — cieply kremowy, NIE `neutralne` (za chlodny/szary
                          # obok braz'u, kly czytaly sie jak sztuczna szczeka)


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


def elipsa_cien(px, cy, cx, ry, rx, ramp, min_st=0, max_st=None):
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


def ucho(px, cy, cx, dl, szer, kat_deg, ciemne):
    """Male, zaokraglone ucho dzika — futro (`Z`), NIE grzywa (`K`): pierwsza
    wersja uzywala tej samej ciemnej rampy co kolce grzywy i przy podobnej
    dlugosci/kacie dwa rozne elementy (uszy + grzywa) czytaly sie jak jeden
    ciagly rzad rogow. Krotsze niz pierwsza proba (dl 5->3.5) i szersze u
    nasady wzgledem dlugosci, zeby sylwetka byla zaokraglona, nie spiczasta."""
    rad = np.radians(kat_deg)
    dy, dx = -np.cos(rad), np.sin(rad)
    py, pxk = -dx, dy
    y0, y1 = int(cy - dl - 2), int(cy + 2)
    x0, x1 = int(cx - dl - 2), int(cx + dl + 2)
    for y in range(y0, y1):
        for x in range(x0, x1):
            ry, rx = y - cy, x - cx
            u = ry * dy + rx * dx
            if u < 0 or u > dl:
                continue
            v = ry * py + rx * pxk
            t = u / dl
            half = szer * (1 - 0.6 * t * t) / 2  # t^2: zaokraglona koncowka, nie ostry szpic
            if abs(v) > half:
                continue
            brzeg = abs(v) > half - 0.9
            kolor = Z[1] if ciemne else (Z[1] if brzeg else Z[2])
            kladz(px, y, x, kolor)


def kiel(px, y, x, kier):
    """Jeden kiel — jasny trojkat wychodzacy z pyska w kierunku `kier` (+1/-1).
    Kremowy z `piasek`, NIE `neutralne`: pierwsza wersja (N[4], chlodny
    szaro-niebieski) na cieplym braz'owym pysku czytala sie jak sztuczna
    szczeka, nie jak kosc."""
    for i in range(3):
        for j in range(3 - i):
            kladz(px, y - i, x + kier * (i + j), P[4])
    kladz(px, y - 2, x, P[2])


def grzywa(px, y_grzbietu, x0, x1, gesto=2):
    """Rzad ciemnych kolcow wzdluz grzbietu — jedyny element odrozniajacy
    dzika od 'swini' na pierwszy rzut oka."""
    x = x0
    while x < x1:
        h = 2 if (int(x) % (gesto * 2)) < gesto else 3
        kladz(px, y_grzbietu, x, K[0])
        kladz(px, y_grzbietu - 1, x, K[1])
        if h == 3:
            kladz(px, y_grzbietu - 2, x, K[1])
        x += 1.6


def laba(px, y, x, w=3, h=3):
    prostokat(px, y, y + h, x, x + w, K[1])


def ogon(px, cy, cx):
    """Krotki, prosty ogonek — nie kreta spirala swini (patrz build_swinia.py)."""
    prostokat(px, cy - 1, cy + 1, cx, cx + 2, K[1])


# ── SYLWETKA PRZODEM / TYLEM ─────────────────────────────────────────────

def klatka_idle(z_tylu):
    px = pusty()
    cien_kontaktowy(px, T - 0.9, T / 2, 0.9, 4.6)

    # Tulow — niski, szeroki, ciezki.
    elipsa_cien(px, T * 0.64, T / 2, T * 0.26, T * 0.34, Z)
    # Glowa/ryj.
    elipsa_cien(px, T * 0.4, T / 2, T * 0.2, T * 0.19, Z)

    if not z_tylu:
        elipsa_cien(px, T * 0.5, T / 2, T * 0.09, T * 0.13, Z, min_st=0, max_st=2)  # ryj, ciemniejszy
        kladz(px, T * 0.5, T * 0.5, K[0])  # nozdrza (piatak)
        kiel(px, T * 0.56, T * 0.42, -1)
        kiel(px, T * 0.56, T * 0.58, 1)
        kladz(px, T * 0.34, T * 0.42, N[0])
        kladz(px, T * 0.34, T * 0.58, N[0])
    else:
        ogon(px, T * 0.8, T / 2 - 1)

    # Uszy WYZEJ i BARDZIEJ NA ZEWNATRZ niz grzywa (0.34/0.66 vs grzywa
    # 0.44-0.56) — dwie oddzielne strefy, zeby nie czytaly sie jak jeden
    # rzad kolcow (pierwsza proba: uszy i grzywa prawie w tym samym pasie x).
    ucho(px, T * 0.26, T * 0.34, 3.5, 4.4, -30, ciemne=z_tylu)
    ucho(px, T * 0.26, T * 0.66, 3.5, 4.4, 30, ciemne=z_tylu)
    grzywa(px, T * 0.2, T * 0.44, T * 0.56)

    laba(px, T * 0.84, T * 0.32)
    laba(px, T * 0.84, T * 0.58)
    return px


# ── SYLWETKA BOCZNA (chod / bieg — TROT, bez fazy lotu) ─────────────────
FAZY = [
    # (przod_x, przod_y, tyl_x, tyl_y)
    (0.28, 0.88, 0.66, 0.82),
    (0.36, 0.80, 0.58, 0.90),
    (0.32, 0.88, 0.62, 0.86),
    (0.40, 0.90, 0.54, 0.80),
]


def klatka_bok(faza_i, biegowy):
    px = pusty()
    plx, ply, tlx, tly = FAZY[faza_i]
    rozc = 0.16 if biegowy else 0.0
    bob = (1 if faza_i % 2 == 0 else -1) * (1.6 if biegowy else 0.6)

    cien_kontaktowy(px, T - 0.7, T * 0.5, 0.8, 5.5)

    cy = T * 0.6 - bob * 0.1
    elipsa_cien(px, cy, T * 0.48, T * 0.2, T * (0.32 + rozc), Z)
    hx = T * (0.78 + rozc * 0.1)
    hy = cy - T * 0.14
    elipsa_cien(px, hy, hx, T * 0.15, T * 0.14, Z)
    # Ryj wysuniety do przodu.
    elipsa_cien(px, hy + T * 0.03, hx + T * 0.1, T * 0.06, T * 0.1, Z, min_st=0, max_st=2)
    kladz(px, hy + T * 0.03, hx + T * 0.19, K[0])
    kiel(px, hy + T * 0.07, hx + T * 0.16, 1)

    ucho(px, hy - T * 0.09, hx - T * 0.04, 3.2, 3.6, 4 + faza_i * 2, ciemne=False)
    kladz(px, hy - 1, hx - T * 0.02, N[0])

    grzywa(px, cy - T * 0.19, T * 0.32, hx - T * 0.02, gesto=2)
    ogon(px, cy + T * 0.02, T * 0.16)

    laba(px, T * ply, T * plx, w=3.4, h=2.6)
    laba(px, T * tly, T * tlx, w=3.6, h=2.8)
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
    print("boar.png %dx%d (%d kolumn x %d wierszy, kafel %dpx)" %
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
    print("\n-> %s" % OUT_PATH)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Buduje boar.png. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true")
    args = ap.parse_args()
    main(args.zapisz)

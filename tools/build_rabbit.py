"""
Generator kroliczego arkusza animacji -> public/assets/rabbit.png

Uruchom:  python tools/build_rabbit.py            (podglad + raport, NIC nie zapisuje)
          python tools/build_rabbit.py --zapisz   (nadpisuje public/assets/rabbit.png)

Zastepuje stary rabbit.png (3 statyczne portrety, patrz historia projektu) —
krolik byl jedynym z piecior potworow bez zadnej animacji ruchu (CLAUDE.md,
sekcja "Rabbit directional walk spritesheet"). Ten skrypt daje mu:

  * idle w dol / idle w gore (widok z przodu i z tylu, siedzacy),
  * 4-klatkowy cykl CHODU (widok z boku, patrzy w prawo),
  * 4-klatkowy cykl BIEGU (jak wyzej, nizej przy ziemi, wieksza amplituda).

Lewa/prawa strona NIE sa osobnymi klatkami — silnik juz odbija sprite'y
przez `setFlipX` (Enemy.updateChase/patrol robily to od poczatku, mimo ze
dotychczasowa pojedyncza twarz i tak wygladala identycznie odbita). Jeden
widok boczny + odbicie to polowa mniej klatek do narysowania i zero ryzyka,
ze lewa i prawa strona kiedys sie rozjada.

── PALETA ────────────────────────────────────────────────────────────────
Zero nowych kolorow: `docs/paleta.json`, rampy `neutralne` (futro, biel->szarosc)
i `akcent_cieply` (nos, wnetrze ucha — swiadomy akcent, patrz ART_DIRECTION.md
3.3/4.2). Bez czarnego obrysu (4.4): krawedz idzie o jeden stopien rampy w dol,
nie w czern. Cieniowanie kazdej bryly (tulow/glowa) to prawdziwa rampa 6-stopniowa
liczona z iloczynu skalarnego normalnej elipsoidy ze swiatlem gora-lekko-z-lewej
(ta sama technika co `zamek()` w build_budynki.py — tarcza kula, nie plaskie kolo).

── DLACZEGO 24x24, NIE 32x32 ────────────────────────────────────────────
Kafel 32x32 to zasada SIATKI TERENU (ART_DIRECTION 4.1) — postacie i stworzenia
juz dzis lamia ja swiadomie (Character.png: 31x60, boar/wolf: 30x24..38x27).
Krolik jest najmniejszym stworem na mapie; 24x24 (docelowo ~38px na ekranie po
RABBIT.scale=1.6) trzyma go widocznie mniejszym od dzika i wilka.

── UKLAD ARKUSZA ────────────────────────────────────────────────────────
4 kolumny x 3 wiersze, kafel 24x24, ZERO przerwy (jak items.png — arkusz sam
generujemy, nie ma ryzyka "sasiad wciagniety przez filtrowanie" ktore
uzasadnia 33px skok w Teren/Nature).

  wiersz 0: [idle-dol] [idle-gora] [.] [.]
  wiersz 1: chod klatki 0..3 (bok, w prawo)
  wiersz 2: bieg klatki 0..3 (bok, w prawo)

Indeks klatki (Phaser, frame = wiersz*4 + kolumna) czytany jest z tego samego
wzoru w ASSETS.rabbit / Assets.sliceRabbit — zmiana liczby kolumn tutaj musi
isc w parze ze zmiana `cols` tam.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 24          # kafel (px)
COLS = 4
ROWS = 3
OUT_PATH = os.path.join(ASSETS, "animals", "rabbit.png")


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
N = PAL["neutralne"]         # 0 najciemniejszy .. 5 najjasniejszy
A = PAL["akcent_cieply"]     # 0 najciemniejszy .. 4 najjasniejszy

SWIATLO = (-0.45, -0.9)      # (x,y) KIERUNEK DO zrodla swiatla — gora, lekko z lewej


def pusty():
    return np.zeros((T, T, 4), np.uint8)


def kladz(px, y, x, kolor, alfa=255):
    y, x = int(round(y)), int(round(x))
    if 0 <= y < px.shape[0] and 0 <= x < px.shape[1]:
        # Alpha-blend zamiast nadpisania — kontaktowy cien (alfa<255) ma
        # przycmic to, co jest pod spodem, a nie wyciac dziure w futrze.
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


def elipsa_cien(px, cy, cx, ry, rx, ramp=N, min_st=0, max_st=None, przesun_swiatla=(0, 0)):
    """Wypelnia elipse (srodek cy,cx; promienie ry,rx) prawdziwa rampa —
    stopien liczony z przyblizonej normalnej elipsoidy razy kierunek
    swiatla, nie z odleglosci od srodka (odleglosc dalaby plaskie kolko,
    nie kule — dokladnie wada ktora ART_DIRECTION.md zarzuca Nature.png:
    "brak kierunku swiatla").
    """
    if max_st is None:
        max_st = len(ramp) - 1
    lx, ly = SWIATLO[0] + przesun_swiatla[0], SWIATLO[1] + przesun_swiatla[1]
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


def cien_kontaktowy(px, cy, cx, ry, rx, alfa=70):
    """Owal cienia pod stworem — bez niego wyglada jak zawieszony (ART_DIRECTION 4.3).

    Ma zostac SUBTELNY: pierwsza wersja byla niemal tak szeroka jak tulow i na
    podglade 8x czytala sie jak trzecia, plaska lapa zamiast cienia.
    """
    for y in range(int(cy - ry), int(cy + ry) + 1):
        ny = (y - cy) / ry
        if abs(ny) > 1:
            continue
        for x in range(int(cx - rx), int(cx + rx) + 1):
            nx = (x - cx) / rx
            if nx * nx + ny * ny <= 1:
                kladz(px, y, x, N[1], alfa=alfa)


def ucho(px, cy, cx, dl, szer, kat_deg, widok_z_tylu):
    """Jedno ucho jako zwezajacy sie czworokat, obrocony o `kat_deg` (0 =
    pionowo w gore). Wypelniane PRZEZ ODWROTNE PRZEKSZTALCENIE — dla kazdego
    piksela w otoczeniu liczymy jego wspolrzedne (u wzdluz ucha, v w poprzek)
    i testujemy, czy siedzi w srodku. Pierwsza wersja robila to na odwrot
    (szla PO parametrze t i stawiala piksele wzdluz obliczonych xy), co przy
    ulamkowych krokach zostawialo dziury — ucho wyszlo jako przerywana
    "cukierkowa" kreska zamiast litego ksztaltu.

    Widok z przodu: rant futra (N[3]) na brzegach + rozowe wnetrze (A[3]/A[2]).
    Widok z tylu / w biegu (uszy odchylone): samo futro, ciemniejsze ku koncowce.
    """
    rad = np.radians(kat_deg)
    dy, dx = -np.cos(rad), np.sin(rad)  # kierunek "w gore ucha" po obrocie
    py, pxk = -dx, dy                   # prostopadly kierunek (szerokosc)
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
            half = szer * (1 - 0.35 * t) / 2
            if abs(v) > half:
                continue
            if widok_z_tylu:
                kolor = N[2] if t > 0.55 else N[3]
            else:
                brzeg = abs(v) > half - 1.0
                kolor = N[3] if brzeg else (A[3] if t < 0.75 else A[2])
            kladz(px, y, x, kolor)


def laba(px, y, x, w=2, h=2, ciemna=False):
    prostokat(px, y, y + h, x, x + w, N[2] if ciemna else N[3])


def ogon(px, cy, cx, r):
    # Puszek zawsze jasny (gorne 2 stopnie rampy) — ma czytac sie jako biala
    # kita, nie jako trzecia lapa tego samego odcienia co reszta futra.
    elipsa_cien(px, cy, cx, r, r, N, min_st=4, max_st=5)


# ── SYLWETKA PRZODEM / TYLEM (siedzacy, idle) ───────────────────────────────

def klatka_idle(z_tylu):
    px = pusty()
    cien_kontaktowy(px, T - 2.6, T / 2, 1.5, 4.2)

    # Tulow (siedzacy) — szeroki u dolu, wezszy u gory.
    elipsa_cien(px, T * 0.66, T / 2, T * 0.28, T * 0.30, N)
    # Glowa.
    elipsa_cien(px, T * 0.36, T / 2, T * 0.22, T * 0.21, N)

    # Uszy — rozstawione, lekko na zewnatrz. Baza i dlugosc dobrane tak, zeby
    # koncowka zostala W kadrze (dl=9 od cy=0.2T wychodzilo ponad y=0 —
    # ucho bylo scinane u samej gory na kazdej klatce idle).
    ucho(px, T * 0.27, T * 0.42, 5.6, 3.4, -16, z_tylu)
    ucho(px, T * 0.27, T * 0.58, 5.6, 3.4, 16, z_tylu)

    if z_tylu:
        # Puszysty ogonek, widoczny nad tylnymi lapkami.
        ogon(px, T * 0.86, T / 2, 3)
    else:
        # Oczy + nosek — tylko od przodu.
        kladz(px, T * 0.38, T * 0.44, N[0])
        kladz(px, T * 0.38, T * 0.56, N[0])
        kladz(px, T * 0.46, T / 2, A[1])

    # Przednie/tylne lapki wystajace spod tulowia, rozsuniete zeby nie zlaly
    # sie w jeden prostokat.
    laba(px, T * 0.85, T * 0.34, ciemna=True)
    laba(px, T * 0.85, T * 0.62, ciemna=True)
    return px


# ── SYLWETKA BOCZNA (chod / bieg) — patrzy w prawo ──────────────────────────
#
# 4 fazy klasycznego skoku krolika: przysiad -> odbicie -> lot -> ladowanie.
# Bieg uzywa TEJ SAMEJ funkcji z wiekszym rozciagnieciem i uszami zaczesanymi
# do tylu (ten sam jezyk co ENEMY_MOTION: "ears trailing" = predkosc), zamiast
# osobnego kompletu klatek — inaczej chod i bieg zaczna sie z czasem rozjezdzac.
FAZY = [
    # (unos_ciala, rozciagniecie, przod_lapa_x, przod_lapa_y, tyl_lapa_x, tyl_lapa_y)
    (0.0, 0.0, 0.30, 0.90, 0.62, 0.90),   # przysiad / kontakt
    (0.35, 0.15, 0.42, 0.88, 0.52, 0.78),  # odbicie
    (0.9, 0.35, 0.58, 0.70, 0.40, 0.66),   # lot / rozciagniecie
    (0.25, 0.1, 0.30, 0.86, 0.70, 0.80),   # ladowanie
]


def klatka_bok(faza_i, biegowy):
    px = pusty()
    unos, rozc, plx, ply, tlx, tly = FAZY[faza_i]
    mnoznik = 1.7 if biegowy else 1.0
    unos *= mnoznik * T * 0.12
    rozc *= mnoznik

    cien_kontaktowy(px, T - 2.2, T * 0.5, 1.3, 4.5 - rozc * 1.5)

    cy = T * 0.62 - unos
    # Tulow rozciagniety poziomo proporcjonalnie do fazy lotu.
    elipsa_cien(px, cy, T * 0.46, T * 0.19, T * (0.30 + rozc * 0.16))
    # Glowa na przedzie (w prawo).
    hx = T * (0.74 + rozc * 0.06)
    hy = cy - T * 0.16 - unos * 0.2
    elipsa_cien(px, hy, hx, T * 0.16, T * 0.155)

    # Ucho: w chodzie prawie pionowo, w biegu zaczesane do tylu (predkosc —
    # ten sam jezyk co "ears trailing" w ENEMY_MOTION). Krotsze niz w idle,
    # bo tu startuje wyzej (glowa unosi sie z cialem w fazie lotu) i przy
    # dl=8 koncowka wychodzila nad gorna krawedz kadru w fazie "lot".
    kat = (35 if biegowy else 6) + faza_i * (4 if biegowy else 2)
    ucho(px, hy - T * 0.08, hx - T * 0.03, 5, 2.6, kat, False)

    # Oko + nosek na profilu.
    kladz(px, hy - 1, hx + T * 0.09, N[0])
    kladz(px, hy + 1, hx + T * 0.145, A[1])

    # Ogonek z tylu tulowia — jasniejszy stopien rampy niz lapy, zeby dwa
    # szare ksztalty pod/za tulowiem nie zlewaly sie w jeden.
    ogon(px, cy - T * 0.02, T * (0.14 - rozc * 0.08), 2.2)

    # Lapy — przednia (w kierunku ruchu) i tylna, wysokosc = ply/tly (0=gora,1=dol).
    laba(px, T * ply - unos * 0.3, T * plx, w=3, h=2.4, ciemna=True)
    laba(px, T * tly - unos * 0.3, T * tlx, w=3.4, h=2.6, ciemna=True)
    return px


def zbuduj_arkusz():
    ark = np.zeros((T * ROWS, T * COLS, 4), np.uint8)

    def wklej(kafel, kol, wiersz):
        ark[wiersz * T:(wiersz + 1) * T, kol * T:(kol + 1) * T] = kafel

    wklej(klatka_idle(z_tylu=False), 0, 0)
    wklej(klatka_idle(z_tylu=True), 1, 0)
    # kolumny 2,3 wiersza 0 zostaja przezroczyste — niewykorzystane przez ASSETS.rabbit

    for i in range(4):
        wklej(klatka_bok(i, biegowy=False), i, 1)
    for i in range(4):
        wklej(klatka_bok(i, biegowy=True), i, 2)

    return ark


def raport(ark):
    print("rabbit.png %dx%d (%d kolumn x %d wierszy, kafel %dpx)" %
          (ark.shape[1], ark.shape[0], COLS, ROWS, T))
    uzywane = [(0, 0, "idle-dol"), (1, 0, "idle-gora")]
    uzywane += [(i, 1, "chod %d" % i) for i in range(4)]
    uzywane += [(i, 2, "bieg %d" % i) for i in range(4)]
    ok = True
    for kol, wiersz, nazwa in uzywane:
        kafel = ark[wiersz * T:(wiersz + 1) * T, kol * T:(kol + 1) * T]
        krycie = int((kafel[..., 3] > 0).sum())
        stan = "OK" if krycie > 20 else "BLAD (prawie pusta klatka)"
        if krycie <= 20:
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
    ap = argparse.ArgumentParser(description="Buduje rabbit.png. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true")
    args = ap.parse_args()
    main(args.zapisz)

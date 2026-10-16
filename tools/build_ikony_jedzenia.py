"""
Ikony jedzenia (chleb / jajko / ser) -> public/assets/icon_<nazwa>.png, 32x32.

Uruchom:  python tools/build_ikony_jedzenia.py                 (raport, NIC nie zapisuje)
          python tools/build_ikony_jedzenia.py --zapisz
          python tools/build_ikony_jedzenia.py --podglad KAT    (powiekszone podglady)

── PO CO OSOBNY GENERATOR, A NIE snap_paleta.py ──────────────────────────
Bo to sa IKONY, a nie rekwizyty stojace na mapie — i ta roznica jest
zmierzona, nie wyczuta (patrz naglowek `snap_paleta.py`, sekcja
"SPRAWDZONE I ODRZUCONE"): `items.png`, zrodlo 19 z 20 ikon w grze, ma
sredni dystans **31,4** do `docs/paleta.json`, a 48% jego pikseli lezy
dalej niz 30. Ikona ma pasowac do plecaka, nie do trawy. Chleb
przepuszczony przez snap wyszedl blotnisty i zostal cofniety.

── CO ZNACZY "nasz styl" DLA IKONY — ZMIERZONE NA items.png ──────────────
Przejrzane wszystkie 16 ikon uzywanych dzis w grze:
  - liczba kolorow: **3-6** dla sprzetu (pierscienie 3, zbroje 4-6);
    9-11 maja tylko cztery ikony wariantow ataku, ktore sa rysunkami
    technicznymi, nie przedmiotami
  - tresc: **20-30 px** w kaflu 32x32, nigdy do samej krawedzi
  - wypelnienie kafla: 14-58%

Zrodla od autora trafiaja w to bardzo nierowno:
  - `egg.png`     160x160,   6 kolorow  -> juz w stylu
  - `bread.png`   160x160,   7 kolorow  -> juz w stylu
  - `Cheese.png`  150x150, **337** kolorow -> gradient z antyaliasingiem,
    czyli jedyna pozycja realnie odstajaca

── DLACZEGO WSPOLNY GENERATOR, A NIE POPRAWKA SAMEGO SERA ────────────────
Trzy ikony jednego sprzedawcy maja czytac sie jako komplet. Zrodla maja
rozne kadry (150 vs 160 px) i rozna wielkosc tresci (100-140 px), wiec
przepuszczone kazde osobno przez "przeskaluj do 32" wyszlyby w ROZNEJ
skali na ekranie — jajko o jedna trzecia mniejsze od chleba, bez powodu.
Ten skrypt normalizuje wszystkie trzy do tej samej docelowej wielkosci
tresci (`_TRESC`), wiec komplet jest komplet.

⚠ **Redukcja idzie BOX (srednia z obszaru), nie NEAREST.** Przy chlebie
i jajku roznica jest zadna (wielkie plaskie bloki), ale ser jest gladkim
gradientem — NEAREST wybralby z niego pojedyncze piksele i dostalibysmy
szum zamiast plaskich pol. Po skalowaniu i tak nastepuje kwantyzacja, wiec
rozmycie z BOX-a jest tymczasowe i nie zostaje w wyniku.
"""

import argparse
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))

KAFEL = 32
# Docelowy najdluzszy bok tresci wewnatrz kafla. 26 miesci sie w zmierzonym
# pasmie 20-30 z items.png i zostawia po 3 px marginesu — zadna ikona w tej
# grze nie dotyka krawedzi kafla.
_TRESC = 26
# Pojedyncze jajko w gniezdzie trzech — patrz `_gniazdo`. Mniejsze niz
# `_TRESC`, bo trzy sztuki i tak zapelnia kafel, a jajko wielkosci bochenka
# bylo jednym z powodow, dla ktorych poprzednia wersja czytala sie zle.
_JEDNO_JAJKO = 15

# nazwa wyjsciowa -> (plik zrodlowy, ile kolorow)
#
# Liczby kolorow sa dobrane pod ZMIERZONE pasmo 3-6 z items.png, a nie pod
# to, ile przypadkiem mialo zrodlo. Ser dostaje 6 (najbardziej zlozona
# bryla: bok, wierzch, dziury, kontur), jajko 5 (gladka skorupka), chleb 6
# (skorka, miekisz, spod, kontur).
CELE = {
    "bread": ("bread.png", 6),
    "egg": ("egg.png", 5),
    "cheese": ("Cheese.png", 6),
}


def _przytnij(im):
    a = np.array(im)
    ys, xs = np.nonzero(a[..., 3] > 10)
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def _kontur(im, kolor=(0, 0, 0)):
    """Nadpisz zewnetrzny 1 px sylwetki twardym konturem.

    ⚠ **To jest jedyna rzecz, ktora te trzy ikony realnie "przerabia", i
    jest zmierzona, nie wyczuta.** Wszystkie 16 ikon uzywanych dzis w grze
    ma kontur czystego `#000000` zajmujacy 13-31% tresci (sprawdzone na
    hammer / leather_chest / steel_helmet). Zrodla od autora nie maja tego
    ani jedno: chleb ma najciemniejszy ton #3f2e0e (jasnosc 47), jajko
    #554e3b (78), a ser #5d341a wystepujacy w **jednym pikselu**, czyli
    faktycznie zaden. Bez tego kroku trzy ikony jedzenia lezalyby w plecaku
    jako jedyne bez obwodki.

    Piksel nalezy do konturu, gdy jest nieprzezroczysty i ma co najmniej
    jednego przezroczystego sasiada w 4-sasiedztwie.
    """
    a = np.array(im)
    peln = a[..., 3] > 128
    p = np.pad(peln, 1, constant_values=False)
    wnetrze = p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
    ring = peln & ~wnetrze
    a[ring, 0], a[ring, 1], a[ring, 2] = kolor
    a[ring, 3] = 255
    return Image.fromarray(a, "RGBA")


# Ciepla rampa skorupki, zastepujaca oliwkowa ze zrodla.
#
# ⚠ Zrodlowe `egg.png` ma cien #7b7154 — zielonkawo-szary, i to jest polowa
# powodu, dla ktorego jajko "wygladalo jak z Minecrafta" (druga polowa to
# jeden wielki blob, patrz `_gniazdo`). Prawdziwa skorupka jest ciepla:
# wiecej czerwieni, mniej zieleni przy tej samej jasnosci.
_SKORUPKA = [(242, 230, 200), (220, 201, 160), (166, 143, 104)]


def _rysuj_jajko(w, h):
    """Narysuj jedno jajko od zera zamiast wyprowadzac je ze zrodla.

    ⚠ **Swiadoma zmiana metody, nie skrot.** Pierwsza wersja brala 160 px
    zrodlo i przepuszczala je przez BOX -> kwantyzacje -> remapowanie rang
    jasnosci. Trzy stratne kroki na 15 px bryle daly cieniowanie ODWROCONE
    (srodek ciemny, brzeg jasny), wiec trzy jajka czytaly sie jak miseczki.
    Przy tej wielkosci jajko to owal z jednym swiatlem i jednym cieniem —
    taniej i pewniej to narysowac, niz odzyskiwac z downscalu.

    To ten sam wybor, ktory projekt zrobil juz przy `build_rabbit.py`
    i rodzenstwie: male stworzenia sa rysowane, nie skalowane.
    """
    a = np.zeros((h, w, 4), np.uint8)
    cx, cy = (w - 1) / 2.0, (h - 1) / 2.0
    for y in range(h):
        for x in range(w):
            # Owal wezszy u gory — to odroznia jajko od kuli.
            ny = (y - cy) / (h / 2.0)
            zwez = 1.0 - 0.18 * (-ny if ny < 0 else 0.0) * 2.0
            nx = (x - cx) / (w / 2.0 * zwez)
            if nx * nx + ny * ny > 1.0:
                continue
            # Swiatlo z gory-lewej, cien w prawym dole.
            d = (nx * 0.72 + ny * 0.72)
            ton = _SKORUPKA[0] if d < -0.34 else (_SKORUPKA[1] if d < 0.42 else _SKORUPKA[2])
            a[y, x, 0], a[y, x, 1], a[y, x, 2], a[y, x, 3] = ton[0], ton[1], ton[2], 255
    return _kontur(Image.fromarray(a, "RGBA"))


def _ocieplij(im):
    """Przemapuj tony skorupki na `_SKORUPKA`, zachowujac kolejnosc jasnosci.

    Nie snapuje po najblizszym sasiedzie (to wlasnie utrwalilo by oliwke),
    tylko po RANDZE jasnosci: najciemniejszy ton zrodla -> najciemniejszy
    docelowy, i tak dalej. Dzieki temu rysunek zostaje, zmienia sie tylko
    temperatura.
    """
    a = np.array(im)
    m = a[..., 3] > 128
    if not m.any():
        return im
    px = a[..., :3][m]
    tony = sorted({tuple(p) for p in px}, key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])
    if not tony:
        return im
    for i, t in enumerate(tony):
        # rozciagnij range zrodla na range docelowa
        j = round(i * (len(_SKORUPKA) - 1) / max(1, len(tony) - 1))
        sel = m & np.all(a[..., :3] == np.array(t), axis=-1)
        a[sel, 0], a[sel, 1], a[sel, 2] = _SKORUPKA[j]
    return Image.fromarray(a, "RGBA")


def _gniazdo(jajko, docelowy):
    """Zloz TRZY male jajka zamiast jednego wielkiego.

    ⚠ Powod jest podwojny i oba sa konkretne. Po pierwsze przedmiot nazywa
    sie **"Jajka"**, liczba mnoga, a ikona pokazywala jedno. Po drugie
    pojedynczy jasny owal wypelniajacy caly kafel to dokladnie sylwetka
    jajka z Minecrafta — zglosil to autor i mial racje; przy trzech
    mniejszych bryla przestaje byc "blob", a jajko odzyskuje skale (nie jest
    juz wielkosci bochenka obok).
    """
    # Jajko przychodzi juz z wlasnym konturem (`_rysuj_jajko`) — kazde musi
    # go miec PRZED zlozeniem, inaczej trzy bryly zlalyby sie w jedna chmure
    # i cale rozwiazanie nic by nie dalo.
    w, h = jajko.size
    male = jajko
    plotno = Image.new("RGBA", (docelowy, docelowy), (0, 0, 0, 0))
    # tylne jajko wyzej i posrodku, dwa przednie nizej po bokach
    poz = [
        ((docelowy - w) // 2, 0),
        (0, docelowy - h),
        (docelowy - w, docelowy - h),
    ]
    for x, y in poz:
        plotno.alpha_composite(male, (x, y))
    return _przytnij(plotno)


def _kwantyzuj(im, ile):
    """Redukcja liczby kolorow na NIEPRZEZROCZYSTYCH pikselach.

    Alfa jest wyciagana i przywracana osobno, bo `Image.quantize` liczylaby
    przezroczyste tlo jako pelnoprawny kolor i zjadlo by jeden ze stopni.
    Prog 128 daje twarda krawedz — ikony w tej grze nie maja pol-alfy.
    """
    a = np.array(im)
    alpha = (a[..., 3] > 128).astype(np.uint8) * 255
    rgb = Image.fromarray(a[..., :3], "RGB")
    q = rgb.quantize(colors=ile, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    out = np.dstack([np.array(q), alpha])
    out[alpha == 0] = 0
    return Image.fromarray(out, "RGBA")


def zbuduj(nazwa):
    plik, ile = CELE[nazwa]

    if nazwa == "egg":
        # ⚠ **Jajko jako JEDYNE nie pochodzi ze zrodla — jest rysowane.**
        # `egg.png` zostaje na dysku jako materia wyjsciowa i punkt
        # odniesienia, ale nie jest tu wczytywany: patrz `_rysuj_jajko`
        # po powod (przepychanie 160 px przez BOX + kwantyzacje dawalo
        # odwrocone cieniowanie na 15 px brylce).
        maly = _gniazdo(_rysuj_jajko(13, 15), _TRESC)
        przed_kol = None
    else:
        src = Image.open(os.path.join(ASSETS, plik)).convert("RGBA")
        przed_kol = len({tuple(p) for p in np.array(src).reshape(-1, 4) if p[3] > 10})
        ciasny = _przytnij(src)
        # Wpisz tresc w _TRESC zachowujac proporcje. BOX, nie NEAREST —
        # patrz naglowek.
        w, h = ciasny.size
        s = _TRESC / max(w, h)
        maly = ciasny.resize((max(1, round(w * s)), max(1, round(h * s))), Image.BOX)
        # Kolejnosc jest nosna: najpierw kwantyzacja WNETRZA do ile-1 stopni,
        # kontur dopiero na koncu. Odwrotnie median-cut zlozylby czern razem z
        # najciemniejszym tonem wnetrza i obwodka zniknelaby tam, gdzie jest
        # najciensza — ta sama pulapka "znika cala kategoria koloru", ktora
        # `snap_paleta.py` opisuje przy siwiznie i kwiecie lilii.
        maly = _kwantyzuj(maly, max(2, ile - 1))
        maly = _kontur(maly)

    nw, nh = maly.size

    # Wysrodkuj w kaflu; przy nieparzystej roznicy zaokraglenie w DOL, zeby
    # ikona siedziala raczej wyzej niz nizej — dolna krawedz kafla sasiaduje
    # z liczba sztuk w plecaku.
    plotno = Image.new("RGBA", (KAFEL, KAFEL), (0, 0, 0, 0))
    plotno.alpha_composite(maly, ((KAFEL - nw) // 2, (KAFEL - nh) // 2))

    a = np.array(plotno)
    po_kol = len({tuple(p) for p in a.reshape(-1, 4) if p[3] > 10})
    wyp = 100 * (a[..., 3] > 10).sum() / (KAFEL * KAFEL)
    return plotno, przed_kol, po_kol, (nw, nh), wyp


def main(zapisz, podglad):
    print("cel: 3-6 kolorow, tresc %d px, margines >=3 px (zmierzone na items.png)\n" % _TRESC)
    for nazwa in CELE:
        img, przed, po, rozmiar, wyp = zbuduj(nazwa)
        ostrz = "" if 3 <= po <= 6 else "  <-- POZA pasmem 3-6!"
        skad = "%3d -> %d" % (przed, po) if przed is not None else "rysowane -> %d" % po
        print("%-7s %-12s kolorow %-14s %s  tresc %dx%d   wypelnienie %.0f%%"
              % (nazwa, CELE[nazwa][0], skad, ostrz or "  ", rozmiar[0], rozmiar[1], wyp))
        if podglad:
            os.makedirs(podglad, exist_ok=True)
            img.resize((KAFEL * 8, KAFEL * 8), Image.NEAREST).save(
                os.path.join(podglad, "icon_%s.png" % nazwa))
        if zapisz:
            img.save(os.path.join(ASSETS, "items", "icon_%s.png" % nazwa))
    if zapisz:
        print("\nZapisano icon_*.png do %s" % ASSETS)
    else:
        print("\nNic nie zapisano — uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    a = ap.parse_args()
    main(a.zapisz, a.podglad)

"""
Przymiar: czy kandydat na kafel (PNG z generatora AI) nadaje sie na baze
pod dalszy generator modularnych kafli.

Uruchom:  python tools/sprawdz_kafel.py d1.png d2.png       (raport, nic nie zapisuje)
          python tools/sprawdz_kafel.py d2.png --podglad KAT (dodatkowo podglad 3x3)

Pliki podaje sie po nazwie z `public/assets/` albo pelna sciezka.

── PO CO TO ISTNIEJE ─────────────────────────────────────────────────────
Zanim kandydat na kafel (np. `d1.png`/`d2.png`, strzecha z GPT image) trafi
do generatora, ktory zbuduje z niego sciany/naroznik/kalenice tak jak
`build_budynki.py` robi to dzis, trzy rzeczy musza byc prawda: siatka
pasuje do reszty projektu (32px), kafel kafluje sie BEZ SZWU, alfa jest
plaska (255) tam gdzie material ma byc nieprzezroczysty. Zlamanie
ktorejkolwiek nie jest widoczne na pojedynczym kaflu — dokladnie tak jak
szwy fazowe strzechy w `Buildings.png` (patrz CLAUDE.md), zawsze zlapane
dopiero na zlozonym budynku, nigdy w raporcie. Ten skrypt liczy to
wczesniej, na jednym kaflu, zanim czas pojdzie w generator zbudowany na
wadliwej bazie.

── SKAD PROGI SZWU ───────────────────────────────────────────────────────
Zmierzone na PRAWDZIWYCH, dzialajacych kaflach z `Teren.png` (kafle trawy,
ktore Tiled juz kaflowal bez szwu na mapie) — euklidesowy dystans RGB
miedzy przeciwleglymi krawedziami wychodzi 0–8.7. Std kandydatow (d1/d2)
wychodzi 15–42 z widocznym zlamaniem rytmu na podgladzie 3x3. Stad:
OK <10, UWAGA 10-25, ZLY >25 — nie z sufitu, z porownania z czyms co juz
dziala.

── DLACZEGO ZAWSZE PODGLAD 3x3, NIE TYLKO LICZBY ─────────────────────────
Bo "Look at the map, don't just read the report" (CLAUDE.md) dotyczy tu
tak samo: liczba mowi o srednim dystansie na krawedzi, nie o tym, czy
przesuniecie fazy pod kaflem WYGLADA jak zlamanie rytmu. `--podglad`
zapisuje kompozyt do podanego katalogu (nigdy do public/assets — patrz
`Working conventions` w CLAUDE.md: to sa obrazki robocze, nie zasoby gry).
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
PALETA_KOLORY = [
    (rampa, tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)))
    for rampa, hexy in PALETA.items()
    for h in hexy
]

PROG_OK, PROG_UWAGA = 10.0, 25.0


def znajdz(nazwa):
    if os.path.isfile(nazwa):
        return nazwa
    kand = os.path.join(ASSETS, nazwa)
    if os.path.isfile(kand):
        return kand
    raise FileNotFoundError(nazwa)


def sprawdz_siatke(w, h):
    uwagi = []
    for wym, etykieta in ((w, "szerokosc"), (h, "wysokosc")):
        if wym % 32 != 0:
            uwagi.append("%s=%dpx nie jest wielokrotnoscia 32" % (etykieta, wym))
    return uwagi


def sprawdz_alfa(alpha):
    mn, mx, std = int(alpha.min()), int(alpha.max()), float(alpha.std())
    if mn == 255 and mx == 255:
        return "plaska 255 (OK)", []
    if mn == 0 and std > 60:
        # bimodalne: realna przezroczystosc (np. margines) obok pelnej krycia
        return "bimodalna 0/255 — prawdziwa przezroczystosc, nie szum", []
    if std < 10 and mx < 255:
        return "%d-%d, std=%.1f — cala powierzchnia lekko przezroczysta (SZUM generatora, nie zamierzone)" % (mn, mx, std), [
            "wymus alpha=255 przed uzyciem (jedna linijka), inaczej kazdy kafel z tej bazy dziedziczy mgielke"
        ]
    return "%d-%d, std=%.1f — niejednoznaczne, obejrzyj recznie" % (mn, mx, std), []


def dystans_euklides(a, b):
    if len(a) == 0:
        return None
    return float(np.sqrt(((a.astype(int) - b.astype(int)) ** 2).sum(axis=-1)).mean())


def sprawdz_szew(rgb, alpha):
    maska = alpha > 200
    lr = dystans_euklides(rgb[:, 0][maska[:, 0] & maska[:, -1]], rgb[:, -1][maska[:, 0] & maska[:, -1]])
    tb = dystans_euklides(rgb[0, :][maska[0, :] & maska[-1, :]], rgb[-1, :][maska[0, :] & maska[-1, :]])
    return lr, tb


def ocena(dystans):
    if dystans is None:
        return "brak danych"
    if dystans < PROG_OK:
        return "OK"
    if dystans < PROG_UWAGA:
        return "UWAGA"
    return "ZLY"


def sprawdz_palete(rgb, alpha):
    px = rgb[alpha > 200].reshape(-1, 3)
    if len(px) == 0:
        return 0, {}
    uniq, counts = np.unique(px, axis=0, return_counts=True)
    target = np.array([c for _, c in PALETA_KOLORY])
    d = np.sqrt(((uniq[:, None, :].astype(int) - target[None, :, :].astype(int)) ** 2).sum(axis=2))
    idx = np.argmin(d, axis=1)
    dmin = d[np.arange(len(uniq)), idx]
    # srednia wazona liczba pikseli danego koloru
    srednia = float(np.average(dmin, weights=counts))
    ramp_licznik = {}
    for i, (rampa, _) in enumerate(PALETA_KOLORY):
        sel = idx == i
        if sel.any():
            ramp_licznik[rampa] = ramp_licznik.get(rampa, 0) + int(counts[sel].sum())
    return srednia, ramp_licznik


def raport(sciezka):
    nazwa = os.path.basename(sciezka)
    im = Image.open(sciezka).convert("RGBA")
    arr = np.array(im)
    rgb, alpha = arr[..., :3], arr[..., 3]
    w, h = im.size

    print("== %s (%dx%d)" % (nazwa, w, h))

    uwagi_siatki = sprawdz_siatke(w, h)
    if uwagi_siatki:
        print("   siatka: ZLY — %s" % "; ".join(uwagi_siatki))
    else:
        print("   siatka: OK (%dx%d dzieli sie przez 32px kafel)" % (w, h))

    opis_alfa, uwagi_alfa = sprawdz_alfa(alpha)
    print("   alfa:   %s" % opis_alfa)
    for u in uwagi_alfa:
        print("           -> %s" % u)

    lr, tb = sprawdz_szew(rgb, alpha)
    def fmt(d):
        return "%6.2f" % d if d is not None else "  brak"
    print("   szew L-R: %s (%s)" % (fmt(lr), ocena(lr)))
    print("   szew T-B: %s (%s)" % (fmt(tb), ocena(tb)))
    if lr is None or tb is None:
        print("           -> krawedz przezroczysta (brak tresci) — kafla nie da sie ocenic pod katem szwu")
    elif ocena(lr) != "OK" or ocena(tb) != "OK":
        print("           -> nie kafluje sie bez szwu; generator zbudowany na tej bazie")
        print("              rozniesie ten szew na kazdy kafel sciany/naroznika")

    srednia, ramp_licznik = sprawdz_palete(rgb, alpha)
    print("   paleta: srednia odleglosc do docs/paleta.json = %.1f" % srednia)
    if ramp_licznik:
        top = sorted(ramp_licznik.items(), key=lambda kv: -kv[1])[:4]
        print("           najblizsze rampy: %s" % ", ".join("%s(%d)" % (r, n) for r, n in top))

    print()
    return sciezka, im


def zapisz_podglad(sciezka, im, katalog, n=3):
    os.makedirs(katalog, exist_ok=True)
    w, h = im.size
    canvas = Image.new("RGBA", (w * n, h * n))
    for i in range(n):
        for j in range(n):
            canvas.paste(im, (i * w, j * h))
    out = os.path.join(katalog, os.path.basename(sciezka).replace(".png", "_podglad_%dx%d.png" % (n, n)))
    canvas.save(out)
    print("   podglad -> %s" % out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pliki", nargs="+", help="nazwy w public/assets/ lub pelne sciezki")
    ap.add_argument("--podglad", metavar="KATALOG", help="zapisz kompozyt 3x3 do tego katalogu (NIE public/assets)")
    a = ap.parse_args()

    for nazwa in a.pliki:
        sciezka = znajdz(nazwa)
        sciezka, im = raport(sciezka)
        if a.podglad:
            zapisz_podglad(sciezka, im, a.podglad)


if __name__ == "__main__":
    main()

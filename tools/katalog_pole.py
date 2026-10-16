"""
Katalog semantyczny pole_tileset.png -> docs/pole.json

Uruchom:  python tools/katalog_pole.py            (raport, NIC nie zapisuje)
          python tools/katalog_pole.py --zapisz   (nadpisuje docs/pole.json)
          python tools/katalog_pole.py --podglad X.png   (arkusz stykowy z podpisami)

── PO CO TO ISTNIEJE ───────────────────────────────────────────────────────

pole_tileset.png byl JEDYNYM arkuszem bez katalogu. Buildings.png ma
docs/budynki.json, Kuznia.png ma docs/kuznia.json, Teren/Nature maja
docs/kafle.json — a uprawy nie mialy nic. Skutek byl konkretny i opisany w
CLAUDE.md: dobor "ktory (kolumna, wiersz) czyta sie jako zaorana ziemia"
polegal na wycinaniu kafli i patrzeniu, za kazdym razem od nowa.

── DLACZEGO OSOBNY SKRYPT, A NIE build_pole.py ─────────────────────────────

Bo build_pole.py NIE WIE, co narysowal. Wycina kafle z pole.png przez
etykietowanie spojnych obszarow (8-spojnosc) — dostaje 163 prostokaty i tyle.
Nie ma tam zadnej informacji "to jest kapusta, a to rzepa". Semantyka musi
wiec powstac z ogladania arkusza; ten skrypt jest miejscem, w ktorym raz
ogladnieta semantyka zostaje ZAPISANA, zeby nikt nie ogladal jej drugi raz.

Konsekwencja: gdyby ktos przebudowal pole_tileset.png ze zmieniona kolejnoscia
komponentow, TABELA nizej przestaje pasowac do arkusza. Skrypt zglasza to
sam — porownuje liczbe i pozycje niepustych komorek z tabela i konczy bledem,
zamiast po cichu zapisac katalog opisujacy nieistniejacy uklad.

── PODZIAL PRACY: CO MIERZONE, CO PRZECZYTANE OKIEM ────────────────────────

Regula: wszystko, co da sie policzyc, JEST liczone przy kazdym uruchomieniu;
tabela nizej trzyma wylacznie to, czego policzyc sie nie da.

MIERZONE:
  • obrys nieprzezroczysty i `krycie` — patrz sekcja nizej, to jest
    najwazniejsza liczba w calym katalogu,
  • `trawa` — przy ktorych krawedziach kafel styka sie z trawa, a przez to
    czy jest kaflem BRZEGOWYM niwy (`przejscie`) czy srodkowym,
  • udzialy barwne (zielen / sloma / pomarancz) — do sortowania i kontroli.

PRZECZYTANE OKIEM (tabela):
  • gatunek uprawy i faza wzrostu. "Mloda kapusta" i "dojrzala kapusta"
    roznia sie wielkoscia glowy, nie barwa — nie ma czego zmierzyc.
  • kierunek bruzd. Probowane automatem i ODRZUCONE: wariancja rzedow lapie
    pas trawy przy krawedzi (kafle przejsciowe wychodzily "najbardziej
    bruzdowane" z calego arkusza), a analiza czestotliwosci lapie rytm
    ROSLIN — najwyzsze wyniki mialy kapusta i rzepa, nie zaorana ziemia.

── ⚠ NAJWAZNIEJSZE USTALENIE: TO NIE JEST SZCZELNY TILESET GRUNTU ──────────

Zmierzone: tylko **46 ze 163** kafli ma pelny obrys 32x32, a krycie
(udzial pikseli nieprzezroczystych) rozklada sie CIAGLE od 0.12 do 1.00 —
nie ma dwoch wyraznych grup, jest jedno pasmo. Powod jest w build_pole.py:
kafle wycinane sa przez etykietowanie spojnych obszarow, wiec "kafel" to w
istocie tyle, ile udalo sie polaczyc w jeden komponent — czasem pelny kwadrat
ziemi, a czasem sama roslina na przezroczystym tle.

Praktyczny skutek, i to jest odpowiedz na "kafelki dzialek nie pasuja":
kafel o kryciu 0.6 polozony na warstwie `pola` zostawia widoczna dziure
dookola. **Kafle o kryciu ponizej PROG_GRUNTU dostaja `rola: "nakladka"`** —
wolno ich uzywac tylko NAD kaflem ziemi (osobna warstwa albo kafel gruntu
pod spodem), nigdy jako samodzielne wypelnienie niwy. Kafle >= progu maja
`rola: "grunt"` i tylko one nadaja sie na lite pole.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))
SRC = os.path.join(ASSETS, "pole_tileset.png")
OUT = os.path.join(DOCS, "pole.json")

T, PITCH, COLS, ROWS = 32, 33, 14, 12

# Kafel ponizej tego krycia nie zakryje wlasnej komorki — patrz naglowek.
PROG_GRUNTU = 0.95
# Udzial zieleni w pasie 4 px (liczonym WEWNATRZ obrysu), od ktorego uznajemy
# krawedz za trawiasta. 0.25 odrzuca pojedyncze chwasty (mierzone 0.16),
# przyjmuje realne pasy darni (0.32 i wyzej).
PROG_TRAWY = 0.25
# To samo dla NAROZNIKA, liczone w bloku 10x10.
#
# ⚠ SAM PAS KRAWEDZI NIE WYSTARCZA I TO BYL REALNY BLAD KATALOGU. Kepa darni
# siedzaca w ROGU zajmuje kilkanascie pikseli z ~124-pikselowego pasa
# krawedzi, czyli okolo 0.15 — ponizej PROG_TRAWY. Skutek: id6 (zielony blok
# w prawym dolnym rogu) i id11 (to samo w lewym dolnym) — para kafli
# NAROZNYCH — byly w katalogu opisane jako czysty `ugor`, a wiec jako srodek
# niwy. Jeden z nich zostal na tej podstawie wmalowany w srodek zagonu w
# Zagajach i widac go tam jako kepe trawy w polu. Zgloszone przez uzytkownika
# z samego zrzutu, nie wychwycone przez zadna liczbe w raporcie.
PROG_NAROZNIKA = 0.12
BOK_NAROZNIKA = 10

# ── TABELA: GATUNEK I FAZA ──────────────────────────────────────────────────
#
# (kolumna, wiersz) -> (kategoria, podtyp). Odczytane z arkusza stykowego w
# powiekszeniu 6x i 11x (`--podglad` odtwarza ten pierwszy).
#
# Kategoria `ugor` obejmuje TAKZE kafle brzegowe — to, czy kafel styka sie z
# trawa, jest MIERZONE, a nie deklarowane: kazdy `ugor`/`sciernisko` z
# niepusta lista `trawa` zostaje automatycznie przepiety na `przejscie`.
# Wczesniejsza wersja miala te 27 kafli wpisanych recznie i pomylila sie w
# szesciu — dlatego ta decyzja nie nalezy juz do czlowieka.
TABELA = {}


def _wpisz(wiersz, pary):
    for kolumna, para in enumerate(pary):
        if para:
            TABELA[(kolumna, wiersz)] = para


U_POZ, U_PION, U_NAR = ("ugor", "bruzdy_poz"), ("ugor", "bruzdy_pion"), ("ugor", "bruzdy_naroznik")
U_ZIEM, U_ZAS = ("ugor", "ziemia"), ("ugor", "zasiane")

_wpisz(0, [U_PION, U_POZ, U_POZ, U_POZ, U_POZ, U_NAR, U_ZIEM, U_ZIEM,
           U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM])
_wpisz(1, [U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, U_PION, U_PION, U_PION, U_PION,
           U_PION, U_PION, U_ZIEM, ("pedy", "kielki"), ("pedy", "kielki"),
           ("pedy", "kielki")])
_wpisz(2, [("pedy", "kielki"), U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM,
           U_ZIEM, U_POZ, U_POZ, U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM])
_wpisz(3, [U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, U_POZ, U_POZ, U_POZ, U_POZ,
           U_ZIEM, U_ZIEM, U_ZIEM, U_ZIEM, ("kapusta", "sadzonka"),
           ("kapusta", "sadzonka")])
_wpisz(4, [("kapusta", "dojrzala")] * 4 + [("zboze", "dojrzale")] * 5
       + [U_ZIEM, U_ZAS] + [("zboze", "zielone")] * 3)
_wpisz(5, [("sciernisko", "sloma"), ("sciernisko", "sloma"),
           ("kapusta", "sadzonka"), ("kapusta", "mloda"), ("kapusta", "mloda"),
           ("kapusta", "dojrzala"), ("kapusta", "dojrzala"),
           ("kapusta", "dojrzala"), ("zboze", "dojrzale"), ("zboze", "dojrzale"),
           ("zboze", "dojrzale"), ("zboze", "zielone"), ("zboze", "zielone"),
           U_ZIEM])
_wpisz(6, [U_ZIEM, ("pedy", "mlode"), ("pedy", "mlode"), ("pedy", "mlode"),
           ("sciernisko", "sloma"), U_ZIEM] + [("len", "kwitnacy")] * 5
       + [("nac", "gesta")] * 3)
_wpisz(7, [("pedy", "mlode"), ("pedy", "siewka"), ("pedy", "mlode"),
           ("nac", "gesta"), ("nac", "gesta"), ("pedy", "siewka"),
           ("nac", "gesta"), ("nac", "gesta"), ("nac", "gesta"),
           ("pedy", "siewka"), ("pedy", "mlode"), ("pedy", "mlode"),
           ("pedy", "siewka"), ("pedy", "mlode")])
_wpisz(8, [("nac", "cebulowa")] * 4 + [("nac", "niska")] * 4
       + [("nac", "cebulowa")] + [("korzeniowe", "wschodzace")] * 5)
_wpisz(9, [("korzeniowe", "wschodzace"), ("korzeniowe", "rzepa"),
           ("korzeniowe", "rzepa"), ("korzeniowe", "rzepa"),
           ("korzeniowe", "dojrzale"), ("korzeniowe", "dojrzale"),
           ("korzeniowe", "wschodzace"), ("korzeniowe", "wschodzace"),
           ("korzeniowe", "dojrzale"), ("korzeniowe", "wschodzace"),
           ("korzeniowe", "wschodzace"), ("korzeniowe", "dojrzale"),
           ("korzeniowe", "dojrzale"), ("nac", "gesta")])
_wpisz(10, [("nac", "gesta")] * 11 + [("korzeniowe", "dojrzale")] * 3)
_wpisz(11, [("korzeniowe", "dojrzale"), ("korzeniowe", "rzepa"),
            ("korzeniowe", "dojrzale"), ("korzeniowe", "rzepa"),
            ("korzeniowe", "dojrzale"), ("korzeniowe", "rzepa"),
            ("korzeniowe", "wschodzace"), ("korzeniowe", "wschodzace"),
            ("pedy", "siewka")])

OPIS_KATEGORII = {
    "ugor": "gola albo zaorana ziemia bez uprawy, NIE stykajaca sie z trawa — srodek niwy",
    "przejscie": "to samo co `ugor`, ale styka sie z trawa; `trawa` mowi przy ktorych krawedziach",
    "kapusta": "kapusta glowiasta; fazy: sadzonka -> mloda -> dojrzala",
    "zboze": "zboze; faza `zielone` (wiosna/lato) i `dojrzale` (przed zniwami)",
    "sciernisko": "po zniwach — sloma i rzad w ziemi",
    "len": "len w kwiecie, biale kwiaty na zielonej lodydze",
    "nac": "gesta zielona nac bez widocznego owocu",
    "korzeniowe": "rzepa/marchew/cebula z owocem widocznym nad ziemia",
    "pedy": "wschody i siewki — pojedyncze zdzbla na golej ziemi",
}

# Kafle, ktore build_pole.py POCIAL NA POL: dol siedzi w arkuszu, gora poszla
# do luznego pole_over_NN.png. Bez warstwy `-over` (a ta NIE DZIALA — 17 luznych
# plikow to nie arkusz, Phaser wiaze jeden obraz na tileset) taki kafel pokazuje
# roslin­e z uciete gora.
#
# Lista wyprodukowana przez `build_pole.zbuduj()` (zwraca `pary` = indeksy
# kafla i nadstawki). Nie liczymy jej tutaj, bo wymagaloby to przepuszczenia
# calego k-means dla samych 17 numerow.
#
# ⚠ WNIOSEK, KTORY ZMIENIA CO DA SIE MALOWAC: ciete sa WYLACZNIE `korzeniowe`
# (i jeden `pedy`). ZBOZE JEST KOMPLETNE — mimo ze jest najwyzsza roslina w
# arkuszu, miesci sie w kaflu. Niwa zbozowa jest wiec do namalowania od reki;
# brak warstwy `-over` blokuje warzywa korzeniowe, nie zboze.
POLOWKI = {100, 121, 122, 123, 124, 125, 126, 127, 128, 129,
           130, 131, 132, 133, 134, 135, 136}

OPIS_ROLI = {
    "grunt": "krycie >= %.2f — zakrywa wlasna komorke, wolno uzywac jako lite pole" % PROG_GRUNTU,
    "nakladka": "krycie < %.2f — ma przezroczysty margines, WYMAGA ziemi pod spodem"
                % PROG_GRUNTU,
}


def zmierz(a, c, r):
    t = a[r * PITCH:r * PITCH + T, c * PITCH:c * PITCH + T]
    if t.shape[0] < T or t.shape[1] < T:
        return None
    alfa = t[..., 3]
    if alfa.max() == 0:
        return None
    widoczne = alfa > 0
    rgb = t[..., :3]

    ys, xs = np.where(widoczne)
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())

    px = rgb.reshape(-1, 3)[widoczne.reshape(-1)]
    r_, g_, b_ = px[:, 0], px[:, 1], px[:, 2]
    n = len(px)
    ziel = (g_ > r_ + 12) & (g_ > b_ + 12)
    zloto = (~ziel) & (r_ > 110) & (g_ > 90) & (r_ - b_ > 45) & (abs(r_ - g_) < 55)
    poma = (~ziel) & (r_ > 130) & (r_ - g_ > 40) & (g_ - b_ > 15)

    # Trawa liczona W OBRYSIE, nie w prostokacie kafla. To nie jest detal:
    # przy obrysie 32x25 pas "4 px od gory kafla" siedzi w pustce, a darn
    # zaczyna sie dopiero w 4. wierszu obrazu — pierwsza wersja tego skryptu
    # gubila przez to polowe kafli brzegowych.
    zm = ((rgb[..., 1] > rgb[..., 0] + 12) & (rgb[..., 1] > rgb[..., 2] + 12)
          & widoczne)
    d = 4
    kraw = {
        "N": float(zm[y0:y0 + d, x0:x1 + 1].mean()),
        "S": float(zm[y1 - d + 1:y1 + 1, x0:x1 + 1].mean()),
        "W": float(zm[y0:y1 + 1, x0:x0 + d].mean()),
        "E": float(zm[y0:y1 + 1, x1 - d + 1:x1 + 1].mean()),
    }
    b = BOK_NAROZNIKA
    naroz = {
        "NW": float(zm[y0:y0 + b, x0:x0 + b].mean()),
        "NE": float(zm[y0:y0 + b, x1 - b + 1:x1 + 1].mean()),
        "SW": float(zm[y1 - b + 1:y1 + 1, x0:x0 + b].mean()),
        "SE": float(zm[y1 - b + 1:y1 + 1, x1 - b + 1:x1 + 1].mean()),
    }
    return dict(
        krycie=round(float(widoczne.mean()), 3),
        obrys=[x1 - x0 + 1, y1 - y0 + 1],
        ziel=round(float(ziel.sum() / n), 3),
        sloma=round(float(zloto.sum() / n), 3),
        pomarancz=round(float(poma.sum() / n), 3),
        trawa=sorted(k for k, v in kraw.items() if v > PROG_TRAWY),
        naroznik=sorted(k for k, v in naroz.items() if v > PROG_NAROZNIKA),
        # Najostrzejsze i najbardziej uzyteczne kryterium przy malowaniu:
        # ANI JEDNEGO zielonego piksela. Tylko taki kafel wolno polozyc w
        # srodku niwy — patrz komentarz przy PROG_NAROZNIKA.
        czysty=bool(ziel.sum() == 0),
    )


def zbuduj():
    im = Image.open(SRC).convert("RGBA")
    a = np.array(im).astype(int)
    kafle, licznik, braki, nadmiar = {}, {}, [], []

    for r in range(ROWS):
        for c in range(COLS):
            m = zmierz(a, c, r)
            klucz = (c, r)
            if m is None:
                if klucz in TABELA:
                    nadmiar.append(klucz)
                continue
            if klucz not in TABELA:
                braki.append(klucz)
                continue
            kat, pod = TABELA[klucz]
            # Kafel brzegowy rozpoznawany z POMIARU, nie z tabeli — i liczy
            # sie TAKZE sam naroznik, patrz PROG_NAROZNIKA.
            if kat in ("ugor", "sciernisko") and (m["trawa"] or m["naroznik"]):
                kat = "przejscie"

            baza = "%s_%s" % (kat, pod)
            licznik[baza] = licznik.get(baza, 0) + 1
            nazwa = "%s_%d" % (baza, licznik[baza])

            wpis = dict(kolumna=c, wiersz=r, id=r * COLS + c,
                        kategoria=kat, podtyp=pod,
                        rola="grunt" if m["krycie"] >= PROG_GRUNTU else "nakladka",
                        krycie=m["krycie"], obrys=m["obrys"],
                        ziel=m["ziel"], sloma=m["sloma"], pomarancz=m["pomarancz"],
                        polowka=(r * COLS + c) in POLOWKI)
            if kat in ("ugor", "przejscie", "sciernisko"):
                wpis["trawa"] = m["trawa"]
                wpis["naroznik"] = m["naroznik"]
                wpis["czysty"] = m["czysty"]
            kafle[nazwa] = wpis

    kategorie = {}
    for nazwa, w in kafle.items():
        kategorie.setdefault(w["kategoria"], []).append(nazwa)
    for v in kategorie.values():
        v.sort()

    im_w, im_h = im.size
    katalog = dict(
        arkusz=dict(plik="pole_tileset.png", szerokosc=im_w, wysokosc=im_h,
                    kolumny=COLS, wiersze=ROWS, kafel=T, pitch=PITCH,
                    kafli=len(kafle)),
        progi=dict(grunt=PROG_GRUNTU, trawa=PROG_TRAWY),
        opis_kategorii=OPIS_KATEGORII,
        opis_roli=OPIS_ROLI,
        kategorie=kategorie,
        kafle=kafle,
    )
    return katalog, braki, nadmiar


def podglad(sciezka, katalog):
    from PIL import ImageDraw
    im = Image.open(SRC).convert("RGBA")
    skala, gap, pad_l, pad_t = 5, 16, 30, 18
    cell = T * skala
    out = Image.new("RGBA", (pad_l + COLS * (cell + gap),
                             pad_t + ROWS * (cell + gap + 20)), (28, 28, 32, 255))
    d = ImageDraw.Draw(out)
    po_poz = {(w["kolumna"], w["wiersz"]): (n, w) for n, w in katalog["kafle"].items()}
    for r in range(ROWS):
        y = pad_t + r * (cell + gap + 20)
        d.text((4, y + cell // 2), str(r), fill=(255, 220, 120, 255))
        for c in range(COLS):
            x = pad_l + c * (cell + gap)
            if r == 0:
                d.text((x + cell // 2 - 6, 3), str(c), fill=(255, 220, 120, 255))
            for by in range(0, cell, 8):
                for bx in range(0, cell, 8):
                    kol = (62, 62, 68) if ((bx // 8 + by // 8) % 2) else (44, 44, 50)
                    d.rectangle([x + bx, y + by, x + bx + 7, y + by + 7], fill=kol)
            out.alpha_composite(
                im.crop((c * PITCH, r * PITCH, c * PITCH + T, r * PITCH + T))
                  .resize((cell, cell), Image.NEAREST), (x, y))
            wpis = po_poz.get((c, r))
            d.rectangle([x - 1, y - 1, x + cell, y + cell],
                        outline=(90, 200, 90, 255) if wpis and wpis[1]["rola"] == "grunt"
                        else (110, 90, 90, 255))
            if wpis:
                d.text((x, y + cell + 2), wpis[0][:24], fill=(180, 200, 180, 255))
                d.text((x, y + cell + 11), "id%d k%.2f" % (wpis[1]["id"], wpis[1]["krycie"]),
                       fill=(140, 140, 150, 255))
    out.save(sciezka)
    print("podglad ->", sciezka, "(zielona ramka = grunt, czerwona = nakladka)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad")
    args = ap.parse_args()

    katalog, braki, nadmiar = zbuduj()
    a = katalog["arkusz"]
    print("arkusz %s: %dx%d, %d kol x %d wierszy, kafel %d, pitch %d"
          % (a["plik"], a["szerokosc"], a["wysokosc"], a["kolumny"], a["wiersze"],
             a["kafel"], a["pitch"]))
    print("skatalogowanych kafli: %d" % a["kafli"])

    if braki or nadmiar:
        if braki:
            print("BLAD: kafle w arkuszu bez wpisu w TABELI: %s" % braki)
        if nadmiar:
            print("BLAD: TABELA opisuje puste komorki: %s" % nadmiar)
        print("  -> arkusz rozjechal sie z tabela, przejrzyj ja od nowa")
        raise SystemExit(1)

    print("\nkategoria     kafli  grunt  nakladka  podtypy")
    for kat in sorted(katalog["kategorie"]):
        nazwy = katalog["kategorie"][kat]
        g = sum(1 for n in nazwy if katalog["kafle"][n]["rola"] == "grunt")
        pod = sorted({katalog["kafle"][n]["podtyp"] for n in nazwy})
        print("  %-12s %4d  %5d  %8d  %s" % (kat, len(nazwy), g, len(nazwy) - g,
                                             ", ".join(pod)))

    grunty = [(n, w) for n, w in katalog["kafle"].items() if w["rola"] == "grunt"]
    print("\nkafli nadajacych sie na LITE pole (rola=grunt): %d ze %d"
          % (len(grunty), a["kafli"]))

    print("\n>>> SRODEK NIWY: kafle jednoczesnie `grunt` i `czysty` (zero zieleni).")
    print("    Tylko tych wolno uzyc jako wypelnienie pola — kazdy inny wniesie")
    print("    kepe trawy w srodek zagonu.")
    srodek = [(n, w) for n, w in grunty
              if w["kategoria"] in ("ugor", "przejscie") and w.get("czysty")]
    for n, w in sorted(srodek):
        print("   %-22s id%-4d (%2d,%2d)  krycie %.2f  %s"
              % (n, w["id"], w["kolumna"], w["wiersz"], w["krycie"], w["podtyp"]))
    if not srodek:
        print("   (brak!)")

    print("\nkafle BRZEGOWE ugoru (maja darn przy krawedzi albo w rogu):")
    for n, w in sorted(katalog["kafle"].items()):
        if w["kategoria"] != "przejscie" or w.get("czysty"):
            continue
        print("   %-22s id%-4d krawedzie=%-14s rogi=%s"
              % (n, w["id"], ",".join(w.get("trawa") or []) or "-",
                 ",".join(w.get("naroznik") or []) or "-"))

    if args.podglad:
        podglad(args.podglad, katalog)

    if args.zapisz:
        json.dump(katalog, open(OUT, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print("\nzapisano %s" % OUT)
    else:
        print("\n(przymiar — uruchom z --zapisz zeby zapisac docs/pole.json)")


if __name__ == "__main__":
    main()

"""
Sprowadza `xd.png` (znaki, tablice, krzyze, strach na wroble, pranie) do
palety swiata i tnie na kafle 32x32.

Uruchom:  python tools/build_znaki.py                (raport + walidacja, NIC nie pisze)
          python tools/build_znaki.py --podglad KAT  (przed/po, powiekszone)
          python tools/build_znaki.py --zapisz       (pisze public/assets/znaki.png)

── ZASADA NADRZEDNA ──────────────────────────────────────────────────────
`xd.png` to grafika JUZ NARYSOWANA, z charakterem, ktorego generator nie
wyprodukuje (uklad falda na przescieradle, kapelusz stracha, rytm desek
tablicy). Dlatego tutaj obowiazuje odwrotna zasada:

    ANI JEDEN PIKSEL NIE ZMIENIA KSZTALTU. Zmienia sie wylacznie KOLOR.

Zero przerysowywania, zero "poprawiania" rysunku. To jest ta sama sciezka co
`studnia.png` -> `studnia_mala.png` w `snap_paleta.py`.

── DLACZEGO NIE ZWYKLY "NAJBLIZSZY KOLOR Z PALETY" ───────────────────────
Bo splaszczylby rysunek, i to jest zmierzone, nie przypuszczane. Zrodlo ma
SZESC poziomow drewna:

    #ccbd7b 186   #b78c41 144   #986a20 111
    #85581b  95   #684415  73   #573726  63  (kontur)

Najblizszy sasiad w RGB (nawet przy zbiorze drewno+kora+neutralne) wrzuca je
na CZTERY:

    #986a20 i #85581b  ->  oba drewno[2]
    #684415 i #573726  ->  oba drewno[1]     <- KONTUR ZNIKA

Kolejnosc jasnosci wprawdzie sie zachowuje, ale dwie pary sie sklejaja i
rysunek traci kontur oraz jeden stopien modelunku. Przy rekwizycie, ktorego
cala wartosc polega na tym, ze zostal ladnie narysowany, to jest strata
dokladnie tego, po co go bierzemy.

── METODA: RAMPA Z SASIADA, STOPIEN Z RANGI ──────────────────────────────
Dwa kroki na kazdy kolor zrodla:
1. **Ktora rampa** — najblizszy sasiad w RGB rozstrzyga, z jakiego MATERIALU
   jest ten piksel (drewno / zielen / czerwien / kamien / plotno...). Do tego
   odleglosc RGB nadaje sie dobrze, bo materialy roznia sie barwa.
2. **Ktory stopien tej rampy** — pozycja w rampie liczona z JASNOSCI WAZONEJ
   POPULACJA. Do tego odleglosc RGB nadaje sie zle, bo zrodlo i paleta maja
   inne rozpietosci; pozycja walorowa zachowuje strukture rysunku niezaleznie
   od tego, jak bardzo obie skale sie rozjezdzaja.

⚠ **Wazenie populacja nie jest drobiazgiem — bez niego rozsypuja sie krzyze.**
Pierwsza wersja liczyla pozycje po zwyklej randze (i-ty z n kolorow), co jest
poprawne dla obiektu o czystej, malej palecie (znak drogowy ma 8 kolorow), ale
katastrofalne dla obiektu z antyaliasingiem: oba krzyze maja **88 i 96 kolorow
zrodla**, w wiekszosci pojedyncze piksety na krawedziach. Zwykla ranga daje
kazdemu z nich rowny udzial w rampie, wiec poltony wyjezdzaja na skrajnosci —
kamienny krzyz wyszedl blada, niebieskawa sztabka, a kopczyk pod drewnianym
rozlazl sie w plame. Wazenie populacja sprawia, ze kolor trzymajacy 40%
pikseli zajmuje szeroki pas rampy, a samotne piksele antyaliasingu doklejaja
sie do swoich sasiadow. Ta sama metoda obsluguje wtedy oba przypadki i nie
trzeba dzielic obiektow na "czyste" i "brudne".

Efekt: szesc poziomow drewna zrodla trafia na szesc roznych kolorow docelowych,
kontur zostaje konturem, a modelunek zostaje modelunkiem.

⚠ **Rampa drewna jest tu ROZSZERZONA o `kora[0]` od dolu** i to nie jest
ozdoba: `drewno` ma piec stopni, a poziomow do rozdania jest szesc. Bez
szostego stopnia dwa najciemniejsze i tak by sie skleily i cale cwiczenie
nic by nie dalo. `kora[0]` (#351a1a) jest ciemniejsze od `drewno[0]` i nadal
jest barwa drewna — zgodne z `docs/ART_DIRECTION.md` §4.4, ktore dla propa
zada krawedzi "ciemniejszej o stopien wlasnej rampy", a NIE czarnego obrysu.

── ZBIORY RAMP SA PER OBIEKT, NIE NA CALY ARKUSZ ─────────────────────────
Ta sama lekcja co w `snap_paleta.py`: przy snapowaniu do najblizszego sasiada
**cala kategoria koloru potrafi zniknac**, bo najblizszy sasiad lezy w obcej
rampie. Tutaj arkusz jest wyjatkowo rozny materialowo (drewno, zielona koszula,
czerwony kapelusz, sloma, kamien, plotno, niebieskie skarpety), wiec jeden
wspolny zbior dla wszystkiego gwarantowalby taka strate. Kazdy obiekt dostaje
wlasny, ciasny zbior — raport wypisuje trafienia i krzyczy, gdy ktoras rampa
dostala zero pikseli.

── POLPRZEZROCZYSTE PIKSELE = CIEN, NIE ANTYALIASING ─────────────────────
Zrodlo ma 700 pikseli o alfie posredniej. Sprawdzone: siedza pod obiektami,
nie na ich krawedziach — to miekkie cienie, nie wygladzanie. Projekt ma na to
wlasna konwencje (`kafel_zagroda` w `build_budynki.py`: `neutralne[0]` przy
alfie 110), wiec sa do niej sprowadzane: jedna wartosc alfy, jeden kolor.
Piksele ponizej progu ida do zera, zeby nie zostala po nich mgielka.
"""

import argparse
import json
import os
from collections import Counter

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
KORZEN = os.path.normpath(os.path.join(TU, ".."))
ASSETS = os.path.join(KORZEN, "public", "assets")
DOCS = os.path.join(KORZEN, "docs")

PALETA = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
T = 32
ZRODLO = "xd.png"
WYNIK = "znaki.png"

PROG_CIEN = 30      # alfa ponizej -> kasujemy (mgielka)
PROG_KRYCIE = 128   # alfa powyzej -> piksel rysunku
ALFA_CIENIA = 110   # ta sama co `kafel_zagroda` w build_budynki.py


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def R(nazwa, od=None, do=None):
    return [hx(h) for h in PALETA[nazwa][od:do]]


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


# Drewno rozszerzone w dol o kora[0] — patrz naglowek.
DREWNO6 = R("kora", 0, 1) + R("drewno")

# nazwa -> (kolumna, wiersz, szer_kafli, wys_kafli, {rampa: kolory})
OBIEKTY = {
    "drogowskaz_strzalka": (0, 0, 1, 1, {"drewno": DREWNO6}),
    "drogowskaz_tablica":  (1, 0, 1, 1, {"drewno": DREWNO6}),
    # Kopczyk pod krzyzem to ziemia, nie drewno — bez wlasnej rampy zabralby
    # drewnu dwa stopnie i slupek zrobilby sie plaski.
    "krzyz_drewniany":     (2, 0, 1, 1, {"drewno": DREWNO6, "ziemia": R("ziemia")}),
    # ⚠ Krzyz kamienny NIE dostaje rampy `kamien` i to jest wynik pomiaru, nie
    # przeoczenie. Jasnosc zrodla tego kafla to **28..115**, a rampa `kamien`
    # zaczyna sie dopiero od **75** i siega **196** — czyli zrodlo w calosci
    # lezy PONIZEJ jej srodka. Rozciagniecie go na te rampe rozjasnilo krzyz do
    # bladej, niebieskawej sztabki (widoczne na podgladzie, niewidoczne w
    # zadnej liczbie z raportu). `neutralne` pokrywa 18..228, wiec ciemny,
    # chlodny kamien siada w niej naturalnie; `kamien[0:2]` zostaje tylko na
    # najjasniejsze lico.
    # (`kamien[0:2]` tez byl w tym zbiorze i tez dostal zero — cale lico krzyza
    # miesci sie w `neutralne`. Usuniete, konwencja jak wyzej.)
    "krzyz_kamienny":      (2, 1, 1, 1, {"neutralne": R("neutralne", 0, 4),
                                         "ziemia": R("ziemia"),
                                         "drewno": DREWNO6}),
    # Kartki na tablicy sa chlodnoszare (#726b7e) — bez jasnego konca
    # `neutralne` wpadlyby na drewno i tablica wygladalaby na pusta.
    "tablica_pusta":       (0, 1, 1, 1, {"drewno": DREWNO6}),
    "tablica_kartki":      (1, 1, 1, 1, {"drewno": DREWNO6,
                                         "neutralne": R("neutralne", 2, 6)}),
    # `piasek` byl w tym zbiorze i dostal ZERO pikseli — sloma wchodzi na
    # jasny koniec `drewno` i wyglada tam dobrze, wiec rampa zostala usunieta
    # zamiast zostawiona jako martwy wpis (konwencja z `snap_paleta.py`).
    "strach_na_wroble":    (3, 0, 1, 2, {"drewno": DREWNO6,
                                         "listowie": R("listowie"),
                                         "akcent_cieply": R("akcent_cieply")}),
    "stelaz":              (0, 2, 3, 1, {"drewno": DREWNO6}),
    # Pranie: plotno na jasnym koncu `neutralne`, czerwien na `akcent_cieply`,
    # brazowe portki na `ziemia`, skarpety na `woda`, klamerki na `kamien`.
    "pranie":              (0, 3, 3, 1, {"neutralne": R("neutralne", 3, 6),
                                         "akcent_cieply": R("akcent_cieply"),
                                         "ziemia": R("ziemia"),
                                         "woda": R("woda"),
                                         "kamien": R("kamien")}),
}


def mapuj(kolory, populacja, zbiory):
    """Kolor zrodla -> kolor docelowy. Rampa z sasiada, stopien z rangi.

    `kolory` to lista unikalnych RGB obiektu, `populacja` to {RGB: ile pikseli},
    `zbiory` to {nazwa: [RGB, ...]} (kazda rampa uporzadkowana od najciemniejszej).
    """
    nazwy = list(zbiory)
    wszystkie = [(n, c) for n in nazwy for c in zbiory[n]]
    cel = np.array([c for _, c in wszystkie], dtype=int)

    # krok 1: ktora rampa
    src = np.array(kolory, dtype=int)
    d = ((src[:, None, :] - cel[None, :, :]) ** 2).sum(2)
    rampa_dla = [wszystkie[i][0] for i in d.argmin(1)]

    # krok 2: ktory stopien tej rampy — pozycja walorowa wazona populacja
    wynik = {}
    trafienia = Counter()
    for n in nazwy:
        grupa = [k for k, r in zip(kolory, rampa_dla) if r == n]
        if not grupa:
            continue
        grupa.sort(key=lum)
        docelowe = sorted(zbiory[n], key=lum)
        ile = len(docelowe)
        suma = sum(populacja[k] for k in grupa)
        skum = 0
        for k in grupa:
            # Srodek wlasnego przedzialu populacji, a nie indeks w liscie —
            # patrz naglowek: bez tego antyaliasing rozpycha poltony na
            # skrajnosci i krzyze wychodza plaskie.
            poz = (skum + populacja[k] / 2) / suma
            skum += populacja[k]
            wynik[k] = docelowe[min(ile - 1, int(round(poz * (ile - 1))))]
            trafienia[n] += populacja[k]
    return wynik, trafienia


def _rampa_koloru(k, mapa, zbiory):
    for n, kolory in zbiory.items():
        if tuple(mapa[k]) in [tuple(c) for c in kolory]:
            return n
    return None


def przetworz(arr, zbiory):
    rgb, alpha = arr[..., :3], arr[..., 3]
    rys = alpha >= PROG_KRYCIE
    cien = (alpha >= PROG_CIEN) & ~rys

    populacja = Counter(map(tuple, rgb[rys]))
    kolory = sorted(populacja, key=lum)
    mapa, trafienia = mapuj(kolory, populacja, zbiory)

    out = np.zeros_like(arr)
    for k, v in mapa.items():
        m = rys & (rgb[..., 0] == k[0]) & (rgb[..., 1] == k[1]) & (rgb[..., 2] == k[2])
        out[m, :3] = v
        out[m, 3] = 255
    out[cien, :3] = hx(PALETA["neutralne"][0])
    out[cien, 3] = ALFA_CIENIA
    return out, kolory, mapa, trafienia, int(cien.sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="KATALOG")
    a = ap.parse_args()

    src = np.array(Image.open(os.path.join(ASSETS, ZRODLO)).convert("RGBA"))
    wynik = np.zeros_like(src)
    ok = True

    for nazwa, (kol, wie, sw, sh, zbiory) in OBIEKTY.items():
        blok = src[wie * T:(wie + sh) * T, kol * T:(kol + sw) * T]
        nowy, kolory, mapa, trafienia, cieni = przetworz(blok, zbiory)
        wynik[wie * T:(wie + sh) * T, kol * T:(kol + sw) * T] = nowy

        print("== %-20s kafle k%d w%d, %dx%d" % (nazwa, kol, wie, sw, sh))
        print("   kolorow rysunku: %d -> %d,  pikseli cienia: %d"
              % (len(kolory), len({tuple(v) for v in mapa.values()}), cieni))
        print("   " + ", ".join("%s:%d" % (n, c) for n, c in trafienia.most_common()))
        puste = sorted(set(zbiory) - set(trafienia))
        if puste:
            print("   ⚠ RAMPY BEZ ANI JEDNEGO PIKSELA: %s" % ", ".join(puste))
            print("     (albo zbedne w zbiorze, albo material wchlonela sasiednia)")
        # Czy struktura walorowa przezyla? To jest test, dla ktorego ta metoda
        # w ogole powstala — patrz naglowek.
        #
        # ⚠ Mierzone WEWNATRZ kazdej rampy osobno, nie na calym obiekcie.
        # Miedzy rampami porownanie jasnosci nic nie znaczy: ciemna zielen
        # koszuli jest ciemniejsza od jasnego drewna slupka i nie jest to zaden
        # blad. Pierwsza wersja liczyla to na wymieszanych rampach i zglaszala
        # "9 odwroconych" na obiektach, ktore byly w porzadku.
        #
        # SKLEJANIE tez nie jest bledem — to jest cel posteryzacji. Bledem jest
        # wylacznie ODWROCENIE: ciemniejszy piksel zrodla wychodzi jasniejszy
        # niz jasniejszy, czyli modelunek idzie w druga strone.
        odwrocone = 0
        for n in trafienia:
            g = sorted([k for k in mapa if _rampa_koloru(k, mapa, zbiory) == n], key=lum)
            w = [lum(mapa[k]) for k in g]
            odwrocone += sum(1 for i in range(1, len(w)) if w[i] < w[i - 1])
        print("   walor: %d odwrocen wewnatrz ramp  %s"
              % (odwrocone, "OK" if not odwrocone else "⚠ modelunek odwrocony"))
        ok = ok and not odwrocone
        print()

    paleta_ok = {hx(h) for l in PALETA.values() for h in l}
    m = wynik[..., 3] > 0
    obce = {tuple(c) for c in wynik[..., :3][m]} - paleta_ok
    print("== razem: %d kolorow, spoza palety: %d  %s"
          % (len({tuple(c) for c in wynik[..., :3][m]}), len(obce), "OK" if not obce else "⚠"))
    print("   alfa: %s (255 = rysunek, %d = cien)"
          % (sorted(set(np.unique(wynik[..., 3]).tolist())), ALFA_CIENIA))
    print("   %s" % ("WSZYSTKO OK" if ok and not obce else "⚠ SA BLEDY"))

    if a.podglad:
        os.makedirs(a.podglad, exist_ok=True)
        for nazwa, dane in (("przed", src), ("po", wynik)):
            im = Image.fromarray(dane, "RGBA")
            tlo = Image.new("RGBA", im.size, (120, 150, 110, 255))
            tlo.alpha_composite(im)
            tlo.resize((im.width * 6, im.height * 6), Image.NEAREST).save(
                os.path.join(a.podglad, "%s_znaki.png" % nazwa))
        print("   podglad -> %s" % a.podglad)

    if a.zapisz:
        Image.fromarray(wynik, "RGBA").save(os.path.join(ASSETS, WYNIK))
        print("   zapisano -> public/assets/%s" % WYNIK)
    else:
        print("   (nic nie zapisano — dodaj --zapisz)")


if __name__ == "__main__":
    main()

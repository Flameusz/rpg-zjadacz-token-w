"""
Generator Wschodniej Gestwiny -> public/assets/maps/thicket-gestwina.tmj

Uruchom:  python tools/build_gestwina.py            (raport, NIC nie zapisuje)
          python tools/build_gestwina.py --zapisz   (nadpisuje .tmj)
          python tools/build_gestwina.py --podglad X.png   (caly obraz mapy)

── CO TO JEST ──────────────────────────────────────────────────────────────

Trzecia mapa: glebsza czesc wschodniej gestwiny, za wschodnim skrajem lasu.

⚠ To NIE jest "gestwina" z docs/swiat.md §4 — TAMTA jest strefa istniejacej
mapy lasu i stoi tam od dawna (dziki, sieciarze, za nimi skoczki). Ta mapa
jest tym, co jest ZA nia. Rozroznienie jest wazne, bo swiat.md opisuje strefe
lasu, nie osobne miejsce, i latwo przy czytaniu uznac, ze cos juz istnieje
albo ze cos sie duplikuje.

Zbudowana z ZEROWA iloscia nowej grafiki — Teren.png i Nature.png, te same
arkusze co las. To jest decyzja, nie ograniczenie: cala tresc tej mapy da sie
powiedziec ukladem, a nie nowym kaflem (patrz "czym to mowi" nizej).

── CZYM TA MAPA MOWI, ZE JEST INNA ─────────────────────────────────────────

docs/swiat.md: "gestwina nie robi sie gestsza — robi sie bardziej cudza".
Sama gestosc drzew tego nie powie, bo gracz przychodzi z lasu, ktory tez jest
gesty. Uzyte sa wiec trzy rzeczy, kazda za darmo:

  • DROGA UMIERA. Przez brame wchodzi jeszcze kawalek udeptanej sciezki,
    ktora po kilkunastu kaflach rozpada sie na plamy i znika. Nie ma tu
    zadnej innej drogi. To jest najmocniejszy sygnal, jaki da sie postawic
    kaflami, ktore juz mamy: ktos tedy chodzil i przestal.
  • SKLAD GATUNKOWY. Las ma piec gatunkow rozlozonych wedlug swiatla; tu
    dominuje swierk i grab, a brzoza (jasna, swiatlolubna) praktycznie nie
    wystepuje. Kadr robi sie ciemniejszy bez zmiany ani jednego piksela.
  • WODA STOI. Zamiast rzeki — dwa rozlewiska bez odplywu. Rzeka mowi
    "dolina, ktoredy sie idzie"; stojaca woda mowi "tu sie konczy".

── DLACZEGO IMPORTUJE build_mapa ───────────────────────────────────────────

Ten sam uklad co build_wioska.py, ale odwrotnie dobrany: wioska celowo NIE
brala pola gestosci (osada to nie puszcza), a gestwina bierze wlasnie je —
`pole_gestosci`, `sadz`, `odsun`, `wolne`, katalog gatunkow. To jest ten sam
las, tylko gestszy i inaczej zlozony, wiec kopiowanie tej maszynerii byloby
trzecia kopia liczb, ktore juz dwa razy sie rozjechaly przy dachach.

⚠ `Warstwa`, `maluj_obszar`, `pusta_maska`, `pole_gestosci`, `odsun` i `sadz`
czytaja SZER/WYS jako GLOBALNE zmienne modulu build_mapa, nie jako argumenty.
Podmieniamy je PRZED pierwszym uzyciem. Dziala, bo Python rozwiazuje nazwy
globalne w chwili WYWOLANIA, a nie definicji, i jest bezpieczne, bo kazdy
generator to osobny proces.

⚠ Tym samym mechanizmem podmieniamy `M.gatunek_dla` na wlasny. Funkcja lasu
jest zaszyta w GEOGRAFIE lasu ("puszcza SW", "dolina rzeki", "polnocna
scianka") i na tej mapie te wspolrzedne nic nie znacza. `sadz` wola ja przez
nazwe globalna, wiec podmiana dziala bez dotykania build_mapa.py.
"""

import argparse
import json
import math
import os
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))

import build_mapa as M  # noqa: E402
from portale import (  # noqa: E402
    BRAMA_GESTWINY, WEJSCIE_DO_GESTWINY, WEJSCIE_DO_LASU_ZE_WSCHODU,
    piksele as _piksele, piksele_brama_pozioma as _piksele_brama_pozioma,
)

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
MAPY = os.path.join(ASSETS, "maps")

T = M.T
COLS = M.COLS

# 64x64, czyli ~2/3 lasu na kazdej osi i niecale 70% jego powierzchni.
# Mniejsza mapa jest tu tresc: to ma byc kieszen, do ktorej sie weszlo,
# a nie druga kraina. Kwadrat, bo nie ma tu doliny ani drogi, ktore
# nadawalyby kierunek — jedyny kierunek daje glebokosc od bramy.
SZER, WYS = 64, 64

M.SZER, M.WYS = SZER, WYS
# Wlasne ziarno: gdyby zostalo ziarno lasu, obie mapy losowalyby ten sam
# strumien i przy tych samych wywolaniach wyszlyby podejrzanie podobne plamy.
M.rng = random.Random(20260816)
M.nrng = np.random.default_rng(20260816)
rng = M.rng
nrng = M.nrng

# Kafle bramy — przesmyk ma DWA kafle wysokosci, a brama stoi na ich styku
# (patrz tools/portale.py, `piksele_brama_pozioma`).
BRAMA_Y0 = BRAMA_GESTWINY["ty"] - 1     # gorny kafel przesmyku
BRAMA_Y1 = BRAMA_GESTWINY["ty"]         # dolny kafel przesmyku

# Jak daleko w glab siega resztka sciezki, zanim zniknie.
SCIEZKA_DO_X = 17


# ── uklad ───────────────────────────────────────────────────────────────────

def ksztalt_swiata():
    """(woda, sciezka) jako maski kafli. Piasku tu nie ma — nie ma brodu."""
    woda = M.pusta_maska()
    sciezka = M.pusta_maska()

    # ── rozlewiska: woda BEZ odplywu ──────────────────────────────────────
    # Dwie plamy, obie w glebi. Celowo nie stykaja sie z krawedzia mapy:
    # rzeka w lesie wychodzi poza kadr i przez to czyta sie jak przeplyw,
    # a te maja czytac sie jak zastoiska, wiec musza byc DOMKNIETE.
    #
    # ⚠ Kazde rozlewisko to KILKA zachodzacych na siebie elips, nie jedna.
    # Pojedyncza elipsa w tej skali czyta sie jak basen — zlapane na
    # podgladzie, nie w raporcie (zaden licznik kafli tego nie pokaze).
    # Rzeka w lesie tego nie potrzebuje, bo jest dluga i meandruje; zbiornik
    # 12 kafli szeroki pokazuje swoj ksztalt caly naraz.
    for plamy in (
        ((41, 20, 5.5, 3.6), (37, 22, 3.4, 2.6), (45, 18, 3.0, 2.2)),
        ((33, 47, 4.0, 4.6), (31, 51, 2.8, 2.4), (36, 44, 2.6, 2.0)),
    ):
        for (cx, cy, rx, ry) in plamy:
            for y in range(WYS):
                for x in range(SZER):
                    if math.hypot((x - cx) / rx, (y - cy) / ry) <= 1.0:
                        woda[y][x] = True

    # ── resztka sciezki od bramy ──────────────────────────────────────────
    # ⚠ **Rozpad jest KAWALKAMI, nie losowaniem per kafel** — i to jest jedyna
    # wersja, ktora sie czyta. Pierwsza probowala gasnac prawdopodobienstwem
    # malejacym ze wschodem; na podgladzie wyszla z tego cienka brazowa linia
    # w dziury, wygladajaca jak blad renderowania albo pekniecie, a nie jak
    # zarastajaca droga. Oko czyta CIAGLOSC: pelny odcinek, przerwa, krotszy
    # odcinek, przerwa, koniec — to jest slad, ktory sie urywa. Szum na
    # pojedynczych kaflach to zawsze usterka.
    #
    # Oba wiersze przesmyku zawsze razem: sciezka szeroka na jeden kafel przy
    # dwukaflowym przejsciu tez czytala sie jak rysa.
    odcinki = [(0, 8), (11, 15), (18, 20)]
    for x0, x1 in odcinki:
        for x in range(x0, x1):
            for y in (BRAMA_Y0, BRAMA_Y1):
                if 0 <= x < SZER:
                    sciezka[y][x] = True

    # sciezka nigdy nie biegnie po wodzie (tu nie moze sie zdarzyc, ale
    # regula jest ta sama co w lesie i ma zostac, gdyby ktos przesunal plamy)
    for y in range(WYS):
        for x in range(SZER):
            if woda[y][x]:
                sciezka[y][x] = False

    return woda, sciezka


def gestosc(woda, sciezka, polany):
    """Gestosc 0..1 na kafel. Wlasna, nie `M.pole_gestosci` — tamta ma wpisany
    gradient ku poludniowemu zachodowi lasu (tam siedzi sfora) i sciane po
    obwodzie dobrana pod 100x60.

    Trzy skladniki:
      • baza WYZSZA niz w lesie (0,66 wobec 0,52) — to jest gestwina;
      • gradient ku WSCHODOWI, czyli w glab od bramy: jedyny kierunek, jaki
        ta mapa ma, i jedyne ostrzezenie, jakie gracz dostaje;
      • przetarcia szumem, zeby byly prawdziwe przeswity — bez nich gesty
        las czyta sie jak sad, co juz raz zlapano w build_mapa.py.
    """
    # ⚠ Baza NIZSZA, a gradient w glab MOCNIEJSZY — i to nie jest to samo, co
    # "wszedzie gesto". Wersja z baza 0,78 nasycala sadzenie praktycznie na
    # calej mapie: kazdy kafel byl powyzej progu, wiec roznicy miedzy skrajem
    # a glebia po prostu nie bylo widac, a przy okazji znikaly polany. Puszcze
    # robi ROZNICA gestosci (to samo zdanie stoi w build_mapa.py) — wiec zachod
    # ma byc przechodni, a wschod ma byc sciana.
    g = np.full((WYS, SZER), 0.58)
    yy, xx = np.mgrid[0:WYS, 0:SZER]

    # sciana po obwodzie — swiat konczy sie lasem, nie pusta krawedzia
    do_krawedzi = np.minimum.reduce([xx, yy, SZER - 1 - xx, WYS - 1 - yy])
    g += 0.80 * np.clip(1.0 - do_krawedzi / 5.0, 0, 1)

    # w glab (na wschod) coraz cisniej — jedyny kierunek, jaki ta mapa ma
    g += 0.55 * np.clip((xx - 10) / float(SZER - 10), 0, 1)

    # ⚠ Szum SYMETRYCZNY. Pierwsza wersja miala uniform(-0,60; +0,35), czyli
    # srednia -0,125 na plame — sumarycznie sciagalo to gestosc calej mapy
    # ponizej bazy i przy 16 plamach dawalo srednia 0,56 mimo bazy 0,66.
    # Na podgladzie wychodzil SAD: rowny rozstaw, zaden gaszcz. Ten sam blad
    # jest opisany w build_mapa.py przy amplitudzie +-0,3 i tam tez zlapano
    # go dopiero okiem.
    for _ in range(18):
        cx, cy = nrng.uniform(0, SZER), nrng.uniform(0, WYS)
        r = nrng.uniform(4, 11)
        g += nrng.uniform(-0.50, 0.50) * np.exp(
            -((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r))

    for y in range(WYS):
        for x in range(SZER):
            if woda[y][x] or sciezka[y][x]:
                g[y, x] = -1.0
    g = M.odsun(g, woda, 1, 0.35)
    g = M.odsun(g, sciezka, 2, 0.45)
    for (px, py, r) in polany:
        d = np.hypot(xx - px, yy - py)
        g -= 1.0 * np.clip(1.0 - d / r, 0, 1)
    return np.clip(g, -1.0, 1.0)


def gatunek_dla(x, y, gest):
    """Sklad gatunkowy gestwiny. Podmieniany za `M.gatunek_dla` — patrz
    naglowek pliku.

    ⚠ Brzoza jest tu prawie nieobecna i to jest ta jedna rzecz, ktora robi
    ciemniejszy kadr bez nowej grafiki. Brzoza to najjasniejsze drzewo
    w arkuszu i gatunek swiatlolubny; puszczenie jej tutaj rownym strumieniem
    zrownaloby te mape z lasem na pierwszy rzut oka.

    ⚠ **Udzial gatunkow ciemnych ROSNIE PLYNNIE z glebokoscia, a nie skacze
    na progu.** Pierwsza wersja przelaczala sklad twardym warunkiem
    `x > SZER * 0,6` i na podgladzie bylo widac **pionowy szew przez cala
    mape**: jasna polowa i ciemna polowa, sklejone jak dwie rozne mapy.
    Zaden licznik gatunkow tego nie pokazal — sumy byly dokladnie takie,
    jakie mialy byc. Gradient musi byc gradientem takze w skladzie, nie
    tylko w liczbie drzew.
    """
    glab = x / float(SZER - 1)              # 0 przy bramie, 1 w glebi
    ciemne = 0.35 + 0.55 * glab
    if gest > 0.95:                         # najgestsze miejsca to podszyt
        ciemne = min(1.0, ciemne + 0.25)
    if rng.random() < ciemne:
        return "swierk" if rng.random() < 0.55 + 0.20 * glab else "grab"
    # Brzoza tylko plytko i tylko w przeswitach — jest najjasniejszym drzewem
    # w arkuszu i gatunkiem swiatlolubnym.
    if gest < 0.50 and rng.random() < 0.45 * (1.0 - glab):
        return "brzoza"
    return "dab" if rng.random() < 0.60 else "buk"


# ── spawny ──────────────────────────────────────────────────────────────────

def srodek(tx, ty):
    return (tx * T + T // 2, ty * T + T // 2)


# ⚠ Roster jest CELOWO ubogi i to nie jest niedokonczona robota.
#
# `docs/odlozone.md` notuje zaparkowana krzywa XP wraz z reguła: "nowa
# zawartosc nie ma dokladac do przestrzelonej puli". Cala mapa wrogow lamalaby
# ja wprost. Piec sztuk to +230 XP wobec ~945 puli lasu (+24%) — dolozone
# swiadomie i policzone, a nie przeoczone. Jesli ta mapa ma kiedys dostac
# wiecej zycia, to razem z decyzja o krzywej, nie zamiast niej.
#
# Fabularnie zreszta zgadza sie z uboga obsada: swiat.md mowi, ze gestwina ma
# sprawiac wrazenie CUDZEJ, a nie zatloczonej. Pustka robi tu wiecej niz tlum.
SPAWNY_WROGOW = [
    # sieciarze — pierwsza polowa, jeszcze "zwierzeta"
    ("spider", 21, 44),
    ("spider", 26, 15),
    # skoczki — glebia, para na koncu (trzy stosy jadu sa osiagalne tylko przy
    # parze; patrz docs/pajak_jadowity_koncepcje.md)
    ("venomspider", 40, 34),
    ("venomspider", 52, 27),
    ("venomspider", 54, 29),
]


def spawny():
    o = [("player", *srodek(WEJSCIE_DO_GESTWINY["tx"], WEJSCIE_DO_GESTWINY["ty"]))]
    for nazwa, tx, ty in SPAWNY_WROGOW:
        o.append((nazwa, *srodek(tx, ty)))
    return o


def portale():
    """Powrot do lasu. Wspolrzedne obu koncow zyja w tools/portale.py."""
    x, y = _piksele_brama_pozioma(BRAMA_GESTWINY)
    lx, ly = _piksele(WEJSCIE_DO_LASU_ZE_WSCHODU)
    return [("portal", x, y, {"target": "forest", "spawnX": lx, "spawnY": ly})]


# ── skladanie ───────────────────────────────────────────────────────────────

KOLEJNOSC = ["ground", "water", "path", "undergrowth", "bushes",
             "trees-base", "trees-over"]


def zbuduj():
    # Polany: jedna przy bramie (zeby wejscie nie bylo od razu sciana) i dwie
    # w glebi (zeby gracz mial gdzie walczyc — walka w litym gaszczu przy
    # kamerze pokazujacej ~11 kafli jest nieczytelna).
    polany = [(5, BRAMA_GESTWINY["ty"], 6), (24, 43, 5), (52, 28, 6)]

    woda, sciezka = ksztalt_swiata()

    arkusz = {"ground": M.FIRST_TEREN, "water": M.FIRST_TEREN,
              "path": M.FIRST_TEREN, "undergrowth": M.FIRST_NATURE,
              "bushes": M.FIRST_NATURE,
              "trees-base": M.FIRST_NATURE, "trees-over": M.FIRST_NATURE}
    L = {n: M.Warstwa(n, fg) for n, fg in arkusz.items()}

    for y in range(WYS):
        for x in range(SZER):
            L["ground"].set(x, y, rng.choices(M.TRAWA, M.TRAWA_WAGI)[0])

    M.maluj_obszar(L["water"], woda, "woda")
    M.maluj_obszar(L["path"], sciezka, "sciezka")

    zakazy = M.pusta_maska()
    for y in range(WYS):
        for x in range(SZER):
            zakazy[y][x] = woda[y][x] or sciezka[y][x]
    # Wokol kazdego spawnu musi byc miejsce — drzewo posadzone na przeciwniku
    # albo na punkcie ladowania daje wroga wrosnietego w pien.
    for nazwa, px, py in spawny():
        r = 96 if nazwa == "player" else 48
        for y in range(WYS):
            for x in range(SZER):
                if math.hypot(x * T + 16 - px, y * T + 16 - py) < r:
                    zakazy[y][x] = True
    # ⚠ Przesmyk musi zostac PRZECHODNI. Sciana po obwodzie (`gestosc`) stawia
    # tu pas gestwiny, wiec bez tego brama byla by zarosnieta i jedyne
    # przejscie miedzy mapami byloby zablokowane drzewem.
    for y in range(BRAMA_Y0 - 1, BRAMA_Y1 + 2):
        for x in range(0, 6):
            if 0 <= y < WYS:
                zakazy[y][x] = True

    gest = gestosc(woda, sciezka, polany)

    # Podmiana skladu gatunkowego i profilu sadzenia na czas sadzenia — patrz
    # naglowek pliku.
    #
    # ⚠ Wiecej PRZEBIEGOW, nie wyzsze szanse. Las robi dwa podejscia na klase;
    # przy nasyceniu (a gestwina nasyca sie prawie wszedzie) o liczbie drzew
    # decyduje nie szansa, tylko to, ile razy male drzewa dostana szanse
    # wejsc w luki zostawione przez duze. Podnoszenie samej szansy nie robilo
    # praktycznie nic: zmierzone 670 -> 684 drzewa mimo bazy podniesionej
    # z 0,66 do 0,78.
    stary_gatunek, stary_przebieg, stary_prob = M.gatunek_dla, M.PRZEBIEGI, M.PROB
    M.gatunek_dla = gatunek_dla
    M.PRZEBIEGI = [("duze", 0.60, 0.90), ("srednie", 0.32, 0.85), ("male", 0.05, 0.80)]
    M.PROB = 3
    try:
        zajete = M.pusta_maska()
        drzewa = M.sadz(gest, zajete, zakazy)
    finally:
        M.gatunek_dla, M.PRZEBIEGI, M.PROB = stary_gatunek, stary_przebieg, stary_prob

    for nazwa, x0, y0 in drzewa:
        _n, k0, w0, sz, wy, _g = M.DRZEWO[nazwa]
        for dy in range(wy):
            for dx in range(sz):
                lok = (w0 + dy) * COLS + (k0 + dx)
                if lok in M.PUSTE:
                    continue
                cel = "trees-base" if dy == wy - 1 else "trees-over"
                L[cel].set(x0 + dx, y0 + dy, lok)

    for y in range(WYS):
        for x in range(SZER):
            if zajete[y][x] or woda[y][x] or sciezka[y][x]:
                continue
            g = max(float(gest[y, x]), 0.0)
            # Runa wiecej niz w lesie: w gestwinie ma byc czym brodzic.
            if rng.random() < 0.08 + 0.14 * g:
                L["undergrowth"].set(x, y, rng.choice(M.KEPKI))
            elif rng.random() < 0.03 + 0.07 * g:
                L["bushes"].set(x, y, rng.choice(M.KRZAKI))

    return L, drzewa, woda, sciezka, gest


def plik_mapy(L, prefiks):
    warstwy = [L[n].json(i + 1) for i, n in enumerate(KOLEJNOSC)]
    wszystkie = [(n, x, y, None) for n, x, y in spawny()] + list(portale())
    warstwy.append({
        "draworder": "topdown", "id": len(KOLEJNOSC) + 1, "name": "objects",
        "opacity": 1, "type": "objectgroup", "visible": True, "x": 0, "y": 0,
        "objects": [M._obiekt(i + 1, n, x, y, wl)
                    for i, (n, x, y, wl) in enumerate(wszystkie)],
    })
    return {
        "compressionlevel": -1, "height": WYS, "infinite": False,
        "layers": warstwy, "nextlayerid": len(warstwy) + 1,
        "nextobjectid": len(wszystkie) + 1, "orientation": "orthogonal",
        "renderorder": "right-down", "tiledversion": "1.10.2",
        "tileheight": T, "tilewidth": T, "type": "map", "version": "1.10",
        "width": SZER,
        "tilesets": [
            M.tileset("Teren", "Teren.png", M.FIRST_TEREN, 395, 228, prefiks),
            M.tileset("Nature", "Nature.png", M.FIRST_NATURE, 230, 133, prefiks),
        ],
    }


# ── raport ──────────────────────────────────────────────────────────────────

def raport(L, drzewa, woda, sciezka, gest):
    print("Wschodnia Gestwina — %dx%d kafli (%dx%d px)"
          % (SZER, WYS, SZER * T, WYS * T))
    print("  drzewa: %d" % len(drzewa))
    ile = {}
    for nazwa, _x, _y in drzewa:
        ile[M.DRZEWO[nazwa][5]] = ile.get(M.DRZEWO[nazwa][5], 0) + 1
    print("  gatunki: " + ", ".join("%s %d" % kv for kv in sorted(ile.items())))
    print("  woda: %d kafli, sciezka (resztka): %d kafli"
          % (sum(map(sum, woda)), sum(map(sum, sciezka))))
    print("  srednia gestosc: %.2f  (las ma baze 0,52, ta mapa 0,66)"
          % float(np.clip(gest, 0, 1).mean()))

    print("\nReguly:")
    ok = True

    # 1. Przesmyk przechodni: zadnego pnia w pasie bramy.
    zablokowane = [(x, y) for y in range(BRAMA_Y0, BRAMA_Y1 + 1)
                   for x in range(0, 6) if L["trees-base"].get(x, y)]
    ok &= _regula("przesmyk wolny od pni", not zablokowane,
                  "zajete kafle: %s" % zablokowane)

    # 2. Punkt ladowania nie stoi w wodzie ani pod drzewem.
    lx, ly = WEJSCIE_DO_GESTWINY["tx"], WEJSCIE_DO_GESTWINY["ty"]
    ok &= _regula("punkt ladowania czysty",
                  not woda[ly][lx] and not L["trees-base"].get(lx, ly), "")

    # 3. Kazdy wrog stoi na wolnym kaflu.
    kolizje = [(n, tx, ty) for n, tx, ty in SPAWNY_WROGOW
               if woda[ty][tx] or L["trees-base"].get(tx, ty)]
    ok &= _regula("wrogowie na wolnych kaflach", not kolizje, str(kolizje))

    # 4. Zaden wrog nie stoi w zasiegu punktu ladowania. Gracz wchodzacy przez
    #    brame nie moze byc atakowany, zanim zobaczy mape. SPIDER.aggroRange
    #    to 230 px — bierzemy zapas.
    px, py = srodek(lx, ly)
    blisko = [(n, round(math.dist((px, py), srodek(tx, ty))))
              for n, tx, ty in SPAWNY_WROGOW
              if math.dist((px, py), srodek(tx, ty)) < 320]
    ok &= _regula("wrogowie > 320 px od wejscia", not blisko, str(blisko))

    # 5. Skoczki GLEBIEJ niz sieciarze. To jest regula fabularna z swiat.md
    #    ("sieciarza mozna spotkac przypadkiem, skoczka dopiero gdy sie
    #    poszlo dalej"), a nie estetyka — dlatego jest sprawdzana.
    najdalszy_sieciarz = max(tx for n, tx, _ in SPAWNY_WROGOW if n == "spider")
    najblizszy_skoczek = min(tx for n, tx, _ in SPAWNY_WROGOW if n == "venomspider")
    ok &= _regula("skoczki glebiej niz sieciarze",
                  najblizszy_skoczek > najdalszy_sieciarz,
                  "sieciarz do x=%d, skoczek od x=%d"
                  % (najdalszy_sieciarz, najblizszy_skoczek))

    # 6. Para skoczkow rzeczywiscie jest para (musza sie nawzajem dosiegnac
    #    w jednej walce, inaczej trzeci stos jadu jest nieosiagalny).
    sk = [srodek(tx, ty) for n, tx, ty in SPAWNY_WROGOW if n == "venomspider"]
    pary = [round(math.dist(a, b)) for i, a in enumerate(sk) for b in sk[i + 1:]]
    ok &= _regula("istnieje para skoczkow < 160 px", min(pary) < 160,
                  "odleglosci: %s" % pary)

    print("\n%s" % ("Wszystkie reguly OK." if ok else "SA BLEDY — patrz wyzej."))
    return ok


def _regula(nazwa, warunek, detal):
    print("  %-38s %s%s" % (nazwa, "OK" if warunek else "BLAD",
                            "" if warunek or not detal else "  (%s)" % detal))
    return bool(warunek)


def render_podglad(L, plik):
    """Zlozony obraz calej mapy. Trzy bledy ukladu lasu zlapano TYLKO tak —
    patrz build_mapa.py. Ta mapa dostaje ten sam test na oko."""
    ark_teren = np.array(Image.open(os.path.join(ASSETS, "Teren.png")).convert("RGBA"))
    ark_nature = np.array(Image.open(os.path.join(ASSETS, "Nature.png")).convert("RGBA"))
    PITCH = 33
    out = np.zeros((WYS * T, SZER * T, 4), np.uint8)

    def wklej(warstwa, ark, first_gid):
        for y in range(WYS):
            for x in range(SZER):
                gid = warstwa.get(x, y)
                if not gid:
                    continue
                lok = gid - first_gid
                k, w = lok % COLS, lok // COLS
                kaf = ark[w * PITCH:w * PITCH + T, k * PITCH:k * PITCH + T]
                if kaf.shape[:2] != (T, T):
                    continue
                a = kaf[..., 3:4].astype(float) / 255.0
                y0, x0 = y * T, x * T
                out[y0:y0 + T, x0:x0 + T, :3] = (
                    kaf[..., :3] * a + out[y0:y0 + T, x0:x0 + T, :3] * (1 - a))
                out[y0:y0 + T, x0:x0 + T, 3] = np.maximum(
                    out[y0:y0 + T, x0:x0 + T, 3], kaf[..., 3])

    for nazwa, ark, fg in (("ground", ark_teren, M.FIRST_TEREN),
                           ("water", ark_teren, M.FIRST_TEREN),
                           ("path", ark_teren, M.FIRST_TEREN),
                           ("undergrowth", ark_nature, M.FIRST_NATURE),
                           ("bushes", ark_nature, M.FIRST_NATURE),
                           ("trees-base", ark_nature, M.FIRST_NATURE),
                           ("trees-over", ark_nature, M.FIRST_NATURE)):
        wklej(L[nazwa], ark, fg)

    Image.fromarray(out).convert("RGB").save(plik)
    print("-> %s (%dx%d)" % (plik, out.shape[1], out.shape[0]))


def main(zapisz, podglad):
    L, drzewa, woda, sciezka, gest = zbuduj()
    ok = raport(L, drzewa, woda, sciezka, gest)
    if podglad:
        render_podglad(L, podglad)
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    if not ok:
        print("\nNIE zapisano — najpierw napraw reguly.")
        return
    sciezka_pliku = os.path.join(MAPY, "thicket-gestwina.tmj")
    with open(sciezka_pliku, "w", encoding="utf-8") as f:
        json.dump(plik_mapy(L, "../"), f, ensure_ascii=False)
    print("-> %s" % os.path.relpath(sciezka_pliku, os.path.join(TU, "..")))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Generuje mape Wschodniej Gestwiny. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true", help="nadpisz thicket-gestwina.tmj")
    ap.add_argument("--podglad", metavar="PLIK.png", help="zloz cala mape do PNG")
    a = ap.parse_args()
    main(a.zapisz, a.podglad)

"""
Generator wioski (Zagaje) -> public/assets/maps/village-zagaje.tmj

Uruchom:  python tools/build_wioska.py            (raport, NIC nie zapisuje)
          python tools/build_wioska.py --zapisz   (nadpisuje village-zagaje.tmj)
          python tools/build_wioska.py --podglad X.png   (caly obraz mapy)

Tylko JEDEN plik .tmj — public/assets/maps/village-zagaje.tmj. Do 2026-08-07
istnial tez drugi, "wygodny" egzemplarz w public/assets/ (inna wzgledna
sciezka do PNG-ow, do otwierania w Tiled z tamtego miejsca) — usuniety,
bo dwie kopie moga sie rozjechac, gdy ktos edytuje tylko jedna w Tiled
(dokladnie to sie stalo: Kowal stal w dwoch roznych miejscach w dwoch
plikach, a ten, ktory czyta gra, byl tym NIEaktualnym). Otwieraj do edycji
wprost public/assets/maps/village-zagaje.tmj — wzgledne sciezki do PNG-ow
(`../Teren.png` itd.) sa poprawne dla tej lokalizacji.

── CO TO JEST I CZEGO TU CELOWO NIE MA ─────────────────────────────────────

Pierwszy przebieg wioski: 100x100 kafli, polaczona z lasem jedna brama (patrz
tools/portale.py). Budynki sa ZE ZWYKLEGO kompletu modulowego
(tools/build_budynki.py) — bez ani jednego nowego kafla. To jest decyzja,
nie ograniczenie: docs/swiat.md opisuje mlyn, studnie, tablice zlecen
i prawdziwa palisade, a zaden z tych elementow nie ma jeszcze grafiki. Zamiast
substytuowac je kaflami, ktore i tak trzeba bedzie podmienic (dokladnie ten
blad, ktory kosztowal czas przy komin/kalenica w Buildings.png), te elementy
PO PROSTU NIE STOJA na mapie jeszcze. Zagroda zerdziowa (`zagroda_*`) oznacza
tu wylacznie prog przy bramie — nie udaje pelnej palisady, ktora zostaje
w CLAUDE.md jako ⏳.

NPC (soltys, kowal, myśliwy) tez nie sa tu wpiete: przeniesienie kupca/kowala
z lasu do wioski jest osobna decyzja (maja wlasne zmierzone odleglosci do
ogniska w lesie) i explicite odlozone na potem.

── DLACZEGO IMPORTUJE build_mapa, A NIE ODWROTNIE ──────────────────────────

`kafle_domu`, `wysokosc_budynku`, katalog `BUDYNKI`/`ARKUSZ_B`, paleta trawy
i katalog gatunkow drzew sa w 100% niezalezne od rozmiaru mapy — dzialaja na
wspolrzednych WZGLEDNYCH budynku, nie na SZER/WYS lasu. Bezpiecznie importowac
je wprost. Trzy narzedzia (`Warstwa`, `maluj_obszar`, `pusta_maska`) NIE sa
niezalezne: czytaja SZER/WYS jako zmienne GLOBALNE modulu `build_mapa`, nie
jako argumenty. Podmieniamy je na wartosci wioski PRZED pierwszym uzyciem —
Python szuka nazw globalnych w slowniku modulu w momencie WYWOLANIA funkcji,
nie jej definicji, wiec to dziala poprawnie. Bezpieczne, bo kazdy generator
jest uruchamiany jako OSOBNY proces (`python tools/build_XXX.py`) — nie ma
tu drugiego uzytkownika modulu `build_mapa`, ktoremu podmieniona wartosc
mogloaby zaszkodzic.

Gestosc lasu w wiosce NIE jest przeniesiona z lasu (`pole_gestosci`/`sadz`/
`odsun`/`gatunek_dla` zostaja w build_mapa.py, nieuzywane tutaj) — to
oczyszczona osada, nie puszcza, i potrzebuje dużo prostszego, rzadkiego
rozrzutu drzew przy krawedziach mapy, nie gradientu gestosci. Napisany
osobno, nizej.
"""

import argparse
import json
import os
import random
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import build_mapa as M  # noqa: E402
from portale import (  # noqa: E402
    BRAMA_WIOSKI, WEJSCIE_DO_WIOSKI, WEJSCIE_DO_LASU,
    piksele as _piksele, piksele_brama as _piksele_brama,
)

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
MAPY = os.path.join(ASSETS, "maps")

T = M.T
COLS = M.COLS
SZER, WYS = 100, 100

# Patrz docstring modulu: to jest jedyne miejsce, w ktorym wolno dotknac tych
# globali modulu build_mapa, i musi wykonac sie PRZED pierwszym wywolaniem
# ktoregokolwiek z jego narzedzi.
M.SZER, M.WYS = SZER, WYS
M.rng = random.Random(20250803)

TRAWA, TRAWA_WAGI = M.TRAWA, M.TRAWA_WAGI
KEPKI, KRZAKI = M.KEPKI, M.KRZAKI
DRZEWO, KAFLE_DRZEW = M.DRZEWO, M.KAFLE_DRZEW
SREDNIE, MALE = M.SREDNIE, M.MALE
rng = M.rng


# ── budynki wioski ───────────────────────────────────────────────────────────
#
# (x, y) to lewy-gorny kafel DACHU, ta sama konwencja co BUDYNKI_NA_MAPIE
# w build_mapa.py. Uklad: droga biegnie pionowo w kolumnach 50-51; zagroda
# gospodarcza (dom gracza) po zachodniej stronie, reszta wsi po wschodniej.
#
# D-5 (wioska_plan.md, rozstrzygniete): budynek pod x=30/y=45 nazywal sie
# tu kiedys "dom gracza", ale ten tytul przejal Dobek (najwieksze
# gospodarstwo zbozowe) — rodzina gracza mieszka w mniejszej "chata
# zachod" nizej na liscie. Nazwa w generatorze jest teraz zgodna z tym,
# co faktycznie stoi w .tmj (patrz wioska_plan.md §1.2b/D-5).
BUDYNKI_WIOSKI = [
    dict(nazwa="chalupa Dobka", x=30, y=45, szer=8, sciana=5, styl="szczyt",
         material="bale", drzwi=4, okna=(2, 6), okno_szczyt=True, komin=True),
    dict(nazwa="stodola", x=18, y=45, szer=10, sciana=6, styl="szczyt",
         material="deski", wrota=4, otwor_siana=True),
    dict(nazwa="kurnik", x=18, y=56, szer=6, sciana=4, styl="szczyt",
         material="deski", klapa=3),
    dict(nazwa="obora", x=16, y=66, szer=8, sciana=5, styl="szczyt",
         material="deski", drzwi_pol=4, okna=(2,), okno_szczyt=True),
    dict(nazwa="chata zachod", x=22, y=79, szer=6, sciana=4, styl="szczyt",
         material="bale", drzwi=3, okna=(1,), komin=True),
    dict(nazwa="chata wschod 1", x=58, y=45, szer=6, sciana=4, styl="szczyt",
         material="bale", drzwi=3, okna=(1,), komin=True),
    dict(nazwa="soltys", x=58, y=60, szer=8, sciana=5, styl="szczyt",
         material="bale", drzwi=4, okna=(2, 6), okno_szczyt=True, komin=True),
    dict(nazwa="chata wschod 2", x=60, y=76, szer=6, sciana=4, styl="szczyt",
         material="bale", drzwi=3, okna=(1,), komin=True),
    # Kuznia — przeniesiona z lasu (byla obok mysliwego, dymiacy piec
    # ploszylby mu zwierzyne; docs/swiat.md i tak mowi, ze miejsce kowala
    # jest w wiosce). Stoi w luce miedzy zachodnim klastrem zagrod
    # (konczy sie x27) a placem (zaczyna sie x44) — PLANK, nie bale, tak
    # samo jak w lesie: rzemioslo kowala nie jest budownictwem chlopskim.
    dict(nazwa="kuznia", x=34, y=54, szer=6, sciana=3, styl="szczyt",
         material="deski", drzwi=3, okna=(1, 4), okno_szczyt=True, komin=True),
]

# Podworze kowala: sprzet z Kuznia.png tuz przed drzwiami. UKLAD (co stoi
# gdzie i dlaczego) jest we wspoldzielonym `M.KUZNIA_WYPOSAZENIE` — patrz
# obszerny komentarz nad ta lista w build_mapa.py. Tu tylko KOTWICA: budynek
# konczy sie na y=60 (y=54 + wysokosc_budynku 7 - 1), podworze zaczyna sie
# NATYCHMIAST po niej (y=61, zero przerwy — "tuz przed drzwiami", nie kawalek
# dalej), a x=31 = 34 (x budynku) - 3, ta sama relacja co byla w lesie,
# zeby drzwi (lokalna kolumna 3) wypadaly nad goracym katem podworza.
KUZNIA_X0, KUZNIA_Y0 = 31, 61
KUZNIA_X1 = KUZNIA_X0 + max(dx for _n, dx, _dy in M.KUZNIA_WYPOSAZENIE)
KUZNIA_Y1 = KUZNIA_Y0 + max(dy for _n, _dx, dy in M.KUZNIA_WYPOSAZENIE)


def _obrys_budynku(b):
    """(x0, y0, x1, y1) wlacznie, w kaflach — cala bryla (dach + sciany)."""
    wys = M.wysokosc_budynku(b)
    return b["x"], b["y"], b["x"] + b["szer"] - 1, b["y"] + wys - 1


def sprawdz_kolizje(budynki, droga_x0, droga_x1):
    """Rzuca AssertionError z czytelnym opisem przy pierwszej kolizji.

    To jest zamiennik recznego przeliczania wspolrzednych na kartce — ten sam
    blad (dwa budynki nachodzace na siebie o kilka kafli) jest tu wykryty od
    razu, zamiast dopiero na zlozonym podgladzie.
    """
    obrysy = [(b["nazwa"], _obrys_budynku(b)) for b in budynki]
    for i in range(len(obrysy)):
        n1, (ax0, ay0, ax1, ay1) = obrysy[i]
        if ax1 >= droga_x0 and ax0 <= droga_x1:
            raise AssertionError("%s wchodzi na droge (x %d-%d)" % (n1, ax0, ax1))
        for j in range(i + 1, len(obrysy)):
            n2, (bx0, by0, bx1, by1) = obrysy[j]
            if ax0 <= bx1 and bx1 >= ax0 and ax0 <= bx1 and bx0 <= ax1 and by0 <= ay1 and ay0 <= by1:
                raise AssertionError("%s (%d-%d,%d-%d) koliduje z %s (%d-%d,%d-%d)"
                                      % (n1, ax0, ax1, ay0, ay1, n2, bx0, bx1, by0, by1))


# ── droga i plac ─────────────────────────────────────────────────────────────

DROGA_X0, DROGA_X1 = 50, 51        # kolumny drogi, dwa kafle szerokosci
DROGA_Y_GORA = 20                  # jak daleko na polnoc siega droga
PLAC = dict(x0=44, y0=57, x1=56, y1=63)   # plac przy skrzyzowaniu, wokol studni (na razie pusty)


def narysuj_droge(sciezka):
    for y in range(DROGA_Y_GORA, WYS):
        for x in range(DROGA_X0, DROGA_X1 + 1):
            sciezka[y][x] = True
    for y in range(PLAC["y0"], PLAC["y1"] + 1):
        for x in range(PLAC["x0"], PLAC["x1"] + 1):
            sciezka[y][x] = True


# ── zagroda przy bramie (prog, NIE pelna palisada — patrz docstring) ────────

def narysuj_prog(nakl, budynki_kafle):
    """Krotki plot po obu stronach drogi przy bramie — sygnalizuje "tu jest
    wejscie", nie ogradza wsi. Prawdziwa palisada to osobny komplet kafli,
    ktorego jeszcze nie ma (CLAUDE.md, Village, ⏳)."""
    y = BRAMA_WIOSKI["ty"] - 3
    for x0, x1 in ((DROGA_X0 - 9, DROGA_X0 - 1), (DROGA_X1 + 1, DROGA_X1 + 9)):
        szer = x1 - x0 + 1
        for i, x in enumerate(range(x0, x1 + 1)):
            pozycja = -1 if i == 0 else (1 if i == szer - 1 else 0)
            nakl[(x, y)] = "zagroda_%d" % (0 if pozycja == -1 else (2 if pozycja == 1 else 1))


# ── budowa jednej warstwy budynkow ──────────────────────────────────────────

def polacz_budynki(L, budynki_kafle):
    for b in BUDYNKI_WIOSKI:
        spod, nakl, dach = M.kafle_domu(b)
        for warstwa, zestaw in (("buildings", spod), ("buildings-detale", nakl),
                                ("buildings-over", dach)):
            for (x, y), nazwa in zestaw.items():
                kafel = M.BUDYNKI.get(nazwa)
                if not kafel:
                    print("  UWAGA: brak kafla '%s' w docs/budynki.json" % nazwa)
                    continue
                L[warstwa].set(x, y, kafel["id"])
                if 0 <= y < WYS and 0 <= x < SZER:
                    budynki_kafle[y][x] = True


# ── drzewa: rzadka obwodka, nie gestosc puszczy ─────────────────────────────
#
# Wioska jest oczyszczona z lasu — drzewa staja przy krawedziach mapy (rama,
# tak jak dziedziniec wsi w materiale referencyjnym) i pojedynczo w srodku,
# nigdy w zwartych kepach. To swiadomie DUZO prostsze niz `pole_gestosci` +
# `sadz` w build_mapa.py: ten sam mechanizm dawalby las tam, gdzie ma byc
# trawnik.

def zbierz_drzewa(zakazy):
    zajete = M.pusta_maska()
    posadzone = []
    rng2 = random.Random(20250804)
    kandydaci = [n for n in (SREDNIE + MALE)]

    def wolne(nazwa, x0, y0):
        sz_wy = DRZEWO[nazwa]
        sz, wy = sz_wy[3], sz_wy[4]
        if x0 < 0 or y0 < 0 or x0 + sz > SZER or y0 + wy > WYS:
            return False
        for dx, dy, _lok in KAFLE_DRZEW[nazwa]:
            if zajete[y0 + dy][x0 + dx]:
                return False
        for dx in range(sz):
            if zakazy[y0 + wy - 1][x0 + dx]:
                return False
        return True

    def probuj(x, y, waga_male=0.75):
        nazwa = rng2.choice(MALE if rng2.random() < waga_male else SREDNIE)
        sz, wy = DRZEWO[nazwa][3], DRZEWO[nazwa][4]
        x0, y0 = x - sz // 2, y - wy + 1
        if not wolne(nazwa, x0, y0):
            return
        for dx, dy, _lok in KAFLE_DRZEW[nazwa]:
            zajete[y0 + dy][x0 + dx] = True
        posadzone.append((nazwa, x0, y0))

    # rama: pas RAMA_SZER kafli od kazdej krawedzi, gesciej niz srodek
    RAMA = 8
    for y in range(WYS):
        for x in range(SZER):
            w_ramie = x < RAMA or x >= SZER - RAMA or y < RAMA or y >= WYS - RAMA
            if not w_ramie:
                continue
            if zakazy[y][x]:
                continue
            if rng2.random() < 0.22:
                probuj(x, y)

    # srodek: bardzo rzadki rozrzut, zeby plac nie byl calkiem goly
    for _ in range(70):
        x, y = rng2.randrange(RAMA, SZER - RAMA), rng2.randrange(RAMA, WYS - RAMA)
        if not zakazy[y][x] and rng2.random() < 0.12:
            probuj(x, y, waga_male=0.9)

    return posadzone


# ── spawny ───────────────────────────────────────────────────────────────────

def spawny():
    px, py = _piksele(WEJSCIE_DO_WIOSKI)
    o = [("player", px, py)]
    # Kowal stoi PRZED kowadlem (dx=4, dy=4 w M.KUZNIA_WYPOSAZENIE), jeden
    # rzad na poludnie od niego — patrzy w strone kowadla/pieca, plecami do
    # wystawy. Ten sam wzor co mial w lesie (patrz historia w build_mapa.py).
    kowal = ((KUZNIA_X0 + 4) * T + T // 2, (KUZNIA_Y0 + 5) * T + T // 2)
    o.append(("blacksmith", *kowal))
    return o


def portale():
    x, y = _piksele_brama(BRAMA_WIOSKI)
    fx, fy = _piksele(WEJSCIE_DO_LASU)
    return [("portal", x, y, {"target": "forest", "spawnX": fx, "spawnY": fy})]


# ── skladanie planszy ────────────────────────────────────────────────────────

def zbuduj():
    sprawdz_kolizje(BUDYNKI_WIOSKI, DROGA_X0, DROGA_X1)

    arkusz = {"ground": M.FIRST_TEREN, "path": M.FIRST_TEREN,
              "undergrowth": M.FIRST_NATURE, "bushes": M.FIRST_NATURE,
              "buildings": M.FIRST_BUILDINGS, "buildings-detale": M.FIRST_BUILDINGS,
              "wyposazenie": M.FIRST_KUZNIA,
              "trees-base": M.FIRST_NATURE, "trees-over": M.FIRST_NATURE,
              "buildings-over": M.FIRST_BUILDINGS}
    L = {n: M.Warstwa(n, fg) for n, fg in arkusz.items()}

    for y in range(WYS):
        for x in range(SZER):
            L["ground"].set(x, y, rng.choices(TRAWA, TRAWA_WAGI)[0])

    sciezka = M.pusta_maska()
    narysuj_droge(sciezka)
    # podworze kowala dostaje LATE UBITEJ ZIEMI pod caly sprzet, wlaczona w
    # maske PRZED `maluj_obszar` — droga i podworze to jeden spojny ksztalt
    # z poprawnie policzonymi krawedziami (blob 47), nie dwie oddzielne
    # łaty. Ten sam trik, ktorym rozwiazano "sprzet wyglada jak wklejone
    # ikonki" w lesie — patrz historia w build_mapa.py.
    for y in range(KUZNIA_Y0 - 1, KUZNIA_Y1 + 2):
        for x in range(KUZNIA_X0 - 1, KUZNIA_X1 + 2):
            if 0 <= x < SZER and 0 <= y < WYS:
                sciezka[y][x] = True
    M.maluj_obszar(L["path"], sciezka, "sciezka")

    budynki_kafle = M.pusta_maska()
    polacz_budynki(L, budynki_kafle)

    # podworze kowala — sprzet z Kuznia.png, plaskie kafle na wlasnej warstwie
    # (patrz M.KUZNIA_WYPOSAZENIE). Nie idzie przez kafle_domu: to nie sciana
    # ani dach, tylko rekwizyty stojace na ubitej ziemi kolo kuzni.
    for nazwa, dx, dy in M.KUZNIA_WYPOSAZENIE:
        kafel = M.KUZNIA.get(nazwa)
        if not kafel:
            print("  UWAGA: brak kafla '%s' w docs/kuznia.json" % nazwa)
            continue
        x, y = KUZNIA_X0 + dx, KUZNIA_Y0 + dy
        L["wyposazenie"].set(x, y, kafel["id"])
        budynki_kafle[y][x] = True

    nakl_prog = {}
    narysuj_prog(nakl_prog, budynki_kafle)
    for (x, y), nazwa in nakl_prog.items():
        kafel = M.BUDYNKI.get(nazwa)
        if kafel:
            L["buildings-detale"].set(x, y, kafel["id"])

    zakazy = M.pusta_maska()
    for y in range(WYS):
        for x in range(SZER):
            zakazy[y][x] = sciezka[y][x] or budynki_kafle[y][x]
    # obwodka wokol kazdego budynku, ten sam powod co w lesie: drzewo tuz przy
    # scianie wchodzi w nia korona
    for b in BUDYNKI_WIOSKI:
        x0, y0, x1, y1 = _obrys_budynku(b)
        for y in range(y0 - 2, y1 + 3):
            for x in range(x0 - 1, x1 + 2):
                if 0 <= x < SZER and 0 <= y < WYS:
                    zakazy[y][x] = True
    # ta sama obwodka o 1 kafel dla podworza kowala — bez niej drzewo
    # posadzone tuz obok moglo zwiesic korone nad kowadlem
    for y in range(KUZNIA_Y0 - 1, KUZNIA_Y1 + 2):
        for x in range(KUZNIA_X0 - 1, KUZNIA_X1 + 2):
            if 0 <= x < SZER and 0 <= y < WYS:
                zakazy[y][x] = True
    # brama i miejsce startu — bez tego drzewo moze wyladowac dokladnie na
    # progu, ktory ma czytac sie jako wejscie
    for nazwa, px, py in spawny() + [(n, x, y) for n, x, y, _ in portale()]:
        for y in range(WYS):
            for x in range(SZER):
                if (x * T + 16 - px) ** 2 + (y * T + 16 - py) ** 2 < 70 ** 2:
                    zakazy[y][x] = True

    drzewa = zbierz_drzewa(zakazy)
    for nazwa, x0, y0 in drzewa:
        _n, k0, w0, sz, wy, _g = DRZEWO[nazwa]
        for dy in range(wy):
            for dx in range(sz):
                lok = (w0 + dy) * COLS + (k0 + dx)
                if lok in M.PUSTE:
                    continue
                cel = "trees-base" if dy == wy - 1 else "trees-over"
                L[cel].set(x0 + dx, y0 + dy, lok)

    zajete_runo = M.pusta_maska()
    for nazwa, x0, y0 in drzewa:
        for dx, dy, _lok in KAFLE_DRZEW[nazwa]:
            zajete_runo[y0 + dy][x0 + dx] = True
    for y in range(WYS):
        for x in range(SZER):
            if zajete_runo[y][x] or sciezka[y][x] or budynki_kafle[y][x]:
                continue
            if rng.random() < 0.05:
                L["undergrowth"].set(x, y, rng.choice(KEPKI))
            elif rng.random() < 0.02:
                L["bushes"].set(x, y, rng.choice(KRZAKI))

    return L, drzewa, sciezka


def plik_mapy(L, prefiks):
    kolejnosc = ["ground", "path", "undergrowth", "bushes", "buildings",
                 "buildings-detale", "wyposazenie", "trees-base", "trees-over",
                 "buildings-over"]
    warstwy = [L[n].json(i + 1) for i, n in enumerate(kolejnosc)]
    wszystkie = [(n, x, y, None) for n, x, y in spawny()] + list(portale())
    warstwy.append({
        "draworder": "topdown", "id": len(kolejnosc) + 1, "name": "objects",
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
            M.tileset("Buildings", "Buildings.png", M.FIRST_BUILDINGS,
                      M.ARKUSZ_B["wysokosc"], M.ARKUSZ_B["kafli"], prefiks),
            M.tileset("Kuznia", "Kuznia.png", M.FIRST_KUZNIA,
                      M.ARKUSZ_K["wysokosc"], M.ARKUSZ_K["kafli"], prefiks),
        ],
    }


def raport(L, drzewa, sciezka):
    print("wioska %dx%d kafli (%dx%d px)" % (SZER, WYS, SZER * T, WYS * T))
    for n in ("ground", "path", "undergrowth", "bushes", "buildings",
              "buildings-detale", "wyposazenie", "trees-base", "trees-over",
              "buildings-over"):
        d = [v for v in L[n].dane if v]
        print("  %-16s %5d kafli, %3d roznych" % (n, len(d), len(set(d))))
    print("\nbudynkow: %d" % len(BUDYNKI_WIOSKI))
    for b in BUDYNKI_WIOSKI:
        x0, y0, x1, y1 = _obrys_budynku(b)
        print("  %-16s x %2d-%2d  y %2d-%2d" % (b["nazwa"], x0, x1, y0, y1))
    print("\ndrzewa: %d sztuk" % len(drzewa))
    pola = SZER * WYS
    print("pokrycie: sciezka %.1f%%, drzewa %.1f%%"
          % (100 * sum(map(sum, sciezka)) / pola,
             100 * sum(1 for v in L["trees-base"].dane if v) / pola))

    bx, by = BRAMA_WIOSKI["tx"], BRAMA_WIOSKI["ty"]
    na_drodze = sciezka[by][bx] or sciezka[by][bx + 1] or sciezka[by][bx - 1]
    print("\nbrama (%d,%d) lezy na sciezce: %s  %s"
          % (bx, by, na_drodze, "OK" if na_drodze else "BLAD"))


def render_podglad(L, sciezka, plik):
    """Zlozony obraz calej mapy. Trzy bledy ukladu lasu zlapano tylko tak —
    patrz build_mapa.py — wioska dostaje ten sam test na oko."""
    ark_teren = np.array(Image.open(os.path.join(ASSETS, "Teren.png")).convert("RGBA"))
    ark_nature = np.array(Image.open(os.path.join(ASSETS, "Nature.png")).convert("RGBA"))
    ark_bud = np.array(Image.open(os.path.join(ASSETS, "Buildings.png")).convert("RGBA"))
    ark_kuz = np.array(Image.open(os.path.join(ASSETS, "Kuznia.png")).convert("RGBA"))
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

    wklej(L["ground"], ark_teren, M.FIRST_TEREN)
    wklej(L["path"], ark_teren, M.FIRST_TEREN)
    wklej(L["undergrowth"], ark_nature, M.FIRST_NATURE)
    wklej(L["bushes"], ark_nature, M.FIRST_NATURE)
    wklej(L["buildings"], ark_bud, M.FIRST_BUILDINGS)
    wklej(L["buildings-detale"], ark_bud, M.FIRST_BUILDINGS)
    wklej(L["wyposazenie"], ark_kuz, M.FIRST_KUZNIA)
    wklej(L["trees-base"], ark_nature, M.FIRST_NATURE)
    wklej(L["trees-over"], ark_nature, M.FIRST_NATURE)
    wklej(L["buildings-over"], ark_bud, M.FIRST_BUILDINGS)

    Image.fromarray(out).convert("RGB").save(plik)
    print("-> %s (%dx%d)" % (plik, out.shape[1], out.shape[0]))


def main(zapisz, podglad):
    L, drzewa, sciezka = zbuduj()
    raport(L, drzewa, sciezka)
    if podglad:
        render_podglad(L, sciezka, podglad)
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    sciezka_pliku = os.path.join(MAPY, "village-zagaje.tmj")
    with open(sciezka_pliku, "w", encoding="utf-8") as f:
        json.dump(plik_mapy(L, "../"), f, ensure_ascii=False)
    print("-> %s" % os.path.relpath(sciezka_pliku, os.path.join(TU, "..")))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generuje mape wioski. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true", help="nadpisz village-zagaje.tmj")
    ap.add_argument("--podglad", metavar="PLIK.png", help="zloz cala mape do PNG")
    a = ap.parse_args()
    main(a.zapisz, a.podglad)

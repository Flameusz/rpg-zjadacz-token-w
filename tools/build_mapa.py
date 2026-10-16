"""
Generator mapy lesnej -> public/assets/maps/forrest.tmj

Uruchom:  python tools/build_mapa.py            (raport, NIC nie zapisuje)
          python tools/build_mapa.py --zapisz   (nadpisuje oba pliki .tmj)

── PO CO TO ISTNIEJE ───────────────────────────────────────────────────────

Stara mapa odwolywala sie do kafli, ktorych juz nie ma (most, ramka stawu,
paski drog) i do arkusza 640x400, ktory ma dzis 640x230 — czytala wiec poza
zakres. Przemalowanie jej recznie w Tiled to kilka godzin klikania, a uklad
i tak byl tymczasowy. Taniej wygenerowac las skryptem i dopiescic go w Tiled.

TEN PLIK NIE JEST ZRODLEM PRAWDY DLA MAPY. Po pierwszej recznej poprawce
w Tiled zrodlem prawdy jest .tmj — ponowne uruchomienie tego skryptu skasuje
te poprawke. Dlatego domyslnie nic nie zapisuje (ta sama zasada, co
w build_tilesets.py: arkusz/mapa to ARTEFAKT, nie wynik funkcji).

── CZEGO TU CELOWO NIE MA ──────────────────────────────────────────────────

  • KOLIZJI. Zadny kafel nie dostaje ani ksztaltu, ani wlasciwosci `solid`,
    wiec caly swiat jest przechodni. To swiadoma decyzja autora projektu na
    ten etap: najpierw ma byc co ogladac, kolizje po ustaleniu ukladu.
    Kolizje sie dorabia w Tiled (Tile Collision Editor) albo wlasciwoscia
    `solid` — silnik obie sciezki juz czyta, patrz src/world/TiledMap.ts.
  • WIOSKI. Stoi jedna chata mysliwego, skladana z modulowego kompletu
    Buildings.png (patrz BUDYNKI_NA_MAPIE i kafle_domu). Osada nalezy do
    docs/swiat.md i powstanie jako osobna lokacja, nie jako chaty doklejone
    do lasu.
  • MOSTU. Nie ma dzis takiego kafla. Rzeke przekracza sie BRODEM — piaszczysta
    lawica w miejscu, gdzie droga dochodzi do wody.

── WARSTWY ─────────────────────────────────────────────────────────────────

Jedna warstwa na jeden rodzaj rzeczy, bo inaczej nie da sie tego edytowac:
poprawienie jednego drzewa w gaszczu wymagaloby wycinania go spod kepek trawy.

  ground        trawa, warianty mieszane      Teren
  water         rzeka i rozlewisko (blob 47)  Teren
  sand          brod i lawice (blob 47)       Teren
  path          drogi (blob 47)               Teren
  undergrowth   kepki trawy                   Nature
  bushes        krzaki                        Nature
  buildings         sciany domow              Buildings
  buildings-detale  drzwi i okna (nakladki)   Buildings
  buildings-over    dachy (rysowane NAD graczem)
  trees-base    DOLNY rzad kafli drzew        Nature
  trees-over    wszystko powyzej dolnego rzedu (rysowane NAD graczem)
  objects       spawny (warstwa obiektow)

Podzial drzewa na `trees-base` + `trees-over` to jedyny sposob, w jaki gracz
moze wejsc ZA drzewo: warstwa o nazwie konczacej sie na `-over` ma w silniku
glebokosc ponad wszystkimi postaciami (DEPTH.overhead), reszta jest pod nimi.
Kafel z pniem musi zostac pod spodem, inaczej korona zakrywalaby gracza
stojacego przed drzewem.

Przy edycji w Tiled: stempel calego drzewa wklei sie na JEDNA warstwe — po
wklejeniu przenies dolny rzad na `trees-base` (albo postaw drzewo na
`trees-over` i zetnij mu dol, zaleznie co wygodniejsze).

── UKLAD SWIATA ────────────────────────────────────────────────────────────

100x60 kafli (3200x1920 px) — wieksza niz stare 50x40, zeby sfora wilkow
siedziala naprawde w glebi lasu, a nie dwa ekrany od kupca. Poszerzona z 80
na 100 kolumn; caly uklad jest pozycjonowany BEZWZGLEDNIE (droga x~38, rzeka
y~20.5, chata 64,2, polany 66,9 i 38,50, brama z portale.py), wiec dodatkowe
kolumny dochodza na WSCHODZIE i nic sie nie przesuwa. Rzeka jest funkcja x,
wiec plynie dalej sama; sciana brzegowa lasu przenosi sie na nowa krawedz,
bo liczy sie ja z odleglosci do brzegu (patrz pole_gestosci).

    N       polana kupca (NE), rzadki las, rzeka na poludnie od niej
    C       droga z poludnia na polnoc, brod przez rzeke, zajace
    E/SE    gestszy las: dziki i pajaki
    SW      PUSZCZA — najgestsza czesc mapy, sfora wilkow
    krance  scianka lasu po obwodzie (gestosc rosnie przy krawedziach)

── ODLEGLOSCI SPAWNOW SA NOSNE, NIE DEKORACYJNE ────────────────────────────

Wypisane w raporcie i sprawdzane przy kazdym uruchomieniu (patrz `raport`):
trzy wilki musza sie widziec nawzajem w promieniu wycia (WOLF.pack.callRadius
= 200), a Szary musi byc POZA nim, inaczej jedno wycie sciaga elita z 190 HP
do walki z trojka wilkow. Ognisko musi byc dalej od kupca niz suma ich
zasiegow interakcji (48 + 44 = 92), inaczej jedno `E` odpala oba.
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
from portale import (  # noqa: E402
    BRAMA_LAS, WEJSCIE_DO_WIOSKI, piksele as _piksele, piksele_brama as _piksele_brama,
)

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))
MAPY = os.path.join(ASSETS, "maps")

T = 32           # kafel
PITCH = 33       # skok w arkuszu
COLS = 19        # kolumn w obu arkuszach — patrz public/assets/README.md

# ⚠ Zmiana SZER/WYS PRZELICZA CALA MAPE, nie tylko dokleja pas. Srodki szumu
# pola gestosci losuje sie z uniform(0, SZER), wiec inna szerokosc daje inny
# uklad drzew i trawy na CALEJ mapie (zmierzone przy 80->100: sciezka, brod i
# budynki bez zmian, ale ~1550 kafli trees-base i ~3700 wariantow ground
# innych). Rzeczy o wspolrzednych bezwzglednych nie drgna.
# Konsekwencja, o ktorej latwo zapomniec: stanowiska ziol z rozstaw_ziola.py
# byly dobierane pod STARY uklad drzew (siedlisko slonce/cien), wiec po
# przeliczeniu trzeba je postawic od nowa, inaczej rumianek trafi w cien.
SZER, WYS = 100, 60         # mapa w kaflach
FIRST_TEREN = 1
FIRST_NATURE = 229          # = 1 + 12 wierszy * 19 kolumn Teren.png
FIRST_BUILDINGS = 362       # = 229 + 7 wierszy * 19 kolumn Nature.png
FIRST_KUZNIA = 495          # = 362 + 7 wierszy * 19 kolumn Buildings.png

rng = random.Random(20240802)
nrng = np.random.default_rng(20240802)


# ── katalog kafli ───────────────────────────────────────────────────────────

def wczytaj_kafle():
    return json.load(open(os.path.join(DOCS, "kafle.json"), encoding="utf-8"))


KAFLE = wczytaj_kafle()

# Teren, wiersz 0: trawa czysta .. b. gesta (kolumny 0-5).
TRAWA = [0, 1, 2, 3, 4, 5]
# Wagi: przewaga wariantow rzadszych, gestsze jako akcent. Malujac duze
# polacie MIESZA sie warianty — jeden kafel powtorzony tysiac razy odslania
# ukosna krate (public/assets/README.md, "trzecia pulapka").
TRAWA_WAGI = [0.30, 0.26, 0.20, 0.12, 0.08, 0.04]

# blob 47: maska osmiu sasiadow -> lokalne id kafla w Teren.png
BLOB = {n: {int(k): int(v) for k, v in m.items()}
        for n, m in KAFLE["obszarowe"].items()}

# Nature: kepki trawy i krzaki
KEPKI = [int(k) for k, v in KAFLE["nature"].items() if v.startswith("kepka")]
KRZAKI = [int(k) for k, v in KAFLE["nature"].items() if v.startswith("krzak")]

# Nature: katalog drzew — (nazwa, kolumna, wiersz, szerokosc, wysokosc).
# Zrodlo: tools/build_drzewa.py, stala DRZEWA. Trzymane tu jako kopia, bo
# import ciagnalby caly generator grafiki dla pieciu liczb.
#
# ⚠ NIEAKTUALNE OD 2026-08-28 wzgledem zywej `forrest.tmj`. Warstwy
# `trees-base`/`trees-over` mapy zostaly przepiete z arkusza `Nature` na nowy
# tileset `Forrest` (`tools/build_forrest_atlas.py`, firstgid 530). Ta tabela
# dalej opisuje STARE drzewa proceduralne w `Nature.png` — `--zapisz` tego
# generatora namalowalby je z powrotem (i cofnal mape do 100x60). `.tmj` jest
# zrodlem prawdy; ten plik zostaje przymiarem. Przepiecie na `Forrest` w tym
# generatorze to osobna, jeszcze nierobiona robota.
DRZEWA = [
    # duze
    ("dab_duzy",       0, 2, 3, 3, "dab"),
    ("dab_duzy2",      3, 2, 3, 3, "dab"),
    ("buk_duzy",       6, 2, 3, 3, "buk"),
    ("swierk_duzy",    9, 2, 2, 3, "swierk"),
    ("swierk_duzy2",  11, 2, 2, 3, "swierk"),
    ("brzoza_duza",   13, 2, 2, 3, "brzoza"),
    ("brzoza_duza2",  15, 2, 2, 3, "brzoza"),
    ("grab_duzy",     17, 2, 2, 3, "grab"),
    # srednie
    ("dab_sredni",     0, 5, 2, 2, "dab"),
    ("swierk_sredni",  2, 5, 2, 2, "swierk"),
    ("brzoza_srednia", 4, 5, 2, 2, "brzoza"),
    ("buk_sredni",     6, 5, 2, 2, "buk"),
    ("grab_sredni",    8, 5, 2, 2, "grab"),
    # male
    ("dab_maly",      10, 5, 1, 2, "dab"),
    ("swierk_maly",   11, 5, 1, 2, "swierk"),
    ("brzoza_mala",   12, 5, 1, 2, "brzoza"),
    ("buk_maly",      13, 5, 1, 2, "buk"),
    ("grab_maly",     14, 5, 1, 2, "grab"),
]
DRZEWO = {d[0]: d for d in DRZEWA}
DUZE = [d[0] for d in DRZEWA if d[3] * d[4] >= 6]
SREDNIE = [d[0] for d in DRZEWA if d[3] == 2 and d[4] == 2]
MALE = [d[0] for d in DRZEWA if d[3] == 1]


def puste_kafle(plik):
    """Zbior lokalnych id kafli arkusza, ktore sa w calosci przezroczyste.

    Rog drzewa 3x3 czesto nie ma ani jednego piksela; tak samo rogi dachu.
    Wpisanie takiego kafla do mapy niczego nie psuje, ale zasmieca warstwe
    i w Tiled wyglada jak przypadkowy klik — a przy `-over` udaje, ze cos tam
    jest, wiec przy szukaniu dziury w zasloniecu gracza traci sie czas.
    """
    p = os.path.join(ASSETS, plik)
    if not os.path.exists(p):
        return set()
    ark = np.array(Image.open(p).convert("RGBA"))
    puste = set()
    for w in range(ark.shape[0] // PITCH + 1):
        for k in range(COLS):
            y, x = w * PITCH, k * PITCH
            if y + T > ark.shape[0] or x + T > ark.shape[1]:
                continue
            if not (ark[y:y + T, x:x + T, 3] > 8).any():
                puste.add(w * COLS + k)
    return puste


PUSTE = puste_kafle("Nature.png")
PUSTE_B = puste_kafle("Buildings.png")


def wczytaj_kuznie():
    """Katalog kafli z tools/build_kuznia.py, przez docs/kuznia.json — ta sama
    zasada co `wczytaj_budynki` ponizej: czytamy PLIK, nie generator."""
    sciezka = os.path.join(DOCS, "kuznia.json")
    if not os.path.exists(sciezka):
        return {}, {"wierszy": 3, "wysokosc": 98, "kolumny": COLS, "kafli": 57}
    d = json.load(open(sciezka, encoding="utf-8"))
    return d["kafle"], d["arkusz"]


def wczytaj_budynki():
    """Katalog kafli z tools/build_budynki.py, przez docs/budynki.json.

    Czytamy PLIK, a nie importujemy generatora: mapa ma zalezec od tego, co
    naprawde lezy w arkuszu, a nie od tego, co generator narysowalby dzisiaj.
    Gdyby ktos zmienil komplet i nie przebudowal Buildings.png, mapa stawialaby
    kafle, ktorych w arkuszu nie ma — po cichu, bo bezsensowny uklad kafli
    niczego nie zglasza.
    """
    sciezka = os.path.join(DOCS, "budynki.json")
    if not os.path.exists(sciezka):
        return {}, {"wierszy": 3, "wysokosc": 98, "kafli": 57}
    d = json.load(open(sciezka, encoding="utf-8"))
    return d["kafle"], d["arkusz"]


BUDYNKI, ARKUSZ_B = wczytaj_budynki()
KUZNIA, ARKUSZ_K = wczytaj_kuznie()

# Domy SKLADAMY Z KAFLI, nie stawiamy gotowych. Arkusz budynkow jest kompletem
# modulowym (sciana 3x3, dach 3x3, drzwi i okna jako nakladki), wiec kazdy dom
# to opis, a nie osobny prop. Dzieki temu dom 7x3 kosztuje jedna linijke,
# a nie osobny komplet kafli w arkuszu.
# Na razie jeden budynek — chata mysliwego na polanie w NE. Wioska bedzie
# osobna lokacja (docs/swiat.md), nie doklejeniem chat do lasu.
#
# Opis budynku zna dwa style dachu. `styl="kalenica"` (domyslny) to dach
# prostokatny opisany polem `dach` (ile wierszy); `styl="szczyt"` to dach /\,
# ktorego wysokosc wynika z szerokosci i pola `dach` nie uzywa. Chata
# mysliwego zostaje przy kalenicy: stoi na mapie od poczatku i przestawienie
# jej na dach /\ zmienilo by jej wysokosc, a wokol niej sa juz policzone
# odleglosci do ogniska, kowala i spawnow.
#
# Reszta pol: `material` ("bale" domyslnie / "deski"), `drzwi`, `drzwi_pol`,
# `wrota`, `okna`, `klapa`, `okno_szczyt`, `otwor_siana`, `otwarty=(od, do)`
# dla frontu na slupach, `komin`.
BUDYNKI_NA_MAPIE = [
    dict(x=64, y=2, szer=5, sciana=3, dach=3, drzwi=2, okna=(1, 3), komin=3),
]

# ── podworze kowala: KATALOG WSPOLDZIELONY, uzywany przez ten skrypt LUB
#    przez tools/build_wioska.py (importuje go jako `M.KUZNIA_WYPOSAZENIE`) —
#    NIE oba naraz. ──────────────────────────────────────────────────────
#
# **Kowal juz nie stoi w lesie.** Pierwsza wersja stawiala go tuz obok chaty
# mysliwego na tej samej polanie — zgloszone wprost: dymiacy, walacy mlotem
# piec kolo stanowiska mysliwego sploszylby cala zwierzyne, na ktora ten
# poluje. `docs/swiat.md` i tak mowi, ze miejsce kowala jest w wiosce, za
# palisada — `tools/build_wioska.py` teraz go tam stawia, ten las go NIE
# umieszcza wcale (patrz `spawny()`: brak wpisu "blacksmith"). Silnik
# traktuje to jako "NPC istnieje tylko na mapie, ktora go autoryzuje" —
# patrz `GameScene.create()` w src/scenes/GameScene.ts, zmienione w tym
# samym kroku (usunieto fallback "kowal stoi obok mysliwego, gdy mapa go nie
# autoryzuje", ktory wlasnie to psul).
#
# Wspolrzedne w liscie ponizej sa WZGLEDEM lewego-gornego rogu podworza
# (mapa-hosta definiuje wlasne `KUZNIA_X0`/`KUZNIA_Y0`), nie wzgledem
# budynku. `piec` zajmuje 2x2, ma wiec DWA wpisy dla gornej pary kolumn i
# dwa dla dolnej — tak samo jak drzwi/okna sa nakladkami w `kafle_domu`,
# tylko tu plaskie sprzety.
#
# **To nie jest polka sklepowa — uklad wynika z tego, do czego kazdy przedmiot
# sluzy**, zgloszone wprost jako brakujace po pierwszej wersji (rzad ikon w
# przypadkowej kolejnosci):
#   • **Goracy kat, zwarty wokol pieca.** Miech DOTYKA pieca (pompuje w niego
#     powietrze, nie stoi obok jako ozdoba), wegiel lezy przy samym otworze
#     (dosypuje sie go bez chodzenia), kowadlo stoi WPROST PRZED PALENISKIEM
#     — rozgrzany metal styga w kilka sekund, kowal nie ma czasu na spacer
#     miedzy piecem a kowadlem. Stojak z obcegami/mlotkiem siedzi przy samym
#     kowadle, w zasiegu ramienia.
#   • **Kat obrobki na zimno, CELOWO z dala od ognia.** Oselka (ostrzenie
#     gotowego ostrza) i stol z imadlem (pilowanie/pasowanie) to robota na
#     juz OSTYGLYM metalu — realny kowal nie trzyma kamienia szlifierskiego
#     centymetry od zaru.
#   • **Wystawa przy drzwiach, nie w srodku roboczego balaganu.** Stojak na
#     zbroje i stojak na bron to GOTOWY TOWAR NA SPRZEDAZ (Kowal handluje z
#     graczem — patrz `BLACKSMITH` w GameConfig) — stoi wiec tam, gdzie klient
#     go od razu widzi, przy progu, nie za piecem.
#
# **DRUGI PRZEGLAD, tym razem po zasobnosci, nie po funkcji: to biedny kowal
# jednej wsi kilku rodzin rolniczych (+ mysliwy, + soltys), nie miejski
# cech.** Pierwsza wersja miala DWA kowadla, DWIE stacje ostrzenia (tocznia
# + oselka), stol z hakami/plytkami NA POKAZ i osobna szafke na narzedzia
# obok stojaka, ktory juz jest na narzedzia — zgloszone wprost jako pytanie
# "na pewno biednego kowala stac na dwa kowadla i dwie oselki?". Zostaje
# JEDNO kowadlo (wieksze), JEDNA oselka (reczna, nie kolowrotowa tocznia —
# tocznia to sprzet cechu, nie wioskowej kuzni), stol z imadlem (bez tego nie
# da sie niczego dopasowac, wiec zostaje) i ZERO skrzyni rudy: wioskowy kowal
# przerabia zlom i to, co przyniesie klient, nie trzyma zapasu surowej rudy.
KUZNIA_WYPOSAZENIE = [
    # wystawa, tuz za progiem szopy
    ("stojak_broni_0", 1, 0), ("stojak_zbroi_0", 2, 0),

    # (wiersz 1 celowo pusty — przejscie miedzy wystawa a warsztatem)

    # goracy kat: piec + miech (dotyka pieca) + wegiel (przy otworze) +
    # kowadlo (wprost przed paleniskiem) + obcegi/mlotek pod reka
    ("piec_rozpalony_lg", 3, 2), ("piec_rozpalony_pg", 4, 2),
    ("worek_wegla_0", 2, 3), ("piec_rozpalony_ld", 3, 3), ("piec_rozpalony_pd", 4, 3), ("miech_0", 5, 3),
    ("kowadlo_duze_0", 4, 4), ("stojak_narzedzi_0", 5, 4),

    # kat obrobki na zimno — kawalek dalej od zaru
    ("osełka_0", 7, 3),
    ("stol_imadlo_0", 7, 4), ("stol_imadlo_1", 8, 4),
]


GRUBOSC_DACHU = 3       # w kaflach, w pionie — musi zgadzac sie z generatorem


def wysokosc_budynku(b):
    """Ile wierszy zajmuje budynek RAZEM z dachem.

    Przy dachu /\\ nie wystarczy dach + sciana: ramiona schodza nizej niz
    wierzch sciany, wiec najnizszy kafel dachu moze byc pod ostatnim kaflem
    sciany. Liczone jest maksimum z obu.
    """
    if b.get("styl", "kalenica") != "szczyt":
        return b["dach"] + b["sciana"]
    srod = b["szer"] // 2
    lico = max(GRUBOSC_DACHU, srod)     # patrz _dach_szczytowy — musi sie zgadzac
    return max(lico + b["sciana"], (srod - 1) + lico + 2)


def _dach_kalenicowy(b):
    """Dach prostokatny: kalenica u gory, okap u dolu. Dla dlugich budynkow."""
    dach, wd = {}, b["dach"]
    for r in range(wd):
        rzad = "kalenica" if r == 0 else ("okap" if r == wd - 1 else "polac")
        for c in range(b["szer"]):
            i = 0 if c == 0 else (2 if c == b["szer"] - 1 else 1)
            nazwa = "%s_%d" % (rzad, i)
            if rzad == "polac" and i == 1 and (r + c) % 2:
                nazwa = "polac2_1"
            dach[(b["x"] + c, b["y"] + r)] = nazwa
    return dach, wd


def _dach_szczytowy(b):
    """Dach /\\ — pas o stalej grubosci, ramiona pod 45°.

    Pelny opis geometrii jest w tools/build_budynki.py; tutaj wazne sa trzy
    rzeczy, bo kazda potrafi po cichu zepsuc budynek na mapie:
      • **szerokosc musi byc parzysta** (kalenica siedzi na granicy kafli),
      • **dach jest warstwa NAD sciana**, wiec sciana zaczyna sie juz w wierszu
        `lico` i wystaje spod ramion — nie pod nimi,
      • **`lico` NIE jest stalym `GRUBOSC_DACHU`, tylko `max(GRUBOSC_DACHU,
        szer//2)`, i roznica jest UZUPELNIANA DODATKOWYMI KAFLAMI POLACI, nie
        zdobywana przesunieciem sciany.** Przesuniecie samej sciany (bez
        dolozenia kafli) zostawialo dziure: kolumna PRZY KALENICY konczyla
        swoj pas dokladnie na starym `GRUBOSC_DACHU`, a sciana zaczynala sie
        dopiero przy nowym, wiekszym `lico` — miedzy nimi nie bylo NIC,
        dokladnie tam, gdzie ma byc widoczna sciana szczytowa. Zgloszone
        wprost: "przesunales rzad kafelkow zamiast dodac rzad kafelkow, mamy
        dziure". Kazda kolumna dostaje wiec `dodatkowe = lico - GRUBOSC_DACHU`
        dodatkowych, w pelni kryjacych kafli PRZED okapem — takze kolumna przy
        kalenicy — wiec koniec dachu i poczatek sciany przesuwaja sie o tyle
        samo, razem. Musi sie zgadzac z `_dach_szczytowy` w
        tools/build_budynki.py i z `wysokosc_budynku` powyzej.
    """
    if b["szer"] % 2:
        raise ValueError("dach szczytowy wymaga parzystej szerokosci")
    dach, srod = {}, b["szer"] // 2
    dodatkowe = max(0, srod - GRUBOSC_DACHU)
    lico = GRUBOSC_DACHU + dodatkowe
    for c in range(b["szer"]):
        lewa = c < srod
        d = (srod - 1 - c) if lewa else (c - srod)
        bok = 0 if lewa else 2
        przy_osi, koniec = d == 0, d == srod - 1
        polozenie = lambda r: (b["x"] + c, b["y"] + r)
        # Kafle w pasie NIE sa wymienne: gorny styka sie rogiem z kalenica,
        # dolny z okapem i kazdy musi niesc kawalek tamtego pasa. Stad "_kal"
        # i "_okp" — bez nich gruby brzeg okapu i walek kalenicy urywaja sie
        # na kazdej granicy kafla (patrz `_naroznik_okapu` w build_budynki.py).
        rodzina = "szczyt" if przy_osi else ("kon_polac" if koniec else "polac")
        dach[polozenie(d)] = "%s_%d" % ("szczyt" if przy_osi else "skos", bok)
        dach[polozenie(d + 1)] = "%s_kal_%d" % (rodzina, bok)
        dach[polozenie(d + 2)] = "%s_%s_%d" % (
            rodzina, "dol" if przy_osi else "okp", bok)
        # Dodatkowe, PELNE kafle polaci — gladkie dla srodka, z zawinieta
        # krawedzia (ta sama co reszta jej pasa) dla kolumny brzegowej.
        wypelniacz = "kon_polac_%d" % bok if koniec else (
            "polac_l_1" if lewa else "polac_p_1")
        for i in range(dodatkowe):
            dach[polozenie(d + 3 + i)] = wypelniacz
        dach[polozenie(d + lico)] = "%s_%d" % (
            "kon_okap" if koniec else "okap_skos", bok)
        # Cien i strzepy wychodzace poza dolna krawedz kafla okapu. Bez tego
        # wiersza dolna krawedz dachu jest SCHODAMI, a nie ukosem — patrz
        # `kafel_podokap` w tools/build_budynki.py.
        dach[polozenie(d + lico + 1)] = "podokap_%d" % bok
    return dach, lico


def _pas_sciany(x0, y0, szer, wys, material, otwarty=None, gorny_rzad=True):
    """Pas sciany {(x,y): nazwa} — port `_sciany` z build_budynki.py.

    Wydzielone z `kafle_domu` (gdzie wczesniej siedzialo w linii) w momencie,
    gdy `_dach_zlozony` ponizej potrzebowal DOKLADNIE tej samej logiki, tylko
    z innym wierszem startowym per kolumna. Kopiowanie jej po raz drugi
    byloby dokladnie ta pulapka, przed ktora ostrzega naglowek pliku — dwa
    miejsca z tym samym pasem, ktore z czasem sie rozjada.

    `gorny_rzad=False` pomija kafel z poziomym cieniem okapu — dach szczytowy
    ma go wpieczonego we wlasne kafle (ukosny okap), wiec poziomy pas cienia
    biegłby w poprzek sciany szczytowej. Patrz `zloz_zlozony` w
    build_budynki.py — ten sam parametr, ten sam powod.
    """
    deski = material == "deski"
    spod = {}
    for r in range(wys):
        y = y0 + r
        gora, dol = r == 0 and gorny_rzad, r == wys - 1
        for c in range(szer):
            i = 0 if c == 0 else (2 if c == szer - 1 else 1)
            if deski:
                rzad = "deski_gora" if gora else ("deski_dol" if dol else "deski")
                nazwa = ("deski2_1" if rzad == "deski" and i == 1 and (r + c) % 2
                         else "%s_%d" % (rzad, i))
            else:
                rzad = "sciana_gora" if gora else ("fundament" if dol else "sciana")
                # trzy warianty srodka i drugi wariant brzegow — jeden kafel
                # powtarzany scianka po sciance odslania krate co 32 px
                if rzad == "sciana" and i == 1:
                    nazwa = ("sciana_1", "sciana2_1", "sciana3_1")[(r * 2 + c) % 3]
                elif rzad == "sciana" and (r + c) % 2:
                    nazwa = "sciana_3" if i == 0 else "sciana_4"
                else:
                    nazwa = "%s_%d" % (rzad, i)
            spod[(x0 + c, y)] = nazwa
    if otwarty:
        a, z = otwarty
        for c in range(a, z + 1):
            spod[(x0 + c, y0 + wys - 1)] = (
                "wiata_slup_1" if (c - a) % 2 == 0 else "wiata_1")
    return spod


def kafle_domu(b):
    """Zwraca (spod, nakladki, dach) — kazde jako {(x, y): nazwa kafla}.

    Ta sama logika co `zloz_budynek` w tools/build_budynki.py; tam sluzy do
    podgladu, tutaj do mapy. Trzymana osobno swiadomie: mapa nie ma importowac
    generatora grafiki, zeby dalo sie ja przebudowac bez numpy i PIL.
    """
    nakl = {}
    szer, ws = b["szer"], b["sciana"]
    szczytowy = b.get("styl", "kalenica") == "szczyt"
    if szczytowy:
        dach, lico = _dach_szczytowy(b)
    else:
        dach, lico = _dach_kalenicowy(b)
    # Przy dachu /\ nie ma gornego rzedu z cieniem okapu: cien biegnie ukosem
    # i jest wpieczony w kafle okapu. Poziomy pas cienia szedlby w poprzek
    # sciany szczytowej.
    spod = _pas_sciany(b["x"], b["y"] + lico, szer, ws, b.get("material", "bale"),
                       b.get("otwarty"), gorny_rzad=not szczytowy)

    dol = b["y"] + lico + ws - 1
    if b.get("drzwi") is not None:
        nakl[(b["x"] + b["drzwi"], dol - 1)] = "drzwi_0"
        nakl[(b["x"] + b["drzwi"], dol)] = "drzwi_1"
    if b.get("drzwi_pol") is not None:
        nakl[(b["x"] + b["drzwi_pol"], dol - 1)] = "drzwi_pol_0"
        nakl[(b["x"] + b["drzwi_pol"], dol)] = "drzwi_pol_1"
    if b.get("wrota") is not None:
        for k in (0, 1):
            nakl[(b["x"] + b["wrota"] + k, dol - 1)] = "wrota_%d" % (k * 2)
            nakl[(b["x"] + b["wrota"] + k, dol)] = "wrota_%d" % (k * 2 + 1)
    for ox in b.get("okna", ()):
        nakl[(b["x"] + ox, dol - 1)] = "okno_0"
    if b.get("klapa") is not None:
        nakl[(b["x"] + b["klapa"], dol)] = "klapa_0"
    for co in ("okno_szczyt", "otwor_siana"):
        if b.get(co):
            nakl[(b["x"] + szer // 2 - 1,
                  b["y"] + lico + (1 if szczytowy else 0))] = "%s_0" % co
    if b.get("komin") is not None:
        if szczytowy:
            # Komin stoi na ZWYKLEJ polaci — dolny kafel ma wpieczone tlo,
            # wiec na kaflu z belka kalenicowa albo z zawinietym koncem
            # wymazalby je. Druga kolumna od osi jest pierwsza taka.
            kx = b["x"] + szer // 2 - 2
            dach[(kx, b["y"] + GRUBOSC_DACHU)] = "komin_2"
            dach[(kx, b["y"] + GRUBOSC_DACHU - 1)] = "komin_3"
        else:
            dach[(b["x"] + b["komin"], b["y"])] = "komin_1"
            dach[(b["x"] + b["komin"], b["y"] - 1)] = "komin_0"
    return spod, nakl, dach


# Musi zostac zgodne z `PODNIESIENIE` w build_budynki.py — patrz tam po
# uzasadnienie (sprawdzone dla kazdej dopuszczalnej szerokosci skrzydla, nie
# gust). Nie duplikuj wartosci na wyczucie, gdyby kiedys tam sie zmienila.
PODNIESIENIE = 2


def kafle_domu_zlozony(opis):
    """Rzut L / T / U jako JEDEN budynek — port `zloz_zlozony`
    z build_budynki.py do postaci nazw kafli (do stemplowania na mape),
    zamiast pikseli (do podgladu). Ta sama relacja co `_dach_szczytowy` w tym
    pliku wobec swojego imiennika w build_budynki.py.

    `opis`: jak `WZORY_ZLOZONE` w build_budynki.py — `szer`, `sciana`,
    `material`, `okna`, `drzwi`, oraz `skrzydla` (lista
    `dict(x=, szer=, drzwi=, okno_szczyt=)`). L = jedno skrzydlo przy koncu,
    T = w srodku, U = po jednym przy obu koncach — ksztalt nie jest trybem,
    to ta sama operacja powtorzona w innym miejscu opisu.

    Zwraca (spod, nakl, dach, szer, wys) — jak `kafle_domu`, plus wysokosc,
    bo w odroznieniu od zwyklego budynku ROZNI SIE ona od `b["sciana"] +
    lico` o `PODNIESIENIE`.

    ⚠ Geometria (PODNIESIENIE, `d + D` dla `szczyt_od`, warunek na
    "kalenica_1" przy podmianie na dolina_) MUSI zostac bajt-w-bajt zgodna
    z `zloz_zlozony` w build_budynki.py — to jest TEN SAM budynek. Jedyna
    prawdziwa roznica: tam sprawdzenie "czy dolina_X_Y istnieje" pyta slownik
    pikseli `kafle`, tu pyta katalog `BUDYNKI` wczytany z docs/budynki.json.
    Oba pytaja o to samo, bo oba sa wypelniane z tego samego arkusza.
    """
    szer, W = opis["szer"], opis["sciana"]
    material = opis.get("material", "bale")
    k, D = PODNIESIENIE, GRUBOSC_DACHU

    dach = {}
    dach_korpus, _ = _dach_kalenicowy({"x": 0, "y": k, "szer": szer, "dach": D})
    dach.update(dach_korpus)
    komorki_korpusu = set(dach_korpus)
    nakl = {}
    dol = k + D + W - 1                       # wspolny wiersz fundamentu

    szczyt_od = {}
    kolumny_skrzydel = set()
    for skr in opis["skrzydla"]:
        ox, s = skr["x"], skr["szer"]
        if s % 2 or s > 6:
            raise ValueError(
                "skrzydlo szerokosci %d — rzut zlozony obsluguje "
                "szerokosci parzyste do 6" % s)
        if ox < 0 or ox + s > szer:
            raise ValueError("skrzydlo wychodzi poza korpus")
        srod = s // 2
        for c in range(s):
            d = (srod - 1 - c) if c < srod else (c - srod)
            szczyt_od[ox + c] = d + D
            kolumny_skrzydel.add(ox + c)

    # Jedna sciana na caly budynek — patrz `_pas_sciany` i naglowek
    # `zloz_zlozony` w build_budynki.py po pelne uzasadnienie ("dlaczego
    # kalenica skrzydla stoi nad kalenica korpusu").
    gora = min([k + D] + list(szczyt_od.values()))
    pelna = _pas_sciany(0, gora, szer, dol - gora + 1, material,
                        opis.get("otwarty"), gorny_rzad=False)
    spod = {(c, r): nazwa for (c, r), nazwa in pelna.items()
            if r >= szczyt_od.get(c, k + D)}
    # Cien okapu korpusu (`sciana_gora`/`deski_gora`) — tylko tam, gdzie
    # korpus NAPRAWDE ma okap, czyli poza kolumnami skrzydla (patrz
    # `zloz_zlozony`: w kolumnie skrzydla ten pas bieglby w poprzek szczytu).
    for c in range(szer):
        if c not in kolumny_skrzydel:
            i = 0 if c == 0 else (2 if c == szer - 1 else 1)
            spod[(c, k + D)] = ("deski_gora_%d" if material == "deski"
                                 else "sciana_gora_%d") % i

    for skr in opis["skrzydla"]:
        ox, s = skr["x"], skr["szer"]
        plan_s, lico_s = _dach_szczytowy({"x": ox, "y": 0, "szer": s})
        if lico_s != D:
            raise ValueError("skrzydlo x=%d: lico %d != %d — patrz "
                              "build_budynki.py" % (ox, lico_s, D))
        for (c, r), nazwa in plan_s.items():
            cel = (c, r)
            # Podmiana na kosz TYLKO tam, gdzie za kaflem NAPRAWDE stoi dach
            # korpusu — patrz `kafel_dolina`/`zloz_zlozony` w
            # build_budynki.py po pelne uzasadnienie (kafel kosza ma
            # WPIECZONE tlo, wiec jest poprawny wylacznie nad tym jednym
            # kaflem korpusu, z ktorego to tlo wziete).
            baza, bok = nazwa.rsplit("_", 1)
            proba = "dolina_%s_%s" % (baza, bok)
            if (cel in komorki_korpusu and r < szczyt_od[c]
                    and proba in BUDYNKI):
                if dach.get(cel) != "kalenica_1":
                    raise ValueError(
                        "skrzydlo na x=%d wchodzi w kafel korpusu %r, a "
                        "dolina ma wpieczone tlo 'kalenica_1' — odsun "
                        "skrzydlo od skrajnej kolumny korpusu"
                        % (ox, dach.get(cel)))
                dach[cel] = proba
            else:
                dach[cel] = nazwa
        if skr.get("drzwi") is not None:
            for i, r in enumerate((dol - 1, dol)):
                nakl[(ox + skr["drzwi"], r)] = "drzwi_%d" % i
        if skr.get("okno_szczyt"):
            nakl[(ox + s // 2 - 1, szczyt_od[ox + s // 2 - 1] + 1)] = "okno_szczyt_0"

    for ox in opis.get("okna", ()):
        if ox not in kolumny_skrzydel:
            nakl[(ox, dol - 1)] = "okno_0"
    if opis.get("drzwi") is not None:
        for i, r in enumerate((dol - 1, dol)):
            nakl[(opis["drzwi"], r)] = "drzwi_%d" % i
    return spod, nakl, dach, szer, dol + 1


# Kolejnosc warstw = kolejnosc rysowania. `-over` idzie nad postaciami
# (DEPTH.overhead), reszta pod nimi. Ten las nie ma juz warstwy
# "wyposazenie" — kowal (i jego podworze) przeniesli sie do wioski, patrz
# naglowek nad `KUZNIA_WYPOSAZENIE`.
KOLEJNOSC = ["ground", "water", "sand", "path", "undergrowth", "bushes",
             "buildings", "buildings-detale", "trees-base",
             "trees-over", "buildings-over"]


# ── plansza ─────────────────────────────────────────────────────────────────

class Warstwa:
    def __init__(self, nazwa, firstgid):
        self.nazwa = nazwa
        self.firstgid = firstgid
        self.dane = [0] * (SZER * WYS)

    def set(self, x, y, lokalne):
        if 0 <= x < SZER and 0 <= y < WYS and lokalne is not None:
            self.dane[y * SZER + x] = lokalne + self.firstgid

    def get(self, x, y):
        return self.dane[y * SZER + x]

    def json(self, nr):
        return {
            "data": self.dane, "height": WYS, "id": nr, "name": self.nazwa,
            "opacity": 1, "type": "tilelayer", "visible": True,
            "width": SZER, "x": 0, "y": 0,
        }


# ── komplet obszarowy: maska boolowska -> kafle blob 47 ─────────────────────

_KIER = [("N", 0, -1, 1), ("NE", 1, -1, 2), ("E", 1, 0, 4), ("SE", 1, 1, 8),
         ("S", 0, 1, 16), ("SW", -1, 1, 32), ("W", -1, 0, 64), ("NW", -1, -1, 128)]


def normalizuj(m):
    """Skos bez obu przyleglych prostopadlych nic nie wnosi — 256 ukladow
    zwija sie do 47 realnie roznych kafli. Kopia z build_tilesets.py."""
    if not (m & 1 and m & 4): m &= ~2
    if not (m & 4 and m & 16): m &= ~8
    if not (m & 16 and m & 64): m &= ~32
    if not (m & 64 and m & 1): m &= ~128
    return m & 0xFF


# Wnetrze duzej plamy: komplet obszarowy ma na to JEDEN kafel, wiec cala tafla
# wody to jeden obrazek powtorzony setki razy — i wtedy widac krate, dokladnie
# jak przy trawie (public/assets/README.md, "trzecia pulapka"). Trawa ma szesc
# wariantow i miesza sie je przy malowaniu; wodzie, piaskowi i ziemi zostaja
# dwa plaskie kafle z wiersza 0 arkusza. Mieszamy je z kaflem "pelnym".
WNETRZE = {"woda": [12, 13], "piasek": [8, 9], "sciezka": [6, 7]}


def maluj_obszar(warstwa, maska, zestaw):
    """Maluje maske kompletem obszarowym `zestaw` ("woda"/"sciezka"/"piasek").

    Poza mapa traktujemy jako MATERIAL, nie jako tlo — inaczej rzeka wpadajaca
    w krawedz mapy dostawalaby tam brzeg i wygladala, jakby konczyla sie
    scianka. To sam material ma wychodzic poza kadr.
    """
    tab = BLOB[zestaw]
    pelny = tab[0xFF]
    warianty = [pelny] + WNETRZE[zestaw]
    for y in range(WYS):
        for x in range(SZER):
            if not maska[y][x]:
                continue
            mk = 0
            for _n, dx, dy, bit in _KIER:
                sx, sy = x + dx, y + dy
                poza = not (0 <= sx < SZER and 0 <= sy < WYS)
                if poza or maska[sy][sx]:
                    mk |= bit
            uklad = normalizuj(mk)
            warstwa.set(x, y, rng.choice(warianty) if uklad == 0xFF else tab[uklad])


# ── uklad swiata ────────────────────────────────────────────────────────────

def pusta_maska():
    return [[False] * SZER for _ in range(WYS)]


def kregoslup(y):
    """Srodek drogi poludnie-polnoc, w kaflach."""
    return 38 + 3.6 * math.sin(y / 13.0) + 1.7 * math.sin(y / 5.0 + 0.9)


def rzeka_srodek(x):
    """Srodek rzeki — JEDNA niska czestotliwosc, celowo.

    Wersja z dolozonym sin(x/5.1) przenosila koryto o kilka kafli na dystansie
    przeprawy, wiec brzeg zachodni i wschodni wychodzily na innych wysokosciach
    i brod czytal sie jak dwa osobne zbiorniki, a nie jedna rzeka z plycizna.
    Meander ma byc dluzszy niz przerwa, ktora w nim robimy.
    """
    return 20.5 + 3.0 * math.sin(x / 17.0)


def rzeka_polszer(x):
    return 2.4 + 1.0 * math.sin(x / 8.0 + 0.4)


ODNOGA_Y = 8            # wschodnia odnoga drogi — na polnoc od rzeki


def ksztalt_swiata():
    """Zwraca (woda, piasek, sciezka) jako maski kafli.

    Uklad ma jedna decyzje projektowa: polana kupca lezy PO DRUGIEJ STRONIE
    rzeki niz start gracza, a jedyne przejscie to brod. Dzieki temu droga do
    handlu prowadzi przez konkretne miejsce, a nie przez dowolny punkt mapy.
    """
    woda, piasek, sciezka = pusta_maska(), pusta_maska(), pusta_maska()

    # ── rzeka: meandrujaca wstega z zachodu na wschod ──────────────────────
    # Srodek i szerokosc opisane funkcja x, zeby brzeg byl krzywy. Prosta
    # rzeka czyta sie jak row melioracyjny, nie jak rzeka w puszczy.
    for x in range(SZER):
        c, r = rzeka_srodek(x), rzeka_polszer(x)
        for y in range(WYS):
            if abs(y - c) <= r:
                woda[y][x] = True

    # rozlewisko (szersze oczko) w zachodniej czesci rzeki
    for y in range(WYS):
        for x in range(SZER):
            if math.hypot((x - 15) / 8.0, (y - 21) / 4.5) <= 1.0:
                woda[y][x] = True

    # ── drogi ─────────────────────────────────────────────────────────────
    # Kregoslup z poludnia na polnoc + odnoga na wschod do polany kupca.
    # Odnoga biegnie na WYSOKOSCI ODNOGA_Y, czyli nad rzeka — pierwsza wersja
    # miala ja przy y=11 z amplituda 2,5 i przecinala jezioro, wiec droga
    # wycinala w nim kanal. Poziomej drogi nie da sie poprowadzic "gdzies
    # tam": albo jest po tej samej stronie wody co cel, albo jej nie ma.
    # Dwa kafle szerokosci, nie trzy: 96 px drogi w swiecie, w ktorym kamera
    # pokazuje ~6 kafli, to nie sciezka lesna tylko rynek.
    for y in range(ODNOGA_Y, WYS):
        cx = int(round(kregoslup(y)))
        for dx in (0, 1):
            sciezka[y][cx + dx] = True
    for x in range(int(round(kregoslup(ODNOGA_Y))), 71):
        for dy in (0, 1):
            sciezka[ODNOGA_Y + dy][x] = True
    # Przedluzenie grzbietu na polnoc, do bramy wioski. Bez tego droga konczy
    # sie w polowie mapy (przy ODNOGA_Y) i brama z portale.py wisi w otwartym
    # polu, bez dojscia — tak jak odnoga do kupca, brama ma miec adres.
    for y in range(BRAMA_LAS["ty"], ODNOGA_Y):
        cx = int(round(kregoslup(y)))
        for dx in (0, 1):
            sciezka[y][cx + dx] = True

    # ── brod ──────────────────────────────────────────────────────────────
    # Droga musi przez cos przejsc, a mostu nie ma.
    #
    # Zakres y liczymy z PRZECIECIA drogi z woda, nie z recznie wpisanego
    # przedzialu. Pierwsza wersja czyscila wode dla kazdego y od 12 do 30
    # i przecinala rzeke na pol na calej wysokosci doliny — na podgladzie
    # wygladalo to, jakby rzeka po prostu sie urywala.
    kolizja = [y for y in range(WYS)
               if any(woda[y][int(round(kregoslup(y))) + dx] for dx in (0, 1))]
    y0, y1 = min(kolizja), max(kolizja)
    for y in range(y0, y1 + 1):
        cx = int(round(kregoslup(y)))
        for dx in range(-1, 3):
            woda[y][cx + dx] = False
    # lawica: piasek dokladnie wokol przeprawy, o kafel szerszy niz droga
    for y in range(y0 - 1, y1 + 2):
        cx = int(round(kregoslup(y)))
        for dx in range(-3, 5):
            x = cx + dx
            if 0 <= x < SZER and 0 <= y < WYS and not woda[y][x] and not sciezka[y][x]:
                piasek[y][x] = True

    # sciezka nigdy nie biegnie po wodzie
    for y in range(WYS):
        for x in range(SZER):
            if woda[y][x]:
                sciezka[y][x] = False

    return woda, piasek, sciezka


# ── gestosc lasu ────────────────────────────────────────────────────────────

def pole_gestosci(woda, sciezka, polana):
    """Gestosc lasu 0..1 na kafel. Steruje i szansa na drzewo, i tym, jak duze.

    Trzy skladniki, kazdy z innego powodu:
      • scianka po obwodzie — swiat ma sie konczyc lasem, nie pusta krawedzia;
      • gradient ku poludniowemu zachodowi — tam siedzi sfora, wiec droga tam
        ma sie robic coraz ciemniejsza; to jedyna informacja o niebezpieczenstwie,
        jaka gracz dostaje przed pierwszym wyciem;
      • przetarcia — wielkoskalowy szum, zeby las mial polany i przeswity,
        a nie rownomierna gestosc pola kukurydzy.
    """
    g = np.full((WYS, SZER), 0.52)

    yy, xx = np.mgrid[0:WYS, 0:SZER]
    do_krawedzi = np.minimum.reduce([xx, yy, SZER - 1 - xx, WYS - 1 - yy])
    g += 0.70 * np.clip(1.0 - do_krawedzi / 5.0, 0, 1)

    # poludniowy zachod = puszcza
    sw = np.clip(1.0 - np.hypot((xx - 4) / 34.0, (yy - WYS + 4) / 26.0), 0, 1)
    g += 0.55 * sw

    # Przetarcia: suma kilku szerokich gauss'ow zamiast sinusoid — iloczyny
    # sinusow robia regularne ukosne prazki (public/assets/README.md).
    #
    # Amplituda jest tu wazniejsza niz liczba plam. Przy +-0,3 caly las mial
    # gestosc w okolicach sredniej i na podgladzie czytal sie jak SAD:
    # rownomierny rozstaw, zadnego gaszczu, zadnej polany. Las poznaje sie po
    # tym, ze ma miejsca, w ktore nie da sie wejsc, i miejsca, gdzie widac
    # niebo — a to jest roznica gestosci, nie liczba drzew.
    for _ in range(20):
        cx, cy = nrng.uniform(0, SZER), nrng.uniform(0, WYS)
        r = nrng.uniform(4, 14)
        g += nrng.uniform(-0.55, 0.45) * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r))

    for y in range(WYS):
        for x in range(SZER):
            if woda[y][x] or sciezka[y][x]:
                g[y, x] = -1.0
    # przeswit wzdluz drogi i wody: las podchodzi blisko, ale nie na styk
    g = odsun(g, woda, 1, 0.35)
    g = odsun(g, sciezka, 2, 0.45)
    for (px, py, r) in polana:
        d = np.hypot(xx - px, yy - py)
        g -= 0.9 * np.clip(1.0 - d / r, 0, 1)
    return np.clip(g, -1.0, 1.0)


def odsun(g, maska, promien, kara):
    out = g.copy()
    for y in range(WYS):
        for x in range(SZER):
            if not maska[y][x]:
                continue
            for dy in range(-promien, promien + 1):
                for dx in range(-promien, promien + 1):
                    sy, sx = y + dy, x + dx
                    if 0 <= sx < SZER and 0 <= sy < WYS and out[sy, sx] > 0:
                        out[sy, sx] -= kara
    return out


# ── sadzenie drzew ──────────────────────────────────────────────────────────

def gatunek_dla(x, y, gest):
    """Sklad gatunkowy zalezy od miejsca — inaczej las jest jednym drzewem
    powielonym osiemset razy, nawet gdy gatunkow jest piec.

      brzoza  — brzegi wody i polany (jasna, lubi swiatlo)
      swierk  — puszcza na poludniowym zachodzie i polnocne krance (ciemna)
      grab    — podszyt gestych miejsc
      dab/buk — reszta, czyli srodek mapy
    """
    los = rng.random()
    if y >= 34 and x <= 30:                      # puszcza SW
        return "swierk" if los < 0.5 else ("grab" if los < 0.8 else "dab")
    if y <= 6:                                   # polnocna scianka
        return "swierk" if los < 0.6 else "grab"
    if 8 <= y <= 30 and gest < 0.75:             # dolina rzeki
        return "brzoza" if los < 0.5 else ("buk" if los < 0.8 else "dab")
    if gest > 0.85:
        return "grab" if los < 0.4 else "swierk"
    return "dab" if los < 0.45 else ("buk" if los < 0.8 else "brzoza")


def wybierz_drzewo(gatunek, klasa):
    pula = {"duze": DUZE, "srednie": SREDNIE, "male": MALE}[klasa]
    swoje = [n for n in pula if DRZEWO[n][5] == gatunek]
    return rng.choice(swoje or pula)


# (klasa, prog gestosci, szansa) — TRZY PRZEBIEGI, od najwiekszych.
#
# Jeden przebieg z losowaniem klasy na miejscu dawal 549 drzew, z czego 436
# malych i 21 duzych: sadzonki zajmowaly plac pierwsze, a 3x3 nie miescilo sie
# juz nigdzie. Las wygladal jak szkolka. Kolejnosc od najwiekszych to jedyne,
# co to naprawia — duze biora miejsce, ktorego potrzebuja, reszta wypelnia luki.
PRZEBIEGI = [("duze", 0.55, 0.85), ("srednie", 0.30, 0.75), ("male", 0.05, 0.55)]

# Ile razy przechodzimy plansze na klase. Jeden przebieg zostawia dziury nawet
# przy szansie bliskiej jedynki: drzewo odrzucone dlatego, ze sasiad zajmowal
# kafel, nie dostaje drugiej proby, a w powstalej luce zmiescilby sie mniejszy.
PROB = 2


def kafle_drzewa(nazwa):
    """[(dx, dy, lokalne_id)] — TYLKO kafle, ktore maja jakikolwiek piksel.

    To ta lista, a nie prostokat wxh, decyduje o zajetosci przy sadzeniu.
    Blokowanie calego prostokata nie pozwalalo dwóm drzewom nawet sie dotknac,
    wiec gaszcz byl niemozliwy z definicji: dab 3x3 rezerwowal dziewiec kafli,
    z czego cztery rogi sa przezroczyste. Korony maja sie zazebiac rogami —
    tak wlasnie wyglada zwarty drzewostan.
    """
    _n, k0, w0, sz, wy, _g = DRZEWO[nazwa]
    out = []
    for dy in range(wy):
        for dx in range(sz):
            lok = (w0 + dy) * COLS + (k0 + dx)
            if lok not in PUSTE:
                out.append((dx, dy, lok))
    return out


KAFLE_DRZEW = {n: kafle_drzewa(n) for n, *_ in DRZEWA}


def sadz(gest, zajete, zakazy):
    """Zwraca liste (nazwa, x0, y0) — x0,y0 to LEWY GORNY kafel drzewa."""
    posadzone = []
    for klasa, prog, szansa in PRZEBIEGI:
      for _ in range(PROB):
        pozycje = [(x, y) for y in range(WYS) for x in range(SZER)]
        rng.shuffle(pozycje)
        for x, y in pozycje:
            g = float(gest[y, x])
            if g < prog:
                continue
            # Szansa liczona OD PROGU, nie od zera. Przy `szansa * g` kafel
            # tuz nad progiem dostawal niemal te sama szanse co srodek puszczy,
            # wiec las mial plaska gestosc wszedzie tam, gdzie w ogole rosl —
            # a puszcze robi ROZNICA gestosci, nie sama liczba drzew.
            if rng.random() > szansa * min((g - prog) / (1.05 - prog), 1.0):
                continue
            nazwa = wybierz_drzewo(gatunek_dla(x, y, g), klasa)
            _n, _k, _w, sz, wy, _g = DRZEWO[nazwa]
            x0, y0 = x - sz // 2, y - wy + 1      # (x,y) to kafel przy ziemi
            if not wolne(nazwa, x0, y0, sz, wy, zajete, zakazy):
                continue
            for dx, dy, _lok in KAFLE_DRZEW[nazwa]:
                zajete[y0 + dy][x0 + dx] = True
            posadzone.append((nazwa, x0, y0))
    return posadzone


def wolne(nazwa, x0, y0, sz, wy, zajete, zakazy):
    if x0 < 0 or y0 < 0 or x0 + sz > SZER or y0 + wy > WYS:
        return False
    for dx, dy, _lok in KAFLE_DRZEW[nazwa]:
        if zajete[y0 + dy][x0 + dx]:
            return False
    # zakazy dotycza tylko kafla przy ziemi — korona moze zwisac nad droga
    for dx in range(sz):
        if zakazy[y0 + wy - 1][x0 + dx]:
            return False
    return True


# ── spawny ──────────────────────────────────────────────────────────────────

def srodek(tx, ty):
    return (tx * T + T // 2, ty * T + T // 2)


def spawny():
    """Punkty w PIKSELACH. Odleglosci miedzy wilkami, Szarym, kupcem
    i ogniskiem sa nosne — sprawdza je `raport()`."""
    o = []
    o.append(("player", *srodek(38, 50)))

    # Polana kupca w NE. Myśliwy stoi PRZED wlasnymi drzwiami, przy drodze —
    # placowka handlowa ma miec adres, a nie byc punktem w trawie.
    b = BUDYNKI_NA_MAPIE[0]
    drzwi_x = (b["x"] + b["drzwi"]) * T + T // 2
    prog_y = (b["y"] + b["dach"] + b["sciana"]) * T             # linia gruntu chaty
    kupiec = (drzwi_x, prog_y + 28)
    o.append(("merchant", *kupiec))
    o.append(("campfire", kupiec[0] - 118, kupiec[1] + 30))     # > 92 px od kupca
    # BRAK wpisu "blacksmith" — Kowal juz nie mieszka w lesie kolo mysliwego
    # (dymiacy piec ploszylby mu zwierzyne), tylko w wiosce, patrz
    # tools/build_wioska.py i naglowek nad `KUZNIA_WYPOSAZENIE`.

    # zajace — srodek mapy, z dala od startu gracza i od KAZDEGO wilka.
    # Byly blizej sfory (najblizsza para 276 px); zajac wewnatrz orbity walki
    # z wilkami to trzeci uczestnik bijatyki, ktorego nikt nie zapraszal.
    for tx, ty in ((28, 37), (45, 38), (33, 33), (48, 45), (35, 40)):
        o.append(("rabbit", *srodek(tx, ty)))

    # dziki — wschodni las
    for tx, ty in ((62, 34), (58, 46)):
        o.append(("boar", *srodek(tx, ty)))

    # sieciarze — ROZDZIELONE od dzikow (decyzja autora, 2026-08-13).
    # Wczesniej dwa z trzech staly 125 px od dzika #2, celowo: siec robila z
    # unikalnej szarzy dzika szarze nie do uniknięcia. Zostalo to cofniete —
    # dzik i pajak maja byc dwoma spotkaniami, nie jednym. Struktura "jeden
    # uczy, para pokazuje po co" zostaje, tylko przeniesiona:
    #   • samotny na poludniu, pierwszy na trasie od gracza,
    #   • para glebiej na poludniowym wschodzie, ~195 px od siebie.
    o.append(("spider", *srodek(50, 55)))
    o.append(("spider", *srodek(67, 55)))
    o.append(("spider", *srodek(73, 56)))

    # sfora — puszcza na poludniowym zachodzie.
    # ~115 / 132 / 133 px parami: kazdy wilk laczy cala trojke jednym wyciem
    # (WOLF.pack.callRadius = 200).
    w0 = srodek(14, 44)
    o.append(("wolf", *w0))
    o.append(("wolf", w0[0] + 115, w0[1] + 4))
    o.append(("wolf", w0[0] + 52, w0[1] + 121))

    # SAMOTNY WILK — proba przed sfora. Stoi na trasie z polany gracza na
    # poludniowy zachod, wiec spotyka sie go PRZED trojka i mozna sprawdzic,
    # czy jednego sie w ogole daje rade. Najblizszy wilk sfory jest 399 px
    # dalej: to dwukrotnosc callRadius, wiec ani jego wycie nie sciaga sfory,
    # ani jej wycie jego. Kolejnosc w liscie jest nosna — raport() rozpoznaje
    # sfore po tym, ze ma najmniejsze x.
    o.append(("wolf", *srodek(28, 51)))

    # Szary — POZA promieniem wycia sfory. Zapas jest celowy: przy 211 px
    # wystarczyloby przesunac jednego wilka o dwa kafle w Tiled, zeby jedno
    # wycie sciagnelo elita z 190 HP do walki z trojka.
    o.append(("greywolf", *srodek(8, 53)))

    # NIEDZWIEDZ — samotnie, daleko na polnocnym wschodzie.
    #
    # Dopisany tu 2026-08-14 PO fakcie: postawiony byl najpierw recznie w
    # .tmj i przez chwile stal calkiem poza tym raportem, czyli poza jedyna
    # siatka, ktora lapie ciche przesuniecie spawnu. To jest dokladnie ta
    # dziura, przed ktora ostrzega naglowek — spawn, ktorego nikt nie
    # sprawdza, wyglada tak samo jak spawn poprawny.
    #
    # Nie ma wlasnej mechaniki (patrz BEAR w GameConfig), wiec jego jedyna
    # regula rozstawienia jest ODLEGLOSC: 130 HP bez telegrafu ma byc
    # osobnym spotkaniem, nie dodatkiem do cudzej walki.
    o.append(("bear", *srodek(84, 15)))
    return o


def portale():
    """Punkty przejscia na inna mape — osobno od spawny(), bo niosa dodatkowe
    wlasciwosci Tiled (`target`/`spawnX`/`spawnY`), ktorych zwykly spawn nie
    ma. Wspolrzedne obu koncow (tu i w wiosce) zyja w tools/portale.py, zeby
    dwa niezalezne generatory nie trzymaly dwoch kopii tych samych liczb.
    """
    x, y = _piksele_brama(BRAMA_LAS)
    vx, vy = _piksele(WEJSCIE_DO_WIOSKI)
    return [("portal", x, y, {"target": "village", "spawnX": vx, "spawnY": vy})]


# ── skladanie pliku ─────────────────────────────────────────────────────────

def tileset(nazwa, plik, firstgid, wysokosc, tilecount, prefiks):
    return {
        "columns": COLS, "firstgid": firstgid, "image": prefiks + plik,
        "imageheight": wysokosc, "imagewidth": 640, "margin": 0,
        "name": nazwa, "spacing": 1, "tilecount": tilecount,
        "tileheight": T, "tilewidth": T,
    }


def zbuduj():
    polana = [(66, 9, 7), (38, 50, 5)]            # (x, y, promien) w kaflach
    woda, piasek, sciezka = ksztalt_swiata()

    arkusz = {"ground": FIRST_TEREN, "water": FIRST_TEREN, "sand": FIRST_TEREN,
              "path": FIRST_TEREN, "undergrowth": FIRST_NATURE,
              "bushes": FIRST_NATURE, "buildings": FIRST_BUILDINGS,
              "buildings-detale": FIRST_BUILDINGS,
              "trees-base": FIRST_NATURE, "trees-over": FIRST_NATURE,
              "buildings-over": FIRST_BUILDINGS}
    L = {n: Warstwa(n, fg) for n, fg in arkusz.items()}

    # trawa: warianty mieszane, inaczej widac ukosna krate
    for y in range(WYS):
        for x in range(SZER):
            L["ground"].set(x, y, rng.choices(TRAWA, TRAWA_WAGI)[0])

    maluj_obszar(L["water"], woda, "woda")
    maluj_obszar(L["sand"], piasek, "piasek")
    maluj_obszar(L["path"], sciezka, "sciezka")

    # ── budynki ────────────────────────────────────────────────────────────
    # Dolne wiersze (sciana) ida pod postaciami, gorne (dach) nad nimi. Regula
    # "tylko dolny rzad pod spodem", poprawna dla drzewa, dla domu jest zla:
    # sciana ma dwa kafle wysokosci i gracz stojacy przy niej znikalby za
    # wlasnym budynkiem. Ile wierszy to dach, liczy generator.
    budynki_kafle = pusta_maska()
    for b in BUDYNKI_NA_MAPIE:
        spod, nakl, dach = kafle_domu(b)
        for warstwa, zestaw in (("buildings", spod), ("buildings-detale", nakl),
                                ("buildings-over", dach)):
            for (x, y), nazwa in zestaw.items():
                kafel = BUDYNKI.get(nazwa)
                if not kafel:
                    print("  UWAGA: brak kafla '%s' w docs/budynki.json" % nazwa)
                    continue
                L[warstwa].set(x, y, kafel["id"])
                if 0 <= y < WYS and 0 <= x < SZER:
                    budynki_kafle[y][x] = True

    # zakazy: gdzie drzewo nie moze STANAC (korona moze zwisac)
    zakazy = pusta_maska()
    for y in range(WYS):
        for x in range(SZER):
            zakazy[y][x] = (woda[y][x] or sciezka[y][x] or piasek[y][x]
                            or budynki_kafle[y][x])
    # obwodka wokol budynku: drzewo tuz przy scianie wchodzi w nia korona
    for b in BUDYNKI_NA_MAPIE:
        for y in range(b["y"] - 2, b["y"] + wysokosc_budynku(b) + 2):
            for x in range(b["x"] - 1, b["x"] + b["szer"] + 1):
                if 0 <= x < SZER and 0 <= y < WYS:
                    zakazy[y][x] = True
    for nazwa, px, py in spawny():
        r = 96 if nazwa in ("player", "merchant", "campfire") else 40
        for y in range(WYS):
            for x in range(SZER):
                if math.hypot(x * T + 16 - px, y * T + 16 - py) < r:
                    zakazy[y][x] = True

    gest = pole_gestosci(woda, sciezka, polana)
    zajete = pusta_maska()
    drzewa = sadz(gest, zajete, zakazy)

    for nazwa, x0, y0 in drzewa:
        _n, k0, w0, sz, wy, _g = DRZEWO[nazwa]
        for dy in range(wy):
            for dx in range(sz):
                lok = (w0 + dy) * COLS + (k0 + dx)
                if lok in PUSTE:
                    continue
                cel = "trees-base" if dy == wy - 1 else "trees-over"
                L[cel].set(x0 + dx, y0 + dy, lok)

    # runo i krzaki — tylko tam, gdzie nie ma drzewa ani twardego terenu
    for y in range(WYS):
        for x in range(SZER):
            if zajete[y][x] or woda[y][x] or sciezka[y][x] or piasek[y][x]:
                continue
            g = max(float(gest[y, x]), 0.0)
            if rng.random() < 0.05 + 0.10 * g:
                L["undergrowth"].set(x, y, rng.choice(KEPKI))
            elif rng.random() < 0.02 + 0.05 * g:
                L["bushes"].set(x, y, rng.choice(KRZAKI))

    return L, drzewa, woda, sciezka, piasek, gest


def _obiekt(i, n, x, y, wlasciwosci=None):
    """Jeden wpis w warstwie `objects`. `wlasciwosci` (opcjonalny slownik)
    trafia do Tiled jako tablica {name, type, value} — to jest jedyny sposob,
    w jaki portal niesie cel przejscia i wspolrzedne ladowania obok samej
    pozycji punktu."""
    d = {"height": 0, "id": i, "name": n, "point": True, "rotation": 0,
         "type": "", "visible": True, "width": 0, "x": x, "y": y}
    if wlasciwosci:
        d["properties"] = [
            {"name": k, "type": "int" if isinstance(v, int) else "string", "value": v}
            for k, v in wlasciwosci.items()
        ]
    return d


def plik_mapy(L, prefiks):
    kolejnosc = KOLEJNOSC
    warstwy = [L[n].json(i + 1) for i, n in enumerate(kolejnosc)]
    wszystkie = [(n, x, y, None) for n, x, y in spawny()] + list(portale())
    warstwy.append({
        "draworder": "topdown", "id": len(kolejnosc) + 1, "name": "objects",
        "opacity": 1, "type": "objectgroup", "visible": True, "x": 0, "y": 0,
        "objects": [_obiekt(i + 1, n, x, y, wl)
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
            tileset("Teren", "Teren.png", FIRST_TEREN, 395, 228, prefiks),
            tileset("Nature", "Nature.png", FIRST_NATURE, 230, 133, prefiks),
            tileset("Buildings", "Buildings.png", FIRST_BUILDINGS,
                    ARKUSZ_B["wysokosc"], ARKUSZ_B["kafli"], prefiks),
        ],
    }


# ── raport ──────────────────────────────────────────────────────────────────

def raport(L, drzewa, woda, sciezka, piasek):
    print("mapa %dx%d kafli (%dx%d px)" % (SZER, WYS, SZER * T, WYS * T))
    for n in KOLEJNOSC:
        d = [v for v in L[n].dane if v]
        print("  %-12s %5d kafli, %3d roznych" % (n, len(d), len(set(d))))

    ile = {}
    for nazwa, _x, _y in drzewa:
        ile[nazwa] = ile.get(nazwa, 0) + 1
    print("\ndrzewa: %d sztuk, %d odmian" % (len(drzewa), len(ile)))
    gat = {}
    for nazwa, n in ile.items():
        gat[DRZEWO[nazwa][5]] = gat.get(DRZEWO[nazwa][5], 0) + n
    print("  gatunki: " + ", ".join("%s %d" % kv for kv in sorted(gat.items())))
    print("  odmiany: " + ", ".join("%s %d" % kv for kv in sorted(ile.items())))

    pola = SZER * WYS
    print("\npokrycie: woda %.1f%%, piasek %.1f%%, sciezka %.1f%%, drzewa %.1f%%"
          % (100 * sum(map(sum, woda)) / pola, 100 * sum(map(sum, piasek)) / pola,
             100 * sum(map(sum, sciezka)) / pola,
             100 * sum(1 for v in L["trees-base"].dane if v) / pola))

    print("\nodleglosci nosne:")
    p = {}
    for n, x, y in spawny():
        p.setdefault(n, []).append((x, y))
    d = lambda a, b: math.hypot(a[0] - b[0], a[1] - b[1])

    # Sfora to trzy wilki o najmniejszym x; czwarty to samotnik z trasy.
    wilki = sorted(p["wolf"], key=lambda w: w[0])
    sfora, samotny = wilki[:3], wilki[3]
    pary = [d(sfora[i], sfora[j]) for i in range(3) for j in range(i + 1, 3)]
    ok = all(x < 200 for x in pary)
    print("  wilk-wilk    %s  (kazda < 200 = callRadius) %s"
          % (", ".join("%.0f" % x for x in pary), "OK" if ok else "BLAD"))
    dl = min(d(samotny, w) for w in sfora)
    print("  samotny-sfora %.0f (> 300; ma byc proba na JEDNYM wilku)    %s"
          % (dl, "OK" if dl > 300 else "BLAD"))
    dls = d(samotny, p["greywolf"][0])
    print("  samotny-Szary %.0f (> 300, Szary tez slyszy wycie)          %s"
          % (dls, "OK" if dls > 300 else "BLAD"))
    ds = min(d(p["greywolf"][0], w) for w in sfora)
    print("  Szary-wilk   %.0f  (> 200, inaczej wycie sciaga elita)      %s"
          % (ds, "OK" if ds > 200 else "BLAD"))
    dk = d(p["merchant"][0], p["campfire"][0])
    print("  kupiec-fire  %.0f  (> 92 = 48+44 zasiegi interakcji)        %s"
          % (dk, "OK" if dk > 92 else "BLAD"))
    # kupiec-kowal / kowal-fire: usuniete — kowal juz nie stoi w lesie, patrz
    # tools/build_wioska.py.
    # Regula ODWROCONA 2026-08-13: bylo "< 175", czyli pajak CELOWO w zasiegu
    # aggro dzika. Teraz maja byc dwa osobne spotkania, wiec prog to
    # SPIDER.aggroRange (230) plus zapas na to, ze walka z dzikiem sie przesuwa.
    db = min(d(b, s) for b in p["boar"] for s in p["spider"])
    print("  dzik-pajak   %.0f  (> 340 = 230 aggro pajaka + zapas)       %s"
          % (db, "OK" if db > 340 else "BLAD"))
    # Prog to WOLF.deAggroRange (320) z zapasem: wilk sciagniety na gracza nie
    # ma prawa wyladowac na trasie patrolu zajaca.
    drw = min(d(r, w) for r in p["rabbit"] for w in p["wolf"] + p["greywolf"])
    print("  zajac-wilk   %.0f  (> 380 = 320 deAggro wilka + zapas)      %s"
          % (drw, "OK" if drw > 380 else "BLAD"))
    dpg = min(d(p["player"][0], r) for r in p["rabbit"])
    print("  gracz-zajac  %.0f  (nie na starcie, > 200)                  %s"
          % (dpg, "OK" if dpg > 200 else "BLAD"))

    # NIEDZWIEDZ. Dwa progi, oba z BEAR.deAggroRange = 360 plus zapas:
    # niedzwiedz sciagniety na gracza nie ma prawa wyladowac ani na cudzej
    # walce, ani na polanie kupca.
    wrogowie = [q for n in ("boar", "wolf", "greywolf", "spider", "rabbit")
                for q in p.get(n, [])]
    dbw = min(d(p["bear"][0], q) for q in wrogowie)
    print("  niedzw-wrog  %.0f  (> 400 = 360 deAggro + zapas; ma byc      %s\n"
          "                     osobnym spotkaniem, nie dodatkiem)"
          % (dbw, "OK" if dbw > 400 else "BLAD"))
    # Polana kupca to jedyny bezpieczny hub w lesie (sklep + ognisko +
    # gotowanie). 130 HP wchodzace w zasieg rozmowy to nie spotkanie, tylko
    # zasadzka przy punkcie zapisu.
    dbk = min(d(p["bear"][0], q) for q in p["merchant"] + p["campfire"])
    print("  niedzw-hub   %.0f  (> 400 od kupca/ogniska — hub ma zostac   %s\n"
          "                     bezpieczny)"
          % (dbk, "OK" if dbk > 400 else "BLAD"))

    # Brama musi stac NA drodze, nie w otwartym polu — inaczej portal do
    # wioski jest niewidoczny punkt w trawie, ktory dziala, ale nie wyglada
    # jak przejscie.
    bx, by = BRAMA_LAS["tx"], BRAMA_LAS["ty"]
    na_drodze = sciezka[by][bx] or sciezka[by][bx + 1] or sciezka[by][bx - 1]
    print("  brama-droga  brama (%d,%d) lezy na sciezce: %s             %s"
          % (bx, by, na_drodze, "OK" if na_drodze else "BLAD"))


def main(zapisz):
    L, drzewa, woda, sciezka, piasek, _g = zbuduj()
    raport(L, drzewa, woda, sciezka, piasek)
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    for sciezka_pliku, prefiks in ((os.path.join(MAPY, "forrest.tmj"), "../"),
                                   (os.path.join(ASSETS, "forrest.tmj"), "")):
        with open(sciezka_pliku, "w", encoding="utf-8") as f:
            json.dump(plik_mapy(L, prefiks), f, ensure_ascii=False)
        print("-> %s" % os.path.relpath(sciezka_pliku, os.path.join(TU, "..")))
    print("(oba pliki maja te sama tresc; roznia sie tylko sciezka do PNG,")
    print(" zeby kazdy otwieral sie w Tiled z miejsca, w ktorym lezy)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generuje mape lesna. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true", help="nadpisz forrest.tmj")
    main(ap.parse_args().zapisz)

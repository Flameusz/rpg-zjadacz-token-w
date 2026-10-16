# -*- coding: utf-8 -*-
"""
Ramka lalki ekwipunku (paper doll) — `public/assets/ui/slots.png`.

Źródłem jest `public/assets/sloty.png`, ręcznie narysowana referencja autora:
**krzyż 3x4 z 9 zajętymi kaflami**. Gra potrzebuje **pełnego prostokąta 3x4 =
12 kafli**, w układzie ustalonym z autorem (anatomia w środkowej kolumnie,
ręce po bokach, pierścienie pod rękami, mikstury w dolnych rogach):

        amulet    hełm      rękawice
        broń      klatka    druga ręka
        pierścień spodnie   pierścień
        mikstura  buty      mikstura

⚠ **10 z 12 kafli to VERBATIM kopie 32x32 z referencji** — nie przerysowujemy
autorskiej roboty, tylko przestawiamy kafle. Nowe są dokładnie dwa glify:
spodnie i fiolka (ta druga użyta dwa razy), plus pierścień skopiowany na drugi
palec. Glif "4 pionowe słupki" z lewego górnego rogu referencji **wypada** —
nie odpowiada niczemu w grze (czytaliśmy go jako kołczan albo pelerynę).

── Zmierzona geometria referencji ────────────────────────────────────────────
Wszystko poniżej jest ODCZYTANE z pliku (skan alfy + profil jasności), nie
zgadnięte:

* rozmiar 107x140, tryb P, **alfa dokładnie 217 na całej treści** — obrazek
  jest z założenia półprzezroczysty, do położenia na tle panelu;
* siatka **3 kolumny x 4 wiersze, podziałka 33 px**, linie kraty na
  x = 3/36/69/102 i y = 3/36/69/102/135;
* **wnętrze kafla to 32x32** (x = 4+33c .. 35+33c) — czyli dokładnie tyle, ile
  mają ikony przedmiotów z `items.png`, więc ikona wchodzi w kafel 1:1 i nic
  nie trzeba skalować;
* zewnętrzna faza to 4 px w schemacie [ciemny, jasny, ciemno-szary, linia
  kraty], symetrycznie z każdej strony (zmierzone: lewa 10/91/29/87, prawa
  86/29/90/10 — różnica <=1, więc lustrzane odbicie jest legalne).

⚠ **Referencja nie ma wypukłego prawego górnego narożnika** (w krzyżu kafel
r0c2 jest pusty), więc trzy brakujące narożniki pełnego prostokąta powstają
przez **odbicie lustrzane lewego górnego**. To dlatego symetria fazy została
wyżej zmierzona, a nie założona — gdyby lewa i prawa krawędź się różniły,
odbicie dałoby widoczny szew.

⚠ **Tło kafla odtwarzamy medianą z 9 kafli referencji, ale sama mediana NIE
wystarcza.** Glify nakładają się na siebie w centrum: 90 pikseli ma glif w co
najmniej 5 z 9 kafli, więc tam mediana jest glifem, nie tłem. Te piksele są
domalowywane z mediany CZYSTYCH pikseli tego samego wiersza (wnętrze kafla
jest w poziomie płaskie — zmienna jest tylko fazka przy krawędziach, a tam
glifów nie ma). Bez tej poprawki dwa nowe kafle miałyby w tle ducha cudzego
glifu.

Uruchomienie:
    python tools/build_slots.py                 # zapisuje arkusz
    python tools/build_slots.py --podglad p.png # + podgląd 6x na tle panelu
"""

from __future__ import annotations

import argparse
import os
import random

import numpy as np
from PIL import Image

KATALOG = os.path.dirname(os.path.abspath(__file__))
KORZEN = os.path.dirname(KATALOG)
ZRODLO = os.path.join(KORZEN, "public", "assets", "sloty.png")
WYJSCIE = os.path.join(KORZEN, "public", "assets", "ui", "slots.png")

PODZIALKA = 33
WNETRZE = 32
# Pierwsza linia kraty; wnętrze pierwszego kafla zaczyna się o 1 px dalej.
KRATA0 = 3
KOL, WIE = 3, 4
# Ostatnia linia kraty. Za nią idą jeszcze 3 px fazy i 1 px przezroczysty —
# tak samo jak przed pierwszą linią (KRATA0 = 3). Stąd "+5" zamiast "+3":
# referencja ma 107x140, a nie 105x138, i pierwsza wersja tego pliku ucinała
# po jednym pikselu fazy z prawej i z dołu.
KRATA_X = KRATA0 + PODZIALKA * KOL  # 102
KRATA_Y = KRATA0 + PODZIALKA * WIE  # 135
SZER = KRATA_X + 5  # 107
WYS = KRATA_Y + 5  # 140

# Kafle referencji, które faktycznie coś zawierają (r, c).
ZAJETE = [(0, 0), (0, 1), (1, 0), (1, 1), (1, 2), (2, 0), (2, 1), (2, 2), (3, 1)]

# Skąd wziąć glif dla danego slotu: (wiersz, kolumna) w referencji.
# None = rysujemy sami (patrz `rysuj_spodnie` / `rysuj_fiolke`).
ZRODLA_GLIFOW = {
    "amulet": (1, 1),
    "head": (0, 1),
    "gloves": (1, 2),
    "weapon": (2, 0),
    "chest": (2, 1),
    "offhand": (2, 2),  # druga dłoń jest w referencji narysowana jako para z bronią
    "ring": (1, 0),
    "boots": (3, 1),
    "legs": None,
    "potion": None,
}

# Docelowy układ, ustalony z autorem. Środkowa kolumna to sylwetka z góry na
# dół (hełm -> klatka -> spodnie -> buty); pierścienie stoją parą pod rękami,
# bo są tym samym typem przedmiotu i mają się tak czytać.
UKLAD = [
    ["amulet", "head", "gloves"],
    ["weapon", "chest", "offhand"],
    ["ring", "legs", "ring"],
    ["potion", "boots", "potion"],
]

# Tony glifu, odczytane z referencji: kontur ~ (11,11,11), zmiękczenie
# ~ (24,24,26), rzadka fazka ~ (43,42,48) na tle ~ (37,33,39).
KONTUR = (11, 11, 11)
ZMIEKCZENIE = (24, 24, 26)
FAZKA = (43, 42, 48)


def wczytaj_zrodlo() -> np.ndarray:
    if not os.path.exists(ZRODLO):
        raise SystemExit(f"Brak referencji: {ZRODLO}")
    return np.array(Image.open(ZRODLO).convert("RGBA")).astype(int)


def wnetrze(src: np.ndarray, r: int, c: int) -> np.ndarray:
    """Kafel 32x32 bez linii kraty."""
    y0 = KRATA0 + 1 + PODZIALKA * r
    x0 = KRATA0 + 1 + PODZIALKA * c
    return src[y0 : y0 + WNETRZE, x0 : x0 + WNETRZE].copy()


def czyste_tlo(src: np.ndarray) -> np.ndarray:
    """
    Kafel bez żadnego glifu — mediana z 9 kafli referencji, z domalowanym
    centrum tam, gdzie glify nakładają się na tyle gęsto, że mediana sama jest
    glifem. Patrz nagłówek pliku.
    """
    stos = np.stack([wnetrze(src, r, c)[:, :, :3] for r, c in ZAJETE])
    med = np.median(stos, axis=0)
    odchyl = np.abs(stos - med).sum(axis=3)
    ilu = (odchyl > 18).sum(axis=0)
    skazone = ilu >= 4

    tlo = med.copy()
    rng = random.Random(20260815)
    for y in range(WNETRZE):
        czyste = ~skazone[y]
        # Fazka siedzi w kolumnach 0-2 i 29-31; do odtworzenia płaskiego środka
        # bierzemy tylko to, co jest i czyste, i w środku wiersza.
        maska = czyste.copy()
        maska[:3] = False
        maska[29:] = False
        if not maska.any():
            continue
        wzor = np.median(med[y][maska], axis=0)
        for x in range(WNETRZE):
            if skazone[y, x]:
                # +-1 szumu, deterministycznie — płaska plama w środku kafla
                # odcinałaby się od ziarnistego tła sąsiadów.
                tlo[y, x] = np.clip(wzor + rng.randint(-1, 1), 0, 255)
            elif 3 <= x < 29 and 3 <= y < 29:
                # ⚠ Drugie sito, i ono jest konieczne. Przy 3 z 9 kafli mediana
                # wraca jeszcze tłem, ale pojedyncze piksele potrafią zostać
                # wyraźnie ciemniejsze — resztki po cudzych glifach. Jeden taki
                # piksel byłby ziarnem; ten sam piksel powtórzony w TRZECH
                # kaflach korzystających z tego tła (spodnie + dwie mikstury)
                # czyta się już jako smuga. Przycinamy tylko odstające, szum
                # +-3 zostaje nietknięty.
                if abs(float(np.mean(tlo[y, x])) - float(np.mean(wzor))) > 6:
                    tlo[y, x] = np.clip(wzor + rng.randint(-1, 1), 0, 255)

    out = np.zeros((WNETRZE, WNETRZE, 4), dtype=int)
    out[:, :, :3] = np.rint(tlo)
    out[:, :, 3] = 217
    return out


# ── Dwa nowe glify ───────────────────────────────────────────────────────────
# Rysowane tak, jak rysowane są wszystkie pozostałe w referencji: PUSTY kontur
# 1 px, nie wypełniona bryła. To zostało sprawdzone na wydruku ASCII tuniki i
# butów, zanim cokolwiek powstało — wypełniona sylwetka wyglądałaby tu obco.


def _linia(px, x0, y0, x1, y1, kolor):
    if x0 == x1:
        for y in range(min(y0, y1), max(y0, y1) + 1):
            px[(x0, y)] = kolor
    elif y0 == y1:
        for x in range(min(x0, x1), max(x0, x1) + 1):
            px[(x, y0)] = kolor
    else:
        raise ValueError("tylko proste odcinki")


def rysuj_spodnie(tlo: np.ndarray) -> np.ndarray:
    """Nogawice: pasek w talii, dwie nogawki, prześwit między nimi."""
    kafel = tlo.copy()
    px = {}
    # obrys zewnętrzny
    _linia(px, 9, 6, 22, 6, KONTUR)  # talia
    _linia(px, 9, 6, 9, 26, KONTUR)  # lewy bok
    _linia(px, 22, 6, 22, 26, KONTUR)  # prawy bok
    _linia(px, 9, 9, 22, 9, KONTUR)  # dolna krawędź paska
    # krok i wewnętrzne krawędzie nogawek
    _linia(px, 15, 13, 16, 13, KONTUR)
    _linia(px, 14, 14, 14, 26, KONTUR)
    _linia(px, 17, 14, 17, 26, KONTUR)
    px[(15, 12)] = KONTUR
    px[(16, 12)] = KONTUR
    # nogawki u dołu
    _linia(px, 9, 26, 14, 26, KONTUR)
    _linia(px, 17, 26, 22, 26, KONTUR)
    # fazka: jasny piksel pod dolną krawędzią, jak w referencji
    for x in range(10, 14):
        px[(x, 27)] = FAZKA
    for x in range(18, 22):
        px[(x, 27)] = FAZKA
    px[(23, 10)] = ZMIEKCZENIE
    px[(8, 10)] = ZMIEKCZENIE
    return _naloz(kafel, px)


def rysuj_fiolke(tlo: np.ndarray) -> np.ndarray:
    """Fiolka: korek, szyjka, brzusiec i kreska poziomu płynu."""
    kafel = tlo.copy()
    px = {}
    # korek
    _linia(px, 13, 5, 18, 5, KONTUR)
    _linia(px, 13, 5, 13, 8, KONTUR)
    _linia(px, 18, 5, 18, 8, KONTUR)
    _linia(px, 13, 8, 18, 8, KONTUR)
    # szyjka
    _linia(px, 14, 9, 14, 12, KONTUR)
    _linia(px, 17, 9, 17, 12, KONTUR)
    # ramiona
    for i, (x, y) in enumerate([(13, 13), (12, 14), (11, 15)]):
        px[(x, y)] = KONTUR
        px[(31 - x, y)] = KONTUR
    # brzusiec
    _linia(px, 11, 15, 11, 24, KONTUR)
    _linia(px, 20, 15, 20, 24, KONTUR)
    px[(12, 25)] = KONTUR
    px[(19, 25)] = KONTUR
    _linia(px, 12, 25, 19, 25, KONTUR)
    # poziom płynu
    _linia(px, 12, 19, 19, 19, ZMIEKCZENIE)
    # fazka pod dnem
    for x in range(13, 19):
        px[(x, 26)] = FAZKA
    return _naloz(kafel, px)


def _naloz(kafel: np.ndarray, px: dict) -> np.ndarray:
    for (x, y), kolor in px.items():
        if 0 <= x < WNETRZE and 0 <= y < WNETRZE:
            kafel[y, x, :3] = kolor
            kafel[y, x, 3] = 217
    return kafel


# ── Składanie ramki ──────────────────────────────────────────────────────────


def zloz(src: np.ndarray, tlo: np.ndarray) -> np.ndarray:
    out = np.zeros((WYS, SZER, 4), dtype=int)

    glify = {}
    for nazwa, poz in ZRODLA_GLIFOW.items():
        if poz is not None:
            glify[nazwa] = wnetrze(src, *poz)
    glify["legs"] = rysuj_spodnie(tlo)
    glify["potion"] = rysuj_fiolke(tlo)

    # 1. wnętrza kafli
    for r in range(WIE):
        for c in range(KOL):
            y0 = KRATA0 + 1 + PODZIALKA * r
            x0 = KRATA0 + 1 + PODZIALKA * c
            out[y0 : y0 + WNETRZE, x0 : x0 + WNETRZE] = glify[UKLAD[r][c]]

    # 2. linie kraty. Pobierane z referencji w miejscu, gdzie NAPRAWDĘ są
    #    (pasmo kafli r1/r2 ma wszystkie trzy kolumny), więc kolor i alfa
    #    pochodzą z autorskiego rysunku, nie z mojego oszacowania.
    pion = src[50, KRATA0].copy()
    poziom = src[KRATA0, 50].copy()
    for c in range(KOL + 1):
        out[KRATA0 : KRATA_Y + 1, KRATA0 + PODZIALKA * c] = pion
    for r in range(WIE + 1):
        out[KRATA0 + PODZIALKA * r, KRATA0 : KRATA_X + 1] = poziom

    # 3. faza zewnętrzna: 3 px przed pierwszą linią kraty i po ostatniej.
    #    Wzór brany z referencji i odbijany, bo prawy górny narożnik pełnego
    #    prostokąta w referencji nie istnieje (patrz nagłówek).
    lewa = src[50, 0:KRATA0].copy()  # 3 px, od zewnątrz do środka
    gora = src[0:KRATA0, 50].copy()
    for i in range(KRATA0):
        out[KRATA0 : KRATA_Y + 1, i] = lewa[i]
        out[KRATA0 : KRATA_Y + 1, KRATA_X + KRATA0 - i] = lewa[i]
        out[i, KRATA0 : KRATA_X + 1] = gora[i]
        out[KRATA_Y + KRATA0 - i, KRATA0 : KRATA_X + 1] = gora[i]

    # 4. narożniki 3x3 — lewy górny verbatim, pozostałe jako jego odbicia.
    naroznik = src[0:KRATA0, 0:KRATA0].copy()
    out[0:KRATA0, 0:KRATA0] = naroznik
    out[0:KRATA0, KRATA_X + 1 : KRATA_X + 4] = naroznik[:, ::-1]
    out[KRATA_Y + 1 : KRATA_Y + 4, 0:KRATA0] = naroznik[::-1, :]
    out[KRATA_Y + 1 : KRATA_Y + 4, KRATA_X + 1 : KRATA_X + 4] = naroznik[::-1, ::-1]

    return out


def raport(out: np.ndarray, tlo: np.ndarray) -> None:
    alfa = out[:, :, 3]
    tresc = alfa > 0
    print(f"[1] rozmiar {out.shape[1]}x{out.shape[0]} (oczekiwane {SZER}x{WYS})")
    unik = sorted(set(np.unique(alfa).tolist()))
    print(f"[2] wartości alfy: {unik} — oczekiwane [0, 217]")
    print(f"[3] pokrycie: {tresc.mean()*100:.1f}% (prostokąt: wszystko poza ostatnim wierszem/kolumną)")
    # Każdy kafel musi być w pełni nieprzezroczysty — dziura w kaflu to dziura
    # w panelu, i widać ją dopiero na złożonym ekranie.
    zle = []
    for r in range(WIE):
        for c in range(KOL):
            y0 = KRATA0 + 1 + PODZIALKA * r
            x0 = KRATA0 + 1 + PODZIALKA * c
            blok = alfa[y0 : y0 + WNETRZE, x0 : x0 + WNETRZE]
            if (blok == 0).any():
                zle.append((r, c))
    print(f"[4] kafle z dziurą w alfie: {zle if zle else 'brak'} {'BLAD' if zle else 'OK'}")
    # Ile pikseli kafla NAPRAWDĘ należy do glifu. Zwykłe min/max jasności tego
    # nie mierzy — każdy kafel ma własną fazkę (ciemna góra, jasny dół), więc
    # rozpiętość wychodzi identyczna także dla kafla zupełnie pustego. Liczymy
    # odchylenie od odtworzonego czystego tła.
    lt = tlo[:, :, 0] * 0.3 + tlo[:, :, 1] * 0.6 + tlo[:, :, 2] * 0.1
    for r in range(WIE):
        wiersz = []
        for c in range(KOL):
            y0 = KRATA0 + 1 + PODZIALKA * r
            x0 = KRATA0 + 1 + PODZIALKA * c
            b = out[y0 : y0 + WNETRZE, x0 : x0 + WNETRZE, :3]
            lum = b[:, :, 0] * 0.3 + b[:, :, 1] * 0.6 + b[:, :, 2] * 0.1
            ile = int((np.abs(lum - lt) > 7).sum())
            wiersz.append(f"{UKLAD[r][c]}:{ile}{'  BLAD' if ile < 40 else ''}")
        print(f"[5] piksele glifu r{r}: " + "  ".join(wiersz))


def podglad(out: np.ndarray, sciezka: str, skala: int = 6) -> None:
    """Na tle panelu (UI.bg = 0x14161f), bo arkusz jest półprzezroczysty i
    oceniać go w próżni nie ma sensu."""
    img = Image.fromarray(out.astype(np.uint8), "RGBA")
    tlo = Image.new("RGBA", img.size, (0x14, 0x16, 0x1F, 255))
    zloz_img = Image.alpha_composite(tlo, img).convert("RGB")
    zloz_img.resize((img.width * skala, img.height * skala), Image.NEAREST).save(sciezka)
    print(f"[podgląd] {sciezka}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--podglad", metavar="PLIK", help="zapisz podgląd 6x na tle panelu")
    args = ap.parse_args()

    src = wczytaj_zrodlo()
    tlo = czyste_tlo(src)
    out = zloz(src, tlo)
    raport(out, tlo)

    os.makedirs(os.path.dirname(WYJSCIE), exist_ok=True)
    Image.fromarray(out.astype(np.uint8), "RGBA").save(WYJSCIE)
    print(f"[zapis] {WYJSCIE}")

    if args.podglad:
        podglad(out, args.podglad)


if __name__ == "__main__":
    main()

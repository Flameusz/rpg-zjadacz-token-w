# -*- coding: utf-8 -*-
"""
MASTER SHIELD CONSTRUCTION STANDARD — sześć bazowych tarcz DREWNIANYCH.

⭐⭐ Na tym etapie każda z sześciu tarcz to JEDNO I TO SAMO: deska przy desce,
przycięta do kształtu konstrukcji. ⛔ Bez umba, bez okuć, bez obrzeży, bez
poziomych belek, bez centralnych grzbietów, bez heraldyki, bez metalu.
Różnica między tarczami ma płynąć WYŁĄCZNIE z kształtu, proporcji i światła.

⚠ To nie jest niedokończona wersja „pełnej" tarczy — to jest DECYZJA
KATALOGOWA (2026-09-18). Umbo, obrzeże, wzmocnienie i metal są osiami
WARIANTU (materiał / jakość / konstrukcja) i dokładają się DO tej bryły.
Baza ma być najczystszą reprezentacją swojej konstrukcji, żeby wariant miał
gdzie się pokazać. ⛔ Nie „uzupełniaj" jej z powrotem o historyczne detale.

Rysowane NATYWNIE w docelowej rozdzielczości (32x32 / 32x64). ⛔ Nic tu nie
jest skalowane w dół z dużej grafiki — przy tej wielkości taniej narysować niż
odzyskiwać z downscalu (ta sama lekcja co `build_ikony_jedzenia.py`), a Pixel
Snapper i tak zjadłby każdy detal, którego nie ma w tej siatce.

────────────────────────────────────────────────────────────────────────────
1. JEDNA SKALA ŚWIATA DLA CAŁEJ RODZINY: 0,44 px = 1 cm
────────────────────────────────────────────────────────────────────────────
Rozmiar ikony NIE jest decyzją estetyczną — wynika z historycznego wymiaru
konstrukcji przemnożonego przez jedną, wspólną stałą. Dzięki temu „ta tarcza
jest większa" znaczy w plecaku to samo, co na polu bitwy, a każda przyszła
konstrukcja dostaje rozmiar z tabliczki mnożenia, nie z oka.

  konstrukcja | historycznie (wys x szer) | px      | desek | footprint
  buckler     |  38 x 38 cm               | 17 x 17 |   3   | 1x1
  round       |  66 x 66 cm               | 29 x 29 |   5   | 1x1
  heater      |  68 x 62 cm               | 29 x 27 |   5   | 1x1
  almond      | 105 x 55 cm               | 45 x 23 |   4   | 1x2
  scutum      | 106 x 57 cm               | 47 x 25 |   5   | 1x2
  pavise      | 112 x 48 cm               | 49 x 21 |   4   | 1x2

⚠⚠ SZEROKOŚĆ TARCZY WYPUKŁEJ TO CIĘCIWA, NIE ŁUK. Ikona jest widokiem z przodu,
a scutum i pawęż to wycinki walca — ich „szerokość" z tabel historycznych bywa
mierzona po łuku (Dura-Europos: łuk 86 cm, cięciwa 41 cm). Legionowa stała przez
to na 63 cm i dominowała nad rodziną (1,88x powierzchni okrągłej); 57 cm cięciwy
daje 1,67x. ⭐ Reguła skali się nie ugięła — poprawione zostało WEJŚCIE do niej.
⛔ Nie „dostrajaj" mnożnika 0,44 px/cm, żeby coś wyglądało lepiej.

⚠⚠ SZEROKOŚĆ DESKI JEST STAŁA (11-14 cm): większa tarcza ma WIĘCEJ desek, nie
szersze (3 → 4 → 5). Liczba spoin niesie skalę nawet wtedy, gdy tarcza stoi sama.

⚠⚠ SYLWETKA 1x1 MA SUFIT 30 px i rycerska już w nim siedzi (68 cm → 29 px).
Jej „powiększenia" nie da się załatwić wysokością — zostaje szerokość i
obniżenie tych dużych. ⛔ Nie obchodź tego, dając jej gabaryt 1x2.

⚠ ALMOND DOSTAŁ 1x2 Z POMIARU, NIE Z GUSTU. Przy skali rodziny nawet najkrótszy
historyczny wariant (75 cm) to 33 px — nie mieści się w polu 1x1 (max 30 px).

────────────────────────────────────────────────────────────────────────────
2. PALETA: NIE MIESZKA TUTAJ — `tools/wood_palette.py`
────────────────────────────────────────────────────────────────────────────
⭐⭐ Kolory są WSPÓLNYM STANDARDEM DREWNA całego ekwipunku (29 kolorów: rampa
12 stopni + słój cieplejszy/chłodniejszy na stopniach 3-10 + kontur). To samo
drewno ma nieść rękojeści, trzonki, drzewce, łuki, skrzynie i beczki.
⛔ Nie wpisuj brązu „tylko dla tarczy" — od tego zaczyna się sześć mikro-palet
zamiast jednego materiału. Reguły rampy, słojów i użycia na cienkich
elementach: docstring `wood_palette.py`.

Zmierzone współdzielenie: 13 kolorów występuje we WSZYSTKICH sześciu tarczach
i niosą one 87,1% pikseli rodziny. Tarcza używa 17-23 tonów z 29, a cztery tony
standardu nie pojawiają się na żadnej tarczy — pracują na beczce, wieku i blacie.
⭐ STANDARD JEST SŁOWNIKIEM, TARCZA JEST ZDANIEM: nie wymuszaj użycia całej
palety na jednej ikonie, bo to prosta droga do patchworku.

⚠⚠ AMPLITUDY CIENIOWANIA SĄ W SZCZEBLACH RAMPY, więc zależą od jej gęstości
(stała SKALA niżej). Przy zmianie liczby stopni w standardzie trzeba je
przeliczyć — inaczej ten sam „-3,4 szczebla" na spoinie znaczy inną jasność.

────────────────────────────────────────────────────────────────────────────
3. CIENIOWANIE: FORMA + DESKI + KRAWĘDŹ, składane w POZIOMACH, nie w pasach
────────────────────────────────────────────────────────────────────────────
Każdy piksel dostaje liczbę zmiennoprzecinkową (poziom w rampie), a nie kolor:

  poziom = BAZA + forma(x,y) + deska(nr) + spoina/kant + krawędź + dół/góra

Dopiero suma jest kwantowana. Stąd biorą się DUŻE, logiczne grupy tonalne
zamiast paskowania: składniki sumują się i wpadają do tego samego szczebla.

⚠ Forma zależy od KONSTRUKCJI, nie jest jedna dla wszystkich:
  kula  — puklerz, okrągła (światło radialne, koncentryczne grupy)
  walec — rycerska, migdałowa, legionowa (lambert na walcu)
  pion  — pawęż (ten sam walec, spłaszczony: długie, spokojne pola pionowe)

────────────────────────────────────────────────────────────────────────────
4. CZEGO TU JUŻ NIE MA (i dlaczego nie wracać po to do historii repo)
────────────────────────────────────────────────────────────────────────────
Rewizja 2 miała piastę (puklerz, okrągła), poziomą belkę (legionowa) i pionowy
grzbiet (pawęż). Wszystkie trzy usunięte świadomie — patrz baner na górze.
Lekcje z tamtego kodu, przydatne, gdy WARIANT je przywróci:
  · umbo progowane po promieniu przy r = 2 px wychodzi ROMBEM, nie kołem;
  · pełny łuk cienia pod piastą 5 px czyta się jak UŚMIECH (twarz, nie wypukłość);
  · rampa elementu przy B:R = 0,60 czyta się jak KAMIEŃ wciśnięty w deskę;
  · piasta jaśniejsza od oświetlonego lica pcha się na pierwszy plan.

Przymiar: domyślnie liczy i drukuje raport, NIC nie zapisuje. Zapis: --zapisz
Test redukcji (Pixel Snapper): --snapper
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_shapes import KONSTRUKCJE  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "docs", "art-review")
SHEET = os.path.join(OUT_DIR, "shields-master.png")
PREVIEW = os.path.join(OUT_DIR, "shields-master-preview.png")
SNAP_TEST = os.path.join(OUT_DIR, "shields-master-snapper.png")
PARTS_DIR = os.path.join(OUT_DIR, "shields-master")
# ⚠ Generator pisze TAKŻE wprost do assetów gry. Kopiowanie ręczne z katalogu
#   przeglądowego rozjechałoby się przy pierwszej poprawce — dokładnie ta
#   „cicha rozbieżność", przed którą ostrzega `public/assets/README.md`.
GRA_DIR = os.path.join(ROOT, "public", "assets", "items")

PX_PER_CM = 0.44
CELL = 32
BUDZET_KOLOROW = 64
SS = 4  # nadpróbkowanie krawędzi

# ── PALETA: wspólny standard drewna całego ekwipunku ────────────────────────
# ⭐⭐ Kolory NIE mieszkają w tym pliku. Mieszkają w `tools/wood_palette.py`,
# bo to samo drewno ma później nieść rękojeści, trzonki, drzewce, łuki,
# skrzynie i beczki. ⛔ Nie wpisuj tu brązu „tylko dla tarczy" — od tego
# zaczyna się sześć mikro-palet zamiast jednego materiału.
from wood_palette import DROBNE, KONTUR, RAMPA, SLOJ_DO, SLOJ_OD, paleta, ton  # noqa: E402

OUT = KONTUR
PALETA = paleta()

# ⚠ Amplitudy cieniowania są w SZCZEBLACH RAMPY, więc zależą od jej gęstości.
# Przy przejściu z 13 stopni (skok 1,15x) na 10 (skok 1,20x) wszystkie zostały
# przemnożone przez 0,75 — inaczej ten sam „-3,4 szczebla" na spoinie znaczyłby
# 1,9x jasności zamiast 1,6x i lico rozjechałoby się w kontrastach.
# ⚠ SKALA = (liczba przedziałów rampy) / 12. Amplitudy niżej były strojone na
#   rampie 13-stopniowej (12 przedziałów), więc przy każdej zmianie gęstości
#   standardu przelicza się je TYM ułamkiem — inaczej „-3,4 szczebla" na
#   spoinie znaczy inną jasność i lico rozjeżdża się w kontrastach.
SKALA = 11 / 12
# ⚠ Baza trzyma JASNOŚĆ, nie numer szczebla: 83 (dawny stopień 5,7 na rampie
#   10-stopniowej). Naiwne przeliczanie numeru dało już raz rodzinę o 15%
#   ciemniejszą od zaakceptowanego renderu.
BAZA = 7.0  # środek rampy lica, w szczeblach standardu


# ── kształty i wymiary: WSPÓLNE ŹRÓDŁO ──────────────────────────────────────
# ⭐⭐ Kontury i tabela centymetrów mieszkają w `tools/shield_shapes.py`, bo
# czyta je także generator modeli 3D (`char3d_shields.py`). Do 2026-09-21 żyły
# wyłącznie tutaj, a model 3D miał własne wymiary „na oko" — zmierzone jako
# −38% (puklerz) i −28% (okrągła) względem tej tabeli.
# ⛔ Nie kopiuj ich z powrotem tutaj. Liczba desek i układ rzędów ZOSTAJĄ
# tutaj, bo są własnością ikony, nie konstrukcji.


def maska(fn, w, h):
    """Rasteryzacja z nadpróbkowaniem SSxSS, próg pokrycia 0,5, wymuszona symetria."""
    ys, xs = np.mgrid[0 : h * SS, 0 : w * SS]
    u = ((xs + 0.5) / SS - w / 2.0) / (w / 2.0)
    v = ((ys + 0.5) / SS - h / 2.0) / (h / 2.0)
    cov = fn(u, v).astype(np.float32).reshape(h, SS, w, SS).mean(axis=(1, 3))
    m = cov >= 0.5
    return m | m[:, ::-1]


def erozja(m):
    e = m.copy()
    e[1:, :] &= m[:-1, :]
    e[:-1, :] &= m[1:, :]
    e[:, 1:] &= m[:, :-1]
    e[:, :-1] &= m[:, 1:]
    e[0, :] = e[-1, :] = False
    e[:, 0] = e[:, -1] = False
    return e


# ── DESKI ───────────────────────────────────────────────────────────────────
# ⚠⚠ Wzory są WYŚRODKOWANE: deska w osi dostaje ton neutralny, a różnice rosną
# ku brzegom. Powód złapany na legionowej: przy wzorze „po kolei" środkowa deska
# wypadała pół tonu ciemniejsza od obu sąsiadek i razem ze swoimi spoinami
# czytała się jak DOKLEJONY CENTRALNY PAS.
#
# ⚠⚠ DRUGA REGUŁA, WAŻNIEJSZA: DESKA CIEPŁA NIGDY NIE SĄSIADUJE Z CHŁODNĄ.
# Wzór dla czterech desek miał kiedyś układ ciepła|chłodna|neutralna|ciepła —
# i to jest największy możliwy skok barwy w standardzie (B:R x0,85 obok x1,17).
# Zgłoszenie brzmiało „widzę deskę żółto-pomarańczową obok kremowo-orzechowej,
# to wygląda jak kilka gatunków drewna" i pomiar je potwierdził: obie tarcze
# czterodeskowe (pawęż, migdałowa) miały NAJWIĘKSZY rozrzut barwy w rodzinie.
#
# Dziś: najwyżej DWIE deski w tarczy mają słój, leżą po przeciwnych brzegach
# (ciepła od strony światła, chłodna od strony cienia — tak, jak pada światło),
# a między nimi są wyłącznie neutralne. Temperatura jest CZWARTA w kolejności
# ważności: najpierw wartość, potem konstrukcja, potem materiał, dopiero potem
# barwa deski. ⛔ Nie wracaj do gęstszego wariantowania „dla bogactwa".
DESKI_WZOR = {
    3: [(0.35, 1), (0.00, 0), (-0.35, 0)],
    4: [(0.35, 1), (-0.20, 0), (0.20, 0), (-0.35, 2)],
    5: [(0.35, 1), (-0.22, 0), (0.00, 0), (0.22, 0), (-0.35, 2)],
}


# Liczba desek i liczba rzędów kafla — WŁASNOŚĆ IKONY, nie konstrukcji.
# ⚠⚠ SZEROKOŚĆ DESKI JEST STAŁA (11-14 cm): większa tarcza ma WIĘCEJ desek,
# nie szersze. Liczba spoin niesie skalę nawet wtedy, gdy tarcza stoi sama.
IKONA = {
    "buckler": dict(deski=3, rows=1),
    "round":   dict(deski=5, rows=1),
    "heater":  dict(deski=5, rows=1),
    "almond":  dict(deski=4, rows=2),
    "scutum":  dict(deski=5, rows=2),
    "pavise":  dict(deski=4, rows=2),
}

TARCZE = [
    dict(key=k, pl=v["pl"], cm=v["cm"], ksztalt=v["ksztalt"], forma=v["forma"],
         **IKONA[k])
    for k, v in KONSTRUKCJE.items()
]


def lambert_walec(u):
    """Światło z góry-lewej na walcu: szczyt jasności przy u ≈ -0,6."""
    nz = np.sqrt(np.clip(1.0 - u * u, 0.0, 1.0))
    return np.clip(-0.60 * u + 0.80 * nz, 0.0, 1.0)


def lambert_kula(u, v):
    """To samo na spłaszczonej kopule — grupy tonalne układają się radialnie."""
    nx, ny = u * 0.92, v * 0.92
    nz = np.sqrt(np.clip(1.0 - nx * nx - ny * ny, 0.0, 1.0))
    return np.clip(-0.48 * nx - 0.50 * ny + 0.72 * nz, 0.0, 1.0)


def nieparzyste(n):
    n = int(round(n))
    return n if n % 2 == 1 else n - 1


def rysuj(t):
    cm_h, cm_w = t["cm"]
    h, w = nieparzyste(cm_h * PX_PER_CM), nieparzyste(cm_w * PX_PER_CM)
    m = maska(t["ksztalt"], w, h)
    wnetrze = erozja(m)
    cx, cy = (w - 1) / 2.0, (h - 1) / 2.0

    yy, xx = np.mgrid[0:h, 0:w]
    u = (xx - cx) / (w / 2.0)
    v = (yy - cy) / (h / 2.0)

    # 1. FORMA — duże grupy tonalne wynikające z bryły konstrukcji
    if t["forma"] == "kula":
        poziom = BAZA + (lambert_kula(u, v) - 0.56) * 7.6 * SKALA
    elif t["forma"] == "pion":
        # ⚠ Amplituda PODNIESIONA z 5,4 i kompresja z 0,82 → 0,92. Pawęż miała
        #   rozrzut 1,8 szczebla przy 2,2 reszty rodziny i tylko 10% pikseli
        #   w górnych szczeblach wobec 21-24% u sąsiadek — i właśnie TO, a nie
        #   barwa, czytało się jako „inny gatunek drewna" (średnia barwa obu
        #   tarcz różniła się o 0,004 G/R). Materiał jest jeden; różnić ma
        #   GEOMETRIA światła, nie jego zakres.
        poziom = BAZA + (lambert_walec(u * 0.92) - 0.59) * 6.5 * SKALA - 0.9 * SKALA * v
    else:
        poziom = BAZA + (lambert_walec(u) - 0.58) * 6.8 * SKALA - 1.0 * SKALA * v

    # 2. DESKI — numer deski, jej ton i jej SŁÓJ
    # ⚠ Granice liczone symetrycznie od osi: wzór `w*i/deski` przy 15 px stawia
    #   spoinę o piksel obok środka i tarcza wygląda na krzywą.
    n = t["deski"]
    granice = [int(round(cx + (i - n / 2.0) * (w / float(n)))) for i in range(1, n)]
    nr_deski = np.zeros((h, w), int)
    for g in granice:
        nr_deski += (xx >= g).astype(int)

    wzor = DESKI_WZOR[n]
    slojd = np.zeros((h, w), int)
    for i in range(n):
        off, sloj = wzor[i % len(wzor)]
        sel = nr_deski == i
        poziom = np.where(sel, poziom + off * SKALA, poziom)
        slojd = np.where(sel, sloj, slojd)

    # 3. SPOINA i KANT sąsiedniej deski — to one niosą „zbite z desek"
    for g in granice:
        if 0 <= g < w:
            poziom[:, g] -= 3.4 * SKALA
        if 0 <= g + 1 < w:
            poziom[:, g + 1] += 0.85 * SKALA

    # 4. KRAWĘDŹ — kant w cieniu ciemnieje, kant pod światło jaśnieje
    ring = wnetrze & ~erozja(wnetrze)
    cien_kraw = ring & ((u > 0.10) | (v > 0.55))
    poziom = np.where(cien_kraw, poziom - 1.9 * SKALA, poziom)
    poziom = np.where(ring & ~cien_kraw, poziom + 0.9 * SKALA, poziom)

    # 5. OSADZENIE — dolna krawędź najciemniejsza, szczyt lekko rozjaśniony
    rzedy = np.nonzero(wnetrze.any(axis=1))[0]
    gora, dol = rzedy[0], rzedy[-1]
    pas = max(1, h // 14)
    poziom = np.where(yy >= dol - pas + 1, poziom - 1.1 * SKALA, poziom)
    poziom = np.where(yy <= gora + pas - 1, poziom + 0.5 * SKALA, poziom)

    idx = np.clip(np.rint(poziom), 0, len(RAMPA) - 1).astype(int)
    img = np.zeros((h, w, 4), np.uint8)
    for i in range(len(RAMPA)):
        for s in (0, 1, 2):
            img[wnetrze & (idx == i) & (slojd == s)] = (*ton(i, s), 255)

    # 6. KONTUR na końcu (wnętrze najpierw — odwrotnie obwódka znika tam,
    #    gdzie jest najcieńsza; usterka z `build_ikony_jedzenia.py`)
    img[m & ~wnetrze] = (*OUT, 255)
    img[~m] = (0, 0, 0, 0)
    return img, w, h


def wstaw(sheet, img, col, rows_span):
    h, w = img.shape[:2]
    x0 = col * CELL + (CELL - w) // 2
    y0 = (rows_span * CELL - h) // 2
    plat = sheet[y0 : y0 + h, x0 : x0 + w]
    sheet[y0 : y0 + h, x0 : x0 + w] = np.where(img[..., 3:4] > 0, img, plat)


def iou(a, b):
    """
    Podobieństwo sylwetek w polu 32x32 Z ZACHOWANIEM PROPORCJI.

    ⚠ Wersja rozciągająca każdą sylwetkę na pełny kwadrat kasowała proporcję —
    czyli tę cechę, która odróżnia okrągłą od migdałowej i legionową od pawęży.
    """

    def norm(mm):
        ys, xs = np.nonzero(mm)
        sub = mm[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        hh, ww = sub.shape
        s = 32.0 / max(hh, ww)
        nw, nh = max(1, int(round(ww * s))), max(1, int(round(hh * s)))
        im = Image.fromarray((sub * 255).astype(np.uint8)).resize((nw, nh), Image.BILINEAR)
        pole = np.zeros((32, 32), bool)
        pole[(32 - nh) // 2 : (32 - nh) // 2 + nh, (32 - nw) // 2 : (32 - nw) // 2 + nw] = (
            np.array(im) > 127
        )
        return pole

    na, nb = norm(a), norm(b)
    return (na & nb).sum() / max(1, (na | nb).sum())


def snapper(img, kolorow):
    """Symulacja AGRESYWNEJ redukcji palety (median cut, bez ditheringu)."""
    rgb = Image.fromarray(img[..., :3], "RGB").quantize(colors=kolorow, method=Image.MEDIANCUT)
    out = np.dstack([np.array(rgb.convert("RGB")), img[..., 3]])
    out[img[..., 3] == 0] = 0
    return out


def spoiny_po_redukcji(img, snap):
    """
    Ile PIONOWYCH granic tonalnych zostaje po redukcji.

    ⚠ Sama sylwetka to za mało: tarcza może przetrwać snapper jako jednolita
    plama i dalej „zdać" test. Deski są tu połową tożsamości, więc liczone są
    osobno — w wierszu przez środek, na obrazie przed i po redukcji.
    """

    def granice(a):
        y = a.shape[0] // 2
        rzad = a[y]
        widoczne = np.nonzero(rzad[:, 3] > 0)[0]
        if len(widoczne) < 4:
            return 0
        x0, x1 = widoczne[0] + 1, widoczne[-1] - 1
        pas = rzad[x0 : x1 + 1, :3].astype(int)
        return int((np.abs(np.diff(pas, axis=0)).sum(axis=1) > 10).sum())

    return granice(img), granice(snap)


def main():
    zapis = "--zapisz" in sys.argv
    test_snap = "--snapper" in sys.argv
    sheet = np.zeros((2 * CELL, len(TARCZE) * CELL, 4), np.uint8)
    wyniki, bledy = [], []

    print("=" * 78)
    print("MASTER SHIELD CONSTRUCTION STANDARD — BASIC WOODEN, skala %.2f px/cm" % PX_PER_CM)
    print("⛔ same pionowe deski: bez umba, bez belki, bez grzbietu, bez metalu")
    print("=" * 78)

    def lum(c):
        return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]

    zapas = lum(RAMPA[0]) / max(lum(OUT), 0.1)
    print(f"zapas konturu do najciemniejszego drewna: x{zapas:.2f} (minimum x2,00)")
    if zapas < 2.0:
        bledy.append(f"kontur ma zapas tylko x{zapas:.2f} do RAMPA[0] — przy redukcji palety sklei się z licem")

    print(f"{'konstrukcja':<12}{'cm':>10}{'px':>9}{'desek':>7}{'foot':>6}"
          f"{'pole':>7}{'wypeł.':>8}{'tonów':>7}")

    for i, t in enumerate(TARCZE):
        img, w, h = rysuj(t)
        rows = t["rows"]
        miesci = w <= CELL and h <= rows * CELL
        if miesci:
            wstaw(sheet, img, i, rows)
        alpha = img[..., 3]
        area = int((alpha > 0).sum())
        kolory = {tuple(int(q) for q in c) for c in img[alpha > 0][:, :3]}
        print(f"{t['key']:<12}{t['cm'][0]:>5}x{t['cm'][1]:<4}{h:>5}x{w:<4}{t['deski']:>7}"
              f"{'1x' + str(rows):>6}{area:>7}"
              f"{area / (CELL * CELL * rows) * 100:>7.1f}%{len(kolory):>7}")
        wyniki.append((t, img, alpha > 0, area))

        if not miesci:
            bledy.append(f"{t['key']}: {w}x{h} nie mieści się w {CELL}x{rows * CELL}")
        if set(np.unique(alpha).tolist()) - {0, 255}:
            bledy.append(f"{t['key']}: alfa nie jest binarna (halo / półprzezroczystość!)")
        obce = kolory - {tuple(c) for c in PALETA}
        if obce:
            bledy.append(f"{t['key']}: kolor spoza palety rodziny {sorted(obce)[:3]}")
        if len(kolory) < 8:
            bledy.append(f"{t['key']}: tylko {len(kolory)} tonów — lico jest płaskie")
        przed, _ = spoiny_po_redukcji(img, img)
        if przed < t["deski"] - 1:
            bledy.append(f"{t['key']}: w środkowym wierszu widać {przed} granic — deski się nie czytają")

    # ⚠⚠ SPÓJNOŚĆ MATERIAŁU W RODZINIE — asercja powstała ze zgłoszenia
    # „legionowa jest żółto-pomarańczowa, a pawęż spłowiała". Pomiar pokazał, że
    # ŚREDNIA BARWA obu różniła się o 0,004 G/R, czyli praktycznie wcale;
    # różnił je ZAKRES DYNAMIKI: rozrzut 2,20 vs 1,81 szczebla i 26% vs 16%
    # pikseli w górnych szczeblach. Tarcza siedząca w środku rampy czyta się
    # jako inny, spłowiały gatunek drewna — mimo wspólnej palety.
    # ⛔ Nie rozwiązuj tego kolorem per tarcza; to jest wada MAPOWANIA światła.
    stopnie = {}
    for _i in range(len(RAMPA)):
        for _s in (0, 1, 2):
            stopnie.setdefault(ton(_i, _s), _i)
    dyn = []
    for t, im, _, _ in wyniki:
        px = im[im[..., 3] > 0][:, :3]
        lico = px[~np.all(px == np.array(OUT, np.uint8), axis=1)]
        s = np.array([stopnie[tuple(int(q) for q in c)] for c in lico], float)
        dyn.append((t["key"], s.mean(), s.std(), (s >= len(RAMPA) - 2).mean() * 100))
    sr = np.mean([d[1] for d in dyn])
    print("")
    print("SPÓJNOŚĆ MATERIAŁU — ten sam gatunek drewna na każdej tarczy")
    print(f"{'tarcza':<11}{'średni szczebel':>16}{'rozrzut':>9}{'% w górnych':>13}")
    for k, m, sd, g_ in dyn:
        print(f"{k:<11}{m:>16.2f}{sd:>9.2f}{g_:>12.1f}%")
    r_min, r_max = min(d[2] for d in dyn), max(d[2] for d in dyn)
    g_min, g_max = min(d[3] for d in dyn), max(d[3] for d in dyn)
    print(f"rozrzut {r_min:.2f}–{r_max:.2f} (x{r_max / r_min:.2f}, limit x1,25) · "
          f"górne szczeble {g_min:.1f}–{g_max:.1f}% (x{g_max / max(g_min, 0.1):.2f}, limit x1,80)")
    if r_max / r_min > 1.25:
        bledy.append(f"rozrzut tonalny rozjeżdża się x{r_max / r_min:.2f} — tarcze czytają się jak różne gatunki")
    if g_max / max(g_min, 0.1) > 1.80:
        bledy.append(f"udział górnych szczebli rozjeżdża się x{g_max / max(g_min, 0.1):.2f} — jedna tarcza jest spłowiała")
    for k, m, _, _ in dyn:
        if abs(m - sr) > 0.7:
            bledy.append(f"{k}: średni szczebel {m:.2f} odstaje od rodziny ({sr:.2f}) o ponad 0,7")

    rodzina = {tuple(int(q) for q in c) for _, im, _, _ in wyniki for c in im[im[..., 3] > 0][:, :3]}
    print("-" * 78)
    print(f"paleta CAŁEJ rodziny: {len(rodzina)} kolorów (budżet {BUDZET_KOLOROW}; "
          f"standard `wood_palette.py`)")
    if len(rodzina) > BUDZET_KOLOROW:
        bledy.append(f"paleta rodziny {len(rodzina)} > {BUDZET_KOLOROW}")

    print("\nROZPOZNAWALNOŚĆ SYLWETKI — każda para: inny KSZTAŁT albo x2 POWIERZCHNI")
    for a in range(len(wyniki)):
        for b in range(a + 1, len(wyniki)):
            ta, _, ma, aa = wyniki[a]
            tb, _, mb, ab = wyniki[b]
            j = iou(ma, mb)
            r = max(aa, ab) / max(1, min(aa, ab))
            ok = (j < 0.86) or (r >= 2.0)
            if j >= 0.78 or r < 1.35 or not ok:
                print(f"  {'OK ' if ok else '!! '}{ta['key']:>8} / {tb['key']:<8} "
                      f"kształt IoU {j:.2f}  powierzchnia x{r:.2f}")
            if not ok:
                bledy.append(f"para {ta['key']}/{tb['key']}: IoU {j:.2f} przy x{r:.2f} — nie do odróżnienia")

    if test_snap:
        print("\nPIXEL SNAPPER — sylwetka ORAZ deski po agresywnej redukcji")
        for t, img, mm, _ in wyniki:
            czesci = [f"  {t['key']:<9}"]
            for kolorow in (16, 10, 6):
                s = snapper(img, kolorow)
                sylwetka_ok = ((s[..., 3] > 0) == mm).all()
                przed, po = spoiny_po_redukcji(img, s)
                czesci.append(f"{kolorow:>3}→ sylwetka {'OK' if sylwetka_ok else 'ZMIENIONA'}, "
                              f"granice desek {przed}→{po}")
                if not sylwetka_ok:
                    bledy.append(f"{t['key']}: snapper {kolorow} kolorów rusza sylwetkę")
                if po < t["deski"] - 2:
                    bledy.append(f"{t['key']}: po redukcji do {kolorow} zostaje {po} granic — deski znikają")
            print("  ".join(czesci))

    print("\nBŁĘDY:" if bledy else "\nwszystkie asercje zielone")
    for b in bledy:
        print("  [X] " + b)

    if zapis:
        os.makedirs(PARTS_DIR, exist_ok=True)
        Image.fromarray(sheet, "RGBA").save(SHEET)
        for t, img, _, _ in wyniki:
            cel = np.zeros((t["rows"] * CELL, CELL, 4), np.uint8)
            h, w = img.shape[:2]
            cel[(t["rows"] * CELL - h) // 2 : (t["rows"] * CELL - h) // 2 + h,
                (CELL - w) // 2 : (CELL - w) // 2 + w] = img
            Image.fromarray(cel, "RGBA").save(
                os.path.join(PARTS_DIR, f"{t['key']}_wood_{CELL}x{t['rows'] * CELL}.png")
            )
            if os.path.isdir(GRA_DIR):
                Image.fromarray(cel, "RGBA").save(
                    os.path.join(GRA_DIR, f"icon_shield_wood_{t['key']}.png")
                )
        zapisz_podglad(sheet, PREVIEW)
        if test_snap:
            pasy = [sheet] + [snapper(sheet, n) for n in (16, 10, 6)]
            wys = sheet.shape[0]
            plansza = np.zeros((wys * len(pasy), sheet.shape[1], 4), np.uint8)
            for i, p in enumerate(pasy):
                plansza[i * wys : (i + 1) * wys] = p
            zapisz_podglad(plansza, SNAP_TEST)
            print(f"  {SNAP_TEST}")
        print(f"\nZAPISANO:\n  {SHEET}\n  {PREVIEW}\n  {PARTS_DIR}/*.png")
    else:
        print("\n(przymiar — nic nie zapisano; zapis: --zapisz)")
    return 1 if bledy else 0


def zapisz_podglad(arr, sciezka, sk=6):
    pod = Image.fromarray(arr, "RGBA").resize((arr.shape[1] * sk, arr.shape[0] * sk), Image.NEAREST)
    tlo = Image.new("RGBA", pod.size, (26, 24, 28, 255))
    for gx in range(0, pod.size[0], CELL * sk):
        for py in range(pod.size[1]):
            tlo.putpixel((gx, py), (64, 60, 66, 255))
    for gy in range(0, pod.size[1], CELL * sk):
        for px in range(pod.size[0]):
            tlo.putpixel((px, gy), (64, 60, 66, 255))
    tlo.alpha_composite(pod)
    tlo.save(sciezka)


if __name__ == "__main__":
    sys.exit(main())

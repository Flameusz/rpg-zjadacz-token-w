"""
Generator MODULOWEGO tilesetu budynkow -> public/assets/Buildings.png

Uruchom:  python tools/build_budynki.py            (podglad + weryfikacja, NIC nie zapisuje)
          python tools/build_budynki.py --zapisz   (nadpisuje arkusz + docs/budynki.json)

── DLACZEGO TO JEST TILESET, A NIE OSIEM GOTOWYCH DOMOW ────────────────────

Poprzednie dwa podejscia rysowaly CALE budynki jako propy wielokaflowe. Autor
projektu odrzucil to i mial racje z dwoch niezaleznych powodow:

1. **Kombinatoryka.** Drzwi wpieczone w kafel sciany znacza, ze kazde polozenie
   drzwi to nowy komplet kafli. Przy trzech szerokosciach domu i trzech
   miejscach na drzwi robi sie dziewiec razy ta sama sciana. Drzwi i okna sa
   NAKLADKAMI: leza w osobnym miejscu arkusza, na przezroczystym tle, i kladzie
   sie je na warstwie nad sciana.
2. **Zerowa elastycznosc.** Z gotowego domu 4x4 nie da sie zrobic domu 5x3.
   Z kafli — da sie kazdego.

Zakres celowo zwezony do jednego materialu: **sciany z belek + dach ze
strzechy**. Deski i gont wypadly. Lepiej jeden komplet zrobiony porzadnie niz
cztery zrobione bylejak — dokladnie ta sama zasada, co przy drzewach ("piec
rozpoznawalnych gatunkow jest warte wiecej niz jeden w pieciu odmianach").

── CO ZDECYDOWALO O JAKOSCI ────────────────────────────────────────────────

**Belka to WALEC, nie pasek.** Poprzednia wersja rysowala bierwiono jako
3 px tla z 1 px swiatla u gory i 1 px cienia u dolu — plaski pasek. Belka ma
8 px i pelny profil walca: ciemny rant, swiatlo blizej gory, dwa stopnie
zejscia w dol, ciemny szew pod spodem. To jest ta sama roznica, co miedzy
gradientem na okragu a kepami lisci przy krzakach.

**Zamek w naroczniku to KOLO, nie prostokat.** Wystajacy koniec belki rysujemy
jak tarcze: jasne pole, oswietlony luk od gory z lewej, ciemny rant, slój
w srodku. To po nim widac, ze to dom z bali, a nie sciana w poziome paski.

**Strzecha ma KURSY.** Slome uklada sie warstwami i widac poziome pasy, gdzie
kolejny kurs zachodzi na poprzedni. Sam pionowy szum bez pasow czyta sie jak
futro. Kurs ma 8 px: gora kursu jasniejsza, dol ciemniejszy (cien od zachodu
nastepnego kursu).

**Wszystkie okresy dziela 32.** Belka 8 px, kurs strzechy 8 px, kamien 8 px.
To jedyny powod, dla ktorego kafel srodkowy mozna powtarzac w pionie i w
poziomie bez szwu — i to sprawdza test [4]. Okres 7 albo 9 px daje kafel,
ktory wyglada dobrze osobno i rozjezdza sie po polozeniu drugiego obok.

── SKAD SIE BIORA KSZTALTY ─────────────────────────────────────────────────

Rysujemy, nie konwertujemy. `b1.jpg`, `b2.png` (materialy z Gemini) i zrzuty
z "Fantastic Buildings: Medieval" posluzyly jako WZORNIK proporcji i detalu.
Ani jeden ich piksel tu nie trafil: b2 ma 2816x1536 przy siatce ~117 px,
98 573 kolory i alfe min 255 / max 255 (tlo NAMALOWANE) — to pomniejszony
render, nie pixel art. Ten sam pomiar i ten sam wniosek co przy
height32_trees_mega_pack.png. Licencja obu: NIEUSTALONA.

Reczny arkusz sprzed generatora lezy jako `Buildings_v1_backup.png`.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 32
PITCH = 33
COLS = 19

BELKA = 8        # wysokosc jednej belki — 32 / 8 = 4 na kafel, bez reszty
KURS = 8         # wysokosc kursu strzechy — jak wyzej
OKAP_X = 6       # o ile sciana jest wsunieta wzgledem dachu (wizualny okap)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
D = PAL["drewno"]
K = PAL["kora"]
P = PAL["piasek"]
S = PAL["kamien"]
N = PAL["neutralne"]
A = PAL["akcent_cieply"]
Z = PAL["ziemia"]
W = PAL["woda"]


def pusty():
    return np.zeros((T, T, 4), np.uint8)


def kladz(px, y, x, kolor, alfa=255):
    if 0 <= y < px.shape[0] and 0 <= x < px.shape[1]:
        px[y, x, :3] = kolor
        px[y, x, 3] = alfa


def prostokat(px, y0, y1, x0, x1, kolor, alfa=255):
    for y in range(int(y0), int(y1)):
        for x in range(int(x0), int(x1)):
            kladz(px, y, x, kolor, alfa)


# ── BELKA ───────────────────────────────────────────────────────────────────
#
# Profil walca, od gory belki do dolu. Indeksy w rampie `drewno`.
# Swiatlo pada z gory lekko z lewej, wiec najjasniejszy pas siedzi w 1/4
# wysokosci, a nie w polowie — polowa dawalaby oswietlenie znad glowy.
# Zlacze ma DWA piksele: schodek (drewno[1]) i szpare (drewno[0]). Gorny rant
# nastepnej belki jest wtedy sredni, nie ciemny.
#
# Wersja poprzednia miala 6,7 = [0,0] i rant nastepnej belki na [1], czyli
# w sumie TRZY piksele prawie czerni na osiem. Belka zostawala z pieciu pikseli
# drewna i cala sciana czytala sie jak deski z przerwami — zgloszone jako "blad
# w belkach"; widac to dopiero przy powiekszeniu 8x, na planszy stykowej kafel
# wyglada dobrze. Osiem pikseli belki to szesc drewna i dwa zlacza, nie piec
# i trzy.
PROFIL_BELKI = [2, 3, 4, 4, 3, 2, 1, 0]


def belka(px, y_gora, x0, x1, los, ciemniej=0, slój=True):
    """Jedna belka od y_gora w dol, na szerokosc [x0, x1)."""
    for i, stopien in enumerate(PROFIL_BELKI):
        st = max(0, stopien - ciemniej)
        prostokat(px, y_gora + i, y_gora + i + 1, x0, x1, D[st])
    # Slój: JEDNA delikatna kreska, i tylko na CO DRUGIEJ belce. Poprzednia
    # wersja sypala kilka kresek plus czarne seki 2x2 na kazdej belce i sciana
    # czytala sie jak zaplesniala; nawet po jednej kresce na belke rytm byl za
    # gesty — drewno ma slój tam, gdzie akurat trafil rzaz, a nie wszedzie.
    if slój and x1 - x0 > 10:
        dl = int(los.integers(3, 7))
        sx = int(los.integers(x0 + 1, max(x0 + 2, x1 - dl)))
        prostokat(px, y_gora + 4, y_gora + 5, sx, sx + dl, D[max(0, 2 - ciemniej)])


def co_druga(y, rytm=0):
    """Czy belka zaczynajaca sie na wysokosci `y` dostaje detal (czop/slój)?

    Liczone z POZYCJI belki w kaflu, a nie licznikiem kolejnych belek — i to
    jest cala rzecz. Licznik zerowal sie na kazdym kaflu, a `sciana_gora`
    zaczyna belki od y=8 i miesci ich TRZY, czyli nieparzysta liczbe. Faza
    przewracala sie na granicy kafla i na scianie wychodzily raz dwie belki
    z czopem obok siebie, raz cztery bez zadnego — zamiast rownego naprzemian.
    Zgloszone jako "raz sa dwie belki, a nie naprzemian".

    Kafel ma 32 px, czyli DOKLADNIE cztery belki, wiec rytm liczony z `y`
    przechodzi przez granice kafla bez skoku. Ten sam powod, dla ktorego
    wszystkie okresy w tym arkuszu dziela 32.
    """
    return ((y // BELKA) + rytm) % 2 == 0


def _w_pasie(px, y0, y1, x0, x1, rysuj):
    """Rysuje `rysuj(bufor)` i wkleja WYLACZNIE pas [y0,y1) x [x0,x1).

    Wersja rysujaca wprost w kafel i "przycinajaca" nadmiar przez
    `px[:y0] = 0` kasowala takze to, co bylo narysowane WCZESNIEJ. Kosztowalo
    to kalenice: `kafel_kalenica` malowal grzbiet w wierszach 0-9, a nastepne
    wywolanie strzechy od y=10 wycieralo go do zera. Dach wychodzil plaska mata
    bez kalenicy i przez dwie iteracje wygladalo to na wade rysunku slomy, a
    bylo zwyklym zamazaniem.
    """
    bufor = np.zeros_like(px)
    rysuj(bufor)
    wycinek = bufor[y0:y1, x0:x1]
    maska = wycinek[..., 3] > 0
    cel = px[y0:y1, x0:x1]
    cel[maska] = wycinek[maska]


def sciana_belki(px, y0, y1, x0, x1, los, ciemniej=0, rytm=0):
    """Belki od y0 do y1. Faza liczona od 0 kafla, zeby kafle sie skladaly.

    `rytm` przesuwa, ktore belki dostaja slój — dzieki temu warianty kafla
    roznia sie nie tylko losowaniem, ale i rozkladem detalu.
    """
    def rysuj(buf):
        y = y0 - (y0 % BELKA)
        while y < y1:
            if y + BELKA > y0:
                belka(buf, y, x0, x1, los, ciemniej, co_druga(y, rytm))
            y += BELKA
    _w_pasie(px, y0, y1, x0, x1, rysuj)


def zamek(px, cy, x_zewn, strona, los):
    """Wystajacy koniec belki — TARCZA, nie prostokat.

    To jest sygnatura budynku z bali. Bez niej poziome belki czytaja sie jak
    deski polozone plasko i kazdy dom wyglada jak szopa.

    Promien 3 i wysiegnik 2 px, nie 4 i 7. Poprzednia wersja robila kule
    wystajaca poza lico sciany na tyle, ze budynek mial GULKI po bokach zamiast
    naroznika — zgloszone z zestawieniem obok materialu referencyjnego, gdzie
    czopy sa male i ledwie wychodza poza sciane.
    """
    # Czolo belki siedzi W KONCU BELKI, nie na zewnatrz niej: srodek tarczy
    # jest wsuniety o r-1, wiec poza lico sciany wychodzi 1 px. Wersja ze
    # srodkiem na zewnatrz wystawala 4 px i po zlozeniu domu czytala sie jak
    # rzad kul doklejonych do boku, a nie jak przeciete konce bierwion.
    r = 3
    cx = x_zewn + (-(r - 1) if strona > 0 else (r - 1))
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            d = dx * dx + dy * dy
            if d > r * r:
                continue
            y, x = cy + dy, cx + dx
            if d >= (r - 0.7) ** 2:
                kladz(px, y, x, D[0])                    # rant, prawie czarny
            elif dx * 0.6 + dy * 0.8 < -0.4:
                kladz(px, y, x, D[4])                    # przeciete drewno w swietle
            else:
                kladz(px, y, x, D[3])
    kladz(px, cy, cx, D[2])                              # slój


def zamki_kolumny(px, y0, y1, x_zewn, strona, los, rytm=0):
    """Czopy co DRUGA belke.

    W wiencu z bali kolejne belki lezа naprzemiennie — raz wystaje ta ze sciany
    frontowej, raz ta ze szczytowej. Czop przy KAZDEJ belce dawal ciagly sznur
    gulek i naroznik przestawal czytac sie jak wieniec. `rytm` przesuwa faze,
    zeby dwa warianty kafla nie mialy czopow w tych samych miejscach.
    """
    y = y0 - (y0 % BELKA)
    while y < y1:
        cy = y + BELKA // 2 - 1
        if y0 <= cy < y1 and co_druga(y, rytm):
            zamek(px, cy, x_zewn, strona, los)
        y += BELKA


# ── STRZECHA ────────────────────────────────────────────────────────────────

# Profil jednego kursu slomy, od gory kursu w dol. Indeksy w rampie `piasek`.
#
# Tylko DWA gorne piksele siegaja po najjasniejszy stopien. Pierwsza wersja
# trzymala cialo kursu na 3 i 4 i dach wychodzil wyprany — jasna, plaska mata,
# bez ciezaru. Rampa `piasek` ma na gorze #d5c08b i #f9ecad, wiec uzyta hojnie
# zjada cala sylwetke. Slomiany dach jest OCHRA z ciemnymi bruzdami, nie
# kremem.
PROFIL_KURSU = [4, 3, 3, 2, 2, 2, 1, 1]


def kurs_strzechy(px, y_gora, x0, x1, los, fala, jasnosc, ciemniej=0):
    """Jeden kurs slomy: 8 px, jasniej u gory, cien od zachodu u dolu.

    Kursy sa tym dla strzechy, czym profil walca dla belki — bez nich pionowy
    szum czyta sie jak futro, a nie jak dach.

    `fala` przesuwa granice kursu o -1..+1 px na kolumne. Bez tego wszystkie
    kursy leza na jednej idealnej poziomej linii i strzecha czyta sie jak
    TEKTURA FALISTA — regularnosc, ktorej w slomie nie ma. Fala jest funkcja
    samego x, wiec kursy zostaja rownolegle (dach, nie chaos) i wzor nadal ma
    okres 32, wiec kafel sie sklada.
    """
    for x in range(x0, x1):
        d = fala[x % T]
        for i in range(KURS):
            st = int(np.clip(PROFIL_KURSU[i] + jasnosc[x % T] - ciemniej, 0, 4))
            kladz(px, y_gora + i + d, x, P[st])
        if los.random() < 0.16:                # zdzblo wychodzace z kursu
            dl = int(los.integers(3, KURS))
            od = int(los.integers(0, KURS - dl + 1))
            for i in range(od, od + dl):
                st = max(0, PROFIL_KURSU[i] - 2 - ciemniej)
                kladz(px, y_gora + i + d, x, P[st])


def strzecha(px, y0, y1, x0, x1, los, ciemniej=0):
    # Fala i jasnosc kolumn liczone RAZ na kafel — inaczej kazdy kurs mialby
    # wlasny rozklad i pionowe pasma slomy urywalyby sie na kazdej granicy.
    #
    # Fala musi byc GLADKA, a nie losowa per kolumna. Wersja z `los.integers`
    # przesuwala kazda kolumne niezaleznie, wiec ciemny spod kursu rozpadal sie
    # na kropki i dach czytal sie jak cetkowane futro — dokladnie ta sama wada,
    # co akcenty sypane per piksel na trawie zamiast w skupiskach. Dwie
    # sinusoidy o okresie 32 i 16 daja falowanie i nadal skladaja sie w kafel.
    faza = float(los.random()) * 6.28
    fala = [int(np.clip(round(1.1 * np.sin(2 * np.pi * x / T + faza)
                              + 0.6 * np.sin(4 * np.pi * x / T)), -1, 1))
            for x in range(T)]
    jasnosc = [int(los.integers(-1, 2)) if los.random() < 0.45 else 0
               for _ in range(T)]

    def rysuj(buf):
        # o jeden kurs w gore i w dol wiecej: przesuniete kursy musza pokryc
        # skrajne wiersze kafla, inaczej fala zostawia przy krawedzi dziury
        y = y0 - (y0 % KURS) - KURS
        while y < y1 + KURS:
            kurs_strzechy(buf, y, x0, x1, los, fala, jasnosc, ciemniej)
            y += KURS
    _w_pasie(px, y0, y1, x0, x1, rysuj)


# ── KAFLE: SCIANA ───────────────────────────────────────────────────────────
#
# Komplet 3x3. Kolumna lewa/prawa jest WSUNIETA o OKAP_X — to stad bierze sie
# okap dachu bez wydawania na niego osobnych kafli: dach kryje pelna szerokosc
# kafla, sciana nie.

def _sciana_bok(strona):
    """Zakres x sciany dla kafla brzegowego (-1 lewy, +1 prawy, 0 srodkowy)."""
    if strona < 0:
        return OKAP_X, T
    if strona > 0:
        return 0, T - OKAP_X
    return 0, T


def kafel_sciana(strona, ziarno, wariant=0):
    px = pusty()
    los = np.random.default_rng(100 + ziarno + wariant * 7)
    x0, x1 = _sciana_bok(strona)
    sciana_belki(px, 0, T, x0, x1, los)
    if strona < 0:
        zamki_kolumny(px, 0, T, x0, -1, los)
    if strona > 0:
        zamki_kolumny(px, 0, T, x1 - 1, 1, los)
    return px


def kafel_sciana_gora(strona, ziarno):
    """Gorny wiersz sciany: 8 px cienia rzuconego przez okap + belki.

    Cien ma dokladnie 8 px, czyli jedna belke, zeby FAZA belek nie rozjechala
    sie miedzy tym kaflem a kaflami pod nim. Cien 3 px wygladal lepiej na
    jednym kaflu i lamal wszystkie ponizej.
    """
    px = pusty()
    los = np.random.default_rng(200 + ziarno)
    x0, x1 = _sciana_bok(strona)
    prostokat(px, 0, 6, x0, x1, K[1])
    prostokat(px, 6, 8, x0, x1, K[2])
    sciana_belki(px, 8, T, x0, x1, los)
    if strona < 0:
        zamki_kolumny(px, 8, T, x0, -1, los)
    if strona > 0:
        zamki_kolumny(px, 8, T, x1 - 1, 1, los)
    return px


def kafel_fundament(strona, ziarno):
    """Dolny wiersz: dwie belki + kamienna podmurowka + cien kontaktowy."""
    px = pusty()
    los = np.random.default_rng(300 + ziarno)
    x0, x1 = _sciana_bok(strona)
    sciana_belki(px, 0, 16, x0, x1, los)
    if strona < 0:
        zamki_kolumny(px, 0, 16, x0, -1, los)
    if strona > 0:
        zamki_kolumny(px, 0, 16, x1 - 1, 1, los)

    # podmurowka: ciosy NIEROWNE, inaczej czyta sie jak plytki lazienkowe
    prostokat(px, 16, 29, x0, x1, S[2])
    y, rzad = 16, 0
    while y < 29:
        h = min(5, 29 - y)
        x = x0 + (0 if rzad % 2 == 0 else 4)
        while x < x1:
            w = int(los.integers(6, 11))
            prostokat(px, y, y + 1, x, min(x + w, x1), S[3])
            prostokat(px, y + h - 1, y + h, x, min(x + w, x1), S[1])
            prostokat(px, y, y + h, min(x + w - 1, x1 - 1), min(x + w, x1), S[1])
            x += w
        y += h
        rzad += 1
    prostokat(px, 28, 29, x0, x1, S[0])
    # cien kontaktowy — jeden ciemny kolor z alfa, nie czern w sprite
    for dy in range(3):
        prostokat(px, 29 + dy, 30 + dy, x0 - 1, x1 + 1, N[0], 110)
    return px


# ── KAFLE: DACH ─────────────────────────────────────────────────────────────
#
# Kolumna lewa/prawa niesie wiatrownice (deske wzdluz szczytu) i konczy dach
# rownym pionem. Dach kryje PELNA szerokosc kafla, wiec wzgledem wsunietej
# sciany wychodzi 6 px okapu z kazdej strony.

def _kraw_szczytowa(px, strona, y0=0, y1=T):
    """Zawinieta krawedz strzechy nad szczytem — NIE deska.

    Pierwsza wersja kladla tu wiatrownice z rampy `kora`: dwa ciemne piksele
    na calej wysokosci dachu, ktore na trawie czytaly sie jak slup wbity przy
    domu. Strzecha na szczycie jest po prostu ZAWINIETA — grubszy, ciemniejszy
    walek slomy, bo swiatlo tam nie dochodzi.
    """
    if strona == 0:
        return
    for i, st in enumerate((1, 2, 2)):
        x = i if strona < 0 else T - 1 - i
        for y in range(y0, y1):
            if px[y, x, 3]:
                kladz(px, y, x, P[max(0, st - (1 if i == 0 else 0))])


def kafel_kalenica(strona, ziarno):
    """Wierzcholek: waleczkowaty grzbiet slomy + poczatek polaci."""
    px = pusty()
    los = np.random.default_rng(400 + ziarno)
    # Grzbiet: WALEK ZE SLOMY, nie konstrukcja z zerdzi.
    #
    # Pierwsza wersja kladla tu dwie poziome zerdzie i pionowe przewiazki co
    # 8 px w rampie `kora`. Na trawie czytalo sie to jak PLOT postawiony na
    # dachu i przez to caly dach wygladal na ucieta plyte — zglosil to autor
    # projektu, patrzac na zrzut z gry. Kalenica ma byc miekka: slomiany walek
    # zawiniety przez grzbiet, z ciemnym spodem od strony patrzacego.
    #
    # Gorny piksel jest SREDNI, nie najjasniejszy. Dach konczacy sie na gorze
    # najjasniejszym stopniem daje twarda, swiecaca krawedz — dokladnie to
    # "urwanie", ktore bylo widac.
    profil = [2, 3, 4, 4, 4, 3, 3, 2, 1, 0]
    for i, st in enumerate(profil):
        prostokat(px, i, i + 1, 0, T, P[st])
    # przewiazki: krotkie, jasne, w samej slomie — sugestia, nie rusztowanie
    for sx in range(3, T, 9):
        for i in range(2, 7):
            kladz(px, i, sx, P[max(0, profil[i] - 2)])
    strzecha(px, 10, T, 0, T, los)
    _kraw_szczytowa(px, strona)
    return px


def kafel_polac(strona, ziarno, wariant=0):
    px = pusty()
    los = np.random.default_rng(500 + ziarno + wariant * 13)
    strzecha(px, 0, T, 0, T, los)
    _kraw_szczytowa(px, strona)
    return px


def kafel_okap(strona, ziarno, ciemniej=0):
    """Dolna krawedz dachu: gruby, POSTRZEPIONY okap.

    Postrzepienie jest jedynym detalem, po ktorym slome widac jako slome —
    rowna krawedz czyta sie jak blacha.

    **Pod strzepami musi byc CIEN OKAPU, nie przezroczystosc.** Pierwsza wersja
    zostawiala miedzy strzepami dziury do tla i po zlozeniu domu miedzy dachem
    a sciana swiecil pas TRAWY — dach odklejal sie od budynku. To dokladnie ten
    sam blad, co 2 px trawy miedzy pniem a korona malej brzozy, tylko o pietro
    wyzej. Cien jest wsuniety o OKAP_X, bo tyle wynosi wysiegnik dachu ponad
    sciane; strzepy wychodza poza niego i tam moga byc przezroczyste.

    `ciemniej` przesuwa cala slome o stopien rampy w dol — uzywa tego dach
    szczytowy dla prawej polaci. Okap musi ten sam stopien dostac, bo inaczej
    ciemniejsza polac konczy sie jasnym okapem i szew widac na calej dlugosci.
    """
    px = pusty()
    los = np.random.default_rng(600 + ziarno)
    sx0, sx1 = _sciana_bok(strona)
    prostokat(px, 14, T, sx0, sx1, K[1])
    strzecha(px, 0, 16, 0, T, los, ciemniej)
    c = lambda i: P[max(0, i - ciemniej)]
    # gruby brzeg: odslonieta warstwa slomy, jasniejsza, z pionowymi zdzblami
    for x in range(T):
        prostokat(px, 16, 26, x, x + 1, c(4) if (x % 3) else c(3))
        if los.random() < 0.45:
            prostokat(px, 16 + int(los.integers(0, 4)), 26, x, x + 1, c(2))
    prostokat(px, 25, 27, 0, T, c(1))                     # cien pod okapem
    for x in range(T):
        dl = int(los.integers(0, 5))
        for i in range(dl):
            prostokat(px, 27 + i, 28 + i, x, x + 1, c(2) if i < dl - 1 else c(1))
    _kraw_szczytowa(px, strona, 0, 27)
    return px


def kafel_przybud_styk(strona, ziarno):
    """Gorny rzad polaci PRZYBUDOWKI: slome widac wchodzaca POD sciane.

    ── DLACZEGO PRZYBUDOWKA KOSZTUJE TRZY KAFLE, A NIE CZTERNASCIE ─────────
    `docs/wioska_plan.md` B17 wyceniala komplet na ~12-16 kafli (9 na polac,
    3 na styk, 2 na narozniki). Wycena zakladala, ze dach jednospadowy trzeba
    narysowac od zera. Nie trzeba: dach pulpitowy to DOKLADNIE dach kalenicowy
    z `_dach_plaski` (kursy poziome, kalenica u gory, okap u dolu) z jedna
    roznica — gorna krawedz nie konczy sie grzbietem, tylko wchodzi w sciane
    budynku glownego. `polac`, `polac2` i `okap` sa wiec reuzywane bez zmiany,
    a nowy jest wylacznie rzad zastepujacy `kalenice`.

    ── NAROZNIKI STYKU SA NIEPOTRZEBNE, I TO NIE JEST SKROT ────────────────
    B17 przewidywala 2 kafle na narozniki, powolujac sie na regule
    `_naroznik_okapu`: "pasmo wylewa sie poza swoj kafel". Ta regula dotyczy
    pasm biegnacych PO SKOSIE — pas szerokosci w px wypycha trojkat w dwa
    sasiednie kafle, bo przekatna przecina ich rogi. Dach pulpitowy w tym
    rzucie nie ma ani jednej przekatnej: kursy sa poziome, krawedz styku jest
    pozioma, krawedzie boczne pionowe. Nie ma czemu sie wylac.

    ── WARSTWOWANIE: ROZSTRZYGNIETE PRZEZ WYPIECZENIE, NIE PRZEZ WARSTWE ───
    B17 zostawiala otwarte pytanie, czy przybudowka potrzebuje wlasnej warstwy,
    bo "jej polac musi rysowac sie PRZED sciana budynku glownego, inaczej
    wystaje na nia i wyglada jak naklejka". Rozstrzygniecie: **nie potrzebuje**.
    Cien sciany jest WPIECZONY w gorne piksele tego kafla, a kafel nie wchodzi
    w komorke sciany — dokladnie ta sama zasada, ktora komplet stosuje juz przy
    kominie ("kafel komina ZASTEPUJE kafel dachu, a nie naklada sie na niego").
    Dzieki temu przybudowka jedzie na `buildings-over` jak kazdy inny dach,
    sciana zostaje na `buildings`, i nigdy nie dziela jednej komorki — czyli
    nie ma zadnej kolejnosci rysowania do popsucia.

    Cien ma NIEROWNA dolna granice. Prosta linia czyta sie jak listwa
    przybita do sciany, a nie jak sloma wepchnieta pod okap; to ten sam powod,
    dla ktorego kursy strzechy faluja, a okap jest postrzepiony.
    """
    px = pusty()
    los = np.random.default_rng(700 + ziarno)
    strzecha(px, 0, T, 0, T, los)
    prostokat(px, 0, 3, 0, T, K[0])
    prostokat(px, 3, 5, 0, T, K[1])
    for x in range(T):
        if los.random() < 0.5:
            prostokat(px, 5, 6, x, x + 1, K[1])
    _kraw_szczytowa(px, strona)
    return px


def _rozszerz(m, n):
    """Dylatacja maski o `n` pikseli, 4-sasiedztwo. Bez scipy — jeden import
    mniej w narzedziu, ktore poza tym potrzebuje tylko numpy i PIL."""
    out = m.copy()
    for _ in range(n):
        r = out.copy()
        r[1:, :] |= out[:-1, :]
        r[:-1, :] |= out[1:, :]
        r[:, 1:] |= out[:, :-1]
        r[:, :-1] |= out[:, 1:]
        out = r
    return out


def kafel_dolina(bazowy, ziarno, tlo=None):
    """KOSZ (dolina): kafel ramienia dachu /\\ z wypelnionym zewnetrzem.

    ── PO CO ───────────────────────────────────────────────────────────────
    Budynek na rzucie L / T / U ma skrzydlo wychodzace NA GRACZA, wcinajace
    sie w polac skrzydla biegnacego w glab. Zeby oba dachy czytaly sie jako
    JEDEN, szczyt blizszego musi WEJSC w polac dalszego, a nie zatrzymac sie
    pod nia — dwa dachy, ktore sie stykaja zamiast przenikac, zawsze czytaja
    sie jak dwa budynki. Zglosil to autor projektu, patrzac na zlozone L.

    Wejsc jednak nie mogl, i to nie z powodu ukladu: kafle `szczyt` i `skos`
    sa **z definicji przezroczyste na zewnatrz przekatnej** — tak wlasnie
    powstaje sylwetka szczytu (zmierzone: po 496 px przezroczystych, w 76%
    w gornej polowie kafla; wszystkie kafle `_kal` sa w pelni kryjace). Na
    mapie kafel skrzydla blizszego ZASTEPUJE kafel dalszego w tej samej
    komorce, wiec ta przezroczystosc zamienia sie w TRAWE. Widac to bylo jako
    zielona wyrwe w polaci skrzydla dalszego.

    Ten kafel to rozwiazuje: to jest DOKLADNIE ten sam kafel ramienia, tylko
    z zewnetrzem przekatnej wypelnionym strzecha skrzydla dalszego i ciemnym
    zalamaniem na styku obu polaci.

    ── DLACZEGO TYLKO CZTERY KAFLE ─────────────────────────────────────────
    `_dach_szczytowy` daje kazdej kolumnie dokladnie JEDEN kafel na gornej
    krawedzi pasa: `szczyt` przy osi, `skos` poza nia. Wiersze powyzej sa
    w planie skrzydla blizszego puste, wiec kafel dalszego skrzydla po prostu
    tam zostaje i niczego nie trzeba podmieniac. Komplet to wiec `szczyt`
    i `skos` razy dwie strony — cztery kafle, ktore obsluguja L, T oraz U
    tak samo, bo we wszystkich trzech ksztaltach styk jest ten sam, tylko
    powtorzony w innych miejscach.

    ── ZALAMANIE JEST OBOWIAZKOWE, NIE OZDOBNE ─────────────────────────────
    Bez ciemnej rysy na styku obie polacie zlewaja sie w jedna plame slomy
    i budynek traci czytelnosc bryly — dokladnie odwrotny blad niz ten, ktory
    naprawiamy. Rysa idzie PO ZEWNETRZNEJ stronie sylwetki ramienia (w nowo
    wypelnionym obszarze), zeby ANI JEDEN piksel oryginalnego kafla sie nie
    zmienil — dzieki temu kafel doliny i zwykly kafel ramienia lacza sie
    bezszwowo, gdy stoja w sasiednich kolumnach tego samego ramienia.

    ── TLEM JEST KONKRETNY KAFEL KORPUSU, A NIE "JAKAS STRZECHA" ───────────
    Pierwsza wersja wypelniala zewnetrze plaska `strzecha()`. Kafel wygladal
    poprawnie sam z siebie i na mapie robil **przerwe w kalenicy**: komorka,
    ktora zastepuje, to nie dowolna polac, tylko `kalenica` — grzbiet z czapa.
    Wypelniony zwykla sloma urywal kalenice korpusu na dokladnie jeden kafel
    przed skrzydlem, czyli grzbiet dachu konczyl sie w powietrzu. Zadna liczba
    w raporcie tego nie pokazala; widac to dopiero na zblizeniu styku.
    Dlatego `tlo` jest kaflem, ktory ma byc widoczny za ramieniem — a nie
    domyslem o tym, jak ten kafel wyglada.
    """
    px = pusty()
    los = np.random.default_rng(800 + ziarno)
    if tlo is None:
        strzecha(px, 0, T, 0, T, los)
    else:
        px[:] = tlo
    m = bazowy[..., 3] > 0
    ring1 = _rozszerz(m, 1) & ~m
    ring2 = _rozszerz(m, 2) & ~m & ~ring1
    for maska, kolor in ((ring2, P[1]), (ring1, P[0])):
        px[maska, 0], px[maska, 1], px[maska, 2] = kolor
        px[maska, 3] = 255
    px[m] = bazowy[m]
    return px


def kafel_styk_dachowy(lewa, ziarno, ciemniej=0):
    """Naroznik WEWNETRZNY dwoch niezaleznych brył, OBIE `sciana=3` (parter) —
    prawdziwy rzut L/T/U, nie sylwetka nad jednym prostokatem (patrz
    `kafel_dolina` dla tamtego przypadku).

    ⚠ **Obie bryły maja TA SAMA wysokosc calkowita — to jest ustalone, nie do
    zmiany bez pytania.** Skoro obie stoja na wspolnym gruncie i obie maja
    3 kratki parteru, w wierszu, gdzie polac nogi konczy swoj wlasny skos,
    sasiednia bryla WCIAZ MA TAM DACH, nie sciane — jej wlasny dach plaski
    (`_dach_plaski`) siega dokladnie tak samo wysoko. Pierwsza wersja tego
    kafla (wypelniona sciana) zakladala, ze sasiednia bryla jest WYZSZA —
    czego nikt nie ustalil; poprawka bylaby samowolna zmiana wysokosci, wiec
    zamiast tego zmienia sie WYPELNIENIE tego kafla.

    Wypelnienie to wiec zwykla plaska strzecha (jak `kafel_polac`), nie
    sciana. W odroznieniu od `kafel_dolina` nie ma wpieczonego tla jednego
    konkretnego kafla korpusu — `_dach_plaski`'s `polac` nie jest globalnie
    ciagly (kazdy kafel ma wlasne, niezalezne losowanie), wiec dowolny
    wygenerowany tu fragment plaskiej strzechy pasuje wizualnie, bez
    koniecznosci trafienia w JEDEN konkretny kafel sasiada.
    """
    px = pusty()
    los = np.random.default_rng(900 + ziarno)
    ciem = 0 if lewa else 1
    strzecha_skos(px, lewa, ciem)
    kraw = _od_krawedzi(lewa)
    _maska_test(px, lambda x, y: kraw(x, y) >= 0)
    # Zewnetrze: fragment plaskiego dachu sasiedniej bryly — ta sama strzecha,
    # ktora rysuje `kafel_polac`, nie sciana.
    tlo = pusty()
    strzecha(tlo, 0, T, 0, T, los)
    m = px[..., 3] > 0
    px[~m] = tlo[~m]
    px[..., 3] = 255
    _walek_kalenicy(px, lewa, ciem)      # zalamanie na styku — patrz kafel_dolina
    return px


# ── KAFLE: DACH SZCZYTOWY (/\) ──────────────────────────────────────────────
#
# Dach z poprzedniego bloku jest PROSTOKATEM: kalenica u gory, okap u dolu.
# Na dlugiej szopie jest w porzadku, na domu nie — dom w tej perspektywie
# pokazuje SZCZYT. Oba komplety zostaja i oba sa uzywane.
#
# **Dach szczytowy to SZEWRON, a nie wypelniony trojkat.** To jest cala rzecz
# i pierwsze podejscie ja przegapilo: rysowalo pelen trojkat od kalenicy do
# podstawy, czyli ostroslup ogladany od frontu. Prawdziwy dach dwuspadowy ma
# STALA GRUBOSC — kalenica biegnie po jego GORNEJ krawedzi, okap po DOLNEJ,
# obie ida ukosem i sa rownolegle. Miedzy ramionami, pod spodem, widac
# SCIANE SZCZYTOWA z okienkiem poddasza. Wypelniony trojkat te sciane zjada
# i budynek traci pietro, ktore w kazdej referencji jest jego glowna cecha.
#
#          [szczyt_0][szczyt_2]                 kalenica + pionowa belka
#     [skos_0][szcz_dol_0][szcz_dol_2][skos_2]  pas polaci
# [skos][okap_skos_0][okap_skos_2][skos]        okap, ukosem
#            ^^^ pod spodem: sciana szczytowa
#
# Trzy konsekwencje geometrii, kazda wymuszona, nie wybrana:
#
# 1. **Szerokosc budynku musi byc PARZYSTA.** Kalenica siedzi na granicy
#    kafli, wiec przekatne 45° trafiaja dokladnie w rogi kafli. Przy
#    nieparzystej szerokosci wierzcholek wypada w polowie kafla i kazda
#    krawedz dachu robi schodek na granicy wiersza.
# 2. **Dach jest NAKLADKA na sciane, nie warstwa obok niej.** Ramiona
#    zachodza na gorne rogi sciany, a miedzy nimi sciana ma byc widoczna.
#    Dlatego kafle dachu maja przezroczyste tlo i ida na `buildings-over`.
# 3. **Dyle biegna ROWNOLEGLE DO OKAPU, czyli ukosem.** Poziome poszycie na
#    ukosnym pasie czyta sie jak plachta narzucona na dach: krawedz idzie
#    w jedna strone, faktura w druga.

# Grubosc pasa dachu w kaflach, mierzona w PIONIE. Trzy kafle to 96 px polaci:
# w widoku od gory-przodu dach jest glowna masa budynku i ma byc go widac
# jako POWIERZCHNIE, a nie jako obramowanie szczytu. Przy dwoch kaflach dom
# czytal sie jak sciana z daszkiem.
GRUBOSC_DACHU = 3

# ── Z CZEGO JEST TEN DACH ───────────────────────────────────────────────────
#
# **Z TRZCINY.** Material referencyjny sluzyl za wzornik KSZTALTU, nie
# poszycia — jedna z iteracji przemalowala polac na dyle i to bylo
# nieporozumienie. Cala wies jest kryta trzcina, tak samo jak dach kalenicowy
# chaty mysliwego; drewniana jest tylko belka kalenicowa w szczycie.
#
# Kurs trzciny mierzony W POPRZEK, od kalenicy ku okapowi. 16 px, bo 16 dzieli
# 32 — ta sama zasada co "wszystkie okresy dziela 32", przelozona na ukos.
# Okres 12 dawalby ladniejsza grubosc kursu (~8,5 px w mierze prostopadlej),
# ale 32 % 12 != 0 i kursy rozjezdzalyby sie na kazdej granicy kafla.
#
# Gora kursu jest jasniejsza, dol ciemniejszy — tam zachodzi na niego kurs
# nastepny. Dwa ostatnie stopnie sa prawie czarne i to one, a nie samo
# cieniowanie, oddzielaja kurs od kursu: przy jednym ciemnym pikselu polac
# czyta sie jak jednolita mata.
KURS_SKOS = [3, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0]

# Zawiniety brzeg trzciny na krawedzi KALENICOWEJ, od zewnatrz w glab polaci.
# Skrajny piksel jest SREDNI, nie najjasniejszy — ten sam powod co przy
# kalenicy poziomej: dach konczacy sie najjasniejszym stopniem daje twarda,
# swiecaca krawedz.
WALEK_SKOS = [1, 3, 4, 3, 2]

# Pionowa belka kalenicowa w szczycie — 10 px rozlozonych na DWA kafle po obu
# stronach osi, jedyny drewniany element tego dachu. Kalenica biegnie w gleb,
# ku horyzontowi, wiec od frontu widac tylko jej CZOLO: kloda schodzaca od
# wierzcholka do wneki miedzy ramionami.
#
# **Oba konce belki byly zglaszane jako urwane i oba wymagaja innego
# rozwiazania:**
#   • dol — okragla TARCZA przecietego drewna, ta sama co zamek w narozniku
#     sciany i czolo platwi pod okapem. Plaskie ciecie to element, ktory sie
#     zaczyna i nie konczy;
#   • gora — belka ZWEZA SIE ku wierzcholkowi, od 2 px w samym szczycie do
#     pelnych 10 px osiem wierszy nizej. Wersja z plaskim poczatkiem na stalej
#     wysokosci dawala poziome ciecie w poprzek szczytu, a wersja bez zwezenia
#     (belka od y=0 na pelnej szerokosci) wypelniala caly klin i czytala sie
#     jak maszt. Zwezenie robi jedno i drugie na raz: belka wychodzi z samego
#     wierzcholka i nie ma na niej zadnej poziomej krawedzi.
BELKA_KAL = [0, 2, 3, 4, 4, 3, 3, 2, 1, 0]
BELKA_KAL_STOZEK = 8    # przez ile wierszy belka dochodzi do pelnej szerokosci
BELKA_KAL_CZOP = 25     # gdzie siedzi srodek czola belki


def _maska_test(px, wewnatrz):
    """Kasuje kazdy piksel, dla ktorego `wewnatrz(x, y)` jest falszywe."""
    for y in range(T):
        for x in range(T):
            if not wewnatrz(x, y):
                px[y, x] = 0


def _od_krawedzi(lewa):
    """Odleglosc od krawedzi pasa: <= 0 wewnatrz dachu, > 0 poza nim.

    Lewe ramie ma krawedzie postaci x + y = const, prawe x - y = const —
    i to jedyna roznica miedzy nimi. Wszystko dalej liczy sie z tej funkcji,
    wiec prawa polac nie jest osobnym rysunkiem, tylko tym samym z innym
    znakiem.
    """
    if lewa:
        return lambda x, y: (x + y) - (T - 1)
    return lambda x, y: (y - x)


def _wzdluz(lewa):
    """Wspolrzedna WZDLUZ kursu. Okres 32, inaczej faktura urywa sie na
    granicy kafla."""
    if lewa:
        return lambda x, y: (x - y) % T
    return lambda x, y: (x + y) % T


def _fala_kursu(amplituda=1.4):
    """Falowanie granicy kursu — dwie sinusoidy o okresie 32 i 16.

    **Faza jest STALA, nie losowana per kafel.** Kurs trzciny biegnie przez
    cala polac, wiec jego granica musi byc ciagla przez granice kafli. Losowa
    faza dawala zalamanie na kazdym styku; najlepiej bylo to widac wokol
    komina, ktorego kafel ma wlasne tlo — dach mial tam wyrazna prostokatna
    late.

    Musi tez byc GLADKA, a nie losowana per kolumne: wersja losowa rozbijala
    ciemny spod kursu na kropki i polac czytala sie jak cetkowane futro.
    """
    return [int(np.clip(round(amplituda * np.sin(2 * np.pi * u / T)
                              + 0.55 * amplituda * np.sin(4 * np.pi * u / T)), -2, 2))
            for u in range(T)]


FALA_KURSU = _fala_kursu()


def _zdzblo(u, nr_kursu):
    """Czy w tym miejscu z kursu wystaje zdzblo.

    Liczone deterministycznie z polozenia, a nie losowane — i tylko z tych
    dwoch wielkosci, ktore sa ciagle przez granice kafla: `u` (wzdluz kursu,
    okres 32) i PARZYSTOSC numeru kursu (numer skacze o 2 na kafel, wiec
    parzystosc sie zachowuje). Kazdy inny skladnik dawalby fakture, ktora
    urywa sie na styku kafli.
    """
    return ((u * 7 + (11 if nr_kursu % 2 else 0)) % 19) < 4


def strzecha_skos(px, lewa, ciemniej=0):
    """Trzcina w kursach rownoleglych do okapu.

    **Rownolegle do okapu, czyli ukosem.** Poziome kursy na ukosnym pasie
    czytaja sie jak plachta narzucona na dach: krawedz idzie w jedna strone,
    faktura w druga.
    """
    wzdluz, poprzek = _wzdluz(lewa), _od_krawedzi(lewa)
    for y in range(T):
        for x in range(T):
            u = wzdluz(x, y)
            v = int(poprzek(x, y)) + FALA_KURSU[u]
            k = v % 16
            st = KURS_SKOS[k] - ciemniej
            # zdzblo wychodzace z kursu — ciemniejsza kreska w poprzek, nie
            # w co drugim pikselu. Szum per piksel dawal cetki zamiast trzciny.
            if 2 <= k <= 10 and _zdzblo(u, v // 16):
                st -= 1
            kladz(px, y, x, P[max(0, st)])


def _walek_kalenicy(px, lewa, ciemniej=0):
    """Zawiniety brzeg trzciny wzdluz krawedzi kalenicowej — kladziony PO
    masce, wiec nie wychodzi poza obrys."""
    for y in range(T):
        for i, st in enumerate(WALEK_SKOS):
            x = (T - 1 - y + i) if lewa else (y - i)
            if 0 <= x < T and px[y, x, 3]:
                kladz(px, y, x, P[max(0, st - ciemniej)])


def _tarcza(px, cx, cy, r=3):
    """Okragle czolo przecietej klody — jasne pole, oswietlony luk, ciemny rant.

    Sygnatura calego arkusza: zamek w narozniku sciany, czolo platwi pod
    okapem i czolo belki kalenicowej to ten sam ksztalt w trzech rozmiarach.

    Srodek moze byc ulamkowy — belka kalenicowa siedzi DOKLADNIE na granicy
    dwoch kafli i kazdy z nich rysuje swoja polowe czola. Przy calkowitym
    srodku obie polowki wyszlyby przesuniete o piksel i czolo pekaloby wzdluz
    osi.
    """
    for y in range(max(0, int(cy - r)), min(T, int(cy + r) + 2)):
        for x in range(max(0, int(cx - r) - 1), min(T, int(cx + r) + 2)):
            odl = (x - cx) ** 2 + (y - cy) ** 2
            if odl > r * r:
                continue
            if odl >= (r - 0.9) ** 2:
                kladz(px, y, x, D[0])                    # rant
            elif (x - cx) * 0.6 + (y - cy) * 0.8 < -0.4 * r:
                kladz(px, y, x, D[4])                    # swiatlo od gory z lewej
            else:
                kladz(px, y, x, D[3])
    if 0 <= int(cy) < T and 0 <= int(cx) < T and abs(cx - int(cx)) < 0.1:
        kladz(px, int(cy), int(cx), D[2])                # slój w srodku


def _belka_kalenicy(px, lewa, stozek=False, czop=False):
    """Polowa belki kalenicowej, przy wewnetrznej krawedzi kafla.

    `stozek` — belka zweza sie ku wierzcholkowi (kafel szczytowy).
    `czop`   — belka konczy sie okraglym czolem (kafel pod szczytem).
    """
    polowa = BELKA_KAL[:5] if lewa else BELKA_KAL[5:]
    for y in range(BELKA_KAL_CZOP if czop else T):
        # ile pikseli polowy belki jest widoczne w tym wierszu
        ile = 5 if not stozek else max(1, min(5, 1 + (y * 5) // BELKA_KAL_STOZEK))
        for i, st in enumerate(polowa):
            widoczny = (i >= 5 - ile) if lewa else (i < ile)
            x = (T - 5 + i) if lewa else i
            if widoczny and px[y, x, 3]:
                kladz(px, y, x, D[st])
    if czop:
        _tarcza(px, (T - 0.5) if lewa else -0.5, BELKA_KAL_CZOP, r=5)


def _kraw_konca(px, lewa):
    """Zawiniety pionowy brzeg na ZEWNETRZNYM koncu ramienia.

    Ramie urwane na granicy kafla wyglada jak dach przeciety pila. Trzcina na
    koncu polaci jest po prostu zawinieta — grubszy, ciemniejszy walek,
    dokladnie ten sam zabieg co `_kraw_szczytowa` na dachu kalenicowym.
    """
    for i, st in enumerate((1, 2, 2)):
        x = i if lewa else T - 1 - i
        for y in range(T):
            if px[y, x, 3]:
                kladz(px, y, x, P[st])


def kafel_skos(lewa):
    """Kafel z KALENICA: polac zajmuje pas ponizej przekatnej."""
    px = pusty()
    ciem = 0 if lewa else 1
    strzecha_skos(px, lewa, ciem)
    kraw = _od_krawedzi(lewa)
    _maska_test(px, lambda x, y: kraw(x, y) >= 0)
    _walek_kalenicy(px, lewa, ciem)
    return px


def _naroznik_kalenicy(px, lewa, ciemniej=0):
    """Kawalek walka kalenicowego wchodzacy w ROG sasiedniego kafla.

    Patrz `_naroznik_okapu` — ta sama przyczyna, tylko po drugiej stronie pasa
    i tylko 4 px zamiast 11.
    """
    for y in range(T):
        for x in range(T):
            d = (x + y + 1) if lewa else (T + y - x)
            if 1 <= d < len(WALEK_SKOS):
                kladz(px, y, x, P[max(0, WALEK_SKOS[d] - ciemniej)])


def _naroznik_okapu(px, lewa, ciemniej=0):
    """Gruby brzeg okapu wchodzacy w ROG sasiedniego kafla.

    **Kazdy pas biegnacy wzdluz przekatnej wychodzi poza kafel, ktory te
    przekatna niesie.** Przekatna idzie przez kafel od rogu do rogu, wiec pas
    o szerokosci 11 px wokol niej wystaje w dwa kafle stykajace sie z tymi
    rogami — a te kafle sa zwyklymi polaciami i o pasie nic nie wiedza. Efekt:
    gruby brzeg okapu urywal sie na kazdej granicy kafla i wracal po 32 px,
    czyli dokladnie to, co widac bylo na zrzucie jako "kafelki przy
    polaczeniach nie tworza spojnej calosci".

    To jest ta sama pulapka co przy `podokap`, zlapana trzeci raz. Regula:
    **jesli rysujesz cokolwiek wzdluz przekatnej, sprawdz oba kafle stykajace
    sie z jej koncami** — nigdy nie wystarczy sam kafel z przekatna.
    """
    c = lambda i: P[max(0, i - ciemniej)]
    wzdluz = _wzdluz(lewa)
    for y in range(T):
        for x in range(T):
            d = ((x + y) - (2 * T - 1)) if lewa else ((y - x) - T)
            if -11 <= d <= 0:
                u = wzdluz(x, y)
                kladz(px, y, x, c(4) if (u % 3) else c(3))
                if -11 <= d <= -8 and (u % 5) == 0:
                    kladz(px, y, x, c(2))
            if -2 <= d <= 0:
                kladz(px, y, x, c(1))


def kafel_polac_kier(prawa, naroznik=None):
    """Wypelnienie pasa — kafel w calosci pokryty trzcina.

    `naroznik` dokleja kawalek pasa z sasiedniej przekatnej: "kalenica" dla
    kafla stykajacego sie rogiem z kalenica, "okap" dla stykajacego sie z
    okapem. Bez tego oba pasy urywaja sie na granicach kafli.

    Lewa polac jasna, prawa o stopien rampy ciemniejsza: swiatlo pada z gory
    z lewej, tak samo jak w profilu belki. Ten stopien jest jedynym, co dzieli
    szewron na dwie plaszczyzny; bez niego zalamanie w szczycie znika.

    **Jeden kafel na polac, bez wariantow — i to nie jest niedorobka.** Reszta
    arkusza ma po dwa-trzy warianty srodka, bo jeden kafel powtarzany w kolko
    odslania krate co 32 px. Tutaj krata nie ma z czego powstac: rysunek jest
    liczony z polozenia globalnego (stala faza fali, zdzbla deterministyczne),
    wiec kursy biegna nieprzerwanie przez cala polac i granicy kafla po prostu
    nie widac. Dolozenie wariantu WPROWADZILOBY szew, a nie usunelo.
    """
    px = pusty()
    lewa, ciem = not prawa, (1 if prawa else 0)
    strzecha_skos(px, lewa, ciem)
    if naroznik == "kalenica":
        _naroznik_kalenicy(px, lewa, ciem)
    elif naroznik == "okap":
        _naroznik_okapu(px, lewa, ciem)
    return px


def kafel_szczyt(lewa):
    """Kafel przy samej osi: kalenica + zwezajaca sie polowa belki."""
    px = kafel_skos(lewa)
    _belka_kalenicy(px, lewa, stozek=True)
    return px


def kafel_szczyt_dol(lewa, naroznik=None, czop=False):
    """Pas polaci przy osi, z belka kalenicowa.

    `czop` tylko w OSTATNIM wierszu pasa — tam belka sie konczy. Wersja, ktora
    stawiala ten sam kafel we wszystkich wierszach polaci, rysowala okragle
    czolo belki dwa razy: raz w polowie dachu i raz nad wneka. Widac to bylo
    od razu po pogrubieniu pasa z dwoch kafli do trzech.
    """
    px = kafel_polac_kier(not lewa, naroznik)
    _belka_kalenicy(px, lewa, czop=czop)
    return px


def kafel_okap_skos(lewa):
    """Kafel z OKAPEM: polac powyzej przekatnej, pod nia strzepy i cien.

    **Pod strzepami musi byc cien, a nie przezroczystosc** — dokladnie ta sama
    zasada co przy okapie poziomym, tylko ze cien idzie teraz ukosem. Bez niego
    miedzy dachem a sciana szczytowa swieci pas trawy i ramie dachu odkleja sie
    od budynku.

    Czola platwi (okragle konce belek wystajace spod trzciny) sa jedynym
    detalem, po ktorym widac, ze pod poszyciem jest wiezba z okraglakow. Ida
    co 32 w mierze wzdluz kursu, czyli co ~23 px; 32 dzieli 64, o ktore
    przesuwa sie kolejny kafel ramienia, wiec rytm nie gubi kroku na granicy
    kafli. Wersja co 16 i o promieniu 3 czytala sie jak sznur rombowych
    cwiekow, a nie jak konce belek.
    """
    px = pusty()
    ciem = 0 if lewa else 1
    c = lambda i: P[max(0, i - ciem)]
    kraw, wzdluz = _od_krawedzi(lewa), _wzdluz(lewa)

    # 1. cien rzucany przez okap na sciane szczytowa — kryjacy, nie alfa
    for y in range(T):
        for x in range(T):
            if 0 < kraw(x, y) <= 9:
                kladz(px, y, x, K[1] if kraw(x, y) > 2 else K[2])
    # 2. trzcina powyzej krawedzi
    pol = pusty()
    strzecha_skos(pol, lewa, ciem)
    for y in range(T):
        for x in range(T):
            if kraw(x, y) <= 0:
                px[y, x] = pol[y, x]
    # 3. gruby, odsloniety brzeg trzciny tuz nad krawedzia — to po nim widac,
    #    ze dach ma grubosc, a nie jest naklejka
    for y in range(T):
        for x in range(T):
            d = kraw(x, y)
            if -11 <= d <= 0:
                u = wzdluz(x, y)
                kladz(px, y, x, c(4) if (u % 3) else c(3))
                if -11 <= d <= -8 and (u % 5) == 0:
                    kladz(px, y, x, c(2))
            if -2 <= d <= 0:
                kladz(px, y, x, c(1))
    # 4. strzepy zwisajace ponizej krawedzi, na cieniu. Postrzepienie jest
    #    jedynym detalem, po ktorym trzcine widac jako trzcine — rowna krawedz
    #    czyta sie jak blacha.
    for y in range(T):
        for x in range(T):
            d = kraw(x, y)
            if 0 < d <= 5:
                u = wzdluz(x, y)
                dl = 1 + (u * 7 + u * u) % 5
                if d <= dl:
                    kladz(px, y, x, c(2) if d < dl else c(1))
    # 5. czola platwi — rysowane na koncu i wysuniete PONIZEJ krawedzi
    for u0 in ((-15, 17) if lewa else (17, 49)):
        if lewa:                      # krawedz: x + y = T-1, u = x - y
            cx, cy = (u0 + T - 1) // 2 + 1, (T - 1 - u0) // 2 + 1
        else:                         # krawedz: y = x,       u = x + y
            cx, cy = u0 // 2 - 1, u0 // 2 + 1
        _tarcza(px, cx, cy, r=4)
    return px


def kafel_podokap(lewa):
    """Resztka okapu, ktora nie miesci sie w kaflu okapu.

    **To jest kafel, bez ktorego dolna krawedz dachu nie jest ukosem, tylko
    SCHODAMI.** Okap biegnie przez kafel od rogu do rogu, wiec cien i strzepy,
    ktore pod nim wisza, wychodza poza jego DOLNA krawedz — a przy dolnym rogu
    wychodza w calosci. Kafel pod spodem nie nalezy do dachu, wiec ten nadmiar
    byl po prostu obcinany: zmierzone przed poprawka, dolny obrys schodzil
    o 22 px na 31 px szerokosci zamiast o 31, i przy kazdej granicy kafla
    wracal 10 px w gore. Zgloszone jako "kafelki przy polaczeniach nie tworza
    spojnej calosci".

    Zajmowany obszar to trojkacik 9x9 w rogu kafla — reszta jest przezroczysta,
    wiec kafel mozna polozyc na trawie, na sciezce i na scianie szczytowej.
    """
    px = pusty()
    ciem = 0 if lewa else 1
    c = lambda i: P[max(0, i - ciem)]
    # Odleglosc od okapu liczona dla kafla lezacego JEDEN NIZEJ niz kafel
    # okapu; stad "1 +" i "T +" zamiast "- (T-1)".
    kraw = (lambda x, y: 1 + x + y) if lewa else (lambda x, y: T + y - x)
    wzdluz = _wzdluz(lewa)
    for y in range(T):
        for x in range(T):
            d = kraw(x, y)
            if 0 < d <= 9:
                kladz(px, y, x, K[1] if d > 2 else K[2])
            if 0 < d <= 5:
                u = wzdluz(x, y)
                dl = 1 + (u * 7 + u * u) % 5
                if d <= dl:
                    kladz(px, y, x, c(2) if d < dl else c(1))
    return px


def _wzor_pasa(t, u, lewa, lico=GRUBOSC_DACHU):
    """Kolor poszycia w punkcie oddalonym o `t` od kalenicy, liczony GLOBALNIE.

    Jedno zrodlo prawdy dla weryfikacji: kafle maja to odtwarzac, kazdy na
    swoim wycinku. Trzy pasy wzdluz przekatnej po kolei uciekaly poza wlasny
    kafel i za kazdym razem bylo to widac dopiero na zlozonym dachu, wiec
    test [10] porownuje z tym wzorem KAZDY piksel pasa, a nie tylko obrys.

    `lico` to gdzie faktycznie siedzi okap DLA TEJ SZEROKOSCI (patrz
    `_dach_szczytowy` — dla budynkow szerszych niz `2*GRUBOSC_DACHU` rosnie
    ponad `GRUBOSC_DACHU`, bo dach dostaje dodatkowe kafle polaci). Poszycie
    miedzy kalenica a okapem jest tym samym wzorem niezaleznie od tego, ile
    kafli go niesie — to wlasnie ta wlasnosc pozwala dokladac kafle bez
    wprowadzania szwu.
    """
    ciem = 0 if lewa else 1
    c = lambda i: P[max(0, i - ciem)]
    if t < len(WALEK_SKOS):
        return P[max(0, WALEK_SKOS[t] - ciem)]
    d = t - lico * T                           # 0 na okapie, ujemne wyzej
    if -11 <= d <= 0:
        if -2 <= d <= 0:
            return c(1)
        if -11 <= d <= -8 and (u % 5) == 0:
            return c(2)
        return c(4) if (u % 3) else c(3)
    v = t + FALA_KURSU[u]
    st = KURS_SKOS[v % 16] - ciem
    if 2 <= v % 16 <= 10 and _zdzblo(u, v // 16):
        st -= 1
    return P[max(0, st)]


def kafel_kon_polac(lewa, naroznik=None):
    px = kafel_polac_kier(not lewa, naroznik)
    _kraw_konca(px, lewa)
    return px


def kafel_kon_okap(lewa):
    px = kafel_okap_skos(lewa)
    _kraw_konca(px, lewa)
    return px


# ── KAFLE: SCIANA Z DESEK ───────────────────────────────────────────────────
#
# Drugi material scian, i jedyny powod, dla ktorego istnieje, to zeby stodola
# nie byla domem o innych proporcjach. Wies z jednego materialu czyta sie jak
# osiem kopii tej samej chaty — a to jest dokladnie ten sam blad, co jeden
# kafel trawy na calym polu, tylko o pietro wyzej.
#
# Deski ida z rampy `kora`, nie `drewno`: budynek gospodarczy ma byc CIEMNIEJSZY
# od chaty mieszkalnej, a nie tylko inaczej prazkowany. Rama (podwalina,
# oczep, slupy narozne) zostaje w `drewno`, wiec konstrukcja odcina sie od
# poszycia — po tym widac szkielet, a nie plot przybity do niczego.
#
# Deska ma 8 px, tak jak belka i kurs strzechy: 32/8 = 4 deski na kafel, wiec
# faza przechodzi przez granice kafla bez skoku. Zadna deska nie jest przez
# ta granice przecieta i to jest cala tajemnica bezszwowosci tego kompletu.
PROFIL_DESKI = [0, 3, 2, 2, 2, 2, 1, 1]
DESKA = 8


def deski(px, y0, y1, x0, x1, los, ciemniej=0):
    """Pionowe deski. Co ktoras zwietrzala, czyli o stopien ciemniejsza.

    Wietrzenie jest liczone NA DESKE, nie na piksel. Szum per piksel dawal
    tu dokladnie to samo, co przy strzesze sypanej losowo: cetki zamiast
    drewna. Deska starzeje sie w calosci, bo w calosci stoi w deszczu.
    """
    stan = {}
    for x in range(int(x0), int(x1)):
        nr = x // DESKA
        if nr not in stan:
            stan[nr] = 1 if los.random() < 0.28 else 0
        st = PROFIL_DESKI[x % DESKA]
        prostokat(px, y0, y1, x, x + 1, K[max(0, st - ciemniej - stan[nr])])


def _slup_narozny(px, y0, y1, x_zewn, strona):
    """Slup w narozniku szkieletu — pion z `drewno`, swiatlo od lewej."""
    for i, st in enumerate((2, 3, 4, 3, 2, 1)):
        x = x_zewn + (i if strona < 0 else -i)
        prostokat(px, y0, y1, x, x + 1, D[st])


def kafel_deski(strona, ziarno, wariant=0):
    px = pusty()
    los = np.random.default_rng(1500 + ziarno + wariant * 11)
    x0, x1 = _sciana_bok(strona)
    deski(px, 0, T, x0, x1, los)
    if strona < 0:
        _slup_narozny(px, 0, T, x0, -1)
    if strona > 0:
        _slup_narozny(px, 0, T, x1 - 1, 1)
    return px


def kafel_deski_gora(strona, ziarno):
    """Gorny wiersz: cien okapu + oczep, czyli belka spinajaca slupy.

    Cien ma 8 px z tego samego powodu, co przy scianie z bali — zeby faza
    poszycia pod nim zaczynala sie na granicy deski, a nie w jej srodku.
    """
    px = pusty()
    los = np.random.default_rng(1600 + ziarno)
    x0, x1 = _sciana_bok(strona)
    prostokat(px, 0, 6, x0, x1, K[0])
    prostokat(px, 6, 8, x0, x1, K[1])
    belka(px, 8, x0, x1, los, 0, True)                 # oczep
    deski(px, 16, T, x0, x1, los)
    if strona < 0:
        _slup_narozny(px, 16, T, x0, -1)
    if strona > 0:
        _slup_narozny(px, 16, T, x1 - 1, 1)
    return px


def kafel_deski_dol(strona, ziarno):
    """Dolny wiersz: deski, podwalina i kamienie podporowe.

    Budynek gospodarczy nie ma podmurowki na calym obwodzie — lezy na
    podwalinie wspartej na kilku kamieniach. To tansza konstrukcja i tak tez
    ma wygladac; kamienna lawa pod stodola upodobnilaby ja do chaty.
    """
    px = pusty()
    los = np.random.default_rng(1700 + ziarno)
    x0, x1 = _sciana_bok(strona)
    deski(px, 0, 22, x0, x1, los)
    if strona < 0:
        _slup_narozny(px, 0, 22, x0, -1)
    if strona > 0:
        _slup_narozny(px, 0, 22, x1 - 1, 1)
    belka(px, 22, x0, x1, los, 0, True)                # podwalina
    prostokat(px, 30, T, x0, x1, N[0])                 # mrok pod podwalina
    for sx in range(x0 + 2, x1 - 6, 13):               # kamienie podporowe
        prostokat(px, 29, T, sx, sx + 6, S[2])
        prostokat(px, 29, 30, sx, sx + 6, S[3])
        prostokat(px, 29, T, sx + 5, sx + 6, S[1])
    for dy in range(3):
        prostokat(px, 29 + dy, 30 + dy, x0 - 1, x1 + 1, N[0], 110)
    return px


# ── KAFLE: OTWARTY FRONT (wiata, stajnia, obora) ────────────────────────────
#
# Stajnia i obora roznia sie od stodoly jedna rzecza: do srodka WIDAC. Otwarty
# front to nie jest brak sciany, tylko wlasny komplet kafli — mrok w glebi,
# oczep nad glowa i slupy, ktore ten oczep trzymaja. Bez slupow dach wisi
# w powietrzu i budynek natychmiast czyta sie jak dziura wycieta w scianie.

def _wnetrze(px, los, y0, y1, x0, x1):
    """Mrok w glebi + sciolka na klepisku.

    Sam czarny prostokat czyta sie jak dziura w teksturze. Wystarcza dwa
    stopnie mroku (glebiej ciemniej) i kilka zdzbiel sciolki przy dolnej
    krawedzi, zeby to samo miejsce czytalo sie jak wnetrze.
    """
    prostokat(px, y0, y1, x0, x1, N[1])
    prostokat(px, y0, y0 + 6, x0, x1, N[0])
    for _ in range(14):
        sx = int(los.integers(x0, max(x0 + 1, x1 - 3)))
        sy = int(los.integers(y1 - 9, y1))
        prostokat(px, sy, sy + 1, sx, sx + int(los.integers(2, 5)),
                  P[int(los.integers(0, 3))])
    prostokat(px, y1 - 3, y1, x0, x1, Z[1])            # klepisko przy progu


def kafel_wiata(ziarno):
    """Otwarte przeslo miedzy slupami — powtarzalne w poziomie."""
    px = pusty()
    los = np.random.default_rng(1800 + ziarno)
    belka(px, 0, 0, T, los, 0, True)                   # oczep
    _wnetrze(px, los, 8, 29, 0, T)
    prostokat(px, 29, T, 0, T, Z[2])
    for dy in range(3):
        prostokat(px, 29 + dy, 30 + dy, 0, T, N[0], 110)
    return px


def kafel_wiata_slup(ziarno):
    """Slup nosny z zastrzalem. Zastrzal jest tu po to, po co w prawdziwej
    wiacie: bez niego slup i oczep stykaja sie pod goly kat i konstrukcja
    wyglada na postawiona z klockow."""
    px = kafel_wiata(ziarno + 3)
    for i, st in enumerate((1, 2, 3, 4, 4, 3, 2, 1)):
        prostokat(px, 6, 30, 12 + i, 13 + i, D[st])
    for i in range(7):                                  # zastrzal w lewo
        prostokat(px, 8 + i, 11 + i, 5 + i, 12 + i, D[2])
        kladz(px, 8 + i, 11 + i, D[3])
    prostokat(px, 28, 31, 10, 22, S[2])                 # kamien pod slupem
    prostokat(px, 28, 29, 10, 22, S[3])
    for dy in range(2):
        prostokat(px, 30 + dy, 31 + dy, 9, 23, N[0], 110)
    return px


def kafel_zagroda(pozycja):
    """Plot zerdziowy — NAKLADKA, klada sie na trawie.

    Wybieg przy stajni i ogrodzenie zagrody to ta sama rzecz co zagroda dla
    zwierzat w srodku: dwie zerdzie i slupek co 32 px. Slupek w kazdym kaflu
    daje rytm gesty jak plot sztachetowy, a to juz inny budynek.
    """
    px = pusty()
    los = np.random.default_rng(2000 + pozycja + 2)
    sx = 2 if pozycja < 0 else (25 if pozycja > 0 else 14)
    x0 = sx if pozycja < 0 else 0
    x1 = sx + 5 if pozycja > 0 else T
    for y0 in (11, 20):                                 # dwie zerdzie
        for i, st in enumerate((3, 4, 2, 1)):
            prostokat(px, y0 + i, y0 + i + 1, x0, x1, D[st])
        dl = int(los.integers(4, 9))
        px_x = int(los.integers(x0 + 1, max(x0 + 2, x1 - dl)))
        prostokat(px, y0 + 1, y0 + 2, px_x, px_x + dl, D[2])
    for i, st in enumerate((2, 3, 4, 3, 1)):            # slupek
        prostokat(px, 5, 30, sx + i, sx + i + 1, K[st])
    prostokat(px, 5, 7, sx, sx + 5, K[4])
    for dy in range(2):
        prostokat(px, 29 + dy, 30 + dy, sx - 1, sx + 6, N[0], 110)
    return px


# ── KAFLE: NAKLADKI ─────────────────────────────────────────────────────────
#
# Przezroczyste tlo — kladzie sie je NA scianie, na osobnej warstwie mapy.
# To jest cala roznica miedzy tilesetem a kompletem gotowych domow: drzwi
# w trzech miejscach sciany to trzy kafle, a nie trzy komplety scian.

def _skrzydlo(px, y0, y1, x0, x1, los):
    prostokat(px, y0, y1, x0, x1, K[3])
    for x in range(x0, x1, 4):
        prostokat(px, y0, y1, x, x + 1, K[2])
        prostokat(px, y0, y1, min(x + 3, x1 - 1), min(x + 4, x1), K[1])
    for _ in range(3):
        sy = int(los.integers(y0 + 1, y1 - 1))
        prostokat(px, sy, sy + 1, x0 + 1, x1 - 1, K[2])


def kafle_drzwi():
    """1 kolumna x 2 wiersze. Prog w dolnej krawedzi dolnego kafla."""
    los = np.random.default_rng(700)
    gora, dol = pusty(), pusty()
    x0, x1 = 6, 26
    # oscieznica z grubej belki
    for px, y0, y1 in ((gora, 10, T), (dol, 0, 30)):
        prostokat(px, y0, y1, x0 - 3, x0, D[2])
        prostokat(px, y0, y1, x0 - 1, x0, D[1])
        prostokat(px, y0, y1, x1, x1 + 3, D[2])
        prostokat(px, y0, y1, x1, x1 + 1, D[1])
    prostokat(gora, 10, 13, x0 - 3, x1 + 3, D[3])          # nadproze
    prostokat(gora, 13, 14, x0 - 3, x1 + 3, D[1])
    prostokat(gora, 14, T, x0, x1, N[1])                   # mrok za drzwiami
    prostokat(dol, 0, 30, x0, x1, N[1])
    _skrzydlo(gora, 15, T, x0 + 1, x1 - 1, los)
    _skrzydlo(dol, 0, 29, x0 + 1, x1 - 1, los)
    # okucia i klamka
    for px, y in ((gora, 18), (dol, 8), (dol, 24)):
        prostokat(px, y, y + 2, x0 + 1, x1 - 1, K[4])
        prostokat(px, y + 2, y + 3, x0 + 1, x1 - 1, K[1])
    prostokat(dol, 14, 17, x1 - 5, x1 - 3, N[4])
    prostokat(dol, 29, 30, x0 - 3, x1 + 3, S[1])           # kamienny prog
    for dy in range(2):
        prostokat(dol, 30 + dy, 31 + dy, x0 - 4, x1 + 4, N[0], 110)
    return gora, dol


def kafel_okno(okiennice=True):
    px = pusty()
    x0, x1, y0, y1 = 9, 23, 9, 24
    prostokat(px, y0 - 2, y1 + 2, x0 - 2, x1 + 2, D[2])    # rama
    prostokat(px, y0 - 2, y0, x0 - 2, x1 + 2, D[3])
    prostokat(px, y1, y1 + 2, x0 - 2, x1 + 2, D[1])
    prostokat(px, y0, y1, x0, x1, N[1])                    # szyba
    prostokat(px, y0 + 7, y1 - 1, x0 + 1, x1 - 1, A[3])    # cieple swiatlo
    prostokat(px, y0 + 9, y1 - 1, x0 + 2, x1 - 2, A[4])
    prostokat(px, y0, y1, (x0 + x1) // 2, (x0 + x1) // 2 + 1, D[2])   # szczeblina
    prostokat(px, y0 + 6, y0 + 7, x0, x1, D[2])
    if okiennice:
        for x in (x0 - 7, x1 + 2):
            prostokat(px, y0 - 2, y1 + 2, x, x + 5, K[3])
            prostokat(px, y0 - 2, y1 + 2, x, x + 1, K[4])
            prostokat(px, y0 - 2, y1 + 2, x + 4, x + 5, K[1])
            prostokat(px, y0 + 5, y0 + 7, x, x + 5, K[1])
    return px


def kafle_komin(tlo=None, ziarno=0, kolnierz=None, tlo_gora=None):
    """1 kolumna x 2 wiersze. Dolny kafel to DACH Z KOMINEM.

    Komin stoi w dachu, wiec jego kafle musza zawierac dach — inaczej
    ZASTEPUJA kafel dachu i robia w nim dziure. Warstwa jest jedna
    (`buildings-over`), wiec kafel nakladkowy nie ma czego przykryc: to samo
    miejsce nie moze naraz nalezec do dachu i do komina.

    Zdarzylo sie to DWA RAZY, za kazdym razem widoczne dopiero na zlozonym
    budynku: najpierw dolny kafel wycinal przerwe w kalenicy, potem gorny
    wycinal zielona dziure w polaci dachu szczytowego. Stad oba tla sa
    parametrami, a nie wpieczone na stale:
      • `tlo`      — pod dolnym kaflem (kalenica albo polac),
      • `tlo_gora` — pod gornym. Puste tylko wtedy, gdy komin wystaje PONAD
        dach i nad nim naprawde nic nie ma; tak jest przy dachu kalenicowym,
        gdzie gorny kafel siedzi nad kalenica.
    """
    gora = pusty() if tlo_gora is None else tlo_gora
    dol = (kafel_kalenica(0, 1) if tlo is None else tlo)
    los = np.random.default_rng(800 + ziarno)
    x0, x1 = 11, 21
    for px, y0, y1 in ((gora, 8, T), (dol, 0, 20)):
        prostokat(px, y0, y1, x0, x1, S[2])
        y, rzad = y0, 0
        while y < y1:
            h = min(5, y1 - y)
            x = x0 + (0 if rzad % 2 == 0 else 3)
            while x < x1:
                w = int(los.integers(4, 8))
                prostokat(px, y, y + 1, x, min(x + w, x1), S[3])
                prostokat(px, y + h - 1, y + h, x, min(x + w, x1), S[1])
                prostokat(px, y, y + h, min(x + w - 1, x1 - 1), min(x + w, x1), S[1])
                x += w
            y += h
            rzad += 1
        prostokat(px, y0, y1, x1 - 2, x1, S[1])            # sciana w cieniu
    prostokat(gora, 8, 11, x0 - 2, x1 + 2, S[3])           # czapa
    prostokat(gora, 11, 12, x0 - 2, x1 + 2, S[1])
    prostokat(gora, 12, 15, x0 + 2, x1 - 2, N[0])          # wylot
    # Kolnierz tam, gdzie komin przebija dach — z tego samego materialu, co
    # dach pod nim. Slomiany kolnierz na dachu z dyli czytal sie jak kupka
    # siana zostawiona przy kominie.
    R = kolnierz if kolnierz is not None else P
    for x in range(x0 - 3, x1 + 4):
        if 0 <= x < T:
            prostokat(dol, 18, 22, x, x + 1, R[2 if (x % 2) else 1])
    prostokat(dol, 17, 18, x0 - 3, x1 + 4, R[3])
    return gora, dol


def kafle_wrota():
    """2 kolumny x 2 wiersze — wrota stodoly, dwuskrzydlowe."""
    los = np.random.default_rng(900)
    out = {}
    for kol in (0, 1):
        for wiersz in (0, 1):
            px = pusty()
            y0 = 6 if wiersz == 0 else 0
            y1 = T if wiersz == 0 else 30
            xa = 2 if kol == 0 else 0
            xb = T if kol == 0 else T - 2
            prostokat(px, y0, y1, xa, xb, N[1])
            _skrzydlo(px, y0 + (4 if wiersz == 0 else 0), y1, xa + 1, xb - 1, los)
            if wiersz == 0:
                prostokat(px, y0, y0 + 4, xa - 1 if kol else xa - 1, xb + 1, D[3])
                prostokat(px, y0 + 4, y0 + 5, xa, xb, D[1])
            for y in (10, 22):
                yy = y + (0 if wiersz else 0)
                if y0 <= yy < y1 - 2:
                    prostokat(px, yy, yy + 2, xa + 1, xb - 1, K[4])
            if wiersz == 1:
                prostokat(px, 29, 30, xa - 1, xb + 1, S[1])
                for dy in range(2):
                    prostokat(px, 30 + dy, 31 + dy, xa - 2, xb + 2, N[0], 110)
            # pion zamkniecia w osi wrot
            if kol == 0:
                prostokat(px, y0, y1, xb - 1, xb, K[1])
            out[(kol, wiersz)] = px
    return out


def kafel_okno_szczyt():
    """Okienko poddasza — malo, wysoko, tuz pod zwisem kalenicy.

    W kazdej referencji stoi dokladnie w tym miejscu i nie jest ozdoba: to ono
    mowi, ze pod dachem jest jeszcze jedna kondygnacja, a nie pusty trojkat.
    Bez niego scianka szczytowa czyta sie jak deska zaslepiajaca strych.
    """
    px = pusty()
    x0, x1, y0, y1 = 11, 21, 10, 21
    prostokat(px, y0 - 2, y1 + 2, x0 - 2, x1 + 2, D[2])    # rama
    prostokat(px, y0 - 2, y0, x0 - 2, x1 + 2, D[3])
    prostokat(px, y1, y1 + 2, x0 - 2, x1 + 2, D[1])
    prostokat(px, y0, y1, x0, x1, N[1])                    # mrok strychu
    prostokat(px, y0 + 6, y1, x0 + 1, x1 - 1, A[2])        # slabe swiatlo
    prostokat(px, y0, y1, (x0 + x1) // 2, (x0 + x1) // 2 + 1, D[2])
    prostokat(px, y1 + 1, y1 + 3, x0 - 3, x1 + 3, D[1])    # okapnik
    return px


def kafel_otwor_siana():
    """Otwor na siano w szczycie stodoly + belka z blokiem.

    Siano musi WYCHODZIC poza obrys otworu. Sam ciemny prostokat w scianie to
    drzwi, ktore ktos zapomnial zamknac; dopiero zdzbla przewieszone przez prog
    i wystajaca belka mowia, ze tedy wciaga sie plony na gore.
    """
    px = pusty()
    los = np.random.default_rng(2100)
    x0, x1, y0, y1 = 7, 25, 8, 27
    prostokat(px, y0 - 3, y1 + 2, x0 - 2, x1 + 2, D[2])    # oscieznica
    prostokat(px, y0 - 3, y0, x0 - 2, x1 + 2, D[3])
    prostokat(px, y0, y1, x0, x1, N[1])
    prostokat(px, y0, y0 + 7, x0, x1, N[0])
    for _ in range(22):                                     # siano w otworze
        sx = int(los.integers(x0, x1 - 3))
        sy = int(los.integers(y1 - 11, y1))
        prostokat(px, sy, sy + 1, sx, sx + int(los.integers(2, 6)),
                  P[int(los.integers(0, 3))])
    for x in range(x0, x1):                                 # przewieszone przez prog
        dl = int(los.integers(0, 6))
        for i in range(dl):
            kladz(px, y1 + i, x, P[2] if i < dl - 1 else P[1])
    prostokat(px, y1, y1 + 2, x0 - 2, x1 + 2, D[1])         # prog
    prostokat(px, 2, 5, 13, 19, D[3])                       # belka z blokiem
    prostokat(px, 2, 8, 15, 17, D[2])
    prostokat(px, 7, 10, 14, 18, K[4])
    return px


def kafel_klapa():
    """Kurza klapa z trapem. Kurnik rozpoznaje sie po tym jednym detalu.

    Trap ma poprzeczki, bo bez nich jest deska oparta o sciane. Ida w dol
    i w prawo, wiec kafel jest asymetryczny — kurnik ustawia sie klapa do
    podworza, a nie kladzie symetrycznie jak okno.
    """
    px = pusty()
    x0, x1, y0, y1 = 9, 21, 13, 26
    prostokat(px, y0 - 2, y1 + 1, x0 - 2, x1 + 2, D[2])
    prostokat(px, y0 - 2, y0, x0 - 2, x1 + 2, D[3])
    prostokat(px, y0, y1, x0, x1, N[0])
    prostokat(px, y0, y0 + 3, x0, x1, N[1])                # podniesiona klapka
    prostokat(px, y0 - 4, y0 - 1, x0 - 1, x1 + 1, K[3])
    prostokat(px, y0 - 4, y0 - 3, x0 - 1, x1 + 1, K[4])
    for i in range(6):                                      # trap w dol i w prawo
        prostokat(px, y1 + i, y1 + i + 1, x0 + i, x1 + i + 2, D[2])
        if i % 2 == 0:
            prostokat(px, y1 + i, y1 + i + 1, x0 + i, x1 + i + 2, D[3])
    return px


def kafle_drzwi_pol():
    """Drzwi polowkowe (obora) — 1 kolumna x 2 wiersze, gorna polowa OTWARTA.

    To jest roznica miedzy obora a stodola widziana z drogi: przez otwarta
    gore widac zwierzeta, dol zostaje zamkniety, zeby nie wyszly. Wrota
    stodoly sa albo zamkniete, albo rozwarte na oscierz — polowicznie nie.
    """
    los = np.random.default_rng(2200)
    gora, dol = pusty(), pusty()
    x0, x1 = 6, 26
    for px, y0, y1 in ((gora, 8, T), (dol, 0, 30)):
        prostokat(px, y0, y1, x0 - 3, x0, D[2])
        prostokat(px, y0, y1, x0 - 1, x0, D[1])
        prostokat(px, y0, y1, x1, x1 + 3, D[2])
        prostokat(px, y0, y1, x1, x1 + 1, D[1])
    prostokat(gora, 8, 11, x0 - 3, x1 + 3, D[3])           # nadproze
    prostokat(gora, 11, 12, x0 - 3, x1 + 3, D[1])
    _wnetrze(gora, los, 12, T, x0, x1)                     # otwarta gorna polowa
    prostokat(gora, T - 3, T, x0, x1, N[1])
    prostokat(dol, 0, 4, x0, x1, N[1])                     # cien nad skrzydlem
    _skrzydlo(dol, 4, 29, x0 + 1, x1 - 1, los)
    prostokat(dol, 4, 6, x0 + 1, x1 - 1, D[3])             # nakladka gornej krawedzi
    for y in (10, 24):
        prostokat(dol, y, y + 2, x0 + 1, x1 - 1, K[4])
        prostokat(dol, y + 2, y + 3, x0 + 1, x1 - 1, K[1])
    prostokat(dol, 14, 17, x1 - 5, x1 - 3, N[4])           # zasuwa
    prostokat(dol, 29, 30, x0 - 3, x1 + 3, S[1])
    for dy in range(2):
        prostokat(dol, 30 + dy, 31 + dy, x0 - 4, x1 + 4, N[0], 110)
    return gora, dol


# ── KAFLE: REKWIZYTY GOSPODARSKIE ───────────────────────────────────────────
#
# Stodola bez siana obok to szopa, a stajnia bez koryta to szopa z dziura
# w scianie. Dwa rekwizyty, obydwa nakladkowe (leza na trawie), obydwa
# potrzebne, zeby budynek mial ZAWOD.

def kafle_stog():
    """Stog siana 2x2 — rysowany jako 64x64 i ciety na kafle.

    Rysowany w calosci, bo sylwetka jest tu wszystkim: cztery kafle skladane
    osobno daja stog z zalamana linia boku. Ten sam powod, dla ktorego drzewa
    tez powstaja jako jeden obraz i dopiero potem sa ciete.
    """
    los = np.random.default_rng(2300)
    buf = np.zeros((2 * T, 2 * T, 4), np.uint8)
    cx, dol, gora = 32, 60, 10
    for y in range(gora, dol):
        t = (y - gora) / float(dol - gora)
        # Kopa, nie stozek: wykladnik 0,38 daje zaokraglony wierzch i szeroki
        # brzuch. Przy 0,62 sylwetka schodzila sie w czubek i z tyczka u gory
        # stog czytal sie jak choinka.
        pol = 6.0 + 24.0 * (t ** 0.38)
        pol += 1.2 * np.sin(y * 0.7)                        # nierowna sloma, nie kregiel
        for x in range(int(cx - pol), int(cx + pol) + 1):
            if not (0 <= x < 2 * T):
                continue
            kurs = ((y - gora) % KURS)
            st = PROFIL_KURSU[kurs]
            bok = (x - cx) / max(1.0, pol)
            if bok > 0.45:
                st -= 1                                     # prawa strona w cieniu
            if bok < -0.55:
                st -= 1                                     # i sam brzeg od swiatla
            if abs(x - (cx - pol)) < 2 or abs(x - (cx + pol)) < 2:
                st -= 1
            buf[y, x, :3] = P[int(np.clip(st, 0, 4))]
            buf[y, x, 3] = 255
        if los.random() < 0.5:                              # wystajace zdzbla
            for kier in (-1, 1):
                x = int(cx + kier * pol)
                for i in range(int(los.integers(1, 4))):
                    if 0 <= x + kier * i < 2 * T:
                        buf[y, x + kier * i, :3] = P[1]
                        buf[y, x + kier * i, 3] = 255
    for i, st in enumerate((2, 3, 2, 1)):                   # tyczka w srodku stogu
        for y in range(4, 13):
            buf[y, cx - 2 + i, :3] = D[st]
            buf[y, cx - 2 + i, 3] = 255
    for dy in range(3):                                     # cien kontaktowy
        for x in range(cx - 26 + dy * 3, cx + 26 - dy * 3):
            if 0 <= x < 2 * T:
                buf[dol + dy, x, :3] = N[0]
                buf[dol + dy, x, 3] = 110
    return {(kol, wiersz): buf[wiersz * T:(wiersz + 1) * T, kol * T:(kol + 1) * T].copy()
            for kol in (0, 1) for wiersz in (0, 1)}


def kafel_koryto():
    """Koryto — wydrazona kloda na dwoch kozlach, z woda."""
    px = pusty()
    x0, x1, y0, y1 = 2, 30, 12, 25
    prostokat(px, y0 + 2, y1, x0, x1, D[2])                # cialo klody
    prostokat(px, y1 - 3, y1, x0, x1, D[1])
    prostokat(px, y0, y0 + 3, x0, x1, D[3])                # oswietlony rant
    prostokat(px, y0 + 3, y1 - 4, x0 + 3, x1 - 3, D[0])    # wydrazenie
    prostokat(px, y0 + 4, y1 - 5, x0 + 4, x1 - 4, W[0])    # woda
    prostokat(px, y0 + 4, y0 + 5, x0 + 5, x1 - 8, W[2])    # odblask
    for x in (x0 + 3, x1 - 7):                             # kozly
        prostokat(px, y1, 30, x, x + 4, K[3])
        prostokat(px, y1, 30, x + 3, x + 4, K[1])
    for dy in range(2):
        prostokat(px, 29 + dy, 30 + dy, x0 + 1, x1 - 1, N[0], 110)
    return px


# ── UKLAD ARKUSZA ───────────────────────────────────────────────────────────
#
# Nazwa -> (kolumna, wiersz). Kolejnosc czytelna dla czlowieka: sciany, dach,
# nakladki. Kolumn jest 19 i to sie nie zmienia (id = wiersz*19 + kolumna).

def zbuduj_kafle():
    kafle = {}

    # sciany 3x3 (kolumny 0-2)
    for i, strona in enumerate((-1, 0, 1)):
        kafle[("sciana_gora", i)] = (i, 0, kafel_sciana_gora(strona, i))
        kafle[("sciana", i)] = (i, 1, kafel_sciana(strona, i))
        kafle[("fundament", i)] = (i, 2, kafel_fundament(strona, i))
    # drugi wariant sciany srodkowej — jeden kafel powtorzony scianka po scianie
    # odslania krate tak samo jak przy trawie
    # TRZY warianty srodka i po drugim wariancie brzegow. Jeden kafel
    # powtarzany scianka po sciance odslania krate tak samo jak jeden kafel
    # trawy na polu — zgloszone na zrzucie ("u nas sie powtarza"): przy
    # czterech belkach na kafel oko rozpoznaje ten sam uklad czopow i slojow
    # co 32 px. Wariantow nie zastapi mocniejszy szum, bo szum zamienia krate
    # na brud, a nie na drewno.
    kafle[("sciana2", 1)] = (12, 1, kafel_sciana(0, 1, wariant=1))
    kafle[("sciana3", 1)] = (14, 1, kafel_sciana(0, 2, wariant=2))
    kafle[("sciana", 3)] = (15, 1, kafel_sciana(-1, 3, wariant=1))
    kafle[("sciana", 4)] = (16, 1, kafel_sciana(1, 4, wariant=1))

    # dach 3x3 (kolumny 3-5)
    for i, strona in enumerate((-1, 0, 1)):
        kafle[("kalenica", i)] = (3 + i, 0, kafel_kalenica(strona, i))
        kafle[("polac", i)] = (3 + i, 1, kafel_polac(strona, i))
        kafle[("okap", i)] = (3 + i, 2, kafel_okap(strona, i))
    kafle[("polac2", 1)] = (13, 1, kafel_polac(0, 1, wariant=1))

    # nakladki (kolumny 6-11)
    dg, dd = kafle_drzwi()
    kafle[("drzwi", 0)] = (6, 0, dg)
    kafle[("drzwi", 1)] = (6, 1, dd)
    kafle[("okno", 0)] = (7, 0, kafel_okno(True))
    kafle[("okno_bez", 0)] = (8, 0, kafel_okno(False))
    kg, kd = kafle_komin()
    kafle[("komin", 0)] = (9, 0, kg)
    kafle[("komin", 1)] = (9, 1, kd)
    for (kol, wiersz), px in kafle_wrota().items():
        kafle[("wrota", kol * 2 + wiersz)] = (10 + kol, wiersz, px)

    # ── wiersz 3: dach szczytowy /\ ─────────────────────────────────────────
    #
    # Nowe kafle ida w NOWE WIERSZE, a nie w dziury po starych. Id kafla to
    # `wiersz * 19 + kolumna`, wiec dopisanie wiersza nie rusza zadnego
    # dotychczasowego numeru — mapa `forrest.tmj` odwoluje sie do nich wprost
    # i przenumerowanie oznaczaloby, ze chata mysliwego zmienia sie w losowa
    # mozaike. Przy stalych 19 kolumnach arkusz mozna zawsze dolozyc od dolu.
    # Wiersz 3 i 6 razem: jeden kafel na kazde miejsce w pasie. Pas ma
    # GRUBOSC_DACHU wierszy, a kafle w nim NIE sa wymienne — kazdy wiersz
    # styka sie z inna przekatna (kalenica u gory, okap u dolu) i musi niesc
    # jej kawalek. Stad "_kal" i "_okp" przy polaciach.
    for bok, lewa in ((0, True), (2, False)):
        kafle[("szczyt", bok)] = (0 + bok // 2, 3, kafel_szczyt(lewa))
        kafle[("szczyt_kal", bok)] = (2 + bok // 2, 3,
                                      kafel_szczyt_dol(lewa, "kalenica"))
        kafle[("szczyt_dol", bok)] = (4 + bok // 2, 3,
                                      kafel_szczyt_dol(lewa, "okap", czop=True))
        kafle[("skos", bok)] = (6 + bok // 2, 3, kafel_skos(lewa))
        kafle[("polac_kal", bok)] = (8 + bok // 2, 3,
                                     kafel_polac_kier(not lewa, "kalenica"))
        kafle[("polac_okp", bok)] = (10 + bok // 2, 3,
                                     kafel_polac_kier(not lewa, "okap"))
        kafle[("okap_skos", bok)] = (12 + bok // 2, 3, kafel_okap_skos(lewa))
        kafle[("podokap", bok)] = (14 + bok // 2, 3, kafel_podokap(lewa))
        kafle[("kon_polac_kal", bok)] = (0 + bok // 2, 6,
                                         kafel_kon_polac(lewa, "kalenica"))
        kafle[("kon_polac_okp", bok)] = (2 + bok // 2, 6,
                                         kafel_kon_polac(lewa, "okap"))
        kafle[("kon_okap", bok)] = (4 + bok // 2, 6, kafel_kon_okap(lewa))
        # Gladki wypelniacz kolumny brzegowej — bez naroznika kalenicy ani
        # okapu, tylko zawinieta krawedz. Potrzebny, gdy dach musi urosnac
        # o dodatkowe, w pelni kryjace wiersze (patrz `dodatkowe`
        # w `_dach_szczytowy`): kolumna brzegowa dostaje wtedy TEN kafel
        # zamiast gladkiej `polac_l`/`polac_p`, zeby jej bok zostal owiniety
        # jak reszta jej wlasnego pasa, a nie urywal sie twardym ciAciem.
        kafle[("kon_polac", bok)] = (7 + bok // 2, 6, kafel_kon_polac(lewa))
        # Belka kalenicowa CIAGNACA SIE DALEJ, bez czola i bez naklada — dla
        # dodatkowych wierszy polaci na kolumnie przy samej kalenicy. Bez
        # tego kafla belka miala PRZERWE: znikala na kazdym dodatkowym
        # wierszu polaci i pojawiala sie znowu dopiero na kaflu z czolem,
        # jakby srodek pretu byl niewidzialny.
        kafle[("szczyt_fill", bok)] = (9 + bok // 2, 6, kafel_szczyt_dol(lewa))
    # Gladka polac bez narozników — dzis nieuzywana w planie (pas ma dokladnie
    # trzy wiersze, wiec kazdy styka sie z przekatna), ale to ona jest wzorcem
    # dla testu bezszwowosci i to na niej stoi komin.
    kafle[("polac_l", 1)] = (16, 3, kafel_polac_kier(False))
    kafle[("polac_p", 1)] = (17, 3, kafel_polac_kier(True))
    # Komin na polaci — to samo murowanie, inne tlo niz komin w kalenicy
    # poziomej (komin_1). Tlo MUSI byc dokladnie tym kaflem, ktory komin
    # zastepuje (patrz `kafle_komin`), czyli polacia z odpowiednim naroznikiem.
    _kg, _kd = kafle_komin(kafel_polac_kier(False, "okap"), 1,
                           tlo_gora=kafel_polac_kier(False, "kalenica"))
    kafle[("komin", 2)] = (18, 3, _kd)
    kafle[("komin", 3)] = (6, 6, _kg)

    # ── wiersz 4: sciana z desek, otwarty front, plot ───────────────────────
    for i, strona in enumerate((-1, 0, 1)):
        kafle[("deski_gora", i)] = (i, 4, kafel_deski_gora(strona, i))
        kafle[("deski", i)] = (3 + i, 4, kafel_deski(strona, i))
        kafle[("deski_dol", i)] = (6 + i, 4, kafel_deski_dol(strona, i))
    kafle[("deski2", 1)] = (9, 4, kafel_deski(0, 4, wariant=1))
    kafle[("wiata", 1)] = (10, 4, kafel_wiata(0))
    kafle[("wiata_slup", 1)] = (11, 4, kafel_wiata_slup(0))
    for i, poz in enumerate((-1, 0, 1)):
        kafle[("zagroda", i)] = (12 + i, 4, kafel_zagroda(poz))

    # ── wiersz 5: nakladki gospodarcze i rekwizyty ──────────────────────────
    kafle[("okno_szczyt", 0)] = (0, 5, kafel_okno_szczyt())
    kafle[("otwor_siana", 0)] = (1, 5, kafel_otwor_siana())
    kafle[("klapa", 0)] = (2, 5, kafel_klapa())
    pg, pd = kafle_drzwi_pol()
    kafle[("drzwi_pol", 0)] = (3, 5, pg)
    kafle[("drzwi_pol", 1)] = (4, 5, pd)
    for (kol, wiersz), px in kafle_stog().items():
        kafle[("stog", kol * 2 + wiersz)] = (5 + kol * 2 + wiersz, 5, px)
    kafle[("koryto", 0)] = (9, 5, kafel_koryto())

    # ── wiersz 7, kolumny 4-6: przybudowka (dach jednospadowy) — B17 ────────
    #
    # Tylko TRZY kafle: `polac`/`polac2`/`okap` przybudowka reuzywa z dachu
    # kalenicowego bez zadnej zmiany — patrz `kafel_przybud_styk`.
    #
    # ⚠ **NIE w kolumnach 0-2 i NIE w nowym wierszu 8** — obie oczywiste
    # lokalizacje sa pulapkami i obie zostaly sprawdzone, nie zgadniete:
    #
    # 1. **Wiersz 7 NIE jest pusty**, mimo ze `zbuduj_kafle` konczy sie na
    #    wierszu 6. Siedza w nim `lawka_l` (id 133), `lawka_p` (134) i
    #    `barrel_0` (136), doklejone przez `build_lawka.py`/`build_barrel.py`
    #    prosto do PNG-a, z pominieciem tej funkcji. Komplet postawiony na
    #    kolumnach 0-2 przejalby id 133/134 — **uzyte na mapie wsi po 3 razy**
    #    — i kazda lawka w Zagajach zamienilaby sie w kawalek strzechy.
    #    Test [7] tego NIE zlapie: sprawdza kolizje tylko wewnatrz `kafle`,
    #    a o kaflach spoza tej funkcji nic nie wie.
    # 2. **Arkusz nie moze urosnac o wiersz.** `Buildings` ma dokladnie 152
    #    kafle (19x8), a nastepny tileset w obu mapach startuje od
    #    `firstgid` = 362 + 152 = **514** (Kuznia) i 571 (Pole). Dziewiaty
    #    wiersz przesunalby te dwa zestawy o 19 i przemalowal cale
    #    wyposazenie kuzni oraz wszystkie pola na przypadkowe kafle.
    #
    # Zostaja wolne komorki w istniejacych wierszach. Kolumny 4-6 wiersza 7 sa
    # wolne (wiersz 7 zajmuje 0, 1 i 3), sasiaduja ze soba i zostawiaja
    # kolumne 2 jako naturalne miejsce dla nastepnego pojedynczego rekwizytu
    # doklejanego skryptem w stylu `build_barrel.py`.
    for i, strona in enumerate((-1, 0, 1)):
        kafle[("przybud_styk", i)] = (4 + i, 7, kafel_przybud_styk(strona, i))

    # ── wiersz 7, kolumny 7-8: KOSZ (dolina) dla rzutow L / T / U ───────────
    #
    # ⚠ **DWA KAFLE, NIE DZIESIEC — I TO JEST WYNIK POMIARU, NIE OSZCZEDNOSC.**
    # Przezroczyste zewnetrze ma piec rodzin kafli ramienia (zmierzone piksele
    # alfa=0: `szczyt`/`skos` po 496, `okap_skos`/`kon_okap` po 253, `podokap`
    # az 979); wszystkie `_kal`, `_dol`, `_okp`, `polac`, `kon_polac`,
    # `szczyt_fill` sa w pelni kryjace. Kuszace jest zrobic wariant `dolina_`
    # dla kazdej z tych pieciu — i jest to blad, bo podmiana ma sens WYLACZNIE
    # tam, gdzie za kaflem stoi inny kafel DACHU:
    #
    #  * pod okapem i podokapem ramienia stoi **sciana szczytowa skrzydla**,
    #    ktora jest na warstwie `buildings`, a dach na `buildings-over` —
    #    przezroczystosc pokazuje tam sciane i ma ja pokazywac. Wariant
    #    `dolina_` zamalowalby szczyt chalupy slomą.
    #  * przy `PODNIESIENIE = 2` wierzcholek skrzydla stoi NAD kalenica
    #    korpusu, wiec `szczyt` (kolumna przy osi) nigdy nie laduje na cudzym
    #    dachu — laduje na niebie, gdzie przezroczystosc tez jest poprawna.
    #
    # Zostaje `skos` kolumny brzegowej: jedyny kafel, ktory naprawde wcina sie
    # w polac korpusu. Policzone na wszystkich trzech rzutach z WZORY_ZLOZONE:
    # uzyc dokladnie 4 (po 2 na chalupe L i T), pozostalych osmiu — zero.
    # Arkusz nie moze urosnac o wiersz (firstgid Kuzni i Pola), wiec osiem
    # kafli "na wszelki wypadek" to osiem komorek zabranych czemus realnemu.
    #
    # Tlem jest `kalenica`/1, bo `skos` kolumny brzegowej skrzydla laduje
    # ZAWSZE na wierszu kalenicy korpusu — to wynika z `PODNIESIENIE`, nie
    # z ukladu konkretnego wzoru, i `zloz_zlozony` to sprawdza zamiast zakladac.
    for b, bok in enumerate((0, 2)):
        kafle[("dolina_skos", bok)] = (
            7 + b, 7, kafel_dolina(kafle[("skos", bok)][2], b,
                                   tlo=kafle[("kalenica", 1)][2]))

    return kafle


def id_kafla(kol, wiersz):
    return wiersz * COLS + kol


# ── WERYFIKACJA ─────────────────────────────────────────────────────────────

def szew(kafel, os):
    """Ile 'kosztuje' polozenie tego kafla obok samego siebie.

    To jest JEDYNY test, ktory ma sens dla tilesetu i ktorego nie da sie
    zastapic ogladaniem pojedynczego kafla — szew widac dopiero po polozeniu
    drugiego obok.

    Styk porownujemy z **90. percentylem** roznic wewnetrznych, nie z mediana.
    Pierwsza wersja liczyla mediane i wyrzucala strzeche jako zepsuta ze
    wskaznikiem 10,9 — a tam roznica na styku to po prostu GRANICA KURSU, taka
    sama jak trzy granice wewnatrz kafla. Mediana ich nie widzi (3 duze skoki
    na 31 roznic), wiec test mierzyl "czy kafel jest gladki", a nie "czy kafel
    sie sklada". Prawidlowe pytanie brzmi: czy styk jest gorszy niz najostrzejsze
    przejscie, ktore i tak w tym kaflu wystepuje.
    """
    a = kafel[..., :3].astype(float) * (kafel[..., 3:4].astype(float) / 255.0)
    if os == "x":
        styk = np.abs(a[:, -1] - a[:, 0]).mean()
        wewn = [np.abs(a[:, i + 1] - a[:, i]).mean() for i in range(T - 1)]
    else:
        styk = np.abs(a[-1, :] - a[0, :]).mean()
        wewn = [np.abs(a[i + 1, :] - a[i, :]).mean() for i in range(T - 1)]
    return styk, max(float(np.percentile(wewn, 90)), 0.01)


def weryfikuj(kafle):
    dozwolone = {c for r in PAL.values() for c in r}
    print("\nWERYFIKACJA")

    zle = []
    for (n, i), (_k, _w, px) in kafle.items():
        m = px[..., 3] == 255
        for c in {tuple(v) for v in px[m][:, :3]}:
            if c not in dozwolone:
                zle.append((n, i, c))
    print("[1] paleta            %d kolorow spoza docs/paleta.json  %s"
          % (len(zle), "OK" if not zle else "BLAD"))

    naj, gdzie = 0, ""
    for (n, i), (_k, _w, px) in kafle.items():
        m = px[..., 3] > 8
        if m.any():
            ile = len({tuple(v) for v in px[m][:, :3]})
            if ile > naj:
                naj, gdzie = ile, "%s/%d" % (n, i)
    print("[2] kolorow na kafel  max %d (%s), prop detaliczny do ~24  %s"
          % (naj, gdzie, "OK" if naj <= 24 else "UWAGA"))

    print("[3] alfa: piksel w pelni kryjacy albo w pelni przezroczysty")
    polcien = 0
    for (n, i), (_k, _w, px) in kafle.items():
        a = px[..., 3]
        polcien += int(((a > 0) & (a != 255) & (a != 110)).sum())
    print("      %d pikseli w polcieniu (110 = cien kontaktowy, dozwolony)  %s"
          % (polcien, "OK" if polcien == 0 else "BLAD"))

    # Kafle, ktore MUSZA sie skladac same ze soba. To jest sedno tilesetu.
    print("[4] bezszwowosc (styk / wnetrze, im blizej 1 tym lepiej)")
    do_sprawdzenia = [("sciana", 1, "xy"), ("sciana2", 1, "xy"),
                      ("polac", 1, "xy"), ("polac2", 1, "xy"),
                      ("sciana", 0, "y"), ("sciana", 2, "y"),
                      ("polac", 0, "y"), ("polac", 2, "y"),
                      ("deski", 1, "xy"), ("deski2", 1, "xy"),
                      ("deski", 0, "y"), ("deski", 2, "y"),
                      ("polac_l", 1, "xy"), ("polac_p", 1, "xy"),
                      ("wiata", 1, "x")]
    for n, i, osie in do_sprawdzenia:
        px = kafle[(n, i)][2]
        opis = []
        zle_os = False
        for os in osie:
            s, w = szew(px, os)
            opis.append("%s %.2f" % (os, s / w))
            if s / w > 1.3:
                zle_os = True
        print("      %-10s %-16s %s" % ("%s/%d" % (n, i), " ".join(opis),
                                        "SZEW" if zle_os else "OK"))

    # Nakladki musza miec przezroczyste marginesy, inaczej zaslonia sciane
    # dookola siebie i przestaja byc nakladkami.
    # `komin_1` celowo NIE jest tu sprawdzany: od kiedy ma wpieta kalenice,
    # jest kaflem dachu z kominem, a nie nakladka. Wrota z zalozenia kryja
    # caly swoj slad, wiec prog jest dla nich luzniejszy.
    print("[5] nakladki maja przezroczyste tlo")
    for n in ("okno", "okno_bez", "drzwi", "wrota", "okno_szczyt", "otwor_siana",
              "klapa", "drzwi_pol", "zagroda", "stog", "koryto"):
        for (nn, i), (_k, _w, px) in kafle.items():
            if nn != n:
                continue
            udzial = 100.0 * float((px[..., 3] == 0).mean())
            prog = 5 if nn == "wrota" else 15
            print("      %-12s %4.0f%% kafla przezroczyste  %s"
                  % ("%s/%d" % (nn, i), udzial, "OK" if udzial >= prog else "ZA PELNE"))

    # Kontrast wobec trawy (jasnosc 115) — budynek ma sie odcinac od podloza
    print("[6] kontrast wobec trawy (jasnosc trawy 115)")
    lum = lambda v: 0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]
    for n in ("sciana", "polac", "okap", "fundament", "deski", "deski_dol",
              "polac_l", "polac_p"):
        px = kafle[(n, 1)][2]
        m = px[..., 3] == 255
        j = np.array([lum(v) for v in px[m][:, :3]])
        print("      %-10s srednia %5.1f, %3.0f%% pikseli odcina sie  %s"
              % (n, j.mean(), 100 * (np.abs(j - 115) > 20).mean(),
                 "OK" if (np.abs(j - 115) > 20).mean() > 0.6 else "SLABY"))

    # uklad arkusza
    zaj, kolizje = {}, 0
    for (n, i), (k, w, _px) in kafle.items():
        if k >= COLS:
            kolizje += 1
        if (k, w) in zaj:
            kolizje += 1
        zaj[(k, w)] = "%s/%d" % (n, i)
    wierszy = max(w for _k, w, _px in kafle.values()) + 1
    print("[7] uklad arkusza     %d kolizji, %d kafli w %d wierszach x %d kolumnach  %s"
          % (kolizje, len(zaj), wierszy, COLS, "OK" if kolizje == 0 else "BLAD"))

    # Test, ktorego nie da sie zastapic ogladaniem pojedynczych kafli: czy
    # przekatne SPOTYKAJA SIE na granicach kafli i czy pas ma stala grubosc.
    # Blad o jeden piksel w masce daje albo szpare do trawy wzdluz calego
    # ramienia, albo zabek wystajacy poza obrys — jedno i drugie widac dopiero
    # po zlozeniu calego dachu.
    #
    # Obrys jest znany dokladnie. Dla ramienia lewego kalenica to X + Y = Xw,
    # okap X + Y = Xw + T*lico; dla prawego X - Y = Xw i X - Y = Xw - T*lico.
    # `lico` to NIE zawsze `GRUBOSC_DACHU` — od szer=10 w gore rosnie razem
    # z `dodatkowe` (patrz `_dach_szczytowy`), wiec pas jest wtedy GLEBSZY,
    # a nie tylko przesuniety. Sprawdzamy 3 px w glab pasa (ma byc kryjace)
    # i 3 px poza nim (ma byc puste). Ponizej okapu tolerancja jest wieksza
    # (12 px): tam celowo lezy cien rzucany na sciane szczytowa i zwisajace
    # strzepy.
    print("[8] dach /\\ sklada sie w pas o stalej grubosci")
    for szer in (4, 6, 8, 10):
        plan, lico, wys_d = _dach_szczytowy(szer)
        alfa = np.zeros((wys_d * T, szer * T), np.uint8)
        for (c, r), klucz in plan.items():
            alfa[r * T:(r + 1) * T, c * T:(c + 1) * T] = kafle[klucz][2][..., 3]
        yy, xx = np.mgrid[0:wys_d * T, 0:szer * T]
        os_x = szer * T // 2
        # `t` = 0 na kalenicy, rosnie ku okapowi; osobno dla obu ramion
        t = np.where(xx < os_x, (xx + yy) - (os_x - 1), (os_x - xx) + yy)
        w_pasie = (t >= 3) & (t <= lico * T - 3)
        poza = (t <= -3) | (t >= lico * T + 12)
        print("      %d kafli (szer %d)  %d dziur w pasie, %d pikseli poza pasem  %s"
              % (len(plan), szer, int((w_pasie & (alfa == 0)).sum()),
                 int((poza & (alfa > 0)).sum()),
                 "OK" if not (w_pasie & (alfa == 0)).any()
                 and not (poza & (alfa > 0)).any() else "BLAD"))

    # Sam obrys pasa nie wystarczy: cien i strzepy wiszace POD okapem tez musza
    # isc ukosem. Zanim powstal kafel `podokap`, nadmiar wychodzacy poza dolna
    # krawedz kafla okapu byl obcinany i dolna krawedz dachu byla SCHODAMI —
    # test obrysu tego nie widzial, bo sam pas byl w porzadku. Mierzymy wiec
    # najnizszy kryjacy piksel w kazdej kolumnie: na ukosie 45° suma
    # (kolumna + ten wiersz) jest stala, wiec jej rozrzut to wprost wysokosc
    # schodka w pikselach.
    print("[9] dolna krawedz dachu jest ukosem, nie schodami")
    for szer in (6, 8, 10):
        plan, lico, wys_d = _dach_szczytowy(szer)
        alfa = np.zeros((wys_d * T, szer * T), np.uint8)
        for (c, r), klucz in plan.items():
            alfa[r * T:(r + 1) * T, c * T:(c + 1) * T] = kafle[klucz][2][..., 3]
        suma = []
        for x in range(2, szer * T // 2 - 2):        # samo lewe ramie
            kol = np.nonzero(alfa[:, x])[0]
            if len(kol):
                suma.append(int(kol.max()) + x)
        rozrzut = max(suma) - min(suma)
        print("      szer %2d  schodek %d px (dopuszczalne 6 na strzepy)  %s"
              % (szer, rozrzut, "OK" if rozrzut <= 6 else "SCHODY"))

    # Ostateczny test dachu: czy zlozony pas rozni sie od tego samego rysunku
    # liczonego GLOBALNIE, bez podzialu na kafle. Poprzednie dwa testy patrza
    # na obrys, ten patrzy na kazdy piksel wnetrza — i tylko on lapie pas
    # rysowany wzdluz przekatnej, ktory urywa sie na granicy kafla, bo obrys
    # przy tym pozostaje bez zarzutu. Tak wlasnie uciekaly kolejno: cien pod
    # okapem, gruby brzeg okapu i walek kalenicy.
    print("[10] wnetrze pasa zgadza sie z rysunkiem liczonym globalnie")
    drewno = set(D)
    for szer in (6, 8, 10):
        plan, lico, wys_d = _dach_szczytowy(szer)
        zlo = np.zeros((wys_d * T, szer * T, 4), np.uint8)
        for (c, r), klucz in plan.items():
            zlo[r * T:(r + 1) * T, c * T:(c + 1) * T] = kafle[klucz][2]
        os_x, zle = szer * T // 2, 0
        for Y in range(wys_d * T):
            for X in range(szer * T):
                lewa = X < os_x
                t = (X + Y) - (os_x - 1) if lewa else (os_x - X) + Y
                # Sprawdzamy CALY przekroj pasa: walek kalenicy, poszycie
                # i gruby brzeg okapu. Pomijamy tylko to, co ma wlasny rysunek
                # niezalezny od odleglosci od kalenicy: belke kalenicowa przy
                # osi, zawiniete konce ramion i czola platwi wiszace ponizej
                # okapu.
                if not (0 <= t <= lico * T):
                    continue
                if abs(X - os_x) < 8 or X < 4 or X >= szer * T - 4:
                    continue
                barwa = tuple(zlo[Y, X, :3])
                if barwa in drewno:
                    continue          # czola platwi i belka — element drewniany
                u = ((X - Y) if lewa else (X + Y)) % T
                if barwa != _wzor_pasa(t, u, lewa, lico):
                    zle += 1
        print("      szer %2d  %d pikseli niezgodnych  %s"
              % (szer, zle, "OK" if zle == 0 else "SZEW"))

    # Testy [8]-[10] patrza tylko na SAM dach. Zaden z nich nie widzialby
    # dziury miedzy koncem dachu a poczatkiem sciany — dokladnie tak, jak
    # zaden z nich zlapal wystajacy zamek w narozniku, dopoki nie zlozono
    # dachu I SCIANY razem. Ten test sklada PRAWDZIWY budynek (`zloz_budynek`,
    # to samo, czego uzywa `render_wsi`) i szuka W KAZDEJ KOLUMNIE
    # pierwszego przezroczystego piksela ponizej pierwszego kryjacego —
    # dziura miedzy dachem a sciana i wystajacy poza sciane zamek obie tak
    # wygladaja: kryjace, potem przerwa, potem znowu kryjace.
    print("[11] dach styka sie ze sciana bez przerwy, w kazdej kolumnie")
    for nazwa_wzoru in ("chata", "obora", "stodola", "kurnik"):
        opis = WZORY[nazwa_wzoru]
        spod, nakl, dach, szer, wys = zloz_budynek(kafle, opis)
        zlo = np.zeros((wys * T, szer * T, 4), np.uint8)
        for warstwa in (spod, nakl, dach):
            for (c, r), klucz in sorted(warstwa.items(), key=lambda kv: kv[0][1]):
                if r < 0 or c < 0:
                    continue
                px = kafle[klucz][2]
                a = px[..., 3:4].astype(float) / 255.0
                y0, x0 = r * T, c * T
                zlo[y0:y0 + T, x0:x0 + T, :3] = (
                    px[..., :3] * a + zlo[y0:y0 + T, x0:x0 + T, :3] * (1 - a))
                zlo[y0:y0 + T, x0:x0 + T, 3] = np.maximum(
                    zlo[y0:y0 + T, x0:x0 + T, 3], px[..., 3])
        dziury = 0
        for c in range(szer):
            kol = zlo[:, c * T + T // 2, 3]           # os kolumny, unika krawedzi
            kryjace = np.nonzero(kol)[0]
            if len(kryjace) == 0:
                continue
            gora, dol = kryjace.min(), kryjace.max()
            dziury += int((kol[gora:dol + 1] == 0).sum())
        print("      %-8s szer %2d  %d pikseli dziury miedzy dachem a sciana  %s"
              % (nazwa_wzoru, szer, dziury, "OK" if dziury == 0 else "DZIURA"))

    # ── [12] RZUT ZLOZONY CZYTA SIE JAKO JEDEN BUDYNEK ─────────────────────
    #
    # Testy [1]-[11] ogladaja pojedynczy budynek i wszystkie przechodzily na
    # wersji, ktora zostala odrzucona na pierwszy rzut oka jako "budynek za
    # budynkiem". Zaden nie mogl jej zlapac, bo kazdy z osobna kafel i kazda
    # z osobna bryla byly poprawne — zle bylo ICH ZLOZENIE. Ten test patrzy
    # wiec na trzy rzeczy, ktore odrozniaja jedna bryle od dwoch, i wszystkie
    # trzy to rzeczy, ktore tamta wersja lamala:
    #
    #  a) JEDNA LINIA GRUNTU — najnizszy kryjacy piksel musi byc w tym samym
    #     wierszu w kazdej kolumnie. Dwie linie gruntu to dwa budynki, i to
    #     bylo widac najmocniej: w podworzu U korpus konczyl sie trawa.
    #  b) ZERO TRAWY WEWNATRZ SYLWETKI — miedzy pierwszym a ostatnim kryjacym
    #     pikselem kolumny. Lapie i wyrwe po nieprzykrytej przezroczystosci
    #     ramienia (brak kafla `dolina_`), i przerwe miedzy bryłami.
    #  c) ZERO OKAPOW KORPUSU W KOLUMNACH SKRZYDLA — frędzel konczacy dach
    #     w narozniku wklęsłym. Sprawdzane na PLANIE, nie na pikselach:
    #     przykryty w 99% wyglada dobrze i dalej jest bledem.
    print("[12] rzut zlozony (L/T/U) czyta sie jako jeden budynek")
    for nazwa_wzoru, opis in WZORY_ZLOZONE.items():
        spod, nakl, dach, szer, wys = zloz_zlozony(kafle, opis)
        zlo = render_domu(kafle, (spod, nakl, dach), szer, wys)
        grunty, dziury = set(), 0
        for c in range(szer):
            kol = zlo[:, c * T + T // 2, 3]
            kryjace = np.nonzero(kol)[0]
            if len(kryjace) == 0:
                continue
            grunty.add(int(kryjace.max()))
            dziury += int((kol[kryjace.min():kryjace.max() + 1] == 0).sum())
        kolumny = {c for skr in opis["skrzydla"]
                   for c in range(skr["x"], skr["x"] + skr["szer"])}
        okapy = sum(1 for (c, _r), (n, _i) in dach.items()
                    if c in kolumny and n == "okap")
        print("      %-10s %d linia gruntu / %d pikseli trawy w srodku / "
              "%d okapow korpusu pod skrzydlem  %s"
              % (nazwa_wzoru, len(grunty), dziury, okapy,
                 "OK" if len(grunty) == 1 and dziury == 0 and okapy == 0 else "BLAD"))
    return wierszy


# ── SKLADANIE DOMU (podglad + wzor dla mapy) ────────────────────────────────

def _dach_szczytowy(szer, grubosc=GRUBOSC_DACHU, os=None):
    """Dach /\\ — {(kol, wiersz): klucz}, wiersz sciany szczytowej i wysokosc.

    ⚠ **`os` — gdzie stoi kalenica, NIE MUSI byc srodkiem.** Domyslnie
    `szer // 2` (stary, symetryczny dach — zachowanie identyczne jak przed
    dodaniem tego parametru, zweryfikowane porownaniem plan-za-planem).
    Przesuniete `os` daje SALTBOX: krotki, stromy skos po jednej stronie,
    dlugi, plytszy po drugiej — jeden dach, jedna kalenica, te same kafle
    (`szczyt`/`skos`/`kalenica`/`polac`/`okap`), bez zadnego nowego kafla.
    Dokladnie ten ksztalt, ktory autor wskazal na referencji: „jeden
    pierdolony dach", nie dwie bryly zszyte lacznikiem.

    Konsekwencja: `dodatkowe`/`lico` licza sie teraz z WIEKSZEGO z dwoch
    `d_max` (krotsza strona i tak dostaje `dodatkowe` pelnych kafli polaci,
    zeby jej sciana zaczynala sie w TYM SAMYM wierszu co sciana dluzszej
    strony — jeden dach, jedna wysokosc sciany pod nim, patrz `docs/
    proporcje_domow.md`).

    Ramie schodzi o JEDEN kafel w prawo na jeden w dol (45°), a pas ma stala
    grubosc `grubosc` kafli mierzona w pionie. Kolumna `c` po lewej stronie
    dostaje wiec kalenice w wierszu `srodek-1-c`, pod nia (grubosc-1) kafli
    polaci i okap.

    Zwraca takze `wiersz_sciany` — wiersz, w ktorym ma zaczac sie sciana.

    **To NIE jest po prostu `grubosc`, tylko `max(grubosc, srod)` — i brakujaca
    roznica jest UZUPELNIANA DODATKOWYMI KAFLAMI POLACI, nie zdobywana kosztem
    przesuniecia sciany.** Pierwsza poprawka tego bledu przesuwala `wiersz_
    sciany` w dol, zostawiajac RESZTE dachu bez zmian — to zamienilo jeden
    blad w drugi: kolumna PRZY KALENICY (ktora swoj pas konczyla dokladnie na
    starym `grubosc`) miala teraz dziure — pas juz sie skonczyl, sciana jeszcze
    sie nie zaczela, dokladnie tam gdzie miedzy ramionami ma byc widoczna
    sciana szczytowa. Zgloszone wprost: "przesunales rzad kafelkow zamiast
    dodac rzad kafelkow, mamy dziure".

    Poprawny mechanizm: kazda kolumna dostaje `dodatkowe = max(0, srod -
    grubosc)` DODATKOWYCH, w pelni kryjacych kafli polaci, wstawionych PRZED
    okapem (miedzy trzeci kafel pasa a `okap_skos`/`kon_okap`, ktore schodza
    o `dodatkowe` wierszy nizej razem z `podokap`). Kazda kolumna — takze ta
    przy kalenicy — dostaje wiec DOKLADNIE `dodatkowe` wierszy wiecej dachu,
    nie tylko kolumna brzegowa: sciana szczytowa zaczyna sie dalej, ale wciaz
    DOKLADNIE tam, gdzie dach nad nia sie konczy, bo koniec dachu przesunal
    sie o tyle samo. Dopiero to jest "dodaj rzad kafelkow", a nie "przesun
    sciane".

    Dlaczego kolumna brzegowa byla bez pelnego kafla przy starym stalym
    `grubosc`: kazda kolumna zaczyna swoj wlasny pas w innym wierszu (`r0 =
    d`, dalej od osi = nizej), wiec przy `wiersz_sciany = grubosc` kolumna
    z najwiekszym `d` miala tam dopiero swoj PIERWSZY, najcieńszy kafel pasa.
    Jej zamek w narozniku (ten sam ksztalt co zamek w scianie z bali)
    wystawal wtedy na goly trawnik — pierwsze zgloszenie, "belki wystaja".
    Niewidoczne przy szer=6, dokladna rownosc `d_max=grubosc` przy szer=8,
    a od szer=10 w gore `d_max>grubosc` — kolumna brzegowa nie miala tam
    NIC, bo jej wlasny pas jeszcze sie nie zaczal.
    """
    if grubosc != 3:
        # Pas ma dokladnie trzy wiersze i komplet kafli jest pod to zrobiony:
        # gorny styka sie rogiem z kalenica, dolny z okapem, srodkowy niesie
        # koniec belki kalenicowej. Inna grubosc wymaga dorobienia kafli
        # posrednich, a nie zmiany tej liczby.
        raise ValueError("komplet dachu /\\ jest zrobiony pod grubosc 3")
    if os is None:
        if szer % 2:
            raise ValueError("dach symetryczny wymaga parzystej szerokosci, dostal %d" % szer)
        os = szer // 2
    if not (0 < os < szer):
        raise ValueError("os musi lezec wewnatrz budynku (0 < os < szer)")
    # Kazda strona ma WLASNE d_max — krotsza konczy sie szybciej, dluzsza
    # potrzebuje wiecej kafli polaci. `lico` bierze WIEKSZE z dwoch, zeby
    # obie sciany zaczynaly sie w tym samym wierszu (jeden dach = jedna
    # wysokosc sciany pod nim).
    d_max_lewa, d_max_prawa = os - 1, (szer - 1) - os
    d_max = max(d_max_lewa, d_max_prawa)
    # UWAGA: `+1`, nie `d_max` samo — stary symetryczny kod liczyl to z `srod`
    # (`= d_max + 1`, bo d biegnie 0..srod-1), nie z `d_max` wprost. Pierwsza
    # wersja tej generalizacji pominela to „+1" i przy szer=8/os=4 dawala
    # lico=3 zamiast 4 — o caly wiersz plytszy dach niz oryginal, niezlapane
    # przez testy [8]-[10] (one licza dziury w sylwetce, nie glebokosc pasa).
    dodatkowe = max(0, (d_max + 1) - grubosc)
    lico = grubosc + dodatkowe                     # == max(grubosc, d_max + 1)
    plan = {}
    for c in range(szer):
        lewa = c < os
        d = (os - 1 - c) if lewa else (c - os)          # ile kafli od osi, PO SWOJEJ stronie
        r0 = d                                          # wiersz z kalenica
        d_max_tej_strony = d_max_lewa if lewa else d_max_prawa
        przy_osi, koniec = d == 0, d == d_max_tej_strony
        bok = 0 if lewa else 2
        rodzina = "szczyt" if przy_osi else ("kon_polac" if koniec else "polac")
        plan[(c, r0)] = (("szczyt" if przy_osi else "skos"), bok)
        plan[(c, r0 + 1)] = (rodzina + "_kal", bok)
        # Dodatkowe, PELNE kafle polaci — gladkie dla srodka, z zawinieta
        # krawedzia dla kolumny brzegowej (ta sama krawedz co reszta jej
        # pasa, inaczej dopiero TU widac twardy, nieowiniety brzeg), a przy
        # kalenicy — belka CIAGNACA SIE DALEJ (bez tego znikala na tych
        # wierszach i pojawiala sie znowu dopiero przy czole, jakby mial
        # przerwe w srodku). Ida zaraz PO "_kal", nie po "_dol"/"_okp" —
        # patrz nizej.
        if przy_osi:
            wypelniacz = ("szczyt_fill", bok)
        elif koniec:
            wypelniacz = ("kon_polac", bok)
        else:
            wypelniacz = (("polac_l" if lewa else "polac_p"), 1)
        for i in range(dodatkowe):
            plan[(c, r0 + 2 + i)] = wypelniacz
        # "_dol"/"_okp" ma WPIECZONY naklad grubego brzegu okapu (patrz
        # `_naroznik_okapu`) — poprawny TYLKO w kaflu bezposrednio PRZED
        # okapem. Trzymanie go na stalym r0+2 bylo poprawne dopoki `dodatkowe`
        # zawsze wynosilo 0; gdy zaczelo bywac >0, ten kafel ladowal kilka
        # wierszy PRZED prawdziwym okapem, a jego wpieczony brzeg malowal sie
        # w miejscu zwyklego poszycia — zgloszone przez test [10] jako setki
        # niezgodnych pikseli. Musi wiec siedziec na r0+lico-1, czyli
        # DOKLADNIE jeden wiersz przed okapem, niezaleznie od `dodatkowe`.
        plan[(c, r0 + lico - 1)] = (rodzina + ("_dol" if przy_osi else "_okp"), bok)
        plan[(c, r0 + lico)] = (("kon_okap" if koniec else "okap_skos"), bok)
        plan[(c, r0 + lico + 1)] = ("podokap", bok)
    return plan, lico, (os - 1) + lico + 2


def _dach_plaski(szer, glebokosc):
    """Dach kalenicowy (prostokat) — dla budynkow dlugich i wiat.

    Trojkat o podstawie 9 kafli mialby 5 wierszy dachu i 160 px samej slomy;
    stodola i stajnia dostaja wiec dach prosty. To nie jest ustepstwo — tak
    stoi kazda dluga szopa w materiale referencyjnym.
    """
    plan = {}
    for r in range(glebokosc):
        rzad = "kalenica" if r == 0 else ("okap" if r == glebokosc - 1 else "polac")
        for c in range(szer):
            i = 0 if c == 0 else (2 if c == szer - 1 else 1)
            if rzad == "polac" and i == 1 and (r + c) % 2:
                plan[(c, r)] = ("polac2", 1)
            else:
                plan[(c, r)] = (rzad, i)
    return plan, glebokosc


def _dach_przybudowki(szer, glebokosc):
    """Dach jednospadowy (pulpitowy) przybudowki — patrz `kafel_przybud_styk`.

    Ten sam uklad co `_dach_plaski`, z jedna podmiana: gorny rzad to
    `przybud_styk` (sloma wchodzaca pod sciane budynku glownego) zamiast
    `kalenica` (grzbiet). Reszta rzedow jest identyczna i celowo dzieli te
    same kafle — przybudowka ma byc TYM SAMYM dachem co szopa, tylko opartym
    o dom, a nie osobnym materialem.

    ⚠ Minimalna glebokosc to 2: przy jednym rzedzie kafel styku bylby zarazem
    okapem, wiec przybudowka nie mialaby ani okapu, ani cienia pod nim, i
    czytalaby sie jak ciemny pas przyklejony do sciany.
    """
    if glebokosc < 2:
        raise ValueError("przybudowka potrzebuje co najmniej 2 rzedow dachu")
    plan = {}
    for r in range(glebokosc):
        rzad = ("przybud_styk" if r == 0
                else ("okap" if r == glebokosc - 1 else "polac"))
        for c in range(szer):
            i = 0 if c == 0 else (2 if c == szer - 1 else 1)
            if rzad == "polac" and i == 1 and (r + c) % 2:
                plan[(c, r)] = ("polac2", 1)
            else:
                plan[(c, r)] = (rzad, i)
    return plan, glebokosc


def _sciany(szer, wysokosc, material, y0, otwarty=None, gorny_rzad=True):
    """`gorny_rzad=False` pomija kafel z cieniem okapu.

    Dach szczytowy rzuca cien wzdluz UKOSNEGO okapu i ma go wpieczonego we
    wlasne kafle; poziomy pas cienia z `sciana_gora` bieglby wtedy w poprzek
    sciany szczytowej, przez srodek nieba nad drzwiami.
    """
    plan = {}
    for r in range(wysokosc):
        y, gora, dol = y0 + r, r == 0 and gorny_rzad, r == wysokosc - 1
        for c in range(szer):
            i = 0 if c == 0 else (2 if c == szer - 1 else 1)
            if material == "deski":
                nazwa = "deski_gora" if gora else ("deski_dol" if dol else "deski")
                if nazwa == "deski" and i == 1 and (r + c) % 2:
                    nazwa, i = "deski2", 1
            else:
                nazwa = "sciana_gora" if gora else ("fundament" if dol else "sciana")
                if nazwa == "sciana" and i == 1:
                    nazwa = ("sciana", "sciana2", "sciana3")[(r * 2 + c) % 3]
                elif nazwa == "sciana" and (r + c) % 2:
                    i = 3 if i == 0 else 4
            plan[(c, y)] = (nazwa, i)
    if otwarty:
        # Otwarty front zajmuje TYLKO dolny wiersz sciany. Otwarcie na cala
        # wysokosc zostawiloby dach na dwoch slupach i budynek przestalby byc
        # budynkiem — stajnia ma sciane, w ktorej jest brama, a nie cztery slupy.
        a, b = otwarty
        for c in range(a, b + 1):
            plan[(c, y0 + wysokosc - 1)] = (
                ("wiata_slup", 1) if (c - a) % 2 == 0 else ("wiata", 1))
    return plan


# Wzory budynkow wsi. To jest jedyne miejsce, gdzie widac, ze komplet naprawde
# sklada sie w piec ROZNYCH budynkow, a nie w piec razy ten sam dom.
#
# Szerokosc pod dachem /\ jest PARZYSTA — patrz `_dach_szczytowy`. Sciana musi
# siegac nizej niz najnizszy kafel dachu (czyli `szer/2 + grubosc` wierszy od
# wierzcholka), inaczej ramie dachu wisi nad trawa zamiast nad sciana.
WZORY = {
    "chata":   dict(szer=8, sciana=5, material="bale",  dach="szczyt",
                    drzwi=4, okna=(2, 6), okno_szczyt=True, komin=True),
    "stodola": dict(szer=10, sciana=6, material="deski", dach="szczyt",
                    wrota=4, otwor_siana=True),
    "obora":   dict(szer=8, sciana=5, material="deski", dach="szczyt",
                    drzwi_pol=4, okna=(2,), okno_szczyt=True),
    "kurnik":  dict(szer=6, sciana=4, material="deski", dach="szczyt",
                    klapa=3),
    "stajnia": dict(szer=9, sciana=3, material="deski", dach="plaski",
                    dach_wys=3, otwarty=(1, 7)),
}


def zloz_budynek(kafle, opis):
    """Zwraca (spod, nakladki, dach, szer, wys) — budynek zlozony z kompletu.

    Trzy slowniki, bo trzy warstwy mapy: `spod` -> `buildings`, `nakladki` ->
    `buildings-detale`, `dach` -> `buildings-over`. **Dach szczytowy MUSI byc
    warstwa nad sciana**, a nie obok niej: jego ramiona zachodza na gorne rogi
    sciany, a miedzy ramionami sciana ma byc widoczna. Gdyby dach i sciana
    dzielily jedna warstwe, kafel dachu wymazywalby sciane pod soba i szczyt
    zamienialby sie w dziure.

    Ta sama logika siedzi w tools/build_mapa.py; tutaj sluzy do podgladu
    i do tego, zeby weryfikacja patrzyla na ZLOZONY budynek, a nie na
    pojedyncze kafle. Kafel ogladany osobno klamie — to jest ta sama lekcja,
    co przy planszy stykowej drzew.
    """
    szer, ws = opis["szer"], opis["sciana"]
    szczytowy = opis.get("dach", "szczyt") == "szczyt"
    if szczytowy:
        dach, lico, wys_dachu = _dach_szczytowy(szer)
    else:
        dach, wys_dachu = _dach_plaski(szer, opis.get("dach_wys", 3))
        lico = wys_dachu
    spod = _sciany(szer, ws, opis.get("material", "bale"), lico,
                   opis.get("otwarty"), gorny_rzad=not szczytowy)

    nakl = {}
    dol = lico + ws - 1                    # ostatni wiersz sciany
    if opis.get("drzwi") is not None:
        nakl[(opis["drzwi"], dol - 1)] = ("drzwi", 0)
        nakl[(opis["drzwi"], dol)] = ("drzwi", 1)
    if opis.get("drzwi_pol") is not None:
        nakl[(opis["drzwi_pol"], dol - 1)] = ("drzwi_pol", 0)
        nakl[(opis["drzwi_pol"], dol)] = ("drzwi_pol", 1)
    if opis.get("wrota") is not None:
        for k in (0, 1):
            nakl[(opis["wrota"] + k, dol - 1)] = ("wrota", k * 2)
            nakl[(opis["wrota"] + k, dol)] = ("wrota", k * 2 + 1)
    for ox in opis.get("okna", ()):
        nakl[(ox, dol - 1)] = ("okno", 0)
    if opis.get("klapa") is not None:
        nakl[(opis["klapa"], dol)] = ("klapa", 0)
    # Okienko poddasza i otwor na siano ida na SCIANE SZCZYTOWA, czyli w klin
    # miedzy ramionami dachu — na kolumne tuz przy osi, w wierszu, w ktorym
    # okapy juz sie rozeszly. To jest dokladnie to miejsce, ktore wypelniony
    # trojkat z pierwszego podejscia zabudowywal slomia.
    for co in ("okno_szczyt", "otwor_siana"):
        if opis.get(co):
            nakl[(szer // 2 - 1, lico + (1 if szczytowy else 0))] = (co, 0)
    if opis.get("komin"):
        # Na dachu szczytowym komin stoi NA POLACI — i to musi byc polac
        # ZWYKLA, nie kafel przy osi ani koniec ramienia: dolny kafel komina
        # ma wpieczone wlasne tlo (patrz `kafle_komin`), wiec postawiony na
        # kaflu z belka kalenicowa albo z zawinietym koncem po prostu by je
        # wymazal. Druga kolumna od osi jest pierwsza, ktora to spelnia —
        # dlatego komin wymaga szerokosci co najmniej 6.
        # Komin idzie do warstwy DACHU, nie nakladek: nakladki rysuja sie pod
        # dachem (bo leza na scianie), wiec komin wladowany tam znikal pod
        # polacia i wystawal tylko ten jego kawalek, ktory przypadkiem byl
        # poza obrysem ramienia. Wygladalo to na urwany kamienny klin.
        if szczytowy:
            if szer < 6:
                raise ValueError("komin na dachu /\\ wymaga szerokosci >= 6")
            dach[(szer // 2 - 2, GRUBOSC_DACHU)] = ("komin", 2)
            dach[(szer // 2 - 2, GRUBOSC_DACHU - 1)] = ("komin", 3)
        else:
            dach[(szer // 2, 0)] = ("komin", 1)
            dach[(szer // 2, -1)] = ("komin", 0)
    return spod, nakl, dach, szer, lico + ws


# ── RZUTY ZLOZONE: L / T / U ────────────────────────────────────────────────
#
# ⚠ **TO NIE SA DWA BUDYNKI ZLOZONE OBOK SIEBIE, I TO JEST CALA RZECZ.**
# Pierwsze podejscie skladalo rzut L z dwoch niezaleznych `zloz_budynek`,
# przesuwajac blizszy o `ofs_y` wierszy w dol, zeby "wyszedl na gracza".
# Zostalo zgloszone od razu i sluszne: "wyglada jak budynek za budynkiem,
# a nie jak jeden budynek". Trzy rzeczy to zabijaly, wszystkie zmierzone:
#
#  1. **Dwie linie gruntu z trawa miedzy nimi.** Korpus konczyl fundament
#     64 px wyzej niz skrzydlo, wiec w podworzu U bylo widac pelna elewacje
#     korpusu — okap, sciane, fundament — a POD nia trawe, i dopiero potem
#     osobne fundamenty skrzydel. Jeden budynek ma jeden obrys.
#  2. **Okap korpusu zwisal w narozniku wklęsłym.** Poprzednia poprawka
#     kasowala go w kolumnach ZASLONIETYCH przez skrzydlo; kolumny podworza
#     nie sa zaslonięte, wiec trzymaly frędzel i cien wiszace w powietrzu
#     dokladnie tam, gdzie ma byc kosz.
#  3. **Rozne wysokosci kondygnacji.** `sciana=3` korpusu to w praktyce JEDEN
#     rzad bali (jeden wiersz zjada `sciana_gora`, jeden `fundament`),
#     `sciana=4` skrzydla to trzy.
#
# Ta funkcja rozwiazuje wszystkie trzy tak samo: **jest tylko jedna sciana**.
# Korpus i skrzydla dziela ten sam pas `_sciany` — te same wiersze, ten sam
# fundament, ta sama wysokosc. Skrzydlo wnosi WYLACZNIE dach; scianę szczytowa
# widac w klinie miedzy jego ramionami i jest to po prostu sciana korpusu.
#
# ── DLACZEGO KALENICA SKRZYDLA STOI NAD KALENICA KORPUSU ────────────────────
# `PODNIESIENIE` nie jest gustem — dobrane tak, zeby okap korpusu byl przykryty
# w KAZDEJ kolumnie skrzydla (inaczej wraca blad 2) i zeby klin sciany
# szczytowej zaczynal sie doklodnie tam, gdzie zaczyna sie sciana korpusu
# (inaczej trzeba by kasowac kafle dachu korpusu, czyli robic dziure).
# Sprawdzone dla kazdej dopuszczalnej szerokosci skrzydla: 2 spelnia oba
# warunki, 3 lamie pierwszy, 0 i 1 marnuja polowe kafli `dolina_`.
# Przy okazji daje jedyna rzecz, po ktorej w plaskiej elewacji widac, ze
# skrzydlo jest BLIZEJ: jest wyzsze, a jego podokap kladzie cien na sciane.
PODNIESIENIE = 2


def zloz_zlozony(kafle, opis):
    """Rzut L / T / U jako JEDEN budynek. Zwraca (spod, nakl, dach, szer, wys).

    `opis`: `szer` (korpus), `sciana`, `material`, `okna`, oraz `skrzydla` —
    lista `dict(x=, szer=, drzwi=, okno_szczyt=)`. L = jedno skrzydlo przy
    koncu, T = jedno w srodku, U = po jednym przy obu koncach. Ksztalt nie
    jest tu zadnym trybem: to jest ta sama operacja powtorzona w innym miejscu.
    """
    szer, W = opis["szer"], opis["sciana"]
    material = opis.get("material", "bale")
    k, D = PODNIESIENIE, GRUBOSC_DACHU

    # Korpus: dach kalenicowy, przesuniety o `k` w dol, zeby szczyty skrzydel
    # miescily sie w plotnie od wiersza 0.
    plan_k, _ = _dach_plaski(szer, D)
    dach = {(c, r + k): klucz for (c, r), klucz in plan_k.items()}
    komorki_korpusu = set(dach)
    nakl = {}
    dol = k + D + W - 1                       # wspolny wiersz fundamentu

    # ── SCIANA SZCZYTOWA SKRZYDLA ZACZYNA SIE WYZEJ NIZ SCIANA KORPUSU ─────
    #
    # ⚠ To jest miejsce, w ktorym pierwsza wersja TEJ funkcji nadal byla zla,
    # mimo ze test [12] swiecil na zielono. Klin miedzy ramionami skrzydla
    # wypelniala STRZECHA KORPUSU — bo komorka byla komorka dachu korpusu,
    # wiec regula "lezy na cudzym dachu -> kosz" podmieniala tam okap i
    # podokap ramienia na warianty `dolina_`, zamalowujac przezroczystosc
    # slomą. A pod okapem skrzydla nie ma dachu korpusu: skrzydlo stoi PRZED
    # nim i zasłania go wlasna sciana szczytowa. Wychodzila z tego chalupa
    # z pasem slomy wmurowanym w szczyt.
    #
    # Poprawnie: `szczyt_od = d + 3` — sciana kazdej kolumny skrzydla zaczyna
    # sie dokladnie pod jej okapem (`d` = odleglosc kolumny od osi, +3 to pas
    # dachu). Kolumna przy osi zaczyna wiec sciane o `k` wierszy wyzej niz
    # korpus, czyli dokladnie o tyle, o ile skrzydlo jest wyzsze. Nic tu nie
    # trzeba kasowac: kafel skrzydla i tak nadpisuje kafel korpusu w tej samej
    # komorce `dach`, a sciana lezy na `spod` i przeswituje przez przezroczyste
    # zewnetrze okapu — dokladnie tak, jak od zawsze dziala zwykla chata.
    szczyt_od = {}
    kolumny_skrzydel = set()
    for skr in opis["skrzydla"]:
        ox, s = skr["x"], skr["szer"]
        _plan, lico_s, _w = _dach_szczytowy(s)
        if lico_s != D:
            # `_dach_szczytowy` doklada `dodatkowe = szer//2 - GRUBOSC_DACHU`
            # wierszy polaci powyzej szer=6, wiec pas skrzydla przestaje byc
            # rowny pasowi korpusu i cala arytmetyka `k` sie rozjezdza.
            raise ValueError(
                "skrzydlo szerokosci %d ma pas %d kafli zamiast %d — rzut "
                "zlozony obsluguje szerokosci parzyste do 6" % (s, lico_s, D))
        if ox < 0 or ox + s > szer:
            raise ValueError("skrzydlo wychodzi poza korpus")
        srod = s // 2
        for c in range(s):
            d = (srod - 1 - c) if c < srod else (c - srod)
            szczyt_od[ox + c] = d + D
            kolumny_skrzydel.add(ox + c)

    # Jedna sciana na caly budynek — od najwyzszego szczytu do wspolnego
    # fundamentu — z ktorej kazda kolumna bierze tylko swoja czesc.
    gora = min([k + D] + list(szczyt_od.values()))
    pelna = _sciany(szer, dol - gora + 1, material, gora,
                    opis.get("otwarty"), gorny_rzad=False)
    spod = {(c, r): klucz for (c, r), klucz in pelna.items()
            if r >= szczyt_od.get(c, k + D)}
    # `sciana_gora` niesie POZIOMY cien okapu korpusu — tylko tam, gdzie
    # korpus naprawde ma okap. W kolumnie skrzydla ten pas bieglby w poprzek
    # szczytu, przez srodek nieba nad drzwiami; to ten sam powod, dla ktorego
    # `_sciany` ma w ogole `gorny_rzad`, tylko ze tu dotyczy czesci kolumn.
    for c in range(szer):
        if c not in kolumny_skrzydel:
            i = 0 if c == 0 else (2 if c == szer - 1 else 1)
            spod[(c, k + D)] = (
                "deski_gora" if material == "deski" else "sciana_gora", i)

    for skr in opis["skrzydla"]:
        ox, s = skr["x"], skr["szer"]
        plan_s, _lico, _w = _dach_szczytowy(s)
        for (c, r), (nazwa, bok) in plan_s.items():
            cel = (ox + c, r)
            # ⚠ Podmiana na kosz TYLKO tam, gdzie za kaflem NAPRAWDE stoi dach
            # korpusu: komorka nalezy do korpusu I lezy POWYZEJ sciany
            # szczytowej tej kolumny. Ponizej niej stoi sciana i przezroczystosc
            # ma zostac przezroczysta — patrz dlugi komentarz wyzej.
            if (cel in komorki_korpusu and r < szczyt_od[ox + c]
                    and ("dolina_" + nazwa, bok) in kafle):
                # Kafel kosza ma TLO WPIECZONE (patrz `kafel_dolina`), wiec
                # jest poprawny wylacznie nad tym kaflem korpusu, z ktorego to
                # tlo wziete. Skrzydlo w skrajnej kolumnie korpusu trafiloby
                # na `kalenica`/0 albo /2 — grzbiet z zawinietym koncem —
                # i kosz namalowalby tam grzbiet przelotowy, czyli urwalby
                # rog dachu. Lepiej rzucic wyjatkiem niz cicho zle narysowac.
                if dach[cel] != ("kalenica", 1):
                    raise ValueError(
                        "skrzydlo na x=%d wchodzi w kafel korpusu %s, a kosz "
                        "ma wpieczone tlo 'kalenica/1' — odsun skrzydlo od "
                        "skrajnej kolumny korpusu" % (ox, dach[cel]))
                dach[cel] = ("dolina_" + nazwa, bok)
            else:
                dach[cel] = (nazwa, bok)
        if skr.get("drzwi") is not None:
            for i, r in enumerate((dol - 1, dol)):
                nakl[(ox + skr["drzwi"], r)] = ("drzwi", i)
        if skr.get("okno_szczyt"):
            # Tuz pod wierzcholkiem klina, na kolumnie przy osi.
            nakl[(ox + s // 2 - 1, szczyt_od[ox + s // 2 - 1] + 1)] = ("okno_szczyt", 0)

    for ox in opis.get("okna", ()):
        if ox not in kolumny_skrzydel:
            nakl[(ox, dol - 1)] = ("okno", 0)
    if opis.get("drzwi") is not None:
        for i, r in enumerate((dol - 1, dol)):
            nakl[(opis["drzwi"], r)] = ("drzwi", i)
    return spod, nakl, dach, szer, dol + 1


# Trzy rzuty na jednym komplecie kafli. Szerokosc skrzydla jest PARZYSTA
# i najwyzej 6 — patrz `zloz_zlozony`.
#
# ⚠ `sciana=4`, nie 5, i to jest proporcja, nie gust. Nad wiekszoscia
# szerokosci rzutu zlozonego stoi dach KALENICOWY, czyli pas 3 kafli — i cala
# reszta kompletu jest strojona pod relacje "dach 3 / sciana 3" (`stajnia`).
# Do tego dochodzi `PODNIESIENIE`, wiec przy `sciana=5` budynek ma 10 wierszy,
# z czego polowa to gola sciana: czyta sie jak dwukondygnacyjny spichlerz,
# a nie jak chalupa. Jeden wiersz wiecej niz `stajnia` bierze sie stad, ze
# klin sciany szczytowej musi pomiescic okienko poddasza NAD drzwiami.
WZORY_ZLOZONE = {
    # ⚠ Skrzydlo stoi na x=1, nie x=0 — patrz warunek na `kalenica/1`
    # w `zloz_zlozony`. Kosz ma tlo wpieczone i w skrajnej kolumnie korpusu
    # zamalowalby zawiniety koniec kalenicy. Jednokafowe cofniecie od szczytu
    # korpusu jest zreszta tym, co widac w kazdej referencji: skrzydlo rzadko
    # stoi w rownej linii ze szczytem, prawie zawsze jest lekko wpuszczone.
    "chalupa_L": dict(szer=10, sciana=4, material="bale", okna=(8,),
                      skrzydla=[dict(x=1, szer=6, drzwi=3, okno_szczyt=True)]),
    "chalupa_T": dict(szer=12, sciana=4, material="bale", okna=(1, 10),
                      skrzydla=[dict(x=3, szer=6, drzwi=3, okno_szczyt=True)]),
    "zagroda_U": dict(szer=12, sciana=4, material="deski", okna=(5, 7),
                      skrzydla=[dict(x=0, szer=4, drzwi=1),
                                dict(x=8, szer=4, drzwi=2)]),
}


def render_domu(kafle, warstwy, szer, wys):
    px = np.zeros(((wys + 1) * T, szer * T, 4), np.uint8)

    def wklej(c, r, kafel):
        y, x = (r + 1) * T, c * T
        if y < 0 or y + T > px.shape[0] or x < 0 or x + T > px.shape[1]:
            return
        a = kafel[..., 3:4].astype(float) / 255.0
        pod = px[y:y + T, x:x + T, :3].astype(float)
        px[y:y + T, x:x + T, :3] = (kafel[..., :3] * a + pod * (1 - a)).astype(np.uint8)
        px[y:y + T, x:x + T, 3] = np.maximum(px[y:y + T, x:x + T, 3], kafel[..., 3])

    for warstwa in warstwy:
        for (c, r), klucz in sorted(warstwa.items(), key=lambda kv: kv[0][1]):
            wklej(c, r, kafle[klucz][2])
    return px


def render_wsi(kafle, sciezka, skala=3):
    """Wszystkie wzory z WZORY obok siebie, na trawie, w jednym PNG.

    Podglad nie jest ozdoba raportu. Trzy bledy ukladu mapy zlapalo dopiero
    zlozenie calosci do PNG i POPATRZENIE na nie — tu jest tak samo: raport
    powie, ze kafle sie skladaja, a nie powie, ze stodola wyglada jak dom
    z za duzym dachem.
    """
    budynki = [zloz_budynek(kafle, WZORY[n]) for n in WZORY]
    # stog i koryto stoja obok — bez nich stodola jest szopa, a stajnia szopa
    # z dziura w scianie
    rekwizyty = ({(0, 0): ("stog", 0), (0, 1): ("stog", 1),
                  (1, 0): ("stog", 2), (1, 1): ("stog", 3),
                  (0, 3): ("koryto", 0), (0, 4): ("zagroda", 0),
                  (1, 4): ("zagroda", 1), (2, 4): ("zagroda", 2)}, 3, 5)
    wys = max([w for _s, _n, _d, _sz, w in budynki] + [rekwizyty[2]]) + 1
    szer = sum(s for _s, _n, _d, s, _w in budynki) + len(budynki) + 1 + rekwizyty[1] + 1
    plotno = np.zeros((wys * T, szer * T, 4), np.uint8)
    plotno[..., :3] = PAL["trawa"][2]
    plotno[..., 3] = 255
    x0 = 1
    for (spod, nakl, dach, s, w) in budynki + [
            (rekwizyty[0], {}, {}, rekwizyty[1], rekwizyty[2])]:
        dom = render_domu(kafle, (spod, nakl, dach), s, w)
        # render_domu zostawia u gory jeden pusty wiersz na komin ponad dachem
        wyc = dom[T:]
        y0 = (wys - w) * T
        a = wyc[..., 3:4].astype(float) / 255.0
        pod = plotno[y0:y0 + wyc.shape[0], x0 * T:x0 * T + wyc.shape[1], :3].astype(float)
        plotno[y0:y0 + wyc.shape[0], x0 * T:x0 * T + wyc.shape[1], :3] = (
            wyc[..., :3] * a + pod * (1 - a)).astype(np.uint8)
        x0 += s + 1
    obraz = Image.fromarray(plotno).convert("RGB")
    obraz = obraz.resize((obraz.width * skala, obraz.height * skala), Image.NEAREST)
    obraz.save(sciezka)
    print("-> %s  (%s)" % (sciezka, ", ".join(WZORY)))


def render_zlozonych(kafle, sciezka, skala=3):
    """Wszystkie rzuty z WZORY_ZLOZONE jeden pod drugim, na trawie.

    Osobny podglad, nie dopisek do `render_wsi`: tam chodzi o to, czy komplet
    sklada piec ROZNYCH budynkow, tu o to, czy sklada JEDEN budynek z dwoch
    bryl. To sa dwa rozne pytania i dwa rozne bledy — a drugiego z nich nie
    widac inaczej niz patrzac na zlozona calosc (poprzednia wersja przechodzila
    kazdy test kafla i mimo to czytala sie jako dwa domy).
    """
    obrazy = []
    for nazwa in WZORY_ZLOZONE:
        spod, nakl, dach, szer, wys = zloz_zlozony(kafle, WZORY_ZLOZONE[nazwa])
        dom = render_domu(kafle, (spod, nakl, dach), szer, wys)[T:]
        plotno = np.zeros(dom.shape, np.uint8)
        plotno[..., :3] = PAL["trawa"][2]
        plotno[..., 3] = 255
        a = dom[..., 3:4].astype(float) / 255.0
        plotno[..., :3] = (dom[..., :3] * a + plotno[..., :3] * (1 - a)).astype(np.uint8)
        obrazy.append((nazwa, plotno))

    szer_px = max(o.shape[1] for _n, o in obrazy)
    wys_px = sum(o.shape[0] for _n, o in obrazy) + 16 * (len(obrazy) - 1)
    plot = np.zeros((wys_px, szer_px, 3), np.uint8)
    plot[:] = (40, 44, 38)
    y = 0
    for _n, o in obrazy:
        plot[y:y + o.shape[0], :o.shape[1]] = o[..., :3]
        y += o.shape[0] + 16
    obraz = Image.fromarray(plot)
    obraz = obraz.resize((obraz.width * skala, obraz.height * skala), Image.NEAREST)
    obraz.save(sciezka)
    print("-> %s  (od gory: %s)" % (sciezka, ", ".join(WZORY_ZLOZONE)))


# ── ZAPIS ───────────────────────────────────────────────────────────────────

def main(zapisz, podglad=None, podglad_zlozone=None):
    kafle = zbuduj_kafle()
    print("KOMPLET MODULOWY — bale/deski, strzecha kalenicowa i szczytowa (/\\)")
    for (n, i), (k, w, _px) in sorted(kafle.items(), key=lambda kv: (kv[1][1], kv[1][0])):
        print("  %-14s kolumna %2d, wiersz %d, id %3d" % ("%s/%d" % (n, i), k, w, id_kafla(k, w)))
    wierszy = weryfikuj(kafle)

    if podglad:
        render_wsi(kafle, podglad)
    if podglad_zlozone:
        render_zlozonych(kafle, podglad_zlozone)

    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return

    sciezka_png = os.path.join(ASSETS, "Buildings.png")
    sciezka_json = os.path.join(DOCS, "budynki.json")

    # ── PRZENIES KAFLE DOKLEJONE Z ZEWNATRZ ────────────────────────────────
    #
    # ⚠ `zbuduj_kafle()` NIE jest pelna lista kafli arkusza. `build_lawka.py`
    # i `build_barrel.py` dopisuja swoje kafle prosto do PNG-a i do
    # `budynki.json`, z pominieciem tej funkcji. Bez tego bloku `--zapisz`
    # odtwarzal arkusz wylacznie z `kafle` i **kasowal je** — a `lawka_l`/
    # `lawka_p`/`barrel_0` stoja na mapie wsi (po 3 uzycia kazdy), wiec
    # zniknelyby z gry, zamieniajac sie w puste kafle. Nic w raporcie by tego
    # nie pokazalo: testy [1]-[11] ogladaja tylko to, co ta funkcja wyprodukuje.
    #
    # Rozpoznanie idzie po NAZWIE, nie po komorce: kafel, ktory sami
    # generujemy, wolno przesunac (jego stara komorka ma wtedy zostac pusta),
    # ale kafel, ktorego nie znamy z nazwy, jest cudzy i przepisujemy go
    # piksel w piksel z poprzedniego arkusza.
    nasze = {"%s_%d" % (n, i) for (n, i) in kafle}
    moje_komorki = {(k, w) for (k, w, _px) in kafle.values()}
    obce = {}
    if os.path.isfile(sciezka_png) and os.path.isfile(sciezka_json):
        stary_json = json.load(open(sciezka_json, encoding="utf-8"))
        stary_png = np.array(Image.open(sciezka_png).convert("RGBA"))
        for nazwa, v in stary_json.get("kafle", {}).items():
            if nazwa in nasze:
                continue
            k, w = v["kolumna"], v["wiersz"]
            if (k, w) in moje_komorki:
                raise SystemExit(
                    "STOP: kafel '%s' (kolumna %d, wiersz %d, id %d) zostal "
                    "doklejony z zewnatrz, a `zbuduj_kafle` chce teraz tej samej "
                    "komorki. NIC nie zapisano — przenies nowy kafel na wolna "
                    "komorke." % (nazwa, k, w, v["id"]))
            y0, x0 = w * PITCH, k * PITCH
            if y0 + T <= stary_png.shape[0] and x0 + T <= stary_png.shape[1]:
                obce[nazwa] = (k, w, stary_png[y0:y0 + T, x0:x0 + T].copy())

    wierszy = max([wierszy] + [w + 1 for (_k, w, _px) in obce.values()])

    ark = np.zeros((wierszy * PITCH - 1, COLS * PITCH - 1 + 14, 4), np.uint8)
    for (_n, _i), (k, w, kafel) in kafle.items():
        ark[w * PITCH:w * PITCH + T, k * PITCH:k * PITCH + T] = kafel
    for nazwa, (k, w, kafel) in obce.items():
        ark[w * PITCH:w * PITCH + T, k * PITCH:k * PITCH + T] = kafel
    Image.fromarray(ark).save(sciezka_png)
    print("\n-> public/assets/Buildings.png %dx%d (%d wierszy, %d kolumn)"
          % (ark.shape[1], ark.shape[0], wierszy, COLS))
    if obce:
        print("   przeniesiono %d kafli doklejonych z zewnatrz: %s"
              % (len(obce), ", ".join(sorted(obce))))

    katalog = {"%s_%d" % (n, i): {"kolumna": k, "wiersz": w, "id": id_kafla(k, w)}
               for (n, i), (k, w, _px) in kafle.items()}
    for nazwa, (k, w, _px) in obce.items():
        katalog[nazwa] = {"kolumna": k, "wiersz": w, "id": id_kafla(k, w)}
    with open(os.path.join(DOCS, "budynki.json"), "w", encoding="utf-8") as f:
        json.dump({"arkusz": {"kolumny": COLS, "wierszy": wierszy,
                              "szerokosc": ark.shape[1], "wysokosc": ark.shape[0],
                              "kafli": wierszy * COLS},
                   "kafle": katalog}, f, indent=1, ensure_ascii=False)
    print("-> docs/budynki.json  (katalog kafli + wymiary arkusza)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Modulowy tileset budynkow. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true", help="nadpisz Buildings.png")
    ap.add_argument("--podglad", metavar="PLIK.png",
                    help="zloz wszystkie wzory budynkow i zapisz podglad "
                         "(NIE do public/assets — to plik roboczy)")
    ap.add_argument("--podglad-zlozone", metavar="PLIK.png", dest="podglad_zlozone",
                    help="zloz rzuty L / T / U i zapisz podglad "
                         "(NIE do public/assets — to plik roboczy)")
    a = ap.parse_args()
    main(a.zapisz, a.podglad, a.podglad_zlozone)

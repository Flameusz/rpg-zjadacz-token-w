"""
Generator drzew slowianskiego lasu — dab, swierk, brzoza.

Uruchom:  python tools/build_drzewa.py            (podglad + weryfikacja, NIC nie pisze)
          python tools/build_drzewa.py --zapisz   (wkleja drzewa do Nature.png)

Zadanie i warunki zaliczenia: docs/ZADANIE_drzewa.md
Zasady graficzne i paleta:     docs/ART_DIRECTION.md

── POCHODZENIE ─────────────────────────────────────────────────────────────

Ksztalty sa RYSOWANE TUTAJ, od zera, proceduralnie. Plik
`public/assets/height32_trees_mega_pack.png` sluzyl wylacznie jako REFERENCJA
sylwetek i ukladu mas — zaden piksel ani zaden obrys stamtad nie zostal
przeniesiony. To swiadoma decyzja, podjeta po pomiarze:

  drzewa w tamtym pakiecie maja mediane 23x30 px (nazwa "height32" jest
  doslowna), czyli mniej niz nasz kafel i o polowe mniej niz gracz (31x60).
  Mediana 0,88 unikalnego koloru na piksel kryjacy — to pomniejszony render,
  nie pixel art; nasze arkusze maja 0,003. Konwersja probna: z czterech drzew
  jedno wyszlo dobrze, jedno stracilo swoja ciemnosc, dwa rozsypaly sie
  w konfetti. Powtarzalnych, ostrych sylwetek jest tam ok. 17%.

Dlatego generator, a nie konwerter. Skutek uboczny: wynik nie jest praca
pochodna, wiec licencja tamtego pakietu (nieustalona) nas nie wiaze.

── DLACZEGO SKRYPT, A NIE MALOWANIE RECZNE ─────────────────────────────────

Bo wariant to zmiana ziarna, a zmiana palety projektu przemalowuje wszystkie
drzewa naraz. Ta sama zasada, co przy kepkach trawy trzymanych jako maski
stopni rampy (patrz public/assets/README.md) — tyle ze tu zrodlem ksztaltu
jest kod, wiec maski nie trzeba trzymac osobno.

Skrypt NIE nadpisuje arkusza domyslnie — arkusz jest artefaktem, reczna
poprawka piksela musi przezyc nastepne uruchomienie.
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

# Swiatlo: gora, lekko z lewej (ART_DIRECTION 4.3, zgodne z Character.png).
# Wektor wskazuje NA zrodlo, wiec piksel po stronie (-0.35, -1) jest oswietlony.
SWIATLO = np.array([-0.35, -1.0])
SWIATLO = SWIATLO / np.linalg.norm(SWIATLO)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()

_CIEMNIEJ = {}
for _r, _k in PAL.items():
    for _i, _c in enumerate(_k):
        _CIEMNIEJ[_c] = _k[max(0, _i - 1)]


def jasnosc(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


JASNOSC_TRAWY = jasnosc(PAL["trawa"][2])   # 115 — podloze, wobec ktorego liczy sie kontrast


# ── prymitywy ───────────────────────────────────────────────────────────────

def plotno(w, h):
    return np.zeros((h, w, 4), np.uint8)


def maluj(px, maska, kolor):
    px[maska, :3] = kolor
    px[maska, 3] = 255


def stopnie_na_kolory(px, maska, pole, rampa, zakres=(0, 4), krzywa=1.0):
    """Pole ciagle -> stopnie rampy. Progi liczone dla CALEGO obiektu.

    Per kafel bylby to blad merytoryczny, nie optymalizacja: kazdy kafel
    z wlasnym kontrastem daje korone rozpadajaca sie na latki na granicach
    kafli (ten sam blad zepsul wczesniej kepki trawy).

    `krzywa` < 1 przesuwa mase pikseli w JASNE stopnie, nie zmieniajac zakresu.
    Potrzebne tam, gdzie gatunek ma byc jasny, a geometria dokłada duzo masy po
    stronie cienia: kotwica korony brzozy siedzi u nasady, czyli w cieniu,
    i przy rownomiernym podziale przeciagala dominujacy kolor na stopien 2
    (jasnosc 123 wobec 115 trawy — drzewo zaczynalo znikac). Zwezenie zakresu
    do (3,4) zabraloby stopien cieniowania; krzywa zostawia wszystkie trzy
    i tylko zmienia, ile pikseli dostaje ktory.
    """
    R = PAL[rampa]
    a, b = zakres
    n = b - a + 1
    v = pole[maska]
    if len(v) == 0:
        return
    lo, hi = v.min(), v.max()
    if hi - lo < 1e-9:
        hi = lo + 1e-9
    t = ((v - lo) / (hi - lo)) ** krzywa
    idx = np.clip((t * n).astype(int), 0, n - 1) + a
    ys, xs = np.nonzero(maska)
    for y, x, i in zip(ys, xs, idx):
        px[y, x, :3] = R[i]
        px[y, x, 3] = 255


def krawedz(maska):
    return maska & ~(np.roll(maska, 1, 0) & np.roll(maska, -1, 0)
                     & np.roll(maska, 1, 1) & np.roll(maska, -1, 1))


def przyciemnij_krawedz(px, maska):
    """Krawedz o stopien ciemniejsza wlasnej rampy — NIE czarny obrys.

    Czarna obwodka wprowadzilaby styl, ktorego nie ma w zadnym istniejacym
    arkuszu (zmierzone: 41-44% ciemnych pikseli brzegowych = brak konturu).
    """
    k = krawedz(maska)
    ys, xs = np.nonzero(k)
    for y, x in zip(ys, xs):
        c = tuple(px[y, x, :3])
        if c in _CIEMNIEJ:
            px[y, x, :3] = _CIEMNIEJ[c]


def cien_kontaktowy(px, cx, cy, rw, rh=3.0, kolor=None, alfa=110):
    """Owal pod pniem. Bez niego drzewo wisi w powietrzu (ART_DIRECTION 4.3).

    Rysowany TYLKO tam, gdzie alfa jest zerowa — cien nie moze wgryzac sie
    w sprite, bo wtedy przestaje byc cieniem rzucanym, a staje sie plama
    wtopiona w pien.
    """
    kolor = kolor or PAL["neutralne"][0]
    h, w = px.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    ell = ((xx + 0.5 - cx) / rw) ** 2 + ((yy + 0.5 - cy) / rh) ** 2 <= 1.0
    m = ell & (px[:, :, 3] == 0)
    px[m, :3] = kolor
    px[m, 3] = alfa


def sprzataj(px, min_px=6):
    """Kasuje z gotowego sprite'a odczepione skrawki mniejsze niz min_px.

    Ostatnia siatka bezpieczenstwa, zakladana PO zlozeniu calego drzewa.
    `poszarp` czysci pojedyncza maske, ale sierota potrafi powstac miedzy
    maskami: w brzozie zostal jeden piksel galazki wystajacy nad korone,
    bo chowanie galezi patrzy tylko na to, co jest WEWNATRZ korony.
    Jeden piksel przy zoom 2 to wyrazna kropka obok drzewa.
    """
    m = px[:, :, 3] == 255
    czyste = usun_wysepki(m, min_px)
    px[m & ~czyste] = 0


def pien(px, maska_out, x_srodek, y_gora, y_dol, szer_gora, szer_dol,
         rampa="kora", wygiecie=0.0, korzenie=0, maluj_teraz=True):
    """Pien z rozszerzeniem u nasady.

    `maluj_teraz=False` zwraca (maska, pole) i NIC nie maluje — wtedy wolajacy
    scala pole pnia z polem konarow i mapuje je na rampe JEDNYM wywolaniem.
    Patrz komentarz przy dab(): osobne mapowanie kazdej czesci to widoczny szew.
    """
    h, w = px.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip((yy - y_gora) / max(y_dol - y_gora, 1), 0, 1)
    # profil: wykladniczy, zeby nabieg korzeniowy siedzial przy samej ziemi.
    # Wykladnik 2.0 zamiast 2.6 — przy 2.6 rozszerzenie miescilo sie w ostatnich
    # trzech pikselach i przy zoom 2 bylo niewidoczne, wiec pien czytal sie
    # jako slup wbity w ziemie zamiast jako drzewo z nabiegiem.
    pol = (szer_gora + (szer_dol - szer_gora) * t ** 2.0) / 2.0
    os_x = x_srodek + wygiecie * (1 - t) ** 2 * 10
    m = (np.abs(xx + 0.5 - os_x) <= pol) & (yy >= y_gora) & (yy <= y_dol)

    for i in range(korzenie):
        kat = -0.9 + 1.8 * i / max(korzenie - 1, 1)
        dl = 7 + 4 * (1 - abs(kat))
        for s in np.linspace(0, 1, 40):
            rx = os_x + np.sin(kat) * dl * s
            ry = y_dol - 6 + np.cos(kat) * 0 + 6 * s
            r = max(1.4, 3.0 * (1 - s))
            m |= (xx + 0.5 - rx) ** 2 + (yy + 0.5 - ry) ** 2 <= r * r
    m &= yy <= y_dol
    # cieniowanie: walec — jasny pas po stronie swiatla
    poz = (xx + 0.5 - os_x) / np.maximum(pol, 1)
    pole = -poz * 0.8
    maska_out |= m
    if not maluj_teraz:
        return m, pole
    stopnie_na_kolory(px, m, pole - t * 0.55, rampa, (0, 4))
    return m


def galaz(maska, x0, y0, x1, y1, r0, r1, pole=None):
    """Stozkowa galaz od (x0,y0) do (x1,y1).

    `pole` — opcjonalna tablica, do ktorej wpisujemy cieniowanie w tej samej
    skali, co pien: znormalizowane odsuniecie od osi wzgledem promienia, rzutowane
    na kierunek swiatla. Dzieki temu galaz i pien daja sie zmapowac na rampe
    RAZEM, jednym progowaniem — inaczej wychodza w dwoch tonacjach.
    """
    h, w = maska.shape
    yy, xx = np.mgrid[0:h, 0:w]

    # Cieniowanie WALCA liczy sie wzgledem OSI galezi, nie promieniowo od srodka
    # krazka. Wersja promieniowa dawala jasna plamke tylko przy koncu kazdego
    # krazka, a kolejne krazki ja zamazywaly — konary wychodzily w 55%
    # najciemniejszym stopniem i nadal nie pasowaly do pnia.
    #
    # `n` to normalna do osi. Jasnosc punktu walca ~ (odsuniecie od osi) x
    # (na ile ta normalna patrzy w swiatlo). Ten sam wzor daje dla pionowego
    # pnia dokladnie jego dotychczasowe cieniowanie, wiec obie czesci sa
    # oswietlone z tej samej strony i tak samo mocno.
    dx_, dy_ = x1 - x0, y1 - y0
    dl = max(np.hypot(dx_, dy_), 1e-6)
    nx, ny = -dy_ / dl, dx_ / dl
    ku_swiatlu = nx * SWIATLO[0] + ny * SWIATLO[1]

    for s in np.linspace(0, 1, 60):
        cx, cy = x0 + dx_ * s, y0 + dy_ * s
        r = r0 + (r1 - r0) * s
        krazek = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= r * r
        maska |= krazek
        if pole is not None:
            u = ((xx + 0.5 - cx) * nx + (yy + 0.5 - cy) * ny) / max(r, 1.0)
            v = u * ku_swiatlu * 2.4        # 2.4 zrownuje amplitude z pniem
            pole[krazek] = v[krazek]
    return maska


def plamka(xx, yy, sx, sy, rr, los):
    """Nieregularna plamka o promieniu ~rr. NIE kolo.

    KOLO ZRASTERYZOWANE NA SIATCE PIKSELI TO GWIAZDA, nie plamka. Warunek
    dx^2+dy^2 <= r^2 daje dla r=2 romb z czterema kolcami:

            ..#..
            .###.
            #####       <- to jest gwiazdka, nie kepa lisci
            .###.
            ..#..

    a dla r=3 i r=4 pojedynczy wystajacy piksel na kazdej z czterech osi.
    Rozsypane po koronie czytaly sie dokladnie jak gwiazdki — zglosil to autor
    projektu, patrzac na arkusz w edytorze. Liczby tego nie zlapaly, bo kazdy
    test dotyczyl koloru i sylwetki calego drzewa, a nie ksztaltu detalu.

    Lekarstwo: suma 2-3 przesunietych kol + wygryzienie czesci pikseli
    brzegowych. Zadna os symetrii nie przezywa, a obrys robi sie postrzepiony,
    czyli taki, jak powinno wygladac listowie.
    """
    rozrzut = max(1, int(round(rr * 0.35)))
    m = np.zeros(xx.shape, bool)
    for j in range(int(los.integers(2, 4))):
        ox = int(los.integers(-rozrzut, rozrzut + 1))
        oy = int(los.integers(-rozrzut, rozrzut + 1))
        rj = max(1.5, rr - (0.0 if j == 0 else rr * 0.28))
        m |= (xx - sx - ox) ** 2 + (yy - sy - oy) ** 2 <= rj * rj
    return poszarp(m, los, 0.35, 1)


def poszarp(maska, los, sila=0.3, przebiegi=2):
    """Wygryza losowe piksele brzegowe — obrys przestaje byc gladkim lukiem.

    Ta sama idea, co `szarpanie` w build_tilesets.py przy kompletach obszarowych.
    Tu jest konieczna z konkretnego powodu: korona debu powstaje z sumy elips,
    a wciecia u dolu z odjecia kol, wiec KAZDY odcinek jej obrysu jest idealnym
    lukiem okregu. Widac to od razu i czyta sie jako „ktos wyciol to cyrklem",
    nie jako listowie. Zglosil to autor projektu, patrzac na dolna krawedz
    korony — liczby znowu nie mialy jak tego zlapac.

    Wygryzamy TYLKO brzeg i tylko czesc, wiec sylwetka zostaje ta sama;
    zmienia sie faktura krawedzi.
    """
    m = maska.copy()
    for _ in range(przebiegi):
        brzeg = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0)
                      & np.roll(m, 1, 1) & np.roll(m, -1, 1))
        m &= ~(brzeg & (los.random(m.shape) < sila))
    # Sieroty: szarpanie potrafi odciac pojedynczy piksel od masy i zostaje on
    # wisiec w powietrzu obok korony. Przy zoom 2 to jest wyrazna kropka, ktora
    # niczego nie przedstawia. Kasujemy piksele majace mniej niz 2 sasiadow
    # w pionie/poziomie — jeden przebieg wystarcza, bo szarpanie zdejmuje
    # najwyzej dwie warstwy brzegu.
    sasiedzi = (np.roll(m, 1, 0).astype(np.uint8) + np.roll(m, -1, 0)
                + np.roll(m, 1, 1) + np.roll(m, -1, 1))
    return usun_wysepki(m & (sasiedzi >= 2), 10)


def _etykiety(maska):
    """Numeruje spojne czesci maski (sasiedztwo 4-kierunkowe). 0 = tlo."""
    lab = np.zeros(maska.shape, int)
    H, W = maska.shape
    nr = 0
    for y in range(H):
        for x in range(W):
            if not maska[y, x] or lab[y, x]:
                continue
            nr += 1
            stos = [(y, x)]
            lab[y, x] = nr
            while stos:
                cy, cx = stos.pop()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and maska[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = nr
                        stos.append((ny, nx))
    return lab


def usun_wysepki(maska, min_px=10):
    """Kasuje odczepione skrawki masy mniejsze niz min_px.

    Szarpanie potrafi odciac od korony kilkupikselowa wysepke, ktora wisi obok
    drzewa i nie przedstawia niczego. Sasiedztwo tego nie lapie, bo 4-pikselowa
    grudka ma poprawnych sasiadow — trzeba policzyc spojne czesci.
    """
    m = maska.copy()
    H, W = m.shape
    odw = np.zeros_like(m)
    for y in range(H):
        for x in range(W):
            if not m[y, x] or odw[y, x]:
                continue
            stos = [(y, x)]
            odw[y, x] = True
            czesc = []
            while stos:
                cy, cx = stos.pop()
                czesc.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not odw[ny, nx]:
                        odw[ny, nx] = True
                        stos.append((ny, nx))
            if len(czesc) < min_px:
                for cy, cx in czesc:
                    m[cy, cx] = False
    return m


def kepy(px, maska, los, ile, rampa, jasne=(3, 4), ciemne=(0, 1)):
    """Jasne skupiska na ciemniejszej masie — NIE gladki gradient.

    Gladki gradient na okragu to sygnatura KULI: pierwsza wersja krzaka
    wygladala jak arbuz. Listowie czyta sie jako kepy, dopiero one daja
    wrazenie liscia zamiast plastiku.
    """
    R = PAL[rampa]
    h, w = maska.shape
    yy, xx = np.mgrid[0:h, 0:w]
    ys, xs = np.nonzero(maska)
    if len(ys) == 0:
        return
    for _ in range(ile):
        i = int(los.integers(len(ys)))
        sy, sx = ys[i], xs[i]
        # promien 2-4, nie 1-3: kepy o promieniu 1 to pojedyncze piksele obcego
        # stopnia rampy rozsypane po koronie — czytaja sie jak odra, nie jak
        # skupisko lisci. Przy zoom 2 pojedynczy piksel i tak ginie.
        rr = int(los.integers(2, 5))
        pole = plamka(xx, yy, sx, sy, rr, los) & maska
        # o tym, czy kepa jest jasna, decyduje strona swiatla wzgledem masy
        cx, cy = xs.mean(), ys.mean()
        lit = (sx - cx) * SWIATLO[0] + (sy - cy) * SWIATLO[1] > 0
        para = jasne if lit else ciemne
        px[pole, :3] = R[int(los.integers(para[0], para[1] + 1))]
        px[pole, 3] = 255


# ── DAB SZYPULKOWY ──────────────────────────────────────────────────────────

# Ksztalty debu. Roznica ma wynikac z INNEJ SYLWETKI, nie z innego ziarna —
# przekrecenie ziarna daje ten sam ksztalt w innym rozsypie kep i weryfikacja
# slusznie uzna to za jedno drzewo (docs/ZADANIE_drzewa.md, warunek 2).
DAB_KSZTALTY = {
    # platow  promien    y korony  pien gora/dol  korzenie  faktura  rozwidlony
    "mlody":     dict(platow=3, prom=(0.20, 0.25), y_kor=0.38, pien=(0.10, 0.16),
                      korzenie=0, faktura=0, rozwidlony=False, luk=0.44,
                      y_rozw=0.50, pien_nad=0.0625),
    "dorosly":   dict(platow=6, prom=(0.167, 0.208), y_kor=0.41, pien=(0.125, 0.25),
                      korzenie=5, faktura=9, rozwidlony=False, luk=0.60,
                      y_rozw=0.50, pien_nad=0.0625),
    # Rozwidlenie NISKO (0,62 H) i pien URWANY na nim (`pien_nad` = 0).
    # Przy rozwidleniu w polowie wysokosci i pniu ciagnacym sie az pod korone
    # drzewo bylo w 58% jednym slupem, korona siedziala na nim jak daszek,
    # a cala robota wlozona w dwa konary byla schowana pod liscmi. Widlasty
    # dab ma POKAZAC widelec: pien konczy sie, a dalej ida dwa konary.
    "rozwidlony": dict(platow=8, prom=(0.135, 0.175), y_kor=0.42, pien=(0.10, 0.25),
                       korzenie=5, faktura=7, rozwidlony=True, luk=0.60,
                       y_rozw=0.62, pien_nad=0.0),
}


def dab(ziarno=1, kafli_x=3, kafli_y=3, rampa="korona", ksztalt="dorosly"):
    """Glowne drzewo puszczy: szeroka lobowana korona, masywny pien,
    widoczny nabieg korzeniowy, grube konary wychodzace spod korony.

    Korona zbudowana z NACHODZACYCH PLATOW, nie z jednej elipsy. Miedzy
    platami biegnie ciemna bruzda (druga najblizsza odleglosc Voronoi) —
    to ona sprawia, ze masa czyta sie jako kilka skupisk lisci, a nie jako
    jeden balon. Bez bruzd nawet poprawnie cieniowana korona wyglada jak
    zielony dyrzabel.

    WSZYSTKIE WYMIARY SA UlAMKAMI W i H, nie pikselami. Inaczej ten sam kod
    na plotnie 2x2 rysuje korone dobrana do 3x3 — czyli albo wychodzaca poza
    kafle, albo znaczek posrodku pustego pola.
    """
    W, H = kafli_x * T, kafli_y * T
    K_ = DAB_KSZTALTY[ksztalt]
    los = np.random.default_rng(ziarno * 977 + 11)
    px = plotno(W, H)
    yy, xx = np.mgrid[0:H, 0:W]
    cx = W / 2

    y_dol = H - max(3, int(H * 0.05))
    m_drewno = np.zeros((H, W), bool)

    # konary — rysowane PRZED korona, wystaja spod jej dolnej krawedzi
    konary = np.zeros((H, W), bool)
    y_rozw = H * K_["y_rozw"]
    if K_["rozwidlony"]:
        # DRUGI DUZY DAB: korona rozdzielona na dwie masy, pien widlasty.
        # To jest inna SYLWETKA, a nie ten sam ksztalt w innym kolorze —
        # dwa duze deby roznice sie wtedy tak, jak dab rozni sie od buka.
        # Konary STROME, nie poziome. Przy (-0.30, -0.30) galaz przecinala
        # przerwe miedzy dwiema masami korony i wystawala w niej jako urwany
        # poziomy patyk. Widlasty dab ma pokazywac DWA KONARY IDACE W GORE,
        # kazdy pod swoja korone.
        konary_lista = [(-0.20, -0.26, 0.064, 0.034), (0.20, -0.29, 0.064, 0.034),
                        (-0.10, -0.15, 0.044, 0.026), (0.10, -0.16, 0.044, 0.026)]
    else:
        konary_lista = [(-0.271, -0.167, 0.042, 0.019), (0.250, -0.198, 0.042, 0.019),
                        (-0.135, -0.260, 0.035, 0.016), (0.146, -0.250, 0.035, 0.016)]
    pole_k = np.zeros((H, W))
    for dx, dy, r0, r1 in konary_lista:
        galaz(konary, cx, y_rozw, cx + dx * W, y_rozw + dy * H, r0 * W, r1 * W,
              pole=pole_k)

    m_pien, pole_p = pien(px, m_drewno, cx, y_rozw - H * K_["pien_nad"], y_dol,
                          K_["pien"][0] * W, K_["pien"][1] * W,
                          korzenie=K_["korzenie"], maluj_teraz=False)
    m_drewno |= konary

    # ── CALE DREWNO MAPOWANE NA RAMPE JEDNYM PROGOWANIEM ──
    #
    # Konary i pien byly wczesniej dwoma osobnymi wywolaniami: konary na
    # zakresie (0,3), pien na (0,4), kazde normalizowane na WLASNYM minimum
    # i maksimum. Ten sam material wychodzil wiec w dwoch tonacjach, a na
    # granicy — dokladnie w rozwidleniu — siedzial poziomy szew. Autor
    # projektu opisal to jako „konar wyglada jak sklejony z dwoch grafik"
    # i to jest doslownie to, co sie dzialo.
    #
    # To ta sama pomylka, przed ktora ostrzega docs/ZADANIE_drzewa.md przy
    # kaflach („progi licz dla CALEGO obiektu, nie per kafel"), tylko popelniona
    # per CZESC zamiast per kafel. Jedna maska, jedno pole, jedno progowanie.
    drewno = konary | m_pien
    pole_d = np.where(m_pien, pole_p, pole_k)
    # Wspolna glebia: drewno ciemnieje ku ziemi, niezaleznie od czesci.
    # Wspolczynnik MALY (0,20). Przy 0,45 konary — bo sa wysoko — wychodzily
    # o dwa stopnie jasniejsze od pnia i czytaly sie jak inny material.
    # Kora pnia i kora konara to ta sama kora; roznicowac ma je krzywizna,
    # nie wysokosc.
    pole_d = pole_d - ((yy - (y_rozw + np.min(np.array([dy for _dx, dy, _a, _b in konary_lista])) * H))
                       / max(H, 1)) * 0.20
    stopnie_na_kolory(px, drewno, pole_d, "kora", (0, 4))
    # faktura kory: pionowe bruzdy. Bez nich pien jest gladkim walcem
    # w trzech stopniach rampy i przy tej szerokosci wyglada jak plastikowa
    # rura. Mlody dab jej NIE ma — mloda kora jest gladka, a bruzdy na pniu
    # szerokim na 3 piksele i tak nie mialyby gdzie sie zmiescic.
    K = PAL["kora"]
    for _ in range(K_["faktura"]):
        bx = int(cx + los.uniform(-0.135, 0.135) * W)
        by = int(los.integers(int(y_rozw - 4), max(int(y_dol - 6), int(y_rozw - 3))))
        dl = int(los.integers(max(2, int(H * 0.05)), max(3, int(H * 0.15))))
        seg = np.zeros((H, W), bool)
        seg[by:by + dl, bx:bx + 1] = True
        seg &= m_pien
        px[seg, :3] = K[0] if los.random() < 0.6 else K[3]

    # korona: platy na plaskim luku.
    # Geometria dobrana tak, zeby korona MIESCILA SIE w plotnie z zapasem —
    # patrz test [2] w weryfikuj(). Pierwsza wersja siegala y = -3 i korona
    # byla scieta plaska pozioma linia po gornej krawedzi kafla; na planszy
    # stykowej tego nie widac, na trawie widac natychmiast.
    r_kor_x, r_kor_y = W * 0.46, H * 0.30
    y_kor = H * K_["y_kor"]
    srodki = []
    n = K_["platow"]
    for i in range(n):
        if K_["rozwidlony"]:
            # dwie kepy platow, kazda na wlasnym konarze, z przerwa posrodku
            strona = -1 if i < n // 2 else 1
            j = i % max(n // 2, 1)
            a = np.pi * (0.15 + 0.70 * j / max(n // 2 - 1, 1))
            px_ = cx + strona * W * 0.21 - np.cos(a) * r_kor_x * 0.30
            py_ = y_kor - np.sin(a) * r_kor_y * 0.55 - (0.0 if strona < 0 else H * 0.04)
        else:
            a = np.pi * (0.10 + 0.80 * i / max(n - 1, 1))
            px_ = cx - np.cos(a) * r_kor_x * K_["luk"]
            py_ = y_kor - np.sin(a) * r_kor_y * 0.62
        r_ = los.uniform(*K_["prom"]) * W
        # Srodek plata OGRANICZONY tak, zeby plat zmiescil sie w plotnie.
        # Przy rozwidlonym debie dwie kepy platow rozjezdzaja sie na boki
        # i skrajny plat wychodzil poza lewa krawedz kafla. Dobieranie
        # rozstawu recznie dzialaloby do najblizszej zmiany promienia;
        # ograniczenie dziala zawsze — ta sama zasada, co przy szerokosci
        # stozka swierka.
        px_ = float(np.clip(px_ + los.uniform(-0.026, 0.026) * W, r_ + 2, W - r_ - 2))
        srodki.append((px_, py_ + los.uniform(-0.021, 0.021) * H, r_))
    if not K_["rozwidlony"]:
        srodki.append((cx + los.uniform(-0.042, 0.042) * W, y_kor + H * 0.083,
                       0.1875 * W))

    korona = np.zeros((H, W), bool)
    d = np.full((H, W, len(srodki)), 1e9)
    for i, (sx, sy, r) in enumerate(srodki):
        # 1.05, nie 1.22: przy 1.22 platy byly o piata splaszczone i cala
        # korona czytala sie jak kapelusz grzyba lezacy na pniu.
        dd = np.sqrt((xx + 0.5 - sx) ** 2 + ((yy + 0.5 - sy) * 1.05) ** 2)
        korona |= dd <= r
        d[:, :, i] = dd - r
    # Dolna krawedz korony wycieta wcieciami — spod niej wygladaja konary.
    # Bez tego korona ma plaski spod, siedzi na pniu jak kapelusz grzyba
    # i cala praca wlozona w konary jest niewidoczna.
    dolna_y = np.zeros(W)
    for x_ in range(W):
        k = np.nonzero(korona[:, x_])[0]
        dolna_y[x_] = k.max() if len(k) else 0
    for _ in range(max(3, int(9 * W / 96))):
        sx = int(los.integers(int(W * 0.10), int(W * 0.90)))
        rr = los.uniform(0.052, 0.104) * W
        korona &= ~plamka(xx, yy, sx, dolna_y[sx] + rr * 0.55, rr, los)

    # cala korona jeszcze raz, juz jako jeden obrys — zeby poszarpane bylo
    # rowniez to, co przyszlo z sumy elips, a nie tylko z odjecia wciec
    korona = poszarp(korona, los, 0.30, 2)

    ds = np.sort(d, axis=2)
    # BRUZDA tylko przy POWIERZCHNI korony, nie przez cala mase.
    # Pierwsza wersja liczyla ja wszedzie tam, gdzie dwa platy sa rownie
    # blisko — a to jest cala os symetrii miedzy nimi, wiec ciemne linie
    # biegly od obrysu do srodka i korona czytala sie jak szprychy parasola.
    # Warunek `ds0 > -7` przycina bruzde do zewnetrznego pierscienia, gdzie
    # platy realnie sie stykaja.
    # Szerokosc bruzdy chwieje sie per piksel. Bez tego bruzda biegnie dokladnie
    # po granicy Voronoi dwoch kol, czyli po LUKU OKREGU — i te ciemne, gladkie
    # luki byly drugim (po wcieciach) powodem, dla ktorego korona wygladala jak
    # wycieta cyrklem. Sylwetka jest juz poszarpana, wiec zostawienie gladkiego
    # rysunku wewnetrznego bylo niekonsekwencja.
    chwiej = los.normal(0.0, 0.8, (H, W))
    bruzda = ((ds[:, :, 1] - ds[:, :, 0]) < 1.1 + chwiej) & (ds[:, :, 0] > -0.073 * W)

    naj = np.argmin(d, axis=2)
    pole = np.zeros((H, W))
    for i, (sx, sy, r) in enumerate(srodki):
        m = naj == i
        pole[m] = (((xx - sx) * SWIATLO[0] + (yy - sy) * SWIATLO[1]) / r)[m]
    pole = pole * 0.78 - ((yy - (y_kor - r_kor_y)) / H) * 0.50   # + globalna glebia
    pole[bruzda & korona] -= 0.55                                 # zaglebienie, nie kreska

    # ciemne kepy tylko o STOPIEN-DWA nizej, nie o cztery. Przy ciemne=(0,1)
    # na jasnej masie ladowaly niemal czarne placki i korona czytala sie jak
    # moro, a nie jak bryla.
    # ZAKRES (1,4), nie (0,4). Przy pelnej rampie dominujacym stopniem korony
    # wychodzil korona[2] o jasnosci 123 wobec 115 trawy — 7,5 punktu roznicy,
    # czyli dab znikal na podlozu (test [4]). Korona ma byc jasniejsza od
    # trawy, wiec i jej srodek ciezkosci siedzi w gornej polowie rampy;
    # najciemniejszy stopien zostaje na bruzdy i krawedz.
    stopnie_na_kolory(px, korona, pole, rampa, (1, 4))
    # liczba kep skaluje sie z POWIERZCHNIA korony — stala 34 na plotnie 1x2
    # zasypalaby cala korone kepami i nie zostaloby nic z cieniowania
    kepy(px, korona, los, max(4, int(34 * W * H / (96 * 96))), rampa,
         jasne=(3, 4), ciemne=(1, 2))

    m_all = korona | m_drewno
    przyciemnij_krawedz(px, m_all)
    sprzataj(px)
    cien_kontaktowy(px, cx, y_dol + 1, 0.22 * W, max(2.0, 0.042 * H))
    return px


# ── SWIERK ──────────────────────────────────────────────────────────────────

SWIERK_KSZTALTY = {
    #             szerokosc stozka   od gory   do dolu   pieter/100px  pien
    "mlody":  dict(szer=0.42, y_szczyt=0.06, y_baza=0.86, pieter=5.5, pien=(0.09, 0.19)),
    "otwarty": dict(szer=0.46, y_szczyt=0.031, y_baza=0.865, pieter=6.3, pien=(0.078, 0.172)),
    # DRUGI DUZY SWIERK: wezszy, wyzszy, z GOLYM DOLEM PNIA i gestszymi
    # pietrami — swierk lesny, ktory walczyl o swiatlo, kontra swierk rosnacy
    # samotnie na polanie. Rozne sylwetki, nie rozne ziarno.
    "lesny":  dict(szer=0.35, y_szczyt=0.02, y_baza=0.76, pieter=8.5, pien=(0.070, 0.150)),
}


def swierk(ziarno=1, kafli_x=2, kafli_y=3, rampa="listowie", ksztalt="otwarty"):
    """Gesty ciemny las: stozkowata korona, pietra galezi, pionowa sylwetka.

    Rampa `listowie`, nie `korona` — SWIADOMIE, bo swierk ma byc ciemny.
    Sprawdzone liczbowo w weryfikuj(): dominujacy stopien ma jasnosc 88 wobec
    115 trawy, czyli 27 stopni RONICY. Drzewo sie odcina — tyle ze jako
    ciemniejsze od podloza, nie jasniejsze. To jest dopuszczalne, bo liczy sie
    kontrast jasnosci, nie jego znak; nie byloby dopuszczalne wyladowanie na
    jasnosci 113 (stopien 3 tej samej rampy), bo to jest trawa co do punktu.
    """
    W, H = kafli_x * T, kafli_y * T
    K_ = SWIERK_KSZTALTY[ksztalt]
    los = np.random.default_rng(ziarno * 613 + 7)
    px = plotno(W, H)
    yy, xx = np.mgrid[0:H, 0:W]
    cx = W / 2
    y_dol = H - max(3, int(H * 0.05))

    m_drewno = np.zeros((H, W), bool)
    pien(px, m_drewno, cx, H * 0.30, y_dol,
         K_["pien"][0] * W, K_["pien"][1] * W, korzenie=3)

    y_szczyt = H * K_["y_szczyt"]
    y_baza = H * K_["y_baza"]
    # liczba pieter proporcjonalna do WYSOKOSCI, nie stala. Szesc pieter na
    # plotnie 1x2 daje pietra po 8 px — schodki znikaja i zostaje trojkat.
    PIETER = max(3, int(round(K_["pieter"] * (y_baza - y_szczyt) / 93.0)))

    # SYLWETKA JEST JEDNYM STOZKIEM, pietra sa tylko modulacja jego szerokosci
    # i cieniowaniem. Pierwsza wersja skladala korone z osobnych trojkatow —
    # sasiednie pietra sie nie stykaly i drzewo czytalo sie jako stos rombow,
    # a nie jako swierk. Ciaglosc obrysu jest tu wazniejsza od pojedynczego
    # pietra, bo przy zoom 2 z szesciu kafli widac wylacznie obrys.
    t = np.clip((yy + 0.5 - y_szczyt) / (y_baza - y_szczyt), 0, 1)
    polszer_bazowa = W * 0.031 + (W * K_["szer"] - W * 0.031) * t ** 1.05
    kt = t * PIETER
    s_lok = kt - np.floor(kt)                      # 0 u gory pietra, 1 u dolu
    # pietro rozszerza sie ku dolowi i urywa na granicy — stad schodkowy obrys
    polszer = polszer_bazowa * (0.74 + 0.30 * s_lok)
    dx = xx + 0.5 - cx
    polszer = polszer * (1.0 + 0.07 * np.sin((yy + 0.5) * 2.3 + np.sign(dx) * 1.7))
    # TWARDE ograniczenie do plotna. Szerokosc stozka przechodzi przez trzy
    # mnozniki (profil pietra 1,04 i falowanie 1,07), wiec `szer` z tabeli
    # ksztaltow NIE jest koncowa polszerokoscia — 0,46 rozrasta sie do 0,512 W
    # i sredni swierk wychodzil prawa krawedzia kafla. Dobieranie `szer` pod
    # ten iloczyn dzialaloby do pierwszej zmiany falowania; ograniczenie
    # dziala zawsze i dla kazdego rozmiaru plotna.
    polszer = np.minimum(polszer, W / 2 - 1.5)
    igliwie = (np.abs(dx) <= polszer) & (yy + 0.5 >= y_szczyt) & (yy + 0.5 <= y_baza)

    # cieniowanie: swiatlo z lewej + kazde pietro ciemnieje ku swojemu dolowi
    # (to jest cien rzucany przez pietro wyzej — bez niego stozek jest plaski)
    pole = (-dx / np.maximum(polszer, 1)) * 0.50 + (1.0 - s_lok) * 0.60 - t * 0.30
    stopnie_na_kolory(px, igliwie, pole, rampa, (0, 4))
    # jasne=(2,3), nie (3,4). Na ciemnej rampie `listowie` stopien 4 (#809f5d)
    # jest o 60 punktow jasniejszy od masy swierka, wiec mala kepa czytala sie
    # jako swiecacy pylek — ten sam efekt, co gwiazdki, tylko z innego powodu.
    kepy(px, igliwie, los, max(4, int(34 * W * H / (64 * 96))), rampa,
         jasne=(2, 3), ciemne=(0, 1))

    m_all = igliwie | m_drewno
    przyciemnij_krawedz(px, m_all)
    sprzataj(px)
    cien_kontaktowy(px, cx, y_dol + 1, 0.1875 * W, max(2.0, 0.031 * H))
    return px


# ── BRZOZA ──────────────────────────────────────────────────────────────────

BRZOZA_KSZTALTY = {
    # Rozwidlenie NISKO (0,55 H), nie wysoko. Przy 0,42 na plotnie 1x2 wychodzil
    # dlugi bialy pret z guzikiem lisci na koncu — patyczek higieniczny, nie
    # sadzonka. Mloda brzoza ma krotki pien i korone od polowy wysokosci.
    "mloda":       dict(y_rozw=0.55, pien=(0.10, 0.17), wygiecie=-0.30, kreski=5,
                        kc=0.22, obw=(0.40, 0.26), platow=14, dziur=5,
                        rozrzut=0.16, dwupienna=False),
    "pojedyncza":  dict(y_rozw=0.48, pien=(0.094, 0.1875), wygiecie=-0.35, kreski=11,
                        kc=0.198, obw=(0.328, 0.26), platow=17, dziur=10,
                        rozrzut=0.156, dwupienna=False),
    # DRUGA DUZA BRZOZA: kepa dwupienna. Brzozy rosna kepami z jednej szyi
    # korzeniowej i to jest ich najbardziej rozpoznawalna sylwetka — bardziej
    # niz cokolwiek, co da sie uzyskac przestawiajac promienie korony.
    "kepa":        dict(y_rozw=0.46, pien=(0.085, 0.150), wygiecie=-0.55, kreski=9,
                        kc=0.185, obw=(0.44, 0.225), platow=20, dziur=11,
                        rozrzut=0.26, dwupienna=True),
}


def brzoza(ziarno=1, kafli_x=2, kafli_y=3, rampa="korona", ksztalt="pojedyncza"):
    """Jasny element krajobrazu: BIALY pien, delikatna azurowa korona.

    Dwie rzeczy robia tu gatunek, nie kolor:
      * pien z rampy `neutralne` (bialy) z poziomymi kreskami — jedyny bialy
        pien w zestawie, rozpoznawalny nawet gdy korona zejdzie z ekranu;
      * korona z ROZLACZNYCH kep na cienkich galazkach, nie z jednej masy.
        Dziury sa gatunkiem: brzoza ma sie przeswiecac.
    """
    W, H = kafli_x * T, kafli_y * T
    K_ = BRZOZA_KSZTALTY[ksztalt]
    los = np.random.default_rng(ziarno * 401 + 3)
    px = plotno(W, H)
    yy, xx = np.mgrid[0:H, 0:W]
    cx = W / 2 + 1
    y_dol = H - max(3, int(H * 0.05))

    m_drewno = np.zeros((H, W), bool)
    # galazki — cienkie, wachlarz do gory
    galazki = np.zeros((H, W), bool)
    y_rozw = H * K_["y_rozw"]
    # Wachlarz WASKI. Przy rozstawie +-22 px dolne galezie wystawaly poza
    # korone jako szary rogaty widelec — czytalo sie to jak antena, nie jak
    # drzewo. Zadna galaz nie moze konczyc sie poza obwiednia korony.
    wachlarz = [(-0.219, -0.271), (-0.125, -0.344), (-0.031, -0.396),
                (0.109, -0.365), (0.219, -0.281), (-0.156, -0.167),
                (0.156, -0.156), (-0.063, -0.208), (0.078, -0.229)]
    for dx, dy in wachlarz:
        galaz(galazki, cx, y_rozw, cx + dx * W, y_rozw + dy * H,
              max(1.2, 0.030 * W), max(1.0, 0.016 * W))
    maluj(px, galazki, PAL["neutralne"][3])
    m_drewno |= galazki

    # Wierzcholki pni policzone JAWNIE, bo trzeba ich potem do kotwicy korony.
    # `pien()` przesuwa os o `wygiecie * (1-t)^2 * 10`, a przy t=0 (czubek) to
    # jest pelne `wygiecie * 10` — pominiecie tego przesuniecia stawialoby
    # kotwice obok pnia, a nie na nim.
    if K_["dwupienna"]:
        wierzcholki_pni = [(cx - W * 0.045 + K_["wygiecie"] * 10, y_rozw - H * 0.04),
                           (cx + W * 0.050 - K_["wygiecie"] * 0.85 * 10, y_rozw - H * 0.09)]
    else:
        wierzcholki_pni = [(cx + K_["wygiecie"] * 10, y_rozw - H * 0.042)]

    if K_["dwupienna"]:
        # DWA PNIE Z JEDNEJ SZYI KORZENIOWEJ. Rozstaw u NASADY musi byc maly
        # (+-3 px), a rozchylenie robi dopiero wygiecie ku gorze — przy dwoch
        # rownoleglych pniach oddalonych o 15 px czytalo sie to jak para nog,
        # a nie jak kepa wyrosla z jednego korzenia.
        m_pien = pien(px, m_drewno, cx - W * 0.045, y_rozw - H * 0.04, y_dol,
                      K_["pien"][0] * W, K_["pien"][1] * W,
                      rampa="neutralne", wygiecie=K_["wygiecie"], korzenie=2)
        m_pien = m_pien | pien(px, m_drewno, cx + W * 0.050, y_rozw - H * 0.09, y_dol,
                               K_["pien"][0] * W * 0.85, K_["pien"][1] * W * 0.8,
                               rampa="neutralne", wygiecie=-K_["wygiecie"] * 0.85,
                               korzenie=2)
    else:
        m_pien = pien(px, m_drewno, cx, y_rozw - H * 0.042, y_dol,
                      K_["pien"][0] * W, K_["pien"][1] * W,
                      rampa="neutralne", wygiecie=K_["wygiecie"], korzenie=3)
    # przesuniecie pnia w gore rampy: brzoza ma byc BIALA, nie szara.
    # neutralne[2..5] zamiast [0..4] — stopien 5 (#e6e4e0) to jedyna prawdziwa
    # biel w palecie i bez niej pien czyta sie jak kamien.
    N = PAL["neutralne"]
    podmiana = {N[0]: N[3], N[1]: N[3], N[2]: N[4], N[3]: N[5], N[4]: N[5]}
    ys, xs = np.nonzero(m_pien)
    for y, x in zip(ys, xs):
        c = tuple(px[y, x, :3])
        if c in podmiana:
            px[y, x, :3] = podmiana[c]
    # charakterystyczne poziome kreski
    for _ in range(K_["kreski"]):
        y = int(los.integers(int(y_rozw - 2), max(y_dol - 2, int(y_rozw))))
        kol = np.nonzero(m_pien[y])[0]
        if len(kol) < 4:
            continue
        x0 = int(los.integers(kol.min(), max(kol.max() - 1, kol.min() + 1)))
        dl = int(los.integers(2, 5))
        seg = np.zeros((H, W), bool)
        seg[y, x0:x0 + dl] = True
        maluj(px, seg & m_pien, N[1])

    # KORONA JAKO WASKA ELIPSA OSADZONA NA PNIU, nie jako rozrzut kep wokol
    # galazek. Rozrzut szedl za wachlarzem galezi, ktory jest niesymetryczny,
    # wiec masa dryfowala w bok i odklejala sie od pnia — czytalo sie to jak
    # zielona chmura obok bialego slupa. Elipsa gwarantuje, ze korona siedzi
    # tam, gdzie konczy sie pien; guzowatosc daja dopiero kepy na niej.
    gy, gx = np.nonzero(galazki)
    gora = gy < y_rozw - 2
    gy, gx = gy[gora], gx[gora]
    kc_y = y_rozw - H * K_["kc"]
    korona = np.zeros((H, W), bool)
    for _ in range(K_["platow"]):
        sx = cx + los.uniform(-K_["rozrzut"], K_["rozrzut"]) * W
        sy = kc_y + los.uniform(-0.146, 0.115) * H
        rr = los.uniform(0.133, 0.203) * W
        korona |= (xx + 0.5 - sx) ** 2 + ((yy + 0.5 - sy) * 1.06) ** 2 <= rr * rr
    # obwiednia gatunku: smukla, wyzsza niz szersza, z zapasem do krawedzi
    obwiednia = ((((xx + 0.5 - cx) / (K_["obw"][0] * W)) ** 2
                  + ((yy + 0.5 - kc_y) / (K_["obw"][1] * H)) ** 2) <= 1.0)
    korona &= obwiednia
    korona &= yy < y_rozw + H * 0.06

    # ── KOTWICA: obowiazkowy plat lisci nad wierzcholkiem KAZDEGO pnia ──
    #
    # Bez tego korona i pien nie musialy sie stykac. Platy sa losowe, a pien
    # konczy sie w konkretnym miejscu — na plotnie 1x2 wyszly DWA PIKSELE
    # CZYSTEJ TRAWY miedzy bialym pniem a zielona masa i drzewo rozpadlo sie
    # na dwa obiekty. Zglosil to autor projektu; zmierzone potem: 0 pikseli
    # stycznych zielen/drewno.
    #
    # Kotwica jest doklejana DWA RAZY: przed wycinaniem dziur (zeby weszla do
    # `korona_pelna` i zaslonila wierzcholek pnia) oraz po szarpaniu (zeby
    # ani dziura, ani erozja brzegu nie mogly jej zjesc). Rysowana przez
    # plamka(), wiec mimo ze jest wymuszona, nie wyglada jak doklejone kolo.
    # Promien kotwicy skalowany do SZEROKOSCI PNIA, nie do plotna. Przy
    # 0,17 W kotwica malej brzozy zajmowala ok. 40% korony i przeciagnela
    # dominujacy kolor na ciemny stopien rampy (jasnosc 123 wobec 115 trawy —
    # drzewo zaczelo znikac na podlozu, test [4]). Kotwica ma ZAKRYC CZUBEK
    # PNIA, a nie zastapic korone.
    # Kotwica jest PIONOWA KAPSULA, nie kolem. Kolo ma waski dolny brzeg, wiec
    # korona dotykala pnia stycznie, na 2-3 pikselach — formalnie styk, wizualnie
    # nadal odklejona korona. Kapsula obejmuje czubek pnia z gory i z dolu,
    # wiec pien wchodzi w mase lisci i wychodzi z niej bokami.
    promien_kotwicy = max(3.5, K_["pien"][0] * W / 2 + 2.5)
    kotwica = np.zeros((H, W), bool)
    for tx, ty in wierzcholki_pni:
        for dy in (-H * 0.045, 0.0, H * 0.035):
            kotwica |= plamka(xx, yy, int(tx), int(ty + dy), promien_kotwicy, los)
    korona |= kotwica

    korona_pelna = korona.copy()

    # dziury — brzoza ma sie przeswiecac, to jest cecha gatunku, nie brak masy
    # plamka(), nie kolo — inaczej dziury sa idealnymi kolkami rozsypanymi
    # po koronie i czytaja sie jak dziurkacz, a nie jak przeswit miedzy liscmi
    # 10, nie 16: po przejsciu na nieregularne plamki kazda dziura jest
    # postrzepiona, wiec ta sama liczba daje juz nie „azurowa", tylko
    # „zjedzona przez mole" korone.
    for _ in range(K_["dziur"]):
        sx = int(cx + los.uniform(-0.234, 0.234) * W)
        sy = int(kc_y + los.uniform(-0.208, 0.167) * H)
        korona &= ~plamka(xx, yy, sx, sy, los.uniform(0.028, 0.047) * W, los)
    korona = poszarp(korona, los, 0.28, 2) | kotwica

    # DZIURA MA POKAZYWAC TRAWE, NIE GALAZ. Galazki byly rysowane przed korona
    # i przeswitywaly dokladnie przez wyciete dziury — korona czytala sie jak
    # garsc szarych kamyci wsypanych w zielen. Kasujemy galaz wszedzie, gdzie
    # siega masa korony; zostaja tylko konce przy rozwidleniu, i to one czytaja
    # sie jako galazki.
    # Bez ograniczenia na y: przy `yy < y_rozw - 5` przezywal pasek galezi
    # tuz nad rozwidleniem i tworzyl szary KOLNIERZ miedzy pniem a korona.
    # Dotyczy tez WIERZCHOLKA PNIA, nie tylko galazek. Przy kepie dwupiennej
    # oba pnie koncza sie wewnatrz masy korony, wiec przez jej dziury bily
    # szare placki — ten sam objaw, co wczesniej z galezmi, tylko grubszy.
    #
    # Chowamy wzgledem OBWIEDNI gatunku, nie wzgledem tego, gdzie akurat
    # wypadly platy. Platy sa losowe: kawalek pnia potrafi wypasc w luce miedzy
    # nimi, a wtedy warunek „wewnatrz korony" go nie lapie i szary placek
    # zostaje. Obwiednia jest deterministyczna i to ona wyznacza, gdzie
    # drzewo ma byc liscmi.
    # Galazki chowamy wzgledem OBWIEDNI (sa cienka dekoracja, mozna je skasowac
    # w calosci), ale PIEN tylko tam, gdzie korona realnie go zaslania. Pien
    # jest konstrukcja: skasowany „na zapas" pod obwiednia, w ktorej akurat nie
    # wypadl zaden plat, zostawia dziure miedzy pniem a korona — i to wlasnie
    # zerwalo styk u malej brzozy.
    #
    # Pien kasujemy TYLKO tam, gdzie WYSTAJE NIEPRZYKRYTY: wewnatrz obwiedni
    # gatunku, ale poza masa korony. To jest dokladnie ten przypadek, ktory
    # dawal szare placki. Pnia POD korona nie ruszamy — korona i tak maluje
    # sie na nim, a obie masy wtedy wchodza w siebie i styk jest z definicji.
    # Kasowanie pnia pod korona zostawialo je stykajace sie wzdluz jednej
    # ragged krawedzi i styk spadal do 3 pikseli.
    schowane = ((galazki & obwiednia)
                | (m_pien & (yy < y_rozw - H * 0.06) & obwiednia & ~korona_pelna))
    px[schowane] = 0
    m_drewno &= ~schowane

    # ZAKRES (2,4), nie (1,4): przy (1,4) dominujacym kolorem wychodzil
    # korona[2] o jasnosci 123 wobec 115 trawy — roznica 7,5 punktu, czyli
    # brzoza znikala na podlozu. Gatunek ma byc JASNY, wiec i korona siedzi
    # w gornej polowie rampy; teraz dominuje stopien 3 (jasnosc 160).
    pole = ((xx - cx) * SWIATLO[0]
            + (yy - (y_rozw - H * 0.271)) * SWIATLO[1]) / (H * 0.271)
    stopnie_na_kolory(px, korona, pole, rampa, (2, 4), krzywa=0.62)
    kepy(px, korona, los, max(4, int(30 * W * H / (64 * 96))), rampa,
         jasne=(3, 4), ciemne=(2, 3))

    przyciemnij_krawedz(px, korona)
    sprzataj(px)
    cien_kontaktowy(px, cx, y_dol + 1, 0.172 * W, max(2.0, 0.031 * H))
    return px


# ── wspolna masa platowa (buk, grab) ────────────────────────────────────────

def masa_z_platow(xx, yy, srodki, splaszczenie=1.05):
    """Suma nachodzacych platow + odleglosci do kazdego z nich.

    Dab ma wlasna kopie tego kodu i celowo jej nie ruszam — jest dostrojony
    i zatwierdzony. Tu chodzi o to, zeby buk i grab nie byly TRZECIA kopia.
    """
    maska = np.zeros(xx.shape, bool)
    d = np.full(xx.shape + (len(srodki),), 1e9)
    for i, (sx, sy, r) in enumerate(srodki):
        dd = np.sqrt((xx + 0.5 - sx) ** 2 + ((yy + 0.5 - sy) * splaszczenie) ** 2)
        maska |= dd <= r
        d[:, :, i] = dd - r
    return maska, d


def kotwica_korony(xx, yy, H, wierzcholki, szer_pnia, los):
    """Pionowa kapsula lisci nad wierzcholkiem pnia.

    Gwarantuje, ze korona DOTYKA drewna — patrz test [6] w weryfikuj() i opis
    w public/assets/README.md. Kapsula, nie kolo: kolo ma waski dolny brzeg
    i korona dotykala pnia stycznie, na 2-3 pikselach.
    """
    r = max(3.5, szer_pnia / 2 + 2.5)
    m = np.zeros(xx.shape, bool)
    for tx, ty in wierzcholki:
        for dy in (-H * 0.045, 0.0, H * 0.035):
            m |= plamka(xx, yy, int(tx), int(ty + dy), r, los)
    return m


def cieniuj_korone(px, korona, d, srodki, xx, yy, W, H, y_gora_korony,
                   rampa, zakres, los, sila_bruzdy=0.55, krzywa=1.0):
    """Oswietlenie platowej korony: kazdy plat ma wlasne swiatlo od gory
    z lewej, a miedzy platami biegnie bruzda o chwiejnej szerokosci."""
    ds = np.sort(d, axis=2)
    chwiej = los.normal(0.0, 0.8, (H, W))
    bruzda = ((ds[:, :, 1] - ds[:, :, 0]) < 1.1 + chwiej) & (ds[:, :, 0] > -0.073 * W)
    naj = np.argmin(d, axis=2)
    pole = np.zeros((H, W))
    for i, (sx, sy, r) in enumerate(srodki):
        m = naj == i
        pole[m] = (((xx - sx) * SWIATLO[0] + (yy - sy) * SWIATLO[1]) / r)[m]
    pole = pole * 0.78 - ((yy - y_gora_korony) / H) * 0.50
    pole[bruzda & korona] -= sila_bruzdy
    stopnie_na_kolory(px, korona, pole, rampa, zakres, krzywa)


# ── BUK — gladki jasny pien, wysoka kopulasta korona ────────────────────────

BUK_KSZTALTY = {
    "mlody":   dict(platow=5, prom=(0.20, 0.25), y_rozw=0.56, pien=(0.12, 0.19),
                    korona=(0.40, 0.30), korzenie=0),
    "dorosly": dict(platow=8, prom=(0.155, 0.195), y_rozw=0.62, pien=(0.085, 0.165),
                    korona=(0.44, 0.34), korzenie=3),
    "stary":   dict(platow=10, prom=(0.135, 0.175), y_rozw=0.60, pien=(0.095, 0.20),
                    korona=(0.46, 0.36), korzenie=4),
}


def buk(ziarno=1, kafli_x=2, kafli_y=2, rampa="korona", ksztalt="dorosly"):
    """Stary las lisciasty. Trzy cechy robia tu gatunek, nie kolor:

      * PIEN GLADKI I JASNY — zadnej faktury kory, zakres rampy przesuniety
        w gore (2,4). To jest jedyna rzecz, ktora odroznia buka od debu, gdy
        korona zejdzie z ekranu: dab ma ciemna, bruzdowana kore, buk srebrzysta
        i gladka;
      * korona WYZSZA NIZ SZERSZA i gladko obrysowana — dab jest rozlozysty
        i poszarpany wcieciami, buk kopulasty;
      * ROZGALEZIENIE WYSOKO (0,62 H) — buk w zwarciu ciagnie sie do gory.
    """
    W, H = kafli_x * T, kafli_y * T
    K_ = BUK_KSZTALTY[ksztalt]
    los = np.random.default_rng(ziarno * 733 + 19)
    px = plotno(W, H)
    yy, xx = np.mgrid[0:H, 0:W]
    cx = W / 2
    y_dol = H - max(3, int(H * 0.05))
    y_rozw = H * K_["y_rozw"]
    m_drewno = np.zeros((H, W), bool)

    konary = np.zeros((H, W), bool)
    pole_k = np.zeros((H, W))
    for dx, dy, r0, r1 in [(-0.17, -0.26, 0.030, 0.016), (0.17, -0.28, 0.030, 0.016),
                           (-0.07, -0.33, 0.024, 0.013), (0.08, -0.31, 0.024, 0.013)]:
        galaz(konary, cx, y_rozw, cx + dx * W, y_rozw + dy * H,
              max(1.3, r0 * W), max(1.0, r1 * W), pole=pole_k)

    m_pien, pole_p = pien(px, m_drewno, cx, y_rozw - H * 0.04, y_dol,
                          K_["pien"][0] * W, K_["pien"][1] * W,
                          korzenie=K_["korzenie"], maluj_teraz=False)
    m_drewno |= konary
    drewno = konary | m_pien
    pole_d = np.where(m_pien, pole_p, pole_k) - ((yy - y_rozw * 0.3) / max(H, 1)) * 0.20
    # ZAKRES (2,4), nie (0,4) — gladka, jasna kora. Przy pelnej rampie buk
    # dostawal te sama ciemna kore co dab i po sylwetce pnia nie dalo sie ich
    # rozroznic.
    stopnie_na_kolory(px, drewno, pole_d, "kora", (2, 4))

    # korona: platy na PIONOWEJ elipsie
    kx_, ky_ = K_["korona"]
    kc_y = y_rozw - H * ky_ * 0.62
    srodki = []
    for i in range(K_["platow"]):
        a = 2 * np.pi * i / K_["platow"]
        r_ = los.uniform(*K_["prom"]) * W
        sx = cx + np.cos(a) * kx_ * W * 0.42 + los.uniform(-0.02, 0.02) * W
        sy = kc_y + np.sin(a) * ky_ * H * 0.40 + los.uniform(-0.02, 0.02) * H
        srodki.append((float(np.clip(sx, r_ + 2, W - r_ - 2)), sy, r_))
    srodki.append((cx, kc_y, K_["prom"][1] * W))

    korona, d = masa_z_platow(xx, yy, srodki, 1.02)
    korona &= (((xx + 0.5 - cx) / (kx_ * W)) ** 2
               + ((yy + 0.5 - kc_y) / (ky_ * H)) ** 2) <= 1.0
    korona &= yy < y_rozw + H * 0.05
    # obrys GLADSZY niz u debu (jeden przebieg, slabsze szarpanie) — to jest
    # roznica sylwetki miedzy bukiem a debem, nie niedoróbka
    korona = poszarp(korona, los, 0.22, 1)
    korona |= kotwica_korony(xx, yy, H, [(cx, y_rozw - H * 0.04)],
                             K_["pien"][0] * W, los)
    # krzywa 0,75: buk to gatunek JASNY, a kotwica siedzi u nasady korony,
    # czyli po stronie cienia. Bez tego maly buk dominowal stopniem korona[2]
    # o jasnosci 123 wobec 115 trawy i znikal na podlozu (test [4]) — dokladnie
    # ten sam mechanizm, co wczesniej u malej brzozy.
    cieniuj_korone(px, korona, d, srodki, xx, yy, W, H, kc_y - ky_ * H,
                   rampa, (1, 4), los, sila_bruzdy=0.42, krzywa=0.75)
    kepy(px, korona, los, max(4, int(30 * W * H / (64 * 64))), rampa,
         jasne=(3, 4), ciemne=(1, 2))

    przyciemnij_krawedz(px, korona | drewno)
    sprzataj(px)
    cien_kontaktowy(px, cx, y_dol + 1, 0.20 * W, max(2.0, 0.040 * H))
    return px


# ── GRAB — krzywy pien, gesta ciemna korona ─────────────────────────────────

GRAB_KSZTALTY = {
    "mlody":   dict(platow=6, prom=(0.22, 0.28), y_rozw=0.52, pien=(0.10, 0.17),
                    korona=(0.42, 0.30), wygiecie=0.62),
    "dorosly": dict(platow=9, prom=(0.175, 0.215), y_rozw=0.55, pien=(0.10, 0.19),
                    korona=(0.42, 0.32), wygiecie=0.85),
    "zagajnik": dict(platow=12, prom=(0.15, 0.19), y_rozw=0.52, pien=(0.095, 0.185),
                     korona=(0.42, 0.34), wygiecie=-0.90),
}


def grab(ziarno=1, kafli_x=1, kafli_y=2, rampa="listowie", ksztalt="dorosly"):
    """Gesty zagajnik: KRZYWY PIEN, ciemniejsza zielen, zwarta korona.

    Rampa `listowie` swiadomie — grab ma byc ciemny, tak jak swierk. Rozroznia
    je sylwetka: swierk to stozek, grab to zwarty owal na wygietym pniu.
    Sam kolor by nie wystarczyl i weryfikacja slusznie by tego nie przepuscila.
    """
    W, H = kafli_x * T, kafli_y * T
    K_ = GRAB_KSZTALTY[ksztalt]
    los = np.random.default_rng(ziarno * 521 + 29)
    px = plotno(W, H)
    yy, xx = np.mgrid[0:H, 0:W]
    cx = W / 2
    y_dol = H - max(3, int(H * 0.05))
    y_rozw = H * K_["y_rozw"]
    m_drewno = np.zeros((H, W), bool)

    m_pien, pole_p = pien(px, m_drewno, cx, y_rozw - H * 0.05, y_dol,
                          K_["pien"][0] * W, K_["pien"][1] * W,
                          wygiecie=K_["wygiecie"], korzenie=2, maluj_teraz=False)
    pole_d = pole_p - ((yy - y_rozw * 0.4) / max(H, 1)) * 0.20
    stopnie_na_kolory(px, m_pien, pole_d, "kora", (0, 3))

    # wierzcholek wygietego pnia — korona musi siasc TAM, nie nad srodkiem kafla
    czubek_x = cx + K_["wygiecie"] * 10
    kx_, ky_ = K_["korona"]
    kc_y = y_rozw - H * ky_ * 0.55
    srodki = []
    for i in range(K_["platow"]):
        a = 2 * np.pi * i / K_["platow"]
        r_ = los.uniform(*K_["prom"]) * W
        sx = czubek_x + np.cos(a) * kx_ * W * 0.40 + los.uniform(-0.02, 0.02) * W
        sy = kc_y + np.sin(a) * ky_ * H * 0.38 + los.uniform(-0.02, 0.02) * H
        srodki.append((float(np.clip(sx, r_ + 2, W - r_ - 2)), sy, r_))
    srodki.append((czubek_x, kc_y, K_["prom"][1] * W))

    korona, d = masa_z_platow(xx, yy, srodki, 1.10)
    korona &= (((xx + 0.5 - czubek_x) / (kx_ * W)) ** 2
               + ((yy + 0.5 - kc_y) / (ky_ * H)) ** 2) <= 1.0
    korona &= yy < y_rozw + H * 0.06
    korona = poszarp(korona, los, 0.30, 2)
    korona |= kotwica_korony(xx, yy, H, [(czubek_x, y_rozw - H * 0.05)],
                             K_["pien"][0] * W, los)
    # krzywa 1,45 przesuwa mase w CIEMNE stopnie. Bez tego grab dominowal
    # stopniem listowie[3] o jasnosci 113,6 wobec 115 trawy — czyli dokladnie
    # tym przypadkiem, przed ktorym ostrzega public/assets/README.md: gatunek
    # ma byc ciemny, ale wyladowal na jasnosci podloza co do punktu i znikal.
    # Swierk siedzi na tej samej rampie i dominuje stopniem 2 (jasnosc 88).
    cieniuj_korone(px, korona, d, srodki, xx, yy, W, H, kc_y - ky_ * H,
                   rampa, (0, 4), los, sila_bruzdy=0.50, krzywa=1.45)
    kepy(px, korona, los, max(4, int(30 * W * H / (64 * 64))), rampa,
         jasne=(2, 3), ciemne=(0, 1))

    przyciemnij_krawedz(px, korona | m_pien)
    sprzataj(px)
    cien_kontaktowy(px, cx, y_dol + 1, 0.20 * W, max(2.0, 0.035 * H))
    return px


# ── ciecie na kafle ─────────────────────────────────────────────────────────

def na_kafle(px):
    """Deterministyczne ciecie blokowe na siatke 32 px.

    NIE skanowanie alfy: przy skanowaniu jeden zabladzony piksel kryjacy
    przesuwa cala siatke i prop dostaje szew (ta pulapka jest opisana
    w public/assets/README.md przy extractCompact).
    """
    h, w = px.shape[:2]
    assert w % T == 0 and h % T == 0, "prop musi byc wielokrotnoscia kafla"
    return {(c, r): px[r * T:(r + 1) * T, c * T:(c + 1) * T].copy()
            for r in range(h // T) for c in range(w // T)}


# ── weryfikacja (docs/ZADANIE_drzewa.md, sekcja "Weryfikacja") ───────────────

def weryfikuj(drzewa):
    print("\n== WERYFIKACJA ==")
    ok = True

    # 3. zgodnosc z paleta
    dozwolone = {c for r in PAL.values() for c in r}
    print("\n[3] Zgodnosc z paleta (docs/paleta.json):")
    for nazwa, px in drzewa.items():
        m = px[:, :, 3] > 0
        uzyte = {tuple(c) for c in px[m][:, :3]}
        obce = uzyte - dozwolone
        print("    %-15s %2d kolorow, spoza palety: %d" % (nazwa, len(uzyte), len(obce)))
        if obce:
            ok = False
            print("        OBCE:", list(obce)[:6])

    # 2. obiekt musi miescic sie w swoich kaflach w CALOSCI
    #    Dol wolno dotknac — tam siedzi cien kontaktowy i tam drzewo styka sie
    #    z ziemia. Gora i boki nie: dotkniecie znaczy, ze korona jest scieta
    #    prosta linia po krawedzi kafla. Na planszy stykowej tego nie widac,
    #    na trawie widac natychmiast — dlatego to jest test, a nie oko.
    print("\n[2] Mieszczenie sie w kaflach (gora/boki, wymagany margines >=1 px):")
    for nazwa, px in drzewa.items():
        m = px[:, :, 3] > 0
        ys, xs = np.nonzero(m)
        gora, lewo, prawo = ys.min(), xs.min(), px.shape[1] - 1 - xs.max()
        zle = [n for n, v in (("gora", gora), ("lewo", lewo), ("prawo", prawo)) if v < 1]
        print("    %-15s gora %d, lewo %d, prawo %d  %s"
              % (nazwa, gora, lewo, prawo, "OK" if not zle else "SCIETE: " + ", ".join(zle)))
        if zle:
            ok = False

    # 4. kontrast wobec podloza
    print("\n[4] Kontrast wobec trawy (jasnosc %.0f):" % JASNOSC_TRAWY)
    for nazwa, px in drzewa.items():
        m = px[:, :, 3] == 255
        kol, ile = np.unique(px[m][:, :3], axis=0, return_counts=True)
        # dominujacy kolor KORONY = najczestszy zielony
        zielone = [(jasnosc(c), n, tuple(c)) for c, n in zip(kol, ile)
                   if c[1] > c[0] and c[1] > c[2]]
        if not zielone:
            print("    %-15s brak zieleni (?)" % nazwa)
            continue
        zielone.sort(key=lambda t: -t[1])
        j, n, c = zielone[0]
        d = j - JASNOSC_TRAWY
        stan = "OK" if abs(d) >= 15 else "ZA BLISKO — drzewo zniknie"
        print("    %-15s dominujaca zielen #%02x%02x%02x jasnosc %5.1f, roznica %+6.1f  %s"
              % (nazwa, c[0], c[1], c[2], j, d, stan))
        if abs(d) < 15:
            ok = False

    # 1. rozroznialnosc — IoU maski alfy, wyrownanej do DOLU i SRODKA
    #    (tak, jak drzewa stoja obok siebie na ziemi)
    #
    # POROWNUJEMY TYLKO DRZEWA TEJ SAMEJ KLASY WIELKOSCI. Zestawienie sadzonki
    # 1x2 z dorosla korona 3x3 zawsze wyjdzie rozne i zawsze przejdzie — to
    # test, ktory nie moze oblac, czyli zaden test. Ryzyko siedzi tam, gdzie
    # dwa drzewa maja to samo plotno.
    print("\n[1] Rozroznialnosc sylwetek (IoU maski alfy):")
    klasy = {}
    for nazwa, px in drzewa.items():
        klasy.setdefault((px.shape[1] // T, px.shape[0] // T), []).append(nazwa)
    for (kx, ky), lista in sorted(klasy.items()):
        if len(lista) < 2:
            continue
        print("  klasa %dx%d kafla:" % (kx, ky))
        W = kx * T
        H = ky * T
        maski = {}
        for nazwa in lista:
            s = drzewa[nazwa][:, :, 3] == 255
            m = np.zeros((H, W), bool)
            m[H - s.shape[0]:, (W - s.shape[1]) // 2:(W - s.shape[1]) // 2 + s.shape[1]] = s
            maski[nazwa] = m
        for i in range(len(lista)):
            for j in range(i + 1, len(lista)):
                a, b = maski[lista[i]], maski[lista[j]]
                iou = (a & b).sum() / max((a | b).sum(), 1)
                # ten sam gatunek w dwoch wariantach ma prawo byc podobniejszy
                # niz dwa rozne gatunki — stad dwa progi
                ten_sam = lista[i].split("_")[0] == lista[j].split("_")[0]
                prog = 0.92 if ten_sam else 0.85
                zle = iou > prog
                print("    %-15s x %-15s IoU %.3f (prog %.2f)  %s"
                      % (lista[i], lista[j], iou, prog,
                         "OK" if not zle else ("TO JEDEN WARIANT W DWOCH NAZWACH"
                                               if ten_sam else "TO JEDEN GATUNEK W DWOCH KOLORACH")))
                if zle:
                    ok = False

    # 6. KORONA MUSI DOTYKAC DREWNA
    #
    # Test dopisany po tym, jak mala brzoza wyszla z arkusza z DWOMA PIKSELAMI
    # czystej trawy miedzy bialym pniem a zielona masa — drzewo rozpadalo sie
    # na dwa osobne obiekty. Zaden z dotychczasowych testow tego nie lapal:
    # paleta byla poprawna, kontrast poprawny, sylwetka rozroznialna,
    # w kaflach sie miescilo. Sprite moze przejsc wszystko i nadal nie byc
    # drzewem.
    # Mierzymy SPOJNOSC, nie liczbe pikseli styku. Prog "min. 4 px sasiedztwa"
    # byl arbitralny i oblewal poprawne drzewa: pien malego buka ma w miejscu
    # zetkniecia z korona DWA PIKSELE szerokosci, wiec 3 px styku to styk pelny.
    # Spojnosc nie zalezy od skali i mowi dokladnie to, o co chodzi: czy to
    # jest jeden obiekt, czy dwa lezace obok siebie.
    print("\n[6] Spojnosc sprite'a (drzewo ma byc JEDNYM obiektem):")
    for nazwa, px in drzewa.items():
        op = px[:, :, 3] == 255
        r, g, b = px[:, :, 0].astype(int), px[:, :, 1].astype(int), px[:, :, 2].astype(int)
        liscie = op & (g > r) & (g > b)
        drewno = op & ~liscie
        styk = sum((liscie & np.roll(drewno, k, o)).sum()
                   for o, k in ((0, 1), (0, -1), (1, 1), (1, -1)))
        czesci = len(np.unique(_etykiety(op))) - 1
        print("    %-15s czesci: %d, styk korony z drewnem: %3d px  %s"
              % (nazwa, czesci, styk,
                 "OK" if czesci == 1 and styk > 0 else "KORONA WISI ODDZIELNIE OD PNIA"))
        if czesci != 1 or styk == 0:
            ok = False

    # 5. liczba kolorow na kafel (ART_DIRECTION 4.2: prop do ~16, detaliczny ~24)
    print("\n[5] Kolorow na kafel (limit propu: 16, detalicznego: 24):")
    for nazwa, px in drzewa.items():
        naj = 0
        for kafel in na_kafle(px).values():
            m = kafel[:, :, 3] > 0
            if m.sum():
                naj = max(naj, len({tuple(c) for c in kafel[m][:, :3]}))
        print("    %-15s max %d" % (nazwa, naj))
        if naj > 24:
            ok = False

    print("\n%s" % ("WSZYSTKIE TESTY PRZESZLY" if ok else "SA BLEDY — patrz wyzej"))
    return ok


# ── podglad: symulacja widoku z gry ─────────────────────────────────────────

def podglad(drzewa, sciezka, zoom=2):
    """Trawa z Teren.png, drzewa na niej, gracz obok dla skali, zoom kamery.

    Plansza stykowa klamie (docs/ZADANIE_drzewa.md) — kafel ogladany osobno
    wyglada inaczej niz na podlozu i w zmniejszeniu. To nie jest test w silniku,
    ale pokazuje jedyne dwie rzeczy, ktore naprawde decyduja: czy sylwetka
    czyta sie z daleka i czy odcina sie od trawy.
    """
    kafel_trawy = None
    p = os.path.join(ASSETS, "Teren.png")
    if os.path.exists(p):
        t = np.array(Image.open(p).convert("RGBA"))
        kafel_trawy = t[0:T, 3 * PITCH:3 * PITCH + T]     # trawa "srednia"

    # gracz dla skali — klatka "idle w dol" z Character.png; wchodzi do kolejki
    # jako kolejny "obiekt", zeby stal na tej samej linii co drzewa
    obiekty = list(drzewa.items())
    gp = os.path.join(ASSETS, "characters", "Character.png")
    if os.path.exists(gp):
        ch = np.array(Image.open(gp).convert("RGBA"))
        g = ch[0:60, 0:31]
        ys, xs = np.nonzero(g[:, :, 3] > 8)
        if len(ys):
            obiekty.append(("gracz", g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))

    # lamanie na rzedy — dwanascie drzew nie zmiesci sie w jednej linii
    ODSTEP = T // 2
    MAX_SZER = 30 * T
    rzedy, biezacy, szer = [], [], ODSTEP
    for nazwa, px in obiekty:
        if szer + px.shape[1] + ODSTEP > MAX_SZER and biezacy:
            rzedy.append((biezacy, szer))
            biezacy, szer = [], ODSTEP
        biezacy.append((nazwa, px))
        szer += px.shape[1] + ODSTEP
    if biezacy:
        rzedy.append((biezacy, szer))

    W = max(s for _, s in rzedy)
    wys_rzedu = [max(px.shape[0] for _, px in r) + ODSTEP for r, _ in rzedy]
    H = sum(wys_rzedu) + ODSTEP

    tlo = np.zeros((H, W, 4), np.uint8)
    if kafel_trawy is not None:
        for r in range(H // T + 1):
            for c in range(W // T + 1):
                y0, x0 = r * T, c * T
                h = min(T, H - y0)
                w = min(T, W - x0)
                if h > 0 and w > 0:
                    tlo[y0:y0 + h, x0:x0 + w] = kafel_trawy[:h, :w]
    else:
        tlo[:, :, :3] = PAL["trawa"][2]
        tlo[:, :, 3] = 255

    def blit(dst, im, x, y):
        h, w = im.shape[:2]
        a = im[:, :, 3:4].astype(float) / 255.0
        dst[y:y + h, x:x + w, :3] = (im[:, :, :3] * a
                                     + dst[y:y + h, x:x + w, :3] * (1 - a)).astype(np.uint8)
        dst[y:y + h, x:x + w, 3] = 255

    y = ODSTEP
    for (rzad, _), wysokosc in zip(rzedy, wys_rzedu):
        x = ODSTEP
        linia = y + wysokosc - ODSTEP     # wspolna linia gruntu w rzedzie
        for nazwa, px in rzad:
            blit(tlo, px, x, linia - px.shape[0])
            x += px.shape[1] + ODSTEP
        y += wysokosc

    out = Image.fromarray(tlo).resize((W * zoom, H * zoom), Image.NEAREST)
    out.save(sciezka)
    print("\npodglad -> %s  (%dx%d, zoom %d)" % (sciezka, out.size[0], out.size[1], zoom))


# ── zapis do arkusza ────────────────────────────────────────────────────────

# ── KATALOG DRZEW ───────────────────────────────────────────────────────────
#
# Uklad przelozony na czysto, bo mapa i tak powstaje od nowa — wczesniej
# kolumny 0-6 byly zamrozone pod juz postawione drzewa. Gdy jakas mapa znowu
# bedzie w uzyciu, ta tabela staje sie kontraktem: przesuniecie wpisu
# przenumerowuje id i mapa zaczyna rysowac polowki innych drzew, po cichu,
# bo bezsensowny uklad kafli niczego nie zglasza.
#
# Dokladanie WIERSZY nie rusza id juz istniejacych; poszerzenie w BOK
# przenumerowaloby wszystko (ART_DIRECTION 7.4) — dlatego kolumn jest 19.
#
# Wiersze 0-1 to kepki trawy i krzaki z build_tilesets.py.
# Wiersze 2-4: drzewa duze, dokladnie 19 kolumn.
# Wiersze 5-6: srednie 2x2 (kolumny 0-9) i male 1x2 (kolumny 10-14).
#
#      nazwa          funkcja  kafle  ziarno  ksztalt         kol  wiersz
DRZEWA = [
    ("dab_duzy",        dab,    3, 3, 1, "dorosly",             0, 2),
    ("dab_duzy2",       dab,    3, 3, 4, "rozwidlony",          3, 2),
    ("buk_duzy",        buk,    3, 3, 1, "stary",               6, 2),
    ("swierk_duzy",     swierk, 2, 3, 1, "otwarty",             9, 2),
    ("swierk_duzy2",    swierk, 2, 3, 4, "lesny",              11, 2),
    ("brzoza_duza",     brzoza, 2, 3, 1, "pojedyncza",         13, 2),
    ("brzoza_duza2",    brzoza, 2, 3, 4, "kepa",               15, 2),
    ("grab_duzy",       grab,   2, 3, 1, "zagajnik",           17, 2),

    ("dab_sredni",      dab,    2, 2, 2, "dorosly",             0, 5),
    ("swierk_sredni",   swierk, 2, 2, 2, "otwarty",             2, 5),
    ("brzoza_srednia",  brzoza, 2, 2, 2, "pojedyncza",          4, 5),
    ("buk_sredni",      buk,    2, 2, 2, "dorosly",             6, 5),
    ("grab_sredni",     grab,   2, 2, 2, "dorosly",             8, 5),

    ("dab_maly",        dab,    1, 2, 3, "mlody",              10, 5),
    ("swierk_maly",     swierk, 1, 2, 3, "mlody",              11, 5),
    ("brzoza_mala",     brzoza, 1, 2, 3, "mloda",              12, 5),
    ("buk_maly",        buk,    1, 2, 3, "mlody",              13, 5),
    ("grab_maly",       grab,   1, 2, 3, "mlody",              14, 5),
]

UKLAD = {n: (k, w) for n, _f, _x, _y, _z, _ks, k, w in DRZEWA}


def zbuduj_wszystkie():
    """Rysuje caly katalog. Zwraca {nazwa: obrazek RGBA}."""
    return {n: f(ziarno=z, kafli_x=kx, kafli_y=ky, ksztalt=ks)
            for n, f, kx, ky, z, ks, _k, _w in DRZEWA}


def zapisz_do_nature(drzewa):
    p = os.path.join(ASSETS, "Nature.png")
    ark = np.array(Image.open(p).convert("RGBA"))
    trzeba = max((UKLAD[n][1] + px.shape[0] // T) for n, px in drzewa.items())
    wys = trzeba * PITCH - 1
    if ark.shape[0] < wys:
        nowy = np.zeros((wys, ark.shape[1], 4), np.uint8)
        nowy[:ark.shape[0]] = ark
        ark = nowy
        print("  arkusz powiekszony do %dx%d (%d wierszy) — id istniejacych kafli bez zmian"
              % (ark.shape[1], ark.shape[0], trzeba))
    opis = {}
    for nazwa, px in drzewa.items():
        k0, w0 = UKLAD[nazwa]
        for (c, r), kafel in na_kafle(px).items():
            kol, wier = k0 + c, w0 + r
            ark[wier * PITCH:wier * PITCH + T, kol * PITCH:kol * PITCH + T] = kafel
            opis[wier * COLS + kol] = "%s %d,%d" % (nazwa, c, r)
        print("  %-15s -> kolumny %2d-%2d, wiersze %d-%d, lewy gorny kafel id %d"
              % (nazwa, k0, k0 + px.shape[1] // T - 1, w0, w0 + px.shape[0] // T - 1,
                 w0 * COLS + k0))
    Image.fromarray(ark).save(p)
    print("  -> Nature.png %dx%d" % (ark.shape[1], ark.shape[0]))
    return opis


def sprawdz_kolizje():
    """Zaden prop nie moze nachodzic na drugi ani wychodzic poza 19 kolumn.

    Przy dwunastu drzewach o czterech roznych rozmiarach uklad przestaje sie
    miescic w glowie — a nachodzace kafle nie wywolaja bledu, tylko po cichu
    zjedza polowe jednego drzewa.
    """
    zajete = {}
    bledy = []
    for nazwa, _f, kx, ky, _z, _ks, k0, w0 in DRZEWA:
        if k0 + kx > COLS:
            bledy.append("%s wychodzi poza %d kolumn" % (nazwa, COLS))
        for r in range(ky):
            for c in range(kx):
                pole = (k0 + c, w0 + r)
                if pole in zajete:
                    bledy.append("%s nachodzi na %s w kolumnie %d, wierszu %d"
                                 % (nazwa, zajete[pole], pole[0], pole[1]))
                zajete[pole] = nazwa
    return bledy


def main(zapisz, podglad_p):
    bledy = sprawdz_kolizje()
    if bledy:
        print("== UKLAD ARKUSZA: BLAD ==")
        for b in bledy:
            print("   ", b)
        return
    drzewa = zbuduj_wszystkie()
    print("== WYMIARY ==")
    for n, px in drzewa.items():
        print("    %-15s %3dx%-3d px = %dx%d kafla"
              % (n, px.shape[1], px.shape[0], px.shape[1] // T, px.shape[0] // T))
    weryfikuj(drzewa)
    podglad(drzewa, podglad_p)
    if zapisz:
        print("\n== ZAPIS ==")
        zapisz_do_nature(drzewa)
    else:
        print("\nNic nie zapisano do arkusza. Uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Rysuje drzewa slowianskiego lasu. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true", help="wklej drzewa do Nature.png")
    ap.add_argument("--podglad", default=os.path.join(TU, "podglad_drzew.png"))
    main(ap.parse_args().zapisz, ap.parse_args().podglad)

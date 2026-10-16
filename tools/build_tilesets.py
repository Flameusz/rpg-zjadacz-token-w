"""
Generator arkuszy kafli — Teren.png i Nature.png.

Uruchom:  python tools/build_tilesets.py --od-zera
          python tools/build_tilesets.py            (tylko raport, nic nie pisze)

── MODEL PRACY ─────────────────────────────────────────────────────────────

Arkusz jest ARTEFAKTEM, nie wynikiem funkcji. Ten skrypt buduje go RAZ; potem
plik sie dopracowuje — recznie w edytorze albo odswiezajac pojedynczy zestaw.
Dlatego domyslnie NIC nie nadpisuje: reczna poprawka piksela musi przezyc
nastepne uruchomienie.

── PODZIAL NA DWA PLIKI ────────────────────────────────────────────────────

Podzial jest ROBOCZY, nie estetyczny — wynika z tego, jak sie tego uzywa:

  Teren.png    to, po czym sie chodzi: trawa, ziemia, piasek, kamien, woda,
               wydeptane sciezki + komplety przejsc. Malowane pedzlem na
               warstwach kafli. ZAWSZE KRYJACE.

  Nature.png   to, co STOI na ziemi: drzewa, krzaki, kepki jako obiekty,
               kamienie. Stawiane pojedynczo. ZAWSZE Z PRZEZROCZYSTOSCIA.

Komplet obszarowy ma 47 kafli i bedzie rosl. Gdyby siedzial razem z propami,
kazde powiekszenie terenu przesuwaloby drzewa i psulo mape.

── CO WYPADLO ──────────────────────────────────────────────────────────────

Most, pomost drewniany, skrzynie, kowadlo, ognisko. Ze starego arkusza
przenosimy WYLACZNIE dwa drzewa — jedyna prawdziwa grafike, jaka mamy.
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

rng = np.random.default_rng(11)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()

# kolor -> ciemniejszy stopien TEJ SAMEJ rampy (do krawedzi)
_CIEMNIEJ = {}
for _r, _k in PAL.items():
    for _i, _c in enumerate(_k):
        _CIEMNIEJ[_c] = _k[max(0, _i - 1)]


def przyciemnij(px):
    out = px.copy()
    for zr, cel in _CIEMNIEJ.items():
        out[np.all(px[..., :3] == zr, axis=-1), :3] = cel
    return out


# ── tekstury bazowe: plaskie tlo + rzadkie SKUPISKA ─────────────────────────
# Zmierzone na dzialajacym materiale: kafel terenu to 1 kolor tla i ~5% pikseli
# detalu. Ciagly szum po calej powierzchni czyta sie jak brud, nie jak teren.
#
# GESTOSC TO POLOWA SPRAWY, DRUGA POLOWA TO ROZKLAD. Pierwsza wersja sypala
# akcenty PER PIKSEL, wiec kazdy detal byl samotna kropka — a w rampie
# 5-stopniowej sasiedni stopien lezy +36 / -28 jasnosci od bazy, wiec kazda
# taka kropka krzyczy. Zmierzone na gotowym arkuszu: 6,7% pikseli na najczystszym
# wariancie trawy, wszystkie pojedyncze. Na duzym polu w Tiled czytalo sie to
# jako szum, co zglosil autor projektu — pojedynczy kafel tego nie pokazuje.
#
# Teraz te same piksele ida w SKUPISKACH po 2-4. Ta sama masa, inne czytanie:
# trzy piksele obok siebie to kepka trawy, trzy rozrzucone to brud. Dokladnie
# ta sama lekcja, co przy kepach listowia w tools/build_drzewa.py.
#
# Skupiska ZAWIJAJA SIE MODULO — i to jest tu poprawne, w odroznieniu od kepek
# trawy jako propow. Tlo musi byc bezszwowe, obiekt musi byc caly.

MATERIALY = {
    "trawa":    ("trawa",    2, [1, 3], 0.018),
    "ziemia":   ("ziemia",   2, [1, 3], 0.030),
    "piasek":   ("piasek",   2, [1, 3], 0.025),
    "kamien":   ("kamien",   2, [1, 3], 0.040),
    "woda":     ("woda",     2, [1, 3], 0.030),
    "listowie": ("listowie", 2, [1, 3], 0.035),
}


def tekstura(nazwa, ziarno=0):
    rampa, i_baz, akcenty, gest = MATERIALY[nazwa]
    kolory = PAL[rampa]
    out = np.zeros((T, T, 4), np.uint8)
    out[..., :3] = kolory[i_baz]
    out[..., 3] = 255
    los = np.random.default_rng(1000 + ziarno * 131 + hash(nazwa) % 997)

    ile_pikseli = gest * T * T
    srednie_skupisko = 2.6
    ile_skupisk = max(1, int(round(ile_pikseli / srednie_skupisko)))
    for _ in range(ile_skupisk):
        cx, cy = int(los.integers(T)), int(los.integers(T))
        # Akcent CIEMNY trzy razy czesciej niz jasny. Oba sa tak samo daleko
        # od bazy w liczbach (-28 i +36), ale nie w odbiorze: ciemna plamka
        # czyta sie jako cien miedzy zdzblami, jasna jako blysk — i to wlasnie
        # jasne punkty robily z pola rozsypana sol.
        i_a = akcenty[0] if los.random() < 0.75 else akcenty[-1]
        kolor = kolory[i_a]
        # skupisko: piksel startowy + 1-3 losowych sasiadow, z zawijaniem
        punkty = [(cy, cx)]
        for _ in range(int(los.integers(1, 4))):
            py, px_ = punkty[int(los.integers(len(punkty)))]
            dy, dx = int(los.integers(-1, 2)), int(los.integers(-1, 2))
            punkty.append(((py + dy) % T, (px_ + dx) % T))
        for py, px_ in punkty:
            out[py, px_, :3] = kolor
    return out


# ── kepki trawy (ksztalty w maskach stopni rampy) ───────────────────────────

_KEPKI = None


def kepki():
    global _KEPKI
    if _KEPKI is None:
        p = os.path.join(TU, "zrodla", "kepki_trawy.npz")
        _KEPKI = [np.load(p)[k] for k in sorted(np.load(p).files)] if os.path.exists(p) else []
    return _KEPKI


def wklej_kepke(px, maska, x0, y0, rampa="trawa"):
    """Kepka w CALOSCI wewnatrz kafla — bez zawijania.

    Tlo musi byc bezszwowe, obiekt musi byc caly. Zawijanie modulo dawalo
    zdzbla przeciete krawedzia, poprawne tylko gdyby sasiad je kontynuowal —
    a przy losowym rozsypie wariantow to sie nie zdarza nigdy.
    """
    R = PAL[rampa]
    h, w = maska.shape
    x0 = max(0, min(x0, T - w))
    y0 = max(0, min(y0, T - h))
    for y in range(h):
        for x in range(w):
            i = maska[y, x]
            if i >= 0:
                px[y0 + y, x0 + x, :3] = R[int(i)]
                px[y0 + y, x0 + x, 3] = 255


def trawa(ziarno, duze=0, male=0):
    px = tekstura("trawa", ziarno)
    z = kepki()
    if not z:
        return px
    los = np.random.default_rng(ziarno + 77)
    dz = [m for m in z if m.shape[1] >= 12]
    dr = [m for m in z if m.shape[1] < 12] or dz
    for zestaw, ile in ((dz, duze), (dr, male)):
        for _ in range(ile):
            m = zestaw[int(los.integers(len(zestaw)))]
            if los.random() < 0.5:
                m = m[:, ::-1]
            h, w = m.shape
            wklej_kepke(px, m, int(los.integers(0, max(T - w, 1))),
                        int(los.integers(0, max(T - h, 1))))
    return px


TRAWA_WARIANTY = [("czysta", 0, 0), ("pojedyncze", 0, 2), ("rzadka", 1, 1),
                  ("srednia", 2, 1), ("gesta", 3, 2), ("b. gesta", 4, 3)]


# ── zestaw obszarowy (blob 47) ──────────────────────────────────────────────

_KIER = {"N": 1, "NE": 2, "E": 4, "SE": 8, "S": 16, "SW": 32, "W": 64, "NW": 128}


def normalizuj(m):
    """Skos bez obu przyleglych prostopadlych nic nie wnosi — 256 ukladow
    zwija sie do 47 realnie roznych kafli."""
    if not (m & 1 and m & 4): m &= ~2
    if not (m & 4 and m & 16): m &= ~8
    if not (m & 16 and m & 64): m &= ~32
    if not (m & 64 and m & 1): m &= ~128
    return m & 0xFF


BLOB = sorted({normalizuj(m) for m in range(256)})


def _cwiartka(brak_a, brak_b, brak_skos, rozmiar=T // 2, wciecie=3, r_zew=7, r_wew=5):
    """Cwiartka kafla. CZTERY przypadki — brak ktoregokolwiek to blad
    merytoryczny, nie parametr:

      brak obu prostopadlych  -> naroznik zewnetrzny, zaokraglony
      brak JEDNEGO            -> krawedz wsunieta od tej strony
      oba sa, brak skosu      -> naroznik wewnetrzny, male wciecie
      oba sa + skos           -> pelne wypelnienie

    Pominiecie przypadku "brak jednego" powodowalo, ze pionowy pasek wypelnial
    caly kafel i wychodzil identycznie jak kafel otoczony ze wszystkich stron —
    siedem ukladow lapalo sie na jeden obrazek.
    """
    y, x = np.mgrid[0:rozmiar, 0:rozmiar].astype(float)
    m = np.ones((rozmiar, rozmiar), bool)
    if brak_a:
        m &= y >= wciecie
    if brak_b:
        m &= x >= wciecie
    if brak_a and brak_b:
        c = wciecie + r_zew
        m &= ~((x < c) & (y < c)) | (np.hypot(x - c, y - c) <= r_zew)
    if (not brak_a) and (not brak_b) and brak_skos:
        m &= np.hypot(x + 0.5, y + 0.5) >= r_wew
    return m


def maska_blob(mk, szarpanie=None):
    b = lambda k: not (mk & _KIER[k])
    h = T // 2
    m = np.zeros((T, T), bool)
    m[0:h, 0:h] = _cwiartka(b("N"), b("W"), b("NW"))
    m[0:h, h:T] = _cwiartka(b("N"), b("E"), b("NE"))[:, ::-1]
    m[h:T, 0:h] = _cwiartka(b("S"), b("W"), b("SW"))[::-1, :]
    m[h:T, h:T] = _cwiartka(b("S"), b("E"), b("SE"))[::-1, ::-1]
    if szarpanie is not None:
        kraw = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0)
                     & np.roll(m, 1, 1) & np.roll(m, -1, 1))
        m = m & ~(kraw & szarpanie)
    return m


def kafel_blob(mk, a, b, szarpanie, obrys=True):
    m = maska_blob(mk, szarpanie)
    out = np.where(m[..., None], a, b).astype(np.uint8)
    if obrys:
        kraw = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0)
                     & np.roll(m, 1, 1) & np.roll(m, -1, 1))
        out[kraw] = przyciemnij(out)[kraw]
    out[..., 3] = 255
    return out


# ── krzaki ──────────────────────────────────────────────────────────────────

def krzak(ziarno, promien=9, rampa="listowie"):
    """Kepy lisci, nie kula. Gladki gradient na okragu to sygnatura KULI —
    pierwsza wersja wygladala jak arbuz. Listowie to jasne skupiska na
    ciemniejszej masie, z guzowatym obrysem."""
    los = np.random.default_rng(ziarno)
    R = PAL[rampa]
    px = np.zeros((T, T, 4), np.uint8)
    cx, cy = T // 2, T // 2 + 3
    yy, xx = np.mgrid[0:T, 0:T]

    ciało = np.zeros((T, T), bool)
    for _ in range(14):
        a_ = los.uniform(0, 2 * np.pi)
        r_ = los.uniform(0, promien * 0.75)
        sx, sy = cx + int(np.cos(a_) * r_), cy + int(np.sin(a_) * r_ * 0.75)
        rr = int(los.integers(max(promien // 3, 2), max(promien // 2, 3) + 1))
        ciało |= (xx - sx) ** 2 + (yy - sy) ** 2 <= rr * rr
    px[ciało, :3] = R[2]
    px[ciało, 3] = 255

    for _ in range(int(promien * 1.6)):
        a_ = los.uniform(0, 2 * np.pi)
        r_ = los.uniform(0, promien * 0.8)
        sx, sy = cx + int(np.cos(a_) * r_), cy + int(np.sin(a_) * r_ * 0.8)
        jasno = (sx - cx) * 0.6 + (sy - cy) * 0.8 < 0
        rr = int(los.integers(1, 3))
        kepa = ((xx - sx) ** 2 + (yy - sy) ** 2 <= rr * rr) & ciało
        px[kepa, :3] = R[3] if jasno else R[1]
        if jasno and los.random() < 0.45:
            px[((xx - sx) ** 2 + (yy - sy + 1) ** 2 <= 1) & ciało, :3] = R[4]
    px[ciało & (yy > cy + promien * 0.45), :3] = R[1]

    kraw = ciało & ~(np.roll(ciało, 1, 0) & np.roll(ciało, -1, 0)
                     & np.roll(ciało, 1, 1) & np.roll(ciało, -1, 1))
    px[kraw] = przyciemnij(px)[kraw]
    px[kraw, 3] = 255

    # cien kontaktowy: jeden ciemny CIEPLY kolor z alfa — technika zmierzona
    # w materiale referencyjnym. Bez niego prop wisi w powietrzu.
    kolor = PAL["neutralne"][0]
    for y in range(-3, 4):
        for x in range(-int(promien * 0.9), int(promien * 0.9) + 1):
            if (x / max(promien * 0.9, 1)) ** 2 + (y / 3) ** 2 > 1:
                continue
            yy2, xx2 = cy + promien - 1 + y, cx + x
            if 0 <= yy2 < T and 0 <= xx2 < T and px[yy2, xx2, 3] == 0:
                px[yy2, xx2, :3] = kolor
                px[yy2, xx2, 3] = 110
    return px



# ── drzewa: przemalowanie na palete projektu ────────────────────────────────

def przemaluj_drzewo(czesci, zakres_lisci, rampa_lisci="korona"):
    """Przemalowuje drzewo (kilka kafli) na rampy projektu.

    Mapujemy ODREBNE KOLORY po kolejnosci jasnosci, a nie percentyle pikseli.
    To jest istotne: korona sklada sie w ~67% z jednego koloru, wiec progi
    liczone po masie pikseli trafialy w jego srodek i dzielily go arbitralnie —
    dominujaca zielen ladowala na najciemniejszym stopniu i drzewo wychodzilo
    ciemniejsze od trawy. Ranking kolorow zachowuje strukture cieniowania
    oryginalu jeden do jednego: n-ty najciemniejszy kolor -> n-ty stopien rampy.

    Zielen i braz rozdzielone po ODCIENIU, nie po jasnosci — pien bywa
    jasniejszy od cienia korony.

    Progi liczone dla CALEGO drzewa, nie per kafel, inaczej korona rozpada sie
    na latki na granicach kafli.
    """
    import colorsys
    LISC, KORA = PAL[rampa_lisci], PAL["kora"]
    lum = lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    zielona = lambda c: 60 <= colorsys.rgb_to_hsv(*[v / 255 for v in c])[0] * 360 <= 200

    zrodlowe = set()
    for kafel in czesci.values():
        m = kafel[..., 3] > 8
        zrodlowe |= {tuple(c) for c in kafel[m][:, :3]}
    zielenie = sorted([c for c in zrodlowe if zielona(c)], key=lum)
    brazy = sorted([c for c in zrodlowe if not zielona(c)], key=lum)

    a, b = zakres_lisci
    stopnie = list(range(a, b + 1))
    mapa = {}
    for i, c in enumerate(zielenie):
        # rozciagniecie n kolorow zrodlowych na dostepne stopnie rampy
        poz = 0 if len(zielenie) == 1 else i / (len(zielenie) - 1)
        mapa[c] = LISC[stopnie[min(int(round(poz * (len(stopnie) - 1))), len(stopnie) - 1)]]
    for i, c in enumerate(brazy):
        poz = 0 if len(brazy) == 1 else i / (len(brazy) - 1)
        mapa[c] = KORA[min(int(round(poz * (len(KORA) - 2))) + 0, len(KORA) - 1)]

    out = {}
    for poz_kafla, kafel in czesci.items():
        nowy = np.zeros_like(kafel)
        m = kafel[..., 3] > 8
        ys, xs = np.nonzero(m)
        for y, x in zip(ys, xs):
            nowy[y, x, :3] = mapa[tuple(kafel[y, x, :3])]
            nowy[y, x, 3] = 255
        out[poz_kafla] = nowy
    return out


def dodaj_cien(kafel, szerokosc=9):
    """Cien kontaktowy pod pniem, w dolnym kaflu drzewa.

    Bez niego drzewo wisi — ta sama regula co przy krzakach (ART_DIRECTION 4.3).
    Jeden ciemny cieply kolor z alfa, nie czern wtopiona w sprite.
    """
    out = kafel.copy()
    kolumny = np.nonzero((out[..., 3] > 8).any(axis=0))[0]
    if len(kolumny) == 0:
        return out
    cx = int(kolumny.mean())
    wiersze = np.nonzero((out[..., 3] > 8).any(axis=1))[0]
    cy = min(int(wiersze.max()) + 1, T - 2)
    kolor = PAL["neutralne"][0]
    for y in range(-2, 3):
        for x in range(-szerokosc, szerokosc + 1):
            if (x / szerokosc) ** 2 + (y / 2.0) ** 2 > 1:
                continue
            yy, xx = cy + y, cx + x
            if 0 <= yy < T and 0 <= xx < T and out[yy, xx, 3] == 0:
                out[yy, xx, :3] = kolor
                out[yy, xx, 3] = 110
    return out


# ── skladanie arkuszy ───────────────────────────────────────────────────────

def pusty(wierszy):
    return np.zeros((wierszy * PITCH - 1, COLS * PITCH - 1 + 14, 4), np.uint8)


def wklej(ark, kafel, kol, wiersz):
    ark[wiersz * PITCH:wiersz * PITCH + T, kol * PITCH:kol * PITCH + T] = kafel


def buduj_teren():
    """Teren: same powierzchnie, zawsze kryjace."""
    WIERSZY = 12
    ark = pusty(WIERSZY)
    opis = {}
    szarp = np.random.default_rng(5).random((T, T)) > 0.72   # jeden wzor dla calego arkusza

    # wiersz 0 — materialy bazowe
    kol = 0
    for nazwa, duze, male in TRAWA_WARIANTY:
        wklej(ark, trawa(300 + kol * 13, duze, male), kol, 0)
        opis[kol] = "trawa — %s" % nazwa
        kol += 1
    for mat in ("ziemia", "piasek", "kamien", "woda", "listowie"):
        for w in range(2):
            wklej(ark, tekstura(mat, w), kol, 0)
            opis[kol] = "%s %d" % (mat, w + 1)
            kol += 1

    # wiersze 1-9 — trzy komplety obszarowe
    mapowania = {}
    for nr, (start, a_mat, b_mat, nazwa) in enumerate([
            (1, "ziemia", "trawa", "sciezka"),
            (4, "woda",   "trawa", "woda"),
            (7, "piasek", "trawa", "piasek")]):
        A = tekstura(a_mat) if a_mat != "trawa" else trawa(300)
        B = trawa(300) if b_mat == "trawa" else tekstura(b_mat)
        mapowania[nazwa] = {}
        for n, mk in enumerate(BLOB):
            w, c = start + n // COLS, n % COLS
            wklej(ark, kafel_blob(mk, A, B, szarp), c, w)
            idk = w * COLS + c
            opis[idk] = "%s — uklad 0x%02x" % (nazwa, mk)
            mapowania[nazwa][mk] = idk
        print("  %-9s wiersze %d-%d, 47 kafli" % (nazwa, start, start + 2))
    return ark, opis, mapowania


def buduj_nature():
    """Nature: same obiekty, zawsze z przezroczystoscia."""
    # wysokosc wynika z KATALOGU DRZEW, nie ze stalej. Przy stalej dolozenie
    # wariantu w nowym wierszu ucinalo go bez slowa.
    import build_drzewa as bd
    WIERSZY = max([4] + [w + ky for _n, _f, _kx, ky, _z, _ks, _k, w in bd.DRZEWA])
    ark = pusty(WIERSZY)
    opis = {}

    # wiersz 0 — kepki jako propy (na przezroczystym tle)
    z = kepki()
    for i, m in enumerate(z[:COLS]):
        px = np.zeros((T, T, 4), np.uint8)
        wklej_kepke(px, m, (T - m.shape[1]) // 2, T - m.shape[0] - 2)
        wklej(ark, px, i, 0)
        opis[i] = "kepka trawy %d" % (i + 1)

    # wiersz 1 — krzaki
    for i, prom in enumerate((5, 7, 9, 11, 13, 7, 9, 11)):
        rampa = "listowie" if i < 5 else "trawa"
        wklej(ark, krzak(500 + i * 17, prom, rampa), i, 1)
        opis[COLS + i] = "krzak %s r=%d" % (rampa, prom)

    # ── STARE DRZEWA USUNIETE ───────────────────────────────────────────────
    #
    # Wiersze 2-3 trzymaly dwa drzewa PRZEMALOWANE z Nature_v1_backup.png.
    # Nigdy nie byly rysowane, tylko przekolorowane, i to bylo po nich widac:
    # plaskie plamy z losowymi kropkami udajacymi listowie oraz poziomy szew
    # na granicy kafli. Zastapil je buk (kolumny 6-8) i grab (kolumny 17-18),
    # rysowane tak jak reszta.
    #
    # `przemaluj_drzewo()` nizej zostaje jako referencja metody przemalowania
    # cudzej grafiki na palete — sama metoda jest poprawna i opisana
    # w docs/ZADANIE_drzewa.md, brakowalo jej tylko dobrego materialu.
    stary_p = None
    if stary_p and os.path.exists(stary_p):
        st = np.array(Image.open(stary_p).convert("RGBA"))
        pobierz = lambda src: st[(src // COLS) * PITCH:(src // COLS) * PITCH + T,
                                 (src % COLS) * PITCH:(src % COLS) * PITCH + T].copy()
        # drzewo duze (w oryginale zielen 83 st.) — jasniejszy wycinek rampy
        duze = {(0, 2): pobierz(114), (1, 2): pobierz(115),
                (0, 3): pobierz(133), (1, 3): pobierz(134)}
        # Wycinek rampy celuje w JEJ GORNA polowe. Pierwsze podejscie brало
        # (1,4) i korona wychodzila niemal jednolicie ciemna, bo dominujacy
        # kolor oryginalu (jasna zielen) ladowal na stopniu 1. Najjasniejszy
        # stopien zostawal wtedy tylko na obrysie i czytal sie jak kontur.
        # Rampa "korona", nie "listowie": listowie jest ciemniejsze od trawy
        # (jasnosc 88 kontra 115), wiec drzewo na niej znikalo zamiast sie
        # odcinac. Korona ma jasnosc 123 — pierwszy raz drzewo jest jasniejsze
        # od podloza, tak jak w oryginale.
        duze = przemaluj_drzewo(duze, zakres_lisci=(1, 4), rampa_lisci="korona")
        # drzewo male (zielen 142 st.) — ciemniejszy wycinek, zeby zostaly dwa gatunki
        male = {(3, 2): pobierz(117), (3, 3): pobierz(136)}
        # Male drzewo na rampie "listowie" — ciemniejszy gatunek, tak jak
        # w oryginale, gdzie mialo inny odcien zieleni (142 kontra 83 stopnie).
        male = przemaluj_drzewo(male, zakres_lisci=(1, 4), rampa_lisci="listowie")

        for zestaw, nazwa, dolne in ((duze, "drzewo duze", [(0, 3), (1, 3)]),
                                     (male, "drzewo male", [(3, 3)])):
            for (c, w), kafel in zestaw.items():
                if (c, w) in dolne:
                    kafel = dodaj_cien(kafel, szerokosc=7 if nazwa.endswith("male") else 9)
                wklej(ark, kafel, c, w)
                opis[w * COLS + c] = "%s" % nazwa
        print("  przemalowano 2 drzewa na palete projektu + cienie kontaktowe")

    # wiersze 4+ — caly katalog drzew z build_drzewa.py
    #
    # TO MUSI TU BYC. Bez tego `--od-zera` po cichu KASOWALO drzewa: ten skrypt
    # buduje Nature.png od nowa, a tamte siedza w wierszach, ktorych
    # buduj_nature() nie zna. Jedno uruchomienie "zeby odswiezyc trawe" i pol
    # dnia pracy znika bez sladu.
    #
    # Blad jest TWARDY, nie ostrzezeniem. Ostrzezenie i tak konczylo sie
    # zapisaniem arkusza bez drzew — czyli dokladnie tym, przed czym mial
    # chronic. Lepiej nie zapisac nic.
    import build_drzewa as bd
    for nazwa, drzewo in bd.zbuduj_wszystkie().items():
        k0, w0 = bd.UKLAD[nazwa]
        for (c, w), kafel in bd.na_kafle(drzewo).items():
            wklej(ark, kafel, k0 + c, w0 + w)
            opis[(w0 + w) * COLS + k0 + c] = "%s %d,%d" % (nazwa, c, w)
    print("  dorysowano %d drzew gatunkowych (build_drzewa.py)" % len(bd.DRZEWA))

    return ark, opis


def main(zapisz):
    if not zapisz:
        for f in ("Teren.png", "Nature.png"):
            p = os.path.join(ASSETS, f)
            if os.path.exists(p):
                im = Image.open(p)
                print("%-12s istnieje  %dx%d" % (f, im.size[0], im.size[1]))
            else:
                print("%-12s BRAK" % f)
        print("\nNic nie zapisano. Uzyj --od-zera.")
        return

    print("TEREN:")
    teren, opis_t, mapowania = buduj_teren()
    Image.fromarray(teren).save(os.path.join(ASSETS, "Teren.png"))
    print("  -> Teren.png %dx%d (%d kolumn, %d wierszy)"
          % (teren.shape[1], teren.shape[0], COLS, teren.shape[0] // PITCH + 1))

    print("NATURE:")
    nat, opis_n = buduj_nature()
    Image.fromarray(nat).save(os.path.join(ASSETS, "Nature.png"))
    print("  -> Nature.png %dx%d" % (nat.shape[1], nat.shape[0]))

    with open(os.path.join(DOCS, "kafle.json"), "w", encoding="utf-8") as f:
        json.dump({"teren": {str(k): v for k, v in sorted(opis_t.items())},
                   "nature": {str(k): v for k, v in sorted(opis_n.items())},
                   "obszarowe": {n: {str(k): v for k, v in m.items()}
                                 for n, m in mapowania.items()}},
                  f, indent=1, ensure_ascii=False)
    print("\nspis kafli -> docs/kafle.json")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Buduje Teren.png i Nature.png. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--od-zera", action="store_true", help="zbuduj oba arkusze od nowa")
    main(ap.parse_args().od_zera)

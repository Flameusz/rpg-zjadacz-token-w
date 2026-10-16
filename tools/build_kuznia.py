"""
Generator tilesetu wnetrza kuzni -> public/assets/Kuznia.png

Uruchom:  python tools/build_kuznia.py                     (raport, NIC nie zapisuje)
          python tools/build_kuznia.py --podglad plik.png  (dodatkowo sklada podglad na tle)
          python tools/build_kuznia.py --zapisz            (nadpisuje arkusz + docs/kuznia.json)

── SKAD SIE BIERZE ZAKRES ──────────────────────────────────────────────────

Trzy zrodla, dwie rozne kategorie:

- `Gemini_Generated_Image_5bbt8s5bbt8s5bbt.png` (public/assets/) — material
  REFERENCYJNY, ta sama kategoria co b1.jpg/b2.png przy Buildings.png:
  2048x2048, gradienty, antyaliasing — render, nie pixel art. Posluzyl za
  WZORNIK ASORTYMENTU (co w kuzni stoi, jaka jest wzajemna skala). Zero jego
  pikseli tu trafilo. Licencja: NIEUSTALONA.
- `anvi.png` — ten sam typ materialu, ale WZORNIK KONSTRUKCJI dla pieca/
  kowadla/miecha (sylwetka, proporcje) po tym, jak pierwsza, czysto
  proceduralna wersja tych trzech zostala zgloszona jako „wyglada jak grafika
  pieciolatka". Zero jego pikseli tu trafilo.
- `Nature_v1_backup.png` — **to NIE material referencyjny, to WLASNY,
  juz uzywany zasob projektu** (oryginalny arkusz sprzed przebudowy Nature.png;
  stad tez pochodza drzewa). Ma gotowy piec i kowadlo, prawdziwy pixel-art,
  zgloszone jako „o wiele lepsze" niz cokolwiek narysowane tu proceduralnie —
  WYCIETE WPROST i dokwantowane do `docs/paleta.json` (patrz `_skwantuj`
  nizej), bo kolory zrodla nie byly w palecie projektu. To jedyne dwa kafle
  w tym arkuszu, ktorych piksele NIE sa narysowane od zera.

Zakres jest CELOWO podzielony na fazy (patrz FAZA_* nizej) zamiast rysowac
70 przedmiotow na raz bez podgladu miedzy nimi — to jest dokladnie ten blad,
ktory kosztowal Buildings.png trzy podejscia do dachu. Faza 1: piec + stanowiska
robocze — najwazniejsze wizualnie elementy warsztatu.

── KONWENCJE (patrz docs/ART_DIRECTION.md) ─────────────────────────────────

- Tylko paleta z docs/paleta.json. Zadnych nowych kolorow: zelazo/stal to
  rampa `kamien` (juz chlodny szaro-blekit), zar/miedz to `akcent_cieply`.
- Kafel 32x32, skok w arkuszu 33px, 19 kolumn — identycznie jak Buildings.png.
- Bez czarnego obrysu. Krawedz to jeden stopien WLASNEJ rampy ciemniej.
- Swiatlo: gora, lekko z lewej.
- Prop dotykajacy podloza dostaje cien kontaktowy (neutralne[0], alfa ~110).
- Prawdziwa alfa, pelna przezroczystosc albo pelne krycie — bez polcieni na
  brzegu.
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


def pusty():
    return np.zeros((T, T, 4), np.uint8)


def kladz(px, y, x, kolor, alfa=255):
    if 0 <= y < px.shape[0] and 0 <= x < px.shape[1]:
        if alfa >= 255:
            px[y, x, :3] = kolor
            px[y, x, 3] = 255
        else:
            a = alfa / 255.0
            tlo = px[y, x, :3].astype(float) if px[y, x, 3] else np.array(kolor, float)
            px[y, x, :3] = (np.array(kolor, float) * a + tlo * (1 - a)).astype(np.uint8)
            px[y, x, 3] = max(px[y, x, 3], alfa)


def prostokat(px, y0, y1, x0, x1, kolor, alfa=255):
    for y in range(int(y0), int(y1)):
        for x in range(int(x0), int(x1)):
            kladz(px, y, x, kolor, alfa)


# ── PODSTAWOWE KSZTALTY, WSPOLNE DLA CALEGO ARKUSZA ─────────────────────────

def tarcza(px, cx, cy, r, ramp, sw=4, sr=3, rant=0, slój=True):
    """Okragla, plaska tarcza widziana z gory — koniec klody / stojak / kolo.

    Ten sam ksztalt co `zamek`/`_tarcza` w build_budynki.py: jasne pole,
    oswietlony luk od gory-z-lewej, ciemny rant. Uzywany tu do pnia pod
    kowadlem, tarcz kol szlifierskich i den beczek/sztab.
    """
    for y in range(max(0, int(cy - r) - 1), min(T, int(cy + r) + 2)):
        for x in range(max(0, int(cx - r) - 1), min(T, int(cx + r) + 2)):
            odl = (x - cx) ** 2 + (y - cy) ** 2
            if odl > r * r:
                continue
            if odl >= (r - 0.9) ** 2:
                kladz(px, y, x, ramp[rant])
            elif (x - cx) * 0.6 + (y - cy) * 0.8 < -0.35 * r:
                kladz(px, y, x, ramp[min(len(ramp) - 1, sw)])
            else:
                kladz(px, y, x, ramp[sr])
    if slój and 0 <= int(cy) < T and 0 <= int(cx) < T:
        kladz(px, int(cy), int(cx), ramp[max(0, sr - 1)])


def blok(px, y0, y1, x0, x1, ramp, st=2, jasny=None, ciemny=None):
    """Prostopadloscian z gory: plaski wypelnij + skos jasny gora-lewa,
    ciemny dol-prawa. Zero czarnego obrysu — krawedz to wlasna rampa."""
    jasny = ramp[min(len(ramp) - 1, st + (jasny if jasny is not None else 2))]
    ciemny = ramp[max(0, st - (ciemny if ciemny is not None else 2))]
    prostokat(px, y0, y1, x0, x1, ramp[st])
    if y1 - y0 > 1 and x1 - x0 > 1:
        prostokat(px, y0, y0 + 1, x0, x1, jasny)
        prostokat(px, y0, y1, x0, x0 + 1, jasny)
        prostokat(px, y1 - 1, y1, x0, x1, ciemny)
        prostokat(px, y0, y1, x1 - 1, x1, ciemny)


def cien_kontaktowy(px, y_dol, x0, x1, grubosc=2):
    for dy in range(grubosc):
        prostokat(px, y_dol + dy, y_dol + dy + 1, x0 - 1, x1 + 1, N[0],
                  max(40, 120 - dy * 40))


def ciosy(px, y0, y1, x0, x1, los, ramp=S, ciemniej=0, kurs=6):
    """Rowne KURSY ciosow w ukladzie muratorskim (co drugi rzad przesuniety
    o pol ciosu). Kazdy cios to `blok()` — ma wlasny fazowany brzeg (jasny
    gora-lewo, ciemny dol-prawo), wiec sasiednie ciosy stykaja sie szwem
    z natury, bez osobnej fugi. Pierwsza wersja (`kamien_muru`) losowala
    rozmiar ciosu W KAZDYM PIKSELU brzegu i mur czytal sie jak szum, nie
    jak rzedy kamieni — zgloszone jako „wyglada jak grafika pieciolatka”."""
    st = 2 - ciemniej
    y, rzad = y0, 0
    while y < y1:
        h = min(kurs, y1 - y)
        x = x0 - (kurs // 2 if rzad % 2 else 0)
        while x < x1:
            w = kurs + int(los.integers(-1, 2))
            xa, xb = max(x0, x), min(x1, x + w)
            if xb > xa:
                blok(px, y, y + h, xa, xb, ramp, st)
                if los.random() < 0.1:
                    kladz(px, y + h // 2, (xa + xb) // 2, ramp[max(0, st - 2)], 130)
            x += w
        y += h
        rzad += 1


def deski_top(px, y0, y1, x0, x1, ramp, los, okres=8, ciemniej=0):
    """Blat z desek widziany z gory: rowne pasy z rampy, zwietrzenie NA
    deske (nie na piksel) — jak elewacja z desek w build_budynki.py."""
    c = lambda i: ramp[max(0, i - ciemniej)]
    x = x0
    i = 0
    while x < x1:
        w = min(okres, x1 - x)
        st = 2 + (int(los.integers(-1, 2)) if los.random() < 0.6 else 0)
        prostokat(px, y0, y1, x, x + w, c(st))
        prostokat(px, y0, y1, x, x + 1, c(max(0, st - 2)))
        i += 1
        x += w
    prostokat(px, y0, y0 + 1, x0, x1, c(4))
    prostokat(px, y1 - 1, y1, x0, x1, c(0))


# ── PIEC KOWALSKI: WYCIETY Z Nature_v1_backup.png, DOKWANTOWANY DO PALETY ──
#
# Proceduralna piramida-z-lukiem (ciosy + luk promienisty) zostala odrzucona
# na rzecz gotowego sprite'a: `Nature_v1_backup.png` — ORYGINALNY arkusz
# sprzed przebudowy (stad tez wziete sa drzewa, patrz sekcja Nature.png w tym
# pliku) — ma juz maly piec kowalski z ogniem, prawdziwy pixel-art (nie
# render), zgloszony przez usera jako „o wiele lepszy” niz cokolwiek narysowane
# tu proceduralnie. Zero problemu z licencja: to WLASNY, juz uzywany material
# projektu (ognisko na mapie bylo z niego wycinane, zanim stalo sie
# proceduralne), nie material z Gemini.
#
# Kolory zrodel NIE sa w palecie — `_skwantuj` podmienia kazdy piksel na
# najblizszy dozwolony kolor z `docs/paleta.json`, osobno dla kamienia
# (`kamien` + `neutralne[0]`) i dla ognia (`akcent_cieply` + `piasek[4]`),
# rozdzielonych po nasyceniu (R-B > próg = plomien). Sylwetka i cieniowanie
# zostaja DOKLADNIE takie, jak w oryginale — tylko paleta inna.
_NATURE_V1 = None
_ZIELONE_CACHE = {}


def _wczytaj_nature_v1():
    global _NATURE_V1
    if _NATURE_V1 is None:
        _NATURE_V1 = np.array(
            Image.open(os.path.join(ASSETS, "Nature_v1_backup.png")).convert("RGBA"))
    return _NATURE_V1


def _wytnij_z_nature(x0, y0, x1, y1):
    return _wczytaj_nature_v1()[y0:y1, x0:x1].copy()


def _wczytaj_zielony(nazwa):
    """Arkusze na chroma-green (#00FF00, bez kanalu alfa) — piec.png i
    grind.png, wlasny material usera wygenerowany z Gemini specjalnie pod ten
    plik (brak problemu licencyjnego, w przeciwienstwie do reszty materialow
    z Gemini w tym projekcie). Zielone tlo jest tu KLUCZOWANE raz przy
    wczytaniu, nie noszone dalej jako piksele do przezroczystosci."""
    if nazwa not in _ZIELONE_CACHE:
        arr = np.array(Image.open(os.path.join(ASSETS, nazwa)).convert("RGBA"))
        r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
        tlo = (g > 150) & (r < 100) & (b < 100)
        arr[tlo] = 0
        _ZIELONE_CACHE[nazwa] = arr
    return _ZIELONE_CACHE[nazwa]


def _wytnij_zielony(nazwa, box):
    x0, y0, x1, y1 = box
    return _wczytaj_zielony(nazwa)[y0:y1, x0:x1].copy()


def _przeskaluj(kwant, skala):
    if skala == 1.0:
        return kwant
    obraz = Image.fromarray(kwant)
    nw = max(1, int(round(kwant.shape[1] * skala)))
    nh = max(1, int(round(kwant.shape[0] * skala)))
    return np.array(obraz.resize((nw, nh), Image.NEAREST))


def _najblizszy(rgb, kandydaci):
    d = [((int(rgb[0]) - c[0]) ** 2 + (int(rgb[1]) - c[1]) ** 2
          + (int(rgb[2]) - c[2]) ** 2) for c in kandydaci]
    return kandydaci[int(np.argmin(d))]


def _obrys_cienki(maska):
    """Piksele `maska`, ktore NIE przetrwalyby erozji o 1px — czyli cienkie
    kreski (obrys, <=1-2px), nie grube plamy (np. wnetrze paleniska).
    Erozja liczona recznie (przesuniecia tablicy), zeby nie ciagnac scipy
    do skryptu, ktory poza tym uzywa tylko numpy/PIL."""
    pad = np.pad(maska, 1, mode="constant", constant_values=False)
    gora, dol = pad[0:-2, 1:-1], pad[2:, 1:-1]
    lewo, prawo = pad[1:-1, 0:-2], pad[1:-1, 2:]
    przetrwal = maska & gora & dol & lewo & prawo
    return maska & ~przetrwal


def _stopien_cieniej(rgb):
    """Ktora rampa i ktory stopien to `rgb` — i zwraca stopien NIZEJ.
    Uzywane do zamiany obrysu na „wlasna rampa, jeden stopien ciemniej”
    zamiast osobnego czarnego koloru."""
    cel = tuple(int(v) for v in rgb)
    for ramp in (S, D, K, N, A, P):
        for i, c in enumerate(ramp):
            if cel == tuple(c):
                return ramp[max(0, i - 1)]
    return rgb


def _usun_kontur(kwant):
    """ART_DIRECTION 4.4: „Prop: bez czarnego obrysu, ale krawedz ciemniejsza
    o jeden stopien wlasnej rampy.” Materialy Gemini (piec.png/grind.png/
    tools.png/kowal.png/Nature_v1_backup.png) rysuja kontur jako osobny
    prawie-czarny kolor, ktory `_skwantuj` snapuje do neutralne[0] — i ten
    kontur PRZETRWAL wycinanie, bo `_skwantuj` tylko podmienia kolory, nie
    usuwa kresek. Zestawione obok siebie kafle z roznych zrodel (rozna
    grubosc/nasycenie tego obrysu) czytaly sie jak pieć oddzielnych
    stylow, nie jeden komplet — zgloszone wprost jako "style z roznych
    zarodel gryza sie".

    Naprawa: cienkie kreski neutralne[0] (nie przetrwaly erozji, patrz
    `_obrys_cienki`) dostaja kolor NAJBLIZSZEGO piksela wypelnienia,
    przyciemniony o jeden stopien tej samej rampy. Grube plamy (np. wnetrze
    paleniska, prawdziwy cien) zostaja — to swiadomy cien, nie kontur, i
    usuwanie go zgasiloby np. ciemna wneke pieca."""
    alpha = kwant[..., 3] > 0
    czarny = alpha & np.all(kwant[..., :3] == np.array(N[0]), axis=-1)
    cienki = _obrys_cienki(czarny)
    wypelnienie = alpha & ~czarny
    fys, fxs = np.where(wypelnienie)
    out = kwant.copy()
    if len(fys) == 0:
        return out
    ys, xs = np.where(cienki)
    for y, x in zip(ys, xs):
        d2 = (fys - y) ** 2 + (fxs - x) ** 2
        ny, nx = fys[int(np.argmin(d2))], fxs[int(np.argmin(d2))]
        out[y, x, :3] = _stopien_cieniej(out[ny, nx, :3])
    return out


def _skwantuj(sub, klasyfikuj):
    """`klasyfikuj(r,g,b) -> lista kandydatow` — inna podpaleta dla kamienia,
    drewna i dla ognia w TYM SAMYM sprite'cie, zeby jedna kategoria nie
    kradla pikseli drugiej. Konczy `_usun_kontur` — patrz tam."""
    out = sub.copy()
    for y in range(sub.shape[0]):
        for x in range(sub.shape[1]):
            if sub[y, x, 3] == 0:
                continue
            out[y, x, :3] = _najblizszy(sub[y, x, :3], klasyfikuj(*sub[y, x, :3]))
    return _usun_kontur(out)


_KAMIEN_KAND = list(S) + [N[0]]
_OGIEN_KAND = list(A) + [P[4]]
_DREWNO_KAND = list(D) + list(K) + [N[0]]


def _klasyfikuj_piec(r, g, b):
    # Prog 100, nie 25: kamien w piec.png jest CIEPLEJSZY niz w
    # Nature_v1_backup.png (r-b siega ~40 na samym murze), a plomien zaczyna
    # sie dopiero od r-b ~180. Prog 25 lapal kamien jako "ogien" i cala
    # bryla wychodzila pomaranczowa — zgloszone jako zle kolory.
    return _OGIEN_KAND if int(r) - int(b) > 100 else _KAMIEN_KAND


def _klasyfikuj_kamien_drewno(r, g, b):
    """Dla propow mieszanych (kamienne kolo na drewnianym stelazu): brazowe,
    cieplejsze piksele -> drewno/kora, reszta -> kamien. Prog dobrany na
    probkach z grind.png, POTEM POLUZOWANY na probkach z kowal.png —
    patrz public/assets/README.md. Pierwszy prog (35/18) lapal glowny brazowy
    ton nog stolu (85,63,51, r-b=34) o WLOS pod sitem i malowal drewniane
    nogi na szaro — zgloszone jako nogi „ktore powinny byc brazowe”."""
    if max(r, g, b) < 40:
        return [N[0]]
    if int(r) - int(b) > 28 and int(r) - int(g) > 14:
        return _DREWNO_KAND
    return _KAMIEN_KAND


# piec.png: wlasny material usera (Gemini, jego wlasna generacja — nie ma
# problemu licencyjnego). Osiem wariantow na siatce 4x2; uzywamy TYLKO
# pierwszej kolumny (gladka kopula, bez pekniec/komina — reszta arkusza to
# warianty stylistyczne, nie stany gry).
#
# **Piec jest DUZY, 2x2 kafle (64x64), NIE 1x1.** Pierwsza wersja skalowala
# zrodlo (~44x52px) w dol o polowe, zeby zmiescilo sie w jednym kaflu — i
# wyszedl z tego, cytujac, "malutki piecyk do robienia gwoździ", mniejszy od
# kowadla. Piec to najwieksza, najbardziej stacjonarna bryla w calej kuzni;
# kowadlo (ktore stoi obok, w jednym kaflu) ma byc PRZY nim mniejsze, nie
# odwrotnie. Naprawa: zero skalowania (`_przeskaluj` nie jest tu wolane) —
# sylwetka zostaje w rozdzielczosci zrodla, wklejona w plotno 64x64 i pocieta
# na 4 kafle 32x32 (`_na_cwiartki`), dokladnie jak stog siana (2x2) w
# `Buildings.png`.
_PIEC_ZIMNY_BOX = (8, 8, 52, 60)
_PIEC_ROZPALONY_BOX = (8, 69, 52, 122)


def _na_cwiartki(px64):
    """Kafel 2x2 z bufora 64x64 -> cztery kafle 32x32 (lg, pg, ld, pd)."""
    return {"lg": px64[0:32, 0:32].copy(), "pg": px64[0:32, 32:64].copy(),
            "ld": px64[32:64, 0:32].copy(), "pd": px64[32:64, 32:64].copy()}


def piec(ziarno, stan):
    """`stan`: 'zimny' | 'rozpalony' | 'wygaszony'. 'zimny' to wprost
    niezapalony wariant zrodla; 'wygaszony' bierze wariant ZAPALONY (ma
    poprawnie poszerzona przez ogien wneke) i gasi jego plomien do popiolu —
    ten sam trik co przy kowadle. Zwraca SLOWNIK 4 kafli (patrz
    `_na_cwiartki`), nie pojedynczy kafel."""
    los = np.random.default_rng(1000 + ziarno)
    if stan == "zimny":
        sub = _wytnij_zielony("piec.png", _PIEC_ZIMNY_BOX)
        kwant = _skwantuj(sub, _klasyfikuj_piec)
    else:
        sub = _wytnij_zielony("piec.png", _PIEC_ROZPALONY_BOX)
        ogien_maska = (sub[..., 3] > 0) & (sub[..., 0].astype(int) - sub[..., 2].astype(int) > 100)
        kwant = _skwantuj(sub, _klasyfikuj_piec)
        if stan == "wygaszony":
            ys, xs = np.where(ogien_maska)
            for y, x in zip(ys, xs):
                kwant[y, x, :3] = N[3] if los.random() < 0.6 else N[0]
            if len(ys):
                i = int(np.argmax(ys))          # najnizszy piksel dawnego ognia
                kwant[ys[i], xs[i], :3] = A[1]  # jeden dogasajacy wegielek
    h, w = kwant.shape[:2]
    px = np.zeros((64, 64, 4), np.uint8)
    oy, ox = 64 - 4 - h, (64 - w) // 2
    px[oy:oy + h, ox:ox + w, :3] = kwant[..., :3]
    px[oy:oy + h, ox:ox + w, 3] = kwant[..., 3]
    cien_kontaktowy(px, oy + h, ox, ox + w)
    return _na_cwiartki(px)


# ── WOLNOSTOJACY KOMIN: 1x2, ta sama technika ciosow, bez luku ─────────────

def _polki_tierow(px, tiery):
    """Miedzy kazda para tierow: jasna POLKA tam, gdzie dolny tier jest
    SZERSZY (odslonieta powierzchnia lapie swiatlo z gory), albo ciemny
    CIEN tam, gdzie gorny tier go zaslania (nawis). Bez tego stopnie nie
    czytaja sie jako bryla, tylko jako plaskie pasy."""
    for i in range(1, len(tiery)):
        _y0u, _y1u, x0u, x1u = tiery[i - 1]
        y0l, _y1l, x0l, x1l = tiery[i]
        if x0l < x0u:
            prostokat(px, y0l, y0l + 2, x0l, x0u, S[3])
            prostokat(px, y0l + 2, y0l + 3, x0l, x0u, S[1])
        if x1l > x1u:
            prostokat(px, y0l, y0l + 2, x1u, x1l, S[3])
            prostokat(px, y0l + 2, y0l + 3, x1u, x1l, S[1])
        if x0l > x0u or x1l < x1u:
            prostokat(px, y0l, y0l + 2, max(x0l, x0u), min(x1l, x1u), S[0], 130)


KOMIN_TIERY = [(0, 10, 9, 23), (10, 64, 4, 28)]


def _komin_pelny(ziarno):
    px = np.zeros((64, T, 4), np.uint8)
    los = np.random.default_rng(1300 + ziarno)
    for y0, y1, x0, x1 in KOMIN_TIERY:
        ciosy(px, y0, y1, x0, x1, los, S, kurs=6)
    _polki_tierow(px, KOMIN_TIERY)
    prostokat(px, 0, 6, 9, 23, N[1], 150)
    prostokat(px, 0, 3, 12, 20, N[0])
    cien_kontaktowy(px, 62, 3, 29)
    return px


def komin_gora(ziarno):
    return _komin_pelny(ziarno)[0:32].copy()


def komin_dol(ziarno):
    return _komin_pelny(ziarno)[32:64].copy()


# ── MIECH KOWALSKI ───────────────────────────────────────────────────────────

def miech(ziarno):
    """Skorzany WACHLARZ: polowa szerokosci ROSNIE SZYBKO od zawiasu, potem
    OPADA WOLNO ku obejmie — asymetryczna kropla, nie symetryczna soczewka.
    Druga proba (sinus, symetryczny) dala okragly bochenek, zgloszony jako
    „wyglada jak kamien/kupa” — okrągłość byla winna, nie kolor. Trzecia
    proba: szybki narost + wolny spadek (kometa), plus TWARDY ciemny SZEW
    na osi (tam, gdzie schodza sie gorna i dolna deska) — to jest jedyny
    pojedynczy piksel, po ktorym miech czyta sie jako DWIE plyty, a nie
    jedna bryla."""
    px = pusty()
    los = np.random.default_rng(1400 + ziarno)
    cy = 16
    x0, xpik, x1w, x1 = 2, 7, 21, 30
    for x in range(x0, x1w):
        if x < xpik:
            f = (x - x0) / (xpik - x0)
            pol = 1 + 10 * f
        else:
            f = (x - xpik) / (x1w - xpik)
            pol = 11 * (1 - f) ** 0.72 + 2.2 * f
        y0, y1 = int(round(cy - pol)), int(round(cy + pol)) + 1
        for y in range(y0, y1):
            gorna = y < cy
            st = 3 if (y == y0 or y == y0 + 1) else (2 if gorna else 1)
            kladz(px, y, x, D[st] if gorna else K[st])
        kladz(px, y0, x, D[4])
        kladz(px, y1 - 1, x, K[0])
    # szew na osi — dzieli plyte gorna od dolnej na CALEJ dlugosci wachlarza
    prostokat(px, cy, cy + 1, x0, x1w, K[0], 210)
    # trzy przekatne kreski slojow, wyrazniejsze niz poprzednio
    for faza in (2, 7, 13):
        for i in range(9):
            x = x0 + 3 + faza - i // 2
            y = cy - 7 + i
            if x0 <= x < x1w and y != cy and px[y, x, 3]:
                st = 1 if y < cy else 0
                kladz(px, y, x, (D if y < cy else K)[st], 150)
    # obejma i dziob mosiezny, zwezajace sie do punktu
    for x in range(x1w, x1):
        f = (x - x1w) / (x1 - x1w)
        pol = max(0.6, 2.4 * (1 - f) + 0.6)
        y0, y1 = int(round(cy - pol)), int(round(cy + pol)) + 1
        st = 1 if f < 0.3 else 2
        prostokat(px, y0, y1, x, x + 1, S[st])
    kladz(px, cy, x1, S[4])
    kladz(px, cy, x1 - 1, S[3])
    kladz(px, cy - 1, x1w, S[0])
    # rekojesc przy samym zawiasie (waski koniec)
    prostokat(px, cy - 12, cy - 7, x0 - 1, x0 + 3, D[3])
    prostokat(px, cy - 12, cy - 11, x0 - 1, x0 + 3, D[4])
    # noga podpierajaca pod spodem wachlarza
    prostokat(px, cy + 10, T - 2, x0 + 7, x0 + 10, K[1])
    kladz(px, cy + 10, x0 + 7, K[3])
    cien_kontaktowy(px, T - 1, x0, x1 + 1)
    return px


# ── KOWADLA: WYCIETE Z Nature_v1_backup.png, DOKWANTOWANE ───────────────────
#
# Ten sam ruch co przy piecu: proceduralny profil boczny na wlasnorecznie
# rysowanym pniu zostal odrzucony na rzecz gotowego sprite'a z tego samego
# arkusza — kowadlo na kamiennym postumencie, jednolicie szare (bez
# akcentu drewna), zgloszone jako „o wiele lepsze”. Kolory zrodla sa juz
# NIEMAL dokladnie rampa `kamien`/`neutralne` — `_skwantuj` tylko domyka je
# do dozwolonych stopni.
_KOWADLO_BOX = (166, 239, 195, 257)


def kowadlo(ziarno, duze):
    sub = _wytnij_z_nature(*_KOWADLO_BOX)
    kwant = _skwantuj(sub, lambda r, g, b: _KAMIEN_KAND)
    if not duze:
        obraz = Image.fromarray(kwant)
        nw, nh = max(1, int(round(kwant.shape[1] * 0.78))), max(1, int(round(kwant.shape[0] * 0.78)))
        kwant = np.array(obraz.resize((nw, nh), Image.NEAREST))
    h, w = kwant.shape[:2]
    px = pusty()
    oy, ox = T - 3 - h, (T - w) // 2
    px[oy:oy + h, ox:ox + w, :3] = kwant[..., :3]
    px[oy:oy + h, ox:ox + w, 3] = kwant[..., 3]
    cien_kontaktowy(px, oy + h, ox, ox + w)
    return px


# ── STOLY ROBOCZE: 2x1 ───────────────────────────────────────────────────────

def stol(ziarno, metalowy):
    lewy, prawy = pusty(), pusty()
    los = np.random.default_rng(1500 + ziarno)
    top_y0, top_y1 = 5, 22
    for px, x0, x1 in ((lewy, 2, T), (prawy, 0, T - 2)):
        if metalowy:
            blok(px, top_y0, top_y1, x0, x1, S, 3)
            prostokat(px, top_y0 + 1, top_y0 + 2, x0 + 1, x1 - 1, S[4])
            # przypalenie / plama pracy
            if px is lewy:
                for _ in range(6):
                    cx = int(los.integers(x0 + 4, x1 - 2))
                    cy = int(los.integers(top_y0 + 3, top_y1 - 2))
                    kladz(px, cy, cx, N[1], 140)
            # nity w rogach
            for cx in (x0 + 2, x1 - 3):
                for cy in (top_y0 + 2, top_y1 - 3):
                    kladz(px, cy, cx, S[0])
                    kladz(px, cy, cx + 1, S[4])
        else:
            deski_top(px, top_y0, top_y1, x0, x1, D, los, okres=7)
        # nogi widoczne pod blatem
        for lx in (x0 + 2, x1 - 4):
            prostokat(px, top_y1, T - 2, lx, lx + 3, K[1])
            prostokat(px, top_y1, top_y1 + 1, lx, lx + 3, K[3])
        cien_kontaktowy(px, T - 2, x0, x1)
    return lewy, prawy


# ── KOLA: WYCIETE Z grind.png, DOKWANTOWANE ──────────────────────────────────
#
# Ten sam ruch co przy piecu/kowadle: proceduralna rama (pionowe slupki +
# tarcza) ustapila gotowemu sprite'owi z grind.png (wlasny material usera,
# Gemini, bez problemu licencyjnego). Arkusz ma 5 niemal identycznych
# wariantow tej samej kolyski-z-korbka — wybrany jeden (srodkowy, najlepiej
# wykadrowany), duzy/maly to ten sam sprite w dwoch skalach, jak
# kowadlo_duze/kowadlo_male.
_GRIND_BOX = (32, 36, 55, 62)


def _kolo_z_grind(ziarno, skala):
    sub = _wytnij_zielony("grind.png", _GRIND_BOX)
    kwant = _skwantuj(_przeskaluj(sub, skala), _klasyfikuj_kamien_drewno)
    h, w = kwant.shape[:2]
    px = pusty()
    oy, ox = T - 3 - h, (T - w) // 2
    px[oy:oy + h, ox:ox + w, :3] = kwant[..., :3]
    px[oy:oy + h, ox:ox + w, 3] = kwant[..., 3]
    cien_kontaktowy(px, oy + h, ox, ox + w)
    return px


def tocznia(ziarno):
    return _kolo_z_grind(ziarno, skala=1.0)


def osełka(ziarno):
    return _kolo_z_grind(ziarno, skala=0.75)


# ── PRZECHOWYWANIE: WYCIETE Z tools.png, DOKWANTOWANE ───────────────────────
#
# Uzupelnienie od uzytkownika — czwarty wlasny material Gemini (bez problemu
# licencyjnego), ten sam ruch co piec.png/grind.png: cztery gotowe sprite'y,
# wyciete i dokwantowane do palety zamiast rysowane proceduralnie. Wspolny
# klasyfikator kamien/drewno (`_klasyfikuj_kamien_drewno`) dziala tu bez
# zmian — bron/metal na rampie `kamien`, rama/worek na `drewno`+`kora`.
#
# Wszystkie cztery skalowane tak, zeby dluzszy bok wyszedl ~30px — ta sama
# klasa rozmiaru co kowadlo/kola obok, wiec grupa zostaje jednolita, nie
# rosnie o wielokaflowe propy bez potrzeby.
_STOJAK_NARZEDZI_BOX = (10, 18, 56, 51)
_STOJAK_BRONI_BOX = (70, 14, 119, 57)
_WOREK_WEGLA_BOX = (11, 75, 53, 116)
_SKRZYNIA_RUDY_BOX = (72, 73, 120, 121)


def _prop_z_tools(box, cel=30, plik="tools.png"):
    sub = _wytnij_zielony(plik, box)
    skala = cel / max(sub.shape[0], sub.shape[1])
    kwant = _skwantuj(_przeskaluj(sub, skala), _klasyfikuj_kamien_drewno)
    h, w = kwant.shape[:2]
    px = pusty()
    oy, ox = T - 2 - h, (T - w) // 2
    px[oy:oy + h, ox:ox + w, :3] = kwant[..., :3]
    px[oy:oy + h, ox:ox + w, 3] = kwant[..., 3]
    cien_kontaktowy(px, oy + h, ox, ox + w)
    return px


def stojak_narzedzi(ziarno):
    return _prop_z_tools(_STOJAK_NARZEDZI_BOX)


def stojak_broni(ziarno):
    return _prop_z_tools(_STOJAK_BRONI_BOX)


def worek_wegla(ziarno):
    return _prop_z_tools(_WOREK_WEGLA_BOX)


def skrzynia_rudy(ziarno):
    return _prop_z_tools(_SKRZYNIA_RUDY_BOX)


# ── DALSZE WYPOSAZENIE: WYCIETE Z kowal.png, DOKWANTOWANE ───────────────────
#
# Drugie uzupelnienie od uzytkownika. `kowal.png` niesie TAKZE postac kowala
# — ta, na wyrazne zyczenie, NIE jest wycinana (inna domena pikseli: paleta
# skory/ubrania postaci, nie paleta swiata z docs/paleta.json; ma byc
# PRZERYSOWANA w naszym stylu, nie skopiowana — patrz public/assets/README.md).
# Cztery meble z tego samego arkusza sa jednak wyciete tym samym trybem co
# tools.png/grind.png — ta sama zgoda, ten sam klasyfikator.
_ZBROJA_BOX = (135, 4, 197, 106)
_STOL_IMADLO_BOX = (4, 116, 101, 177)
_STOL_HAKI_BOX = (8, 188, 100, 248)
_SZAFKA_NARZEDZI_BOX = (120, 170, 174, 256)


def stojak_zbroi(ziarno):
    return _prop_z_tools(_ZBROJA_BOX, plik="kowal.png")


def szafka_narzedzi(ziarno):
    return _prop_z_tools(_SZAFKA_NARZEDZI_BOX, plik="kowal.png")


def _stol_szeroki_z_tools(box, plik="kowal.png", kafle_szer=2):
    """Jak `_prop_z_tools`, ale na plotnie SZEROKIM NA `kafle_szer` KAFLI.

    Stol_imadlo/stol_haki maja drobny detal na blacie (hak, szczypce,
    plytki) — pierwsza wersja wpychala je w jeden kafel (cel=30px), tak samo
    jak zwarte propy typu worek czy skrzynia, i przy tej skali detal
    rozsypywal sie w szum: „wyglada jak brud na desce”. Naprawa: wieksze
    plotno = wieksza rozdzielczosc zrodla przetrwana po skalowaniu, ten sam
    powod co przy `stol()` (2x1) i przy piecu (2x2)."""
    sub = _wytnij_zielony(plik, box)
    plotno_w = T * kafle_szer
    skala = min((plotno_w - 6) / sub.shape[1], (T - 3) / sub.shape[0])
    kwant = _skwantuj(_przeskaluj(sub, skala), _klasyfikuj_kamien_drewno)
    h, w = kwant.shape[:2]
    px = np.zeros((T, plotno_w, 4), np.uint8)
    oy, ox = T - 2 - h, (plotno_w - w) // 2
    px[oy:oy + h, ox:ox + w, :3] = kwant[..., :3]
    px[oy:oy + h, ox:ox + w, 3] = kwant[..., 3]
    cien_kontaktowy(px, oy + h, ox, ox + w)
    return px[:, 0:T].copy(), px[:, T:plotno_w].copy()


def stol_imadlo(ziarno):
    return _stol_szeroki_z_tools(_STOL_IMADLO_BOX)


def stol_haki(ziarno):
    return _stol_szeroki_z_tools(_STOL_HAKI_BOX)


# ── KATALOG I UKLAD ARKUSZA ──────────────────────────────────────────────────
#
# (nazwa, wariant) -> (kolumna, wiersz, tablica pikseli). Uklad recznу, bo to
# nie jest system modularny jak sciany/dach — kazdy prop jest samodzielny,
# jak rekwizyty (stog/koryto) w Buildings.png.

def zbuduj_kafle():
    """Faza 1, ZAWEZONA na zyczenie: tylko to, co stoi FIZYCZNIE PRZY piecu —
    piec, kowadla i kola szlifierskie, miech. Wolnostojacy komin proceduralny
    ZDJETY z arkusza — jedyny w tej grupie kawalek bez zrodla w Gemini-
    materialach usera (piec.png/grind.png/Nature_v1_backup.png), i to bylo
    widac: "odstaje od reszty". Stoly robocze (tez proceduralne) zdjete
    wczesniej z tego samego powodu zbednosci na razie. Obie funkcje
    (`stol`, `_komin_pelny`/`komin_gora`/`komin_dol`) zostaja w skrypcie
    nieuzywane, gdyby ktora z nich byla potrzebna pozniej."""
    k = {}

    # wiersze 0-1: piec (3 stany, 2x2 kazdy), a W TYM SAMYM PASIE (wiersz
    # dolny) zaraz obok — kowadla, kola szlifierskie, miech.
    col = 0
    for nazwa, stan in (("piec_zimny", "zimny"), ("piec_rozpalony", "rozpalony"),
                        ("piec_wygaszony", "wygaszony")):
        cwiartki = piec(col, stan)
        k[(nazwa, "lg")] = (col, 0, cwiartki["lg"])
        k[(nazwa, "pg")] = (col + 1, 0, cwiartki["pg"])
        k[(nazwa, "ld")] = (col, 1, cwiartki["ld"])
        k[(nazwa, "pd")] = (col + 1, 1, cwiartki["pd"])
        col += 2

    # kowadla i kola szlifierskie — obok pieca
    k[("kowadlo_duze", 0)] = (col, 1, kowadlo(1, duze=True)); col += 1
    k[("kowadlo_male", 0)] = (col, 1, kowadlo(2, duze=False)); col += 1
    k[("tocznia", 0)] = (col, 1, tocznia(3)); col += 1
    k[("osełka", 0)] = (col, 1, osełka(4)); col += 1

    # miech — na koncu tej samej grupy
    k[("miech", 0)] = (col, 1, miech(0)); col += 1

    # przechowywanie z tools.png — dalszy ciag tego samego pasa
    k[("stojak_narzedzi", 0)] = (col, 1, stojak_narzedzi(5)); col += 1
    k[("stojak_broni", 0)] = (col, 1, stojak_broni(6)); col += 1
    k[("worek_wegla", 0)] = (col, 1, worek_wegla(7)); col += 1
    k[("skrzynia_rudy", 0)] = (col, 1, skrzynia_rudy(8))

    # wiersz 2: dalsze wyposazenie z kowal.png (bez samej postaci — patrz
    # naglowek nad `stojak_zbroi`), nowy pas bo poprzedni jest juz pelny
    # (19 kolumn)
    col2 = 0
    k[("stojak_zbroi", 0)] = (col2, 2, stojak_zbroi(9)); col2 += 1
    l, p = stol_imadlo(10)
    k[("stol_imadlo", 0)] = (col2, 2, l); k[("stol_imadlo", 1)] = (col2 + 1, 2, p); col2 += 2
    l, p = stol_haki(11)
    k[("stol_haki", 0)] = (col2, 2, l); k[("stol_haki", 1)] = (col2 + 1, 2, p); col2 += 2
    k[("szafka_narzedzi", 0)] = (col2, 2, szafka_narzedzi(12))

    return k


def render_podglad(kafle, sciezka, skala=6):
    """Skleja kafle DOKLADNIE tak, jak leza w arkuszu (te same kolumna/wiersz)
    na drewnianej podlodze — to ma pokazac piec, kowadla, kola i miech jako
    JEDNA sasiadujaca grupa robocza, nie osobne wycinki. Kafel ogladany
    osobno klamie, patrz lekcja z build_budynki.py."""
    max_c = max(c for c, _w, _p in kafle.values()) + 1
    max_w = max(w for _c, w, _p in kafle.values()) + 1
    plotno = np.zeros((max_w * T, max_c * T, 4), np.uint8)
    for y in range(plotno.shape[0]):
        for x in range(plotno.shape[1]):
            plotno[y, x, :3] = D[1 if (x // 8 + y // 3) % 5 else 2]
    plotno[..., 3] = 255
    for (_n, _i), (col, w, tile) in kafle.items():
        y0, x0 = w * T, col * T
        a = tile[..., 3:4].astype(float) / 255.0
        pod = plotno[y0:y0 + T, x0:x0 + T, :3].astype(float)
        plotno[y0:y0 + T, x0:x0 + T, :3] = (tile[..., :3] * a + pod * (1 - a)).astype(np.uint8)
    obraz = Image.fromarray(plotno).convert("RGB")
    obraz = obraz.resize((obraz.width * skala, obraz.height * skala), Image.NEAREST)
    obraz.save(sciezka)
    print("-> %s" % sciezka)


def main(zapisz, podglad):
    kafle = zbuduj_kafle()
    print("KUZNIA — faza 1: piec, komin, stanowiska robocze (%d kafli)" % len(kafle))
    for (n, i), (col, w, _px) in sorted(kafle.items(), key=lambda kv: (kv[1][1], kv[1][0])):
        print("  %-20s kolumna %2d, wiersz %d" % ("%s/%s" % (n, i), col, w))

    if podglad:
        render_podglad(kafle, podglad)

    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return

    wierszy = max(w for _c, w, _p in kafle.values()) + 1
    ark = np.zeros((wierszy * PITCH - 1, COLS * PITCH - 1 + 14, 4), np.uint8)
    for (_n, _i), (col, w, tile) in kafle.items():
        ark[w * PITCH:w * PITCH + T, col * PITCH:col * PITCH + T] = tile
    Image.fromarray(ark).save(os.path.join(ASSETS, "Kuznia.png"))
    print("\n-> public/assets/Kuznia.png %dx%d (%d wierszy, %d kolumn)"
          % (ark.shape[1], ark.shape[0], wierszy, COLS))

    katalog = {"%s_%s" % (n, i): {"kolumna": col, "wiersz": w, "id": w * COLS + col}
               for (n, i), (col, w, _px) in kafle.items()}
    with open(os.path.join(DOCS, "kuznia.json"), "w", encoding="utf-8") as f:
        json.dump({"arkusz": {"kolumny": COLS, "wierszy": wierszy,
                              "szerokosc": ark.shape[1], "wysokosc": ark.shape[0],
                              "kafli": wierszy * COLS},
                   "kafle": katalog}, f, indent=1, ensure_ascii=False)
    print("-> docs/kuznia.json  (katalog kafli + wymiary arkusza)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Tileset wnetrza kuzni. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true", help="nadpisz Kuznia.png")
    ap.add_argument("--podglad", metavar="PLIK.png",
                    help="zloz wszystkie propy obok siebie i zapisz podglad "
                         "(NIE do public/assets — to plik roboczy)")
    a = ap.parse_args()
    main(a.zapisz, a.podglad)

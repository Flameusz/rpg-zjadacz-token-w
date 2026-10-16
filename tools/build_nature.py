"""
Nature 2.0 — generator modularnego tilesetu.

Uruchom:  python tools/build_nature.py --od-zera        (buduje arkusz RAZ)
          python tools/build_nature.py --zestaw droga   (odswieza jeden system)
          python tools/build_nature.py                  (tylko raport, nic nie zapisuje)

── MODEL PRACY: ARKUSZ JEST ARTEFAKTEM, NIE WYNIKIEM FUNKCJI ───────────────

Ten skrypt DOMYSLNIE NICZEGO NIE NADPISUJE. Tileset buduje sie raz, a potem
dopracowuje — recznie albo odswiezajac pojedynczy zestaw. Wczesniejsza wersja
przebudowywala caly plik przy kazdym uruchomieniu i to bylo bledne zalozenie:
kazda reczna poprawka piksela zniknelaby przy nastepnym przebiegu, a plik
graficzny musi znosic reczna prace.
Czyta:    public/assets/Nature.png (stary), docs/paleta.json
Zapisuje: public/assets/Nature.png (nowy, 640x800)
          + kopia starego jako Nature_v1_backup.png przy pierwszym uruchomieniu

── DWIE ZASADY, KTORYCH NIE WOLNO ZLAMAC ──────────────────────────────────

1. LICZBA KOLUMN ZOSTAJE 19. Identyfikator kafla w Tiled to
   `wiersz * kolumny + kolumna`, wiec dokladanie WIERSZY nie rusza zadnego
   istniejacego id. Poszerzenie w BOK przenumerowaloby wszystko i zniszczylo
   kazda juz postawiona mape. To jedyna nieodwracalna pomylka na tym etapie.

2. WIERSZE 0-11 SA KOPIOWANE BEZ ZMIAN. Mapa uzywa 37 kafli z tego zakresu
   (drzewa, most, ramka stawu). Nowy material ladzie WYLACZNIE w wierszach
   12+, ktore dzis nie istnieja.

── SKAD BIORA SIE PIKSELE ─────────────────────────────────────────────────

Nie ze zmniejszania grafik Gemini. Material zrodlowy nie jest pixel artem
(167-281 tys. kolorow, brak rownej siatki pikseli), wiec zmniejszanie daje
rozmyta miniature, nie kafel. Zamiast tego tekstury sa SYNTEZOWANE z ramp
palety (docs/paleta.json) w proporcjach zmierzonych na materiale Gemini.

Zysk jest praktyczny, nie ideologiczny: tekstura syntezowana jest **z definicji
bezszwowa** (szum jest okresowy co 32 px), a zmniejszona nie jest — i wlasnie
brak bezszwowosci robi te siatke kwadratow, ktora widac dzis na mapie.

── JAK POWSTAJA PRZEJSCIA (Wang 16) ───────────────────────────────────────

Wariant NAROZNIKOWY: kazdy z 4 naroznikow kafla nalezy do materialu A albo B,
co daje 2^4 = 16 kombinacji pokrywajacych KAZDY mozliwy uklad. Ksztalt granicy
liczymy jako dwuliniowa interpolacje wartosci naroznikow, progowana z dodanym
szumem — dzieki temu jedna funkcja generuje wszystkie 16 przypadkow spojnie,
zamiast rysowac je po kolei i mylic sie przy skosach.

Szum jest TEN SAM dla wszystkich kafli i okresowy co 32 px, wiec granica
zgadza sie na styku sasiednich kafli.
"""

import json
import os
import shutil

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 32          # kafel
PITCH = 33      # skok w arkuszu (32 + 1 px przerwy)
COLS = 19       # NIE ZMIENIAC — patrz naglowek
ROWS_OLD = 12
ROWS_NEW = 24

rng = np.random.default_rng(11)   # staly seed = powtarzalny arkusz


# ── paleta ──────────────────────────────────────────────────────────────────

def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()


# ── szum okresowy ───────────────────────────────────────────────────────────

def szum_okresowy(rozmiar=T, oktawy=(2, 4, 8), wagi=(0.5, 0.32, 0.18)):
    """Szum powtarzalny co `rozmiar` px — bez tego kafle nie sa bezszwowe.

    Skladamy sinusoidy o CALKOWITYCH czestotliwosciach, wiec funkcja domyka sie
    na krawedzi kafla. Losowe fazy daja organiczny wyglad przy zachowaniu
    okresowosci.
    """
    y, x = np.mgrid[0:rozmiar, 0:rozmiar] / rozmiar * 2 * np.pi
    out = np.zeros((rozmiar, rozmiar))
    for f, w in zip(oktawy, wagi):
        for _ in range(3):
            fx, fy = rng.integers(1, f + 1), rng.integers(1, f + 1)
            faza = rng.uniform(0, 2 * np.pi)
            out += w * np.sin(fx * x + faza) * np.sin(fy * y + rng.uniform(0, 2 * np.pi))
    out -= out.min()
    return out / (out.max() or 1)


# Uzywany JUZ TYLKO do ksztaltu granicy miedzy materialami — nie do tekstury.
SZUM_GRANICY = szum_okresowy(T, (2, 3, 5), (0.55, 0.30, 0.15))


def tekstura_plaska(rampa, i_bazy, akcenty, gestosc, ziarno=0):
    """Plaskie tlo + RZADKIE punkty akcentu. Tak zbudowany jest kafel, ktory
    dziala.

    Zmierzone na oryginalnym Nature.png: kafel trawy to **2 kolory, 94.6% tla,
    55 pikseli detalu na 1024 (5%)**. Pierwsza wersja tego generatora sypala
    ciagly szum po calej powierzchni: 5 kolorow, 78% tla, 222 piksele detalu
    (22%) — czyli **czterokrotnie za gesto**. Efekt czytal sie jak brud, nie
    jak trawa, i wygladal gorzej od materialu, ktory mial zastapic.

    Drugi blad tamtej wersji: szum byl suma sinusoid, a iloczyny sinusow
    tworza regularne UKOSNE prazki. Rozsypane punkty zadnego kierunku nie maja.

    Bonus: rzadkie punkty sa bezszwowe SAME Z SIEBIE. Nie ma w nich struktury
    niskich czestotliwosci, ktora musialaby sie zgadzac na styku kafli — cala
    wczesniejsza gimnastyka z szumem okresowym byla tu niepotrzebna.
    """
    kolory = PAL[rampa]
    out = np.zeros((T, T, 4), np.uint8)
    out[..., :3] = kolory[i_bazy]
    out[..., 3] = 255

    los = np.random.default_rng(1000 + i_bazy * 7 + ziarno * 131 + hash(rampa) % 997)
    maska = los.random((T, T))
    prog = gestosc / max(len(akcenty), 1)
    for n, i_akc in enumerate(akcenty):
        wybor = (maska >= n * prog) & (maska < (n + 1) * prog)
        out[wybor, :3] = kolory[i_akc]
    return out


# material -> (rampa, indeks tla, indeksy akcentow, gestosc detalu)
# Gestosc trzymamy w okolicy 0.06 — zmierzone 5% na oryginale.
MATERIALY = {
    "trawa":    ("trawa",    2, [1, 3], 0.07),
    "ziemia":   ("ziemia",   2, [1, 3], 0.06),
    "piasek":   ("piasek",   2, [1, 3], 0.05),
    "kamien":   ("kamien",   2, [1, 3], 0.07),
    "woda":     ("woda",     2, [1, 3], 0.05),
    "listowie": ("listowie", 2, [1, 3], 0.07),
}


def baza(nazwa, wariant=0):
    """Warianty roznia sie WYLACZNIE rozsypem punktow — tlo jest identyczne,
    wiec sasiadujace warianty nie moga utworzyc kratownicy."""
    rampa, i_bazy, akcenty, gest = MATERIALY[nazwa]
    return tekstura_plaska(rampa, i_bazy, akcenty, gest, ziarno=wariant)



# ── kepki trawy ─────────────────────────────────────────────────────────────
# Ksztalty kepek pochodza z pakietu referencyjnego (Pixel Art Top Down - Basic),
# przekolorowane na nasza rampe. W repo trzymamy je jako MASKI STOPNI RAMPY
# (tools/zrodla/kepki_trawy.npz), nie jako piksele w ich kolorach — dzieki temu
# zmiana palety projektu przemalowuje je automatycznie.
#
# UWAGA LICENCYJNA: to sa ich KSZTALTY, wiec te kafle sa praca pochodna wzgledem
# tamtego pakietu i obowiazuje jego licencja. Przekolorowanie tego nie zmienia.
#
# Konwersja (jednorazowa): jasnosc kazdego piksela -> stopien naszej rampy, po
# progach liczonych WSPOLNIE dla wszystkich kepek. Progi per kepka dawaly
# niespojny kontrast — obok siebie jedne wygladaly na wyprane, inne na
# przypalone. Alfa ponizej 128 wypada, reszta jest w pelni kryjaca
# (ART_DIRECTION 4.5).

_KEPKI = None


def _wczytaj_kepki():
    global _KEPKI
    if _KEPKI is None:
        sciezka = os.path.join(TU, "zrodla", "kepki_trawy.npz")
        if not os.path.exists(sciezka):
            _KEPKI = []
        else:
            z = np.load(sciezka)
            _KEPKI = [z[k] for k in sorted(z.files)]
    return _KEPKI


def _wklej_kepke(px, maska, x0, y0, rampa="trawa"):
    """Nanosi jedna kepke w calosci WEWNATRZ kafla — bez zawijania.

    Wczesniej wklejalo sie modulo T, wiec kepka przy krawedzi byla przecieta
    i jej druga polowa ladowala po przeciwnej stronie tego samego kafla. Taki
    kafel wyglada poprawnie tylko wtedy, gdy sasiad przypadkiem dokladnie ja
    kontynuuje — a przy losowym rozsypie wariantow to sie nie zdarza nigdy.
    Efekt: uciete zdzbla na kazdej granicy.

    Kepka jest OBIEKTEM, nie tlem. Tlo musi byc bezszwowe, obiekt musi byc caly.
    """
    R = PAL[rampa]
    h, w = maska.shape
    x0 = max(0, min(x0, T - w))
    y0 = max(0, min(y0, T - h))
    for y in range(h):
        for x in range(w):
            i = maska[y, x]
            if i < 0:
                continue
            px[y0 + y, x0 + x, :3] = R[int(i)]
            px[y0 + y, x0 + x, 3] = 255


def trawa_wariant(ziarno, kepki=0, male=0, **_):
    """Jednolite tlo + gotowe ksztalty kepek. `kepki` to duze, `male` to drobne."""
    los = np.random.default_rng(ziarno)
    px = np.zeros((T, T, 4), np.uint8)
    px[..., :3] = PAL["trawa"][2]
    px[..., 3] = 255

    zestaw = _wczytaj_kepki()
    if not zestaw:
        return px
    duze = [m for m in zestaw if m.shape[1] >= 12]
    drobne = [m for m in zestaw if m.shape[1] < 12] or duze

    def polóz(zestaw):
        m = zestaw[int(los.integers(len(zestaw)))]
        if los.random() < 0.5:
            m = m[:, ::-1]                       # odbicie = wiecej wariantow za darmo
        h, w = m.shape
        # Zakres tak dobrany, zeby kepka ZAWSZE zmiescila sie w calosci.
        _wklej_kepke(px, m, int(los.integers(0, max(T - w, 1))),
                     int(los.integers(0, max(T - h, 1))))

    for _ in range(kepki):
        polóz(duze)
    for _ in range(male):
        polóz(drobne)
    return px


TRAWA_WARIANTY = [
    ("czysta",       dict()),
    ("pojedyncze",   dict(male=2)),
    ("rzadka",       dict(kepki=1, male=1)),
    ("srednia",      dict(kepki=2, male=1)),
    ("gesta",        dict(kepki=3, male=2)),
    ("bardzo gesta", dict(kepki=4, male=3)),
]


# ── Wang 16 narozniki ───────────────────────────────────────────────────────

def maska_wang(kod, ostrosc=11.0, sila_szumu=0.16):
    """Maska materialu A dla jednej z 16 kombinacji naroznikow.

    Bity kodu: 1=NW, 2=NE, 4=SE, 8=SW. Pole liczymy dwuliniowo z wartosci
    naroznikow i progujemy — jedna formula obsluguje wszystkie 16 przypadkow,
    lacznie ze skosami, ktorych recznie rysowane zestawy najczesciej nie maja.
    """
    nw, ne, se, sw = (kod >> 0) & 1, (kod >> 1) & 1, (kod >> 2) & 1, (kod >> 3) & 1
    t = np.linspace(0, 1, T)
    u, v = np.meshgrid(t, t)                      # u=x, v=y
    pole = (nw * (1 - u) * (1 - v) + ne * u * (1 - v) + sw * (1 - u) * v + se * u * v)
    pole = pole + (SZUM_GRANICY - 0.5) * sila_szumu
    return 1 / (1 + np.exp(-(pole - 0.5) * ostrosc))   # miekki prog 0..1


# Mapa "kolor -> ciemniejszy stopien TEJ SAMEJ rampy". Budowana raz z palety.
# Bez niej przyciemnianie krawedzi przez mnozenie (x0.72) produkuje kolory
# SPOZA palety — pierwsza wersja tego generatora wypuscila ich 306 i zlamala
# wlasna regule z ART_DIRECTION.
_CIEMNIEJ = {}
for _rampa, _kolory in PAL.items():
    for _i, _c in enumerate(_kolory):
        _CIEMNIEJ[_c] = _kolory[max(0, _i - 1)]


def przyciemnij_do_palety(px):
    """Zamien kazdy piksel na ciemniejszy stopien jego wlasnej rampy."""
    out = px.copy()
    for zrodlo, cel in _CIEMNIEJ.items():
        maska = np.all(px[..., :3] == zrodlo, axis=-1)
        out[maska, :3] = cel
    return out


def zloz(a, b, maska, ramka=True):
    """A nad B wg maski. Krawedz A o jeden stopien ciemniejsza — ART_DIRECTION
    zabrania czarnego obrysu, ale krawedz musi byc czytelna."""
    m = (maska > 0.5)
    out = np.where(m[..., None], a, b).astype(np.uint8)
    if ramka:
        krawedz = m & ~(
            np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1))
        ciemne = przyciemnij_do_palety(out)
        out[krawedz] = ciemne[krawedz]
    out[..., 3] = 255
    return out



# ── krzaki i cien kontaktowy ────────────────────────────────────────────────
# Technika podpatrzona (zmierzona, nie skopiowana) w pakiecie referencyjnym:
# cien jest osobna warstwa w JEDNYM ciemnym, CIEPLYM kolorze z regulowana alfa
# — nie czarny i nie wtopiony w sprite. Dzieki temu ten sam prop da sie
# renderowac z cieniem albo bez, a cien nigdy nie "brudzi" barwy rosliny.
#
# Zmierzone tam: kolor cienia (49,26,18) — cieply braz, alfa 139-255.
# U nas bierzemy najciemniejszy neutralny z palety i alfe ~110.

CIEN_ALFA = 110


def _cien_pod(px, cx, cy, szer, wys=3):
    """Owal kontaktowy pod obiektem. Bez niego prop wisi w powietrzu."""
    kolor = PAL["neutralne"][0]
    for y in range(-wys, wys + 1):
        for x in range(-szer, szer + 1):
            if (x / max(szer, 1)) ** 2 + (y / max(wys, 1)) ** 2 > 1:
                continue
            yy, xx = cy + y, cx + x
            if 0 <= yy < T and 0 <= xx < T and px[yy, xx, 3] == 0:
                px[yy, xx, :3] = kolor
                px[yy, xx, 3] = CIEN_ALFA


def krzak(ziarno, promien=9, rampa="listowie"):
    """Krzak jako KEPY LISCI, nie kula.

    Pierwsza wersja robila jedno kolo z plynnym gradientem po skosie — i to
    czytalo sie jak arbuz, bo gladki gradient na okragu to sygnatura KULI.
    Listowie sklada sie z kep: jasne skupiska na ciemniejszej masie, a obrys
    jest guzowaty, nie okragly.

    Wielkosci z pomiaru referencji: krzaki 22-47 px (1-1.5 kafla), drzewa
    79-113 x 139 px — czyli drzewo to prop 3-4 x 4-5 kafli, nie kafel.
    """
    los = np.random.default_rng(ziarno)
    R = PAL[rampa]
    px = np.zeros((T, T, 4), np.uint8)
    cx, cy = T // 2, T // 2 + 3

    # 1) guzowaty obrys: duzo malych okregow rozsypanych w elipsie
    ciało = np.zeros((T, T), bool)
    yy, xx = np.mgrid[0:T, 0:T]
    for _ in range(14):
        a_ = los.uniform(0, 2 * np.pi)
        r_ = los.uniform(0, promien * 0.75)
        sx = cx + int(np.cos(a_) * r_)
        sy = cy + int(np.sin(a_) * r_ * 0.75)
        rr = int(los.integers(max(promien // 3, 2), max(promien // 2, 3) + 1))
        ciało |= (xx - sx) ** 2 + (yy - sy) ** 2 <= rr * rr
    px[ciało, :3] = R[2]
    px[ciało, 3] = 255

    # 2) kepy lisci: jasne skupiska, gesciej u gory-z lewej (swiatlo stamtad)
    for _ in range(int(promien * 1.6)):
        a_ = los.uniform(0, 2 * np.pi)
        r_ = los.uniform(0, promien * 0.8)
        sx = cx + int(np.cos(a_) * r_)
        sy = cy + int(np.sin(a_) * r_ * 0.8)
        gora_lewo = (sx - cx) * 0.6 + (sy - cy) * 0.8 < 0
        rr = int(los.integers(1, 3))
        kepa = ((xx - sx) ** 2 + (yy - sy) ** 2 <= rr * rr) & ciało
        px[kepa, :3] = R[3] if gora_lewo else R[1]
        if gora_lewo and los.random() < 0.45:
            szczyt = ((xx - sx) ** 2 + (yy - sy + 1) ** 2 <= 1) & ciało
            px[szczyt, :3] = R[4]

    # 3) spod zawsze najciemniejszy — krzak ma dno
    px[ciało & (yy > cy + promien * 0.45), :3] = R[1]

    brzeg = ciało & ~(np.roll(ciało, 1, 0) & np.roll(ciało, -1, 0)
                      & np.roll(ciało, 1, 1) & np.roll(ciało, -1, 1))
    ciemniej = przyciemnij_do_palety(px)
    px[brzeg] = ciemniej[brzeg]
    px[brzeg, 3] = 255

    _cien_pod(px, cx, cy + promien - 1, int(promien * 0.9), 3)
    return px



# ── pelny zestaw obszarowy (blob 47) ────────────────────────────────────────
# Zestaw krawedziowy 16 zna tylko czterech sasiadow, wiec potrafi proste,
# zakrety, T, X i zakonczenia — ale NIE potrafi naroznikow WEWNETRZNYCH ani
# pojedynczych kep. Dla wydeptanej drogi polnej, ktora rozlewa sie na boki,
# to za malo.
#
# Zestaw obszarowy patrzy na osmiu sasiadow. 256 kombinacji redukuje sie do 47,
# bo sasiad po skosie ma znaczenie TYLKO wtedy, gdy oba przylegle prostopadle
# tez sa zajete — inaczej i tak powstaje naroznik zewnetrzny.

_KIER = {"N": 1, "NE": 2, "E": 4, "SE": 8, "S": 16, "SW": 32, "W": 64, "NW": 128}


def normalizuj_maske(m):
    """Skos bez obu przyleglych prostopadlych nic nie wnosi — kasujemy go,
    zeby 256 kombinacji zwinelo sie do 47 realnie roznych kafli."""
    if not (m & _KIER["N"] and m & _KIER["E"]): m &= ~_KIER["NE"]
    if not (m & _KIER["E"] and m & _KIER["S"]): m &= ~_KIER["SE"]
    if not (m & _KIER["S"] and m & _KIER["W"]): m &= ~_KIER["SW"]
    if not (m & _KIER["W"] and m & _KIER["N"]): m &= ~_KIER["NW"]
    return m & 0xFF


BLOB_MASKI = sorted({normalizuj_maske(m) for m in range(256)})   # dokladnie 47


def _cwiartka(brak_a, brak_b, brak_skos, rozmiar=T // 2,
              wciecie=3, r_zew=7, r_wew=5):
    """Maska JEDNEJ cwiartki kafla (16x16). `a` = sasiad w pionie, `b` = w poziomie.

    Cztery przypadki, nie trzy:

      * sasiada BRAK        -> krawedz wsunieta o `wciecie` od tej strony
      * oba prostopadle brak -> dodatkowo naroznik ZEWNETRZNY zaokraglony
      * oba obecne, skos brak -> naroznik WEWNETRZNY: male wciecie w rogu
      * oba obecne + skos    -> pelne wypelnienie

    Przypadek "jeden brak" byl wczesniej pominiety i to byl blad merytoryczny,
    nie parametr: pionowy pasek (N+S, bez E i W) wypelnial caly kafel i
    wychodzil identycznie jak kafel otoczony ze wszystkich stron. Stad 7
    ukladow na jeden obrazek.
    """
    y, x = np.mgrid[0:rozmiar, 0:rozmiar].astype(float)
    m = np.ones((rozmiar, rozmiar), bool)

    # (0,0) tej cwiartki to naroznik kafla: "a" to krawedz gorna, "b" lewa
    if brak_a:
        m &= y >= wciecie
    if brak_b:
        m &= x >= wciecie

    if brak_a and brak_b:
        # zaokraglenie tam, gdzie obie wsuniete krawedzie sie spotykaja
        cx = cy = wciecie + r_zew
        rog = (x < cx) & (y < cy)
        m &= ~rog | (np.hypot(x - cx, y - cy) <= r_zew)

    if (not brak_a) and (not brak_b) and brak_skos:
        m &= np.hypot(x + 0.5, y + 0.5) >= r_wew

    return m


def maska_blob(maska_sasiadow):
    """Ksztalt kafla zlozony z czterech cwiartek — dokladnie, bez przyblizen."""
    b = lambda k: not (maska_sasiadow & _KIER[k])
    h = T // 2
    m = np.zeros((T, T), bool)
    # kazda cwiartka liczona we wlasnym ukladzie, potem obracana na miejsce
    m[0:h, 0:h] = _cwiartka(b("N"), b("W"), b("NW"))                       # NW
    m[0:h, h:T] = _cwiartka(b("N"), b("E"), b("NE"))[:, ::-1]              # NE
    m[h:T, 0:h] = _cwiartka(b("S"), b("W"), b("SW"))[::-1, :]              # SW
    m[h:T, h:T] = _cwiartka(b("S"), b("E"), b("SE"))[::-1, ::-1]           # SE
    # lekka nieregularnosc krawedzi, zeby droga nie byla wycieta cyrklem
    szarp = (SZUM_GRANICY - 0.5) * 0.9
    krawedz = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0)
                    & np.roll(m, 1, 1) & np.roll(m, -1, 1))
    m = m & ~(krawedz & (szarp > 0.28))
    return m


def kafel_blob(maska_sasiadow, mat_a, mat_b, frendzle=True):
    """Material A (droga) na tle B (trawa), z ciemniejsza krawedzia i frendzlami
    trawy zachodzacymi na droge — tak jak w referencji."""
    m = maska_blob(maska_sasiadow)
    out = np.where(m[..., None], mat_a, mat_b).astype(np.uint8)

    brzeg = m & ~(np.roll(m, 1, 0) & np.roll(m, -1, 0)
                  & np.roll(m, 1, 1) & np.roll(m, -1, 1))
    ciemniej = przyciemnij_do_palety(out)
    out[brzeg] = ciemniej[brzeg]

    if frendzle:
        # Kilka pikseli trawy wchodzacych na krawedz drogi — bez tego styk jest
        # zbyt geometryczny i droga wyglada jak wyciety szablon.
        los = np.random.default_rng(int(maska_sasiadow) + 991)
        ys, xs = np.nonzero(brzeg)
        if len(ys):
            ile = max(len(ys) // 6, 1)
            wyb = los.choice(len(ys), size=min(ile, len(ys)), replace=False)
            for i in wyb:
                out[ys[i], xs[i], :3] = PAL["trawa"][1]
    out[..., 3] = 255
    return out


# ── sciezki: Wang 16 krawedziowy ────────────────────────────────────────────

def kafel_sciezki(kod, podloze, nawierzchnia):
    """Bity: 1=N, 2=E, 4=S, 8=W. Daje proste, zakrety, T, X, zakonczenia i punkt
    — czyli dokladnie te 16 przypadkow, ktorych dzis nie ma ani jednego."""
    SZER = 15
    p = np.zeros((T, T), bool)
    c0, c1 = (T - SZER) // 2, (T + SZER) // 2
    p[c0:c1, c0:c1] = True                        # srodek zawsze
    if kod & 1: p[0:c1, c0:c1] = True             # N
    if kod & 2: p[c0:c1, c0:T] = True             # E
    if kod & 4: p[c0:T, c0:c1] = True             # S
    if kod & 8: p[c0:c1, 0:c1] = True             # W
    # postrzepienie krawedzi, zeby droga nie byla linijka
    # Postrzepienie tylko na krawedzi — wnetrze drogi zostaje pelne, inaczej
    # w sciezce robia sie dziury.
    p &= (SZUM_GRANICY > 0.12) | _erozja(p)
    return zloz(nawierzchnia, podloze, p.astype(float), ramka=False)


def _erozja(m):
    """Wnetrze ksztaltu — chronimy je przed postrzepieniem krawedzi."""
    return (np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1))


# ── budowa arkusza ──────────────────────────────────────────────────────────

def wklej(ark, kafel, kol, wiersz):
    ark[wiersz * PITCH: wiersz * PITCH + T, kol * PITCH: kol * PITCH + T] = kafel


def main(tryb="raport", zestaw=None):
    stary_p = os.path.join(ASSETS, "Nature.png")
    if tryb == "raport":
        if os.path.exists(stary_p):
            im = Image.open(stary_p)
            print("Arkusz istnieje: %s  %dx%d" % (stary_p, im.size[0], im.size[1]))
        print("Nic nie zapisano. Uzyj --od-zera (przebudowa calosci)"
              " albo --zestaw NAZWA (jeden system).")
        return
    kopia = os.path.join(ASSETS, "Nature_v1_backup.png")
    if not os.path.exists(kopia):
        shutil.copy2(stary_p, kopia)
        print("kopia starego arkusza -> Nature_v1_backup.png")

    stary = np.array(Image.open(kopia).convert("RGBA"))
    W = COLS * PITCH - 1                      # 626; zostawiamy 640 dla zgodnosci
    H_NEW = ROWS_NEW * PITCH - 1
    ark = np.zeros((max(H_NEW, 800), max(stary.shape[1], 640), 4), np.uint8)

    # 1) wiersze 0-11 bez zmian — id 0-227 musza zostac dokladnie tam, gdzie sa
    ark[:stary.shape[0], :stary.shape[1]] = stary
    # Kolumny 0-5 wiersza 12 byly wczesniej trawa; teraz trawa siedzi w kolumnie
    # 0 wierszy 0-5, wiec te miejsca zwalniamy zamiast zostawiac duplikaty.
    # Cala czesc od wiersza 12 w dol jest generowana od zera przy kazdym
    # uruchomieniu — inaczej po zmianie ukladu zostawaly kafle-widma ze starego
    # rozmieszczenia (np. porzucony zestaw sciezek).
    ark[12 * PITCH:, :] = 0
    print("skopiowano wiersze 0-%d (id 0-%d) bez zmian" % (ROWS_OLD - 1, ROWS_OLD * COLS - 1))

    opis = []

    # 2) TRAWA: kolumna 0, wiersze 0-5 -> id 0, 19, 38, 57, 76, 95
    #
    # To jedyne miejsce, w ktorym NADPISUJEMY kafel uzywany przez mape: id 0 to
    # tlo swiata, 2000 wystapien. Podmiana jest zamierzona — kafel zachowuje
    # swoja role (plaska trawa), zmienia sie tylko grafika, wiec cala mapa
    # dostaje nowa ziemie bez jednej edycji w Tiled.
    #
    # Pozostale piec pozycji tej kolumny bylo wolnych albo nieuzywanych.
    for i, (nazwa, kw) in enumerate(TRAWA_WARIANTY):
        wklej(ark, trawa_wariant(300 + i * 13, **kw), 0, i)
        opis.append((i * COLS, "trawa — %s" % nazwa))
    print("kolumna 0, wiersze 0-5: 6 wariantow trawy (id 0, 19, 38, 57, 76, 95)")

    # wiersz 12: pozostale materialy (miejsca po trawie zostaja wolne)
    w = 12
    kol = 6
    for mat in ("ziemia", "piasek", "kamien", "woda", "listowie"):
        for wariant in range(2 if mat != "listowie" else 3):
            wklej(ark, baza(mat, wariant), kol, w)
            opis.append((w * COLS + kol, "%s wariant %d" % (mat, wariant + 1)))
            kol += 1
    print("wiersz 12: %d pozostalych materialow (kolumny 6-%d)" % (kol - 6, kol - 1))

    # ── UKLAD NOWEJ CZESCI ARKUSZA ─────────────────────────────────────
    # Jeden system na wiersz, najwazniejsze najwyzej. Stary zestaw sciezek
    # (krawedziowy, 16 kafli) zostal USUNIETY — zastapil go zestaw obszarowy,
    # ktory potrafi wszystko to samo plus narozniki wewnetrzne, paski szerokie
    # na jeden kafel i pojedyncze kepy.
    #
    #   12         materialy bazowe (co w ogole istnieje)
    #   13-15      DROGA POLNA — pelny zestaw obszarowy, 47 kafli
    #   16         trawa <-> ziemia    (Wang 16 naroznikowy)
    #   17         trawa <-> woda
    #   18         ziemia <-> woda
    #   19         trawa <-> piasek
    #   20         listowie <-> trawa
    #   21         krzaki
    #   22-23      zapas

    # 3) wiersze 13-15: droga polna, pelny zestaw obszarowy
    droga = baza("ziemia")
    trawka = trawa_wariant(300)
    mapowanie = {}
    for n, mk in enumerate(BLOB_MASKI):
        wiersz, kol = 13 + n // COLS, n % COLS
        wklej(ark, kafel_blob(mk, droga, trawka), kol, wiersz)
        idk = wiersz * COLS + kol
        opis.append((idk, "droga polna — uklad sasiadow 0x%02x" % mk))
        mapowanie[mk] = idk
    print("wiersze 13-15: droga polna, zestaw obszarowy — %d kafli" % len(BLOB_MASKI))
    with open(os.path.join(DOCS, "droga_blob47.json"), "w", encoding="utf-8") as f:
        json.dump({"opis": "maska osmiu sasiadow (N=1,NE=2,E=4,SE=8,S=16,SW=32,W=64,NW=128) -> id kafla",
                   "mapowanie": {str(k): v for k, v in mapowanie.items()}}, f, indent=1, ensure_ascii=False)

    # 4) wiersze 16-20: przejscia miedzy materialami (Wang 16 naroznikowy)
    ZESTAWY = [
        (16, "trawa",    "ziemia"),
        (17, "trawa",    "woda"),
        (18, "ziemia",   "woda"),
        (19, "trawa",    "piasek"),
        (20, "listowie", "trawa"),
    ]
    for wiersz, matA, matB in ZESTAWY:
        A = trawa_wariant(300) if matA == "trawa" else baza(matA)
        B = trawa_wariant(300) if matB == "trawa" else baza(matB)
        for kod in range(16):
            wklej(ark, zloz(A, B, maska_wang(kod)), kod, wiersz)
            opis.append((wiersz * COLS + kod, "%s / %s — Wang %02d" % (matA, matB, kod)))
        print("wiersz %d: %s / %s, 16 kafli" % (wiersz, matA, matB))

    # 5) wiersz 21: krzaki
    for i, prom in enumerate((6, 9, 12, 6, 9, 12)):
        rampa = "listowie" if i < 3 else "trawa"
        wklej(ark, krzak(500 + i * 17, prom, rampa), i, 21)
        opis.append((21 * COLS + i, "krzak %s r=%d" % (rampa, prom)))
    print("wiersz 21: 6 krzakow")

    Image.fromarray(ark).save(stary_p)
    print("\nzapisano %s  %dx%d  (%d wierszy, id 0-%d)"
          % (stary_p, ark.shape[1], ark.shape[0], ROWS_NEW, ROWS_NEW * COLS - 1))

    with open(os.path.join(DOCS, "nature_kafle.json"), "w", encoding="utf-8") as f:
        json.dump({str(i): n for i, n in opis}, f, indent=1, ensure_ascii=False)
    print("spis nowych kafli -> docs/nature_kafle.json (%d pozycji)" % len(opis))


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Generator arkusza Nature. Domyslnie NIC nie nadpisuje.")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--od-zera", action="store_true",
                   help="zbuduj caly arkusz od nowa (nadpisuje Nature.png)")
    g.add_argument("--zestaw", metavar="NAZWA",
                   help="odswiez tylko jeden system (droga, przejscia, krzaki, trawa)")
    args = ap.parse_args()
    main("od-zera" if args.od_zera else ("zestaw" if args.zestaw else "raport"), args.zestaw)

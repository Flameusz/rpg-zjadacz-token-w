"""Przyswit PRZEDRAMIE ↔ TARCZA — analitycznie, bez promieni.

Modul BLENDEROWY. Nic nie zapisuje.

── Dlaczego NIE parzystosc promienia ────────────────────────────────────────
⚠⚠ **Pierwszy przyrzad (parzystosc przeciec promienia z siatka tarczy) byl
NIEWIARYGODNY i podal blad na jawnie poprawnej geometrii**: przy tarczy
odsunietej 1,45 j. na zewnatrz — czyli fizycznie daleko poza reka — dalej
raportowal ~100 wierzcholkow przedramienia "wewnatrz". Siatka tarczy jest
SZCZELNA (sprawdzone: zero krawedzi o innej liczbie scian niz 2), wiec nie
o to chodzilo. Przyczyna jest w ksztalcie: **tarcza to CIENKI DYSK**, a dla
cienkiego dysku parzystosc jest przypadkiem zdegenerowanym — promien biegnacy
blisko plaszczyzny lica przechodzi przez wiele scian wspolplaszczyznowych
i liczba przeciec przestaje cokolwiek znaczyc.

⛔ **Nie wracaj do parzystosci dla tarcz.** Tarcza JEST plyta z konstrukcji
(`char3d_shields._wytlocz`: zamkniety kontur wytloczony wzdluz lokalnego Z),
wiec liczymy ja WZOREM: odleglosc 2D punktu od wielokata konturu zlozona
z odlegloscia wzdluz normalnej. Bez iteracji, bez zaleznosci od gestosci
siatki i bez przypadkow zdegenerowanych.

⚠⚠ **Do 2026-09-21 bylo to liczone jako DYSK o jednym promieniu** i to
wystarczalo, dopoki modele byly dwa i oba okragle. Przy szesciu konstrukcjach
`max(promien)` bralby NAJDALSZY naroznik: waska, wysoka pawez (48 x 112 cm)
udawalaby kolo o srednicy 112 cm, czyli przyrzad mierzylby figure ponad dwa
razy za szeroka.

── Co mierzymy ──────────────────────────────────────────────────────────────
`przeswit` — najmniejsza odlegosc wierzcholkow PRZEDRAMIENIA I DLONI od BRYLY
tarczy. Ujemna = przedramie jest w srodku tarczy (blad, ktory autor zobaczyl
na renderze: "tarcza jest w srodku reki").

`na_zewnatrz` — czy tarcza jest po ZEWNETRZNEJ stronie reki (dalej od osi
ciala). Bez tego "przeswit dodatni" spelnialaby tez tarcza schowana miedzy
noga a reka.

`dY` — glebokosc srodka tarczy wzgledem piesci. Lapie "plecak" (tarcza za
reka) i "garde" (tarcza przed reka); przeswit sam w sobie tego NIE widzi,
bo tarcza moze miec dodatni przeswit i dalej wisiec za plecami.
"""
import math

import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shield_shapes  # noqa: E402

# Ile przedramie ma miec luzu od bryly tarczy. Zero jest zlym celem — dlon
# DOTYKA tarczy z definicji; chodzi o to, zeby przedramie nie bylo w srodku.
MIN_PRZESWIT = 0.0
# Glebokosc srodka tarczy wzgledem piesci (patrz `dY` w naglowku).
MAX_GLEBOKOSC = 0.35
KOSC_PRZEDRAMIE = "Bone.002_L.002"
KOSC_LOKIEC = "Bone.002_L.004"
KOSC_DLON = "Bone.002_L.003"


def plyta(ob):
    """Geometria tarczy jako PLYTA: (C, ex, ey, n, kontur2d, polgrubosc, R).

    UWAGA UWAGA: **ZASTAPILO `dysk()`, bo cztery z szesciu konstrukcji NIE SA
    KOLAMI.** Dysk opisany jednym promieniem nadawal sie na puklerz i okragla;
    dla rycerskiej, migdalowej, legionowej i pawezy `max(promien)` bral
    NAJDALSZY naroznik i robil z waskiej, wysokiej tarczy KOLO o jej wysokosci
    — czyli przeswit wychodzil o polowe za maly i asercja swiecilaby na
    czerwono na poprawnej geometrii (albo, gorzej, na zielono na zlej).

    Uogolnienie jest scisle: dla konturu kolowego wynik jest taki sam, co
    wczesniej. Dalej liczymy WZOREM, bez zadnej parzystosci promieni — patrz
    naglowek modulu.

    `R` zostaje jako promien opisany (najdalszy wierzcholek od srodka) i sluzy
    WYLACZNIE samokontroli do ustawiania przypadkow „daleko".
    """
    dg = bpy.context.evaluated_depsgraph_get()
    oe = ob.evaluated_get(dg)
    me = oe.to_mesh()
    pts = [ob.matrix_world @ v.co for v in me.vertices]
    oe.to_mesh_clear()

    # Uklad wlasny tarczy: siatka jest budowana w lokalnym X-Y, grubosc po Z
    # (`char3d_shields._wytlocz`). Bierzemy osie z macierzy obiektu, a nie
    # z normalnej najwiekszej sciany — to jest dokladne i nie zalezy od tego,
    # ktora sciana akurat wyszla najwieksza.
    m3 = ob.matrix_world.to_3x3()
    ex = (m3 @ Vector((1.0, 0.0, 0.0))).normalized()
    ey = (m3 @ Vector((0.0, 1.0, 0.0))).normalized()
    n = (m3 @ Vector((0.0, 0.0, 1.0))).normalized()

    # UWAGA: srodek z ORIGINU siatki — dokladny z konstrukcji, bo kontur jest
    # rozpiety na +/-polszerokosc i +/-polwysokosc. Srednia wierzcholkow
    # mierzylaby podzial siatki, a srodek AABB w swiecie jest bledny dla
    # figur niesymetrycznych punktowo (pawez). Patrz
    # `char3d_shields.srodek_geometryczny`.
    C = ob.matrix_world.translation.copy()

    # Rzut na plaszczyzne tarczy + sklejenie lica z tylem (te same (x, y)).
    plaskie = {}
    for q in pts:
        v = q - C
        klucz = (round(v.dot(ex), 5), round(v.dot(ey), 5))
        plaskie[klucz] = True
    # Porzadkujemy katowo. Wolno, bo WSZYSTKIE szesc konturow jest
    # gwiazdzistych wzgledem srodka — pilnuje tego
    # `shield_shapes.samokontrola()`.
    kontur2d = sorted(plaskie.keys(), key=lambda q: math.atan2(q[1], q[0]))
    R = max(math.hypot((q - C).dot(ex), (q - C).dot(ey)) for q in pts)
    # UWAGA UWAGA: **POLGRUBOSC LICZYMY WZGLEDEM POWIERZCHNI SRODKOWEJ, a nie
    # jako `max |z|`.** Od 2026-09-21 tarcze sa WYSKLEPIONE, wiec `max |z|`
    # bierze wysokosc kopuly (legionowa: 14 cm = 0,97 j.) i robi z cienkiej,
    # wygietej deski PLYTE dziesieciokrotnie grubsza. Przyrzad zglaszalby
    # wtedy przenikanie przedramienia tam, gdzie go nie ma.
    # Powierzchnie srodkowa znamy analitycznie - to ta sama funkcja, z ktorej
    # zbudowana jest siatka.
    konstrukcja = ob.name.split("Tarcza_")[-1]
    skala = ob.matrix_world.to_3x3().to_scale()[0]

    def srodkowa(x, y):
        """Przesuniecie powierzchni srodkowej wzdluz `n`, w jednostkach SWIATA."""
        return shield_shapes.wypuklosc(konstrukcja, x / skala, y / skala) * skala

    polgrubosc = max(abs((q - C).dot(n) - srodkowa((q - C).dot(ex), (q - C).dot(ey)))
                     for q in pts)
    return C, ex, ey, n, kontur2d, polgrubosc, R, srodkowa


def _w_wielokacie(x, y, poly):
    """Test punkt-w-wielokacie (even-odd) w 2D.

    UWAGA: parzystosc w 2D jest BEZPIECZNA, w przeciwienstwie do parzystosci
    promienia w 3D na cienkiej bryle (patrz naglowek modulu). Tam problemem
    byly sciany wspolplaszczyznowe; tu przecinamy krawedzie odcinkowe.
    """
    w = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            if x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                w = not w
        j = i
    return w


def _odleglosc_2d(x, y, poly):
    """Odleglosc ZE ZNAKIEM od wielokata. Ujemna = w srodku."""
    naj = 1e18
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        dx, dy = xi - xj, yi - yj
        dd = dx * dx + dy * dy
        if dd == 0.0:
            d = math.hypot(x - xi, y - yi)
        else:
            t = max(0.0, min(1.0, ((x - xj) * dx + (y - yj) * dy) / dd))
            d = math.hypot(x - (xj + t * dx), y - (yj + t * dy))
        naj = min(naj, d)
        j = i
    return -naj if _w_wielokacie(x, y, poly) else naj


def odleglosc_od_plyty(p, C, ex, ey, n, kontur2d, t, srodkowa=None):
    """Odleglosc punktu od BRYLY tarczy. Ujemna = w srodku (glebokosc).

    `srodkowa(x, y)` przesuwa os plyty - tarcza jest WYGIETA, nie plaska.
    Brak funkcji = plyta plaska (zachowanie sprzed wysklepienia).
    """
    v = p - C
    x, y = v.dot(ex), v.dot(ey)
    wzdluz = v.dot(n) - (srodkowa(x, y) if srodkowa else 0.0)
    dxy = _odleglosc_2d(x, y, kontur2d)
    dz = abs(wzdluz) - t          # >0 = poza plyta wzdluz osi
    if dz <= 0.0 and dxy <= 0.0:
        return -min(-dz, -dxy)    # w srodku: glebokosc do najblizszej sciany
    return math.hypot(max(dz, 0.0), max(dxy, 0.0))


def punkty_przedramienia(arm, cialo, promien=0.55):
    """Wierzcholki siatki nalezace do LEWEGO przedramienia i dloni (swiat)."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    mw = ev.matrix_world
    lokiec = mw @ ev.pose.bones[KOSC_LOKIEC].head
    nadgarstek = mw @ ev.pose.bones[KOSC_DLON].head
    koniec = mw @ ev.pose.bones[KOSC_DLON].tail
    oe = cialo.evaluated_get(dg)
    me = oe.to_mesh()
    pts = [cialo.matrix_world @ v.co for v in me.vertices]
    oe.to_mesh_clear()

    def blisko(p, a, b):
        d = b - a
        if d.length_squared < 1e-9:
            return (p - a).length < promien
        u = max(0.0, min(1.0, (p - a).dot(d) / d.length_squared))
        return (p - (a + d * u)).length < promien

    return ([p for p in pts if blisko(p, lokiec, nadgarstek) or blisko(p, nadgarstek, koniec)],
            nadgarstek)


def przeswit_przedramienia(arm, ob_tarczy, cialo):
    """Slownik z trzema liczbami opisujacymi relacje DLON → PRZEDRAMIE → TARCZA."""
    C, ex, ey, n, kontur2d, t, _R, srodkowa = plyta(ob_tarczy)
    punkty, piesc = punkty_przedramienia(arm, cialo)
    if not punkty:
        raise RuntimeError("nie znalazlem wierzcholkow przedramienia — sprawdz nazwy kosci")
    odl = [odleglosc_od_plyty(p, C, ex, ey, n, kontur2d, t, srodkowa) for p in punkty]
    srodek_reki = sum(punkty, Vector((0, 0, 0))) / len(punkty)
    # ⚠ Strone liczymy wzgledem OSI CIALA (X=0), bo to ona definiuje
    # "na zewnatrz" niezaleznie od tego, jak obrocona jest kosc dloni.
    znak = 1.0 if srodek_reki.x >= 0.0 else -1.0
    return {
        "przeswit": min(odl),
        "w_srodku": sum(1 for d in odl if d < 0.0),
        "punktow": len(punkty),
        "na_zewnatrz": (C.x - srodek_reki.x) * znak,
        "dY": (C - piesc).y,
        "lico_na_zewnatrz": abs(n.x),
    }


def werdykt(m):
    """Lista powodow, dla ktorych relacja jest zla. Pusta = dobrze."""
    zle = []
    if m["przeswit"] < MIN_PRZESWIT:
        zle.append(f"PRZEDRAMIE W TARCZY: {m['w_srodku']}/{m['punktow']} wierzcholkow, "
                   f"najglebiej {-m['przeswit']:.2f} j.")
    if m["na_zewnatrz"] <= 0.0:
        zle.append(f"tarcza NIE jest po zewnetrznej stronie reki "
                   f"(przesuniecie {m['na_zewnatrz']:+.2f} j.)")
    if abs(m["dY"]) > MAX_GLEBOKOSC:
        zle.append(f"srodek tarczy {m['dY']:+.2f} j. wzgledem piesci — "
                   f"{'ZA REKA (plecak)' if m['dY'] > 0 else 'PRZED reka (garda)'}")
    return zle


# ── SAMOKONTROLA ────────────────────────────────────────────────────────────
# ⚠ Przyrzad, ktorego nie widziano na czerwono I na zielono, jest dekoracja.
# Poprzedni (parzystosc promienia) przeszedlby punkt 2 i OBLAL punkty 1 i 4 —
# i wlasnie dlatego zmarnowal jedna iteracje doboru wartosci.
def samokontrola(arm, ob_tarczy, cialo, gadaj=True):
    """Cztery sztuczne przypadki o ZNANEJ odpowiedzi. Zwraca liste bledow."""
    C0, ex, ey, n, kontur2d, t, R, srodkowa = plyta(ob_tarczy)
    punkty, piesc = punkty_przedramienia(arm, cialo)
    srodek_reki = sum(punkty, Vector((0, 0, 0))) / len(punkty)
    zasieg = max((p - srodek_reki).length for p in punkty)

    def ocen(C):
        # UWAGA: przesuwamy SRODEK, a kontur2d jest wzgledem srodka — wiec
        # przenosi sie razem z nim i nie trzeba go przeliczac.
        odl = [odleglosc_od_plyty(p, C, ex, ey, n, kontur2d, t, srodkowa) for p in punkty]
        return min(odl), sum(1 for d in odl if d < 0.0)

    # Tarcza przesunieta CZYSTO w X: daleko na zewnatrz musi byc czysto,
    # a nasunieta na srodek przedramienia musi je przecinac.
    daleko = Vector((srodek_reki.x + R + zasieg + 1.0, srodek_reki.y, srodek_reki.z))
    na_rece = Vector((srodek_reki.x, srodek_reki.y, srodek_reki.z))
    za_reka = Vector((srodek_reki.x, srodek_reki.y + R + zasieg + 1.0, srodek_reki.z))

    przypadki = [
        ("1. tarcza daleko na zewnatrz", daleko, "PASS"),
        ("2. tarcza na przedramieniu",   na_rece, "FAIL"),
        ("3. tarcza daleko za reka",     za_reka, "PASS_przeswit"),
        ("4. tarcza znow daleko na zewnatrz", daleko, "PASS"),
    ]
    bledy = []
    for nazwa, C, oczekiwane in przypadki:
        p, ile = ocen(C)
        if oczekiwane == "FAIL":
            ok = p < 0.0
            opis = f"przeswit {p:+.2f} ({ile} wierzch. w srodku)"
        else:
            ok = p > 0.0
            opis = f"przeswit {p:+.2f}"
        if gadaj:
            print(f"  [{'OK  ' if ok else 'BLAD'}] {nazwa:36} {opis:34} "
                  f"oczekiwano {oczekiwane}")
        if not ok:
            bledy.append(f"samokontrola przyrzadu: '{nazwa}' dala {opis}, "
                         f"oczekiwano {oczekiwane}")
    # ⚠ Przypadek 3 ma PRZESWIT dodatni i to jest POPRAWNE — tarcza za reka
    # jej nie przecina. Lapie go osobna regula `dY`, nie przeswit. Sprawdzamy
    # wiec, ze ta druga regula NAPRAWDE reaguje, inaczej przypadek 3 nie ma
    # zadnego straznika.
    dY_za_reka = (za_reka - piesc).y
    ok3 = abs(dY_za_reka) > MAX_GLEBOKOSC
    if gadaj:
        print(f"  [{'OK  ' if ok3 else 'BLAD'}] 3b. regula dY lapie 'za reka'      "
              f"dY={dY_za_reka:+.2f} (limit {MAX_GLEBOKOSC})")
    if not ok3:
        bledy.append("samokontrola: regula dY nie lapie tarczy za reka")
    return bledy

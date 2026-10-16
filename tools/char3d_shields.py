"""Tarcza w LEWEJ dłoni — trzeci slot wymiennego ekwipunku modelu 3D.

Moduł BLENDEROWY, importowany przez skrypty podglądu i eksportu.
⚠ **NIE ZAPISUJE char.blend** — elementy powstają w pamięci sesji.

── Dlaczego osobny moduł, a nie wpis w `char3d_weapons.py` ───────────────────
Bo to inna rzecz w innej ręce, o innej geometrii i innym punkcie zaczepienia.
Broń jest opisana jako segmenty WZDŁUŻ drzewca (oś +Y kości dłoni) i wisi
w prawej pięści. Tarcza jest TARCZĄ: płaskim krążkiem, którego płaszczyzna ma
patrzeć przed postać, a nie wzdłuż ręki. Wspólny słownik zmuszałby oba kształty
do jednego formatu i pierwszy wpis, który się nie mieści, wygrywałby z drugim.

── Gdzie naprawdę siada tarcza ───────────────────────────────────────────────
⚠ Przy `parent_type='BONE'` obiekt siada na OGONIE kości, a jego lokalne +Y
biegnie wzdłuż kości, na zewnątrz dłoni. Dla tarczy oznacza to:
  • **lokalne Y** = pion tarczy (wzdłuż przedramienia — przy opuszczonej ręce
    to jest światowe „w dół", czyli krążek stoi pionowo — dokładnie tak trzeba),
  • **lokalne Z** = normalna lica; zmierzone na kości `Bone.002_L.003`
    w klatce 0 daje światowe (−0,65, −0,76, 0,01), czyli **przód i lekko
    w poprzek ciała** — tam, gdzie tarcza ma patrzeć.
Stąd tarczę budujemy w płaszczyźnie lokalnej X–Y, a grubość idzie po Z.
`chwyt` przesuwa środek tarczy względem pięści, bo dłoń trzyma ją OD TYŁU.

── SZEŚĆ KONSTRUKCJI, NIE TRZYDZIEŚCI PRZEDMIOTÓW (2026-09-21) ───────────────
⭐⭐ **Kluczem modelu jest KONSTRUKCJA** (`buckler`, `round`, `heater`,
`almond`, `scutum`, `pavise`), a nie id przedmiotu. Trzydzieści tarcz
z katalogu dzieli te sześć brył; `Character3D.zsynchronizujTarcze` adresuje je
przez pole `construction`, opisane w `GameConfig` jako „jedyne miejsce,
w którym przedmiot mówi, czym JEST".

⚠⚠ **Poprzednia wersja adresowała po ID i dlatego 28 z 30 tarcz renderowało
PUSTĄ LEWĄ DŁOŃ** — modele nazywały się `buckler`/`ironbound_shield`, a gracz
kupował `wood_round_shield`. Bramka tego nie widziała, bo jej sprawdzian
rosteru parsował tekst `GameConfig.ts` i mijał się z `SHIELD_ITEMS`.
⛔ Nie wracaj do adresowania po id — nowa pozycja katalogu ma działać BEZ
nowego modelu i bez wpisu tutaj.

── Kształt i wymiar: NIE TUTAJ ───────────────────────────────────────────────
⭐ Kontur, centymetry, grubość, punkt uchwytu i profil noszenia czytamy
z `tools/shield_shapes.py` — **wspólnego źródła z generatorem ikon**.
Tutaj zostaje wyłącznie MOCOWANIE (`chwyt`, `obrot`).

⚠ Do 2026-09-21 wymiary były wpisane tutaj, dobrane pipetą po starych ikonach
32×32: puklerz wychodził **23,6 cm zamiast 38**, okrągła **47,6 cm zamiast 66**.
Dwa opisy tego samego przedmiotu rozjeżdżają się zawsze, a diff tego nie widzi.

── Kolory ────────────────────────────────────────────────────────────────────
⭐⭐ Ze WSPÓLNEGO STANDARDU DREWNA `tools/wood_palette.py`, jak cały drewniany
ekwipunek. ⛔ Bez metalu: baza jest „deska przy desce" (decyzja katalogowa
2026-09-18), a umbo, obręcz i okucia są osiami WARIANTU.

── Czego to NIE rozwiązuje ───────────────────────────────────────────────────
⚠ **Lewa ręka nadal macha w marszu.** `Walk_Armed` zatrzymuje wyłącznie rękę
z bronią (patrz `char3d_chod.py`), więc tarcza jedzie z cyklem chodu. Jeśli
okaże się to czytelne jako kołysanie — dobrze; jeśli tarcza zacznie zamiatać
grunt albo wjeżdżać w udo, lekarstwem jest POZA NIESIENIA dla lewej dłoni
w `char3d_chod.py`, dokładnie ta sama technika co dla prawej. Mierzy to
`tools/char3d_sprawdz_tarcze.py`.

⚠ **Broń w drugiej ręce (dual wield) to osobna sprawa.** Gra pozwala włożyć
w `offhand` jednoręczną broń, nie tylko tarczę. Modele broni istnieją, ale są
wpięte w kość PRAWEJ dłoni — pokazanie ich po lewej wymaga drugiego kompletu
węzłów, nie zmiany tutaj.
"""
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import shield_shapes  # noqa: E402
import wood_palette   # noqa: E402
import metal_palette  # noqa: E402
from char3d_zones import _ustaw_kolor  # noqa: E402

# -- material ---------------------------------------------------------------
# GWIAZDKA: **DREWNO IDZIE ZE WSPOLNEGO STANDARDU `tools/wood_palette.py`**,
# tego samego, z ktorego zyja ikony tarcz, rekojesci, trzonki, drzewca i
# skrzynie. STOP: nie wpisuj tu wlasnego brazu - od tego zaczyna sie szesc
# mikro-palet zamiast jednego materialu.
#
# UWAGA UWAGA: **POPRZEDNIA WERSJA MIALA METAL I TO BYL BLAD KATALOGOWY,
# nie estetyczny.** `okucie` (#566161) i `guz` (#7b8a8a) pochodzily z pipety
# po starych ikonach 32x32 sprzed mastera. Decyzja katalogowa z 2026-09-18
# mowi wprost: baza to "deska przy desce, bez umba, bez okuc, bez obrzezy,
# bez metalu" - umbo, obrzeze i metal sa osiami WARIANTU i dokladaja sie DO
# tej bryly. STOP: nie "uzupelniaj" bazy z powrotem o historyczne detale.
#
# Dwa tony, zero dekoracji: lico i tyl biora szczebel 8, kant o dwa nizej.
# Kant ma znaczenie, bo w CARRY tarcza stoi KRAWEDZIA do widza
# (`obrot -125`) i to jego widac, a nie lico.
_R = wood_palette.RAMPA
MATERIALY = {
    "deska": _R[8],
    "kant": _R[6],
}
# ⭐ METAL (2026-10-03) — oś WARIANTU na tej samej bryle, ze wspólnego standardu
# `tools/metal_palette.py`, tymi samymi stopniami co ikony: płyta / obręcz,
# jaśniejsze umbo, ciemniejszy kant. ⛔ Nie wpisuj tu własnych szarości.
for _g, _rampa in (("iron", metal_palette.IRON), ("steel", metal_palette.STEEL)):
    MATERIALY[f"metal_{_g}"] = _rampa[2]
    MATERIALY[f"metal_jasny_{_g}"] = _rampa[3]
    MATERIALY[f"metal_ciemny_{_g}"] = _rampa[1]

# -- mocowanie --------------------------------------------------------------
# GWIAZDKA: **TU JEST WYLACZNIE MOCOWANIE.** Kontur, wymiar, grubosc i punkt
# uchwytu czytamy z `shield_shapes.KONSTRUKCJE` - jednego zrodla wspolnego
# z ikonami.
#
# `chwyt`  - przesuniecie srodka tarczy w przestrzeni kosci dloni (X, Y, Z).
#            Y idzie wzdluz reki (dodatnie = dalej od barku, czyli przy
#            opuszczonym ramieniu W DOL), Z na zewnatrz lica.
#            UWAGA: do tego DOLICZA SIE `uchwyt` konstrukcji - tarcza na
#            pasach zwisa ponizej piesci, tarcza z chwytem srodkowym nie.
# `obrot`  - kat noszenia (stopnie, XYZ w przestrzeni kosci dloni). Wlasnosc
#            PRZEDMIOTU, wspolna dla WSZYSTKICH poz.
#
# UWAGA x3: NIE kompensuj tu przechylenia z pozy "walka" - `obrot` jest JEDNA
# wspolna wlasnoscia przedmiotu, uzywana przez wszystkie pozy naraz.
# Sprawdzone wprost: -40 stopni dobre dla `NIESIENIE_TARCZA_WALKA` psuje
# `NIESIENIE_TARCZA_SPOCZYNEK` bardziej niz brak kompensacji. Skret dla samej
# pozy walki nalezy do `char3d_chod.LICO_TARCZY_WALKA`, nie tutaj.
#
# UWAGA UWAGA: **LICO USTAWIONE WZDLUZ BOKU (-125)** - dorobek szesciu
# iteracji. Zmierzone jako udzial lica: na zewnatrz / w strone widza:
#     -90   -> 78% / 55%   STOP: z przodu widac prawie cale lico = to juz GARDA
#     -110  -> 95% / 25%
#     **-125 -> 99% / 1%** <- wybrane: z przodu KRAWEDZ, z boku LICO
# STOP: nie wracaj do -90 - autor zlapal to na zrzucie z gry: przy 55% lica
# w strone widza CARRY zaczynalo czytac sie jak GUARD.
#
# UWAGA UWAGA UWAGA: **PROBOWANO ZAMKNAC LUKE „LEWITUJACEJ TARCZY" WLASNIE
# TUTAJ, PRZEZ `chwyt.z`, I TO JEST ZLY LEWAR** (zmierzone 2026-09-21).
# Przymiar `char3d_przymiar_chwytu.py` policzyl wartosci domykajace przeswit
# do 0,23-0,32 j. — i bramka je odrzucila, bo lokalne Z biegnie w swiecie
# (-0,54; -0,84; -0,03), czyli DO PRZODU. Docisniecie tarczy do dloni tym
# kanalem wypycha ja jednoczesnie PRZED cialo:
#     dX  +1,14 -> +0,84 (puklerz), +1,05 -> -0,09 (legionowa: juz NIE po
#         zewnetrznej stronie piesci)
#     dY  -0,01 -> -0,48 .. -1,15   przy limicie 0,35
# ⛔ To jest dokladnie to, przed czym ostrzega akapit nizej („dodatnie Z
# wypychalo tarcze PRZED cialo") i ostrzezenie okazalo sie aktualne takze przy
# tarczy wysklepionej. Luke zamyka ZAKOTWICZENIE KOPULY
# (`shield_shapes.wypuklosc`), nie mocowanie.
MOCOWANIE = {
    "buckler": {"chwyt": (-0.579, -0.333, -0.367), "obrot": (0, -125, 0)},
    "round":   {"chwyt": (-0.539, -0.333, -0.339), "obrot": (0, -125, 0)},
    "heater":  {"chwyt": (-0.539, -0.333, -0.339), "obrot": (0, -125, 0)},
    "almond":  {"chwyt": (-0.539, -0.333, -0.339), "obrot": (0, -125, 0)},
    "scutum":  {"chwyt": (-0.539, -0.333, -0.339), "obrot": (0, -125, 0)},
    "pavise":  {"chwyt": (-0.539, -0.333, -0.339), "obrot": (0, -125, 0)},
}

# UWAGA: `TARCZE` zostaje jako NAZWA SLOWNIKA MODELI, bo pyta o nia bramka
# (`char3d_sprawdz_tarcze`) i eksport. Kluczem jest KONSTRUKCJA, nie id
# przedmiotu - 30 tarcz z katalogu dzieli te szesc modeli.
TARCZE = MOCOWANIE

# UWAGA: ta sama kosc, co u broni, tylko po drugiej stronie. Nazwy w
# `char.blend` sa autorskie (`Bone.002_?.003`), wiec jedno miejsce na
# literowke - tutaj.
KOSC_DLONI = "Bone.002_L.003"
PRZEDROSTEK = "Tarcza_"


def _lin(c):
    v = c / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def _mat(nazwa):
    m = (bpy.data.materials.get("Z_tarcza_" + nazwa)
         or bpy.data.materials.new("Z_tarcza_" + nazwa))
    r, g, b = MATERIALY[nazwa][:3]
    # UWAGA: kolor musi trafic do wezla Principled - eksporter glTF ignoruje
    # `diffuse_color` i bez tego tarcza wyjezdza biala (ta sama pulapka, co
    # przy broni; opis w `char3d_zones`).
    _ustaw_kolor(m, (_lin(r), _lin(g), _lin(b), 1.0))
    return m


# -- standard bryly ---------------------------------------------------------
# UWAGA UWAGA: **PIERWSZA WERSJA BYLA PLASKIM WYTLOCZENIEM KONTURU I TO BYL
# JEJ JEDYNY, ALE DYSKWALIFIKUJACY BLAD** - zgloszone wprost jako "brazowe
# plyty / debug placeholders". Kontur, wymiar i mocowanie byly poprawne;
# brakowalo BRYLY. Minimalny standard, ktory to naprawia:
#     kontur 2D + realna grubosc + kontrolowana wypuklosc + czytelna faza
#     + gladkie cieniowanie lica
# STOP: to NIE jest zaproszenie do okuc, nitow, umba ani uszkodzen. Baza ma
# zostac "deska przy desce" (decyzja katalogowa 2026-09-18) - chodzi wylacznie
# o to, zeby czytala sie jak DREWNIANA TARCZA, a nie jak plyta.

# Ile pierscieni ma lico miedzy krawedzia a srodkiem. Trzy + wierzcholek
# srodkowy wystarcza: przy ~60 px postaci wysklepienie niesie CIENIOWANIE
# (normalne gladkie), a nie sylwetka. UWAGA: ponizej trzech kopula zaczyna
# fasetkowac widocznie na krawedzi ogladanej z boku w pozie CARRY.
PIERSCIENIE = (1.00, 0.72, 0.40)

# Jaka czesc konturu zjada faza krawedzi. Przy 32-48 px tarczy na ekranie
# to jest 1-2 px - dokladnie tyle, zeby krawedz przestala byc matematycznie
# ostra i zlapala wlasne swiatlo.
FAZA = 0.06


def _bryla_tarczy(konstrukcja, kontur, pg, gatunek=None):
    """Wierzcholki, sciany i mapa cieniowania wysklepionej tarczy.

    Zwraca (wierzcholki, sciany, gladkie, materialy) - `gladkie` i `materialy`
    sa rownolegle do `sciany`.

    Uklad: lico (+Z) i tyl (-Z) leza o `pg` po obu stronach POWIERZCHNI
    SRODKOWEJ danej przez `shield_shapes.wypuklosc`, wiec tarcza ma stala
    grubosc i WKLESLY TYL - tak jak prawdziwa. Krawedz to dwa waskie pasma
    fazy schodzace do obreczy w polowie grubosci.
    """
    n = len(kontur)
    wierzch, sciany, gladkie, mat = [], [], [], []
    # ⭐ Okucie (wariant żelazny/stalowy) — z `shield_shapes.OKUCIA`, tej samej
    # macierzy, z której rysuje ikona. Drewno: `gatunek is None`.
    ok = shield_shapes.OKUCIA[konstrukcja] if gatunek else {}
    m_plyta = f"metal_{gatunek}" if gatunek else None
    m_ciemny = f"metal_ciemny_{gatunek}" if gatunek else None
    m_jasny = f"metal_jasny_{gatunek}" if gatunek else None
    lico_mat = m_plyta if ok.get("lity") else "deska"
    kant_mat = m_ciemny if gatunek else "kant"
    tyl_mat = m_ciemny if ok.get("lity") else "deska"
    # Obręcz: dodatkowy pierścień tuż za krawędzią; pasmo między nim a
    # krawędzią lica dostaje metal. Szerokość = ułamek promienia konturu.
    pierscienie = PIERSCIENIE
    if ok.get("obrecz"):
        pierscienie = (1.00, 1.00 - ok["obrecz"]) + PIERSCIENIE[1:]

    def dodaj_pierscien(skala, strona):
        """Pierscien konturu przeskalowany do srodka, na licu albo na tyle."""
        baza = len(wierzch)
        for (x, y) in kontur:
            px, py = x * skala, y * skala
            z = shield_shapes.wypuklosc(konstrukcja, px, py) + strona * pg
            wierzch.append((px, py, z))
        return baza

    wewn = 1.0 - FAZA
    lico = [dodaj_pierscien(wewn * s, +1.0) for s in pierscienie]
    tyl = [dodaj_pierscien(wewn * s, -1.0) for s in pierscienie]
    # Obrecz: kontur w PELNEJ skali, w polowie grubosci - stad faza.
    obrecz = dodaj_pierscien(1.0, 0.0)
    # Wierzcholki srodkowe (wachlarz domykajacy kopule).
    srodek_z = shield_shapes.wypuklosc(konstrukcja, 0.0, 0.0)
    srodek_lico = len(wierzch)
    wierzch.append((0.0, 0.0, srodek_z + pg))
    srodek_tyl = len(wierzch)
    wierzch.append((0.0, 0.0, srodek_z - pg))

    def pasmo(a, b, odwroc, gladko, materialy):
        """Pasmo czworokatow miedzy dwoma pierscieniami."""
        for i in range(n):
            j = (i + 1) % n
            f = (a + i, a + j, b + j, b + i)
            sciany.append(tuple(reversed(f)) if odwroc else f)
            gladkie.append(gladko)
            mat.append(materialy)

    def wachlarz(a, srodek, odwroc, gladko, materialy):
        for i in range(n):
            j = (i + 1) % n
            f = (a + i, a + j, srodek)
            sciany.append(tuple(reversed(f)) if odwroc else f)
            gladkie.append(gladko)
            mat.append(materialy)

    # LICO: od krawedzi do srodka. Gladkie - to jest cala kopula.
    for i in range(len(lico) - 1):
        okute = ok.get("obrecz") and i == 0
        pasmo(lico[i], lico[i + 1], False, True, m_plyta if okute else lico_mat)
    wachlarz(lico[-1], srodek_lico, False, True, lico_mat)
    # TYL: to samo, przeciwna nawiniecie.
    for i in range(len(tyl) - 1):
        pasmo(tyl[i], tyl[i + 1], True, True, tyl_mat)
    wachlarz(tyl[-1], srodek_tyl, True, True, tyl_mat)
    # FAZA + OBRECZ: plaskie, zeby krawedz miala wlasny, ostry ton.
    pasmo(obrecz, lico[0], False, False, kant_mat)
    pasmo(tyl[0], obrecz, False, False, kant_mat)

    # UMBO: kopulka osadzona NA wysklepionym licu (podstawa idzie po
    # powierzchni, nie w plaskiej plaszczyznie — inaczej na kopule tarczy
    # brzeg umba wisi w powietrzu i z boku widac szczeline).
    if ok.get("umbo_cm"):
        _pw, ph, _pg = shield_shapes.wymiary_j(konstrukcja)
        r = ok["umbo_cm"] * shield_shapes.skala_gry(konstrukcja) * shield_shapes.J_NA_CM
        uy = (2.0 * ok.get("umbo_y", 0.5) - 1.0) * ph     # v = -1 to GORA tarczy
        wys = 0.55 * r
        seg, piet = 10, 3
        pierscienie_umba = []
        for i in range(piet):
            fi = (math.pi / 2) * i / piet
            baza = len(wierzch)
            for s in range(seg):
                th = 2 * math.pi * s / seg
                x = r * math.cos(fi) * math.cos(th)
                y = uy + r * math.cos(fi) * math.sin(th)
                z0 = shield_shapes.wypuklosc(konstrukcja, x, y) + pg
                wierzch.append((x, y, z0 + wys * math.sin(fi)))
            pierscienie_umba.append(baza)
        szczyt = len(wierzch)
        wierzch.append((0.0, uy, shield_shapes.wypuklosc(konstrukcja, 0.0, uy) + pg + wys))
        for i in range(piet - 1):
            a, b = pierscienie_umba[i], pierscienie_umba[i + 1]
            # puklerz: ciemny KOLNIERZ u podstawy umba, jak w ikonie
            m = m_ciemny if (ok.get("lity") and i == 0) else m_jasny
            for s in range(seg):
                s1 = (s + 1) % seg
                sciany.append((a + s, a + s1, b + s1, b + s))
                gladkie.append(True)
                mat.append(m)
        ost = pierscienie_umba[-1]
        for s in range(seg):
            sciany.append((ost + s, ost + (s + 1) % seg, szczyt))
            gladkie.append(True)
            mat.append(m_jasny)
    return wierzch, sciany, gladkie, mat


def zbuduj_tarcze(konstrukcja, arm=None, gatunek=None):
    """Tworzy tarcze danej KONSTRUKCJI wpieta w kosc lewej dloni.

    `gatunek` ("iron"/"steel") dokłada okucie z `shield_shapes.OKUCIA`; węzeł
    nazywa się wtedy `Tarcza_<konstrukcja>_<gatunek>` — silnik wybiera go po
    ikonie przedmiotu, z drewnianą bryłą jako zapasem.
    """
    cfg = MOCOWANIE[konstrukcja]
    k = shield_shapes.KONSTRUKCJE[konstrukcja]
    arm = arm or bpy.data.objects["Armature"]
    nazwa = PRZEDROSTEK + konstrukcja + (f"_{gatunek}" if gatunek else "")
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)

    pw, ph, pg = shield_shapes.wymiary_j(konstrukcja)
    kontur = shield_shapes.kontur(konstrukcja)

    # UWAGA: tylko materialy, ktore NAPRAWDE dostana sciane. Pusty slot jedzie
    # do glTF jako osobny material i nic nie rysuje.
    wierzch, sciany, gladkie, materialy = _bryla_tarczy(konstrukcja, kontur, pg, gatunek)
    uzyte = []
    for m in materialy:
        if m not in uzyte:
            uzyte.append(m)

    me = bpy.data.meshes.new(nazwa)
    me.from_pydata(wierzch, [], sciany)
    # UWAGA: `validate` PRZED `update`. Bez tego blad nawiniecia albo
    # zdegenerowana sciana przechodzi cicho do glTF i objawia sie dopiero
    # czarna plama w grze.
    me.validate(verbose=False)
    me.update()
    for mat in uzyte:
        me.materials.append(_mat(mat))
    for poly, g, m in zip(me.polygons, gladkie, materialy):
        poly.use_smooth = g
        poly.material_index = uzyte.index(m)
    # UWAGA: normalne licza sie z nawiniecia, ale wachlarz w srodku kopuly
    # potrafi wyjsc odwrotnie przy bardzo plytkim wysklepieniu. Przeliczamy
    # jawnie - to jest tansze niz debugowanie czarnej tarczy w grze.
    me.update(calc_edges=True)

    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = KOSC_DLONI
    ob.matrix_parent_inverse = Matrix.Identity(4)
    # UWAGA UWAGA: `uchwyt` DOLICZA SIE do `chwyt` wzdluz lokalnego Y, a
    # lokalne +Y biegnie wzdluz kosci NA ZEWNATRZ dloni - przy opuszczonym
    # ramieniu to jest swiatowe "w dol". Czyli dodatni `uchwyt` (piesc NAD
    # srodkiem tarczy) przesuwa srodek tarczy w +Y, a tarcza zwisa ponizej
    # dloni. Tak wisza rycerska, migdalowa i pawez; puklerz, okragla i scutum
    # maja chwyt srodkowy i `uchwyt = 0`.
    cx, cy, cz = cfg["chwyt"]
    # ⚠⚠ **KOMPENSACJA SKALI ARMATURY (2026-10-03, `OI-156`).** Bryła jest
    # liczona w jednostkach ŚWIATA (`shield_shapes.J_NA_CM`), a dziecko kości
    # dziedziczy skalę `Armature` 1,6527 — bez tego tarcza w grze była ×1,65
    # większa, niż mówiły liczby (okrągła 91 cm przy „56"). Skala obiektu
    # 1/1,6527 robi z bryły dokładnie jej wymiar; `location` zostaje
    # w przestrzeni kości, więc przesunięcie uchwytu (w j. świata) też dzielimy.
    s_arm = arm.scale.x
    ob.scale = (1.0 / s_arm,) * 3
    ob.location = (cx, cy + k["uchwyt"] * ph / s_arm, cz)
    ob.rotation_euler = tuple(math.radians(v) for v in cfg.get("obrot", (0, 0, 0)))

    # UWAGA: raport podaje wymiar NA EKRANIE (po `skala_gry`), a nie surowe
    # `cm`. Wersja drukujaca `cm` klamala przy kazdej tarczy o skali != 1:
    # pokazywala "66x66 cm" przy bryle, ktora ma 56 cm.
    h_cm, w_cm = shield_shapes.wymiar_cm(konstrukcja)
    skala = shield_shapes.skala_gry(konstrukcja)
    hist = "" if skala == 1.0 else f" [hist. {k['cm'][0]}x{k['cm'][1]}, skala {skala:.3f}]"
    print("[tarcza] {}: {:.0f}x{:.0f} cm{} = {:.2f}x{:.2f} j., grub={:.3f}, "
          "wypuklosc={:.1f} cm ({}), wierzch={}, scian={}, uchwyt={:.2f}, "
          "profil={}, chwyt={}, obrot={}".format(
              nazwa, w_cm, h_cm, hist, 2 * pw, 2 * ph, 2 * pg,
              k["wypuklosc_cm"] * skala, k["forma"], len(wierzch), len(sciany),
              k["uchwyt"], k["profil"],
              tuple(round(v, 3) for v in ob.location),
              cfg.get("obrot", (0, 0, 0))))
    return ob


def srodek_geometryczny(ob):
    """Srodek tarczy w SWIECIE — z ORIGINU siatki, nie z pomiaru.

    Jest dokladny Z KONSTRUKCJI: `shield_shapes.kontur` zwraca punkty
    rozpiete dokladnie na +/-polszerokosc i +/-polwysokosc, wiec lokalne
    (0, 0, 0) JEST srodkiem figury.

    UWAGA UWAGA: **dwie wczesniejsze wersje tej funkcji byly bledne i obie
    daly mylacy wynik w bramce (2026-09-21):**
    (1) srednia wierzcholkow — poprawna tylko dla wielokata foremnego; przy
        konturach o roznej gestosci wierzcholkow mierzyla PODZIAL SIATKI
        (rycerska `dY = -0,88` przy `-0,10` dla tarcz kolowych);
    (2) srodek bboxa W SWIECIE — poprawny tylko dla figur symetrycznych
        PUNKTOWO. Pawez ma plaski spod i wysklepiony szczyt, wiec jej
        AABB przy przechylonej tarczy nie jest wysrodkowany na figurze:
        `dY = -0,93` przy `-0,07` dla legionowej w tej samej pozie.
    STOP: nie wracaj do zadnej z nich. Origin jest darmowy i dokladny.
    """
    return ob.matrix_world.translation.copy()


def punkt_odniesienia(ob):
    """Punkt tarczy lezacy NA TEJ SAMEJ WYSOKOSCI PRZEDRAMIENIA co piesc.

    UWAGA UWAGA: **to NIE jest srodek tarczy i o to wlasnie chodzi.**
    Tarcza na pasach (`uchwyt > 0`) ma srodek CELOWO przesuniety wzdluz
    przedramienia — zwisa ponizej dloni. Dopoki ramie wisi pionowo, ten offset
    jest czysto pionowy i nic nie psuje. Ale gdy poza unosi i wysuwa reke
    (profil LARGE), offset WZDLUZ PRZEDRAMIENIA zamienia sie czesciowo na
    przesuniecie W PRZOD — i kryterium CARRY `|dY| <= 0,35` swieci na czerwono
    przy geometrii ustawionej dokladnie tak, jak chcielismy.

    Zmierzone: migdalowa `dY = -2,45` przy legionowej (`uchwyt = 0`) `-0,22`
    w tej samej pozie. Roznica to nie polozenie tarczy, tylko jej UCHWYT.

    STOP: nie „naprawiaj" tego luzujac prog dY — prog lapie plecak i garde,
    czyli rzeczy, ktore autor zglosil ze zrzutu. Odejmij offset i mierz dalej.
    """
    konstrukcja = ob.name[len(PRZEDROSTEK):]
    k = shield_shapes.KONSTRUKCJE[konstrukcja]
    _pw, ph, _pg = shield_shapes.wymiary_j(konstrukcja)
    # UWAGA UWAGA: **OS NIEZNORMALIZOWANA — i to jest cala subtelnosc.**
    # `ob.location` jest w przestrzeni KOSCI, a obiekt `Armature` ma skale
    # **1,6527** (niezmiennik rigu, `docs/postac3d_checkpoint.md`). Jednostka
    # lokalnego Y to wiec 1,6527 jednostki SWIATA. Wersja z `.normalized()`
    # odejmowala 1,65x za malo i zostawiala resztke rosnaca z `uchwyt`:
    #     scutum (uchwyt 0,00)  dY -0,07   <- bez offsetu, wiec bez bledu
    #     pavise (uchwyt 0,20)  dY -0,42
    #     almond (uchwyt 0,40)  dY -0,87   <- najwiekszy offset, najwiekszy blad
    # Ten wzorzec „blad proporcjonalny do uchwytu" byl cala podpowiedzia.
    # STOP: nie normalizuj tu niczego. Surowa os NIESIE skale i dokladnie
    # o tyle, o ile `location` przesuwa obiekt w swiecie.
    ey = ob.matrix_world.to_3x3() @ Vector((0.0, 1.0, 0.0))
    return srodek_geometryczny(ob) - ey * (k["uchwyt"] * ph)


def zbuduj_wszystkie(arm=None, okute=False):
    """Sześć drewnianych brył; z `okute=True` także warianty żelazne/stalowe
    (klucz `<konstrukcja>_<gatunek>`). ⚠ Przymiary i bramka indeksują wynik
    KONSTRUKCJĄ, więc domyślnie zwracamy wyłącznie drewno."""
    wynik = {t: zbuduj_tarcze(t, arm) for t in MOCOWANIE}
    if okute:
        for t, ok in shield_shapes.OKUCIA.items():
            for g in ok["gatunki"]:
                wynik[f"{t}_{g}"] = zbuduj_tarcze(t, arm, g)
    return wynik


def _konstrukcje_z_gry():
    """Zbior konstrukcji tarcz UZYWANYCH w grze — z prawdziwego modulu.

    ⚠⚠ **NIE PARSUJEMY TEKSTU `GameConfig.ts` i nie wolno do tego wracac.**
    Poprzednia wersja tej funkcji tnela plik od `export const ITEMS` i szukala
    literalu `block: {`. Obie rzeczy sa falszywe: `SHIELD_ITEMS` stoi PRZED
    `export const ITEMS` (wchodzi dopiero przez `...SHIELD_ITEMS`), a `block`
    przychodzi ze spreadu `...statTarczy(...)`, wiec literalu nie ma.
    Zmierzony skutek 2026-09-21: raport „tarcz w GameConfig: 2, modeli tutaj: 2"
    i EXIT 0, podczas gdy w grze stalo **30 tarcz, z czego 28 renderowalo
    PUSTA LEWA DLON**. To jest wzorcowa „asercja-dekoracja" z `tools/CLAUDE.md`.

    Liczy to `tools/shield_roster.mjs` przez esbuild → node, tak samo jak
    `katalog_ekwipunku.mjs` liczy katalog. ⚠ Gdy toolchain nie wstanie,
    podnosimy wyjatek — bramka ma PASC, a nie przepuscic w ciemno.
    """
    import json
    import subprocess
    import tempfile

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zrodlo = os.path.join(root, "tools", "shield_roster.mjs")
    with tempfile.TemporaryDirectory() as tmp:
        bundle = os.path.join(tmp, "roster.mjs")
        # ⚠ Windows: `npx` to `npx.cmd`; `shell=True` zalatwia oba systemy.
        subprocess.run(
            f'npx esbuild "{zrodlo}" --bundle --format=esm --platform=node '
            f'--outfile="{bundle}" --log-level=error',
            cwd=root, shell=True, check=True, capture_output=True)
        wyn = subprocess.run(f'node "{bundle}"', cwd=root, shell=True,
                             check=True, capture_output=True)
    dane = json.loads(wyn.stdout.decode("utf-8"))
    global _WARIANTY_Z_GRY
    _WARIANTY_Z_GRY = dane.get("warianty", {})
    return dane["liczba"], dane["konstrukcje"]


_WARIANTY_Z_GRY = {}


def sprawdz_profile_w_silniku(sciezka=None):
    """Czy tabela `PROFIL_TARCZY` w silniku zgadza sie z `shield_shapes`.

    UWAGA UWAGA: **DWA OPISY TEGO SAMEGO ROZJEZDZAJA SIE ZAWSZE.** Profil
    niesienia musi znac Blender (buduje klipy `_Large`) i silnik (wybiera
    ktory klip zagrac). Bez tego sprawdzenia przestawienie jednej konstrukcji
    po jednej stronie dawaloby duza tarcze grajaca klip SMALL — czyli tarcze
    ORZACA GRUNT, bez zadnego bledu w konsoli.

    Czytamy TS regexem i to jest tu w porzadku: szukamy szesciu literalow
    w jednej, plaskiej tablicy, a nie wartosci policzonej przez `GameConfig`
    (tamto idzie przez esbuild -> node, patrz `_konstrukcje_z_gry`).

    Zwraca liste rozbieznosci; pusta = zgoda.
    """
    import re

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sciezka = sciezka or os.path.join(root, "src", "render3d", "Character3D.ts")
    with open(sciezka, encoding="utf-8") as fh:
        tekst = fh.read()
    m = re.search(r"const PROFIL_TARCZY[^=]*=\s*\{(.*?)\};", tekst, re.S)
    if not m:
        return ["nie znalazlem tablicy PROFIL_TARCZY w Character3D.ts"]
    z_silnika = dict(re.findall(r'(\w+):\s*"(SMALL|LARGE)"', m.group(1)))
    z_modeli = {k: v["profil"] for k, v in shield_shapes.KONSTRUKCJE.items()}
    rozne = []
    for k in sorted(set(z_modeli) | set(z_silnika)):
        a, b = z_modeli.get(k), z_silnika.get(k)
        if a != b:
            rozne.append(f"'{k}': shield_shapes={a}, Character3D={b}")
    print(f"[profile] konstrukcji: {len(z_modeli)}, w silniku: {len(z_silnika)}, "
          f"rozbieznosci: {len(rozne)}")
    for r in rozne:
        print(f"  BLAD: rozjazd profilu niesienia — {r}")
    return rozne


def sprawdz_komplet_rosteru():
    """Czy KAZDA konstrukcja tarczy uzywana w grze ma tu swoj model.

    ⚠ **Brak modelu nie objawia sie bledem, tylko PUSTA REKA** — `ustawSlot`
    nie znajduje wezla i nic nie rysuje. Tak przepadl `stick` po stronie broni.

    ⭐ **Adresem modelu jest KONSTRUKCJA, nie id przedmiotu.** 30 tarcz dzieli
    6 konstrukcji, a `construction` jest w `GameConfig` opisane wprost jako
    „jedyne miejsce, w ktorym przedmiot mowi, czym JEST". Dzieki temu kazda
    nowa pozycja katalogu dziala bez nowego modelu — i bez wpisu tutaj.

    Zwraca liste brakujacych konstrukcji; pusta lista = komplet.
    """
    liczba, konstrukcje = _konstrukcje_z_gry()
    brak = [k for k in konstrukcje if k not in TARCZE]
    nadmiar = [t for t in TARCZE if t not in konstrukcje]
    print(f"[roster] tarcz w grze: {liczba}, konstrukcji: {len(konstrukcje)}, "
          f"modeli tutaj: {len(TARCZE)}")
    for k, ids in sorted(konstrukcje.items(), key=lambda kv: str(kv[0])):
        stan = "ma model" if k in TARCZE else "BRAK MODELU"
        print(f"  {str(k):<10} {len(ids):>2} szt.  {stan}")
    if nadmiar:
        print(f"  [UWAGA] modele bez odpowiednika w grze: {nadmiar}")
    for k in brak:
        ile = len(konstrukcje[k])
        print(f"  BLAD: konstrukcja '{k}' ma w grze {ile} tarcz, ale NIE MA "
              f"modelu — gracz trzymalby powietrze")
    # ⭐ Warianty OKUTE (2026-10-03): każda ikona żelaza/stali w grze musi mieć
    # okutą bryłę, inaczej gracz kupuje tarczę z umbem, a w ręku ma gołą deskę
    # (silnik spada wtedy na drewno — to nie jest pusta ręka, więc nie krzyczy).
    okute = {f"{t}_{g}" for t, ok in shield_shapes.OKUCIA.items() for g in ok["gatunki"]}
    for w, ids in sorted(_WARIANTY_Z_GRY.items()):
        if w not in okute:
            print(f"  BLAD: wariant '{w}' ({len(ids)} szt.) nie ma okutej bryly w OKUCIA")
            brak.append(w)
    print(f"[roster] wariantow okutych w grze: {len(_WARIANTY_Z_GRY)}, bryl: {len(okute)}")
    return brak

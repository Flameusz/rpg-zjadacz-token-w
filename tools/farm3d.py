"""ZWIERZĘTA WSI 3D — krowa, byk, owca, baran, świnia dla RDZENIA czworonogów.

2026-10-09 (`OI-164`): autor — „studnia, koło młyńskie, ognisko wymagają
aktualizacji do 3D, tak jak i zwierzęta ze wsi". Encja `FarmAnimal` zgłasza
`stan3d()` (chód / jedzenie / postój), model rysuje `Creature3D` jak dzika.

    blender -b --python tools/farm3d.py -- krowa              # przymiar: podgląd + raport
    blender -b --python tools/farm3d.py -- krowa --zapisz     # + public/assets/animals/cow.glb
    (gatunki: krowa, byk, owca, baran, swinia)

⭐ Gatunki to PRZEKSZTAŁCENIA istniejących danych, nie nowe pomiary:
- przeżuwacze (krowa, byk, owca, baran) z jelenia (`deer3d.py`) — JEDNO
  przekształcenie `T` stosowane naraz do profilu tułowia, nóg i kości, więc
  szkielet zostaje zgodny z siatką (krótsza, grubsza noga to ta sama noga
  przekształcona, a nie nowa tabela, która rozjedzie się z kośćmi);
- świnia z dzika (`boar3d.py`): bez kłów i grzywy, różowa, zakręcony ogonek.
Łaty krowy, wełna owcy i rogi idą przez `dodatki` gatunku — rdzeń bez zmian.

Klip `Eat` (łeb przy ziemi, przeżuwanie) jest tutaj — `FarmAnimal` je
albo stoi; `Idle` i chody daje rdzeń.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import quad3d as Q  # noqa: E402
import deer3d as J  # noqa: E402
import boar3d as D  # noqa: E402
from mathutils import Vector, noise  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
GATUNEK = next((a for a in argv if not a.startswith("--")), "krowa")


def _gladko(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


# ════════════════════════════════════════════════════════════════════════════
# PRZEKSZTAŁCENIE JELENIA
# ════════════════════════════════════════════════════════════════════════════
class Ksztalt:
    """Parametry przekształcenia jelenia w gatunek (j. postaci)."""

    def __init__(self, sx=1.0, sy=1.0, sz=1.0, opad_lba=0.0, cofniecie_lba=0.0, szer_tulowia=1.0,
                 szer_szyi=1.0, szer_lba=1.0, brzuch=0.0, nogi_r=1.0, nogi_z=1.0, leb_dl=1.0, leb_wys=1.0):
        self.__dict__.update(locals())
        del self.__dict__["self"]


SZYJA_Y = -2.0      # od tego y (do przodu) zaczyna się szyja jelenia
LEB_Y = -3.70       # od tego y — łeb


def _T(k, p):
    """Punkt jelenia → punkt gatunku. Łeb opada i cofa się płynnie od nasady szyi."""
    x, y, z = p
    w = _gladko((SZYJA_Y - y) / (SZYJA_Y - LEB_Y))          # 0 w tułowiu → 1 od łba
    # łeb: dłuższy (od potylicy do przodu) i wyższy (wokół osi łba z = 9,2)
    if y < LEB_Y:
        y = LEB_Y + (y - LEB_Y) * k.leb_dl
        z = 9.2 + (z - 9.2) * k.leb_wys
    # Nogi krótsze: wszystko poniżej brzucha jelenia (z < 4) ściskane `nogi_z`,
    # wyżej przesunięte o tę samą stratę — tułów nie zmienia kształtu.
    zb = 4.0
    z2 = z * k.nogi_z if z < zb else zb * k.nogi_z + (z - zb)
    return (x * k.sx, (y + k.cofniecie_lba * w) * k.sy, (z2 - k.opad_lba * w) * k.sz)


def przeksztalc_jelenia(k):
    """Profil, nogi i kości jelenia po przekształceniu `k`."""
    profil = []
    for y, zg, zd, hw in J.PROFIL:
        if y < LEB_Y:
            hw *= 1 + (k.leb_wys - 1) * 0.8
        _, y2, zg2 = _T(k, (0, y, zg))
        _, _, zd2 = _T(k, (0, y, zd))
        w = _gladko((SZYJA_Y - y) / (SZYJA_Y - LEB_Y))
        tul = 1.0 - _gladko((SZYJA_Y + 1.6 - y) / 1.6)       # 1 w tułowiu (przejście 1,6 j. — byk miał stopień)
        szer = k.szer_tulowia * tul + (k.szer_szyi * (1 - w) + k.szer_lba * w) * (1 - tul)
        # ⚠ brzuch płynnie z `tul` — próg (`tul > 0.5`) robił jeden pierścień
        #   stopniem i byk miał pionowe załamanie przez cały tułów na karku
        zd2 -= tul * k.brzuch * math.sin(math.pi * _gladko((y + 2.2) / 8.0)) * k.sz
        profil.append((y2, zg2, zd2, hw * k.sx * szer))
    nogi = []
    for tab in (J.NOGA_PRZOD, J.NOGA_TYL):
        nogi.append([(_T(k, p), r * k.nogi_r * (k.sx if i == 0 else 1.0)) for i, (p, r) in enumerate(tab)])
    kosci = {n: (_T(k, h), _T(k, t), par) for n, (h, t, par) in J.KOSCI.items()}
    return profil, nogi[0], nogi[1], kosci


def chody(skala):
    out = {}
    for n, ch in J.CHODY.items():
        c = dict(ch)
        c["krok"] = tuple(v * skala for v in ch["krok"])
        c["lift"] = ch["lift"] * skala
        out[n] = c
    return out


# ════════════════════════════════════════════════════════════════════════════
# KLIPY WSPÓLNE
# ════════════════════════════════════════════════════════════════════════════
def klip_jedzenie(kark, leb):
    """Skubanie trawy: łeb przy ziemi, szczęka przeżuwa (kiwanie łba), ogon macha."""
    def klip(arm):
        a = Q._nowa_akcja(arm, "Eat")
        n = 36
        for f in range(n + 1):
            t = (f % n) / n
            Q._reset(arm); Q._upd()
            Q._tulow(arm, pelvis_z=-0.03, pochyl_klatka=-3.0, kark=kark + 2.0 * math.sin(2 * math.pi * t),
                     leb=leb + 4.0 * math.sin(6 * math.pi * t), ogon=14.0 * math.sin(2 * math.pi * t), uszy=-6.0)
            Q._obroc(arm, "neck", "Z", 5.0 * math.sin(2 * math.pi * t))
            Q._stoj(arm)
            Q._klucz(arm, f)
        Q._liniowo(a)
        return a
    return klip


def _rog(b, strefy, punkty, kol, kol_koniec, kosc="head"):
    """Róg / rura przypięta do łba, obie strony (punkty po L stronie)."""
    for strona in (1.0, -1.0):
        sciezka = [(Vector((p[0] * strona, p[1], p[2])), r, r, {kosc: 1.0}) for p, r in punkty]
        nr = Q._rura(b, sciezka, 7)
        for i, ring in enumerate(nr):
            strefy.extend([kol_koniec if i >= len(nr) - 2 else kol] * len(ring))
        koniec = sciezka[-1][0] + (sciezka[-1][0] - sciezka[-2][0]).normalized() * 0.06
        Q._czapka(b, nr[-1], koniec, zamknij=True)
        strefy.append(kol_koniec)


def _uszy_boczne(b, strefy, kosci, kol, dl=1.0, szer=0.30):
    """Uszy z bryłą, odstające w bok (bydło, owca)."""
    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        h, t, _p = kosci["ear.L"]
        h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
        t = h + (t - h) * dl
        sciezka = [(h.lerp(t, s), sz, gr, {"ear" + sfx: 1.0})
                   for s, sz, gr in ((0.0, szer * 0.7, 0.10), (0.5, szer, 0.08), (0.9, szer * 0.6, 0.06))]
        nr = Q._rura(b, sciezka, 8)
        for ring in nr:
            strefy.extend([kol] * len(ring))
        Q._czapka(b, nr[-1], t, zamknij=True)
        strefy.append(kol)


def _n_tulowia(G):
    return len(G.PROFIL) * G.N_TUL


# ════════════════════════════════════════════════════════════════════════════
# BYDŁO
# ════════════════════════════════════════════════════════════════════════════
BYDLO = Ksztalt(sx=1.25, sy=1.30, sz=1.08, opad_lba=2.0, cofniecie_lba=0.25, szer_tulowia=1.45,
                szer_szyi=1.35, szer_lba=1.30, brzuch=0.55, nogi_r=1.75, nogi_z=0.86, leb_dl=1.35, leb_wys=1.45)
BYK = Ksztalt(sx=1.32, sy=1.30, sz=1.13, opad_lba=2.4, cofniecie_lba=0.3, szer_tulowia=1.55,
              szer_szyi=1.50, szer_lba=1.40, brzuch=0.35, nogi_r=1.9, nogi_z=0.84, leb_dl=1.30, leb_wys=1.55)


def gatunek_bydla(nazwa, tag, plik, k, kolory, laty, rogi):
    profil, np_, nt, kosci = przeksztalc_jelenia(k)

    def ogon():
        p0 = Vector(kosci["tail_1"][0])
        return [(p0, 0.20, {"tail_1": 1.0}),
                (p0 + Vector((0, 0.35, -1.6)), 0.12, {"tail_1": 0.5, "tail_2": 0.5}),
                (p0 + Vector((0, 0.45, -3.6)), 0.10, {"tail_2": 1.0}),
                (p0 + Vector((0, 0.45, -4.4)), 0.30, {"tail_2": 1.0})]          # kita

    def dodatki(b, strefy):
        G = Q.G
        if laty:   # łaty: szum 3D na tułowiu i szyi (białe tło, czarno-łaciate)
            for i in range(_n_tulowia(G)):
                v = b.verts[i]
                if v.y > -4.5 and noise.noise(Vector((v.x * 0.20, v.y * 0.17, v.z * 0.20)) + Vector((3.1, 7.7, 1.3))) > 0.12:
                    strefy[i] = kolory["LATA"]
        _uszy_boczne(b, strefy, kosci, kolory["UCHO"], dl=0.75, szer=0.42)
        if laty:   # wymię: różowa bryła pod brzuchem, między tylnymi nogami
            y_w = _T(k, (0, 3.9, 0))[1]
            z_w = min(zd for yy, _zg, zd, _hw in G.PROFIL if abs(yy - y_w) < 1.2) + 0.15
            sciezka = [(Vector((0, y_w - 0.9, z_w + 0.3)), 0.75, 0.60, {"pelvis": 1.0}),
                       (Vector((0, y_w, z_w - 0.35)), 0.95, 0.75, {"pelvis": 1.0}),
                       (Vector((0, y_w + 0.7, z_w + 0.2)), 0.6, 0.5, {"pelvis": 1.0})]
            nr = Q._rura(b, sciezka, 10)
            for ring in nr:
                strefy.extend([kolory["PYSK"]] * len(ring))
            Q._czapka(b, nr[0], sciezka[0][0] + Vector((0, -0.2, 0.1)), zamknij=True, odwroc=True)
            strefy.append(kolory["PYSK"])
            Q._czapka(b, nr[-1], sciezka[-1][0] + Vector((0, 0.2, 0.1)), zamknij=True)
            strefy.append(kolory["PYSK"])
        if rogi:
            _rog(b, strefy, rogi, kolory["ROG"], kolory["ROG_KONIEC"])

    oko = _T(k, (0.62, -4.70, 9.60))
    return Q.Gatunek(
        NAZWA=nazwa, TAG=tag, ENV_PODGLAD=tag.upper() + "_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", plik),
        PROFIL=profil, SUPERELIPSA=2.3, GRZYWA_Y=(0.0, 0.0), GRZYWA_WYS=0.0, GRZYWA_KAT=0.0,
        NOGA_PRZOD=np_, NOGA_TYL=nt, KOSCI=kosci, N_TUL=18, N_NOGA=10, N_OGON=6,
        KOLOR_FUTRA=kolory["FUTRO"], KOLOR_GRZYWY=kolory["FUTRO"], KOLOR_PYSKA=kolory["PYSK"],
        PYSK_DO_Y=_T(k, (0, -5.30, 0))[1],
        KOLOR_CZUBKA=kolory["NOS"], KOLOR_NOGI=kolory["NOGA"], KOLOR_STOPY=kolory["RACICA"],
        KOLOR_UCHA=kolory["UCHO"], KOLOR_OKA=(16, 12, 12), KOLOR_OGONA=kolory["OGON"],
        KOLOR_BRZUCHA=kolory["BRZUCH"], BRZUCH_KAT=0.7,
        UCHO_BLASZKA=False, UCHO_LICO=(0.4, -1.0, 0.1), UCHO_POL_SZER=0.0,
        OKO=(oko[0] * 1.25, oko[1], oko[2]), OKO_NORMALNA=(-0.40, 0.15), OKO_PROMIEN=(0.15, 0.11),
        ogon_sciezka=ogon, OGON_KONIEC=(0, 0.0, -0.25),
        dodatki=dodatki,
        CHODY=chody(k.sz * k.nogi_z), WARIANTY_CHODU={},
        ZGIECIE_PRZOD=J.ZGIECIE_PRZOD, ZGIECIE_TYL=J.ZGIECIE_TYL, WAHANIE_LOPATKI=J.WAHANIE_LOPATKI,
        SRODRECZE_ZA_NOGA=J.SRODRECZE_ZA_NOGA,
        KLIPY_GATUNKU=(klip_jedzenie(kark=-42.0, leb=-18.0),),
        KLIPY_PODGLADU=("Idle", "Walk", "Eat"),
        KADR_PODGLADU=22.0, SRODEK_PODGLADU=6.0,
    )


def krowa():
    kol = dict(FUTRO=(232, 226, 214), LATA=(44, 40, 40), PYSK=(214, 176, 168), NOS=(178, 120, 118),
               NOGA=(214, 206, 194), RACICA=(52, 44, 40), UCHO=(220, 210, 200), OGON=(228, 222, 210),
               BRZUCH=(236, 228, 220), ROG=(226, 214, 186), ROG_KONIEC=(120, 108, 92))
    h = _T(BYDLO, (0.40, -4.20, 10.20))
    rogi = [((h[0], h[1], h[2]), 0.20), ((h[0] + 0.55, h[1] - 0.05, h[2] + 0.30), 0.15),
            ((h[0] + 0.95, h[1] - 0.25, h[2] + 0.75), 0.09)]
    return gatunek_bydla("Cow", "krowa", "cow.glb", BYDLO, kol, True, rogi)


def byk():
    kol = dict(FUTRO=(112, 70, 46), LATA=(112, 70, 46), PYSK=(92, 62, 48), NOS=(56, 40, 36),
               NOGA=(84, 54, 38), RACICA=(36, 28, 26), UCHO=(104, 66, 44), OGON=(72, 48, 36),
               BRZUCH=(132, 90, 62), ROG=(232, 220, 190), ROG_KONIEC=(70, 60, 52))
    h = _T(BYK, (0.40, -4.20, 10.20))
    rogi = [((h[0], h[1], h[2]), 0.30), ((h[0] + 0.85, h[1] - 0.10, h[2] + 0.15), 0.24),
            ((h[0] + 1.55, h[1] - 0.55, h[2] + 0.70), 0.15), ((h[0] + 1.75, h[1] - 0.95, h[2] + 1.35), 0.07)]
    return gatunek_bydla("Bull", "byk", "bull.glb", BYK, kol, False, rogi)


# ════════════════════════════════════════════════════════════════════════════
# OWCE
# ════════════════════════════════════════════════════════════════════════════
OWCA_K = Ksztalt(sx=0.82, sy=0.70, sz=0.66, opad_lba=1.6, cofniecie_lba=0.6, szer_tulowia=1.0,
                 szer_szyi=1.35, szer_lba=1.10, brzuch=0.1, nogi_r=0.85, nogi_z=0.85)
WELNA = ((214, 206, 188), (242, 236, 220))


def gatunek_owcy(nazwa, tag, plik, rogi_baran):
    k = OWCA_K
    profil, np_, nt, kosci = przeksztalc_jelenia(k)
    kol = dict(PYSK=(70, 62, 58), NOS=(30, 26, 26), NOGA=(68, 60, 56), RACICA=(34, 30, 28), UCHO=(76, 66, 60))

    def ogon():
        p0 = Vector(kosci["tail_1"][0])
        return [(p0, 0.30, {"tail_1": 1.0}), (p0 + Vector((0, 0.25, -0.6)), 0.34, {"tail_1": 0.5, "tail_2": 0.5}),
                (p0 + Vector((0, 0.30, -1.2)), 0.22, {"tail_2": 1.0})]

    def dodatki(b, strefy):
        G = Q.G
        # wełna: tułów i szyja „puchną" kłębami (szum), łeb zostaje gładki i ciemny
        y_leb = _T(k, (0, LEB_Y + 0.3, 0))[1]
        for i in range(_n_tulowia(G)):
            v = b.verts[i]
            if v.y <= y_leb:
                continue
            pierscien = i // G.N_TUL
            _y, zg, zd, _hw = G.PROFIL[pierscien]
            c = Vector((0, v.y, (zg + zd) / 2))
            r = v - c
            kleb = 0.5 + 0.5 * noise.noise(v * 1.6 + Vector((5.0, 1.0, 2.0)))
            if r.length > 1e-6:
                b.verts[i] = v + r.normalized() * (0.55 + 0.45 * kleb)
            strefy[i] = tuple(a + (bb - a) * kleb for a, bb in zip(*WELNA))
        _uszy_boczne(b, strefy, kosci, kol["UCHO"], dl=0.7, szer=0.30)
        if rogi_baran:   # zakręcony róg: spirala od czoła w tył, w dół i do przodu przy policzku
            h = Vector(_T(k, (0.42, -4.15, 10.10)))
            pts = []
            for j in range(9):
                a = j / 8 * math.pi * 1.6
                rr = 0.95 * (1 - 0.35 * j / 8)
                p = h + Vector((0.30 + 0.06 * j, 0.55 - rr * math.cos(a) + 0.5, rr * math.sin(a) * 0.95 - 0.2 * j / 8))
                pts.append(((p.x, p.y, p.z), 0.30 * (1 - 0.65 * j / 8) + 0.06))
            _rog(b, strefy, pts, (196, 176, 140), (150, 132, 104))

    oko = _T(k, (0.62, -4.70, 9.60))
    return Q.Gatunek(
        NAZWA=nazwa, TAG=tag, ENV_PODGLAD=tag.upper() + "_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", plik),
        PROFIL=profil, SUPERELIPSA=2.0, GRZYWA_Y=(0.0, 0.0), GRZYWA_WYS=0.0, GRZYWA_KAT=0.0,
        NOGA_PRZOD=np_, NOGA_TYL=nt, KOSCI=kosci, N_TUL=18, N_NOGA=8, N_OGON=6,
        KOLOR_FUTRA=WELNA[1], KOLOR_GRZYWY=WELNA[1], KOLOR_PYSKA=kol["PYSK"], PYSK_DO_Y=_T(k, (0, LEB_Y + 0.3, 0))[1],
        KOLOR_CZUBKA=kol["NOS"], KOLOR_NOGI=kol["NOGA"], KOLOR_STOPY=kol["RACICA"],
        KOLOR_UCHA=kol["UCHO"], KOLOR_OKA=(14, 12, 12), KOLOR_OGONA=WELNA[0],
        UCHO_BLASZKA=False, UCHO_LICO=(0.4, -1.0, 0.1), UCHO_POL_SZER=0.0,
        OKO=(oko[0] * 1.1, oko[1], oko[2]), OKO_NORMALNA=(-0.40, 0.15), OKO_PROMIEN=(0.11, 0.08),
        ogon_sciezka=ogon, OGON_KONIEC=(0, 0.0, -0.15),
        dodatki=dodatki,
        CHODY=chody(k.sz * k.nogi_z), WARIANTY_CHODU={},
        ZGIECIE_PRZOD=J.ZGIECIE_PRZOD, ZGIECIE_TYL=J.ZGIECIE_TYL, WAHANIE_LOPATKI=J.WAHANIE_LOPATKI,
        SRODRECZE_ZA_NOGA=J.SRODRECZE_ZA_NOGA,
        KLIPY_GATUNKU=(klip_jedzenie(kark=-40.0, leb=-16.0),),
        KLIPY_PODGLADU=("Idle", "Walk", "Eat"),
        KADR_PODGLADU=12.0, SRODEK_PODGLADU=3.4,
    )


# ════════════════════════════════════════════════════════════════════════════
# ŚWINIA (z dzika)
# ════════════════════════════════════════════════════════════════════════════
def _swinia_T(p):
    """Dzik → świnia domowa: krótki, tępy ryj (55% długości) i krótsze nogi
    (wszystko poniżej brzucha dzika ×0,75, tułów obniżony o tę stratę)."""
    x, y, z = p
    if y < -3.0:
        y = -3.0 + (y + 3.0) * 0.55
    # racice (z < 0,55) zostają — skrócenie całej nogi wbijało je pod grunt
    zr, zb, k = 0.55, 2.3, 0.70
    if zr <= z < zb:
        z = zr + (z - zr) * k
    elif z >= zb:
        z -= (zb - zr) * (1 - k)
    return (x, y, z)


def swinia():
    kol = dict(FUTRO=(226, 170, 160), NOGA=(214, 154, 146), RACICA=(92, 62, 60), RYJ=(232, 156, 152),
               CZUBEK=(206, 120, 118), UCHO=(218, 150, 144))
    # tułów pełniejszy, grzbiet wyrównany (bez kłębu dzika) — PŁYNNIE, nie
    # przedziałami (przedziały dawały stopnie jak u byka)
    profil = []
    for y, zg, zd, hw in D.PROFIL:
        klab = _gladko((y + 2.3) / 0.6) * (1 - _gladko((y - 0.6) / 0.8))
        tul = _gladko((y + 2.0) / 0.5)
        zg2 = _swinia_T((0, y, zg - 0.25 * klab))[2]
        zd2 = _swinia_T((0, y, zd - 0.15 * tul))[2]
        profil.append((_swinia_T((0, y, 0))[1], zg2, zd2, hw * (1 + 0.14 * tul)))
    nogi = [[(_swinia_T(p), r * (1.15 if i < 4 else 1.0)) for i, (p, r) in enumerate(tab)] for tab in (D.NOGA_PRZOD, D.NOGA_TYL)]
    kosci = {n: (_swinia_T(h), _swinia_T(t), par) for n, (h, t, par) in D.KOSCI.items()}
    # ucho zwisa: końcówka kości nisko i z przodu (nad oczami)
    kosci["ear.L"] = (_swinia_T((0.55, -1.95, 5.05)), _swinia_T((1.10, -2.75, 4.85)), "head")

    def ogon():   # zakręcony ogonek: spirala za zadem
        p0 = Vector(kosci["tail_1"][0]) + Vector((0, 0.05, 0))
        pts = [(p0, 0.10, {"tail_1": 1.0})]
        for j in range(1, 6):
            a = j / 5 * math.pi * 2.2
            pts.append((p0 + Vector((0.28 * math.sin(a), 0.25 + 0.06 * j, -0.10 * j + 0.28 * math.cos(a) - 0.28)),
                        0.08, {"tail_1": 0.4, "tail_2": 0.6}))
        return pts

    G = Q.Gatunek(**dict(D.G.__dict__))
    G.__dict__.update(
        NAZWA="Pig", TAG="swinia", ENV_PODGLAD="SWINIA_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "pig.glb"),
        PROFIL=profil, NOGA_PRZOD=nogi[0], NOGA_TYL=nogi[1], KOSCI=kosci,
        SUPERELIPSA=2.2, GRZYWA_WYS=0.0, PYSK_DO_Y=_swinia_T((0, D.G.PYSK_DO_Y, 0))[1],
        KOLOR_FUTRA=kol["FUTRO"], KOLOR_GRZYWY=kol["FUTRO"], KOLOR_PYSKA=kol["RYJ"], KOLOR_CZUBKA=kol["CZUBEK"],
        KOLOR_NOGI=kol["NOGA"], KOLOR_STOPY=kol["RACICA"], KOLOR_UCHA=kol["UCHO"], KOLOR_OGONA=kol["FUTRO"],
        UCHO_LICO=(0.3, -0.6, 0.9), UCHO_POL_SZER=0.58,
        OKO=_swinia_T(D.G.OKO),
        ogon_sciezka=ogon, dodatki=None, WARIANTY_CHODU={},
        CHODY=chody_z(D.CHODY, 0.78),
        KLIPY_GATUNKU=(klip_jedzenie(kark=-14.0, leb=-22.0),),
        KLIPY_PODGLADU=("Idle", "Walk", "Eat"),
    )
    return G


# ════════════════════════════════════════════════════════════════════════════
# KOT (z lisa): mniejszy, krótki pysk, okrągła czaszka, cienki ogon w górę
# ════════════════════════════════════════════════════════════════════════════
import fox3d as L  # noqa: E402

KOT_SKALA = 0.66          # kot ~0,26 m w kłębie wobec lisa 0,40 m
KOTY = {   # umaszczenia z `ASSETS.cat.colors` — osobny plik na kolor
    "black": dict(FUTRO=(46, 42, 46), BRZUCH=(58, 54, 58), UCHO=(40, 36, 40), NOS=(30, 24, 26), LAPA=(36, 32, 36)),
    "brown": dict(FUTRO=(120, 88, 60), BRZUCH=(196, 170, 136), UCHO=(96, 70, 50), NOS=(80, 52, 46), LAPA=(186, 162, 130)),
    "orange": dict(FUTRO=(214, 128, 52), BRZUCH=(236, 214, 180), UCHO=(190, 108, 46), NOS=(196, 110, 104), LAPA=(236, 214, 180)),
    "white": dict(FUTRO=(232, 230, 224), BRZUCH=(240, 238, 232), UCHO=(222, 186, 184), NOS=(214, 150, 150), LAPA=(234, 232, 226)),
}


def _kot_T(p):
    x, y, z = p
    if y < -2.45:                          # pysk krótki: 45% lisiego
        y = -2.45 + (y + 2.45) * 0.45
    return (x * KOT_SKALA, y * KOT_SKALA, z * KOT_SKALA)


def kot(kolor):
    c = KOTY[kolor]
    profil = []
    for y, zg, zd, hw in L.PROFIL:
        if -2.6 < y < -1.9:                # okrągła czaszka
            hw *= 1.18
            zg += 0.10
        _, y2, zg2 = _kot_T((0, y, zg))
        zd2 = _kot_T((0, y, zd))[2]
        profil.append((y2, zg2, zd2, hw * KOT_SKALA * (0.92 if y > -1.6 else 1.0)))
    nogi = [[(_kot_T(p), r * KOT_SKALA * 0.95) for p, r in tab] for tab in (L.NOGA_PRZOD, L.NOGA_TYL)]
    kosci = {n: (_kot_T(h), _kot_T(t), par) for n, (h, t, par) in L.KOSCI.items()}
    kosci["ear.L"] = (_kot_T((0.30, -2.25, 3.15)), _kot_T((0.40, -2.25, 3.62)), "head")

    def ogon():   # cienki, długi, łukiem w górę
        p0 = Vector(kosci["tail_1"][0])
        return [(p0, 0.11, {"tail_1": 1.0}),
                (p0 + Vector((0, 0.40, 0.12)), 0.11, {"tail_1": 0.5, "tail_2": 0.5}),
                (p0 + Vector((0, 0.65, 0.50)), 0.10, {"tail_2": 1.0}),
                (p0 + Vector((0, 0.68, 0.90)), 0.09, {"tail_2": 0.5, "tail_3": 0.5}),
                (p0 + Vector((0, 0.55, 1.15)), 0.08, {"tail_3": 1.0})]

    def uszy(b, strefy):
        for strona in (1.0, -1.0):
            sfx = ".L" if strona > 0 else ".R"
            h, t, _p = kosci["ear.L"]
            h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
            sciezka = [(h.lerp(t, s), sz, gr, {"ear" + sfx: 1.0})
                       for s, sz, gr in ((0.0, 0.15, 0.07), (0.5, 0.10, 0.05), (0.95, 0.02, 0.02))]
            nr = Q._rura(b, sciezka, 8)
            for ring in nr:
                strefy.extend([c["UCHO"]] * len(ring))
            Q._czapka(b, nr[-1], t, zamknij=True)
            strefy.append(c["UCHO"])

    G = Q.Gatunek(**dict(L.G.__dict__))
    G.__dict__.update(
        NAZWA="Cat", TAG="kot_" + kolor, ENV_PODGLAD="KOT_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", f"cat_{kolor}.glb"),
        PROFIL=profil, NOGA_PRZOD=nogi[0], NOGA_TYL=nogi[1], KOSCI=kosci,
        KOLOR_FUTRA=c["FUTRO"], KOLOR_GRZYWY=c["FUTRO"], KOLOR_PYSKA=c["FUTRO"], PYSK_DO_Y=-9.0,
        KOLOR_CZUBKA=c["NOS"], KOLOR_NOGI=c["FUTRO"], KOLOR_STOPY=c["LAPA"], KOLOR_UCHA=c["UCHO"],
        KOLOR_OKA=(40, 60, 30), KOLOR_OGONA=c["FUTRO"], KOLOR_BRZUCHA=c["BRZUCH"], BRZUCH_KAT=0.8,
        OGON_KONCOWKA=None, OKO=_kot_T((0.42, -2.50, 2.98)), OKO_PROMIEN=(0.07, 0.06),
        ogon_sciezka=ogon, dodatki=uszy,
        CHODY=chody_z(L.CHODY, KOT_SKALA), WARIANTY_CHODU={},
        KLIPY_GATUNKU=(klip_jedzenie(kark=-20.0, leb=-10.0),),
        KLIPY_PODGLADU=("Idle", "Walk", "Eat"), KADR_PODGLADU=5.5, SRODEK_PODGLADU=1.1,
    )
    return G


def chody_z(zrodlo, skala):
    out = {}
    for n, ch in zrodlo.items():
        c = dict(ch)
        c["krok"] = tuple(v * skala for v in ch["krok"])
        c["lift"] = ch["lift"] * skala
        out[n] = c
    return out


# ════════════════════════════════════════════════════════════════════════════
# KURA — ten sam rdzeń: tułów-jajo z szyją i ogonem w górę (profil), dwie
# nogi = TYLNE nogi rdzenia pod środkiem ciała; PRZEDNIE schowane w tułowiu
# (rdzeń zawsze ma cztery). Grzebień = „uszy" blaszką na czubku łba.
# Skala naturalna (~0,40 m), w grze powiększa `MODELE_3D.chicken.skala`.
# ════════════════════════════════════════════════════════════════════════════
KURA_PROFIL = [
    (-1.80, 2.31, 2.21, 0.05),   # czubek dzioba
    (-1.66, 2.37, 2.15, 0.10),
    (-1.52, 2.56, 2.05, 0.20),   # twarz
    (-1.40, 2.64, 2.00, 0.25),   # łeb
    (-1.27, 2.60, 1.95, 0.24),
    (-1.14, 2.42, 1.74, 0.22),   # szyja
    (-1.00, 2.17, 1.32, 0.31),
    (-0.86, 1.98, 0.96, 0.43),   # pierś
    (-0.62, 1.92, 0.80, 0.52),
    (-0.32, 1.89, 0.75, 0.56),
    (0.00, 1.87, 0.75, 0.57),
    (0.30, 1.86, 0.78, 0.55),
    (0.55, 1.89, 0.86, 0.48),
    (0.78, 2.02, 0.99, 0.36),    # nasada ogona
    (0.98, 2.27, 1.16, 0.24),
    (1.13, 2.48, 1.42, 0.14),    # pióra ogona
    (1.23, 2.58, 1.72, 0.06),
]
_PRZOD_UKRYTY = [((0.15, -0.40, 1.30), 0.02), ((0.15, -0.36, 1.05), 0.02), ((0.15, -0.37, 1.00), 0.02),
                 ((0.15, -0.40, 0.95), 0.02), ((0.15, -0.40, 0.90), 0.02), ((0.15, -0.42, 0.88), 0.02),
                 ((0.15, -0.45, 0.86), 0.02)]
KURA_NOGA = [((0.20, 0.05, 1.10), 0.22), ((0.26, -0.15, 0.65), 0.16), ((0.25, -0.02, 0.54), 0.09),
             ((0.25, 0.10, 0.42), 0.06), ((0.24, 0.02, 0.10), 0.055), ((0.24, -0.12, 0.05), 0.06),
             ((0.24, -0.30, 0.04), 0.05)]
KURA_KOSCI = {
    "root": ((0, 0, 0), (0, 0, 1.0), None),
    "pelvis": ((0, 0.60, 1.40), (0, 0.0, 1.35), "root"),
    "spine": ((0, 0.0, 1.35), (0, -0.50, 1.35), "pelvis"),
    "chest": ((0, -0.50, 1.35), (0, -0.95, 1.60), "spine"),
    "neck": ((0, -0.95, 1.60), (0, -1.25, 2.25), "chest"),
    "head": ((0, -1.25, 2.25), (0, -1.50, 2.35), "neck"),
    "snout": ((0, -1.50, 2.35), (0, -1.80, 2.26), "head"),
    "tail_1": ((0, 0.78, 1.60), (0, 1.05, 2.00), "pelvis"),
    "tail_2": ((0, 1.05, 2.00), (0, 1.25, 2.50), "tail_1"),
    "ear.L": ((0.03, -1.45, 2.60), (0.03, -1.32, 2.92), "head"),
    "scap_f.L": ((0.15, -0.40, 1.30), (0.15, -0.36, 1.05), "chest"),
    "upper_f.L": ((0.15, -0.36, 1.05), (0.15, -0.37, 1.00), "scap_f.L"),
    "fore_f.L": ((0.15, -0.37, 1.00), (0.15, -0.40, 0.90), "upper_f.L"),
    "cannon_f.L": ((0.15, -0.40, 0.90), (0.15, -0.40, 0.88), "fore_f.L"),
    "hoof_f.L": ((0.15, -0.40, 0.88), (0.15, -0.45, 0.86), "cannon_f.L"),
    "thigh_h.L": ((0.20, 0.05, 1.10), (0.26, -0.15, 0.65), "pelvis"),
    "shank_h.L": ((0.26, -0.15, 0.65), (0.25, 0.10, 0.42), "thigh_h.L"),
    "cannon_h.L": ((0.25, 0.10, 0.42), (0.24, 0.02, 0.10), "shank_h.L"),
    "hoof_h.L": ((0.24, 0.02, 0.10), (0.24, -0.30, 0.03), "cannon_h.L"),
}


def klip_dziobanie(arm):
    """Kura dziobie: szybkie skłony szyi do ziemi, między nimi rozglądanie."""
    a = Q._nowa_akcja(arm, "Eat")
    n = 30
    for f in range(n + 1):
        t = (f % n) / n
        dz = max(0.0, math.sin(2 * math.pi * t * 3)) ** 3 if t < 0.6 else 0.0
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pochyl_klatka=-14.0 * dz - 4.0, kark=-55.0 * dz, leb=-20.0 * dz, ogon=6.0 * math.sin(2 * math.pi * t))
        Q._obroc(arm, "neck", "Z", 18.0 * math.sin(2 * math.pi * t) * (1 - dz))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def kura():
    PIORO, PIORO_C = (232, 222, 200), (196, 178, 150)

    def ogon():   # ogon ukryty w profilu — tylko krótki „kuper"
        p0 = Vector(KURA_KOSCI["tail_1"][0])
        return [(p0, 0.05, {"tail_1": 1.0}), (p0 + Vector((0, 0.1, 0.1)), 0.04, {"tail_1": 1.0})]

    def dodatki(b, strefy):
        G = Q.G
        for i in range(_n_tulowia(G)):          # skrzydła: ciemniejszy pas po bokach tułowia
            v = b.verts[i]
            if -0.7 < v.y < 0.6 and abs(v.x) > 0.38 and 1.0 < v.z < 1.75:
                strefy[i] = PIORO_C
        for strona in (1.0, -1.0):              # korale pod dziobem
            c = Vector((0.05 * strona, -1.50, 2.08))
            sciezka = [(c, 0.06, 0.06, {"head": 1.0}), (c + Vector((0, 0.03, -0.15)), 0.07, 0.07, {"head": 1.0})]
            nr = Q._rura(b, sciezka, 6)
            for ring in nr:
                strefy.extend([(200, 40, 36)] * len(ring))
            Q._czapka(b, nr[-1], sciezka[-1][0] + Vector((0, 0, -0.05)), zamknij=True)
            strefy.append((200, 40, 36))

    return Q.Gatunek(
        NAZWA="Chicken", TAG="kura", ENV_PODGLAD="KURA_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "chicken.glb"),
        PROFIL=KURA_PROFIL, SUPERELIPSA=2.0, GRZYWA_Y=(0.0, 0.0), GRZYWA_WYS=0.0, GRZYWA_KAT=0.0,
        NOGA_PRZOD=_PRZOD_UKRYTY, NOGA_TYL=KURA_NOGA, KOSCI=KURA_KOSCI, N_TUL=14, N_NOGA=6, N_OGON=4,
        KOLOR_FUTRA=PIORO, KOLOR_GRZYWY=PIORO, KOLOR_PYSKA=(226, 170, 60), PYSK_DO_Y=-1.60,
        KOLOR_CZUBKA=(210, 150, 50), KOLOR_NOGI=(222, 172, 64), KOLOR_STOPY=(214, 160, 58),
        KOLOR_UCHA=(206, 40, 36), KOLOR_OKA=(20, 16, 14), KOLOR_OGONA=PIORO,
        UCHO_BLASZKA=True, UCHO_LICO=(1.0, 0.0, 0.0), UCHO_POL_SZER=0.14,
        OKO=(0.20, -1.45, 2.42), OKO_NORMALNA=(-0.3, 0.1), OKO_PROMIEN=(0.05, 0.05),
        ogon_sciezka=ogon, OGON_KONIEC=(0, 0.02, 0.02),
        dodatki=dodatki,
        CHODY={"Walk": dict(n=16, duty=0.60, krok=(0.0, 0.55), lift=0.18,
                            fazy={"LP": 0.0, "PP": 0.5, "LT": 0.0, "PT": 0.5}, bob=0.04, kiwanie=10.0)},
        WARIANTY_CHODU={},
        ZGIECIE_PRZOD=0.0, ZGIECIE_TYL=30.0, WAHANIE_LOPATKI=0.0, SRODRECZE_ZA_NOGA=0.3,
        KLIPY_GATUNKU=(klip_dziobanie,),
        KLIPY_PODGLADU=("Idle", "Walk", "Eat"), KADR_PODGLADU=4.0, SRODEK_PODGLADU=1.4,
    )


# ════════════════════════════════════════════════════════════════════════════
# PSY (2026-10-11) — z WILKA (`wolf3d.py`), tak jak kot jest z lisa: ten sam
# szkielet, profil i chody; inna maść, klip `Eat` (węszenie przy ziemi) zamiast
# wycia i kęsa. „Mniejszy od wilka" robi skala w grze (`MODELE_3D.dog.skala`).
# Kira (Kirka) — szczupła kundelka Anny, CZARNA PODPALANA (kanon: `docs/swiat.md`
# „Anna”, ze zdjęcia autora 2026-10-11): czarny grzbiet, głowa, uszy i ogon,
# płowe policzki, pierś, brzuch i łapy. ⚠ Do 2026-10-11 była tu ruda — pomyłka:
# „ruda” w wypowiedzi autora dotyczyła kota bohatera.
# owczarki Gniewka BIAŁE — tradycyjna maść psa pasterskiego, żeby nocą przy
# stadzie dało się go odróżnić od wilka.
# ════════════════════════════════════════════════════════════════════════════
import wolf3d as Wf  # noqa: E402

PSY = {
    "pies": dict(tag="pies_kira", plik="dog.glb", rampa=dict(
        FUTRO=(40, 35, 34), GRZYWA=(34, 30, 30), BRZUCH=(206, 162, 110), PYSK=(176, 134, 90),
        NOS=(30, 24, 24), NOGA=(198, 152, 100), LAPA=(212, 170, 120), UCHO=(36, 32, 32),
        OKO=(96, 62, 30), OGON=(38, 34, 33))),
    "owczarek": dict(tag="owczarek", plik="sheepdog.glb", rampa=dict(
        FUTRO=(226, 222, 210), GRZYWA=(208, 202, 188), BRZUCH=(236, 232, 222), PYSK=(222, 216, 204),
        NOS=(38, 34, 34), NOGA=(214, 208, 196), LAPA=(204, 198, 184), UCHO=(200, 192, 178),
        OKO=(80, 56, 32), OGON=(220, 214, 202))),
}


def pies(klucz):
    p = PSY[klucz]
    r = Wf._przyciemnij(p["rampa"])          # ta sama poprawka jasności co wilk (światło gry)
    G = Q.Gatunek(**dict(Wf.WILK.__dict__))
    G.__dict__.update(
        NAZWA="Dog", TAG=p["tag"], ENV_PODGLAD="PIES_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", p["plik"]),
        KOLOR_FUTRA=r["FUTRO"], KOLOR_GRZYWY=r["GRZYWA"], KOLOR_PYSKA=r["PYSK"], KOLOR_CZUBKA=r["NOS"],
        KOLOR_NOGI=r["NOGA"], KOLOR_STOPY=r["LAPA"], KOLOR_UCHA=r["UCHO"], KOLOR_OKA=r["OKO"],
        KOLOR_OGONA=r["OGON"], KOLOR_BRZUCHA=r["BRZUCH"],
        # węszenie: nos przy ziemi, ogon chodzi — `FarmAnimal` gra `Eat` na postoju
        KLIPY_GATUNKU=(klip_jedzenie(kark=-30.0, leb=-14.0),),
        KLIPY_PODGLADU=("Idle", "Walk", "Eat"),
    )
    return G


GATUNKI = {"krowa": krowa, "byk": byk, "kura": kura,
           "pies": lambda: pies("pies"), "owczarek": lambda: pies("owczarek"),
           **{f"kot_{k}": (lambda k=k: kot(k)) for k in KOTY}, "owca": lambda: gatunek_owcy("Sheep", "owca", "sheep.glb", False),
           "baran": lambda: gatunek_owcy("Ram", "baran", "ram.glb", True), "swinia": swinia}


if __name__ == "__main__":
    Q.glowny(GATUNKI[GATUNEK]())

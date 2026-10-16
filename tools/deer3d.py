"""Jeleń 3D — gatunek dla RDZENIA czworonogów (`tools/quad3d.py`).

    blender -b --python tools/deer3d.py                 # przymiar: render podglądu + raport
    blender -b --python tools/deer3d.py -- --zapisz     # + public/assets/animals/deer.glb

Proporcje (długie nogi z brzuchem w połowie wysokości, kłąb ledwie nad
zadem, długa szyja wznosząca się ku przodowi, łeb noszony wysoko, łokieć za
linią nogi, długie śródstopie tylne z wysokim stawem skokowym) i fazy ruchu
z POMIARU modelu referencyjnego jelenia (2026-10-04); poroże, zapowiedź
ciosu (łeb w dół, racica w ziemię) i cios porożem zaprojektowane tu, pod
stany `src/entities/Deer.ts`. Jednostki postaci: jeleń szlachetny, byk,
~1,17 m w kłębie (8,1 j.).

⚠ **Poroże NIE z referencji** — tam był wapiti z porożem rozłożonym na
±3,8 j. i 4 j. ponad czaszką; z kamery gry byłoby kratą cienkich kresek
większą od zwierzęcia. Tu: grubsze, krótsze, sześć odnóg na stronę.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import quad3d as Q  # noqa: E402
from mathutils import Vector  # noqa: E402

# ════════════════════════════════════════════════════════════════════════════
# PROPORCJE — j. postaci. (y, z_góra, z_dół, pół_szerokości), pysk (−Y) → zad.
# ════════════════════════════════════════════════════════════════════════════
# ⚠ Łeb +1,0 j. i smuklejsza szyja względem pomiaru: łeb z referencji (poza
# oddechu) siedział prawie na piersi i jeleń z kamery gry nie miał szyi.
PROFIL = [
    (-6.15, 9.06, 8.33, 0.30),   # nos
    (-5.66, 9.42, 8.30, 0.44),   # pysk
    (-5.16, 9.93, 8.32, 0.56),
    (-4.66, 10.29, 8.05, 0.70),   # czoło, oczy
    (-4.16, 10.31, 7.65, 0.76),   # tył czaszki
    (-3.67, 9.95, 6.95, 0.68),   # szyja pod łbem
    (-3.17, 9.20, 5.95, 0.74),
    (-2.67, 8.55, 5.05, 0.92),   # nasada szyi, mostek
    (-2.17, 8.15, 4.40, 1.22),   # kłąb, pierś
    (-1.68, 8.15, 4.13, 1.30),
    (-1.18, 8.05, 4.06, 1.33),
    (-0.68, 8.02, 4.07, 1.34),
    (-0.18, 8.05, 4.08, 1.36),
    (0.32, 8.02, 4.04, 1.38),
    (0.81, 7.85, 3.95, 1.42),    # brzuch
    (1.31, 7.75, 3.92, 1.45),
    (1.81, 7.70, 3.85, 1.42),
    (2.31, 7.69, 3.88, 1.38),
    (2.80, 7.70, 4.00, 1.32),    # lędźwie
    (3.30, 7.70, 4.20, 1.28),
    (3.80, 7.69, 4.25, 1.28),
    (4.30, 7.58, 4.25, 1.30),    # biodra
    (4.79, 7.51, 4.38, 1.27),
    (5.29, 7.29, 4.70, 1.12),
    (5.79, 6.92, 5.35, 0.84),    # koniec zadu
]
SUPERELIPSA = 2.2
#: Grzywa byka na szyi — ciemniejsza i lekko podniesiona sierść.
GRZYWA_Y = (-3.80, -2.00)
GRZYWA_WYS = 0.14
GRZYWA_KAT = 1.20

# ⚠ Górne pierścienie nóg W tułowiu (x + r < pół szerokości) — lekcja dzika.
NOGA_PRZOD = [  # bark → łokieć (ZA linią nogi) → przedramię → nadgarstek → pęcina → racica
    ((0.62, -1.05, 5.85), 0.55),
    ((0.70, -0.25, 4.45), 0.38),
    ((0.70, -0.55, 3.40), 0.33),
    ((0.70, -0.78, 2.42), 0.25),
    # Racica POZIOMO: środek pierścienia ≥ r nad gruntem (lekcja wilka).
    ((0.72, -1.00, 0.62), 0.21),
    ((0.72, -1.12, 0.30), 0.23),
    ((0.72, -1.30, 0.13), 0.15),
]
NOGA_TYL = [    # biodro → kolano (z przodu) → podudzie → staw skokowy (wysoko) → pęcina → racica
    ((0.62, 4.50, 6.10), 0.62),
    ((0.78, 4.00, 4.45), 0.48),
    ((0.70, 4.85, 3.70), 0.38),
    ((0.62, 5.70, 2.90), 0.27),
    ((0.60, 5.50, 0.62), 0.21),
    ((0.60, 5.38, 0.30), 0.23),
    ((0.60, 5.22, 0.13), 0.15),
]

KOSCI = {  # nazwa: (głowa, ogon, rodzic) — L strona, prawa = lustro x
    "root":        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
    "pelvis":      ((0.0, 4.50, 6.20), (0.0, 2.30, 6.35), "root"),
    "spine":       ((0.0, 2.30, 6.35), (0.0, 0.00, 6.40), "pelvis"),
    "chest":       ((0.0, 0.00, 6.40), (0.0, -2.00, 6.60), "spine"),
    "neck":        ((0.0, -2.00, 6.60), (0.0, -3.70, 9.10), "chest"),
    "head":        ((0.0, -3.70, 9.10), (0.0, -4.70, 9.35), "neck"),
    "snout":       ((0.0, -4.70, 9.35), (0.0, -6.15, 8.70), "head"),
    "tail_1":      ((0.0, 5.70, 6.80), (0.0, 6.05, 6.45), "pelvis"),
    "tail_2":      ((0.0, 6.05, 6.45), (0.0, 6.20, 6.05), "tail_1"),
    "ear.L":       ((0.58, -4.00, 9.85), (1.30, -3.90, 10.40), "head"),
    "scap_f.L":    ((0.62, -0.70, 7.30), (0.66, -1.07, 5.82), "chest"),
    # Łokieć cofnięty o 0,17 j. względem pomiaru — zapas zasięgu 0,16 → 0,29 j.
    "upper_f.L":   ((0.66, -1.07, 5.82), (0.70, -0.25, 4.45), "scap_f.L"),
    "fore_f.L":    ((0.70, -0.25, 4.45), (0.70, -0.78, 2.42), "upper_f.L"),
    "cannon_f.L":  ((0.70, -0.78, 2.42), (0.72, -1.00, 0.62), "fore_f.L"),
    "hoof_f.L":    ((0.72, -1.00, 0.62), (0.72, -1.30, 0.05), "cannon_f.L"),
    "thigh_h.L":   ((0.66, 4.50, 6.20), (0.80, 4.00, 4.40), "pelvis"),
    "shank_h.L":   ((0.80, 4.00, 4.40), (0.62, 5.70, 2.90), "thigh_h.L"),
    "cannon_h.L":  ((0.62, 5.70, 2.90), (0.60, 5.50, 0.62), "shank_h.L"),
    "hoof_h.L":    ((0.60, 5.50, 0.62), (0.60, 5.22, 0.05), "cannon_h.L"),
}

# ── kolory stref (sRGB) ×0,90 jak wilki: światło gry rozjaśnia bryłę ─────────
JASNOSC_W_GRZE = 0.90
_RAMPA = dict(FUTRO=(150, 96, 60), GRZYWA=(104, 72, 50), BRZUCH=(196, 170, 132), PYSK=(132, 100, 76),
              NOS=(34, 28, 26), NOGA=(112, 78, 54), RACICA=(42, 34, 30), UCHO=(140, 94, 62), OKO=(16, 12, 12),
              OGON=(226, 210, 176), POROZE=(192, 172, 134), POROZE_KONIEC=(232, 222, 196))
R = {k: (v if k in ("OKO", "NOS") else tuple(round(c * JASNOSC_W_GRZE) for c in v)) for k, v in _RAMPA.items()}


def _ogon():
    """Krótki, jasny ogonek (lustro jelenia)."""
    k = KOSCI
    return [(Vector(k["tail_1"][0]) + Vector((0, -0.05, 0)), 0.22, {"tail_1": 1.0}),
            (Vector(k["tail_1"][1]), 0.24, {"tail_1": 0.5, "tail_2": 0.5}),
            (Vector(k["tail_2"][1]), 0.12, {"tail_2": 1.0})]


#: Poroże (L strona, prawa = lustro): tyka + odnogi, każda (punkty, promienie).
TYKA = [((0.36, -4.15, 10.05), 0.21), ((0.85, -3.95, 11.00), 0.18), ((1.35, -3.55, 11.90), 0.15),
        ((1.65, -3.15, 12.60), 0.13), ((1.75, -2.95, 13.20), 0.10)]
ODNOGI = [
    [((0.55, -4.08, 10.45), 0.14), ((0.78, -4.80, 10.78), 0.10), ((0.88, -5.20, 11.12), 0.06)],   # oczna
    [((1.05, -3.82, 11.40), 0.12), ((1.22, -4.45, 11.82), 0.08), ((1.28, -4.75, 12.15), 0.05)],  # nadoczna
    [((1.62, -3.20, 12.55), 0.10), ((2.10, -3.40, 13.20), 0.07), ((2.20, -3.45, 13.45), 0.05)],  # korona
    [((1.66, -3.15, 12.65), 0.10), ((1.48, -3.62, 13.25), 0.07), ((1.42, -3.75, 13.50), 0.05)],  # korona
]


def _uszy_i_poroze(b, strefy):
    """Uszy Z BRYŁĄ (szerokie, w bok) i poroże — rury przypięte do łba."""
    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        h, t, _p = KOSCI["ear.L"]
        h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
        sciezka = [(h.lerp(t, s), szer, gr, {"ear" + sfx: 1.0})
                   for s, szer, gr in ((0.0, 0.22, 0.10), (0.45, 0.30, 0.08), (0.85, 0.18, 0.06))]
        nr = Q._rura(b, sciezka, 8)
        for ring in nr:
            strefy.extend([R["UCHO"]] * len(ring))
        Q._czapka(b, nr[-1], t, zamknij=True)
        strefy.append(R["UCHO"])
        for galaz in [TYKA] + ODNOGI:
            sciezka = [(Vector((p[0] * strona, p[1], p[2])), r, r, {"head": 1.0}) for p, r in galaz]
            nr = Q._rura(b, sciezka, 6)
            for k, ring in enumerate(nr):
                kol = R["POROZE_KONIEC"] if k == len(nr) - 1 else R["POROZE"]
                strefy.extend([kol] * len(ring))
            koniec = sciezka[-1][0] + (sciezka[-1][0] - sciezka[-2][0]).normalized() * 0.08
            Q._czapka(b, nr[-1], koniec, zamknij=True)
            strefy.append(R["POROZE_KONIEC"])


# ════════════════════════════════════════════════════════════════════════════
# CHODY — z pomiaru: stępa ~1 s, galop z fazą lotu (zryw i podejście w walce).
# Prędkość klipu (`MODELE_3D.deer`) = krok / (podparcie × cykl).
# ════════════════════════════════════════════════════════════════════════════
CHODY = {
    "Walk":  dict(n=24, duty=0.62, krok=(2.6, 2.6), lift=0.45, fazy={"LP": 0.0, "PT": 0.25, "PP": 0.5, "LT": 0.75},
                  bob=0.06, kiwanie=3.0),
    "Trot":  dict(n=14, duty=0.45, krok=(3.0, 3.0), lift=0.65, fazy={"LP": 0.0, "PT": 0.0, "PP": 0.5, "LT": 0.5},
                  bob=0.10, kiwanie=3.0),
    "Run":   dict(n=10, duty=0.32, krok=(3.6, 3.4), lift=0.90, fazy={"LT": 0.0, "PT": 0.10, "LP": 0.45, "PP": 0.55},
                  bob=0.35, kiwanie=6.0, galop=True),
}
ZGIECIE_PRZOD = 70.0
ZGIECIE_TYL = 40.0
WAHANIE_LOPATKI = 9.0
SRODRECZE_ZA_NOGA = 0.45


# ════════════════════════════════════════════════════════════════════════════
# KLIPY GATUNKU
# ════════════════════════════════════════════════════════════════════════════
def klip_czujnosc(arm):
    """Postój / czujność: łeb wysoko, uszy rozstawione, ciało nieruchome."""
    a = Q._nowa_akcja(arm, "Alert")
    n = 24
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.04, pochyl_klatka=3.0, kark=10.0, leb=-6.0, uszy=12.0,
                 ogon=8.0 * math.sin(2 * math.pi * t))
        Q._obroc(arm, "head", "Y", 5.0 * math.sin(2 * math.pi * t))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_pochylenie(arm):
    """Zapowiedź ciosu: łeb w dół, poroże przed siebie, prawa przednia bije
    w ziemię. Pętla — trwa tyle, ile zapowiedź (`DEER.ram.windupMs`)."""
    a = Q._nowa_akcja(arm, "Lower")
    n = 14
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.15, pelvis_y=0.25, pochyl_zad=-2.0, pochyl_klatka=-6.0,
                 kark=-34.0, leb=-26.0, uszy=-22.0, ogon=10.0)
        s = math.sin(math.pi * min(1.0, t / 0.45)) if t < 0.45 else 0.0
        Q._stoj(arm, {"PP": (Vector((0, -0.30 * s, 0.55 * s)), 0.8 * s)})
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_cios(arm):
    """Cios porożem: wypad całym ciałem z łbem nisko, PODRZUT poroża, powrót."""
    a = Q._nowa_akcja(arm, "Ram")
    n = 12
    for f in range(n + 1):
        t = f / n
        p = Q._ease(t / 0.30) * (1 - Q._ease((t - 0.45) / 0.55))      # wypad
        g = Q._ease((t - 0.20) / 0.20) * (1 - Q._ease((t - 0.50) / 0.50))  # podrzut
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.15 * (1 - t), pelvis_y=0.25 * (1 - p) - 0.80 * p, pochyl_klatka=-6.0 + 8.0 * g,
                 kark=-34.0 * (1 - g) + 6.0 * g, leb=-26.0 * (1 - g) + 10.0 * g, uszy=-22.0)
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


G = Q.Gatunek(
    NAZWA="Deer", TAG="jelen", ENV_PODGLAD="JELEN_PODGLAD",
    CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "deer.glb"),
    PROFIL=PROFIL, SUPERELIPSA=SUPERELIPSA, GRZYWA_Y=GRZYWA_Y, GRZYWA_WYS=GRZYWA_WYS, GRZYWA_KAT=GRZYWA_KAT,
    NOGA_PRZOD=NOGA_PRZOD, NOGA_TYL=NOGA_TYL, KOSCI=KOSCI, N_TUL=18, N_NOGA=10, N_OGON=6,
    KOLOR_FUTRA=R["FUTRO"], KOLOR_GRZYWY=R["GRZYWA"], KOLOR_PYSKA=R["PYSK"], PYSK_DO_Y=-5.30,
    KOLOR_CZUBKA=R["NOS"], KOLOR_NOGI=R["NOGA"], KOLOR_STOPY=R["RACICA"],
    KOLOR_UCHA=R["UCHO"], KOLOR_OKA=R["OKO"], KOLOR_OGONA=R["OGON"],
    KOLOR_BRZUCHA=R["BRZUCH"], BRZUCH_KAT=0.8,
    UCHO_BLASZKA=False, UCHO_LICO=(0.4, -1.0, 0.1), UCHO_POL_SZER=0.0,
    OKO=(0.62, -4.70, 9.60), OKO_NORMALNA=(-0.40, 0.15), OKO_PROMIEN=(0.12, 0.09),
    ogon_sciezka=_ogon, OGON_KONIEC=(0, 0.04, -0.10),
    dodatki=_uszy_i_poroze,
    CHODY=CHODY, WARIANTY_CHODU={},
    ZGIECIE_PRZOD=ZGIECIE_PRZOD, ZGIECIE_TYL=ZGIECIE_TYL, WAHANIE_LOPATKI=WAHANIE_LOPATKI,
    SRODRECZE_ZA_NOGA=SRODRECZE_ZA_NOGA,
    KLIPY_GATUNKU=(klip_czujnosc, klip_pochylenie, klip_cios),
    KLIPY_PODGLADU=("Idle", "Walk", "Run", "Alert", "Lower", "Ram", "Hit", "Death"),
    KADR_PODGLADU=20.0, SRODEK_PODGLADU=6.8,
)

if __name__ == "__main__":
    Q.glowny(G)

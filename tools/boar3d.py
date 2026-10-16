"""Dzik 3D — gatunek dla RDZENIA czworonogów (`tools/quad3d.py`).

    blender -b --python tools/boar3d.py                 # przymiar: render podglądu + raport
    blender -b --python tools/boar3d.py -- --zapisz     # + public/assets/animals/boar.glb

Proporcje (przekrój tułowia, osadzenie łba, uszu, oczu, ogona i nóg) i fazy
ruchu wzięto z POMIARU modelu referencyjnego dzika (2026-10-03) i zaokrąglono
do własnych tabel niżej; kły, grzywa i strefy są projektem tej gry.
Jednostki postaci: dzik ma 0,85 m w kłębie (5,9 j.).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import quad3d as Q  # noqa: E402
from mathutils import Vector  # noqa: E402

# ════════════════════════════════════════════════════════════════════════════
# PROPORCJE — j. postaci. Profil tułowia+łba: (y, z_góra, z_dół, pół_szerokości)
# od czubka ryja (−Y) do zadu (+Y). Zaokrąglony pomiar referencji.
# ════════════════════════════════════════════════════════════════════════════
PROFIL = [
    (-4.40, 3.50, 3.15, 0.27),   # tarcza ryja
    (-4.05, 3.88, 2.95, 0.48),
    (-3.70, 4.10, 2.90, 0.55),
    (-3.35, 4.65, 2.82, 0.63),
    (-3.00, 5.08, 2.75, 0.74),   # czoło, oczy
    (-2.65, 5.50, 2.68, 0.85),
    (-2.30, 5.63, 2.66, 0.96),   # policzki, żuchwa
    (-1.95, 5.75, 2.52, 1.06),   # kark
    (-1.60, 5.80, 2.32, 1.08),
    (-1.25, 5.86, 2.12, 1.06),
    (-0.90, 5.90, 1.98, 1.20),   # kłąb, pierś
    (-0.55, 5.90, 1.92, 1.26),
    (-0.20, 5.88, 1.90, 1.30),
    (0.15, 5.84, 1.89, 1.33),
    (0.50, 5.78, 1.86, 1.35),
    (0.85, 5.72, 1.80, 1.33),
    (1.20, 5.55, 1.86, 1.28),
    (1.55, 5.45, 1.97, 1.15),
    (1.90, 5.37, 2.08, 1.08),
    (2.25, 5.27, 2.32, 1.15),    # szynka
    (2.60, 5.05, 2.48, 1.18),
    (2.95, 4.98, 2.52, 1.14),
    (3.30, 4.80, 2.55, 1.02),
    (3.60, 4.58, 2.75, 0.78),
    (3.92, 4.25, 3.06, 0.62),    # koniec zadu
]
#: Kształt przekroju: wykładnik superelipsy (2 = elipsa, więcej = bardziej
#: kanciasty bok — dzik ma płaskie boki i ciężki grzbiet).
SUPERELIPSA = 2.5
#: Grzywa: szczecina wzdłuż grzbietu, podniesienie górnego pasa (j.).
GRZYWA_Y = (-2.40, 2.10)
GRZYWA_WYS = 0.22
GRZYWA_KAT = 0.55        # rad od szczytu przekroju

# Nogi: punkty (x, y, z) przebiegu i promień pierścienia — L strona (+x).
# ⚠ Górne pierścienie MUSZĄ leżeć w tułowiu (x + r < pół_szerokości w tym y):
# pierwsza wersja (biodro r 0,85 przy x 0,72) wystawała z boku szynki płaską
# „klapą" widoczną z każdego skosu.
NOGA_PRZOD = [  # łopatka w tułowiu → łokieć → nadgarstek → pęcina → racica
    ((0.62, -0.60, 3.30), 0.48),
    ((0.74, -0.05, 2.45), 0.40),   # łokieć ZA linią nogi — patrz `KOSCI`
    ((0.72, -0.35, 1.95), 0.31),
    ((0.69, -0.44, 1.52), 0.25),
    ((0.62, -0.50, 0.55), 0.20),
    ((0.62, -0.62, 0.30), 0.22),
    ((0.62, -0.78, 0.03), 0.24),
]
NOGA_TYL = [    # biodro w tułowiu → kolano → staw skokowy → pęcina → racica
    ((0.58, 2.80, 3.40), 0.58),
    ((0.74, 2.40, 2.60), 0.50),
    ((0.74, 2.95, 2.05), 0.34),
    ((0.67, 3.35, 1.58), 0.25),
    ((0.65, 3.20, 0.53), 0.20),
    ((0.66, 3.05, 0.30), 0.22),
    ((0.66, 2.88, 0.03), 0.24),
]

# ── szkielet (spoczynek; L strona, prawa = lustro x) ─────────────────────────
KOSCI = {  # nazwa: (głowa, ogon, rodzic)
    "root":        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
    "pelvis":      ((0.0, 3.20, 4.20), (0.0, 1.60, 4.50), "root"),
    "spine":       ((0.0, 1.60, 4.50), (0.0, 0.00, 4.60), "pelvis"),
    "chest":       ((0.0, 0.00, 4.60), (0.0, -1.10, 4.40), "spine"),
    "neck":        ((0.0, -1.10, 4.40), (0.0, -1.90, 4.20), "chest"),
    "head":        ((0.0, -1.90, 4.20), (0.0, -2.75, 3.95), "neck"),
    "snout":       ((0.0, -2.75, 3.95), (0.0, -4.40, 3.33), "head"),
    "tail_1":      ((0.0, 3.80, 4.20), (0.0, 4.00, 3.50), "pelvis"),
    "tail_2":      ((0.0, 4.00, 3.50), (0.0, 4.12, 2.75), "tail_1"),
    "ear.L":       ((0.55, -1.95, 5.05), (1.30, -1.75, 5.95), "head"),
    "scap_f.L":    ((0.70, -0.55, 4.60), (0.70, -0.60, 3.40), "chest"),
    # ⚠ Łokieć cofnięty (y −0,25 → −0,05): przy prostej nodze bark→pęcina miał
    # 2,85 j. wobec 2,93 j. sumy kości — zapas 0,08 j., czyli noga-słup, która
    # nie sięga ani w przód, ani w tył. Dziś zapas ~0,23 j.
    "upper_f.L":   ((0.70, -0.60, 3.40), (0.76, -0.05, 2.45), "scap_f.L"),
    "fore_f.L":    ((0.76, -0.05, 2.45), (0.69, -0.44, 1.52), "upper_f.L"),
    "cannon_f.L":  ((0.69, -0.44, 1.52), (0.62, -0.50, 0.55), "fore_f.L"),
    "hoof_f.L":    ((0.62, -0.50, 0.55), (0.62, -0.80, 0.03), "cannon_f.L"),
    "thigh_h.L":   ((0.72, 2.90, 4.10), (0.85, 2.40, 2.65), "pelvis"),
    "shank_h.L":   ((0.85, 2.40, 2.65), (0.67, 3.35, 1.58), "thigh_h.L"),
    "cannon_h.L":  ((0.67, 3.35, 1.58), (0.65, 3.20, 0.53), "shank_h.L"),
    "hoof_h.L":    ((0.65, 3.20, 0.53), (0.66, 2.88, 0.03), "cannon_h.L"),
}

# ── kolory stref (sRGB; rampa `boar.png`) ────────────────────────────────────
FUTRO = (138, 104, 72)
GRZYWA = (74, 50, 38)
NOGA = (98, 70, 50)
RACICA = (46, 30, 28)
RYJ = (112, 74, 62)
RYJ_CZUBEK = (66, 40, 38)
UCHO = (110, 80, 56)
OKO = (18, 16, 20)
KIEL = (236, 222, 170)



def _kly(b, strefy):
    """Kły: zakrzywione stożki z boku ryja, w górę i na zewnątrz — tożsamość dzika."""
    for strona in (1.0, -1.0):
        sciezka = []
        for k, t in enumerate((0.0, 0.5, 1.0)):
            p = Vector((strona * (0.42 + 0.20 * t), -3.62 - 0.12 * t, 3.05 + 0.42 * t - 0.12 * t * t))
            r = 0.11 * (1.0 - 0.85 * t) + 0.015
            sciezka.append((p, r, r, {"snout": 1.0}))
        nr = Q._rura(b, sciezka, 6)
        for ring in nr:
            strefy.extend([KIEL] * len(ring))
        Q._czapka(b, nr[-1], sciezka[-1][0] + (sciezka[-1][0] - sciezka[-2][0]).normalized() * 0.10, zamknij=True)
        strefy.append(KIEL)


def _ogon():
    """Cienka rura z kitką."""
    return [(Vector(KOSCI["tail_1"][0]) + Vector((0, 0.05, 0)), 0.10, {"tail_1": 1.0}),
            (Vector(KOSCI["tail_1"][1]), 0.07, {"tail_1": 0.5, "tail_2": 0.5}),
            (Vector(KOSCI["tail_2"][1]), 0.12, {"tail_2": 1.0})]


# ════════════════════════════════════════════════════════════════════════════
# CHODY — fazy nóg z pomiaru referencji: stępa czterotaktowa (LP → PT → PP →
# LT), kłus po przekątnej, galop LP → PP → LT → PT.
# ════════════════════════════════════════════════════════════════════════════
CHODY = {
    #        klatki, udział podparcia, krok przód/tył, uniesienie, fazy nóg
    # ⚠ Krok ograniczony ZASIĘGIEM nogi: w spoczynku noga jest prawie prosta
    # (bark z 3,40 → pęcina 0,55 przy 2,9 j. długości), więc krok z pomiaru
    # referencji (3,0 / 3,3 / 4,8) dawał pęcinę 0,4–0,7 j. od celu. Łopatka
    # waha się za krokiem (`WAHANIE_LOPATKI`), a krok jest krótszy.
    "Walk":  dict(n=24, duty=0.64, krok=(2.3, 2.3), lift=0.35, fazy={"LP": 0.0, "PT": 0.25, "PP": 0.5, "LT": 0.75},
                  bob=0.06, kiwanie=2.0),
    "Trot":  dict(n=16, duty=0.45, krok=(2.6, 2.6), lift=0.55, fazy={"LP": 0.0, "PT": 0.0, "PP": 0.5, "LT": 0.5},
                  bob=0.10, kiwanie=3.0),
    "Run":   dict(n=12, duty=0.38, krok=(2.9, 2.8), lift=0.75, fazy={"LP": 0.0, "PP": 0.17, "LT": 0.45, "PT": 0.60},
                  bob=0.22, kiwanie=7.0, galop=True),
}
#: Szarża = galop z łbem nisko i ciałem bliżej ziemi (telegrafowana, „zobowiązanie").
SZARZA = dict(CHODY["Run"], lift=0.65, leb=-24.0, nisko=-0.18)
ZGIECIE_PRZOD = 60.0    # ° — zgięcie nadgarstka w wymachu (racica pod brzuch)
ZGIECIE_TYL = 30.0
WAHANIE_LOPATKI = 10.0  # ° na jednostkę wysunięcia pęciny (przód −, tył +)
#: W podporze śródręcze pochyla się w stronę barku/biodra o ten ułamek —
#: proste śródręcze przy wysuniętej racicy nie sięga celu.
SRODRECZE_ZA_NOGA = 0.45




# ════════════════════════════════════════════════════════════════════════════
# KLIPY GATUNKU
# ════════════════════════════════════════════════════════════════════════════
def klip_telegraf(arm):
    """Łeb w dół, ciężar na zad, prawa przednia GRZEBIE dwa razy w pętli."""
    a = Q._nowa_akcja(arm, "Telegraph")
    n = 24
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.12, pelvis_y=0.20, pochyl_zad=-3.0, kark=-24.0, leb=-18.0,
               ogon=14.0 * math.sin(4 * math.pi * t), uszy=-18.0)
        s = (2 * t) % 1.0
        if s < 0.35:                              # unieś i wysuń do przodu
            u = s / 0.35
            d, zg = Vector((0, -0.55 * Q._ease(u), 0.32 * math.sin(math.pi * u))), math.sin(math.pi * u)
        else:                                     # zgarnij po ziemi do tyłu
            u = (s - 0.35) / 0.65
            d, zg = Vector((0, -0.55 + 1.2 * Q._ease(u), 0.0)), 0.0
        Q._stoj(arm, {"PP": (d, zg)})
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_kiel(arm):
    """Cios kłem: przysiad z łbem nisko → wypad i PODRZUT łba → powrót."""
    a = Q._nowa_akcja(arm, "Gore")
    n = 18
    for f in range(n + 1):
        t = f / n
        w = Q._ease(t / 0.33) * (1 - Q._ease((t - 0.33) / 0.2))          # zamach (łeb w dół)
        p = Q._ease((t - 0.30) / 0.2) * (1 - Q._ease((t - 0.62) / 0.38))  # pchnięcie (łeb w górę)
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.18 * w, pelvis_y=0.25 * w - 0.75 * p, pochyl_klatka=-4.0 * w + 6.0 * p,
               kark=-18.0 * w + 22.0 * p, leb=-14.0 * w + 26.0 * p, uszy=-20.0 * (w + p))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a



G = Q.Gatunek(
    NAZWA="Boar", TAG="dzik", ENV_PODGLAD="DZIK_PODGLAD",
    CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "boar.glb"),
    PROFIL=PROFIL, SUPERELIPSA=SUPERELIPSA, GRZYWA_Y=GRZYWA_Y, GRZYWA_WYS=GRZYWA_WYS, GRZYWA_KAT=GRZYWA_KAT,
    NOGA_PRZOD=NOGA_PRZOD, NOGA_TYL=NOGA_TYL, KOSCI=KOSCI, N_TUL=18, N_NOGA=10, N_OGON=6,
    KOLOR_FUTRA=FUTRO, KOLOR_GRZYWY=GRZYWA, KOLOR_PYSKA=RYJ, PYSK_DO_Y=-3.55, KOLOR_CZUBKA=RYJ_CZUBEK,
    KOLOR_NOGI=NOGA, KOLOR_STOPY=RACICA, KOLOR_UCHA=UCHO, KOLOR_OKA=OKO, KOLOR_OGONA=GRZYWA,
    # ⚠ Ucho czytelne w skali gry: ~0,9 j. wysokości, ~0,6 j. u nasady
    # (pierwsza wersja 0,48 j. — w kadrze kolec, nie ucho). Blaszka LICEM DO
    # PRZODU — bokiem wzdłuż Y była widziana krawędzią („rogi").
    UCHO_LICO=(0.6, -1.0, 0.15), UCHO_POL_SZER=0.34,
    OKO=(0.86, -2.80, 4.38), OKO_NORMALNA=(-0.25, 0.1), OKO_PROMIEN=(0.13, 0.10),
    ogon_sciezka=_ogon, OGON_KONIEC=(0, 0.02, -0.15),
    dodatki=_kly,
    CHODY=CHODY, WARIANTY_CHODU={"Charge": SZARZA},
    ZGIECIE_PRZOD=ZGIECIE_PRZOD, ZGIECIE_TYL=ZGIECIE_TYL, WAHANIE_LOPATKI=WAHANIE_LOPATKI,
    SRODRECZE_ZA_NOGA=SRODRECZE_ZA_NOGA,
    KLIPY_GATUNKU=(klip_telegraf, klip_kiel),
    KLIPY_PODGLADU=("Idle", "Walk", "Trot", "Run", "Telegraph", "Charge", "Gore", "Hit", "Stunned", "Death"),
    KADR_PODGLADU=11.5, SRODEK_PODGLADU=2.6,
)


def przygotuj():
    return Q.przygotuj(G)


if __name__ == "__main__":
    Q.glowny(G)

"""Wilk i Szary 3D — gatunek dla RDZENIA czworonogów (`tools/quad3d.py`).

    blender -b --python tools/wolf3d.py                 # przymiar obu: render + raport
    blender -b --python tools/wolf3d.py -- --zapisz     # + animals/wolf.glb, animals/greywolf.glb

Proporcje (profil tułowia z wysokim kłębem i grzbietem opadającym ku zadowi,
łeb noszony niżej niż kłąb, długi pysk, długie łapy, łokieć za linią nogi,
staw skokowy wysoko z tyłu) i fazy ruchu (stępa ~1 s, bieg skokami z fazą
lotu, kęs jako wypad całym ciałem, skok z wszystkimi łapami w powietrzu,
przewrót na bok) z POMIARU modelu referencyjnego wilka (2026-10-03);
kłus, wycie i warczenie zaprojektowane tu. Kolory z `wolf.png` / `greywolf.png`.
Jednostki postaci: wilk ma 0,80 m w kłębie (5,45 j.).

Szary to TEN SAM model w bledszej rampie (`greywolf.png`: „wyblakły stary
wojownik"); „przerośnięty" robi skala w grze (`MODELE_3D.greywolf.skala`).
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
# ⚠ Dwie poprawki pomiaru (render, 2026-10-03): referencja STAŁA pochylona
# z łbem nisko (chód z nosem przy ziemi), więc zad opadał o 20% od kłębu —
# wilk czytał się jak hiena — a łeb wisiał pod linią grzbietu. Zad podniesiony
# stopniowo od lędźwi (do +0,45 j.), łeb o +0,35 j. razem z kośćmi.
PROFIL = [
    (-5.80, 3.47, 3.13, 0.20),   # nos
    (-5.45, 3.57, 2.90, 0.40),
    (-5.10, 3.67, 2.65, 0.48),   # długi pysk
    (-4.75, 3.90, 2.60, 0.55),
    (-4.40, 4.40, 2.60, 0.74),   # stop, czoło
    (-4.05, 4.75, 2.65, 0.86),   # czaszka
    (-3.70, 4.80, 2.75, 0.84),
    (-3.35, 5.05, 2.65, 0.88),   # kark, kryza
    (-3.00, 5.20, 2.35, 0.96),
    (-2.60, 5.40, 2.15, 1.02),
    (-2.20, 5.45, 2.00, 1.04),   # kłąb
    (-1.80, 5.45, 2.05, 1.04),   # najgłębsza pierś
    (-1.40, 5.35, 2.15, 1.00),
    (-1.00, 5.20, 2.35, 0.94),
    (-0.60, 5.12, 2.67, 0.86),   # podkasany brzuch
    (-0.20, 5.04, 2.99, 0.78),
    (0.20, 4.91, 3.21, 0.76),    # lędźwie
    (0.60, 4.78, 3.28, 0.80),
    (1.00, 4.70, 3.20, 0.82),    # zad
    (1.35, 4.60, 3.15, 0.76),
    (1.65, 4.39, 3.24, 0.62),
    (1.90, 4.10, 3.45, 0.42),
]
SUPERELIPSA = 2.2
GRZYWA_Y = (-3.60, -1.40)        # szczecina na karku i kłębie
GRZYWA_WYS = 0.20
GRZYWA_KAT = 0.60

# ⚠ Górne pierścienie nóg MUSZĄ leżeć w tułowiu (x + r < pół szerokości) —
# lekcja dzika: inaczej z boku wystaje „klapa".
NOGA_PRZOD = [  # łopatka → łokieć (ZA linią nogi) → nadgarstek → śródręcze → łapa
    ((0.58, -1.75, 3.10), 0.42),
    ((0.76, -1.30, 1.85), 0.32),
    ((0.82, -1.62, 1.20), 0.23),
    ((0.85, -1.92, 0.55), 0.18),
    ((0.86, -2.02, 0.28), 0.19),
    # ⚠ Łapa idzie POZIOMO (palce w przód), więc pierścień stoi pionowo i jego
    # promień sięga W DÓŁ: środek musi być ≥ r nad gruntem (pierwsza wersja:
    # z 0,03 przy r 0,23 → łapa 0,17 j. pod ziemią już w spoczynku).
    ((0.86, -2.18, 0.22), 0.21),
    ((0.86, -2.42, 0.19), 0.18),
]
NOGA_TYL = [    # biodro → kolano → staw skokowy (wysoko, z tyłu) → śródstopie → łapa
    ((0.45, 0.95, 3.62), 0.40),
    ((0.72, 0.70, 2.00), 0.40),
    ((0.82, 1.30, 1.72), 0.27),
    ((0.85, 1.80, 1.50), 0.21),
    ((0.86, 1.47, 0.30), 0.18),
    ((0.86, 1.33, 0.22), 0.21),
    ((0.86, 1.10, 0.19), 0.18),
]

KOSCI = {  # nazwa: (głowa, ogon, rodzic) — L strona, prawa = lustro x
    "root":        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
    "pelvis":      ((0.0, 1.30, 4.15), (0.0, 0.10, 4.10), "root"),
    "spine":       ((0.0, 0.10, 4.10), (0.0, -1.30, 4.15), "pelvis"),
    "chest":       ((0.0, -1.30, 4.15), (0.0, -2.70, 4.20), "spine"),
    "neck":        ((0.0, -2.70, 4.20), (0.0, -3.70, 4.05), "chest"),
    "head":        ((0.0, -3.70, 4.05), (0.0, -4.50, 3.75), "neck"),
    "snout":       ((0.0, -4.50, 3.75), (0.0, -5.80, 3.30), "head"),
    "tail_1":      ((0.0, 1.70, 4.32), (0.0, 2.70, 3.92), "pelvis"),
    "tail_2":      ((0.0, 2.70, 3.92), (0.0, 3.50, 3.22), "tail_1"),
    "tail_3":      ((0.0, 3.50, 3.22), (0.0, 3.90, 2.47), "tail_2"),
    "ear.L":       ((0.38, -3.95, 4.65), (0.50, -3.75, 5.50), "head"),
    "scap_f.L":    ((0.58, -1.60, 4.50), (0.62, -1.75, 3.10), "chest"),
    "upper_f.L":   ((0.62, -1.75, 3.10), (0.78, -1.30, 1.85), "scap_f.L"),
    "fore_f.L":    ((0.78, -1.30, 1.85), (0.85, -1.92, 0.55), "upper_f.L"),
    "cannon_f.L":  ((0.85, -1.92, 0.55), (0.86, -2.02, 0.28), "fore_f.L"),
    "hoof_f.L":    ((0.86, -2.02, 0.28), (0.86, -2.42, 0.19), "cannon_f.L"),
    "thigh_h.L":   ((0.55, 0.95, 3.72), (0.72, 0.70, 2.00), "pelvis"),
    "shank_h.L":   ((0.72, 0.70, 2.00), (0.85, 1.80, 1.50), "thigh_h.L"),
    "cannon_h.L":  ((0.85, 1.80, 1.50), (0.86, 1.47, 0.30), "shank_h.L"),
    "hoof_h.L":    ((0.86, 1.47, 0.30), (0.86, 1.10, 0.19), "cannon_h.L"),
}


def _ogon():
    """Puszysta kita w trzech kościach — gruba w połowie, cienka na końcu."""
    k = KOSCI
    return [(Vector(k["tail_1"][0]) + Vector((0, 0.05, 0)), 0.26, {"tail_1": 1.0}),
            (Vector(k["tail_1"][1]), 0.40, {"tail_1": 0.5, "tail_2": 0.5}),
            (Vector(k["tail_2"][1]), 0.40, {"tail_2": 0.5, "tail_3": 0.5}),
            (Vector(k["tail_3"][1]), 0.16, {"tail_3": 1.0})]


# ── kolory stref (sRGB): wilk z `wolf.png`, Szary z `greywolf.png` ───────────
RAMPA_WILK = dict(FUTRO=(156, 166, 176), GRZYWA=(100, 103, 117), BRZUCH=(185, 199, 206),
                  PYSK=(170, 182, 190), NOS=(52, 52, 62), NOGA=(127, 134, 146), LAPA=(100, 103, 117),
                  UCHO=(100, 103, 117), OKO=(230, 168, 92), OGON=(127, 134, 146))
RAMPA_SZARY = dict(FUTRO=(188, 194, 201), GRZYWA=(131, 132, 141), BRZUCH=(207, 217, 222),
                   PYSK=(198, 206, 212), NOS=(43, 42, 54), NOGA=(168, 173, 181), LAPA=(131, 132, 141),
                   UCHO=(131, 132, 141), OKO=(204, 116, 72), OGON=(168, 173, 181))

# ════════════════════════════════════════════════════════════════════════════
# CHODY — z pomiaru referencji: stępa czterotaktowa ~1 s, bieg SKOKAMI
# (tylna para, potem przednia, z fazą lotu); kłus po przekątnej — wilk kłusuje
# przy okrążaniu gracza.
# ════════════════════════════════════════════════════════════════════════════
CHODY = {
    "Walk":  dict(n=24, duty=0.60, krok=(2.0, 2.0), lift=0.35, fazy={"LP": 0.0, "PT": 0.25, "PP": 0.5, "LT": 0.75},
                  bob=0.05, kiwanie=2.0),
    "Trot":  dict(n=14, duty=0.45, krok=(2.4, 2.4), lift=0.50, fazy={"LP": 0.0, "PT": 0.0, "PP": 0.5, "LT": 0.5},
                  bob=0.08, kiwanie=2.0),
    "Run":   dict(n=12, duty=0.30, krok=(2.8, 2.6), lift=0.70, fazy={"LT": 0.0, "PT": 0.10, "LP": 0.45, "PP": 0.55},
                  bob=0.35, kiwanie=6.0, galop=True),
}
ZGIECIE_PRZOD = 70.0     # wilk podwija łapy pod siebie mocniej niż dzik
ZGIECIE_TYL = 35.0
WAHANIE_LOPATKI = 10.0
SRODRECZE_ZA_NOGA = 0.45


# ════════════════════════════════════════════════════════════════════════════
# KLIPY GATUNKU
# ════════════════════════════════════════════════════════════════════════════
def klip_wycie(arm):
    """Wycie (alarm watahy): pysk w niebo, pierś do przodu, drżenie łba."""
    a = Q._nowa_akcja(arm, "Howl")
    n = 36
    for f in range(n + 1):
        t = f / n
        u = Q._ease(t / 0.2) * (1 - Q._ease((t - 0.8) / 0.2))
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.10 * u, pochyl_klatka=6.0 * u, kark=36.0 * u,
                 leb=22.0 * u + 3.0 * math.sin(2 * math.pi * 3 * t) * u, uszy=-10.0 * u)
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_warkot(arm):
    """Warczenie / zamach Szarego: przyczajenie, łeb nisko i do przodu, uszy po sobie."""
    a = Q._nowa_akcja(arm, "Growl")
    n = 16
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.25, pelvis_y=0.03 * math.sin(8 * math.pi * t), pochyl_klatka=-6.0,
                 kark=-14.0, leb=8.0, uszy=-28.0, ogon=6.0 * math.sin(2 * math.pi * t))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_wypad(arm):
    """Wypad (skok na cel): przysiad → lot z łapami w przód i w tył → lądowanie."""
    a = Q._nowa_akcja(arm, "Lunge")
    n = 14
    for f in range(n + 1):
        t = f / n
        c = Q._ease(t / 0.15) * (1 - Q._ease((t - 0.15) / 0.1))       # odbicie
        u = max(0.0, min(1.0, (t - 0.15) / 0.7))
        s = math.sin(math.pi * u) if 0.15 < t < 0.85 else 0.0          # lot
        l = Q._ease((t - 0.82) / 0.08) * (1 - Q._ease((t - 0.9) / 0.1))  # lądowanie
        h = 1.0 * s
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.3 * c + h - 0.2 * l, pochyl_klatka=10.0 * math.cos(math.pi * u) * s,
                 kark=6.0 * s, leb=4.0 * s, uszy=-30.0 * max(s, c), ogon=0.0)
        przod = (Vector((0, -1.1 * s, h + 0.5 * s)), 0.6 * s)
        tyl = (Vector((0, 0.8 * s, h + 0.25 * s)), 0.3 * s)
        Q._stoj(arm, {"LP": przod, "PP": przod, "LT": tyl, "PT": tyl})
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_kes(arm):
    """Kęs: krótki wypad całym ciałem z łapami na ziemi, łeb kłapie i wraca."""
    a = Q._nowa_akcja(arm, "Bite")
    n = 10
    for f in range(n + 1):
        t = f / n
        w = Q._ease(t / 0.3) * (1 - Q._ease((t - 0.3) / 0.15))
        p = Q._ease((t - 0.25) / 0.15) * (1 - Q._ease((t - 0.55) / 0.45))
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.10 * w, pelvis_y=0.15 * w - 0.55 * p, pochyl_klatka=-4.0 * p,
                 kark=-6.0 * w + 8.0 * p, leb=-8.0 * w - 6.0 * p, uszy=-25.0 * (w + p))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def _gatunek(nazwa, tag, plik, rampa):
    return Q.Gatunek(
        NAZWA=nazwa, TAG=tag, ENV_PODGLAD=tag.upper() + "_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", plik),
        PROFIL=PROFIL, SUPERELIPSA=SUPERELIPSA, GRZYWA_Y=GRZYWA_Y, GRZYWA_WYS=GRZYWA_WYS, GRZYWA_KAT=GRZYWA_KAT,
        NOGA_PRZOD=NOGA_PRZOD, NOGA_TYL=NOGA_TYL, KOSCI=KOSCI, N_TUL=18, N_NOGA=10, N_OGON=8,
        KOLOR_FUTRA=rampa["FUTRO"], KOLOR_GRZYWY=rampa["GRZYWA"], KOLOR_PYSKA=rampa["PYSK"], PYSK_DO_Y=-4.6,
        KOLOR_CZUBKA=rampa["NOS"], KOLOR_NOGI=rampa["NOGA"], KOLOR_STOPY=rampa["LAPA"],
        KOLOR_UCHA=rampa["UCHO"], KOLOR_OKA=rampa["OKO"], KOLOR_OGONA=rampa["OGON"],
        KOLOR_BRZUCHA=rampa["BRZUCH"], BRZUCH_KAT=0.9,
        # Uszy stojące, spiczaste, licem do przodu (lekcja dzika: bokiem = „rogi").
        UCHO_LICO=(0.4, -1.0, 0.10), UCHO_POL_SZER=0.26,
        OKO=(0.70, -4.45, 4.25), OKO_NORMALNA=(-0.35, 0.15), OKO_PROMIEN=(0.12, 0.09),
        ogon_sciezka=_ogon, OGON_KONIEC=(0, 0.10, -0.12),
        dodatki=None,
        CHODY=CHODY, WARIANTY_CHODU={},
        ZGIECIE_PRZOD=ZGIECIE_PRZOD, ZGIECIE_TYL=ZGIECIE_TYL, WAHANIE_LOPATKI=WAHANIE_LOPATKI,
        SRODRECZE_ZA_NOGA=SRODRECZE_ZA_NOGA,
        KLIPY_GATUNKU=(klip_wycie, klip_warkot, klip_wypad, klip_kes),
        KLIPY_PODGLADU=("Idle", "Walk", "Trot", "Run", "Howl", "Growl", "Lunge", "Bite", "Hit", "Death"),
        KADR_PODGLADU=13.5, SRODEK_PODGLADU=2.8,
    )


# ⚠ Światło gry (`Shared3D.dodajSwiatlo`) rozjaśnia bryłę mocniej niż podgląd
# z Blendera — w grze Szary z pełną rampą `greywolf.png` wychodził prawie BIAŁY
# („biały wilk", nie „wyblakły stary wojownik"). Obie rampy ×0,90 (render z gry).
JASNOSC_W_GRZE = 0.90


def _przyciemnij(rampa):
    return {k: (v if k == "OKO" else tuple(round(c * JASNOSC_W_GRZE) for c in v)) for k, v in rampa.items()}


WILK = _gatunek("Wolf", "wilk", "wolf.glb", _przyciemnij(RAMPA_WILK))
SZARY = _gatunek("GreyWolf", "szary", "greywolf.glb", _przyciemnij(RAMPA_SZARY))

if __name__ == "__main__":
    Q.glowny(WILK)
    Q.glowny(SZARY)

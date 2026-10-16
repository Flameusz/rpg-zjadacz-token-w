"""Lis 3D — gatunek dla RDZENIA czworonogów (`tools/quad3d.py`).

    blender -b --python tools/fox3d.py                 # przymiar: render podglądu + raport
    blender -b --python tools/fox3d.py -- --zapisz     # + public/assets/animals/fox.glb

Proporcje (smukły tułów z kłębem ledwie nad zadem, łeb noszony wysoko
i lekko przed kłębem, wąski długi pysk, duże stojące uszy, cienkie nogi
z łokciem za linią nogi, palcochód, gruba kita opadająca ku ziemi) z POMIARU
modelu referencyjnego lisa (2026-10-04); referencja stała w pozie czujności
z łbem w górze, więc skalę wzięto z KŁĘBU (0,40 m = 2,77 j.), nie z najwyższego
punktu. Chody, czujność, warkot zwrotu i kęs zaprojektowane tu, pod stany
`src/entities/Fox.ts`. Kolory: klasyczny rudy lis — NIE ciemna rdza `fox_*.png`,
która z kamery gry zlewała się z dzikiem i niedźwiedziem.

Model w skali naturalnej; w grze powiększa go `MODELE_3D.fox.skala` (jak
królik — zwierzę ~0,4 m w kłębie ma inaczej kilkanaście pikseli wysokości).
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
PROFIL = [
    (-3.25, 2.60, 2.42, 0.13),   # nos
    (-3.05, 2.72, 2.36, 0.24),   # wąski pysk
    (-2.85, 2.90, 2.34, 0.33),
    (-2.65, 3.15, 2.38, 0.45),   # stop
    (-2.45, 3.30, 2.40, 0.54),   # czaszka, oczy
    (-2.25, 3.32, 2.30, 0.58),   # policzki (kryza)
    (-2.05, 3.20, 2.08, 0.52),
    (-1.85, 3.05, 1.80, 0.46),   # kark
    (-1.65, 2.98, 1.62, 0.52),
    (-1.45, 2.88, 1.52, 0.55),   # pierś
    (-1.20, 2.80, 1.48, 0.56),   # kłąb
    (-0.90, 2.74, 1.46, 0.57),
    (-0.60, 2.69, 1.46, 0.55),
    (-0.30, 2.64, 1.48, 0.52),
    (0.00, 2.60, 1.52, 0.48),    # talia
    (0.30, 2.57, 1.50, 0.49),
    (0.60, 2.55, 1.46, 0.52),
    (0.90, 2.50, 1.48, 0.50),    # zad
    (1.15, 2.42, 1.58, 0.42),
    (1.40, 2.30, 1.80, 0.28),
]
SUPERELIPSA = 2.2
GRZYWA_Y = (0.0, 0.0)            # bez grzywy
GRZYWA_WYS = 0.0
GRZYWA_KAT = 0.0

# ⚠ Górne pierścienie nóg W tułowiu (x + r < pół szerokości) — lekcja dzika.
NOGA_PRZOD = [  # bark → łokieć (ZA linią nogi) → przedramię → nadgarstek → łapa
    ((0.30, -1.48, 1.95), 0.24),
    ((0.40, -0.98, 1.40), 0.18),
    ((0.37, -1.05, 1.00), 0.15),
    ((0.33, -1.12, 0.60), 0.13),
    # Łapa POZIOMO: środek pierścienia ≥ r nad gruntem (lekcja wilka).
    ((0.31, -1.20, 0.22), 0.13),
    ((0.31, -1.30, 0.16), 0.14),
    ((0.31, -1.40, 0.13), 0.12),
]
NOGA_TYL = [    # biodro → kolano (z przodu) → goleń → staw skokowy (wysoko) → łapa
    ((0.24, 0.95, 2.12), 0.26),
    ((0.36, 0.62, 1.32), 0.20),
    ((0.39, 0.95, 1.05), 0.16),
    ((0.40, 1.28, 0.82), 0.13),
    ((0.38, 1.20, 0.24), 0.12),
    ((0.38, 1.10, 0.17), 0.14),
    ((0.38, 1.00, 0.13), 0.12),
]

KOSCI = {  # nazwa: (głowa, ogon, rodzic) — L strona, prawa = lustro x
    "root":        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
    "pelvis":      ((0.0, 1.10, 2.12), (0.0, 0.20, 2.20), "root"),
    "spine":       ((0.0, 0.20, 2.20), (0.0, -0.75, 2.25), "pelvis"),
    "chest":       ((0.0, -0.75, 2.25), (0.0, -1.40, 2.30), "spine"),
    "neck":        ((0.0, -1.40, 2.30), (0.0, -2.10, 2.75), "chest"),
    "head":        ((0.0, -2.10, 2.75), (0.0, -2.75, 2.80), "neck"),
    "snout":       ((0.0, -2.75, 2.80), (0.0, -3.25, 2.52), "head"),
    "tail_1":      ((0.0, 1.25, 2.30), (0.0, 2.15, 2.10), "pelvis"),
    "tail_2":      ((0.0, 2.15, 2.10), (0.0, 3.00, 1.82), "tail_1"),
    "tail_3":      ((0.0, 3.00, 1.82), (0.0, 3.75, 1.50), "tail_2"),
    "ear.L":       ((0.24, -2.30, 3.15), (0.36, -2.36, 3.92), "head"),
    "scap_f.L":    ((0.30, -1.00, 2.55), (0.34, -1.50, 1.92), "chest"),
    # Łokieć cofnięty: przy (−1,10) zapas zasięgu nogi wynosił 0,10 j. (noga-słup).
    "upper_f.L":   ((0.34, -1.50, 1.92), (0.40, -0.98, 1.40), "scap_f.L"),
    "fore_f.L":    ((0.40, -0.98, 1.40), (0.33, -1.12, 0.60), "upper_f.L"),
    "cannon_f.L":  ((0.33, -1.12, 0.60), (0.31, -1.20, 0.22), "fore_f.L"),
    "hoof_f.L":    ((0.31, -1.20, 0.22), (0.31, -1.40, 0.12), "cannon_f.L"),
    "thigh_h.L":   ((0.26, 0.95, 2.15), (0.38, 0.60, 1.30), "pelvis"),
    "shank_h.L":   ((0.38, 0.60, 1.30), (0.40, 1.30, 0.80), "thigh_h.L"),
    "cannon_h.L":  ((0.40, 1.30, 0.80), (0.38, 1.18, 0.22), "shank_h.L"),
    "hoof_h.L":    ((0.38, 1.18, 0.22), (0.38, 1.00, 0.12), "cannon_h.L"),
}


def _ogon():
    """KITA: gruba w połowie, z białą końcówką (`OGON_KONCOWKA`) — tożsamość lisa."""
    k = KOSCI
    t1, t2, t3 = (Vector(k[n][0]) for n in ("tail_1", "tail_2", "tail_3"))
    kon = Vector(k["tail_3"][1])
    return [(t1 + Vector((0, 0.05, 0)), 0.15, {"tail_1": 1.0}),
            (t1.lerp(t2, 0.5), 0.30, {"tail_1": 1.0}),
            (t2, 0.40, {"tail_1": 0.5, "tail_2": 0.5}),
            (t2.lerp(t3, 0.5), 0.42, {"tail_2": 1.0}),
            (t3, 0.38, {"tail_2": 0.5, "tail_3": 0.5}),
            (t3.lerp(kon, 0.5), 0.30, {"tail_3": 1.0}),
            (kon, 0.12, {"tail_3": 1.0})]


def _uszy(b, strefy):
    """Uszy Z BRYŁĄ: trójkątny stożek szeroki u nasady. Blaszka licem do
    przodu (wilk) z boku była u lisa kolcem (render 2026-10-04)."""
    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        h, t, _p = KOSCI["ear.L"]
        h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
        sciezka = []
        for s, szer, gr in ((0.0, 0.20, 0.12), (0.35, 0.17, 0.09), (0.70, 0.10, 0.06), (0.95, 0.03, 0.02)):
            sciezka.append((h.lerp(t, s), szer, gr, {"ear" + sfx: 1.0}))
        nr = Q._rura(b, sciezka, 8)
        for ring in nr:
            strefy.extend([R["UCHO"]] * len(ring))
        Q._czapka(b, nr[-1], t, zamknij=True)
        strefy.append(R["UCHO"])


# ── kolory stref (sRGB) ×0,90 jak wilki: światło gry rozjaśnia bryłę ─────────
JASNOSC_W_GRZE = 0.90
_RAMPA = dict(FUTRO=(198, 96, 40), BIEL=(232, 226, 214), NOS=(30, 22, 20), NOGA=(52, 34, 28),
              LAPA=(34, 24, 22), UCHO=(58, 36, 28), OKO=(24, 18, 14), OGON=(186, 88, 38))
R = {k: (v if k in ("OKO", "NOS") else tuple(round(c * JASNOSC_W_GRZE) for c in v)) for k, v in _RAMPA.items()}

# ════════════════════════════════════════════════════════════════════════════
# CHODY — stępa czterotaktowa (pomiar: ~1 s), kłus po przekątnej, galop
# z fazą lotu (ucieczka i podejście w walce).
# Prędkość klipu (`MODELE_3D.fox`) = krok / (podparcie × cykl).
# ════════════════════════════════════════════════════════════════════════════
CHODY = {
    "Walk":  dict(n=16, duty=0.60, krok=(1.3, 1.3), lift=0.18, fazy={"LP": 0.0, "PT": 0.25, "PP": 0.5, "LT": 0.75},
                  bob=0.03, kiwanie=2.0),
    "Trot":  dict(n=10, duty=0.45, krok=(1.5, 1.5), lift=0.25, fazy={"LP": 0.0, "PT": 0.0, "PP": 0.5, "LT": 0.5},
                  bob=0.05, kiwanie=2.0),
    "Run":   dict(n=8, duty=0.30, krok=(1.5, 1.4), lift=0.35, fazy={"LT": 0.0, "PT": 0.10, "LP": 0.45, "PP": 0.55},
                  bob=0.18, kiwanie=5.0, galop=True),
}
ZGIECIE_PRZOD = 70.0
ZGIECIE_TYL = 35.0
WAHANIE_LOPATKI = 10.0
SRODRECZE_ZA_NOGA = 0.45


# ════════════════════════════════════════════════════════════════════════════
# KLIPY GATUNKU
# ════════════════════════════════════════════════════════════════════════════
def klip_czujnosc(arm):
    """Postój w ucieczce / alarm: łeb wysoko, uszy w przód, ciężar na zadzie
    (gotów do zrywu), kita nisko; łeb przechyla się, nasłuchując."""
    a = Q._nowa_akcja(arm, "Alert")
    n = 24
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.05, pelvis_y=0.05, pochyl_klatka=4.0, kark=14.0, leb=-4.0,
                 uszy=8.0, ogon=4.0 * math.sin(2 * math.pi * t))
        Q._obroc(arm, "head", "Y", 6.0 * math.sin(2 * math.pi * t))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_warkot(arm):
    """Zwrot (telegraf przed walką): przyczajenie, łeb nisko i w przód, uszy
    po sobie, kita sztywno w dół; drgania ciała — zaraz skoczy."""
    a = Q._nowa_akcja(arm, "Snarl")
    n = 16
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        # ⚠ Głęboko: przy −0,16 / −8° z kamery gry nie odróżniał się od bezruchu.
        Q._tulow(arm, pelvis_z=-0.32, pelvis_y=0.10 + 0.02 * math.sin(8 * math.pi * t), pochyl_zad=-3.0,
                 pochyl_klatka=-12.0, kark=-26.0, leb=14.0, uszy=-40.0, ogon=-6.0 + 3.0 * math.sin(4 * math.pi * t))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_kes(arm):
    """Kęs: krótki wypad całym ciałem, łeb kłapie i wraca (wzór wilka)."""
    a = Q._nowa_akcja(arm, "Bite")
    n = 9
    for f in range(n + 1):
        t = f / n
        w = Q._ease(t / 0.3) * (1 - Q._ease((t - 0.3) / 0.15))
        p = Q._ease((t - 0.25) / 0.15) * (1 - Q._ease((t - 0.55) / 0.45))
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.06 * w, pelvis_y=0.08 * w - 0.30 * p, pochyl_klatka=-4.0 * p,
                 kark=-8.0 * w + 8.0 * p, leb=-8.0 * w - 6.0 * p, uszy=-30.0 * (w + p))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


G = Q.Gatunek(
    NAZWA="Fox", TAG="lis", ENV_PODGLAD="LIS_PODGLAD",
    CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "fox.glb"),
    PROFIL=PROFIL, SUPERELIPSA=SUPERELIPSA, GRZYWA_Y=GRZYWA_Y, GRZYWA_WYS=GRZYWA_WYS, GRZYWA_KAT=GRZYWA_KAT,
    NOGA_PRZOD=NOGA_PRZOD, NOGA_TYL=NOGA_TYL, KOSCI=KOSCI, N_TUL=16, N_NOGA=8, N_OGON=10,
    KOLOR_FUTRA=R["FUTRO"], KOLOR_GRZYWY=R["FUTRO"], KOLOR_PYSKA=R["FUTRO"], PYSK_DO_Y=-3.0,
    KOLOR_CZUBKA=R["NOS"], KOLOR_NOGI=R["NOGA"], KOLOR_STOPY=R["LAPA"],
    KOLOR_UCHA=R["UCHO"], KOLOR_OKA=R["OKO"], KOLOR_OGONA=R["OGON"],
    # Biały spód: podgardle, pierś, brzuch — i dolna szczęka (ten sam pas).
    KOLOR_BRZUCHA=R["BIEL"], BRZUCH_KAT=1.0,
    OGON_KONCOWKA=(R["BIEL"], 2),
    # Uszy duże, stojące, LICEM DO PRZODU (lekcja dzika: bokiem = „rogi").
    UCHO_BLASZKA=False, UCHO_LICO=(0.3, -1.0, 0.10), UCHO_POL_SZER=0.0,
    OKO=(0.40, -2.62, 2.95), OKO_NORMALNA=(-0.60, 0.15), OKO_PROMIEN=(0.08, 0.06),
    ogon_sciezka=_ogon, OGON_KONIEC=(0, 0.08, -0.04),
    dodatki=_uszy,
    CHODY=CHODY, WARIANTY_CHODU={},
    ZGIECIE_PRZOD=ZGIECIE_PRZOD, ZGIECIE_TYL=ZGIECIE_TYL, WAHANIE_LOPATKI=WAHANIE_LOPATKI,
    SRODRECZE_ZA_NOGA=SRODRECZE_ZA_NOGA,
    KLIPY_GATUNKU=(klip_czujnosc, klip_warkot, klip_kes),
    KLIPY_PODGLADU=("Idle", "Walk", "Run", "Alert", "Snarl", "Bite", "Hit", "Death"),
    KADR_PODGLADU=8.0, SRODEK_PODGLADU=1.6,
)

if __name__ == "__main__":
    Q.glowny(G)

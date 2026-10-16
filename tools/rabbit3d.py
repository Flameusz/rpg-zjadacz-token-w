"""Królik 3D — gatunek dla RDZENIA czworonogów (`tools/quad3d.py`).

    blender -b --python tools/rabbit3d.py                 # przymiar: render + raport
    blender -b --python tools/rabbit3d.py -- --zapisz     # + public/assets/animals/rabbit.glb

Proporcje (przyczajona sylwetka z garbem ku zadowi, łeb nisko, tylne łapy
złożone w „Z" ze stopą płasko na ziemi, krótkie przednie z łokciem pod
tułowiem) i rytm ruchu (wolny chód = SKOKI: obie przednie lądują razem, potem
obie tylne, tułów unosi się w locie) z POMIARU modelu referencyjnego
(2026-10-03). Czujność, przyczajenie i ugryzienie zaprojektowane tu.
Kolory z `rabbit.png`.

⚠⚠ **Królik jest w SKALI GRY, nie natury.** Prawdziwy ma ~20 cm w kłębie —
przy gęstości gracza 7 px, nieczytelny. Sprite 2D ma ~34×32 px, czyli królik
tej gry jest ~×1,8 prawdziwego, i model trzyma TĘ wielkość (pomiar przy
0,36 m w kłębie). Dzik i wilk mają realną skalę i też trafiają w swoje
sprite'y — królik jest jedynym świadomym wyjątkiem.
⚠ Uszy wydłużone względem pomiaru (sięgają ~2,8 j. zamiast 2,4) — to one
mówią „królik" w 30 pikselach.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import quad3d as Q  # noqa: E402
from mathutils import Vector  # noqa: E402

PROFIL = [  # (y, z_góra, z_dół, pół_szerokości), nos (−Y) → zad
    (-2.75, 1.15, 0.50, 0.20),   # nos
    (-2.55, 1.50, 0.40, 0.40),
    (-2.35, 1.72, 0.38, 0.44),   # policzki
    (-2.12, 1.75, 0.42, 0.47),
    (-1.90, 1.72, 0.58, 0.46),   # kark
    (-1.65, 1.75, 0.62, 0.47),
    (-1.40, 1.85, 0.60, 0.52),   # barki
    (-1.15, 1.98, 0.52, 0.56),
    (-0.85, 2.12, 0.42, 0.58),
    (-0.55, 2.22, 0.38, 0.60),
    (-0.25, 2.36, 0.40, 0.72),
    (0.05, 2.47, 0.55, 0.82),
    (0.35, 2.52, 0.68, 0.87),    # garb
    (0.65, 2.52, 0.80, 0.90),
    (0.95, 2.47, 0.82, 0.91),
    (1.25, 2.38, 0.65, 0.90),    # szynki
    (1.55, 2.25, 0.48, 0.87),
    (1.85, 2.08, 0.40, 0.80),
    (2.10, 1.85, 0.45, 0.70),
    (2.35, 1.55, 0.55, 0.50),
    (2.55, 1.20, 0.70, 0.30),    # koniec zadu
]
SUPERELIPSA = 2.0                # okrągły, puchaty — bez kantów
GRZYWA_Y = (-1.40, 2.20)         # ciemniejszy grzbiet (bez podniesienia)
GRZYWA_WYS = 0.0
GRZYWA_KAT = 0.55

# ⚠ Łapa i stopa idą POZIOMO — środek pierścienia ≥ promień nad gruntem
# (lekcja wilka). Górne pierścienie w tułowiu (lekcja dzika).
NOGA_PRZOD = [  # bark → łokieć (pod tułowiem, z tyłu) → przedramię → nadgarstek → łapka
    ((0.42, -0.57, 1.04), 0.16),
    ((0.62, 0.30, 1.02), 0.19),
    ((0.56, -0.07, 0.68), 0.15),
    ((0.45, -0.50, 0.30), 0.12),
    ((0.40, -0.72, 0.22), 0.13),
    ((0.37, -0.90, 0.17), 0.13),
    ((0.34, -1.04, 0.13), 0.10),
]
NOGA_TYL = [    # biodro → kolano (z przodu) → goleń → staw skokowy → STOPA płasko → palce
    ((0.40, 1.95, 1.20), 0.38),
    ((0.72, 0.85, 0.75), 0.34),
    ((0.62, 1.35, 0.55), 0.25),
    ((0.52, 1.80, 0.33), 0.16),
    ((0.62, 0.86, 0.25), 0.16),
    ((0.64, 0.74, 0.22), 0.14),
    ((0.66, 0.62, 0.20), 0.10),
]

KOSCI = {
    "root":        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
    "pelvis":      ((0.0, 2.30, 1.40), (0.0, 1.10, 1.95), "root"),
    "spine":       ((0.0, 1.10, 1.95), (0.0, -0.20, 1.75), "pelvis"),
    "chest":       ((0.0, -0.20, 1.75), (0.0, -1.30, 1.35), "spine"),
    "neck":        ((0.0, -1.30, 1.35), (0.0, -1.85, 1.30), "chest"),
    "head":        ((0.0, -1.85, 1.30), (0.0, -2.35, 1.15), "neck"),
    "snout":       ((0.0, -2.35, 1.15), (0.0, -2.75, 0.85), "head"),
    "tail_1":      ((0.0, 2.45, 1.05), (0.0, 2.70, 1.15), "pelvis"),
    "tail_2":      ((0.0, 2.70, 1.15), (0.0, 2.85, 1.20), "tail_1"),
    "ear.L":       ((0.15, -2.10, 1.55), (0.32, -1.80, 2.80), "head"),
    "scap_f.L":    ((0.22, -0.75, 1.70), (0.42, -0.57, 1.04), "chest"),
    "upper_f.L":   ((0.42, -0.57, 1.04), (0.62, 0.30, 1.02), "scap_f.L"),
    "fore_f.L":    ((0.62, 0.30, 1.02), (0.45, -0.50, 0.30), "upper_f.L"),
    "cannon_f.L":  ((0.45, -0.50, 0.30), (0.37, -0.90, 0.17), "fore_f.L"),
    "hoof_f.L":    ((0.37, -0.90, 0.17), (0.34, -1.04, 0.13), "cannon_f.L"),
    "thigh_h.L":   ((0.40, 1.95, 1.25), (0.72, 0.85, 0.75), "pelvis"),
    "shank_h.L":   ((0.72, 0.85, 0.75), (0.52, 1.80, 0.33), "thigh_h.L"),
    "cannon_h.L":  ((0.52, 1.80, 0.33), (0.62, 0.86, 0.25), "shank_h.L"),
    "hoof_h.L":    ((0.62, 0.86, 0.25), (0.66, 0.62, 0.20), "cannon_h.L"),
}


def _ogon():
    """Biała puszysta kulka."""
    k = KOSCI
    return [(Vector(k["tail_1"][0]), 0.16, {"tail_1": 1.0}),
            (Vector(k["tail_1"][1]), 0.27, {"tail_1": 0.5, "tail_2": 0.5}),
            (Vector(k["tail_2"][1]), 0.12, {"tail_2": 1.0})]


def _uszy(b, strefy):
    """⭐ Uszy Z BRYŁĄ (nie blaszka): spłaszczony stożek — SZEROKI w profilu
    (lico patrzy w bok), cienki od przodu. Blaszka licem do przodu (dzik,
    wilk) z boku była kreską i królik czytał się jak szczur (render)."""
    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        h, t, _p = KOSCI["ear.L"]
        h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
        sciezka = []
        for s, szer, gr in ((0.0, 0.10, 0.06), (0.25, 0.22, 0.07), (0.65, 0.24, 0.06), (0.92, 0.14, 0.04)):
            sciezka.append((h.lerp(t, s), szer, gr, {"ear" + sfx: 1.0}))
        nr = Q._rura(b, sciezka, 8)
        for ring in nr:
            strefy.extend([R["UCHO"]] * len(ring))
        Q._czapka(b, nr[-1], t, zamknij=True)
        strefy.append(R["UCHO"])


JASNOSC_W_GRZE = 0.90            # jak u wilków — światło gry rozjaśnia
_RAMPA = dict(FUTRO=(167, 165, 174), GRZBIET=(130, 128, 140), BRZUCH=(230, 228, 224),
              # NOS stonowany: z przodu pełny róż czytał się jak plama krwi.
              NOS=(132, 112, 116), LAPA=(150, 148, 158), UCHO=(140, 138, 150), OKO=(30, 28, 38),
              OGON=(236, 234, 230))
R = {k: (v if k == "OKO" else tuple(round(c * JASNOSC_W_GRZE) for c in v)) for k, v in _RAMPA.items()}

ZGIECIE_PRZOD = 40.0
ZGIECIE_TYL = 25.0
WAHANIE_LOPATKI = 8.0
#: ⚠ ZERO: stopa królika leży PŁASKO — śródstopie nie może pochylać się ku
#: biodru w podporze (u dzika i wilka to ratowało zasięg nogi).
SRODRECZE_ZA_NOGA = 0.0


def _skok_lapy(t):
    """Pęciny w skoku (przesunięcie od spoczynku, zgięcie) — w miejscu: ciało
    przesuwa gra, więc łapy w podporze JADĄ DO TYŁU względem tułowia."""
    h = 0.9 * math.sin(math.pi * max(0.0, min(1.0, (t - 0.10) / 0.75)))   # tułów w locie
    # przednie: stoją do 0,2 → wymach w przód i w górę → lądują w 0,6 i jadą w tył
    if t < 0.2:
        pd, pz = 0.0, 0.0
    elif t < 0.6:
        u = (t - 0.2) / 0.4
        pd, pz = -1.0 * Q._ease(u), h * 0.8 + 0.35 * math.sin(math.pi * u)
    else:
        u = (t - 0.6) / 0.4
        pd, pz = -1.0 + 1.0 * u, 0.0
    # tylne: odpychają się do 0,35 (jadą w tył) → wymach → lądują w 0,8
    if t < 0.35:
        u = t / 0.35
        td, tz = 0.8 * u, 0.0
    elif t < 0.8:
        u = (t - 0.35) / 0.45
        td, tz = 0.8 - 1.0 * Q._ease(u), h * 0.8 + 0.40 * math.sin(math.pi * u)
    else:
        u = (t - 0.8) / 0.2
        td, tz = -0.2 + 0.2 * u, 0.0
    zp = 1.0 if 0.2 <= t < 0.6 else 0.0
    zt = 1.0 if 0.35 <= t < 0.8 else 0.0
    return h, (Vector((0, pd, pz)), 0.6 * zp), (Vector((0, td, tz)), 0.5 * zt)


def klip_skok(arm):
    """JEDEN skok (667 ms przy tempie 1 = cykl patrolu `Rabbit.WALK_CYCLE_MS`):
    przysiad → wybicie tylnymi → lot z wyciągniętym ciałem → przednie lądują →
    tylne podciągają się pod brzuch → przysiad."""
    a = Q._nowa_akcja(arm, "Hop")
    n = 16
    for f in range(n + 1):
        t = f / n
        h, przod, tyl = _skok_lapy(t)
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=h, pochyl_klatka=12.0 * math.sin(math.pi * min(1.0, t / 0.45)) if t < 0.45
                 else -10.0 * math.sin(math.pi * min(1.0, (t - 0.45) / 0.4)) if t < 0.85 else 0.0,
                 kark=4.0 * h, uszy=-30.0 * h, ogon=0.0)
        Q._stoj(arm, {"LP": przod, "PP": przod, "LT": tyl, "PT": tyl})
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_czujnosc(arm):
    """Czujność (stoi i patrzy — WTEDY da się go trafić): przód uniesiony,
    łeb wysoko, uszy sztywno w górę, nos drga."""
    a = Q._nowa_akcja(arm, "Alert")
    n = 24
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=0.15, pochyl_klatka=18.0, kark=8.0, leb=4.0 + 2.0 * math.sin(2 * math.pi * 4 * t),
                 uszy=8.0)
        Q._stoj(arm, {"LP": (Vector((0, 0.25, 0.35)), 0.3), "PP": (Vector((0, 0.25, 0.35)), 0.3)})
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_przyczajenie(arm):
    """Przyczajenie po splochu: płasko przy ziemi, uszy po sobie."""
    a = Q._nowa_akcja(arm, "Freeze")
    n = 24
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.20 + 0.02 * math.sin(2 * math.pi * t), pochyl_klatka=-4.0, kark=-6.0,
                 uszy=-70.0)
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_ugryzienie(arm):
    """Ugryzienie rozjuszonego: wypad przodem z łbem nisko, kłapnięcie, powrót."""
    a = Q._nowa_akcja(arm, "Bite")
    n = 10
    for f in range(n + 1):
        t = f / n
        w = Q._ease(t / 0.3) * (1 - Q._ease((t - 0.3) / 0.15))
        p = Q._ease((t - 0.25) / 0.15) * (1 - Q._ease((t - 0.55) / 0.45))
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.08 * w + 0.15 * p, pelvis_y=0.10 * w - 0.35 * p, pochyl_klatka=-6.0 * p,
                 kark=-6.0 * w - 4.0 * p, leb=-10.0 * p, uszy=-35.0 * (w + p))
        Q._stoj(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


G = Q.Gatunek(
    NAZWA="Rabbit", TAG="krolik", ENV_PODGLAD="KROLIK_PODGLAD",
    CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "rabbit.glb"),
    PROFIL=PROFIL, SUPERELIPSA=SUPERELIPSA, GRZYWA_Y=GRZYWA_Y, GRZYWA_WYS=GRZYWA_WYS, GRZYWA_KAT=GRZYWA_KAT,
    NOGA_PRZOD=NOGA_PRZOD, NOGA_TYL=NOGA_TYL, KOSCI=KOSCI, N_TUL=18, N_NOGA=8, N_OGON=8,
    KOLOR_FUTRA=R["FUTRO"], KOLOR_GRZYWY=R["GRZBIET"], KOLOR_PYSKA=R["FUTRO"], PYSK_DO_Y=-9.0,
    KOLOR_CZUBKA=R["NOS"], KOLOR_NOGI=R["LAPA"], KOLOR_STOPY=R["BRZUCH"], KOLOR_UCHA=R["UCHO"],
    KOLOR_OKA=R["OKO"], KOLOR_OGONA=R["OGON"], KOLOR_BRZUCHA=R["BRZUCH"], BRZUCH_KAT=1.0,
    UCHO_BLASZKA=False, UCHO_LICO=(0.3, -1.0, 0.0), UCHO_POL_SZER=0.20,
    OKO=(0.44, -2.38, 1.18), OKO_NORMALNA=(-0.20, 0.10), OKO_PROMIEN=(0.13, 0.12),
    ogon_sciezka=_ogon, OGON_KONIEC=(0, 0.06, 0.0),
    dodatki=_uszy,
    CHODY={}, WARIANTY_CHODU={},
    ZGIECIE_PRZOD=ZGIECIE_PRZOD, ZGIECIE_TYL=ZGIECIE_TYL, WAHANIE_LOPATKI=WAHANIE_LOPATKI,
    SRODRECZE_ZA_NOGA=SRODRECZE_ZA_NOGA,
    KLIPY_GATUNKU=(klip_skok, klip_czujnosc, klip_przyczajenie, klip_ugryzienie),
    KLIPY_PODGLADU=("Idle", "Hop", "Alert", "Freeze", "Bite", "Hit", "Stunned", "Death"),
    KADR_PODGLADU=7.0, SRODEK_PODGLADU=1.4,
)


if __name__ == "__main__":
    Q.glowny(G)

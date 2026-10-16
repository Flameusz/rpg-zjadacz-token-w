"""Niedźwiedź 3D — gatunek dla RDZENIA czworonogów (`tools/quad3d.py`).

    blender -b --python tools/bear3d.py                 # przymiar: render podglądu + raport
    blender -b --python tools/bear3d.py -- --zapisz     # + public/assets/animals/bear.glb

Proporcje (garb nad łopatkami jako najwyższy punkt, grzbiet opadający ku
lędźwiom, wielki łeb noszony na wysokości grzbietu, krótki pysk, grube nogi
z łokciem daleko za linią nogi, STOPA tylna płasko na ziemi) i fazy ruchu
(stępa czterotaktowa, kłus po przekątnej, galop) z POMIARU modelu
referencyjnego niedźwiedzia (2026-10-04), zaokrąglone do tabel niżej.
Zapowiedź (wspięcie z łapą w górze) i zamach są projektem tej gry, pod fazy
`AKCJE.bearSwipe`. Kolory z `bear_idle.png`.
Jednostki postaci: 1,15 m w garbie (7,9 j.).

⚠ Tułów DŁUŻSZY niż w referencji o 15% za łopatką: referencja (1,59 m od
nosa do zadu przy 1,15 m w kłębie) była krępa jak maskotka; niedźwiedź
brunatny ma ~2× tyle długości co wysokości, a z kamery gry długość jest
tym, co odróżnia go od dzika.
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
# ⚠ Łeb NIŻEJ niż garb o ~0,9 j., kark węższy od policzków, pysk dłuższy:
# pierwsza wersja (łeb na wysokości grzbietu, kark grubości łba) czytała się
# jak KAPIBARA — jedna bryła od nosa do zadu (render, 2026-10-04).
PROFIL = [
    (-6.00, 5.20, 4.70, 0.28),   # nos
    (-5.70, 5.55, 4.55, 0.45),
    (-5.35, 5.80, 4.50, 0.55),   # pysk
    (-5.00, 6.05, 4.45, 0.62),
    (-4.65, 6.55, 4.40, 0.82),   # stop
    (-4.30, 7.00, 4.25, 1.10),   # czoło, oczy
    (-3.95, 7.18, 4.12, 1.34),   # szerokie policzki
    (-3.60, 7.15, 4.10, 1.38),   # uszy
    (-3.25, 6.90, 4.15, 1.24),   # tył czaszki
    (-2.85, 6.62, 4.00, 1.08),   # kark — WĘŻSZY i niższy niż łeb (zagłębienie)
    (-2.45, 6.95, 3.55, 1.22),
    (-2.00, 7.55, 3.05, 1.45),   # pierś
    (-1.50, 7.88, 2.70, 1.58),
    (-1.00, 7.95, 2.50, 1.62),   # szczyt garbu
    (-0.50, 7.82, 2.35, 1.64),
    (0.05, 7.55, 2.25, 1.70),
    (0.65, 7.35, 2.15, 1.76),    # brzuch — nisko, sierść
    (1.25, 7.25, 2.10, 1.78),
    (1.85, 7.25, 2.15, 1.76),    # lędźwie — najniższy grzbiet
    (2.45, 7.32, 2.30, 1.72),
    (3.05, 7.38, 2.50, 1.68),    # zad
    (3.65, 7.32, 2.70, 1.64),
    (4.25, 7.15, 2.95, 1.58),    # biodra
    (4.85, 6.85, 3.25, 1.38),
    (5.40, 6.45, 3.65, 1.10),
    (5.85, 5.90, 4.20, 0.72),    # koniec zadu
]
SUPERELIPSA = 2.3                # pełny, zaokrąglony przekrój
GRZYWA_Y = (-2.30, 0.30)         # dłuższa sierść garbu
GRZYWA_WYS = 0.20
GRZYWA_KAT = 0.75

# ⚠ Górne pierścienie nóg W tułowiu (x + r < pół szerokości) — lekcja dzika.
# ⚠ Nogi GRUBE (przedramię r 0,60, łapa 0,50): przy 0,50/0,40 z kamery gry
# były patykami pod beczką.
NOGA_PRZOD = [  # bark → łokieć (daleko ZA linią nogi) → przedramię → nadgarstek → łapa
    ((0.80, -0.90, 4.40), 0.80),
    ((0.92, -0.15, 2.30), 0.80),
    ((0.96, -0.55, 1.50), 0.74),
    ((0.98, -0.95, 0.85), 0.62),
    # ⚠ Łapa leży POZIOMO, więc pierścień stoi pionowo: środek ≥ r nad gruntem
    # (lekcja wilka — łapa pod ziemią już w spoczynku).
    ((0.98, -1.15, 0.58), 0.58),
    ((0.98, -1.50, 0.50), 0.50),
    ((0.98, -1.88, 0.36), 0.34),
]
#: Stopa tylna o 0,25 j. bliżej biodra niż w pomiarze — inaczej noga w przodzie
#: kroku nie sięgała pęciny (0,17–0,35 j. błędu IK).
NOGA_TYL = [    # biodro → kolano (z przodu) → goleń → pięta → STOPA PŁASKO → palce
    ((0.72, 4.38, 5.00), 0.88),
    ((0.95, 2.95, 2.85), 0.80),
    ((1.00, 3.30, 1.70), 0.70),
    ((1.00, 3.50, 0.66), 0.60),
    ((1.00, 3.20, 0.56), 0.54),
    ((1.00, 2.85, 0.48), 0.46),
    ((1.00, 2.50, 0.34), 0.32),
]

KOSCI = {  # nazwa: (głowa, ogon, rodzic) — L strona, prawa = lustro x
    "root":        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
    "pelvis":      ((0.0, 4.40, 5.40), (0.0, 1.60, 5.50), "root"),
    "spine":       ((0.0, 1.60, 5.50), (0.0, -0.90, 5.70), "pelvis"),
    "chest":       ((0.0, -0.90, 5.70), (0.0, -2.40, 5.80), "spine"),
    "neck":        ((0.0, -2.40, 5.70), (0.0, -3.30, 5.60), "chest"),
    "head":        ((0.0, -3.30, 5.60), (0.0, -4.65, 5.50), "neck"),
    "snout":       ((0.0, -4.65, 5.50), (0.0, -6.00, 4.95), "head"),
    "tail_1":      ((0.0, 5.70, 5.60), (0.0, 6.05, 5.30), "pelvis"),
    "tail_2":      ((0.0, 6.05, 5.30), (0.0, 6.20, 4.95), "tail_1"),
    "ear.L":       ((0.92, -3.58, 6.62), (1.12, -3.50, 7.22), "head"),
    "scap_f.L":    ((0.74, -0.70, 6.80), (0.80, -0.90, 4.40), "chest"),
    # Łokieć cofnięty o 0,75 j. za bark — zapas zasięgu nogi ~0,3 j. (dzik: 0,08
    # i noga-słup bez kroku).
    "upper_f.L":   ((0.80, -0.90, 4.40), (0.92, -0.15, 2.30), "scap_f.L"),
    "fore_f.L":    ((0.92, -0.15, 2.30), (0.98, -0.95, 0.85), "upper_f.L"),
    "cannon_f.L":  ((0.98, -0.95, 0.85), (0.98, -1.15, 0.50), "fore_f.L"),
    "hoof_f.L":    ((0.98, -1.15, 0.50), (0.98, -1.85, 0.34), "cannon_f.L"),
    "thigh_h.L":   ((0.72, 4.38, 5.00), (0.95, 2.95, 2.85), "pelvis"),
    "shank_h.L":   ((0.95, 2.95, 2.85), (1.00, 3.50, 0.65), "thigh_h.L"),
    # Stopa PŁASKO (stopochód): kość śródstopia biegnie od pięty po ziemi.
    "cannon_h.L":  ((1.00, 3.50, 0.65), (1.00, 3.05, 0.48), "shank_h.L"),
    "hoof_h.L":    ((1.00, 3.05, 0.48), (1.00, 2.50, 0.32), "cannon_h.L"),
}


def _ogon():
    """Krótki kikut ogona przy końcu zadu."""
    k = KOSCI
    return [(Vector(k["tail_1"][0]) + Vector((0, -0.10, 0)), 0.26, {"tail_1": 1.0}),
            (Vector(k["tail_1"][1]), 0.28, {"tail_1": 0.5, "tail_2": 0.5}),
            (Vector(k["tail_2"][1]), 0.16, {"tail_2": 1.0})]


# ── kolory stref (sRGB, rampa `bear_idle.png`, ×0,90 jak wilk: światło gry
# rozjaśnia bryłę mocniej niż podgląd z Blendera) ───────────────────────────
JASNOSC_W_GRZE = 0.90
_RAMPA = dict(FUTRO=(139, 79, 45), GRZYWA=(152, 98, 60), PYSK=(170, 128, 84), NOS=(40, 26, 22),
              NOGA=(102, 55, 30), LAPA=(72, 38, 24), UCHO=(102, 55, 30), OKO=(16, 12, 12), OGON=(116, 63, 33))
R = {k: (v if k in ("OKO", "NOS") else tuple(round(c * JASNOSC_W_GRZE) for c in v)) for k, v in _RAMPA.items()}


def _uszy(b, strefy):
    """Uszy Z BRYŁĄ: krótkie, zaokrąglone — blaszka czyta się jak róg kota."""
    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        h, t, _p = KOSCI["ear.L"]
        h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
        sciezka = []
        for s, szer, gr in ((0.0, 0.42, 0.20), (0.45, 0.46, 0.18), (0.85, 0.32, 0.14)):
            sciezka.append((h.lerp(t, s), szer, gr, {"ear" + sfx: 1.0}))
        nr = Q._rura(b, sciezka, 8)
        for ring in nr:
            strefy.extend([R["UCHO"]] * len(ring))
        Q._czapka(b, nr[-1], t, zamknij=True)
        strefy.append(R["UCHO"])


# ════════════════════════════════════════════════════════════════════════════
# CHODY — z pomiaru: stępa czterotaktowa bocznym rytmem, kłus po przekątnej,
# galop z fazą lotu. Krok ograniczony ZASIĘGIEM nogi (lekcja dzika).
# Prędkość klipu (`MODELE_3D.bear`) = krok / (podparcie × cykl).
# ════════════════════════════════════════════════════════════════════════════
CHODY = {
    "Walk":  dict(n=24, duty=0.62, krok=(2.9, 2.9), lift=0.45, fazy={"LP": 0.0, "LT": 0.25, "PP": 0.5, "PT": 0.75},
                  bob=0.06, kiwanie=2.5),
    "Trot":  dict(n=16, duty=0.45, krok=(3.2, 3.2), lift=0.60, fazy={"LP": 0.0, "PT": 0.0, "PP": 0.5, "LT": 0.5},
                  bob=0.10, kiwanie=3.0),
    "Run":   dict(n=14, duty=0.40, krok=(3.4, 3.3), lift=0.80, fazy={"LT": 0.0, "PT": 0.12, "LP": 0.45, "PP": 0.57},
                  bob=0.30, kiwanie=5.0, galop=True),
}
ZGIECIE_PRZOD = 55.0
ZGIECIE_TYL = 30.0
WAHANIE_LOPATKI = 9.0
#: ⚠ ZERO: obie łapy niedźwiedzia stoją PŁASKO (stopochód) — śródręcze
#: pochylone ku barkowi stawiałoby go na palcach jak wilka.
SRODRECZE_ZA_NOGA = 0.0


# ════════════════════════════════════════════════════════════════════════════
# KLIPY GATUNKU — pod `AKCJE.bearSwipe`: zapowiedź 620 ms, cios bez fazy
# `active` (rozstrzyga się w jednej klatce), bezbronność 800 ms.
# ════════════════════════════════════════════════════════════════════════════
#: Łapy przednie w WSPIĘCIU, względem barku: lewa zwisa, prawa uniesiona do ciosu.
LAPA_WISI = Vector((0.0, -1.3, -3.0))
LAPA_UNIESIONA = Vector((-0.55, 0.45, -0.55))
WSPIECIE = 32.0          # ° pochylenia tułowia wokół bioder


def _nogi(arm, przednie, w):
    """Tylne w spoczynku na ziemi; przednie = mieszanka celu na ziemi i celu
    względem barku (`w` = 1 → całkiem w powietrzu)."""
    for k in ("LT", "PT"):
        Q._noga(arm, k, Q._pecina_spoczynek(k), 0.0)
    for k, (ziemia, wzgl, zg) in przednie.items():
        sfx = ".L" if k == "LP" else ".R"
        A = arm.pose.bones["upper_f" + sfx].head.copy()
        p = (Q._pecina_spoczynek(k) + ziemia).lerp(A + wzgl, w)
        Q._noga(arm, k, p, zg)


def _lustro_x(v):
    return Vector((-v.x, v.y, v.z))


def klip_wspiecie(arm):
    """Zapowiedź: wspina się na tylne, prawa łapa w górę i do tyłu, łeb nisko
    na cel, uszy po sobie. Jednorazowy, trzyma ostatnią klatkę (~zapowiedź)."""
    a = Q._nowa_akcja(arm, "Rear")
    n = 15
    for f in range(n + 1):
        t = f / n
        u = Q._ease(t / 0.75)
        r = Q._ease((t - 0.15) / 0.75)
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.30 * u, pelvis_y=0.45 * u, pochyl_zad=WSPIECIE * u, pochyl_klatka=4.0 * u,
                 kark=-16.0 * u, leb=-8.0 * u, uszy=-25.0 * u, ogon=0.0)
        _nogi(arm, {"LP": (Vector(), LAPA_WISI, 0.3 * u),
                    "PP": (Vector(), _lustro_x(LAPA_WISI).lerp(LAPA_UNIESIONA, r), 0.3 + 0.6 * r)}, u)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


def klip_zamach(arm):
    """Cios: prawa łapa zgarnia w przód i w poprzek, ciało spada na przednie
    (pierwsze ~0,2 s), potem ciężka bezbronność z łbem nisko i powrót do
    pozy stojącej. 20 klatek ≈ 830 ms ≈ `recoveryMs`."""
    a = Q._nowa_akcja(arm, "Swipe")
    n = 20
    for f in range(n + 1):
        t = f / n
        s = Q._ease(t / 0.25)                                    # zgarnięcie łapą
        u = 1.0 - Q._ease(t / 0.30)                              # opadanie ze wspięcia
        uder = Q._ease((t - 0.18) / 0.10) * (1 - Q._ease((t - 0.35) / 0.65))   # ciężar na przód
        powrot = Q._ease((t - 0.40) / 0.60)
        Q._reset(arm); Q._upd()
        Q._tulow(arm, pelvis_z=-0.30 * u - 0.15 * uder, pelvis_y=0.45 * u - 0.35 * uder,
                 pochyl_zad=WSPIECIE * u - 4.0 * uder, pochyl_klatka=4.0 * u - 3.0 * uder,
                 skret=-9.0 * s * (1.0 - powrot), kark=-16.0 * u - 12.0 * uder, leb=-8.0 * u - 6.0 * uder,
                 uszy=-25.0 * (1.0 - powrot))
        prawa_wzgl = LAPA_UNIESIONA.lerp(Vector((0.6, -1.9, -2.9)), s)
        prawa_ziemia = Vector((0.45, -1.3, 0.0)) * (1.0 - powrot)
        lewa_ziemia = Vector((0.0, -0.4, 0.0)) * (1.0 - powrot)
        _nogi(arm, {"LP": (lewa_ziemia, LAPA_WISI, 0.3 * u),
                    "PP": (prawa_ziemia, prawa_wzgl, 0.9 * u)}, u)
        Q._klucz(arm, f)
    Q._liniowo(a)
    return a


G = Q.Gatunek(
    NAZWA="Bear", TAG="niedzwiedz", ENV_PODGLAD="NIEDZWIEDZ_PODGLAD",
    CEL=os.path.join(Q.ROOT, "public", "assets", "animals", "bear.glb"),
    PROFIL=PROFIL, SUPERELIPSA=SUPERELIPSA, GRZYWA_Y=GRZYWA_Y, GRZYWA_WYS=GRZYWA_WYS, GRZYWA_KAT=GRZYWA_KAT,
    NOGA_PRZOD=NOGA_PRZOD, NOGA_TYL=NOGA_TYL, KOSCI=KOSCI, N_TUL=20, N_NOGA=10, N_OGON=8,
    KOLOR_FUTRA=R["FUTRO"], KOLOR_GRZYWY=R["GRZYWA"], KOLOR_PYSKA=R["PYSK"], PYSK_DO_Y=-4.80,
    KOLOR_CZUBKA=R["NOS"], KOLOR_NOGI=R["NOGA"], KOLOR_STOPY=R["LAPA"],
    KOLOR_UCHA=R["UCHO"], KOLOR_OKA=R["OKO"], KOLOR_OGONA=R["OGON"],
    UCHO_BLASZKA=False, UCHO_LICO=(0.4, -1.0, 0.1), UCHO_POL_SZER=0.0,
    OKO=(0.94, -4.32, 6.28), OKO_NORMALNA=(-0.55, 0.20), OKO_PROMIEN=(0.11, 0.09),
    ogon_sciezka=_ogon, OGON_KONIEC=(0, 0.06, -0.10),
    dodatki=_uszy,
    CHODY=CHODY, WARIANTY_CHODU={},
    ZGIECIE_PRZOD=ZGIECIE_PRZOD, ZGIECIE_TYL=ZGIECIE_TYL, WAHANIE_LOPATKI=WAHANIE_LOPATKI,
    SRODRECZE_ZA_NOGA=SRODRECZE_ZA_NOGA,
    KLIPY_GATUNKU=(klip_wspiecie, klip_zamach),
    KLIPY_PODGLADU=("Idle", "Walk", "Run", "Rear", "Swipe", "Hit", "Stunned", "Death"),
    KADR_PODGLADU=17.0, SRODEK_PODGLADU=4.6,
)

if __name__ == "__main__":
    Q.glowny(G)

"""GENERATOR REKWIZYTÓW 3D — krzewy, kamienie, zioła (styl jak `tree3d.py`).

2026-10-05 (`OI-164`): po drzewach — „wypadałoby zrobić pozostałe obiekty na
mapie". Jeden plik `public/assets/props/props3d.glb`, jeden OBIEKT na kształt.
Nazwy = nazwa obiektu z Tiled bez numeru (`krzew_kopula_sredni`,
`kamien_drobny`) albo `ziolo_<gatunek>`; drugi i kolejny kształt dostaje
`_2`, `_3` — `Trees3D` wybiera po położeniu.

Uruchomienie (Blender bez okna):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P tools/props3d.py
    ... -- --zapisz      (zapis .glb; domyślnie tylko raport)

Klocki (kępy ze wspólną normalną korony, kule, rury, kolory wierzchołków,
eksport) są WSPÓLNE z drzewami — importowane z `tree3d.py`, żeby krzew i drzewo
nie dorobiły sobie dwóch stylów.

Referencja sylwetek i barw: `public/assets/props/forest_decor_atlas.png`
(krzewy, kamienie) i `herb_*.png` (zioła). Rozmiary z klatek atlasu przy
4,955 px/j. (skala gracza).

⭐ Zioła mają się rozpoznawać po KWIECIE (kolor + układ), nie po liściu: w kadrze
telefonu zioło to ~25 px, a gracz szuka go wzrokiem w trawie.
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector, noise

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from tree3d import (  # noqa: E402
    GATUNKI as GATUNKI_DRZEW, Siatka, _kula, _mix, _mul, _rura, do_blendera, korona_lisciasta, material, owoce,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ZAPISZ = "--zapisz" in argv
CEL = os.path.join(ROOT, "public", "assets", "props", "props3d.glb")
MAX_TROJKATOW = 1600


# ── wspólne ──────────────────────────────────────────────────────────────────

def kepka(s, c, r, kol_dol, kol_gora, rng, podzial=1, splaszcz=0.75):
    """Mała kępa liści (krzaki gałęziste, zioła): kula z szumem i własnym gradientem."""
    baza, sciany = _kula(1.0, podzial)
    off = Vector((rng.uniform(0, 99), rng.uniform(0, 99), rng.uniform(0, 99)))
    start = len(s.v)
    for d in baza:
        p = c + d * r * (1.0 + 0.18 * noise.noise(off + d * 1.8))
        if d.z < 0:
            p.z = c.z + (p.z - c.z) * splaszcz
        n = (d * 0.6 + Vector((0, 0, 0.5))).normalized()
        s.w(p, _mix(kol_dol, kol_gora, 0.5 + 0.5 * d.z), n)
    for f in sciany:
        s.f.append(tuple(start + i for i in f))


def lisc(s, podstawa, kierunek, dl, szer, kol, nachyl=0.45):
    """Liść: spłaszczona kula wyciągnięta od `podstawa` w `kierunek` (azymut, rad)."""
    baza, sciany = _kula(1.0, 1)
    d = Vector((math.cos(kierunek), math.sin(kierunek), nachyl)).normalized()
    bok = Vector((-math.sin(kierunek), math.cos(kierunek), 0))
    gora = d.cross(bok).normalized()
    srodek = podstawa + d * dl * 0.5
    start = len(s.v)
    for v in baza:
        p = srodek + d * v.x * dl * 0.5 + bok * v.y * szer * 0.5 + gora * v.z * szer * 0.24
        s.w(p, _mul(kol, 0.85 + 0.25 * max(0.0, v.z)), (gora * 0.8 + Vector((0, 0, 0.6))).normalized())
    for f in sciany:
        s.f.append(tuple(start + i for i in f))


def kulka(s, c, r, kol, jasny=None):
    baza, sciany = _kula(1.0, 1)
    jasny = jasny or _mul(kol, 1.2)
    start = len(s.v)
    for v in baza:
        s.w(c + v * r, _mix(kol, jasny, max(0.0, v.z)), v)
    for f in sciany:
        s.f.append(tuple(start + i for i in f))


def normalne_z_geometrii(s, od=0):
    """Gładkie normalne z samych ścian (kamienie: płaszczyzny cięć zostają płaskie)."""
    acc = [Vector((0, 0, 0)) for _ in range(len(s.v) - od)]
    for f in s.f:
        if min(f) < od:
            continue
        a, b, c = s.v[f[0]], s.v[f[1]], s.v[f[2]]
        n = (b - a).cross(c - a)
        for i in f:
            acc[i - od] += n
    for i, n in enumerate(acc):
        if n.length > 1e-9:
            s.n[od + i] = n.normalized()


# ── krzewy ───────────────────────────────────────────────────────────────────
# W, H — szerokość i wysokość (j.). Kolory sRGB.
LISC = dict(dol=(28, 72, 44), srod=(58, 120, 52), gora=(136, 176, 70))
OLIWA = dict(dol=(40, 64, 34), srod=(82, 106, 46), gora=(150, 162, 76))
KRZEWY = {
    "krzew_kopula_maly": dict(typ="kopula", W=7.0, H=4.2, kepy=4, **LISC),
    "krzew_kopula_sredni": dict(typ="kopula", W=8.5, H=5.0, kepy=5, **LISC),
    "krzew_kopula_duzy": dict(typ="kopula", W=11.0, H=6.5, kepy=6, **LISC),
    "krzew_kopula_oliwkowy": dict(typ="kopula", W=9.5, H=6.0, kepy=5, **OLIWA),
    "krzew_jagodowy": dict(typ="kopula", W=9.5, H=6.0, kepy=5, owoce=(196, 36, 40), owoce_n=22, owoc_r=0.42,
                           dol=(26, 64, 40), srod=(50, 108, 50), gora=(118, 160, 66)),
    "krzew_kwitnacy": dict(typ="kopula", W=10.0, H=5.8, kepy=5, owoce=(244, 240, 228), owoce_n=20, owoc_r=0.55, **LISC),
    "krzew_galezisty": dict(typ="galezie", W=9.5, H=7.0, witki=9, liscie=8, kora=(92, 74, 56), **LISC),
    "krzew_galezisty_jagodowy": dict(typ="galezie", W=10.5, H=7.5, witki=9, liscie=8, kora=(92, 74, 56),
                                     jagody=(196, 36, 40), **LISC),
    "krzew_suchy": dict(typ="galezie", W=10.0, H=6.5, witki=11, liscie=0, kora=(112, 92, 72)),
    "krzew_niski": dict(typ="kopula", W=14.0, H=3.4, kepy=7, plaski=True, **LISC),
    "krzew_chrust": dict(typ="chrust", W=14.0, H=2.6, patyki=13, kora=(110, 86, 62)),
}


def krzew(s, rng, g):
    W, H = g["W"], g["H"]
    if g["typ"] == "kopula":
        gg = dict(g)
        if g.get("plaski"):   # niski i szeroki: dużo MAŁYCH kęp, inaczej duże kępy podnoszą bryłę
            # ⚠ NIE kopuła: jej kępa szczytowa ma stałe 0,66 szerokości korony i przy
            #   W/H = 4 sama podnosiła krzew o 50% ponad cel.
            gg.update(srodek=0.50, szer=(W / 2) / H * 0.85, wys=0.30, gorne=0, kepy=9,
                      kepa_r=(0.20, 0.27), szum=0.20, uklad="luzny")
        else:
            gg.update(srodek=0.48, szer=(W / 2) / H * 0.82, wys=0.42, gorne=1, kepa_r=(0.44, 0.56),
                      szum=0.20, uklad="kopula", ring_z=(-0.35, 0.10), ring_r=(0.50, 0.66))
        kepy, _ = korona_lisciasta(s, rng, H, gg, Vector((0, 0, 0)))
        if g.get("owoce"):
            owoce(s, rng, H, gg, kepy)
        return
    if g["typ"] == "galezie":
        konce = []
        for i in range(g["witki"]):
            a = math.tau * i / g["witki"] + rng.uniform(-0.3, 0.3)
            rr = W / 2 * rng.uniform(0.55, 1.0)
            z = H * rng.uniform(0.55, 1.0)
            kon = Vector((math.cos(a) * rr, math.sin(a) * rr, z))
            _rura(s, Vector((0, 0, 0)), kon, 0.34, 0.10, 4, _mul(g["kora"], 0.7), g["kora"], 3, rng, 0.8)
            konce.append(kon)
        rng.shuffle(konce)
        for kon in konce[: g["liscie"]]:
            # ⚠ podział 2: przy 1 (20 ścian) kępki czytały się jak kanciaste lizaki
            kepka(s, kon, rng.uniform(1.7, 2.3), g["dol"], g["gora"], rng, podzial=2)
            if g.get("jagody"):
                for _ in range(3):
                    d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.2, 1))).normalized()
                    kulka(s, kon + d * 1.5, 0.40, g["jagody"])
        return
    # chrust: stos leżących patyków
    for i in range(g["patyki"]):
        a = rng.uniform(0, math.pi)
        dl = W * rng.uniform(0.45, 0.75)
        c = Vector((rng.uniform(-1, 1) * W * 0.18, rng.uniform(-1, 1) * W * 0.12, 0.3 + H * (i / g["patyki"]) * 0.8))
        d = Vector((math.cos(a), math.sin(a), rng.uniform(-0.08, 0.08))) * dl / 2
        _rura(s, c - d, c + d, rng.uniform(0.28, 0.42), 0.18, 5, _mul(g["kora"], 0.8), g["kora"], 2, rng, 0.3)


# ── kamienie ─────────────────────────────────────────────────────────────────
KAMIEN = dict(dol=(70, 66, 60), srod=(124, 116, 104), gora=(170, 162, 148), mech=(86, 112, 52))
KAMIENIE = {
    "kamien_drobny": dict(W=3.0, H=1.7, ciecia=2, mech=0.0),
    "kamien_maly": dict(W=5.0, H=2.8, ciecia=3, mech=0.15),
    "kamien_sredni": dict(W=8.0, H=4.2, ciecia=3, mech=0.30),
    "kamien_duzy": dict(W=11.0, H=5.8, ciecia=4, mech=0.40),
    "kamien_glaz": dict(W=12.5, H=8.0, ciecia=4, mech=0.50),
}


def kamien(s, rng, g):
    W, H = g["W"], g["H"]
    D = W * rng.uniform(0.70, 0.92)
    baza, sciany = _kula(1.0, 3 if W >= 7 else 2)   # 80 ścian czytało się jak kanciasta kula
    off = Vector((rng.uniform(0, 99), rng.uniform(0, 99), rng.uniform(0, 99)))
    ciecia = []
    for _ in range(g["ciecia"]):   # płaszczyzny ścinające — fasety jak w Wild Rift
        n = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(0.0, 1.0))).normalized()
        ciecia.append((n, rng.uniform(0.55, 0.80)))
    pts = []
    for d in baza:
        p = Vector(d) * (1.0 + 0.16 * noise.noise(off + d * 1.4))
        for n, odl in ciecia:
            k = p.dot(n)
            if k > odl:
                p = p - n * (k - odl)
        p.z = p.z if p.z > 0 else p.z * 0.25          # dół wkopany w grunt
        pts.append(Vector((p.x * W / 2, p.y * D / 2, (p.z + 0.18) * H / 1.18)))
    start = len(s.v)
    for p in pts:
        t = max(0.0, min(1.0, p.z / H))
        kol = _mix(KAMIEN["dol"], KAMIEN["srod"], t * 1.8) if t < 0.55 else _mix(KAMIEN["srod"], KAMIEN["gora"], (t - 0.55) / 0.45)
        kol = _mul(kol, 0.92 + 0.16 * noise.noise(off + p * 0.6))
        s.w(p, kol, Vector((0, 0, 1)))
    for f in sciany:
        s.f.append(tuple(start + i for i in f))
    normalne_z_geometrii(s, start)
    if g["mech"]:
        for i in range(start, len(s.v)):
            if s.n[i].z > 0.55 and noise.noise(off * 2 + s.v[i] * 0.5) > 0.35 - g["mech"]:
                s.kol[i] = _mix(s.kol[i], KAMIEN["mech"], 0.85)


# ── zioła ────────────────────────────────────────────────────────────────────
# H — wysokość łodyg (j.); liscie: (ile, długość, szerokość, "rozeta"|"lodyga");
# kwiat: (typ, kolor, rozmiar): kulki | baldach | klos | dzwonki | koszyczek.
ZIOLA = {
    "babka": dict(H=3.6, lodygi=3, liscie=(7, 2.4, 0.55, "rozeta"), lisc=(52, 104, 46),
                  kwiat=("klos", (122, 106, 64), 0.22)),
    "krwawnik": dict(H=4.8, lodygi=4, liscie=(8, 1.2, 0.40, "lodyga"), lisc=(66, 116, 54),
                     kwiat=("baldach", (238, 234, 222), 0.30)),
    "pokrzywa": dict(H=5.6, lodygi=3, liscie=(12, 1.5, 0.85, "lodyga"), lisc=(38, 88, 40),
                     kwiat=("klos", (110, 132, 70), 0.14)),
    "rumianek": dict(H=3.4, lodygi=6, liscie=(6, 1.0, 0.30, "lodyga"), lisc=(84, 136, 60),
                     kwiat=("koszyczek", (246, 244, 236), 0.24)),
    "dziurawiec": dict(H=5.0, lodygi=4, liscie=(8, 0.9, 0.35, "lodyga"), lisc=(62, 112, 48),
                       kwiat=("kulki", (242, 200, 40), 0.26)),
    "lebiodka": dict(H=4.4, lodygi=4, liscie=(8, 0.9, 0.55, "lodyga"), lisc=(70, 110, 54),
                     kwiat=("kulki", (200, 112, 168), 0.24)),
    "wrotycz": dict(H=6.0, lodygi=4, liscie=(8, 1.4, 0.45, "lodyga"), lisc=(56, 108, 48),
                    kwiat=("baldach", (232, 190, 36), 0.30)),
    "mieta": dict(H=4.0, lodygi=5, liscie=(10, 1.0, 0.60, "lodyga"), lisc=(92, 152, 72),
                  kwiat=("kulki", (184, 154, 214), 0.20)),
    "nawloc": dict(H=7.0, lodygi=3, liscie=(9, 1.3, 0.35, "lodyga"), lisc=(62, 110, 46),
                   kwiat=("klos", (242, 200, 48), 0.26)),
    "dziewanna": dict(H=8.0, lodygi=1, liscie=(6, 2.6, 1.2, "rozeta"), lisc=(140, 162, 120),
                      kwiat=("klos", (244, 212, 60), 0.34)),
    "zywokost": dict(H=4.6, lodygi=2, liscie=(6, 2.4, 1.0, "rozeta"), lisc=(48, 98, 48),
                     kwiat=("dzwonki", (128, 78, 168), 0.30)),
}


def ziolo(s, rng, g):
    H = g["H"]
    zielen = g["lisc"]
    n, dl, sz, gdzie = g["liscie"]
    typ, kol, r = g["kwiat"]
    szczyty = []
    for i in range(g["lodygi"]):
        a = math.tau * i / g["lodygi"] + rng.uniform(-0.4, 0.4)
        roz = 0.0 if g["lodygi"] == 1 else rng.uniform(0.5, 1.2)
        hh = H * rng.uniform(0.82, 1.0)
        top = Vector((math.cos(a) * roz, math.sin(a) * roz, hh))
        _rura(s, Vector((math.cos(a) * roz * 0.2, math.sin(a) * roz * 0.2, 0)), top, 0.16, 0.10, 4,
              _mul(zielen, 0.8), zielen, 2)
        szczyty.append(top)
    # ⭐ Kępka liści przy ziemi daje roślinie MASĘ — bez niej zioło było patykiem
    #   z kropką i ginęło w trawie (zrzut 2026-10-05).
    for i in range(3):
        a = math.tau * i / 3 + rng.uniform(-0.4, 0.4)
        kepka(s, Vector((math.cos(a) * 0.6, math.sin(a) * 0.6, 0.55)), rng.uniform(0.85, 1.15),
              _mul(zielen, 0.70), _mul(zielen, 1.20), rng, podzial=2, splaszcz=0.5)
    if gdzie == "rozeta":
        for i in range(n):
            lisc(s, Vector((0, 0, 0.15)), math.tau * i / n + rng.uniform(-0.2, 0.2), dl * rng.uniform(0.9, 1.2), sz * 1.4, zielen, 0.30)
    else:
        for i in range(n):
            t = szczyty[i % len(szczyty)]
            h = rng.uniform(0.15, 0.75)
            lisc(s, Vector((t.x * h, t.y * h, t.z * h)), rng.uniform(0, math.tau), dl * 1.15, sz * 1.5, zielen, 0.55)
    jasny = _mul(kol, 1.15)
    for top in szczyty:
        if typ == "kulki":
            for _ in range(5):
                kulka(s, top + Vector((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), rng.uniform(-0.3, 0.3))), r, kol, jasny)
        elif typ == "baldach":
            for j in range(7):
                a = math.tau * j / 7
                kulka(s, top + Vector((math.cos(a) * r * 2.2, math.sin(a) * r * 2.2, 0)), r, kol, jasny)
            kulka(s, top + Vector((0, 0, 0.1)), r, kol, jasny)
        elif typ == "klos":
            k = 8
            for j in range(k):
                t = j / (k - 1)
                kulka(s, top - Vector((0, 0, H * 0.38 * (1 - t))) + Vector((rng.uniform(-0.12, 0.12), rng.uniform(-0.12, 0.12), 0)),
                      r * (1.15 - 0.5 * t), kol, jasny)
        elif typ == "dzwonki":
            for j in range(4):
                a = math.tau * j / 4 + rng.uniform(-0.3, 0.3)
                kulka(s, top + Vector((math.cos(a) * 0.55, math.sin(a) * 0.55, -0.45)), r, kol, jasny)
        else:  # koszyczek: biały wianek płatków + żółty środek
            for j in range(6):
                a = math.tau * j / 6
                kulka(s, top + Vector((math.cos(a) * r * 1.5, math.sin(a) * r * 1.5, 0)), r * 0.85, kol, kol)
            kulka(s, top + Vector((0, 0, 0.08)), r * 0.9, (236, 190, 40))


# ── flora wodna ──────────────────────────────────────────────────────────────
# Źdźbło = liść wyciągnięty STROMO w górę (`lisc` z dużym nachyleniem).
WODNA = {
    "palka_duza": dict(typ="palka", H=10.5, zdzbla=11, kolby=4),
    "palka_srednia": dict(typ="palka", H=9.0, zdzbla=9, kolby=3),
    "palka_mala": dict(typ="palka", H=7.0, zdzbla=8, kolby=2),
    "trzcina_duza": dict(typ="trzcina", H=10.0, zdzbla=11, kolby=4),
    "trzcina_mala": dict(typ="trzcina", H=7.0, zdzbla=8, kolby=3),
    "kepa_bagienna": dict(typ="kepa", H=5.5, zdzbla=18),
    "roslina_brzegowa": dict(typ="brzegowa", H=4.5, zdzbla=7),
}
ZDZBLO_DOL, ZDZBLO_GORA = (52, 96, 44), (118, 156, 64)


def zdzblo(s, rng, H, kol=None):
    a = rng.uniform(0, math.tau)
    p0 = Vector((math.cos(a) * rng.uniform(0, 1.0), math.sin(a) * rng.uniform(0, 1.0), 0))
    lisc(s, p0, a, H * rng.uniform(0.75, 1.05), rng.uniform(0.45, 0.65),
         kol or _mix(ZDZBLO_DOL, ZDZBLO_GORA, rng.uniform(0.2, 0.9)), nachyl=rng.uniform(2.6, 4.5))


def wodna(s, rng, g):
    H = g["H"]
    if g["typ"] in ("palka", "trzcina"):
        for _ in range(g["zdzbla"]):
            zdzblo(s, rng, H * 0.82)
        for i in range(g["kolby"]):
            a = math.tau * i / g["kolby"] + rng.uniform(-0.5, 0.5)
            top = Vector((math.cos(a) * 0.7, math.sin(a) * 0.7, H * rng.uniform(0.85, 1.0)))
            _rura(s, Vector((0, 0, 0)), top, 0.16, 0.10, 4, ZDZBLO_DOL, ZDZBLO_GORA, 2)
            if g["typ"] == "palka":   # brązowa kolba na łodydze + szpic nad nią
                _rura(s, top - Vector((0, 0, 1.6)), top - Vector((0, 0, 0.2)), 0.42, 0.42, 6, (96, 58, 34), (120, 74, 42), 2)
            else:                     # trzcina: pierzasta wiecha
                for j in range(6):
                    kulka(s, top + Vector((rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), -j * 0.32)), 0.34, (172, 150, 118))
        return
    if g["typ"] == "kepa":
        for _ in range(g["zdzbla"]):
            zdzblo(s, rng, H)
        for _ in range(4):   # rdzawe końcówki jak w pixel-arcie
            a = rng.uniform(0, math.tau)
            kulka(s, Vector((math.cos(a) * 1.0, math.sin(a) * 1.0, H * rng.uniform(0.6, 0.9))), 0.30, (196, 104, 40))
        return
    # roślina brzegowa: szerokie liście + kilka żółtozielonych kłosków
    for i in range(g["zdzbla"]):
        lisc(s, Vector((0, 0, 0.2)), math.tau * i / g["zdzbla"] + rng.uniform(-0.3, 0.3), rng.uniform(2.4, 3.2),
             rng.uniform(1.2, 1.6), _mix((44, 92, 44), (96, 146, 58), rng.uniform(0, 1)), nachyl=rng.uniform(0.6, 1.2))
    for i in range(3):
        a = math.tau * i / 3
        top = Vector((math.cos(a) * 0.4, math.sin(a) * 0.4, H * rng.uniform(0.8, 1.0)))
        _rura(s, Vector((0, 0, 0)), top, 0.14, 0.10, 4, ZDZBLO_DOL, ZDZBLO_GORA, 2)
        for j in range(4):
            kulka(s, top - Vector((0, 0, j * 0.35)), 0.28, (176, 186, 70))


# ── drewno: pniaki, kłody, stosy ─────────────────────────────────────────────
DREWNO, SLOJ = (214, 176, 122), (176, 132, 86)


def denko(s, c, os_, r, seg, swiezosc, rng):
    """Ścięty koniec: koncentryczne słoje w kolorze (`swiezosc` 1 = jasne świeże, 0 = szare/zgniłe)."""
    os_ = os_.normalized()
    pom = Vector((1, 0, 0)) if abs(os_.x) < 0.9 else Vector((0, 1, 0))
    u = os_.cross(pom).normalized()
    v = os_.cross(u).normalized()
    jas = _mix((118, 104, 86), DREWNO, swiezosc)
    ciem = _mix((84, 72, 60), SLOJ, swiezosc)
    srodek = s.w(c, ciem, os_)
    pierscienie = []
    for k in range(1, 4):
        wiersz = []
        for j in range(seg):
            al = math.tau * j / seg
            wiersz.append(s.w(c + (u * math.cos(al) + v * math.sin(al)) * r * k / 3, jas if k % 2 else ciem, os_))
        pierscienie.append(wiersz)
    for j in range(seg):
        j2 = (j + 1) % seg
        s.f.append((srodek, pierscienie[0][j], pierscienie[0][j2]))
        for k in range(2):
            s.f.append((pierscienie[k][j], pierscienie[k + 1][j], pierscienie[k + 1][j2], pierscienie[k][j2]))


def kloda(s, rng, a, b, r, kora, swiezosc=1.0, seg=9):
    _rura(s, a, b, r, r * 0.92, seg, _mul(kora, 0.85), kora, 2, rng, r * 0.1)
    denko(s, a, a - b, r, seg, swiezosc, rng)
    denko(s, b, b - a, r * 0.92, seg, swiezosc, rng)


PNIAK_W = {"dab": 8.0, "buk": 10.0, "grab": 6.0, "brzoza": 5.0, "olcha": 7.0, "swierk": 4.5, "wierzba": 11.0}
STAN = {"swiezy": dict(sw=1.0, wys=0.42, mech=0.0), "zwietrzaly": dict(sw=0.45, wys=0.48, mech=0.2),
        "stary": dict(sw=0.0, wys=0.62, mech=0.55)}
PNIAKI = {f"{gat}_pniak_{st}": dict(typ="pniak", gat=gat, stan=st, W=W, H=W * STAN[st]["wys"])
          for gat, W in PNIAK_W.items() for st in STAN}
PNIAKI["pniak"] = dict(typ="pniak", gat="buk", stan="zwietrzaly", W=8.0, H=8.0 * 0.48 + 3.0, siekiera=True)
DREWNIANE = {
    "dluzyca_pozioma": dict(typ="dluzyca", H=5.3, dl=22.0, r=2.2, os="x"),
    "dluzyca_pionowa": dict(typ="dluzyca", H=4.3, dl=10.0, r=1.8, os="y"),
    # ⚠ krótkie kłody: przy 8–11 j. stos uciekał w głąb kadru i stał jak wieża
    "stos_maly": dict(typ="stos", H=5.0, rzedy=3, dl=4.5, r=1.1),
    "stos_duzy": dict(typ="stos", H=7.0, rzedy=4, dl=5.5, r=1.2),
    "kupka_klod": dict(typ="kupka", H=3.6, klody=4, dl=6.0, r=1.0),
    "klody_rozsypane": dict(typ="kupka", H=3.0, klody=5, dl=8.0, r=1.1, rozrzut=True),
}
KORA_POLA = (98, 74, 54)


def pniak(s, rng, g):
    gat, st = g["gat"], STAN[g["stan"]]
    kora = GATUNKI_DRZEW[gat]["kora"]
    if gat == "brzoza":   # brzoza zostaje biała
        kora = (214, 210, 196)
    W = g["W"]
    r0, H = W * 0.38, W * st["wys"]
    seg, rings = 10, 4
    off = Vector((rng.uniform(0, 50), rng.uniform(0, 50), rng.uniform(0, 50)))
    idx = []
    for k in range(rings + 1):
        t = k / rings
        r = r0 * (1 + 0.45 * (1 - t) ** 3)
        wiersz = []
        for j in range(seg):
            al = math.tau * j / seg
            n = Vector((math.cos(al), math.sin(al), 0))
            z = t * H
            if k == rings and st["sw"] < 0.5:   # stary/zwietrzały: poszarpany wierzch
                z -= abs(noise.noise(off + n * 2.0)) * H * (0.6 - st["sw"])
            kol = _mul(kora, 0.75 + 0.3 * t)
            if st["mech"] and noise.noise(off + n * 1.5 + Vector((0, 0, t))) > 0.4 - st["mech"]:
                kol = _mix(kol, (78, 112, 48), 0.8)
            wiersz.append(s.w(Vector((n.x * r, n.y * r, z)), kol, n))
        idx.append(wiersz)
    for k in range(rings):
        for j in range(seg):
            j2 = (j + 1) % seg
            s.f.append((idx[k][j], idx[k][j2], idx[k + 1][j2], idx[k + 1][j]))
    # wierzch: denko na średniej wysokości górnego pierścienia
    zt = sum(s.v[i].z for i in idx[-1]) / seg
    denko(s, Vector((0, 0, zt - 0.05)), Vector((0, 0, 1)), r0 * 0.97, seg, st["sw"], rng)
    for i in range(5):    # korzenie po gruncie
        a = math.tau * i / 5 + rng.uniform(-0.3, 0.3)
        d = Vector((math.cos(a), math.sin(a), 0))
        # tępe i przy ziemi — ostre zwężenie czytało się jak kolce
        _rura(s, d * r0 * 0.85 + Vector((0, 0, r0 * 0.28)), d * r0 * 1.55 + Vector((0, 0, r0 * 0.15)), r0 * 0.30, r0 * 0.17, 5,
              _mul(kora, 0.7), kora, 2)
    if g.get("siekiera"):
        top = Vector((0.3, 0, zt))
        _rura(s, top + Vector((0, 0, 0.2)), top + Vector((-2.2, 0.4, 2.8)), 0.24, 0.22, 5, (150, 112, 70), (170, 128, 80), 2)
        kloda(s, rng, top + Vector((0.3, -0.25, 0.1)), top + Vector((0.3, 0.25, 0.1)), 0.9, (150, 152, 160), 0.0)


def drewniane(s, rng, g):
    if g["typ"] == "dluzyca":
        d = Vector((g["dl"] / 2, 0, 0)) if g["os"] == "x" else Vector((0, g["dl"] / 2, 0))
        c = Vector((0, 0, g["r"] * 0.9))
        kloda(s, rng, c - d, c + d, g["r"], KORA_POLA, 0.6)
        # kikut gałęzi
        _rura(s, c + d * 0.3 + Vector((0, 0, g["r"] * 0.8)), c + d * 0.4 + Vector((0, -0.4, g["r"] * 1.45)), 0.4, 0.18, 5,
              KORA_POLA, KORA_POLA, 2)
        return
    if g["typ"] == "stos":   # piramida; ścięte końce do kamery (−Y w Blenderze = +Z w grze)
        r = g["r"]
        for rz in range(g["rzedy"]):
            n = g["rzedy"] - rz + 1
            for i in range(n):
                x = (i - (n - 1) / 2) * r * 2.02
                z = r + rz * r * 1.75
                dl = g["dl"] * rng.uniform(0.92, 1.0)
                kloda(s, rng, Vector((x, -dl / 2, z)), Vector((x, dl / 2, z)), r * rng.uniform(0.9, 1.05), KORA_POLA, 1.0, seg=7)
        return
    for i in range(g["klody"]):   # kupka / rozsypane
        a = rng.uniform(0, math.pi) if g.get("rozrzut") else rng.uniform(-0.4, 0.4)
        c = Vector((rng.uniform(-1, 1) * g["dl"] * 0.25, rng.uniform(-1, 1) * g["dl"] * 0.2,
                    g["r"] + (0 if g.get("rozrzut") else (i % 2) * g["r"] * 1.4)))
        d = Vector((math.cos(a), math.sin(a), 0)) * g["dl"] * rng.uniform(0.35, 0.5)
        kloda(s, rng, c - d, c + d, g["r"] * rng.uniform(0.85, 1.1), KORA_POLA, 0.8)


# ── drobiazgi ────────────────────────────────────────────────────────────────
INNE = {
    # kępka trawy — zastępuje kafle `Nature` 0–18 (warstwa `undergrowth`, wieś i las)
    "kepka_trawy": dict(typ="trawa", H=3.0),
    "grzyby": dict(typ="grzyby", H=3.2),
    "lilia": dict(typ="lilia", H=0.9),
    "suszona_skora": dict(typ="skora", H=12.0),
}


def inne(s, rng, g):
    if g["typ"] == "trawa":
        for _ in range(13):
            zdzblo(s, rng, g["H"], _mix((58, 104, 46), (124, 162, 66), rng.uniform(0, 1)))
        return
    if g["typ"] == "grzyby":
        for i in range(4):
            a = math.tau * i / 4 + rng.uniform(-0.4, 0.4)
            c = Vector((math.cos(a) * 0.9, math.sin(a) * 0.9, 0))
            h = rng.uniform(1.4, 2.6)
            _rura(s, c, c + Vector((0, 0, h)), 0.32, 0.26, 6, (210, 200, 180), (236, 230, 214), 2)
            baza, sciany = _kula(1.0, 2)
            start = len(s.v)
            for v in baza:
                p = c + Vector((0, 0, h)) + Vector((v.x * 1.0, v.y * 1.0, max(v.z, -0.15) * 0.65))
                s.w(p, _mix((150, 70, 30), (206, 110, 46), 0.5 + 0.5 * v.z), v)
            for f in sciany:
                s.f.append(tuple(start + i for i in f))
        return
    if g["typ"] == "lilia":
        for k in range(2):     # dwa liście z wcięciem + kwiat
            c = Vector((k * 2.6 - 1.3, rng.uniform(-0.6, 0.6), 0.15))
            seg, r = 14, rng.uniform(1.8, 2.3)
            sr = s.w(c + Vector((0, 0, 0.1)), (64, 116, 52), Vector((0, 0, 1)))
            brzeg = [s.w(c + Vector((math.cos(math.tau * j / seg) * r, math.sin(math.tau * j / seg) * r, 0)),
                         (52, 100, 46), Vector((0, 0, 1))) for j in range(seg)]
            for j in range(seg - 1):   # jeden wycinek pominięty = wcięcie liścia
                s.f.append((sr, brzeg[j], brzeg[j + 1]))
        for j in range(6):
            a = math.tau * j / 6
            kulka(s, Vector((1.3 + math.cos(a) * 0.45, math.sin(a) * 0.45, 0.45)), 0.35, (246, 220, 230))
        kulka(s, Vector((1.3, 0, 0.6)), 0.3, (240, 200, 60))
        return
    # suszona skóra: dwa słupy, poprzeczki, napięta skóra
    for x in (-4.0, 4.0):
        _rura(s, Vector((x, 0, 0)), Vector((x * 1.05, 0, g["H"])), 0.45, 0.35, 6, KORA_POLA, KORA_POLA, 2)
    for z in (g["H"] * 0.95, g["H"] * 0.12):
        _rura(s, Vector((-4.4, 0, z)), Vector((4.4, 0, z)), 0.32, 0.32, 6, KORA_POLA, KORA_POLA, 2)
    baza, sciany = _kula(1.0, 2)
    start = len(s.v)
    off = Vector((rng.uniform(0, 9), 0, 0))
    for v in baza:
        p = Vector((v.x * 3.2 * (1 + 0.12 * noise.noise(off + v * 2)), v.y * 0.3, g["H"] * 0.53 + v.z * 3.8))
        s.w(p, _mix((96, 58, 34), (150, 98, 58), 0.5 + 0.5 * v.z), Vector((0, -1, 0)) if v.y < 0 else Vector((0, 1, 0)))
    for f in sciany:
        s.f.append(tuple(start + i for i in f))
    for kx, kz in ((-1, 1), (1, 1), (-1, -1), (1, -1)):   # rzemienie do ramy
        a = Vector((kx * 2.8, 0, g["H"] * 0.53 + kz * 3.2))
        b = Vector((kx * 4.0, 0, g["H"] * (0.95 if kz > 0 else 0.12)))
        _rura(s, a, b, 0.1, 0.1, 4, (70, 50, 34), (70, 50, 34), 1)


# ── wieś: stóg, strach, ule, ławka, beczka, koryto, płot ─────────────────────
#: Kafel mapy (32 px) w jednostkach modelu przy skali gracza 4,955 px/j.
KAFEL_J = 32 / 4.955
SLOMA_DOL, SLOMA_GORA = (150, 118, 62), (222, 192, 112)
DESKA, DESKA_C = (138, 102, 66), (96, 70, 46)
WIES = {
    "stog_siana": dict(typ="stog", H=8.5, W=12.5),
    "strach": dict(typ="strach", H=13.0, W=11.0),
    "ul_a": dict(typ="ul", H=10.5, W=4.6, dach=(196, 150, 70)),
    "ul_b": dict(typ="ul", H=9.5, W=5.0, dach=(214, 170, 82)),
    "ul_c": dict(typ="ul", H=11.0, W=4.4, dach=(176, 134, 64)),
    "lawka": dict(typ="lawka", H=3.6, W=KAFEL_J * 2 * 0.9),
    "beczka": dict(typ="beczka", H=5.2, W=4.0),
    "koryto": dict(typ="koryto", H=2.4, W=KAFEL_J * 0.95),
    # płot: segment = DOKŁADNIE kafel (bez rozrzutu w `Trees3D`), słupek z lewej
    # chmielnik przy karczmie (2026-10-09): tyczka z pnączem — liście spiralą,
    # gęściej u góry, jasne szyszki. ~3,5 m, żeby rząd tyczek czytał się
    # z kamery jako „ściana zieleni" za karczmą.
    "chmiel": dict(typ="chmiel", H=24.0, W=5.0),
    "plot": dict(typ="plot", H=5.6, W=KAFEL_J, koniec=False),
    "plot_koniec": dict(typ="plot", H=5.6, W=KAFEL_J, koniec=True),
}


def skrzynka(s, c, sx, sy, sz, kol, kol_gora=None):
    """Prostopadłościan o płaskich ścianach (osobne wierzchołki na ścianę)."""
    kg = kol_gora or kol
    for n, (u, v) in (((1, 0, 0), ((0, 1, 0), (0, 0, 1))), ((-1, 0, 0), ((0, 0, 1), (0, 1, 0))),
                      ((0, 1, 0), ((0, 0, 1), (1, 0, 0))), ((0, -1, 0), ((1, 0, 0), (0, 0, 1))),
                      ((0, 0, 1), ((1, 0, 0), (0, 1, 0))), ((0, 0, -1), ((0, 1, 0), (1, 0, 0)))):
        nn, uu, vv = Vector(n), Vector(u), Vector(v)
        h = Vector((sx / 2, sy / 2, sz / 2))
        sr = c + Vector((nn.x * h.x, nn.y * h.y, nn.z * h.z))
        du = Vector((uu.x * h.x, uu.y * h.y, uu.z * h.z))
        dv = Vector((vv.x * h.x, vv.y * h.y, vv.z * h.z))
        k = kg if n == (0, 0, 1) else _mul(kol, 0.82 if n[2] < 0 else 1.0)
        idx = [s.w(sr + a * du + b * dv, k, nn) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        s.f.append(tuple(idx))


def stozek(s, podst, r, h, seg, kol_dol, kol_gora, rng=None, szarpany=0.0):
    """Stożek z otwartą podstawą (dach ula, kapelusz)."""
    wierz = s.w(podst + Vector((0, 0, h)), kol_gora, Vector((0, 0, 1)))
    ring = []
    for j in range(seg):
        a = math.tau * j / seg
        rr = r * (1 + (rng.uniform(-szarpany, szarpany) if rng else 0))
        d = Vector((math.cos(a), math.sin(a), 0))
        ring.append(s.w(podst + d * rr - Vector((0, 0, (abs(rng.uniform(0, szarpany)) * h if rng else 0))),
                        kol_dol, (d + Vector((0, 0, r / h))).normalized()))
    for j in range(seg):
        s.f.append((ring[j], ring[(j + 1) % seg], wierz))


def wies(s, rng, g):
    t, H, W = g["typ"], g["H"], g["W"]
    if t == "stog":
        baza, sciany = _kula(1.0, 3)
        off = Vector((rng.uniform(0, 9), rng.uniform(0, 9), 0))
        start = len(s.v)
        for d in baza:
            amp = 1 + 0.06 * noise.noise(off + d * 6.0)
            p = Vector((d.x * W / 2 * amp, d.y * W / 2 * 0.9 * amp, max(d.z, -0.05) * H * amp))
            pas = 0.85 + 0.25 * (0.5 + 0.5 * math.sin(d.z * 22 + noise.noise(d * 3) * 3))   # pasma źdźbeł
            s.w(p, _mul(_mix(SLOMA_DOL, SLOMA_GORA, 0.3 + 0.7 * max(0, d.z)), pas), d)
        for f in sciany:
            s.f.append(tuple(start + i for i in f))
        for _ in range(6):   # sterczące źdźbła na czubku
            lisc(s, Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), H * 0.92)), rng.uniform(0, math.tau), 2.2, 0.3,
                 SLOMA_GORA, nachyl=rng.uniform(0.8, 2.0))
        return
    if t == "strach":
        _rura(s, Vector((0, 0, 0)), Vector((0, 0, H * 0.82)), 0.32, 0.28, 6, DESKA_C, DESKA, 2)
        _rura(s, Vector((-W / 2, 0, H * 0.6)), Vector((W / 2, 0, H * 0.6)), 0.26, 0.26, 6, DESKA_C, DESKA, 2)
        # koszula: korpus + rękawy (kolory łat)
        _rura(s, Vector((0, 0, H * 0.36)), Vector((0, 0, H * 0.66)), 1.6, 1.25, 8, (120, 52, 40), (150, 66, 48), 2)
        for kx in (-1, 1):
            _rura(s, Vector((kx * 0.9, 0, H * 0.6)), Vector((kx * W * 0.42, 0, H * 0.6)), 0.75, 0.6, 7, (70, 84, 120), (96, 110, 150), 2)
            for _ in range(4):   # słoma z rękawów
                lisc(s, Vector((kx * W * 0.42, 0, H * 0.6)), (0 if kx > 0 else math.pi) + rng.uniform(-0.6, 0.6), 1.3, 0.3,
                     SLOMA_GORA, nachyl=rng.uniform(-0.6, 0.6))
        kulka(s, Vector((0, 0, H * 0.77)), 1.3, (196, 170, 120))                 # głowa z worka
        stozek(s, Vector((0, 0, H * 0.84)), 1.2, 2.0, 8, (110, 74, 44), (130, 88, 52))
        baza, sciany = _kula(1.0, 1)   # rondo kapelusza
        start = len(s.v)
        for v in baza:
            s.w(Vector((v.x * 2.4, v.y * 2.4, H * 0.84 + v.z * 0.15)), (104, 70, 42), Vector((0, 0, 1)))
        for f in sciany:
            s.f.append(tuple(start + i for i in f))
        return
    if t == "ul":   # kłoda bartna: pień, wylot do kamery (−Y), słomiany daszek, nóżki
        r = W / 2
        for kx, ky in ((-0.6, -0.6), (0.6, -0.6), (0, 0.7)):
            _rura(s, Vector((kx * r, ky * r, 0)), Vector((kx * r * 0.7, ky * r * 0.7, 1.4)), 0.28, 0.24, 5, DESKA_C, DESKA, 1)
        _rura(s, Vector((0, 0, 1.2)), Vector((0, 0, H * 0.72)), r, r * 0.94, 10, (110, 76, 48), (150, 108, 64), 4, rng, 0.1)
        kulka(s, Vector((0, -r * 0.92, H * 0.42)), 0.6, (30, 22, 18), (40, 30, 24))       # wylot
        stozek(s, Vector((0, 0, H * 0.70)), r * 1.45, H * 0.32, 14, _mul(g["dach"], 0.8), g["dach"], rng, 0.06)
        for _ in range(4):   # pszczoły
            kulka(s, Vector((rng.uniform(-1, 1) * r * 1.6, -r * rng.uniform(1.2, 1.8), H * rng.uniform(0.3, 0.7))),
                  0.22, (226, 190, 40))
        return
    if t == "chmiel":
        _rura(s, Vector((0, 0, 0)), Vector((0, 0, H)), 0.35, 0.25, 6, DESKA_C, DESKA, 2)
        n = 26
        for i in range(n):
            tt = i / n
            kat = tt * math.tau * 3.2 + rng.uniform(-0.3, 0.3)
            r = 0.7 + 1.6 * tt
            z = H * (0.12 + 0.86 * tt)
            c = Vector((math.cos(kat) * r, math.sin(kat) * r, z))
            kulka(s, c, rng.uniform(0.9, 1.3) * (0.7 + 0.6 * tt), _mul((58, 104, 44), rng.uniform(0.85, 1.1)), (104, 156, 66))
            if tt > 0.45 and rng.random() < 0.5:
                kulka(s, c + Vector((rng.uniform(-0.8, 0.8), -0.9, -0.6)), 0.45, (170, 196, 104), (206, 222, 140))
        return
    if t == "lawka":
        skrzynka(s, Vector((0, 0, H * 0.82)), W, 2.2, 0.45, DESKA, _mul(DESKA, 1.12))
        for kx in (-0.42, 0.42):
            for ky in (-0.35, 0.35):
                skrzynka(s, Vector((kx * W, ky * 2.2, H * 0.4)), 0.45, 0.45, H * 0.8, DESKA_C)
        return
    if t == "beczka":
        seg, rings = 12, 6
        idx = []
        for k in range(rings + 1):
            tt = k / rings
            r = W / 2 * (0.86 + 0.14 * math.sin(math.pi * tt))
            obr = abs(tt - 0.15) < 0.06 or abs(tt - 0.85) < 0.06
            wiersz = []
            for j in range(seg):
                a = math.tau * j / seg
                n = Vector((math.cos(a), math.sin(a), 0))
                kol = (58, 54, 52) if obr else _mul(DESKA, 0.9 + 0.2 * (j % 2))
                wiersz.append(s.w(n * r + Vector((0, 0, tt * H)), kol, n))
            idx.append(wiersz)
        for k in range(rings):
            for j in range(seg):
                j2 = (j + 1) % seg
                s.f.append((idx[k][j], idx[k][j2], idx[k + 1][j2], idx[k + 1][j]))
        denko(s, Vector((0, 0, H)), Vector((0, 0, 1)), W / 2 * 0.86, seg, 0.7, rng)
        return
    if t == "koryto":
        skrzynka(s, Vector((0, 0, H / 2)), W, 3.0, H, DESKA, DESKA)
        skrzynka(s, Vector((0, 0, H - 0.02)), W * 0.86, 2.2, 0.06, (52, 86, 112), (64, 104, 132))   # woda w środku
        return
    # płot: słupek z lewej (i z prawej na końcu), dwie żerdzie przez cały kafel
    for x in ([-W / 2, W / 2] if g["koniec"] else [-W / 2]):
        skrzynka(s, Vector((x, 0, H / 2)), 0.7, 0.7, H, DESKA_C, DESKA)
    for z in (H * 0.38, H * 0.78):
        _rura(s, Vector((-W / 2, 0, z)), Vector((W / 2, 0, z)), 0.3, 0.3, 6, DESKA, _mul(DESKA, 1.1), 1)


# ── kuźnia: piec, kowadło, osełka, miech, stojaki, węgiel, stół z imadłem ────
# Z kafli `Kuznia` (warstwa `wyposazenie` w Zagajach) — `REKWIZYTY_3D.kafleKuznia`.
# Sylwetki z arkusza `Kuznia.png` (`docs/kuznia.json`), front do kamery (−Y).
KAMIEN_PIECA = ((96, 98, 104), (150, 152, 158))
ZELAZO, ZELAZO_J = (70, 74, 82), (128, 134, 144)
WEGIEL = (34, 34, 38)
JUTA = ((150, 124, 80), (196, 170, 116))
KUZNIA = {
    "piec": dict(typ="piec", H=16.0, W=KAFEL_J * 2 * 0.86),
    "kowadlo": dict(typ="kowadlo", H=5.0, W=5.6),
    "oselka": dict(typ="oselka", H=6.2, W=5.4),
    "miech": dict(typ="miech", H=4.4, W=6.4),
    "stojak_narzedzi": dict(typ="regal", H=7.4, W=KAFEL_J * 0.95),
    "stojak_broni": dict(typ="stojak", H=7.6, W=KAFEL_J * 0.95),
    "worek_wegla": dict(typ="worek", H=4.6, W=4.8),
    "stol_imadlo": dict(typ="stol", H=5.8, W=KAFEL_J * 2 * 0.9),
}


def krazek(s, c, os_, r, seg, kol):
    """Płaskie koło (denko tarczy, czoło kamienia) o normalnej `os_`."""
    d = os_.normalized()
    pom = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 1, 0))
    u = d.cross(pom).normalized()
    v = d.cross(u).normalized()
    sr = s.w(c, kol, d)
    ring = [s.w(c + (u * math.cos(math.tau * j / seg) + v * math.sin(math.tau * j / seg)) * r, kol, d)
            for j in range(seg)]
    for j in range(seg):
        s.f.append((sr, ring[j], ring[(j + 1) % seg]))


def czworokat(s, pkt, kol, srodek):
    """Płaski czworokąt; kolejność odwracana tak, żeby normalna szła OD `srodek`."""
    a, b, c, d = pkt
    n = (b - a).cross(d - a).normalized()
    if n.dot((a + c) / 2 - srodek) < 0:
        a, b, c, d = d, c, b, a
        n = -n
    s.f.append(tuple(s.w(p, kol, n) for p in (a, b, c, d)))


def lico_kamienne(s, rng, x0, x1, z0, z1, y, kursy, w_kam):
    """Kamienie na licu ściany zwróconym do −Y, kursy przesunięte o pół kamienia;
    ciemniejsza bryła pod spodem robi za fugę."""
    hk = (z1 - z0) / kursy
    for k in range(kursy):
        x = x0 - (w_kam / 2 if k % 2 else 0)
        while x < x1:
            xa, xb = max(x, x0), min(x + w_kam, x1)
            if xb - xa > 0.4:
                kol = _mul(_mix(*KAMIEN_PIECA, rng.uniform(0.25, 0.95)), rng.uniform(0.92, 1.05))
                skrzynka(s, Vector(((xa + xb) / 2, y - 0.12, z0 + hk * (k + 0.5))), xb - xa - 0.16, 0.26, hk - 0.16, kol)
            x += w_kam


def piec(s, rng, H, W):
    """Palenisko kowalskie: kamienny blok do pasa z żarem na wierzchu, tylna
    ściana, okap z gliny na dwóch słupach i komin. Otwór dyszy na lewym boku
    (miech stoi w Zagajach na lewo od pieca).
    ⚠ Do 2026-10-09 był tu „ul" z kamienia — kopia sylwetki z grafiki Gemini;
    autor: tak nie wyglądały piece kowalskie."""
    s.bez_wyrownania = True   # osobne ściany — patrz `do_blendera`
    sz, gl, hp = W * 0.92, 6.0, 5.0                     # palenisko: szerokość, głębokość, wysokość
    fuga = _mul(KAMIEN_PIECA[0], 0.62)
    skrzynka(s, Vector((0, 0, hp / 2)), sz, gl, hp, fuga, _mul(KAMIEN_PIECA[0], 0.8))
    lico_kamienne(s, rng, -sz / 2, sz / 2, 0, hp, -gl / 2, 4, 2.2)
    # wierzch: jama z węglem drzewnym i żar
    skrzynka(s, Vector((0, -0.4, hp + 0.08)), sz * 0.62, gl * 0.58, 0.16, WEGIEL, (44, 40, 40))
    for _ in range(14):
        zar = rng.uniform(0, 1)
        kol = _mix((120, 36, 18), (250, 150, 50), zar) if zar > 0.35 else (52, 46, 44)
        kulka(s, Vector((rng.uniform(-0.28, 0.28) * sz, -0.4 + rng.uniform(-0.25, 0.25) * gl, hp + 0.3)),
              rng.uniform(0.3, 0.5), kol, _mul(kol, 1.25))
    skrzynka(s, Vector((-sz / 2 - 0.05, -0.4, hp * 0.8)), 0.12, 0.9, 0.9, (24, 20, 18))   # otwór dyszy
    # tylna ściana do okapu
    zw, yw = 10.0, gl / 2 - 0.6
    skrzynka(s, Vector((0, yw, (hp + zw) / 2)), sz, 1.2, zw - hp, fuga)
    lico_kamienne(s, rng, -sz / 2, sz / 2, hp, zw, yw - 0.6, 3, 2.0)
    # słupy i belka pod okapem
    for kx in (-1, 1):
        skrzynka(s, Vector((kx * (sz / 2 - 0.4), -gl / 2 + 0.6, (hp + zw) / 2)), 0.6, 0.6, zw - hp, DESKA_C, DESKA)
    skrzynka(s, Vector((0, -gl / 2 + 0.6, zw - 0.3)), sz, 0.7, 0.6, DESKA_C, DESKA)
    # okap: ścięta piramida z gliny, okopcona od spodu, zwęża się w komin
    zk, kom_w, kom_g = 13.0, 2.6, 2.2
    yk = yw - 0.4
    dol = [Vector((x, y, zw)) for x, y in ((-sz / 2, -gl / 2 + 0.3), (sz / 2, -gl / 2 + 0.3),
                                           (sz / 2, yw + 0.6), (-sz / 2, yw + 0.6))]
    gora = [Vector((x, y, zk)) for x, y in ((-kom_w / 2, yk - kom_g / 2), (kom_w / 2, yk - kom_g / 2),
                                            (kom_w / 2, yk + kom_g / 2), (-kom_w / 2, yk + kom_g / 2))]
    srodek = Vector((0, yk * 0.5, (zw + zk) / 2))
    for i in range(4):
        j = (i + 1) % 4
        czworokat(s, (dol[i], dol[j], gora[j], gora[i]), (152, 128, 100) if i != 2 else (120, 100, 80), srodek)
    czworokat(s, tuple(dol), (58, 50, 44), srodek + Vector((0, 0, 5)))      # okopcony spód
    skrzynka(s, Vector((0, yk, (zk + H) / 2)), kom_w, kom_g, H - zk, (146, 122, 96), (120, 102, 84))
    skrzynka(s, Vector((0, yk, H - 0.02)), kom_w * 0.6, kom_g * 0.6, 0.06, (22, 18, 16))   # wylot


def kuznia(s, rng, g):
    t, H, W = g["typ"], g["H"], g["W"]
    if t == "piec":
        piec(s, rng, H, W)
        return
    if t == "kowadlo":
        _rura(s, Vector((0, 0, 0)), Vector((0, 0, H * 0.55)), 1.7, 1.55, 9, DESKA_C, DESKA, 2, rng, 0.05)
        krazek(s, Vector((0, 0, H * 0.55)), Vector((0, 0, 1)), 1.55, 9, _mul(DESKA, 1.1))
        skrzynka(s, Vector((0, 0, H * 0.62)), 2.6, 1.6, H * 0.14, ZELAZO)                 # stopa
        skrzynka(s, Vector((0, 0, H * 0.74)), 1.5, 1.0, H * 0.12, ZELAZO)                 # talia
        skrzynka(s, Vector((-0.4, 0, H * 0.88)), W * 0.62, 1.5, H * 0.17, ZELAZO, ZELAZO_J)   # blat
        _rura(s, Vector((W * 0.27, 0, H * 0.9)), Vector((W * 0.5, 0, H * 0.93)), 0.7, 0.08, 7, ZELAZO, ZELAZO_J, 2)
        return
    if t == "oselka":
        # rama z dwóch kozłów, oś, kamień szlifierski w płaszczyźnie XZ, korba
        for kx in (-1.6, 1.6):
            for ky in (-1, 1):
                _rura(s, Vector((kx, ky * 1.1, 0)), Vector((kx, 0, H * 0.45)), 0.26, 0.22, 5, DESKA_C, DESKA, 1)
        skrzynka(s, Vector((0, 0, H * 0.45)), 3.8, 0.6, 0.5, DESKA)
        rc = H * 0.38
        c = Vector((0, 0, H * 0.45 + rc * 0.62))
        _rura(s, c - Vector((0, 0.45, 0)), c + Vector((0, 0.45, 0)), rc, rc, 16, (118, 120, 126), (150, 152, 158), 1)
        krazek(s, c - Vector((0, 0.45, 0)), Vector((0, -1, 0)), rc, 16, (136, 138, 144))
        krazek(s, c + Vector((0, 0.45, 0)), Vector((0, 1, 0)), rc, 16, (120, 122, 128))
        _rura(s, c + Vector((-2.1, 0, 0)), c + Vector((2.1, 0, 0)), 0.2, 0.2, 5, ZELAZO, ZELAZO_J, 1)
        _rura(s, c + Vector((2.1, 0, 0)), c + Vector((2.1, 0, -1.3)), 0.16, 0.16, 5, ZELAZO, ZELAZO_J, 1)
        skrzynka(s, Vector((0, 0, H * 0.18)), 2.6, 1.5, 0.8, (52, 86, 112), (64, 104, 132))   # koryto z wodą
        return
    if t == "miech":
        # dwie deski w klin, skórzany mieszek między nimi, żelazna dysza w prawo
        for kx, ky in ((-2.0, -0.9), (-2.0, 0.9), (1.6, 0)):
            _rura(s, Vector((kx, ky, 0)), Vector((kx * 0.95, ky * 0.9, H * 0.42)), 0.22, 0.2, 5, DESKA_C, DESKA, 1)
        baza, sciany = _kula(1.0, 2)
        start = len(s.v)
        for v in baza:
            szer = 1.0 - 0.55 * max(0.0, v.x)       # zwęża się do dyszy
            p = Vector((v.x * W * 0.36, v.y * 1.9 * szer, H * 0.62 + v.z * H * 0.22 * szer))
            fala = 0.85 + 0.15 * math.sin(v.z * 9)    # fałdy skóry
            s.w(p, _mul((110, 70, 42), fala), v)
        for f in sciany:
            s.f.append(tuple(start + i for i in f))
        for kz in (1, -1):   # deski
            skrzynka(s, Vector((-0.3, 0, H * 0.62 + kz * H * 0.23)), W * 0.62, 3.6, 0.35, DESKA, _mul(DESKA, 1.1))
        _rura(s, Vector((-W * 0.3, 0, H * 0.85)), Vector((-W * 0.5, 0, H * 1.0)), 0.25, 0.22, 5, DESKA_C, DESKA, 1)   # rączka
        _rura(s, Vector((W * 0.3, 0, H * 0.62)), Vector((W * 0.52, 0, H * 0.58)), 0.55, 0.3, 7, ZELAZO, ZELAZO_J, 1)
        return
    if t == "regal":
        # regał: dwie boczne deski, plecy, cztery półki; narzędzia LEŻĄ na półkach.
        # ⚠ Do 2026-10-09 był to stojak z młotkami na cienkich trzonkach — trzonka
        #   nie było widać i młotki „wisiały w powietrzu" (autor, zrzut z gry).
        D = 2.2
        for x in (-W / 2 + 0.2, W / 2 - 0.2):
            skrzynka(s, Vector((x, 0, H / 2)), 0.4, D, H, DESKA_C, DESKA)
        skrzynka(s, Vector((0, D / 2 - 0.1, H / 2)), W - 0.4, 0.2, H, _mul(DESKA_C, 0.85))
        polki = (0.35, 2.7, 5.0, H - 0.15)
        for z in polki:
            skrzynka(s, Vector((0, 0, z)), W - 0.8, D - 0.2, 0.3, DESKA, _mul(DESKA, 1.12))
        szer = W - 1.0
        z = polki[0] + 0.15            # dolna: sztaby żelaza w stosie
        for i in range(3):
            skrzynka(s, Vector((-szer * 0.15 + i * 0.55, -0.2, z + 0.2)), 0.45, 1.4, 0.4, ZELAZO, ZELAZO_J)
        skrzynka(s, Vector((-szer * 0.15 + 0.55, -0.2, z + 0.6)), 0.45, 1.4, 0.4, ZELAZO, ZELAZO_J)
        z = polki[1] + 0.15            # środkowa: dwa młotki i obcęgi
        for i, x in enumerate((-szer * 0.32, -szer * 0.02)):
            skrzynka(s, Vector((x + 0.6, -0.3 + 0.4 * i, z + 0.15)), 2.0, 0.3, 0.3, (112, 82, 52))
            skrzynka(s, Vector((x - 0.6, -0.3 + 0.4 * i, z + 0.3)), 0.6, 1.1, 0.6, ZELAZO, ZELAZO_J)
        for ky in (-0.18, 0.18):
            skrzynka(s, Vector((szer * 0.3, -0.3 + ky, z + 0.08)), 0.14, 2.0, 0.14, ZELAZO, ZELAZO_J)
        z = polki[2] + 0.15            # górna: przecinaki i pilniki w rzędzie + skrzynka gwoździ
        for i in range(4):
            skrzynka(s, Vector((-szer * 0.4 + i * 0.5, -0.2, z + 0.1)), 0.22, 1.6, 0.2, ZELAZO_J, (170, 176, 186))
        skrzynka(s, Vector((szer * 0.25, 0, z + 0.45)), 1.6, 1.3, 0.9, DESKA_C, (60, 58, 60))
        return
    if t == "stojak":
        # stojak na broń: dwa słupki, belka dolna i górna z przegródkami; miecze sztychem w dół
        for x in (-W / 2 + 0.4, W / 2 - 0.4):
            skrzynka(s, Vector((x, 0, H * 0.4)), 0.55, 0.9, H * 0.8, DESKA_C, DESKA)
        skrzynka(s, Vector((0, 0, H * 0.12)), W, 1.4, 0.5, DESKA, _mul(DESKA, 1.1))
        skrzynka(s, Vector((0, 0, H * 0.62)), W, 0.6, 0.45, DESKA, _mul(DESKA, 1.1))
        for i in range(4):
            x = -W / 2 + 1.0 + (W - 2.0) * (i + 0.5) / 4
            skrzynka(s, Vector((x, 0, H * 0.48)), 0.45, 0.14, H * 0.66, ZELAZO_J, (176, 182, 192))
            skrzynka(s, Vector((x, 0, H * 0.82)), 1.3, 0.3, 0.3, ZELAZO)
            skrzynka(s, Vector((x, 0, H * 0.9)), 0.3, 0.3, H * 0.13, (70, 46, 30))
            kulka(s, Vector((x, 0, H * 0.98)), 0.28, ZELAZO, ZELAZO_J)
        return
    if t == "worek":
        baza, sciany = _kula(1.0, 2)
        start = len(s.v)
        off = Vector((rng.uniform(0, 9), 0, 0))
        for v in baza:
            k = 1 + 0.08 * noise.noise(off + v * 3)
            z = H * 0.42 * (1 + v.z)
            r = W / 2 * (1.0 - 0.25 * max(0.0, v.z) ** 2) * k
            s.w(Vector((v.x * r, v.y * r, min(z, H * 0.82))), _mix(*JUTA, 0.4 + 0.5 * v.z), v)
        for f in sciany:
            s.f.append(tuple(start + i for i in f))
        krazek(s, Vector((0, 0, H * 0.8)), Vector((0, 0, 1)), W / 2 * 0.74, 10, WEGIEL)
        for _ in range(16):   # węgiel w rozchylonym wylocie
            a, r = rng.uniform(0, math.tau), W / 2 * 0.62 * math.sqrt(rng.uniform(0, 1))
            kulka(s, Vector((math.cos(a) * r, math.sin(a) * r, H * rng.uniform(0.8, 0.9))),
                  rng.uniform(0.3, 0.45), WEGIEL, (70, 70, 80))
        return
    # stół z imadłem: głęboki, gruby i jasny blat (cienki czytał się w grze jak
    # żerdź płotu, a młotek na nim — jak wiszący w powietrzu), cztery nogi,
    # rozpórka, imadło na lewym końcu; narzędzia LEŻĄ na blacie
    blat, D, gr = H * 0.62, 4.6, 0.8
    gora = blat + gr / 2
    skrzynka(s, Vector((0, 0, blat)), W, D, gr, DESKA, (172, 132, 88))
    for kx in (-0.44, 0.44):
        for ky in (-0.36, 0.36):
            skrzynka(s, Vector((kx * W, ky * D, (blat - gr / 2) / 2)), 0.8, 0.8, blat - gr / 2, DESKA_C)
    skrzynka(s, Vector((0, 0, blat * 0.25)), W * 0.88, 0.5, 0.5, DESKA_C)
    vx = -W * 0.32
    skrzynka(s, Vector((vx, -D / 2 + 0.5, gora + 0.7)), 1.6, 0.6, 1.4, ZELAZO, ZELAZO_J)    # szczęka stała
    skrzynka(s, Vector((vx, -D / 2 - 0.3, gora + 0.7)), 1.6, 0.5, 1.4, ZELAZO, ZELAZO_J)    # ruchoma
    skrzynka(s, Vector((vx, -D / 2 - 0.9, gora + 0.6)), 0.3, 1.2, 0.3, ZELAZO, ZELAZO_J)    # śruba
    skrzynka(s, Vector((vx, -D / 2 - 1.5, gora + 0.6)), 1.6, 0.24, 0.24, ZELAZO, ZELAZO_J)  # pokrętło
    skrzynka(s, Vector((W * 0.1, 0.2, gora + 0.15)), 2.4, 0.35, 0.3, (112, 82, 52))         # młotek: trzonek
    skrzynka(s, Vector((W * 0.1 + 1.3, 0.2, gora + 0.3)), 0.6, 1.1, 0.6, ZELAZO, ZELAZO_J)  # obuch
    skrzynka(s, Vector((W * 0.32, -0.6, gora + 0.12)), 2.0, 1.2, 0.24, ZELAZO, ZELAZO_J)    # płaskownik


# ── encje: studnia, koło młyńskie, ognisko ───────────────────────────────────
# Encje (`Well`, `WaterWheel`, `Campfire`) rejestrują się w `PropInstances`
# pod tymi nazwami — widok 3D stawia model, a sprite zostaje dla dotyku i
# kolizji. Koło i płomień ruszają się w `Trees3D` (`REKWIZYTY_3D.animacje`).
#
# ⭐ **KOŁO STOI PIONOWO W NURCIE, OŚ WCHODZI W ŚCIANĘ MŁYNA** (2026-10-14,
# zgłoszenie autora: koło czytało się jak tarcza leżąca płasko). Do tej daty
# oś biegła wzdłuż modelu Y (północ–południe), czyli WZDŁUŻ rzeki — kamera
# z południa widziała lico koła jak talerz. Dziś:
#   - początek modelu = punkt, w którym oś wchodzi w ZACHODNIĄ ścianę młyna
#     (punkt `kolo_mlynskie` z Tiled leży na ścianie, rzeka płynie z północy
#     na południe tuż przy niej — `village-zagaje.tmj`, kafle x 3–5);
#   - oś wzdłuż +X (wschód, do młyna), koło w płaszczyźnie YZ, czyli
#     W PŁASZCZYŹNIE NURTU, KOLO_X j. na zachód od ściany;
#   - koło NASIĘBIERNE: woda z rynny (`mlynowka`) spada na wierzch, więc
#     wierzch idzie z nurtem na południe (obrót w silniku wokół +X).
# Infrastruktura (komora, kozioł z łożyskiem, rynna, jaz, woda) to OSOBNY,
# nieruchomy model `mlynowka` w tym samym punkcie — obraca się tylko koło.
#: Koło: środek NA OSI (obrót w silniku wokół osi modelu X → glTF X).
KOLO_R = 10.0
#: Oś koła nad gruntem (j.) — ta sama liczba co `REKWIZYTY_3D.animacje.kolo_mlynskie.uniesienie`.
KOLO_OS_Z = 8.5
#: Środek koła na zachód od ściany młyna (j.); szerokość wieńców (j.).
KOLO_X, KOLO_SZ = -8.5, 3.4
#: ⭐ SKRĘT koła i jego zabudowy wokół pionu (stopnie, przeciwnie do wskazówek
#: zegara z góry). Render 1:1 z 2026-10-14: koło dokładnie prostopadłe do
#: ściany kamera z południa widzi BOKIEM — wąski pas czerpaków pod długą rynną
#: czytał się jak taśmociąg (autor). 25° odsłania lico jako elipsę, a oś dalej
#: wchodzi w ścianę młyna. ⚠ Ta sama liczba w `REKWIZYTY_3D.animacje.
#: kolo_mlynskie.skretDeg` — silnik obraca koło wokół SKRĘCONEJ osi.
KOLO_SKRET = 25.0
ENCJE = {
    "studnia": dict(typ="studnia", H=13.5, W=8.6),
    "kolo_mlynskie": dict(typ="kolo", H=KOLO_R, W=KOLO_SZ, wokol_osi=True),
    "ognisko": dict(typ="ognisko", H=1.6, W=6.4),
    "ogien": dict(typ="ogien", H=5.2, W=2.6),
    # ⚠ Dopisane na KOŃCU: ziarno rng zależy od pozycji w `WARIANTY`.
    "mlynowka": dict(typ="mlynowka", H=KOLO_OS_Z + KOLO_R + 2.4, W=20.0, budzet=2600),
}


def encja(s, rng, g):
    t, H, W = g["typ"], g["H"], g["W"]
    if t == "studnia":
        s.bez_wyrownania = True
        # cembrowina: krąg kamieni w trzech kursach, woda w środku
        R, kursy, hk = W / 2, 3, 1.25
        for k in range(kursy):
            n = 11
            for j in range(n):
                a = math.tau * (j + 0.5 * (k % 2)) / n
                c = Vector((math.cos(a) * R, math.sin(a) * R, hk * (k + 0.5)))
                kol = _mul(_mix(*KAMIEN_PIECA, rng.uniform(0.2, 0.9)), rng.uniform(0.9, 1.05))
                o = skrzynka_obrocona(s, c, a, 2.4, 1.3, hk - 0.12, kol)
        krazek(s, Vector((0, 0, hk * kursy - 0.6)), Vector((0, 0, 1)), R - 0.6, 14, (40, 64, 82))
        # dwa słupy, kołowrót z liną i wiadrem, daszek ze strzechy
        zs = H * 0.72
        for kx in (-1, 1):
            skrzynka(s, Vector((kx * (R + 0.2), 0, zs / 2)), 0.8, 0.8, zs, DESKA_C, DESKA)
        zw = zs * 0.62
        skrzynka(s, Vector((0, 0, zw)), 2 * R + 1.2, 0.9, 0.9, DESKA, _mul(DESKA, 1.1))            # wał
        skrzynka(s, Vector((R + 1.2, -0.6, zw - 0.6)), 0.3, 1.4, 0.3, ZELAZO)                      # korba
        skrzynka(s, Vector((R + 1.2, -1.2, zw - 1.2)), 0.3, 0.3, 1.2, ZELAZO)
        skrzynka(s, Vector((0.6, 0, (zw + hk * kursy) / 2)), 0.12, 0.12, zw - hk * kursy, (190, 170, 120))   # lina
        skrzynka(s, Vector((0.6, 0, hk * kursy + 0.9)), 1.4, 1.4, 1.5, _mul(DESKA, 0.9), DESKA_C)  # wiadro
        for kz in (1, -1):    # dwuspadowy daszek, kalenica wzdłuż X
            a = Vector((-(R + 1.6), kz * 2.4, zs - 0.3))
            b = Vector(((R + 1.6), kz * 2.4, zs - 0.3))
            c = Vector(((R + 1.6), 0, H))
            d = Vector((-(R + 1.6), 0, H))
            czworokat(s, (a, b, c, d), _mix((150, 118, 64), (214, 182, 112), 0.6 if kz < 0 else 0.4), Vector((0, 0, zs - 10)))
            czworokat(s, (a, b, c, d), _mul((150, 118, 64), 0.6), Vector((0, kz * 10, H + 10)))
        skrzynka(s, Vector((0, 0, H)), 2 * R + 3.4, 0.9, 0.7, _mul((150, 118, 64), 0.85))
        return
    if t == "kolo":
        s.bez_wyrownania = True
        # Koło nasiębierne w płaszczyźnie YZ (nurt), oś wzdłuż X do młyna.
        # Dwa wieńce, sześć szprych na wieniec, czerpaki jako OTWARTE SKRZYNKI
        # (dno + przednia ścianka) — płaska łopatka czytała się jak wirnik.
        R, sz, xc = H, W, KOLO_X
        seg = 16
        drewno, drewno_c, czerpak = (124, 92, 60), (96, 70, 46), (110, 82, 54)
        for kier in (-1, 1):
            x = xc + kier * sz / 2
            for j in range(seg):
                a0, a1 = math.tau * j / seg, math.tau * (j + 1) / seg
                p = [Vector((x, math.cos(a) * r, math.sin(a) * r)) for a, r in ((a0, R - 1.2), (a1, R - 1.2), (a1, R), (a0, R))]
                czworokat(s, tuple(p), drewno, Vector((x - kier * 10, 0, 0)))
                czworokat(s, tuple(p), _mul(drewno, 0.78), Vector((x + kier * 10, 0, 0)))
            for j in range(6):   # szprychy
                a = math.tau * (j + 0.25) / 6
                kier_r = Vector((0, math.cos(a), math.sin(a)))
                styczna = Vector((0, -math.sin(a), math.cos(a)))
                _prostopadl(s, Vector((x, 0, 0)) + kier_r * R * 0.47, kier_r * R * 0.47, styczna * 0.32,
                            Vector((0.35, 0, 0)), drewno_c)
        for j in range(seg):     # czerpaki między wieńcami: dno (promieniowo) + ścianka (stycznie)
            a = math.tau * (j + 0.5) / seg
            kier_r = Vector((0, math.cos(a), math.sin(a)))
            styczna = Vector((0, -math.sin(a), math.cos(a)))
            szer = Vector((sz / 2 - 0.05, 0, 0))
            _prostopadl(s, Vector((xc, 0, 0)) + kier_r * (R - 0.75), kier_r * 0.75, styczna * 0.12, szer, czerpak)
            _prostopadl(s, Vector((xc, 0, 0)) + kier_r * (R - 0.25) + styczna * 0.75, kier_r * 0.25, styczna * 0.75,
                        szer, _mul(czerpak, 0.9))
        # oś: od zewnętrznego kozła (−X) do wnętrza ściany (+X), żelazne obręcze
        _prostopadl(s, Vector(((xc - sz / 2 - 3.2 + 1.0) / 2, 0, 0)), Vector(((1.0 - (xc - sz / 2 - 3.2)) / 2, 0, 0)),
                    Vector((0, 0.8, 0)), Vector((0, 0, 0.8)), (70, 54, 40))
        for ox in (xc - sz / 2 - 0.4, xc + sz / 2 + 0.4):
            _prostopadl(s, Vector((ox, 0, 0)), Vector((0.22, 0, 0)), Vector((0, 0.95, 0)), Vector((0, 0, 0.95)), ZELAZO)
        obroc_od(s, 0, KOLO_SKRET)
        return
    if t == "mlynowka":
        mlynowka(s, rng)
        return
    if t == "ognisko":
        s.bez_wyrownania = True
        R = W / 2
        for j in range(9):   # krąg kamieni
            a = math.tau * j / 9 + rng.uniform(-0.1, 0.1)
            c = Vector((math.cos(a) * R, math.sin(a) * R * 0.9, 0.5))
            kulka(s, c, rng.uniform(0.8, 1.05), _mix(*KAMIEN_PIECA, rng.uniform(0.2, 0.8)))
        krazek(s, Vector((0, 0, 0.08)), Vector((0, 0, 1)), R * 0.8, 12, (36, 30, 28))           # popiół
        for j in range(5):   # polana w stożek
            a = math.tau * j / 5 + 0.3
            p0 = Vector((math.cos(a) * R * 0.62, math.sin(a) * R * 0.55, 0.3))
            p1 = Vector((math.cos(a) * 0.3, math.sin(a) * 0.3, H))
            d = (p1 - p0)
            skrzynka_wzdluz(s, p0, p1, 0.6, (92, 66, 44), (60, 40, 30))
        for _ in range(6):   # żar
            kulka(s, Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0.3)), 0.35, (220, 90, 30), (250, 150, 60))
        return
    # płomień: trzy języki (bipiramidy) od żółtego środka po czerwone brzegi;
    # materiał świecący, migotanie skalą w silniku
    for j, (dx, dy, h, kol) in enumerate(((0, 0, H, (255, 214, 96)), (-0.7, 0.3, H * 0.7, (250, 140, 40)),
                                          (0.7, -0.2, H * 0.75, (240, 96, 30)), (0.1, 0.6, H * 0.55, (230, 70, 28)))):
        c = Vector((dx, dy, h / 2))
        bipiramida(s, c, Vector((0, 0, 1)), h, W / 2 * (1.0 if j == 0 else 0.7), kol)


WODA = (78, 128, 166)
WODA_J = (150, 196, 222)
PIANA = (226, 236, 238)


def kamienie_wzdluz_y(s, rng, x0, x1, y0, y1, z0, z1, kursy, dl_kam):
    """Mur z kamieni biegnący wzdłuż Y (przekrój x0..x1), kursy przesunięte
    o pół kamienia; każdy kurs o krok WĘŻSZY od wody — stopnie brzegu."""
    hk = (z1 - z0) / kursy
    for k in range(kursy):
        cofka = k * (x1 - x0) * 0.28   # stopień: wyższy kurs cofnięty od nurtu
        xa = x0 + cofka if x0 < x1 else x0
        y = y0 - (dl_kam / 2 if k % 2 else 0)
        while y < y1:
            ya, yb = max(y, y0), min(y + dl_kam, y1)
            if yb - ya > 0.5:
                kol = _mul(_mix(*KAMIEN_PIECA, rng.uniform(0.25, 0.95)), rng.uniform(0.9, 1.06))
                skrzynka(s, Vector(((xa + x1) / 2, (ya + yb) / 2, z0 + hk * (k + 0.5))),
                         x1 - xa - 0.12, yb - ya - 0.16, hk - 0.12, kol)
            y += dl_kam


def obroc_od(s, k0, stopnie):
    """Obróć wierzchołki (i normalne) od indeksu `k0` wokół pionu przez początek."""
    a = math.radians(stopnie)
    c, sn = math.cos(a), math.sin(a)
    for i in range(k0, len(s.v)):
        for lista in (s.v, s.n):
            v = lista[i]
            lista[i] = Vector((v.x * c - v.y * sn, v.x * sn + v.y * c, v.z))


def mlynowka(s, rng):
    """Zabudowa koła (nieruchoma). Początek = punkt osi na ścianie młyna, grunt
    z = 0; młyn na +X, rzeka na −X, nurt z północy (+Y) na południe.

    ⭐ Kształt pod KAMERĘ Z POŁUDNIA (2026-10-14, druga wersja): krótkie koryto
    z kamiennego filara z zastawką zamiast długiej rynny na sześciu kozłach
    (ta razem z kołem widzianym bokiem czytała się jak taśmociąg), cała
    zabudowa skręcona razem z kołem o `KOLO_SKRET` — poza podmurówką ściany
    młyna, która biegnie równo ze ścianą."""
    s.bez_wyrownania = True
    R, xc, sz, zo = KOLO_R, KOLO_X, KOLO_SZ, KOLO_OS_Z
    deska, deska_c = DESKA, DESKA_C
    # ── podmurówka ściany młyna (NIE skręcana — idzie równo ze ścianą) ──
    kamienie_wzdluz_y(s, rng, -1.4, 0.4, -14.0, 14.0, 0.0, 2.4, 2, 3.6)
    k0 = len(s.v)
    # ── komora koła: mur od nurtu ułożony w stopnie, dwa kursy ──
    x_mur = xc - sz / 2 - 1.3
    kamienie_wzdluz_y(s, rng, x_mur - 2.8, x_mur, -12.5, 12.5, 0.0, 2.2, 2, 3.4)
    # ── kozioł z łożyskiem osi na murze komory ──
    xk = xc - sz / 2 - 2.0
    for ky in (-1.6, 1.6):
        _prostopadl(s, Vector((xk, ky, (2.2 + zo) / 2)), Vector((0.5, 0, 0)), Vector((0, 0.5, 0)),
                    Vector((0, 0, (zo - 2.2) / 2)), deska_c)
    skrzynka(s, Vector((xk, 0, zo - 1.05)), 1.4, 4.8, 0.7, deska, _mul(deska, 1.1))
    skrzynka(s, Vector((xk, 0, zo + 1.05)), 1.4, 2.2, 0.5, deska_c)
    # ── krótkie koryto (rynna) z filara na wierzch koła ──
    z_dno = zo + R + 0.8
    y0, y1 = 0.8, 9.5
    szer, bok = 3.8, 1.5
    skrzynka(s, Vector((xc, (y0 + y1) / 2, z_dno - 0.25)), szer, y1 - y0, 0.5, deska, _mul(deska, 1.08))
    for kx in (-1, 1):
        skrzynka(s, Vector((xc + kx * (szer / 2 - 0.2), (y0 + y1) / 2, z_dno + bok / 2)), 0.4, y1 - y0, bok, deska_c, deska)
    czworokat(s, (Vector((xc - 1.5, y0, z_dno + 1.0)), Vector((xc + 1.5, y0, z_dno + 1.0)),
                  Vector((xc + 1.5, y1, z_dno + 1.0)), Vector((xc - 1.5, y1, z_dno + 1.0))), WODA, Vector((xc, 5, -50)))
    for yy in (2.0, 5.5):
        czworokat(s, (Vector((xc - 1.0, yy, z_dno + 1.05)), Vector((xc + 1.0, yy, z_dno + 1.05)),
                      Vector((xc + 0.7, yy + 2.4, z_dno + 1.05)), Vector((xc - 0.7, yy + 2.4, z_dno + 1.05))),
                  WODA_J, Vector((xc, yy, -50)))
    # jeden kozioł w połowie koryta (zamiast drabiny kozłów)
    for kx in (-1, 1):
        _prostopadl(s, Vector((xc + kx * 1.6, 5.0, (z_dno - 0.5) / 2)), Vector((0.36, 0, 0)), Vector((0, 0.36, 0)),
                    Vector((0, 0, (z_dno - 0.5) / 2)), deska_c)
    skrzynka_wzdluz(s, Vector((xc - 1.6, 5.0, 1.0)), Vector((xc + 1.6, 5.0, z_dno - 1.4)), 0.32, deska_c, deska)
    # ── wlot: niska kamienna podstawa + drewniana skrzynia na czterech słupach ──
    # (render 1:1: pełny kamienny filar do wysokości koryta czytał się jak komin)
    yf0, yf1 = 9.5, 14.5
    for k in range(2):
        for (dx, dy) in ((-1.3, -1.3), (1.3, -1.3), (-1.3, 1.3), (1.3, 1.3)):
            kol = _mul(_mix(*KAMIEN_PIECA, rng.uniform(0.25, 0.95)), rng.uniform(0.9, 1.06))
            skrzynka(s, Vector((xc + dx, (yf0 + yf1) / 2 + dy, 0.7 * (k + 0.5) * 2)), 2.5, 2.5, 1.26, kol)
    for (dx, dy) in ((-2.0, -2.0), (2.0, -2.0), (-2.0, 2.0), (2.0, 2.0)):
        _prostopadl(s, Vector((xc + dx, (yf0 + yf1) / 2 + dy, (2.8 + z_dno) / 2)), Vector((0.42, 0, 0)), Vector((0, 0.42, 0)),
                    Vector((0, 0, (z_dno - 2.8) / 2)), deska_c)
    for kz in (6.0, 12.0):   # oczepy między słupami
        skrzynka(s, Vector((xc, (yf0 + yf1) / 2 - 2.0, kz)), 4.4, 0.4, 0.4, deska)
        skrzynka(s, Vector((xc, (yf0 + yf1) / 2 + 2.0, kz)), 4.4, 0.4, 0.4, deska)
    skrzynka(s, Vector((xc, (yf0 + yf1) / 2, z_dno - 0.2)), szer + 1.4, yf1 - yf0 + 0.6, 0.6, deska, _mul(deska, 1.08))
    for kx in (-1, 1):   # burty skrzyni
        skrzynka(s, Vector((xc + kx * (szer / 2 + 0.4), (yf0 + yf1) / 2, z_dno + 0.8)), 0.4, yf1 - yf0 + 0.6, 1.6, deska_c, deska)
    # zastawka: dwa słupki, deski i belka z drągiem
    for kx in (-1, 1):
        skrzynka(s, Vector((xc + kx * 2.0, yf1 - 0.6, z_dno + 2.4)), 0.5, 0.5, 3.4, deska_c)
    skrzynka(s, Vector((xc, yf1 - 0.6, z_dno + 1.8)), szer, 0.35, 1.8, _mul(deska, 0.9))
    skrzynka(s, Vector((xc, yf1 - 0.6, z_dno + 4.2)), szer + 1.6, 0.6, 0.6, deska_c)
    skrzynka(s, Vector((xc, yf1 - 0.6, z_dno + 3.4)), 0.3, 0.3, 1.6, ZELAZO, ZELAZO_J)
    # woda nad zastawką (lustro na filarze) — zbiornik, z którego biegnie koryto
    czworokat(s, (Vector((xc - 1.6, yf0, z_dno + 1.05)), Vector((xc + 1.6, yf0, z_dno + 1.05)),
                  Vector((xc + 1.6, yf1 - 0.9, z_dno + 1.05)), Vector((xc - 1.6, yf1 - 0.9, z_dno + 1.05))),
              WODA_J, Vector((xc, 12, -50)))
    # ── jaz: kamienny próg w poprzek nurtu u stóp filara, piana pod nim ──
    kamienie_wzdluz_y(s, rng, -18.0, xc - 2.6, 11.0, 14.0, 0.0, 1.4, 1, 3.4)
    # ── woda: strumień z koryta na wierzch koła, bryzgi ──
    for k, (dx, w) in enumerate(((-1.0, 1.0), (0.0, 1.3), (1.0, 1.0))):
        p0 = Vector((xc + dx, y0 + 0.1, z_dno + 0.6))
        p1 = Vector((xc + dx * 0.8, -2.4, zo + R - 0.4))
        _prostopadl(s, (p0 + p1) / 2, (p1 - p0) / 2, Vector((w / 2, 0, 0)), Vector((0, 0.18, 0.18)),
                    WODA_J if k == 1 else WODA)
    for j in range(6):
        a = rng.uniform(0, math.tau)
        bipiramida(s, Vector((xc + math.cos(a) * 1.8, -2.6 + math.sin(a) * 1.3, zo + R + 0.3)),
                   Vector((math.cos(a) * 0.4, -0.5, 1.0)), 1.3, 0.38, PIANA)
    # ── woda spływająca z czerpaków (strona południowa): CIENKIE strugi i krople ──
    # (render 1:1: pełne tafle czytały się jak szyby)
    for k in range(3):
        th = math.radians(125 + 20 * k)
        y, z = math.cos(th) * (R + 0.2), zo + math.sin(th) * R
        for dx in (-1.0, 0.1, 1.1):
            dl = max(0.6, (z - 0.3) * rng.uniform(0.45, 0.8))
            _prostopadl(s, Vector((xc + dx, y - 0.3, z - dl / 2)), Vector((0, 0, dl / 2)), Vector((0.16, 0, 0)),
                        Vector((0, 0.12, 0)), WODA_J)
            bipiramida(s, Vector((xc + dx + rng.uniform(-0.2, 0.2), y - 0.4, z - dl - rng.uniform(0.6, 1.6))),
                       Vector((0, 0, 1)), 0.7, 0.22, PIANA)
    # ── piana: pod kołem, na odpływie i pod jazem ──
    for (cy, n, rozrzut, xr) in ((-6.0, 8, 6.0, (xc - 2.6, xc + 2.6)), (-13.5, 5, 3.0, (xc - 3.0, xc + 3.0)),
                                 (10.2, 7, 2.0, (-17.0, xc - 3.0))):
        for _ in range(n):
            bipiramida(s, Vector((rng.uniform(*xr), cy + rng.uniform(-rozrzut / 2, rozrzut / 2), 0.25)),
                       Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), 1.0)), rng.uniform(0.6, 1.0),
                       rng.uniform(0.5, 0.9), PIANA)
    obroc_od(s, k0, KOLO_SKRET)


def skrzynka_obrocona(s, c, a, sx, sy, sz, kol):
    """Prostopadłościan obrócony wokół Z o `a` (rad) — kamień w kręgu, dłuższym bokiem stycznie."""
    styczna = Vector((-math.sin(a), math.cos(a), 0))
    rad = Vector((math.cos(a), math.sin(a), 0))
    gora = Vector((0, 0, 1))
    _prostopadl(s, c, styczna * sx / 2, rad * sy / 2, gora * sz / 2, kol)


def skrzynka_obrocona_xz(s, c, a, dl, sy, gr, kol):
    """Prostopadłościan w płaszczyźnie XZ, dłuższym bokiem wzdłuż promienia o kącie `a`."""
    rad = Vector((math.cos(a), 0, math.sin(a)))
    pop = Vector((-math.sin(a), 0, math.cos(a)))
    _prostopadl(s, c, rad * dl / 2, Vector((0, 1, 0)) * sy / 2, pop * gr / 2, kol)


def skrzynka_wzdluz(s, p0, p1, gr, kol, kol_konca):
    """Belka od `p0` do `p1` o przekroju `gr`×`gr` (polano)."""
    d = p1 - p0
    os_ = d.normalized()
    pom = Vector((0, 0, 1)) if abs(os_.z) < 0.9 else Vector((1, 0, 0))
    u = os_.cross(pom).normalized()
    v = os_.cross(u).normalized()
    _prostopadl(s, (p0 + p1) / 2, os_ * d.length / 2, u * gr / 2, v * gr / 2, kol)


def _prostopadl(s, c, ex, ey, ez, kol):
    """Prostopadłościan o półosiach `ex`, `ey`, `ez` (wektory); ściany OD środka."""
    for os_, u, v in ((ex, ey, ez), (-ex, ez, ey), (ey, ez, ex), (-ey, ex, ez), (ez, ex, ey), (-ez, ey, ex)):
        sr = c + os_
        pts = (sr - u - v, sr + u - v, sr + u + v, sr - u + v)
        jas = 1.08 if os_.z > 0.3 else (0.8 if os_.z < -0.3 else 1.0)
        czworokat(s, pts, _mul(kol, jas), c)


# ── pola: zboże, ściernisko, len, nać, kapusta ───────────────────────────────
# Z kafli `Pole` w warstwie `uprawy` (`REKWIZYTY_3D.kafleUprawy`): JEDEN model
# = JEDEN kafel, środek w środku kafla, stawiany bez rozrzutu (`dokladne`) —
# obrócony kwadrat zostawiałby szpary w niwie. Trzy kształty na rodzaj, żeby
# pole nie było stemplem. ⚠ Budżet: ~800 kafli upraw we wsi, więc źdźbło to
# wstęga z 2 trójkątów, a kłos bipiramida z 6 — nie kula.
POLE_W = KAFEL_J * 1.06    # lekki zakład na sąsiada: szew niwy znika
POLE = {
    "zboze_dojrzale": dict(typ="zboze", H=6.0, n=36, lodyga=((150, 120, 58), (206, 172, 86)), klos=(226, 190, 96)),
    "zboze_zielone": dict(typ="zboze", H=4.4, n=36, lodyga=((70, 112, 46), (118, 156, 64)), klos=(140, 170, 80)),
    "sciernisko": dict(typ="sciernisko", H=1.3, n=34),
    "len": dict(typ="len", H=4.6, n=24),
    "nac_gesta": dict(typ="nac", H=2.6, rzedy=2, kepy=4, kol=((54, 104, 40), (110, 160, 66))),
    "nac_niska": dict(typ="nac", H=1.6, rzedy=2, kepy=4, kol=((62, 110, 44), (120, 164, 70))),
    "nac_cebulowa": dict(typ="cebula", H=3.0, rzedy=2, kepy=4, kol=((70, 116, 84), (128, 170, 120))),
    "kapusta_dojrzala": dict(typ="kapusta", H=2.6, r=1.35),
    "kapusta_mloda": dict(typ="kapusta", H=1.9, r=0.95),
    "kapusta_sadzonka": dict(typ="kapusta", H=1.2, r=0.55),
}


def wstega(s, p0, p1, szer, kol0, kol1):
    """Płaskie źdźbło: 2 trójkąty od `p0` (szerokie) do `p1` (szpic), normalna w górę-bok."""
    d = (p1 - p0).normalized()
    bok = Vector((-d.y, d.x, 0))
    if bok.length < 1e-6:
        bok = Vector((1, 0, 0))
    bok.normalize()
    n = (d.cross(bok).normalized() * 0.5 + Vector((0, 0, 0.8))).normalized()
    a = s.w(p0 - bok * szer / 2, kol0, n)
    b = s.w(p0 + bok * szer / 2, kol0, n)
    c = s.w(p1, kol1, n)
    s.f.append((a, b, c))
    s.f.append((b, a, c))   # obustronnie — wstęga widziana z obu stron


def bipiramida(s, c, os_, dl, r, kol):
    """Kłos / kwiat: dwie trójboczne piramidy złączone podstawą (6 trójkątów)."""
    d = os_.normalized()
    pom = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 1, 0))
    u = d.cross(pom).normalized()
    v = d.cross(u).normalized()
    gora = s.w(c + d * dl / 2, _mul(kol, 1.15), d)
    dol = s.w(c - d * dl / 2, _mul(kol, 0.8), -d)
    ring = []
    for j in range(3):
        a = math.tau * j / 3
        k = u * math.cos(a) + v * math.sin(a)
        ring.append(s.w(c + k * r, kol, k))
    for j in range(3):
        s.f.append((ring[j], ring[(j + 1) % 3], gora))
        s.f.append((ring[(j + 1) % 3], ring[j], dol))


def siatka_pola(rng, n):
    """`n` punktów w kafelku: siatka z drganiem (pole zasiane, nie posypane)."""
    bok = max(1, round(math.sqrt(n)))
    for i in range(bok):
        for j in range(bok):
            yield Vector(((i + 0.5 + rng.uniform(-0.4, 0.4)) / bok - 0.5,
                          (j + 0.5 + rng.uniform(-0.4, 0.4)) / bok - 0.5, 0)) * POLE_W


def pole(s, rng, g):
    t, H = g["typ"], g["H"]
    if t == "zboze":
        for p in siatka_pola(rng, g["n"]):
            h = H * rng.uniform(0.82, 1.0)
            wiatr = Vector((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), 0))
            szczyt = p + wiatr + Vector((0, 0, h))
            wstega(s, p, szczyt, 0.5, g["lodyga"][0], g["lodyga"][1])
            bipiramida(s, szczyt - Vector((0, 0, 0.6)) + wiatr * 0.2, Vector((0, 0, 1)) + wiatr * 0.4, 1.8, 0.38,
                       _mul(g["klos"], rng.uniform(0.9, 1.08)))
        return
    if t == "sciernisko":
        for p in siatka_pola(rng, g["n"]):
            wstega(s, p, p + Vector((rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), H * rng.uniform(0.6, 1.0))), 0.35,
                   (150, 124, 70), (204, 176, 104))
        for _ in range(6):   # pokos leżący w poprzek
            p = Vector((rng.uniform(-0.45, 0.45) * POLE_W, rng.uniform(-0.45, 0.45) * POLE_W, 0.12))
            a = rng.uniform(0, math.tau)
            wstega(s, p, p + Vector((math.cos(a) * 2.2, math.sin(a) * 2.2, 0.15)), 0.4, (176, 148, 84), (214, 188, 118))
        return
    if t == "len":
        for p in siatka_pola(rng, g["n"]):
            szczyt = p + Vector((rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), H * rng.uniform(0.8, 1.0)))
            wstega(s, p, szczyt, 0.3, (66, 108, 50), (104, 150, 70))
            bipiramida(s, szczyt, Vector((0, 0, 1)), 0.45, 0.42, _mix((92, 120, 210), (150, 170, 240), rng.uniform(0, 1)))
        return
    if t in ("nac", "cebula"):
        # rzędy wzdłuż X (bruzdy), w rzędzie kępy liści
        for ri in range(g["rzedy"]):
            y = ((ri + 0.5) / g["rzedy"] - 0.5) * POLE_W
            for ki in range(g["kepy"]):
                c = Vector((((ki + 0.5) / g["kepy"] - 0.5) * POLE_W + rng.uniform(-0.4, 0.4), y + rng.uniform(-0.3, 0.3), 0))
                for li in range(5 if t == "nac" else 4):
                    a = math.tau * li / 5 + rng.uniform(-0.4, 0.4)
                    rozch = 0.55 if t == "nac" else 0.18
                    kon = c + Vector((math.cos(a) * H * rozch, math.sin(a) * H * rozch, H * rng.uniform(0.75, 1.0)))
                    wstega(s, c, kon, 0.55 if t == "nac" else 0.3, g["kol"][0], g["kol"][1])
        return
    # kapusta: dwie główki w kaflu — główka (kula) + 4 rozchylone liście zewnętrzne
    for kx in (-0.22, 0.22):
        c = Vector((kx * POLE_W + rng.uniform(-0.3, 0.3), rng.uniform(-0.25, 0.25) * POLE_W, 0))
        r = g["r"] * rng.uniform(0.9, 1.1)
        baza, sciany = _kula(1.0, 1)
        start = len(s.v)
        for v in baza:
            s.w(c + Vector((v.x * r, v.y * r, r * 0.9 + v.z * r * 0.85)),
                _mix((96, 150, 80), (176, 210, 140), 0.5 + 0.5 * v.z), v)
        for f in sciany:
            s.f.append(tuple(start + i for i in f))
        for li in range(4):
            a = math.tau * li / 4 + rng.uniform(-0.3, 0.3)
            lisc(s, c + Vector((0, 0, 0.2)), a, r * 2.4, r * 1.5, (70, 124, 66), nachyl=0.35)


# ── zbiór ────────────────────────────────────────────────────────────────────
#: Kształtów na rodzaj — kamieni jest najwięcej i najbardziej widać ich klony.
KSZTALTY = {"krzew": 2, "kamien": 3, "ziolo": 2, "wodna": 3, "pniak": 1, "drewno": 1, "inne": 1, "trawa": 3, "wies": 1, "kuznia": 1, "pole": 3, "encja": 1}
WARIANTY = (
    [(n, "krzew", g) for n, g in KRZEWY.items()]
    + [(n, "kamien", g) for n, g in KAMIENIE.items()]
    + [(f"ziolo_{n}", "ziolo", g) for n, g in ZIOLA.items()]
    + [(n, "wodna", g) for n, g in WODNA.items()]
    + [(n, "pniak", g) for n, g in PNIAKI.items()]
    + [(n, "drewno", g) for n, g in DREWNIANE.items()]
    + [(n, "trawa" if g["typ"] == "trawa" else "inne", g) for n, g in INNE.items()]
    + [(n, "wies", g) for n, g in WIES.items()]
    + [(n, "kuznia", g) for n, g in KUZNIA.items()]
    + [(n, "pole", g) for n, g in POLE.items()]
    + [(n, "encja", g) for n, g in ENCJE.items()]
)
BUDOWNICZY = {"krzew": krzew, "kamien": kamien, "ziolo": ziolo, "wodna": wodna, "pniak": pniak,
              "drewno": drewniane, "inne": inne, "trawa": inne, "wies": wies, "kuznia": kuznia, "pole": pole, "encja": encja}


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mat = material()
    bledy, obiekty = [], []
    print(f"{'kształt':30} {'wys j':>6} {'szer j':>6} {'trójk.':>6}")
    for k, (baza, rodzaj, g) in enumerate(WARIANTY):
        for v in range(KSZTALTY[rodzaj]):
            nazwa = baza if v == 0 else f"{baza}_{v + 1}"
            s = Siatka()
            BUDOWNICZY[rodzaj](s, random.Random(5000 + 37 * k + v), g)
            zs = [p.z for p in s.v]
            wys = max(zs)
            szer = 2 * max(math.hypot(p.x, p.y) for p in s.v)
            tr = s.trojkaty()
            print(f"{nazwa:30} {wys:6.1f} {szer:6.1f} {tr:6d}")
            cel = g["H"]
            if not (0.7 * cel <= wys <= 1.35 * cel):
                bledy.append(f"{nazwa}: wysokość {wys:.1f} j. poza 70–135% celu {cel}")
            if min(zs) < -0.6 and not g.get("wokol_osi"):
                bledy.append(f"{nazwa}: schodzi {min(zs):.2f} j. pod grunt")
            budzet = g.get("budzet", MAX_TROJKATOW)
            if tr > budzet:
                bledy.append(f"{nazwa}: {tr} trójkątów > budżet {budzet}")
            obiekty.append(do_blendera(nazwa, s, mat))
    for b in bledy:
        print("BŁĄD", b)
    print(f"kształtów: {len(obiekty)} · bramka:", "CZERWONA" if bledy else "zielona")
    if ZAPISZ:
        if bledy:
            raise SystemExit("[zapis] ODMOWA — bramka czerwona")
        for o in bpy.context.scene.objects:
            o.select_set(o in obiekty)
        bpy.ops.export_scene.gltf(
            filepath=CEL, export_format="GLB", use_selection=True, export_yup=True,
            export_animations=False, export_skins=False, export_morph=False,
            export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_apply=False,
            export_meshopt_compression_enable=True)   # ⚠ loader potrzebuje MeshoptDecoder
        print(f"[zapis] {CEL} {os.path.getsize(CEL)} bajtów")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: -- --zapisz")


if __name__ == "__main__":
    main()

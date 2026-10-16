"""Pająki 3D — sieciarz i skoczek jadowity, na RDZENIU `tools/quad3d.py`.

    blender -b --python tools/spider3d.py                 # przymiar obu: render + raport
    blender -b --python tools/spider3d.py -- --zapisz     # + animals/spider.glb, animals/venomspider.glb

Rdzeń daje scenę, szkielet z lustrem, siatkę z wagami, kolory, bramkę gruntu,
podgląd i eksport; ten plik podaje WŁASNE ciało (`cialo`) i WŁASNE klipy
(`zbuduj_klipy`), bo ośmionóg nie ma kręgosłupa czworonoga.

Proporcje z POMIARU modelu referencyjnego (2026-10-04): głowotułów ~2,0 j.
i odwłok ~2,6 j. przy ciele 4,6 j., odwłok wyższy i szerszy, cztery pary łap
przyczepione wzdłuż głowotułowia, rozpiętość ~2,4 długości ciała. ⚠ Ciało
OBNIŻONE względem referencji (tam brzuch ~4,8 j. nad gruntem) — pająk ma się
zmieścić w kadrze 128×96 i czytać z kamery 15°, nie stać na szczudłach.
Chód: naprzemienne CZWÓRKI łap (L1-P2-L3-P4 / P1-L2-P3-L4) — wzór pająków.
Kolory: placeholdery `makeSpiderPlaceholder` / `makeVenomSpiderPlaceholder`.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import quad3d as Q  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

PROFIL = [  # (y, z_góra, z_dół, pół_szerokości): przód głowotułowia (−Y) → kądziołki
    (-2.40, 2.70, 2.40, 0.30),
    (-2.25, 2.95, 2.15, 0.62),
    (-1.95, 3.08, 2.02, 0.85),
    (-1.60, 3.12, 2.00, 0.95),
    (-1.20, 3.10, 2.02, 0.95),
    (-0.80, 3.00, 2.08, 0.85),
    (-0.45, 2.80, 2.25, 0.55),
    (-0.25, 2.80, 2.35, 0.35),   # stylik (przewężenie)
    (-0.05, 3.15, 2.20, 0.75),
    (0.30, 3.70, 2.00, 1.10),
    (0.70, 4.00, 1.95, 1.25),
    (1.10, 4.10, 1.98, 1.30),    # odwłok — najszerszy
    (1.50, 4.05, 2.05, 1.25),
    (1.90, 3.85, 2.20, 1.10),
    (2.25, 3.50, 2.45, 0.85),
    (2.55, 3.10, 2.70, 0.45),
    (2.70, 2.85, 2.80, 0.15),    # kądziołki
]
GRANICA_ODWLOKA = -0.30          # y: przód = `body`, tył = `abdomen`

#: Łapy: przyczep (y na głowotułowiu), kąt rozstawu od przodu (°), zasięg (j.)
LAPY = [(-2.05, 32.0, 3.7), (-1.70, 72.0, 3.4), (-1.35, 112.0, 3.4), (-1.00, 150.0, 3.9)]
PRZYCZEP_X, PRZYCZEP_Z = 0.78, 2.30
KOLANO_WYS = 1.45                # kolano ponad przyczepem — „łuk" łapy pająka
STAW_WYS = 0.85                  # staw nad końcówką (stopa prawie pionowo)
KONCOWKA_Z = 0.06


def _lapa(i):
    """(przyczep A, kolano K, staw Q, końcówka T) w spoczynku — strona L (+x)."""
    y, kat, zasieg = LAPY[i]
    d = Vector((math.sin(math.radians(kat)), -math.cos(math.radians(kat)), 0.0))
    A = Vector((PRZYCZEP_X, y, PRZYCZEP_Z))
    T = A + d * zasieg
    T.z = KONCOWKA_Z
    K = A + d * (zasieg * 0.36) + Vector((0, 0, KOLANO_WYS))
    Q_ = T + Vector((0, 0, STAW_WYS)) - d * 0.35
    return A, K, Q_, T


def _kosci():
    k = {
        "root":    ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0), None),
        "body":    ((0.0, -0.40, 2.55), (0.0, -2.30, 2.55), "root"),
        "abdomen": ((0.0, -0.30, 2.70), (0.0, 2.65, 3.20), "body"),
        "fang.L":  ((0.18, -2.30, 2.40), (0.12, -2.48, 1.78), "body"),
        "palp1.L": ((0.35, -2.20, 2.25), (0.50, -2.75, 2.15), "body"),
        "palp2.L": ((0.50, -2.75, 2.15), (0.42, -3.05, 1.75), "palp1.L"),
    }
    for i in range(4):
        A, K, Q_, T = _lapa(i)
        k[f"leg{i}a.L"] = (tuple(A), tuple(K), "body")
        k[f"leg{i}b.L"] = (tuple(K), tuple(Q_), f"leg{i}a.L")
        k[f"leg{i}c.L"] = (tuple(Q_), tuple(T), f"leg{i}b.L")
    return k


KOSCI = _kosci()


def _gatunek(nazwa, tag, plik, rampa, klipy_wlasne, podglad):
    def cialo():
        return _cialo(rampa)

    def zbuduj_klipy(arm, mesh):
        return _klipy(arm, mesh, klipy_wlasne)

    return Q.Gatunek(
        NAZWA=nazwa, TAG=tag, ENV_PODGLAD=tag.upper() + "_PODGLAD",
        CEL=os.path.join(Q.ROOT, "public", "assets", "animals", plik),
        KOSCI=KOSCI, cialo=cialo, zbuduj_klipy=zbuduj_klipy,
        KLIPY_PODGLADU=podglad, KADR_PODGLADU=11.0, SRODEK_PODGLADU=2.0,
    )


# ════════════════════════════════════════════════════════════════════════════
# CIAŁO
# ════════════════════════════════════════════════════════════════════════════
def _pierscien(b, y, zg, zd, hw, n, kol, strefy, rampa):
    zc, rz = (zg + zd) / 2.0, (zg - zd) / 2.0
    idx = []
    for i in range(n):
        th = 2.0 * math.pi * i / n
        x, z = hw * math.sin(th), zc + rz * math.cos(th)
        idx.append(len(b.verts)); b.verts.append(Vector((x, y, z))); b.wagi.append({})
        # wzór odwłoka: jaśniejszy pas wzdłuż grzbietu (sieciarz) / plamy (skoczek)
        c = kol
        if y > GRANICA_ODWLOKA and math.cos(th) > 0.55 and rampa.get("WZOR") is not None:
            if rampa["WZOR_PASY"] and int((y + 3.0) / 0.42) % 2 == 0:
                c = rampa["WZOR"]
            elif not rampa["WZOR_PASY"] and abs(math.sin(th)) < 0.35:
                c = rampa["WZOR"]
        strefy.append(c)
    s = max(0.0, min(1.0, (y - (GRANICA_ODWLOKA - 0.15)) / 0.30))
    b.waga(idx, {"body": 1.0 - s, "abdomen": s} if 0 < s < 1 else ({"abdomen": 1.0} if s >= 1 else {"body": 1.0}))
    return idx


def _cialo(rampa):
    b = Q.Budowniczy()
    strefy = []
    ringi = []
    for y, zg, zd, hw in PROFIL:
        kol = rampa["GLOWOTULOW"] if y <= GRANICA_ODWLOKA else rampa["ODWLOK"]
        ringi.append(_pierscien(b, y, zg, zd, hw, 16, kol, strefy, rampa))
    for i in range(len(ringi) - 1):
        b.most(ringi[i], ringi[i + 1], zamknij=True)
    y0, zg, zd, _ = PROFIL[0]
    Q._czapka(b, ringi[0], Vector((0, y0 - 0.06, (zg + zd) / 2)), zamknij=True, odwroc=True)
    strefy.append(rampa["GLOWOTULOW"])
    y1, zg, zd, _ = PROFIL[-1]
    Q._czapka(b, ringi[-1], Vector((0, y1 + 0.05, (zg + zd) / 2)), zamknij=True)
    strefy.append(rampa["ODWLOK"])

    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        lustro = lambda v: Vector((v.x * strona, v.y, v.z))
        # łapy: udo (gruba) → goleń → stopa; pasy na stawach
        for i in range(4):
            A, K, Q_, T = (lustro(v) for v in _lapa(i))
            sciezka = [
                (A, 0.17, {"body": 0.5, f"leg{i}a{sfx}": 0.5}),
                (A.lerp(K, 0.55), 0.15, {f"leg{i}a{sfx}": 1.0}),
                (K, 0.14, {f"leg{i}a{sfx}": 0.5, f"leg{i}b{sfx}": 0.5}),
                (K.lerp(Q_, 0.5), 0.11, {f"leg{i}b{sfx}": 1.0}),
                (Q_, 0.09, {f"leg{i}b{sfx}": 0.5, f"leg{i}c{sfx}": 0.5}),
                (Q_.lerp(T, 0.6), 0.07, {f"leg{i}c{sfx}": 1.0}),
                (T + Vector((0, 0, 0.02)), 0.04, {f"leg{i}c{sfx}": 1.0}),
            ]
            nr = Q._rura(b, [(p, r, r, w) for p, r, w in sciezka], 7)
            for k, ring in enumerate(nr):
                strefy.extend([rampa["STAW"] if k in (2, 4) else rampa["LAPA"]] * len(ring))
            Q._czapka(b, nr[-1], T + Vector((0, 0, -0.02)), zamknij=True)
            strefy.append(rampa["LAPA"])
        # szczękoczułki (kły) i nogogłaszczki
        h, t, _ = KOSCI["fang.L"]
        h, t = lustro(Vector(h)), lustro(Vector(t))
        nr = Q._rura(b, [(h, 0.15, 0.15, {"fang" + sfx: 1.0}), (h.lerp(t, 0.6), 0.11, 0.11, {"fang" + sfx: 1.0}),
                         (t, 0.04, 0.04, {"fang" + sfx: 1.0})], 7)
        for ring in nr:
            strefy.extend([rampa["KIEL"]] * len(ring))
        Q._czapka(b, nr[-1], t + Vector((0, 0, -0.03)), zamknij=True)
        strefy.append(rampa["KIEL"])
        p1h, p1t, _ = KOSCI["palp1.L"]
        _, p2t, _ = KOSCI["palp2.L"]
        p1h, p1t, p2t = (lustro(Vector(v)) for v in (p1h, p1t, p2t))
        nr = Q._rura(b, [(p1h, 0.09, 0.09, {"palp1" + sfx: 1.0}), (p1t, 0.08, 0.08, {"palp1" + sfx: 0.5, "palp2" + sfx: 0.5}),
                         (p2t, 0.06, 0.06, {"palp2" + sfx: 1.0})], 6)
        for ring in nr:
            strefy.extend([rampa["LAPA"]] * len(ring))
        Q._czapka(b, nr[-1], p2t + Vector((0, -0.02, -0.04)), zamknij=True)
        strefy.append(rampa["LAPA"])
        # oczy: dwa duże z przodu + dwie mniejsze pary — jasne, czytelne z daleka
        for (ox, oy, oz), r in (((0.22, -2.33, 2.80), 0.14), ((0.46, -2.18, 2.92), 0.09), ((0.22, -2.02, 3.05), 0.08)):
            c = Vector((ox * strona, oy, oz))
            nrm = (c - Vector((0, -1.5, 2.55))).normalized()
            a = nrm.cross(Vector((0, 0, 1))).normalized()
            bb = nrm.cross(a).normalized()
            ring = b.ring(c, (a, bb), (r, r), 8)
            b.waga(ring, {"body": 1.0})
            strefy.extend([rampa["OKO"]] * len(ring))
            Q._czapka(b, ring, c + nrm * r * 0.6, zamknij=True, odwroc=strona < 0)
            strefy.append(rampa["OKO"])
    assert len(strefy) == len(b.verts)
    return b, strefy


# ════════════════════════════════════════════════════════════════════════════
# KLIPY
# ════════════════════════════════════════════════════════════════════════════
GRUPA_A = ("leg0.L", "leg1.R", "leg2.L", "leg3.R")      # naprzemienne czwórki
CHODY = {
    "Walk": dict(n=16, krok=1.2, lift=0.65, duty=0.55),
    "Run":  dict(n=10, krok=1.6, lift=0.75, duty=0.50),
}


def _ik_lapy(arm, i, sfx, T):
    """Łapa: końcówka w T, staw nad nią, dwukościowe IK z kolanem W GÓRĘ."""
    A = arm.pose.bones[f"leg{i}a{sfx}"].head.copy()
    d = Vector((T.x - A.x, T.y - A.y, 0.0))
    d = d.normalized() if d.length > 1e-6 else Vector((1, 0, 0))
    Qp = T + Vector((0, 0, STAW_WYS)) - d * 0.35
    l1 = (Vector(KOSCI[f"leg{i}a.L"][1]) - Vector(KOSCI[f"leg{i}a.L"][0])).length
    l2 = (Vector(KOSCI[f"leg{i}b.L"][1]) - Vector(KOSCI[f"leg{i}b.L"][0])).length
    v = Qp - A
    dist = min(v.length, l1 + l2 - 1e-4)
    vn = v.normalized()
    n = vn.cross(Vector((0, 0, 1)))
    n = n.normalized() if n.length > 1e-6 else Vector((1, 0, 0))
    a = math.acos(max(-1.0, min(1.0, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))))
    kand = [A + (Matrix.Rotation(s * a, 3, n) @ vn) * l1 for s in (1, -1)]
    K = max(kand, key=lambda p: p.z)
    Q._celuj(arm, f"leg{i}a{sfx}", K)
    Q._celuj(arm, f"leg{i}b{sfx}", Qp)
    Q._celuj(arm, f"leg{i}c{sfx}", T)
    return (arm.pose.bones[f"leg{i}b{sfx}"].tail - Qp).length


def _koncowka(i, sfx):
    _A, _K, _Q, T = _lapa(i)
    return Vector((T.x if sfx == ".L" else -T.x, T.y, T.z))


def _cialo_poza(arm, z=0.0, y=0.0, pochyl=0.0, przechyl=0.0, odwlok=0.0, kly=0.0, palpy=0.0):
    """Ciało: wysokość, wysunięcie, pochylenie przodu (+ = przód w górę),
    przechył, odwłok (+ = koniec w górę), kły (+ = rozwarte), nogogłaszczki."""
    pb = arm.pose.bones["root"]
    M = pb.matrix.copy()
    M.translation += Vector((0, y, z))
    pb.matrix = M
    Q._upd()
    Q._obroc(arm, "body", "X", -pochyl)
    Q._obroc(arm, "body", "Y", przechyl)
    Q._obroc(arm, "abdomen", "X", odwlok)
    for s in (".L", ".R"):
        Q._obroc(arm, "fang" + s, "Z", kly * (1 if s == ".L" else -1))
        Q._obroc(arm, "palp1" + s, "X", palpy)


def _lapy(arm, przesun=None):
    """Wszystkie łapy na ziemi w spoczynku albo przesunięte: {klucz: Vector}."""
    e = 0.0
    for i in range(4):
        for sfx in (".L", ".R"):
            T = _koncowka(i, sfx)
            klucz = f"leg{i}{sfx}"
            if przesun and klucz in przesun:
                T = T + przesun[klucz]
            e = max(e, _ik_lapy(arm, i, sfx, T))
    return e


def klip_chod(arm, nazwa, ch):
    a = Q._nowa_akcja(arm, nazwa)
    n = ch["n"]
    e = 0.0
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=0.05 * math.cos(4 * math.pi * t), przechyl=1.5 * math.sin(2 * math.pi * t),
                    odwlok=2.0 * math.sin(2 * math.pi * t), palpy=6.0 * math.sin(4 * math.pi * t))
        przes = {}
        for i in range(4):
            for sfx in (".L", ".R"):
                klucz = f"leg{i}{sfx}"
                faza = (t + (0.0 if klucz in GRUPA_A else 0.5)) % 1.0
                if faza < ch["duty"]:
                    s = faza / ch["duty"]
                    przes[klucz] = Vector((0, -ch["krok"] / 2 + ch["krok"] * s, 0))
                else:
                    s = (faza - ch["duty"]) / (1 - ch["duty"])
                    g = Q._ease(s)
                    przes[klucz] = Vector((0, ch["krok"] / 2 - ch["krok"] * g, ch["lift"] * math.sin(math.pi * s)))
        e = max(e, _lapy(arm, przes))
        Q._klucz(arm, f)
    Q._liniowo(a)
    return e


def klip_bezruch(arm):
    a = Q._nowa_akcja(arm, "Idle")
    n = 40
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=0.03 * math.sin(2 * math.pi * t), odwlok=2.5 * math.sin(2 * math.pi * t),
                    palpy=10.0 * max(0.0, math.sin(2 * math.pi * 3 * t)) if t > 0.6 else 0.0)
        _lapy(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_dzwig(arm):
    """SIECIARZ — zamach przed strzałem: przód w górę, przednie łapy uniesione,
    odwłok podwinięty kądziołkami do przodu (tam „celuje")."""
    a = Q._nowa_akcja(arm, "Rear")
    n = 16
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=0.35, pochyl=16.0, odwlok=-30.0 + 3.0 * math.sin(2 * math.pi * 2 * t), palpy=-15.0)
        _lapy(arm, {"leg0.L": Vector((0.3, -0.4, 1.2)), "leg0.R": Vector((-0.3, -0.4, 1.2)),
                    "leg1.L": Vector((0.0, 0.0, 0.4)), "leg1.R": Vector((0.0, 0.0, 0.4))})
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_strzal(arm):
    """SIECIARZ — strzał: szarpnięcie odwłokiem i ciałem do przodu."""
    a = Q._nowa_akcja(arm, "Shoot")
    n = 8
    for f in range(n + 1):
        t = f / n
        k = math.sin(math.pi * min(1.0, t / 0.5)) if t < 0.5 else 0.0
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=0.35 * (1 - t), y=-0.35 * k, pochyl=16.0 * (1 - t) - 6.0 * k, odwlok=-30.0 * (1 - t) - 15.0 * k)
        _lapy(arm)
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_grozba(arm):
    """SKOCZEK — telegraf: przednie DWIE pary łap wysoko i szeroko, ciało do
    tyłu, kły rozwarte („committed once the legs are up" — `VenomSpider`)."""
    a = Q._nowa_akcja(arm, "Threat")
    n = 12
    for f in range(n + 1):
        t = (f % n) / n
        w = 0.15 * math.sin(2 * math.pi * 2 * t)
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=0.30, y=0.35, pochyl=20.0, odwlok=8.0, kly=25.0)
        _lapy(arm, {"leg0.L": Vector((0.5, -0.2, 2.0 + w)), "leg0.R": Vector((-0.5, -0.2, 2.0 + w)),
                    "leg1.L": Vector((0.4, 0.2, 1.2 - w)), "leg1.R": Vector((-0.4, 0.2, 1.2 - w))})
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_ukaszenie(arm):
    """SKOCZEK — ukąszenie: wypad do przodu i w dół, łapy uderzają w ziemię."""
    a = Q._nowa_akcja(arm, "Bite")
    n = 8
    for f in range(n + 1):
        t = f / n
        k = math.sin(math.pi * min(1.0, t / 0.55)) if t < 0.55 else 0.0
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=0.30 * (1 - t) - 0.25 * k, y=0.35 * (1 - t) - 0.75 * k, pochyl=20.0 * (1 - t) - 14.0 * k,
                    kly=25.0 * (1 - k))
        _lapy(arm, {"leg0.L": Vector((0.2, -0.7 * k, 0.0)), "leg0.R": Vector((-0.2, -0.7 * k, 0.0))})
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_trafienie(arm):
    a = Q._nowa_akcja(arm, "Hit")
    n = 10
    for f in range(n + 1):
        t = f / n
        k = math.sin(math.pi * min(1.0, t / 0.6)) if t < 0.6 else 0.0
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, y=0.30 * k, pochyl=10.0 * k, odwlok=-8.0 * k)
        _lapy(arm, {f"leg{i}{s}": Vector((0, 0, 0.35 * k)) for i in (0, 1) for s in (".L", ".R")})
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_ogluszenie(arm):
    a = Q._nowa_akcja(arm, "Stunned")
    n = 24
    for f in range(n + 1):
        t = (f % n) / n
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=-0.35, przechyl=6.0 * math.sin(2 * math.pi * t), odwlok=-5.0)
        _lapy(arm, {f"leg{i}{s}": Vector((0, 0, 0.12 * max(0.0, math.sin(2 * math.pi * (3 * t + i * 0.25)))))
                    for i in range(4) for s in (".L", ".R")})
        Q._klucz(arm, f)
    Q._liniowo(a)


def klip_smierc(arm, mesh):
    """Łapy podkurczają się pod ciało, pająk przewraca się NA GRZBIET —
    sylwetka martwego pająka czytelna z każdej strony."""
    a = Q._nowa_akcja(arm, "Death")
    n = 24
    for f in range(n + 1):
        t = f / n
        sk = Q._ease(t / 0.6)
        prz = Q._ease((t - 0.25) / 0.6)
        Q._reset(arm); Q._upd()
        _cialo_poza(arm, z=-0.6 * sk, odwlok=-10.0 * sk)
        # końcówki zbliżają się do brzucha w UKŁADZIE CIAŁA (przed przewrotem)
        przes = {}
        for i in range(4):
            for sfx in (".L", ".R"):
                T = _koncowka(i, sfx)
                A = Vector(KOSCI[f"leg{i}a.L"][0]); A.x *= (1 if sfx == ".L" else -1)
                cel = A + (T - A) * 0.30 + Vector((0, 0, 0.6))
                przes[f"leg{i}{sfx}"] = (cel - T) * sk
        _lapy(arm, przes)
        Q._obroc(arm, "root", "Y", 175.0 * prz)
        zmin = min(p.z for p in Q.bryla_swiat(mesh))
        root = arm.pose.bones["root"]
        M = root.matrix.copy(); M.translation.z -= zmin; root.matrix = M
        Q._upd()
        Q._klucz(arm, f)
    Q._liniowo(a)


def _klipy(arm, mesh, wlasne):
    raport = {}
    for nazwa, ch in CHODY.items():
        raport[nazwa] = klip_chod(arm, nazwa, ch)
    klip_bezruch(arm)
    for fn in wlasne:
        fn(arm)
    klip_trafienie(arm)
    klip_ogluszenie(arm)
    klip_smierc(arm, mesh)
    Q._reset(arm)
    arm.animation_data.action = Q.bpy.data.actions["Idle"]
    return raport


# ── kolory (sRGB) z placeholderów; ×0,9 jak reszta (światło gry rozjaśnia) ──
def _r(d):
    return {k: (v if not isinstance(v, tuple) or k == "OKO" else tuple(round(c * 0.9) for c in v)) for k, v in d.items()}


SIECIARZ = _r(dict(GLOWOTULOW=(74, 66, 82), ODWLOK=(58, 51, 64), WZOR=(110, 100, 120), WZOR_PASY=True,
                   LAPA=(66, 58, 74), STAW=(110, 100, 120), KIEL=(30, 26, 34), OKO=(207, 232, 160)))
# ⚠ Skoczek NIE w oliwkowej zieleni placeholdera — na trawie zlewał się z tłem
# (render). Barwy OSTRZEGAWCZE: ochra z żółtymi plamami — odcina się od trawy
# i od fioletowoszarego sieciarza, a dalej mówi „jadowity".
SKOCZEK = _r(dict(GLOWOTULOW=(78, 58, 34), ODWLOK=(122, 90, 38), WZOR=(220, 192, 70), WZOR_PASY=False,
                  LAPA=(78, 58, 34), STAW=(200, 170, 70), KIEL=(40, 30, 20), OKO=(232, 240, 192)))

PAJAK = _gatunek("Spider", "sieciarz", "spider.glb", SIECIARZ, (klip_dzwig, klip_strzal),
                 ("Idle", "Walk", "Run", "Rear", "Shoot", "Hit", "Stunned", "Death"))
SKOCZEK_JAD = _gatunek("VenomSpider", "skoczek", "venomspider.glb", SKOCZEK, (klip_grozba, klip_ukaszenie),
                       ("Idle", "Walk", "Run", "Threat", "Bite", "Hit", "Stunned", "Death"))

if __name__ == "__main__":
    Q.glowny(PAJAK)
    Q.glowny(SKOCZEK_JAD)

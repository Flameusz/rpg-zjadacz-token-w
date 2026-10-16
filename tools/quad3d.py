"""RDZEŃ generatora czworonogów 3D — bryła, szkielet, strefy, lokomocja, bramki, eksport.

Gatunek to DANE (`Gatunek` niżej), nie kod: `tools/boar3d.py`, `tools/wolf3d.py`.
Ten moduł nie zna żadnego gatunku — dostaje go przez `uzyj(g)`.

Metoda jak w bazie postaci (`char3d_base.py`): ciało z PIERŚCIENI (`Budowniczy`,
`_rura`), wagi kości przypisywane pierścieniom, kolor z KOLORÓW WIERZCHOŁKÓW
stref; scena budowana od zera — źródłem jest skrypt gatunku, nie `.blend`.

Konwencje projektu: pysk w −Y (po `export_yup` → +Z, jak gracz), łapy na z = 0,
jednostki POSTACI (12,80 j. = 1,85 m), szkielet z transformem jednostkowym.

Nogi w klipach: tor PĘCINY (cel) → staw nadgarstka/skokowy z kąta śródręcza →
dwukościowe IK (łokieć w TYŁ, kolano w PRZÓD) → każda kość obracana tak, żeby
jej ogon trafił w policzony punkt (`_celuj`).

⚠ Dowód „rdzeń nie zmienił dzika" (2026-10-03): zrzut wierzchołków, kości,
kolorów i póz w 30 klatkach przed/po wydzieleniu — identyczny.
"""
import math
import os
import sys
import tempfile

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from char3d_base import Budowniczy, _rura, _czapka  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ZAPISZ = "--zapisz" in argv
TYLKO_BRYLA = "--bryla" in argv
FPS = 24

NOGI = {  # klucz: (strona, przód?)
    "LP": (".L", True), "PP": (".R", True), "LT": (".L", False), "PT": (".R", False),
}
#: Łańcuch kręgosłupa od pyska do zadu — granice wag tułowia biorą się z głów
#: tych kości (`_waga_tulowia`).
KREGOSLUP = ("snout", "head", "neck", "chest", "spine", "pelvis")


class Gatunek:
    """Worek danych gatunku. Wszystkie pola wypełnia skrypt gatunku."""

    def __init__(self, **kw):
        self.__dict__.update(kw)


G = None
SZ = None
GDZIE = {}


def uzyj(g):
    global G, SZ
    G = g
    SZ = _szkielet()


def _lustro(nazwa):
    return nazwa.replace(".L", ".R")


def _szkielet():
    """Wszystkie kości (L + lustro R) → {nazwa: (głowa, ogon, rodzic)}."""
    out = {}
    for n, (h, t, p) in G.KOSCI.items():
        out[n] = (Vector(h), Vector(t), p)
        if n.endswith(".L"):
            out[_lustro(n)] = (Vector((-h[0], h[1], h[2])), Vector((-t[0], t[1], t[2])),
                               _lustro(p) if p and p.endswith(".L") else p)
    return out


def _waga_tulowia(y):
    """Wagi kręgosłupa wzdłuż y — przejścia łagodne na granicach odcinków.
    Granica odcinka = głowa kości (pysk zaczyna się tam, gdzie kończy łeb)."""
    granice = [G.KOSCI[n][0][1] for n in KREGOSLUP[:-1]]
    odcinki = [(n, granice[i - 1] if i > 0 else None, granice[i] if i < len(granice) else None)
               for i, n in enumerate(KREGOSLUP)]
    w = {}
    pas = 0.35
    for n, a, b in odcinki:
        lo = max(0.0, min(1.0, (y - (a - pas)) / (2 * pas))) if a is not None else 1.0
        hi = max(0.0, min(1.0, ((b + pas) - y) / (2 * pas))) if b is not None else 1.0
        v = min(lo, hi)
        if v > 0:
            w[n] = v
    s = sum(w.values())
    return {k: v / s for k, v in w.items()}


def _pierscien_tulowia(b, y, zg, zd, hw, strefy):
    """Pełny pierścień przekroju: superelipsa + podniesiona grzywa na szczycie."""
    zc, rz = (zg + zd) / 2.0, (zg - zd) / 2.0
    e = 2.0 / G.SUPERELIPSA
    idx = []
    for i in range(G.N_TUL):
        th = 2.0 * math.pi * i / G.N_TUL          # 0 = szczyt grzbietu
        s, c = math.sin(th), math.cos(th)
        x = hw * math.copysign(abs(s) ** e, s)
        z = zc + rz * math.copysign(abs(c) ** e, c)
        grzywa = G.GRZYWA_Y[0] <= y <= G.GRZYWA_Y[1] and min(th, 2 * math.pi - th) < G.GRZYWA_KAT
        if grzywa:
            k = 1.0 - min(th, 2 * math.pi - th) / G.GRZYWA_KAT
            z += G.GRZYWA_WYS * k
        idx.append(len(b.verts))
        b.verts.append(Vector((x, y, z)))
        b.wagi.append({})
        kol = G.KOLOR_GRZYWY if grzywa else (G.KOLOR_PYSKA if y < G.PYSK_DO_Y else G.KOLOR_FUTRA)
        # Jaśniejszy SPÓD (pierś, brzuch, podgardle) — opcjonalny; dzik go nie ma.
        brzuch = getattr(G, "BRZUCH_KAT", 0.0)
        if brzuch and abs(th - math.pi) < brzuch and not grzywa:
            kol = G.KOLOR_BRZUCHA
        strefy.append(kol)
    b.waga(idx, _waga_tulowia(y))
    return idx


def _cialo():
    b = Budowniczy()
    strefy = []
    ringi = [_pierscien_tulowia(b, y, zg, zd, hw, strefy) for y, zg, zd, hw in G.PROFIL]
    for i in range(len(ringi) - 1):
        b.most(ringi[i], ringi[i + 1], zamknij=True)
    # czubek pyska (ciemny) i koniec zadu
    y0, zg, zd, _hw = G.PROFIL[0]
    _czapka(b, ringi[0], Vector((0.0, y0 - 0.06, (zg + zd) / 2)), zamknij=True, odwroc=True)
    strefy.append(G.KOLOR_CZUBKA)
    for i in ringi[0]:
        strefy[i] = G.KOLOR_CZUBKA
    y1, zg, zd, _hw = G.PROFIL[-1]
    _czapka(b, ringi[-1], Vector((0.0, y1 + 0.10, (zg + zd) / 2)), zamknij=True)
    strefy.append(G.KOLOR_FUTRA)

    # nogi
    for strona in (1.0, -1.0):
        sfx = ".L" if strona > 0 else ".R"
        for tabela, kosci, korzen in ((G.NOGA_PRZOD, ("upper_f", "fore_f", "fore_f", "cannon_f", "hoof_f", "hoof_f", "hoof_f"), "chest"),
                                      (G.NOGA_TYL, ("thigh_h", "shank_h", "shank_h", "cannon_h", "hoof_h", "hoof_h", "hoof_h"), "pelvis")):
            sciezka = []
            for k, ((x, y, z), r) in enumerate(tabela):
                kn = kosci[k] + sfx
                wagi = {korzen: 0.5, kn: 0.5} if k == 0 else {kn: 1.0}
                sciezka.append((Vector((x * strona, y, z)), r, r, wagi))
            n0 = len(b.verts)
            nr = _rura(b, sciezka, G.N_NOGA)
            for k, ring in enumerate(nr):
                kol = G.KOLOR_FUTRA if k < 2 else (G.KOLOR_NOGI if k < 5 else G.KOLOR_STOPY)
                strefy.extend([kol] * len(ring))
            assert len(strefy) == len(b.verts), (len(strefy), len(b.verts), n0)
            _czapka(b, nr[-1], sciezka[-1][0] + Vector((0, 0, -0.02)), zamknij=True)
            strefy.append(G.KOLOR_STOPY)
            _czapka(b, nr[0], sciezka[0][0] + Vector((0, 0, 0.25)), zamknij=True, odwroc=True)
            strefy.append(G.KOLOR_FUTRA)

    # uszy: blaszka (trójkąt + krawędź) LICEM DO PRZODU i na zewnątrz.
    # Gatunek z uszami Z BRYŁĄ (królik) wyłącza blaszkę i robi je w `dodatki`.
    for strona in ((1.0, -1.0) if getattr(G, "UCHO_BLASZKA", True) else ()):
        sfx = ".L" if strona > 0 else ".R"
        h, t, _p = G.KOSCI["ear.L"]
        h, t = Vector((h[0] * strona, h[1], h[2])), Vector((t[0] * strona, t[1], t[2]))
        lico = Vector((strona * G.UCHO_LICO[0], G.UCHO_LICO[1], G.UCHO_LICO[2])).normalized()
        bok = (t - h).cross(lico).normalized() * G.UCHO_POL_SZER
        pts = [h - bok, h + bok, t, h + lico * 0.10 + Vector((0, 0, -0.10))]
        idx = []
        for p in pts:
            idx.append(len(b.verts)); b.verts.append(p); b.wagi.append({"ear" + sfx: 1.0}); strefy.append(G.KOLOR_UCHA)
        b.faces += [(idx[0], idx[1], idx[2]), (idx[1], idx[3], idx[2]), (idx[3], idx[0], idx[2])]

    # dodatki gatunku (kły dzika, grzywa wilka…) — PRZED oczami: kolejność
    # wierzchołków jest częścią dowodu „rdzeń nie zmienił dzika"
    if G.dodatki:
        G.dodatki(b, strefy)

    # oczy: małe ciemne soczewki na boku łba
    for strona in (1.0, -1.0):
        ox, oy, oz = G.OKO
        c = Vector((strona * ox, oy, oz))
        nrm = Vector((strona, G.OKO_NORMALNA[0], G.OKO_NORMALNA[1])).normalized()
        a = nrm.cross(Vector((0, 0, 1))).normalized()
        bb = nrm.cross(a).normalized()
        ring = b.ring(c + nrm * 0.02, (a, bb), G.OKO_PROMIEN, 8)
        b.waga(ring, {"head": 1.0})
        strefy.extend([G.KOLOR_OKA] * len(ring))
        _czapka(b, ring, c + nrm * 0.06, zamknij=True, odwroc=strona < 0)
        strefy.append(G.KOLOR_OKA)

    # ogon
    sciezka = [(Vector(p), r, r, w) for p, r, w in G.ogon_sciezka()]
    nr = _rura(b, sciezka, G.N_OGON)
    # Opcjonalna KOŃCÓWKA ogona w innym kolorze (lis: biała kita) — (kolor,
    # liczba ostatnich pierścieni). Brak pola = cały ogon jednym kolorem.
    koncowka = getattr(G, "OGON_KONCOWKA", None)
    for k, ring in enumerate(nr):
        kol = koncowka[0] if koncowka and k >= len(nr) - koncowka[1] else G.KOLOR_OGONA
        strefy.extend([kol] * len(ring))
    _czapka(b, nr[-1], sciezka[-1][0] + Vector(G.OGON_KONIEC), zamknij=True)
    strefy.append(koncowka[0] if koncowka else G.KOLOR_OGONA)
    assert len(strefy) == len(b.verts)
    return b, strefy


def _lin(c):
    v = c / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def zbuduj():
    """Nowa scena: szkielet `G.NAZWA` + siatka `G.NAZWA + "Mesh"` z wagami i kolorami."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.render.fps = FPS

    ad = bpy.data.armatures.new(G.NAZWA)
    arm = bpy.data.objects.new(G.NAZWA, ad)
    scn.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for n, (h, t, _p) in SZ.items():
        eb = ad.edit_bones.new(n)
        eb.head, eb.tail = h, t
        eb.roll = 0.0
    for n, (_h, _t, p) in SZ.items():
        if p:
            ad.edit_bones[n].parent = ad.edit_bones[p]
            ad.edit_bones[n].use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"

    # Gatunek spoza czworonogów (pająk) podaje WŁASNE ciało — reszta zbuduj() wspólna.
    b, strefy = (getattr(G, "cialo", None) or _cialo)()
    me = bpy.data.meshes.new(G.NAZWA + "Mesh")
    me.from_pydata([tuple(v) for v in b.verts], [], b.faces)
    me.update(calc_edges=True)
    for p in me.polygons:
        p.use_smooth = True
    mesh = bpy.data.objects.new(G.NAZWA + "Mesh", me)
    scn.collection.objects.link(mesh)
    mesh.parent = arm
    grupy = {}
    for i, w in enumerate(b.wagi):
        for k, v in w.items():
            g = grupy.get(k) or mesh.vertex_groups.new(name=k)
            grupy[k] = g
            g.add([i], v, "REPLACE")
    md = mesh.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    # normalne na zewnątrz — pierścienie i czapki mają różne nawinięcie
    bpy.context.view_layer.objects.active = mesh
    for o in scn.objects:
        o.select_set(o == mesh)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    kol = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, c in enumerate(strefy):
        kol.data[i].color = (*[_lin(x) for x in c], 1.0)
    mat = bpy.data.materials.new(G.NAZWA)
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    vc = tree.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Col"
    tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    mat.use_backface_culling = False      # uszy są blaszką — widoczne z obu stron
    bsdf.inputs["Metallic"].default_value = 0.0
    me.materials.append(mat)
    return arm, mesh


def bryla_swiat(mesh):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    m = ev.to_mesh()
    pts = [mesh.matrix_world @ v.co for v in m.vertices]
    ev.to_mesh_clear()
    return pts


def podglad(arm, mesh, katalog, klatki=None):
    """Render: bok, skos, przód i tył pod kamerą gry (15°)."""
    scn = bpy.context.scene
    scn.render.engine = "BLENDER_WORKBENCH"
    scn.display.shading.light = "STUDIO"
    scn.display.shading.color_type = "VERTEX"
    scn.render.film_transparent = True
    scn.view_settings.view_transform = "Standard"
    scn.render.resolution_x, scn.render.resolution_y = 300, 220
    cd = bpy.data.cameras.new("Podglad")
    cd.type = "ORTHO"
    cd.ortho_scale = G.KADR_PODGLADU
    cam = bpy.data.objects.new("Podglad", cd)
    scn.collection.objects.link(cam)
    scn.camera = cam
    pliki = []
    for nazwa, f in (klatki or [("spoczynek", None)]):
        if f is not None:
            akcja, kl = f
            arm.animation_data.action = bpy.data.actions[akcja]
            scn.frame_set(kl)
        for azym in (90, 35, 0, 180):
            e, az = math.radians(15), math.radians(azym)
            cam.location = (100 * math.cos(e) * math.sin(az), -100 * math.cos(e) * math.cos(az),
                            G.SRODEK_PODGLADU + 100 * math.sin(e))
            kier = Vector((0, 0, G.SRODEK_PODGLADU)) - Vector(cam.location)
            cam.rotation_euler = kier.to_track_quat("-Z", "Y").to_euler()
            sc = os.path.join(katalog, f"{nazwa}_{azym}.png")
            scn.render.filepath = sc
            bpy.ops.render.render(write_still=True)
            pliki.append(sc)
    return pliki


# ════════════════════════════════════════════════════════════════════════════
# KLIPY
# ════════════════════════════════════════════════════════════════════════════
def _reset(arm):
    for pb in arm.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)


def _upd():
    bpy.context.view_layer.update()


def _obroc(arm, nazwa, os_, stopnie):
    """Obrót kości o kąt wokół osi ŚWIATA przez jej głowę (szkielet ma
    transform jednostkowy, więc przestrzeń szkieletu = świat)."""
    if abs(stopnie) < 1e-6:
        return
    pb = arm.pose.bones[nazwa]
    M = pb.matrix.copy()
    h = M.translation.copy()
    R = Matrix.Rotation(math.radians(stopnie), 4, os_)
    pb.matrix = Matrix.Translation(h) @ R @ Matrix.Translation(-h) @ M
    _upd()


def _celuj(arm, nazwa, cel):
    pb = arm.pose.bones[nazwa]
    h, t = pb.head.copy(), pb.tail.copy()
    q = (t - h).rotation_difference(Vector(cel) - h)
    M = pb.matrix.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M
    _upd()


def _ik2(A, C, l1, l2, zgiecie_w_tyl):
    """Punkt środkowy dwukościowego łańcucha A→B→C w płaszczyźnie x = const.
    `zgiecie_w_tyl`: staw B ucieka w +Y (łokieć) albo w −Y (kolano tylnej)."""
    d = C - A
    dist = min(d.length, l1 + l2 - 1e-4)
    d = d.normalized()
    cosa = max(-1.0, min(1.0, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)))
    a = math.acos(cosa)
    kand = [A + (Matrix.Rotation(s * a, 3, "X") @ d) * l1 for s in (1, -1)]
    return max(kand, key=lambda p: p.y) if zgiecie_w_tyl else min(kand, key=lambda p: p.y)


def _dl(n):
    h, t, _p = SZ[n]
    return (t - h).length


def _noga(arm, klucz, cel_pecina, zgiecie):
    """Ustawia jedną nogę: pęcina w `cel_pecina`, `zgiecie` 0..1 (wymach)."""
    sfx, przod = NOGI[klucz]
    gora, srodek, sr, racica = (("upper_f", "fore_f", "cannon_f", "hoof_f") if przod
                                else ("thigh_h", "shank_h", "cannon_h", "hoof_h"))
    gora, srodek, sr, racica = (g + sfx for g in (gora, srodek, sr, racica))
    F = Vector(cel_pecina)
    if przod:
        # łopatka waha się ZA racicą: racica w tyle (+y) → bark w tył.
        # ⚠ Obrót wokół +X kręci wektor w dół (0,0,−1) w stronę +y, więc znak
        # jest DODATNI — pierwsza wersja miała ujemny i bark uciekał od racicy.
        wys = F.y - _pecina_spoczynek(klucz).y
        _obroc(arm, "scap_f" + sfx, "X", G.WAHANIE_LOPATKI * wys)
    h_sr, t_sr, _ = SZ[sr]
    A = arm.pose.bones[gora].head.copy()
    kier = (h_sr - t_sr).normalized()                      # pęcina → staw (spoczynek)
    kier = kier.lerp((A - F).normalized(), G.SRODRECZE_ZA_NOGA * (1.0 - zgiecie)).normalized()
    kat = (G.ZGIECIE_PRZOD if przod else -G.ZGIECIE_TYL) * zgiecie
    kier = Matrix.Rotation(math.radians(-kat), 3, "X") @ kier
    K = F + kier * _dl(sr)
    B = _ik2(A, K, _dl(gora), _dl(srodek), zgiecie_w_tyl=przod)
    _celuj(arm, gora, B)
    _celuj(arm, srodek, K)
    _celuj(arm, sr, F)
    h_r, t_r, _ = SZ[racica]
    pal = Matrix.Rotation(math.radians(-1.4 * kat), 3, "X") @ (t_r - h_r)
    _celuj(arm, racica, arm.pose.bones[racica].head + pal)
    return (arm.pose.bones[sr].tail - F).length


def _pecina_spoczynek(klucz):
    sfx, przod = NOGI[klucz]
    return SZ[("cannon_f" if przod else "cannon_h") + sfx][1].copy()


def _tor(ch, klucz, faza):
    """Pęcina w fazie cyklu: (punkt, zgięcie 0..1)."""
    _sfx, przod = NOGI[klucz]
    p0 = _pecina_spoczynek(klucz)
    krok = ch["krok"][0 if przod else 1]
    duty = ch["duty"]
    if faza < duty:
        s = faza / duty
        return p0 + Vector((0, -krok / 2 + krok * s, 0)), 0.0
    s = (faza - duty) / (1 - duty)
    g = s * s * (3 - 2 * s)
    return p0 + Vector((0, krok / 2 - krok * g, ch["lift"] * math.sin(math.pi * s))), math.sin(math.pi * s)


def _tulow(arm, pelvis_z=0.0, pelvis_y=0.0, pochyl_zad=0.0, pochyl_klatka=0.0, przechyl=0.0, skret=0.0,
           kark=0.0, leb=0.0, ogon=0.0, uszy=0.0):
    pb = arm.pose.bones["pelvis"]
    pb.location = Vector((0.0, 0.0, 0.0))
    _upd()
    M = pb.matrix.copy()
    M.translation += Vector((0.0, pelvis_y, pelvis_z))
    pb.matrix = M
    _upd()
    # ⚠⚠ KONWENCJA: dodatni kąt = PRZÓD W GÓRĘ (pysk, klatka). Obrót wokół +X
    # świata OPUSZCZA wektor −Y (pysk), więc kąt idzie tu ze znakiem minus —
    # pierwsza wersja go nie miała i telegraf dzika PODNOSIŁ łeb.
    _obroc(arm, "pelvis", "X", -pochyl_zad)
    _obroc(arm, "pelvis", "Y", przechyl)
    _obroc(arm, "pelvis", "Z", skret)
    _obroc(arm, "chest", "X", -pochyl_klatka)
    _obroc(arm, "neck", "X", -kark)
    _obroc(arm, "head", "X", -leb)
    _obroc(arm, "tail_1", "Y", ogon)
    _obroc(arm, "ear.L", "X", uszy)
    _obroc(arm, "ear.R", "X", uszy)


def _klucz(arm, f):
    for pb in arm.pose.bones:
        pb.keyframe_insert("location", frame=f, group=pb.name)
        pb.keyframe_insert("rotation_quaternion", frame=f, group=pb.name)


def _nowa_akcja(arm, nazwa):
    stara = bpy.data.actions.get(nazwa)
    if stara:
        bpy.data.actions.remove(stara)
    a = bpy.data.actions.new(nazwa)
    a.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = a
    return a


def _liniowo(a):
    for layer in a.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"


def klip_chod(arm, nazwa, ch, leb=0.0, nisko=0.0):
    a = _nowa_akcja(arm, nazwa)
    n = ch["n"]
    bledy = 0.0
    for f in range(n + 1):
        t = (f % n) / n
        _reset(arm)
        _upd()
        if ch.get("galop"):
            fz = math.sin(2 * math.pi * t)
            _tulow(arm, pelvis_z=nisko + ch["bob"] * fz, pochyl_zad=-6.0 * fz,
                   pochyl_klatka=5.0 * math.sin(2 * math.pi * t + math.pi / 3),
                   kark=leb * 0.5 + ch["kiwanie"] * math.sin(2 * math.pi * t + math.pi / 2), leb=leb * 0.5,
                   ogon=10.0 * math.sin(2 * math.pi * t), uszy=-20.0 if leb else 0.0)
        else:
            _tulow(arm, pelvis_z=nisko + ch["bob"] * math.cos(4 * math.pi * t),
                   przechyl=2.0 * math.sin(2 * math.pi * t), kark=leb * 0.5 + ch["kiwanie"] * math.sin(4 * math.pi * t),
                   leb=leb * 0.5, ogon=8.0 * math.sin(2 * math.pi * t))
        for k in NOGI:
            fz = (t + ch["fazy"][k]) % 1.0
            p, zg = _tor(ch, k, fz)
            e = _noga(arm, k, p, zg)
            if e > bledy:
                bledy = e
                GDZIE[nazwa] = (k, round(fz, 2), round(e, 3))
        _klucz(arm, f)
    _liniowo(a)
    return a, bledy


def _stoj(arm, przesun=None):
    """Wszystkie nogi w spoczynku (opcjonalnie pęciny przesunięte)."""
    b = 0.0
    for k in NOGI:
        p = _pecina_spoczynek(k)
        if przesun and k in przesun:
            p = p + Vector(przesun[k][0])
            b = max(b, _noga(arm, k, p, przesun[k][1]))
        else:
            b = max(b, _noga(arm, k, p, 0.0))
    return b


def _ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def klip_bezruch(arm):
    a = _nowa_akcja(arm, "Idle")
    n = 48
    for f in range(n + 1):
        t = (f % n) / n
        _reset(arm); _upd()
        ucho = 18.0 * max(0.0, math.sin(math.pi * (t - 0.6) / 0.12)) if 0.6 <= t <= 0.72 else 0.0
        _tulow(arm, pelvis_z=0.03 * math.sin(2 * math.pi * t), pochyl_klatka=0.8 * math.sin(2 * math.pi * t),
               skret=0.0, kark=-3.0 + 2.0 * math.sin(2 * math.pi * t), leb=-2.0, ogon=10.0 * math.sin(4 * math.pi * t),
               uszy=-ucho)
        _obroc(arm, "neck", "Z", 6.0 * math.sin(2 * math.pi * t))
        _stoj(arm)
        _klucz(arm, f)
    _liniowo(a)
    return a


def klip_trafienie(arm):
    a = _nowa_akcja(arm, "Hit")
    n = 10
    for f in range(n + 1):
        t = f / n
        k = math.sin(math.pi * min(1.0, t / 0.6)) if t < 0.6 else 0.0
        _reset(arm); _upd()
        _tulow(arm, pelvis_y=0.25 * k, pochyl_klatka=6.0 * k, kark=12.0 * k, leb=10.0 * k, uszy=-25.0 * k)
        _stoj(arm)
        _klucz(arm, f)
    _liniowo(a)
    return a


def klip_ogluszenie(arm):
    """Bezbronność / ogłuszenie: łeb nisko, chwiejne kołysanie."""
    a = _nowa_akcja(arm, "Stunned")
    n = 32
    for f in range(n + 1):
        t = (f % n) / n
        _reset(arm); _upd()
        _tulow(arm, pelvis_z=-0.12, przechyl=5.0 * math.sin(2 * math.pi * t), kark=-10.0, leb=-10.0,
               uszy=-30.0)
        _obroc(arm, "neck", "Z", 7.0 * math.sin(2 * math.pi * t + 0.8))
        _stoj(arm)
        _klucz(arm, f)
    _liniowo(a)
    return a


def klip_smierc(arm, mesh):
    """Nogi się uginają, potem przewrót NA BOK (oś długości), łeb opada.
    Po ugięciu nogi jadą z ciałem (bez IK) — inaczej trzymałyby się ziemi."""
    a = _nowa_akcja(arm, "Death")
    n = 24
    zapis = None
    for f in range(n + 1):
        t = f / n
        _reset(arm); _upd()
        ug = _ease(t / 0.4)
        przewrot = _ease((t - 0.3) / 0.6)
        _tulow(arm, pelvis_z=-0.9 * ug, kark=-12.0 * ug - 10.0 * przewrot, leb=-8.0 * ug, uszy=-20.0 * ug)
        if t <= 0.4 or zapis is None:
            _stoj(arm)
            if t >= 0.4:
                zapis = {pb.name: pb.matrix_basis.copy() for pb in arm.pose.bones
                         if any(s in pb.name for s in ("_f.", "_h."))}
        else:
            for nm, mb in zapis.items():
                arm.pose.bones[nm].matrix_basis = mb
            _upd()
        # ⚠⚠ Przewrót wokół osi DŁUGOŚCI ciała w ŚWIECIE (Y). Kość `root` stoi
        # pionowo, więc jej lokalne Y to pion — obrót „wokół Y kości" był
        # obrotem w miejscu (wada skryptu wilka z dziennika).
        _obroc(arm, "root", "Y", 88.0 * przewrot)
        zmin = min(p.z for p in bryla_swiat(mesh))
        root = arm.pose.bones["root"]
        M = root.matrix.copy()
        M.translation.z -= zmin
        root.matrix = M
        _upd()
        _klucz(arm, f)
    _liniowo(a)
    return a


def zbuduj_klipy(arm, mesh):
    """Chody → warianty galopu gatunku → bezruch → klipy gatunku → trafienie,
    ogłuszenie → śmierć. ⚠ Kolejność jak w generatorze dzika sprzed rdzenia."""
    raport = {}
    for nazwa, ch in G.CHODY.items():
        _a, b = klip_chod(arm, nazwa, ch)
        raport[nazwa] = b
    for nazwa, ch in G.WARIANTY_CHODU.items():
        _a, b = klip_chod(arm, nazwa, ch, leb=ch.get("leb", 0.0), nisko=ch.get("nisko", 0.0))
        raport[nazwa] = b
    klip_bezruch(arm)
    for fn in G.KLIPY_GATUNKU:
        fn(arm)
    klip_trafienie(arm)
    klip_ogluszenie(arm)
    klip_smierc(arm, mesh)
    _reset(arm)
    arm.animation_data.action = bpy.data.actions["Idle"]
    return raport


def bramka(arm, mesh):
    """Grunt i ciało: najniższy punkt w każdym klipie (lot w galopie wolno)."""
    bledy = []
    for a in bpy.data.actions:
        arm.animation_data.action = a
        f0, f1 = (int(x) for x in a.frame_range)
        zmin = 1e9
        for f in range(f0, f1 + 1):
            bpy.context.scene.frame_set(f)
            zmin = min(zmin, min(p.z for p in bryla_swiat(mesh)))
        print(f"  [grunt] {a.name:10} klatki {f0}–{f1}  min z {zmin:+.2f}")
        if zmin < -0.15:
            bledy.append(f"{a.name}: ciało {zmin:.2f} j. pod gruntem")
    return bledy


def przygotuj(g):
    """Zbuduj gatunek (bryła + klipy) w świeżej scenie — bez renderu i zapisu."""
    uzyj(g)
    arm, mesh = zbuduj()
    (getattr(g, "zbuduj_klipy", None) or zbuduj_klipy)(arm, mesh)
    return arm, mesh


def glowny(g):
    """Przymiar gatunku: raport + podgląd; zapis `.glb` wyłącznie pod `--zapisz`."""
    uzyj(g)
    arm, mesh = zbuduj()
    pts = bryla_swiat(mesh)
    print(f"[{g.TAG}] siatka {len(mesh.data.vertices)} wierzch., {len(mesh.data.polygons)} ścian, "
          f"kości {len(arm.data.bones)}")
    print(f"[{g.TAG}] bryła y {min(p.y for p in pts):+.2f}..{max(p.y for p in pts):+.2f}  "
          f"z {min(p.z for p in pts):+.2f}..{max(p.z for p in pts):+.2f}  "
          f"x ±{max(abs(p.x) for p in pts):.2f}")
    katalog = os.environ.get(g.ENV_PODGLAD) or os.path.join(tempfile.gettempdir(), g.TAG + "3d")
    os.makedirs(katalog, exist_ok=True)
    if TYLKO_BRYLA:
        podglad(arm, mesh, katalog)
        return
    raport = (getattr(g, "zbuduj_klipy", None) or zbuduj_klipy)(arm, mesh)
    for k, v in raport.items():
        print(f"[{g.TAG}] {k:8} najdalej pęcina od celu IK: {v:.3f} j.  (noga, faza, błąd) {GDZIE.get(k)}")
    bledy = bramka(arm, mesh)
    for x in bledy:
        print("  [BLAD]", x)
    klatki = []
    for a in g.KLIPY_PODGLADU:
        akc = bpy.data.actions[a]
        f0, f1 = (int(x) for x in akc.frame_range)
        for i, f in enumerate((f0, f0 + (f1 - f0) // 3, f0 + 2 * (f1 - f0) // 3, f1)):
            klatki.append((f"{a}_{i}", (a, f)))
    pliki = podglad(arm, mesh, katalog, klatki)
    print(f"[{g.TAG}] podgląd: {len(pliki)} plików w {katalog}")
    if ZAPISZ:
        if bledy:
            raise SystemExit("[zapis] ODMOWA — bramka czerwona")
        arm.animation_data.action = bpy.data.actions["Idle"]
        bpy.context.scene.frame_set(0)
        for o in bpy.context.scene.objects:
            o.select_set(o in (arm, mesh))
        bpy.ops.export_scene.gltf(
            filepath=g.CEL, export_format="GLB", use_selection=True, export_yup=True,
            export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True,
            export_frame_step=1, export_skins=True, export_morph=False,
            export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_apply=False)
        print(f"[zapis] {g.CEL} {os.path.getsize(g.CEL)} bajtow")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: -- --zapisz")

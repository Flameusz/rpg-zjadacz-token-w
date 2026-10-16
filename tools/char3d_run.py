"""BIEG postaci gracza — akcja `Run` budowana parametrycznie (2026-10-03).

Moduł BLENDEROWY, wołany przy eksporcie (`char3d_export_gltf.py`), jak warianty
chodu z bronią. ⚠ **NIE ZAPISUJE char.blend** — w pliku leży wyłącznie `Walk`.

── Po co ─────────────────────────────────────────────────────────────────────
⚠⚠ Zgłoszone wprost przez autora: „chód jest spoko, ale chód + duża szybkość
wygląda dziwnie". To jest `OI-138`: gracz jedzie 150 px/s przy sylwetce 69 px,
czyli 2,17 wzrostu/s — to tempo BIEGU (człowiek idący robi ~0,8). Cykl chodu
grany do takiej prędkości sunie stopami i drepcze. Silnik (`Character3D`)
przechodzi płynnie z chodu w bieg wg prędkości i stroi tempo klipu prędkością.

── Układ klatek: TEN SAM co `Walk` (umowa z `Character3D.paraKlipow`) ─────────
    0  PODPORA A       lewa pod ciałem (miednica NISKO), prawa z piętą w górze z tyłu
    1  LOT A           lewa odbita do tyłu, prawe kolano wysoko z przodu (miednica WYSOKO)
    2  PODPORA B       lustro 0
    3  LOT B           lustro 1
    4  domknięcie      (== 0)
    5  bezruch         poza stojąca — identyczna jak w `Walk` (pętla jej nie gra)

⛔ Parametry biegu mieszkają WYŁĄCZNIE w `BIEG`. Reszta pliku opisuje rig.
"""
import math

import bpy
from mathutils import Euler, Quaternion, Vector

import char3d_attack
import char3d_walk as W

NAZWA = "Run"

# --- parametry biegu (jednostki ŚWIATA; postać ma 12,84 j. wzrostu) ---------
BIEG = {
    # (przód −/tył +, uniesienie) stopy na klatkę cyklu — dla nogi, która
    # w klatce 0 PODPIERA. Druga noga jedzie tym samym planem o pół cyklu.
    # ⚠ Odbicie (klatka 1) ograniczone ZASIĘGIEM nogi: przy 1,5 / 0,45 i
    # miednicy w neutrum noga ma ~95% zasięgu (5,0 z 5,25 j.).
    # ⭐⭐ „BIEG WOJOWNIKA, NIE SKRADANIE" (2026-10-03, autor: „wygląda, jakby się
    # skradał pochylony między drzewami"). Pierwsza wersja (miednica −0,38
    # w podporze, tułów 11° + pierś 5,5°, głowa za tułowiem, stopa podpory pod
    # ciałem, pięta pod pośladek) czytała się jak przyczajony chód. Dziś:
    # tułów prawie pionowo, głowa skontrowana do pionu, miednica wysoko
    # i dłuższy lot, stopa ląduje PRZED ciałem, kolano wychodzi w przód.
    # A/B (render z boku i ze skosu, 4 fazy): `docs/postac3d_checkpoint.md`
    # dopisek 2026-10-03 (9).
    "plan": [(-0.45, 0.0), (1.35, 0.60), (0.70, 1.35), (-1.55, 0.95)],
    # Pionowa praca miednicy: podpora lekko w dół (amortyzacja), lot wysoko.
    "miednica_podpora": -0.12,
    "miednica_lot": 0.22,
    # Pochylenie tułowia w przód (°) i przeciwskręt barków względem bioder (°).
    "pochylenie": 5.0,
    "skret": 9.0,
    # Udział piersi w pochyleniu (talia bierze całe `pochylenie`).
    "pochylenie_piersi": 0.2,
    # Kontra SZYI i GŁOWY (ułamek pochylenia całego tułowia, cofany): głowa
    # zostaje w pionie, wzrok przed siebie.
    "kontra_szyi": 0.5,
    "kontra_glowy": 0.5,
    # Ręce zgięte w łokciach (świat, rig kalibracyjny; prawa dłoń, lewa = lustro X):
    # wymach W PRZÓD przed klatką piersiową, W TYŁ za biodrem.
    "dlon_przod": (-1.05, -1.90, -3.90),
    "dlon_tyl": (-1.70, 1.70, -5.10),
    # Palce stopy: w podporze płasko, przy odbiciu opuszczone, w wymachu w górę.
    # ⚠ Odbicie 22° wbijało palce 0,05 j. w grunt (raport) — dziś 14° przy
    #   stopie uniesionej o 0,55.
    "palce": [0.0, 14.0, 18.0, -12.0],
}


def zbuduj_bieg(arm=None, bieg=None, report=True):
    """Tworzy (albo nadpisuje) akcję `Run` i zwraca ją. Bezruch = poza `Walk`."""
    arm = arm or bpy.data.objects["Armature"]
    b = dict(BIEG, **(bieg or {}))
    scn = bpy.context.scene
    char3d_attack.zdejmij_obrot_turntable(arm)

    stara = bpy.data.actions.get(NAZWA)
    if stara:
        bpy.data.actions.remove(stara)
    akcja = bpy.data.actions.new(NAZWA)
    akcja.use_fake_user = True
    arm.animation_data.action = akcja

    W._spoczynek(arm)
    bpy.context.view_layer.update()
    baza_stopy = {s: W._baza_kontrolki(arm, W.STOPA_IK[s]) for s in ("L", "R")}
    os_stopy = {s: W._os_pochylenia_stopy(arm, s) for s in ("L", "R")}
    plasko = {s: W._wysokosc_palca(arm, s) for s in ("L", "R")}
    bark_w, skala = char3d_attack._przelicznik(arm)
    hr, hl = arm.pose.bones["HandIK_R.005"], arm.pose.bones["HandIK_L.005"]
    miednica = arm.pose.bones[W.MIEDNICA]
    talia = arm.pose.bones[W.TALIA]
    piers = arm.pose.bones["Bone.002"]
    szyja = arm.pose.bones["Bone.003"]
    glowa = arm.pose.bones["Bone.004"]
    cialo = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]
    zasieg_nogi = sum(arm.data.bones[n].length
                      for n in ("Bone_L.001", "Bone_L.002", "Bone_L.003")) * arm.scale.x

    def faza(f, strona):
        """Indeks planu dla nogi: lewa podpiera w 0, prawa — w 2."""
        return f % 4 if strona == "L" else (f + 2) % 4

    def najnizszy():
        dg = bpy.context.evaluated_depsgraph_get()
        z = 1e9
        for o in cialo:
            ev = o.evaluated_get(dg); me = ev.to_mesh()
            z = min(z, min((ev.matrix_world @ v.co).z for v in me.vertices))
            ev.to_mesh_clear()
        return z

    scn.frame_set(W.BEZRUCH)
    podloga = najnizszy()
    wiersze = []
    for f in W.KLATKI:
        scn.frame_set(f)
        W._spoczynek(arm)
        if f == W.BEZRUCH:
            # Poza stojąca IDENTYCZNA z `Walk` — pętla jej nie gra, ale klip
            # ma mieć tę samą budowę (cięcie `subclip` w silniku).
            for nazwa in (W.MIEDNICA, W.TALIA):
                arm.pose.bones[nazwa].rotation_quaternion = Quaternion(W.MIJANIE_QUAT[nazwa])
            for s in ("L", "R"):
                arm.pose.bones[W.DLON_IK[s]].location = W.RECE[s]["srodek"]
            bpy.context.view_layer.update()
            for s in ("L", "R"):
                W._wypoziomuj_stope(arm, s, os_stopy[s], plasko[s])
        else:
            k = f % 4
            podpora = k in (0, 2)
            lustro = k >= 2
            # --- miednica: góra/dół + przechył z chodu ---
            dz = b["miednica_podpora"] if podpora else b["miednica_lot"]
            miednica.location = (0.0, dz / arm.scale.x, 0.0)    # lokalne Y = świat Z
            q = Quaternion(W.KONTAKT_QUAT[W.MIEDNICA] if podpora else W.MIJANIE_QUAT[W.MIEDNICA])
            miednica.rotation_quaternion = W._lustro(q) if lustro else q
            # --- tułów: pochylenie w przód + przeciwskręt (znak zmienia się co krok) ---
            skret = b["skret"] * (1.0 if lustro else -1.0) * (1.0 if not podpora else 0.6)
            talia.rotation_quaternion = Euler(
                (b["pochylenie"] * 0.0175, skret * 0.6 * 0.0175, 0.0), "XYZ").to_quaternion()
            piers.rotation_quaternion = Euler(
                (b["pochylenie"] * b["pochylenie_piersi"] * 0.0175, skret * 0.4 * 0.0175, 0.0), "XYZ").to_quaternion()
            calosc = b["pochylenie"] * (1.0 + b["pochylenie_piersi"])
            szyja.rotation_quaternion = Euler(
                (-calosc * b["kontra_szyi"] * 0.0175, -skret * 0.3 * 0.0175, 0.0), "XYZ").to_quaternion()
            glowa.rotation_quaternion = Euler(
                (-calosc * b["kontra_glowy"] * 0.0175, -skret * 0.3 * 0.0175, 0.0), "XYZ").to_quaternion()
            # --- stopy ---
            for s in ("L", "R"):
                dy, dzs = b["plan"][faza(f, s)]
                _w0, M = baza_stopy[s]
                arm.pose.bones[W.STOPA_IK[s]].location = M.inverted() @ Vector((0.0, dy, dzs))
            bpy.context.view_layer.update()
            for s in ("L", "R"):
                W._wypoziomuj_stope(arm, s, os_stopy[s], plasko[s], b["palce"][faza(f, s)])
            # --- ręce: przeciwnie do nóg (lewa noga z przodu ⇔ lewa ręka z tyłu) ---
            for s, pb, prawa in (("R", hr, True), ("L", hl, False)):
                noga_przod = b["plan"][faza(f, s)][0] < 0.0
                cel = b["dlon_tyl"] if noga_przod else b["dlon_przod"]
                if not prawa:
                    cel = (-cel[0], cel[1], cel[2])
                cel = char3d_attack._przenies(cel, bark_w, skala, prawa=prawa)
                cel = tuple(Vector(cel) + Vector((0.0, 0.0, dz)))   # z miednicą
                char3d_attack._dopasuj(arm, pb, char3d_attack.DLON_R if prawa
                                       else char3d_attack.DLON_L, cel, prawa,
                                       bark_z_pozy=True)

        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        for s in ("L", "R"):
            biodro = ev.matrix_world @ ev.pose.bones[W.BIODRO[s]].head
            kolano = ev.matrix_world @ ev.pose.bones[W.GOLEN[s]].head
            kostka = ev.matrix_world @ ev.pose.bones[W.GOLEN[s]].tail
            cel = ev.matrix_world @ ev.pose.bones[W.STOPA_IK[s]].head
            wiersze.append((f, s, (kostka - biodro).length / zasieg_nogi,
                            math.degrees((biodro - kolano).angle(kostka - kolano)),
                            (kostka - cel).length, najnizszy() - podloga))
        for pb in arm.pose.bones:
            for kanal in W._kanaly(pb):
                pb.keyframe_insert(data_path=kanal, frame=f, group=pb.name)

    for layer in akcja.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"
                    fc.update()

    # Wyzeruj to, czego klipy bez kluczy nie powinny odziedziczyć.
    miednica.location = (0.0, 0.0, 0.0)
    for pb in (szyja, glowa):
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    bledy = []
    for f, s, u, kat, e, g in wiersze:
        if e > 0.05:
            bledy.append(f"klatka {f} {s}: stopa {e:.2f} j. od celu IK (poza zasięgiem nogi)")
        if g < -W.ZANURZENIE:
            bledy.append(f"klatka {f} {s}: ciało {g:.2f} j. pod gruntem")
    if report:
        print(f"[bieg] akcja '{NAZWA}': plan {b['plan']}")
        for f, s, u, kat, e, g in wiersze:
            print(f"  {f} {s} zasięg {u * 100:5.1f}% kolano {kat:5.1f}° błąd IK {e:.3f} grunt {g:+.2f}")
        for x in bledy:
            print("  [BLAD]", x)
    return akcja, bledy

"""PRZYMIAR: KANT tarczy w pozie GUARD. Renderuje warianty, NIC nie zapisuje.

    blender -b public/assets/char.blend --python tools/char3d_przymiar_garda.py \\
        -- <katalog> [WxH]

-- Po co --------------------------------------------------------------------
Po spionowaniu dlugiej osi (2026-09-21) garda przestala lezec poziomo, ale
zaczela czytac sie jak PIONOWA SCIANA ustawiona plasko przed graczem.
Pomiar potwierdza i nazywa przyczyne jedna liczba:

    |n . przod| = 1,000  na WSZYSTKICH szesciu konstrukcjach

czyli lico jest DOKLADNIE prostopadle do widoku — idealny billboard. Zadna
prawdziwa garda tak nie stoi; tarcze trzyma sie skosem, zeby cios sie zsunal,
a widz widzi wtedy kawalek krawedzi i lico pod katem.

⚠ Tarcza NIE jest przy tym wysrodkowana na ciele — jej srodek lezy **+1,79 j.**
w bok od osi tulowia, po stronie reki. Ta czesc relacji jest poprawna i ten
przymiar jej NIE rusza.

-- Co ten przymiar rusza ----------------------------------------------------
WYLACZNIE `char3d_chod.LICO_TARCZY_WALKA` — kierunek, w ktory ma celowac lico
w pozie walki — i tylko w pamieci tej sesji Blendera.
⛔ NIE rusza: CARRY, `obrot`, `chwyt`, geometrii, skali, pionowania dlugiej osi
(`PION_TARCZY_WALKA` zostaje — poprawka „gora tarczy = gora" jest przyjeta).

⭐ Pionowanie dziala DALEJ przy kazdym kancie: `_ustaw_pion_tarczy` obraca kosc
wokol normalnej lica, wiec rzutuje swiatowy „dol" na plaszczyzne lica. Dopoki
normalna nie jest pionowa, rozwiazanie istnieje.

-- Znak kanta ---------------------------------------------------------------
Reka z tarcza jest po stronie +X (srodek tarczy +1,73 przy osi ciala −0,06).
  `+` = lico odwrocone NA ZEWNATRZ (otwiera sie od ciala)
  `-` = lico odwrocone DO SRODKA, czyli KRAWEDZ ZEWNETRZNA IDZIE W PRZOD
        — to jest klasyczna garda, cios zsuwa sie na zewnatrz
"""
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_attack    # noqa: E402
import char3d_chod      # noqa: E402
import char3d_shields   # noqa: E402
import char3d_weapons   # noqa: E402
import char3d_zones     # noqa: E402
import shield_shapes    # noqa: E402

_arg = sys.argv[sys.argv.index("--") + 1:]
OUT = _arg[0]
RES = _arg[1] if len(_arg) > 1 else "96x128"
os.makedirs(OUT, exist_ok=True)

# Kanty do obejrzenia, w stopniach. 0 = dzisiejszy billboard.
KANTY = [0, -20, -35, -50, +25]
# Trzy tarcze wystarcza: kolo jako punkt odniesienia (kant widac na nim
# najslabiej, bo nie ma sylwetki, ktora by sie zmieniala), rycerska jako
# sredni ksztalt, pawez jako najtrudniejszy przypadek.
TARCZE = ["round", "heater", "pavise"]
KLATKA = 5
UDZIAL_GLOWY = 0.21

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()

bronie = char3d_weapons.zbuduj_wszystkie(arm)
for o in bronie.values():
    o.hide_render = True
bronie["sword"].hide_render = False
tarcze = char3d_shields.zbuduj_wszystkie(arm)
for o in tarcze.values():
    o.hide_render = True
CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]

scn.render.resolution_x, scn.render.resolution_y = [int(v) for v in RES.split("x")]
scn.render.image_settings.color_mode = "RGBA"
cam = bpy.data.objects.get("Kam_garda")
if cam is None:
    cam = bpy.data.objects.new("Kam_garda", bpy.data.cameras.new("Kam_garda"))
    scn.collection.objects.link(cam)
scn.camera = cam
cam.data.type = "ORTHO"


def _bryla(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for ob in objs:
        oe = ob.evaluated_get(dg)
        me = oe.to_mesh()
        for v in me.vertices:
            p = ob.matrix_world @ v.co
            for i in range(3):
                mn[i] = min(mn[i], p[i])
                mx[i] = max(mx[i], p[i])
        oe.to_mesh_clear()
    return mn, mx


def _kadr(widok):
    mn, mx = _bryla(CIALO)
    C = (mn + mx) * 0.5
    if widok == "przod":
        cam.data.ortho_scale = (mx.z - mn.z) * 1.30
        cam.location = (C.x, C.y - 40.0, C.z)
        cam.rotation_euler = (1.5708, 0.0, 0.0)
    else:   # z gory — tu kant widac jednoznacznie
        cam.data.ortho_scale = (mx.z - mn.z) * 0.75
        cam.location = (C.x, C.y, C.z + 40.0)
        cam.rotation_euler = (0.0, 0.0, 0.0)


def _maska(nazwa):
    scn.render.film_transparent = True
    sciezka = os.path.join(OUT, nazwa + ".png")
    scn.render.filepath = sciezka
    bpy.ops.render.render(write_still=True)
    obraz = bpy.data.images.load(sciezka)
    piks = np.array(obraz.pixels[:]).reshape(obraz.size[1], obraz.size[0], 4)
    bpy.data.images.remove(obraz)
    return piks[:, :, 3] > 0.05


oryginal = char3d_chod.LICO_TARCZY_WALKA
print(f"\nkanty: {KANTY} st.  (− = krawedz zewnetrzna do przodu)")
print(f"{'kant':>6} {'tarcza':<9} {'|n.przod|':>10} {'zaslona ciala':>15} {'zaslona glowy':>15}")
print("-" * 60)

# Maska samego ciala liczy sie RAZ — poza ciala nie zalezy od kanta tarczy.
_kadr("przod")
for o in tarcze.values():
    o.hide_render = True
CIALO_M = _maska("_cialo")
wiersze = np.where(CIALO_M.any(axis=1))[0]
gora, dol = wiersze.max(), wiersze.min()
GLOWA = np.zeros_like(CIALO_M)
GLOWA[int(gora - (gora - dol) * UDZIAL_GLOWY):, :] = True
GLOWA &= CIALO_M
ile_c, ile_g = int(CIALO_M.sum()), int(GLOWA.sum())

for kant in KANTY:
    a = math.radians(kant)
    char3d_chod.LICO_TARCZY_WALKA = (math.sin(a), -math.cos(a), 0.0)
    char3d_chod.zbuduj_chod_uzbrojony(arm, bron=True, tarcza=True, walka=True)
    arm.animation_data.action = bpy.data.actions["Walk_Armed_Shielded_Combat"]
    scn.frame_set(KLATKA)
    bpy.context.view_layer.update()
    for t in TARCZE:
        ob = tarcze[t]
        n = (ob.matrix_world.to_3x3() @ Vector((0.0, 0.0, 1.0))).normalized()
        # maska samej tarczy -> zaslanianie
        for o in tarcze.values():
            o.hide_render = True
        for o in CIALO + [bronie["sword"]]:
            o.hide_render = True
        ob.hide_render = False
        _kadr("przod")
        M = _maska(f"_m_{kant}_{t}")
        for o in CIALO:
            o.hide_render = False
        bronie["sword"].hide_render = False
        zc = 100.0 * float((CIALO_M & M).sum()) / max(ile_c, 1)
        zg = 100.0 * float((GLOWA & M).sum()) / max(ile_g, 1)
        print(f"{kant:>+6} {t:<9} {abs(n.y):>10.3f} {zc:>14.1f}% {zg:>14.1f}%")
        # rendery do ogladania
        scn.render.film_transparent = False
        for widok in ("przod", "gora"):
            _kadr(widok)
            scn.render.filepath = os.path.join(OUT, f"k{kant:+03d}_{t}_{widok}.png")
            bpy.ops.render.render(write_still=True)
        ob.hide_render = True

char3d_chod.LICO_TARCZY_WALKA = oryginal
print(f"\n[gotowe] {OUT}")
print("⚠ To jest POMIAR i PODGLAD. Zaden kant nie zostal wpisany do kodu.")

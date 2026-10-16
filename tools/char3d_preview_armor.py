"""Podgląd wariantów pancerza — do OGLĄDANIA, nie do zapisu assetu.

    blender -b char.blend --python char3d_preview_armor.py -- <katalog>

Renderuje trzy stany (bez pancerza / lekki / ciężki) w dwóch pozach
(bezruch i sam moment cięcia), z przodu i z profilu. Składaniem w tablicę
zajmuje się `tools/build_char3d_armor.py`.

⚠ Istnieje, bo raport „48 wielokątów, napuchnięcie 0,16" nie mówi nic o tym,
czy bryła czyta się jak pancerz. To ocenia oko.
"""
import bpy
import sys
import os
import math
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_zones    # noqa: E402
import char3d_attack   # noqa: E402
import char3d_armor    # noqa: E402

OUT = sys.argv[sys.argv.index("--") + 1:][0]
os.makedirs(OUT, exist_ok=True)

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]

char3d_zones.apply_zones()
char3d_attack.zbuduj_atak(arm)
bron = char3d_attack.dodaj_atrape_broni(arm)
warstwy = {w: char3d_armor.zbuduj_pancerz(w) for w in char3d_armor.WARIANTY}
for o in warstwy.values():
    o.hide_render = True

MESHE = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"], bron, *warstwy.values()]
POZY = {"bezruch": 0, "ciecie": 2}

# Kadr liczony po wszystkim naraz, z każdą warstwą widoczną — inaczej postać
# skacze między kolumnami tablicy.
MN = Vector((1e9, 1e9, 1e9))
MX = Vector((-1e9, -1e9, -1e9))
for f in POZY.values():
    scn.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    for o in MESHE:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            p = ev.matrix_world @ v.co
            for i in range(3):
                MN[i] = min(MN[i], p[i])
                MX[i] = max(MX[i], p[i])
        ev.to_mesh_clear()
SRODEK = (MN + MX) / 2.0
RXY = max(MX.x - SRODEK.x, MX.y - SRODEK.y, SRODEK.x - MN.x, SRODEK.y - MN.y)
H = MX.z - MN.z

ELEV = math.radians(15)
MARG = 1.08
kadr_h = (H * math.cos(ELEV) + 2 * RXY * math.sin(ELEV)) * MARG
kadr_w = 2 * RXY * MARG

cam_d = bpy.data.cameras.new("Podglad")
cam_d.type = "ORTHO"
cam_d.clip_start, cam_d.clip_end = 0.1, 500.0
cam = bpy.data.objects.new("Podglad", cam_d)
scn.collection.objects.link(cam)
scn.camera = cam
scn.render.resolution_y = 340
scn.render.resolution_x = max(2, int(round(340 * kadr_w / kadr_h)))
cam_d.ortho_scale = kadr_h if scn.render.resolution_y >= scn.render.resolution_x else kadr_w

scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
sh.show_object_outline = True
sh.object_outline_color = (0.05, 0.03, 0.03)
sh.show_shadows = False
sh.show_cavity = True
scn.display.render_aa = "8"
scn.view_settings.view_transform = "Standard"
scn.render.film_transparent = True
scn.render.image_settings.file_format = "PNG"
scn.render.image_settings.color_mode = "RGBA"

STANY = ["bez", *char3d_armor.WARIANTY]
for stan in STANY:
    for nazwa_w, o in warstwy.items():
        o.hide_render = (nazwa_w != stan)
    for widok, az in (("front", 0), ("profil", 90)):
        a = math.radians(az)
        d = Vector((math.sin(a) * math.cos(ELEV), -math.cos(a) * math.cos(ELEV), math.sin(ELEV)))
        cam.location = SRODEK + d * 100.0
        cam.rotation_euler = (math.pi / 2 - ELEV, 0.0, a)
        for nazwa_p, klatka in POZY.items():
            scn.frame_set(klatka)
            scn.render.filepath = os.path.join(OUT, f"{stan}_{widok}_{nazwa_p}.png")
            bpy.ops.render.render(write_still=True)
print(f"[gotowe] {OUT} stany={STANY} {scn.render.resolution_x}x{scn.render.resolution_y}")

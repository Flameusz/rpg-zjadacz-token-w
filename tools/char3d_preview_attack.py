"""Podgląd akcji "Attack" — pasek klatek z dwóch kamer, do OGLĄDANIA.

    blender -b char.blend --python char3d_preview_attack.py -- <katalog>

Istnieje, bo raport o akcji nic nie mówi o tym, czy cios daje się przeczytać.
Renderuje każdą pozę z przodu i z lewego profilu; składaniem w pasek zajmuje się
`tools/build_char3d_attack.py`.
"""
import bpy
import sys
import os
import math
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_zones          # noqa: E402
import char3d_attack         # noqa: E402

OUT = sys.argv[sys.argv.index("--") + 1:][0]
os.makedirs(OUT, exist_ok=True)

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]

# ⚠ Bez tego podglad oglada postac OBROCONA o -90° (turntable w akcji
# `Walk`), wiec „tyl" pokazuje profil i wnioski o pozie sa falszywe.
char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()
char3d_attack.zbuduj_atak(arm)
bron = char3d_attack.dodaj_atrape_broni(arm)
MESHE = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"], bron]
KLATKI = [p[0] for p in char3d_attack.POZY]

# Kadr liczony po CAŁEJ akcji naraz — inaczej postać skacze między klatkami.
MN = Vector((1e9, 1e9, 1e9))
MX = Vector((-1e9, -1e9, -1e9))
for f in KLATKI:
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
print(f"[kadr] wys={H:.2f} promienXY={RXY:.2f}")

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

scn.render.resolution_y = 300
scn.render.resolution_x = max(2, int(round(300 * kadr_w / kadr_h)))
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

for nazwa, az in (("front", 0), ("profil", 90)):
    a = math.radians(az)
    d = Vector((math.sin(a) * math.cos(ELEV), -math.cos(a) * math.cos(ELEV), math.sin(ELEV)))
    cam.location = SRODEK + d * 100.0
    cam.rotation_euler = (math.pi / 2 - ELEV, 0.0, a)
    for f in KLATKI:
        scn.frame_set(f)
        scn.render.filepath = os.path.join(OUT, f"{nazwa}_{f:02d}.png")
        bpy.ops.render.render(write_still=True)
print("[gotowe]", OUT, scn.render.resolution_x, "x", scn.render.resolution_y)

"""Podgląd całego rostera broni w dłoni — do OGLĄDANIA.

    blender -b char.blend --python char3d_preview_weapons.py -- <katalog>

Renderuje każdą broń w dwóch pozach (gotowość i moment cięcia), z przodu.
⚠ Istnieje, bo raport „długość 4,00, chwyt 0,36" nie mówi nic o tym, czy broń
siedzi w pięści. To ocenia oko — i to tutaj wyszło, że pierwsza atrapa
przechodziła przez tułów.
"""
import bpy
import sys
import os
import math
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_zones     # noqa: E402
import char3d_attack    # noqa: E402
import char3d_weapons   # noqa: E402

OUT = sys.argv[sys.argv.index("--") + 1:][0]
os.makedirs(OUT, exist_ok=True)

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]

# ⚠ Bez tego podglad oglada postac OBROCONA o -90° (turntable w akcji
# `Walk`), wiec „tyl" pokazuje profil i wnioski o pozie sa falszywe.
char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()
# Dwa klipy: jednoręczny i oburęczny. Broń z `rece: 2` renderujemy tym drugim,
# bo inaczej „dwuręczna" jest wyłącznie etykietą — lewa dłoń wisi przy biodrze.
char3d_attack.zbuduj_atak(arm, oburacz=True)
AKCJA_2H = bpy.data.actions[char3d_attack.NAZWA_2H]
AKCJA_2H.use_fake_user = True
char3d_attack.zbuduj_atak(arm)
AKCJA_1H = bpy.data.actions[char3d_attack.NAZWA]
AKCJA_1H.use_fake_user = True
bronie = char3d_weapons.zbuduj_wszystkie(arm)
for o in bronie.values():
    o.hide_render = True

CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]
POZY = {"gotowosc": 0, "ciecie": 2}

# Kadr liczony z NAJDŁUŻSZĄ bronią widoczną, żeby włócznia nie wyjechała
# poza kadr, a reszta nie skakała między kolumnami.
najdluzsza = max(bronie, key=lambda b: char3d_weapons.BRONIE[b]["dlugosc"])
MN = Vector((1e9, 1e9, 1e9))
MX = Vector((-1e9, -1e9, -1e9))
for f in POZY.values():
    scn.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    for o in CIALO + [bronie[najdluzsza]]:
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
print(f"[kadr] najdluzsza bron: {najdluzsza}, wys={H:.2f} promienXY={RXY:.2f}")

ELEV = math.radians(15)
MARG = 1.06
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

a = 0.0
d = Vector((0.0, -math.cos(ELEV), math.sin(ELEV)))
cam.location = SRODEK + d * 100.0
cam.rotation_euler = (math.pi / 2 - ELEV, 0.0, a)

for bid, ob in bronie.items():
    for inny in bronie.values():
        inny.hide_render = True
    ob.hide_render = False
    arm.animation_data.action = (
        AKCJA_2H if char3d_weapons.BRONIE[bid]["rece"] == 2 else AKCJA_1H)
    for nazwa_p, klatka in POZY.items():
        scn.frame_set(klatka)
        scn.render.filepath = os.path.join(OUT, f"{bid}_{nazwa_p}.png")
        bpy.ops.render.render(write_still=True)
print(f"[gotowe] {OUT} bronie={list(bronie)} {scn.render.resolution_x}x{scn.render.resolution_y}")

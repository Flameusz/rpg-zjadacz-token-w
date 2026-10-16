"""Podgląd tarcz w lewej dłoni — do OGLĄDANIA.

    blender -b char.blend --python char3d_preview_shields.py -- <katalog>

Renderuje każdą tarczę z przodu i z boku, w bezruchu i w dwóch klatkach marszu.
⚠ Istnieje z tego samego powodu, co `char3d_preview_weapons.py`: raport
„promień 2,25, chwyt (0, −0,35, 0,40)" nie mówi, czy tarcza siedzi na
przedramieniu, czy przecina udo. To ocenia oko.

⚠ Klatki marszu są tu OBOWIĄZKOWE, nie dla kompletu. `Walk_Armed` zatrzymuje
wyłącznie rękę z bronią, więc lewa ręka — ta z tarczą — macha dalej. Bezruch
wychodzi czysty nawet wtedy, gdy marsz jest zepsuty; dokładnie tak przepadła
pierwsza wersja chwytu broni (miecz zamiatał grunt tylko w ruchu).
"""
import bpy
import sys
import os
import math
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_zones     # noqa: E402
import char3d_attack    # noqa: E402
import char3d_chod      # noqa: E402
import char3d_shields   # noqa: E402
import char3d_weapons   # noqa: E402

OUT = sys.argv[sys.argv.index("--") + 1:][0]
os.makedirs(OUT, exist_ok=True)

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]

char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()

# Tarczy nie nosi się samej — z pustą prawą ręką nie widać, czy komplet się
# nie przenika. Miecz jest najdłuższą jednoręczną bronią, więc jest najgorszym
# przypadkiem dla pary „broń + tarcza".
bronie = char3d_weapons.zbuduj_wszystkie(arm)
for o in bronie.values():
    o.hide_render = True
bronie["sword"].hide_render = False

char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False)
CHOD_UZBROJONY = bpy.data.actions[char3d_chod.NAZWA]

tarcze = char3d_shields.zbuduj_wszystkie(arm)
for o in tarcze.values():
    o.hide_render = True

CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]
# Klatka 0 = ręka opuszczona, 2 = ręka wyrzucona do przodu. Jeśli tarcza ma
# gdzieś wejść w ciało albo w grunt, zrobi to w jednej z tych dwóch.
POZY = {"krok0": 0, "krok2": 2}

# Kadr liczony z największą tarczą widoczną, żeby obie wyszły w tej samej skali.
najwieksza = max(tarcze, key=lambda t: char3d_shields.TARCZE[t]["promien"])
arm.animation_data.action = CHOD_UZBROJONY
MN = Vector((1e9, 1e9, 1e9))
MX = Vector((-1e9, -1e9, -1e9))
for f in POZY.values():
    scn.frame_set(f)
    dg = bpy.context.evaluated_depsgraph_get()
    for o in CIALO + [tarcze[najwieksza], bronie["sword"]]:
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
print(f"[kadr] najwieksza tarcza: {najwieksza}, wys={H:.2f} promienXY={RXY:.2f}")

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

# ⚠ Azymut 0 = kamera po stronie −Y, czyli postać PATRZY W KAMERĘ — ten sam
# układ, co „down" w `char3d_blender.py`. Widok z boku (90°) pokazuje, jak
# daleko tarcza odstaje od ciała; z przodu nie widać tego wcale.
WIDOKI = {"przod": 0.0, "bok": 90.0}


def ustaw_kamere(azymut_deg):
    a = math.radians(azymut_deg)
    d = Vector((math.sin(a) * math.cos(ELEV), -math.cos(a) * math.cos(ELEV), math.sin(ELEV)))
    cam.location = SRODEK + d * 100.0
    cam.rotation_euler = (math.pi / 2 - ELEV, 0.0, a)


for tid, ob in tarcze.items():
    for inny in tarcze.values():
        inny.hide_render = True
    ob.hide_render = False
    arm.animation_data.action = CHOD_UZBROJONY
    for nazwa_p, klatka in POZY.items():
        scn.frame_set(klatka)
        for nazwa_w, azymut in WIDOKI.items():
            ustaw_kamere(azymut)
            scn.render.filepath = os.path.join(OUT, f"{tid}_{nazwa_p}_{nazwa_w}.png")
            bpy.ops.render.render(write_still=True)
print(f"[gotowe] {OUT} tarcze={list(tarcze)} {scn.render.resolution_x}x{scn.render.resolution_y}")

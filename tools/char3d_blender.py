"""Strona BLENDEROWA pipeline'u 3D -> sprite. Uruchamiana wylacznie przez
`tools/build_char3d.py`, nigdy recznie:

    blender -b char.blend --python char3d_blender.py -- <outdir> <px_h> <elev> <klatki> <kierunki>

Renderuje klatki PNG z przezroczystym tlem, po jednej na (kierunek, klatka).
Skladanie w arkusz i pikselizacja sa po stronie `build_char3d.py`.

⚠ NIE ZAPISUJE nic do char.blend. Wszystkie korekty ponizej dzialaja tylko
w pamieci tej sesji Blendera.

Trzy rzeczy w tym pliku sa nieoczywiste i kazda kosztowala jeden bledny render
(szczegoly w `public/assets/README.md`, sekcja o char.blend):

1. Akcja "Walk" to 3-klatkowy cykl pozy (0,1,2) PLUS wkluczowany obrot calego
   obiektu o -90 st. na klatkach 0/3/6/9 - autor zrobil "chod ogladany z
   czterech stron" w jednej akcji. Kierunki daje tutaj kamera, wiec ten obrot
   trzeba zdjac, inaczej postac obraca sie DWA RAZY i w rzedzie "down" wychodza
   profile.
2. Modyfikator Solidify to nie pogrubienie, tylko inverted-hull outline
   (odwrocone normalne, ujemna grubosc, material_offset=1). Ten offset przesuwa
   KAZDY nadany material o jeden slot dalej, wiec przy wiekszej liczbie stref
   koloru wszystko wychodzi przemieszane. Do sprite'a kontur rysuje Workbench.
3. Mesh glowy (`Cube`) jest przypiety do KOSCI (parent_type='BONE'), wiec jego
   lokalne osie nie sa osiami swiata - "gora glowy" trzeba liczyc przez
   matrix_world, inaczej czapa wlosow wychodzi do gory nogami.
"""
import bpy
import sys
import os
import math
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_zones  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
PX_H = int(argv[1])
ELEV = float(argv[2])
FRAMES = [int(x) for x in argv[3].split(",")]
AZIMUTHS = {"down": 0, "up": 180, "left": 90, "right": 270}
WANT = argv[4].split(",") if len(argv) > 4 else list(AZIMUTHS)
os.makedirs(OUT, exist_ok=True)

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
MESHES = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]


# --- 1. Zdejmij obrot turntable z akcji (patrz punkt 1 w naglowku) ---
removed = 0
act = arm.animation_data.action
for layer in act.layers:
    for strip in layer.strips:
        for slot in act.slots:
            cb = strip.channelbag(slot)
            if not cb:
                continue
            for fc in [c for c in cb.fcurves if not c.data_path.startswith("pose.bones")]:
                cb.fcurves.remove(fc)
                removed += 1
arm.rotation_euler = (0.0, 0.0, 0.0)
print(f"[fix] zdjeto {removed} krzywych obiektowych z akcji (obrot turntable)")

# --- 2. Strefy koloru ---
char3d_zones.apply_zones()


# --- 3. Stale kadrowanie: bbox po CALYM cyklu naraz ---
# Liczone raz dla wszystkich klatek. Kadrowanie per klatka daje postac
# skaczaca w pionie - stopy nie stoja na tej samej linii.
def world_bbox_at(frame):
    scn.frame_set(frame)
    dg = bpy.context.evaluated_depsgraph_get()
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for o in MESHES:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            p = ev.matrix_world @ v.co
            for i in range(3):
                mn[i] = min(mn[i], p[i])
                mx[i] = max(mx[i], p[i])
        ev.to_mesh_clear()
    return mn, mx


MN = Vector((1e9, 1e9, 1e9))
MX = Vector((-1e9, -1e9, -1e9))
for f in FRAMES:
    mn, mx = world_bbox_at(f)
    for i in range(3):
        MN[i] = min(MN[i], mn[i])
        MX[i] = max(MX[i], mx[i])
CENTER = (MN + MX) / 2.0
RXY = max(MX.x - CENTER.x, MX.y - CENTER.y, CENTER.x - MN.x, CENTER.y - MN.y)
H = MX.z - MN.z
print(f"[bbox] wys={H:.3f} promienXY={RXY:.3f} srodek={tuple(round(v, 3) for v in CENTER)}")

# --- 4. Kamera ortograficzna ---
elev = math.radians(ELEV)
MARGIN = 1.10
frame_h = (H * math.cos(elev) + 2 * RXY * math.sin(elev)) * MARGIN
frame_w = 2 * RXY * MARGIN

cam_data = bpy.data.cameras.new("SpriteCam")
cam_data.type = "ORTHO"
cam_data.clip_start = 0.1
cam_data.clip_end = 500.0
cam = bpy.data.objects.new("SpriteCam", cam_data)
scn.collection.objects.link(cam)
scn.camera = cam
DIST = 100.0

scn.render.resolution_y = PX_H
scn.render.resolution_x = max(2, int(round(PX_H * frame_w / frame_h)))
# ortho_scale odnosi sie do WIEKSZEGO wymiaru renderu
cam_data.ortho_scale = frame_h if scn.render.resolution_y >= scn.render.resolution_x else frame_w


def place_camera(azimuth_deg):
    """azimuth 0 = kamera po stronie -Y, czyli postac patrzy w kamere ("down")."""
    a = math.radians(azimuth_deg)
    d = Vector((math.sin(a) * math.cos(elev), -math.cos(a) * math.cos(elev), math.sin(elev)))
    cam.location = CENTER + d * DIST
    cam.rotation_euler = (math.pi / 2 - elev, 0.0, a)


# --- 5. Workbench: plaskie, przewidywalne, z konturem obiektu ---
scn.render.engine = "BLENDER_WORKBENCH"
sh = scn.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
sh.show_object_outline = True
sh.object_outline_color = (0.05, 0.03, 0.03)
sh.show_shadows = False
sh.show_cavity = True
sh.cavity_type = "BOTH"
scn.display.render_aa = "8"
# ⚠ Bez tego Blender naklada transformacje widoku (AgX) i kolory na wyjsciu NIE
# sa tymi z palety - biel koszuli wychodzi szaroscia, a kwantyzacja do palety
# gry snapuje ja do zupelnie innej rampy.
scn.view_settings.view_transform = "Standard"
scn.view_settings.look = "None"
scn.render.film_transparent = True
scn.render.image_settings.file_format = "PNG"
scn.render.image_settings.color_mode = "RGBA"
scn.render.resolution_percentage = 100
print(f"[render] {scn.render.resolution_x}x{scn.render.resolution_y} elev={ELEV} klatki={FRAMES}")

for name in WANT:
    place_camera(AZIMUTHS[name])
    for f in FRAMES:
        scn.frame_set(f)
        scn.render.filepath = os.path.join(OUT, f"{name}_{f:02d}.png")
        bpy.ops.render.render(write_still=True)
# --- 6. Drugi przebieg: MASKA STREF ---
# Plaskie swiatlo, bez konturu i bez cavity, wiec kazdy piksel ma DOKLADNY kolor
# swojego materialu. Sluzy tylko do rozpoznania, ktora strefa (skora/koszula/
# spodnie/wlosy/buty) jest w danym pikselu. Bez tego kwantyzacja szuka
# najblizszego koloru w calej palecie i CALA KATEGORIA potrafi uciec: paleta
# Character.png ma kilkanascie szarosci i tylko piec tonow cieplych, wiec
# zacieniona skora ladowala w szarosciach koszuli.
sh.light = "FLAT"
sh.show_object_outline = False
sh.show_cavity = False
for name in WANT:
    place_camera(AZIMUTHS[name])
    for f in FRAMES:
        scn.frame_set(f)
        scn.render.filepath = os.path.join(OUT, f"{name}_{f:02d}_id.png")
        bpy.ops.render.render(write_still=True)

# Kolory stref lecą do JSON obok klatek - `build_char3d.py` czyta je stamtad,
# zamiast trzymac druga kopie palety, ktora rozjechalaby sie po cichu.
import json  # noqa: E402
with open(os.path.join(OUT, "strefy.json"), "w", encoding="utf-8") as fh:
    json.dump(char3d_zones.PAL_SRGB, fh)

print("[gotowe]", OUT)

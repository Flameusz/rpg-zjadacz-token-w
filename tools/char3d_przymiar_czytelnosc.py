"""PRZYMIAR: ile tarcza zaslania POSTAC. Raport, nic nie zapisuje.

    blender -b public/assets/char.blend --python tools/char3d_przymiar_czytelnosc.py \\
        -- <katalog> [konstrukcja[,...]] [round=56,...]

-- Po co --------------------------------------------------------------------
Kryterium „tarcza zaslania za duzo gracza" jest MIERZALNE i nie trzeba go
oceniac na oko. Liczymy dwie rzeczy w pozie GUARD, z przodu:

    zaslona   — jaka czesc sylwetki postaci znika za tarcza
    glowa     — jaka czesc GLOWY znika za tarcza

⚠ Glowa jest osobno, bo to ona niesie czytelnosc postaci: tarcza zakrywajaca
tors jest w porzadku (od tego jest), tarcza wchodzaca na glowe zabiera graczowi
punkt odniesienia. W benchmarkach gatunku (WoW / Metin / Stronghold) glowa
zostaje widoczna niemal zawsze.

-- Jak ----------------------------------------------------------------------
Dwa rendery na wariant: SAMA POSTAC i SAMA TARCZA, oba z przezroczystym tlem.
Zaslona to `|ciało ∩ tarcza| / |ciało|` — liczone z masek alfa, wiec nie zalezy
od koloru ani od swiatla.
⛔ Nie porownuj kolorow miedzy renderami: drewno i skora bywaja o kilka
szczebli od siebie, a cien na koszuli potrafi trafic w ton tarczy.
"""
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
TYLKO = _arg[1].split(",") if len(_arg) > 1 and _arg[1] else None
NADPISZ = _arg[2] if len(_arg) > 2 else None
os.makedirs(OUT, exist_ok=True)

# Ile GORNEJ czesci sylwetki liczymy jako "glowa". Zmierzone na modelu:
# glowa + szyja to ~21% wysokosci postaci (12,834 j., glowa ~2,7 j.).
UDZIAL_GLOWY = 0.21
KLATKA = 5      # BEZRUCH — poza stojaca, nie klatka cyklu chodu

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()

bronie = char3d_weapons.zbuduj_wszystkie(arm)
for o in bronie.values():
    o.hide_render = True
bronie["sword"].hide_render = False

if NADPISZ:
    for para in NADPISZ.split(","):
        k, cm = para.split("=")
        h, _w = shield_shapes.KONSTRUKCJE[k]["cm"]
        shield_shapes.KONSTRUKCJE[k]["skala_gry"] = float(cm) / h

tarcze = char3d_shields.zbuduj_wszystkie(arm)
for o in tarcze.values():
    o.hide_render = True
CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]

char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True, tarcza=True, walka=True)
arm.animation_data.action = bpy.data.actions["Walk_Armed_Shielded_Combat"]
scn.frame_set(KLATKA)
bpy.context.view_layer.update()

scn.render.resolution_x, scn.render.resolution_y = 300, 510
scn.render.film_transparent = True      # ⚠ maski licza sie z ALFY
scn.render.image_settings.color_mode = "RGBA"

cam = bpy.data.objects.get("Kamera_czytelnosc")
if cam is None:
    cam = bpy.data.objects.new("Kamera_czytelnosc", bpy.data.cameras.new("Kamera_czytelnosc"))
    scn.collection.objects.link(cam)
scn.camera = cam
cam.data.type = "ORTHO"

dg = bpy.context.evaluated_depsgraph_get()
mn = Vector((1e9, 1e9, 1e9))
mx = Vector((-1e9, -1e9, -1e9))
for ob in CIALO:
    oe = ob.evaluated_get(dg)
    me = oe.to_mesh()
    for v in me.vertices:
        p = ob.matrix_world @ v.co
        for i in range(3):
            mn[i] = min(mn[i], p[i])
            mx[i] = max(mx[i], p[i])
    oe.to_mesh_clear()
C = (mn + mx) * 0.5
cam.data.ortho_scale = (mx.z - mn.z) * 1.30
cam.location = (C.x, C.y - 40.0, C.z)
cam.rotation_euler = (1.5708, 0.0, 0.0)


def maska(nazwa):
    """Renderuje do pliku i zwraca maske alfy jako tablice bool."""
    sciezka = os.path.join(OUT, nazwa + ".png")
    scn.render.filepath = sciezka
    bpy.ops.render.render(write_still=True)
    obraz = bpy.data.images.load(sciezka)
    piks = np.array(obraz.pixels[:]).reshape(obraz.size[1], obraz.size[0], 4)
    bpy.data.images.remove(obraz)
    return piks[:, :, 3] > 0.05


# --- 1. sama postac (bez tarczy) ---
for o in tarcze.values():
    o.hide_render = True
CIALO_MASKA = maska("_cialo")
wiersze = np.where(CIALO_MASKA.any(axis=1))[0]
# UWAGA: obraz z Blendera ma wiersz 0 na DOLE, wiec „gora" to MAX indeksu.
gora, dol = wiersze.max(), wiersze.min()
prog_glowy = gora - (gora - dol) * UDZIAL_GLOWY
GLOWA = np.zeros_like(CIALO_MASKA)
GLOWA[int(prog_glowy):, :] = True
GLOWA &= CIALO_MASKA

ile_ciala = int(CIALO_MASKA.sum())
ile_glowy = int(GLOWA.sum())
print(f"\nsylwetka postaci: {ile_ciala} px, z tego glowa {ile_glowy} px "
      f"({100.0 * ile_glowy / ile_ciala:.0f}%)\n")
print(f"{'tarcza':<10} {'cm':>8} {'zaslona ciala':>15} {'zaslona glowy':>15}")
print("-" * 52)

for t in (TYLKO or list(shield_shapes.KONSTRUKCJE)):
    for o in tarcze.values():
        o.hide_render = True
    # SAMA TARCZA: gasimy cialo i bron, zeby maska byla czysta.
    for o in CIALO + [bronie["sword"]]:
        o.hide_render = True
    tarcze[t].hide_render = False
    M = maska("_tarcza_" + t)
    for o in CIALO:
        o.hide_render = False
    bronie["sword"].hide_render = False

    zas_cialo = 100.0 * float((CIALO_MASKA & M).sum()) / max(ile_ciala, 1)
    zas_glowa = 100.0 * float((GLOWA & M).sum()) / max(ile_glowy, 1)
    h_cm, w_cm = shield_shapes.wymiar_cm(t)
    print(f"{t:<10} {f'{h_cm:.0f}×{w_cm:.0f}':>8} {zas_cialo:>14.1f}% {zas_glowa:>14.1f}%")

print("\n⚠ To jest POMIAR, nie prog. Ile wolno zaslonic, jest decyzja autora.")

"""PODGLAD: profil CARRY dla duzych tarcz — do OGLADANIA, nie do liczenia.

    blender -b public/assets/char.blend --python tools/char3d_podglad_carry_duza.py -- <katalog>

Renderuje kazda z szesciu konstrukcji w pozie CARRY (przod + bok), przy czym
tarcze LARGE dostaja kolejno kilka kandydatow na wlasny cel dloni.

UWAGA UWAGA: **ISTNIEJE, BO RAPORT NIE ROZSTRZYGA TEJ DECYZJI.** Przymiar
`char3d_przymiar_carry_duza.py` pokazal, ze kryterium `dY` (kalibrowane pod
tarcze z chwytem SRODKOWYM w pozie zwisajacej) odrzuca kazdego kandydata dla
migdalowej i pawezy — a jednoczesnie grunt i przenikanie sa czyste. To jest
dokladnie ten moment, w ktorym `tools/CLAUDE.md` mowi: PATRZ NA RENDER.
"""
import os
import sys

import bpy
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
# Opcjonalnie: lista konstrukcji do wyrenderowania (domyslnie wszystkie).
TYLKO = _arg[1].split(",") if len(_arg) > 1 else None
# Rozdzielczosc renderu. UWAGA: ocene CZYTELNOSCI robi sie w BUFORZE GRY
# (96x128, `Character3D.RENDER_W/H`) i powieksza bez wygladzania - przy 3x
# tej wielkosci fasetki konturu widac tam, gdzie gracz ich nie zobaczy.
RES = _arg[2] if len(_arg) > 2 else "300x510"
# Opcjonalnie: nadpisz `skala_gry` jednej konstrukcji, np. "round=56".
# UWAGA: to jest PRZYMIAR — nadpisanie dziala tylko w pamieci tej sesji
# Blendera i NIC nie zapisuje. Docelowa wartosc wpisuje sie do
# `shield_shapes.SKALA_ROUND`.
NADPISZ = _arg[3] if len(_arg) > 3 else None
os.makedirs(OUT, exist_ok=True)

# Kandydaci na poze LARGE. `None` = poza SMALL (dzisiejsza), do porownania.
KANDYDACI = {
    "A_small": None,
    "D_minimum": (2.20, 0.45, -5.80),
}
KLATKA = 5          # BEZRUCH — poza stojaca, a nie klatka cyklu chodu.

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()

# Tarczy nie oglada sie samej — miecz w prawej rece jest najgorszym
# przypadkiem dla pary "bron + tarcza".
bronie = char3d_weapons.zbuduj_wszystkie(arm)
for o in bronie.values():
    o.hide_render = True
bronie["sword"].hide_render = False

if NADPISZ:
    _k, _cm = NADPISZ.split("=")
    _h, _w = shield_shapes.KONSTRUKCJE[_k]["cm"]
    shield_shapes.KONSTRUKCJE[_k]["skala_gry"] = float(_cm) / _h
    print(f"[przymiar] {_k}: {_h} cm -> {_cm} cm "
          f"(skala {shield_shapes.KONSTRUKCJE[_k]['skala_gry']:.4f})")

tarcze = char3d_shields.zbuduj_wszystkie(arm)
for o in tarcze.values():
    o.hide_render = True

CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]
DUZE = [k for k, v in shield_shapes.KONSTRUKCJE.items() if v["profil"] == "LARGE"]

scn.render.resolution_x, scn.render.resolution_y = [int(v) for v in RES.split("x")]
scn.render.film_transparent = False

cam = bpy.data.objects.get("Kamera_podgladu")
if cam is None:
    dane = bpy.data.cameras.new("Kamera_podgladu")
    cam = bpy.data.objects.new("Kamera_podgladu", dane)
    scn.collection.objects.link(cam)
scn.camera = cam
cam.data.type = "ORTHO"


def _kadr(widok):
    """Ustaw kamere na cala postac; `widok` to 'przod' albo 'bok'."""
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
    wys = (mx.z - mn.z) * 1.30
    cam.data.ortho_scale = wys
    if widok == "przod":
        cam.location = (C.x, C.y - 40.0, C.z)
        cam.rotation_euler = (1.5708, 0.0, 0.0)
    else:
        cam.location = (C.x + 40.0, C.y, C.z)
        cam.rotation_euler = (1.5708, 0.0, 1.5708)


oryginal = char3d_chod.NIESIENIE_TARCZA_SPOCZYNEK
for etykieta, cel in KANDYDACI.items():
    char3d_chod.NIESIENIE_TARCZA_SPOCZYNEK = cel or oryginal
    char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True,
                                      tarcza=True, walka=False)
    arm.animation_data.action = bpy.data.actions["Walk_Armed_Shielded"]
    scn.frame_set(KLATKA)
    bpy.context.view_layer.update()
    # Przy etykiecie A pokazujemy WSZYSTKIE szesc (to jest stan wyjsciowy),
    # przy pozostalych tylko te, ktorych poza LARGE dotyczy.
    ktore = list(shield_shapes.KONSTRUKCJE) if cel is None else DUZE
    if TYLKO:
        ktore = [t for t in ktore if t in TYLKO]
    for t in ktore:
        for o in tarcze.values():
            o.hide_render = True
        tarcze[t].hide_render = False
        for widok in ("przod", "bok"):
            _kadr(widok)
            scn.render.filepath = os.path.join(OUT, f"{etykieta}_{t}_{widok}.png")
            bpy.ops.render.render(write_still=True)

char3d_chod.NIESIENIE_TARCZA_SPOCZYNEK = oryginal

# GUARD — wspolny dla wszystkich szesciu, bez zmian. Renderujemy go, bo raport
# mowi "zielony", a regula numer jeden mowi PATRZ NA RENDER.
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True,
                                  tarcza=True, walka=True)
arm.animation_data.action = bpy.data.actions["Walk_Armed_Shielded_Combat"]
scn.frame_set(KLATKA)
bpy.context.view_layer.update()
for t in (TYLKO or list(shield_shapes.KONSTRUKCJE)):
    for o in tarcze.values():
        o.hide_render = True
    tarcze[t].hide_render = False
    for widok in ("przod", "bok"):
        _kadr(widok)
        scn.render.filepath = os.path.join(OUT, f"G_guard_{t}_{widok}.png")
        bpy.ops.render.render(write_still=True)

print(f"[gotowe] {OUT} kandydaci={list(KANDYDACI)} duze={DUZE} + GUARD")

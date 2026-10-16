"""MANEKIN TRENINGOWY 3D — model zamiast arkusza 2D (2026-10-11).

Po przejściu świata na 3D manekin u Patryczka był jedynym płaskim obrazkiem
wśród modeli (zgłoszone z telefonu autora). Logika zostaje przy encji
(`TrainingDummy`), model rysuje `Creature3D` — ta sama droga co zwierzęta.

Uruchomienie (Blender bez okna):
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P tools/dummy3d.py
    ... -- --zapisz      (zapis .glb; domyślnie tylko raport)

Budowa: pal w ziemi na krzyżaku, poprzeczka na ramiona, słomiany korpus
przewiązany powrozem, głowa z worka. Drewno ze WSPÓLNEGO standardu
(`tools/wood_palette.py`) — manekin stoi obok tarcz i drzewców z tej samej
rampy, więc nie może dorobić sobie własnych brązów.

Dwa klipy, oba jako animacja OBIEKTU (bez szkieletu — three.js odtwarza ją
z glTF bez skinningu):
  * `Idle` — bezruch;
  * `Hit`  — zachwianie na każde trafienie: wychył w bok i dwa wygasające
    odbicia, ~0,6 s. Obrót wokół PODSTAWY (początek obiektu = grunt), w bok,
    bo z kamery z góry wychył przód–tył czyta się tylko jako zmiana długości.

⚠ Skala: wzrost ~13,9 j. W ŚWIECIE. Wymiary niżej są w j. PLIKU postaci
(~8,4 j., jak `NPC_3D.wzrost`), ale postać ma armaturę w skali 1,6527
(nienaruszalnej) i tyle naprawdę mierzy na ekranie — model bez szkieletu musi
dostać tę skalę w wierzchołkach. Pierwsza wersja jej nie miała i manekin
stał w grze na wysokość pasa gracza (zmierzone na renderze 2026-10-11).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from tree3d import Siatka, _kula, _mix, _rura, do_blendera, material  # noqa: E402
import wood_palette as W  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ZAPISZ = "--zapisz" in argv
CEL = os.path.join(ROOT, "public", "assets", "props", "training_dummy.glb")
FPS = 24
# Skala armatury postaci (`char.blend`, nienaruszalna) — patrz nagłówek.
SKALA_POSTACI = 1.6527
MAX_TROJKATOW = 1600

# Wymiary (j.)
PAL_H = 7.0
KRZYZAK = 1.7
RAMIONA_Z, RAMIONA_POL = 5.55, 2.5
KORPUS_DOL, KORPUS_GORA = 3.1, 6.3
KORPUS_RX, KORPUS_RY = 1.25, 0.85
GLOWA_Z, GLOWA_R = 7.55, 0.85

SLOMA = dict(dol=(150, 120, 60), gora=(214, 186, 108))
POWROZ = (96, 72, 40)
WOREK = dict(dol=(132, 104, 70), gora=(184, 152, 108))


def elipsoida(s, c, rx, ry, rz, kol_dol, kol_gora, podzial=2, opaski=()):
    """Bryła z kuli: gradient pionowy, opcjonalne ciemne opaski (powróz)."""
    baza, sciany = _kula(1.0, podzial)
    start = len(s.v)
    for d in baza:
        p = Vector((c.x + d.x * rx, c.y + d.y * ry, c.z + d.z * rz))
        kol = _mix(kol_dol, kol_gora, 0.5 + 0.5 * d.z)
        for z_op, grub in opaski:
            if abs(p.z - z_op) < grub:
                kol = POWROZ
        n = Vector((d.x / rx, d.y / ry, d.z / rz)).normalized()
        s.w(p, kol, n)
    for f in sciany:
        s.f.append(tuple(start + i for i in f))


def zbuduj():
    s = Siatka()
    ciemne, baza, jasne = W.ton(5), W.ton(7, 1), W.ton(9)
    # pal i krzyżak (stopa w ziemi)
    _rura(s, Vector((0, 0, 0)), Vector((0, 0, PAL_H)), 0.30, 0.26, 8, ciemne, jasne)
    _rura(s, Vector((-KRZYZAK, 0, 0.18)), Vector((KRZYZAK, 0, 0.18)), 0.20, 0.20, 6, ciemne, baza)
    _rura(s, Vector((0, -KRZYZAK, 0.18)), Vector((0, KRZYZAK, 0.18)), 0.20, 0.20, 6, ciemne, baza)
    # poprzeczka na ramiona
    _rura(s, Vector((-RAMIONA_POL, 0, RAMIONA_Z)), Vector((RAMIONA_POL, 0, RAMIONA_Z)), 0.21, 0.21, 6,
          baza, jasne)
    # korpus ze słomy, przewiązany w dwóch miejscach
    srodek = Vector((0, 0, (KORPUS_DOL + KORPUS_GORA) / 2))
    rz = (KORPUS_GORA - KORPUS_DOL) / 2
    elipsoida(s, srodek, KORPUS_RX, KORPUS_RY, rz, SLOMA["dol"], SLOMA["gora"],
              opaski=((srodek.z - rz * 0.45, 0.16), (srodek.z + rz * 0.5, 0.16)))
    # głowa z worka + wiązanie pod nią
    elipsoida(s, Vector((0, 0, GLOWA_Z)), GLOWA_R, GLOWA_R * 0.92, GLOWA_R, WOREK["dol"], WOREK["gora"],
              opaski=((GLOWA_Z - GLOWA_R * 0.78, 0.14),))
    for i, v in enumerate(s.v):
        s.v[i] = v * SKALA_POSTACI
    return s


def klip(ob, nazwa, klatki):
    """Akcja obrotu obiektu wokół osi Y (w bok) z listy (klatka, stopnie)."""
    akcja = bpy.data.actions.new(nazwa)
    akcja.use_fake_user = True
    ob.animation_data.action = akcja
    for f, st in klatki:
        ob.rotation_euler = (0.0, math.radians(st), 0.0)
        ob.keyframe_insert(data_path="rotation_euler", frame=f)
    # ⚠ Ścieżka NLA na każdą akcję — eksporter w trybie ACTIONS bierze akcje
    #   przypięte do obiektu; sama `use_fake_user` nie wystarcza.
    tor = ob.animation_data.nla_tracks.new()
    tor.name = nazwa
    tor.strips.new(nazwa, int(klatki[0][0]), akcja)
    tor.mute = True
    ob.animation_data.action = None
    return akcja


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    s = zbuduj()
    tr = s.trojkaty()
    wys = max(v.z for v in s.v)
    print(f"[manekin] wierzchołki {len(s.v)}, trójkąty {tr} (limit {MAX_TROJKATOW}), wzrost {wys:.2f} j.")
    if tr > MAX_TROJKATOW:
        raise SystemExit("BLAD: za dużo trójkątów")
    ob = do_blendera("Manekin", s, material())
    ob.animation_data_create()
    klip(ob, "Idle", [(0, 0.0), (12, 0.0)])
    # Wychył w bok i dwa wygasające odbicia — ~0,6 s przy 24 fps.
    klip(ob, "Hit", [(0, 0.0), (3, -13.0), (7, 7.0), (10, -3.0), (14, 0.0)])
    ob.rotation_euler = (0.0, 0.0, 0.0)
    if ZAPISZ:
        for o in bpy.context.scene.objects:
            o.select_set(o == ob)
        bpy.ops.export_scene.gltf(
            filepath=CEL, export_format="GLB", use_selection=True, export_yup=True,
            export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True,
            export_frame_step=1, export_skins=False, export_morph=False,
            export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_apply=False)
        print(f"[zapis] {CEL} {os.path.getsize(CEL)} bajtów")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: -- --zapisz")


if __name__ == "__main__":
    main()

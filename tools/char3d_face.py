"""TWARZ Z PIXEL-ARTU rzutowana na przód głowy (2026-10-10).

Moduł BLENDEROWY — wołany przez `tools/npc3d.py` (mieszkańcy, twarz z ich
portretu 2D) i `tools/char3d_export_gltf.py` (gracz, twarz z
`tools/build_player_face.py`). Jedno miejsce rzutu, żeby gracz i wieś nie
rozjechały się przy pierwszej poprawce.

⭐ Wyraz pixel-artu to RĘCZNIE postawione piksele (brwi, oczy, cień nosa,
broda z fakturą) — geometria i kolor na wierzchołek tego nie dadzą. Przód
głowy dostaje teksturę w rzucie z przodu, próbkowaną OSTRO.

`tw`: `portret` (plik w `characters/`), `srodek_x` (kolumna osi twarzy),
`oczy_y` (wiersz oczu), `broda_y` (dolna krawędź podbródka), `pol_szer`
(pół szerokości głowy w px). Oczy obrazka idą na `glowa_linia_oczu`,
podbródek na podbródek modelu.

⚠ `lustro_u`: głowa z NIEZASTOSOWANYM modyfikatorem lustra (gracz) ma
wierzchołki tylko jednej połowy. Wtedy oś twarzy MUSI leżeć na środku obrazka
(`srodek_x` = W/2), a lustro dostaje odbicie UV — druga połowa twarzy bierze
odbitą połowę obrazka. Mieszkańcy mają lustro już zastosowane (oba boki
prawdziwe), więc `lustro_u=False`.
"""
import os

import bpy

import char3d_hair as wlosy
import char3d_zones as strefy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def naloz_twarz(P, tw, lustro_u=False, glowa=None):
    glowa = glowa or bpy.data.objects["Cube"]
    arm = bpy.data.objects["Armature"]
    tryb = arm.data.pose_position
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    wys, broda, pw, _pg = wlosy._glowa_geom(P)
    img = bpy.data.images.load(os.path.join(ROOT, "public", "assets", "characters", tw["portret"]),
                               check_existing=True)
    W, Hh = img.size
    if lustro_u and abs(tw["srodek_x"] - W / 2) > 1e-6:
        raise SystemExit(f"BŁĄD: twarz z lustrem UV wymaga osi na środku obrazka "
                         f"(srodek_x {tw['srodek_x']} ≠ {W / 2})")
    mat = bpy.data.materials.new("Z_twarz")
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    tex = tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"              # piksele portretu, nie rozmycie
    tree.nodes.active = tex                    # Workbench (podgląd) pokazuje AKTYWNY węzeł obrazu
    tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    me = glowa.data
    me.materials.append(mat)
    mi = len(me.materials) - 1
    uv = me.uv_layers.get("UVMap") or me.uv_layers.new(name="UVMap")
    idx = {strefy.ZONES.index(z) for z in ("skin", "eyes", "mouth")}
    mw = glowa.matrix_world
    # ⚠ PRZÓD wybierany po POŁOŻENIU, nie po normalnej: normalne siatki głowy
    #   są odwrócone (oko z przodu, y −1,1, ma normalną +y) — filtr po
    #   normalnej oteksturował TYŁ głowy, a twarz została gładka.
    yc = sum((mw @ v.co).y for v in me.vertices) / len(me.vertices)
    k = P["glowa_linia_oczu"] / (tw["broda_y"] - tw["oczy_y"])     # t na piksel
    ile = 0
    for poly in me.polygons:
        if poly.material_index not in idx:
            continue
        c = mw @ poly.center
        t = (c.z - broda) / wys
        # bez skrajnych boków i ponad linią włosów: tam portret ma KONTUR i włosy
        if (c.y - yc) > -0.45 * _pg or abs(c.x) > 0.82 * pw or t < -0.05 or t > P["glowa_linia_wlosow"] + 0.05:
            continue
        poly.material_index = mi
        ile += 1
        for li in poly.loop_indices:
            v = mw @ me.vertices[me.loops[li].vertex_index].co
            upx = tw["srodek_x"] + v.x / pw * tw["pol_szer"]
            vpx = tw["broda_y"] - ((v.z - broda) / wys) / k
            uv.data[li].uv = (upx / W, 1.0 - vpx / Hh)
    if lustro_u:
        for md in glowa.modifiers:
            if md.type == "MIRROR":
                md.use_mirror_u = True
                md.mirror_offset_u = 0.0
    arm.data.pose_position = tryb
    bpy.context.view_layer.update()
    print(f"[twarz] {tw['portret']}: {ile} wielokątów przodu głowy z teksturą ({W}×{Hh})"
          f"{', lustro UV' if lustro_u else ''}")
    return ile

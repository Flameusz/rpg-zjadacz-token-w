"""ODZIEŻ, której nie da się zrobić powłoką ciała (2026-10-09, pilot NPC: Mama).

Moduł BLENDEROWY — importowany przez `tools/npc3d.py`, nie uruchamiany sam.

Pancerz i ubrania z katalogu (`char3d_armor`) to KOPIE fragmentów ciała —
nogawki obejmują każdą nogę osobno. **Spódnica obejmuje obie nogi naraz**, więc
jest osobną bryłą: loft pierścieni od bioder do kostek, rozszerzany ku dołowi
(kloszowo), skinowany do miednicy z domieszką ud — idzie za ciałem, a w kroku
lekko za nogą po swojej stronie.

⭐ Fartuch to PLAMA KOLORU na przodzie spódnicy (kolory wierzchołków, ta sama
droga co wzór pancerza) + minimalne odsunięcie — przy 60 px postaci to jasny
prostokąt na ciemnej sukni, czyli to, co czyta się z kamery gry.
"""
import math

import bpy
from mathutils import Vector

import char3d_base as baza
from char3d_zones import _lin, _ustaw_kolor

PRZEDROSTEK = "Odziez_"


def _material(nazwa, srgb):
    m = bpy.data.materials.get(nazwa) or bpy.data.materials.new(nazwa)
    _ustaw_kolor(m, (*[_lin(c) for c in srgb], 1.0))
    m.roughness = 0.9
    m.metallic = 0.0
    m.use_backface_culling = False
    tree = m.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    wezel = next((n for n in tree.nodes if n.type == "VERTEX_COLOR"), None) or tree.nodes.new("ShaderNodeVertexColor")
    wezel.layer_name = "Col"
    tree.links.new(wezel.outputs["Color"], bsdf.inputs["Base Color"])
    return m


def spodnica(P, kolor, gora=0.50, dol=0.055, poszerzenie=1.55, fartuch=None, n=32, rzedy=10, na_brzuchu=False):
    """Spódnica od `gora` do `dol` (ułamki wzrostu). `fartuch` = (kolor sRGB,
    szerokość kątowa rad, góra, dół) albo None. Zwraca obiekt.

    `na_brzuchu`: górny obwód z TALII, gdy jest szersza od bioder (poły
    sukmany karczmarza). ⚠ Bez tego poły zaczynały się węższe niż brzuch,
    a brzeg kaftana nad nimi odstawał poziomo jak talerz (review 2026-10-10)."""
    H, Z0 = baza.WYSOKOSC, baza.PODLOGA
    arm = bpy.data.objects["Armature"]
    # górny promień: biodra + zapas nad powłoką sukni/koszuli
    w0 = H * P["biodro_polszer"] * 1.12
    d0 = H * P["biodro_glebokosc"] * 1.25
    if na_brzuchu:
        w0 = max(w0, H * P["talia_polszer"] * 1.05)
        d0 = max(d0, H * P["talia_glebokosc"] * 1.05)
    # dolny: musi objąć stopy w rozkroku bezruchu (rozstaw nóg + stopa)
    w1 = max(w0 * poszerzenie, H * (P["noga_polrozstaw"] + P["stopa_szerokosc"] * 0.9))
    d1 = max(d0 * poszerzenie, H * P["stopa_dlugosc"] * 0.75)
    verts, faces, wagi, cien = [], [], [], []
    fk, f_kat, f_gora, f_dol = (fartuch or (None, 0.0, 0.0, 0.0))

    def warstwa(skala):
        start = len(verts)
        for j in range(rzedy + 1):
            v = j / rzedy                          # 0 góra, 1 dół
            z = Z0 + H * (gora + (dol - gora) * v)
            k = v ** 1.15
            w, d = w0 + (w1 - w0) * k, d0 + (d1 - d0) * k
            for i in range(n):
                a = 2 * math.pi * i / n            # 0 = tył (+Y), π = przód (−Y)
                fald = 1.0 + 0.035 * math.sin(a * 9) * v       # fałdy rosnące ku dołowi
                przod = math.cos(a - math.pi)                   # 1 = środek przodu
                na_fartuchu = fk is not None and abs(math.atan2(math.sin(a - math.pi), math.cos(a - math.pi))) < f_kat \
                    and f_gora >= (gora + (dol - gora) * v) >= f_dol
                odsun = 1.025 if na_fartuchu else 1.0
                x = math.sin(a) * w * skala * fald * odsun
                y = math.cos(a) * d * skala * fald * odsun
                verts.append(Vector((x, y, z)))
                # wagi: góra = miednica; niżej domieszka uda po swojej stronie
                udo = 0.55 * k
                strona = 0.5 + 0.5 * max(-1.0, min(1.0, x / max(w, 1e-6)))
                wagi.append({"Bone": 1.0 - udo, "Bone_L.001": udo * strona, "Bone_R.001": udo * (1 - strona)})
                jas = (0.9 + 0.1 * (0.5 + 0.5 * math.sin(a * 9 + 1.0))) * (0.92 + 0.08 * max(0.0, przod))
                cien.append((fk, jas * 1.05) if na_fartuchu else (None, jas if skala >= 1.0 else 0.6))
        return start

    zew = warstwa(1.0)
    wew = warstwa(0.97)

    def idx(s, j, i):
        return s + j * n + (i % n)

    for j in range(rzedy):
        for i in range(n):
            faces.append((idx(zew, j, i), idx(zew, j, i + 1), idx(zew, j + 1, i + 1), idx(zew, j + 1, i)))
            faces.append((idx(wew, j, i), idx(wew, j + 1, i), idx(wew, j + 1, i + 1), idx(wew, j, i + 1)))
    for i in range(n):     # brzeg u dołu i u góry
        faces.append((idx(zew, rzedy, i), idx(zew, rzedy, i + 1), idx(wew, rzedy, i + 1), idx(wew, rzedy, i)))
        faces.append((idx(zew, 0, i), idx(wew, 0, i), idx(wew, 0, i + 1), idx(zew, 0, i + 1)))

    nazwa = PRZEDROSTEK + "spodnica"
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)
    me = bpy.data.meshes.new(nazwa)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "OBJECT"
    tryb = arm.data.pose_position
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    ob.matrix_parent_inverse = arm.matrix_world.inverted()
    bpy.context.view_layer.update()
    me.transform(ob.matrix_world.inverted())
    arm.data.pose_position = tryb
    grupy = {}
    for i, w in enumerate(wagi):
        for kosc, wg in w.items():
            if wg <= 1e-4:
                continue
            g = grupy.get(kosc) or ob.vertex_groups.new(name=kosc)
            grupy[kosc] = g
            g.add([i], wg, "REPLACE")
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    kol = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, (k_wl, jas) in enumerate(cien):
        baz = k_wl or kolor
        kol.data[i].color = (*[min(1.0, _lin(c) * jas) for c in baz], 1.0)
    me.materials.append(_material("Z_" + nazwa, kolor))
    for p in me.polygons:
        p.use_smooth = True
    print(f"[odziez] {nazwa}: {len(me.vertices)} wierzch., {len(me.polygons)} wielok., "
          f"góra {gora:.2f} dół {dol:.2f}, dół {w1:.2f}×{d1:.2f} j.")
    return ob


def fartuch(P, kolor, gora, dol, polszer=0.11, oslona=None, odsun=0.14, kolumny=12, rzedy=14, szelki_on=True):
    """FARTUCH na przodzie tułowia i ud (młynarz, kowal, stolarz) — `gora`
    i `dol` w ułamkach wzrostu, `polszer` w ułamkach wzrostu (pół szerokości).

    Kształt NIE jest liczony z kotwic: promień z przodu pada na `oslona`
    (ciało + założone ubranie, poza spoczynkowa) i fartuch kładzie się `odsun`
    j. przed pierwszą trafioną powierzchnią. Dzięki temu leży na każdej
    sylwetce (`char3d_variants`) bez strojenia. Poniżej krocza promień
    przelatuje między nogami — tam fartuch WISI płasko, na głębokości
    najbardziej wysuniętego punktu swojego rzędu (tak wisi płótno).
    Skin: góra → kręgosłup, środek → miednica, dół → domieszka ud."""
    from mathutils.bvhtree import BVHTree
    H, Z0 = baza.WYSOKOSC, baza.PODLOGA
    arm = bpy.data.objects["Armature"]
    tryb = arm.data.pose_position
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    drzewa = []
    for ob in (oslona or [bpy.data.objects["Cube.001"]]):
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        pkt = [ev.matrix_world @ v.co for v in me.vertices]
        drzewa.append(BVHTree.FromPolygons(pkt, [tuple(p.vertices) for p in me.polygons]))
        ev.to_mesh_clear()

    def przod(x, z):
        """y przedniej powierzchni w (x, z) albo None (promień przeleciał)."""
        naj = None
        for d in drzewa:
            hit = d.ray_cast(Vector((x, -40.0, z)), Vector((0.0, 1.0, 0.0)), 80.0)
            if hit[0] is not None and (naj is None or hit[0].y < naj):
                naj = hit[0].y
        return naj

    verts, wagi, cien = [], [], []
    w = H * polszer
    krocze = P["krocze"]
    for j in range(rzedy + 1):
        u = j / rzedy                                   # 0 góra, 1 dół
        h = gora + (dol - gora) * u
        z = Z0 + H * h
        # płótno rozszerza się lekko ku dołowi
        ww = w * (0.92 + 0.16 * u)
        rzad = [przod(ww * (2 * i / kolumny - 1), z) for i in range(kolumny + 1)]
        trafione = [y for y in rzad if y is not None]
        plasko = min(trafione) if trafione else -H * P["biodro_glebokosc"]
        for i in range(kolumny + 1):
            x = ww * (2 * i / kolumny - 1)
            y = rzad[i] if (rzad[i] is not None and h > krocze + 0.02) else plasko
            # boki zawijają się lekko ku ciału
            brzeg = abs(2 * i / kolumny - 1)
            verts.append(Vector((x, y - odsun + 0.10 * brzeg ** 3, z)))
            udo = max(0.0, min(1.0, (P["biodro"] - h) / max(1e-6, P["biodro"] - dol)))
            kreg = max(0.0, min(1.0, (h - P["biodro"]) / max(1e-6, P["klatka"] - P["biodro"])))
            strona = 0.5 + 0.5 * max(-1.0, min(1.0, x / max(w, 1e-6)))
            wg = {"Bone": (1.0 - kreg) * (1.0 - 0.6 * udo), "Bone.001": kreg,
                  "Bone_L.001": 0.6 * udo * strona, "Bone_R.001": 0.6 * udo * (1 - strona)}
            wagi.append(wg)
            szew = 0.86 if (j == 0 or i in (0, kolumny)) else 1.0       # obszycie
            cien.append(szew * (0.95 + 0.05 * math.sin(i * 1.7 + j * 0.9)))

    # ⭐ SZELKI (review 2026-10-10): bez nich fartuch „wisiał w próżni" — z kamery
    #   z góry dwa paski przez barki łączą płachtę z sylwetką. Ten sam rzut
    #   promieni co płachta: od górnych rogów w górę przez bark przy szyi
    #   i w dół na plecy, odsunięte od ciała i ubrania.
    def rzut(o, d):
        naj = None
        for dr in drzewa:
            hit = dr.ray_cast(o, d, 80.0)
            if hit[0] is not None and (naj is None or hit[3] < naj[1]):
                naj = (hit[0], hit[3])
        return naj[0] if naj else None
    szelki = []                 # (punkty, oś szerokości) — pasek = łańcuch czworokątów
    if szelki_on:
        y_osi = (arm.matrix_world @ arm.data.bones["Bone.002"].head_local).y
        z_c = Z0 + H * gora
        x_rog = w * 0.92 * 0.68
        x_szyja = H * (P["szyja_promien"] + 0.035)
        z_kark = Z0 + H * (P["obojczyk"] + 0.012)
        sz = H * 0.016
        # ⭐ PĘTLA NA SZYJĘ (autor 2026-10-10: „szelki za plecami powinny się
        #   łączyć przy szyi — tak wygląda fartuch"): od rogów napierśnika w górę
        #   obok szyi, na karku oba paski schodzą się w osi. Pierwsza wersja
        #   biegła w dół pleców jak szelki od spodni.
        for znak in (-1.0, 1.0):
            pas = []
            for k in range(8):                                  # przód → szczyt barku przy szyi
                th = math.radians(-10 + 100 * k / 7)
                d = Vector((0.0, -math.cos(th), math.sin(th)))
                u = max(0.0, th / math.radians(90))
                x = znak * (x_rog + (x_szyja - x_rog) * min(1.0, u) ** 0.7)
                hit = rzut(Vector((x, y_osi, z_c)) + d * 30.0, -d)
                if hit is not None:
                    pas.append(hit + d * (odsun * 0.7))
            for k in range(1, 5):                               # kark: zejście do osi
                x = znak * x_szyja * (1.0 - k / 4)
                d = Vector((0.0, 1.0, 0.25)).normalized()
                hit = rzut(Vector((x, y_osi, z_kark)) + d * 30.0, -d)
                if hit is not None:
                    pas.append(hit + d * (odsun * 0.7))
            if len(pas) >= 2:
                szelki.append((pas, Vector((1.0, 0.0, 0.0))))
        # TROCZEK w pasie z tyłu: od boku do boku fartucha, wokół pleców
        z_pas = Z0 + H * (P["talia"] - 0.005)
        pas = []
        for k in range(13):
            fi = math.radians(-105 + 210 * k / 12)              # 0 = środek pleców (+Y)
            d = Vector((math.sin(fi), math.cos(fi), 0.0))
            hit = rzut(Vector((0.0, y_osi, z_pas)) + d * 30.0, -d)
            if hit is not None:
                pas.append(hit + d * (odsun * 0.6))
        if len(pas) >= 2:
            szelki.append((pas, Vector((0.0, 0.0, 1.0))))
        for pas, os_szer in szelki:
            for q in pas:
                for t in (-0.5, 0.5):
                    verts.append(q + os_szer * (sz * t))
                    wagi.append({"Bone.002": 1.0} if os_szer.z == 0.0 else {"Bone.001": 1.0})
                    cien.append(0.78)
    arm.data.pose_position = tryb
    bpy.context.view_layer.update()

    kol = kolumny + 1
    faces = []
    for j in range(rzedy):
        for i in range(kolumny):
            a, b = j * kol + i, (j + 1) * kol + i
            faces.append((a, b, b + 1, a + 1))
    start = (rzedy + 1) * kol
    for pas, _os in szelki:
        for n in range(len(pas) - 1):
            a, b = start + n * 2, start + (n + 1) * 2
            faces.append((a, a + 1, b + 1, b))
        start += len(pas) * 2
    nazwa = PRZEDROSTEK + "fartuch"
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)
    me = bpy.data.meshes.new(nazwa)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate()
    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "OBJECT"
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    ob.matrix_parent_inverse = arm.matrix_world.inverted()
    bpy.context.view_layer.update()
    me.transform(ob.matrix_world.inverted())
    arm.data.pose_position = tryb
    grupy = {}
    for i, wg in enumerate(wagi):
        for kosc, x in wg.items():
            if x <= 1e-4:
                continue
            g = grupy.get(kosc) or ob.vertex_groups.new(name=kosc)
            grupy[kosc] = g
            g.add([i], x, "REPLACE")
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    kc = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, jas in enumerate(cien):
        kc.data[i].color = (*[min(1.0, _lin(c) * jas) for c in kolor], 1.0)
    me.materials.append(_material("Z_" + nazwa, kolor))
    for p in me.polygons:
        p.use_smooth = True
    print(f"[odziez] {nazwa}: {len(me.vertices)} wierzch., od {gora:.2f} do {dol:.2f}, "
          f"pół szer. {w:.2f} j.")
    return ob


def pas_narzedzia(P, oslona, kolor=(66, 46, 34), odsun=0.10, narzedzia=True, szer=0.024, wys=None):
    """PAS Z NARZĘDZIAMI na fartuchu (Adrian, 2026-10-10 — wg pseudo-assetu
    autora): rzemień wokół talii położony rzutem promieni NA fartuch i strój,
    klamra z przodu, młotek przy prawym biodrze, szczypce przy lewym, sakwa
    z przodu. Bryły z prostopadłościanów — przy ~150 px postaci liczy się
    sylwetka i plama metalu, nie detal. Kolory bezwzględne w wierzchołkach
    (metal, drewno, skóra), materiał biały. Sztywno na miednicy (`Bone`)."""
    from mathutils.bvhtree import BVHTree
    H, Z0 = baza.WYSOKOSC, baza.PODLOGA
    arm = bpy.data.objects["Armature"]
    tryb = arm.data.pose_position
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    drzewa = []
    for ob in oslona:
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        drzewa.append(BVHTree.FromPolygons([ev.matrix_world @ v.co for v in me.vertices],
                                           [tuple(p.vertices) for p in me.polygons]))
        ev.to_mesh_clear()

    def rzut(o, d):
        naj = None
        for dr in drzewa:
            hit = dr.ray_cast(o, d, 80.0)
            if hit[0] is not None and (naj is None or hit[3] < naj[1]):
                naj = (hit[0], hit[3])
        return naj[0] if naj else None

    y0 = (arm.matrix_world @ arm.data.bones["Bone"].head_local).y
    # `wys`: (kotwica, delta) — szeroki pas karczmarza siedzi w TALII, na brzuchu
    z_pas = Z0 + H * ((P[wys[0]] + wys[1]) if wys else (P["biodro"] + 0.03))
    METAL, DREWNO, KLAMRA = (128, 128, 134), (122, 86, 52), (168, 160, 140)
    v, f, kol = [], [], []

    def pasek(punkty, wys, k):
        start = len(v)
        for p in punkty:
            for dz in (-wys / 2, wys / 2):
                v.append(p + Vector((0.0, 0.0, dz)))
                kol.append(k)
        for n in range(len(punkty) - 1):
            a, b = start + n * 2, start + (n + 1) * 2
            f.append((a, a + 1, b + 1, b))

    def klocek(sr, sx, sy, sz, k):
        s0 = len(v)
        for dx in (-sx / 2, sx / 2):
            for dy in (-sy / 2, sy / 2):
                for dz in (-sz / 2, sz / 2):
                    v.append(sr + Vector((dx, dy, dz)))
                    kol.append(k)
        for q in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
            f.append(tuple(s0 + i for i in q))

    # rzemień: pełny obwód (z tyłu pod troczkiem fartucha, z przodu NA nim)
    obwod = {}
    for k in range(25):
        fi = 2 * math.pi * k / 24
        d = Vector((math.sin(fi), math.cos(fi), 0.0))
        hit = rzut(Vector((0.0, y0, z_pas)) + d * 30.0, -d)
        if hit is not None:
            obwod[k] = hit + d * odsun
    punkty = [obwod[k] for k in sorted(obwod)]
    pasek(punkty, H * szer, kolor)
    przod = obwod.get(12)                       # fi = π → przód (−Y)
    if przod is not None:
        klocek(przod + Vector((0.0, -0.04, 0.0)), H * 0.030, 0.06, H * 0.026, KLAMRA)
    # młotek — prawe biodro (x < 0 to lewa strona obrazu z przodu; postać patrzy w −Y)
    for k_kat, rodzaj in (((15, "mlotek"), (9, "szczypce"), (13, "sakwa")) if narzedzia else ()):
        p = obwod.get(k_kat)
        if p is None:
            continue
        nz = Vector((p.x, p.y - y0, 0.0)).normalized() * 0.08
        if rodzaj == "mlotek":
            klocek(p + nz + Vector((0.0, 0.0, -H * 0.045)), H * 0.010, H * 0.010, H * 0.075, DREWNO)
            klocek(p + nz + Vector((0.0, 0.0, -H * 0.085)), H * 0.032, H * 0.016, H * 0.016, METAL)
        elif rodzaj == "szczypce":
            for dx in (-H * 0.006, H * 0.006):
                klocek(p + nz + Vector((dx, 0.0, -H * 0.055)), H * 0.006, H * 0.008, H * 0.10, METAL)
        else:
            klocek(p + nz * 1.2 + Vector((0.0, 0.0, -H * 0.028)), H * 0.040, H * 0.022, H * 0.040, kolor)
    arm.data.pose_position = tryb
    bpy.context.view_layer.update()

    nazwa = PRZEDROSTEK + "pas_narzedzia"
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)
    me = bpy.data.meshes.new(nazwa)
    me.from_pydata([tuple(x) for x in v], [], f)
    me.validate()
    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "OBJECT"
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    ob.matrix_parent_inverse = arm.matrix_world.inverted()
    bpy.context.view_layer.update()
    me.transform(ob.matrix_world.inverted())
    arm.data.pose_position = tryb
    g = ob.vertex_groups.new(name="Bone")
    g.add(list(range(len(me.vertices))), 1.0, "REPLACE")
    md = ob.modifiers.new("Armature", "ARMATURE")
    md.object = arm
    kc = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, k in enumerate(kol):
        kc.data[i].color = (*[_lin(c) for c in k], 1.0)
    me.materials.append(_material("Z_" + nazwa, (255, 255, 255)))
    print(f"[odziez] {nazwa}: {len(me.vertices)} wierzch., rzemień {len(punkty)} pkt na wys. {z_pas:.2f}")
    return ob

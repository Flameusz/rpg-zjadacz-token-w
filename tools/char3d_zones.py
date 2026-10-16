"""Strefy koloru dla char.blend: skora / wlosy / koszula / spodnie / buty.

Modul BLENDEROWY - importowany przez `char3d_blender.py`, nie uruchamiany sam.

Przypisanie idzie po WAGACH KOSCI, nie po pozycji wierzcholka w przestrzeni.
Pozycja klamie, gdy postac sie rusza: prog "to juz noga" wypada w innym miejscu
w kroku niz w bezruchu i strefy pelzaja miedzy klatkami tego samego cyklu.
Wagi sa przypiete do anatomii i nie zaleza od pozy.

⚠ Modul NIE zapisuje char.blend - zmienia tylko stan w pamieci sesji renderu.
"""
import bpy

# Paleta zmierzona w grafice MIESZKANCOW, w sRGB 8-bit (nie dobrana na oko).
#
# ⚠ ZRODLEM NIE JEST `Character.png`. Jego biala koszula i czarne spodnie w
# pixel-arcie 60 px czytaly sie jak zgrzebny strój, ale na gladko cieniowanym
# modelu 3D robia sie garniturem — zglaszone wprost: "wyglada jak adwokat".
# Wies jest slowianska, wczesnopiastowska (`docs/swiat.md`), wiec strojem jest
# niefarbowany len i ciemna welna, a nie biel z czernia.
#
# Kolory pochodza z realnych sprite'ow wsi (elder, peasant, father, hunter,
# blacksmith) — dzieki temu gracz nie odstaje od wlasnych sasiadow.
PAL_SRGB = {
    "skin":     (253, 176, 132),   # #fdb084  peasant.png
    "hair":     (55, 38, 29),      # #37261d  Character.png / NPC.png
    "shirt":    (177, 145, 107),   # #b1916b  elder.png — lniana tunika
    "trousers": (60, 58, 60),      # #3c3a3c  Character.png — ciemna welna
    "boots":    (95, 56, 42),      # #5f382a  elder.png — skora
    # Twarz. Oczy sa CIEMNE, nie biale: przy 9 px glowy biale bialkowki
    # zlewaja sie ze skora, a ciemna plamka czyta sie jako oko nawet na
    # dwoch pikselach. Ta sama zasada, co w pixel-artowych portretach.
    "eyes":     (38, 28, 26),      # #261c1a
    "mouth":    (146, 84, 72),      # #925448
}

def _lin(c):
    """sRGB 0-255 -> liniowe 0..1.

    ⚠ `material.diffuse_color` jest LINIOWE. Wpisanie tam wartosci sRGB wprost
    (0.969 dla #f7f7f7) daje w renderze szarosc zamiast bieli - biala koszula
    wychodzila w polowie jasnosci i po kwantyzacji siadala na #979797.
    """
    v = c / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


PAL = {z: (_lin(r), _lin(g), _lin(b), 1.0) for z, (r, g, b) in PAL_SRGB.items()}

# Kosc -> strefa. Kosci nienazwane w rigu, wiec mapa idzie po realnych nazwach.
# ⭐ BAZA W BIELIŹNIE — TORS (2026-10-03, pilot pancerza na modelu).
# Tułów i ramiona są SKÓRĄ: koszulę daje dziś przedmiot (`linen_shirt` itd.,
# `char3d_armor.POKRYCIE`), a nie kolor bazy — kierunek autora „model
# w bieliźnie, przedmioty nakładane jak w WoW" (2026-09-28). Nogi i stopy
# (krok 2, 2026-10-03) też są skórą — spodnie i buty dają przedmioty;
# miednica (`Bone`) zostaje na `trousers` i robi za BIELIZNĘ.
# ⛔ Strefy `shirt` NIE usuwaj z `ZONES` — kolejność listy to indeksy
# materiałów (patrz niżej); po prostu nie wskazuje jej dziś żadna kość.
BONE_ZONE = {
    "Bone": "trousers", "Bone.001": "skin", "Bone.002": "skin",
    "Bone.003": "skin", "Bone.004": "skin",
    "Bone_L.001": "skin", "Bone_L.002": "skin", "Bone_L.003": "skin",
    "Bone_R.001": "skin", "Bone_R.002": "skin", "Bone_R.003": "skin",
    "Bone_L.004": "skin", "Bone_R.004": "skin",
    "Bone.002_L": "skin", "Bone.002_L.001": "skin", "Bone.002_L.004": "skin",
    "Bone.002_L.002": "skin", "Bone.002_L.003": "skin", "Bone.002_L.006": "skin",
    "Bone.002_R": "skin", "Bone.002_R.001": "skin", "Bone.002_R.004": "skin",
    "Bone.002_R.002": "skin", "Bone.002_R.003": "skin", "Bone.002_R.006": "skin",
    "Bone.005": "trousers",
}
# ⚠ NOWE STREFY DOPISUJE SIE NA KONCU. Powloka `Solidify` bierze material
# o `material_offset=1` dalej, a pancerz i pre-render indeksuja te liste -
# wstawienie strefy w srodek przesuwa KAZDA kolejna o jeden slot.
ZONES = ["skin", "hair", "shirt", "trousers", "boots", "eyes", "mouth"]


def _ustaw_kolor(m, rgba):
    """Kolor materialu ustawiony w OBU miejscach, bo czytaja go dwa rozne odbiorniki.

    ⚠ `diffuse_color` to kolor PODGLADU (Workbench, czyli pre-render). Eksporter
    glTF go IGNORUJE — bierze `Base Color` z wezla Principled BSDF. Materiał bez
    tego wezla wyjezdza do .glb z domyslna biela i postac w grze jest cala biala,
    mimo ze pre-render wyglada poprawnie. Zlapane dopiero w grze.
    """
    m.diffuse_color = rgba
    tree = m.node_tree
    if tree is None:
        m.use_nodes = True
        tree = m.node_tree
    bsdf = next((n for n in tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
        wyjscie = next((n for n in tree.nodes if n.type == "OUTPUT_MATERIAL"), None)
        if wyjscie is None:
            wyjscie = tree.nodes.new("ShaderNodeOutputMaterial")
        tree.links.new(bsdf.outputs["BSDF"], wyjscie.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = rgba
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.9
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = 0.0


def _mats():
    out = []
    for z in ZONES:
        name = f"Z_{z}"
        m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        _ustaw_kolor(m, PAL[z])
        m.roughness = 0.9
        m.metallic = 0.0
        out.append(m)
    return out


def apply_zones(report=True):
    mats = _mats()
    idx = {z: i for i, z in enumerate(ZONES)}

    body = bpy.data.objects["Cube.001"]
    head = bpy.data.objects["Cube"]
    # Solidify w tym modelu to NIE pogrubienie - to inverted-hull outline:
    # odwrocone normalne + ujemna grubosc + material_offset=1, przez co powloka
    # bierze czarny Material.001. Przy wiekszej liczbie slotow ten offset
    # przesuwa KAZDA strefe o jeden material dalej. Do sprite'a kontur rysuje
    # Workbench, wiec powloke wylaczamy.
    for o in (body, head):
        for md in o.modifiers:
            if md.type == "SOLIDIFY":
                md.show_render = False
                md.show_viewport = False
                print(f"[fix] {o.name}: wylaczony Solidify (inverted-hull outline, material_offset={md.material_offset})")
    for o in (body, head):
        o.data.materials.clear()
        for m in mats:
            o.data.materials.append(m)

    # --- cialo: strefa = kosc o najwiekszej sumie wag w wielokacie ---
    gname = {g.index: g.name for g in body.vertex_groups}
    counts = {z: 0 for z in ZONES}
    unmapped = set()
    for poly in body.data.polygons:
        acc = {}
        for vi in poly.vertices:
            for g in body.data.vertices[vi].groups:
                n = gname.get(g.group)
                z = BONE_ZONE.get(n)
                if z is None:
                    if n: unmapped.add(n)
                    continue
                acc[z] = acc.get(z, 0.0) + g.weight
        z = max(acc, key=acc.get) if acc else "shirt"
        poly.material_index = idx[z]
        counts[z] += 1

    # --- glowa: czapa wlosow liczona w przestrzeni SWIATA ---
    # Mesh glowy jest przypiety do KOSCI (parent_type='BONE'), wiec jego lokalne
    # osie nie sa osiami swiata - liczenie "gora/tyl" na v.co daje strefy
    # odwrocone. Bierzemy wiec srodek wielokata przez matrix_world.
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()

    # --- sciezka nowa: strefa zapisana wprost przez generator bazy ---------
    # Glowa z `char3d_base` niesie atrybut `zona` na wielokacie, bo ma TWARZ -
    # oczu i ust nie da sie odgadnac cieciem po wysokosci czaszki. Ciecie
    # ponizej zostaje jako droga dla starych glow bez tego atrybutu.
    if "zona" in head.data.attributes:
        from char3d_base import ZONY_GLOWY
        attr = head.data.attributes["zona"]
        hcount = {}
        for i, poly in enumerate(head.data.polygons):
            z = ZONY_GLOWY[attr.data[i].value]
            poly.material_index = idx[z]
            hcount[z] = hcount.get(z, 0) + 1
        if report:
            print("[strefy] cialo (wielokaty):", counts)
            print("[strefy] glowa z atrybutu `zona`:", hcount)
            if unmapped:
                print("[UWAGA] kosci bez przypisanej strefy:", sorted(unmapped))
            brak = [z for z in ZONY_GLOWY if z not in hcount]
            if brak:
                print(f"[UWAGA] strefy twarzy bez ani jednego wielokata: {brak}")
        return counts

    M = head.matrix_world
    cent = []
    for poly in head.data.polygons:
        c = M @ (sum((head.data.vertices[vi].co for vi in poly.vertices),
                     start=head.data.vertices[poly.vertices[0]].co * 0) / len(poly.vertices))
        cent.append(c)
    wz = [c.z for c in cent]
    lo, hi = min(wz), max(wz)
    cut = lo + 0.55 * (hi - lo)          # linia wlosow
    hcount = {"hair": 0, "skin": 0}
    for poly, c in zip(head.data.polygons, cent):
        # postac patrzy w -Y: twarz to c.y < 0; wlosy = czubek albo tyl czaszki
        is_hair = c.z > cut or c.y > 0.2
        poly.material_index = idx["hair" if is_hair else "skin"]
        hcount["hair" if is_hair else "skin"] += 1

    if report:
        print("[strefy] cialo (wielokaty):", counts)
        print("[strefy] glowa (wielokaty):", hcount, f"linia wlosow z={cut:.3f} (zakres {lo:.2f}..{hi:.2f})")
        if unmapped:
            print("[UWAGA] kosci bez przypisanej strefy:", sorted(unmapped))
    return counts

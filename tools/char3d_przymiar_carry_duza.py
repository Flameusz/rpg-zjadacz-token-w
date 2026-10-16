"""PRZYMIAR: poza CARRY dla DUZYCH tarcz (profil LARGE).

    blender -b public/assets/char.blend --python tools/char3d_przymiar_carry_duza.py

Drukuje raport i NIC NIE ZAPISUJE — jak kazdy przymiar w tym katalogu.

-- Po co --------------------------------------------------------------------
Po przejsciu na szesc konstrukcji o prawdziwych wymiarach (2026-09-21) trzy
najwieksze tarcze ORZA GRUNT w dotychczasowej pozie niesienia:

    almond (105 cm)   zejscie +1,74 .. +2,43 j. PONIZEJ linii stop
    pavise (112 cm)   zejscie +1,75 .. +1,98
    scutum (106 cm)   zejscie +0,09 .. +0,17   (na styk, w tolerancji)

To nie jest blad modelu — to jest fizyka: tarcza siegajaca od ziemi po brode
nie wisi przy boku na opuszczonej rece. Autor rozstrzygnal to DWOMA PROFILAMI
niesienia (2026-09-21): SMALL trzyma dotychczasowa poze, LARGE dostaje wlasna
(tarcza nizej i bardziej z przodu). Ten przymiar sluzy do dobrania LARGE.

-- Czego ten przymiar NIE robi ----------------------------------------------
STOP: nie dobiera `chwyt` ani `obrot`. `chwyt` jest wspolny dla CARRY i GUARD
(patrz OI-141), a `obrot` jest wspolna wlasnoscia PRZEDMIOTU dla wszystkich
poz. Tutaj ruszamy wylacznie CEL DLONI, czyli poze.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_attack    # noqa: E402
import char3d_chod      # noqa: E402
import char3d_clearance  # noqa: E402
import char3d_shields   # noqa: E402
import char3d_zones     # noqa: E402
import shield_shapes    # noqa: E402

DUZE = [k for k, v in shield_shapes.KONSTRUKCJE.items() if v["profil"] == "LARGE"]
# Klatki reprezentatywne: 0 i 2 to skrajne pozycje cyklu, 5 to bezruch.
KLATKI = (0, 2, 5)

# Ile stopni tarcza moze odchylic sie od PIONU, zanim przestanie czytac sie
# jak niesiona, a zacznie jak deska pod pacha. Punkt odniesienia zmierzony na
# dzisiejszej, zaakceptowanej pozie SMALL — patrz wiersz odniesienia w tabeli.
MAX_ODCHYL = 25.0

# Siatka celow. Punkt wyjscia to dzisiejsze `NIESIENIE_TARCZA_SPOCZYNEK`
# (1,79; 0,45; −6,74). Os Z to wysokosc (mniej ujemne = wyzej), os Y to
# glebokosc (ujemne = do przodu), os X to odsuniecie w bok.
SIATKA = [
    (1.79, 0.45, -6.74),    # dzisiejsza poza SMALL — punkt odniesienia
    (1.79, 0.45, -5.95),
    (1.79, 0.45, -5.80),
    (2.20, 0.45, -5.95),
    (2.20, 0.45, -5.80),
    (2.60, 0.45, -5.95),
    (2.60, 0.45, -5.80),
    (2.60, 0.45, -6.10),
    (3.00, 0.45, -5.95),
]

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
char3d_attack.zdejmij_obrot_turntable(arm)
char3d_zones.apply_zones()
# STOP: Solidify musi zgasnac — kontur ciala to ODWROCONY hull, wiec przy
# wlaczonym kazdy punkt czyta sie jako "wewnatrz". Ta sama pulapka, co
# w bramce (`char3d_sprawdz_tarcze`).
for ob in bpy.data.objects:
    for m in getattr(ob, "modifiers", []):
        if m.type == "SOLIDIFY":
            m.show_viewport = m.show_render = False

tarcze = char3d_shields.zbuduj_wszystkie(arm)
CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]


def _dol_ciala():
    dg = bpy.context.evaluated_depsgraph_get()
    naj = 1e9
    for ob in CIALO:
        oe = ob.evaluated_get(dg)
        me = oe.to_mesh()
        for v in me.vertices:
            naj = min(naj, (ob.matrix_world @ v.co).z)
        oe.to_mesh_clear()
    return naj


def _zmierz(ob):
    """(najnizszy punkt tarczy, srodek z bboxa) w swiecie."""
    dg = bpy.context.evaluated_depsgraph_get()
    oe = ob.evaluated_get(dg)
    me = oe.to_mesh()
    pts = [ob.matrix_world @ v.co for v in me.vertices]
    oe.to_mesh_clear()
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for p in pts:
        for i in range(3):
            mn[i] = min(mn[i], p[i])
            mx[i] = max(mx[i], p[i])
    return mn.z, (mn + mx) * 0.5


oryginal = char3d_chod.NIESIENIE_TARCZA_SPOCZYNEK
print(f"\nklatki {KLATKI}; tarcze LARGE: {DUZE}")
print(f"dzisiejsza poza SMALL: {oryginal}\n")
print(f"{'cel (x, y, z)':<22} {'tarcza':<8} {'zejscie':>8} {'przechyl':>7} "
      f"{'dY':>7} {'przeswit':>9}")
print("-" * 76)

wyniki = {}
for cel in SIATKA:
    char3d_chod.NIESIENIE_TARCZA_SPOCZYNEK = cel
    char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True,
                                      tarcza=True, walka=False)
    akcja = bpy.data.actions["Walk_Armed_Shielded"]
    arm.animation_data.action = akcja
    najgorsze = {}
    for f in KLATKI:
        scn.frame_set(f)
        bpy.context.view_layer.update()
        dol = _dol_ciala()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        piesc = ev.matrix_world @ ev.pose.bones[char3d_shields.KOSC_DLONI].head
        for t in DUZE:
            ob = tarcze[t]
            niski, srodek = _zmierz(ob)
            m = char3d_clearance.przeswit_przedramienia(arm, ob, CIALO[1])
            rek = najgorsze.setdefault(t, {"zej": -1e9, "dY": 0.0, "dYs": 0.0,
                                           "prz": 1e9, "kat": 0.0})
            zej = dol - niski                    # dodatnie = PONIZEJ stop
            if zej > rek["zej"]:
                rek["zej"] = zej
            # dY liczony od PUNKTU ODNIESIENIA (offset uchwytu odjety) —
            # patrz `char3d_shields.punkt_odniesienia`. `dYs` to stara miara
            # od srodka, zostawiona do porownania w raporcie.
            odn = char3d_shields.punkt_odniesienia(ob)
            if abs((odn - piesc).y) > abs(rek["dY"]):
                rek["dY"] = (odn - piesc).y
            if abs((srodek - piesc).y) > abs(rek["dYs"]):
                rek["dYs"] = (srodek - piesc).y
            rek["prz"] = min(rek["prz"], m["przeswit"])
            # ODCHYLENIE OSI TARCZY OD PIONU — metryka dodana po obejrzeniu
            # renderow. Podniesienie i wysuniecie dloni OBRACA przedramie,
            # a tarcza jest do niego sztywno przypieta, wiec jej dluga os
            # klaka sie z pionu. Na raporcie tego nie bylo widac wcale:
            # grunt i przeswit wychodzily czysto, a tarcza czytala sie jak
            # deska niesiona pod pacha.
            ey = (ob.matrix_world.to_3x3() @ Vector((0.0, 1.0, 0.0))).normalized()
            kat = math.degrees(math.acos(min(1.0, abs(ey.z))))
            rek["kat"] = max(rek.get("kat", 0.0), kat)
    for t in DUZE:
        r = najgorsze[t]
        flaga = "  <-- ORZE GRUNT" if r["zej"] > 0.25 else ""
        flaga += "  <-- PRZENIKA" if r["prz"] < 0.0 else ""
        flaga += "  <-- PRZECHYL" if r["kat"] > MAX_ODCHYL else ""
        print(f"{str(cel):<22} {t:<8} {r['zej']:>+8.2f} {r['kat']:>7.0f} "
              f"{r['dY']:>+7.2f} {r['prz']:>+9.2f}{flaga}")
    wyniki[cel] = najgorsze
    print()

char3d_chod.NIESIENIE_TARCZA_SPOCZYNEK = oryginal

print(f"KRYTERIA: zejscie <= +0.25 (grunt) | przechyl <= {MAX_ODCHYL} st. od pionu "
      "| przeswit > 0 (przedramie poza tarcza)")
dobre = [c for c, w in wyniki.items()
         if all(r["zej"] <= 0.25 and r["kat"] <= MAX_ODCHYL and r["prz"] > 0.0
                for r in w.values())]
print(f"\nCELE SPELNIAJACE WSZYSTKO: {dobre or 'ZADEN'}")

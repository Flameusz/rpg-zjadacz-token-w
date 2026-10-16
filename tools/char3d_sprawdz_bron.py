"""Przymiar broni: czy trzyma się jej jak trzeba i czy nie wchodzi w ziemię.

    blender -b char.blend --python char3d_sprawdz_bron.py

Trzy pytania, na które oko przy 300 px nie odpowiada, a liczba tak:

1. ⚠ **Czy lewa dłoń NAPRAWDĘ jest na drzewcu** przy broni dwuręcznej.
   Bez tego „chwyt oburęczny" jest deklaracją: dłoń może wisieć kilkanaście
   centymetrów obok drzewca i w miniaturze wygląda to identycznie.
2. ⚠ **Czy broń nie schodzi poniżej stóp** — i to nie tylko w bezruchu, ale
   PRZEZ CAŁY CYKL CHODU. W marszu broń macha razem z ręką, więc miecz
   nieszkodliwy w postawie potrafi zamiatać ziemię przy każdym kroku. Bezruch
   to najłagodniejszy przypadek, więc sprawdzanie samego bezruchu daje fałszywe
   „w normie".
3. ⚠ **Czy broń mieści się w KADRZE silnika** (2026-10-03). Postać jest
   renderowana do bufora RENDER_W×RENDER_H kamerą ortograficzną o stałej gęstości J_NA_PX
   (`Character3D.ts`; dziś 320×184 i zapas nad głową), obracaną dookoła osi pionowej — wszystko, co wystaje
   poza ±5,81 j. w poziomie albo ±7,75 j. w pionie od środka postaci, jest
   po prostu UCINANE krawędzią kadru. Tak już raz ucinało topór bojowy
   (51 px) i włócznię, zanim poszerzono bufor. Mierzone pod 24 kątami obrotu,
   w bezruchu, w chodzie i w każdej pozie ciosu.

⛔ Ten skrypt nic nie zapisuje ani nie renderuje. Kończy się kodem 1, gdy
którykolwiek warunek jest złamany, żeby dało się go wpiąć jako bramkę.
"""
import bpy
import math
import re
import sys
import os

from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_attack    # noqa: E402
import char3d_weapons   # noqa: E402
import char3d_chod      # noqa: E402
import char3d_thrust    # noqa: E402
import weapon_shapes    # noqa: E402

# Ile wolno lewej dłoni odstawać od osi drzewca. Dłoń ma promień ~0,35 j.,
# więc powyżej tego trzyma powietrze obok broni, a nie broń.
TOL_CHWYT = 0.55
# Ile broni wolno zejść poniżej najniższego punktu stóp. Zero jest zbyt ostre:
# czubek muskający trawę czyta się dobrze, dopiero wyraźne zanurzenie razi.
TOL_ZIEMIA = 0.30
# Kadr silnika (`Character3D.ts`: RENDER_W×RENDER_H, kamera wys. `wys` j.,
# elewacja ELEV_DEG). ⭐ CZYTANE z pliku TS niżej, nie przepisane — po
# poszerzeniu bufora 96 → 192 (2026-10-03) wpisana liczba dawałaby fałszywą
# czerwień, a po zwężeniu fałszywą zieleń.
_ts = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        "src", "render3d", "Character3D.ts"), encoding="utf-8").read()
_w = re.search(r"const RENDER_W = (\d+);", _ts)
_h = re.search(r"const RENDER_H = (\d+);", _ts)
_k = re.search(r"const J_NA_PX = ([\d.]+) / (\d+);", _ts)
_z = re.search(r"const ZAPAS_GORA_PX = (\d+);", _ts)
_e = re.search(r"const ELEV_DEG = (\d+);", _ts)
if not (_w and _h and _k and _z and _e):
    sys.exit("BLAD: nie znalazłem stałych kadru w Character3D.ts — popraw wzorce w bramce")
J_NA_PX = float(_k.group(1)) / int(_k.group(2))
KADR_WYS = int(_h.group(1)) * J_NA_PX
KADR_SZER = int(_w.group(1)) * J_NA_PX
# zapas nad głową przesuwa środek kadru w górę o połowę siebie (silnik: `srodek`)
PRZESUNIECIE_SRODKA = int(_z.group(1)) * J_NA_PX / 2
ELEW = math.radians(int(_e.group(1)))
print(f"[kadr] {_w.group(1)}×{_h.group(1)} px → {KADR_SZER:.2f} × {KADR_WYS:.2f} j.")
KATY_OBROTU = [math.radians(a) for a in range(0, 360, 15)]

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
# ⚠ Obrót turntable z akcji `Walk` obracałby cały obiekt — przy pomiarze
# kadru pod 24 kątami dałby kąt podwójny (patrz `char3d_export_gltf`).
char3d_attack.zdejmij_obrot_turntable(arm)

char3d_attack.zbuduj_atak(arm, oburacz=True)
akcja_2h = bpy.data.actions[char3d_attack.NAZWA_2H]
akcja_2h.use_fake_user = True
char3d_attack.zbuduj_atak(arm)
akcja_1h = bpy.data.actions[char3d_attack.NAZWA]
akcja_1h.use_fake_user = True

# Akcja chodu jest ORYGINALNA z char.blend; pozy powtarzają się co 3 klatki,
# więc cykl to 0-2 (patrz `char3d_export_gltf.py`).
# ⚠ Sprawdzamy CHÓD Z BRONIĄ, nie oryginalny cykl. Oryginalny macha obiema
# rękami i przy nim każda dłuższa broń zamiata ziemię — to jest właśnie powód,
# dla którego `char3d_chod` w ogóle istnieje.
chod_1h = char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False)
chod_2h = char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=True)
# CARRY broni drzewcowej poza walką (2026-10-03): pionowo przy boku. Gra gra
# go dla KAŻDEJ drzewcowej poza walką, więc bramka mierzy go osobnym przebiegiem.
chod_pole = char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True)
# PCHNIĘCIE drzewcowej (2026-10-03): silnik gra je zamiast zamachu przy ataku
# kłutym, więc bramka mierzy je osobnym przebiegiem „(pchn.)".
akcja_p2h = char3d_thrust.zbuduj_pchniecie(arm, oburacz=True)[0]
# GOTOWOŚĆ drzewcowej w walce (drzewce opuszczone) — to, co gra pokazuje
# zamiast `Walk_Armed_2H` / `Walk_Armed` dla broni drzewcowej W WALCE.
chod_pole_walka = char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, walka=True)
chod_pole_walka_t = char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, walka=True, tarcza=True)
# ⭐ BIEG (2026-10-03): ta sama poza niesienia na cyklu biegu — miednica niżej,
# tułów pochylony, więc broń może zejść niżej niż w chodzie. Każda poza
# noszenia ma swój odpowiednik `Run_*`, mierzony w tej samej pętli.
import char3d_run  # noqa: E402
char3d_run.zbuduj_bieg(arm, report=False)
BIEG_DLA = {
    chod_1h: char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, zrodlo="Run"),
    chod_2h: char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=True, zrodlo="Run"),
    chod_pole: char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, zrodlo="Run"),
    chod_pole_walka: char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, walka=True, zrodlo="Run"),
    chod_pole_walka_t: char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, walka=True,
                                                         tarcza=True, zrodlo="Run"),
}
akcja_p1h = char3d_thrust.zbuduj_pchniecie(arm, oburacz=False)[0]
KLATKI_CHODU = char3d_chod.KLATKI

# ⚠ NAJPIERW komplet rosteru. Brak modelu nie daje błędu w grze, tylko pustą
# rękę — a pusta ręka wygląda jak „broń jeszcze nie działa", nie jak brak pliku.
brak_modeli = char3d_weapons.sprawdz_komplet_rosteru()


bronie = char3d_weapons.zbuduj_wszystkie(arm)
for o in bronie.values():
    o.hide_render = True
CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]


def bryla(obiekty):
    dg = bpy.context.evaluated_depsgraph_get()
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for o in obiekty:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            p = ev.matrix_world @ v.co
            for i in range(3):
                mn[i] = min(mn[i], p[i])
                mx[i] = max(mx[i], p[i])
        ev.to_mesh_clear()
    return mn, mx


def wierzcholki(o):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = o.evaluated_get(dg)
    me = ev.to_mesh()
    pk = [ev.matrix_world @ v.co for v in me.vertices]
    ev.to_mesh_clear()
    return pk


def wystaje_z_kadru(ob, srodek_z):
    """Największe przekroczenie kadru (j.) pod wszystkimi kątami obrotu."""
    gorsze = -1e9
    for p in wierzcholki(ob):
        for th in KATY_OBROTU:
            # obrót postaci o th ⇔ obrót kamery o −th
            c, s = math.cos(th), math.sin(th)
            x = p.x * c - p.y * s
            y = p.x * s + p.y * c
            # kamera z przodu (−y) i 15° nad horyzontem
            ekr_x = x
            ekr_y = (p.z - srodek_z - PRZESUNIECIE_SRODKA) * math.cos(ELEW) + y * math.sin(ELEW)
            gorsze = max(gorsze, abs(ekr_x) - KADR_SZER / 2, abs(ekr_y) - KADR_WYS / 2)
    return gorsze


bledy = list(brak_modeli)
znane = []   # świadomie otwarte — drukowane, nie blokują (patrz „ostrze”)
# ⚠ Kadr w CIOSIE: przy dawnym buforze 96×128 nawet atrapa miecza dotykała
# w profilu krawędzi (zmierzone w żywej grze 2026-10-03: x = 0 / 95 i y = 0
# przy zwrocie 90° / 270°). Po poszerzeniu do 192×160 mieści się cały roster,
# więc od tej chwili to jest BŁĄD — nowa broń nie może po cichu wyjść z kadru.
uciete_w_ciosie = []
print(f"{'bron':14} {'rece':4} {'bezruch':>11} {'w chodzie':>13} {'lewa/drzewce':>15} "
      f"{'rama nosz.':>12} {'rama cios':>10} {'ostrze':>7}")
print("-" * 104)
_przebiegi = []
for bid in bronie:
    cfg = char3d_weapons.BRONIE[bid]
    _przebiegi.append((bid, cfg["rece"] == 2, None))
    if cfg["chwyt_dowolny"]:            # półtorak: model jeden, chwyt wybiera gra
        _przebiegi.append((bid, cfg["rece"] != 2, None))
    if cfg["rodzina"] == "polearm":     # noszenie pionowe poza walką + pchnięcie
        _przebiegi.append((bid, False, "nosz"))
        _przebiegi.append((bid, cfg["rece"] == 2, "pchn"))
        if cfg["chwyt_dowolny"]:
            _przebiegi.append((bid, cfg["rece"] != 2, "pchn"))
for bid, dwureczna, tryb in _przebiegi:
    pole = tryb == "nosz"
    pchn = tryb == "pchn"
    ob = bronie[bid]
    cfg = char3d_weapons.BRONIE[bid]
    etykieta = bid + (" (nosz.)" if pole
                      else (" (pchn.)" if dwureczna else " (pchn.1H)") if pchn
                      else "" if not cfg["chwyt_dowolny"]
                      else (" (2H)" if dwureczna else " (1H)"))
    akcja_ciosu = ((akcja_p2h if dwureczna else akcja_p1h) if pchn
                   else (akcja_2h if dwureczna else akcja_1h))
    chod_carry = chod_pole if pole else (chod_2h if dwureczna else chod_1h)
    drzewcowa = cfg["rodzina"] == "polearm"
    if drzewcowa and not pole:
        chod_carry = chod_pole_walka if dwureczna else chod_pole_walka_t
    # Zamach gra tylko broń z niekłutym wariantem (drzewcowa kłuta = pchnięcie).
    bez_zamachu = drzewcowa and not pchn and all(a == "pierce" for a in cfg["ataki"])
    arm.animation_data.action = akcja_2h if dwureczna else akcja_1h

    # ⚠⚠ **BEZRUCH CZYTA SIĘ Z KLIPU CHODU, nie z akcji ataku** (A6.1,
    # 2026-09-20). Do tej pory stało tu `akcja_1h` + `frame_set(0)` z
    # komentarzem „poza gotowości = tak stoi na co dzień" — i **od etapu A2 to
    # zdanie jest nieprawdziwe**: postać stojąca gra klatkę `BEZRUCH` klipu
    # `Walk_Armed`, a gotowość bojowa pokazuje się wyłącznie w trakcie ciosu.
    # Bramka mierzyła więc pozę, której gracz na co dzień nie widzi, i **nie
    # potrafiła zaświecić na czerwono** dla prawdziwego bezruchu: miecz
    # schodził tam 0,457 j. pod grunt, a kolumna pokazywała „−2,24 ok".
    # (`tools/CLAUDE.md`: asercja, która nie potrafi zaświecić, jest dekoracją.)
    arm.animation_data.action = chod_carry
    scn.frame_set(char3d_chod.char3d_walk.BEZRUCH)
    bpy.context.view_layer.update()
    _c = bryla(CIALO)
    stopy = _c[0].z
    srodek_z = (_c[0].z + _c[1].z) / 2     # silnik centruje kadr na połowie wysokości
    dol_broni = bryla([ob])[0].z
    zanurzenie = stopy - dol_broni         # dodatnie = broń jest NIŻEJ niż stopy
    rama = wystaje_z_kadru(ob, srodek_z)

    # --- to samo przez cykl chodu i BIEGU ---
    zan_chod, gdzie_chod = -1e9, None
    for cykl, prefiks in ((chod_carry, ""), (BIEG_DLA[chod_carry], "bieg ")):
        arm.animation_data.action = cykl
        for klatka in KLATKI_CHODU:
            scn.frame_set(klatka)
            bpy.context.view_layer.update()
            # ⚠ W BIEGU odniesieniem jest GRUNT z pozy stojącej (`stopy`), nie
            # najniższy punkt ciała w tej klatce: w fazie LOTU obie stopy są
            # w powietrzu i miara „pod stopami" mierzyła broń względem uniesionej
            # stopy (fałszywe 0,3–1,1 j. przy mieczach, zmierzone 2026-10-03).
            ref = stopy if prefiks else bryla(CIALO)[0].z
            z = ref - bryla([ob])[0].z
            if z > zan_chod:
                zan_chod, gdzie_chod = z, f"{prefiks}{klatka}"
            rama = max(rama, wystaje_z_kadru(ob, srodek_z))
    arm.animation_data.action = akcja_ciosu

    # ⚠ Chwyt sprawdzamy w KAŻDEJ klatce ciosu, nie tylko w gotowości.
    # Rozjazd w gotowości byłby widoczny od razu; rozjazd w połowie zamachu
    # trwa cztery klatki i ginie w ruchu — a to właśnie tam broń „odkleja się"
    # od dłoni najbrzydziej.
    rama_cios = -1e9
    zan_cios, gdzie_cios = -1e9, None
    # przebieg noszenia nie ma własnego ciosu — cios mierzy przebieg główny
    for klatka in ([] if (pole or bez_zamachu) else [pz[0] for pz in char3d_attack.POZY]):
        scn.frame_set(klatka)
        bpy.context.view_layer.update()
        rama_cios = max(rama_cios, wystaje_z_kadru(ob, srodek_z))
        # ⚠ Grunt także W CIOSIE (2026-10-03): pchnięcie kładzie drzewce
        # poziomo przy biodrze, więc długi tylec może zejść pod stopy.
        z = bryla(CIALO)[0].z - bryla([ob])[0].z
        if z > zan_cios:
            zan_cios, gdzie_cios = z, klatka

    # ⚠ OSTRZE PROWADZI CIOS (2026-10-12). Do tej daty cały roster uderzał
    # GRZBIETEM: w klatce cięcia ostrze patrzyło w górę, a głowica szła w dół
    # (topór: ostrze·ruch = −0,35; tasak i szabla −0,7). Na symetrycznym mieczu
    # tego nie widać, na toporze tak — „trzyma go w dziwny sposób".
    # Mierzymy kierunek ostrza (`OSTRZE_LOKALNE` w świecie) wobec ruchu głowicy
    # zamach → cięcie. BŁĄD tylko dla broni KIERUNKOWYCH — głowica wyraźnie
    # niesymetryczna w x (topór, nadziak, młot z kolcem, szabla, halabarda);
    # dla symetrycznego miecza kolumna jest umowna (pokazujemy, nie oceniamy).
    _xs = [v[0] for v in weapon_shapes.geometria(bid)[0]]
    kierunkowa = abs(max(_xs) + min(_xs)) > 2.0
    prowadzenie = None
    if not (pole or pchn or bez_zamachu):
        k_zamach, k_ciecie = char3d_attack.POZY[1][0], char3d_attack.POZY[2][0]
        glowica_lok = Vector((0.0, cfg["dlugosc"] - cfg["chwyt"], 0.0))
        scn.frame_set(k_zamach)
        bpy.context.view_layer.update()
        g0 = ob.matrix_world @ glowica_lok
        scn.frame_set(k_ciecie)
        bpy.context.view_layer.update()
        ruch = (ob.matrix_world @ glowica_lok) - g0
        ostrze = ob.matrix_world.to_3x3() @ Vector(char3d_weapons.ostrze_lokalne(bid))
        prowadzenie = ostrze.normalized().dot(ruch.normalized())
        if kierunkowa and prowadzenie <= 0.0:
            opis = (f"{etykieta}: w cięciu ostrze patrzy WSTECZ (ostrze·ruch "
                    f"{prowadzenie:+.2f}) — broń uderza grzbietem/obuchem")
            # ⚠ Drzewcowe: ZNANE i otwarte, nie przeoczone. Ich ostrze ustawia
            # poza noszenia (`OSTRZE_DRZEWCOWEJ`), a zamach `Attack_2H` jest
            # wspólny z toporami — odwrócenie siatki skręciłoby nadgarstek.
            # Naprawa = skręt dłoni w zamachu drzewcowej, nie zmiana siatki.
            (znane if cfg["rodzina"] == "polearm" else bledy).append(opis)

    odstep = None
    if dwureczna:
        najgorszy, gdzie = 0.0, None
        for klatka in [pz[0] for pz in char3d_attack.POZY]:
            scn.frame_set(klatka)
            bpy.context.view_layer.update()
            dg = bpy.context.evaluated_depsgraph_get()
            ev = arm.evaluated_get(dg)
            chwyt = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_R].tail
            os_w = char3d_attack._os_drzewca(ev, char3d_weapons.KAT_2H)
            lewa = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_L].head
            # odleglosc punktu od prostej: |(P-A) - ((P-A)·d)d|
            v = lewa - chwyt
            d = (v - os_w * v.dot(os_w)).length
            if d > najgorszy:
                najgorszy, gdzie = d, klatka
        odstep = najgorszy
        scn.frame_set(0)
        bpy.context.view_layer.update()

    zle_ziemia = zanurzenie > TOL_ZIEMIA
    zle_chod = zan_chod > TOL_ZIEMIA
    zle_chwyt = dwureczna and odstep > TOL_CHWYT
    zla_rama = rama > 0.0
    if zla_rama:
        bledy.append(f"{etykieta}: W NOSZENIU wystaje {rama:.2f} j. poza kadr silnika "
                     "— ucięta krawędzią przez cały czas")
    if zan_cios > TOL_ZIEMIA:
        bledy.append(f"{etykieta}: W CIOSIE schodzi {zan_cios:.2f} j. pod stopy "
                     f"(klatka {gdzie_cios}, limit {TOL_ZIEMIA})")
    if rama_cios > 0.0:
        uciete_w_ciosie.append((etykieta, rama_cios))
        bledy.append(f"{etykieta}: W CIOSIE wystaje {rama_cios:.2f} j. poza kadr silnika")
    if zle_ziemia:
        bledy.append(f"{etykieta}: w bezruchu schodzi {zanurzenie:.2f} j. pod stopy "
                     f"(limit {TOL_ZIEMIA})")
    if zle_chod:
        bledy.append(f"{etykieta}: W CHODZIE schodzi {zan_chod:.2f} j. pod stopy "
                     f"(klatka {gdzie_chod}, limit {TOL_ZIEMIA})")
    if zle_chwyt:
        bledy.append(f"{etykieta}: lewa dłoń {odstep:.2f} j. od drzewca "
                     f"w klatce {gdzie} ({char3d_attack.FAZY[gdzie]}), limit {TOL_CHWYT}")

    znak_z = "BLAD" if zle_ziemia else "ok"
    znak_w = "BLAD" if zle_chod else "ok"
    znak_c = ("BLAD" if zle_chwyt else "ok") if dwureczna else "-"
    print(f"{etykieta:14} {2 if dwureczna else 1:^4} {zanurzenie:+7.2f} {znak_z:>4} "
          f"{zan_chod:+8.2f} {znak_w:>4} "
          f"{(f'{odstep:.2f}' if odstep is not None else '—'):>10} {znak_c:>4} "
          f"{rama:+7.2f} {'BLAD' if zla_rama else 'ok':>4} {(f'{rama_cios:+8.2f}' if rama_cios > -1e8 else '       —')} "
          f"{(f'{prowadzenie:+7.2f}' if prowadzenie is not None else '      —')}")

print()
if uciete_w_ciosie:
    print(f"{len(uciete_w_ciosie)} broni wychodzi poza kadr W CIOSIE "
          f"— najgorsze: " + ", ".join(f"{e} {r:+.2f}" for e, r in
                                       sorted(uciete_w_ciosie, key=lambda x: -x[1])[:6]))
if znane:
    print(f"ZNANE, OTWARTE ({len(znane)}):")
    for z in znane:
        print("  ·", z)
if bledy:
    print(f"BŁĘDY ({len(bledy)}):")
    for b in bledy:
        print("  •", b)
    sys.exit(1)
print("Wszystkie bronie w normie.")

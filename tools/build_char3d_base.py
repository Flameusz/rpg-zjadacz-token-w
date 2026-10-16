"""Przebudowa bazowej postaci gracza (MASTER HUMANOID BASE) w char.blend.

    blender -b public/assets/char.blend --python tools/build_char3d_base.py
    blender -b public/assets/char.blend --python tools/build_char3d_base.py -- --zapisz

⚠ **Domyslnie NIC NIE ZAPISUJE** - liczy proporcje, renderuje przymiar do
`docs/podglad/` i drukuje raport. Zapis do char.blend wylacznie pod `--zapisz`.

⚠ **Sam raport nie wystarczy.** Reguła numer jeden tego katalogu: PATRZ NA
RENDER. Proporcje moga sie zgadzac co do drugiego miejsca po przecinku, a
postac i tak czytac sie jako manekin - dlatego ten skrypt zawsze sklada
arkusz widokow, takze bez `--zapisz`.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import char3d_attack    # noqa: E402
import char3d_base      # noqa: E402
import char3d_walk      # noqa: E402
import char3d_walk_lean # noqa: E402
import char3d_zones     # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ZAPISZ = "--zapisz" in argv
CEL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "public", "assets", "char.blend")
KATALOG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "docs", "podglad")


def _kamera(scn):
    cam = bpy.data.objects.get("PrzymiarCam")
    if cam is None:
        cam = bpy.data.objects.new("PrzymiarCam", bpy.data.cameras.new("PrzymiarCam"))
        scn.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    scn.camera = cam
    return cam


def _zasieg():
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        pts += [o.matrix_world @ v.co for v in me.vertices]
        oe.to_mesh_clear()
    zs = [p.z for p in pts]
    xs = [p.x for p in pts]
    return (min(xs) + max(xs)) / 2.0, min(zs), max(zs)


def renderuj(tag, katalog=KATALOG):
    """Arkusz widokow + jeden render w PRAWDZIWYM buforze gry (96x128).

    ⚠ `game_px` jest wazniejszy od reszty. Model oceniamy jako element
    gameplayu, nie jako render prezentacyjny - a przy 96x128 znika wszystko,
    co w duzym widoku wygladalo dobrze.
    """
    os.makedirs(katalog, exist_ok=True)
    scn = bpy.context.scene
    scn.render.engine = "BLENDER_WORKBENCH"
    scn.display.shading.light = "STUDIO"
    scn.display.shading.color_type = "MATERIAL"
    scn.render.film_transparent = True
    scn.view_settings.view_transform = "Standard"
    scn.render.image_settings.file_format = "PNG"
    cam = _kamera(scn)
    cx, dol, gora = _zasieg()
    H = gora - dol
    cz = (gora + dol) / 2.0

    # ELEV 15 st. to ten sam kat, ktorego uzywa `Character3D.ELEV_DEG`
    # i pre-render `build_char3d.py`. Ocena pod innym katem jest bez wartosci.
    widoki = [
        ("front", 0, 0, 400, 620), ("bok", 0, 90, 400, 620),
        ("tyl", 0, 180, 400, 620), ("gora", 89, 0, 400, 620),
        ("gra", 15, 0, 400, 620), ("gra_skos", 15, 35, 400, 620),
        ("gra_px", 15, 0, 96, 128),
    ]
    zrobione = []
    for nazwa, elew, azym, W, Hp in widoki:
        cam.data.ortho_scale = H * 1.10
        scn.render.resolution_x, scn.render.resolution_y = W, Hp
        scn.render.resolution_percentage = 100
        sciezka = os.path.join(katalog, f"{tag}_{nazwa}.png")
        scn.render.filepath = sciezka
        e, a, d = math.radians(elew), math.radians(azym), 120.0
        cam.location = (cx + d * math.cos(e) * math.sin(a),
                        -d * math.cos(e) * math.cos(a),
                        cz + d * math.sin(e))
        kier = Vector((cx, 0.0, cz)) - Vector(cam.location)
        cam.rotation_euler = kier.to_track_quat("-Z", "Y").to_euler()
        bpy.ops.render.render(write_still=True)
        zrobione.append(sciezka)
    return zrobione


def _poza_w_swiecie(arm):
    """Wszystkie wierzchołki + head/tail wszystkich kości, w świecie.

    ⚠ Sam wzrost albo raport proporcji NIE WYSTARCZA — przechodzą na zielono
    przy przestawionym pierścieniu i przy przesuniętej kości. Porównujemy
    komplet pozycji (`tools/CLAUDE.md`, „dwie asercje").

    ⚠ **KONTROLKI (`HandIK`/`FootIK`/`Elbow`/`PoleKnee`) idą tylko HEADEM.**
    Więz IK czyta z kontrolki wyłącznie POZYCJĘ (`use_rotation=False`,
    zmierzone), nic jej nie renderuje i nic nie jest do niej przypięte, więc
    jej OGON jest kosmetyką. Stary `Walk` trzymał na `HandIK` stały, niezerowy
    obrót — przebudowa wraca do spoczynku i ogon przeskakuje o 3,81 j. przy
    siatce nietkniętej co do 0,0001 j. Porównywanie go dawało czerwoną
    asercję bez żadnej treści.
    """
    pozycje = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in sorted((x for x in bpy.data.objects if x.type == "MESH"), key=lambda x: x.name):
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        pozycje += [(f"{o.name}[{i}]", o.matrix_world @ v.co)
                    for i, v in enumerate(me.vertices)]
        oe.to_mesh_clear()
    ev = arm.evaluated_get(dg)
    kontrolka = ("HandIK", "FootIK", "Elbow", "PoleKnee")
    for pb in sorted(ev.pose.bones, key=lambda p: p.name):
        pozycje.append((f"{pb.name}.head", ev.matrix_world @ pb.head))
        if not pb.name.startswith(kontrolka):
            pozycje.append((f"{pb.name}.tail", ev.matrix_world @ pb.tail))
    return pozycje


def _klatka_bezruchu(arm):
    """Która klatka akcji `Walk` jest dziś pozą stojącą.

    ⚠ Skrypt bywa uruchamiany i na pliku SPRZED etapu A2 (stary, 3-kluczowy
    cykl rozpisany na 12 klatek, poza stojąca na klatce 1), i na pliku PO nim
    (klatka 5). Pierwszy przebieg sprawdza więc, że MIGRACJA nie ruszyła pozy
    stojącej, a każdy kolejny — że przebudowa jest idempotentna.
    """
    akcja = bpy.data.actions.get("Walk")
    if akcja is None:
        return None
    return 1 if akcja.frame_range[1] > char3d_walk.BEZRUCH else char3d_walk.BEZRUCH


def _zapamietaj_bezruch(arm):
    klatka = _klatka_bezruchu(arm)
    if klatka is None:
        return None
    arm.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.scene.frame_set(klatka)
    bpy.context.view_layer.update()
    print(f"[bezruch] wzorzec pozy stojącej wzięty z klatki {klatka} starej akcji")
    return _poza_w_swiecie(arm)


def sprawdz_bezruch(arm, wzorzec, prog=5e-4):
    """Czy poza stojąca przetrwała przebudowę cyklu co do pozycji.

    ⚠ Próg jest LUŹNIEJSZY niż 1e-6 z `tools/CLAUDE.md` i to jest świadome:
    tamten dotyczy przepięcia literałów na parametry, czyli tej samej
    arytmetyki. Tutaj poza bezruchu przechodzi przez ITERACYJNY solver
    (`dodaj_rozchylenie_ramion`), więc bitowa zgodność jest nieosiągalna.
    5e-4 j. przy postaci 12,8 j. to 0,004% wzrostu — 0,004 piksela w buforze
    gry, czyli wielokrotnie poniżej czegokolwiek widocznego.
    """
    if wzorzec is None:
        print("[bezruch] brak wzorca — pomijam asercję")
        return []
    arm.rotation_euler = (0.0, 0.0, 0.0)
    bpy.context.scene.frame_set(char3d_walk.BEZRUCH)
    bpy.context.view_layer.update()
    teraz = _poza_w_swiecie(arm)
    if len(teraz) != len(wzorzec):
        blad = f"inna liczba pozycji: {len(wzorzec)} -> {len(teraz)}"
        print(f"[bezruch] BŁĄD — {blad}")
        return [blad]
    roznice = sorted(((a[1] - b[1]).length, a[0]) for a, b in zip(teraz, wzorzec))
    najw = roznice[-1][0]
    ponad = [r for r in roznice if r[0] > prog]
    print(f"[bezruch] {len(roznice)} pozycji, max różnica {najw:.2e} j., "
          f"powyżej {prog:g}: {len(ponad)}")
    if ponad:
        blad = (f"poza stojąca zmieniona: {len(ponad)} pozycji powyżej {prog:g} j. "
                f"(max {najw:.4f})")
        print("   ⛔", blad)
        # ⚠ Sama liczba nie mówi, CO się ruszyło — a to jest cała wartość tej
        # asercji. Najwięksi winowajcy z nazwami idą do raportu.
        for d, nazwa in ponad[-12:][::-1]:
            print(f"      {nazwa:24} {d:8.4f} j.")
        return [blad]
    print("[bezruch] poza stojąca NIETKNIĘTA")
    return []


def main():
    print("=" * 70)
    print("PRZED przebudowa:")
    stare = char3d_base.zmierz()

    print("-" * 70)
    char3d_base.zbuduj()
    wzorzec_bezruchu = _zapamietaj_bezruch(bpy.data.objects["Armature"])

    # ⚠ Dopisek 17 (docs/postac3d_checkpoint.md): `dodaj_rozchylenie_ramion`
    # WŁĄCZONE Z POWROTEM, z DUŻO mniejszą wartością niż w dopisku 2 (0,45 ->
    # 0,16) i BEZ żadnej dodatkowej krzywizny naniesionej na to (nauczka z
    # dopisków 11/12 - tam właśnie nawarstwienie dawało "bramkarza"). Referencje
    # (7 low-poly baz humanoidalnych) pokazały zgodnie: prosta reka odsunieta od
    # tulowia jako CALOSC, nie zgieta w lokciu - dokladnie to, co ta funkcja
    # robi (przesuwa caly sztywny lancuch IK na zewnatrz), nie próba
    # zasymulowania zgiecia w mesh-u. (`dodaj_wychyl` - przechyl tulowia - byl
    # osobnym, odrzuconym pomyslem i zostal usuniety w A2; wychyl miednicy
    # w chodzie zyje dzis w `char3d_walk.KONTAKT_QUAT`.)
    # V3.5: 0,16 -> 0,20 - po poszerzeniu barku (bark_polrozstaw 0,138->0,148)
    # ta sama bezwzgledna przerwa czytala sie jako mniejsza wzgledem szerszej
    # sylwetki; zgloszone wprost ("ramiona bardziej rozlozyste"). Dalej daleko
    # od odrzuconej 0,45 (dopisek 2).
    # ⚠ KOLEJNOŚĆ JEST OBOWIĄZKOWA (etap A2, 2026-09-20): najpierw CAŁY cykl
    # chodu, dopiero potem rozchylenie ramion. `zbuduj_chod` nadpisuje akcję
    # `Walk` w całości (łącznie z kanałami `HandIK`), więc odwrotna kolejność
    # skasowałaby odsunięcie nadgarstków bez śladu w raporcie.
    wiersze = char3d_walk.zbuduj_chod(bpy.data.objects["Armature"])
    bledy_chodu = char3d_walk.sprawdz(wiersze)

    # 0,20 → 0,26 (2026-10-03, wariant B): szersza klatka zjada przerwę
    # ręka–tułów, a to ona robi szerokość sylwetki w kamerze gry.
    char3d_walk_lean.dodaj_rozchylenie_ramion(bpy.data.objects["Armature"], dodatek=0.26)

    # ⚠ Poza bezruchu (klatka 5) MUSI zostać identyczna z dotychczasową pozą
    # stojącą — pod nią dobrana jest skala sprite'a w grze i baza liniowa
    # ciosu (`char3d_attack.BAZA_LOCAL`). Asercja porównuje wszystkie
    # wierzchołki i wszystkie kości, nie sam wzrost: raport proporcji
    # przechodzi na zielono przy przestawionym pierścieniu.
    bledy_bezruchu = sprawdz_bezruch(bpy.data.objects["Armature"], wzorzec_bezruchu)

    # ⚠ ZAPIS IDZIE TU, PRZED krokami budowania. `zdejmij_obrot_turntable`
    # kasuje krzywe z akcji `Walk`, a `apply_zones` gasi Solidify i podmienia
    # materialy - oba sa krokami EKSPORTU, robionymi w pamieci przy kazdym
    # przebiegu. Zapisane do char.blend zostalyby tam na stale i plik zrodlowy
    # przestalby zgadzac sie z tym, co opisuje `public/assets/README.md`.
    # Do char.blend trafia wiec wylacznie przebudowa geometrii i rigu.
    #
    # ⚠ ZAPIS JEST ZABLOKOWANY PRZY CZERWONEJ ASERCJI. Asercja, po ktorej i tak
    # nadpisujemy plik zrodlowy, jest dekoracja (`tools/CLAUDE.md`, regula
    # nr 2) - a zly cykl chodu wjechalby stad do char.blend, do .glb i do gry,
    # zostawiajac w raporcie jedna linijke, ktora latwo przewinac.
    # ⭐ `--nowa-baza` (2026-10-10, BAZA V4): CELOWA zmiana proporcji zmienia
    #   pozę stania — wtedy asercja bezruchu MUSI być czerwona i nie blokuje
    #   zapisu. Zamiast niej: bramki broni i tarcz + render z gry.
    if "--nowa-baza" in sys.argv and bledy_bezruchu:
        print(f"[nowa-baza] poza bezruchu zmieniona CELOWO ({len(bledy_bezruchu)} różnic) — "
              "sprawdź bramki broni/tarcz i render")
        bledy_bezruchu = []
    if ZAPISZ and (bledy_chodu or bledy_bezruchu):
        print(f"[zapis] ⛔ ODMOWA: {len(bledy_chodu)} bledow cyklu, "
              f"{len(bledy_bezruchu)} bledow pozy bezruchu. NIC nie zapisano.")
    elif ZAPISZ:
        # ⚠⚠ ZAPIS IDZIE POD JAWNA SCIEZKE, nie przez `save_mainfile()`.
        # `save_mainfile()` pisze do pliku, ktory jest OTWARTY - a ten skrypt
        # bywa uruchamiany na kopii roboczej z `blender/wersje/`. Wersja bez
        # sciezki nadpisala wtedy KOPIE ZAPASOWA v1, zostawiajac
        # `public/assets/char.blend` z poprzednia postacia. Raport pisal
        # przy tym "char.blend nadpisany" i byl prawdziwy - tylko o innym
        # pliku. Zlapane dopiero na md5 wyeksportowanego .glb.
        print(f"[zapis] cel: {CEL}")
        bpy.ops.wm.save_as_mainfile(filepath=CEL, copy=False)
        print("[zapis] zapisano przebudowe (bez krokow eksportu)")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: -- --zapisz")

    char3d_attack.zdejmij_obrot_turntable(bpy.data.objects["Armature"])
    char3d_zones.apply_zones()
    print("-" * 70)
    print("PO przebudowie:")
    nowe = char3d_base.zmierz()

    print("-" * 70)
    print(f"{'miara':22} {'stary':>10} {'nowy':>10}   {'cel':>12}")
    for klucz, cel in (("glow", "6,5"), ("glowa_W_do_H", "< 0,85"),
                       ("glowa_do_barkow", "< 0,55"), ("wzrost_j", "~12,8")):
        print(f"{klucz:22} {stare[klucz]:10.2f} {nowe[klucz]:10.2f}   {cel:>12}")

    # ⚠⚠ KLATKA DO RENDERU USTAWIANA JAWNIE — `apply_zones()` zostawia scene na
    # klatce 1 (potrzebuje zdefiniowanej pozy, zeby policzyc strefy glowy w
    # przestrzeni SWIATA). Do etapu A2 klatka 1 BYLA poza stojaca, wiec przymiar
    # trafial w nia przypadkiem. Po A2 poza stojaca ma wlasna klatke (`BEZRUCH`),
    # a klatka 1 to `przeniesienie A` — czyli srodek kroku z uniesiona stopa.
    # Arkusz `nowy_*` po cichu przestal pokazywac sylwetke, a zaczal pokazywac
    # poze chodu: nogi w rozkroku, jedna stopa w gorze. Ocena sylwetki z takiego
    # renderu jest ocena czego innego, a raport milczal (regula nr 1 katalogu).
    scn_r = bpy.context.scene
    scn_r.frame_set(char3d_walk.BEZRUCH)
    bpy.context.view_layer.update()
    pliki = renderuj("nowy")
    # Drugi komplet w POZIE SPOCZYNKOWEJ. Rozdziela dwa rozne bledy, ktore
    # w jednym renderze wygladaja identycznie: zla GEOMETRIA i zla ANIMACJA.
    arm = bpy.data.objects["Armature"]
    arm.data.pose_position = "REST"
    bpy.context.view_layer.update()
    pliki += renderuj("rest")
    arm.data.pose_position = "POSE"
    bpy.context.view_layer.update()
    print(f"[render] {len(pliki)} widokow -> {KATALOG}")


main()

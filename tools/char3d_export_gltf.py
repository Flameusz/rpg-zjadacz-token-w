"""char.blend -> glTF (.glb) do uzycia w silniku.

    blender -b char.blend --python char3d_export_gltf.py -- <plik.glb>

⚠ NIE ZAPISUJE nic do char.blend - wszystkie korekty ponizej dzialaja tylko
w pamieci tej sesji Blendera.

Trzy rzeczy musza sie stac PRZED eksportem, inaczej plik wyglada na poprawny
i dopiero w grze widac, ze jest do niczego:

1. Akcja "Walk" ma wkluczowany obrot calego OBIEKTU o -90 st. na klatkach
   0/3/6/9 (autor zrobil "chod z czterech stron" w jednej akcji). W silniku
   kierunek postaci ustawia gra, wiec ten obrot musi zniknac - inaczej postac
   krecilaby sie w kolko podczas chodzenia.
2. Cykl pozy ma tylko klatki 0-2; reszta to jego powtorzenia. Eksportujemy
   zakres 0-3, gdzie klatka 3 == klatka 0, zeby petla domykala sie gladko.
3. glTF NIE ZNA WIEZOW IK. Rig ma IK na obu rekach i obu nogach, wiec bez
   zapieczenia do kluczy FK eksport wyszedlby jako postac w pozie spoczynkowej.
   Eksporter Blendera probkuje animacje (`export_force_sampling`), co zalatwia
   to samo - ustawiamy jawnie, zeby nie zalezec od domyslnej wartosci.
"""
import bpy
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_attack  # noqa: E402
import char3d_zones   # noqa: E402
import char3d_armor   # noqa: E402
import char3d_weapons # noqa: E402
import char3d_shields # noqa: E402
import char3d_chod    # noqa: E402
import char3d_walk    # noqa: E402
import char3d_base    # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:]
CEL = argv[0]
os.makedirs(os.path.dirname(os.path.abspath(CEL)), exist_ok=True)

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]

# --- 1. Zdejmij obrot turntable z akcji ---
# Wspolna funkcja, zeby eksport i podglady nie mogly sie rozjechac.
usuniete = char3d_attack.zdejmij_obrot_turntable(arm)
print(f"[fix] zdjeto {usuniete} krzywych obiektowych (obrot turntable)")

# --- 1b. Strefy koloru + pancerz jako osobna warstwa ---
# Bez tego model w grze jest szary: glTF niesie oryginalne materialy z
# char.blend, a strefy zyly dotad wylacznie po stronie pre-renderu.
char3d_zones.apply_zones()
# ⭐ Pancerz z gry (pilot: tors) — `Pancerz_<id>`; bramka pokrycia wypisuje,
#   co jest jeszcze poza pilotem, i PRZERYWA eksport na sztuce torsu bez modelu.
if char3d_armor.sprawdz_pokrycie():
    raise SystemExit("BLAD: pokrycie pancerza niekompletne — patrz raport wyzej")
char3d_armor.zbuduj_wszystkie()
char3d_weapons.zbuduj_wszystkie(arm)
# Tarcza jedzie w LEWEJ dloni jako trzeci slot wymienny (`Tarcza_`).
char3d_shields.zbuduj_wszystkie(arm, okute=True)   # + warianty żelazne/stalowe (shield_shapes.OKUCIA)
# ⭐ Twarz gracza (2026-10-10): pixel-art z `tools/build_player_face.py`, rzut
#   wspólny z mieszkańcami. PO pancerzu — hełmy to kopie głowy i nie mają
#   nieść materiału twarzy. Głowa ma niezastosowane lustro → lustro UV.
import char3d_face  # noqa: E402
import build_player_face  # noqa: E402
char3d_face.naloz_twarz(char3d_base.PROPORCJE, build_player_face.TWARZ, lustro_u=True)

# --- 2. Dobuduj akcje ataku (zrodlo: tools/char3d_attack.py) ---
chod = arm.animation_data.action
chod.use_fake_user = True     # inaczej przepada, gdy podepniemy pod rig atak
# ⚠ Akcja "Walk" ma 6 klatek: 0-3 to cykl, 4 domyka petle (== klatka 0),
# a 5 to POZA BEZRUCHU, ktora do petli NIE NALEZY. Eksportujemy caly ten
# zakres jednym klipem, bo inaczej bezruch musialby byc osobna akcja i
# wszystkie warianty wyposazenia zrobilyby sie podwojnie.
# Podzial na petle i poze robi `src/render3d/Character3D.ts` przez `subclip`.
chod.use_frame_range = True
chod.frame_start, chod.frame_end = 0, char3d_walk.BEZRUCH
# Dwa klipy ciosu. ⚠ Oburęczny NIE jest wariantem jednoręcznego z doklejoną
# lewą ręką — ma własny tor, bo przy torze jednoręcznym lewa dłoń puszczala
# drzewce w klatce ciecia (zmierzone: 0,88 j. od osi). Patrz `POZY_2H`.
atak2h, bledy2 = char3d_attack.zbuduj_atak(arm, oburacz=True)
atak2h.use_fake_user = True
atak, bledy = char3d_attack.zbuduj_atak(arm)
atak.use_fake_user = True

# ⭐ Każdy wariant chodu z bronią/tarczą jest NAGRYWANY i po bloku odtwarzany
#   z biegiem jako źródłem (`Run_*`, 2026-10-03) — jedna lista wariantów,
#   dwa cykle nóg. ⛔ Nie przepisuj listy drugi raz dla biegu.
_warianty_chodu = []
_zbuduj_chod = char3d_chod.zbuduj_chod_uzbrojony


def _nagraj(*a, **k):
    _warianty_chodu.append((a, k))
    return _zbuduj_chod(*a, **k)


char3d_chod.zbuduj_chod_uzbrojony = _nagraj
# ⚠ Chod Z BRONIA to osobne klipy, nie wariant zwyklego chodu. Oryginalny cykl
# macha obiema rekami i przy nim miecz schodzil 2,18 j. pod linie stop, a
# wlocznia 3,43 — w bezruchu obie byly czyste, wiec to sie nie rzucalo.
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False)
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=True)
# PCHNIĘCIE drzewcowej (2026-10-03, `tools/char3d_thrust.py`): oburącz i z tarczą.
import char3d_thrust  # noqa: E402
char3d_thrust.zbuduj_pchniecie(arm, oburacz=True)
char3d_thrust.zbuduj_pchniecie(arm, oburacz=False)
# UDERZENIE TARCZĄ (2026-10-11, `tools/char3d_shield_bash.py`): lewa dłoń
# wybija tarczę z gardy; silnik gra go przy `poza: "tarcza"`.
import char3d_shield_bash  # noqa: E402
_bash, _bledy_bash = char3d_shield_bash.zbuduj_uderzenie_tarcza(arm)
if _bledy_bash:
    raise SystemExit(f"BLAD: uderzenie tarczą — {_bledy_bash}")
# CARRY broni drzewcowej poza walką: pionowo przy boku, z tarczą albo bez
# (zgłoszone 2026-10-03: „nie jak bazooka" — `char3d_chod.NIESIENIE_DRZEWCE`).
char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, tarcza=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, tarcza=True, duza=True)
# GOTOWOŚĆ drzewcowej W WALCE: drzewce opuszczone do przodu (oburącz / z tarczą)
char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, walka=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, drzewce=True, walka=True, tarcza=True)
# ⚠ Tarcza w lewej dloni: ta sama choroba, druga reka. Lewa dlon dotad ZAWSZE
# machala pelnym cyklem chodu niezaleznie od tego, co niesie prawa - tarcza
# wjezdzala w udo. Cztery warianty: {goła prawa reka, bron jednoreczna} ×
# {postawa spoczynkowa, bojowa} (chwyt oburęczny wyklucza tarcze, wiec
# kombinacji z Walk_Armed_2H nie ma). Wybor spoczynek/walka nalezy do
# `Character3D.ts` (`Player.wWalce`) w czasie gry, nie do eksportu - tu
# budujemy oba warianty na zapas.
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=False, tarcza=True, walka=False)
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=False, tarcza=True, walka=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True, tarcza=True, walka=False)
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True, tarcza=True, walka=True)
# ⚠ PROFIL LARGE (2026-09-21): DWA dodatkowe klipy CARRY dla tarcz, ktore
# w zwyklej pozie niesienia oralyby grunt (migdalowa, legionowa, pawez).
# ⛔ To sa DWA profile na szesc konstrukcji, nie szesc animacji — a GUARD
# zostaje JEDEN dla wszystkich, wiec `walka=True` nie ma wariantu `_Large`.
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=False, tarcza=True,
                                  walka=False, duza=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, bron=True, tarcza=True,
                                  walka=False, duza=True)
char3d_chod.zbuduj_chod_uzbrojony = _zbuduj_chod
# ⭐ BIEG (`tools/char3d_run.py`): klip `Run` + te same warianty z niego.
import char3d_run  # noqa: E402
_bieg, _bledy_biegu = char3d_run.zbuduj_bieg(arm)
if _bledy_biegu:
    raise SystemExit(f"BLAD: bieg — {_bledy_biegu}")
for _a, _k in _warianty_chodu:
    _zbuduj_chod(*_a, **dict(_k, zrodlo="Run"))
print(f"[bieg] {len(_warianty_chodu)} wariantów z bronią/tarczą zbudowanych także z biegu")
if bledy or bledy2:
    print(f"[UWAGA] atak ma {len(bledy) + len(bledy2)} poz poza tolerancja — patrz raport wyzej")

# --- 3. Zakres petli ---
scn.frame_start = 0
scn.frame_end = char3d_walk.BEZRUCH   # 4 pozy cyklu + domkniecie + bezruch
print(f"[zakres] sceny {scn.frame_start}-{scn.frame_end} przy {scn.render.fps} fps; "
      f"kazda akcja idzie wlasnym zakresem (tryb ACTIONS)")

# --- 3. Raport przed eksportem: co naprawde jedzie ---
mesh = [o for o in bpy.data.objects if o.type == "MESH"]
for o in mesh:
    mods = [(m.name, m.type, m.show_render) for m in o.modifiers]
    print(f"[mesh] {o.name}: parent={o.parent.name if o.parent else None} "
          f"({o.parent_type}) modyfikatory={mods}")
print(f"[rig] kosci={len(arm.data.bones)}, "
      f"wiezy IK={sum(1 for pb in arm.pose.bones for c in pb.constraints if c.type == 'IK')}")

for o in bpy.data.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm

bpy.ops.export_scene.gltf(
    filepath=CEL,
    export_format="GLB",
    use_selection=True,
    export_apply=True,          # zastosuj modyfikatory (Mirror/Subdivision/Solidify)
    export_animations=True,
    # Kazda akcja = osobny klip w glTF. Bez tego wyjechalby jeden klip z
    # aktualnie podpietej akcji i atak po prostu by nie istnial w pliku.
    export_animation_mode="ACTIONS",
    export_force_sampling=True,  # zapiecz IK do kluczy FK - patrz punkt 3 w naglowku
    export_frame_range=False,    # w trybie ACTIONS zakres bierze sie z akcji
    export_skins=True,
    export_yup=True,             # three.js/glTF: gora to +Y, Blender ma +Z
)
print("[zapis]", CEL, os.path.getsize(CEL), "bajtow")

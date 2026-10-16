"""PCHNIĘCIE bronią drzewcową — osobny klip ciosu (2026-10-03).

Moduł BLENDEROWY, importowany przez eksport i bramkę broni.
⚠ **NIE ZAPISUJE char.blend** — akcje powstają w pamięci sesji.

── Po co ─────────────────────────────────────────────────────────────────────
⚠⚠ Zgłoszone wprost przez autora: „atak włócznią to bardziej dźganie niż
machanie". Do tej daty KAŻDA broń dwuręczna grała `Attack_2H` — zamach znad
barku przez ciało — więc włócznia, pika i rohatyna, które w grze mają WYŁĄCZNIE
atak kłuty (`thrust`, `pierce`), na modelu cięły jak topór.

Silnik (`Character3D.zagrajAtak`) gra ten klip, gdy broń jest drzewcowa,
a bieżący wariant ataku zadaje obrażenia kłute (`Progression.damageType`).
Halabarda dźga pchnięciem, a rąbie zamachem — wybór idzie za WARIANTEM.

── Jak ───────────────────────────────────────────────────────────────────────
Ta sama metoda co `char3d_attack.zbuduj_atak` (dłoń IK w punkt świata, tułów
skręcony i pochylony), plus to, czego zamach nie potrzebował: **kierunek
drzewca**. W zamachu oś broni wynika z przedramienia; w pchnięciu drzewce MA
leżeć na linii celu, więc kość dłoni (poza łańcuchem IK) jest obracana tak jak
w noszeniu (`char3d_chod._ustaw_drzewce`).

⚠ **Pięć klatek, cios w klatce 2 — tak jak `Attack`.** Silnik zgrywa tempo
z zamachem (`tempoCiosu`), zakładając, że „cięcie" leży w połowie klipu;
pchnięcie musi trzymać tę samą umowę, inaczej grot dochodzi do celu nie wtedy,
gdy gra zadaje obrażenia.
"""
import bpy
from mathutils import Euler, Quaternion, Vector

import char3d_attack
import char3d_chod
import char3d_weapons

NAZWA = "Attack_Thrust"          # jednorącz (włócznia / widły z tarczą)
NAZWA_2H = "Attack_Thrust_2H"
FAZY = ["gotowość", "cofnięcie", "pchnięcie", "przeniesienie", "powrót"]

# Fazy w ŚWIECIE (postać patrzy w −Y, góra +Z, prawa strona −X), w układzie
# rigu kalibracyjnego — przeliczane `char3d_attack._przenies`, tak jak `POZY`.
# (klatka, prawa dłoń, kierunek drzewca tylec→grot, skręt tułowia °, pochylenie °)
#
# ⚠ Prawa dłoń jest PRZEDNIĄ — lewa siada `ODLEGLOSC_CHWYTU_2H` za nią, ku
# tylcowi. Pchnięcie wyprowadza obie do przodu na wyprostowanych rękach,
# a ciało idzie za nimi (skręt + pochylenie), jak przy prawdziwym wypadzie.
POZY_2H = [
    # ⚠ Pchnięcie idzie OSIĄ CIAŁA (x ≈ 0), nie po prawej: lewa dłoń siedzi
    # na drzewcu za prawą, a jej bark jest po drugiej stronie — przy prawej
    # na −0,55 lewa nie sięgała i pętla cofała broń o 1,6 j. (zmierzone).
    # ⚠ Amplituda ZMIERZONA na renderze z gry: przy cofnięciu do −0,6 i pchnięciu
    # do −3,6 grot przesuwał się raptem o ~16 px — czytało się jak drgnięcie,
    # nie jak dźgnięcie. Cofnięcie idzie dziś ZA biodro (z tułowiem w tył).
    (0, (-0.70, -1.70, -5.35), (0.0, -1.0, -0.10), 0.0, 0.0),     # gotowość: drzewce przy biodrze
    (1, (-1.10, 0.40, -5.00), (0.0, -1.0, 0.00), -28.0, -9.0),    # cofnięcie (za biodro)
    (2, (0.20, -4.10, -4.60), (0.0, -1.0, -0.05), 26.0, 20.0),    # PCHNIĘCIE
    (3, (0.05, -3.30, -4.90), (0.0, -1.0, -0.08), 16.0, 11.0),    # przeniesienie
    (4, (-0.70, -1.70, -5.35), (0.0, -1.0, -0.10), 0.0, 0.0),     # powrót
]

# Jednorącz (z tarczą w lewej): prawa dłoń sama prowadzi drzewce przy boku.
# Lewa idzie do tej samej pozy, co w zwykłym ciosie jednoręcznym.
POZY_1H = [
    (0, (-1.55, -1.10, -5.40), (0.0, -1.0, -0.08), 0.0, 0.0),
    (1, (-1.80, 1.20, -4.80), (0.0, -1.0, 0.02), -26.0, -8.0),
    (2, (-0.95, -4.10, -4.50), (0.0, -1.0, -0.05), 24.0, 18.0),
    (3, (-1.15, -3.30, -4.80), (0.0, -1.0, -0.07), 14.0, 10.0),
    (4, (-1.55, -1.10, -5.40), (0.0, -1.0, -0.08), 0.0, 0.0),
]
LEWA_1H = (1.79, 0.45, -6.74)    # jak `char3d_attack.POZY` — lewa przy biodrze

# ⭐ WYPAD miednicy (j. świata): (do przodu, w dół) na klatkę.
# ⚠ Bez niego pchnięcie ograniczał ZASIĘG RAMIENIA — dłoń stawała 1,8 j. przed
# celem, a grot ruszał się o ~13 px między cofnięciem a pchnięciem. Ciało
# idzie za ręką: miednica wysuwa się i obniża, stopy zostają na gruncie
# (kontrolki IK nóg są nieruchome), więc nogi same uginają się w wypad.
WYPAD = [(0.0, 0.0), (-0.35, 0.05), (1.00, 0.40), (0.65, 0.25), (0.0, 0.0)]
MIEDNICA = "Bone"


def _baza_miednicy(arm):
    """Macierz: przesunięcie lokalne kości miednicy → przesunięcie w świecie.

    Zmierzona sondą (jak `char3d_attack.BAZA_OSI_R`), bo osie lokalne kości
    nie mają nic wspólnego z osiami świata (lokalne Y miednicy to światowe Z).
    """
    from mathutils import Matrix
    pb = arm.pose.bones[MIEDNICA]
    pb.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    zero = arm.matrix_world @ pb.head
    kol = []
    for os_ in ((1, 0, 0), (0, 1, 0), (0, 0, 1)):
        pb.location = os_
        bpy.context.view_layer.update()
        kol.append((arm.matrix_world @ pb.head) - zero)
    pb.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    return Matrix([[kol[j][i] for j in range(3)] for i in range(3)])


def zbuduj_pchniecie(arm=None, oburacz=True, tolerancja=0.85):
    """Tworzy (albo nadpisuje) klip pchnięcia i zwraca (akcja, błędy)."""
    arm = arm or bpy.data.objects["Armature"]
    nazwa = NAZWA_2H if oburacz else NAZWA
    stara = bpy.data.actions.get(nazwa)
    if stara:
        bpy.data.actions.remove(stara)
    akcja = bpy.data.actions.new(nazwa)
    akcja.use_fake_user = True
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = akcja

    hr = arm.pose.bones["HandIK_R.005"]
    hl = arm.pose.bones["HandIK_L.005"]
    talia = arm.pose.bones["Bone.001"]
    piers = arm.pose.bones["Bone.002"]
    pb_r = arm.pose.bones[char3d_attack.DLON_R]
    miednica = arm.pose.bones[MIEDNICA]
    bark_w, skala = char3d_attack._przelicznik(arm)
    bledy = []
    m_inv = _baza_miednicy(arm).inverted()

    for klatka, praw_w, os_cel, skret, pochyl in (POZY_2H if oburacz else POZY_1H):
        bpy.context.scene.frame_set(klatka)
        wprzod, wdol = WYPAD[klatka]
        miednica.location = m_inv @ Vector((0.0, -wprzod, -wdol))   # postać patrzy w −Y
        # Cel dłoni jedzie RAZEM z miednicą — wypad ma wydłużyć pchnięcie,
        # a nie skrócić rękę o tyle, o ile przesunęło się ciało.
        praw_w = tuple(Vector(char3d_attack._przenies(praw_w, bark_w, skala, prawa=True))
                       + Vector((0.0, -wprzod, -wdol)))
        # Tułów NAJPIERW — przesuwa barki (ta sama kolejność co w `zbuduj_atak`).
        talia.rotation_quaternion = Euler(
            (pochyl * 0.0175, skret * 0.6 * 0.0175, 0.0), "XYZ").to_quaternion()
        piers.rotation_quaternion = Euler(
            (pochyl * 0.5 * 0.0175, skret * 0.4 * 0.0175, 0.0), "XYZ").to_quaternion()
        pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
        bpy.context.view_layer.update()

        if oburacz:
            # Lewa dłoń leży na drzewcu ZA prawą; gdy wypada poza zasięg lewego
            # ramienia, prawa (czyli cała broń) podchodzi do lewego barku —
            # ta sama pętla co w `zbuduj_atak`, z kierunkiem drzewca ustawianym
            # w każdej iteracji (od niego zależy, gdzie wypada chwyt lewej).
            # ⚠⚠ Bark lewy z BIEŻĄCEJ pozy, nie ze spoczynku (`head_local`).
            # Przy wypadzie i pochyleniu bark jedzie ~2,6 j. do przodu; liczony
            # ze spoczynku „nie sięgał" i pętla cofała całą broń do tyłu
            # (zmierzone: dłoń w pchnięciu 0,9 j. ZA gotowością).
            zasieg_l = ((arm.matrix_world @ arm.data.bones["Bone.002_L.003"].head_local)
                        - (arm.matrix_world @ arm.data.bones["Bone.002_L.001"].head_local)).length
            cel_prawa = Vector(praw_w)
            cel_lewa = None
            for _ in range(5):
                dg0 = bpy.context.evaluated_depsgraph_get()
                bark_l = (arm.evaluated_get(dg0).matrix_world
                          @ arm.evaluated_get(dg0).pose.bones["Bone.002_L.001"].head)
                char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R, tuple(cel_prawa), True,
                                       ulamek_zasiegu=0.90, bark_z_pozy=True)
                pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
                bpy.context.view_layer.update()
                char3d_chod._ustaw_drzewce(arm, pb_r, os_cel)
                dg = bpy.context.evaluated_depsgraph_get()
                ev = arm.evaluated_get(dg)
                chwyt_w = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_R].tail
                os_w = char3d_attack._os_drzewca(ev, char3d_weapons.KAT_2H)
                cel_lewa = chwyt_w - os_w * char3d_weapons.ODLEGLOSC_CHWYTU_2H
                nadmiar = (cel_lewa - bark_l).length - zasieg_l * 0.97
                if nadmiar <= 0.0:
                    break
                cel_prawa += (bark_l - cel_prawa).normalized() * nadmiar
            char3d_attack._dopasuj(arm, hl, char3d_attack.DLON_L, tuple(cel_lewa), False,
                                   bark_z_pozy=True)
        else:
            char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R, praw_w, True, bark_z_pozy=True)
            pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
            bpy.context.view_layer.update()
            char3d_chod._ustaw_drzewce(arm, pb_r, os_cel)
            lewa = char3d_attack._przenies(LEWA_1H, bark_w, skala, prawa=False)
            char3d_attack._dopasuj(arm, hl, char3d_attack.DLON_L, lewa, False, bark_z_pozy=True)

        # Kontrola: prawa dłoń tam, gdzie zamówiono (w oburęcznym mogła podejść
        # do lewego barku — wtedy różnica jest zamierzona, ale ma być mała).
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        osiag = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_R].head
        d = (osiag - Vector(praw_w)).length
        if d > tolerancja:
            bledy.append((klatka, round(d, 2)))
        os_w = char3d_attack._os_drzewca(ev, char3d_weapons.KAT_2H)
        print(f"  [{'OK ' if d <= tolerancja else 'BLAD'}] klatka {klatka} ({FAZY[klatka]:13}) "
              f"dlon blad={d:.2f}  os drzewca=({os_w.x:+.2f},{os_w.y:+.2f},{os_w.z:+.2f})")

        for pb, kanal in ((hr, "location"), (hl, "location"),
                          (talia, "rotation_quaternion"), (piers, "rotation_quaternion"),
                          (pb_r, "rotation_quaternion"), (miednica, "location")):
            pb.keyframe_insert(data_path=kanal, frame=klatka, group=pb.name)

    # ⚠⚠ ZERUJ obrót kości dłoni po zbudowaniu klipu. Kość nie ma kluczy
    # w `Attack`/`Attack_2H`, więc eksport (próbkowanie) i bramka czytałyby
    # w nich OSTATNI obrót z pchnięcia — zmierzone: lewa dłoń 0,39 → 0,59 j.
    # od drzewca w zamachu wszystkich drzewcowych.
    pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
    miednica.location = (0.0, 0.0, 0.0)     # ta sama zasada co z obrotem dłoni
    bpy.context.view_layer.update()
    print(f"[pchniecie] akcja '{nazwa}': 5 poz{' (chwyt oburęczny)' if oburacz else ''}"
          f"{f', {len(bledy)} poza tolerancja {tolerancja}' if bledy else ''}")
    return akcja, bledy

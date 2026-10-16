"""UDERZENIE TARCZĄ — osobny klip ciosu (2026-10-11).

Moduł BLENDEROWY, importowany przez eksport (`char3d_export_gltf.py`).
⚠ **NIE ZAPISUJE char.blend** — akcja powstaje w pamięci sesji.

── Po co ─────────────────────────────────────────────────────────────────────
Przegląd umiejętności po przejściu na model 3D (2026-10-11): Uderzenie tarczą
grało zwykły `Attack`, czyli na modelu postać MACHAŁA BRONIĄ, a tarcza stała
w gardzie — choć w grze cios wyprowadza TARCZA (`PLAYER_ACTIONS.shieldBash`:
profil z drugiej ręki, zużywa tarczę, nie broń). Silnik gra ten klip, gdy
zamach niesie `poza: "tarcza"` i tarcza jest w dłoni
(`Character3D.klipCiosu`).

── Jak ───────────────────────────────────────────────────────────────────────
Metoda `char3d_thrust.zbuduj_pchniecie` w lustrze: tam prawa dłoń wyprowadza
drzewce, tu LEWA wyprowadza tarczę. Dłoń IK w punkt świata, tułów skręcony
lewym barkiem do przodu, miednica wypada do przodu i w dół (stopy zostają,
nogi uginają się same), a kość lewej dłoni (poza łańcuchem IK) ustawia LICO
tarczy w przód tak samo jak garda (`char3d_chod._ustaw_lico_tarczy`).

⚠ **Pięć klatek, uderzenie w klatce 2 — tak jak `Attack`.** Silnik zgrywa tempo
klipu z zamachem (`tempoCiosu`), zakładając, że trafienie leży w połowie.
⚠ **Klatka 0 i 4 = garda bojowa** (`NIESIENIE_TARCZA_WALKA`) — Uderzenie
tarczą pada w walce, więc klip startuje i kończy się tam, gdzie stoi chód
`Walk_*Shielded_Combat`, i przejście nie skacze.
"""
import bpy
from mathutils import Quaternion, Vector

import char3d_attack
import char3d_chod
import char3d_thrust

NAZWA = "Attack_ShieldBash"
FAZY = ["garda", "cofnięcie", "UDERZENIE", "przeniesienie", "powrót"]

# (klatka, lewa dłoń — tarcza, prawa dłoń — broń, skręt tułowia °, pochylenie °)
# W ŚWIECIE rigu kalibracyjnego (postać patrzy w −Y, góra +Z, lewa strona +X);
# przeliczane `char3d_attack._przenies` tak samo jak `POZY` ciosu.
# ⚠ Skręt UJEMNY = lewy bark do przodu (w `Attack` dodatni skręt wyprowadza
# prawy bark w cięcie przez ciało).
GARDA = char3d_chod.NIESIENIE_TARCZA_WALKA
PRAWA_GOTOWOSC = char3d_attack.POZY[0][1]
POZY = [
    (0, GARDA, PRAWA_GOTOWOSC, 0.0, 0.0),
    # ⚠ Cofnięcie POGŁĘBIONE po renderze z kamery gry: przy (1,55; −1,0; −4,1)
    # i skręcie 16° klatka 1 nie różniła się od gardy — uderzenie nie miało
    # zamachu, a cios bez widocznego zamachu się nie czyta (`char3d_attack`).
    (1, (1.85, -0.20, -3.70), (-1.80, 0.30, -6.10), 24.0, -6.0),     # cofnięcie do piersi
    (2, (0.95, -4.40, -4.10), (-1.95, 0.60, -6.00), -26.0, 14.0),    # UDERZENIE
    (3, (1.05, -3.70, -4.25), (-1.85, 0.40, -6.10), -16.0, 9.0),     # przeniesienie
    (4, GARDA, PRAWA_GOTOWOSC, 0.0, 0.0),
]
# Wypad miednicy (do przodu, w dół) w j. świata — jak `char3d_thrust.WYPAD`.
# Bez niego tarcza dochodziła tylko na długość ręki i uderzenie czytało się
# jak odepchnięcie łokciem.
WYPAD = [(0.0, 0.0), (-0.40, 0.0), (1.00, 0.35), (0.60, 0.20), (0.0, 0.0)]
# Lico tarczy: w gardzie i powrocie kant gardy (`LICO_TARCZY_WALKA`), w samym
# uderzeniu prawie prosto w przód — płaszczyzna, którą się uderza.
LICO = [char3d_chod.LICO_TARCZY_WALKA,
        char3d_chod.LICO_TARCZY_WALKA,
        (0.15, -0.989, 0.0),
        (0.25, -0.968, 0.0),
        char3d_chod.LICO_TARCZY_WALKA]


def zbuduj_uderzenie_tarcza(arm=None, tolerancja=0.85):
    """Tworzy (albo nadpisuje) klip uderzenia tarczą i zwraca (akcja, błędy)."""
    arm = arm or bpy.data.objects["Armature"]
    stara = bpy.data.actions.get(NAZWA)
    if stara:
        bpy.data.actions.remove(stara)
    akcja = bpy.data.actions.new(NAZWA)
    akcja.use_fake_user = True
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = akcja

    hr = arm.pose.bones["HandIK_R.005"]
    hl = arm.pose.bones["HandIK_L.005"]
    talia = arm.pose.bones["Bone.001"]
    piers = arm.pose.bones["Bone.002"]
    pb_r = arm.pose.bones[char3d_attack.DLON_R]
    pb_l = arm.pose.bones[char3d_attack.DLON_L]
    miednica = arm.pose.bones[char3d_thrust.MIEDNICA]
    bark_w, skala = char3d_attack._przelicznik(arm)
    m_inv = char3d_thrust._baza_miednicy(arm).inverted()
    bledy = []

    for klatka, lewa_w, prawa_w, skret, pochyl in POZY:
        bpy.context.scene.frame_set(klatka)
        wprzod, wdol = WYPAD[klatka]
        przes = Vector((0.0, -wprzod, -wdol))          # postać patrzy w −Y
        miednica.location = m_inv @ przes
        # Cele dłoni jadą RAZEM z miednicą — wypad ma wydłużyć uderzenie,
        # a nie skrócić rękę o tyle, o ile przesunęło się ciało.
        lewa_w = tuple(Vector(char3d_attack._przenies(lewa_w, bark_w, skala, prawa=False)) + przes)
        prawa_w = tuple(Vector(char3d_attack._przenies(prawa_w, bark_w, skala, prawa=True)) + przes)
        # Tułów NAJPIERW — przesuwa barki (kolejność jak w `zbuduj_atak`).
        from mathutils import Euler
        talia.rotation_quaternion = Euler(
            (pochyl * 0.0175, skret * 0.6 * 0.0175, 0.0), "XYZ").to_quaternion()
        piers.rotation_quaternion = Euler(
            (pochyl * 0.5 * 0.0175, skret * 0.4 * 0.0175, 0.0), "XYZ").to_quaternion()
        pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
        pb_l.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
        bpy.context.view_layer.update()

        char3d_attack._dopasuj(arm, hr, char3d_attack.DLON_R, prawa_w, True, bark_z_pozy=True)
        char3d_attack._dopasuj(arm, hl, char3d_attack.DLON_L, lewa_w, False, bark_z_pozy=True)
        # Lico i pion tarczy — PO IK (kość dłoni jest poza łańcuchem), w tej
        # samej kolejności co garda: najpierw lico, potem pion.
        pb_l.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
        bpy.context.view_layer.update()
        lico = Vector(LICO[klatka]).normalized()
        char3d_chod._ustaw_lico_tarczy(arm, pb_l, tuple(lico))
        char3d_chod._ustaw_pion_tarczy(arm, pb_l, char3d_chod.PION_TARCZY_WALKA)
        bpy.context.view_layer.update()

        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        osiag = ev.matrix_world @ ev.pose.bones[char3d_attack.DLON_L].head
        d = (osiag - Vector(lewa_w)).length
        if d > tolerancja:
            bledy.append((klatka, round(d, 2)))
        print(f"  [{'OK ' if d <= tolerancja else 'BLAD'}] klatka {klatka} ({FAZY[klatka]:13}) "
              f"lewa dlon blad={d:.2f}  osiagnieta=({osiag.x:+.2f},{osiag.y:+.2f},{osiag.z:+.2f})")

        for pb, kanal in ((hr, "location"), (hl, "location"),
                          (talia, "rotation_quaternion"), (piers, "rotation_quaternion"),
                          (pb_r, "rotation_quaternion"), (pb_l, "rotation_quaternion"),
                          (miednica, "location")):
            pb.keyframe_insert(data_path=kanal, frame=klatka, group=pb.name)

    # ⚠⚠ ZERUJ obrót kości obu dłoni i miednicę po zbudowaniu klipu — klipy
    # bez kluczy na tych kościach (eksport próbkuje) czytałyby inaczej OSTATNI
    # stan stąd. Ta sama zasada co w `char3d_thrust`.
    pb_r.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
    pb_l.rotation_quaternion = Quaternion((1.0, 0.0, 0.0), 0.0)
    miednica.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    print(f"[uderzenie tarcza] akcja '{NAZWA}': 5 poz"
          f"{f', {len(bledy)} poza tolerancja {tolerancja}' if bledy else ''}")
    return akcja, bledy

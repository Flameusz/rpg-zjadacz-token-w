"""Broń w dłoni jako wymienne elementy — prawa dłoń modelu 3D.

Moduł BLENDEROWY, importowany przez skrypty podglądu i eksportu.
⚠ **NIE ZAPISUJE char.blend** — elementy powstają w pamięci sesji.

── Kształt i wymiar: NIE TUTAJ (od 2026-10-03) ───────────────────────────────
⭐⭐ Długość, przekrój i sylwetkę każdej broni czytamy z `tools/weapon_shapes.py`
— jednego źródła, tak jak tarcze czytają z `shield_shapes.py`. Tutaj zostaje
wyłącznie MOCOWANIE (`chwyt`, `obrot`), a ręce (`rece`) czytamy z GameConfig.

⚠⚠ Do 2026-10-03 stał tu słownik jedenastu atrap z pudełek, a **26 z 37
broni katalogu nie miało modelu**: postać trzymała POWIETRZE, `console.warn`
i nic więcej. ⛔ Nie wracaj do wpisywania brył tutaj.

`BRONIE` zostaje jako WYLICZANY interfejs (`rodzina`, `rece`, `chwyt`,
`obrot`, `dlugosc` — jednostki LOKALNE kości), bo czytają go bramka,
podglądy i przymiary.

── Jednostki ─────────────────────────────────────────────────────────────────
⚠⚠ Broń jest dzieckiem kości, więc dziedziczy SKALĘ ARMATURY (1,6527): jedna
jednostka lokalna to 1,6527 j. świata = 23,8 cm. `weapon_shapes` mówi
w centymetrach świata; przeliczenie `CM_NA_LOKALNE` jest tylko tutaj.
Zmierzone 2026-10-03: atrapa miecza o długości lokalnej 4,0 miała w świecie
6,61 j. = 95 cm — i dopiero ten pomiar wyjaśnił, że cały stary roster stał
w skali ~1:1, a nie „×0,64", jak wychodziło z liczenia bez armatury.

── Chwyt: gdzie naprawdę siada broń ──────────────────────────────────────────
⚠ Przy `parent_type='BONE'` obiekt siada na OGONIE kości, a jego lokalne +Y
biegnie wzdłuż kości, na zewnątrz dłoni. Broń budujemy więc wzdłuż +Y i
przesuwamy o `-chwyt`, żeby PUNKT CHWYTU wypadł w pięści, a nie koniec
drzewca. Bez tego młot trzyma się za czubek trzonka, a topór lewituje.

── Kąt noszenia ──────────────────────────────────────────────────────────────
`obrot` (stopnie, XYZ w przestrzeni kości dłoni) to KĄT NOSZENIA i jest
własnością PRZEDMIOTU, nie pozy. ⚠ Bez niego długa broń wlecze się po ziemi:
przy opuszczonej ręce oś +Y kości celuje w dół.
⚠ DODATNI kąt pochyla broń DO PRZODU (głowica przed stopami), ujemny — do
tyłu, za piętę. Zmierzone 2026-10-12: siekiera i młot z −14°/−18° wisiały
przy opuszczonej ręce PIONOWO, głowicą przy kostce i lekko za nią („topór
trzymany w dziwny sposób", autor). ⭐ Topory i obuchowe 1H noszą się dziś
jak miecz: +30°, głowica przed nogą, ostrze ku ziemi.
⚠⚠ Miecz: 16° → 30° (A6.1, 2026-09-20) — więz IK nie kontroluje OBROTU kości
(`use_rotation=False`), nadgarstek wychodzi z łańcucha raz pod 65,8°, raz pod
80,7°, i to wbijało ostrze w grunt. Kąt noszenia jest właściwym miejscem na
kompensację. Przymiar: 16° → +0,457 BŁĄD · 26° → +0,052 · **30° → −0,156**.

── Ostrze prowadzi cios (2026-10-12) ────────────────────────────────────────
⚠⚠ Do tej daty ostrze (`+x`) siedziało na lokalnym +Z i w klatce CIĘCIA
patrzyło w górę, a głowica szła w dół — cały roster uderzał grzbietem
(topór: ostrze·ruch −0,35, szabla −0,73). Na symetrycznym mieczu niewidoczne,
na toporze rzuca się w oczy. Dziś ostrze leży na −Z (`OSTRZE_LOKALNE`), czyli
obrót o 180° wokół trzonka: w cięciu prowadzi (+0,76 u topora), w zamachu
patrzy w tył za barkiem, w noszeniu — ku ziemi. Pilnuje bramka
`char3d_sprawdz_bron` (kolumna „ostrze"). ⚠ Drzewcowe zostają na +Z
(`OSTRZE_DRZEWCOWEJ`) — ich ostrze ustawia poza, nie siatka; patrz stała.
Zamach halabardy (`Attack_2H`) prowadzi więc dalej hakiem — otwarte.

── Dwuręczne ─────────────────────────────────────────────────────────────────
⚠ Wszystkie CELOWO mają ten sam kąt noszenia (`KAT_2H`). Gdyby się różniły,
każda potrzebowałaby własnego klipu chwytu oburęcznego, bo lewa dłoń musi
trafić na drzewce, a drzewce leży tam, gdzie ustawi je ten kąt. Jeden wspólny
kąt = jeden klip `Attack_2H` na całą rodzinę.
⚠ Lewa dłoń siada `ODLEGLOSC_CHWYTU_2H` za prawą, ku dołowi broni — więc
prawa musi trzymać co najmniej tyle od końca rękojeści (asercja niżej).
"""
import math

import bpy
from mathutils import Matrix

from char3d_zones import _ustaw_kolor
import shield_shapes
import weapon_shapes

KOSC_DLONI = "Bone.002_R.003"
PRZEDROSTEK = "Bron_"
# Kierunek OSTRZA (`+x` z `weapon_shapes`) w przestrzeni obiektu broni —
# czytają go poza drzewcowej (`char3d_chod`) i bramka (`char3d_sprawdz_bron`).
# ⚠ −Z, nie +Z (2026-10-12) — patrz „Ostrze prowadzi cios" w nagłówku.
OSTRZE_LOKALNE = (0.0, 0.0, -1.0)
# ⚠ DRZEWCOWE zostają na +Z: ich ostrze ustawia POZA (`char3d_chod._ustaw_drzewce`
#   obraca nadgarstek, aż ostrze patrzy w przód), więc odwrócenie siatki
#   odwróciłoby tylko NADGARSTEK o 180° — zmierzone: dłoń w pchnięciu 1,20 →
#   1,44 j. od celu i nowy błąd w przeniesieniu.
OSTRZE_DRZEWCOWEJ = (0.0, 0.0, 1.0)


def ostrze_lokalne(bron_id):
    """Gdzie w obiekcie broni leży jej ostrze (`+x` z `weapon_shapes`)."""
    return OSTRZE_DRZEWCOWEJ if BRONIE[bron_id]["rodzina"] == "polearm" else OSTRZE_LOKALNE

# Skala obiektu `Armature` — niezmiennik rigu (`docs/postac3d_checkpoint.md`).
# Sprawdzana przy budowie: rozjazd przeskalowałby po cichu cały arsenał.
SKALA_ARMATURY = 1.6527
CM_NA_LOKALNE = shield_shapes.J_NA_CM / SKALA_ARMATURY     # 0,04197 j./cm

# Wspólny kąt noszenia broni dwuręcznej — patrz nagłówek.
KAT_2H = -40.0
# Jak daleko za prawą dłonią, wzdłuż drzewca, siada lewa (jednostki lokalne).
ODLEGLOSC_CHWYTU_2H = 1.05

# ── MOCOWANIE ──────────────────────────────────────────────────────────────
# `chwyt` — cm od dołu broni (te same cm, co `weapon_shapes`), punkt w pięści.
#           1H: środek rękojeści; 2H: miejsce PRAWEJ dłoni (lewa niżej).
# `obrot` — kąt noszenia. Dla `rece == 2` ZAWSZE `KAT_2H` (patrz nagłówek);
#           wpis tutaj byłby ignorowany, więc go nie ma.
MOCOWANIE = {
    # sztylety
    "knife":         dict(chwyt=5.0),
    "dagger":        dict(chwyt=6.5),
    "misericorde":   dict(chwyt=7.0),
    # miecze
    "short_sword":   dict(chwyt=8.0),
    "messer":        dict(chwyt=7.5, obrot=(15, 0, 0)),
    "cleaver_sword": dict(chwyt=7.5, obrot=(15, 0, 0)),
    "sword":         dict(chwyt=8.6, obrot=(30, 0, 0)),
    "sabre":         dict(chwyt=7.0, obrot=(30, 0, 0)),
    "longsword":     dict(chwyt=12.0, obrot=(30, 0, 0)),
    "rapier":        dict(chwyt=9.5, obrot=(40, 0, 0)),   # najdłuższa 1H: 30° → +0,56 j. pod stopy
    "bastard_sword": dict(chwyt=27.5),
    "greatsword":    dict(chwyt=28.0),
    "zweihander":    dict(chwyt=31.0),
    # topory — 1H noszone jak miecz (+30°): głowica przed nogą, nie przy kostce
    "hatchet":       dict(chwyt=9.0, obrot=(30, 0, 0)),
    "axe":           dict(chwyt=10.7, obrot=(30, 0, 0)),
    "bearded_axe":   dict(chwyt=10.0, obrot=(30, 0, 0)),
    "battle_axe":    dict(chwyt=31.0),
    "dane_axe":      dict(chwyt=34.0),
    "bardiche":      dict(chwyt=36.0),
    "labrys":        dict(chwyt=31.0),
    # obuchowe — 1H jak topory (+30°); pionowo w dół czytały się jak wiszący kij
    "stick":         dict(chwyt=8.3, obrot=(30, 0, 0)),
    "club":          dict(chwyt=9.5, obrot=(30, 0, 0)),
    "great_club":    dict(chwyt=12.0, obrot=(30, 0, 0)),
    "hammer":        dict(chwyt=10.7, obrot=(30, 0, 0)),
    "mace":          dict(chwyt=7.0, obrot=(30, 0, 0)),
    "war_pick":      dict(chwyt=10.0, obrot=(30, 0, 0)),
    "war_hammer_1h": dict(chwyt=9.0, obrot=(30, 0, 0)),
    "flail":         dict(chwyt=10.0, obrot=(30, 0, 0)),
    "chain_mace":    dict(chwyt=9.0, obrot=(30, 0, 0)),
    "war_hammer":    dict(chwyt=31.0),
    "peasant_flail": dict(chwyt=40.0),
    # drzewcowe
    "spear":         dict(chwyt=62.0),
    # ⚠ Pika: chwyt 82 cm — w noszeniu PIONOWYM tylec stoi tuż nad gruntem,
    #   a grot mieści się pod górną krawędzią kadru. Przy 106 (pod stary zamach)
    #   tylec szedł pod ziemię albo grot nad kadr. Patrz `weapon_shapes` (pika).
    "pike":          dict(chwyt=82.0),
    "halberd":       dict(chwyt=58.0),
    "glaive":        dict(chwyt=58.0),
    "boar_spear":    dict(chwyt=58.0),
    "pitchfork":     dict(chwyt=52.0),
}


def _zbuduj_interfejs():
    z_gry = weapon_shapes.bronie_z_gry()
    out = {}
    for bid, ksz in weapon_shapes.BRONIE.items():
        m = MOCOWANIE.get(bid, {})
        g = z_gry.get(bid, {})
        rece = 2 if g.get("hands", 1) == 2 else 1
        lo, hi = weapon_shapes.zakres_y(bid)
        out[bid] = {
            "rodzina": ksz["rodzina"],
            "rece": rece,
            # ⭐ `either` (półtorak): model jeden, chwyt wybiera gra —
            # bramka sprawdza wtedy OBA klipy.
            "chwyt_dowolny": g.get("grip") == "either",
            "gatunek": g.get("material", "steel"),
            # typy obrażeń wariantów (`weapon_roster.mjs`) — `pierce` u
            # drzewcowej gra PCHNIĘCIE (`char3d_thrust`), reszta zamach
            "ataki": tuple(g.get("attacks", ())),
            "chwyt": m.get("chwyt", 0.0) * CM_NA_LOKALNE,
            "obrot": (KAT_2H, 0, 0) if rece == 2 else m.get("obrot", (0, 0, 0)),
            "dlugosc": (hi - lo) * CM_NA_LOKALNE,
        }
    return out


BRONIE = _zbuduj_interfejs()


def _lin(c):
    v = c / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def _mat(nazwa, gatunek):
    klucz = f"Z_bron_{nazwa}_{gatunek}"
    m = bpy.data.materials.get(klucz) or bpy.data.materials.new(klucz)
    r, g, b = weapon_shapes.kolor(nazwa, gatunek)
    # ⚠ Kolor musi trafić też do węzła Principled — eksporter glTF ignoruje
    # `diffuse_color` i bez tego broń wyjeżdża biała (patrz `char3d_zones`).
    _ustaw_kolor(m, (_lin(r), _lin(g), _lin(b), 1.0))
    return m


def zbuduj_bron(bron_id, arm=None):
    """Tworzy element broni wpięty w kość dłoni i zwraca obiekt."""
    cfg = BRONIE[bron_id]
    arm = arm or bpy.data.objects["Armature"]
    if abs(arm.scale.x - SKALA_ARMATURY) > 1e-3:
        raise RuntimeError(f"skala Armature {arm.scale.x:.4f} ≠ {SKALA_ARMATURY} — "
                           "przeliczenie cm → jednostki lokalne broni byłoby błędne")
    nazwa = f"{PRZEDROSTEK}{bron_id}"
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)

    wierzch_cm, sciany, mats, _L = weapon_shapes.geometria(bron_id)
    k = CM_NA_LOKALNE
    przesun = cfg["chwyt"]
    # ⭐ LICO DO BOKU: obrót wokół osi broni, (x, z) → (z, −x) — ostrze
    # (`+x` z `weapon_shapes`) na lokalnym −Z, czyli `OSTRZE_LOKALNE`
    # (drzewcowe: (x, z) → (−z, x), ostrze na +Z — `OSTRZE_DRZEWCOWEJ`).
    # Zmierzone 2026-10-03 na kości dłoni w bezruchu: lokalne X kości patrzy
    # w BOK (−0,86; −0,49; 0,15), lokalne Z — do PRZODU (0,46; −0,87; −0,19).
    # Bez skrętu `+x = ostrze` celowało w bok, a lico płyty do widza z przodu:
    # w PROFILU topór, halabarda i berdysz stały krawędzią i czytały się jak
    # włócznie. ⚠ Do 2026-10-12 ostrze siedziało na +Z (−90° zamiast +90°)
    # i cały roster uderzał GRZBIETEM — patrz „Ostrze prowadzi cios" w nagłówku.
    znak = ostrze_lokalne(bron_id)[2]
    wierzch = [(-znak * z * k, y * k - przesun, znak * x * k) for x, y, z in wierzch_cm]

    uzyte = []
    for m in mats:
        if m not in uzyte:
            uzyte.append(m)

    me = bpy.data.meshes.new(nazwa)
    me.from_pydata(wierzch, [], sciany)
    me.validate()
    me.update()
    for m in uzyte:
        me.materials.append(_mat(m, cfg["gatunek"]))
    for poly, m in zip(me.polygons, mats):
        poly.material_index = uzyte.index(m)

    ob = bpy.data.objects.new(nazwa, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = KOSC_DLONI
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = (0.0, 0.0, 0.0)
    ob.rotation_euler = tuple(math.radians(v) for v in cfg["obrot"])

    print(f"[bron] {nazwa}: rodzina={cfg['rodzina']} rece={cfg['rece']} "
          f"dlugosc={cfg['dlugosc']:.2f} chwyt={cfg['chwyt']:.2f} "
          f"obrot={cfg['obrot']} materialy={uzyte} gatunek={cfg['gatunek']}")
    return ob


def zbuduj_wszystkie(arm=None):
    return {b: zbuduj_bron(b, arm) for b in BRONIE}


def sprawdz_komplet_rosteru():
    """Czy KAŻDA broń z gry ma kształt i mocowanie. Zwraca listę błędów.

    ⚠ **Brak wpisu nie objawia się błędem, tylko pustą ręką.** `ustawSlot`
    nie znajduje węzła i nic nie rysuje — postać po prostu trzyma powietrze.
    Tak przepadł `stick`, czyli PIERWSZA broń, jaką dostaje gracz.
    """
    z_gry = weapon_shapes.bronie_z_gry()
    bledy = list(weapon_shapes.samokontrola(z_gry))
    for bid in z_gry:
        if bid not in MOCOWANIE:
            bledy.append(f"{bid}: brak MOCOWANIA (chwyt) — broń trzymana za koniec")
    for bid in MOCOWANIE:
        if bid not in weapon_shapes.BRONIE:
            bledy.append(f"{bid}: mocowanie bez kształtu")
    for bid, cfg in BRONIE.items():
        if cfg["rece"] == 2 and cfg["chwyt"] < ODLEGLOSC_CHWYTU_2H + 0.1:
            bledy.append(f"{bid}: prawa dłoń {cfg['chwyt']:.2f} j. od końca — lewa "
                         f"({ODLEGLOSC_CHWYTU_2H} j. niżej) chwyciłaby powietrze")
        if cfg["rece"] == 2 and "obrot" in MOCOWANIE.get(bid, {}):
            bledy.append(f"{bid}: dwuręczna z własnym `obrot` — wpis jest ignorowany (KAT_2H)")
    print(f"[roster] broni w GameConfig: {len(z_gry)}, kształtów: "
          f"{len(weapon_shapes.BRONIE)}, mocowań: {len(MOCOWANIE)}")
    for b in bledy:
        print("  BLAD:", b)
    return bledy

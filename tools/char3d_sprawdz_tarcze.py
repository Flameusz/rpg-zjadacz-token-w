"""Bramka tarcz: komplet rosteru, zejscie w grunt i PRZENIKANIE PRZEZ CIALO.

    blender -b public/assets/char.blend --python tools/char3d_sprawdz_tarcze.py

Kończy się kodem 1, gdy coś jest nie tak — nadaje się do wpięcia w cokolwiek,
co ma zatrzymać złą przebudowę modelu.

⚠ **Ten skrypt widziano na czerwono.** Sprawdzone dwoma celowymi zepsuciami,
oba kończyły się kodem 1:
  • `chwyt` puklerza przestawiony na `(0, 2.20, 0.30)` → BLAD, zejście **+1,11 j.**
    pod linię stóp w `Walk` i `Walk_Armed`;
  • wykreślenie `buckler` z `TARCZE` → BLAD rosteru („jest w grze, nie ma modelu").
⚠ Zapas jest realny, ale nie ogromny: przy dzisiejszych ustawieniach puklerz ma
**2,56 j. nad stopami**, tarcza okuta **1,31 j.** Przesunięcie chwytu o 1,5 j.
w dół ramienia jeszcze mieści się w tolerancji — to NIE jest bramka na „tarcza
wygląda dobrze", tylko na „tarcza nie orze ziemi".
Asercja, której nie widziano na czerwono, jest dekoracją (`tools/CLAUDE.md`).

Dwie rzeczy, które sprawdza, i dlaczego akurat te:

1. **Komplet rosteru.** Brak modelu nie objawia się błędem, tylko PUSTĄ RĘKĄ —
   ta sama pułapka, przez którą przepadł `stick` po stronie broni.
2. **Zejście pod linię stóp W MARSZU.** Bezruch wychodzi czysty nawet wtedy,
   gdy marsz jest zepsuty: `Walk_Armed` zatrzymuje wyłącznie rękę z BRONIĄ,
   więc ręka z tarczą macha dalej. Dokładnie tak miecz zamiatał grunt przy
   każdym kroku, a w postawie spoczynkowej wyglądał poprawnie.
"""
import bpy
import math
import sys
import os
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_attack    # noqa: E402
import char3d_chod      # noqa: E402
import char3d_clearance # noqa: E402
import char3d_shields   # noqa: E402
import shield_shapes    # noqa: E402
import char3d_walk      # noqa: E402
import char3d_weapons   # noqa: E402
import char3d_zones     # noqa: E402

# Ile tarcza może zejść pod linię stóp, zanim uznamy to za zamiatanie gruntu.
# Postać ma 12,96 j. wysokości, więc to jest ok. 2% jej wzrostu — mniej niż
# grubość podeszwy i mniej, niż widać przy 60 px na ekranie.
TOLERANCJA = 0.25

# ⚠⚠ **TEST PRZENIKANIA NIE JEST TESTEM USTAWIENIA TARCZY** (korekta A6.2,
# 2026-09-20). Pierwsza wersja karala NAJGLEBSZY POJEDYNCZY WIERZCHOLEK i to
# pchalo w zla strone: zeby ja zaspokoic, trzeba bylo odsuwac tarcze od ciala,
# az przestawala wygladac na niesiona przy boku i zaczynala wisiec OBOK
# czlowieka. **Tarcza niesiona przy boku MA nachodzic na obrys** — decyzja
# autora, poparta referencjami (hoplita, wojownik z duza tarcza).
#
# Dzis bramka pyta o UDZIAL: jaka czesc tarczy siedzi w ciele. Kilka
# wierzcholkow schowanych za biodrem to niesienie; jedna trzecia tarczy
# w srodku tulowia to usterka.
#
# Progi wziete z pomiaru, nie z sufitu:
#     stan przed A6.2   CARRY 29% / GUARD 18%   -> ma BLYSNAC
#     okuta  chwyt −0,85 CARRY  9% / GUARD  8%  -> ma PRZEJSC
#     puklerz chwyt −0,70 CARRY  2% / GUARD  2% -> ma PRZEJSC
# ⚠⚠ **Liczymy wierzcholki ZANURZONE, nie stykajace sie.** Sam udzial tez nie
# wystarczyl: poprawnie niesiony puklerz ma 28% wierzcholkow „w ciele", bo cala
# jego wewnetrzna krawedz sunie po udzie — a zle ustawiona tarcza okuta miala
# 29%. Rozroznia je dopiero GLEBOKOSC: muskanie skory to <0,25 j., zanurzenie
# to wiecej.
#     stan zly  (tarcza wbita w biodro)  okuta 13% glebiej niz 0,25 -> BLAD
#     stan dobry (tarcza niesiona reka)  okuta  4%, puklerz 7%      -> OK
PROG_ZANURZENIA = 0.25       # ponizej tego = kontakt ze skora, nie przenikanie
UDZIAL_W_CIELE = 10.0        # procent wierzcholkow ZANURZONYCH glebiej

# ⚠ Drugi prog istnieje TYLKO na przypadek absurdalny (tarcza wbita w srodek
# tulowia kilkoma wierzcholkami, ale glęboko). Jest CELOWO luzny — ma nie
# wchodzic w droge normalnemu nachodzeniu na biodro (zmierzone 0,42 j. przy
# poprawnym niesieniu duzej tarczy).
GLEBOKOSC_ABSURDALNA = 0.90

# ⚠⚠ Skosny, zeby promien nie trafial w krawedzie i wierzcholki siatki —
# trafienie w krawedz liczy sie raz albo dwa i psuje parzystosc.
KIER_PROMIENIA = Vector((0.317, 0.803, 0.505)).normalized()
# ⚠⚠ GŁOSOWANIE TRZECH PROMIENI (2026-10-10, BAZA V4.5). Jeden promień
# wystarczał, dopóki dłoń była jedną powłoką. Kciuk (V4) to OSOBNA, zachodząca
# powłoka — promień przechodzący przez jej szew liczy przecięcia nieparzyście
# i punkt 0,92 j. OD dłoni czytał się jako 0,92 j. W ciele (puklerz, wszystkie
# klatki chodu bojowego). Siedem kierunków zgodnie mówiło „na zewnątrz".
# Punkt jest wewnątrz, gdy tak mówi WIĘKSZOŚĆ promieni.
KIERUNKI_PROMIENI = (KIER_PROMIENIA,
                     Vector((-0.611, 0.274, -0.743)).normalized(),
                     Vector((0.528, -0.689, 0.497)).normalized())

# Powyzej tylu stopni od pionu dluga os tarczy przestaje czytac sie jak tarcza.
# UWAGA: to jest prog RAPORTU, nie bramki — patrz `_przechyl` i podsumowanie
# na koncu. Dla kola metryka nie znaczy nic i takie tarcze sa z niej wylaczone.
PRZECHYL_UWAGA = 45.0
uwagi_przechyl = {}

scn = bpy.context.scene
arm = bpy.data.objects["Armature"]
char3d_attack.zdejmij_obrot_turntable(arm)

blad = []

# --- 1. Komplet rosteru ---
brak = char3d_shields.sprawdz_komplet_rosteru()
for t in brak:
    blad.append(f"tarcza '{t}' jest w grze, ale nie ma modelu w char3d_shields.TARCZE")

# --- 1b. Zgodnosc tabeli profili z silnikiem ---
for r in char3d_shields.sprawdz_profile_w_silniku():
    blad.append(f"profil niesienia rozjechany miedzy Blenderem a silnikiem — {r}")

# --- 2. Geometria w marszu ---
# ⚠⚠ **GASIMY Solidify** (`apply_zones`) i to nie jest kosmetyka: kontur postaci
# to ODWROCONY hull, wiec przy wlaczonym Solidify test „czy punkt jest w ciele"
# czyta kazdy punkt jako wewnetrzny. Zlapane samokontrola metryki nizej.
char3d_zones.apply_zones()
char3d_weapons.zbuduj_wszystkie(arm)
# ⚠⚠ **KLIPY, KTORE GRA NAPRAWDE GRA Z TARCZA** (A6.2, 2026-09-20). Do tej pory
# bramka mierzyla `Walk` i `Walk_Armed` — w OBU lewa reka macha pelnym cyklem,
# bo pozy niesienia tarczy tam po prostu nie ma. Mierzyla wiec poze, ktorej
# gracz z tarcza nigdy nie oglada. Ta sama klasa bledu, co kolumna „bezruch"
# w bramce broni (A6.1).
char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False)
char3d_chod.zbuduj_chod_uzbrojony(arm, bron=False, tarcza=True, walka=False)
char3d_chod.zbuduj_chod_uzbrojony(arm, bron=True, tarcza=True, walka=False)
char3d_chod.zbuduj_chod_uzbrojony(arm, bron=False, tarcza=True, walka=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, bron=True, tarcza=True, walka=True)
# PROFIL LARGE — osobne klipy CARRY dla tarcz, ktore inaczej oralyby grunt.
char3d_chod.zbuduj_chod_uzbrojony(arm, bron=False, tarcza=True, walka=False, duza=True)
char3d_chod.zbuduj_chod_uzbrojony(arm, bron=True, tarcza=True, walka=False, duza=True)
# ⭐ BIEG (2026-10-03): te same pozy tarczy na cyklu biegu (miednica niżej).
import char3d_run  # noqa: E402
char3d_run.zbuduj_bieg(arm, report=False)
for _k in (dict(bron=False, tarcza=True, walka=False), dict(bron=True, tarcza=True, walka=False),
           dict(bron=False, tarcza=True, walka=True), dict(bron=True, tarcza=True, walka=True),
           dict(bron=False, tarcza=True, walka=False, duza=True),
           dict(bron=True, tarcza=True, walka=False, duza=True)):
    char3d_chod.zbuduj_chod_uzbrojony(arm, zrodlo="Run", **_k)
tarcze = char3d_shields.zbuduj_wszystkie(arm)
CIALO = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]
TORS = bpy.data.objects["Cube.001"]


def _drzewo():
    dg = bpy.context.evaluated_depsgraph_get()
    return BVHTree.FromObject(TORS, dg), TORS.matrix_world.inverted()


def _wewnatrz(bvh, mwi, punkt):
    """Parzystosc przeciec promienia — NIE znak normalnej.

    ⚠ Wersja po normalnych nie przeszla samokontroli: siatka jest polowkowa
    + Mirror, wiec punkt na plaszczyznie lustra ma niejednoznaczna normalna
    i srodek tulowia czytal sie jako „na zewnatrz".
    """
    glosy = 0
    for kier in KIERUNKI_PROMIENI:
        org = mwi @ punkt
        n = 0
        for _ in range(24):
            loc, _nor, _i, _d = bvh.ray_cast(org, kier)
            if loc is None:
                break
            n += 1
            org = loc + kier * 1e-4
        glosy += n % 2
    return glosy * 2 > len(KIERUNKI_PROMIENI)


def _relacja_z_reka(ob, arm):
    """⭐ GLOWNE kryterium CARRY: czy tarcza jest NIESIONA PRZEZ REKE.

    ⚠⚠ **Zadna metryka przenikania tego nie widzi** i to jest cala przyczyna
    istnienia tej asercji. Wersja tarczy odsunieta „na zewnatrz i do tylu"
    miala przenikanie 2% (najlepsze ze wszystkich) i wygladala jak PLECAK:
    srodek tarczy lezal 0,8-0,9 j. ZA piescia, wiec reka wychodzila przed
    tarcza. Zglosil to autor patrzac na render; bramka byla wtedy zielona.

    Zwraca (dX, dY, normalna lica) w SWIECIE, wzgledem pięści.
    """
    dg = bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    piesc = ev.matrix_world @ ev.pose.bones[char3d_shields.KOSC_DLONI].head
    # UWAGA UWAGA: **NORMALNA Z OSI OBIEKTU, NIE Z NAJWIEKSZEJ SCIANY**
    # (2026-09-21). Heurystyka „normalna najwiekszego wielokata" byla poprawna
    # dokladnie tak dlugo, jak lico bylo JEDNYM plaskim n-katem. Po wysklepieniu
    # lico jest kopula z pierscieni, wiec najwieksza sciana to jeden z pasow —
    # a jego normalna jest przechylona o krzywizne. Zmierzony skutek: legionowa
    # raportowala `lico_przod = 0,78` przy progu 0,80 i swiecila na czerwono,
    # mimo ze tarcza patrzyla prosto przed siebie.
    # Lokalne Z JEST normalna lica z konstrukcji (`char3d_shields._bryla_tarczy`
    # buduje w X-Y, grubosc po Z) — dokladne i niezalezne od topologii.
    # STOP: nie wracaj do najwiekszej sciany.
    nrm = (ob.matrix_world.to_3x3() @ Vector((0.0, 0.0, 1.0))).normalized()
    oe = ob.evaluated_get(dg)
    me = oe.to_mesh()
    pts = [ob.matrix_world @ v.co for v in me.vertices]
    oe.to_mesh_clear()
    # UWAGA UWAGA: **PUNKT ODNIESIENIA, NIE SRODEK TARCZY** (2026-09-21).
    # Dwie osobne pomylki, obie zlapane tego samego dnia:
    #
    # (1) Srednia wierzcholkow jest poprawna TYLKO dla wielokata foremnego.
    #     Po przejsciu na szesc konturow o roznej gestosci wierzcholkow
    #     bramka raportowala dla rycerskiej `dY = -0,88` przy `-0,10` dla
    #     tarcz kolowych — czyli mierzyla GESTOSC SIATKI. Stad bbox.
    # (2) Srodek tarczy przestal byc punktem chwytu: tarcza na pasach
    #     (`uchwyt > 0`) zwisa CELOWO ponizej dloni. Gdy poza unosi reke,
    #     ten offset WZDLUZ PRZEDRAMIENIA zamienia sie czesciowo na
    #     przesuniecie w przod i kryterium CARRY swieci na czerwono przy
    #     geometrii ustawionej dokladnie tak, jak chcielismy.
    # Patrz `char3d_shields.punkt_odniesienia`.
    srodek = char3d_shields.punkt_odniesienia(ob)
    d = srodek - piesc
    return d, nrm


# ⚠⚠ **CARRY I GUARD MAJA PRZECIWNE REGULY I TO JEST CALA TRESC A6.3.**
# Pierwsza wersja tej bramki miala jeden zestaw regul (ten od CARRY) i po
# podniesieniu tarczy do pozy bojowej **zaswiecila na czerwono na POPRAWNEJ
# geometrii**: „lico patrzy na widza… to jest plaszczyzna GARDY". No wlasnie —
# w pozie GUARD ma byc gardą. To ta sama klasa bledu, co kolumna „bezruch"
# w bramce broni (A6.1) i klipy CARRY w bramce tarcz (A6.2): asercja mierzyla
# co innego, niz poza ma robic.
#
# CARRY: tarcza przy boku, na glebokosci piesci, licem NA ZEWNATRZ.
MAX_ZA_REKA = 0.35           # |dY| — wiecej znaczy „plecak" albo „przed soba"
MIN_NA_ZEWNATRZ = 0.10       # dX — tarcza po zewnetrznej stronie piesci
MIN_LICO_NA_ZEWNATRZ = 0.60  # |normalna.X| — ponizej tego lico patrzy jak garda
# GUARD: tarcza wystawiona PRZED reke, licem DO ZAGROZENIA (−Y w swiecie).
MIN_PRZED_REKA = 0.30        # −dY — tarcza ma byc przed piescia, nie przy niej
MIN_LICO_W_PRZOD = 0.80      # |normalna.Y| — lico kryje front, nie bok
MIN_WYS_NAD_BIODREM = 1.50   # tarcza ma kryc TULOW, nie brzuch


def _przechyl(ob):
    """Odchylenie DLUGIEJ OSI tarczy od pionu, w stopniach.

    UWAGA UWAGA: **TEJ LICZBY TU NIE BYLO I DLATEGO GUARD WYGLADAL NA
    ZIELONY.** Dopoki modele byly dwa i oba OKRAGLE, "dluga os" nie znaczyla
    nic — kolo wyglada tak samo pod kazdym katem. Przy szesciu konstrukcjach
    zaczela znaczyc wszystko: w pozie GUARD przedramie lezy poziomo w poprzek
    klatki, a tarcza jest do niego sztywno przypieta, wiec migdalowa,
    legionowa i pawez staja POZIOMO. Bramka tego nie widziala, bo sprawdzala
    wylacznie kierunek LICA (`lico_przod = 1,00`) i wysokosc.

    STOP: nie prubuj tego naprawic `obrot`em tarczy. `obrot` jest wspolny dla
    CARRY i GUARD, a przedramie obraca sie miedzy tymi pozami o ~90 stopni —
    wiec kazde ustawienie dobre dla jednej pozy psuje druga. To jest zmiana
    MOCOWANIA albo POZY GUARD, czyli decyzja, nie poprawka.
    """
    ey = (ob.matrix_world.to_3x3() @ Vector((0.0, 1.0, 0.0))).normalized()
    return math.degrees(math.acos(min(1.0, abs(ey.z))))


def _przenikanie(ob, bvh, mwi):
    """Ile tarczy jest ZANURZONE w ciele (0 = brak). Kontakt nie liczy sie."""
    dg = bpy.context.evaluated_depsgraph_get()
    oe = ob.evaluated_get(dg)
    me = oe.to_mesh()
    pts = [ob.matrix_world @ v.co for v in me.vertices]
    oe.to_mesh_clear()
    naj = 0.0
    ile = 0
    for p in pts:
        if _wewnatrz(bvh, mwi, p):
            _l, _n, _i, d = bvh.find_nearest(mwi @ p)
            if d is not None:
                naj = max(naj, d)
                if d > PROG_ZANURZENIA:
                    ile += 1
    return naj, ile, len(pts)


def bryla(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            p = ev.matrix_world @ v.co
            for i in range(3):
                mn[i] = min(mn[i], p[i])
                mx[i] = max(mx[i], p[i])
        ev.to_mesh_clear()
    return mn, mx


print("\n--- tarcze w marszu ---")
# ⚠ Obie pozy: CARRY i GUARD. `chwyt` jest WSPOLNY dla nich, wiec poprawka
# jednej rusza druga — zmierzone w A6.2, gdzie odsuniecie tarczy poprawilo
# CARRY i POGORSZYLO GUARD (0,16 -> 0,46 j.).
# UWAGA UWAGA: **KAZDA TARCZA JEST SPRAWDZANA W SWOIM KLIPIE CARRY, nie we
# wszystkich.** Po wprowadzeniu profili (2026-09-21) `Walk_Shielded` dotyczy
# wylacznie tarcz SMALL, a `Walk_Shielded_Large` wylacznie LARGE. Sprawdzanie
# duzej tarczy w klipie SMALL zglaszalo BLAD na konfiguracji, ktorej gra nigdy
# nie pokazuje — czyli asercja mierzylaby stan nieistniejacy.
# GUARD zostaje WSPOLNY, wiec tam ida wszystkie szesc.
PROFIL = {t: shield_shapes.KONSTRUKCJE[t]["profil"] for t in tarcze}
AKCJE = [
    ("Walk_Shielded", "SMALL"), ("Walk_Armed_Shielded", "SMALL"),
    ("Walk_Shielded_Large", "LARGE"), ("Walk_Armed_Shielded_Large", "LARGE"),
    ("Walk_Shielded_Combat", None), ("Walk_Armed_Shielded_Combat", None),
]
AKCJE += [(a.replace("Walk", "Run", 1), p) for a, p in AKCJE]
# Grunt z pozy STOJĄCEJ — w biegu, w fazie lotu, najniższy punkt ciała jest
# uniesioną stopą, a nie gruntem (ta sama pułapka co w bramce broni).
arm.animation_data.action = bpy.data.actions["Walk_Shielded"]
scn.frame_set(char3d_chod.char3d_walk.BEZRUCH)
bpy.context.view_layer.update()
GRUNT_Z = bryla(CIALO)[0].z


def _samokontrola_wnetrza():
    """⭐ Metryka „czy punkt jest w ciele" na przypadkach o ZNANEJ odpowiedzi.

    Środek miednicy, brzucha i klatki MUSI być wewnątrz, punkty 4 j. obok
    ciała MUSZĄ być na zewnątrz. Bez tego bramka zielona może znaczyć „metryka
    ślepa" (Solidify: wszystko wewnątrz) albo czerwona „metryka zepsuta"
    (kciuk jako osobna powłoka: punkt obok dłoni wewnątrz). Pierwszy i ostatni
    przypadek są identyczne — sprawdzają determinizm.
    """
    bvh, mwi = _drzewo()
    ev = arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
    srodki = [ev.matrix_world @ ev.pose.bones[k].head for k in ("Bone", "Bone.001", "Bone.002")]
    przypadki = [(srodki[0], True)] + [(c, True) for c in srodki[1:]]
    przypadki += [(c + Vector((dx, 0.0, 0.0)), False) for c in srodki for dx in (4.0, -4.0)]
    przypadki += [(srodki[1] + Vector((0.0, -4.0, 0.0)), False), (srodki[0], True)]
    return [f"samokontrola metryki wnetrza: punkt {tuple(round(x, 2) for x in pkt)} "
            f"powinien byc {'WEWNATRZ' if ma else 'NA ZEWNATRZ'}"
            for pkt, ma in przypadki if _wewnatrz(bvh, mwi, pkt) != ma]


blad += _samokontrola_wnetrza()
for akcja, tylko_profil in AKCJE:
    arm.animation_data.action = bpy.data.actions[akcja]
    komplet = {t: ob for t, ob in tarcze.items()
               if tylko_profil is None or PROFIL[t] == tylko_profil}
    for f in char3d_chod.KLATKI:
        scn.frame_set(f)
        bpy.context.view_layer.update()
        cmn, _cmx = bryla(CIALO)
        bvh, mwi = _drzewo()
        for tid, ob in komplet.items():
            tmn, tmx = bryla([ob])
            ref = GRUNT_Z if akcja.startswith("Run") else cmn.z
            pod = ref - tmn.z            # dodatnie = tarcza NIŻEJ niż stopy
            glab, ile, wszystkie = _przenikanie(ob, bvh, mwi)
            udzial = 100.0 * ile / max(wszystkie, 1)
            d, nrm = _relacja_z_reka(ob, arm)
            przechyl = _przechyl(ob)
            walka = akcja.endswith("_Combat")
            if walka and przechyl > PRZECHYL_UWAGA:
                uwagi_przechyl.setdefault(tid, przechyl)
                uwagi_przechyl[tid] = max(uwagi_przechyl[tid], przechyl)
            # ⭐ PRZESWIT PRZEDRAMIENIA — patrz `char3d_clearance`. To jest
            # asercja, ktorej brakowalo: relacja i przenikanie ciala moga byc
            # poprawne, a przedramie i tak lezec W PLASZCZYZNIE tarczy.
            pk = char3d_clearance.przeswit_przedramienia(arm, ob, TORS)
            if walka:
                zla_relacja = (-d.y < MIN_PRZED_REKA
                               or abs(nrm.y) < MIN_LICO_W_PRZOD
                               or pk["przeswit"] < char3d_clearance.MIN_PRZESWIT)
            else:
                zla_relacja = (abs(d.y) > MAX_ZA_REKA or d.x < MIN_NA_ZEWNATRZ
                               or abs(nrm.x) < MIN_LICO_NA_ZEWNATRZ
                               or pk["przeswit"] < char3d_clearance.MIN_PRZESWIT)
            zle = (pod > TOLERANCJA or udzial > UDZIAL_W_CIELE
                   or glab > GLEBOKOSC_ABSURDALNA or zla_relacja)
            stan = "BLAD" if zle else "OK  "
            print(f"  [{stan}] {akcja:19s} kl.{f} {tid:17s} "
                  f"zejscie={pod:+.2f}  zanurzone={ile:2d}/{wszystkie:2d} "
                  f"({udzial:4.0f}%) glab={glab:.2f}  "
                  f"reka->tarcza dX={d.x:+.2f} dY={d.y:+.2f} lico={abs(nrm.x):.2f} "
                  f"przechyl={przechyl:3.0f} "
                  f"przeswit={pk['przeswit']:+.2f} lico_przod={abs(nrm.y):.2f} "
                  f"[{'GUARD' if walka else 'CARRY'}]")
            if pk["przeswit"] < char3d_clearance.MIN_PRZESWIT:
                blad.append(
                    f"{tid}: PRZEDRAMIE W TARCZY w '{akcja}' kl.{f} — "
                    f"{pk['w_srodku']}/{pk['punktow']} wierzcholkow reki wewnatrz "
                    f"tarczy, najglebiej {-pk['przeswit']:.2f} j. Popraw `chwyt`, "
                    f"nie humanoida.")
            if walka and -d.y < MIN_PRZED_REKA:
                blad.append(
                    f"{tid}: GUARD — tarcza nie jest wystawiona przed reke w "
                    f"'{akcja}' kl.{f} (dY={d.y:+.2f}, potrzeba < −{MIN_PRZED_REKA})")
            if walka and abs(nrm.y) < MIN_LICO_W_PRZOD:
                blad.append(
                    f"{tid}: GUARD — lico tarczy NIE kryje frontu w '{akcja}' "
                    f"kl.{f} (|normalna.Y|={abs(nrm.y):.2f}, minimum {MIN_LICO_W_PRZOD}) "
                    f"— to jest poza niesienia, nie obrony")
            if not walka and abs(d.y) > MAX_ZA_REKA:
                blad.append(
                    f"{tid}: srodek tarczy lezy {d.y:+.2f} j. wzgledem piesci "
                    f"w '{akcja}' kl.{f} (limit {MAX_ZA_REKA}) — tarcza wyglada jak "
                    f"{'przypieta ZA REKA (plecak)' if d.y > 0 else 'wystawiona PRZED reke'}, "
                    f"a ma byc NIESIONA PRZEZ REKE")
            if not walka and d.x < MIN_NA_ZEWNATRZ:
                blad.append(
                    f"{tid}: tarcza nie jest po ZEWNETRZNEJ stronie piesci w "
                    f"'{akcja}' kl.{f} (dX={d.x:+.2f}, minimum {MIN_NA_ZEWNATRZ})")
            if not walka and abs(nrm.x) < MIN_LICO_NA_ZEWNATRZ:
                blad.append(
                    f"{tid}: lico tarczy patrzy na widza, nie wzdluz boku, w "
                    f"'{akcja}' kl.{f} (|normalna.X|={abs(nrm.x):.2f}, minimum "
                    f"{MIN_LICO_NA_ZEWNATRZ}) — to jest plaszczyzna GARDY, nie CARRY")
            if udzial > UDZIAL_W_CIELE:
                blad.append(
                    f"{tid}: {udzial:.0f}% tarczy ZANURZONE w ciele w '{akcja}' kl.{f} "
                    f"(limit {UDZIAL_W_CIELE:.0f}%) — popraw 'chwyt'/'obrot' "
                    f"w char3d_shields, nie humanoida")
            if glab > GLEBOKOSC_ABSURDALNA:
                blad.append(
                    f"{tid} wchodzi {glab:.2f} j. w cialo w '{akcja}' kl.{f} "
                    f"(absurd powyzej {GLEBOKOSC_ABSURDALNA}) — popraw 'chwyt'/'obrot'")
            if pod > TOLERANCJA:
                blad.append(
                    f"{tid} schodzi {pod:.2f} j. pod linie stop w '{akcja}' kl.{f} "
                    f"(tolerancja {TOLERANCJA}) — popraw 'chwyt'/'promien' w char3d_shields "
                    f"albo daj lewej rece poze niesienia w char3d_chod")

# UWAGA: kola wylaczamy — dla nich "dluga os" nie ma sensu wizualnego.
KOLOWE = {"buckler", "round"}
uwagi_przechyl = {t: v for t, v in uwagi_przechyl.items() if t not in KOLOWE}
if uwagi_przechyl:
    print("\n--- OTWARTE: przechyl w GUARD (raport, nie bramka) ---")
    for t, v in sorted(uwagi_przechyl.items(), key=lambda kv: -kv[1]):
        print(f"  {t:10s} dluga os {v:3.0f} st. od pionu — tarcza lezy POZIOMO")
    print("  Przyczyna: tarcza jest sztywno przypieta wzdluz przedramienia,")
    print("  a w GUARD przedramie lezy poziomo w poprzek klatki. Nie do")
    print("  naprawienia `obrot`em (wspolny z CARRY) — patrz `_przechyl`.")

print("\n--- wynik ---")
if blad:
    for b in blad:
        print("  BLAD:", b)
    sys.exit(1)
print(f"  OK: {len(tarcze)} tarcz — zadna nie zamiata gruntu (tol. {TOLERANCJA} j.) "
      f"ani nie zanurza w ciele wiecej niz {UDZIAL_W_CIELE:.0f}% wierzcholkow, "
      f"a KAZDA jest niesiona przez reke (CARRY i GUARD)")

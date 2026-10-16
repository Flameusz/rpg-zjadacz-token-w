"""Buduje akcję "Attack" na rigu z char.blend — cięcie jednoręczne z prawej.

Moduł BLENDEROWY, importowany przez skrypty podglądu i eksportu. Sam nic nie
renderuje i ⚠ **NIE ZAPISUJE char.blend** — akcja powstaje w pamięci sesji.

── Dlaczego pozy są w PRZESTRZENI ŚWIATA ─────────────────────────────────────
⚠ **Osie lokalne kontrolek IK nie pokrywają się z niczym intuicyjnym i próba
zgadnięcia ich kosztowała jeden bezużyteczny podgląd.** Zmierzone (probe na
`Bone.002_R.003`, poza bazowa = klatka 1 chodu):

    local X +1  ->  world (  0.00, -0.86, +1.41)   czyli GÓRA i lekko w przód
    local Y +1  ->  world ( -1.44, +0.01, +0.38)   czyli NA ZEWNĄTRZ (dla prawej)
    local Z +1  ->  world ( +0.08, -1.10, +0.10)   czyli W PRZÓD

Czyli „ręka do góry" to lokalne X, a nie Y. Dlatego pozy niżej są opisane
w świecie (postać patrzy w -Y, góra to +Z), a wartości lokalne liczy z nich
`_local_z_swiata`. Liczby w tabeli da się przez to czytać i poprawiać.

⚠ **Ta baza jest LINIOWYM PRZYBLIŻENIEM wokół pozy bazowej.** IK jest
nieliniowe i ma skończony zasięg, więc poza wyznaczona za daleko po prostu się
nie ziści. Dlatego `zbuduj_atak` **sprawdza każdą pozę po fakcie** i krzyczy,
gdy dłoń wylądowała gdzie indziej niż zamówiono — bez tego błędny zasięg
wyglądałby jak „animacja jakoś tak dziwnie wygląda".

⚠ **Pozą bazową jest klatka 1 chodu, nie spoczynek rigu.** Rig w spoczynku ma
ręce rozłożone na boki (ogon kości ramienia idzie wzdłuż X), więc atak
budowany od zera zaczynałby się od pozy krzyża.
"""
import bpy
import math

from mathutils import Euler, Matrix, Vector

NAZWA = "Attack"
NAZWA_2H = "Attack_2H"
DLON_R = "Bone.002_R.003"
DLON_L = "Bone.002_L.003"

# --- zmierzone, nie dobrane (patrz nagłówek) ---
BAZA_LOCAL = Vector((-1.808, -1.993, 1.125))     # klatka 1 chodu, obie ręce (X lustrzane)
BAZA_WORLD_R = Vector((-1.791, 0.453, -6.739))
# kolumny = wpływ lokalnych X/Y/Z na świat
BAZA_OSI_R = Matrix((
    (0.000, -1.440, 0.080),
    (-0.859, 0.007, -1.095),
    (1.412, 0.376, 0.096),
))

# Punkty odniesienia w świecie, też zmierzone: bark prawy (0, 0.53, -2.35),
# biodra (0, 0.38, -6.56), głowa (0, 0.36, -1.65). Zasięg ramienia ok. 4,4.
BARK_Z = -2.35
BIODRO_Z = -6.56

# Fazy ciosu w ŚWIECIE: (klatka, dłoń prawa, dłoń lewa, skręt tułowia °, pochylenie °).
#
# Zamach trwa dwie klatki, samo cięcie jedną — ta sama zasada, co w walce
# w kodzie: cios, którego zamachu nie widać, nie daje się przeczytać.
#
# ⚠ Zamach i przeniesienie mają wpisane pozycje, które ramię NAPRAWDĘ osiąga,
# a nie te, o które prosiłem pierwotnie. Pierwsza wersja zamawiała rękę na
# wysokości barku; IK wyprowadziło ją wyżej, nad głowę — i wyszło LEPIEJ, bo
# zamach nad barkiem czyta się mocniej. Deklaracja została więc dociągnięta do
# tego, co widać na renderze. Dzięki temu `_sprawdz` przestaje zgłaszać różnicę,
# którą już raz obejrzano i zaakceptowano, a zaczyna pilnować REGRESJI: gdy
# zmiana rigu przesunie te pozy, raport zaświeci na czerwono.
POZY = [
    (0, (-1.69, -0.58, -6.24), (1.79, 0.45, -6.74), 0.0, 0.0),      # gotowość
    (1, (-2.41, 2.15, -1.67), (1.60, -0.60, -6.40), -26.0, -5.0),   # zamach
    (2, (0.78, -3.17, -5.00), (1.90, 0.20, -6.60), 30.0, 10.0),     # cięcie
    (3, (0.90, -1.52, -5.89), (1.85, 0.40, -6.70), 20.0, 5.0),      # przeniesienie
    (4, (-1.69, -0.58, -6.24), (1.79, 0.45, -6.74), 0.0, 0.0),      # powrót
]
FAZY = ["gotowość", "zamach", "cięcie", "przeniesienie", "powrót"]

# Poza GOTOWOŚCI dla broni oburęcznej — nadpisuje prawą dłoń w klatkach 0 i 4.
#
# ⚠ **Bez tego dwuręczna wchodzi w ziemię i nie da się tego naprawić kątem
# noszenia.** Zmierzone: przy opuszczonej ręce włócznia schodzi 3,0 j. pod
# stopy, topór 1,1, młot 1,1. Podnoszenie kąta pomaga na ziemię, ale ODRYWA
# lewą dłoń od drzewca (odstęp rósł 0,12 → 0,89 j.), bo lewe ramię przestaje
# sięgać. Konflikt znika dopiero, gdy prawa dłoń idzie do góry i do przodu —
# czyli gdy gotowość dwuręczna przestaje być gotowością jednoręczną z doklejoną
# drugą ręką, a staje się gardą.
# ⚠ Cios oburęczny ma WŁASNY TOR, nie tylko własną gotowość. Pierwsza wersja
# używała toru jednoręcznego i lewa dłoń PUSZCZAŁA drzewce w klatce cięcia
# (0,88 j. od osi przy limicie 0,55) — bo prawa wyprowadza cios daleko przez
# ciało, na +0,78, a lewe ramię tam nie sięga. Skracanie chwytu tylko pogarsza
# sprawę (0,88 → 1,23): cel wchodzi wtedy jeszcze głębiej w martwą strefę.
# Rozwiązaniem jest trzymać ręce bliżej osi ciała i oddać obrót TUŁOWIU —
# czyli to, co robi się przy realnym ciosie oburęcznym.
#
# (klatka, prawa dłoń w świecie, skręt tułowia °, pochylenie °)
POZY_2H = [
    (0, (-1.05, -1.95, -4.55), 0.0, 0.0),
    (1, (-1.70, 1.30, -2.70), -32.0, -6.0),
    (2, (-0.10, -3.10, -5.05), 38.0, 11.0),
    (3, (0.35, -2.05, -5.75), 26.0, 6.0),
    (4, (-1.05, -1.95, -4.55), 0.0, 0.0),
]

_ODWR_R = BAZA_OSI_R.inverted()

# ⭐⭐ AUTOKALIBRACJA (2026-10-10, BAZA V4 — proporcje dorosłe). Stałe wyżej są
# zmierzone na rigu V3.7; przy innym szkielecie stała baza osi kłamała co do
# kierunku i `_dopasuj` stawał 1–1,5 j. od celu (bramka ciosu na czerwono).
# Dziś baza (pozycja dłoni przy `BAZA_LOCAL` + jakobian numeryczny) jest
# MIERZONA na bieżącym rigu, raz na rig (klucz: położenie barku w spoczynku).
_KALIB_KLUCZ = None


def _upewnij_kalibracje(arm, nazwa_dloni="Bone.002_R.003"):
    global BAZA_WORLD_R, BAZA_OSI_R, _ODWR_R, _KALIB_KLUCZ
    klucz = tuple(round(c, 4) for c in arm.data.bones["Bone.002_R.001"].head_local) +         tuple(round(c, 4) for c in arm.data.bones["Bone.002_R.003"].head_local)
    if klucz == _KALIB_KLUCZ:
        return
    pb = arm.pose.bones["HandIK_R.005"]
    stara = pb.location.copy()

    def dlon(loc):
        pb.location = loc
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        return ev.matrix_world @ ev.pose.bones[nazwa_dloni].head

    p0 = dlon(BAZA_LOCAL)
    h = 0.15
    kol = []
    for i in range(3):
        e = Vector((0.0, 0.0, 0.0))
        e[i] = h
        kol.append((dlon(BAZA_LOCAL + e) - dlon(BAZA_LOCAL - e)) / (2 * h))
    BAZA_WORLD_R = p0
    BAZA_OSI_R = Matrix((
        (kol[0].x, kol[1].x, kol[2].x),
        (kol[0].y, kol[1].y, kol[2].y),
        (kol[0].z, kol[1].z, kol[2].z),
    ))
    _ODWR_R = BAZA_OSI_R.inverted()
    _KALIB_KLUCZ = klucz
    pb.location = stara
    bpy.context.view_layer.update()

# --- Przeniesienie gestu na rig o INNYCH PROPORCJACH -----------------------
#
# ⚠ Wspolrzedne w `POZY` i `POZY_2H` sa ABSOLUTNE, w przestrzeni swiata, i byly
# mierzone na rigu sprzed przebudowy bazy (2026-09-19). Same w sobie nie opisuja
# wiec gestu, tylko gest NA TAMTYM szkielecie. Gdy baza dostala proporcje
# doroslego czlowieka (bark wyzej o 2,0 j., ramie dluzsze o 8%), te same punkty
# wyladowaly POZA zasiegiem ramienia: cel ciosu oburecznego lezal 5,16 j. od
# barku przy zasiegu 4,68, wiec lewa dlon puszczala drzewce (0,95 j. przy
# limicie 0,55) na WSZYSTKICH trzech broniach dwuraczych naraz.
#
# ⛔ To NIE jest rozszerzanie systemu animacji - to zdjecie z niego zaszytej
# zaleznosci od jednego konkretnego szkieletu. Przy rigu kalibracyjnym
# przelicznik jest TOZSAMOSCIA (skala 1,00, ten sam bark), wiec zadna istniejaca
# poza sie nie rusza; sprawdzone porownaniem raportu przed i po.
KALIB_BARK_R = Vector((-1.42, 0.49, -3.16))     # glowa kosci ramienia, rig kalibracyjny
KALIB_ZASIEG = 4.34                             # bark -> koniec kosci dloni


def _przelicznik(arm):
    """(bark prawy w swiecie, skala zasiegu) dla BIEZACEGO rigu."""
    mw = arm.matrix_world
    bark = mw @ arm.data.bones["Bone.002_R.001"].head_local
    dlon = mw @ arm.data.bones["Bone.002_R.003"].tail_local
    return bark, (dlon - bark).length / KALIB_ZASIEG


def _przenies(punkt, bark, skala, prawa=True):
    """Ten sam gest wzgledem barku, przeskalowany dlugoscia ramienia.

    ⚠⚠ BAZA V4 (2026-10-10): współrzędna BOCZNA (X) liczona od OSI CIAŁA, nie
    od barku. Gesty broni dzieją się PRZED postacią (chwyt oburęczny, pchnięcie,
    cięcie przez środek); przy szerszych barkach przeniesienie względem barku
    wyrzucało chwyt w bok, lewa ręka do niego nie sięgała i pętla chwytu
    odciągała broń (bramka ciosu: błąd ~1 j.). Wysokość i wysunięcie (Y, Z)
    zostają względem barku. Na rigu kalibracyjnym (bark = KALIB, skala 1)
    wynik jest identyczny jak dawniej."""
    kalib = KALIB_BARK_R if prawa else Vector((-KALIB_BARK_R.x, KALIB_BARK_R.y, KALIB_BARK_R.z))
    odniesienie = bark if prawa else Vector((-bark.x, bark.y, bark.z))
    p = Vector(punkt)
    yz = odniesienie + (p - kalib) * skala
    # oś boczna: odległość od osi ciała, skalowana jak ramię, plus o ile szerszy
    # jest bark — tylko dla punktów po stronie barku (ręka przy boku)
    x0 = p.x * skala
    na_zewnatrz = (p.x - kalib.x) * (1 if kalib.x > 0 else -1)
    x = yz.x if na_zewnatrz > 0 else x0
    nowy = Vector((x, yz.y, yz.z))
    # ODLEGŁOŚĆ od barku jak w geście kalibracyjnym (ten sam ułamek zasięgu):
    # przy szerszym barku gest przed środkiem ciała wymagał dłuższego sięgnięcia,
    # niż ma ramię (cięcie, pchnięcie: cel poza zasięgiem).
    d_stare = (p - kalib).length * skala
    kier = nowy - odniesienie
    if kier.length > 1e-6:
        nowy = odniesienie + kier.normalized() * d_stare
    return tuple(nowy)


def zdejmij_obrot_turntable(arm=None):
    """Usuwa z akcji `Walk` wkluczowany obrót CAŁEGO OBIEKTU o −90°.

    ⚠ **Musi to zrobić KAŻDA ścieżka, która czyta `Walk`** — eksport, podgląd
    i przymiar. Autor zrobił w tej akcji „chód oglądany z czterech stron", więc
    obrót siedzi w trzech krzywych `rotation_euler` na poziomie obiektu, poza
    `pose.bones`. Kto go nie zdejmie, dostaje postać obróconą o 90° i podgląd,
    na którym „tył" pokazuje profil — objaw wygląda wtedy jak błąd animacji,
    a jest błędem skryptu, który tę animację ogląda.

    Idempotentne: druga próba nie ma czego usuwać.
    """
    arm = arm or bpy.data.objects["Armature"]
    usuniete = 0
    akcja = arm.animation_data.action if arm.animation_data else None
    for a in {x for x in (akcja, bpy.data.actions.get("Walk")) if x}:
        for layer in a.layers:
            for strip in layer.strips:
                for slot in a.slots:
                    cb = strip.channelbag(slot)
                    if not cb:
                        continue
                    for fc in [c for c in cb.fcurves
                               if not c.data_path.startswith("pose.bones")]:
                        cb.fcurves.remove(fc)
                        usuniete += 1
    arm.rotation_euler = (0.0, 0.0, 0.0)
    return usuniete


def _local_z_swiata(cel_world, prawa):
    """Zamienia zamówioną pozycję dłoni w świecie na wartość kanału `location`.

    Dla lewej ręki lustrzemy oś X — rig jest symetryczny, więc ta sama baza
    działa po obu stronach po odbiciu.
    """
    cel = Vector(cel_world)
    baza_w = Vector(BAZA_WORLD_R)
    if not prawa:
        cel = Vector((-cel.x, cel.y, cel.z))
    d = _ODWR_R @ (cel - baza_w)
    loc = BAZA_LOCAL + d
    return Vector((-loc.x, loc.y, loc.z)) if not prawa else loc


def _dopasuj(arm, pb_ik, nazwa_dloni, cel_world, prawa, iteracje=25, tlumienie=0.6,
             ulamek_zasiegu=0.99, bark_z_pozy=False):
    """Ustawia kontrolkę IK tak, żeby dłoń NAPRAWDĘ trafiła w zadany punkt.

    ⚠ Sam przelicznik z bazy osi to przybliżenie LINIOWE i wystarcza tylko
    blisko pozy bazowej — przy zamachu nad barkiem mylił się o 2,9 jednostki,
    czyli ręka szła nad głowę zamiast na wysokość barku. Zamiast dobierać
    poprawki ręcznie: policz, ZMIERZ, skoryguj. Baza osi robi tu za jakobian.

    ⚠ **Krok jest TŁUMIONY i to nie jest ostrożność, tylko konieczność.**
    Jakobian jest stały (policzony raz, przy pozie bazowej), więc daleko od niej
    kłamie co do kierunku. Pełny krok w takim kierunku przestrzeliwuje i pętla
    zaczyna oscylować zamiast zbiegać: zamach oburęczny stawał 2,0 j. od celu
    mimo że cel leżał 1,9 j. od barku, czyli GŁĘBOKO w zasięgu ramienia.
    Objaw był mylący — wyglądał jak „ręka nie sięga", a był zwykłym rozbieganiem
    się iteracji. Broń wychodziła wtedy pionowo nad głowę zamiast na zamach.

    Gdy cel naprawdę leży poza zasięgiem ramienia, pętla i tak nie zbiegnie —
    i wtedy `_sprawdz` ma prawo krzyknąć. To jest zamierzone: nieosiągalna
    poza ma być błędem, a nie cichym „jakoś to wygląda".
    """
    cel = Vector(cel_world)
    # ⚠ CEL POZA ZASIEGIEM RAMIENIA ROZBIEGA PETLE, a nie zatrzymuje jej na
    # wyciagnietej rece. Jakobian jest staly, wiec gdy celu nie da sie osiagnac,
    # poprawka co iteracje pcha w te sama strone i konczy sie reka NAD GLOWA.
    # Scinamy wiec cel do kuli zasiegu, zanim petla w ogole ruszy - to jest
    # naprawa PRZYCZYNY, a nie objawu.
    bark_kosc = "Bone.002_R.001" if prawa else "Bone.002_L.001"
    bark = arm.matrix_world @ arm.data.bones[bark_kosc].head_local
    # ⚠ `bark_z_pozy` (2026-10-03, pchnięcie z wypadem): kula zasięgu wokół
    # BIEŻĄCEGO barku. Ze spoczynku przycinała cel o ~2,6 j., gdy ciało szło
    # do przodu, i dłoń zostawała z tyłu. Domyślnie wyłączone — zamach i chód
    # liczą się bit w bit jak dotąd.
    if bark_z_pozy:
        dg0 = bpy.context.evaluated_depsgraph_get()
        ev0 = arm.evaluated_get(dg0)
        bark = ev0.matrix_world @ ev0.pose.bones[bark_kosc].head
    zasieg = ((arm.matrix_world @ arm.data.bones[
        "Bone.002_R.003" if prawa else "Bone.002_L.003"].head_local) - bark).length
    odchyl = cel - bark
    if odchyl.length > zasieg * ulamek_zasiegu:
        cel = bark + odchyl.normalized() * (zasieg * ulamek_zasiegu)

    loc = _local_z_swiata(cel, prawa)

    def zmierz(l):
        pb_ik.location = l
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        return ev.matrix_world @ ev.pose.bones[nazwa_dloni].head

    def jakobian(l):
        h = 0.12
        kol = []
        for i in range(3):
            e = Vector((0.0, 0.0, 0.0))
            e[i] = h
            kol.append((zmierz(l + e) - zmierz(l - e)) / (2 * h))
        return Matrix(((kol[0].x, kol[1].x, kol[2].x),
                       (kol[0].y, kol[1].y, kol[2].y),
                       (kol[0].z, kol[1].z, kol[2].z)))

    # ⭐⭐ JAKOBIAN LICZONY W BIEŻĄCYM PUNKCIE (2026-10-10, BAZA V4). Stała
    #   baza osi (`_ODWR_R`) jest zmierzona na rigu V3.7 — przy innym szkielecie
    #   kłamała co do kierunku i dłoń uciekała na drugą stronę ciała (bramka
    #   ciosu na czerwono, błąd 1–3 j.). Dziś: numeryczny jakobian kontrolki →
    #   dłoń co kilka kroków, krok ograniczony; start z przelicznika ALBO
    #   z bieżącej kontrolki — z którego bliżej.
    # ⭐ Start: kontrolka postawiona WPROST w celu (układ armatury) — IK z
    #   łańcuchem 3 trafia nadgarstkiem dokładnie tam (zmierzone: błąd 0).
    #   Przelicznik lokalny (`_local_z_swiata`) zostaje drugim kandydatem.
    M = pb_ik.matrix.copy()
    M.translation = arm.matrix_world.inverted() @ cel
    pb_ik.matrix = M
    bpy.context.view_layer.update()
    wprost = pb_ik.location.copy()
    if (zmierz(wprost) - cel).length < (zmierz(loc) - cel).length:
        loc = wprost
    najlepsza, najlepszy_blad = loc.copy(), float("inf")
    J_inv = None
    for it in range(iteracje):
        osiag = zmierz(loc)
        blad = cel - osiag
        if blad.length < najlepszy_blad:
            najlepsza, najlepszy_blad = loc.copy(), blad.length
        if blad.length < 0.02:
            break
        if J_inv is None or it % 4 == 0:
            J = jakobian(loc)
            try:
                J_inv = J.inverted()
            except ValueError:
                J_inv = J.transposed() * 0.3
        d = J_inv @ blad
        if d.length > 1.2:
            d = d.normalized() * 1.2
        loc = loc + d * (0.85 if it > 1 else tlumienie)
    pb_ik.location = najlepsza
    bpy.context.view_layer.update()
    return najlepsza


def _os_drzewca(arm, kat_stopni):
    """Kierunek drzewca w świecie, z uwzględnieniem kąta noszenia broni.

    ⚠ To NIE jest po prostu oś kości dłoni. Broń jest do niej obrócona o własny
    kąt noszenia (`char3d_weapons.KAT_2H`), więc lewa dłoń położona wzdłuż
    kości minęłaby drzewce o kilkadziesiąt stopni i wisiała obok broni.
    """
    m = arm.pose.bones[DLON_R].matrix
    lokalna = Matrix.Rotation(math.radians(kat_stopni), 3, "X") @ Vector((0.0, 1.0, 0.0))
    return ((arm.matrix_world.to_3x3() @ m.to_3x3()) @ lokalna).normalized()


def zbuduj_atak(arm=None, tolerancja=0.85, oburacz=False):
    """Tworzy (albo nadpisuje) akcję `Attack` i zostawia ją przypiętą do rigu."""
    arm = arm or bpy.data.objects["Armature"]
    nazwa = NAZWA_2H if oburacz else NAZWA
    stara = bpy.data.actions.get(nazwa)
    if stara:
        bpy.data.actions.remove(stara)
    akcja = bpy.data.actions.new(nazwa)
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = akcja

    hr = arm.pose.bones["HandIK_R.005"]
    hl = arm.pose.bones["HandIK_L.005"]
    talia = arm.pose.bones["Bone.001"]
    piers = arm.pose.bones["Bone.002"]

    bark_w, skala = _przelicznik(arm)
    if abs(skala - 1.0) > 0.005 or (bark_w - KALIB_BARK_R).length > 0.01:
        print(f"[atak] rig inny niz kalibracyjny: bark {tuple(round(v, 2) for v in bark_w)}, "
              f"skala zasiegu {skala:.3f} - pozy przeliczone")

    for klatka, praw_w, lew_w, skret, pochyl in POZY:
        if oburacz:
            _k, praw_w, skret, pochyl = POZY_2H[klatka]
        praw_w = _przenies(praw_w, bark_w, skala, prawa=True)
        lew_w = _przenies(lew_w, bark_w, skala, prawa=False)
        # ⚠ KOLEJNOŚĆ MA ZNACZENIE: tułów NAJPIERW, dopiero potem dłonie.
        # Skręt tułowia przesuwa barki, więc ręka dopasowana przed obrotem
        # wyląduje gdzie indziej.
        #
        # Kości kręgosłupa celują w górę, więc ich lokalne Y to oś SKRĘTU,
        # a lokalne X to pochylenie w przód. Skręt rozkładamy na talię i piersi,
        # bo cały obrót na jednej kości łamie sylwetkę w pasie.
        talia.rotation_quaternion = Euler(
            (pochyl * 0.0175, skret * 0.6 * 0.0175, 0.0), "XYZ").to_quaternion()
        piers.rotation_quaternion = Euler(
            (pochyl * 0.5 * 0.0175, skret * 0.4 * 0.0175, 0.0), "XYZ").to_quaternion()

        # ⚠ Przy chwycie OBURECZNYM prawa reka NIE MOZE isc na pelne
        # wyprostowanie. Obie dlonie sa na jednym drzewcu, wiec wyciagnieta
        # prawa wyprowadza punkt chwytu poza zasieg lewego ramienia - i lewa
        # dlon puszcza bron. To ograniczenie chwytu, nie ostroznosc solvera.
        if not oburacz:
            _dopasuj(arm, hr, DLON_R, praw_w, True)
        if oburacz:
            # ⚠ Lewa dłoń liczona PO ustawieniu prawej, bo jej cel zależy od
            # tego, gdzie ostatecznie wylądowała broń. Kolejność odwrotna daje
            # dłoń na drzewcu sprzed poprawki IK, czyli obok niego.
            #
            # ⚠⚠ ...a gdy tak policzony chwyt leży POZA zasięgiem lewego
            # ramienia, nie ma czego dopasowywać — lewa dłoń po prostu puszcza
            # broń. Wiązaniem jest wtedy LEWA ręka, nie prawa, więc to BROŃ
            # musi podejść do lewego barku. Pętla poniżej robi dokładnie to i
            # jest jedynym miejscem, które łączy oba ramiona w jeden chwyt.
            # Bez niej przebudowa proporcji zrywała chwyt na wszystkich trzech
            # broniach dwuręcznych naraz (0,95 j. przy limicie 0,55).
            import char3d_weapons
            bark_l = arm.matrix_world @ arm.data.bones["Bone.002_L.001"].head_local
            zasieg_l = ((arm.matrix_world
                         @ arm.data.bones["Bone.002_L.003"].head_local) - bark_l).length
            cel_prawa = Vector(praw_w)
            cel_lewa = None
            for _ in range(5):
                _dopasuj(arm, hr, DLON_R, tuple(cel_prawa), True, ulamek_zasiegu=0.90)
                bpy.context.view_layer.update()
                dg = bpy.context.evaluated_depsgraph_get()
                ev = arm.evaluated_get(dg)
                chwyt_w = ev.matrix_world @ ev.pose.bones[DLON_R].tail
                os_w = _os_drzewca(ev, char3d_weapons.KAT_2H)
                cel_lewa = chwyt_w - os_w * char3d_weapons.ODLEGLOSC_CHWYTU_2H
                nadmiar = (cel_lewa - bark_l).length - zasieg_l * 0.97
                if nadmiar <= 0.0:
                    break
                cel_prawa += (bark_l - cel_prawa).normalized() * nadmiar
            _dopasuj(arm, hl, DLON_L, tuple(cel_lewa), False)
        else:
            _dopasuj(arm, hl, DLON_L, lew_w, False)

        # ⚠ Kość dłoni dostaje JAWNY klucz obrotu neutralnego (2026-10-03):
        # pchnięcie i noszenie drzewcowe obracają ją, a klip bez klucza
        # dziedziczyłby obrót z poprzednio zbudowanego.
        pb_dr = arm.pose.bones[DLON_R]
        pb_dr.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        bpy.context.view_layer.update()
        for pb, kanal in ((hr, "location"), (hl, "location"),
                          (talia, "rotation_quaternion"), (piers, "rotation_quaternion"),
                          (pb_dr, "rotation_quaternion")):
            pb.keyframe_insert(data_path=kanal, frame=klatka, group=pb.name)

    # Kontrola dotyczy prawej dłoni zawsze; lewą sprawdzamy tylko w wariancie
    # jednoręcznym, bo w oburęcznym jej cel jest LICZONY, nie zamawiany.
    bledy = _sprawdz(arm, tolerancja, sprawdzaj_lewa=not oburacz, oburacz=oburacz)
    print(f"[atak] akcja '{nazwa}': {len(POZY)} poz, zakres {tuple(akcja.frame_range)}"
          f"{' (chwyt oburęczny)' if oburacz else ''}")
    return akcja, bledy


def _sprawdz(arm, tolerancja, sprawdzaj_lewa=True, oburacz=False):
    """Czy dłoń naprawdę trafiła tam, gdzie zamówiono.

    ⚠ Asercja, która nie potrafi zaświecić na czerwono, jest dekoracją:
    po wpisaniu pozy poza zasięgiem ramienia raport MUSI zgłosić BŁĄD, bo
    inaczej nieosiągalny zamach wygląda po prostu jak „dziwna animacja".
    """
    scn = bpy.context.scene
    bledy = []
    # ⚠ Wariant oburęczny ma WŁASNE cele (`POZY_2H`). Sprawdzanie go wobec
    # `POZY` zgłaszało cztery nieistniejące błędy — a asercja, która krzyczy
    # bez powodu, uczy ignorowania siebie i jest gorsza niż jej brak.
    bark_w, skala = _przelicznik(arm)
    for i, (klatka, praw_w, lew_w, _s, _p) in enumerate(POZY):
        if oburacz:
            praw_w = POZY_2H[i][1]
        # ⚠ Ten sam przelicznik, co przy budowaniu pozy. Porownywanie
        # przeliczonej dloni z surowa wspolrzedna z tabeli zglaszalo BLAD na
        # poprawnej animacji - czyli dokladnie to, przed czym ostrzega
        # `tools/CLAUDE.md`: raport krzyczacy na dobry stan uczy sie go ignorowac.
        praw_w = _przenies(praw_w, bark_w, skala, prawa=True)
        lew_w = _przenies(lew_w, bark_w, skala, prawa=False)
        scn.frame_set(klatka)
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        a = arm.evaluated_get(dg)
        pary = [(DLON_R, praw_w)] + ([(DLON_L, lew_w)] if sprawdzaj_lewa else [])
        for nazwa_k, cel in pary:
            osiag = a.matrix_world @ a.pose.bones[nazwa_k].head
            d = (osiag - Vector(cel)).length
            znak = "OK " if d <= tolerancja else "BLAD"
            if d > tolerancja:
                bledy.append((klatka, nazwa_k, round(d, 2)))
            print(f"  [{znak}] klatka {klatka} ({FAZY[klatka]:13}) {nazwa_k:16} "
                  f"cel=({cel[0]:+.2f},{cel[1]:+.2f},{cel[2]:+.2f}) "
                  f"osiagnieto=({osiag.x:+.2f},{osiag.y:+.2f},{osiag.z:+.2f}) blad={d:.2f}")
    if bledy:
        print(f"  [atak] UWAGA: {len(bledy)} poz poza tolerancja {tolerancja} "
              f"— poza prawdopodobnie poza zasiegiem ramienia: {bledy}")
    return bledy


def dodaj_atrape_broni(arm=None, dlugosc=4.0):
    """Prosty klin w prawej dłoni — WYŁĄCZNIE do podglądu wymachu.

    ⚠ To nie jest broń do gry, tylko przyrząd: bez czegoś w dłoni łuk cięcia
    jest nieczytelny. Docelowa broń to osobny obiekt w gnieździe kości.

    ⚠ Przy `parent_type='BONE'` dziecko siada na OGONIE kości, a jego lokalne Y
    biegnie wzdłuż kości. Ostrze budujemy więc wzdłuż +Y — pierwsza wersja szła
    wzdłuż +Z i klin przechodził przez tułów i głowę.
    """
    arm = arm or bpy.data.objects["Armature"]
    mesh = bpy.data.meshes.new("AtrapaBroni")
    sz, gr = 0.34, 0.11
    w = [
        (-sz, 0.0, -gr), (sz, 0.0, -gr), (sz, 0.0, gr), (-sz, 0.0, gr),
        (-sz * 0.3, dlugosc, -gr * 0.3), (sz * 0.3, dlugosc, -gr * 0.3),
        (sz * 0.3, dlugosc, gr * 0.3), (-sz * 0.3, dlugosc, gr * 0.3),
    ]
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    mesh.from_pydata(w, [], f)
    mesh.update()
    ob = bpy.data.objects.new("AtrapaBroni", mesh)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = DLON_R
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = (0.0, 0.0, 0.0)
    print(f"[atak] atrapa broni ({dlugosc} j.) w kosci dloni {DLON_R}")
    return ob

"""Rece ODCHYLONE OD TULOWIA w akcji "Walk" (nie "na bacznosc").

Modul BLENDEROWY, wolany z `build_char3d_base.py` PRZED zapisem do char.blend,
ZARAZ PO `char3d_walk.zbuduj_chod()` - i tylko w tej kolejnosci: tamten
generator buduje caly cykl (nogi, miednica, wymach rak), a ten odsuwa
nadgarstki na zewnatrz na juz gotowym tulowiu.

⚠⚠ **FUNKCJA MUSI BYC IDEMPOTENTNA** (`tools/CLAUDE.md`, regula nr 2) -
`build_char3d_base.py` wola ja za KAZDYM razem, gdy ktos przebudowuje baze,
a plik startuje z tego, co ostatnio zapisano. Pierwsza wersja liczyla nowa
poze jako `biezaca_z_pliku @ dodatek` - przy DRUGIM przebiegu "biezaca" to juz
byla poprzednia poprawka, wiec kat SIE PODWAJAL. Objaw: `wzrost_j` w raporcie
kurczylo sie z kazdym przebiegiem (12,2 -> 11,9 -> 11,3...). Naprawa: liczymy
od ZAPISANEGO NA SZTYWNO oryginalu (`ORIG_LOC`), nigdy od tego, co lezy
w pliku.

== Dlaczego "rece na zewnatrz" dziala =======================================

Prawdziwy problem NIE byl brakiem zgiecia lokcia (proba w §11 checkpointu -
solver IK odmawial giecia, bo cel byl BLIZEJ niz pelny zasieg). Reka wisi
idealnie prosto WZDLUZ TULOWIA, bo kontrolka `HandIK` celuje w punkt prawie
DOKLADNIE pod barkiem - to jest KIERUNEK celu, nie jego OSIAGALNOSC. Tu cel
idzie DALEJ (bardziej na zewnatrz, calkowita odleglosc od barku ROSNIE), wiec
solver IK nie ma tu nic do "wymyslenia" - zbieznosc w 0,03-0,55 j. od zadanego
celu, bez ani jednego przypadku "utkniecia" jak przy probie zgiecia.

== Co z tego modulu WYPADLO 2026-09-20 (etap A2) ============================

⛔ `dodaj_wychyl` (boczny wychyl kregoslupa) - byl WYLACZONY od dopisku 17
i liczyl od tabeli `ORIG_ROT` opisujacej STARY, 3-kluczowy cykl. Na nowym
ukladzie klatek te liczby nie znacza juz nic, a martwy kod z nieaktualna
tabela to pulapka, nie rezerwa. Wychyl miednicy zyje dzis w
`char3d_walk.KONTAKT_QUAT`.

⛔ `napraw_wysokosc_kroku` + `_STOPA_POPRAWKA` - lataly wysokosc stopy
adresujac klatki przez `% 3`. Cykl nie ma juz 3 klatek, a sama wysokosc stopy
jest teraz parametrem (`char3d_walk.CHOD["uniesienie"]`), nie poprawka.

⚠ `_bez_turntable` ZOSTAJE, mimo ze `char3d_walk` kasuje krzywe obrotu
obiektu: modul bywa wolany tez na plikach roboczych z `blender/wersje/`,
a wyciszenie nieistniejacych krzywych nic nie kosztuje.
"""
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_walk  # noqa: E402

# ⚠ Klatki MUSZA zgadzac sie z `char3d_walk.KLATKI`: 0-3 cykl, 4 domkniecie
# petli, 5 poza bezruchu (poza petla).
KLATKI = [0, 1, 2, 3, 4, 5]

# --- oryginalne dane "Walk", zmierzone RAZ na czystym pliku -----------------
# `git show HEAD:public/assets/char.blend` sprzed jakiejkolwiek pracy nad
# postawa. NIE CZYTAC tych wartosci z biezacego pliku - to jest clou naprawy
# idempotencji, patrz naglowek modulu.
#
# ⚠ Ulozenie na klatki jest PRZECIWSTAWNE do nog (`char3d_walk._plan_stopy`):
# w klatce 0 lewa NOGA jest z przodu, wiec lewa REKA idzie do tylu. Postac
# patrzy w swiatowe -Y, wiec "tyl" to ten wariant, przy ktorym nadgarstek
# ma world y = +0,57 - zmierzone, nie nazwane z glowy.
# ⚠⚠ **IMPORTOWANE, NIE PRZEPISANE** (2026-09-21). Te sześć krotek stało tu
# drugi raz, identycznie jak w `char3d_walk.RECE` — a ponieważ ten moduł
# biegnie PO tamtym i nadpisuje kanały `HandIK`, to TA kopia decydowała
# o wyniku. Zmiana wymachu w `char3d_walk` nie dawała więc nic widocznego.
# Amplituda mieszka dziś w `char3d_walk.WYMACH_RAK`.
# ⛔ Nie odtwarzaj tu literałów — idempotencja stoi na tym, że wartości są
# STAŁE i nie czytane z bieżącego pliku, a nie na tym, że leżą akurat tutaj.
_RECE = char3d_walk.rece()
_L_TYL, _L_SRODEK, _L_PRZOD = (_RECE["L"]["tyl"], _RECE["L"]["srodek"],
                               _RECE["L"]["przod"])
_R_TYL, _R_SRODEK, _R_PRZOD = (_RECE["R"]["tyl"], _RECE["R"]["srodek"],
                               _RECE["R"]["przod"])
ORIG_LOC = {
    "HandIK_L.005": {0: _L_TYL,   1: _L_SRODEK, 2: _L_PRZOD,
                     3: _L_SRODEK, 4: _L_TYL,   5: _L_SRODEK},
    "HandIK_R.005": {0: _R_PRZOD, 1: _R_SRODEK, 2: _R_TYL,
                     3: _R_SRODEK, 4: _R_PRZOD, 5: _R_SRODEK},
}

DODATEK_X_REKA = 0.45   # o ile dalej NA ZEWNATRZ (swiat X) ma isc nadgarstek
DLON_L = "Bone.002_L.003"
DLON_R = "Bone.002_R.003"


def _swiat(arm, nazwa_kosci):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    return ev.matrix_world @ ev.pose.bones[nazwa_kosci].head


def _sonduj(arm, pb_ik, effector_name, eps=0.05):
    """3x3: kolumna k = zmiana pozycji efektora w swiecie na jednostke
    lokalnego przesuniecia kontrolki wzdluz osi k (kontrolka jest sztywna,
    bez wiezow na sobie - zaleznosc jest liniowa)."""
    baza = pb_ik.location.copy()
    bpy.context.view_layer.update()
    w0 = _swiat(arm, effector_name)
    kolumny = []
    for i in range(3):
        d = Vector((0.0, 0.0, 0.0))
        d[i] = eps
        pb_ik.location = baza + d
        bpy.context.view_layer.update()
        kolumny.append((_swiat(arm, effector_name) - w0) / eps)
    pb_ik.location = baza
    bpy.context.view_layer.update()
    return w0, Matrix((
        (kolumny[0].x, kolumny[1].x, kolumny[2].x),
        (kolumny[0].y, kolumny[1].y, kolumny[2].y),
        (kolumny[0].z, kolumny[1].z, kolumny[2].z),
    ))


def _przesun(arm, pb_ik, effector_name, cel, iteracje=40, tlumienie=0.5):
    """Ustawia kontrolke tak, zeby efektor NAPRAWDE trafil w `cel` - iteracja
    tlumiona z jakobianem odswiezanym co krok (jak `char3d_attack._dopasuj`,
    tylko z jakobianem mierzonym, nie skalibrowanym na sztywno).

    ⚠⚠ Znaleziony wprost (2026-09-20, "kulanie"/"wachadla" w chodzie): dla
    niektorych klatek/kosci jakobian jest OSOBLIWY od pierwszej iteracji
    (wyznacznik ~0 - geometria, w ktorej lokalny ruch kontrolki w kazdym
    kierunku daje prawie zerowy ruch efektora). `R.inverted()` na PRAWIE
    zerowym wyznaczniku NIE rzuca wyjatku - zwraca macierz o OGROMNYCH
    wspolczynnikach, wiec `popr`/`krok` pcha kontrolke w losowy sposob daleko
    od sensownej pozycji, a `blad` maleje na tyle wolno (np. 0,20 -> 0,11 po
    40 iteracjach), ze ksiegowanie "najlepszy wynik" NAGRADZA to rozjezdzanie
    sie (blad ciagle "najlepszy dotychczas", mimo ze pozycja eksploduje do
    dziesiatek jednostek). Efekt jest niewidoczny w grze (eksport .glb piecze
    JUZ ROZWIAZANA pozycje efektora, nie kontrolki), ale to brudne, kruche
    dane w zrodlowym pliku - zamiast czekac na kolejny numeryczny zbieg
    okolicznosci, przerywamy NATYCHMIAST przy wykryciu osobliwosci i zostajemy
    przy dotychczas najlepszym (zwykle: nietknieta pozycja startowa).
    """
    najlepsza, najlepszy_blad = pb_ik.location.copy(), float("inf")
    for _ in range(iteracje):
        w0, R = _sonduj(arm, pb_ik, effector_name)
        blad = cel - w0
        if blad.length < najlepszy_blad:
            najlepsza, najlepszy_blad = pb_ik.location.copy(), blad.length
        if blad.length < 0.01:
            break
        if abs(R.determinant()) < 0.05:
            print(f"  [postawa] UWAGA: {effector_name} - osobliwy jakobian "
                  f"(det={R.determinant():.4f}), przerywam zamiast rozjezdzac "
                  f"kontrolke; zostaje przy bledzie {najlepszy_blad:.3f} j.")
            break
        try:
            popr = R.inverted() @ blad
        except ValueError:
            break
        krok = popr * tlumienie
        if krok.length > 0.5:
            krok = krok.normalized() * 0.5
        pb_ik.location = pb_ik.location + krok
    pb_ik.location = najlepsza
    bpy.context.view_layer.update()
    osiagniete = _swiat(arm, effector_name)
    blad_koncowy = (osiagniete - cel).length
    if blad_koncowy > 0.3:
        print(f"  [postawa] UWAGA: {effector_name} nie trafil celu - blad {blad_koncowy:.3f} j.")
    return osiagniete


class _bez_turntable:
    """Wycisza (NIE kasuje) krzywe obrotu obiektu na czas liczenia w swiecie.

    ⚠ `char3d_attack.zdejmij_obrot_turntable` KASUJE te krzywe na trwale -
    dobre do eksportu/podgladu (nic tam nie jest zapisywane), zle tutaj, bo
    `char.blend` ma je zachowac (patrz `build_char3d_base.py`, komentarz przy
    `--zapisz`). Wyciszenie jest odwracalne: `mute=True` na czas liczenia,
    `mute=False` na koniec, obrot obiektu przywrocony na sam koniec.
    """

    def __init__(self, arm):
        self.arm = arm
        self.krzywe = []

    def __enter__(self):
        akcja = self.arm.animation_data.action
        for layer in akcja.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        if not fc.data_path.startswith("pose.bones"):
                            fc.mute = True
                            self.krzywe.append(fc)
        self.arm.rotation_euler = (0.0, 0.0, 0.0)
        bpy.context.view_layer.update()
        return self

    def __exit__(self, *a):
        for fc in self.krzywe:
            fc.mute = False
        bpy.context.view_layer.update()


def dodaj_rozchylenie_ramion(arm=None, dodatek=DODATEK_X_REKA, report=True):
    """Odsuwa nadgarstki od tulowia (swiat X) na klatkach 0-3 akcji "Walk",
    zeby stojaca postac nie czytala sie jako "na baczność".

    Idempotentne: kontrolki IK startuja od `ORIG_LOC` (oryginal), nie od
    tego, co juz jest w pliku - odsuniecie liczy sie wzgledem POZYCJI, jaka
    dloni dalaby oryginalna animacja NA BIEZACYM (juz wychylonym) tulowiu, nie
    wzgledem wyniku poprzedniego przebiegu tej funkcji.
    """
    arm = arm or bpy.data.objects["Armature"]
    scn = bpy.context.scene
    chod = bpy.data.actions.get("Walk")
    if chod is None:
        raise RuntimeError('brak akcji "Walk" - nie ma czego poprawiac')
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = chod

    with _bez_turntable(arm):
        for f in KLATKI:
            scn.frame_set(f)
            # ⚠ Reset do ORYGINALNEJ pozycji kontrolki PRZED pomiarem -
            # inaczej "obecny" ponizej czytalby wynik POPRZEDNIEGO przebiegu
            # tej funkcji (ktory juz jest odsuniety) i kazde wywolanie
            # odsuwaloby dlon o kolejne `dodatek` j.
            arm.pose.bones["HandIK_L.005"].location = ORIG_LOC["HandIK_L.005"][f]
            arm.pose.bones["HandIK_R.005"].location = ORIG_LOC["HandIK_R.005"][f]
            bpy.context.view_layer.update()
            if report:
                print(f"-- klatka {f} --")
            for ik_name, eff_name, znak in (
                ("HandIK_L.005", DLON_L, +1.0),
                ("HandIK_R.005", DLON_R, -1.0),
            ):
                pb_ik = arm.pose.bones[ik_name]
                obecny = _swiat(arm, eff_name)
                cel = Vector((obecny.x + znak * dodatek, obecny.y, obecny.z))
                osiagniete = _przesun(arm, pb_ik, eff_name, cel)
                pb_ik.keyframe_insert(data_path="location", frame=f, group=pb_ik.name)
                if report:
                    print(f"  {ik_name}: +{dodatek} j. na zewnatrz -> "
                          f"{eff_name} x {obecny.x:.2f} -> {osiagniete.x:.2f}")

    scn.frame_set(0)
    bpy.context.view_layer.update()
    print(f"[postawa] rece odsuniete od tulowia o {dodatek} j. (swiat X), klatki {KLATKI}")

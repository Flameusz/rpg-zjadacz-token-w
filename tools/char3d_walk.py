"""Cykl chodu postaci gracza — akcja `Walk` budowana PARAMETRYCZNIE.

Moduł BLENDEROWY, wołany z `build_char3d_base.py` PRZED zapisem do char.blend.
`Walk` jest JEDYNĄ akcją PRZECHOWYWANĄ w pliku (warianty z bronią/tarczą i oba
ciosy powstają na żywo dopiero przy eksporcie), więc to tutaj mieszka całość
ruchu nóg, miednicy i podpisu chodu.

⚠ **Moduł NADPISUJE całą akcję `Walk`** — kasuje jej krzywe i pisze komplet
kanałów dla WSZYSTKICH kości. To jest celowe: poprzednia wersja składała się
z kilku łatek nanoszonych po kolei na dane zastane w pliku i każda musiała
osobno pilnować idempotencji (patrz nagłówek `char3d_walk_lean.py` — kąt się
podwajał przy drugim `--zapisz`). Tutaj idempotencja jest z definicji: wynik
nie zależy od tego, co leżało w pliku.

═══ Układ klatek (od 2026-09-20, etap A2) ═══════════════════════════════════

    0  KONTAKT A          lewa stopa z przodu, prawa z tyłu, obie na podłodze
    1  PRZENIESIENIE A    prawa stopa UNIESIONA i mijająca, lewa podpiera
    2  KONTAKT B          lustro klatki 0
    3  PRZENIESIENIE B    lewa stopa UNIESIONA, prawa podpiera
    4  domknięcie pętli   (== klatka 0)
    5  POZA BEZRUCHU      stopy razem, obie płasko, miednica wysoko

⚠ **Klatka 5 nie należy do pętli.** `char3d_export_gltf.py` eksportuje klip
0–5, a `src/render3d/Character3D.ts` tnie go na dwa: pętlę 0–4 (`subclip`)
i pozę bezruchu na klatce 5. Bez tego cięcia bezruch wjeżdżałby w chód.

Powód, dla którego bezruch MUSI stać poza pętlą: w poprawnym, naprzemiennym
cyklu nie ma ani jednej klatki, w której obie stopy stoją płasko RAZEM —
w kontakcie są rozstawione, w przeniesieniu jedna jest w powietrzu. Stary,
3-kluczowy cykl taką klatkę miał tylko dlatego, że był zdegenerowany, i to
ona była pozą stojącą.

⚠ **Poza bezruchu = zerowe wychylenie wszystkich kanałów** (poza stałym
pochyleniem szyi, `STALE_POZY`). Dzięki temu jest IDENTYCZNA z klatką 1
starego cyklu, czyli postać stojąca wygląda dokładnie tak, jak wyglądała —
a to jest poza, pod którą dobrana jest skala sprite'a w grze i baza liniowa
ciosu (`char3d_attack.BAZA_LOCAL`). Asercja w `build_char3d_base.py` to
sprawdza wierzchołek po wierzchołku.

═══ Dlaczego 4 klucze, a nie 3 ══════════════════════════════════════════════

Stary cykl miał 3 klucze i był z tego powodu **asymetryczny 2:1**: lewa stopa
jechała do przodu przez dwa interwały (0,4 s), a wracała przez jeden (0,2 s).
Jeden krok trwał dwa razy dłużej niż drugi — kuśtykanie. Naprzemienny chód
potrzebuje PARZYSTEJ liczby kluczy; przy 3 środek wymachu prawej nogi wypadał
w f = 2,5, gdzie klucza po prostu NIE MA, więc nie było gdzie postawić szczytu
uniesienia. Dlatego poprzednia poprawka musiała szczyt SPŁASZCZYĆ, a nie
przesunąć — to nie była ostrożność, tylko brak miejsca w strukturze.

Zmierzone na starym cyklu (2026-09-20, przed tą przebudową):

    uniesienie kostki      0,065 j.  = 0,54 px w buforze 96x128
    bujanie miednicy       0,268 j.
    noga w f 1,5–2,1       100,8% zasięgu, kolano 179,8° (przeprost)
    dolna linia sylwetki   117–119 px przez CAŁY cykl (stopa się nie odrywa)

═══ Geometria: półkrok i bujanie są ZE SOBĄ związane ════════════════════════

⚠ **Noga w pozie mijania jest już na 99,5% zasięgu** (5,224 z 5,250 j.).
Zapasu praktycznie nie ma, więc półkroku NIE da się wydłużyć bez opuszczenia
miednicy: stopa odjechana o `polkrok` w poziomie musi zostać w zasięgu biodra,
a jedyne, co to załatwia, to obniżenie biodra w kontakcie. Stary cykl miał za
małe bujanie DO SWOJEGO półkroku i dlatego kolano blokowało się na 180°.

Generator liczy tę zależność sam i raportuje ją na każdej klatce; twardą
asercją jest `BLAD_IK` (czy stopa NAPRAWDĘ stoi tam, gdzie zamówiono) razem
z `KOLANO_PROSTE`.

⚠ **Kotwicą pionu jest podłoga pozy bezruchu, nie „dół cyklu".** Stopa
podpierająca stoi na dokładnie tej wysokości, na której stoi postać stojąca,
więc postać nie zapada się w grunt w marszu. Stary cykl obniżał obie stopy
o 0,11 j. w kontakcie i to było widać jako tonięcie.

⚠ **`Bone.005` (korzeń WSZYSTKICH kontrolek IK) zostaje nieruchomy.** Stary
cykl podnosił go o 0,0885 j. lok. razem z miednicą — czyli stopy jechały
w górę razem z biodrem i **większość uniesienia sama się kasowała**. To jest
powód, dla którego „podbicie liczby" nigdy nie działało.

═══ Czego ten moduł CELOWO nie rusza ════════════════════════════════════════

Mesha, `PROPORCJE`, pozy spoczynkowej rigu, nazw kości, skali `Armature`,
`roll`, punktów montażowych ekwipunku. Pisze wyłącznie krzywe akcji `Walk`.
"""
import math

import bpy
from mathutils import Matrix, Quaternion, Vector

NAZWA = "Walk"

# Klatki: 0-3 cykl, 4 domknięcie pętli, 5 poza bezruchu (poza pętlą).
KLATKI = [0, 1, 2, 3, 4, 5]
KONTAKT_A, PRZENIESIENIE_A, KONTAKT_B, PRZENIESIENIE_B, DOMKNIECIE, BEZRUCH = KLATKI

# --- parametry chodu (jednostki ŚWIATA; postać ma 12,84 j. wzrostu) --------
#
# ⚠ To są pokrętła do strojenia chodu i jedyne miejsce, w którym wolno zmieniać
# jego charakter. Liczby wpisane gdziekolwiek indziej w tym pliku opisują RIG
# (osie, kości, zastane pozy), nie chód.
CHOD = {
    # Wychylenie stopy w przód/tył od pozycji neutralnej. Pełny krok = 2x tyle.
    # ⚠ Ograniczone GEOMETRIĄ, nie gustem — patrz nagłówek. Przy 1,55 i
    # `bujanie` 0,30 kontakt wypada na 97,1–98,2% zasięgu nogi, czyli kolano
    # zostaje miękkie (153–159°). ⚠ Ten procent zależy OD OBU liczb naraz:
    # przy `bujanie` 0,42 było 94,9–96,1%. Podnosząc półkrok albo obniżając
    # bujanie sprawdź raport — 100% to granica, za którą IK przestaje trafiać.
    "polkrok": 1.55,
    # Kostka nad podłogą w połowie wymachu. 0,70 to WARTOŚĆ STARTOWA z
    # handoffu, nie kryterium odbioru — ocenia się ją w grze.
    "uniesienie": 0.70,
    # O ile miednica opada w kontakcie względem pozy mijania.
    # ⚠ **0,30 to wybór autora (2026-09-20), nie wynik wyliczenia.** Pierwsza
    # wersja A2 miała 0,42 — geometrycznie też poprawne, ale czytało się jako
    # za mocne kołysanie. Przy 0,30 głowa buja się o 3 px w buforze gry
    # zamiast 4, a zapas zasięgu nogi w kontakcie maleje z ~4 pp do ~2 pp.
    "bujanie": 0.30,
    # Ustawienie stopy W POWIETRZU (stopnie od PŁASKIEJ stopy).
    # ⚠ **Znak ma znaczenie i pierwsza wersja miała go odwrotnie.** Dodatni
    # opuszcza palce; przy +16° prześwit stopy nad gruntem spadał z 5,6 px do
    # 3 px w buforze gry, bo palce schodziły prawie tyle, ile podnosiła się
    # kostka — czyli uniesienie było w liczbach, a nie na ekranie. W połowie
    # wymachu stopa i tak jest zgięta grzbietowo (palce W GÓRĘ), żeby minąć
    # grunt; opuszczenie palców należy do odbicia, którego ten czterokluczowy
    # cykl nie ma gdzie zapisać.
    "pochylenie_stopy": -10.0,
}

# ⚠ Twardym kryterium NIE jest procent zasięgu, tylko to, czy IK NAPRAWDĘ
# trafia w zamówiony punkt i czy kolano nie blokuje się na prostej. Sam
# procent bywa mylący: poza stojąca siedzi na 99,5% i jest w porządku, bo
# kolano ma tam 169°. Stary cykl przekraczał 100% i wtedy stopa zostawała
# 0,043 j. za celem — czyli przestawała nadążać, mimo że „wygląda podobnie".
BLAD_IK = 0.01      # j. świata; powyżej stopa nie stoi tam, gdzie zamówiono
KOLANO_PROSTE = 176.0   # stopnie; powyżej to już przeprost, nie wyprostowana noga

# Ile stopa może zejść poniżej podłogi pozy stojącej, zanim uznamy to za
# wbijanie się w grunt. ⚠ Ta asercja jest odpowiedzią na KONKRETNĄ regresję:
# pierwsza wersja A2 zostawiała kość stopy w spoczynku LOKALNYM, a ta jest
# dzieckiem goleni — czyli „zero" znaczyło „równolegle do goleni", nie
# „równolegle do podłogi". W kontakcie noga stoi ukośnie, więc pięta/palce
# schodziły 0,63 j. pod grunt, a raport cyklu był zielony, bo KOSTKA stała
# dokładnie tam, gdzie zamówiono. Złapała to dopiero bramka broni
# (`char3d_sprawdz_bron.py`: miecz w chodzie +0,46).
ZANURZENIE = 0.05

# Najmniejsza różnica wysokości stóp w przeniesieniu, którą uznajemy za
# oderwanie. ⚠ **Nie jest ułamkiem `uniesienie`** i to jest istota sprawy:
# pierwsza wersja liczyła próg jako `uniesienie * 0,5`, więc przy `uniesienie
# = 0` próg też wynosił zero i asercja przechodziła na zielono dla chodu,
# w którym stopa w ogóle nie wstaje (`tools/CLAUDE.md`: „próg w asercji nie
# może być własnym wynikiem generatora"). 0,30 j. to ~2,5 px w buforze 96x128
# — czyli dolna granica tego, co w ogóle widać; stary cykl miał 0,065 j.
MIN_ODERWANIE = 0.30

# --- stałe RIGU (nie chodu) ------------------------------------------------
#
# Wychył miednicy i przeciwskręt kręgosłupa: wartości zastane w akcji `Walk`,
# przeniesione 1:1 na nowy układ klatek. Klatka „kontakt B" jest LUSTREM
# klatki „kontakt A" — dla kości leżących na płaszczyźnie symetrii lustro to
# (w, x, -y, -z).
KONTAKT_QUAT = {
    "Bone":     (0.998349, 0.0, -0.057315, -0.003776),
    "Bone.001": (0.994583, 0.017973, 0.100045, 0.021746),
}
# Poza mijania/bezruchu dla kręgosłupa — u góry cyklu tułów jest prawie pionowy.
MIJANIE_QUAT = {
    "Bone":     (1.0, 0.0, 0.0, 0.0),
    "Bone.001": (0.999973, -0.007384, 0.0, 0.0),
}
# Drobne przesunięcie miednicy w poziomie, obecne w kontakcie w obu kierunkach.
KONTAKT_MIEDNICA_Z_LOK = -0.0107

# Stałe, NIEANIMOWANE pozy — kości, które nie siedzą w spoczynku, ale też nie
# biorą udziału w cyklu.
#
# `Bone.003` (szyja): bez tego przebudowa wyprostowałaby postaci szyję.
#
# `Bone.002_L` (obojczyk LEWY): ⚠ **to jest wartość z POZY STOJĄCEJ, nie
# element chodu.** Stary cykl trzymał ją na klatkach 0 i 1, a na klatce 2
# dawał spoczynek — i lustrzanie dla prawego. Efekt: postać stojąca ma lewy
# obojczyk obrócony o 11,2°, a prawy nie. To jest wada zastanej pozy, nie
# zaprojektowany przechył barku, ale **poza stojąca ma zostać nietknięta**
# (pod nią dobrana jest skala sprite'a i baza ciosu), więc obojczyki jadą
# przez cały cykl na wartościach z bezruchu i po prostu nie animują się.
# ⛔ Nie „naprawiaj" tej asymetrii przy okazji A2 — to zmiana pozy stojącej,
# czyli osobna decyzja.
STALE_POZY = {
    "Bone.003": (0.998940, -0.046000, 0.0, 0.0),
    "Bone.002_L": (0.995200, -0.072200, -0.048500, -0.043900),
}

MIEDNICA = "Bone"
TALIA = "Bone.001"
STOPA = {"L": "Bone_L.004", "R": "Bone_R.004"}
STOPA_IK = {"L": "FootIK_L.006", "R": "FootIK_R.006"}
BIODRO = {"L": "Bone_L.001", "R": "Bone_R.001"}
GOLEN = {"L": "Bone_L.003", "R": "Bone_R.003"}
DLON_IK = {"L": "HandIK_L.005", "R": "HandIK_R.005"}

# ⚠⚠ **AMPLITUDA WYMACHU — JEDNA LICZBA, JEDNO ŹRÓDŁO** (2026-09-21).
# 1,00 = wymach zastany w oryginalnej akcji `Walk`. Mniej = ręce machają
# spokojniej. Skaluje `przod` i `tyl` WZGLĘDEM `srodek`.
#
# ⛔ **`srodek` NIE jest skalowany i nie wolno go ruszać.** To jest poza, pod
# którą skalibrowana jest baza liniowa ciosu (`char3d_attack.BAZA_LOCAL`),
# i to ona ląduje na klatce bezruchu — przestrojenie jej przestraja atak.
# Dlatego amplituda ściąga skrajne pozy DO środka, a nie przesuwa całości.
#
# ⚠⚠ Te same sześć krotek stało do 2026-09-21 **drugi raz** w
# `char3d_walk_lean.ORIG_LOC`, a ponieważ tamten moduł biegnie PO tym i
# nadpisuje kanały `HandIK`, to ON decydował o wyniku. Zmiana tylko tutaj nie
# dałaby nic widocznego. Dziś `char3d_walk_lean` importuje te wartości stąd.
# ⛔ Nie odtwarzaj tam literałów.
WYMACH_RAK = 0.70

# Surowe pozy zmierzone RAZ na czystym `char.blend` (przed jakąkolwiek pracą
# nad postawą). ⛔ Nie czytaj ich z bieżącego pliku — na tym stoi idempotencja
# `char3d_walk_lean`.
_SUROWE = {
    "L": {"przod": (1.128983, -1.992803, 1.863164),
          "srodek": (1.808126, -1.992803, 1.124722),
          "tyl": (2.041788, -1.992803, 0.835031)},
    "R": {"przod": (-1.128983, -1.992803, 1.863164),
          "srodek": (-1.808126, -1.992803, 1.124722),
          "tyl": (-2.041788, -1.992803, 0.835031)},
}


def _sciagnij(poza, srodek, ile):
    """Przysuń skrajną pozę do środka o `ile` (1,0 = bez zmian)."""
    return tuple(s + (p - s) * ile for p, s in zip(poza, srodek))


def rece(wymach=None):
    """Pozy kontrolek IK rąk przy zadanej amplitudzie wymachu."""
    w = WYMACH_RAK if wymach is None else wymach
    out = {}
    for strona, poz in _SUROWE.items():
        sr = poz["srodek"]
        out[strona] = {"przod": _sciagnij(poz["przod"], sr, w),
                       "srodek": sr,
                       "tyl": _sciagnij(poz["tyl"], sr, w)}
    return out


# Wymach rąk — POZYCJE LOKALNE kontrolek IK.
# ⚠ Kierunki ZMIERZONE, nie nazwane z głowy: postać patrzy w światowe −Y, więc
# nadgarstek przy lokalnym (2,0418, …) ląduje na world y = +0,57 (Z TYŁU),
# a przy (1,1290, …) na −1,54 (Z PRZODU). Pomylenie tych dwóch daje ręce
# machające RAZEM z nogami tej samej strony — chód „żołnierzyka".
RECE = rece()


def _kanaly(pb):
    return ("location",
            "rotation_quaternion" if pb.rotation_mode == "QUATERNION" else "rotation_euler")


def _spoczynek(arm):
    for pb in arm.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.rotation_euler = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
    for nazwa, q in STALE_POZY.items():
        arm.pose.bones[nazwa].rotation_quaternion = q


def _wyczysc(akcja):
    """Kasuje WSZYSTKIE krzywe akcji — łącznie z obrotem całego obiektu.

    ⚠ Stary `Walk` miał wkluczowany obrót OBIEKTU o −90° co trzy klatki
    (podgląd „chód z czterech stron"). Przy nowym układzie klatek ten obrót
    wypadłby w środku cyklu i przekręcałby postać w połowie kroku. Podgląd
    z czterech stron i tak robi `build_char3d_base.renderuj()`, przestawiając
    KAMERĘ, więc krzywa obiektu jest zbędna.
    """
    for layer in akcja.layers:
        for strip in layer.strips:
            for cb in list(strip.channelbags):
                for fc in list(cb.fcurves):
                    cb.fcurves.remove(fc)


def _baza_kontrolki(arm, nazwa):
    """(pozycja w świecie przy location=0, macierz lokalne→światowe).

    Kontrolki IK nie mają na sobie żadnych więzów, a ich rodzic (`Bone.005`)
    stoi w tym cyklu nieruchomo, więc zależność jest ŚCIŚLE LINIOWA i wystarczy
    zmierzyć ją raz. To ten sam pomysł co `_sonduj` w `char3d_walk_lean`, tylko
    bez iteracji — tu nie ma czego dopasowywać, liczy się wprost.
    """
    pb = arm.pose.bones[nazwa]
    pb.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    w0 = (arm.matrix_world @ pb.matrix).to_translation()
    kolumny = []
    for i in range(3):
        d = Vector((0.0, 0.0, 0.0))
        d[i] = 1.0
        pb.location = d
        bpy.context.view_layer.update()
        kolumny.append((arm.matrix_world @ pb.matrix).to_translation() - w0)
    pb.location = (0.0, 0.0, 0.0)
    bpy.context.view_layer.update()
    return w0, Matrix(((kolumny[0].x, kolumny[1].x, kolumny[2].x),
                       (kolumny[0].y, kolumny[1].y, kolumny[2].y),
                       (kolumny[0].z, kolumny[1].z, kolumny[2].z)))


def _palec(arm, strona):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    return (ev.matrix_world @ ev.pose.bones[STOPA[strona]].tail).z


def _os_pochylenia_stopy(arm, strona):
    """Która LOKALNA oś kości stopy opuszcza palce — zmierzona, nie zgadnięta.

    ⚠ Kość stopy celuje w przód i lekko w dół, a jej `roll` nie jest zerowy,
    więc „pochylenie" nie siedzi w żadnej osi, którą dałoby się wskazać
    z nazwy. Stary cykl używał na tej kości i lokalnego X, i lokalnego Z naraz.
    Probujemy oba kierunki obu osi i bierzemy ten, który naprawdę opuszcza
    palce w pionie.
    """
    pb = arm.pose.bones[STOPA[strona]]
    bazowy = _palec(arm, strona)
    najlepsza, najlepszy = (0, 1.0), 0.0
    for os in (0, 2):
        for znak in (1.0, -1.0):
            pb.rotation_quaternion = _quat_os(os, znak, 20.0)
            bpy.context.view_layer.update()
            spadek = bazowy - _palec(arm, strona)
            pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
            bpy.context.view_layer.update()
            if spadek > najlepszy:
                najlepszy, najlepsza = spadek, (os, znak)
    return najlepsza


def _wysokosc_palca(arm, strona):
    """Ile palec stopy leży niżej od kostki (świat)."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = arm.evaluated_get(dg)
    pb = ev.pose.bones[STOPA[strona]]
    return (ev.matrix_world @ pb.head).z - (ev.matrix_world @ pb.tail).z


def _wypoziomuj_stope(arm, strona, os_znak, odniesienie, dodatek=0.0):
    """Ustawia kość stopy tak, żeby podeszwa była RÓWNOLEGŁA DO PODŁOGI.

    ⚠ Spoczynek tej kości NIE jest „płasko" — jest „wzdłuż goleni", bo to
    dziecko goleni w łańcuchu FK. W kontakcie noga stoi ukośnie, więc stopa
    zostawiona w spoczynku wbija piętę albo palce w grunt. Wyrównujemy do
    tego samego przewyższenia palca nad kostką, jakie ma poza stojąca
    (`odniesienie`), a `dodatek` dokłada artystyczne opuszczenie palców
    w powietrzu — liczone już OD PŁASKIEJ stopy, nie od goleni.

    Zależność jest prawie liniowa w kącie (Δz ≈ L·sin θ), więc sieczna
    zbiega w dwóch krokach; trzeci jest zapasem.
    """
    pb = arm.pose.bones[STOPA[strona]]
    os, znak = os_znak
    kat = 0.0
    for _ in range(4):
        pb.rotation_quaternion = _quat_os(os, znak, kat)
        bpy.context.view_layer.update()
        blad = _wysokosc_palca(arm, strona) - odniesienie
        if abs(blad) < 1e-4:
            break
        # pochodna zmierzona na miejscu, żeby nie zakładać długości kości
        pb.rotation_quaternion = _quat_os(os, znak, kat + 5.0)
        bpy.context.view_layer.update()
        d = (_wysokosc_palca(arm, strona) - odniesienie - blad) / 5.0
        if abs(d) < 1e-9:
            break
        kat -= blad / d
    pb.rotation_quaternion = _quat_os(os, znak, kat + dodatek)
    bpy.context.view_layer.update()
    return kat


def _quat_os(os, znak, stopnie):
    v = Vector((1.0 if os == 0 else 0.0,
                1.0 if os == 1 else 0.0,
                1.0 if os == 2 else 0.0))
    return Quaternion(v, znak * math.radians(stopnie))


def _najnizszy_punkt(arm):
    """Najniższy wierzchołek CAŁEJ postaci w świecie — czyli linia gruntu.

    ⚠ To jest jedyna miara, która widzi wbijanie stopy w podłogę. Kostka
    potrafi stać dokładnie tam, gdzie zamówiono, przy piętach 0,6 j. pod
    ziemią (patrz `ZANURZENIE`).
    """
    dg = bpy.context.evaluated_depsgraph_get()
    najn = float("inf")
    for o in bpy.data.objects:
        if o.type != "MESH":
            continue
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        for v in me.vertices:
            z = (o.matrix_world @ v.co).z
            if z < najn:
                najn = z
        oe.to_mesh_clear()
    return najn


def _lustro(q):
    """Lustro pozy dla kości leżącej na płaszczyźnie symetrii.

    ⚠ Reguła (w, x, −y, −z) jest ZMIERZONA na zastanych danych `Walk`, nie
    wyprowadzona z konwencji: kręgosłup miał w klatkach 0 i 2 dokładnie takie
    pary. Dla kości parzystych (obojczyki) lustrem jest sprzężenie — też
    zmierzone na obojczykach (patrz `STALE_POZY`).
    """
    return Quaternion((q[0], q[1], -q[2], -q[3]))



def _plan_stopy(chod, przod_w_klatce_0):
    """Trajektoria JEDNEJ stopy: (przesunięcie w przód/tył, uniesienie) na klatkę.

    Faza podparcia to klatki 0→1→2 (stopa jedzie do tyłu ze STAŁĄ prędkością,
    bo oba interwały są równe), faza wymachu 2→3→4 (do przodu, z uniesieniem
    w klatce 3). Druga noga jedzie tym samym planem przesuniętym o pół cyklu —
    stąd symetria.
    """
    # ⚠ Przód to światowe −Y (postać patrzy w −Y), więc noga „z przodu" ma
    # przesunięcie UJEMNE. Odwrócenie tego znaku daje chód tyłem.
    a = chod["polkrok"] * (-1.0 if przod_w_klatce_0 else 1.0)
    h = chod["uniesienie"]
    return {
        KONTAKT_A:       (+a, 0.0),
        PRZENIESIENIE_A: (0.0, 0.0 if przod_w_klatce_0 else h),
        KONTAKT_B:       (-a, 0.0),
        PRZENIESIENIE_B: (0.0, h if przod_w_klatce_0 else 0.0),
        DOMKNIECIE:      (+a, 0.0),
        BEZRUCH:         (0.0, 0.0),
    }


def zbuduj_chod(arm=None, chod=None, report=True):
    """Nadpisuje akcję `Walk` symetrycznym cyklem 4-kluczowym + pozą bezruchu.

    Zwraca wiersze raportu: (klatka, noga, ułamek zasięgu, kąt kolana, Z, Y).
    """
    arm = arm or bpy.data.objects["Armature"]
    chod = dict(CHOD, **(chod or {}))
    scn = bpy.context.scene

    if not arm.animation_data:
        arm.animation_data_create()
    akcja = bpy.data.actions.get(NAZWA)
    if akcja is None:
        akcja = bpy.data.actions.new(NAZWA)
    akcja.use_fake_user = True
    arm.animation_data.action = akcja
    _wyczysc(akcja)
    arm.rotation_euler = (0.0, 0.0, 0.0)

    # Spoczynek PRZED pomiarami — inaczej baza kontrolek zmierzyłaby się na
    # pozie zastanej z poprzedniego przebiegu i cały cykl by się przesunął.
    _spoczynek(arm)
    bpy.context.view_layer.update()

    baza_stopy = {s: _baza_kontrolki(arm, STOPA_IK[s]) for s in ("L", "R")}
    os_stopy = {s: _os_pochylenia_stopy(arm, s) for s in ("L", "R")}
    # Wzorzec „stopa płasko": przewyższenie palca nad kostką w pozie stojącej
    # i wysokość podłogi, na której ta poza stoi.
    plasko = {s: _wysokosc_palca(arm, s) for s in ("L", "R")}
    podloga = _najnizszy_punkt(arm)
    zasieg_nogi = sum(arm.data.bones[n].length
                      for n in ("Bone_L.001", "Bone_L.002", "Bone_L.003")) * arm.scale.x
    if report:
        print(f"[chod] zasięg nogi {zasieg_nogi:.3f} j.; oś pochylenia stopy "
              f"L={os_stopy['L']} R={os_stopy['R']}")

    plan = {"L": _plan_stopy(chod, True), "R": _plan_stopy(chod, False)}
    bujanie_lok = -chod["bujanie"] / arm.scale.x
    wiersze = []

    for f in KLATKI:
        kontakt = f in (KONTAKT_A, KONTAKT_B, DOMKNIECIE)
        lustro = f == KONTAKT_B
        # ⚠ `frame_set` IDZIE PRZED ustawieniem pozy, nie po. Odwrotna
        # kolejność wygląda niewinnie i jest cichą katastrofą: `frame_set`
        # przelicza pozę Z AKCJI, czyli kasuje wszystko, co przed chwilą
        # wpisaliśmy, a pomiar i tak coś zwraca — złapane na raporcie,
        # w którym wszystkie sześć klatek miało IDENTYCZNE liczby.
        scn.frame_set(f)
        _spoczynek(arm)

        # --- kręgosłup i miednica ---
        for nazwa in (MIEDNICA, TALIA):
            q = Quaternion(KONTAKT_QUAT[nazwa] if kontakt else MIJANIE_QUAT[nazwa])
            arm.pose.bones[nazwa].rotation_quaternion = _lustro(q) if lustro else q
        if kontakt:
            # ⚠ lokalne Y kości `Bone` to ŚWIATOWE Z — kość celuje w górę.
            arm.pose.bones[MIEDNICA].location = (0.0, bujanie_lok, KONTAKT_MIEDNICA_Z_LOK)

        # --- ręce: przeciwstawnie do nóg ---
        for s in ("L", "R"):
            noga_z_przodu = (s == "L") != lustro
            klucz = ("tyl" if noga_z_przodu else "przod") if kontakt else "srodek"
            arm.pose.bones[DLON_IK[s]].location = RECE[s][klucz]

        # --- stopy ---
        for s in ("L", "R"):
            dy, dz = plan[s][f]
            w0, M = baza_stopy[s]
            arm.pose.bones[STOPA_IK[s]].location = M.inverted() @ Vector((0.0, dy, dz))
        bpy.context.view_layer.update()
        # ⚠ Poziomowanie IDZIE PO ustawieniu wszystkich kostek, nie w tej samej
        # pętli: kość stopy jest dzieckiem goleni, więc jej właściwy kąt zależy
        # od tego, jak IK ostatecznie ułożyło nogę.
        for s in ("L", "R"):
            _dz = plan[s][f][1]
            _wypoziomuj_stope(arm, s, os_stopy[s], plasko[s],
                              chod["pochylenie_stopy"] if _dz > 0.0 else 0.0)

        dg = bpy.context.evaluated_depsgraph_get()
        ev = arm.evaluated_get(dg)
        for s in ("L", "R"):
            biodro = ev.matrix_world @ ev.pose.bones[BIODRO[s]].head
            kolano = ev.matrix_world @ ev.pose.bones[GOLEN[s]].head
            kostka = ev.matrix_world @ ev.pose.bones[GOLEN[s]].tail
            kat = math.degrees((biodro - kolano).angle(kostka - kolano))
            cel = ev.matrix_world @ ev.pose.bones[STOPA_IK[s]].head
            wiersze.append((f, s, (kostka - biodro).length / zasieg_nogi, kat,
                            kostka.z, kostka.y, (kostka - cel).length,
                            _najnizszy_punkt(arm) - podloga))

        for pb in arm.pose.bones:
            for kanal in _kanaly(pb):
                pb.keyframe_insert(data_path=kanal, frame=f, group=pb.name)

    # ⚠ Interpolacja LINIOWA, nie Bezier. Klip i tak jedzie do glTF przez
    # `export_force_sampling`, czyli w grze między kluczami jest prosta.
    # Bezier w Blenderze pokazywałby co innego niż widzi gracz — a najdroższy
    # błąd tego projektu to ocenianie czegoś innego niż to, co idzie na ekran.
    # (Zmierzone na starym cyklu: Bezier zjeżdżał palcami 0,35 j. pod podłogę
    # w podglądzie, czego w grze nie było wcale.)
    for layer in akcja.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "LINEAR"
                    fc.update()

    scn.frame_start, scn.frame_end = 0, BEZRUCH
    scn.frame_set(BEZRUCH)
    bpy.context.view_layer.update()

    if report:
        print(f"[chod] akcja '{NAZWA}': 0-{KONTAKT_B} cykl, {PRZENIESIENIE_B} "
              f"przeniesienie B, {DOMKNIECIE} domknięcie, {BEZRUCH} bezruch; "
              f"półkrok {chod['polkrok']:.2f} · uniesienie {chod['uniesienie']:.2f} · "
              f"bujanie {chod['bujanie']:.2f}")
        print(f"  {'kl':>3} {'noga':>5} {'zasięg':>8} {'kolano':>8} "
              f"{'kostka Z':>9} {'kostka Y':>9} {'błąd IK':>8} {'grunt':>7}")
        for f, s, u, kat, z, y, e, g in wiersze:
            flaga = ("  <-- NIE TRAFIA" if e > BLAD_IK
                     else "  <-- W GRUNCIE" if g < -ZANURZENIE else "")
            print(f"  {f:3} {s:>5} {u * 100:7.1f}% {kat:7.1f}° {z:9.3f} {y:9.3f} "
                  f"{e:8.4f} {g:+7.3f}{flaga}")
    return wiersze


def sprawdz(wiersze, chod=None, report=True):
    """Asercje cyklu. Zwraca listę błędów (pusta = w normie).

    ⚠ Każda z nich potrafi zaświecić na czerwono — sprawdzone przez celowe
    rozjechanie parametrów: `polkrok` 2,6 wywala błąd IK i przeprost,
    `uniesienie` 0,0 wywala warunek oderwania stopy, `bujanie` 0,0 wywala
    błąd IK i przeprost, a przestawienie `_plan_stopy` o pół cyklu wywala
    symetrię i domknięcie pętli.
    """
    chod = dict(CHOD, **(chod or {}))
    bledy = []
    for f, s, u, kat, _z, _y, e, g in wiersze:
        if e > BLAD_IK:
            bledy.append(f"klatka {f} noga {s}: stopa {e:.3f} j. od zamówionego "
                         f"punktu (zasięg {u * 100:.1f}%) — IK nie nadąża")
        if kat > KOLANO_PROSTE:
            bledy.append(f"klatka {f} noga {s}: kolano {kat:.1f}° — przeprost")
    for f, _s, _u, _k, _z, _y, _e, g in wiersze[::2]:
        if g < -ZANURZENIE:
            bledy.append(f"klatka {f}: postać {-g:.3f} j. pod podłogą pozy "
                         f"stojącej — stopa wbija się w grunt")

    d = {(f, s): (z, y) for f, s, _u, _k, z, y, _e, _g in wiersze}
    # Symetria: kontakt B to kontakt A z zamienionymi nogami.
    for s, s2 in (("L", "R"), ("R", "L")):
        za, ya = d[(KONTAKT_A, s)]
        zb, yb = d[(KONTAKT_B, s2)]
        if abs(za - zb) > 1e-4 or abs(ya - yb) > 1e-4:
            bledy.append(f"kontakt niesymetryczny: {s}@{KONTAKT_A} "
                         f"({ya:.3f},{za:.3f}) vs {s2}@{KONTAKT_B} ({yb:.3f},{zb:.3f})")
    # Pętla domknięta: klatka 4 == klatka 0.
    for s in ("L", "R"):
        if any(abs(a - b) > 1e-4 for a, b in zip(d[(KONTAKT_A, s)], d[(DOMKNIECIE, s)])):
            bledy.append(f"pętla nie domyka się na nodze {s}")
    # Oderwanie: w każdym przeniesieniu DOKŁADNIE jedna stopa jest w górze.
    for f in (PRZENIESIENIE_A, PRZENIESIENIE_B):
        zl, zr = d[(f, "L")][0], d[(f, "R")][0]
        if abs(zl - zr) < MIN_ODERWANIE:
            bledy.append(f"klatka {f}: stopy na tej samej wysokości "
                         f"({zl:.3f} / {zr:.3f}) — brak oderwania")
    # Bezruch: obie stopy razem i na tej samej wysokości.
    if any(abs(a - b) > 1e-4 for a, b in zip(d[(BEZRUCH, "L")], d[(BEZRUCH, "R")])):
        bledy.append(f"bezruch: stopy nierówno {d[(BEZRUCH, 'L')]} vs {d[(BEZRUCH, 'R')]}")

    if report:
        if bledy:
            print(f"[chod] BŁĄD — {len(bledy)} naruszeń:")
            for b in bledy:
                print("   ⛔", b)
        else:
            print("[chod] asercje: OK (zasięg, przeprost, symetria, pętla, "
                  "oderwanie, bezruch)")
    return bledy

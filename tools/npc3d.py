"""GENERATOR NPC 3D — mieszkaniec jako PRESET bazy postaci (2026-10-09, pilot: Ojciec).

    blender -b public/assets/char.blend --python tools/npc3d.py -- <npc> [--zapisz] [--podglad KATALOG]

⭐ Kierunek: `docs/kreator_postaci.md` — NPC = zapisany preset tych samych osi,
które kiedyś dostanie kreator gracza: proporcje (sylwetka), kolory (skóra,
włosy, oczy), fryzura/zarost (`tools/char3d_hair.py`), strój z katalogu
przedmiotów (`char3d_armor.POKRYCIE`) w barwach mieszkańca, postawa w stania.

⛔ NIE zapisuje `char.blend` — wszystko dzieje się w pamięci sesji, wynik idzie
do osobnego `public/assets/characters/npc_<id>.glb`. Gracz (`char.glb`)
zostaje nietknięty.

Bez `--zapisz` to PRZYMIAR: raport + (z `--podglad`) rendery do oceny.
⭐ Oceniaj podgląd `gra_px` — wielkość postaci na S21 FE przy kamerze ×0,8
(`KAMERA_3D`), czyli ~13–14% wysokości ekranu.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Quaternion, Vector
from mathutils.bvhtree import BVHTree

TU = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TU)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import char3d_attack  # noqa: E402
import char3d_base as baza  # noqa: E402
import char3d_zones as strefy  # noqa: E402
import char3d_armor as pancerz  # noqa: E402
import char3d_walk as chod  # noqa: E402
import char3d_hair as wlosy  # noqa: E402
import char3d_odziez as odziez  # noqa: E402
import char3d_variants as warianty  # noqa: E402
import char3d_face as twarz  # noqa: E402

ROOT = os.path.dirname(TU)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

# ── PRESETY MIESZKAŃCÓW ──────────────────────────────────────────────────────
# Kolory w sRGB 0–255. `stroj`: id przedmiotu z gry → barwa (None = z ikony).
# ⭐ Wysokości stroju (`stroj_dol`, `suknia.dol`, `spodnica.gora`/`dol`, góra
# i dół fartucha) to ułamek wzrostu ALBO para (kotwica, delta) — np.
# ("biodro", -0.005) = pół setnej pod biodrem. Para jedzie z sylwetką: kobieta,
# starzec i nowa baza dostają brzeg w tym samym miejscu ciała.
# `postawa`: stopnie — `garb` pochyla piersiowy odcinek do przodu, `glowa`
# kontruje wzrok, `oddech` to amplituda klatki w animacji stania.
# ── budowa presetu mieszkańca z osi wariantów ────────────────────────────────
JAKOSC = dict(napuchniecie=0.55, brzegi=True, ao=True, fasety=True, kat_faset=34.0)


def _FILC(kolor):
    """Nakrycie z katalogu (kapelusz, czapka) jako FILC, nie metal."""
    return dict(kolor=kolor, metal=False, wzor="len")


def _LEN(kolor):
    """Część stroju z katalogu jako płótno (chusta z `cloth_coif`, pelerynka)."""
    return dict(kolor=kolor, metal=False, wzor="len")


def _SUKNIA(kolor, spodnica=None, fartuch=None):
    """Góra sukni + spódnica (+ fartuch) — kotwice jak u Mamy.

    ⚠ Dół góry sukni schodzi POD górny brzeg spódnicy (review 2026-10-10):
    nad nim jego postrzępiony brzeg (cięcie po wysokości ścian) był na widoku
    i w szczelinach prześwitywała koszula — dziury u Agaty."""
    sp = dict(kolor=spodnica or kolor, gora=("biodro", +0.012))
    if fartuch:
        sp["fartuch"] = (fartuch, 0.58, ("biodro", +0.004), ("kolano", -0.122))
    return dict(stroj_dol={"linen_shirt": ("talia", -0.035)},
                suknia=dict(kolor=kolor, dol=("biodro", -0.012)), spodnica=sp)


def _mieszkaniec(opis, osie, skora, wlosy, stroj, oczy=(40, 30, 26), usta=None, skala=1.0,
                 dodatki=None, postawa_dod=None, **reszta):
    """Preset z OSI (`char3d_variants`): proporcje i postawa wyprowadzone,
    nigdy wpisane — poprawka bazy dociera do każdego mieszkańca."""
    plec, wiek, budowa = osie
    w = dict(wasy=False, brwi=True, zarost=None, opcje={})
    w.update(wlosy)
    w.setdefault("kolor_zarostu", w["kolor_wlosow"])
    return dict(opis=opis, osie=osie, skala=skala,
                proporcje=warianty.proporcje(plec, wiek, budowa, dodatki=dodatki, styl="czytelny"),
                jakosc=JAKOSC, skora=skora, oczy=oczy,
                # ⚠ usta jako przyciemniona SKÓRA czytały się u kobiet jak wąsik —
                #   ciepły, różowawy odcień skóry zamiast brązu
                usta=usta or (int(skora[0] * 0.80), int(skora[1] * 0.52), int(skora[2] * 0.50)),
                wlosy=w, stroj=stroj, postawa=warianty.postawa(wiek, postawa_dod), **reszta)


PRESETY = {
    "father": dict(
        opis="Marko, 54 — rolnik, były żołnierz, chore biodro (Dobrawa: „przy swoim biodrze”)",
        # ⭐ WARIANTY (2026-10-10): baza V4.5 + osie, nie ~30 kluczy wprost.
        #   Do V4.5 preset niósł własne proporcje i ZOSTAŁ na bazie V4, gdy baza
        #   się zmieniła. Osobniczo: szersze barki (zgłoszenie „wątły" obok gracza).
        # 188 cm / 90 kg (wzór: realna osoba, BMI 25,5) — średni z lekkim brzuchem,
        # ani klin, ani beczka
        proporcje=warianty.proporcje("m", "dorosly", "srednia", styl="czytelny",
                                     dodatki={"bark_polrozstaw": +0.007, "klatka_polszer": -0.006,
                                              "talia_polszer": +0.014, "talia_glebokosc": +0.014}),
        twarz=dict(portret="father_portrait.png", srodek_x=22.5, oczy_y=19.5, broda_y=31.0, pol_szer=8.0),
        jakosc=dict(napuchniecie=0.55, brzegi=True, ao=True, fasety=True, kat_faset=34.0),
        skora=(222, 150, 112),           # ogorzała od pola
        oczy=(36, 28, 26),
        usta=(132, 76, 66),
        wlosy=dict(fryzura="zaczesane", zarost="broda_krotka", wasy=True, brwi=True,
                   kolor_wlosow=(118, 113, 108), kolor_zarostu=(146, 141, 134),
                   opcje={"skronie": 0.07}),
        # z portretu 2D: brązowo-ceglasta koszula, granatowe spodnie, ciemne buty
        stroj={"linen_shirt": (124, 72, 50), "linen_trousers": (50, 50, 66), "low_boots": (62, 44, 34)},
        stroj_dol={"linen_shirt": ("biodro", -0.005)},   # koszula do bioder — nogi na całą długość
        postawa=dict(garb=6.0, glowa=-4.0, oddech=1.4),
    ),
    "mother": dict(
        opis="Alina, 49 — dom i obrządek; ta, która cię puszcza",
        # ⭐ DRUGI TYP CIAŁA: ten sam szkielet, inne kotwice siatki + `biust`.
        # 170 cm / 75–90 kg (wzór: realna osoba, BMI 26–31) — tęga: brzuch i biodra
        proporcje=warianty.proporcje("k", "dorosly", "tega", styl="czytelny"),
        twarz=dict(portret="mother_portrait.png", srodek_x=23.3, oczy_y=15.5, broda_y=25.0, pol_szer=9.0),
        jakosc=dict(napuchniecie=0.55, brzegi=True, ao=True, fasety=True, kat_faset=34.0),
        skora=(232, 166, 128),
        oczy=(40, 30, 26),
        usta=(150, 82, 72),
        wlosy=dict(fryzura="kok", zarost=None, wasy=False, brwi=True,
                   kolor_wlosow=(96, 62, 42), kolor_zarostu=(80, 52, 36), opcje={}),
        # z portretu 2D: ochrowa koszula z rękawami, ciemnobrązowa suknia do
        # kostek (góra bez rękawów + spódnica), lniany fartuch — gospodyni
        stroj={"linen_shirt": (170, 130, 86), "low_boots": (60, 42, 34)},
        stroj_dol={"linen_shirt": ("talia", -0.035)},          # koszula w spódnicy, nie spod niej
        suknia=dict(kolor=(98, 62, 44), dol=("biodro", -0.012)),  # zakładka POD spódnicę
        # góra spódnicy NA biodrze: wyżej obręcz (szerokość bioder) odstaje od
        # wąskiej talii i z kamery z góry widać ciemne wnętrze jako pas
        spodnica=dict(kolor=(98, 62, 44), gora=("biodro", +0.012),
                      fartuch=((198, 178, 140), 0.58, ("biodro", +0.004), ("kolano", -0.122))),
        postawa=dict(garb=2.0, glowa=-2.0, oddech=1.2),
    ),
    # ── MIESZKAŃCY (2026-10-10) — osie `char3d_variants` + barwy z portretów 2D ──
    # Bogusz i Adrian na końcu (decyzja autora: po nich wiadomo, czego jeszcze
    # brakuje do odróżnienia mieszkańców i do kreatora).
    "elder": _mieszkaniec(
        "Dobiesław, sołtys — sam orze pole; biała broda, kamizelka",
        ("m", "stary", "krepa"), skora=(226, 168, 136),
        twarz=dict(portret="elder_portrait.png", srodek_x=22.5, oczy_y=15.5, broda_y=26.0, pol_szer=8.0, zarost_bryla=True),
        wlosy=dict(fryzura="zaczesane", zarost="broda_dluga", wasy=True,
                   kolor_wlosow=(226, 222, 214), opcje={"skronie": 0.06}),
        stroj={"linen_shirt": (176, 150, 110), "leather_chest": (92, 62, 42),
               "linen_trousers": (44, 40, 46), "low_boots": (50, 40, 36)}),
    "peasant": _mieszkaniec(
        "Dobek, rolnik — największe pole; kapelusz z rondem",
        ("m", "dorosly", "krepa"), skora=(214, 146, 106),
        twarz=dict(portret="peasant_portrait.png", srodek_x=24.5, oczy_y=15.5, broda_y=26.0, pol_szer=7.5),
        wlosy=dict(fryzura="wieniec", kolor_wlosow=(70, 48, 34), opcje={"czolo": 0.7},
                   nakrycie="slomkowy", kolor_nakrycia=(206, 170, 98)),
        stroj={"linen_shirt": (120, 72, 46),
               "linen_trousers": (56, 58, 70), "low_boots": (70, 48, 36)}),
    "miller": _mieszkaniec(
        "Miłosz, młynarz — serce ekonomii; czapka, płócienny fartuch",
        ("m", "dorosly", "tega"), skora=(222, 160, 120),
        twarz=dict(portret="miller_portrait.png", srodek_x=23.0, oczy_y=15.5, broda_y=30.0, pol_szer=7.0),
        wlosy=dict(fryzura="wieniec", kolor_wlosow=(52, 38, 30), opcje={"czolo": 0.7}),
        stroj={"padded_cap": _FILC((132, 96, 64)), "linen_shirt": (124, 82, 54),
               "linen_trousers": (52, 54, 64), "low_boots": (68, 46, 36)},
        fartuch=dict(kolor=(196, 176, 128), gora=("klatka", -0.01), dol=("kolano", +0.02))),
    "herbalist": _mieszkaniec(
        "Dorota, zielarka — starsza wdowa; zielona chusta",
        ("k", "stary", "tega"), skora=(230, 172, 140),
        twarz=dict(portret="herbalist_portrait.png", srodek_x=22.5, oczy_y=17.5, broda_y=29.0, pol_szer=7.5),
        wlosy=dict(fryzura=None, kolor_wlosow=(150, 146, 140), nakrycie="chusta", kolor_nakrycia=(104, 146, 84)),
        stroj={"linen_shirt": (156, 126, 90), "low_boots": (58, 44, 36)},
        **_SUKNIA((112, 78, 52), fartuch=(192, 172, 130))),
    "widow": _mieszkaniec(
        "Zofia, wdowa — wysoka, łatana suknia, jasna chusta",
        ("k", "dorosly", "szczupla"), skora=(226, 164, 128), skala=1.04,
        twarz=dict(portret="zofia_portrait.png", srodek_x=25.0, oczy_y=18.5, broda_y=31.0, pol_szer=8.5),
        wlosy=dict(fryzura=None, kolor_wlosow=(110, 74, 48), nakrycie="chusta_wiazana", kolor_nakrycia=(196, 168, 118)),
        stroj={"linen_shirt": (186, 156, 112), "low_boots": (56, 44, 38)},
        **_SUKNIA((124, 88, 58))),
    "hanna": _mieszkaniec(
        "Hanna (38), żona Dobka — liczy sery; ruda suknia, fartuch",
        ("k", "dorosly", "tega"), skora=(232, 170, 136),
        twarz=dict(portret="hanna_portrait.png", srodek_x=23.0, oczy_y=15.5, broda_y=26.0, pol_szer=8.0),
        wlosy=dict(fryzura=None, kolor_wlosow=(120, 80, 50), nakrycie="chusta_wiazana", kolor_nakrycia=(168, 138, 98)),
        stroj={"linen_shirt": (190, 94, 58), "low_boots": (62, 46, 38)},
        **_SUKNIA((190, 94, 58), fartuch=(198, 176, 132))),
    "witek": _mieszkaniec(
        "Witek — biedniejszy gospodarz, oddał syna na parobka",
        ("m", "dorosly", "szczupla"), skora=(214, 150, 112),
        twarz=dict(portret="witek_portrait.png", srodek_x=24.5, oczy_y=15.5, broda_y=26.0, pol_szer=7.0),
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(58, 42, 32), opcje={"objetosc": 0.8}),
        stroj={"linen_shirt": (92, 102, 124), "linen_trousers": (60, 62, 72), "low_boots": (62, 46, 36)}),
    "kuba": _mieszkaniec(
        "Kuba — starzec przy studni; filcowy kapelusz, długa broda",
        ("m", "stary", "srednia"), skora=(222, 164, 134),
        twarz=dict(portret="kuba_portrait.png", srodek_x=22.5, oczy_y=16.5, broda_y=26.0, pol_szer=7.0, zarost_bryla=True),
        wlosy=dict(fryzura="wieniec", zarost="broda_dluga", wasy=True,
                   kolor_wlosow=(228, 226, 220), opcje={"czolo": 0.7, "dlugosc": 0.5},
                   nakrycie="filcowy", kolor_nakrycia=(112, 118, 130)),
        stroj={"linen_shirt": (104, 84, 68),
               "linen_trousers": (118, 92, 62), "low_boots": (110, 112, 118)},
        stroj_dol={"linen_shirt": ("krocze", -0.03)}),
    "sulislaw": _mieszkaniec(
        "Sulisław — najstarszy we wsi, połowa wzroku; łysy",
        ("m", "stary", "szczupla"), skora=(226, 170, 140),
        twarz=dict(portret="sulislaw_portrait.png", srodek_x=21.5, oczy_y=15.0, broda_y=28.0, pol_szer=7.5),
        wlosy=dict(fryzura="wieniec", kolor_wlosow=(214, 210, 204), opcje={"wieniec": 0.62}),
        stroj={"linen_shirt": (150, 108, 70), "linen_trousers": (128, 94, 62), "low_boots": (90, 66, 46)},
        stroj_dol={"linen_shirt": ("krocze", -0.03)}, postawa_dod=dict(garb=3.0, glowa=-2.0)),
    "agata": _mieszkaniec(
        "Agata (43), kowalowa — rachunki kuźni; ciemny kaptur",
        ("k", "dorosly", "krepa"), skora=(230, 168, 132),
        twarz=dict(portret="agata_portrait.png", srodek_x=23.0, oczy_y=15.5, broda_y=25.0, pol_szer=8.0),
        wlosy=dict(fryzura=None, kolor_wlosow=(90, 60, 40), nakrycie="kaptur", kolor_nakrycia=(78, 78, 88)),
        stroj={"linen_shirt": (176, 150, 108), "low_boots": (54, 44, 40)},
        **_SUKNIA((64, 66, 74), spodnica=(176, 150, 108), fartuch=(64, 66, 74))),
    "dobrawa": _mieszkaniec(
        "Dobrawa — córka sołtysa; zielona suknia, warkocz",
        ("k", "mlody", "szczupla"), skora=(236, 180, 146),
        twarz=dict(portret="dobrawa_portrait.png", srodek_x=18.0, oczy_y=13.5, broda_y=24.0, pol_szer=8.0),
        wlosy=dict(fryzura="warkocz", kolor_wlosow=(104, 66, 42)),
        stroj={"linen_shirt": (104, 152, 84), "low_boots": (80, 56, 40)},
        **_SUKNIA((104, 152, 84))),
    "sobek": _mieszkaniec(
        "Sobek, stolarz — skórzany fartuch",
        ("m", "dorosly", "krepa"), skora=(218, 152, 112),
        twarz=dict(portret="sobek_portrait.png", srodek_x=24.5, oczy_y=15.5, broda_y=27.0, pol_szer=8.0),
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(88, 60, 40), opcje={"objetosc": 0.85}),
        stroj={"linen_shirt": (150, 132, 96), "linen_trousers": (52, 54, 66), "low_boots": (84, 58, 40)},
        fartuch=dict(kolor=(104, 66, 42), gora=("klatka", +0.02), dol=("kolano", +0.03))),
    "gniewko": _mieszkaniec(
        "Gniewko, pasterz — młody; jasna pelerynka na ramionach",
        ("m", "mlody", "szczupla"), skora=(222, 160, 118),
        twarz=dict(portret="gniewko_portrait.png", srodek_x=22.5, oczy_y=15.5, broda_y=28.0, pol_szer=7.5),
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(96, 66, 44), opcje={"objetosc": 1.35, "skronie": 0.0}),
        stroj={"linen_shirt": (112, 80, 54),
               "linen_trousers": (178, 156, 116), "low_boots": (52, 48, 52)},
        pelerynka=dict(kolor=(232, 222, 172))),
    "anna": _mieszkaniec(
        "Anna — wysoka, długie jasne włosy",
        ("k", "mlody", "srednia"), skora=(238, 188, 156), skala=1.04, oczy=(70, 112, 150),
        twarz=dict(portret="anna_portrait.png", srodek_x=25.5, oczy_y=19.5, broda_y=32.0, pol_szer=9.0),
        wlosy=dict(fryzura="dlugie", kolor_wlosow=(222, 182, 104)),
        stroj={"linen_shirt": (124, 86, 56), "low_boots": (70, 50, 38)},
        **_SUKNIA((112, 74, 48), fartuch=(198, 172, 124))),
    "patryczek": _mieszkaniec(
        "Patryczek — 180 cm / 80 kg, trenuje MMA (wzór: realna osoba); ręka po bójce",
        ("m", "dorosly", "atletyczna"), skora=(222, 158, 118),
        twarz=dict(portret="patryczek_portrait.png", srodek_x=25.0, oczy_y=16.5, broda_y=28.0, pol_szer=8.0),
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(60, 44, 34), opcje={"objetosc": 0.7}),
        stroj={"linen_shirt": (120, 90, 60), "linen_trousers": (44, 44, 54), "low_boots": (60, 60, 66)}),
    "hunter": _mieszkaniec(
        "Wszebor, Myśliwy — mentor; skórzana kamizelka",
        ("m", "dorosly", "krepa"), skora=(214, 150, 112),
        twarz=dict(portret="hunter_portrait.png", srodek_x=22.5, oczy_y=15.5, broda_y=27.0, pol_szer=7.5),
        wlosy=dict(fryzura="zaczesane", zarost="broda_krotka", kolor_wlosow=(128, 118, 104),
                   opcje={"objetosc": 0.75, "skronie": 0.05}),
        stroj={"linen_shirt": (130, 124, 112), "leather_chest": (98, 66, 44),
               "linen_trousers": (46, 46, 54), "low_boots": (70, 52, 40)}),
    "adrian": _mieszkaniec(
        "Adrian — czeladnik kowala; 183 cm / 112 kg, pracuje w fabryce wyrobów metalowych (wzór: realna osoba)",
        ("m", "dorosly", "tega"), skora=(222, 160, 122), skala=0.989,
        twarz=dict(portret="adrian_portrait.png", srodek_x=50.5, oczy_y=15.5, broda_y=25.0, pol_szer=7.5),
        # BMI 33,4 → tęga; praca fizyczna → trochę klatki i ramion
        dodatki={"klatka_polszer": +0.006, "ramie_promien": +0.004},
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(52, 40, 32), opcje={"objetosc": 0.7, "skronie": 0.02}),
        stroj={"linen_shirt": (128, 88, 58), "linen_trousers": (98, 98, 70), "leather_boots": (108, 72, 46)},
        # ciemna skóra fartucha — przy (84, 58, 42) zlewał się z brązową koszulą
        fartuch=dict(kolor=(72, 52, 40), gora=("klatka", +0.025), dol=("kolano", +0.03)),
        pas_narzedzia=dict(kolor=(84, 60, 42))),
    "innkeeper": _mieszkaniec(
        "Bogusz, karczmarz — wydatny brzuch; biały len, sukmana, szeroki pas, haftowana czapka (referencja autora: strój ludowy)",
        ("m", "dorosly", "tega"), skora=(240, 166, 128),
        twarz=dict(portret="innkeeper_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0),
        # karczmarz: brzuch MOCNIEJ niż sama budowa tęga
        dodatki={"talia_glebokosc": +0.03, "talia_polszer": +0.012, "biodro_glebokosc": +0.01},
        wlosy=dict(fryzura=None, kolor_wlosow=(104, 72, 50), nakrycie="czapka_haft", kolor_nakrycia=(200, 112, 64)),
        # sukmana = przeszywanica do pół uda przemalowana na len; koszula pod nią
        stroj={"linen_shirt": (232, 224, 206), "gambeson": _LEN((224, 216, 198)),
               "linen_trousers": (214, 206, 188), "leather_boots": (36, 34, 34)},
        # poły sukmany od pasa do kolan — bez nich obcisła przeszywanica i spodnie
        # w tym samym kolorze czytały się jak biały kombinezon
        # ⚠ Kaftan kończy się W TALII (najszerszy pierścień brzucha), pod pasem;
        #   cięty niżej (talia −0,035, na spodzie brzucha) miał brzeg odstający
        #   poziomo jak talerz, a pas leżał na tym brzegu z dala od ciała
        #   (review 2026-10-10). Poły zaczynają się pod pasem z obwodem brzucha.
        spodnica=dict(kolor=(224, 216, 198), gora=("talia", -0.008), dol=("kolano", +0.02), poszerzenie=1.22,
                      na_brzuchu=True),
        stroj_dol={"gambeson": ("talia", 0.0), "linen_shirt": ("talia", 0.0)},
        pas_narzedzia=dict(kolor=(132, 86, 52), narzedzia=False, szer=0.045, wys=("talia", -0.01), odsun=0.04)),
    # ── DRWALE (K5, 2026-10-10; autor: „ojciec z synami") — twarze pixel-art z
    #   `tools/build_player_face.py` (portretów 2D nie ma). Rodzinę czyta się ze
    #   SKÓRZANEJ KAMIZELKI ojca i pasa z narzędziami u obu starszych, wiek z osi.
    "ciechan": _mieszkaniec(
        "Ciechan, drwal — ojciec Bolka i Zbycha; ~55, małomówny, krzyż jak stary pień",
        ("m", "stary", "krepa"), skora=(214, 146, 108),
        twarz=dict(portret="ciechan_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0),
        wlosy=dict(fryzura="zaczesane", zarost="broda_krotka", wasy=True, kolor_wlosow=(150, 140, 128),
                   opcje={"objetosc": 0.7, "skronie": 0.05}),
        stroj={"linen_shirt": (118, 96, 70), "leather_chest": (78, 56, 40),
               "linen_trousers": (64, 58, 50), "leather_boots": (60, 44, 34)},
        pas_narzedzia=dict(kolor=(74, 54, 38))),
    "bolko": _mieszkaniec(
        "Bolko, drwal — starszy syn Ciechana; ~28, robi za dwóch, chce przejąć wyrąb",
        ("m", "dorosly", "atletyczna"), skora=(222, 156, 116), skala=1.01,
        twarz=dict(portret="bolko_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0),
        wlosy=dict(fryzura="zaczesane", zarost="broda_krotka", kolor_wlosow=(92, 62, 40),
                   opcje={"objetosc": 0.75}),
        stroj={"linen_shirt": (138, 70, 48), "linen_trousers": (70, 66, 58), "low_boots": (72, 52, 38)},
        pas_narzedzia=dict(kolor=(84, 60, 42))),
    "zbych": _mieszkaniec(
        "Zbych, drwal — młodszy syn Ciechana; ~19, ciągnie go do miasta",
        ("m", "mlody", "szczupla"), skora=(238, 172, 132), skala=0.99,
        twarz=dict(portret="zbych_face.png", srodek_x=12.0, oczy_y=13.5, broda_y=25.0, pol_szer=8.0),
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(168, 128, 76), opcje={"objetosc": 1.2, "skronie": 0.0}),
        stroj={"linen_shirt": (196, 184, 150), "linen_trousers": (84, 92, 70), "low_boots": (90, 66, 46)}),
    "blacksmith": _mieszkaniec(
        "Radzim, Kowal — niski i szeroki; skórzany fartuch",
        ("m", "dorosly", "krepa"), skora=(214, 146, 106), skala=0.95,
        wlosy=dict(fryzura="zaczesane", kolor_wlosow=(88, 58, 40), brwi=False,
                   opcje={"objetosc": 0.8}),
        twarz=dict(portret="kowal_portrait.png", srodek_x=18.0, oczy_y=8.5, broda_y=19.5, pol_szer=7.5),
        stroj={"linen_shirt": (138, 138, 132), "linen_trousers": (58, 78, 62), "low_boots": (60, 48, 40)},
        fartuch=dict(kolor=(96, 60, 40), gora=("klatka", +0.02), dol=("kolano", +0.02))),

    # ── WROGOWIE-HUMANOIDZI (2026-10-11, `docs/bandyci_plan.md`, `OI-171`) ──
    # Ten sam preset co mieszkaniec + `wrog`: broń w dłoni i klipy walki
    # (`zbuduj_klipy_wroga`), plik `enemy_<id>.glb`. Bez portretu — twarz
    # z samych stref, bo z kamery gry zbója czyta się po sylwetce i sprzęcie.
    # ⚠ Strój = przedmioty z gry, które zbój potem ZOSTAWIA (herszt nosi
    #   spangenhelm, który z niego wypada) — wygląd zapowiada łup.
    "bandit_club": _mieszkaniec(
        "Zbój z pałką — kaptur, skórzany kaftan, onuce",
        ("m", "dorosly", "krepa"), skora=(204, 142, 104),
        wlosy=dict(fryzura="zaczesane", zarost="broda_krotka", kolor_wlosow=(62, 46, 34),
                   nakrycie="kaptur", kolor_nakrycia=(84, 74, 54)),
        stroj={"linen_shirt": (104, 92, 68), "leather_chest": (96, 64, 42),
               "linen_trousers": (70, 62, 48), "foot_wraps": (118, 102, 78)},
        wrog=dict(bron="club")),
    "bandit_axe": _mieszkaniec(
        "Zbój z toporem — młody, przeszywanica, czapka",
        ("m", "mlody", "szczupla"), skora=(214, 150, 112),
        wlosy=dict(fryzura="dlugie", kolor_wlosow=(110, 80, 52), opcje={"objetosc": 0.9}),
        stroj={"gambeson": (132, 114, 82), "leather_legs": (78, 60, 44),
               "low_boots": (66, 50, 38), "padded_cap": (120, 104, 76)},
        wrog=dict(bron="axe")),
    "bandit_chief": _mieszkaniec(
        "Herszt — kolczuga, spangenhelm, miecz; wyższy i barczysty",
        ("m", "dorosly", "atletyczna"), skora=(198, 136, 100), skala=1.05,
        wlosy=dict(fryzura="zaczesane", zarost="broda_dluga", kolor_wlosow=(52, 40, 32)),
        stroj={"short_hauberk": None, "leather_legs": (64, 50, 38), "leather_boots": (58, 42, 32),
               "leather_gloves": (70, 52, 38), "spangenhelm": None},
        wrog=dict(bron="sword")),
}

FPS_IDLE = 3.2      # długość cyklu stania (s)


def _lin(c):
    return strefy._lin(c)


def _wys(P, v):
    """Wysokość stroju: ułamek wzrostu albo (kotwica, delta) względem `P`."""
    return P[v[0]] + v[1] if isinstance(v, tuple) else v


def _ukryj_cialo_pod_ubraniem(ubior):
    """Usuwa wielokąty CIAŁA przykryte przez strój z katalogu (2026-10-10).

    ⚠ Noga to dwie rury (udo, goleń) zachodzące na siebie na kolanie; spodnie
    jako kopia ciała odsunięta o grubość warstwy mają przy końcach rur
    szczeliny, przez które świeciła SKÓRA — pozioma szpara pod kolanami Ojca
    (zrzut z gry, zbliżenie 4×). Mieszkaniec ma STAŁY strój, więc skóry pod
    ubraniem nie potrzebuje: znika prześwit, obrys warstwy pod spodem
    i wielokąty do rysowania. ⛔ Nie u gracza — jego ekwipunek się zmienia.
    Pokrycie rozpoznajemy po środku wielokąta: sztuka katalogu to kopia
    fragmentu ciała, więc jej ściany mają te same środki co ściany skóry."""
    cialo = bpy.data.objects["Cube.001"]

    def klucz(v):
        return (round(v.x, 4), round(v.y, 4), round(v.z, 4))

    def wytnij(ob, pokryte):
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        usun = [f for f in bm.faces if klucz(f.calc_center_median()) in pokryte]
        bmesh.ops.delete(bm, geom=usun, context="FACES")
        bm.to_mesh(ob.data)
        bm.free()
        return len(usun)
    warstwy = []
    for ob in ubior:
        if not ob.name.startswith(pancerz.PRZEDROSTEK) or ob.parent_type == "BONE":
            continue                      # nakrycia głowy wiszą na kości, nie na ciele
        naz = ob.name[len(pancerz.PRZEDROSTEK):]
        napuch = pancerz.WARIANTY.get(naz, {}).get("napuchniecie", 0.0)
        warstwy.append((napuch, ob, {klucz(p.center) for p in ob.data.polygons}))
    pokryte = set().union(*(k for _n, _o, k in warstwy)) if warstwy else set()
    n = wytnij(cialo, pokryte)
    print(f"[strój] skóra pod ubraniem: usunięto {n} wielokątów ciała")
    # ⭐ to samo dla WARSTW STROJU: wewnętrzna pod zewnętrzną znika (koszula pod
    #   suknią — zostają rękawy). Bez tego dół koszuli przebijał suknię w talii.
    warstwy.sort(key=lambda w: w[0])
    for i, (napuch, ob, _k) in enumerate(warstwy):
        nad = set().union(*(k for n2, _o, k in warstwy[i + 1:] if n2 > napuch + 1e-6)) if i + 1 < len(warstwy) else set()
        if nad:
            m = wytnij(ob, nad)
            if m:
                print(f"[strój] {ob.name}: usunięto {m} wielokątów pod warstwą zewnętrzną")


def _ukryj_nogi_pod_spodnica(ubior, gora, dol):
    """Usuwa ściany NÓG i BIODER (ciało + powłoki stroju) zasłonięte spódnicą.

    ⚠ Review 2026-10-10 (Agata): w pozie stania uda rozchodzą się na boki
    i boczne ściany bioder (wagi ud) wychodziły PRZEZ spódnicę jako ciemne
    i cieliste ząbki nad dłońmi. Spódnica mieszkanki jest stała, więc nogi pod
    nią są zbędne. Zostaje pas tuż pod górnym brzegiem (żadnej szpary w talii)
    i to, co widać spod dołu (kostki, buty)."""
    H, Z0 = baza.WYSOKOSC, baza.PODLOGA
    z_gora, z_dol = Z0 + H * (gora - 0.01), Z0 + H * (dol + 0.02)
    nogi = pancerz.BIODRA | pancerz.UDA | pancerz.LYDKI
    obiekty = [bpy.data.objects["Cube.001"]] + [o for o in ubior if o.name.startswith(pancerz.PRZEDROSTEK)
                                                and o.parent_type != "BONE"]
    for ob in obiekty:
        gname = {g.index: g.name for g in ob.vertex_groups}
        mw = ob.matrix_world
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        dw = bm.verts.layers.deform.verify()
        usun = []
        for f in bm.faces:
            z = (mw @ f.calc_center_median()).z
            if not (z_dol < z < z_gora):
                continue
            acc = {}
            for v in f.verts:
                for gi, w in v[dw].items():
                    acc[gname.get(gi)] = acc.get(gname.get(gi), 0.0) + w
            if acc and max(acc, key=acc.get) in nogi:
                usun.append(f)
        bmesh.ops.delete(bm, geom=usun, context="FACES")
        bm.to_mesh(ob.data)
        bm.free()
        if usun:
            print(f"[strój] {ob.name}: usunięto {len(usun)} wielokątów nóg pod spódnicą")


def _skora_z_portretu(tw):
    """Kolor skóry modelu = kolor skóry PORTRETU (mediana pikseli policzków).

    ⚠ Review 2026-10-10: twarz z portretu odcinała się od reszty głowy
    PROSTOKĄTEM (Sulisław, zielarka), bo skóra portretu miała inny odcień niż
    skóra z presetu. Ten sam kolor po obu stronach szwu = szwu nie widać.
    Policzki: wiersze tuż pod oczami, kolumny w połowie odległości od osi
    twarzy do brzegu — tam nie ma oczu, nosa, ust ani konturu."""
    img = bpy.data.images.load(os.path.join(ROOT, "public", "assets", "characters", tw["portret"]),
                               check_existing=True)
    W, Hh = img.size
    px = list(img.pixels)
    probki = []
    for wiersz in range(int(tw["oczy_y"]) + 1, int(tw["oczy_y"]) + 4):
        for d in (0.35, 0.5, 0.65, 0.8):
            for znak in (-1, 1):
                kol = int(tw["srodek_x"] + znak * d * tw["pol_szer"])
                y = Hh - 1 - wiersz                       # pixels Blendera: wiersz 0 = DÓŁ
                if not (0 <= kol < W and 0 <= y < Hh):
                    continue
                j = (y * W + kol) * 4
                r, g, b, a = px[j:j + 4]
                if a > 0.9 and 0.30 < (r + g + b) / 3 < 0.97 and r > g > b and r - b > 0.08:
                    probki.append((r, g, b))
    if len(probki) < 4:
        return None
    med = [sorted(p[i] for p in probki)[len(probki) // 2] for i in range(3)]
    return tuple(int(round(c * 255)) for c in med)


def zastosuj_preset(pr):
    arm = bpy.data.objects["Armature"]
    char3d_attack.zdejmij_obrot_turntable(arm)
    P = baza.zbuduj(pr.get("proporcje"), report=False)
    pr["_P"] = P
    pancerz.ustaw_glowe(P)        # nakrycia głowy liczone z TEJ głowy, nie z bazy
    skora = _skora_z_portretu(pr["twarz"]) if pr.get("twarz") else None
    if skora:
        print(f"[twarz] skóra z portretu: {skora} (preset: {pr['skora']})")
    for zona, kol in (("skin", skora or pr["skora"]), ("eyes", pr["oczy"]), ("mouth", pr["usta"]),
                      ("hair", pr["wlosy"]["kolor_wlosow"])):
        strefy.PAL[zona] = (_lin(kol[0]), _lin(kol[1]), _lin(kol[2]), 1.0)
    strefy.apply_zones(report=False)
    ubior = []
    for item, kol in pr["stroj"].items():
        if item not in pancerz.WARIANTY:
            raise SystemExit(f"BŁĄD: przedmiot stroju „{item}” nie ma modelu (char3d_armor.POKRYCIE)")
        # wartość: barwa sRGB albo słownik nadpisań wariantu — `kolor`, `wzor`,
        # `metal` (kapelusz z FILCU to `kettle_hat` z metal=False, wzor="len")
        if isinstance(kol, dict):
            nad = dict(kol)
            if "kolor" in nad:
                nad["kolor"] = tuple(nad["kolor"])
            pancerz.WARIANTY[item].update(nad)
        elif kol:
            pancerz.WARIANTY[item]["kolor"] = tuple(kol)
        # ⭐ TEST A: strój jako kopia ciała „napompowana" robiła ludzika
        #   Michelin — cieńsza warstwa przylega do sylwetki.
        # dół sztuki nadpisany w presecie (koszula schowana pod spódnicą)
        if pr.get("suknia") and item == "linen_shirt":
            pancerz.WARIANTY[item]["pas"] = None      # rzemień pod suknią przebijał ją
        if item in pr.get("stroj_dol", {}):
            w = pancerz.WARIANTY[item]
            w["dol"] = _wys(P, pr["stroj_dol"][item])
            # rzemień koszuli (`pas`) nie może wisieć pod jej brzegiem
            if w.get("pas") is not None and w["pas"] < w["dol"] + 0.01:
                w["pas"] = w["dol"] + 0.015
        jk = pr.get("jakosc", {})
        if "napuchniecie" in jk:
            pancerz.WARIANTY[item]["napuchniecie"] *= jk["napuchniecie"]
        ob = pancerz.zbuduj_pancerz(item)
        ob.hide_render = ob.hide_viewport = False
        ubior.append(ob)
    if pr.get("suknia"):
        # Góra sukni bez rękawów: krój KAMIZELKI z katalogu (powłoka korpusu),
        # we wzorze lnu i w kolorze sukni — nad koszulą (większe napuchnięcie).
        wz = dict(pancerz.WARIANTY["leather_chest"])
        wz.update(nazwa=pancerz.PRZEDROSTEK + "suknia", kolor=tuple(pr["suknia"]["kolor"]), wzor="len",
                  metal=False, dol=_wys(P, pr["suknia"].get("dol", 0.46)))
        pancerz.WARIANTY["suknia"] = wz
        ob = pancerz.zbuduj_pancerz("suknia")
        ob.hide_render = ob.hide_viewport = False
        ubior.append(ob)
    if pr.get("pelerynka"):
        # ⭐ Pelerynka jako POWŁOKA CIAŁA (2026-10-10): barki + góra tułowia +
        #   nasada ramion, cięte po wysokości — skinowana jak koszula, więc leży
        #   na barkach także w pozie stania. ⚠ Wersja z `char3d_hair` (pierścienie
        #   wokół szyi, sztywno na kości głowy) była z kamery gry płaską KRYZĄ:
        #   w bazie V5 barki sięgają podbródka, a T-poza spoczynku to nie poza gry.
        pe = pr["pelerynka"]
        wz = dict(pancerz.WARIANTY["leather_chest"])
        wz.update(nazwa=pancerz.PRZEDROSTEK + "pelerynka", kolor=tuple(pe["kolor"]), wzor="len",
                  metal=False, kosci=pancerz.TORS | pancerz.BARKI | pancerz.RAMIONA,
                  dol=_wys(P, pe.get("dol", ("bark", -0.075))), x_max=pe.get("x_max", 2.9),
                  napuchniecie=pe.get("napuchniecie", 0.16), pas=None)
        pancerz.WARIANTY["pelerynka"] = wz
        ob = pancerz.zbuduj_pancerz("pelerynka")
        ob.hide_render = ob.hide_viewport = False
        ubior.append(ob)
    if pr.get("spodnica"):
        sp = dict(pr["spodnica"])
        for k in ("gora", "dol"):
            if k in sp:
                sp[k] = _wys(P, sp[k])
        if sp.get("fartuch"):
            fk, kat, fg, fd = sp["fartuch"]
            sp["fartuch"] = (fk, kat, _wys(P, fg), _wys(P, fd))
        ubior.append(odziez.spodnica(P, **sp))
        _ukryj_nogi_pod_spodnica(ubior, sp.get("gora", 0.50), sp.get("dol", 0.055))
    _ukryj_cialo_pod_ubraniem(ubior)
    if pr.get("fartuch"):
        fa = dict(pr["fartuch"])
        for k in ("gora", "dol"):
            fa[k] = _wys(P, fa[k])
        # bez nakryć głowy (wiszą na kości): promień szelek wspinał się na czapkę
        oslona = [bpy.data.objects["Cube.001"]] + [o for o in ubior if o.name.startswith(pancerz.PRZEDROSTEK)
                                                   and o.parent_type != "BONE"]
        ubior.append(odziez.fartuch(P, oslona=oslona, **fa))
    if pr.get("pas_narzedzia"):
        os_pas = [bpy.data.objects["Cube.001"]] + [o for o in ubior if o.parent_type != "BONE"]
        ubior.append(odziez.pas_narzedzia(P, oslona=os_pas, **pr["pas_narzedzia"]))
    w = dict(pr["wlosy"])
    tw = pr.get("twarz")
    if tw:
        # brwi, wąsy i zarost niesie TEKSTURA portretu; bryłą zostaje tylko
        # długa broda (`zarost_bryla`) — czyta się z piersi, nie z twarzy
        w["brwi"] = False
        if not tw.get("zarost_bryla"):
            w["zarost"] = None
            w["wasy"] = False
    wl = wlosy.dodaj(P, fryzura=w.get("fryzura"), zarost=w.get("zarost"), wasy=w.get("wasy", False),
                     brwi=w.get("brwi", True), kolor_wlosow=w["kolor_wlosow"],
                     kolor_zarostu=w.get("kolor_zarostu"), opcje=w.get("opcje"),
                     nakrycie=w.get("nakrycie"), kolor_nakrycia=w.get("kolor_nakrycia", (120, 100, 80)),
                     opcje_nakrycia=w.get("opcje_nakrycia"))
    return P, ubior, wl


def zbuduj_stanie(pr, P):
    """Akcja `Idle`: poza bezruchu chodu + postawa mieszkańca + oddech.

    ⚠ Bazą jest klatka BEZRUCH akcji `Walk` (ręce wzdłuż ciała, stopy razem),
    nie poza spoczynkowa rigu — ta ostatnia to T-poza."""
    arm = bpy.data.objects["Armature"]
    scn = bpy.context.scene
    walk = bpy.data.actions["Walk"]
    arm.animation_data.action = walk
    scn.frame_set(chod.BEZRUCH)
    bpy.context.view_layer.update()
    # ⚠ Cele IK dłoni w `Walk` to STAŁE pozycje zmierzone dla szkieletu bazy
    #   (`char3d_walk._SUROWE`). Przy innych proporcjach (dłuższy tułów) dłonie
    #   wisiały na starej wysokości — ręce wyglądały na za krótkie. Liczymy je
    #   z bieżącego szkieletu: ręka opuszczona, lekko na zewnątrz i do przodu.
    # ⚠⚠ Dłoń wisi PRZY UDZIE, nie pionowo pod stawem barkowym: przy szerokich
    #   barkach pion spod barku leży daleko za biodrem i ręce sterczały na boki
    #   jak u manekina (zrzut autora 2026-10-09). Cel: bok biodra + grubość dłoni,
    #   lekko z przodu; łokieć ugina IK.
    mw = arm.matrix_world
    H = baza.WYSOKOSC
    # ⭐ POZA STANIA z presetu (2026-10-10, autor: „każdy wygląda tak samo") —
    #   pixel-artowi mieszkańcy różnią się UŁOŻENIEM RĄK (sołtys splata dłonie,
    #   Hanna trzyma je na biodrach). Cel IK dłoni liczony z kotwic sylwetki.
    poza = argv[argv.index("--poza") + 1] if "--poza" in argv else pr.get("poza", "wzdluz")
    y_osi = (mw @ arm.pose.bones["Bone"].head).y
    z0 = baza.PODLOGA
    for s, znak in (("L", 1.0), ("R", -1.0)):
        bark = mw @ arm.pose.bones[f"Bone.002_{s}.001"].head
        dl = sum(arm.data.bones[n].length for n in (f"Bone.002_{s}.001", f"Bone.002_{s}.002")) * arm.scale.x
        # ⭐ ŚWIATŁO między ręką a tułowiem (2026-10-10): dłoń 2,2% wzrostu od
        #   biodra, ręka prawie prosta (99%). Przyklejona do biodra i ugięta
        #   kończyła się NAD kroczem — z kamery z góry „pionek ze skutymi rękami".
        #   ⛔ Nie szerzej: ręce na boki to manekin (autor, 2026-10-09).
        x_dloni = znak * H * (max(P["biodro_polszer"], P["talia_polszer"]) + P["dlon_grubosc"] * 0.6 + 0.022)
        # 0,95: łokieć lekko ugięty — przy 0,99 ręka była prostą rurą; zasięg
        # dłoni pilnuje `rozpietosc` (dłuższe ręce), nie wyprostowanie
        dz = (dl ** 2 - (bark.x - x_dloni) ** 2) ** 0.5 * 0.95 if dl > abs(bark.x - x_dloni) else dl * 0.9
        cel = Vector((x_dloni, bark.y - 0.06 * dl, bark.z - dz))
        if poza == "splecione":          # dłonie złożone przed brzuchem, na wysokości PASA
            # ⚠ Nisko przed kroczem (biodro + 0,06) czytało się jak KAJDANKI
            #   (autor: „postawa jakby byli skuci"). Portrety: pas, łokcie na boki.
            cel = Vector((znak * H * 0.030, y_osi - H * (P["talia_glebokosc"] + P["dlon_grubosc"] * 1.6),
                          z0 + H * (P["talia"] - 0.01)))
            pole = arm.pose.bones[f"Elbow_{s}.007"]
            Mp = pole.matrix.copy()
            Mp.translation = mw.inverted() @ Vector((znak * H * 0.40, y_osi + H * 0.06, z0 + H * P["talia"]))
            pole.matrix = Mp
            bpy.context.view_layer.update()
        elif poza == "biodra":           # pięści na biodrach, łokcie na boki
            cel = Vector((znak * H * (P["talia_polszer"] + P["dlon_grubosc"] * 0.5), y_osi - H * 0.005,
                          z0 + H * (P["talia"] - 0.015)))
            # łokieć NA ZEWNĄTRZ: cel bieguna IK odsunięty w bok na wysokości
            # klatki — bez tego IK zginał rękę do tyłu i ręce wisiały prosto
            pole = arm.pose.bones[f"Elbow_{s}.007"]
            Mp = pole.matrix.copy()
            Mp.translation = mw.inverted() @ Vector((znak * H * 0.42, y_osi + H * 0.04, z0 + H * (P["klatka"] - 0.01)))
            pole.matrix = Mp
            bpy.context.view_layer.update()
        elif poza == "za_plecami":       # ręce założone do tyłu (starzec)
            cel = Vector((znak * H * 0.035, y_osi + H * (P["biodro_glebokosc"] + P["dlon_grubosc"] * 1.2),
                          z0 + H * (P["biodro"] + 0.01)))
        pb = arm.pose.bones[f"HandIK_{s}.005"]
        M = pb.matrix.copy()
        M.translation = mw.inverted() @ cel
        pb.matrix = M
        bpy.context.view_layer.update()
    baza_pozy = {}
    for pb in arm.pose.bones:
        baza_pozy[pb.name] = (Vector(pb.location), Quaternion(pb.rotation_quaternion))

    stara = bpy.data.actions.get("Idle")
    if stara:
        bpy.data.actions.remove(stara)
    akcja = bpy.data.actions.new("Idle")
    akcja.use_fake_user = True
    arm.animation_data.action = akcja
    # `--bez-postawy`: sama poza bezruchu bazy — do porównań (czy usterka jest z postawy)
    po = dict(garb=0.0, glowa=0.0, oddech=0.0) if "--bez-postawy" in argv else pr["postawa"]
    n = max(4, round(FPS_IDLE * scn.render.fps))

    def obrot(nazwa, os_lok, stopnie):
        pb = arm.pose.bones[nazwa]
        pb.rotation_quaternion = pb.rotation_quaternion @ Quaternion(os_lok, math.radians(stopnie))

    klucze = sorted({0, n // 4, n // 2, (3 * n) // 4, n})
    for f in klucze:
        faza = math.sin(2 * math.pi * f / n)                 # wdech/wydech
        for pb in arm.pose.bones:
            loc, q = baza_pozy[pb.name]
            pb.location = loc
            pb.rotation_quaternion = q
        # postawa: zgarbienie (pierś do przodu), kontra głowy, oddech na piersi
        obrot("Bone.001", (1, 0, 0), po["garb"] * 0.4)
        obrot("Bone.002", (1, 0, 0), po["garb"] * 0.6 + po["oddech"] * faza)
        obrot("Bone.004", (1, 0, 0), po["glowa"] - po["oddech"] * 0.5 * faza)
        # ⛔ Chore biodro NIE przez obrót miednicy (`Bone`): to korzeń tułowia,
        #   a dłonie trzyma IK — obrót łamał koszulę na barku (render 2026-10-09).
        for pb in arm.pose.bones:
            for kanal in chod._kanaly(pb):
                pb.keyframe_insert(data_path=kanal, frame=f, group=pb.name)
    akcja.use_frame_range = True
    akcja.frame_start, akcja.frame_end = 0, n
    scn.frame_set(0)
    return akcja, n


def zbuduj_klipy_wroga(pr):
    """Klipy wroga-humanoida (2026-10-11, `docs/bandyci_plan.md` krok 1).

    Mieszkaniec ma tylko `Idle`; wróg potrzebuje tego, co gra pyta przez
    `Creature3D` (`stan3d().klip`): `Idle`, `Walk`, `Run`, `Attack`. Wszystkie
    z bronią w PRAWEJ dłoni — te same generatory, co klipy gracza
    (`char3d_walk`/`char3d_run`/`char3d_chod`/`char3d_attack`), więc chód zbója
    i gracza jest jednym ruchem, a poprawka cyklu trafia do obu.

    ⚠ Chód i bieg budowane OD NOWA na szkielecie presetu: `Walk` z pliku
      niesie cele IK zmierzone na bazie i przy innych proporcjach dłonie
      wisiały na złej wysokości (ta sama pułapka, co w `zbuduj_stanie`).
    ⚠ `Walk`/`Run` eksportowane z zakresem 0–4 (pętla), BEZ klatki 5 (bezruch
      poza pętlą, `char3d_walk.BEZRUCH`) — `Creature3D` gra cały klip w pętli,
      więc bezruch wewnątrz dawałby szarpnięcie raz na cykl.
    ⚠ Śmierci tu nie ma: przewraca model `Creature3D` (obrót korzenia), jak
      gracza `Character3D`, bez klipu.
    """
    import char3d_chod
    import char3d_run
    arm = bpy.data.objects["Armature"]
    scn = bpy.context.scene
    chod.zbuduj_chod(arm, report=False)
    char3d_run.zbuduj_bieg(arm, report=False)
    walk_b = char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False)
    run_b = char3d_chod.zbuduj_chod_uzbrojony(arm, oburacz=False, zrodlo="Run")
    atak, bledy = char3d_attack.zbuduj_atak(arm)
    if bledy:
        print(f"[wrog] UWAGA: cios ma {len(bledy)} poz poza tolerancją: {bledy}")

    # Stanie = klatka bezruchu chodu Z BRONIĄ (ręka trzyma broń przy boku)
    # + lekki oddech; `Idle` mieszkańca stoi z pustymi rękami.
    arm.animation_data.action = walk_b
    scn.frame_set(chod.BEZRUCH)
    bpy.context.view_layer.update()
    baza_pozy = {pb.name: (Vector(pb.location), Quaternion(pb.rotation_quaternion)) for pb in arm.pose.bones}
    stara = bpy.data.actions.get("Idle")
    if stara:
        bpy.data.actions.remove(stara)
    idle = bpy.data.actions.new("Idle")
    idle.use_fake_user = True
    arm.animation_data.action = idle
    n = max(4, round(FPS_IDLE * scn.render.fps))
    oddech = pr["postawa"].get("oddech", 1.2)
    for f in sorted({0, n // 4, n // 2, (3 * n) // 4, n}):
        faza = math.sin(2 * math.pi * f / n)
        for pb in arm.pose.bones:
            loc, q = baza_pozy[pb.name]
            pb.location = loc
            pb.rotation_quaternion = q
        pb2 = arm.pose.bones["Bone.002"]
        pb2.rotation_quaternion = pb2.rotation_quaternion @ Quaternion((1, 0, 0), math.radians(oddech * faza))
        for pb in arm.pose.bones:
            for kanal in chod._kanaly(pb):
                pb.keyframe_insert(data_path=kanal, frame=f, group=pb.name)
    idle.use_frame_range = True
    idle.frame_start, idle.frame_end = 0, n

    # Nazwy, o które pyta gra; źródłowe `Walk`/`Run` (bez broni) wypadają.
    for zrodlo in ("Walk", "Run"):
        a = bpy.data.actions.get(zrodlo)
        if a:
            bpy.data.actions.remove(a)
    walk_b.name, run_b.name = "Walk", "Run"
    for a in (walk_b, run_b, atak):
        a.use_fake_user = True
        a.use_frame_range = True
        a.frame_start, a.frame_end = 0, 4
    scn.frame_set(0)
    return ["Idle", "Walk", "Run", "Attack"]


def _zastosuj_modyfikatory(ob, fasety=False):
    """Mirror/Subsurf na stałe (w pamięci) — AO i brzegi liczą się per
    wierzchołek, więc siatka musi mieć już końcową topologię. Armature zostaje.

    ⭐ `fasety` (krok A2, referencje low-poly 2026-10-09): BEZ wygładzania
    powierzchni i z płaskim cieniowaniem — płaskie ściany czytają się jak
    świadomy styl low-poly, wygładzone bryły jak nadmuchana guma."""
    for md in list(ob.modifiers):
        if fasety and md.type == "SUBSURF":
            ob.modifiers.remove(md)
            continue
        if md.type in ("MIRROR", "SUBSURF"):
            with bpy.context.temp_override(object=ob, active_object=ob):
                bpy.ops.object.modifier_apply(modifier=md.name)
        elif md.type == "SOLIDIFY" and not md.show_render:
            ob.modifiers.remove(md)


# Kości, których okolica zostaje GŁADKA mimo faset: bark i obojczyk.
# ⚠ Rura ramienia (8 boków) zaczyna się głęboko w tułowiu i nad linią barku
#   wystawała jako KOSTKA — z ostrymi krawędziami barki czytały się jak
#   naramienniki-pudełka (autor, 2026-10-09). Bark ma być okrągły.
GLADKIE_KOSCI = ("Bone.002_L", "Bone.002_R", "Bone.002_L.001", "Bone.002_R.001")


def _fasety_po_kacie(me, kat, ob=None):
    """Krawędź ostra, gdy ściany schodzą się pod kątem > `kat` (°), reszta
    gładka. ⚠ Same płaskie ściany na NASZEJ siatce (pierścienie wzdłuż ciała)
    dawały poziome PASY na tułowiu zamiast płaszczyzn — mały kąt między
    pierścieniami wygładzamy, fasety zostają na kończynach i brzegach."""
    import math as _m
    gladkie = set()
    if ob is not None:
        idx = {g.index for g in ob.vertex_groups if g.name in GLADKIE_KOSCI}
        gk1 = {g.index for g in ob.vertex_groups if g.name in GLADKIE_KOSCI[2:]}
        for v in me.vertices:
            for g in v.groups:
                # obojczyk: każda waga; ramię: tylko blisko barku (mieszane z obojczykiem)
                if g.group in idx and (g.group not in gk1 or any(h.group in idx - gk1 and h.weight > 0.05 for h in v.groups)) and g.weight > 0.05:
                    gladkie.add(v.index)
    bm = bmesh.new()
    bm.from_mesh(me)
    prog = _m.radians(kat)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2:
            if gladkie and all(v.index in gladkie for v in e.verts):
                e.smooth = True
                continue
            e.smooth = e.link_faces[0].normal.angle(e.link_faces[1].normal, 0.0) <= prog
    bm.to_mesh(me)
    bm.free()
    me.update()


def _kolor_atrybut(me, baza=None):
    """Atrybut „Col" (tworzony z wartością `baza`, gdy go nie ma) — aktywny,
    bo eksport idzie z `export_vertex_color='ACTIVE'`."""
    kol = me.color_attributes.get("Col")
    if kol is None:
        kol = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
        for d in kol.data:
            d.color = baza or (1.0, 1.0, 1.0, 1.0)
    me.color_attributes.active_color = kol
    me.color_attributes.render_color_index = list(me.color_attributes).index(kol)
    return kol


def _brzegi(ob, ciemniej=0.62, pierscien=0.84):
    """Ciemniejszy BRZEG ubrania (mankiet, kołnierz, dół) — krawędzie otwarte
    siatki. Przy 60 px postaci to linia, która oddziela warstwy stroju."""
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    brzeg = {v.index for e in bm.edges if e.is_boundary for v in e.verts}
    obok = {n.index for i in brzeg for e in bm.verts[i].link_edges for n in e.verts} - brzeg
    bm.free()
    kol = _kolor_atrybut(me)
    for i in brzeg:
        c = kol.data[i].color
        kol.data[i].color = (c[0] * ciemniej, c[1] * ciemniej, c[2] * ciemniej, 1.0)
    for i in obok:
        c = kol.data[i].color
        kol.data[i].color = (c[0] * pierscien, c[1] * pierscien, c[2] * pierscien, 1.0)
    return len(brzeg)


def _ao(obiekty, promienie=20, zasieg=1.6, sila=0.72):
    """Okluzja otoczenia per wierzchołek w POZIE STANIA (pod pachą, między
    nogami, pod brodą, w fałdach) — promienie w półsferze wokół normalnej
    przeciw wszystkim bryłom postaci naraz. Mnoży kolor „Col"."""
    dg = bpy.context.evaluated_depsgraph_get()
    pkt, sc, dane = [], [], []
    for ob in obiekty:
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        mw = ev.matrix_world
        o = len(pkt)
        pkt += [mw @ v.co for v in me.vertices]
        sc += [tuple(o + i for i in p.vertices) for p in me.polygons]
        nm = mw.to_3x3().inverted().transposed()
        dane.append((ob, [(mw @ v.co, (nm @ v.normal).normalized()) for v in me.vertices]))
        ev.to_mesh_clear()
    drzewo = BVHTree.FromPolygons(pkt, sc)
    rng = random.Random(7)
    kier = []
    while len(kier) < promienie:
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
        if 0.05 < d.length <= 1.0:
            kier.append(d.normalized())
    for ob, wierz in dane:
        kol = _kolor_atrybut(ob.data)
        n_v = len(ob.data.vertices)
        for i, (p, n) in enumerate(wierz[:n_v]):
            traf = 0
            ile = 0
            for d in kier:
                if d.dot(n) < 0:
                    d = -d
                ile += 1
                hit = drzewo.ray_cast(p + n * 0.03, d, zasieg)
                if hit[0] is not None:
                    traf += 1
            ao = 1.0 - sila * (traf / max(1, ile))
            c = kol.data[i].color
            kol.data[i].color = (c[0] * ao, c[1] * ao, c[2] * ao, 1.0)
    return sum(len(w) for _o, w in dane)


def _twarz_z_portretu(pr, P):
    """Twarz z portretu 2D na przód głowy — rzut w `char3d_face` (wspólny
    z graczem). Wołane PO zastosowaniu lustra: oba boki są prawdziwe."""
    tw = pr.get("twarz")
    if tw:
        twarz.naloz_twarz(P, tw)


def wypiecz(pr, ubior, wl):
    jk = pr.get("jakosc", {})
    if not jk:
        return
    cialo = [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"]]
    wszystkie = cialo + ubior + wl
    fasety = jk.get("fasety", False)
    for ob in wszystkie:
        _zastosuj_modyfikatory(ob, fasety and ob not in wl)
        if fasety and ob not in wl:
            _fasety_po_kacie(ob.data, jk.get("kat_faset", 28.0), ob)
    _twarz_z_portretu(pr, pr["_P"])
    if jk.get("brzegi"):
        n = sum(_brzegi(ob) for ob in ubior if ob.name.startswith(pancerz.PRZEDROSTEK))
        print(f"[jakosc] brzegi ubrań: {n} wierzchołków")
    if jk.get("ao"):
        bpy.context.scene.frame_set(0)
        bpy.context.view_layer.update()
        n = _ao(wszystkie)
        print(f"[jakosc] AO: {n} wierzchołków")


def podglad(katalog, tag):
    # ⚠ Blender liczy względną ścieżkę renderu od SIEBIE, nie od powłoki.
    katalog = katalog if os.path.isabs(katalog) else os.path.join(ROOT, katalog)
    os.makedirs(katalog, exist_ok=True)
    scn = bpy.context.scene
    scn.render.engine = "BLENDER_WORKBENCH"
    scn.display.shading.light = "STUDIO"
    scn.display.shading.color_type = "TEXTURE"     # twarz z portretu (tekstura); reszta = kolor materiału
    scn.render.film_transparent = True
    scn.view_settings.view_transform = "Standard"
    scn.render.image_settings.file_format = "PNG"
    cam = bpy.data.objects.get("NpcKamera")
    if cam is None:
        cam = bpy.data.objects.new("NpcKamera", bpy.data.cameras.new("NpcKamera"))
        scn.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    scn.camera = cam
    dol, gora = baza.PODLOGA, baza.PODLOGA + baza.WYSOKOSC * 1.12
    cz, H = (dol + gora) / 2, gora - dol
    # ⭐ `gra` i `gra_skos` = kąt kamery świata 3D (`WorldView3D.kat` 40°);
    #   `gra_px`: ~13,5% z 1080 px wysokości ekranu S21 FE ≈ 146 px postaci.
    widoki = [("front", 8, 0, 360, 600), ("bok", 8, 90, 360, 600), ("tyl", 8, 180, 360, 600),
              ("gra", 40, 0, 360, 600), ("gra_skos", 40, 35, 360, 600), ("gra_px", 40, 20, 110, 160)]
    for nazwa, elew, azym, W, Hp in widoki:
        cam.data.ortho_scale = H * 1.1          # dłuższy bok kadru = pion
        scn.render.resolution_x, scn.render.resolution_y = W, Hp
        scn.render.resolution_percentage = 100
        e, a, d = math.radians(elew), math.radians(azym), 120.0
        cam.location = (d * math.cos(e) * math.sin(a), -d * math.cos(e) * math.cos(a), cz + d * math.sin(e))
        kier = Vector((0.0, 0.0, cz)) - Vector(cam.location)
        cam.rotation_euler = kier.to_track_quat("-Z", "Y").to_euler()
        scn.render.filepath = os.path.join(katalog, f"{tag}_{nazwa}.png")
        bpy.ops.render.render(write_still=True)
    print(f"[podglad] {katalog}/{tag}_*.png")


def eksport(npc, obiekty, akcje=("Idle",), prefiks="npc"):
    arm = bpy.data.objects["Armature"]
    for a in list(bpy.data.actions):
        if a.name not in akcje:
            bpy.data.actions.remove(a)
    arm.animation_data.action = bpy.data.actions["Idle"]
    # ⚠⚠ Stopy bazy leżą na `PODLOGA` (−11,3 j.), nie w zerze — gracz koryguje
    #   to w `Character3D` (bryła ciała), a `Creature3D` stawia model korzeniem
    #   na gruncie. Bez tego NPC stał 11 j. POD ziemią i z gry wystawał sam
    #   czubek głowy (pierwszy render pilota 2026-10-09).
    arm.location.z -= baza.PODLOGA
    bpy.context.view_layer.update()
    for o in bpy.data.objects:
        o.select_set(False)
    for o in [arm, bpy.data.objects["Cube"], bpy.data.objects["Cube.001"], *obiekty]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    cel = os.path.join(ROOT, "public", "assets", "characters", f"{prefiks}_{npc}.glb")
    bpy.ops.export_scene.gltf(
        filepath=cel, export_format="GLB", use_selection=True, export_apply=True,
        export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True,
        export_frame_range=False, export_skins=True, export_yup=True,
        # ⭐ COLOR_0 z aktywnego atrybutu „Col" (AO, brzegi, pasma) — three.js
        #   mnoży go przez kolor materiału strefy.
        export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    print(f"[zapis] {cel} {os.path.getsize(cel)} bajtów")


def main():
    if not argv or argv[0] not in PRESETY:
        raise SystemExit(f"użycie: -- <npc> [--zapisz] [--podglad KATALOG]; znane: {', '.join(PRESETY)}")
    npc = argv[0]
    pr = PRESETY[npc]
    print(f"[npc] {npc}: {pr['opis']}")
    P, ubior, wl = zastosuj_preset(pr)
    wrog = pr.get("wrog")
    bron = []
    if wrog:
        # ⭐ Wróg-humanoid: broń w prawej dłoni + klipy walki zamiast `Idle`
        #   mieszkańca (`zbuduj_klipy_wroga`).
        import char3d_weapons
        ob_b = char3d_weapons.zbuduj_bron(wrog["bron"], bpy.data.objects["Armature"])
        ob_b.hide_render = ob_b.hide_viewport = False
        bron = [ob_b]
        akcje = zbuduj_klipy_wroga(pr)
        n = 4
    else:
        akcja, n = zbuduj_stanie(pr, P)
        akcje = ["Idle"]
    wypiecz(pr, ubior, wl)
    tr = 0
    dg = bpy.context.evaluated_depsgraph_get()
    for o in [bpy.data.objects["Cube"], bpy.data.objects["Cube.001"], *ubior, *wl]:
        me = o.evaluated_get(dg).to_mesh()
        tr += sum(len(p.vertices) - 2 for p in me.polygons)
        o.evaluated_get(dg).to_mesh_clear()
    print(f"[npc] strój: {[o.name for o in ubior]}; włosy: {[o.name for o in wl]}; "
          f"klipy {akcje}; trójkątów ~{tr}")
    if "--podglad" in argv:
        podglad(argv[argv.index("--podglad") + 1], npc)
    if "--zapisz" in argv:
        eksport(npc, ubior + wl + bron, akcje=akcje, prefiks="enemy" if wrog else "npc")
    else:
        print("[przymiar] NIC nie zapisano (--zapisz)")


main()

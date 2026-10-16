# -*- coding: utf-8 -*-
"""
Ikony PANCERZA z arkuszy Gemini — wsad 1 (głowa, pilot), wsad 2 (klata: len i skóra),
wsad 3 (klata: kolczuga i metal), wsad 4 (nogi: len, skóra, kolczuga), wsad 5
(nogi: metal), wsad 6 (buty) i wsad 7 (rękawice + naramienniki).

    python tools/build_armor_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_armor_icons.py --podglad X.png    # + podgląd 10x, 2x, 1x i stare ikony
    python tools/build_armor_icons.py --zapisz           # zapis do public/assets/items/

── Skąd piksele — i dlaczego INACZEJ niż przy broni ────────────────────────
Źródło: arkusz Gemini `docs/art-review/gemini/armor_head_v1_raw.png`
(ocena: `docs/gemini_armor_icons.md` §4.5). Przy mieczach arkusz był
wyłącznie projektem, bo zejście do 32 px zjadało cienkie jelce. Pancerz to
zwarte bryły i test zmniejszenia pokazał, że przeżywają — więc tu kształt
i cieniowanie idą Z ARKUSZA, a ten plik robi resztę:

  1. przedmiot z arkusza → wycięcie magenty → bbox. Dwa sposoby wycinania:
     `grid` (komórka kraty) albo `plama` (spójna plama zawierająca punkt).
     ⚠ Gemini NIE trzyma kraty: wsad 2 przyszedł jako 7 porozrzucanych
     sztuk w proporcji 3:1 zamiast 3x2 — ale każda sztuka to osobna plama.
  2. zmniejszenie BOX do `WNETRZE` px na dłuższym boku
  3. przyciągnięcie każdego piksela do ramp DOZWOLONYCH dla materiałów tej
     sztuki (len nie ucieknie w stal, bo stali w jego zbiorze nie ma —
     lekcja `snap_paleta.py` o znikających kategoriach koloru)
  4. poprawki natywne: ⚠ SZACHOWNICA KOLCZUGI (nie przeżywa żadnego
     zmniejszenia — mora albo gładka szarość), żebra szyszaka (Gemini
     zgubiło je w v2)
  5. kontur `KONTUR` dookoła sylwetki
  6. żelazne bliźniaki: zamiana rampy stali na rampę żelaza STOPIEŃ W STOPIEŃ
     (ta sama bryła — `docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`)

── Kolory ───────────────────────────────────────────────────────────────────
Stal: pięć stopni zbudowanych na tonach sztyletów i mieczy (te same trzy
+ `S_MID` z mieczy + jeden jasny pośredni) — metal ma być jeden w całym
ekwipunku. Skóra: `tools/wood_palette.py`. Len: rampa próbkowana z arkusza.
⚠ PILOT: rampy stali/żelaza/lnu są tu LOKALNE. Wspólny standard metalu
(jak `wood_palette.py`) jest zapowiedziany razem z metalowymi tarczami
(OI-126) — gdy powstanie, te rampy mają się do niego przenieść, nie
rozmnożyć.
"""
import hashlib
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from icon_center import wysrodkuj, bledy_srodka  # noqa: E402
from wood_palette import RAMPA as WOOD, KONTUR, DROBNE  # noqa: E402

KORZEN = Path(__file__).resolve().parent.parent
GEMINI = KORZEN / "docs" / "art-review" / "gemini"
CEL = KORZEN / "public" / "assets" / "items"
R = 32
WNETRZE = 28          # dłuższy bok PRZED konturem; z konturem 30, margines 1 px
#: ⚠ Było 26 (z konturem 28): na półce obok tarcz i sztyletów (29–30 px)
#:   hełmy wyglądały na mniejsze od sztyletu.

#: Stal i żelazo: WSPÓLNY STANDARD `tools/metal_palette.py` (od 2026-10-02,
#: `OI-126`). Liczby powstały tutaj (przegląd czytelności 2026-09-30) i zostały
#: przeniesione 1:1 — ikony pancerza wychodzą bajt w bajt te same.
from metal_palette import STEEL, IRON  # noqa: E402
LINEN = ((112, 98, 84), (157, 141, 122), (206, 184, 154), (220, 205, 184))
#: ⚠ Najjaśniejszy stopień był (232,220,204) — len świecił najmocniej
#:   w całej rodzinie (jasność 170–200 przy 80–130 reszty). Przygaszony
#:   lekko (decyzja autora 2026-09-30); nadal najjaśniejszy materiał.
LEATHER = tuple(WOOD)
#: Płótno brygantyny: sprana ciemna czerwień, próbkowana z arkusza wsadu 3
#: (131,43,45 · 105,34,37 · 84,27,30 · 63,22,21). Czerwień, bo brąz zlewał
#: się ze skórą ćwiekowaną, a len z przeszywanicą (`gemini_armor_icons.md` §6.1).
CANVAS = ((62, 22, 22), (108, 40, 40), (144, 52, 52), (178, 66, 64), (208, 90, 84))
#: ⚠ Była (62,22,22 … 133,45,46): kontrast brygantyny 25 — czerwień ma niską
#:   jasność, więc ta sama „sprana czerwień” musi być jaśniejsza w RGB.

#: Łyko łapci: słomkowy beż, próbkowany z arkusza wsadu 6 (242,204,144 ·
#: 214,173,116 · 176,134,84 · 140,98,60). Ani len (za zimny, za biały), ani
#: skóra (za czerwona) — splot w kratkę zginąłby w jednym z nich.
BAST = ((140, 98, 60), (176, 134, 84), (214, 173, 116), (242, 204, 144))

RAMPY = {"steel": STEEL, "linen": LINEN, "leather": LEATHER, "canvas": CANVAS, "bast": BAST}
#: Które stopnie rampy WOLNO użyć. ⚠ Skóra: `DROBNE` (co trzeci szczebel
#: drewna) — tak jak zaleca `wood_palette.py` dla małych elementów. Przy
#: całej 12-stopniowej rampie lamelka miała 15 kolorów i czytała się jak szum.
STOPNIE = {"steel": (0, 1, 2, 3, 4), "linen": (0, 1, 2, 3), "leather": tuple(DROBNE),
           "canvas": (1, 2, 3, 4), "bast": (0, 1, 2, 3)}
#: Materiały, których jasność układa się od nowa (`wyrownaj`). ⚠ STAL NIE:
#: najbliższy kolor już pokrywa u niej pełen zakres (min 10, max 224), a
#: rozciągnięcie wybieliło kaptur kolczy i dało szachownicę w otworze twarzy.
WYROWNUJ = {"leather", "linen", "canvas", "bast"}
#: ⚠ Płótno od 2026-09-30: jaśniejsza rampa sama pogorszyła brygantynę
#:   (kontrast 35 → 28) — ciemne czerwienie arkusza przestały trafiać
#:   w płótno i szły w kontur/stal. Stopień 0 (ciemny) zostaje do
#:   ROZPOZNANIA materiału, jasność rozciąga `wyrownaj` na stopnie 1–4.

#: Arkusze: plik + sposób wycinania. Ocena każdego: `docs/gemini_armor_icons.md`.
#: ⚠ `armor_head_v1_raw.png` zawiera wynik v2 (autor nadpisał odrzucony v1).
ARKUSZE = {
    "head": dict(plik="armor_head_v1_raw.png", grid=(2, 4)),
    "chest_soft": dict(plik="armor_chest_soft_v1_raw.png"),
    # wsad 3: krata 4x2 TRZYMANA, arkusz ostry (szachownica 1 px) — jak głowa
    "chest_metal": dict(plik="armor_chest_metal_v1_raw.png", grid=(2, 4)),
    # wsad 4: zamówione 3x2 / 6 sztuk, przyszło 4x2 / 8 — krata trzymana
    "legs_soft": dict(plik="armor_legs_soft_v1_raw.png", grid=(2, 4)),
    # wsad 5: zamówione 4x2 (§8.0) i tak przyszło — krata trzymana, arkusz ostry
    "legs_metal": dict(plik="armor_legs_metal_v1_raw.png", grid=(2, 4)),
    # wsad 6: v2 promptu (z przodu). Krata trzymana, ale Gemini NARYSOWAŁO
    # linie kraty i kreseczki u góry → `bez_kresek`
    "boots": dict(plik="armor_boots_v1_raw.png", grid=(2, 4), kreski=True),
    # wsad 7: zamówione 3x3 / 1:1, przyszło 16:9 / 5x2 (10 komórek, jedna
    # zmyślona) — krata trzymana, linie kraty ciemnomagentowe → `kreski`
    "hands_shoulders": dict(plik="armor_hands_shoulders_v1_raw.png", grid=(2, 5), kreski=True),
}

#: Głowa: komórka kraty (wiersz, kolumna) → przedmiot, materiały, poprawki.
GLOWA = {
    "cloth_coif":     dict(cell=(0, 0), mat=("linen",)),
    "padded_cap":     dict(cell=(0, 1), mat=("linen",)),
    "leather_helmet": dict(cell=(0, 2), mat=("leather",)),
    "mail_coif":      dict(cell=(0, 3), mat=("steel",), kolczuga=True),
    "lamellar_coif":  dict(cell=(1, 0), mat=("steel", "leather")),
    "steel_helmet":   dict(cell=(1, 1), mat=("steel",), otwory=True),
    "spangenhelm":    dict(cell=(1, 2), mat=("steel",), zebro=True),
    "kettle_hat":     dict(cell=(1, 3), mat=("steel",)),
}
#: Klata, len i skóra: `plama` = punkt (x, y) w pikselach arkusza leżący NA
#: przedmiocie. ⚠ Skórzany kaftan przyszedł DWA razy (góra-prawo z pasem,
#: dół-lewo bez) — wzięty dolny: krótkie rękawy + sznurowanie, dokładnie
#: jak w prompcie. Drugi zostaje w arkuszu jako alternatywa.
KLATA_MIEKKA = {
    "linen_shirt":            dict(plama=(57, 36), mat=("linen",), wygladz=True),
    "gambeson":               dict(plama=(174, 48), mat=("linen",), wygladz=True,
                                   faktura="walki"),
    "arming_doublet":         dict(plama=(290, 36), mat=("linen",), wygladz=True,
                                   faktura="guziki"),
    "leather_chest":          dict(plama=(56, 114), mat=("leather",), wygladz=True),
    "studded_leather":        dict(plama=(291, 114), mat=("leather",), wygladz=True,
                                   faktura="cwieki"),
    # sztywna skorupa ma być CIEMNIEJSZA od miękkiej skóry — `wyrownaj`
    # rozciąga każdą sztukę osobno, więc bez własnych stopni wyszłaby tak
    # jasna jak kaftan (opis w grze: „gotowana i formowana na twardo")
    "hardened_leather_chest": dict(plama=(401, 114), mat=("leather",),
                                   stopnie={"leather": (4, 7, 9, 10)}, wygladz=True),
    # ⚠ stopnie (1, 4, 7, 9) dawały kontrast 21 na tle kafla — nadal ciemniejsza
    #   od miękkiego kaftana (DROBNE kończy na 10), ale czytelna
}
#: ⚠ Arkusz klaty przyszedł MIĘKKI (rozmyte krawędzie, cieniowanie
#:   gradientem), a zmniejszenie jest tu ~3,3x (hełmy: ~1,8x). Wynik bez
#:   `wygladz` był plamisty, a ćwieki, guziki i wałki ginęły w szumie —
#:   dlatego faktura idzie natywnie (`faktura`), tak jak szachownica kolczugi.
#: Kolor ćwieka — jedyny metal na skórzanej sztuce, dopisany jawnie.
CWIEK = STEEL[2]
#: ⚠ Było STEEL[3]: jasne, zimne kropki czytały się jak groszki na tkaninie,
#:   nie jak żelazo wbite w skórę.
#: Stopień stali nitu brygantyny.
NIT = 3
for _p in GLOWA.values():
    _p["arkusz"] = "head"
for _p in KLATA_MIEKKA.values():
    _p["arkusz"] = "chest_soft"
#: Klata, kolczuga i metal (wsad 3). Komórka (1,3) to KOTWICA stylu —
#: skórzany kaftan przerysowany ze wsadu 2; jego pikseli nie bierzemy.
KLATA_METAL = {
    "mail_hauberk":   dict(cell=(0, 0), mat=("steel",), kolczuga=True),
    "short_hauberk":  dict(cell=(0, 1), mat=("steel",), kolczuga=True),
    "lamellar_chest": dict(cell=(0, 2), mat=("steel", "leather"), faktura="lamele",
                           wygladz_kafel=True, podnies_stal=1),
    "scale_chest":    dict(cell=(0, 3), mat=("steel", "leather"), faktura="luski",
                           wygladz_kafel=True),
    "steel_chest":    dict(cell=(1, 0), mat=("steel", "leather")),
    "brigandine":     dict(cell=(1, 1), mat=("canvas", "steel"), faktura="nity"),
    "cuirass":        dict(cell=(1, 2), mat=("steel", "leather")),
}
for _p in KLATA_METAL.values():
    _p["arkusz"] = "chest_metal"
#: Nogi: len, skóra, kolczuga (wsad 4). ⭐ Slot nóg = SPODNIE zszyte w kroku
#: (model 3D w bieliźnie, przedmioty nakładane jak w WoW —
#: `docs/gemini_armor_icons.md` §1). Arkusz ma 8 sztuk zamiast 6: (0,3) to
#: drugie skórzane spodnie BEZ pasa, (1,2) kolcza „spódnica" z rozcięciem,
#: (1,3) kotwica. Wzięte sztuki zgodne z promptem.
NOGI = {
    "linen_trousers":  dict(cell=(0, 0), mat=("linen",)),
    "padded_chausses": dict(cell=(0, 1), mat=("linen",)),
    # głosowanie (jak miękka klata): dopiero ono pokazuje pas z klamrą. ⚠ Nie
    # dla spodni lnianych — zjada fałdy, a to fałdy odróżniają je od
    # sztywnych pikowanych; ani dla półnogawic — szum + podwójny obrys (29%)
    "leather_legs":    dict(cell=(0, 2), mat=("leather", "steel"), wygladz=True),
    "mail_chausses":   dict(cell=(1, 0), mat=("steel", "leather"), kolczuga=True),
    "demi_chausses":   dict(cell=(1, 1), mat=("steel", "leather"), kolczuga=True),
}
for _p in NOGI.values():
    _p["arkusz"] = "legs_soft"
#: Nogi: metal (wsad 5). ⭐ Ikona warstwy L3 = SAM METAL na pasie, bez spodni
#: pod spodem (`docs/gemini_armor_icons.md` §8.0b). Komórki (1,1)–(1,3) to
#: kotwice ze wsadu 4 — pikseli nie bierzemy.
#: Ścieżka wybierana PER SZTUKA porównaniem na renderze (jak `leather_legs`):
#: - lamelka: ostra dawała plamisty szum stali ze skórą, `lamele` (same
#:   szczeliny) nie pomagały → głosowanie + `lamele_rzedy` (rzędy + rzemień);
#: - nabiodrki: ostra dawała szarą plamę bez nakolanników (wygładzenie na
#:   kaflu też — czyste, ale bezkształtne spodnie) → głosowanie, które niesie
#:   linie styku płyt; te przy brzegu dublowały obrys (0,152) → `styki`;
#: - ⛔ szyny NIE przez głosowanie — rozpadały się na osobne kawałki (21%).
#: Poprawki po ocenie autora (2026-09-30, `docs/gemini_armor_icons.md` §8.5):
#: - `symetria` — lamelka z PRAWEJ połowy (lewa noga wystawała u dołu, pas
#:   z lewej dawał krzyżyki), nabiodrki z LEWEJ (pełne skrzydełko nakolannika);
#: - `sprzataj` — ⛔ NIE dla nabiodrek: krótkie wewnętrzne linie styku płyt
#:   to kępki konturu ≤ 3 px nie przy tle, więc znikały razem ze śmieciami;
#: - `zaslepka` skórą — prześwit między rzemieniami pod pasem nagolenników
#:   zaślepiany najciemniejszą stalą czytał się jak fioletowy kwadrat;
#: - `luski_skora` — łuska obok kolczugi w 1x.
NOGI_METAL = {
    "lamellar_legs":    dict(cell=(0, 0), mat=("steel", "leather"), wygladz=True,
                             faktura="lamele", faktura_od=4, symetria="prawa", sprzataj=True,
                             wygladz_kafel=True, szczeliny=False),
    "scale_legs":       dict(cell=(0, 1), mat=("steel", "leather"), faktura="luski",
                             wygladz_kafel=True),
    "steel_legs":       dict(cell=(0, 2), mat=("steel", "leather"), sprzataj=True,
                             zaslepka=("leather", DROBNE[1])),
    "splinted_greaves": dict(cell=(0, 3), mat=("steel", "leather"), sprzataj=True),
    "cuisses":          dict(cell=(1, 0), mat=("steel", "leather"), wygladz=True,
                             styki=True, symetria="lewa"),
}
#: Stopień skóry rzemienia lamelki. ⚠ `DROBNE[2]` (jak w ćwiekach) był za
#: jasny — rzędy czytały się jak pomarańczowe szczeble drabiny.
RZEMIEN = DROBNE[1]
for _p in NOGI_METAL.values():
    _p["arkusz"] = "legs_metal"
#: Buty (wsad 6): PARA prosto z przodu (§9.0 — profil odrzucony przez autora).
#: L3 = sam metal na rzemieniu, bez buta w środku (§8.0b).
BUTY = {
    # wygładzenie tonów na kaflu: pasy owinięcia zostają, drobny szum nie
    #   (szum 0,55 na progu — przegląd czytelności 2026-09-30)
    "foot_wraps":     dict(cell=(0, 0), mat=("linen",), wygladz_kafel=True),
    # ⚠ SAM łyk (2026-09-30): z brązem skóry splot i sznurki dawały szum
    #   0,63–0,74; łyko w `WYROWNUJ` + splot 2x2 na całej cholewce
    "bast_shoes":     dict(cell=(0, 1), mat=("bast",), faktura="splot",
                           wygladz_kafel=True),
    "low_boots":      dict(cell=(0, 2), mat=("leather",)),
    # ⚠ w arkuszu tej samej wysokości co buty piechura (a ma być do pół
    #   łydki) — wycięty pas gładkiej cholewki, §9.4
    # głosowanie: czystsze plamy skóry (⛔ NIE dla trzewików — rozpadały się,
    #   obrys 23%; ⛔ łapcie NIE tylko na łyku — splot i sznurki niesie brąz)
    "leather_boots":  dict(cell=(0, 3), mat=("leather",), skroc=(8, 22), styki=True,
                           wygladz=True,
                           styki_ton=("leather", DROBNE[0])),
    # szczelina między cholewkami zamknięta obrysami → zaślepka ciemną skórą
    #   (`LEATHER[0]` nie jest w `DROBNE` i kontrola kolorów ją odrzuciła)
    "marching_boots": dict(cell=(1, 0), mat=("leather", "steel"),
                           zaslepka=("leather", DROBNE[0])),
    "mail_boots":     dict(cell=(1, 1), mat=("steel", "leather"), kolczuga=True,
                           podnies_stal=1),
    "steel_boots":    dict(cell=(1, 2), mat=("steel", "leather")),
    # ⭐ `przeswit`: tło między noskiem a płytą kostki JEST konstrukcją
    #   (prompt §9.2: „the magenta background shows through”) — kontrola
    #   zamkniętych dziur nie dotyczy tej sztuki. Jedyny taki wyjątek.
    "half_sabatons":  dict(cell=(1, 3), mat=("steel", "leather"), przeswit=True),
}
for _p in BUTY.values():
    _p["arkusz"] = "boots"
#: Rękawice (wsad 7): JEDNA prawa rękawica grzbietem, kciuk w lewo (§10.1).
#: Sloty bez warstw. Komórka (1,3) to zmyślona hybryda (kopuła + łuski) —
#: pominięta.
REKAWICE = {
    "padded_gloves":   dict(cell=(0, 0), mat=("linen",), faktura="pikowanie"),
    # ⛔ Gemini włożyło w owijki gołe PALCE (skóra) mimo „no hand inside”
    # znoszone: bez najjaśniejszego stopnia lnu — inaczej czytały się jak
    #   nowe rękawice pikowane obok (§10.1: „szarsze”)
    "worn_wraps":      dict(cell=(0, 1), mat=("linen",), bez_skory=True,
                            stopnie={"linen": (0, 1, 2)}),
    "leather_gloves":  dict(cell=(0, 2), mat=("leather",)),
    "mail_gloves":     dict(cell=(0, 3), mat=("steel", "leather"), kolczuga=True,
                            lapawica=0.45),
    "steel_gauntlets": dict(cell=(0, 4), mat=("steel", "leather"), sprzataj=True),
}
#: Naramienniki (wsad 7): JEDEN, od zewnątrz ramienia, kopuła u góry.
NARAMIENNIKI = {
    # ⚠ kontrast 30: arkusz narysował go ciemno — jaśniejsze stopnie
    "leather_pauldrons":  dict(cell=(1, 0), mat=("leather",),
                               stopnie={"leather": (4, 7, 10, 11)}),
    "lamellar_pauldrons": dict(cell=(1, 1), mat=("steel", "leather"), faktura="lamele",
                               sprzataj=True, wygladz_kafel=True),
    "scale_pauldrons":    dict(cell=(1, 2), mat=("steel", "leather"), faktura="luski",
                               sprzataj=True, wygladz_kafel=True),
    "plate_pauldrons":    dict(cell=(1, 4), mat=("steel",)),
}
for _p in (*REKAWICE.values(), *NARAMIENNIKI.values()):
    _p["arkusz"] = "hands_shoulders"
PRZEDMIOTY = {**GLOWA, **KLATA_MIEKKA, **KLATA_METAL, **NOGI, **NOGI_METAL, **BUTY,
              **REKAWICE, **NARAMIENNIKI}

#: Żelazny bliźniak ← stalowa konstrukcja.
BLIZNIAKI = {"iron_coif": "mail_coif", "iron_helmet": "steel_helmet",
             "iron_hauberk": "mail_hauberk", "iron_chest": "steel_chest",
             "iron_chausses": "mail_chausses", "iron_legs": "steel_legs",
             "iron_boots": "steel_boots"}
#: Stare kafle `items.png` (col, row) — tylko do podglądu „przed/po".
STARE = {"cloth_coif": (1, 21), "padded_cap": (1, 21), "leather_helmet": (0, 21),
         "mail_coif": (6, 25), "iron_coif": (6, 25), "lamellar_coif": (2, 25),
         "steel_helmet": (2, 25), "iron_helmet": (2, 25), "spangenhelm": (2, 25),
         "kettle_hat": (0, 25),
         "linen_shirt": (2, 22), "gambeson": (1, 22), "arming_doublet": (2, 22),
         "leather_chest": (0, 22), "studded_leather": (3, 22),
         "hardened_leather_chest": (3, 22),
         "mail_hauberk": (6, 26), "iron_hauberk": (6, 26), "short_hauberk": (7, 26),
         "lamellar_chest": (2, 26), "scale_chest": (2, 26), "steel_chest": (2, 26),
         "iron_chest": (2, 26), "brigandine": (1, 26), "cuirass": (4, 26),
         "linen_trousers": (1, 23), "padded_chausses": (1, 23), "leather_legs": (0, 23),
         "mail_chausses": (6, 27), "iron_chausses": (6, 27), "demi_chausses": (7, 27),
         "lamellar_legs": (2, 27), "scale_legs": (2, 27), "steel_legs": (2, 27),
         "iron_legs": (2, 27), "splinted_greaves": (2, 27), "cuisses": (2, 27),
         "foot_wraps": (1, 24), "bast_shoes": (0, 24), "low_boots": (0, 24),
         "leather_boots": (0, 24), "marching_boots": (0, 24), "mail_boots": (6, 28),
         "steel_boots": (2, 28), "iron_boots": (2, 28), "half_sabatons": (0, 28),
         "padded_gloves": (0, 20), "worn_wraps": (0, 20), "leather_gloves": (7, 29),
         "mail_gloves": (6, 29), "steel_gauntlets": (2, 29), "leather_pauldrons": (0, 22),
         "lamellar_pauldrons": (2, 26), "scale_pauldrons": (2, 26), "plate_pauldrons": (2, 26)}


# ════════════════════════════════════════════════════════════════════════
def bez_tla(a):
    """⚠ Ciasny próg od DOKŁADNEJ magenty, nie heurystyka nasycenia
    (`tools/CLAUDE.md`: luźny próg zjadał Dobrawie spódnicę). Tło wsadu 2
    ma kilka odcieni (224..255, 0..1, 238..249) — najdalszy leży 34 od
    #FF00FF, więc 60 łapie wszystkie, a żaden kolor przedmiotu nie jest
    bliżej niż ~150."""
    d = np.sqrt(((a[..., :3] - (255, 0, 255)) ** 2).sum(axis=2))
    a[d < 60, 3] = 0
    return a


def bez_kresek(k, min_px=30):
    """Zostawia wyłącznie DUŻE, nie-liniowe kawałki (8-spójne): kreski kraty
    i kreseczki przy krawędzi arkusza znikają. ⚠ Wsad 6 (buty) przyszedł
    z narysowanymi liniami między komórkami mimo „no grid lines” w bloku
    stylu. ⚠ Nie `plama`: para butów to DWA kawałki, a `plama` bierze jeden.
    ⚠ Najpierw pasy przy brzegu komórki: linia pionowa, pozioma i kreseczki
    u góry łączą się w RAMKĘ, która sama nie jest liniowa i przechodziła."""
    fg = k[..., 3] > 0
    H, W = fg.shape
    for y in (*range(3), *range(H - 3, H)):
        if fg[y].mean() > 0.6:
            k[y, :, 3] = 0
    for x in (*range(3), *range(W - 3, W)):
        if fg[:, x].mean() > 0.6:
            k[:, x, 3] = 0
    fg = k[..., 3] > 0
    seen = np.zeros_like(fg)
    for y0, x0 in zip(*np.nonzero(fg)):
        if seen[y0, x0]:
            continue
        komp, q = [], deque([(y0, x0)])
        seen[y0, x0] = True
        while q:
            y, x = q.popleft()
            komp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
        ys = [p[0] for p in komp]
        xs = [p[1] for p in komp]
        liniowy = min(max(ys) - min(ys), max(xs) - min(xs)) < 3
        if len(komp) < min_px or liniowy:
            for y, x in komp:
                k[y, x, 3] = 0
    return k


def bez_skory(k, zasieg=2):
    """Gołe palce (skóra) → przezroczyste, razem z obrysem w promieniu
    `zasieg` px od nich — obrys palców zostałby wiszącymi kreskami, a własny
    kontur dokłada `na_kafel`. Skóra: wyraźnie czerwieńsza od tkaniny
    (R−G ≥ 40 i R−B ≥ 60 przy R > 130); szarobeżowe owijki mają R−G ≤ 20.
    ⚠ Owijki (wsad 7): Gemini narysowało w nich palce mimo „no hand inside”."""
    r, g, b = k[..., 0], k[..., 1], k[..., 2]
    skora = (k[..., 3] > 0) & (r - g >= 40) & (r - b >= 60) & (r > 130)
    ciemny = (k[..., 3] > 0) & (k[..., :3].sum(axis=2) < 150)
    blisko = skora.copy()
    for _ in range(zasieg):
        d = blisko.copy()
        d[1:, :] |= blisko[:-1, :]
        d[:-1, :] |= blisko[1:, :]
        d[:, 1:] |= blisko[:, :-1]
        d[:, :-1] |= blisko[:, 1:]
        blisko = d
    k[skora | (ciemny & blisko), 3] = 0
    return bez_kresek(k, min_px=30)


def wytnij(arkusz, cell, rows=2, cols=4, kreski=False):
    a = np.array(arkusz.convert("RGBA")).astype(int)
    H, W = a.shape[:2]
    r, c = cell
    y0, y1 = round(r * H / rows), round((r + 1) * H / rows)
    x0, x1 = round(c * W / cols), round((c + 1) * W / cols)
    k = bez_tla(a[y0:y1, x0:x1].copy())
    if kreski:
        k = bez_kresek(k)
    im = Image.fromarray(k.astype(np.uint8))
    return im.crop(im.getbbox())


def wytnij_plame(arkusz, punkt):
    """Spójna (8-sąsiedztwo) plama nie-tła zawierająca `punkt`; reszta
    arkusza wygaszona. Punkt poza przedmiotem = błąd, nie zgadywanie."""
    a = bez_tla(np.array(arkusz.convert("RGBA")).astype(int))
    fg = a[..., 3] > 0
    H, W = fg.shape
    x0, y0 = punkt
    if not fg[y0, x0]:
        raise ValueError(f"punkt {punkt} leży na tle, nie na przedmiocie")
    moja = np.zeros_like(fg)
    moja[y0, x0] = True
    q = deque([(y0, x0)])
    while q:
        y, x = q.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not moja[ny, nx]:
                    moja[ny, nx] = True
                    q.append((ny, nx))
    a[~moja, 3] = 0
    im = Image.fromarray(a.astype(np.uint8))
    return im.crop(im.getbbox())


def wiekszosc(glosy):
    """Najczęstszy głos; REMIS rozstrzyga porządek sortowania.
    ⚠⚠ Nie `max(set(glosy), key=glosy.count)`: kolejność zbioru krotek
    z napisem (materiał) zależy od losowego haszowania napisów w Pythonie,
    więc przy remisie wynik zmieniał się MIĘDZY URUCHOMIENIAMI — złapane
    jako jeden piksel kaptura skórzanego, który raz był ciemny, raz jasny."""
    return max(sorted(set(glosy)), key=glosy.count)


def rozmiar_docelowy(w, h):
    k = WNETRZE / max(w, h)
    return max(1, round(w * k)), max(1, round(h * k))


def zmniejsz_glosowaniem(rgb, alfa, stopien, rampa):
    """Zmniejszenie MAPY TONÓW, nie obrazu: docelowy piksel dostaje ton, który
    przeważa w jego polu źródłowym (alfa: pokrycie > 50%). Średnia nie
    powstaje nigdy, więc nie powstają tony pośrednie.

    ⚠ Po co: miękki arkusz (wsad 2) po zmniejszeniu BOX dawał tysiące
    pośrednich kolorów, które po przyciągnięciu do rampy układały się
    w plamy — nawet po wygładzaniu na małym kaflu. Tony i wygładzanie idą
    więc w PEŁNEJ rozdzielczości, a do 30 px schodzi już czysta mapa."""
    H, W = alfa.shape
    w, h = rozmiar_docelowy(W, H)
    o_rgb = np.zeros((h, w, 3), np.uint8)
    o_a = np.zeros((h, w), bool)
    o_st = np.full((h, w), -1)
    o_ra = np.full((h, w), "", dtype=object)
    for ty in range(h):
        y0, y1 = int(ty * H / h), max(int(ty * H / h) + 1, int((ty + 1) * H / h))
        for tx in range(w):
            x0, x1 = int(tx * W / w), max(int(tx * W / w) + 1, int((tx + 1) * W / w))
            blok = alfa[y0:y1, x0:x1]
            if blok.mean() <= 0.5:
                continue
            klucze = [(rampa[y, x], int(stopien[y, x])) for y in range(y0, y1)
                      for x in range(x0, x1) if alfa[y, x]]
            m, i = wiekszosc(klucze)
            o_a[ty, tx], o_ra[ty, tx], o_st[ty, tx] = True, m, i
            o_rgb[ty, tx] = KONTUR if m == "kontur" else RAMPY[m][i]
    return o_rgb, o_a, o_st, o_ra


def zdejmij_obwodke(rgb, alfa, stopien, rampa):
    """Kontur ARKUSZA leżący na brzegu sylwetki → przezroczysty; własny,
    jednopikselowy kontur dokłada `na_kafel`. ⚠ Przy głosowaniu obwódka
    Gemini (w pełnej rozdzielczości 2–3 px) przeżywała jako pas konturu,
    a `na_kafel` dokładał drugi — wychodziło 2 px czerni przy 1 px
    u tarcz i sztyletów. Przy BOX tego nie było: uśrednianie rozmywało
    obwódkę w ciemny brzeg materiału."""
    h, w = alfa.shape
    brzeg = []
    for y, x in zip(*np.nonzero(alfa & (rampa == "kontur"))):
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < h and 0 <= nx < w) or not alfa[ny, nx]:
                brzeg.append((y, x))
                break
    for y, x in brzeg:
        alfa[y, x] = False
        rampa[y, x], stopien[y, x] = "", -1


def zmniejsz(im):
    s = WNETRZE / max(im.size)
    size = (max(1, round(im.width * s)), max(1, round(im.height * s)))
    return im.resize(size, Image.BOX)


def przyciagnij(im, materialy, stopnie=None):
    """Każdy piksel → najbliższy kolor z ramp tej sztuki. Zwraca RGB, alfę
    i mapę (rampa, stopień) — stopień jest potrzebny kolczudze i żelazu."""
    a = np.array(im).astype(int)
    alfa = a[..., 3] > 127
    kandydaci = [(m, i, np.array(col)) for m in materialy for i, col in enumerate(RAMPY[m])]
    # ⚠ Kontur jako ton WEWNĘTRZNY: szczelina wzroku, otwory, szczeliny lamelki
    #   są w arkuszu czarne. Bez tego kandydata przyciągały się do najciemniejszej
    #   stali i szczelina hełmu garnczkowego prawie znikała.
    kandydaci.append(("kontur", -1, np.array(KONTUR)))
    rgb = np.zeros(a.shape[:2] + (3,), np.uint8)
    stopien = np.full(a.shape[:2], -1)
    rampa = np.full(a.shape[:2], "", dtype=object)
    for y, x in zip(*np.nonzero(alfa)):
        p = a[y, x, :3]
        # waga jasności — przy ciemnych tonach odległość RGB myli barwę
        m, i, col = min(kandydaci, key=lambda t: ((p - t[2]) ** 2 * (3, 4, 2)).sum())
        rgb[y, x], stopien[y, x], rampa[y, x] = col, i, m
    wyrownaj(a, rgb, stopien, rampa, materialy, stopnie or {})
    return rgb, alfa, stopien, rampa


def jasnosc(c):
    c = np.asarray(c, float)
    return c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114


def wyrownaj(a, rgb, stopien, rampa, materialy, stopnie):
    """Najbliższy kolor decyduje wyłącznie o MATERIALE piksela. Jasność
    układa się od nowa: zakres źródła w obrębie materiału (2.–98. percentyl)
    rozciągnięty na dozwolone stopnie (`STOPNIE`).

    ⚠ Bez tego skórzany kaptur miał najjaśniejszy piksel 84 (tarcze z tego
    samego drewna: 150) — Gemini narysowało ciemną skórę i najbliższy kolor
    wziął ją wprost. W 1x kaptur był ciemną plamą."""
    for m in materialy:
        if m not in WYROWNUJ:
            continue
        maska = rampa == m
        if maska.sum() < 2:
            continue
        l = jasnosc(a[..., :3])[maska]
        lo, hi = np.percentile(l, 2), np.percentile(l, 98)
        st = stopnie.get(m, STOPNIE[m])
        lt = jasnosc([RAMPY[m][i] for i in st])
        lt = (lt - lt.min()) / max(1e-9, lt.max() - lt.min())
        t = np.clip((l - lo) / max(1e-9, hi - lo), 0, 1)
        wyb = np.array([st[int(np.argmin(np.abs(lt - v)))] for v in t])
        ys, xs = np.nonzero(maska)
        for y, x, i in zip(ys, xs, wyb):
            stopien[y, x] = i
            rgb[y, x] = RAMPY[m][i]


def oczysc(rgb, alfa, stopien, rampa):
    """Samotny piksel konturu WEWNĄTRZ sylwetki (żaden z 4 sąsiadów nie jest
    konturem, wszyscy są nieprzezroczyści) → najczęstszy kolor sąsiadów.
    To resztki obwódek arkusza po zmniejszeniu; w 1x czytają się jak szum.
    ⚠ Nie dla sztuk z `otwory=True` — otwory oddechowe to TEN SAM kształt."""
    h, w = alfa.shape
    kon = rampa == "kontur"
    for y, x in zip(*np.nonzero(kon)):
        if not (0 < y < h - 1 and 0 < x < w - 1):
            continue
        n4 = [(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)]
        if any(kon[p] or not alfa[p] for p in n4):
            continue
        sas = [(yy, xx) for yy in (y - 1, y, y + 1) for xx in (x - 1, x, x + 1)
               if (yy, xx) != (y, x) and alfa[yy, xx] and not kon[yy, xx]]
        klucze = [(rampa[p], int(stopien[p])) for p in sas]
        m, i = wiekszosc(klucze)
        rgb[y, x], stopien[y, x], rampa[y, x] = RAMPY[m][i], i, m


def wygladz(rgb, alfa, stopien, rampa, prog=5):
    """Filtr większościowy 3x3 na STOPNIACH w obrębie jednego materiału:
    piksel przejmuje stopień, który ma co najmniej `prog` z 8 sąsiadów tego
    samego materiału. Zdejmuje plamy po miękkim arkuszu, nie rusza krawędzi
    (kontur i inne materiały nie głosują)."""
    h, w = alfa.shape
    nowe = stopien.copy()
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            m = rampa[y, x]
            if not alfa[y, x] or m in ("", "kontur"):
                continue
            glosy = [int(stopien[yy, xx]) for yy in (y - 1, y, y + 1) for xx in (x - 1, x, x + 1)
                     if (yy, xx) != (y, x) and alfa[yy, xx] and rampa[yy, xx] == m]
            if glosy:
                naj = wiekszosc(glosy)
                if glosy.count(naj) >= prog:
                    nowe[y, x] = naj
    for y, x in zip(*np.nonzero(nowe != stopien)):
        stopien[y, x] = nowe[y, x]
        rgb[y, x] = RAMPY[rampa[y, x]][nowe[y, x]]


def _wnetrze(alfa, rampa, m):
    """Piksele materiału `m`, które NIE leżą na brzegu sylwetki — faktura na
    samym brzegu zjadałaby obrys."""
    h, w = alfa.shape
    out = np.zeros_like(alfa)
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if rampa[y, x] == m and alfa[y - 1:y + 2, x - 1:x + 2].all():
                out[y, x] = True
    return out


def faktura(rodzaj, rgb, alfa, stopien, rampa, stopnie, od=0, szczeliny=True):
    """Faktury drobniejsze niż 2 px, nakładane PO zmniejszeniu:
    `walki` — pionowe szwy co 3 px (przeszywanica: SZEROKIE wałki),
    `guziki` — rząd guzików środkiem + poziome szwy co 3 px (kaftan
               pikowany: gęste pikowanie, zapięcie z przodu),
    `cwieki` — siatka ćwieków co 3 px w szachownicę (skóra ćwiekowana)."""
    ys, xs = np.nonzero(alfa)
    cx = int(round((xs.min() + xs.max()) / 2))
    if rodzaj in ("walki", "guziki"):
        wn = _wnetrze(alfa, rampa, "linen")
        st = stopnie.get("linen", STOPNIE["linen"])
        for y, x in zip(*np.nonzero(wn)):
            szew = (rodzaj == "walki" and (x - cx) % 3 == 0) or                    (rodzaj == "guziki" and (y - ys.min()) % 3 == 0 and x != cx)
            if szew:
                i = st[max(0, st.index(stopien[y, x]) - 1)] if stopien[y, x] in st else stopien[y, x]
                stopien[y, x] = i
                rgb[y, x] = RAMPY["linen"][i]
        if rodzaj == "guziki":
            for y in range(ys.min() + 3, ys.max() - 1, 2):
                if wn[y, cx]:
                    rgb[y, cx], rampa[y, cx], stopien[y, cx] = KONTUR, "kontur", -1
    elif rodzaj == "cwieki":
        wn = _wnetrze(alfa, rampa, "leather")
        for y, x in zip(*np.nonzero(wn)):
            if (y % 3 == 0) and ((x + (y // 3) % 2 * 1) % 3 == 0):
                rgb[y, x], rampa[y, x], stopien[y, x] = CWIEK, "cwiek", -1
    elif rodzaj == "nity":
        # płótno najpierw wygładzone (BOX z cieniowanego arkusza dał plamy),
        # potem pojedyncze nity w RÓWNYCH rzędach i kolumnach, symetrycznie
        # od szwu — ćwieki skóry (wsad 2) idą w przesuniętą szachownicę.
        # ⚠ Były PARY sąsiednich pikseli (jak w arkuszu): w 1x zlewały się
        #   w białe paski i płótno czytało się jak pasiak.
        for _ in range(2):
            wygladz(rgb, alfa, stopien, rampa, prog=4)
        wn = _wnetrze(alfa, rampa, "canvas")
        for y, x in zip(*np.nonzero(wn)):
            if (y - ys.min()) % 3 == 1 and abs(x - cx) >= 2 and (abs(x - cx) - 2) % 3 == 0:
                rgb[y, x], rampa[y, x], stopien[y, x] = STEEL[NIT], "steel", NIT
    elif rodzaj == "luski":
        # ⭐ JEDEN wzór łuski dla klaty, nóg i barków (przegląd czytelności
        # 2026-09-30). Łuska = pole 4 px × pas 3 wiersze, pasy przesunięte
        # o 2. JEDEN ton na łuskę (większość z arkusza) — światło z lewej
        # góry zostaje na poziomie łusek, nie pikseli. Wiersze pasa: jasny
        # wierzch, ton łuski, ciemniej + dołek na styku łusek (łuk w dół).
        # ⚠ Był pas 2 × łuska 3 px, ton z arkusza per piksel (+ w nogach
        #   kropki skóry w dołku): szum 0,80–0,84 — w 1x migotało.
        wn = _wnetrze(alfa, rampa, "steel")
        y0 = ys.min()
        pole = lambda y, x: ((y - y0) // 3, (x - cx + 2 * (((y - y0) // 3) % 2)) // 4)
        tony = {}
        for y, x in zip(*np.nonzero(wn)):
            tony.setdefault(pole(y, x), []).append(int(stopien[y, x]))
        for y, x in zip(*np.nonzero(wn)):
            t = wiekszosc(tony[pole(y, x)])
            w = (y - y0) % 3
            if w == 0:
                t = min(4, t + 1)
            elif w == 2:
                t = 0 if (x - cx + 2 * (((y - y0) // 3) % 2)) % 4 == 0 else max(1, t - 1)
            rgb[y, x], stopien[y, x] = STEEL[t], t
    elif rodzaj == "lamele":
        # ⭐ JEDEN wzór lamelki dla klaty, nóg i barków (2026-09-30): co 4.
        # wiersz rzemień (skóra), w trzech pozostałych blaszki 2 px ze
        # szczeliną co 3 px (`szczeliny=False` — same pasy, dla wąskich nóg).
        # JEDEN ton na blaszkę (większość z arkusza). `od` — wiersze u góry
        # nietknięte (pas nogawic).
        # ⚠ Były trzy różne wzory (same szczeliny / rzędy co 3 / arkusz);
        #   rzędy co 3 z tonem per piksel dawały szum 0,78.
        wn = _wnetrze(alfa, rampa, "steel") | _wnetrze(alfa, rampa, "leather")
        y0 = ys.min() + od
        szer = 3 if szczeliny else 6
        pole = lambda y, x: ((y - y0) // 4, (x - cx) // szer)
        tony = {}
        for y, x in zip(*np.nonzero(wn)):
            if y >= y0 and rampa[y, x] == "steel":
                tony.setdefault(pole(y, x), []).append(int(stopien[y, x]))
        for y, x in zip(*np.nonzero(wn)):
            if y < y0:
                continue
            if (y - y0) % 4 == 3:
                rgb[y, x], rampa[y, x], stopien[y, x] = LEATHER[RZEMIEN], "leather", RZEMIEN
                continue
            t = max(1, wiekszosc(tony.get(pole(y, x), [2])))
            if szczeliny and (x - cx) % 3 == 0:
                t = max(0, t - 2)
            rgb[y, x], rampa[y, x], stopien[y, x] = STEEL[t], "steel", t
    elif rodzaj == "splot":
        # łapcie: plecionka w kratkę 2x2, JEDEN ton na oczko (większość
        # z arkusza), co drugie oczko o stopień ciemniej.
        # ⚠ Splot z arkusza zszedł do 1 px — szum 0,83.
        wn = _wnetrze(alfa, rampa, "bast")
        y0 = ys.min()
        pole = lambda y, x: ((y - y0) // 2, (x - cx) // 2)
        tony = {}
        for y, x in zip(*np.nonzero(wn)):
            tony.setdefault(pole(y, x), []).append(int(stopien[y, x]))
        for y, x in zip(*np.nonzero(wn)):
            t = wiekszosc(tony[pole(y, x)])
            if sum(pole(y, x)) % 2:
                t = t - 1 if t > 0 else 1
            rgb[y, x], stopien[y, x] = BAST[t], t
    elif rodzaj == "pikowanie":
        # rękawice pikowane: drobna kratka przeszyć — punkty szwu co 3 px
        # w obu kierunkach, o stopień ciemniej. Z arkusza (kropki co ~2 px
        # źródła) po zejściu nie zostało nic.
        wn = _wnetrze(alfa, rampa, "linen")
        st = stopnie.get("linen", STOPNIE["linen"])
        for y, x in zip(*np.nonzero(wn)):
            if (y - ys.min()) % 3 == 1 and (x - cx) % 3 == 0 and stopien[y, x] in st:
                i = st[max(0, st.index(stopien[y, x]) - 1)]
                rgb[y, x], stopien[y, x] = RAMPY["linen"][i], i


def styki_przy_brzegu(rgb, alfa, stopien, rampa, m="steel", i=0):
    """Kontur leżący NA brzegu sylwetki po `zdejmij_obwodke` → najciemniejszy
    ton materiału `m` (stal: 0; skóra: `DROBNE[0]` — skórzane buty, wsad 6). To końce linii styku płyt (pas, nakolannik, goleń) dochodzące do
    krawędzi — `na_kafel` dokłada obok własny kontur i wychodził podwójny
    obrys (nabiodrki: 0,152 przy progu 0,15). Styk zostaje w środku bryły."""
    pad = np.pad(alfa, 1)
    brzeg = alfa & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    for y, x in zip(*np.nonzero(brzeg & (rampa == "kontur"))):
        rgb[y, x], stopien[y, x], rampa[y, x] = RAMPY[m][i], i, m


def sprzataj(rgb, alfa, stopien, rampa, maks=3):
    """Śmieci po zmniejszeniu (wsad 5, zgłoszenie autora 2026-09-30):
    1. kępka konturu do `maks` px (4-spójna), która NIE dotyka tła — czarne
       dziury w pasie. Kępka przy tle to kształt (przerwa na kolanie), zostaje;
    2. kępka materiału do 2 px (pomarańczowe kropki klamer na krawędzi płyty);
    Oba → najczęstszy (materiał, stopień) sąsiadów bez konturu.
    3. ostroga sylwetki (piksel z jednym sąsiadem) → przezroczysty."""
    h, w = alfa.shape

    def zastap(y, x):
        sas = [(yy, xx) for yy in (y - 1, y, y + 1) for xx in (x - 1, x, x + 1)
               if (yy, xx) != (y, x) and 0 <= yy < h and 0 <= xx < w
               and alfa[yy, xx] and rampa[yy, xx] not in ("kontur", "")]
        if sas:
            m, i = wiekszosc([(rampa[p], int(stopien[p])) for p in sas])
            rgb[y, x], stopien[y, x], rampa[y, x] = RAMPY[m][i], i, m

    widziane = np.zeros_like(alfa)
    for y0, x0 in zip(*np.nonzero(alfa & (rampa == "kontur"))):
        if widziane[y0, x0]:
            continue
        komp, q, przy_tle = [], deque([(y0, x0)]), False
        widziane[y0, x0] = True
        while q:
            y, x = q.popleft()
            komp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if not (0 <= ny < h and 0 <= nx < w) or not alfa[ny, nx]:
                    przy_tle = True
                elif rampa[ny, nx] == "kontur" and not widziane[ny, nx]:
                    widziane[ny, nx] = True
                    q.append((ny, nx))
        if not przy_tle and len(komp) <= maks:
            for y, x in komp:
                zastap(y, x)
    # 2. kępka materiału ≤ 2 px (4-spójna) — ⚠ „samotny piksel" nie
    #    wystarczył: klamry przy krawędzi płyt nagolenników mają po 2 px
    widziane = np.zeros_like(alfa)
    for y0, x0 in zip(*np.nonzero(alfa)):
        m = rampa[y0, x0]
        if widziane[y0, x0] or m in ("kontur", ""):
            continue
        komp, q = [], deque([(y0, x0)])
        widziane[y0, x0] = True
        while q:
            y, x = q.popleft()
            komp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and alfa[ny, nx] and rampa[ny, nx] == m \
                        and not widziane[ny, nx]:
                    widziane[ny, nx] = True
                    q.append((ny, nx))
        if len(komp) <= 2:
            for y, x in komp:
                zastap(y, x)
    # 3. ostroga sylwetki — piksel z jednym nieprzezroczystym 4-sąsiadem
    #    (lamelka: jednopikselowy wyrostek u dołu nogawki; `symetria`
    #    skopiowałaby go na drugą nogę)
    for y, x in zip(*np.nonzero(alfa)):
        n4 = sum(1 for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))
                 if 0 <= y + dy < h and 0 <= x + dx < w and alfa[y + dy, x + dx])
        if n4 <= 1:
            alfa[y, x], rampa[y, x], stopien[y, x] = False, "", -1


def symetria(rgb, alfa, stopien, rampa, zrodlo="lewa"):
    """Prawa połowa z lewej (albo odwrotnie). ⭐ KSZTAŁT i materiał idą
    LUSTREM, TONY — PRZESUNIĘCIEM z bliźniaczego odcinka tego samego wiersza.
    Samo lustro dałoby prawej nodze światło z prawej, a światło jest
    z lewej góry (§3) — każda noga ma mieć jasny lewy brzeg.
    Oś: mediana środków wierszy (odporna na pojedynczy wystający piksel).
    ⚠ Po co: arkusz nabiodrek był symetryczny, a zmniejszenie + głosowanie
    dało skrzydełko nakolannika po jednej stronie i plamę w kroku obok środka.
    Zwraca NOWE tablice przycięte do sylwetki."""
    if zrodlo == "prawa":
        odw = [a[:, ::-1].copy() for a in (rgb, alfa, stopien, rampa)]
        wyn = symetria(*odw, zrodlo="lewa")
        return [a[:, ::-1].copy() for a in wyn]
    h, w = alfa.shape
    srodki = [xs.min() + xs.max() for xs in (np.nonzero(alfa[y])[0] for y in range(h)) if len(xs)]
    os2 = int(np.median(srodki))                 # podwojona oś (może być połówkowa)
    pad = w
    rgb_, alfa_, st_, ra_ = (np.pad(rgb, ((0, 0), (pad, pad), (0, 0))), np.pad(alfa, ((0, 0), (pad, pad))),
                             np.pad(stopien, ((0, 0), (pad, pad)), constant_values=-1),
                             np.pad(rampa, ((0, 0), (pad, pad)), constant_values=""))
    os2 += 2 * pad
    W = alfa_.shape[1]
    n_rgb, n_a, n_st, n_ra = rgb_.copy(), alfa_.copy(), st_.copy(), ra_.copy()
    for y in range(h):
        for x in range(W):
            if 2 * x <= os2:
                continue
            xm = os2 - x
            n_a[y, x] = alfa_[y, xm]
            if not alfa_[y, xm]:
                n_ra[y, x], n_st[y, x] = "", -1
                continue
            # odcinek lewej połowy zawierający xm → bliźniak przesunięty
            a = xm
            while a - 1 >= 0 and alfa_[y, a - 1]:
                a -= 1
            b = xm
            while 2 * (b + 1) < os2 and alfa_[y, b + 1]:
                b += 1
            xt = x - os2 + b + a
            m = ra_[y, xm]
            if m != "kontur" and 0 <= xt < W and alfa_[y, xt] and ra_[y, xt] == m:
                i = int(st_[y, xt])
            else:
                i = int(st_[y, xm])
            n_ra[y, x], n_st[y, x] = m, i
            n_rgb[y, x] = KONTUR if m == "kontur" else RAMPY[m][i]
    xs = np.nonzero(n_a.any(axis=0))[0]
    sl = slice(xs.min(), xs.max() + 1)
    return n_rgb[:, sl].copy(), n_a[:, sl].copy(), n_st[:, sl].copy(), n_ra[:, sl].copy()


def szachownica(rgb, alfa, stopien, rampa):
    """Kolczuga: co drugi piksel o stopień ciemniej. Stopień 0 (otwór twarzy,
    najgłębszy cień) zostaje — to nie jest siatka, tylko dziura w niej."""
    for y, x in zip(*np.nonzero(alfa & (stopien >= 1))):
        if rampa[y, x] == "steel" and (x + y) % 2:
            stopien[y, x] -= 1
            rgb[y, x] = STEEL[stopien[y, x]]


def zebro(rgb, alfa, stopien, rampa):
    """Szyszak: żebro przez środek dzwonu — światło + cień obok, od czubka
    do opaski (opaska = najniższe wiersze o pełnej szerokości)."""
    ys, xs = np.nonzero(alfa)
    cx = int(round((xs.min() + xs.max()) / 2))
    szer = alfa.sum(axis=1)
    opaska = int(np.nonzero(szer >= 0.9 * szer.max())[0].min())
    for y in range(ys.min() + 2, opaska):
        for x, st in ((cx - 1, 4), (cx, 1)):
            if alfa[y, x]:
                rgb[y, x], stopien[y, x], rampa[y, x] = STEEL[st], st, "steel"


def zaslep_drobne_dziury(rgb, alfa, kolor, maks=20):
    """Tło zamknięte w sylwetce do `maks` px (prześwit pod brodą między
    tasiemkami a kokardką) → NAJCIEMNIEJSZY TON MATERIAŁU, czyli wnętrze
    nakrycia. ⚠ Pierwsza wersja zapełniała konturem i pod brodą czepca
    pikowanego wychodziła czarna plama. Większa dziura zostaje i zatrzymuje
    zapis w kontrolach. ⚠ `maks` 12 → 20 razem z cienkim konturem
    (`na_kafel`): kontur z 4-sąsiedztwa nie domyka już szpary po skosie
    i prześwit pod brodą czepca pikowanego urósł do 17 px."""
    h, w = alfa.shape
    seen = np.zeros_like(alfa)
    for y0 in range(h):
        for x0 in range(w):
            if alfa[y0, x0] or seen[y0, x0]:
                continue
            comp, q, brzeg = [], deque([(y0, x0)]), False
            seen[y0, x0] = True
            while q:
                y, x = q.popleft()
                comp.append((y, x))
                if y in (0, h - 1) or x in (0, w - 1):
                    brzeg = True
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and not alfa[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if not brzeg and len(comp) <= maks:
                for y, x in comp:
                    alfa[y, x] = True
                    rgb[y, x] = kolor


def na_kafel(rgb, alfa):
    """Wyśrodkowanie w 32x32 + kontur dookoła: dylatacja 4-SĄSIEDZTWA, czyli
    ta sama linia co u tarcz (`build_shield_icons.erozja`) — cienka, na
    skosach schodzi schodkiem przez rogi.
    ⚠⚠ Była 8-sąsiedztwa (jak u sztyletów): na każdym skosie i zaokrągleniu
    kontur wypełniał róg i czytał się jako DWA piksele. Razem z niezdjętą
    obwódką arkusza dało to „nieprzyzwoicie duży obrys" (autor, 2026-09-28)
    — na wszystkich 25 ikonach, przy zielonym raporcie. Sztyletom to nie
    szkodzi, bo głownia to proste pionowe i poziome odcinki."""
    h, w = alfa.shape
    out = np.zeros((R, R, 4), np.uint8)
    oy, ox = (R - h) // 2, (R - w) // 2
    m = np.zeros((R, R), bool)
    m[oy:oy + h, ox:ox + w] = alfa
    out[oy:oy + h, ox:ox + w, :3][alfa] = rgb[alfa]
    out[m, 3] = 255
    g = m.copy()
    g[1:, :] |= m[:-1, :]
    g[:-1, :] |= m[1:, :]
    g[:, 1:] |= m[:, :-1]
    g[:, :-1] |= m[:, 1:]
    ring = g & ~m
    out[ring] = (*KONTUR, 255)
    return out


def na_zelazo(arr):
    out = arr.copy()
    for s, i in zip(STEEL, IRON):
        hit = (arr[..., 3] > 0) & np.all(arr[..., :3] == s, axis=2)
        out[hit, :3] = i
    return out


# ════════════════════════════════════════════════════════════════════════
# Kontrole — każda sprawdzona psuciem danych.
# ════════════════════════════════════════════════════════════════════════
def dziury(alpha):
    bg = ~alpha
    reached = np.zeros_like(bg)
    q = deque((y, x) for y in range(R) for x in range(R)
              if (x in (0, R - 1) or y in (0, R - 1)) and bg[y, x])
    for y, x in q:
        reached[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < R and 0 <= nx < R and bg[ny, nx] and not reached[ny, nx]:
                reached[ny, nx] = True
                q.append((ny, nx))
    return int((bg & ~reached).sum())


def udzial_szachownicy(arr):
    """Odsetek bloków 2x2 w całości z metalu, które są SZACHOWNICĄ:
    przekątne równe, sąsiedzi różni. ⚠ Pierwsza miara („sąsiedzi w poziomie
    są różni") dawała kolczudze 0,63, a lamelce 0,59 — lamelka ma gęste
    pionowe szczeliny, więc też łapała. Wzór 2x2 łapie wyłącznie siatkę."""
    c = arr[..., :3].astype(int)
    c = c[..., 0] * 65536 + c[..., 1] * 256 + c[..., 2]
    # ⚠ bez stopnia 0: otwór twarzy kaptura to duża jednolita plama najciemniejszej
    #   stali i sam rozcieńczał wynik do 0,33 przy poprawnej siatce dookoła
    stal = np.zeros(arr.shape[:2], bool)
    for s in (*STEEL[1:], *IRON[1:]):
        stal |= np.all(arr[..., :3] == s, axis=2) & (arr[..., 3] > 0)
    a, b, cc, d = c[:-1, :-1], c[:-1, 1:], c[1:, :-1], c[1:, 1:]
    blok = stal[:-1, :-1] & stal[:-1, 1:] & stal[1:, :-1] & stal[1:, 1:]
    wzor = (a == d) & (b == cc) & (a != b)
    return float((blok & wzor).sum() / max(1, blok.sum()))


def odrebnosc(a, b):
    """Max z odrębności SYLWETKI (1−IoU) i TREŚCI (odsetek wspólnych pikseli
    o innym kolorze). Czepiec i czepiec pikowany mają prawie tę samą bryłę —
    różni je faktura, więc sama sylwetka zaniżałaby wynik."""
    ma, mb = a[..., 3] > 0, b[..., 3] > 0
    sil = 1 - (ma & mb).sum() / (ma | mb).sum()
    wsp = ma & mb
    tresc = np.any(a[..., :3] != b[..., :3], axis=2)[wsp].mean()
    return max(sil, tresc)


def gruby_kontur(arr):
    """Odsetek pikseli DRUGIEGO pierścienia od krawędzi (tuż pod konturem),
    które też są konturem — czyli jak często obrys ma 2 px zamiast 1.
    Wzorzec: tarcze drewniane 0,00. Przed poprawką 2026-09-28: 0,27–0,77."""
    al = arr[..., 3] > 0
    kon = al & np.all(arr[..., :3] == KONTUR, axis=2)
    pad = np.pad(al, 1)
    brzeg = al & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    pb = np.pad(brzeg, 1)
    drugi = al & ~brzeg & (pb[:-2, 1:-1] | pb[2:, 1:-1] | pb[1:-1, :-2] | pb[1:-1, 2:])
    return float((kon & drugi).sum() / max(1, drugi.sum()))


#: Tło kafla plecaka (`theme.slotBg` 0x1c2030) — na nim gracz widzi ikonę.
TLO_SLOTU = (0x1C, 0x20, 0x30)


def kontrast(arr):
    """Mediana jasności WNĘTRZA (bez konturu) minus jasność tła kafla.
    Przegląd czytelności 2026-09-30: żelazna kolczuga (28) w 1x była czarną
    plamą na tle slotu, napierśnik skórzany 21, brygantyna 25."""
    al = arr[..., 3] > 0
    L = jasnosc(arr[..., :3])
    wn = al & (L >= 20)
    return float(np.median(L[wn]) - jasnosc(TLO_SLOTU))


def szum(arr):
    """Odsetek pikseli wnętrza, które mają mniej niż 2 z 4 sąsiadów w tym
    samym kolorze — drobna faktura, która w 1x migocze zamiast czytać się
    jako materiał."""
    al = arr[..., 3] > 0
    rgb = arr[..., :3].astype(int)
    wn = al & (jasnosc(rgb) >= 20)
    same = np.zeros(al.shape, int)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        same += np.all(np.roll(np.roll(rgb, dy, 0), dx, 1) == rgb, axis=2)
    return float(((same < 2) & wn).sum() / max(1, wn.sum()))


#: ⭐ Progi CZYTELNOŚCI — ze WZORCA TARCZ (`build_shield_icons.py`), nie
#: z wyniku tego generatora (`tools/CLAUDE.md`: próg nie może być własnym
#: wynikiem). Tarcze drewniane: kontrast 51–63, szum 0,13–0,55 (puklerz).
#: ⚠ Kolczuga zwolniona z szumu — szachownica JEST jej tożsamością (§4.5).
MIN_KONTRAST = 50
MAX_SZUM = 0.55

MIN_ODREBNOSC = 0.25    # próg projektowy, nie wynik tego generatora
#: Zapas ponad wzorzec tarcz (0,00) na linie WEWNĘTRZNE leżące tuż przy
#: brzegu (szew rękawa, otwór szyi, szczelina rozcięcia) — nie obwódkę.
MAX_GRUBY_KONTUR = 0.15
MIN_SZACHOWNICA = 0.5   # kolczuga; gładka stal i lamelka są daleko niżej (raport)


def wytnij_przedmiot(arkusze, p):
    ark = ARKUSZE[p["arkusz"]]
    im = arkusze[p["arkusz"]]
    if "cell" in p:
        out = wytnij(im, p["cell"], *ark["grid"], kreski=ark.get("kreski", False))
        if p.get("bez_skory"):
            out = Image.fromarray(bez_skory(np.array(out).astype(int)).astype(np.uint8))
            out = out.crop(out.getbbox())
        if "skroc" in p:
            # wycięcie pasa wierszy [od, do) z gładkiej cholewki — brzeg
            # i stopa zostają nietknięte (wsad 6: skórzane buty miały
            # wysokość butów piechura, §9.4)
            od, do = p["skroc"]
            a = np.delete(np.array(out), np.s_[od:do], axis=0)
            out = Image.fromarray(a)
        return out
    return wytnij_plame(im, p["plama"])


PROG_SWIATLA = 8          # różnica jasności lewa-góra − prawa-dół poniżej → przebieg


def _jasnosc(c):
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


def pomiar_swiatla(arr):
    """Średnia jasność wnętrza po stronie lewej-górnej minus prawej-dolnej
    (względem środka masy). Broń i tarcze mają +34…+39."""
    a = arr[..., 3] > 0
    wn = a & ~np.all(arr[..., :3] == KONTUR, axis=-1)
    if not wn.any():
        return 0.0
    ys, xs = np.nonzero(wn)
    cy, cx = ys.mean(), xs.mean()
    yy, xx = np.mgrid[0:arr.shape[0], 0:arr.shape[1]]
    L = _jasnosc(arr[..., :3].astype(float))
    tl, br = wn & ((xx - cx) + (yy - cy) < 0), wn & ((xx - cx) + (yy - cy) > 0)
    return float(L[tl].mean() - L[br].mean()) if tl.any() and br.any() else 0.0


def przebieg_swiatla(arr):
    """Brzeg wnętrza od strony światła (sąsiad u góry/z lewej poza wnętrzem)
    o krok JAŚNIEJ, od strony cienia (dół/prawo) o krok CIEMNIEJ; narożniki
    z obu stron bez zmian. Krok w szczeblach rampy: 1, a w rampie gęstej
    (≥ 10 stopni, skóra = drewno) 2 — inaczej zmiana byłaby niewidoczna."""
    out = arr.copy()
    a = arr[..., 3] > 0
    wn = a & ~np.all(arr[..., :3] == KONTUR, axis=-1)
    H, W = wn.shape
    rampy = [STEEL, IRON, *RAMPY.values()]
    indeks = {}
    for r in rampy:
        for i, c in enumerate(r):
            indeks.setdefault(tuple(c), (r, i))
    poza = lambda y, x: not (0 <= y < H and 0 <= x < W) or not wn[y, x]
    for y, x in zip(*np.nonzero(wn)):
        jasny = poza(y - 1, x) or poza(y, x - 1)
        ciemny = poza(y + 1, x) or poza(y, x + 1)
        if jasny == ciemny:
            continue
        c = tuple(int(v) for v in arr[y, x, :3])
        if c not in indeks:
            continue
        r, i = indeks[c]
        krok = 2 if len(r) >= 10 else 1
        j = max(0, min(len(r) - 1, i + (krok if jasny else -krok)))
        out[y, x, :3] = r[j]
    return out


def gradient_swiatla(arr):
    """Wnętrze: trzecia część od lewej-góry o krok JAŚNIEJ, od prawej-dołu
    o krok CIEMNIEJ (rzut na przekątną względem środka masy), w obrębie
    własnej rampy. Tylko dla ikon, którym nie wystarczyło lustro i brzeg."""
    out = arr.copy()
    a = arr[..., 3] > 0
    wn = a & ~np.all(arr[..., :3] == KONTUR, axis=-1)
    ys, xs = np.nonzero(wn)
    cy, cx = ys.mean(), xs.mean()
    proj = (xs - cx) + (ys - cy)
    zakres = max(1.0, np.abs(proj).max())
    indeks = {}
    for r in [STEEL, IRON, *RAMPY.values()]:
        for i, c in enumerate(r):
            indeks.setdefault(tuple(c), (r, i))
    for y, x, pr in zip(ys, xs, proj):
        k = pr / zakres
        if -0.33 <= k <= 0.33:
            continue
        c = tuple(int(v) for v in arr[y, x, :3])
        if c not in indeks:
            continue
        r, i = indeks[c]
        krok = 2 if len(r) >= 10 else 1
        out[y, x, :3] = r[max(0, min(len(r) - 1, i + (krok if k < 0 else -krok)))]
    return out


#: Ikony, w których skóra dostaje jaśniejsze cienie (audyt 2026-10-03).
#: Wartość = najwyższy stopień rampy skóry, który jest rozjaśniany
#: (buty mają główny cień na stopniu 5, hełm niżej).
ROZJASNIJ_SKORE = {"leather_helmet": 4, "leather_boots": 5}


def kontrast_do_kafla(arr):
    a = arr[..., 3] > 0
    wn = a & ~np.all(arr[..., :3] == KONTUR, axis=-1)
    tlo = _jasnosc(np.array(TLO_SLOTU, float))
    return float(_jasnosc(arr[..., :3].astype(float))[wn].mean() - tlo)


def rozjasnij_cienie(arr, rampa, do_stopnia=4, krok=2):
    """Tony rampy o indeksie ≤ `do_stopnia` przesuwa o `krok` w górę rampy.
    Tylko dolna część rampy — średnie i jasne tony zostają, więc bryła nie
    traci cieniowania, a jedynie wychodzi z czerni."""
    out = arr.copy()
    idx = {tuple(c): i for i, c in enumerate(rampa)}
    a = arr[..., 3] > 0
    for y, x in zip(*np.nonzero(a)):
        c = tuple(int(v) for v in arr[y, x, :3])
        i = idx.get(c)
        if i is not None and i <= do_stopnia:
            out[y, x, :3] = rampa[min(len(rampa) - 1, i + krok)]
    return out


def main():
    arkusze = {k: Image.open(GEMINI / v["plik"]) for k, v in ARKUSZE.items()}
    ikony, bledy = {}, []
    for nazwa, p in PRZEDMIOTY.items():
        mat = p["mat"]
        if p.get("wygladz"):
            # miękkie źródło: tony + wygładzanie w PEŁNEJ rozdzielczości,
            # potem zmniejszenie głosowaniem (`zmniejsz_glosowaniem`)
            pelny = przyciagnij(wytnij_przedmiot(arkusze, p), mat, p.get("stopnie"))
            for _ in range(3):
                wygladz(*pelny)
            rgb, alfa, stopien, rampa = zmniejsz_glosowaniem(*pelny)
            zdejmij_obwodke(rgb, alfa, stopien, rampa)
            wygladz(rgb, alfa, stopien, rampa, prog=5)
        else:
            rgb, alfa, stopien, rampa = przyciagnij(zmniejsz(wytnij_przedmiot(arkusze, p)), mat,
                                                    p.get("stopnie"))
            # ⚠ także tu: ostry arkusz też ma obwódkę 2–3 px, która po BOX
            #   przyciąga się do konturu — bez tego kontur wychodził podwójny
            zdejmij_obwodke(rgb, alfa, stopien, rampa)
        if not p.get("otwory"):
            oczysc(rgb, alfa, stopien, rampa)
        if p.get("wygladz_kafel"):
            wygladz(rgb, alfa, stopien, rampa, prog=4)
        if p.get("styki"):
            styki_przy_brzegu(rgb, alfa, stopien, rampa, *p.get("styki_ton", ("steel", 0)))
        if p.get("sprzataj"):
            sprzataj(rgb, alfa, stopien, rampa)
        if p.get("symetria"):
            rgb, alfa, stopien, rampa = symetria(rgb, alfa, stopien, rampa, p["symetria"])
        if p.get("faktura"):
            faktura(p["faktura"], rgb, alfa, stopien, rampa, p.get("stopnie", {}),
                    p.get("faktura_od", 0), p.get("szczeliny", True))
        if p.get("lapawica"):
            # rękawice kolcze = ŁAPAWICA (opis: „palce zostają razem”), a Gemini
            # narysowało pięć palców. Sylwetka po zejściu jest już zwarta —
            # palce dzielą tylko ciemne kreski stali; w górnej części → ton
            # środkowy, szachownica idzie po nich jak po reszcie
            gr = int(alfa.shape[0] * p["lapawica"])
            for y, x in zip(*np.nonzero(alfa[:gr] & (rampa[:gr] == "steel") & (stopien[:gr] == 0))):
                rgb[y, x], stopien[y, x] = STEEL[2], 2
        if p.get("podnies_stal"):
            # buty kolcze: kolczuga z arkusza zeszła CIEMNA (stopnie 0–1), więc
            # szachownica „o stopień ciemniej” lądowała na 0, którego miara nie
            # liczy (otwór twarzy kaptura) — wynik 0,00 przy widocznej siatce
            for y, x in zip(*np.nonzero(alfa & (rampa == "steel"))):
                s_ = min(4, int(stopien[y, x]) + p["podnies_stal"])
                rgb[y, x], stopien[y, x] = STEEL[s_], s_
        if p.get("kolczuga"):
            szachownica(rgb, alfa, stopien, rampa)
        if p.get("zebro"):
            zebro(rgb, alfa, stopien, rampa)
        kafel = na_kafel(rgb, alfa)
        # ⚠ PO konturze, nie przed: dopiero obwódki dwóch tasiemek zamykają
        #   szparę między nimi — przed konturem dziury jeszcze nie ma.
        rgb32, alfa32 = kafel[..., :3], kafel[..., 3] > 0
        zm, zi = p.get("zaslepka", (mat[0], 0))
        zaslep_drobne_dziury(rgb32, alfa32, RAMPY[zm][zi])
        kafel[alfa32, 3] = 255
        ikony[nazwa] = kafel
    for zel, stal in BLIZNIAKI.items():
        ikony[zel] = na_zelazo(ikony[stal])

    print("=== ikony pancerza — głowa, klata, nogi ===")
    print(f"  {'id':<16} {'px':>4}  bbox           kolory  szachownica  kontrast  szum")
    for nazwa, arr in ikony.items():
        a = arr[..., 3] > 0
        ys, xs = np.nonzero(a)
        bok = max(xs.max() - xs.min() + 1, ys.max() - ys.min() + 1)
        kolory = {tuple(int(v) for v in px[:3]) for px in arr[a]}
        zrodlo = PRZEDMIOTY.get(nazwa) or PRZEDMIOTY[BLIZNIAKI[nazwa]]
        st = zrodlo.get("stopnie", {})
        dozwolone = {tuple(RAMPY[m][i]) for m in zrodlo["mat"]
                     for i in (st.get(m, STOPNIE[m]) if m in WYROWNUJ else range(len(RAMPY[m])))}
        dozwolone |= {tuple(KONTUR)}
        if zrodlo.get("faktura") == "cwieki":
            dozwolone |= {tuple(CWIEK)}
        if nazwa in BLIZNIAKI:
            dozwolone = (dozwolone - {tuple(c) for c in STEEL}) | {tuple(c) for c in IRON}
        obce = kolory - dozwolone
        sz = udzial_szachownicy(arr)
        print(f"  {nazwa:<16} {int(a.sum()):>4}  ({xs.min():>2},{ys.min():>2})-({xs.max():>2},{ys.max():>2})"
              f"  {len(kolory):>5}   {sz:.2f}      {kontrast(arr):>5.0f}   {szum(arr):.2f}")
        if bok > R - 2:
            bledy.append(f"{nazwa}: bok {bok} px — brak 1 px marginesu")
        if obce:
            bledy.append(f"{nazwa}: kolory spoza ramp swoich materiałów {sorted(obce)}")
        if dziury(a) and not zrodlo.get("przeswit"):
            bledy.append(f"{nazwa}: {dziury(a)} px zamkniętych dziur w sylwetce")
        gk = gruby_kontur(arr)
        if gk > MAX_GRUBY_KONTUR:
            bledy.append(f"{nazwa}: obrys podwójny na {gk:.0%} brzegu (> {MAX_GRUBY_KONTUR:.0%})")
        jest_kolcza = zrodlo.get("kolczuga", False)
        ko = kontrast(arr)
        if ko < MIN_KONTRAST:
            bledy.append(f"{nazwa}: za ciemny na tle kafla (kontrast {ko:.0f} < {MIN_KONTRAST})")
        sm = szum(arr)
        if not jest_kolcza and sm > MAX_SZUM:
            bledy.append(f"{nazwa}: faktura migocze w 1x (szum {sm:.2f} > {MAX_SZUM})")
        if jest_kolcza and sz < MIN_SZACHOWNICA:
            bledy.append(f"{nazwa}: kolczuga bez siatki (szachownica {sz:.2f} < {MIN_SZACHOWNICA})")
        if not jest_kolcza and sz >= MIN_SZACHOWNICA:
            bledy.append(f"{nazwa}: gładki metal czyta się jak kolczuga ({sz:.2f})")
    for zel, stal in BLIZNIAKI.items():
        if not np.array_equal(ikony[zel][..., 3], ikony[stal][..., 3]):
            bledy.append(f"{zel}: inna sylwetka niż {stal} — gatunek nie zmienia bryły")
        if np.array_equal(ikony[zel], ikony[stal]):
            bledy.append(f"{zel}: identyczny ze stalowym — rampa żelaza nie zadziałała")

    # odrębność liczy się W OBRĘBIE SLOTU — tam gracz porównuje towar
    najblizsze = (1.0, None)
    pary = [(a_, b_) for grupa in (list(GLOWA), [*KLATA_MIEKKA, *KLATA_METAL],
                                   [*NOGI, *NOGI_METAL], list(BUTY), list(REKAWICE),
                                   list(NARAMIENNIKI))
            for i, a_ in enumerate(grupa) for b_ in grupa[i + 1:]]
    for a_, b_ in pary:
        if True:
            o = odrebnosc(ikony[a_], ikony[b_])
            if o < najblizsze[0]:
                najblizsze = (o, (a_, b_))
            if o < MIN_ODREBNOSC:
                bledy.append(f"{a_} / {b_}: prawie identyczne ({o:.2f} < {MIN_ODREBNOSC})")
    print(f"\n  najbliższa para: {najblizsze[1]}  odrębność {najblizsze[0]:.2f}  (próg {MIN_ODREBNOSC})")
    for nazwa, arr in ikony.items():
        print(f"  sha1 {nazwa:<16} {hashlib.sha1(arr.tobytes()).hexdigest()[:12]}")

    # ⭐ Przebieg ŚWIATŁA (decyzja autora 2026-10-02, audyt §15 pliku broni):
    #   arkusze Gemini mają własne światło i część ikon była oświetlona słabo
    #   albo OD ZŁEJ STRONY (rękawice skórzane −14, onuce −11, łapcie −10…),
    #   przy +34…+39 w broni i tarczach. Tylko ikony poniżej progu; ton zmienia
    #   się wyłącznie W OBRĘBIE własnej rampy materiału.
    swiatlo_przed = {n: pomiar_swiatla(a) for n, a in ikony.items()}
    odbite, gradient = [], []
    for n, a in ikony.items():
        # ⭐ Światło ODWROTNE (z prawej): najpierw LUSTRO — przenosi całe
        #   oryginalne cieniowanie na właściwą stronę bez przemalowania; sam
        #   brzeg dawał tu +4…+8 i światło zostawało odwrotne (rękawice −14 → −9).
        #   Bezpieczne dla tego katalogu: hełmy, buty, rękawice i naramienniki są
        #   symetryczne albo parzyste (lewa rękawica = prawa w lustrze).
        if swiatlo_przed[n] < 0 and pomiar_swiatla(a[:, ::-1]) > swiatlo_przed[n]:
            a = np.ascontiguousarray(a[:, ::-1])
            odbite.append(n)
        if pomiar_swiatla(a) < PROG_SWIATLA:
            a = przebieg_swiatla(a)
        if pomiar_swiatla(a) < 0:
            # ostatni krok: światło padało OD DOŁU (lustro nie pomaga, a rękawic
            # nie wolno odwracać) — łagodny gradient całego wnętrza
            a = gradient_swiatla(a)
            gradient.append(n)
        ikony[n] = a
    for n, a in ikony.items():
        po = pomiar_swiatla(a)
        if po < 0:
            bledy.append(f"{n}: światło nadal odwrotne po przebiegu ({swiatlo_przed[n]:+.0f} → {po:+.0f})")
    poprawione = [n for n in ikony if swiatlo_przed[n] < PROG_SWIATLA]
    print(f"  w lustrze ({len(odbite)}): {', '.join(odbite)}")
    print(f"  gradient wnętrza ({len(gradient)}): {', '.join(gradient)}")
    print()
    print(f"  przebieg światła: {len(poprawione)} ikon "
          f"({', '.join(f'{n} {swiatlo_przed[n]:+.0f}→{pomiar_swiatla(ikony[n]):+.0f}' for n in poprawione)})")

    # ⭐ Najciemniejsze tony SKÓRY o krok jaśniej w ikonach na granicy kontrastu
    #   (decyzja autora 2026-10-03, audyt §15 pliku broni): cień skóry zlewał
    #   się z granatem kafla i konturem — kontrast 48–50 przy progu 50.
    for n in ROZJASNIJ_SKORE:
        if n in ikony:
            ikony[n] = rozjasnij_cienie(ikony[n], LEATHER, do_stopnia=ROZJASNIJ_SKORE[n])
            k = kontrast_do_kafla(ikony[n])
            if k < 52:
                bledy.append(f"{n}: kontrast {k:.0f} po rozjaśnieniu skóry (próg 52)")

    # ⭐ Wyśrodkowanie w polu (decyzja autora 2026-10-02, `tools/icon_center.py`).
    #   PO kontrolach kształtu: przesunięcie jest całkowite, więc sumy SHA1 wyżej
    #   opisują RYSUNEK, a położenie w kaflu sprawdza `bledy_srodka`.
    ikony = {n: wysrodkuj(a) for n, a in ikony.items()}
    bledy += bledy_srodka(ikony)

    if "--podglad" in sys.argv:
        podglad(ikony, Path(sys.argv[sys.argv.index("--podglad") + 1]))

    if bledy:
        print("\nBŁĘDY:")
        for b in bledy:
            print("  [X] " + b)
        print("⛔ Nic nie zapisano.")
        return 1
    if "--zapisz" not in sys.argv:
        print("\nwszystkie kontrole zielone — PRZYMIAR, nic nie zapisano (--zapisz)")
        return 0
    for nazwa, arr in ikony.items():
        Image.fromarray(arr, "RGBA").save(CEL / f"icon_armor_{nazwa}.png")
    print(f"\nZAPISANO {len(ikony)} ikon → {CEL.relative_to(KORZEN)}/icon_armor_*.png")
    return 0


#: Wiersze podglądu — jeden na grupę; żelazo obok swojej stali.
PODGLAD = (
    ["cloth_coif", "padded_cap", "leather_helmet", "mail_coif", "iron_coif",
     "lamellar_coif", "steel_helmet", "iron_helmet", "spangenhelm", "kettle_hat"],
    [*KLATA_MIEKKA],
    ["mail_hauberk", "iron_hauberk", "short_hauberk", "lamellar_chest", "scale_chest",
     "steel_chest", "iron_chest", "brigandine", "cuirass"],
    ["linen_trousers", "padded_chausses", "leather_legs", "mail_chausses",
     "iron_chausses", "demi_chausses"],
    ["lamellar_legs", "scale_legs", "steel_legs", "iron_legs", "splinted_greaves",
     "cuisses"],
    ["foot_wraps", "bast_shoes", "low_boots", "leather_boots", "marching_boots",
     "mail_boots", "steel_boots", "iron_boots", "half_sabatons"],
    [*REKAWICE, *NARAMIENNIKI],
)


def podglad(ikony, sciezka):
    """Na grupę: rząd nowych 10x, pod nim nowe 2x i 1x, pod nimi stare
    z items.png 2x."""
    S, gap = 10, 10
    sheet_items = Image.open(CEL / "items.png").convert("RGBA")
    blok = R * S + 2 * gap + (R * 2 + gap) * 2 + 20
    W = max(len(k) for k in PODGLAD) * (R * S + gap) + gap
    im = Image.new("RGBA", (W, blok * len(PODGLAD)), (40, 35, 31, 255))
    for g, kolej in enumerate(PODGLAD):
        y0 = g * blok
        for i, n in enumerate(kolej):
            ic = Image.fromarray(ikony[n], "RGBA")
            x = gap + i * (R * S + gap)
            im.alpha_composite(ic.resize((R * S, R * S), Image.NEAREST), (x, y0 + gap))
            y2 = y0 + R * S + 2 * gap
            im.alpha_composite(ic.resize((R * 2, R * 2), Image.NEAREST), (x, y2))
            im.alpha_composite(ic, (x + R * 2 + gap, y2 + R // 2))
            c, r = STARE[n]
            stary = sheet_items.crop((c * R, r * R, c * R + R, r * R + R))
            im.alpha_composite(stary.resize((R * 2, R * 2), Image.NEAREST),
                               (x, y2 + R * 2 + gap + 10))
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    im.save(sciezka)
    print(f"\npodgląd: {sciezka}")


if __name__ == "__main__":
    sys.exit(main())

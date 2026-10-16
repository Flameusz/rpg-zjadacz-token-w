"""Pancerz na modelu 3D — przedmioty z gry jako warstwy na postaci (pilot: TORS).

Moduł BLENDEROWY, importowany przez skrypty podglądu i eksportu.
⚠ **NIE ZAPISUJE char.blend** — elementy powstają w pamięci sesji.

── Kierunek (decyzja autora 2026-09-28) ─────────────────────────────────────
Model jest w BIELIŹNIE, a przedmioty nakładają się na niego jak w WoW: każda
założona sztuka to osobny węzeł `Pancerz_<id przedmiotu>`, widoczny wtedy, gdy
gracz ma ją na sobie (`Equipment.wornItemIds` → `Character3D`). Warstwy (L1
podkład → L2 ochrona → L3 wzmocnienie) leżą jedna NA drugiej: zewnętrzna jest
grubsza, więc przykrywa wewnętrzną tam, gdzie obie sięgają, a wewnętrzna wystaje
tam, gdzie zewnętrzna się kończy (rękawy przeszywanicy spod kolczugi).

⭐ PILOT 2026-10-03: obszar TORSU (15 sztuk `chest`). Nogi, stopy, głowa, dłonie
i ramiona zostają na razie na kolorach bazy (`char3d_zones`) — patrz
`sprawdz_pokrycie`, które wypisuje, co jest poza pilotem.

── Jak to działa (i dlaczego jest tanie) ─────────────────────────────────────
Element powstaje jako KOPIA fragmentu ciała, nie jako model rzeźbiony od zera.
Kopia dziedziczy **te same grupy wierzchołków i ten sam modyfikator Armature**,
więc porusza się z postacią bez jednej linijki riggingu — i bez ryzyka, że
pancerz rozjedzie się z ciałem w animacji, bo to dosłownie ta sama geometria.
⭐ Dlatego pancerz PRZEŻYWA zmianę bazy (`OI-134`): przebudowane ciało daje
przebudowany pancerz, bez ręcznej poprawki.

Napuchnięcie wzdłuż normalnych odsuwa go od skóry. ⚠ **Bez tego dochodzi do
z-fightingu**: dwie powierzchnie w dokładnie tym samym miejscu migoczą.
⚠ **Kolejność modyfikatorów ma znaczenie.** Napuchnięcie musi iść PO
Subdivision — na siatce bazowej przesunięcie wzdłuż normalnych daje kanciasty
wielościan zamiast gładkiej płyty.

── Kolor: Z IKONY ────────────────────────────────────────────────────────────
⭐ Kolor sztuki to ton środkowy jej IKONY (`public/assets/items/icon_armor_<id>.png`),
więc model zgadza się z tym, co gracz widział w plecaku i w sklepie, a nowa
ikona sama przemalowuje model. ⛔ Nie wpisuj tu kolorów ręcznie.
"""
import json
import os
import struct
import subprocess
import tempfile
import zlib

import bpy
import bmesh

from char3d_zones import BONE_ZONE  # noqa: F401  (mapa kości ↔ strefy, patrz niżej)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRZEDROSTEK = "Pancerz_"

# ── kości → kawałki ciała (nazwy rigu — NIENARUSZALNE, `postac3d_checkpoint` §5) ──
TORS = {"Bone.001", "Bone.002", "Bone.002_L", "Bone.002_R"}
BARKI = {"Bone.002_L.006", "Bone.002_R.006"}
RAMIONA = {"Bone.002_L.001", "Bone.002_R.001"}
PRZEDRAMIONA = {"Bone.002_L.002", "Bone.002_R.002", "Bone.002_L.004", "Bone.002_R.004"}
BIODRA = {"Bone"}
UDA = {"Bone_L.001", "Bone_R.001"}
LYDKI = {"Bone_L.002", "Bone_R.002", "Bone_L.003", "Bone_R.003"}   # kolano + goleń
STOPY = {"Bone_L.004", "Bone_R.004"}
DLONIE = {"Bone.002_L.003", "Bone.002_R.003"}

# Napuchnięcie wg WARSTWY (j. lokalne siatki) — zewnętrzna grubsza, więc
# zawsze przykrywa wewnętrzną. ⚠ Odstęp ≥ 0,04 między warstwami: mniejszy
# migotał na łuku barku (ta sama przyczyna co z-fighting skóry).
GRUBOSC_WARSTWY = {"L1": 0.05, "L2": 0.10, "L3": 0.15}

# ── POKRYCIE sztuk torsu: z KONSTRUKCJI, nie z materiału ────────────────────
# (kawałki ciała, dodatek do grubości warstwy, DÓŁ jako ułamek wzrostu)
#
# ⚠⚠ **Dolną krawędź wyznacza WYSOKOŚĆ, nie kość (2026-10-03).** Przy biodrach
# wagi miednicy i ud mieszają się, więc granica „kości dominującej" szła
# ZYGZAKIEM — przeszywanica i brygantyna kończyły się trójkątnymi zębami
# (render z gry). Ciało z generatora to POZIOME pierścienie, więc cięcie po
# wysokości środka ściany daje równy brzeg. Kości mówią „które części ciała",
# wysokość — „do kąd". Punkty orientacyjne (`char3d_base.PROPORCJE`):
# krocze 0,40 · biodro 0,45 · talia 0,56 wzrostu.
_KORPUS = TORS | BIODRA | UDA                                 # tors + to, co pod nim
_KOSZULA = _KORPUS | BARKI | RAMIONA | PRZEDRAMIONA           # długi rękaw
_KAMIZELKA = _KORPUS | BARKI
_KOLCZUGA = _KORPUS | BARKI | RAMIONA
_NAPIERSNIK = _KORPUS
# ⭐ NOGI = zawsze SPODNIE (decyzja autora 2026-09-28): jedna bryła od pasa,
# zszyta w kroku, do kostki — także nagolenniki i nabiodrki L3.
_SPODNIE = BIODRA | UDA | LYDKI
_STOPA = STOPY | LYDKI
_DLON = DLONIE | PRZEDRAMIONA
_NARAMIENNIK = BARKI | RAMIONA


def P(kosci, dodatek=0.0, dol=None, gora=None, x_min=None, x_max=None,
      glowa=None, brzeg=0.10, rondo=0.0, nosal=False, kopula=0.0, szpic=1.6, pas=None):
    """Pokrycie: kości (KTÓRE części ciała) + cięcia (DO KĄD).
    `dol`/`gora` — ułamek wzrostu od stóp (nogi, tors); `x_min`/`x_max` —
    |x| w j. świata, bo ręce w pozie spoczynkowej (T) leżą POZIOMO wzdłuż X."""
    return dict(kosci=kosci, dodatek=dodatek, dol=dol, gora=gora, x_min=x_min, x_max=x_max,
                glowa=glowa, brzeg=brzeg, rondo=rondo, nosal=nosal,
                kopula=kopula, szpic=szpic, pas=pas)


# ── GŁOWA: kopia siatki głowy (`Cube`, przypięta SZTYWNO do kości `Bone.004`) ──
# Dwa kształty z jednej metody (zmierzone na V3, świat, poza spoczynkowa):
#   „czapka" — wszystko powyżej linii brwi `brzeg` (z), linia opada ku tyłowi;
#   „kaptur" — cała głowa poza OWALEM TWARZY (oczy z −1,06…−0,03, przód = −Y).
# `rondo` (j.) — płaski pierścień ronda (kapalin), dokładany do kopii.
def _w_glowie(ksztalt, c, brzeg):
    if ksztalt == "czapka":
        return c.z >= brzeg - 0.45 * max(0.0, c.y) / 1.6
    if ksztalt == "kaptur":
        twarz = c.y < -0.35 and -1.45 < c.z < 0.25 and abs(c.x) < 0.95
        return not twarz
    raise ValueError(ksztalt)


# Grubość względem warstwy, wg SLOTU: spodnie chowają się pod koszulą i butami,
# rękawice i naramienniki leżą na wierzchu rękawa (inaczej ta sama grubość
# na nakładce = z-fighting na przedramieniu).
DODATEK_SLOTU = {"chest": 0.0, "legs": -0.015, "boots": 0.01, "gloves": 0.025,
                 "shoulders": 0.05, "head": 0.0}

POKRYCIE = {
    # ── TORS ─────────────────────────────────────────────────────────────
    # L1 — podkład
    # ⭐ `pas` (ułamek wzrostu) — RZEMIEŃ przepasujący koszulę (decyzja autora
    # 2026-10-03: strój startowy = koszula + spodnie + pas + łapcie). Ciemny
    # pas jasności między tułowiem a nogami czyta sylwetkę w małej skali.
    # ⚠ To GEOMETRIA koszuli, nie przedmiot: slot `belt` jest w układzie lalki
    # „planowany" i ożyje dopiero z pierwszym przedmiotem-pasem.
    # ⚠⚠ Pierwsza wersja (0,555) stała NA SPLOCIE SŁONECZNYM (autor, render
    # z gry): 0,56 to najwęższy pierścień tułowia generatora („talia"), a na tej
    # krępej figurze wypada tuż pod klatką. Pas nosi się na BIODRACH — nad
    # szczytem bioder (0,470), a koszula wystaje spod niego.
    "linen_shirt":            P(_KOSZULA, 0.00, dol=0.42, pas=0.488),     # do bioder
    "arming_doublet":         P(_KOSZULA, 0.01, dol=0.45),
    "gambeson":               P(_KOSZULA, 0.02, dol=0.37),     # długi, za krocze
    # L2 — ochrona zasadnicza
    "leather_chest":          P(_KAMIZELKA, 0.00, dol=0.47),
    "studded_leather":        P(_KAMIZELKA | RAMIONA, 0.01, dol=0.46),
    "hardened_leather_chest": P(_KAMIZELKA, 0.01, dol=0.47),
    "mail_hauberk":           P(_KOLCZUGA, 0.00, dol=0.30),    # do pół uda
    "iron_hauberk":           P(_KOLCZUGA, 0.00, dol=0.30),
    "short_hauberk":          P(_KOLCZUGA, 0.00, dol=0.40),
    # L3 — wzmocnienie
    "steel_chest":            P(_NAPIERSNIK, 0.00, dol=0.50),  # do pasa
    "iron_chest":             P(_NAPIERSNIK, 0.00, dol=0.50),
    "cuirass":                P(_NAPIERSNIK, 0.01, dol=0.49),
    "brigandine":             P(_NAPIERSNIK, 0.00, dol=0.43),
    "lamellar_chest":         P(_NAPIERSNIK, 0.01, dol=0.42),
    "scale_chest":            P(_NAPIERSNIK, 0.01, dol=0.42),
    # ── NOGI (do kostki: kostka 0,042 wzrostu) ───────────────────────────
    "linen_trousers":         P(_SPODNIE, 0.00, dol=0.045),
    "padded_chausses":        P(_SPODNIE, 0.01, dol=0.045),
    "leather_legs":           P(_SPODNIE, 0.00, dol=0.045),
    "mail_chausses":          P(_SPODNIE, 0.00, dol=0.045),
    "iron_chausses":          P(_SPODNIE, 0.00, dol=0.045),
    "demi_chausses":          P(_SPODNIE, 0.00, dol=0.05),
    "lamellar_legs":          P(_SPODNIE, 0.01, dol=0.05),
    "scale_legs":             P(_SPODNIE, 0.01, dol=0.05),
    "steel_legs":             P(_SPODNIE, 0.00, dol=0.05),
    "iron_legs":              P(_SPODNIE, 0.00, dol=0.05),
    "splinted_greaves":       P(_SPODNIE, 0.01, dol=0.05),
    "cuisses":                P(_SPODNIE, 0.01, dol=0.05),
    # ── STOPY (cholewa: `gora`; łydka ~0,125, kolano ~0,22 wzrostu) ──────
    "bast_shoes":             P(_STOPA, 0.00, gora=0.05),      # łapcie
    "foot_wraps":             P(_STOPA, 0.00, gora=0.14),      # onuce do pół łydki
    "low_boots":              P(_STOPA, 0.00, gora=0.07),      # trzewiki
    "leather_boots":          P(_STOPA, 0.00, gora=0.15),
    "marching_boots":         P(_STOPA, 0.01, gora=0.17),
    "mail_boots":             P(_STOPA, 0.00, gora=0.16),
    "iron_boots":             P(_STOPA, 0.00, gora=0.14),
    "steel_boots":            P(_STOPA, 0.00, gora=0.14),
    "half_sabatons":          P(_STOPA, 0.00, gora=0.06),      # sama stopa
    # ── DŁONIE (nadgarstek x≈5,29; pół przedramienia ≈4,55) ──────────────
    "worn_wraps":             P(_DLON, 0.00, x_min=5.05),
    "padded_gloves":          P(_DLON, 0.00, x_min=4.95),
    "leather_gloves":         P(_DLON, 0.00, x_min=4.85),
    "mail_gloves":            P(_DLON, 0.00, x_min=4.70),
    "steel_gauntlets":        P(_DLON, 0.01, x_min=4.45),      # mankiet do pół przedramienia
    # ── GŁOWA ────────────────────────────────────────────────────────────
    # ⚠⚠ Autor (2026-10-03): „czapki i hełmy czytają się jak fryzura". Ten sam
    # obły kształt co czupryna, za mały naddatek nad nią i brak krawędzi.
    # Lekarstwa: większa objętość (dodatek), CIEMNY OTOK przy brzegu, odblask
    # na szczycie metalu (`mnoznik_glowy`) i nosal tam, gdzie należy.
    # ⚠⚠ Drugi raz (2026-10-03, zrzuty z S21 FE): hełm czytał się jak KASZKIET —
    # kopia czaszki napuchnięta równo wszędzie jest szeroka i płaska, a ciemny
    # otok wyglądał jak daszek. `kopula` (j.) podnosi szczyt hełmu rosnąco od
    # brzegu (`szpic` = wykładnik: 1,6 obło, >2 stożek), więc hełm jest WYŻSZY
    # niż szeroki; czapka przeszywana i kaptury zostają bez kopuły — to czapki.
    "padded_cap":             P(set(), 0.04, glowa="czapka", brzeg=0.30),
    "cloth_coif":             P(set(), 0.00, glowa="kaptur"),
    "leather_helmet":         P(set(), 0.05, glowa="czapka", brzeg=0.10, kopula=0.30),
    "mail_coif":              P(set(), 0.00, glowa="kaptur"),
    "iron_coif":              P(set(), 0.00, glowa="kaptur"),
    "lamellar_coif":          P(set(), 0.00, glowa="kaptur"),
    "steel_helmet":           P(set(), 0.04, glowa="czapka", brzeg=0.05, nosal=True, kopula=0.50),
    "iron_helmet":            P(set(), 0.04, glowa="czapka", brzeg=0.05, nosal=True, kopula=0.50),
    "spangenhelm":            P(set(), 0.05, glowa="czapka", brzeg=-0.02, nosal=True, kopula=0.85, szpic=2.6),
    "kettle_hat":             P(set(), 0.05, glowa="czapka", brzeg=0.12, rondo=0.65, kopula=0.35),
    # ── RAMIONA — naramienniki (bark → pół ramienia, x≈2,7) ─────────────
    "leather_pauldrons":      P(_NARAMIENNIK, 0.00, x_max=2.75),
    "lamellar_pauldrons":     P(_NARAMIENNIK, 0.01, x_max=2.85),
    "scale_pauldrons":        P(_NARAMIENNIK, 0.01, x_max=2.85),
    "plate_pauldrons":        P(_NARAMIENNIK, 0.02, x_max=3.00),
}
WZROST_J = 12.834     # `docs/postac3d_checkpoint.md` §3 (zmierzone)
# Uniesienie głowy nad układ, w którym zmierzono progi hełmów (V3.6, bez szyi).
import char3d_base as _baza  # noqa: E402
DZ_GLOWY = _baza.PROPORCJE["glowa_uniesienie"] * _baza.WYSOKOSC
# ⭐ BAZA V4 (2026-10-10): głowa MNIEJSZA i niżej (`glow` 5,8, bez uniesienia).
# Progi hełmów (brzeg, owal twarzy, nosal, rondo, kopuła) są liczbami w świecie
# głowy V3.6 (`glow` 3,45, bez szyi) — kopia głowy jest więc przeliczana do tego
# układu (przesunięcie + skala wokół brody) i z powrotem. Przy proporcjach V3.7
# daje to dokładnie dawne przesunięcie o `DZ_GLOWY`.
from mathutils import Matrix as _M  # noqa: E402
_H = _baza.WYSOKOSC
_WYS_REF = _H / 3.45
_BR_REF = _baza.PODLOGA + _H - _WYS_REF
_WYS_NOW = _H / _baza.PROPORCJE["glow"]
_BR_NOW = _baza.PODLOGA + _H * (1.0 + _baza.PROPORCJE["glowa_uniesienie"]) - _WYS_NOW
GLOWA_DO_V36 = (_M.Translation((0.0, 0.0, _BR_REF)) @ _M.Scale(_WYS_REF / _WYS_NOW, 4)
                @ _M.Translation((0.0, 0.0, -_BR_NOW)))


def ustaw_glowe(P):
    """Przelicz `GLOWA_DO_V36` dla proporcji `P` (mieszkaniec w stylu
    `czytelny` ma inną głowę niż baza). Moduł czyta stałą przy KAŻDYM budowaniu
    nakrycia, więc wystarczy ją podmienić przed `zbuduj_pancerz`."""
    global GLOWA_DO_V36
    wys = _H / P["glow"]
    br = _baza.PODLOGA + _H * (1.0 + P["glowa_uniesienie"]) - wys
    GLOWA_DO_V36 = (_M.Translation((0.0, 0.0, _BR_REF)) @ _M.Scale(_WYS_REF / wys, 4)
                    @ _M.Translation((0.0, 0.0, -br)))


# ── WZÓR powierzchni (kolory wierzchołków) — z KONSTRUKCJI ──────────────────
# ⚠ Jednolity kolor sprawiał, że kolczuga czytała się jak szara TKANINA
# (render z gry 2026-10-03). Wzór mnoży kolor z ikony per wierzchołek; przy
# ~4 px na pierścień ciała to są plamy i pasy, nie detal — i o to chodzi.
def wzor_dla(item_id, armor_type):
    if armor_type == "mail":
        return "kolczuga"
    if armor_type == "metal":
        if "lamellar" in item_id or "scale" in item_id:
            return "luska"
        if "brigandine" in item_id:
            return "nity"
        return "plyta"
    if armor_type == "leather":
        return "skora"
    if item_id in ("gambeson", "arming_doublet", "padded_chausses", "padded_gloves"):
        return "pikowanie"
    if "splinted" in item_id:
        return "luska"
    return "len"


def _szum(x, y, z):
    """Deterministyczny szum −1..1 z pozycji (bez `random` — ten sam plik co bieg)."""
    import math
    s = math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
    return (s - math.floor(s)) * 2.0 - 1.0


def mnoznik_wzoru(wzor, p, os_x=0.0):
    """Mnożnik jasności dla punktu `p` (świat, poza spoczynkowa)."""
    import math
    if wzor == "kolczuga":
        return 1.0 + 0.20 * _szum(p.x, p.y, p.z)
    if wzor == "luska":
        rzad = 0.42                                   # wysokość rzędu płytek (j.)
        f = (p.z / rzad) % 1.0
        return 0.70 + 0.55 * f                        # jasna górna krawędź płytki
    if wzor == "plyta":
        grzbiet = math.exp(-((p.x - os_x) / 0.35) ** 2)   # środkowe żebro napierśnika
        return 0.92 + 0.18 * grzbiet + 0.04 * max(-1.0, min(1.0, (p.z + 3.5) / 1.5))
    if wzor == "nity":
        return 1.0 + (0.18 if int(math.floor(p.z / 0.5)) % 2 == 0 else -0.06)
    if wzor == "pikowanie":
        kat = math.atan2(p.x, p.y)
        return 1.0 + 0.16 * math.cos(kat * 14.0)          # pionowe przeszycia
    if wzor == "skora":
        return 1.0 + 0.08 * _szum(p.x, p.y, p.z)
    return 1.0 + 0.03 * _szum(p.x, p.y, p.z)


# ── roster z PRAWDZIWEGO modułu ─────────────────────────────────────────────
def pancerz_z_gry():
    """id → {slot, armorType, material, layer, iconTexture} (esbuild → node)."""
    zrodlo = os.path.join(ROOT, "tools", "armor_roster.mjs")
    with tempfile.TemporaryDirectory() as tmp:
        bundle = os.path.join(tmp, "roster.mjs")
        subprocess.run(
            f'npx esbuild "{zrodlo}" --bundle --format=esm --platform=node '
            f'--outfile="{bundle}" --log-level=error',
            cwd=ROOT, shell=True, check=True, capture_output=True)
        wyn = subprocess.run(f'node "{bundle}"', cwd=ROOT, shell=True,
                             check=True, capture_output=True)
    return json.loads(wyn.stdout.decode("utf-8"))


# ── kolor z ikony (czysty Python — Blender nie ma PIL) ──────────────────────
def _czytaj_png(sciezka):
    """(szer, wys, wiersze RGBA) dla 8-bitowego RGBA/RGB bez przeplotu."""
    with open(sciezka, "rb") as fh:
        dane = fh.read()
    assert dane[:8] == b"\x89PNG\r\n\x1a\n", sciezka
    poz, idat, szer, wys, typ = 8, b"", 0, 0, 6
    while poz < len(dane):
        dl, = struct.unpack(">I", dane[poz:poz + 4])
        rodzaj = dane[poz + 4:poz + 8]
        tresc = dane[poz + 8:poz + 8 + dl]
        if rodzaj == b"IHDR":
            szer, wys, glebia, typ, _k, _f, przeplot = struct.unpack(">IIBBBBB", tresc)
            assert glebia == 8 and przeplot == 0 and typ in (2, 6), (sciezka, glebia, typ)
        elif rodzaj == b"IDAT":
            idat += tresc
        poz += 12 + dl
    bpp = 4 if typ == 6 else 3
    surowe = zlib.decompress(idat)
    wiersze, poprz, i = [], bytearray(szer * bpp), 0
    for _ in range(wys):
        filtr = surowe[i]; i += 1
        w = bytearray(surowe[i:i + szer * bpp]); i += szer * bpp
        for x in range(len(w)):
            a = w[x - bpp] if x >= bpp else 0
            b = poprz[x]
            c = poprz[x - bpp] if x >= bpp else 0
            if filtr == 1:
                w[x] = (w[x] + a) & 255
            elif filtr == 2:
                w[x] = (w[x] + b) & 255
            elif filtr == 3:
                w[x] = (w[x] + (a + b) // 2) & 255
            elif filtr == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                w[x] = (w[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        wiersze.append(w); poprz = w
    if bpp == 3:
        wiersze = [bytearray(b for k in range(0, len(w), 3) for b in (*w[k:k + 3], 255)) for w in wiersze]
    return szer, wys, wiersze


def kolor_z_ikony(item_id, metal=False):
    """Ton środkowy ikony: mediana jasności wśród nieprzezroczystych pikseli
    BEZ konturu (najciemniejsze 20%) i blasku (najjaśniejsze 15%)."""
    sciezka = os.path.join(ROOT, "public", "assets", "items", f"icon_armor_{item_id}.png")
    szer, _wys, wiersze = _czytaj_png(sciezka)
    pk = [(w[x], w[x + 1], w[x + 2]) for w in wiersze for x in range(0, szer * 4, 4) if w[x + 3] > 200]
    if not pk:
        raise RuntimeError(f"ikona {sciezka} nie ma nieprzezroczystych pikseli")
    if metal:
        # ⚠ Ikona metalowej sztuki niesie też SKÓRĘ (paski, podkład) — mediana
        # całej ikony dawała nogom płytowym i lamelce kolor BRĄZOWY (render
        # z gry). Dla metalu bierzemy piksele NIENASYCONE, gdy jest ich dość.
        szare = [c for c in pk if max(c) - min(c) <= 22]
        if len(szare) >= len(pk) * 0.15:
            pk = szare
    pk.sort(key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])
    srodek = pk[int(len(pk) * 0.20):int(len(pk) * 0.85)] or pk
    return srodek[len(srodek) // 2]


# ⭐⭐ JASNOŚĆ wg SLOTU (2026-10-03, zrzuty z S21 FE: „szary kombinezon").
# Kolor sztuki to ton środkowy jej ikony, a ikony jednego materiału mają ten
# sam ton — komplet żelazny wychodził jednym szarym od hełmu po buty,
# a skórzany jednym brązem. Czytelna mała postać to BLOKI JASNOŚCI: jaśniejszy
# tors, ciemniejsze nogi, najciemniejsze dłonie i stopy (tak czyta się też
# tarcza: drewno / ciemny brzeg / jasne umbo). Mnożnik w sRGB, przed wzorem.
JASNOSC_SLOTU = {"head": 1.00, "chest": 1.00, "shoulders": 1.06,
                 "legs": 0.74, "gloves": 0.66, "boots": 0.56}


def _jasnosc_slotu(kolor, slot):
    m = JASNOSC_SLOTU.get(slot, 1.0)
    return tuple(max(0, min(255, round(c * m))) for c in kolor)


def _zbuduj_warianty():
    z_gry = pancerz_z_gry()
    out = {}
    for item_id, pk in POKRYCIE.items():
        g = z_gry.get(item_id)
        if g is None:
            continue                 # zgłosi `sprawdz_pokrycie`
        out[item_id] = {
            "nazwa": PRZEDROSTEK + item_id,
            **pk,
            "warstwa": g["layer"],
            "napuchniecie": (GRUBOSC_WARSTWY[g["layer"]] + pk["dodatek"]
                             + DODATEK_SLOTU.get(g["slot"], 0.0)),
            "kolor": _jasnosc_slotu(kolor_z_ikony(item_id, metal=g["armorType"] in ("metal", "mail")),
                                    g["slot"]),
            "metal": g["armorType"] in ("metal", "mail"),
            "wzor": wzor_dla(item_id, g["armorType"]),
        }
    return out, z_gry


WARIANTY, _Z_GRY = _zbuduj_warianty()


def _lin(c):
    v = c / 255.0
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def zbuduj_pancerz(wariant):
    """Tworzy element pancerza jako kopię fragmentu ciała i zwraca obiekt."""
    cfg = WARIANTY[wariant]
    nazwa = cfg["nazwa"]
    stary = bpy.data.objects.get(nazwa)
    if stary:
        bpy.data.objects.remove(stary, do_unlink=True)

    # Głowa to OSOBNA siatka przypięta sztywno do kości — kopia dziedziczy
    # rodzica (`parent_type='BONE'`), więc jedzie z głową bez skinowania.
    cialo = bpy.data.objects["Cube" if cfg["glowa"] else "Cube.001"]
    ob = cialo.copy()
    ob.data = cialo.data.copy()
    ob.name = nazwa
    ob.data.name = nazwa
    bpy.context.scene.collection.objects.link(ob)

    # --- zostaw tylko wielokąty należące do tego elementu ---
    gname = {g.index: g.name for g in ob.vertex_groups}
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.faces.ensure_lookup_table()
    warstwa = bm.verts.layers.deform.verify()
    do_kasacji = []
    dominanty = {}
    # Dół sztuki: wysokość w świecie, od najniższego punktu ciała (stopy).
    mw0 = ob.matrix_world
    if cfg["glowa"]:
        # ⚠ Progi hełmów (`brzeg`, owal twarzy, nosal, rondo) są w świecie
        # GŁOWY V3.6 — od szyi (2026-10-03) głowa stoi wyżej o `DZ_GLOWY`,
        # więc liczymy w układzie przesuniętym o tyle w dół.
        from mathutils import Matrix
        mw0 = GLOWA_DO_V36 @ mw0
    stopy_z = min((mw0 @ v.co).z for v in bm.verts) if not cfg["glowa"] else 0.0
    z_dol = stopy_z + cfg["dol"] * WZROST_J if cfg["dol"] is not None else -1e9
    z_gora = stopy_z + cfg["gora"] * WZROST_J if cfg["gora"] is not None else 1e9
    x_min = cfg["x_min"] if cfg["x_min"] is not None else -1.0
    x_max = cfg["x_max"] if cfg["x_max"] is not None else 1e9
    for f in bm.faces:
        c0 = mw0 @ f.calc_center_median()
        if cfg["glowa"]:
            if _w_glowie(cfg["glowa"], c0, cfg["brzeg"]):
                dominanty[f] = "glowa"
            else:
                do_kasacji.append(f)
            continue
        if not (z_dol <= c0.z <= z_gora and x_min <= abs(c0.x) <= x_max):
            do_kasacji.append(f)
            continue
        acc = {}
        for v in f.verts:
            for gi, waga in v[warstwa].items():
                nk = gname.get(gi)
                if nk:
                    acc[nk] = acc.get(nk, 0.0) + waga
        dominanta = max(acc, key=acc.get) if acc else None
        if dominanta not in cfg["kosci"]:
            do_kasacji.append(f)
        else:
            dominanty[f] = dominanta

    # ⚠⚠ **NORMALNE NA ZEWNĄTRZ, liczone od KOŚCI (2026-10-03).** Ciało z
    # generatora ma na większości ścian normalne skierowane DO ŚRODKA (materiały
    # są dwustronne, więc samo ciało wygląda dobrze) — a napuchnięcie idzie
    # wzdłuż normalnych, więc koszula i napierśnik chowały się W tułowiu,
    # a widać było tylko pas kolczugi na udach (zmierzone na renderze z gry).
    # Każda ściana dostaje lico od osi swojej kości na zewnątrz: niezależne od
    # nawinięcia pierścieni w generatorze i od lustra.
    # ⚠ Punktem odniesienia jest ŚRODEK CIĘŻKOŚCI ścian danej kości, nie oś
    # kości: ściana ZAMYKAJĄCA kończynę (czubek stopy, koniec dłoni) leży za
    # końcem kości i „od osi" wskazywała tam do środka — but miał na palcach
    # dziurę, przez którą świeciła skóra (render z gry, zbliżenie 6×).
    mw = ob.matrix_world
    n3 = mw.to_3x3()
    from mathutils import Vector
    suma, ile = {}, {}
    for f, kosc in dominanty.items():
        suma[kosc] = suma.get(kosc, Vector()) + mw @ f.calc_center_median()
        ile[kosc] = ile.get(kosc, 0) + 1
    srodek = {k: suma[k] / ile[k] for k in suma}
    odwroc = []
    for f, kosc in dominanty.items():
        radial = (mw @ f.calc_center_median()) - srodek[kosc]
        if (n3 @ f.normal).dot(radial) < 0.0:
            odwroc.append(f)
    if odwroc:
        bmesh.ops.reverse_faces(bm, faces=odwroc)
    zostaje = len(bm.faces) - len(do_kasacji)
    bmesh.ops.delete(bm, geom=do_kasacji, context="FACES")
    if cfg["kopula"]:
        _podnies_kopule(bm, mw0, cfg)
    pas_od = None
    if cfg["pas"] is not None:
        bm.verts.ensure_lookup_table()
        pas_od = len(bm.verts)
        _dodaj_pas(bm, mw0, stopy_z + cfg["pas"] * WZROST_J, warstwa)
    if cfg["rondo"]:
        _dodaj_rondo(bm, mw0, cfg)
    if cfg["nosal"]:
        _dodaj_nosal(bm, mw0, cfg)
    bm.to_mesh(me)
    bm.free()

    if zostaje == 0:
        raise RuntimeError(
            f"pancerz '{wariant}': ZERO wielokatow. Nazwy kosci w `kosci` nie "
            f"pasuja do rigu — sprawdz je wzgledem BONE_ZONE w char3d_zones.py")

    # --- materiał + WZÓR w kolorach wierzchołków ---
    from char3d_zones import _ustaw_kolor
    mnazwa = f"Z_{nazwa}"
    mat = bpy.data.materials.get(mnazwa) or bpy.data.materials.new(mnazwa)
    # ⚠ Kolor MUSI trafic tez do wezla Principled — patrz `char3d_zones._ustaw_kolor`:
    # eksporter glTF ignoruje `diffuse_color` i bez tego pancerz wyjezdza bialy.
    _ustaw_kolor(mat, (*[_lin(c) for c in cfg["kolor"]], 1.0))
    # Kolor z ikony × wzór, zapisany jako atrybut „Col" (COLOR_0 w glTF).
    # ⚠ Eksporter bierze kolory wierzchołków TYLKO wtedy, gdy materiał ich
    # używa — stąd węzeł Color Attribute wpięty w Base Color (kolor bazowy
    # siedzi już w atrybucie, więc czynnik zostaje biały).
    kol = me.color_attributes.get("Col") or me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    os_x = 0.0
    for v in me.vertices:
        pw = mw0 @ v.co
        if pas_od is not None and v.index >= pas_od:
            kol.data[v.index].color = (*[_lin(c) for c in KOLOR_PASA], 1.0)
            continue
        k = mnoznik_wzoru(cfg["wzor"], pw, os_x) * (mnoznik_glowy(cfg, pw) if cfg["glowa"] else 1.0)
        kol.data[v.index].color = (*[min(1.0, _lin(c) * k) for c in cfg["kolor"]], 1.0)
    tree = mat.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    wezel = next((n for n in tree.nodes if n.type == "VERTEX_COLOR"), None) or tree.nodes.new("ShaderNodeVertexColor")
    wezel.layer_name = "Col"
    tree.links.new(wezel.outputs["Color"], bsdf.inputs["Base Color"])
    mat.roughness = 0.45 if cfg["metal"] else 0.85
    mat.metallic = 0.0
    me.materials.clear()
    me.materials.append(mat)
    for poly in me.polygons:
        poly.material_index = 0

    # ⚠⚠ **BEZ podziału powierzchni (2026-10-03, `OI-160`).** Kopia niosła
    # `Subdivision` ciała i każda sztuka ważyła ~71 KB w `.glb` (pilot torsu:
    # 1,1 → 2,0 MB). Bez niego ~4× mniej wierzchołków; gładkie cieniowanie
    # chowa fasetki przy ~106 px postaci — sprawdzone na renderze z gry.
    for mod in [m for m in ob.modifiers if m.type == "SUBSURF"]:
        ob.modifiers.remove(mod)
    for poly in me.polygons:
        poly.use_smooth = True

    # --- odsunięcie od skóry (przed Armature — patrz nagłówek) ---
    disp = ob.modifiers.new("Napuchniecie", "DISPLACE")
    disp.mid_level = 0.0
    disp.strength = cfg["napuchniecie"]
    kolejnosc = [m.name for m in ob.modifiers]
    # Napuchnięcie tuż PRZED Armature: po lustrze, na pozie spoczynkowej.
    cel = next((i for i, m in enumerate(ob.modifiers) if m.type == "ARMATURE"), len(kolejnosc))
    while kolejnosc.index("Napuchniecie") > cel:
        with bpy.context.temp_override(object=ob):
            bpy.ops.object.modifier_move_up(modifier="Napuchniecie")
        kolejnosc = [m.name for m in ob.modifiers]

    print(f"[pancerz] {nazwa}: {cfg['warstwa']} wzor={cfg['wzor']} {zostaje} wielokatow ({len(odwroc)} odwrocone), "
          f"napuchniecie {cfg['napuchniecie']:.2f}, kolor {cfg['kolor']}")
    return ob


def mnoznik_glowy(cfg, p):
    """Otok i odblask hełmu/czapki (mnożnik jasności na wierzchołek)."""
    if cfg["glowa"] != "czapka":
        return 1.0
    linia = cfg["brzeg"] - 0.45 * max(0.0, p.y) / 1.6
    k = 1.0
    # Otok: na czapce szeroki i ciemny (szew), na hełmie WĄSKI — szeroki ciemny
    # pas nad czołem czytał się jak daszek kaszkietu (zrzuty z S21 FE).
    if p.z < linia + (0.20 if cfg["kopula"] else 0.40):
        k *= 0.62 if cfg["kopula"] else 0.50       # ciemny otok = KRAWĘDŹ hełmu
    if cfg["metal"]:
        k *= 1.0 + 0.30 * max(0.0, min(1.0, (p.z - 0.85) / (0.6 + cfg["kopula"])))   # odblask szczytu
    return k


# Rzemień: skóra ze wspólnej rampy drewna/skóry (`tools/wood_palette.py`).
from wood_palette import RAMPA as _RAMPA_SKORY  # noqa: E402
KOLOR_PASA = _RAMPA_SKORY[5]
PAS_POL_WYS = 0.22     # j. świata — rzemień ~6 cm, w grze ~2,5 px
PAS_ODSTEP = 0.07      # j. — ile rzemień stoi nad koszulą


def _dodaj_pas(bm, mw0, z_cel, warstwa):
    """Rzemień: pół-opaska (x ≥ 0, lustro dorobi drugą) na DOKŁADNEJ wysokości
    `z_cel`, odsunięta od koszuli na zewnątrz.

    ⚠ Punkty pasa są INTERPOLOWANE między dwoma pierścieniami tułowia, które
    obejmują `z_cel` — pierwsza wersja przyklejała się do najbliższego
    pierścienia i nie dało się jej postawić tam, gdzie pas się nosi. Wierzchołki
    dostają WAGI kości zmieszane tak samo — inaczej pas stałby w pozie
    spoczynkowej, gdy tułów idzie w chodzie i ciosie."""
    import math
    from mathutils import Vector
    inv = mw0.inverted()
    pts = [(v, mw0 @ v.co) for v in bm.verts if (mw0 @ v.co).x >= -1e-4]
    # pierścienie = skupiska wierzchołków o tym samym z
    ringi = {}
    for v, p in pts:
        ringi.setdefault(round(p.z, 2), []).append((v, p))
    zs = sorted(ringi)
    pod = max((z for z in zs if z <= z_cel), default=None)
    nad = min((z for z in zs if z > z_cel), default=None)
    if pod is None or nad is None or len(ringi[pod]) != len(ringi[nad]) or len(ringi[pod]) < 3:
        raise RuntimeError(f"pas: brak pary pierścieni tułowia wokół z={z_cel:.2f}")

    def po_kacie(r):
        cy = sum(p.y for _v, p in r) / len(r)
        return sorted(r, key=lambda vp: math.atan2(vp[1].x, vp[1].y - cy))   # tył → bok → przód

    a, b = po_kacie(ringi[pod]), po_kacie(ringi[nad])
    s = (z_cel - pod) / (nad - pod)
    cy = sum(p.y for _v, p in a + b) / (2 * len(a))
    gora, dol = [], []
    for (va, pa), (vb, pb) in zip(a, b):
        p = pa.lerp(pb, s)
        d = Vector((p.x, p.y - cy, 0.0))
        d = d.normalized() if d.length > 1e-6 else Vector((1.0, 0.0, 0.0))
        wagi = {}
        for v, w in ((va, 1.0 - s), (vb, s)):
            for gi, x in v[warstwa].items():
                wagi[gi] = wagi.get(gi, 0.0) + x * w
        for dz, lista in ((PAS_POL_WYS, gora), (-PAS_POL_WYS, dol)):
            nv = bm.verts.new(inv @ (p + d * PAS_ODSTEP + Vector((0.0, 0.0, dz))))
            nv[warstwa].clear()
            for gi, x in wagi.items():
                nv[warstwa][gi] = x
            lista.append((nv, d))
    for i in range(len(a) - 1):
        f = bm.faces.new((dol[i][0], dol[i + 1][0], gora[i + 1][0], gora[i][0]))
        f.normal_update()
        if (mw0.to_3x3() @ f.normal).dot(dol[i][1] + dol[i + 1][1]) < 0.0:
            f.normal_flip()


def _podnies_kopule(bm, mw0, cfg):
    """Szczyt hełmu w górę: przesunięcie rośnie od brzegu (0) do czubka
    (`kopula`) jak h^`szpic` — hełm wyższy niż szeroki zamiast kaszkietu."""
    from mathutils import Vector
    inv = mw0.inverted()
    pts = {v: mw0 @ v.co for v in bm.verts}
    gora = max(p.z for p in pts.values())
    for v, p in pts.items():
        linia = cfg["brzeg"] - 0.45 * max(0.0, p.y) / 1.6
        h = max(0.0, min(1.0, (p.z - linia) / max(1e-6, gora - linia)))
        v.co = inv @ (p + Vector((0.0, 0.0, cfg["kopula"] * h ** cfg["szpic"])))


def _dodaj_nosal(bm, mw0, cfg):
    """Nosal: wąski pasek od brzegu hełmu w dół, przed nosem (połowa x ≥ 0 —
    lustro dorobi drugą). Leży NA licu, więc stoi przed twarzą."""
    from mathutils import Vector
    inv = mw0.inverted()
    pts = [mw0 @ v.co for v in bm.verts]
    przod = min(p.y for p in pts if abs(p.x) < 0.3 and p.z > cfg["brzeg"] - 0.2)
    # ⚠ Napuchnięcie (~0,22 j.) i tak wypycha go w przód — przy `przod − 0,10`
    # nosal wisiał w profilu PRZED twarzą (render z gry). Startuje za licem.
    y = przod + 0.14
    z0, z1, s = cfg["brzeg"] + 0.05, -0.55, 0.13
    # ⚠ Kolejność wierzchołków = normalna DO PRZODU (−Y). Odwrotna dawała
    # normalną do tyłu i napuchnięcie wpychało nosal W TWARZ (render z gry).
    v = [bm.verts.new(inv @ Vector(c)) for c in
         ((0.0, y, z1), (s, y, z1), (s, y, z0), (0.0, y, z0))]
    bm.faces.new(v)


def _dodaj_rondo(bm, mw0, cfg):
    """Płaski PÓŁ-pierścień ronda (x ≥ 0 — lustro dorobi drugą połowę) na
    wysokości brzegu hełmu, w przestrzeni lokalnej kopii głowy."""
    import math
    from mathutils import Vector
    inv = mw0.inverted()
    pts = [mw0 @ v.co for v in bm.verts]
    z = cfg["brzeg"] + 0.02
    pas = [p for p in pts if abs(p.z - z) < 0.35] or pts
    cy = sum(p.y for p in pas) / len(pas)
    r_in = max(math.hypot(p.x, p.y - cy) for p in pas) * 0.92
    r_out = r_in + cfg["rondo"]
    n = 10
    wew, zew = [], []
    for i in range(n + 1):
        a = -math.pi / 2 + math.pi * i / n          # od −Y (przód) do +Y (tył), x ≥ 0
        for r, lista in ((r_in, wew), (r_out, zew)):
            lista.append(bm.verts.new(inv @ Vector((r * math.cos(a), cy + r * math.sin(a), z))))
    for i in range(n):
        bm.faces.new((wew[i], wew[i + 1], zew[i + 1], zew[i]))


def zbuduj_wszystkie():
    return {w: zbuduj_pancerz(w) for w in WARIANTY}


# Obszary, w których KAŻDA sztuka musi mieć model (głowa: osobny krok).
OBSZARY_GOTOWE = ("chest", "legs", "boots", "gloves", "shoulders", "head")


def sprawdz_pokrycie():
    """Lista BŁĘDÓW pilota + wydruk tego, co jest jeszcze poza nim.

    Błąd: sztuka TORSU z gry bez wpisu w `POKRYCIE` (gracz zakłada ją i nic nie
    widać), wpis bez przedmiotu albo bez ikony. Poza pilotem (inne obszary)
    to INFORMACJA, nie błąd — tamte obszary noszą dziś kolory bazy.
    """
    bledy = []
    for item_id, g in _Z_GRY.items():
        if g["slot"] in OBSZARY_GOTOWE and item_id not in POKRYCIE:
            bledy.append(f"{item_id}: sztuka obszaru {g['slot']} bez pokrycia 3D — gracz zakłada ją i nic nie widać")
    for item_id in POKRYCIE:
        if item_id not in _Z_GRY:
            bledy.append(f"{item_id}: pokrycie bez przedmiotu w grze")
        elif not os.path.exists(os.path.join(ROOT, "public", "assets", "items",
                                             f"icon_armor_{item_id}.png")):
            bledy.append(f"{item_id}: brak ikony — kolor modelu nie ma źródła")
    poza = sorted({g["slot"] for i, g in _Z_GRY.items() if i not in POKRYCIE})
    print(f"[pancerz] {len(WARIANTY)} sztuk na modelu; obszary jeszcze bez modelu: {poza}")
    for b in bledy:
        print("  BLAD:", b)
    return bledy

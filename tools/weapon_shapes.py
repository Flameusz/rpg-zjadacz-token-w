# -*- coding: utf-8 -*-
"""
KSZTAŁT I WYMIAR BRONI — JEDNO ŹRÓDŁO DLA MODELU 3D (bliźniak `shield_shapes.py`).

⭐⭐ Do 2026-10-03 broń w dłoni modelu była opisana DRUGI raz, niezależnie od
ikon: `char3d_weapons.BRONIE` trzymał jedenaście atrap z pudełek dobranych na
oko, a 26 broni z katalogu nie miało modelu wcale — postać trzymała
POWIETRZE (+ `console.warn`). Tu stoi długość, przekrój i sylwetka głowni /
głowy każdej broni z gry; `char3d_weapons.py` dokłada wyłącznie MOCOWANIE
(`chwyt`, `obrot`) — dokładnie podział tarcz (`shield_shapes` ↔
`char3d_shields`).

⛔ **Nie kopiuj stąd liczb do generatora — importuj.**

────────────────────────────────────────────────────────────────────────────
SKALA: historyczne cm do 120, dalej drzewce ×0,3
────────────────────────────────────────────────────────────────────────────
`dlugosc_gry_cm(cm) = cm` dla cm ≤ 120, powyżej `120 + (cm − 120) × 0,3`.

Skąd te dwie liczby — ⚠ ZMIERZONE, nie dobrane (2026-10-03): jedenaście
atrap sprzed tego pliku przeszło już bramkę ziemi i chwytu, a w ŚWIECIE
(armatura ma skalę 1,6527, 1 j. = 14,415 cm) wychodziły:
    miecz 95 cm (hist. 90) · młot bojowy 121 (120) · siekiera 74 (75) ·
    krótki miecz 67 (65) · sztylet 38 (35) · **włócznia 150 (220)**
czyli broń do ~120 cm stała w skali 1:1, a jedyna długa była skrócona.
Para (120; 0,3) odtwarza włócznię co do centymetra (120 + 100 × 0,3 = 150).
Ta sama zasada co w ikonach: „GROT w skali, DRZEWCE skrócone"
(`docs/gemini_weapon_icons.md` §11.1) — skraca się wyłącznie część
ROZCIĄGLIWA (drzewce, a u mieczy głownia), głowica i rękojeść nie.

⚠⚠ Powód skrócenia jest FIZYCZNY, nie estetyczny: kadr postaci ma ±5,8 j.
w poziomie (`Character3D.RENDER_W`), a pika w skali 1:1 (450 cm = 31 j.)
wychodziłaby poza niego trzykrotnie. Pilnuje tego bramka
`char3d_sprawdz_bron.py` (kolumna „rama").

────────────────────────────────────────────────────────────────────────────
PRZEKRÓJ: szerokość ustawia CZYTELNOŚĆ, nie historia
────────────────────────────────────────────────────────────────────────────
Postać w grze to ~8 px na jednostkę świata (~0,55 px/cm): 5-centymetrowa
głownia prawdziwego miecza miałaby 2,7 px. Szerokości i grubości są tu
w „centymetrach gry" — tych samych, w których atrapy przeszły ocenę na
renderze (głownia miecza ~10 cm, drzewce ~5 cm). Ta sama reguła co w ikonach:
skala dotyczy DŁUGOŚCI, szerokość ustawia czytelność.

────────────────────────────────────────────────────────────────────────────
UKŁAD OSI (cm, przestrzeń przedmiotu)
────────────────────────────────────────────────────────────────────────────
  y — wzdłuż broni, 0 = koniec rękojeści / drzewca, rośnie ku sztychowi
  x — w płaszczyźnie głowni / głowy; +x = OSTRZE (strona uderzająca)
  z — grubość (lico płyty patrzy w ±z)

Każda współrzędna y może być liczbą (cm od DOŁU) albo `G(n)` — n cm od
GÓRY broni. Część zakotwiczona od góry (grot, głowa) i część od dołu
(rękojeść, jelec) nie zmieniają się przy skracaniu; to, co je łączy,
rozciąga się samo.

    python tools/weapon_shapes.py      # tabela + samokontrola
"""
import math
import sys

# ── skala ───────────────────────────────────────────────────────────────────
PROG_CM = 120.0        # do tej długości broń stoi w skali 1:1
SKROT_DRZEWCA = 0.3    # współczynnik dla nadwyżki ponad próg
# ⭐ Rodzina DRZEWCOWA skraca się łagodniej (2026-10-03): jej tożsamością jest
# ZASIĘG (98–128 px w grze wobec 68 px miecza), a przy ×0,3 grot w pchnięciu
# lądował w połowie drogi do celu — zgłoszone wprost: „ataki drzewcowych są za
# krótkie". Przy ×0,6: włócznia 180 cm, pika 318 cm. Dalej skrócona, bo pełna
# pika (450 cm) nie mieści się ani w kadrze, ani w noszeniu pionowym.
SKROT_DRZEWCOWEJ = 0.6
# ⚠ ODSTĘPSTWO od reguły (cm historyczne → sufit, cm gry) — jedno, jawne:
# PIKA (450 cm) przy ×0,6 miałaby 318 cm, a broń noszona PIONOWO przy boku
# (`char3d_chod.NIESIENIE_DRZEWCE`) mieści się w kadrze najwyżej przy ~273 cm
# (grot ≤ górna krawędź, tylec ≥ grunt przy chwycie 82 cm; zmierzone
# 2026-10-03: 318 cm wystawało 4,1 j. nad kadr). Zasięgu to prawie nie zabiera:
# w pchnięciu liczy się część PRZED dłonią — 92 px wobec 96 przy 318 cm.
SUFIT_DLUGOSCI = {450: 273}
# ⚠⚠ DRUGIE ODSTĘPSTWO, w drugą stronę — DŁUGOŚĆ NA MODELU rodziny sztyletów
# (`OI-158`, decyzja autora 2026-10-03: „co to, obieraczka do ziemniaków?").
# Nóż 22 cm to prawdziwy nóż chłopski, ale połowa siedzi w pięści: widać było
# ~12 cm ostrza = 4–5 px na postaci 69 px. Na modelu nóż jest DUŻYM nożem
# chłopskim (saks/tasak: szeroka głownia bez jelca), a sztylet i mizerykordia
# rosną za nim, żeby kolejność rodziny została (nóż < sztylet < mizerykordia).
# `cm` zostaje długością historyczną — ikony, statystyki i zasięg w grze jej
# nie zmieniają; to wyłącznie model.
DLUGOSC_MODELU_CM = {"knife": 36.0, "dagger": 42.0, "misericorde": 48.0}
# ⭐ CZYTELNOŚĆ GŁÓW obuchów 1H (`OI-158`): przy ~70 px postaci łeb młotka,
# nadziaka i młota bojowego miał 3–4 px i trzy bronie były nie do odróżnienia.
# Ikony powiększają głowy ×1,1–1,4 — model robi to samo: wszystko PO pierwszej
# części (pięść/trzonek) skaluje się wokół środka głowy. Zasięg w grze czyta
# się z `GameConfig`, nie stąd — to wyłącznie prezentacja.
CZYTELNOSC_GLOWY = {"hammer": 1.30, "war_pick": 1.30, "war_hammer_1h": 1.35, "mace": 1.25}


def dlugosc_gry_cm(cm, rodzina=None, bron_id=None):
    """Długość broni na modelu (cm świata) z długości historycznej."""
    if bron_id in DLUGOSC_MODELU_CM:
        return DLUGOSC_MODELU_CM[bron_id]
    if cm <= PROG_CM:
        return float(cm)
    if cm in SUFIT_DLUGOSCI:
        return float(SUFIT_DLUGOSCI[cm])
    skrot = SKROT_DRZEWCOWEJ if rodzina == "polearm" else SKROT_DRZEWCA
    return PROG_CM + (cm - PROG_CM) * skrot


# ── kolory: ZE WSPÓLNYCH STANDARDÓW, ⛔ nie wpisuj tu własnych ──────────────
from wood_palette import RAMPA as _WOOD  # noqa: E402
from metal_palette import STEEL as _STEEL, IRON as _IRON  # noqa: E402

#: nazwa materiału → (kolor stali, kolor żelaza). Drewno i skóra nie mają
#: gatunku, więc oba pola są te same. Stopnie dobrane do atrap, które
#: przeszły ocenę na renderze (stal ~151, drewno #623b2d, skóra #49231d):
#: ⚠ ocena była przy DAWNYM świetle (rozproszone 1,8 + słońce 1,6 z przodu);
#: od 2026-10-03 słońce idzie z boku (`Character3D`), a te same stopnie
#: przeszły render z gry na trawie — zmieniając światło, obejrzyj je znów.
MATERIALY = {
    "stal":         (_STEEL[3], _IRON[3]),    # głownia, grot, ostrze
    "stal_ciemna":  (_STEEL[1], _IRON[1]),    # jelec, gałka, tuleja, łeb
    "drewno":       (_WOOD[6], _WOOD[6]),     # trzonek, drzewce
    "drewno_jasne": (_WOOD[9], _WOOD[9]),     # surowe drzewce (widły, cep)
    "kora":         (_WOOD[4], _WOOD[4]),     # konar, kij
    "skora":        (_WOOD[3], _WOOD[3]),     # owijka rękojeści
}


def kolor(mat, gatunek="steel"):
    s, i = MATERIALY[mat]
    return tuple(i if gatunek == "iron" else s)


# ── kotwica od góry ─────────────────────────────────────────────────────────
class G(float):
    """y liczone od GÓRY broni: `G(5)` = 5 cm poniżej sztychu / szczytu."""


def _y(v, L):
    return L - float(v) if isinstance(v, G) else float(v)


# ── części ──────────────────────────────────────────────────────────────────
# Każda część to słownik; `rozwin` zamienia je na geometrię w cm.
def pret(od, do, szer, gr=None, mat="drewno", x=0.0, szer_do=None):
    """Prostopadłościan wzdłuż osi (rękojeść, drzewce, obręcz). `szer_do`
    zwęża / poszerza go ku końcowi (pałka grubsza na końcu)."""
    return dict(typ="pret", od=od, do=do, szer=szer, szer_do=szer_do,
                gr=gr if gr is not None else szer, mat=mat, x=x)


def plyta(punkty, gr, mat="stal", plaszczyzna="xy"):
    """Wielokąt (x, y) wyciągnięty na grubość `gr` — głownia, głowa topora,
    pióro buzdygana. `plaszczyzna="zy"` stawia go w poprzek (drugie pióro)."""
    return dict(typ="plyta", punkty=punkty, gr=gr, mat=mat, plaszczyzna=plaszczyzna)


def kula(y, r, mat="stal_ciemna", x=0.0):
    """Elipsoida (gałka, kula kiścienia, głowa buzdygana). `r` = (rx, ry, rz)."""
    if not isinstance(r, (tuple, list)):
        r = (r, r, r)
    return dict(typ="kula", y=y, r=tuple(r), mat=mat, x=x)


def lancuch(od, do, ogniwo=4.0, gr=1.4, mat="stal_ciemna"):
    """Ogniwa naprzemiennie w płaszczyźnie xy i zy."""
    return dict(typ="lancuch", od=od, do=do, ogniwo=ogniwo, gr=gr, mat=mat)


# ── gotowe kształty ─────────────────────────────────────────────────────────
def glownia(od, szer, sztych, do=G(0), zwez=0.75, krzywizna=0.0,
            jednosieczna=False, mat="stal", gr=3.2, probki=8):
    """Głownia od `od` do `do`: szerokość `szer` przy jelcu, `zwez`×szer tuż
    przed sztychem, zbieg na długości `sztych`. `krzywizna` (cm) wygina ją
    w −x (grzbiet) — szabla. Jednosieczna: grzbiet prosty, sztych przy grzbiecie."""
    def gen(L):
        y0, y1 = _y(od, L), _y(do, L)
        ys = y1 - sztych
        prawa, lewa = [], []
        for k in range(probki + 1):
            t = k / probki
            y = y0 + (ys - y0) * t
            w = szer * (1 - (1 - zwez) * t) / 2
            c = -krzywizna * t ** 1.6
            if jednosieczna:
                prawa.append((c + w, y)); lewa.append((c - szer / 2, y))
            else:
                prawa.append((c + w, y)); lewa.append((c - w, y))
        c1 = -krzywizna
        szpic = (c1 - szer / 2, y1) if jednosieczna else (c1 - krzywizna * 0.15, y1)
        return prawa + [szpic] + lewa[::-1]
    return dict(typ="plyta", punkty=gen, gr=gr, mat=mat, plaszczyzna="xy")


def odG(punkty):
    """Wielokąt podany jako (x, n cm od góry) → punkty z kotwicą `G`."""
    return [(x, G(n)) for x, n in punkty]


def lustro(punkty):
    """Odbicie wielokąta w x (druga połowa labrysa, hak naprzeciw ostrza)."""
    return [(-x, y) for x, y in reversed(punkty)]


# ════════════════════════════════════════════════════════════════════════
# KATALOG — klucz = id przedmiotu z GameConfig
# ════════════════════════════════════════════════════════════════════════
# `cm`      — długość historyczna (ta sama tabela co ikony, §10/§11/§12/§13)
# `rodzina` — musi zgadzać się z `family` w GameConfig (samokontrola + bramka)
# `czesci`  — lista części; ⚠ pierwsza część to zawsze to, co jest w pięści

def _miecz(rekojesc, jelec, glownia_, gałka=None):
    cz = [pret(*rekojesc, mat="skora")]
    if gałka:
        cz.append(gałka)
    cz += [jelec, glownia_]
    return cz


BRONIE = {
    # ── sztylety ───────────────────────────────────────────────────────────
    "knife": dict(rodzina="dagger", cm=22, czesci=[
        pret(0, 11, 4.4, 3.0, mat="drewno"),
        # ⭐ DUŻY nóż chłopski: szeroka jednosieczna głownia, grzbiet prosty,
        # brak jelca (ikona: „narzędzie, nie oręż").
        glownia(11, 7.4, 8, jednosieczna=True, zwez=0.85, gr=2.6),
    ]),
    "dagger": dict(rodzina="dagger", cm=35, czesci=[
        pret(2, 11, 3.8, mat="skora"),
        kula(1.6, (2.6, 2.0, 2.6)),
        pret(11, 12.6, 12, 2.4, mat="stal_ciemna"),
        glownia(12.6, 6.6, 9, zwez=0.7, gr=2.6),                   # OI-158: 5,0 → 6,6
    ]),
    "misericorde": dict(rodzina="dagger", cm=40, czesci=[
        pret(2, 12, 3.6, mat="skora"),
        kula(1.6, (2.8, 2.0, 2.8)),
        pret(12, 13.4, 8, 2.4, mat="stal_ciemna"),
        glownia(13.4, 4.6, 16, zwez=0.85, gr=2.8),   # trójgraniasta igła (OI-158: 3,6 → 4,6)
    ]),

    # ── miecze ─────────────────────────────────────────────────────────────
    "short_sword": dict(rodzina="sword", cm=65, czesci=_miecz(
        (3, 13, 4.8), pret(13, 15.5, 20, 3.0, mat="stal_ciemna"),
        glownia(15.5, 11, 10, zwez=0.85), kula(2, (3.4, 2.6, 3.4)))),
    "messer": dict(rodzina="sword", cm=80, czesci=[
        pret(0, 15, 4.6, 3.0, mat="drewno"),             # płaska rękojeść z okładzin
        pret(15, 16.5, 13, 2.6, mat="stal_ciemna"),       # krótki jelec
        glownia(16.5, 9, 16, jednosieczna=True, zwez=0.9),
    ]),
    "cleaver_sword": dict(rodzina="sword", cm=85, czesci=[
        pret(0, 15, 4.8, mat="skora"),
        pret(15, 17, 16, 3.0, mat="stal_ciemna"),
        # ⭐ tożsamość: SZERSZA KU SZTYCHOWI, ścięty czubek
        plyta([(-4.5, 17), (4.5, 17), (7.5, G(5)), (4, G(0)), (-4.5, G(0))], 2.4),
    ]),
    "sword": dict(rodzina="sword", cm=90, czesci=_miecz(
        (3, 14, 4.8), pret(14, 16.5, 24, 3.0, mat="stal_ciemna"),
        glownia(16.5, 10, 12, zwez=0.7), kula(2, (3.6, 2.4, 3.6)))),
    "sabre": dict(rodzina="sword", cm=90, czesci=[
        pret(0, 14, 4.6, mat="skora"),
        kula(1.2, (3.0, 2.4, 3.0), x=-2.0),              # rękojeść zagięta na końcu
        pret(14, 16, 14, 3.0, mat="stal_ciemna"),
        # ⭐ tożsamość: KRZYWA głownia (wygięcie w stronę grzbietu)
        glownia(16, 8.5, 14, jednosieczna=True, zwez=0.9, krzywizna=9.0, probki=10),
    ]),
    "longsword": dict(rodzina="sword", cm=100, czesci=_miecz(
        (3, 20, 4.8), pret(20, 22.5, 26, 3.0, mat="stal_ciemna"),
        glownia(22.5, 8.5, 14, zwez=0.7), kula(2, (3.6, 2.4, 3.6)))),
    "rapier": dict(rodzina="sword", cm=110, czesci=[
        pret(3, 16, 4.4, mat="skora"),
        kula(2, (3.2, 2.4, 3.2)),
        pret(16, 17.6, 26, 2.2, mat="stal_ciemna"),       # długie, cienkie jelce
        kula(15, (6.5, 4.0, 6.5), mat="stal_ciemna"),     # ⭐ KOSZ osłaniający dłoń
        glownia(17.6, 3.6, 10, zwez=0.75, gr=2.0),        # igła
    ]),
    "bastard_sword": dict(rodzina="sword", cm=118, czesci=_miecz(
        # rękojeść „półtora dłoni": dłuższa niż u miecza, ale chwyt oburęczny
        # potrzebuje ODLEGLOSC_CHWYTU_2H (25 cm) między pięściami — stąd 4–28
        (4, 28, 4.8), pret(28, 30.5, 28, 3.0, mat="stal_ciemna"),
        glownia(30.5, 9, 14, zwez=0.7), kula(2.4, (3.6, 4.2, 3.6)))),   # gałka-gruszka
    "greatsword": dict(rodzina="sword", cm=135, czesci=_miecz(
        (4, 30, 5.0), pret(30, 33, 38, 3.2, mat="stal_ciemna"),
        glownia(33, 10, 16, zwez=0.72), kula(2.4, (4.0, 3.0, 4.0)))),
    "zweihander": dict(rodzina="sword", cm=180, czesci=_miecz(
        (4, 33, 5.0), pret(33, 36, 46, 3.4, mat="stal_ciemna"),
        glownia(36, 11, 18, zwez=0.72), kula(2.4, (4.2, 3.2, 4.2))) + [
        # ⭐ tożsamość: HACZYKI (parierhaken) nad jelcem
        plyta([(-11, 47), (-5.5, 47), (-5.5, 49.5), (-11, 48.5)], 2.6, mat="stal_ciemna"),
        plyta([(5.5, 47), (11, 47), (11, 48.5), (5.5, 49.5)], 2.6, mat="stal_ciemna"),
    ]),

    # ── topory ─────────────────────────────────────────────────────────────
    "hatchet": dict(rodzina="axe", cm=40, czesci=[
        pret(0, G(0), 4.2, mat="drewno"),
        plyta(odG([(-2.5, 0), (3, 0.5), (9.5, -1), (10.5, 9), (4, 6.5), (-2.5, 6)]), 2.2),
    ]),
    "axe": dict(rodzina="axe", cm=75, czesci=[
        pret(0, G(0), 4.6, mat="drewno"),
        # ostrze z przodu + PŁASKI OBUCH z tyłu (atak „Obuch")
        plyta(odG([(-5.5, 0.5), (4, 0), (13, -2), (14, 11), (5, 8), (-5.5, 7.5)]), 2.6),
    ]),
    "bearded_axe": dict(rodzina="axe", cm=70, czesci=[
        pret(0, G(0), 4.4, mat="drewno"),
        # ⭐ tożsamość: BRODA schodząca hakiem wzdłuż trzonka; brak obucha
        plyta(odG([(-2.5, 0), (4, 0), (12, -1.5), (13, 5), (10, 11), (5.5, 20),
                   (3, 20), (3.5, 8), (-2.5, 7)]), 2.2),
    ]),
    "battle_axe": dict(rodzina="axe", cm=105, czesci=[
        pret(0, G(0), 5.2, mat="drewno"),
        plyta(odG([(-2, 0), (4, 1), (15, -5), (17, 8), (15, 20), (4, 10), (-2, 9)]), 2.4),
        # obuch-młotek z tyłu
        plyta(odG([(-8, 1.5), (-2, 1.5), (-2, 8), (-8, 8)]), 5.0, mat="stal_ciemna"),
    ]),
    "dane_axe": dict(rodzina="axe", cm=140, czesci=[
        pret(0, G(0), 4.8, mat="drewno"),
        # ⭐ BARDZO szeroki, CIENKI blat, rogi w górę i w dół; nic z tyłu
        plyta(odG([(-2, 0), (4, 2), (14, -8), (19, 6), (14, 23), (4, 12), (-2, 10)]), 1.6),
    ]),
    "bardiche": dict(rodzina="axe", cm=160, czesci=[
        pret(0, G(0), 4.8, mat="drewno"),
        # ⭐ wąski, wysoki PÓŁKSIĘŻYC przypięty w dwóch miejscach
        plyta(odG([(2, -8), (8, -5), (11.5, 6), (11.5, 36), (9, 48), (2.5, 55),
                   (2.5, 46), (5.5, 38), (5.5, 9), (2, 3)]), 1.8),
    ]),
    "labrys": dict(rodzina="axe", cm=110, czesci=[
        pret(0, G(-2), 5.0, mat="drewno"),
        # ⭐ DWA identyczne ostrza — symetria
        plyta(odG([(-3, 2), (3, 2), (14, -5), (16, 8), (14, 21), (3, 13), (-3, 13),
                   (-14, 21), (-16, 8), (-14, -5)]), 2.2),
    ]),

    # ── obuchowe ───────────────────────────────────────────────────────────
    "stick": dict(rodzina="blunt", cm=70, czesci=[
        pret(0, 13, 4.0, mat="skora"),                    # owinięty chwyt
        pret(13, 40, 4.6, mat="kora"),
        pret(40, G(0), 4.4, mat="kora", x=1.2, szer_do=2.0),   # krzywa, zaostrzona
        kula(30, (3.0, 3.0, 3.0), mat="kora", x=-1.6),    # sęk
    ]),
    "club": dict(rodzina="blunt", cm=50, czesci=[
        pret(0, 18, 4.4, mat="drewno"),
        pret(18, G(0), 4.4, mat="drewno", szer_do=9.5),   # ⭐ grubszy na końcu
    ]),
    "great_club": dict(rodzina="blunt", cm=85, czesci=[
        pret(0, 25, 5.2, mat="kora"),
        pret(25, G(0), 5.2, mat="kora", szer_do=14),
        kula(G(14), (4.0, 4.0, 4.0), mat="kora", x=6.0),  # sęki
        kula(G(30), (3.0, 3.0, 3.0), mat="kora", x=-4.5),
    ]),
    "hammer": dict(rodzina="blunt", cm=60, czesci=[
        pret(0, G(0), 4.4, mat="drewno"),
        # ⭐ DUŻY, prostokątny łeb, oba lica płaskie
        plyta(odG([(-7.5, -0.5), (7.5, -0.5), (7.5, 7), (-7.5, 7)]), 6.5, mat="stal_ciemna"),
    ]),
    "mace": dict(rodzina="blunt", cm=60, czesci=[
        pret(0, 14, 4.0, mat="skora"),
        pret(14, G(8), 3.4, mat="stal_ciemna"),           # stalowy trzonek
        kula(G(6), (4.4, 6.0, 4.4), mat="stal_ciemna"),
        # ⭐ PIÓRA: dwa skrzyżowane pióra dają kołnierz z każdej strony
        plyta(odG([(0, -1), (7, 3), (7, 9), (0, 13), (-7, 9), (-7, 3)]), 1.2, mat="stal"),
        plyta(odG([(0, -1), (7, 3), (7, 9), (0, 13), (-7, 9), (-7, 3)]), 1.2, mat="stal",
              plaszczyzna="zy"),
        kula(G(0), (1.8, 1.8, 1.8), mat="stal"),          # gałka na szczycie
    ]),
    "war_pick": dict(rodzina="blunt", cm=65, czesci=[
        pret(0, G(0), 4.2, mat="drewno"),
        # ⭐ długi, zakrzywiony w DÓŁ dziób + malutki młotek z tyłu
        plyta(odG([(-2.5, 0), (2.5, 0), (13, 3.5), (18, 9.5), (12, 6.5), (2.5, 6),
                   (-2.5, 6)]), 3.0, mat="stal"),
        plyta(odG([(-7, 1), (-2.5, 1), (-2.5, 5), (-7, 5)]), 4.0, mat="stal_ciemna"),
    ]),
    "war_hammer_1h": dict(rodzina="blunt", cm=55, czesci=[
        pret(0, G(0), 4.2, mat="drewno"),
        plyta(odG([(-2.2, 0), (6.5, 0), (6.5, 6.5), (-2.2, 6.5)]), 5.0, mat="stal_ciemna"),
        plyta(odG([(-2.2, 2), (-11, 3.25), (-2.2, 4.5)]), 2.4, mat="stal"),   # kolec z tyłu
        plyta(odG([(-1.6, 0), (0, -7), (1.6, 0)]), 2.4, mat="stal"),          # szpic na górze
    ]),
    "war_hammer": dict(rodzina="blunt", cm=120, czesci=[
        pret(0, G(0), 5.2, mat="drewno"),
        plyta(odG([(-2.5, -0.5), (9.5, -0.5), (9.5, 8.5), (-2.5, 8.5)]), 7.0, mat="stal_ciemna"),
        plyta(odG([(-2.5, 2), (-15, 4), (-2.5, 6)]), 3.0, mat="stal"),        # kolec z tyłu
    ]),
    "flail": dict(rodzina="blunt", cm=75, czesci=[
        pret(0, 45, 4.4, mat="drewno"),
        lancuch(45, G(12)),
        kula(G(6), (6.0, 6.0, 6.0), mat="stal_ciemna"),   # ⭐ gładka kula
    ]),
    "chain_mace": dict(rodzina="blunt", cm=55, czesci=[
        pret(0, 34, 4.2, mat="skora"),                    # trzonek owinięty skórą
        pret(33, 35, 5.2, mat="stal_ciemna"),             # okucie
        lancuch(35, G(12), ogniwo=3.5),                   # ⭐ KRÓTKI łańcuch
        kula(G(6), (4.0, 6.0, 4.0), mat="stal_ciemna"),   # jajowaty ciężarek
        pret(G(8), G(7), 8.6, mat="stal"),                # obręcze
        pret(G(4.5), G(3.5), 8.0, mat="stal"),
    ]),
    "peasant_flail": dict(rodzina="blunt", cm=180, czesci=[
        pret(0, G(36), 4.6, mat="drewno_jasne"),          # długi kij
        lancuch(G(36), G(30), ogniwo=3.0),                # łącznik
        pret(G(30), G(0), 5.8, mat="drewno"),             # bijak
        pret(G(27), G(25), 6.8, mat="stal_ciemna"),       # okucia bijaka
        pret(G(16), G(14), 6.8, mat="stal_ciemna"),
        pret(G(4), G(2), 6.8, mat="stal_ciemna"),
    ]),

    # ── drzewcowe ──────────────────────────────────────────────────────────
    "spear": dict(rodzina="polearm", cm=220, czesci=[
        pret(0, G(24), 4.6, mat="drewno"),
        pret(G(26), G(18), 3.6, mat="stal_ciemna"),       # tuleja
        # ⭐ LIŚĆ grotu, nic poprzecznego
        plyta(odG([(0, 0), (4.8, 9), (2.2, 19), (-2.2, 19), (-4.8, 9)]), 1.8),
    ]),
    "pike": dict(rodzina="polearm", cm=450, czesci=[
        pret(0, G(14), 3.6, mat="drewno"),                # cieńsze drzewce
        pret(G(46), G(12), 4.4, 2.0, mat="stal_ciemna"),  # ⭐ langety
        plyta(odG([(0, 0), (2.2, 6), (1.4, 13), (-1.4, 13), (-2.2, 6)]), 1.8),   # szpic
    ]),
    "halberd": dict(rodzina="polearm", cm=200, czesci=[
        pret(0, G(20), 4.8, mat="drewno"),
        pret(G(40), G(16), 5.4, 2.2, mat="stal_ciemna"),  # langety
        plyta(odG([(-1.6, 20), (0, 0), (1.6, 20)]), 2.2),                       # szpic
        # ⭐ TRZY elementy: topór z przodu, HAK z tyłu
        plyta(odG([(1.5, 20), (8, 18), (16, 15), (17.5, 27), (14, 38), (8, 33), (1.5, 33)]), 2.0),
        plyta(odG([(-1.5, 23), (-9, 21), (-13, 16), (-8.5, 23.5), (-1.5, 28)]), 2.0),
    ]),
    "glaive": dict(rodzina="polearm", cm=210, czesci=[
        pret(0, G(52), 4.8, mat="drewno"),
        pret(G(56), G(50), 5.4, mat="stal_ciemna"),       # tuleja
        # ⭐ długa, JEDNOSIECZNA, lekko wygięta głownia; nic w bok
        plyta(odG([(-2, 52), (3.5, 52), (6, 38), (6.2, 22), (4, 9), (0, 0),
                   (-1, 10), (-2, 30)]), 2.0),
    ]),
    "boar_spear": dict(rodzina="polearm", cm=200, czesci=[
        pret(0, G(36), 4.8, mat="drewno"),
        pret(G(38), G(28), 4.0, mat="stal_ciemna"),
        # ⭐ POPRZECZKA pod piórami — cała tożsamość
        plyta(odG([(-9, 31), (9, 31), (9, 34), (-9, 34)]), 2.4, mat="stal_ciemna"),
        plyta(odG([(0, 0), (6.5, 12), (4, 28), (-4, 28), (-6.5, 12)]), 2.0),
    ]),
    "pitchfork": dict(rodzina="polearm", cm=160, czesci=[
        pret(0, G(30), 4.6, mat="drewno_jasne"),
        # ⭐ DWA długie zęby (U), matowe żelazo
        plyta(odG([(-6.5, 30), (6.5, 30), (6.5, 33), (-6.5, 33)]), 2.0),
        plyta(odG([(-6.5, 30.5), (-4.5, 30.5), (-5, 0), (-6, 0)]), 2.0),
        plyta(odG([(4.5, 30.5), (6.5, 30.5), (6, 0), (5, 0)]), 2.0),
    ]),
}


# ════════════════════════════════════════════════════════════════════════
# Geometria (cm) — czysty Python, bez Blendera, żeby dało się ją sprawdzić
# ════════════════════════════════════════════════════════════════════════
def _pudlo(x0, x1, y0, y1, z0, z1):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1),
         (x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return v, f


def _pret(c, L):
    y0, y1 = _y(c["od"], L), _y(c["do"], L)
    w0 = c["szer"] / 2
    w1 = (c["szer_do"] if c["szer_do"] is not None else c["szer"]) / 2
    t0 = c["gr"] / 2
    t1 = t0 * (w1 / w0) if c["szer_do"] is not None else t0
    x = c["x"]
    v = [(x - w0, y0, -t0), (x + w0, y0, -t0), (x + w0, y0, t0), (x - w0, y0, t0),
         (x - w1, y1, -t1), (x + w1, y1, -t1), (x + w1, y1, t1), (x - w1, y1, t1)]
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return v, f


def _plyta(c, L):
    pk = c["punkty"](L) if callable(c["punkty"]) else c["punkty"]
    pk = [(float(x), _y(y, L)) for x, y in pk]
    # orientacja CCW, żeby normalne wyszły na zewnątrz
    pole = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(pk, pk[1:] + pk[:1]))
    if pole < 0:
        pk = pk[::-1]
    n = len(pk)
    t = c["gr"] / 2
    if c["plaszczyzna"] == "zy":
        v = [(-t, y, x) for x, y in pk] + [(t, y, x) for x, y in pk]
        przod, tyl = list(range(n))[::-1], list(range(n, 2 * n))
    else:
        v = [(x, y, -t) for x, y in pk] + [(x, y, t) for x, y in pk]
        przod, tyl = list(range(n))[::-1], list(range(n, 2 * n))
    f = [tuple(przod), tuple(tyl)]
    for i in range(n):
        j = (i + 1) % n
        f.append((i, j, n + j, n + i))
    if c["plaszczyzna"] == "zy":       # zamiana osi odwraca skręt ścian
        f = [tuple(reversed(s)) for s in f]
    return v, f


def _kula(c, L, seg=8, pierscienie=5):
    y = _y(c["y"], L)
    rx, ry, rz = c["r"]
    v = [(c["x"], y - ry, 0.0)]
    for i in range(1, pierscienie):
        fi = math.pi * i / pierscienie
        for k in range(seg):
            th = 2 * math.pi * k / seg
            v.append((c["x"] + rx * math.sin(fi) * math.cos(th), y - ry * math.cos(fi),
                      rz * math.sin(fi) * math.sin(th)))
    v.append((c["x"], y + ry, 0.0))
    f = []
    for k in range(seg):
        f.append((0, 1 + (k + 1) % seg, 1 + k))
    for i in range(pierscienie - 2):
        a, b = 1 + i * seg, 1 + (i + 1) * seg
        for k in range(seg):
            k1 = (k + 1) % seg
            f.append((a + k, a + k1, b + k1, b + k))
    ost, szczyt = 1 + (pierscienie - 2) * seg, len(v) - 1
    for k in range(seg):
        f.append((ost + k, ost + (k + 1) % seg, szczyt))
    return v, f


def _lancuch(c, L):
    y0, y1 = _y(c["od"], L), _y(c["do"], L)
    n = max(1, round((y1 - y0) / (c["ogniwo"] * 0.8)))
    krok = (y1 - y0) / n
    v, f = [], []
    for i in range(n):
        a, b = y0 + i * krok - 0.2 * krok, y0 + (i + 1) * krok + 0.2 * krok
        sz, gr = c["ogniwo"] * 0.55, c["gr"]
        if i % 2:
            vv, ff = _pudlo(-gr / 2, gr / 2, a, b, -sz / 2, sz / 2)
        else:
            vv, ff = _pudlo(-sz / 2, sz / 2, a, b, -gr / 2, gr / 2)
        f += [tuple(x + len(v) for x in s) for s in ff]
        v += vv
    return v, f


_ROZWIN = {"pret": _pret, "plyta": _plyta, "kula": _kula, "lancuch": _lancuch}


def geometria(bron_id):
    """(wierzchołki cm, ściany, materiał ściany, długość gry cm)."""
    b = BRONIE[bron_id]
    L = dlugosc_gry_cm(b["cm"], b["rodzina"], bron_id)
    wierzch, sciany, mats = [], [], []
    k_glowy = CZYTELNOSC_GLOWY.get(bron_id, 1.0)
    glowa_od = None
    for i, c in enumerate(b["czesci"]):
        v, f = _ROZWIN[c["typ"]](c, L)
        if i == 1:
            glowa_od = len(wierzch)
        baza = len(wierzch)
        wierzch += v
        sciany += [tuple(i + baza for i in s) for s in f]
        mats += [c["mat"]] * len(f)
    if k_glowy != 1.0 and glowa_od is not None:
        g = wierzch[glowa_od:]
        sr = [(min(p[a] for p in g) + max(p[a] for p in g)) / 2 for a in range(3)]
        # ⚠ Szczyt głowy zostaje na końcu broni (y nie rośnie ponad L) —
        # powiększenie idzie w dół trzonka, nie wydłuża broni.
        gora = max(p[1] for p in g)
        nowe = [tuple(sr[a] + (p[a] - sr[a]) * k_glowy for a in range(3)) for p in g]
        przes = gora - max(p[1] for p in nowe)
        wierzch[glowa_od:] = [(p[0], p[1] + przes, p[2]) for p in nowe]
    return wierzch, sciany, mats, L


def zakres_y(bron_id):
    v, _f, _m, _L = geometria(bron_id)
    return min(p[1] for p in v), max(p[1] for p in v)


# ════════════════════════════════════════════════════════════════════════
# Samokontrola
# ════════════════════════════════════════════════════════════════════════
def bronie_z_gry(_sciezka=None):
    """id → {family, hands, grip, material} z PRAWDZIWEGO modułu GameConfig.

    ⚠⚠ **NIE parsujemy tekstu `GameConfig.ts`.** Liczy to
    `tools/weapon_roster.mjs` przez esbuild → node, tak jak
    `char3d_shields._konstrukcje_z_gry` liczy tarcze — regex po tekście raz
    już skłamał (tarcze ze spreadu: bramka widziała 2 z 30). Gdy toolchain nie
    wstanie, podnosimy wyjątek: bramka ma PAŚĆ, a nie przepuścić w ciemno.
    """
    import json
    import os
    import subprocess
    import tempfile

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zrodlo = os.path.join(root, "tools", "weapon_roster.mjs")
    with tempfile.TemporaryDirectory() as tmp:
        bundle = os.path.join(tmp, "roster.mjs")
        # ⚠ Windows: `npx` to `npx.cmd`; `shell=True` załatwia oba systemy.
        subprocess.run(
            f'npx esbuild "{zrodlo}" --bundle --format=esm --platform=node '
            f'--outfile="{bundle}" --log-level=error',
            cwd=root, shell=True, check=True, capture_output=True)
        wyn = subprocess.run(f'node "{bundle}"', cwd=root, shell=True,
                             check=True, capture_output=True)
    return json.loads(wyn.stdout.decode("utf-8"))


def samokontrola(z_gry=None):
    bledy = []
    z_gry = z_gry if z_gry is not None else bronie_z_gry()
    for bid in z_gry:
        if bid not in BRONIE:
            bledy.append(f"{bid}: broń z gry bez kształtu — postać trzymałaby powietrze")
    for bid, b in BRONIE.items():
        if bid not in z_gry:
            bledy.append(f"{bid}: kształt bez broni w GameConfig")
            continue
        fam = z_gry[bid]["family"]
        if fam and fam != b["rodzina"]:
            bledy.append(f"{bid}: rodzina {b['rodzina']} ≠ family {fam} w GameConfig")
        v, f, m, L = geometria(bid)
        lo, hi = min(p[1] for p in v), max(p[1] for p in v)
        # Część może wystawać ponad szczyt (szpic labrysa, berdysz) i pod
        # spód (gałka), ale nie o więcej niż kilkanaście cm.
        if lo < -4 or hi > L + 10:
            bledy.append(f"{bid}: geometria {lo:.1f}..{hi:.1f} cm poza długością 0..{L:.1f}")
        if hi < L - 1.0:
            bledy.append(f"{bid}: nic nie sięga szczytu ({hi:.1f} < {L:.1f}) — kotwica G źle")
        for mat in set(m):
            if mat not in MATERIALY:
                bledy.append(f"{bid}: nieznany materiał {mat}")
        for c in b["czesci"]:
            if c["typ"] in ("pret", "lancuch"):
                y0, y1 = _y(c["od"], L), _y(c["do"], L)
                if y1 <= y0:
                    bledy.append(f"{bid}: część {c['typ']} odwrócona ({y0:.1f} → {y1:.1f}) "
                                 "— za krótka broń na zakotwiczone końce")
        if b["czesci"][0]["typ"] != "pret" or _y(b["czesci"][0]["od"], L) > 4.5:
            bledy.append(f"{bid}: pierwsza część nie jest rękojeścią od dołu")
    # Długość gry nie może ODWRÓCIĆ kolejności historycznej W OBRĘBIE RODZINY.
    # ⚠ Między rodzinami może — i to jest zamierzone: drzewcowa skraca się
    # łagodniej (`SKROT_DRZEWCOWEJ`), więc widły (160 → 144 cm) wychodzą
    # dłuższe od wielkiego miecza (180 → 138). Zasięg drzewcowej jest jej
    # tożsamością; „który miecz dłuższy" ma znaczyć to samo co w historii.
    for rodz in {v["rodzina"] for v in BRONIE.values()}:
        wg = sorted((k for k in BRONIE if BRONIE[k]["rodzina"] == rodz),
                    key=lambda k: BRONIE[k]["cm"])
        for a, b in zip(wg, wg[1:]):
            if (dlugosc_gry_cm(BRONIE[a]["cm"], rodz, a)
                    > dlugosc_gry_cm(BRONIE[b]["cm"], rodz, b)):
                bledy.append(f"kolejność długości odwrócona ({rodz}): {a} > {b}")
    return bledy


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    z_gry = bronie_z_gry()
    print(f"KSZTAŁTY BRONI — {len(BRONIE)} pozycji, w grze {len(z_gry)}")
    print(f"skala: 1:1 do {PROG_CM:.0f} cm, nadwyżka ×{SKROT_DRZEWCA}\n")
    print(f"  {'id':<14} {'rodzina':<8} {'ręce':>4} {'gat.':<5} {'hist.':>5} {'gra':>6}  zakres y")
    for bid, b in sorted(BRONIE.items(), key=lambda kv: kv[1]["cm"]):
        g = z_gry.get(bid, {})
        lo, hi = zakres_y(bid)
        print(f"  {bid:<14} {b['rodzina']:<8} {g.get('hands', '?'):>4} {g.get('material', '?'):<5} "
              f"{b['cm']:>5} {dlugosc_gry_cm(b['cm'], b['rodzina'], bid):>6.1f}  {lo:6.1f}..{hi:6.1f}")
    bl = samokontrola(z_gry)
    print("\n" + ("\n".join("  [X] " + x for x in bl) if bl else "samokontrola zielona"))
    sys.exit(1 if bl else 0)

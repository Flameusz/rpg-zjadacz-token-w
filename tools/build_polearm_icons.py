# -*- coding: utf-8 -*-
"""
Ikony rodziny DRZEWCOWYCH (6 sztuk): 32x64, skos 1:2 od rogu do rogu,
grot w lewym górnym, koniec drzewca w prawym dolnym.

    python tools/build_polearm_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_polearm_icons.py --podglad X.png    # + podgląd 8x i półka skali
    python tools/build_polearm_icons.py --zapisz           # zapis do public/assets/items/

── Skąd kształty i liczby ──────────────────────────────────────────────────
Projekt: wsad Gemini `docs/art-review/gemini/polearms_v1_raw.png`, ocena
w `docs/gemini_weapon_icons.md` §11.7. ⛔ Arkusz NIE jest źródłem pikseli
(§9 tamże) — z niego są sylwetki grotów i cechy rozpoznawcze.

Skala (§11.1 tamże): GROT w skali 0,44 px/cm, wspólnej z mieczami i tarczami;
DRZEWCE skrócone. Pełna skala nie wchodzi (włócznia 220 cm = 97 px).

── Układ: skos 1:2 ─────────────────────────────────────────────────────────
Oś idzie o 1 px w lewo na każde 2 px w górę (~63°), od rogu do rogu kafla
32x64 — najdłuższa prosta, jaka się w nim mieści (~65 px, dłużej niż pion).
⚠ Nie 45°: przy szerokości 32 px oś 45° kończy się na ~43 px i rohatyna
czytała się w przymiarze jak miecz z jelcem (grot = pół broni).

Opis w CAŁKOWITYCH osiach broni, jak noże (`build_ikony_sztyletow.py`):
    s = x + 2y   wzdłuż osi, rośnie ku końcowi drzewca; 1 px osi = √5 jedn.
    u = 2x − y   w poprzek; ujemne = lewy-dół (strona światła), dodatnie =
                 prawy-góra (cień); 1 px w poprzek = √5 jedn.
⭐ W jednym wierszu płótna kolejne piksele różnią się o 2 w `u`, więc pas
czterech kolejnych `u` daje DOKŁADNIE 2 px na wiersz (drzewce), a pas dwóch —
dokładnie 1 px (igła, zęby wideł). Stąd czyste schodki 2:1 bez „koralików".
⚠ Odbicie względem osi 1:2 NIE przekłada kratki na siebie (przy 45° tak),
więc symetryczny liść ma dwie krawędzie o różnych schodkach. To jest koszt
tego układu, przyjęty świadomie (decyzja autora 2026-09-30).

── Kolory ───────────────────────────────────────────────────────────────────
Stal i żelazo: 5-stopniowe rampy z `build_armor_icons.py` (żelazo po
przeglądzie czytelności 2026-09-30). Drewno: `tools/wood_palette.py`,
stopnie z `DROBNE` — drzewce ma 1 px na ton.
"""
import hashlib
import math
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from icon_center import wysrodkuj, bledy_srodka  # noqa: E402
from wood_palette import RAMPA as WOOD, KONTUR  # noqa: E402
from build_armor_icons import STEEL, IRON  # noqa: E402

KORZEN = Path(__file__).resolve().parent.parent
CEL = KORZEN / "public" / "assets" / "items"
SKALA = 0.44          # px / cm — wspólna z mieczami i tarczami, ⛔ nie stroić
W, H = 32, 64
R5 = math.sqrt(5)
#: Koniec drzewca: piksel osi (30, 62) → z konturem dotyka ramki płótna.
#: Oś to u = U_OS ± ½ (środek między dwoma pikselami drzewca).
# ⚠ (29, 61), nie (30, 62): drzewce 3 px dotykało ramki (2026-10-03).
S_KONIEC = 29 + 2 * 61
U_OS = 2 * 29 - 61 + 0.5

# ⭐ Drzewce 3 px (trzy pasy: światło, baza, cień) — decyzja autora 2026-10-03:
#   przy 2 px drzewcowe wyglądały wątło obok trzonków toporów i obuchów (te same
#   trzy tony co `build_blunt_icons.PASY["drewno"]`). Pika zostaje 1 px — to jej cecha.
SHAFT = (WOOD[8], WOOD[6], WOOD[4])
SHAFT_WIDLY = (WOOD[10], WOOD[8], WOOD[6])  # jaśniejsze, surowe drzewce wsi


class Canvas:
    """Wypełnienie bez konturu + etykieta części; kontur dokłada `finalize`
    jedną dylatacją (8-sąsiedztwo), jak w generatorze mieczy."""

    def __init__(self):
        self.rgb = np.zeros((H, W, 3), np.uint8)
        self.a = np.zeros((H, W), bool)
        self.czesc = np.zeros((H, W), "<U8")

    def set(self, x, y, color, czesc):
        if 0 <= x < W and 0 <= y < H:
            self.rgb[y, x] = color
            self.a[y, x] = True
            self.czesc[y, x] = czesc

    def finalize(self):
        out = np.zeros((H, W, 4), np.uint8)
        pad = np.pad(self.a, 1)
        grown = pad.copy()
        # ⭐ Kontur 4-SĄSIEDNI (decyzja autora 2026-10-02, audyt §15 pliku broni):
        #   przy 8-sąsiednim narożniki zapełniały się i na ukośnych krawędziach
        #   ciemny pas był podwójny (~1,7 px konturu na piksel obwodu przy ~1,0
        #   w pancerzu i tarczach) — cienka broń ważyła tyle co własny obrys.
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            grown |= np.roll(np.roll(pad, dy, axis=0), dx, axis=1)
        ring = grown[1:-1, 1:-1] & ~self.a
        out[self.a, :3] = self.rgb[self.a]
        out[self.a, 3] = 255
        out[ring] = (*KONTUR, 255)
        # ⚠ Mikrodziury (≤ 2 px zamkniętego tła) zatyka KONTUR: przy konturze
        #   4-sąsiednim między hakiem halabardy a drzewcem zostawał pojedynczy
        #   piksel tła — szum, nie kształt (8-sąsiedni zalewał go sam).
        #   Prawdziwe prześwity (berdysz, pałąk rapiera) mają po kilkanaście px.
        tlo = out[..., 3] == 0
        widziane = np.zeros_like(tlo)
        for y0 in range(H):
            for x0 in range(W):
                if not tlo[y0, x0] or widziane[y0, x0]:
                    continue
                stos, grupa, brzeg = [(y0, x0)], [], False
                widziane[y0, x0] = True
                while stos:
                    y, x = stos.pop()
                    grupa.append((y, x))
                    brzeg |= y in (0, H - 1) or x in (0, W - 1)
                    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                        if 0 <= ny < H and 0 <= nx < W and tlo[ny, nx] and not widziane[ny, nx]:
                            widziane[ny, nx] = True
                            stos.append((ny, nx))
                if not brzeg and len(grupa) <= 2:
                    for y, x in grupa:
                        out[y, x] = (*KONTUR, 255)
        return out


def leaf(t):
    """Połówka szerokości liścia (0..1), t=0 sztych, t=1 nasada. Najszerzej
    w ~2/3 od sztychu, krótkie zbiegnięcie do tulei."""
    if t <= 0 or t >= 1:
        return 0.0
    return min(1.0, (t / 0.66) ** 0.8) if t < 0.66 else 1 - ((t - 0.66) / 0.34) ** 1.6 * 0.75


def metal_tone(v, lo, hi, mat, grzbiet=None):
    """Światło z lewej-góry: krawędź lewa-dolna (v najmniejsze) jasna,
    prawa-górna ciemna. `grzbiet` — v grani (1 px światła)."""
    if grzbiet is not None and abs(v - grzbiet) < 0.25:
        return mat[4]
    if v - lo < 0.5:
        return mat[4] if grzbiet is None else mat[3]
    if hi - v < 0.5:
        return mat[1]
    return mat[3] if v < (lo + hi) / 2 else mat[2]


# ════════════════════════════════════════════════════════════════════════
# Groty. Każdy dostaje (t, v) w PIKSELACH: t od sztychu wzdłuż osi, v w poprzek
# (ujemne = strona światła). Zwraca (kolor, część) albo None.
# ════════════════════════════════════════════════════════════════════════
def grot_liscia(dl, hw, tuleja, mat=STEEL):
    """Liść na tulei (włócznia, rohatyna). `dl` = długość liścia, `hw` =
    maks. półszerokość, `tuleja` = (długość, półszerokość)."""
    def f(t, v):
        if 0 <= t < dl:
            w = hw * leaf(t / dl)
            if w >= 0.45 and abs(v) <= w:
                return metal_tone(v, -w, w, mat, grzbiet=0.0 if w > 1.2 else None), "grot"
            if t < 1.2 and abs(v) < 0.3:          # sam sztych
                return mat[4], "grot"
        elif dl <= t < dl + tuleja[0] and abs(v) <= tuleja[1]:
            return metal_tone(v, -tuleja[1], tuleja[1], mat), "grot"
        return None
    return f


def g_spear(t, v):
    return grot_liscia(11, 2.3, (4, 1.15))(t, v)


def g_boar(t, v):
    # Liść WIĘKSZY od włóczni (dłuższy i szerszy) + poprzeczka pod piórami.
    r = grot_liscia(14, 3.1, (0, 0))(t, v)
    if r:
        return r
    if 14.3 <= t < 16.2 and abs(v) <= 4.6:
        return (STEEL[4] if t < 15.2 else STEEL[2]), "grot"
    if 16.2 <= t < 20 and abs(v) <= 1.15:
        return metal_tone(v, -1.15, 1.15, STEEL), "grot"
    return None


def g_pike(t, v):
    # Szpic: najmniejszy grot rodziny, prawie igła; krótka tulejka; potem
    # LANGETY — dwa paski stali po bokach cieńszego drzewca.
    if 0 <= t < 7:
        w = 0.25 + 0.95 * (t / 7)
        if abs(v) <= w:
            return metal_tone(v, -w, w, STEEL), "grot"
    elif 7 <= t < 9 and abs(v) <= 1.6:
        return (STEEL[4] if v < 0 else STEEL[1]), "grot"
    elif 9 <= t < 11 and abs(v) <= 1.0:
        return metal_tone(v, -1.0, 1.0, STEEL), "grot"
    elif 11 <= t < 24 and 0.5 < abs(v) <= 1.4:
        return (STEEL[2] if v < 0 else STEEL[0]), "langeta"
    return None


def g_halberd(t, v):
    # Trzy elementy naraz: szpic (góra), TOPÓR po stronie cienia (prawa-góra,
    # tam jest wolne płótno), HAK po stronie światła (lewa-dół).
    if 0 <= t < 10:                               # szpic
        w = 0.3 + 0.7 * (t / 10)
        if abs(v) <= w:
            return metal_tone(v, -w, w, STEEL), "grot"
    if 10 <= t < 24 and abs(v) <= 1.0:            # korpus / tuleja
        return metal_tone(v, -1.0, 1.0, STEEL), "grot"
    if 11.0 <= t < 22.0 and v > 1.0:              # topór
        # ⚠ Przyklejony do tulei na CAŁEJ wysokości, jak w prawdziwej
        #   halabardzie. Wersja na wąskiej szyjce czytała się w podglądzie jak
        #   pusta ramka — kontur zalewał szczelinę między tuleją a ostrzem.
        k = (t - 11.0) / 11
        edge = 3.4 + 2.4 * math.sin(math.pi * k) ** 0.5
        edge -= 0.9 * math.exp(-((k - 0.5) / 0.22) ** 2)   # płytki półksiężyc
        if v <= edge:
            if edge - v < 0.55:
                return STEEL[4], "grot"           # ostrze łapie światło
            return (STEEL[2] if v < edge - 1.8 else STEEL[3]), "grot"
    if v < -1.0:                                  # hak: w bok i w górę, ku sztychowi
        for (t0, v0), (t1, v1), r in (((16.0, -1.0), (13.0, -2.6), 0.75),
                                      ((13.0, -2.6), (10.6, -3.6), 0.55)):
            dt, dv = t1 - t0, v1 - v0
            q = max(0.0, min(1.0, ((t - t0) * dt + (v - v0) * dv) / (dt * dt + dv * dv)))
            if math.hypot(t - (t0 + q * dt), v - (v0 + q * dv)) <= r:
                return (STEEL[3] if t > 13 else STEEL[4]), "grot"
    return None


def g_glaive(t, v):
    # Jedna długa, jednosieczna, wyraźnie wygięta głownia przedłużająca drzewce.
    # Grzbiet po stronie cienia (v+), ostrze po stronie światła (v−), głownia
    # ROŚNIE ku sztychowi (wypukłe ostrze jak na arkuszu), sztych odchyla się
    # ku światłu. Nic w bok.
    L = 20
    if 0 <= t < L:
        k = (L - t) / L                           # 1 przy sztychu, 0 przy tulei
        c = -2.1 * k ** 2.0                       # krzywizna: grzbiet ucieka ku światłu
        back = c + 1.0
        w = 1.4 + 1.6 * math.sin(math.pi * min(1.0, k / 0.85) ** 1.3) ** 0.8
        if t < 3.5:                               # sztych ścięty od strony grzbietu
            back -= (3.5 - t) * 0.55
            w = min(w, 0.4 + t * 0.7)
        if back - w <= v <= back:
            if v - (back - w) < 0.55:
                return STEEL[4], "grot"           # ostrze
            if back - v < 0.5:
                return STEEL[1], "grot"           # grzbiet
            return (STEEL[3] if v < back - w / 2 else STEEL[2]), "grot"
    elif L <= t < 24 and abs(v) <= 1.15:
        return metal_tone(v, -1.15, 1.15, STEEL), "grot"
    return None


def g_pitchfork(t, v):
    # Dwa długie zęby w U, żelazo; jedna sztuka z kuźni, bez tulei na pokaz.
    # ⚠ Bez rozchylenia końców: „daszek" na sztychu czytał się jak trzeci ząb.
    # ⚠ Rozstaw ≥ 2,8 px: przy 2,3 szczelina między zębami (1 px na schodkach
    #   2:1) domykała się konturem — dziura i zlana plama przy 1x.
    spread = 2.8
    if 0.5 <= t < 11:
        for c in (-spread, spread):
            if abs(v - c) <= 0.45:
                return (IRON[4] if c < 0 else IRON[2]), "grot"
    if 10 <= t < 12 and abs(v) <= 3.25:          # dno „U"
        return (IRON[3] if v < 0 else IRON[1]), "grot"
    if 12 <= t < 15 and abs(v) <= 1.0:           # szyjka na drzewcu
        return metal_tone(v, -1.0, 1.0, IRON), "grot"
    return None


# ════════════════════════════════════════════════════════════════════════
# Katalog. `cm` = długość GROTU (skala 0,44); `grot` = px (asercja);
# `dl` = długość całości wzdłuż osi, px (drzewce skrócone — §11.1).
# ════════════════════════════════════════════════════════════════════════
DRZEWCOWE = {
    "spear":      dict(cm=35, grot=15, dl=60, head=g_spear),
    "pike":       dict(cm=25, grot=11, dl=64, head=g_pike, cienkie=True),
    "halberd":    dict(cm=55, grot=24, dl=60, head=g_halberd),
    "glaive":     dict(cm=55, grot=24, dl=58, head=g_glaive),  # ⚠ 60 → 58: zakrzywiony sztych dotykał lewej krawędzi po przesunięciu kotwicy (2026-10-03)
    "boar_spear": dict(cm=45, grot=20, dl=58, head=g_boar),
    "pitchfork":  dict(cm=35, grot=15, dl=56, head=g_pitchfork, drzewce=SHAFT_WIDLY),
}
MAT_GROTU = {"pitchfork": IRON}


def rysuj(p, dl=None):
    dl = p["dl"] if dl is None else dl
    c = Canvas()
    s_szt = S_KONIEC - dl * R5
    jasne, baza, ciemne = p.get("drzewce", SHAFT)
    # półszerokość: 1,34 px = 6 kolejnych u = dokładnie 3 px na wiersz;
    # 0,45 = 2 kolejne u = 1 px (pika)
    pol = 0.45 if p.get("cienkie") else 1.34
    for y in range(H):
        for x in range(W):
            s, u = x + 2 * y, 2 * x - y
            if not (s_szt - 0.5 <= s <= S_KONIEC):
                continue
            t = (s - s_szt) / R5
            v = (u - U_OS) / R5
            r = p["head"](t, v)
            if r:
                c.set(x, y, r[0], r[1])
            elif t >= p["grot"] - 0.5 and abs(v) <= pol:
                if p.get("cienkie"):
                    col = jasne
                else:
                    col = jasne if v < -0.45 else (baza if v <= 0.45 else ciemne)
                c.set(x, y, col, "drzewce")
    return c


# ════════════════════════════════════════════════════════════════════════
# Kontrole — każda sprawdzona psuciem danych.
# ════════════════════════════════════════════════════════════════════════
def dziury(alpha):
    h, w = alpha.shape
    bg = ~alpha
    reached = np.zeros_like(bg)
    q = deque((y, x) for y in range(h) for x in range(w)
              if (x in (0, w - 1) or y in (0, h - 1)) and bg[y, x])
    for y, x in q:
        reached[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not reached[ny, nx]:
                reached[ny, nx] = True
                q.append((ny, nx))
    return int((bg & ~reached).sum())


def rozciaglosc(maska):
    """Długość wzdłuż osi (px) zbioru pikseli: (max s − min s)/√5 + 1 px."""
    ys, xs = np.nonzero(maska)
    s = xs + 2 * ys
    return (s.max() - s.min()) / R5 + 1


MIN_ODREBNOSC = 0.15   # próg projektowy (jak miecze), nie wynik tego generatora
#: Odległość pierwszego piksela od ramki płótna — grot nie może uciekać poza kafel.
#: (Wynika z kafla, nie z rysunku: kontur 1 px musi się zmieścić.)
MARGINES = 1


def main():
    paleta = {tuple(int(v) for v in c) for c in (*STEEL, *IRON, *WOOD, KONTUR)}
    ikony, platna, bledy = {}, {}, []
    for nazwa, p in DRZEWCOWE.items():
        platna[nazwa] = rysuj(p)
        ikony[nazwa] = platna[nazwa].finalize()

    print("=== ikony rodziny drzewcowych (skos 1:2, 32x64) ===")
    print(f"  {'id':<11} {'cm':>3} {'grot':>4} {'jest':>5}  {'dl':>3} {'jest':>5}  bbox")
    dlugosci = {}
    for nazwa, arr in ikony.items():
        p, c = DRZEWCOWE[nazwa], platna[nazwa]
        if arr.shape[:2] != (H, W):
            bledy.append(f"{nazwa}: płótno {arr.shape[1]}x{arr.shape[0]}, oczekiwano {W}x{H}")
        ze_skali = round(p["cm"] * SKALA)
        if p["grot"] != ze_skali:
            bledy.append(f"{nazwa}: tabela grotu {p['grot']} px ≠ {p['cm']} cm × {SKALA} = {ze_skali}")
        grot = rozciaglosc(c.czesc == "grot")
        dl = rozciaglosc(c.a)
        dlugosci[nazwa] = dl
        if abs(grot - p["grot"]) > 1.5:
            bledy.append(f"{nazwa}: grot {grot:.1f} px, cel {p['grot']} (±1,5)")
        if abs(dl - p["dl"]) > 1.5:
            bledy.append(f"{nazwa}: długość {dl:.1f} px, cel {p['dl']} (±1,5)")
        a = arr[..., 3] > 0
        ys, xs = np.nonzero(a)
        if xs.min() < 0 or ys.min() < 0 or xs.max() > W - 1 or ys.max() > H - 1:
            bledy.append(f"{nazwa}: wychodzi poza płótno")
        wn_ys, wn_xs = np.nonzero(c.a)
        if (wn_xs.min() < MARGINES or wn_ys.min() < MARGINES
                or wn_xs.max() > W - 1 - MARGINES or wn_ys.max() > H - 1 - MARGINES):
            bledy.append(f"{nazwa}: wnętrze dotyka ramki — kontur ucięty")
        d = dziury(a)
        if d:
            bledy.append(f"{nazwa}: {d} px zamkniętych dziur")
        obce = {tuple(int(v) for v in px[:3]) for px in arr[a]} - paleta
        if obce:
            bledy.append(f"{nazwa}: kolory spoza palety {sorted(obce)[:4]}")
        mat = MAT_GROTU.get(nazwa, STEEL)
        obcy_metal = {tuple(int(v) for v in px) for px in c.rgb[c.czesc == "grot"]} - {tuple(m) for m in mat}
        if obcy_metal:
            bledy.append(f"{nazwa}: grot w złym gatunku metalu {sorted(obcy_metal)[:3]}")
        print(f"  {nazwa:<11} {p['cm']:>3} {p['grot']:>4} {grot:>5.1f}  {p['dl']:>3} {dl:>5.1f}"
              f"  ({xs.min()},{ys.min()})-({xs.max()},{ys.max()})")

    # Kolejność długości całości wg tabeli musi przeżyć rysunek.
    wg_dl = sorted(DRZEWCOWE, key=lambda n: DRZEWCOWE[n]["dl"])
    for a_, b_ in zip(wg_dl, wg_dl[1:]):
        if DRZEWCOWE[a_]["dl"] < DRZEWCOWE[b_]["dl"] and dlugosci[a_] >= dlugosci[b_]:
            bledy.append(f"kolejność: {a_} ({dlugosci[a_]:.1f}) nie krótszy niż {b_} ({dlugosci[b_]:.1f})")
    if max(dlugosci, key=dlugosci.get) != "pike":
        bledy.append("pika nie jest najdłuższa (§11.2 — jej cechą jest drzewce)")

    # Odrębność GROTÓW: każdy rysowany na tej samej długości, więc sztych
    # stoi w tym samym miejscu; porównanie tylko górnych 28 px osi.
    maski = {}
    for n, p in DRZEWCOWE.items():
        c = rysuj(p, dl=64)
        ys, xs = np.nonzero(c.a)
        s = xs + 2 * ys
        m = c.a.copy()
        m[(np.arange(H)[:, None] * 2 + np.arange(W)[None, :]) > s.min() + 28 * R5] = False
        maski[n] = m
    najblizsze = (1.0, None)
    nazwy = list(DRZEWCOWE)
    for i, a_ in enumerate(nazwy):
        for b_ in nazwy[i + 1:]:
            o = 1 - (maski[a_] & maski[b_]).sum() / (maski[a_] | maski[b_]).sum()
            if o < najblizsze[0]:
                najblizsze = (o, (a_, b_))
            if o < MIN_ODREBNOSC:
                bledy.append(f"groty {a_} / {b_} prawie identyczne (1−IoU {o:.2f})")
    print(f"\n  najbliższa para grotów: {najblizsze[1]}  1−IoU = {najblizsze[0]:.2f}"
          f"  (próg {MIN_ODREBNOSC})")
    for nazwa, arr in ikony.items():
        print(f"  sha1 {nazwa:<11} {hashlib.sha1(arr.tobytes()).hexdigest()[:12]}")

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
        Image.fromarray(arr, "RGBA").save(CEL / f"icon_weapon_{nazwa}.png")
    print(f"\nZAPISANO {len(ikony)} ikon → {CEL.relative_to(KORZEN)}/icon_weapon_*.png")
    return 0


def podglad(ikony, sciezka):
    """Rząd 1: każda ikona 8x na tle kafla plecaka. Rząd 2: półka 2x (jak
    plecak) z tarczami, mieczem i sztyletem z gry. Rząd 3: to samo 1x."""
    S, gap = 8, 12
    tlo = (0x1c, 0x20, 0x30, 255)
    kolej = list(DRZEWCOWE)
    refs = []
    for n in ("shield_wood_round", "shield_wood_pavise", "weapon_sword", "weapon_dagger"):
        f = CEL / f"icon_{n}.png"
        if f.exists():
            refs.append(Image.open(f).convert("RGBA"))
    polka = [Image.fromarray(ikony[n], "RGBA") for n in kolej] + refs
    szer = max(len(kolej) * (32 * S + gap), len(polka) * (32 * 2 + 6)) + gap
    wys = 64 * S + 20 + 64 * 2 + 20 + 64 + 20
    im = Image.new("RGBA", (szer, wys), (28, 28, 32, 255))
    for i, n in enumerate(kolej):
        x = gap + i * (32 * S + gap)
        im.paste(Image.new("RGBA", (32 * S, 64 * S), tlo), (x, 10))
        ic = Image.fromarray(ikony[n], "RGBA")
        im.alpha_composite(ic.resize((32 * S, 64 * S), Image.NEAREST), (x, 10))
    for k, skala in enumerate((2, 1)):
        y0 = 64 * S + 20 + (0 if k == 0 else 64 * 2 + 20)
        x = gap
        for ic in polka:
            kafel = Image.new("RGBA", (32 * skala, 64 * skala if ic.height > 32 else 32 * skala), tlo)
            im.alpha_composite(kafel, (x, y0 + (64 - ic.height) * skala))
            im.alpha_composite(ic.resize((ic.width * skala, ic.height * skala), Image.NEAREST),
                               (x, y0 + (64 - ic.height) * skala))
            x += 32 * skala + 6
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    im.save(sciezka)
    print(f"\npodgląd: {sciezka}")


if __name__ == "__main__":
    sys.exit(main())

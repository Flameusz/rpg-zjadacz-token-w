# -*- coding: utf-8 -*-
"""
Ikony rodziny TOPORÓW (7 sztuk): toporek 32x32 na osi 45°, reszta 32x64 po
skosie 1:2 — reguła całej broni: kąt wynika z gabarytu
(`docs/gemini_weapon_icons.md` §10.9).

    python tools/build_axe_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_axe_icons.py --podglad X.png    # + podgląd 8x i półka skali
    python tools/build_axe_icons.py --zapisz           # zapis do public/assets/items/

── Skąd kształty i liczby ──────────────────────────────────────────────────
Projekt: wsad Gemini `docs/art-review/gemini/axes_v1_raw.png`, ocena
w `docs/gemini_weapon_icons.md` §12.6. ⛔ Arkusz NIE jest źródłem pikseli
(§9) — z niego są sylwetki głów i cechy rozpoznawcze. Długości: cm × 0,44
(tabela §12.2), z dwoma skróceniami opisanymi przy `ODSTEPSTWA`.

── Dwie warstwy rysunku ────────────────────────────────────────────────────
1. **Trzonek, oko, rzemienie — w PASACH osi** jak w `build_sword_icons.py`:
   {(t, b): kolor}, `t` wiersz wzdłuż osi od góry, `b` pas w poprzek (ujemne =
   strona światła, lewa-dół). Pas = dwie kolejne wartości u = 2x − y (na 45°:
   jedna u = x − y), czyli dokładnie 1 px na wiersz — równe schodki trzonka.
2. **Głowa — WIELOKĄT** z punktów (t, w) w pikselach (w ujemne = światło),
   rasteryzowany po środkach pikseli i cieniowany w przestrzeni PIKSELI.
   ⚠ Do 2026-10-01 głowy też były w pasach: brzegi biegnące W POPRZEK osi
   wychodziły poszarpane (kratka 1:2 ma wyznacznik 5 — pas wiersza dostaje
   0–2 piksele), broda nie miała wklęsłego spodu, a krawędź tnąca była
   przerywana. Trzonkowi i głowni miecza to nie szkodziło, bo ich cechy biegną
   WZDŁUŻ osi. ⭐ Wielokąt daje też drogę dla szkicu autora: kształt brody czy
   rogu to lista punktów, nie wzór.

⭐ **Ostrze po stronie ŚWIATŁA (w < 0, lewa-dół)** — decyzja autora 2026-10-01
(„obróć ostrze z prawego górnego na lewy dolny"); obuch i młotek po stronie
cienia. ⚠ Koszt: po stronie światła leży lewy górny róg, więc szeroki topór nie
może sięgnąć osią do rogu — stąd skrócone duński i berdysz.

── Kolory ───────────────────────────────────────────────────────────────────
Stal: 5-stopniowa rampa z `build_armor_icons.py`. Trzonki: `tools/wood_palette.py`.
"""
import hashlib
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from icon_center import wysrodkuj, bledy_srodka  # noqa: E402
from wood_palette import RAMPA as WOOD, KONTUR  # noqa: E402
from build_armor_icons import STEEL  # noqa: E402
from build_sword_icons import Canvas, dziury  # noqa: E402

KORZEN = Path(__file__).resolve().parent.parent
CEL = KORZEN / "public" / "assets" / "items"
SKALA = 0.44          # px / cm — wspólna z mieczami i tarczami, ⛔ nie stroić
MARGINES = 1

S_DARK, S_MID, S_BASE, S_HI, S_LIGHT = STEEL
HAFT = (WOOD[8], WOOD[6], WOOD[4])          # światło, baza, cień — trzy pasy
BINDING = (WOOD[2], WOOD[0])                # rzemień berdysza


# ════════════════════════════════════════════════════════════════════════
# Rysunek = pasy (trzonek, oko) + wielokąty (głowa).
# ════════════════════════════════════════════════════════════════════════
class Rys:
    def __init__(self, rows):
        self.rows = rows
        self.pod = {}        # pasy POD głową (trzonek)
        self.nad = {}        # pasy NAD głową (oko, rzemienie)
        self.polys = []      # dict(pts, kraw, rola)

    def haft(self, t0, t1):
        for t in range(t0, t1):
            for b, col in zip((-1, 0, 1), HAFT):
                self.pod[(t, b)] = col

    def eye(self, t0, t1, half=2):
        for t in range(t0, t1):
            for b in range(-half, half + 1):
                self.nad[(t, b)] = S_HI if b == -half else (S_MID if b < half else S_DARK)

    def ostrze(self, pts, kraw):
        """`pts` — obrys (t, w) w px; `kraw` — łamana krawędzi TNĄCEJ."""
        self.polys.append(dict(pts=pts, kraw=kraw, rola="ostrze"))

    def obuch(self, pts):
        self.polys.append(dict(pts=pts, kraw=None, rola="obuch"))


def lustro(pts):
    return [(t, -w) for t, w in pts]


def w_wielokacie(t, w, pts):
    """Parzystość przecięć — wielokąt prosty, podany w kolejności obrysu."""
    inside = False
    n = len(pts)
    for i in range(n):
        t1, w1 = pts[i]
        t2, w2 = pts[(i + 1) % n]
        if (w1 > w) != (w2 > w):
            tx = t1 + (w - w1) * (t2 - t1) / (w2 - w1)
            if t < tx:
                inside = not inside
    return inside


def odl_lamanej(t, w, lam):
    best = 1e9
    for (t1, w1), (t2, w2) in zip(lam, lam[1:]):
        dt, dw = t2 - t1, w2 - w1
        q = max(0.0, min(1.0, ((t - t1) * dt + (w - w1) * dw) / (dt * dt + dw * dw)))
        best = min(best, math.hypot(t - (t1 + q * dt), w - (w1 + q * dw)))
    return best


# ════════════════════════════════════════════════════════════════════════
# Topory. Punkty (t, w): t w px od góry rysunku wzdłuż osi, w w px w poprzek
# (ujemne = ostrze, strona światła). Oko ma półszerokość ~1,6 px (pas ±2).
# ════════════════════════════════════════════════════════════════════════
def draw_hatchet(rows):
    # Najmniejszy: mała klinowa głowa rozszerzająca się ku ostrzu.
    r = Rys(rows)
    r.ostrze([(0.6, -1.0), (0.1, -5.4), (1.8, -6.4), (4.6, -5.8), (4.0, -1.0)],
             kraw=[(0.1, -5.4), (1.8, -6.4), (4.6, -5.8)])
    r.haft(0, rows)
    r.eye(0, 4, half=1)
    return r


def draw_axe(rows):
    # Siekiera: krótkie, prawie proste ostrze + PŁASKI OBUCH (atak „Obuch").
    r = Rys(rows)
    r.ostrze([(0.6, -1.6), (0.1, -6.6), (2.6, -7.4), (6.4, -7.0), (5.4, -3.6), (5.2, -1.6)],
             kraw=[(0.1, -6.6), (2.6, -7.4), (6.4, -7.0)])
    r.obuch([(0.4, 1.4), (0.4, 3.8), (5.6, 3.8), (5.6, 1.4)])
    r.haft(0, rows)
    r.eye(0, 6)
    return r


def draw_bearded(rows):
    # Topór brodaty (skeggøx): górny brzeg prawie prosty, krawędź tnąca biegnie
    # długo w dół, a DOLNY brzeg wraca do oka WKLĘSŁYM łukiem — pod brodą
    # zostaje wycięcie nad trzonkiem (miejsce na dłoń). Bez obucha.
    r = Rys(rows)
    kraw = [(0.1, -7.2), (3.5, -8.0), (8.0, -7.8), (11.6, -6.9), (13.2, -6.0)]
    # ⚠ Spód biegnie BLISKO krawędzi (broda ~2 px szerokości) i dopiero przy
    #   oku skręca do trzonka — głębokie wycięcie pod brodą. Przy spodzie
    #   poprowadzonym prosto do oka (przymiar v4) broda czytała się jak tasak.
    spod = [(12.8, -5.6), (11.4, -5.6), (9.6, -5.4), (7.8, -4.6), (6.4, -3.4), (5.4, -2.2),
            (4.8, -1.6)]
    r.ostrze([(0.6, -1.6), *kraw, *spod], kraw=kraw)
    r.haft(0, rows)
    r.eye(0, 5)
    return r


def draw_battle(rows):
    # Topór bojowy: szerokie, łukowe ostrze z rogami w górę i w dół + MŁOTEK
    # z tyłu (atak „Obuch") z poszerzonym licem.
    r = Rys(rows)
    kraw = [(0.6, -8.2), (3.6, -9.4), (7.6, -9.4), (11.0, -7.8)]
    r.ostrze([(3.0, -1.8), (2.4, -4.6), *kraw, (8.8, -4.6), (8.4, -1.8)], kraw=kraw)
    r.obuch([(3.6, 1.4), (3.6, 3.4), (2.6, 3.4), (2.6, 4.8), (9.0, 4.8), (9.0, 3.4),
             (8.0, 3.4), (8.0, 1.4)])
    r.haft(2, rows)
    r.eye(2, 10)
    return r


def draw_dane(rows):
    # Topór duński: bardzo SZEROKI i cienki blat — wąska szyja przy oku, rogi
    # wysunięte daleko w górę i w dół, mocno wypukła krawędź; nic z tyłu.
    r = Rys(rows)
    kraw = [(0.0, -7.6), (4.4, -9.0), (9.0, -9.0), (14.0, -7.0)]
    r.ostrze([(4.6, -1.6), (4.0, -3.4), *kraw, (9.6, -3.4), (8.8, -1.6)], kraw=kraw)
    r.haft(3, rows)
    r.eye(3, 10)
    return r


def draw_bardiche(rows):
    # Berdysz: wielki, WĄSKI półksiężyc, znacznie wyższy niż szeroki. Przymocowany
    # w DWÓCH miejscach: tuleją u góry i rzemieniem u dołu — między ostrzem
    # a drzewcem zostaje zamknięty prześwit (asercja „dziury").
    r = Rys(rows)
    kraw = [(0.0, -3.2), (4.0, -6.4), (10.0, -8.0), (17.0, -7.8), (23.0, -6.2), (27.0, -3.6)]
    # ⚠ Grubość ~3 px w środku: przy ~2 px krawędź i faza zabielały całe
    #   ostrze i berdysz czytał się jak drut (przymiar v4).
    grzbiet = [(27.0, -3.6), (22.0, -4.4), (16.0, -4.8), (10.0, -4.6), (5.0, -4.0), (1.2, -3.0)]
    r.ostrze([*kraw, *grzbiet[1:]], kraw=kraw)
    r.obuch([(4.6, -1.4), (4.6, -4.4), (7.4, -4.4), (7.4, -1.4)])     # łącznik tuleja → ostrze
    r.haft(3, rows)
    r.eye(4, 8)
    for t in (21, 22, 23):                               # rzemień u dołu: od ostrza do drzewca
        for b in range(-5, 2):
            r.nad[(t, b)] = BINDING[0] if (t + b) % 2 else BINDING[1]
    for t in range(rows - 3, rows):                      # owinięcie u końca drzewca
        for b in (-1, 0, 1):
            r.nad[(t, b)] = BINDING[0] if (t + b) % 2 else BINDING[1]
    return r


def draw_labrys(rows):
    # Labrys: DWA identyczne ostrza, lustro względem osi. Jedyny bez przodu.
    r = Rys(rows)
    kraw = [(0.2, -7.4), (4.0, -8.6), (8.0, -8.6), (11.8, -7.4)]
    jedno = [(3.6, -2.0), (2.6, -4.6), *kraw, (9.4, -4.6), (8.4, -2.0)]
    r.ostrze(jedno, kraw=kraw)
    r.ostrze(lustro(jedno), kraw=lustro(kraw))
    r.haft(1, rows)
    r.eye(2, 10)
    return r


# ════════════════════════════════════════════════════════════════════════
# Rasteryzacja: pasy + wielokąty, osie 45° (1, 1) i 1:2 (1, 2).
# ════════════════════════════════════════════════════════════════════════
def rasteryzuj(r, koniec, kier, w, h):
    dx, dy = kier
    dl = math.hypot(dx, dy)
    L = r.rows
    bx, by = koniec
    s_szt = dx * bx + dy * by - (L - 1) * dl
    u_os = dy * bx - dx * by - (dy // 2)
    u_c = u_os + (dy - 1) / 2                   # środek pasa 0 = oś
    rola = np.zeros((h, w), "<U6")
    poly_px = {}
    c = Canvas(w, h)
    for y in range(h):
        for x in range(w):
            s, u = dx * x + dy * y, dy * x - dx * y
            tf = (s - s_szt) / dl
            wf = (u - u_c) / dl
            t = math.floor(tf + 0.5)
            b = (u - u_os) // dy
            col = r.pod.get((t, b)) if 0 <= t < L else None
            for i, pl in enumerate(r.polys):
                if w_wielokacie(tf, wf, pl["pts"]):
                    col = "P"
                    poly_px[(x, y)] = (i, tf, wf)
            nad = r.nad.get((t, b)) if 0 <= t < L else None
            if nad is not None:
                col = nad
                poly_px.pop((x, y), None)
            if col is not None and col != "P":
                c.set(x, y, col)
            elif col == "P":
                c.a[y, x] = True
    # Cieniowanie głowy w przestrzeni PIKSELI.
    for (x, y), (i, tf, wf) in poly_px.items():
        pl = r.polys[i]
        mine = lambda xx, yy: poly_px.get((xx, yy), (None,))[0] == i
        if pl["rola"] == "ostrze":
            d = odl_lamanej(tf, wf, pl["kraw"])
            if d < 1.0:
                col = S_LIGHT                    # krawędź tnąca
            elif d < 2.0:
                col = S_HI                       # faza ostrza
            elif not mine(x, y - 1):
                col = S_HI                       # górny brzeg — światło z góry
            elif not mine(x, y + 1):
                col = S_MID                      # spód w cieniu
            elif abs(wf) < 2.6:
                col = S_MID                      # przy oku
            else:
                col = S_BASE
        else:
            col = S_HI if not mine(x, y - 1) else (S_MID if not mine(x, y + 1) else S_BASE)
        c.set(x, y, col)
    return c


def dopasuj(r, kier, w, h):
    """Kotwica najbliżej prawego dolnego rogu, przy której wnętrze nie dotyka
    ramki; zwraca też liczbę pikseli rysunku na DUŻYM płótnie (kontrola ucięcia)."""
    najlepsza = None
    for by in range(h - 1 - MARGINES, h - 16, -1):
        for bx in range(w - 1 - MARGINES, w - 16, -1):
            c = rasteryzuj(r, (bx, by), kier, w, h)
            if not c.a.any():
                continue
            ys, xs = np.nonzero(c.a)
            if (xs.min() < MARGINES or ys.min() < MARGINES or xs.max() > w - 1 - MARGINES
                    or ys.max() > h - 1 - MARGINES):
                continue
            odl = (w - 1 - bx) ** 2 + (h - 1 - by) ** 2
            if najlepsza is None or odl < najlepsza[0]:
                najlepsza = (odl, (bx, by), c)
            break                                 # w tym wierszu dalej jest tylko gorzej
    if najlepsza is None:
        return None, None, None
    bx, by = najlepsza[1]
    # dowolne przesunięcie całkowite zachowuje wzór (wszystko liczy się od kotwicy)
    pelne = rasteryzuj(r, (bx + 32, by + 64), kier, w + 64, h + 128)
    return najlepsza[2], najlepsza[1], int(pelne.a.sum())


# ════════════════════════════════════════════════════════════════════════
# Katalog: id → (cm, px, gabaryt, rysunek, cechy)
# ════════════════════════════════════════════════════════════════════════
TOPORY = {
    "hatchet":     dict(cm=40,  px=18, pole="1x1", draw=draw_hatchet),
    "axe":         dict(cm=75,  px=33, pole="1x2", draw=draw_axe, obuch=True),
    "bearded_axe": dict(cm=70,  px=31, pole="1x2", draw=draw_bearded, obuch=False),
    "battle_axe":  dict(cm=105, px=46, pole="1x2", draw=draw_battle, obuch=True),
    "dane_axe":    dict(cm=140, px=50, pole="1x2", draw=draw_dane, obuch=False),
    "bardiche":    dict(cm=160, px=57, pole="1x2", draw=draw_bardiche, dziury=True),
    "labrys":      dict(cm=110, px=48, pole="1x2", draw=draw_labrys, symetria=True),
}
#: ⚠ Ostrze po stronie światła (lewa-dół) zabiera miejsce przy lewym górnym
#:   rogu: duży topór nie może sięgnąć osią do rogu. Długości to MAKSIMA, przy
#:   których nic nie dotyka ramki (policzone 2026-10-01), nie cm × 0,44.
ODSTEPSTWA = {"bardiche": "skrócony 70 → 57 — ostrze po lewej przy rogu",
              "dane_axe": "skrócony 62 → 50 — ostrze po lewej przy rogu"}
MIN_ODREBNOSC = 0.15


def maska_glowy(r, krok=0.5):
    """Głowa (same wielokąty) na drobnej siatce (t, w) od góry rysunku —
    do porównania sylwetek niezależnie od kratki pikseli."""
    out = set()
    for pl in r.polys:
        ts = [p[0] for p in pl["pts"]]
        ws = [p[1] for p in pl["pts"]]
        t = min(ts)
        while t <= max(ts):
            w = min(ws)
            while w <= max(ws):
                if w_wielokacie(t, w, pl["pts"]):
                    out.add((round(t / krok), round(w / krok)))
                w += krok
            t += krok
    return out


def main():
    paleta = {tuple(int(v) for v in c) for c in (*STEEL, *WOOD, KONTUR)}
    ikony, rysunki, info, bledy = {}, {}, {}, []
    for nazwa, p in TOPORY.items():
        jeden = p["pole"] == "1x1"
        kier, w, h = ((1, 1), 32, 32) if jeden else ((1, 2), 32, 64)
        # wiersze: 1:2 → długość − 2 (kontur na obu końcach); 45° → BOK bbox
        # samej osi (jak krótki miecz), wiersz = 1/√2 px boku
        rows = p["px"] - 2 if not jeden else round((p["px"] - 2) * math.sqrt(2))
        rysunki[nazwa] = p["draw"](rows)
        c, kot, pelne = dopasuj(rysunki[nazwa], kier, w, h)
        if c is None:
            bledy.append(f"{nazwa}: nie mieści się przy żadnej kotwicy")
            continue
        info[nazwa] = (kot, int(c.a.sum()), pelne, jeden)
        ikony[nazwa] = c.finalize()

    print("=== ikony rodziny toporów ===")
    print(f"  {'id':<12} {'pole':<4} {'cm':>4} {'cel':>4} {'jest':>5}  kotwica   bbox")
    dl = {}
    for nazwa, arr in ikony.items():
        p, r = TOPORY[nazwa], rysunki[nazwa]
        kot, n_ikona, n_pelne, jeden = info[nazwa]
        a = arr[..., 3] > 0
        ys, xs = np.nonzero(a)
        if arr.shape[:2] != ((32, 32) if jeden else (64, 32)):
            bledy.append(f"{nazwa}: płótno {arr.shape[1]}x{arr.shape[0]}")
        d = r.rows / math.sqrt(2) + 2 if jeden else float(r.rows + 2)
        dl[nazwa] = d
        ze_skali = round(p["cm"] * SKALA)
        if nazwa not in ODSTEPSTWA and p["px"] != ze_skali:
            bledy.append(f"{nazwa}: tabela {p['px']} px ≠ {p['cm']} cm × {SKALA} = {ze_skali}")
        if abs(d - p["px"]) > 1:
            bledy.append(f"{nazwa}: długość {d:.0f} px, cel {p['px']} (±1)")
        if min(pt[0] for pl in r.polys for pt in pl["pts"]) < 0:
            bledy.append(f"{nazwa}: głowa wystaje nad początek rysunku (t < 0) — długość kłamie")
        if n_ikona != n_pelne:
            bledy.append(f"{nazwa}: ucięty — na płótnie {n_ikona} px, w całości {n_pelne}")
        dz = dziury(a)
        if dz and not p.get("dziury"):
            bledy.append(f"{nazwa}: {dz} px zamkniętych dziur")
        if p.get("dziury") and not dz:
            bledy.append(f"{nazwa}: brak prześwitu między ostrzem a drzewcem (dwa mocowania)")
        obce = {tuple(int(v) for v in q[:3]) for q in arr[a]} - paleta
        if obce:
            bledy.append(f"{nazwa}: kolory spoza palety {sorted(obce)[:4]}")
        ostrza = [pl for pl in r.polys if pl["rola"] == "ostrze"]
        if "obuch" in p:
            ma = any(pl["rola"] == "obuch" and min(q[1] for q in pl["pts"]) > 0 for pl in r.polys)
            if ma != p["obuch"]:
                bledy.append(f"{nazwa}: obuch {'brak' if p['obuch'] else 'jest, a nie powinien'}")
        if p.get("symetria"):
            if len(ostrza) != 2 or sorted(ostrza[0]["pts"]) != sorted(lustro(ostrza[1]["pts"])):
                bledy.append(f"{nazwa}: dwa ostrza NIE są lustrem")
        elif not ostrza or any(max(q[1] for q in pl["pts"]) > 0 for pl in ostrza):
            bledy.append(f"{nazwa}: ostrze nie leży po stronie ŚWIATŁA (w < 0)")
        for pl in ostrza:
            if not all(q in pl["pts"] for q in pl["kraw"]):
                bledy.append(f"{nazwa}: krawędź tnąca nie leży na obrysie ostrza")
        print(f"  {nazwa:<12} {p['pole']:<4} {p['cm']:>4} {p['px']:>4} {d:>5.0f}  {str(kot):<9} "
              f"({xs.min()},{ys.min()})-({xs.max()},{ys.max()})"
              f"{'  (' + ODSTEPSTWA[nazwa] + ')' if nazwa in ODSTEPSTWA else ''}")

    wg = sorted(TOPORY, key=lambda n: TOPORY[n]["cm"])
    for a_, b_ in zip(wg, wg[1:]):
        if a_ in dl and b_ in dl and TOPORY[a_]["pole"] == TOPORY[b_]["pole"] and dl[a_] > dl[b_]:
            bledy.append(f"kolejność: {a_} ({dl[a_]:.0f}) dłuższy niż {b_} ({dl[b_]:.0f})")

    glowy = {n: maska_glowy(r) for n, r in rysunki.items() if TOPORY[n]["pole"] == "1x2"}
    nazwy = list(glowy)
    naj = (1.0, None)
    for i, a_ in enumerate(nazwy):
        for b_ in nazwy[i + 1:]:
            o = 1 - len(glowy[a_] & glowy[b_]) / len(glowy[a_] | glowy[b_])
            if o < naj[0]:
                naj = (o, (a_, b_))
            if o < MIN_ODREBNOSC:
                bledy.append(f"głowy {a_} / {b_} prawie identyczne (1−IoU {o:.2f})")
    print(f"\n  najbliższa para głów: {naj[1]}  1−IoU = {naj[0]:.2f}  (próg {MIN_ODREBNOSC})")
    for nazwa, arr in ikony.items():
        print(f"  sha1 {nazwa:<12} {hashlib.sha1(arr.tobytes()).hexdigest()[:12]}")

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
    """Rząd 1: ikony 8x na tle kafla plecaka. Rząd 2: półka 2x z mieczami,
    drzewcowymi i sztyletem z gry. Rząd 3: to samo 1x."""
    S, gap = 8, 12
    tlo = (0x1c, 0x20, 0x30, 255)
    kolej = [n for n in TOPORY if n in ikony]
    wczytaj = lambda n: Image.open(CEL / f"icon_{n}.png").convert("RGBA")
    przed = ["weapon_dagger", "weapon_short_sword"]
    po = ["weapon_sword", "weapon_greatsword", "weapon_halberd", "weapon_glaive"]
    polka = ([wczytaj(n) for n in przed if (CEL / f"icon_{n}.png").exists()]
             + [Image.fromarray(ikony[n], "RGBA") for n in kolej]
             + [wczytaj(n) for n in po if (CEL / f"icon_{n}.png").exists()])
    szer = max(len(kolej) * (32 * S + gap), len(polka) * (32 * 2 + 6)) + gap
    wys = 64 * S + 20 + 64 * 2 + 20 + 64 + 20
    im = Image.new("RGBA", (szer, wys), (28, 28, 32, 255))
    for i, n in enumerate(kolej):
        ic = Image.fromarray(ikony[n], "RGBA")
        x = gap + i * (32 * S + gap)
        y = 10 + (64 - ic.height) * S
        im.paste(Image.new("RGBA", (32 * S, ic.height * S), tlo), (x, y))
        im.alpha_composite(ic.resize((ic.width * S, ic.height * S), Image.NEAREST), (x, y))
    for k, sk in enumerate((2, 1)):
        y0 = 64 * S + 20 + (0 if k == 0 else 64 * 2 + 20)
        x = gap
        for ic in polka:
            y = y0 + (64 - ic.height) * sk
            im.alpha_composite(Image.new("RGBA", (32 * sk, ic.height * sk), tlo), (x, y))
            im.alpha_composite(ic.resize((ic.width * sk, ic.height * sk), Image.NEAREST), (x, y))
            x += 32 * sk + 6
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    im.save(sciezka)
    print(f"\npodgląd: {sciezka}")


if __name__ == "__main__":
    sys.exit(main())

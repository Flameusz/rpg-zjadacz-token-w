# -*- coding: utf-8 -*-
"""
Ikony rodziny OBUCHOWYCH (11 sztuk): wszystkie 32x64 po skosie 1:2 — 1×1 jest
wyłącznie dla broni do ~45 cm (`docs/gemini_weapon_icons.md` §13.1).

    python tools/build_blunt_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_blunt_icons.py --podglad X.png    # + podgląd 8x i półka skali
    python tools/build_blunt_icons.py --zapisz           # zapis do public/assets/items/

── Skąd kształty i liczby ──────────────────────────────────────────────────
Projekt: arkusze Gemini `docs/art-review/gemini/blunt_short_v1_raw.png` (A)
i `blunt_long_v1_raw.png` (B), ocena w §13.8 / §13.10. ⛔ Arkusz NIE jest
źródłem pikseli (§9). Długości: cm × 0,44 (tabela §13.2); cep skrócony (§13.9).

── Rysunek ──────────────────────────────────────────────────────────────────
Jak w `build_axe_icons.py`: trzonek w PASACH osi (2 kolejne u = 2x − y = 1 px
na wiersz), reszta jako ELEMENTY w pikselach, w osiach broni (t, w):
`t` px wzdłuż osi od GÓRY rysunku, `w` px w poprzek (ujemne = strona światła,
lewa-dół). Elementy: wielokąt, koło, elipsa, łańcuch (łamana z ogniwami),
odcinek (bijak). Cieniowanie w pikselach: brzeg ku światłu jasny, ku cieniowi
ciemny, środek bazowy.

⭐ Część uderzająca (dziób, lico) po stronie ŚWIATŁA, kolec po stronie cienia —
jak ostrze topora (§12.7).
⭐ **Zwis kiścienia, korbacza i cepa: PIONOWO w dół ekranu** (§13.9) —
w osiach skosu g = (2/√5, −1/√5), czyli zawsze po stronie światła.
⭐ Na końcu każda ikona jest WYŚRODKOWANA w polu (`tools/icon_center.py`).

── Kolory ───────────────────────────────────────────────────────────────────
Stal / żelazo: rampy z `build_armor_icons.py`. Drewno i skóra:
`tools/wood_palette.py`.
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
from build_armor_icons import STEEL, IRON  # noqa: E402
from build_sword_icons import Canvas, dziury  # noqa: E402

KORZEN = Path(__file__).resolve().parent.parent
CEL = KORZEN / "public" / "assets" / "items"
SKALA = 0.44
MARGINES = 1
R5 = math.sqrt(5)
G = (2 / R5, -1 / R5)                     # „w dół ekranu" w osiach skosu

#: Materiał → (światło, baza, cień, akcent). Akcent = krawędź tnąca / blask.
MAT = {
    "stal":   (STEEL[3], STEEL[2], STEEL[1], STEEL[4]),
    "zelazo": (IRON[3], IRON[2], IRON[1], IRON[4]),
    # ⚠ Bryły z samego drewna (pałka, kij, maczuga) o 1–2 szczeble JAŚNIEJ niż
    #   trzonki: cień WOOD[3] zlewał się z granatem kafla i konturem — przy
    #   wielkości z plecaka zostawała ciemna kreska bez kształtu (v2).
    "drewno": (WOOD[10], WOOD[7], WOOD[5], WOOD[11]),
    "kora":   (WOOD[6], WOOD[4], WOOD[2], WOOD[7]),
    "skora":  (WOOD[4], WOOD[2], WOOD[0], WOOD[5]),
    "szczelina": (STEEL[1], STEEL[1], STEEL[0], STEEL[1]),   # cień między piórami
    # ⭐ STRUKTURA WARTOŚCI głowy (autor 2026-10-03: „buzdygan mało czytelny,
    #   młoty też"): jedna stal na całej głowie dawała szarą plamę — lico, oko
    #   i kolec zlewały się w jedno, młot czytał się jak cegła. Części głowy
    #   dostają WŁASNY ton: lico/oko ciemniej, kolce i szpice jaśniej.
    "stal_lico":   (STEEL[2], STEEL[1], STEEL[0], STEEL[3]),
    "stal_jasna":  (STEEL[4], STEEL[3], STEEL[2], STEEL[4]),
}
PASY = {   # trzonek w pasach b = −1, 0, 1
    "drewno": (WOOD[8], WOOD[6], WOOD[4]),
    "stal":   (STEEL[3], STEEL[2], STEEL[1]),
    "skora":  (WOOD[4], WOOD[2], WOOD[0]),
}


class Rys:
    def __init__(self, rows):
        self.rows = rows
        self.pasy = {}            # (t, b) → kolor, POD elementami
        self.trzonki = []         # (t0, t1, mat) — pasy buduje `zbuduj`
        self.el = []              # elementy w kolejności rysowania

    def trzonek(self, t0, t1, mat="drewno"):
        self.trzonki.append([t0, t1, mat])

    def zbuduj(self):
        self.pasy = {}
        for t0, t1, mat in self.trzonki:
            for t in range(t0, t1):
                for b, col in zip((-1, 0, 1), PASY[mat]):
                    self.pasy[(t, b)] = col

    def powieksz(self, ft, fw):
        """Powiększa GŁOWĘ (elementy) o `ft` wzdłuż osi i `fw` w poprzek,
        względem szczytu rysunku i osi. Trzonek zostaje w pasach (grubość
        wspólna dla rodziny), przesuwa się tylko jego początek pod głową.
        ⭐ Skala 0,44 px/cm dotyczy DŁUGOŚCI broni; szerokość i wielkość głowy
        ustawia czytelność (jak u mieczy) — krótkie obuchy miały głowy po
        kilka pikseli i ginęły w kaflu 1×2 (v2)."""
        S = lambda q: (q[0] * ft, q[1] * fw)
        for e in self.el:
            k = e["kind"]
            if k in ("poly", "lancuch"):
                e["pts"] = [S(q) for q in e["pts"]]
                if e.get("kraw"):
                    e["kraw"] = [S(q) for q in e["kraw"]]
            elif k == "kolo":
                e["c"] = S(e["c"])
                e["r"] *= (ft + fw) / 2
            elif k == "elipsa":
                e["c"] = S(e["c"])
                e["a"] *= (ft + fw) / 2
                e["b"] *= (ft + fw) / 2
            elif k == "odcinek":
                e["p0"], e["p1"] = S(e["p0"]), S(e["p1"])
                e["hw"] *= fw
        for tr in self.trzonki:
            if tr[0] < self.rows / 2:
                tr[0] = round(tr[0] * ft)

    def poly(self, pts, mat="stal", kraw=None, rola=""):
        self.el.append(dict(kind="poly", pts=pts, mat=mat, kraw=kraw, rola=rola))

    def kolo(self, t, w, r, mat="stal", rola=""):
        self.el.append(dict(kind="kolo", c=(t, w), r=r, mat=mat, rola=rola))

    def elipsa(self, c, os_dl, a, b, mat="stal", obrecze=(), rola=""):
        """Elipsa: środek `c`, oś długa w kierunku `os_dl` (wektor (t, w)),
        półosie `a` (wzdłuż) i `b` (w poprzek); `obrecze` — pozycje obręczy
        wzdłuż osi w ułamkach −1..1."""
        self.el.append(dict(kind="elipsa", c=c, os=os_dl, a=a, b=b, mat=mat, obrecze=obrecze, rola=rola))

    def odcinek(self, p0, p1, hw, mat="drewno", obrecze=(), rola=""):
        self.el.append(dict(kind="odcinek", p0=p0, p1=p1, hw=hw, mat=mat, obrecze=obrecze, rola=rola))

    def lancuch(self, pts, rola="lancuch"):
        self.el.append(dict(kind="lancuch", pts=pts, mat="stal", rola=rola))


def w_wielokacie(t, w, pts):
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


def lam(t, w, pts):
    """(odległość od łamanej, pozycja wzdłuż niej)."""
    best, acc = (1e9, 0.0), 0.0
    for (t1, w1), (t2, w2) in zip(pts, pts[1:]):
        dt, dw = t2 - t1, w2 - w1
        L = math.hypot(dt, dw)
        q = max(0.0, min(1.0, ((t - t1) * dt + (w - w1) * dw) / (L * L)))
        d = math.hypot(t - (t1 + q * dt), w - (w1 + q * dw))
        if d < best[0]:
            best = (d, acc + q * L)
        acc += L
    return best


def zwis(start, n, krok=2.0):
    return [(start[0] + G[0] * krok * k, start[1] + G[1] * krok * k) for k in range(n + 1)]


# ════════════════════════════════════════════════════════════════════════
# Rasteryzacja
# ════════════════════════════════════════════════════════════════════════
def rasteryzuj(r, koniec, w=32, h=64):
    r.zbuduj()
    L = r.rows
    bx, by = koniec
    s_szt = bx + 2 * by - (L - 1) * R5
    u_os = 2 * bx - by - 1
    u_c = u_os + 0.5
    c = Canvas(w, h)
    kto = {}                                     # (x, y) → (indeks elementu, dodatek)
    for y in range(h):
        for x in range(w):
            s, u = x + 2 * y, 2 * x - y
            tf, wf = (s - s_szt) / R5, (u - u_c) / R5
            t = math.floor(tf + 0.5)
            b = (u - u_os) // 2
            col = r.pasy.get((t, b)) if 0 <= t < L else None
            if col is not None:
                c.set(x, y, col)
            for i, e in enumerate(r.el):
                hit, extra = trafia(e, tf, wf)
                if hit:
                    kto[(x, y)] = (i, extra, tf, wf)
    for (x, y), (i, extra, tf, wf) in kto.items():
        e = r.el[i]
        jasny, baza, cien, akcent = MAT[e["mat"]]
        moj = lambda xx, yy: kto.get((xx, yy), (None,))[0] == i
        if extra == "ogniwo_plasko":
            col = STEEL[4] if wf < 0 else STEEL[3]
        elif extra == "ogniwo_bokiem":
            col = STEEL[1]
        elif extra == "obrecz":
            # drewno: żelazne obręcze (jasne na ciemnym); stal: obręcze CIEMNE —
            # jasne ginęły na jasnym ciężarku korbacza (v1)
            col = MAT["zelazo"][0] if e["mat"] in ("drewno", "zelazo") else STEEL[1]
        elif e.get("kraw") and lam(tf, wf, e["kraw"])[0] < 0.9:
            col = akcent
        elif not moj(x - 1, y) or not moj(x, y - 1):
            col = jasny                          # ku światłu (lewo-góra)
        elif not moj(x + 1, y) or not moj(x, y + 1):
            col = cien
        else:
            col = baza
        if e["kind"] in ("kolo", "elipsa") and extra == "":
            # bryła: blask w lewej-górnej ćwiartce, cień w prawej-dolnej
            cx, cy = e["_px"]
            k = ((x - cx) + (y - cy)) / max(1.0, e.get("r", e.get("b", 2)))
            col = akcent if k < -1.0 else (jasny if k < -0.2 else (baza if k < 0.7 else cien))
        c.set(x, y, col)
    return c


def trafia(e, tf, wf):
    k = e["kind"]
    if k == "poly":
        return w_wielokacie(tf, wf, e["pts"]), ""
    if k == "kolo":
        return math.hypot(tf - e["c"][0], wf - e["c"][1]) <= e["r"], ""
    if k == "elipsa":
        ot, ow = e["os"]
        n = math.hypot(ot, ow)
        ot, ow = ot / n, ow / n
        dt, dw = tf - e["c"][0], wf - e["c"][1]
        a_ = dt * ot + dw * ow
        b_ = -dt * ow + dw * ot
        if (a_ / e["a"]) ** 2 + (b_ / e["b"]) ** 2 > 1:
            return False, ""
        if any(abs(a_ / e["a"] - o) < 0.16 for o in e["obrecze"]):
            return True, "obrecz"
        return True, ""
    if k == "odcinek":
        (t0, w0), (t1, w1) = e["p0"], e["p1"]
        dt, dw = t1 - t0, w1 - w0
        Lb = math.hypot(dt, dw)
        q = ((tf - t0) * dt + (wf - w0) * dw) / (Lb * Lb)
        if not 0 <= q <= 1:
            return False, ""
        perp = ((tf - t0) * dw - (wf - w0) * dt) / Lb
        if abs(perp) > e["hw"]:
            return False, ""
        along = q * Lb
        if any(abs(along - o * Lb) < 0.8 for o in e["obrecze"]):
            return True, "obrecz"
        return True, ""
    if k == "lancuch":
        d, pos = lam(tf, wf, e["pts"])
        # ⭐ Ogniwa co 2,2 px: płasko = 2 px w poprzek (jasne), bokiem = 1 px
        #   (ciemne). Pełna linia czytała się jak rzemień (arkusz B v1, §13.6).
        n = int(pos // 1.1)
        if n % 2 == 0 and d <= 0.95:
            return True, "ogniwo_plasko"
        if n % 2 == 1 and d <= 0.45:
            return True, "ogniwo_bokiem"
        return False, ""
    raise ValueError(k)


def przygotuj(r, koniec):
    """Środki kół/elips w pikselach — do cieniowania brył w przestrzeni ekranu."""
    L = r.rows
    bx, by = koniec
    s_szt = bx + 2 * by - (L - 1) * R5
    u_c = 2 * bx - by - 0.5
    for e in r.el:
        if e["kind"] in ("kolo", "elipsa"):
            t, w = e["c"]
            s = s_szt + t * R5
            u = u_c + w * R5
            # s = x + 2y, u = 2x − y  →  x = (s + 2u)/5, y = (2s − u)/5
            e["_px"] = ((s + 2 * u) / 5, (2 * s - u) / 5)


def dopasuj(r):
    najlepsza = None
    for by in range(64 - 1 - MARGINES, 64 - 16, -1):
        for bx in range(32 - 1 - MARGINES, 32 - 16, -1):
            przygotuj(r, (bx, by))
            c = rasteryzuj(r, (bx, by))
            if not c.a.any():
                continue
            ys, xs = np.nonzero(c.a)
            if xs.min() < MARGINES or ys.min() < MARGINES or xs.max() > 30 or ys.max() > 62:
                continue
            odl = (31 - bx) ** 2 + (63 - by) ** 2
            if najlepsza is None or odl < najlepsza[0]:
                najlepsza = (odl, (bx, by), c)
            break
    if najlepsza is None:
        return None, None, None
    bx, by = najlepsza[1]
    przygotuj(r, (bx + 32, by + 64))
    pelne = rasteryzuj(r, (bx + 32, by + 64), 96, 192)
    przygotuj(r, (bx, by))
    return najlepsza[2], najlepsza[1], int(pelne.a.sum())


# ════════════════════════════════════════════════════════════════════════
# Rysunki. Punkty (t, w) w px; w < 0 = strona światła (lewa-dół).
# ════════════════════════════════════════════════════════════════════════
def profil(polowy, mat="drewno"):
    """Wielokąt symetryczny z listy (t, półszerokość)."""
    lewa = [(t, -h) for t, h in polowy]
    prawa = [(t, h) for t, h in reversed(polowy)]
    return lewa + prawa


def draw_club(rows):
    # Pałka: krótki kołek GRUBSZY NA KOŃCU, tylko drewno.
    r = Rys(rows)
    r.poly(profil([(0.2, 1.6), (0.8, 2.6), (3.0, 2.9), (7.0, 2.4), (10.5, 1.5), (rows - 0.3, 1.2)]),
           mat="drewno", rola="glowa")
    return r


def draw_hammer(rows):
    # Młot: DUŻY prostokątny łeb, oba lica płaskie (młot kowalski).
    r = Rys(rows)
    r.trzonek(0, rows)
    # łeb: korpus z jasną GÓRNĄ krawędzią + dwa CIEMNIEJSZE, lekko wyższe lica
    r.poly([(1.4, -4.4), (1.4, 4.4), (7.2, 4.4), (7.2, -4.4)], mat="stal",
           kraw=[(1.4, -4.4), (1.4, 4.4)], rola="glowa")
    for w0, w1 in ((-5.8, -4.4), (4.4, 5.8)):
        r.poly([(0.8, w0), (0.8, w1), (7.8, w1), (7.8, w0)], mat="stal_lico", rola="lico")
    return r


def draw_mace(rows):
    # Buzdygan: głowa z piór — korpus z jasną granią i ciemnymi rowkami, pióra
    # wystające po bokach jako DWA krótkie zęby z każdej strony, ciemny KOŁNIERZ
    # między głową a trzonkiem, jasna gałka. ⚠ Historia (autor, kolejno):
    # szczeliny przez zębaty obrys → „szczotka"; sam zębaty obrys → „jeż";
    # mała bryła → „mało czytelny"; gładka elipsa z granią → „łopatka".
    # Dwa zęby na stronę to minimum, które czyta się jako pióra, a nie kolce.
    r = Rys(rows)
    r.trzonek(9, rows - 9, mat="stal")
    r.trzonek(rows - 9, rows - 1, mat="skora")
    r.trzonek(rows - 1, rows, mat="stal")
    korpus = [(1.6, -1.6), (1.2, -2.6), (2.0, -2.9), (7.6, -2.9), (8.2, -2.4), (8.2, 2.4),
              (7.6, 2.9), (2.0, 2.9), (1.2, 2.6), (1.6, 1.6)]
    r.poly(korpus, mat="stal", rola="glowa")
    for s in (-1, 1):                                    # pióra: po dwa zęby na stronę
        for tc in (3.2, 6.2):
            r.poly([(tc - 1.1, s * 2.8), (tc, s * 4.2), (tc + 1.1, s * 2.8)], mat="stal", rola="pioro")
    for wl in (-1.45, 1.45):                             # rowki między piórami
        r.poly([(2.2, wl - 0.5), (2.2, wl + 0.5), (7.6, wl + 0.5), (7.6, wl - 0.5)],
               mat="szczelina", rola="rowek")
    r.poly([(1.6, -0.45), (1.6, 0.45), (8.0, 0.45), (8.0, -0.45)], mat="stal_jasna", rola="gran")
    r.poly([(8.2, -2.0), (8.2, 2.0), (9.4, 2.0), (9.4, -2.0)], mat="stal_lico", rola="kolnierz")
    r.kolo(0.9, 0.0, 1.0, mat="stal_jasna", rola="galka")
    return r


def draw_war_pick(rows):
    # Nadziak: DŁUGI, zakrzywiony w dół DZIÓB po stronie światła, malutki
    # młotek po stronie cienia.
    r = Rys(rows)
    r.trzonek(0, rows)
    gora = [(1.6, -1.8), (1.2, -4.6), (1.6, -7.4), (2.8, -9.6), (4.6, -11.0), (6.2, -11.4)]
    dol = [(5.2, -10.2), (4.0, -8.4), (3.6, -6.0), (3.6, -3.4), (3.8, -1.8)]
    r.poly([*gora, *dol], mat="stal", kraw=gora[2:], rola="dziob")
    r.poly([(1.0, -1.8), (1.0, 1.8), (4.4, 1.8), (4.4, -1.8)], mat="stal", rola="oko")
    r.poly([(1.8, 1.8), (1.8, 3.4), (1.4, 3.4), (1.4, 4.2), (4.0, 4.2), (4.0, 3.4), (3.6, 3.4), (3.6, 1.8)],
           mat="stal", rola="mlotek")
    return r


def draw_war_hammer_1h(rows):
    # Młot bojowy 1H: mały łeb z ZĄBKOWANYM licem (światło), PROSTY kolec
    # (cień) i SZPIC na górze.
    r = Rys(rows)
    r.trzonek(2, rows)
    r.poly([(0.0, 0.0), (2.4, -0.8), (2.4, 0.8)], mat="stal_jasna", rola="szpic")
    r.poly([(2.2, -2.0), (2.2, 2.0), (6.6, 2.0), (6.6, -2.0)], mat="stal_lico", rola="oko")
    lico = [(1.8, -2.0), (1.8, -4.4), (1.6, -5.4), (2.6, -5.0), (3.4, -5.4), (4.4, -5.0), (5.2, -5.4),
            (6.2, -5.0), (7.0, -5.4), (6.8, -4.4), (6.8, -2.0)]
    r.poly(lico, mat="stal", kraw=[(1.6, -5.4), (7.0, -5.4)], rola="lico")
    # ⚠ Kolec DŁUŻSZY niż na arkuszu: przy 7,6 px ginął w ikonie (v1).
    r.poly([(3.0, 2.0), (4.4, 9.6), (5.8, 2.0)], mat="stal_jasna", rola="kolec")
    return r


def draw_chain_mace(rows):
    # Korbacz: krótki trzonek owinięty skórą, okucie z kółkiem, KRÓTKI łańcuch
    # (3 ogniwa) w dół ekranu, mniejszy JAJOWATY ciężarek w obręczach.
    # (Decyzja autora 2026-10-02: łańcuch, nie rzemień.)
    r = Rys(rows)
    r.trzonek(3, rows, mat="skora")
    r.poly([(2.0, -1.6), (2.0, 1.6), (4.0, 1.6), (4.0, -1.6)], mat="stal", rola="okucie")
    luk = [(2.2, 0.0), (1.0, -0.9), (0.8, -2.4)]
    lan = luk + zwis(luk[-1], 2)[1:]
    r.lancuch(lan)
    k = lan[-1]
    c = (k[0] + G[0] * 3.2, k[1] + G[1] * 3.2)
    r.elipsa(c, G, 3.0, 2.1, mat="stal", obrecze=(-0.35, 0.35), rola="ciezarek")
    return r


def draw_stick(rows):
    # Osiosany kij: KRZYWA gałąź z sękami, koniec zaostrzony nożem, kora miejscami.
    r = Rys(rows)
    pol = []
    for i in range(0, rows + 1, 2):
        t = float(i)
        c = 0.7 * math.sin(t / 4.2)                      # krzywizna
        h = 1.7 if t > 4 else 0.35 + 1.35 * (t / 4)      # zaostrzony czubek
        # ⚠ 1,7 px, nie 1,25: cieńszy czytał się w plecaku jak patyk (v2)
        pol.append((t, c, h))
    lewa = [(t, c - h) for t, c, h in pol]
    prawa = [(t, c + h) for t, c, h in reversed(pol)]
    r.poly(lewa + prawa, mat="drewno", rola="galaz")
    for t0, strona in ((8.0, -1), (16.0, 1), (23.0, -1)):         # sęki — krótkie odrosty
        c = 0.7 * math.sin(t0 / 4.2)
        r.poly([(t0 - 0.8, c + strona * 1.4), (t0 - 2.2, c + strona * 3.4),
                (t0 - 1.0, c + strona * 3.8), (t0 + 0.8, c + strona * 1.4)], mat="drewno", rola="sek")
    for t0 in (11.0, 19.0, 26.0):                                 # łaty kory
        c = 0.7 * math.sin(t0 / 4.2)
        r.poly([(t0, c - 1.7), (t0, c + 0.2), (t0 + 2.4, c + 0.2), (t0 + 2.4, c - 1.7)], mat="kora", rola="kora")
    return r


def draw_flail(rows):
    # Kiścień: trzonek z okuciem, ŁAŃCUCH łukiem ze szczytu i 5 ogniw w zwisie,
    # gładka kula na końcu (§13.9).
    r = Rys(rows)
    r.trzonek(4, rows)
    r.poly([(3.0, -1.6), (3.0, 1.6), (5.0, 1.6), (5.0, -1.6)], mat="stal", rola="okucie")
    luk = [(3.2, 0.0), (1.6, -1.0), (1.2, -2.6)]
    lan = luk + zwis(luk[-1], 5)[1:]
    r.lancuch(lan)
    k = lan[-1]
    r.kolo(k[0] + G[0] * 3.4, k[1] + G[1] * 3.4, 2.8, mat="stal", rola="kula")
    return r


def draw_great_club(rows):
    # Maczuga: GRUBY sękaty konar — wąski przy chwycie, szeroki i ciężki u góry.
    r = Rys(rows)
    r.poly(profil([(0.2, 2.0), (1.0, 3.2), (4.0, 3.6), (9.0, 3.2), (15.0, 2.4), (22.0, 1.6),
                   (rows - 0.3, 1.25)]), mat="drewno", rola="konar")
    for t0, strona in ((5.0, -1), (10.0, 1), (15.5, -1)):
        h = 3.4 if t0 < 9 else 2.6
        r.poly([(t0 - 1.2, strona * (h - 0.4)), (t0 - 0.6, strona * (h + 1.2)),
                (t0 + 0.8, strona * (h + 1.0)), (t0 + 1.0, strona * (h - 0.6))], mat="drewno", rola="sek")
    return r


def draw_war_hammer(rows):
    # Młot bojowy 2H: ciężki łeb — płaskie lico po stronie światła, kolec po
    # stronie cienia — na długim drzewcu z krótkimi langetami.
    r = Rys(rows)
    r.trzonek(0, rows)
    r.poly([(1.0, -2.0), (1.0, 2.0), (7.6, 2.0), (7.6, -2.0)], mat="stal_lico", rola="oko")
    r.poly([(1.2, -2.0), (1.2, -5.2), (0.6, -5.2), (0.6, -6.4), (8.0, -6.4), (8.0, -5.2), (7.4, -5.2), (7.4, -2.0)],
           mat="stal", kraw=[(0.6, -6.4), (8.0, -6.4)], rola="lico")
    r.poly([(2.6, 2.0), (4.3, 8.4), (6.0, 2.0)], mat="stal_jasna", rola="kolec")
    for wl in (-1.1, 1.1):                                        # langety
        r.poly([(7.6, wl - 0.3), (7.6, wl + 0.3), (14.0, wl + 0.3), (14.0, wl - 0.3)], mat="stal", rola="langeta")
    return r


def draw_peasant_flail(rows):
    # Cep bojowy: długi kij, krótki łącznik z ogniw, BIJAK zwisający pionowo,
    # okuty ŻELAZNYMI obręczami (`material: "iron"`).
    r = Rys(rows)
    top = 2
    r.trzonek(top, rows)
    luk = [(top + 0.2, 0.0), (top - 1.2, -1.0), (top - 1.0, -2.4)]
    lan = luk + zwis(luk[-1], 1, 1.6)[1:]
    r.lancuch(lan)
    b0 = (lan[-1][0] + G[0] * 0.8, lan[-1][1] + G[1] * 0.8)
    b1 = (b0[0] + G[0] * 12.5, b0[1] + G[1] * 12.5)
    r.odcinek(b0, b1, 1.7, mat="drewno", obrecze=(0.08, 0.5, 0.92), rola="bijak")
    return r


# ════════════════════════════════════════════════════════════════════════
# Katalog
# ════════════════════════════════════════════════════════════════════════
OBUCHY = {
    "club":           dict(cm=50,  px=22, draw=draw_club, glowa=(1.0, 1.3)),
    "war_hammer_1h":  dict(cm=55,  px=24, draw=draw_war_hammer_1h, uderza="lico", glowa=(1.4, 1.4)),
    "chain_mace":     dict(cm=55,  px=24, draw=draw_chain_mace, dziury=None, zwis=True, glowa=(1.35, 1.35)),
    "hammer":         dict(cm=60,  px=26, draw=draw_hammer, glowa=(1.25, 1.25)),
    "mace":           dict(cm=60,  px=26, draw=draw_mace, glowa=(1.2, 1.2)),
    "war_pick":       dict(cm=65,  px=29, draw=draw_war_pick, uderza="dziob", glowa=(1.3, 1.3)),
    "stick":          dict(cm=70,  px=31, draw=draw_stick),
    "flail":          dict(cm=75,  px=33, draw=draw_flail, dziury=None, zwis=True, glowa=(1.25, 1.25)),
    "great_club":     dict(cm=85,  px=37, draw=draw_great_club, glowa=(1.0, 1.15)),
    "war_hammer":     dict(cm=120, px=53, draw=draw_war_hammer, uderza="lico", glowa=(1.1, 1.1)),  # ⚠ 1,25 nie mieścił się przy lewym górnym rogu
    "peasant_flail":  dict(cm=180, px=57, draw=draw_peasant_flail, dziury=None, zwis=True, glowa=(1.15, 1.15)),
}
#: ⚠ Zwisający bijak cepa idzie po stronie światła, a szczyt drzewca przy
#:   62 px leży ~2 px od lewej krawędzi — łącznik nie ma miejsca (§13.9).
ODSTEPSTWA = {"peasant_flail": "skrócony 79 → 57 — zwis bijaka przy lewym górnym rogu"}
#: Pary, które MUSZĄ się różnić sylwetką (§13.2).
PARY = [("flail", "chain_mace"), ("club", "great_club"), ("club", "stick"),
        ("war_pick", "war_hammer_1h"), ("hammer", "war_hammer_1h"), ("hammer", "mace")]
MIN_ODREBNOSC = 0.15


def maska_srodkowa(arr):
    """Alfa wyśrodkowanej ikony — do porównania sylwetek par."""
    return arr[..., 3] > 0


def main():
    paleta = {tuple(int(v) for v in c) for c in (*STEEL, *IRON, *WOOD, KONTUR)}
    ikony, rysunki, info, bledy = {}, {}, {}, []
    for nazwa, p in OBUCHY.items():
        rysunki[nazwa] = p["draw"](p["px"] - 2)
        rysunki[nazwa].powieksz(*p.get("glowa", (1.0, 1.0)))
        c, kot, pelne = dopasuj(rysunki[nazwa])
        if c is None:
            bledy.append(f"{nazwa}: nie mieści się przy żadnej kotwicy")
            continue
        info[nazwa] = (kot, int(c.a.sum()), pelne)
        ikony[nazwa] = c.finalize()

    print("=== ikony rodziny obuchowych (1×2, skos 1:2) ===")
    print(f"  {'id':<14} {'cm':>4} {'cel':>4} {'jest':>5}  kotwica")
    dl = {}
    for nazwa, arr in ikony.items():
        p, r = OBUCHY[nazwa], rysunki[nazwa]
        kot, n_ikona, n_pelne = info[nazwa]
        a = arr[..., 3] > 0
        d = float(r.rows + 2)
        dl[nazwa] = d
        if arr.shape[:2] != (64, 32):
            bledy.append(f"{nazwa}: płótno {arr.shape[1]}x{arr.shape[0]}")
        ze_skali = round(p["cm"] * SKALA)
        if nazwa not in ODSTEPSTWA and p["px"] != ze_skali:
            bledy.append(f"{nazwa}: tabela {p['px']} px ≠ {p['cm']} cm × {SKALA} = {ze_skali}")
        if abs(d - p["px"]) > 1:
            bledy.append(f"{nazwa}: długość {d:.0f}, cel {p['px']}")
        if n_ikona != n_pelne:
            bledy.append(f"{nazwa}: ucięty — na płótnie {n_ikona} px, w całości {n_pelne}")
        dz = dziury(a)
        if dz and "dziury" not in p:
            bledy.append(f"{nazwa}: {dz} px zamkniętych dziur")
        obce = {tuple(int(v) for v in q[:3]) for q in arr[a]} - paleta
        if obce:
            bledy.append(f"{nazwa}: kolory spoza palety {sorted(obce)[:4]}")
        if "uderza" in p:
            el = [e for e in r.el if e["rola"] == p["uderza"]]
            if not el or any(max(q[1] for q in e["pts"]) > 0 for e in el):
                bledy.append(f"{nazwa}: część uderzająca ({p['uderza']}) nie leży po stronie ŚWIATŁA")
        if p.get("zwis"):
            lan = [e for e in r.el if e["kind"] == "lancuch"]
            if not lan:
                bledy.append(f"{nazwa}: brak łańcucha")
            else:
                # ostatni odcinek łańcucha biegnie w dół EKRANU (kierunek g)
                (t1, w1), (t2, w2) = lan[0]["pts"][-2], lan[0]["pts"][-1]
                n = math.hypot(t2 - t1, w2 - w1)
                if ((t2 - t1) * G[0] + (w2 - w1) * G[1]) / n < 0.95:
                    bledy.append(f"{nazwa}: łańcuch nie zwisa pionowo")
        if any(e["mat"] == "drewno" for e in r.el) and nazwa in ("club", "stick", "great_club"):
            if any(e["mat"] in ("stal", "zelazo") for e in r.el):
                bledy.append(f"{nazwa}: metal w broni z samego drewna")
        print(f"  {nazwa:<14} {p['cm']:>4} {p['px']:>4} {d:>5.0f}  {str(kot):<9}"
              f"{'  (' + ODSTEPSTWA[nazwa] + ')' if nazwa in ODSTEPSTWA else ''}")

    wg = sorted(OBUCHY, key=lambda n: OBUCHY[n]["cm"])
    for a_, b_ in zip(wg, wg[1:]):
        if a_ in dl and b_ in dl and dl[a_] > dl[b_]:
            bledy.append(f"kolejność: {a_} ({dl[a_]:.0f}) dłuższy niż {b_} ({dl[b_]:.0f})")

    # ⭐ Wyśrodkowanie w polu — PO kontrolach kształtu (`tools/icon_center.py`).
    ikony = {n: wysrodkuj(a) for n, a in ikony.items()}
    bledy += bledy_srodka(ikony)

    naj = (1.0, None)
    for a_, b_ in PARY:
        if a_ in ikony and b_ in ikony:
            A, B = maska_srodkowa(ikony[a_]), maska_srodkowa(ikony[b_])
            o = 1 - (A & B).sum() / (A | B).sum()
            if o < naj[0]:
                naj = (o, (a_, b_))
            if o < MIN_ODREBNOSC:
                bledy.append(f"para {a_} / {b_} prawie identyczna (1−IoU {o:.2f})")
    print(f"\n  najbliższa para: {naj[1]}  1−IoU = {naj[0]:.2f}  (próg {MIN_ODREBNOSC})")
    for nazwa, arr in ikony.items():
        print(f"  sha1 {nazwa:<14} {hashlib.sha1(arr.tobytes()).hexdigest()[:12]}")

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
    S, gap = 8, 12
    tlo = (0x1c, 0x20, 0x30, 255)
    kolej = [n for n in OBUCHY if n in ikony]
    wczytaj = lambda n: Image.open(CEL / f"icon_{n}.png").convert("RGBA")
    przed = ["weapon_dagger", "weapon_hatchet"]
    po = ["weapon_sword", "weapon_battle_axe", "weapon_halberd"]
    polka = ([wczytaj(n) for n in przed if (CEL / f"icon_{n}.png").exists()]
             + [Image.fromarray(ikony[n], "RGBA") for n in kolej]
             + [wczytaj(n) for n in po if (CEL / f"icon_{n}.png").exists()])
    szer = max(len(kolej) * (32 * S + gap), len(polka) * (32 * 2 + 6)) + gap
    wys = 64 * S + 20 + 64 * 2 + 20 + 64 + 20
    im = Image.new("RGBA", (szer, wys), (28, 28, 32, 255))
    for i, n in enumerate(kolej):
        ic = Image.fromarray(ikony[n], "RGBA")
        x = gap + i * (32 * S + gap)
        im.paste(Image.new("RGBA", (32 * S, 64 * S), tlo), (x, 10))
        im.alpha_composite(ic.resize((32 * S, 64 * S), Image.NEAREST), (x, 10))
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

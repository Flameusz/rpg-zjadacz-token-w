# -*- coding: utf-8 -*-
"""
Ikony rodziny MIECZY (10 sztuk): wszystkie 32x64 PO SKOSIE 1:2 (sztych w lewym
górnym, głowica w prawym dolnym), jak drzewcowe. ⚠ 1×1 jest wyłącznie dla
broni do ~45 cm (sztylety, toporek) — decyzja autora 2026-10-02; krótki miecz
(65 cm) przeszedł wtedy z 45° na skos.

    python tools/build_sword_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_sword_icons.py --podglad X.png    # + podgląd 8x i półka skali
    python tools/build_sword_icons.py --zapisz           # zapis do public/assets/items/

── Skąd kształty i liczby ──────────────────────────────────────────────────
Projekt: wsad Gemini `docs/art-review/gemini/swords_*_v1_raw.png`, ocena
w `docs/gemini_weapon_icons.md` §10.7. ⛔ Arkusz NIE jest źródłem pikseli
(§9 tamże: skalowanie zjadało jelce) — z niego są wyłącznie sylwetki i cechy
rozpoznawcze. Piksele rysuje ten plik, natywnie w docelowej rozdzielczości.

Długość = cm x 0,44 — ta sama skala co tarcze (`build_shield_icons.py`) i groty
drzewcowych, żeby w sklepie miecz i tarcza nie kłamały o rozmiarze.
⚠ Świadome odstępstwa: szabla (cięciwa łuku, 1 px krócej) i wielki miecz
(180 cm = 79 px nie mieści się — ścięty do najdłuższej przekątnej, która
zostawia jelcowi miejsce: 60).

── Układ: SKOS 1:2 (decyzja autora 2026-10-01: „o niebo lepiej pasuje do gry") ─
Do 2026-10-01 miecze 1×2 stały pionowo. Przymiar obok sztyletów (45°)
i drzewcowych (1:2) pokazał dwa zestawy w jednym plecaku; od tej daty REGUŁA:
**broń zawsze po skosie, kąt wynika z gabarytu** — 1×1 → 45°, 1×2 → 1:2.

Osie broni jak w `build_polearm_icons.py`: s = x + 2y (wzdłuż), u = 2x − y
(w poprzek). ⭐ Rysunek jest opisany w PASACH: pas = dwie kolejne wartości `u`,
czyli DOKŁADNIE jeden piksel w każdym wierszu płótna. Wtedy każdy ton biegnie
równym paskiem wzdłuż głowni.
⚠ Przymiar z tonem liczonym od CIĄGŁEJ odległości od osi dawał kropkowanie
po przekątnej — w jednym wierszu próg wypadał między pikselami, w następnym
nie. Pas jest liczbą całkowitą, więc tego problemu nie ma.
`t` = piksele wzdłuż osi od sztychu; wiersz rysunku pionowego = 1 px `t`, więc
proporcje mieczy przeszły z pionu bez zmian.

⚠ **Prawy dolny róg jest CIASNY:** jelec wychodzi w poprzek osi właśnie tam,
gdzie leży rękojeść. Kotwica (koniec głowicy) jest więc DOBIERANA: najbliżej
rogu, przy której nic nie dotyka ramki (`MARGINES`). Krótka broń kończy się
przed lewym górnym rogiem, jak sztylety.

── Kolory ───────────────────────────────────────────────────────────────────
Stal: 5-stopniowa rampa z `build_armor_icons.py` (tony sztyletów + `S_MID`).
Drewno/skóra: `tools/wood_palette.py`.
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
from build_armor_icons import STEEL  # noqa: E402

KORZEN = Path(__file__).resolve().parent.parent
CEL = KORZEN / "public" / "assets" / "items"
SKALA = 0.44          # px / cm — wspólna z tarczami, ⛔ nie stroić
R5 = math.sqrt(5)
W, H = 32, 64
MARGINES = 1          # wnętrze od ramki; kontur 1 px musi się zmieścić

S_DARK, S_MID, S_BASE, S_HI, S_LIGHT = STEEL
LEATHER = (WOOD[0], WOOD[2], WOOD[4])      # ciemny, baza, światło
SLAB = (WOOD[4], WOOD[7], WOOD[10])        # jasne drewno okładzin kordu


class Canvas:
    """Wypełnienie bez konturu; kontur dokłada `finalize` jedną dylatacją
    (8-sąsiedztwo) wokół całej sylwetki — jak w generatorze sztyletów."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.rgb = np.zeros((h, w, 3), np.uint8)
        self.a = np.zeros((h, w), bool)

    def set(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.rgb[y, x] = color
            self.a[y, x] = True

    def finalize(self):
        out = np.zeros((self.h, self.w, 4), np.uint8)
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
        return out


# ════════════════════════════════════════════════════════════════════════
# Rysunek w osiach (t, b): t = wiersz od sztychu (całkowity), b = pas w poprzek
# (0 = oś; ujemne = lewa-dolna strona, ŚWIATŁO; dodatnie = cień).
# Każdy miecz to słownik {(t, b): kolor} budowany przez elementy niżej.
# ════════════════════════════════════════════════════════════════════════
def blade_tone(b, lo, hi, fuller=False):
    """Światło z lewej-góry: krawędź od światła L, od cienia M, zbrocze D."""
    if b == lo:
        return S_LIGHT
    if b == hi:
        return S_MID
    if fuller and b == 0 and hi - lo >= 4:
        return S_DARK
    return S_BASE if b <= 0 else S_MID


def blade(px, t0, n, hw, taper, fuller_rows=None):
    """Obosieczna, symetryczna. `taper`: co ile wierszy od sztychu półszerokość
    rośnie o 1. `fuller_rows`: (od, do) liczone od sztychu."""
    for t in range(n):
        h = min(hw, (t + taper - 1) // taper)
        full = fuller_rows is not None and fuller_rows[0] <= t < fuller_rows[1]
        for b in range(-h, h + 1):
            px[(t0 + t, b)] = blade_tone(b, -h, h, full)
    return t0 + n


def guard(px, t0, half, rows=2):
    for r in range(rows):
        for b in range(-half, half + 1):
            px[(t0 + r, b)] = S_LIGHT if r == 0 and b < half else S_MID
    return t0 + rows


def grip(px, t0, n, tones=LEATHER, wrap=True, ring_at=None):
    dark, base, light = tones
    for i in range(n):
        if ring_at is not None and i == ring_at:
            for b in range(-2, 3):
                px[(t0 + i, b)] = S_BASE if b < 0 else S_MID
            continue
        px[(t0 + i, -1)] = light
        px[(t0 + i, 0)] = dark if (wrap and i % 2 == 0) else base
        px[(t0 + i, 1)] = dark
    return t0 + n


def pommel(px, t0, widths):
    """Gałka jako lista szerokości wierszy (nieparzyste, symetryczne)."""
    n = len(widths)
    for r, w in enumerate(widths):
        h = w // 2
        for b in range(-h, h + 1):
            k = b + (r - (n - 1) / 2)
            px[(t0 + r, b)] = S_LIGHT if k < -1.5 else (S_BASE if k < 0.5 else S_MID)
    return t0 + n


def draw_messer():
    # Jednosieczny: grzbiet prosto po stronie cienia aż pod sztych, ostrze od
    # światła podchodzi łukiem do grzbietu. Krótki jelec, płaska drewniana
    # okładzina z nitami, bez gałki (tylko rozszerzona piętka).
    px, hi, n = {}, 1, 24
    for t in range(n):
        if t == 0:
            lo, top = hi - 1, hi - 1                # lekko ścięty sztych
        else:
            lo, top = hi - min(3, 1 + t // 2), hi
        for b in range(lo, top + 1):
            px[(t, b)] = blade_tone(b, lo, top)
    t = guard(px, n, 3)
    t0 = t
    t = grip(px, t, 6, tones=SLAB, wrap=False)
    for r in (1, 4):
        px[(t0 + r, 0)] = S_LIGHT
    for b in range(-2, 3):                          # piętka okładzin
        px[(t, b)] = SLAB[1] if b <= 0 else SLAB[0]
    return px


def draw_cleaver():
    # Tasak: grzbiet prosty (cień), głownia ROŚNIE ku sztychowi (3 → 6 pasów),
    # czubek ścięty od grzbietu ku ostrzu.
    px, hi, n = {}, 1, 26
    for t in range(n):
        width = 3 + round(3 * (1 - t / (n - 1)))
        lo = hi - min(t, width - 1)
        for b in range(lo, hi + 1):
            px[(t, b)] = blade_tone(b, lo, hi)
    t = guard(px, n, 3)
    t = grip(px, t, 5)
    pommel(px, t, [3, 3])
    return px


def draw_sword():
    px = {}
    t = blade(px, 0, 28, 2, 3, fuller_rows=(8, 26))
    t = guard(px, t, 5)
    t = grip(px, t, 5)
    pommel(px, t, [3, 5, 3])
    return px


def draw_sabre():
    # Krzywa głownia: sztych ucieka ku CIENIOWI (prawa-góra, tam jest wolne
    # płótno), ostrze po stronie światła (wypukłej). Rękojeść na końcu
    # zagina się ku światłu w hak.
    px, n = {}, 28
    for t in range(n):
        d = n - 1 - t                               # odległość od jelca
        # wykładnik 1,6, nie 2 — przy paraboli krzywizna schodziła się pod
        # sztychem w trzech skokach i czytała jak złamana głownia
        # ⚠ 6 pasów, nie 4: przy 4 szabla w plecaku czytała się prawie prosto,
        #   a krzywizna to jej jedyna cecha (audyt 2026-10-03)
        dx = round(6 * (d / (n - 1)) ** 1.6)
        lo, hi = -1 + dx, 1 + dx
        if t < 2:
            lo = hi - t                             # sztych od strony grzbietu
        elif t < 4:
            lo = hi - 1 - (t - 2)
        for b in range(lo, hi + 1):
            px[(t, b)] = blade_tone(b, lo, hi)
    t = guard(px, n, 3)
    dark, base, light = LEATHER
    for i in range(5):
        sh = -1 if i >= 3 else 0
        px[(t + i, -1 + sh)] = light
        px[(t + i, sh)] = dark if i % 2 == 0 else base
        px[(t + i, 1 + sh)] = dark
    t += 5
    for b in range(-4, 1):                          # hak głowicy ku światłu
        px[(t, b)] = S_BASE if b < -1 else S_MID
    px[(t - 1, -4)] = S_LIGHT
    return px


def draw_longsword():
    # Cecha: WĘŻSZA głownia bez zbrocza (3 pasy, grań) i dłuższy trzon niż miecz.
    px = {}
    t = blade(px, 0, 31, 1, 3)
    t = guard(px, t, 6)
    t = grip(px, t, 7)
    pommel(px, t, [3, 3])
    return px


def draw_rapier():
    # Igła 1 px + pałąk + pierścień nad jelcem. ⚠ Pałąk po stronie ŚWIATŁA
    # (lewa-dół): po stronie cienia leży prawy dolny róg płótna i kosz
    # zbijał się w plątaninę (przymiar 2026-10-01).
    px, n = {}, 36
    for t in range(n):
        px[(t, 0)] = S_LIGHT if t < n - 4 else S_BASE
    tg = n
    for b in (-3, -2, 2, 3):                        # pierścień wokół nasady głowni
        px[(tg - 2, b)] = S_BASE
    for b in (-4, 4):
        px[(tg - 1, b)] = S_MID
    t = guard(px, tg, 5, rows=1)
    t = grip(px, t, 6)
    t_pom = t
    t = pommel(px, t, [3, 3])
    bow = [(tg + 1, -6), (tg + 2, -6), (tg + 3, -6), (tg + 4, -6),
           (tg + 5, -5), (tg + 6, -4), (t_pom, -3), (t_pom, -2)]
    for tb in bow:
        px[tb] = S_MID
    return px


def draw_bastard():
    px = {}
    t = blade(px, 0, 35, 2, 3, fuller_rows=(12, 33))
    t = guard(px, t, 6)
    t = grip(px, t, 8, ring_at=4)
    pommel(px, t, [3, 3, 5, 5, 3])                  # gruszka: wąsko od głowni
    return px


def draw_greatsword():
    px = {}
    t = blade(px, 0, 41, 2, 3)
    t = guard(px, t, 8)
    t = grip(px, t, 10, ring_at=5)
    pommel(px, t, [3, 5, 5, 3])
    return px


def draw_zweihander():
    # Zbrocze przez CAŁĄ głownię, haczyki nad jelcem, węższe ricasso, bardzo
    # szeroki jelec. README: zbrocze jest jego cechą — nie kasować.
    px = {}
    t = blade(px, 0, 33, 3, 3, fuller_rows=(6, 33))
    for b in range(-5, 6):                          # haczyki (wąsy parujące)
        if abs(b) >= 3:
            px[(t, b)] = S_LIGHT if b < 0 else S_MID
    for b in range(-2, 3):
        px[(t, b)] = blade_tone(b, -2, 2)
    px[(t - 1, -5)] = S_LIGHT
    px[(t - 1, 5)] = S_MID
    t += 1
    for r in range(6):                              # ricasso
        for b in range(-2, 3):
            px[(t + r, b)] = blade_tone(b, -2, 2)
    t = guard(px, t + 6, 10)
    t = grip(px, t, 13, ring_at=5)
    pommel(px, t, [3, 5, 5, 5, 3])
    return px


def draw_short_sword():
    # Najkrótszy miecz: prosta głownia, krótka rękojeść. ⚠ Do 2026-10-02 leżał na 1×1 pod 45° w osiach noży;
    # decyzja autora: 1×1 tylko dla broni do ~45 cm (sztylety, toporek), więc
    # przeszedł na skos 1:2 jak reszta rodziny.
    px = {}
    # ⚠ Głownia 5 pasów jak miecz, nie 7: szeroka czytała się „dziwnie szeroko"
    #   (autor 2026-10-02). Krótki miecz niesie długość i kształt gladiusa —
    #   równoległa głownia, sztych zbiega się w 4 wierszach.
    t = blade(px, 0, 18, 2, 2)
    # jelec 2 pasy szerszy od głowni — przy 1 pasie czytał się jak nóż
    t = guard(px, t, 4)
    t = grip(px, t, 4)
    pommel(px, t, [3, 5, 3])
    return px


# ════════════════════════════════════════════════════════════════════════
# Rasteryzacja skosu: (t, b) → piksele płótna 32x64.
# ════════════════════════════════════════════════════════════════════════
def rasteryzuj(px, koniec, w=W, h=H):
    """`koniec` = piksel osi (x, y), w którym kończy się głowica. Wiersz `t`
    rysunku to przedział s = [s_t, s_t + √5) liczony od sztychu; pas `b` to
    dwie kolejne wartości u. Zwraca Canvas (bez konturu)."""
    L = max(t for t, _ in px) + 1
    bx, by = koniec
    s_konca = bx + 2 * by
    s_szt = s_konca - (L - 1) * R5          # środek ostatniego wiersza trafia w koniec
    u_os = 2 * bx - by                      # pas 0 = {u_os, u_os + 1}
    c = Canvas(w, h)
    for y in range(h):
        for x in range(w):
            s, u = x + 2 * y, 2 * x - y
            t = math.floor((s - s_szt) / R5 + 0.5)
            if t < 0 or t >= L:
                continue
            b = (u - u_os) // 2
            col = px.get((t, b))
            if col is not None:
                c.set(x, y, col)
    return c


def dopasuj(px):
    """Kotwica najbliżej prawego dolnego rogu, przy której wnętrze nie dotyka
    ramki. ⚠ Szukane po CAŁEJ siatce kotwic, nie „przesuń o 1–2 px": jelec
    wielkiego miecza i pałąk rapiera potrzebują różnych przesunięć."""
    najlepsza = None
    for by in range(H - 1 - MARGINES, H - 12, -1):
        for bx in range(W - 1 - MARGINES, W - 12, -1):
            c = rasteryzuj(px, (bx, by))
            if not c.a.any():
                continue
            ys, xs = np.nonzero(c.a)
            if (xs.min() < MARGINES or ys.min() < MARGINES or xs.max() > W - 1 - MARGINES
                    or ys.max() > H - 1 - MARGINES):
                continue
            odl = (W - 1 - bx) ** 2 + (H - 1 - by) ** 2
            if najlepsza is None or odl < najlepsza[0]:
                najlepsza = (odl, (bx, by), c)
    if najlepsza is None:
        return None, None
    return najlepsza[2], najlepsza[1]


# ════════════════════════════════════════════════════════════════════════
# Katalog: id → (cm, oczekiwana długość px, gabaryt, rysunek, dziury dozwolone)
# ════════════════════════════════════════════════════════════════════════
MIECZE = {
    "short_sword":   dict(cm=65,  px=29, pole="1x2", draw=draw_short_sword),
    "messer":        dict(cm=80,  px=35, pole="1x2", draw=draw_messer),
    "cleaver_sword": dict(cm=85,  px=37, pole="1x2", draw=draw_cleaver),
    "sword":         dict(cm=90,  px=40, pole="1x2", draw=draw_sword),
    "sabre":         dict(cm=90,  px=39, pole="1x2", draw=draw_sabre),
    "longsword":     dict(cm=100, px=44, pole="1x2", draw=draw_longsword),
    "rapier":        dict(cm=110, px=48, pole="1x2", draw=draw_rapier, dziury=True),
    "bastard_sword": dict(cm=118, px=52, pole="1x2", draw=draw_bastard),
    "greatsword":    dict(cm=135, px=59, pole="1x2", draw=draw_greatsword),
    "zweihander":    dict(cm=180, px=62, pole="1x2", draw=draw_zweihander),
}
ODSTEPSTWA = {"sabre": "cięciwa łuku", "zweihander": "ścięty — 79 px nie mieści się w kaflu"}


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


def odrebnosc(a, b):
    """1 − IoU rysunków w osiach (t, b), wyrównanych do GŁOWICY (wspólna
    kotwica). Liczone na rysunku, nie na płótnie — kotwice różnią się o piksel."""
    La = max(t for t, _ in a) + 1
    Lb = max(t for t, _ in b) + 1
    A = {(La - 1 - t, bb) for t, bb in a}
    B = {(Lb - 1 - t, bb) for t, bb in b}
    return 1 - len(A & B) / len(A | B)


MIN_ODREBNOSC = 0.15   # próg projektowy, nie wynik tego generatora


def main():
    paleta = {tuple(int(v) for v in c) for c in (*STEEL, *WOOD, KONTUR)}
    ikony, rysunki, kotwice, ikony_wn, bledy = {}, {}, {}, {}, []
    for nazwa, p in MIECZE.items():
        rysunki[nazwa] = p["draw"]()
        c, kot = dopasuj(rysunki[nazwa])
        if c is None:
            bledy.append(f"{nazwa}: nie mieści się w 32x64 przy żadnej kotwicy")
            continue
        kotwice[nazwa] = kot
        ikony_wn[nazwa] = c.a.sum()
        ikony[nazwa] = c.finalize()

    print("=== ikony rodziny mieczy (1×2 po skosie 1:2) ===")
    print(f"  {'id':<14} {'pole':<4} {'cm':>4} {'cel':>4} {'jest':>5}  kotwica  bbox")
    dlugosci = {}
    for nazwa, arr in ikony.items():
        p = MIECZE[nazwa]
        a = arr[..., 3] > 0
        ys, xs = np.nonzero(a)
        Hh, Ww = arr.shape[:2]
        if (Hh, Ww) != (64, 32) or p["pole"] != "1x2":
            bledy.append(f"{nazwa}: płótno {Ww}x{Hh} / pole {p['pole']} — miecz to zawsze 32x64, 1×2")
        # długość = rysunek wzdłuż osi + kontur na obu końcach (tak liczy
        # się pion i tarcze: bbox RAZEM z konturem)
        dl = float(max(t for t, _ in rysunki[nazwa]) + 1 + 2)
        s = xs + 2 * ys
        na_plotnie = (s.max() - s.min()) / R5 + 1
        if abs(na_plotnie - dl) > 2:
            bledy.append(f"{nazwa}: na płótnie {na_plotnie:.1f} px wzdłuż osi, rysunek {dl:.0f}")
        dlugosci[nazwa] = dl
        ze_skali = min(62, round(p["cm"] * SKALA))
        if nazwa not in ODSTEPSTWA and p["px"] != ze_skali:
            bledy.append(f"{nazwa}: tabela {p['px']} px ≠ {p['cm']} cm × {SKALA} = {ze_skali}")
        if nazwa == "zweihander":
            cel = 62
        else:
            cel = p["px"]
        if abs(dl - cel) > 1:
            bledy.append(f"{nazwa}: długość {dl:.0f} px, cel {cel} (±1)")
        d = dziury(a)
        if d and not p.get("dziury"):
            bledy.append(f"{nazwa}: {d} px zamkniętych dziur")
        if p.get("dziury") and not d:
            bledy.append(f"{nazwa}: pałąk nie zamyka dłoni (brak prześwitu)")
        obce = {tuple(int(v) for v in px[:3]) for px in arr[a]} - paleta
        if obce:
            bledy.append(f"{nazwa}: kolory spoza palety {sorted(obce)[:4]}")
        if p["pole"] == "1x2":
            wn = arr[..., 3] > 0
            wn &= ~np.all(arr[..., :3] == KONTUR, axis=-1)
            wy, wx = np.nonzero(wn)
            if (wx.min() < MARGINES or wy.min() < MARGINES or wx.max() > W - 1 - MARGINES
                    or wy.max() > H - 1 - MARGINES):
                bledy.append(f"{nazwa}: wnętrze dotyka ramki — kontur ucięty")
            # ⚠ Rysunek MUSI trafić na płótno w całości. Porównanie z tym samym
            #   rysunkiem na DUŻYM płótnie, z kotwicą przesuniętą o (32, 64):
            #   to przesuwa s o 160 i u o 0, więc wzór pikseli jest identyczny,
            #   a nic nie dochodzi do krawędzi. ⛔ Nie licz „piksel na pas" —
            #   kratka 1:2 ma wyznacznik 5, więc pas wiersza dostaje legalnie
            #   0, 1 albo 2 piksele.
            bx, by = kotwice[nazwa]
            duze = rasteryzuj(rysunki[nazwa], (bx + 32, by + 64), W + 64, H + 128)
            if int(duze.a.sum()) != int(ikony_wn[nazwa]):
                bledy.append(f"{nazwa}: ucięty — na płótnie {int(ikony_wn[nazwa])} px, "
                             f"w całości {int(duze.a.sum())}")
        uwaga = f"  ({ODSTEPSTWA[nazwa]})" if nazwa in ODSTEPSTWA else ""
        kot = kotwice.get(nazwa, "45°")
        print(f"  {nazwa:<14} {p['pole']:<4} {p['cm']:>4} {p['px']:>4} {dl:>5.0f}  {str(kot):<8} "
              f"({xs.min()},{ys.min()})-({xs.max()},{ys.max()}){uwaga}")

    # Kolejność długości wg cm musi przeżyć rysunek (szabla = miecz − 1 wolno).
    wg_cm = sorted(MIECZE, key=lambda n: (MIECZE[n]["cm"], MIECZE[n]["px"]))
    for a_, b_ in zip(wg_cm, wg_cm[1:]):
        if a_ in dlugosci and b_ in dlugosci and dlugosci[a_] > dlugosci[b_] \
                and MIECZE[a_]["cm"] != MIECZE[b_]["cm"]:
            bledy.append(f"kolejność: {a_} ({dlugosci[a_]:.0f}) dłuższy niż {b_} ({dlugosci[b_]:.0f})")

    # Każda para sylwetek 1×2 musi się różnić.
    nazwy = list(rysunki)
    najblizsze = (1.0, None)
    for i, a_ in enumerate(nazwy):
        for b_ in nazwy[i + 1:]:
            o = odrebnosc(rysunki[a_], rysunki[b_])
            if o < najblizsze[0]:
                najblizsze = (o, (a_, b_))
            if o < MIN_ODREBNOSC:
                bledy.append(f"sylwetki {a_} / {b_} prawie identyczne (1−IoU {o:.2f})")
    print(f"\n  najbliższa para sylwetek: {najblizsze[1]}  1−IoU = {najblizsze[0]:.2f}"
          f"  (próg {MIN_ODREBNOSC})")
    for nazwa, arr in ikony.items():
        print(f"  sha1 {nazwa:<14} {hashlib.sha1(arr.tobytes()).hexdigest()[:12]}")

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
    plecak) ze sztyletami, drzewcowymi i tarczą z gry. Rząd 3: to samo 1x."""
    S, gap = 8, 12
    tlo = (0x1c, 0x20, 0x30, 255)
    kolej = list(MIECZE)
    przed = [n for n in ("weapon_knife", "weapon_dagger", "weapon_misericorde")]
    po = [n for n in ("weapon_spear", "weapon_halberd", "weapon_pike", "shield_wood_pavise")]
    wczytaj = lambda n: Image.open(CEL / f"icon_{n}.png").convert("RGBA")
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
    for k, skala in enumerate((2, 1)):
        y0 = 64 * S + 20 + (0 if k == 0 else 64 * 2 + 20)
        x = gap
        for ic in polka:
            y = y0 + (64 - ic.height) * skala
            im.alpha_composite(Image.new("RGBA", (32 * skala, ic.height * skala), tlo), (x, y))
            im.alpha_composite(ic.resize((ic.width * skala, ic.height * skala), Image.NEAREST), (x, y))
            x += 32 * skala + 6
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    im.save(sciezka)
    print(f"\npodgląd: {sciezka}")


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Ikony TOREB (sakiewka, torba, sakwa, plecak) w stylu skórzanego ekwipunku —
RYSOWANE w kodzie, piksel po pikselu.

    python tools/build_bag_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_bag_icons.py --podglad X.png    # + podgląd ×8 i ×1/×2 obok skórzanego pancerza
    python tools/build_bag_icons.py --zapisz           # zapis public/assets/items/icon_bag_1..4.png

── Historia ─────────────────────────────────────────────────────────────────
1. do 2026-10-04: Lanczos z 64×64 `assets/bag-1..4.png` — 315–496 kolorów,
   miękki brzeg, nasycona pomarańcz; obok skórzanego pancerza jak z innej gry.
2. 2026-10-04 rano: te same źródła ścieżką skórzanego kaftana
   (`build_armor_icons`: przyciągnięcie do rampy + głosowanie). Kolor i kontur
   się zgadzały, ale ⚠ **zmniejszenie zjadło BUDOWĘ**: klapy, pasek sakwy,
   sprzączki i paski plecaka rozpłynęły się w bryły z przypadkowymi jasnymi
   plamami — sakwa czytała się jak kamień. Ta sama lekcja co jajko
   (`tools/CLAUDE.md`): przy takim rozmiarze taniej NARYSOWAĆ.
3. dziś: kształty z geometrii (elipsy, wielokąty, łuki), jedno światło
   z lewej-góry, szwy klap rysowane świadomie. Źródła 64×64 są już tylko
   REFERENCJĄ kształtu.

── Kolory: wyłącznie wspólne standardy ─────────────────────────────────────
Skóra `wood_palette.RAMPA` na stopniach 2 (szew) · 4 (cień) · 7 (baza) ·
10 (światło) · 11 (połysk) — te same co naramienniki skórzane. Sznurek
i mosiądz → `BAST` (łyko łapci; osobnej rampy mosiądzu w projekcie nie ma
i ⛔ nie dopisuje się jej „tylko dla torby"). Sprzączka sakwy → `IRON`.
Kontur `wood_palette.KONTUR`, 4-sąsiedni (jak cały ekwipunek).
"""
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_armor_icons as A  # noqa: E402  (kontrolki: kontrast, dziury, gruby kontur, odrębność)
from icon_center import wysrodkuj, bledy_srodka  # noqa: E402
from metal_palette import IRON  # noqa: E402
from wood_palette import RAMPA as SKORA, KONTUR  # noqa: E402

KORZEN = Path(__file__).resolve().parent.parent
CEL = KORZEN / "public" / "assets" / "items"
N = 32
SS = 4                      # nadpróbkowanie przy rasteryzacji kształtów

BAST = A.BAST               # ta sama rampa co łapcie (`build_armor_icons`)
#: Tony skóry: (szew, cień, baza, światło, połysk) — stopnie `wood_palette`.
SZEW, CIEN, BAZA, SWIATLO, POLYSK = 2, 4, 7, 10, 11


# ════════════════════════════════════════════════════════════════════════════
# RASTER — maska pokrycia ≥ 50 % z nadpróbkowania
# ════════════════════════════════════════════════════════════════════════════
_o = (np.arange(N * SS) + 0.5) / SS
X, Y = np.meshgrid(_o, _o)


def _do_pikseli(m):
    return m.reshape(N, SS, N, SS).mean(axis=(1, 3)) >= 0.5


def elipsa(cx, cy, rx, ry):
    return _do_pikseli(((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2 <= 1.0)


def wielokat(pts):
    """Parzystość przecięć poziomego promienia — kształty są proste."""
    m = np.zeros_like(X, bool)
    n = len(pts)
    for i in range(n):
        (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
        if y1 == y2:
            continue
        c = (Y >= min(y1, y2)) & (Y < max(y1, y2))
        xs = x1 + (Y - y1) * (x2 - x1) / (y2 - y1)
        m ^= c & (X < xs)
    return _do_pikseli(m)


def prost(x0, y0, x1, y1, r=0.0):
    """Prostokąt z zaokrąglonymi rogami promienia `r`."""
    cx = np.clip(X, x0 + r, x1 - r)
    cy = np.clip(Y, y0 + r, y1 - r)
    m = ((X - cx) ** 2 + (Y - cy) ** 2 <= r * r + 1e-9) & (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1)
    return _do_pikseli(m)


def linia(pts, gr):
    """Łamana o grubości `gr` (kapsuły między punktami)."""
    m = np.zeros_like(X, bool)
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        dx, dy = x2 - x1, y2 - y1
        t = np.clip(((X - x1) * dx + (Y - y1) * dy) / max(1e-9, dx * dx + dy * dy), 0, 1)
        m |= (X - (x1 + t * dx)) ** 2 + (Y - (y1 + t * dy)) ** 2 <= (gr / 2) ** 2
    return _do_pikseli(m)


def luk(cx, cy, rx, ry, a0, a1, gr, n=24):
    pts = [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
            cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    return linia(pts, gr)


# ════════════════════════════════════════════════════════════════════════════
# MALOWANIE — warstwy w kolejności rysowania, jedno światło z lewej-góry
# ════════════════════════════════════════════════════════════════════════════
class Plotno:
    def __init__(self):
        self.wl = np.full((N, N), -1)          # numer warstwy-właściciela piksela
        self.kol = np.zeros((N, N, 3), np.uint8)
        self.warstwy = []

    def skora(self, maska, nazwa, bryla=0.55, cien_rzucany=True, rampa=None):
        """Warstwa skóry: kopuła światła z lewej-góry + obręcz (góra/lewo jaśniej,
        dół/prawo cień). `cien_rzucany`: piksel warstwy NIŻEJ tuż pod tą
        warstwą dostaje ton szwu — klapa leży NA torbie, a nie obok niej."""
        k = len(self.warstwy)
        self.warstwy.append(nazwa)
        # Inna rampa (len posłania): te same tony skóry przełożone na jej 4 stopnie.
        kolor = (lambda st: SKORA[st]) if rampa is None else (lambda st: rampa[LEN_STOPNIE[st]])
        ys, xs = np.nonzero(maska)
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        w, h = max(1, xs.max() - xs.min()) / 2, max(1, ys.max() - ys.min()) / 2
        for y, x in zip(ys, xs):
            u, v = (x - cx) / w, (y - cy) / h
            s = -0.55 * (u + v) + bryla * (1 - min(1.0, u * u + v * v))
            st = POLYSK if s > 0.75 else SWIATLO if s > 0.32 else BAZA if s > -0.45 else CIEN
            gora = y == 0 or not maska[y - 1, x]
            lewo = x == 0 or not maska[y, x - 1]
            dol = y == N - 1 or not maska[y + 1, x]
            prawo = x == N - 1 or not maska[y, x + 1]
            if dol or prawo:
                st = CIEN
            elif gora or lewo:
                st = max(st, SWIATLO)
            self.wl[y, x] = k
            self.kol[y, x] = kolor(st)
        if cien_rzucany and k > 0:
            for y, x in zip(ys, xs):
                if y + 1 < N and not maska[y + 1, x] and 0 <= self.wl[y + 1, x] < k:
                    self.kol[y + 1, x] = SKORA[SZEW]

    def plaski(self, maska, kolory, nazwa):
        """Drobny element (sznurek, sprzączka): `kolory` = (cień, baza, światło)."""
        k = len(self.warstwy)
        self.warstwy.append(nazwa)
        for y, x in zip(*np.nonzero(maska)):
            gora = y == 0 or not maska[y - 1, x]
            dol = y == N - 1 or not maska[y + 1, x]
            prawo = x == N - 1 or not maska[y, x + 1]
            c = kolory[2] if gora else kolory[0] if (dol or prawo) else kolory[1]
            self.wl[y, x] = k
            self.kol[y, x] = c

    def rysuj(self, maska, kolor):
        """Linia/szew/otwór WEWNĄTRZ już namalowanej bryły (nie poszerza sylwetki)."""
        m = maska & (self.wl >= 0)
        self.kol[m] = kolor

    def kafel(self):
        """Kontur 4-sąsiedni dookoła sylwetki (ta sama linia co `na_kafel`)."""
        a = self.wl >= 0
        out = np.zeros((N, N, 4), np.uint8)
        out[a, :3] = self.kol[a]
        out[a, 3] = 255
        g = a.copy()
        g[1:, :] |= a[:-1, :]
        g[:-1, :] |= a[1:, :]
        g[:, 1:] |= a[:, :-1]
        g[:, :-1] |= a[:, 1:]
        out[g & ~a] = (*KONTUR, 255)
        return out


#: ⚠ Cień sznurka to BAST[1], nie BAST[0]: cienka ukośna linia to prawie same
#:   piksele „dół/prawo”, a BAST[0] (140,98,60) leży o krok od skóry — końce
#:   sznurka były w buforze, ale na worku ich nie było widać.
SZNUREK = (BAST[1], BAST[2], BAST[3])
#: Posłanie sakwy: wspólna rampa lnu (`build_armor_icons.LINEN`, 4 stopnie).
LEN = A.LINEN
LEN_STOPNIE = {SZEW: 0, CIEN: 0, BAZA: 1, SWIATLO: 2, POLYSK: 3}
MOSIADZ = (BAST[1], BAST[2], BAST[3])
ZELAZO = (IRON[1], IRON[3], IRON[4])


# ════════════════════════════════════════════════════════════════════════════
# CZTERY TORBY
# ════════════════════════════════════════════════════════════════════════════
def sakiewka():
    """Mała sakiewka (2 sloty): pękaty worek, zmarszczona szyjka, sznurek
    z supłem i dwoma zwisającymi końcami — jedyna torba bez klapy."""
    p = Plotno()
    p.skora(elipsa(16, 21.5, 10.2, 8.3), "worek", bryla=0.75)
    p.skora(wielokat([(12.2, 10.6), (19.8, 10.6), (19.3, 15.0), (12.7, 15.0)]), "szyjka", cien_rzucany=False)
    p.skora(wielokat([(8.5, 8.8), (10.6, 5.0), (12.8, 7.6), (16.0, 4.2), (19.2, 7.6), (21.4, 5.0), (23.5, 8.8),
                      (20.6, 11.2), (11.4, 11.2)]), "falbana", bryla=0.5)
    p.rysuj(elipsa(16, 8.3, 3.6, 1.3), SKORA[SZEW])                       # otwór
    for xx in (13.2, 18.8):                                               # marszczenia szyjki
        p.rysuj(linia([(xx, 11.5), (xx + (0.4 if xx > 16 else -0.4), 14.5)], 0.9), SKORA[CIEN])
    p.plaski(linia([(11.6, 12.6), (20.4, 12.6)], 1.6), SZNUREK, "sznurek")
    p.plaski(elipsa(18.6, 13.0, 1.5, 1.3), SZNUREK, "supeł")
    # ⚠ Grubość 1,7, nie 1,25: ukośna linia cieńsza niż ~1,5 px traci przy
    #   progu pokrycia 50 % co drugi piksel i końce sznurka znikały.
    p.plaski(linia([(18.4, 13.5), (19.8, 17.5), (19.2, 21.2)], 1.7), SZNUREK, "sznurek")
    p.plaski(linia([(19.4, 13.4), (22.2, 16.6), (23.2, 19.6)], 1.7), SZNUREK, "sznurek")
    return p


def torba():
    """Mała torba (4 sloty): NISKA i SZEROKA, łukowata klapa ze szwem
    i kołeczkiem — bez paska, żeby nie myliła się z sakwą."""
    p = Plotno()
    p.skora(prost(3.5, 11.5, 28.5, 27.5, 4.2), "korpus", bryla=0.5)
    klapa = [(4.0, 11.0), (28.0, 11.0)] + [
        (28.0 - 24.0 * t, 14.0 + 7.6 * math.sin(math.pi * t)) for t in (i / 16 for i in range(17))]
    p.skora(wielokat(klapa) & prost(3.5, 9.6, 28.5, 27.5, 3.2), "klapa", bryla=0.6)
    for i in range(1, 16, 2):                                             # szew klapy, co drugi piksel
        t = i / 16
        x, y = 26.6 - 21.2 * t, 13.0 + 6.0 * math.sin(math.pi * t)
        p.rysuj(elipsa(x, y, 0.55, 0.55), SKORA[CIEN])
    p.plaski(prost(14.4, 20.0, 17.6, 23.2, 1.3), MOSIADZ, "kołeczek")
    p.rysuj(linia([(6.0, 25.8), (26.0, 25.8)], 0.8), SKORA[CIEN])        # szew dna
    return p


def sakwa():
    """Sakwa podróżnika (6 slotów): SZEROKA i krępa, ZWINIĘTE POSŁANIE
    przypięte na wierzchu, dwa paski z żelaznymi sprzączkami biegnące przez
    posłanie i klapę, pasek na ramię wyprowadzony ukośnie z boku.

    ⚠ Pierwsza rysowana wersja (pasek ŁUKIEM nad torbą + jedna sprzączka na
    środku) czytała się jak DAMSKA TOREBKA, nie jak ekwipunek (autor,
    2026-10-04). Łuk nad bryłą to sylwetka torebki z rączką; drogę mówi
    posłanie i dwa ciężkie paski."""
    p = Plotno()
    # ⚠ Pasek ZWISA z lewego boku. Wyprowadzony ukośnie w górę sterczał jak
    #   antena; łukiem nad bryłą dawał torebkę. Szelka plecaka wisi z prawej,
    #   więc obie bryły się nie mylą.
    p.skora(linia([(5.0, 15.2), (1.9, 20.5), (2.6, 27.6)], 2.3), "pasek na ramię", bryla=0.0)
    p.skora(prost(3.5, 13.5, 28.5, 29.0, 3.0), "korpus", bryla=0.45)
    p.skora(prost(3.5, 12.6, 28.5, 22.6, 3.0), "klapa", bryla=0.55)
    for x in range(6, 27, 2):                                             # szew klapy
        p.rysuj(prost(x - 0.45, 21.0, x + 0.45, 21.7), SKORA[CIEN])
    p.skora(prost(4.6, 7.0, 27.4, 13.6, 3.3), "posłanie", bryla=0.55, rampa=LEN)
    # zwój na czole posłania: pierścień ciemnego lnu z jaśniejszym środkiem
    p.rysuj(elipsa(7.9, 10.3, 2.6, 2.8) & ~elipsa(7.9, 10.3, 1.6, 1.8), LEN[0])
    p.rysuj(elipsa(7.9, 10.3, 1.6, 1.8) & ~elipsa(7.9, 10.3, 0.7, 0.8), LEN[2])
    p.rysuj(elipsa(7.9, 10.3, 0.7, 0.8), LEN[0])
    for x in (12.0, 22.0):
        p.skora(prost(x - 1.25, 6.6, x + 1.25, 26.6, 0.6), "pasek", bryla=0.0)
        # ⚠ Sprzączka jako PIONOWA RAMKA 4×5 z paskiem widocznym w środku.
        #   Pełny prostokąt 4×4 był szarym kamieniem, a kwadratowe ramki 5×5
        #   parą obok siebie czytały się jak OCZY na torbie.
        rama = prost(x - 2.0, 19.4, x + 2.0, 24.6, 0.3)
        p.plaski(rama, ZELAZO, "sprzączka")
        p.rysuj(prost(x - 1.0, 20.5, x + 1.0, 23.5), SKORA[CIEN])
        p.rysuj(linia([(x - 1.2, 22.0), (x + 1.2, 22.0)], 0.9), IRON[4])   # kolec w poprzek
    return p


def plecak():
    """Plecak (8 slotów): WYSOKI, uchwyt u góry, szelka z boku, klapa na dwa
    paski z mosiężnymi sprzączkami i kieszeń z przodu."""
    p = Plotno()
    p.skora(luk(16, 6.4, 3.0, 2.8, 180, 360, 1.4), "uchwyt", bryla=0.1)
    p.skora(linia([(24.0, 9.0), (27.4, 14.5), (26.8, 26.5)], 2.2), "szelka", bryla=0.0)
    p.skora(prost(6.0, 6.0, 25.0, 29.0, 4.6), "korpus", bryla=0.45)
    p.skora(prost(6.0, 5.4, 25.0, 17.4, 4.6), "klapa", bryla=0.6)
    p.skora(prost(9.0, 21.0, 22.0, 28.0, 2.0), "kieszeń", bryla=0.35)
    for x in (10.3, 19.7):
        p.skora(prost(x - 1.3, 13.6, x + 1.3, 21.0, 0.4), "pasek", bryla=0.0)
        p.plaski(prost(x - 1.8, 18.0, x + 1.8, 21.0, 0.5), MOSIADZ, "sprzączka")
        p.rysuj(prost(x - 0.6, 19.0, x + 0.6, 20.0), SKORA[SZEW])
    return p


TORBY = {"icon_bag_1": sakiewka, "icon_bag_2": torba, "icon_bag_3": sakwa, "icon_bag_4": plecak}
#: Znak rozpoznawczy każdej torby (warstwa i minimum pikseli). ⚠ Bez niego
#: cztery brązowe bryły zlewają się w jedną — dokładnie wada wersji 2.
ZNAKI = {"icon_bag_1": ("sznurek", 12), "icon_bag_2": ("kołeczek", 6), "icon_bag_3": ("posłanie", 80),
         "icon_bag_4": ("sprzączka", 12)}
MIN_ODREBNOSC = 0.12
#: Prześwit DOZWOLONY: pętla paska sakwy to tło widziane przez pasek — tak samo
#: jak u tarczy z uchwytem. ⚠ Wolno go mieć tylko DUŻY (≥ minimum px): mała
#: dziura czyta się w 1x jak błąd siatki (lekcja wersji 2 — 4 px w tej samej
#: pętli). Każda inna ikona dalej musi mieć zero dziur.
PRZESWIT = {}


def main():
    argv = sys.argv[1:]
    ikony, bledy = {}, []
    dozwolone = ({tuple(c) for c in SKORA} | {tuple(c) for c in BAST} | {tuple(c) for c in IRON}
                 | {tuple(c) for c in LEN} | {tuple(KONTUR)})
    for nazwa, fn in TORBY.items():
        p = fn()
        arr = p.kafel()
        a = arr[..., 3] > 0
        kolory = {tuple(int(v) for v in px[:3]) for px in arr[a]}
        ys, xs = np.nonzero(a)
        znak, minimum = ZNAKI[nazwa]
        ile_znaku = sum(int((p.wl == i).sum()) for i, w in enumerate(p.warstwy) if w == znak)
        print(f"  {nazwa:<11} bbox {xs.max() - xs.min() + 1:>2}×{ys.max() - ys.min() + 1:<2}  kolorów {len(kolory):>2}"
              f"   kontrast {A.kontrast(arr):>4.0f}   gruby kontur {A.gruby_kontur(arr):.0%}   znak „{znak}” {ile_znaku} px")
        if kolory - dozwolone:
            bledy.append(f"{nazwa}: kolory spoza wspólnych ramp {sorted(kolory - dozwolone)[:4]}")
        d = A.dziury(a)
        if d and not (nazwa in PRZESWIT and d >= PRZESWIT[nazwa]):
            bledy.append(f"{nazwa}: {d} px zamkniętych dziur w sylwetce"
                         + (f" (prześwit paska ma mieć ≥ {PRZESWIT[nazwa]})" if nazwa in PRZESWIT else ""))
        if A.gruby_kontur(arr) > A.MAX_GRUBY_KONTUR:
            bledy.append(f"{nazwa}: obrys podwójny ({A.gruby_kontur(arr):.0%})")
        if A.kontrast(arr) < A.MIN_KONTRAST:
            bledy.append(f"{nazwa}: za ciemna na tle kafla (kontrast {A.kontrast(arr):.0f})")
        if ile_znaku < minimum:
            bledy.append(f"{nazwa}: znak „{znak}” ma {ile_znaku} px (< {minimum}) — nie przeżyje 1x")
        if max(xs.max() - xs.min(), ys.max() - ys.min()) + 1 > 30:
            bledy.append(f"{nazwa}: bok > 30 px — brak 1 px marginesu")
        ikony[nazwa] = wysrodkuj(arr)
    nazwy = list(ikony)
    for i in range(len(nazwy)):
        for j in range(i + 1, len(nazwy)):
            o = A.odrebnosc(ikony[nazwy[i]], ikony[nazwy[j]])
            if o < MIN_ODREBNOSC:
                bledy.append(f"{nazwy[i]} / {nazwy[j]}: prawie identyczne ({o:.2f} < {MIN_ODREBNOSC})")
    bledy += bledy_srodka(ikony)
    for b in bledy:
        print("  [BŁĄD]", b)
    if "--podglad" in argv:
        podglad(ikony, Path(argv[argv.index("--podglad") + 1]))
    if "--zapisz" in argv:
        if bledy:
            print("[zapis] ODMOWA — raport czerwony")
            return 1
        for nazwa, arr in ikony.items():
            Image.fromarray(arr).save(CEL / f"{nazwa}.png")
        print(f"[zapis] {len(ikony)} ikon → {CEL}")
    else:
        print("[przymiar] NIC nie zapisano. Zapis: --zapisz")
    return 0


def podglad(ikony, sciezka):
    """Góra: dzisiejsze pliki i nowe ikony ×8. Dół: nowe ×2 i ×1 obok
    skórzanego pancerza — ocenia się TO, nie powiększenie."""
    S, P = 8, 10
    wzor = ["icon_armor_leather_chest", "icon_armor_leather_gloves", "icon_armor_leather_boots",
            "icon_leather_scraps"]
    stare = [np.array(Image.open(CEL / f"{n}.png").convert("RGBA")) for n in ikony]
    nowe = list(ikony.values())
    wz = [np.array(Image.open(CEL / f"{n}.png").convert("RGBA")) for n in wzor]
    W = 4 * (32 * S + P)
    out = Image.new("RGBA", (W, 2 * (32 * S + P) + 2 * (64 + P) + 40), (60, 52, 44, 255))
    for r, rzad in enumerate((stare, nowe)):
        for c, arr in enumerate(rzad):
            out.alpha_composite(Image.fromarray(arr).resize((32 * S, 32 * S), Image.NEAREST),
                                (c * (32 * S + P), r * (32 * S + P)))
    y0 = 2 * (32 * S + P) + 10
    for k, rozm in enumerate((64, 32)):
        x = 0
        for arr in nowe + wz:
            out.alpha_composite(Image.fromarray(arr).resize((rozm, rozm), Image.NEAREST), (x, y0 + k * (64 + P)))
            x += rozm + (12 if rozm == 64 else 6)
    out.save(sciezka)
    print(f"podgląd: {sciezka}")


if __name__ == "__main__":
    sys.exit(main())

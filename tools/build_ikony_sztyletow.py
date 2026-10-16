# -*- coding: utf-8 -*-
"""
Ikony rodziny SZTYLETÓW (32x32, oś 45°): nóż, nóż myśliwski, sztylet, mizerykordia.

    python tools/build_ikony_sztyletow.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_ikony_sztyletow.py --podglad X.png    # + podgląd 10x i ~18 px obok siebie
    python tools/build_ikony_sztyletow.py --zapisz           # zapis do public/assets/items/

── Dwa sposoby rysowania i DLACZEGO dwa ─────────────────────────────────────
Sztylet i mizerykordia są rysowane „profilem per wiersz": każdy wiersz płótna
dostaje JEDEN ciągły zakres [lo..hi] w poprzek osi. Zostały zatwierdzone
w tej postaci i są ZAMROŻONE (złote SHA1 niżej) — nie przepisuj ich na nowy
sposób, nawet jeśli wynik miałby „wyglądać tak samo".

⚠⚠ Noże rysuje się INACZEJ i to jest sedno tego pliku. Pięta noża (cięcie
prostopadłe do osi przy rękojeści) na osi 45° oznacza, że poziomy wiersz płótna
przechodzi przez RÓG PIĘTY, potem przez PUSTĄ szczelinę, potem przez rękojeść.
Jednego ciągłego zakresu na wiersz nie da się tak ułożyć — ~20 iteracji
(2026-09-27) dawało kolejno rampę, poziomą belkę, narośl albo ledwo widoczny
karb, bo walczyły z reprezentacją, nie z proporcjami. Noże są więc opisane
w OSIACH BRONI i rasteryzowane piksel po pikselu:
    s = x + y   — wzdłuż osi (rośnie od czubka do rękojeści)
    u = x - y   — w poprzek (0 = grzbiet, ujemne = strona ostrza, lewy-dół)
Grzbiet to u = 0 (idealna przekątna, z definicji bez ząbków), pięta to s = const
(prawdziwe cięcie prostopadłe), brzuch to krzywa u(s).

── Kolory ───────────────────────────────────────────────────────────────────
Drewno/skóra: `tools/wood_palette.py`. Metal: dwa gatunki po 3 tony (niżej) —
jeszcze NIE wydzielone do wspólnego pliku; zrobić to razem z metalowymi
tarczami (OI-126), nie wcześniej.
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

KORZEN = Path(__file__).resolve().parent.parent
CEL = KORZEN / "public" / "assets" / "items"
R = 32

# ⭐ Stopnie 0, 2, 4 WSPÓLNEGO standardu `tools/metal_palette.py` (2026-10-02,
#   domyka `OI-126`). Stal była nim od początku; żelazo noża było osobną,
#   ciemniejszą i cieplejszą rampą — kontrast 36 do kafla przy progu 50,
#   56% pikseli < 55 (audyt §15 pliku broni): ostrze zlewało się z tłem.
from metal_palette import STEEL as _STD_S, IRON as _STD_I  # noqa: E402
STEEL = (_STD_S[0], _STD_S[2], _STD_S[4])   # ciemny, baza, światło
IRON = (_STD_I[0], _STD_I[2], _STD_I[4])

#: Złote sumy zatwierdzonych, ZAMROŻONYCH ikon. Rozjazd = ktoś ruszył wspólny
#: helper albo parametry i zmienił rzecz, której nie wolno było zmienić.
#: ⚠ Sumy PRZELICZONE 2026-10-02 świadomie: kontur 4-sąsiedni (audyt §15 pliku
#:   broni, decyzja autora). Rysunek wnętrza bez zmian — zmienił się wyłącznie obrys.
ZAMROZONE = {
    "dagger": "48f1cbd0383ef2e8e37d4ffe907405c023a9678e",
    "misericorde": "a7e3631228cd0b4bc365e714f870310aed380e11",
}


class Canvas:
    """Wypełnienie bez konturu; kontur dokłada `finalize` jednym przebiegiem
    dylatacji (8-sąsiedztwo) wokół całej sylwetki — zero konfliktów segmentów."""

    def __init__(self):
        self.rgb = np.zeros((R, R, 3), np.uint8)
        self.a = np.zeros((R, R), bool)

    def set(self, x, y, color):
        if 0 <= x < R and 0 <= y < R:
            self.rgb[y, x] = color
            self.a[y, x] = True

    def finalize(self):
        out = np.zeros((R, R, 4), np.uint8)
        pad = np.pad(self.a, 1)
        grown = pad.copy()
        # ⭐ Kontur 4-SĄSIEDNI (decyzja autora 2026-10-02, audyt §15 pliku broni):
        #   przy 8-sąsiednim narożniki zapełniały się i na ukośnych krawędziach
        #   ciemny pas był podwójny (~1,7 px konturu na piksel obwodu przy ~1,0
        #   w pancerzu i tarczach) — cienka broń ważyła tyle co własny obrys.
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            grown |= np.roll(np.roll(pad, dy, axis=0), dx, axis=1)
        ring = grown[1:-1, 1:-1] & ~self.a
        out[self.a] = np.concatenate([self.rgb[self.a], np.full((self.a.sum(), 1), 255, np.uint8)], axis=1)
        out[ring] = (*KONTUR, 255)
        return out


# ════════════════════════════════════════════════════════════════════════
# ZAMROŻONE: sztylet i mizerykordia — profil per wiersz. Nie zmieniaj.
# ════════════════════════════════════════════════════════════════════════
def _stepped(d, schedule):
    w = 0
    for threshold, width in schedule:
        if d >= threshold:
            w = width
        else:
            break
    return w


def _blade_tone(u, lo, hi, dark, base, light):
    if hi - lo + 1 <= 1 or u == lo:
        return light
    return base if u == hi else dark


def _draw_blade(c, y0, y1, lo_fn, hi_fn, dark, base, light):
    for y in range(y0, y1 + 1):
        lo, hi = lo_fn(y), hi_fn(y)
        for u in range(lo, hi + 1):
            c.set(y + u, y, _blade_tone(u, lo, hi, dark, base, light))
    return lo_fn(y1), hi_fn(y1)


def _draw_guard(c, y_last, lo, hi, extra, thick, dark, light):
    center_u = (lo + hi) / 2
    reach = int(round((hi - lo) / 2)) + extra
    for k in range(-reach, reach + 1):
        for g in range(thick):
            c.set(int(round(y_last + center_u + k + g)), int(round(y_last - k + g)), light if g == 0 else dark)


def _draw_handle_legacy(c, y0, length, lo, hi, tones):
    dark, base, light = tones
    for i in range(length):
        y = y0 + i
        band = dark if (i // 2) % 2 == 0 else base
        for u in range(lo, hi + 1):
            c.set(y + u, y, light if u == lo else (dark if u == hi else band))
    return y0 + length - 1


def _draw_pommel(c, cy, cx, r, dark, light):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if abs(dx) == r and abs(dy) == r:
                continue
            c.set(cx + dx, cy + dy, light if (dx - dy) < 0 else dark)


def _draw_rondel(c, cy, cx, half_len, color):
    for k in range(-half_len, half_len + 1):
        c.set(cx + k, cy - k, color)


def rysuj_sztylet():
    c = Canvas()
    dark, base, light = STEEL
    y0, y1 = 2, 18
    polszer = lambda y: _stepped(y - y0, [(0, 0), (2, 1), (5, 2)])  # noqa: E731
    lo_end, hi_end = _draw_blade(c, y0, y1, lambda y: -polszer(y), polszer, dark, base, light)
    _draw_guard(c, y1, lo_end, hi_end, extra=2, thick=2, dark=dark, light=light)
    y_end = _draw_handle_legacy(c, y1 + 2, 6, -1, 1, (WOOD[0], WOOD[1], WOOD[3]))
    _draw_pommel(c, y_end + 1, y_end + 1, 1, dark, light)
    return c.finalize()


def rysuj_mizerykordie():
    c = Canvas()
    dark, base, light = STEEL
    y0, dlugosc = 2, 15
    y1 = y0 + dlugosc
    polszer = lambda y: _stepped(y - y0, [(0, 0), (dlugosc - 3, 1)])  # noqa: E731
    _draw_blade(c, y0, y1, lambda y: -polszer(y), polszer, dark, base, light)
    _draw_rondel(c, y1 + 1, y1 + 1, 1, light)
    _, wb, wl = WOOD[0], WOOD[1], WOOD[3]
    for i in range(6):
        y = y1 + 2 + i
        c.set(y, y, wb)
        c.set(y - 1, y, wl)
    y_end = y1 + 7
    _draw_rondel(c, y_end + 1, y_end + 1, 1, light)
    return c.finalize()


# ════════════════════════════════════════════════════════════════════════
# NOŻE — kształt w osiach broni (s, u), rasteryzacja piksel po pikselu.
# ════════════════════════════════════════════════════════════════════════
#: Parametry w pikselach płótna. `s_*` rośnie o 2 na każdy krok po przekątnej.
NOZE = {
    "knife": dict(
        # Nóż startowy: żelazo, jasne drewno, dwa nity, krótszy od myśliwskiego.
        metal=IRON, drewno=(WOOD[3], WOOD[6], WOOD[9]), owijka=False,
        s_czubek=4, s_pieta=34, s_koniec=54,
        H=6,      # głownia: u w [-H, 0] — ta sama grubość, co zatwierdzona v13
        h=3,      # rękojeść: u w [-h, 0] — grubsza niż u myśliwskiego (nity)
        brzuch=14,  # długość łuku od czubka (w s); dalej krawędź prosta
        tepy=0.5,   # przesunięcie startu łuku: czubek 2 px zamiast igły
        nity=(41, 49),
    ),
    "hunting_knife": dict(
        # Nóż myśliwski: stal, ciemna skóra z owijką, długi wyraźny brzuch.
        metal=STEEL, drewno=(WOOD[0], WOOD[1], WOOD[3]), owijka=True,
        s_czubek=4, s_pieta=40, s_koniec=59,
        H=7, h=2, brzuch=24, tepy=0.5, nity=(),
    ),
}


def _noz_maski(p):
    def glownia(x, y):
        s, u = x + y, x - y
        if not (p["s_czubek"] <= s <= p["s_pieta"]) or u > 0:
            return False
        t = min(1.0, (s - p["s_czubek"] + p["tepy"]) / p["brzuch"])
        # Parabola, nie ćwiartka elipsy: przy czubku krawędź spotyka grzbiet pod
        # OSTRYM kątem (drop point), dalej brzuch. Elipsa dawała nos prostopadły
        # do osi — łopatkę zamiast noża.
        return -u <= p["H"] * (1 - (1 - t) ** 2) + 1e-9

    def rekojesc(x, y):
        s, u = x + y, x - y
        return p["s_pieta"] < s <= p["s_koniec"] and -p["h"] <= u <= 0

    return glownia, rekojesc


def rysuj_noz(nazwa):
    p = NOZE[nazwa]
    glownia, rekojesc = _noz_maski(p)
    c = Canvas()
    dark, base, light = p["metal"]
    wd, wb, wl = p["drewno"]
    for y in range(R):
        for x in range(R):
            if glownia(x, y):
                # strona ostrza (lewy sąsiad pusty) = światło, strona grzbietu = baza
                c.set(x, y, light if not glownia(x - 1, y) else (base if not glownia(x + 1, y) else dark))
            elif rekojesc(x, y):
                band = wb if (p["owijka"] and ((x + y - p["s_pieta"]) // 4) % 2 == 0) else wd
                lewy = rekojesc(x - 1, y) or glownia(x - 1, y)
                c.set(x, y, wl if not lewy else (wb if not rekojesc(x + 1, y) else band))
    for s in p["nity"]:
        u = -1 if s % 2 else -2   # u musi mieć parzystość s
        c.set((s + u) // 2, (s - u) // 2, p["metal"][2])
    return c.finalize(), glownia, rekojesc


# ════════════════════════════════════════════════════════════════════════
# Kontrole — każda potrafi zaświecić na czerwono (sprawdzone psując dane).
# ════════════════════════════════════════════════════════════════════════
def dziury(alpha):
    """Tło nieosiągalne z obwodu kafla = zamknięta dziura."""
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
    return [(int(x), int(y)) for y, x in np.argwhere(bg & ~reached)]


def kontrole_noza(p, glownia, rekojesc):
    bledy = []
    # 1) Grzbiet: w każdym wierszu, w którym punkt grzbietu (y, y) leży między
    #    czubkiem a końcem trzonka, najbardziej prawy piksel wypełnienia jest na u=0.
    #    (Za końcem trzonka grzbietu nie ma — koniec to też cięcie prostopadłe.)
    for y in range(R):
        if not (p["s_czubek"] <= 2 * y <= p["s_koniec"]):
            continue
        xs = [x for x in range(R) if glownia(x, y) or rekojesc(x, y)]
        if xs and max(xs) != y:
            bledy.append(f"grzbiet zgięty w wierszu {y} (x={max(xs)}, oczekiwano {y})")
    # 2) Pięta prostopadła: istnieje wiersz z LUKĄ między rogiem pięty a rękojeścią.
    #    Profil „jeden zakres na wiersz" nie potrafi tego spełnić — to jest cała lekcja.
    luka = False
    for y in range(R):
        xs = [x for x in range(R) if glownia(x, y) or rekojesc(x, y)]
        if xs and len(xs) != max(xs) - min(xs) + 1:
            luka = True
    if not luka:
        bledy.append("brak prostopadłej pięty (żaden wiersz nie ma luki róg pięty / rękojeść)")
    return bledy


def main():
    paleta = {tuple(c) for c in (*STEEL, *IRON, *WOOD, KONTUR)}
    ikony, bledy = {}, []

    for nazwa in NOZE:
        arr, glownia, rekojesc = rysuj_noz(nazwa)
        ikony[nazwa] = arr
        bledy += [f"{nazwa}: {b}" for b in kontrole_noza(NOZE[nazwa], glownia, rekojesc)]
    ikony["dagger"] = rysuj_sztylet()
    ikony["misericorde"] = rysuj_mizerykordie()

    print("=== ikony rodziny sztyletów ===")
    for nazwa, arr in ikony.items():
        a = arr[..., 3] > 0
        ys, xs = np.nonzero(a)
        obce = {tuple(int(v) for v in px[:3]) for px in arr[a]} - paleta
        sha = hashlib.sha1(arr.tobytes()).hexdigest()
        stan = ""
        if nazwa in ZAMROZONE:
            stan = "zamrożony OK" if sha == ZAMROZONE[nazwa] else "⛔ ZAMROŻONY ZMIENIONY"
            if sha != ZAMROZONE[nazwa]:
                bledy.append(f"{nazwa}: SHA1 {sha} ≠ zatwierdzony {ZAMROZONE[nazwa]}")
        d = dziury(a)
        if d:
            bledy.append(f"{nazwa}: zamknięte dziury {d}")
        if obce:
            bledy.append(f"{nazwa}: kolory spoza palety {sorted(obce)}")
        print(f"  {nazwa:<14} {int(a.sum()):>4} px  bbox ({xs.min()},{ys.min()})-({xs.max()},{ys.max()})  {stan}")

    # ⭐ Wyśrodkowanie w polu (decyzja autora 2026-10-02, `tools/icon_center.py`).
    #   PO kontrolach kształtu: przesunięcie jest całkowite, więc sumy SHA1 wyżej
    #   opisują RYSUNEK, a położenie w kaflu sprawdza `bledy_srodka`.
    ikony = {n: wysrodkuj(a) for n, a in ikony.items()}
    bledy += bledy_srodka(ikony)

    if "--podglad" in sys.argv:
        sciezka = Path(sys.argv[sys.argv.index("--podglad") + 1])
        kolejnosc = ["knife", "hunting_knife", "dagger", "misericorde"]
        S, S2 = 10, 13
        W = len(kolejnosc) * (32 * S + 14) + 14
        plotno = Image.new("RGBA", (W, 32 * S + 18 * S2 + 40), (28, 28, 32, 255))
        for i, n in enumerate(kolejnosc):
            im = Image.fromarray(ikony[n], "RGBA")
            x = 14 + i * (32 * S + 14)
            plotno.alpha_composite(im.resize((32 * S, 32 * S), Image.NEAREST), (x, 10))
            male = im.resize((18, 18), Image.NEAREST).resize((18 * S2, 18 * S2), Image.NEAREST)
            plotno.alpha_composite(male, (x + (32 * S - 18 * S2) // 2, 32 * S + 25))
        sciezka.parent.mkdir(parents=True, exist_ok=True)
        plotno.save(sciezka)
        print(f"\npodgląd: {sciezka}")

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


if __name__ == "__main__":
    sys.exit(main())

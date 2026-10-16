"""
Generator arkusza Szarego (elitarny wilk-przywodca) -> public/assets/greywolf.png

Uruchom:  python tools/build_szary.py            (podglad + raport, NIC nie zapisuje)
          python tools/build_szary.py --zapisz   (nadpisuje public/assets/greywolf.png)

Siostrzany skrypt `tools/build_wilk.py` — ten sam komplet 6 stanow x 4
kierunki, ta sama technika (rampa 6-stopniowa z iloczynu skalarnego normalnej
elipsoidy ze swiatlem, `wyrostek()` jako wspolny ksztalt uszu/ogona, jeden
`stan()` czytany przez dwa rysowniki). Nie kopiuje kodu 1:1 do osobnego pliku
z lenistwa — to SWIADOMA decyzja: `Wolf`/`GreyWolf` w kodzie tez nie dzielą
jednego arkusza (patrz nota przy ASSETS.greyWolf w GameConfig — "deliberately
NOT the wolf texture at a larger scale, because two scales of one sprite read
as perspective rather than as two different creatures"). Ten skrypt istnieje
PO TO, zeby Szary mial wlasna, naprawde inna sylwetke, nie przeskalowanego
wilka.

── CO GO ODROZNIA OD ZWYKLEGO WILKA (user: "ciut przerosniety... bardziej
   grozny z wygladu") ─────────────────────────────────────────────────────
* **Wiekszy kafel: 32px, nie 28.** Przy tym samym GREY_WOLF.scale=2.4 (bez
  zmian w GameConfig) daje to ~76.8px na ekranie vs ~50.4px zwyklego wilka
  (scale 1.8 x 28px) — 1.5x wiekszy, "ciut przerosniety", nie absurdalnie.
* **Bledsza sierc.** Rampa `kamien` rozjasniona o 32% w strone bieli
  (`PALE`) — postarzaly, wyplowialy futrzak, nie mlody ciemnoszary wilk ze
  stada.
* **Ciezki, ciemny luk brwiowy** nad oczami — jeden prostokat z ciemnego
  konca rampy `neutralne`, ten sam sygnal co stary placeholder
  (`makeGreyWolfPlaceholder`: "heavy brow — the 'old' tell").
  Bez tego "przerosniety wilk" czyta sie jako duzy szczeniak, nie jako stary
  wojownik.
* **Blizna** — czerwonawa kreska przez pysk, z rampy `akcent_cieply`
  (ciemny stopien), jak w starym placeholderze.
  Konkretny, czytelny slad walki — bez tego "grozny z wygladu" to tylko
  "wiekszy", a nie "straszniejszy".
* **Jasniejsze, bardziej nasycone oko** (`akcent_cieply[4]` zamiast [4] u
  zwyklego wilka — a raczej: wieksza kropka, 2 piksele zamiast 1) —
  "brighter than the pack's" w starym placeholderze.
* **Odrobine bardziej masywna sylwetka** (rx/ry przeskalowane x1.08 wzgledem
  wilka) — kawalek dodatkowej "budowy" niezaleznie od samego rozmiaru kafla,
  zeby nie czytal sie jak zwykly wilk zblizony do kamery.

Mapowanie stanow na GreyWolf.ts (rozne nazwy fazy, ten sam szkielet co u
zwyklego wilka — patrz build_wilk.py po pelna tabele):

| stan | GreyWolf.ts |
|---|---|
| Idle | pauzy, `recover` |
| Walk | `stalk` (krazenie) / `close` (podejscie) / `backstep` (odskok) |
| Growl | `windup` (PRAWDZIWY telegraf ugryzienia — w przeciwienstwie do zwyklego |
|       | wilka, Szary MA byc czytany PRZED atakiem) + `checkEnrage()` (ryk szalu) |
| Bite Attack | `resolveBite` |
| Hurt Reaction | nowy hook `onHurt` |
| Death | nowy hook `onDeathVisual` |

Enrage (czerwony tint) zostaje BEZ osobnego stanu animacji — to juz dziala
przez `setBaseTint`/`refreshTint()` i nie bylo w oryginalnej liscie 6 stanow;
dublowanie tego samego sygnalu drugi raz w animacji byloby nadmiarowe.
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 32
COLS = 4
STANY = ["idle", "walk", "growl", "bite", "hurt", "death"]
KLATKI = {"idle": 1, "walk": 4, "growl": 2, "bite": 3, "hurt": 1, "death": 4}
KIERUNKI = ["down", "up", "left", "right"]
ROWS = len(STANY) * len(KIERUNKI)
OUT_PATH = os.path.join(ASSETS, "animals", "greywolf.png")

SWIATLO = (-0.45, -0.9)
BUDOWA = 1.08  # mnoznik "masywnosci" wzgledem proporcji zwyklego wilka


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
K = PAL["kamien"]
# Bledsza sierc: kazdy stopien rampy `kamien` przesuniety 32% w strone bieli.
PALE = [tuple(min(255, int(round(c + (255 - c) * 0.32))) for c in kolor) for kolor in K]
A = PAL["akcent_cieply"]  # oko + blizna
N = PAL["neutralne"]      # kly, nos, luk brwiowy


def pusty():
    return np.zeros((T, T, 4), np.uint8)


def kladz(px, y, x, kolor, alfa=255):
    y, x = int(round(y)), int(round(x))
    if 0 <= y < px.shape[0] and 0 <= x < px.shape[1]:
        if alfa >= 255:
            px[y, x, :3] = kolor
            px[y, x, 3] = 255
        else:
            a = alfa / 255.0
            base = px[y, x]
            if base[3] == 0:
                px[y, x, :3] = kolor
                px[y, x, 3] = alfa
            else:
                px[y, x, :3] = (np.array(kolor) * a + base[:3] * (1 - a)).astype(np.uint8)
                px[y, x, 3] = max(base[3], alfa)


def prostokat(px, y0, y1, x0, x1, kolor, alfa=255):
    for y in range(int(round(y0)), int(round(y1))):
        for x in range(int(round(x0)), int(round(x1))):
            kladz(px, y, x, kolor, alfa)


def elipsa_cien(px, cy, cx, ry, rx, ramp, min_st=0, max_st=None):
    if ry <= 0.3 or rx <= 0.3:
        return
    if max_st is None:
        max_st = len(ramp) - 1
    lx, ly = SWIATLO
    dl = (lx * lx + ly * ly) ** 0.5
    lx, ly = lx / dl, ly / dl
    y0, y1 = int(cy - ry - 1), int(cy + ry + 2)
    x0, x1 = int(cx - rx - 1), int(cx + rx + 2)
    for y in range(y0, y1):
        ny = (y - cy) / ry
        if abs(ny) > 1.06:
            continue
        for x in range(x0, x1):
            nx = (x - cx) / rx
            d2 = nx * nx + ny * ny
            if d2 > 1.0:
                continue
            nz = max(0.0, 1 - d2) ** 0.5
            ekspozycja = nx * (-lx) + ny * (-ly) * 0.55 + nz * 0.85
            st = min_st + int(round((ekspozycja + 1) / 2 * (max_st - min_st)))
            st = max(min_st, min(max_st, st))
            kladz(px, y, x, ramp[st])


def cien_kontaktowy(px, cy, cx, ry, rx, alfa=70):
    if ry <= 0 or rx <= 0:
        return
    for y in range(int(cy - ry), int(cy + ry) + 1):
        ny = (y - cy) / ry
        if abs(ny) > 1:
            continue
        for x in range(int(cx - rx), int(cx + rx) + 1):
            nx = (x - cx) / rx
            if nx * nx + ny * ny <= 1:
                kladz(px, y, x, N[1], alfa=alfa)


def wyrostek(px, cy, cx, dl, szer, kat_deg, ramp_dark, ramp_light):
    if dl <= 0.3:
        return
    rad = np.radians(kat_deg)
    dy, dx = -np.cos(rad), np.sin(rad)
    py, pxk = -dx, dy
    y0, y1 = int(cy - abs(dl) - 2 + min(0, dy * dl)), int(cy + abs(dl) + 2)
    x0, x1 = int(cx - abs(dl) - 2), int(cx + abs(dl) + 2)
    for y in range(y0, y1):
        for x in range(x0, x1):
            ry, rx = y - cy, x - cx
            u = ry * dy + rx * dx
            if u < 0 or u > dl:
                continue
            v = ry * py + rx * pxk
            t = u / dl
            half = szer * (1 - 0.6 * t * t) / 2
            if abs(v) > half:
                continue
            brzeg = abs(v) > half - 0.9
            kladz(px, y, x, ramp_dark if brzeg else ramp_light)


def ucho(px, cy, cx, dl, szer, kat_deg):
    wyrostek(px, cy, cx, dl, szer, kat_deg, PALE[1], PALE[2])


def ogon(px, cy, cx, dl, szer, kat_deg):
    wyrostek(px, cy, cx, dl, szer, kat_deg, PALE[1], PALE[4])


def laba(px, y, x, w=2.6, h=2.4):
    if h <= 0:
        return
    prostokat(px, y, y + h, x, x + w, PALE[0])


def blizna(px, cy, cx, dl, kat_deg):
    """Blizna przez brew/oko — NIE przez pysk (pierwsza wersja: user zglosil
    ze czerwona kreska przy ustach czyta sie jak krew ciekaca z pyska, nie
    jak zagojona rana). Dwutonowa (ciemny rdzen `A[1]` + jasna krawedz
    `A[3]` przesunieta o pelny piksel prostopadle) — plaska jednokolorowa
    kreska nie miala nic, co odroznialoby "blizne" od "kropli"; jasna
    krawedz czyta sie jak swiatlo lapiace sie na zabliznionej tkance."""
    rad = np.radians(kat_deg)
    dy, dx = -np.cos(rad), np.sin(rad)
    py_off, px_off = dx, -dy  # prostopadle przesuniecie, PELNY piksel
    for i in range(int(dl)):
        y, x = cy + dy * i, cx + dx * i
        kladz(px, y, x, A[1])
        kladz(px, y + py_off, x + px_off, A[3])


def luk_brwiowy(px, cy, cx, szer, kat_deg=0):
    """Ciezki, ciemny luk brwiowy — jeden gruby prostokat nad okiem/oczami.
    To jest GLOWNY sygnal "stary/grozny wojownik", nie sam rozmiar kafla —
    bez niego przerosniety wilk czyta sie jak duzy szczeniak."""
    rad = np.radians(kat_deg)
    dx, dy = np.cos(rad), np.sin(rad)
    for i in np.linspace(-szer / 2, szer / 2, max(2, int(szer) + 1)):
        kladz(px, cy + dy * i, cx + dx * i, N[0])
        kladz(px, cy + dy * i - 1, cx + dx * i, N[1])


# ── STAN ─────────────────────────────────────────────────────────────────

WALK_FAZY = [
    (0.0, 0.30, 0.90, 0.66, 0.84),
    (0.35, 0.42, 0.82, 0.56, 0.92),
    (0.15, 0.36, 0.90, 0.60, 0.86),
    (-0.1, 0.30, 0.88, 0.68, 0.82),
]


def stan(rodzaj, i):
    s = dict(bob=0.0, lean=0.0, mouth=0.0, ear_back=0.0, collapse=0.0,
             eyes_closed=False, leg_swing=0.0, leg_stagger=0.0,
             side_legs=WALK_FAZY[0])

    if rodzaj == "idle":
        pass
    elif rodzaj == "walk":
        f = WALK_FAZY[i]
        s.update(bob=f[0], side_legs=f, leg_swing=[-1, -0.3, 1, 0.3][i], leg_stagger=[1, -1, 1, -1][i] * 0.6)
    elif rodzaj == "growl":
        # Szaremu Growl = PRAWDZIWY telegraf (windup) — dluzszy, bardziej
        # "wstrzymany" niz u zwyklego wilka (ktory nie ma telegrafu wcale).
        if i == 0:
            s.update(bob=-0.15, lean=-0.2, ear_back=0.7)
        else:
            s.update(bob=-0.15, lean=-0.2, ear_back=1.0, mouth=1.0)
    elif rodzaj == "bite":
        if i == 0:
            s.update(bob=-0.05, lean=-0.35, ear_back=0.4, mouth=0.3)
        elif i == 1:
            s.update(bob=0.1, lean=0.75, ear_back=1.0, mouth=1.0)
        else:
            s.update(bob=-0.05, lean=-0.1, ear_back=0.5, mouth=0.35)
    elif rodzaj == "hurt":
        s.update(bob=-0.2, lean=-0.45, ear_back=1.0)
    elif rodzaj == "death":
        c = [0.15, 0.45, 0.75, 1.0][i]
        s.update(collapse=c, bob=-c * 0.3, ear_back=0.7, eyes_closed=(c >= 0.75))

    return s


# ── SYLWETKA BOCZNA ──────────────────────────────────────────────────────

def rysuj_bok(rodzaj, i):
    s = stan(rodzaj, i)
    px = pusty()
    up = s["collapse"]
    plx, ply, tlx, tly = s["side_legs"][1:]

    if up < 0.95:
        cien_kontaktowy(px, T - 0.7, T * 0.5, 0.9, 5.8 * BUDOWA * (1 - 0.35 * up))

    cy = T * 0.6 - s["bob"] * T * 0.1 + up * T * 0.2
    rx = T * (0.32 + 0.04 * abs(s["lean"])) * BUDOWA * (1 + 0.1 * up)
    ry = T * 0.14 * BUDOWA * (1 - 0.4 * up)
    elipsa_cien(px, cy, T * 0.45, ry, rx, PALE)

    hx = T * (0.8 + 0.05 * s["lean"]) * (1 - 0.08 * up) + T * 0.06 * up
    hy = cy - T * 0.15 * (1 - up) - s["bob"] * T * 0.03
    hr = T * 0.125 * BUDOWA * (1 - 0.25 * up)
    elipsa_cien(px, hy, hx, hr * 0.95, hr, PALE)

    snout_cx = hx + T * 0.12
    if up < 0.9:
        elipsa_cien(px, hy + T * 0.02, snout_cx, T * 0.05, T * 0.095, PALE, min_st=0, max_st=1)
        kladz(px, hy + T * 0.02, snout_cx + T * 0.08, N[0])
        # Przez grzbiet pyska, POD okiem/brwia, NAD nozdrzami — druga proba
        # (przez brew) stloczyla oko+brew+blizne w jeden nieczytelny kleks w
        # rogu 32px glowy. Tu ma wlasny pas, nic z nim nie koliduje.
        blizna(px, hy + T * 0.01, snout_cx - T * 0.07, 4, 75)
        if s["mouth"] > 0.4:
            kladz(px, hy + T * 0.045, snout_cx + T * 0.03, N[5])
            kladz(px, hy + T * 0.06, snout_cx + T * 0.02, N[5])
        if not s["eyes_closed"]:
            kladz(px, hy - 1, hx + T * 0.01, A[4])
            kladz(px, hy - 2, hx + T * 0.01, A[3])
        luk_brwiowy(px, hy - T * 0.06, hx - T * 0.01, 4.5, kat_deg=8)
        kat_ucha = 12 + s["ear_back"] * 60
        ucho(px, hy - T * 0.1, hx - T * 0.02, 4.6 * (1 - 0.5 * up), 3.6, kat_ucha)
        kat_ogona = 230 - s["lean"] * 20 + up * 30
        ogon(px, cy - T * 0.01, T * (0.13 - 0.05 * abs(s["lean"])), 7.8 * (1 - 0.5 * up), 4.4, kat_ogona)

    hlab = 2.8 * (1 - 0.6 * up)
    laba(px, T * ply, T * plx, w=3.0, h=hlab)
    laba(px, T * tly, T * tlx, w=3.2, h=hlab)
    return px


# ── SYLWETKA PRZOD/TYL ───────────────────────────────────────────────────

def rysuj_przod_tyl(z_tylu, rodzaj, i):
    s = stan(rodzaj, i)
    px = pusty()
    up = s["collapse"]

    if up < 0.95:
        cien_kontaktowy(px, T - 0.7, T * 0.5, 0.9, 4.9 * BUDOWA * (1 - 0.35 * up))

    cy = T * 0.56 - s["bob"] * T * 0.05 + up * T * 0.2
    rx = T * 0.24 * BUDOWA * (1 + 0.1 * up)
    ry = T * 0.22 * BUDOWA * (1 - 0.4 * up)
    elipsa_cien(px, cy, T * 0.5, ry, rx, PALE)

    hy = cy - T * 0.25 * (1 - up) + s["lean"] * T * 0.02
    hr = T * 0.14 * BUDOWA * (1 - 0.2 * up)
    elipsa_cien(px, hy, T * 0.5, hr, hr * 0.97, PALE)

    if up < 0.9:
        kat_out = 18 + s["ear_back"] * 55
        ucho(px, hy - T * 0.08, T * 0.5 - T * 0.09, 4.2 * (1 - 0.4 * up), 3.4, -kat_out)
        ucho(px, hy - T * 0.08, T * 0.5 + T * 0.09, 4.2 * (1 - 0.4 * up), 3.4, kat_out)

        if z_tylu:
            ogon(px, cy + T * 0.17, T * 0.5, 7.4 * (1 - 0.4 * up), 4.4, 178 + s["lean"] * 10)
        else:
            snout_cy = hy + T * (0.09 + 0.02 * s["lean"])
            elipsa_cien(px, snout_cy, T * 0.5, T * 0.045, T * 0.085, PALE, min_st=0, max_st=1)
            kladz(px, snout_cy + T * 0.02, T * 0.5, N[0])
            # Przez grzbiet pyska, POD okiem/brwia — patrz komentarz w rysuj_bok.
            blizna(px, hy + T * 0.02, T * 0.5 - T * 0.06, 4, 70)
            if s["mouth"] > 0.4:
                kladz(px, snout_cy + T * 0.045, T * 0.5 - T * 0.03, N[5])
                kladz(px, snout_cy + T * 0.045, T * 0.5 + T * 0.03, N[5])
            if not s["eyes_closed"]:
                kladz(px, hy - 1, T * 0.5 - T * 0.07, A[4])
                kladz(px, hy - 1, T * 0.5 + T * 0.07, A[4])
                kladz(px, hy - 2, T * 0.5 - T * 0.07, A[3])
                kladz(px, hy - 2, T * 0.5 + T * 0.07, A[3])
            # kat_deg=0, NIE 90 — w tej funkcji (dx=cos, dy=sin) 0st JUZ
            # znaczy "poziomo" (x sie zmienia, y stale). 90st dawalo PIONOWA
            # kreske przez cale czolo (y sie zmienia, x stale) — widoczne
            # dopiero na renderze jako czarna linia nad glowa, nie w raporcie
            # krycia (kreska ma piksele, tylko nie tam gdzie trzeba).
            luk_brwiowy(px, hy - T * 0.07, T * 0.5, 9, kat_deg=0)

    leg_y = T * 0.85 - up * T * 0.35
    spread = T * 0.11 + s["leg_swing"] * T * 0.05
    hlab = 2.7 * (1 - 0.6 * up)
    laba(px, leg_y, T * 0.5 - spread - 1.5, w=2.8, h=hlab)
    laba(px, leg_y + s["leg_stagger"] * T * 0.025, T * 0.5 + spread - 1.5, w=2.8, h=hlab)
    return px


def klatka(kierunek, rodzaj, i):
    if kierunek == "right":
        return rysuj_bok(rodzaj, i)
    if kierunek == "left":
        return np.fliplr(rysuj_bok(rodzaj, i)).copy()
    if kierunek == "down":
        return rysuj_przod_tyl(False, rodzaj, i)
    return rysuj_przod_tyl(True, rodzaj, i)


def zbuduj_arkusz():
    ark = np.zeros((T * ROWS, T * COLS, 4), np.uint8)
    for si, stan_nazwa in enumerate(STANY):
        for ki, kierunek in enumerate(KIERUNKI):
            wiersz = si * len(KIERUNKI) + ki
            for c in range(KLATKI[stan_nazwa]):
                kafel = klatka(kierunek, stan_nazwa, c)
                ark[wiersz * T:(wiersz + 1) * T, c * T:(c + 1) * T] = kafel
    return ark


def raport(ark):
    print("greywolf.png %dx%d (%d kolumn x %d wierszy, kafel %dpx)" %
          (ark.shape[1], ark.shape[0], COLS, ROWS, T))
    ok = True
    for si, stan_nazwa in enumerate(STANY):
        for ki, kierunek in enumerate(KIERUNKI):
            wiersz = si * len(KIERUNKI) + ki
            for c in range(KLATKI[stan_nazwa]):
                kafel = ark[wiersz * T:(wiersz + 1) * T, c * T:(c + 1) * T]
                krycie = int((kafel[..., 3] > 0).sum())
                if krycie <= 20:
                    ok = False
                    print("  [%s/%s %d] krycie=%4dpx  BLAD" % (stan_nazwa, kierunek, c, krycie))
    print("WYNIK:", "OK" if ok else "BLAD")
    return ok


def main(zapisz):
    ark = zbuduj_arkusz()
    ok = raport(ark)
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    if not ok:
        print("\nPrzerwano zapis — raport zglosil blad.")
        return
    Image.fromarray(ark, "RGBA").save(OUT_PATH)
    print("\n-> %s" % OUT_PATH)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Buduje greywolf.png. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true")
    args = ap.parse_args()
    main(args.zapisz)

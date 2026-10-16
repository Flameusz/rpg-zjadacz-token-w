"""
Generator arkusza wilka -> public/assets/wolf.png

Uruchom:  python tools/build_wilk.py            (podglad + raport, NIC nie zapisuje)
          python tools/build_wilk.py --zapisz   (nadpisuje public/assets/wolf.png)

**Ten arkusz jest dzis TYLKO grafika — celowo NIEWPIETY w gre.** Zaden kod w
src/ go nie laduje; `Wolf`/`GreyWolf` nadal uzywaja `makeWolfPlaceholder`.
Wpiecie (nowy `ASSETS.wolf` w ksztalcie tabeli wierszy zamiast pojedynczych
`walkRow`/`runRow`, `sliceCreatureSheet`, animacje, i — jesli zdecydujemy sie
na to — nowe hooki `onHurtVisual`/`onDeathVisual` w `Enemy.ts`) to osobny,
pozniejszy krok. Powod: user chcial NAJPIERW ustalic pelny zakres animacji i
zobaczyc grafike, zanim cokolwiek w kodzie AI/wizualnym sie zmieni — patrz
notatka w CLAUDE.md przy ASSETS.wolf.

── PELNY ZAKRES (ustalony z userem przed rysowaniem) ───────────────────────
6 stanow x 4 NIEZALEZNIE narysowane kierunki (nie 3+odbicie jak u
krolika/dzika — user chcial prawdziwe 4 kierunki). W praktyce "lewo" jest
generowane jako lustrzane odbicie "prawo" WEWNATRZ TEGO SKRYPTU (nie w
silniku przez setFlipX) — plik i tak dostaje osobne, prawdziwe piksele dla
kazdego z 4 kierunkow, dokladnie tak samo jak `Character.png` (gdzie wiersze
"left"/"right" tez sa, zweryfikowane, lustrzanymi kopiami — patrz CLAUDE.md).

| stan | klatek | mapowanie na Wolf.ts / GreyWolf.ts |
|---|---|---|
| Idle | 1 | pauzy patrolu, `stalk` |
| Walk | 4 | patrol/`circleStep`/domykanie dystansu/`close` |
| Growl | 2 | `onGainAggro→howl()` (alarm) + `windup` u Szarego. NIE gra przed |
|      |   | kazdym `lunge` zwyklego wilka — to zepsuloby celowo "untelegraphed" |
|      |   | dart (patrz komentarz w Wolf.ts o `lungeMs`/`lungeSpeed`). |
| Bite Attack | 3 | `lunge` (w ruchu, dart) / `windup→resolveBite` Szarego (w miejscu) |
| Hurt Reaction | 1 | nowy hook — dzis TYLKO `flashHit` (tint), zaden stwor nie ma klatki |
| Death | 4 | nowy hook — dzis TYLKO generyczny tween w `Enemy.die()` |

Pounce/Leap (opcja z pierwszej rozmowy) — POMINIETY na tym etapie: user
zdecydowal "narazie tylko odswiezamy grafike placeholderow, nie dokladamy
nowej logiki do kodu", a Pounce jako realny ruch wymagalby nowego zasiegu/
czasu w GreyWolf.ts, nie tylko nowych klatek.

── UKLAD ARKUSZA ────────────────────────────────────────────────────────
28x28 kafle (jak dzik), 4 kolumny (max klatek/stan), 24 wiersze
(6 stanow x 4 kierunki). `wiersz = stan_idx*4 + kier_idx`,
kierunki w kolejnosci down/up/left/right (ten sam porzadek co
`ASSETS.character.dirRows`). Nieuzywane kolumny (np. Idle ma 1 z 4) zostaja
przezroczyste — ten sam trik co pierwszy wiersz `rabbit.png`.

── TECHNIKA ──────────────────────────────────────────────────────────────
Te same prymitywy co `build_dzik.py` (`kladz`/`elipsa_cien`/`cien_kontaktowy`,
rampa 6-stopniowa z iloczynu skalarnego normalnej elipsoidy ze swiatlem) oraz
`ucho()` — uzywana teraz NIE TYLKO na uszy, ale i na ogon (oba to "stozkowaty
wyrostek od punktu bazowego pod kątem", ten sam ksztalt, inny kierunek/dlugosc).

Kazdy stan jest jedna funkcja `stan()` zwracajaca ABSTRAKCYJNE parametry
(bob/lean/mouth/ear_back/collapse/leg_phase...), czytane przez DWA rysowniki
— `rysuj_bok` (lewo/prawo, dart lub odwrot od kamery) i `rysuj_przod_tyl`
(gora/dol, patrzy w/od kamery). Bez tego rozdzielenia 6 stanow x 4 kierunki
to 24 osobne, niezalezne rysunki do zsynchronizowania recznie; tak — jeden
wspolny slownik parametrow per (stan, klatka), dwa sposoby jego odczytania.

Paleta: `kamien` (chlodny szary, pasuje do starego placeholdera 0x5b5f66) +
`akcent_cieply` NA SAM OTOK OKA (bursztynowe spojrzenie drapieznika — swiadomy
akcent, ten sam pomysl co zloty tresc starego placeholdera 0xd8c24a).
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

T = 28
COLS = 4
STANY = ["idle", "walk", "growl", "bite", "hurt", "death"]
KLATKI = {"idle": 1, "walk": 4, "growl": 2, "bite": 3, "hurt": 1, "death": 4}
KIERUNKI = ["down", "up", "left", "right"]
ROWS = len(STANY) * len(KIERUNKI)
OUT_PATH = os.path.join(ASSETS, "animals", "wolf.png")

SWIATLO = (-0.45, -0.9)


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()
K = PAL["kamien"]         # 0 najciemniejszy .. 4 najjasniejszy — futro
A = PAL["akcent_cieply"]  # bursztynowe oko
N = PAL["neutralne"]      # kly, nos


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
    """Stozkowaty wyrostek od (cy,cx) w kierunku `kat_deg` (0 = w gore) —
    UŻYWANY JAKO OBA: ucho i ogon (ten sam ksztalt, inny punkt zaczepienia/
    kierunek/dlugosc). Ten sam odwrotnie-mapowany wypelniacz co u krolika/
    dzika (zero dziur niezaleznie od kata)."""
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
    wyrostek(px, cy, cx, dl, szer, kat_deg, K[1], K[2])


def ogon(px, cy, cx, dl, szer, kat_deg, puszysty=True):
    # Jasny stopien (K[4], NIE K[3]) — pierwsza wersja gubila sie w cieniu
    # zadu, bo oba byly w tej samej ciemnej polowie rampy i ogon czytal sie
    # jak zwykle zwezenie sylwetki, nie jak osobny, puszysty wyrostek.
    wyrostek(px, cy, cx, dl, szer, kat_deg, K[1], K[4] if puszysty else K[2])


def laba(px, y, x, w=2.6, h=2.4):
    if h <= 0:
        return
    prostokat(px, y, y + h, x, x + w, K[0])


# ── STAN: jeden slownik parametrow per (stan, klatka), czytany przez oba
#    rysowniki (bok i przod/tyl). To jest cala synchronizacja miedzy widokami.

WALK_FAZY = [
    # (bob, przod_x, przod_y, tyl_x, tyl_y) — x/y wzgledem sylwetki bocznej
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
        if i == 0:
            s.update(bob=-0.1, lean=-0.1, ear_back=0.6)
        else:
            s.update(bob=-0.1, lean=-0.1, ear_back=1.0, mouth=1.0)
    elif rodzaj == "bite":
        if i == 0:
            s.update(bob=-0.05, lean=-0.35, ear_back=0.4, mouth=0.3)
        elif i == 1:
            s.update(bob=0.1, lean=0.7, ear_back=1.0, mouth=1.0)
        else:
            s.update(bob=-0.05, lean=-0.1, ear_back=0.5, mouth=0.35)
    elif rodzaj == "hurt":
        s.update(bob=-0.2, lean=-0.45, ear_back=1.0)
    elif rodzaj == "death":
        c = [0.15, 0.45, 0.75, 1.0][i]
        s.update(collapse=c, bob=-c * 0.3, ear_back=0.7, eyes_closed=(c >= 0.75))

    return s


# ── SYLWETKA BOCZNA (lewo/prawo — rysujemy "prawo", "lewo" to lustro) ───────

def rysuj_bok(rodzaj, i):
    s = stan(rodzaj, i)
    px = pusty()
    up = s["collapse"]
    plx, ply, tlx, tly = s["side_legs"][1:]

    if up < 0.95:
        cien_kontaktowy(px, T - 0.7, T * 0.5, 0.8, 5.2 * (1 - 0.35 * up))

    cy = T * 0.6 - s["bob"] * T * 0.1 + up * T * 0.2
    # Leaner than the boar's body plan on purpose (rx/ry ~2.3 vs ~1.7) — a
    # wolf that reads as round/stout is indistinguishable from a small boar
    # at this palette-driven distance; the pointed snout carries the rest.
    rx = T * (0.32 + 0.04 * abs(s["lean"])) * (1 + 0.1 * up)
    ry = T * 0.14 * (1 - 0.4 * up)
    elipsa_cien(px, cy, T * 0.45, ry, rx, K)

    hx = T * (0.8 + 0.05 * s["lean"]) * (1 - 0.08 * up) + T * 0.06 * up
    hy = cy - T * 0.15 * (1 - up) - s["bob"] * T * 0.03
    hr = T * 0.12 * (1 - 0.25 * up)
    elipsa_cien(px, hy, hx, hr * 0.95, hr, K)

    # Pysk — wydluzony, zwezajacy sie, ciemniejszy koniec.
    snout_cx = hx + T * 0.12
    if up < 0.9:
        elipsa_cien(px, hy + T * 0.02, snout_cx, T * 0.05, T * 0.09, K, min_st=0, max_st=1)
        kladz(px, hy + T * 0.02, snout_cx + T * 0.08, K[0])
        if s["mouth"] > 0.4:
            kladz(px, hy + T * 0.045, snout_cx + T * 0.03, N[5])
            kladz(px, hy + T * 0.06, snout_cx + T * 0.02, N[5])
        if not s["eyes_closed"]:
            kladz(px, hy - 1, hx + T * 0.01, A[4])
        kat_ucha = 12 + s["ear_back"] * 60
        ucho(px, hy - T * 0.1, hx - T * 0.02, 4.4 * (1 - 0.5 * up), 3.4, kat_ucha)
        # 230°, NOT 130° — kat_deg=0 is "up" and increases clockwise, so 130°
        # points down-and-FORWARD (into the body, toward the head/right) and
        # the tail vanished into the torso it should hang out behind. 230°
        # points down-and-BACKWARD (away from the head), the actual rear.
        kat_ogona = 230 - s["lean"] * 20 + up * 30
        ogon(px, cy - T * 0.01, T * (0.13 - 0.05 * abs(s["lean"])), 7.5 * (1 - 0.5 * up), 4.2, kat_ogona)

    hlab = 2.6 * (1 - 0.6 * up)
    laba(px, T * ply, T * plx, w=2.8, h=hlab)
    laba(px, T * tly, T * tlx, w=3.0, h=hlab)
    return px


# ── SYLWETKA PRZOD/TYL (patrzy w / od kamery) ───────────────────────────────

def rysuj_przod_tyl(z_tylu, rodzaj, i):
    s = stan(rodzaj, i)
    px = pusty()
    up = s["collapse"]

    if up < 0.95:
        cien_kontaktowy(px, T - 0.7, T * 0.5, 0.8, 4.4 * (1 - 0.35 * up))

    cy = T * 0.56 - s["bob"] * T * 0.05 + up * T * 0.2
    # Narrower than before (0.27→0.24 rx) to match the leaner side-view body
    # — front/back and side silhouettes have to agree or the wolf changes
    # build depending which way it's walking.
    rx = T * 0.24 * (1 + 0.1 * up)
    ry = T * 0.22 * (1 - 0.4 * up)
    elipsa_cien(px, cy, T * 0.5, ry, rx, K)

    hy = cy - T * 0.25 * (1 - up) + s["lean"] * T * 0.02
    hr = T * 0.135 * (1 - 0.2 * up)
    elipsa_cien(px, hy, T * 0.5, hr, hr * 0.97, K)

    if up < 0.9:
        kat_out = 18 + s["ear_back"] * 55
        ucho(px, hy - T * 0.08, T * 0.5 - T * 0.09, 4 * (1 - 0.4 * up), 3.2, -kat_out)
        ucho(px, hy - T * 0.08, T * 0.5 + T * 0.09, 4 * (1 - 0.4 * up), 3.2, kat_out)

        if z_tylu:
            # Base pushed close to the body's own bottom edge (ry≈0.22T) —
            # the first version anchored well inside it, so only the tapered
            # tip poked out and the tail read as a pointed rump, not a
            # separate hanging shape.
            ogon(px, cy + T * 0.17, T * 0.5, 7 * (1 - 0.4 * up), 4.2, 178 + s["lean"] * 10)
        else:
            snout_cy = hy + T * (0.09 + 0.02 * s["lean"])
            elipsa_cien(px, snout_cy, T * 0.5, T * 0.045, T * 0.08, K, min_st=0, max_st=1)
            kladz(px, snout_cy + T * 0.02, T * 0.5, K[0])
            if s["mouth"] > 0.4:
                kladz(px, snout_cy + T * 0.045, T * 0.5 - T * 0.03, N[5])
                kladz(px, snout_cy + T * 0.045, T * 0.5 + T * 0.03, N[5])
            if not s["eyes_closed"]:
                kladz(px, hy - 1, T * 0.5 - T * 0.07, A[4])
                kladz(px, hy - 1, T * 0.5 + T * 0.07, A[4])

    leg_y = T * 0.85 - up * T * 0.35
    spread = T * 0.11 + s["leg_swing"] * T * 0.05
    hlab = 2.5 * (1 - 0.6 * up)
    laba(px, leg_y, T * 0.5 - spread - 1.4, w=2.6, h=hlab)
    laba(px, leg_y + s["leg_stagger"] * T * 0.025, T * 0.5 + spread - 1.4, w=2.6, h=hlab)
    return px


def klatka(kierunek, rodzaj, i):
    if kierunek == "right":
        return rysuj_bok(rodzaj, i)
    if kierunek == "left":
        return np.fliplr(rysuj_bok(rodzaj, i)).copy()
    if kierunek == "down":
        return rysuj_przod_tyl(False, rodzaj, i)
    return rysuj_przod_tyl(True, rodzaj, i)  # up


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
    print("wolf.png %dx%d (%d kolumn x %d wierszy, kafel %dpx)" %
          (ark.shape[1], ark.shape[0], COLS, ROWS, T))
    ok = True
    for si, stan_nazwa in enumerate(STANY):
        for ki, kierunek in enumerate(KIERUNKI):
            wiersz = si * len(KIERUNKI) + ki
            for c in range(KLATKI[stan_nazwa]):
                kafel = ark[wiersz * T:(wiersz + 1) * T, c * T:(c + 1) * T]
                krycie = int((kafel[..., 3] > 0).sum())
                stan_ok = krycie > 20
                if not stan_ok:
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
    print("\n-> %s (NIEWPIETY w gre — patrz naglowek pliku)" % OUT_PATH)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Buduje wolf.png. Domyslnie nic nie nadpisuje.")
    ap.add_argument("--zapisz", action="store_true")
    args = ap.parse_args()
    main(args.zapisz)

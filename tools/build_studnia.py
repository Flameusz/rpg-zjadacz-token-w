"""
Wycina pojedyncze elementy studni (public/assets/studnia.png, wygenerowana
Gemini) do OSOBNYCH plikow PNG w public/assets/ — NIE wklejane do
Buildings.png. User bedzie sam skladal studnie w Tiled (np. jako "Collection
of Images" tileset albo luzne obiekty), wiec kazdy element musi zostac
samodzielnym plikiem jak `piec.png`, nie kaflem w sztywnej siatce 32x32.

Uruchom:  python tools/build_studnia.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_studnia.py --zapisz    (zapisuje pliki do public/assets/)
          python tools/build_studnia.py --podglad X.png  (dodatkowo eksportuje zlozony podglad)

── SKALA ─────────────────────────────────────────────────────────────────
Zmierzone (connected-component bbox, nie na oko): WSZYSTKIE elementy w
studnia.png siedza na module ~40px, nie 32px — spojny blad w calym
arkuszu (nie losowy rozrzut per-element), wiec jeden globalny wspolczynnik
0.8 (32/40) naprawia od razu cala proporcje miedzy kawalkami.

── ELEMENTY ──────────────────────────────────────────────────────────────
Bounding-boxy zmierzone connected-component labelingiem na studnia.png, nie
zgadniete: pierscien cembrowiny, slupek, belka poprzeczna, wiadro. Dach
(lukowy kamienny daszek) swiadomie POMINIETY — user: "olejmy dach, belka
wystarczy", pierscien+belka to caly szkielet. Reszta (kolowrot, lina,
tekstury muru) zostaje na kolejna runde, jesli bedzie potrzebna.

── KOLORY ────────────────────────────────────────────────────────────────
Rampa WYMUSZONA per element (kamien albo drewno), NIE klasyfikowana
per-piksel po nasyceniu jak w build_barrel.py — pierwsza wersja probowala
tego samego r-b heurystyka i pomylila szaro-bezowy "greige" kamien
pierscienia/luku z drewnem (zmierzone: (146,134,121), r-b=25, tuz nad
progiem 20 — najliczniejszy kolor pierscienia trafil w zla rampe).
Zoomowanie na zrodlo pokazalo jednoznacznie: pierscien+luk to czysty
kamien, slupek+belka to czyste drewno — zaden pojedynczy element nie
miesza obu materialow, wiec wymuszona rampa per element jest i prostsza,
i poprawniejsza niz jakikolwiek heurystyk per-piksel.

── DOKLADNIE 32x32 DLA ELEMENTOW "1-KAFEL" ──────────────────────────────────
User zlapal: `studnia_pierscien.png` wyszedl 34x32, nie 32x32 — zaokraglenie
skali (round(42*0.8)=34, nie 32) zostawilo 2px nadmiaru. Pierscien i polowki
dachu maja byc UZYWALNE jako pojedynczy kafel Tiled, wiec po skalowaniu ida
na sztywny T x T canvas (docinane/wysrodkowane przez `_dopasuj_do_kafla`).
Slupek/belka NIE dostaja tego traktowania — to freeform rekwizyty (waskie/
szerokie), a nie kafle.
"""

import argparse
import json
import os
from collections import deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC_PATH = os.path.join(ASSETS, "studnia.png")
SKALA = 0.8
T = 32

# (nazwa_pliku, (x0,y0,x1,y1), rampa, czy_1_kafel) — bbox zmierzone
# connected-component labelingiem. Rampa WYMUSZONA per element (nie
# zgadywana per-piksel po nasyceniu) — zoom na zrodlo pokazal, ze
# pierscien/dach to czysty kamien (szaro-bezowe "greige" tony myliliby
# prosty r-b heurystyk), a slupek/belka to czyste drewno. "dach_lewo"
# pominiete: zrodlowa lewa polowka luku ma brazowa skaze na srodku
# (widoczna w zoomie, prawa polowka jest czysta) — uzywamy lustrzanego
# odbicia czystej prawej zamiast wadliwej lewej.
#
# `czy_1_kafel`: pierscien/dach maja byc UZYWALNE jako pojedynczy kafel
# Tiled (32x32 dokladnie), wiec po przeskalowaniu ida na sztywny 32x32
# canvas (docinane/wysrodkowane). Slupek/belka NIE — to freeform rekwizyty
# (waskie/szerokie), doszywanie ich do kwadratu tylko dolozyloby pustego
# marginesu bez sensu.
ELEMENTY = [
    ("studnia_pierscien.png", (2, 2, 44, 42), "kamien", True),
    ("studnia_slupek.png", (2, 44, 10, 83), "drewno", False),
    ("studnia_belka.png", (92, 46, 168, 83), "drewno", False),
    # Dach pominiety na prosbe usera ("olejmy dach, belka wystarczy") — pierscien
    # + belka to caly szkielet studni. Wiadro: drewniane wiadro + metalowe
    # obrecze + lina/hak, wiec dostaje MIESZANA rampe (per-piksel, jak
    # build_barrel.py), nie wymuszona jedna jak pierscien/dach powyzej —
    # tutaj oba materialy naprawde wystepuja razem w jednym elemencie.
    ("studnia_wiadro.png", (144, 85, 161, 126), "drewno+neutralne", False),
    ("studnia_kolowrot.png", (2, 90, 58, 123), "drewno+neutralne", False),
]


def wczytaj_palety():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    hx = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    return (np.array([hx(h) for h in p["kamien"]]),
            np.array([hx(h) for h in p["drewno"]]),
            np.array([hx(h) for h in p["neutralne"]]))


K, D, N = wczytaj_palety()


def _wykryj_tlo(arr):
    h, w, _ = arr.shape
    rogi = np.array([arr[0, 0], arr[0, w - 1], arr[h - 1, 0], arr[h - 1, w - 1]])
    return rogi.mean(axis=0)


def _usun_zielone(arr, bg):
    h, w, _ = arr.shape
    diff = np.abs(arr[..., :3].astype(int) - bg).sum(axis=2)
    is_bg = diff < 70

    visited = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    still_green = (g > 140) & (g > r + 30) & (g > b + 30)

    alpha = np.where(visited | still_green, 0, 255).astype(np.uint8)
    return alpha


def _przekoluj(rgb, alpha, rampa_nazwa):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)

    if rampa_nazwa == "drewno+neutralne":
        r, g, b = px[:, 0], px[:, 1], px[:, 2]
        szare = (np.abs(r - b) < 20) & (np.abs(r - g) < 20)
        out_px = np.zeros_like(px)
        if (~szare).any():
            d = ((px[~szare][:, None, :] - D[None, :, :].astype(int)) ** 2).sum(axis=2)
            out_px[~szare] = D[np.argmin(d, axis=1)]
        if szare.any():
            d = ((px[szare][:, None, :] - N[None, :, :].astype(int)) ** 2).sum(axis=2)
            out_px[szare] = N[np.argmin(d, axis=1)]
        out[mask] = out_px
        return out

    rampa = K if rampa_nazwa == "kamien" else D
    d = ((px[:, None, :] - rampa[None, :, :].astype(int)) ** 2).sum(axis=2)
    out[mask] = rampa[np.argmin(d, axis=1)]
    return out


def _dopasuj_do_kafla(tresc):
    """Wysrodkuj na dokladnie T x T — docina nadmiar, dopelnia przezroczystoscia
    brak. `tresc` to juz przeskalowany element (moze byc troche wiekszy/
    mniejszy niz T z zaokraglenia skali — round(42*0.8)=34, nie 32)."""
    canvas = np.zeros((T, T, 4), np.uint8)
    h, w = tresc.shape[:2]
    if w >= T:
        x_src0 = (w - T) // 2
        tresc = tresc[:, x_src0:x_src0 + T]
        w = T
    if h >= T:
        y_src0 = (h - T) // 2
        tresc = tresc[y_src0:y_src0 + T, :]
        h = T
    x_off = (T - w) // 2
    y_off = (T - h) // 2
    canvas[y_off:y_off + h, x_off:x_off + w] = tresc
    return canvas


def zbuduj_element(src, bg, box, rampa_nazwa, czy_1_kafel):
    x0, y0, x1, y1 = box
    crop = src[y0:y1, x0:x1].copy()
    alpha = _usun_zielone(crop, bg)

    # Skaluj PRZED przekolorowaniem (BOX, nie NEAREST) — patrz nauka z
    # build_barrel.py: NEAREST na juz-przekolorowanym obrazie dziurawi
    # cienkie kontury przy nie-calkowitych skalach.
    img = Image.fromarray(np.dstack([crop, alpha]), "RGBA")
    nowa_w = max(1, round(img.width * SKALA))
    nowa_h = max(1, round(img.height * SKALA))
    img = img.resize((nowa_w, nowa_h), Image.BOX)

    resized = np.array(img)
    kolor = _przekoluj(resized[..., :3], resized[..., 3], rampa_nazwa)
    tresc = np.dstack([kolor, resized[..., 3]])
    if czy_1_kafel:
        tresc = _dopasuj_do_kafla(tresc)
    return tresc


def main(zapisz, podglad):
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    bg = _wykryj_tlo(src)
    print("Wykryty kolor tla:", tuple(bg.round().astype(int).tolist()))

    wyniki = []
    for nazwa, box, rampa_nazwa, czy_1_kafel in ELEMENTY:
        el = zbuduj_element(src, bg, box, rampa_nazwa, czy_1_kafel)
        n = int((el[..., 3] > 0).sum())
        print("%s: %dx%d, %d nieprzezroczystych pikseli" % (nazwa, el.shape[1], el.shape[0], n))
        wyniki.append((nazwa, el))

    if podglad:
        gap = 6
        w = sum(e.shape[1] for _, e in wyniki) + gap * (len(wyniki) - 1)
        h = max(e.shape[0] for _, e in wyniki)
        canvas = np.zeros((h, w, 4), np.uint8)
        x = 0
        for _, e in wyniki:
            canvas[:e.shape[0], x:x + e.shape[1]] = e
            x += e.shape[1] + gap
        Image.fromarray(canvas, "RGBA").resize((w * 6, h * 6), Image.NEAREST).save(podglad)
        print("Podglad (6x): %s" % podglad)

    if not zapisz:
        print("Nic nie zapisano — uzyj --zapisz.")
        return

    for nazwa, el in wyniki:
        Image.fromarray(el, "RGBA").save(os.path.join(ASSETS, nazwa))
    print("Zapisano %d plikow do %s" % (len(wyniki), ASSETS))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

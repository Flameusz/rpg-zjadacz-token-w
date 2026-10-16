"""
Docina ławkę (public/assets/lawka.png, wygenerowana Gemini) na dwa kafle
32x32 i dokleja je jako NOWY WIERSZ do public/assets/Buildings.png, plus
aktualizuje docs/budynki.json.

Uruchom:  python tools/build_lawka.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_lawka.py --zapisz    (nadpisuje Buildings.png + budynki.json)
          python tools/build_lawka.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

── SKAD TO SIE WZIELO ───────────────────────────────────────────────────────
`lawka.png` to surowa generacja Gemini (62x28, zielone tlo), pierwszy w tym
projekcie prop typu "ławka" — wczesniej istnial tylko jako przyklad w
komentarzu w MapBuilder.ts, nic nie bylo zbudowane. Rozmiarowo (~1.9 kafla
szerokosci, mniej niz 1 kafel wysokosci, ~2x szerokosc gracza) pasuje do
skali reszty rekwizytow (por. piec.png 240x131 w podworku kuzni) bez
zadnego skalowania.

── DLACZEGO DWA KAFLE, NIE JEDEN OBIEKT ─────────────────────────────────────
User: "trzeba ja przeciac na pol by pasowala do tileset". W przeciwienstwie
do KUZNIA_WYPOSAZENIE (dowolnej wielkosci PNG-i stemplowane na wspolrzedne
kafla, patrz naglowek nad ta lista w build_mapa.py), Buildings.png jest
SIATKA 32x32 — kazdy kafel to osobna komorka w Tiled, `id = wiersz*19+kolumna`
(patrz CLAUDE.md, "Adding tiles must go in NEW ROWS"). Zeby lawka byla
prawdziwym kaflem tego tilesetu (nie osobnym obrazkiem jak piec.png), musi
byc pocieta na dwie komorki 32x32 postawione obok siebie w Tiled.

── TECHNIKA ──────────────────────────────────────────────────────────────
1. Ciasny bounding-box tresci (nie zgadniety): x2-60, y0-27 w oryginale.
2. Zielone tlo zdejmowane DWA razy (flood-fill + prog resztkowy), identycznie
   jak build_kowal.py/build_kowal_idle.py.
3. Kazdy piksel snapowany do NAJBLIZSZEGO koloru z rampy `drewno`
   (docs/paleta.json) — zrodlo mialo juz tylko odcienie drewna (25 unikalnych
   kolorow, wszystkie bliskie tej rampie, zmierzone), bez oddzielnego
   czarnego konturu (zgodne z docs/ART_DIRECTION.md 4.4 dla propow: krawedz
   ciemniejsza o stopien wlasnej rampy, nie czarny obrys).
4. Tresc osadzona przy DOLNEJ krawedzi kafla (rekwizyt stojacy na ziemi, nie
   sciana) na canvasie 64x32 (2 kafle szer. x 1 kafel wys.), wysrodkowana
   poziomo. Wysokosc tresci (28px) < wysokosc kafla (32px), wiec 4px nad
   lawka zostaje przezroczyste.
5. Podzial dokladnie na x=32: lewa polowa (siedzisko+lewa noga), prawa
   polowa (siedzisko+prawa noga) — kazda 32x32, doklejona do Buildings.png
   jako NOWY wiersz (id = 7*19+0 = 133, 7*19+1 = 134), zeby ANI JEDEN
   istniejacy id sie nie przesunal (CLAUDE.md: wstawienie kolumny by
   zmozaikowalo mape, doklejenie wiersza nie rusza niczego).
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

SRC_PATH = os.path.join(ASSETS, "lawka.png")
SHEET_PATH = os.path.join(ASSETS, "Buildings.png")
JSON_PATH = os.path.join(DOCS, "budynki.json")

T, PITCH = 32, 33
COLS = 19

# Ciasny bounding-box tresci w lawka.png (nie zgadniety, zmierzony).
_BOX = (2, 0, 61, 28)


def wczytaj_drewno():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    hx = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    return np.array([hx(h) for h in p["drewno"]])


D = wczytaj_drewno()


def _usun_zielone(arr):
    """Identyczne jak build_kowal.py: flood-fill od krawedzi + prog resztkowy."""
    h, w, _ = arr.shape
    bg = np.array([6, 253, 3])
    diff = np.abs(arr[..., :3].astype(int) - bg).sum(axis=2)
    is_bg = diff < 60

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


def _snap_drewno(rgb, alpha):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)
    d = ((px[:, None, :] - D[None, :, :].astype(int)) ** 2).sum(axis=2)
    out[mask] = D[np.argmin(d, axis=1)]
    return out


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    x0, y0, x1, y1 = _BOX
    crop = src[y0:y1, x0:x1].copy()
    alpha = _usun_zielone(crop)
    kolor = _snap_drewno(crop, alpha)
    tresc = np.dstack([kolor, alpha])  # (28, 59, 4)

    ch, cw = tresc.shape[0], tresc.shape[1]
    canvas = np.zeros((T, 2 * T, 4), np.uint8)
    x_off = (2 * T - cw) // 2
    y_off = T - ch  # dolna krawedz
    canvas[y_off:y_off + ch, x_off:x_off + cw] = tresc

    lewa = canvas[:, :T]
    prawa = canvas[:, T:]
    return lewa, prawa


def raport(lewa, prawa):
    for nazwa, k in [("lawka_l", lewa), ("lawka_p", prawa)]:
        n = int((k[..., 3] > 0).sum())
        print("%s: %dx%d, %d nieprzezroczystych pikseli" % (nazwa, k.shape[1], k.shape[0], n))


def main(zapisz, podglad):
    lewa, prawa = zbuduj()
    raport(lewa, prawa)

    podgladowy = np.concatenate([lewa, prawa], axis=1)
    img = Image.fromarray(podgladowy, "RGBA")
    if podglad:
        img.resize((img.width * 8, img.height * 8), Image.NEAREST).save(podglad)
        print("Podglad (8x): %s" % podglad)

    if not zapisz:
        print("Nic nie zapisano — uzyj --zapisz.")
        return

    arkusz = np.array(Image.open(SHEET_PATH).convert("RGBA"))
    stare_h = arkusz.shape[0]
    # Wysokosc arkusza to wierszy*PITCH - 1 (ostatni wiersz nie ma odstepu
    # ZA soba), wiec `stare_h // PITCH` NIEDOLICZA jeden wiersz (230//33=6,
    # a naprawde jest 7 wierszy: (230+1)//33=7). To realny blad zlapany w
    # tej sesji — pierwsza wersja nadpisala JUZ UZYWANE kafle dachu
    # (kon_polac_kal_0/2, id 114-115) tym samym id co lawka, bo policzyla
    # wiersz=6 zamiast 7. Odtworzone z gita, poprawione tutaj.
    wiersz = (stare_h + 1) // PITCH
    id_l = wiersz * COLS + 0
    id_p = wiersz * COLS + 1

    d = json.load(open(JSON_PATH, encoding="utf-8"))
    # Ochrona przed powtorka tego bledu: zanim COKOLWIEK zapiszemy (obraz
    # LUB json), upewnij sie, ze docelowy wiersz naprawde jest pusty.
    zajete = {v["id"]: k for k, v in d["kafle"].items()}
    for id_ in (id_l, id_p):
        if id_ in zajete:
            raise SystemExit(
                "STOP: id %d juz zajete przez '%s' — obliczenie wiersza (%d) jest"
                " bledne, NIC nie zapisano (ani obrazu, ani json)." % (id_, zajete[id_], wiersz)
            )

    nowy_wiersz_h = PITCH  # kolejny wiersz + jego wlasny 1px odstep
    nowy = np.zeros((stare_h + nowy_wiersz_h, arkusz.shape[1], 4), np.uint8)
    nowy[:stare_h] = arkusz
    y0 = wiersz * PITCH
    nowy[y0:y0 + T, 0:T] = lewa
    nowy[y0:y0 + T, PITCH:PITCH + T] = prawa
    Image.fromarray(nowy, "RGBA").save(SHEET_PATH)
    print("Zapisano %s (%dx%d, +1 wiersz)" % (SHEET_PATH, nowy.shape[1], nowy.shape[0]))

    d["arkusz"]["wierszy"] += 1
    d["arkusz"]["wysokosc"] = nowy.shape[0]
    d["arkusz"]["kafli"] += 2
    d["kafle"]["lawka_l"] = {"kolumna": 0, "wiersz": wiersz, "id": id_l}
    d["kafle"]["lawka_p"] = {"kolumna": 1, "wiersz": wiersz, "id": id_p}
    json.dump(d, open(JSON_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Zaktualizowano %s: lawka_l id=%d, lawka_p id=%d" % (JSON_PATH, id_l, id_p))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

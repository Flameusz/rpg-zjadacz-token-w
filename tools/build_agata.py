"""
Generator portretu Agaty (kowalowej) -> public/assets/characters/agata_portrait.png

Uruchom:  python tools/build_agata.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_agata.py --zapisz         (nadpisuje agata_portrait.png)
          python tools/build_agata.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `agata.png` (50x105, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
„Ostatnia czwórka placeholderów — Witek, Sobek, Agata, Dobrawa"). Agata juz
istnieje w kodzie (`AGATA` w GameConfig.ts, punkt `agata` w village-zagaje.tmj),
do tej pory na wspolnym NPC.png z tintem.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru: x1-47, y9-95, czyli 47x87.

── DLACZEGO SUKNIA I CHUSTA/FARTUCH DZIELA JASNOSC, NIE ODCIEN ────────────
W odroznieniu od Sobka (gdzie problem byl "dwa cieple brazy blisko siebie
matematycznie"), tu problem jest inny: chusta/fartuch (chlodna szarosc) i
suknia (ciepla ochra) maja WYRAZNIE rozne odcienie, wiec zwykly najblizszy-
-sasiad po calej palecie naraz dziala poprawnie bez potrzeby dzielenia po
pozycji — zweryfikowane, kazdy zmierzony kolor trafia jednoznacznie albo w
`neutralne` (chlodny), albo w `piasek` (cieply), bez kolizji.

── DLACZEGO WLOSY NIE MAJA WLASNEJ RAMPY ──────────────────────────────────
Widoczny jest tylko pojedynczy kosmyk na czole (chusta zakrywa reszte, tak
jak prompt prosil) — cztery zmierzone tony (y7-13, waski pasek na czubku
glowy) sa cieplo-brazowe i trafiaja czysto w `piasek` (ta sama rampa co
suknia) bez kolizji, bo leza w zupelnie innym miejscu kadru niz gdziekolwiek
indziej suknia jest widoczna. Ten sam wzorzec co u Sobka/Gniewki/Witka.

Tylko SKORA dostala wlasna, ciasna rampe (3 tony) — patrz TABELA.

── TABELA (zmierzone kolory + rola po pozycji, patrz naglowek generatora) ──

    kontur                  prawie czarny       -> neutralne (ciemny koniec)
    chusta/fartuch/buty      chlodna szarosc     -> neutralne
    suknia (rekawy/dol)      ciepla ochra        -> piasek
    kosmyk wlosow  y7-13     cieply braz         -> piasek (bez kolizji)
    skora          y8-62     brzoskwiniowa       -> WLASNA rampa (3 tony)
"""

import argparse
import json
import os
from collections import Counter, deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC = os.path.join(ASSETS, "agata.png")
OUT = os.path.join(ASSETS, "characters", "agata_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasna rampa, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#feba94", "#d27f60", "#a46544"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#0e0c17": P["neutralne"][0], "#100e19": P["neutralne"][0],
    "#0c0c13": P["neutralne"][0], "#090710": P["neutralne"][0],
    # chusta/fartuch/buty (osmalona, chlodna szarosc) -> neutralne
    "#4f4d58": P["neutralne"][2], "#32313b": P["neutralne"][1],
    "#75727c": P["neutralne"][3], "#3d3c45": P["neutralne"][2],
    "#474650": P["neutralne"][2], "#605e68": P["neutralne"][2],
    "#6c6a72": P["neutralne"][3], "#191723": P["neutralne"][0],
    # suknia (ochrowe rekawy/dol) -> piasek
    "#cf923b": P["piasek"][2], "#9a6517": P["piasek"][1],
    "#8b5f33": P["piasek"][1], "#976216": P["piasek"][1],
    "#815834": P["piasek"][1], "#d7b575": P["piasek"][3],
    "#ca9446": P["piasek"][2], "#8b5c24": P["piasek"][0],
    # kosmyk wlosow -> piasek, bez kolizji (patrz naglowek)
    "#6d4b34": P["piasek"][0], "#634836": P["piasek"][0],
    "#7d5f46": P["piasek"][1], "#b59169": P["piasek"][2],
    # skora — wlasna rampa (3 tony), reszta antyaliasingu snapuje do nich
    "#feba94": SKORA[0], "#f9e2d3": SKORA[0], "#eca584": SKORA[0],
    "#d27f60": SKORA[1], "#d58567": SKORA[1], "#dd9171": SKORA[1],
    "#a46544": SKORA[2],
}

# Do raportu: ktora grupa jest ktora.
GRUPA = {}
for k in TABELA:
    GRUPA[k] = (
        "skora" if TABELA[k] in SKORA else
        next((n for n, v in P.items() if TABELA[k] in v), "?")
    )


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def alfa_bez_zieleni(a):
    """Zielone tlo zdejmowane DWA razy: flood-fill od krawedzi + prog na
    resztkach. Sam flood-fill nie siegnie zieleni uwiezionej w szczelinach
    (np. miedzy nogami), sam prog zjadlby zielone piksele w postaci."""
    h, w, _ = a.shape
    bg = np.array([10, 248, 4])
    is_bg = np.abs(a - bg).sum(2) < 90
    vis = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x] and not vis[y, x]:
                vis[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not vis[y, x]:
                vis[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and is_bg[ny, nx]:
                vis[ny, nx] = True
                q.append((ny, nx))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    still = (g > 140) & (g > r + 30) & (g > b + 30)
    return np.where(vis | still, 0, 255).astype(np.uint8)


def zbuduj():
    a = np.array(Image.open(SRC).convert("RGB")).astype(int)
    alpha = alfa_bez_zieleni(a)

    ys, xs = np.nonzero(alpha)
    box = (xs.min(), ys.min(), xs.max(), ys.max())
    a = a[box[1]:box[3] + 1, box[0]:box[2] + 1]
    alpha = alpha[box[1]:box[3] + 1, box[0]:box[2] + 1]

    src_cols = np.array([hx(k) for k in TABELA])
    dst_cols = np.array([hx(TABELA[k]) for k in TABELA])
    grupy = [GRUPA[k] for k in TABELA]

    out = a.copy()
    m = alpha > 0
    px = a[m]
    # Najblizszy WPIS TABELI, nie najblizszy kolor rampy — patrz naglowek.
    idx = np.argmin(((px[:, None, :] - src_cols[None, :, :]) ** 2).sum(2), axis=1)
    out[m] = dst_cols[idx]

    trafienia = Counter(grupy[i] for i in idx)
    dokladne = sum(1 for i, p in zip(idx, px) if tuple(p) == tuple(src_cols[i]))
    return np.dstack([out.astype(np.uint8), alpha]), box, trafienia, dokladne, int(m.sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="PLIK")
    args = ap.parse_args()

    img, box, trafienia, dokladne, npix = zbuduj()
    h, w = img.shape[0], img.shape[1]

    print("bounding-box (policzony): x%d-%d y%d-%d -> %dx%d" % (box[0], box[2], box[1], box[3], w, h))
    print("nieprzezroczystych: %d" % npix)
    print("trafienia dokladne w tabele: %d/%d (%.0f%%) — reszta to antyaliasing" %
          (dokladne, npix, 100 * dokladne / npix))
    for gr, n in trafienia.most_common():
        print("   %-10s %5d px" % (gr, n))
    puste = sorted(set(GRUPA.values()) - set(trafienia))
    if puste:
        print("   ⚠ GRUPY BEZ PIKSELI: %s" % ", ".join(puste))

    kolory = {tuple(int(v) for v in c) for c in img[img[..., 3] > 0][:, :3]}
    dozwolone = {hx(h2) for v in P.values() for h2 in v} | {hx(h2) for h2 in SKORA}
    obce = sorted("#%02x%02x%02x" % c for c in kolory - dozwolone)
    print("kolorow wyjsciowych: %d | spoza palety+wlasnej rampy: %s" % (len(kolory), obce or "BRAK"))

    # `scale` liczony z realnej wysokosci tresci, nie zgadniety — ta sama
    # metoda co przy Sobku/Witku/Hannie: cel to ~1.1x wysokosci gracza (60px * 1.1 = 66px).
    print("proponowany GameConfig scale: %.2f  (66 / %d)" % (66.0 / h, h))

    if args.podglad:
        p = Image.fromarray(img, "RGBA")
        p.resize((w * 6, h * 6), Image.NEAREST).save(args.podglad)
        print("podglad -> %s" % args.podglad)
    if args.zapisz:
        Image.fromarray(img, "RGBA").save(OUT)
        print("zapisano -> %s" % os.path.basename(OUT))
    else:
        print("(nic nie zapisano — dodaj --zapisz)")


if __name__ == "__main__":
    main()

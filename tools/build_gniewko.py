"""
Generator portretu Gniewki (Pasterza) -> public/assets/characters/gniewko_portrait.png

Uruchom:  python tools/build_gniewko.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_gniewko.py --zapisz         (nadpisuje gniewko_portrait.png)
          python tools/build_gniewko.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `gniewko.png` (51x99, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
„Gniewko/Pasterz"). Gniewko wypasa stado za wsia; w kodzie juz istnieje
(`GNIEWKO` w GameConfig.ts, punkt `gniewko` w village-zagaje.tmj, zadanie
`wolf_pack_cull`), do tej pory na wspolnym NPC.png z tintem.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru: x2-47, y7-90, czyli 46x84.

── DLACZEGO WLOSY NIE MAJA WLASNEJ RAMPY (inaczej niz Kuba) ───────────────
Kuba mial siwa brode na szarym kapeluszu — najblizszy-sasiad wpychal oba w
`kamien` i broda znikala W STYCZNOSCI z kapeluszem. Tu wlosy sa brazowe, a
otoczenie (plaszcz/tunika) tez jest brazowo-kremowe — dokladnie ten sam
przypadek co Zofia ("nie ma tu kategorii koloru, ktora zniknelaby po
zmapowaniu", patrz `docs/prompty_gemini.md`). Zmierzone: kazdy z szesciu
tonow wlosow ma odpowiednik w `ziemia`/`kora`/`piasek` w promieniu ~10 na
RGB — wlosy ida wiec przez ta sama jawna tabele co reszta stroju.

Tylko SKORA dostaje wlasna, ciasna rampe (3 tony) — bez tego najblizszy-
-sasiad wciaga jasniejsze tony skory w `akcent_cieply` (czerwono-pomaranczowy
ton przeznaczony na co innego), a ciemniejsze w `piasek`/`ziemia`, czyli
dloni nie dalo by sie odroznic od nogawic obok.

── TABELA (zmierzone centroidy, nie zgadniete) ────────────────────────────

    wlosy      y~0-20   braz         -> ziemia/kora/piasek (najblizszy)
    skora      y~10-59  brzoskwinia  -> WLASNA rampa (3 tony)
    kaptur     y~20-45  kremowy      -> piasek
    tunika     y~45-60  ciemny braz  -> drewno
    pas/nogi   y~45-78  jasny braz   -> piasek
    buty       y~73-90  granat       -> neutralne
    kontur              prawie czarny -> neutralne (ciemny koniec)
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

SRC = os.path.join(ASSETS, "gniewko.png")
OUT = os.path.join(ASSETS, "characters", "gniewko_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasna rampa, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#f4ae82", "#cd9367", "#a36546"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#02020f": P["neutralne"][0], "#030313": P["neutralne"][0],
    # buty (granatowo-szare, ta sama rampa co kontur, jasniejszy koniec)
    "#24222f": P["neutralne"][1], "#151320": P["neutralne"][0],
    # wlosy — najblizszy sasiad w standardowej palecie, patrz naglowek
    "#815d3e": P["ziemia"][2], "#84613f": P["ziemia"][2],
    "#4f3227": P["kora"][1], "#472b20": P["kora"][1],
    "#704e39": P["piasek"][0], "#693e2c": P["ziemia"][1],
    # skora — wlasna rampa (3 tony), reszta antyaliasingu snapuje do nich
    "#f4ae82": SKORA[0],
    "#cd9367": SKORA[1], "#c38460": SKORA[1],
    "#c07d57": SKORA[2], "#a36546": SKORA[2], "#ae7251": SKORA[2], "#9c5f3f": SKORA[2],
    # kaptur/plaszcz (kremowy) -> piasek
    "#f6e4a6": P["piasek"][4], "#d4b578": P["piasek"][3],
    "#8c6f4c": P["piasek"][1], "#886a49": P["piasek"][1],
    # tunika (ciemny braz pod plaszczem) -> drewno
    "#5b3025": P["drewno"][1], "#3d1f1a": P["drewno"][0], "#412019": P["drewno"][0],
    # pas / nogawice (jasny braz) -> piasek
    "#aa8a5f": P["piasek"][2], "#816447": P["piasek"][1],
    # rzadka krawedz antyaliasingu (1px) miedzy kapturem a plaszczem
    "#d6bc89": P["piasek"][3],
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
    bg = np.array([2, 250, 3])
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
    # metoda co przy Kubie/Zofii: cel to ~1.1x wysokosci gracza (60px * 1.1 = 66px).
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

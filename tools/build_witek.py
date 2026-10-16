"""
Generator portretu Witka (lniarza) -> public/assets/characters/witek_portrait.png

Uruchom:  python tools/build_witek.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_witek.py --zapisz         (nadpisuje witek_portrait.png)
          python tools/build_witek.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `witek.png` (50x102, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
„Ostatnia czwórka placeholderow — Witek, Sobek, Agata, Dobrawa"). Witek juz
istnieje w kodzie (`WITEK` w GameConfig.ts, punkt `witek` w village-zagaje.tmj,
`padded_cap`/`gambeson`/`padded_chausses`/`foot_wraps` w jego stocku), do tej
pory na wspolnym NPC.png z tintem.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru: x1-48, y8-94, czyli 48x87.

── DLACZEGO WLOSY NIE MAJA WLASNEJ RAMPY (tak jak Gniewko, inaczej niz Kuba) ─
Tunika jest chlodna (szaro-zielona -> `kamien`), otoczenie brody/wlosow to
cieply braz -> zero kolizji kategorii koloru z niczym sasiadujacym. Mierzony
odcien wlosow (#5b3d31) trafia niemal dokladnie w `kora[2]` (#5a3f35, odleglosc
~21 na RGB) — ten sam efekt co u Zofii/Gniewki: nie trzeba osobnej rampy.

Tylko SKORA dostaje wlasna, ciasna rampe (3 tony) — bez tego jasne tony
skory wciagalyby sie w `piasek`/`kamien`, a ciemne w `kora`, i dloni nie
dalo by sie odroznic od reki w rekawie.

── TABELA (zmierzone kolory, klasyfikacja po odlegosci RGB do zadeklarowanej
   palety promptu — patrz `docs/prompty_gemini.md`, sekcja Witka) ─────────

    tunika (sucha)     szaro-zielona     -> kamien (najblizszy)
    rekawy/dol/pas/buty ciemny/sredni braz -> kora (zamoczone, „stained")
    wlosy              cieply braz       -> kora[2] (najblizszy, bez kolizji)
    skora              brzoskwiniowa     -> WLASNA rampa (3 tony)
    kontur             prawie czarny     -> neutralne (ciemny koniec)
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

SRC = os.path.join(ASSETS, "witek.png")
OUT = os.path.join(ASSETS, "characters", "witek_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasna rampa, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#f9ac82", "#ca7d5a", "#8d4b3c"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#010212": P["neutralne"][0], "#02020c": P["neutralne"][0],
    # tunika (sucha) — szaro-zielona -> kamien
    "#69726d": P["kamien"][1],
    "#878c98": P["kamien"][2], "#8d929d": P["kamien"][2],
    "#5c5e64": P["kamien"][1], "#63686a": P["kamien"][1],
    "#40424e": P["kamien"][0], "#393b47": P["kamien"][0],
    # tunika (cien) — ciemniejszy niebiesko-szary -> neutralne
    "#343440": P["neutralne"][1], "#363743": P["neutralne"][1],
    "#545460": P["neutralne"][2], "#50535e": P["neutralne"][2],
    "#4e515c": P["neutralne"][2], "#4c4c56": P["neutralne"][2],
    # rekawy/dol/pas/buty (zamoczone, ciemny braz) -> kora
    "#4a2d26": P["kora"][1], "#412720": P["kora"][1], "#47302c": P["kora"][1],
    "#58372c": P["kora"][2], "#321e1a": P["kora"][0], "#302021": P["kora"][0],
    "#7f5d45": P["kora"][3], "#6e4e3e": P["kora"][3], "#785646": P["kora"][3],
    # wlosy — najblizszy sasiad w tej samej puli co plamy (brak kolizji)
    "#5b3d31": P["kora"][2],
    # skora — wlasna rampa (3 tony), reszta antyaliasingu snapuje do nich
    "#f9ac82": SKORA[0], "#f2c3a3": SKORA[0], "#f6b08b": SKORA[0],
    "#ca7d5a": SKORA[1], "#c77a56": SKORA[1], "#d88b66": SKORA[1],
    "#c28063": SKORA[1], "#a47a67": SKORA[1],
    "#8d4b3c": SKORA[2], "#874633": SKORA[2],
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
    bg = np.array([7, 249, 4])
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
    # metoda co przy Kubie/Zofii/Gniewce: cel to ~1.1x wysokosci gracza (60px * 1.1 = 66px).
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

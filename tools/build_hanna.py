"""
Generator portretu Hanny -> public/assets/characters/hanna_portrait.png

Uruchom:  python tools/build_hanna.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_hanna.py --zapisz         (nadpisuje hanna_portrait.png)
          python tools/build_hanna.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `hanna.png` (50x105, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
„Hanna — trzecia z osemki"). Hanna to zona Dobka (`HANNA` w GameConfig.ts),
odpowiada za nabial w gospodarstwie; do tej pory na wspolnym NPC.png z tintem.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru: x1-47, y9-95, czyli 47x87.

── DLACZEGO WLOSY MAJA WLASNA RAMPE (jak Kuba, nie jak Gniewko) ───────────
Chustka zakrywa niemal cale wlosy — widac tylko kilka kosmykow przy czole
(`#734229`/`#4f2b13`/`#b55b3a`), TUZ OBOK chustki, ktora jest w tej samej
rodzinie brazu co `piasek` (materialem chustki jest niebielony len, tak jak
fartucha). Gdyby kosmyki poszly najblizszym sasiadem do `piasek`, mialyby
duza szanse wyladowac w tym samym tonie co chustka o piksel dalej — i
zniknac dokladnie tak, jak broda Kuby znikala w szarym kapeluszu. Male
ryzyko (to tylko kilka pikseli), ale tania polisa: wlasna, wyraznie
cieplejsza/bardziej nasycona rampa.

── TABELA (zmierzone centroidy, nie zgadniete) ────────────────────────────

    chustka    y~0-22   tan/bez      -> piasek
    kosmyki    y~12-22  kasztanowe   -> WLASNA rampa (2 tony)
    skora      y~12-58  brzoskwinia  -> WLASNA rampa (3 tony)
    suknia     y~22-58  spłowialy roz -> akcent_cieply
    fartuch    y~45-87  tan/bez      -> piasek
    lamowanie  y~45-87  rdzawy braz  -> akcent_cieply (ta sama rodzina co suknia)
    cien szwu  y~45-87  ciemny braz  -> kora/drewno
    buty       y~87-95  granat       -> neutralne
    kontur              prawie czarne -> neutralne (ciemny koniec)
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

SRC = os.path.join(ASSETS, "hanna.png")
OUT = os.path.join(ASSETS, "characters", "hanna_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasne rampy, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#febb95", "#e39970", "#d4835f"]
WLOSY = ["#b55b3a", "#734229", "#4f2b13"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#121018": P["neutralne"][0], "#14121b": P["neutralne"][0],
    "#200707": P["neutralne"][0],
    # buty (granatowo-szare)
    "#4b484e": P["neutralne"][2], "#25242d": P["neutralne"][1],
    # skora — wlasna rampa
    "#febb95": SKORA[0], "#fbd29f": SKORA[0],
    "#e39970": SKORA[1], "#d98864": SKORA[1],
    "#d4835f": SKORA[2],
    # kosmyki wlosow spod chustki — wlasna rampa
    "#b55b3a": WLOSY[0], "#734229": WLOSY[1], "#4f2b13": WLOSY[2],
    # chustka i fartuch (niebielony len) -> piasek
    "#d3bd8b": P["piasek"][2], "#a88b60": P["piasek"][1], "#aa8e65": P["piasek"][1],
    "#ceb788": P["piasek"][3], "#c1a880": P["piasek"][3],
    # suknia (splowialy roz) -> akcent_cieply
    "#c6766d": P["akcent_cieply"][3], "#9f534d": P["akcent_cieply"][2],
    "#741b13": P["akcent_cieply"][1], "#791e14": P["akcent_cieply"][1],
    "#69221b": P["akcent_cieply"][1], "#6d180a": P["akcent_cieply"][0],
    "#b57157": P["akcent_cieply"][3],
    # lamowanie fartucha (rdzawy braz, ta sama rodzina co suknia) -> akcent_cieply
    "#c26d45": P["akcent_cieply"][3],
    # cien szwu / krawedzi fartucha -> kora
    "#3c2b22": P["kora"][1], "#6a4935": P["kora"][3], "#4f3625": P["kora"][1],
    "#573f2e": P["kora"][2], "#875d45": P["kora"][3],
}

# Do raportu: ktora grupa jest ktora.
GRUPA = {}
for k in TABELA:
    GRUPA[k] = (
        "skora" if TABELA[k] in SKORA else
        "wlosy" if TABELA[k] in WLOSY else
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
    dozwolone = {hx(h2) for v in P.values() for h2 in v} | {hx(h2) for h2 in SKORA + WLOSY}
    obce = sorted("#%02x%02x%02x" % c for c in kolory - dozwolone)
    print("kolorow wyjsciowych: %d | spoza palety+wlasnych ramp: %s" % (len(kolory), obce or "BRAK"))

    # `scale` liczony z realnej wysokosci tresci, nie zgadniety — ta sama
    # metoda co przy Kubie/Gniewce: cel to ~1.1x wysokosci gracza (66px).
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

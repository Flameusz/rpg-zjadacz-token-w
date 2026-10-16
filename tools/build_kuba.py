"""
Generator portretu Kuby -> public/assets/kuba_portrait.png

Uruchom:  python tools/build_kuba.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_kuba.py --zapisz         (nadpisuje kuba_portrait.png)
          python tools/build_kuba.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `kuba.png` (50x104, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
o osemce z `wioska_plan.md` §6). Kuba to starzec przy studni; w kodzie juz
istnieje (`KUBA` w GameConfig.ts, punkt `kuba` w village-zagaje.tmj), do tej
pory na wspolnym NPC.png z tintem.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru, nie zgadniety: x2-46, y6-94, czyli
45x89. Ta wysokosc jest wazna poza samym wycinaniem — z niej wychodzi `scale`
w `GameConfig.ts` (patrz raport na koncu).

── DLACZEGO JAWNA TABELA, A NIE `snap_paleta.py` ──────────────────────────
Bo Kuba ma **siwa brode na szarym kapeluszu**, a to jest dokladnie pulapka,
ktora `build_dorota.py` musial obejsc: przy snapowaniu do najblizszego
sasiada siwizna ma najblizej `kamien`, czyli te sama rampe co kapelusz i
buty. Cala kategoria „wlosy" znika wtedy w kategorii „kamien" i starzec traci
brode — nie przez blad, tylko przez poprawne dzialanie zlego narzedzia.

Dlatego SKORA i BRODA maja **wlasne rampy, swiadomie NIE snapowane** do
`docs/paleta.json` (ta sama decyzja co u Zofii i Doroty: skora i wlosy sa
osobnym materialem, nie musza sie zgadzac z paleta srodowiska), a reszta idzie
przez jawna tabele zbudowana z ZMIERZONYCH centroidow kazdego koloru — nie
z nazwy i nie na oko:

    kapelusz  y~13-25  szarosci  -> kamien
    broda     y~28-33  bielsze   -> WLASNA rampa
    skora     y~20-48  rozowe    -> WLASNA rampa
    tunika    y~47-57  brazy     -> kora / drewno
    spodnie   y~76-78  brazy     -> ziemia
    buty      y~88     szarosci  -> kamien
    kontur             prawie czarne -> neutralne (ciemny koniec)

Piksele spoza tabeli dostaja kolor NAJBLIZSZEGO WPISU TABELI (nie najblizszy
kolor rampy) — to trzyma przejscia antyaliasingu w tej samej kategorii co
sasiadujace piksele, zgodnie z przepisem w `docs/prompty_gemini.md`.
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

SRC = os.path.join(ASSETS, "kuba.png")
OUT = os.path.join(ASSETS, "characters", "kuba_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasne rampy, poza paleta srodowiskowa — patrz naglowek.
BRODA = ["#f2ece1", "#cfc7bc", "#a49b91"]
SKORA = ["#fbc39d", "#d98d70", "#a85f52"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kapelusz + buty (te same szarosci, ta sama rampa)
    "#777582": P["kamien"][2], "#504f5c": P["kamien"][0], "#74727f": P["kamien"][2],
    "#4d4b57": P["kamien"][0], "#807b7d": P["kamien"][3], "#555461": P["kamien"][1],
    "#5b5a67": P["kamien"][1], "#7f7e88": P["kamien"][2], "#3b3b48": P["neutralne"][2],
    # broda / wlosy — wlasna rampa
    "#efe9dc": BRODA[0], "#f2ece1": BRODA[0], "#bbb2a8": BRODA[1],
    "#b7aea3": BRODA[1], "#a79e95": BRODA[2], "#7a7577": BRODA[2],
    # skora — wlasna rampa
    "#fce4ce": SKORA[0], "#fbb48d": SKORA[0], "#fbb894": SKORA[0],
    "#cf7c65": SKORA[1], "#e69577": SKORA[1],
    "#b76355": SKORA[2], "#985046": SKORA[2],
    # tunika
    "#5d3f35": P["kora"][3], "#5a3d33": P["kora"][3], "#694633": P["kora"][3],
    "#8f674c": P["kora"][4], "#723e2c": P["kora"][2],
    "#3a201f": P["kora"][1], "#3d211f": P["kora"][1], "#391e1c": P["kora"][1],
    # spodnie
    "#805439": P["ziemia"][2], "#4b241a": P["ziemia"][0], "#4f261d": P["ziemia"][1],
    # kontur
    "#040117": P["neutralne"][0], "#040111": P["neutralne"][0], "#1f1118": P["neutralne"][0],
}

# Do raportu: ktora grupa jest ktora.
GRUPA = {}
for k in TABELA:
    GRUPA[k] = (
        "broda" if TABELA[k] in BRODA else
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
    dozwolone = {hx(h2) for v in P.values() for h2 in v} | {hx(h2) for h2 in BRODA + SKORA}
    obce = sorted("#%02x%02x%02x" % c for c in kolory - dozwolone)
    print("kolorow wyjsciowych: %d | spoza palety+wlasnych ramp: %s" % (len(kolory), obce or "BRAK"))

    # `scale` liczony z realnej wysokosci tresci, nie zgadniety — ta sama
    # metoda co przy Zofii: cel to ~1.1x wysokosci gracza (60px * 1.1 = 66px).
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

"""
Generator portretu Sobka (stolarza) -> public/assets/characters/sobek_portrait.png

Uruchom:  python tools/build_sobek.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_sobek.py --zapisz         (nadpisuje sobek_portrait.png)
          python tools/build_sobek.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `sobek.png` (51x103, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
„Ostatnia czwórka placeholderów — Witek, Sobek, Agata, Dobrawa"). Sobek juz
istnieje w kodzie (`SOBEK` w GameConfig.ts, punkt `sobek` w village-zagaje.tmj,
warsztat stolarski x66-71/y45-51), do tej pory na wspolnym NPC.png z tintem.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru: x1-48, y8-94, czyli 48x87 — ten
sam rozmiar co Witek (przypadek, oba zrodla wyszly z Gemini na 50-51x102-103).

── DLACZEGO KAZDY KOLOR TRAFIA DO SWOJEJ ROLI, NIE TYLKO DO NAJBLIZSZEJ
   RAMPY GLOBALNIE ──────────────────────────────────────────────────────
Czysty najblizszy-sasiad PO CALEJ palecie (drewno+piasek+neutralne+
akcent_zlocisty naraz) wcisnalby dominujacy kolor fartucha (#79422e,
402px, srodek klatki y32-67) w `piasek[0]` (dystans 369) zamiast w `drewno`
(dystans 579) — matematycznie blizej, ale to by scalilo fartuch skorzany
z tunika lniana w jedna rampe i skasowalo kontrast, ktory prompt mial dac.
Kazdy zmierzony kolor jest wiec NAJPIERW przypisany do ROLI po POZYCJI w
kadrze (fartuch y32-67 x12-35 srodek, tunika/rekawy y14-56 x1-46 szeroko,
spodnie y58-74, buty y75-85, wlosy y1-15 x15-32 waski gorny pasek, skora
y7-61 x2-45 rozproszona po twarzy i ramionach), DOPIERO POTEM snapowany do
najblizszego tonu WEWNATRZ przypisanej rampy.

Wlosy NIE dostaly wlasnej rampy (jak u Gniewki/Witka, nie jak u Kuby) —
dzielą `drewno` z fartuchem/butami bez kolizji, bo lezą w zupelnie innym
miejscu kadru (sam czubek glowy, y1-15) i nic brazowego ich tam nie dotyka.

Tylko SKORA dostala wlasna, ciasna rampe (3 tony) — reszta antyaliasingu
snapuje do niej po prostym dystansie RGB (skora nie ma zadnej roli-kolizji,
bo jest jedynym cieplym-brzoskwiniowym odcieniem w calym obrazku).

── TABELA (zmierzone kolory + rola po pozycji, patrz naglowek generatora) ──

    kontur              prawie czarny        -> neutralne (ciemny koniec)
    spodnie    y58-74    granatowo-szare     -> neutralne
    fartuch    y32-67    sredni/ciemny braz  -> drewno
    buty       y75-85    ciemny braz         -> drewno
    wlosy      y1-15     cieply braz         -> drewno (bez kolizji)
    tunika     y14-56    jasniejszy piaskowy -> piasek
    wiory      y23-50    zlocisty akcent     -> akcent_zlocisty (male plamki)
    skora      y7-61     brzoskwiniowa       -> WLASNA rampa (3 tony)
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

SRC = os.path.join(ASSETS, "sobek.png")
OUT = os.path.join(ASSETS, "characters", "sobek_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasna rampa, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#fdae86", "#c87c5e", "#82453c"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#05051a": P["neutralne"][0], "#060414": P["neutralne"][0],
    # spodnie (granatowo-szare) -> neutralne
    "#332f3e": P["neutralne"][1], "#363240": P["neutralne"][1],
    "#574f5b": P["neutralne"][2],
    "#2a1c21": P["neutralne"][1],  # 2px, brzeg fartucha/spodni
    # fartuch skorzany -> drewno
    "#79422e": P["drewno"][1], "#75402d": P["drewno"][1],
    "#472119": P["drewno"][0], "#40201b": P["drewno"][0],
    "#8f644c": P["drewno"][3],
    # buty -> drewno (ten sam material co fartuch)
    "#613a32": P["drewno"][1],
    # wlosy -> drewno, bez kolizji (patrz naglowek)
    "#533421": P["drewno"][0], "#815539": P["drewno"][2],
    # tunika pod fartuchem (jasniejsza) -> piasek
    "#af8e69": P["piasek"][2], "#ad8b66": P["piasek"][2],
    "#805c42": P["piasek"][1], "#7c5940": P["piasek"][0],
    # wiory na ramionach (male, zlociste plamki) -> akcent_zlocisty
    "#b48429": P["akcent_zlocisty"][1], "#f6ce82": P["akcent_zlocisty"][4],
    # skora — wlasna rampa (3 tony), reszta antyaliasingu snapuje do nich
    "#fdae86": SKORA[0], "#fdb18b": SKORA[0],
    "#c87c5e": SKORA[1], "#c47556": SKORA[1], "#c6795a": SKORA[1],
    "#82453c": SKORA[2],
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
    bg = np.array([9, 249, 2])
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
    # metoda co przy Witku/Hannie/Kubie: cel to ~1.1x wysokosci gracza (60px * 1.1 = 66px).
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

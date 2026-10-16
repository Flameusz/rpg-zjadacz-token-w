"""
Generator portretu Sulisława -> public/assets/characters/sulislaw_portrait.png

Uruchom:  python tools/build_sulislaw.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_sulislaw.py --zapisz         (nadpisuje sulislaw_portrait.png)
          python tools/build_sulislaw.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `sulislaw.jpg` (720x1483, Gemini — prompt w `docs/prompty_gemini.md`,
sekcja „Sulisław — czwarty z osemki"). Sulislaw siedzi przy studni z Kuba;
w kodzie juz istnieje (`SULISLAW` w GameConfig.ts), do tej pory na wspolnym
NPC.png z tintem.

── ⚠ TEN PLIK JEST 14x WIEKSZY NIZ POPRZEDNIE ZRODLA, I TO ZMIENIA PIERWSZY KROK
Gniewko/Hanna/Kuba przyszly jako PNG w realnej rozdzielczosci sprite'a
(~50x100). Ten przyszedl jako JPEG 720x1483 — Gemini narysowal "styl pixel
art" w wysokiej rozdzielczosci zamiast prawdziwie niskiej siatki. Zmierzone:
mediana dlugosci biegu tego samego koloru w poziomie ~12-14px, stosunek
720/50 = 14.4 — spojne z jednym "kaflem sztuki" = ~14 prawdziwych pikseli.
Wyswietlenie tego wprost przy `NEAREST` (tak renderuje caly projekt) dalyby
pasy aliasingu zamiast platow koloru z poprzednich postaci.

Dlatego PIERWSZYM krokiem jest downsampling `Image.BOX` (usredniajacy, nie
najblizszy-sasiad) do szerokosci 50 — to samo co widzialby ktos, gdyby Gemini
narysowal to od razu w wlasciwej skali. Dopiero POTEM dziala caly reszta
przepisu Kuby: zdjecie zielonego tla, ciasny bounding-box, przekolorowanie.

── DLACZEGO PROG NA RESZTKACH TLA JEST LUZNIEJSZY NIZ U INNYCH (g>90, nie g>110)
Uśrednianie JPEG-owego szumu przez `Image.BOX` zostawilo blade zielonkawe
piksele na granicy siwizny i ramion (np. #476b46, #285f1e) — realny sygnal
zielna, ale slabszy niz czyste PNG dawaly. Wezszy prog (jak u Gniewki/Hanny)
zostawial je jako widoczna zielona obwodke wokol sylwetki; ten prog jest
zmierzony tak, zeby ja usunac bez nadgryzania siwych wlosow (ktore majazbliza
sie do neutralnej szarosci, ale nie do zielonej).

── DLACZEGO TO NIE JEST BRODATY STARZEC (mimo ze duzy JPEG tak sugerowal)
Na pelnej rozdzielczosci cieniowanie szczeki czytalo sie jak pelna broda —
ale na PRAWDZIWEJ siatce 44x87 to jest zwykly cien pod broda, nie osobna
faktura wlosow. Zweryfikowane wycieciem 14x powiekszonej glowy: Sulislaw
jest gladko ogolony. To DOBRZE — rozdziela go sylwetka od Kuby (kapelusz +
pelna broda), zamiast dwoch takich samych sylwetek starcow przy studni.

── DWA WLASNE MATERIALY (jak Kuba): SKORA i SIWIZNA
Siwizna (skronie) ma najblizej `kamien` w standardowej palecie — ta sama
pulapka co broda Kuby: zlana z kamienna palety, zniknelaby w kontrze do
niczego konkretnego (arkusz nie ma tu kamiennych elementow), ale i tak dostaje
WLASNA range dla spojnosci z reszta rodziny starcow. Zmetnialе oko (jasny
niebiesko-szary highlight, #c0c6cb) dzieli najjasniejszy ton tej samej rampy —
prompt to przewidywal wprost ("the clouded eye may use the lightest tone of
the hair ramp").

    czaszka/skora   y~0-24   brzoskwinia   -> WLASNA rampa (3 tony)
    siwizna skroni  y~3-11   szarawa       -> WLASNA rampa (3 tony)
    oko zdrowe      (18,14)  ciemny fiolet -> neutralne (najblizszy sasiad)
    oko zmetniale   (25,14)  jasny szaroniebieski -> SIWIZNA[0] (najjasniejszy ton)
    tunika          y~24-60  braz          -> drewno/piasek/kora (najblizszy sasiad)
    spodnie/buty    y~60-87  ciemny braz   -> kora/neutralne (najblizszy sasiad)
    kontur                   prawie czarny -> neutralne (ciemny koniec)
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

SRC = os.path.join(ASSETS, "sulislaw.jpg")
OUT = os.path.join(ASSETS, "characters", "sulislaw_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasne rampy, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#f9b68c", "#e39f7a", "#a96d51"]
SIWIZNA = ["#cdc3b9", "#aaa49f", "#696b63"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#05130f": P["neutralne"][0], "#040f0d": P["neutralne"][0], "#071613": P["neutralne"][0],
    "#241216": P["neutralne"][0],
    # oko zdrowe (ciemny fiolet, najblizej neutralne[1])
    "#312c34": P["neutralne"][1],
    # skora — wlasna rampa
    "#f9b68c": SKORA[0], "#fab58c": SKORA[0], "#fab68d": SKORA[0], "#f8b58d": SKORA[0],
    "#e39f7a": SKORA[1], "#d69771": SKORA[1], "#e5a17b": SKORA[1], "#e19e79": SKORA[1],
    "#a96d51": SKORA[2], "#9f715d": SKORA[2], "#8f5841": SKORA[2], "#a56a4d": SKORA[2],
    # oko zmetniale -> najjasniejszy ton siwizny (patrz naglowek)
    "#c0c6cb": SIWIZNA[0],
    # siwizna skroni — wlasna rampa
    "#cdc3b9": SIWIZNA[0], "#cec3b9": SIWIZNA[0], "#b2aba4": SIWIZNA[0],
    "#aaa49f": SIWIZNA[1], "#a9a49e": SIWIZNA[1], "#9f9b97": SIWIZNA[1], "#98928e": SIWIZNA[1],
    "#696b63": SIWIZNA[2], "#696c66": SIWIZNA[2], "#6a6c65": SIWIZNA[2], "#6c6f68": SIWIZNA[2],
    "#6d6868": SIWIZNA[2], "#777171": SIWIZNA[2],
    # tunika (jasniejsze partie) -> piasek
    "#8f6c4c": P["piasek"][1], "#ab8c60": P["piasek"][2], "#8d6a4c": P["piasek"][1],
    "#8e6c4c": P["piasek"][1],
    # tunika (cien, fald) -> drewno
    "#583927": P["drewno"][1], "#7d5b40": P["drewno"][2], "#452017": P["drewno"][0],
    "#7a5336": P["drewno"][2], "#725239": P["drewno"][2], "#442117": P["drewno"][0],
    # spodnie/buty (najciemniejsze) -> kora
    "#32211e": P["kora"][0], "#4f3629": P["kora"][1], "#50382c": P["kora"][2],
    "#312321": P["kora"][0], "#ac8961": P["piasek"][2], "#4f372b": P["kora"][1],
    "#2d1616": P["kora"][0],
}

GRUPA = {}
for k in TABELA:
    GRUPA[k] = (
        "skora" if TABELA[k] in SKORA else
        "siwizna" if TABELA[k] in SIWIZNA else
        next((n for n, v in P.items() if TABELA[k] in v), "?")
    )


def hx(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def alfa_bez_zieleni(a):
    """Zielone tlo zdejmowane DWA razy: flood-fill od krawedzi + prog na
    resztkach. Prog LUZNIEJSZY niz u innych postaci (g>90, nie >110) — patrz
    naglowek: Image.BOX zostawil blady zielony osad po JPEG-owym szumie."""
    h, w, _ = a.shape
    bg = np.array([5, 249, 4])
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
    still = (g > 90) & (g > r + 15) & (g > b + 15)
    return np.where(vis | still, 0, 255).astype(np.uint8)


def zbuduj():
    src = Image.open(SRC).convert("RGB")
    w0, h0 = src.size
    tw = 50
    th = round(h0 * tw / w0)
    # Downsampling USREDNIAJACY (BOX), nie najblizszy-sasiad — sprowadza
    # 14x-za-duzy render Gemini do prawdziwej siatki sprite'a. Patrz naglowek.
    small = src.resize((tw, th), Image.BOX)
    a = np.array(small).astype(int)
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
    idx = np.argmin(((px[:, None, :] - src_cols[None, :, :]) ** 2).sum(2), axis=1)
    out[m] = dst_cols[idx]

    trafienia = Counter(grupy[i] for i in idx)
    dokladne = sum(1 for i, p in zip(idx, px) if tuple(p) == tuple(src_cols[i]))
    return np.dstack([out.astype(np.uint8), alpha]), box, (tw, th), trafienia, dokladne, int(m.sum())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", metavar="PLIK")
    args = ap.parse_args()

    img, box, downsampled, trafienia, dokladne, npix = zbuduj()
    h, w = img.shape[0], img.shape[1]

    print("downsampling: %dx%d (z realnego zrodla ~14x wiekszego)" % downsampled)
    print("bounding-box (policzony): x%d-%d y%d-%d -> %dx%d" % (box[0], box[2], box[1], box[3], w, h))
    print("nieprzezroczystych: %d" % npix)
    print("trafienia dokladne w tabele: %d/%d (%.0f%%) — reszta to szum JPEG/antyaliasing" %
          (dokladne, npix, 100 * dokladne / npix))
    for gr, n in trafienia.most_common():
        print("   %-10s %5d px" % (gr, n))
    puste = sorted(set(GRUPA.values()) - set(trafienia))
    if puste:
        print("   ⚠ GRUPY BEZ PIKSELI: %s" % ", ".join(puste))

    kolory = {tuple(int(v) for v in c) for c in img[img[..., 3] > 0][:, :3]}
    dozwolone = {hx(h2) for v in P.values() for h2 in v} | {hx(h2) for h2 in SKORA + SIWIZNA}
    obce = sorted("#%02x%02x%02x" % c for c in kolory - dozwolone)
    print("kolorow wyjsciowych: %d | spoza palety+wlasnych ramp: %s" % (len(kolory), obce or "BRAK"))

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

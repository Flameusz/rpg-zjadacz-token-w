"""
Generator portretu Dobrawy -> public/assets/characters/dobrawa_portrait.png

Uruchom:  python tools/build_dobrawa.py                 (podglad + raport, NIC nie zapisuje)
          python tools/build_dobrawa.py --zapisz         (nadpisuje dobrawa_portrait.png)
          python tools/build_dobrawa.py --podglad X.png  (dodatkowo powiekszony podglad)

Zrodlo: `dobrawa.png` (47x97, Gemini — prompt w `docs/prompty_gemini.md`, sekcja
„Ostatnia czwórka placeholderów — Witek, Sobek, Agata, Dobrawa"). Dobrawa juz
istnieje w kodzie (`DOBRAWA` w GameConfig.ts, punkt `dobrawa` w
village-zagaje.tmj), do tej pory na wspolnym NPC.png z tintem. Ostatnia z
calej osemki z `wioska_plan.md` §6, ktora dostaje wlasna twarz.

── CIASNY BOUNDING-BOX ────────────────────────────────────────────────────
POLICZONY flood-fillem od krawedzi kadru: x4-41, y8-88, czyli 38x81 —
WYRAZNIE waziej niz Witek/Sobek/Agata (47-48px), zgodnie z promptem („a
narrower frame overall... youngest adult in the cast").

── ⚠ REALNY BLAD ZLAPANY NA TEJ POSTACI: dwuetapowe usuwanie zielonego tla
   (flood-fill + „resztki po nasyceniu") UZYWANE WE WSZYSTKICH POPRZEDNICH
   GENERATORACH (Gniewko/Hanna/Witek/Sobek/Agata) ZJADALO CALY KIRTEL ──────
Poprzedni wzorzec (`(g>140)&(g>r+30)&(g>b+30)`) lapal izolowane resztki
czystej zieleni ekranu w szczelinach (miedzy nogami itp.), bo tam kanal G
zawsze wyraznie dominuje. Ale „jasnozielony kirtel z niebielonej welny"
(`#8fb771` = R143 G183 B113, 551px — NAJWIEKSZA pojedyncza plama w calym
obrazku) TEZ spelnia ten warunek: G=183 > R+30=173 i G=183 > B+30=143. Efekt:
551 z 2168 nieprzezroczystych pikseli (cala spodnica) znikalo jako „tlo",
zostawiajac dziure w ksztalcie sukni — na podgladzie czytalo sie to jak
BIALA suknia (przezroczystosc renderowana na bialym), a nie jak zielona.
Zlapane dopiero przy PROBKOWANIU SUROWYCH PIKSELI w miejscu, ktore na oko
wygladalo na biale (`a[oy,ox]` w srodku spodnicy) — sam Counter na
przycietej klatce nie pokazal niczego podejrzanego, bo brakujacych pikseli
po prostu nie bylo na liscie.

**Poprawka: usunieta heurystyka po nasyceniu, zastapiona JEDNYM, ciasnym
progiem odleglosci do KONKRETNEGO koloru tla** (`sum(abs(a-bg)) < 60` na
DRUGI przebieg, zamiast `g>140 & g>r+30 & g>b+30`). Ekran chroma-key
(`~8,248,4`) i kirtel (`143,183,113`) dziela kierunek „G dominuje", ale ich
dystans do siebie to ~310 — dosc, zeby ciasny prog zlapal PRAWDZIWE resztki
czystej zieleni (odlegle o kilka-kilkanascie) i zostawil sukienke w spokoju.
**Wniosek na przyszlosc: jasne/pastelowe ubrania w zielonych/zoltych
odcieniach (limonka, oliwka, blady seledyn) trzeba sprawdzac PRZED
zbudowaniem tabeli — zawsze przez proboowanie surowych pikseli w srodku
duzej plamy koloru, nie tylko przez czytanie Countera na juz przycietej
klatce.**

── DLACZEGO WLOSY I BUTY DZIELA JEDNA RAMPE ────────────────────────────────
Warkocz biegnie catym bokiem sylwetki od czubka glowy do samego dolu (buty),
wiec te same zmierzone kolory wystepuja w y1-79 na 81-pikselowej klatce —
nie da sie ich rozdzielic po pozycji, bo to DOSLOWNIE ten sam material
(brazowa skora/wlos) w dwoch miejscach. Oba ida do `drewno`.

── TABELA (zmierzone kolory + rola po pozycji, patrz naglowek generatora) ──

    kontur              prawie czarny        -> neutralne (ciemny koniec)
    kirtel              jasna zielen         -> listowie (jasny koniec)
    wlosy/warkocz/buty  cieply braz          -> drewno
    skora     y6-47      brzoskwiniowa       -> WLASNA rampa (3 tony)
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

SRC = os.path.join(ASSETS, "dobrawa.png")
OUT = os.path.join(ASSETS, "characters", "dobrawa_portrait.png")

P = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))

# Wlasna rampa, poza paleta srodowiskowa — patrz naglowek.
SKORA = ["#f9ba96", "#d28363", "#b76c53"]

# Zmierzony kolor zrodlowy -> kolor docelowy. Kolejnosc bez znaczenia.
TABELA = {
    # kontur
    "#080713": P["neutralne"][0], "#0a0916": P["neutralne"][0],
    "#050a0d": P["neutralne"][0], "#0f0205": P["neutralne"][0],
    # kirtel (jasna, niebielona zielen) -> listowie
    "#8fb771": P["listowie"][4], "#92b872": P["listowie"][4],
    "#5d8d4c": P["listowie"][3], "#4e8143": P["listowie"][3],
    "#4b7d40": P["listowie"][3], "#47773e": P["listowie"][2],
    "#3f6d3e": P["listowie"][2], "#2c5b37": P["listowie"][1],
    "#244428": P["listowie"][0],
    # wlosy/warkocz/buty (jeden material w dwoch miejscach, patrz naglowek) -> drewno
    "#542f1c": P["drewno"][0], "#895536": P["drewno"][2],
    "#8d593b": P["drewno"][2], "#59321e": P["drewno"][1],
    "#442c23": P["drewno"][0], "#51372d": P["drewno"][1],
    # skora — wlasna rampa (3 tony), reszta antyaliasingu snapuje do nich
    "#f9ba96": SKORA[0], "#f7b792": SKORA[0], "#f5c8ac": SKORA[0], "#f9be9d": SKORA[0],
    "#d28363": SKORA[1], "#d58a6b": SKORA[1], "#e8a180": SKORA[1],
    "#b76c53": SKORA[2],
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
    """Zielone tlo zdejmowane DWA razy: flood-fill od krawedzi + CIASNY prog
    odleglosci na resztkach (nie heurystyka po nasyceniu — patrz naglowek:
    ta wersja zjadala kirtel, bo jego jasna zielen tez „dominuje w G")."""
    h, w, _ = a.shape
    bg = np.array([8, 248, 4])
    is_bg = np.abs(a - bg).sum(2) < 130
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
    still = np.abs(a - bg).sum(2) < 60
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
    # metoda co przy Agacie/Sobku/Witku: cel to ~1.1x wysokosci gracza (60px * 1.1 = 66px).
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

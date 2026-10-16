"""
Atlas `forrest` — finalny arkusz drzew lasu z zaakceptowanych stempli AI.

Uruchom:  python tools/build_forrest_atlas.py            (raport + podglad, NIC nie pisze)
          python tools/build_forrest_atlas.py --zapisz   (zapisuje public/assets/forrest.png
                                                          + docs/forrest_atlas.json)

── CZYM TEN ARKUSZ ROZNI SIE OD `Nature.png` ───────────────────────────────

`Nature.png` to arkusz 19 kolumn na SKOKU 33 px (kafel 32 + 1 px przerwy,
`spacing=1`). Tu skok jest rowny kaflowi: **kafel 32, spacing 0, margin 0,
pitch 32**. Decyzja autora przy tym etapie — nie odtwarzamy starego 1 px luzu.

Zrodlo pikseli: 31 gotowych stempli z `docs/art-review/trees/`, kazdy juz
wyciety, z binarna alfa (0/255), w rozmiarze bedacym wielokrotnoscia 32.
Skladanie jest CZYSTE — zero skalowania, zero resamplingu, kafel wpada 1:1.

── KONTRAKT Z MAPA ────────────────────────────────────────────────────────

`SPRITES` (nizej) jest kontraktem: id kafla = `wiersz * COLS + kolumna`
w ukladzie tego arkusza, GID w mapie = `firstgid + id`. Przesuniecie wpisu
przenumerowuje id — mapa zaczyna rysowac polowki innych drzew, po cichu.
Dokladanie na KONCU (nowe kolumny w wolnych miejscach, nowe wiersze) nie
rusza nic istniejacego.

`REMAP` mapuje stare drzewa proceduralne (`tools/build_drzewa.py`, arkusz
`Nature`) na nowe — sluzy do przepiecia warstw `trees-base`/`trees-over`
w `forrest.tmj`. Ksztalty kafli sie zgadzaja (3x3->3x3, 2x3->2x3, 2x2->2x2,
1x2->1x2), wiec przepiecie zachowuje podkafel (c,r).
"""

import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))
TREES = os.path.join(DOCS, "art-review", "trees")

T = 32
COLS = 19                      # szerokosc arkusza w kaflach
FIRSTGID = 530                 # po tilesecie `Znaki` (firstgid 514, 16 kafli) w forrest.tmj
OUT_PNG = os.path.join(ASSETS, "forrest.png")
OUT_MANIFEST = os.path.join(DOCS, "forrest_atlas.json")

# ── UKLAD ARKUSZA ──────────────────────────────────────────────────────────
#   nazwa                 plik                              kafle   lewy-gorny (kol, wiersz)
SPRITES = [
    # duze 3x3 (96x96) i 2x3 (64x96) — wiersze 0-2
    ("dab_duzy_new",       "dab_duzy_new-96x96.png",         3, 3,  0, 0),
    ("dab_duzy2_new",      "dab_duzy2_new-96x96.png",        3, 3,  3, 0),
    ("buk_duzy_new",       "buk_duzy_new-96x96.png",         3, 3,  6, 0),
    ("swierk_duzy_new",    "swierk_duzy_new-64x96.png",      2, 3,  9, 0),
    ("swierk_duzy2_new",   "swierk_duzy2_new-64x96.png",     2, 3, 11, 0),
    ("swierk_duzy3_new",   "swierk_duzy3_new-64x96.png",     2, 3, 13, 0),
    ("brzoza_duza_new",    "brzoza_duza_new-64x96.png",      2, 3, 15, 0),
    ("brzoza_duza2_new",   "brzoza_duza2_new-64x96.png",     2, 3, 17, 0),
    # duze 2x3 c.d. — wiersze 3-5
    ("brzoza_duza3_new",   "brzoza_duza3_new-64x96.png",     2, 3,  0, 3),
    ("grab_duzy_new",      "grab_duzy_new-64x96.png",        2, 3,  2, 3),
    ("grab_duzy2_new",     "grab_duzy2_new-64x96.png",       2, 3,  4, 3),
    ("grab_duzy3_new",     "grab_duzy3_new-64x96.png",       2, 3,  6, 3),
    ("olcha_duza_new",     "olcha_duza_new-64x96.png",       2, 3,  8, 3),
    ("olcha_duza2_new",    "olcha_duza2_new-64x96.png",      2, 3, 10, 3),
    ("olcha_duza3_new",    "olcha_duza3_new-64x96.png",      2, 3, 12, 3),
    # srednie 2x2 (64x64) — wiersze 6-7
    ("dab_sredni_new",     "dab_sredni_new-64x64.png",       2, 2,  0, 6),
    ("buk_sredni_new",     "buk_sredni_new-64x64.png",       2, 2,  2, 6),
    ("swierk_sredni_new",  "swierk_sredni_new-64x64.png",    2, 2,  4, 6),
    ("brzoza_srednia_new", "brzoza_srednia_new-64x64.png",   2, 2,  6, 6),
    ("brzoza_srednia2_new","brzoza_srednia2_new-64x64.png",  2, 2,  8, 6),
    ("grab_sredni_new",    "grab_sredni_new-64x64.png",      2, 2, 10, 6),
    ("grab_sredni2_new",   "grab_sredni2_new-64x64.png",     2, 2, 12, 6),
    ("olcha_srednia_new",  "olcha_srednia_new-64x64.png",    2, 2, 14, 6),
    ("olcha_srednia2_new", "olcha_srednia2_new-64x64.png",   2, 2, 16, 6),
    # male 1x2 (32x64) — wiersze 8-9
    ("dab_maly_new",       "dab_maly_new-32x64.png",         1, 2,  0, 8),
    ("buk_maly_new",       "buk_maly_new-32x64.png",         1, 2,  1, 8),
    ("swierk_maly_new",    "swierk_maly_new-32x64.png",      1, 2,  2, 8),
    ("swierk_maly2_new",   "swierk_maly2_new-32x64.png",     1, 2,  3, 8),
    ("brzoza_mala_new",    "brzoza_mala_new-32x64.png",      1, 2,  4, 8),
    ("grab_maly_new",      "grab_maly_new-32x64.png",        1, 2,  5, 8),
    ("olcha_mala_new",     "olcha_mala_new-32x64.png",       1, 2,  6, 8),
]

# ── PRZEPIECIE STAREGO KATALOGU `Nature` (build_drzewa.py DRZEWA) NA NOWY ────
# stare drzewo (arkusz Nature) -> nowe drzewo (ten arkusz). Odwzorowanie po
# kolejnosci wariantow; ksztalt kafla identyczny, wiec przepiecie zachowuje (c,r).
REMAP = {
    "dab_duzy":       "dab_duzy_new",
    "dab_duzy2":      "dab_duzy2_new",
    "buk_duzy":       "buk_duzy_new",
    "swierk_duzy":    "swierk_duzy_new",
    "swierk_duzy2":   "swierk_duzy2_new",
    "brzoza_duza":    "brzoza_duza_new",
    "brzoza_duza2":   "brzoza_duza2_new",
    "grab_duzy":      "grab_duzy_new",
    "dab_sredni":     "dab_sredni_new",
    "swierk_sredni":  "swierk_sredni_new",
    "brzoza_srednia": "brzoza_srednia_new",
    "buk_sredni":     "buk_sredni_new",
    "grab_sredni":    "grab_sredni_new",
    "dab_maly":       "dab_maly_new",
    "swierk_maly":    "swierk_maly_new",
    "brzoza_mala":    "brzoza_mala_new",
    "buk_maly":       "buk_maly_new",
    "grab_maly":      "grab_maly_new",
}

# Stary katalog Nature — lewy-gorny kafel (kol, wiersz) i rozmiar, z build_drzewa.py.
NATURE_COLS = 19
NATURE_DRZEWA = [
    ("dab_duzy", 3, 3, 0, 2), ("dab_duzy2", 3, 3, 3, 2), ("buk_duzy", 3, 3, 6, 2),
    ("swierk_duzy", 2, 3, 9, 2), ("swierk_duzy2", 2, 3, 11, 2),
    ("brzoza_duza", 2, 3, 13, 2), ("brzoza_duza2", 2, 3, 15, 2), ("grab_duzy", 2, 3, 17, 2),
    ("dab_sredni", 2, 2, 0, 5), ("swierk_sredni", 2, 2, 2, 5), ("brzoza_srednia", 2, 2, 4, 5),
    ("buk_sredni", 2, 2, 6, 5), ("grab_sredni", 2, 2, 8, 5),
    ("dab_maly", 1, 2, 10, 5), ("swierk_maly", 1, 2, 11, 5), ("brzoza_mala", 1, 2, 12, 5),
    ("buk_maly", 1, 2, 13, 5), ("grab_maly", 1, 2, 14, 5),
]
NATURE_FIRSTGID = 229

# ── KOLIZJA: przeniesienie 1:1 z tilesetu `Nature` w forrest.tmj ────────────
# 28 skrzynek pnia z `forrest.tmj` (Step 1A). Klucz: lokalny id kafla w Nature.
# Wartosc: box {x,y,width,height} w pikselach lokalnych kafla. Przenosimy je
# BEZ ZMIAN na odpowiadajacy podkafel nowego drzewa (decyzja autora: opcja (a),
# footprint kolizji bez zmian). Boxy sa standardowe wg szerokosci stempla —
# public/assets/README.md "Gdzie w dolnym rzedzie faktycznie siedzi pien".
NATURE_KOLIZJE = {
    77: dict(x=8, y=17, width=16, height=15),   # dab_duzy    [1,2]
    80: dict(x=8, y=17, width=16, height=15),   # dab_duzy2   [1,2]
    83: dict(x=8, y=17, width=16, height=15),   # buk_duzy    [1,2]
    85: dict(x=24, y=19, width=8, height=13), 86: dict(x=0, y=19, width=8, height=13),   # swierk_duzy   [0,2][1,2]
    87: dict(x=24, y=19, width=8, height=13), 88: dict(x=0, y=19, width=8, height=13),   # swierk_duzy2
    89: dict(x=24, y=19, width=8, height=13), 90: dict(x=0, y=19, width=8, height=13),   # brzoza_duza
    91: dict(x=24, y=19, width=8, height=13), 92: dict(x=0, y=19, width=8, height=13),   # brzoza_duza2
    93: dict(x=24, y=19, width=8, height=13), 94: dict(x=0, y=19, width=8, height=13),   # grab_duzy
    114: dict(x=24, y=19, width=8, height=13), 115: dict(x=0, y=19, width=8, height=13), # dab_sredni    [0,1][1,1]
    116: dict(x=24, y=19, width=8, height=13), 117: dict(x=0, y=19, width=8, height=13), # swierk_sredni
    118: dict(x=24, y=19, width=8, height=13), 119: dict(x=0, y=19, width=8, height=13), # brzoza_srednia
    120: dict(x=24, y=19, width=8, height=13), 121: dict(x=0, y=19, width=8, height=13), # buk_sredni
    122: dict(x=24, y=19, width=8, height=13), 123: dict(x=0, y=19, width=8, height=13), # grab_sredni
    124: dict(x=9, y=19, width=14, height=13), # dab_maly    [0,1]
    125: dict(x=9, y=19, width=14, height=13), # swierk_maly
    126: dict(x=9, y=19, width=14, height=13), # brzoza_mala
    127: dict(x=9, y=19, width=14, height=13), # buk_maly
    128: dict(x=9, y=19, width=14, height=13), # grab_maly
}


def sprite_pos():
    """{nazwa: (col0, row0, cols, rows)} — pozycja kazdego stempla w arkuszu."""
    return {n: (c0, r0, cx, cy) for n, _fn, cx, cy, c0, r0 in SPRITES}


def remap_gid_table():
    """{stary_gid_Nature: nowy_gid_forrest} dla warstw trees-base/trees-over."""
    pos = sprite_pos()
    out = {}
    for sname, scx, scy, sc0, sr0 in NATURE_DRZEWA:
        if sname not in REMAP:
            continue
        tc0, tr0, _, _ = pos[REMAP[sname]]
        for r in range(scy):
            for c in range(scx):
                old_gid = NATURE_FIRSTGID + (sr0 + r) * NATURE_COLS + (sc0 + c)
                new_gid = FIRSTGID + (tr0 + r) * COLS + (tc0 + c)
                out[old_gid] = new_gid
    return out


def forrest_collision_tiles():
    """Lista {id, box} — 28 skrzynek pnia przeniesionych 1:1 z Nature na
    odpowiadajacy podkafel nowego drzewa. `id` = lokalny id kafla w arkuszu
    `forrest`. Sortowana rosnaco po id (jak w forrest.tmj)."""
    pos = sprite_pos()
    # lokalny id Nature -> (nazwa_starego_drzewa, (sub_c, sub_r))
    nat_sub = {}
    for sname, scx, scy, sc0, sr0 in NATURE_DRZEWA:
        for r in range(scy):
            for c in range(scx):
                nat_sub[(sr0 + r) * NATURE_COLS + (sc0 + c)] = (sname, (c, r))
    tiles = []
    for nat_local, box in NATURE_KOLIZJE.items():
        sname, (c, r) = nat_sub[nat_local]
        tc0, tr0, _, _ = pos[REMAP[sname]]
        new_local = (tr0 + r) * COLS + (tc0 + c)
        tiles.append({"id": new_local, "box": dict(box), "z_nature": nat_local,
                      "drzewo": REMAP[sname], "sub": [c, r]})
    return sorted(tiles, key=lambda t: t["id"])


def _layout():
    by_name = {}
    used = {}
    errs = []
    rows_needed = 0
    for name, fn, cx, cy, c0, r0 in SPRITES:
        rows_needed = max(rows_needed, r0 + cy)
        if c0 + cx > COLS:
            errs.append(f"{name}: wychodzi poza {COLS} kolumn (c0={c0}, cx={cx})")
        for r in range(cy):
            for c in range(cx):
                cell = (c0 + c, r0 + r)
                if cell in used:
                    errs.append(f"{name}: nachodzi na {used[cell]} w kaflu {cell}")
                used[cell] = name
        by_name[name] = dict(file=fn, cols=cx, rows=cy, col0=c0, row0=r0,
                             local0=r0 * COLS + c0, gid0=FIRSTGID + r0 * COLS + c0)
    return by_name, errs, rows_needed


def _load_sprite(fn, cx, cy):
    """Wczytuje stempel i WYMUSZA standard arkusza: alfa binarna (>=128 -> 255,
    inaczej 0), RGB wyzerowane pod przezroczystoscia. Wieksze stempli byly juz
    ciete do tego standardu; kilka wczesniejszych (buk) ma jeszcze antyalias na
    krawedzi albo kolor pod alfa 0 — progujemy je tutaj, tak samo jak reszte,
    zeby arkusz byl wewnetrznie spojny. `problems` zwraca CO zostalo poprawione
    (do raportu) oraz bledy nieusuwalne progowaniem (zly rozmiar)."""
    p = os.path.join(TREES, fn)
    im = Image.open(p).convert("RGBA")
    a = np.array(im)
    problems = []
    if im.size != (cx * T, cy * T):
        problems.append(f"BLAD rozmiar {im.size}, oczekiwano {(cx * T, cy * T)}")

    alv = set(np.unique(a[:, :, 3]).tolist())
    if not alv <= {0, 255}:
        n_mid = int(((a[:, :, 3] > 0) & (a[:, :, 3] < 255)).sum())
        problems.append(f"znormalizowano alfe do 0/255 ({n_mid} px posrednich)")
    mask = a[:, :, 3] >= 128
    a[:, :, 3] = np.where(mask, 255, 0).astype(np.uint8)

    trans = ~mask
    if trans.any() and a[trans][:, :3].max() > 0:
        n_col = int((trans & (a[:, :, :3].max(axis=2) > 0)).sum())
        problems.append(f"wyzerowano RGB pod alfa 0 ({n_col} px z kolorem)")
    a[trans] = (0, 0, 0, 0)
    return a, problems


def build():
    by_name, errs, rows_needed = _layout()
    if errs:
        print("== UKLAD ARKUSZA: BLAD ==")
        for e in errs:
            print("   ", e)
        return None, None

    H = rows_needed * T
    W = COLS * T
    ark = np.zeros((H, W, 4), np.uint8)
    manifest = {
        "opis": "Atlas drzew lasu. id kafla = wiersz*%d + kolumna; GID w mapie = firstgid + id."
                % COLS,
        "png": "public/assets/forrest.png",
        "tile": T, "columns": COLS, "rows": rows_needed,
        "spacing": 0, "margin": 0,
        "firstgid_w_forrest_tmj": FIRSTGID,
        "sprites": {}, "remap_z_nature": {},
    }
    all_problems = []
    print("== SKLADANIE ==  arkusz %dx%d (%d wierszy x %d kolumn), pitch %d" % (W, H, rows_needed, COLS, T))
    for name, fn, cx, cy, c0, r0 in SPRITES:
        a, problems = _load_sprite(fn, cx, cy)
        for p in problems:
            all_problems.append(f"{name}: {p}")
        h = min(a.shape[0], cy * T)
        w = min(a.shape[1], cx * T)
        ark[r0 * T:r0 * T + h, c0 * T:c0 * T + w] = a[:h, :w]
        info = by_name[name]
        subtiles = {}
        for r in range(cy):
            for c in range(cx):
                lid = (r0 + r) * COLS + (c0 + c)
                subtiles["%d,%d" % (c, r)] = {"local": lid, "gid": FIRSTGID + lid}
        manifest["sprites"][name] = {
            "file": "docs/art-review/trees/" + fn,
            "cols": cx, "rows": cy,
            "col0": c0, "row0": r0,
            "local0": info["local0"], "gid0": info["gid0"],
            "subtiles": subtiles,
        }
        print("  %-20s -> kol %2d-%2d wiersz %d-%d  local %3d  gid %3d"
              % (name, c0, c0 + cx - 1, r0, r0 + cy - 1, info["local0"], info["gid0"]))

    if all_problems:
        print("\n== ZRODLA: co poprawiono / bledy ==")
        for p in all_problems:
            print("   ", p)
        manifest["uwagi_zrodla"] = all_problems
        if any("BLAD" in p for p in all_problems):
            print("\n== SA BLEDY NIEUSUWALNE — nic nie zapisano ==")
            return None, None

    # ── przepiecie starego katalogu ──
    print("\n== REMAP  Nature (stare) -> forrest (nowe) ==")
    for sname, scx, scy, sc0, sr0 in NATURE_DRZEWA:
        if sname not in REMAP:
            continue
        tname = REMAP[sname]
        t = by_name[tname]
        pairs = []
        for r in range(scy):
            for c in range(scx):
                old_local = (sr0 + r) * NATURE_COLS + (sc0 + c)
                old_gid = NATURE_FIRSTGID + old_local
                new_local = (t["row0"] + r) * COLS + (t["col0"] + c)
                new_gid = FIRSTGID + new_local
                pairs.append({"sub": [c, r], "old_gid": old_gid, "new_gid": new_gid})
        manifest["remap_z_nature"][sname] = {"na": tname, "kafle": pairs}
        print("  %-15s -> %-20s  gid %d..%d -> %d..%d"
              % (sname, tname, pairs[0]["old_gid"], pairs[-1]["old_gid"],
                 pairs[0]["new_gid"], pairs[-1]["new_gid"]))

    # ── kolizja: 28 skrzynek pnia przeniesionych 1:1 ──
    kt = forrest_collision_tiles()
    manifest["kolizja_tiles"] = [
        {"id": t["id"], "gid": FIRSTGID + t["id"], "z_nature_local": t["z_nature"],
         "drzewo": t["drzewo"], "sub": t["sub"], "box": t["box"]} for t in kt]
    print("\n== KOLIZJA  (28 skrzynek pnia, przeniesione 1:1 z Nature) ==")
    for t in kt:
        print("  Nature local %3d -> forrest local %3d (gid %3d)  %-18s sub %s  box %s"
              % (t["z_nature"], t["id"], FIRSTGID + t["id"], t["drzewo"], t["sub"], t["box"]))

    return ark, manifest


def preview(ark, path):
    im = Image.fromarray(ark)
    big = im.resize((im.size[0] * 3, im.size[1] * 3), Image.NEAREST)
    # szachownica pod przezroczystoscia, zeby bylo widac ksztalty
    bg = Image.new("RGBA", big.size, (0, 0, 0, 255))
    for y in range(0, big.size[1], 24):
        for x in range(0, big.size[0], 24):
            if (x // 24 + y // 24) % 2:
                for yy in range(y, min(y + 24, big.size[1])):
                    for xx in range(x, min(x + 24, big.size[0])):
                        bg.putpixel((xx, yy), (40, 40, 40, 255))
    bg.alpha_composite(big)
    bg.save(path)
    print("\npodglad -> %s" % path)


def main(zapisz, podglad_p):
    ark, manifest = build()
    if ark is None:
        return
    preview(ark, podglad_p)
    if zapisz:
        Image.fromarray(ark).save(OUT_PNG)
        with open(OUT_MANIFEST, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=1, ensure_ascii=False)
        print("\n== ZAPIS ==")
        print("  %s  %dx%d" % (OUT_PNG, ark.shape[1], ark.shape[0]))
        print("  %s  (%d sprite'ow, %d wpisow remap)"
              % (OUT_MANIFEST, len(manifest["sprites"]), len(manifest["remap_z_nature"])))
    else:
        print("\nNic nie zapisano. Uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Sklada atlas `forrest` z zaakceptowanych stempli drzew.")
    ap.add_argument("--zapisz", action="store_true",
                    help="zapisz public/assets/forrest.png + docs/forrest_atlas.json")
    ap.add_argument("--podglad", default=os.path.join(TU, "podglad_forrest_atlas.png"))
    a = ap.parse_args()
    main(a.zapisz, a.podglad)

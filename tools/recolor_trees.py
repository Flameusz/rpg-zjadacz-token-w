"""Ujednolicenie palety drzew lasu -> jeden biom, gatunki nadal rozpoznawalne.

Uruchom:  python tools/recolor_trees.py            (testy + podglady, NIC nie pisze)
          python tools/recolor_trees.py --zapisz <gatunek> <wariant>
                                                 (np. --zapisz dab BALANCED)

── PODEJSCIE (to samo co pierwszy pass debu) ─────────────────────────────
Per-piksel korekta HSV, LUT po unikalnych kolorach sprite'a (~60-70 szt.).
- korekta HUE (ku zieleni rodziny) i SATURATION (w dol),
- VALUE ZOSTAJE NIETKNIETE -> struktura swiatlo/polcien/cien zachowana,
- mapowanie ciagle i ~monotoniczne -> zaden kolor nie zlewa sie z sasiadem,
- zero: posterize / downscale / upscale / blur / sharpen / dithering / AI /
  re-pixel. Sylwetka, pien, galezie, rozdzielczosc, liczba wariantow bez zmian.

── RODZINA LASU (audyt: scratchpad/tree_palette_audit.py) ────────────────
Odniesienie = swierk + grab + olcha (juz czytaja sie jako jeden biom).
Pasma zieleni po value (shadow / mid / light), mediana:
        hue ~164 / 131 / 85      sat ~0.81 / 0.62 / 0.70

Odchylenia gatunkow (Δ do rodziny, pasmo mid / light):
  swierk grab olcha : w rodzinie                             -> LEAVE
  buk    : val +0.21/+0.29 (jasna korona, CHRONIONA),
           hue -8/-6, sat +0.08/+0.03                        -> SUBTLE (hue+sat, val bez zmian)
  brzoza : hue -36/-11 (mocno zolta), sat/val ok             -> SUBTLE (sam hue)
  dab    : sat +0.19/+0.24 (przesycony w kazdym pasmie),
           hue -9/-9 (zolty)                                  -> BALANCED / MID

── WARIANTY DEBU ────────────────────────────────────────────────────────
  SUBTLE   hue_pull 0.45  sat_scale 0.86   (sat ~0.78)
  MID      hue_pull 0.60  sat_scale 0.82   (sat ~0.75, hue jasnych ~108) <- prosba autora
  BALANCED hue_pull 0.75  sat_scale 0.78   (sat ~0.71, ~rodzina)
"""
import argparse
import colorsys
import os

import numpy as np
from PIL import Image

TR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "docs", "art-review", "trees"))

# sprite'y w atlasie forrest (docs/forrest_atlas.json), per gatunek
ATLAS = {
    "dab": ["dab_duzy_new-96x96.png", "dab_duzy2_new-96x96.png",
            "dab_sredni_new-64x64.png", "dab_maly_new-32x64.png"],
    "buk": ["buk_duzy_new-96x96.png", "buk_sredni_new-64x64.png", "buk_maly_new-32x64.png"],
    "brzoza": ["brzoza_duza_new-64x96.png", "brzoza_duza2_new-64x96.png", "brzoza_duza3_new-64x96.png",
               "brzoza_srednia_new-64x64.png", "brzoza_srednia2_new-64x64.png", "brzoza_mala_new-32x64.png"],
    "swierk": ["swierk_duzy_new-64x96.png", "swierk_duzy2_new-64x96.png", "swierk_duzy3_new-64x96.png",
               "swierk_sredni_new-64x64.png", "swierk_maly_new-32x64.png", "swierk_maly2_new-32x64.png"],
    "grab": ["grab_duzy_new-64x96.png", "grab_duzy2_new-64x96.png", "grab_duzy3_new-64x96.png",
             "grab_sredni_new-64x64.png", "grab_sredni2_new-64x64.png", "grab_maly_new-32x64.png"],
    "olcha": ["olcha_duza_new-64x96.png", "olcha_duza2_new-64x96.png", "olcha_duza3_new-64x96.png",
              "olcha_srednia_new-64x64.png", "olcha_srednia2_new-64x64.png", "olcha_mala_new-32x64.png"],
}

# profile korekty. sat_floor: nie schodz ponizej src_sat * floor (chron cien).
# trunk_compress: kompresja kontrastu pnia ku jego medianie (0 = nie ruszaj).
PROFILES = {
    "dab": {
        "SUBTLE":   dict(target_hue=112, hue_pull=0.45, sat_scale=0.86, sat_floor=0.62, trunk_compress=0.10),
        "MID":      dict(target_hue=112, hue_pull=0.60, sat_scale=0.82, sat_floor=0.62, trunk_compress=0.14),
        "BALANCED": dict(target_hue=112, hue_pull=0.75, sat_scale=0.78, sat_floor=0.60, trunk_compress=0.18),
    },
    "brzoza": {
        "SUBTLE":   dict(target_hue=116, hue_pull=0.35, sat_scale=1.00, sat_floor=1.00, trunk_compress=0.0),
    },
    "buk": {
        "SUBTLE":   dict(target_hue=118, hue_pull=0.30, sat_scale=0.93, sat_floor=0.80, trunk_compress=0.0),
    },
}

TRUNK_MID = {"dab": 0.32, "buk": 0.345, "brzoza": 0.282}  # mediana V pnia (audyt)


def recolor_rgba(arr, p, species):
    out = arr.copy()
    rgb = out[:, :, :3]
    alpha = out[:, :, 3]
    uniq = np.unique(rgb[alpha > 0].reshape(-1, 3), axis=0)
    tmid = TRUNK_MID.get(species, 0.30)
    lut = {}
    for c in uniq:
        r, g, b = (int(c[0]) / 255.0, int(c[1]) / 255.0, int(c[2]) / 255.0)
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        hd = h * 360.0
        nr, ng, nb = r, g, b
        if 50.0 < hd < 175.0 and s > 0.15:
            # ── zielen korony ──────────────────────────────────────────
            wsat = min(1.0, max(0.0, (s - 0.12) / 0.5))       # przygaszone piksele ledwo ruszamy
            th = p["target_hue"]
            hd2 = hd + (th - hd) * p["hue_pull"] * wsat if hd < th else hd
            hd2 = min(hd2, max(hd, th + 4.0))                 # nigdy nie przeskocz celu
            s2 = s * p["sat_scale"]
            s2 = max(s2, s * p["sat_floor"])
            nr, ng, nb = colorsys.hsv_to_rgb(hd2 / 360.0, s2, v)   # V bez zmian
        elif p["trunk_compress"] > 0 and (hd < 45.0 or hd > 330.0) and s > 0.13 and v < 0.78:
            # ── braz pnia: kompresja kontrastu ku medianie ─────────────
            v2 = v + (tmid - v) * p["trunk_compress"]
            nr, ng, nb = colorsys.hsv_to_rgb(h, s, v2)
        lut[tuple(int(x) for x in c)] = tuple(int(round(x * 255)) for x in (nr, ng, nb))

    flat = rgb.reshape(-1, 3)
    res = flat.copy()
    for src, dst in lut.items():
        res[np.all(flat == src, axis=1)] = dst
    out[:, :, :3] = res.reshape(rgb.shape)
    return out, len(lut)


def load(name):
    return np.array(Image.open(os.path.join(TR, name)).convert("RGBA"))


def zoom(im, k):
    return Image.fromarray(im).resize((im.shape[1] * k, im.shape[0] * k), Image.NEAREST)


def build_test(species, hero, variants):
    base = load(hero)
    ims = [("CURRENT", base)]
    for v in variants:
        rec, n = recolor_rgba(base, PROFILES[species][v], species)
        ims.append((v, rec))
        print(f"  {species}/{v}: LUT {n} kolorow")
    h, w = base.shape[:2]
    K, GAP = 5, 12
    strip = np.zeros((h * K, (w * K + GAP) * len(ims) - GAP, 4), np.uint8)
    for i, (_, im) in enumerate(ims):
        strip[:, i * (w * K + GAP): i * (w * K + GAP) + w * K] = np.array(zoom(im, K))
    fname = "oak_color_test.png" if species == "dab" else f"{species}_color_test.png"
    out = os.path.join(TR, fname)
    Image.fromarray(strip).save(out)
    print(f"  -> {out}   ({' | '.join(n for n, _ in ims)})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", nargs=2, metavar=("GATUNEK", "WARIANT"))
    a = ap.parse_args()

    if a.zapisz:
        sp, var = a.zapisz
        for name in ATLAS[sp]:
            arr = load(name)
            rec, n = recolor_rgba(arr, PROFILES[sp][var], sp)
            Image.fromarray(rec).save(os.path.join(TR, name))
            print(f"ZAPIS {name}  ({sp}/{var}, LUT {n})")
        print("\n[!] To nadpisalo sprite'y zrodlowe. Atlas forrest.png trzeba przebudowac:")
        print("   python tools/build_forrest_atlas.py --zapisz")
    else:
        print("oak_color_test — CURRENT | SUBTLE | MID | BALANCED")
        build_test("dab", "dab_duzy_new-96x96.png", ["SUBTLE", "MID", "BALANCED"])
        print("brzoza_color_test — CURRENT | SUBTLE")
        build_test("brzoza", "brzoza_duza_new-64x96.png", ["SUBTLE"])
        print("buk_color_test — CURRENT | SUBTLE")
        build_test("buk", "buk_duzy_new-96x96.png", ["SUBTLE"])
        print("\nPodglady w lesie: scratchpad/tree_forest_preview.py")

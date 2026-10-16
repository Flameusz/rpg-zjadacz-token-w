"""Przymiar wolnej przestrzeni lasu: czy stworzenia mają gdzie przejść i walczyć.

Uruchom:  python tools/forest_clearance.py [plik.tmj]     (raport; kod wyjścia 1 = BŁĄD)

Sam niczego nie zapisuje — to strażnik reguł rozstawu lasu z 2026-10-04
(`docs/decyzje/2026-10-04-rozstaw-lasu.md`). Przebiegnij go po KAŻDEJ ręcznej
zmianie drzew albo spawnów w Tiled: przesunięcie jednego pnia łamie te reguły
CICHO, gra dalej się wczytuje.

── REGUŁY (asercje) ────────────────────────────────────────────────────────

  1. ODSTĘP WE WNĘTRZU: dwa pnie poza pasem skraju (PAS_SKRAJU kafli od
     krawędzi mapy) stoją co najmniej ODSTEP_PNI px od siebie (środek–środek).
     Pień ma ~16 px, więc prześwit ≥ ~68 px — przejdzie niedźwiedź i Szary
     (48 px ciała). Pas skraju jest ścianą lasu i może być gęsty.
  2. POLANA POD SPAWNEM: wokół każdego spawnu wroga żaden PIEŃ nie stoi
     bliżej niż POLANA_SFORY (wilk, Szary — krążą na 96 px) albo POLANA px.
     Liczą się wyłącznie pnie: woda i brzeg przy spawnie są projektem
     (niedźwiedź przy brodzie, lis nad rzeką), nie przeszkodą do walki.

── RAPORT (bez asercji) ────────────────────────────────────────────────────

Wolne koło na chodliwym lądzie (odległość do pnia albo wody, siatka 8 px) —
miara „ile miejsca na walkę". Przed rozstawem: mediana 32 px, r ≥ 100 px na
9% lądu; po: 57 px i 16%.
"""
import json
import os
import re
import sys

import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TU = os.path.dirname(os.path.abspath(__file__))
RPG = os.path.normpath(os.path.join(TU, ".."))
DOMYSLNA = os.path.join(RPG, "public", "assets", "maps", "forrest.tmj")
MANIFEST = os.path.join(RPG, "src", "world", "TreeStampManifest.ts")

ODSTEP_PNI = 84        # px, środek–środek, we wnętrzu
PAS_SKRAJU = 3         # kafle od krawędzi mapy — ściana lasu, reguła 1 nie obowiązuje
POLANA_SFORY = 180     # px wolne od pni wokół wilka / Szarego
POLANA = 120           # px wolne od pni wokół pozostałych wrogów
SFORA = {"wolf", "greywolf"}
WROGOWIE = SFORA | {"boar", "bear", "spider", "venomspider", "deer", "fox", "rabbit"}


def stemple():
    tekst = open(MANIFEST, encoding="utf-8").read()
    wzor = re.compile(r"\{ id: (\d+), name: \"(\w+)\", w: (\d+), h: (\d+), "
                      r"trunk: \{ dx: (\d+), dy: (-?\d+), w: (\d+), h: (\d+) \} \}")

    def czytaj(blok):
        return {int(g[0]): dict(dx=int(g[4]), dy=int(g[5]), tw=int(g[6]), th=int(g[7]))
                for g in wzor.findall(blok)}

    i = tekst.index("TREE_STAMPS_BIG: readonly")
    return czytaj(tekst[:i]), czytaj(tekst[i:])


def wczytaj(plik):
    m = json.load(open(plik, encoding="utf-8"))
    W, H, T = m["width"], m["height"], m["tilewidth"]
    ts = {t["name"]: t for t in m["tilesets"]}
    male, duze = stemple()
    fg_m, fg_d = ts["TreeStamps"]["firstgid"], ts["TreeStampsBig"]["firstgid"]
    solid = set()
    for t in m["tilesets"]:
        for k in t.get("tiles", []):
            if any(p["name"] == "solid" and p["value"] is True for p in k.get("properties", [])):
                solid.add(t["firstgid"] + k["id"])
    blok = np.zeros((H, W), bool)
    for l in m["layers"]:
        if l["type"] == "tilelayer":
            blok |= np.isin(np.array(l["data"]).reshape(H, W) & 0x1FFFFFFF, list(solid))
    pnie = []
    for l in m["layers"]:
        if l["name"] != "trees":
            continue
        for o in l["objects"]:
            g = o["gid"] & 0x1FFFFFFF
            d = duze[g - fg_d] if g >= fg_d else male[g - fg_m]
            pnie.append((o["x"] + d["dx"], o["y"] + d["dy"], d["tw"], d["th"]))
    spawny = [(o["name"], o["x"], o["y"]) for l in m["layers"] if l["name"] == "objects"
              for o in l["objects"] if o["name"] in WROGOWIE]
    return W, H, T, blok, pnie, spawny


def main(plik):
    W, H, T, blok, pnie, spawny = wczytaj(plik)
    srodki = np.array([(x + w / 2, y + h / 2) for x, y, w, h in pnie])
    print(f"── {os.path.relpath(plik, RPG)}")
    print(f"mapa {W}×{H} kafli · drzew {len(pnie)} · na 100 kafli {100 * len(pnie) / (W * H):.1f}")

    # raport: wolne koło
    K = 8
    gw, gh = W * T // K, H * T // K
    zajete = np.kron(blok, np.ones((T // K, T // K), bool))[:gh, :gw].copy()
    for x, y, w, h in pnie:
        zajete[int(y // K):int((y + h) // K) + 1, int(x // K):int((x + w) // K) + 1] = True
    r = (ndimage.distance_transform_edt(~zajete) * K)[~zajete]
    print(f"wolne koło na chodliwym lądzie: mediana {np.median(r):.0f} px · "
          + " · ".join(f"r≥{v}: {100 * np.mean(r >= v):.0f}%" for v in (48, 80, 100, 130, 160)))

    bledy = 0
    # reguła 1
    skraj = PAS_SKRAJU * T
    wn = np.array([c for c in srodki if min(c[0], c[1], W * T - c[0], H * T - c[1]) >= skraj])
    if len(wn) > 1:
        d, idx = cKDTree(wn).query(wn, k=2)
        zle = np.nonzero(d[:, 1] < ODSTEP_PNI)[0]
        print(f"[1] odstęp pni we wnętrzu ≥ {ODSTEP_PNI} px: najmniejszy {d[:, 1].min():.1f} px · "
              f"par za blisko {len(zle) // 2 + len(zle) % 2}")
        for i in zle[:8]:
            print(f"     BŁĄD pień ({wn[i][0]:.0f}, {wn[i][1]:.0f}) ↔ "
                  f"({wn[idx[i, 1]][0]:.0f}, {wn[idx[i, 1]][1]:.0f}) = {d[i, 1]:.0f} px")
        bledy += len(zle)

    # reguła 2
    kd = cKDTree(srodki)
    zle2 = 0
    opisy = []
    for nazwa, x, y in spawny:
        prog = POLANA_SFORY if nazwa in SFORA else POLANA
        dist, _ = kd.query((x, y))
        opisy.append(f"{nazwa} {dist:.0f}")
        if dist < prog:
            zle2 += 1
            print(f"     BŁĄD {nazwa} ({x:.0f}, {y:.0f}): najbliższy pień {dist:.0f} px < {prog}")
    print(f"[2] polana pod spawnem (pień ≥ {POLANA_SFORY}/{POLANA} px): naruszeń {zle2}")
    print("    odległość do pnia: " + ", ".join(opisy))
    bledy += zle2

    print("✅ BŁĘDÓW: 0" if not bledy else f"⛔ BŁĘDÓW: {bledy}")
    return 1 if bledy else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else DOMYSLNA))

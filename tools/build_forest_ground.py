"""
Lesna wersja podloza -> public/assets/forest_ground.png

Uruchom:  python tools/build_forest_ground.py            (podglad + raport, NIC nie pisze)
          python tools/build_forest_ground.py --zapisz   (zapisuje forest_ground.png)
          python tools/build_forest_ground.py --wariant B (druga, lagodniejsza rampa)

── CO TO JEST ─────────────────────────────────────────────────────────────

6 ISTNIEJACYCH kafli trawy z `Teren.png` (local 0-5), TYLKO PRZEKOLOROWANYCH,
tak zeby bazowa zielen runa pasowala tonalnie do zaakceptowanych nowych drzew
w `docs/art-review/trees/`.

⚠ To NIE jest nowa grafika. Ksztalt, pozycje i liczba pikseli kepek trawy sa
BEZ ZMIAN — to czyste mapowanie 5 kolorow. Trawa `Teren` uzywa dokladnie rampy
`trawa` z `docs/paleta.json` (#195736 #297535 #4c923d #81b056 #bbce72), nic
wiecej; podmieniamy te 5 wartosci.

── SKAD NOWA RAMPA ────────────────────────────────────────────────────────

Z RELACJI kolorystycznej nowych drzew (nie z jednego koloru). Zieleń koron
zebrana z 14 stempli drzew, uszeregowana po luminancji, dala rampe:
  #062421(cien teal) #0c3627 #1c4c27 #366623 #5e8922 #9bba2f(jasny lisc)

Nowa rampa runa = ta rampa DRZEW przepróbkowana po luminancji, z baza
przesunieta w gore (oswietlone runo w tej samej rodzinie, nie cien pod
korona). Wariant A ciagnie mocniej ku drzewom, B lagodniej.

Jesli tileset wejdzie na stale -> rampa `runo` powinna dojsc do paleta.json
przez gen_palette.py.
"""

import argparse
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
TEREN = os.path.join(ASSETS, "Teren.png")
OUT = os.path.join(ASSETS, "forest_ground.png")

T, P = 32, 33                                        # kafel 32, skok 33 w Teren.png
NCOL = 6

# stara rampa `trawa` (0 najciemniejszy .. 4 najjasniejszy) — to jedyne 5
# kolorow, jakie maja kafle trawy Teren local 0-5.
OLD = ["#195736", "#297535", "#4c923d", "#81b056", "#bbce72"]

# A / B — pierwsze dwa kierunki (patrz naglowek).
# C — zaakceptowany wariant srodkowy: A z baza (stopien 2) minimalnie chlodniejsza
#     i mniej oliwkowa (#548022 -> #50802c).
# FINAL — C z minimalna korekta KEPEK (stopnie 3 i 4): mniej jaskrawe, mniej
#     zolte, blizej bazowej zieleni. Baza (2) i ciemna faktura (0,1) NIETKNIETE.
#     step3 #769c27 -> #6c962c  (hue 79->84, sat -4, lum -6)
#     step4 #9bba2f -> #87ae34  (hue 73->79, sat -5, lum -12; to sa najjasniejsze px)
NOWA = {
    "A":     ["#225226", "#376723", "#548022", "#769c27", "#9bba2f"],
    "B":     ["#275725", "#3f6e23", "#5e8922", "#82a62a", "#9bba2f"],
    "C":     ["#225226", "#376723", "#50802c", "#769c27", "#9bba2f"],
    "FINAL": ["#225226", "#376723", "#50802c", "#6c962c", "#87ae34"],
}
# domyslna nazwa pliku wyjsciowego per wariant
OUT_NAZWA = {"FINAL": "forest_ground_final.png"}


def _hx(s):
    return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))


def zbuduj(wariant):
    ter = np.array(Image.open(TEREN).convert("RGBA"))
    mapa = {_hx(o): _hx(n) for o, n in zip(OLD, NOWA[wariant])}
    ark = np.zeros((T, T * NCOL, 4), np.uint8)
    obce_total = 0
    for c in range(NCOL):
        tile = ter[0:T, c * P:c * P + T].copy()
        rgb = tile[:, :, :3]
        for oc, nc in mapa.items():
            rgb[np.all(rgb == oc, axis=2)] = nc
        widziane = set(map(tuple, rgb[tile[:, :, 3] > 0].reshape(-1, 3).tolist()))
        obce = widziane - set(mapa.values())
        obce_total += len(obce)
        if obce:
            print("  BLAD T%d: kolory spoza rampy `trawa`: %s" % (c, obce))
        ark[:, c * T:(c + 1) * T] = tile
    return ark, obce_total == 0


def raport(ark, wariant, ok):
    print("forest_ground.png  %dx%d  (%d kafli 32x32, spacing 0, margin 0)"
          % (T * NCOL, T, NCOL))
    print("wariant %s   %s  ->  %s" % (wariant, OLD, NOWA[wariant]))
    ter = np.array(Image.open(TEREN).convert("RGBA"))
    for c in range(NCOL):
        old = ter[0:T, c * P:c * P + T]
        new = ark[:, c * T:(c + 1) * T]
        # sprawdzenie tozsamosci ukladu: mapa indeksow starych == mapa nowych
        io = np.full((T, T), -1)
        for k, oc in enumerate(_hx(x) for x in OLD):
            io[np.all(old[:, :, :3] == oc, axis=2)] = k
        ino = np.full((T, T), -1)
        for k, nc in enumerate(_hx(x) for x in NOWA[wariant]):
            ino[np.all(new[:, :, :3] == nc, axis=2)] = k
        tozsame = np.array_equal(io, ino)
        detal = (io > 2).mean() * 100 + (io == 0).mean() * 100 + (io == 1).mean() * 100
        print("  local %d  uklad==Teren: %-5s  alfa %s  detal %.1f%%"
              % (c, tozsame, sorted(set(np.unique(new[:, :, 3]).tolist())), detal))
    print("WYNIK:", "OK" if ok else "BLAD")


def podglad(ark, wariant):
    im = Image.fromarray(ark)
    p = os.path.join(TU, "podglad_forest_ground.png")
    im.resize((ark.shape[1] * 12, ark.shape[0] * 12), Image.NEAREST).save(p)
    # przed / po
    ter = np.array(Image.open(TEREN).convert("RGBA"))
    cmp = np.zeros((T * 2 + 2, T * NCOL, 4), np.uint8)
    for c in range(NCOL):
        cmp[0:T, c * T:(c + 1) * T] = ter[0:T, c * P:c * P + T]
        cmp[T + 2:T * 2 + 2, c * T:(c + 1) * T] = ark[:, c * T:(c + 1) * T]
    Image.fromarray(cmp).resize((cmp.shape[1] * 12, cmp.shape[0] * 12), Image.NEAREST).save(
        p.replace(".png", "_przed_po.png"))
    print("podglad -> %s  (+ _przed_po.png: gora obecna Teren, dol wariant %s)" % (p, wariant))


def main(zapisz, wariant):
    ark, ok = zbuduj(wariant)
    raport(ark, wariant, ok)
    podglad(ark, wariant)
    out = os.path.join(ASSETS, OUT_NAZWA.get(wariant, "forest_ground.png"))
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.  (zapisalby do %s)" % os.path.basename(out))
        return
    if not ok:
        print("\nPrzerwano zapis — raport zglosil kolory spoza rampy.")
        return
    Image.fromarray(ark).save(out)
    print("\n-> %s  (wariant %s)" % (out, wariant))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Lesna wersja podloza: recolor 6 kafli trawy Teren.")
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--wariant", choices=["A", "B", "C", "FINAL"], default="FINAL")
    a = ap.parse_args()
    main(a.zapisz, a.wariant)

"""terrain_forest_transitions.png — kafle przejsciowe woda/piasek/sciezka z `Teren`
z WYBITA do alfa=0 wbudowana stara trawa. Mapa lasu (forrest.tmj) i od 2026-10-06
takze Zagaje (village-zagaje.tmj) — wies dostala lesny grunt (`ForestGround`), zeby
przejscie brama nie zmienialo swiata (decyzja autora: widok 3D ma „ogarniac" wies).

Uruchom:  python tools/build_terrain_forest_transitions.py            (raport, NIC nie pisze)
          python tools/build_terrain_forest_transitions.py --zapisz   (pisze PNG + manifest)

── DLACZEGO OSOBNY ARKUSZ, A NIE EDYCJA Teren.png ────────────────────────
`Teren.png` jest wspoldzielony przez forrest / thicket-gestwina / village-zagaje.
Wybicie alfy wprost zrobiloby dziury na mapach, ktore nie maja pelnej warstwy
trawy pod woda/sciezka (Gestwina). Ten arkusz podpinaja forrest.tmj i village-zagaje.tmj
— obie maja PELNA warstwe `ground`. ⚠ Zbior kafli jest SUMA obu map: kafel uzywany
tylko we wsi bylby w lesnym arkuszu przezroczysty i wies dostalaby dziury w drogach.

── REGULA (zero recoloru) ───────────────────────────────────────────────
piksel.RGB ∈ rampa `trawa` Teren {#195736 #297535 #4c923d #81b056 #bbce72} -> alfa 0
kazdy inny piksel -> bajt w bajt bez zmian (RGB i alfa).
Zadnego skalowania, filtrowania, re-pixelowania.

── UKLAD ───────────────────────────────────────────────────────────────
19 kolumn, pitch 32, spacing 0, margin 0. **local id IDENTYCZNE jak w Teren**
(kafel local N w tym arkuszu = kafel local N z Teren.png, tylko z alfa).
Dzieki temu remap w .tmj to czyste `gid += (726 - 1)` dla warstw water/sand/path.
Kafle nieuzywane przez forrest.tmj = w pelni przezroczyste.

── KOLIZJA ─────────────────────────────────────────────────────────────
`Teren` trzyma kolizje wody jako property `solid: true` (18 kafli, same wodne).
Manifest wypisuje te id -> wpis <tileset> w .tmj dostaje `tiles` z tym samym
property, klucz kolizji to `nazwaTilesetu#localId`, wiec logika 1:1.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
TEREN = os.path.join(ASSETS, "Teren.png")
TMJ = os.path.join(ASSETS, "maps", "forrest.tmj")
#: Inne mapy podpinajace ten arkusz — ich kafle tez musza byc w arkuszu.
TMJ_INNE = [os.path.join(ASSETS, "maps", "village-zagaje.tmj")]
OUT_PNG = os.path.join(ASSETS, "terrain_forest_transitions.png")
OUT_MAN = os.path.join(os.path.dirname(TU), "docs", "terrain_forest_transitions.json")

T = 32
SRC_PITCH = 33          # Teren.png ma 1 px spacing
COLS = 19               # jak Teren.png
FIRSTGID = 726          # po ForestGround (720, 6 kafli) w forrest.tmj

GRASS = [(25, 87, 54), (41, 117, 53), (76, 146, 61), (129, 176, 86), (187, 206, 114)]
LAYERS = ("water", "sand", "path")


def used_locals_and_solid():
    m = json.load(open(TMJ, encoding="utf-8"))
    teren = next(t for t in m["tilesets"] if t["name"] == "Teren")
    fg = teren["firstgid"]
    solid = set()
    for t in teren.get("tiles", []):
        props = {p["name"]: p["value"] for p in t.get("properties", [])}
        if props.get("solid") is True:
            solid.add(t["id"])
        assert "objectgroup" not in t, f"Teren local {t['id']} ma objectgroup — obsluz ksztalt!"
    tb = {l["name"]: l["data"] for l in m["layers"] if l.get("type") == "tilelayer"}
    # ⚠ Mapa po remapie (dzisiejsza) trzyma w tych warstwach gidy TEGO
    #   arkusza (>= FIRSTGID), mapa sprzed remapu — gidy `Teren`. Oba
    #   przypadki dają to samo lokalne id (2026-10-04: rozstaw lasu ×1,5
    #   potrzebował kafli blob, których stara mapa nie używała).
    used = {}
    for ln in LAYERS:
        used[ln] = sorted(set((g - FIRSTGID) if g >= FIRSTGID else (g - fg) for g in tb[ln] if g))
    for sciezka in TMJ_INNE:
        mi = json.load(open(sciezka, encoding="utf-8"))
        ids = {t["name"]: t["firstgid"] for t in mi["tilesets"]}
        ft, tt = ids.get("ForestTransitions"), ids.get("Teren")
        tbi = {l["name"]: l["data"] for l in mi["layers"] if l.get("type") == "tilelayer"}
        for ln in LAYERS:
            for g in tbi.get(ln, []):
                g &= 0x1FFFFFFF
                if not g:
                    continue
                lok = (g - ft) if ft and g >= ft else (g - tt)
                if lok not in used[ln]:
                    used[ln] = sorted(set(used[ln]) | {lok})
    allu = sorted(set(sum(used.values(), [])))
    return used, allu, sorted(x for x in allu if x in solid)


def punch(tile):
    out = tile.copy()
    rgb = out[:, :, :3]
    mask = np.zeros(rgb.shape[:2], bool)
    for gc in GRASS:
        mask |= np.all(rgb == gc, axis=2)
    out[mask, 3] = 0
    return out, int(mask.sum())


def build():
    used, allu, solid = used_locals_and_solid()
    ter = np.array(Image.open(TEREN).convert("RGBA"))
    nrows = max(allu) // COLS + 1
    sheet = np.zeros((nrows * T, COLS * T, 4), np.uint8)

    total_punch = 0
    per = []
    for lid in allu:
        r, c = divmod(lid, COLS)
        src = ter[r * SRC_PITCH:r * SRC_PITCH + T, c * SRC_PITCH:c * SRC_PITCH + T].copy()
        alp, n = punch(src)
        total_punch += n
        sheet[r * T:r * T + T, c * T:c * T + T] = alp
        kept = int((alp[:, :, 3] > 0).sum())
        rgb_same = np.array_equal(src[:, :, :3], alp[:, :, :3])
        per.append((lid, n, kept, rgb_same))

    return sheet, used, allu, solid, per, total_punch, nrows


def report(sheet, used, allu, solid, per, total_punch, nrows):
    print("terrain_forest_transitions.png  %dx%d  (%d kolumn, %d wierszy, spacing 0, pitch 32)"
          % (sheet.shape[1], sheet.shape[0], COLS, nrows))
    print("firstgid w forrest.tmj: %d   local id = jak w Teren   remap: gid += %d\n" % (FIRSTGID, FIRSTGID - 1))
    for ln in LAYERS:
        print("  %-6s uzywa %2d kafli: %s" % (ln, len(used[ln]), used[ln]))
    print("\n  local  trawa->alfa0   zostaje   RGB nietkniete   solid")
    all_rgb_ok = True
    for lid, n, kept, same in per:
        all_rgb_ok &= same
        print("  %4d   %8d   %7d   %-14s   %s"
              % (lid, n, kept, "TAK" if same else "!! NIE !!", "tak" if lid in solid else "-"))
    print("\n  RAZEM pikseli do alfa=0: %d" % total_punch)
    print("  wszystkie RGB nietkniete: %s" % ("TAK" if all_rgb_ok else "NIE — PRZERWA"))
    print("  solid (do <tiles> w .tmj, 1:1 z Teren): %s" % solid)
    return all_rgb_ok


def main(zapisz):
    sheet, used, allu, solid, per, total_punch, nrows = build()
    ok = report(sheet, used, allu, solid, per, total_punch, nrows)
    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    if not ok:
        print("\nPRZERWANO — jakis kafel ma zmienione RGB.")
        return
    Image.fromarray(sheet).save(OUT_PNG)
    man = {
        "opis": "Kafle przejsciowe woda/piasek/sciezka z Teren, stara trawa -> alfa 0. Tylko forrest.tmj.",
        "png": "public/assets/terrain_forest_transitions.png",
        "tile": T, "columns": COLS, "rows": nrows, "spacing": 0, "margin": 0,
        "firstgid_forrest_tmj": FIRSTGID,
        "local_id": "identyczne jak Teren.png",
        "remap_rule": "gid_new = gid_teren + %d  (warstwy water/sand/path)" % (FIRSTGID - 1),
        "used_locals": {k: v for k, v in used.items()},
        "all_locals": allu,
        "solid_locals": solid,
    }
    json.dump(man, open(OUT_MAN, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("\n-> %s" % OUT_PNG)
    print("-> %s" % OUT_MAN)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    main(ap.parse_args().zapisz)

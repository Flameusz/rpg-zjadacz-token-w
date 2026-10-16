# -*- coding: utf-8 -*-
"""
JEDNORAZOWA migracja drzew lasu: warstwy kafli `trees-base`/`trees-over`
→ jeden Tile Object na drzewo na warstwie obiektów `trees`.

⚠ Patrz `tools/CLAUDE.md`: domyślnie DRUKUJE RAPORT i nic nie zapisuje; zapis
wyłącznie pod `--zapisz`. Bezpieczny do skasowania po wykonaniu migracji.

CO ROBI (dokładnie, bez przeprojektowania layoutu):
1. Wykrywa instancje drzew w `trees-base`/`trees-over` — ta sama logika co
   `src/world/TreeInstanceExtractor.ts` (każdy kafel dolnego rzędu stempla =
   kotwica drzewa; walidacja względem pełnego odcisku sprite'a).
2. Dla każdej instancji pisze jeden tile-object na NOWEJ warstwie `trees`:
   `gid = firstgid(TreeStamps) + indeks_wariantu`, `x,y` tak dobrane, żeby
   wyrenderowane drzewo trafiło PIKSEL W PIKSEL tam, gdzie stały kafle.
3. Kasuje warstwy `trees-base` i `trees-over` (koniec podwójnego renderowania).
4. Dopina tileset `TreeStamps` na KOŃCU listy tilesetów (firstgid nie rusza
   niczego istniejącego — patrz `src/world/CLAUDE.md`).
5. Zapisuje OBIE kopie `.tmj` (`public/assets/forrest.tmj` i
   `public/assets/maps/forrest.tmj`) z właściwą dla każdej ścieżką obrazu.

Tileset `Forrest` (z 28 skrzynkami kolizji) ZOSTAJE nietknięty — nieużywany po
migracji, ale jego usunięcie przenumerowałoby ForestGround/ForestTransitions
i warstwę `ground`. Kolizja pni po migracji pochodzi z `TreeStampManifest`
(wyprowadzona z tego samego `docs/forrest_atlas.json`).
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS_JSON = ROOT / "docs/forrest_atlas.json"
TMJ_COPIES = [
    (ROOT / "public/assets/forrest.tmj", ""),        # obrazy w tym samym katalogu
    (ROOT / "public/assets/maps/forrest.tmj", "../"),  # obrazy o katalog wyżej
]

ATLAS_COLS = 19        # forrest.png = 608 px / 32
CELL = 96              # komórka arkusza stempli
STAMP_COLS = 8         # kolumn w tree_stamps.png (== TREE_STAMP_COLS)
BASE_LAYER = "trees-base"
OVER_LAYER = "trees-over"


def load_sprites():
    """Nazwa → (col0,row0,cols,rows), w KOLEJNOŚCI (== indeks wariantu w TreeStamps)."""
    data = json.loads(ATLAS_JSON.read_text(encoding="utf-8"))
    out = []
    for i, (name, sp) in enumerate(data["sprites"].items()):
        out.append((name, sp["col0"], sp["row0"], sp["cols"], sp["rows"], i))
    return out


def build_gid_lookup(sprites):
    """local_id → (name, cols, rows, c, r) — c,r = pozycja subkafla w sprite'cie."""
    lut = {}
    for (name, col0, row0, cols, rows, _idx) in sprites:
        for r in range(rows):
            for c in range(cols):
                local = (row0 + r) * ATLAS_COLS + (col0 + c)
                lut[local] = (name, cols, rows, c, r)
    return lut


def find_orphan_canopies(layers, firstgid, sprites, claimed):
    """Kafle `trees-over`, których żadna zwykła instancja nie objęła (kotwica
    całkowicie nadpisana / niepomalowana — „korona bez pnia", znany artefakt
    `public/assets/README.md`). Grupuje je po WYWNIOSKOWANEJ kotwicy stempla
    i zwraca po jednym pseudo-drzewie na grupę. UŻYWANE TYLKO pod `--orphans`."""
    from collections import defaultdict
    base = layers[BASE_LAYER]
    W, H = base["width"], base["height"]
    lut = build_gid_lookup(sprites)
    byname = {s[0]: s for s in sprites}
    groups = defaultdict(int)
    d = layers[OVER_LAYER]["data"]
    for i, v in enumerate(d):
        if not v:
            continue
        x, y = i % W, i // W
        if (OVER_LAYER, x, y) in claimed:
            continue
        info = lut.get(v - firstgid)
        if not info:
            continue
        name, cols, rows, c, r = info
        groups[(name, x - c, y - r)] += 1
    out = []
    for (name, ox, oy), _n in groups.items():
        _n2, _c0, _r0, cols, rows, idx = byname[name]
        out.append({
            "name": name, "x0": ox, "y0": oy, "cols": cols, "rows": rows,
            "matched": 0, "total": cols * rows, "variant_index": idx, "orphan": True,
        })
    out.sort(key=lambda t: (t["y0"], t["x0"], t["name"]))
    return out


def claimed_cells(instances, layers, firstgid, sprites):
    byname = {s[0]: s for s in sprites}
    base = layers[BASE_LAYER]
    W, H = base["width"], base["height"]
    claimed = set()
    for i in instances:
        _n, c0, r0, _cc, _rr, _idx = byname[i["name"]]
        for r in range(i["rows"]):
            for c in range(i["cols"]):
                ln = BASE_LAYER if r == i["rows"] - 1 else OVER_LAYER
                local = (r0 + r) * ATLAS_COLS + (c0 + c)
                x, y = i["x0"] + c, i["y0"] + r
                if 0 <= x < W and 0 <= y < H and layers[ln]["data"][y * W + x] == firstgid + local:
                    claimed.add((ln, x, y))
    return claimed


def extract_instances(layers, firstgid, sprites):
    """Port `extractTreeInstances` — zwraca listę dict(name,x0,y0,cols,rows,matched,total)."""
    base = layers[BASE_LAYER]
    W, H = base["width"], base["height"]

    def at(layer_name, x, y):
        if x < 0 or y < 0 or x >= W or y >= H:
            return 0
        return layers[layer_name]["data"][y * W + x]

    lut = build_gid_lookup(sprites)
    by_name = {s[0]: s for s in sprites}

    # 1) kandydaci: kafel na KTÓREJKOLWIEK warstwie, którego gid trafia w DOLNY
    #    rząd (r == rows-1) jakiegoś sprite'a. Klucz = (name, ox, oy).
    candidates = {}
    for lname in (BASE_LAYER, OVER_LAYER):
        d = layers[lname]["data"]
        for y in range(H):
            row = y * W
            for x in range(W):
                gid = d[row + x]
                if not gid:
                    continue
                info = lut.get(gid - firstgid)
                if not info:
                    continue
                name, cols, rows, c, r = info
                if r != rows - 1:
                    continue
                ox, oy = x - c, y - r
                candidates[(name, ox, oy)] = (name, ox, oy, cols, rows)

    # 2) walidacja: dla każdego kandydata policz, ile oczekiwanych kafli stoi.
    out = []
    for (name, ox, oy, cols, rows) in candidates.values():
        _n, col0, row0, _c, _r, idx = by_name[name]
        matched = 0
        total = cols * rows
        for r in range(rows):
            for c in range(cols):
                lname = BASE_LAYER if r == rows - 1 else OVER_LAYER
                local = (row0 + r) * ATLAS_COLS + (col0 + c)
                if at(lname, ox + c, oy + r) == firstgid + local:
                    matched += 1
        if matched == 0:
            continue
        out.append({
            "name": name, "x0": ox, "y0": oy, "cols": cols, "rows": rows,
            "matched": matched, "total": total, "variant_index": idx,
        })
    # deterministycznie: po pozycji
    out.sort(key=lambda t: (t["y0"], t["x0"], t["name"]))
    return out


def instance_to_object(inst, oid, treestamps_firstgid):
    """Tile-object tak, żeby wyrenderowane drzewo trafiło tam, gdzie stały kafle.

    W nowym rendererze (`TreeLayer`) drzewo jest w komórce 96×96 wyśrodkowane
    w poziomie i dosunięte do dołu; obiekt kotwiczy w LEWYM-DOLNYM rogu komórki.
    Stary stempel: lewa krawędź = x0*32, dolna (linia gruntu) = (y0+rows)*32,
    szerokość grafiki = cols*32.
    """
    w = inst["cols"] * 32
    ax = inst["x0"] * 32 - (CELL - w) // 2
    ay = (inst["y0"] + inst["rows"]) * 32
    return {
        "gid": treestamps_firstgid + inst["variant_index"],
        "height": CELL,
        "id": oid,
        "name": "tree",
        "opacity": 1,
        "rotation": 0,
        "type": "",
        "visible": True,
        "width": CELL,
        "x": ax,
        "y": ay,
    }


def treestamps_tileset(firstgid, image_prefix):
    # rozmiar arkusza z TREE_STAMP_SHEET (768×384); tilecount = 8*4
    return {
        "columns": STAMP_COLS,
        "firstgid": firstgid,
        "image": image_prefix + "tree_stamps.png",
        "imageheight": 384,
        "imagewidth": 768,
        "margin": 0,
        "name": "TreeStamps",
        "objectalignment": "bottomleft",
        "spacing": 0,
        "tilecount": STAMP_COLS * 4,
        "tileheight": CELL,
        "tilewidth": CELL,
    }


def migrate_one(path, image_prefix, sprites, save, with_orphans):
    m = json.loads(path.read_text(encoding="utf-8"))
    layers_by_name = {l["name"]: l for l in m["layers"]}
    if BASE_LAYER not in layers_by_name:
        print(f"  {path.name}: brak warstwy {BASE_LAYER} — pominięte (już zmigrowane?)")
        return None

    forrest_ts = next(t for t in m["tilesets"] if t["name"] == "Forrest")
    firstgid = forrest_ts["firstgid"]

    instances = extract_instances(layers_by_name, firstgid, sprites)
    n_anchored = len(instances)
    orphans = []
    if with_orphans:
        claimed = claimed_cells(instances, layers_by_name, firstgid, sprites)
        orphans = find_orphan_canopies(layers_by_name, firstgid, sprites, claimed)
        instances = instances + orphans

    # firstgid nowego tilesetu = na końcu listy
    last = max(m["tilesets"], key=lambda t: t["firstgid"])
    ts_firstgid = last["firstgid"] + last["tilecount"]

    # obiekty
    max_oid = m.get("nextobjectid", 1)
    for l in m["layers"]:
        for o in l.get("objects", []):
            max_oid = max(max_oid, o["id"] + 1)
    objs = []
    oid = max_oid
    for inst in instances:
        objs.append(instance_to_object(inst, oid, ts_firstgid))
        oid += 1

    # nowa warstwa `trees` w miejscu `trees-base` (kolejność w liście = porządek
    # w Tiled; głębię i tak liczy renderer per drzewo, nie kolejność warstw)
    base_idx = next(i for i, l in enumerate(m["layers"]) if l["name"] == BASE_LAYER)
    new_layers = []
    max_lid = m.get("nextlayerid", 1)
    for l in m["layers"]:
        max_lid = max(max_lid, l["id"] + 1)
    trees_layer = {
        "draworder": "topdown",
        "id": max_lid,
        "name": "trees",
        "objects": objs,
        "opacity": 1,
        "type": "objectgroup",
        "visible": True,
        "x": 0,
        "y": 0,
    }
    for i, l in enumerate(m["layers"]):
        if l["name"] in (BASE_LAYER, OVER_LAYER):
            continue
        if i == base_idx + 1:  # wstaw `trees` tam, gdzie kończył się stos drzew
            pass
        new_layers.append(l)
    new_layers.insert(base_idx, trees_layer)
    m["layers"] = new_layers
    m["nextlayerid"] = max_lid + 1
    m["nextobjectid"] = oid

    m["tilesets"].append(treestamps_tileset(ts_firstgid, image_prefix))

    if save:
        path.write_text(json.dumps(m, indent=1), encoding="utf-8")

    return {
        "path": path,
        "instances": instances,
        "n_anchored": n_anchored,
        "n_orphans": len(orphans),
        "ts_firstgid": ts_firstgid,
        "objects": len(objs),
    }


def revert_one(path, image_prefix, sprites):
    """Odwrotność migracji: warstwa obiektów `trees` → z powrotem `trees-base`/
    `trees-over` PEŁNYMI stemplami (kolejność Y). Nie odtwarza dawnego wzoru
    przykrywania kafli — daje las „wyleczony", nie bit-w-bit sprzed migracji.
    Bezpiecznik na wypadek odrzucenia modelu obiektowego."""
    m = json.loads(path.read_text(encoding="utf-8"))
    layers = {l["name"]: l for l in m["layers"]}
    if "trees" not in layers or BASE_LAYER in layers:
        print(f"  {path.name}: nie ma warstwy `trees` albo już jest tile-based — pomijam.")
        return None
    byname = {s[0]: s for s in sprites}
    forrest_ts = next(t for t in m["tilesets"] if t["name"] == "Forrest")
    fg = forrest_ts["firstgid"]
    ts_stamps = next(t for t in m["tilesets"] if t["name"] == "TreeStamps")
    tsf = ts_stamps["firstgid"]
    W, H = m["width"], m["height"]
    base = [0] * (W * H)
    over = [0] * (W * H)
    objs = sorted(layers["trees"]["objects"], key=lambda o: o["y"])
    for o in objs:
        idx = (o["gid"] & 0x1FFFFFFF) - tsf
        name = sprites[idx][0]
        _n, c0, r0, cols, rows, _i = byname[name]
        w = cols * 32
        x0 = (o["x"] + (CELL - w) // 2) // 32
        y0 = o["y"] // 32 - rows
        for r in range(rows):
            for c in range(cols):
                mx, my = x0 + c, y0 + r
                if not (0 <= mx < W and 0 <= my < H):
                    continue
                local = (r0 + r) * ATLAS_COLS + (c0 + c)
                (base if r == rows - 1 else over)[my * W + mx] = fg + local
    def tl(name, data, lid):
        return {"data": data, "height": H, "id": lid, "name": name, "opacity": 1,
                "type": "tilelayer", "visible": True, "width": W, "x": 0, "y": 0}
    ti = next(i for i, l in enumerate(m["layers"]) if l["name"] == "trees")
    max_lid = max(l["id"] for l in m["layers"]) + 1
    m["layers"][ti:ti + 1] = [tl(BASE_LAYER, base, max_lid), tl(OVER_LAYER, over, max_lid + 1)]
    m["nextlayerid"] = max_lid + 2
    m["tilesets"] = [t for t in m["tilesets"] if t["name"] != "TreeStamps"]
    path.write_text(json.dumps(m, indent=1), encoding="utf-8")
    return sum(1 for v in base if v) + sum(1 for v in over if v)


def main():
    save = "--zapisz" in sys.argv
    with_orphans = "--orphans" in sys.argv
    sprites = load_sprites()

    if "--revert" in sys.argv:
        print("REVERT: warstwa `trees` → trees-base/trees-over (pełne stemple)")
        for path, prefix in TMJ_COPIES:
            n = revert_one(path, prefix, sprites)
            if n is not None:
                print(f"  {path.relative_to(ROOT)}: {n} kafli drzew odtworzonych")
        return

    results = []
    for path, prefix in TMJ_COPIES:
        print(f"\n=== {path.relative_to(ROOT)} ===")
        r = migrate_one(path, prefix, sprites, save, with_orphans)
        if not r:
            continue
        results.append(r)
        insts = r["instances"]
        print(f"  drzewa z kotwicą (trees-base)     : {r['n_anchored']}")
        if with_orphans:
            print(f"  + zrekonstruowane korony bez pnia : {r['n_orphans']}")
        print(f"  RAZEM obiektów na warstwie `trees` : {r['objects']}")
        print(f"  TreeStamps firstgid               : {r['ts_firstgid']}")
        from collections import Counter
        by_variant = Counter(i["name"] for i in insts)
        partial = [i for i in insts if i["matched"] < i["total"] and not i.get("orphan")]
        heavy = [i for i in partial if i["matched"] / i["total"] < 0.34]
        print(f"  wariantów: {len(by_variant)}")
        for name, n in sorted(by_variant.items(), key=lambda kv: -kv[1]):
            print(f"    {name:<22} {n}")
        print(f"  matched<total (kafle przykryte przez inne drzewo): {len(partial)}  (w tym <34%: {len(heavy)})")
        xs = [i['x0'] for i in insts]; ys = [i['y0'] for i in insts]
        print(f"  zakres x0: {min(xs)}..{max(xs)}  y0: {min(ys)}..{max(ys)}  (mapa 160×60)")

    if len(results) == 2:
        a = [(i["name"], i["x0"], i["y0"]) for i in results[0]["instances"]]
        b = [(i["name"], i["x0"], i["y0"]) for i in results[1]["instances"]]
        print(f"\nobie kopie dają identyczny zestaw instancji: {a == b}")

    if not save:
        print("\n(przymiar — nic nie zapisano; dodaj --zapisz [--orphans])")
    else:
        print(f"\nZAPISANO obie kopie forrest.tmj  (orphans: {'TAK' if with_orphans else 'nie'})")


if __name__ == "__main__":
    main()

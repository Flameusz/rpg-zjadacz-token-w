# -*- coding: utf-8 -*-
"""
Generator arkusza STEMPLI DRZEW dla edytora Tiled + manifestu dla silnika +
mini-mapy prototypowej.

⚠ Patrz `tools/CLAUDE.md`: domyślnie DRUKUJE RAPORT i nic nie zapisuje; zapis
wyłącznie pod `--zapisz`.

Po co to jest (patrz `docs/tree_instances.md`):
- `forrest.png` zostaje arkuszem RENDEROWYM bez zmian. Ten skrypt robi OSOBNY,
  edytorowy arkusz `public/assets/tree_stamps.png`, w którym KAŻDE drzewo zajmuje
  dokładnie jedną komórkę siatki 96×96 (największe drzewo w atlasie to 96×96),
  dosunięte do DOŁU i wyśrodkowane w poziomie. Dzięki temu w Tiled level designer
  wstawia drzewo jako pojedynczy „tile object": widzi pełny obraz, stawia w
  dowolnym miejscu, drzewa mogą się nakładać, przeciąga myszą, kasuje Delete.
- `src/world/TreeStampManifest.ts` — kolejność wariantów (== kolejność komórek ==
  lokalne id kafli w tilesecie TreeStamps) + pudełko kolizji PNIA każdego drzewa
  w pikselach WZGLĘDEM punktu wstawienia obiektu (lewy-dolny róg komórki 96×96).
- `public/assets/maps/tree_proto.tmj` — mała mapa testowa: sam grunt + warstwa
  obiektów `trees` z kilkunastoma nachodzącymi na siebie drzewami różnych
  rozmiarów i gatunków + punkt `player`. Ładowana w silniku przez
  `window.dev.treeProto.load()` (mapId "treeproto").

Źródło prawdy o układzie atlasu: `docs/forrest_atlas.json` (ten sam plik, z
którego korzysta `src/world/ForestAtlasManifest.ts`; kolejność `sprites` jest
identyczna z `FOREST_SPRITES`).
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ATLAS_PNG = ROOT / "public/assets/forrest.png"
ATLAS_JSON = ROOT / "docs/forrest_atlas.json"

OUT_PNG = ROOT / "public/assets/tree_stamps.png"
OUT_PNG_BIG = ROOT / "public/assets/tree_stamps_big.png"
OUT_MANIFEST = ROOT / "src/world/TreeStampManifest.ts"
OUT_MAP = ROOT / "public/assets/maps/tree_proto.tmj"
OUT_WILLOW_TEST = ROOT / "public/assets/maps/willow_test.tmj"
OUT_PREVIEW = ROOT / "tools/podglad_tree_stamps.png"

TILE = 32          # kafel atlasu forrest.png
CELL = 96          # komórka arkusza stempli = największe drzewo z forrest.png (3×3 kafle)
COLS = 8           # kolumn w arkuszu stempli
TRUNK_SLICE = 32   # dolny pas komórki = PIEŃ (walk-in-front); reszta = KORONA (walk-behind)

# ── OSOBNY arkusz WIELKICH stempli (TreeStampsBig) ─────────────────────────
# Wierzba może być świadomie większa od dębu/buka (drzewo akcentowe nad wodą).
# 160×160 nie zmieści się w siatce 96 głównego arkusza, więc idzie do własnego
# tilesetu — istniejące 1633 drzewa i ich gid-y zostają NIETKNIĘTE.
BIG_CELL = 160
BIG_COLS = 2
# firstgid TreeStampsBig w tree_proto.tmj: Teren(228) + TreeStamps(COLS*rows).
# Liczone dynamicznie w proto_map(); silnik i tak czyta ts.firstgid po nazwie.

# firstgid tilesetu TreeStamps w tree_proto.tmj. Teren ma 228 kafli (firstgid 1),
# więc następny tileset zaczyna się od 229 — DOKŁADNIE to, co Tiled wpisuje po
# zapisaniu mapy (sprawdzone round-tripem przez tiled.exe --export-map). Silnik
# i tak czyta `ts.firstgid` dynamicznie i wiąże tileset po NAZWIE, nie po gid,
# więc ta liczba może się po zapisie w Tiled zmienić bez szkody — trzymamy ją
# zgodną z Tiled tylko po to, żeby pierwszy zapis dał zerowy diff.
TEREN_TILECOUNT = 228
PROTO_TREESTAMPS_FIRSTGID = TEREN_TILECOUNT + 1  # 229


def load_atlas():
    data = json.loads(ATLAS_JSON.read_text(encoding="utf-8"))
    sprites = data["sprites"]  # dict zachowujący kolejność == FOREST_SPRITES
    # pudełka kolizji pnia, pogrupowane po nazwie drzewa
    boxes_by_tree = {}
    for entry in data.get("kolizja_tiles", []):
        name = entry["drzewo"]
        sub = entry["sub"]          # [kolumna, wiersz] w obrębie drzewa
        b = entry["box"]            # x,y,width,height względem tego subkafla 32×32
        fx = sub[0] * TILE + b["x"]
        fy = sub[1] * TILE + b["y"]
        rect = (fx, fy, fx + b["width"], fy + b["height"])  # w układzie klatki drzewa
        boxes_by_tree.setdefault(name, []).append(rect)
    return sprites, boxes_by_tree, data


def load_willows(data):
    """Drzewa z OSOBNYCH PNG (nie z forrest.png): wierzby (`willows`) ORAZ nowy
    buk buki-v1 (`beeches`, ETAP4 2026-08-31). Każdy plik ma już rozmiar
    docelowej komórki (64/96/128/160), grafika dosunięta do dołu. Ta sama
    mechanika dla obu — beech dochodzi PO wierzbach, więc indeksy 0..N
    istniejących drzew (w tym STARY buk_*_new w sprites) zostają nietknięte.
    Zwraca (small, big) — listy rekordów gotowych do build_records/render."""
    small, big = [], []
    for w in data.get("willows", []) + data.get("beeches", []):
        img = Image.open(ROOT / w["standalone"]).convert("RGBA")
        cell = BIG_CELL if w["sheet"] == "big" else CELL
        if img.size != (w["cols"] * TILE, w["rows"] * TILE):
            raise SystemExit(
                f"willow {w['name']}: PNG {img.size} != {w['cols']*TILE}×{w['rows']*TILE} "
                f"(cols×rows). Popraw plik albo forrest_atlas.json."
            )
        rec = {
            "name": w["name"],
            "img": img,                       # standalone — NIE croppujemy z forrest.png
            "w": w["cols"] * TILE,
            "h": w["rows"] * TILE,
            "cols": w["cols"],
            "rows": w["rows"],
            "col0": 0,
            "row0": 0,
            "trunk_box": w["trunk_box"],      # x,y,w,h w ramce = rozmiar pliku
            "cell": cell,
        }
        (big if w["sheet"] == "big" else small).append(rec)
    return small, big


def willow_trunk(rec):
    """Pudełko pnia względem punktu wstawienia obiektu (lewy-dolny róg komórki)."""
    cell = rec["cell"]
    w, h = rec["w"], rec["h"]
    left_in_cell = (cell - w) // 2
    tb = rec["trunk_box"]
    # trunk_box.y jest liczony od góry RAMKI pliku; ramka jest dosunięta do dołu
    # komórki, więc dy względem dolnej krawędzi komórki = tb.y - h.
    return {
        "dx": left_in_cell + tb["x"],
        "dy": tb["y"] - h,
        "w": tb["width"],
        "h": tb["height"],
    }


def union(rects):
    xs0 = min(r[0] for r in rects)
    ys0 = min(r[1] for r in rects)
    xs1 = max(r[2] for r in rects)
    ys1 = max(r[3] for r in rects)
    return xs0, ys0, xs1, ys1


def build_records(sprites, boxes_by_tree, willows_small=()):
    """Dla każdego wariantu: rozmiar drzewa + pudełko pnia względem punktu
    wstawienia obiektu Tiled (lewy-dolny róg komórki 96×96). Warianty wierzby
    (`willows_small`) dochodzą NA KOŃCU — nie ruszają indeksów 0..N istniejących
    drzew, więc gid-y 1633 drzew w forrest.tmj zostają bez zmian."""
    recs = []
    for i, (name, sp) in enumerate(sprites.items()):
        w = sp["cols"] * TILE
        h = sp["rows"] * TILE
        left_in_cell = (CELL - w) // 2          # drzewo wyśrodkowane w poziomie

        if name in boxes_by_tree:
            fx0, fy0, fx1, fy1 = union(boxes_by_tree[name])
        else:
            # awaryjnie: wąski pień na środku dolnej krawędzi (16×14 px)
            fx0 = w // 2 - 8
            fx1 = w // 2 + 8
            fy1 = h
            fy0 = h - 14

        # względem punktu wstawienia obiektu = (o.x = lewa krawędź komórki,
        # o.y = DOLNA krawędź komórki). dy ujemne = w górę od o.y.
        # dy względem DOLNEJ krawędzi komórki: (CELL-h) + fy0 - CELL == fy0 - h
        trunk = {
            "dx": left_in_cell + fx0,
            "dy": fy0 - h,
            "w": fx1 - fx0,
            "h": fy1 - fy0,
        }

        recs.append(
            {
                "index": i,
                "name": name,
                "w": w,
                "h": h,
                "col0": sp["col0"],
                "row0": sp["row0"],
                "cols": sp["cols"],
                "rows": sp["rows"],
                "trunk": trunk,
            }
        )

    for j, wr in enumerate(willows_small):
        recs.append(
            {
                "index": len(sprites) + j,
                "name": wr["name"],
                "w": wr["w"],
                "h": wr["h"],
                "col0": 0,
                "row0": 0,
                "cols": wr["cols"],
                "rows": wr["rows"],
                "img": wr["img"],            # standalone — render_sheet paste-uje wprost
                "trunk": willow_trunk({**wr, "cell": CELL}),
            }
        )
    return recs


def build_big_records(willows_big):
    return [
        {
            "index": j,
            "name": wr["name"],
            "w": wr["w"],
            "h": wr["h"],
            "img": wr["img"],
            "trunk": willow_trunk({**wr, "cell": BIG_CELL}),
        }
        for j, wr in enumerate(willows_big)
    ]


def render_sheet(atlas, recs):
    rows = (len(recs) + COLS - 1) // COLS
    sheet = Image.new("RGBA", (COLS * CELL, rows * CELL), (0, 0, 0, 0))
    for r in recs:
        if "img" in r:                         # standalone (wierzba) — bez cropu
            crop = r["img"]
        else:
            sx, sy = r["col0"] * TILE, r["row0"] * TILE
            crop = atlas.crop((sx, sy, sx + r["w"], sy + r["h"]))
        cx = (r["index"] % COLS) * CELL
        cy = (r["index"] // COLS) * CELL
        px = cx + (CELL - r["w"]) // 2
        py = cy + (CELL - r["h"])      # dosunięte do dołu komórki
        sheet.alpha_composite(crop, (px, py))
    return sheet


def render_big_sheet(big_recs):
    if not big_recs:
        return None
    rows = (len(big_recs) + BIG_COLS - 1) // BIG_COLS
    sheet = Image.new("RGBA", (BIG_COLS * BIG_CELL, rows * BIG_CELL), (0, 0, 0, 0))
    for r in big_recs:
        cx = (r["index"] % BIG_COLS) * BIG_CELL
        cy = (r["index"] // BIG_COLS) * BIG_CELL
        px = cx + (BIG_CELL - r["w"]) // 2
        py = cy + (BIG_CELL - r["h"])
        sheet.alpha_composite(r["img"], (px, py))
    return sheet


def render_preview(sheet, recs):
    scale = 3
    big = sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST)
    d = ImageDraw.Draw(big)
    rows = (len(recs) + COLS - 1) // COLS
    for gx in range(COLS + 1):
        d.line([(gx * CELL * scale, 0), (gx * CELL * scale, rows * CELL * scale)], fill=(255, 0, 255, 120))
    for gy in range(rows + 1):
        d.line([(0, gy * CELL * scale), (COLS * CELL * scale, gy * CELL * scale)], fill=(255, 0, 255, 120))
    for r in recs:
        cx = (r["index"] % COLS) * CELL * scale
        cy = (r["index"] // COLS) * CELL * scale
        # pudełko pnia: dx względem lewej krawędzi komórki, dy względem dolnej
        tx0 = cx + (r["trunk"]["dx"]) * scale
        ty0 = cy + (CELL + r["trunk"]["dy"]) * scale
        d.rectangle(
            [tx0, ty0, tx0 + r["trunk"]["w"] * scale, ty0 + r["trunk"]["h"] * scale],
            outline=(255, 60, 60, 255),
        )
        d.text((cx + 3, cy + 3), r["name"], fill=(255, 255, 255, 255))
    return big


def manifest_ts(recs, sheet, big_recs=(), big_sheet=None):
    lines = []
    lines.append("// ⚠ PLIK GENEROWANY — `python tools/build_tree_stamps.py --zapisz`. Nie edytuj ręcznie.")
    lines.append("//")
    lines.append("// Arkusz `public/assets/tree_stamps.png` (edytorowy — Tiled wstawia drzewo jako")
    lines.append("// pojedynczy tile object z tego tilesetu). RENDEROWY atlas to nadal `forrest.png`,")
    lines.append("// ale tu renderujemy wprost z tego arkusza: jedna komórka = całe drzewo.")
    lines.append("// Kolejność == kolejność komórek == lokalne id kafla w tilesecie `TreeStamps`.")
    lines.append("//")
    lines.append("// Model głębi: drzewo = PIEŃ (dolny pas komórki, pasmo encji) + KORONA (reszta,")
    lines.append("// nad encjami), każde sortowane po własnej kotwicy Y. `docs/tree_instances.md`.")
    lines.append("")
    lines.append(f"export const TREE_STAMP_CELL = {CELL};")
    lines.append(f"export const TREE_STAMP_COLS = {COLS};")
    lines.append(f"export const TREE_STAMP_ROWS = {(len(recs) + COLS - 1) // COLS};")
    lines.append(f"/** Dolny pas komórki renderowany jako PIEŃ (px). Reszta = korona. */")
    lines.append(f"export const TREE_STAMP_TRUNK_SLICE = {TRUNK_SLICE};")
    lines.append(f"/** Rozmiar arkusza w px — do sanity-checku wczytanej tekstury. */")
    lines.append(f"export const TREE_STAMP_SHEET = {{ w: {sheet.width}, h: {sheet.height} }} as const;")
    lines.append("")
    lines.append("export interface TreeStampDef {")
    lines.append("  /** Lokalne id kafla w tilesecie `TreeStamps` (0-based) = indeks komórki. */")
    lines.append("  readonly id: number;")
    lines.append("  readonly name: string;")
    lines.append("  /** Rzeczywisty rozmiar grafiki drzewa w px (drzewo jest dosunięte do DOŁU")
    lines.append("   *  komórki i wyśrodkowane w poziomie). */")
    lines.append("  readonly w: number;")
    lines.append("  readonly h: number;")
    lines.append("  /** Pudełko kolizji PNIA w px, względem punktu wstawienia obiektu Tiled:")
    lines.append("   *  dx od lewej krawędzi komórki, dy od DOLNEJ krawędzi komórki (dy < 0 = w górę). */")
    lines.append("  readonly trunk: { readonly dx: number; readonly dy: number; readonly w: number; readonly h: number };")
    lines.append("}")
    lines.append("")
    lines.append("export const TREE_STAMPS: readonly TreeStampDef[] = [")
    for r in recs:
        t = r["trunk"]
        lines.append(
            "  { id: %d, name: %s, w: %d, h: %d, trunk: { dx: %d, dy: %d, w: %d, h: %d } },"
            % (r["index"], json.dumps(r["name"]), r["w"], r["h"], t["dx"], t["dy"], t["w"], t["h"])
        )
    lines.append("];")
    lines.append("")
    lines.append("const BY_ID = new Map(TREE_STAMPS.map((s) => [s.id, s]));")
    lines.append("const BY_NAME = new Map(TREE_STAMPS.map((s) => [s.name, s]));")
    lines.append("export const treeStampById = (id: number): TreeStampDef | undefined => BY_ID.get(id);")
    lines.append("export const treeStampByName = (name: string): TreeStampDef | undefined => BY_NAME.get(name);")
    lines.append("")

    # ── ARKUSZ WIELKI — emitowany ZAWSZE (pusty, gdy brak wariantów >96) ──────
    big_rows = (len(big_recs) + BIG_COLS - 1) // BIG_COLS if big_recs else 0
    bw = big_sheet.width if big_sheet is not None else 0
    bh = big_sheet.height if big_sheet is not None else 0
    lines.append("// ── ARKUSZ WIELKI (`tree_stamps_big.png`, tileset `TreeStampsBig`) ─────────")
    lines.append("// Osobny tileset dla wariantow wiekszych niz komorka 96 (wierzba duza).")
    lines.append("// Ladowany OBOK `TreeStamps`; istniejace 1633 drzewa go nie dotykaja.")
    lines.append("// Ten sam model glebi (dolny pas = pien) i ta sama konwencja `trunk`.")
    lines.append("")
    lines.append(f"export const TREE_STAMP_BIG_CELL = {BIG_CELL};")
    lines.append(f"export const TREE_STAMP_BIG_COLS = {BIG_COLS};")
    lines.append(f"export const TREE_STAMP_BIG_ROWS = {big_rows};")
    lines.append(f"export const TREE_STAMP_BIG_SHEET = {{ w: {bw}, h: {bh} }} as const;")
    lines.append("")
    lines.append("export const TREE_STAMPS_BIG: readonly TreeStampDef[] = [")
    for r in big_recs:
        t = r["trunk"]
        lines.append(
            "  { id: %d, name: %s, w: %d, h: %d, trunk: { dx: %d, dy: %d, w: %d, h: %d } },"
            % (r["index"], json.dumps(r["name"]), r["w"], r["h"], t["dx"], t["dy"], t["w"], t["h"])
        )
    lines.append("];")
    lines.append("")
    lines.append("const BIG_BY_ID = new Map(TREE_STAMPS_BIG.map((s) => [s.id, s]));")
    lines.append("const BIG_BY_NAME = new Map(TREE_STAMPS_BIG.map((s) => [s.name, s]));")
    lines.append("export const treeStampBigById = (id: number): TreeStampDef | undefined => BIG_BY_ID.get(id);")
    lines.append("export const treeStampBigByName = (name: string): TreeStampDef | undefined => BIG_BY_NAME.get(name);")
    lines.append("")

    return "\n".join(lines)


# ── mapa prototypowa ────────────────────────────────────────────────────────

def proto_tree(oid, name, x, y, recs_by_name, firstgid=PROTO_TREESTAMPS_FIRSTGID, cell=CELL):
    r = recs_by_name[name]
    return {
        "gid": firstgid + r["index"],
        "height": cell,
        "id": oid,
        "name": "tree",
        "opacity": 1,
        "rotation": 0,
        "type": "",
        "visible": True,
        "width": cell,
        "x": x,
        "y": y,             # Tiled: (x,y) = lewy-DOLNY róg tile-objectu
    }


def proto_map(recs, sheet, big_recs=(), big_sheet=None):
    W, H = 52, 30  # kafli → 1664×960 (miejsce na wielkie wierzby)
    rbn = {r["name"]: r for r in recs}
    big_by_name = {r["name"]: r for r in big_recs}
    stamps_tilecount = COLS * ((len(recs) + COLS - 1) // COLS)
    big_firstgid = PROTO_TREESTAMPS_FIRSTGID + stamps_tilecount
    ground = [1] * (W * H)  # Teren local 0 (trawa)

    # ~20 drzew: trzy celowe skupiska + kolumna testu głębi N→S + drzewa osobne.
    # Współrzędne w px, y = DOLNA krawędź (linia gruntu). Skupiska mają
    # zachodzące na siebie pnie ORAZ korony — to jest to, co ma zadziałać.
    trees = []
    oid = 2  # 1 = player

    def add(name, x, y):
        nonlocal oid
        if name in big_by_name:
            trees.append(proto_tree(oid, name, x, y, big_by_name, big_firstgid, BIG_CELL))
        else:
            trees.append(proto_tree(oid, name, x, y, rbn))
        oid += 1

    # SKUPISKO A — gęsty gaj, 8 drzew, pnie i korony różnych drzew w tych samych px
    add("dab_duzy_new",      360, 430)
    add("swierk_duzy_new",   440, 360)
    add("brzoza_duza_new",   420, 470)
    add("dab_duzy2_new",     330, 500)
    add("buk_duzy",          480, 500)   # ETAP4: nowy buk (BIG sheet)
    add("grab_duzy_new",     520, 430)
    add("swierk_maly_new",   405, 400)
    add("brzoza_srednia_new",470, 380)

    # SKUPISKO B — trzy drzewa jedno za drugim (N→S), korony mają się nakładać
    add("buk_duzy2",         760, 300)   # ETAP4: nowy buk wariant 2 (BIG sheet)
    add("dab_sredni_new",    800, 360)
    add("buk_sredni",        770, 420)   # ETAP4: nowy buk średni

    # SKUPISKO C — para „duże + małe pod nim", test małej sylwetki w overlapie
    add("olcha_duza_new",    980, 560)
    add("dab_maly_new",      1000, 590)
    add("buk_maly",          1035, 575)  # ETAP4: nowy buk mały

    # KOLUMNA TESTU GŁĘBI — 4 drzewa w pionie, x=1180; niżej = bardziej z przodu
    for k, name in enumerate(["swierk_duzy2_new", "dab_sredni_new", "brzoza_mala_new", "olcha_duza2_new"]):
        add(name, 1180, 240 + k * 130)

    # DRZEWA OSOBNE — referencja sylwetki i kolizji pnia (bez overlapu)
    add("grab_maly_new",     200, 320)
    add("olcha_srednia_new", 240, 560)
    add("swierk_sredni_new", 640, 640)

    # WIERZBY — hierarchia obok siebie + jedna duża w overlapie z dębem
    for nm, x, y in [
        ("wierzba_duza_new", 1420, 470),
        ("wierzba_duza2_new", 1600, 500),
        ("wierzba_srednia_new", 1360, 640),
        ("wierzba_srednia2_new", 1470, 680),
        ("wierzba_mala_new", 1560, 700),
        ("wierzba_sadzonka_new", 1620, 710),
    ]:
        if nm in rbn or nm in big_by_name:
            add(nm, x, y)
    if "wierzba_duza_new" in big_by_name:
        add("wierzba_duza_new", 400, 560)   # overlap z dąbem ze skupiska A

    player = {
        "height": 0, "id": 1, "name": "player", "opacity": 1, "point": True,
        "rotation": 0, "type": "", "visible": True, "width": 0, "x": 210, "y": 760,
    }

    ts_teren = {
        "columns": 19, "firstgid": 1, "image": "../Teren.png",
        "imageheight": 395, "imagewidth": 640, "margin": 0, "name": "Teren",
        "spacing": 1, "tilecount": TEREN_TILECOUNT, "tileheight": 32, "tilewidth": 32,
    }
    ts_stamps = {
        "columns": COLS, "firstgid": PROTO_TREESTAMPS_FIRSTGID,
        "image": "../tree_stamps.png", "imageheight": sheet.height,
        "imagewidth": sheet.width, "margin": 0, "name": "TreeStamps",
        "objectalignment": "bottomleft", "spacing": 0,
        "tilecount": stamps_tilecount,
        "tileheight": CELL, "tilewidth": CELL,
    }
    tilesets = [ts_teren, ts_stamps]
    if big_recs and big_sheet is not None:
        big_rows = (len(big_recs) + BIG_COLS - 1) // BIG_COLS
        tilesets.append({
            "columns": BIG_COLS, "firstgid": big_firstgid,
            "image": "../tree_stamps_big.png", "imageheight": big_sheet.height,
            "imagewidth": big_sheet.width, "margin": 0, "name": "TreeStampsBig",
            "objectalignment": "bottomleft", "spacing": 0,
            "tilecount": BIG_COLS * big_rows,
            "tileheight": BIG_CELL, "tilewidth": BIG_CELL,
        })

    return {
        "compressionlevel": -1,
        "height": H,
        "infinite": False,
        "layers": [
            {
                "data": ground, "height": H, "id": 1, "name": "ground",
                "opacity": 1, "type": "tilelayer", "visible": True, "width": W,
                "x": 0, "y": 0,
            },
            {
                "draworder": "topdown", "id": 2, "name": "trees",
                "objects": trees, "opacity": 1, "type": "objectgroup",
                "visible": True, "x": 0, "y": 0,
            },
            {
                "draworder": "topdown", "id": 3, "name": "objects",
                "objects": [player], "opacity": 1, "type": "objectgroup",
                "visible": True, "x": 0, "y": 0,
            },
        ],
        "nextlayerid": 4,
        "nextobjectid": oid + 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.12.2",
        "tileheight": TILE,
        "tilesets": tilesets,
        "tilewidth": TILE,
        "type": "map",
        "version": "1.10",
        "width": W,
    }


def _stamp_tilesets(recs, sheet, big_recs, big_sheet):
    """Wspólna lista tilesetów dla map testowych (Teren + TreeStamps [+ Big])."""
    stamps_tilecount = COLS * ((len(recs) + COLS - 1) // COLS)
    big_firstgid = PROTO_TREESTAMPS_FIRSTGID + stamps_tilecount
    tilesets = [
        {"columns": 19, "firstgid": 1, "image": "../Teren.png", "imageheight": 395,
         "imagewidth": 640, "margin": 0, "name": "Teren", "spacing": 1,
         "tilecount": TEREN_TILECOUNT, "tileheight": 32, "tilewidth": 32},
        {"columns": COLS, "firstgid": PROTO_TREESTAMPS_FIRSTGID, "image": "../tree_stamps.png",
         "imageheight": sheet.height, "imagewidth": sheet.width, "margin": 0,
         "name": "TreeStamps", "objectalignment": "bottomleft", "spacing": 0,
         "tilecount": stamps_tilecount, "tileheight": CELL, "tilewidth": CELL},
    ]
    if big_recs and big_sheet is not None:
        big_rows = (len(big_recs) + BIG_COLS - 1) // BIG_COLS
        tilesets.append(
            {"columns": BIG_COLS, "firstgid": big_firstgid, "image": "../tree_stamps_big.png",
             "imageheight": big_sheet.height, "imagewidth": big_sheet.width, "margin": 0,
             "name": "TreeStampsBig", "objectalignment": "bottomleft", "spacing": 0,
             "tilecount": BIG_COLS * big_rows, "tileheight": BIG_CELL, "tilewidth": BIG_CELL})
    return tilesets, PROTO_TREESTAMPS_FIRSTGID, big_firstgid


def willow_test_map(recs, sheet, big_recs, big_sheet):
    """Mała mapa DEV do sprawdzenia 6 wariantów wierzby: rząd „obok siebie"
    (sylwetka + skala, bez nakładania koron) + kępa z NAKŁADANIEM (korony
    zachodzą, pnie sortują się z graczem po Y) + para wierzba×dąb (dwa tilesety
    sortują się razem). `window.dev.treeProto.willows()` → mapId "willowtest".
    NIE dotyka forrest.tmj."""
    W, H = 36, 25  # 1152×800
    tilesets, sfg, bfg = _stamp_tilesets(recs, sheet, big_recs, big_sheet)
    rbn = {r["name"]: r for r in recs}
    big_by = {r["name"]: r for r in big_recs}
    ground = [1] * (W * H)  # Teren local 0 (trawa)

    trees = []
    oid = 2

    def add(name, x, y):
        nonlocal oid
        if name in big_by:
            trees.append(proto_tree(oid, name, x, y, big_by, bfg, BIG_CELL))
        else:
            trees.append(proto_tree(oid, name, x, y, rbn, sfg, CELL))
        oid += 1

    order = ["wierzba_duza_new", "wierzba_duza2_new", "wierzba_srednia_new",
             "wierzba_srednia2_new", "wierzba_mala_new", "wierzba_sadzonka_new"]
    missing = [n for n in order if n not in rbn and n not in big_by]
    if missing:
        raise SystemExit(f"willow_test_map: brak wariantów {missing}")

    # ── RZĄD 1 — 6 wariantów obok siebie, stopy na y=340, korony się NIE stykają
    for name, x in zip(order, [40, 230, 430, 545, 660, 745]):
        add(name, x, 340)

    # ── KĘPA 2 — NAKŁADANIE: 5 wierzb, stagger N→S (niżej = z przodu)
    add("wierzba_duza_new",     150, 560)
    add("wierzba_srednia_new",  330, 590)
    add("wierzba_srednia2_new", 250, 625)
    add("wierzba_mala_new",     410, 650)
    add("wierzba_sadzonka_new", 340, 672)

    # ── PARA 3 — wierzba × dąb (dwa tilesety sortują się razem po Y)
    add("dab_duzy_new",     760, 600)
    add("wierzba_duza2_new", 820, 640)

    player = {"height": 0, "id": 1, "name": "player", "opacity": 1, "point": True,
              "rotation": 0, "type": "", "visible": True, "width": 0, "x": 300, "y": 640}

    return {
        "compressionlevel": -1, "height": H, "infinite": False,
        "layers": [
            {"data": ground, "height": H, "id": 1, "name": "ground", "opacity": 1,
             "type": "tilelayer", "visible": True, "width": W, "x": 0, "y": 0},
            {"draworder": "topdown", "id": 2, "name": "trees", "objects": trees,
             "opacity": 1, "type": "objectgroup", "visible": True, "x": 0, "y": 0},
            {"draworder": "topdown", "id": 3, "name": "objects", "objects": [player],
             "opacity": 1, "type": "objectgroup", "visible": True, "x": 0, "y": 0},
        ],
        "nextlayerid": 4, "nextobjectid": oid + 1, "orientation": "orthogonal",
        "renderorder": "right-down", "tiledversion": "1.12.2", "tileheight": TILE,
        "tilesets": tilesets, "tilewidth": TILE, "type": "map", "version": "1.10", "width": W,
    }


def main():
    save = "--zapisz" in sys.argv
    sprites, boxes_by_tree, data = load_atlas()
    willows_small, willows_big = load_willows(data)
    atlas = Image.open(ATLAS_PNG).convert("RGBA")
    recs = build_records(sprites, boxes_by_tree, willows_small)
    sheet = render_sheet(atlas, recs)
    big_recs = build_big_records(willows_big)
    big_sheet = render_big_sheet(big_recs)

    print(f"forrest.png            : {atlas.size}")
    print(f"tree_stamps.png        : {sheet.size}  ({COLS}×{(len(recs)+COLS-1)//COLS} komórek {CELL}px, {len(recs)} drzew)")
    if big_sheet is not None:
        print(f"tree_stamps_big.png    : {big_sheet.size}  ({BIG_COLS} kol × komórka {BIG_CELL}px, {len(big_recs)} drzew)")
    print(f"pudełka pnia z atlasu  : {len(boxes_by_tree)} / {len(sprites)} wariantów z forrest.png (reszta = awaryjne 16×14)")
    print(f"wierzby (osobne PNG)   : {len(willows_small)} do TreeStamps, {len(willows_big)} do TreeStampsBig")
    print()
    print(f"{'idx':>3}  {'wariant':<22} {'rozmiar':>8}   pień(dx,dy,w,h)")
    for r in recs:
        t = r["trunk"]
        src = "  [standalone]" if "img" in r else ("" if r["name"] in boxes_by_tree else "  [awaryjne]")
        print(f"{r['index']:>3}  {r['name']:<22} {r['w']:>3}x{r['h']:<3}   ({t['dx']:>3},{t['dy']:>4},{t['w']:>3},{t['h']:>3}){src}")
    for r in big_recs:
        t = r["trunk"]
        print(f"BIG{r['index']}  {r['name']:<22} {r['w']:>3}x{r['h']:<3}   ({t['dx']:>3},{t['dy']:>4},{t['w']:>3},{t['h']:>3})  [standalone 160]")

    if not save:
        print("\n(przymiar — nic nie zapisano; dodaj --zapisz)")
        return

    sheet.save(OUT_PNG)
    if big_sheet is not None:
        big_sheet.save(OUT_PNG_BIG)
    OUT_MANIFEST.write_text(manifest_ts(recs, sheet, big_recs, big_sheet), encoding="utf-8")
    OUT_MAP.write_text(json.dumps(proto_map(recs, sheet, big_recs, big_sheet), indent=1), encoding="utf-8")
    OUT_WILLOW_TEST.write_text(json.dumps(willow_test_map(recs, sheet, big_recs, big_sheet), indent=1), encoding="utf-8")
    render_preview(sheet, recs).save(OUT_PREVIEW)
    print("\nZAPISANO:")
    outs = [OUT_PNG, OUT_MANIFEST, OUT_MAP, OUT_WILLOW_TEST, OUT_PREVIEW]
    if big_sheet is not None:
        outs.insert(1, OUT_PNG_BIG)
    for p in outs:
        print(f"  {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

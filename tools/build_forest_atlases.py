# -*- coding: utf-8 -*-
"""
Generator dwóch atlasów statycznego decoru (`forest_decor_atlas.png`,
`water_flora_atlas.png`) — mechaniczne spakowanie ISTNIEJĄCYCH PNG z
`public/assets/props/`, zero ponownego rysowania, zero zmiany palety.

⚠ Patrz `tools/CLAUDE.md`: domyślnie DRUKUJE RAPORT i nic nie zapisuje; zapis
wyłącznie pod `--zapisz`. Dodatkowo zapisuje podgląd 3× powiększony z siatką
i etykietami (`tools/podglad_forest_decor_atlas.png` / `..._water_flora...`)
— "PATRZ NA RENDER, NIE TYLKO NA RAPORT".

Pakowanie: proste "shelf packing" (posortowane malejąco po wysokości, bez
przycinania marginesów przezroczystości — patrz audyt atlasowania: marginesy
źródłowe są już ciasne, 0–2 px, więc przycinanie nie dałoby realnej oszczędności
i tylko zwiększyłoby ryzyko rozjazdu origin). Padding = 2 px między klatkami
(NEAREST bez mipmap w tej konfiguracji Phasera — sprawdzone w `Config.js` —
więc bleeding jest już mało prawdopodobne; 2 px to tania rezerwa, nie konieczność).

Jeśli którykolwiek z docelowych rozmiarów (512×512 / 256×256) się nie mieści,
skrypt PRZERYWA z dokładnym komunikatem — nigdy nie powiększa canvasu po cichu.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PROPS = ROOT / "public/assets/props"

PAD = 2

# ── FOREST_DECOR: 23 kamienie + 11 krzewów + 22 pniaki = 56 klatek ──────────
STONES = [
    "stone_drobny_01", "stone_drobny_02", "stone_drobny_04", "stone_drobny_06",
    "stone_maly_02", "stone_maly_04", "stone_maly_05", "stone_maly_08", "stone_maly_12", "stone_maly_15",
    "stone_sredni_01", "stone_sredni_02", "stone_sredni_06", "stone_sredni_07", "stone_sredni_09", "stone_sredni_11",
    "stone_duzy_01", "stone_duzy_02", "stone_duzy_05", "stone_duzy_06",
    "stone_glaz_01", "stone_glaz_02", "stone_glaz_03",
]
BUSHES = [
    "bush_dome_small", "bush_dome_medium", "bush_dome_large", "bush_dome_berry",
    "bush_dome_flower", "bush_dome_olive", "bush_twiggy_bare_leaf", "bush_twiggy_berry",
    "bush_twiggy_bare", "bush_low_wide", "bush_low_sticks",
]
STUMPS = [
    f"{species}_stump_{state}"
    for species in ["oak", "birch", "spruce", "beech", "grab", "alder", "willow"]
    for state in ["fresh", "weathered", "old"]
] + ["pniak_z_siekiera_paleta"]

FOREST_DECOR_FILES = STONES + BUSHES + STUMPS  # 23 + 11 + 22 = 56
FOREST_DECOR_SIZE = (512, 512)

# ── WATER_FLORA: 17 flora wodna + 2 istniejące dekoracje wodne = 19 klatek ──
WATER_FLORA_FILES = [
    "cattail_large", "cattail_medium", "cattail_small",
    "reed_plume_large", "reed_plume_small",
    "marsh_tuft_01", "marsh_tuft_02", "marsh_tuft_03", "marsh_tuft_04", "marsh_tuft_05", "marsh_tuft_06",
    "shore_plant_01", "shore_plant_02", "shore_plant_03", "shore_plant_04", "shore_plant_05", "shore_plant_06",
    "brzeg_stawu_paleta", "lilia_wodna_paleta",
]
WATER_FLORA_SIZE = (256, 256)


def pack(names, canvas_size, pad=PAD):
    """Shelf packing, posortowane malejąco po wysokości. Zwraca (sheet, frames)
    gdzie frames = {name: (x, y, w, h)}. Rzuca SystemExit z DOKŁADNYM opisem,
    jeśli się nie mieści — nigdy nie zwiększa canvasu samodzielnie."""
    cw, ch = canvas_size
    images = {}
    for n in names:
        p = PROPS / f"{n}.png"
        if not p.exists():
            raise SystemExit(f"BŁĄD: brak pliku źródłowego {p.relative_to(ROOT)}")
        images[n] = Image.open(p).convert("RGBA")

    order = sorted(images.items(), key=lambda kv: (-kv[1].height, kv[0]))
    sheet = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    frames = {}
    x, y, shelf_h = pad, pad, 0

    for name, img in order:
        w, h = img.size
        if x + w + pad > cw:
            x = pad
            y += shelf_h + pad
            shelf_h = 0
        if y + h + pad > ch:
            packed_so_far = ", ".join(frames.keys()) or "(żaden)"
            raise SystemExit(
                f"NIE MIEŚCI SIĘ w {cw}×{ch}: klatka '{name}' ({w}×{h}) nie ma "
                f"miejsca przy y={y} (potrzeba {y + h + pad}, canvas ma {ch}).\n"
                f"Spakowano poprawnie {len(frames)}/{len(names)}: {packed_so_far}\n"
                f"NIE zwiększam rozmiaru automatycznie — zgłaszam problem, zgodnie z poleceniem."
            )
        # `paste` BEZ maski = surowa kopia bloku pikseli, zero matematyki
        # blendingu. `alpha_composite` przelicza RGB pod przezroczystymi
        # pikselami (dst startuje jako (0,0,0,0)), co dawało bajt-w-bajt
        # ROZBIEŻNE, choć wizualnie identyczne, wyniki dla plików niosących
        # niezerowe RGB pod alpha<255 (złapane na birch/spruce_stump —
        # weryfikacja piksel-w-piksel niżej to wyłapała). `paste` bez maski
        # nie blenduje w ogóle — to jest jedyny sposób na PRAWDZIWIE
        # mechaniczne pakowanie, którego żąda zadanie.
        sheet.paste(img, (x, y))
        frames[name] = (x, y, w, h)
        x += w + pad
        shelf_h = max(shelf_h, h)

    return sheet, frames


def atlas_json(frames):
    """Format 'JSON Hash' — ten, który `Phaser.Textures.Parsers.JSONHash`
    faktycznie parsuje (sprawdzone w źródle silnika, nie założone)."""
    out = {"frames": {}, "meta": {"app": "build_forest_atlases.py", "format": "RGBA8888", "scale": "1"}}
    for name, (x, y, w, h) in frames.items():
        out["frames"][name] = {
            "frame": {"x": x, "y": y, "w": w, "h": h},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": w, "h": h},
            "sourceSize": {"w": w, "h": h},
        }
    return out


def render_preview(sheet, frames, canvas_size):
    scale = 3
    cw, ch = canvas_size
    big = sheet.resize((cw * scale, ch * scale), Image.NEAREST)
    d = ImageDraw.Draw(big)
    for name, (x, y, w, h) in frames.items():
        d.rectangle([x * scale, y * scale, (x + w) * scale, (y + h) * scale], outline=(255, 0, 255, 200))
        d.text((x * scale + 2, y * scale + 2), name, fill=(255, 255, 0, 255))
    return big


def report(label, files, canvas_size, sheet, frames):
    cw, ch = canvas_size
    used_px = sum(w * h for _, _, w, h in frames.values())
    print(f"\n=== {label}: {sheet.size[0]}x{sheet.size[1]} ({len(frames)}/{len(files)} klatek) ===")
    print(f"wypełnienie: {used_px}/{cw*ch} px2 = {used_px/(cw*ch)*100:.1f}%")
    for name in files:
        x, y, w, h = frames[name]
        print(f"  {name:<28} frame=({x:>3},{y:>3},{w:>3},{h:>3})")


def verify_pixel_identity(names, frames, sheet):
    """Dowód, nie zaufanie: każdy piksel klatki w spakowanym arkuszu musi być
    BAJT-W-BAJT identyczny ze źródłowym PNG. To jest twardsza gwarancja niż
    obejrzenie podglądu — sprawdza WSZYSTKIE piksele, nie tylko te, na które
    akurat spojrzymy."""
    mismatches = []
    for name in names:
        src = Image.open(PROPS / f"{name}.png").convert("RGBA")
        x, y, w, h = frames[name]
        crop = sheet.crop((x, y, x + w, y + h))
        if list(crop.getdata()) != list(src.getdata()):
            mismatches.append(name)
    return mismatches


def main():
    save = "--zapisz" in sys.argv

    fd_sheet, fd_frames = pack(FOREST_DECOR_FILES, FOREST_DECOR_SIZE)
    wf_sheet, wf_frames = pack(WATER_FLORA_FILES, WATER_FLORA_SIZE)

    report("forest_decor_atlas.png", FOREST_DECOR_FILES, FOREST_DECOR_SIZE, fd_sheet, fd_frames)
    report("water_flora_atlas.png", WATER_FLORA_FILES, WATER_FLORA_SIZE, wf_sheet, wf_frames)

    fd_mismatch = verify_pixel_identity(FOREST_DECOR_FILES, fd_frames, fd_sheet)
    wf_mismatch = verify_pixel_identity(WATER_FLORA_FILES, wf_frames, wf_sheet)
    print(f"\nWeryfikacja piksel-w-piksel: forest_decor {'OK' if not fd_mismatch else 'BŁĄD: ' + str(fd_mismatch)}")
    print(f"Weryfikacja piksel-w-piksel: water_flora {'OK' if not wf_mismatch else 'BŁĄD: ' + str(wf_mismatch)}")
    if fd_mismatch or wf_mismatch:
        raise SystemExit("Rozbieżność pikseli — NIE zapisuję, coś jest nie tak z pakowaniem.")

    if not save:
        print("\n(przymiar — nic nie zapisano; dodaj --zapisz)")
        return

    out_fd_png = PROPS / "forest_decor_atlas.png"
    out_fd_json = PROPS / "forest_decor_atlas.json"
    out_wf_png = PROPS / "water_flora_atlas.png"
    out_wf_json = PROPS / "water_flora_atlas.json"

    fd_sheet.save(out_fd_png)
    out_fd_json.write_text(json.dumps(atlas_json(fd_frames), indent=1), encoding="utf-8")
    wf_sheet.save(out_wf_png)
    out_wf_json.write_text(json.dumps(atlas_json(wf_frames), indent=1), encoding="utf-8")

    prev_fd = ROOT / "tools/podglad_forest_decor_atlas.png"
    prev_wf = ROOT / "tools/podglad_water_flora_atlas.png"
    render_preview(fd_sheet, fd_frames, FOREST_DECOR_SIZE).save(prev_fd)
    render_preview(wf_sheet, wf_frames, WATER_FLORA_SIZE).save(prev_wf)

    print("\nZAPISANO:")
    for p in [out_fd_png, out_fd_json, out_wf_png, out_wf_json, prev_fd, prev_wf]:
        print(f"  {p.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

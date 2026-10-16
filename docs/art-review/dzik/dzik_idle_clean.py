"""dzik-idle.png: juz pixel art (flat tlo 36,36,36, ~50 kolorow/klatka, ostre
krawedzie). Minimalna obrobka: wytnij klatki -> klucz plaskiego tla ->
alfa 0/255. BEZ downscale (klatki ~35-50 px = juz w skali). BEZ zmiany kolorow."""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = r'C:\rpg\docs\art-review\dzik\dzik-idle.png'
OUT = r'C:\rpg\docs\art-review\dzik'
BG = np.array([36, 36, 36])

a = np.array(Image.open(SRC).convert('RGB')).astype(int)
H, W = a.shape[:2]
CW, CH = W // 4, H // 4       # 66 x 64

ROWS = ['idle_down', 'idle_left', 'idle_right', 'idle_up']


def frame(r, c):
    y0, x0 = r * CH, c * CW
    crop = a[y0:y0 + CH, x0:x0 + CW]
    d = np.sqrt(((crop - BG) ** 2).sum(2))
    # ⚠ NIE progujemy d bezposrednio — ciemny brzuch/podbrzusze dzika ma d ~5-8,
    #   czyli tyle co tlo, i prog wycinal mu POL CIALA. Zamiast tego: FLOOD-FILL
    #   tla OD KRAWEDZI okna przez piksele "prawie dokladnie tlo" (d<6). Piksel
    #   dzika otoczony dzikiem nie jest osiagalny z zewnatrz -> zostaje. Dziury
    #   wewnetrzne domykamy fill_holes.
    bg_like = d < 6
    seed = np.zeros(bg_like.shape, bool)
    seed[[0, -1], :] = True
    seed[:, [0, -1]] = True
    seed &= bg_like
    outside = ndimage.binary_propagation(seed, mask=bg_like)
    m = ndimage.binary_fill_holes(~outside)
    lbl, n = ndimage.label(m)
    if n == 0:
        return None
    m = lbl == int(np.argmax(ndimage.sum(m, lbl, range(1, n + 1)))) + 1
    m = ndimage.binary_fill_holes(m)
    # MIEKKI CIEN pod dzikiem: prawie NEUTRALNY szary (r-b ~5, chroma ~5),
    #   podczas gdy cialo/nogi/kontur sa BRUNATNE (r-b ~28) albo bardzo ciemne
    #   (kontur lum ~22). Wycinamy tylko pasmo cienia: neutralne + sredni-ciemny.
    lum = 0.30 * crop[:, :, 0] + 0.59 * crop[:, :, 1] + 0.11 * crop[:, :, 2]
    warm = crop[:, :, 0] - crop[:, :, 2]
    shadow = m & (warm < 9) & (lum > 24) & (lum < 60)
    m &= ~shadow
    m = ndimage.binary_fill_holes(m)
    lbl, n = ndimage.label(m)
    if n > 1:
        m = lbl == int(np.argmax(ndimage.sum(m, lbl, range(1, n + 1)))) + 1
    # odetnij osamotnione piksele
    nb = (np.roll(m, 1, 0).astype(int) + np.roll(m, -1, 0)
          + np.roll(m, 1, 1) + np.roll(m, -1, 1))
    m &= ~(m & (nb == 0))
    ys, xs = np.where(m)
    rgba = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
    sub = crop[ys.min():ys.max()+1, xs.min():xs.max()+1]
    mm = m[ys.min():ys.max()+1, xs.min():xs.max()+1]
    rgba[..., :3] = sub
    rgba[mm, 3] = 255
    return rgba


sheets = {}
for r, name in enumerate(ROWS):
    frs = [frame(r, c) for c in range(4)]
    frs = [f for f in frs if f is not None]
    mw = max(f.shape[1] for f in frs) + 4
    mh = max(f.shape[0] for f in frs) + 4
    cells = []
    for f in frs:
        cell = np.zeros((mh, mw, 4), np.uint8)
        h, w = f.shape[:2]
        oy = (mh - 2) - h
        ox = (mw - w) // 2
        cell[oy:oy + h, ox:ox + w] = f
        cells.append(cell)
    sheets[name] = (cells, mw, mh)
    print(f"{name}: canvas {mw}x{mh}, {len(cells)} kl")

# arkusz 4 wiersze x 4 kolumny
CWn = max(sheets[n][1] for n in ROWS)
CHn = max(sheets[n][2] for n in ROWS)
sheet = np.zeros((CHn * 4, CWn * 4, 4), np.uint8)
for r, name in enumerate(ROWS):
    cells, cw, ch = sheets[name]
    for c, cell in enumerate(cells):
        px = (CWn - cw) // 2
        py = CHn - ch
        sheet[r*CHn + py: r*CHn + py + ch, c*CWn + px: c*CWn + px + cw] = cell
Image.fromarray(sheet).save(os.path.join(OUT, 'dzik_idle_clean.png'))
Image.fromarray(sheet).resize((sheet.shape[1]*8, sheet.shape[0]*8), Image.NEAREST).save(
    os.path.join(OUT, 'dzik_idle_clean_8x.png'))

# GIF-y na szarym tle
BGc = (105, 105, 110)
for name, (cells, cw, ch) in sheets.items():
    seq = cells + cells[-2:0:-1]
    imgs = []
    for cell in seq:
        bg = Image.new('RGB', (cw, ch), BGc)
        cim = Image.fromarray(cell)
        bg.paste(cim, (0, 0), cim)
        imgs.append(bg.resize((cw*8, ch*8), Image.NEAREST))
    imgs[0].save(os.path.join(OUT, 'anim_idle_native_' + name + '.gif'),
                 save_all=True, append_images=imgs[1:], duration=280, loop=0, disposal=2)

fmap = {"source": "docs/art-review/dzik/dzik-idle.png",
        "uwaga": "TEST: dzik-idle.png to juz pixel art. Wytniete + kluczowane plaskie tlo, ZERO zmiany kolorow, ZERO downscale.",
        "layout": "4x4 grid, cell 66x64", "animations": {}}
for r, name in enumerate(ROWS):
    cells, cw, ch = sheets[name]
    fmap["animations"][name] = {"row": r, "count": len(cells), "canvas": [cw, ch],
                                "direction": name.split('_')[1]}
json.dump(fmap, open(os.path.join(OUT, 'dzik_idle_clean_frames.json'), 'w', encoding='utf-8'),
          indent=1, ensure_ascii=False)

cols = set()
for name in ROWS:
    for c in sheets[name][0]:
        for px in c[c[..., 3] > 0][:, :3]:
            cols.add(tuple(px))
al = set()
for name in ROWS:
    for c in sheets[name][0]:
        al |= set(np.unique(c[..., 3]).tolist())
print("kolory razem:", len(cols), " alfa:", sorted(al))

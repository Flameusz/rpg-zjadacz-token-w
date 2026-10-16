"""Czysty test zrodla dzik-alt.png: wytnij klatki -> usun tlo+gradient ->
alfa 0/255 (bez AA) -> HARD nearest downscale -> naturalny bounding box.
ZERO redukcji palety, ZERO zmiany kolorow, ZERO posteryzacji. Kolory dzika
zostaja takie, jakie sa w zrodle."""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = r'C:\rpg\docs\art-review\dzik\dzik-alt.png'
OUT = r'C:\rpg\docs\art-review\dzik'

# ramki klatek (zmierzone z rzutow konturu). ATTACK LEFT ma 3.
WINS = {
 'idle_down':   [(100,132,34,85),(153,189,34,85),(211,247,34,85),(267,303,34,85)],
 'walk_left':   [(372,442,92,148),(445,513,92,148),(515,580,92,148),(582,650,92,148),(652,720,92,148)],
 'attack_left': [(824,906,92,148),(914,995,92,148),(1002,1088,92,148)],
}

img = np.array(Image.open(SRC).convert('RGB')).astype(np.int16)


def _largest(m):
    lbl, n = ndimage.label(m)
    if n == 0:
        return m
    return lbl == int(np.argmax(ndimage.sum(m, lbl, range(1, n + 1)))) + 1


def silhouette(crop):
    """Maska dzika. Klucz: REZYDUUM po odjeciu rozmytego obrazu.
      * gladki gradient tla   -> rezyduum ~3    (wypada)
      * MIEKKI CIEN pod dzikiem-> rezyduum ~7-13 (wypada — to jego zaleta, cien
        jest gladki, wiec sam odpada bez recznego wycinania)
      * cialo/nogi/kontur dzika-> rezyduum ~20-70 (zostaje)
    Zadnego progu na luminancje — to on wciagal cien (cien ma lum ~58)."""
    c = crop.astype(float)
    blur = np.stack([ndimage.gaussian_filter(c[:, :, k], 7) for k in range(3)], -1)
    resid = np.abs(c - blur).sum(2)
    fg = resid > 17
    fg = ndimage.binary_closing(fg, structure=np.ones((3, 3)), iterations=2)
    fg = ndimage.binary_opening(fg, iterations=1)
    # wytnij pasek 2 px przy krawedziach okna (dzieliki sekcji / etykiety)
    fg[:2, :] = fg[-2:, :] = fg[:, :2] = fg[:, -2:] = False
    m = _largest(fg)
    if m.sum() == 0:
        return m
    # domknij sylwetke: flood-fill tla od krawedzi okna, reszta = dzik
    pad = np.pad(~m, 1, constant_values=True)
    outside = ndimage.binary_propagation(
        np.pad(np.zeros_like(m, bool), 1, constant_values=True), mask=pad)[1:-1, 1:-1]
    m = ~outside
    m = _largest(m)
    for _ in range(2):
        nb = (np.roll(m, 1, 0).astype(int) + np.roll(m, -1, 0)
              + np.roll(m, 1, 1) + np.roll(m, -1, 1))
        m &= ~(m & (nb <= 1))
    return _largest(m)


def deAA(crop, m):
    """Usun AA/polprzezroczyste krawedzie: pierscien brzegowy maski (1 px)
    zastap kolorem najblizszego piksela WNETRZA. Potem wnetrze ma twarda krawedz,
    a nearest-downscale nie zlapie zmieszanych pikseli tla."""
    inner = ndimage.binary_erosion(m)
    edge = m & ~inner
    out = crop.copy()
    if edge.any() and inner.any():
        iy, ix = np.where(inner)
        ey, ex = np.where(edge)
        # najblizszy piksel wnetrza (feature transform)
        idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
        out[edge] = crop[idx[0][edge], idx[1][edge]]
    return out


def hard_nn(rgb, m, scale):
    """Czysty nearest: dla piksela docelowego probkuj JEDEN piksel zrodla.
    Maska probkowana tak samo -> alfa 0/255."""
    H, W = m.shape
    nh, nw = max(1, round(H * scale)), max(1, round(W * scale))
    sy = np.clip(np.round((np.arange(nh) + 0.5) / scale - 0.5).astype(int), 0, H - 1)
    sx = np.clip(np.round((np.arange(nw) + 0.5) / scale - 0.5).astype(int), 0, W - 1)
    col = rgb[np.ix_(sy, sx)]
    mm = m[np.ix_(sy, sx)]
    out = np.zeros((nh, nw, 4), np.uint8)
    out[..., :3] = col
    out[..., 3] = np.where(mm, 255, 0)
    # domknij ewentualne 1px dziury po probkowaniu
    op = out[..., 3] > 0
    holes = ndimage.binary_fill_holes(op) & ~op
    for y, x in zip(*np.where(holes)):
        nbp = out[max(0, y-1):y+2, max(0, x-1):x+2]
        v = nbp[nbp[..., 3] > 0]
        if len(v):
            out[y, x, :3] = v[:, :3].mean(0).astype(np.uint8)
            out[y, x, 3] = 255
    # odetnij osamotnione piksele
    op = out[..., 3] > 0
    nb = (np.roll(op, 1, 0).astype(int) + np.roll(op, -1, 0)
          + np.roll(op, 1, 1) + np.roll(op, -1, 1))
    out[op & (nb == 0)] = 0
    return out


# ── przetworz ──
raw = {}
for anim, wins in WINS.items():
    frs = []
    for (x0, x1, y0, y1) in wins:
        crop = img[y0:y1, x0:x1]
        m = silhouette(crop)
        rgb = deAA(crop, m).astype(np.uint8)
        ys, xs = np.where(m)
        frs.append((rgb[ys.min():ys.max()+1, xs.min():xs.max()+1],
                    m[ys.min():ys.max()+1, xs.min():xs.max()+1]))
    raw[anim] = frs

# wspolna skala tak, zeby bok dzika mial ~46 px (naturalna wielkosc,
# porownywalna z obecnym dzikiem 28px @ scale 2.1 ~ 59px), front ~ ta sama skala
side_w = np.median([f[1].shape[1] for f in raw['walk_left']])
SCALE = 46.0 / side_w
print("skala wspolna %.3f (bok zrodla ~%d px -> ~46 px)" % (SCALE, side_w))

small = {}
for anim, frs in raw.items():
    ss = [hard_nn(rgb, m, SCALE) for (rgb, m) in frs]
    small[anim] = ss

# canvas per animacja = max bbox + 3 px margines, kotwica: stopy 2 px od dolu, srodek x
sheets = {}
for anim, ss in small.items():
    maxw = max(s.shape[1] for s in ss)
    maxh = max(s.shape[0] for s in ss)
    cw, ch = maxw + 6, maxh + 5
    cells = []
    for s in ss:
        cell = np.zeros((ch, cw, 4), np.uint8)
        ys, xs = np.where(s[..., 3] > 0)
        cx = int(round((xs.min() + xs.max()) / 2))
        oy = (ch - 3) - ys.max()
        ox = cw // 2 - cx
        for (y, x) in zip(ys, xs):
            ty, tx = y + oy, x + ox
            if 0 <= ty < ch and 0 <= tx < cw:
                cell[ty, tx] = s[y, x]
        cells.append(cell)
    sheets[anim] = (cells, cw, ch)
    print(f"{anim}: canvas {cw}x{ch}, {len(cells)} klatek")

# ── arkusz: kazda animacja wlasny wiersz, wspolna wysokosc komorki ──
order = ['idle_down', 'walk_left', 'attack_left']
CW = max(sheets[a][1] for a in order)
CH = max(sheets[a][2] for a in order)
ncols = max(len(sheets[a][0]) for a in order)
sheet = np.zeros((CH * 3, CW * ncols, 4), np.uint8)
fmap = {"source": "docs/art-review/dzik/dzik-alt.png",
        "uwaga": "TEST WIERNOSCI ZRODLA: oryginalne kolory dzika, bez redukcji palety. Nie wpiete do gry.",
        "cell": [CW, CH], "scale_from_source": round(SCALE, 3), "animations": {}}
for r, anim in enumerate(order):
    cells, cw, ch = sheets[anim]
    padx = (CW - cw) // 2
    pady = CH - ch
    for c, cell in enumerate(cells):
        sheet[r*CH + pady: r*CH + pady + ch, c*CW + padx: c*CW + padx + cw] = cell
    fmap["animations"][anim] = {"row": r, "count": len(cells), "direction": anim.split('_')[1],
                                "canvas": [cw, ch],
                                "fps_sugerowane": {"idle_down": 3, "walk_left": 8, "attack_left": 10}[anim]}
fmap["animations"]["attack_left"]["uwaga"] = "dzik-alt ma w rzedzie ATTACK LEFT tylko 3 klatki"

Image.fromarray(sheet).save(os.path.join(OUT, 'dzik_alt_faithful.png'))
json.dump(fmap, open(os.path.join(OUT, 'dzik_alt_faithful_frames.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
Image.fromarray(sheet).resize((sheet.shape[1]*8, sheet.shape[0]*8), Image.NEAREST).save(
    os.path.join(OUT, 'dzik_alt_faithful_8x.png'))

# GIF-y na neutralnym szarym tle (zeby ocenic sam kolor dzika)
BGc = (105, 105, 110)
for anim, (cells, cw, ch) in sheets.items():
    pp = anim == 'idle_down'
    ms = {'idle_down': 260, 'walk_left': 110, 'attack_left': 120}[anim]
    seq = cells + cells[-2:0:-1] if pp else cells
    imgs = []
    for cell in seq:
        bg = Image.new('RGB', (cw, ch), BGc)
        cim = Image.fromarray(cell)
        bg.paste(cim, (0, 0), cim)
        imgs.append(bg.resize((cw*8, ch*8), Image.NEAREST))
    imgs[0].save(os.path.join(OUT, 'anim_faithful_' + anim + '.gif'), save_all=True,
                 append_images=imgs[1:], duration=ms, loop=0, disposal=2)
    strip = np.concatenate([np.pad(c, ((0, 0), (0, cw - c.shape[1]), (0, 0))) if c.shape[1] < cw else c
                            for c in cells], 1)
    Image.fromarray(strip).resize((strip.shape[1]*9, ch*9), Image.NEAREST).save(
        os.path.join(OUT, 'faithful_strip_' + anim + '.png'))

# raport kolorow (ile odcieni zachowanych)
for anim, (cells, cw, ch) in sheets.items():
    cols = set()
    for c in cells:
        for px in c[c[..., 3] > 0][:, :3]:
            cols.add(tuple(px))
    al = set()
    for c in cells:
        al |= set(np.unique(c[..., 3]).tolist())
    print(f"  {anim:12} kolorow={len(cols)}  alfa={sorted(al)}")

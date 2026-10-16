"""Test: 14 klatek dzika z dzik-gpt.png -> 32x32 pixel-art, paleta swiata, alfa 0/255.
Pipeline: wytnij -> maska -> klasa tonu (futro/grzywa/kiel/oko) + stopien rampy z
luminancji (percentyle per klatka, jak stopnie_na_kolory w build_drzewa) ->
twardy downscale (mode klasy + srednia luminancji w bloku) -> kontur -> czyszczenie.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = r'C:\rpg\docs\art-review\dzik-gpt.png'
OUT = r'C:\rpg\docs\art-review\dzik'
os.makedirs(OUT, exist_ok=True)
T = 32
BG = np.array([26, 27, 29])

def hx(s): return tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
PAL = json.load(open(r'C:\rpg\docs\paleta.json', encoding='utf-8'))
FUR  = np.array([hx(c) for c in PAL['ziemia']])        # 0..4 ciemny->jasny cieply braz
MANE = np.array([hx(c) for c in PAL['kora']])          # 0..4 ciemny chlodny braz
TUSK = np.array([hx(PAL['piasek'][3]), hx(PAL['piasek'][4])])
EYE_D = np.array(hx(PAL['neutralne'][0]))
EYE_L = np.array(hx(PAL['neutralne'][5]))
SNOUT = np.array(hx(PAL['akcent_cieply'][2]))

# klasy tonu: 0=futro 1=grzywa/nogi 2=kiel 3=oko-jasne 4=ryj
FRAMES = {
 'idle_down': [(858,915,55,130),(953,1009,60,130),(1044,1101,60,130),(1135,1191,60,130)],
 'walk_left': [(72,152,458,518),(163,244,458,518),(251,330,458,520),(343,424,458,520),(449,531,458,520)],
 'attack_left': [(699,782,462,520),(797,881,462,518),(892,976,464,522),(991,1074,466,520)],
}
img = np.array(Image.open(SRC).convert('RGB')).astype(float)


def mask_of(crop):
    d = np.sqrt(((crop - BG) ** 2).sum(2))
    core = d > 30
    soft = d > 16
    lbl, _ = ndimage.label(soft)
    keep = list(set(np.unique(lbl[core])) - {0})
    m = np.isin(lbl, keep)
    # najwiekszy komponent, wygladzenie
    lbl2, n2 = ndimage.label(m)
    if n2 > 1:
        sizes = ndimage.sum(m, lbl2, range(1, n2 + 1))
        m = lbl2 == (int(np.argmax(sizes)) + 1)
    m = ndimage.binary_closing(m, iterations=1)
    m = ndimage.binary_opening(m, iterations=1)
    m = ndimage.binary_fill_holes(m)
    return m


def classify(crop, m, side):
    r, g, b = crop[:, :, 0], crop[:, :, 1], crop[:, :, 2]
    lum = 0.30 * r + 0.59 * g + 0.11 * b
    cls = np.zeros(m.shape, int)                 # 0 futro
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    H = y1 - y0 + 1
    yy = np.arange(crop.shape[0])[:, None]
    # 1 = GRZYWA/NOGI: ciemne. Grzywa siedzi w gornej 45% ciala; nogi w dolnej 25%.
    dark = m & (lum < np.percentile(lum[m], 34))
    top = yy < y0 + 0.46 * H
    bot = yy > y0 + 0.74 * H
    cls[dark & (top | bot)] = 1
    # 2 = KIEL: jasny, KREMOWY (nie ciepло-czerwony), maly klaster przy pysku.
    fx0, fx1 = (x0, x0 + 0.42 * (x1 - x0)) if side else (x0, x1)
    xx = np.arange(crop.shape[1])[None, :]
    front = (xx >= fx0) & (xx <= fx1)
    lowmid = yy > y0 + 0.45 * H
    tusk = m & (lum > 128) & (np.abs(r - g) < 34) & (b - g > -34) & front & lowmid
    lbl, n = ndimage.label(tusk)
    for i in range(1, n + 1):
        if (lbl == i).sum() < 4:
            tusk[lbl == i] = False
    cls[tusk] = 2
    return cls, lum


def hard_resize(m, cls, lum, scale):
    H, W = m.shape
    nh, nw = max(1, round(H * scale)), max(1, round(W * scale))
    out_m = np.zeros((nh, nw), bool)
    out_c = np.zeros((nh, nw), int)
    out_l = np.zeros((nh, nw), float)
    for j in range(nh):
        y0 = int(j / scale); y1 = min(int((j + 1) / scale) + 1, H)
        for i in range(nw):
            x0 = int(i / scale); x1 = min(int((i + 1) / scale) + 1, W)
            bm = m[y0:y1, x0:x1]
            if bm.mean() < 0.45:
                continue
            out_m[j, i] = True
            bc = cls[y0:y1, x0:x1][bm]
            for pri in (2, 1):                          # kiel > grzywa > futro
                if (bc == pri).sum() >= max(1, 0.28 * bc.size):
                    out_c[j, i] = pri; break
            else:
                out_c[j, i] = 0
            out_l[j, i] = lum[y0:y1, x0:x1][bm].mean()
    return out_m, out_c, out_l


def colorize(m, cls, lum):
    H, W = m.shape
    rgba = np.zeros((H, W, 4), np.uint8)
    fur_l = lum[m & (cls == 0)]
    mane_l = lum[m & (cls == 1)]
    def step(v, arr, n, lop=18, hip=90):
        if len(arr) < 3: return n // 2
        lo, hi = np.percentile(arr, lop), np.percentile(arr, hip)
        if hi - lo < 1e-6: return n // 2
        return int(np.clip((v - lo) / (hi - lo) * (n - 1), 0, n - 1))
    for y, x in zip(*np.where(m)):
        c = cls[y, x]
        if c == 0:
            rgba[y, x, :3] = FUR[1 + step(lum[y, x], fur_l, 3)]      # FUR 1..3 (cieply braz)
        elif c == 1:
            rgba[y, x, :3] = MANE[step(lum[y, x], mane_l, 3)]         # MANE 0..2
        elif c == 2:
            rgba[y, x, :3] = TUSK[1]
        rgba[y, x, 3] = 255
    return rgba


def outline_and_clean(rgba, side):
    m = rgba[:, :, 3] > 0
    # 1) sylwetka: najwiekszy komponent, usun kolce (piksele z <2 sasiadami 4-kier)
    lbl, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lbl, range(1, n + 1))
        m = lbl == (int(np.argmax(sizes)) + 1)
    for _ in range(2):
        nb = (np.roll(m, 1, 0).astype(int) + np.roll(m, -1, 0)
              + np.roll(m, 1, 1) + np.roll(m, -1, 1))
        m &= ~((m) & (nb <= 1))
    m = ndimage.binary_fill_holes(m)
    rgba[~m] = 0
    # 2) wypelnij dziury kolorem sasiada
    for y, x in zip(*np.where(m & (rgba[:, :, 3] == 0))):
        nb = rgba[max(0,y-1):y+2, max(0,x-1):x+2]
        op = nb[nb[:, :, 3] > 0][:, :3]
        if len(op):
            uq, cnt = np.unique(op, axis=0, return_counts=True)
            rgba[y, x, :3] = uq[cnt.argmax()]
        else:
            rgba[y, x, :3] = FUR[2]
        rgba[y, x, 3] = 255
    # 3) pelny kontur 1 px (MANE[0]) na wewnetrznym brzegu — poza klami
    inner = m & ~ndimage.binary_erosion(m)
    tset = {tuple(TUSK[0]), tuple(TUSK[1])}
    for y, x in zip(*np.where(inner)):
        if tuple(rgba[y, x, :3]) not in tset:
            rgba[y, x, :3] = MANE[0]
    # 4) oko: ciemny 1 px na glowie
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    ex = int(round(x0 + (0.19 if side else 0.5) * (x1 - x0)))
    ey = int(round(y0 + (0.34 if side else 0.32) * (y1 - y0)))
    if 0 <= ey < rgba.shape[0] and 0 <= ex < rgba.shape[1] and rgba[ey, ex, 3] > 0:
        rgba[ey, ex, :3] = EYE_D
    return rgba


def tight(m):
    ys, xs = np.where(m)
    return ys.min(), ys.max(), xs.min(), xs.max()


def walk_cycle_legs(cells):
    """WALK LEFT: czytelny cykl chodu WYLACZNIE przez operacje na istniejacych
    pikselach pasa lap (ponizej brzucha): przyciecie 1-2 dolnych rzedow jednej
    polowy (lapa uniesiona) na przemian z druga + drift 1 px w poziomie.
    Zaden nowy piksel, korpus nietkniety. Najczytelniejszy sygnal chodu przy
    32 px to naprzemienna GLEBOKOSC lapy przod/tyl, nie jej pozioma pozycja."""
    #             f0    f1    f2    f3    f4
    front_trim = [0,    0,    0,    1,    2]     # przod: stance f0-f2, wykrok f3-f4
    back_trim  = [2,    1,    0,    0,    0]     # tyl w przeciwfazie: wykrok f0-f1, stance f2-f4
    front_dx   = [+1,   0,    0,   -1,   -1]     # przod: wymach do przodu -> plant -> ciagniecie w tyl
    back_dx    = [-1,  -1,    0,   +1,   +1]     # tyl: przeciwfaza
    out = []
    for f, cell in enumerate(cells):
        c = cell.copy()
        ys, xs = np.where(c[:, :, 3] > 0)
        y1 = ys.max()
        cx = float(np.median(xs))
        belly = y1 - 3
        for half, trim, dx in (('F', front_trim[f], front_dx[f]),
                               ('B', back_trim[f], back_dx[f])):
            sel = lambda x: (x < cx) == (half == 'F')
            # 1) przyciecie: usun `trim` najnizszych rzedow tej polowy
            for k in range(trim):
                y = y1 - k
                for x in range(c.shape[1]):
                    if c[y, x, 3] and sel(x):
                        c[y, x] = 0
            # 2) drift poziomy pozostalych pikseli lapy
            if dx:
                take = []
                for y in range(belly + 1, y1 + 1):
                    for x in range(c.shape[1]):
                        if c[y, x, 3] and sel(x):
                            take.append((y, x, c[y, x].copy())); c[y, x] = 0
                for (y, x, col) in take:
                    nx = x + dx
                    if 0 <= nx < c.shape[1]:
                        c[y, nx] = col
        # usun osamotnione piksele
        band = c[belly + 1:, :, 3] > 0
        nb = (np.roll(band, 1, 0).astype(int) + np.roll(band, -1, 0)
              + np.roll(band, 1, 1) + np.roll(band, -1, 1))
        for (y, x) in zip(*np.where(band & (nb == 0))):
            c[belly + 1 + y, x] = 0
        out.append(c)
    return out


processed = {}
for anim, wins in FRAMES.items():
    side = 'left' in anim
    prep = []
    for (x0, x1, y0, y1) in wins:
        crop = img[y0:y1, x0:x1]
        m = mask_of(crop)
        cls, lum = classify(crop, m, side)
        y0b, y1b, x0b, x1b = tight(m)
        prep.append((m[y0b:y1b+1, x0b:x1b+1], cls[y0b:y1b+1, x0b:x1b+1], lum[y0b:y1b+1, x0b:x1b+1]))
    metric = [(p[0].shape[1] if side else p[0].shape[0]) for p in prep]
    target = 26 if side else 25
    scale = target / float(np.median(metric))
    cells = []
    for (m, cls, lum) in prep:
        sm, sc, sl = hard_resize(m, cls, lum, scale)
        rgba = outline_and_clean(colorize(sm, sc, sl), side)
        cell = np.zeros((T, T, 4), np.uint8)
        ys, xs = np.where(rgba[:, :, 3] > 0)
        cx = int(round(np.median(xs))); oy = 30 - ys.max(); ox = T // 2 - cx
        for (yy, xx) in zip(ys, xs):
            ty, tx = yy + oy, xx + ox
            if 0 <= ty < T and 0 <= tx < T:
                cell[ty, tx] = rgba[yy, xx]
        cells.append(cell)
    if anim == 'walk_left':
        cells = walk_cycle_legs(cells)
    processed[anim] = cells
    print(f"{anim}: {len(cells)} klatek, metric={metric}, scale={scale:.3f}")

order = ['idle_down', 'walk_left', 'attack_left']
sheet = np.zeros((T * 3, T * 6, 4), np.uint8)
fmap = {"tile": T, "sheet": "dzik_test.png", "cols": 6, "rows": 3, "animations": {}}
for r, anim in enumerate(order):
    for c, cell in enumerate(processed[anim]):
        sheet[r*T:(r+1)*T, c*T:(c+1)*T] = cell
    fmap["animations"][anim] = {"row": r, "count": len(processed[anim]),
        "frames": list(range(len(processed[anim]))), "direction": anim.split('_')[1], "note": ""}
fmap["animations"]["walk_left"]["note"] = "GPT dostarczyl tylko 5 klatek WALK LEFT (mimo etykiety '6 klatek')"
Image.fromarray(sheet).save(os.path.join(OUT, 'dzik_test.png'))
json.dump(fmap, open(os.path.join(OUT, 'dzik_test_frames.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
Image.fromarray(sheet).resize((T*6*9, T*3*9), Image.NEAREST).save(os.path.join(OUT, 'dzik_test_9x.png'))

print("\n== KONTROLA ==")
for anim in order:
    cs = processed[anim]
    hs = [int((c[:, :, 3] > 0).any(1).sum()) for c in cs]
    ws = [int((c[:, :, 3] > 0).any(0).sum()) for c in cs]
    feet = [int(np.where(c[:, :, 3].any(1))[0].max()) for c in cs]
    cxs = [round(float(np.median(np.where(c[:, :, 3] > 0)[1])), 1) for c in cs]
    ncol = set()
    for c in cs:
        for px in c[c[:, :, 3] > 0][:, :3]: ncol.add(tuple(px))
    al = set()
    for c in cs: al |= set(np.unique(c[:, :, 3]).tolist())
    print(f"  {anim:12} wys={hs} szer={ws} stopy={feet} srodek_x={cxs} alfa={sorted(al)} kolory={len(ncol)}")

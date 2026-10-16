"""Test 14 klatek: dzik-alt.png -> 32x32 pixel-art.
Pipeline: wytniecie okna -> maska (tlo=gradient -> klucz lokalny, najwiekszy
komponent) -> redukcja palety (klasa tonu + stopien rampy z luminancji) ->
twardy downscale nearest -> ZACHOWANY oryginalny kontur -> alfa 0/255.
BEZ doprawiania animacji: ruch nog i pozy prosto ze zrodla."""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = r'C:\rpg\docs\art-review\dzik\dzik-alt.png'
OUT = r'C:\rpg\docs\art-review\dzik'
T = 32

def hx(s): return tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
PAL = json.load(open(r'C:\rpg\docs\paleta.json', encoding='utf-8'))
FUR   = np.array([hx(c) for c in PAL['ziemia']])      # 0..4
MANE  = np.array([hx(c) for c in PAL['kora']])        # 0..4 (grzywa/nogi/kontur)
TUSK  = np.array([hx(PAL['piasek'][3]), hx(PAL['piasek'][4])])
EYE_D = np.array(hx(PAL['neutralne'][0]))
EYE_L = np.array(hx(PAL['neutralne'][5]))

img = np.array(Image.open(SRC).convert('RGB')).astype(float)

# ramki klatek zmierzone z dzik-alt.png (rzuty konturu). ATTACK LEFT ma 3, nie 4.
WINS = {
 'idle_down':   [(96,132,33,85),(151,190,33,85),(209,248,33,85),(265,304,33,85)],
 'walk_left':   [(372,442,93,147),(445,513,93,147),(515,580,93,147),(582,650,93,147),(652,720,93,147)],
 'attack_left': [(824,906,93,147),(914,995,93,147),(1002,1086,93,147)],
}

def mask_local(crop):
    """Tlo dzik-alt to GRADIENT -> nie da sie kluczowac kolorem. Dwie drogi
    zlaczone: (a) rezyduum po odjeciu mocno rozmytego obrazu (gradient znika,
    dzik ma fakture/kontur -> zostaje); (b) narysowany ciemny kontur.
    Suma -> domkniecie -> wypelnienie -> najwiekszy komponent."""
    r, g, b = crop[:, :, 0], crop[:, :, 1], crop[:, :, 2]
    lum = 0.30 * r + 0.59 * g + 0.11 * b
    blur = np.stack([ndimage.gaussian_filter(crop[:, :, k], 9) for k in range(3)], -1)
    resid = np.abs(crop - blur).sum(2)
    fg = (resid > 14) | (lum < 58)
    fg = ndimage.binary_closing(fg, structure=np.ones((3, 3)), iterations=2)
    fg = ndimage.binary_fill_holes(fg)
    fg = ndimage.binary_opening(fg, iterations=2)          # zetnij cienkie linie ramek/etykiet
    lbl, n = ndimage.label(fg)
    if n == 0:
        return fg, lum
    sizes = ndimage.sum(fg, lbl, range(1, n + 1))
    m = lbl == int(np.argmax(sizes)) + 1
    m = ndimage.binary_fill_holes(m)
    # odetnij cienkie wypustki (piksele z <2 sasiadami), potem znow najwiekszy
    for _ in range(2):
        nb = (np.roll(m, 1, 0).astype(int) + np.roll(m, -1, 0)
              + np.roll(m, 1, 1) + np.roll(m, -1, 1))
        m &= ~(m & (nb <= 1))
    lbl, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lbl, range(1, n + 1))
        m = lbl == int(np.argmax(sizes)) + 1
    return m, lum

def classify(crop, m, lum, side):
    r, g, b = crop[:, :, 0], crop[:, :, 1], crop[:, :, 2]
    cls = np.zeros(m.shape, int)                       # 0 futro
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    H = y1 - y0 + 1
    yy = np.arange(crop.shape[0])[:, None]
    dark = m & (lum < np.percentile(lum[m], 26))
    # 1 = GRZYWA/NOGI: ciemne, w gornej 46% (grzywa) lub dolnej 30% (nogi) ciala.
    # Nogi to najciemniejsze w dolnym pasie — trzymaj je jako klase priorytetowa,
    # zeby przetrwaly downscale (patrz hard_resize: klasa 1 nadpisuje futro przy 1 px).
    cls[dark & ((yy < y0 + 0.46 * H) | (yy > y0 + 0.70 * H))] = 1
    # 2 = KIEL: jasny kremowy klaster przy pysku
    tusk = m & (lum > 150) & (np.abs(r - g) < 42) & (b - g > -42)
    lbl, n = ndimage.label(tusk)
    for i in range(1, n + 1):
        if (lbl == i).sum() < 3:
            tusk[lbl == i] = False
    cls[tusk] = 2
    return cls, lum

def hard_resize(m, cls, lum, scale):
    H, W = m.shape
    nh, nw = max(1, round(H * scale)), max(1, round(W * scale))
    om = np.zeros((nh, nw), bool); oc = np.zeros((nh, nw), int); ol = np.zeros((nh, nw))
    edge_src = m & ~ndimage.binary_erosion(m)          # brzeg sylwetki w skali zrodla
    for j in range(nh):
        y0 = int(j / scale); y1 = min(int((j + 1) / scale) + 1, H)
        for i in range(nw):
            x0 = int(i / scale); x1 = min(int((i + 1) / scale) + 1, W)
            bm = m[y0:y1, x0:x1]
            if bm.size == 0 or bm.mean() < 0.45:
                continue
            om[j, i] = True
            bc = cls[y0:y1, x0:x1][bm]
            below = j > nh * 0.62                       # dolny pas -> nogi wazniejsze
            if (bc == 2).sum() >= max(1, 0.30 * bc.size):
                oc[j, i] = 2
            elif (bc == 1).sum() >= (1 if below else max(1, 0.30 * bc.size)):
                oc[j, i] = 1                            # noga/grzywa: przetrwa nawet 1 px w bloku (dol)
            ol[j, i] = lum[y0:y1, x0:x1][bm].mean()
    # wygladz sylwetke docelowa (zamkniecie + wypelnienie) -> kontur bedzie rowny
    om = ndimage.binary_closing(om, iterations=1)
    om = ndimage.binary_fill_holes(om)
    lbl, n = ndimage.label(om)
    if n > 1:
        s = ndimage.sum(om, lbl, range(1, n + 1)); om = lbl == int(np.argmax(s)) + 1
    return om, oc, ol

def colorize(m, cls, lum):
    rgba = np.zeros((*m.shape, 4), np.uint8)
    fl = lum[m & (cls == 0)]; ml = lum[m & np.isin(cls, [1])]
    def st(v, arr, n, lop=20, hip=80):
        if len(arr) < 3: return n // 2
        lo, hi = np.percentile(arr, lop), np.percentile(arr, hip)
        if hi - lo < 1e-6: return n // 2
        return int(np.clip((v - lo) / (hi - lo) * (n - 1), 0, n - 1))
    for y, x in zip(*np.where(m)):
        c = cls[y, x]
        if c == 3:
            rgba[y, x, :3] = MANE[0]
        elif c == 2:
            rgba[y, x, :3] = TUSK[1]
        elif c == 1:
            rgba[y, x, :3] = MANE[st(lum[y, x], ml if len(ml) else fl, 3)]
        else:
            rgba[y, x, :3] = FUR[2 + st(lum[y, x], fl, 3)]      # FUR 2..4 (cieply, jasniejszy korpus)
        rgba[y, x, 3] = 255
    return rgba

def finish(rgba, side):
    m = rgba[:, :, 3] > 0
    lbl, n = ndimage.label(m)
    if n > 1:
        s = ndimage.sum(m, lbl, range(1, n + 1))
        m = lbl == int(np.argmax(s)) + 1
    for _ in range(2):
        nb = (np.roll(m, 1, 0).astype(int) + np.roll(m, -1, 0)
              + np.roll(m, 1, 1) + np.roll(m, -1, 1))
        m &= ~(m & (nb <= 1))
    m = ndimage.binary_fill_holes(m)
    rgba[~m] = 0
    for y, x in zip(*np.where(m & (rgba[:, :, 3] == 0))):
        nbp = rgba[max(0, y-1):y+2, max(0, x-1):x+2]
        op = nbp[nbp[:, :, 3] > 0][:, :3]
        rgba[y, x, :3] = (np.unique(op, axis=0)[0] if len(op) else FUR[2])
        rgba[y, x, 3] = 255
    # domknij kontur: brzeg sylwetki bez kla -> MANE[0]
    inner = m & ~ndimage.binary_erosion(m)
    ts = {tuple(TUSK[0]), tuple(TUSK[1])}
    for y, x in zip(*np.where(inner)):
        if tuple(rgba[y, x, :3]) not in ts:
            rgba[y, x, :3] = MANE[0]
    # oko
    ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    ex = int(round(x0 + (0.17 if side else 0.5) * (x1 - x0)))
    ey = int(round(y0 + (0.34 if side else 0.32) * (y1 - y0)))
    if 0 <= ey < rgba.shape[0] and 0 <= ex < rgba.shape[1] and rgba[ey, ex, 3] > 0:
        rgba[ey, ex, :3] = EYE_D
    return rgba

processed = {}
for anim, wins in WINS.items():
    side = 'left' in anim
    prep = []
    for (x0, x1, y0, y1) in wins:
        crop = img[y0:y1, x0:x1]
        m, lum = mask_local(crop)
        cls, lum = classify(crop, m, lum, side)
        ys, xs = np.where(m)
        sl = (slice(ys.min(), ys.max()+1), slice(xs.min(), xs.max()+1))
        prep.append((m[sl], cls[sl], lum[sl]))
    metric = [(p[0].shape[1] if side else p[0].shape[0]) for p in prep]
    target = 27 if side else 25
    scale = target / float(np.median(metric))
    cells = []
    for p in prep:
        sm, sc, sl = hard_resize(*p, scale)
        rgba = finish(colorize(sm, sc, sl), side)
        cell = np.zeros((T, T, 4), np.uint8)
        ys, xs = np.where(rgba[:, :, 3] > 0)
        ox = T // 2 - int(round(np.median(xs))); oy = 30 - ys.max()
        for (yy, xx) in zip(ys, xs):
            ty, tx = yy + oy, xx + ox
            if 0 <= ty < T and 0 <= tx < T:
                cell[ty, tx] = rgba[yy, xx]
        cells.append(cell)
    processed[anim] = cells
    print(f"{anim}: {len(cells)} kl, metric={metric}, scale={scale:.3f}")

order = ['idle_down', 'walk_left', 'attack_left']
sheet = np.zeros((T * 3, T * 5, 4), np.uint8)
fmap = {"tile": T, "sheet": "dzik_alt_test.png", "source": "docs/art-review/dzik/dzik-alt.png",
        "cols": 5, "rows": 3, "animations": {}}
for r, anim in enumerate(order):
    for c, cell in enumerate(processed[anim]):
        sheet[r*T:(r+1)*T, c*T:(c+1)*T] = cell
    fmap["animations"][anim] = {"row": r, "count": len(processed[anim]),
        "frames": list(range(len(processed[anim]))), "direction": anim.split('_')[1],
        "fps_sugerowane": {"idle_down": 3, "walk_left": 8, "attack_left": 10}[anim]}
Image.fromarray(sheet).save(os.path.join(OUT, 'dzik_alt_test.png'))
json.dump(fmap, open(os.path.join(OUT, 'dzik_alt_test_frames.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
Image.fromarray(sheet).resize((T*5*9, T*3*9), Image.NEAREST).save(os.path.join(OUT, 'dzik_alt_test_9x.png'))
for anim in order:
    strip = np.concatenate(processed[anim], 1)
    Image.fromarray(strip).resize((strip.shape[1]*10, T*10), Image.NEAREST).save(
        os.path.join(OUT, f'alt_strip_{anim}.png'))

print("\n== KONTROLA ==")
for anim in order:
    cs = processed[anim]
    hs = [int((c[:, :, 3] > 0).any(1).sum()) for c in cs]
    ws = [int((c[:, :, 3] > 0).any(0).sum()) for c in cs]
    feet = [int(np.where(c[:, :, 3].any(1))[0].max()) for c in cs]
    ncol = set()
    for c in cs:
        for px in c[c[:, :, 3] > 0][:, :3]: ncol.add(tuple(px))
    al = set()
    for c in cs: al |= set(np.unique(c[:, :, 3]).tolist())
    print(f"  {anim:12} wys={hs} szer={ws} stopy={feet} alfa={sorted(al)} kolory={len(ncol)}")

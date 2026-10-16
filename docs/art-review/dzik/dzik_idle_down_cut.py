"""dzik-idle.png = GOTOWE zrodlo po recznym Pixel Snapperze.
TYLKO: wytnij sprite z tla + alfa. ZERO obrobki pikseli.

Metoda: tlo to plaski neutralny szary ~(36,36,36). Miedzy tlem (d<=6) a
sprite'em (d>=11) jest PUSTA luka w histogramie -> prog w luce nic nie
uszkadza. Flood-fill tla OD KRAWEDZI okna: kasujemy WYLACZNIE piksele tla
polaczone z brzegiem. Piksel sprite'a (nawet ciemny) otoczony sprite'em
nie jest osiagalny -> zostaje 1:1. Bez fill_holes, bez usuwania wysepek,
bez wycinania cienia, bez najwiekszego komponentu.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = r'C:\rpg\docs\art-review\dzik\dzik-idle.png'
OUT = r'C:\rpg\docs\art-review\dzik'

a = np.array(Image.open(SRC).convert('RGB'))
H, W = a.shape[:2]
CW, CH = W // 4, H // 4                       # 66 x 64
d = np.sqrt(((a.astype(np.int32) - 36) ** 2).sum(2))     # dystans od tla

IDLE_DOWN_ROW = 0


def cut(r, c):
    y0, x0 = r * CH, c * CW
    dd = d[y0:y0 + CH, x0:x0 + CW]
    rgb = a[y0:y0 + CH, x0:x0 + CW]
    bg_like = dd < 9                          # prog w PUSTEJ luce histogramu (6..11)
    seed = np.zeros_like(bg_like)
    seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    seed &= bg_like
    bg = ndimage.binary_propagation(seed, mask=bg_like)   # tlo = to, co siega brzegu
    sprite = ~bg
    out = np.zeros((CH, CW, 4), np.uint8)
    out[..., :3] = rgb                        # RGB 1:1, nietkniete
    out[sprite, 3] = 255
    ys, xs = np.where(sprite)
    return out[ys.min():ys.max() + 1, xs.min():xs.max() + 1], int(sprite.sum())


frames = []
for c in range(4):
    fr, n = cut(IDLE_DOWN_ROW, c)
    frames.append(fr)
    print(f"IDLE DOWN f{c}: {fr.shape[1]}x{fr.shape[0]} px, {n} pikseli sprite'a")

# arkusz: wspolna komorka = max bbox + 2 px margines, kotwica: dol+srodek
mw = max(f.shape[1] for f in frames) + 2
mh = max(f.shape[0] for f in frames) + 2
sheet = np.zeros((mh, mw * 4, 4), np.uint8)
for i, f in enumerate(frames):
    h, w = f.shape[:2]
    oy = mh - 1 - h
    ox = i * mw + (mw - w) // 2
    sheet[oy:oy + h, ox:ox + w] = f
Image.fromarray(sheet).save(os.path.join(OUT, 'dzik_idle_down_cut.png'))
Image.fromarray(sheet).resize((sheet.shape[1] * 8, sheet.shape[0] * 8), Image.NEAREST).save(
    os.path.join(OUT, 'dzik_idle_down_cut_8x.png'))

# GIF na szarym tle (do ogladania ruchu)
BGc = (110, 110, 116)
seq = frames + frames[-2:0:-1]
imgs = []
for f in seq:
    canv = Image.new('RGB', (mw, mh), BGc)
    fi = Image.fromarray(np.pad(f, ((mh - f.shape[0], 0), ((mw - f.shape[1]) // 2, mw - f.shape[1] - (mw - f.shape[1]) // 2), (0, 0))))
    canv.paste(fi, (0, 0), fi)
    imgs.append(canv.resize((mw * 8, mh * 8), Image.NEAREST))
imgs[0].save(os.path.join(OUT, 'anim_idle_down_cut.gif'), save_all=True,
             append_images=imgs[1:], duration=280, loop=0, disposal=2)

# manifest: potwierdzenie ze RGB nietkniete
src_colors = set()
for c in range(4):
    y0, x0 = 0, c * CW
    sub = a[y0:y0 + CH, x0:x0 + CW]
    dd = d[y0:y0 + CH, x0:x0 + CW]
    for px in sub[dd >= 11]:
        src_colors.add(tuple(px))
cut_colors = set()
for f in frames:
    for px in f[f[..., 3] > 0][:, :3]:
        cut_colors.add(tuple(px))
json.dump({
 "source": "docs/art-review/dzik/dzik-idle.png (po recznym Pixel Snapperze)",
 "test": "IDLE DOWN x4",
 "operacje": ["wyciecie sprite'a z tla (flood-fill tla od krawedzi, prog d<9 w pustej luce histogramu)",
              "alfa 0/255", "przyciecie do bbox"],
 "czego_NIE_zrobiono": ["redukcji palety", "recoloru", "posteryzacji", "downscale",
                        "ponownego pixelowania", "wygladzania", "korekty pikseli", "nowego konturu",
                        "fill_holes", "usuwania wysepek", "wycinania cienia"],
 "RGB_nietkniete": True,
 "kolory_sprite_zrodlo": len(src_colors),
 "kolory_sprite_wynik": len(cut_colors),
 "wynik_jest_podzbiorem_zrodla": cut_colors <= src_colors,
 "klatki_px": [[f.shape[1], f.shape[0]] for f in frames],
}, open(os.path.join(OUT, 'dzik_idle_down_cut.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print("\nkolory sprite: zrodlo", len(src_colors), " wynik", len(cut_colors),
      " wynik podzbiorem zrodla:", cut_colors <= src_colors)

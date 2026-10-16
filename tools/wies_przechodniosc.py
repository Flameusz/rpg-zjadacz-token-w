"""PRZECHODNIOŚĆ WSI — przymiar (tylko czyta), uruchamiany po każdej zmianie zabudowy.

    python tools/wies_przechodniosc.py [mapa.tmj]

Przechodniość wsi pod przyszłą symulację zajęć mieszkańców (autor 2026-10-10:
„postacie będą symulowały zachowania gospodarcze, będą chodzić między zabudową").

Siatka kafli: blokują budynki (prostokąty z `kolizja` ≠ false), płoty, woda (kafle
`solid` z tilesetu) i pnie drzew (`trees-base`). Dla każdego budynku liczony jest
kafel PRZED każdymi drzwiami/wrotami (z `obrot` + przesunięcia w `drzwi`; wiata bez
drzwi = środek otwartego frontu) i szukana droga do placu (BFS, 4-sąsiedztwo).
Furtki: obie strony muszą mieć drogę. Samokontrola: kafel w środku stodoły = brak drogi.
"""
import json
import os
import sys
from collections import deque

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMJ = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "public", "assets", "maps", "village-zagaje.tmj")
m = json.load(open(TMJ, encoding='utf-8'))
W = m['width']
L = {l['name']: l for l in m['layers']}
blok = [[False] * W for _ in range(W)]

# woda: kafle z właściwością solid w tilesetach
solid = set()
for ts in m['tilesets']:
    for t in ts.get('tiles', []):
        if any(p['name'] == 'solid' and p['value'] for p in t.get('properties', [])):
            solid.add(ts['firstgid'] + t['id'])
# ⚠ jak w silniku (`TiledMap.topmostTileAt`): o komórce decyduje NAJWYŻSZY niepusty kafel,
# więc kafel `path` nad wodą jest przejściem (kładka). Liczenie samej warstwy `water`
# odcinało zachodni brzeg za kładką, po której gracz chodzi (2026-10-10).
kafle = [l for l in m['layers'] if l['type'] == 'tilelayer' and not l['name'].startswith('trees-')]
for i in range(W * W):
    g = next((l['data'][i] for l in reversed(kafle) if l['data'][i]), 0)
    if g in solid:
        blok[i // W][i % W] = True
# ⭐ kładka OTWIERA komórki pod sobą (jak `TiledMap.komorkiKladek`, 2026-10-11) — woda
#   pod nią zostaje wodą; wcześniej przejście dawały kafle `path` położone na wodzie.
for o in L['budynki']['objects']:
    if any(p['name'] == 'typ' and p['value'] == 'kladka' for p in o.get('properties', [])):
        for y in range(int(o['y'] // 32), int(-(-(o['y'] + o['height']) // 32))):
            for x in range(int(o['x'] // 32), int(-(-(o['x'] + o['width']) // 32))):
                blok[y][x] = False
for i, g in enumerate(L['trees-base']['data']):
    if g:
        blok[i // W][i % W] = True


def props(o):
    return {p['name']: p['value'] for p in o.get('properties', [])}


budynki = []
for o in L['budynki']['objects']:
    p = props(o)
    x0, y0 = int(o['x'] // 32), int(o['y'] // 32)
    w, h = round(o['width'] / 32), round(o['height'] / 32)
    if p.get('kolizja') is False:
        continue
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < W and 0 <= y < W:
                blok[y][x] = True
    # sprzęt zagród (K5) blokuje, ale drzwi nie ma — nie jest „budynkiem" do sprawdzenia
    if p.get('typ') not in ('plot', 'zerdzie', 'palisada', 'woz', 'stragan', 'kozel', 'snopki', 'pranie', 'gnojownik'):
        budynki.append((o['id'], p, x0, y0, w, h))


def przed(p, x0, y0, w, h, off):
    ob = p.get('obrot', 0)
    if ob == 0:   return (x0 + off, y0 + h)
    if ob == 90:  return (x0 + w, y0 + h - 1 - off)
    if ob == 180: return (x0 + w - 1 - off, y0 - 1)
    return (x0 - 1, y0 + off)                       # 270


def drzwi(p, w, h):
    dl = h if p.get('obrot', 0) in (90, 270) else w
    if p.get('drzwi'):
        return [int(d.split(':')[0]) for d in str(p['drzwi']).split(',')]
    return [dl // 2]                                 # wiata: otwarty front


start = (62, 60)
dist = [[-1] * W for _ in range(W)]
q = deque([start]); dist[start[1]][start[0]] = 0
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < W and not blok[ny][nx] and dist[ny][nx] < 0:
            dist[ny][nx] = dist[y][x] + 1
            q.append((nx, ny))

# samokontrola (niezależna od układu): środek KAŻDEGO budynku 3×3+ musi wyjść NIEosiągalny,
# a sąsiedztwo startu — osiągalne. Inaczej siatka blokad jest pusta i raport kłamie na zielono.
for (_oid, _p, x0, y0, w, h) in budynki:
    if w >= 3 and h >= 3 and _p.get('typ') != 'wrota':
        assert dist[y0 + h // 2][x0 + w // 2] < 0, f"samokontrola: środek budynku {_oid} osiągalny — test nie działa"
assert sum(1 for row in dist for d in row if d >= 0) > 500, "samokontrola: ze startu prawie nic nie jest osiągalne"

zle = []
for (oid, p, x0, y0, w, h) in budynki:
    if p.get('typ') == 'wrota':
        continue
    for off in drzwi(p, w, h):
        tx, ty = przed(p, x0, y0, w, h, off)
        ok = 0 <= tx < W and 0 <= ty < W and dist[ty][tx] >= 0
        if not ok:
            zle.append((oid, p.get('typ'), (x0, y0, w, h), p.get('obrot'), off, (tx, ty)))
print(f"budynków sprawdzonych: {sum(1 for b in budynki if b[1].get('typ') != 'wrota')}")
print("❌ DRZWI BEZ DROGI DO PLACU:" if zle else "✅ drzwi bez drogi do placu: brak")
for z in zle:
    print("  ", z)
# wrota (kolizja=false) — obie strony
for o in L['budynki']['objects']:
    p = props(o)
    if p.get('typ') != 'wrota':
        continue
    x0, y0 = int(o['x'] // 32), int(o['y'] // 32)
    w, h = round(o['width'] / 32), round(o['height'] / 32)
    if w >= h:
        strony = [(x0 + w // 2, y0 - 1), (x0 + w // 2, y0 + 1)]
    else:
        strony = [(x0 - 1, y0 + h // 2), (x0 + 1, y0 + h // 2)]
    bez = [s for s in strony if not (0 <= s[0] < W and 0 <= s[1] < W) or dist[s[1]][s[0]] < 0]
    if bez:
        print("   wrota", (x0, y0, w, h), "— strona bez drogi:", bez)

# ── PRZEJAZD WOZU: wrota ≥ 3 kafle muszą mieć z OBU stron korytarz szeroki na 3 kafle
#   do otwartej przestrzeni (podwórze / droga). Siatka „wozowa" = kafel, którego całe
#   sąsiedztwo 3×3 jest wolne. ⚠ Pieszy test wyżej przepuszcza szczelinę 1 kafla —
#   tak przeoczył kurnik Marka zastawiający przejazd od wrót (zrzut autora 2026-10-10).
woz = [[all(0 <= x + dx < W and 0 <= y + dy < W and not blok[y + dy][x + dx]
            for dx in (-1, 0, 1) for dy in (-1, 0, 1)) for x in range(W)] for y in range(W)]


def obszar_wozu(sx, sy, limit=40):
    if not (0 <= sx < W and 0 <= sy < W) or not woz[sy][sx]:
        return 0
    widz, kol = {(sx, sy)}, [(sx, sy)]
    while kol and len(widz) < limit:
        x, y = kol.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if 0 <= n[0] < W and 0 <= n[1] < W and n not in widz and woz[n[1]][n[0]]:
                widz.add(n); kol.append(n)
    return len(widz)


bez_wozu = []
for o in L['budynki']['objects']:
    p = props(o)
    if p.get('typ') != 'wrota':
        continue
    x0, y0 = int(o['x'] // 32), int(o['y'] // 32)
    w, h = round(o['width'] / 32), round(o['height'] / 32)
    n = max(w, h)
    if n < 3:
        continue
    i = (n - 1) // 2
    if w >= h:
        strony = [(x0 + i, y0 - 1), (x0 + i, y0 + 1)]
    else:
        strony = [(x0 - 1, y0 + i), (x0 + 1, y0 + i)]
    for sx, sy in strony:
        if obszar_wozu(sx, sy) < 12:
            bez_wozu.append(((x0, y0, w, h), (sx, sy)))
print("❌ WROTA BEZ PRZEJAZDU WOZU (3 kafle):" if bez_wozu else "✅ wrota wozowe: przejazd 3 kafle z obu stron")
for z in bez_wozu:
    print("  ", z)
zle = zle or bez_wozu

# ── WROTA PRZYPIĘTE: oba końce otworu muszą stykać się z płotem albo ścianą (K6,
#   2026-10-11, zrzut autora „furtka w powietrzu"). Wrota o kafel obok linii
#   zabudowy wyglądają jak skrzydła zawieszone nad trawą, a podwórze zostaje otwarte
#   szczeliną (u Dobka i Sobka region podwórza przeciekał na plac). Test nie widzi
#   pieszego ani wozu — pilnuje WYGLĄDU i domknięcia obwodu.
zajete = {}
for o in L['budynki']['objects']:
    x0, y0 = int(o['x'] // 32), int(o['y'] // 32)
    for y in range(y0, y0 + round(o['height'] / 32)):
        for x in range(x0, x0 + round(o['width'] / 32)):
            zajete[(x, y)] = props(o).get('typ')
wiszace = []
for o in L['budynki']['objects']:
    if props(o).get('typ') != 'wrota':
        continue
    x0, y0 = int(o['x'] // 32), int(o['y'] // 32)
    w, h = round(o['width'] / 32), round(o['height'] / 32)
    konce = [(x0 - 1, y0), (x0 + w, y0)] if w >= h else [(x0, y0 - 1), (x0, y0 + h)]
    wolne = [k for k in konce if zajete.get(k) in (None, 'wrota')]
    if wolne:
        wiszace.append(((x0, y0, w, h), wolne))
print("❌ WROTA Z WOLNYM KOŃCEM (bez płotu i ściany):" if wiszace else "✅ wrota: oba końce przy płocie albo ścianie")
for z in wiszace:
    print("  ", z)
zle = zle or wiszace

# ── KŁADKA ŁĄCZY BRZEGI: kafel tuż za każdym końcem kładki osiągalny z placu (2026-10-11).
#   Na zachodnim brzegu nie ma drzwi, więc test drzwi wyżej NIE zauważyłby kładki,
#   która przestała przepuszczać.
kladki_zle = []
for o in L['budynki']['objects']:
    if not any(p['name'] == 'typ' and p['value'] == 'kladka' for p in o.get('properties', [])):
        continue
    x0, y0 = int(o['x'] // 32), int(o['y'] // 32)
    w, h = round(o['width'] / 32), round(o['height'] / 32)
    konce = [(x0 - 1, y0 + h // 2), (x0 + w, y0 + h // 2)] if w >= h else [(x0 + w // 2, y0 - 1), (x0 + w // 2, y0 + h)]
    bez = [k for k in konce if dist[k[1]][k[0]] < 0]
    if bez:
        kladki_zle.append(((x0, y0, w, h), bez))
print("❌ KŁADKA NIE ŁĄCZY BRZEGÓW:" if kladki_zle else "✅ kładki: oba brzegi osiągalne")
for z in kladki_zle:
    print("  ", z)
zle = zle or kladki_zle

# kod wyjścia ≠ 0 przy błędzie — do użycia w skryptach
sys.exit(1 if zle else 0)

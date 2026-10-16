"""
Generator portretu Anny -> public/assets/anna_portrait.png

Uruchom:  python tools/build_anna.py                  (podglad + raport, NIC nie zapisuje)
          python tools/build_anna.py --zapisz          (nadpisuje anna_portrait.png)
          python tools/build_anna.py --podglad X.png   (dodatkowo powiekszony podglad)

Zrodlo: `anna.png` (prompt w `docs/prompty_gemini.md`, sekcja "Anna").
Ten sam przepis co `build_zofia.py`/`build_dorota.py`: flood-fill po zielonym
tle od krawedzi kadru, przyciecie do tresci, przemapowanie na palete swiata
z WYJATKAMI na wlasne domeny koloru.

── TRZY WLASNE DOMENY, nie jedna ─────────────────────────────────────────
`build_zofia.py` mial tylko skore, bo jej wlosy sa brazowe i brazowa rampa
srodowiskowa (piasek/ziemia) i tak w nie trafia. Anna ma trzy kategorie,
ktore snapowanie do palety by ZNISZCZYLO — dokladnie ta pulapka, ktora
`build_dorota.py` opisuje przy siwiznie:

1. **SKORA** (ciepla, jasna) — jak u wszystkich.
2. **BLOND** — `docs/paleta.json` nie ma nasyconej zloto-zoltej rampy.
   Najblizszymi sasiadami blondu sa brazy `drewno`/`ziemia`, wiec bez
   wyjatku Anna wyszlaby BRUNETKA, czyli straciloby sie jedyna cieche,
   ktora autor wymienil jako pierwsza.
3. **OCZY** (niebieskie + bialka) — 14 pikseli lacznie, ale to jedyny
   chlodny akcent na calej postaci. Te akurat NIE dostaja wyjatku, bo
   paleta ma juz rampe `woda` (#6cafc7 lezy 20 jednostek od jej #7eabc3)
   i jasny koniec `neutralne` (#e6e4e0 przy bialku #e9eaeb) — wystarczy
   dopuscic te dwie rampy do zbioru srodowiskowego. Wyjatek tam, gdzie
   paleta czegos NIE MA; rampa, gdy ma.

Progi klasyfikacji sa ZMIERZONE na tym pliku (patrz `raport`, drukuje
liczebnosc kazdej domeny), nie przepisane z innego generatora:
  - blond  : G-B > 50 przy R > 120  (zmierzone G-B blondu 58-87,
             skory 21-38, sukni 31-37 — przedzialy sie NIE stykaja)
  - skora  : R > 170, R-B > 60, G-B < 45

── Wlasne rampy sa brane z JEJ OBRAZKA, nie wymyslane ────────────────────
Skora i blond snapuja do N najczestszych wlasnych klastrow (ten sam trik co
`_SKORA` w build_zofia.py). Dzieki temu portret zachowuje dokladnie te tony,
ktore Gemini wygenerowalo, a redukcja liczby kolorow nadal zachodzi.

⚠ **Sylwetka DOTYKA lewej i prawej krawedzi kadru** (wiersze y57-70, czyli
najszersze miejsce rekawow) mimo linijki "generous margin" w prompcie.
Sprawdzone: to NIE jest amputacja — kontur (`#110f19`) jest na x=0 i x=49
kompletny, brakuje wylacznie przezroczystego marginesu. Dlatego skrypt
DOKLEJA 1 px przezroczystosci z kazdej strony (`_MARGINES`) zamiast prosic
o regeneracje: regeneracja ryzykowalaby utrata pozy na wprost, ktora tu
wyszla poprawnie za pierwszym razem (patrz notatka o kacie 3/4 w
`docs/prompty_gemini.md`).
"""

import argparse
import json
import os
from collections import Counter, deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC_PATH = os.path.join(ASSETS, "anna.png")
OUT_PATH = os.path.join(ASSETS, "characters", "anna_portrait.png")

# Przezroczysta ramka doklejana po przycieciu — patrz naglowek.
_MARGINES = 1


def wczytaj_palete():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    return {k: [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in v]
            for k, v in p.items()}


PAL = wczytaj_palete()

# Rampy zadeklarowane w jej prompcie (suknia=ziemia, fartuch=piasek,
# kontur/buty=neutralne) + `woda` i pelne `neutralne` na oczy/bialka.
_ENV_KEYS = np.array(
    PAL["ziemia"] + PAL["piasek"] + PAL["drewno"] + PAL["kora"]
    + PAL["neutralne"] + PAL["woda"]
)


def _usun_zielone(arr):
    """Alfa: 0 tam, gdzie zielone tlo polaczone z krawedzia kadru."""
    h, w, _ = arr.shape
    bg = np.array([3, 255, 3])
    diff = np.abs(arr[..., :3].astype(int) - bg).sum(axis=2)
    is_bg = diff < 60

    visited = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    still_green = (g > 140) & (g > r + 30) & (g > b + 30)
    return np.where(visited | still_green, 0, 255).astype(np.uint8)


def _maski(px):
    """(blond, skora) — progi zmierzone na tym pliku, patrz naglowek."""
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    blond = (g - b > 50) & (r > 120)
    skora = (~blond) & (r > 170) & (r - b > 60) & (g - b < 45)
    return blond, skora


def _wlasna_rampa(px, ile):
    """`ile` najczestszych kolorow z podanego zbioru — rampa brana z JEJ
    obrazka, nie wymyslona (patrz naglowek)."""
    c = Counter(map(tuple, px))
    return np.array([k for k, _v in c.most_common(ile)])


def _nearest(px, keys):
    d = ((px[:, None, :].astype(int) - keys[None, :, :].astype(int)) ** 2).sum(axis=2)
    return keys[np.argmin(d, axis=1)]


def _przekoluj(rgb, alpha):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)
    blond, skora = _maski(px)
    env = ~(blond | skora)

    ramp_blond = _wlasna_rampa(px[blond], 4) if blond.any() else None
    ramp_skora = _wlasna_rampa(px[skora], 3) if skora.any() else None

    result = np.empty_like(px, dtype=np.uint8)
    if blond.any():
        result[blond] = _nearest(px[blond], ramp_blond)
    if skora.any():
        result[skora] = _nearest(px[skora], ramp_skora)
    if env.any():
        result[env] = _nearest(px[env], _ENV_KEYS)

    out[mask] = result
    return out, int(blond.sum()), int(skora.sum()), int(env.sum()), ramp_blond, ramp_skora


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    alpha = _usun_zielone(src)

    ys, xs = np.nonzero(alpha > 0)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    crop = src[box[1]:box[3], box[0]:box[2]].copy()
    a = alpha[box[1]:box[3], box[0]:box[2]].copy()

    kolor, n_b, n_s, n_e, rb, rs = _przekoluj(crop, a)
    out = np.dstack([kolor, a])

    if _MARGINES:
        m = _MARGINES
        h, w, _ = out.shape
        pad = np.zeros((h + 2 * m, w + 2 * m, 4), np.uint8)
        pad[m:m + h, m:m + w] = out
        out = pad
    return out, box, n_b, n_s, n_e, rb, rs


def raport(out, box, n_b, n_s, n_e, rb, rs, przed):
    h, w = out.shape[:2]
    n = int((out[..., 3] > 0).sum())
    po = len({tuple(c) for c in out[..., :3][out[..., 3] > 0]})
    print("Anna portrait: %dx%d (bbox zrodla %s + %dpx marginesu)" % (w, h, box, _MARGINES))
    print("  nieprzezroczystych: %d (%.0f%% kadru)" % (n, 100 * n / (w * h)))
    print("  kolorow: %d -> %d" % (przed, po))
    print("  blond=%d  skora=%d  otoczenie=%d" % (n_b, n_s, n_e))
    if rb is not None:
        print("  rampa blond : " + " ".join("#%02x%02x%02x" % tuple(c) for c in rb))
    if rs is not None:
        print("  rampa skory : " + " ".join("#%02x%02x%02x" % tuple(c) for c in rs))
    if n_b == 0:
        print("  BLAD: zero pikseli blondu — prog G-B jest zly, byla by brunetka")
    if n_s == 0:
        print("  BLAD: zero pikseli skory — prog jest zly")


def main(zapisz, podglad):
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    a0 = _usun_zielone(src)
    przed = len({tuple(c) for c in src[a0 > 0]})

    out, box, n_b, n_s, n_e, rb, rs = zbuduj()
    raport(out, box, n_b, n_s, n_e, rb, rs, przed)

    img = Image.fromarray(out, "RGBA")
    if podglad:
        img.resize((img.width * 6, img.height * 6), Image.NEAREST).save(podglad)
        print("Podglad (6x): %s" % podglad)
    if zapisz:
        img.save(OUT_PATH)
        print("Zapisano: %s" % OUT_PATH)
    else:
        print("Nic nie zapisano — uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

"""
Docina beczke (public/assets/barrel.png, wygenerowana Gemini) do jednego
kafla 32x32 i dokleja go do public/assets/Buildings.png (ten sam wiersz co
lawka, kolejna wolna kolumna), plus aktualizuje docs/budynki.json.

Uruchom:  python tools/build_barrel.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_barrel.py --zapisz    (nadpisuje Buildings.png + budynki.json)
          python tools/build_barrel.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

── SKAD TO SIE WZIELO ───────────────────────────────────────────────────────
`barrel.png` (42x61, zielone tlo) surowo jest ZA DUZA: 61px wysokosci to
prawie dokladnie wysokosc calej postaci gracza (60px, rama Character.png) —
o rekwizyt-beczka nie powinien byc tej samej wysokosci co czlowiek. Ognisko
(ASSETS.campfire) jest punktem odniesienia dla "maly rekwizyt na ziemi":
dokladnie 1 kafel (32x32). Przeskalowane tutaj do tej samej wysokosci
(proporcja 42:61 zostaje — ksztalt jest OK, tylko skala nie), co daje
~22x32.

── ZIELONE TLO INNEGO ODCIENIA NIZ RESZTA ASSETOW ───────────────────────────
Krytyczne odkrycie tej sesji: `barrel.png` NIE uzywa tego samego chroma-green
co blacksmith.png/hunter.png/lawka.png (te trzymaly sie ~(6,253,3)). Rogi
`barrel.png` to (39-43, 211-217, 7-11) — ciagle zielone, ale zauwazalnie inny
odcien (dystans do (6,253,3) ~77, POWYZEJ progu 60 ktorego uzywaly
poprzednie skrypty). Uzycie starego, sztywnego `bg=(6,253,3)` zostawiloby
zielone resztki wokol beczki. Naprawione: kolor tla jest ODCZYTANY z
rogow obrazka (usredniony), nie zalozony na sztywno — bezpieczniejsze dla
kazdego kolejnego assetu, ktorego "plaskie #00FF00" Gemini w praktyce
wyrenderuje troche inaczej za kazdym razem.

── MATERIALY ─────────────────────────────────────────────────────────────
Dwie rodziny kolorow w zrodle (zmierzone, nie zgadywane): cieple brazy
(klepki drewniane) -> rampa `drewno`; szarawe tony (metalowe obrecze) ->
rampa `neutralne` (blizsza numerycznie niz `kamien` dla kazdego z 4
zmierzonych odcieni szarosci). Klasyfikacja per-piksel po nasyceniu:
r-b roznica duza -> drewno, mala -> neutralne.
"""

import argparse
import json
import os
from collections import deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))
DOCS = os.path.normpath(os.path.join(TU, "..", "docs"))

SRC_PATH = os.path.join(ASSETS, "barrel.png")
SHEET_PATH = os.path.join(ASSETS, "Buildings.png")
JSON_PATH = os.path.join(DOCS, "budynki.json")

T, PITCH = 32, 33
COLS = 19
TARGET_H = 30  # w kaflu 32px, 1px marginesu gora/dol


def wczytaj_palety():
    p = json.load(open(os.path.join(DOCS, "paleta.json"), encoding="utf-8"))
    hx = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    return (np.array([hx(h) for h in p["drewno"]]),
            np.array([hx(h) for h in p["neutralne"]]))


D, N = wczytaj_palety()


def _wykryj_tlo(arr):
    """Kolor tla ODCZYTANY z 4 rogow (usredniony), nie zalozony na sztywno —
    patrz docstring: barrel.png ma inny odcien zielonego niz reszta assetow."""
    h, w, _ = arr.shape
    rogi = np.array([arr[0, 0], arr[0, w - 1], arr[h - 1, 0], arr[h - 1, w - 1]])
    return rogi.mean(axis=0)


def _usun_zielone(arr, bg):
    """Flood-fill od krawedzi (proog wzgledem WYKRYTEGO tla) + globalny
    dopalacz na wszystko, co nadal wyraznie zielone (lapie resztki, ktorych
    flood-fill nie dosiegnie)."""
    h, w, _ = arr.shape
    diff = np.abs(arr[..., :3].astype(int) - bg).sum(axis=2)
    is_bg = diff < 70

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

    alpha = np.where(visited | still_green, 0, 255).astype(np.uint8)
    return alpha


def _przekoluj(rgb, alpha):
    out = rgb.copy()
    mask = alpha > 0
    px = rgb[mask].astype(int)
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    # szarawe (obrecze): kanaly bliskie sobie. Brazowe (klepki): R wyraznie
    # nad B. Prog dobrany na zmierzonych kolorach zrodla (patrz docstring).
    szare = (np.abs(r.astype(int) - b.astype(int)) < 20) & (np.abs(r.astype(int) - g.astype(int)) < 20)

    out_px = np.zeros_like(px)
    if (~szare).any():
        d = ((px[~szare][:, None, :] - D[None, :, :].astype(int)) ** 2).sum(axis=2)
        out_px[~szare] = D[np.argmin(d, axis=1)]
    if szare.any():
        d = ((px[szare][:, None, :] - N[None, :, :].astype(int)) ** 2).sum(axis=2)
        out_px[szare] = N[np.argmin(d, axis=1)]
    out[mask] = out_px
    return out


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    bg = _wykryj_tlo(src)
    alpha = _usun_zielone(src, bg)

    ys, xs = np.where(alpha > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop_rgb = src[y0:y1, x0:x1]
    crop_alpha = alpha[y0:y1, x0:x1]

    # KOLEJNOSC MA ZNACZENIE: resize PRZED przekolorowaniem, nie po.
    # Pierwsza wersja robila NEAREST-resize na juz-przekolorowanym obrazie —
    # przy skali ~0.49x punktowe probkowanie NEAREST losowo pomijalo cienki
    # 1px kontur (375px w zrodle, najwiecej uzywany pojedynczy kolor —
    # policzone), zostawiajac go dziurawym/poszarpanym zamiast ciaglej linii.
    # Zgloszone przez usera jako "wyglada kiepsko" — porownanie ze zrodlem
    # pokazalo dokladnie ten brakujacy kontur. BOX (usrednianie obszaru) na
    # SUROWYCH kolorach zachowuje cienka linie jako ciagly, tylko troche
    # przycieniowany pas zamiast dziur; dopiero POTEM snap do palety
    # projektu przywraca twarde, plaskie kolory z tego uposredniowanego
    # wyniku.
    img = Image.fromarray(np.dstack([crop_rgb, crop_alpha]), "RGBA")
    skala = TARGET_H / img.height
    nowa_w = max(1, round(img.width * skala))
    img = img.resize((nowa_w, TARGET_H), Image.BOX)

    resized = np.array(img)
    kolor = _przekoluj(resized[..., :3], resized[..., 3])

    canvas = np.zeros((T, T, 4), np.uint8)
    tresc = np.dstack([kolor, resized[..., 3]])
    x_off = (T - tresc.shape[1]) // 2
    y_off = T - tresc.shape[0]  # dolna krawedz
    canvas[y_off:y_off + tresc.shape[0], x_off:x_off + tresc.shape[1]] = tresc
    return canvas, tuple(bg.round().astype(int).tolist())


def main(zapisz, podglad):
    kafel, bg = zbuduj()
    n = int((kafel[..., 3] > 0).sum())
    print("Wykryty kolor tla (usredniony z rogow): %s" % (bg,))
    print("barrel: %dx%d, %d nieprzezroczystych pikseli" % (kafel.shape[1], kafel.shape[0], n))

    img = Image.fromarray(kafel, "RGBA")
    if podglad:
        img.resize((img.width * 10, img.height * 10), Image.NEAREST).save(podglad)
        print("Podglad (10x): %s" % podglad)

    if not zapisz:
        print("Nic nie zapisano — uzyj --zapisz.")
        return

    arkusz = np.array(Image.open(SHEET_PATH).convert("RGBA"))
    stare_h = arkusz.shape[0]
    # `(stare_h+1)//PITCH` to liczba ISTNIEJACYCH wierszy (0-indeksowane:
    # wiersze 0..istniejace-1) — patrz ta sama formula/komentarz w
    # build_lawka.py. Tam chcielismy NASTEPNY (nowy) wiersz, tutaj
    # chcemy DOLACZYC do OSTATNIEGO istniejacego wiersza (ten sam co
    # lawka), wiec -1.
    istniejace_wiersze = (stare_h + 1) // PITCH
    wiersz = istniejace_wiersze - 1

    d = json.load(open(JSON_PATH, encoding="utf-8"))
    zajete_id = {v["id"]: k for k, v in d["kafle"].items()}
    zajete_pozycje = {(v["wiersz"], v["kolumna"]): k for k, v in d["kafle"].items()}

    if "barrel_0" in d["kafle"]:
        # PONOWNE URUCHOMIENIE: nadpisz WLASNA poprzednia pozycje, nie szukaj
        # nowej wolnej kolumny — inaczej kazdy przebieg zostawia poprzedni,
        # teraz-osierocony kafel jako martwy, nieoznaczony smiec w arkuszu
        # (dokladnie to sie stalo w tej sesji: pierwsza, kiepska wersja
        # zostala w kolumnie 2 przy pierwszym --zapisz poprawki, bo skrypt
        # zawsze szukal "pierwszej wolnej kolumny" zamiast pamietac, gdzie
        # juz siebie samego postawil).
        poprzednia = d["kafle"]["barrel_0"]
        wiersz, kolumna = poprzednia["wiersz"], poprzednia["kolumna"]
        id_ = poprzednia["id"]
    else:
        # Ten sam wiersz co lawka (0=lawka_l, 1=lawka_p) — pierwsza wolna
        # kolumna w tym wierszu, nie nowy wiersz, zeby nie marnowac miejsca.
        kolumna = 0
        while (wiersz, kolumna) in zajete_pozycje:
            kolumna += 1
        id_ = wiersz * COLS + kolumna
    if id_ in zajete_id and zajete_id[id_] != "barrel_0":
        raise SystemExit("STOP: id %d juz zajete przez '%s' — NIC nie zapisano." % (id_, zajete_id[id_]))

    y0 = wiersz * PITCH
    x0 = kolumna * PITCH
    if y0 + T > arkusz.shape[0] or x0 + T > arkusz.shape[1]:
        raise SystemExit("STOP: docelowa pozycja (wiersz %d, kolumna %d) wychodzi poza arkusz." % (wiersz, kolumna))

    arkusz[y0:y0 + T, x0:x0 + T] = kafel
    Image.fromarray(arkusz, "RGBA").save(SHEET_PATH)
    print("Zapisano %s (wiersz %d, kolumna %d, id %d)" % (SHEET_PATH, wiersz, kolumna, id_))

    if "barrel_0" not in d["kafle"]:
        d["arkusz"]["kafli"] += 1  # tylko przy PIERWSZYM zapisie, nie przy nadpisaniu
    d["kafle"]["barrel_0"] = {"kolumna": kolumna, "wiersz": wiersz, "id": id_}
    json.dump(d, open(JSON_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Zaktualizowano %s: barrel_0 id=%d" % (JSON_PATH, id_))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

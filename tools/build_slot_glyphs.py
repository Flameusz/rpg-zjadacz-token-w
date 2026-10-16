#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arkusz GLIFÓW SLOTÓW — `public/assets/ui/slot_glyphs.png`.

⚠ **Po co to istnieje.** Do 2026-09-11 lalka ekwipunku była JEDNYM obrazkiem
`assets/ui/slots.png` — kratą 3×4 z wygrawerowanymi glifami, czyli układem
zapieczonym w piksele. Rozmiar kafla (32 px), liczba slotów (12) i ich
KOLEJNOŚĆ były własnością pliku PNG, więc każda zmiana układu wymagała
przemalowania grafiki, a każdy nowy slot — przerysowania całej kraty.

Ten skrypt rozcina tamten obrazek na POJEDYNCZE GLIFY z przezroczystym tłem
(biała maska, więc silnik może je tintować pod motyw i skalować całkowicie),
dokłada trzy, których w źródle nie było (ramiona, pas, strzałka zamiany
zestawu broni) i zapisuje wszystko jako równą kratę 8×2 po 32 px.

Dzięki temu układ lalki jest DANYMI w `src/ui/EquipLayout.ts`, a nie pikselami.

⚠ **Próg jest LOKALNY (piksel kontra rozmyte tło), nie globalny — i to jest
naprawa zmierzonego błędu, nie ostrożność.** Kafel źródła ma winietę: zmierzony
profil idzie od 68 (suma RGB) w lewym górnym rogu wnętrza do 146 w prawym
dolnym. Próg liczony z mediany CAŁEGO kafla brał więc cały ciemny róg za glif —
w masce lądowała litera „L" wzdłuż górnej i lewej krawędzi, identycznie na
wszystkich dziesięciu kaflach. Rozmycie gaussowskie r=4,5 jest modelem tła,
a glif to piksele ciemniejsze od niego o `THRESHOLD`.

⚠ **Wnętrze jest wcinane o 3 px z każdej strony.** `origin` z `ASSETS.equipDoll`
(4) wskazuje pierwszy piksel ZA kratą, ale kafel ma jeszcze własny cień wewnętrzny
szeroki na ~2 px — zmierzone: kolumny i = 0..1 mają stałe 33, i = 2 dopiero 45–63.

⚠ **`boots` jest RYSOWANY, choć w źródle jest.** Tamten glif to dwa WYPEŁNIONE
buty, a nie kontur — model tła rozmywa się wtedy razem z wypełnieniem i maska
wychodzi połamana (sprawdzone: lewy but rozpadał się na trzy kawałki). Reszta
dziewięciu to kontury i wychodzą czysto.

Domyślnie PRZYMIAR: drukuje raport i nie zapisuje nic. Zapis pod `--zapisz`.
Podgląd powiększonego arkusza: `--podglad PLIK.png`.
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "ui" / "slots.png"
OUT = ROOT / "public" / "assets" / "ui" / "slot_glyphs.png"

CELL = 32
COLS, ROWS = 8, 2
# Geometria źródła — te same liczby, co `ASSETS.equipDoll` w GameConfig.
SRC_ORIGIN, SRC_PITCH = 4, 33
INSET = 3
THRESHOLD = 6
BLUR = 4.5

# nazwa glifu → (kolumna, wiersz) w źródłowym `slots.png`.
# Kolejność listy JEST kolejnością klatek (indeks = pozycja w arkuszu).
FROM_SOURCE = [
    ("neck", 0, 0),
    ("head", 1, 0),
    ("chest", 1, 1),
    ("gloves", 2, 0),
    ("legs", 1, 2),
    ("ring", 0, 2),
    ("utility", 0, 3),
    ("weapon", 0, 1),
    ("offhand", 2, 1),
]

# Glify, których w źródle NIE MA. Rysowane wprost, w tej samej konwencji:
# kontur grubości 1 px, treść w ~22×22 na środku kafla 32×32.
DRAWN = ["boots", "shoulders", "belt", "swap"]

# ⚠ **Kolejność KLATEK jest jawna, nie wyprowadzana z `FROM_SOURCE + DRAWN`.**
# Indeks klatki jest adresem czytanym przez `EQUIP_SLOT_DEF.glyph` w silniku,
# więc musi być czytelny w jednym miejscu i nie może się przesunąć, gdy jakiś
# glif przeniesie się z ekstrakcji do rysowania (dokładnie to spotkało `boots`).
ORDER = [
    "neck",
    "head",
    "shoulders",
    "chest",
    "gloves",
    "belt",
    "legs",
    "boots",
    "ring",
    "utility",
    "weapon",
    "offhand",
    "swap",
]
assert set(ORDER) == {n for n, _, _ in FROM_SOURCE} | set(DRAWN), "ORDER nie pokrywa sie ze zrodlami"


def extract(img, col, row):
    """Maska glifu z jednego kafla zrodla: biel tam, gdzie grawer."""
    x0 = SRC_ORIGIN + SRC_PITCH * col
    y0 = SRC_ORIGIN + SRC_PITCH * row
    cell = img.crop((x0, y0, x0 + CELL, y0 + CELL)).convert("L")
    # Model TLA: ten sam kafel rozmyty. Winieta zmienia sie wolno, glif szybko,
    # wiec roznica zostawia glif i gubi gradient.
    bg = cell.filter(ImageFilter.GaussianBlur(BLUR))
    cp, bp = cell.load(), bg.load()
    out = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    op = out.load()
    n = 0
    for i in range(INSET, CELL - INSET):
        for j in range(INSET, CELL - INSET):
            if cp[i, j] < bp[i, j] - THRESHOLD:
                op[i, j] = (255, 255, 255, 255)
                n += 1
    return out, n, int(sum(bp[i, j] for i in range(CELL) for j in range(CELL)) / (CELL * CELL))


def blank():
    return Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))


def put(img, pts):
    p = img.load()
    for x, y in pts:
        if 0 <= x < CELL and 0 <= y < CELL:
            p[x, y] = (255, 255, 255, 255)


def rect(x0, y0, x1, y1):
    for x in range(x0, x1 + 1):
        yield x, y0
        yield x, y1
    for y in range(y0, y1 + 1):
        yield x0, y
        yield x1, y


def line(x0, y0, x1, y1):
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    x, y = x0, y0
    while True:
        yield x, y
        if x == x1 and y == y1:
            return
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x += sx
        if e2 < dx:
            err += dx
            y += sy


def draw_boots():
    """But z cholewka, widok z boku. Rysowany - patrz naglowek pliku."""
    im = blank()
    put(im, line(10, 6, 19, 6))
    put(im, line(19, 6, 19, 19))
    put(im, line(19, 19, 27, 21))
    put(im, line(27, 21, 27, 26))
    put(im, line(27, 26, 10, 26))
    put(im, line(10, 26, 10, 6))
    put(im, line(10, 10, 19, 10))
    put(im, line(11, 23, 26, 23))
    return im


def draw_shoulders():
    """Para naramienników: dwie łuskowe kopuły rozdzielone kołnierzem."""
    im = blank()
    for side in (-1, 1):
        cx = 16 + side * 8
        put(im, line(cx - 5, 13, cx - 5, 21))
        put(im, line(cx + 5, 13, cx + 5, 21))
        put(im, line(cx - 5, 13, cx - 2, 10))
        put(im, line(cx + 5, 13, cx + 2, 10))
        put(im, line(cx - 2, 10, cx + 2, 10))
        put(im, line(cx - 5, 21, cx + 5, 21))
        put(im, line(cx - 4, 16, cx + 4, 16))
    put(im, line(13, 12, 18, 12))
    put(im, line(13, 12, 13, 16))
    put(im, line(18, 12, 18, 16))
    put(im, line(13, 16, 18, 16))
    return im


def draw_belt():
    """Pas: taśma przez cały kafel, klamra na środku, końcówka zwisa."""
    im = blank()
    put(im, rect(3, 12, 28, 19))
    for x in (7, 11, 21, 25):
        put(im, [(x, 15), (x, 16)])
    put(im, rect(12, 10, 20, 21))
    put(im, line(16, 12, 16, 19))
    put(im, line(21, 19, 21, 25))
    put(im, line(25, 19, 25, 25))
    put(im, line(21, 25, 25, 25))
    return im


def draw_swap():
    """Dwie strzałki w przeciwnych kierunkach — zamiana zestawu broni."""
    im = blank()
    put(im, line(6, 11, 25, 11))
    put(im, line(21, 7, 25, 11))
    put(im, line(21, 15, 25, 11))
    put(im, line(6, 20, 25, 20))
    put(im, line(6, 20, 10, 16))
    put(im, line(6, 20, 10, 24))
    return im


DRAWERS = {
    "boots": draw_boots,
    "shoulders": draw_shoulders,
    "belt": draw_belt,
    "swap": draw_swap,
}


def main():
    zapisz = "--zapisz" in sys.argv
    podglad = None
    if "--podglad" in sys.argv:
        podglad = Path(sys.argv[sys.argv.index("--podglad") + 1])

    if not SRC.exists():
        print("BLAD: brak zrodla " + str(SRC))
        return 1
    src = Image.open(SRC).convert("RGBA")
    if src.size != (107, 140):
        print("BLAD: " + SRC.name + " ma " + str(src.size) + ", oczekiwano (107, 140)")
        return 1

    sheet = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
    print("kl.  nazwa      zrodlo      px glifu  mediana")
    bad = 0
    for index, name in enumerate(ORDER):
        if name in DRAWERS:
            glyph = DRAWERS[name]()
            med = None
            n = sum(1 for p in list(glyph.getdata()) if p[3])
            origin = "rysowany"
        else:
            col, row = next((c, r) for nm, c, r in FROM_SOURCE if nm == name)
            glyph, n, med = extract(src, col, row)
            origin = "slots(%d,%d)" % (col, row)
        # ⚠ Asercja, która potrafi zaświecić na czerwono: glif poniżej 40 px
        # albo powyżej 520 px to albo zgubiony kształt, albo złapane tło.
        status = "" if 40 <= n <= 520 else "  <<< PODEJRZANY"
        print(
            "%3d  %-10s %-11s %8d  %s%s"
            % (index, name, origin, n, med if med is not None else "-", status)
        )
        if status:
            bad += 1
        sheet.paste(glyph, ((index % COLS) * CELL, (index // COLS) * CELL))

    print("\nklatek: %d w kracie %dx%d po %d px" % (len(ORDER), COLS, ROWS, CELL))
    if bad:
        print("!!! %d klatek poza pasmem - obejrzyj podglad zanim zapiszesz" % bad)

    if podglad:
        podglad.parent.mkdir(parents=True, exist_ok=True)
        bg = Image.new("RGBA", sheet.size, (28, 32, 48, 255))
        bg.alpha_composite(sheet)
        bg.resize((sheet.width * 6, sheet.height * 6), Image.NEAREST).save(podglad)
        print("podglad -> " + str(podglad))

    if zapisz:
        sheet.save(OUT)
        print("zapisano -> " + str(OUT.relative_to(ROOT)))
    else:
        print("PRZYMIAR - nic nie zapisano (dodaj --zapisz)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

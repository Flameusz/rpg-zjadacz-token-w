"""
Generator palety projektu.

Uruchom:  python tools/gen_palette.py
Zapisuje: docs/paleta.json  (+ podglad, jesli podasz --podglad SCIEZKA)

Paleta NIE jest listą kolorów wpisaną ręcznie — jest wyliczana z ramp, żeby
dało się ją przestroić w jednym miejscu i żeby wszystkie materiały trzymały tę
samą logikę cieniowania. Zasady i pomiary, z których to wynika, są w
docs/ART_DIRECTION.md.

Rdzeń: KAŻDA rampa przesuwa odcień. Cień idzie w chłód, światło w ciepło.
To jest zmierzona różnica między naszym Nature.png (zieleń mieści się w 4
stopniach odcienia) a materiałem, który wygląda dobrze (47 stopni).
"""

import argparse
import colorsys
import json
import os

DOCS = os.path.join(os.path.dirname(__file__), "..", "docs")


def rampa(h_cien, h_swiatlo, s_baz, v_baz, kroki=5,
          s_cien=1.15, s_swiatlo=0.72, v_min=0.55, v_max=1.30):
    """Jedna rampa materiału: `kroki` stopni od cienia do światła.

    h_cien / h_swiatlo — odcienie krańców (stopnie). Interpolujemy KRÓTSZYM
    łukiem koła: rampa 350 -> 30 policzona wprost jedzie przez zieleń i zamiast
    czerwieni wychodzi tęcza. Pierwsza wersja akcentu ciepłego miała ten błąd.

    Nasycenie maleje ku światłu (unika neonowych rozjaśnień), jasność rośnie.
    """
    delta = (h_swiatlo - h_cien + 540) % 360 - 180
    out = []
    for i in range(kroki):
        t = i / (kroki - 1)
        h = (h_cien + delta * t) % 360
        s = min(s_baz * (s_cien + (s_swiatlo - s_cien) * t), 1.0)
        v = min(v_baz * (v_min + (v_max - v_min) * t), 1.0)
        r, g, b = colorsys.hsv_to_rgb(h / 360, s, v)
        out.append("#%02x%02x%02x" % (round(r * 255), round(g * 255), round(b * 255)))
    return out


# h_cien, h_swiatlo, nasycenie bazowe, jasnosc bazowa
RAMPY = {
    "trawa":          (148,  72, 0.62, 0.62),
    "listowie":       (160,  88, 0.58, 0.48),
    # Korona drzewa oswietlona z gory to NIE jest listowie w cieniu. Bez
    # osobnej rampy drzewo wychodzi ciemniejsze od trawy, na ktorej stoi, i
    # zamiast sie odcinac — znika. Jasniejsza i cieplejsza od "listowie",
    # wyraznie inna od "trawa", zeby korona nie zlewala sie z podlozem.
    "korona":         (138,  74, 0.66, 0.66),
    "ziemia":         ( 10,  42, 0.55, 0.55),
    "piasek":         ( 22,  50, 0.42, 0.75),
    "kamien":         (235, 200, 0.14, 0.62),
    "drewno":         (  8,  40, 0.52, 0.52),
    "kora":           (  0,  34, 0.44, 0.38),
    "woda":           (224, 186, 0.55, 0.70),
    "akcent_cieply":  (350,  30, 0.78, 0.72),
    "akcent_chlodny": (258, 292, 0.45, 0.60),
    # Zloto owocow (grusza) — dodane 2026-08-18, `tools/build_drzewa_owocowe.py`.
    # Zaden istniejacy akcent nie pasowal: `piasek` (cieply, ale zbyt braz-
    # owy/przygaszony) dawal dystans 32+ do zmierzonych kolorow gruszki,
    # `akcent_cieply` (czerwien-pomarancz, uzyty juz przez jablko) jeszcze
    # gorzej. Parametry dobrane przemieceniem siatki pod zmierzone kolory
    # zrodla (docs/ZADANIE_drzewa.md) — srednia odleglosc 20,7, w tym samym
    # zakresie co dopasowanie czerwieni jablka/fioletu sliwki do ICH ramp.
    "akcent_zlocisty": ( 45,  49, 0.75, 1.00),
}

# Neutralne nie są rampą materiału — służą za cienie kontaktowe, interfejs
# i najciemniejszy wspólny ton, który spina wszystko razem.
NEUTRALNE = ["#12101a", "#2b2a36", "#4a4956", "#75737f", "#a7a5ae", "#e6e4e0"]


def zbuduj():
    paleta = {nazwa: rampa(*args) for nazwa, args in RAMPY.items()}
    paleta["neutralne"] = NEUTRALNE
    return paleta


def podglad(paleta, sciezka):
    from PIL import Image, ImageDraw
    CW, CH, PAD, LBL = 92, 60, 10, 160
    n = sum(len(v) for v in paleta.values())
    im = Image.new("RGB", (5 * CW + 2 * PAD + LBL, len(paleta) * CH + 44), (22, 22, 28))
    d = ImageDraw.Draw(im)
    d.text((PAD, 10), "PALETA PROJEKTU — %d kolorow" % n, fill=(240, 230, 190))
    d.text((PAD, 24), "cien w chlod, swiatlo w cieplo", fill=(150, 150, 160))
    for r, (nazwa, kolory) in enumerate(paleta.items()):
        y = 42 + r * CH
        d.text((PAD, y + CH // 2 - 10), nazwa, fill=(215, 210, 200))
        for i, hx in enumerate(kolory):
            c = tuple(int(hx[j:j + 2], 16) for j in (1, 3, 5))
            x = PAD + LBL + i * CW
            d.rectangle([x, y, x + CW - 6, y + CH - 16], fill=c)
            d.text((x + 4, y + CH - 28), hx,
                   fill=(255, 255, 255) if sum(c) < 380 else (10, 10, 10))
    im.save(sciezka)
    print("podglad ->", sciezka)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--podglad", help="zapisz obrazek palety pod tą ścieżką")
    args = ap.parse_args()

    paleta = zbuduj()
    os.makedirs(DOCS, exist_ok=True)
    cel = os.path.normpath(os.path.join(DOCS, "paleta.json"))
    with open(cel, "w", encoding="utf-8") as f:
        json.dump(paleta, f, indent=2, ensure_ascii=False)
    print("%d rodzin, %d kolorow -> %s"
          % (len(paleta), sum(len(v) for v in paleta.values()), cel))
    for k, v in paleta.items():
        print("  %-15s %s" % (k, " ".join(v)))
    if args.podglad:
        podglad(paleta, args.podglad)

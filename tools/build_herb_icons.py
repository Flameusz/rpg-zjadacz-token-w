# -*- coding: utf-8 -*-
"""
Ikony ZIÓŁ z arkuszy Gemini — wsad A (żółte i białe kwiaty) i wsad B (liście
i kwiaty fioletowe). Prompty i ocena: `docs/gemini_item_icons.md` §3.

    python tools/build_herb_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_herb_icons.py --podglad X.png    # + podgląd 8x, 2x, 1x i stare ikony
    python tools/build_herb_icons.py --zapisz           # zapis do public/assets/items/

── Skąd piksele ─────────────────────────────────────────────────────────────
Arkusze przyszły już w natywnej siatce (Pixel Snapper, ~64 kolory na arkusz,
gałązka ~55–65 px). Kształt, kolory i cieniowanie idą Z ARKUSZA; ten plik
robi tylko zejście do 28 px i kontur:

  1. komórka kraty 3×2 → wycięcie tła → bbox.
     ⚠ Arkusz A przyszedł na SZAROBRĄZOWYM tle (136,117,106), nie na magencie
     z promptu; B — na cyjanie, ale każda komórka ma swój odcień.
  2. lustro w poziomie dla gałązek, które Gemini położyło ODWROTNIE (ucięty
     koniec w lewym dolnym zamiast w prawym dolnym — wsad B, poza żywokostem).
  3. zmniejszenie GŁOSOWANIEM kolorów wnętrza (bez konturu arkusza): piksel
     docelowy istnieje, gdy wnętrze pokrywa ≥ `POKRYCIE` jego pola.
     ⚠ Próg 0,25, nie 0,5: przy 0,5 łodygi (1 px wnętrza + 2 px konturu
     w arkuszu) znikały.
  4. ⭐ CIEMNE PRZERWY → KROK CIEMNIEJ, NIE CZERŃ. Pole, w którym kontur
     arkusza zajmuje ≥ `PROG_CIEMNEGO` pikseli, dostaje ciemniejszy ton
     SWOJEGO koloru z palety arkusza. Tak przeżywają żyłki liści, przerwy
     między gwiazdkami dziurawca i zęby pokrzywy.
     ⛔ Głosowanie czerni wprost (przymiar 2026-10-05) zjadało łodygi
     i robiło dziury — odrzucone.
  5. poprawki punktowe: `MIETA_KWIAT` (kulki mięty za blade, żeby przeżyć
     1x), `PROG_ZOLTEGO` (guziki wrotyczu), `GAMMA` (ciemne zielenie ginęły
     na kafelku plecaka).
  6. kontur 4-sąsiedni (`build_armor_icons.na_kafel`), zatkanie
     jednopikselowych dziur, `icon_center`.

⚠ Światło (lewa-góra − prawa-dół) jest tu tylko RAPORTOWANE, nie
sprawdzane: w gałązce jasność rozkłada KOMPOZYCJA (blady liść dziewanny
w prawym dolnym, ciemny kwiat w lewym górnym), nie oświetlenie.

Paleta: kolory z arkusza, bez przyciągania do ramp. Rośliny nie mają
wspólnego materiału z resztą ekwipunku (drewno, skóra, metal), a paleta
Gemini jest tu czysta — przyciąganie dałoby tylko błoto.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from icon_center import wysrodkuj, bledy_srodka  # noqa: E402
from build_armor_icons import (  # noqa: E402
    KONTUR, na_kafel, kontrast, pomiar_swiatla, odrebnosc, gruby_kontur,
)

KORZEN = Path(__file__).resolve().parent.parent
GEMINI = KORZEN / "docs" / "art-review" / "gemini"
CEL = KORZEN / "public" / "assets" / "items"
R = 32
WNETRZE = 28          # dłuższy bok PRZED konturem; z konturem 30, margines 1 px
POKRYCIE = 0.25
PROG_CIEMNEGO = 0.35


def tlo_a(rgb):
    return np.sqrt(((rgb - (136, 117, 106)) ** 2).sum(axis=2)) < 20


def tlo_b(rgb):
    # cyjan każdej komórki: (16..42, 192..221, 208..232); najbliższy kolor
    # rośliny (fiolet dzwonków żywokostu) ma G < 150
    return (rgb[..., 2] > 180) & (rgb[..., 1] > 170) & (rgb[..., 0] < 80)


ARKUSZE = {"a": ("herbs_a_v1_raw.png", tlo_a), "b": ("herbs_b_v1_raw.png", tlo_b)}

#: id przedmiotu → (arkusz, (wiersz, kolumna), lustro, plik w grze)
ZIOLA = {
    "dziewanna": ("a", (0, 0), False, "icon_mullein.png"),
    "dziurawiec": ("a", (0, 1), False, "icon_st_johns_wort.png"),
    "nawloc": ("a", (0, 2), False, "icon_goldenrod.png"),
    "wrotycz": ("a", (1, 0), False, "icon_tansy.png"),
    "rumianek": ("a", (1, 1), False, "icon_chamomile.png"),
    "krwawnik": ("a", (1, 2), False, "icon_yarrow.png"),
    "babka": ("b", (0, 0), True, "icon_ribwort_plantain.png"),
    "pokrzywa": ("b", (0, 1), True, "icon_nettle.png"),
    "mieta": ("b", (0, 2), True, "icon_corn_mint.png"),
    "lebiodka": ("b", (1, 0), True, "icon_wild_marjoram.png"),
    "zywokost": ("b", (1, 1), False, "icon_comfrey.png"),
    # (1, 2) arkusza B — rumianek-KOTWICA skali; do gry idzie wersja z A.
}

#: Pary, które gracz może pomylić (§3.1, §3.3 dokumentu) — muszą się różnić.
PARY = [("dziewanna", "dziurawiec"), ("dziewanna", "nawloc"), ("dziewanna", "wrotycz"),
        ("dziurawiec", "nawloc"), ("dziurawiec", "wrotycz"), ("nawloc", "wrotycz"),
        ("rumianek", "krwawnik"), ("mieta", "lebiodka"), ("babka", "pokrzywa")]

#: Progi — ze wzorców innych rodzin, nie z wyniku tego generatora.
MIN_ODREBNOSC = 0.25      # `build_armor_icons.MIN_ODREBNOSC`
MIN_KONTRAST = 50         # `build_armor_icons.MIN_KONTRAST`
#: Sprawdzone, że świeci: kontur 8-sąsiedni daje tu ≥ 0,43 na KAŻDYM zielu
#: (2026-10-05). Przed `zatkaj_dziury` dziurawiec miał 0,20 — jednopikselowe
#: dziury tła między kwiatami dostawały własny pierścień konturu.
MAX_GRUBY_KONTUR = 0.15   # `build_armor_icons.MAX_GRUBY_KONTUR`

#: Kulki kwiatów mięty: w arkuszu bladoliliowe 2×2, po zejściu do 28 px
#: zlewały się z jasną zielenią liści. Rampa liliowa od cienia do światła.
MIETA_KWIAT = ((120, 70, 140), (168, 104, 190), (206, 146, 222))

#: Wrotycz: guziki zlewały się w jedną żółtą plamę — niższy próg ciemnego
#: oddaje przerwy między nimi. ⚠ TYLKO na żółtym: ten sam próg na całej
#: gałązce przyciemniał liść (kontrast 42).
PROG_ZOLTEGO = {"wrotycz": 0.15}

#: Rozjaśnienie (gamma < 1) ciemnych zieleni, które ginęły na kafelku
#: plecaka (kontrast przed: pokrzywa 32, wrotycz 42, babka 50, lebiodka 50).
#: Pokrzywa ZOSTAJE najciemniejszą zielenią w grze — to jej cecha (§3.3).
GAMMA = {"pokrzywa": 0.72, "wrotycz": 0.85, "babka": 0.88, "lebiodka": 0.85,
         "zywokost": 0.9}


# ════════════════════════════════════════════════════════════════════════
def jasnosc(c):
    c = np.asarray(c, float)
    return c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114


def ciemne(rgb):
    """Kontur arkusza (prawie czerń) — nie materiał."""
    return rgb.sum(axis=-1) < 60


def wytnij(arkusz, cell, lustro):
    plik, tlo = ARKUSZE[arkusz]
    a = np.array(Image.open(GEMINI / plik).convert("RGBA")).astype(int)
    a[tlo(a[..., :3]), 3] = 0
    H, W = a.shape[:2]
    r, c = cell
    k = a[round(r * H / 2):round((r + 1) * H / 2), round(c * W / 3):round((c + 1) * W / 3)]
    ys, xs = np.nonzero(k[..., 3])
    k = k[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()
    return np.ascontiguousarray(k[:, ::-1]) if lustro else k


def paleta(k):
    al = k[..., 3] > 0
    px = k[al][:, :3]
    return np.unique(px[~ciemne(px)], axis=0)


def ciemniej(c, pal):
    """Ciemniejszy ton TEGO SAMEGO koloru z palety arkusza: najbliższa
    chromatyczność wśród kolorów o ≥ 12 jednostek ciemniejszych."""
    c = np.array(c)
    hc = c / max(1, c.sum())
    kand = [p for p in pal if jasnosc(p) < jasnosc(c) - 12]
    if not kand:
        return c
    return min(kand, key=lambda p: np.abs(p / max(1, p.sum()) - hc).sum() * 600
               + (jasnosc(c) - jasnosc(p)))


def wiekszosc(glosy):
    # remis rozstrzyga porządek sortowania (`build_armor_icons.wiekszosc`)
    return max(sorted(set(glosy)), key=glosy.count)


def zolty(c):
    return c[0] > 150 and c[1] > 110 and c[2] < 90


def zmniejsz(k, prog, prog_zoltego=None):
    pal = paleta(k)
    H, W = k.shape[:2]
    s = WNETRZE / max(H, W)
    w, h = max(1, round(W * s)), max(1, round(H * s))
    al = k[..., 3] > 0
    dk = al & ciemne(k[..., :3])
    wn = al & ~dk
    rgb = np.zeros((h, w, 3), np.uint8)
    alfa = np.zeros((h, w), bool)
    for ty in range(h):
        y0 = int(ty * H / h)
        y1 = max(y0 + 1, int((ty + 1) * H / h))
        for tx in range(w):
            x0 = int(tx * W / w)
            x1 = max(x0 + 1, int((tx + 1) * W / w))
            if wn[y0:y1, x0:x1].mean() < POKRYCIE:
                continue
            glosy = [tuple(int(v) for v in k[y, x, :3])
                     for y in range(y0, y1) for x in range(x0, x1) if wn[y, x]]
            c = wiekszosc(glosy)
            p = prog_zoltego if prog_zoltego is not None and zolty(c) else prog
            if dk[y0:y1, x0:x1].sum() / max(1, al[y0:y1, x0:x1].sum()) >= p:
                c = ciemniej(c, pal)
            rgb[ty, tx], alfa[ty, tx] = c, True
    return rgb, alfa


def kwiaty_miety(rgb, alfa):
    """Liliowe piksele (R i B wyraźnie nad G) → `MIETA_KWIAT` wg jasności."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    lil = alfa & (r > g + 8) & (b > g + 8)
    L = jasnosc(rgb)
    for y, x in zip(*np.nonzero(lil)):
        i = 0 if L[y, x] < 120 else (1 if L[y, x] < 175 else 2)
        rgb[y, x] = MIETA_KWIAT[i]
    return int(lil.sum())


def podnies(rgb, alfa, g):
    out = rgb.astype(float) / 255
    rgb[alfa] = np.round(255 * out[alfa] ** g).astype(np.uint8)


def zatkaj_dziury(arr, maks=2):
    """Zamknięte dziury tła ≤ `maks` px → kontur. Przez nie prześwitywał
    kafel plecaka jak przez dziurkę od klucza (`build_armor_icons`
    `zaslep_drobne_dziury` — ta sama lekcja)."""
    al = arr[..., 3] > 0
    H, W = al.shape
    seen = np.zeros_like(al)
    stos = [(y, x) for y in range(H) for x in range(W)
            if (y in (0, H - 1) or x in (0, W - 1)) and not al[y, x]]
    for y, x in stos:
        seen[y, x] = True
    while stos:
        y, x = stos.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not al[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                stos.append((ny, nx))
    dziury = ~al & ~seen
    # komponenty dziur; większe niż `maks` zostają (to celowe prześwity)
    zrobione = np.zeros_like(dziury)
    n = 0
    for y0, x0 in zip(*np.nonzero(dziury)):
        if zrobione[y0, x0]:
            continue
        komp, st = [], [(y0, x0)]
        zrobione[y0, x0] = True
        while st:
            y, x = st.pop()
            komp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if dziury[ny, nx] and not zrobione[ny, nx]:
                    zrobione[ny, nx] = True
                    st.append((ny, nx))
        if len(komp) <= maks:
            for y, x in komp:
                arr[y, x] = (*KONTUR, 255)
                n += 1
    return n


def zbuduj(n):
    arkusz, cell, lustro, _ = ZIOLA[n]
    k = wytnij(arkusz, cell, lustro)
    rgb, alfa = zmniejsz(k, PROG_CIEMNEGO, PROG_ZOLTEGO.get(n))
    if n in GAMMA:
        podnies(rgb, alfa, GAMMA[n])
    uwagi = []
    if n == "mieta":
        uwagi.append(f"kwiaty mięty: {kwiaty_miety(rgb, alfa)} px")
    arr = na_kafel(rgb, alfa)
    zat = zatkaj_dziury(arr)
    if zat:
        uwagi.append(f"zatkane dziury: {zat} px")
    return wysrodkuj(arr), uwagi


def podglad(ikony, sciezka):
    """Rząd nowych 8x, pod nim nowe 2x i 1x oraz stare 2x (jeśli były)."""
    S, gap = 8, 10
    kol = list(ZIOLA)
    blok = R * S + 2 * gap + R * 2 + 20
    im = Image.new("RGBA", (len(kol) * (R * S + gap) + gap, blok), (0x1C, 0x20, 0x30, 255))
    for i, n in enumerate(kol):
        ic = Image.fromarray(ikony[n], "RGBA")
        x = gap + i * (R * S + gap)
        im.alpha_composite(ic.resize((R * S, R * S), Image.NEAREST), (x, gap))
        y2 = R * S + 2 * gap
        im.alpha_composite(ic.resize((R * 2, R * 2), Image.NEAREST), (x, y2))
        im.alpha_composite(ic, (x + R * 2 + gap, y2 + R // 2))
        stary = CEL / ZIOLA[n][3]
        if stary.exists():
            st = Image.open(stary).convert("RGBA").resize((R * 2, R * 2), Image.NEAREST)
            im.alpha_composite(st, (x + R * 3 + 2 * gap, y2))
    sciezka.parent.mkdir(parents=True, exist_ok=True)
    im.save(sciezka)
    print(f"\npodgląd: {sciezka}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", type=Path)
    args = ap.parse_args()

    ikony, bledy = {}, []
    print(f"{'zioło':<11} {'plik':<26} {'kol.':>4} {'kontrast':>8} {'światło':>8} {'gr.kontur':>9}")
    for n in ZIOLA:
        arr, uwagi = zbuduj(n)
        ikony[n] = arr
        al = arr[..., 3] > 0
        kolory = len({tuple(p) for p in arr[al][:, :3]})
        kt, sw, gk = kontrast(arr), pomiar_swiatla(arr), gruby_kontur(arr)
        print(f"{n:<11} {ZIOLA[n][3]:<26} {kolory:>4} {kt:>8.0f} {sw:>+8.0f} {gk:>9.2f}"
              + (f"   {'; '.join(uwagi)}" if uwagi else ""))
        if kt < MIN_KONTRAST:
            bledy.append(f"{n}: kontrast do kafla {kt:.0f} < {MIN_KONTRAST}")
        if gk > MAX_GRUBY_KONTUR:
            bledy.append(f"{n}: gruby kontur {gk:.2f} > {MAX_GRUBY_KONTUR}")
        if arr.shape[:2] != (R, R):
            bledy.append(f"{n}: rozmiar {arr.shape[:2]}")
    print("\nodrębność par (1−IoU / treść):")
    for a, b in PARY:
        o = odrebnosc(ikony[a], ikony[b])
        print(f"  {a:<11} ↔ {b:<11} {o:.2f}")
        if o < MIN_ODREBNOSC:
            bledy.append(f"{a} ↔ {b}: odrębność {o:.2f} < {MIN_ODREBNOSC}")
    bledy += bledy_srodka(ikony)

    if args.podglad:
        podglad(ikony, args.podglad)
    if bledy:
        print("\n⛔ BŁĘDY:")
        for b in bledy:
            print("  " + b)
        return 1
    if args.zapisz:
        for n, arr in ikony.items():
            Image.fromarray(arr, "RGBA").save(CEL / ZIOLA[n][3])
        print(f"\n✅ zapisano {len(ikony)} ikon do {CEL}")
    else:
        print("\n✅ bez błędów — przymiar, nic nie zapisano (--zapisz)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

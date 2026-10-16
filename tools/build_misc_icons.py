# -*- coding: utf-8 -*-
"""
Ikony BIŻUTERII, JEDZENIA i SUROWCÓW z arkuszy Gemini — wsady C, D, E
(`docs/gemini_item_icons.md` §4–§6).

    python tools/build_misc_icons.py                    # przymiar: raport, NIC nie zapisuje
    python tools/build_misc_icons.py --podglad X.png    # + podgląd 8x, 2x, 1x i stare ikony
    python tools/build_misc_icons.py --zapisz           # zapis do public/assets/items/

Potok zejścia do 28 px jest TEN SAM co przy ziołach i stamtąd importowany
(`build_herb_icons.zmniejsz`: głosowanie wnętrza, ciemne przerwy → ton
o krok ciemniejszy, potem kontur 4-sąsiedni i zatkanie dziur). Różni się
wyłącznie wycinanie:

⚠ **Tło ZALEWANE OD BRZEGU KOMÓRKI, nie dopasowane kolorem.** Każdy z trzech
arkuszy przyszedł na innym tle niż magenta z promptu (beż, szarość 128,
surowce — inny beż w każdej komórce), a szare futro wilka, szkło fiolki
i jasna nić leżą blisko tych kolorów. Zalewanie przechodzi tylko przez
piksele bliskie koloru brzegu i zatrzymuje się na konturze przedmiotu,
więc szarość WEWNĄTRZ futra zostaje.

⚠ Arkusz biżuterii ma narysowane LINIE SIATKI między komórkami — komórka
jest przycinana o `MARGINES` px z każdej strony.
"""
import argparse
import sys
from collections import deque
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
from build_herb_icons import (  # noqa: E402
    zmniejsz, zatkaj_dziury, ciemne, PROG_CIEMNEGO, WNETRZE,
    MIN_ODREBNOSC, MIN_KONTRAST, MAX_GRUBY_KONTUR,
)

KORZEN = Path(__file__).resolve().parent.parent
GEMINI = KORZEN / "docs" / "art-review" / "gemini"
CEL = KORZEN / "public" / "assets" / "items"
R = 32
MARGINES = 3        # linie siatki biżuterii leżą na granicach komórek
TOLERANCJA_TLA = 22
UDZIAL_TLA = 0.05   # kolor brzegu jest tłem, gdy zajmuje ≥ 5% obwodu komórki
MIN_OKNO = 12       # zamknięta plama koloru tła od tylu px to okno, nie detal

ARKUSZE = {"C": "jewelry_v1_raw.png", "D": "food_v1_raw.png", "E": "materials_v1_raw.png",
           # Ponowienie samego gruczołu (§6.5): v1 z arkusza E czytał się jak
           # oliwkowa GRUSZKA — przewód narysowany jak ogonek owocu.
           "V": "venom_gland_v2_raw.png"}

#: id przedmiotu → (arkusz, (wiersz, kolumna), plik w grze)
PRZEDMIOTY = {
    "ring_precision": ("C", (0, 0), "icon_ring_precision.png"),
    "ring_swiftness": ("C", (0, 1), "icon_ring_swiftness.png"),
    "ring_vigor": ("C", (0, 2), "icon_ring_vigor.png"),
    "ring_warding": ("C", (1, 0), "icon_ring_warding.png"),
    "grey_fang": ("C", (1, 1), "icon_grey_fang.png"),
    "grey_fang_necklace": ("C", (1, 2), "icon_grey_fang_necklace.png"),
    "bread": ("D", (0, 0), "icon_bread.png"),
    "cheese": ("D", (0, 1), "icon_cheese.png"),
    "eggs": ("D", (0, 2), "icon_egg.png"),
    "cooked_meat": ("D", (1, 0), "icon_cooked_meat.png"),
    "rabbit_meat": ("D", (1, 1), "icon_rabbit_meat.png"),
    "health_potion": ("D", (1, 2), "icon_health_potion.png"),
    "leather_scraps": ("E", (0, 0), "icon_leather_scraps.png"),
    "wolf_pelt": ("E", (0, 1), "icon_wolf_pelt.png"),
    "boar_hide": ("E", (0, 2), "icon_boar_hide.png"),
    "bear_hide": ("E", (1, 0), "icon_bear_hide.png"),
    "spider_silk": ("E", (1, 1), "icon_spider_silk.png"),
    "venom_gland": ("V", None, "icon_venom_gland.png"),   # cały arkusz = jedna sztuka
}

#: Pary, które gracz może pomylić (§4.1, §5.1, §6.1).
PARY = [("ring_precision", "ring_swiftness"), ("ring_precision", "ring_vigor"),
        ("ring_precision", "ring_warding"), ("ring_swiftness", "ring_vigor"),
        ("ring_swiftness", "ring_warding"), ("ring_vigor", "ring_warding"),
        ("grey_fang", "grey_fang_necklace"), ("cooked_meat", "rabbit_meat"),
        ("leather_scraps", "wolf_pelt"), ("leather_scraps", "boar_hide"),
        ("leather_scraps", "bear_hide"), ("wolf_pelt", "boar_hide"),
        ("wolf_pelt", "bear_hide"), ("boar_hide", "bear_hide")]

#: Rozjaśnienie przedmiotów, które ginęły na kafelku plecaka.
#: Kontrast przed (próg 50): karneol 45, pieczeń 39, fiolka 33, dzik −4,
#: niedźwiedź 11. ⚠ Skóra dzika ZOSTAJE ciemniejsza od niedźwiedziej
#: („ciemnobrązowo-czarna” ↔ „ciemna czekolada”, §6.1).
#: Gamma na jasności V (`podnies_jasnosc`), kontrast po: 60 / 58 / 56 / 55 / 67.
GAMMA = {"ring_vigor": 0.85, "cooked_meat": 0.65, "health_potion": 0.6,
         "boar_hide": 0.55, "bear_hide": 0.4}

#: Przerwy, które ZOSTAJĄ w kolorze konturu (próg udziału czerni arkusza
#: w polu). Skóra dzika: spirala zwoju, przewiązka i szczecina to czarne
#: linie na prawie czarnym materiale — „krok ciemniej” nie miał czego
#: podstawić, a po rozjaśnieniu rulon czytał się jak kamienny wałek.
CIEMNE_ZOSTAJA = {"boar_hide": 0.4}


# ════════════════════════════════════════════════════════════════════════
def zdejmij_tlo(k):
    """Zalewanie 4-sąsiednie od brzegu komórki przez piksele bliskie
    któregokolwiek z kolorów brzegu (tolerancja `TOLERANCJA_TLA`)."""
    rgb = k[..., :3]
    H, W = rgb.shape[:2]
    brzeg = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    # ⚠ Tylko kolory DOMINUJĄCE na brzegu. Łapy niedźwiedzia i futro wilka
    #   dotykają brzegu komórki — ze wszystkimi kolorami brzegu zalewanie
    #   zjadało całą skórę (przymiar 2026-10-05).
    wartosci, ile = np.unique(brzeg, axis=0, return_counts=True)
    wzorce = wartosci[ile >= UDZIAL_TLA * len(brzeg)]
    blisko = np.zeros((H, W), bool)
    for c in wzorce:
        blisko |= np.sqrt(((rgb - c) ** 2).sum(axis=2)) < TOLERANCJA_TLA
    tlo = np.zeros((H, W), bool)
    q = deque((y, x) for y in range(H) for x in range(W)
              if (y in (0, H - 1) or x in (0, W - 1)) and blisko[y, x])
    for y, x in q:
        tlo[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and blisko[ny, nx] and not tlo[ny, nx]:
                tlo[ny, nx] = True
                q.append((ny, nx))
    # Zamknięte okna tła (wnętrze pierścienia, pętla rzemienia) — zalewanie
    # od brzegu do nich nie dociera. Spójna plama „bliskiego tłu” koloru
    # ≥ `MIN_OKNO` px też jest tłem.
    zostalo = blisko & ~tlo
    widziane = np.zeros_like(zostalo)
    for y0, x0 in zip(*np.nonzero(zostalo)):
        if widziane[y0, x0]:
            continue
        komp, st = [], [(y0, x0)]
        widziane[y0, x0] = True
        while st:
            y, x = st.pop()
            komp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and zostalo[ny, nx] and not widziane[ny, nx]:
                    widziane[ny, nx] = True
                    st.append((ny, nx))
        if len(komp) >= MIN_OKNO:
            for y, x in komp:
                tlo[y, x] = True
    k[tlo, 3] = 0
    return k


def wytnij(arkusz, cell):
    a = np.array(Image.open(GEMINI / ARKUSZE[arkusz]).convert("RGBA")).astype(int)
    H, W = a.shape[:2]
    if cell is None:
        k = a.copy()
    else:
        r, c = cell
        k = a[round(r * H / 2) + MARGINES:round((r + 1) * H / 2) - MARGINES,
              round(c * W / 3) + MARGINES:round((c + 1) * W / 3) - MARGINES].copy()
    k = zdejmij_tlo(k)
    ys, xs = np.nonzero(k[..., 3])
    return k[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def zbuduj(n):
    arkusz, cell, _ = PRZEDMIOTY[n]
    k = wytnij(arkusz, cell)
    rgb, alfa = zmniejsz(k, PROG_CIEMNEGO)
    uwagi = []
    zostaja = np.zeros_like(alfa)
    if n in CIEMNE_ZOSTAJA:
        # ⚠ tylko WNĘTRZE: na brzegu sylwetki zachowana czerń stawała obok
        #   konturu `na_kafel` i dawała obrys 2 px (gruby kontur 0,46)
        p = np.pad(alfa, 1)
        wnetrze = alfa & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
        zostaja = wnetrze & (udzial_czerni(k) >= CIEMNE_ZOSTAJA[n])
    if n in GAMMA:
        podnies_jasnosc(rgb, alfa & ~zostaja, GAMMA[n])
    rgb[zostaja] = KONTUR
    arr = na_kafel(rgb, alfa)
    zat = zatkaj_dziury(arr)
    if zat:
        uwagi.append(f"zatkane dziury: {zat} px")
    return wysrodkuj(arr), uwagi



def udzial_czerni(k):
    """Udział konturu arkusza w polu źródłowym każdego piksela docelowego —
    ta sama siatka pól co `build_herb_icons.zmniejsz`."""
    H, W = k.shape[:2]
    s = WNETRZE / max(H, W)
    w, h = max(1, round(W * s)), max(1, round(H * s))
    al = k[..., 3] > 0
    dk = al & ciemne(k[..., :3])
    out = np.zeros((h, w))
    for ty in range(h):
        y0 = int(ty * H / h)
        y1 = max(y0 + 1, int((ty + 1) * H / h))
        for tx in range(w):
            x0 = int(tx * W / w)
            x1 = max(x0 + 1, int((tx + 1) * W / w))
            out[ty, tx] = dk[y0:y1, x0:x1].sum() / max(1, al[y0:y1, x0:x1].sum())
    return out


def podnies_jasnosc(rgb, alfa, g):
    """Gamma na samej JASNOŚCI (V w HSV), odcień i nasycenie bez zmian.
    ⚠ Nie `build_herb_icons.podnies` (gamma po kanałach RGB): przy prawie
    czarnych brązach wyrównuje kanały i skóra dzika wyszła SZARA jak kamień
    (przymiar 2026-10-05). Przy zieleniach ziół tego nie było widać."""
    px = rgb[alfa].astype(float) / 255
    mx = px.max(axis=1, keepdims=True)
    nowe = np.where(mx > 0, mx ** g, 0)
    skala = np.divide(nowe, mx, out=np.ones_like(mx), where=mx > 0)
    rgb[alfa] = np.clip(np.round(px * skala * 255), 0, 255).astype(np.uint8)


def podglad(ikony, sciezka):
    """Na arkusz: rząd nowych 8x, pod nim nowe 2x i 1x oraz stare 2x."""
    S, gap = 8, 10
    grupy = [[n for n in PRZEDMIOTY if PRZEDMIOTY[n][0] == a] for a in ARKUSZE]
    blok = R * S + 3 * gap + R * 2
    im = Image.new("RGBA", (6 * (R * S + gap) + gap, blok * len(grupy)), (0x1C, 0x20, 0x30, 255))
    for g, kol in enumerate(grupy):
        for i, n in enumerate(kol):
            ic = Image.fromarray(ikony[n], "RGBA")
            x, y = gap + i * (R * S + gap), g * blok + gap
            im.alpha_composite(ic.resize((R * S, R * S), Image.NEAREST), (x, y))
            y2 = y + R * S + gap
            im.alpha_composite(ic.resize((R * 2, R * 2), Image.NEAREST), (x, y2))
            im.alpha_composite(ic, (x + R * 2 + gap, y2 + R // 2))
            stary = CEL / PRZEDMIOTY[n][2]
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
    print(f"{'przedmiot':<19} {'plik':<30} {'kol.':>4} {'kontrast':>8} {'światło':>8} {'gr.kontur':>9}")
    for n in PRZEDMIOTY:
        arr, uwagi = zbuduj(n)
        ikony[n] = arr
        al = arr[..., 3] > 0
        kolory = len({tuple(p) for p in arr[al][:, :3]})
        kt, sw, gk = kontrast(arr), pomiar_swiatla(arr), gruby_kontur(arr)
        print(f"{n:<19} {PRZEDMIOTY[n][2]:<30} {kolory:>4} {kt:>8.0f} {sw:>+8.0f} {gk:>9.2f}"
              + (f"   {'; '.join(uwagi)}" if uwagi else ""))
        if kt < MIN_KONTRAST:
            bledy.append(f"{n}: kontrast do kafla {kt:.0f} < {MIN_KONTRAST}")
        if gk > MAX_GRUBY_KONTUR:
            bledy.append(f"{n}: gruby kontur {gk:.2f} > {MAX_GRUBY_KONTUR}")
        if arr.shape[:2] != (R, R):
            bledy.append(f"{n}: rozmiar {arr.shape[:2]}")
    print("\nodrębność par:")
    for a, b in PARY:
        o = odrebnosc(ikony[a], ikony[b])
        print(f"  {a:<19} ↔ {b:<19} {o:.2f}")
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
            Image.fromarray(arr, "RGBA").save(CEL / PRZEDMIOTY[n][2])
        print(f"\n✅ zapisano {len(ikony)} ikon do {CEL}")
    else:
        print("\n✅ bez błędów — przymiar, nic nie zapisano (--zapisz)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Ikony tarcz METALOWYCH (żelazo / stal) — WARSTWA METALU na drewnianym masterze.

    python tools/build_metal_shield_icons.py                    # przymiar, NIC nie zapisuje
    python tools/build_metal_shield_icons.py --podglad X.png    # + podgląd 8x i półka
    python tools/build_metal_shield_icons.py --zapisz           # zapis do public/assets/items/

── Co to jest ───────────────────────────────────────────────────────────────
Macierz materiałów (`docs/tarcze_checkpoint.md` §1.3) mówi, czym jest metalowa
tarcza w tym katalogu — i to NIE jest blacha:

  puklerz   — LITY metal (cały)
  okrągła   — okucie krawędzi + UMBO
  rycerska  — okucie krawędzi
  migdałowa — okucie, „dużo metalu" (tylko żelazo)
  legionowa — UMBO + okucie krawędzi
  pawęż     — ⛔ brak wersji metalowej

⭐ Drewniany master (`build_shield_icons.py`) jest ZAMKNIĘTY i zostaje
nietknięty: ten plik bierze jego rysunek i KŁADZIE na nim metal — dokładnie to,
co master zapowiada („umbo, obrzeże i metal są osiami WARIANTU i dokładają się
DO tej bryły"). Sylwetka metalowej tarczy = sylwetka drewnianej (asercja).
⭐ Jedna ikona na (konstrukcja, gatunek): warianty lekki / ciężki dzielą ikonę,
jak w drewnie. Żelazo = stal z zamianą rampy stopień w stopień.

── Lekcje z mastera (rewizja 2, piasta usunięta), które tu obowiązują ───────
  · umbo progowane po promieniu przy r = 2 px wychodzi ROMBEM → r ≥ 3;
  · pełny łuk cienia pod piastą czyta się jak UŚMIECH → cień tylko w ćwiartce
    od cienia, od światła jasny łuk;
  · piasta jaśniejsza od oświetlonego lica pcha się na pierwszy plan → blask
    umba to jeden piksel, reszta w środkowych stopniach.

── Kolory ───────────────────────────────────────────────────────────────────
Metal: `tools/metal_palette.py` (wspólny standard, `OI-126`). Drewno: master.
"""
import math
import os
import sys

import numpy as np
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_shield_icons as master  # noqa: E402
from metal_palette import STEEL, IRON, na_zelazo_kolor  # noqa: E402
from icon_center import wysrodkuj, bledy_srodka  # noqa: E402
from wood_palette import KONTUR, paleta as paleta_drewna  # noqa: E402
import shield_shapes  # noqa: E402 — OKUCIA: wspólne z modelem 3D

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CEL = os.path.join(ROOT, "public", "assets", "items")
L2 = (-0.6, -0.8)                         # światło z lewej-góry (ekran)
L3 = (-0.48, -0.56, 0.68)                 # to samo w 3D dla brył

#: (konstrukcja) → co dokłada metal. `gatunki` — które istnieją w katalogu.
METAL = {
    # ⚠ Puklerz: umbo WYRAŹNE (autor 2026-10-02) — r 3,6 i ciemny kołnierz;
    #   przy r 2,9 i jasnym kołnierzu ginęło w kopule lica.
    "buckler": dict(lity=True, umbo=3.6, kolnierz_ciemny=True, gatunki=("iron", "steel")),
    "round":   dict(obrecz=2, umbo=3.4, gatunki=("iron", "steel")),
    # ⚠ BEZ nitów (autor 2026-10-03): jasna kropka z ciemnym cieniem czytała
    #   się jak GUZIK przyszyty do obręczy. Rycerską niesie sama obręcz.
    "heater":  dict(obrecz=2, gatunki=("iron", "steel")),
    # ⚠ Migdałowa: UMBO w górnej, najszerszej części (autor 2026-10-02), nie
    #   dwa poprzeczne pasy — pasy z obręczą w zwężającym się kształcie
    #   czytały się jak drabinka (v1).
    "almond":  dict(obrecz=2, umbo=3.2, umbo_y=0.32, gatunki=("iron",)),
    "scutum":  dict(obrecz=2, umbo=3.6, gatunki=("iron", "steel")),
}


def ton(i):
    return STEEL[int(max(0, min(4, i)))]


def warstwy(m, n):
    """Lista n kolejnych pierścieni wnętrza od zewnątrz (każdy 1 px)."""
    out, cur = [], master.erozja(m)
    for _ in range(n):
        nxt = master.erozja(cur)
        out.append(cur & ~nxt)
        cur = nxt
    return out, cur


def umbo(img, cx, cy, r, kolnierz_ciemny=False):
    """Kopuła: lambert w 3D, blask = 1 piksel, łuk kołnierza jasny od
    światła i ciemny TYLKO w ćwiartce od cienia (nie pełny łuk — „uśmiech").
    `kolnierz_ciemny` — kołnierz w całości ciemny (puklerz: umbo na metalu
    musi się od lica ODCIĄĆ, na drewnie robi to sam kontrast materiałów)."""
    h, w = img.shape[:2]
    # ⚠ Kołnierz = BRZEG czystego koła pikselowego (koło minus jego erozja),
    #   nie pas odległości |dd − r|: tamten zostawiał sterczące piksele na
    #   przekątnych i umbo na drewnie czytało się jak ZĘBATKA (v3).
    yy, xx = np.mgrid[0:h, 0:w]
    dd = np.hypot(xx - cx, yy - cy)
    kolo = dd <= r            # ⚠ nie r + 0,3: tamto dawało kanciaste, prawie kwadratowe koło (v4)
    er = kolo.copy()
    er[1:, :] &= kolo[:-1, :]; er[:-1, :] &= kolo[1:, :]
    er[:, 1:] &= kolo[:, :-1]; er[:, :-1] &= kolo[:, 1:]
    brzeg = kolo & ~er
    for y, x in zip(*np.nonzero(kolo)):
        dx, dy = (x - cx) / r, (y - cy) / r
        if brzeg[y, x]:
            cien = dx * L2[0] + dy * L2[1] < -0.35
            if kolnierz_ciemny:
                img[y, x, :3] = ton(0 if cien else 1)
            else:
                img[y, x, :3] = ton(1 if cien else 3)
            continue
        d = min(1.0, math.hypot(dx, dy))
        nz = math.sqrt(max(0.0, 1 - d * d))
        s = dx * L3[0] + dy * L3[1] + nz * L3[2]
        # wnętrze kopuły w JASNYCH stopniach (2–3): odcina je kołnierz
        img[y, x, :3] = ton(3 if s > 0.60 else 2)
    # jeden piksel blasku w lewej-górnej części kopuły
    bx, by = int(round(cx - r * 0.35)), int(round(cy - r * 0.35))
    img[by, bx, :3] = ton(4)


def rysuj_metal(t, spec):
    img, w, h = master.rysuj(t)
    img = img.copy()
    m = master.maska(t["ksztalt"], w, h)
    wn = master.erozja(m)
    cx, cy = (w - 1) / 2.0, (h - 1) / 2.0
    yy, xx = np.mgrid[0:h, 0:w]
    u = (xx - cx) / (w / 2.0)
    v = (yy - cy) / (h / 2.0)
    nrm = np.hypot(u, v) + 1e-6
    lit = (u * L2[0] + v * L2[1]) / nrm             # normalna ≈ kierunek od środka

    if spec.get("lity"):
        # LITY puklerz: kopuła na całym wnętrzu, wąski uniesiony rant
        s = master.lambert_kula(u, v)
        idx = np.where(s > 0.80, 3, np.where(s > 0.55, 2, 1))
        for i in (1, 2, 3):
            img[wn & (idx == i), :3] = ton(i)
        rant, _ = warstwy(m, 1)
        r0 = rant[0]
        img[r0 & (lit > 0.3), :3] = ton(4)
        img[r0 & (lit <= 0.3) & (lit > -0.4), :3] = ton(3)
        img[r0 & (lit <= -0.4), :3] = ton(1)
    if spec.get("obrecz"):
        rant, _ = warstwy(m, spec["obrecz"])
        zew, wew = rant[0], rant[-1]
        # zewnętrzny piksel obręczy: oświetlony od strony światła
        img[zew & (lit > 0.45), :3] = ton(4)
        img[zew & (lit <= 0.45) & (lit > 0.0), :3] = ton(3)
        img[zew & (lit <= 0.0) & (lit > -0.45), :3] = ton(2)
        img[zew & (lit <= -0.45), :3] = ton(1)
        # wewnętrzny: faza ku drewnu — światło z przeciwnej strony
        img[wew & (lit > 0.3), :3] = ton(1)
        img[wew & (lit <= 0.3) & (lit > -0.3), :3] = ton(2)
        img[wew & (lit <= -0.3), :3] = ton(3)
    if spec.get("pasy"):
        rant, srodek = warstwy(m, spec.get("obrecz", 0) or 1)
        for frac in spec["pasy"]:
            y0 = int(round(h * frac))
            for dy, tt in ((0, 3), (1, 2)):
                row = srodek[y0 + dy]
                img[y0 + dy, row, :3] = ton(tt)
            for x in np.nonzero(srodek[y0])[0][[0, -1]]:   # nit na końcach pasa
                img[y0, x, :3] = ton(4)
    if spec.get("nity"):
        rant, srodek = warstwy(m, spec.get("obrecz", 0) + 1)
        tor = rant[-1]                                   # pierścień tuż pod obręczą
        pts = sorted(zip(*np.nonzero(tor)), key=lambda p: math.atan2(p[0] - cy, p[1] - cx))
        krok = max(1, len(pts) // spec["nity"])
        for k in range(0, len(pts), krok):
            y, x = pts[k]
            img[y, x, :3] = ton(4)
            if y + 1 < h and x + 1 < w and wn[y + 1, x + 1] and not tor[y + 1, x + 1]:
                img[y + 1, x + 1, :3] = ton(0)
    if spec.get("umbo"):
        rzedy = np.nonzero(wn.any(axis=1))[0]
        uy = rzedy[0] + (rzedy[-1] - rzedy[0]) * spec["umbo_y"] if "umbo_y" in spec else cy
        umbo(img, cx, uy, spec["umbo"], spec.get("kolnierz_ciemny", False))
    return img, w, h, m, wn


def na_plotno(t, img):
    w_cel = master.CELL
    h_cel = t["rows"] * master.CELL
    cel = np.zeros((h_cel, w_cel, 4), np.uint8)
    h, w = img.shape[:2]
    cel[(h_cel - h) // 2:(h_cel - h) // 2 + h, (w_cel - w) // 2:(w_cel - w) // 2 + w] = img
    return wysrodkuj(cel)


def na_zelazo(arr):
    out = arr.copy()
    a = out[..., 3] > 0
    for y, x in zip(*np.nonzero(a)):
        out[y, x, :3] = na_zelazo_kolor(out[y, x, :3])
    return out


def main():
    paleta = {tuple(int(v) for v in c) for c in paleta_drewna()} | {tuple(c) for c in (*STEEL, *IRON, KONTUR)}
    stal = {tuple(c) for c in STEEL}
    zel = {tuple(c) for c in IRON}
    ikony, bledy = {}, []
    po_tarczy = {t["key"]: t for t in master.TARCZE}
    print("=== tarcze metalowe (warstwa metalu na masterze) ===")
    for key, spec in METAL.items():
        t = po_tarczy[key]
        drewno = na_plotno(t, master.rysuj(t)[0])
        img, w, h, m, wn = rysuj_metal(t, spec)
        steel = na_plotno(t, img)
        warianty = {"steel": steel, "iron": na_zelazo(steel)}
        for gat in spec["gatunki"]:
            arr = warianty[gat]
            nazwa = f"{gat}_{key}"
            ikony[nazwa] = arr
            a = arr[..., 3] > 0
            kolory = {tuple(int(v) for v in q[:3]) for q in arr[a]}
            if not np.array_equal(a, drewno[..., 3] > 0):
                bledy.append(f"{nazwa}: sylwetka różna od drewnianego mastera — konstrukcja się zmieniła")
            if kolory - paleta:
                bledy.append(f"{nazwa}: kolory spoza palety {sorted(kolory - paleta)[:3]}")
            if gat == "steel" and kolory & zel - stal:
                bledy.append(f"{nazwa}: stal z tonami żelaza")
            if gat == "iron" and kolory & stal - zel:
                bledy.append(f"{nazwa}: żelazo z tonami stali")
            rampa = stal if gat == "steel" else zel
            metal = np.zeros_like(a)
            for c in rampa:
                metal |= np.all(arr[..., :3] == c, axis=-1)
            metal &= a
            # ⚠ Mianownik to WNĘTRZE bez konturu — przy 17-px puklerzu kontur to
            #   ponad 20% sylwetki i „79% metalu" znaczyło całe wnętrze w metalu.
            wnetrze = a & ~np.all(arr[..., :3] == KONTUR, axis=-1)
            udzial = metal.sum() / max(1, wnetrze.sum())
            if spec.get("lity") and udzial < 0.85:
                bledy.append(f"{nazwa}: lity puklerz ma tylko {udzial:.0%} metalu")
            if not spec.get("lity") and not 0.12 <= udzial <= 0.6:
                bledy.append(f"{nazwa}: udział metalu {udzial:.0%} poza 12–60% (to okucie, nie blacha)")
            # obręcz: każdy piksel pierwszego pierścienia wnętrza ma być metalem
            if spec.get("obrecz") or spec.get("lity"):
                kontur = np.all(arr[..., :3] == KONTUR, axis=-1) & a
                pod = a & ~kontur
                # pierwszy pierścień pod konturem
                er = pod.copy()
                er[1:, :] &= pod[:-1, :]; er[:-1, :] &= pod[1:, :]
                er[:, 1:] &= pod[:, :-1]; er[:, :-1] &= pod[:, 1:]
                pier = pod & ~er
                pokrycie = (metal & pier).sum() / max(1, pier.sum())
                if pokrycie < 0.95:
                    bledy.append(f"{nazwa}: obręcz kryje {pokrycie:.0%} krawędzi")
            ys, xs = np.nonzero(a)
            cy_, cx_ = (ys.min() + ys.max()) // 2, (xs.min() + xs.max()) // 2
            uy_ = int(round(ys.min() + (ys.max() - ys.min()) * spec["umbo_y"])) if "umbo_y" in spec else cy_
            if "umbo" in spec and not metal[uy_, cx_]:
                bledy.append(f"{nazwa}: brak umba tam, gdzie ma być")
            if "umbo" not in spec and not spec.get("lity") and metal[cy_, cx_] or                     "umbo_y" in spec and metal[cy_, cx_]:
                bledy.append(f"{nazwa}: metal w środku tarczy bez umba")
            print(f"  {nazwa:<14} {arr.shape[1]}x{arr.shape[0]}  metal {udzial:4.0%}")
        if np.array_equal(warianty["steel"], warianty["iron"]):
            bledy.append(f"{key}: żelazo identyczne ze stalą — zamiana rampy nie zadziałała")

    bledy += bledy_srodka(ikony)
    # ⭐ Ta sama macierz okuć co w modelu 3D (`shield_shapes.OKUCIA`) — inaczej
    #   ikona w sklepie pokazuje umbo, a tarcza w ręku gołą deskę.
    bledy += shield_shapes.zgodnosc_z_ikonami(METAL)

    if "--podglad" in sys.argv:
        podglad(ikony, sys.argv[sys.argv.index("--podglad") + 1])
    if bledy:
        print("\nBŁĘDY:")
        for b in bledy:
            print("  [X] " + b)
        print("⛔ Nic nie zapisano.")
        return 1
    if "--zapisz" not in sys.argv:
        print("\nwszystkie kontrole zielone — PRZYMIAR, nic nie zapisano (--zapisz)")
        return 0
    for nazwa, arr in ikony.items():
        Image.fromarray(arr, "RGBA").save(os.path.join(CEL, f"icon_shield_{nazwa}.png"))
    print(f"\nZAPISANO {len(ikony)} ikon → public/assets/items/icon_shield_*.png")
    return 0


def podglad(ikony, sciezka):
    """Rząd 1 (8x): dla każdej konstrukcji drewno | stal | żelazo.
    Rząd 2: półka 2x jak w plecaku."""
    S = 6
    tlo = (0x1c, 0x20, 0x30, 255)
    po_tarczy = {t["key"]: t for t in master.TARCZE}
    kolumny = []
    for key, spec in METAL.items():
        t = po_tarczy[key]
        kolumny.append(Image.fromarray(na_plotno(t, master.rysuj(t)[0]), "RGBA"))
        for gat in ("steel", "iron"):
            if f"{gat}_{key}" in ikony:
                kolumny.append(Image.fromarray(ikony[f"{gat}_{key}"], "RGBA"))
    szer = len(kolumny) * (32 * S + 10) + 10
    im = Image.new("RGBA", (szer, 64 * S + 20 + 64 * 2 + 20), (28, 28, 32, 255))
    x = 10
    for ic in kolumny:
        y = 10 + (64 - ic.height) * S // 2
        im.alpha_composite(Image.new("RGBA", (32 * S, ic.height * S), tlo), (x, y))
        im.alpha_composite(ic.resize((32 * S, ic.height * S), Image.NEAREST), (x, y))
        x += 32 * S + 10
    x = 10
    y0 = 64 * S + 30
    for ic in kolumny:
        y = y0 + (64 - ic.height) * 2
        im.alpha_composite(Image.new("RGBA", (64, ic.height * 2), tlo), (x, y))
        im.alpha_composite(ic.resize((64, ic.height * 2), Image.NEAREST), (x, y))
        x += 70
    os.makedirs(os.path.dirname(sciezka), exist_ok=True)
    im.save(sciezka)
    print(f"\npodgląd: {sciezka}")


if __name__ == "__main__":
    sys.exit(main())

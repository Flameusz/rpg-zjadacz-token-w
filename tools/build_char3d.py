"""char.blend -> arkusz sprite'a postaci (pre-render 3D, jak Diablo/Fallout).

    python tools/build_char3d.py                 # PRZYMIAR: renderuje, raportuje, podglad do temp
    python tools/build_char3d.py --zapisz        # dopiero to pisze do public/assets/characters/
    python tools/build_char3d.py --wysokosc 60   # inna wysokosc klatki
    python tools/build_char3d.py --kat 25        # inny kat kamery nad horyzontem

Trzy etapy: Blender renderuje klatki 4x wieksze niz docelowe (`char3d_blender.py`),
tutaj skladamy je w arkusz i sprowadzamy do pixel-artu - twarda alfa, kwantyzacja
do palety `Character.png` i kontur z maski alfa.

⚠ PALETA I KONTUR IDA Z GRY, nie z renderu. Kolory sa snapowane do tych, ktore
naprawde wystepuja w `characters/Character.png`, a kontur to jego najciemniejszy
kolor - inaczej renderowana postac stoi obok reszty grafiki jak wklejka.

⚠ KOLEJNOSC: kwantyzacja wnetrza NAJPIERW, kontur NA KONCU. Odwrotnie kontur
wpada do kwantyzacji i znika tam, gdzie jest najcienszy (ta sama pulapka co
w `build_ikony_jedzenia.py`).

⚠ WSPOLNE KADROWANIE dla wszystkich klatek i kierunkow. Kadrowanie per klatka
daje postac skaczaca w pionie - stopy nie stoja na tej samej linii.

Znane ograniczenie, zmierzone: przy klatce 24x60 (wysokosc obecnego
`Character.png`) ramie ma 2-3 px, a kontur po obu stronach zjada z niego prawie
wszystko. Sylwetka czyta sie dopiero od ~39x96. To jest decyzja o rozmiarze
postaci w grze, nie usterka generatora.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLEND = os.path.join(ROOT, "public", "assets", "char.blend")
REF = os.path.join(ROOT, "public", "assets", "characters", "Character.png")
CEL = os.path.join(ROOT, "public", "assets", "characters", "char3d.png")
SKRYPT = os.path.join(ROOT, "tools", "char3d_blender.py")

KIERUNKI = ["down", "up", "left", "right"]
# Renderujemy tylko trzy kierunki; "right" powstaje jako LUSTRO "left".
# Powod jest zmierzony: studyjne swiatlo Workbencha jest kierunkowe, wiec profil
# prawy wychodzil zauwazalnie jasniejszy od lewego i chod migotal przy zmianie
# kierunku. Lustro wypalamy w PLIKU (np.fliplr), tak jak w Character.png.
RENDEROWANE = ["down", "up", "left"]
# Akcja "Walk" ma tylko trzy pozy: kontakt-L (0), przejscie (1), kontakt-P (2).
# Cykl 4-klatkowy sklada sie z nich jako 0-1-2-1, czyli klasyczny chod z dwoma
# przejsciami. Kolejnosc kolumn zgodna z ASSETS.character (walkFromCol..walkToCol).
CYKL = [0, 1, 2, 1]
NADPROBKOWANIE = 4

# Paleta gry, z ktorej wolno brac kolory. ⚠ NIE JEST NIA sam `Character.png`:
# jego biala koszula i czarne spodnie na gladko cieniowanym modelu 3D czytaja
# sie jak garnitur ("wyglada jak adwokat"), a wies jest slowianska,
# wczesnopiastowska (`docs/swiat.md`). Strojem jest niefarbowany len i ciemna
# welna — czyli to, co naprawde nosza sasiedzi na wlasnych sprite'ach.
ZRODLA_PALETY = [
    "characters/Character.png", "characters/NPC.png", "characters/hunter_portrait.png",
    "peasant.png", "elder.png", "father.png", "blacksmith.png",
]

# Rampy cieniowania per strefa, WYBRANE Z TEJ PALETY (kolory zmierzone w plikach,
# nie dobrane). Od najjasniejszego do najciemniejszego.
#
# ⚠ Rampy sa RESTRYKCYJNE i to jest celowe. Snapowanie do najblizszego koloru
# w calej palecie przenosi piksel do obcej kategorii: zacieniona skora
# (184,140,130) miala blizej do szarosci #979797 niz do wlasnego tonu i twarz
# wychodzila szara. Ta sama pulapka co przy `snap_paleta.py` — wyjatek dopisuje
# sie jako JEDEN jawny kolor, nie przez otwarcie calej palety.
RAMPY = {
    "skin":     [(254, 198, 153), (253, 176, 132), (225, 153, 112), (198, 121, 88)],
    "shirt":    [(177, 145, 107), (158, 117, 98), (137, 102, 74), (128, 86, 62)],
    "trousers": [(72, 72, 82), (60, 58, 60), (45, 45, 52), (27, 27, 32)],
    "hair":     [(55, 38, 29), (27, 27, 32), (18, 16, 26)],
    "boots":    [(95, 56, 42), (73, 35, 29), (62, 33, 30)],
}


def znajdz_blender():
    """Blender nie jest w PATH na Windowsie - szukamy typowych lokalizacji."""
    z_path = shutil.which("blender")
    if z_path:
        return z_path
    najlepszy = None
    for baza in (r"C:\Program Files\Blender Foundation",
                 r"C:\Program Files (x86)\Blender Foundation"):
        if not os.path.isdir(baza):
            continue
        for wpis in sorted(os.listdir(baza), reverse=True):
            exe = os.path.join(baza, wpis, "blender.exe")
            if os.path.isfile(exe) and najlepszy is None:
                najlepszy = exe
    return najlepszy


def renderuj(outdir, wys_px, kat):
    blender = znajdz_blender()
    if not blender:
        sys.exit("BLAD: nie znaleziono blender.exe (ani w PATH, ani w Program Files).")
    print(f"[blender] {blender}")
    cmd = [
        blender, "-b", BLEND, "--python", SKRYPT, "--",
        outdir, str(wys_px * NADPROBKOWANIE), str(kat),
        ",".join(str(f) for f in sorted(set(CYKL))), ",".join(RENDEROWANE),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    for linia in p.stdout.splitlines():
        if linia.startswith(("[fix]", "[strefy]", "[bbox]", "[render]", "[gotowe]", "[UWAGA]")):
            print("  " + linia)
    if p.returncode != 0:
        print(p.stdout[-3000:], p.stderr[-3000:])
        sys.exit(f"BLAD: Blender zwrocil {p.returncode}")


def sprawdz_rampy():
    """Kazdy kolor rampy MUSI naprawde wystepowac w grafice gry.

    ⚠ Asercja, ktora nie potrafi zaswiecic na czerwono, jest dekoracja: gdyby
    ktos wpisal tu kolor "z glowy", postac stanelaby obok reszty grafiki jako
    wklejka i zaden raport by tego nie pokazal. Po celowej zmianie jednej
    skladowej ten test zglasza BLAD.
    """
    gdzie = {}
    for rel in ZRODLA_PALETY:
        sciezka = os.path.join(ROOT, "public", "assets", *rel.split("/"))
        if not os.path.exists(sciezka):
            print(f"  [UWAGA] brak zrodla palety: {rel}")
            continue
        a = np.array(Image.open(sciezka).convert("RGBA")).reshape(-1, 4)
        a = a[a[:, 3] > 200][:, :3].astype(int)
        for c in np.unique(a, axis=0):
            gdzie.setdefault(tuple(int(v) for v in c), set()).add(os.path.basename(rel))

    obce = [(z, c) for z, ramp in RAMPY.items() for c in ramp if tuple(c) not in gdzie]
    if obce:
        for z, c in obce:
            print(f"  BLAD: rampa {z} uzywa #{c[0]:02x}{c[1]:02x}{c[2]:02x}, "
                  f"ktorego NIE MA w zadnym ze zrodel palety")
        sys.exit("BLAD: rampy rozjechaly sie z paleta gry.")

    posort = sorted(gdzie)
    luma = np.array(posort) @ np.array([0.299, 0.587, 0.114])
    kontur = posort[int(luma.argmin())]
    print(f"[paleta] {len(ZRODLA_PALETY)} zrodel, {len(gdzie)} kolorow; rampy zgodne; "
          f"kontur #{kontur[0]:02x}{kontur[1]:02x}{kontur[2]:02x}")
    for z, ramp in RAMPY.items():
        skad = ", ".join(f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}<-{sorted(gdzie[tuple(c)])[0]}"
                         for c in ramp)
        print(f"  {z:9} {skad}")
    return np.array(kontur)


def zloz(srcdir, wys_px):
    kontur = sprawdz_rampy()
    with open(os.path.join(srcdir, "strefy.json"), encoding="utf-8") as fh:
        strefy = json.load(fh)
    nazwy = list(strefy)
    kolory_stref = np.array([strefy[z] for z in nazwy], dtype=int)

    def para(d, f):
        cien = Image.open(os.path.join(srcdir, f"{d}_{f:02d}.png")).convert("RGBA")
        ident = Image.open(os.path.join(srcdir, f"{d}_{f:02d}_id.png")).convert("RGBA")
        return cien, ident

    surowe = {(d, f): para(d, f) for d in RENDEROWANE for f in set(CYKL)}
    for f in set(CYKL):
        surowe[("right", f)] = tuple(im.transpose(Image.FLIP_LEFT_RIGHT)
                                     for im in surowe[("left", f)])

    x0, y0, x1, y1 = 10**9, 10**9, -1, -1
    for cien, _ in surowe.values():
        ys, xs = np.nonzero(np.array(cien)[..., 3] > 8)
        x0, x1 = min(x0, xs.min()), max(x1, xs.max())
        y0, y1 = min(y0, ys.min()), max(y1, ys.max())
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    szer_px = int(round(cw * wys_px / ch))
    print(f"[kadr] tresc renderu {cw}x{ch} -> klatka {szer_px}x{wys_px}")

    def zmniejsz(im, filtr):
        return np.array(im.crop((x0, y0, x1 + 1, y1 + 1))
                        .resize((szer_px, wys_px), filtr))

    licznik = {z: 0 for z in nazwy}

    def na_pixelart(cien_im, id_im):
        c = zmniejsz(cien_im, Image.LANCZOS)
        # ⚠ MASKA STREF IDZIE PRZEZ NEAREST, NIGDY PRZEZ INTERPOLACJE.
        # Przy LANCZOS piksel na styku dwoch stref dostaje ich SREDNIA, a taki
        # kolor nie nalezy do zadnej strefy - i najblizszym sasiadem bywa
        # zupelnie trzecia. Zmierzone: srednia bialej koszuli (247,247,247)
        # i ciemnych spodni (60,58,60) to ok. (153,152,153), do ktorego blizej
        # jest ze skory (225,171,159) niz z obu zrodel. Efekt: pasek golej
        # skory przez caly brzuch na styku koszuli i spodni, widoczny dopiero
        # przy powiekszeniu 8x - w pelnej klatce ginie.
        ident = zmniejsz(id_im, Image.NEAREST)
        maska = c[..., 3] >= 110                     # twarda alfa: pixel-art nie znosi poltonow
        out = np.zeros_like(c)
        out[..., 3] = np.where(maska, 255, 0)
        yy, xx = np.nonzero(maska)

        # strefa piksela - z przebiegu PLASKIEGO, gdzie kolor jest dokladny
        idrgb = ident[yy, xx, :3].astype(int)
        d = ((idrgb[:, None, :] - kolory_stref[None, :, :]) ** 2).sum(axis=2)
        zi = d.argmin(axis=1)

        # jasnosc z przebiegu CIENIOWANEGO -> stopien rampy TEJ strefy
        lum = c[yy, xx, :3].astype(float) @ np.array([0.299, 0.587, 0.114])
        for k, z in enumerate(nazwy):
            sel = zi == k
            if not sel.any():
                continue
            licznik[z] += int(sel.sum())
            ramp = np.array(RAMPY[z], dtype=int)
            l = lum[sel]
            lo, hi = l.min(), l.max()
            t = np.zeros_like(l) if hi - lo < 1e-6 else (hi - l) / (hi - lo)   # 0 = najjasniej
            stopien = np.clip((t * len(ramp)).astype(int), 0, len(ramp) - 1)
            out[yy[sel], xx[sel], :3] = ramp[stopien]                 # 1. kwantyzacja wnetrza

        pad = np.pad(maska, 1, constant_values=False)
        brzeg = maska & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
        out[brzeg, :3] = kontur                                        # 2. kontur na koncu
        return Image.fromarray(out, "RGBA")

    ark = Image.new("RGBA", (szer_px * len(CYKL), wys_px * len(KIERUNKI)), (0, 0, 0, 0))
    for r, d in enumerate(KIERUNKI):
        for c, f in enumerate(CYKL):
            ark.paste(na_pixelart(*surowe[(d, f)]), (c * szer_px, r * wys_px))
    print("[strefy w arkuszu] " + ", ".join(f"{z}={n}px" for z, n in licznik.items()))
    return ark, szer_px


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true",
                    help=f"zapisz arkusz do {os.path.relpath(CEL, ROOT)}")
    ap.add_argument("--wysokosc", type=int, default=96, help="wysokosc klatki w px (domyslnie 96)")
    ap.add_argument("--kat", type=float, default=15.0,
                    help="kat kamery nad horyzontem w stopniach (domyslnie 15, "
                         "zmierzone jako najblizsze obecnemu Character.png)")
    a = ap.parse_args()

    tmp = os.path.join(tempfile.gettempdir(), "char3d_klatki")
    os.makedirs(tmp, exist_ok=True)
    renderuj(tmp, a.wysokosc, a.kat)
    ark, szer = zloz(tmp, a.wysokosc)

    px = np.array(ark).reshape(-1, 4)
    n_kol = len(np.unique(px[px[:, 3] > 0][:, :3], axis=0))
    print(f"[arkusz] {ark.width}x{ark.height}, klatka {szer}x{a.wysokosc}, "
          f"{len(CYKL)} kolumn x {len(KIERUNKI)} rzedow, {n_kol} kolorow")

    podglad = os.path.join(tmp, "podglad_x5.png")
    duzy = ark.resize((ark.width * 5, ark.height * 5), Image.NEAREST)
    tlo = Image.new("RGBA", duzy.size, (74, 88, 66, 255))
    tlo.alpha_composite(duzy)
    tlo.save(podglad)
    print(f"[podglad] {podglad}  <- OBEJRZYJ GO, raport nie powie, czy sylwetka sie czyta")

    if a.zapisz:
        ark.save(CEL)
        print(f"[ZAPIS] {CEL}")
        print("  ⚠ Sam plik nie wystarczy - zeby gra go zobaczyla trzeba jeszcze:")
        print("    1. wpisu ASSETS.<klucz> w src/config/GameConfig.ts (klucz + sciezka + siatka klatek)")
        print("    2. JAWNEJ linii load.spritesheet(...) w queueImages() w src/core/Assets.ts")
        print("    Bez punktu 2 tekstura po prostu nie istnieje, a tsc jest czysty.")
    else:
        print("[przymiar] nic nie zapisano. Zapis: --zapisz")


if __name__ == "__main__":
    main()

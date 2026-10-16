"""Składa podgląd wariantów pancerza w jedną tablicę do obejrzenia.

    python tools/build_char3d_armor.py                  # render + tablica do temp
    python tools/build_char3d_armor.py --tylko-skladaj  # bez ponownego renderu

⚠ To jest PRZYMIAR, nie generator assetu — nic nie zapisuje do public/assets/.
Odpowiada na jedno pytanie: „czy ta bryła czyta się jak pancerz", a na to
odpowiada oko, nie liczba wielokątów.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLEND = os.path.join(ROOT, "public", "assets", "char.blend")
SKRYPT = os.path.join(ROOT, "tools", "char3d_preview_armor.py")

# ⚠ Klucze = id przedmiotów z `char3d_armor.WARIANTY` (od 2026-10-03 pancerz
#   to sztuki z gry, nie dwie atrapy „lekki"/„ciezki"). Podgląd renderuje
#   KAŻDĄ sztukę osobno; tablica bierze trzy reprezentatywne.
STANY = [("bez", "bez pancerza"), ("gambeson", "L1 — przeszywanica"),
         ("mail_hauberk", "L2 — kolczuga")]
RZEDY = [("front", "bezruch"), ("front", "ciecie"), ("profil", "ciecie")]
OPISY = {("front", "bezruch"): "przód, bezruch",
         ("front", "ciecie"): "przód, cięcie",
         ("profil", "ciecie"): "profil, cięcie"}


def znajdz_blender():
    z = shutil.which("blender")
    if z:
        return z
    for baza in (r"C:\Program Files\Blender Foundation",
                 r"C:\Program Files (x86)\Blender Foundation"):
        if os.path.isdir(baza):
            for wpis in sorted(os.listdir(baza), reverse=True):
                exe = os.path.join(baza, wpis, "blender.exe")
                if os.path.isfile(exe):
                    return exe
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tylko-skladaj", action="store_true")
    a = ap.parse_args()

    tmp = os.path.join(tempfile.gettempdir(), "char3d_pancerz")
    os.makedirs(tmp, exist_ok=True)

    if not a.tylko_skladaj:
        blender = znajdz_blender()
        if not blender:
            sys.exit("BLAD: nie znaleziono blender.exe")
        p = subprocess.run([blender, "-b", BLEND, "--python", SKRYPT, "--", tmp],
                           capture_output=True, text=True)
        for linia in p.stdout.splitlines():
            if linia.startswith(("[pancerz]", "[gotowe]", "[strefy]", "[atak]")):
                print("  " + linia)
        if p.returncode != 0:
            print(p.stdout[-2000:], p.stderr[-2000:])
            sys.exit(f"BLAD: Blender zwrocil {p.returncode}")

    im = {}
    for stan, _ in STANY:
        for widok, poza in RZEDY:
            sc = os.path.join(tmp, f"{stan}_{widok}_{poza}.png")
            im[(stan, widok, poza)] = Image.open(sc).convert("RGBA")
    w = max(i.width for i in im.values())
    h = max(i.height for i in im.values())

    pad, lab, gora = 12, 150, 30
    ark = Image.new("RGBA", (lab + len(STANY) * (w + pad) + pad,
                             gora + len(RZEDY) * (h + pad) + pad), (58, 66, 58, 255))
    dr = ImageDraw.Draw(ark)
    for c, (_stan, opis) in enumerate(STANY):
        dr.text((lab + pad + c * (w + pad), 10), opis, fill=(255, 255, 255, 255))
    for r, (widok, poza) in enumerate(RZEDY):
        dr.text((10, gora + pad + r * (h + pad) + h // 2),
                OPISY[(widok, poza)], fill=(240, 240, 230, 255))
        for c, (stan, _o) in enumerate(STANY):
            ark.alpha_composite(im[(stan, widok, poza)],
                                (lab + pad + c * (w + pad), gora + pad + r * (h + pad)))
    cel = os.path.join(tmp, "pancerz_tablica.png")
    ark.save(cel)
    print(f"[tablica] {cel} {ark.size}  <- OBEJRZYJ JĄ")


if __name__ == "__main__":
    main()

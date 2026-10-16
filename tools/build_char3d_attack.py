"""Składa podgląd akcji ataku w jeden pasek do obejrzenia.

    python tools/build_char3d_attack.py            # render + pasek do temp
    python tools/build_char3d_attack.py --tylko-skladaj   # bez ponownego renderu

⚠ To jest PRZYMIAR, nie generator assetu — nic nie zapisuje do public/assets/.
Odpowiada wyłącznie na pytanie „czy ten cios daje się przeczytać", a na to
pytanie odpowiada oko, nie liczba.
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
SKRYPT = os.path.join(ROOT, "tools", "char3d_preview_attack.py")
FAZY = ["gotowość", "zamach", "cięcie", "przeniesienie", "powrót"]


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

    tmp = os.path.join(tempfile.gettempdir(), "char3d_atak")
    os.makedirs(tmp, exist_ok=True)

    if not a.tylko_skladaj:
        blender = znajdz_blender()
        if not blender:
            sys.exit("BLAD: nie znaleziono blender.exe")
        p = subprocess.run([blender, "-b", BLEND, "--python", SKRYPT, "--", tmp],
                           capture_output=True, text=True)
        for linia in p.stdout.splitlines():
            if linia.startswith(("[atak]", "[kadr]", "[gotowe]", "[strefy]", "[fix]")):
                print("  " + linia)
        if p.returncode != 0:
            print(p.stdout[-2000:], p.stderr[-2000:])
            sys.exit(f"BLAD: Blender zwrocil {p.returncode}")

    rzedy = ["front", "profil"]
    klatki = sorted(int(f.split("_")[1].split(".")[0])
                    for f in os.listdir(tmp) if f.startswith("front_"))
    im = {(r, k): Image.open(os.path.join(tmp, f"{r}_{k:02d}.png")).convert("RGBA")
          for r in rzedy for k in klatki}
    w = max(i.width for i in im.values())
    h = max(i.height for i in im.values())
    pad, lab, gora = 10, 60, 26
    ark = Image.new("RGBA", (lab + len(klatki) * (w + pad) + pad,
                             gora + len(rzedy) * (h + pad) + pad), (58, 66, 58, 255))
    dr = ImageDraw.Draw(ark)
    for c, k in enumerate(klatki):
        etykieta = FAZY[k] if k < len(FAZY) else str(k)
        dr.text((lab + pad + c * (w + pad), 8), f"{k}. {etykieta}", fill=(240, 240, 230, 255))
    for r, nazwa in enumerate(rzedy):
        dr.text((8, gora + pad + r * (h + pad) + h // 2), nazwa, fill=(240, 240, 230, 255))
        for c, k in enumerate(klatki):
            ark.alpha_composite(im[(nazwa, k)], (lab + pad + c * (w + pad),
                                                 gora + pad + r * (h + pad)))
    cel = os.path.join(tmp, "atak_pasek.png")
    ark.save(cel)
    print(f"[pasek] {cel} {ark.size}  <- OBEJRZYJ GO")


if __name__ == "__main__":
    main()

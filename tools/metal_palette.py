# -*- coding: utf-8 -*-
"""
METAL — wspólny standard palety ekwipunku (bliźniak `tools/wood_palette.py`).

Dwa gatunki, ta sama liczba stopni, ciemny → światło:

  STEEL — chłodna, niebieskawa szarość (B > R), wysoki kontrast;
  IRON  — neutralna, ledwie cieplejsza szarość (R ≥ G ≥ B o 1–3), niższy
          kontrast; ciemniejsza od stali na każdym stopniu.

⭐ Żelazny bliźniak powstaje ze stalowego ZAMIANĄ RAMPY STOPIEŃ W STOPIEŃ
(`na_zelazo`), nie osobnym rysunkiem — ta sama bryła, inny gatunek
(`docs/decyzje/2026-09-15-gatunek-materialu-zelazo-stal.md`).

Pochodzenie liczb (2026-10-02, `OI-126`): rampy żyły lokalnie
w `build_armor_icons.py` i przeszły tam przegląd czytelności 2026-09-30
(żelazo rozjaśnione +12…+26 na stopień — na tle kafla kolczuga miała kontrast
28 i czytała się jak czarna plama, a duża płyta oliwkowo). Stopnie 0, 2, 4
stali = tony sztyletów, stopień 1 = `S_MID` mieczy.
⚠ NIE rampa noża (`build_ikony_sztyletow.IRON`, 3 tony, cieplejsza): na
dużej płaszczyźnie czytała się jak BRĄZ. Noże i sztylety stoją na niej do dziś
— ich kontrast 14–28 przy progu 50 to otwarta część `OI-126`.

⛔ Nie wpisuj szarości „tylko dla tarczy" — od tego zaczyna się dziesięć
mikro-palet zamiast dwóch gatunków metalu.

    python tools/metal_palette.py      # wydruk + niezmienniki
"""
import sys

STEEL = ((56, 62, 68), (84, 93, 101), (112, 122, 130), (160, 168, 176), (218, 225, 231))
IRON = ((58, 57, 56), (88, 87, 85), (116, 114, 111), (146, 143, 139), (176, 172, 166))


def jasnosc(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def na_zelazo_kolor(c):
    """Kolor stali → kolor żelaza tego samego stopnia; inne kolory bez zmian."""
    for s, i in zip(STEEL, IRON):
        if tuple(c) == tuple(s):
            return tuple(i)
    return tuple(c)


def niezmienniki():
    bledy = []
    for nazwa, r in (("STEEL", STEEL), ("IRON", IRON)):
        j = [jasnosc(c) for c in r]
        if any(b <= a for a, b in zip(j, j[1:])):
            bledy.append(f"{nazwa}: jasność nie rośnie monotonicznie {j}")
    for k, (s, i) in enumerate(zip(STEEL, IRON)):
        if not s[2] > s[0]:
            bledy.append(f"stopień {k}: stal nie jest chłodna (B ≤ R) {s}")
        if not (i[0] >= i[1] >= i[2]):
            bledy.append(f"stopień {k}: żelazo nie jest neutralno-ciepłe (R ≥ G ≥ B) {i}")
    kontrast_s = jasnosc(STEEL[-1]) - jasnosc(STEEL[0])
    kontrast_i = jasnosc(IRON[-1]) - jasnosc(IRON[0])
    if not kontrast_i < kontrast_s:
        bledy.append(f"żelazo ma kontrast {kontrast_i:.0f} ≥ stali {kontrast_s:.0f} — gatunki się nie różnią")
    if not jasnosc(IRON[-1]) < jasnosc(STEEL[-1]):
        bledy.append("najjaśniejsze żelazo nie jest ciemniejsze od najjaśniejszej stali")
    return bledy


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print("METAL — wspólny standard palety ekwipunku")
    for k, (s, i) in enumerate(zip(STEEL, IRON)):
        print(f"  {k}  stal {str(s):<17} {jasnosc(s):6.1f}   żelazo {str(i):<17} {jasnosc(i):6.1f}")
    b = niezmienniki()
    print("\n" + ("\n".join("  [X] " + x for x in b) if b else "wszystkie niezmienniki zielone"))
    sys.exit(1 if b else 0)

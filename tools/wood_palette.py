# -*- coding: utf-8 -*-
"""
DREWNO — WSPÓLNY STANDARD PALETY DLA CAŁEGO DREWNIANEGO EKWIPUNKU.

⭐⭐ To NIE jest paleta tarcz. To paleta DREWNA w tym świecie: tarcze, rękojeści
mieczy, trzonki toporów, styliska młotów, pałki, drzewce włóczni, łuki, kusze,
skrzynie, beczki, meble. Assety mają się różnić kształtem i użyciem rampy,
nie własnym zestawem brązów — gracz ma podświadomie widzieć „to jest drewno
z tego samego świata".

Importuj to zamiast wpisywać brązy u siebie:

    from wood_palette import RAMPA, ton, KONTUR, DROBNE

────────────────────────────────────────────────────────────────────────────
STRUKTURA: 12 + 16 + 1 = 29 kolorów
────────────────────────────────────────────────────────────────────────────
  RAMPA[0..11]   — kręgosłup materiału, skok jasności ~1,16x
  SŁOJE          — te same szczeble w wariancie cieplejszym / chłodniejszym,
                   ⚠ WYŁĄCZNIE dla stopni 3..10 (patrz niżej)
  KONTUR         — jeden ton na obwódkę całego ekwipunku

⚠⚠ SŁÓJ ISTNIEJE TYLKO TAM, GDZIE OKO GO WIDZI — stopnie 3..10.
To jest zmierzona decyzja, nie oszczędność. W wersji z wariantami na wszystkich
13 szczeblach jedenaście kolorów niosło łącznie **0,26% pikseli rodziny tarcz**
(`Wc12` — 2 piksele, `W12` — 3, `Wz12` — 6): odcień prawie-czerni i
prawie-bieli jest nierozróżnialny, więc wariant tam był czystą dekoracją
budżetu. W cieniu i w świetle drewno różni się JASNOŚCIĄ, a nie barwą.

⚠ RAMPA MA 12 STOPNI (przeszła 13 → 10 → 12). Poprzednia, gęstsza (skok 1,15x) dawała ładne
przejścia na dużej płaszczyźnie, ale przy 32 px to jest strata: sąsiednie
szczeble zlewały się, a skrajne cztery praktycznie nie istniały w obrazie.
Przy 10 stopniach duże płaszczyzny bandowały, przy 13 skrajne cztery szczeble
były martwe; 12 trafia w oba warunki. ⚠ Liczba kolorów NIE jest celem — 23 nie
było sukcesem, a 29 nie jest porażką. Liczy się, że każdy ton ma zadanie.

────────────────────────────────────────────────────────────────────────────
JAK UŻYWAĆ NA MAŁYM ELEMENCIE (rękojeść, trzonek, drzewce, łuk)
────────────────────────────────────────────────────────────────────────────
⚠ Drzewce włóczni ma 2–4 px szerokości i NIE zmieści gładkiej rampy. Bierz
co trzeci szczebel (`DROBNE` = 2/5/8/10): przy jednym pikselu na ton różnica
sąsiednich szczebli ginie i element czyta się jak jednolity patyk.
⚠ Sprawdzone przymiarem `--probka`: siedem typowych przedmiotów spoza tarcz
używa 21 z 29 tonów standardu. Nieużyte tam są dwa najciemniejsze (drzewce
nie ma tak głębokiego cienia), trzy warianty ciemnego pasma i akcent D11.

⚠ SŁOJE SĄ DLA DUŻYCH PŁASZCZYZN (lico tarczy, wieko skrzyni, blat). Na
trzonku o szerokości 3 px zmiana barwy per deska nie ma czego różnicować —
użyj samej `RAMPA`.

⚠ KONTUR MUSI MIEĆ ZAPAS JASNOŚCI x2,00 DO `RAMPA[0]` (dziś x3,00). Przy
mniejszym median cut przy sześciu kolorach skleja kontur z najciemniejszym
drewnem i przedmiot traci obwódkę — usterka widoczna wyłącznie w teście
redukcji, nie w pełnej palecie.

Uruchomienie tego pliku wprost drukuje paletę i sprawdza jej niezmienniki.
"""
import sys

# PIL jest potrzebny WYLACZNIE w trybie --probka, wiec importuje sie go
# lokalnie, w miejscu uzycia.
# UWAGA: import na poziomie modulu ROZBIJAL IMPORT TEGO PLIKU W BLENDERZE -
# Blender ma numpy, ale NIE ma PIL. Odkryte, gdy `char3d_shields.py` zaczal
# brac stad rampe drewna dla modeli 3D tarcz (2026-09-21). Objaw bylby
# mylacy: caly generator modeli wywala sie na palecie kolorow.
# STOP: nie przenos tego z powrotem na gore pliku.

# ── kręgosłup: 12 stopni, skok jasności ~1,16x ──────────────────────────────
# ⚠ Stopnie są LICZONE, nie dobierane na oko — trzy osie, każda z własnym
#   powodem, przy stałej jasności (x1,15 ± 0,01 na szczebel):
#
#   JASNOŚĆ  rośnie geometrycznie 30 → 150. To ona niesie formę.
#
#   NASYCENIE MALEJE KU GÓRZE: 0,64 na dole → 0,45 na szczycie. ⚠⚠ To jest
#   lekarstwo na „żółto-morelowe drewno": brąz o nasyceniu 0,55 przy jasności
#   150 przestaje być drewnem i staje się MORELĄ. W cieniu odwrotnie — ciemny
#   ton MUSI zostać nasycony, inaczej robi się szary muł.
#
#   ODCIEŃ schodzi 24,5° → 22° w górnej połowie rampy. Morela to żółto-
#   pomarańczowy, więc światło odchyla się od żółci ku czerwieni.
#   ⛔ Nie schodź do 20°: sprawdzone renderem — całość ucieka w mahoń, czyli
#   dokładnie tam, skąd wyszliśmy, odrzucając rampę z `items.png`.
RAMPA = [
    (43, 27, 16),     #  0  najgłębszy cień
    (50, 31, 18),     #  1  cień konstrukcji
    (57, 36, 21),     #  2  ciemne drewno, spoina w cieniu
    (65, 41, 24),     #  3  spoina w świetle
    (75, 48, 29),     #  4  strona odwrócona od światła
    (87, 56, 34),     #  5  półcień
    (100, 64, 40),    #  6  baza w cieniu
    (115, 75, 48),    #  7  BAZA materiału
    (130, 86, 59),    #  8  baza w świetle
    (149, 101, 71),   #  9  strona oświetlona
    (170, 117, 86),   # 10  światło
    (192, 137, 106),  # 11  akcent, kant pod światło
]

# ── słoje: ta sama jasność, inna barwa. Tylko stopnie 3..10 ─────────────────
# ⚠⚠ GÓRNA GRANICA PASMA SŁOJA TO POMIAR, NIE SYMETRIA. D10 dostał warianty,
#   bo był NAJWIĘKSZĄ JEDNOLITĄ PLAMĄ całej rodziny: 591 px = 15,7% lica
#   w jednym kolorze, i to po stronie oświetlonej, gdzie materiał czyta się
#   najmocniej. Po dołożeniu wariantów plama spada do 163 px, a 428 px
#   dostaje zróżnicowanie deska-po-desce.
# ⛔ D11 wariantów NIE DOSTAJE i to też jest pomiar: na tarczach niosłyby
#   2,9% (cienki kant), a na próbce przedmiotów spoza tarcz (rękojeść,
#   stylisko, drzewce, beczka, skrzynia) **zero pikseli**. Kolor bezużyteczny
#   poza jednym rodzajem przedmiotu nie należy do standardu materiału.
SLOJ_OD, SLOJ_DO = 3, 10
_CIEPLY = (1.035, 1.00, 0.945)
_CHLODNY = (0.965, 0.995, 1.06)

KONTUR = (14, 9, 5)

# ⚠ Podzbiór dla elementów cieńszych niż ~6 px — co trzeci szczebel.
DROBNE = [2, 5, 8, 10]


def _przesun(kolor, k):
    return tuple(min(255, max(0, int(round(c * m)))) for c, m in zip(kolor, k))


def ton(stopien, sloj=0):
    """
    Kolor dla (stopień rampy, słój). `sloj`: 0 neutralny, 1 cieplejszy,
    2 chłodniejszy. Poza pasmem SLOJ_OD..SLOJ_DO słój jest IGNOROWANY —
    i to jest reguła standardu, nie zaokrąglenie.
    """
    stopien = max(0, min(len(RAMPA) - 1, int(stopien)))
    baza = RAMPA[stopien]
    if sloj == 0 or not (SLOJ_OD <= stopien <= SLOJ_DO):
        return baza
    return _przesun(baza, _CIEPLY if sloj == 1 else _CHLODNY)


def paleta():
    """Pełna lista unikalnych kolorów standardu (z konturem)."""
    out = [KONTUR]
    for i in range(len(RAMPA)):
        for s in (0, 1, 2):
            k = ton(i, s)
            if k not in out:
                out.append(k)
    return out


def _jasnosc(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def sprawdz():
    """Niezmienniki standardu. Każdy potrafi zaświecić na czerwono."""
    bledy = []
    j = [_jasnosc(c) for c in RAMPA]
    if any(j[i] >= j[i + 1] for i in range(len(j) - 1)):
        bledy.append("rampa nie jest monotoniczna po jasności")
    skoki = [j[i + 1] / j[i] for i in range(len(j) - 1)]
    if min(skoki) < 1.10 or max(skoki) > 1.35:
        bledy.append(f"skok jasności poza 1,10–1,35x: {min(skoki):.2f}–{max(skoki):.2f}")
    zapas = j[0] / _jasnosc(KONTUR)
    if zapas < 2.0:
        bledy.append(f"kontur ma zapas tylko x{zapas:.2f} do RAMPA[0] (minimum x2,00)")
    for i, c in enumerate(RAMPA):
        if not (c[0] > c[1] > c[2]):
            bledy.append(f"RAMPA[{i}] {c} nie jest brązem (wymagane R > G > B)")
    p = paleta()
    if len(p) != len(set(p)):
        bledy.append("paleta zawiera duplikaty")
    if len(p) > 40:
        bledy.append(f"paleta ma {len(p)} kolorów, budżet to 40")
    return bledy, zapas, skoki


# ────────────────────────────────────────────────────────────────────────────
# PRÓBKA: czy standard pracuje POZA tarczami (`--probka`)
# ────────────────────────────────────────────────────────────────────────────
# ⚠ To nie są assety do gry, tylko przymiar palety na kształtach, które będą
# jej używać: rękojeść, stylisko, trzonek, drzewce, pałka, beczka, skrzynia.
# Powód istnienia: kolor, który świetnie wygląda na lico tarczy 27x47 px i jest
# bezużyteczny na drzewcu 3 px szerokości, NIE należy do standardu drewna.
PROBKI = [
    ("rekojesc", 5, 14, "walec", 2),
    ("stylisko", 3, 26, "walec", 1),
    ("trzonek", 4, 22, "walec", 1),
    ("drzewce", 3, 30, "walec", 1),
    ("palka", 7, 20, "walec", 2),
    ("beczka", 19, 22, "beczka", 5),
    ("skrzynia", 21, 16, "plaski", 4),
    # ⚠ Dwa DUŻE, oświetlone lica są w tej próbce celowo: to one sprawdzają tony
    #   z górnego pasma rampy. Sama rękojeść i drzewce nigdy tam nie sięgną,
    #   więc próbka złożona z samych cienkich przedmiotów fałszywie uznałaby
    #   światło za „kolor tylko dla tarczy".
    ("wieko", 28, 20, "beczka", 6),
    ("blat", 30, 13, "plaski", 6),
]


def _probka(nazwa, w, h, forma, desek):
    """Prosty przedmiot z tej samej logiki: forma + deski + spoina + krawędź."""
    import numpy as np

    yy, xx = np.mgrid[0:h, 0:w]
    cx = (w - 1) / 2.0
    u = (xx - cx) / (w / 2.0)
    v = (yy - (h - 1) / 2.0) / (h / 2.0)
    if forma == "beczka":
        maska = (np.abs(u) / (1.0 - 0.10 * v * v)) ** 6 + np.abs(v) ** 8 <= 1.0
    elif forma == "plaski":
        maska = (np.abs(u) ** 8 + np.abs(v) ** 8) <= 1.0
    else:
        maska = np.abs(u) <= 1.0 - 0.02 * v * v
    nz = np.sqrt(np.clip(1.0 - u * u, 0.0, 1.0))
    lam = np.clip(-0.60 * u + 0.80 * nz, 0.0, 1.0)
    amp = 5.5 if forma != "plaski" else 3.0
    poziom = 7.0 + (lam - 0.58) * amp * (len(RAMPA) - 1) / 12.0
    sloj = np.zeros((h, w), int)
    if desek > 1:
        for i in range(1, desek):
            sx = int(round(cx + (i - desek / 2.0) * (w / float(desek))))
            if 0 <= sx < w:
                poziom[:, sx] -= 3.4 * (len(RAMPA) - 1) / 12.0
            if 0 <= sx + 1 < w:
                poziom[:, sx + 1] += 0.85 * (len(RAMPA) - 1) / 12.0
        nr = sum((xx >= int(round(cx + (i - desek / 2.0) * (w / float(desek))))).astype(int)
                 for i in range(1, desek))
        for i in range(desek):
            sloj = np.where(nr == i, (0, 1, 2, 0, 2, 1)[i % 6], sloj)
    poziom[0, :] += 0.5
    poziom[-1, :] -= 1.0
    idx = np.clip(np.rint(poziom), 0, len(RAMPA) - 1).astype(int)
    img = np.zeros((h, w, 4), np.uint8)
    for i in range(len(RAMPA)):
        for s in (0, 1, 2):
            img[maska & (idx == i) & (sloj == s)] = (*ton(i, s), 255)
    brzeg = maska.copy()
    brzeg[1:-1, 1:-1] &= ~(maska[:-2, 1:-1] & maska[2:, 1:-1] & maska[1:-1, :-2] & maska[1:-1, 2:])
    img[brzeg] = (*KONTUR, 255)
    img[~maska] = 0
    return img


def probka():
    """Rysuje arkusz próbek i raportuje, które tony standardu na nich pracują."""
    import collections

    import numpy as np
    from PIL import Image

    W = sum(p[1] + 3 for p in PROBKI) + 3
    H = max(p[2] for p in PROBKI) + 6
    ark = np.zeros((H, W, 4), np.uint8)
    x = 3
    uzyte = collections.Counter()
    for nazwa, w, h, forma, desek in PROBKI:
        img = _probka(nazwa, w, h, forma, desek)
        ark[3 : 3 + h, x : x + w] = img
        for c, n in collections.Counter(map(tuple, img[img[..., 3] > 0][:, :3])).items():
            uzyte[tuple(int(q) for q in c)] += n
        x += w + 3
    return Image.fromarray(ark, "RGBA"), uzyte


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    bledy, zapas, skoki = sprawdz()
    p = paleta()
    print("=" * 72)
    print("DREWNO — wspólny standard palety ekwipunku")
    print("=" * 72)
    print(f"{'stopień':<9}{'neutralny':>16}{'cieplejszy':>16}{'chłodniejszy':>16}{'jasność':>9}")
    for i in range(len(RAMPA)):
        n, c, z = ton(i, 0), ton(i, 1), ton(i, 2)
        sl = "" if SLOJ_OD <= i <= SLOJ_DO else "  (bez słoja)"
        print(f"  {i:<7}{str(n):>16}{str(c) if c != n else '—':>16}"
              f"{str(z) if z != n else '—':>16}{_jasnosc(n):>9.1f}{sl}")
    print("-" * 72)
    print(f"kontur {KONTUR}, zapas do RAMPA[0]: x{zapas:.2f}")
    print(f"skok jasności: {min(skoki):.2f}–{max(skoki):.2f}x")
    print(f"kolorów w standardzie: {len(p)}  (budżet 40)")
    print(f"podzbiór dla cienkich elementów (DROBNE): {DROBNE}")

    if "--probka" in sys.argv:
        from PIL import Image
        ark, uzyte = probka()
        ark.save("docs/art-review/wood-palette-probka.png")
        pod = ark.resize((ark.width * 8, ark.height * 8), Image.NEAREST)
        tlo = Image.new("RGBA", pod.size, (30, 27, 31, 255))
        tlo.alpha_composite(pod)
        tlo.save("docs/art-review/wood-palette-probka-x8.png")
        print("")
        print("PRÓBKA POZA TARCZAMI — rękojeść, stylisko, trzonek, drzewce, pałka,")
        print("                       beczka, skrzynia, wieko, blat")
        print(f"  tonów standardu użytych na próbkach: {len(uzyte)} z {len(p)}")
        for i in range(len(RAMPA)):
            for s in (0, 1, 2):
                k = ton(i, s)
                if s and k == RAMPA[i]:
                    continue
                n = uzyte.get(k, 0)
                if n:
                    print(f"    D{i}{'nc z'[s] if s else 'n'}: {n:>4} px")
        martwe = [k for k in p if k not in uzyte]
        if martwe:
            print(f"  ⚠ tony NIEUŻYTE poza tarczami ({len(martwe)}): {martwe}")
        print("  zapisano docs/art-review/wood-palette-probka(-x8).png")

    print("\nBŁĘDY:" if bledy else "\nwszystkie niezmienniki zielone")
    for b in bledy:
        print("  [X] " + b)
    return 1 if bledy else 0


if __name__ == "__main__":
    sys.exit(main())

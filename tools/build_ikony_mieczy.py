"""
Ikony DWÓCH NOWYCH MIECZY — kafle 32x32 dopisane do `public/assets/items/items.png`.

── Po co to istnieje ──────────────────────────────────────────────────────
Bo na arkuszu NIE MA sylwetki, która przy 17,6 px czyta się jako miecz
WIĘKSZY od pozostałych — i to jest fakt POLICZONY, nie wrażenie:

```
   wolny kafel (0,2)   174 px, wiersze  6–30
   wolny kafel (0,3)   185 px, wiersze  3–30
   ⛔ `sword` (0,5)     239 px, wiersze  1–30   ← zwykły MIECZ jest WIĘKSZY
```

Obie wolne głownie rzędu 0 są **mniejsze od zwykłego miecza**, więc „Miecz
długi" dostałby ikonę, która kłamie o jego jedynej cesze. A „Wielki miecz"
trafiłby na sylwetkę tej samej klasy co `sword` i `bastard_sword` — czyli
dokładnie w usterkę, przed którą ostrzega `public/assets/README.md`: **dwa
różne przedmioty z jedną sylwetką w slocie, w którym gracz porównuje towar
w sklepie**.

⚠ **Rysujemy, a nie skalujemy istniejący kafel.** `tools/CLAUDE.md`:
*„Przy bryłce ~13x15 px taniej NARYSOWAĆ niż odzyskiwać z downscalu"* —
a powiększanie musiałoby być całkowite, więc 32 px nie da się rozciągnąć
„trochę". Rysunek jest w pełni sterowalny i mieści się w 32x32 dokładnie tam,
gdzie ma.

⚠ **Paleta jest PRÓBKOWANA z arkusza, nie wymyślona.** `tools/CLAUDE.md`
mówi wprost: *„ikona leżąca w panelu ma pasować do `items.png`"*, a paleta
świata ikon przedmiotów NIE obowiązuje. Wszystkie kolory niżej pochodzą
z policzenia histogramu kafli (0,6) i (0,8) — cztery tony metalu i pięć
brązu rękojeści, te same, którymi narysowano resztę rzędu mieczy.

── Gdzie ląduje ────────────────────────────────────────────────────────────
Kafle **(wiersz 1, kolumna 4)** — Wielki miecz — i **(wiersz 1, kolumna 5)** —
Miecz długi. Oba puste, w rzędzie, który już niesie głownie (sztylet, kord,
szabla, krótki miecz). ⚠ Wpisanie w wolny kafel istniejącego
rzędu jest tu BEZPIECZNE i `public/assets/README.md` to notuje: `items.png`
nie idzie przez Tiled, a `ITEMS[x].icon` podaje jawne `col`/`row`, więc nie ma
arytmetyki `wiersz*kolumny + kolumna`, którą wstawienie mogłoby przesunąć.
⛔ Reguła „nowe kafle w NOWYCH WIERSZACH" z `tools/CLAUDE.md` chroni arkusze
adresowane INDEKSEM — ten nim nie jest.

── Przymiar ────────────────────────────────────────────────────────────────
    python tools/build_ikony_mieczy.py            # raport + podgląd, NIC nie zapisuje
    python tools/build_ikony_mieczy.py --zapisz   # wpisuje kafle do items.png

⚠ Bez `--zapisz` nie dotyka arkusza. `--podglad <sciezka>` zapisuje powiększony
render do obejrzenia — bo raport mówi tylko, czy program zrobił to, co napisano.
"""

import sys
from pathlib import Path

from PIL import Image

# ⚠ **Konsola Windows startuje w cp1250 i WYWALA skrypt na `⛔`** — nie na
#   błędzie danych, tylko na własnym raporcie. Złapane przy pierwszym
#   przebiegu tego pliku: generator przerwał się po pierwszym z dwóch kafli,
#   zostawiając wynik w połowie. `errors="replace"` zamiast `strict`, bo
#   raport ma dojść zawsze — nawet zniekształcony.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

KORZEN = Path(__file__).resolve().parent.parent
ARKUSZ = KORZEN / "public" / "assets" / "items" / "items.png"

#: Kafle docelowe — (kolumna, wiersz), tak jak `ITEMS[x].icon`.
#:
#: ⚠ **Jeden profil, dwa zestawy liczb.** Oba miecze rysuje ta sama funkcja;
#: różnią się WYŁĄCZNIE szerokością głowni, długością zbiegu, jelcem
#: i obecnością zbrocza. Dwie osobne procedury rozjechałyby się przy pierwszej
#: poprawce cieniowania.
PROFILE = {
    "wielki_miecz": dict(
        kol=4, wiersz=1, nazwa="Wielki miecz",
        # ⚠ Odniesienie to TASAK (0,6), 299 px — największa istniejąca głownia,
        #   a nie własny poprzedni wynik. Pierwsza wersja miała tu 323, czyli
        #   dokładnie tyle, ile sama rysuje: asercja, która porównuje się ze sobą,
        #   nie potrafi zaświecić na czerwono i jest dekoracją (`tools/CLAUDE.md`).
        polszer=7, zbieg=16, podstawa=20, jelec=4, zbrocze=True, odniesienie=299,
    ),
    "miecz_dlugi": dict(
        kol=5, wiersz=1, nazwa="Miecz długi",
        # ⚠ Odniesienie to zwykły MIECZ (0,5), 239 px — „długi" ma znaczyć
        #   dłuższy OD NIEGO, i tylko to jedno ikona ma powiedzieć.
        polszer=4, zbieg=18, podstawa=21, jelec=3, zbrocze=False, odniesienie=239,
    ),
}

# ── Paleta: PRÓBKOWANA z (0,6) i (0,8), nie dobrana ────────────────────────
KONTUR = (0, 0, 0, 255)
METAL_CIEMNY = (86, 97, 97, 255)      # największa powierzchnia głowni
METAL_SREDNI = (123, 138, 138, 255)   # lewa krawędź (światło z lewej)
METAL_JASNY = (164, 184, 184, 255)    # prawa krawędź, czyli ostrze
METAL_CIEN = (41, 47, 47, 255)        # jelec od spodu
CHWYT = [(132, 71, 37, 255), (115, 51, 23, 255), (79, 38, 12, 255), (42, 14, 4, 255)]

R = 32


def rysuj(profil: dict) -> Image.Image:
    """Głownia biegnie po przekątnej (1,1) — ta sama konwencja, co cały rząd."""
    kafel = Image.new("RGBA", (R, R), (0, 0, 0, 0))
    px = kafel.load()

    def ustaw(x: int, y: int, kolor) -> None:
        if 0 <= x < R and 0 <= y < R:
            px[x, y] = kolor

    # ── GŁOWNIA ────────────────────────────────────────────────────────────
    # `u = x - y` to współrzędna W POPRZEK głowni; `w(y)` to połowa szerokości.
    #
    # ⚠⚠ **Trzy odcinki, nie jeden — i to jest cała różnica między mieczem
    # a liściem.** Pierwsza wersja miała tylko czubek i płaską resztę: bez
    # zbiegu przy jelcu głownia czytała się jak ostrze włóczni, a poprzeczka
    # przecinała ją w poprzek zamiast pod nią stać.
    #
    # ⚠ **7 to nie liczba „na oko"**: tasak (0,6), najszersza istniejąca
    # głownia, ma 6. Węższa nie odróżniłaby się przy 17,6 px, szersza nie
    # zostawia w kaflu miejsca na jelec i rękojeść.
    POL_SZER = profil["polszer"]
    Y_CZUBEK, Y_ZBIEG, Y_PODSTAWA = 1, profil["zbieg"], profil["podstawa"]

    def polszer(y: int) -> int:
        if y <= Y_CZUBEK + POL_SZER:
            return max(1, y - Y_CZUBEK)          # czubek się zaostrza
        if y <= Y_ZBIEG:
            return POL_SZER                       # pióro
        return max(2, POL_SZER - 2 * (y - Y_ZBIEG))  # zbieg do jelca

    for y in range(Y_CZUBEK, Y_PODSTAWA + 1):
        w = polszer(y)
        ustaw(y - w - 1, y, KONTUR)
        ustaw(y + w + 1, y, KONTUR)
        for u in range(-w, w + 1):
            x = y + u
            if u <= -w + 2:
                ustaw(x, y, METAL_SREDNI)         # grzbiet (światło z lewej)
            elif u >= w - 2:
                ustaw(x, y, METAL_JASNY)          # ostrze
            elif profil["zbrocze"] and u == 0 and Y_CZUBEK + 4 <= y <= Y_ZBIEG:
                # ⭐ **ZBROCZE — jedyna rzecz, która przy 17,6 px odróżnia tę
                #   ikonę od TASAKA (0,6).** Obie są szerokimi, liściastymi
                #   głowniami i sama szerokość im nie wystarcza: sprawdzone
                #   zestawieniem ośmiu ostrzy obok siebie w skali półki sklepu.
                #   Ciemna bruzda wzdłuż środka głowni nie występuje na żadnej
                #   innej ikonie tego arkusza. ⛔ Nie kasuj jej „dla czystości".
                ustaw(x, y, METAL_CIEN)
            else:
                ustaw(x, y, METAL_CIEMNY)         # pióro
    # Domknięcie obrysu czubka — bez tego głownia wygląda na uciętą ramką.
    for d in (-1, 0, 1):
        ustaw(Y_CZUBEK + d, Y_CZUBEK - 1, KONTUR)
        ustaw(Y_CZUBEK - 1, Y_CZUBEK + d, KONTUR)

    # ── JELEC ──────────────────────────────────────────────────────────────
    # Poprzeczka biegnie kierunkiem (1,-1), czyli PROSTOPADLE do głowni, i stoi
    # POD nią — tam, gdzie kończy się zbieg pióra.
    #
    # ⚠⚠ **±4 i DWA piksele grubości, nie ±6 i jeden.** Wersja z długim,
    # jednopikselowym jelcem rysowała przez kafel ukośny KRZYŻ: przy 17,6 px
    # dolne ramię wychodziło w pustkę i czytało się jak druga, cienka głownia.
    # Jelec ma być krótki i GRUBY — wtedy jest rękojeścią, a nie kreską.
    SX = SY = Y_PODSTAWA + 2
    RAMIE = profil["jelec"]
    for k in range(-RAMIE, RAMIE + 1):
        for g in (0, 1):
            ustaw(SX + k + g, SY - k + g, METAL_JASNY if g == 0 else METAL_CIEN)
        ustaw(SX + k - 1, SY - k - 1, KONTUR)
        ustaw(SX + k + 2, SY - k + 2, KONTUR)
    # Zakończenia ramion — bez nich jelec wygląda na ucięty.
    for e in (-RAMIE - 1, RAMIE + 1):
        ustaw(SX + e, SY - e, KONTUR)
        ustaw(SX + e + 1, SY - e + 1, KONTUR)

    # ── RĘKOJEŚĆ I GŁOWICA ─────────────────────────────────────────────────
    # ⚠ Trzy piksele szerokości, nie jeden: przy 17,6 px jednopikselowa
    #   rękojeść znika, a miecz zostaje bez uchwytu.
    for d in range(2, 9):
        x, y = SX + d, SY + d
        ustaw(x, y, CHWYT[0])
        ustaw(x + 1, y, CHWYT[1])
        ustaw(x, y + 1, CHWYT[1])
        ustaw(x - 1, y, CHWYT[3])
        ustaw(x + 2, y, KONTUR)
    gx, gy = SX + 9, SY + 9
    for d in (0, 1):
        ustaw(gx + d, gy, METAL_SREDNI)
        ustaw(gx + d, gy + 1, METAL_CIEN)
    ustaw(gx - 1, gy, KONTUR)
    ustaw(gx, gy - 1, KONTUR)
    ustaw(gx + 2, gy + 1, KONTUR)

    return kafel


def main() -> int:
    zapisz = "--zapisz" in sys.argv
    podglad = None
    if "--podglad" in sys.argv:
        podglad = Path(sys.argv[sys.argv.index("--podglad") + 1])

    arkusz = Image.open(ARKUSZ).convert("RGBA")
    narysowane: list[tuple[str, Image.Image]] = []
    blad = 0

    print("=== ikony: dwa nowe miecze ===")
    for klucz, profil in PROFILE.items():
        kol, wiersz = profil["kol"], profil["wiersz"]
        stary = arkusz.crop((kol * 32, wiersz * 32, kol * 32 + 32, wiersz * 32 + 32))
        zajete = sum(1 for p in stary.getdata() if p[3] > 8)
        kafel = rysuj(profil)
        ile = sum(1 for p in kafel.getdata() if p[3] > 8)
        # ⚠ **Liczba pikseli jest tu POMIAREM, nie ozdobą raportu.** Cała
        #   tożsamość obu ikon to „więcej metalu niż to, obok czego stoją":
        #   miecz (0,5) ma 239 px, tasak (0,6) 299, miecz dwuręczny (0,8) 203.
        #   Ikona mniejsza od swojego odniesienia KŁAMIE o przedmiocie i raport
        #   ma to powiedzieć wprost, zanim ktokolwiek zobaczy ją w sklepie.
        ok_rozmiar = ile > profil["odniesienie"]
        # ⚠⚠ **Kafel zajęty WŁASNYM wynikiem to nie jest kolizja.** Pierwsza
        #   wersja porównywała tylko „czy pusty" i przez to **generator nie dał
        #   się uruchomić drugi raz** — po pierwszym zapisie odmawiał pracy nad
        #   własnymi pikselami. `tools/CLAUDE.md` wymaga idempotencji: skrypt ma
        #   móc przejść po sobie bez zmiany wyniku. Odmawiamy wyłącznie wtedy,
        #   gdy w kaflu leży CUDZA grafika.
        takie_samo = list(stary.getdata()) == list(kafel.getdata())
        kolizja = zajete > 20 and not takie_samo
        stan = "⛔ ZAJĘTY CUDZĄ GRAFIKĄ" if kolizja else ("bez zmian" if takie_samo else "OK (pusty)")
        print(f"  {profil['nazwa']:<14} kafel (kol {kol}, wiersz {wiersz})  przed: {zajete} {stan}")
        print(f"  {'':<14} narysowano {ile} px wobec odniesienia {profil['odniesienie']} px  "
              f"{'OK' if ok_rozmiar else '⛔ ZA MAŁA — ikona kłamie o rozmiarze'}")
        if kolizja or not ok_rozmiar:
            blad = 1
        narysowane.append((klucz, kafel))

    if blad:
        print("\n⛔ Nic nie zapisano — napraw powyższe.")
        return 1

    if podglad:
        # ⚠ Podgląd jest w DWÓCH skalach, bo o ikonie broni rozstrzyga ta
        #   mniejsza (17,6 px) — `public/assets/README.md`.
        # ⚠⚠ I pokazuje je **OBOK SĄSIADÓW Z PÓŁKI**, a nie samotnie: pierwsza
        #   wersja wielkiego miecza wyglądała świetnie w izolacji i dopiero
        #   zestawienie z tasakiem pokazało, że obie czytają się tak samo.
        #   Stąd zbrocze. „Patrz na render" z `tools/CLAUDE.md`.
        SASIEDZI = [("Miecz", 5, 0), ("Tasak", 6, 0), ("Bastard", 7, 0), ("Dwuręczny", 8, 0)]
        kafle = [(k, obr) for k, obr in narysowane]
        wszystkie = [(k, obr) for k, obr in kafle] + [
            (n, arkusz.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32))) for n, c, r in SASIEDZI
        ]
        S = 7
        plotno = Image.new("RGBA", (len(wszystkie) * (18 * S + 8), 18 * S + 20), (20, 20, 24, 255))
        for i, (nazwa, obr) in enumerate(wszystkie):
            tlo = Image.new("RGBA", (18, 18), (32, 32, 38, 255))
            tlo.alpha_composite(obr.resize((18, 18), Image.NEAREST))
            plotno.alpha_composite(tlo.resize((18 * S, 18 * S), Image.NEAREST), (i * (18 * S + 8), 16))
        podglad.parent.mkdir(parents=True, exist_ok=True)
        plotno.save(podglad)
        print(f"\npodgląd (skala półki) {podglad}")

    if not zapisz:
        print("\nPRZYMIAR — nic nie zapisano. Uruchom z --zapisz.")
        return 0

    for klucz, kafel in narysowane:
        profil = PROFILE[klucz]
        arkusz.paste(kafel, (profil["kol"] * 32, profil["wiersz"] * 32))
    arkusz.save(ARKUSZ)
    print(f"\nZAPISANO {len(narysowane)} kafle → {ARKUSZ.relative_to(KORZEN)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

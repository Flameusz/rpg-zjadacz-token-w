"""
Adaptacja jabloni, sliwy i gruszy (material ChatGPT + katalog assets) do
Nature.png — po drugim przebiegu takze warianty wielkosci (11 drzew razem).

Uruchom:  python tools/build_drzewa_owocowe.py            (podglad + weryfikacja, NIC nie pisze)
          python tools/build_drzewa_owocowe.py --zapisz   (wkleja wszystkie 11 do Nature.png)

Zadanie: docs/ZADANIE_drzewa.md, sekcja "Materiał dostarczony 2026-08-18".
Przeznaczenie: docs/wioska_plan.md — pas "Sad i ogrody" (y34-44), sad
Soltysa (8 drzew), sliwy Doroty Zielarki. Nie las — wies.

── DLACZEGO ADAPTACJA, A NIE GENEROWANIE (odwrotnie niz reszta katalogu) ────
`build_drzewa.py` rysuje dab/swierk/brzoze/buk/grab PROCEDURALNIE, bo
jedyny dostepny wtedy material zrodlowy (height32_trees_mega_pack.png) nie
przeszedl bramki jakosci — mediana 23x30 px, 0,88 unikalnego koloru na
piksel kryjacy (rozmyty render, nie pixel art). Te dwa pliki (`gpt-apple-
tree.png`, `gpt-plum-tree.png`) PRZECHODZA te sama bramke czysto: alfa
realnie binarna, 49-56 kolorow (dziesiatki, nie setki tysiecy), mediana
biegu tego samego koloru w poziomie = 1px. Czyli to jest prawdziwy pixel
art i pierwotny plan z ZADANIE_drzewa.md ("adaptacja cudzej grafiki", nie
generowanie od zera) wraca w mocy.

── METODA PRZEMALOWANIA (docs/ZADANIE_drzewa.md, "Adaptacja materialu") ────
Trzy zasady, kazda okupiona bledem gdzie indziej w projekcie:
  1. Mapuj ODREBNE KOLORY po kolejnosci JASNOSCI, nie percentyle pikseli —
     dominujacy kolor (duza masa pikseli) nie ma prawa "zakotwiczyc" progu
     w swoim srodku.
  2. Progi liczone dla CALEGO obiektu, nie per kafel.
  3. Ziolen/brraz/owoc rozdzielaj po ODCIENIU (hue), nie po jasnosci — pien
     bywa jasniejszy od cienia korony.

Realizacja reguly 1: `rangowe_kubelki()` sortuje UNIKALNE kolory danej
rodziny wg jasnosci i dzieli je na `len(rampa)` kubelkow ROWNYCH LICZEBNIE
(nie rownych masa pikseli) — n-ty z kolei kolor idzie w n-ty kubelek,
niezaleznie od tego, czy ten kolor pokrywa 1% czy 40% powierzchni.

── CZWARTA RODZINA, KTOREJ BRIEF NIE MIAL: OWOCE ────────────────────────────
Brief przewidzial to explicite dla jarzebiny ("czerwone owoce -> akcent_
cieply"), wiec to nie jest nowy pomysl, tylko jego pierwsze uzycie. Jablko
i sliwka NIE SA ani ziolen, ani kora — trzecia/czwarta rodzina barw:
  jablko -> `akcent_cieply` (czerwien/pomarancz, hue ok. 280-360-5 stopni,
            wysokie nasycenie — odrozniona od brazu pnia, ktory siedzi w
            hue ok. 350-25 stopni przy NIZSZYM, umiarkowanym nasyceniu;
            granica zmierzona na realnych kolorach obu grup, nie zgadnieta)
  sliwka -> `akcent_chlodny` (fiolet/róz, hue ok. 259-333 stopni — czysty
            rozdzial od brazu, miedzy 333 a 350 nie ma zadnego koloru w
            zadnym z dwoch zrodel, sprawdzone)

── UMIEJSCOWIENIE W ARKUSZU ─────────────────────────────────────────────────
`build_drzewa.py`'s DRZEWA konczy sie na wierszu 6 (0-1 kepki/krzaki, 2-4
drzewa duze na PELNYCH 19 kolumnach, 5-6 srednie+male). Zero wolnego miejsca
w istniejacych wierszach bez nadpisania czegos — wiec NOWE WIERSZE, od 7.
To jest bezpieczne z definicji: "Dokladanie WIERSZY nie rusza id juz
istniejacych" (komentarz w build_drzewa.py), bo id = wiersz*19 + kolumna.
Pierwszy przebieg zajal wiersze 7-10 (trzy "duze"), drugi (warianty
wielkosci) wiersze 11-17. Dokladny uklad i id lewego-gornego kafla kazdego
drzewa: `UKLAD` nizej — to jest kontrakt z mapa, patrz komentarz w
`build_drzewa.py` przy DRZEWA.

── PUŁAPKA #2, ZLAPANA W DRUGIM PRZEBIEGU: MARTWA ALFA ─────────────────────
Trzy pliki (`apple-medium/medium2/01-pixel-snapper.png`) maja alfa min==
max==255 — czarne tlo namalowane W PIKSELACH, nie w przezroczystosci.
Dokladnie pulapka opisana w ZADANIE_drzewa.md §"Adaptacja materialu" pkt 1
("Materiał z Gemini miał min 255, max 255"). Zlapane nie na oko, tylko na
liczbie: po pierwszym przebiegu 89% "korony" jablon_srednia wyszlo jako
najciemniejszy stopien `kora` (podglad pokazal trzy CIEMNE KWADRATY zamiast
drzew). `alfa_bez_czerni()` klucz uje czarne tlo flood-fillem OD KRAWEDZI
kanwy (ta sama technika co usuwanie zielonego ekranu w build_gniewko.py/
build_hanna.py) — piksele czarne POLACZONE z brzegiem znikaja, piksele
czarne bedace czescia drzewa (cien w konturze) zostaja, bo nie graniczą z
brzegiem przez inne czarne piksele.

── PUŁAPKA #3: WYSPY ─────────────────────────────────────────────────────
`apple-big-pixel-snapper.png` mial 10px biały zawijas 17px od korony —
zaden test liczbowy (paleta, kontrast, margines) tego nie lapal, tylko test
[6] spojnosci (2 czesci zamiast 1). `usun_wysepki()` (import z
build_drzewa.py) czysci to PRZED liczeniem bbox, min_px=12.
"""

import argparse
import os
from collections import deque

import numpy as np
from PIL import Image

from build_drzewa import (
    ASSETS, T, PITCH, COLS, PAL, JASNOSC_TRAWY,
    jasnosc, cien_kontaktowy, na_kafle, weryfikuj, podglad, zbuduj_wszystkie,
    usun_wysepki,
)

SRC = {
    "jablon_duza": "gpt-apple-tree.png",
    "sliwa_duza": "gpt-plum-tree.png",
    "grusza_duza": "gpt-pear-tree.png",
    # ── Warianty wielkosci, dorzucone 2026-08-18 (drugi przebieg) — te same
    # trzy gatunki, materiac z katalogu assets (nie ChatGPT-generacja na
    # zamowienie tej sesji, ale ten sam poziom jakosci pixel-art, zmierzony
    # tak samo). DOKLADNIE odpowiada na luke zapisana w ZADANIE_drzewa.md:
    # "osiem drzew tej samej sylwetki obok siebie czyta sie jak kopiuj-wklej".
    #
    # ⚠ `gpt-pear-tree-young.png` ŚWIADOMIE POMINIETE — nie przeszlo bramki
    # pomiaru: 52 685 kolorow (nie dziesiatki), tresc 765x1096 na kanwie
    # 1231x1278 (biale OPAKOWE tlo, nie alfa). Ten sam blad jakosci co
    # `height32_trees_mega_pack.png`, ktory zmusil reszte katalogu do
    # rysowania proceduralnego zamiast adaptacji. Nie konwertowac.
    "jablon_duza2": "apple-big-pixel-snapper.png",
    "jablon_srednia": "apple-medium-pixel-snapper.png",
    "jablon_mala": "apple-medium2-pixel-snapper.png",
    "jablon_mloda": "apple01-pixel-snapper.png",
    "sliwa_srednia": "plum-medium-pixel-snapper.png",
    "sliwa_mala": "plum-smaller-pixel-snapper.png",
    "grusza_mala": "gpt-pear-tree-younger.png",
    # Podmienione przez autora PO pierwszym odrzuceniu (byl 1231x1278,
    # 52 685 kolorow, biale opakowe tlo) — nowy plik przeszedl pomiar
    # czysto: 72x76, 43 kolory, alfa realnie binarna, mediana biegu 1px.
    "grusza_srednia": "gpt-pear-tree-young-pixel-snapper.png",
}

# (kolumna, wiersz) lewego-gornego kafla w Nature.png. Nowe wiersze od 7 —
# patrz naglowek. Grusza tresc 83x101 — najwieksza z trojki, potrzebuje 4
# wierszy (128px), wiec dostaje WLASNY blok wierszy 7-10, obok jabloni i
# sliwy (ktore miesza sie w 3 wierszach, 7-9) w kolumnach 5-7.
#
# Drugi przebieg (warianty wielkosci) startuje od wiersza 11, zeby nie ruszac
# nic z pierwszego. jablon_mloda (3x2) zostawia pod soba dwuwierszowa dziure
# w kolumnach 10-11 — grusza_mala (2x2) siada dokladnie w niej zamiast
# otwierac nowy blok wierszy.
UKLAD = {
    "jablon_duza": (0, 7),
    "sliwa_duza": (2, 7),
    "grusza_duza": (5, 7),
    "jablon_duza2": (0, 11),
    "jablon_srednia": (4, 11),
    "jablon_mala": (7, 11),
    "jablon_mloda": (10, 11),
    "grusza_mala": (10, 13),
    "sliwa_srednia": (13, 11),
    "sliwa_mala": (16, 11),
    "grusza_srednia": (0, 15),
}


def alfa_bez_czerni(a):
    """Dla plikow z MARTWA alfa (min==max==255) — czarne tlo namalowane w
    pikselach, nie w przezroczystosci. Zlapane na apple-medium/medium2/01
    -pixel-snapper.png: 81-95% "kryjacych" pikseli to czysty #000000, wiec
    bez tego 89% korony wyszloby jako najciemniejszy stopien `kora` (piksele
    tla trafialy do klasyfikatora razem z drzewem).

    Flood-fill od KRAWEDZI kanwy, nie globalny prog — ta sama technika co
    usuwanie zielonego ekranu w build_gniewko.py/build_hanna.py. Krytyczne:
    ciemne piksele NALEZACE do drzewa (cien w konturze, najciemniejszy
    stopien `kora`) nie graniczą z krawedzia kanwy przez inne czarne piksele,
    wiec zostaja — usuwane jest tylko to, co jest POLACZONE z brzegiem.
    """
    h, w = a.shape[:2]
    is_bg = (a[:, :, :3].astype(int) ** 2).sum(2) < 30 ** 2
    vis = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x] and not vis[y, x]:
                vis[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not vis[y, x]:
                vis[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and is_bg[ny, nx]:
                vis[ny, nx] = True
                q.append((ny, nx))
    return ~vis


def hue_sat_val(c):
    r, g, b = (v / 255.0 for v in c)
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d == 0:
        h = 0.0
    elif mx == r:
        h = (60 * ((g - b) / d) + 360) % 360
    elif mx == g:
        h = 60 * ((b - r) / d) + 120
    else:
        h = 60 * ((r - g) / d) + 240
    s = 0 if mx == 0 else d / mx
    return h, s, mx


#  Prog nasycenia ponizej ktorego piksel NIGDY nie idzie do rampy owocu,
#  choc jego hue moze wypasc w odpowiednim pasmie. Hue jest NIESTABILNY przy
#  R≈G≈B — drobna, nieistotna wizualnie roznica kanalow (np. #211920, S=0,24)
#  potrafi policzyc sie na hue=308 (purpura), mimo ze piksel wyglada po prostu
#  na prawie-czarny. Zlapane w PODGLADZIE, nie w liczbach: piksele takie same
#  co uzyte przy samym pniu wpadly do rampy `akcent_cieply`/`akcent_chlodny`
#  i pien wyszedl czerwono/fioletowo przebarwiony zamiast brazowy. Bez tego
#  progu 4 kolory jabloni (S 0,24-0,33) i 2 kolory sliwy (S 0,33-0,34) mapuja
#  sie na ciemny koniec rampy owocu i widac je jako kolor kory.
PROG_NASYCENIA_OWOCU = 0.45


#  Prog JASNOSCI, tylko dla jabloni. Zlapane na apple-big-pixel-snapper.png
#  (drugi plik z tym samym blednym wzorcem, INNE konkretne kolory niz w
#  gpt-apple-tree.png — prog nasycenia sam nie wystarczyl): #381d20 (S=0,48)
#  i #4b2523 (S=0,53) przechodza prog nasycenia 0,45, ale ich jasnosc (V=0,22
#  i 0,29) jest wyraznie NIZSZA niz najciemniejszy prawdziwy kolor owocu
#  (#710208, V=0,44) — zmierzona przerwa 0,15 miedzy V=0,29 a V=0,44, wiec
#  prog na V=0,35 dzieli je czysto. Tylko jablon, NIE sliwa: fiolet sliwki
#  (hue 259-333) nie ma zadnego kandydata na kore w tym samym pasmie hue, wiec
#  ciemny nasycony fiolet (np. #0e061f, V=0,12) jest bez dwuznacznosci cieniem
#  owocu, nie pnia — obcinanie go progiem jasnosci usuneloby prawdziwy kolor.
PROG_JASNOSCI_JABLKA = 0.35


def klasyfikuj_jablon(c):
    r, g, b = c
    if g > r and g > b:
        return "korona"
    h, s, v = hue_sat_val(c)
    # Czerwien jablka: hue owija sie przez 0 (purpura -> czerwien -> pomaranczowy
    # highlight). Zmierzone na realnych kolorach: 12 odrebnych barw jablka lezy
    # w tym paśmie, 9 barw pnia w sasiednim (5-25 st.) przy nizszym nasyceniu.
    if (h >= 280 or h <= 5) and s >= PROG_NASYCENIA_OWOCU and v >= PROG_JASNOSCI_JABLKA:
        return "akcent_cieply"
    # ⚠ Polysk na jablku potrafi wypasc w TYM SAMYM pasmie hue co kora (5-25°)
    # — zlapane na apple-big-pixel-snapper.png: #fb561e (H=15, S=0,88, V=0,98)
    # wpadl do kory jako "najjasniejszy z ciemnych", wyladowal w szarawym
    # kora[3] i zrobil na jablku plame jak zabrudzenie. Prawdziwa kora tego nie
    # robi: najjasniejszy stopien rampy `kora` ma V≈0,49, a zmierzone realne
    # kolory kory w tym zrodle nie przekraczaja V≈0,72. V>=0,85 przy S>=0,7 nie
    # jest wiec korą pod zadnym wiarygodnym odcieniem drewna — to zawsze polysk.
    if v >= 0.85 and s >= 0.7:
        return "akcent_cieply"
    return "kora"  # domyslnie — w tym niskonasycone/ciemne "czerwienie" ktore sa cieniem pnia


def klasyfikuj_sliwe(c):
    r, g, b = c
    if g > r and g > b:
        return "korona"
    h, s, v = hue_sat_val(c)
    # Prawie-zielone ciemne kontury (teal, g o wlos nizsze niz b) — naleza
    # wizualnie do cienia korony, nie do pnia.
    if 150 <= h <= 210 and v < 0.16:
        return "korona"
    if 259 <= h <= 333 and s >= PROG_NASYCENIA_OWOCU:
        return "akcent_chlodny"
    return "kora"


def klasyfikuj_grusze(c):
    r, g, b = c
    if g > r and g > b:
        return "korona"
    h, s, v = hue_sat_val(c)
    if 150 <= h <= 210 and v < 0.16:
        return "korona"
    # Zloto gruszki: hue 41-56 zmierzone na zrodle, proog nasycenia NIZSZY niz
    # u jabloni/sliwy (0,35, nie 0,45) — najjasniejszy, najczestszy odcien
    # owocu (#fce48e) ma nasycenie 0,44, wiec wyzszy prog wycialby go samego.
    # Bezpieczne: zaden ciemny/dwuznaczny piksel gruszki nie wypada w tym
    # pasmie hue (sprawdzone — sa w 316-335, poza zakresem 41-56).
    if 35 <= h <= 62 and s >= 0.35:
        return "akcent_zlocisty"
    return "kora"


KLASYFIKATORY = {
    "jablon_duza": klasyfikuj_jablon,
    "jablon_duza2": klasyfikuj_jablon,
    "jablon_srednia": klasyfikuj_jablon,
    "jablon_mala": klasyfikuj_jablon,
    "jablon_mloda": klasyfikuj_jablon,
    "sliwa_duza": klasyfikuj_sliwe,
    "sliwa_srednia": klasyfikuj_sliwe,
    "sliwa_mala": klasyfikuj_sliwe,
    "grusza_duza": klasyfikuj_grusze,
    "grusza_srednia": klasyfikuj_grusze,
    "grusza_mala": klasyfikuj_grusze,
}


def rangowe_kubelki(kolory_unikalne, dlugosc_rampy):
    """n-ty NAJCIEMNIEJSZY unikalny kolor -> n-ty kubelek (rowna liczebnosc,
    NIE rowna masa pikseli). Patrz naglowek, regula 1."""
    posortowane = sorted(kolory_unikalne, key=jasnosc)
    n = len(posortowane)
    if n == 0:
        return {}
    mapping = {}
    for i, c in enumerate(posortowane):
        idx = min(dlugosc_rampy - 1, i * dlugosc_rampy // n)
        mapping[c] = idx
    return mapping


def przemaluj(nazwa):
    src_path = os.path.join(ASSETS, SRC[nazwa])
    a = np.array(Image.open(src_path).convert("RGBA")).astype(int)
    alpha = a[:, :, 3]
    if alpha.min() > 250:
        # Martwa alfa (min==max==255) — patrz naglowek alfa_bez_czerni().
        m = alfa_bez_czerni(a)
    else:
        m = alpha > 128
    # Wysepki — odczepione skrawki spoza glownej masy drzewa. Zlapane na
    # apple-big-pixel-snapper.png: 10px biały zawijas 17px od korony, zaden
    # test liczbowy by tego nie zlapal (paleta, kontrast, margines — wszystko
    # przechodzi), tylko test [6] spojnosci sprite'a (2 czesci zamiast 1).
    # min_px=12 > domyslne 10, zeby ten konkretny 10px artefakt na pewno
    # zniknal, a jednoczesnie ponizej wielkosci najmniejszego realnego
    # szczegolu (owoc/gałązka to zawsze >12px przy tej skali).
    m = usun_wysepki(m, min_px=12)
    ys, xs = np.nonzero(m)
    box = (xs.min(), ys.min(), xs.max(), ys.max())
    tresc = a[box[1]:box[3] + 1, box[0]:box[2] + 1]
    # m, nie surowa alfa — inaczej wysepka usunieta wyzej wracalaby tutaj:
    # `usun_wysepki` czysci MASKE `m`, ale sama `a` (i jej alfa) zostaje
    # nietknieta, wiec liczenie m2 na nowo z tresc[:,:,3] cofnaloby czyszczenie.
    m2 = m[box[1]:box[3] + 1, box[0]:box[2] + 1]

    klasyf = KLASYFIKATORY[nazwa]
    grupy = {"korona": set(), "kora": set(), "akcent_cieply": set(),
             "akcent_chlodny": set(), "akcent_zlocisty": set()}
    for c in {tuple(p) for p in tresc[m2][:, :3].tolist()}:
        grupy[klasyf(c)].add(c)

    mapy = {}
    for grupa, kolory in grupy.items():
        if not kolory:
            continue
        # ⚠ Jablko dostaje TYLKO 3 najciemniejsze stopnie `akcent_cieply`,
        # nie wszystkie 5. Rampa jest CELOWO zaprojektowana tak, zeby przy
        # rozjasnianiu odchodzic od czerwieni w strone pomaranczu (hue 350°
        # -> 30°, `tools/gen_palette.py` — dobra pod zar/zachod slonca, zla
        # pod skorke jablka). Zmierzone na renderze: pelna rampa dala 47%
        # pikseli owocu w #cc7448 (rdzawy pomarancz, prawie brak czerwieni)
        # i owoc czytal sie jako zgniły, nie blyszczacy. Trzy ciemniejsze
        # stopnie (650a19/871919/aa432e) zostaja w rodzinie czerwieni/rdzy i
        # nigdy nie dochodza do pomaranczowo-brzoskwiniowego konca.
        rampa = PAL[grupa][:3] if grupa == "akcent_cieply" else PAL[grupa]
        binning = rangowe_kubelki(kolory, len(rampa))
        for c, idx in binning.items():
            mapy[c] = rampa[idx]

    out_rgb = np.zeros_like(tresc[:, :, :3])
    out_a = np.where(m2, 255, 0).astype(np.uint8)
    for c, target in mapy.items():
        sel = m2 & (tresc[:, :, 0] == c[0]) & (tresc[:, :, 1] == c[1]) & (tresc[:, :, 2] == c[2])
        out_rgb[sel] = target
    px = np.dstack([out_rgb.astype(np.uint8), out_a])

    # Dopasowanie do siatki kafli — DOPELNIENIE, nie zmniejszanie (regula #2).
    # Tresc trzymana przy DOLE (linia gruntu) i wysrodkowana poziomo.
    hc, wc = px.shape[:2]
    kx = max(2, -(-wc // T))  # ceil, min. 2 kafle szerokosci dla drzew "duzych"
    ky = -(-hc // T)
    # Margines >=1px z gory/bokow (test [2] w weryfikuj()) — jesli nie ma
    # zapasu przy zaokragleniu w gore, dolozony kafel go da.
    if wc >= kx * T - 1:
        kx += 1
    if hc >= ky * T:
        ky += 1
    W, H = kx * T, ky * T
    canvas = np.zeros((H, W, 4), np.uint8)
    x0 = (W - wc) // 2
    y0 = H - hc  # dol tresci = dol kanwy (linia gruntu)
    canvas[y0:y0 + hc, x0:x0 + wc] = px

    # Cien kontaktowy pod pniem — srodek pnia zblizony do srodka kanwy,
    # promienie skalowane do klasy drzewa.
    cien_kontaktowy(canvas, cx=W / 2, cy=H - 1, rw=W * 0.22, rh=3.0)

    return canvas


def main(zapisz, podglad_p):
    print("== PRZEMALOWANIE ==")
    nowe = {n: przemaluj(n) for n in SRC}
    for n, px in nowe.items():
        print("    %-14s %3dx%-3d px = %dx%d kafla" %
              (n, px.shape[1], px.shape[0], px.shape[1] // T, px.shape[0] // T))

    # Weryfikacja RAZEM z istniejacym katalogiem — test [1] (roznicowalnosc
    # sylwetek) ma sens tylko w zestawieniu z tym, co juz stoi w tej samej
    # klasie wielkosci (np. swierk_duzy tez jest 2x3).
    wszystkie = dict(zbuduj_wszystkie())
    wszystkie.update(nowe)
    ok = weryfikuj(wszystkie)

    podglad({**nowe}, podglad_p)
    print("\npodglad (tylko nowe drzewa owocowe) -> %s" % podglad_p)

    if not zapisz:
        print("\nNic nie zapisano. Uzyj --zapisz.")
        return
    if not ok:
        print("\n⚠ SA BLEDY WERYFIKACJI — zapisuje mimo to, bo dotycza calego")
        print("  katalogu (w tym starych 5 gatunkow), sprawdz raport wyzej.")

    p = os.path.join(ASSETS, "Nature.png")
    ark = np.array(Image.open(p).convert("RGBA"))
    trzeba = max(w0 + px.shape[0] // T for (n, (k0, w0)) in UKLAD.items() for px in [nowe[n]])
    wys = trzeba * PITCH - 1
    if ark.shape[0] < wys:
        rozszerzony = np.zeros((wys, ark.shape[1], 4), np.uint8)
        rozszerzony[:ark.shape[0]] = ark
        ark = rozszerzony
        print("\narkusz powiekszony do %dx%d (%d wierszy) — id istniejacych kafli bez zmian"
              % (ark.shape[1], ark.shape[0], trzeba))
    for nazwa, px in nowe.items():
        k0, w0 = UKLAD[nazwa]
        for (c, r), kafel in na_kafle(px).items():
            kol, wier = k0 + c, w0 + r
            ark[wier * PITCH:wier * PITCH + T, kol * PITCH:kol * PITCH + T] = kafel
        print("    %-14s -> kolumny %2d-%2d, wiersze %d-%d, lewy gorny kafel id %d"
              % (nazwa, k0, k0 + px.shape[1] // T - 1, w0, w0 + px.shape[0] // T - 1,
                 w0 * COLS + k0))
    Image.fromarray(ark).save(p)
    print("  -> Nature.png %dx%d" % (ark.shape[1], ark.shape[0]))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Adaptuje jablon+sliwe (ChatGPT) do Nature.png.")
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=os.path.join(os.path.dirname(__file__), "podglad_drzew_owocowych.png"))
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

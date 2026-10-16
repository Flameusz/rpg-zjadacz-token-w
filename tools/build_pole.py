"""
Docina pole.png (surowa generacja Gemini: zaorana ziemia, kapusta, zboze,
korzeniowe w kolejnych etapach wzrostu) na zestaw kafli 32x32 do Tiled.

Uruchom:  python tools/build_pole.py             (podglad + raport, NIC nie zapisuje)
          python tools/build_pole.py --zapisz    (zapisuje public/assets/pole_tileset.png)
          python tools/build_pole.py --podglad X.png  (dodatkowo eksportuje powiekszony podglad)

── ZASADA: PRZYGOTOWANIE ASSETOW, NIE PRZERYSOWANIE ─────────────────────────
User byl wyraznie: nie przerysowywac, nie dodawac szczegolow, nie "poprawiac"
stylu. Zachowac tozsamosc wizualna oryginalu. Dlatego kolory NIE sa
przemapowywane na projektowa palete budynkow/kamienia (docs/paleta.json) —
to zupelnie inna tematyka (uprawy, nie sciany), wiec wymuszenie tamtej
palety zlamaloby "preserve original visual identity". Zamiast tego:
redukcja kolorow WLASNA KWANTYZACJA (k-means na faktycznych kolorach tego
arkusza) — usuwa gradient/szum/antyaliasing, zostawia oryginalna tozsamosc
barwna.

── SIATKA: POMIAR, NIE ZALOZENIE ────────────────────────────────────────────
Zmierzone (nie zgadniete): pole.png NIE jest na czystej siatce 32px — kafle
maja natywny rozmiar ~23x23px (mediana ze 138 realnych elementow + 1 szumowy
odrzucony), nierownomiernie rozstawione (odstepy 2-4px). Kazdy element
wyciety osobno przez connected-component labeling (8-spojnosc), NIE przez
sztywny grid-crop — grid-crop obcialby elementy, ktore nie siedza dokladnie
na regularnym rastrze (dokladnie ten sam problem opisany w referencyjnym
pipeline `ai-pixel-snapped-game-sprites` (prompts/05-frame-recovery.md; usuniety
z repo 2026-10-11, jest w historii gita):
"Never grid-crop... Recover foreground components instead").

── SKALOWANIE: WIEKSZOSC KAFLI TO PELNE KWADRATY GRUNTU, NIE PROPY ──────────
W przeciwienstwie do studni/beczki/lawki (male propy na przezroczystym tle,
padded/wysrodkowane), tutaj kazdy element to juz PELNY, niemal kwadratowy
kafel ziemi (z uprawa lub bez) — ma wypelniac caly kafel 32x32 krawedz-do-
-krawedzi, nie plywac jako maly obiekt na przezroczystym tle. Dlatego kazdy
element skalowany (NEAREST — tu w gore, z ~23px do 32px, nie w dol, wiec
NEAREST trzyma twarde piksele bez potrzeby usredniania jak przy beczce)
zeby WYPELNIC caly kafel 32x32, a nie byc na nim wysrodkowany z marginesem.
Jedyny wyjatek: ostatni, duzy nieregularny fragment (~96x74, "kawalek pola"
w rogu zrodla) NIE jest pojedynczym kaflem siatki — pomijany w tym
przebiegu, zostaje jako osobna sprawa jesli bedzie potrzebny.

── DWIE POPRAWKI PO PIERWSZEJ, ZEPSUTEJ PROBIE ──────────────────────────────
Pierwszy przebieg mial dwa realne bledy (zlapane na oko, nie zgadywane —
zrodlo NIE ma zadnego piksela >180 jasnosci, wiec biale "kursory" w
wyniku byly w 100% wprowadzone przez ten skrypt, nie przez Gemini):

1. **K-means z czysto losowa inicjalizacja** czasem zostawial klaster
   praktycznie pusty (garstka pikseli), ktory przy przypisywaniu koloru
   dawal wyskakujacy, "obcy" odcien na krawedziach — stad biale plamy.
   Naprawione: inicjalizacja k-means++ (kazdy kolejny srodek wybierany z
   prawdopodobienstwem proporcjonalnym do kwadratu odleglosci od
   najblizszego juz wybranego) + reseed pustych/malo obsadzonych
   klastrow (ponizej 0.1% pikseli) przez rozbicie najliczniejszego —
   standardowa naprawa na "martwe klastry" w k-means, nie unikalny trik.
2. **Gesta sekcja zboza/lanu ma stykajace sie kafle** (potwierdzone:
   12 komponentow > 40px w ktoryms wymiarze, dokladnie w tych rzedach) —
   connected-component laczy je w jeden blob. Zamiast je ODRZUCAC (co
   zostawialo dziury), sa teraz DZIELONE: dla komponentu szerszego/
   wyzszego niz 1.6x zmierzonej mediany pojedynczego kafla, licz ile
   kafli sie zmiescilo (round(wymiar/mediana)) i potnij na tyle rownych
   czesci wzdluz dluzszej osi. Nie idealne (prostokatny podzial nie
   wie, gdzie faktycznie jest krawedz miedzy roslinami), ale wierniejsze
   niz dziura po odrzuceniu — i widoczne od razu na podgladzie, jesli
   podzial wypadnie zle.
"""

import argparse
import os
from collections import deque

import numpy as np
from PIL import Image

TU = os.path.dirname(__file__)
ASSETS = os.path.normpath(os.path.join(TU, "..", "public", "assets"))

SRC_PATH = os.path.join(ASSETS, "pole.png")
OUT_PATH = os.path.join(ASSETS, "pole_tileset.png")

T = 32
PITCH = 33  # kafle 32px + 1px przezroczystej przerwy, jak Teren.png/Nature.png/
            # Buildings.png (patrz CLAUDE.md) — nie zbity 32px grid jak items.png.
            # Bez tego Tiled probkujac krawedz jednego kafla lapie 1px sasiada
            # (bleeding); "spacing" w ustawieniach tilesetu Tiled = 1 pomija te
            # przerwe przy imporcie.
N_KOLOROW = 32  # limit palety po kwantyzacji (k-means)
MAX_JEDNOTILE = 40  # powyzej tego rozmiaru (w kazdym wymiarze) to NIE jest pojedynczy kafel


def _wykryj_tlo(arr):
    h, w, _ = arr.shape
    rogi = np.array([arr[0, 0], arr[0, w - 1], arr[h - 1, 0], arr[h - 1, w - 1]])
    return rogi.mean(axis=0)


def _maska_pierwszoplanowa(arr, bg):
    """Flood-fill od KRAWEDZI kadru (lapie tlo, respektuje ksztalt — nie
    wejdzie w srodek liscia, bo do tego trzeba by ciaglej sciezki
    tlopodobnych pikseli od brzegu) + osobny, OSTROZNIEJSZY test resztkowy
    na tym, czego flood-fill nie dosiegnie (izolowane kieszenie tla
    miedzy np. dwoma lodygami w jednym komponencie). Identyczna technika
    jak build_kowal.py/_usun_zielone — i NIE przypadkiem: prosta plaska
    wersja "diff>=30 i nie-zielony" zastosowana do CALEGO kadru (pierwsza
    poprawka w tej sesji) dziurawila WNETRZE zielonych roslin (kapusta,
    liscie), bo ich wlasne ciemnozielone cieniowanie tez lapie sie w
    'g>140 i g>r+30 i g>b+30'. Flood-fill od krawedzi tego nie robi —
    zatrzymuje sie na pierwszym nie-tlopodobnym pikselu, wiec wnetrze
    liscia otoczone wlasnym konturem jest bezpieczne niezaleznie od tego,
    jak bardzo jest 'zielone'."""
    h, w = arr.shape[:2]
    diff = np.abs(arr[..., :3].astype(int) - bg).sum(axis=2)
    is_bg = diff < 60

    visited = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # Resztkowy test — wyraznie SCISLEJSZY niz "ogólnie zielonawy"
    # (progi podniesione wzgledem build_kowal.py, bo tam nic w temacie
    # nie jest naturalnie zielone; tutaj rosliny sa, wiec ten test ma
    # lapac TYLKO piksele bardzo blisko czystego chroma-green, nie
    # kazdy odcien zieleni).
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    still_green = (g > 200) & (g > r + 100) & (g > b + 100)

    return ~(visited | still_green)


def _znajdz_komponenty(arr, bg):
    h, w, _ = arr.shape
    fg = _maska_pierwszoplanowa(arr, bg)

    visited = np.zeros((h, w), bool)
    comps = []
    for y0 in range(h):
        for x0 in range(w):
            if fg[y0, x0] and not visited[y0, x0]:
                q = deque([(y0, x0)])
                visited[y0, x0] = True
                pix = []
                while q:
                    cy, cx = q.popleft()
                    pix.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not visited[ny, nx]:
                                visited[ny, nx] = True
                                q.append((ny, nx))
                ys = [p[0] for p in pix]
                xs = [p[1] for p in pix]
                comps.append((min(ys), max(ys), min(xs), max(xs), len(pix)))
    return comps


def _kmeans_paleta(pixels, k, iters=20, seed=0, min_udzial=0.001):
    """K-means++ (inicjalizacja wazona kwadratem odleglosci — odporniejsza
    na 'martwe' klastry niz czysto losowa) + reseed klastrow ponizej
    `min_udzial` frakcji pikseli, rozbijajac najliczniejszy klaster.
    Bez sklearn — projekt uzywa tylko numpy/PIL.

    Gdy w danych jest MNIEJ unikalnych kolorow niz `k`, k-means++ nie ma
    z czego dalej wybierac (kwadrat odleglosci do najblizszego srodka
    spada do zera dla kazdego pozostalego piksela) i `prob` wychodzi NaN —
    to byla prawdziwa przyczyna bialych artefaktow w pierwszej probie
    (pole.png ma tylko 15 unikalnych kolorow w tresci, dużo mniej niz
    zadane 32). Naprawione: gdy unikalnych kolorow jest <= k, uzyj ich
    WPROST, bez k-means — nie ma nic do redukcji."""
    unikalne = np.unique(pixels, axis=0)
    if len(unikalne) <= k:
        return unikalne.astype(float)

    rng = np.random.RandomState(seed)
    n = len(pixels)

    centry = [pixels[rng.randint(n)]]
    for _ in range(k - 1):
        d2 = np.min([((pixels - c) ** 2).sum(axis=1) for c in centry], axis=0)
        prob = d2 / d2.sum()
        centry.append(pixels[rng.choice(n, p=prob)])
    centry = np.array(centry, dtype=float)

    for it in range(iters):
        d = ((pixels[:, None, :] - centry[None, :, :]) ** 2).sum(axis=2)
        przypisanie = np.argmin(d, axis=1)
        liczebnosc = np.bincount(przypisanie, minlength=k)
        for i in range(k):
            if liczebnosc[i] > 0:
                centry[i] = pixels[przypisanie == i].mean(axis=0)
        # Reseed martwych/prawie-martwych klastrow na ostatnich kilku
        # iteracjach, zeby zdazyly sie ustabilizowac.
        if it >= iters - 5:
            martwe = np.where(liczebnosc < min_udzial * n)[0]
            if len(martwe):
                najliczniejszy = np.argmax(liczebnosc)
                pula = pixels[przypisanie == najliczniejszy]
                for i in martwe:
                    centry[i] = pula[rng.randint(len(pula))]
    return centry


def _znajdz_rozdzial(src, bg, y0, y1, x0, x1, mediana_h):
    """Gdzie ciac wysoka roslina na DOL (grunt+buta/bulwa, do glownego
    arkusza) i GORE (lodyga/liscie, do warstwy -over)? Staly offset
    `y1 - round(mediana_h) + 1` (pierwsza wersja) tnie NA OSLEP — dla
    korzeniowych (marchew, rzepa) trafial czesto w POLOWKE samej buty,
    bo buta siedzi tuz PONIZEJ lisci, nie dokladnie mediana_h od dolu.
    Zmierzone na marchwi (kolumna x52-76): buta ma piksele w wierszach
    175-179, stary podzial ciac w 177 — prosto przez jej srodek, stad
    plaski, 'obciety' wyglad zgloszony przez uzytkownika.

    Zamiast zgadywac offset, SZUKAMY prawdziwej granicy: licz piksele
    pierwszoplanowe w kazdym wierszu (szerokosc maski), id od DOLU w
    gore i znajdz pierwszy wiersz, gdzie robi sie 'chudo' (< 60%
    szerokosci) — to granica miedzy zwarta bryla (grunt+buta, pelna
    szerokosc) a rzadkimi lodygami/liscmi nad nia. Dziala tak samo dla
    pojedynczej wysokiej rosliny (lodyga->grunt) jak i dla buty
    korzeniowej (liscie->buta+grunt), bo w obu przypadkach to ten sam
    ksztalt: cienkie u gory, pelne u dolu.

    Odrzucane (fallback na stary staly offset), gdy wynik jest
    zdegenerowany (dol/gora prawie zerowej wysokosci) — np. gdy w
    danym kadrze nigdy nie ma pelnej szerokosci (nietypowy ksztalt),
    zeby nie zamienic jednego zlego przypadku na inny."""
    crop = src[y0:y1 + 1, x0:x1 + 1]
    fg = _maska_pierwszoplanowa(crop, bg)
    counts = fg.sum(axis=1)
    w = x1 - x0 + 1
    prog = 0.6 * w

    naive = y1 - round(mediana_h) + 1
    split = naive
    for yy in range(y1, y0 - 1, -1):
        if counts[yy - y0] < prog:
            split = yy + 1
            break

    wys = y1 - y0 + 1
    dol_h, gora_h = y1 - split + 1, split - y0
    if dol_h < 0.5 * mediana_h or gora_h < 2 or dol_h > wys - 2:
        return naive
    return split


def _podziel_komponent(y0, y1, x0, x1, mediana_w, mediana_h):
    """Zlepiony (touching, wykryty jako jeden connected component) rzad/
    kolumna kafli -> lista bboxow rownego podzialu wzdluz dluzszej osi.
    Zwraca [(y0,y1,x0,x1)] o dlugosci 1, jesli komponent juz jest
    pojedynczym kaflem (nic do dzielenia)."""
    w, h = x1 - x0 + 1, y1 - y0 + 1
    if w <= 1.6 * mediana_w and h <= 1.6 * mediana_h:
        return [(y0, y1, x0, x1)]
    if w > h:
        n = max(1, round(w / mediana_w))
        krok = w / n
        return [(y0, y1, round(x0 + i * krok), round(x0 + (i + 1) * krok) - 1) for i in range(n)]
    else:
        n = max(1, round(h / mediana_h))
        krok = h / n
        return [(round(y0 + i * krok), round(y0 + (i + 1) * krok) - 1, x0, x1) for i in range(n)]


def zbuduj():
    src = np.array(Image.open(SRC_PATH).convert("RGB"))
    bg = _wykryj_tlo(src)
    comps = _znajdz_komponenty(src, bg)
    comps = [c for c in comps if c[4] >= 10]  # odsiej szum (n<10, 1 taki element)

    # Mediana pojedynczego kafla z KOMPONENTOW JUZ W ROZSADNYM ZAKRESIE
    # (nie zlepionych, nie ogromnych) — punkt odniesienia do dzielenia i
    # do wylapania prawdziwego wyjatku (duzy nieregularny "kawalek pola").
    zwykle = [c for c in comps if (c[3] - c[2] + 1) <= 35 and (c[1] - c[0] + 1) <= 35]
    mediana_w = float(np.median([c[3] - c[2] + 1 for c in zwykle]))
    mediana_h = float(np.median([c[1] - c[0] + 1 for c in zwykle]))
    print("Mediana pojedynczego kafla: %.1fx%.1f" % (mediana_w, mediana_h))

    kafle_bbox = []
    for y0, y1, x0, x1, n in comps:
        w, h = x1 - x0 + 1, y1 - y0 + 1
        # Prawdziwy wyjatek (np. "kawalek pola" 45x96): DUZY w OBU
        # wymiarach naraz, nie tylko wydluzony w jedna strone jak zlepiony
        # rzad/kolumna kafli tego samego typu.
        if w > MAX_JEDNOTILE and h > MAX_JEDNOTILE:
            continue
        kafle_bbox.extend(_podziel_komponent(y0, y1, x0, x1, mediana_w, mediana_h))

    # Kolejnosc czytania: gora-dol, lewo-prawo (jak w oryginalnym ukladzie).
    kafle_bbox.sort(key=lambda b: (round(b[0] / 15), b[2]))

    # Paleta: k-means na WSZYSTKICH pikselach tresci naraz (spojna paleta
    # w calym arkuszu, nie osobna per kafel — inaczej sasiednie kafle
    # tego samego materialu wyszlyby w innych odcieniach).
    fg_mask_full = _maska_pierwszoplanowa(src, bg)
    wszystkie_px = src[fg_mask_full].astype(float)
    paleta = _kmeans_paleta(wszystkie_px, N_KOLOROW)

    def _przekoluj_snap(rgb, alpha):
        out = rgb.copy()
        mask = alpha > 0
        if mask.any():
            px = rgb[mask].astype(float)
            d = ((px[:, None, :] - paleta[None, :, :]) ** 2).sum(axis=2)
            out[mask] = paleta[np.argmin(d, axis=1)].astype(np.uint8)
        return out

    def _dopelnij_krawedzie(kafel, maks_pas=3):
        """Rozciaga skrajne piksele w waski przezroczysty margines.

        PO CO: kafel jest skalowany jednolita skala, a potem centrowany w
        poziomie i dosuwany do dolu. Po zaokragleniu `round(w * skala)` wychodzi
        czesto 29-31 px zamiast 32, wiec zostaje 1-3 px przezroczystosci przy
        krawedzi. Na warstwie `pola` w Tiled taki kafel zostawia WLOSOWA
        SZCZELINE, przez ktora widac trawe spod spodu — zgloszone wprost
        ("kafelki dzialek nie pasuja"), zmierzone: 27 kafli o kryciu >= 0.90
        mialo brak 1-3 px. Katalog docs/pole.json to opisuje, ale opis nie
        pomaga komus, kto wlasnie przeciaga kafel w Tiled — arkusz ma byc
        bezpieczny sam z siebie.

        ⚠ PROG 3 px JEST ISTOTNY, nie ostrozniczy. Ten arkusz zawiera obok
        kafli gruntu takze SAME ROSLINY na przezroczystym tle (najwezsza ma
        obrys 11x25, krycie 0.12). Rozciagniecie ich krawedzi zamienilo by
        sadzonke w kwadratowa mazie. Margines 1-3 px jest jednoznacznie
        artefaktem zaokraglenia skali; wszystko szersze to prawdziwy ksztalt
        i zostaje nietkniete (w katalogu ma `rola: "nakladka"` i wymaga ziemi
        pod spodem).

        ⚠ WYPELNIAMY OD SASIADA, NIE WEDLUG OBRYSU. Wersja liczaca obrys
        nieprzezroczysty dopelniala tylko pelne puste pasy — i przepuszczala
        najczestszy przypadek: kolumne CZESCIOWO przezroczysta. Kafel id6 mial
        w kolumnie 0 dwadziescia osiem pustych pikseli na trzydziesci dwa,
        wiec `xs.min()` bylo rowne 0, warunek nie dzialal, a na mapie zostawala
        wlosowa szczelina przez 7/8 wysokosci kafla.

        ⚠⚠ BRAMKA `_JEST_GRUNTEM` JEST OBOWIAZKOWA. Kuszace (i sprawdzone —
        nieprawdziwe) zalozenie brzmi: "kopiowanie od sasiada samo sie
        zabezpiecza, bo w marginesie rosliny sasiad tez jest przezroczysty".
        Trzyma sie tylko wtedy, gdy roslina NIE dotyka krawedzi kafla — a
        czesc dotyka. Bez bramki id90 dostal poziomu smuge wyciagnieta z
        kwiatu az do prawej krawedzi, a id147 zielony slupek na calej lewej
        krawedzi; oba widoczne natychmiast na porownaniu przed/po.

        Rozroznienie jest ostre, nie arbitralne: kafel gruntu ma srodkowy
        blok 16x16 wypelniony w 0.99-1.00, kazda roslina ma go co najwyzej
        0.78 (najgestsza `nac` — 0.78, sadzonka — 0.32). Miedzy tymi grupami
        jest pusta przerwa, wiec prog 0.99 nie balansuje na niczyjej granicy.
        """
        if not kafel[..., 3].any():
            return kafel
        if kafel[8:24, 8:24, 3].astype(bool).mean() < 0.99:
            return kafel
        for x in range(maks_pas - 1, -1, -1):            # lewa
            puste = kafel[:, x, 3] == 0
            kafel[puste, x] = kafel[puste, x + 1]
        for x in range(T - maks_pas, T):                 # prawa
            puste = kafel[:, x, 3] == 0
            kafel[puste, x] = kafel[puste, x - 1]
        for y in range(maks_pas - 1, -1, -1):            # gorna
            puste = kafel[y, :, 3] == 0
            kafel[y, puste] = kafel[y + 1, puste]
        for y in range(T - maks_pas, T):                 # dolna
            puste = kafel[y, :, 3] == 0
            kafel[y, puste] = kafel[y - 1, puste]
        return kafel

    # Jednolita skala (TA SAMA dla X i Y — "zachowaj proporcje, nie
    # sciskaj", user'a decyzja po zobaczeniu rozciagnietych lodyg).
    skala = T / mediana_w
    prog_wysoka = 1.4 * mediana_h  # powyzej tego to "wysoka roslina", nie zwykly kafel

    kafle = []       # trafiaja do glownego arkusza T x T (grunt/normalne kafle + DOL wysokich roslin)
    nadstawki = []   # gorna czesc wysokich roslin — osobne pliki, warstwa "-over" w Tiled
    pary = []        # (indeks w kafle, indeks w nadstawki) dla kazdej wysokiej rosliny — do podgladu/mapowania

    for y0, y1, x0, x1 in kafle_bbox:
        h_src = y1 - y0 + 1
        if h_src <= prog_wysoka:
            crop = src[y0:y1 + 1, x0:x1 + 1]
            alpha = np.where(_maska_pierwszoplanowa(crop, bg), 255, 0).astype(np.uint8)
            nowa_w = max(1, round(crop.shape[1] * skala))
            nowa_h = max(1, round(crop.shape[0] * skala))
            img = Image.fromarray(np.dstack([crop, alpha]), "RGBA").resize((nowa_w, nowa_h), Image.NEAREST)
            arr = np.array(img)
            kafel = np.zeros((T, T, 4), np.uint8)
            w_, h_ = min(T, arr.shape[1]), min(T, arr.shape[0])
            x_off, y_off = (T - w_) // 2, T - h_  # dolna krawedz — stoi na ziemi
            kafel[y_off:y_off + h_, x_off:x_off + w_] = arr[:h_, :w_]
            kafel = _dopelnij_krawedzie(kafel)
            kafel[..., :3] = _przekoluj_snap(kafel[..., :3], kafel[..., 3])
            kafle.append(kafel)
        else:
            # Wysoka roslina: DOL (ziemia + dolna lodyga, jeden kafel
            # zrodla wysokosci) idzie do glownego arkusza jak zwykly
            # kafel; GORA (reszta lodygi/liscie) to osobny plik na
            # warstwe "-over" — dokladnie ten sam podzial co
            # trees-base/trees-over w Nature.png (patrz CLAUDE.md).
            y_split = _znajdz_rozdzial(src, bg, y0, y1, x0, x1, mediana_h)
            dol = src[y_split:y1 + 1, x0:x1 + 1]
            gora = src[y0:y_split, x0:x1 + 1]

            dol_alpha = np.where(_maska_pierwszoplanowa(dol, bg), 255, 0).astype(np.uint8)
            nowa_w = max(1, round(dol.shape[1] * skala))
            nowa_h = max(1, round(dol.shape[0] * skala))
            dol_img = Image.fromarray(np.dstack([dol, dol_alpha]), "RGBA").resize((nowa_w, nowa_h), Image.NEAREST)
            dol_arr = np.array(dol_img)
            kafel = np.zeros((T, T, 4), np.uint8)
            w_, h_ = min(T, dol_arr.shape[1]), min(T, dol_arr.shape[0])
            x_off, y_off = (T - w_) // 2, T - h_
            kafel[y_off:y_off + h_, x_off:x_off + w_] = dol_arr[:h_, :w_]
            kafel = _dopelnij_krawedzie(kafel)
            kafel[..., :3] = _przekoluj_snap(kafel[..., :3], kafel[..., 3])
            kafle.append(kafel)

            gora_alpha = np.where(_maska_pierwszoplanowa(gora, bg), 255, 0).astype(np.uint8)
            nowa_w_g = max(1, round(gora.shape[1] * skala))
            nowa_h_g = max(1, round(gora.shape[0] * skala))
            gora_img = Image.fromarray(np.dstack([gora, gora_alpha]), "RGBA").resize((nowa_w_g, nowa_h_g), Image.NEAREST)
            gora_arr = np.array(gora_img)
            # Wysrodkuj poziomo na szerokosci T, WYSOKOSC naturalna
            # (bez sciskania/docinania) — moze byc mniejsza LUB wieksza
            # niz T, w zaleznosci od tego jak wysoka jest roslina.
            canvas_w = max(T, gora_arr.shape[1])
            nadstawka = np.zeros((gora_arr.shape[0], canvas_w, 4), np.uint8)
            x_off_g = (canvas_w - gora_arr.shape[1]) // 2
            nadstawka[:, x_off_g:x_off_g + gora_arr.shape[1]] = gora_arr
            nadstawka[..., :3] = _przekoluj_snap(nadstawka[..., :3], nadstawka[..., 3])
            nadstawki.append(nadstawka)
            pary.append((len(kafle) - 1, len(nadstawki) - 1))

    return kafle, nadstawki, pary, bg, paleta


def main(zapisz, podglad):
    kafle, nadstawki, pary, bg, paleta = zbuduj()
    print("Wykryty kolor tla:", tuple(bg.round().astype(int).tolist()))
    print("Kafli (grunt/dol): %d,  nadstawek gornych (-over): %d" % (len(kafle), len(nadstawki)))
    print("Paleta po kwantyzacji: %d kolorow" % len(paleta))

    cols = 14
    rows = (len(kafle) + cols - 1) // cols
    # PITCH (33), nie T (32): kazdy kafel siedzi na wlasnej 33px komorce z
    # 1px przezroczystej przerwy dookola, jak Teren.png/Nature.png/
    # Buildings.png — patrz PITCH powyzej.
    sheet = np.zeros((rows * PITCH - 1, cols * PITCH - 1, 4), np.uint8)
    for i, k in enumerate(kafle):
        r, c = divmod(i, cols)
        sheet[r * PITCH:r * PITCH + T, c * PITCH:c * PITCH + T] = k
    img = Image.fromarray(sheet, "RGBA")

    # Nadstawki: prosty pionowy pasek, kazda wlasnej naturalnej wysokosci,
    # wysrodkowana na szerokosci T — osobne pliki przy --zapisz (jak
    # studnia_*.png), tutaj tylko jeden podglad zlozony do oceny na oko.
    if nadstawki:
        over_w = max(n.shape[1] for n in nadstawki)
        over_h_total = sum(n.shape[0] for n in nadstawki) + 4 * (len(nadstawki) - 1)
        over_sheet = np.zeros((over_h_total, over_w, 4), np.uint8)
        y = 0
        for n in nadstawki:
            over_sheet[y:y + n.shape[0], :n.shape[1]] = n
            y += n.shape[0] + 4
        over_img = Image.fromarray(over_sheet, "RGBA")
    else:
        over_img = None

    if podglad:
        img.resize((img.width * 3, img.height * 3), Image.NEAREST).save(podglad)
        print("Podglad glownego arkusza (3x): %s" % podglad)
        if over_img:
            over_path = podglad.replace(".png", "_over.png")
            over_img.resize((over_img.width * 3, over_img.height * 3), Image.NEAREST).save(over_path)
            print("Podglad nadstawek -over (3x): %s" % over_path)

    if zapisz:
        img.save(OUT_PATH)
        print("Zapisano: %s (%dx%d, %d kafli, %d kolumn x %d wierszy)"
              % (OUT_PATH, img.width, img.height, len(kafle), cols, rows))
        for i, n in enumerate(nadstawki):
            p = os.path.join(ASSETS, "pole_over_%02d.png" % i)
            Image.fromarray(n, "RGBA").save(p)
        print("Zapisano %d plikow pole_over_NN.png (warstwa -over)" % len(nadstawki))
    else:
        print("Nic nie zapisano — uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    ap.add_argument("--podglad", default=None)
    args = ap.parse_args()
    main(args.zapisz, args.podglad)

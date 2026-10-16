"""
Generator uproszczonych minimap -> public/assets/maps/<mapa>_minimap.png

Uruchom:  python tools/build_minimap.py             (raport, NIC nie zapisuje)
          python tools/build_minimap.py --zapisz    (nadpisuje oba pliki)

── PIERWSZA, UPROSZCZONA WERSJA ────────────────────────────────────────────
Cel: pomoc graczowi w orientacji w terenie (zakladka "Mapa" w PlayerPanel).
Ten skrypt czyta bezposrednio `.tmj` (nie generatory typu build_mapa.py) —
tak samo jak silnik, wiec minimapa zgadza sie z tym, co faktycznie stoi na
mapie, WLACZNIE z recznymi poprawkami w Tiled (po pierwszej takiej poprawce
`.tmj` jest zrodlem prawdy, nie skrypt — ta sama zasada co przy samych
mapach, patrz naglowek `tools/build_mapa.py`).

Druga wersja: ikonki bramy (portal) dochodza jako male kolorowe kropki
wypalone wprost w obrazek, czytane z tej samej `objects` warstwy co
`TiledMap.readSpawns` w silniku. Zywy znacznik GRACZA nie jest tutaj — to
jedyna rzecz, ktora rusza sie w czasie gry, wiec rysuje ja silnik
(`WorldState`), nie ten skrypt.

── TRZECIA WERSJA (2026-10-11): minimapa HUD-u ─────────────────────────────
Obraz czyta od tej daty takze minimapa w prawym gornym rogu (`src/ui/
Minimap.ts`), czyli gracz widzi go CALY CZAS — nieaktualny obraz przestal byc
drobiazgiem zakladki "Mapa". Doszly trzy zrodla, ktore mapy przejely po
wersji drugiej i ktorych ten skrypt nie znal:
  * DRZEWA jako obiekty warstwy `trees` (las od rozstawu 2026-10-04) — bez
    tego las byl na minimapie golym trawnikiem;
  * BUDYNKI, PLOTY i SPRZET jako obiekty warstwy `budynki` (od 2026-10-09) —
    bez tego wies pokazywala owalnice sprzed K1, bez jednej chalupy;
  * POLA i UPRAWY (`pola`/`uprawy`, K3).
⛔ Wypalone kropki NPC (Mysliwy/Kowal) USUNIETE: oba widoki rysuja NPC-ow
na zywo z `WorldState.npcs`, wiec wypalona kropka byla druga, rozjezdzajaca
sie kopia. ⛔ Bramy na SZWIE swiata (`target` = mapa z `swiat.world`) tez
nie: od 2026-10-09 przejscie jest plynne i brama znika przy sklejaniu.

── TECHNIKA ─────────────────────────────────────────────────────────────
Jeden piksel-blok (`SKALA` x `SKALA` px) na kafel, kolor wybrany przez
NAJWAZNIEJSZA niepusta warstwe w danej komorce — ten sam pomysl co
splaszczanie kolizji w `TiledMap.ts` (topmost decyduje), tylko tu kolejnosc
waznosci jest inna (budynek jest wazniejszy niz woda, bo to POI, nie tylko
przeszkoda). Warstwy poza tą lista (dekoracyjne `-detale`/`-over`,
`undergrowth`, `bushes`) sa pomijane — na tej skali i tak nieczytelne.

Kolejnosc przebiegow: kafle -> korony drzew -> obiekty `budynki` -> ikony
bram. Kazdy kolejny lezy NA poprzednim, wiec chalupa nie znika pod korona,
a brama pod niczym. Pozycja obiektu to `x/tilewidth*SKALA` (obiekty w Tiled
sa juz w pikselach swiata, nie w kaflach).

⚠ Samokontrola: po narysowaniu srodek KAZDEGO budynku musi miec kolor
budynku. Zaswieci, gdy ktorys pozniejszy przebieg go przykryje (kod wyjscia
1, nic nie zapisuje).
"""

import argparse
import json
import os
import sys

from PIL import Image, ImageDraw

TU = os.path.dirname(__file__)
MAPS_DIR = os.path.normpath(os.path.join(TU, "..", "public", "assets", "maps"))

# px na kafel.
#
# ⚠ **4, a nie 3, i ta liczba jest WYPROWADZONA z rozmiaru panelu, nie dobrana.**
# Zakladka "Mapa" ma na obrazek 510x410 px. Przy SKALA=3 najwieksza mapa (wioska,
# 100x100) wychodzila 300x300 i wisiala w srodku wielkiego czarnego pola —
# zglosone jako "minimapa wyglada srednio". Przy 4 wszystkie trzy mapy miesza
# sie w tym polu DOKLADNIE w skali 1:1 (las 400x240, wioska 400x400, gestwina
# 256x256), czyli panel nie musi ich ani powiekszac, ani pomniejszac.
#
# ⚠ Podnoszac to dalej sprawdz WIOSKE, nie las: jest kwadratowa, wiec to ona
# pierwsza przestanie sie miescic w wysokosc (przy 5 to juz 500 > 410 i panel
# musialby ja przeskalowac ulamkowo, czyli rozmyc).
SKALA = 4

# Kolejnosc od NAJWAZNIEJSZEJ (wygrywa, jesli komorka ma kilka warstw) do
# najmniej waznej. `None` = kolor domyslny (trawa), gdy zadna z ponizszych
# warstw nic nie maluje w tej komorce.
WARSTWY_PRIORYTET = ["buildings", "wyposazenie", "water", "sand", "path", "uprawy", "pola", "trees-base"]

KOLORY = {
    "buildings": (74, 73, 86),      # neutralne[2] — budynek, POI
    "wyposazenie": (74, 73, 86),    # jak budynek — sprzet kuzni to tez POI
    "water": (80, 130, 165),        # woda[2]
    "sand": (213, 192, 139),        # piasek[3] — brod, jasniejszy niz droga
    "path": (103, 62, 44),          # ziemia[1] — droga, ciemniejsza od piasku
    # Uprawy jasniejsze i cieplejsze od trawy, rola (pole bez uprawy) — jasna
    # ziemia: obie musza odcinac sie od DROGI, ktora jest ciemna ziemia.
    "uprawy": (176, 164, 84),
    "pola": (150, 118, 72),
    # Ciemniej niz korona[1] (39,124,42): przy 2 j. na kafel w minimapie HUD-u
    # tamten odcien zlewal sie z trawa[2] i las czytal sie jak kropki na
    # trawniku zamiast masy (zmierzone na renderze 2026-10-11).
    "trees-base": (30, 96, 38),
}
KORONA = KOLORY["trees-base"]

# Obiekty warstwy `budynki` (typ z wlasciwosci `typ`, patrz naglowek
# `tools/houses3d.py`). Prostokat obiektu JEST obrysem (lity w calosci).
BUDYNEK = KOLORY["buildings"]
SPRZET = (112, 98, 82)   # woz, stragan, kozel, snopki — maly, nie POI
PLOT = (84, 58, 38)      # ciemne drewno; linia 2 px, nie pelny kafel
TYPY_BUDYNKOW = {"chalupa", "gospodarczy", "wiata", "stodola", "kurnik", "karczma", "kuznia", "mlyn", "dom"}
TYPY_PLOTOW = {"plot", "zerdzie", "palisada"}
TYPY_SPRZETU = {"woz", "stragan", "kozel", "snopki", "pranie", "gnojownik"}
# `wrota` NIE rysujemy: przerwa w plocie mowi „tu sie przechodzi" lepiej niz
# kreska. `kladka` maluje sie kolorem drogi — to jest przejscie, nie przeszkoda.
TRAWA = (76, 146, 61)  # trawa[2] — domyslne tlo, gdy nic innego nie pasuje

# Nazwa obiektu w warstwie `objects` (aliasy jak w `TiledMap.readSpawns`) ->
# (promien px, kolor wypelnienia). Portal wiekszy i zloty — to jedyne przejscie
# na mape, ma byc widoczne pierwsze. Bialy obrys dochodzi przy rysowaniu, zeby
# kazda ikona odcinala sie od kazdego koloru tla.
# ⚠ Promienie WYPROWADZONE ze SKALA, nie wpisane na sztywno. Przy stalych
# wartosciach kazde podniesienie SKALA po cichu zmniejszaloby ikony wzgledem
# mapy — a to jest dokladnie ta klasa cichego rozjazdu, ktora ten projekt
# lapal juz przy kaflach dachu.
_R_PORTAL = SKALA + 2

IKONY = {
    "portal": (_R_PORTAL, (255, 204, 102)),   # UI.gold
}

# Plik mapy -> id mapy w grze (`MAP_BY_ID`), zeby rozpoznac brame na szwie.
ID_MAPY = {"forrest.tmj": "forest", "village-zagaje.tmj": "village", "thicket-gestwina.tmj": "thicket"}


def _czlonkowie_swiata():
    """Id map sklejanych w `swiat.world` — brama do nich znika w grze."""
    sciezka = os.path.join(MAPS_DIR, "swiat.world")
    if not os.path.exists(sciezka):
        return set()
    swiat = json.load(open(sciezka, encoding="utf-8"))
    return {ID_MAPY.get(os.path.basename(m["fileName"])) for m in swiat.get("maps", [])} - {None}

MAPY = [
    ("forrest.tmj", "forest_minimap.png", "las"),
    ("village-zagaje.tmj", "village_minimap.png", "wioska"),
    ("thicket-gestwina.tmj", "thicket_minimap.png", "gestwina"),
]


def _wczytaj_warstwy(tmj):
    dane = {}
    for l in tmj["layers"]:
        if l.get("type") == "tilelayer" and l["name"] in WARSTWY_PRIORYTET:
            dane[l["name"]] = l["data"]
    return dane


def _wczytaj_obiekty(tmj):
    obiekty = []
    for l in tmj["layers"]:
        if l.get("type") == "objectgroup":
            obiekty.extend(l["objects"])
    return obiekty


def _wlasciwosci(o):
    return {p["name"]: p["value"] for p in o.get("properties", [])}


def zbuduj(tmj_path, czlonkowie):
    tmj = json.load(open(tmj_path, encoding="utf-8"))
    w, h = tmj["width"], tmj["height"]
    tw = tmj["tilewidth"]
    warstwy = _wczytaj_warstwy(tmj)
    sk = SKALA / tw  # px minimapy na px swiata

    img = Image.new("RGB", (w * SKALA, h * SKALA), TRAWA)
    draw = ImageDraw.Draw(img)

    for ty in range(h):
        for tx in range(w):
            i = ty * w + tx
            kolor = None
            for nazwa in WARSTWY_PRIORYTET:
                dane = warstwy.get(nazwa)
                if dane and dane[i] != 0:
                    kolor = KOLORY[nazwa]
                    break
            if kolor is None:
                continue  # trawa juz jest tlem
            draw.rectangle(
                [tx * SKALA, ty * SKALA, (tx + 1) * SKALA - 1, (ty + 1) * SKALA - 1],
                fill=kolor,
            )

    # Drugi przebieg: KORONY drzew-obiektow. Obiekt kaflowy Tiled ma `y` na
    # DOLE obrazka, a `x` na lewej krawedzi; pien stoi u dolu, posrodku, wiec
    # srodek kolka idzie lekko nad podstawe. Promien z szerokosci obrazka:
    # przy rozstawie lasu (>= 84 px miedzy pniami) korony sie stykaja i las
    # czyta sie jako masa, a polana — jako dziura w niej.
    liczba_drzew = 0
    for l in tmj["layers"]:
        if l.get("type") != "objectgroup" or l["name"] != "trees":
            continue
        for o in l["objects"]:
            ow = o.get("width") or tw * 3
            cx = (o["x"] + ow / 2) * sk
            cy = (o["y"] - ow * 0.25) * sk
            r = ow / 2 * sk * 0.9
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=KORONA)
            liczba_drzew += 1

    # ...oraz KORONY drzew-STEMPLI (wieś, Gęstwina — 2026-10-11, autor: „dopisz
    # drzewa wsi do minimapy"). Tam drzewo to kafle: dolny rząd stempla leży
    # w `trees-base`, korona w `trees-over`. Ciąg kafli pnia w jednym wierszu =
    # jedno drzewo (2–3 kafle szerokości); bez tego wieś na minimapie miała
    # tylko kropki wielkości kafla i sady były niewidoczne.
    pnie = warstwy.get("trees-base")
    if pnie:
        for ty in range(h):
            tx = 0
            while tx < w:
                if pnie[ty * w + tx] == 0:
                    tx += 1
                    continue
                x0 = tx
                while tx < w and pnie[ty * w + tx] != 0:
                    tx += 1
                szer = tx - x0
                cx = (x0 + szer / 2) * SKALA
                cy = (ty + 0.5) * SKALA - szer * SKALA * 0.35
                r = max(1.5, szer * SKALA * 0.55)
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=KORONA)
                liczba_drzew += 1

    # Trzeci przebieg: obiekty `budynki` — NA koronach, bo dach jest POI.
    budynki = []
    liczba_plotow = 0
    for l in tmj["layers"]:
        if l.get("type") != "objectgroup" or l["name"] != "budynki":
            continue
        for o in l["objects"]:
            typ = _wlasciwosci(o).get("typ")
            x0, y0 = round(o["x"] * sk), round(o["y"] * sk)
            x1, y1 = round((o["x"] + o["width"]) * sk) - 1, round((o["y"] + o["height"]) * sk) - 1
            if typ in TYPY_BUDYNKOW:
                draw.rectangle([x0, y0, x1, y1], fill=BUDYNEK)
                budynki.append(((x0 + x1) / 2, (y0 + y1) / 2, o.get("id"), typ))
            elif typ in TYPY_PLOTOW:
                # Linia 2 px wzdluz dluzszej osi — pelny kafel (4 px) robil
                # z kazdej zagrody gruby mur.
                if o["width"] >= o["height"]:
                    ym = (y0 + y1) // 2
                    draw.rectangle([x0, ym, x1, ym + 1], fill=PLOT)
                else:
                    xm = (x0 + x1) // 2
                    draw.rectangle([xm, y0, xm + 1, y1], fill=PLOT)
                liczba_plotow += 1
            elif typ in TYPY_SPRZETU:
                draw.rectangle([x0, y0, x1, y1], fill=SPRZET)
            elif typ == "kladka":
                draw.rectangle([x0, y0, x1, y1], fill=KOLORY["path"])
            elif typ != "wrota":
                print("  UWAGA: nieznany typ obiektu `budynki`: %r (id %s) — pominiety" % (typ, o.get("id")))

    # Czwarty przebieg: ikony NA WIERZCHU wszystkiego.
    liczba_ikon = 0
    for o in _wczytaj_obiekty(tmj):
        wpis = IKONY.get(o.get("name") or "")
        if wpis is None:
            continue
        if o.get("name") == "portal" and _wlasciwosci(o).get("target") in czlonkowie:
            continue  # brama na szwie swiata — w grze jej nie ma
        promien, kolor = wpis
        mx = o["x"] / tw * SKALA
        my = o["y"] / tw * SKALA
        draw.ellipse(
            [mx - promien, my - promien, mx + promien, my + promien],
            fill=kolor,
            outline=(255, 255, 255),
            width=1,
        )
        liczba_ikon += 1

    # Samokontrola: srodek kazdego budynku ma kolor budynku.
    bledy = []
    for cx, cy, oid, typ in budynki:
        px = img.getpixel((int(cx), int(cy)))
        if tuple(px[:3]) != BUDYNEK:
            bledy.append("BLAD: srodek budynku %s (id %s) ma kolor %s, nie budynku" % (typ, oid, px))

    raport = {"ikon": liczba_ikon, "drzew": liczba_drzew, "budynkow": len(budynki), "plotow": liczba_plotow}
    return img, w, h, raport, bledy


def main(zapisz):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    czlonkowie = _czlonkowie_swiata()
    wyniki = []
    wszystkie_bledy = []
    for tmj_name, out_name, etykieta in MAPY:
        tmj_path = os.path.join(MAPS_DIR, tmj_name)
        if not os.path.exists(tmj_path):
            print("POMINIETO %s — brak %s" % (etykieta, tmj_path))
            continue
        # Brama znika tylko MIEDZY mapami swiata. Gestwina lezy poza nim, wiec
        # jej brama do lasu jest prawdziwa, choc las jest czlonkiem.
        szew = czlonkowie if ID_MAPY.get(tmj_name) in czlonkowie else set()
        img, w, h, r, bledy = zbuduj(tmj_path, szew)
        print(
            "%s: %dx%d kafli -> %dx%d px | bram %d, drzew %d, budynkow %d, plotow %d"
            % (etykieta, w, h, img.width, img.height, r["ikon"], r["drzew"], r["budynkow"], r["plotow"])
        )
        wszystkie_bledy += bledy
        wyniki.append((img, out_name))
    if wszystkie_bledy:
        for b in wszystkie_bledy:
            print("  " + b)
        print("%d BLEDOW — nic nie zapisano." % len(wszystkie_bledy))
        raise SystemExit(1)
    if zapisz:
        for img, out_name in wyniki:
            out_path = os.path.join(MAPS_DIR, out_name)
            img.save(out_path)
            print("  zapisano: %s" % out_path)
    else:
        print("Nic nie zapisano — uzyj --zapisz.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    args = ap.parse_args()
    main(args.zapisz)

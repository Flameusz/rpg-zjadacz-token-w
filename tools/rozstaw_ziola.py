"""
Rozstawia STANOWISKA ZIOL na mapie .tmj, wg prawdziwego siedliska gatunku.

Uruchom:  python tools/rozstaw_ziola.py                 (raport, NIC nie zapisuje)
          python tools/rozstaw_ziola.py --zapisz        (dopisuje warstwe `rosliny`)

── PO CO OSOBNY SKRYPT, SKORO MAPY ROBIMY W TILED ──────────────────────────
Bo to nie jest decyzja o UKLADZIE, tylko o ZGODNOSCI Z EKOLOGIA, a ta jest
policzalna. Pokrzywa ma rosnac przy obejsciach i plotach, babka przy
wydeptanych drogach, dziurawiec na sloneczych polanach — i to sa warunki, ktore
da sie odczytac wprost z warstw mapy (gdzie jest sciezka, gdzie budynki, gdzie
gestwina). Recznie stawiane pieddziesiat punktow "na oko" rozjedzie sie z
opisem u Zielarki, a wtedy cala funkcja ("gra bawi, gra uczy") zamienia sie w
klamstwo powiedziane graczowi przez NPC.

Skrypt jest wiec PRZYMIAREM, tak samo jak build_mapa.py: liczy kandydatow,
raportuje i dopiero z --zapisz dopisuje warstwe. Nie rusza zadnej istniejacej
warstwy ani obiektu — DOPISUJE `rosliny` i tyle. Po dopisaniu mapa dalej jest
mapa: punkty wolno przesuwac, kasowac i dokladac recznie w Tiled, i to Tiled
wygrywa (patrz `docs/wioska_plan.md` 1.2a).

── DLACZEGO PUNKTOW JEST DUZO WIECEJ NIZ ROSLIN ────────────────────────────
Punkt to STANOWISKO ("tu wolno rosnac"), nie roslina. `NodeSpawner` trzyma
wyrosnietych okolo 30% (GATHER.activeRatio) i losuje ktore przy kazdym wejsciu
na mape. Dzieki temu wiedza uzyteczna zostaje SIEDLISKO ("szukaj przy drogach"),
a nie pamiec konkretnego krzaka — inaczej po trzeciej sesji gracz przestaje
patrzec i biega wyuczona trase.
"""

import argparse
import json
import os
import random
import re

ASSETS = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "maps")
T = 32

# Staly seed: dwa uruchomienia daja ten sam rozklad, wiec raport bez --zapisz
# opisuje dokladnie to, co --zapisz postawi.
RNG = random.Random(1987)

# Minimalny odstep miedzy stanowiskami (kafle). Zapobiega kepkom trzech roslin
# w jednym miejscu, ktore czytaja sie jak blad, a nie jak laka.
MIN_ODSTEP = 3

# Minimalny odstep od NPC / ogniska / portalu (piksele). Zasieg ziola to 38 px,
# NPC 48 — suma 86. Ponizej tego roslina zaczyna odbierac prompt rozmowie,
# co po arbitrazu z core/Interactables.ts jest juz tylko brzydkie (a nie
# zepsute), ale brzydkie tez nie musi byc.
MIN_OD_NPC_PX = 110

# Nazwy obiektow, ktore traktujemy jako "cos, co ma swoj wlasny prompt".
INTERAKCYJNE = {"player", "portal", "campfire", "studnia", "well", "studnia_mala", "well_small"}


def wczytaj(sciezka):
    with open(sciezka, encoding="utf-8") as f:
        return json.load(f)


def warstwa(mapa, nazwa):
    for l in mapa["layers"]:
        if l["name"] == nazwa and l["type"] == "tilelayer":
            return l["data"]
    return None


def maska(mapa, nazwy):
    """Zbior kafli (tx, ty), na ktorych cokolwiek stoi w podanych warstwach."""
    w, h = mapa["width"], mapa["height"]
    out = set()
    for nazwa in nazwy:
        d = warstwa(mapa, nazwa)
        if d is None:
            continue
        for i, gid in enumerate(d):
            if gid:
                out.add((i % w, i // w))
    return out


def dystans_do(zbior, w, h, limit):
    """Odleglosc Chebysheva do najblizszego kafla ze zbioru, obcieta na `limit`.

    BFS po siatce, nie liczenie par — przy 10 000 kafli i kilkuset zrodlach
    roznica jest miedzy milisekundami a sekundami.
    """
    INF = limit + 1
    dist = [[INF] * w for _ in range(h)]
    fala = []
    for (x, y) in zbior:
        if 0 <= x < w and 0 <= y < h:
            dist[y][x] = 0
            fala.append((x, y))
    d = 0
    while fala and d < limit:
        d += 1
        nast = []
        for (x, y) in fala:
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and dist[ny][nx] > d:
                        dist[ny][nx] = d
                        nast.append((nx, ny))
        fala = nast
    return dist


def punkty_interakcyjne(mapa):
    """Piksele obiektow, ktore maja wlasny prompt — NPC, portale, ognisko."""
    out = []
    for l in mapa["layers"]:
        if l["type"] != "objectgroup":
            continue
        for o in l["objects"]:
            nazwa = (o.get("name") or "").lower()
            # Kazdy nazwany obiekt POZA samymi roslinami traktujemy jako zajety
            # punkt: lista NPC zyje w TiledMap.ts i nie chcemy jej tu dublowac.
            if nazwa and nazwa not in ZIOLA:
                out.append((o["x"], o["y"]))
    return out


# ── SIEDLISKA ───────────────────────────────────────────────────────────────
#
# Kazde `warunek` dostaje slownik zmierzonych odleglosci (w kaflach) i zwraca
# True, jesli na tym kaflu ten gatunek MOGLBY rosnac naprawde. Te reguly sa
# jedynym miejscem, w ktorym siedzi wiedza przyrodnicza — i musza sie zgadzac z
# `HERBS[*].siedlisko` w GameConfig.ts oraz z tym, co mowi Dorota.
ZIOLA = {
    "babka": dict(
        opis="pobocza drog, wydeptane miejsca",
        # Tuz przy sciezce, ale nie na niej: babka rosnie na skraju klepiska.
        warunek=lambda d: 1 <= d["sciezka"] <= 2 and d["drzewa"] >= 2,
        ile={"forest": 12, "village": 12},
    ),
    "krwawnik": dict(
        opis="suche laki i miedze w pelnym sloncu",
        # Otwarta przestrzen: daleko od gestwiny, ale nie na samej drodze.
        warunek=lambda d: d["drzewa"] >= 4 and d["sciezka"] >= 3 and d["budynki"] >= 4,
        # Duzo mniej w lesie niz we wsi, i to NIE jest kompromis techniczny —
        # patrz uwaga "ZIOLA LAKOWE" na dole pliku.
        ile={"forest": 8, "village": 12},
    ),
    "pokrzywa": dict(
        opis="zyzna ziemia przy obejsciach, plotach i skraju lasu",
        # Dwa zupelnie rozne miejsca, oba prawdziwe: przy zabudowaniach (azot z
        # obornika) albo tuz przy scianie lasu.
        warunek=lambda d: (1 <= d["budynki"] <= 3) or (d["drzewa"] == 1),
        ile={"forest": 10, "village": 14},
    ),
    "rumianek": dict(
        opis="ugory, miedze i skraje pol, ubita ziemia w sloncu",
        # Otwarte, ale blizej ludzkiego swiata niz krwawnik — stad luzniejszy
        # warunek na sciezke.
        warunek=lambda d: d["drzewa"] >= 3 and 2 <= d["sciezka"] <= 6,
        # W LESIE ZERO, celowo — patrz "ZIOLA LAKOWE" na dole pliku.
        ile={"forest": 0, "village": 14},
    ),
    "dziurawiec": dict(
        opis="sloneczne polany i skraje lasu, nigdy w gestwinie",
        # Polana: otwarty kafel, ale las widac o 2-4 kafle dalej.
        warunek=lambda d: 2 <= d["drzewa"] <= 4 and d["sciezka"] >= 4,
        ile={"forest": 12, "village": 4},
    ),
}


def rozstaw(mapa, map_id, raport):
    w, h = mapa["width"], mapa["height"]

    drzewa = maska(mapa, ["trees-base", "trees-over", "bushes"])
    sciezka = maska(mapa, ["path"])
    budynki = maska(mapa, ["buildings", "buildings-detale", "buildings-over", "wyposazenie"])
    woda = maska(mapa, ["water"])

    d_drzewa = dystans_do(drzewa, w, h, 8)
    d_sciezka = dystans_do(sciezka, w, h, 8)
    d_budynki = dystans_do(budynki, w, h, 8)

    zajete_px = punkty_interakcyjne(mapa)

    # Kafle, na ktorych w ogole nie wolno nic postawic.
    def zabronione(tx, ty):
        if (tx, ty) in woda or (tx, ty) in drzewa or (tx, ty) in budynki or (tx, ty) in sciezka:
            return True
        # Margines od krawedzi mapy — roslina na samym brzegu jest nie do
        # obejscia z jednej strony.
        return tx < 2 or ty < 2 or tx >= w - 2 or ty >= h - 2

    postawione = []  # (tx, ty) wszystkich gatunkow razem — MIN_ODSTEP jest wspolny
    wynik = {}

    for gatunek, cfg in ZIOLA.items():
        ile = cfg["ile"].get(map_id, 0)
        kandydaci = []
        for ty in range(h):
            for tx in range(w):
                if zabronione(tx, ty):
                    continue
                d = {
                    "drzewa": d_drzewa[ty][tx],
                    "sciezka": d_sciezka[ty][tx],
                    "budynki": d_budynki[ty][tx],
                }
                if cfg["warunek"](d):
                    kandydaci.append((tx, ty))

        RNG.shuffle(kandydaci)
        wybrane = []
        for (tx, ty) in kandydaci:
            if len(wybrane) >= ile:
                break
            if any(max(abs(tx - ax), abs(ty - ay)) < MIN_ODSTEP for (ax, ay) in postawione):
                continue
            px, py = tx * T + T // 2, ty * T + T // 2
            if any((px - ox) ** 2 + (py - oy) ** 2 < MIN_OD_NPC_PX ** 2 for (ox, oy) in zajete_px):
                continue
            wybrane.append((tx, ty))
            postawione.append((tx, ty))

        wynik[gatunek] = wybrane
        raport.append(
            "  %-11s %-46s kandydatow %4d  postawiono %2d/%2d %s"
            % (
                gatunek,
                cfg["opis"],
                len(kandydaci),
                len(wybrane),
                ile,
                "OK" if len(wybrane) == ile else "BLAD: za malo miejsc",
            )
        )

    return wynik


def blok_warstwy(wynik, layer_id, first_object_id, styl_tiled):
    """Warstwa obiektow jako tekst.

    ⚠ DWA PLIKI, DWA FORMATY — i to nie jest niechlujstwo, tylko historia:
    `forrest.tmj` napisal `build_mapa.py` (zwarty json.dump, spacja po
    dwukropku), a `village-zagaje.tmj` zostal ZAPISANY Z TILED (wlasne wciecia,
    bez spacji po dwukropku). Wstawianie tekstu musi wiec znac oba, inaczej albo
    sie wywala, albo przeformatuje caly plik i robi diff nie do przeczytania.
    """
    dw = '"%s":' if styl_tiled else '"%s": '
    obiekty = []
    oid = first_object_id
    for gatunek, punkty in wynik.items():
        for (tx, ty) in punkty:
            pola = [
                ("height", "0"),
                ("id", str(oid)),
                ("name", '"%s"' % gatunek),
                ("opacity", "1"),
                ("point", "true"),
                ("rotation", "0"),
                ("type", '""'),
                ("visible", "true"),
                ("width", "0"),
                ("x", str(tx * T + T // 2)),
                ("y", str(ty * T + T // 2)),
            ]
            if styl_tiled:
                srodek = ",\n".join('                 "%s":%s' % (k, v) for k, v in pola)
                obiekty.append("                {\n%s\n                }" % srodek)
            else:
                obiekty.append("{%s}" % ", ".join('"%s": %s' % (k, v) for k, v in pola))
            oid += 1

    if styl_tiled:
        blok = (
            "        {\n"
            '         "draworder":"topdown",\n'
            '         "id":%d,\n'
            '         "name":"rosliny",\n'
            '         "objects":[\n%s],\n'
            '         "opacity":1,\n'
            '         "type":"objectgroup",\n'
            '         "visible":true,\n'
            '         "x":0,\n'
            '         "y":0\n'
            "        }" % (layer_id, ", \n".join(obiekty))
        )
    else:
        blok = (
            '{"draworder": "topdown", "id": %d, "name": "rosliny", '
            '"objects": [%s], "opacity": 1, "type": "objectgroup", '
            '"visible": true, "x": 0, "y": 0}' % (layer_id, ", ".join(obiekty))
        )
    _ = dw
    return blok, oid


def koniec_tablicy_warstw(tekst):
    """Indeks zamykajacego `]` tablicy "layers" — przez liczenie nawiasow, nie
    przez zgadywanie markera tekstowego, bo formaty obu plikow sie roznia."""
    m = re.search(r'"layers"\s*:\s*\[', tekst)
    if not m:
        raise ValueError("nie znaleziono tablicy layers")
    i = m.end()
    glebokosc = 1
    w_stringu = False
    escape = False
    while i < len(tekst):
        c = tekst[i]
        if escape:
            escape = False
        elif c == "\\":
            escape = True
        elif c == '"':
            w_stringu = not w_stringu
        elif not w_stringu:
            if c in "[{":
                glebokosc += 1
            elif c in "]}":
                glebokosc -= 1
                if glebokosc == 0:
                    return i
        i += 1
    raise ValueError("niedomknieta tablica layers")


def zapisz(sciezka, wynik):
    with open(sciezka, encoding="utf-8") as f:
        tekst = f.read()

    if '"rosliny"' in tekst:
        print("  ! warstwa `rosliny` juz istnieje — pomijam (skasuj ja w Tiled, zeby przeliczyc)")
        return False

    styl_tiled = '"draworder":"topdown"' in tekst
    nextlayerid = int(re.search(r'"nextlayerid"\s*:\s*(\d+)', tekst).group(1))
    nextobjectid = int(re.search(r'"nextobjectid"\s*:\s*(\d+)', tekst).group(1))

    blok, po_id = blok_warstwy(wynik, nextlayerid, nextobjectid, styl_tiled)

    # Wstaw jako OSTATNIA warstwe: `readSpawns` chodzi po wszystkich warstwach
    # obiektow, wiec kolejnosc nie ma znaczenia dla gry — ma za to znaczenie w
    # Tiled, gdzie chcemy miec rosliny osobno i z wlasnym przelacznikiem oczka.
    idx = koniec_tablicy_warstw(tekst)
    wstawka = (", \n" + blok + "\n") if styl_tiled else (", " + blok)
    tekst = tekst[:idx] + wstawka + tekst[idx:]

    tekst = re.sub(r'("nextlayerid"\s*:\s*)\d+', r"\g<1>%d" % (nextlayerid + 1), tekst)
    tekst = re.sub(r'("nextobjectid"\s*:\s*)\d+', r"\g<1>%d" % po_id, tekst)

    with open(sciezka, "w", encoding="utf-8") as f:
        f.write(tekst)
    return True


def main(do_zapisu):
    mapy = [("forest", "forrest.tmj"), ("village", "village-zagaje.tmj")]
    for map_id, plik in mapy:
        sciezka = os.path.join(ASSETS, plik)
        mapa = wczytaj(sciezka)
        raport = ["%s (%dx%d)" % (plik, mapa["width"], mapa["height"])]
        wynik = rozstaw(mapa, map_id, raport)
        print("\n".join(raport))
        razem = sum(len(v) for v in wynik.values())
        print("  RAZEM stanowisk: %d  (wyrosnietych naraz ~%d przy activeRatio 0.3)"
              % (razem, round(razem * 0.3)))
        if do_zapisu:
            if zapisz(sciezka, wynik):
                print("  zapisano warstwe `rosliny` -> %s" % plik)
        print()
    if not do_zapisu:
        print("Nic nie zapisano — uzyj --zapisz.")


# ── ZIOLA LAKOWE: DLACZEGO KRWAWNIKA I RUMIANKU JEST W LESIE TAK MALO ───────
#
# Pierwszy przebieg zamowil po 12 i 10 sztuk w lesie i raport odmowil: krwawnik
# znalazl 57 kandydatow, rumianek SZESNASCIE. Powod nie jest techniczny —
# `forrest.tmj` ma 610 drzew i gestosc rosnaca ku poludniowemu zachodowi, wiec
# kafli oddalonych o 3-4 od jakiegokolwiek drzewa jest tam po prostu tyle co
# nic. Tak wlasnie wyglada las.
#
# Kuszaca "naprawa" to poluzowac warunek (d["drzewa"] >= 2 zamiast >= 4) i
# dostac swoje dwanascie sztuk. Bylby to jednak dokladnie ten blad, przed
# ktorym cala ta funkcja ma bronic: rumianek stalby w polcieniu miedzy drzewami,
# a Dorota dalej mowilaby "szukaj na otwartym, w sloncu" — i gracz nauczylby sie
# z gry nieprawdy.
#
# Wiec zamiast reguly zmieniamy LICZBY, a rozjazd zostaje jako TRESC:
#   • las      -> babka (drogi), pokrzywa (skraj), dziurawiec (polany), troche
#                 krwawnika na widnych skrajach
#   • wies      -> rumianek i wiekszosc krwawnika (miedze, ugory, skraje pol)
# Gracz, ktory chce rumianku, musi wrocic za palisade i poszukac przy polach.
# To jest darmowy powod, zeby wies wchodzila do petli — i jedyny w tym projekcie,
# ktory nie kosztowal ani jednego nowego systemu.
#
# Rumianek dostaje w lesie ZERO, nie "jedno stanowisko na otarcie lez". Szesnascie
# kandydatow lezalo w jednej kepie przy drodze, wiec po MIN_ODSTEP zmiescilby sie
# jeden — a jedno stanowisko to maxActive=1, czyli DOKLADNIE ten wyuczony krzak,
# przed ktorym broni cala pula stanowisk. Lepiej, zeby gatunek uczciwie nie
# wystepowal, niz zeby wystepowal w jednym, zapamietywalnym miejscu.
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zapisz", action="store_true")
    main(ap.parse_args().zapisz)

"""
Audyt ROZSTAWIENIA — sprawdza, czy nic nie stoi tam, gdzie nie powinno.

Uruchom:  python tools/audyt_rekwizytow.py            (obie mapy)
          python tools/audyt_rekwizytow.py --mapa las
          python tools/audyt_rekwizytow.py --cicho    (tylko bledy, bez OK)

Kod wyjscia: 0 = czysto, 1 = znaleziono BLAD. Nic nie zapisuje, nigdy.

── PO CO TO ISTNIEJE ─────────────────────────────────────────────────────
`build_mapa.py --raport` pilnuje odleglosci SPAWNOW (wilk-wilk, Szary-wilk,
niedzwiedz-hub...). Nie pilnuje niczego innego, a przez ostatnie sesje na
obie mapy trafilo recznie ~50 punktow: rekwizyty, zwierzeta, zielarskie
stanowiska, NPC-e. Kazda z ponizszych wpadek REALNIE sie wydarzyla i za
kazdym razem zlapal ja dopiero SCREENSHOT, nie zaden raport:

  • lawka Sobka postawiona dokladnie na kolumnie drzwi (E1, 2026-08-11),
  • studnia na osi przelotowej drogi zamiast obok niej (przesunieta 2 kafle),
  • cwiartka stogu — `stog_0` postawiony sam, bo rodzina ma 4 kafle
    ("masz 1/4 ula"),
  • "chata zachod" przesunieta recznie w Tiled, a rekwizyty liczone od
    NIEAKTUALNYCH wspolrzednych z generatora.

Wspolny mianownik: **zaden z tych bledow nie jest widoczny w liczbach**,
ktore ktos wtedy ogladal. Ten skrypt zamienia "popatrz na screenshot" w
"uruchom raport" — dokladnie tak, jak `raport()` w `build_mapa.py` zrobil to
dla odleglosci spawnow.

⚠ **To NIE jest walidator mapy w ogolnym sensie.** Sprawdza piec konkretnych
klas bledu wypisanych nizej, bo kazda z nich juz raz kosztowala czas. Nie
dokladaj tu regul "na wszelki wypadek" — regula bez historii to szum, ktory
nauczy czytac raport po lebkach.

⚠ **Zrodlem prawdy jest `.tmj`, nie generator.** Skrypt czyta wylacznie
wyeksportowane mapy, bo one sa tym, w co gra gracz — patrz wpadka z "chata
zachod" wyzej. Nie importuje `build_mapa.py`/`build_wioska.py` celowo.
"""

import argparse
import json
import math
import os
import sys
from collections import defaultdict

TU = os.path.dirname(__file__)
KORZEN = os.path.normpath(os.path.join(TU, ".."))
MAPY_KAT = os.path.join(KORZEN, "public", "assets", "maps")
DOCS = os.path.join(KORZEN, "docs")

MAPY = {
    "las": "forrest.tmj",
    "wioska": "village-zagaje.tmj",
}

T = 32  # rozmiar kafla w px

# ── Klasyfikacja obiektow punktowych ────────────────────────────────────
#
# Nazwy MUSZA byc zgodne z `src/world/TiledMap.ts` — to jest jedyne miejsce,
# gdzie ta lista zyje podwojnie, i dlatego skrypt na koncu wypisuje obiekty
# NIEROZPOZNANE: jesli TiledMap pozna nowa nazwe, a ten plik nie, zobaczysz
# ja na liscie zamiast stracic ja po cichu.

# Postacie, z ktorymi gracz gada klawiszem E. Ich zasiegi interakcji nie
# moga na siebie zachodzic — patrz `core/Interactables.ts`.
NPC = {
    "merchant", "hunter", "mysliwy", "blacksmith", "kowal", "peasant", "rolnik",
    "dobek", "miller", "mlynarz", "milosz", "elder", "soltys", "dobieslaw",
    "father", "ojciec", "marko", "mother", "matka", "alina", "herbalist",
    "zielarka", "dorota", "widow", "wdowa", "zofia", "hanna", "witek", "kuba",
    "sulislaw", "agata", "dobrawa", "sobek", "stolarz", "gniewko", "pasterz",
    # ⚠ "anna" i "hanna" to DWIE rozne osoby, obie prawdziwe nazwy obiektow.
    # Literowka w Tiled da po cichu nie te postac — patrz NPC_OBJECT_NAMES.
    "anna",
}

# Statyczne rekwizyty (DECOR_PROPS w GameConfig) + studnia/kolo/ognisko.
REKWIZYTY = {
    "suszona_skora", "dried_hide", "skora",
    "stog_siana", "haystack", "stog",
    "strach", "scarecrow", "strach_na_wroble",
    "pniak", "stump", "pniak_z_siekiera",
    "grzyby", "mushrooms",
    "brzeg_stawu", "pond_edge",
    "lilia", "lilia_wodna", "lily_pad",
    "studnia", "well", "studnia_mala", "well_small",
    "kolo", "kolo_mlynskie", "waterwheel",
    "campfire",
    # Nowy system kamieni (ETAP 3, 2026-08-31) — 23 warianty na warstwie
    # `kamienie`. Stary system (glaz_a/glaz_b/kupa_a/kupa_b/kamyki/glaz_wielki/
    # filar + kamienie.png + rockSpawns) WYCOFANY.
    *[f"kamien_{k}_{n:02d}" for k, n in [
        ("drobny", 1), ("drobny", 2), ("drobny", 4), ("drobny", 6),
        ("maly", 2), ("maly", 4), ("maly", 5), ("maly", 8), ("maly", 12), ("maly", 15),
        ("sredni", 1), ("sredni", 2), ("sredni", 6), ("sredni", 7), ("sredni", 9), ("sredni", 11),
        ("duzy", 1), ("duzy", 2), ("duzy", 5), ("duzy", 6),
        ("glaz", 1), ("glaz", 2), ("glaz", 3),
    ]],
    *[f"stone_{k}_{n:02d}" for k, n in [
        ("drobny", 1), ("drobny", 2), ("drobny", 4), ("drobny", 6),
        ("maly", 2), ("maly", 4), ("maly", 5), ("maly", 8), ("maly", 12), ("maly", 15),
        ("sredni", 1), ("sredni", 2), ("sredni", 6), ("sredni", 7), ("sredni", 9), ("sredni", 11),
        ("duzy", 1), ("duzy", 2), ("duzy", 5), ("duzy", 6),
        ("glaz", 1), ("glaz", 2), ("glaz", 3),
    ]],
    # Krzewy (ETAP 2) i flora wodna (ETAP 1) — tez DECOR_PROPS.
    "krzew_kopula_maly", "krzew_kopula_sredni", "krzew_kopula_duzy",
    "krzew_jagodowy", "krzew_kwitnacy", "krzew_kopula_oliwkowy",
    "krzew_galezisty", "krzew_galezisty_jagodowy", "krzew_suchy",
    "krzew_niski", "krzew_chrust",
    "palka_duza", "palka_srednia", "palka_mala", "trzcina_duza", "trzcina_mala",
    *[f"kepa_bagienna_{n:02d}" for n in range(1, 7)],
    *[f"roslina_brzegowa_{n:02d}" for n in range(1, 7)],
}

# Zwierzeta chodzace po ziemi (FarmAnimal + Critter). Ptaki NIE — siedza na
# galeziach, wiec drzewo pod nimi jest cecha, nie bledem.
ZWIERZETA = {
    "chicken", "kura", "cow", "krowa", "pig", "swinia", "sheep", "owca",
    "cat", "kot", "bull", "byk", "ram", "baran",
    "dog", "pies", "kirci", "sheepdog", "owczarek",
}

PTAKI = {"bird", "ptak"}

WROGOWIE = {
    "rabbit", "enemy", "boar", "bear", "niedzwiedz", "wolf", "greywolf",
    "szary", "spider", "venomspider", "skoczek", "pajak_jadowity", "fox", "lis", "deer", "jelen",
}

ZIOLA = {"babka", "babka_lancetowata", "krwawnik", "pokrzywa", "rumianek", "dziurawiec"}

SLUZBOWE = {"player", "portal"}

# Zasieg interakcji NPC z `GameConfig.MERCHANT.interactRange`. Dwa NPC-e
# blizej niz 2x to znaczy, ze klawisz E jest w tym miejscu dwuznaczny.
ZASIEG_NPC = 48
MIN_NPC_NPC = 2 * ZASIEG_NPC

# ── Prawdziwe KOMPOZYTY (nie warianty) ──────────────────────────────────
#
# `docs/budynki.json` ma ~30 rodzin kafli, ale wiekszosc to WARIANTY, gdzie
# uzycie jednego jest poprawne (`sciana_0` sam w sobie jest cala sciana).
# Tu sa tylko te, ktore sa jedna rzecza rozbita na kilka kafli i nie maja
# sensu w kawalkach. Tego NIE DA SIE wywnioskowac z katalogu automatycznie —
# stad recznie utrzymywana lista.
KOMPOZYTY = {
    "stog": (["stog_0", "stog_1", "stog_2", "stog_3"], "2x2 stog siana"),
    "lawka": (["lawka_l", "lawka_p"], "lawka (lewa+prawa polowa)"),
}

# ── Wyjatki, kazdy z powodem ─────────────────────────────────────────────
#
# ⚠ Pierwsza wersja tego skryptu zglosila 5 "bledow" i WSZYSTKIE piec bylo
# fałszywych — reguly byly za szerokie. Zostaly zawezone tutaj zamiast byc
# wyciszone przy zglaszaniu, bo regula, ktora krzyczy na poprawny stan, uczy
# czytac raport po lebkach i jest gorsza niz jej brak.

# Rekwizyty, ktore MAJA byc zamontowane na budynku. Kolo wodne ma w
# `ASSETS.waterwheel` osobna klatke "bok" wlasnie do montazu plasko przy
# scianie mlyna — stoi na wierszu fundamentu i tak ma byc.
WOLNO_NA_BUDYNKU = {"kolo", "kolo_mlynskie", "waterwheel"}

# Regula "nie stoj w progu" dotyczy REKWIZYTOW i ZWIERZAT, nigdy NPC-ow.
# `build_mapa.py` mowi wprost: "Myśliwy stoi PRZED wlasnymi drzwiami, przy
# drodze — placowka handlowa ma miec adres, a nie byc punktem w trawie".
# Prawdziwa wpadka z E1 to byla LAWKA na kolumnie drzwi Sobka, czyli mebel
# blokujacy wejscie — nie czlowiek stojacy u siebie na progu.


def wczytaj(sciezka):
    with open(sciezka, encoding="utf-8") as f:
        return json.load(f)


def warstwy_kafli(mapa):
    return {l["name"]: l["data"] for l in mapa["layers"] if l["type"] == "tilelayer"}


def obiekty(mapa):
    out = []
    for l in mapa["layers"]:
        if l["type"] != "objectgroup":
            continue
        for o in l["objects"]:
            out.append((l["name"], (o.get("name") or "").lower(),
                        float(o.get("x", 0)), float(o.get("y", 0))))
    return out


def kafel(dane, szer, tx, ty, wys):
    if tx < 0 or ty < 0 or tx >= szer or ty >= wys:
        return 0
    return dane[ty * szer + tx]


def firstgid(mapa, nazwa):
    for ts in mapa["tilesets"]:
        if ts["name"] == nazwa:
            return ts["firstgid"]
    return None


class Raport:
    def __init__(self, cicho):
        self.bledy = 0
        self.cicho = cicho

    def ok(self, tekst):
        if not self.cicho:
            print("  OK    %s" % tekst)

    def blad(self, tekst):
        self.bledy += 1
        print("  BLAD  %s" % tekst)

    def uwaga(self, tekst):
        print("  ? %s" % tekst)


def audyt(klucz, r):
    sciezka = os.path.join(MAPY_KAT, MAPY[klucz])
    mapa = wczytaj(sciezka)
    szer, wys = mapa["width"], mapa["height"]
    W = warstwy_kafli(mapa)
    obs = obiekty(mapa)

    print("\n== %s (%s) — %d obiektow, %dx%d kafli"
          % (klucz, MAPY[klucz], len(obs), szer, wys))

    bud = W.get("buildings", [])
    det = W.get("buildings-detale", [])
    drzewa = W.get("trees-base", [])
    droga = W.get("path", [])

    fg_b = firstgid(mapa, "Buildings")
    # Kafle drzwi/wrot z docs/budynki.json (lokalne id -> gid na tej mapie).
    kat = wczytaj(os.path.join(DOCS, "budynki.json"))["kafle"]
    drzwi_gid = set()
    if fg_b is not None:
        for n, info in kat.items():
            if n.startswith(("drzwi", "wrota")):
                drzwi_gid.add(fg_b + info["id"])

    # ── 1. Nic nie stoi W BUDYNKU ───────────────────────────────────────
    # Sciana to lita bryla (patrz `kafle_domu`), wiec punkt na niej to
    # rekwizyt/zwierze/NPC wtopione w mur.
    zle = []
    for _l, n, x, y in obs:
        if n in SLUZBOWE or n in PTAKI or n in WOLNO_NA_BUDYNKU or not n:
            continue
        tx, ty = int(x // T), int(y // T)
        if bud and kafel(bud, szer, tx, ty, wys):
            zle.append((n, tx, ty))
    if zle:
        for n, tx, ty in zle:
            r.blad("'%s' stoi NA scianie budynku, kafel (%d,%d)" % (n, tx, ty))
    else:
        r.ok("nic nie stoi na scianie budynku")

    # ── 2. Nic nie stoi w PROGU ─────────────────────────────────────────
    # Realna wpadka: lawka Sobka dokladnie na kolumnie drzwi. Sprawdzamy
    # kafel pod obiektem i jeden nad nim (drzwi rysuja sie w gornym kaflu,
    # a stoi sie pod nimi).
    zle = []
    for _l, n, x, y in obs:
        # Tylko meble i zwierzeta — NPC u siebie na progu jest poprawny,
        # patrz komentarz przy WOLNO_NA_BUDYNKU.
        if n not in REKWIZYTY and n not in ZWIERZETA:
            continue
        tx, ty = int(x // T), int(y // T)
        for dy in (0, -1):
            if det and kafel(det, szer, tx, ty + dy, wys) in drzwi_gid:
                zle.append((n, tx, ty))
                break
    if zle:
        for n, tx, ty in zle:
            r.blad("'%s' blokuje PROG (kafel drzwi), kafel (%d,%d)" % (n, tx, ty))
    else:
        r.ok("zaden rekwizyt/zwierze nie blokuje progu")

    # ── 3. Rekwizyty i zwierzeta nie stoja na pniu drzewa ───────────────
    # Ptaki wylaczone celowo — ptak w koronie to cecha, nie blad.
    zle = []
    for _l, n, x, y in obs:
        if n not in REKWIZYTY and n not in ZWIERZETA:
            continue
        tx, ty = int(x // T), int(y // T)
        if drzewa and kafel(drzewa, szer, tx, ty, wys):
            zle.append((n, tx, ty))
    if zle:
        for n, tx, ty in zle:
            r.blad("'%s' stoi na PNIU drzewa, kafel (%d,%d)" % (n, tx, ty))
    else:
        r.ok("zaden rekwizyt/zwierze nie stoi na pniu")

    # ── 4. Rekwizyty nie stoja na drodze przelotowej ────────────────────
    # Realna wpadka: studnia na osi drogi x50-51. To UWAGA, nie blad —
    # ognisko czy kamien przy trakcie bywaja zamierzone.
    na_drodze = []
    for _l, n, x, y in obs:
        if n not in REKWIZYTY:
            continue
        tx, ty = int(x // T), int(y // T)
        if droga and kafel(droga, szer, tx, ty, wys):
            na_drodze.append((n, tx, ty))
    if na_drodze:
        for n, tx, ty in na_drodze:
            r.uwaga("'%s' stoi NA drodze, kafel (%d,%d) — zamierzone?" % (n, tx, ty))
    else:
        r.ok("zaden rekwizyt nie stoi na drodze")

    # ── 5. Zasiegi interakcji NPC nie zachodza na siebie ────────────────
    # `core/Interactables.ts`: wygrywa NAJBLIZSZY, wiec dwa NPC-e w zasiegu
    # naraz nie wysypia gry — ale prompt przeskakuje przy kroku w bok, co
    # jest dokladnie tym, czego regula O1 z wioska_plan.md zabrania.
    npce = [(n, x, y) for _l, n, x, y in obs if n in NPC]
    naj = None
    for i in range(len(npce)):
        for j in range(i + 1, len(npce)):
            d = math.hypot(npce[i][1] - npce[j][1], npce[i][2] - npce[j][2])
            if naj is None or d < naj[0]:
                naj = (d, npce[i][0], npce[j][0])
    if naj is None:
        r.ok("brak NPC-ow do sprawdzenia")
    elif naj[0] < MIN_NPC_NPC:
        r.blad("NPC '%s' i '%s' tylko %.0f px od siebie (min %d = 2x%d zasiegu)"
               % (naj[1], naj[2], naj[0], MIN_NPC_NPC, ZASIEG_NPC))
    else:
        r.ok("najblizsza para NPC: %s-%s %.0f px (min %d)"
             % (naj[1], naj[2], naj[0], MIN_NPC_NPC))

    # ── 6. Kompozyty kafelkowe sa kompletne ─────────────────────────────
    # Realna wpadka: `stog_0` sam, bo rodzina ma 4 kafle.
    if fg_b is not None:
        for rodzina, (czlony, opis) in KOMPOZYTY.items():
            gidy = {fg_b + kat[c]["id"]: c for c in czlony if c in kat}
            if not gidy:
                continue
            zliczone = defaultdict(int)
            for warstwa in (bud, det):
                for v in warstwa or []:
                    if v in gidy:
                        zliczone[gidy[v]] += 1
            uzyte = {c: zliczone.get(c, 0) for c in czlony}
            if not any(uzyte.values()):
                continue  # nie ma go na tej mapie — to nie blad
            if len(set(uzyte.values())) != 1:
                r.blad("NIEKOMPLETNY kompozyt '%s' (%s): %s"
                       % (rodzina, opis,
                          ", ".join("%s x%d" % kv for kv in uzyte.items())))
            else:
                r.ok("kompozyt '%s' kompletny (%d szt.)"
                     % (rodzina, list(uzyte.values())[0]))

    # ── 7. Nazwy, ktorych ten skrypt nie zna ────────────────────────────
    # Nie blad — sygnal, ze `TiledMap.ts` poznal cos nowego, a ta lista nie.
    znane = (NPC | REKWIZYTY | ZWIERZETA | PTAKI | WROGOWIE | ZIOLA | SLUZBOWE)
    obce = sorted({n for _l, n, _x, _y in obs if n and n not in znane})
    if obce:
        r.uwaga("nazwy nieznane temu skryptowi (dopisz do list u gory): %s"
                % ", ".join(obce))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mapa", choices=sorted(MAPY), help="tylko jedna mapa")
    ap.add_argument("--cicho", action="store_true", help="wypisuj tylko bledy")
    a = ap.parse_args()

    r = Raport(a.cicho)
    for klucz in ([a.mapa] if a.mapa else sorted(MAPY)):
        audyt(klucz, r)

    print("\n%s" % ("ZNALEZIONO %d BLEDOW" % r.bledy if r.bledy else "czysto"))
    return 1 if r.bledy else 0


if __name__ == "__main__":
    sys.exit(main())

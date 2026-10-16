"""Warianty sylwetki z JEDNEJ bazy: płeć × wiek × budowa (2026-10-10).

⭐ Jedna baza (`char3d_base.PROPORCJE`, dziś hybryda V4.5) i trzy NIEZALEŻNE
osie, każda jako DELTA do bazy. Mieszkaniec (`npc3d.PRESETY`) i — docelowo —
kreator gracza (`docs/kreator_postaci.md`, OI-166) wybierają po jednej wartości
z każdej osi; drobne cechy osobnicze dopisuje się jako `dodatki`.

Dlaczego delty, a nie pełne słowniki per postać: do V4.5 Ojciec i Mama nieśli
po ~30 kluczy wpisanych wprost. Gdy baza zmieniła proporcje (V4 → V4.5), oba
presety ZOSTAŁY na starej bazie — po cichu, bo nic ich ze sobą nie wiązało.
Delta jedzie z bazą: poprawka bazy poprawia wszystkich naraz.

⚠ Osie SUMUJĄ się (kobieta + stara + tęga = trzy delty dodane). Wartości są
małe celowo — kombinacja skrajna ma dalej być człowiekiem, nie karykaturą.
Sprawdza to `sprawdz()` (granice fizyczne) — uruchom ten plik wprost.

⚠ Osie NIE ruszają `glow` ani kotwic głowy (`czaszka`, `obojczyk` tylko
drobnie): wielkość głowy to decyzja CZYTELNOŚCI całej obsady (V4.5), nie cecha
osobnika. Mały gracz z dużą głową obok wielkich NPC-ów z małymi czytałby się
jak dwie różne gry.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import char3d_base as _baza  # noqa: E402

OSIE = {
    # Różnica wzięta z dopracowanych pilotów (Mama − Ojciec, 2026-10-09),
    # z dłonią przeliczoną pod większą dłoń hybrydy.
    "plec": {
        # ⚠ Baza ma talię 0,100 przy biodrach 0,110 — to KLEPSYDRA (autor,
        #   2026-10-10: „sylwetka u mężczyzn jak klepsydra"). Męska talia jest
        #   prawie tak szeroka jak biodra: sylwetka V / prostokąt.
        "m": {"talia_polszer": +0.010, "talia_glebokosc": +0.004, "biodro_polszer": -0.004},
        "k": {"klatka_polszer": -0.016, "klatka_glebokosc": -0.003, "talia_polszer": -0.006,
              "biodro_polszer": +0.012, "biodro_glebokosc": +0.005, "szyja_promien": -0.008,
              "ramie_promien": -0.010, "lokiec_promien": -0.006, "nadgarstek_promien": -0.005,
              "dlon_szerokosc": -0.014, "dlon_grubosc": -0.007,
              "udo_promien": +0.002, "kolano_promien": -0.001, "lydka_promien": -0.003,
              "kostka_promien": -0.002, "biust": +0.024, "kaptury": +0.25,
              # wyżej talia i krocze: dłuższe nogi względem tułowia
              "krocze": +0.006, "biodro": +0.006, "talia": +0.010},
    },
    "wiek": {
        "mlody": {"klatka_polszer": -0.006, "klatka_glebokosc": -0.003, "talia_polszer": -0.004,
                  "ramie_promien": -0.004, "udo_promien": -0.004, "szyja_promien": -0.003},
        "dorosly": {},
        # opadające barki, brzuch, cieńsze kończyny (zanik mięśni)
        "stary": {"talia_polszer": +0.008, "talia_glebokosc": +0.010, "klatka_glebokosc": +0.004,
                  "ramie_promien": -0.006, "udo_promien": -0.006, "lydka_promien": -0.005,
                  "bark": -0.006, "obojczyk": -0.004, "kaptury": -0.10},
    },
    "budowa": {
        # ⚠ Delty z pierwszej wersji (±0,01) były NIEWIDOCZNE z kamery — autor:
        #   „nie ma różnic gruby, szczupły, umięśniony". Liczby podwojone i więcej.
        "szczupla": {"klatka_polszer": -0.022, "klatka_glebokosc": -0.012, "talia_polszer": -0.020,
                     "talia_glebokosc": -0.014, "biodro_polszer": -0.014, "ramie_promien": -0.014,
                     "lokiec_promien": -0.008, "nadgarstek_promien": -0.004, "udo_promien": -0.018,
                     "kolano_promien": -0.006, "lydka_promien": -0.012, "szyja_promien": -0.008,
                     "bark_polrozstaw": -0.008},
        "srednia": {},
        # krępa = praca fizyczna (kowal, rolnik): klatka, ramiona, kark, dłonie
        # ⭐ atletyczna = TRÓJKĄT V z kamery z góry (wojownik, weteran, zawodnik
        #   MMA — Patryczek: 180 cm / 80 kg). Szerokie barki i klatka, płaska
        #   talia. ⚠ Z umiarem — „Pudzian" (ramię +48%) został odrzucony.
        "atletyczna": {"klatka_polszer": +0.014, "klatka_glebokosc": +0.008, "bark_polrozstaw": +0.008,
                       "ramie_promien": +0.006, "lokiec_promien": +0.002, "udo_promien": +0.005,
                       "lydka_promien": +0.003, "szyja_promien": +0.004,
                       "talia_polszer": -0.006, "talia_glebokosc": -0.006, "kaptury": +0.12},
        # ⚠ krępa = GRUBY WSZĘDZIE (rolnik, kowal), NIE klin kulturysty. Wersja
        #   z klatką +0,024 / ramieniem +0,016 / barkami +0,012 dała razem ze
        #   stylem i dodatkami ramię Kowala ~48% grubsze od bazy — autor:
        #   „Kowal i Patryczek to dalej Pudziany".
        "krepa": {"klatka_polszer": +0.012, "klatka_glebokosc": +0.012, "talia_polszer": +0.014,
                  "talia_glebokosc": +0.010, "ramie_promien": +0.006, "lokiec_promien": +0.004,
                  "nadgarstek_promien": +0.003, "dlon_szerokosc": +0.008, "dlon_grubosc": +0.004,
                  "udo_promien": +0.008, "lydka_promien": +0.006, "szyja_promien": +0.008,
                  "bark_polrozstaw": +0.004, "kaptury": +0.12},
        # tęga = brzuch i biodra, nie mięśnie (karczmarz)
        "tega": {"klatka_polszer": +0.022, "klatka_glebokosc": +0.026, "talia_polszer": +0.048,
                 "talia_glebokosc": +0.060, "biodro_polszer": +0.024, "biodro_glebokosc": +0.022,
                 "ramie_promien": +0.012, "lokiec_promien": +0.004, "udo_promien": +0.018,
                 "lydka_promien": +0.010, "szyja_promien": +0.014},
    },
}

# ⭐⭐ STYL (2026-10-10, autor: mieszkańcy 3D „patyczaki bez wyrazu, każdy taki
# sam" — największa regresja względem pixel-artu). NPC 2D mają 3,0–3,9 głowy,
# grube kończyny i wielkie dłonie, i to one wygrywały czytelność. `czytelny` to
# PRZERYSOWANIE pod kamerę z góry i ~140 px postaci: głowa ~3,9 (UNIESIONA nad
# wzrost bazy, żeby nie skracać tułowia — ta sama droga co V3.7), kończyny,
# dłonie i stopy grubsze, barki szersze.
# ⚠ To jedyna oś, której WOLNO ruszyć `glow`: wielkość głowy jest decyzją
#   czytelności CAŁEJ obsady, więc idzie stylem, nigdy osobnikiem.
STYL = {
    # ⭐ Od BAZY V5 (2026-10-10) styl czytelny JEST bazą — `czytelny` to zero,
    #   `bazowy` odtwarza bryłę sprzed V5 (do porównań i ewentualnego powrotu).
    "bazowy": {"glow": +0.900, "glowa_uniesienie": -0.046, "czaszka": -0.002, "ramie_promien": -0.005, "lokiec_promien": -0.004, "nadgarstek_promien": -0.003, "dlon_szerokosc": -0.014, "dlon_grubosc": -0.016, "dlon": +0.014, "udo_promien": -0.008, "kolano_promien": -0.006, "lydka_promien": -0.007, "kostka_promien": -0.004, "stopa_dlugosc": -0.016, "stopa_szerokosc": -0.012, "klatka_polszer": -0.008, "bark_polrozstaw": -0.008, "szyja_promien": -0.004, "rozpietosc": -0.100},
    # rozpiętość: gracz 1,10 (nosi broń), mieszkańcy 1,17 — reszta stylu = baza
    "czytelny": {"rozpietosc": +0.07},
}


# Postawa stania (`npc3d.zbuduj_stanie`) — wiek ją zmienia, preset może dopisać.
POSTAWA = {"mlody": dict(garb=0.0, glowa=0.0, oddech=1.2),
           "dorosly": dict(garb=2.0, glowa=-2.0, oddech=1.2),
           "stary": dict(garb=9.0, glowa=-6.0, oddech=1.5)}


def proporcje(plec="m", wiek="dorosly", budowa="srednia", dodatki=None, styl="czytelny"):
    """Słownik NADPISAŃ dla `char3d_base.zbuduj()`: baza + delty osi + dodatki.

    `dodatki` to delty osobnicze (np. {"klatka_polszer": +0.004}), też
    DODAWANE do bazy — nigdy wartości bezwzględne.
    """
    wynik = {}
    for os_, wartosc in (("plec", plec), ("wiek", wiek), ("budowa", budowa)):
        if wartosc not in OSIE[os_]:
            raise SystemExit(f"BŁĄD: oś „{os_}” nie zna wartości „{wartosc}” (są: {sorted(OSIE[os_])})")
        for k, d in OSIE[os_][wartosc].items():
            wynik[k] = wynik.get(k, 0.0) + d
    for k, d in STYL[styl].items():
        wynik[k] = wynik.get(k, 0.0) + d
    for k, d in (dodatki or {}).items():
        wynik[k] = wynik.get(k, 0.0) + d
    for k in wynik:
        if k not in _baza.PROPORCJE:
            raise SystemExit(f"BŁĄD: delta „{k}” nie ma klucza w char3d_base.PROPORCJE")
    return {k: _baza.PROPORCJE[k] + d for k, d in wynik.items()}


def postawa(wiek="dorosly", dodatki=None):
    p = dict(POSTAWA[wiek])
    for k, d in (dodatki or {}).items():
        p[k] = p.get(k, 0.0) + d
    return p


def sprawdz():
    """Każda kombinacja osi ma dać człowieka: kolejność kotwic pionu zachowana,
    promienie dodatnie, kończyny zwężają się ku dłoni i stopie. Zwraca błędy."""
    bledy = []
    pion = ("kostka", "kolano", "krocze", "biodro", "talia", "klatka", "bark", "obojczyk", "czaszka")
    for st in STYL:
        for pl in OSIE["plec"]:
            for wi in OSIE["wiek"]:
                for bu in OSIE["budowa"]:
                    P = dict(_baza.PROPORCJE)
                    P.update(proporcje(pl, wi, bu, styl=st))
                    nazwa = f"{st}/{pl}/{wi}/{bu}"
                    # podbródek nad obojczykiem — inaczej głowa siedzi w klatce
                    broda = 1.0 + P["glowa_uniesienie"] - 1.0 / P["glow"]
                    if broda <= P["obojczyk"] + 0.01:
                        bledy.append(f"{nazwa}: podbródek {broda:.3f} nie nad obojczykiem {P['obojczyk']:.3f}")
                    # ZASIĘG RĘKI: palce opuszczonej, prostej ręki kończą się
                    # na UDZIE — poniżej krocza, ale nie przy kolanie
                    palce = P["bark"] - (0.5 * P["rozpietosc"] - P["bark_polrozstaw"])
                    if not (P["kolano"] + 0.04 <= palce <= P["krocze"] - 0.015):
                        bledy.append(f"{nazwa}: palce na {palce:.3f} — poza udem "
                                     f"(kolano {P['kolano']:.3f}, krocze {P['krocze']:.3f})")
                    for a, b in zip(pion, pion[1:]):
                        if P[a] >= P[b]:
                            bledy.append(f"{nazwa}: kotwica {a} ({P[a]:.3f}) nie leży niżej niż {b} ({P[b]:.3f})")
                    for k, v in P.items():
                        if (k.endswith("_promien") or k.endswith("_polszer") or k.endswith("_glebokosc")) and v <= 0:
                            bledy.append(f"{nazwa}: {k} = {v:.3f} ≤ 0")
                    for a, b in (("ramie_promien", "lokiec_promien"), ("lokiec_promien", "nadgarstek_promien"),
                                 ("udo_promien", "kolano_promien"), ("lydka_promien", "kostka_promien")):
                        if P[a] <= P[b]:
                            bledy.append(f"{nazwa}: {a} ({P[a]:.3f}) nie większe od {b} ({P[b]:.3f})")
                    if P["talia_polszer"] > P["klatka_polszer"] + 0.03:
                        bledy.append(f"{nazwa}: talia szersza od klatki o > 0,02 (beczka)")
    return bledy


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    b = sprawdz()
    n = len(STYL) * len(OSIE["plec"]) * len(OSIE["wiek"]) * len(OSIE["budowa"])
    for x in b:
        print("BŁĄD:", x)
    print(f"{n} kombinacji, błędów: {len(b)}")
    sys.exit(1 if b else 0)
